/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/21/13
 * Time: 7:29 AM
 * To change this template use File | Settings | File Templates.
 */
var FS   	= require('fs');
var PATH 	= require('path');
var NPM  	= require("npm");
var EVENTS  = require('events');
var XML  	= require('xmldom');
var CHP  	= require('child_process');
var REST 	= require('./utils/rest.js');
var CONF	= require('./goofy-config.js');

console.info(process.cwd());

NPM.on("log", function (message) {
	console.log(message);
})

var parser = new XML.DOMParser();

function is(obj,type){
	return (typeof(obj) == type);
}

function patch(){
	var obj = {};
	for(var i in arguments){
		if(is(arguments[i],'object')){
			for(var k in arguments[i]){
				obj[k] = arguments[i][k];
			}
		}
	}
	return obj;
}

function formatDuration(s){
	var sec = Math.floor(s);
	var min = Math.floor(sec/60); sec = sec%60;
	var hur = Math.floor(min/60); min = min%60;
	var day = Math.floor(hur/24); hur = hur%24;
	return [(day>0?day+'days':''),(hur>0?hur+'hours':''),(min>0?min+'mins':''),(sec>0?sec+'secs':'')].join(' ').replace(/\s+/,' ').trim();
}

function Logger(){
	var buffer  = [];
	var pending = {};

	this.log =function(channel,data){
		if(pending[channel]){
			data = pending[channel]+data
		}
		var chunk = data.replace(/\r+/,'').split(/\n+/);
		for(var i=0;i<chunk.length;i++){
			var line = chunk[i];
			if(i==chunk.length-1){
				if(line==""){
					buffer.unshift(channel+' '+line);
					pending[channel]=null;
				}else{
					pending[channel]=line;
				}
			}else{
				buffer.unshift(channel+' '+line);
			}
		}
		if(buffer.length>1010){
			buffer = buffer.splice(0,1000);
		}
	}

	this.err =function(data){
		this.log('ERR',data);
	}

	this.out =function(data){
		this.log('OUT',data);
	}

	this.json =function(){
		return buffer;
	}
}

function Version(value){

	var VER_REGEXP = /^((\d+)(\.(\d+)(\.(\d+))?)?)(-[a-zA-Z0-9.\-_]+)?$/i;
	var ver = {}


	this.isSnapshot =function(){
		return (this.ext() && this.ext().match(/^.*-SNAPSHOT$/i))?true:false;
	}

	this.maj = function(){
		if(arguments.length==0){
			return ver.maj;
		}else{
			ver.maj = arguments[0];
		}
	}

	this.min = function(){
		if(arguments.length==0){
			return ver.min;
		}else{
			ver.min = arguments[0];
		}
	}

	this.inc = function(){
		if(arguments.length==0){
			return ver.inc;
		}else{
			ver.inc = arguments[0];
		}
	}

	this.ext = function(){
		if(arguments.length==0){
			return ver.ext;
		}else{
			ver.ext = arguments[0];
		}
	}

	this.parse =function(value){
		var v = value.match(VER_REGEXP);
		if(!v){
			throw new Error('invalid version "'+pkg+'"');
		}else{
			this.maj(v[2]);
			this.min(v[4]);
			this.inc(v[6]);
			this.ext(v[7]);
			if(value!=this.toString()){
				throw new Error('cant parse version '+this.toString());
			}
		}
	}

	this.toString = function(){
		return (
			(this.maj())+
			(this.min()!=null?'.'+this.min():'')+
			(this.inc()!=null?'.'+this.inc():'')+
			(this.ext()!=null?this.ext():'')
		);
	}

	this.parse(value)
}

