var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var fs=require("fs");

var query = N1qlQuery.fromString("SELECT raw records FROM records  WHERE docType=$1 ");
cbContentBucket.query(query,["UserRole"] ,function(err, result) {
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
		var query2 = N1qlQuery.fromString("SELECT RAW givenName FROM records USE KEYS $1");
		cbContentBucket.query(query2,[doc.User] ,function(err, result2) {
			if(err){
				console.log(err);
			}else{
				doc.userName=result2[0];
			}
			var query3 = N1qlQuery.fromString("SELECT RAW roleName FROM records USE KEYS $1");
			cbContentBucket.query(query3,[doc.roles] ,function(err, result3) {
				if(err){
					console.log(err);
				}else{
					doc.roleNames=result3.join(", ");
				}
				doc.record_header=doc.rolenames;
				var query4 = N1qlQuery.fromString("UPDATE records USE KEYS $1 SET userName=$2,roleNames=$3,record_header=$3 returning recordId,userName,roleNames,record_header");
				cbContentBucket.query(query4,[doc.recordId,doc.userName,doc.roleNames] ,function(err, result4) {
					console.log(result4);
				process(index+1);
				});
				
			});
		});
		
		//cbContentBucket.get(allCategories[index],function(caterr, catresult) {});	
	}
});
	

