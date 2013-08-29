var Class  = require('js-class');
var Task   = require('../task.js');

module.exports = Class(Task,{
	get name(){
		return "install";
	},
	exec	: function(args){
		this.logger.info('install started '+args);
		setTimeout(function(){
			Task.prototype.exec.call(this,'install done');
		}.bind(this),5000);
		this.logger.info('install end '+args);
	}
});
