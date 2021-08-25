var urlParser=require('./URLParser');
var couchbase = require('couchbase');
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var QueryScanConsistency= couchbase.QueryScanConsistency;
var CouchBaseUtil=require('./CouchBaseUtil');
var limitCount=require("../utils/global.js").limitCount*2+1//19;// 9
var utility=require('./utility.js');
var GenericRecordServer=require('./GenericRecordServer.js');
var GenericSummeryServer=require('./GenericSummeryServer.js');
var logger = require('../services/logseed').logseed;
var logQueries=false;
/**
 * get related records ids
 * @param request
 * @param callback
 */
//Used in Hard Delete of parent record should trigger deletion of all its child records(GenericRecordServer:removeRecord)
function getRelated(request,callback){
	var data=urlParser.getRequestBody(request);
	CouchBaseUtil.executeViewInContentBucket("relation","getRelated",
	{key:[data.recordId,data.relationName],reduce:false,skip:data.skip,limit:data.skip?limitCount:undefined,stale:QueryScanConsistency.RequestPlus},function(response){
		callback(response);
	});
}
exports.getRelated=getRelated;

/**
 *
 * @param data
 *            {recordId relationName relatedRecordId}
 * @param callback
 * check whether the given records are related or not
 */
function checkRelated(request,callback){
	var data=urlParser.getRequestBody(request);
	var key=[data.recordId,data.relationName,data.relatedRecordId];
	var query = ViewQuery.from("relation","checkRelated").key(key).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query,function(result){
		if(result.length!=0){
			callback({result:"related"});
		}else{
			callback({result:"notRelated"});
		}
	});
}
exports.checkRelated=checkRelated;



/**
 *
 * @param data
 *            {recordId relationName relatedRecordId}
 * @param callback
 * checks whther the two records aare related or  not
 * if relation exists returns related record Id(Junction recordId)
 */
function getRelatedRecordId(data,callback){
	var key=[data.source,data.relationName,data.target];
	var query = ViewQuery.from("relation","checkRelated").key(key).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query,function(result){
		if(result.length!=0){
			callback({id:result[0].id});
		}else{
			callback({error:"notRelated"});
		}
	});
}
exports.getRelatedRecordId=getRelatedRecordId;

//returns juction records count for a relation
function getRelatedCount(request,callback){
	var data=urlParser.getRequestBody(request);
		var query = ViewQuery.from("relation","getRelated").key([data.recordId,data.relationName])// .group(2)//.stale(ViewQuery.Update.NONE);
		CouchBaseUtil.executeViewInContentBucket(query,function(response){
			var count=0;
			if(response.length>0 && response[0].value){
				count=response[0].value;
			}
			callback(count);
		});
}
exports.getRelatedCount=getRelatedCount;


//Get Related records
function getRelatedRecords(request,callback){
	var data=urlParser.getRequestBody(request);
	if(data.rootSchema && (data.sortBy || data.filterRecords)){
		//Following code added to support Sorting feature with n1ql query
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
				if(data.filterRecords){
					queryString += " AND "+GenericSummeryServer.formWhereClauseWithFilters(schema,data.filterRecords);
					queryString=queryString.trim();
					queryString=queryString.replace(/AND$/,"");
				}
				if(data.sortBy){
					var sortKey=data.sortBy;
					if(relSchema["@sortBindings"] && relSchema["@sortBindings"][sortKey]){
						sortKey=relSchema["@sortBindings"][sortKey];
					}
					queryString +=" ORDER BY `"+sortKey+"` "+(data.sortOrder=="ascend"?"ASC":"DESC");
				}else{
					if(relSchema["@identifier"] && relSchema["@identifier"] != "recordId"){
						queryString +=" ORDER BY `"+relSchema["@identifier"]+"` ";
					}
				}

				if(!data.fromTrigger){
					queryString +=" LIMIT "+(data.limit?data.limit:limitCount)+" ";
				}
				if(typeof data.skip !="undefined" && data.skip!=null){
					queryString +=" OFFSET "+data.skip+" ";
				}
				if(logQueries){
					console.log("================getRelatedRecords=========");
					console.log(queryString);
					console.log("==================");
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
	}else{
		var query = ViewQuery.from("relation","getRelated").key([data.recordId,data.relationName]).reduce(false);
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
				/*{
					recordIds:recordIds,
					rootSchema:data.rootSchema,
					relationRefSchema:data.relationRefSchema,
					userId:data.userId,
					org:data.org
				}*/
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
		});
	}
}
exports.getRelatedRecords=getRelatedRecords;

