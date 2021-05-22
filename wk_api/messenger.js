'use strict';
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const Wit = require('node-wit').Wit;
var config=require('../config/ReactConfig');
config=config.init;

const PORT = 8445;

//Wit.ai parameters
const WIT_TOKEN = "WUH2QOSYXTMUI4M2CQ4J5LHF3JYDIVOZ";

//Messenger API parameters
const FB_PAGE_ID = 904397809584129;
//const FB_PAGE_TOKEN = "CAAGrAWpJfqQBAFKVBZCPJ7dEXzsgjCAjm9dxjZAZBAt0cbKzZB5G1DnZAL4dhnW2svX5ZAvH0sWbMyRq88Xj0T7Dqzl2xuMCMOvLb07p2oJS3xSBJOwBYZCZC0ZA8ebbpdljEQz7TE9M0Qxk0CWCiqOB3azoKXQatqfpbame9ZBv8CQEO7Xx63rhbyD3zuGAap7nzqrfQZCCuO41gZDZD";
const FB_PAGE_TOKEN = "EAAGrAWpJfqQBABllgZAniQ2yb2UxuRuVXv1e15wZC5LAGjswhmAXXxf7rtEapKmjbd9skBxiLDurKrSZBrExY1SiY8wZBYw8bv6FLLOK812eZCnJ49M8zXkErBWFK4FprNpQwSAJdLJ30hBMxONvrnoth6SyHOEHvJsKisWUHhgZDZD";
//curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=EAAGrAWpJfqQBABllgZAniQ2yb2UxuRuVXv1e15wZC5LAGjswhmAXXxf7rtEapKmjbd9skBxiLDurKrSZBrExY1SiY8wZBYw8bv6FLLOK812eZCnJ49M8zXkErBWFK4FprNpQwSAJdLJ30hBMxONvrnoth6SyHOEHvJsKisWUHhgZDZD"
const FB_VERIFY_TOKEN = "react#CMS123";

//Messenger API specific code
const fbReq = request.defaults({
	uri: 'https://graph.facebook.com/v2.6/me/messages',
	method: 'POST',
	json: true,
	qs: { access_token: FB_PAGE_TOKEN },
	headers: {'Content-Type': 'application/json'},
});

const fbMessage = (recipientId, msg, cb) => {
	const opts = {
			form: {
				recipient: {
					id: recipientId,
				},
				message:msg,
			},
	};
	fbReq(opts, (err, resp, data) => {
		if (cb) {
			cb(err || data.error && data.error.message, data);
		}
	});
};


const getFirstMessagingEntry = (body) => {
	const val = body.object == 'page' &&
	body.entry &&
	Array.isArray(body.entry) &&
	body.entry.length > 0 &&
	body.entry[0] &&
	body.entry[0].id == FB_PAGE_ID &&
	body.entry[0].messaging &&
	Array.isArray(body.entry[0].messaging) &&
	body.entry[0].messaging.length > 0 &&
	body.entry[0].messaging[0]
	;
	return val || null;
};

const firstEntityValue = (entities, entity) => {
	const val = entities && entities[entity] &&
	Array.isArray(entities[entity]) &&
	entities[entity].length > 0 &&
	entities[entity][0].value;
	if (!val) {
		return null;
	}
	return typeof val === 'object' ? val.value : val;
};

//Wit.ai bot specific code

//This will contain all user sessions.
//Each session has an entry:
//sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};
const findOrCreateSession = (fbid) => {
	let sessionId;
	// Let's see if we already have a session for the user fbid
	Object.keys(sessions).forEach(k => {
		if (sessions[k].fbid === fbid) {
			// Yep, got it!
			sessionId = k;
		}
	});
	if (!sessionId) {
		// No session found for user fbid, let's create a new one
		sessionId = new Date().toISOString();
		sessions[sessionId] = {fbid: fbid, context: {}};
	}
	return sessionId;
};

