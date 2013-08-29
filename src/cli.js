/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/29/13
 * Time: 1:55 AM
 * To change this template use File | Settings | File Templates.
 */
var RL	 = require('readline');
var IO 	= require('./client');

var COMMANDS 	 = {};
var COMPLATIONS	 = ['.help'];

function completer(line) {
	var hits = COMPLATIONS.filter(function (c) {
		return c.indexOf(line) == 0
	})
	return [hits.length ? hits : COMPLATIONS, line];
}

var REPL = RL.createInterface({
	input		:process.stdin,
	output		:process.stdout,
	completer	:completer
})

REPL.setPrompt('goofy> ');


REPL.on('line', function(line) {
	var exe = line.trim().split(" ");
	var cmd = exe[0].trim();
	var arg = exe.splice(1);

	if(COMMANDS[cmd]){
		IO.exec(cmd,arg)
	}else{
		console.info("unknown command "+cmd);
	}
	this.prompt();
})

REPL.on('close', function() {
  console.log('Have a great day!');
  process.exit(0);
});

IO.on('connect', function () {
	console.log('connected');

	this.on('log', function(args) {
		console.log(args);
	});

	this.on('done', function(args) {
		console.info(args);
	});
	this.on('commands', function(commands) {
		for(var i in commands){
			var c = commands[i];
			COMMANDS[c.cmd] = c;
			COMPLATIONS.push(c.cmd+' ');
		}
		REPL.prompt();
	});

});
