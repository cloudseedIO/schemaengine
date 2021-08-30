var urlParser=require('../controllers/URLParser');
var CouchBaseUtil=require('../controllers/CouchBaseUtil');
var couchbase = require('couchbase');
var global=require('../utils/global.js');
var Client = require('node-rest-client').Client;

var reactConfig=require('../../config/ReactConfig');
var config = reactConfig.init;
var box_api_url=config.boxAPILocalAddress || config.boxAPIAddress;
//triggerToCreateUserRoleInBox    //createRole
//triggerToCreateFolder  //createFolder
function service(data,callback){
	try{
		if(data.action=="createRole"){
			createOrUpdateUserInBox(data,callback);
		}else if(data.action=="createFolder"){
			createFolderInBox(data,callback);
		}else{
			callback();
		}
	}catch(err){
		log("Error executing box calls");
		callback();
	}
}
exports.service=service;
var debug=true;
function log(msg){
	if(debug==true)
	console.log(msg);
}

function getBoxCredentials(request,callback){
	var body=urlParser.getRequestBody(request);
	var org;
	var User;
	if(request.session && request.session.userData && request.session.userData.recordId){
		CouchBaseUtil.getDocumentByIdFromContentBucket(request.session.userData.recordId, function(userRes){
			if(userRes.error){
				callback(userRes);
				return;
			}
			User=userRes.value;
			//if(User.box_com_data && User.box_com_data.userId){
				if(!User.box_com_data){
					User.box_com_data={};
				}
				if(typeof User.box_com_data.email == "undefined"){
					User.box_com_data.email=User.email
				}
				if(typeof body.org!="undefined"){
					getOrgBoxData(body.org);
				}else if(body.project!="undefined"){
					CouchBaseUtil.getDocumentByIdFromContentBucket(body.project, function(projectRes){
						if(projectRes.error){
							callback(projectRes);
							return;
						}
						getOrgBoxData(projectRes.value.org);
					});
				}else{
					callback({"error":"Invalid org"});
				}
				function getOrgBoxData(currOrg){
					CouchBaseUtil.getDocumentByIdFromContentBucket(currOrg, function(providerRes){
						if(providerRes.error){
							callback(providerRes);
							return;
						}
						org=providerRes.value;
						if(org.box_com_data){
							callback({orgData:org.box_com_data,userData:User.box_com_data});
						}else{
							callback({"error":"No Box account for org"});
						}
					});
				}
			/*}else{
				callback({"error":"No Box account"});
			}*/
		});
	}else{
		callback({"error":"no session"});
	}
}
exports.getBoxCredentials=getBoxCredentials;

function getBoxAPIToken(enterpriseId,email,callback){
	var client = new Client({connection: {rejectUnauthorized: false}});
	var args={
			headers:{
				"x-business-id":enterpriseId
			}
	}
	client.get(box_api_url+"/login/"+email,args,function(data,res){
		try{
			log(data.toString());
			var token=JSON.parse(data.toString()).token;
			callback(token);
		}catch(err){
			callback({error:"Error getting token with email"});
		}
	}).on("error",function(){
		callback({error:"error connecting to client"});
	});;
}
/**
 * 
 * @param data
 * { Provider, Project }
 * @param callback
 */
function createFolderInBox(data,callback){
	log("createFolderInBox: Start");
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.Project, function(projectRes){
		if(projectRes.error){
			callback(projectRes);
			return;
		}
		var projectDoc=projectRes.value;
		if(projectDoc.org!="public"){
			CouchBaseUtil.getDocumentByIdFromContentBucket(projectDoc.org, function(providerRes){
				if(providerRes.error){
					callback(providerRes);
					return;
				}
				var providerDoc=providerRes.value;
				if(providerDoc.box_com_data && providerDoc.box_com_data.email){
					log("providerDoc.box_com_data.email: ");
					getBoxAPIToken(providerDoc.box_com_data.enterpriseId,providerDoc.box_com_data.email,function(token){
						log("Got token");
						log(token);
						if(token.error){
							callback(token);
							return;
						}
						var client = new Client({connection: {rejectUnauthorized: false}});
						var args={
							headers: {
								"x-business-id":providerDoc.box_com_data.enterpriseId,
								"x-access-token":token
							}
						};
						log("Creating folder in box");
						client.get(box_api_url+"/folder/create/0/"+projectDoc.name, args, function(data, res){
							var result=JSON.parse(data.toString());
							log(result)
							if(result.id){
								projectDoc.box_com_data={
										folderId:result.id
								};
								CouchBaseUtil.upsertDocumentInContentBucket(projectDoc.recordId,projectDoc,function(res){
									callback(result);
								});
							}else{
								callback({error:"error creating folder"});
							}
						}).on("error",function(){
							callback({error:"error connecting to client"});
						});;
					});
				}else{
					log("NO credentials")
					callback({error:"No Credentials"});
				}
			});
		}else{
			callback({error:"Invalid org"});
		}
	});
}
/**
 * 
 * @param data
 * { UserRole }
 * @param callback
 */
