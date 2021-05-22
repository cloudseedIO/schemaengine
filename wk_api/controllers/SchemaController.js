var cloudinary = require('cloudinary');
var urlParser=require('./URLParser');
var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress);//config.cbAddress+":"+config.cbPort
var CouchBaseUtil=require('./CouchBaseUtil.js');
var ContentServer=require('../ContentServer.js');
var utility=require('./utility.js');
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var global=require('../utils/global.js');
cloudinary.config({ 
   cloud_name: config.clCloud_name,
   api_key: config.clAPI_key, 
   api_secret: config.clAPI_secret
});

exports.service = function(request,response){
	var operationValue = request.query.operation; 
	if(operationValue == undefined){
		operationValue = urlParser.getParameterValue(request.url,"operation");
	}
	/**
	 * The Following is used to match OperationValue of current Request  with the  (post or get ) requests 
	 */
	/*if(operationValue == "getMasterSchema"){
		getMasterSchema(function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else*/ if(operationValue == "getSchemaObjects"){
		getSchemaObjects(request,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getUniqueSchemaObjects"){
		getUniqueSchemaObjects(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "saveSchema"){
		saveSchema(request,request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getCustomSchema"){
		getCustomSchema(request,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getDocs"){
		getDocs(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getRecord"){
		getRecord(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "saveRecord"){
		saveRecord(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "saveAllImages"){
		saveAllImages(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "saveAllVideos"){
		saveAllVideos(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "deleteCloudinaryVideos"){
		deleteCloudinaryVideos(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}/*else if(operationValue == "getStructNames"){
		getStructNames(function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getUserStructs"){
		getUserStructs(request,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "dynamicViewCreation"){
		dynamicViewCreation(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send(jsonObject);
		});
	}*/
	else if(operationValue == "getUserSchemas"){
		getUserSchemas(request,request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getSuperTypeSchemas"){
		getSuperTypeSchemas(request,request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getDerivedObjects"){
		getDerivedObjects(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getAllSchemas"){
		getAllSchemas(function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getCloudinaryData"){
		getCloudinaryData(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "saveDefinition"){
		saveDefinition(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getDefinition"){
		getDefinition(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getUITemplates"){
		getUITemplates(function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "deleteImage"){
		deleteImage(request.body.publicId,"image",function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "saveImages"){
		saveImages(request.body.imageUrl,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "getSchemaRelatedUITemplates"){
		getSchemaRelatedUITemplates(request.body,function(jsonObject){
			response.contentType("application/json");
			response.send({"data":jsonObject});
		});
	}else if(operationValue == "checkIdentifier"){
		checkIdentifier(request,request.body,function(jsonObject){
			response.contentType("application/json");
			response.send(jsonObject);
		});
	}
};




/**
 * This function is used to get schema objects from master database
 * @param callback	--- returns arry of json
 */
async function getSchemaObjects(request,callback){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	//var query = ViewQuery.from("schema", "getSchemas").key(cloudPointHostId).stale(ViewQuery.Update.NONE);
	var results=await cbMasterBucket.viewQuery("schema", "getSchemas",{key:cloudPointHostId}).catch(e=>{console.log(e);});
   //CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(i in results){
			rowData.push(results[i].value);	
		}
		callback(rowData);
	//});	
}

/**
 * This function is used to get the single schema object based on the schema id
 * @param obj		--	unique id for the doc
 * @param callback	---	returns the json object related to id
 */
function getUniqueSchemaObjects(obj,callback){
	CouchBaseUtil.getDocumentByIdFromMasterBucket(obj.name, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results.value);
	});
}
exports.getUniqueSchemaObjects=getUniqueSchemaObjects;
/**
 * This function is used to save/update the "product type"(subSchema) in master data bucket 
 * @param data		----	json object recceiving from client side
 * @param callback	----	returns the status(save/not saved)
 */
function saveSchema(request,data,callback) {
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	data["cloudPointHostId"]=cloudPointHostId;
	
	//auto number generation code
	Object.keys(data["@properties"]).map(function(key){
		if(data["@properties"][key].dataType.type == "autoNumber"){
			if(data["@properties"][key].dataType.autoNumberType == 'number'){
				var temp={};
				temp["recordId"]=data["@id"]+"AutoNumberCounter";
				temp["cloudPointHostId"]=cloudPointHostId;
				temp["count"]=1;
				temp["schemaName"]=data["@id"];
				temp["dateCreated"] = global.getDate();
				temp["dateModified"] = global.getDate();
				temp["prefix"]=data["@id"];
				data["autoNumberRecordId"]=temp["recordId"];
				saveDefinition(temp,function(dbres){
					if(dbres.error){
						console.log("Failed to create Auto Number Record with ID : "+temp["recordId"]);
						callback(dbres);
						return;
					}
					console.log("Auto Number Record sucessfully created with ID : "+temp["recordId"]);
				})
			}else if(data["@properties"][key].dataType.autoNumberType == 'TODO'){
				
			}
		}
	})
	
	
	if(data.hasOwnProperty("@views")){
		var viewsLength = data["@views"].length;
		if(viewsLength > 0){
			for(views = 0;views < viewsLength;views++){
				if(data["@security"]){
					if(Object.keys(data["@security"]).length == 0){
						data["@views"][views]["key"].unshift("org");
					}else{
						if(data["@security"].recordLevel.view == "all" &&  data["@security"].recordLevel.update != "all"){
							data["@views"][views]["key"].unshift(data["@security"].recordLevel.update);
						}else if(data["@security"].recordLevel.view != "all"){
							data["@views"][views]["key"].unshift(data["@security"].recordLevel.view);
						}
					}
				}else{
					data["@views"][views]["key"].unshift("org");
				}
				data["@views"][views]["key"] = removeDuplicatesIn1DArray(data["@views"][views]["key"]);
			}
		}
	}
	console.log(data["@views"]);
	if(data.hasOwnProperty("junctionSchema")){
		var relationSchemas = data.junctionSchema;
		var actionButtonNames = data.actionButtonNames;
		var relatedButtonNames = data.relatedButtonNames;
		var relationView = data.relationView;
		/*delete data.junctionSchema;
		delete data.actionButtonNames;
		delete data.relatedButtonNames;
		delete data.relationView*/
		
		getSchema(0);
		function getSchema(i){
			if(i < relationSchemas.length){
				CouchBaseUtil.getDocumentByIdFromMasterBucket(relationSchemas[i],function(doc) {
					if(doc.error){
						//callback(res);
						console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the document "+relationSchemas[i]);
						console.log("@@@@@@@@@@@@@@@@@@ reference function getSchema()");
						getSchema(i+1);
					}else{
						if(i == 0){
							index = 1;
						}else if(i == 1){
							index = 0;
						}
						var schema = doc.value;
						schema.hasOwnProperty("@relations") ? (schema["@relations"] = schema["@relations"]) : (schema["@relations"] = {});
						schema["@relations"][relationSchemas[index]] = {};
						schema["@relations"][relationSchemas[index]]["relationRefSchema"] = data["@id"];
						schema["@relations"][relationSchemas[index]]["knownKey"] = relationSchemas[i];
						schema["@relations"][relationSchemas[index]]["relationName"] = data["@relationDesc"][i].split("-")[1];
						schema["@relations"][relationSchemas[index]]["action"] = {};
						schema["@relations"][relationSchemas[index]]["action"]["displayName"] = actionButtonNames[i];
						schema["@relations"][relationSchemas[index]]["showRelated"] = {};
						schema["@relations"][relationSchemas[index]]["showRelated"]["displayName"] = relatedButtonNames[i];
						schema["@relations"][relationSchemas[index]]["relationView"] = relationView[i];
						
						CouchBaseUtil.upsertDocumentInMasterBucket(schema["@id"],schema,function(result) {
							if(result.error){
								//callback(res);
								//return;
								console.log("@@@@@@@@@@@@@@@@@@ error genereted while saving the document with "+schema["@id"]);
								console.log("@@@@@@@@@@@@@@@@@@ reference function getSchema()()");
								getSchema(i+1);
							}else{
								 console.log("document with id "+schema["@id"]+" updation sucessfully (@relations)");
								 getSchema(i+1);
								 /*if((relationSchemas.length -1) == i){
									 CouchBaseUtil.upsertDocumentInMasterBucket(data["@id"],data,function(results) {
										if(results.error){
											callback(results);
											return;
										}else{
											callback(results);
											return;
										}
									})
								 }else{
									 getSchema(i+1);
								 }*/
							}
						})
					}
				})
			}
		}
		
	}
	if(data.hasOwnProperty("removableDerivedObjects")){
		var removableDerivedObjects = data.removableDerivedObjects;
		delete data.removableDerivedObjects;
		
		getDerivedObjectSchemas2(0);
		
		function getDerivedObjectSchemas2(e){
			if(e < removableDerivedObjects.length){
				var id = data["@id"]+"-"+removableDerivedObjects[e];
				CouchBaseUtil.getDocumentByIdFromMasterBucket(id,function(doc) {
					if(doc.error){
						//callback(res);
						console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the document "+id);
						console.log("@@@@@@@@@@@@@@@@@@ reference function getDerivedObjectSchemas2");
						getDerivedObjectSchemas2(e+1);
					}else{
						var schema = doc.value;
						schema["status"] = "Deleted";
						CouchBaseUtil.upsertDocumentInMasterBucket(schema["@id"],schema,async function(result) {
							if(result.error){
								//callback(res);
								//return;
								console.log("@@@@@@@@@@@@@@@@@@ error genereted while saving the document with "+schema["@id"]);
								console.log("@@@@@@@@@@@@@@@@@@ reference function getDerivedObjectSchemas2()");
								getDerivedObjectSchemas2(e+1);
							}else{
								 console.log("document with id "+schema["@id"]+" updation sucessfully");
									//var query = ViewQuery.from("common", "removeRecords").key(data["@id"]+"-"+removableDerivedObjects[e]).stale(ViewQuery.Update.NONE);
									var records=await cbContentBucket.viewQuery("common", "removeRecords",{key:data["@id"]+"-"+removableDerivedObjects[e]}).catch(e=>{console.log(e);});
									//CouchBaseUtil.executeViewInContentBucket(query, function(records) {
										if(records.error){
											console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting  records");
											console.log("@@@@@@@@@@@@@@@@@@ reference function getDerivedObjectSchemas2()");
											getDerivedObjectSchemas2(e+1);
											return;
										}
										var rowData=new Array();
										for(i in records){
											rowData.push(records[i].value);	
										}
										if(rowData.length > 0){
											getRecords2(0);
											
											function getRecords2(f){
												if(f < rowData.length){
													CouchBaseUtil.getDocumentByIdFromContentBucket(rowData[f],function(oldRecords){//getDocumentsByIdsFromContentBucket
														if(oldRecords.error){
															//callback(oldRecords);
															//return;
															console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the Record");
															console.log("@@@@@@@@@@@@@@@@@@ reference function getRecords()");
															getRecords(b+1);
														}else{
															var record = oldRecords.value;
															record["status"] = "Deleted";
															console.log("Record with id "+rowData[f]+" getting successfully");
															
															CouchBaseUtil.upsertDocumentInContentBucket(record.recordId,record,function(rcd) {
																if(rcd.error){
																	//callback(oldRecords);
																	//return;
																	console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the Record");
																	console.log("@@@@@@@@@@@@@@@@@@ reference function getRecords()");
																	getRecords(b+1);
																}else{
																	console.log("Record with id "+rowData[f]+" upsert successfully");
																	if(f == rowData.length-1){
																		getDerivedObjectSchemas2(e+1);
																	}else{
																		getRecords2(f+1);
																	}
																}
															})
															
														}
													})
												}
											}
										}else{
											getDerivedObjectSchemas2(e+1);
										}
									//})
							}
						})
					}
				})
			}
		}
	}
	if(data.hasOwnProperty("deleteOldDerivedDocs")){
		delete data.deleteOldDerivedDocs;
		CouchBaseUtil.getDocumentByIdFromMasterBucket(data["@id"],function(res) {
			if(res.error){
				callback(res);
			}else{
				var dk = res.value["@dependentKey"];
				var options = res.value["@properties"][dk].dataType.options;
				
				
				getDerivedObjectSchemas(0);
				
				function getDerivedObjectSchemas(a){
					if(a < options.length){
						CouchBaseUtil.getDocumentByIdFromMasterBucket(data["@id"]+"-"+options[a],function(doc) {
							if(doc.error){
								//callback(res);
								console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the document "+data["@id"]+"-"+options[a]);
								console.log("@@@@@@@@@@@@@@@@@@ reference function getDerivedObjectSchemas");
								getDerivedObjectSchemas(a+1);
							}else{
								var schema = doc.value;
								schema["status"] = "Deleted";
								CouchBaseUtil.upsertDocumentInMasterBucket(schema["@id"],schema,async function(result) {
									if(result.error){
										//callback(res);
										//return;
										console.log("@@@@@@@@@@@@@@@@@@ error genereted while saving the document with "+schema["@id"]);
										console.log("@@@@@@@@@@@@@@@@@@ reference function getDerivedObjectSchemas()");
										getDerivedObjectSchemas(a+1);
									}else{
										 console.log("document with id "+schema["@id"]+" updation sucessfully");
										//var query = ViewQuery.from("common", "removeRecords").key(data["@id"]+"-"+options[a]).stale(ViewQuery.Update.NONE);
										var recordIds=await cbContentBucket.viewQuery("common", "removeRecords",{key:data["@id"]+"-"+options[a]}).catch(e=>{console.log(e);});
										//CouchBaseUtil.executeViewInContentBucket(query, function(recordIds) {
											if(recordIds.error){
												console.log("@@@@@@@@@@@@@@@@@@ error genereted while executing view ");
												console.log("@@@@@@@@@@@@@@@@@@ reference function getDerivedObjectSchemas()");
												getDerivedObjectSchemas(a+1);
												return;
											}
											var rowData = [];
											for(i in recordIds){
												rowData.push(recordIds[i].value);	
											}
											if(rowData.length > 0){
												getRecords(0);
												
												function getRecords(b){
													if(b < rowData.length){
														CouchBaseUtil.getDocumentByIdFromContentBucket(rowData[b],function(oldRecords){//getDocumentsByIdsFromContentBucket
															if(oldRecords.error){
																//callback(oldRecords);
																//return;
																console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the Record");
																console.log("@@@@@@@@@@@@@@@@@@ reference function getRecords()");
																getRecords(b+1);
															}else{
																var record = oldRecords.value;
																record["status"] = "Deleted";
																console.log("Record with id "+rowData[b]+" getting successfully");
																
																CouchBaseUtil.upsertDocumentInContentBucket(record.recordId,record,function(rcd) {
																	if(rcd.error){
																		//callback(oldRecords);
																		//return;
																		console.log("@@@@@@@@@@@@@@@@@@ error genereted while getting the Record");
																		console.log("@@@@@@@@@@@@@@@@@@ reference function getRecords()");
																		getRecords(b+1);
																	}else{
																		console.log("Record with id "+rowData[b]+" upsert successfully");
																		if(b == rowData.length-1){
																			getDerivedObjectSchemas(a+1);
																		}else{
																			getRecords(b+1);
																		}
																	}
																})
																
															}
														})
													}
												}
											}else{
												getDerivedObjectSchemas(a+1);
											}
										//});	
										if(options.length-1 == a){
											CouchBaseUtil.upsertDocumentInMasterBucket(data["@id"],data,function(results) {
												if(results.error){
													callback(results);
													return;
												}else{
													if(data.hasOwnProperty("@dependentKey")){
														var dependentKey = data["@dependentKey"];
														var options = data["@properties"][data["@dependentKey"]].dataType.options;
														
														saveDerivedObject(0);
														
														function saveDerivedObject(z){
															if(z < options.length){
																var temp = {};
																temp["docType"] = "schema";
																temp["@type"] = "derivedObject";
																temp["@superType"] = data["@superType"];
																temp["@id"] = data["@id"]+"-"+options[z];
																temp["@abstractObject"] = data["@id"];
																temp["@referenceSchema"] = data["@id"];
																temp["@sysProperties"] = data["@sysProperties"];
																temp["@properties"] = {};
																//temp["@relations"] = data["@relations"];
																CouchBaseUtil.getDocumentByIdFromMasterBucket(temp["@id"],function(response) {
																	if(response.error){
																		CouchBaseUtil.upsertDocumentInMasterBucket(temp["@id"],temp,function(res) {
																			if(res.error){
																				callback(res);
																				return;
																			}
																			console.log("New Derived Document with id "+temp["@id"]+" created successfully");
																		    saveDerivedObject(z+1);
																		})
																	}else{
																		saveDerivedObject(z+1);
																	}
															   });
															}
														}
													}
													if(data.hasOwnProperty("@views")){
														if(data["@views"].length > 0){
															schemaViewCreation(data,function(res){
																callback(results);
															})
														}else{
															console.log("views========");
															callback(results);
														}
													}else{
														callback(results);
													}
													
													
													
													/****************** for adding relation description when object reference type child (or) ref typw lookup with ref key recordId*****************/
													var objArray = [],relationDescArray = [];
													Object.keys(data["@properties"]).map(function(property){
														if(data["@properties"][property].dataType.type == "object"){ 
														    if(data["@properties"][property].dataType.hasOwnProperty("relationDesc")){
														    	objArray.push(property);
														    	relationDescArray.push(data["@properties"][property].dataType.relationDesc);
														    	console.log(objArray);
														    	console.log(relationDescArray);
														    }
														 }
													})

													addRelationDesc(0);
													
													function addRelationDesc(i){
														console.log(1);
														if(i < objArray.length){
															CouchBaseUtil.getDocumentByIdFromMasterBucket(objArray[i],function(response) {
														    	  if(response.error){
																		console.log("@@@@@@@@@ error generated while getting Document with id "+property);
																		console.log("@@@@@@@@@ reference function addRelationDesc()");
																		addRelationDesc(i+1);
																	}else{
																		var res = response.value;
																		res["@relationDesc"] ? res["@relationDesc"]=res["@relationDesc"] : res["@relationDesc"]=[];
																		res["@relationDesc"].push(relationDescArray[i][0]);
																		res["@relationDesc"].push(relationDescArray[i][1]);
																		CouchBaseUtil.upsertDocumentInMasterBucket(res["@id"],res,function(res) {
																			if(res.error){
																				callback(res);
																				return;
																			}
																			console.log(objArray[i]+" document @relationDesc added successfully");
																		})
																	}
														      })
														}
													}
													
													
													
													
												}
												
											 });
										}
									}
								})
							}
						})
					}
				}
			}
		})
		
	}else{
		CouchBaseUtil.upsertDocumentInMasterBucket(data["@id"],data,function(results) {
			if(results.error){
				callback(results);
				return;
			}else{
				console.log("Document with id "+data["@id"]+" upserted successfully");
				if(data.hasOwnProperty("@dependentKey")){
					var dependentKey = data["@dependentKey"];
					var options = data["@properties"][data["@dependentKey"]].dataType.options;
					
					saveDerivedObject(0);
					
					function saveDerivedObject(z){
						if(z < options.length){
							var temp = {};
							temp["docType"] = "schema";
							temp["@type"] = "derivedObject";
							temp["@superType"] = data["@superType"];
							temp["@id"] = data["@id"]+"-"+options[z];
							temp["@abstractObject"] = data["@id"];
							temp["@referenceSchema"] = data["@id"];
							temp["@sysProperties"] = data["@sysProperties"];
							temp["@properties"] = {};
							//temp["@relations"] = data["@relations"];
							CouchBaseUtil.getDocumentByIdFromMasterBucket(temp["@id"],function(response) {
								if(response.error){
									console.log("New Derived Document with id "+temp["@id"]+" created successfully");
									CouchBaseUtil.upsertDocumentInMasterBucket(temp["@id"],temp,function(res) {
										if(res.error){
											callback(res);
											return;
										}
									    saveDerivedObject(z+1);
									})
								}else{
									var documentData = response.value;
									delete documentData.status;
									console.log("deleting the status for document id = "+documentData["@id"]);
									CouchBaseUtil.upsertDocumentInMasterBucket(documentData["@id"],documentData,function(res) {
										if(res.error){
											callback(res);
											return;
										}
										console.log("Old document with id = "+documentData["@id"] +" status key deleted and re insrted the document");
									    saveDerivedObject(z+1);
									})
									//saveDerivedObject(z+1);
								}
						   });
						}
					}
				}
				console.log("view ceation ....");
				if(data.hasOwnProperty("@views")){
					if(data["@views"].length > 0){
						schemaViewCreation(data,function(res){
							callback(results);
						})
					}else{
						console.log("views========");
						callback(results);
					}
				}else{
					callback(results);
				}
				
				/****************** for adding relation description when object reference type child (or) ref typw lookup with ref key recordId*****************/
				var objArray = [],relationDescArray = [],relData;
				Object.keys(data["@properties"]).map(function(property){
					if(data["@properties"][property].dataType.type == "object"){ 
					    if(data["@properties"][property].hasOwnProperty("parentData")){
					    	objArray.push(data["@properties"][property].parentData.schemaName);
					    	//relationDescArray.push(data["@properties"][property].parentData.relationDesc);
					    	relData = data["@properties"][property].parentData.relationData;
					    	console.log(objArray);
					    	console.log(relData);
					    	delete data["@properties"][property].parentData;
					    }
					 }
				})

				addRelationDesc(0);
				
				function addRelationDesc(i){
					console.log(1);
					if(i < objArray.length){
						CouchBaseUtil.getDocumentByIdFromMasterBucket(objArray[i],function(response) {
					    	  if(response.error){
									console.log("@@@@@@@@@ error generated while getting Document with id "+property);
									console.log("@@@@@@@@@ reference function addRelationDesc()");
									addRelationDesc(i+1);
								}else{
									var res = response.value;
									//res["@relationDesc"] ? res["@relationDesc"] : res["@relationDesc"]=[];
									//res["@relationDesc"].push(relationDescArray[i][0]);
									//res["@relationDesc"].push(relationDescArray[i][1]);
									res["@relations"] ? res["@relations"] : res["@relations"]={};
									res["@relations"][Object.keys(relData)[0]] = relData[Object.keys(relData)[0]];
									CouchBaseUtil.upsertDocumentInMasterBucket(res["@id"],res,function(res) {
										if(res.error){
											callback(res);
											return;
										}
										console.log(objArray[i]+" document @relationDesc added successfully");
									})
								}
					      })
					}
				}
			}
			
		 });
	}
}




/**
 * This function is used to get the all saved "product type"(subSchema) data 
 * @param callback	--- returns an array having subSchema names
 */
async function getCustomSchema(request,callback){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	//var query = ViewQuery.from("schema", "getCustomSchema").key(cloudPointHostId).stale(ViewQuery.Update.NONE);
	var results=await cbMasterBucket.viewQuery("schema", "getCustomSchema",{key:cloudPointHostId}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(i in results){
			rowData.push(results[i].value);	
		}
		callback(rowData);
	//});
}
/**
 * used to get the document based on key
 * @param data			---	 name(String) 
 * @param callback		---	returns list of matched docs if available else null
 */
async function getDocs(data,callback){
	//var query = ViewQuery.from("getDoc", "getDocsList").key(data.name).stale(ViewQuery.Update.NONE);
	var results=await cbContentBucket.viewQuery("getDoc", "getDocsList",{key:data.name}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback(null);
		}else{
			var rowData=new Array();
			for(i in results){
				/*if(results[i].value.hasOwnProperty("status")){//dont delete 
					if(results[i].value.status != "Deleted"){
						rowData.push(results[i].value);	
					}
				}*/
				rowData.push(results[i].value);	
				
			}
			callback(rowData);
		}
	//});
}

/**
 * used to get the document based on key
 * @param data			---	 name(String) 
 * @param callback		---	returns list of matched docs if available else null
 */
function getRecord(data,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.name, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results.value);
	});
}

function saveRecord(data,callback) {
	CouchBaseUtil.upsertDocumentInContentBucket(data.recordId,data,function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results);
	 });

}

function saveDefinition(data,callback) {
	CouchBaseUtil.upsertDocumentInDefinitionBucket(data.recordId,data,function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results);
	 });

}

function getDefinition(data,callback){
	CouchBaseUtil.getDocumentByIdFromDefinitionBucket(data.recordId, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results.value);
	});
}
async function getUITemplates(callback){
	//var query = ViewQuery.from("definitions", "UITemplate").stale(ViewQuery.Update.NONE);
	var results=await cbDefinitionBucket.viewQuery("definitions", "UITemplate").catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInDefinitionBucket(query, function(results) {
		callback(results);
	//});
}
async function getSchemaRelatedUITemplates(data,callback){
	//var query = ViewQuery.from("definitions", "SchemaRelatedUITemplates").key(data.schemaName).stale(ViewQuery.Update.NONE);
	var results=await cbDefinitionBucket.viewQuery("definitions", "SchemaRelatedUITemplates",{key:data.schemaName}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInDefinitionBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		 callback(results);
	//});
}
function saveAllImages(images,callback){
	var imgLen = Object.keys(images).length;
	Object.keys(images).map(function(img){
		Object.keys(images[img]).map(function(uniqueImg){
			if(!images[img][uniqueImg].hasOwnProperty("fromWeb")){
				if(uniqueImg != "type"){
					 if(!images[img][uniqueImg].hasOwnProperty("cloudinaryId")){
						 cloudinary.uploader.upload(images[img][uniqueImg].src, function(result) {
							 if(result.hasOwnProperty("error")){
								 callback(result);
								 return;
							 }						
						 },{public_id: images[img][uniqueImg].imageId});
					 }
				 }
			}else{
				console.log(images[img][uniqueImg].url);
				cloudinary.uploader.upload(images[img][uniqueImg].url,function(result) { 
					
					 if(result.hasOwnProperty("error")){
						 callback(result);
						 return;
					 }	
				},{public_id: images[img][uniqueImg].imageId});
			}
			 
		})
	})
	callback({"status":"ok"});
	}
exports.saveAllImages = saveAllImages;

function saveImages(image,callback){
	 cloudinary.uploader.upload(image, function(result) {
		 if(result.hasOwnProperty("error")){
			 callback(result);
			 return;
		 }else{
			 callback(result);
		 }						
	 });
}

function saveAllVideos(video,callback){
	cloudinary.uploader.upload(video.videoSrc, function(result) {
		 if(result.hasOwnProperty("error")){
			 callback(result);
			 return;
		 }else{
			 callback({"status":"ok"});
		 }	
	},{resource_type: "video", public_id: video.videoId});	
}
exports.saveAllVideos = saveAllVideos;
function deleteCloudinaryVideos(videosArray,callback){
	cloudinary.api.delete_resources(videosArray.videos, function(result) {  
	    if(result.hasOwnProperty("error")){
			 callback(result);
			 return;
		 }else{
			 callback({"status":"ok"});
		 }	
    }, { resource_type: "video" });	
}
function getCloudinaryData(publicId,callback){
	var cloudData={};
	cloudData.api_key=config.clAPI_key;
	cloudData.public_id=publicId.public_id;
	cloudData.timestamp=cloudinary.utils.timestamp();
	cloudData.signature=cloudinary.utils.api_sign_request({"public_id":publicId.public_id,"timestamp":cloudinary.utils.timestamp()},config.clAPI_secret);
	callback(cloudData);
}

/*function getStructNames(callback){
	var query = ViewQuery.from("schema", "getStructNames").stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(i in results){
			rowData.push(results[i].value);	
		}
		callback(rowData);
	});
}*/

async function getUserSchemas(request,data,callback){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	//var query = ViewQuery.from("schema", "getUserSchemas").key([cloudPointHostId,data.name]).stale(ViewQuery.Update.NONE);
	var results=await cbMasterBucket.viewQuery("schema", "getUserSchemas",{key:[cloudPointHostId,data.name]}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(i in results){
			rowData.push(results[i].value);	
		}
		callback(rowData);
	//});
}

/*function getUserStructs(request,callback){
	var query = ViewQuery.from("schema", "getUserStructs").stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(i in results){
			rowData.push(results[i].value);	
		}
		callback(rowData);
	});
}*/

/**
 * dynamicViewCreation("test2","test4","function(doc,meta){emit(meta.id,doc);}");
 * 
 * @param data
 * data object should contain ddKey,viewName and view
 * @param callback
 *	test2	--- DDname
 *	test4		--- Viewname
 *	function(doc,meta){emit(meta.id,doc);} 			-- map function
 */

/*function dynamicViewCreation(data,callback) {
	var myBucket = cluster.openBucket(config.cbContentBucket);
	var ddKey=data.ddname;
	var viewName=data.viewName;
	var view="function(doc,meta){" +
				"if(doc.docType == '"+ddKey+"'){"+
					"emit(doc."+data.viewInput+",{"+data.viewOutput+":doc."+data.viewOutput+"});" +
				"}"+
			"}"
	var bm=myBucket.manager();
	bm.getDesignDocument(ddKey,function(err,res){
		if(err){
			console.log("Design Document doesn't exists creating new ");
			var views={};
			views[viewName]={
					map: view
				}
			bm.insertDesignDocument(ddKey, {views: views}, function(err, res) {
				if(err){
					console.log("failed to create "+ddKey);
					  callback({"error":"internalerror"});
				}else{
					console.log(ddKey +" created successfully. view name = "+viewName);
					getDependentRecords(data,function(records){
						if(records){
							callback(records);
						}else{
							callback(null);
						}
					})
				}
			  });
			
		}else{
			console.log("Design Document exists updating it ");
			var views=res.views;
			views[viewName]={
					map: view
				}
			bm.upsertDesignDocument(ddKey, {views: views}, function(err, res) {
				if(err){
					console.log(ddKey +" updation failed");
					  callback({"error":"internalerror"});
				}else{
					console.log(ddKey +" updation success. view name = "+viewName);
					getDependentRecords(data,function(records){
						if(records){
							callback(records);
						}else{
							callback(null);
						}
						
					})
					
					  
				}
			  });
			}
		});
	};*/

/**
 * 
 * @param data
 * @param callback
 */
async function getDependentRecords(data,callback){

	//var query = ViewQuery.from(data.ddname, data.viewName).key(data.recordInput).stale(ViewQuery.Update.NONE);
	var results=await cbContentBucket.viewQuery(data.ddname, data.viewName,{key:data.recordInput}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		/*var rowData=new Array();
		for(i in results){
			rowData.push(results[i].value);	
		}*/
		callback(results);
	//});
}

/**
 * 
 * @param data
 * @param callback
 */
var lettes=["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
function getLoop(i,cond){
	return "for(var "+lettes[i]+"=0;"+lettes[i]+" < doc."+cond+".length;"+lettes[i]+"++){\n"
}
function schemaViewCreation(data,callback){
	temp(0,data,callback)
	
	function temp(i,data,callback){
		if(i <data["@views"].length){
			var myBucket = cluster.bucket(config.cbContentBucket);
			var ddKey=data["@id"];
			var viewName=data["@views"][i].viewName;
			var multiPick = (data["@views"][i].hasOwnProperty("multipick")) ? JSON.parse(JSON.stringify(data["@views"][i].multipick)) : "";
			var inputArray = [];
			var outputArray = [];
			var publicInputArray = [];
			
			
			if(data["@security"]){
				if(Object.keys(data["@security"]).length == 0){
					//inputArray.push("doc.org");
					publicInputArray.push("'public'");
				}else{
					if(data["@security"].recordLevel.view == "all" &&  data["@security"].recordLevel.update != "all"){
						//inputArray.push("doc."+data["@security"].recordLevel.update);
						publicInputArray.push("'public'");
					}else if(data["@security"].recordLevel.view != "all"){
						//inputArray.push("doc."+data["@security"].recordLevel.view);
						publicInputArray.push("'public'");
					}
				}
			}else{
				publicInputArray.push("'public'");
			}
			for(var j=0;j<data["@views"][i].key.length;j++){
				inputArray.push("doc."+data["@views"][i].key[j]);
				publicInputArray.push("doc."+data["@views"][i].key[j]);
			}
			for(var k=0;k<data["@views"][i].value.length;k++){
				outputArray.push(data["@views"][i].value[k]+":doc."+data["@views"][i].value[k]);
			}
			//console.log(inputArray);
			var view;
			if(multiPick.length >0){
				var inputArray2 = [],inputArray3 = [],publicInputArray2 = [],checkFlag=false;//for multipicklist
				var str = "",str2= "";
				if(Object.keys(data["@security"]).length == 0){
					inputArray2.push("doc.org");
					inputArray3.push("doc.org");
					publicInputArray2.push("'public'");
				}else{
					if(data["@security"].recordLevel.view == "all" &&  data["@security"].recordLevel.update != "all"){
						inputArray2.push("doc."+data["@security"].recordLevel.update);
						inputArray3.push("doc."+data["@security"].recordLevel.update);
						publicInputArray2.push("'public'");
					}else if(data["@security"].recordLevel.view != "all"){
						inputArray2.push("doc."+data["@security"].recordLevel.view);
						inputArray3.push("doc."+data["@security"].recordLevel.view);
						publicInputArray2.push("'public'");
					}
				}
				for(var q=0;q<data["@views"][i].key.length;q++){
					checkFlag = false;
					
					for(var r=0; r<multiPick.length;r++){
						if(data["@views"][i].key[q] == multiPick[r]){
							inputArray2.push("doc."+ multiPick[r]+"["+lettes[q]+"]");
							inputArray3.push("'NA'");
							publicInputArray2.push("doc."+ multiPick[r]+"["+lettes[q]+"]");
							
							checkFlag = true;
							str = str + getLoop(q,multiPick[r]);
							str2 = str2 + getLoop(q,multiPick[r]);
							multiPick.splice(r,1);
							break;
						}
					}
					//console.log(multiPick);
					//console.log(checkFlag);
					if(!checkFlag){
						checkFlag = false;
						inputArray2.push("doc."+data["@views"][i].key[q]);
						inputArray3.push("doc."+data["@views"][i].key[q]);
						publicInputArray2.push("doc."+data["@views"][i].key[q]);
					}
					if(q == data["@views"][i].key.length-1){
						str =str + "emit(["+inputArray2+"],{"+outputArray.join()+"});\n"; 
						str2 =str2 + "emit(["+publicInputArray2+"],{"+outputArray.join()+"});\n"; 
					
						for(var s=0; s<data["@views"][i].multipick.length;s++){
							str = str + "}\n ";
							str2 = str2 + "}\n ";
						}
					}
					//console.log("******************");
					//console.log(str);
				}
				if(data["@security"].recordLevel){
					if(data["@security"].recordLevel.view == "all"){
						view="function(doc,meta){\n" +
						"if(doc.docType == '"+ddKey+"'){\n"+str+
							"emit(["+inputArray3+"],{"+outputArray.join()+"});\n" +
						"}\n"+
						"if(doc['$status'] && doc['$status']=='published' && doc['org'] && doc['org'] != 'public'){\n"+str2+
							//"emit(["+publicInputArray2+"],{"+outputArray.join()+"});\n" +
						"}"+
						 "}"
					}else{
						view="function(doc,meta){\n" +
							"if(doc.docType == '"+ddKey+"'){\n"+str+
								"emit(["+inputArray3+"],{"+outputArray.join()+"});\n" +
							"}"+
								
						 "}"
					}
				}else{
					//if(data["@security"].recordLevel.view != "all"){
						view="function(doc,meta){\n" +
						"if(doc.docType == '"+ddKey+"'){\n"+str+
							"emit(["+inputArray3+"],{"+outputArray.join()+"});\n" +
						"}"+
							
						 "}"
					//}
				}
				
			}else{
				if(data["@security"] && data["@security"].recordLevel){
					if(data["@security"].recordLevel.view == "all"){
						view="function(doc,meta){" +
							"if(doc.docType == '"+ddKey+"'){"+
								"emit(["+inputArray+"],{"+outputArray.join()+"});\n" +
							"}\n"+
							"if(doc['$status'] && doc['$status']=='published' && doc['org'] && doc['org'] != 'public'){"+
								"emit(["+publicInputArray+"],{"+outputArray.join()+"});\n" +
							"}"+
						"}"
					}else{
						view="function(doc,meta){" +
							"if(doc.docType == '"+ddKey+"'){"+
								"emit(["+inputArray+"],{"+outputArray.join()+"});\n" +
							"}"+
						"}"
					}
				}else{
					//if(data["@security"].recordLevel.view != "all"){
						view="function(doc,meta){" +
							"if(doc.docType == '"+ddKey+"'){"+
								"emit(["+inputArray+"],{"+outputArray.join()+"});\n" +
							"}"+
						"}"
					//}
				}
			}
				
			console.log(view);
			var bm=myBucket.manager();
			bm.getDesignDocument(ddKey,function(err,res){
				if(err){
					console.log("Design Document doesn't exists creating new ");
					var views={};
					views[viewName]={
							map: view
						}
				
					bm.insertDesignDocument(ddKey, {views: views}, function(err, res) {
						if(err){
							console.log("failed to create "+ddKey);
							  callback({"error":"internalerror"});
						}else{
							console.log(ddKey +" created successfully. view name = "+viewName);
							temp(i+1,data,callback)
						}
					  });
					
				}else{
					console.log("Design Document exists updating it ");
					var views=res.views;
					views[viewName]={
							map: view
						}
					bm.upsertDesignDocument(ddKey, {views: views}, function(err, res) {
						if(err){
							console.log(ddKey +" updation failed");
							  callback({"error":"internalerror"});
						}else{
							console.log(ddKey +" updation success. view name = "+viewName);
							temp(i+1,data,callback)				  
						}
					  });
				}
				});
		}else{
			callback("ok");
		}
	}
	
}

/**
 * 
 * @param data		---	object having super type name
 * @param callback	--- callback function that returns list of super types
 */
async function getSuperTypeSchemas(request,data,callback){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	//var query = ViewQuery.from("schema", "getSuperTypeSchemas").key([cloudPointHostId,data.superType]).stale(ViewQuery.Update.NONE);
	var results=await cbMasterBucket.viewQuery("schema", "getSuperTypeSchemas",{key:[cloudPointHostId,data.superType]}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length == 0 ){
			callback(null);
			return;
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			callback(rowData);
		}
	//});
}

async function getDerivedObjects(data,callback){
	//var query = ViewQuery.from("schema", "getDerivedObjects").key(data.name).stale(ViewQuery.Update.NONE);
	var results=await cbMasterBucket.viewQuery("schema", "getDerivedObjects",{key:data.name}).catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback(null);
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			callback(rowData);
		}
	//});
}
async function getAllSchemas(callback){
	//testVideoUpload1();
	//var query = ViewQuery.from("schema", "getAllSchemas").stale(ViewQuery.Update.NONE);
	var results=await cbMasterBucket.viewQuery("schema", "getAllSchemas").catch(e=>{console.log(e);});
	//CouchBaseUtil.executeViewInMasterBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback(null);
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			callback(rowData);
		}
	//});
}
exports.getAllSchemas = getAllSchemas;


/*function checkUniqueIdentifier(data,callback){
	var query = ViewQuery.from("getDoc", "getDocsList").key(data.schema).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		if(results.length <= 0 ){
			callback(null);
		}else{
			var rowData=new Array();
			for(i in results){
				rowData.push(results[i].value);	
			}
			var status = false;
			if(rowData.length > 0){
				for(var i=0;i<rowData.length;i++){
					if(data.recordId != rowData[i].recordId){
						if(rowData[i][data.key] == data.value){
							status = true;
							break;
						}
					}
				}
			}
			callback(status);
		}
	});
}*/

/*function testVideoUpload(){
	var Vimeo = require('vimeo').Vimeo;
	try {
		var vimeoDetails = reactConfig.vimeoDetails;
	} catch (error) {
	console.error('ERROR: For this example to run properly you must create an api app at developer.vimeo.com/apps/new and set your callback url to http://localhost:8080/oauth_callback');
	console.error('ERROR: Once you have your app, make a copy of config.json.example named "config.json" and add your client id, client secret and access token');
	return;
	}
	var lib = new Vimeo(vimeoDetails.clientId, vimeoDetails.clientSecret, vimeoDetails.clientAccessToken);
	if (!vimeoDetails.clientAccessToken) {
		throw new Error('You can not upload a video without configuring an access token');
	}
	console.log("ok");
	
	 lib.request({path: "/me/videos", method: "GET"}, function (error, body, status_code, headers) {
		 console.log(body);
		 console.log(2222222);
		 console.log(status_code);
	 })
	// The file to upload should be passed in as the first argument to this script
	lib.access_token = vimeoDetails.clientAccessToken;
	lib.streamingUpload("../Wildlife.wmv", function (err, body, status, headers) {
	if (err) {
	return console.log("eror = "+err);
	}
	console.log("status = "+status);
	console.log("location = "+headers.location);
	});
	
}*/



/*function testVideoUpload1(callback){
	console.log(process.argv);
	//var Vimeo = require('vimeo').Vimeo;
	//CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN
	var vimeoDetails = reactConfig.vimeoDetails;
	var lib = new Vimeo(vimeoDetails.clientId, vimeoDetails.clientSecret, vimeoDetails.clientAccessToken);
	
	console.log("upload block entered");
	lib.streamingUpload('/AppGenFlux/testvideo2.mp4', function (err, body, status, headers) {//based on https://github.com/vimeo/vimeo.js  ///AppGenFlux/Wildlife.wmv      ///AppGenFlux/testvideo.mp4
		if (err) {
			return console.log("eror = "+err);
		}
		console.log("status = "+status);
		console.log("location = "+headers.location);
		console.log("headers = "+headers);
		console.log("file upload completed");
		// callback(body);
		 lib.request(headers.location, function (error, body, status_code, headers) {
	         console.log(body);
	         console.log("final o/p");
	         callback(body);
	     });
	});
}*/






/*     ******************vimeo*******************************        */
//vimeo tolen	----	716c44e679d403b7d48fa2152fc4ab2d      ------> token(upload)
//vimeo token 	----	7413fc4ed60e776d66b82202071e5fe8   ----->token(for all)\


/*   ************************google**************************************    */
//gapi key 				-------->     "AIzaSyBqh7WCYk3UWlABz5o5-ChYDf8Zzc9VNRk" 
//	gapi clientId		-------->	  "135522408615-4e6s9gf695nu7pdhgbbb870vmtmfv5oj.apps.googleusercontent.com"
//client secret 		-------->	  "XGnRekus2nm15R-eZF5C9IME"







/*function test(callback){
	cloudinary.uploader.upload("/AppGenFlux/testvideo2.mp4", 
	        function(result) {console.log(result);callback(result); }, 
	        { resource_type: "video" });
}*/




function deleteImage(publicId,resourceType,callback){ 
	console.log(resourceType);
	var nextResourceType;
	if(resourceType == "image"){
		nextResourceType = "video";
	}else if(resourceType == "video"){
		nextResourceType = "raw";
	}
	cloudinary.api.delete_resources(publicId, function(result) {
		console.log(result);
		 if(result.hasOwnProperty("error")){
			 callback(result);
			 return;
		 }else{
			 var temp =[];
			 var status = false;
			Object.keys(result.deleted).map(function(id,i){
				if(result.deleted[id] == "not_found"){
					status = true;
					temp.push(id);
				}
			})
			if(resourceType == "raw"){
				callback(result);
			}else{
				if(status){
					deleteImage(temp,nextResourceType,callback);
				}else{


					callback(result);
				}
			}
		 }	
	},{all:true,resource_type:resourceType});	
}

function checkIdentifier(request,data,callback){

	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;

	/*var query = ViewQuery.from("Identifier", "getUnique").key([cloudPointHostId,data.org,data.schemaName,data.identifier]).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		if(results.error){
			callback(results);
			return;
		}
		callback(results);
	});
	*/
	var identifier="name";
	
	CouchBaseUtil.getDocumentByIdFromMasterBucket(data.schemaName, function(result) {
		if(result.error){
			callback([]);
			return;
		}
		identifier=result.value["@identifier"];
		var query = 'SELECT recordId FROM records WHERE cloudPointHostId = $1 AND org = $2 AND docType =  $3 AND lower(`'+identifier+'`)= $4';
		query.adhoc = false;
		CouchBaseUtil.executeN1QLInContentBucket(query,[cloudPointHostId,data.org,data.schemaName,data.identifier.toLowerCase()],function(results){
			callback(results);
		});
	});
}


function removeDuplicatesIn1DArray(someArray){
	someArray = someArray.reduce(function(a,b){
	    if (a.indexOf(b) < 0 ) a.push(b);
	    return a;
	  },[]);
	return someArray;
}