//Our bot actions
const actions = {
		say: (sessionId, context, message, cb) => {
			try{
				const recipientId = sessions[sessionId].fbid;

				var message=constructMessage(sessionId, context, message, cb);

				if (recipientId) {
					fbMessage(recipientId, message, (err, data) => {
						if (err) {
							console.log('Oops! An error occurred while forwarding the response to',recipientId,':',err);
						}
						cb();// Let's give the wheel back to our bot
					});
				} else {
					console.log('Oops! Couldn\'t find user for session:', sessionId);
					cb();// Giving the wheel back to our bot
				}
			}catch(err){
				console.log("while sending wit say    ->"+err);;
			}
		},
		merge: (sessionId, context, entities, message, cb) => {
			/*
			const productType = firstEntityValue(entities, 'wit_product_type');
			try{
				if (productType && !context.productType) {
					context.productType = productType;
				}
			}catch(err){
				console.log("while merging    ->"+err);;
			}*/
			/*const typeKey = firstEntityValue(entities, 'wit_type_key');
			try{ 	 
				if (typeKey && !context.typeKey) {
					context.typeKey = typeKey;
				}
			}catch(err){
				console.log("while merging    ->"+err);;
			}
			const subType = firstEntityValue(entities, 'wit_product_sub_type');
			try{ 	 
				if (subType && !context.subType) {
					context.subType = subType;
				}
			}catch(err){
				console.log("while merging    ->"+err);;
			}*/
			try{
				if (!context.pickProduct) {
					context.pickProduct = "no";
				}
			}catch(err){
				console.log("while merging    ->"+err);;
			}
			cb(context);
		},
		error: (sessionId, context, error) => {
			console.log(error);
			/*context.error=error;
			const recipientId = sessions[sessionId].fbid;

			var message= {
					text: message
			}
			if (recipientId) {
				fbMessage(recipientId, message, (err, data) => {
					if (err) {
						console.log('Oops! An error occurred while forwarding the response to',recipientId,':',err);
					}
				});
			}*/
		},
		//custom actions
		pickAction: (sessionId,context,cb) => {
			context.productTypes="NA";
			context.subTypes="NA";
			context.products="NA";
			context.product="NA";
			if(context.productId && context.productId!="NA"){
				getProduct(sessionId,context,cb);
			}else if(context.productType && context.subType && context.typeKey && 
					context.productType!="NA" && context.subType!="NA" && context.typeKey!="NA"){
				getProducts(sessionId,context,cb);
			}else if(context.productType && context.productType!="NA" ){
				searchProduct(sessionId,context,cb);
			}else if(context.pickProduct && context.pickProduct=="yes"){
				getProductType(sessionId,context,cb);
			}else{
				cb(context);
			}
		},
		getProduct: (sessionId, context, cb) => {
			getProduct(sessionId, context, cb);
		},
		getProductType: (sessionId, context, cb) => {
			getProductType(sessionId, context, cb);
		},
		searchProduct: (sessionId, context, cb) => {
			searchProduct(sessionId, context, cb);
		},
		getProducts: (sessionId, context, cb) => {
			getProducts(sessionId, context, cb);
		}
};

const wit = new Wit(WIT_TOKEN, actions);
const app = express();
app.set('port', PORT);
app.use(bodyParser.json());
//app.listen(app.get('port'));

var https = require('https');
var httpsServer = https.createServer(config.sslOptions, app);

httpsServer.listen(app.get('port'),function(){//config.DeployPort
	console.log('HTTPS:  Express app started on port  '+app.get('port'));
});







//Webhook setup
app.get('/fb', (req, res) => {
	if (!FB_VERIFY_TOKEN) {
		throw new Error('missing FB_VERIFY_TOKEN');
	}
	if (req.query['hub.mode'] === 'subscribe' &&
			req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge']);
	} else {
		res.sendStatus(400);
	}
});
//Message handler
app.post('/fb', (req, res) => {
	const messaging = getFirstMessagingEntry(req.body);
	if (messaging && messaging.recipient.id == FB_PAGE_ID) {
		const sender = messaging.sender.id;
		// We retrieve the user's current session, or create one if it doesn't exist. This is needed for our bot to figure out the conversation history
		const sessionId = findOrCreateSession(sender);
		const msg = (messaging.message)?messaging.message.text:undefined;
		const atts = (messaging.message)?messaging.message.attachments:undefined;
		var postback=(messaging.postback && messaging.postback.payload)?messaging.postback.payload:undefined;
		if (atts) {   // We received an attachment. Let's reply with an automatic message
			fbMessage(sender,'Sorry I can only process text messages for now.');
		} else if (msg) {  // We received a text message. Let's forward the message to the Wit.ai Bot Engine. This will run all actions until our bot has nothing left to do
			try{
			wit.runActions(
					sessionId, // the user's current session
					msg, // the user's message 
					sessions[sessionId].context, // the user's current session state
					(error, context) => {
						if (error) {
							console.log('Oops! Got an error from Wit:', error);
						} else {
							//sessions[sessionId].context = context;
							delete sessions[sessionId];
						}
					}
			);
			}catch(err){
				console.log("while running wit actions    ->"+err);;
			}
		}else if(postback){
			sessions[sessionId].context.pickProduct="yes";
			if(postback.indexOf(":")>-1){
				if(postback.split(":").length>1){
					sessions[sessionId].context.productType=postback.split(":")[1];
				}
				if(postback.split(":").length>2){
					sessions[sessionId].context.productId=postback.split(":")[2];
				}
			}else if(postback.indexOf("->")>-1){
				if(postback.split("->").length>1){
					sessions[sessionId].context.productType=postback.split("->")[1];
				}
				if(postback.split("->").length>2){
					sessions[sessionId].context.typeKey=postback.split("->")[2];
				}
				if(postback.split("->").length>3){
					sessions[sessionId].context.subType=postback.split("->")[3];
				}
				if(postback.split("->").length>4){
					sessions[sessionId].context.skip=postback.split("->")[4];
				}
			}else{
				sessions[sessionId].context.productType="NA";
				sessions[sessionId].context.productId="NA";
				sessions[sessionId].context.productId="NA";
				sessions[sessionId].context.typeKey="NA";
				sessions[sessionId].context.subType="NA";
				sessions[sessionId].context.skip="NA";
			}
			try{
			wit.runActions(
					sessionId, // the user's current session
					postback, // the user's message 
					sessions[sessionId].context, // the user's current session state
					(error, context) => {
					
						if (error) {
							console.log('Oops! Got an error from Wit:', error);
						} else {
							//sessions[sessionId].context = context;
							delete sessions[sessionId];
						}
					}
			);
			}catch(err){
				console.log("while running wit actions    ->"+err);;
			}
		}
	}
	res.sendStatus(200);
});

