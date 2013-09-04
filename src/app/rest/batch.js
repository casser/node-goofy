var Class   	= require('js-class');
var Task 		= require('./task');

var Batch	= Class(Task,{

	get tasks(){
		return this.$.tasks;
	},
	get results(){
		return this.$.results;
	},
	get context(){
		return this.$.context;
	},
	constructor	: function(params){
		Task.prototype.constructor.call(this,params);
		this.$.tasks 	= [];
		this.$.results	= [];
		this.$.context	= {};
		if(params.tasks){
			for(var i in params.tasks){
				this.push(params.tasks[i]);
			}
		}
	},
	push		: function(task){
		if(Class.is(task).an(Task)){
			this.tasks.push(task);
		}else{
			throw new Error('invalid task');
		}
	},
	execute		: function(){
		try{
			var result = this.before(this);
			if(!result){
				this.next();
			}else{
				setTimeout(function(){
					this.succeed(result,true);
				}.bind(this),100);
			}
		}catch (err){
			this.failed(err);
		}
	},
	next		: function(){
		if(this.tasks.length){
			var task = this.tasks.shift();
			task.on('succeed',function(result){
				this.process('succeed',task,result);
			}.bind(this))
			task.on('failed',function(result){
				this.process('failed',task,result);
			}.bind(this))
			if(typeof(task.initialize)==='function'){
				try{
					if(!task.initialize(this)){
						this.service.execute(task);
					}else{
						this.next();
					}
				}catch (err){
					this.failed(err);
				}
			}else{
				this.service.execute(task);
			}
		}else{
			this.succeed(this.context);
		}
	},
	process		: function(status,task,result){
		if(typeof(task.finalize)==='function'){
			try{
				if(task.finalize(this,result)){
					this.next()
				}else{
					this.succeed(this.context);
				}
			}catch(err){
				this.failed(err);
			}
		}else{
			if(task.id){
				this.context[task.id] = result;
			}
			this.next();
		}
	},
	succeed			: function(data,skipAfter){
		if(!skipAfter){
			Task.prototype.succeed.call(this,
				this.after('succeed',data)
			);
		}else{
			Task.prototype.succeed.call(this,data);
		}
	},
	failed			: function(data,skipAfter){
		if(!skipAfter){
			Task.prototype.failed.call(this,
				this.after('failed',data)
			);
		}else{
			Task.prototype.failed.call(this,data);
		}
	},
	before		: function(status,result){
		return false;
	},
	after		: function(status,result){
		return result;
	}
});

module.exports = Batch;