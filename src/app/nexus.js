var FS 		 = require('fs');
var Class 	 = require('js-class');
var Rest  	 = require('./rest');
var Utils    = require('./utils');
var CONFIG	 = require('./config');
var App		 = require('./app');

var Requests = {
	GetReposItems		: Class(Rest.Request,{
		constructor	: function(){
			Rest.Request.prototype.constructor.call(this,{
				id		: 'repoItems',
				method	: "GET",
				path	: "/repositories"
			});
		},
		finalize		: function(batch,result){
			if(result instanceof Error){
				throw result;
			}else{
				return batch.context[this.id] = result;
			}
		}
	}),
	GetReposGroups		: Class(Rest.Request,{
		constructor	: function(){
			Rest.Request.prototype.constructor.call(this,{
				id		: 'repoGroups',
				method	: "GET",
				path	: "/repo_groups"
			});
		},
		finalize		: function(batch,result){
			if(result instanceof Error){
				throw result;
			}else{
				return batch.context[this.id] = result;
			}
		}
	}),
	ResolveArtifact		: Class(Rest.Request,{
		constructor	: function(params){
			Rest.Request.prototype.constructor.call(this,{
				id		: 'artifact',
				method	: "GET",
				path	: "/artifact/maven/resolve",
				query	: Utils.patch(params,{
					v   : params.r || 'LATEST',
					r	: params.v || 'public',
					c	: 'npm',
					e	: 'tar.gz'
				})
			});
		},
		finalize		: function(batch,result){
			if(result instanceof Error){
				throw result;
			}else{
				return batch.context[this.id] = result;
			}
		}
	}),
	SearchArtifact		: Class(Rest.Request,{
		constructor	: function(params){
			if(params.a && params.a!='' && params.a.indexOf('*')<0){
				params.a = params.a+'*';
			}
			if(params.g && params.g!='' && params.g.indexOf('*')<0){
				params.g = params.g+'*';
			}
			Rest.Request.prototype.constructor.call(this,{
				id		: "search",
				method	: "GET",
				path	: "/lucene/search",
				query	: Utils.patch(params,{
					c		: 'npm',
					count	: params.count<100?params.count:100
				})
			});
		},
		finalize		: function(batch,result){
			if(result instanceof Error){
				throw result;
			}else{
				return batch.context[this.id] = result;
			}
		}
	}),
	DownloadArtifact	: Class(Rest.Request,{
		constructor		: function(params){
			Rest.Request.prototype.constructor.call(this,{
				id		: 'download'
			});
		},
		initialize		: function(batch){
			if(batch.context.app instanceof Error){
				throw batch.context.app;
			}else
			if(batch.context.app){
				this.url = batch.context.app.url;
			}
		},
		finalize		: function(batch,result){
			if(result instanceof Error){
				throw result;
			}else
			if(batch.context.app){
				var parts 	 = this.params.path.split('/');
				var filename = CONFIG.resolvePackagePath(parts[parts.length-1]);
				if(Utils.sha1(result)!=batch.context.app.sha1){
					throw new Error("file corrupted "+this.url);
				}
				FS.writeFileSync(filename,result,{
					encoding: 'binary'
				});
				FS.writeFileSync(filename+'.info',
					JSON.stringify(batch.context.app,null,2),{
						encoding: 'utf8'
					}
				);
				var data = {
					info : batch.context.app,
					file : filename
				}
				return batch.context[this.id] =  data;
			}
		}
	}),
	// Batch requests
	Repositories		: Class(Rest.Batch,{
		constructor	: function(){
			Rest.Batch.prototype.constructor.call(this,{
				id		: 'repositories',
				tasks	: [
					new Requests.GetReposItems,
					new Requests.GetReposGroups
				]
			});
		},
		before	: function(){
			if(Requests.Repositories.$){
				return Requests.Repositories.$;
			}
		},
		after	: function(status,result){
			if(status == 'succeed'){
				var REPOSITORIES = {};
				var repoItems    = result.repoItems.data;
				var repoGroups   = result.repoGroups.data;
				for(var i in repoItems){
					var repo = Utils.patch( repoItems[i],{
						type : 'repository'
					});
					REPOSITORIES[repo.id] = {
						id		 : repo.id,
						name	 : repo.name,
						resource : repo.resourceURI,
						content  : repo.contentResourceURI
					}
				}
				for(var i in repoGroups){
					var repo = Utils.patch( repoGroups[i],{
						type : 'group'
					});
					REPOSITORIES[repo.id] = {
						id		 : repo.id,
						name	 : repo.name,
						resource : repo.resourceURI,
						content  : repo.contentResourceURI
					}
				}
				return Requests.Repositories.$ = REPOSITORIES;
			}else{
				return result;
			}
		}
	}),
	Resolve				: Class(Rest.Batch,{
		constructor	: function(params){
			Rest.Batch.prototype.constructor.call(this,{
				id		: 'app',
				tasks	: [
					new Requests.Repositories(params),
					new Requests.ResolveArtifact(params)
				]
			});
		},
		after	: function(status,result){
			if(status == 'succeed'){
				var repositories 	= result.repositories;
				var artifact 		= result.artifact.data;
				var repoBase		= repositories[this.params.r || 'public'].content;
				return				{
					name	 		: artifact.artifactId,
					group	 		: artifact.groupId,
					version  		: artifact.baseVersion,
					snapshot 		: artifact.snapshot?{
						version		: artifact.version,
						build 		: artifact.snapshotBuildNumber,
						time 		: artifact.snapshotTimeStamp
					}:false,
					sha1	 		: artifact.sha1,
					url		 		: repoBase+artifact.repositoryPath
				};
			}else{
				return result;
			}
		}
	}),
	Search				: Class(Rest.Batch,{
		constructor	: function(params){
			Rest.Batch.prototype.constructor.call(this,{
				id		: 'app',
				tasks	: [
					new Requests.Repositories(params),
					new Requests.SearchArtifact(params)
				]
			});
		},
		after	: function(status,result){
			if(status == 'succeed'){
				var repositories 	= result.repositories;
				var artifacts 		= result.search.data;
				for(var i in artifacts){
					var art = artifacts[i];
					artifacts[i] = {
						name	 		: art.artifactId,
						group	 		: art.groupId,
						version  		: art.version,
						release			: art.latestRelease ? {
							current		: art.latestRelease == art.version,
							repository  : art.latestReleaseRepositoryId,
							version		: art.latestRelease
						}:false,
						snapshot		: art.latestSnapshot ? {
							current		: art.latestSnapshot == art.version,
							repository  : art.latestSnapshotRepositoryId,
							version		: art.latestSnapshot
						}:false
					}
				}
				return artifacts;
			}else{
				return result;
			}
		}
	}),
	Download				: Class(Rest.Batch,{
		constructor	: function(params){
			Rest.Batch.prototype.constructor.call(this,{
				id		: 'file',
				tasks	: [
					new Requests.Resolve(params),
					new Requests.DownloadArtifact(params)
				]
			});
		},
		after	: function(status,result){
			if(status == 'succeed'){
				return result.download;
			}else{
				return result;
			}
		}
	})
};

