/**
 * @author Vikram
 * creation Date 10-05-2016
 */

var ReactConfig=require('../config/ReactConfig');
ReactConfig=ReactConfig.init;
var React=require('react');
//var JSX=require('node-jsx').install();
var ReactDOMServer = require('react-dom/server');
var rr=require('react-router');
var routes=require("./components/nav/router.jsx").routes;

var DefinitionStore = require('./stores/DefinitionStore');
var RecordSummaryStore = require('./stores/RecordSummaryStore');
var RecordDetailStore = require('./stores/RecordDetailStore');
var SchemaStore = require('./stores/SchemaStore');
var JunctionStore = require('./stores/JunctionStore');
var SearchStore=require('./stores/SearchStore');


var common=require('./components/common.jsx');
var logger = require('./utils/logseed').logseed;

var linkGenerator=require('./components/nav/linkGenerator.jsx');
var global=require("./utils/global.js");
var limitCount=global.summaryLimitCount;//9;

var fs = require('fs');

var metaCleanRegEx=/[\\&\/\"\']/g;

var WebAPI= require('./utils/NodeWebAPIUtils.js');

/*
 * FOR SEO this will get all dynamic data and stores them in local stores
 * while generating content or
 */
function processLandingPage(cloudPointHostId,lpi,callback){
	WebAPI.getDefinition(lpi,function(landingTemplate){
		console.log('Got landing Template');
		DefinitionStore.receiveDefinition(landingTemplate);
		var summariesToFetch=[];
		if(landingTemplate &&
				landingTemplate.structure &&
				landingTemplate.structure.root){
			//scanning dynamic content to fetch
			function readElement(tree){
			  if(!tree.content){
			    for(var key in tree){
			      readElement(tree[key]);
			    }
			  }else{
			    if(tree.content.type){
			    if(tree.content.type=="summary" ||
			       tree.content.type=="carousel" ||
			       tree.content.type=="cardCarousel" ||
			       tree.content.type=="iconView" ||
			       tree.content.type=="landingPage")
			      summariesToFetch.push(tree.content);
			    }
			  }
			}
			readElement(landingTemplate.structure.root)
			//processing dynamic content one at a time
			processFetchContent(0);
			function processFetchContent(index){
				if(index<summariesToFetch.length){
					var content=JSON.parse(JSON.stringify(summariesToFetch[index]));
					var pre=new Date();

					if(content.type=="landingPage"){
						console.log("Getting "+content.lpi+"  "+content.type +"  "+ pre);
						WebAPI.getDefinition(content.lpi,function(clpi){
							console.log("Got "+content.lpi+"  "+content.type +"  "+ ((new Date()-pre)/1000));
							DefinitionStore.receiveDefinition(clpi);
							processFetchContent(index+1);
						});
					}else{
						if(content.schema){
							console.log("Getting "+content.schema+"  "+content.type +"  "+ pre);
							WebAPI.getSchemaRecords({
								cloudPointHostId:cloudPointHostId,
								schema:content.schema,
								dependentSchema:content.dependentSchema,
								filters:content.filters,
								sortBy:content.sortBy,
								sortOrder:content.sortOrder,
								org:"public",
								userId:"CommonUser",
								skip:0
							},function(result){
								if(result.error){
									console.log(result.error);
								}else{
									result.org="public";
									result.dependentSchema=content.dependentSchema;
									result.filters=content.filters;
									result.skip=0;
									result.landing="landing";
									result.cloudPointHostId=cloudPointHostId;
									RecordSummaryStore.receiveSchemaRecords(result);
									console.log("Got "+content.schema+"  "+content.type +"  "+ ((new Date()-pre)/1000));
								}
								processFetchContent(index+1);
							});
						}else{
							processFetchContent(index+1);
						}
					}

				}else{
					console.log("processing landing page done");
					if(typeof callback=="function"){
						callback();
					}
				}
			}


		}else{
			if(typeof callback=="function"){
				callback();
			}
		}
	});
}
function getHandleBarMetaData(request,config){
	var hostname=request.headers.host.split(":")[0];
	return {
			clientVersion:ReactConfig.clientVersion?ReactConfig.clientVersion:"",
			title:config.title?config.title:"schemaengine",
			logo:config.logo?config.logo:"schemaengine.png",
			favIcon:config.favIcon?config.favIcon:config.logo?config.logo:"schemaengine.png",
			loader:config.loader?config.loader:"schemaengineLoader.gif",
			handleBarTemplate:(config && config.handleBarTemplate)?config.handleBarTemplate:"main",
			htmlToInclude:config.htmlToInclude?config.htmlToInclude:"",
			navBarStyle:(config.navBarStyle)?JSON.stringify(config.navBarStyle).replace(/\"/g,"").replace(/\}/g,"").replace(/\{/g,"").replace(/\,/g,";"):"",
			footerStyle:(config.footerStyle)?JSON.stringify(config.footerStyle).replace(/\"/g,"").replace(/\}/g,"").replace(/\{/g,"").replace(/\,/g,";"):"",
			lpi:config.landingTemplate?config.landingTemplate:"schemaengineTemplate",
			cloudPointHostId:config.cloudPointHostId?config.cloudPointHostId:"schemaengine",
			url:request.protocol+"://"+hostname+""+request.originalUrl,
			canonicalUrl:config.canonicalDomain?(request.protocol+"://"+config.canonicalDomain+""+request.originalUrl):undefined,
			canonicalDomain:config.canonicalDomain?(request.protocol+"://"+config.canonicalDomain):"",
			originalDomain:request.protocol+"://"+hostname
	}

}


//If request came with slug(@uniqueUserName)
function serveSlugPath(request,response){
	WebAPI.getSlugDetails({slug:request.params.id,path:request.params.path},function(data){
		//store slug details in common js
		common.setSlugDetails(request.params.id,request.params.path,data);
		request.params.slug=request.params.id;
		if(data.error){
			response.redirect("/views/pageNotFound");
		}else if(data.type && data.type=="summary"){
			request.params.org="public";
			request.params.schema=data.target.schema;
			request.query.flts=JSON.stringify(data.target.filters);
			request.query.skp=request.query.page?((request.query.page-1)*global.summaryLimitCount):undefined;
			request.query.ds=data.target.dependentSchema;
			serveSummary(request,response)
		}else if(data.type && data.type=="landingPage"){
			request.query.l=data.target.landingPage;
			serveRootPage(request,response);
		}else if(data.type && data.type=="groupView"){
			var body=data.target;
				body.org="public";
				body.text=data.displayName;
				body.displayName=data.displayName;
			if(typeof data.target.keys=="object"){
				for(var key  in data.target.keys){
					body[key]=data.target.keys[key];
				}
			}
			request.body=body;
			serveGroupView(request,response);
		}else if(data.type && data.type=="detail"){
			request.params.org="public";
			request.params.schema=data.target.schema;
			request.query.schema=data.target.schema;
			request.params.recordId=data.target.recordId;
			processRecordRequest(request,response);
		}else{
			response.redirect("/views/pageNotFound");
		}
	});
}
exports.serveSlugPath=serveSlugPath;
var allBootDatas={};
function getCloudPointConfig(hostname,callback,forceUpdate){
	if(!allBootDatas[hostname] || forceUpdate){
		WebAPI.getDataFromRemoteHost("POST","mobileAppBootData",{},function(state){
				allBootDatas[hostname]=state;	
				fillBootData(state);
				callback(state.configDetails);
		});
	}else{
		fillBootData(allBootDatas[hostname]);
		callback(allBootDatas[hostname].configDetails);
	}
};
exports.getCloudPointConfig=getCloudPointConfig;
function getFavicon(hostname,callback){
	var hostconfig=allBootDatas[hostname]?allBootDatas[hostname].configDetails:{};
	var logo=(hostconfig && hostconfig.logo)?hostconfig.logo:"schemaengine.png";
	var favIcon=(hostconfig && hostconfig.favIcon)?hostconfig.favIcon:logo;
	callback(favIcon);
}
exports.getFavicon=getFavicon;

function fillBootData(state){
	if(state.allSlugs){
		common.setSlugs(state.allSlugs);
	}
	if(state.configDetails)
		common.setConfigDetails(state.configDetails);
	
	if(state.summaryState)
		RecordSummaryStore.putAll(state.summaryState);
	
	if(state.definitionState)
		DefinitionStore.putAll(state.definitionState);
	
	if(state.schemaState)
		SchemaStore.putAll(state.schemaState);
	
	if(state.junctionState)
		JunctionStore.putAll(state.junctionState);
	
	if(state.detailState)
		RecordDetailStore.putAll(state.detailState);
	
	if(state.siteSpecific)
		common.setSiteSpecific(true);
		
	if(state.unLoggedSessionObject)
		DefinitionStore.addNavigationLinks(state.unLoggedSessionObject.navLinks)
}
function clearStores(){
	RecordSummaryStore.clear();
	DefinitionStore.clear();
	SchemaStore.clear();
	JunctionStore.clear();
	RecordDetailStore.clear();
	SearchStore.clear();
	common.clearSlugs();
}

//Serving rootPage
function serveRootPage(request,response){
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
		//setting config details in common js for ui construction
		common.setConfigDetails(config);
		//if request is for sitespecific
		common.setShowOnlyMainContent(true);
		var handleBarMeta=getHandleBarMetaData(request,config);
		var lpi=handleBarMeta.lpi;//default landing page
		//?l="landingPageId"  if root page requested with some othe landing page id
		if(request.query.l)
			lpi=request.query.l;
			var lptime=new Date();
			processLandingPage(config.cloudPointHostId,lpi,function(){
				console.log("time to process lpage :  "+ (new Date()-lptime));
				sendResponse();
			});
		/*}else{
			sendResponse();
		}*/

		function sendResponse(){
			//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
			//DefinitionStore.addNavigationLinks(navlinks);
			var summaryState=RecordSummaryStore.getAll();
			var definitionState=DefinitionStore.getAll();

			var configToSend=JSON.parse(JSON.stringify(config));
			delete configToSend.htmlToInclude;

			var stateString=JSON.stringify({
					landingPage:request.query.l,
					slug:request.params.slug,
					allSlugs:common.getAllSlugs()
			});
			//If POST Request is made then send the response as json
			//for mobile apps and reload session requests
			if(request.method=="POST"){
				response.contentType("application/json");
				response.send({
					configDetails:configToSend,
					summaryState:summaryState,
					landingPage:request.query.l,
					slug:request.params.slug,
					schemaState:SchemaStore.getAllByCloudPointHostId(config.cloudPointHostId),
					definitionState:definitionState
				});
			}else{
				//SEO Related settings
				var meta=getLandingPageMeta(hostname,lpi,handleBarMeta,config)+ "\n<link rel='alternate' href='"+handleBarMeta.url+"' hreflang='en-in' />\n";
				if(handleBarMeta.canonicalUrl){
					meta+="\n<link rel='canonical' href='"+handleBarMeta.canonicalUrl+"' />\n"+
					"<meta property='og:url' content='"+ handleBarMeta.canonicalUrl +"' />\n";
				}
				//Rendering page with react router
				rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
				    if (error) {
					logger.error({type:"rootMatchError",url:request.url,error:error});
				    	response.status(500).send(error.message)
					} else if (redirectLocation) {
					   	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
					} else if (renderProps) {
				    	response.set('Content-Type', 'text/html');
						response.set('Strict-Transport-Security','max-age=31536000');
						response.write(fs.readFileSync(__dirname+'/views/headers.html'));
						var dcD="";
						try{
							dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
						}catch(err){
							logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
						};
						response.render(handleBarMeta.handleBarTemplate,{
							dynamicContentDiv:dcD,
							state:stateString,
							meta:meta,
							cache:true,
							favIcon:handleBarMeta.favIcon,
							clientVersion:handleBarMeta.clientVersion,
							loader:handleBarMeta.loader,
							html:handleBarMeta.htmlToInclude
						},function(err,data){
							if(err){
								logger.error({type:"renderError",url:request.url,error:err});
								response.write("<h1>Error occured</h1>")
							}else{
								console.log("Processed in : "+ (new Date() - startTime));
								response.write(data);
							}
							response.end();
						});
					} else {
					     response.status(404).send('Not found')
					}
					
						clearStores();
				 });
			}
			console.log('Request processed');
		}
	});
}
exports.serveRootPage=serveRootPage;

