var TriggerController = require("./TriggerController");
var urlParser=require('./URLParser');
var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var CouchBaseUtil=require('./CouchBaseUtil');
var ContentServer=require('../ContentServer.js');
var cloudinary = require('cloudinary');
var GenericServer=require('./GenericServer.js');
var global=require('../utils/global.js');
cloudinary.config({ 
   cloud_name: config.clCloud_name,
   api_key: config.clAPI_key, 
   api_secret: config.clAPI_secret
});

var GenericRelatedRecordsServer=require('./GenericRelatedRecordsServer.js');
var utility=require('./utility.js');
var logger = require('../services/logseed').logseed;
//change the status to $status
/**
 * SAVE
 */
function saveRecord(request,callback) {
	var hostname;
	if(request && request.headers && request.headers.host && request.headers.host.split(":")){
		hostname=request.headers.host.split(":")[0];
	}
	var data=urlParser.getRequestBody(request)
	if(typeof data.docType == "undefined"){callback({error:"no docType"});return;}
	if(data.docType=="SupportRequest" && !data.author){
		data.author="CommonUser";
	}
	// updating host id
	if(hostname){
		data.cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
	}
	
	if(typeof data.author == "undefined"){callback({error:"Not logged in"});return;}
	utility.getMainSchema({schema:data.docType,cloudPointHostId:data.cloudPointHostId},function(schema){
		if(schema.error){callback({error:data.docType+" not exists"});return;}
		/* for UserRole code hack */
		if(data.docType=="UserRole"){
			if(data.dependentProperties && data.dependentProperties.org){
				data.org=data.dependentProperties.org;
			}
			delete data.orgType;
			delete data.dependentProperties;
		}		
		/* for UserRole code hack */
		
		//Creating record header from schema["heading"] property
		createRecordHeader(schema,data,function(str){
			if(str.trim()!=""){data["record_header"]=str.trim();}
			//If schema is configured with autoNumberRecordId get the number and save it
			if(schema.hasOwnProperty('autoNumberRecordId')){//To save and update auto number counter
				CouchBaseUtil.getDocumentByIdFromDefinitionBucket(schema.autoNumberRecordId,function(CR){
					var counterRecord={};
					if(CR.value){
						counterRecord = CR.value;
					}
					Object.keys(schema["@properties"]).forEach(function(key){
						if(schema["@properties"][key].dataType.type == "autoNumber"){
							if(counterRecord.prefix){
								data[key]=counterRecord.prefix+"-"+counterRecord.count;
							}else{
								if(counterRecord.count==undefined){
									counterRecord.count=1;
								}
								data[key]=counterRecord.count;
							}
							counterRecord.count = counterRecord.count+1;
							if(!counterRecord.recordId){
								counterRecord.recordId=schema.autoNumberRecordId;
							}
							CouchBaseUtil.upsertDocumentInDefinitionBucket(counterRecord.recordId,counterRecord,function(s){
								if(s.error){
									logger.error({userId:data.author,type:"GRS:saveRecord:updateCounter",message:"error while updating  "+counterRecord.recordId +" doc"});
								}
								updatedCounter();
							})
						}
					})
				})
			}else{
				updatedCounter();
			}
			
			/*
			 * processing record saving after autoNumber generation if configured
			 */
			function updatedCounter(){
				if(typeof schema["@initialState"] !="undefined" && !data['$status']){
					data["$status"]=schema["@initialState"];
				}else if(!data['$status']){
					data["$status"]="draft";
				}
				if(typeof schema["@relationDesc"]!="undefined"){
					data.relationDesc=schema["@relationDesc"];
				}
				//if many-many relation already exists don't proceed
				if(data.relationDesc){
					var keys=[];
					for(var i in data.relationDesc){
						keys.push([data[data.relationDesc[i].split("-")[0]],data.relationDesc[i].split("-")[1],data[data.relationDesc[i].split("-")[2]]]);
					}
					CouchBaseUtil.executeViewInContentBucket("relation","checkRelated",{keys:keys},function(result){
						if(result.length==0){
							//No relation exist previously creating new
							checkTriggerAndSave();
						}else{
							//If like or follow deleting it
							if(data.docType=="Like" || data.docType=="Follow"){
								CouchBaseUtil.removeDocumentByIdFromContentBucket(result[0].id,function(response){
									if(response.error){
										//this is added because if record has already deleted 
										//with the previous request then save it(view not updated yet)
										checkTriggerAndSave();
									}else{
										callback({success:"deleted"});
									}
								});	
							}else{
								callback({error:"Record already exists"});
							}
						}
					})
				}else{
					checkTriggerAndSave();
				}
			
				//Before save trigger checking
				function checkTriggerAndSave(){
					var createMethod="createAll";//default create Method
					GenericServer.getSchemaRoleOnOrg(request,{org:data.org,schema:data.docType},function(scmarole){
						createMethod=scmarole.create;//method from role
						if(!request.fromTrigger && schema["@operations"] && 
								schema["@operations"]["create"] && 
								Object.keys(schema["@operations"]["create"]).length>0 &&
								schema["@operations"]["create"][createMethod] &&
								schema["@operations"]["create"][createMethod].trigger){
							 var trigger=schema["@operations"]["create"][createMethod];
							 // console.log(trigger.triggerType);
							 if(trigger.triggerType == 'beforeSaveTrigger'){
								//beforeSaveTrigger from save record.;
								TriggerController.beforeSaveTrigger(data, data.author, trigger.trigger, function(modifiedRec){
									//console.log("Modified doc: "+JSON.stringify(modifiedRec));
									if(!modifiedRec.error){
										CouchBaseUtil.upsertDocumentInContentBucket(modifiedRec.recordId,modifiedRec.record,function(res){
											// console.log("response after saving rec:");
											// console.log(res);
											callback({"recordId":modifiedRec.recordId, "schema":modifiedRec.docType, "targetContext": "detailView"});
											performSocketIO(modifiedRec.record);
										});
										
									}else{
										// console.log("line num: 187"+modifiedRec.error);
										logger.error({userId:data.author,type:"GRS:saveRecord:beforeSaveTrigger",message:modifiedRec.error});
										callback({"error":"error while saving doc"});
									}
								},request);
							}else{
								CouchBaseUtil.upsertDocumentInContentBucket(data.recordId,data,doneCreation);
							}
							
						}else{
							CouchBaseUtil.upsertDocumentInContentBucket(data.recordId,data,doneCreation);
						}
					});
				}
				
				//Checking for after save trigger
				function doneCreation(){
					var createMethod="createAll";//Default create Method
					GenericServer.getSchemaRoleOnOrg(request,{org:data.org,schema:data.docType},function(scmarole){
						createMethod=scmarole.create;//Create Method method from role
						if(!request.fromTrigger && schema["@operations"] && 
							schema["@operations"]["create"] && 
							Object.keys(schema["@operations"]["create"]).length>0 &&
							schema["@operations"]["create"][createMethod] &&
							schema["@operations"]["create"][createMethod].trigger && 
							!schema["@operations"]["create"][createMethod].triggerType){
							var triggerDocId=schema["@operations"]["create"][createMethod].trigger;
							//"Invoking trigger after save;
							TriggerController.processTriggerNew(triggerDocId,data.recordId,data.author,data.org,callback,request);
						}else{
							callback({"success": "record saved"});
						}
						//create audit
						createAudit(schema,data);
						performSocketIO();
					});
				}
			
				function performSocketIO(record){
					if(record){data=record;}
					
					/**
					 * Logic to implement socketIO
					 */
					try{
						if(schema["@security"] && schema["@security"].recordLevel){
							//console.log("alerting author "+data.author);
							require('./socket.io.js').alertRoom(data.author,{schema:data.docType});
							if(schema["@security"] && 
								schema["@security"].recordLevel && 
								schema["@security"].recordLevel.view &&
								data &&
								data[schema["@security"].recordLevel.view]){
								if(data[schema["@security"].recordLevel.view].constructor && 
									data[schema["@security"].recordLevel.view].constructor == Array){
									for(var sioi in data[schema["@security"].recordLevel.view]){
									//console.log("alerting "+data[schema["@security"].recordLevel.view][sioi]);
										require('./socket.io.js').alertRoom(data[schema["@security"].recordLevel.view][sioi],{schema:data.docType});
									}
								}
								if(data[schema["@security"].recordLevel.view].constructor && 
									data[schema["@security"].recordLevel.view].constructor == String){
									//console.log("altering "+data[schema["@security"].recordLevel.view]);
									require('./socket.io.js').alertRoom(data[schema["@security"].recordLevel.view],{schema:data.docType});
								}
							}
						}
					}catch(err){}
				}	
			}
		});
	});
}
exports.saveRecord = saveRecord;


