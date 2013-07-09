var HTTP 	= require('http');
var PATH 	= require('path');
var FS 		= require('fs');
var QS      = require('querystring');
var CP 		= require('child_process');
var MON  	= require('./goofy-monitor');

var CONFIG    = null;
var PROCESSES = {};

function terminate(code,signal){
	for(var p in PROCESSES){
		PROCESSES[p].kill(signal);
	}
	setTimeout(function(){
		process.exit(0);
	},1000);
}

function init(){
	if(!CONFIG){
		CONFIG = JSON.parse(
			FS.readFileSync("goofy.json", "utf8")
		);
	}
}

function do_status(req,res){
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify("ok"));
}

function do_pid(req,res){
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(process.pid));
}

function do_exit(req,res){
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(process.pid));
	terminate(0,'SIGHUP');
}
function do_error(req,res,error){
	res.writeHead(404, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(error));	
}
function do_config(req,res){
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(CONFIG));
}



function SERVER(program){
	var self    = this;
	var http 	= HTTP.createServer(function (req, res) {
		try{
			var url     = req.url.substring(1);
			var query,method;
			if(url.indexOf('?')>0){
				query = QS.parse(url.substring(url.indexOf('?')+1));
				method = url.substring(0,url.indexOf('?'));
			}else{
				method = url;
			}
			if(method == ""){
				method = "index"
			}			
			if(self[method]){
				res.writeHead(200, {
					'Content-Type': 'application/json'
				});
				res.end(JSON.stringify(
					self[method](query,req.method)
				));
			}else{
				throw {
					code 	: "INVALID_ACTION",
					message : "no such method '"+method+"'"
				}
			}
		}catch(er){
			res.writeHead(404, {
				'Content-Type': 'application/json'
			});
			res.end(JSON.stringify(er));
		}
		
				
	});

	this.index = function(query,method){
		var settings = program.config.settings();
		return {
			name 		: settings.name,
			version 	: settings.version,
			description : settings.description,
			pid 		: process.pid,
			license 	: settings.license,
			author 		: settings.author,
			repository 	: settings.repository,
			bugs 		: settings.bugs
		};
	}

	this.status = function(query,method){
		return MON.status();
	}

	this.stop = function(query,method){
		MON.terminate('SIGINT');
		setTimeout(function(){
			process.exit(code);
		}, 2000);
		return true;
	}

	this.start = function(){
		MON.init(
			program.config.apps()
		);
		http.listen(
			program.config.port(),
			program.config.host()
		);
		console.log("server started");
	}

	process.on('exit',function(code,signal){
		self.stop(code,signal);
	});
}


module.exports = function(program){
	return new SERVER(program);
}