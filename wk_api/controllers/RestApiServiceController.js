/**
 * @author Saikiran Vadlakonda
 * created D:13-07-2016
 * @refer https://github.com/aacerox/node-rest-client
 */
process.env.DEBUG=true;
var urlParser=require('./URLParser');
//var log=require("../utils/Logger.js");
var logger = require('../services/logseed').logseed;
var CouchBaseUtil=require('./CouchBaseUtil');
var couchbase = require('couchbase');
var GenericServer=require('./GenericServer.js');
var GenericSummeryServer=require('./GenericSummeryServer.js');
var GenericRecordServer=require('./GenericRecordServer.js');
var GenericRelatedRecordsServer=require('./GenericRelatedRecordsServer.js');
var utility=require('./utility.js');
var ContentServer=require('../ContentServer.js');
var Mailgun = require('../services/clsMailgun.js');
var SchemaController=require('./SchemaController');
var QuickBooks = require("../services/QuickBooksService");
var ViewQuery = couchbase.ViewQuery;
var ContentServer=require('../ContentServer.js');
var global=require('../utils/global.js');
var UserController=require('./UserController.js');

var getDocumentByIdFromContentBucket=CouchBaseUtil.getDocumentByIdFromContentBucket;
var getDocumentByIdFromMasterBucket=CouchBaseUtil.getDocumentByIdFromMasterBucket;
var getDocumentByIdFromDefinitionBucket=CouchBaseUtil.getDocumentByIdFromDefinitionBucket;

var updateDocumentInContentBucket=CouchBaseUtil.upsertDocumentInContentBucket;
var updateDocumentInMasterBucket=CouchBaseUtil.upsertDocumentInMasterBucket;
var updateDocumentInDefinitionBucket=CouchBaseUtil.upsertDocumentInDefinitionBucket;

var upsertDocumentInContentBucket=CouchBaseUtil.upsertDocumentInContentBucket;
var upsertDocumentInMasterBucket=CouchBaseUtil.upsertDocumentInMasterBucket;
var upsertDocumentInDefinitionBucket=CouchBaseUtil.upsertDocumentInDefinitionBucket;

var executeViewInContentBucket=CouchBaseUtil.executeViewInContentBucket;
var executeViewInMasterBucket=CouchBaseUtil.executeViewInMasterBucket;
var executeViewInDefinitionBucket=CouchBaseUtil.executeViewInDefinitionBucket;

var getDocumentsByIdsFromContentBucket=CouchBaseUtil.getDocumentsByIdsFromContentBucket;
var getDocumentsByIdsFromMasterBucket=CouchBaseUtil.getDocumentsByIdsFromMasterBucket;
var getDocumentsByIdsFromDefinitionBucket=CouchBaseUtil.getDocumentsByIdsFromDefinitionBucket;


