var HTTP 	= require('http');
var PATH 	= require('path');
var FS 		= require('fs');
var CP 		= require('child_process');

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

module.exports = function SERVER(){
	this.http = HTTP.createServer(function (req, res) {
		switch(req.url){
			case '/' 		:
			case '/status' 	: 
				do_status(req,res); 
			break;
			case '/pid' 	: 
				do_pid(req,res); 
			break;
			case '/stop' 	: 
				do_exit(req,res); 
			break;
			case '/config' 	: 
				do_config(req,res); 
			break;
			default			: 
				do_error(req,res,{
					code 	: "UNKNOWN_ACTION",
					message : "action "+req.url+" not found"
				});
			break;
		}		
	});
	this.start = function(){
		init();
		for(var p in CONFIG){
			var proc   = CONFIG[p];
			if(proc.exec.charAt(0)!='/' && proc.cwd){
				proc.exec = PATH.resolve(proc.cwd,proc.exec);
			}
			var child  = CP.spawn(proc.exec, proc.args,{
				env  : proc.env,
				cwd  : proc.cwd
			});
			child.stdout.setEncoding('utf8');
			child.stdout.on('data', function (data) {
  				console.log(data);
			});
			child.stderr.setEncoding('utf8');
			child.stderr.on('data', function (data) {
  				console.error(data);
			});
			child.on('exit',function(){
				proc.status = 'stopped'
			})
			proc.status  = 'running';
			proc.pid     = child.pid;
			PROCESSES[p] = child;
		}
		this.http.listen(2987);
		console.log("server started");
	}
}

process.on('exit',function(code,signal){
	terminate(code,signal);
});