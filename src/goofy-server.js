var CONNECT = require('connect');
var APP     = CONNECT();
var API		= require('./goofy-api.js');
var CONF 	= require('./goofy-config.js');

function simplify(o){
		var obj = o;
		if(obj && typeof(obj['json'])=='function'){
			obj = obj['json']();
		}
		if(obj instanceof Array){
			var map = [];
			for(var i in obj){
				 map.push(simplify(obj[i]));
			}
			obj = map;
		}else
		if(typeof(obj)=='object'){
			var map = {};
			for(var i in obj){
				 map[i] = simplify(obj[i]);
			}
			obj = map;
		}
		return obj;
}

APP.use(CONNECT.logger('dev'))
APP.use(CONNECT.query());
APP.use(CONNECT.json());
APP.use(CONNECT.static(__dirname+'/../web'));
APP.use(function(req, res, next){

	res.json = function(result){
		this.setHeader('Content-Type', 'application/json');
		this.end(JSON.stringify(simplify(result)));
	},
	res.success = function(result){
		this.json({
			status: 'success',
			result: result
		})
	}
	res.error  = function(result){
		this.json({
			status: 'error',
			result: result
		})
	}
	next()
})
APP.use('/info', function(req, res){
	res.success(CONF);
});
APP.use('/terminate', function(req, res){
	res.success(API.terminate());
});
APP.use('/apps', function(req, res){
	res.json(API.apps());
});
APP.use('/start', function(req, res){
	res.json(API.start());
});
APP.use('/stop', function(req, res){
	res.json(API.stop(req.query.signal));
});
APP.use('/restart', function(req, res){
	res.json(API.restart(req.query.signal));
});
APP.use('/status', function(req, res){
	res.json(API.status());
});
APP.use('/logs', function(req, res){
	if(req.query.app){
		res.json(API.logs(req.query.app));
	}else{
		res.json(false)
	}
});

APP.use('/install', function(req, res){
	if(req.query.app){
		API.install(req.query.app).on('install',function(data){
			res.json(data);
		});
	}else{
		res.json(false)
	}
});

APP.use('/uninstall', function(req, res){
	if(req.query.app){
		API.uninstall(req.query.app).on('uninstall',function(data){
			res.json(data);
		});
	}else{
		res.json(false)
	}
});

module.exports 	= {
	start : function(){
		process.title = 'goofyd';
		APP.listen(CONF.GOOFY_PORT);
		console.info(simplify(API.load()));
	}
}