function service(request, response){
	try {
		
		var operationValue = urlParser.getRequestQuery(request).operation; 
		var body=urlParser.getRequestBody(request);
		var session=request.session;
		if(session && session.userData && (operationValue!="userSignUp" && !session.userData.recordId)){
			response.contentType("application/json");
			response.send({status:false, reason: 'User not logged in, Login and Try.'});
			return;
		}
		switch(operationValue){
		case "checkServiceName":
			var docId=request.body.serviceName;
			//log.info("Checking for Rest API Service docId: "+docId);
			getDocumentByIdFromMasterBucket(docId, function(results) {
				if(results.error){
					response.contentType("application/json");
					response.send({status:true});
				}else{
					response.contentType("application/json");
					response.send({status:false})
				}
				
			});
			break;
		case "saveRestApiService":
			var serviceDoc = request.body.doc;
			var hostname=request.headers.host.split(":")[0];
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			var doc={};
			doc['docType']='RestApiService';
			doc["recordId"]=serviceDoc.serviceName;
			doc['serviceName']=serviceDoc.serviceName;
			doc['apiEndPointURL']=serviceDoc.apiEndPointURL;
			doc['otherConfigs']=[];
			doc['pathAndParams']=serviceDoc.pathAndParams ;
			
			if(serviceDoc.otherConfigs && serviceDoc.otherConfigs.length){
				doc['otherConfigs']=serviceDoc.otherConfigs;
			}
			
			var session=request.session;
			if(session.userData){
				doc["author"]= session.userData.recordId;
				doc["editor"]= session.userData.recordId;
				if(!serviceDoc['dateCreate']){
					doc["dateCreated"]= global.getDate();
				}else{
					doc["dateCreated"]= serviceDoc['dateCreate'];
				}
				doc["dateModified"]= global.getDate();
			}
			if(!serviceDoc.revision){
				doc["revision"]=1;
			}else{
				doc["revision"]=serviceDoc.revision+1;
			}
			doc["cloudPointHostId"]=cloudPointHostId;
			doc['active']=true;
			doc["$status"]="draft";
			
			
			try {
				////log.info(doc['recordId']);
				getDocumentByIdFromMasterBucket(doc["recordId"], function(serviceRec){
					if(serviceRec.error){
						//log.info("Service doc is not found, so creating service doc");
						
						upsertDocumentInMasterBucket(doc["recordId"], doc, function(result){
							if(result.error){
								//log.info("Error while saving service doc, for creating service with "+doc.recordId);
								response.contentType("application/json");
								response.send({status:false, reason: "Error while creating service"});
							}else{
								response.contentType("application/json");
								response.send({status:true, doc: doc});
							}
						});
					}else{
						//log.info("Service doc is found, so creating service doc is not possible, try with editing...");
						response.contentType("application/json");
						response.send({status:false, reason: 'Service already created.'});
					}
				});
			} catch (e) {
				//log.info("Exception raised");
				//log.info(e.stack);
				if(response){
					response.contentType("application/json");
					response.send({status:false, reason: 'Something went wrong, Contact support Team'});
				}
			}
			
			break;
		case "editRestApiService":
			var serviceDoc = request.body.doc;
			var hostname=request.headers.host.split(":")[0];
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			var doc={};
			doc['docType']='RestApiService';
			doc["recordId"]=serviceDoc.serviceName;
			doc['serviceName']=serviceDoc.serviceName;
			doc['apiEndPointURL']=serviceDoc.apiEndPointURL;
			doc['otherConfigs']=[];
			doc['pathAndParams']=serviceDoc.pathAndParams ;
			doc["author"]= serviceDoc.author;
			if(serviceDoc.otherConfigs && serviceDoc.otherConfigs.length){
				doc['otherConfigs']=serviceDoc.otherConfigs;
			}
			
			var session=request.session;
			if(session.userData){
				doc["author"]= serviceDoc.author?serviceDoc.author:session.userData.recordId;
				doc["editor"]= session.userData.recordId;
				if(!serviceDoc['dateCreated']){
					doc["dateCreated"]= global.getDate();
				}else{
					doc["dateCreated"]= serviceDoc['dateCreated'];
				}
				doc["dateModified"]= global.getDate();
			}
			if(!serviceDoc.revision){
				doc["revision"]=1;
			}else{
				doc["revision"]=serviceDoc.revision+1;
			}
			doc["cloudPointHostId"]=cloudPointHostId;
			doc['active']=true;
			doc["$status"]="draft";
			
			
			try {
				//log.info(doc['recordId']);
				upsertDocumentInMasterBucket(doc["recordId"], doc, function(result){
					if(result.error){
						//log.info("Error while saving service doc, for creating service with "+doc.recordId);
						response.contentType("application/json");
						response.send({status:false, reason: "Error while creating service"});
					}else{
						//log.info("Service doc: "+(doc.recordId)+" is edited");
						response.contentType("application/json");
						response.send({status:true, doc: doc});
					}
				});
			} catch (e) {
				//log.info("Exception raised");
				//log.info(e.stack);
				if(response){
					response.contentType("application/json");
					response.send({status:false, reason: 'Something went wrong, Contact support Team'});
				}
			}
			break;
		case "testAPI":
			var serviceData=request.body.serviceDoc;
			var apiURL = serviceData.apiEndPointURL;
			var args={};
			if(Object.keys(serviceData.parameters).length && apiURL.indexOf("$")==-1){
				args['parameters']=serviceData.parameters;
			}
			
			
			var Client = require('node-rest-client').Client;
			var client = new Client();
			
			//log.info(JSON.stringify(args));
			//log.info(apiURL);
			if(apiURL){
				switch (serviceData.method){
				case "GET":
					client.get(apiURL, args, function(data, res){
						response.contentType("application/json");
						response.send({status:true, data: data});
					}).on('error', function(d){
						response.contentType("application/json");
						response.send({status:false, data: "Error Occurred with Request, "+(JSON.stringify(d))});
					});
					break;
				case "POST":
					if(Object.keys(serviceData.data).length){
						args['data']=serviceData.data;
					}
					client.post(apiURL, args, function(data, res){
						response.contentType("application/json");
						response.send({status:true, data: data});
					}).on('error', function(d){
						response.contentType("application/json");
						response.send({status:false, data: "Error Occurred with Request, "+(JSON.stringify(d))});
					});
					break;
				case "DELETE":
					client.delete(apiURL, args, function(data, res){
						response.contentType("application/json");
						response.send({status:true, data: data});
					}).on('error', function(d){
						response.contentType("application/json");
						response.send({status:false, data: "Error Occurred with Request, "+(JSON.stringify(d))});
					});
					break;
				case "PUT":
					client.put(apiURL, args, function(data, res){
						response.contentType("application/json");
						response.send({status:true, data: data});
					}).on('error', function(d){
						response.contentType("application/json");
						response.send({status:false, data: "Error Occurred with Request, "+(JSON.stringify(d))});
					});
					break;
				default:
					client.get(apiURL, args, function(data, res){
						response.contentType("application/json");
						response.send({status:true, data: data});
					}).on('error', function(d){
						response.contentType("application/json");
						response.send({status:false, data: "Error Occurred with Request, "+(JSON.stringify(d))});
					});
					/*
					response.contentType("application/json");
					response.send({status:false, data: "Cannot call method: "+(serviceData.method)});
					*/
					break;
				}
				
				client.on('error', function(d){
					response.contentType("application/json");
					response.send({status:false, data: "Error Occurred with API"+(JSON.stringify(d))});
				});
			}else{
				response.contentType("application/json");
				response.send({status:false, data: 'Missing'});
			}
			
			break;
		case "getAllRestApiServices":
			
			var hostname=request.headers.host.split(":")[0];
			var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
			//log.info(cloudPointHostId);
			utility.getAllRestApiServices(cloudPointHostId,function(data){
				if(!data.length){
					response.send({error: "No Records Found"});
				}else{
					//log.info("Total Records length before sorting: "+data.length);
					//log.info(data[0].id);
					data.sort(function(a, b){ return a.id>b.id});
					//log.info("Total Records length after sorting: "+data.length);
					//log.info(data[0].id);
					response.send(data);
				}
			});
			
			break;
			
		case "fetchProjectsNBoards":
			console.log(body);
			var userId = body.userId;
			var orgs= body.orgs;
			console.log(userId, orgs);
			
			
			var orgStng = "[";
			orgs.forEach(function(org){
				orgStng+=("'"+org+"', ");
			});
			
			orgStng = orgStng.replace(/, $/, " ] ");
			
			console.log('orgStng', orgStng);
			
			var qryString = " SELECT array_agg(`records`) AS res "+
            " FROM records WHERE  `docType`='IdeaBoard' "+
            " AND `org` IN "+(orgStng)+
            " AND `author`= '"+(userId)+"' "+
            " GROUP BY `org`";
			
			var N1qlQuery = couchbase.N1qlQuery;
			
			
			CouchBaseUtil.executeViewInContentBucket(N1qlQuery.fromString(qryString),function(boards){
				
				CouchBaseUtil.getDocumentsByIdsFromContentBucket(orgs, function(prjctRecs){
					var revisedBoards=[];
					var revisedPrjcts=[];
					console.log(boards.length);
					
					
					orgs.forEach(function(org){
						if(prjctRecs[org] && prjctRecs[org].value){
							var boardDoc={};
							var prjctDoc={};
							
							boardDoc[prjctRecs[org].value.name]=[];
							prjctDoc[prjctRecs[org].value.name]=prjctRecs[org].value;
							
							boards.forEach(function(board){
								if(board.res && board.res.length>0 && board.res[0].org==org){
									boardDoc[prjctRecs[org].value.name]=board.res;
								}
							});
							revisedBoards.push(boardDoc);
							revisedPrjcts.push(prjctDoc);
						}
						
					});
					
					
					
					
					response.contentType("application/json");
					response.send({'boards':revisedBoards, 'projects':revisedPrjcts});
				});
				
				
			});
			
			break;
		case "userSignUp":
			
			if(request && request.body && request.body.email){
				var userEmailId = (request.body.email).toLowerCase();
				var name=userEmailId;
				var message="Thank you for signing up for Wishkarma!";
				if(request.body.name){
					name=request.body.name;
				}
				if(request.body.message){
					message=request.body.message;
				}
				var userRole = request.body.role;
				var activationCode = ""+utility.guid().replace(/-/g,"")+utility.guid().replace(/-/g,"");
				if(process && process.cwd()){
					
					//console.log(process.cwd());
					
					UserController.getUserDocByEmail({email: userEmailId,displayName:name, activationCode: activationCode, userRole:userRole}, function(userDoc){
						
						if(activationCode==userDoc.activationCode){
							
							var userRoleDoc = {
									  "User": userDoc.recordId,
									  "orgType": "",
									  "roles": [  ],
									  "dependentProperties": {
									    "org": ""
									  },
									  "recordId": "UserRole"+utility.guid(),
									  "org": "public",
									  "docType": "UserRole",
									  "author": "administrator",
									  "editor": "administrator",
									  "dateCreated": global.getDate(),
									  "dateModified":global.getDate(),
									  "revision": 1,
									  "@identifier": "recordId",
									  "@derivedObjName": "UserRole-",
									  "relationDesc": [
									    "User-hasRole-org",
									    "org-hasPerson-User"
									  ],
									  "cloudPointHostId": "wishkarma",
									  "record_header": "",
									  "$status": "published"
									};
							
							switch(userRole){
							case "architect":
								userRoleDoc.roles.push("RoleForArchitect") ;
								break;
							case "designer":
								userRoleDoc.roles.push("RoleForInteriorDesigner") ;
								break;
							case "manufacturer":
								userRoleDoc.roles.push("RoleForManufacturer") ;
								break;
							case "developer":
								userRoleDoc.roles.push("RoleForDeveloper") ;
								break;
							case "supplier":
								userRoleDoc.roles.push("RoleForSupplier") ;
								break;
							case "serviceprovider":
								userRoleDoc.roles.push("RoleForServiceProvider") ;
								break;
							}
							
							
							GenericRecordServer.saveRecord({body:userRoleDoc}, function(res){
								if(res && !res.error){
									console.log("User Role created on public ORG: "+userRoleDoc.recordId);
								}else{
									console.log('error while creating user role on public org',res.error);
								}
							});
							var mailData={ 
									to: userEmailId,
									html: getActivationMailBody(name,emailId,message,activationCode),
									subject: "Welcome to Wishkarma",
									from: "Wishkarma <no-reply@wishkarma.com>",
									inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
									};
							
							console.log("Sending Mail to: ", mailData.to);
							
							Mailgun.sendMail(mailData, function (err, result) {
								console.log("Mail sent");
								response.contentType("application/json");
								response.send({userId:userDoc.recordId, mail: result});
							});
							
						}else if(!userDoc.activationCode){
							userDoc.activationCode=activationCode;
							CouchBaseUtil.upsertDocumentInContentBucket(userDoc.recordId,userDoc,function(result) {
								if (result.error) {
									response.send("Error");
									return;
								}
								var mailData={ 
									to: userEmailId,
									html: getActivationMailBody(name,emailId,message,activationCode),
									subject: "Welcome to Wishkarma",
									from: "Wishkarma <no-reply@wishkarma.com>",
									inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
									};
							
								console.log("Sending Mail to: ", mailData.to);
							
								Mailgun.sendMail(mailData, function (err, result) {
									console.log("Mail sent");
									response.contentType("application/json");
									response.send({userId:userDoc.recordId, mail: result});
								});
							});
						}else{
							
							if(!userDoc.activation){//activation=false
								//existing but not activated, ask him to activate
								
								response.contentType("application/json");
								response.send({userId:userDoc.recordId,	userExists: true, activation: false, msg: 'Kindly activate your profile through mail sent to you!',response: false});
								
							}else{
								//existing and activated user, ask him to login
								
								response.contentType("application/json");
								response.send({userId:userDoc.recordId,	userExists: true, activation: true, msg: 'Your profile has already been created.Kindly Login to your account',response: true});
							}
							
						}
						
					});
				
				} else{
					console.log(process.cwd());
					response.send("Error");
				}
				
			
			}else{
				response.send("Error");
			}
			
			break;
			
			
		case "userSignUpResendEmail":
			
			var emailId = (request.body.email).toLowerCase();
			
			UserController.getUserDocByEmail({email: emailId}, function(userDoc){
				var activationCode = userDoc.activationCode;
				var mailData={ 
						to: emailId,
						html:getActivationMailBody(undefined,emailId,undefined,activationCode),
				
						subject: "Welcome to Wishkarma",
						from: "Wishkarma <no-reply@wishkarma.com>",
						inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
						}
				
				console.log("Sending Mail to: ", mailData.to);
				
				Mailgun.sendMail(mailData, function (err, result) {
					console.log("Mail sent");
					response.contentType("application/json");
					response.send({	userDoc: userDoc, mail: result});
				});
				
			});
			
			
			break;
			
		
		case "changePasswordEmail":
			
			var emailId = (request.body.email).toLowerCase();
			var N1qlQuery = couchbase.N1qlQuery;
			var qryString = "SELECT * FROM records WHERE `docType` = 'User' AND `email` = '"+emailId+"'"; 
			CouchBaseUtil.executeViewInContentBucket(N1qlQuery.fromString(qryString),function(result){
				if(result.length>0 && result[0].records && Object.keys(result[0].records).length>0){
					var userDoc=result.length>0?result[0].records:{};
					if(userDoc.hasOwnProperty("activation") && userDoc.activation){
						
						var resetPasswordCode = ""+utility.guid().replace(/-/g,"")+utility.guid().replace(/-/g,"");
						var mailData={ 
								to: emailId,
								html: "<!DOCTYPE html>" +
										"<html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
											"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"<meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'/>" +
												"<link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'/>" +
												"<link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'/>" +
												"<link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.7.14/css/bootstrap-datetimepicker.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'/>" +
												"<link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'/>" +
											"</head>" +
											"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: Montserrat;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
												"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'>" +
													"<img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'>" +
												"</div>" +
												"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
													"<span style='font-size: 30px;font-family: Montserrat;font-weight: 800;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Reset Your Password</span>" +
												"</div>" +
												"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'>" +
													"<span style='font-size: 14px;font-family: Montserrat;font-weight: 800;color: #3690fb;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>You are almost done, just one more thing..</span>" +
												"</div>" +
												"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
													"<span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><div>Hello "+(emailId)+",</div><div>In order to reset your password please click the button below.</div></span>" +
												"</div>" +
												"<div style='font-family: Montserrat;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 50px 30px 50px 30px'>" +
													"<a href='https://www.wishkarma.com/resetpassword?code="+(resetPasswordCode)+"' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;font-family: Montserrat;margin:10px;'>RESET PASSWORD</a>" +
												"</div>" +
												"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-family: Montserrat;font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>If the button above does not work, copy & paste the following link in your browser:</span></div>" +
												"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 100px;'><span style='font-family: Montserrat;font-size: 13px;color: #4992E3;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>https://www.wishkarma.com/resetpassword?code="+(resetPasswordCode)+"</span></div>" +
												"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Copyright @"+(new Date().getFullYear())+", Wishkarma Media Works LLP, All rights reserved.</span></div>" +
											"</body>" +
										"</html>",
								subject: "Password Reset Request",
								from: "Wishkarma <no-reply@wishkarma.com>",
								inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
								}
						
						console.log("Sending Mail to: ", mailData.to);
						
						Mailgun.sendMail(mailData, function (err, result) {
							console.log("Mail sent");
							response.contentType("application/json");
							response.send({	userDoc: userDoc, mail: result});
						});
						
						userDoc.resetPasswordCode=resetPasswordCode;
						
						GenericRecordServer.saveRecord({body:userDoc}, function(res){
							
						});
						
					}else{
					
						var activationCode = ""+utility.guid().replace(/-/g,"")+utility.guid().replace(/-/g,"");
						userDoc.activationCode=activationCode;
						CouchBaseUtil.upsertDocumentInContentBucket(userDoc.recordId,userDoc,function(result) {
							if (result.error) {
								response.send("Error");
								return;
							}
							var mailData={ 
								to: userDoc.email,
								html: getActivationMailBody(userDoc.email,userDoc.email,"Thank you for signing up for Wishkarma!",activationCode),
								subject: "Welcome to Wishkarma",
								from: "Wishkarma <no-reply@wishkarma.com>",
								inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
								};
						
							console.log("Sending Mail to: ", mailData.to);
						
							Mailgun.sendMail(mailData, function (err, result) {
								console.log("Mail sent");
								response.contentType("application/json");
								response.send({error : "Kindly activate your account" });
							});
						});
					}
					
					
				}else{
					response.contentType("application/json");
					response.send({error : "Email you have entered does not match with our records.", signup:true });
				}
			});
			
			
			break;	
			
		case "setOrgAndRole":
			var userId = request.body.userId;
			var orgType = request.body.orgType;
			var userRole="";
			
			getDocumentByIdFromContentBucket(userId, function(result){
				if(result.value){
					var userDoc=result.value;
					
					var userRole = userDoc.userRole;
					var orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
					try{
						orgDomain=((userDoc.email).split("@")[1]).split(".");
						orgDomain.splice(orgDomain.length-1,1);
						orgDomain=orgDomain.join(".");
					}catch(err){
						orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
					}
					var userMailPre = (userDoc.email).split("@")[0];
					var publicDomains=["gmail",
		              "yahoo",
		              "yahoomail",
		              "email",
		              "hotmail",
		              "outlook",
		              "zoho",
		              "ymail",
		              "rediff",
		              "rediffmail",
		              "aol"];
					if(publicDomains.indexOf(orgDomain.toLowerCase())>-1){
						response.contentType("application/json");
						response.send({	error: 'error while creating user role with public domain'});
						return;
					}
					var orgDoc={
							name: orgDomain,
							docType: orgType,
							org: "public",
							dateCreated: global.getDate(),
							dateModified:global.getDate(),
							orgDomain:[orgDomain],
							featured: "no",
							"about":"",
							"sourceUrl": "",
							"website": "",
							"telephone": "",
							"bannerImage": [],
							"socialShare": "",
							"rating": "",
							"profileImage": [],
							"address": {
							    "streetAddress": "",
							    "addressLocality": "",
							    "addressRegion": "",
							    "addressCountry": "",
							    "postalCode": "",
							    "email": "",
							    "telephone": ""
							  },
							"images": [],
							"socialIdentity": {
							    "facebook": "",
							    "google": "",
							    "twitter": "",
							    "pinterest": ""
							  },
							  "geoLocation": {
							    "latitude": "",
							    "longitude": "",
							    "locationName": ""
							  },
							  "requiredKeys": [
							    "name",
							    "address",
							    "images",
							    "socialIdentity",
							    "phone",
							    "about",
							    "website",
							    "bannerImage",
							    "profileImage"
							  ],
							  revision: 1,
							  "termsAndConditions": [],
							  "@superType": "Organization",
							  "@identifier": "name",
							  "cloudPointHostId": "wishkarma",
							  "$status": "published",
							  "metaTitle": "",
							  "metaDescription":"",
							  "cityName":"",
							  "esMeta":"",
							  "record_header":"",
							  "webCrawlerIndex": false,
							  "author":"administrator",
							  "editor":"administrator",
					};
					
					var userRoleDoc = {
							  "User": userDoc.recordId,
							  "orgType": "",
							  "roles": [ "RoleForMembersManager" ],
							  "dependentProperties": {
							    "org": ""
							  },
							  "recordId": "UserRole"+utility.guid(),
							  "org": "",
							  "docType": "UserRole",
							  "author": "administrator",
							  "editor": "administrator",
							  "dateCreated": global.getDate(),
							  "dateModified":global.getDate(),
							  "revision": 1,
							  "@identifier": "recordId",
							  "@derivedObjName": "UserRole-",
							  "relationDesc": [
							    "User-hasRole-org",
							    "org-hasPerson-User"
							  ],
							  "cloudPointHostId": "wishkarma",
							  "record_header": "",
							  "$status": "published"
							};
					
					switch(userRole){
						case "architect":
							userRole="RoleForArchitect";
							break;
						case "designer":
							userRole="RoleForInteriorDesigner" ;
							break;
						case "manufacturer":
							userRole="RoleForManufacturer";
							break;
						case "developer":
							userRole="RoleForDeveloper" ;
							break;
						case "supplier":
							userRole="RoleForSupplier";
							break;
						case "serviceprovider":
							userRole="RoleForServiceProvider" ;
							break;
						}
					
					CouchBaseUtil.getDocumentByIdFromDefinitionBucket("RoleMappings",function(roles){
						if(roles.value){
							var rolesDoc=roles.value;
							
							userRoleDoc.roles.push((rolesDoc.mappings)[userRole][orgType]) ;
							
							userRoleDoc.orgType = orgType;
							orgDoc.docType=orgType;
							
							orgDoc.recordId = orgDoc.docType+utility.guid();
							
							GenericRecordServer.saveRecord({body:orgDoc}, function(res){
								if(res && !res.error){
									userRoleDoc.org=orgDoc.recordId;
									userRoleDoc.dependentProperties.org=orgDoc.recordId;
									userRoleDoc['record_header'] = userMailPre+" - Role(s) in "+orgDoc.name;
									
									console.log("Org created, creating role");
									
									GenericRecordServer.saveRecord({body:userRoleDoc}, function(res){
										if(res && !res.error){
											console.log("Role created"+userRoleDoc.recordId);
											response.contentType("application/json");
											response.send({	success: true, userRoleDoc:userRoleDoc,orgDoc:orgDoc});
										}else{
											response.contentType("application/json");
											response.send({	error: 'error while creating user role'});
										}
									});
								}else{
									console.log(res.error);
									console.log("Error occurred, removing user role from DB");
									
									GenericRecordServer.removeRecord(request,userRoleDoc.recordId, function(res){
										response.contentType("application/json");
										response.send({	error: 'error while creating Firm'});
									});
								}
							});
							
							
						}else{
							console.log("Error occurred while retrieving Roles in App");
							response.contentType("application/json");
							response.send({	error: 'error while retrieving Roles in App'});
						}
						
						
					});
					
				}else{
					console.log("Error occurred while retrieving User in App");
					response.contentType("application/json");
					response.send({	error: 'error while retrieving User in App'});
				}
			});
			
			break;
			
		
		case "setUserRoleOnPublicOrg":
			var userId = request.body.userId;
			var userRole = request.body.userRole.toLowerCase();
			
			getDocumentByIdFromContentBucket(userId, function(result){
				if(result.value){
					var userDoc=result.value;
					var userMailPre = (userDoc.email).split("@")[0];
					
					userDoc.userRole=userRole;
					
					GenericRecordServer.saveRecord({body:userDoc}, function(res){
						if(res && !res.error){
							console.log("Role doc updated"+userDoc.recordId);
						}else{
							console.log("error while updating user");
						}
					});
					
					
					var userRoleDoc = {
							  "User": userDoc.recordId,
							  "orgType": "",
							  "roles": [],
							  "dependentProperties": {
							    "org": ""
							  },
							  "recordId": "UserRole"+utility.guid(),
							  "org": "",
							  "docType": "UserRole",
							  "author": "administrator",
							  "editor": "administrator",
							  "dateCreated": global.getDate(),
							  "dateModified":global.getDate(),
							  "revision": 1,
							  "@identifier": "recordId",
							  "@derivedObjName": "UserRole-",
							  "relationDesc": [
							    "User-hasRole-org",
							    "org-hasPerson-User"
							  ],
							  "cloudPointHostId": "wishkarma",
							  "record_header": "",
							  "$status": "published"
							};
					
					switch(userRole){
						case "architect":
							userRoleDoc.roles.push("RoleForArchitect");
							break;
						case "designer":
							userRoleDoc.roles.push("RoleForInteriorDesigner");
							break;
						case "manufacturer":
							userRoleDoc.roles.push("RoleForManufacturer");
							break;
						case "developer":
							userRoleDoc.roles.push("RoleForDeveloper");
							break;
						case "supplier":
							userRoleDoc.roles.push("RoleForSupplier");
							break;
						case "serviceprovider":
							userRoleDoc.roles.push("RoleForServiceProvider");
							break;
						}
					
					userRoleDoc.org="public";
					userRoleDoc['record_header'] = userMailPre+" - Role(s) in public";
					
					GenericRecordServer.saveRecord({body:userRoleDoc}, function(res){
						if(res && !res.error){
							console.log("Role created"+userRoleDoc.recordId);
							response.contentType("application/json");
							response.send({	success: true});
						}else{
							response.contentType("application/json");
							response.send({	error: 'error while creating user role'});
						}
					});
					
				}else{
					console.log("Error occurred while retrieving User in App");
					response.contentType("application/json");
					response.send({	error: 'error while retrieving User in App'});
				}
			});
			
			break;
		
		case "setUserRoleOnOrg":
			var userId = request.body.userId;
			var userRole = request.body.userRole.toLowerCase();
			var orgDoc = request.body.orgDoc;
			
			getDocumentByIdFromContentBucket(userId, function(result){
				if(result.value){
					var userDoc=result.value;
					var userMailPre = (userDoc.email).split("@")[0];
					
					var N1qlQuery = couchbase.N1qlQuery;
					var qryString = " SELECT `records`  FROM records WHERE `docType`='UserRole' AND `User`='"+(userDoc.recordId)+"'  AND `org`='"+(orgDoc.recordId)+"'";
							
						CouchBaseUtil.executeViewInContentBucket(N1qlQuery.fromString(qryString),function(result){
							if(result && result.length==0){
								console.log("Roles not found, create a role");
								CouchBaseUtil.getDocumentByIdFromDefinitionBucket("RoleMappings",function(roles){
									if(roles.value){
										var rolesDoc=roles.value;
										var roleOnOrg="";
										var userRoleDoc = {
											  "User": userDoc.recordId,
											  "orgType": orgDoc.docType,
											  "roles": [ ],
											  "dependentProperties": {
											    "org": ""
											  },
											  "recordId": "UserRole"+utility.guid(),
											  "org": "",
											  "docType": "UserRole",
											  "author": "administrator",
											  "editor": "administrator",
											  "dateCreated": global.getDate(),
											  "dateModified":global.getDate(),
											  "revision": 1,
											  "@identifier": "recordId",
											  "@derivedObjName": "UserRole-",
											  "relationDesc": [
											    "User-hasRole-org",
											    "org-hasPerson-User"
											  ],
											  "cloudPointHostId": "wishkarma",
											  "record_header": "",
											  "$status": "published"
											};
										
										switch(userRole){
											case "architect":
												roleOnOrg="RoleForArchitect";
												break;
											case "designer":
												roleOnOrg="RoleForInteriorDesigner";
												break;
											case "manufacturer":
												roleOnOrg="RoleForManufacturer";
												break;
											case "developer":
												roleOnOrg="RoleForDeveloper";
												break;
											case "supplier":
												roleOnOrg="RoleForSupplier";
												break;
											case "serviceprovider":
												roleOnOrg="RoleForServiceProvider";
												break;
											}
										
										
										userRoleDoc.roles.push((rolesDoc.mappings)[roleOnOrg][userRoleDoc.orgType]) ;
										userRoleDoc.org=orgDoc.recordId;
										userRoleDoc.dependentProperties.org=orgDoc.recordId;
										userRoleDoc['record_header'] = userMailPre+" - Role(s) in "+orgDoc.name;
										GenericRecordServer.saveRecord({body:userRoleDoc}, function(res){
											if(res && !res.error){
												console.log("Role created"+userRoleDoc.recordId);
												response.contentType("application/json");
												response.send({	success: true, userRoleDoc:userRoleDoc});
											}else{
												console.log("Error while creating user role on org"+orgDoc.recordId);
											}
										});
										
										
									}
								});
							}else{
								console.log("Roles exists");
								response.contentType("application/json");
								response.send({	success: true, userRoleDoc:result[0].value});
							}
						});
					
				}else{
					console.log("Error occurred while retrieving User in App");
					response.contentType("application/json");
					response.send({	error: 'error while retrieving User in App'});
				}
			});
			
			break;
		
		case "validateCaptcha":
			var captchaStr = request.body.captchaStr;
			
			var clientIP=request.headers['X-Real-IP'] || request.connection.remoteAddress;
			require('https').get("https://www.google.com/recaptcha/api/siteverify?secret=6LfgLC0UAAAAAGkrP1vS6_grUX8oAx7zLIyLwTA1&response="+captchaStr+"&remoteip="+clientIP, function(res){
				var rawData="";
				
				res.on('data', (chunk) => { rawData += chunk; });
				res.on('end', () => {
				    try {
				      var result = JSON.parse(rawData);
				      response.contentType("application/json");
				      response.send(result);
				    } catch (e) {
				      console.error(e.message);
				      response.send();
				    }
				});
			}).on('error', (e) => {
			  console.error('Got error: ${e.message}');
			  response.send({error: 'Internal Server Error'});
			});
			
			break;
			
		default:
			console.log("No operation value found");
			response.send({status:false, data: "Error Occurred with API"});
			break;
		}
	}catch (e) {
		console.log(e);
		response.send({status: false, Error:true});
	}
}




