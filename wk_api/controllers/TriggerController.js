/*
 * @author saikiran.vadlakonda
 * Date created: 5th.October.2015
 */

var CouchBaseUtil=require('./CouchBaseUtil');
var couchbase = require('couchbase');
var GenericRecordServer=require('./GenericRecordServer.js');
var GenericRelatedRecordsServer=require('./GenericRelatedRecordsServer.js');
var utility=require('./utility.js');
var ContentServer=require('../ContentServer.js');
var global = require("../utils/global.js");
var QuickBooks = require("../services/QuickBooksService");
var RestApiController=require("./RestApiServiceController.js");
var OnTheFlyTrigger=require('./OnTheFlyTrigger.js');

var logseed = require('../services/logseed').logseed;

exports.processTriggerNew=processTriggerNew;
exports.beforeSaveTrigger=require("./BeforeSaveTrigger.js").beforeSaveTrigger;

function processTriggerNew(triggerDocId, recordId, userId, org, callback,request){
	var Data={};
	var savedDocs=[];
	try {
		logger("Processing trigger  "+triggerDocId);
		//Getting Trigger doc
		CouchBaseUtil.getDocumentByIdFromMasterBucket(triggerDocId, function(triggerDoc){
			if(triggerDoc.value){
				triggerDoc = triggerDoc.value
				if(triggerDoc.onTheFlyTrigger){
					var onTheFlyTriggerDoc={
						recordId: recordId,
						targetRecordId: recordId,
						triggerId:triggerDocId
					};
					console.log("Going to onthefly trigger");
					//On the fly trigger is for fire and forget type
					//ex: from the catalogue adding a product to speclist
					//creates multiple docs
					OnTheFlyTrigger.ProcessOnTheFlyTrigger(onTheFlyTriggerDoc, userId, org, callback, request);
				}else{
					//Getting, actual record, user record, organization record
					CouchBaseUtil.getDocumentsByIdsFromContentBucket([recordId,userId,org],function(Response){
						if(Response.error){
							logger(JSON.stringify(Response));
							callback({error: "Document not found"});
							return;
						}
						if(!Response[recordId].value || !Response[userId].value || !Response[org].value){
							logger(JSON.stringify(Response));
							callback({error: "Document not found check these: "+recordId+", "+userId+", "+org});
							return;
						}
						//Data variable holds root parameters and their actual values
						Data["create"]={};//Records to be created will stored here
						Data['callback']=callback;//callback after trigger completion
						Data[recordId]=Response[recordId].value;//current record
						Data[userId]=Response[userId].value;//UserDocument
						Data[org]=Response[org].value;//Org document
						Data['update']={};//All record updates will be stored here
						var ResultData={};//Result to be called with callback

						//now storing the docIds
						Data[triggerDoc.schemas.sourceSchema]=Response[recordId].value;
						Data.triggerDocId=triggerDocId;
						Data.recordId=recordId;
						Data.userId=userId;
						Data.org=org;

						//Checking for order of actions in the trigger doc
						if(Array.isArray(triggerDoc.orderOfProcessing) && triggerDoc.orderOfProcessing.length>0){
							doAction(0);
						}else{
							callback({"error": "order of processing is not found in trigger doc"});
							return;
						}

						function doAction(indx){
							var condStatus = true;//this holds the action condition predicate result
							//Default action predicate status is tru

							//actions are not completed yet do current action
							if(indx<triggerDoc.orderOfProcessing.length){
								logger("do action"+indx);
								var actionStr = triggerDoc.orderOfProcessing[indx];//createOrder
								var action = triggerDoc.actions[actionStr];//createOrder:{conditions:{}, actions:{}}
								var anyContitonConfigured=false;
								//if action is [condtion then logic]
								if(action.conditions){
									//Condition can be all | any
									if((Array.isArray(action.conditions.all) && action.conditions.all.length>0) ||
										(Array.isArray(action.conditions.any) && action.conditions.any.length>0)){
										var conditions = action.conditions.all;
										if(Array.isArray(action.conditions.any)){
											conditions=action.conditions.any;
											anyContitonConfigured=true;
										}
										var conLen = conditions.length;
										processCondition(0);
										function processCondition(condNum){
											logger("processCondition"+condNum);
											if(condNum >= conLen){//if all Conditions processing succeeded
												logger("conditions array completed");
												if(!condStatus){//if all conditions are not true
													doAction(indx+1);
												}else{
													logger("processAction()---else");
													processAction();
												}
											}else if(condStatus){//if previous condition is true continue here
												if(anyContitonConfigured && condNum>0){//in case of any condition
													//short circuite ivaluation
													//skip remaining conditions and process action
													processAction();
													return;
												}
												logger("err2"+condStatus);
												var condition = conditions[condNum];
												/* *
												 * Need to write more efficient code, to check condition in various scenarios
												 * left side records getting and right side records getting like all possible cases
												 * */
												//if condition is with ther related records
												if(condition.indexOf("->")!=-1){
													var srcSchm = condition.split("->")[0];
													var relation = condition.split("->")[1];
													if(relation.indexOf(".")!=-1){
														relation = relation.split(".")[0];
													}
													logger(srcSchm+" : "+relation);
													if(srcSchm && relation){
														CouchBaseUtil.getDocumentByIdFromMasterBucket(srcSchm, function(schmaRes){
															var schema=schmaRes.value;
															if(schema["@relations"]){
																//look for relation schema
																var rels = Object.keys(schema["@relations"]);
																var relRefSchma='';
																for(var rI=0; rI<rels.length; rI++){
																	for(var key in schema["@relations"][rels[rI]]){
																		if(schema["@relations"][rels[rI]][key] == relation){
																			relRefSchma=schema["@relations"][rels[rI]]["relationRefSchema"];
																			logger("got relation ref schema: "+relRefSchma);
																		}
																	}
																}
																if(relRefSchma!=''){//get relatedRecords
																	GenericRelatedRecordsServer.getRelatedRecords({body:{
																		recordId:Data[srcSchm].recordId,
																		relationName:relation,
																		relationRefSchema:relRefSchma,
																		org:(Data[srcSchm] && Data[srcSchm].org)?Data[srcSchm].org:org,
																		fromTrigger:true}}, function(recs){

																		if(recs.records.length>0){
																			condStatus = true;
																			logger("Index of ->");
																			var recArr=[];
																			recs.records.forEach(function(record){
																				recArr.push(record.value);
																			});
																			Data[srcSchm+"->"+relation]=recArr;

																			if(eval(condition.replace(srcSchm+"->"+relation, "Data['"+srcSchm+"->"+relation+"']"))){
																				condStatus = true;
																			}else{
																				condStatus = false;
																			}
																			processCondition(condNum+1);
																		}else{
																			callback({"error":"records not found in schema "+srcSchm+" with relation "+relation});
																			logger("error: records not found in schema1 "+srcSchm+" with relation "+relation);
																		}
																	});
																}else{
																	callback({"error":"relation RefSchema is not found in schema "+srcSchm});
																	logger("error: relation RefSchema is not found in schema "+srcSchm);
																}
															}else{
																callback({"error":"relations are not found in schema "+srcSchm});
																logger("error: relations are not found in schema "+srcSchm);
															}

														});

													}else{
														logger("Illegal expression, relation or schema not found");
														callback({"error":"illegal expression, relation or schema not found"});
													}

												}else if(condition.indexOf(".")!=-1 || condition.indexOf("[")!=-1){//if the condition is on the same record
													var con=condition;
													if(condition.indexOf(triggerDoc.schemas.sourceSchema)!=-1){//if condition is with its source schema
														con = condition.replace(triggerDoc.schemas.sourceSchema, "Data."+triggerDoc.schemas.sourceSchema);
													}else if(condition.indexOf("recordId")!=-1){//Added code to process value like recordId.User etc. for value existance
														con = condition.replace("recordId", "Data['"+recordId+"']");
													}
													logger("condition: "+con);
													logger(eval(con));
													if(eval(con)){
														condStatus=true;
													}else{
														condStatus = false;
													}
													processCondition(condNum+1);
												}else{
													condStatus = false;
													processCondition(condNum+1);
												}
											}else{//if any condtion is false
												logger("err3"+condStatus);
												if(action.errorMessage){//if action is configured with errorMessage throw back
													logger("condition evaluated to false and error message is configured, returning error message.");
													callback({error:action.errorMessage});
												}else{//else do next action
													logger("condition evaluated to false, proceeding for next action.");
													doAction(indx+1);
												}

											}
										}

									}else{
										logger("Not found conditions all/any");
										processAction();
									}
								}

								/**
								 * Below code is to processing action after condition evaluation is true
								 * */
								function processAction(){
									logger("processing action:");
									if(typeof action.actions=="object" && action.actions!=null && condStatus){
										//if action is creating a new record
										if(action.actions.create && action.actions.create.createMethod=="createMethod"){
											var hostname
											if(request && request.headers && request.headers.host && request.headers.host.split(":")){
												hostname=request.headers.host.split(":")[0];
											}
											var cloudPointHostId;
											if(hostname && ContentServer.getConfigDetails(hostname)){
												cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
											}
											//get the creating record schema
											utility.getMainSchema({schema:action.actions.create.record,cloudPointHostId:cloudPointHostId},function(schema){
												if(schema.error){callback({error:data.docType+" not exists"});return;}
												var newRecord = {};
												if(schema['@properties']){
													var props = Object.keys(schema['@properties']);
													//if action properties are given then continue with action props else take all schema properties
													props=Object.keys(action.actions.create.props).length>props.length?Object.keys(action.actions.create.props):props;
													//setting system properties
													newRecord['org']=org;
													newRecord['docType']=schema['@id'];
													newRecord['cloudPointHostId']=cloudPointHostId;
													newRecord['recordId']=schema['@id']+""+global.guid();
													newRecord['author']=userId;
													newRecord['editor']=userId;
													newRecord['revision']=1;
													newRecord['dateCreated']=global.getDate();
													newRecord['dateModified']=global.getDate();
													//setting other properties
													setProp(0);

													function setProp(index){
														if(index>=props.length){//all properties assignement done
															logger("next doAction: "+indx);
															Data[newRecord['docType']]=newRecord;
															Data['create'][newRecord.recordId]=(newRecord);
															doAction(indx+1);
														}else{
															logger("processing for: "+action.actions.create.props[props[index]]);
															var PropdataType="";
															if(schema['@properties'][props[index]]){
																PropdataType=schema['@properties'][props[index]].dataType.type;
															}else if(schema['@sysProperties'][props[index]]){
																PropdataType=schema['@sysProperties'][props[index]].dataType.type;
															}
															if(action.actions.create.props && action.actions.create.props[props[index]]){
																//if current is set
																if(action.actions.create.props[props[index]] == "current" || action.actions.create.props[props[index]] == "recordId"){
																	logger("prop eval: "+props[index]);
																	newRecord[props[index]] = Data.recordId;
																	setProp(index+1);
																}else if(action.actions.create.props[props[index]].indexOf("recordId.")!=-1){
																	if(action.actions.create.props[props[index]].split(".").length==2){//if recordId.something
																		//it is immedeately avialable in data.recordId
																		logger("Prop value assign: "+(action.actions.create.props[props[index]].replace("recordId", "Data['"+recordId+"']")));
																		logger("Prop eval: "+(eval(action.actions.create.props[props[index]].replace("recordId", "Data['"+recordId+"']"))));
																		newRecord[props[index]] = eval(action.actions.create.props[props[index]].replace("recordId", "Data['"+recordId+"']"));
																		setProp(index+1);
																	}else{
																		expEvaluator(Data[recordId], action.actions.create.props[props[index]], function(val){
																			logger("assigned: "+val);
																			newRecord[props[index]] = val;
																			setProp(index+1);
																		});
																	}
																}else if(Data[action.actions.create.props[props[index]]]){//if string is a property in Data
																	newRecord[props[index]] = Data[action.actions.create.props[props[index]]];
																	setProp(index+1);
																}else{//store the string if not found any where
																	newRecord[props[index]] = action.actions.create.props[props[index]];
																	setProp(index+1);
																}
															/**
															 * assigning respective default values
															 *  Array= ["multiPickList","array","image","images","attachment","attachments","privateVideo","privateVideos","dndImage","tags"]
															 *	Objects=["struct","geoLocation","userDefinedFields","richText"]
															 *	boolean
															 *	number
															 */
															}else if(["multiPickList","array","image","images","attachment","attachments","privateVideo","privateVideos","dndImage","tags"].indexOf(PropdataType)!=-1){
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
														}

													}

												}
											});
										}

										if(action.actions.assign){
											if(action.actions.assign.remoteRecord){//checking for remote record
												var remoteRecordId = action.actions.assign.remoteRecord;
												if(remoteRecordId.indexOf("recordId")!=-1){//if remote record id is in current document
													remoteRecordId = remoteRecordId.replace("recordId", "Data['"+recordId+"']");
													logger("Remote record id: "+remoteRecordId);
													remoteRecordId = eval(remoteRecordId);
												}
												//get Remote Record and update
												CouchBaseUtil.getDocumentByIdFromContentBucket(remoteRecordId, function(remoteRecord){
													if(remoteRecord.error){//no record exists
														logger("remote record: "+remoteRecordId+" does not exist...");
														doAction(indx+1);
													}else{
														//get the updation in Global Data object
														if(Data['update'][remoteRecordId]){//if it is already in updation process
															remoteRecord = Data['update'][remoteRecordId];
														}else{//else fresh updation to be made
															remoteRecord = remoteRecord.value;
														}
														logger("Got Remote Record: "+remoteRecord.recordId);
														var prop = action.actions.assign.property;
														//Code added for Some more generic functionality,
														var val=action.actions.assign.value;
														if(action.actions.assign.value){//if value is fixed
															val=action.actions.assign.value;
															if(remoteRecord[prop] &&  remoteRecord[prop].constructor==Array){
																remoteRecord[prop].push(val);
															}else{
																remoteRecord[prop]=(val);
															}
															Data['update'][remoteRecord.recordId]=(remoteRecord);
															Data[remoteRecord.recordId]=remoteRecord;
															logger("Remote record id: "+remoteRecord.recordId);
															doAction(indx+1);
														}else if(action.actions.assign.valueExpression){//if value to be get from an expression
															val=action.actions.assign.valueExpression;
															var context;
															if(val.indexOf("recordId")!=-1){
																val = val.replace("recordId", recordId);
															}
															expEvaluator(Data[recordId], val, function(expRes){
																val=expRes;
																logger("Assigning value: "+val);
																if(!action.actions.assign.noPush && remoteRecord[prop] && remoteRecord[prop].constructor==Array){
																	remoteRecord[prop].push(val);
																} else {
																	remoteRecord[prop]=(val);
																}
																Data['update'][remoteRecord.recordId]=(remoteRecord);
																Data[remoteRecord.recordId]=remoteRecord;
																logger("Remote record id: "+remoteRecord.recordId);
																doAction(indx+1);
															});
														}else if(action.actions.assign.evalExpression){//if evalExpression like array.reduce
															try{
																val=action.actions.assign.evalExpression;
																if(val.expression && typeof val.expression=="object"){
																	var temp=evalExpression(val.expression.operator,val.expression.values);
																	logger("Assigning value: "+temp);
																	if(!action.actions.assign.noPush && remoteRecord[prop] && remoteRecord[prop].constructor==Array){
																		remoteRecord[prop].push(temp);
																	} else {
																		remoteRecord[prop]=(temp);
																	}
																	Data['update'][remoteRecord.recordId]=(remoteRecord);
																	Data[remoteRecord.recordId]=remoteRecord;
																	logger("Remote record id: "+remoteRecord.recordId);
																	doAction(indx+1);
																}
																function evalExpression(operator,values){
																	if(Array.isArray(values) && values.length==2 && operator){
																		var newVal=[];
																		values.forEach(function(value){
																			logger(value);
																			if(typeof value=="object" && value.expression){
																				newVal.push(evalExpression(value.expression.operator,value.expression.values));
																			}else{
																				if(value.indexOf("recordId")!=-1){
																					value = value.replace("recordId", recordId);
																					expEvaluator(Data[recordId], value, function(expRes){
																						newVal.push(expRes);
																					})
																				}else{
																					newVal.push(value)
																				}


																			}
																		})
																		var temp=(newVal[0]+operator+newVal[1]);
																		return(eval(temp));
																	}
																}

															}catch(err){
																doAction(indx+1);
															}
														}else if(action.actions.assign.hasOwnProperty("emptyValue")){
															logger("Empty Value");
															logger(action.actions.assign.emptyValue);
															remoteRecord[prop]=action.actions.assign.emptyValue;
															Data['update'][remoteRecord.recordId]=(remoteRecord);
															Data[remoteRecord.recordId]=remoteRecord;
															logger("Remote record id: "+remoteRecord.recordId);
															doAction(indx+1);
														}else if(action.actions.assign.hasOwnProperty("incrementValue")){
															logger("incrementValue");
															logger(action.actions.assign.incrementValue);
															if(isNaN(remoteRecord[prop])){
																remoteRecord[prop]=0;
															}
															remoteRecord[prop]=remoteRecord[prop]*1 + action.actions.assign.incrementValue*1;
															Data['update'][remoteRecord.recordId]=(remoteRecord);
															Data[remoteRecord.recordId]=remoteRecord;
															logger("Remote record id: "+remoteRecord.recordId);
															doAction(indx+1);
														}else if(action.actions.assign.hasOwnProperty("struct")){
															/**
															 * Updated for SupSideRFQ
															 * D:10-05-2017
															 * */
															logger("struct");
															var struct=action.actions.assign.struct;
															var jsnKys=Object.keys(struct);
															var valJson={};
															prepareJson(0);
															function prepareJson(jsnIndx){
																if(jsnIndx<jsnKys.length){
																	var val=struct[jsnKys[jsnIndx]];
																	if(val.indexOf("recordId")!=-1){
																		val = val.replace("recordId", recordId);
																	}
																	expEvaluator(Data[recordId], val, function(expRes){
																		val=expRes;
																		logger("Assigning value: "+val);
																		valJson[jsnKys[jsnIndx]]=val;
																		prepareJson(jsnIndx+1);
																	});
																}else{
																	logger("Done creating Struct", valJson);
																}
															}

															if(remoteRecord[prop] && remoteRecord[prop].constructor==Array){
																remoteRecord[prop].push(valJson);
															} else {
																remoteRecord[prop]=(valJson);
															}
															Data['update'][remoteRecord.recordId]=(remoteRecord);
															Data[remoteRecord.recordId]=remoteRecord;
															logger("Remote record id: "+remoteRecord.recordId);
															doAction(indx+1);
														}
													}
												});
												//if modifying current Document
											}else if(action.actions.assign){//Code added D:28-10-2015//

												if(action.actions.assign.constructor==Array){//Added to support multiple assigning D:04-07-2016
													var record=Data[triggerDoc.schemas.sourceSchema];
													if(Data['update'] [Data[triggerDoc.schemas.sourceSchema]['recordId']]){
														record=Data['update'] [Data[triggerDoc.schemas.sourceSchema]['recordId']];
														if(!record){
															record=Data[triggerDoc.schemas.sourceSchema];
														}
													}
													var assigns = action.actions.assign;
													var assignsLen = assigns.length;
													processAssigns(0);

													/*
													 * Adding code for multiple assign operations in after save
													 *
													 * */
													function processAssigns(assignInd){
														if(assignInd>=assignsLen){
															logger("Assigning operations are done.");
															Data['update'][record.recordId]=(record);
															Data[recordId]=record;
															Data[triggerDoc.schemas.sourceSchema]=record;
															doAction(indx+1);//Going for next action
														}else{
															var assignProp = assigns[assignInd]['property'];//visibility
															var assignVal = assigns[assignInd]['value'];//author
															logger("Getting expEval");
															if(assignVal.indexOf("+")==-1){
																expEvaluator(record, assignVal, function(val){
																	logger("assigned: "+val);
																	while(val.constructor==String && val.indexOf("\"")!=-1){
																		val = val.replace("\"","");
																	}
																	logger("assigned revised: "+val);
																	//Patch Added on D: 4th Feb, 2016
																	if(record[assignProp] && record[assignProp].constructor==Array){
																		if(val.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																			logger("Value array and property array");

																			val.forEach(function(v){
																				logger(record[assignProp].indexOf(v));
																				record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																			});

																		}else{
																			logger("Value string and property array");
																			if(record[assignProp].indexOf(val)==-1){
																				logger("Not found, so pushing");
																				record[assignProp].push(val);
																			}else{
																				logger("val exists...");
																			}

																		}

																	}else{
																		record[assignProp]=val;
																	}
																	processAssigns(assignInd+1);
																});
															}else{
																processComboProp(record, assignVal, function(finalVal){
																	logger("final value: "+finalVal);
																	if(record[assignProp] && record[assignProp].constructor==Array){
																		if(finalVal.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																			logger("Value array and property array");

																			finalVal.forEach(function(v){
																				logger(record[assignProp].indexOf(v));
																				record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																			});

																		}else{
																			logger("Value string and property array");
																			if(record[assignProp].indexOf(finalVal)==-1){
																				logger("Not found, so pushing");
																				record[assignProp].push(finalVal);
																			}else{
																				logger("val exists...");
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
													/*
													 * end of multiple assign operations in after save
													 * */
												}else if(action.actions.assign.hasOwnProperty("emptyValue")){
													logger("Empty Value");
													logger(action.actions.assign.emptyValue);
													var record=Data[triggerDoc.schemas.sourceSchema];
													if(Data['update'] [record.recordId] ){
														record=Data['update'][record.recordId];
														if(!record){
															record=Data[triggerDoc.schemas.sourceSchema];
														}
													}
													record[action.actions.assign.property]=action.actions.assign.emptyValue;
													//Data['update'].push(remoteRecord.recordId);
													Data['update'][record.recordId]=(record);
													Data[record.recordId]=record;
													Data[triggerDoc.schemas.sourceSchema]=record;
													logger("Remote record id: "+record.recordId);
													doAction(indx+1);

												}else if(action.actions.assign.hasOwnProperty("valueExpression")){
													var record=Data[triggerDoc.schemas.sourceSchema];
													if(Data['update'] [record.recordId] ){
														record=Data['update'][record.recordId];
														if(!record){
															record=Data[triggerDoc.schemas.sourceSchema];
														}
													}
													var val=action.actions.assign.valueExpression;
													if(val.indexOf("recordId.")!=-1){
														val = val.replace("recordId", recordId);
														expEvaluator(Data[recordId], val, function(expRes){
															val=expRes;
															logger("Assigning value: "+val);
															if(!action.actions.assign.noPush && record[prop] && record[prop].constructor==Array){
																record[action.actions.assign.property].push(val);
															} else {
																record[action.actions.assign.property]=(val);
															}
															Data['update'][record.recordId]=(record);
															Data[record.recordId]=record;
															Data[triggerDoc.schemas.sourceSchema]=record;
															logger("Remote record id: "+record.recordId);
															doAction(indx+1);
														});
													}else if(val.indexOf("Schema@")>-1){
														if(val.split(".").length==2){
															var schma= val.split(".")[0];
															schma=schma.split("@")[1];
															record[action.actions.assign.property] = eval(val.replace("Schema@"+schma, "Data['"+schma+"']"));
														}else if((recProps[recKeys[rpI]]).split(".").length==1){
															var schma= val.split(".")[0];
															schma=schma.split("@")[1];
															record[action.actions.assign.property] = eval(val.replace("Schema@"+schma, "Data['"+schma+"']"));
														}
														Data['update'][record.recordId]=(record);
														Data[record.recordId]=record;
														Data[triggerDoc.schemas.sourceSchema]=record;
														doAction(indx+1);
													}else if(val.indexOf("store")>-1){
														record[action.actions.assign.property] = eval(val.replace("store", "Data['store']"));
														Data['update'][record.recordId]=(record);
														Data[record.recordId]=record;
														Data[triggerDoc.schemas.sourceSchema]=record;
														doAction(indx+1);
													}else{
														doAction(indx+1);
													}
												}else if(action.actions.assign.hasOwnProperty("incrementValue")){
													logger("incrementValue");
													logger(action.actions.assign.incrementValue);
													var record=Data[triggerDoc.schemas.sourceSchema];
													if(Data['update'] [record.recordId] ){
														record=Data['update'][record.recordId];
														if(!record){
															record=Data[triggerDoc.schemas.sourceSchema];
														}
													}
													if(isNaN(record[action.actions.assign.property])){
														record[action.actions.assign.property]=0;
													}
													record[action.actions.assign.property]=record[action.actions.assign.property]*1+action.actions.assign.incrementValue*1;
													//Data['update'].push(remoteRecord.recordId);
													Data['update'][record.recordId]=(record);
													Data[record.recordId]=record;
													Data[triggerDoc.schemas.sourceSchema]=record;
													logger("Remote record id: "+record.recordId);
													doAction(indx+1);

												}else if(action.actions.assign.hasOwnProperty("struct")){
													/*
													 * Updated for SupSideRFQ
													 * D:10-05-2017
													 *
													 * */
													logger("struct");
													var prop = action.actions.assign.property;
													var record=Data[triggerDoc.schemas.sourceSchema];
													if(Data['update'] [record.recordId] ){
														record=Data['update'][record.recordId];
														if(!record){
															record=Data[triggerDoc.schemas.sourceSchema];
														}
													}
													var struct=action.actions.assign.struct;
													var jsnKys=Object.keys(struct);
													var valJson={};
													prepareJson(0);


													function prepareJson(jsnIndx){
														if(jsnIndx<jsnKys.length){
															var val=struct[jsnKys[jsnIndx]];
															if(val.indexOf("recordId")!=-1){
																val = val.replace("recordId", recordId);
															}
															expEvaluator(Data[recordId], val, function(expRes){
																val=expRes;
																logger("Assigning value: "+val);
																valJson[jsnKys[jsnIndx]]=val;
																prepareJson(jsnIndx+1);
															});
														}else{
															logger("Done creating Struct", valJson);
														}
													}

													if(record[prop] && record[prop].constructor==Array){
														record[prop].push(valJson);
													} else {
														record[prop]=(valJson);
													}
													Data['update'][record.recordId]=(record);
													Data[record.recordId]=record;
													Data[triggerDoc.schemas.sourceSchema]=record;
													logger("Remote record id: "+record.recordId);
													doAction(indx+1);
												}else{
													//triggerDoc: triggerToSaveMessage, below code is to support legacy trigger documents
													var property = action.actions.assign.property;
													var val = action.actions.assign.value.split(".");
													var record=Data[triggerDoc.schemas.sourceSchema];
													if(Data['update'] [record.recordId] ){
														record=Data['update'][record.recordId];
														if(!record){
															record=Data[triggerDoc.schemas.sourceSchema];
														}
													}

													if(property.indexOf("->")==-1 && property.indexOf('recordId')!=-1 && property.split(".").length==2){
														var kys = property.split(".");
														if(val.length==2){
															record[kys[1]]= Data[val[0]][val[1]];
														}else{
															logger("else val[0]: "+val[0]);
															record[kys[1]]= val[0];
														}
														Data['update'][record.recordId]=record;
														Data[record.recordId]=record;
														Data[triggerDoc.schemas.sourceSchema]=record;
														logger("record id: "+record['recordId']);

														doAction(indx+1);
													}else{
														//May be we are missing retrieving value from a relation
														logger("need to write more logic to handle property like recordId.xxx or not, currently ingnoring and processing for next");
														doAction(indx+1);
													}
												}


											}
										}
										//if delete action is set
										if(action.actions && action.actions.delete){
											var delData = action.actions.delete;
											var qry = {"select": ["recordId"], "from": "records","where":  delData };
											constructN1QL(qry, Data['recordId'], function(finalQry){
												CouchBaseUtil.executeViewInContentBucket(couchbase.N1qlQuery.fromString(finalQry), function(queryResult){
													console.log(queryResult);
													if(queryResult && queryResult.length>0 && queryResult[0].recordId){
														GenericRecordServer.removeRecord(request,queryResult[0].recordId,function(){
															console.log("Record Deleted: "+(queryResult[0].recordId));
															doAction(indx+1);
														});
													}else{
														console.log("Record not found");
														doAction(indx+1);
													}
												});
											});

										}
										//Write Service Invocation code here
										if(action.actions && action.actions.invokeService){
											var serviceName=action.actions.invokeService.serviceName;
											if(serviceName=="RestApiService"){
												var serviceDoc = action.actions.invokeService.serviceDoc;
												var record=Data[triggerDoc.schemas.sourceSchema];
												if(Data['update'] [record.recordId] ){
													record=Data['update'][record.recordId];
													if(!record){
														record=Data[triggerDoc.schemas.sourceSchema];
													}
												}
												if(serviceDoc.apiEndPointURL){
													var restApiDoc = {};
													restApiDoc['parameters']={};
													restApiDoc['path']={};
													restApiDoc['data']={};
													restApiDoc['options']={};
													restApiDoc['method']="";
													restApiDoc['apiEndPoint']=serviceDoc.apiEndPointURL+
													(action.actions.invokeService.path=="/" ? "":action.actions.invokeService.path);

													serviceDoc.pathAndParams.forEach(function(pathAndParam){
														if(pathAndParam.path==action.actions.invokeService.path){
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
																	logger("Final Temp Json");
																	logger(finalTempJson);
																});
															});

															Object.keys(postData).forEach(function(dataKey){
																replaceWithValue(record, postData[dataKey], function(d){
																	postData[dataKey]=d;
																	 logger("d");logger(d);
																 });
															});

															 logger("PostData: ");
															 logger(JSON.stringify(postData));
															/*
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
															*/
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


													RestApiController.invokeRestApiService(restApiDoc, function(res){
														logger(res);

														//need to write logic to store result in properties of record.

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
														Data['update'][record.recordId]=record;
														Data[recordId]=record;
														logger("Modified Record:");
														logger(JSON.stringify(record));

														doAction(indx+1);
													});

													//Just for testing we are not invoking rest api
													//doAction(indx+1);
												}else{
													//Code for error message
												}

											}//Need to write for another service

										}

										if(action.actions && action.actions.email){
											if(action.actions.email.to &&
													Array.isArray(action.actions.email.to) &&
													action.actions.email.values &&
													Array.isArray(action.actions.email.values) &&
													action.actions.email.message &&
													action.actions.email.subject){
												console.log("EMAIL TRIGGER");
												var context=Data[triggerDoc.schemas.sourceSchema];
												var to=[];
												var values=[];
												var message=action.actions.email.message;
												var subject=action.actions.email.subject;
												processEmailTo();
												function processEmailTo(){
													peto(0);
													function peto(ptoi){
														if(ptoi<action.actions.email.to.length){
															expEvaluator(context, action.actions.email.to[ptoi], function(ptovalue){
																if(Array.isArray(ptovalue)){
																	for(var i=0;i<ptovalue.length;i++){
																		to.push(ptovalue[i].replace(/\"$/,"").replace(/^\"/,""));
																	}
																}else{
																	to.push(ptovalue.replace(/\"$/,"").replace(/^\"/,""));
																}
																peto(ptoi+1);
															});
														}else{
															processEmailValues();
														}
													}

												}
												function processEmailValues(){
													pev(0);
													function pev(pvi){
														if(pvi<action.actions.email.values.length){
															expEvaluator(context, action.actions.email.values[pvi], function(pvvalue){
																values.push(pvvalue.replace(/\"$/,"").replace(/^\"/,""));
																pev(pvi+1);
															});
														}else{
															processMessage();
														}
													}
												}

												function processMessage(){
													var dollarSigns=message.match(/\$\d/g);
													if(dollarSigns)
													for(var i=0;i<dollarSigns.length;i++){
														message=message.replace(new RegExp("\\"+dollarSigns[i],"g"),values[(dollarSigns[i].replace("$","")*1)-1]);
													}
													dollarSigns=subject.match(/\$\d/g);
													if(dollarSigns)
													for(var i=0;i<dollarSigns.length;i++){
														subject=subject.replace(new RegExp("\\"+dollarSigns[i],"g"),values[(dollarSigns[i].replace("$","")*1)-1]);
													}
													var mailData={
															from:"Wishkarma "+" <info@wishkarma.com>",
															to:to,
															subject:subject,
															//text:message,
															html:message
														}
													require('../services/clsMailgun.js').getMailgun().messages().send(mailData, function (err, result) {
														if (err) {
															logger(err);
														}else {
															logger("email sent");
														}
													});
													doAction(indx+1);
												}


											}else{
												doAction(indx+1);
											}
										}

										if(action.actions && action.actions.box){
											if(action.actions.box.action &&
													action.actions.box.data &&
													!Array.isArray(action.actions.box.data) &&
													typeof action.actions.box.data=="object" ){
												console.log("BOX TRIGGER");
												var context=Data[triggerDoc.schemas.sourceSchema];
												var data={};
												data.action=action.actions.box.action
												processTo();
												function processTo(){
													pto(0);
													function pto(ptoi){
														if(ptoi<Object.keys(action.actions.box.data).length){
															expEvaluator(context,action.actions.box.data[Object.keys(action.actions.box.data)[ptoi]], function(ptovalue){
																data[Object.keys(action.actions.box.data)[ptoi]]=ptovalue.replace(/\"$/,"").replace(/^\"/,"");
																pto(ptoi+1);
															});
														}else{
															processAPI();
														}
													}

												}

												function processAPI(){
													require('../services/Box_com_API.js').service(data, function (err, result) {
														doAction(indx+1);
													});
												}


											}else{
												doAction(indx+1);
											}
										}




										if(action.actions && action.actions.redirect){
											var redirectKeys = Object.keys(action.actions.redirect);
											var rKeysLen = redirectKeys.length;
											for(var i=0;i<rKeysLen;i++){
												var key = action.actions.redirect[redirectKeys[i]]
												ResultData[redirectKeys[i]]=Data[key];
											}
											logger(ResultData);
											doAction(indx+1);
										}

										if(action.actions && action.actions.n1ql){
											var qry=action.actions.n1ql.query;
											constructN1QL(qry, Data['recordId'], function(finalQry){
												if(qry.from == "records"){
													logger("final query: ", finalQry);
													CouchBaseUtil.executeViewInContentBucket(couchbase.N1qlQuery.fromString(finalQry), function(queryResult){
														logger("query results: ", queryResult);
														if(action.actions.n1ql.if &&
																action.actions.n1ql.if.cond
																&& eval(action.actions.n1ql.if.cond)){

															if(action.actions.n1ql.if.store){
																Data['store']=eval(action.actions.n1ql.if.store);
															}
															var crJson=action.actions.n1ql.if.create;
															if(crJson){
																createNSetProps(crJson, function(){
																	logger("n1ql if eval done");
																	doAction(indx+1);
																});
															}else{
																doAction(indx+1);
															}
														}else if(action.actions.n1ql.else){
															var elseJson = action.actions.n1ql.else;
															if(elseJson){
																processElse(elseJson, function(){
																	logger("n1ql if eval done");
																	doAction(indx+1);
																});
															}else{
																doAction(indx+1);
															}

														}else{
															if(action.actions.n1ql.store){
																try{Data['store']=eval(action.actions.n1ql.store);}catch(err){}
															}
															doAction(indx+1);
														}
													});
												}

											});
										}
									}else{
										logger("No actions are configured, invoking next action. or conditions evaluation result is false");
										doAction(indx+1);
									}
								}


								//If action is configured with for and each
								if(action.for && action.for.Each){
									logger("----foreach---");
									var eachStr = action.for.Each;
									if(Data[eachStr]){//Means we've data, no need to retrieve again
										logger("----eachstr is available--");
										processForEach(0);
									}else{
										//if(eachStr.indexOf(".")!=-1 && eachStr.indexOf("->")==-1){
											if(eachStr.indexOf("recordId")!=-1){
												eachStr = eachStr.replace("recordId", recordId);
												var getStr = eachStr.split(".");
												if(getStr.length==2){
													Data[eachStr] = Data[getStr[0]][getStr[1]];
													processForEach(0);
												}
											}else{

												/*
												 * Because for each action, we are providing user to select property from relation, enabled only in ForEach
												 */
												var srcSchm = eachStr.split("->")[0];
												var relation = eachStr.split("->")[1];
												if(relation.indexOf(".")!=-1){
													relation = relation.split(".")[0];
												}
												logger(srcSchm+" : "+relation);
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
																		logger("got relation ref schema: "+relRefSchma);
																	}
																}
															}
															if(relRefSchma!=''){
																var relRecId =Data[srcSchm]?Data[srcSchm].recordId:recordId;
																if(action.for.recordId){
																	if(action.for.recordId.indexOf("recordId.")==0 && action.for.recordId.split(".").length>=2){
																		expEvaluator(Data[recordId], action.for.recordId, function(result){
																			logger("recordId for related records: "+result);
																			relRecId=result;
																			GenericRelatedRecordsServer.getRelatedRecords({body:{recordId:relRecId,relationName:relation, relationRefSchema:relRefSchma, org:(Data[srcSchm] && Data[srcSchm].org)?Data[srcSchm].org:org,fromTrigger:true}}, function(recs){
																				if(recs && recs.records && recs.records.length>0){

																					logger("Index of ->");
																					var recArr=[];
																					recs.records.forEach(function(record){
																						recArr.push(record.value);
																					});
																					Data[srcSchm+"->"+relation]=recArr;
																					processForEach(0);

																				}else{
																					callback({"error":"records not found in schema "+srcSchm+" with relation "+relation});
																					logger("error: records not found in schema2 "+srcSchm+" with relation "+relation);
																				}
																			});
																		});
																	}else{
																		relRecId = eval(action.for.recordId.replace("recordId", "Data['"+recordId+"']"));

																		logger({recordId:relRecId,relation:relation, relationRefSchema:relRefSchma, org:((Data[srcSchm] && Data[srcSchm].org)?Data[srcSchm].org:org)});
																		GenericRelatedRecordsServer.getRelatedRecords({body:{recordId:relRecId,relationName:relation, relationRefSchema:relRefSchma, org:(Data[srcSchm] && Data[srcSchm].org)?Data[srcSchm].org:org,fromTrigger:true}}, function(recs){
																			if(recs && recs.records && recs.records.length>0){

																				logger("Index of ->");
																				var recArr=[];
																				recs.records.forEach(function(record){
																					recArr.push(record.value);
																				});
																				Data[srcSchm+"->"+relation]=recArr;
																				processForEach(0);

																			}else{
																				callback({"error":"records not found in schema "+srcSchm+" with relation "+relation});
																				logger("error: records not found in schema3 "+srcSchm+" with relation "+relation);
																			}
																		});
																	}

																}else{
																	logger({recordId:relRecId,relation:relation, relationRefSchema:relRefSchma, org:Data[srcSchm].org?Data[srcSchm].org:org});
																	GenericRelatedRecordsServer.getRelatedRecords({body:{recordId:relRecId,relationName:relation, relationRefSchema:relRefSchma, org:Data[srcSchm].org?Data[srcSchm].org:org,fromTrigger:true}}, function(recs){
																		if(recs && recs.records && recs.records.length>0){

																			logger("Index of ->");
																			var recArr=[];
																			recs.records.forEach(function(record){
																				recArr.push(record.value);
																			});
																			Data[srcSchm+"->"+relation]=recArr;
																			processForEach(0);

																		}else{
																			callback({"error":"records not found in schema "+srcSchm+" with relation "+relation});
																			logger("error: records not found in schema4 "+srcSchm+" with relation "+relation);
																		}
																	});
																}

															}else{
																callback({"error":"relation RefSchema is not found in schema "+srcSchm});
																logger("error: relation RefSchema is not found in schema "+srcSchm);
															}
														}else{
															callback({"error":"relations are not found in schema "+srcSchm});
															logger("error: relations are not found in schema "+srcSchm);
														}

													});

												}else{
													logger("Illegal expression, relation or schema not found");
													callback({"error":"illegal expression, relation or schema not found"});
												}
											}/*Need to write to replace srcSchma*/

										//}
										//We need to retrieve data, based on eachStr
									}


									function processForEach(forEIndx){
										if(forEIndx>=Data[eachStr].length){
											logger("All conditions and records completed....Process For Each Action");
											if(action.for.conditions.forSingleRecord){
												doAction(indx+1);
											}else{
												processForEachConditionAction(false);
											}


										}else{
											logger(Data[eachStr].length, forEIndx);
											var currRecord = Data[eachStr][forEIndx];
											if(currRecord){
												var conditions = action.for.conditions;
												if(conditions.all){//This is to condition all
													var condCount = conditions.all.length;
													var pFECStatus = true;
													if(condCount>0){
														processForEachCondition(0);
													}else{
														logger("There no conditions for this trigger action on record no:"+forEIndx);
														if(action.for.conditions.forSingleRecord){
															processForEachConditionAction();
														}else{
															processForEach(forEIndx+1);
														}

													}


													function processForEachCondition(condInd){//For processing conditions
														if(condInd >= condCount){
															if(pFECStatus){
																logger("if all conditions are success: "+pFECStatus);
																//processForEachConditionAction();
																logger("Going to evaluate condition on the next record"+(forEIndx+1));
																if(action.for.conditions.forSingleRecord){
																	processForEachConditionAction();
																}else{
																	processForEach(forEIndx+1);
																}

															}else{
																logger("Condition might have failed for record "+forEIndx);
																if(action.for.elseAction){
																	processForEachConditionAction(true);
																}else{
																	doAction(indx+1);
																}

																//processForEach(forEIndx+1);
															}
														}else if(pFECStatus){
															var condition = conditions.all[condInd];
															logger("condition: "+condition);
															while(condition && condition.indexOf(eachStr) !=-1){
																condition=condition.replace(eachStr, "currRecord");
															}
															logger("condition after replace: "+condition);
															var exprsn = condition.split(/\s>=|\s<=|\s==|\s<|\s>|\s!=/g);


															if(exprsn[0].indexOf(".")!=-1){
																var condRec;
																if(exprsn[0].indexOf("recordId.") == 0){
																	condRec = Data[recordId];
																}else if(exprsn[0].indexOf(eachStr)!=-1){
																	condRec = Data[eachStr][forEIndx];
																}else if(exprsn[0].indexOf("currRecord")!=-1){
																	condRec = Data[eachStr][forEIndx];
																}else{
																	condRec = Data[recordId];
																}

																expEvaluator(condRec, exprsn[0], function(result){
																	while(result.indexOf("\"")!=-1){
																		result = result.replace("\"","");
																	}
																	logger("before: "+result);
																	logger("evaluated One: "+exprsn[0]+", result: "+result);
																	if(result)
																	result = !isNaN(Number(result))?Number(result):JSON.stringify(result);

																	if(result==""){
																		result="''";
																	}
																	logger("after: "+result);
																	condition = condition.replace(exprsn[0], result);
																	logger("con 1: "+condition);
																	if(exprsn[1].indexOf(eachStr)!=-1 || exprsn[1].indexOf("currRecord")!=-1){
																		expEvaluator(currRecord, exprsn[1], function(resul){
																			logger("resul");logger(resul.constructor);
																			logger(Number(resul));
																			while(resul.indexOf("\"")!=-1){
																				resul = resul.replace("\"","");
																			}
																			logger("before: "+resul);
																			resul = !isNaN(Number(resul))?Number(resul):JSON.stringify(resul);
																			logger("after: "+resul);
																			condition = condition.replace(exprsn[1], resul);
																			logger("final: "+condition+", eval: "+eval(condition));
																			if(eval(condition)){
																				pFECStatus=true;
																				logger("condition "+condition+" evaluated to true, and going to evaluate on next record");
																				processForEachCondition(condInd+1);
																			}else{
																				pFECStatus=false;
																				logger("Condition failed for the related record number: "+forEIndx+", for condition number: "+condInd," skipping current action: "+indx);
																				if(action.for.conditions.forSingleRecord){
																					processForEach(forEIndx+1);
																				}else if(action.for.elseAction){
																					processForEachConditionAction(true);
																				}else{
																					doAction(indx+1);
																				}

																			}
																		});
																	}else if(exprsn[1].indexOf("recordId")!=-1){
																		expEvaluator(Data[recordId], exprsn[1], function(resul){
																			logger("resul");logger(resul.constructor);
																			logger(Number(resul));
																			while(resul.indexOf("\"")!=-1){
																				resul = resul.replace("\"","");
																			}
																			logger("before: "+resul);
																			resul = !isNaN(Number(resul))?Number(resul):JSON.stringify(resul);
																			logger("after: "+resul);
																			condition = condition.replace(exprsn[1], resul);
																			logger("final: "+condition+", eval: "+eval(condition));
																			if(eval(condition)){
																				pFECStatus=true;
																				logger("condition "+condition+" evaluated to true, and going to evaluate on next record");
																				processForEachCondition(condInd+1);
																			}else{
																				pFECStatus=false;
																				logger("Condition failed for the related record number: "+forEIndx+", for condition number: "+condInd," skipping current action: "+indx);
																				if(action.for.elseAction){
																					processForEachConditionAction(true);
																				}else if(action.for.conditions.forSingleRecord){
																					processForEach(forEIndx+1);
																				}else{
																					doAction(indx+1);
																				}

																			}
																		});
																	}else{/*Neeed to write code for exprs[1].recordId */
																		logger("else final: "+condition+", eval: "+eval(condition));
																		if(eval(condition)){
																			pFECStatus=true;
																			logger("condition "+condition+" evaluated to true, and going to evaluate next conditoin on current record");
																			processForEachCondition(condInd+1);
																		}else{
																			pFECStatus=false;
																			logger("Condition failed for the related record number: "+forEIndx+", for condition number: "+condInd," skipping current action: "+indx);
																			if(action.for.elseAction){
																				processForEachConditionAction(true);
																			}else if(action.for.conditions.forSingleRecord){
																				processForEach(forEIndx+1);
																			}else{
																				doAction(indx+1);
																			}
																			//processForEachCondition(condInd+1);
																		}
																	}
																});
															}else{
																logger("else final1: "+condition+", eval: "+eval(condition));
																if(eval(condition)){
																	pFECStatus=true;
																	logger("condition "+condition+" evaluated to true, and going to evaluate next conditoin on current record");
																	processForEachCondition(condInd+1);
																}else{
																	pFECStatus=false;
																	logger("Condition failed1 for the related record number: "+forEIndx+", for condition number: "+condInd," skipping current action: "+indx);
																	if(action.for.elseAction){
																		processForEachConditionAction(true);
																	}else if(action.for.conditions.forSingleRecord){
																		processForEach(forEIndx+1);
																	}else{
																		doAction(indx+1);
																	}
																	//processForEachCondition(condInd+1);
																}
															}



														}else{
															logger("skipping: "+forEIndx);
															processForEach(forEIndx+1);
														}
													}

												}else if(conditions.any){//This is to condition any
													logger("Need to write code to handle any clause, currently we are just skipping n going for next action");
													doAction(indx+1);
												}
											}else{
												logger("No related record found for index: "+forEIndx);

											}
										}


											function processForEachConditionAction(isElseAction){
												logger("Entered into processing for each condition action");
												if((action.for.actions && action.for.actions.assign && !action.for.actions.assign.remoteRecord)
														|| (isElseAction && action.for.elseAction && action.for.elseAction.assign && !action.for.elseAction.assign.remoteRecord)){

													if(action.for.actions.assign.constructor==Array){//Added to support multiple assigning D:05-07-2016
														var record=Data[triggerDoc.schemas.sourceSchema];
														var assigns = isElseAction?action.for.elseAction.assign:action.for.actions.assign;
														var assignsLen = assigns.length;
														processAssigns(0);

														/*
														 * Adding code for multiple assign operations in after save
														 *
														 * */
														function processAssigns(assignInd){
															if(assignInd>=assignsLen){
																logger("Assigning operations are done.");
																Data['update'][record.recordId]=(record);
																Data[recordId]=record;
																Data[triggerDoc.schemas.sourceSchema]=record;
																if(action.for.conditions.forSingleRecord){
																	processForEach(forEIndx+1);//Going to process next (related)record
																}else{
																	doAction(indx+1);
																}

															}else{
																var assignProp = assigns[assignInd]['property'];//visibility
																var assignVal = assigns[assignInd]['value'];//author
																logger("Getting expEval");
																if(assignVal.indexOf("+")==-1){
																	expEvaluator(record, assignVal, function(val){
																		logger("assigned: "+val);
																		while(val.constructor==String && val.indexOf("\"")!=-1){
																			val = val.replace("\"","");
																		}
																		logger("assigned revised: "+val);
																		//Patch Added on D: 4th Feb, 2016
																		if(record[assignProp].constructor==Array){
																			if(val.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																				logger("Value array and property array");

																				val.forEach(function(v){
																					logger(record[assignProp].indexOf(v));
																					record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																				});

																			}else{
																				logger("Value string and property array");
																				if(record[assignProp].indexOf(val)==-1){
																					logger("Not found, so pushing");
																					record[assignProp].push(val);
																				}else{
																					logger("val exists...");
																				}

																			}

																		}else{
																			record[assignProp]=val;
																		}
																		processAssigns(assignInd+1);
																	});
																}else{
																	processComboProp(record, assignVal, function(finalVal){
																		logger("final value: "+finalVal);
																		if(record[assignProp].constructor==Array){
																			if(finalVal.constructor==Array){//Added on 22-03-2016, Not to push duplicate values
																				logger("Value array and property array");

																				finalVal.forEach(function(v){
																					logger(record[assignProp].indexOf(v));
																					record[assignProp].indexOf(v)==-1?record[assignProp].push(v):'';
																				});

																			}else{
																				logger("Value string and property array");
																				if(record[assignProp].indexOf(finalVal)==-1){
																					logger("Not found, so pushing");
																					record[assignProp].push(finalVal);
																				}else{
																					logger("val exists...");
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
														/*
														 * end of multiple assign operations in after save
														 * */
													}else if(action.for.actions.assign.evalExpression
															|| (isElseAction && action.for.elseAction.assign.evalExpression)){
														var record=Data[triggerDoc.schemas.sourceSchema];
														var prop = isElseAction?action.for.elseAction.assign.property: action.for.actions.assign.property+"";
														var val=isElseAction?action.for.elseAction.assign.evalExpression:action.for.actions.assign.evalExpression;
														var temp=evalExpression(val.expression.operator,val.expression.values, Data, forEIndx);
														logger('temp: ',temp);

														if(prop.indexOf('recordId')!=-1){
															logger("assigning");
															prop=prop.replace('recordId.', '');
															record[prop]=temp;
															Data['update'][record.recordId]=(record);
															Data[recordId]=record;
															Data[triggerDoc.schemas.sourceSchema]=record;
															logger("assigning done, going to next record: "+forEIndx);
															if(action.for.conditions.forSingleRecord){
																processForEach(forEIndx+1);
															}else{
																doAction(indx+1);
															}

														}else if(prop.indexOf('->')!=-1){
															/* This is for SpecList->hasProductCatergory.totalPrice*/
															logger("assigning on related Record");
															var srcSchm = prop.split("->")[0];
															var relation = prop.split("->")[1];
															if(relation.indexOf(".")!=-1){
																relation = relation.split(".")[0];
															}
															logger(srcSchm+" : "+relation);
															prop=prop.replace(srcSchm+'->'+relation+".", '');
															currRecord[prop]=temp;
															Data['update'][currRecord.recordId]=(currRecord);
															//Data[srcSchm+'->'+relation]=currRecord;
															logger("assigning done, going to next record: "+forEIndx);
															if(action.for.conditions.forSingleRecord){
																processForEach(forEIndx+1);
															}else{
																doAction(indx+1);
															}

														}




													}else{
														var prop = isElseAction?action.for.elseAction.assign.property:action.for.actions.assign.property+"";
														logger("Got prop: "+prop);
														logger(prop.indexOf("->"));
														if(prop.indexOf("->") == -1){
															logger("eval: "+eval("Data."+prop));
															if(eval("Data."+prop)){
																if(prop.indexOf(".")!=-1){
																	var props = prop.split(".");
																	var operatingRec = Data[props[0]][props[1]];
																	logger("operating rec: "+operatingRec);
																	var assigningVal = isElseAction?action.for.elseAction.assign.value:action.for.actions.assign.value;

																	if(eachStr == assigningVal){
																		if(operatingRec.constructor == Array){
																			operatingRec.push(Data[eachStr][forEIndx]);
																		}else{
																			operatingRec = Data[eachStr][forEIndx];
																		}
																		if(action.for.conditions.forSingleRecord){
																			processForEach(forEIndx+1);
																		}else{
																			doAction(indx+1);
																		}

																	}else if(Data[assigningVal]){
																		if(operatingRec.constructor == Array){
																			operatingRec.push(Data[assigningVal][forEIndx]);
																		}else{
																			operatingRec = Data[assigningVal][forEIndx];
																		}
																		if(action.for.conditions.forSingleRecord){
																			processForEach(forEIndx+1);
																		}else{
																			doAction(indx+1);
																		}

																	}

																}
															}else if(prop.indexOf("recordId.") !== -1){
																prop=prop.split("recordId.")[1];

																var assigningVal = isElseAction?action.for.elseAction.assign.value:action.for.actions.assign.value;
																if(assigningVal.indexOf(eachStr) != -1){
																	assigningVal = assigningVal.replace(eachStr+".", "");
																	Data[recordId][prop]=Data[eachStr][forEIndx][assigningVal];
																	console.log(Data[eachStr][forEIndx][assigningVal]," assigningVal "+assigningVal);
																}else{
																	Data[recordId][prop]=assigningVal;
																}
																var upRecId = Data[recordId]['recordId'];

																if(Data['update'][upRecId]){
																	Object.keys(Data[recordId]).forEach(function(uKey){
																		Data['update'][upRecId][uKey]= Data[recordId][uKey];
																	});
																}else{
																	Data['update'][upRecId]=(Data[recordId]);
																}

																if(action.for.conditions.forSingleRecord){
																	processForEach(forEIndx+1);
																}else{
																	doAction(indx+1);
																}
															}else{
																console.log("else safe");

																if(action.for.conditions.forSingleRecord){
																	processForEach(forEIndx+1);
																}else{
																	doAction(indx+1);
																}
															}
														}else{
															logger("assigning on related Record");
															var srcSchm = prop.split("->")[0];
															var relation = prop.split("->")[1];
															if(relation.indexOf(".")!=-1){
																relation = relation.split(".")[0];
															}
															logger(srcSchm+" : "+relation);
															prop=prop.replace(srcSchm+'->'+relation+".", '');
															currRecord[prop]=isElseAction?action.for.elseAction.assign.value:action.for.actions.assign.value;
															Data['update'][currRecord.recordId]=(currRecord);
															Data[srcSchm+'->'+relation][forEIndx]=currRecord;
															logger("assigning done, going to next record: "+forEIndx);
															if(action.for.conditions.forSingleRecord){
																processForEach(forEIndx+1);
															}else{
																doAction(indx+1);
															}
														}
													}


												}else if(action.for.actions && action.for.actions.assign && action.for.actions.assign.remoteRecord
														|| (isElseAction && action.for.elseAction && action.for.elseAction.assign && action.for.elseAction.assign.remoteRecord)){
													logger("Entered into processing for each condition action for remote record ");
													var remoteRecordId=action.for.actions.assign.remoteRecord;
													remoteRecordId = remoteRecordId.replace(eachStr, "currRecord");
													remoteRecordId = eval(remoteRecordId);

													logger("Remote Record Id: "+remoteRecordId);
													CouchBaseUtil.getDocumentByIdFromContentBucket(remoteRecordId, function(remoteRecord){
														if(remoteRecord.value){
															if(Data['update'][remoteRecordId]){
																remoteRecord = Data['update'][remoteRecordId];
															}else{
																remoteRecord = remoteRecord.value;
															}
															logger("Got Remote Record: "+remoteRecord.recordId);


															var prop = action.for.actions.assign.property;
															//Code added for Some more generic functionality,
															var val=action.for.actions.assign.value;
															if(val.indexOf("recordId")==-1){
																val=action.for.actions.assign.value;
															}else{
																val=val.replace("recordId", "Data["+recordId+"]");
																val=eval(val);
															}
															if(remoteRecord[prop].constructor==Array){
																remoteRecord[prop].push(val);
															}else if(remoteRecord[prop]){
																remoteRecord[prop]=(val);
															}else{
																remoteRecord[prop]=(val);
																logger("Remote record property updated.");
															}
															Data['update'][remoteRecord.recordId]=(remoteRecord);
															logger("Going to process next record: "+(forEIndx+1));
															if(action.for.conditions.forSingleRecord){
																processForEach(forEIndx+1);
															}else{
																doAction(indx+1);
															}


														}else{
															logger("Record not found");
															logger("Going to process next record: "+(forEIndx+1));
															if(action.for.conditions.forSingleRecord){
																processForEach(forEIndx+1);
															}else{
																doAction(indx+1);
															}

														}

													});




												}else if(action.for.actions && action.for.actions.create
														|| (isElseAction && action.for.elseAction && action.for.elseAction.create)){


													var hostname;
													if(request && request.headers && request.headers.host && request.headers.host.split(":")){
														hostname=request.headers.host.split(":")[0];
													}
													var cloudPointHostId;
													if(hostname && ContentServer.getConfigDetails(hostname)){
														cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
													}

													utility.getMainSchema({schema: (isElseAction ? action.for.elseAction.create:
														action.for.actions.create.record),cloudPointHostId:cloudPointHostId},function(schema){
														if(schema.error){callback({error:data.docType+" not exists"});return;}
														logger('schema');
														var newRecord = {};
														if(schema['@properties']){
															var props = Object.keys(schema['@properties']);
															//setting system properties
															newRecord['docType']=schema['@id'];
															newRecord['cloudPointHostId']=cloudPointHostId;
															newRecord['org']=org;
															newRecord['recordId']=schema['@id']+""+global.guid();
															newRecord['author']=userId;
															newRecord['editor']=userId;
															newRecord['revision']=1;
															newRecord['dateCreated']=global.getDate();
															newRecord['dateModified']=global.getDate();

															//setting other properties
															setProp(0);
															function setProp(index){
																if(index>=props.length){//if all done
																	//ResultData = record;
																	logger("next doAction: "+indx);
																	Data[newRecord['recordId']]=newRecord;
																	Data[schema['@id']]=newRecord;
																	Data['create'][newRecord.recordId]=(newRecord);
																	newRecord={};
																	logger("processForEach: "+forEIndx);
																	if(action.for.conditions.forSingleRecord){
																		processForEach(forEIndx+1);
																	}else{
																		doAction(indx+1);
																	}

																}else{
																	if(props[index]!= "requiredKeys"){
																		var PropdataType="";
																		if(schema['@properties'][props[index]]){
																			PropdataType=schema['@properties'][props[index]].dataType.type;
																		}else if(schema['@sysProperties'][props[index]]){
																			PropdataType=schema['@sysProperties'][props[index]].dataType.type;
																		}
																		var recProps = action.for.actions.create.props;
																		var recKeys = Object.keys(recProps);
																		if(recProps[props[index]]){
																			if(!isNaN(recProps[props[index]])){
																				newRecord[props[index]] = recProps[props[index]];
																				setProp(index+1);
																			}else if(recProps[props[index]].indexOf("recordId") ==0){
																				newRecord[props[index]] = recordId;
																				setProp(index+1);
																			}else if(recProps[props[index]].indexOf("recordId.") ==0){//recordId.Manufacturer
																				if((recProps[props[index]]).split(".").length==2){
																					newRecord[props[index]] = eval(recProps[props[index]].replace("recordId", "Data['"+recordId+"']"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length==1){
																					newRecord[props[index]] = recordId;
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length>2){
																					expEvaluator(Data[recordId], recProps[props[index]], function(res){
																						newRecord[props[index]] = res;
																						setProp(index+1);
																					});
																				}
																			}else if(recProps[props[index]].indexOf("store")==0){//recordId.Manufacturer
																				if((recProps[props[index]]).split(".").length==1){
																					newRecord[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length>=2){
																					logger(Data['store']);
																					expEvaluator({recordId: Data['store']}, recProps[props[index]], function(res){
																						newRecord[props[index]] = res;
																						setProp(index+1);
																					});
																				}

																			}else if(recProps[props[index]].indexOf("Schema@")==0 ){//Schema@SpecListProductCategory.recordId
																				if((recProps[props[index]]).split(".").length==2){
																					var schma= (recProps[props[index]]).split(".")[0];
																					schma=schma.split("@")[1];

																					newRecord[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length==1){
																					newRecord[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length>2){
																					var schma= (recProps[props[index]]).split(".")[0];
																					schma=schma.split("@")[1];
																					expEvaluator(Data[schma], recProps[props[index]], function(res){
																						//logger("res",res);
																						newRecord[props[index]] = res;
																						setProp(index+1);
																					});
																				}
																			}else if(recProps[props[index]].indexOf("targetRecordId")==0 ){//targetRecordId.recordId

																				if((recProps[props[index]]).split(".").length==2){
																					newRecord[props[index]] = eval(recProps[props[index]].replace("targetRecordId", "Data['targetRecordId']"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length==1){
																					newRecord[props[index]] = recordId;
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length>2){
																					expEvaluator(onTheFlyTriggerDoc, recProps[props[index]], function(res){
																						//logger("res",res);
																						newRecord[props[index]] = res;
																						setProp(index+1);
																					});
																				}


																			}else if(recProps[props[index]].indexOf("tgData.recordData")==0 ){//tgData.recordData.name

																				if((recProps[props[index]]).split(".").length==2){
																					newRecord[props[index]] = eval(recProps[props[index]].replace("tgData.recordData", "onTheFlyTriggerDoc"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length==1){
																					newRecord[props[index]] = recordId;
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length>2){
																					expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace("tgData.recordData", "onTheFlyTriggerDoc"), function(res){
																						//logger("res",res);
																						newRecord[props[index]] = res;
																						setProp(index+1);
																					});
																				}


																			}else if(recProps[props[index]].indexOf(action.for.Each) == 0){
																				logger("related record processing");
																				if((recProps[props[index]]).split(".").length==2){
																					newRecord[props[index]] = eval(recProps[props[index]].replace(action.for.Each, "currRecord"));
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length==1){
																					newRecord[props[index]] = recordId;
																					setProp(index+1);
																				}else if((recProps[props[index]]).split(".").length>2){
																					expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace(action.for.Each, "currRecord"), function(res){
																						//logger("res",res);
																						newRecord[props[index]] = res;
																						setProp(index+1);
																					});
																				}
																			}else{
																				newRecord[props[index]] = recProps[props[index]];
																				setProp(index+1);
																			}

																		/**
																		 * assigning respective default values
																		 *  Array= ["multiPickList","array","image","images","attachment","attachments","privateVideo","privateVideos","dndImage","tags"]
																		 *	Objects=["struct","geoLocation","userDefinedFields","richText"]
																		 *	boolean
																		 *	number
																		 */
																		}else if(["multiPickList","array","image","images","attachment","attachments","privateVideo","privateVideos","dndImage","tags"].indexOf(PropdataType)!=-1){
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


												}else if(action.for.actions && action.for.actions.increment
														|| (isElseAction && action.for.elseAction && action.for.elseAction.increment)){
													var increment=action.for.actions.increment;

													if(increment.junctionRecord){
														var data={};
														var source=increment.junctionRecord.source;
														var relation=increment.junctionRecord.relation;
														var target=increment.junctionRecord.target;
														/*Evaluating source*/
														logger(source);
														if(source.indexOf(eachStr)!=-1){
															logger(source);
															source=source.replace(eachStr, "currRecord");
															logger(source);
															source=eval(source);
															logger(source);
														}else if(source.indexOf(".")!=-1){
															var srcs=source.split(".");
															if(eval("container['"+srcs[0]+"']").constructor!=Array){
																source=eval("container['"+srcs[0]+"']."+srcs[1]);

															}else{
																logger("Need to retrieve.");
															}
														}


														/*Evaluating target*/
														if(target.indexOf(eachStr)!=-1){
															target=target.replace(eachStr, "currRecord");
															target=eval(target);
															logger(target);
														}else if(target.indexOf(".")!=-1){
															var srcs=target.split(".");
															if(eval("container['"+srcs[0]+"']")){
																target=eval("container['"+srcs[0]+"']."+srcs[1]);

															}else{
																logger("Need to retrieve target by ....");
															}
														}


														data['source']=source;
														data['relationName']=relation;
														data['target']=target;
														data['fromTrigger']=true;
														logger(data);
														GenericRelatedRecordsServer.getRelatedRecordId(data, function(res){
															if(res.error){
																callback({error:"No record found for this Organization and Item"});
															}else{
																CouchBaseUtil.getDocumentByIdFromContentBucket(res.id, function(junctionRecord){
																	junctionRecord=junctionRecord.value;
																	var property=increment.property;
																	var value=increment.value;
																	if(value.indexOf(eachStr)!=-1){
																		logger("value has eachstr: "+value);
																		value=value.replace(eachStr, "currRecord");
																		logger(value);
																		value=eval(value);
																		logger(value);
																	}
																	if(value.indexOf(".")!=-1){
																		var srcs=value.split(".");
																		if(eval("container['"+srcs[0]+"']")){
																			value=eval("container['"+srcs[0]+"']."+srcs[1]);

																		}else{
																			logger("Need to retrieve target by ....");
																		}
																	}

																	junctionRecord[property]=parseFloat(junctionRecord[property])+parseFloat(value);
																	Data['update'][junctionRecord.recordId]=(junctionRecord);
																	logger("junction record value updated, processForEach: "+forEIndx);
																	if(action.for.conditions.forSingleRecord){
																		processForEach(forEIndx+1);
																	}else{
																		doAction(indx+1);
																	}

																})
															}
														});
													}else{
														logger("actions.for.actions.increment ")
													}
												}//increment
												else if(action.for.actions && action.for.actions.createMultiple
														|| (isElseAction && action.for.elseAction && action.for.elseAction.createMultiple)){
													var crArrayJson = isElseAction ? action.for.elseAction.createMultiple: action.for.actions.createMultiple;
													//triggerToCopyArea1
													logger("CreateMultiple: ", crArrayJson);

													createMultiple(0, crArrayJson, function(){
														callback();
													});



												}
											}


											function createMultiple(index, crArrayJson, callback){
												logger("CreateMultiple: "+index);
												if(index<crArrayJson.length){
													createNSetProps(crArrayJson[index], function(newRec){
														if(crsJson.callback){
															//start here
														}else{
															createMultiple(index+1, crArrayJson, callback);
														}

													});
												}else{
													callback();
												}
											}

											function createNSetProps(crJson, callback){
												var hostname
												if(request && request.headers && request.headers.host && request.headers.host.split(":"))
													hostname=request.headers.host.split(":")[0];
												var cloudPointHostId;
												if(hostname && ContentServer.getConfigDetails(hostname))
													cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;

												utility.getMainSchema({schema:crJson.record,cloudPointHostId:cloudPointHostId},function(schema){
													if(schema.error){callback({error:data.docType+" not exists"});return;}
													logger('schema');
													var newRecord = {};
													if(schema['@properties']){
														var props = Object.keys(schema['@properties']);
														//logger(props);
														//setting system properties
														newRecord['docType']=schema['@id'];
														newRecord['cloudPointHostId']=cloudPointHostId;

														newRecord['recordId']=schema['@id']+""+global.guid();
														newRecord['author']=userId;
														newRecord['editor']=userId;
														newRecord['revision']=1;
														newRecord['dateCreated']=global.getDate();
														newRecord['dateModified']=global.getDate();
														newRecord['org']=Data['org'];
														setProp(0);

														function setProp(index){
															if(index>=props.length){
																//logger(record);
																//ResultData = record;
																//logger("next doAction: "+indx);
																if(crJson.props){
																	var recProps = crJson.props;
																	var recKeys = Object.keys(recProps);
																	for(var rpI=0; rpI<recKeys.length; rpI++){
																		if(typeof recProps[recKeys[rpI]] == "string"){

																			if(recProps[recKeys[rpI]].indexOf("recordId.")!=-1){//recordId.Manufacturer
																				if((recProps[recKeys[rpI]]).split(".").length==2){
																					newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("recordId", "Data['"+recordId+"']"));
																				}else if((recProps[recKeys[rpI]]).split(".").length==1){

																				}
																			}
																			if(recProps[recKeys[rpI]].indexOf("store")!=-1){//recordId.Manufacturer
																				if((recProps[recKeys[rpI]]).split(".").length==2){
																					//newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("store", "Data['store']"));
																				}else if((recProps[recKeys[rpI]]).split(".").length==1){
																					newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("store", "Data['store']"));
																				}
																			}
																			if(recProps[recKeys[rpI]].indexOf("Schema@")!=-1 ){//Schema@SpecListProductCategory.recordId
																				if((recProps[recKeys[rpI]]).split(".").length==2){
																					var schma= (recProps[recKeys[rpI]]).split(".")[0];
																					schma=schma.split("@")[1];

																					newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("Schema@"+schma, "Data['"+schma+"']"));
																				}else if((recProps[recKeys[rpI]]).split(".").length==1){

																				}
																			}

																			if(recProps[recKeys[rpI]].indexOf("targetRecordId")!=-1 ){//targetRecordId.recordId
																				if((recProps[recKeys[rpI]]).split(".").length==2)
																				newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("targetRecordId", "Data['targetRecordId']"));
																			}

																			if(recProps[recKeys[rpI]].indexOf("tgData.recordData")!=-1 ){//tgData.recordData.name
																				if((recProps[recKeys[rpI]]).split(".").length==2)
																				newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("tgData.recordData", "onTheFlyTriggerDoc"));
																			}

																		}else{
																			logger("assigning current : "+recKeys[rpI]);
																			newRecord[recKeys[rpI]] = recProps[recKeys[rpI]];
																		}
																	}
																}
																Data[newRecord['recordId']]=newRecord;
																Data[schema['@id']]=newRecord;
																Data['create'][newRecord.recordId]=(newRecord);
																newRecord={};
																callback(Data['create'][newRecord.recordId]);
																//processForEach(forEIndx+1);
															}else{

																/* start here*/
																if(props[index]!= "requiredKeys"){
																	//logger(schema['@properties'][props[index]].dataType.type);
																	var recProps = crJson.props;
																	var recKeys = Object.keys(recProps);
																	if(recProps[props[index]]){
																		if(!isNaN(recProps[props[index]])){
																			newRecord[props[index]] = recProps[props[index]];
																			setProp(index+1);
																		}else if(recProps[props[index]].indexOf("recordId.") ==0){//recordId.Manufacturer
																			if((recProps[props[index]]).split(".").length==2){
																				newRecord[props[index]] = eval(recProps[props[index]].replace("recordId", "Data['"+recordId+"']"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length==1){
																				newRecord[props[index]] = recordId;
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length>2){
																				expEvaluator(Data[recordId], recProps[props[index]], function(res){
																					//logger("res",res);
																					newRecord[props[index]] = res;
																					setProp(index+1);
																				});
																			}
																		}else if(recProps[props[index]].indexOf("store")==0){//recordId.Manufacturer
																			/*if((recProps[props[index]]).split(".").length==2){
																				newRecord[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
																				setProp(index+1);
																			}else */if((recProps[props[index]]).split(".").length==1){
																				newRecord[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length>=2){
																				logger(Data['store']);
																				expEvaluator({recordId: Data['store']}, recProps[props[index]], function(res){
																					//logger("res",res);
																					newRecord[props[index]] = res;
																					setProp(index+1);
																				});
																			}

																		}else if(recProps[props[index]].indexOf("Schema@")==0 ){//Schema@SpecListProductCategory.recordId
																			if((recProps[props[index]]).split(".").length==2){
																				var schma= (recProps[props[index]]).split(".")[0];
																				schma=schma.split("@")[1];

																				newRecord[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length==1){
																				newRecord[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length>2){
																				var schma= (recProps[props[index]]).split(".")[0];
																				schma=schma.split("@")[1];
																				expEvaluator(Data[schma], recProps[props[index]], function(res){
																					//logger("res",res);
																					newRecord[props[index]] = res;
																					setProp(index+1);
																				});
																			}
																		}else if(recProps[props[index]].indexOf("targetRecordId")==0 ){//targetRecordId.recordId

																			if((recProps[props[index]]).split(".").length==2){
																				newRecord[props[index]] = eval(recProps[props[index]].replace("targetRecordId", "Data['targetRecordId']"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length==1){
																				newRecord[props[index]] = recordId;
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length>2){
																				expEvaluator(onTheFlyTriggerDoc, recProps[props[index]], function(res){
																					//logger("res",res);
																					newRecord[props[index]] = res;
																					setProp(index+1);
																				});
																			}


																		}else if(recProps[props[index]].indexOf("tgData.recordData")==0 ){//tgData.recordData.name

																			if((recProps[props[index]]).split(".").length==2){
																				newRecord[props[index]] = eval(recProps[props[index]].replace("tgData.recordData", "onTheFlyTriggerDoc"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length==1){
																				newRecord[props[index]] = recordId;
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length>2){
																				expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace("tgData.recordData", "onTheFlyTriggerDoc"), function(res){
																					//logger("res",res);
																					newRecord[props[index]] = res;
																					setProp(index+1);
																				});
																			}


																		}else if(recProps[props[index]].indexOf(action.for.Each) == 0){

																			if((recProps[props[index]]).split(".").length==2){
																				newRecord[props[index]] = eval(recProps[props[index]].replace(action.for.Each, "currRecord"));
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length==1){
																				newRecord[props[index]] = recordId;
																				setProp(index+1);
																			}else if((recProps[props[index]]).split(".").length>2){
																				expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace(action.for.Each, "currRecord"), function(res){
																					//logger("res",res);
																					newRecord[props[index]] = res;
																					setProp(index+1);
																				});
																			}



																		}else{
																			newRecord[props[index]] = recProps[props[index]];
																			setProp(index+1);
																		}




																	}else if(schema['@properties'][props[index]].dataType.type=="object"){
																		newRecord[props[index]]="";
																		setProp(index+1);
																	}else{
																		logger("else",props[index]);
																		newRecord[props[index]]=undefined;
																		setProp(index+1);
																	}
																}else{
																	logger("");
																	setProp(index+1);
																}
															}

														}

													}else{
														logger("Properties not found for the schema");
														callback();
													}
												});
											}

									}//processForEach(forEIndx)
								}


							}else if(indx>=triggerDoc.orderOfProcessing.length){////if All Actions are done
								logger("Actions completed, we are at finishing level of trigger");
								onTriggerFinish(function(res){
										console.log("Returning from trigger "+ResultData['targetContext']);

										if(triggerDoc.onFinishTrigger){
											var triggerDocId=triggerDoc.onFinishTrigger.triggerDocId;

											if(triggerDoc.onFinishTrigger.recordId.indexOf('recordId')!=-1){
												expEvaluator(Data[recordId], triggerDoc.onFinishTrigger.recordId, function(result){
													logger("RecordId :"+result);
													while(result.indexOf("\"")!=-1){
														result = result.replace("\"","");
													}
													logger(savedDocs.length, Object.keys(Data['create']).length, Object.keys(Data['update']).length);
													if(savedDocs.length== (Object.keys(Data['create']).length+ Object.keys(Data['update']).length)){
														console.log("Trigger Chain Started.........");
														logger(savedDocs.length, Object.keys(Data['create']).length, Object.keys(Data['update']).length);
														var killInterval = setTimeout(function(){
															logger(savedDocs.length, Object.keys(Data['create']).length, Object.keys(Data['update']).length);
															if(savedDocs.length== (Object.keys(Data['create']).length+ Object.keys(Data['update']).length)){
																console.log("Trigger Chain Starting From SetTimeout.........");
																processTriggerNew(triggerDocId, result, userId, org, callback,request);
																clearTimeout(killInterval);
															}
														}, 10);
													}

												});
											}


										}else{
											console.log("All Triggers Completed.....");
											if(!ResultData['targetContext']){
												ResultData['targetContext']="detailView";
											}
											if(res.constructor == Object)
											Object.keys(res).forEach(function(k){
												logger(k+":"+res[k]);
												ResultData[k]=res[k];
											});
											Data['callback'](ResultData);
										}






									});
								}
							}

						function onTriggerFinish(callbk){
							logger(Data['create']);
							savedDocs=[];
							var createdRecs = Object.keys(Data['create']);
							var recsLen;
							if(Object.keys(Data['create']).length>0 || Object.keys(Data['update']).length>0){
								recsLen = createdRecs.length;//Need to save created records
								saveRecord(0);
							}else{
								if(triggerDoc.response){
									callbk(triggerDoc.response);
								}else{
									callbk({success:"trigger execution finished"});
								}
							}


							function saveRecord(saveInd){
								if(saveInd>=recsLen){
									logger("Trigger Execution Finished.....");

									if(Object.keys(Data['update']).length>0){
										createdRecs = Object.keys(Data['update']);
										recsLen = createdRecs.length;//Need to save created records
										updateRecords(0);
									}else{
										if(triggerDoc.response){
											callbk(triggerDoc.response);
										}
									}
								}else{
									var saveRec = Data['create'][createdRecs[saveInd]];
									GenericRecordServer.saveRecord({body:saveRec, fromTrigger: true}, function(res){
										if(res){
											savedDocs.push(res);
											saveRecord(saveInd+1);
										}else{
											logger("error : error while saving created doc, line num 621");logger(res);
											callbk({"error":"error while saving created doc"});
										}
									},request);
								}
							}

							function updateRecords(updateInd){
								if(updateInd>=recsLen){
									logger("Trigger Execution Finished.....");
									callbk(savedDocs[0]);
								}else{
									var saveRec = Data['update'][createdRecs[updateInd]];
									saveRec['dateModified']=global.getDate();
									saveRec['revision']=parseInt(saveRec['revision'])+1;
									saveRec['editor']=userId;
									CouchBaseUtil.upsertDocumentInContentBucket(saveRec.recordId, saveRec, function(res){
										if(res){
											try{
												require('./socket.io.js').alertRoom(saveRec.recordId,{schema:saveRec.docType});
											}catch(err){}
											savedDocs.push(res);
											updateRecords(updateInd+1);
										}else{
											logger("error : error while saving created doc, line num 621");logger(res);
											callbk({"error":"error while saving created doc"});
										}
									});
								}
							}

						}

					});
				}
			}else{//No trigger doc
				callback({error: "Trigger Document Not found"});
			}
		});
	} catch (e) {
		logger(e);
		if(Data['callback']){
			Data['callback']({error: "Something went wrong"});
		}
	}








	function processElse(elseJson, callback){
		if(elseJson.hasOwnProperty("createMultiple")){
			logger("CreateMultiple: ", elseJson);
			createMultiple(0, elseJson.createMultiple, function(){
				callback();
			});
		}

		if(elseJson.hasOwnProperty("create")){
			createNSetProps(elseJson.create, function(){
				callback();
			});
		}

	}

	function createMultiple(index, crsJson, callback){
		logger("CreateMultiple: "+index);
		if(index<crsJson.length){
			createNSetProps(crsJson[index], function(){
				createMultiple(index+1, crsJson, callback);
			});
		}else{
			callback();
		}
	}


	function createNSetProps(crJson, callback){
		var hostname
		if(request && request.headers && request.headers.host && request.headers.host.split(":"))
			hostname=request.headers.host.split(":")[0];
		var cloudPointHostId;
		if(hostname && ContentServer.getConfigDetails(hostname))
			cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;

		utility.getMainSchema({schema:crJson.record,cloudPointHostId:cloudPointHostId},function(schema){
			if(schema.error){callback({error:data.docType+" not exists"});return;}
			logger('schema');
			var newRecord = {};
			schema['@properties']["$status"]={
					description:"Status",
					displayName:"Status",
					dataType:{
						type:"text"
					}
			};
			if(schema['@properties']){
				var props = Object.keys(schema['@properties']);
				logger(props);
				//setting system properties
				newRecord['docType']=schema['@id'];
				newRecord['cloudPointHostId']=cloudPointHostId;

				newRecord['recordId']=schema['@id']+""+global.guid();
				newRecord['author']=userId;
				newRecord['editor']=userId;
				newRecord['revision']=1;
				newRecord['dateCreated']=global.getDate();
				newRecord['dateModified']=global.getDate();
				newRecord['org']=Data['org'];
				setProp(0);

				function setProp(index){
					if(index>=props.length){
						//logger(record);
						//ResultData = record;
						//logger("next doAction: "+indx);
						if(crJson.props){
							var recProps = crJson.props;
							var recKeys = Object.keys(recProps);
							for(var rpI=0; rpI<recKeys.length; rpI++){
								//if(props.indexOf(recKeys[rpI])==-1){
								if(typeof recProps[recKeys[rpI]] == "string"){
									if(recProps[recKeys[rpI]].indexOf("recordId.")!=-1){//recordId.Manufacturer
										if((recProps[recKeys[rpI]]).split(".").length==2){
											newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("recordId", "Data['"+recordId+"']"));
										}else if((recProps[recKeys[rpI]]).split(".").length==1){

										}
									}
									if(recProps[recKeys[rpI]].indexOf("store")!=-1){//recordId.Manufacturer
										if((recProps[recKeys[rpI]]).split(".").length==2){
											newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("recordId", "Data['"+recordId+"']"));
										}else if((recProps[recKeys[rpI]]).split(".").length==1){
											newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("store", "Data['store']"));
										}
									}
									if(recProps[recKeys[rpI]].indexOf("Schema@")!=-1 ){//Schema@SpecListProductCategory.recordId
										if((recProps[recKeys[rpI]]).split(".").length==2){
											var schma= (recProps[recKeys[rpI]]).split(".")[0];
											schma=schma.split("@")[1];

											newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("Schema@"+schma, "Data['"+schma+"']"));
										}else if((recProps[recKeys[rpI]]).split(".").length==1){
											var schma= (recProps[recKeys[rpI]]).split(".")[0];
											schma=schma.split("@")[1];

											newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("Schema@"+schma, "Data['"+schma+"']"));
										}
									}

									if(recProps[recKeys[rpI]].indexOf("targetRecordId")!=-1 ){//targetRecordId.recordId
										newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("targetRecordId", "Data['targetRecordId']"));
									}

									if(recProps[recKeys[rpI]].indexOf("tgData")!=-1 ){//tgData.recordData.name
										newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("tgData", "onTheFlyTriggerDoc"));
									}

								}else{
									logger("assigning current : "+recProps[recKeys[rpI]]);
									newRecord[recKeys[rpI]] = recProps[recKeys[rpI]];
								}
							}
						}
						Data[newRecord['recordId']]=newRecord;
						Data[schema['@id']]=newRecord;
						Data['create'][newRecord.recordId]=(newRecord);
						newRecord={};
						callback();
						//processForEach(forEIndx+1);
					}else{
						if(props[index]!= "requiredKeys"){
							logger([props[index]], schema['@properties'][props[index]].dataType);

							var recProps = crJson.props;
							var recKeys = Object.keys(recProps);
							if(recProps[props[index]] ){
								//if(recKeys.indexOf(props[index]) !=-1){
								logger("It is in assigning properties");
								if(!isNaN(recProps[props[index]])){
									newRecord[props[index]] = recProps[props[index]];
									setProp(index+1);
								}else if(crJson.props[props[index]] && crJson.props[props[index]].indexOf("recordId.")!=-1){//recordId.Manufacturer
									logger("Going to eval from setProp ",crJson.props[props[index]]);

									expEvaluator(Data[recordId], crJson.props[props[index]], function(result){
										logger(result);
										newRecord[props[index]]=result;
										setProp(index+1);
									});

									/*if((recProps[recKeys[rpI]]).split(".").length==2){
										newRecord[recKeys[rpI]] = eval(recProps[recKeys[rpI]].replace("recordId", "Data['"+recordId+"']"));
									}else if((recProps[recKeys[rpI]]).split(".").length==1){

									}*/
								}else if(crJson.props[props[index]] && crJson.props[props[index]].indexOf("store")!=-1){//recordId.Manufacturer
									if((crJson.props[props[index]]).split(".").length==2){
										newRecord[props[index]] = eval(crJson.props[props[index]].replace("recordId", "Data['"+recordId+"']"));
									}else if((crJson.props[props[index]]).split(".").length==1){
										newRecord[props[index]] = eval(crJson.props[props[index]].replace("store", "Data['store']"));
									}
									setProp(index+1);
								}else if(crJson.props[props[index]] && crJson.props[props[index]].indexOf("Schema@")!=-1 ){//Schema@SpecListProductCategory.recordId
									if((crJson.props[props[index]]).split(".").length==2){
										var schma= (crJson.props[props[index]]).split(".")[0];
										schma=schma.split("@")[1];

										newRecord[props[index]] = eval(crJson.props[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
									}else if((crJson.props[props[index]]).split(".").length==1){
										var schma= (crJson.props[props[index]]).split(".")[0];
										schma=schma.split("@")[1];

										newRecord[props[index]] = eval(crJson.props[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
									}
									setProp(index+1);
								}else{
									newRecord[props[index]]=crJson.props[props[index]];
									setProp(index+1);
								}


							}else if(schema['@properties'][props[index]].dataType.type=="object"){
								newRecord[props[index]]="";
								setProp(index+1);
							}else{
								newRecord[props[index]]=undefined;
								setProp(index+1);
							}


						}else{
							setProp(index+1);
						}
					}

				}

			}
		});
	}


}

/**
 * For evaluating the expression
 *
 */

function evalExpression(operator,values, Data, forEIndx){
	if(Array.isArray(values) && values.length==2 && operator){
		var newVal=[];
		values.forEach(function(value){
			logger(value);
			if(typeof value=="object" && value.expression){
				newVal.push(evalExpression(value.expression.operator,value.expression.values));
			}else{
				if(value.indexOf("recordId")!=-1){
					value = value.replace("recordId", "");
					logger("recordId--",value);
					expEvaluator(Data[Data.recordId], value, function(expRes){
						logger("expRes--"+expRes);
						newVal.push(expRes);
					})
				}else if(value.indexOf("->")!=-1){
					var srcSchm = value.split("->")[0];
					var relation = value.split("->")[1];
					if(relation.indexOf(".")!=-1){
						relation = relation.split(".")[0];
					}
					logger(value.split(".")[1]);
					value = value.replace(srcSchm+"->"+relation, "Data['"+srcSchm+"->"+relation+"']["+forEIndx+"]");
					logger("-> --",value);
					newVal.push(eval(value));

				}else{
					newVal.push(value)
				}


			}
		})
		logger(newVal[0],newVal[1]);
		var temp=(newVal[0]+operator+newVal[1]);
		return(eval(temp));

	}
}


/**
 * @author saikiran
 * Below is to get the value from the given string
 *
 *
 * Cart->hasProduct.Product.quantity
 * record.Product.quantity
 * */
function expEvaluator(context, exp, callback){//exp = User.socialIdentity.facebook
	logger("start of expEval: "+exp);

	if(context && context.constructor == Object && exp && exp.indexOf('.')!=-1){
		var result='';
		var exp = exp.split(".");

		if(exp.length>1){
			processExp(context, exp.join("."), 1, function(res){
				logger("expression evaluation is done: "+res);
				if(typeof res=="string" && res!=null && res.trim()!="null" && res.trim()!="error"){
					if(res)
					res=res.replace(/\"/g, "");

					callback(res);
				}else{
					callback(res);// sai kiran modified for array
				}


			});
		}
	}else{
		callback(context[exp]);
	}
}
exports.expEvaluator=expEvaluator;

exports.processExp = processExp;


function processExp(context, expstring, expInd, callback){
	try {
		//logger("Exp: ",exp);
		//logger("ExpInd: ", expInd);
		var exp = expstring.split(".");
		if(expInd>=exp.length){
			//logger("Before return: "+context);
			callback(context);
		}else{
			//logger("in: "+expInd);
			//logger(context);
			//logger("context", context, exp);
			if(!context[exp[expInd]]){
				context[exp[expInd]]
			}
			if(typeof context[exp[expInd]] == undefined || context[exp[expInd]]==null){
				callback('');
			}else if( context[exp[expInd]]['constructor'] == String){
				//logger(context[exp[expInd]]);
				if(expInd == exp.length-1){
					context = JSON.stringify(context[exp[expInd]]);
					processExp(context, exp.join("."), expInd+1, callback);
				}else{
					CouchBaseUtil.getDocumentByIdFromContentBucket(context[exp[expInd]], function(res){
						if(!res.error){
							context = res.value;
							logger("Got record from exp eval: "+context);
							processExp(context, exp.join("."), expInd+1, callback);
						}else{
							logger("There is something wrong with expression: "+(exp.join("."))+" while looking into "+exp[expInd]);
							//callback({"error":"there is something wrong with expression: "+(exp.join("."))+" while looking into "+exp[expInd]});
							callback("error");
						}
					});
				}
			}else if(context[exp[expInd]]['constructor'] == Object){
				context = context[exp[expInd]];
				if(context){
					processExp(context, exp.join("."), expInd+1, callback);
				}

			}else if(context[exp[expInd]]['constructor'] == Array){
				if(expInd == exp.length-1){
					callback(context[exp[expInd]]);
				}else{
					var Result=[];
					processArrayIndex(0);
					function processArrayIndex(lindex){
						if(lindex>=context[exp[expInd]].length){
							callback(Result);
							return;
						}
						CouchBaseUtil.getDocumentByIdFromContentBucket(context[exp[expInd]][lindex], function(res){
							if(!res.error){
								processExp(res.value, exp.join("."), expInd+1, function(ares){
									Result.push(JSON.parse(ares));
									processArrayIndex(lindex+1);
								});
							}else{
								processArrayIndex(lindex+1)
							}
						});
					}
				}


				//logger("Array");
				//logger(exp);
				//logger(expInd);
				//logger(context);
				/*if(expInd == exp.length-1){
					logger("array");
					logger(context[exp[expInd]]);
					context = (context[exp[expInd]]);
					processExp(context, exp.join("."), expInd+1, callback);
				}else{
					callback(context[exp[expInd]]);
				}*/
				/*
				context = context[exp[expInd]];
				var total=0;
				var rec=(context[0]);
				if(rec.constructor!=Object){
					callback(context[exp[expInd]]);

				}else{
					context.forEach(function(rowObj){
						if(rowObj[exp[expInd+1]]){
							if(!isNaN(parseFloat(rowObj[exp[expInd+1]]))){
								total+=parseFloat(rowObj[exp[expInd+1]]);
							}
							logger("total: "+total);
						}
					});
					if(total){
						callback(total);
					}else{
						callback(context);
					}

				}*/


			}else if(context[exp[expInd]]['constructor'] == Number ||context[exp[expInd]]['constructor'] == Boolean){
				context=JSON.stringify(context[exp[expInd]]);
				processExp(context, exp.join("."), expInd+1, callback);


			}else{
				logger('constructor', context[exp[expInd]]['constructor']);
				logger('context', JSON.stringify(context), 'exp', exp, 'expInd', expInd);
				callback(null);
				logger("There is something wrong with expression: "+(exp.join(".")));
			}
		}
	} catch (e) {
		logger("Error: while parsing expression");
		logger(e);
		logger(e.stackTrace);
		callback("error");
	}

}


/**
 *
 * @param operation
 * @param schema
 * @param data
 * @param callback
 */
function invokingQuickBookService(operation, schema, data, callback){
	//Pending Work
	logger("invokingQuickBookService");
	if(operation=="create"){
		if(schema=="account"){
			QuickBooks.createAccount(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="bill"){
			QuickBooks.createBill(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="billPayment"){
			QuickBooks.createBillPayment(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="customer"){
			QuickBooks.createCustomer(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="employee"){
			QuickBooks.createEmployee(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="estimate"){
			QuickBooks.createEstimate(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="invoice"){
			QuickBooks.createInvoice(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="item"){
			QuickBooks.createItem(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="payment"){
			QuickBooks.createPayment(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="paymentMethod"){
			QuickBooks.createPaymentMethod(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="purchaseOrder"){
			QuickBooks.createPurchaseOrder(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="refundReceipt"){
			QuickBooks.createRefundReceipt(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="taxRate"){
			QuickBooks.createTaxRate(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="vendor"){
			QuickBooks.createVendor(data, function(result){
				logger(result);
				callback(result);
			});
		}
	}else if(operation=="read"){
		//Need to conclude
	}else if(operation=="update"){
		if(schema=="account"){
			QuickBooks.updateAccount(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="bill"){
			QuickBooks.updateBill(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="billPayment"){
			QuickBooks.updateBillPayment(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="customer"){
			QuickBooks.updateCustomer(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="estimate"){
			QuickBooks.updateEstimate(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="invoice"){
			QuickBooks.updateInvoice(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="item"){
			QuickBooks.updateItem(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="payment"){
			QuickBooks.updatePayment(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="purchaseOrder"){
			QuickBooks.updatePurchaseOrder(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="refundReceipt"){
			QuickBooks.updateRefundReceipt(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="salesReceipt"){
			QuickBooks.updateSalesReceipt(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="taxAgency"){
			QuickBooks.updateTaxAgency(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="taxCode"){
			QuickBooks.updateTaxCode(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="taxRate"){
			QuickBooks.updateTaxRate(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="term"){
			QuickBooks.updateTerm(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="vendor"){
			QuickBooks.updateVendor(data, function(result){
				logger(result);
				callback(result);
			});
		}

	}else if(operation=="delete"){
		if(schema=="vendor"){
			//Delete vendor is like update vendor Active state true to false
			QuickBooks.deleteVendor(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="customer"){
			QuickBooks.deleteCustomer(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="purchaseOrder"){
			QuickBooks.deletePurchaseOrder(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="account"){
			//Delete Account is like update account Active state true to false
			QuickBooks.deleteAccount(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="item"){
			//Delete Item is like update Item Active state true to false
			QuickBooks.deleteItem(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="invoice"){
			QuickBooks.deleteInvoice(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="taxRate"){
			//Delete TaxRate is like update TaxRate Active state true to false
			QuickBooks.deleteTaxRate(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="estimate"){
			QuickBooks.deleteEstimate(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="bill"){
			QuickBooks.deleteBill(data, function(result){
				logger(result);
				callback(result);
			});
		}else if(schema=="billPayment"){
			QuickBooks.deleteBillPayment(data, function(result){
				logger(result);
				callback(result);
			});
		}
	}
}
exports.invokingQuickBookService=invokingQuickBookService;




/**
 * @description
 * Possible data types
 * <ul>
 * <li>String</li>
 * <li>Number</li>
 * <li>Array</li>
 * <li>Object</li>
 * <li>Boolean</li>
 * <li>Function</li>
 * </ul>
 * @param record - {Object} This object has data.
 * @param tempObj - {Object}
 */
function assignRecordValuesToTemp(tempObj, record, srcKeys, exprsn, finalJson, callback, index){
	logger("exprsn: "+exprsn);logger(index);
	if(srcKeys.length==0){

		callback(finalJson);
	}else{
		if(tempObj[exprsn].constructor==String || tempObj[exprsn].constructor==Number || tempObj[exprsn].constructor==Boolean   ){
			var arIndex=parseInt(index);
			if(!isNaN(arIndex)){
				var changeVal=tempObj[exprsn];
				logger("before: "+changeVal);

				if(changeVal.search(/[0-9]/g)!=-1){
					changeVal=changeVal.replace(/[0-9]/, arIndex);
					tempObj[exprsn]=changeVal
				}else{
					tempObj[exprsn]=changeVal.split(".").join("["+arIndex+"].");
				}
				logger("after: "+changeVal);
				logger(tempObj[exprsn]);
				logger("final exprsn: "+exprsn+", output: "+(eval("record."+(tempObj[exprsn]))));
			}
			if(eval("record."+(tempObj[exprsn]))==undefined){
				finalJson[exprsn]=exprsn;
			}else{
				finalJson[exprsn]=eval("record."+(tempObj[exprsn]));//record[tempObj[exprsn]];
			}

			srcKeys.splice(0,1);
			if(srcKeys.length==0){
				callback(finalJson);
			}else{
				assignRecordValuesToTemp(tempObj, record, srcKeys, srcKeys[0], finalJson, callback, (index));
			}
		}else if(tempObj[exprsn].constructor==Object){
			finalJson[exprsn]={};
			var obj=tempObj[exprsn];
			var objKeys=Object.keys(obj);
			assignRecordValuesToTemp(tempObj[exprsn], record, objKeys, objKeys[0], finalJson[exprsn], function(obJson){
				finalJson[exprsn]=obJson;
				srcKeys.splice(0,1);
				assignRecordValuesToTemp(tempObj, record, srcKeys, srcKeys[0], finalJson, callback,srcKeys[0]);
			},index);

		}else if(tempObj[exprsn].constructor==Array){
			finalJson[exprsn]=[];
				var ary=tempObj[exprsn];
				var aryLen=ary.length;

				var aryRef=eval("record."+(tempObj[exprsn][0].arrayRef));
				logger(aryRef);
				logger("ref array length: "+aryRef.length);
				for(var i=0; i<aryRef.length-1;i++){
					tempObj[exprsn].push(ary[0]);
				}
				var obj=tempObj[exprsn];
				var objKeys=Object.keys(obj);

					//objKeys.splice(objKeys.indexOf("arrayRef"), 1);
					logger(objKeys);
					assignRecordValuesToTemp(tempObj[exprsn], record, objKeys, objKeys[0], finalJson[exprsn], function(obJson){
						finalJson[exprsn]=obJson;//need to check whether to push or assign
						srcKeys.splice(0,1);
						logger("from array: "+srcKeys);
						assignRecordValuesToTemp(tempObj, record, srcKeys, srcKeys[0], finalJson, callback, srcKeys[0]);
					}, parseInt(objKeys[0]));
				//});

		}
	}
}
exports.assignRecordValuesToTemp=assignRecordValuesToTemp;


function getDocs(docId, callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(docId, function(doc){
		callback(doc);
	});
}


function service(request, response){
	try {
		var urlParser=require('./URLParser');
		var operationValue = urlParser.getRequestQuery(request).operation;
		var body=urlParser.getRequestBody(request);
		var session=request.session;
		if(!session.userData.recordId){
			response.contentType("application/json");
			response.send({status:false, reason: 'User not logged in, Login and Try.'});
			return;
		}
		switch(operationValue){
		case "checkDocName":
			var docId=request.body.docId;
			logger("Checking for docId: "+docId);
			CouchBaseUtil.getDocumentByIdFromMasterBucket(docId, function(results) {
				if(results.error){
					response.contentType("application/json");
					response.send({status:true});
				}else{
					response.contentType("application/json");
					response.send({status:false})
				}

			});
			break;
		case "getAllSchemas":
			var hostname=request.headers.host.split(":")[0];
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			logger(cloudPointHostId);
			utility.getAllSchemasStructsDependentSchemas(cloudPointHostId,function(data){
				logger("Total Records length before sorting: "+data.length);
				logger(data[0].id);
				data.sort(function(a, b){ return a.id>b.id});
				logger("Total Records length after sorting: "+data.length);
				logger(data[0].id);
				response.send(data);
			});

			break;
		case "getAllTriggers":
			var hostname=request.headers.host.split(":")[0];
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			logger(cloudPointHostId);
			utility.getAllTriggers(cloudPointHostId,function(data){
				response.send(data);
			});

			break;

		case "saveTrigger":
			var hostname=request.headers.host.split(":")[0];
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			var triggerDoc=request.body.trigger;
			var session=request.session;
			if(session.userData){
				triggerDoc["author"]= session.userData.recordId;
				triggerDoc["editor"]= session.userData.recordId;
				if(!triggerDoc['dateCreate']){
					triggerDoc["dateCreated"]= global.getDate();
				}
				triggerDoc["dateModified"]= global.getDate();;
				if(!triggerDoc['revision']){
					triggerDoc["revision"]= 1;
				}
			}
			triggerDoc['cloudPointHostId']=cloudPointHostId;
			triggerDoc['active']=true;
			triggerDoc["return"]=triggerDoc.schemas.sourceSchema;
			triggerDoc["response"]= { "targetContext": "detailView"};
			triggerDoc["$status"]="draft";
			triggerDoc['cloudPointHostId']=cloudPointHostId;

			var schemaName=triggerDoc.schemas.sourceSchema;
			CouchBaseUtil.getDocumentByIdFromMasterBucket(schemaName, function(schemaDoc){
				if(schemaDoc.error){
					logger("Schema not found, while creating trigger with "+triggerDoc.recordId);
					response.contentType("application/json");
					response.send({status:false, reason: 'Schema not found'});
				}else{
					schemaDoc=schemaDoc.value;
					if(schemaDoc['@triggers'] && schemaDoc['@triggers'].length>0){
						if(schemaDoc['@triggers'].indexOf(triggerDoc.recordId)==-1){
							schemaDoc['@triggers'].push(triggerDoc.recordId);
						}
					}else{
						schemaDoc['@triggers']=[triggerDoc.recordId];
					}

					CouchBaseUtil.upsertDocumentInMasterBucket(schemaDoc['@id'], schemaDoc, function(result){
						if(result.error){
							logger("Error while saving schema, for creating trigger with "+triggerDoc.recordId);
							response.contentType("application/json");
							response.send({status:false, reason: "Error while updating schema"});
						}else{
							CouchBaseUtil.upsertDocumentInMasterBucket(triggerDoc.recordId, triggerDoc, function(status){
								if(status.error){
									logger("Error while creating Trigger, Remove Trigger from schema, for creating trigger with "+triggerDoc.recordId);
									response.contentType("application/json");
									response.send({status:false, reason: "Error while creating Trigger, Remove Trigger from schema"});
								}
								response.contentType("application/json");
								response.send({status:true});
							});
						}
					});
				}
			});
			break;
		case "editTrigger":
			logger("Editing Trigger Document");
			var triggerDoc=request.body.trigger;
			var session=request.session;
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			if(session.userData){
				triggerDoc["editor"]= session.userData.recordId;
				if(!triggerDoc['dateCreate']){
					triggerDoc["dateCreated"]= global.getDate();
				}
			}

			if(triggerDoc['revision']){
				triggerDoc["revision"]+=1;
			}else{
				triggerDoc["revision"]=1;
			}
			if(!triggerDoc.cloudPointHostId && cloudPointHostId){
				triggerDoc['cloudPointHostId']=cloudPointHostId;
			}

			triggerDoc["dateModified"]= global.getDate();;

			CouchBaseUtil.upsertDocumentInMasterBucket(triggerDoc.recordId, triggerDoc, function(status){
				if(status.error){
					logger("Editing Trigger is failed");
					logger(status.error);
				}
				logger("Editing Trigger is success");
				response.contentType("application/json");
				response.send({status:true});
			});

			break;
		case "getTriggerDoc":
			logger("retrieving trigger doc with ID: "+(request.body.triggerDocId));
			CouchBaseUtil.getDocumentByIdFromMasterBucket(request.body.triggerDocId, function(triggerDoc){
				response.contentType("application/json");
				response.send({triggerDoc:triggerDoc});
			});
			break;
		default:logger("Invalid request");
				response.contentType("application/json");
				response.send({status:false, reason: "Invalid request"});
		}
	} catch (e) {
		logger("Exception raised");
		logger(e.stack);
		if(response){
			response.contentType("application/json");
			response.send({status:false, reason: 'Something went wrong, Contact support Team'});
		}
	}

}


exports.service=service;



/**
 * Below is to get the value from the given string
 *
 *
 * */
function processComboProp(context, exp, callback){//exp = User.socialIdentity.facebook+User.id
	logger("start of expEval: "+exp);

	if(context.constructor == Object && exp && exp.indexOf('+')!=-1){
		var result='';
		var exp = exp.split("+");

		if(exp.length>1){

			exp.forEach(function(expr){
				expEvaluator(context, expr, function(val){//exp = User.socialIdentity.facebook
					result=result+" "+val;
				});
			});

			callback(result);
			/*
			processingComboProp(context, exp.join("+"), 1, function(res){
				logger("expression evaluation is done: "+res);
				if(res.constructor==String && res.indexOf("\"")!=-1)
				res.replace(/\"/g, "");
				callback(res);
			});*/
		}
	}else{
		callback(context[exp]);
	}
}

exports.processComboProp=processComboProp;




function prepareJsonForRestAPI(parent, newJson, callback){
	logger(parent.value);

	if(parent.dataKey){
		if(parent.value=="Object"){
			newJson[parent.dataKey]={};
		}else{
			if(parent.value)
			newJson[parent.dataKey]=parent.value;
		}
		if(parent.child.length && parent.value=="Object"){
			parent.child.forEach(function(child){
				logger("Child");
				logger(child);
				prepareJsonForRestAPI(child, newJson[parent.dataKey], function(d){
					newJson[parent.dataKey]=d;
				});
			});
		}else{
			logger("invoking callback");
			callback(newJson);
		}

	}else{
		callback(newJson);
	}
}

function replaceWithValue(record, json, callback){
	logger("json: ");
	logger(JSON.stringify(json));

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


function conStruct(struct, record){
	var struct={
			"price":"recordId.price",
			"dateModified":"recordId.dateModified",
			"author":"recordId.author"
	};
	var keys = Object.keys(struct);
	var json={};
	keys.forEach(function(ky){
		if(struct[ky].indexOf("recordId")){

		}
	});
}


function logger(){
	var args=arguments;
	process.env.debug=true;
	if(process.env.debug && Object.keys(args).length){
		Object.keys(args).forEach(function(d){
			console.log(args[d]);
		});
	}
}

function constructN1QL(qry, record, callback){
	/*var q ={"query": {
        "select": [
          "recordId"
        ],
        "from": "records",
        "where": {
          "docType": "MfrProject",
          "architectProject": "recordId.org",
          "architect": "recordId.org.org",
          "manufacturer": "recordId.Manufacturer"
        }
      }};
      */

      var n1qlQry= " SELECT ";
      n1qlQry += "`"+qry.select.join("`,`")+"` ";
      n1qlQry += " FROM "+qry.from+" WHERE ";
      var whereClause=Object.keys(qry.where);
      processWhereClause(0);
      function processWhereClause(whrInd){
    	  if(whrInd>=whereClause.length){
    		  //Where clause processing is done, check for ORDER BY, OFFSET, LIMIT
    		  n1qlQry = n1qlQry.replace(/AND $/, "");
    		  n1qlQry = n1qlQry.replace(/ AND$/, "");
    		  callback(n1qlQry);
    	  }else{
    		  if(qry.where[whereClause[whrInd]].split(".").length==1){
    			  n1qlQry += "`"+whereClause[whrInd]+"` = \""+qry.where[whereClause[whrInd]]+"\" AND";
    			  processWhereClause(whrInd+1);
    		  }else{
    			  if(qry.where[whereClause[whrInd]].indexOf('recordId')!=-1){
    				  expEvaluator(Data[recordId], qry.where[whereClause[whrInd]], function(result){
    					  n1qlQry += "`"+whereClause[whrInd]+"` = \""+result+"\" AND ";
    					  processWhereClause(whrInd+1);
    				  });
    			  }else if(qry.where[whereClause[whrInd]].indexOf('Schema@')!=-1){
    				  var schma = qry.where[whereClause[whrInd]].split(".")[0];
    				  schma = schma.split("@")[1];
    				  n1qlQry += ("`"+whereClause[whrInd]+"` = \""+(eval(qry.where[whereClause[whrInd]].replace("Schema@"+schma, "Data['"+schma+"']")))+"\" AND ");
    				  processWhereClause(whrInd+1);

    			  }else{
    				  console.log("Need to handle for expression: "+(qry.where[whereClause[whrInd]]));
    				  processWhereClause(whrInd+1);
    			  }
    		  }
    	  }
      }
}