//Setting SEO Meta content
function getLandingPageMeta(hostname,lpi,handleBarMeta,config){
	var lpiDoc=DefinitionStore.get(lpi);
	var meta="";
	var image_src="";
	if(config && config.cloudPointHostId && config.cloudPointHostId=="schemaengine"){
		image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/wk_icon.jpg"
	}
	var mtitle=(config.htmlMeta && config.htmlMeta.title)?config.htmlMeta.title:handleBarMeta.title;
	var desc=(config.htmlMeta && config.htmlMeta.description)?config.htmlMeta.description:"";
	var metaKeywords=(config.htmlMeta && config.htmlMeta.keywords)?config.htmlMeta.keywords:"";
	var ogTitle=mtitle;
	var ogDescription=desc;
	if(lpiDoc && lpiDoc.htmlMeta){
		mtitle=lpiDoc.htmlMeta.title;
		desc=lpiDoc.htmlMeta.description;
		metaKeywords=lpiDoc.htmlMeta.keywords;
		if(lpiDoc.htmlMeta.image_src){
			image_src=lpiDoc.htmlMeta.image_src;
		}
		ogTitle=mtitle;
		ogDescription=desc;
		if(lpiDoc.htmlMeta.ogTitle && lpiDoc.htmlMeta.ogTitle!=""){
			ogTitle=lpiDoc.htmlMeta.ogTitle;
		}
		if(lpiDoc.htmlMeta.ogDescription && lpiDoc.htmlMeta.ogDescription!=""){
			ogDescription=lpiDoc.htmlMeta.ogDescription;
		}
	}
	mtitle=mtitle.replace(metaCleanRegEx,' ');
	desc=desc.replace(metaCleanRegEx,' ');
	ogTitle=ogTitle.replace(metaCleanRegEx,' ');
	ogDescription=ogDescription.replace(metaCleanRegEx,' ');
	metaKeywords=metaKeywords.toString().replace(metaCleanRegEx,' ');
	try{
		meta  = "<title>"+mtitle+"</title>\n" +
				"<meta name='author' content='"+ (config.title?config.title:"schemaengine") +"'/>\n" +
				"<meta name='description' content='"+ desc +"'/>\n" +
				"<meta name='keywords' content='"+ metaKeywords +"'/>\n"+
				"<link  href='"+ image_src +"'  rel='image_src'/>\n"+

				"<meta property='og:image' content='"+ image_src +"' xmlns:og='http://opengraphprotocol.org/schema/'/>\n"+
				"<meta property='og:title' content='"+ogTitle+"' />\n"+
				"<meta property='og:description' content='"+ ogDescription +"' />\n"+
				"<meta property='og:type' content='website' />\n"+

				"<meta name='twitter:card' content='summary'/>\n" +
				"<meta name='twitter:title' content='"+ogTitle+"'/>\n" +
				"<meta name='twitter:description' content='"+ogDescription+"'/>\n" +
				"<meta name='twitter:image' content='"+image_src+"'/>\n";
		if(lpiDoc && !lpiDoc.webCrawlerIndex){
			meta+="\n<meta name='robots' content='noindex' />";
			meta+="<meta name='robots' content='nofollow' />\n";
		}

	}catch(err){
		logger.error({type:"landingPageMetaConstruction",error:err.message});
	}
	return meta;
}