exports.service=service;




/**
 * 
 */
exports.invokeRestApiService = function(data, callback){
	var Client = require('node-rest-client').Client;
	var client = new Client();
	
	if(Object.keys(data.options).length){
		client = new Client(data.options);
	}
	
	
	var args={
		path: data.path?data.path:undefined,
		parameters: data.parameters?data.parameters:undefined,
		data: data.data?data.data:undefined
	};
	
	switch(data.method){
	case "GET":
		client.get(data.apiEndPoint, args, function(data, res){
			if(callback){
				callback(data);
			}else{
				console.log(data);
			}
		});
		break;
	case "POST":
		client.post(data.apiEndPoint, args, function(data, res){
			if(callback){
				callback(data);
			}else{
				console.log(data);
			}
		});
		break;
	case "DELETE":
		client.delete(data.apiEndPoint, args, function(data, res){
			if(callback){
				callback(data);
			}else{
				console.log(data);
			}
		});
		break;
	case "PUT":
		client.put(data.apiEndPoint, args, function(data, res){
			if(callback){
				callback(data);
			}else{
				console.log(data);
			}
		});
		break;
	default:break;
		client.get(data.apiEndPoint, args, function(data, res){
			if(callback){
				callback(data);
			}else{
				console.log(data);
			}
		});
	}
	
}



