var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.openBucket(records);
var global=require('../utils/global.js');
var dateUpdated="2018/09/14 17:20:00 GMT+0530";
var Manufacturers=[];
function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	cbContentBucket.query(query, params,function(err, results) {
		if(err){
			if(typeof callback=="function")
				callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}

function getDocumentFromContent(docId,callback){
	cbContentBucket.get(docId,function(err, result){
		if(err){
			if(typeof callback=="function")
				callback({"error":err});
			return;
		}
		if(typeof callback=="function")
			callback(result);
	});
}
var mfrs=[];
executeView("UPDATE records SET docType=$1 where docType=$2 AND Manufacturer IN $3 ",["Product1","Product",Mfrs],function(res){	
	console.log(res);
	//UPDATE records SET docType=$1 where docType=$2 AND recordId IN $3
	executeView("UPDATE records use keys $3 SET docType=$1 ",["Manufacturer1","Manufacturer",Mfrs],function(res){	
		console.log(res);
	});
});


//update records set `$status`='published'  where `$status`!='published' and docType='Product' and Manufacturer IN []
