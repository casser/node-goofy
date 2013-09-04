var Class   	= require('js-class');
var Emmiter 	= require('../emmiter');
var Utils   	= require('../utils');

var Task		= Class(Emmiter,{
	get id(){
		if(typeof(this.params)=='object'){
			return this.params.id;
		}
	},
	get service (){
		return this.$.service;
	},
	set service (service){
		this.$.service = service
	},
	get params  (){
		return this.$.params;
	},
	set params  (params){
		this.$.params = params
	},

	constructor	: function(params){
		this.$  = {
			params  : params
		};
	},
	succeed		: function(message){
		this.emit('succeed',message||this.$);
	},
	failed		: function(error){
		this.emit('failed',error||Utils.patch(new Error(),this.$));
	},
	run			: function(service){
		this.service = service;
		if(this.service.params){
			this.params  = Utils.patch(
				this.service.params , this.params
			)
		}
		this.execute();
		return this;
	},
	execute		: function(){
		setTimeout(this.succeed.bind(this),100);
	}
});

module.exports = Task;