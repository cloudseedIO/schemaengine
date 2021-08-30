var urlParser=require('./URLParser');

exports.service = function(request,response){
	response.contentType("application/json");
	response.header("Cache-Control", "public, max-age=86400");
	var url = request.query.url; 
	if(url == undefined){
		url = urlParser.getParameterValue(request.url,"url");
	}
	//console.log(url);
	var htmlString="";
	var scrappedPage={
			"webSite":url,
			"titles":[],
			"data":{},
			"links":{},
			"images":[]
	};
	
	if(url.indexOf("https")>-1){
		require('https').get(url, function(res) {
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				sendParsedData();
			})
		}).on('error', function(e) {
			console.log(e);
			sendParsedData();
		});
	}else{
		if(url.indexOf("http://")==-1){
			url="http://"+url;
		}
		/*
		url=url.replace("http://","");
		var options = {
				host: url.indexOf("/")>-1?url.substr(0,url.indexOf("/")):url,
				port: url.indexOf("/")>-1?(url.substr(0,url.indexOf("/")).indexOf(":")>-1?url.substr(0,url.indexOf("/")).split(":")[1]:80):80,
				path: url.indexOf("/")>-1?url.substr(url.indexOf("/")):"/"
		};
		console.log(options);
		*/
		require('http').get(url, function(res) {
			
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				sendParsedData();
			})
		}).on('error', function(e) {
			console.log(e);
			sendParsedData();
		});
	}
	
	function sendParsedData(){
		var $ = require('cheerio');
		var parsedHTML = $.load(htmlString);
		parsedHTML('meta').map(function(i, node) {
			if($(node).attr("name") != undefined && $(node).attr("name") != "undefined" ){
				scrappedPage.data[$(node).attr("name")]=$(node).attr("content");
			}
		});
		parsedHTML('img').map(function(i, node) {
			scrappedPage.images.push($(node).attr("src"));
		});
		parsedHTML('title').map(function(i, node) {
			scrappedPage.titles.push($(node).text());
		});
		parsedHTML('link').map(function(i,node) {
			if($(node).attr("rel") != undefined && $(node).attr("rel") != "undefined" ){
				scrappedPage.links[$(node).attr("rel")]=$(node).attr("href");
			}else  if($(node).attr("itemprop") != undefined && $(node).attr("itemprop") != "undefined" ){
				scrappedPage.links[$(node).attr("itemprop")]=$(node).attr("href");
			}
		});
		response.send(scrappedPage);
	}
};