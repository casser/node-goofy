var Task	= require('./task');

var TASKS 	= new (function(){

	var list 	 = {
		install	 : {
			desc : 'install application',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		remove	 : {
			desc : 'remove application',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		show	 : {
			desc : 'display application info',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		logs	 : {
			desc : 'display application logs',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		start	 : {
			desc : 'start application',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		stop	 : {
			desc : 'stop application',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		status	 : {
			desc : 'display application status',
			exec : function(opt){
				this.done({id:opt});
			}
		},
		apps	 : {
			desc : 'display application status',
			exec : function(opt){
				this.done({id:opt});
			}
		}
	};

	this.list = function(){
		var ret = [];
		for(var i in list){
			ret.push({
				cmd : i,
				dsc : list[i].desc
			});
		}
		return ret;
	};

	this.get  = function(name) {
		return list[name];
	};

	this.has   = function(name){
		return this.get(name)?true:false;
	};
})();

var TASK    = null;
var LIST	= [];

module.exports = {
	setup : function(socket){
		socket.on('exec',function(msg){
			console.log(msg);
		});
		socket.emit('commands',TASKS.list());
	}
}

function process(){
	if((TASK==null || !TASK.running()) && LIST.length>0){
		var command = LIST.pop();
		var socket  = command[0];
		var task  	= command[1];
		var args 	= command.splice(2);
		if(TASKS.has(task)){
			TASK = new Task(task);
			TASK.run(socket,args);
		}
	}
}

setInterval(process,1000);
