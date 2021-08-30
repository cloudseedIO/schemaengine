/*
 * @author saikiran.vadlakonda
 * Date created: 05-07-2016
 * 
 */

var CouchBaseUtil=require('./CouchBaseUtil');
var couchbase = require('couchbase');
var GenericServer=require('./GenericServer.js');
var GenericSummeryServer=require('./GenericSummeryServer.js');
var GenericRecordServer=require('./GenericRecordServer.js');
var GenericRelatedRecordsServer=require('./GenericRelatedRecordsServer.js');
var utility=require('./utility.js');
var ContentServer=require('../ContentServer.js');


var global = require("../utils/global.js");
var QuickBooks = require("../services/QuickBooksService");
var ContentServer=require('../ContentServer.js');
var utility=require('./utility.js');
var TriggerController=require("./TriggerController.js");
var RestApiController=require("./RestApiServiceController.js");




exports.beforeSaveTrigger=beforeSaveTrigger;


function beforeSaveTrigger(record, userId, triggerId, callback,request){
	var container = {};
	container['update']={};
	container['create']={};
	container['triggerDoc']={};
	container['errors']=[];
	console.log("record: "+record);
	console.log("userId: "+userId);
	console.log("triggerId: "+triggerId);
	if(record && userId && triggerId && callback){
		CouchBaseUtil.getDocumentByIdFromMasterBucket(triggerId, function(triggerDoc){
			console.log(triggerDoc);
			if(!triggerDoc.error){
				CouchBaseUtil.getDocumentByIdFromContentBucket(userId, function(userDoc){
					triggerDoc=triggerDoc.value;
					container['triggerDoc']=triggerDoc;
					userDoc=userDoc.value;
					container['create']={};
					container['update']={};
					container[triggerDoc.schemas.sourceSchema]=record;
					container[record.recordId]=record;
					if(triggerDoc.orderOfProcessing && triggerDoc.orderOfProcessing.length>0){
						var actions = triggerDoc.actions;console.log(actions);
						var processes = triggerDoc.orderOfProcessing;
						var processesLen = triggerDoc.orderOfProcessing.length;
						var shouldAssign = true;
						processActions(0);
						
						function processActions(procInd){
							if(procInd>=processesLen){
								console.log(container[triggerDoc.return]);
								try {
									onTriggerFinish(function(res){
										if(res.error){
											callback({error:res.error});
											return;
										}
										callback({recordId:record.recordId, schema: record.docType, response: triggerDoc.response, record: container[triggerDoc.schemas.sourceSchema]});
									});
								} catch (e) {
									console.log("Something went wrong...");
									console.log(e.stack);
									callback({error:"Contact developers"});
								}
								
							}else{
								var actions = triggerDoc.actions[triggerDoc.orderOfProcessing[procInd]];
								if(actions.conditions && actions.conditions.all && actions.conditions.all.length>0){
									var conditions = actions.conditions.all;
									var conLen = conditions.length;
									beforeSaveCondition(0);
									
									
									function beforeSaveCondition(condNum){
										console.log("processCondition"+condNum);
										if(condNum >= conLen){
											console.log("err1");
											if(shouldAssign){
												console.log("Conditions evaluated to true, so invoking actions,processAction");
												processAction();
											}else{
												console.log("invoking for next actions by condition failure, processActions");
												processActions(procInd+1);
											}
										}else if(shouldAssign){
											console.log("err2"+shouldAssign);
											var condition = conditions[condNum];
											
											if(condition.indexOf("->")!=-1){
												var srcSchm = condition.split("->")[0];
												var relation = condition.split("->")[1];
												if(relation.indexOf(".")!=-1){
													relation = relation.split(".")[0];
												}
												console.log(srcSchm+" : "+relation);
												if(srcSchm && relation){
													CouchBaseUtil.getDocumentByIdFromMasterBucket(srcSchm, function(schmaRes){
														var schema=schmaRes.value;
														if(schema["@relations"]){
															var rels = Object.keys(schema["@relations"]);
															var relRefSchma='';
															for(var rI=0; rI<rels.length; rI++){
																for(var key in schema["@relations"][rels[rI]]){
																	if(schema["@relations"][rels[rI]][key] == relation){
																		relRefSchma=schema["@relations"][rels[rI]]["relationRefSchema"];
																		console.log("got relation ref schema: "+relRefSchma);
																	}
																}
															}
															if(relRefSchma!=''){
																console.log({recordId:container[srcSchm].recordId,relation:relation, relationRefSchema:relRefSchma, org:container[srcSchm].org?container[srcSchm].org:record.org});
																GenericRelatedRecordsServer.getRelated({data:{rootSchema:schema["@id"],recordId:container[srcSchm].recordId,relationName:relation, skip:0,relationRefSchema:relRefSchma,fromTrigger:true}}, function(relRecs){
																	console.log("relRecs: "+relRecs.constructor);
																	if(relRecs.length>0){
																		shouldAssign = true;
																		console.log("Index of ->");
																		var actualRelRecs=[];
																		relRecs.forEach(function(relRecId){
																			console.log("relRecId: "+relRecId);
																			actualRelRecs.push(relRecId.value);
																		});
																		console.log("get docs by ids: "+actualRelRecs);
																		CouchBaseUtil.getDocumentsByIdsFromContentBucket(actualRelRecs, function(relRecDocs){
																			actualRelRecs=[];
																			console.log("relRecDocs: ");
																			Object.keys(relRecDocs).forEach(function(docId){
																				actualRelRecs.push(relRecDocs[docId].value);
																			});
																			container[srcSchm+"->"+relation]=actualRelRecs;
																			console.log("got related records: "+actualRelRecs.length);
																			if(eval(condition.replace(srcSchm+"->"+relation, "container['"+srcSchm+"->"+relation+"']"))){
																				shouldAssign = true;
																				beforeSaveCondition(condNum+1);
																			}else{
																				shouldAssign = false;
																				if(actions.errorMessage){
																					console.log("condition evaluated to false and error message is configured, returning error message.")
																					callback({error:actions.errorMessage});
																				}else{
																					console.log("condition evaluated to false, proceeding for next action.")
																					processActions(procInd+1);
																				}
																			}
																		});
																		
																	}else{
																		console.log("error: records not found in schema "+srcSchm+" with relation "+relation);
																		callback({"error":"records not found in schema "+srcSchm+" with relation "+relation});
																	}
																	
																});
															}else{
																callback({"error":"relation RefSchema is not found in schema "+srcSchm});
																console.log("error: relation RefSchema is not found in schema "+srcSchm);
															}
														}else{
															callback({"error":"relations are not found in schema "+srcSchm});
															console.log("error: relations are not found in schema "+srcSchm);
														}
														
													});
													
												}else{
													console.log("Illegal expression, relation or schema not found");
													callback({"error":"illegal expression, relation or schema not found"});
												}
												
											}
											
											
											if(condition.indexOf(".")!=-1 && condition.indexOf("->")==-1 ){
												if(condition.indexOf(triggerDoc.schemas.sourceSchema)!=-1){
													console.log("Index of sourceschema");
													condition= condition.replace(triggerDoc.schemas.sourceSchema, "container."+triggerDoc.schemas.sourceSchema);
												}
												//Checking for replacing recordId or not
												if(condition.indexOf('record')!=-1){
													console.log("Index of sourceschema");
												}
												if(condition.indexOf("userId")!=-1){
													console.log("Index of sourceschema");
													condition= condition.replace(/userId/g, "userDoc");
												}
												console.log("condition: "+condition);
												console.log(eval(condition));
												if(eval(condition)){
													shouldAssign=true;
													beforeSaveCondition(condNum+1);
												}else{
													shouldAssign = false;
													if(actions.errorMessage){
														console.log("condition evaluated to false and error message is configured, returning error message.");
														callback({error:actions.errorMessage});
													}else{
														console.log("condition evaluated to false, proceeding for next action.");
														processActions(procInd+1);
														//beforeSaveCondition(condNum+1);
													}
													
												}
												
											}
										}else{
											//previous condition evaluated to false, decide whether to invoke next or what
											if(actions.errorMessage){
												console.log("condition evaluated to false and error message is configured, returning error message.");
												callback({error:actions.errorMessage});
											}else{
												console.log("condition evaluated to false, proceeding for next action.");
												beforeSaveCondition(condNum+1);
											}
											
										}
									}
								}else if(actions.for && actions.for.Each) {
									//This will be executed if there are no conditions
									console.log("actions.for.Each");
									var eachStr = actions.for.Each;
									if(container[eachStr]){//Means we've data, no need to retrieve again
										processForEach(0);
									}else{
										//need to retrieve 
									}
									
									
									function processForEach(forEIndx){
										console.log("processForEach: "+forEIndx);
										if(forEIndx>=container[eachStr].length){
											console.log("All actions completed.....");
											processActions(procInd+1);
										}else{
											var currRecord = container[eachStr][forEIndx];
											console.log(currRecord);
											if(currRecord){
												var conditions = actions.for.conditions;
												if(conditions.all){//This is to condition all
													var condCount = conditions.all.length;
													var pFECStatus = true;
													if(condCount>0){
														processForEachCondition(0);
													}else{
														console.log("There no conditions for this trigger action")
														processForEachConditionAction();
													}
													
													
													function processForEachCondition(condInd){//For processing conditions
														if(condInd >= condCount){
															if(pFECStatus){
																console.log("if all conditions are success: "+pFECStatus);
																processForEachConditionAction();
															}else{
																//If don't want to process next record, then return error from here
																console.log("Condition evaluated to false.");
																processForEach(forEIndx+1);
															}
														}else if(pFECStatus){
															var condition = conditions.all[condInd];
															console.log("condition: "+condition);
															while(condition && condition.indexOf(eachStr) !=-1){
																condition=condition.replace(eachStr, "currRecord");
															}
															console.log("condition after replace: "+condition);
															var exprsn = condition.split(/\s>=|\s<=|\s==|\s<|\s>|\s!=/g);
															
															if(exprsn.length==2){
																if(exprsn[0].indexOf(".")!=-1){
																	
																	TriggerController.expEvaluator(currRecord, exprsn[0], function(result){
																		while(result.indexOf("\"")!=-1){
																			result = result.replace("\"","");
																		}
																		console.log("before: "+result);
																		console.log("evaluated One: "+exprsn[0]+", result: "+result);
																		result = !isNaN(Number(result))?Number(result):JSON.stringify(result);
																		console.log("after: "+result);
																		condition = condition.replace(exprsn[0], result);
																		console.log("con 1: "+condition);
																		if(exprsn[1].indexOf(".")!=-1){
																			TriggerController.expEvaluator(currRecord, exprsn[1], function(resul){
																				console.log("resul");console.log(resul.constructor);
																				console.log(Number(resul));
																				while(resul.indexOf("\"")!=-1){
																					resul = resul.replace("\"","");
																				}
																				console.log("before: "+resul);
																				resul = !isNaN(Number(resul))?Number(resul):JSON.stringify(resul);
																				console.log("after: "+resul);
																				condition = condition.replace(exprsn[1], resul);
																				console.log("final: "+condition+", eval: "+eval(condition));
																				if(eval(condition)){
																					pFECStatus=true;
																					processForEachCondition(condInd+1);
																				}else{
																					pFECStatus=false;//invoking next condition, if don't want then return error message from here
																					processForEachCondition(condInd+1);//This will invoke next condition, if we want to return error message to user then check for error message and return
																				}
																			});
																		}else{
																			console.log("else final: "+condition+", eval: "+eval(condition));
																			if(eval(condition)){
																				pFECStatus=true;
																				processForEachCondition(condInd+1);
																			}else{
																				pFECStatus=false;
																				console.log("condition evaluated to false...");
																				if(actions.for.errorMessage){
																					console.log("error message is configured, so sending error message to user.");
																					callback({error:actions.for.errorMessage});
																				}else{
																					console.log("error message is not configured, so processing next for each condition");
																					processForEachCondition(condInd+1);
																				}
																				
																			}
																		}
																	});
																}
																
															}else{
																//Need to handle when expression has more operators
																console.log("Else");
															}
															
														}else{
															console.log("skipping: "+forEIndx);
															processForEach(forEIndx+1);
														}
													}//processForEachCondition(condInd)
													
												}else if(conditions.any){//This is to condition any
													
												}
											}
											
											
											function processForEachConditionAction(){
												console.log("Entered into processing for each condition action");
												if(actions.for.actions && actions.for.actions.assign && !actions.for.actions.assign.remoteRecord ){
													
													if(actions.for.actions && actions.for.actions.assign && actions.for.actions.assign.length>0){
														console.log("Assigning started");
														var assigns = actions.for.actions.assign;
														var assignsLen = assigns.length;
														processAssigns(0);
														
														
														function processAssigns(assignInd){
															if(assignInd>=assignsLen){
																console.log("Assigning operations are done.");
																processForEach(forEIndx+1);
															}else{
																var assignProp = assigns[assignInd]['property'];//visibility
																var assignVal = assigns[assignInd]['value'];//author
																console.log("Getting expEval");
																if(assignVal.indexOf("+")==-1){
																	TriggerController.expEvaluator(record, assignVal, function(val){
																		console.log("assigned: "+val);
																		while(val.constructor==String && val.indexOf("\"")!=-1){
																			val = val.replace("\"","");
																		}
																		console.log("assigned revised: "+val);
																		//Patch Added on D: 4th Feb, 2016
																		if(record[assignProp].constructor==Array){
																			if(val.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																				console.log("Value array and property array");
																				
																				val.forEach(function(v){
																					console.log(v);
																					
																					console.log(record[assignProp].indexOf(v));
																					record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																				});
																				
																			}else{
																				console.log("Value string and property array");
																				if(record[assignProp].indexOf(val)==-1){
																					console.log("Not found, so pushing");
																					record[assignProp].push(val);
																				}else{
																					console.log("user exists...");
																				}
																				
																			}
																			
																		}else{
																			record[assignProp]=val;
																		}
																		processAssigns(assignInd+1);
																	});
																}else{
																	TriggerController.processComboProp(record, assignVal, function(finalVal){
																		console.log("final value: "+finalVal);
																		if(record[assignProp].constructor==Array){
																			if(finalVal.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																				console.log("Value array and property array");
																				
																				finalVal.forEach(function(v){
																					console.log(record[assignProp].indexOf(v));
																					record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																				});
																				
																			}else{
																				console.log("Value string and property array");
																				if(record[assignProp].indexOf(finalVal)==-1){
																					console.log("Not found, so pushing");
																					record[assignProp].push(finalVal);
																				}else{
																					console.log("val exists...");
																				}
																				
																			}
																			
																		}else{
																			record[assignProp]=finalVal;
																		}
																		processAssigns(assignInd+1);
																	});
																	
																}
															}
														}
													}else{
														var prop = actions.for.actions.assign.property+"";
														console.log("Got prop: "+prop);
														console.log(prop.indexOf("->"));
														if(prop.indexOf("->") == -1){
															console.log("eval: "+eval("container."+prop));
															if(eval("container."+prop)){
																if(prop.indexOf(".")!=-1){
																	var props = prop.split(".");
																	var operatingRec = container[props[0]][props[1]];
																	console.log("operating rec: "+operatingRec);
																	var assigningVal = actions.for.actions.assign.value;
																	
																	if(eachStr == assigningVal){
																		if(operatingRec.constructor == Array){
																			operatingRec.push(container[eachStr][forEIndx]);
																		}else{
																			operatingRec = container[eachStr][forEIndx];
																		}
																		processForEach(forEIndx+1);
																	}else if(conainer[assigningVal]){
																		if(operatingRec.constructor == Array){
																			operatingRec.push(container[assigningVal][forEIndx]);
																		}else{
																			operatingRec = container[assigningVal][forEIndx];
																		}
																		processForEach(forEIndx+1);
																	}
																	
																}
															}else{
																console.log("Need to get eval(container.+prop): "+(eval("container."+prop)));
															}
														}else if(prop.indexOf("->") != -1){
															console.log("Need to get related records.");
															
														}
													}
													
													
												}else if(actions.for.actions && actions.for.actions.assign && actions.for.actions.assign.remoteRecord){
													console.log("Entered into processing for each condition action for remote record ");
													var remoteRecordId=actions.for.actions.assign.remoteRecord;
													remoteRecordId = remoteRecordId.replace(eachStr, "currRecord");
													remoteRecordId = eval(remoteRecordId);
													
													console.log("Remote Record Id: "+remoteRecordId);
													CouchBaseUtil.getDocumentByIdFromContentBucket(remoteRecordId, function(remoteRecord){
														if(remoteRecord.value){
															remoteRecord = remoteRecord.value;
															console.log("Got Remote Record: "+remoteRecord.recordId);
															var prop = actions.for.actions.assign.property;
															//Code added for Some more generic functionality,
															var val=actions.for.actions.assign.value;
															if(val){
																val=actions.for.actions.assign.value;
																if(remoteRecord[prop].constructor==Array){
																	remoteRecord[prop].push(val);
																}else if(remoteRecord[prop]){
																	remoteRecord[prop]=(val);
																}else{
																	remoteRecord[prop]=(val);
																	console.log("Remote record property updated.");
																}
																container['update'][remoteRecord.recordId]=(remoteRecord);
																console.log("Going to process next record: "+(forEIndx+1));
																processForEach(forEIndx+1);
															}
														}else{
															console.log("Record not found");
															console.log("Going to process next record: "+(forEIndx+1));
															processForEach(forEIndx+1);
														}
														
													});
													
												}else if(actions.for.actions && actions.for.actions.create){
													/*
													 * Start from here
													 * */
													var hostname
													if(request && request.headers && request.headers.host && request.headers.host.split(":"))
														hostname=request.headers.host.split(":")[0];
													var cloudPointHostId;
													if(hostname && ContentServer.getConfigDetails(hostname))
														cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
													
													
													utility.getMainSchema({schema:actions.for.actions.create.record,cloudPointHostId:cloudPointHostId},function(response){
														if(response.error){callback({error:data.docType+" not exists"});return;}
														//var schema=response.value;
														var schema=response.schema;
														console.log('schema');
														var newRecord = {};
														if(schema['@properties']){
															var props = Object.keys(schema['@properties']);
															console.log(props);
															//setting system properties
															
															newRecord['docType']=schema['@id'];
															newRecord['cloudPointHostId']=cloudPointHostId;
															
															newRecord['recordId']=schema['@id']+""+global.guid();
															newRecord['author']=userId;
															newRecord['editor']=userId;
															newRecord['revision']=1;
															newRecord['dateCreated']=global.getDate();
															newRecord['dateModified']=global.getDate();
															setProp(0);
															
															function setProp(index){
																if(index>=props.length){
																	console.log(record);
																	//ResultData = record;
																	console.log("next doAction: "+indx);
																	if(actions.for.actions.create.props){
																		var recProps = actions.for.actions.create.props;
																		var recKeys = Object.keys(recProps);
																		for(var rpI=0; rpI<recKeys.length; rpI++){
																			if(recProps[recKeys[rpI]] != "current"){
																				if(recProps[recKeys[rpI]].indexOf("recordId")!=-1){
																					console.log("Prop value assign: "+(recProps[recKeys[rpI]].replace("recordId", "container['"+recordId+"']")));
																					console.log("Prop eval: "+(eval(recProps[recKeys[rpI]].replace("recordId", "container['"+recordId+"']"))));
																					newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("recordId", "container['"+recordId+"']"));
																				}else if(container[recProps[recKeys[rpI]]]){
																					//newRecord[recKeys[rpI]] = recProps[recKeys[rpI]];
																				}else{
																					newRecord[recKeys[rpI]] = recProps[recKeys[rpI]];
																				}
																				
																			}else{
																				console.log("assigning current : "+recKeys[rpI]);
																				newRecord[recKeys[rpI]] = currRecord;
																			}
																		}
																	}
																	container[newRecord['recordId']]=newRecord;
																	newRecord={};
																	container['create'][newRecord.recordId]=(newRecord);
																	console.log("processForEach: "+forEIndx);
																	processForEach(forEIndx+1);
																}else{
																	if(props[index]!= "requiredKeys"){
																		
																		var PropdataType="";
																		if(schema['@properties'][props[index]]){
																			PropdataType=schema['@properties'][props[index]].dataType.type;
																		}else if(schema['@sysProperties'][props[index]]){
																			PropdataType=schema['@sysProperties'][props[index]].dataType.type;
																		}
																		console.log(PropdataType);
																		/**
																		 * assigning respective default values
																		 *  Array= ["multiPickList","array","image","images","attachment","attachments","privateVideo","privateVideos","dndImage","tags"]
																		 *	Objects=["struct","geoLocation","userDefinedFields","richText"]
																		 *	boolean
																		 *	number
																		 */	
																		if(["multiPickList","array","image","images","attachment","attachments","privateVideo","privateVideos","dndImage","tags"].indexOf(PropdataType)!=-1){
																			newRecord[props[index]]=[];
																			setProp(index+1);
																		}else if(["struct","geoLocation","userDefinedFields","richText"].indexOf(PropdataType)!=-1){
																			newRecord[props[index]]={};
																			setProp(index+1);
																		}else if (PropdataType=="boolean"){
																			newRecord[props[index]]=false;
																			setProp(index+1);
																		}else if (PropdataType=="number"){
																			newRecord[props[index]]=undefined;
																			setProp(index+1);
																		}else{
																			newRecord[props[index]]="";
																			setProp(index+1);
																		}
																	}else{
																		setProp(index+1);
																	}
																}
																
															}
															
														}
													});
													
													
												}else if(actions.for.actions && actions.for.actions.increment){
													var increment = actions.for.actions.increment;
													if(increment.junctionRecord){
														var data={};
														var source=increment.junctionRecord.source;
														var relation=increment.junctionRecord.relation;
														var target=increment.junctionRecord.target;
														/*Evaluating source*/
														console.log(source);
														if(source.indexOf(eachStr)!=-1){
															source=source.replace(eachStr, "currRecord");
															source=eval(source);
														}else if(source.indexOf(".")!=-1){
															var srcs=source.split(".");
															if(eval("container['"+srcs[0]+"']").constructor!=Array){
																source=eval("container['"+srcs[0]+"']."+srcs[1]);
															}else{
																console.log("Need to retrieve.");
															}
														} 
														
														
														/*Evaluating target*/
														if(target.indexOf(eachStr)!=-1){
															target=target.replace(eachStr, "currRecord");
															target=eval(target);
														}else if(target.indexOf(".")!=-1){
															var srcs=target.split(".");
															if(eval("container['"+srcs[0]+"']")){
																target=eval("container['"+srcs[0]+"']."+srcs[1]);
															}else{
																console.log("Need to retrieve target by ....");
															}
														}
														
														
														data['source']=source;
														data['relationName']=relation;
														data['target']=target;
														data["fromTrigger"]=true;
														
														GenericRelatedRecordsServer.getRelatedRecordId(data, function(res){
															if(res.error){
																callback({error:"No record found for this Organization and Item"});
															}else{
																CouchBaseUtil.getDocumentByIdFromContentBucket(res.id, function(junctionRecord){
																	junctionRecord=junctionRecord.value;
																	var property=increment.property;
																	var value=increment.value;
																	if(value.indexOf(eachStr)!=-1){
																		console.log("value has eachstr: "+value);
																		value=value.replace(eachStr, "currRecord");
																		console.log(value);
																		value=eval(value);
																		console.log(value);
																	}
																	if(value.indexOf(".")!=-1){
																		var srcs=value.split(".");
																		if(eval("container['"+srcs[0]+"']")){
																			value=eval("container['"+srcs[0]+"']."+srcs[1]);
																			
																		}else{
																			console.log("Need to retrieve target by ....");
																		}
																	}
																	
																	junctionRecord[property]=parseFloat(junctionRecord[property])+parseFloat(value);
																	container['update'][junctionRecord.recordId]=(junctionRecord);
																	console.log("junction record value updated, processForEach: "+forEIndx);
																	processForEach(forEIndx+1);
																})
															}
														});
													}else{
														console.log("actions.for.actions.increment ")
													}
													
												}//increment
												else if(actions.for.actions && actions.for.actions.decrement){
													var decrement = actions.for.actions.decrement;
													console.log("decrementing....");
													console.log("Entered into processing for each condition action for remote record ");
													var remoteRecordId=decrement.remoteRecord;
													remoteRecordId = remoteRecordId.replace(eachStr, "currRecord");
													if(eval(remoteRecordId)){
														console.log("remote recordId: "+remoteRecordId);
														remoteRecordId = eval(remoteRecordId);
													}else{
														console.log("Need to write logic to get recordId...");
													}
													
													
													console.log("Remote Record Id: "+remoteRecordId);
													CouchBaseUtil.getDocumentByIdFromContentBucket(remoteRecordId, function(remoteRecord){
														if(remoteRecord.value){
															remoteRecord = remoteRecord.value;
															console.log("Got Remote Record: "+remoteRecord);
															var prop = decrement.property;
															//Code added for Some more generic functionality,
															var val=decrement.value;
															console.log(val);
															if(val.indexOf(eachStr)!=-1){
																val=val.replace(eachStr, "currRecord");
																val=eval(val);
																console.log(val);
															}else{
																console.log("need to evaluate value....");
															}
															if(remoteRecord[prop].constructor==Array){
																remoteRecord[prop].push(val);
															}else if(remoteRecord[prop]){
																remoteRecord[prop]=parseFloat(remoteRecord[prop])-parseFloat(val);
															}else{
																remoteRecord[prop]=parseFloat(remoteRecord[prop])-parseFloat(val);
															}
															console.log("Remote record property updated: "+remoteRecord[prop]);
															container['update'][remoteRecord.recordId]=(remoteRecord);
															console.log("Going to process next record: "+(forEIndx+1));
															processForEach(forEIndx+1);
															
														}else{
															container['errors'].push({error:"Remote record not found for decrementing."});
															console.log("Record not found");
															console.log("Going to process next record: "+(forEIndx+1));
															processForEach(forEIndx+1);
														}
														
													});
													
												}//increment
												else if(actions.for.actions && actions.for.actions.invokeService){
													var serviceName=actions.for.actions.invokeService.serviceName;
													if(serviceName=="RestApiService"){
														var serviceDoc = actions.actions.invokeService.serviceDoc;
														if(serviceDoc.apiEndPointURL){
															var restApiDoc = {};
															restApiDoc['parameters']={};
															restApiDoc['path']={};
															restApiDoc['data']={};
															restApiDoc['options']={};
															restApiDoc['method']="";
															restApiDoc['apiEndPoint']=serviceDoc.apiEndPointURL+
															(actions.actions.invokeService.path=="/" ? "":actions.actions.invokeService.path);
															
															serviceDoc.pathAndParams.forEach(function(pathAndParam){
																if(pathAndParam.path==actions.actions.invokeService.path){
																	restApiDoc['method']=pathAndParam.method;
																	
																	/*Path parameters, if any*/
																	pathAndParam.pathParams.forEach(function(pathParam){
																		if(pathParam.key && pathParam.value){
																			if(pathParam.value.indexOf(record['docType'])!=-1 && pathParam.value.indexOf(".")!=-1){
																				//Fetching value from the record
																				restApiDoc['path'][pathParam.key]=record[pathParam.value.split(".")[1]];
																			}else{
																				restApiDoc['path'][pathParam.key]=pathParam.value;
																			}
																		}
																	});
																	
																	pathAndParam.queryParams.forEach(function(queryParam){
																		if(queryParam.key && queryParam.value){
																			if(queryParam.value.indexOf(record['docType'])!=-1 && queryParam.value.indexOf(".")!=-1){
																				//Fetching value from the record
																				restApiDoc['parameters'][queryParam.key]=record[queryParam.value.split(".")[1]];
																			}else{
																				restApiDoc['parameters'][queryParam.key]=queryParam.value;
																			}
																		}
																	});
																	
																	/*Checking for post data*/
																	pathAndParam.data.forEach(function(data){
																		if(data.key && data.value){
																			if(data.value.indexOf(record['docType'])!=-1 && data.value.indexOf(".")!=-1){
																				//Fetching value from the record
																				restApiDoc['data'][data.key]=record[data.value.split(".")[1]];
																			}else{
																				restApiDoc['data'][data.key]=data.value;
																			}
																		}
																	});
																}
															});
															
															
															serviceDoc.otherConfigs.forEach(function(data){
																if(data.key && data.value){
																	if(data.useAsInParam){
																		//Fetching value from the record
																		restApiDoc['parameters'][data.key]=data.value;
																	}else{
																		if(data.username || data.user){
																			restApiDoc['options']['user']=data.value;
																		}else{
																			restApiDoc['options'][data.key]=data.value;
																		}
																		
																	}
																}
															});
															
															
															RestApiController.invokeRestApiService(restApiDoc, function(res){
																console.log(res);
																if(actions.actions.invokeService.result){
																	record[actions.actions.invokeService.result]=res;
																}
																processForEach(forEIndx+1);
															});
															
															
														}else{
															//Code for error message
														}
														
													}
												}
											}//processForEachConditionAction()
										}
									}//processForEach(forEIndx)
								}else{
									processAction();
								}
								
								function processAction(){
									//This will be executed after condition checking is done and evaluated to true.
									console.log(shouldAssign);
									if(actions.actions && actions.actions.assign && actions.actions.assign.length>0){
										console.log("Assigning started");
										var assigns = actions.actions.assign;
										var assignsLen = assigns.length;
										processAssigns(0);
										
										
										function processAssigns(assignInd){
											console.log("Assigning index: "+assignInd);
											if(assignInd>=assignsLen){
												console.log("Assigning operations are done.");
												processActions(procInd+1);
											}else{
												var assignProp = assigns[assignInd]['property'];//visibility
												var assignVal = assigns[assignInd]['value'];//author
												console.log("Getting expEval");
												if(assignVal.indexOf("+")==-1){
													TriggerController.expEvaluator(record, assignVal, function(val){
														console.log("assigned: "+val);
														while(val.constructor==String && val.indexOf("\"")!=-1){
															val = val.replace("\"","");
														}
														console.log("assigned revised: "+val);
														//Patch Added on D: 4th Feb, 2016
														if(record[assignProp].constructor==Array){
															if(val.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																console.log("Value array and property array");
																
																val.forEach(function(v){
																	console.log(v);
																	
																	console.log(record[assignProp].indexOf(v));
																	record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																});
																
															}else{
																console.log("Value string and property array");
																if(record[assignProp].indexOf(val)==-1){
																	console.log("Not found, so pushing");
																	record[assignProp].push(val);
																}else{
																	console.log("user exists...");
																}
																
															}
															
														}else{
															record[assignProp]=val;
														}
														processAssigns(assignInd+1);
													});
												}else{
													TriggerController.processComboProp(record, assignVal, function(finalVal){
														console.log("final value: "+finalVal);
														console.log("assigned: "+finalVal);
														while(finalVal.constructor==String && finalVal.indexOf("\"")!=-1){
															finalVal = finalVal.replace("\"","");
														}
														console.log("assigned revised: "+finalVal);
														if(record[assignProp].constructor==Array){
															if(finalVal.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																console.log("Value array and property array");
																
																finalVal.forEach(function(v){
																	console.log(record[assignProp].indexOf(v));
																	record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																});
																
															}else{
																console.log("Value string and property array");
																if(record[assignProp].indexOf(finalVal)==-1){
																	console.log("Not found, so pushing");
																	record[assignProp].push(finalVal);
																}else{
																	console.log("val exists...");
																}
																
															}
															
														}else{
															record[assignProp]=finalVal;
														}
														processAssigns(assignInd+1);
													});
													
												}
											}
										}
									}else if(actions.actions && actions.actions.create && actions.actions.create.mappings){
										var tempObj={};
										if(actions.actions.create.mappings){
											var mapObj=actions.actions.create.mappings;
											var jsonKeys=Object.keys(mapObj);
											
											if(jsonKeys.length>0){
												prepareJson(mapObj, tempObj, jsonKeys, jsonKeys[0], function(finalTempJson){
													console.log("FinalTempJson: ")
													console.log(finalTempJson);
													console.log("tempObj: ");
													console.log(tempObj);
													
													var tempKeys=Object.keys(finalTempJson);
													var qbJson={};
													TriggerController.assignRecordValuesToTemp(finalTempJson, record, tempKeys, tempKeys[0], qbJson, function(qbFinalJson){
														var qFKeys=Object.keys(qbFinalJson);
														
														deleteArrayRef(qbFinalJson, qFKeys, qFKeys[0], function(qbFJson){
															container['tempObj']=qbFJson;
															//Need to assign values based on record data. D:11-02-2016
															console.log("Got FinalJson: "+(container['tempObj']));
															processActions(procInd+1);//Invoke next action
														});
													});
												});
											}//Need to write if mappings are not configured
											
										}
									}else if(actions.actions && actions.actions.invokeService){
										var serviceName=actions.actions.invokeService.serviceName;
										if(serviceName=="QuickBooks"){
											var operation=actions.actions.invokeService.operation;
											var schema=actions.actions.invokeService.schema;
											
											TriggerController.invokingQuickBookService(operation, schema, container['tempObj'], function(serviceRes){
												//service invocation is done
												if(serviceRes.success){
													var onSucKeys=Object.keys(actions.actions.invokeService.onSuccess);
													var sucRec=serviceRes.success;
													onSucKeys.forEach(function(suKey){
														record[actions.actions.invokeService.onSuccess[suKey]]=sucRec[suKey];
													});
													
													record.qBId=serviceRes.success.Id;
													record.qBSyncToken=serviceRes.success.SyncToken;
													record.qBMetaData=serviceRes.success.MetaData;
												}else{
													console.log("error occurred while invoking service.");console.log(serviceRes);
												}
												processActions(procInd+1);
											});
											//processActions(procInd+1);
											
										}else if(serviceName=="citrusPayment"){
											var session=request.session;
											
											var paymentData={};
											paymentData['amount']=1;//Need to fetch amount from record
											paymentData['recordId']=record.recordId;
											paymentData['firstName']=session.userData.givenName;
											paymentData['lastName']=session.userData.familyName;
											paymentData['emailId']=session.userData.email;
											paymentData['city']=session.userData.address.addressRegion;
											paymentData['state']=session.userData.address.addressLocality;
											paymentData['country']=session.userData.address.addressCountry;
											paymentData['zipcode']=session.userData.address.postalCode;
											paymentData['phoneNumber']=session.userData.telephone;
											paymentData['isNewTxn']=true;
											paymentData['dateTime']=new Date();
											
											if((paymentData.firstName || paymentData.lastName) &&
													paymentData.emailId /*&& paymentData.phoneNumber*/){
												session['paymentData']=paymentData;
											}
											processActions(procInd+1);
											
										}else if(serviceName=="RestApiService"){
											var serviceDoc = actions.actions.invokeService.serviceDoc;
											if(serviceDoc.apiEndPointURL){
												var restApiDoc = {};
												restApiDoc['parameters']={};
												restApiDoc['path']={};
												restApiDoc['data']={};
												restApiDoc['options']={};
												restApiDoc['method']="";
												restApiDoc['apiEndPoint']=serviceDoc.apiEndPointURL+
												(actions.actions.invokeService.path=="/" ? "":actions.actions.invokeService.path);
												
												serviceDoc.pathAndParams.forEach(function(pathAndParam){
													if(pathAndParam.path==actions.actions.invokeService.path){
														restApiDoc['method']=pathAndParam.method;
														
														/*Path parameters, if any*/
														pathAndParam.pathParams.forEach(function(pathParam){
															if(pathParam.key && pathParam.value){
																if(pathParam.value.indexOf(record['docType'])!=-1 && pathParam.value.indexOf(".")!=-1){
																	//Fetching value from the record
																	restApiDoc['path'][pathParam.key]=record[pathParam.value.split(".")[1]];
																}else{
																	restApiDoc['path'][pathParam.key]=pathParam.value;
																}
															}
														});
														
														pathAndParam.queryParams.forEach(function(queryParam){
															if(queryParam.key && queryParam.value){
																if(queryParam.value.indexOf(record['docType'])!=-1 && queryParam.value.indexOf(".")!=-1){
																	//Fetching value from the record
																	restApiDoc['parameters'][queryParam.key]=record[queryParam.value.split(".")[1]];
																}else{
																	restApiDoc['parameters'][queryParam.key]=queryParam.value;
																}
															}
														});
														
														/*Checking for post data*/
														var postData={};
														pathAndParam.data.forEach(function(data){
															prepareJsonForRestAPI(data, postData, function(finalTempJson){
																console.log("Final Temp Json");
																console.log(finalTempJson);
															});
														});
														
														Object.keys(postData).forEach(function(dataKey){
															replaceWithValue(record, postData[dataKey], function(d){
																postData[dataKey]=d;
																console.log("d");console.log(d);
															 });
														});
														 
														 console.log("PostData: ");
														 console.log(JSON.stringify(postData));
													}
												});
												
												
												serviceDoc.otherConfigs.forEach(function(data){
													if(data.key && data.value){
														if(data.useAsInParam){
															//Fetching value from the record
															restApiDoc['parameters'][data.key]=record[data.value.split(".")[1]];
														}else{
															if(data.username || data.user){
																restApiDoc['options']['user']=data.value;
															}else{
																restApiDoc['options'][data.key]=data.value;
															}
															
														}
													}
												});
												
												
												
												console.log(JSON.stringify(restApiDoc));
												///*
												RestApiController.invokeRestApiService(restApiDoc, function(res){
													console.log(res);
													if(action.actions.invokeService.result.length){
														action.actions.invokeService.result.forEach(function(mapJ){
															if(mapJ.prop && mapJ.parseAs){
																var val=JSON.parse(JSON.stringify(res));
																mapJ.parseAs.split(".").forEach(function(parse){
																	val=val[parse];
																});
																record[mapJ.prop]=val;
															}
														});
													}
													processActions(procInd+1);
												});
												//*/
												processActions(procInd+1);
											}else{
												//Code for error message
											}
											
										}//Need to write for another service
										
									}else if(actions.actions && actions.actions.assign && actions.actions.assign.relatedRecord){
										var relatedRecordStr = actions.actions.assign.relatedRecord;
										var assigns = actions.actions.assign;
										
										if(container[relatedRecordStr]){//Means we've data with same relation, no need to retrieve again
											processAssignsForRelatedRecords(0);
										}else{
											var srcSchm = relatedRecordStr.split("->")[0];
											var relation = relatedRecordStr.split("->")[1];
											if(relation.indexOf(".")!=-1){
												relation = relation.split(".")[0];
											}
											console.log(srcSchm+" : "+relation);
											if(srcSchm && relation){
												//{"recordId":"CartUser2cc75dc3-44b0-45c3-4532-a20724a73dc5","relation":"hasProduct","relationRefSchema":"CartItem","userId":"User2cc75dc3-44b0-45c3-4532-a20724a73dc5","org":"user"}
												CouchBaseUtil.getDocumentByIdFromMasterBucket(srcSchm, function(schmaRes){
													var schema=schmaRes.value;
													if(schema["@relations"]){
														var rels = Object.keys(schema["@relations"]);
														var relRefSchma='';
														for(var rI=0; rI<rels.length; rI++){
															for(var key in schema["@relations"][rels[rI]]){
																if(schema["@relations"][rels[rI]][key] == relation){
																	relRefSchma=schema["@relations"][rels[rI]]["relationRefSchema"];
																	console.log("got relation ref schema: "+relRefSchma);
																}
															}
														}
														if(relRefSchma!=''){
															console.log({recordId:container[srcSchm].recordId,relation:relation, relationRefSchema:relRefSchma, org:container[srcSchm].org?container[srcSchm].org:org});
															GenericRelatedRecordsServer.getRelatedRecords({body:{rootSchema:schema["@id"],recordId:container[srcSchm].recordId,relationName:relation, relationRefSchema:relRefSchma, org:container[srcSchm].org?container[srcSchm].org:org,fromTrigger:true}}, function(recs){
																if(recs && recs.records && recs.records.length>0){
																	
																	console.log("Index of ->");
																	var recArr=[];
																	recs.records.forEach(function(record){
																		recArr.push(record.value);
																	});
																	container[srcSchm+"->"+relation]=recArr;
																	processAssignsForRelatedRecords(0);
																	
																	
																	
																	
																}else{
																	callback({"error":"records not found in schema "+srcSchm+" with relation "+relation});
																	console.log("error: records not found in schema "+srcSchm+" with relation "+relation);
																}
															});
														}else{
															callback({"error":"relation RefSchema is not found in schema "+srcSchm});
															console.log("error: relation RefSchema is not found in schema "+srcSchm);
														}
													}else{
														callback({"error":"relations are not found in schema "+srcSchm});
														console.log("error: relations are not found in schema "+srcSchm);
													}
													
												});
												
											}else{
												console.log("Illegal expression, relation or schema not found");
												callback({"error":"illegal expression, relation or schema not found"});
											}
										
										}
										
										
										
										
										
									function processAssignsForRelatedRecords(prAsFrRelRecsInd){
										var relatedRecord=container[relatedRecordStr][prAsFrRelRecsInd];
										if(container[relatedRecordStr].length>prAsFrRelRecsInd){//process related record operation
											var relatedRecord=container[relatedRecordStr][prAsFrRelRecsInd];
											
											console.log("relatedRecord");
											console.log(relatedRecord);
											
											var assignProp = assigns['property'];//collaborator
											var assignVal = assigns['value'];//recordId.collaborator
											console.log("Getting expEval");
											if(assignVal.indexOf("+")==-1){
												TriggerController.expEvaluator(record, assignVal, function(val){
													console.log("assigned: "+val);
													/*
													while(val.constructor==String && val.indexOf("\"")!=-1){
														val = val.replace("\"","");
													}*/
													try{
														val=JSON.parse(val);
													}catch(err){
														
													}
													console.log("assigned revised: "+val);
													
													//Patch Added on D: 4th Feb, 2016
													if(relatedRecord[assignProp] && relatedRecord[assignProp].constructor==Array && assigns.method!="assign"){
														
														
														if(val.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
															console.log("Value array and property array");
															
															val.forEach(function(v){
																console.log(v);
																
																console.log(relatedRecord[assignProp].indexOf(v));
																relatedRecord[assignProp].indexOf(v)==-1?relatedRecord[assignProp].push(v):'';
															});
															
														}else{
															console.log("Value string and property array");
															if(relatedRecord[assignProp][assignProp].indexOf(val)==-1){
																console.log("Not found, so pushing");
																relatedRecord[assignProp][assignProp].push(val);
															}else{
																console.log("user exists...");
															}
															
														}
														
													}else{
														relatedRecord[assignProp]=val;
													}
													
													container['update'][relatedRecord.recordId]=relatedRecord;
													processAssignsForRelatedRecords(prAsFrRelRecsInd+1);
												});
											}else{
												TriggerController.processComboProp(record, assignVal, function(finalVal){
													console.log("final value: "+finalVal);
													console.log("assigned: "+finalVal);
													while(finalVal.constructor==String && finalVal.indexOf("\"")!=-1){
														finalVal = finalVal.replace("\"","");
													}
													console.log("assigned revised: "+finalVal);
													if(relatedRecord[assignProp] && relatedRecord[assignProp].constructor==Array){
														if(finalVal.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
															console.log("Value array and property array");
															
															finalVal.forEach(function(v){
																console.log(relatedRecord[assignProp].indexOf(v));
																relatedRecord[assignProp].indexOf(v)==-1?relatedRecord[assignProp].push(v):'';
															});
															
														}else{
															console.log("Value string and property array");
															if(relatedRecord[assignProp].indexOf(finalVal)==-1){
																console.log("Not found, so pushing");
																relatedRecord[assignProp].push(finalVal);
															}else{
																console.log("val exists...");
															}
															
														}
														
													}else{
														relatedRecord[assignProp]=finalVal;
													}
													container['update'][relatedRecord.recordId]=relatedRecord;
													processAssignsForRelatedRecords(prAsFrRelRecsInd+1);
												});
												
											}
											
										}else{
											console.log("All assigning operations on all related records is done");
											processActions(procInd+1);//Go to next action
										}
										
										
									}
										
										
										
										
										
										
										
										
										
									}else {//write logic for action invokeService, serviceName, method, Object temp D:10-02-2016
										
										console.log("processAction else");
										console.log(actions.actions);
										processActions(procInd+1);
									}
									
									
								}//processAction
							}
						}
					}else{
						callback({"error":"manual error"});
					}
				});
			}else{
				//This Code will be executed if trigger doc is not found.
				console.log("Trigger Document Not found, Kindly check your configuration");
				callback({error:"Trigger Document not found."})
			}
		});
	}else{
		console.log("Invalid arguments for trigger ");
		console.log(arguments);
		if(callback){
			callback({"error": "Invalid arguments for trigger"});
		}else{
			console.log("Invalid arguments for trigger, callback is not provided");
		}
	}
	
	
	
	
	/*Below code is for updating or saving records */
	function onTriggerFinish(callbk){
		console.log(container['create']);
		var savedDocs=[];
		var createdRecs = Object.keys(container['create']);
		var recsLen;
		
		if(Object.keys(container['create']).length>0 || Object.keys(container['update']).length>0){
			recsLen = createdRecs.length;//Need to save created records
			saveRecord(0);
		}else{
			if(container['triggerDoc'].response){
				callbk(container['triggerDoc'].response);
			}else{
				callbk({success:"trigger execution finished"});
			}
		}
		
		function saveRecord(saveInd){
			if(saveInd>=recsLen){
				console.log("Trigger Execution Finished.....");
				//callbk(savedDocs[0]);
				if(Object.keys(container['update']).length>0){
					createdRecs = Object.keys(container['update']);
					recsLen = createdRecs.length;//Need to save created records
					updateRecords(0);
				}else{
					if(triggerDoc.response){
						callbk(triggerDoc.response);
					}
				}
			}else{
				var saveRec = container['create'][createdRecs[saveInd]];
				saveRec.revision+=1;
				var date=new Date();
				saveRec.dateModified=global.getDate();
				CouchBaseUtil.upsertDocumentInContentBucket(saveRec.recordId, saveRec, function(res){
					if(res){
						savedDocs.push(res);
						saveRecord(saveInd+1);
					}else{
						console.log("error : error while saving created doc, line num 621");console.log(res);
						callbk({"error":"error while saving created doc"});
					}
				},request);
			}
		}
		
		function updateRecords(updateInd){
			if(updateInd>=recsLen){
				console.log("Trigger Execution Finished.....");
				callbk(savedDocs[0]);
			}else{
				try{
					var saveRec = container['update'][createdRecs[updateInd]];
					saveRec.revision+=1;
					var date=new Date();
					saveRec.dateModified=global.getDate();
					CouchBaseUtil.upsertDocumentInContentBucket(saveRec.recordId, saveRec, function(res){
						if(res){
							try{
								require('./socket.io.js').alertRoom(saveRec.recordId,{schema:saveRec.docType});
							}catch(err){}
							savedDocs.push(res);
							updateRecords(updateInd+1);
						}else{
							console.log("error : error while saving created doc, line num 621");console.log(res);
							callbk({"error":"error while saving created doc"});
						}
					});
				}catch(e){
					console.log("Something went wrong");
					console.log(e);
				}
				
			}
		}
		
	}
	
}


