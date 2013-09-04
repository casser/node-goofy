var Class   	= require('js-class');
var Task 		= require('./task');
var Batch 		= require('./batch');
var Request		= require('./request');

var Service 	= Class({

	get params (){
		return this.$.params;
	},
	set params (params){
		this.$.params = params
	},

	constructor	: function(params){
		this.$  = {
			params  : params
		};
	},

	request		: function(params){
		var request;
		if(Class.is(params).an(Request)){
			request = params;
		}else{
			request = new Request(params);
		}
		return this.execute(request);
	},

	batch		: function(params){
		var request;
		if(Class.is(params).an(Batch)){
			request = params;
		}else{
			request = new Batch(params);
		}
		return this.execute(request);
	},

	execute	: function(request){
		if(Class.is(request).an(Task)){
			return request.run(this);
		}else{
			throw new Error("Cant execute task");
		}
	}

});

module.exports = Service;