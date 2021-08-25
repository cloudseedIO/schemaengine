var urlParser=require('./URLParser');
var couchbase = require('couchbase');
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var CouchBaseUtil=require('./CouchBaseUtil');
var limitCount=require("../utils/global.js").limitCount*2+1//19;// 9
var utility=require('./utility.js');

var GenericRecordServer=require('./GenericRecordServer.js');

var GenericSummeryServer=require('./GenericSummeryServer.js');
/**
 * get related records ids
 * rootSchema,dependentSchema,relationRefSchema,recordId
 * @param request
 * @param callback
 */

function getRelated(request,callback){
	var data=urlParser.getRequestBody(request);
	/*var query = ViewQuery.from("relation","getRelated").key([data.recordId,data.relation]).reduce(false);
	if(typeof data.skip != "undefined"){
		query.skip(data.skip).limit(limitCount);
	}
	query.stale(ViewQuery.Update.BEFORE);
	CouchBaseUtil.executeViewInContentBucket(query,function(response){
		if(typeof callback=="function"){
			callback(response);
		}
	});*/
	utility.getMainSchema({schema:data.rootSchema,dependentSchema:data.dependentSchema},function(schema){
		if(schema.error){callback(schema);return;}
		var knownKey;
		for(var relation in schema["@relations"]){
			if(schema["@relations"][relation].relationRefSchema==data.relationRefSchema){
				knownKey=schema["@relations"][relation].knownKey;
			}
		}
		var query = "SELECT `recordId` AS `id`, `recordId` As `value` FROM `records` WHERE docType=$1 AND `"+knownKey+"` =$2";
		if(data.forCounts){
			query = "SELECT COUNT (*) AS total FROM `records` WHERE docType=$1 AND `"+knownKey+"` =$2";
		}
		query.adhoc = false;
		CouchBaseUtil.executeN1QL(query,{parameters:[data.relationRefSchema,data.recordId]},function(results){
			if(typeof callback=="function"){
				if(data.forCounts){
					try{callback({total:results[0].total});}catch(err){callback({total:0})}
				}else{
					callback(results);
				}
			}
		});
	});
}
exports.getRelated=getRelated;

/**
 * Checks whether the given records junction existed or not
 * @param request
 * @param callback
 */
function checkJunctionExistance(request,callback){
	var data=urlParser.getRequestBody(request);
	utility.getMainSchema({schema:data.docType},function(schema){
		if(schema.error){callback(schema);return;}
		var keysToCheck=[];
		for(var index in schema["@relationDesc"]){
			if(schema["@relationDesc"][index].indexOf("recordId")==-1){
				var temp=schema["@relationDesc"][index].split("-");
				if(keysToCheck.indexOf(temp[0])==-1){
					keysToCheck.push(temp[0]);
				}
				if(keysToCheck.indexOf(temp[2])==-1){
					keysToCheck.push(temp[2]);
				}
			}
		}
		if(keysToCheck.length>0){
			keysToCheck.push("docType");
			var values=[];
			var whereString=" WHERE ";
			for(var index in keysToCheck){
				whereString+="`"+keysToCheck[index]+"`="+"$"+(index*1+1);
				if(index<(keysToCheck.length-1)){
					whereString+=" AND ";
				}
				values.push(data[keysToCheck[index]]);
			}
			var querystring="SELECT `recordId` FROM `records` "+whereString;
			//var query = N1qlQuery.fromString(querystring);
			//query.adhoc = false;
			CouchBaseUtil.executeN1QL(querystring,{parameters:values},function(result){
				if(result.length!=0){
					if(typeof callback=="function")
					callback({result:"related",id:result[0].recordId});
				}else{
					if(typeof callback=="function")
					callback({result:"notRelated"});
				}
			});
		}else{
			if(typeof callback=="function")
			callback({result:"notRelated"});
		}
	});
}
exports.checkJunctionExistance=checkJunctionExistance;


