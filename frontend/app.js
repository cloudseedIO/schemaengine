/**
 * @author Vikram
 * creation Date 08-12-2014
 */

var config=require('../config/ReactConfig');
config=config.init;

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var https = require('https');
//var React=require('react');
var JSX=require('node-jsx').install();
var expressHandlebars=require('express-handlebars');

var fs = require('fs');

var app = express();
var compression = require('compression');
app.use(compression());
var cs=require('./ContentServer.js');
var logger=require('./utils/logseed.js').logseed;

var WebAPI= require('./utils/NodeWebAPIUtils.js');

var http;
var httpsServer;

if(config.Front_End_Deploy_Protocol  && config.Front_End_Deploy_Protocol=="http"){
	http = require('http').Server(app);
	http.listen(config.Front_End_Deploy_Port,function(){//config.Front_End_Deploy_Port
		console.log('HTTP:  Express app started on port '+config.Front_End_Deploy_Port);
	});
}else{
	httpsServer = https.createServer(config.sslOptions, app);
	httpsServer.listen(config.Front_End_Deploy_Port,function(){//config.Front_End_Deploy_Port
		console.log('HTTPS:  Express app started on port  '+config.Front_End_Deploy_Port);
	});
}


// view engine setup
app.engine('handlebars', expressHandlebars({defaultLayout: 'main', extname: 'handlebars'}));
app.set('view engine', 'handlebars');
var age=60*60*1000;//60 minutes
age=24*60*60*1000;//8 hours
app.use(express.static(path.join(__dirname + '/views'),{ maxAge: age }));
app.set('views', path.join(__dirname + '/views'));

app.use(cookieParser());
app.enable('view cache');

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));


process.on('uncaughtException', function (error) {
	logger.error({type:"uncaughtException",error:error.message,stack:error.stack});
});

app.get('/activate', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveActivatePage(request,response);
});

app.get('/join', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveJoinPage(request,response);
});

app.get('/myprojects', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
});

app.get('/myfirms', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
});

app.get('/sitemapUploader', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
});

app.get('/requirementsUploader', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
});

app.get('/mfrReports', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
});

app.get('/manufacturerInfo', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
});

app.get('/resetpassword', function(request, response) {
	if(checkForProceedingNoIE(request,response))
	cs.serveChangePasswordPage(request,response);
});

app.get('/logout', function(request, response){
	if(checkForProceedingNoIE(request,response))
	WebAPI.logout(function(){
		response.redirect("/");
	});
	/*request.session.destroy(function(err){
	     response.redirect("/");
	});*/
});
app.post('/analytics',function(request,response){
	var hostname = request.headers.host.split(":")[0];
	var clientIP=request.headers['X-Real-IP'] || request.connection.remoteAddress;
	var ua=request.headers['user-agent'];
	//logger.info("New Request to  "+hostname+" <----- From  "+clientIP+"  :  "+ua+" --> on "+new Date());
	var logdata={
		type:"New Request",
		hostName:hostname,
		url:request.url,
		clientip:"124.123.85.116",
		userAgent:ua,
		date:new Date().toString()		
	};
	var requestbody=request.body;
	for(var key in requestbody){
		logdata[key]=requestbody[key];
	}
	
	var net = require('net');
	var logHost = 'localhost', logPort = 5044, sender = require('os').hostname();
	var conn = net.createConnection({host: logHost, port: logPort}, function() {
		
		logdata.sender=sender;
		console.log(logdata);
		conn.write(JSON.stringify(logdata));
		console.log("Log written to logstash")
		//process.exit(0);
		conn.end();
		response.send({});
	}).on('error', function(err) {
		console.error(err);
		response.send({});
	});
});

app.get('/favicon.ico',function(request,response){
	var hostname = request.headers.host.split(":")[0];
	cs.getFavicon(hostname,function(favIcon){
		response.sendFile(__dirname+"/views/branding/"+(favIcon?favIcon:"schemaengine.png"));
	});
})
app.get("/refresh",function(request,response){
	WebAPI.refresh(function(){
		var hostname=request.headers.host.split(":")[0];
		if(checkForProceedingNoIE(request,response))
		cs.getCloudPointConfig(hostname,function(){
			response.redirect('/');
		},"forceUpdate");
	});
})

/*app.get("/getPdf/:id",function(request,response){
	logger.info({type:"getPDF",id:request.params.id});
	//pdfGenerator.generatePDF(request,response);
});*/
app.get("/refreshHostsAndConfigIds",function(request,response){
	WebAPI.refreshHostsAndConfigIds(function(){
		response.redirect("/");
	});
	/*cs.getHostsAndConfigIds(function(){	});*/
});
function sendHeaders(response){
	response.set('Content-Type', 'text/html');
	response.write(fs.readFileSync(__dirname+'/views/headers.html'));
}
app.get("/",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveRootPage(request,response);

});

/*
app.get('/s/:org/:schema/', function(request, response){
	console.log("Requested path : /s/:org/:schema");
	cs.serveSummary(request,response)
});*/
app.get('/smry/:org/:schema/', function(request, response){
	if(checkForProceedingNoIE(request,response))
	response.redirect("/views/pageNotFound");
	//response.redirect(linkGenerator.getSummaryLink({org:request.params.org,schema:request.params.schema,dependentSchema:request.query.ds,filters:request.query.flts}));
	/*cs.serveSummary(request,response)*/
});


