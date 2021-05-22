var urlParser=require('./URLParser');
var couchbase = require('couchbase');
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var CouchBaseUtil=require('./CouchBaseUtil');

var ElasticSearch=require('./ElasticSearch.js');

var genericRecordServer=require("./GenericRecordServer.js");
var ContentServer=require('../ContentServer.js');
var utility=require('./utility.js');
var global=require('../utils/global.js');
//cloudPointHostId

var Immutable = require('immutable');
var logger = require('../services/logseed').logseed;
var logQueries=false;

function getNavigationLinks(data,callback){
	var config=ContentServer.getConfigDetails(data.hostname);
	var toSesOrgs={};
	var toSessionRoles={
		 public:{}
	};
	var prevDate=new Date();
	var navDocId="CloudseedNavigation";
	var cloudPointHostId="cloudseed";

	var cloudPointAdminRole="Role	ForcloudPointAdmin";
	var orgOwnerRole="Role2";
	var publicRole="Role1";
	var loggedInUserRole="RoleForCommonUser";

	if(	config && config.cloudPointNavDocId){
		navDocId=config.cloudPointNavDocId;
		cloudPointHostId=config.cloudPointHostId;
		cloudPointAdminRole=config.cloudPointAdminRole;
		orgOwnerRole=config.orgOwnerRole;
		publicRole=config.publicRole;
		loggedInUserRole=config.loggedInUserRole;
	}
	//Get Navigation document
	CouchBaseUtil.getDocumentByIdFromDefinitionBucket(navDocId,function(navresp){
		if(typeof navresp.value == "undefined"){
			logger.error({type:"GS:getNavLinks:getNavDef",error:navresp});
			callback({"error":"No navigation document found. Please contact administrator"});return;
		}

		var RootNavigation=navresp.value;
		var navLinks=Immutable.List();
		// Getting the orgs list the user has access to
		getUserSiblingOrgs(cloudPointHostId,data.userId,function(orgs){
			if(orgs.error){
				logger.error({type:"GS:getNavLinks:getUserSiblingOrgs",error:orgs.error});
				callback({"error":"Error while getting orgs list. Contact administrator"});
				return;
			}
			// If the request is made without a user id then use public role
			// else use user role
			var commonRole=publicRole;
			if(data.userId && data.userId!="CommonUser"){
				commonRole=loggedInUserRole;
			}


			// configuring for cloudpoint admin
			var cloudPointAdmin=false;
			var cloudPoint="";
			for(var oc=0;oc<orgs.length;oc++){
				if(orgs[oc].org=="public"){
					if(orgs[oc].roles.indexOf(loggedInUserRole)==-1){
						orgs[oc].roles.push(loggedInUserRole);
					}
				}
				if(orgs[oc].roles.indexOf(cloudPointAdminRole)>-1){
					cloudPointAdmin=true;
					cloudPoint=orgs[oc].org;
				}
			}
			if(cloudPointAdmin){
				commonRole=cloudPointAdminRole;
			}
			continueToConstructNavigation();


			function continueToConstructNavigation(){
				  for(var oc=0;oc<orgs.length;oc++){
						//if(orgs[oc].roles.indexOf(cloudPointAdminRole)>-1){
							toSesOrgs[orgs[oc].org]=orgs[oc].roles
						//}
				  }
				// getting schemas for common role for public org
				getSchemasAndMethodsByRole(cloudPointHostId,commonRole,function(roles){
					if(roles.error){
						logger.error({type:"GS:getNavLinks:getSchemasAndMethodsByRole",error:roles.error});
						callback({"error":"Error while getting public roles"});
						return;
					}
					  for(var ri=0;ri<roles.length;ri++){
						  toSessionRoles.public[roles[ri].schema]=roles[ri];
					  }
					  var newRoles=[];
					  for(var ri=0;ri<roles.length;ri++){
						  if(roles[ri].noNav){

						  }else{
							  newRoles.push(roles[ri])
						  }
					  }
					  roles=newRoles;



					var orgsList=[];
					for(var i=0;i<orgs.length;i++){
						orgsList.push(orgs[i].org)
					}
					// getting org docs
					CouchBaseUtil.getDocumentsByIdsFromContentBucket(orgsList,function(orgdocs){
						if(orgdocs.error){
							logger.error({type:"GS:getNavLinks:getOrgDocs",error:orgdocs.error,orgsList:orgsList});
							callback({"error":"Error while getting orgs list"});
							return;
						}

						if(orgsList.indexOf("public")==-1){
							navLinks=navLinks.push({
								org:"public",
								elements:roles
							});
						}

						getRoles(0);

						// getting schemas for remaining roles
						function getRoles(i){
							if(i<orgs.length){
								getSchemasAndMethodsByRole(cloudPointHostId,orgs[i].roles,function(roles){

									if(roles.error){
										logger.error({
											type:"GS:getNavLinks:getschemasandmethodsbyrole",
											error:roles.error,
											roles:orgs[i].roles
										});
										callback(roles);
										return;
									}
									 var tempSessionRoles={};
									 //Overriding multiple roles
									 //and taking the most appropriate role
									 for(var ri=0;ri<roles.length;ri++){
										 if(!tempSessionRoles[roles[ri].schema]){
											 tempSessionRoles[roles[ri].schema]=roles[ri];
										 }else{
											 if(typeof tempSessionRoles[roles[ri].schema].methods=="string"){
												 if(tempSessionRoles[roles[ri].schema].methods=="all"){
													 tempSessionRoles[roles[ri].schema].methods="all"
												 }else{
													 tempSessionRoles[roles[ri].schema].methods=[tempSessionRoles[roles[ri].schema].methods];
													 if(Array.isArray(roles[ri].methods)){
														 for(var rri=0;rri<roles[ri].methods.length;rri++){
															 tempSessionRoles[roles[ri].schema].methods.push(roles[ri].methods[rri]);
														 }
													 }else{
														 if(roles[ri].methods=="all"){
															 tempSessionRoles[roles[ri].schema].methods="all";
														 }else{
															 tempSessionRoles[roles[ri].schema].methods=[tempSessionRoles[roles[ri].schema].methods,roles[ri].methods];
														 }
													 }
												 }
											 }else if(Array.isArray(tempSessionRoles[roles[ri].schema].methods)){
												 if(typeof roles[ri].methods=="string"){
													 if(roles[ri].methods=="all"){
														 tempSessionRoles[roles[ri].schema].methods="all";
													 }else{
														 tempSessionRoles[roles[ri].schema].methods.push(roles[ri].methods);
													 }
												 }else if(Array.isArray(roles[ri].methods)){
													 tempSessionRoles[roles[ri].schema].methods=tempSessionRoles[roles[ri].schema].methods.concat(roles[ri].methods);
												 }
											 }

											 if(typeof tempSessionRoles[roles[ri].schema].navViews=="string"){
												 if(tempSessionRoles[roles[ri].schema].navViews=="all"){
													 tempSessionRoles[roles[ri].schema].navViews="all"
												 }else{
													 tempSessionRoles[roles[ri].schema].navViews=[tempSessionRoles[roles[ri].schema].navViews];
													 if(Array.isArray(roles[ri].navViews)){
														 for(var rri=0;rri<roles[ri].navViews.length;rri++){
															 tempSessionRoles[roles[ri].schema].navViews.push(roles[ri].navViews[rri]);
														 }
													 }else{
														 if(roles[ri].navViews=="all"){
															 tempSessionRoles[roles[ri].schema].navViews="all";
														 }else{
															 tempSessionRoles[roles[ri].schema].navViews=[tempSessionRoles[roles[ri].schema].navViews,roles[ri].navViews];
														 }
													 }
												 }
											 }else if(Array.isArray(tempSessionRoles[roles[ri].schema].navViews)){
												 if(typeof roles[ri].navViews=="string"){
													 if(roles[ri].navViews=="all"){
														 tempSessionRoles[roles[ri].schema].navViews="all";
													 }else{
														 tempSessionRoles[roles[ri].schema].navViews.push(roles[ri].navViews);
													 }
												 }else if(Array.isArray(roles[ri].navViews)){
													 tempSessionRoles[roles[ri].schema].navViews=tempSessionRoles[roles[ri].schema].navViews.concat(roles[ri].navViews);
												 }
											 }
											 if(tempSessionRoles[roles[ri].schema].create==""){
												 tempSessionRoles[roles[ri].schema].create=roles[ri].create;
											 }
											 if(tempSessionRoles[roles[ri].schema].detailView==""){
												 tempSessionRoles[roles[ri].schema].detailView=roles[ri].detailView;
											 }
										 }
									  }
									 toSessionRoles[orgs[i].org]=tempSessionRoles;



									var newRoles=[];
									for(var ri=0;ri<roles.length;ri++){
										if(roles[ri].noNav){

										}else{
											newRoles.push(roles[ri])
										}
									}
									roles=newRoles;
									navLinks=navLinks.push({
										org:orgs[i].org,
										elements:roles
									});
									getRoles(i+1);

								});

							}else{
								readyToSendResponse();
							}
						}

						function readyToSendResponse(){
							var navs=Immutable.List();
							for(var i=0;i<navLinks.count();i++){
								var orgName="";
								var orgIcon="";
								var orgSchema="";
								if(navLinks.get(i).org!="public" && orgdocs[navLinks.get(i).org] && orgdocs[navLinks.get(i).org].value){
									orgName=orgdocs[navLinks.get(i).org].value.name;
									orgSchema=orgdocs[navLinks.get(i).org].value.docType;
									if(orgdocs[navLinks.get(i).org].value.profileImage &&
											orgdocs[navLinks.get(i).org].value.profileImage[0] &&
											orgdocs[navLinks.get(i).org].value.profileImage[0].cloudinaryId)
										orgIcon=orgdocs[navLinks.get(i).org].value.profileImage[0].cloudinaryId;
								}
								var tempOrgLinks=processNavElements(RootNavigation.elements,navLinks.get(i));
								if(tempOrgLinks.length>0){
									navs=navs.push({
										org:navLinks.get(i).org,
										orgName:orgName,
										orgSchema:orgSchema,
										orgIcon:orgIcon,
										elements:tempOrgLinks
									});
								}
							}

							callback({navigation:{
												navs:navs.toJSON(),
												layout:RootNavigation.layout,
												cloudPointAdmin:cloudPointAdmin,
												cloudPoint:cloudPoint
										},
										orgs:toSesOrgs,
										roles:toSessionRoles});
						}
					});
				});
			}
		});
	});
}
exports.getNavigationLinks=getNavigationLinks;