{/*html: "<!DOCTYPE html><html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
	"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700,700italic,400italic,900' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Julius+Sans+One:500,600,400' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Raleway:400,100,200,300,500,600,700&subset=all' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.7.14/css/bootstrap-datetimepicker.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
	"</head>" +
	"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: &quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
		"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
			"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'><img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'>" +
			"</div>" +
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
				"<span style='font-size: 20px;font-family: Montserrat;font-weight: 100;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Activate your account!</span>" +
			"</div>" +
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
				"<span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><div>Hello "+(emailId)+",</div><div>Thank you for signing up for Wishkarma! In order to activate your account please click the button below to verify your email address.</div></span></div><div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 30px 30px 50px 30px'><a href='https://www.wishkarma.com/activate?code="+(activationCode)+"' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;font-family: Montserrat;margin:10px;'>ACTIVATE</a></div><div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-family: Montserrat;font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>If the button above does not work, paste this into your browser:</span></div><div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 100px;'><span style='font-family: Montserrat;font-size: 13px;color: #4992E3;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>https://www.wishkarma.com/activate?code="+(activationCode)+"</span></div><div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Copyright @"+(new Date().getFullYear())+", Wishkarma Media Works LLP, All rights reserved.</span></div></body></html>",
*/}




function getActivationMailBody(name,emailId,message,activationCode){
return ("<!DOCTYPE html><html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700,700italic,400italic,900' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Julius+Sans+One:500,600,400' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Raleway:400,100,200,300,500,600,700&subset=all' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.7.14/css/bootstrap-datetimepicker.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'></head>" +
"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: &quot;Montserrat;,Montserrat,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'><img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'></div>" +
"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-size: 30px;font-family: Montserrat;font-weight: 800;color: #00bfff;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Activate your account!</span></div>" +
"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 30px;'><span style='font-size: 14px;font-family: Montserrat;font-weight: 800;color: #3690fb;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>You are almost done, just one more thing..</span></div>" +
	"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
			"<div>Hello "+((name?name:emailId))+",</div>" +
			((message)?(
				"<div>"+(message)+"</div>"+
				"<div>In order to activate your account please click the below button to verify your email address.</div>"
			):(
					"<div>Thank you for signing up with Wishkarma! In order to activate your </div>"+
					"<div>account please click the below button to verify your email address.</div>" 
			)) +
		"</span>" +
	"</div>" +
		"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 50px 30px 50px 30px'>" +
			"<a href='https://www.wishkarma.com/activate?code="+(activationCode)+"' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;font-family: Montserrat;margin:10px;'>ACTIVATE" +
			"</a>" +
		"</div>" +
		"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
			"<span style='font-family: Montserrat;font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>If the button above does not work, copy & paste the following link in your browser:</span>" +
		"</div>" +
		"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 100px;'><span style='font-family: Montserrat;font-size: 13px;color: #4992E3;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>https://www.wishkarma.com/activate?code="+(activationCode)+"</span>" +
		"</div>" +
		"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Copyright @"+(new Date().getFullYear())+", Wishkarma Media Works LLP, All rights reserved.</span></div></body></html>");
}


