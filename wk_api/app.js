/**
 * @author Vikram
 * creation Date 08-12-2014
 */

var config=require('../config/ReactConfig');
config=config.init;

var path 				= require('path');
var express 		= require('express');
var bodyParser 	= require('body-parser');
var cookieParser= require('cookie-parser');
var https 			= require('https');
var fs 					= require('fs');
var compression = require('compression');
var cors				= require('cors');
var GenericController				= require('./controllers/GenericController.js');
var SchemaController				= require('./controllers/SchemaController.js');
var UserController					= require('./controllers/UserController.js');
var TriggerController				=	require('./controllers/TriggerController.js');
var ElasticSearch						=	require('./controllers/ElasticSearch.js');
var RestApiServiceController=	require('./controllers/RestApiServiceController.js');
var KeywordController				=	require('./controllers/KeywordController')
var CouchBaseUtil						=	require('./controllers/CouchBaseUtil');
var pdfGenerator						=	require('./controllers/pdfGenerator.js');
var mfrReportsPDF						= require('./controllers/mfrReportsPDF.js');
var MessagingReports				=	require('./controllers/MessagingReports.js');
var NewsLetter							=	require('./controllers/NewsLetter.js');
var URLScrapper							=	require('./controllers/URLScrapper.js');
var urlParser								=	require('./controllers/URLParser');
var ScrapperService					=	require('./services/ScrapperService.js');
var logger 									= require('./services/logseed').logseed;
var cs=require('./ContentServer.js');

var app = express();
app.use(compression());
var http;
var httpsServer;

if(config.API_Deploy_Protocol  && config.API_Deploy_Protocol=="http"){
	http = require('http').Server(app);
	try{
		require('./controllers/socket.io.js').createSocketIO(http);
	}catch(err){
		console.log("error occured while creating socketio with HTTP server");
	}
	http.listen(config.API_Deploy_Port,function(){//config.API_Deploy_Port
		console.log('HTTP:  Express app started on port '+config.API_Deploy_Port);
	});
}else{
	httpsServer = https.createServer(config.sslOptions, app);
	try{
		require('./controllers/socket.io.js').createSocketIO(httpsServer);
	}catch(err){
		console.log("error occured while creating socketio with HTTPS server");
	}
	httpsServer.listen(config.API_Deploy_Port,function(){//config.API_Deploy_Port
		console.log('HTTPS:  Express app started on port  '+config.API_Deploy_Port);
	});
}


var age=60*60*1000;//60 minutes
age=24*60*60*1000;//8 hours
app.use(cookieParser());
var expressSession = require('express-session');
var CouchbaseStore = require('connect-couchbase')(expressSession);

/*var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress);
cluster.authenticate(config.cbUsername, config.cbPassword);
var couchbaseStore = new CouchbaseStore({
	db:cluster.openBucket("sessions")
});*/

var couchbaseStore 	 = new CouchbaseStore({
    bucket:"sessions",
    password:"eb586c9c77a615760b135e67c38b0c9c",
    host:config.cbAddress+":"+config.cbPort
});
app.use(expressSession({
	secret:'fIrsT IndiAs E-cOmMeRce wITh sOciAl n/W APPlication',
	store:couchbaseStore,
	resave: false,//Forces the session to be saved back to the session store, even if the session was never modified during the request.
	saveUninitialized: false,//false option makes initial session created is not saved after modification it is saved
	cookie: { maxAge: 8*60*60*1000 }//24*60*60*1000 one day
}));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
var whitelist = config.API_whitelist_domains;
var corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}
/*{
	origin: 'https://localhost',
  credentials: true,
}*/
app.use(cors(corsOptions));
//bearer
//regenerating session ids

process.on('uncaughtException', function (error) {
	logger.error({type:"uncaughtException",error:error.message,stack:error.stack});
});


app.post('/trigger', function(request, response) {
	TriggerController.service(request,response);
});

app.post('/restApiService', function(request, response) {
	RestApiServiceController.service(request,response);
});
app.get('/restApiService', function(request, response) {
	RestApiServiceController.service(request,response);
});



app.get('/exotel', function(request, response){
   require('./services/messageService').exotelSerice(request,response);
});

app.get('/logout', function(request, response){
	request.session.destroy(function(err){
	    response.set('Content-Type', 'text/html');
			response.write('Logout Success');
			response.end();
	});
});


app.post('/scrape', function(request, response) {
	ScrapperService.service(request,response);
});

