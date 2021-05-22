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


var cities={
		"City06749dee-0af8-b524-e2ec-9f3d987d4cd6":"Bangalore",
		"City3d4a479e-9437-24a1-aba9-f0445e68c3c1":"Hanmakonda",
		"City4972057a-d79a-325d-73b4-f33b5d2cad76":"Secunderabad",
		"City8d11c19c-4034-a253-0f83-4ac33e9cf299":"Mumbai",
		"City9e78be2a-af55-e3cd-f6bd-3ccb7a04ff14":"Mysore",
		"Citya3c197ed-95f7-0b05-0c59-9a8e52139fbb":"New Delhi",
		"Cityfb252a6f-8ff7-a951-d24f-479565ca19e8":"Hyderabad"
};



//var viewName="CatCitySuppliers";
var viewName="MfrCitySuppliers";
//var query = ViewQuery.from("MfrProCatCitySupplier", viewName).reduce(true).group(true)//.skip(0).limit(1);
var query=await cbContentBucket.viewQuery("MfrProCatCitySupplier", viewName,reduce(true),group(true));
cluster.query(query, function(err, data) {
	if(err){
		console.log(err);
		return;
	}
	console.log(data.length);
	if(data.length==0){
		return;
	}
	process(0);

	function process(index){
		cbContentCollection.get(data[index].key[1],function(err, result) {
			if (err) { console.log(err);	}
			if(cities[data[index].key[2]]==undefined){
				console.log(data[index].key[2]);
			}
			var doc={};
			var cityName=cities[data[index].key[2]];
			if(!err && cityName!=undefined){
				
				if(viewName=="CatCitySuppliers"){
					//console.log("https://www.wishkarma.com/gv/MfrProCatCitySupplier/CatCitySuppliers/"+result.value.categoryName.replace(/\s/g,"")+"-Suppliers-"+cities[data[index].key[2]]+"?ProductCategory="+data[index].key[1]+"&City="+data[index].key[2]);
					var catName=result.value.categoryName;
					doc={
							"docType":"uniqueUserName",
							"type": "groupView",
							"recordId":(catName+" Suppliers "+cityName+", India").trim().replace(/\W+/g,"-").toLowerCase(),   //"bidet-suppliers-hyderabad"
							"@uniqueUserName":(catName+" Suppliers "+cityName+", India").trim().replace(/\W+/g,"-").toLowerCase(),
							"displayName":(catName+" Suppliers in"+cityName+", India"),// "Bidet Suppliers Hyderabad"
							"target": {
								"schema": "MfrProCatCitySupplier",
								"viewName": viewName,
								"keys": {
									"ProductCategory":data[index].key[1],// "ProductCategory045378e2-e0de-8f9d-06b8-a240ae3b2909"
									"City":data[index].key[2]  // "Cityfb252a6f-8ff7-a951-d24f-479565ca19e8"
								},
								"htmlMeta": {
									"title": catName+" | Suppliers | "+cityName+", India | Wishkarma.com", //"Bidets | Suppliers | Hyderabad | Wishkarma.com"
									"description": "Find "+catName+" Suppliers in "+cityName+", India .  Connect and chat for best deals.",// "Find Bidet Suppliers in Hyderabad. Connect and chat for best deals"
									"keywords": catName+", suppliers ,stores, dealers, "+cityName+", India"// "bidet, suppliers, store, dealers, hyderabad, India"
								}
							}
						}
				}
				//console.log("https://www.wishkarma.com/gv/MfrProCatCitySupplier/MfrCitySuppliers/"+result.value.name.replace(/\s/g,"")+"-Suppliers-"+cities[data[index].key[2]]+"?Manufacturer="+data[index].key[1]+"&City="+data[index].key[2]);
				if(viewName=="MfrCitySuppliers"){
					var mfrName=result.value.name;
					doc={
							"docType":"uniqueUserName",
							"type": "groupView",
							"recordId":(mfrName+" Suppliers "+cityName+", India").trim().replace(/\W+/g,"-").toLowerCase(),//"delta-suppliers-hyderabad"
							"@uniqueUserName":(mfrName+" Suppliers "+cityName+", India").trim().replace(/\W+/g,"-"),
							"displayName":(mfrName+" Suppliers in "+cityName+", India"),// "Delta Suppliers Hyderabad"
							"target": {
								"schema": "MfrProCatCitySupplier",
								"viewName": viewName,
								"keys": {
									"Manufacturer":data[index].key[1], // "Manufacturer0b856f10-9549-963e-ea4e-636ab103163d"
									"City": data[index].key[2] //"Cityfb252a6f-8ff7-a951-d24f-479565ca19e8"
								},
								"htmlMeta": {
									"title": mfrName+" | Suppliers | "+cityName+",India | Wishkarma.com", //"Delta | Suppliers | Hyderabad | Wishkarma.com"
							        "description":"Authorized "+ mfrName+" Suppliers in "+cityName+", India.  Connect and chat for best deals.", //"Authorized Delta suppliers in Hyderabad. Connect and chat for best deals"
							        "keywords": mfrName+", suppliers, stores, dealers, "+cityName+", India" // "delta, suppliers, store, dealers, hyderabad"
								}
							}
					}
				}
				
				
				
				
				cbContentCollection.insert(doc.recordId,doc,function(err, result) {
					console.log(doc["@uniqueUserName"]);
					if (err) { console.log(err); }
					if((index+1)<data.length){
						process(index+1);
					}
				});
				
			}else{
				if((index+1)<data.length){
					process(index+1);
				}
			}
			
			
			
		});
	}
})