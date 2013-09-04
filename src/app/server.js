var Class   	= require('js-class');
var Utils   	= require('./utils');

var Installer  	= require('./installer');
var Nexus  		= require('./nexus');
var Processor	= require('./processor');

var CONFIG		= require('./config');

var Server 		= Class({
	constructor : function (data) {
		this.installer 	= new Installer();
		this.nexus 		= new Nexus();
		this.processor	= new Processor();
	},
	info		: function(req,res){
		res.success(CONFIG);
	},
	install		: function(req,res){
		this.installer.install(req.query)
		.on('succeed',function(response){
			res.success(response);
		})
		.on('failed',function(response){
			res.error(response);
		});
	},
	uninstall		: function(req,res){
		this.installer.uninstall(req.query)
		.on('succeed',function(response){
			res.success(response);
		})
		.on('failed',function(response){
			res.error(response);
		});
	},
	status		: function(req,res){
		res.success(this.processor.status(req.query.a));
	},
	stop		: function(req,res){
		res.success(this.processor.stop(req.query.a));
	},
	start		: function(req,res){
		res.success(this.processor.start(req.query.a));
	},
	terminate	: function(req,res){
		res.success(this.processor.stop());
		process.abort();
	},
	search		: function(req,res){
		this.nexus.search(req.query)
		.on('succeed',function(response){
			res.success(response);
		})
		.on('failed',function(response){
			res.error(response);
		});
	},
	log		: function(req,res){
		res.success(this.processor.log(req.query.a));
	},
	logtest:function(req,res){
		res.writeHead(200, {
			'Content-Type': 'text/html',

		});
		var iid = setInterval(function(){
			console.info("<pre>some data</pre>");
			 res.write("<pre style='margin:0px'>some data</pre>");
		},1000);

		req.socket.on('close', function() {
			clearInterval(iid);
		});
	}
},{
	statics: {
		get instance()  {
			if (!Server.$) {
				Server.$ = new Server();
			}
			return Server.$;
		},
		start  		: function(){
			process.title = 'goofyd';
			var connect = require('connect');
			var app = connect();
			app.use(connect.logger('dev'))
			app.use(connect.query());
			app.use(connect.json());
			app.use(function(req, res, next){
				res.json = function(result){
					this.setHeader('Connection', 'keep-alive');
					this.setHeader('Transfer-Encoding', 'chunked');
					this.setHeader('Content-Type', 'application/json');
					this.end(JSON.stringify(Utils.simplify(result)));
				},
				res.success = function(result){
					this.json({
						status: 'success',
						result: result
					})
				}
				res.error  = function(result){
					var error = result;
					if(error instanceof Error){
						var err = {
							message		:error.message,
							code		:error.code
						};
						for(var i in error){
							if(i=='stack'){
								err.stack = error.stack.split('\n');
							}else
							if(typeof(error[i])!='function'){
								err[i] = Utils.simplify(error[i]);
							}
						}
						error = err;
					}
					this.json({
						status: 'error',
						result: error
					})
				}
				next()
			});

			for(var handler in Server.instance){
				if(handler!='constructor' && typeof(Server.instance[handler])==='function'){
					app.use('/'+handler,Server.instance[handler].bind(Server.instance));
				}
			}

			app.use(connect.static(__dirname+'/../../web'));
			app.listen(CONFIG.GOOFY_PORT);
		}
	}
});

module.exports = Server;