function prepareJson(srcObj, destObj, srcKeys, exprsn, callback){
	if(srcKeys.length==0){
		callback(destObj);
	}else{
		if(srcObj[exprsn].type=="text" || srcObj[exprsn].type=="number" ){
			destObj[exprsn]=srcObj[exprsn].property;
			srcKeys.splice(0,1);
			if(srcKeys.length>0){
				prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
			}else{
				callback(destObj);
			}
		}else if(srcObj[exprsn].type=="fixed"){//no need to eval
			destObj[exprsn]=srcObj[exprsn].property;
			srcKeys.splice(0,1);
			if(srcKeys.length>0){
				prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
			}else{
				callback(destObj);
			}
		}else if(srcObj[exprsn].type=="struct"){
			destObj[exprsn]={};
			var stKeys=Object.keys(srcObj[exprsn].structDef);
			prepareJson(srcObj[exprsn].structDef, destObj[exprsn], stKeys, stKeys[0], function(stJson){
				
				destObj[exprsn]=stJson;
				srcKeys.splice(0,1);
				prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
			});
		}else if(srcObj[exprsn].type=="array"){
			destObj[exprsn]=[{}];
			
			if(srcObj[exprsn].elements.type=="struct"){
				var stKeys=Object.keys(srcObj[exprsn].elements.structDef);
				prepareJson(srcObj[exprsn].elements.structDef, destObj[exprsn][0], stKeys, stKeys[0], function(stJson){
					stJson.arrayRef=srcObj[exprsn].elements.arrayRef;
					destObj[exprsn][0]=(stJson);
					srcKeys.splice(0,1);
					prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
				});
			}else if(srcObj[exprsn].elements.type=="string"){
				/*Need to write */
				var stKeys=Object.keys(srcObj[exprsn].elements.structDef);
				prepareJson(srcObj[exprsn].elements.structDef, destObj[exprsn], stKeys, stKeys[0], function(stJson){
					destObj[exprsn]=stJson;
					srcKeys.splice(0,1);
					prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
				});
			}
			
		}
	}
}//End of prepareJson()

