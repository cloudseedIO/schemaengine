var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);


var mfrsQuery = ViewQuery.from("Manufacturer", "test").reduce(false).stale(ViewQuery.Update.BEFORE).skip(651);//.limit(1)//.skip(1);
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
								 names.push(multiresult[recordId].value.ProductCategory);
							  }
							  mfrDoc.productTypesBKP=mfrDoc.productTypes;
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
					mfrDoc.productTypesBKP=mfrDoc.productTypes;
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