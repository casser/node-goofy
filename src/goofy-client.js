var REST = require('restler');

var CLIENT = REST.service(function(program) {
  	this.baseURL  = "http://localhost:2987";
},{},{
	stop: function() {
		return this.get('/stop');
	},
  	status: function() {
		return this.get('/status');
	},
	processes: function() {
		return this.get('/processes');
	},
	process: function(process) {
		return this.get('/processes/'+process);
	}
});


module.exports = function(program){
	return new CLIENT(program);
}