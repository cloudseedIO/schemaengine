var couchbase = require('couchbase');
var QueryScanConsistency= couchbase.QueryScanConsistency;
var CouchBaseUtil=require('./CouchBaseUtil');
var ContentServer=require('../ContentServer.js');
var urlParser=require('./URLParser');
var global=require("../utils/global.js");

var logger = require('../services/logseed').logseed;
const { ViewScanConsistency } = require('couchbase');
/**
 * 
 * @param data {schema, dependentSchema,cloudPointHostId}
 * @param callback
 */
function getMainSchema(data,callback){
	var cloudPointHostId=data.cloudPointHostId;
	CouchBaseUtil.getDocumentByIdFromMasterBucket(data.schema,function(response){
		// console.log("got schema "+(new Date()-prevDate));
		if(response.error){
			callback(response);
			return;
		}
		var schema=response.value;
		var schemaIdToCombine;
		if(schema.cloudPointHostId && schema.cloudPointHostId=="master"){
			var config=ContentServer.getConfigByHostId(cloudPointHostId);
			if(config.hostSpecificSchemas && config.hostSpecificSchemas[data.schema]){
				schemaIdToCombine=config.hostSpecificSchemas[data.schema];
			}
		}
		if(typeof data.dependentSchema!="undefined" && data.dependentSchema!=""){
			schemaIdToCombine=data.schema+"-"+data.dependentSchema;
		}
		if(schemaIdToCombine){
			// instead
			// getSchema({schema:data.schema+"-"+data.dependentSchema},
			// --> CouchBaseUtil.getDocumentByIdFromMasterBucket
			CouchBaseUtil.getDocumentByIdFromMasterBucket(schemaIdToCombine,function(dependentSchemas){
				// console.log("got schema "+(new Date()-prevDate));
				if(dependentSchemas.error){
					callback({schema:schema});
				}else{
					var subSchema=dependentSchemas.value;
					schema = global.combineSchemas(schema,subSchema);
					callback(schema);
				}
			});
		}else{
			callback(schema)
		}
	});
}
exports.getMainSchema=getMainSchema;


function getSchemaById(recordId,callback){
	CouchBaseUtil.getDocumentByIdFromMasterBucket(recordId, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results.value);
	});
}
exports.getSchemaById=getSchemaById;
/**
 * gets a definition document
 * @param recordId
 * @param callback
 */
function getDefinition(recordId,callback){
	if(recordId!=undefined){
		CouchBaseUtil.getDocumentByIdFromDefinitionBucket(recordId,function(recordReq){
			if(recordReq.error){
				callback(recordReq);
				return;
			}else{
				callback(recordReq.value);
				return;
			}
		});	
	}else{
		callback({});
	}
}
exports.getDefinition=getDefinition;

/**
 * get all schemas structs dependent schemas
 * @param callback
 */
function getAllSchemasStructsDependentSchemas(cloudPointHostId,callback){
	CouchBaseUtil.executeViewInMasterBucket("schema","getAllSchemasStructsDependentSchemas",{keys:["master",cloudPointHostId],stale:ViewScanConsistency.NotBounded},function(response){
		var config=ContentServer.getConfigByHostId(cloudPointHostId);
		if(config.hostSpecificSchemas && !response.error && response.length>0){
			for(var i=0;i<response.length;i++){
				if(response[i].id && config.hostSpecificSchemas[response[i].id]){
					var subSchema;
					for(var j=0;j<response.length;j++){
						if(response[j].id==config.hostSpecificSchemas[response[i].id]){
							subSchema=response[j].value;
							break;
						}
					}
					if(subSchema)
					response[i].value=global.combineSchemas(response[i].value,subSchema)
				}
			}
		}
		
		callback(response);
	});	
}
exports.getAllSchemasStructsDependentSchemas=getAllSchemasStructsDependentSchemas;

function getAllSchemaNamesOfHost(host,callback){
	CouchBaseUtil.executeViewInMasterBucket("schema", "getAllSchemas",{keys:["master",host],stale:ViewScanConsistency.NotBounded}, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback([]);
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			callback(rowData);
		}
	});
}
exports.getAllSchemaNamesOfHost=getAllSchemaNamesOfHost;

