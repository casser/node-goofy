var PROGRAM = require('commander');
var TABLE   = require('easy-table');
var COLORS  = require('colors');
var CONF  	= require('./src/goofy-config');

var config  = PROGRAM.command('config')
.description('print configuration')
.action(function(cmd){
	var t = new Table();
	for(i in config){
		t.cell('KEY', i);
		t.cell('VALUE', config[i]);
		t.newRow();
	}
	console.log(t.toString());
});

PROGRAM
.command('test')
.description('test command')
.action(function(cmd, options){
		console.log(program.config.crd);
		console.log(program.config.settings);
	});
/*
program
.command('run')
.description('run daemon')
.action(function(){
	require('./src/goofy-server').start();
});*/

PROGRAM
.command('daemon')
.description('start stop daemon')
.action(function start_daemon(cmd){
	function daemon(){
		var cp 		= require('child_process');
		var args 	= process.argv.slice(0,2);
		args.push('run');
		var child = cp.spawn(args[0], args.slice(1), {
			detached 	: true,
			stdio 		: [ 'ignore','ignore', 'ignore']
		});
		child.unref();
	}
	var app     = typeof(cmd)=="string"?cmd:null;
	var client  = require('./src/goofy-client');
	var retries = 10;
	function tryStart(){
		var stat = client.status()
		stat.on('error',function(){
			if(retries == 10){
				daemon();
			}
			if(retries-- > 0){
				setTimeout(tryStart,1000)
			}else{
				throw result;
			}
		});
		stat.on('done',function(){
			client.start(app)
			.on('error',function(err){
				console.info(err)
			})
			.on('done',function(err){
				console.log("started".green);
			})
		})
	}
	tryStart();
});

program
.command('start [app]')
.description('start application. ')
.action(function (cmd){
	if(typeof(cmd)=="string"){
		var client = require('./src/goofy-client');
		client.start(cmd)
		.on('error',function(err){
			console.info(err)
		})
		.on('done',function(err){
			console.log("started".green);
		})
	}
});

program
.command('terminate')
.description('stop daemon')
.action(function daemon_terminate(){
	var client = require('./src/goofy-client');
	client.terminate()
	.on('error', function(){
		console.info("terminated".green)
	})
	.on('done', function(){
		console.log("terminated".green);
	});
});

program
.command('stop [app]')
.description('stop application. ')
.action(function(cmd){
	var app 	= typeof(cmd)=="string"?cmd:null;
	var client 	= require('./src/goofy-client');
	console.info(app);
	client.stop(app)
	.on('error',function(err){
		console.info(err)
	})
	.on('done',function(err){
		console.info(this.body);
		console.log("started".green);
	})
});

program
.command('status')
.description('status of all applications')
.action(function(cmd){
	var client = require('./src/goofy-client');
	if(typeof(cmd)!="string"){
		client.status()
		.on('error',function(){
			console.info('Stopped'.green);
		})
		.on('done',function(){
			if(!(this.body instanceof Array)){
				console.log(this.body);
			}else{
				var t = new Table();
				this.body.forEach(function (item) {
					var args = item.arguments.join(' ');
					if(args.length>50){
						args=args.substring(0,50)+' <...>';
					}
					t.cell('PID', item.pid);
					t.cell('STATE', item.running ?'<running>':'<stopped>');
					t.cell('NAME', item.name);
					t.cell('VERSION', item.version);
					t.cell('GROUP', item.group);
					t.cell('RUNS', item.runs);
					t.cell('DURATION', item.duration);
					t.cell('TIME', item.time);
					t.cell('EXEC', item.executable);
					t.cell('ARGS', args);

					t.newRow();
				});
				console.log(t.toString()
					.replace(/<running>/g,'<running>'.green)
					.replace(/<stopped>/g,'<stopped>'.red)
				);
			}
		});
		return false;
	}
});

program
.command('status [app]')
.description('status of all application')
.action(function(cmd){
	if(typeof(cmd)=="string"){
		console.info("Status of "+cmd);
	}
});

program
.command('install [app]')
.description('status of all application')
.action(function(cmd){
	if(typeof(cmd)=="string"){
		var client = require('./src/goofy-client');
		client.install(cmd)
		.on('error',function(){
			console.info(('Failed to install "'+cmd+'"').red);
		})
		.on('done', function(result){
			console.info('installed'.green);
		});
	}
});

program
.command('uninstall [app]')
.description('uninstall application')
.action(function(cmd){
	if(typeof(cmd)=="string"){
		var client = require('./src/goofy-client');
		client.uninstall(cmd)
		.on('error',function(){
			console.info(('Failed to uninstall "'+cmd+'"').red);
		})
		.on('done', function(result){
			console.info('uninstalled'.green);
		});
	}
});

program
.command('logs [app]')
.description('get application logs')
.action(function(cmd){
	if(typeof(cmd)=="string"){
		var client = require('./src/goofy-client');
		client.logs(cmd)
		.on('error',function(){
			console.info(('Failed to uninstall "'+cmd+'"').red);
		})
		.on('done', function(){
			if(this.body instanceof Array){
				for(var i in this.body){
					console.info(this.body[i]
						.replace(/^ERR(.*)$/,'ERR'.red+'$1')
						.replace(/^OUT(.*)$/,'OUT'.green+'$1')
					);
				}
			}else{
				console.info(this.body);
			}
		});
	}
});


module.exports = function init(){
	process.title  = 'goofy';
	program.version(config.GOOFY_VERSION);
	program.parse(process.argv);
};