/**
 * VIEW
 * @param requestbody
 *            (recordId,schema,userId,org)
 * @param callback
 */
function getSchemaRecordForView(request,callback){
	var hostname;
	if(request && request.headers && request.headers.host && request.headers.host.split(":")){
		hostname=request.headers.host.split(":")[0];
	}
	var cloudPointHostId;
	//var cloudPointOwnerOrg;
	if(hostname && ContentServer.getConfigDetails(hostname)){
		cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
		//cloudPointOwnerOrg=ContentServer.getConfigDetails(hostname).cloudPointOwnerOrg;
	}
	var requestbody=urlParser.getRequestBody(request);
	
	if(!requestbody.userId){
		requestbody.userId="CommonUser";
	}
	//if record and schema not provided throw error
	if(!requestbody.recordId){
		callback({"error":"invalid request"});
		return;
	}
	if(!requestbody.schema){
		CouchBaseUtil.getDocumentByIdFromContentBucket(requestbody.recordId,function(recRes){
			if(recRes.error){
				callback({"error":"invalid request"});
				return;
			}else{
				try{request.params.schema=recRes.value.docType;}catch(err){}
				requestbody.schema=recRes.value.docType;
				getSchemaAndContinue();
			}
		});
	}else{
		getSchemaAndContinue();
	}
	function getSchemaAndContinue(){
	//get Schema document giving ds and s
	utility.getMainSchema({cloudPointHostId:cloudPointHostId,schema:requestbody.schema,dependentSchema:requestbody.dependentSchema},function(schema){
		if(schema.error){ callback(schema);return;}
		
		if(schema.cloudPointHostId==undefined ||
				cloudPointHostId==undefined ||
				(schema.cloudPointHostId!=cloudPointHostId &&
				schema.cloudPointHostId!="master")){
			logger.error({type:"GRS:getSchemaRecordForView",message:"Invalid schema record requested",body:requestbody});
			callback({error:"Invalid host details found"});
			return;
		}
		//Get role on the given schema
		GenericServer.getSchemaRoleOnOrg(request,{org:requestbody.org,schema:requestbody.schema},function(schemaRoles){
			if(schemaRoles && Object.keys(schemaRoles).length>0){
				//if user has access to child or related schemas 
				// Determining related schemas
				var relatedSchemas=[];
				var sysFuns=[];
				if(typeof schema["@relations"] !="undefined"){
					for(var i=0;i<Object.keys(schema["@relations"]).length;i++){
						if(typeof schema["@relations"][Object.keys(schema["@relations"])[i]].systemFunction =="undefined" || schema["@relations"][Object.keys(schema["@relations"])[i]].systemFunction==""){
							relatedSchemas.push(schema["@relations"][Object.keys(schema["@relations"])[i]].relationRefSchema);
						}else{
							sysFuns.push(schema["@relations"][Object.keys(schema["@relations"])[i]].relationRefSchema);
						}
					}
				}
				// Determining create privileges on related schemas
				GenericServer.getSchemaRoleOnOrg(request,{org:requestbody.org,schema:relatedSchemas},function(RelatedSchemaRoles){
					var relatedSchemas=[];
					for(var i=0;i<Object.keys(RelatedSchemaRoles).length;i++){
						if(typeof RelatedSchemaRoles[Object.keys(RelatedSchemaRoles)[i]].create !="undefined" && RelatedSchemaRoles[Object.keys(RelatedSchemaRoles)[i]].create!=""){
							relatedSchemas.push(Object.keys(RelatedSchemaRoles)[i]);
						}
					}
					for(var i=0;i<sysFuns.length;i++){
						relatedSchemas.push(sysFuns[i]);
					}
					// determing method privileges
					var methods=[];
					var viewName="";
					if(schemaRoles){
						viewName=schemaRoles.detailView;
						methods=schemaRoles.methods;
					}
					// 	if trying to get multiple documents
					if(Array.isArray(requestbody.recordId)){
						var recordsTobeSent={
							schema:schema,
							viewName:((viewName=="")?"getSummary":viewName),
							records:[]
						};
						var dbRecords={};
						CouchBaseUtil.getDocumentsByIdsFromContentBucket(requestbody.recordId,function(recs){
							if(recs.error){	
								dbRecords={};
								logger.error({type:"GRS:gsrfv",message:"requested multi records error",error:recs.error,body:requestbody});;
							}else{	
								dbRecords=recs;
							}
							process(0);
						});
						function process(index){
							if(index<requestbody.recordId.length){
								var actualRecord=dbRecords[requestbody.recordId[index]];
								if(!actualRecord){ actualRecord={error:"notFound"}; }
								if(typeof actualRecord.error!="undefined"  || typeof actualRecord.value=="undefined"){
									process(index+1);	return;
								}
								var id=requestbody.recordId[index];
								if(!actualRecord.value.org){ actualRecord.value.org="public"; }
								var prData={
										org:requestbody.org,
										actualRecord:actualRecord.value,
										schemaName:requestbody.schema,
										dependentSchema:requestbody.dependentSchema,
										userId:requestbody.userId,
										schema:schema,
										schemaRoles:schemaRoles,
										relatedSchemas:relatedSchemas
								};
								processRecord(prData,function(result){
									recordsTobeSent.viewName=result.viewName;
									recordsTobeSent.records.push({
										id:id,
										value:result.record,
										methods:result.methods,
										viewName:result.viewName,
										relatedSchemas:result.relations
									});
									process(index+1);
								})
							}else{
								sendResponse();
							}
						}
						function sendResponse(){
							callback(recordsTobeSent);
						}
							
					}else{// if trying to get single documents
						CouchBaseUtil.getDocumentByIdFromContentBucket(requestbody.recordId,function(actualRecord){
							if(actualRecord.error  || typeof actualRecord.value=="undefined"){
								logger.error({type:"GRS:gsrfv",message:"requested single record error",error:actualRecord.error,body:requestbody});;	
								callback({"error":"record not exists"});
								return;
							}
							if(!actualRecord.value.org){actualRecord.value.org="public"}
							var prData={
									org:requestbody.org,
									actualRecord:actualRecord.value,
									schemaName:requestbody.schema,
									dependentSchema:requestbody.dependentSchema,
									userId:requestbody.userId,
									schema:schema,
									schemaRoles:schemaRoles,
									relatedSchemas:relatedSchemas
							}
							processRecord(prData,function(result){
								callback({
									schema:schema,
									record:result.record,
									methods:result.methods,
									viewName:result.viewName,
									relatedSchemas:result.relations
								});
							});
						});
					}
				});
			}else{
				callback({
					schema:schema,
					record:{},
					methods:[],
					viewName:"",
					relatedSchemas:[]
				});
			}
		});
	});
	}
}
exports.getSchemaRecordForView=getSchemaRecordForView;


/**
 * Process record state , view privilege , applicable methods
 * checks doc privilege(Org securigy | record security)
 */ 
