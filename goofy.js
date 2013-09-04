var PROGRAM = require('commander');
var TABLE   = require('cli-table');
var UTIL    = require('util');
var CONFIG	= require('./src/app/config');
var Utils	= require('./src/app/utils');

function log(object){
	console.log(UTIL.inspect(object,{
		colors	: true,
		depth	: null
	}))
}

PROGRAM.command('daemon-run')
.description("runs goofy daemon")
.action(function cDaemonStart(){
	 require('./src/app/server').start();
});

PROGRAM.command('daemon-start')
.description("start goofy daemon")
.action(function cDaemonStart(){
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
	var CLIENT  = require('./src/app/client');
	var retries = 10;
	function tryStart(){
		var info = CLIENT.info()
		info.on('failed',function(error){
			if(retries == 10){
				fork();
			}
			if(retries-- > 0){
				setTimeout(tryStart,1000)
			}else{
				log(error);
				console.log("GOOFY FAILED TO STARTED".red);
			}
		});
		info.on('succeed',function(){
			console.log("GOOFY STARTED".green);
		})
	}
	tryStart();
});

PROGRAM.command('daemon-stop')
.description("stop goofy daemon")
.action(function cDaemonStop(){
	require('./src/app/client').terminate()
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY ALREADY STOPPED".yellow);
		}else{
			log(error);
			console.log("GOOFY FAILED TO STOP".red);
		}
	})
	.on('succeed',function(version){
		console.log("GOOFY STOPPED".green);
	})
});

PROGRAM.command('daemon-info')
.description("prints daemon information")
.action(function cDaemonStatus(){
	require('./src/app/client').info()
	.on('error',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
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
			head	: ['PARAM'.cyan, 'VALUE'.cyan],
			style 	: {compact : true, 'padding-left' : 1,'padding-right':1}
		});
		for(i in CONFIG){
			if(typeof(CONFIG[i])!="function" && typeof(CONFIG[i])!="object"){
				t.push([i.green,CONFIG[i]]);
			}
		}
		console.log(t.toString())
	}
});

PROGRAM.command('start')
.description("start provided application, or all applications if 'app' not provided")
.option("-a, --app [app]", "Application to start")
.action(function cStart(env){
	require('./src/app/client').start({
		a:env.app
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
			console.log("GOOFY FAILED TO GET INFO".red);
		}
	})
	.on('succeed',function(info){
		if(env.app){
			console.log(("App '"+env.app+"' started").green);
		}else{
			console.log("Applications started".green);
		}
	});
});

PROGRAM.command('stop')
.description("stop provided application, or all applications if 'app' not provided")
.option("-a, --app [app]", "Application to stop")
.action(function cStop(env){
	require('./src/app/client').stop({
		a:env.app
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
			console.log("GOOFY FAILED TO GET INFO".red);
		}
	})
	.on('succeed',function(info){
		if(env.app){
			console.log(("App '"+env.app+"' stopped").yellow);
		}else{
			console.log("Applications stopped".yellow);
		}
	});
});

PROGRAM.command('log')
.description("shows logs of application")
.option("-a, --app <app>", "Application to stop")
.action(function cStop(env){
	require('./src/app/client').log({
		a:env.app
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
			console.log("GOOFY FAILED TO GET INFO".red);
		}
	})
	.on('succeed',function(response){
		var logs = response.result;
		if(logs instanceof Array){
			for(var i in logs){
				console.log(logs[i].l)
			}
		}else{
			log(result)
		}
	});
});

