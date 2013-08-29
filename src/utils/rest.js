/**
 * Created with IntelliJ IDEA.
 * User: Sergey
 * Date: 8/21/13
 * Time: 3:19 AM
 * To change this template use File | Settings | File Templates.
 */
var HTTP   = require('http');
var HTTPS  = require('https');
var EVENTS = require('events');
var URL    = require('url');
var QS	   = require('querystring');

function is(obj,type){
	return (typeof(obj) == type);
}
function isAbsolute(url){
	return url!=null && url.match(/((https|http):)?\/\//)!=null;
}

function patch(){
	var obj = {};
	for(var i in arguments){
		if(is(arguments[i],'object')){
			for(var k in arguments[i]){
				obj[k] = arguments[i][k];
			}
		}
	}
	return obj;
}

function parse(args,settings){
	var res = settings, request;
	if(args.length>0){
		request = args[0];
		if(is(request,'string')){
			request = {url:request};
		}
		if(!isAbsolute(request.url)){
			if(is(request.url,'string')){
				request.url = res.url+request.url
			}else{
				request.url = res.url;
			}
		}else{
			request.url = request.url || res.url;
		}
		request.method = res.method || request.method;
	}
	if(args.length>1){
		if(is(args[1],'object')){
			if(request.method=='GET' || args.length>2){
				request.params = patch(request.params,args[1]);
			}else{
				request.body   = patch(request.body,args[1]);
			}
		}
	}
	if(args.length>2){
		request.body   = patch(request.body,args[2]);
	}
	if(res.headers){
		request.headers = patch(res.headers,request.headers);
	}
	if(res.params){
		request.params = patch(res.params,request.params);
	}
	return request;
}
function b64(string){
	return new Buffer(string).toString('base64');
}

function HttpRequest(parsers){
	EVENTS.EventEmitter.call(this);
	this.parsers = parsers;
}
HttpRequest.prototype.__proto__ = EVENTS.EventEmitter.prototype;
HttpRequest.prototype.send = function(options){
	var emi = this;
	try{
		var opt = URL.parse(options.url);
		opt.method  = options.method;
		opt.headers = options.headers;

		var web 	= opt.protocol=='https'?HTTPS:HTTP;
		var req = web.request(opt, function(res) {
			emi.headers = res.headers;


			var chunks  = [];
			var size    = 0;
			res.on('data', function (chunk) {
				chunks.push(chunk);
				size+=chunk.length;
				emi.emit('data',chunk);
			});

			res.on('end',function(){
				emi.data 	= new Buffer(size);
				var index   = 0;
				for(var i in chunks){
					var chunk = chunks[i];
					chunk.copy(emi.data,index,0,chunk.length);
					index+=chunk.length;
				}
				if(is(emi.parsers.response,'function')){
					emi.parsers.response(emi);
				}
				emi.emit('done');
			})
		});
		req.on('error', function(error){
			emi.emit('error',error);
		});
		if(options.body){
			if(!is(options.body,'string')){
				req.write(JSON.stringify(options.body))
			}else{
				req.write(options.body);
			}
		}
		req.end();
	}catch(er){
		emi.emit('error',er);
	}
	return this;
}


function HttpService(settings){
	var config = this.config = settings||{};
	this.get    = function(){
		return this.request(parse(arguments,patch(config,{method : 'GET'})));
	}
	this.post   = function(){
		return this.request(parse(arguments,patch(config,{method : 'POST'})));
	}
	this.put    = function(){
		return this.request(parse(arguments,patch(config,{method : 'PUT'})));
	}
	this.del    = function(){
		return this.request(parse(arguments,patch(config,{method : 'DELETE'})));
	}
	this.head   = function(){
		return this.request(parse(arguments,patch(config,{method : 'HEAD'})));
	}
	this.headers = function(){
		if(arguments.length==0){
			return config.headers||(config.headers={});
		}else
		if(arguments.length==1){
			return this.headers()[arguments[0]];
		}else{
			this.headers()[arguments[0]]=arguments[1];
			return this;
		}
	}
	this.params = function(){
		if(arguments.length==0){
			return config.params||{};
		}else
		if(arguments.length==1){
			return this.params()[arguments[0]];
		}else{
			this.params()[arguments[0]]=[arguments[1]];
			return this;
		}
	}
	this.request = function(options){
		var url 	= URL.parse(options.url);
		options.params = patch(QS.parse(url.query),options.params);
		var qs = QS.stringify(options.params);
		if(qs!=""){
		  qs="?"+qs
		}
		options.url    = url.protocol+'//'+url.host+url.pathname+qs;
		return new HttpRequest(config.parsers).send(options);
	}
	if(config.auth){
		this.headers('authorization','basic '+b64(config.auth.user+':'+config.auth.pass));
	}
	for(var s in config.api){
		this[s] = config.api[s];
	}

}


function HttpServices(){
	this.init = function(config){
		if(config.services){
			for(var s in config.services){
				this[s] = new HttpService(config.services[s]);
			}
		}
		if(config.api){
			for(var s in config.api){
				this[s] = config.api[s];
			}
		}

	}
}

module.exports = new HttpServices();