function Package(pkg){

	var PKG_REGEXP = /^((([a-zA-Z.\-_]+):)?([a-zA-Z0-9.\-_]+)(@([a-zA-Z0-9.\-_]+)?)?$)/i;
	var NPM_GROUP  = 'org.npmjs.registry';

	var pack = {};


	this.type = function(){
		if(!pack.group || pack.group==NPM_GROUP){
			return 'npm';
		}else{
			return 'mvn';
		}
	}

	this.artifact = function(){
		if(arguments.length==0){
			return pack.artifact;
		}else{
			pack.artifact = arguments[0];
		}
	}

	this.group = function(){
		if(arguments.length==0){
			return pack.group||NPM_GROUP;
		}else{
			pack.group = arguments[0]==NPM_GROUP?null:arguments[0];
		}
	}

	this.current = function(){
		if(arguments.length==0){
			return pack.current || 'latest';
		}else{
			pack.current = arguments[0];
		}
	}
	this.latest = function(){
		if(arguments.length==0){
			return pack.latest;
		}else{
			pack.latest = arguments[0];
		}
	}
	this.release = function(){
		if(arguments.length==0){
			return pack.release;
		}else{
			pack.release = arguments[0];
		}
	}

	this.url = function(){
		if(arguments.length==0){
			return pack.url;
		}else{
			pack.url = arguments[0];
		}
	}

	this.version = function(){
		var version = this.latest()
		switch(this.current()){
			case 'release' : version = this.release(); break;
			case 'latest'  : version = this.latest();  break;
			default  	   :
				if(this.current()){
					version = this.current();
				}
			break;
		}
		if(version){
			for(var i in this.versions()){
				var v = this.versions()[i];
				if(v.toString()==version){
					return v;
				}
			}
		}

		if(!version || version=='latest'){
			return null
		}else
		if(version=='release'){
			return version;
		}else{
			return new Version(version);
		}
	}

	this.versions = function(){
		if(arguments.length==0){
			return pack.versions||(pack.versions=[]);
		}else
		if(arguments[0] instanceof Array){
			pack.versions = arguments[0];
		}
		for(var i in arguments){
			if(arguments[i] instanceof Version){
				this.versions().push(arguments[i]);
			}
		}
	}


	this.parse =function(pkg){
		var v = pkg.match(PKG_REGEXP);
		if(!v){
			throw new Error('invalid package "'+pkg+'"');
		}else{
			this.group(v[3]);
			this.artifact(v[4]);
			this.current(v[6]);
		}
	}

	this.toString = function(){
		return (
			(this.group()?this.group()+':':'')+
			(this.artifact())+
			(this.version()?'@'+this.version():'')
		);
	}

	this.parse(pkg);
}

function Application(data){

	var ins = {};

	this.id 			= function(){
		return ins.id;
	}
	this.daemon			= function(){
		return ins.daemon;
	}
	this.version  		= function(){
		return ins.version;
	}
	this.name   		= function(){
		return ins.name;
	}
	this.group   		= function(){
		return ins.group;
	}
	this.description   	= function(){
		return ins.description;
	}
	this.readme   		= function(){
		return ins.readme;
	}


	this.env 			= function(){
		return ins.env
	}
	this.cwd 			= function(){
		return ins.cwd;
	}
	this.executable 	= function(){
		return ins.executable;
	}
	this.arguments 		= function(){
		return ins.arguments;
	}
	this.continuous 	= function(){
		return this.retries()>0;
	}
	this.retries 		= function(){
		return ins.retries
	}

	this.json = function(){
		return {
			id			:this.id(),
			version		:this.version(),
			name		:this.name(),
			group		:this.group(),
			description	:this.description(),
			readme		:this.readme(),
			daemon		:this.daemon(),
			env			:this.env(),
			cwd			:this.cwd(),
			executable	:this.executable(),
			arguments	:this.arguments(),
			continuous	:this.continuous(),
			retries		:this.retries()
		}
	}

	function initInfo(){
		var pack 	= new Package(data.artifact);
		if(!(
			pack.current()  == data.version &&
			pack.artifact() == data.name
		)){
			throw new Error(
				"invalid package: artifact should match version and name"+
				"\n artifact : "+data.artifact+
				"\n version  : "+data.version+
				"\n name     : "+data.name
			);
		}
		ins.id 				= pack.artifact();
		ins.version 		= pack.current();
		ins.name    		= pack.artifact();
		ins.group   		= pack.group();
		ins.description		= data.description;
		ins.readme			= data.readme;
		ins.daemon 			= data.goofy?true:false;
	}

	function initDaemon(){

		ins.cwd 		= PATH.resolve(CONF.GOOFY_MODULES_DIR,ins.name);
		var goofy		= data.goofy;

		if(typeof(goofy)=='string'){
			goofy = require(PATH.resolve(ins.cwd,data.goofy)).goofy({
				settings: data,
				env		: process.env,
				config	: CONF,
				params	: {}
			});
		}

		if(typeof(goofy)!='object'){
			throw new Error("invalid daemon settings");
		}

		if(typeof(goofy.executable) == 'string'){
			ins.executable 	= goofy.executable;
		}else{
			throw new Error(
				"daemon executable should be provided and has type string : " +
				"\n  executable : "+goofy.executable
			);
		}

		if(goofy.arguments){
			ins.arguments 	= goofy.arguments;
		}else{
			ins.arguments 	= [];
		}

		if(typeof(goofy.retries) == 'number'){
			ins.retries 	= goofy.retries;
		}else{
			ins.retries 	= 10;
		}

		if(typeof(goofy.cwd) == 'string'){
			ins.cwd 	= goofy.cwd;
		}

		if(typeof(goofy.env) == 'object'){
			ins.env 	= goofy.env;
		}else{
			ins.env		= patch(process.env,CONF)
		}
		if(typeof(goofy.id) == 'string'){
			ins.id = goofy.id;
		}
	}

	initInfo();
	initDaemon();
}