function processNavElements(RootNavigationElements,subNav){
	var navElements=[];
	for(var i=0;i<RootNavigationElements.length;i++){
		for(var j=0;j<subNav.elements.length;j++){
			if(RootNavigationElements[i].target.schema && RootNavigationElements[i].target.schema==subNav.elements[j].schema){
				if((typeof RootNavigationElements[i].navType!="undefined" && (RootNavigationElements[i].navType=="org" || RootNavigationElements[i].navType=="both") && subNav.org !="public") ||
						(typeof RootNavigationElements[i].navType!="undefined" && (RootNavigationElements[i].navType=="public" || RootNavigationElements[i].navType=="both") && subNav.org =="public") ||
						(!RootNavigationElements[i].navType && subNav.org=="public")){
					var navitem=RootNavigationElements[i];
					navitem.target.methods=subNav.elements[j].methods;
					navitem.target.navViews=subNav.elements[j].navViews;
					navitem.target.create=subNav.elements[j].create;
					navElements.push(navitem);
				}
				break;
			}else if(RootNavigationElements[i].target.elements){
				var tempSubNavLinks=processNavElements(RootNavigationElements[i].target.elements,subNav);
				if(tempSubNavLinks.length>0){
					navElements.push({
						"displayName":RootNavigationElements[i].displayName,
						"profileLink":RootNavigationElements[i].profileLink,
						"iconLink":RootNavigationElements[i].iconLink,
						"navType":RootNavigationElements[i].navType,
						"topNav":RootNavigationElements[i].topNav,
						"breadCrumpName":RootNavigationElements[i].breadCrumpName,
						"landingPage":RootNavigationElements[i].landingPage,
						"url":RootNavigationElements[i].url,
						"target":{
							"landingPage":RootNavigationElements[i].target.landingPage,
							"url":RootNavigationElements[i].target.url,
							"elements":tempSubNavLinks
							}
					});
				}
				break;
			}else if(RootNavigationElements[i].target.landingPage){
				if((RootNavigationElements[i].navType && (RootNavigationElements[i].navType=="org" || RootNavigationElements[i].navType=="both") && subNav.org !="public") ||
						(RootNavigationElements[i].navType && (RootNavigationElements[i].navType=="public" || RootNavigationElements[i].navType=="both") && subNav.org =="public") ||
						(!RootNavigationElements[i].navType && subNav.org=="public")){
					navElements.push(RootNavigationElements[i]);
				}
				break;
			}
		}
	}
	return navElements;
}


/**
 * get all orgs (Org records which oare assocated with a user
 */
function getAllOrgs(cloudPointHostId,callback){
	//var query = ViewQuery.from("UserRole", "allOrgs").key([cloudPointHostId]).reduce(true).group(true);
	//query.stale(ViewQuery.Update.BEFORE);
	//CouchBaseUtil.executeViewInContentBucket(query,function(response){
		//var allOrgs=[];
		//if(response.length>0){
			//allOrgs=response[0].value;
		//}
		//callback(allOrgs);
	//});
	// select distinct r1.org,r2.name,r2.docType,r2.recordId from records r1 join records r2  on keys r1.org  where r1.docType="UserRole";
	var query=N1qlQuery.fromString("SELECT DISTINCT org FROM records WHERE docType=$1");
	query.adhoc = false;
	CouchBaseUtil.executeN1QL(query,["UserRole"],function(response){
		var allOrgs=[];
		if(Array.isArray(response)){
			response.forEach(function(ob){
				allOrgs.push(ob.org)
			});
		}
		callback(allOrgs);
	});
}
exports.getAllOrgs=getAllOrgs;

/**
 * get all orgs (Org records which oare assocated with a user with its docType
 */
function getAllOrgsWithOrgType(request,callback){
	/*var query=N1qlQuery.fromString("SELECT DISTINCT org FROM records WHERE docType=$1");
	query.adhoc = false;
	CouchBaseUtil.executeN1QL(query,["UserRole"],function(response){
		var allOrgs=[];
		if(Array.isArray(response)){
			response.forEach(function(ob){
				allOrgs.push(ob.org)
			});
		}
		callback(allOrgs);
		var query2=N1qlQuery.fromString("SELECT docType,name,recordId FROM records USE KEYS $1");
		query2.adhoc = false;
		CouchBaseUtil.executeN1QL(query2,[allOrgs],function(response2){
			callback(response2);
		});
	});*/
	var body=urlParser.getRequestBody(request);
	var query="select r1.org,count(r1.org) as count,r2.name,r2.docType,r2.recordId,r2.dateCreated from records r1 join records r2  on keys r1.org  where r1.docType=$1 group by r1.org ";
	if(body.orgType){
		if(Array.isArray(body.orgType)){
			query="select r1.org,count(r1.org) as count,r2.name,r2.docType,r2.recordId,r2.dateCreated from records r1 join records r2  on keys r1.org  where r1.docType=$1 and r2.docType IN $2 group by r1.org ";
		}else{
			query="select r1.org,count(r1.org) as count,r2.name,r2.docType,r2.recordId,r2.dateCreated from records r1 join records r2  on keys r1.org  where r1.docType=$1 and r2.docType=$2 group by r1.org ";
		}
	}
	var orderBy=(body.sortBy?(body.sortBy=="count"?"count":("r2."+body.sortBy)):"count")+" "+(body.sortOrder?body.sortOrder:"desc");
	query+=" order by "+orderBy;
	if(body.skip){
		query+=(" OFFSET "+(body.skip*1)+" LIMIT "+(body.limit?body.limit:global.limitCount));
	}
	var qo=N1qlQuery.fromString(query);
	query.adhoc = false;
	CouchBaseUtil.executeN1QL(qo,["UserRole",body.orgType],function(response){
		callback(response);
	});
}
exports.getAllOrgsWithOrgType=getAllOrgsWithOrgType;



