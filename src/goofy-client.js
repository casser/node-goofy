var REST = require('./utils/rest.js');
var CONF = require('./goofy-config.js');
REST.init({
	services:{
		goofy				: {
			url				: 'http://127.0.0.1:'+CONF.GOOFY_PORT+'/',
			parsers			: {
				response	: function(res){
					try{
						var result = JSON.parse(res.data.toString('utf8'));
						if(result.status == 'success'){
							res.emit('success',result.result);
						}else{
							res.emit('error',result.result||result);
						}
					}catch(er){
						res.emit('error',er);
					}
				}
			}
		}
	},
	api				: {
		info		: function(){
			return this.goofy.get('info');
		},
		status		: function(app){
			if(app){
				return this.goofy.get('status',{app:app});
			}else{
				return this.goofy.get('status');
			}
		},
		stop		: function(app){
			if(app){
				return this.goofy.get('stop',{app:app});
			}else{
				return this.goofy.get('stop');
			}
		},
		start		: function(app){
			if(app){
				return this.goofy.get('start',{app:app});
			}else{
				return this.goofy.get('start');
			}
		},
		terminate	: function(){
			return this.goofy.get('terminate');
		},
		install	    : function(cmd){
			return this.goofy.get('install',{app:cmd});
		},
		uninstall   : function(cmd){
			return this.goofy.get('uninstall',{app:cmd});
		},
		logs   		: function(cmd){
			return this.goofy.get('logs',{app:cmd});
		}
	}
})
module.exports = REST;