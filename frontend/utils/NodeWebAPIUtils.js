
var endPoints=require('../endPoints.js');
var Client = require('node-rest-client').Client;
var endPoint=endPoints.apiServerLocalAddress || endPoints.apiServerAddress || "https://localhost:9500/";
function getDataFromRemoteHost(method,path,postdata,callback){
	var client = new Client({connection: {rejectUnauthorized: false}});
	if(!endPoint.match(/\/$/)){
		endPoint+="/";
	}
	if(path.match(/^\//)){
		path.replace(/^\//,"");
	}
	var apiURL=endPoint+(path?path:"");
	if(!method){method="GET"}
	method=method.toUpperCase();
	switch (method){
		case "GET":
			client.get(apiURL, args, function(data, res){
				if(Buffer.isBuffer(data)){data = data.toString('utf8');}
				callback(data);
			});
			break;
		case "POST":
			var args = {data: postdata,	headers: { "Content-Type": "application/json" }	};
			client.post(apiURL, args, function(data, res){
				if(Buffer.isBuffer(data)){data = data.toString('utf8');}
				callback(data);
			});
			break;
		case "DELETE":
			client.delete(apiURL, args, function(data, res){
				if(Buffer.isBuffer(data)){data = data.toString('utf8');}
				callback(data);
			});
			break;
		case "PUT":
			client.put(apiURL, args, function(data, res){
				if(Buffer.isBuffer(data)){data = data.toString('utf8');}
				callback(data);
			});
			break;
		default:
			client.get(apiURL, args, function(data, res){
				if(Buffer.isBuffer(data)){data = data.toString('utf8');}
				callback(data);
			});
			break;
		}
		client.on('error', function(d){
			console.log(d);
			callback({error:"Error"});
		});
}
exports.getDataFromRemoteHost=getDataFromRemoteHost;


exports.getDefinition=function(id,callback){
	getDataFromRemoteHost("POST","generic?operation=getDefinition",{recordId:id},callback);
}
exports.getSlugDetails=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getSlugDetails",data,callback);
}
exports.getSchemaRecords=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getSchemaRecords",data,callback);
}
exports.getSearchResults=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getSearchResults",data,callback);
}
exports.getRelatedRecords=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getRelatedRecords",data,callback);
}
exports.changePassword=function(data,callback){
	getDataFromRemoteHost("POST","user?operation=changePassword&code="+data.code,{},callback);
}
exports.activateAccount=function(data,callback){
	getDataFromRemoteHost("POST","user?operation=activateAccount&code="+data.code,{},callback);
}
exports.joinPage=function(data,callback){
	getDataFromRemoteHost("POST","user?operation=joinPage&code="+data.code,{},callback);
}
exports.getSchemaRecordForView=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getSchemaRecordForView",data,callback);
}
exports.getMainSchema=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getMainSchema",data,callback);
}
exports.getGroupData=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=groupView",data,callback)
}
exports.getExploreUniqueUserName=function(data,callback){
	getDataFromRemoteHost("POST","generic?operation=getExploreUniqueUserName",data,callback);
}
exports.getSearchResultsBydocType=function(data,callback){
	getDataFromRemoteHost("POST","search?operation=getSearchResultsBydocType",data,callback);
}
exports.refreshHostsAndConfigIds=function(callback){
	getDataFromRemoteHost("GET","refreshHostsAndConfigIds",{},callback);
}
exports.refresh=function(callback){
	getDataFromRemoteHost("GET","refresh",{},callback);
}
exports.logout=function(callback){
	getDataFromRemoteHost("GET","logout",{},callback);
}


