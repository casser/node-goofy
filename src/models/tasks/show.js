var Class  = require('js-class');
var Task   = require('../task.js');

module.exports = Class(Task,{
	get name(){
		return "show";
	},
	exec	: function(){
		Task.prototype.exec.call(this,'show done');
	}
});