exports.prepareJson=prepareJson;




/**
 * 
 * @param record
 * @param srcKeys
 * @param exprsn
 * @param callback
 */
function deleteArrayRef(record, srcKeys, exprsn, callback){
	
	if(srcKeys.length==0){
		callback(record);
	}else{
		console.log(exprsn);
		if(exprsn=="arrayRef"){
			delete record[exprsn];
		}
		if(record[exprsn] && (record[exprsn].constructor==Array || record[exprsn].constructor==Object)){
			
			var obj=record[exprsn];
			var objKeys=Object.keys(obj);
			deleteArrayRef(record[exprsn], objKeys, objKeys[0],function(obJson){
				record[exprsn]=obJson;
				srcKeys.splice(0,1);
				deleteArrayRef(record, srcKeys, srcKeys[0], callback);
			});
			
		}else{
			
			srcKeys.splice(0,1);
			deleteArrayRef(record, srcKeys, srcKeys[0], callback);
		}
	}
}





function prepareJsonForRestAPI(parent, newJson, callback){
	console.log(parent.value);
	
	if(parent.dataKey){
		if(parent.value=="Object"){
			newJson[parent.dataKey]={};
		}else{
			if(parent.value)
			newJson[parent.dataKey]=parent.value;
		}
		if(parent.child.length && parent.value=="Object"){
			parent.child.forEach(function(child){
				console.log("Child");
				console.log(child);
				prepareJsonForRestAPI(child, newJson[parent.dataKey], function(d){
					newJson[parent.dataKey]=d;
				});
			});
		}else{
			console.log("invoking callback");
			callback(newJson);
		}
		
	}else{
		callback(newJson);
	}
}



function replaceWithValue(record, json, callback){
	
	if(json.constructor==Object && Object.keys(json).length>0){
		Object.keys(json).forEach(function(k){
			if(json[k].constructor==Object){
				replaceWithValue(record, json[k], function(val){
					json[k]=val;
					callback(json);
				});
			}
			
		});
	}else if(json.constructor==String){
		if(json.indexOf(record['docType'])!=-1){
			expEvaluator(record, json, function(result){
				callback(result);
			});
		}else{
			callback(result);
		}
	}
}