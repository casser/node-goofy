/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/30/13
 * Time: 10:03 AM
 * To change this template use File | Settings | File Templates.
 */

var Class = require('js-class');

module.exports = Class({

	constructor : function () {
		// this is the constructor
		this.$ = {
			buffer: [],
			pending: []
		};
	},

	log : function(channel,data){

		var buffer = this.$.buffer;
		var pending= this.$.pending;

		if(pending[channel]){
			data = pending[channel]+data
		}
		var chunk = data.replace(/\r+/,'').split(/\n+/);
		for(var i=0;i<chunk.length;i++){
			var line = chunk[i];
			if(i==chunk.length-1){
				if(line==""){
					buffer.unshift({t:channel,l:line});
					pending[channel]=null;
				}else{
					pending[channel]=line;
				}
			}else{
				buffer.unshift({t:channel,l:line});
			}
		}
		if(buffer.length>1010){
			buffer = buffer.splice(0,1000);
		}
	},

	err 	: function(data){
		this.log('ERR',data);
	},

	out 	: function(data){
		this.log('OUT',data);
	},

	json 	: function(){
		return this.$.buffer;
	}
});