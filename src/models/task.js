var Class  = require('js-class');
var Events = require('events');
var Logger = require('./logger');

module.exports = Class(Events.EventEmitter,{
	get name(){
		return this.$.cmd;
	},
	set name(value){
		this.$.cmd = value;
	},
	get running(){
		return this.$.running;
	},
	get logger(){
		return this.$.logger;
	},
	run			: function(args){
		this.exec(args);
	},
	success		: function(res){
		this.emit('success',{
			status : 'success',
			data   : arguments.length>0?res:true
		});
	},
	error		: function(res){
		this.emit('error',{
			status : 'error',
			data   : arguments.length>0?res:"unknown error"
		});
	},
	exec		: function(){
		this.success();
	},
	constructor	: function(data){
		this.$ 			= data || {};
		this.$.running 	= false;
		this.$.logger  	= new Logger();

		function end (data){
			this.emit('end',data)
		}

		this.on('error',end);
		this.on('success',end);
		this.on('start',function(){
			this.$.running = true;
		});
		this.on('end',function(){
			this.$.running = false;
		})
	}
});