/*function getActivationMailBodybkp(emailId,activationCode){
	return ("<!DOCTYPE html><html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
	"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
	"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700,700italic,400italic,900' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat:400,300,700' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Montserrat' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Julius+Sans+One:500,600,400' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://fonts.googleapis.com/css?family=Raleway:400,100,200,300,500,600,700&subset=all' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.7.14/css/bootstrap-datetimepicker.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'><link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'></head>" +
	"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: &quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
	"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
	"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'><img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'></div>" +
	"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-size: 30px;font-family: Montserrat;font-weight: 800;color: #00bfff;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Activate your account!</span></div>" +
	"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 30px;'><span style='font-size: 14px;font-family: Montserrat;font-weight: 800;color: #3690fb;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>You are almost done, just one more thing..</span></div>" +
		"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
			"<span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
				"<div>Hello "+(emailId)+",</div>" +
					"<div>Thank you for signing up for Wishkarma! In order to activate your </div>"+
					"<div>account please click the button below to verify your email address.</div>" +
			"</span>" +
		"</div>" +
			"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 50px 30px 50px 30px'>" +
				"<a href='https://www.wishkarma.com/activate?code="+(activationCode)+"' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;font-family: Montserrat;margin:10px;'>ACTIVATE" +
				"</a>" +
			"</div>" +
			"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
				"<span style='font-family: Montserrat;font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>If the button above does not work, paste this into your browser:</span>" +
			"</div>" +
			"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 100px;'><span style='font-family: Montserrat;font-size: 13px;color: #4992E3;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>https://www.wishkarma.com/activate?code="+(activationCode)+"</span>" +
			"</div>" +
			"<div style='text-align: center;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'><span style='font-family: Montserrat;font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>Copyright @"+(new Date().getFullYear())+", Wishkarma Media Works LLP, All rights reserved.</span></div></body></html>");

	}*/
