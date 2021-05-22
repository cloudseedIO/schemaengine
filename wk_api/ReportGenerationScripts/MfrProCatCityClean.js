var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var bucket=cluster.bucket("records");
var collection=bucket.defaultCollection();
//var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
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
		if(docu.ProductCategory && docu.ProductCategory!=""){
			recordsToGet.push(docu.ProductCategory);
		}
		if(docu.City && docu.City!=""){
			recordsToGet.push(docu.City);
		}	
		
		if(recordsToGet.length>0){
			
			bucket.getMulti(recordsToGet,function(err,mds){
				if(docu.Manufacturer && docu.Manufacturer!=""){
					if(mds[docu.Manufacturer] && mds[docu.Manufacturer].value && mds[docu.Manufacturer].value.name)
					docu.manufacturerName=mds[docu.Manufacturer].value.name
				}
				if(docu.ProductCategory && docu.ProductCategory!=""){
					if(mds[docu.ProductCategory] && mds[docu.ProductCategory].value && mds[docu.ProductCategory].value.categoryName)
					docu.productCategoryName=mds[docu.ProductCategory].value.categoryName
				}
				if(docu.City && docu.City!=""){
					if(mds[docu.City] && mds[docu.City].value && mds[docu.City].value.cityName)
					docu.cityName=mds[docu.City].value.cityName
				}	
				doneCommit();
			});
			
		}else{
			doneCommit();
		}
		
		
		
		function doneCommit(){
			//if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.manufacturerName.trim().replace(/\W+/g,"-").toLowerCase()+"-"+docu.productCategoryName.trim().replace(/\W+/g,"-").toLowerCase()+"-"+docu.cityName.trim().replace(/\W+/g,"-").toLowerCase();
			//}
			docu.metaTitle=docu.manufacturerName+" "+docu.productCategoryName+" In "+docu.cityName+" | Wishkarma.com";
			docu.metaDescription="Find all "+docu.productCategoryName+" manufactured by "+docu.manufacturerName+" available in "+docu.cityName+". Also chat with stores and dealers near you.";
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			collection.upsert(docu.recordId,docu,function(err, result) {
				if (err) { console.log(err); }
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}
	}
});

