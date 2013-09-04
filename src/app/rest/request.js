var HTTP 		= require('http');
var HTTPS 		= require('https');
var QS			= require('querystring');
var URL			= require('url');

var Class   	= require('js-class');
var Task 		= require('./task');

var Request = Class(Task,{
	get url(){
		return this.params.base+this.params.path+(
			this.params.query?'?'+QS.stringify(this.params.query):''
		)
	},
	set url(value){
		var parts = URL.parse(value);
		this.params.base 	= parts.protocol+'//'+parts.host
		this.params.path 	= parts.pathname;
		this.params.query 	= QS.stringify(parts.query);
	},
	get debug(){
		return this.params.debug;
	},
	get method(){
		return this.params.method;
	},
	get headers(){
		return this.params.headers;
	},
	get body(){
		return this.params.body;
	},
	get response(){
		return this.$.response;
	},

	constructor	: function(data){
		Task.prototype.constructor.call(this,data);
		this.on('error',function(response){
			this.failed(response);
		});
		this.on('end',function(response){
			if(response.type=='application/json'){
				this.response.body = JSON.parse(
					this.response.data.toString('utf8')
				);
			}else
			if(response.type=='application/xml'||response.type.split('/')[0]=='text'){
				this.response.body = this.response.data.toString('utf8');
			}else{
				this.response.body = this.response.data;
			}
			if(response.status>=400){
				var error = new Error(HTTP.STATUS_CODES[response.status]);
				error.code    = "HTTP_ERROR";
				error.status  = response.status;
				error.headers = response.headers;
				error.body    = response.body;
				error.params  = this.params;
				this.emit('error',error);
			}else{
				if(typeof(this.after)=='function'){
					try{
						this.succeed(this.after(this.response.body));
					}catch(err){
						this.failed(err);
					}
				}else{
					this.succeed(this.response.body);
				}
			}
		});
	},

	execute		: function(){

		if(typeof(this.before)=='function'){
			this.before(this.params);
		}

		var url	    = this.url;
		if(this.debug){
			console.info(url)
		}
		var options = URL.parse(url);
		options.method 	= this.method;
		options.headers = this.headers;

		var service = null
		switch(options.protocol){
			case 'http:' : service = HTTP;  break;
			case 'https:': service = HTTPS; break;
			default 	 : throw new Error('unknown protocol '+options.protocol);
		}

		var request = service.request(options);
		request.setSocketKeepAlive(true);
		request.setTimeout(3600*1000);
		request.on('response', function(response) {

			var chunks  = [];
			var size    = 0;

			response.on('data', function (chunk) {
				chunks.push(chunk);
				size+=chunk.length;
				this.emit('data',chunk);
			}.bind(this));

			response.on('end',function(){
				var data 	= new Buffer(size);
				var index   = 0;
				for(var i in chunks){
					var chunk = chunks[i];
					chunk.copy(data,index,0,chunk.length);
					index+=chunk.length;
				}
				this.response.data = data;
				this.emit('end',this.response);
			}.bind(this));

			this.$.response = {
				status	 : response.statusCode,
				headers  : response.headers,
				type  	 : response.headers['content-type'].split(';')[0].trim()
			};

			this.emit('response',response);
		}.bind(this));

		request.on('error',function(data){
			this.emit('error',data);
		}.bind(this));

		if(this.body){
			if(typeof(this.body)==='string'){
				request.write(this.body);
			}else{
				request.write(JSON.stringify(this.body))
			}
		}

		request.end();
		return this;
	}
});

module.exports = Request;