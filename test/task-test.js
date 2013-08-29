var Models  = require('../src/models');

var install = new Models.Tasks.Install();

install.on('end',function(args){
	console.log("install complete");
	console.log(args);
	console.log(this.logger.logs);
});

install.run();

