/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/29/13
 * Time: 1:37 AM
 * To change this template use File | Settings | File Templates.
 */
var io = io || require('socket.io-client');

io = io.connect('http://localhost:2987');

io.cid = function(){
	return (this.rid?++this.rid:(this.rid=1));
}

io.exec = function(command,args){
	this.emit('exec',{
		cid : this.cid(),
		cst : new Date().getTime(),
		cmd : command,
		arg : args
	});
	return args;
}

if(module){
	module.exports = io;
}