/**
 *
 * @param data
 *            (recordIds,rootSchema, relationRefSchema,userId)
 * @param callback
 */
function getRelationRecords(request,callback){
	var data=urlParser.getRequestBody(request);
	if(!data.userId){
		data.userId="CommonUser";
	}
	CouchBaseUtil.getDocumentByIdFromMasterBucket(data.relationRefSchema,function(schemas){

		if(schemas.error){
			callback(schemas);
			return;
		}
		var relSchema=schemas.value;
		/*var relatedSchema="";
		for(var i in relSchema["@relationDesc"]){
			if(relSchema["@relationDesc"][i].split("-")[0]==data.rootSchema){
				if(relSchema["@relationDesc"][i].split("-")[2]=="recordId"){
					relatedSchema=data.relationRefSchema;
				}else{
					relatedSchema=relSchema["@relationDesc"][i].split("-")[2];

				}
			}
		}*/
		//if the call is made for trigger invocation then
		//trigger expects full records
		if(data.fromTrigger){
			CouchBaseUtil.getDocumentsByIdsFromContentBucket(data.recordIds,function(recs){
				var tempRecords=[];
				for(var key in recs){
					tempRecords.push(recs[key]);
				}
				callback({
						records:tempRecords,
						relatedSchema:data.relationRefSchema,
						schema:relSchema,
					});
			});
			//if the relation view doesn't require full View
		}else if(data.relationView==undefined || (data.relationView!="GoDetail" && data.relationView!="TableEditView")){
			/*var query = ViewQuery.from(data.relationRefSchema,"summary").keys(data.recordIds).reduce(false);
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
					schema:relSchema,
					});
			});*/
			var keys=GenericSummeryServer.getSummaryKeys(relSchema).keys;
			//var queryString = "SELECT `"+keys.join("`,`")+"` FROM `records` WHERE docType= $1  AND `recordId` IN $2";
			var queryString = "SELECT `"+keys.join("`,`")+"` FROM `records` USE KEYS $2";
			CouchBaseUtil.executeN1QL(queryString,{parameters:[data.relationRefSchema,data.recordIds]},function(results){
				if(results.error){
					callback(results);
					return;
				}
				var recs=[];
				for(var index in results){
					recs.push({id:results[index].recordId,key:results[index].recordId,value:results[index]})
				}
				callback({
					records:recs,
					relatedSchema:data.relationRefSchema,
					schema:relSchema,
				});
			});
		}else{//if the relation view requires full View
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
exports.getRelationRecords=getRelationRecords;

/**
 * Search in elasticsearch returns recordIds
 * this function returns summary view of the recordIds
 *
 */
function getSearchResults(request,callback){
	var data=urlParser.getRequestBody(request);
	/*if(!data.userId){
		data.userId="CommonUser";
	}
	var query = ViewQuery.from(data.schema,"summary").keys(data.recordIds).reduce(false);
	CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		callback({records:results});
	});
*/
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		var keys=GenericSummeryServer.getSummaryKeys(schema).keys;
		//var query = N1qlQuery.fromString("SELECT `"+keys.join("`,`")+"` FROM `records` WHERE docType=$1 AND `recordId` IN $2");
		var query = "SELECT `"+keys.join("`,`")+"` FROM `records` USE KEYS $2";
		CouchBaseUtil.executeN1QL(query,{parameters:[data.schema,data.recordIds]},function(results){
			var recs=[];
			for(var index in results){
				recs.push({id:results[index].recordId,key:[],value:results[index]})
			}
			if(typeof callback=="function")
			callback({records:recs});
		});
	});
}
exports.getSearchResults=getSearchResults;
