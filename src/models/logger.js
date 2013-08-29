var Class  = require('js-class');
var Utils  = require('./utils');

var Logger = Class({
	get	logs(){
		return this.$;
	},
	error 	: function(args){
		this.log({l:'e',d:res});
	},
	warning	: function(res){
		this.log({l:'w',d:res});
	},
	info	: function(res){
		this.log({l:'i',d:res});
	},
	log		: function(res){
		this.$.push(Utils.merge(res,{
			t:new Date().getTime()
		}));
	},
	constructor	: function(data){
		this.$ 	= [];
	}
});

module.exports = Logger;