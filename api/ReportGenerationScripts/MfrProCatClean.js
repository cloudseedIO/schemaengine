var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var fs=require("fs");

var query = N1qlQuery.fromString("SELECT raw records FROM records  WHERE docType=$1 and lower(categoryName) like $2");
cbContentBucket.query(query,["MfrProCat" ,"%faucet%"],function(err,result){
	if(err){console.log(err);return;}
	if(result.length==0){console.log("No Records");return;}
	console.log(result.length);
	process(0);
	function process(index){
		if(index>=result.length){
			console.log("DONE ");
			return;
		}
		var doc=result[index];
		console.log("Processing "+ index);
		var query2 = N1qlQuery.fromString("SELECT RAW categoryName FROM records USE KEYS $1");
		cbContentBucket.query(query2,[doc.ProductCategory] ,function(err, result2) {
			if(err){
				console.log(err);
			}else{
				doc.categoryName=result2[0];
			}
			var query3 = N1qlQuery.fromString("SELECT RAW name FROM records USE KEYS $1");
			cbContentBucket.query(query3,[doc.Manufacturer] ,function(err, result3) {
				if(err){
					console.log(err);
				}else{
					doc.mfrName=result3[0];
				}
				doc.mfrProCatName=doc.categoryName+" by "+doc.mfrName;
				if(doc["@uniqueUserName"]){
					doc["@uniqueUserName"]=doc["@uniqueUserName"].replace("tap","faucet");
				}else{
					doc["@uniqueUserName"]=doc.mfrName.trim().replace(/\W+/g,"-").toLowerCase()+"-"+doc.categoryName.trim().replace(/\W+/g,"-").toLowerCase();
				}
				console.log(doc.mfrProCatName);
				console.log(doc.categoryName);
				var query4 = N1qlQuery.fromString("UPDATE records USE KEYS $1 SET categoryName=$2,mfrProCatName=$3, `@uniqueUserName`=$4 returning recordId,userName,roleNames,record_header");
				cbContentBucket.query(query4,[doc.recordId,doc.categoryName,doc.mfrProCatName,doc["@uniqueUserName"]] ,function(err, result4) {
					console.log(result4);
					process(index+1);
				});
				
			});
		});
		
		//cbContentBucket.get(allCategories[index],function(caterr, catresult) {});	
	}
});
	