function processRecord(prData,callback){
	var actualRecord=prData.actualRecord;
	var schemaName=prData.schemaName;
	var dependentSchema=prData.dependentSchema;
	var userId=prData.userId;
	var schema=prData.schema;
	var schemaRoles=prData.schemaRoles;
	var org=prData.org;
	var relatedSchemas=prData.relatedSchemas;
	
	var methods=[];
	var viewName="";
	var actualMethods=[];
	var methodsCanPerform=[];
	var toBeSentRecord={};
	var recordLevelSecurity=false;
	
	//preparing SummaryRecord
	var toBeSentSummaryRecord={};
	try{
		var viewIndex=0;
		for(var i=0;i<schema["@views"].length;i++){
			if(schema["@views"][i].viewName=="summary"){
				viewIndex=i;
				break;
			}
		}
		var keysToBeSent=schema["@views"][viewIndex].value;
		if(Array.isArray(schema["@views"][viewIndex].key)){
			keysToBeSent.concat(schema["@views"][viewIndex].key);
		}
		for(var i=0;i<keysToBeSent.length;i++){
			toBeSentSummaryRecord[keysToBeSent[i]]=actualRecord[keysToBeSent[i]];
		}
	}catch(err){
		logger.error({userId:userId,type:"GRS:processRecord",error:err.message,data:{recordId:actualRecord.recordId,org:org}})
	}
	
	
	
	try{
		if(typeof schema["@security"]["recordLevel"].view !="undefined" && 
				schema["@security"]["recordLevel"].update !="undefined"){
			recordLevelSecurity=true;
		}
	}catch(err){}
	//determing Role with the current schema for current user
	if(schemaRoles){
		viewName=schemaRoles.detailView?schemaRoles.detailView:"";
		actualMethods=schemaRoles.methods?schemaRoles.methods:[];
	}
	
	//if there no view for the schema then assigning summery view
	viewName=(!viewName)?"getDetail":viewName;
	
	
	//If the owner of the document requested for view assigning the default ownerDetail View
	//only if schema is configured with ownerDetail view
	if((typeof actualRecord.author!="undefined" && 
			(actualRecord.author==userId || actualRecord.recordId==userId) ) || 
			(schemaRoles &&	schemaRoles.cloudPointAdmin) ){
		if(schema["@operations"]  && 
				schema["@operations"].read && 
				schema["@operations"].read["ownerDetail"]){
			viewName="ownerDetail"
		}
	}
	
	
	
	
	
	determineMethods();
	function determineMethods(){
		if((schemaRoles &&
				!schemaRoles.cloudPointAdmin) && 
				schema["@security"]  && 
				schema["@security"]["recordLevel"] && 
				schema["@security"]["recordLevel"].update){
			var validUserForUpdate=false;
			if(actualRecord.recordId==userId){//this check is for User Schema record update by the same user 
				validUserForUpdate=true;
			}
			if(schema["@security"]["recordLevel"].update=="all" ||
					schema["@security"]["recordLevel"].update=="public"){
				validUserForUpdate=true;
			}else{
				var secInfo=actualRecord[schema["@security"]["recordLevel"].update];
				if(secInfo &&//if record it self containing the @security information
						(JSON.stringify(secInfo).indexOf(userId)!=-1 ||
								JSON.stringify(secInfo).indexOf("public")!=-1 ||
								JSON.stringify(secInfo).indexOf("all")!=-1)){
					validUserForUpdate=true;
				}
			}
			if(schema["@security"]["recordLevel"].update.indexOf(".")!=-1){
				TriggerController.expEvaluator(actualRecord,schema["@security"]["recordLevel"].update,function(exprData){
					if(JSON.stringify(exprData).indexOf(userId)!=-1 || 
							JSON.stringify(exprData).indexOf("public")!=-1 ||
							JSON.stringify(exprData).indexOf("all")!=-1){
						validUserForUpdate=true;
					}
					afterDeterminingValidityForUpdateOperation();
				});
			}else{
				afterDeterminingValidityForUpdateOperation();
			}
			
			function afterDeterminingValidityForUpdateOperation(){
				if(validUserForUpdate){
					methods=actualMethods;
				}else{
					if(actualMethods=="all"){
						try{
						if(typeof schema["@operations"]!="undefined" && 
								typeof schema["@operations"]["relations"] == "object" &&
								schema["@operations"]["relations"]!=null){
							for(var orc=0;orc<Object.keys(schema["@operations"]["relations"]).length;orc++){
								if(schema["@operations"]["relations"][Object.keys(schema["@operations"]["relations"])[orc]].relation &&
										schema["@relations"][schema["@operations"]["relations"][Object.keys(schema["@operations"]["relations"])[orc]].relation]){
									if(schema["@relations"][schema["@operations"]["relations"][Object.keys(schema["@operations"]["relations"])[orc]].relation].createPrivilege){
										//var privilegeKey=schema["@relations"][schema["@operations"]["relations"][Object.keys(schema["@operations"]["relations"])[orc]].relation].createPrivilege;
									}else{
										methods.push(Object.keys(schema["@operations"]["relations"])[orc]);
									}
								}
							}
						}
						}catch(err){
							console.log(err)}
					}else{
						for(var i=0;i<actualMethods.length;i++){
							if(schema["@operations"] && schema["@operations"]["relations"] && schema["@operations"]["relations"][actualMethods[i]] ){
								if(schema["@operations"]["relations"][actualMethods[i]].relation &&
										schema["@relations"][schema["@operations"]["relations"][actualMethods[i]].relation]){
									if(schema["@relations"][schema["@operations"]["relations"][actualMethods[i]].relation].createPrivilege){
										//var privilegeKey=schema["@relations"][schema["@operations"]["relations"][actualMethods[i]].relation].createPrivilege;
									}else{
										methods.push(actualMethods[i]);
									}
								}
							}
						}
					}
				}
				processStateAndToBeSentRecord();
			}
			
			
			
			
		}else{
			methods=actualMethods;
			processStateAndToBeSentRecord();
		}
	}
	
	
	
	
	
	
	
	function processStateAndToBeSentRecord(){
		// checking the state of the record
		//assigning state if no state in the record
		if(typeof actualRecord!="undefined" && typeof actualRecord["$status"] =="undefined"){
			actualRecord["$status"]="draft";
			try{
			if(schema["@initialState"]){
				actualRecord["$status"]=schema["@initialState"];
			}
			}catch(err){}
		}
		//processing state machine
		if(actualRecord && actualRecord["$status"] && schema["@state"] && Object.keys(schema["@state"]) && Object.keys(schema["@state"]).length>0){
			var possibleMethods=[];
			if(schema["@state"][actualRecord["$status"]]){
				possibleMethods=Object.keys(schema["@state"][actualRecord["$status"]]);
			}
			if(methods=="all"){
				methodsCanPerform=possibleMethods;
			}else{
				for(var i=0;i<possibleMethods.length;i++){
					if(methods.indexOf(possibleMethods[i])!=-1){
						methodsCanPerform.push(possibleMethods[i]);
					}
				}
			}
		}else{
			methodsCanPerform=methods;
		}
	
		
		//Preparing toBeSentRecord
		
		if(viewName.trim()!="" && viewName!="getSummary"){
			var keysToBeSent=(schema["@operations"] && schema["@operations"].read && schema["@operations"].read[viewName] && schema["@operations"].read[viewName].out)?schema["@operations"].read[viewName].out:[];
			for(var i=0;i<keysToBeSent.length;i++){
				toBeSentRecord[keysToBeSent[i]]=actualRecord[keysToBeSent[i]];
			}
		}else{
			toBeSentRecord=toBeSentSummaryRecord;
		}
		determineViewPrivilege();
	}
	
	
	
	function determineViewPrivilege(){
		//Determing Viewing privilege
		if((schemaRoles &&
				!schemaRoles.cloudPointAdmin) && 
				schema["@security"]  && 
				schema["@security"]["recordLevel"] && 
				schema["@security"]["recordLevel"].view && 
				schema["@security"]["recordLevel"].view !="all"){
			
			
			var validUserForView=false;
			if(actualRecord.recordId==userId){//this check is for User Schema record viewed by the same user 
				validUserForView=true;
			}
			if(typeof actualRecord[schema["@security"]["recordLevel"].view] !="undefined" &&//if record itselt containing the @security information
					(JSON.stringify(actualRecord[schema["@security"]["recordLevel"].view]).indexOf(userId)!=-1 ||
					JSON.stringify(actualRecord[schema["@security"]["recordLevel"].view]).indexOf("public")!=-1 ||
					JSON.stringify(actualRecord[schema["@security"]["recordLevel"].view]).indexOf("all")!=-1)){
				validUserForView=true;
			}
			
			if(schema["@security"]["recordLevel"].view.indexOf(".")!=-1){
				TriggerController.expEvaluator(actualRecord,schema["@security"]["recordLevel"].view,function(exprData){
					if(JSON.stringify(exprData).indexOf(userId)!=-1 || 
							JSON.stringify(exprData).indexOf("public")!=-1 ||
							 JSON.stringify(exprData).indexOf("all")!=-1){
						validUserForView=true;
					}
					afterDeterminingValidityForViewOperation();
				});
			}else{
				afterDeterminingValidityForViewOperation();
			}
			function afterDeterminingValidityForViewOperation(){
				if(!validUserForView){
					toBeSentRecord={};
					methodsCanPerform=[];
				}
				doneSendBackResult();
			}
			
		}else{
			doneSendBackResult();
		}
	}
	

	
	function doneSendBackResult(){
		//Assinging dependent schema properties to the top schema
		if(actualRecord["dependentProperties"] && typeof actualRecord["dependentProperties"]=="object"){
			for(var i=0;i<Object.keys(actualRecord["dependentProperties"]).length;i++){
				toBeSentRecord[Object.keys(actualRecord["dependentProperties"])[i]]=actualRecord["dependentProperties"][Object.keys(actualRecord["dependentProperties"])[i]];
			}
		}
		toBeSentRecord["@metaKeywords"]=actualRecord["@metaKeywords"];
		toBeSentRecord["@uniqueUserName"]=actualRecord["@uniqueUserName"];
		toBeSentRecord["record_header"]=actualRecord["record_header"];
		toBeSentRecord["metaTitle"]=actualRecord.metaTitle;
		toBeSentRecord["metaDescription"]=actualRecord.metaDescription;
		toBeSentRecord["webCrawlerIndex"]=actualRecord.webCrawlerIndex;
		toBeSentRecord["image_src"]=actualRecord.image_src;
		toBeSentRecord["@audit"]=actualRecord["@audit"];
		
		
		
		var relationsCanCreate=[];
		var methodsNew=[];
		if(schema["@operations"] && methodsCanPerform=="all"){
			methodsCanPerform=[];
			if(schema["@operations"].update){
				methodsCanPerform=Object.keys(schema["@operations"].update);
			}
			if(schema["@operations"].actions){
				for(var i=0;i<Object.keys(schema["@operations"].actions).length;i++){
					methodsCanPerform.push(Object.keys(schema["@operations"].actions)[i]);
				}
			}
			if(schema["@operations"].relations){
				for(var i=0;i<Object.keys(schema["@operations"].relations).length;i++){
					methodsCanPerform.push(Object.keys(schema["@operations"].relations)[i]);
				}
			}
			if(schema["@operations"].delete){
				for(var i=0;i<Object.keys(schema["@operations"].delete).length;i++){
					methodsCanPerform.push(Object.keys(schema["@operations"].delete)[i]);
				}
			}
			if(schema["@operations"].jumpTo){
				for(var i=0;i<Object.keys(schema["@operations"].jumpTo).length;i++){
					methodsCanPerform.push(Object.keys(schema["@operations"].jumpTo)[i]);
				}
			}
		}
		for(var i=0;i<methodsCanPerform.length;i++){
			if( typeof schema["@operations"]!="undefined" && 
					typeof schema["@operations"].relations!="undefined" && 
					typeof schema["@operations"].relations[methodsCanPerform[i]] !="undefined"){
				for(var j=0;j<Object.keys(schema["@relations"]).length;j++){
					var methodRelation=schema["@operations"].relations[methodsCanPerform[i]].relation;
					if(methodRelation==Object.keys(schema["@relations"])[j]){
						if(relatedSchemas.indexOf(schema["@relations"][Object.keys(schema["@relations"])[j]].relationRefSchema)!=-1){
							relationsCanCreate.push(schema["@relations"][Object.keys(schema["@relations"])[j]].relationRefSchema);
						}
					}
				}
			}else{
				methodsNew.push(methodsCanPerform[i]);
			}
		}
		

		/**
		 * if viewing org and record org are same then continue
		 * or
		 * if viewing org "public" and record is pubished then continue
		 * or
		 * if viewing org any and record doesnot have a status then continue
		 */
		
		if(!recordLevelSecurity){
			//if requested org is public
			if(org=="public"){
				//if record org also public no changes to apply
				//if requested org and record org not equal
				if(actualRecord.org!="public"){
					if(actualRecord["$status"] && actualRecord["$status"]!="published"){
						toBeSentRecord=toBeSentSummaryRecord;
					}
					methodsNew=[];
					relationsCanCreate=[];
				}
			}else{
				//if record also same org no change to apply
				//if request org and record org are defferent
				if(actualRecord.org!=org){
					//if record is public org
					if(actualRecord.org=="public"){
						if(actualRecord["$status"] && actualRecord["$status"]!="published"){
							toBeSentRecord=toBeSentSummaryRecord;	
						}
						methodsNew=[];
						relationsCanCreate=[];
					}else{
						//if record is some other orgs doc
						if(actualRecord["$status"] && actualRecord["$status"]!="published"){
							toBeSentRecord=toBeSentSummaryRecord;	
						}
						methodsNew=[];
						relationsCanCreate=[];
					}
				}
			}
					
		}
		
		
		
		
		callback({
			record:toBeSentRecord,
			methods:methodsNew,
			relations:relationsCanCreate,
			viewName:viewName
			});
	}
}