app.get('/s/:identifier/:schema',function(request,response){
	request.params.org=(typeof request.query.org=="undefined" || request.query.org=="undefined")?"public":request.query.org;
	if(checkForProceedingNoIE(request,response))
	cs.serveSummary(request,response)
})



/*
app.get('/d/:org/:schema/:recordId', function(request, response){
	console.log("Requested path : /d/:org/:schema/:recordId");
	cs.processRecordRequest(request,response);
});*/
app.get('/dtl/:org/:schema/:recordId', function(request, response){
	if(checkForProceedingNoIE(request,response))
	response.redirect("/views/pageNotFound");
	//response.redirect(linkGenerator.getDetailLink({org:request.params.org,schema:request.params.schema,recordId:request.params.recordId,dependentSchema:request.query.ds,filters:request.query.flts}));
	/*cs.processRecordRequest(request,response);*/
});


app.get('/d/:identifier/:identifier2/:recordId',function(request,response){
	request.params.org=(typeof request.query.org=="undefined" || request.query.org=="undefined")?"public":request.query.org;
	if(checkForProceedingNoIE(request,response))
			cs.processRecordRequest(request,response);
})
app.get('/gv/:schema/:viewName/:displayName',function(request,response){
	console.log("request and response",request,response)
	if(checkForProceedingNoIE(request,response)){
		request.params.org=(typeof request.query.org=="undefined" || request.query.org=="undefined")?"public":request.query.org;
		var body={
				schema:request.params.schema,
				viewName:request.params.viewName,
				text:request.params.text,
				displayName:request.params.displayName,
				org:request.params.org
		};
		if(request.query && typeof request.query=="object"){
			for(var i=0;i<Object.keys(request.query).length;i++){
				body[Object.keys(request.query)[i]]=request.query[Object.keys(request.query)[i]];
			}
		}
		request.body=body;
		cs.serveGroupView(request,response);
	}
})
app.get("/siteSpecific/:id",function(request,response){
	logger.info({type:"siteSpecific",id:request.params.id});
	request.params.siteSpecific=true;
	if(checkForProceedingNoIE(request,response))
	cs.serveSlugPath(request,response);
})
app.get("/:id",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveSlugPath(request,response);
});

app.get("/views/pageNotFound",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.servePageNotFound(request,response);
});

app.get("/coe*",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
})


app.get("/as*",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
})
app.get("/admin*",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
})

app.get("/discover/:id",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveExplorePage(request,response);
})

app.get("/org/:id",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveOrgPage(request,response);
})

app.get("/srch*",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveAdminSpecificPage(request,response);
})

app.get("/:id/:path",function(request,response){
	if(checkForProceedingNoIE(request,response))
	cs.serveSlugPath(request,response);
});



process.on('SIGINT', function() {
	logger.debug("Server Shutting down...");
	process.exit();
});
//SIGTERM,SIGKILL




function checkForProceedingNoIE(request,response) {
	var hostname = request.headers.host.split(":")[0];
	var clientIP=request.headers['X-Real-IP'] || request.connection.remoteAddress;
	var ua=request.headers['user-agent'];
	//logger.info("New Request to  "+hostname+" <----- From  "+clientIP+"  :  "+ua+" --> on "+new Date());
	logger.info({
		type:"New Request",
		hostName:hostname,
		url:request.url,
		clientIP:clientIP,
		userAgent:ua,
		date:new Date().toString()
	});

	if(hostname=="schemaengine.com"){
		if(!request.headers.host.match(/^www\..*/i)) {response.redirect(301, config.deployProtocol+"://www." +  request.headers.host + request.url);return;}
	}

	if(clientIP==undefined){
		console.log("client ip undefined");
		console.log(request.originalUrl);
		response.set('Content-Type', 'text/html');
		response.write('Invalid clientIP');
		response.end();
		return false;
	}



	var ie=false;
	var msie = ua.indexOf('MSIE');
	if (msie > 0) {
		ie=true;
	}
	var trident = ua.indexOf('Trident/');
	if (trident > 0) {
		var rv = ua.indexOf('rv:');
		ie=true;
	}
	if(ie){
		response.set('Content-Type', 'text/html');
		response.write("<div style='box-shadow:none;text-align:center;'>"+
							             "<div>"+
							             	"<img src='/branding/schemaengine.png' class='form-group' />"+
      									"<h2><div>OOPS!</div><div>YOUR BROWSER IS NOT SUPPORTED</div></h2>"+
      									"<h5 style='font-family:Roboto Slab;font-weight:100;'>To view this page, please use one of these modern, secure and standards complaint browsers</h5>"+
      									"<div>"+
          									"<a href='http://getfirefox.com' style='font-size:16px' target='_blank'><span style='color:#143dff'>Firefox</span></a>, &nbsp;"+
          									"<a href='https://www.google.com/chrome/browser/desktop/index.html'  target='_blank' style='font-size:16px'}><span style='color:#143dff'>Chrome</span></a>,&nbsp;"+
          									"<a href='http://www.apple.com/safari/' style='font-size:16px'  target='_blank'><span style='color:#143dff'>Safari</span></a>,&nbsp;"+
												"<a href='https://www.microsoft.com/en-us/download/details.aspx?id=48126' target='_blank'><span style='color:#143dff'>Edge</span></a>.</div>"+
						                    "</div>"+
      									"<h3>Thank You!</h3>"+
  									"</div>"+
						               "</div>");
		response.end();

		return false;
	}else{
		return true;
	}
}