function getProductType(sessionId, context, cb){
	var url="https://www.wishkarma.com/generic?operation=getSchemaById&data="+JSON.stringify({Id:"Product"});
	require('https').get(url, function(res) {
		var htmlString="";
		res.on('data', function(chunk){
			htmlString+=chunk;   
		});
		res.on('end', function(){
			var types=[];
			try{
				var schema=JSON.parse(htmlString);
				types=schema["@properties"]["productType"].dataType.options;
			}catch(err){
				console.log("while parsing product  schema    ->"+err);;
			}
			context.productTypes=types;
			cb(context);
		})
	}).on('error', function(e) {
		htmlString="errorOccured";
			cb(context);
	});
}
function searchProduct(sessionId, context, cb){
	var url="https://www.wishkarma.com/generic?operation=getSchemaById&data="+JSON.stringify({Id:"Product-"+context.productType});
	require('https').get(url, function(res) {
		var htmlString="";
		res.on('data', function(chunk){
			htmlString+=chunk;   
		});
		res.on('end', function(){
			var typeKey="type";
			var typeKeyDisplayName="type";
			var types=[];
			try{
				var schema=JSON.parse(htmlString);
				typeKey=schema["@views"][0].key[3];
				types=schema["@properties"][typeKey].dataType.options;
				typeKeyDisplayName=schema["@properties"][typeKey].displayName;
			}catch(err){
				console.log("while parsing product-type schema    ->"+err);;
			}
			context.typeKey=typeKey;
			context.subTypes=types;
			context.typeKeyDisplayName=typeKeyDisplayName;
			if(context.subTypes.length==0){
				getProducts(sessionId, context, cb);
			}else{
				cb(context);
			}
		})
	}).on('error', function(e) {
		htmlString="errorOccured"
			cb(context);
	});


}