function getAllLandingPages(host,callback){
	CouchBaseUtil.executeViewInDefinitionBucket("definitions", "landingPages",{key:host,stale:ViewScanConsistency.NotBounded}, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback([]);
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			callback(rowData);
		}
	});
}
exports.getAllLandingPages=getAllLandingPages;

function getAllRoles(host,callback){
	CouchBaseUtil.executeViewInContentBucket("Role", "allRoles",{key:host,stale:ViewScanConsistency.NotBounded}, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback([]);
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			callback(rowData);
		}
	});
}
exports.getAllRoles=getAllRoles;
/**
 * generates unique id
 */
var guid = (function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return function() {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
	};
})();

exports.guid=guid;

/**
 * get all triggers
 * @param callback
 */
function getAllTriggers(cloudPointHostId,callback){
	CouchBaseUtil.executeViewInMasterBucket("Trigger","getAllTriggers",{key:[cloudPointHostId],stale:ViewScanConsistency.NotBounded},function(response){
		
		/*
		var config=ContentServer.getConfigByHostId(cloudPointHostId);
		if(config.hostSpecificSchemas && !response.error && response.length>0){
			for(var i=0;i<response.length;i++){
				if(response[i].id && config.hostSpecificSchemas[response[i].id]){
					var subSchema;
					for(var j=0;j<response.length;j++){
						if(response[j].id==config.hostSpecificSchemas[response[i].id]){
							subSchema=response[j].value;
							break;
						}
					}
					if(subSchema)
					response[i].value=global.combineSchemas(response[i].value,subSchema)
				}
			}
		}*/
		
		callback(response);
	});	
}
exports.getAllTriggers=getAllTriggers;




/**
 * get all triggers
 * @param callback
 */
function getAllRestApiServices(cloudPointHostId,callback){
	CouchBaseUtil.executeViewInMasterBucket("RestAPI","getAllRestApiServices",{key:[cloudPointHostId],stale:ViewScanConsistency.NotBounded},function(response){
		
		/*
		var config=ContentServer.getConfigByHostId(cloudPointHostId);
		if(config.hostSpecificSchemas && !response.error && response.length>0){
			for(var i=0;i<response.length;i++){
				if(response[i].id && config.hostSpecificSchemas[response[i].id]){
					var subSchema;
					for(var j=0;j<response.length;j++){
						if(response[j].id==config.hostSpecificSchemas[response[i].id]){
							subSchema=response[j].value;
							break;
						}
					}
					if(subSchema)
					response[i].value=global.combineSchemas(response[i].value,subSchema)
				}
			}
		}*/
		
		callback(response);
	});	
}
exports.getAllRestApiServices=getAllRestApiServices;



function saveNavigation(data,callback){
	var cloudPointHostId=data.cloudPointHostId;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	if(config.cloudPointNavDocId){
		CouchBaseUtil.upsertDocumentInDefinitionBucket(config.cloudPointNavDocId,data.nav,function(response){
			callback(response)
		})
	}else{
		callback({error:"invalid host"});
	}
}
exports.saveNavigation=saveNavigation;


function saveBranding(data,callback){
	var cloudPointHostId=data.cloudPointHostId;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	if(config.recordId){
		CouchBaseUtil.getDocumentByIdFromDefinitionBucket(config.recordId,function(response){
			if(response.value){
				var configFile=response.value;
				configFile.branding=data.branding;
				CouchBaseUtil.upsertDocumentInDefinitionBucket(configFile.recordId,configFile,function(saveresponse){
					callback(saveresponse);
				});
			}else{
				callback(response);
			}
		})
	}else{
		callback({error:"invalid host"});
	}
}
exports.saveBranding=saveBranding;

function saveConfigHTML(data,callback){
	var cloudPointHostId=data.cloudPointHostId;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	if(config.recordId){
		CouchBaseUtil.getDocumentByIdFromDefinitionBucket(config.recordId,function(response){
			if(response.value){
				var configFile=response.value;
				configFile.htmlToInclude=data.html;
				CouchBaseUtil.upsertDocumentInDefinitionBucket(configFile.recordId,configFile,function(saveresponse){
					callback(saveresponse);
				});
			}else{
				callback(response);
			}
		})
	}else{
		callback({error:"invalid host"});
	}
}