function createOrUpdateUserInBox(data,callback){
	var Provider;
	var Project;
	var UserRole;
	var User;
	var org;
	var token;
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.UserRole, function(urRes){
		if(urRes.error){callback(urRes);return;}
		
		UserRole=urRes.value;
		if(UserRole["$status"]=="published" && UserRole.org!="public"){
			CouchBaseUtil.getDocumentByIdFromContentBucket(UserRole.org, function(orgRes){
				if(orgRes.error){callback(orgRes);return;}
				
				org=orgRes.value;
				//proceed if the org type is Provider or Project
				if(org.docType=="Provider" || org.docType=="Project"){
					CouchBaseUtil.getDocumentByIdFromContentBucket(UserRole.User, function(userRes){
						if(userRes.error){callback(userRes);return;}
						
						User=userRes.value;
						//if Provider org then create or update org member
						if(org.docType=="Provider"){
							log("processing Provider org");
							Provider=org;
							getToken(createUser);
						}else if(org.docType=="Project"){
							log("processing Project org");
							Project=org;
							//if Project org get login details and create or update folder collaborators
							CouchBaseUtil.getDocumentByIdFromContentBucket(Project.org, function(proRes){
								if(proRes.error){callback(proRes);return;}
								Provider=proRes.value;
								getToken(projectFolderCreation);
							});
						}
					});
				}else{
					callback({error:"Invalid org type"});
				}
			});
		}else{
			callback({error:"API not implemented"});
		}
	});
	function projectFolderCreation(){
		log("got token and if User is a box.com user then create a role");
				
		//if User is a box.com user then create a role
		//User has box account && Project has box id
		if(typeof User.box_com_data == "object" && typeof User.box_com_data.userId !="undefined" && 
				typeof Project.box_com_data == "object" && typeof Project.box_com_data.folderId != "undefined"){
			log("Folder exists user exists adding as a collaborator");
			createRole();
		//Project has no box id
		}else if(typeof Project.box_com_data == "undefined" || typeof Project.box_com_data.folderId == "undefined"){
			log("No folder, creating");
			createFolder(function(pcr){
				log(pcr);
				if(pcr.error){
					callback({error:"folder creation error"});
				}else{
					if(typeof User.box_com_data ==  "undefined" || typeof User.box_com_data.userId == "undefined"){
						//if User is not a box.com user create him as a managed user and add to the current folder
						log("creating user and role");
						createUser(createRole);
						//inviteAsaCollaboratorToTheProject();
					}else{
						createRole();
					}
				}
			});
		//project has box id
		}else if(typeof Project.box_com_data != "undefined" && typeof Project.box_com_data.folderId!="undefined"){
			createRole();
		}else{
			log("ERROR No project no user");
			callback({error:"Invalid folder"});
		}
	}
	function getToken(retFun){
		log("getToken: getting token");
		if(Provider && Provider.box_com_data && Provider.box_com_data.email){
			getBoxAPIToken(Provider.box_com_data.enterpriseId,Provider.box_com_data.email,function(tokenres){
				log("getToken: "+JSON.stringify(tokenres));
				if(tokenres.error){
					callback(tokenres);
					return;
				}
				token=tokenres;
				if(typeof retFun=="function"){
					log("getToken: return function")
					retFun();
				}
			});
		}else{
			log("invalid box credentials for current rovider doc");
			callback({error:"Invalid box credentials"});
		}
	}
	function createFolder(retFun){
		var client = new Client({connection: {rejectUnauthorized: false}});
		var args={
			headers: {
				"x-business-id":Provider.box_com_data.enterpriseId,
				"x-access-token":token
			}
		};
		log("Creating folder in box");
		client.get(box_api_url+"/folder/create/0/"+Project.name, args, function(data, res){
			var result=JSON.parse(data.toString());
			log(result)
			if(result.id){
				Project.box_com_data={
						folderId:result.id
				};
				CouchBaseUtil.upsertDocumentInContentBucket(Project.recordId,Project,function(res){
					if(typeof retFun=="function"){
						retFun(result);
					}else{
						callback(result);
					}
				});
			}else{
				callback({error:"error creating folder"});
			}
		}).on("error",function(){
			callback({error:"error connecting to client"});
		});
	}
	function createUser(retFun){
		//UserId created just invite to the current org
		//if(User.box_com_data && User.box_com_data.userId)
		
		//bytes kb mb gb
		log("In create user function");
		var data={
			login:User.email,
			name:(User.givenName+" "+(User.familyName?User.familyName:"")).trim(),
			space_amount:100*1024*1024,//100mb,
			status:"active",
			is_sync_enabled:true,
			can_see_managed_users:true,
			is_exempt_from_login_verification:true
		};
		var client=new Client({connection: {rejectUnauthorized: false}});
		var args={
			headers: {
				"x-business-id":Provider.box_com_data.enterpriseId,
				"x-access-token":token,
				"Content-Type":"application/json; charset=utf-8"
			},
			data:data
		};
		log("creating user");
		log(args);
		client.post(box_api_url+"/user/create/",args,function(data,res){
			var result=JSON.parse(data).body;
			log(result);
			//on success result.body contains user info
			//on error alos body.type=error
			if(result.type && result.type=="error"){
				console.log(result.message+"\n Inviting to the organization");
				if(result.code=="user_login_already_used"){
					args.data={
						"enterprise": {
							"id": Provider.box_com_data.enterpriseId
						},
						"actionable_by": {
							"login":User.email
						}
					};
					log("inviting user")
					client.post(baseURL+"/user/invite/",args,function(data,res){
						//success response
						//{"type":"invite","id":"921894","invited_to":{"type":"enterprise","id":"32490063","name":""},"actionable_by":{"type":"user","id":"2954577281","name":"Madhuri Namala","login":"madhuri.namala@cloudseed.io"},"invited_by":{"type":"user","id":"2808197967","name":"Dev","login":"dev.boxapi@gmail.com"},"status":"pending","created_at":"2017-12-01T01:44:52-08:00","modified_at":"2017-12-01T01:44:52-08:00"}
						var response=JSON.parse(data);
						log(response)
						if(response && response.response && 
							response.response.body && 
							response.response.body.type=="error"){
							console.log(response.response.body.message);
							if(typeof retFun=="function"){
								retFun();
							}else{
								callback();
							}
						}else{
							User.box_com_data={
									userId:response.actionable_by.id
							};
							CouchBaseUtil.upsertDocumentInContentBucket(User.recordId,User,function(res){
								if(typeof retFun=="function"){
									retFun();
								}else{
									callback();
								}
							});
						}
					}).on("error",function(){
						callback({error:"error connecting to client"})
					});;
				}else{
					if(typeof retFun=="function"){
						retFun();
					}else{
						callback();
					}
				}
			}else{
				User.box_com_data={
						userId:result.id
				};
				CouchBaseUtil.upsertDocumentInContentBucket(User.recordId,User,function(res){
					if(typeof retFun=="function"){
						retFun();
					}else{
						callback();
					}
				});
			}
		}).on("error",function(){
			callback({error:"error connecting to client"});
		});;
		
	}
	

	function createRole(){
		log("creating role");
		if(User.box_com_data && User.box_com_data.userId){
			var Project=org;
			var data={
				item:{
					type:"folder",
					id:Project.box_com_data.folderId
				},
				accessible_by:{
					type:"user",
					id:User.box_com_data.userId
				},
				role:UserRole.documentCollaborationRole?UserRole.documentCollaborationRole:"viewer"
			};
			var args={
				headers: {
					"x-business-id":Provider.box_com_data.enterpriseId,
					"x-access-token":token,
					"Content-Type":"application/json; charset=utf-8"
				},
				data:data
			};
			
			var client=new Client({connection: {rejectUnauthorized: false}});
			client.post(box_api_url+"/collaboration/create/", args, function(data, res){
				var result=JSON.parse(data.toString());
				if(result.body && result.body.type=="error"){
					callback({error:result.body});
				}else{
					callback(result.body);
				}
			}).on("error",function(){
				callback({error:"error connecting to client"});
			});;
		}else{
			log("no box_com_data inviting as a collaborator to the project folder");
			inviteAsaCollaboratorToTheProject();
		}
	}
	function inviteAsaCollaboratorToTheProject(){
		var Project=org;
		var data={
			item:{
				type:"folder",
				id:Project.box_com_data.folderId
			},
			accessible_by:{
				login:User.email
			},
			role:UserRole.documentCollaborationRole?UserRole.documentCollaborationRole:"viewer"
		};
		var args={
			headers: {
				"x-business-id":Provider.box_com_data.enterpriseId,
				"x-access-token":token,
				"Content-Type":"application/json; charset=utf-8"
			},
			data:data
		};
		
		var client=new Client({connection: {rejectUnauthorized: false}});
		log("creating collaborator with email");
		client.post(box_api_url+"/collaboration/create/", args, function(data, res){
			var result=JSON.parse(data.toString());
			if(result.body && result.body.type=="error"){
				callback({error:result.body});
			}else{
				callback(result.body);
			}
		}).on("error",function(){
			callback({error:"error connecting to client"});
		});;
	}
}
//UserRole821175e0-a15a-1c35-77fc-fb21a018039b
/*
setTimeout(function(){
createFolderInBox({Project:"Project20bfd1e7-1cbd-199f-856a-34ec4edbcde6"},function(data){
	console.log(data)
})},10000);*/