/**
 * 
 * @param data
 * @param callback
 *            1)recordId, userId,org,method,value,schema
 */
// doPost("/generic?operation=updateRecord",{"userId":UserDoc.id,"recordId":"Stream002","org":"user","method":"unPublish"},function(data){});
function updateRecord(request,callback){
	var hostname;
	if(request && request.headers && request.headers.host && request.headers.host.split(":")){
		hostname=request.headers.host.split(":")[0];
	}
	var cloudPointHostId;
	if(hostname && ContentServer.getConfigDetails(hostname)){
		cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
	}
	var data=urlParser.getRequestBody(request);
	var userId;//taking the user id from the session if not then he is un logged user
	try{userId=request.session.userData.recordId;}catch(err){userId="CommonUser";}
	data.userId=userId;
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.recordId,function(recordReq){
		if(recordReq.error){
			logger.error({type:"GRS:updateRecord",message:"Updating Not existing record",data:data});
			callback(recordReq);
			return;
		}
		var record=recordReq.value;// got the old record
		var oldState=record["$status"];
		data.schema=record.docType;
		utility.getMainSchema({schema:record.docType,cloudPointHostId:cloudPointHostId},function(schema){
			if(schema.error){
				logger.error({type:"GRS:updateRecord",message:"schema not exists",data:data});
				callback(schema);	return;	
			}
			var dependentSchema=(schema["@type"]=="abstractObject")?record[schema["@dependentKey"]]?record[schema["@dependentKey"]]:undefined:undefined;
			//get Main schema
			utility.getMainSchema({cloudPointHostId:cloudPointHostId,schema:record.docType,dependentSchema:dependentSchema},function(schema){
				if(schema.error){
					logger.error({type:"GRS:updateRecord",message:"schema not exists",data:data});
					callback(schema);
					return;
				}
				//if record is not having a state update it from schema inistial state
				if(schema["@state"] && typeof schema["@state"][oldState]=="undefined" && schema["@initialState"]){
					oldState=schema["@initialState"];
					record["$status"]=schema["@initialState"];
				}
				//getting applicable methods
				determineUserRoleWithRecord(record,schema,data.userId,data.org,function(methodRes){
					if(methodRes.error){
						logger.error({type:"GRS:updateRecord",message:"while determining user role with record",data:data,error:methodRes.error});;
						callback(methodRes);
						return;
					}
					var keys=[];
					var audit=schema["@audit"]?true:false;
					var currentUpdate={
							editor:data.userId,
							dateModified:global.getDate(),
							update:[]
					};
					//if method is allowed 
					if(methodRes=="all" || methodRes.indexOf(data.method)!=-1){
						if(data.method=="HardDelete" && 
								schema["@operations"] && 
								schema["@operations"].delete && 
								schema["@operations"].delete[data.method]){
							
								createAudit(schema,record,"HardDelete");
								removeRecord(request,record.recordId,function(response){
									callback({success:"success"});
								});
								return;//stop processing below steps
						}else if(schema["@operations"] && 
								schema["@operations"].update && 
								schema["@operations"].update[data.method] &&  
								schema["@operations"].update[data.method].update){
							//updating record with the keys in update method
							keys=schema["@operations"].update[data.method].update;
							if(data.updateKey){
								keys=[data.updateKey]
							}
							for(var i=0;i<keys.length;i++){
								try{
									//checking for value change 
									//if content changed adding it to current update
									if((JSON.stringify(record[keys[i]])!=JSON.stringify(data.value[keys[i]]))){
										currentUpdate.update.push({
												key:keys[i],
												prev:record[keys[i]],
												curr:data.value[keys[i]]
										});
									}
								}catch(err){
									logger.error({type:"GRS:updateRecord",message:"error while updating the audit",error:err.message});
								}
								/*if(data.updateKey == "dependentProperties"){
									try{
										for(var tk in data.value[keys[i]]){
											record[keys[i]][tk]=data.value[keys[i]][tk];
										}
									}catch(err){
										
									}
								}else{*/
									//if dependentProperties looping through inner values
									if(keys[i]=="dependentProperties" && typeof data.value[keys[i]]=="object" && data.value[keys[i]]!=null){
										if(!record[keys[i]]){
											record[keys[i]]={};
										}
										for(var dkey in data.value[keys[i]]){
											record[keys[i]][dkey]=data.value[keys[i]][dkey];
										}
									}else{//root values adding directly
										record[keys[i]]=data.value[keys[i]];
									}
								//}
							}
						}
						
						//switching the record state based on its state machine configuration
						if(schema["@state"] && 
								schema["@state"][oldState] &&  
								schema["@state"][oldState][data.method]){
							for(var i=0;i<schema["@state"][oldState][data.method].length;i++){
								if(typeof schema["@state"][oldState][data.method][i].condition=="undefined" || schema["@state"][oldState][data.method][i].condition==""){
									if(schema["@state"][oldState][data.method][i].state.trim()!=""){
										record["$status"]=schema["@state"][oldState][data.method][i].state;
									}
									break;
								}else if(eval(schema["@state"][oldState][data.method][i].condition)){
									if(schema["@state"][oldState][data.method][i].state.trim()!=""){
										record["$status"]=schema["@state"][oldState][data.method][i].state;
									}
									break;
								}
							}
						}
						//if state change observed adding it to current update
						if(oldState!=record["$status"]){
							currentUpdate.update.push({
									key:"$status",	
									prev:oldState,
									curr:record["$status"]
							});
						}
						//Updating the audit in same document
						/*
						if(audit){
							if(!record["@audit"]){
								record["@audit"]=[];
							}
							if(currentUpdate.update.length>0){
								record["@audit"].push(currentUpdate);
							}
						}*/
						//for backward records compatibility
						if(typeof record.author == "undefined"){
							record.author=data.userId;
						}
						if(typeof record.dateCreated == "undefined"){
							record.dateCreated=global.getDate();
						}
						//adding updator,time and revision
						record.editor=data.userId;
						record.dateModified=global.getDate();
						record.revision=Number(record.revision)+1;
						//for backword compatibility
						if(typeof schema["@relationDesc"]!="undefined"){
							record.relationDesc=schema["@relationDesc"];
						}
						//if no changes exists return error
						if(currentUpdate.update.length==0){
							callback({"error":"No Changes"});
							return;
						}
						//else continue record update with it header updation
						createRecordHeader(schema,record,function(str){
							if(str.trim()!=""){record["record_header"]=str.trim();}
							if(audit){//if audit enabled save update
								createAudit(schema,record,currentUpdate);
							}
							//evaluate formulas 
							evaluateFormulas({schema:schema,record:record,keys:keys},function(newRec){
								record=newRec;
								//upadate in db
								CouchBaseUtil.upsertDocumentInContentBucket(record.recordId,record,function(updateResponse){
									if(updateResponse.error){
										callback(updateResponse);
										return;
									}
									if(record.docType=="User" && record.recordId==request.session.userData.recordId){
										request.session.userData=record;
									}
									
									var trigger="";
									//check for trigger
									if(schema["@operations"]){
										if(schema["@operations"].update && schema["@operations"].update[data.method] && schema["@operations"].update[data.method].trigger){
											trigger=schema["@operations"].update[data.method];
										}
										if(schema["@operations"].relations && schema["@operations"].relations[data.method] && schema["@operations"].relations[data.method].trigger){
											trigger=schema["@operations"].relations[data.method];
										}
										if(schema["@operations"].actions && schema["@operations"].actions[data.method] && schema["@operations"].actions[data.method].trigger){
											trigger=schema["@operations"].actions[data.method];
										}
										if(schema["@operations"].delete && schema["@operations"].delete[data.method] && schema["@operations"].delete[data.method].trigger){
											trigger=schema["@operations"].delete[data.method];
										}
									}
									if(trigger!=""){
										//if trigger is on the same record
										if(trigger.triggerType == 'beforeSaveTrigger'){
											console.log("Invoking beforeSaveTrigger from update()-"+data.method);
											console.log("---------------------------------------------");
											TriggerController.beforeSaveTrigger(record, data.userId, trigger.trigger, function(modifiedRec){
												if(!modifiedRec.error){
													//update record
													CouchBaseUtil.upsertDocumentInContentBucket(modifiedRec.recordId,modifiedRec.record,function(res){
														request.body=data;
														try{require('./socket.io.js').alertRoom(record.recordId);}catch(err){}
														getSchemaRecordForView(request,function(recRes){
															if(modifiedRec.response && modifiedRec.response.targetContext=="redirect"){
																callback({"success":modifiedRec.response,"recRes":recRes});
															}else{
																callback({"success":{"recordId":modifiedRec.recordId, 
																			"schema":modifiedRec.docType, 
																			"response": modifiedRec.response?modifiedRec.response:"detailView"
																		},"recRes":recRes});
															}
														});
														
														
													});
												}else{
													logger.error({type:"GRS:updateRecord",message:"BeforeSaveTrigger",error:modifiedRec.error});
													callback({"error":"error while saving doc, "+modifiedRec.error});
												}
											},request);
										}else{
											console.log("Invoking Trigger from update()-"+data.method);
											console.log("---------------------------------------------");
											TriggerController.processTriggerNew(trigger.trigger,record.recordId,data.userId,data.org,function(trresp){
												request.body=data;
												try{require('./socket.io.js').alertRoom(record.recordId);}catch(err){}
												getSchemaRecordForView(request,function(recRes){
													callback({"success":trresp,"recRes":recRes});
												});
											},request);
										}
										
									}else{
										request.body=data;
										try{require('./socket.io.js').alertRoom(record.recordId);}catch(err){}
										getSchemaRecordForView(request,function(recRes){
											callback({"success":"success","recRes":recRes});
										});
									}
								});
							});
						});
					}else{
						getSchemaRecordForView(request,function(recRes){
							callback({"error":"method not allowed","recRes":recRes});
						});
						//callback({"error":"method not allowed"});
					}
				},request)
			});
			
		});
	});
}
exports.updateRecord=updateRecord;
/**
 * 
 * @param record(wholedoc)
 * @param schema(wholedoc)
 * @param userId
 * @param org
 * @param callback
 * 
 * with this we get the methods the user can perform on a record
 */