var Service = Class(Rest.Service,{
	constructor : function (data) {
		Rest.Service.prototype.constructor.call(this,{
			debug	: true,
			base 	: CONFIG.GOOFY_NEXUS_URL+'/service/local',
			headers : {
				'Authorization'	: 'Basic '+Utils.base64Encode(
					CONFIG.GOOFY_NEXUS_USER+':'+CONFIG.GOOFY_NEXUS_PASS
				),
				'Accept'		: 'application/json',
				'Content-Type'	: 'application/json'
			}
		});
		this.$.REPOSITORIES = null
	},
	repositories	: function(){
		return this.batch(new Requests.Repositories);
	},
	resolve 		: function(params){
		return this.batch(new Requests.Resolve(params));
	},
	download 		: function(params){
		return this.batch(new Requests.Download(params));
	},
	search  		: function(params){
		return this.batch(new Requests.Search(params));
	}
},{
	statics: {
		get instance()  {
			if (!Service.$) {
				Service.$ = new Service();
			}
			return Service.$;
		},
		repositories	: function(){
			return Service.instance.repositories();
		},
		resolve 		: function(params){
			return Service.instance.resolve(params);
		},
		download  		: function(params){
			return Service.instance.download(params);
		},
		search  		: function(params){
			return Service.instance.search(params);
		}
	}
});

module.exports	= Service;