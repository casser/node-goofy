/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/30/13
 * Time: 10:03 AM
 * To change this template use File | Settings | File Templates.
 */

var Class = require('js-class');

var CONST = {
	VER_REGEXP : /^((\d+)(\.(\d+)(\.(\d+))?)?)(-[a-zA-Z0-9.\-_]+)?$/i
}

module.exports = Class({

	constructor : function (value) {

		var v = value.match(CONST.VER_REGEXP);
		if(!v){
			throw new Error('invalid version "'+pkg+'"');
		}else{
			this.$ = {
				maj:v[2],
				min:v[4],
				inc:v[6],
				ext:v[7]
			}
			if(value != this.toString()){
				throw new Error('cant parse version '+this.toString());
			}
		}
	},

	isSnapshot :function(){
		return (this.ext() && this.ext().match(/^.*-SNAPSHOT$/i))?true:false;
	},

	maj : function(){
		return this.$.maj;
	},

	min : function(){
		return this.$.min;
	},

	inc : function(){
		return this.$.inc;
	},

	ext : function(){
		return this.$.ext;
	},

	toString : function(){
		return (
			(this.maj())+
			(this.min()!=null?'.'+this.min():'')+
			(this.inc()!=null?'.'+this.inc():'')+
			(this.ext()!=null?this.ext():'')
		);
	},

	json : function(){
		return this.toString();
	}

});