function serveChangePasswordPage(request,response){
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setShowOnlyMainContent(true);
		var handleBarMeta=getHandleBarMetaData(request,config);
		var code = request.query.code;
		var stateString={};
		//check the code in query params if exits send change page else error page
		if(code && typeof code!="undefined" && code!=null){
			WebAPI.changePassword({code:code},function(result){
				console.log("changePasswordResponse");
				if(result.error){
					response.redirect("/views/pageNotFound");
					return;
				}else{
					stateString=result;
					sendResponse();
				}
			
			});
		}else{
			console.log("Code not found");
			response.redirect("/views/pageNotFound");
			return;
		}
		function sendResponse(){
			console.log("Send Response");
			//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
			//DefinitionStore.addNavigationLinks(navlinks);
			stateString=JSON.stringify(stateString);
			var meta="";
			var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Reset Password";
			try{
				meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
						"<meta name='author' content='"+ (handleBarMeta.title?handleBarMeta.title:"schemaengine") +"'/>\n";

			}catch(err){}
			rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
				if (error) {
				logger.error({type:"rootMatchError",url:request.url,error:error});
			    	console.log("error route: ",error);
			        response.status(500).send(error.message)
				 } else if (redirectLocation) {
				   	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
				 } else if (renderProps) {
				 	response.set('Content-Type', 'text/html');
					response.set('Strict-Transport-Security','max-age=31536000');
					response.status(404);
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
				   	response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude,
					},function(err,data){
						if(err){
							logger.error({type:"renderError",url:request.url,error:err});
							console.log("Error in : "+ (new Date() - startTime));
							response.write("<h1>Error occured</h1>")
						}else{
							console.log("Processed in : "+ (new Date() - startTime));
							response.write(data);
						}
						response.end();
					});
				} else {
					console.log(renderProps, "arguments",arguments);
					response.status(404).send('Not found')
				}
				clearStores();
			})
			console.log('Password change Request processed '+(new Date() - startTime));
		}
	});

}
exports.serveChangePasswordPage=serveChangePasswordPage;



function serveActivatePage(request,response){
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setShowOnlyMainContent(true);
		var handleBarMeta=getHandleBarMetaData(request,config);
		var code = request.query.code;
		var stateString={};
		//if query param contains activate code then procees
		if(code && typeof code!="undefined" && code!=null){
			WebAPI.activateAccount({code:code},function(result){
				stateString=result;
				sendResponse();
			});
		}else{
			console.log("Code not found");
			response.redirect("/views/pageNotFound");
			return;
		}

		function sendResponse(){
			console.log("Send Response");
			stateString=JSON.stringify(stateString);
			var meta="";
			var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Setup Your Account";
			try{
				meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
						"<meta name='author' content='"+ (handleBarMeta.title?handleBarMeta.title:"schemaengine") +"'/>\n";
			}catch(err){}
			rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
			    if (error) {
				logger.error({type:"rootMatchError",url:request.url,error:error});
			    	console.log("error route: ",error);
					response.status(500).send(error.message)
			    } else if (redirectLocation) {
			    	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
			    } else if (renderProps) {
			    	response.set('Content-Type', 'text/html');
					response.set('Strict-Transport-Security','max-age=31536000');
					response.status(404);
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
			    	response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude,
					},function(err,data){
						if(err){
							logger.error({type:"renderError",url:request.url,error:err});
							console.log("Error in : "+ (new Date() - startTime));
							response.write("<h1>Error occured</h1>")
						}else{
							console.log("Processed in : "+ (new Date() - startTime));
							response.write(data);
						}
						response.end();
					});
				} else {
				    console.log(renderProps, "arguments",arguments);
				    response.status(404).send('Not found')
				}
				
						clearStores();
			});
			console.log('Request processed');
		}
	});
}
exports.serveActivatePage=serveActivatePage;


function serveJoinPage(request,response){
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setShowOnlyMainContent(true);
		var handleBarMeta=getHandleBarMetaData(request,config);
		var code = request.query.code;
		var stateString={};
		if(code && typeof code!=undefined && code!=null){
			WebAPI.activateAccount({code:code},function(result){
				stateString=result;
				sendResponse();
			});
		}else{
			console.log("Code not found");
			sendResponse();
			return;
		}

		function sendResponse(){
			console.log("Send Response");
			stateString=JSON.stringify(stateString);
			var meta="";
			var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Join schemaengine";
			try{
				meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
						"<meta name='author' content='"+ (handleBarMeta.title?handleBarMeta.title:"schemaengine") +"'/>\n";

			}catch(err){}

			 rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
			    if (error) {
					logger.error({type:"rootMatchError",url:request.url,error:error});
			    console.log("error route: ",error);
			      response.status(500).send(error.message)
			    } else if (redirectLocation) {
			    	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
			    } else if (renderProps) {
			    	response.set('Content-Type', 'text/html');
					response.set('Strict-Transport-Security','max-age=31536000');
					response.status(404);
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
			    	response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude,
					},function(err,data){
						if(err){
							logger.error({type:"renderError",url:request.url,error:err});
							console.log("Error in : "+ (new Date() - startTime));
							response.write("<h1>Error occured</h1>")
						}else{
							console.log("Processed in : "+ (new Date() - startTime));
							response.write(data);
						}
						response.end();
					});
			   } else {
			    	console.log(renderProps, "arguments",arguments);
			      response.status(404).send('Not found')
			    }
						clearStores();
			});
			console.log('Request processed');
		}
	});

}
exports.serveJoinPage=serveJoinPage;


function servePageNotFound(request,response){
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setShowOnlyMainContent(true);
		var handleBarMeta=getHandleBarMetaData(request,config);
		sendResponse();

		function sendResponse(){
			//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
			//DefinitionStore.addNavigationLinks(navlinks);
			var summaryState=RecordSummaryStore.getAll();
			var definitionState=DefinitionStore.getAll();
			var stateString=JSON.stringify({
							pageNotFound:true,
							allSlugs:common.getAllSlugs()
						});
			var meta="";
			var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Page not found";
			try{
				meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
						"<meta name='author' content='"+ (handleBarMeta.title?handleBarMeta.title:"schemaengine") +"'/>\n";

			}catch(err){}

			 rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
			    if (error) {
				logger.error({type:"rootMatchError",url:request.url,error:error});
			      response.status(500).send(error.message)
			    } else if (redirectLocation) {
			    	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
			    } else if (renderProps) {
			    	response.set('Content-Type', 'text/html');
					response.set('Strict-Transport-Security','max-age=31536000');
					response.status(404);
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
			    	response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude
				},function(err,data){
					if(err){
						logger.error({type:"renderError",url:request.url,error:err});
						response.write("<h1>Error occured</h1>")
					}else{
						console.log("Processed in : "+ (new Date() - startTime));
						response.write(data);
					}
					response.end();
				});
			    } else {
			      response.status(404).send('Not found')
			    }
						clearStores();
			 })
			console.log('Request processed');
		}
	});

}
exports.servePageNotFound=servePageNotFound;