/*
 * Get Orgs of the current user associated with
 */
function getUserOrgs(request,callback){
	var body=urlParser.getRequestBody(request);
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	if(request && request.session &&
			request.session.userData &&
			request.session.userData.recordId!=""){

	 }else{
		 callback([]);
	 }
	var query = ViewQuery.from("UserRole", "UserRoles").key([cloudPointHostId,request.session.userData.recordId]);
	//query.stale(ViewQuery.Update.BEFORE);
	CouchBaseUtil.executeViewInContentBucket(query,function(response){
		if(Array.isArray(response)){
			var orgs=[];
			for(var i=0;i<response.length;i++){
				orgs.push(response[i].value.org);
			}
			if(body.orgType && orgs.length>0){
				CouchBaseUtil.getDocumentsByIdsFromContentBucket(orgs,function(orgdocs){
					if(orgdocs.error){
						callback([]);
					}else{
						var newOrgs=[];
						for(var i=0;i<orgs.length;i++){
							if(Array.isArray(body.orgType)){
								if(orgdocs[orgs[i]].value &&
										body.orgType.indexOf(orgdocs[orgs[i]].value.docType)>-1){
									newOrgs.push(orgs[i]);
								}
							}else{
								if(orgdocs[orgs[i]].value &&
										orgdocs[orgs[i]].value.docType==body.orgType){
									newOrgs.push(orgs[i]);
								}
							}
						}
						callback(newOrgs);
					}
				});
			}else{
				callback(orgs);
			}
		}else{
			callback([]);
		}
	});
}
exports.getUserOrgs=getUserOrgs;

/*
 * get Users default role on the current creating org
 */
function getUserDefaultRoleForOrg(request,callback){
	var body=urlParser.getRequestBody(request);
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	if(request && request.session &&
			request.session.userData &&
			request.session.userData.recordId!=""){

	 }else{
		 callback("RoleForMembersManager");
	 }
	var query = ViewQuery.from("UserRole", "UserRoles").key([cloudPointHostId,request.session.userData.recordId]);
	//query.stale(ViewQuery.Update.BEFORE);
	CouchBaseUtil.getDocumentByIdFromDefinitionBucket("RoleMappings",function(result){
		if(result.error){
			callback("RoleForMembersManager");
		}else{
			var RoleMappings=result.value;
			CouchBaseUtil.executeViewInContentBucket(query,function(response){
				if(Array.isArray(response)){
					var roles=[];
					var publicOrgRole="RoleForCommonUser";
					for(var i=0;i<response.length;i++){
						if(response[i].value.org == "public"){
							roles=response[i].value.roles;
							break;
						}
					}
					for(var i=0;i<roles.length;i++){
						if(roles[i]!="RoleForCommonUser"){
							publicOrgRole=roles[i];
						}
					}
					if(RoleMappings && body.creatingOrg &&
						RoleMappings.mappings &&
						RoleMappings.mappings[publicOrgRole] &&
						RoleMappings.mappings[publicOrgRole][body.creatingOrg]){
						callback(RoleMappings.mappings[publicOrgRole][body.creatingOrg]);
					}else{
						callback("RoleForMembersManager")
					}
				}else{
					callback("RoleForMembersManager");
				}
			});
		}
	});
}
exports.getUserDefaultRoleForOrg=getUserDefaultRoleForOrg;


/*
 * get Schemas and methods  for a role
 */
function getSchemasAndMethodsByRole(cloudPointHostId,role,callback){

	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	var cloudPointAdminRole=config.cloudPointAdminRole;

	var query = ViewQuery.from("Role", "RoleDetail").key([cloudPointHostId,role]).stale(ViewQuery.Update.NONE);
	if(typeof role=="object"){
		var keys=[];
		for(var i=0;i<role.length;i++){
			keys.push([cloudPointHostId,role[i]]);
		}
		query = ViewQuery.from("Role", "RoleDetail").keys(keys).stale(ViewQuery.Update.NONE);
	}
	if(role==cloudPointAdminRole){
		utility.getAllSchemaNamesOfHost(cloudPointHostId,function(allschemas){
			var allschemaroles=[];
			for(var si=0;si<allschemas.length;si++){
				allschemaroles.push({
			           "schema": allschemas[si],
			           "methods": "all",
			           "navViews": "all",
			           "create":"createAll",
			           "detailView": "getDetail",
			           "cloudPointAdmin":true
			       });
			}

			callback(allschemaroles);
		});
	}else{
		CouchBaseUtil.executeViewInContentBucket(query,function(response){
			if(response.error){
				callback(response);
				return;
			}
			var rowData=new Array();
			for(var i in response){
				for(var j in response[i].value){
					rowData.push(response[i].value[j]);
				}
			}
			callback(rowData);
		});
	}
}
exports.getSchemasAndMethodsByRole=getSchemasAndMethodsByRole;

/**
 * This will return the orgs that a user have access to
 *
 * @param userId
 * @param callback
 */
function getUserSiblingOrgs(cloudPointHostId,userId,callback){
	if(!userId){
		userId="CommonUser";
	}
	//query.stale(ViewQuery.Update.BEFORE);
	CouchBaseUtil.executeViewInContentBucket("UserRole", "UserRoles",{key:[cloudPointHostId,userId]},function(response){
		if(response.error){
			callback(response);
			return;
		}
		var rowData=new Array();
		for(i in response){
			rowData.push(response[i].value);
		}
		callback(rowData);

	});
}
exports.getUserSiblingOrgs=getUserSiblingOrgs;



/**
 * Returns the role the user have on the requested org if the user is logged in
 * he also has "user" role if not logged in, only role the user have is public
 *
 * @param data
 *            (userId, org)
 * @param org
 */
/*function getUserRolesOnOrg(data,callback){
	var userId=data.userId;
	if(!data.userId){
		data.userId="CommonUser";
	}
	getUserSiblingOrgs(data.userId,function(orgs){


		var cloudPointAdmin=false;
		for(var oc=0;oc<orgs.length;oc++){
			if(orgs[oc].roles.indexOf("RoleForcloudPointAdmin")>-1){
				cloudPointAdmin=true;
			}
		}


	var query = ViewQuery.from("UserRole","UserRolesOnOrg").key([userId,data.org]).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query,function(response){
		if(response.error){
			callback(response);
			return;
		}
		var roleToPush="";
		if(userId!="CommonUser"){
			roleToPush="user";
		}else{
			roleToPush="public"
		}
		if(cloudPointAdmin){
			if(data.org=="public"){
				roleToPush="RoleForcloudPointAdmin";
			}else{
				roleToPush="orgOwner";
			}
		}

		response.push({ value: [ roleToPush ] } );
		var roles=[];
		for(var i in response){
			for(var j in response[i].value){
				roles.push(response[i].value[j]);
			}
		}
		callback(roles);
	});


	});
}
exports.getUserRolesOnOrg=getUserRolesOnOrg;
*/


/**
 * Get schemaRole on an org for the current user
 */

