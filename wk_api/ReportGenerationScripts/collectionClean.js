var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var bucket=cluster.bucket("records");
//var query = ViewQuery.from("Test", "test")//.skip(0).limit(9).stale(ViewQuery.Update.BEFORE);
var query=await bucket.viewQuery("Test", "test");



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
		var docu=data[index].value;

		
		
		var recordsToGet=[];

		if(docu.Manufacturer && docu.Manufacturer!=""){
			recordsToGet.push(docu.Manufacturer);
		}
		
		if(recordsToGet.length>0){
			
			bucket.getMulti(recordsToGet,function(err,mds){
				if(docu.Manufacturer && docu.Manufacturer!=""){
					if(mds[docu.Manufacturer] && mds[docu.Manufacturer].value && mds[docu.Manufacturer].value.name)
					docu.mfrName=mds[docu.Manufacturer].value.name
				}
				doneCommit();
			});
			
		}else{
			doneCommit();
		}
		
		
		
		function doneCommit(){
			
			if(docu.mfrName && docu.mfrName!=""){
				//if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
					docu["@uniqueUserName"]=docu.mfrName.replace(/\W/g,"").toLowerCase()+"-"+docu.collection.replace(/\W/g,"").toLowerCase();
				//}
				docu.metaTitle = docu.mfrName+" - "+docu.collection+" | Wishkarma.com";
				docu.metaDescription = "Find all products in "+docu.collection+" by "+docu.mfrName+".";
				
			}else{
				//if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
					docu["@uniqueUserName"]=docu.collection.replace(/\W/g,"").toLowerCase();
				//}
				docu.metaTitle = docu.collection+" | Wishkarma.com";
				docu.metaDescription = "Find all products in "+docu.collection+".";
			}
			
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			bucket.upsert(docu.recordId,docu,function(err, result) {
				if (err) { console.log(err); }
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}
	}
});



/***
 * 
 * 
 * 
 var query = ViewQuery.from("UpdationScriptViews", "nocolor")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);



bucket.query(query, function(err, data) {
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
			
		if(Array.isArray(docu.productImages))
		for(var i=0;i<docu.productImages.length;i++){
			delete docu.productImages[i].dependentProperties;
		}
		
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			bucket.upsert(docu.recordId,docu,function(err, result) {
				if (err) { console.log(err); }
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
	}
});
 
 * 
 */
 