function serveSummary(request,response){
	console.log('Requested Summary page');
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	var org=request.params.org;
	var schema=request.params.schema;
	var dependentSchema=(typeof request.query.ds=="undefined" || request.query.ds=="undefined")?undefined:request.query.ds;
	var filters=(typeof request.query.flts=="undefined" || request.query.flts=="undefined")?undefined:JSON.parse(request.query.flts);
	var clientFilters=filters?JSON.parse(JSON.stringify(filters)):undefined;
	var skip=(typeof request.query.skp=="undefined" || request.query.skp=="undefined")?0:request.query.skp*1;
	var originalUrl = request.originalUrl;

	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setShowOnlyMainContent(false);
		var handleBarMeta=getHandleBarMetaData(request,config);
		//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
		//DefinitionStore.addNavigationLinks(navlinks);
		var srdata={
				cloudPointHostId:handleBarMeta.cloudPointHostId,
				schema:schema,
				dependentSchema:dependentSchema,
				org:org,
				userId:"CommonUser",
				skip:skip,
				filters:filters
		};
		request.body=srdata;
		WebAPI.getSchemaRecords(srdata,function(result){

			if(result.error){
				console.log(result.error);
				response.redirect("/views/pageNotFound");
				return;
			}


			result.org=org;
			result.dependentSchema=dependentSchema;
			result.filters=clientFilters;
			result.skip=skip;
			RecordSummaryStore.receiveSchemaRecords(result);
			var summaryState=RecordSummaryStore.getAll();
			var definitionState=DefinitionStore.getAll();
			var slug=request.params.slug;
			if(request.params.path!=undefined && request.params.path!="undefined"){
				slug+="/"+request.params.path;
			}
			var stateString=JSON.stringify({
				current:"summary",
				schema:schema,
				org:org,
				dependentSchema:dependentSchema,
				filters:clientFilters,
				skip:skip,
				slug:slug,
				allSlugs:common.getAllSlugs()
			});
			var nextPage='<link rel="next" href="'+(handleBarMeta.originalDomain+linkGenerator.getSummaryLink({org:org,
								schema:schema,
								dependentSchema:dependentSchema,
								filters:clientFilters,
								skip:(skip*1+limitCount)}))+'" />';
			var prevPage="";
			if(skip>=limitCount){
				prevPage='<link rel="prev" href="'+(handleBarMeta.originalDomain+linkGenerator.getSummaryLink({org:org,
								schema:schema,
								dependentSchema:dependentSchema,
								filters:clientFilters,
								skip:(skip*1-limitCount)}))+'" />';
			}

			var topPageUrl=handleBarMeta.originalDomain+linkGenerator.getSummaryLink({org:org,
				schema:schema,
				dependentSchema:dependentSchema,
				filters:clientFilters});

			var sdn=(result.schema["displayName"] || result.schema["@displayName"]);
			var image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/wk_icon.jpg";
			var desc=sdn;
			var mtitle=sdn;
			var keywords=sdn;
			var ogTitle=sdn;
			var ogDescription=sdn;
			var htmlMeta=result.schema.htmlMeta;
			if(request.params.path!=undefined &&
					result.schema.navFilters &&
					result.schema.navFilters[request.params.path] &&
					typeof result.schema.navFilters[request.params.path].htmlMeta=="object"){
				var newHTMLMeta=result.schema.navFilters[request.params.path].htmlMeta;

				if(newHTMLMeta){
					if(!htmlMeta){
						htmlMeta=newHTMLMeta;
					}else{
						if(newHTMLMeta.title && newHTMLMeta.title!=""){
							htmlMeta.title=newHTMLMeta.title;
						}
						if(newHTMLMeta.description && newHTMLMeta.description!=""){
							htmlMeta.description=newHTMLMeta.description;
						}
						if(newHTMLMeta.keywords && newHTMLMeta.keywords!=""){
							htmlMeta.keywords=newHTMLMeta.keywords;
						}
						if(newHTMLMeta.image_src && newHTMLMeta.image_src!=""){
							htmlMeta.image_src=newHTMLMeta.image_src;
						}
						if(newHTMLMeta.ogTitle && newHTMLMeta.ogTitle!=""){
							htmlMeta.ogTitle=newHTMLMeta.ogTitle;
						}
						if(newHTMLMeta.ogDescription && newHTMLMeta.ogDescription!=""){
							htmlMeta.ogDescription=newHTMLMeta.ogDescription;
						}
					}
				}
			}
			if(htmlMeta){
				if(htmlMeta.title){
					mtitle=htmlMeta.title;
					ogTitle=mtitle;
				}
				if(htmlMeta.description){
					desc=htmlMeta.description;
					ogDescription=desc;
				}
				if(htmlMeta.keywords){
					keywords=htmlMeta.keywords;
				}
				if(htmlMeta.image_src!=undefined && htmlMeta.image_src!=""){
					image_src=htmlMeta.image_src;
				}
				if(htmlMeta.ogTitle!=undefined && htmlMeta.ogTitle!=""){
					ogTitle=htmlMeta.ogTitle;
				}
				if(htmlMeta.ogDescription!=undefined && htmlMeta.ogDescription!=""){
					ogDescription=htmlMeta.ogDescription;
				}
			}



			var meta="";
			mtitle=mtitle.replace(metaCleanRegEx,' ');
			desc=desc.replace(metaCleanRegEx,' ');
			keywords=keywords.toString().replace(metaCleanRegEx,' ');
			ogTitle=ogTitle.replace(metaCleanRegEx,' ');
			ogDescription=ogDescription.replace(metaCleanRegEx,' ');
			try{
				meta = "<title>"+mtitle+"</title>\n" +
						"<meta name='author' content='"+ (config.title?config.title:"schemaengine") +"'/>\n" +
						"<meta name='description' content='"+ desc +"'/>\n" +
						"<meta name='keywords' content='"+ keywords +"'/>\n"+
						"<link  href='"+ image_src +"'  rel='image_src'/>\n"+

						"<meta property='og:type' content='website' />\n"+
						"<meta property='og:title' content='"+ogTitle+"' />\n"+
						"<meta property='og:image' content='"+ image_src +"' xmlns:og='http://opengraphprotocol.org/schema/'/>\n"+
						"<meta property='og:description' content='"+ ogDescription +"' />\n"+
						"<meta property='og:url' content='"+ handleBarMeta.canonicalUrl +"' />\n"+

						"<meta name='twitter:card' content='summary'/>\n" +
						"<meta name='twitter:title' content='"+ogTitle+"'/>\n" +
						"<meta name='twitter:description' content='"+ogDescription+"'/>\n" +
						"<meta name='twitter:image' content='"+ desc +"'/>\n" +
						"<link rel='alternate' href='"+handleBarMeta.url+"' hreflang='en-in' />\n"+
						nextPage+"\n"+
						prevPage+"\n";
				if(handleBarMeta.canonicalUrl){
					meta+="\n<link rel='canonical' href='"+handleBarMeta.canonicalUrl+"' />\n";
					//meta+="\n<link rel='canonical' href='"+topPageUrl+"' />\n";
				}
				if(skip>0){
					meta+="\n<link rel='canonical' href='"+topPageUrl+"' />\n";
				}

				if(!result.schema.webCrawlerIndex){
					meta+="\n<meta name='robots' content='noindex' />";
					meta+="<meta name='robots' content='nofollow' />\n";
				}
			}catch(err){}




			 rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
			    if (error) {
				logger.error({type:"rootMatchError",url:request.url,error:error});
			      response.status(500).send(error.message)
			    } else if (redirectLocation) {
			    	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
			    } else if (renderProps) {
			    	response.set('Content-Type', 'text/html');
					response.set('Strict-Transport-Security','max-age=31536000');
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
			    	response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude
				},function(err,data){
					if(err){
						logger.error({type:"renderError",url:request.url,error:err});
						response.write("<h1>Error occured</h1>")
					}else{
						console.log("Processed in : "+ (new Date() - startTime));
						response.write(data);
					}
					response.end();
				});
			    } else {
			      response.status(404).send('Not found')
			    }
			 });
				clearStores();
			console.log('Request processed');
		});
	});
}
exports.serveSummary=serveSummary;