function determineUserRoleWithRecord(record,schema,userId,org,callback,request){
	var hostname;
	if(request && request.headers && request.headers.host && request.headers.host.split(":")){
		hostname=request.headers.host.split(":")[0];
	}
	var methodsCanPerform=[];//holds current applicable methods
	
	//get privileges on current schema and org
	GenericServer.getSchemaRoleOnOrg(request,{org:org,schema:schema["@id"]},function(srole){
		var schemaRole={};
		schemaRole[schema["@id"]]=srole;
		// determing method privileges
		//actual methods are different and current applicable methods are different
		//the current applicable methods are based on the current record state
		var methods=[];//holds all accessible methods with role
		var actualMethods=[];//all methods
		if(schemaRole[schema["@id"]]){
			actualMethods=schemaRole[schema["@id"]].methods?schemaRole[schema["@id"]].methods:[];
		}
		
		if((schemaRole[schema["@id"]] &&
			!schemaRole[schema["@id"]].cloudPointAdmin) && //current user is not an admin
			schema["@security"]  && 
			schema["@security"]["recordLevel"] && 
			schema["@security"]["recordLevel"].update){//if the schema is configured with record level security 
		
			//For User documents (Profile) documents the owner is always the creator
			var validUserForUpdate=false;
			if(record.recordId==userId){//this check is for User Schema record updation by the same user 
				validUserForUpdate=true;
			}
			
			//if update is allowed to all
			if(schema["@security"]["recordLevel"].update=="all" ||
					schema["@security"]["recordLevel"].update=="public"){
				validUserForUpdate=true;
			}else{//if update is allowed on a record level key value
				if(record[schema["@security"]["recordLevel"].update] &&//if record itselt containing the @security information
						(JSON.stringify(record[schema["@security"]["recordLevel"].update]).indexOf(userId)!=-1 ||
						 JSON.stringify(record[schema["@security"]["recordLevel"].update]).indexOf("public")!=-1)){
					validUserForUpdate=true;
				}
			}
			//if access is given in some remote document
			if(schema["@security"]["recordLevel"].update.indexOf(".")!=-1){
				TriggerController.expEvaluator(record,schema["@security"]["recordLevel"].update,function(exprData){
					if(JSON.stringify(exprData).indexOf(userId)!=-1 || JSON.stringify(exprData).indexOf("public")!=-1){
						validUserForUpdate=true;
					}
					afterDeterminingValidityForUpdateOperation();
				})
			}else{
				afterDeterminingValidityForUpdateOperation();
			}
			function afterDeterminingValidityForUpdateOperation(){
				if(validUserForUpdate){
					methods=actualMethods;
				}
				doneSendBackResult();
			}
		}else{
			methods=actualMethods;
			doneSendBackResult();
		}
	
		//now the allowed methods are in methods variable
		//methods can perform 
		function doneSendBackResult(){
			if(typeof record!="undefined" && typeof record["$status"] =="undefined"){
				record["$status"]="draft";
				if(schema["@initialState"]){
					record["$status"]=schema["@initialState"];
				}
			}
			if(record && 
				record["$status"] && 
				typeof schema["@state"] =="object" &&
				schema["@state"]!=null &&  
				Object.keys(schema["@state"]).length>0){
				
				var possibleMethods=[];
				if(schema["@state"][record["$status"]]){
					possibleMethods=Object.keys(schema["@state"][record["$status"]]);
				}
				if(methods=="all"){
					methodsCanPerform=possibleMethods;
				}else{
					for(var i=0;i<possibleMethods.length;i++){
						if(methods.indexOf(possibleMethods[i])!=-1){
							methodsCanPerform.push(possibleMethods[i]);
						}
					}
				}
			}else{
				methodsCanPerform=methods;
			}
			callback(methodsCanPerform);
		}
	});
}
exports.determineUserRoleWithRecord=determineUserRoleWithRecord;