app.post('/schema', function(request, response) {
	SchemaController.service(request,response);
});
app.post('/user', function(request, response) {
	UserController.service(request,response);
});
app.get('/user', function(request, response) {
	UserController.service(request,response);
});
app.get('/generic', function(request, response){
	GenericController.service(request,response);
});
app.post('/generic', function(request, response){
	GenericController.service(request,response);
});
app.get('/messaging', function(request, response){
	MessagingReports.service(request,response);
});
app.post('/messaging', function(request, response){
	MessagingReports.service(request,response);
});
app.get('/newsletter', function(request, response){
	NewsLetter.service(request,response);
});
app.post('/newsletter', function(request, response){
	NewsLetter.service(request,response);
});
app.get('/keywords',function(request,response){
	KeywordController.service(request,response);
});
app.post('/keywords',function(request,response){
	KeywordController.service(request,response);
});
app.get('/elastic', function(request, response){
	ElasticSearch.service(request,response);
});
app.post('/elastic', function(request, response){
	ElasticSearch.service(request,response);
});
app.get('/search', function(request, response){
	ElasticSearch.service(request,response);
});
app.post('/search', function(request, response){
	ElasticSearch.service(request, response);
});

app.get('/getURLContent',function(request,response){
		URLScrapper.service(request,response);
});

app.get("/refresh",function(request,response){
	var hostname=request.headers.host.split(":")[0];
	cs.getCloudPointConfig(hostname,function(){
		response.set('Content-Type', 'text/html');
		response.write('Config refresh success');
		response.end();
	},"forceUpdate");
})

app.get("/getPdf/:id",function(request,response){
	logger.info({type:"getPDF",id:request.params.id});
	pdfGenerator.generatePDF(request,response);
});

app.get("/mfrReportsPDF/",function(request,response){
	var data=urlParser.getRequestBody(request);
	logger.info({type:"mfrReportsPDF",data:data});
	mfrReportsPDF.generatePDF(request,response);
});

app.get("/refreshHostsAndConfigIds",function(request,response){
	cs.getHostsAndConfigIds(function(){
		response.set('Content-Type', 'text/html');
		response.write('Host and Congigs refresh success');
		response.end();
	});
});

app.post("/mobileAppBootData",function(request,response){
	cs.getBootData(request,response);
});
app.post("/getBootData",function(request,response){
	cs.getBootData(request,response);
});
app.get("/mobileAppBootData",function(request,response){
	cs.getBootData(request,response);
});
app.get("/getBootData",function(request,response){
	cs.getBootData(request,response);
});

/*
 * For
 * http://www.citruspay.com/DevelopersGuide/citrushosted/responseHandling.html
 *
 * Payment Related URLs
 * */
app.get('/views/checkOutPage', function(request, response){
    var session=request.session;
    if(session.userData && session.paymentData){
        logger.debug(session.paymentData);
        if(session.paymentData.isNewTxn){
            response.render("checkOutPage", session.paymentData);
        }else{
            response.redirect("/");
        }

    }else{
        response.redirect("/");
        return;
    }

});
app.get('/get/paymentResult', function(request, response){
    response.redirect("/");
});
app.post('/get/paymentResult', function(request, response){
    var body;
    try {
        var txnData = request.body;
        var session=request.session;
        var paymentData=session.paymentData;

        txnData['docType']='PaymentReceipt';
        txnData['author']=session.userData.userId;
        GenericController.saveRecord(txnData, function(){
            if( paymentData.merchantTxnId == txnData.TxId &&
                    paymentData.amount==txnData.amount&&
                    paymentData.txnSignature==txnData.signature&&
                    txnData.TxStatus=="SUCCESS"
                    ){
                var table="<table>";
                for(var key in txnData){
                    table+="<tr><td>"+key+"</td><td>"+txnData[key]+"</td></tr>";
                }
                response.writeHead(200, { "Content-Type": "text/html" });
                response.write("<html><head></head><body>"+table+"</body></html>");
            }else{
                var table="<table>";
                for(var key in txnData){
                    table+="<tr><td>"+key+"</td><td>"+txnData[key]+"</td></tr>";
                }
                response.writeHead(200, { "Content-Type": "text/html" });
                response.write("<html><head></head><body>"+table+"</body></html>");
            }
            response.end();
        },request);


    } catch (err2) {
        logger.error(err2);
    }
});
app.get('/getTxnDtls', function(request, response){
    response.contentType("text/html");
    response.sendFile("views/txnDetails.html", {root: __dirname });
});

app.get('/getSign', function(request, response){
    //retrieve amount from session
    var amount;
    if(request.session && request.session.paymentData && request.session.paymentData.amount){
        amount=request.session.paymentData.amount;
        require("./services/citrusPayBySK").generateSignature(amount, function(sign){
            response.contentType("application/json");
            response.send(sign);
        });
    }else{
        logger.error("Generating signature");
        response.contentType("application/json");
        response.send({"error":"required data is missing.Kindly check for log."});
    }


});

app.post('/getTxnDtls', function(request, response){
    require("./services/citrusPayBySK").getTxnDetails(request, response, function(sign){
        response.contentType("application/json");
        response.send(sign);
    })
});
/*Payment closed*/


process.on('SIGINT', function() {
	logger.debug("Server Shutting down...");
	CouchBaseUtil.shutDown();
	process.exit();
});
//SIGTERM,SIGKILL