function processRecordRequest(request,response){
	console.log('Requested detail page');
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	var org=request.params.org;
	var schema=request.params.schema;
	var recordId=request.params.recordId;
	var dependentSchema=(typeof request.query.ds=="undefined" || request.query.ds=="undefined")?undefined:request.query.ds;
	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setSiteSpecific((request.params && request.params.siteSpecific)?true:false);
		common.setShowOnlyMainContent(false);
		var handleBarMeta=getHandleBarMetaData(request,config);
		var lpi=handleBarMeta.lpi;
		//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
		//DefinitionStore.addNavigationLinks(navlinks);

		request.body.schema=schema;
		request.body.dependentSchema=dependentSchema;
		request.body.recordId=recordId;
		request.body.userId="CommonUser";
		request.body.org=org;
		WebAPI.getSchemaRecordForView(request.body,function(recRes){
			if(recRes.error){
				console.log(recRes.error);
				response.redirect("/views/pageNotFound");
				return;
			}
			var schemaRec=recRes.schema;
			if(!recRes.record){
				recRes.record={};
			}
			recRes.schema=schema;
			recRes.recordId=recordId;
			recRes.userId="CommonUser";
			recRes.org=org;
			RecordDetailStore.receiveSchemaRecord(recRes);

			var grrtime=new Date();
			if(schemaRec["@relations"] && Object.keys(schemaRec["@relations"]).length>0){
				console.log("getting Related records");
				getRelatedRecords(0);
			}else{
				//sendResponse();
				getGroupData(0);
			}

			function getRelatedRecords(index){
				if(index<Object.keys(schemaRec["@relations"]).length){
					var relation=schemaRec["@relations"][Object.keys(schemaRec["@relations"])[index]];
					//if server side rendering is on then get records
					if(relation.ssr){
						request.body.schema=schema;
						request.body.recordIds=undefined;
						if(recRes.record &&
								relation &&
								relation.relationRefKey &&
								recRes.record[relation.relationRefKey]){
							request.body.recordId=recRes.record[relation.relationRefKey];
						}else{
							request.body.recordId=recordId;
						}

						request.body.relation=relation.relationName;
						request.body.relationName=relation.relationName;
						request.body.relationRefSchema=relation.relationRefSchema
						request.body.rootSchema=schema;
						request.body.skip=0
						var toBeStoredIn=request.body.recordId;
						console.log(schema+" ->"+relation.relationName);
						WebAPI.getRelatedRecords(request.body,function(data){
							JunctionStore.receiveRelatedRecords({recordId:toBeStoredIn,relationName:relation.relationName,related:data});
							getRelatedRecords(index+1);
						});
					}else{
						getRelatedRecords(index+1);
					}
				}else{
					console.log("got related records : "+(new Date()-grrtime));
					console.log("getting group data");
					getGroupData(0)
					//sendResponse();
				}
			}

			function getGroupData(index){
				if(typeof schemaRec["@groups"]=="object" &&
						schemaRec["@groups"]!=undefined &&
						index<Object.keys(schemaRec["@groups"]).length){
					var group=schemaRec["@groups"][Object.keys(schemaRec["@groups"])[index]];
					if(group.ssr){
						//only if server side rendering is on
						console.log(group.schema+" ->"+group.viewName);
						var groupDetails=global.formGroupDetailRawData(group,Object.assign(recRes.record,{recordId:recordId}));
						getGroupData(index+1);
					}else{
						getGroupData(index+1);
					}
				}else{
					console.log("got group data");
					sendResponse();
				}
			}


			function sendResponse(){
				console.log('constructing  detail page');
				var summaryState=RecordSummaryStore.getAll();
				var junctionState=JunctionStore.getAll();
				var detailState=RecordDetailStore.getAll();
				var definitionState=DefinitionStore.getAll();

				var name="";
				if(recRes.schema && recRes.schema == "User"){
					name = (recRes.record.givenName?recRes.record.givenName:"")+" "+(recRes.record.familyName?recRes.record.familyName:"");
				}else if(recRes.schema && recRes.schema == "Question"){
					name = recRes.record.question?recRes.record.question:"Question";
				}else if(recRes.record.name){
					name = recRes.record.name;
				}else if(schemaRec["@identifier"] &&
						schemaRec["@identifier"]!="recordId" &&
						recRes.record[schemaRec["@identifier"]]){
					name = recRes.record[schemaRec["@identifier"]];
				}


				var desc = recRes.record.about?recRes.record.about:(recRes.record.description?recRes.record.description:name);
				if(recRes.schema && recRes.schema == "Question"){
					desc=recRes.record.question?recRes.record.question:name;
				}else if(recRes.schema && recRes.schema == "Article"){
					if(!recRes.record.about || recRes.record.about=="")
						desc=recRes.record.articleBody?recRes.record.articleBody:name;
				}


				var metaKeywords=[];
				for(var i=0;i<Object.keys(recRes.record).length;i++){
					var key=Object.keys(recRes.record)[i];
					if( key =="name" || key =="about" || key =="description" || key == "address"){
						if(key == "address" && recRes.record[key]){
							for(var j=0;j<Object.keys(recRes.record[key]).length;j++){
								var innerKey=Object.keys(recRes.record[key])[j];
								if( innerKey =="streetAddress" || innerKey =="addressRegion" || innerKey == "addressLocality" || innerKey == "addressCountry" || innerKey == "telephone"){
									metaKeywords.push(recRes.record[key][innerKey]);
								}
							}
						}else{
							metaKeywords.push(recRes.record[key]);
						}
					}else if(schemaRec["@identifier"] &&
							schemaRec["@identifier"]!="recordId" &&
							key==schemaRec["@identifier"]){
						metaKeywords.push(recRes.record[key]);
					}else if(schemaRec["@properties"] &&
							schemaRec["@properties"][key] &&
							schemaRec["@properties"][key].dataType &&
							schemaRec["@properties"][key].dataType.type &&
							schemaRec["@properties"][key].dataType.type=="text"){
						metaKeywords.push(recRes.record.esMeta);

					}else if(key=="esMeta"){
						metaKeywords.push(recRes.record.esMeta);
						desc += recRes.record.esMeta;
					}
				}

				var image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/wk_icon.jpg";
				if(recRes.record){
					if(recRes.record.productImages && Array.isArray(recRes.record.productImages) &&
							recRes.record.productImages[0] &&
							typeof recRes.record.productImages[0]=="object" &&
							recRes.record.productImages[0].produtImages &&
							Array.isArray(recRes.record.productImages[0].produtImages) &&
							typeof recRes.record.productImages[0].produtImages[0]=="object" &&
							recRes.record.productImages[0].produtImages[0].cloudinaryId){
						image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+recRes.record.productImages[0].produtImages[0].cloudinaryId+".jpg";
					}else if(recRes.record.image && Array.isArray(recRes.record.image) && recRes.record.image.length>0 && recRes.record.image[0].cloudinaryId && recRes.record.image[0].cloudinaryId!=""){
						image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+recRes.record.image[0].cloudinaryId+".jpg";
					}else if(recRes.record.profileImage && Array.isArray(recRes.record.profileImage) && recRes.record.profileImage.length>0 && recRes.record.profileImage[0].cloudinaryId && recRes.record.profileImage[0].cloudinaryId!=""){
						image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+recRes.record.profileImage[0].cloudinaryId+".jpg";
					}else if(recRes.record.images && Array.isArray(recRes.record.images) && recRes.record.images.length>0 && recRes.record.images[0].cloudinaryId && recRes.record.images[0].cloudinaryId!=""){
						image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+recRes.record.images[0].cloudinaryId+".jpg";
					}
				}
				var metaTitle="";
				/**
				 * title Properties
				 */
				try{
					if(schemaRec["titleProperties"].length>0){
						for(var i=schemaRec["titleProperties"].length-1;i>=0;i--){
							if(recRes.record[schemaRec["titleProperties"][i]]){
								var innerWords=recRes.record[schemaRec["titleProperties"][i]].split(" ");
								var wordToAdd="";
								if(schemaRec["titleProperties"].length>1){
									for(var j=0;j<innerWords.length;j++){
										if((metaTitle.length+wordToAdd.length)<=(65-innerWords[j].length)){
											wordToAdd+=" "+innerWords[j].trim();
										}
									}
								}else{
									wordToAdd=recRes.record[schemaRec["titleProperties"][i]];
								}
								metaTitle=" "+wordToAdd.trim()+" "+metaTitle.trim();
							}
						}
						metaTitle=metaTitle.trim();
					}
				}catch(err){
					metaTitle+=name;
				}
				/**
				 * description Properties
				 */
				try{
					if(schemaRec["descriptionProperties"].length>0){
						desc="";
						for(var i=0;i<schemaRec["descriptionProperties"].length;i++){
							if(typeof recRes.record[schemaRec["descriptionProperties"][i]] =="string"){
								desc+=" "+recRes.record[schemaRec["descriptionProperties"][i]];
							}else if(recRes.record[schemaRec["descriptionProperties"][i]] &&
									typeof recRes.record[schemaRec["descriptionProperties"][i]]=="object"){
								var dpkeys=Object.keys(recRes.record[schemaRec["descriptionProperties"][i]]);
								for(var k=0;k<dpkeys.length;k++){
									desc+=",  "+dpkeys[k]+" :   "+recRes.record[schemaRec["descriptionProperties"][i]][dpkeys[k]]
								}
							}
						}
					}
				}catch(err){
				}
				/**
				 * meta Keywords
				 */
				try{
					if(recRes.record["@metaKeywords"]){
						metaKeywords=recRes.record["@metaKeywords"];
					}
				}catch(err){

				}

				var meta="";
				try{
					meta =	"<title>"+metaTitle.replace(metaCleanRegEx,' ')+"</title>\n" +
							"<meta name='author' content='"+ (config.title?config.title:"schemaengine") +"'/>\n" +
							"<meta name='description' content='"+ desc.replace(metaCleanRegEx,' ') +"'/>\n" +
							"<meta name='keywords' content='"+ metaKeywords.toString().replace(metaCleanRegEx,' ') +"'/>\n"+
							"<meta property='og:image' content='"+ image_src +"' xmlns:og='http://opengraphprotocol.org/schema/'/>\n"+
							"<link  href='"+ image_src +"'  rel='image_src'/>\n"+

							"<meta property='og:type' content='website' />\n"+
							"<meta property='og:title' content='"+metaTitle.replace(metaCleanRegEx,' ')+"' />\n"+
							"<meta property='og:description' content='"+ desc.replace(metaCleanRegEx,' ') +"' />\n"+
							"<meta property='og:url' content='"+ handleBarMeta.canonicalUrl +"' />\n"+

							"<meta name='twitter:card' content='summary'/>\n" +
							"<meta name='twitter:title' content='"+metaTitle.replace(metaCleanRegEx,' ')+"'/>\n" +
							"<meta name='twitter:description' content='"+desc.replace(metaCleanRegEx,' ')+"'/>\n" +
							"<meta name='twitter:image' content='"+image_src+"'/>\n" +
							"<link rel='alternate' href='"+handleBarMeta.url+"' hreflang='en-in' />\n";
					if(handleBarMeta.canonicalUrl){
						meta+="\n<link rel='canonical' href='"+handleBarMeta.canonicalUrl+"' />\n";
					}

					if(!recRes.record.webCrawlerIndex){
						meta+="\n<meta name='robots' content='noindex' />";
						meta+="<meta name='robots' content='nofollow' />\n";
					}

				}catch(err){}

				var stateString=JSON.stringify({
							current:"recordView",
							schema:schema,
							dependentSchema:dependentSchema,
							org:org,
							recordId:recordId,
							slug:request.params.slug,
							allSlugs:common.getAllSlugs(),
							siteSpecific:(request.params && request.params.siteSpecific)?true:false
				});


				 rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
					    if (error) {
						logger.error({type:"rootMatchError",url:request.url,error:error});
					      response.status(500).send(error.message)
					    } else if (redirectLocation) {
					    	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
					    } else if (renderProps) {
					    	response.set('Content-Type', 'text/html');
							response.set('Strict-Transport-Security','max-age=31536000');
							var dcD="";
							try{
								dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
							}catch(err){
								logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
							};

							response.write(fs.readFileSync(__dirname+'/views/headers.html'));
					    	response.render(handleBarMeta.handleBarTemplate,{
								dynamicContentDiv:dcD,
								state:stateString,
								meta:meta,
								cache:true,
								favIcon:handleBarMeta.favIcon,
								clientVersion:handleBarMeta.clientVersion,
								loader:handleBarMeta.loader,
								html:handleBarMeta.htmlToInclude
						},function(err,data){
							if(err){
								logger.error({type:"renderError",url:request.url,error:err});
								response.write("<h1>Error occured</h1>")
							}else{
								console.log("Processed in : "+ (new Date() - startTime));
								response.write(data);
							}
							response.end();
						});
					    } else {
					      response.status(404).send('Not found')
					    }
						clearStores();
							console.log('request processing done');
					 });
			}
		});
	});
}
exports.processRecordRequest=processRecordRequest;



