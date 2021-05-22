/**
 * @author Vikram Jakkampudi
 */
var urlParser=require('./URLParser');
var ContentServer=require('../ContentServer.js');
var GenericServer=require('./GenericServer.js');
var GenericSummeryServer=require('./GenericSummeryServer.js');
var GenericRecordServer=require('./GenericRecordServer.js');
//var UploadProducts=require('../ReportGenerationScripts/uploadProductsCSV.js');
var GenericRelatedRecordsServer=require('./GenericRelatedRecordsServer.js');
var utility=require('./utility.js');
var OnTheFlyTrigger=require("./OnTheFlyTrigger.js");
var TriggerController=require("./TriggerController.js");
var MailServer=require("./MailServer.js");
var Box_com_API=require("../services/Box_com_API.js");
// var ScrapedRecords=require('./ScrapedRecords.js');


exports.service = function(request,response){
	response.contentType("application/json");
	response.header("Cache-Control", "no-cache");
	var operationValue = urlParser.getRequestQuery(request).operation;
	var body=urlParser.getRequestBody(request);
	var hostname=request.headers.host.split(":")[0];
	body.hostname=hostname;
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	body.cloudPointHostId=cloudPointHostId;
	switch(operationValue){
		case "saveRecord":
			GenericRecordServer.saveRecord(request,function(jsonObject){
				response.send({"data":jsonObject});
			});
		break;
		case "getNavigationLinks":
			GenericServer.getNavigationLinks(body,function(navRes){
				if(request && request.session && request.session.userData){
					request.session.orgAndRoles=navRes.orgs;
					request.session.privileges=navRes.roles
				}
				response.send(navRes.navigation);
			});
			break;
		case "getSchemaRecords":
			GenericSummeryServer.checkAndGetSchemaRecords(request,function(jsonObject){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(jsonObject);
				}else{
					response.send(jsonObject);
				}
			});
			break;
		case "lookupSchema":
			GenericSummeryServer.lookupSchema(request,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getApplicableFilters":
			GenericSummeryServer.getApplicableFilters(request.body,function(res){
				response.send(res);
			});
			break;
		case "updateRecord":
			GenericRecordServer.updateRecord(request,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getSchemaRecordForView":
			GenericRecordServer.getSchemaRecordForView(request,function(jsonObject){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(jsonObject);
				}else{
					response.send(jsonObject);
				}
			});
			break;
		case "getAudits":
			GenericRecordServer.getAudits(body,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getTotalAudits":
			GenericRecordServer.getTotalAudits(body,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getResults":
			GenericRecordServer.getResults(body,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getTotalResults":
			GenericRecordServer.getTotalResults(body,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "checkRelated":
			GenericRelatedRecordsServer.checkRelated(request,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getDefinition":
			utility.getDefinition(body.recordId,function(definition){
				response.send(definition);
			});
			break;
		case "deleteDefinition":
			utility.deleteDefinition(body.recordId,function(data){
				response.send(data);
			});
			break;
		case "saveDefinition":
			utility.saveDefinition(body,function(res){
				response.send(res);
			});
			break;
		case "saveNavigation":
			utility.saveNavigation({nav:body.nav,cloudPointHostId:cloudPointHostId},function(data){
				response.send(data);
			});
			break;
		case "saveBranding":
			utility.saveBranding({branding:body.branding,cloudPointHostId:cloudPointHostId},function(data){
				response.send(data);
			});
			break;
		case "saveHTMLMeta":
			utility.saveHTMLMeta(body,function(data){
				response.send(data);
			});
			break;
		case "saveConfigHTML":
			utility.saveConfigHTML({html:body.html,cloudPointHostId:cloudPointHostId},function(data){
				response.send(data);
			});
			break;
		case "getSchemaById":
			utility.getSchemaById(body.Id,function(schema){
				response.send(schema);
			});
			break;
		case "getMainSchema":
			utility.getMainSchema({schema:body.schema,cloudPointHostId:cloudPointHostId},function(schema){
				response.send(schema);
			});
			break;
		case "getAllSchemasStructsDependentSchemas":
			utility.getAllSchemasStructsDependentSchemas(cloudPointHostId,function(data){
				response.send(data);
			});
			break;
		case "getAllSchemaNames":
			utility.getAllSchemaNamesOfHost(cloudPointHostId,function(data){
				response.send(data);
			});
			break;
		case "getAllLandingPages":
			utility.getAllLandingPages(cloudPointHostId,function(data){
				response.send(data);
			});
			break;
		case "getAllRoles":
			utility.getAllRoles(cloudPointHostId,function(data){
				response.send(data);
			});
			break;
		case "getRelatedRecords":
			GenericRelatedRecordsServer.getRelatedRecords(request,function(data){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(data);
				}else{
					response.send(data);
				}
			});
			break;
		case "getRelatedCount":
			GenericRelatedRecordsServer.getRelatedCount(request,function(data){
				response.send({count:data});
			});
			break;
		case "getSchemaRoleOnOrg":
			GenericServer.getSchemaRoleOnOrg(request,body,function(data){
				response.send(data);
			});
			break;
		case "checkForExistance":
			GenericServer.checkForExistance(request,function(data){
				response.send(data);
			});
			break;
		case "updateId":
			GenericServer.updateId(request,function(data){
				response.send(data);
			});
			break;
		case "groupView":
			GenericServer.getGroupData(request,function(data){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(data);
				}else{
					response.send(data);
				}
			})
			break;
		case "getSuppliersFromGroupView":
			GenericServer.getSuppliersFromGroupView(request,function(data){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(data);
				}else{
					response.send(data);
				}
			})
			break;
		case "getCitiesFromGroupView":
			GenericServer.getCitiesFromGroupView(request,function(data){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(data);
				}else{
					response.send(data);
				}
			})
			break;
		case "getAllOrgs":
			GenericServer.getAllOrgs(cloudPointHostId,function(data){
				response.send(data);
			});
			break;
		case "getAllOrgsWithOrgType":
			GenericServer.getAllOrgsWithOrgType(request,function(data){
				response.send(data);
			});
			break;
		case "getUserOrgs":
			GenericServer.getUserOrgs(request,function(data){
				response.send({value:data});
			});
			break;
		case "getUserDefaultRoleForOrg":
			GenericServer.getUserDefaultRoleForOrg(request,function(data){
				response.send({value:data});
			});
			break;
		case "getKeywords":
			utility.getKeywords(request,function(data){
				response.send(data);
			});
			break;
		case "saveKeywords":
			utility.saveKeywords(request,function(data){
				response.send(data);
			});
			break;
		case "getRole":
			utility.getRole({roleId:body.roleId,cloudPointHostId:cloudPointHostId},function(res){
				response.send(res);
			});
			break;
		case "saveRole":
			utility.saveRole(body,function(res){
				response.send(res);
			});
			break;
		case "getSearchResults":
			GenericRelatedRecordsServer.getSearchResults(request,function(data){
				response.send(data);
			});
			break;
		case "getSlugDetails":
			GenericServer.getSlugDetails(body,function(data){
				if(request.query && request.query.callback){
					response.set( "Access-Control-Allow-Origin", "*" );
					response.set( "Access-Control-Allow-Methods", "GET,POST" );
					response.set( "Access-Control-Max-Age", "1000" );
					response.jsonp(data);
				}else{
					response.send(data);
				}
			});
			break;
		case "createOrGetGroupID":
			GenericServer.createOrGetGroupID(body,function(data){
				response.send(data);
			});
			break;
		case "invite":
			MailServer.invite(request,response);
			break;
		case "getExploreUniqueUserName":
			GenericServer.getExploreUniqueUserName(request,function(res){
				response.send(res);
			});
			break;
		case "checkUniqueUserName":
			GenericServer.checkUniqueUserName(request,function(res){
				response.send(res);
			});
			break;
		case "invokeTrigger":
			if(request.session.userData && request.session.userData.org){
				OnTheFlyTrigger.ProcessOnTheFlyTrigger(body, request.session.userData.recordId, request.session.userData.org, function(res){
					response.send({"data":"Trigger invocation is done"});
				}, request);
			}else{
				response.send({"error":"User Not Found"});
			}
			break;
		case "saveExploreMeta":
				utility.saveExploreMeta(body,function(data){
					response.send(data);
				});
				break;

		case "shareByEmail":
			MailServer.shareByEmail(request,response);
			break;
		case "ivaluateExpression":
			TriggerController.expEvaluator(body.record,body.expression,function(exprData){
				response.contentType("application/json");
				response.send({result:exprData});
			});
			break;
		case "getOrgSpecificValue":
			GenericServer.getOrgSpecificValue(body,function(result){
				response.contentType("application/json");
				response.send(result);
			});
			break;
		case "setOrgSpecificValue":
			GenericServer.setOrgSpecificValue(body,function(result){
				response.contentType("application/json");
				response.send(result);
			});
			break;
		case "saveCloudinaryData":
			GenericRecordServer.addImagesToCloudinary(request.body,function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
		case "updateImageAnnotation":
			GenericRecordServer.updateImageAnnotation(request.body,function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
		case "extractImagesAndDelete":
			GenericRecordServer.extractImagesAndDelete(request.body,function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
		case "setData":
			/*UploadProducts.setData(request.body,function(jsonObject){
				response.send({"data":jsonObject});
			});*/
			response.send({"data":"functionality to be upgraded to Latest versions"});
			break;
		case "getScrapedRecs":
			/*ScrapedRecords.getScrapedRecs(request.body, function(res){
				response.send(res);
			});*/
			response.send({"data":"functionality to be upgraded to Latest versions"})
			break;
		case "getBoxCredentials":
			Box_com_API.getBoxCredentials(request,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "getShortDetails":
			GenericServer.getShortDetails(request,function(jsonObject){
				response.send(jsonObject);
			});
			break;
		case "uploadBulk":
			var userId;
			try{userId=request.session.userData.recordId;}catch(err){}
			request.body.userId=userId;
			GenericServer.uploadBulk(request.body,function(res){
				response.send(res);
			});
			break;
		case "getMfrReports":
			GenericServer.getMfrReports(request.body,function(res){
				response.send(res);
			});
			break;
		default:
			response.send({"error":"invalid request"});
			break;
	}
};
