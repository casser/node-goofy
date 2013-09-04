/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/30/13
 * Time: 11:36 AM
 * To change this template use File | Settings | File Templates.
 */
var Class			= require('js-class');
var Application		= require('../src/app/app');
var Nexus			= require('../src/app/nexus');

var Rest			= require('../src/app/rest');
var Installer		= require('../src/app/installer');
var Server			= require('../src/app/server');

/*
Nexus.Service.repositories()
.on('succeed',function(response){
	Nexus.Service.repositories()
	.on('succeed',function(response){
		console.info(response);
	})
	.on('failed',function(response){
		console.info(response);
	})
})
.on('failed',function(response){
	console.info(response);
});
*/
/*
Installer.install({
	g:'com.byus',
	a:'bu-test'
})
.on('succeed',function(response){
	console.info(response);
})
.on('failed',function(response){
	console.info(response);
});
*/

/*
Installer.instance.install({
	g:'com.byus.tools',
	a:'byus-elastic'
});
*/

Server.start();