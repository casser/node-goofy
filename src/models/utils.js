var Class  = require('js-class');
var Utils = Class({},{statics:{
	merge	: function(){
		var obj = {};
		for(var i in arguments){
			if(typeof(arguments[i])==='object'){
				for(var k in arguments[i]){
					obj[k] = arguments[i][k];
				}
			}
		}
		return obj;
	}
}});

module.exports = Utils;