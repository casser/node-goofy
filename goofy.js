var program = require('commander');
program
  .version('0.0.1')
  //.option('-d, --daemon', 'Start As Daemon')
  

function daemon(){
	console.log("starting");
	var cp 		= require('child_process');
	var args 	= process.argv;
	
	args.push('--daemon');
	console.log(args);
	var child = cp.spawn(args[0], args.slice(1), {
		detached 	: true,
		stdio 		: [ 'ignore','ignore', 'ignore']
	});
	child.unref();
}

function daemon_run(options){
	process.title = 'goofyd'
	var SERVER = require('./src/goofy-server');
	var server = new SERVER();
	server.start();
}

function daemon_start(options){
	if(options.daemon){
		daemon_run();
	} else {
		process.title = 'goofy'
		var CLIENT = require('./src/goofy-client');
		var client = new CLIENT();
		var retries = 10;
		client.status().on('complete',function(result){
			if(result instanceof Error){
				if(retries == 10){
					daemon();	
				}
				if(retries-- > 0){
					this.retry(1000)
				}else{
					throw result;
				}
			}else{
				console.log("started");
			}
		});
	}
}

function daemon_status(options){
	var CLIENT = require('./goofy-client');
	var client = new CLIENT();
	client.status().on('complete', function(result){
		if(result instanceof Error){
			console.log("stopped");
		}else{
			console.log("started");
		}
	});
}

function daemon_stop(options){
	var CLIENT = require('./goofy-client');
	var client = new CLIENT();
	client.stop().on('complete', function(result){
		if(result instanceof Error){
			console.log("failed");
		}else{
			console.log("stopped");
		}
	});
}

program
	.command('daemon <cmd>')
	.description('init script control cmd[start,stop,status]')
	.option("-D, --daemon", "Start child process")
	.action(function(cmd, options){
		switch(cmd){
			case 'run'  	: daemon_run(options);break;
			case 'start'  	: daemon_start(options);break;
			case 'stop'   	: daemon_stop(options);break;
			case 'status' 	: daemon_status(options);break;
			default  		: console.log("invalid command %s",cmd);
		}
	});

module.exports = program;