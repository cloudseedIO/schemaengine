/*******************************************************************************
 * 
 * @author saikiran vadlakonda
 * 
 * Date: 27th, April, 2017
 * 
 ******************************************************************************/

var CouchBaseUtil = require('./CouchBaseUtil');
var couchbase = require('couchbase');
var GenericServer = require('./GenericServer.js');
var GenericSummeryServer = require('./GenericSummeryServer.js');
var GenericRecordServer = require('./GenericRecordServer.js');
var GenericRelatedRecordsServer = require('./GenericRelatedRecordsServer.js');
var utility = require('./utility.js');
var ContentServer = require('../ContentServer.js');

var global = require("../utils/global.js");
var QuickBooks = require("../services/QuickBooksService");
var ContentServer = require('../ContentServer.js');
var RestApiController = require("./RestApiServiceController.js");
var TriggerController = require("./TriggerController.js");

var logger = require('../services/logseed').logseed;

/**
 * 
 * @param onTheFlyTriggerDoc
 * @param recordId
 * @param userId
 * @param org
 * @param callback
 * @param request
 * @returns
 */
function ProcessOnTheFlyTrigger(onTheFlyTriggerDoc, userId, org, callback, request) {
	/*var onTheFlyTriggerDoc = {// adding a bathroom cabinet product to a specList
		sourceSchema : "Product",
		recordId : "Product8b2dcf47-1192-97c7-489e-bb240d2698db",
		targetSchema : "SpecList",
		targetRecordId : "SpecListccb7a403-acb3-0762-9ca6-96ae722afa63",
		triggerId : "triggerToAddToSpecList"
	};*/
	console.log("onTheFlyTriggerDoc: ", onTheFlyTriggerDoc);
	var Data={};
	var recordId=onTheFlyTriggerDoc.recordId;
	userId = userId?userId:onTheFlyTriggerDoc.userId;
	org= onTheFlyTriggerDoc.org?onTheFlyTriggerDoc.org:org;
	Data['org']=org;
	
	if(!onTheFlyTriggerDoc.triggerId || !org || !userId){
		console.log("Data Not Found: ",onTheFlyTriggerDoc.triggerId , org , userId);
		return;
	}
	console.log("Processing trigger:  ", onTheFlyTriggerDoc);
	CouchBaseUtil.getDocumentByIdFromMasterBucket(onTheFlyTriggerDoc.triggerId, function(triggerDoc){
		if(triggerDoc.value){
			triggerDoc = triggerDoc.value;
			//Getting trigger doc, actual record, userrecord, organization record
			var recordsToFetch=[];
			recordId?recordsToFetch.push(recordId):null;
			userId?recordsToFetch.push(userId):null;
			org?recordsToFetch.push(org):null;
			onTheFlyTriggerDoc.targetRecordId?recordsToFetch.push(onTheFlyTriggerDoc.targetRecordId):null;
			/*
			 * Added by vikram to fetch extra resources
			 */
			var extraRemoteRecordIds=[];
			if(Array.isArray(onTheFlyTriggerDoc.remoteRecords)){
				for(var i=0;i<onTheFlyTriggerDoc.remoteRecords.length;i++){
					var temp=onTheFlyTriggerDoc[onTheFlyTriggerDoc.remoteRecords[i]];
					if(temp && temp!="" && recordsToFetch.indexOf(temp)==-1){
						extraRemoteRecordIds.push(temp);
					}
				}
			}
			recordsToFetch=recordsToFetch.concat(extraRemoteRecordIds);
			
			
			CouchBaseUtil.getDocumentsByIdsFromContentBucket(recordsToFetch,function(Response){
				if(Response.error){
					logger.error({
						type:"OTFT",
						message:"RecordsFetchError",
						recordIds:recordsToFetch,
						triggerId:onTheFlyTriggerDoc.triggerId,
						error:Response.error
					});
					callback({error: "Document not found"});
					return;
				}
				if(!Response[recordId].value || !Response[userId].value || !Response[org].value){
					console.log(JSON.stringify(Response));
					callback({error: "Document not found check these: "+recordId+", "+userId+", "+org});
					return;
				}
				console.log("RecsToFetch : ", Object.keys(Response));
				
				//var triggerDoc=Response[triggerDocId].value;
				
				//Data variable holds root parameters and their actual values
				
				Data["create"]={};
				Data['update']={};
				Data['callback']=callback;
				
				Data[recordId]=Response[recordId].value;
				Data['recordId']=Response[recordId].value;
				Data[userId]=Response[userId].value;
				Data[org]=Response[org].value;
				if(onTheFlyTriggerDoc.targetRecordId){
					Data['targetRecordId']=Response[onTheFlyTriggerDoc.targetRecordId].value?Response[onTheFlyTriggerDoc.targetRecordId].value:{};
				}
				
				/*
				 * Added by vikram to fetch extra resources
				 */
				for(var i=0;i<extraRemoteRecordIds.length;i++){
					Data[extraRemoteRecordIds[i]]=Response[extraRemoteRecordIds[i]].value?Response[extraRemoteRecordIds[i]].value:{}
				}
				
				
				var ResultData={};
				step1();
				
				function step1(){
					console.log("Trigger Step1");
					if(triggerDoc.orderOfProcessing && triggerDoc.orderOfProcessing.length>0){
						doAction(0);
					}else{
						callback({"error": "order of processing is not found in trigger doc"});
					}
				}
				
				
				function doAction(indx){
					var condStatus = true;
					
					if(indx>=triggerDoc.orderOfProcessing.length){
						console.log("Actions completed, we are at finishing level of trigger");
						
						onTriggerFinish(function(res){
							console.log("Returning from trigger "+ResultData['targetContext']);
							if(!ResultData['targetContext']){
								ResultData['targetContext']="detailView";
							}
							if(res.constructor == Object)
							Object.keys(res).forEach(function(k){
								console.log(k+":"+res[k]);
								ResultData[k]=res[k];
							});
							Data['callback'](ResultData);
						});
						
						
					}else{
						console.log("do action"+indx);
						var actionStr = triggerDoc.orderOfProcessing[indx];//createOrder
						var action = triggerDoc.actions[actionStr].action;//createOrder:{conditions:{}, actions:{}}
						console.log("action", action);
						if(action.if){
							console.log("action.if: ", action.if);
							
							processIf(action, function(){
								doAction(indx+1);
							});
							
						}else{
							console.log("if cond is not available");
							doAction(indx+1);
						}
						
					}
					
				}
				
				
				function evalIfCond(cond, callback){
					console.log("condition: "+cond);
					var res=false;
					var exprsn = cond.split(/\s>=|\s<=|\s==|\s<|\s>|\s!=/g);
					var leftOpr = exprsn[0];
					
					if(leftOpr.indexOf("targetRecordId")!=-1){
						leftOpr=leftOpr.replace("targetRecordId", eval("onTheFlyTriggerDoc.targetRecordId"));
						console.log("condition: "+cond, leftOpr);
						res=eval(cond.replace("targetRecordId", "'"+leftOpr+"'"));//"Data['"+leftOpr+"']"
						console.log("res",res);
						callback(res);
					}else if(leftOpr.indexOf("tgData")!=-1){
						res=eval(cond.replace("tgData", "onTheFlyTriggerDoc"));
						callback(res);
					}else if(leftOpr.indexOf("->")!=-1){
						var refSchm = leftOpr.split("->")[0];
						var relation = leftOpr.split("->")[1];
						relation=relation.split(".")[0];
						console.log("relation: ", Data[refSchm+"->"+relation]);
						
						//condition should be like Schema->relation.length>0
						console.log("rel-cond: "+cond);
						cond=cond.replace(refSchm+"->"+relation,"Data['"+refSchm+"->"+relation+"']");
						console.log("after replace", cond);
						res=eval(cond);
						console.log("res",res);
						callback(res);
					}else if(leftOpr.indexOf('recordId')!=-1){
						if(leftOpr.indexOf('recordId.')==0){
							if(leftOpr.split(".").length==2){
								leftOpr = leftOpr.replace("recordId", "Data['recordId']");
								res=eval(cond.replace("recordId","Data['recordId']"));
								console.log("res",res);
								callback(res);
							}else if(leftOpr.split(".").length>2){
								//need to write logic to handle expevaluator
								res = eval(cond);
								callback(res);
							}else{
								
								console.log("res",res);
								callback(res);
							}
							
						}else if(leftOpr.indexOf('recordId')==0){
							res = eval(cond);
							callback(res);
						}
					}else {
						res = eval(cond);
						console.log("res",res);
						callback(res);
					}
					
				}
				
				
				
				
				function processIf(ifJson, callback){
					console.log("ifJson: ", ifJson);
					if(ifJson.hasOwnProperty("if") && ifJson.if.hasOwnProperty("cond")){
						
						evalIfCond(ifJson.if.cond, function(res){
							console.log("evalIfCond-processIf: "+res, ifJson.if.cond);
							if(res){
								
								if(ifJson.if.hasOwnProperty("then") &&  ifJson.if.then.hasOwnProperty("getRelated")){
									//getRelatedRecords and process
									ifJson=ifJson.if.then;
									var getRelRecordId=ifJson.getRelated.recordId;
									var relation=ifJson.getRelated.relation;
									var relRefSchma=ifJson.getRelated.refSchema;
									var relOrg = ifJson.getRelated.org;
									
									if(getRelRecordId.indexOf("store")!=-1){
										getRelRecordId=Data['store'];
									}
									if(getRelRecordId.indexOf("targetRecordId")!=-1){
										getRelRecordId=getRelRecordId.replace("targetRecordId", eval("onTheFlyTriggerDoc.targetRecordId"));
									}
									
									if(getRelRecordId.indexOf("recordId")==0 && getRelRecordId.indexOf("recordId.")==-1){
										getRelRecordId=getRelRecordId.replace("recordId", eval("onTheFlyTriggerDoc.recordId"));
									}else if(getRelRecordId.indexOf("recordId.")==0){
										if(getRelRecordId.split(".").length==2){
											getRelRecordId=eval(getRelRecordId.replace("recordId","Data['recordId']"));
											console.log("getRelRecordId: ",getRelRecordId);
										}
									}
									
									if(relOrg && relOrg.indexOf("recordId.")==0 ){
										if(relOrg.split(".").length==2 ){
											relOrg=eval(relOrg.replace("recordId","Data['recordId']"));
										}else{
											
										}
										
										
									}
									console.log("getRelatedRecs: ", getRelRecordId, relation, relRefSchma, relOrg?relOrg:org);
									
									GenericRelatedRecordsServer.getRelatedRecords({body:{recordId:getRelRecordId,relationName:relation, relationRefSchema:relRefSchma, org:relOrg?relOrg:org,fromTrigger:true}}, function(recs){
										if(recs.records && recs.records.length>0){
											var recArr=[];
											recs.records.forEach(function(record){
												recArr.push(record.value);
											});
											Data[relRefSchma+"->"+relation]=recArr;
											console.log("relatedRecs: ", Data[relRefSchma+"->"+relation]);
											console.log("ifJson---inside: ", ifJson);
											
											processIf(ifJson, function(){
												console.log("get related if");
												
												
												callback();
											});
											
											
										}else{
											Data[relRefSchma+"->"+relation]=[];
											console.log("get related zero");
											processIf(ifJson, function(){
												callback();
											});
										}
									});
									
									
									
								}else if(ifJson.if.hasOwnProperty("then") && ifJson.if.then.hasOwnProperty("forEach")){
									//process forEach
									ifJson=ifJson.if.then;
									processForEach(0, ifJson.forEach, function(){
										callback();
									});
								}else if(ifJson.if.hasOwnProperty("then") && ifJson.if.then.hasOwnProperty("assign")){
									var assignProps = isJson.if.then.assign.props;
									console.log("ifJson.if.then.assign");
									callback();
									
									/*
									assignProp(0);
									
									function assignProp(index){
										if(index>=props.length){
											//console.log(record);
											//ResultData = record;
											//console.log("next doAction: "+indx);
											Data[newRecord['recordId']]=newRecord;
											Data[schema['@id']]=newRecord;
											Data['create'][newRecord.recordId]=(newRecord);
											newRecord={};
											console.log("createNSetProps: ");
											callback();
											//processForEach(forEIndx+1);
										}else{
											
											// start here
											if(props[index]!= "requiredKeys"){
												//console.log(schema['@properties'][props[index]].dataType.type);
												var recProps = crJson.props;
												var recKeys = Object.keys(recProps);
												if(recProps[props[index]] ){
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
															TriggerController.expEvaluator(Data[recordId], recProps[props[index]], function(res){
																//console.log("res",res);
																newRecord[props[index]] = res;
																setProp(index+1);
															});
														}
													}else if(recProps[props[index]].indexOf("store")==0){//recordId.Manufacturer
														if((recProps[props[index]]).split(".").length==1){
															newRecord[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
															setProp(index+1);
														}else if((recProps[props[index]]).split(".").length>=2){
															console.log(Data['store']);
															TriggerController.expEvaluator({recordId: Data['store']}, recProps[props[index]], function(res){
																//console.log("res",res);
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
															TriggerController.expEvaluator(Data[schma], recProps[props[index]], function(res){
																//console.log("res",res);
																if(res && !res.error)
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
															TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]], function(res){
																//console.log("res",res);
																newRecord[props[index]] = res;
																setProp(index+1);
															});
														}
														
														
													}else if(recProps[props[index]].indexOf("tgData")==0 ){//tgData.name
														
														if((recProps[props[index]]).split(".").length==2){
															newRecord[props[index]] = eval(recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"));
															setProp(index+1);
														}else if((recProps[props[index]]).split(".").length==1){
															newRecord[props[index]] = recordId;
															setProp(index+1);
														}else if((recProps[props[index]]).split(".").length>2){
															TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"), function(res){
																//console.log("res",res);
																newRecord[props[index]] = res;
																setProp(index+1);
															});
														}
														
														
													}else if(recProps[props[index]].indexOf("->")!=-1 ){
														
														var relRefSchma= recProps[props[index]].split("->")[0];
														var relation= recProps[props[index]].split("->")[1];
														relation=relation.split(".")[0];
														if(Data['curr'][relRefSchma+'->'+relation]){
															console.log('processing on: ',Data['curr'][relRefSchma+'->'+relation]);
														}
														newRecord[props[index]] = eval(recProps[props[index]].replace(relRefSchma+'->'+relation, "Data['curr']['"+relRefSchma+"->"+relation+"']"));
														setProp(index+1);
														
													}else{
														newRecord[props[index]] = recProps[props[index]];
														setProp(index+1);
													}
													
													
													
													
												}else if(schema['@properties'][props[index]].dataType.type=="object"){
													newRecord[props[index]]="";
													setProp(index+1);
												}else if(schema['@properties'][props[index]].dataType.type=="struct"){
													//console.log(props[index]);
													CouchBaseUtil.getDocumentByIdFromMasterBucket(schema['@properties'][props[index]].dataType.structRef+"",function(structResp){
														newRecord[props[index]]={};
														structResp = structResp.value;
														//console.log(structResp);
														Object.keys(structResp['@properties']).forEach(function(prop){
															newRecord[props[index]][prop]="";
														});
														setProp(index+1);
													});
												}else if(schema['@properties'][props[index]].dataType.type=="array"){
													CouchBaseUtil.getDocumentByIdFromMasterBucket(schema['@properties'][props[index]].dataType.elements.structRef+"",function(arrayResp){
														newRecord[props[index]]=[];
														var arrObj = {};
														arrayResp = arrayResp.value;
														setProp(index+1);
													});
												}else{
													console.log("else",props[index]);
													newRecord[props[index]]="";
													setProp(index+1);
												}
											}else{
												setProp(index+1);
											}
										}
										
									}
									*/
									
									
								}else if(ifJson.if.hasOwnProperty("then") && ifJson.if.then.hasOwnProperty("createMultiple")){
									
									createMultiple(0, ifJson.if.then.createMultiple, function(){
										callback();
									});
									
								}else if(ifJson.if.hasOwnProperty("then") && ifJson.if.then.hasOwnProperty("if")){
									ifJson=ifJson.if.then;
									processIf(ifJson, function(){
										callback();
									});
								}
								
								
							}else{
								if(ifJson.else && ifJson.else.hasOwnProperty("if")){
									processIf(ifJson.else, function(){
										callback();
									});
								}else if(ifJson.else){
									processElse(ifJson.else, function(res){
										callback(res);
									});
								}else{
									console.log("No else found for: ", ifJson);
									callback();
								}
							}
						});
						
					}else{
						callback();
					}
				}
				
				
				
				function processForEach(ind, forEach, callback){
					console.log("forEach: "+ind, forEach.expr);
					
					var count=eval("Data['"+forEach.expr+"'].length");
					
					if(ind < count){
						var curr=Data[forEach.expr][ind];
						if(!Data['curr']){
							Data['curr']={};
						}
						Data['curr'][forEach.expr]=curr;
						
						var cond=forEach.cond;
						if(cond.indexOf(forEach.expr)!=-1){
							cond=cond.replace(forEach.expr, "curr");
						}
						
						if(cond.indexOf("recordId.")!=-1){
							cond=cond.replace("recordId", "Data['recordId']");
						}
						
						console.log("ForEach-Condition: ",cond, curr['$status']);
						console.log(eval(cond));
						if(eval(cond)){//SpecListProductCategory->specListHasProductCategory.ProductCategory==recordId.productCategory
							if(forEach.then){
								//forEach=forEach.then;
								if(forEach.then.store){
									var store=forEach.then.store;
									store=store.replace(forEach.expr, "curr");
									Data['store']=eval(store);
								}
								if(forEach.then.assign){
									
									var assignProps = forEach.then.assign.props;
									var props = Object.keys(assignProps);
									assignIfProp(0);
									
									
									function assignIfProp(index){
										console.log(index);
										if(index>=props.length){
											//console.log(record);
											//ResultData = record;
											//console.log("next doAction: "+indx);
											Data[curr['recordId']]=curr;
											Data[curr['@docType']]=curr;
											Data['update'][curr.recordId]=(curr);
											//newRecord={};
											console.log("Assigning for current record is done: ", curr);
											processForEach(ind+1, forEach, callback);
											//processForEach(forEIndx+1);
										}else{
											
											/* start here*/
											//console.log(schema['@properties'][props[index]].dataType.type);
											var recProps = assignProps;
											var recKeys = Object.keys(recProps);
											console.log(recProps);
											
											if(recProps[props[index]] ){
												console.log("entered");
												if(!isNaN(recProps[props[index]])){
													curr[props[index]] = recProps[props[index]];
													setProp(index+1);
												}else if(recProps[props[index]].indexOf("recordId.") ==0){//recordId.Manufacturer
													if((recProps[props[index]]).split(".").length==2){
														curr[props[index]] = eval(recProps[props[index]].replace("recordId", "Data['"+recordId+"']"));
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length==1){
														curr[props[index]] = recordId;
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length>2){
														TriggerController.expEvaluator(Data[recordId], recProps[props[index]], function(res){
															//console.log("res",res);
															curr[props[index]] = res;
															assignIfProp(index+1);
														});
													}
												}else if(recProps[props[index]].indexOf("store")==0){//recordId.Manufacturer
													/*if((recProps[props[index]]).split(".").length==2){
														curr[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
														assignIfProp(index+1);
													}else */if((recProps[props[index]]).split(".").length==1){
														curr[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length>=2){
														console.log(Data['store']);
														TriggerController.expEvaluator({recordId: Data['store']}, recProps[props[index]], function(res){
															//console.log("res",res);
															curr[props[index]] = res;
															assignIfProp(index+1);
														});
													}
													
												}else if(recProps[props[index]].indexOf("Schema@")==0 ){//Schema@SpecListProductCategory.recordId
													if((recProps[props[index]]).split(".").length==2){
														var schma= (recProps[props[index]]).split(".")[0];
														schma=schma.split("@")[1];
														
														curr[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length==1){
														curr[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length>2){
														var schma= (recProps[props[index]]).split(".")[0];
														schma=schma.split("@")[1];
														TriggerController.expEvaluator(Data[schma], recProps[props[index]].replace("Schema@",""), function(res){
															//console.log("res",res);
															if(res && !res.error)
															curr[props[index]] = res;
															assignIfProp(index+1);
														});
													}
												}else if(recProps[props[index]].indexOf("targetRecordId")==0 ){//targetRecordId.recordId
													
													if((recProps[props[index]]).split(".").length==2){
														curr[props[index]] = eval(recProps[props[index]].replace("targetRecordId", "Data['targetRecordId']"));
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length==1){
														curr[props[index]] = recordId;
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length>2){
														TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]], function(res){
															//console.log("res",res);
															curr[props[index]] = res;
															assignIfProp(index+1);
														});
													}
													
													
												}else if(recProps[props[index]].indexOf("tgData")==0 ){//tgData.name
													
													if((recProps[props[index]]).split(".").length==2){
														curr[props[index]] = eval(recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"));
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length==1){
														curr[props[index]] = recordId;
														assignIfProp(index+1);
													}else if((recProps[props[index]]).split(".").length>2){
														TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"), function(res){
															//console.log("res",res);
															curr[props[index]] = res;
															assignIfProp(index+1);
														});
													}
													
													
												}else if(recProps[props[index]].indexOf("->")!=-1 ){
													
													var relRefSchma= recProps[props[index]].split("->")[0];
													var relation= recProps[props[index]].split("->")[1];
													relation=relation.split(".")[0];
													if(Data['curr'][relRefSchma+'->'+relation]){
														console.log('processing on: ',Data['curr'][relRefSchma+'->'+relation]);
													}
													curr[props[index]] = eval(recProps[props[index]].replace(relRefSchma+'->'+relation, "Data['curr']['"+relRefSchma+"->"+relation+"']"));
													assignIfProp(index+1);
													
												}else{
													console.log("Else of props, ",recProps[props[index]]);
													curr[props[index]] = recProps[props[index]];
													assignIfProp(index+1);
												}
												
											}else{
												console.log("else",props[index]);
												curr[props[index]]=recProps[props[index]];
												assignIfProp(index+1);
											}
										}
										
									}
									
								}else if(forEach.then.getRelated){
									var getRelRecordId=forEach.then.getRelated.recordId;
									var relation=forEach.then.getRelated.relation;
									var relRefSchma=forEach.then.getRelated.refSchema;
									var relOrg = forEach.then.getRelated.org;
									
									if(getRelRecordId.indexOf("store")!=-1){
										getRelRecordId=Data['store'];
									}
									if(getRelRecordId.indexOf("targetRecordId")!=-1){
										getRelRecordId=getRelRecordId.replace("targetRecordId", eval("onTheFlyTriggerDoc.targetRecordId"));
									}
									
									if(getRelRecordId.indexOf("recordId")==0 && getRelRecordId.indexOf("recordId.")==-1){
										getRelRecordId=getRelRecordId.replace("recordId", eval("onTheFlyTriggerDoc.recordId"));
									}else if(getRelRecordId.indexOf("recordId.")==0){
										if(getRelRecordId.split(".").length==2){
											getRelRecordId=eval(getRelRecordId.replace("recordId","Data['recordId']"));
											console.log("getRelRecordId: ",getRelRecordId);
										}
									}
									
									if(relOrg && relOrg.indexOf("recordId.")==0 ){
										if(relOrg.split(".").length==2 ){
											relOrg=eval(relOrg.replace("recordId","Data['recordId']"));
										}else{
											//need to write expevaluator
										}
										
										
									}
									console.log("ForEach-getRelatedRecs: ", getRelRecordId, relation, relRefSchma, relOrg?relOrg:org);
									GenericRelatedRecordsServer.getRelatedRecords({body:{recordId:getRelRecordId,relationName:relation, relationRefSchema:relRefSchma,  org:relOrg?relOrg:org,fromTrigger:true}}, function(recs){
										if(recs.records && recs.records.length>0){
											var recArr=[];
											recs.records.forEach(function(record){
												recArr.push(record.value);
											});
											Data[relRefSchma+'->'+relation]=recArr;
											
										}else{
											Data[relRefSchma+'->'+relation]=[];
										}
										if(forEach.then && forEach.then.if){
											processIf(forEach.then, function(){
												processForEach(ind+1, forEach, callback);
											});
										}else{
											processForEach(ind+1, forEach, callback);
										}
										
									});
								}else{
									callback();
								}
							}
						}else{//condition failed, then go for next record
							console.log("Cond failed: "+cond, eval(cond));
							console.log("else cond");
							if(forEach.else && forEach.else.assign){
								var assignProps = forEach.else.assign.props;
								var props = Object.keys(assignProps);
								assignElseProp(0);
								
								
								function assignElseProp(index){
									console.log(index);
									console.log("else cond: "+cond);
									if(index>=props.length){
										//console.log(record);
										//ResultData = record;
										//console.log("next doAction: "+indx);
										Data[curr['recordId']]=curr;
										Data[curr['@docType']]=curr;
										Data['update'][curr.recordId]=(curr);
										//newRecord={};
										console.log("Assigning for current record is done else block: ", curr);
										processForEach(ind+1, forEach, callback);
										//processForEach(forEIndx+1);
									}else{
										
										/* start here*/
										//console.log(schema['@properties'][props[index]].dataType.type);
										var recProps = forEach.else.assign.props;
										var recKeys = Object.keys(recProps);
										if(recProps[props[index]] ){
											if(!isNaN(recProps[props[index]])){
												curr[props[index]] = recProps[props[index]];
												setProp(index+1);
											}else if(recProps[props[index]].indexOf("recordId.") ==0){//recordId.Manufacturer
												if((recProps[props[index]]).split(".").length==2){
													curr[props[index]] = eval(recProps[props[index]].replace("recordId", "Data['"+recordId+"']"));
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length==1){
													curr[props[index]] = recordId;
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length>2){
													TriggerController.expEvaluator(Data[recordId], recProps[props[index]], function(res){
														//console.log("res",res);
														curr[props[index]] = res;
														assignElseProp(index+1);
													});
												}
											}else if(recProps[props[index]].indexOf("store")==0){//recordId.Manufacturer
												/*if((recProps[props[index]]).split(".").length==2){
													curr[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
													assignElseProp(index+1);
												}else */if((recProps[props[index]]).split(".").length==1){
													curr[props[index]] = eval(recProps[props[index]].replace("store", "Data['store']"));
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length>=2){
													TriggerController.expEvaluator({recordId: Data['store']}, recProps[props[index]], function(res){
														//console.log("res",res);
														curr[props[index]] = res;
														assignElseProp(index+1);
													});
												}
												
											}else if(recProps[props[index]].indexOf("Schema@")==0 ){//Schema@SpecListProductCategory.recordId
												if((recProps[props[index]]).split(".").length==2){
													var schma= (recProps[props[index]]).split(".")[0];//Schema@SpecListProductCategory
													schma=schma.split("@")[1];//SpecListProductCategory
													
													curr[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length==1){
													curr[props[index]] = eval(recProps[props[index]].replace("Schema@"+schma, "Data['"+schma+"']"));
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length>2){
													var schma= (recProps[props[index]]).split(".")[0];
													schma=schma.split("@")[1];
													TriggerController.expEvaluator(Data[schma], recProps[props[index]].replace("Schema@",""), function(res){
														//console.log("res",res);
														if(res && !res.error)
														curr[props[index]] = res;
														assignElseProp(index+1);
													});
												}
											}else if(recProps[props[index]].indexOf("targetRecordId")==0 ){//targetRecordId.recordId
												
												if((recProps[props[index]]).split(".").length==2){
													curr[props[index]] = eval(recProps[props[index]].replace("targetRecordId", "Data['targetRecordId']"));
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length==1){
													curr[props[index]] = recordId;
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length>2){
													TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]], function(res){
														//console.log("res",res);
														curr[props[index]] = res;
														assignElseProp(index+1);
													});
												}
												
												
											}else if(recProps[props[index]].indexOf("tgData")==0 ){//tgData.name
												
												if((recProps[props[index]]).split(".").length==2){
													curr[props[index]] = eval(recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"));
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length==1){
													curr[props[index]] = recordId;
													assignElseProp(index+1);
												}else if((recProps[props[index]]).split(".").length>2){
													TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"), function(res){
														//console.log("res",res);
														curr[props[index]] = res;
														assignElseProp(index+1);
													});
												}
												
												
											}else if(recProps[props[index]].indexOf("->")!=-1 ){
												
												var relRefSchma= recProps[props[index]].split("->")[0];
												var relation= recProps[props[index]].split("->")[1];
												relation=relation.split(".")[0];
												if(Data['curr'][relRefSchma+'->'+relation]){
													console.log('processing on: ',Data['curr'][relRefSchma+'->'+relation]);
												}
												curr[props[index]] = eval(recProps[props[index]].replace(relRefSchma+'->'+relation, "Data['curr']['"+relRefSchma+"->"+relation+"']"));
												assignElseProp(index+1);
												
											}else{
												curr[props[index]] = recProps[props[index]];
												assignElseProp(index+1);
											}
											
										}else{
											console.log("else",props[index]);
											curr[props[index]]=recProps[props[index]];
											assignElseProp(index+1);
										}
									}
									
								}
							}else{
								processForEach(ind+1, forEach, callback);
							}
							
							
							
							
						}
					}else{//All docs are finished, need to do else part
						/*if(forEach.else){
							processElse(forEach.else, function(){
								callback();
							});
						}else{
							console.log("All docs are finished, need to do else part");
							callback();
						}*/
						
						console.log("All docs are finished, need to do else part");
						callback();
						
					}
				}
				
				
				
				
				function processElse(elseJson, callback){
					console.log("else")
					if(elseJson.hasOwnProperty("createMultiple")){
						console.log("CreateMultiple: ", elseJson);
						createMultiple(0, elseJson.createMultiple, function(){
							callback();
						});
					}else if(elseJson.hasOwnProperty("create")){
						createNSetProps(elseJson.create, function(){
							callback();
						});
					}else if(elseJson.hasOwnProperty("assign")){
						console.log("assign operation in else case");
						console.log(elseJson);
						callback();
					}else{
						callback();
					}
					
				}
				
				function createMultiple(index, crsJson, callback){
					console.log("CreateMultiple: "+index);
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
						if(schema.error){callback({error:data.docType+" not exists"});callback();}
						console.log('schema');
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
							//console.log(props);
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
									Data[newRecord['recordId']]=newRecord;
									Data[schema['@id']]=newRecord;
									Data['create'][newRecord.recordId]=(newRecord);
									newRecord={};
									console.log("createNSetProps: ");
									callback();
									//processForEach(forEIndx+1);
								}else{
									/* start here*/
									if(props[index]!= "requiredKeys"){
										var recProps = crJson.props;
										var recKeys = Object.keys(recProps);

										var PropdataType="";
										if(schema['@properties'][props[index]]){
											PropdataType=schema['@properties'][props[index]].dataType.type;
										}else if(schema['@sysProperties'][props[index]]){
											PropdataType=schema['@sysProperties'][props[index]].dataType.type;
										}
										console.log(PropdataType);
										
										if(recProps[props[index]] ){
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
													TriggerController.expEvaluator(Data[recordId], recProps[props[index]], function(res){
														//console.log("res",res);
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
													console.log(Data['store']);
													TriggerController.expEvaluator({recordId: Data['store']}, recProps[props[index]], function(res){
														//console.log("res",res);
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
													TriggerController.expEvaluator(Data[schma], recProps[props[index]].replace("Schema@",""), function(res){
														//console.log("res",res);
														if(res && !res.error)
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
													TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]], function(res){
														//console.log("res",res);
														newRecord[props[index]] = res;
														setProp(index+1);
													});
												}
												
												
											}else if(recProps[props[index]].indexOf("tgData")==0 ){//tgData
												if((recProps[props[index]]).split(".").length==2){
													newRecord[props[index]] = eval(recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"));
													setProp(index+1);
												}else if((recProps[props[index]]).split(".").length==1){
													newRecord[props[index]] = recordId;
													setProp(index+1);
												}else if((recProps[props[index]]).split(".").length>2){
													TriggerController.expEvaluator(onTheFlyTriggerDoc, recProps[props[index]].replace("tgData", "onTheFlyTriggerDoc"), function(res){
														//console.log("res",res);
														newRecord[props[index]] = res;
														setProp(index+1);
													});
												}
												
												
											}else if(recProps[props[index]].indexOf("->")!=-1 ){
												
												var relRefSchma= recProps[props[index]].split("->")[0];
												var relation= recProps[props[index]].split("->")[1];
												relation=relation.split(".")[0];
												if(Data['curr'][relRefSchma+'->'+relation]){
													console.log('processing on: ',Data['curr'][relRefSchma+'->'+relation]);
												}
												newRecord[props[index]] = eval(recProps[props[index]].replace(relRefSchma+'->'+relation, "Data['curr']['"+relRefSchma+"->"+relation+"']"));
												setProp(index+1);
												
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
							
						}else{
							console.log("Properties not found for the schema");
							callback();
						}
					});
				}
				
				
				
				function onTriggerFinish(callbk){
					var savedDocs=[];
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
							console.log("Trigger Execution Finished.....");
							
							if(Object.keys(Data['update']).length>0){
								createdRecs = Object.keys(Data['update']);
								recsLen = createdRecs.length;//Need to save created records
								updateRecords(0);
							}else{
								if(triggerDoc.response){
									callbk(triggerDoc.response);
								}else{
									callback({"response":"Static Resp"});
								}
							}
						}else{
							var saveRec = Data['create'][createdRecs[saveInd]];
							console.log("Saving Rec: ", saveRec.recordId);
							GenericRecordServer.saveRecord({body:saveRec}, function(res){
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
									callbk({"error":"error while saving created doc"});
								}
							});
							
						}
					}
					
				}
				
				
				
			});
		}else{
			logger.error({type:"OTFT:TriggerDocumentNotFound",docId:onTheFlyTriggerDoc.triggerId});
			callback({error: "Trigger Document Not found"});
		}
	});
	
	
	
	
}

exports.ProcessOnTheFlyTrigger = ProcessOnTheFlyTrigger;