function getSchemaRoleOnOrg(request,data,callback){
	var hostname;
	if(request && request.headers && request.headers.host && request.headers.host.split(":"))
		hostname=request.headers.host.split(":")[0];

	if(!data.org){
		data.org="public";
	}
	var schemaRoleOnOrg={}
	if(request && request.session){
		var privilegesToCheck={};
		if(ContentServer.getUnLoggedSessionObject(hostname) &&
				ContentServer.getUnLoggedSessionObject(hostname).privileges){
			privilegesToCheck=ContentServer.getUnLoggedSessionObject(hostname).privileges;
		}
		if(request.session.userData &&
				request.session.privileges){
			privilegesToCheck=request.session.privileges;
		}
		var schemaRoles={};
		if(Array.isArray(data.schema)){
			for(var i=0;i<data.schema.length;i++){
				if(request.session.navLinks &&
						request.session.navLinks.cloudPointAdmin){
					schemaRoles[data.schema[i]]={
								cloudPointAdmin:true,
								create:"createAll",
								detailView:"getDetail",
								methods:"all",
								navViews:"all"
							};
				}else if(privilegesToCheck[data.org] &&
					privilegesToCheck[data.org][data.schema[i]]){
					schemaRoles[data.schema[i]]=privilegesToCheck[data.org][data.schema[i]];
				}else{
					if(data.schema[i]=="User" || data.schema[i]=="UserRole" || data.schema[i]=="Role" || data.schema[i]=="Organization"){
						schemaRoles[data.schema[i]]={
								create:"",
								detailView:"getDetail",
								methods:"",
								navViews:""
						};
					}else{
						schemaRoles[data.schema[i]]={};
					}
				}
			}
		}else{
			if(request.session.navLinks &&
					request.session.navLinks.cloudPointAdmin){
				schemaRoles={
							cloudPointAdmin:true,
							create:"createAll",
							detailView:"getDetail",
							methods:"all",
							navViews:"all"
						};
			}else if(privilegesToCheck[data.org] &&
				privilegesToCheck[data.org][data.schema]){
				schemaRoles=privilegesToCheck[data.org][data.schema];
			}else{
				if(data.schema=="User" || data.schema=="UserRole" || data.schema=="Role" || data.schema=="Organization"){
					schemaRoles={
							create:"",
							detailView:"getDetail",
							methods:"",
							navViews:""
					};
				}else{
					schemaRoles={};
				}
			}
		}
		callback(schemaRoles);
	}else{
		callback({});
	}
	/*
	getUserRolesOnOrg({userId:data.userId,org:data.org},function(roles){
		getRoleOnSchemas({roles:roles,schemas:[data.schema]},function(schemaRole){
			callback(schemaRole[data.schema]);
		});
	});*/
}
exports.getSchemaRoleOnOrg=getSchemaRoleOnOrg;

/**
 *
 * @param data
 *            (roles:[],schemas:[])
 * @param callback
 */
/*function getRoleOnSchemas(data,callback){
	var keys=[];
	if(data.roles.indexOf("user")==-1){
		data.roles.push("user");
	}
	for(var i=0;i<data.roles.length;i++){
		for(var j=0;j<data.schemas.length;j++){
			keys.push([data.roles[i],data.schemas[j]]);
		}
	}
	var query = ViewQuery.from("Role","RoleOnSchema").keys(keys).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query,function(roleOnSchemas){
		// console.log(query);
		// console.log(roleOnSchemas);
		var schemaRoles={};
		for(var i=0;i<roleOnSchemas.length;i++){
			if(typeof schemaRoles[roleOnSchemas[i].value.schema] !="undefined"){
				if(schemaRoles[roleOnSchemas[i].value.schema].methods!="all" && schemaRoles[roleOnSchemas[i].value.schema].methods.length<roleOnSchemas[i].value.methods){
					schemaRoles[roleOnSchemas[i].value.schema].methods.length=roleOnSchemas[i].value.methods;
				}
			}else{
				schemaRoles[roleOnSchemas[i].value.schema]=roleOnSchemas[i].value;
			}
		}
		for(var i=0;i<data.schemas.length;i++){
			if(typeof schemaRoles[data.schemas[i]]=="undefined"){
				schemaRoles[data.schemas[i]]={
						"methods":[],
						"navViews":[],
						"create":"",
						"detailView":""
				}
			}
			if(data.roles.indexOf("RoleForcloudPointAdmin")!=-1){
				schemaRoles[data.schemas[i]]={
						"methods":"all",
						"navViews":"all",
						"create":"createAll",
						"detailView":"getDetail",
						"cloudPointAdmin":true
				}
			}
		}
		callback(schemaRoles);
	});
}*/


/*
 * Check for Slug existance in records bucket
 */
function checkForExistance(request,callback){
	var data=urlParser.getRequestBody(request);
	var stale=ViewQuery.Update.BEFORE;
	if(data.stale && data.stale=="NONE"){
		stale=ViewQuery.Update.NONE;
	}
	var query = ViewQuery.from("User","uniqueUserName").key(data.id.toUpperCase()).stale(stale);
	CouchBaseUtil.executeViewInContentBucket(query,function(res){
		if(res.length==0){
			callback({exists:false,result:res});
		}else{
			callback({exists:true,result:res});
		}
	});
}
exports.checkForExistance=checkForExistance;

/*
 * Check for slug existance in schemas bucket
 */
function checkForExistanceInSchemas(request,callback){
	var data=urlParser.getRequestBody(request);
	var stale=ViewQuery.Update.BEFORE;
	if(data.stale && data.stale=="NONE"){
		stale=ViewQuery.Update.NONE;
	}
	var query = ViewQuery.from("genericMeta", "uniqueUserNames").key(data.id.toUpperCase()).stale(stale);
	CouchBaseUtil.executeViewInMasterBucket(query,function(res){
		if(res.error || res.length==0){
			callback({exists:false,result:res});
		}else{
			callback({exists:true,result:res});
		}
	});
}
exports.checkForExistanceInSchemas=checkForExistanceInSchemas;

/*
 * Check for existance in definiton bucket
 *
 */
function checkForExistanceInLandings(request,callback){
	var data=urlParser.getRequestBody(request);
	var stale=ViewQuery.Update.BEFORE;
	if(data.stale && data.stale=="NONE"){
		stale=ViewQuery.Update.NONE;
	}
	var query = ViewQuery.from("definitions", "uniqueUserNames").key(data.id.toUpperCase()).stale(stale);
	CouchBaseUtil.executeViewInDefinitionBucket(query,function(res){
		if(res.error || res.length==0){
			callback({exists:false,result:res});
		}else{
			callback({exists:true,result:res});
		}
	});
}
exports.checkForExistanceInLandings=checkForExistanceInLandings;



/**
 * Updated !@uniqueUserName for the given record
 */
function updateId(request,callback){
	var data=urlParser.getRequestBody(request);
	getSchemaRoleOnOrg(request,{schema:data.schema,userId:data.userId,org:data.org},function(response){
		if(response && response.methods && (response.methods=="all" || response.methods.indexOf("@uniqueUserName")>-1)){
			var docId=data.id;
			uniqueUserName=data.newId.toUpperCase();
			request.body.id=data.newId;
			checkForExistance(request,function(stat){
				if(stat.exists){
					callback({error:"Name already exists"});
				}else{
					CouchBaseUtil.getDocumentByIdFromContentBucket(docId,function(res){
						if(res.error){
							callback({error:"error while updating new id"});
						}else{
							var newRecord=res.value;
							newRecord["@uniqueUserName"]=uniqueUserName;
							CouchBaseUtil.upsertDocumentInContentBucket(docId,newRecord,function(res){
								if(res.error){
									callback({error:"error while updating new id"});
								}else{
									callback({success:"OK"});
								}
							});
						}
					});
				}
			});
		}else{
			callback({error:"error while updating new id"});
		}
	});
}
exports.updateId=updateId;
/**
 * Get group Data configured on a schema
 */
