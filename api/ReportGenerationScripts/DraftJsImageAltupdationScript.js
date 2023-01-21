
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);

var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbMasterBucket.query(query, function(err, data) {
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
		var docu=data[index].value;
		if(docu["@footerText"] &&
			docu["@footerText"].entityMap &&
			docu["@footerText"].entityMap.constructor== Object){
					
				for(var key in docu["@footerText"].entityMap){
					if(docu["@footerText"].entityMap[key].type=="image"){
						try{
							docu["@footerText"].entityMap[key].data.alt=(docu["@displayName"] || docu.displayName)+key;
							console.log(docu["@footerText"].entityMap[key].data.alt);
						}catch(err){console.log(err);}
					}
				}
				
				
				console.log("Updating ........."+ (index*1+1) +"          "+data[index].id+"             ");	
				cbMasterBucket.upsert(data[index].id,docu,function(err, result) {
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

