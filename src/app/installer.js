var NPM 		= require('npm');
var FS			= require('fs');
var Class 		= require('js-class');
var Emiter		= require('./emmiter');
var Nexus  		= require('./nexus');
var App			= require('./app');
var Utils  		= require('./utils');
var CONFIG		= require('./config');

var Installer = module.exports = Class({
	constructor : function () {

	},
	install		: function(params){
		var result =  new Emiter();
		Nexus.download(params)
		.on('succeed',function(response){
			NPM.load(null, function (er) {
				if (er) {
					result.emit('failed',er)
				} else {
					CONFIG.lockApp(response.info.name);
					NPM.commands.install([response.file],function(err){
						CONFIG.unlockApp(response.info.name);
						if(err){
							result.emit('failed',err)
						}else{
							console.info("install complete file:"+response.info.name);

							var json = Utils.patch(
								CONFIG.loadAppSettings(response.info.name),
								response.info
							);
							try{
								console.info(json);
								CONFIG.saveAppSettings(json);
								var app = new App(json);
								result.emit('succeed',app);
							}catch(err){
								console.info(err);
								result.emit('failed',err);
							}
						}
					})
				}
			});
		})
		.on('failed',function(error){
			result.emit('failed',error)
		})
		return result;
	},
	uninstall		: function(params){
		var result =  new Emiter();
		NPM.load(null, function (er) {
			if (er) {
				result.emit('failed',er)
			} else {
				NPM.commands.uninstall(params.a,function(err){
					if(err){
						result.emit('failed',err)
					}else{
						result.emit('succeed',true);
					}
				})
			}
		});
		return result;
	}
},{
	statics: {
		get instance()  {
			if (!Installer.$) {
				Installer.$ = new Installer();
			}
			return Installer.$;
		},
		install		: function(params){
			return Installer.instance.install(params);
		},
		uninstall	: function(params){
			return Installer.instance.uninstall(params);
		}
	}
});