function getRelatedRecords(request,callback){
	var data=urlParser.getRequestBody(request);
	/*var query = ViewQuery.from("relation","getRelated").key([data.recordId,data.relation]).reduce(false);
	if(typeof data.skip != "undefined"){
		query.skip(data.skip).limit(limitCount);
	}
	if(data.fromTrigger){
		query.stale(ViewQuery.Update.BEFORE);
	}else{
		query.stale(ViewQuery.Update.NONE)
	}
	CouchBaseUtil.executeViewInContentBucket(query,function(response){
		var recordIds=[];
		for(var i=0;i<response.length;i++){
			recordIds.push(response[i].id);
		}
		if(recordIds.length!=0){
			
			request.body.recordIds=recordIds;
			request.body.rootSchema=data.rootSchema;
			request.body.relationRefSchema=data.relationRefSchema;
			request.body.userId=data.userId;
			request.body.org=data.org;
			
			getRelationRecords(request,function(relResp){
				callback(relResp);
			});
		}else{
			callback([]);
		}
	});*/
	utility.getMainSchema({schema:data.rootSchema,dependentSchema:data.dependentSchema},function(schema){
		if(schema.error){callback(schema);return;}
		utility.getMainSchema({schema:data.relationRefSchema},function(relSchema){
			if(relSchema.error){callback(relSchema);return;}
			var keys=GenericSummeryServer.getSummaryKeys(relSchema).keys;
			if(data.fromTrigger){
				keys=["recordId","org","$status","@uniqueUseName","record_header","author","editor","dateModified","dateCreated","dependentProperties"];
			    keys=keys.concat(Object.keys(relSchema["@properties"]));
			}
			
			var knownKey;
			for(var relation in schema["@relations"]){
				if(schema["@relations"][relation].relationRefSchema==data.relationRefSchema){
					knownKey=schema["@relations"][relation].knownKey;
				}
			}
			var queryString = "SELECT `"+keys.join("`,`")+"` FROM `records` WHERE docType= '"+data.relationRefSchema+"'  AND `"+knownKey+"` = '"+data.recordId+"'";
			
			
			if(data.sortBy){
				queryString +=" ORDER BY `"+data.sortBy+"` "+(data.sortOrder=="ascend"?"ASC":"DESC");
			}else{
				if(relSchema["@identifier"] && relSchema["@identifier"] != "recordId"){
					queryString +=" ORDER BY `"+schema["@identifier"]+"` ";
				}
			}
			
			if(!data.fromTrigger){
				queryString +=" LIMIT "+(data.limit?data.limit:limitCount)+" ";
			}
			if(typeof data.skip !="undefined" && data.skip!=null){
				queryString +=" OFFSET "+data.skip+" ";
			}
			CouchBaseUtil.executeN1QL(queryString,{parameters:[]},function(results){
				if(data.fromTrigger){
					if(typeof callback=="function")
						callback({
							records:results,
							relatedSchema:data.relationRefSchema,
							schema:relSchema,
						});
				}else if(data.relationView==undefined || (data.relationView!="GoDetail" && data.relationView!="TableEditView")){
					var recs=[];
					for(var index in results){
						recs.push({id:results[index].recordId,key:results[index].recordId,value:results[index]})
					}
					if(typeof callback=="function")
						callback({
							records:recs,
							relatedSchema:data.relationRefSchema,
							schema:relSchema,
						});
				}else{
					var recs=[];
					for(var index in results){
						recs.push(results[index].recordId);
					}
					request.body.recordId=recs;
					request.body.schema=data.relationRefSchema;
					request.body.userId=data.userId;
					request.body.org=data.org;
					GenericRecordServer.getSchemaRecordForView(request,function(result){
							result.relatedSchema=data.relationRefSchema;
							if(typeof callback=="function")
							callback(result);
					});
				}
			});
		});
	});
}
exports.getRelatedRecords=getRelatedRecords;

function getSearchResults(request,callback){
	var data=urlParser.getRequestBody(request);
	/*if(!data.userId){
		data.userId="CommonUser";
	}
	var query = ViewQuery.from(data.schema,"summary").keys(data.recordIds).reduce(false);
	CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		callback({records:results});
	});*/
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		var keys=GenericSummeryServer.getSummaryKeys(schema).keys;
		var querystring="SELECT `"+keys.join("`,`")+"` FROM `records` WHERE docType=$1 AND `recordId` IN $2";
		//var query = N1qlQuery.fromString(querystring);
		CouchBaseUtil.executeN1QL(querystring,{parameters:[data.schema,data.recordIds]},function(results){
			var recs=[];
			for(var index in results){
				recs.push({id:results[index].recordId,key:results[index],value:results[index]})
			}
			if(typeof callback=="function")
			callback({records:recs});
		});
	});
}
exports.getSearchResults=getSearchResults;