function getGroupData(request,callback){
	var data=urlParser.getRequestBody(request);
	if(data.key){
		continueToNext();
	}else{
		var hostname=request.headers.host.split(":")[0];
		var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
		utility.getMainSchema({schema:data.schema,cloudPointHostId:cloudPointHostId},function(schema){
			var key=[];
			if(schema && schema["@views"] && Array.isArray(schema["@views"])){
				for(var i=0;i<schema["@views"].length;i++){
					if(schema["@views"][i] && schema["@views"][i].viewName && schema["@views"][i].viewName==data.viewName){
						key=schema["@views"][i].key;
					}
				}
			}
			for(var i=0;i<key.length;i++){
				key[i]=data[key[i]];
			}
			data.key=key;
			continueToNext();
		});
	}
	function continueToNext(){
		if(data.esQuery){
			executeGroupViewESQuery(data,callback);
		}else if(data.n1ql){
			executeGroupViewN1ql(data,callback);
		}else{
			var query = ViewQuery.from(data.schema, data.viewName).key(data.key).reduce(true).group(true);
			CouchBaseUtil.executeViewInContentBucket(query,function(data){
				callback(data);
			});
		}
	}
}
exports.getGroupData=getGroupData;

function executeGroupViewN1ql(data,callback){
	var qo=N1qlQuery.fromString(data.n1ql);
	qo.adhoc = false;
	CouchBaseUtil.executeN1QL(qo,data.key,function(results){
		if(results.error){
			logger.error({type:"GS:executeGroupViewN1ql",error:results.error});
			callback(results);
			return;
		}
		var temp=[];
		if(data.takeOut){
			results.forEach(function(k){
				temp.push(k[data.takeOut]);
			});
		}else{
			temp=results;
		}
		if(temp.length>0){
			callback([{
				id:null,
				key:data.key,
				value:temp
			}]);
		}else{
			callback([]);
		}
	});
}
//select ProductCategory,count(*) from records where docType=$1 and Supplier=$2 GROUP BY ProductCategory;

function executeGroupViewESQuery(data,callback){
	var keywordPrefix="doc.";
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		var filters={};
		if(data.key && data.esQuery.filterKeys){
			data.key.forEach(function(k,index){
				filters[data.esQuery.filterKeys[index]]=Array.isArray(k)?k:[k];
			});
		}
		var filtersToGet=Array.isArray(data.esQuery.take)?data.esQuery.take:[data.esQuery.take];
		var resultsToSend={};
		getFilters(0);
		function getFilters(index){
			if(index<filtersToGet.length){

				var mustMatchArray=[];
				var mustNotMatchArray=[];
				var rangeFilter={
					range: {}
				};
				var sortTemp={};
				
				var matchJson = {"match":{}};
				matchJson["match"][keywordPrefix+"docType"]=data.schema;
				mustMatchArray.push(matchJson);
				
				if(schema["@type"]=="abstractObject"){
					if(data.dependentSchema){
						var matchJson = {"match":{}};
						matchJson["match"][keywordPrefix+schema["@dependentKey"]]=data.dependentSchema;
						mustMatchArray.push(matchJson);
					}
				}
				
				
				for(var key in filters){
					if(key!=filtersToGet[index]){
					var tempKey=key;
					if(schema["@properties"] && schema["@properties"][key] && schema["@properties"][key].derivedProperty){
						tempKey="dependentProperties."+key+"";
					}
					if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							schema["@properties"][key].dataType.type=="boolean"){
						var bval=false;
						if(Array.isArray(filters[key]) && filters[key].length>0){
							bval=filters[key][0];
						}else{
							bval=filters[key];
						}
						var matchJson = {"match":{}};
						matchJson["match"][keywordPrefix+tempKey]=true;
						if(bval){
							mustMatchArray.push(matchJson);
						}else{
							//mustNotMatchArray.push(matchJson);
							//if true is taken how should we get it as distinct value
							//hense removing it
						}
						
					}else if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							(schema["@properties"][key].dataType.type=="number" ||
							(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="number"))){
						if(Array.isArray(filters[key])){
							if(filters[key].length==1){//minimum value provided
								filters[key].push(filters[key][0]);
							}
							rangeFilter.range[keywordPrefix+tempKey]={}
							rangeFilter.range[keywordPrefix+tempKey]["gte"]=filters[key][1];
							rangeFilter.range[keywordPrefix+tempKey]["lte"]=filters[key][0];
						}else{
							var matchJson = {"match":{}};
							matchJson["match"][keywordPrefix+tempKey]=filters[key];
							mustMatchArray.push(matchJson);
						}
					}else if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							(schema["@properties"][key].dataType.type=="color" || 
							(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="color"))){
					
						var colorFltr="";
						if(Array.isArray(filters[key]) && filters[key].length>0){
							if(filters[key][0].split(" ").length==1){
								colorFltr=filters[key][0].split(" ")[0];
							}else if(filters[key][0].split(" ").length==2){
								colorFltr=filters[key][0].split(" ")[1];
							}else if(filters[key][0].split(" ").length>2){
								colorFltr=filters[key][0].split(" ")[2];
							}
						}else{
							colorFltr=filters[key];
						}
						/*var wildcardJson={"wildcard":{}}
						wildcardJson["wildcard"][tempKey]="*"+colorFltr.toLowerCase()+"*";
						mustMatchArray.push(wildcardJson);*/
						mustMatchArray.push(getCaseInsensitiveESSearchMatchJSON(keywordPrefix+tempKey,colorFltr));
					}else if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							(schema["@properties"][key].dataType.type=="multiPickList" || 
							schema["@properties"][key].dataType.type=="array")){
						if(Array.isArray(filters[key]) && filters[key].length==1){
							filters[key]=filters[key][0];
						}
						if(Array.isArray(filters[key])){
							var arrayMatchJson={
									"bool": {
										"should": []
									}
							};
							for(var ai=0;ai<filters[key].length;ai++){
								var matchJson = {"match":{}};
								matchJson["match"][keywordPrefix+tempKey]=filters[key][ai];
								arrayMatchJson.bool.should.push(matchJson);
							}
							mustMatchArray.push(arrayMatchJson);
						}else{
							var matchJson = {"match":{}};
							matchJson["match"][keywordPrefix+tempKey]=filters[key];
							mustMatchArray.push(matchJson);
						}
						
					}else{
						if(Array.isArray(filters[key]) && filters[key].length==1){
							filters[key]=filters[key][0];
						}
						if(Array.isArray(filters[key])){
							var arrayMatchJson={
									"bool": {
										"should": []
									}
							};
							for(var ai=0;ai<filters[key].length;ai++){
								var matchJson = {"match":{}};
								matchJson["match"][keywordPrefix+tempKey]=filters[key][ai];
								arrayMatchJson.bool.should.push(matchJson);
							}
							mustMatchArray.push(arrayMatchJson);
						}else{
							var matchJson = {"match":{}};
							matchJson["match"][keywordPrefix+tempKey]=filters[key];
							mustMatchArray.push(matchJson);
							
						}
					}
				}
				}
				
				
				
				var currentGetDistinct=filtersToGet[index];
				if(schema["@properties"][currentGetDistinct] && schema["@properties"][currentGetDistinct].derivedProperty){
					currentGetDistinct="dependentProperties."+currentGetDistinct;
				}
				currentGetDistinct=keywordPrefix+currentGetDistinct;
				
				var queryJSON={
						body:{
							query: {
								bool: {
									must: mustMatchArray,
									must_not:mustNotMatchArray
								}
							},
							aggs:{
							   distincts:{
								   terms: {
									  field: currentGetDistinct,
									  size:100
								   }
							   }
							}
							
						},
						size:0,
						index: config.esSummaryIndex
					};
					if(Object.keys(rangeFilter.range).length>0){
						queryJSON.body.filter=rangeFilter;
					}
					if(data.esQuery.sortBy){
						var sortKey=data.esQuery.sortBy;
						if(schema["@sortBindings"] && schema["@sortBindings"][sortKey]){
							sortKey=schema["@sortBindings"][sortKey];
						}
						sortTemp[keywordPrefix+sortKey]={"order":((data.esQuery.sortOrder=="ascend" || data.esQuery.sortOrder=="asc")?"asc":"desc")}
						queryJSON.body.sort=[sortTemp];
					}
					
					if(logQueries){
						console.log("=======ES GROUP VIEW QUERY========");
						console.log(JSON.stringify(queryJSON));
						console.log("===========================================");
					}
					ElasticSearch.getSummaryResults({query:queryJSON},function(result){
						var tempRes=[];
						try{
							result.aggregations.distincts.buckets.map(function(agg){
								if(agg.key)
								tempRes.push(agg.key);
							});
						}catch(err){
							console.log(err);
						}
						resultsToSend[filtersToGet[index]]=tempRes;
						getFilters(index+1);
					});
				
			}else{
				var temp=[];
				if(!Array.isArray(data.esQuery.take)){
					temp=resultsToSend[data.esQuery.take];
				}else{
					temp=resultsToSend;
				}
				callback([{
					id:null,
					key:data.key,
					value:temp
				}]);
			}
		}
	});
}

