var CONFIG	= require('./config');
var Class   = require('js-class');
var App 	= require('./app');

Processor = Class({
	get installedApps(){
		var apps = CONFIG.loadApps();
		for(var i in apps){
			apps[i] = new App(apps[i]);
		}
		return apps;
	},
	get runningApps(){
		return this.$.apps;
	},
	constructor : function () {
		this.$ = {
			apps : {}
		},
		this.reload();
	},
	get			: function(id){
		var app = id;
		if(typeof(id)=="string"){
			app = this.installedApps[id];
		}
		if(app && Class.is(app).an(App)){
			return app;
		}else{
			throw new Error("Not an application "+id);
		}
	},
	start		: function(id){
		if(id){
			var app = this.get(id);
			var cur = this.runningApps[app.id];
			if(cur && cur.running){
				cur.stop();
			}
			this.runningApps[app.id] = app;
			this.runningApps[app.id].start();
		}else{
			for(var i in this.installedApps){
				this.start(i);
			}
		}
	},
	stop		: function(id){
		if(id){
			if(this.runningApps[id]){
				this.runningApps[id].stop();
			}
		}else{
			for(var i in this.runningApps){
				this.stop(i);
			}
		}
	},
	status		: function(id){
		if(id){
			return this.runningApps[id];
		}else{
			var apps = []
			for(var i in this.runningApps){
				apps.push(this.runningApps[i])
			}
			return apps;
		}
	},
	log		: function(id){
		if(id){
			if(this.runningApps[id]){
				return this.runningApps[id].logger;
			}
		}
		return false
	},
	remove		: function(app){
		if(this.runningApps[app.id]){
			this.runningApps[app.id].stop();
		}
		delete this.runningApps[app.id];
	},
	reload		: function(){
		var apps = {}
		for(var i in this.installedApps){
			if(!apps[i]){
				apps[i] = {}
			}
			apps[i].installed = this.installedApps[i];
		}
		for(var i in this.runningApps){
			if(!apps[i]){
				apps[i] = {}
			}
			apps[i].running = this.runningApps[i];
		}
		for(var i in apps){
			try{
				var pair = apps[i];
				if(pair.installed && pair.running){
					if(!pair.installed.eq(pair.running)){
						this.start(pair.installed);
					}
				}else
				if(pair.installed){
					this.start(pair.installed);
				}else
				if(pair.running){
					this.remove(pair.running);
				}
			}catch(er){
				console.info(er);
			}
		}
		setTimeout(this.reload.bind(this),5000);
	}

});


module.exports = Processor;