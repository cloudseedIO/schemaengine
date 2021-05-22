var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var _server = {
	"url":config.cbAddress, 
	"username":config.cbUsername, 
	"password":config.cbPassword, 
	"bucket":config.cbMessagesBucket
};
//var _server = {"url":"172.31.14.164", "username":"Administrator", "password":"wkwkproddbadmin", "bucket":"messages"};
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://"+_server.url);
//cluster.authenticate(_server.username, _server.password);
var N1qlQuery = couchbase.N1qlQuery;
var chat=cluster.openBucket(_server.bucket);
var records=cluster.openBucket(config.cbContentBucket);
chat.operationTimeout = 120 * 1000;
var db = {};

db.get = function(docId,callback){
	if(!docId){
		if(typeof callback=="function")
			callback({"error":"no Doc Id"});
		 return;
	}
	chat.get(docId,function(err, result) {
	  if (err) {
			 if(typeof callback=="function")
			  callback({"error":"while getting the doc with id "+docId+"  from bucket messages"});
		 return;
	  }
	  if(typeof callback=="function")
		  callback(result.value);
	});
}
db.update=function(docId,doc,callback){
	chat.upsert(docId,doc,function(err, result) {
		if (err) {
			if(typeof callback=="function")
			callback({"error":"while replacing  the doc with id "+docId+"  from bucket messages"});
			return;
		}
		if(typeof callback=="function")
			callback(result);
	});
}
db.exec = function(q, key, callback){
  var query=N1qlQuery.fromString(q);
  chat.query(query,function(err, results) {
	  var config={success:true, results:[]};
      if(err){
		 config.success = false;
		 config.error = err;
	  } 
      if(Array.isArray(results) && results.length>0 && typeof results[0] =="object" && results[0] != null)
        config.results = results;
      
      callback(config);
    });
};

db.execView=function(q,callback){
	chat.query(q, function(err, results) {
		if(err){
			callback({error:err});
		}else{
			callback(results)
		}
	});
}
db.execRecordsSpatView=function(q,callback){
	records.query(q, function(err, results) {
		if(err){
			callback({error:err});
		}else{
			callback(results)
		}
	});
}
String.prototype.makeQuery = function(obj, doLog){
	
	var q = this.replace(/{[^{}]+}/g, function(key){
		if(typeof obj[key.replace(/[{}]+/g, "")] == 'object')
			return JSON.stringify(obj[key.replace(/[{}]+/g, "")]);
		else
			return obj[key.replace(/[{}]+/g, "")] || "";
	});
	if(false){
		console.log("\n");
		console.log("#### query: "+q);
		console.log("\n");
	}
	return q;
}

module.exports = db;
