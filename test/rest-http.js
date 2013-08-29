/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/21/13
 * Time: 5:22 AM
 * To change this template use File | Settings | File Templates.
 */
var REST = require('../src/rest.js');

REST.init({
	maven			: {
		url			: 'http://maven.byus.com/content/groups/public/',
		auth		: {
			user	: 'admin',
			pass	: 'admin123'
		}
	}
});


REST.maven.get('com/byus/bu-test/0.0.5-SNAPSHOT/bu-test-0.0.5-20130820.122846-1-bin.tar.gz').on('done',function(){
	console.info(this.data);
});

