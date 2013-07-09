var PATH = require('path');
var CP 	 = require('child_process');
var BL   = require('byline');
var CONFIG;

function LOGGER(name){

	var outBuffer  = [];
	var errBuffer  = [];

	this.err =function(data){
		errBuffer.push(data);
	}

	this.out =function(data){
		outBuffer.push(data);
	}
	this.get =function(){
		return {
			name:name,
			out:outBuffer,
			out:errBuffer,
		}
	}
}

function APPLICATION(settings){
	
	var exec,name,args,running,env,cwd,runs=0,continuous,pid;

	this.init = function(){
		console.log(settings);
		name = settings.name;
		exec = settings.exec;
		args = settings.args;
		cwd  = settings.cwd;
		continuous = settings.continuous;
		if(settings.exec.charAt(0)!='/' && settings.cwd){
			exec = PATH.resolve(settings.cwd,settings.exec);
		}
	}

	this.run = function(){
		if(!running){
			this.logger = new LOGGER(name);
			this.proc = CP.spawn(exec, args, {
			   env: env,
			   cwd: cwd
			});
			BL.createStream(this.proc.stderr).on('data',this.logger.err);
			BL.createStream(this.proc.stdout).on('data',this.logger.out);
			this.proc.on('exit',function(){
				running = false;
			});
			runs++;
			running = true;
		}
	}

	this.check = function(){
		if(runs==0 || (continuous && !running)){
			this.run();
		}
	}

	this.pid = function (){
		return this.proc ? this.proc.pid : 0;
	}

	this.status = function(){
		return {
			name 		: name,
			running 	: running,
			runs 		: runs,
			continuous 	: continuous,
			pid 		: this.pid(),
		};
	}

	this.exit = function(signal){
		if(this.proc){
			this.proc.kill(signal);
		}
	}

	this.init();
}

function MONITOR(){
	var self = this;
	var apps=[],loop;

	this.init=function(list){
		for(a in list){
			apps[a] = new APPLICATION(list[a]);
		}
		this.start();
	}

	this.check = function(){
		for(var a in apps){
			apps[a].check();
		}
	}
	
	this.start = function(){
		loop = setInterval(this.check, 1000);
	}

	this.stop = function(){
		clearInterval(loop);
	}
	
	this.status = function(){
		var list = []
		for(var a in apps){
			list[a] = apps[a].status();
		}
		return list;
	}

	this.terminate =function(signal){
		this.stop();
		for(var a in apps){
			apps[a].exit(signal);
		}
	}
}

module.exports = new MONITOR();