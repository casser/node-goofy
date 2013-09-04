/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/30/13
 * Time: 10:03 AM
 * To change this template use File | Settings | File Templates.
 */
var CHP  		= require('child_process');
var Class 		= require('js-class');
var Logger 		= require('./logger');
var Utils 		= require('./utils');
var CONFIG		= require('./config');

module.exports  = Class({
	get id(){
		return this.$.id
	},
	get name(){
		return this.$.name
	},
	get group(){
		return this.$.group
	},
	get description(){
		return this.$.description
	},
	get version(){
		return this.$.version
	},
	get snapshot(){
		return this.$.snapshot
	},
	get uid(){
		return this.$.uid;
	},
	get logger(){
		if(!this.$.logger){
			this.$.logger = new Logger()
		}
		return this.$.logger;
	},
	get time(){
		if(!this.$.time){
			this.$.time = new Date().getTime();
		}
		return this.$.time;
	},
	get exec(){
		return this.$.executable;
	},
	get args(){
		return this.$.arguments;
	},
	get retries(){
		if(typeof(this.$.retries)!='number'){
			this.$.retries = 10;
		}
		return this.$.retries;
	},
	get runs(){
		return this.$.runs;
	},
	get cwd(){
		return this.$.cwd;
	},
	get env(){
		return this.$.env;
	},
	get running(){
		return this.$.process?true:false;
	},

	get pid(){
		return this.process ? this.process.pid : 'none';
	},

	get process(){
		return this.$.process;
	},

	constructor : function (value) {
		if(!value.goofy){
			throw new Error('invalid app '+value.name);
		}else{
			this.$ 			= {
				id			: value.name,
				name		: value.name,
				group		: value.group,
				version		: value.version,
				description : value.description,
				snapshot 	: value.snapshot||false,
				uid 		: value.sha1,
				runs		: 0
			}
			var goofy		= value.goofy;
			var cwd 		= CONFIG.getAppCwd(this.id);

			if(typeof(goofy)=='string'){
				var gjs	= CONFIG.resolveAppFile(this.id,goofy);
				goofy = require(gjs).goofy({
					settings: value,
					cwd		: cwd,
					env		: process.env,
					config	: CONFIG,
					utils	: Utils
				});
			}
			if(typeof(goofy)!='object'){
				throw new Error("invalid daemon settings "+value.name);
			}

			if(typeof(goofy.executable) == 'string'){
				this.$.executable = goofy.executable;
			}else{
				throw new Error(
					"daemon executable should be provided and has type string : " +
					"\n  executable : "+goofy.executable
				);
			}

			if(goofy.arguments){
				this.$.arguments 	= goofy.arguments;
			}else{
				this.$.arguments 	= [];
			}

			if(typeof(goofy.retries) == 'number'){
				this.$.retries 	= goofy.retries;
			}else{
				this.$.retries 	= 10;
			}

			if(typeof(goofy.cwd) == 'string'){
				this.$.cwd 	= goofy.cwd;
			}else{
				this.$.cwd  = cwd;
			}

			if(typeof(goofy.env) == 'object'){
				this.$.env 	= goofy.env;
			}else{
				this.$.env	= Utils.patch(process.env,{
					GOOFY	: true
				})
			}
			if(typeof(goofy.id) == 'string'){
				this.$.id = goofy.id;
			}
		}
	},
	start	: function(){
		if(!this.running){
			try {
				if(this.$.runs>=this.retries){
					this.$.runs=0;
				}else{
					this.$.runs++;
				}
				console.info(this.exec,this.args);
				this.$.process = CHP.spawn(this.exec,this.args,{
					cwd:this.cwd,
					env:this.env
				});
				this.logger.out("STARTED "+process.pid+"\n");
				this.process.stderr.on('data',this.onStdErr.bind(this));
				this.process.stdout.on('data',this.onStdOut.bind(this));
				this.process.on('exit',this.onExit.bind(this));
			}catch(ex){
				this.logger.err(ex.message);
				setTimeout(this.start.bind(this),1000);
			}
		}
	},
	stop	 : function(){
		if(this.process){
			delete this.$.time;
			this.$.runs = this.retries;
			this.process.kill();
		}
	},

	onStdErr : function(data){
		this.logger.err(data.toString())
	},

	onStdOut : function(data){
		this.logger.out(data.toString())
	},

	onExit	 : function(code){
		try{
			this.logger.out("TERMINATED "+this.pid+' with code '+code+"\n");
			this.process.stderr.removeAllListeners();
			this.process.stdout.removeAllListeners();
			this.process.removeAllListeners();
			delete this.$.process;
			console.info(this.runs +' < '+ this.retries)
			if(this.runs < this.retries){
				this.start();
			}
		}catch(err){
			console.info(err)
		}
	},
	eq	: function(app){
		return this.uid == app.uid;
	},
	json 	: function(){
		return {
			id			:this.id,
			name		:this.name,
			group		:this.group,
			version		:this.version,
			snapshot	:this.snapshot,
			description	:this.description,
			pid			:this.pid,
			running		:this.running,
			exec		:this.exec,
			args		:this.args,
			cwd			:this.cwd,
			runs		:this.runs,
			retries		:this.retries
		}
	}
});
