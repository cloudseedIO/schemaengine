var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.bucket(records);
var cbMasterBucket=cluster.bucket(schemas);
var cbContentCollection=cbContentBucket.defaultCollection();
var allProCats={};
var allCatsArray=[];
//var query = ViewQuery.from("ProductCategory", "summary").reduce(false).stale(ViewQuery.Update.BEFORE);
var query=await cbContentBucket.viewQuery("ProductCategory", "summary",reduce(false));
cluster.query(query, function(proCatErr, proCats) {
	if(proCatErr){
		console.log(proCatErr);
		return;
	}
	for(var i=0;i<proCats.length;i++){
		allProCats[proCats[i].id]=proCats[i].value.categoryName;
		allCatsArray.push(proCats[i].value.categoryName);
	}
	//console.log(allCatsArray);
	
	
	//var mfrsQuery = ViewQuery.from("Manufacturer", "summary").reduce(false).stale(ViewQuery.Update.BEFORE);//.limit(3);//.skip(27);
	var mfrsQuery=await cbContentBucket.viewQuery("Manufacturer", "summary",reduce(false));
	cluster.query(mfrsQuery, function(mfrerr, mfrdata) {
		if(mfrerr){
			console.log(mfrerr);
			return;
		}
		console.log("ALL Mfrs"+ mfrdata.length);
		if(mfrdata.length==0){
			return;
		}
		updateMfr(0);
		function updateMfr(index){
			cbContentCollection.get(mfrdata[index].id,async function(mde, mdd) {
				if(mde){console.log(mde);return;}
				var mfrDoc=mdd.value;
				console.log("Updating ........."+ (index*1+1) +"          "+mfrDoc.recordId+"             ");	
				//var innerQuery = ViewQuery.from("relation","getRelated").key([mfrDoc.recordId,"manufacturesCategory"]).reduce(false).stale(ViewQuery.Update.BEFORE);
				var innerQuery=await cbContentBucket.viewQuery("relation","getRelated",{key:[mfrDoc.recordId,"manufacturesCategory"]},reduce(false));
				cluster.query(innerQuery,function(relerr,relresponse){
					if(relerr){
						console.log(relerr);
						return;
					}
					var recordIds=[];
					for(var i=0;i<relresponse.length;i++){
						recordIds.push(relresponse[i].id);
					}
					
					if(recordIds.length>0){
						
						
						cbContentBucket.getMulti(recordIds,function(multierr, multiresult) {
							  if (multierr) {
								  console.log("Error while getting multi docs");
								}else{
							  	  var names=[];
								  for(var recordId in multiresult){
									 names.push(allProCats[multiresult[recordId].value.ProductCategory]);
								  }
								  mfrDoc.productTypes=names;
								  console.log(names.length);
								  cbContentCollection.upsert(mfrDoc.recordId,mfrDoc,function(err, result) {
							 			if (err) { console.log(err); }
							 			if((index+1)<mfrdata.length){
											updateMfr(index+1);
										}else{
											console.log("DONE.");
										}
									});
								  
									
								}
							});						
					}else{
						
						
						mfrDoc.productTypes=[];
						  
						cbContentCollection.upsert(mfrDoc.recordId,mfrDoc,function(err, result) {
					 			if (err) { console.log(err); }
					 			if((index+1)<mfrdata.length){
									updateMfr(index+1);
								}else{
									console.log("DONE.");
								}
							});
						
						
						
					}
				});
			});
		}
	});
	
});