var REST = require('restler');

module.exports = REST.service(function(base, user, pass) {
	if(user && pass){
		this.defaults.username = user;
  		this.defaults.password = pass;
	}
  	this.baseURL  = base || "http://localhost:2987";
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
});;