PROGRAM.command('status')
.description("prints status of provided application, or all applications if 'app' not provided")
.option("-a, --app [app]", "Application to check")
.action(function cStatus(env){
	require('./src/app/client').status({
		a:env.app
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
			console.log("GOOFY FAILED TO GET INFO".red);
		}
	})
	.on('succeed',function(response){
		if(response.result instanceof Array){
			var info = Utils.sortByKey(response.result,'group');
			var t = new TABLE({
				head	: [
					'PID'.cyan,
					'ID'.cyan,
					'GROUP'.cyan,
					'VERSION'.cyan,
					'RUNS'.cyan,
					'EXEC'.cyan
				],
				style 	: {compact : true, 'padding-left' : 1,'padding-right':1}
			});
			for(i in info){
				var a = info[i];
				t.push([
					a.running ? String(a.pid).green : String(a.pid).red,
					a.id,
					a.group,
					a.version,
					a.runs+'/'+ a.retries,
					a.exec
				]);
			}
			console.log(t.toString())
		}else{
			var info = response.result
			var t = new TABLE({
				style 	: {compact : true, 'padding-left' : 1,'padding-right':1}
			});
			t.push(['PID'.green,info.pid]);
			t.push(['NAME'.green,info.name]);
			t.push(['GROUP'.green,info.group]);
			t.push(['VERSION'.green,info.version]);
			t.push(['DESCRIPTION'.green,info.description]);
			if(info.snapshot){
				t.push(['SNAPSHOT'.green,'']);
				t.push(['- VERSION'.green,info.snapshot.version]);
				t.push(['- TIME'.green,new Date(info.snapshot.time).toISOString().replace(/T/, ' ').replace(/\..+/, '')]);
				t.push(['- NUMBER'.green,info.snapshot.build]);
			}
			t.push(['EXEC'.green,info.exec+(info.args && info.args.length>0?'\n '+info.args.join('\n '):'')]);

			console.log(t.toString())
		}

	});
});

PROGRAM.command('install')
.description("install application")
.option("-a, --app <app>", "application id")
.option("-g, --group <group>", "application group")
.option("-v, --version [version]", "application version, or LATEST or RELEASE, default is LATEST")
.action(function cInstall(env){
	require('./src/app/client').install({
		a:env.app,
		g:env.group,
		v:env.version
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
			console.log("INSTALL FAILED".red);
		}
	})
	.on('succeed',function(response){
		var info = response.result
		var t = new TABLE({
			style 	: {compact : true, 'padding-left' : 1,'padding-right':1}
		});
		t.push(['NAME'.green,info.name]);
		t.push(['GROUP'.green,info.group]);
		t.push(['VERSION'.green,info.version]);
		t.push(['DESCRIPTION'.green,info.description]);
		if(info.snapshot){
			t.push(['SNAPSHOT'.green,'']);
			t.push(['- VERSION'.green,info.snapshot.version]);
			t.push(['- TIME'.green,new Date(info.snapshot.time).toISOString().replace(/T/, ' ').replace(/\..+/, '')]);
			t.push(['- NUMBER'.green,info.snapshot.build]);
		}
		console.log(t.toString())
	});
});

PROGRAM.command('uninstall')
.description("uninstall application")
.option("-a, --app <app>", "application id")
.action(function cUninstall(env){
	require('./src/app/client').uninstall({
		a:env.app
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			console.log(error);
			console.log("UNINSTALL FAILED".red);
		}
	})
	.on('succeed',function(info){
		console.log(("App '"+env.app+"' removed").green);
	});
});

PROGRAM.command('search')
.description("shows application info")
.option("-a, --app <app>", "application id")
.option("-g, --group <group>", "application group")
.option("-v, --version [version]", "application version, or LATEST or RELEASE, default is LATEST")
.action(function cSearch(env){
	require('./src/app/client').search({
		a:env.app,
		g:env.group,
		v:env.version
	})
	.on('failed',function(error){
		if(error instanceof Error && error.code == 'ECONNREFUSED'){
			console.log("GOOFY STOPPED".yellow);
		}else{
			log(error);
			console.log("SEARCH FAILED".red);
		}
	})
	.on('succeed',function(response){
		var info = response.result
		var t = new TABLE({
			head	: [
				'NAME'.cyan,
				'GROUP'.cyan,
				'VERSION'.cyan,
				'RELEASE'.cyan,
				'SNAPSHOT'.cyan
			],
			style 	: {compact : true, 'padding-left' : 1,'padding-right':1}
		});
		for(var i in info){
			var a = info[i];
			t.push([
				(a.release && a.release.current)?a.name.green:((a.snapshot && a.snapshot.current)?a.name.yellow:a.name.yellow),
				a.group,
				a.version,
				a.release?(a.release.current?a.release.version.green:a.release.version):'false',
				a.snapshot?(a.snapshot.current?a.snapshot.version.yellow:a.snapshot.version):'false'
			]);
		}
		console.log(t.toString())
	});
});

module.exports = function init(){
	process.title  = 'goofy';
	PROGRAM.version(CONFIG.GOOFY_VERSION);
	PROGRAM.parse(process.argv);
};