function Process(app){
	var t,r=0,s,p,stat='normal',paused=false,logger = new Logger();
	this.start = function(){
		if(!this.running()){
			console.info(app.executable());
			console.info(app.arguments());
			t = CHP.spawn(app.executable(),app.arguments(),{
				cwd:app.cwd(),
				env:app.env()
			});
			p = t.pid;
			logger.out("STARTED "+ p+"\n");
			t.stderr.on('data',function(data){
				logger.err(data.toString())
			});
			t.stdout.on('data',function(data){
				logger.out(data.toString())
			});
			t.on('exit',function(code){
				console.info("TERMINATED "+arguments[0]+' '+arguments[1]+' '+arguments[2]);
				logger.out("TERMINATED "+p+"\n");
				t = null;
			});
			r++;
			s=new Date();
			paused=false;
		}
	}
	this.stop = function(signal){
		paused = true;
		console.info("STOPPING "+app.id()+' '+signal);
		t&&t.kill(signal);
	}
	this.restart = function(signal){
		console.info("RESTARTING "+app.id()+' '+singnal);
		t&&t.kill(signal);
	}
	this.check = function(){
		if(!paused && this.runs()<app.retries()){
			this.start();
		}else{
			stat = 'dead';
		}
	}
	this.time = function(){
		return s.toISOString().
		  replace(/T/, ' ').      // replace T with a space
		  replace(/\..+/, '');
	}
	this.duration = function(){
		return formatDuration((new Date().getTime()-s.getTime())/1000);
	}
	this.pid = function(){
		return t?t.pid:'none';
	}
	this.thread = function(){
		return t;
	}
	this.runs = function(){
		return r;
	}
	this.log = function(){
		return logger;
	}
	this.running = function(){
		return t?true:false;
	},
	this.status = function(){
		return stat;
	}
	this.json  = function(){
		return patch(app.json(),{
			pid			: this.pid(),
			time		: this.time(),
			duration	: this.duration(),
			running		: this.running(),
			status      : this.status(),
			runs		: this.runs()
		});
	}
}

function Processor(){

	this.processes = {};

	this.get =function(app){
		var id = app;
		if(app instanceof Application){
			id = app.name();
			if(!this.processes[id]){
				this.processes[id] = new Process(app);
			}
		}else
		if(app instanceof Package){
			id = app.artifact();
		}
		console.info(id);
		return this.processes[id];
	}

	this.list = function(){
		var list = [];
		for(var i in this.processes){
			list.push(this.get(i));
		}
		return list;
	}

	this.start = function(apps){
		for(var i in apps){
			var proc = this.get(apps[i]);
			proc.start();
		}
		return this.list();
	}

	this.stop = function(signal){
		for(var a in this.processes){
			this.processes[a].stop(signal);
		}
		return this.list();
	}
	this.restart = function(signal){
		for(var a in this.processes){
			this.processes[a].restart(signal);
		}
		return this.list();
	}
	this.terminate=function(code,signal){
		for(var a in this.processes){
			this.processes[a].stop(signal);
		}
		setTimeout(function(){
			process.exit(code);
		}, 2000);
		return true;
	}

	var self = this;
	setInterval(function(){
		for(var a in self.processes){
			self.processes[a].check();
		}
	},500);
}

PROCESSOR = new Processor();