function serveGroupView(request,response){
	var data=request.body;
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
	//var cloudPointHostId=(getConfigDetails(hostname))?getConfigDetails(hostname).cloudPointHostId:undefined;
	var cloudPointHostId=config.cloudPointHostId;
	WebAPI.getMainSchema({schema:data.schema,cloudPointHostId:cloudPointHostId},function(schema){
		var viewDefinition;
		if(schema && schema["@views"] && Array.isArray(schema["@views"])){
			for(var i=0;i<schema["@views"].length;i++){
				if(schema["@views"][i] && schema["@views"][i].viewName && schema["@views"][i].viewName==data.viewName){
					viewDefinition=schema["@views"][i];
				}
			}
		}

	WebAPI.getGroupData(request.body, function(result) {
		if(!result.error){
			SearchStore.put("GroupViewResults",data.schema,result);
		}else{
			SearchStore.put("GroupViewResults",data.schema,[]);
		}
		if(viewDefinition &&
				viewDefinition.value &&
				viewDefinition.value.type &&
				viewDefinition.value.type=="array" &&
				viewDefinition.value.elements &&
				viewDefinition.value.elements.type &&
				viewDefinition.value.elements.type=="object" &&
				viewDefinition.value.elements.objRef){

			request.body.recordIds=[];
			request.body.schema=viewDefinition.value.elements.objRef;
			for(var i=0;i<result.length;i++){
				request.body.recordIds=request.body.recordIds.concat(result[i].value);
			}
			WebAPI.getMainSchema({schema:request.body.schema,cloudPointHostId:cloudPointHostId},function(viewschema){
				WebAPI.getSearchResults(request.body,function(sresult){
					sresult.schema=viewschema;
					RecordDetailStore.receiveSchemaRecords(sresult);
					delete request.body.recordId;
					request.body.schema=schema["@id"];
					sendResponse();
				});
			});

		}else{
			sendResponse();
		}
		function sendResponse(){
		var GroupByWithinSchema=React.createFactory(require('./components/view/components/groupBy.jsx').GroupByWithinSchema);
		getCloudPointConfig(hostname,function(config){
			common.setConfigDetails(config);
			common.setShowOnlyMainContent(false);
			var handleBarMeta=getHandleBarMetaData(request,config);
			//var navlinks=getUnLoggedSessionObject(hostname).navLinks;

			//DefinitionStore.addNavigationLinks(navlinks);
			var summaryState=RecordSummaryStore.getAll();
			var junctionState=JunctionStore.getAll();
			var detailState=RecordDetailStore.getAll();
			var definitionState=DefinitionStore.getAll();






		var meta="";

		var title=request.body.displayName.replace(metaCleanRegEx,' ');
		var description=title;
		var keywords=title;
		if(typeof request.body.htmlMeta =="object"){
			title=request.body.htmlMeta.title;
			description=request.body.htmlMeta.description;
			keywords=request.body.htmlMeta.keywords;
		}
		try{
			meta = "<title>"+title+"</title>\n" +
					"<meta name='description' content='"+ description +"'/>\n" +
					"<meta name='keywords' content='"+ keywords +"'/>\n"+


					"<meta property='og:title' content='"+title+"' />\n"+
					"<meta property='og:description' content='"+ description +"' />\n"+
					"<meta property='og:url' content='"+ handleBarMeta.canonicalUrl +"' />\n"+
					"<meta property='og:type' content='website' />\n"+

					"<meta name='twitter:card' content='summary'/>\n" +
					"<meta name='twitter:title' content='"+title+"'/>\n" +
					"<meta name='twitter:description' content='"+description+"'/>\n" +


					"<link rel='alternate' href='"+handleBarMeta.url+"' hreflang='en-in' />\n";
				if(handleBarMeta.canonicalUrl){
					meta+="\n<link rel='canonical' href='"+handleBarMeta.canonicalUrl+"' />\n";
				}

		}catch(err){}




		var stateString=JSON.stringify({
				current:"groupView",
				data:request.body,
				viewResponse:result,
				viewDefinition:viewDefinition,
				slug:request.params.slug,
				allSlugs:common.getAllSlugs(),
				siteSpecific:(request.params && request.params.siteSpecific)?true:false
		});



		 rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
			    if (error) {
				logger.error({type:"rootMatchError",url:request.url,error:error});
			      response.status(500).send(error.message)
			    } else if (redirectLocation) {
			    	response.redirect(302, redirectLocation.pathname + redirectLocation.search)
			    } else if (renderProps) {
			    	response.set('Content-Type', 'text/html');
					response.set('Strict-Transport-Security','max-age=31536000');
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
			    	response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude
				},function(err,data){
					if(err){
						logger.error({type:"renderError",url:request.url,error:err});
						response.write("<h1>Error occured</h1>")
					}else{
						response.write(data);
					}
					response.end();
				});
			    } else {
			      response.status(404).send('Not found')
			    }
						clearStores();
						console.log('request processing done');
			 });
	});
	}
	});
	});
	});
}
exports.serveGroupView=serveGroupView;





