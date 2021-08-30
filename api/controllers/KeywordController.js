/**
 * @author Vikram Jakkampudi
 */
var urlParser=require('./URLParser');
var ContentServer=require('../ContentServer.js');
var CouchBaseUtil=require('./CouchBaseUtil');

exports.service = function(request,response){
	response.contentType("application/json");
	response.header("Cache-Control", "no-cache");
	var operationValue = urlParser.getRequestQuery(request).operation; 
	var body=urlParser.getRequestBody(request);
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	switch(operationValue){
		case "getKeywords":
			CouchBaseUtil.getKeywords(body.keyword,function(data){
				var keywords=[];
				if(Array.isArray(data)){
					data.map(function(row){
						keywords.push(row.value);
					});
				}
				response.send(keywords);
			})
		break;
		
		case "saveKeyword":
			CouchBaseUtil.createKeyword(body.keyword,function(data){
				response.send(data);
			});
		break;
		
		default:
			response.send({"error":"invalid request"});
		break;
	}
};

