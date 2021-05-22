
var ServerActionReceiver = require('../actions/ServerActionReceiver');
var common=require('../components/common.jsx');

var endPoints=require('../endPoints.js');
var endPoint=endPoints.apiServerAddress || "https://localhost:9500";

var allPosts = {
		getSchemaRecords: function(data,callback) {
			//schema,filters,dependentSchema,org,userId,skip,limit,callback
			this.doPost("/generic?operation=getSchemaRecords",data,function(result){
				if(typeof callback=="function"){
					callback(result);
					return;
				}
				if(result.error){return;}
				result.org=data.org;
				result.dependentSchema=data.dependentSchema;
				result.filters=data.filters;
				result.noOrder=typeof data.noOrder=="boolean"?data.noOrder:false;
				if(data.skip){
					result.skip=data.skip;
				}else{
					result.skip=0;
				}
				ServerActionReceiver.receiveSchemaRecords(result);
			});
		},
		getDefinition:function(recordId,callback){
			this.doPost("/generic?operation=getDefinition",{recordId:recordId},function(result){
				if(result.error){return;}
				ServerActionReceiver.receiveDefinition(result);
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		deleteDefinition:function(recordId,callback){
			this.doPost("/generic?operation=deleteDefinition",{recordId:recordId},function(result){
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		getAllSchemas:function(callback){
			this.doPost("/generic?operation=getAllSchemasStructsDependentSchemas",{},function(data){
				if(data.error){return;}
				ServerActionReceiver.receiveAllSchemas(data);
				if(typeof callback=="function"){
					callback();
				}
			});
		},
		getAllSchemaNames:function(callback){
			this.doPost("/generic?operation=getAllSchemaNames",{},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			})
		},
		getAllLandingPages:function(callback){
			this.doPost("/generic?operation=getAllLandingPages",{},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			})
		},
		getAllRoles:function(callback){
			this.doPost("/generic?operation=getAllRoles",{},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			})
		},
		getMainSchema:function(schema,callback){
			this.doPost("/generic?operation=getMainSchema",{"schema":schema},function(result){
				if(typeof callback=="function"){
					callback(result);
				}
	        });
		},
		getUserDetails:function(id){
			this.doPost("/user?operation=getUserShortDetails",{"id":id},function(result){
				if(result.error){return;}
				if(result.data.error){return;}
				if(result.data.length==0){
					return;
				}
				ServerActionReceiver.receiveUserDetails({record:result.data[0],id:id});
			});
		},
		getRelatedRecords:function(data,callback){
			//common.startLoader();
			this.doPost("/generic?operation=getRelatedRecords",data,function(response){
				if(typeof callback=="function"){
					callback(result);
					return;
				}
				if(response.error){return;}
				//common.stopLoader();
				ServerActionReceiver.receiveRelatedRecords({recordId:data.recordId,
					relationName:data.relationName,
					related:response,
					skip:data.skip?data.skip:0});
			},"ajaxQueue");
		},
		getSchemaRecord:function(data,callback){
			//schema,ds,recordId,userId,org
			this.doPost("/generic?operation=getSchemaRecordForView",data,function(response){
				response.schema=data.schema;
				response.recordId=data.recordId;
				response.dependentSchema=data.dependentSchema;
				response.userId=data.userId;
				response.org=data.org;
				if(typeof callback=="function"){
					callback(response);
					return;
				}
				if(response.error){return;}
				ServerActionReceiver.receiveSchemaRecord(response);
			});
		},
		createJunction:function(record,callback){
			this.doPost("/generic?operation=saveRecord",record,function(result){
				if(result.error){return;}
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		getRelatedCount:function(data){
			this.doPost("/generic?operation=getRelatedCount",data,function(result){
				if(result.error){return;}
				ServerActionReceiver.receiveRelatedCount({"recordId":data.recordId,"relationName":data.relationName,"count":result.count});
			});
		},
		getNavigationLinks:function(userId){
			this.doPost("/generic?operation=getNavigationLinks",{"userId":userId},function(navlinks){
				if(navlinks.error){return;}
				ServerActionReceiver.receiveNavigationLinks(navlinks);
			});
		},
		getURLContent:function(url,callback){
			this.doGet("/getURLContent?url="+url,{},function(result){
				if(result.error){return;}
				callback(result);
			});
		},
		invite:function(email,callback){
			this.doPost("/generic?operation=invite",{email:email},function(data){
				callback(data);
			})
		},
		getGroupData:function(gd,callback){
			this.doPost("/generic?operation=groupView",gd,function(data){
				callback(data);
			})
		},
		saveBranding:function(branding,callback){
			this.doPost("/generic?operation=saveBranding",{branding:branding},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			})
		},
		saveConfigHTML:function(html,callback){
			this.doPost("/generic?operation=saveConfigHTML",{html:html},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			})
		},
		saveDefinition:function(definition,callback){
			this.doPost("/generic?operation=saveDefinition",definition,function(result){
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		getRole:function(roleId,callback){
			this.doPost("/generic?operation=getRole",{roleId:roleId},function(result){
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		saveRole:function(role,callback){
			this.doPost("/generic?operation=saveRole",role,function(result){
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		saveHTMLMeta:function(meta,callback){
			this.doPost("/generic?operation=saveHTMLMeta",meta,function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		getSchemaRoleOnOrg:function(schema,org,callback){
			this.doPost("/generic?operation=getSchemaRoleOnOrg",{schema:schema,userId:common.getUserDoc().recordId,org:org?org:"public"},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		getSearchResults:function(schema,recordIds,callback){
			this.doPost("/generic?operation=getSearchResults",{schema:schema,recordIds:recordIds},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		getSlugDetails:function(data,callback){
			this.doPost("/generic?operation=getSlugDetails",{slug:data.slug,path:data.path},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		getBootData:function(callback){
			this.doPost("/mobileAppBootData",{},function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		saveExploreMeta:function(meta,callback){
			this.doPost("/generic?operation=saveExploreMeta",meta,function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		invokeTrigger:function(triggerData,callback){
			this.doPost("/generic?operation=invokeTrigger",triggerData,function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		saveCloudinaryData:function(cloudinaryData,callback){
			this.doPost("/generic?operation=saveCloudinaryData",cloudinaryData,function(data){
				if(typeof callback=="function"){
					callback(data);
				}
			});
		},
		getAudits:function(data,callback){
			this.doPost("/generic?operation=getAudits",data,function(audits){
				if(typeof callback=="function"){
					callback(audits);
				}
			});
		},
		getTotalAudits:function(data,callback){
			this.doPost("/generic?operation=getTotalAudits",data,function(audits){
				if(typeof callback=="function"){
					callback(audits);
				}
			});
		},
		getResults:function(data,callback){
			this.doPost("/generic?operation=getResults",data,function(results){
				if(typeof callback=="function"){
					callback(results);
				}
			});
		},
		getTotalResults:function(data,callback){
			this.doPost("/generic?operation=getTotalResults",data,function(results){
				if(typeof callback=="function"){
					callback(results);
				}
			});
		},
		getBoxCredentials:function(data,callback){
			this.doPost("/generic?operation=getBoxCredentials",data,function(results){
				if(typeof callback=="function"){
					callback(results);
				}
			});
		},
		getShortDetails:function(data,callback){
			this.doPost("/generic?operation=getShortDetails",data,function(results){
				if(typeof callback=="function"){
					callback(results);
				}
			});
		},
		logout:function(callback){
			this.doGet("/logout",{},function(result){
				console.log(result);
				if(typeof callback=="function"){
					callback(result);
				}
			});
		},
		doGet:function(postUrl,data,callback,ajaxQueue){
			if(typeof data=="object" && Object.keys(data).length>0){
				postUrl+="&data="+JSON.stringify(data);
			}
			if(ajaxQueue){
				$.ajaxQueue({
					type: 'get',
					url:endPoint+postUrl,
					//data: JSON.stringify(data),
					contentType: "application/json; charset=utf-8",
					traditional: true,
					timeout:60*1000,
					success: function (data) {
						/*if(data.error){
							console.log(data.error);
							common.stopLoader();
							return;
						}*/
						callback(data)
					},
					xhrFields: {
            withCredentials: true
   				},
					error: function (xhr, ajaxOptions, thrownError) {
						if(ajaxOptions == "timeout") {
							callback({"error":"Request Timed out !"});
						} else {
							callback({"error":"Request Response error !"});
						}
					}
				});

			}else{
				$.ajax({
					type: 'get',
					url:endPoint+postUrl,
					//data: JSON.stringify(data),
					contentType: "application/json; charset=utf-8",
					traditional: true,
					timeout:60*1000,
					success: function (data) {
						/*if(data.error){
							console.log(data.error);
							common.stopLoader();
							return;
						}*/
						callback(data)
					},
					xhrFields: {
            withCredentials: true
   				},
					error: function (xhr, ajaxOptions, thrownError) {
						if(ajaxOptions == "timeout") {
							callback({"error":"Request Timed out !"});
						} else {
							callback({"error":"Request Response error !"});
						}
					}
				});
			}
		},
		doPost:function(postUrl,data,callback,ajaxQueue){
			if(ajaxQueue){
				$.ajaxQueue({
					type: 'post',
					url:endPoint+postUrl,
					data: JSON.stringify(data),
					contentType: "application/json; charset=utf-8",
					traditional: true,
					timeout:2*60*60*1000,
					success: function (data) {
						/*if(data.error){
							console.log(data.error);
							common.stopLoader();
							return;
						}*/
						callback(data)
					},
					xhrFields: {
            withCredentials: true
   				},
					error: function (xhr, ajaxOptions, thrownError) {
						if(ajaxOptions == "timeout") {
							callback({"error":"Request Timed out !"});
						} else {
							callback({"error":"Request Response error !"});
						}
					}
				});
			}else{
				$.ajax({
					type: 'post',
					url:endPoint+postUrl,
					data: JSON.stringify(data),
					contentType: "application/json; charset=utf-8",
					traditional: true,
					timeout:2*60*60*1000,
					success: function (data) {
						/*if(data.error){
							console.log(data.error);
							common.stopLoader();
							return;
						}*/
						callback(data)
					},
					xhrFields: {
            withCredentials: true
   				},
					error: function (xhr, ajaxOptions, thrownError) {
						if(ajaxOptions == "timeout") {
							callback({"error":"Request Timed out !"});
						} else {
							callback({"error":"Request Response error !"});
						}
					}
				});
			}
		}
};

module.exports=allPosts;
