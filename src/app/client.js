var FS 		 = require('fs');
var Class 	 = require('js-class');
var Rest  	 = require('./rest');
var Utils    = require('./utils');
var CONFIG	 = require('./config');
var App		 = require('./app');

var Request	 = Class(Rest.Request,{
	constructor	: function(params){
		Rest.Request.prototype.constructor.call(this,params);
	},
	after		: function(result){
		if(result.status!='error'){
			return result;
		}else{
			var error = new Error("Request failed");
			if(typeof(result.result)=='object'){
				for(var i in result.result){
					error[i] = result.result[i];
				}
			}else{
				error.result = result.result
			}
			throw error;
		}
	}
});

var Requests = {
	Info		: Class(Request,{
		constructor	: function(){
			Request.prototype.constructor.call(this,{
				id		: 'info',
				method	: "GET",
				path	: "/info"
			});
		}
	}),
	Status		: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'status',
				method	: "GET",
				path	: "/status",
				query   : params
			});
		}
	}),
	Start		: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'start',
				method	: "GET",
				path	: "/start",
				query   : params
			});
		}
	}),
	Stop		: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'stop',
				method	: "GET",
				path	: "/stop",
				query   : params
			});
		}
	}),
	Log		: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'log',
				method	: "GET",
				path	: "/log",
				query   : params
			});
		}
	}),
	Terminate		: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'terminate',
				method	: "GET",
				path	: "/terminate"
			});
		}
	}),
	Install		: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'install',
				method	: "GET",
				path	: "/install",
				query	: params
			});
		}
	}),
	Uninstall	: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'uninstall',
				method	: "GET",
				path	: "/uninstall",
				query	: params
			});
		}
	}),
	Search	: Class(Request,{
		constructor	: function(params){
			Request.prototype.constructor.call(this,{
				id		: 'uninstall',
				method	: "GET",
				path	: "/search",
				query	: params
			});
		}
	})
};

var Service = Class(Rest.Service,{
	constructor : function (data) {
		Rest.Service.prototype.constructor.call(this,{
			debug	: true,
			base 	: 'http://localhost:'+CONFIG.GOOFY_PORT+'',
			headers : {
				'Accept'		: 'application/json',
				'Content-Type'	: 'application/json'
			}
		});
	},
	info		: function(params){
		return this.request(new Requests.Info(params));
	},
	status		: function(params){
		return this.request(new Requests.Status(params));
	},
	start		: function(params){
		return this.request(new Requests.Start(params));
	},
	stop		: function(params){
		return this.request(new Requests.Stop(params));
	},
	log		: function(params){
		return this.request(new Requests.Log(params));
	},
	terminate		: function(params){
		return this.request(new Requests.Terminate(params));
	},
	install		: function(params){
		return this.request(new Requests.Install(params));
	},
	uninstall	: function(params){
		return this.request(new Requests.Uninstall(params));
	},
	search		: function(params){
		return this.request(new Requests.Search(params));
	}
},{
	statics: {
		get instance()  {
			if (!Service.$) {
				Service.$ = new Service();
			}
			return Service.$;
		},
		info  		: function(params){
			return Service.instance.info(params);
		},
		terminate	: function(params){
			return Service.instance.terminate(params);
		},
		status		: function(params){
			return Service.instance.status(params);
		},
		stop		: function(params){
			return Service.instance.stop(params);
		},
		log		: function(params){
			return Service.instance.log(params);
		},
		start		: function(params){
			return Service.instance.start(params);
		},
		install		: function(params){
			return Service.instance.install(params);
		},
		uninstall	: function(params){
			return Service.instance.uninstall(params);
		},
		search	: function(params){
			return Service.instance.search(params);
		}
	}
});

module.exports	= Service;