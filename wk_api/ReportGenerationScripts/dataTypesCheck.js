var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var bucket=cluster.bucket("records");
var defbucket=cluster.bucket("definitions");
var defcollection=defbucket.defaultCollection();

//skipping from 80000 to 235082
function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	cluster.query(query, params,function(err, results) {
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
async function getRecordId(skip,callback){
	//var query = ViewQuery.from("UpdationScriptViews", "recordId").skip(skip).limit(1).stale(ViewQuery.Update.BEFORE);
	var query=await bucket.viewQuery("UpdationScriptViews", "recordId",skip(skip),limit(1));
	cluster.query(query, function(err, data) {
		callback(data[0].id);
	});
}

var startWith=0;
executeView("select * from definitions use keys 'updateMappingsCount'",[],function(cr){
	startWith=cr[0].definitions.count;
executeView("select * from definitions use keys 'mappings'",[],function(result){
	var allMappings=result[0].definitions;
	function updateResults(skip){
		defcollection.upsert("mappings",allMappings,function(err, result) {
			console.log("Mappings updated");
			console.log("DONE")
		});
		defcollection.upsert("updateMappingsCount",{count:skip},function(err, result) {
			console.log("count updated");
		});
	}
	processRow(startWith);
	function processRow(skip){
		if(skip%50==0){
			updateResults(skip);
		}
		
		getRecordId(skip,function(recordId){
		//executeView("select * from records limit 1 offset "+skip,[],function(recordres){
		executeView("SELECT * FROM records USE KEYS '"+recordId+"'",[],function(recordres){
			console.log("--------------"+(skip+1)+"-----------"+recordId+"-------");
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
						break;
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
								break;
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
								break;
							}
						}
					}
				}
			}
			if(flag){
				processRow(skip+1);
			}else{
				updateResults(skip);
			}
		});
		});
	}
});
});