function serveExplorePage(request,response){
	console.log('Requested explore page');
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	var searchTextId=request.params.id;
	request.body["@uniqueUserName"]=searchTextId;
	getCloudPointConfig(hostname,function(config){
		WebAPI.getExploreUniqueUserName(request.body,function(searchTextDoc){

			common.setSlugDetails(searchTextId,undefined,searchTextDoc);
			common.setShowOnlyMainContent(true);

			if(Array.isArray(searchTextDoc.mainLayout) && searchTextDoc.mainLayout.length>0){
				getSearchResults(0);
			}else{
				continueConstructExplorePage();
			}

			function getSearchResults(index){
				if(index<searchTextDoc.mainLayout.length){
					var layout=searchTextDoc.mainLayout[index];
					if(layout.type=="searchSchema"){
						var searchData={
								searchText:searchTextDoc.searchText,
								docType:layout.schemaName,
						};
						request.body=searchData;
						console.log("getting search relusts for  "+searchData.searchText,searchData.docType);
						WebAPI.getSearchResultsBydocType(searchData,function(sbdt){
							var ids=[];
							var records=[];
							try{
								sbdt.result.hits.hits.map(function(hit){
									ids.push(hit._id);
									records.push({
										id:hit["_id"],
										key:[],
										value:hit["_source"]["doc"]
									});
								});
							}catch(err){}
							if(ids.length>0){
								request.body={
									recordIds:ids,
									schema:layout.schemaName
								};

								//WebAPI.getSearchResults(request.body,function(data){
									//console.log("done getting docs   "+layout.schemaName,data.records.length);
									SearchStore.put(searchTextDoc.searchText,layout.schemaName,records);//data.records
									getSearchResults(index+1);
								//});

							}else{
								getSearchResults(index+1);
							}
						});
					}else{
						getSearchResults(index+1);
					}
				}else{
					continueConstructExplorePage();
				}
			}






			function continueConstructExplorePage(){
			common.setConfigDetails(config);
			var handleBarMeta=getHandleBarMetaData(request,config);
			//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
			//DefinitionStore.addNavigationLinks(navlinks);

			var stateString=JSON.stringify({
				slug:request.originalUrl,
				allSlugs:common.getAllSlugs()
			});

			var meta="";
			var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Explore | "+searchTextId;
			var description=mtitle;
			var ogTitle=mtitle;
			var ogDescription=mtitle;
			var image_src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/wk_icon.jpg";
			var keywords=mtitle;
			try{
				if(typeof searchTextDoc.htmlMeta == "object"){
					if(searchTextDoc.htmlMeta.title && searchTextDoc.htmlMeta.title!=""){
						mtitle=searchTextDoc.htmlMeta.title;
						ogTitle=mtitle;
					}
					if(searchTextDoc.htmlMeta.description && searchTextDoc.htmlMeta.description!=""){
						description=searchTextDoc.htmlMeta.description;
						ogDescription=description;
					}
					if(searchTextDoc.htmlMeta.ogTitle && searchTextDoc.htmlMeta.ogTitle!=""){
						ogTitle=searchTextDoc.htmlMeta.ogTitle;
					}
					if(searchTextDoc.htmlMeta.ogDescription && searchTextDoc.htmlMeta.ogDescription!=""){
						ogDescription=searchTextDoc.htmlMeta.ogDescription;
					}
					if(searchTextDoc.htmlMeta.keywords && searchTextDoc.htmlMeta.keywords!=""){
						keywords=searchTextDoc.htmlMeta.keywords;
					}
					if(searchTextDoc.htmlMeta.image_src && searchTextDoc.htmlMeta.image_src!=""){
						image_src=searchTextDoc.htmlMeta.image_src;
					}
				}

				meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
				"<meta name='description' content='"+ description.replace(metaCleanRegEx,' ') +"'/>\n" +
				"<meta name='keywords' content='"+ keywords.replace(metaCleanRegEx,' ') +"'/>\n"+

				"<link  href='"+ image_src +"'  rel='image_src'/>\n"+
				"<meta property='og:image' content='"+ image_src +"' xmlns:og='http://opengraphprotocol.org/schema/'/>\n"+

				"<meta property='og:title' content='"+ogTitle.replace(metaCleanRegEx,' ')+"' />\n"+
				"<meta property='og:description' content='"+ ogDescription.replace(metaCleanRegEx,' ') +"' />\n"+
				"<meta property='og:url' content='"+ handleBarMeta.canonicalUrl +"' />\n"+
				"<meta property='og:type' content='website' />\n"+

				"<meta name='twitter:card' content='summary'/>\n" +
				"<meta name='twitter:title' content='"+ogTitle.replace(metaCleanRegEx,' ')+"'/>\n" +
				"<meta name='twitter:description' content='"+ogDescription.replace(metaCleanRegEx,' ')+"'/>\n" +


				"<link rel='alternate' href='"+handleBarMeta.url+"' hreflang='en-in' />\n";
				if(handleBarMeta.canonicalUrl){
					meta+="\n<link rel='canonical' href='"+handleBarMeta.canonicalUrl+"' />\n";
				}
				if(!searchTextDoc.webCrawlerIndex){
					meta+="\n<meta name='robots' content='noindex' />";
					meta+="<meta name='robots' content='nofollow' />\n";
				}
			}catch(err){}

			response.set('Content-Type', 'text/html');
			response.set('Strict-Transport-Security','max-age=31536000');
			rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
				if (error) {
					logger.error({type:"rootMatchError",url:request.url,error:error});
					response.status(500).send(error.message);
				} else if (redirectLocation) {
					response.redirect(302, redirectLocation.pathname + redirectLocation.search)
				} else if (renderProps) {
					response.status(200);
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
					response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude,
					},function(err,data){
						if(err){
							logger.error({type:"renderError",url:request.url,error:err});
							response.write("<h1>Error occured</h1>")
						}else{
							console.log("Processed in : "+ (new Date() - startTime));
							response.write(data);
						}
						response.end();
					});
				} else {
					response.status(404).send('Not found')
				}
						clearStores();
			});
		}
		});
	});
}
exports.serveExplorePage=serveExplorePage;





