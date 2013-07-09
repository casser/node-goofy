var program = require('commander');
var Table   = require('easy-table');
var colors  = require('colors');

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

function daemon_run(options){
	process.title = 'goofyd';
	var server =  require('./src/goofy-server')(program);
	server.start();
}

function daemon_start(options){
	var client = require('./src/goofy-client')(program);
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
			console.log("started".green);
		}
	});
}

function daemon_status(options){
	var client = require('./src/goofy-client')(program);
	client.status().on('complete', function(result){
		if(result instanceof Error){
			console.log("stopped".yellow);
		}else{
			var t = new Table();
			result.forEach(function (item) {
				t.cell('PID', item.pid);
				t.cell('NAME', item.name);
				t.cell('RUNS', item.runs);
				t.cell('STATE', item.running ? 
					'running'.green : 
					'stopped'.red
				);
				t.newRow();
			});
			console.log(t.toString());
		}
	});
}

function daemon_stop(options){
	var client = require('./src/goofy-client')(program);
	client.stop().on('complete', function(result){
		if(result instanceof Error){
			console.log("failed".red);
		}else{
			console.log("stopped".green);
		}
	});
}

program
	.command('test')
	.description('test command')
	.action(function(cmd, options){
		console.log(program.config.crd);
		console.log(program.config.settings);
	});

program
	.command('run')
	.description('run daemon')
	.action(function(cmd, options){
		daemon_run(options);
	});

program
	.command('start')
	.description('start daemon')
	.action(function(cmd, options){
		daemon_start(options);
	});

program
	.command('stop')
	.description('stop daemon')
	.action(function(cmd, options){
		daemon_stop(options);
	});

program
	.command('status')
	.description('daemon status')
	.action(function(cmd, options){
		daemon_status(options);
	});

module.exports = function init(){
	process.title = 'goofy'
	program.config = require('./src/goofy-config');
	program.config.init();
	program.version(program.config.settings.version);
	program.parse(process.argv);
} ;