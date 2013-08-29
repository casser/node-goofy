var HTTP 	= require('http');
var FS		= require('fs');
var IO 		= require('socket.io');
var CONF 	= require('./goofy-config.js');
var TASKS   = require('./tasks.js');

var APP 	= HTTP.createServer(function(req, res) {
	function index(){
		res.writeHead(200,{'Content-type': 'text/html'});
		res.end(FS.readFileSync(__dirname + '/../web/index.html'));
	}
	function favicon(){
		res.writeHead(200,{'Content-type': 'image/x-icon'});
		res.end(FS.readFileSync(__dirname + '/../web/favicon.ico'));
	}
	function client(){
		res.writeHead(200,{'Content-type': 'application/javascript'});
		res.end(FS.readFileSync(__dirname + '/client.js'));
	}
	switch(req.url){
		case '/':
			index();
		break;
		case '/favicon.ico':
			favicon();
		break;
		case '/socket.io/socket.io.client.js':
			client();
		break;
	}
});

IO.listen(APP).on('connection',function(socket){
	TASKS.setup(socket);
});

module.exports 	= {
	start : function(){
		process.title = 'goofyd';
		APP.listen(CONF.GOOFY_PORT);
		console.info("Started : "+CONF.GOOFY_PORT);
	}
}