function removeRecord(request,recordId,callback){
	var userId;//taking the user id from the session if not then he is un logged user
	try{userId=request.session.userData.recordId;}catch(err){userId="CommonUser";}
	logger.info({type:"GR:removeRecord",recordId:recordId,userId:userId});
	var record;
	//get record
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(recordReq){
		if(recordReq.error){callback(recordReq);return;}
		record=recordReq.value;
		extractImagesAndDelete(record);//send to extract images and delete images
		if(record.docType){
			//get record schema for further processing
			CouchBaseUtil.getDocumentByIdFromMasterBucket(record.docType,function(schemaReq){
				if(schemaReq.error){ callback(schemaReq);return; }
				var schema=schemaReq.value;// got the schema
				//process child records clean up only mentioned in @relations
				//ex: Mfr deletion should trigger all its Products deletion
				if(schema["@relations"] && Object.keys(schema["@relations"]) && Object.keys(schema["@relations"]).length>0){
					getRelatedAndRemoveThem(0);
				}else{
					doneRemovingRecords();
				}


				function getRelatedAndRemoveThem(index){
					if(index>=Object.keys(schema["@relations"]).length){
						doneRemovingRecords();
						return;
					}
					//{recordId:record.recordId,relation:schema["@relations"][Object.keys(schema["@relations"])[index]].relationName}
					request.body.relationName=schema["@relations"][Object.keys(schema["@relations"])[index]].relationName;
					request.body.recordId=record.recordId;
					request.body.rootSchema=record["docType"];
					GenericRelatedRecordsServer.getRelated(request,function(relationRecs){
						var relrecids=[];
						for(var i=0;i<relationRecs.length;i++){
							relrecids.push(relationRecs[i].value);
						}
						if(relrecids.length>0)
						console.log(schema["@relations"][Object.keys(schema["@relations"])[index]].relationName+" "+ relrecids.length);
						if(relrecids.length>0){
							processRelatedRecord(0);
							function processRelatedRecord(subIndex){
								//if done current relation process next
								if(subIndex>=relrecids.length  || relrecids[subIndex]==recordId){
									getRelatedAndRemoveThem(index+1);
									return;
								}
								//remove and continue with next record
								removeRecord(request,relrecids[subIndex],function(){
									processRelatedRecord(subIndex+1);
								});
							}
						}else{
							getRelatedAndRemoveThem(index+1);
						}
					});
				}



			});
		}else{
			doneRemovingRecords();
		}
		function doneRemovingRecords(){
			console.log("Deleting  "+record.recordId);
			CouchBaseUtil.removeDocumentByIdFromContentBucket(record.recordId,function(response){
				callback({success:"success"});
			});	
		}

	});	

}
exports.removeRecord = removeRecord;


function extractImagesAndDelete(record,callback){
	deleteImagesFromStruct(record);
	if(typeof callback=="function"){
		callback();
	}
}
exports.extractImagesAndDelete = extractImagesAndDelete;
//since all images are in objects {cloudinaryID:"CCCCIIIIIDDDD"}
function deleteImagesFromStruct(record){
	for(var key in record){
		if(Array.isArray(record[key])){
			deleteImagesFromArray(record[key]);
		}else if(typeof record[key]=="object"){
			deleteImagesFromStruct(record[key])
		}else if(key=="cloudinaryId"){
			logger.info({type:"Deleting Image",imageId:record[key]});
			cloudinary.uploader.destroy(record[key], function(result) {console.log(result)}, { invalidate: true });
		}
	}
}
function deleteImagesFromArray(recArray){
	if(Array.isArray(recArray)){
		recArray.forEach(function(entry){
			if(Array.isArray(entry)){
				deleteImagesFromArray(entry);
			}else if(typeof entry=="object"){
				deleteImagesFromStruct(entry)
			}
		})
	}
}



function addImagesToCloudinary(data,callback){
	if(data.url && data.id){
		cloudinary.v2.uploader.upload(data.url, {"public_id":data.id},function(error,result) { 
			//console.log(result)
			if(result){
				callback("success "+ data.id )
			}else{
				callback("error"+ data.id);
			}
		});	
	}else if(data.data){
		cloudinary.v2.uploader.upload(data.data, {"public_id":data.id},
			    function(error, result) {	
					if(result){
						callback("success "+ data.id )
					}else{
						callback("error"+ data.id);
					}
				});
	}else{
		callback("Retry "+data.url)
	}
}
exports.addImagesToCloudinary=addImagesToCloudinary;


function updateImageAnnotation(data,callback){
	if(data.recordId && data.property && data.newId && data.oldId){//check values exist or not 
		//getting the record
		CouchBaseUtil.getDocumentByIdFromContentBucket(data.recordId,function(recordReq){
			if(recordReq.error){
				callback(recordReq+" not found");
				return;
			}
			var record=recordReq.value;
			var cloudinaryId=data.oldId;
			/*if(data.oldId.split(".").length>2){
				var temp=data.oldId.split(".")[(data.oldId.split(".").length-2)];
				if(temp.split("/").length>0){
					cloudinaryId=temp.split("/")[temp.split("/").length-1];
				}
			}*/
			if(record[data.property] && record[data.property].length>0 && cloudinaryId!=""){
				// function to get the oldId position and update it 
				var flag=false;
				var temp=JSON.stringify(record[data.property]);
				if(temp.indexOf(cloudinaryId)!=-1){
					temp=temp.replace(new RegExp(cloudinaryId, 'g'), data.newId);
					var newTemp=JSON.parse(temp);
					record[data.property]=newTemp;
					flag=true;
					CouchBaseUtil.upsertDocumentInContentBucket(data.recordId,record,function(res){
						try{
							require('./socket.io.js').alertRoom(data.recordId,{});
						}catch(err){}
						callback("Success");
					})
				}
				
				/*updatePropertyValue(record[data.property],"",function(result){
					var temp=eval("record['"+data.property+"']"+""+result);
					console.log(result,temp, record[data.property])
					//value updating
					
					
				});
				/*function updatePropertyValue(recordValue,position,callback){
					if(Array.isArray(recordValue)){
						//it's an array iterate to find 
						recordValue.map(function(innerRecordValue,index){
							updatePropertyValue(innerRecordValue,position+"["+index+"]",callback);
						})
					}else{
						if(Object.keys(recordValue) && Object.keys(recordValue).length>0){
							if(Object.keys(recordValue).indexOf("cloudinaryId")!=-1 && Object.keys(recordValue).indexOf("imageName")!=-1 ){
								//get cloudinaryId from oldId url
								var cloudinaryId="";
								if(data.oldId.split(".").length>2){
									var temp=data.oldId.split(".")[(data.oldId.split(".").length-2)];
									if(temp.split("/").length>0){
										cloudinaryId=temp.split("/")[temp.split("/").length-1];
									}
								}
								if(cloudinaryId==recordValue.cloudinaryId){
									flag=true;
									callback(position);	
									return;
								}else{
								}
							}else{
								Object.keys(recordValue).map(function(innerValue,index){
									updatePropertyValue(recordValue[innerValue],position+"."+Object.keys(recordValue)[index],callback);
								})
							}
						}else{
						}
					}
				}*/
				if(!flag){
					callback("Error Not Found");
				}
			}else{
				callback("Data Error Contact Administrator");
			}
		})
	}else{
		callback("Data Error Contact Administrator");
	}
	
	
	
	
}
exports.updateImageAnnotation=updateImageAnnotation;

