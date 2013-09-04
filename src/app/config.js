var PATH	= require('path');
var FS		= require('fs');
var Class 	= require('js-class');
var Config  = Class({
	constructor : function () {
		this.locks = {};

		this.GOOFY_PORT 		 = process.env.GOOFY_PORT || 2987
		this.GOOFY_BIND 		 = process.env.GOOFY_BIND || '0.0.0.0'
		this.GOOFY_RUNNING_DIR 	 = process.cwd();
		this.GOOFY_INSTALL_DIR   = PATH.resolve(__dirname,'../../');
		this.GOOFY_HOME_DIR		 = process.env.GOOFY_HOME_DIR || PATH.resolve(process.env.HOME,'.goofy');

		this.GOOFY_MODULES_DIR 	 = PATH.resolve(this.GOOFY_HOME_DIR,'node_modules');
		this.GOOFY_PACKAGES_DIR  = PATH.resolve(this.GOOFY_HOME_DIR,'node_packages');

		this.GOOFY_SETTINGS_FILE = PATH.resolve(this.GOOFY_INSTALL_DIR,'package.json');

		this.GOOFY_NEXUS_URL	 = process.env.GOOFY_NEXUS_URL  || 'http://maven.byus.com';
		this.GOOFY_NEXUS_USER	 = process.env.GOOFY_NEXUS_USER || 'admin';
		this.GOOFY_NEXUS_PASS	 = process.env.GOOFY_NEXUS_PASS || 'admin123';

		var settings = JSON.parse(FS.readFileSync(this.GOOFY_SETTINGS_FILE,'utf8'));

		this.GOOFY_VERSION		= settings.version;

		if(!FS.existsSync(this.GOOFY_HOME_DIR)){
			FS.mkdirSync(this.GOOFY_HOME_DIR);
		}
		if(!FS.existsSync(this.GOOFY_MODULES_DIR)){
			FS.mkdirSync(this.GOOFY_MODULES_DIR);
		}
		if(!FS.existsSync(this.GOOFY_PACKAGES_DIR)){
			FS.mkdirSync(this.GOOFY_PACKAGES_DIR);
		}

		process.chdir(this.GOOFY_HOME_DIR);
	},
	resolvePackagePath:function(name){
		return PATH.resolve(this.GOOFY_PACKAGES_DIR,name)
	},
	resolvePackageJsonPath:function(name){
		return PATH.resolve(this.GOOFY_MODULES_DIR,name+'/package.json')
	},
	resolveAppFile:function(app,file){
		return PATH.resolve(this.GOOFY_MODULES_DIR,app+'/'+file);
	},
	getAppCwd:function(name){
		return PATH.resolve(this.GOOFY_MODULES_DIR,name);
	},
	lockApp : function(name){
		console.info("locked "+name);
		this.locks[name] = true;
	},
	unlockApp : function(name){
		console.info("unlocked "+name);
		this.locks[name] = false;
	},
	loadAppSettings : function(name){
		if(!this.locks[name]){
			return JSON.parse(
				FS.readFileSync( this.resolvePackageJsonPath(name),'utf8')
			)
		}else{
			console.info("app is locked"+name);
			throw new Error('app is locked');
		}
	},

	saveAppSettings : function(json){
		if(!this.locks[json.name]){
			FS.writeFileSync(
				this.resolvePackageJsonPath(json.name),
				JSON.stringify(json,null,2),{
					encoding:'utf8'
				}
			);
		}else{
			console.info("app is locked"+name);
			throw new Error('app is locked');
		}
	},
	loadApps:function(){
		var apps = {};
		FS.readdirSync(this.GOOFY_MODULES_DIR).forEach(function(e){
			if(e.charAt(0)!='.'){
				try{
					var app = this.loadAppSettings(e);
					if(app.goofy){
						apps[app.name] = app;
					}
				}catch(err){
					console.info(err);
				}
			}else{
				return false;
			}
		}.bind(this));
		return apps;
	}
});

module.exports = global.CONFIG || (global.CONFIG = new Config());