exports.saveConfigHTML=saveConfigHTML;




function saveHTMLMeta(data,callback){
	var cloudPointHostId=data.cloudPointHostId;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	CouchBaseUtil.getDocumentByIdFromMasterBucket(data.schemaName,function(response){
		if(response.value){
			var schemaDoc=response.value;
			schemaDoc.htmlMeta=data.htmlMeta;
			schemaDoc.displayName=data.displayName;
			schemaDoc["@footerText"]=data.footerText;
			schemaDoc["@displayName"]=data.displayName;
			schemaDoc["navFilters"]=data.navFilters;
			if(data.uniqueUserName && data.uniqueUserName!=""){
				schemaDoc["@uniqueUserName"]=data.uniqueUserName;
			}
			schemaDoc["webCrawlerIndex"]=data.webCrawlerIndex;
			CouchBaseUtil.upsertDocumentInMasterBucket(schemaDoc["@id"],schemaDoc,function(saveresponse){
				callback(saveresponse);
			});
		}else{
			callback(response);
		}
	})
}

exports.saveHTMLMeta=saveHTMLMeta;

function saveDefinition(def,callback){
	CouchBaseUtil.upsertDocumentInDefinitionBucket(def.recordId,def,function(result) {
		callback(result);
	 });
}
exports.saveDefinition=saveDefinition;
function deleteDefinition(recordId,callback){
	CouchBaseUtil.removeDocumentByIdFromDefinitionBucket(recordId,function(result) {
		callback(result);
	 });
}
exports.deleteDefinition=deleteDefinition;
function getKeywords(request,callback){
	var data=urlParser.getRequestBody(request);
	CouchBaseUtil.getDocumentsByIdsFromContentBucket(data.ids,function(result){
		if(result.error){
			callback(result);
		}else{
			var keywords={};
			for(var key in result){
				try{
					if(result[key].value["@metaKeywords"]){
						for(var i=0;i<result[key].value["@metaKeywords"].length;i++){
							keywords[result[key].value["@metaKeywords"][i]]=result[key].value["@metaKeywords"][i];
						}
					}
				}catch(err){}
			}
			callback(Object.keys(keywords));
		}
	});
}
exports.getKeywords=getKeywords;
function saveKeywords(request,callback){
	var data=urlParser.getRequestBody(request);
	CouchBaseUtil.getDocumentsByIdsFromContentBucket(data.ids,function(result){
		if(result.error){
			callback(result.error);
		}
		
		var keywords={};
		for(var i=0;i<data.keywords.length;i++){
			keywords[data.keywords[i]]=data.keywords[i];
		}
		
		updateProduct(0);
		
		function updateProduct(index){
			try{
				var docu=result[data.ids[index]].value;
				docu["@metaKeywords"]=Object.keys(keywords);
				CouchBaseUtil.upsertDocumentInContentBucket(docu.recordId,docu,function(result2) {
					if((index+1)<data.ids.length){
						updateProduct(index+1);
					}else{
						callback({"result":"updated",});
					}
				});
			}catch(err){
				if((index+1)<data.ids.length){
					updateProduct(index+1);
				}else{
					callback({"result":"updated",});
				}
			}
		}
		
	});
}
exports.saveKeywords=saveKeywords;

function saveRole(role,callback){
	CouchBaseUtil.upsertDocumentInContentBucket(role.recordId,role,function(results) {
		 callback(results);
	 });
}
exports.saveRole=saveRole;


function getRole(role,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(role.roleId,function(result) {
		if(result.value){
			if(result.value.cloudPointHostId==role.cloudPointHostId){
				callback(result.value);
			}else{
				callback({error:"Requested an ivalid role"});
			}
		}else{
			callback({error:"Error while getting role document"})
		}
	 });
}
exports.getRole=getRole;

function saveExploreMeta(data,callback){
	var cloudPointHostId=data.cloudPointHostId;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	CouchBaseUtil.upsertDocumentInContentBucket(data.recordId,data,function(saveresponse){
		callback(saveresponse);
	});
}

exports.saveExploreMeta=saveExploreMeta;