//creates header string for a record with its schema["@header"]
function createRecordHeader(schema,record,callback){
	var headerString="";
	if(typeof schema=="object" && typeof record=="object" && Array.isArray(schema["heading"])){
		calcValue(0);
		function calcValue(index){
			if(index<schema["heading"].length){
				if(schema["heading"][index].indexOf("this")==0){
					TriggerController.expEvaluator(record,schema["heading"][index],function(exprData){
						if(Array.isArray(exprData)){
							exprData.forEach(function(ek){
								if(typeof ek=="string"){
									headerString+=ek+"  ";
								}
							})
						}else if(typeof exprData!="object"){
							headerString+=exprData+"  ";
						}
						calcValue(index+1)
					});
				}else{
					headerString+=schema["heading"][index]+" ";
					calcValue(index+1);
				}
				
			}else{
				callback(headerString.trim());
			}
		}
	}else{
		callback(headerString.trim());
	}
}

/**
 * data { record,schema,keys }
 * keys are updated just now :Array
 * @param data
 * @param callback
 */
function evaluateFormulas(data,callback){
	var record=data.record;
    var schema=data.schema;
    var allFormulas=[];//holds current formula calculation keys
    var updatedKeys=[];
    if(Array.isArray(data.keys)){
    	updatedKeys=data.keys;
    }
	for(var key in schema["@properties"]){
        if(!Array.isArray(schema["@properties"][key]) &&
				schema["@properties"][key]!=null && 
				schema["@properties"][key].dataType &&
				schema["@properties"][key].dataType.type=="formula"){
        	//if formula field is effected with curent updatedKeys add it to processing list
        	//or if the value is empty add to processing
        	for(var i=0;i<updatedKeys.length;i++){
        		if(schema["@properties"][key].dataType.expression && 
        				schema["@properties"][key].dataType.expression.indexOf(updatedKeys[i])>-1){
        			allFormulas.push(key);
        			break;
        		}else if(!record[key]){
        			allFormulas.push(key);
        			break;
        		}
        	}
        }
    }
    calculateFormula(0);
    function calculateFormula(index){
        if(index<allFormulas.length){
        	calculateFormulaValue({key:allFormulas[index],schema:schema,record:record},function(result){
        		if(result!=undefined && result!=null  && JSON.stringify(record[allFormulas[index]])!=JSON.stringify(result)){
        			record[allFormulas[index]]=result;
        		}
				calculateFormula(index+1);
        	});
        }else{
        	if(typeof callback=="function"){
        		callback(record);
        	}
        }
    }
}
exports.evaluateFormulas=evaluateFormulas;
/**
 * data { key,record,schema}
 * @param data
 * @param callback
 */