/**
 * 
 * @param data
 *            {recordId relation relatedRecordId}
 *            schema,record
 * @param callback
 */
function checkRelated(request,callback){
	/*var data=urlParser.getRequestBody(request);
	var key=[data.recordId,data.relation,data.relatedRecordId];
	var query = ViewQuery.from("relation","checkRelated").key(key).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query,function(result){
		if(result.length!=0){
			callback({result:"related"});
		}else{
			callback({result:"notRelated"});
		}
	});*/
	checkJunctionExistance(request,callback);
}
exports.checkRelated=checkRelated;

/**
 * 
 * @param data
 *            {recordId relation relatedRecordId}
 * @param callback
 */
function getRelatedRecordId(data,callback){
	/*var key=[data.source,data.relation,data.target];
	var query = ViewQuery.from("relation","checkRelated").key(key).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query,function(result){
		if(result.length!=0){
			callback({id:result[0].id});
		}else{
			callback({error:"notRelated"});
		}
	});*/
	/*if(!data.docType){
		CouchBaseUtil.getDocumentsByIdFromContentBucket(data.source,function(rec){
			var record=rec.value;
			CouchBaseUtil.getDocumentByIdFromMasterBucket(record.docType,function(schema){
				var relationRefSchema;
				var source
				for(var i=0 ; i<schema["@relations"].length;i++){
					
				}
			});
		});	
	}else{*/
		checkJunctionExistance({body:data},function(result){
			callback(result)
		});
	//}
}
exports.getRelatedRecordId=getRelatedRecordId;



function getRelatedCount(request,callback){
	/*var data=urlParser.getRequestBody(request);
	var query = ViewQuery.from("relation","getRelated").key([data.recordId,data.relation])// .group(2)//.stale(ViewQuery.Update.NONE);
		CouchBaseUtil.executeViewInContentBucket(query,function(response){
			var count=0;
			if(response.length>0 && response[0].value){
				count=response[0].value;
			}
			callback(count);
	});*/
	request.body.forcounts=true;
	getRelated(request,function(response){
		callback(response.total);
	});
}
exports.getRelatedCount=getRelatedCount;

/**
 * 
 * @param data
 *            (recordIds,rootSchema, relationRefSchema,userId)
 * @param callback
 */
/*function getRelationRecords(request,callback){
	var data=urlParser.getRequestBody(request);
	if(!data.userId){
		data.userId="CommonUser";
	}
	CouchBaseUtil.getDocumentByIdFromMasterBucket(data.relationRefSchema,function(schemas){
		
		if(schemas.error){
			callback(schemas);
			return;
		}
	    
		if(data.fromTrigger){
			CouchBaseUtil.getDocumentsByIdsFromContentBucket(data.recordIds,function(recs){
				var tempRecords=[];
				for(var key in recs){
					tempRecords.push(recs[key]);
				}
				callback({
						records:tempRecords,
						relatedSchema:data.relationRefSchema,
						schema:schemas.value,
					});
			});
		}else if(data.relationView==undefined || (data.relationView!="GoDetail" && data.relationView!="TableEditView")){
			var query = ViewQuery.from(data.relationRefSchema,"summary").keys(data.recordIds).reduce(false);
			if(data.stale==false){
				query.stale(ViewQuery.Update.BEFORE);
			}
			CouchBaseUtil.executeViewInContentBucket(query, function(results) {
				if(results.error){
					callback(results);
					return;
				}
				callback({
					records:results,
					relatedSchema:data.relationRefSchema,
					schema:schemas.value,
					});
			});
		}else{
			request.body.recordId=data.recordIds;
			request.body.schema=data.relationRefSchema;
			request.body.userId=data.userId;
			request.body.org=data.org;
			GenericRecordServer.getSchemaRecordForView(request,function(result){
				result.relatedSchema=data.relationRefSchema;
				callback(result);
			});
		}
	});
}
exports.getRelationRecords=getRelationRecords;*/
