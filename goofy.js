var PROGRAM = require('commander');
var TABLE   = require('cli-table');
var UTIL    = require('util');
var CONFIG	= require('./src/goofy-config');


function log(object){
	console.log(UTIL.inspect(object,{
		colors	: true,
		depth	: null
	}))
}

PROGRAM.command('daemon-io')
.description("runs goofy io")
.action(function cDaemonStart(){
	require('./src/server').start();
});

PROGRAM.command('cli')
.description("runs goofy io")
.action(function cDaemonStart(){
	require('./src/cli');
});

PROGRAM.command('daemon-run')
.description("runs goofy daemon")
.action(function cDaemonStart(){
	require('./src/goofy-server').start();
});

PROGRAM.command('daemon-start')
.description("start goofy daemon")
.action(function cDaemonStart(){
	var CLIENT = require('./src/goofy-client');
	function fork(){
		var cp 		= require('child_process');
		var args 	= process.argv.slice(0,2);
		args.push('daemon-run');
		var child = cp.spawn(args[0], args.slice(1), {
			detached 	: true,
			stdio 		: [ 'ignore','ignore', 'ignore']
		});
		child.unref();
	}
	var retries = 10;
	function tryStart(){
		var info = CLIENT.info()
		info.on('error',function(error){
			if(retries == 10){
				fork();
			}
			if(retries-- > 0){
				setTimeout(tryStart,1000)
			}else{
				console.log(error);
				console.log("GOOFY FAILED TO STARTED".red);
			}
		});
		info.on('success',function(){
			console.log("GOOFY STARTED".green);
		})
	}
	tryStart();
});

PROGRAM.command('daemon-stop')
.description("stop goofy daemon")
.action(function cDaemonStop(){
	var CLIENT 		= require('./src/goofy-client');
	var terminate   = CLIENT.terminate()
	terminate.on('error',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY ALREADY STOPPED".yellow);
		}else{
			console.log(error);
			console.log("GOOFY FAILED TO STOP".red);
		}
	});
	terminate.on('success',function(version){
		console.log("GOOFY STOPPED".green);
	})
});

PROGRAM.command('daemon-info')
.description("prints daemon information")
.action(function cDaemonStatus(){
	require('./src/goofy-client').info()
	.on('error',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			console.log(error);
			console.log("GOOFY FAILED TO GET INFO".red);
		}
	})
	.on('success',function(info){
		log(info);
	});
});

PROGRAM.command('config [key]')
.description("print configuration for 'key', or all configurations if 'key' not provided")
.action(function cConfig(cmd){

	if(typeof(cmd)=='string'){
		console.info(CONFIG[cmd]);
	}else{
		var t = new TABLE({
			head	: ['KEY'.green, 'VALUE'],
			style 	: {compact : true, 'padding-left' : 1}
		});
		for(i in CONFIG){
			t.push([i.green,CONFIG[i]]);
		}
		console.log(t.toString())
	}
});

PROGRAM.command('start [app]')
.description("start provided application, or all applications if 'app' not provided")
.action(function cStart(){

});

PROGRAM.command('stop [app]')
.description("stop provided application, or all applications if 'app' not provided")
.action(function cStop(){

});

PROGRAM.command('status [app]')
.description("prints status of provided application, or all applications if 'app' not provided")
.action(function cStatus(){

});

PROGRAM.command('install <app>')
.description("install application")
.action(function cInstall(){

});

PROGRAM.command('uninstall <app>')
.description("uninstall application")
.action(function cUninstall(){

});

PROGRAM.command('show <app>')
.description("shows application info")
.action(function cShow(){

});

module.exports = function init(){
	process.title  = 'goofy';
	PROGRAM.version(CONFIG.GOOFY_VERSION);
	PROGRAM.parse(process.argv);
};