function calculateFormulaValue(data,callback){
	/**
	 *
		sum poLines__amount(PurchaseOrder)
		#author__recordId(Message
		City__cityName(MfrProCatCity)
		
		(MfrRFQResponse)
		MfrRFQ__quantity * MfrRFQ__unitPrice
		
		(PurchaseOrderLines)
		quantity * item__price
	 */
	var key=data.key
	var record=data.record;
    var schema=data.schema;
    var formulaField = schema["@properties"][key];
    var separators = [' ', '\\\+', '-', '\\\(', '\\\)', '\\*', '/', ':', '\\\?'];
	var expression = schema["@properties"][key].dataType.expression.trim();
	//formula function hack
	if(expression.indexOf("sum")==0){
		expression=expression.replace("sum","");
		expression=expression.trim();
	}
	var tokens = expression.split(new RegExp(separators.join('|'), 'g'));
    var formulaResult;
    //formula may contain tokens from multiple fields 
    //for any one token successfull calculation the result should be sent back
	var valueCalculated=[];//holds individual tokens status
	var NA="";
	evaluateTokens(0);
	function evaluateTokens(i){
		if(i>=tokens.length){
			//if any one token is evaluated forumala result updated
			if(valueCalculated.indexOf(true)>-1){
				try{
					formulaResult=eval(expression);
				}catch(err){
					logger.error({
						type:"GRS:calculateFormulaValue",
						error:err.message,
						recordId:data.record.recordId,
						expression:expression,
						key:key
					});
				}
			}
			callback(formulaResult);
		}else{
			//if token is not a number then calculate its value
			//ex: in 	`2 * quantity`	 2 token can be left, since it is number
			if(tokens[i].trim() != "" &&  isNaN(+tokens[i]) && expression.search(tokens[i]) != -1){
				
					var ffFields = tokens[i].split("__");//MfrRFQ__quantity * MfrRFQ__unitPrice// ffFileds holde[MfrRFQ, quantity]
					//if it is with systemproperties or start with # then value is in system properties
					if(tokens[i].indexOf("#") == 0 ||
						tokens[i].indexOf("author") == 0 ||
						tokens[i].indexOf("editor") == 0 ||
						tokens[i].indexOf("dateModified") == 0 ||
						tokens[i].indexOf("dateCreated") == 0 ||
						tokens[i].indexOf("org") == 0){
						//remove #
						ffFields[0]=ffFields[0].replace("#","");
						if(ffFields.length==1){
							//if direct value reffered
							expression = expression.replace(tokens[i], '"'+record[tokens[i]]+'"');
							valueCalculated.push(true);
							evaluateTokens(i+1);
						}else{
							//in other cases like `org.name` `org.address.city` etc
							ivaluateExpression({record:record,expression:"this."+tokens[i].replace("#","").replace(/__/g,".")},function(result){
								if(result && result!="error"){
									expression = expression.replace(tokens[i], '"'+result+'"');
									valueCalculated.push(true);
								}else{
									expression = expression.replace(tokens[i], '"'+"NA"+'"');
									valueCalculated.push(false);
								}
								evaluateTokens(i+1);
						    });
						}
					}else if(ffFields.length == 1){//if direct value reffered
						var oneValue=JSON.stringify(record[tokens[i]]);
						if(typeof record[tokens[i]] == "object"){
							oneValue=("JSON.parse('"+JSON.stringify(record[tokens[i]])+"')").replace(/\\\"/g,"");
						}
						valueCalculated.push(true);
						expression = expression.replace(tokens[i], oneValue);
						evaluateTokens(i+1);
					}else if(ffFields.length == 2){//in other casese like this.mfr.name, this.collection.mfr etc
						if(record[ffFields[0]]){//if this.something exists 
							if(schema["@properties"][ffFields[0]] &&
									schema["@properties"][ffFields[0]].dataType && 
									schema["@properties"][ffFields[0]].dataType.type){
									//if the field is object
									if(schema["@properties"][ffFields[0]].dataType.type=="object"){
										ivaluateExpression({record:record,expression:"this."+tokens[i].replace("#","").replace(/__/g,".")},function(result){
											if(result && result!="error"){
												var oneValue=JSON.stringify(result);
												if(typeof result =="object"){
													oneValue=("JSON.parse('"+JSON.stringify(result)+"')").replace(/\\\"/g,"");
												}
												expression = expression.replace(tokens[i], oneValue);
												valueCalculated.push(true);
											}else{
												expression = expression.replace(tokens[i], '"'+"NA"+'"');
												valueCalculated.push(false);
											}
											evaluateTokens(i+1);
									    });
									//if reffering from struct
									}else if(schema["@properties"][ffFields[0]].dataType.type=="struct"){
										expression = expression.replace(tokens[i], '"'+record[ffFields[0]][ffFields[1]]+'"');
										valueCalculated.push(true);
										evaluateTokens(i+1);
									//if referring from an array
									}else if(schema["@properties"][ffFields[0]].dataType.type=="array" && Array.isArray(record[ffFields[0]])){
										var innerArrayValue="";
										//array of structs
										if(schema["@properties"][ffFields[0]].dataType.elements.type=="struct"){
											for(var j=0;j<record[ffFields[0]].length;j++){
												if(innerArrayValue){
													innerArrayValue+=" + ";
												}
												innerArrayValue+=record[ffFields[0]][j][ffFields[1]];
												valueCalculated.push(true);
											}
											//array of objects
											try{
                        innerArrayValue=((innerArrayValue!="")?eval(innerArrayValue):"");
		                  }catch(err){
		                  	logger.error({
		                  		type:"GRS:calculateFormulaValue:array:struct",
		                  		error:err.message,
		                  		token:tokens,
		                  		key:key,
		                  		recordId:data.record.recordId
		                  	});
		                  }
		                  expression = expression.replace(tokens[i], '"'+innerArrayValue+'"');
		                	evaluateTokens(i+1);
										}else if(schema["@properties"][ffFields[0]].dataType.elements.type=="object"){
											TriggerController.expEvaluator(record,"this."+tokens[i].replace("#","").replace(/__/g,"."),function(exprData){
													if(Array.isArray(exprData)){
														exprData.forEach(function(ek){
															if(innerArrayValue){
																innerArrayValue+=" + ";
															}
															innerArrayValue+=JSON.stringify(ek);
														})
													}else if(typeof exprData!="object"){
														innerArrayValue+=JSON.stringify(exprData);
													}
													try{
				                    innerArrayValue=((innerArrayValue!="")?eval(innerArrayValue):"");
						               }catch(err){
						               		logger.error({
								            		type:"GRS:calculateFormulaValue:array:object",
								            		error:err.message,
								            		token:tokens,
								            		key:key,
								            		recordId:data.record.recordId
								            	});
						               }
						               expression = expression.replace(tokens[i], '"'+innerArrayValue+'"');
						               valueCalculated.push(true);
													 evaluateTokens(i+1);
												});
											
                      }else{
                     		try{
                     			innerArrayValue=((innerArrayValue!="")?eval(innerArrayValue):"");
                     		}catch(err){
                     			logger.error({
				                		type:"GRS:calculateFormulaValue:array:default",
				                		error:err.message,
				                		token:tokens,
				                		key:key,
				                		recordId:data.record.recordId
				                	});
                     		}
		                  expression = expression.replace(tokens[i], '"'+innerArrayValue+'"');
											evaluateTokens(i+1);
										}
                  }else{
                  		expression = expression.replace(tokens[i], '"'+record[ffFields[0]][ffFields[1]]+'"');
                  		evaluateTokens(i+1);
                  }
            	}else{
            		evaluateTokens(i+1);
            	}
						}else{
							expression = expression.replace(tokens[i], "NA");
							valueCalculated.push(false);
							evaluateTokens(i+1);
						}
						
					}else{//in other cases
						ivaluateExpression({record:record,expression:"this."+tokens[i].replace(/__/g,".")},function(result){
							if(result && result!="error"){
								expression = expression.replace(tokens[i], '"'+result+'"');
								valueCalculated.push(true);
							}else{
								expression = expression.replace(tokens[i], '"'+"NA"+'"');
								valueCalculated.push(false);
							}
							evaluateTokens(i+1);
					   });
					}
			}else{
				valueCalculated.push(true);
				evaluateTokens(i+1);
			}
			
		}
	}
}
function ivaluateExpression(body,callback){
	TriggerController.expEvaluator(body.record,body.expression,function(exprData){
		if(typeof callback=="function"){
			callback(exprData);
		}
	});
}


/*
 * Audit Controllers
 */

//Creates audit record in audit bucket
function createAudit(schema,record,update){
	if(!schema || typeof schema !='object'){
		schema={};
	}
	var audit={
			type:"create",
			editor:record.editor,
			dateModified:record.dateModified,
			schema:schema["@id"],
			recordId:record.recordId,
			heading:(record.record_header?record.record_header:((schema["@identifier"] && record[schema["@identifier"]])?record[schema["@identifier"]]:"")),
			subscribers:[record.recordId,record.editor,record.org],
			auditingValue:(schema["@auditingId"] && record[schema["@auditingId"]])?record[schema["@auditingId"]]:undefined
	};
	if(Array.isArray(schema["@audit"])){
		for(var index in schema["@audit"]){
			if(record[schema["@audit"][index]] && audit.subscribers.indexOf(record[schema["@audit"][index]])==-1 )
				audit.subscribers.push(record[schema["@audit"][index]]);
		}
	}
	if(typeof update == "string" && update=="HardDelete"){
		audit.type="delete";
	}else if(update){
		audit.type="update";
		audit.editor=update.editor;
		audit.dateModified=update.dateModified;
		audit.update=update.update;
	}
	try{
		var year=audit.dateModified.split(" ")[0].split("/")[0];
		var month=audit.dateModified.split(" ")[0].split("/")[1];
		var day=audit.dateModified.split(" ")[0].split("/")[2];
		var hour=audit.dateModified.split(" ")[1].split(":")[0];
		var minut=audit.dateModified.split(" ")[1].split(":")[1];
		var second=audit.dateModified.split(" ")[1].split(":")[2];
		audit.sortDate=year+month+day+hour+minut+second;
	}catch(err){}
	CouchBaseUtil.insertDocumentInAuditBucket(global.guid(),audit)
}
//get audits of a subscriber
function getAudits(data,callback){
	var query = 'SELECT * FROM audit WHERE ANY item IN subscribers SATISFIES item = $1 END ORDER BY dateModified DESC';
	query +=" LIMIT "+(data.limit?data.limit:global.auditLimitCount)+" ";
	if(typeof data.skip !="undefined" && data.skip!=null){
		query +=" OFFSET "+data.skip+" ";
	}
	/*var qo=N1qlQuery.fromString(query);
	qo.adhoc = false;*/
	CouchBaseUtil.executeN1QLInAuditBucket(query,{parameters:[data.recordId]},function(results){
		callback(results);
	});
}
exports.getAudits=getAudits;
//count total audits of a subscriber
function getTotalAudits(data,callback){
	var query = 'SELECT count(*) AS total FROM audit  WHERE ANY item IN subscribers SATISFIES item = $1 END ';
	//query.adhoc = false;
	CouchBaseUtil.executeN1QLInAuditBucket(query,{parameters:[data.recordId]},function(results){
		try{callback({total:results[0].total});}catch(err){callback({total:0})}
	});
}
exports.getTotalAudits=getTotalAudits;



/**
 * Reports Queries execution
 */
function getResults(data,callback){
	var query =data.query;
	query +=" LIMIT "+(data.limit?data.limit:global.auditLimitCount)+" ";
	if(typeof data.skip !="undefined" && data.skip!=null){
		query +=" OFFSET "+data.skip+" ";
	}
	CouchBaseUtil.executeN1QLInAuditBucket(query,{parameters:data.params},function(results){
		callback(results);
	});
}
exports.getResults=getResults;

function getTotalResults(data,callback){
	var query=data.query;
	query=query.replace("SELECT","select");
	query=query.replace("FROM","from");
	query=query.replace(query.substring(query.lastIndexOf("select")+6,query.lastIndexOf("from"))," count(*) as total ");
	CouchBaseUtil.executeN1QLInAuditBucket(query,{parameters:data.params},function(results){
		try{callback({total:results[0].total});}catch(err){callback({total:0})}
	});
}
exports.getTotalResults=getTotalResults;
