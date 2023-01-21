var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var bucket=cluster.openBucket("records");
var defbucket=cluster.openBucket("definitions");

//skipping from 80000 to 235082
function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	bucket.query(query, params,function(err, results) {
		if(err){
			if(typeof callback=="function")
				callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}
function getDataType(value){
	var currType;
	if(typeof value=="string"){
		currType="string";
	}else if(Array.isArray(value)){
		currType="array";
	}else{
		currType=typeof value;
	}
	return currType;
}
function getRecordId(callback){
	var args=process.argv;
	args.splice(0,2);
	if(typeof args[0]!="string"){
	  console.error("NO RECORD");
	  return;
	}
	callback(args[0]);
}

executeView("select * from definitions use keys 'mappings'",[],function(result){
	var allMappings=result[0].definitions;
	getRecordId(function(recordId){
		//executeView("select * from records limit 1 offset "+skip,[],function(recordres){
		executeView("SELECT * FROM records USE KEYS '"+recordId+"'",[],function(recordres){
			console.log("--------------GOT-----------"+recordId+"-------");
			var flag=true;
			var record=recordres[0].records;
			for(var key in record){
				var currType=getDataType(record[key]);
				
				if(!allMappings[key]){
					allMappings[key]={type:currType,recordId:record.recordId};
					console.log(key,allMappings[key]);
				}else{
					if(key!="dependentProperties" && key!="productFeatures" && allMappings[key].type!=currType){
						flag=false;
						console.log("IN ROOT KEYS CHECK");
						console.log(key);
						console.log(allMappings[key].type+"   !=    "+currType);
						console.log(record.recordId);
						console.log(record[key]);
					}
					if(currType=="array"){
						if(record[key].length>0){
							var currSubType=getDataType(record[key][0]);
							if(!allMappings[key].subType){
								allMappings[key].subType=currSubType;
								allMappings[key].recordId=record.recordId;
								console.log(key,"array",allMappings[key].subType)
							}else if(allMappings[key].subType!=currSubType){
								flag=false;
								console.log(key);
								console.log("IN ARRAY TYPE CHECK");
								console.log(allMappings[key].subType+"   !=    "+currSubType);
								console.log(record.recordId);
								console.log(record[key]);
							}
							
						}
					}
					
					if(currType=="object"){
						for(var subKey in record[key]){
							var currSubType=getDataType(record[key][subKey]);
							if(!allMappings[key][subKey]){
								allMappings[key][subKey]={type:currSubType,recordId:record.recordId};
								console.log(key,subKey,allMappings[key][subKey])
							}else if(allMappings[key][subKey].type!=currSubType){
								flag=false;
								console.log("IN OBJECT TYPE CHECK")
								console.log(key,subKey);
								console.log(allMappings[key][subKey].type+"   !=    "+currSubType);
								console.log(record.recordId);
								console.log(record[key]);
								console.log(record[key][subKey]);
							}
						}
					}
				}
			}
		});
	});
});