REST.init({
	services:{
		npm				: {
			url				: CONF.GOOFY_NPM_URL,
			parsers			: {
				response	: function(res){
					var type = res.headers['content-type'].split(';')[0].trim();
					if(type=='application/json'){
						res.body = JSON.parse(res.data.toString('utf8'));
					}else{
						console.info(res.headers['content-length']+' '+res.data.length);
					}
				}
			},
			api				: {
				load		: function(pack){
					var path = pack.artifact();
					return this.get(path).on('done',function(){
						var doc  = this.body;
						pack.latest(doc['dist-tags'].latest);
						pack.release(doc['dist-tags'].latest);
						for(var i in doc.versions){
							var ver = new Version(i);
							pack.versions(ver);
						}
						pack.url(doc.versions[pack.version().toString()].dist.tarball);
						this.emit('success',pack);
					});
				}
			}
		},
		mvn			: {
			url			: CONF.GOOFY_MVN_URL,
			auth		: {
				user	: CONF.GOOFY_MVN_USER,
				pass	: CONF.GOOFY_MVN_PASS
			},
			parsers			: {
				response	: function(res){
					var type = res.headers['content-type'].split(';')[0].trim();
					if(type=='application/xml'){
						res.body  = parser.parseFromString(
							res.data.toString('utf8').replace(/<\?xml.*\?>/,''), 'text/xml'
						).documentElement;
					}else{
						console.info(res.headers['content-length']+' '+res.data.length);
					}
				}
			},
			api				: {
				load		: function(pack){
					var base = pack.group().replace(/\./g,'/')+'/'+pack.artifact();
					var serv = this;
					console.info(base+'/maven-metadata.xml');
					return serv.get(base+'/maven-metadata.xml').on('done',function(){
						var req  = this;
						var doc  = req.body;
						var lat  = doc.getElementsByTagName('latest')[0];
						var rel  = doc.getElementsByTagName('release')[0];
						pack.latest(lat?lat.textContent:null);
						pack.release(rel?rel.textContent:null);
						var vers  = doc.getElementsByTagName('version');
						for(var i=0;i<vers.length;i++){
							var ver = new Version(vers[i].textContent);
							pack.versions(ver);
						}
						var v = pack.version().toString();
						if(pack.version().isSnapshot()){
							serv.get(base+'/'+v+'/maven-metadata.xml').on('done',function(){
								var doc = this.body;
								var vv 	= doc.getElementsByTagName('value')[0].textContent;
								pack.url(base+'/' +v+'/'+pack.artifact()+'-'+vv+'-npm.tar.gz');
								req.emit('success',pack);
							})
						}else{
							pack.url(base+'/'+v+'/'+pack.artifact()+'-'+v+'-npm.tar.gz');
							this.emit('success',pack);
						}
					});
				}
			}
		}
	},
	api:{
		load		: function(pack){
			return this[pack.type()].load(pack);
		},
		install		: function(pkg){
			var pack = new Package(pkg);
			var serv = this;
			return cb = serv.load(pack).on('success',function(p){
				console.info(pack.url());
				var req = serv[pack.type()].get(pack.url());
				req.on('done',function(chunk){
					var dir  = PATH.resolve(CONF.GOOFY_PACKAGES_DIR,pack.group());
					if(!FS.existsSync(dir)){
						FS.mkdirSync(dir);
					}
					var file = PATH.resolve(dir,pack.artifact()+'.'+pack.type()+'.'+pack.version().toString()+'.tgz');
					FS.writeFileSync(file,this.data,{
						encoding: 'binary'
					});
					NPM.load(null, function (er) {
						if (er) {
							throw er;
						} else {
							NPM.commands.install([file],function(data){
								var pj = PATH.resolve(CONF.GOOFY_MODULES_DIR,pack.artifact()+'/package.json');
								var json = JSON.parse(FS.readFileSync(pj,'utf8'))
								json.artifact = pack.toString();
								FS.writeFileSync(pj,JSON.stringify(json));
								cb.emit('install',pack);
							})
						}
					});
				})
			})
		},
		uninstall	: function(pkg){
			var pack = new Package(pkg);
			var name = pack.artifact();
			var cb	 = new EVENTS.EventEmitter();
			NPM.load(null, function (er) {
				if (er) {
					cb.emit('error',er);
				} else {
					NPM.commands.uninstall(name,function(data){
						cb.emit('uninstall',data);
					})
				}
			})
			return cb;
		},
		apps		: function(all){
			var gpks = [];
			var pkgs = FS.readdirSync(CONF.GOOFY_MODULES_DIR).filter(function(e){
				if(e.charAt(0)!='.'){
					var app = new Application(JSON.parse(
						FS.readFileSync( PATH.resolve(CONF.GOOFY_MODULES_DIR,e+'/package.json'),'utf8')
					));
					if(app.daemon() || all){
						gpks.push(app);
					}
				}else{
					return false;
				}
			});
			return gpks;
		},
		start	: function(){
			return PROCESSOR.start(this.apps());
		},
		stop	: function(signal){
			return PROCESSOR.stop(signal);
		},
		restart	: function(signal){
			return PROCESSOR.restart(signal);
		},
		status	: function(){
			return PROCESSOR.list();
		},
		logs	: function(app){
			return PROCESSOR.get(new Package(app)).log();
		},
		terminate:function(){
			return PROCESSOR.terminate(0,'SIGHUP');
		},
		load	 :function(){
			return this.apps();
		}
	}
});

process.on('exit',function(code,signal){
	PROCESSOR.terminate(code,signal);
});

module.exports = REST;