//Get slug details
//Checks in all three buckets
function getSlugDetails(data,callback){
	checkForExistance({body:{id:data.slug.toUpperCase().trim(),stale:"NONE"}},function(stat){
		if(stat.exists && stat.result[0] && stat.result[0].id){
			CouchBaseUtil.getDocumentByIdFromContentBucket(stat.result[0].id,function(recRes){
				if(recRes.error){
					callback({error:"Record notFound"});
				}else{
					var record=recRes.value;
					if(record.docType=="uniqueUserName"){
						callback(record);
					}else{
						CouchBaseUtil.getDocumentByIdFromMasterBucket(record.docType,function(schemaRes){
							var dependentSchema=undefined;
							if(schemaRes.value){
								var schema=schemaRes.value
								dependentSchema=(schema["@type"]=="abstractObject")?record[schema["@dependentKey"]]?record[schema["@dependentKey"]]:undefined:undefined;
							}
							callback({
									"type":"detail",
									"target":{
										"schema":record.docType,
										"recordId":stat.result[0].id,
										"dependentSchema":dependentSchema
									}
							});
						});
					}
				}
			});
		}else{
			checkForExistanceInSchemas({body:{id:data.slug.toUpperCase(),stale:"NONE"}},function(statins){
				if(statins.exists && statins.result[0] && statins.result[0].value){
					data.path=data.path?data.path:"default";
					if(statins.result[0].value.navFilters &&
						statins.result[0].value.navFilters[data.path]){
						callback({
							"type": "summary",
							"target": {
								"schema":statins.result[0].value["@abstractObject"]&& statins.result[0].value["@abstractObject"].trim()!=""?statins.result[0].value["@abstractObject"]:statins.result[0].id,
								"dependentSchema":statins.result[0].value["@abstractObject"]?statins.result[0].id.split("-")[1]:undefined,
								"filters": global.cleanFilters(statins.result[0].value.navFilters[data.path].filters)
							}
						});
					}else{
						callback({
							"type": "summary",
							"target": {
								"schema":statins.result[0].value["@abstractObject"]&& statins.result[0].value["@abstractObject"].trim()!=""?statins.result[0].value["@abstractObject"]:statins.result[0].id,
								"dependentSchema":statins.result[0].value["@abstractObject"]?statins.result[0].id.split("-")[1]:undefined,
								"filters": {}
							}
						});
						//callback({error:"Slug defintion for "+data.slug+" notFound in Schemas"})
					}
				}else{
					checkForExistanceInLandings({body:{id:data.slug.toUpperCase(),stale:"NONE"}},function(statland){
						if(statland.exists && statland.result[0] && statland.result[0].id){
							callback({
								"type": "landingPage",
								"target": {
									"landingPage":statland.result[0].id
								}
							});
						}else{
							CouchBaseUtil.getDocumentByIdFromDefinitionBucket("slugDefinitionWK",function(slugDefs){
								if(slugDefs.error){
									callback({error:"Slug defintions notFound"});
								}else{
									if(slugDefs.value &&
											slugDefs.value.slugs &&
											slugDefs.value.slugs[data.slug.toLowerCase()]){
										callback(slugDefs.value.slugs[data.slug.toLowerCase()]);
									}else{
										callback({error:"Slug defintion for "+data.slug+" notFound in slugDefintionWK"});
									}
								}
							});
						}
					});
				}
			});


		}
	});
}
exports.getSlugDetails=getSlugDetails;




function getExploreUniqueUserName(request,callback){
	var data=urlParser.getRequestBody(request);
	var query = ViewQuery.from("discover", "getUniqueUserName").key(data["@uniqueUserName"]).stale(ViewQuery.Update.NONE);

	CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		if(results.error  ||
				!Array.isArray(results) ||
				results.length==0 ||
				!results[0].id){
			callback({error:"Not Found"});
			return;
		}else{
			CouchBaseUtil.getDocumentByIdFromContentBucket(results[0].id,function(result){
				if(result.error){
					callback({error:"Not Found"});
				}else{
					callback(result.value);
				}
			});
		}
	});
}
exports.getExploreUniqueUserName=getExploreUniqueUserName;

function checkUniqueUserName(request,callback){
	var data=urlParser.getRequestBody(request);
	var query = ViewQuery.from("discover", "checkUniqueUserName").key(data.searchText).stale(ViewQuery.Update.NONE);
	CouchBaseUtil.executeViewInContentBucket(query, function(results) {
		if(results.error  ||
				!Array.isArray(results) ||
				results.length==0 ||
				!results[0].id){
			callback({error:"Not Found"});
			return;
		}else{
			CouchBaseUtil.getDocumentByIdFromContentBucket(results[0].id,function(result){
				if(result.error){
					callback({error:"Not Found"});
				}else{
					callback(result.value);
				}
			});
		}

	});
}
exports.checkUniqueUserName=checkUniqueUserName;

function createOrGetGroupID(data,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.recordId,function(result){
		if(result.error){
			callback({error:"Not Found"});
		}else{
			var record=result.value;
			if(record.groupID){
				callback({groupID:record.groupID});
			}else{
				record.groupID="Group"+global.guid();
				if(Array.isArray(record["@relationDesc"])){
					if(record["@relationDesc"].indexOf("groupID-has-recordId")==-1){
						record["@relationDesc"].push("groupID-has-recordId");
					}
				}else{
					record["@relationDesc"]=["groupID-has-recordId"];
				}

				CouchBaseUtil.upsertDocumentInContentBucket(record.recordId,record,function(res){
					if(res.error){
						callback({error:"error while updating new id"});
					}else{
						callback({groupID:record.groupID});
					}
				});
			}
		}
	});

}
exports.createOrGetGroupID=createOrGetGroupID;


function setOrgSpecificValue(data,callback){
	if(data.org && data.key && data.value){
		CouchBaseUtil.getDocumentByIdFromDefinitionBucket(data.org,function(result){
			var record={};
			if(result.value){
				record=result.value;
			}
			record[data.key]=data.value;
			record.recordId=data.org;
			CouchBaseUtil.upsertDocumentInDefinitionBucket(data.org,record,function(res){
				if(res.error){
					callback({error:"error while updating new id"});
				}else{
					callback(res);
				}
			});
		});
	}else{
		callback({"error":"Invalid : org | key | value"});
	}
}
exports.setOrgSpecificValue=setOrgSpecificValue;

