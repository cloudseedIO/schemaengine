var cloudinary = require('cloudinary');
var urlParser=require('../controllers/URLParser');
//var couchbase = require('couchbase');
//var reactConfig=require('../../config/ReactConfig');
//config=reactConfig.init;
//var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress);//config.cbAddress+":"+config.cbPort
//var CouchBaseUtil=require('./CouchBaseUtil.js');
//var ContentServer=require('../ContentServer.js');
//var utility=require('./utility.js');
//var global=require('../utils/global.js');

/*cloudinary.config({ 
   cloud_name: config.clCloud_name,
   api_key: config.clAPI_key, 
   api_secret: config.clAPI_secret
});*/

var CouchBaseUtil=require('../controllers/CouchBaseUtil.js');
var Scraper = require('../bulkUpload/Scraper').Scraper;
var Queue = require('../bulkUpload/Queue').Queue;
var Job = require('../bulkUpload/Job').Queue;
var fs=require('fs');
var couchbase = require('couchbase');

var scraper;
var siteTemplate;
var queue = new Queue();


exports.service = function(request,response){
	var operationValue = request.query.operation; 
	if(operationValue == undefined){
		operationValue = urlParser.getParameterValue(request.url,"operation");
	}
	var data=urlParser.getRequestBody(request);
	if(operationValue=="test"){
		if(data.hasOwnProperty('siteTemplate') && data.hasOwnProperty('dataParseTemplate')){
			if(data.siteTemplate && data.siteTemplate.startUrl && data.siteTemplate.startUrl.constructor == Array){
				data.siteTemplate.startUrl=data.siteTemplate.startUrl[0];
    		}
			scraper = new Scraper({
				queue: queue,
				siteTemplate: data.siteTemplate,
				postProcessorJson: data.dataParseTemplate
			});
	
			scraper.run(function(processedRec){
				console.log("Scrapping Over");
				response.set( "Access-Control-Allow-Origin", "*" ); 
				response.set( "Access-Control-Allow-Methods", "GET,POST" ); 
				response.set( "Access-Control-Max-Age", "1000" );
				response.json(processedRec);
			});
		}else{
			response.send("Invalid configuration");
		}
	}else if(operationValue=="preview"){
		if(data.hasOwnProperty('sitemap')){
			if(data.sitemap && data.sitemap.startUrl && data.sitemap.startUrl.constructor == Array){
				data.sitemap.startUrl=data.sitemap.startUrl[0];
    		}
			scraper = new Scraper({
				queue: queue,
				siteTemplate: data.sitemap,
				fromPreview:true,
				postProcessorJson: data.dataParseTemplate?data.dataParseTemplate:{}
			});
	
			scraper.run(function(processedRec){
				console.log("Scrapping Over");
				response.set( "Access-Control-Allow-Origin", "*" ); 
				response.set( "Access-Control-Allow-Methods", "GET,POST" ); 
				response.set( "Access-Control-Max-Age", "1000" );
				response.json(processedRec);
			});
		}else{
			response.send("Invalid configuration");
		}
	}else if(operationValue=="saveSitemap"){
		if(data.hasOwnProperty('siteMap') && data.hasOwnProperty('dataParseTemplate')){
			CouchBaseUtil.upsertDocumentInSitemapBucket(data.recordId,data,function(result){
				console.log("Sitemap saved");
				console.log(result);
				response.set( "Access-Control-Allow-Origin", "*" ); 
				response.set( "Access-Control-Allow-Methods", "GET,POST" ); 
				response.set( "Access-Control-Max-Age", "1000" );
				response.json(result);
			})
			
	
			
		}else{
			response.send("Invalid configuration");
		}
	}else if(operationValue=="getSitemap"){
		var querystring="SELECT * FROM sitemaps WHERE meta.id()=$1";
		CouchBaseUtil.executeN1QL(querystring,{parameters:[data.id]},function(response){
			var sitemap;
			if(Array.isArray(response) && response.length>0){
				sitemap=response[0].sitemaps;
			}
			response.set( "Access-Control-Allow-Origin", "*" ); 
			response.set( "Access-Control-Allow-Methods", "GET,POST" ); 
			response.set( "Access-Control-Max-Age", "1000" );
			response.json(sitemap);
		});
	}else{
		response.send("Invalid configuration");
	}
	
	
	
	
}
