var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);

var allProCats={};
var allCatsArray=[];
var query = ViewQuery.from("ProductCategory", "summary").reduce(false).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(proCatErr, proCats) {
	if(proCatErr){
		console.log(proCatErr);
		return;
	}
	for(var i=0;i<proCats.length;i++){
		allProCats[proCats[i].id]=proCats[i].value.categoryName;
		allCatsArray.push(proCats[i].value.categoryName);
	}
	//console.log(allCatsArray);
	
	
	var mfrsQuery = ViewQuery.from("Manufacturer", "summary").reduce(false).stale(ViewQuery.Update.BEFORE);//.limit(3);//.skip(27);
	cbContentBucket.query(mfrsQuery, function(mfrerr, mfrdata) {
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
			cbContentBucket.get(mfrdata[index].id,function(mde, mdd) {
				if(mde){console.log(mde);return;}
				var mfrDoc=mdd.value;
				console.log("Updating ........."+ (index*1+1) +"          "+mfrDoc.recordId+"             ");	
				var innerQuery = ViewQuery.from("relation","getRelated").key([mfrDoc.recordId,"manufacturesCategory"]).reduce(false).stale(ViewQuery.Update.BEFORE);
				cbContentBucket.query(innerQuery,function(relerr,relresponse){
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
								  cbContentBucket.upsert(mfrDoc.recordId,mfrDoc,function(err, result) {
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
						  
						cbContentBucket.upsert(mfrDoc.recordId,mfrDoc,function(err, result) {
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