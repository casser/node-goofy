var FS 			 = require('fs');
var PATH 		 = require('path');

function Config(){

	this.GOOFY_PORT 		 = process.env.GOOFY_PORT || 2987
	this.GOOFY_BIND 		 = process.env.GOOFY_BIND || '0.0.0.0'
	this.GOOFY_RUNNING_DIR 	 = process.cwd();
	this.GOOFY_INSTALL_DIR   = PATH.resolve(__dirname,'../');
	this.GOOFY_HOME_DIR		 = process.env.GOOFY_HOME_DIR || PATH.resolve(process.env.HOME,'.goofy');

	this.GOOFY_MODULES_DIR 	 = PATH.resolve(this.GOOFY_HOME_DIR,'node_modules');
	this.GOOFY_PACKAGES_DIR  = PATH.resolve(this.GOOFY_HOME_DIR,'node_packages');

	this.GOOFY_SETTINGS_FILE = PATH.resolve(this.GOOFY_INSTALL_DIR,'package.json');

	this.GOOFY_MVN_URL		 = process.env.GOOFY_MVN_URL  || 'http://maven.byus.com/content/groups/public/';
	this.GOOFY_MVN_USER		 = process.env.GOOFY_MVN_USER || 'admin';
	this.GOOFY_MVN_PASS		 = process.env.GOOFY_MVN_PASS || 'admin123';

	this.GOOFY_NPM_URL		 = 'http://registry.npmjs.org/';


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
}

module.exports = new Config();