function getProducts(sessionId, context, cb){
	var productType=context.productType;
	var subType=context.subType;
	var skip=context.skip?context.skip:0;
	var filters={
			dependentSchema:productType,

			filters:{
				//"faucetType":[subType],
				"productType":[productType],
				"$status":["published"]
			},

			org:"public",

			schema:"Product",
			skip:skip
	};
	if(context.typeKey && context.subType){
		filters.filters[context.typeKey]=[context.subType];
	}
	//console.log(filters);
	var url="https://www.wishkarma.com/generic?operation=getSchemaRecords&data="+JSON.stringify(filters);
	require('https').get(url, function(res) {
		var htmlString="";
		res.on('data', function(chunk){
			htmlString+=chunk;   
		});
		res.on('end', function(){
			try{
				var products=JSON.parse(htmlString);
				context.products=products.records;
			}catch(err){
				console.log("while parsing product records    ->"+err);;
				context.products=[];
			}
			cb(context);
			/*getProductImages(0);
			function getProductImages(index){
				if(index==9){
					cb(context);
				}else if(index<context.products.length){
					
					
					
					
					
					
					var relurl="https://www.wishkarma.com/generic?operation=getRelatedRecords&data="+JSON.stringify({
						"org":"public",
						"recordId":context.products[index].id,
						"relation":	"hasImage",	
						"relationRefSchema":"ProductImage",
						"rootSchema":"Product",
						"skip":0
					});
						
						
						require('https').get(relurl, function(res) {
							var htmlString="";
							res.on('data', function(chunk){
								htmlString+=chunk;   
							});
							res.on('end', function(){
								var images=[];
								try{
									var records=JSON.parse(htmlString).records;
									for(var i=0;i<records.length;i++){
										images.push(records[i].value.image[0])
									}
									context.products[index].value.images=images;
								}catch(err){
									console.log("while parsing product images    ->"+err);;
								}
								getProductImages(index+1);
							})
						}).on('error', function(e) {
							htmlString="errorOccured";
							getProductImages(index+1)
						});
					
					
					
					
					
					
					
					
					
					
					
					
					
				}else{
					cb(context);
				}
			}*/
			
			
			
			
			
			
			
			
			
			
			
			
			
		})
	}).on('error', function(e) {
		htmlString="errorOccured"
			cb(context);
	});
}
function getProduct(sessionId, context, cb){
	var url="https://www.wishkarma.com/generic?operation=getSchemaRecordForView&data="+JSON.stringify({"org":"public","recordId":context.productId,"schema":"Product","dependentSchema":context.productType});
	require('https').get(url, function(res) {
		var htmlString="";
		res.on('data', function(chunk){
			htmlString+=chunk;   
		});
		res.on('end', function(){
			var record={};
			try{
				record=JSON.parse(htmlString).record;
			}catch(err){
				console.log("while parsing response from wk product    ->"+err);;
			}
			context.product=record;
			var relurl="https://www.wishkarma.com/generic?operation=getRelatedRecords&data="+JSON.stringify({
				"org":"public",
				"recordId":context.productId,
				"relation":	"hasImage",	
				"relationRefSchema":"ProductImage",
				"rootSchema":"Product",
				"skip":0
			});
				
				
				require('https').get(relurl, function(res) {
					var htmlString="";
					res.on('data', function(chunk){
						htmlString+=chunk;   
					});
					res.on('end', function(){
						var images=[];
						try{
							var records=JSON.parse(htmlString).records;
							for(var i=0;i<records.length;i++){
								images.push(records[i].value.image[0])
							}
						}catch(err){
							console.log("while parsing images of a product    ->"+err);;
						}
						context.product.images=images;
						cb(context);
					})
				}).on('error', function(e) {
					htmlString="errorOccured";
						cb(context);
				});
			
			
			
		})
	}).on('error', function(e) {
		htmlString="errorOccured";
			cb(context);
	});
}
function constructMessage(sessionId, context, message, cb){
	var message= {
			text: message
	}
	
	if(context.error){
		//If there is an error
		message.text=context.error.message;
		delete context.error;
	}else if(context.productTypes && Array.isArray(context.productTypes) && context.productTypes.length && context.productTypes.length>0){
		//if requested for product types
		message={
				"attachment":{
					"type":"template",
					"payload":{
						"template_type":"generic",
						"elements":[]
					}
				}
		}
		var productTypes=context.productTypes;
		var i=0;
		while(i<productTypes.length){
			var element={
					title:"Please select a product category",
					buttons:[]
			};
			for(var j=i;j<i+3;j++){
				if(j<productTypes.length){
					element.buttons.push({
						"type":"postback",
						"title":productTypes[j],
						"payload":"Product->"+productTypes[j] 
					});
				}
			}
			if(message.attachment.payload.elements.length<9)
				message.attachment.payload.elements.push(element);
			i=i+3;
		}
	}else if(context.subTypes && Array.isArray(context.subTypes) && context.subTypes.length>0){
		//if requested for sub types
		message={
				"attachment":{
					"type":"template",
					"payload":{
						"template_type":"generic",
						"elements":[]
					}
				}
		}
		var i=0;
		while(i<context.subTypes.length){
			var element={
					title:"Please select "+context.productType+"'s "+context.typeKeyDisplayName.toLowerCase()+"",
					buttons:[]
			};
			for(var j=i;j<i+3;j++){
				if(j<context.subTypes.length){
					element.buttons.push({
						"type":"postback",
						"title":context.subTypes[j],
						"payload":"Product->"+context.productType +"->"+context.typeKey+"->"+ context.subTypes[j]
					});
				}
			}
			message.attachment.payload.elements.push(element);
			i=i+3;
		}
	}else if(context.products && Array.isArray(context.products)){
		//if requested for products summary
		message={
				"attachment":{
					"type":"template",
					"payload":{
						"template_type":"generic",
						"elements":[]
					}
				}
		}
		var skip=context.skip?context.skip+9:9;
		var i=0;
		while(i<context.products.length && i<9){
			var imageId=(context.products[i] && 
					context.products[i].value && 
					context.products[i].value.productImages && 
					context.products[i].value.productImages[0] && 
					context.products[i].value.productImages[0].produtImages && 
					context.products[i].value.productImages[0].produtImages[0] && 
					context.products[i].value.productImages[0].produtImages[0].cloudinaryId)?context.products[i].value.productImages[0].produtImages[0].cloudinaryId:"";
			var element={
	            	"title":context.products[i].value.name,
	            	"image_url":"https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_300,r_0/v1623462816/"+imageId+".jpg",
	            	"subtitle":context.products[i].value.name,
	            	"buttons":[
	            	           {
	            	        	   "type":"web_url",
	            	        	   "url":"https://www.wishkarma.com/d/Product/"+context.products[i].value.name+"/"+context.products[i].id+"/?s=Product&ds="+context.subType,
	            	        	   "title":"View Item"
	            	           },
	            	           {
	           					"type":"postback",
	           					"title":"Back",
	           					"payload":"Product->"+context.productType
	           					}
		            	            
	            	           ]
	            };
			message.attachment.payload.elements.push(element);
			/*var element={
					title:context.subType+" "+context.productType+"s",
					buttons:[]
			};
			for(var j=i;j<i+3;j++){
				if(j==context.products.length){
					break;
				}
				element.buttons.push({
					//"type":"web_url",
					//"title":context.products[j].value.name,
					//"url":"https://www.wishkarma.com/dtl/public/Product/"+context.products[j].id+"/?dependentSchema="+context.subType
					"type":"postback",
					"title":context.products[j].value.name,
					"payload":"Product:"+context.productType+":"+context.products[j].id
				});
			}
			message.attachment.payload.elements.push(element);
			i=i+3;*/
						            i++;
		}
		/*if(context.products.length>=17)
			message.attachment.payload.elements[message.attachment.payload.elements.length-1].buttons[2]={
					"type":"postback",
					"title":"More",
					"payload":"Product->"+context.productType +"->"+context.typeKey+"->"+ context.subType+"->17"
				};*/
		if(context.products.length>=9){
		message.attachment.payload.elements[message.attachment.payload.elements.length-1].buttons[2]={
					"type":"postback",
   					"title":"More",
   					"payload":"Product->"+context.productType +"->"+context.typeKey+"->"+ context.subType+"->"+skip
   				} 
		}
		if(context.products.length==0){
			message.attachment.payload.elements.push({
            	"title":"Currently there are no "+context.subType+" "+context.productType+"s",
            
            	"buttons":[
            	           {
           					"type":"postback",
           					"title":"Back",
           					"payload":"Product->"+context.productType
           					}      
            	           ]
            })
		}

	}else if(context.product && context.product!="NA"){
		message={
				"attachment":{
					"type":"template",
					"payload":{
						"template_type":"generic",
						"elements":[
						            {
						            	"title":context.product.name,
						            	"image_url":"https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_300,r_0/v1623462816/"+context.product.productImages[0].produtImages[0].cloudinaryId+".jpg",
						            	"subtitle":context.product.description.substring(0,79),
						            	"buttons":[
						            	           {
						            	        	   "type":"web_url",
						            	        	   "url":"https://www.wishkarma.com/d/Product/Product/"+context.productId+"/?s=Product&ds="+context.subType,
						            	        	   "title":"View Item"
						            	           },
						            	           {
						            	        	   "type":"web_url",
						            	        	   "url":"https://www.wishkarma.com/dtl/public/Product/"+context.productId+"/?s=Product&ds="+context.subType,
						            	        	   "title":"Check Price"
						            	           },
						            	           {
						            	        	   "type":"web_url",
						            	        	   "url":"https://www.wishkarma.com/dtl/public/Product/"+context.productId+"/?s=Product&ds="+context.subType,
						            	        	   "title":"Check Availability"
						            	           }        
						            	           ]
						            }
						            ]
					}
				}
		}
	
	}else{
		message={
				"attachment":{
					"type":"template",
					"payload":{
						"template_type":"generic",
						"elements":[
						            {
										title:"Welcome to wishkarma.com",
										image_url:"https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_300,r_0/v1623462816/"+"wk_icon"+".png",
						            	subtitle:"Build Your Wish",
						            	buttons:[
						            	           {
						           					"type":"postback",
						           					"title":"Look up products",
						           					"payload":"Product"
						           					}      
						            	           ]
										}
						         ]
					}
				}
		}
	}
	return message;
}
