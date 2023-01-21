var urlParser=require('url');
function parseURL(urlString){
	try{
		return urlParser.parse(urlString,true);
	}catch(err){
		return {}
	}
}
exports.parseURL=parseURL;
function getParameterValue(urlString,parameterName){
	try{
		return parseURL(urlString).query[parameterName];
	}catch(err){
		return undefined
	}
}
exports.getParameterValue=getParameterValue;

function getRequestQuery(request){
	try{
		return request.query || urlParser.parse(request.url,true).query || {};
	}catch(err){
		return {}
	}
}
exports.getRequestQuery=getRequestQuery;


function getRequestBody(request){
	var body={};
	if(request.method && request.method=="GET"){
		if(typeof request.body=="object" && request.body!=null && Object.keys(request.body).length>0){
			body=request.body
		}else{
			try{body=JSON.parse(getParameterValue(request.url,"data"));}catch(err){console.log("parsing error form get request");}	
		}
	}else{
		body=request.body;
	}
	return body;
}
exports.getRequestBody=getRequestBody;