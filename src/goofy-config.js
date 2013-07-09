var FS 			 = require('fs');
var PATH 		 = require('path');
var CONF_FILE    = '/etc/goofy.conf';
var CONF_DEFAULT = {
	port : 2987,
	bind : '0.0.0.0',
	data : "/var/goofy",
	apps : []
};



function Config(){
	this.init = function(){
		this.crd = process.cwd();
		process.chdir(PATH.resolve(__dirname,'../'));
		process.settings = JSON.parse(FS.readFileSync('package.json','utf8'));

		if(!FS.existsSync(CONF_FILE)){
			FS.writeFileSync(
				CONF_FILE, JSON.stringify(CONF_DEFAULT, null, "  ")
			);
			if(!FS.existsSync(CONF_DEFAULT.data)){
				FS.mkdirSync(CONF_DEFAULT.data);
				FS.mkdirSync(CONF_DEFAULT.data+'/logs');
			}
		}
	}

	this.settings = function(){
		return process.settings;
	}

	this.load = function(){
		if(!this.data){
			this.init();
			this.data = JSON.parse(FS.readFileSync(CONF_FILE, "utf8"));	
		}
		return this.data;
	}

	this.port = function(){
		return this.load().port;
	}
	this.host = function(){
		return this.load().host;
	}
	this.apps = function(){
		return this.load().apps;
	}
}

module.exports = new Config();