var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var cbContentBucket=cluster.openBucket("records");
var cbMasterBucket=cluster.openBucket("schemas");

var cbContentCollection=cbMasterBucket.defaultCollection();

//var query = ViewQuery.from("Test", "test2")//.skip(0).limit(500).stale(ViewQuery.Update.BEFORE);
var query=await cbContentBucket.viewQuery("Test", "test2");
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
		console.log(index);
		var docu=data[index].value;
		console.log(docu.productType);
		if(docu.docType && docu.docType=="Product" && docu.productType=="WashbasinFaucet" ){
			
			if(docu.dependentProperties){
				if(Array.isArray(docu.dependentProperties.mounting)){
					docu.dependentProperties.mounting="Other";
				}
			}
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			cbContentCollection.upsert(docu.recordId,docu,function(err, result) {
				if (err) { console.log(err); }
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
});