function getOrgSpecificValue(data,callback){
	if(data.org && data.key){
		CouchBaseUtil.getDocumentByIdFromDefinitionBucket(data.org,function(result){
			if(result.error){
				callback({error:"Not Found"});
			}else{
				var record=result.value;
				if(record[data.key]){
					callback({value:record[data.key]});
				}else{
					callback({error:"Not Found"});
				}
			}
		});
	}else{
		callback({"error":"Invalid : org | key"});
	}
}
exports.getOrgSpecificValue=getOrgSpecificValue;

var a={
		recordId:"SpecListf3e65534-6a6e-6498-36e9-021ada92e97e",
		relationName:"specListHasProductCategory",
		translatingField:"itemNumber",
		translatedField:"itemNumberTranslation"
};
function setOrgSpecificValuesForAllRelatedRecords(data,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.recordId,function(rootRecResult){
		if(rootRecResult.error){
			callback(rootRecResult);
		}else{
			var rootRec=rootRecResult.value;
			CouchBaseUtil.getDocumentByIdFromDefinitionBucket(rootRec.org,function(orgMappingResult){
				if(orgMappingResult.error){
					callback(orgMappingResult);
				}else{
					var orgMappings=orgMappingResult.value;
					var relatedRecsQuery = ViewQuery.from("relation","getRelated").key([data.recordId,data.relationName]).reduce(false).stale(ViewQuery.Update.BEFORE);
					CouchBaseUtil.executeViewInContentBucket(relatedRecsQuery,function(relatedRecordsIdsRes){
						if(relatedRecordsIdsRes.error){
							callback(relatedRecordsIdsRes);
						}else{
							var recordIds=[];
							for(var i=0;i<relatedRecordsIdsRes.length;i++){
								recordIds.push(relatedRecordsIdsRes[i].id);
							}
							processAndSet(0)
							function processAndSet(index){
								if(index<recordIds.length){
									CouchBaseUtil.getDocumentByIdFromContentBucket(recordIds[index],function(relRecRes){
										if(relRecRes.error){
											processAndSet(index+1);
										}else{
											var relRecord=relRecRes.value;
											relRecord[data.translatedField]=orgMappings[relRecord[data.translatingField]];
											CouchBaseUtil.upsertDocumentInContentBucket(relRecord.recordId,relRecord,function(ures){
												processAndSet(index+1);
											});
										}
									});
								}else{
									callback({"ok":"done"});
								}
							}
						}
					});
				}
			});
		}
	});
}
exports.setOrgSpecificValuesForAllRelatedRecords=setOrgSpecificValuesForAllRelatedRecords;
/**
* this is to get short details of user and organization in Chat application
*/
function getShortDetails(request,callback){
	var UserProperties=["recordId","givenName","familyName","email","image","gender"];
	var OrgProperties=["recordId","name","website","phone","bannerImage","profileImage","about","address"];
	var body=urlParser.getRequestBody(request);
	if(body.recordId){
		if(Array.isArray(body.recordId)){
			CouchBaseUtil.getDocumentsByIdsFromContentBucket(body.recordId,function(orgdocs){
				if(orgdocs.error){callback({"error":"Error while getting documents list"});return;}
				var list=[];
				for(var key in orgdocs){
					var temp={};
					try{
						if(orgdocs[key].value.docType=="User"){
							UserProperties.forEach(function(up){
								temp[up]=orgdocs[key].value[up];
							})
						}else{
							OrgProperties.forEach(function(up){
								temp[up]=orgdocs[key].value[up];
							})
						}
					}catch(err){}
					list.push(temp);
				}
				callback(list);
			});
		}else{
			CouchBaseUtil.getDocumentByIdFromContentBucket(body.recordId,function(doc){
				if(doc.error){callback({"error":"Error while getting document"});return;}
				var temp={};
				try{
					if(doc.value.docType=="User"){
						UserProperties.forEach(function(up){
							temp[up]=doc.value[up];
						})
					}else{
						OrgProperties.forEach(function(up){
							temp[up]=doc.value[up];
						})
					}
				}catch(err){}
				callback(temp);
			});
		}
	}else{
		callback({error:"No document ids passed pass ids with key recordId as an array or as a string, prefer array if you have multiple"})
	}
}
exports.getShortDetails=getShortDetails;






/**
* The following code is to create bulk speclists for builders
*/

function getSpecList(schema,data,callback){
	var query=N1qlQuery.fromString("SELECT * from records where docType=$1 AND lower(name)=$2 and org=$3");
	CouchBaseUtil.executeN1QL(query,["SpecList",data.SpecList?data.SpecList.trim().toLowerCase():"",data.org],function(specSearchRes){
	if(specSearchRes.error){callback(specSearchRes);return;}
	if(specSearchRes.length>0){
		callback(specSearchRes[0].records);
	}else{
			var SpecList={
				"name": typeof data.SpecList=="string"?data.SpecList.trim():data.SpecList,
				"recordId": "SpecList"+global.guid(),
				"org": data.org,
				"docType": "SpecList",
				"author": data.userId,
			    "editor": data.userId,
			    "dateCreated": global.getDate(),
			    "dateModified": global.getDate(),
			    "flag":"created with script",
			    "revision": 1,
				"@identifier": "name",
				"cloudPointHostId": "wishkarma",
				"$status":"draft",
				"relationDesc": [
    			"parent-hasSub-recordId"
  			],
				"columnsToShowInPDF": [
    			"Requirement Number",
    			"Item Number"
  			]
			};
			var keys=["org","author"];
			genericRecordServer.evaluateFormulas({schema:schema,record:SpecList,keys:keys},function(newRec){
				SpecList=newRec;
				CouchBaseUtil.upsertDocumentInContentBucket(SpecList.recordId,SpecList,function(res){
					if (res.error) {callback({"error":err});return;	}
					callback(SpecList);
				});
			});
		}
	});
}

