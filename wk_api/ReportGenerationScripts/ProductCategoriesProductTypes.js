var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com")
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.bucket(records);
var cbMasterBucket=cluster.bucket(schemas);
var cbContentCollection=cbContentBucket.defaultCollection();

//var query = ViewQuery.from("Test", "test").skip(0).limit(500).stale(ViewQuery.Update.BEFORE);
var query=await cbMasterBucket.viewQuery("Test", "test",skip(0),limit(500));
/*[
{"id":"Product-Bulb","key":"Product4554caaa-d461-bb63-a870-b86fdece2aeb","value":null},
{"id":"Product-Wardrobes","key":"ProductCategory005996eb-cccb-f7f3-2ec0-4d64b66e97bc","value":null}]*/
cluster.query(query, function(err, data) {
	if(err){
		console.log(err);
		return;
	}
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		console.log("Updating ........."+ (index*1+1) +"          "+data[index].key+"             ");	
		cbContentCollection.get(data[index].key,function(err, result) {
			if (err) { 
				console.log(err);	
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			}else{
				var docu=result.value;
				docu["productType"]=data[index].id.split("-")[1];
				cbContentCollection.upsert(docu.recordId,docu,function(err, result) {
					if (err) { console.log(err); }
					if((index+1)<data.length){
						updateProduct(index+1);
					}
				});
			}
		});
	}
});