function serveAdminSpecificPage(request,response){
	if(typeof request!="undefined" && ((typeof request.session!="undefined" && typeof request.session.userData!="undefined") || request.originalUrl.indexOf("manufacturerInfo")!=-1)){
		var startTime=new Date();
		var hostname=request.headers.host.split(":")[0];
		getCloudPointConfig(hostname,function(config){
			common.setConfigDetails(config);
			common.setShowOnlyMainContent(false);
			var handleBarMeta=getHandleBarMetaData(request,config);
			//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
			//DefinitionStore.addNavigationLinks(navlinks);
			var stateString=JSON.stringify({
				slug:request.originalUrl,
				allSlugs:common.getAllSlugs()
			});
			var meta="";
			var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Admin related page";
			try{
				meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
				"<meta name='author' content='"+ (handleBarMeta.title?handleBarMeta.title:"schemaengine") +"'/>\n";
			}catch(err){}
			response.set('Content-Type', 'text/html');
			response.set('Strict-Transport-Security','max-age=31536000');
			rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
				if (error) {
					logger.error({type:"rootMatchError",url:request.url,error:error});
					response.status(500).send(error.message);
				} else if (redirectLocation) {
					response.redirect(302, redirectLocation.pathname + redirectLocation.search)
				} else if (renderProps) {
					response.status(200);
					response.write(fs.readFileSync(__dirname+'/views/headers.html'));
					var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
					response.render(handleBarMeta.handleBarTemplate,{
						dynamicContentDiv:dcD,
						state:stateString,
						meta:meta,
						cache:true,
						favIcon:handleBarMeta.favIcon,
						clientVersion:handleBarMeta.clientVersion,
						loader:handleBarMeta.loader,
						html:handleBarMeta.htmlToInclude,
					},function(err,data){
						if(err){
							logger.error({type:"renderError",url:request.url,error:err});
							response.write("<h1>Error occured</h1>")
						}else{
							console.log("Processed in : "+ (new Date() - startTime));
							response.write(data);
						}
						response.end();
					});
				} else {
					response.status(404).send('Not found')
				}
						clearStores();
			});
		});
	}else{
		response.redirect("/");
	}
}
exports.serveAdminSpecificPage=serveAdminSpecificPage;


function serveOrgPage(request,response){
	var startTime=new Date();
	var hostname=request.headers.host.split(":")[0];
	getCloudPointConfig(hostname,function(config){
		common.setConfigDetails(config);
		common.setShowOnlyMainContent(false);
		var handleBarMeta=getHandleBarMetaData(request,config);
		//var navlinks=getUnLoggedSessionObject(hostname).navLinks;
		//DefinitionStore.addNavigationLinks(navlinks);
		var stateString=JSON.stringify({
			slug:request.originalUrl,
			allSlugs:common.getAllSlugs()
		});
		var meta="";
		var mtitle=(handleBarMeta.title?handleBarMeta.title:"schemaengine")+": Org page";
		try{
			meta = "<title>"+mtitle.replace(metaCleanRegEx,' ')+"</title>\n" +
			"<meta name='author' content='"+ (handleBarMeta.title?handleBarMeta.title:"schemaengine") +"'/>\n";
		}catch(err){}
		response.set('Content-Type', 'text/html');
		response.set('Strict-Transport-Security','max-age=31536000');
		rr.match({ routes, location: request.url }, function(error, redirectLocation, renderProps){
			if (error) {
				logger.error({type:"rootMatchError",url:request.url,error:error});
				response.status(500).send(error.message);
			} else if (redirectLocation) {
				response.redirect(302, redirectLocation.pathname + redirectLocation.search)
			} else if (renderProps) {
				response.status(200);
				response.write(fs.readFileSync(__dirname+'/views/headers.html'));
				var dcD="";
					try{
						dcD=ReactDOMServer.renderToString(<rr.RouterContext {...renderProps} />);
					}catch(err){
						logger.error({type:"Rout Render Error",url:request.url,error:err.message,stack:err.stack});
					};
				response.render(handleBarMeta.handleBarTemplate,{
					dynamicContentDiv:dcD,
					state:stateString,
					meta:meta,
					cache:true,
					favIcon:handleBarMeta.favIcon,
					clientVersion:handleBarMeta.clientVersion,
					loader:handleBarMeta.loader,
					html:handleBarMeta.htmlToInclude,
				},function(err,data){
					if(err){
						logger.error({type:"renderError",url:request.url,error:err});
						response.write("<h1>Error occured</h1>")
					}else{
						console.log("Processed in : "+ (new Date() - startTime));
						response.write(data);
					}
					response.end();
				});
			} else {
				response.status(404).send('Not found')
			}
						clearStores();
		});
	});
}
exports.serveOrgPage=serveOrgPage;