function getSpecListProductCategory(schema,data,callback){
	var query=N1qlQuery.fromString("SELECT * from records where docType=$1 AND lower(comment)=$2 and org=$3");
	CouchBaseUtil.executeN1QL(query,["SpecListProductCategory",data.comment?data.comment.trim().toLowerCase():"",data.org],function(specSearchRes){
	if(specSearchRes.error){callback(specSearchRes);return;}
	if(specSearchRes.length>0){
		callback(specSearchRes[0].records);
	}else{
			var SpecListProductCategory={
				"SpecList": data.SpecList,
				"recordId": "SpecListProductCategory"+global.guid(),
				"org": data.org,
				"docType": "SpecListProductCategory",
				"author": data.userId,
			    "editor": data.userId,
			    "dateCreated": global.getDate(),
			    "dateModified": global.getDate(),
			    "flag":"created with script",
			    "revision": 1,
				"@identifier": "recordId",
				"$status":"draft",
				"relationDesc": [
			    "recordId-productCategoriesInSpecList-SpecList",
			    "SpecList-specListHasProductCategory-recordId",
			    "parent-hasSub-recordId"
			  ],
				"cloudPointHostId": "wishkarma"
			};
			for(var key in data){
				if(!SpecListProductCategory[key]){
					SpecListProductCategory[key]=typeof data[key]=="string"?data[key].trim():data[key];
				}
			}
			var keys=["productCategory"];
			genericRecordServer.evaluateFormulas({schema:schema,record:SpecListProductCategory,keys:keys},function(newRec){
				SpecListProductCategory=newRec;
				CouchBaseUtil.upsertDocumentInContentBucket(SpecListProductCategory.recordId,SpecListProductCategory,function(res){
					if (res.error) {callback({"error":err});return;	}
					callback(SpecListProductCategory);
				});
			});
		}
	});
}
function uploadBulk(data,callback){
	utility.getMainSchema({schema:"SpecList"},function(SpecSchema){
		if(SpecSchema.error){callback(SpecSchema);return;}
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		if(!Array.isArray(data.records)){callback({error:"No records"});return;}
		var result=[];
		uploadRecord(0);
		function uploadRecord(index){
			console.log(data.fileName+" "+(index+1));
			if(index>=data.records.length){
				var mailData={
						from:"Wishkarma "+" <info@wishkarma.com>",
						to:data.uploadedBy,
						subject:"Hello, Requirements list processed",
						//text:message,
						html:"Click on the link below.<br/></br> <a href='https://www.wishkarma.com/myprojects?org="+data.org+"&schema=SpecListProductCategory'>Wishkarma</a>."
					}
				console.log(mailData);
				require('../services/clsMailgun.js').getMailgun().messages().send(mailData, function (err, result) {
					if (err) {
						console.log(err);
					}else {
						console.log("email sent");
					}
				});
				callback(result);
				return;
			}
			if(data.mappings && data.mappings.SpecList){
				var record=data.records[index];
				record.org=data.org;
				record.userId=data.userId;
				record.fileName=data.fileName;
				record.sheetName=data.sheetName;
				for(var key in data.mappings){
					if(data.mappings[key] && data.mappings[key]!="NA"){
						if(typeof data.mappings[key]=="string"){
							record[key]=data.records[index][data.mappings[key]]
						}else if(Array.isArray(data.mappings[key])){
							record[key]="";
							data.mappings[key].map(function(tk){
								record[key]+=" "+(data.records[index][tk]?data.records[index][tk]:"");
							});
						}
					}else{
						record[key]="NA";
					}
				}
				var dummyRec=false;
				for(var key in schema["@properties"]){
					if(schema["@properties"][key].required && !record[key] && key!="finalizedProductId"){
						dummyRec=true;
					}
				}
				if(!record.SpecList){
					dummyRec=true;
				}
				if(!dummyRec){
					getSpecList(SpecSchema,record,function(SpecList){
						record.SpecList=SpecList.recordId;
						record.architect=SpecList.architect;
						getSpecListProductCategory(schema,record,function(res){
							result.push(res);
							setTimeout(function(){uploadRecord(index+1);},100);
						});
					});
				}else{
					//console.log("DummyRec");
					setTimeout(function(){uploadRecord(index+1);},100);
				}
			}else{
				//console.log("No SpecList in index : "+index);
				setTimeout(function(){uploadRecord(index+1);},100);
			}
		}
	});
	});
}
exports.uploadBulk=uploadBulk;


function getSuppliersFromGroupView(request,callback){
	var data=urlParser.getRequestBody(request);
	var post_data={
		"schema": "MfrProCatCitySupplier",
		"takeOut": "Supplier",
		"n1ql": "select distinct Supplier from records where docType='MfrProCatCitySupplier' and org=$1 and Manufacturer=$2",
		"key": [
		  "public",
		  "Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7"
		],
		"org": "public"
	}
	if(data.MfrId && data.ProCatId && data.CityId){
		post_data.n1ql="SELECT DISTINCT Supplier "+
										"FROM records "+
										"WHERE docType='MfrProCatCitySupplier' "+
										"AND org=$1 "+
										"AND Manufacturer=$2 "+
										"AND ProductCategory=$3 "+
										"AND City=$4 ";
		post_data.key=[
			"public",
			data.MfrId,
			data.ProCatId,
			data.CityId
		];
	}else if(data.MfrId && data.ProCatId){
		post_data.n1ql="SELECT DISTINCT Supplier "+
										"FROM records "+
										"WHERE docType='MfrProCatCitySupplier' "+
										"AND org=$1 "+
										"AND Manufacturer=$2 "+
										"AND ProductCategory=$3 ";
		post_data.key=[
			"public",
			data.MfrId,
			data.ProCatId
		];
	}else if(data.MfrId && data.CityId){
		post_data.n1ql="SELECT DISTINCT Supplier "+
										"FROM records "+
										"WHERE docType='MfrProCatCitySupplier' "+
										"AND org=$1 "+
										"AND Manufacturer=$2 "+
										"AND City=$3 ";
		post_data.key=[
			"public",
			data.MfrId,
			data.CityId
		];
	}else if(data.mfrId){
		post_data.n1ql="SELECT DISTINCT Supplier "+
											"FROM records "+
											"WHERE docType='MfrProCatCitySupplier' "+
											"AND org=$1 "+
											"AND Manufacturer=$2 ";
			post_data.key=[
				"public",
				data.MfrId,
			];
	}else if(data.ProCatId && data.CityId){
			post_data.n1ql="SELECT DISTINCT Supplier "+
										"FROM records "+
										"WHERE docType='MfrProCatCitySupplier' "+
										"AND org=$1 "+
										"AND ProductCategory=$2 "+
										"AND City=$3";
		post_data.key=[
			"public",
			data.ProCatId,
			data.CityId
		];
	}else if(data.ProCatId){
		post_data.n1ql="SELECT DISTINCT Supplier "+
										"FROM records "+
										"WHERE docType='MfrProCatCitySupplier' "+
										"AND org=$1 "+
										"AND ProductCategory=$2 ";
		post_data.key=[
			"public",
			data.ProCatId
		];
	}
	executeGroupViewN1ql(post_data,callback);
}
exports.getSuppliersFromGroupView=getSuppliersFromGroupView;


function getCitiesFromGroupView(request,callback){
	var data=urlParser.getRequestBody(request);
	var post_data={
		"schema": "MfrProCatCity",
		"takeOut": "City",
		"n1ql": "select distinct City from records where docType='MfrProCatCitySupplier' and org=$1 and Manufacturer=$2",
		"key": [
			"public",
			"Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7"
		],
		"org": "public"
	}
	if(data.MfrId && data.ProCatId){
		post_data.n1ql="SELECT DISTINCT City "+
										"FROM records "+
										"WHERE docType='MfrProCatCity' "+
										"AND org=$1 "+
										"AND Manufacturer=$2 "+
										"AND ProductCategory=$3 ";
		post_data.key=[
			"public",
			data.MfrId,
			data.ProCatId
		];
	}else if(data.MfrId){
		post_data.n1ql="SELECT DISTINCT City "+
										"FROM records "+
										"WHERE docType='MfrProCatCity' "+
										"AND org=$1 "+
										"AND Manufacturer=$2 ";
		post_data.key=[
			"public",
			data.MfrId
		];
	}else if(data.ProCatId){
		post_data.n1ql="SELECT DISTINCT City "+
										"FROM records "+
										"WHERE docType='MfrProCatCity' "+
										"AND org=$1 "+
										"AND ProductCategory=$2 ";
		post_data.key=[
			"public",
			data.ProCatId
		];
	}
	executeGroupViewN1ql(post_data,callback);
}
exports.getCitiesFromGroupView=getCitiesFromGroupView;

function getMfrReports(body,callback){
	var query = "SELECT * from records where docType=$1";
	if(body.filters && body.filters.ProductCategory && body.filters.ProductCategory.length>0){
		query+=(" AND ProductCategory IN $2");
	}
	if(body.filters && body.filters.org && body.filters.org.length>0){
		query+=(" AND org IN $3");
	}
	if(body.download){
		// do nothing
	}else{
			query+=(" OFFSET "+(body.skip?body.skip*1:"0")+" LIMIT "+(body.limit?((body.limit*1)+1):"10"));
	}
	var query1=N1qlQuery.fromString(query);
	query1.adhoc = false;
	CouchBaseUtil.executeN1QL(query1,["SpecListProductCategory",body.filters?body.filters.ProductCategory:[],body.filters?body.filters.org:[]],function(response){
		var allReports=[];
		if(Array.isArray(response)){
			response.forEach(function(ob){
				allReports.push(ob.records);
			});
		}
		callback(allReports);
	});
}
exports.getMfrReports=getMfrReports;
