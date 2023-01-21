var builder = require('botbuilder');
var schemaengine=require('../api/schemaengine.js');
var defaultLimit=schemaengine.defaultLimit;
var selectionLimit=schemaengine.selectionLimit;
//Mfr->Category->Filters
//Category-Filters
module.exports=[
    function (session, args, next) {
        // Resolve and store any Manufacturer entity passed from LUIS.
        console.log("Given input   "+session.message.text);
        console.log("----------------->IN discover Products 1");
        console.log(JSON.stringify(args));
        if(!args){
        	args={
        	"intent":{
							"intent": "Discover Products",
							"intents": [
								{
									"intent": "Discover Products"
								}
							],
							"entities": [],
							"compositeEntities": []
							}
						};
        }
				if(!session.dialogData){
					session.dialogData={};
				}
        var intent = args.intent;
        
        var mfr = builder.EntityRecognizer.findEntity(intent.entities, 'Manufacturer');
        var Manufacturer = mfr?mfr.entity:undefined;
        
        if(Manufacturer){Manufacturer=Manufacturer.toLowerCase()};
        console.log("Converation Data");
        console.log(session.conversationData);
        if(session.message.text.toLowerCase()==Manufacturer && session.conversationData && 
        	Array.isArray(session.conversationData.Manufacturers) && session.conversationData.Manufacturers.indexOf(Manufacturer)>-1){
        	args={
					"action": "*:DiscoverProducts",
					"intent": {
						"intent": "Discover Products",
						"intents": [
							{
								"intent": "Discover Products"
							}
						],
						"entities": [
							{
								"entity": session.conversationData.ProductCategory,
								"type": "ProductCategory"
							}
						],
						"compositeEntities": []
					},
					"libraryName": "*",
					"ProCatId":session.conversationData.ProCatId,
					"CityId":session.conversationData.CityId,
					"filters":session.conversationData.filters,
					"productType":session.conversationData.productType
				}
        }
        
        
        var category = builder.EntityRecognizer.findEntity(intent.entities, 'ProductCategory');
        var ProductCategory = category?category.entity:undefined;
        if(ProductCategory){ProductCategory=ProductCategory.replace(/tap/gi,"faucet");}
        
        var categorygroup = builder.EntityRecognizer.findEntity(intent.entities, 'ProductCategoryGroup');
        var ProductCategoryGroup = categorygroup?categorygroup.entity:undefined;
        
        var categorymastergroup = builder.EntityRecognizer.findEntity(intent.entities, 'ProductCategoryMasterGroup');
        var ProductCategoryMasterGroup = categorymastergroup?categorymastergroup.entity:undefined;
        
        var inputKeywords=[];
				try{
					var temp=session.message.text.toLowerCase().split(" ");
					for(var i=0;i<temp.length;i++){
						if(temp[i]!=Manufacturer && temp[i]!=ProductCategory)
							inputKeywords.push(temp[i]);
					}
				
				}catch(err){}
        var discoverProducts = session.dialogData.discoverProducts = {
          Manufacturer: Manufacturer,
          ProductCategory : ProductCategory,
          ProductCategoryGroup:ProductCategoryGroup,
          ProductCategoryMasterGroup:ProductCategoryMasterGroup,
          skip: args.skip?args.skip:0,
          MfrId: args.MfrId,
          ProCatId: args.ProCatId,
          CityId: args.CityId,
          filters:args.filters,
          productType:args.productType,
          inputKeywords:inputKeywords
        };
        
        if(discoverProducts.Manufacturer){
        	if(!discoverProducts.MfrId){//if comming from fresh request
        		discoverProducts.lookingFor="Manufacturer";
        		session.beginDialog("askMfrName",discoverProducts);
        	}else{
        		next();
        	}
        }else{
        	if(!discoverProducts.ProCatId){//if comming from fresh request
        		discoverProducts.lookingFor="ProductCategory";
        		session.beginDialog("askCategoryName",discoverProducts);
        	}else{
        		next();
        	}
        }
        
        
        /*if(discoverProducts.ProductCategory && !discoverProducts.Manufacturer){
        	if(!discoverProducts.ProCatId){//if comming from fresh request
        		discoverProducts.lookingFor="ProductCategory";
        		session.beginDialog("askCategoryName",discoverProducts);
        	}else{
        		next();
        	}
        }else{
        	if(!discoverProducts.MfrId){//if comming from fresh request
        		discoverProducts.lookingFor="Manufacturer";
        		session.beginDialog("askMfrName",discoverProducts);
        	}else{
        		next();
        	}
        }*/
        
    },
    function (session, results, next) {
    		console.log("----------------->IN discover Products 2");
    		console.log(results);
        console.log("sessionData");
        console.log(session.dialogData.discoverProducts);
        if (results) {
        	if(session.dialogData.discoverProducts.lookingFor=="Manufacturer"){
        		 	session.dialogData.discoverProducts.Manufacturer = results.name;
		          session.dialogData.discoverProducts.MfrId = results.recordId;
		          if(results.name){
		          	//session.send('You have selected "%s" brand',results.name);
		          }
		          if(!session.dialogData.discoverProducts.ProCatId){//if comming from fresh request
		          	session.dialogData.discoverProducts.lookingFor="ProductCategory";
				    		session.beginDialog("askCategoryName",session.dialogData.discoverProducts);
				    	}else{
				    		next();
				    	}	
        	}else if(session.dialogData.discoverProducts.lookingFor=="ProductCategory"){
        		session.dialogData.discoverProducts.ProductCategory = results.name;
        		session.dialogData.discoverProducts.ProCatId = results.recordId;
        		session.dialogData.discoverProducts.productType=results.productType;
        		if(results.name){
        			//session.send('You have selected "%s" category',results.name);
        		}
        		
        		/*if(!session.dialogData.discoverProducts.MfrId){//if comming from fresh request
        			session.dialogData.discoverProducts.lookingFor="Manufacturer";
			    		session.beginDialog("askMfrName",session.dialogData.discoverProducts);
			    	}else{
			    		next();
			    	}*/
			    	if(!session.dialogData.discoverProducts.filters){//if comming from fresh request
        			session.dialogData.discoverProducts.lookingFor="Filters";
			    		session.beginDialog("askProductFilter",session.dialogData.discoverProducts);
			    	}else{
			    		next();
			    	}
			    	
			    	
        	}else{
        		next();
        	}
        }else{
        	next();
        }
    },
    function (session, results,next) {
     		console.log("----------------->IN discover Products : lastbutone");
     		console.log(results);
        console.log("sessionData");
        console.log(session.dialogData.discoverProducts);
        if (results) {
        	/*if(session.dialogData.discoverProducts.lookingFor=="Manufacturer"){
        	 		session.dialogData.discoverProducts.Manufacturer = results.name;
		          session.dialogData.discoverProducts.MfrId = results.recordId;
		          
		          //session.send('You have selected "%s" brand',results.name);
		          next();
        	}else */if(session.dialogData.discoverProducts.lookingFor=="ProductCategory"){
        		session.dialogData.discoverProducts.ProductCategory = results.name;
        		session.dialogData.discoverProducts.ProCatId = results.recordId;
        		session.dialogData.discoverProducts.productType= results.productType;
        		if(results.name){
        			//session.send('You have selected "%s" category',results.name);
        		}
        		if(!session.dialogData.discoverProducts.filters){
        			session.dialogData.discoverProducts.lookingFor="Filters";
							session.beginDialog("askProductFilter",session.dialogData.discoverProducts);
						}else{
							next();
						}
         	}else if(session.dialogData.discoverProducts.lookingFor=="Filters"){
         		session.dialogData.discoverProducts.filters = results.filters;
         		next();
         	}else{
         		next();
         	}
        }else{
        	next();
        }
    },
   /* function (session, results,next){
    	if(!session.dialogData.discoverProducts.filters){
    		session.beginDialog("askProductFilter",session.dialogData.discoverProducts);
    	}else{
    		next();
    	}
    },*/
    function (session, results) {
    		console.log("----------------->IN discover Products : last step");
    		console.log(results);
    		if(session.dialogData.discoverProducts.lookingFor=="Filters"){
		  		if(results && results.filters && Object.keys(results.filters).length>0){
		  			session.dialogData.discoverProducts.filters=results.filters;
		  		}
    		}
    		console.log("sessionData");
    		console.log(session.dialogData.discoverProducts);
     		session.sendTyping();
     		try{if(session.dialogData.discoverProducts.MfrId){
     			session.dialogData.discoverProducts.filters.Manufacturer=[session.dialogData.discoverProducts.MfrId];
     		}}catch(err){console.log(err)};
     		schemaengine.getProducts(session.dialogData.discoverProducts,function(data){
     			var msg = new builder.Message(session)
					var atts=[];
					data.records.forEach(function(record,index){
						if(index<defaultLimit){
							var imgId="wkcrash";
							try{imgId=record.productImages[0].produtImages[0].cloudinaryId}catch(err){};
							var imageUrl="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+imgId+".jpg";
							var detailUrl="http://www.schemaengine.com/"+record["@uniqueUserName"];
							if(!record["@uniqueUserName"]){
								detailUrl="https://www.schemaengine.com/d/Products/"+record.recordId+"/"+record.recordId+"?s=Product&ds="+record.productType
							}
							atts.push({
								contentType: "application/vnd.microsoft.card.adaptive",
								content: {
									 type: "AdaptiveCard",
								   body: [
								        {
								            "type": "TextBlock",
								            "text": record.name,
								            "size": "large",
								            "weight": "bolder",
								            "wrap": true
								        },
								        {
								            "type": "TextBlock",
								            "text": record.esMeta
								        },
								        {
								            "type": "Image",
								            "size": "medium",
								            "url":imageUrl
								        }
								    ],
								    "actions": [
								        /*{
														"type": "Action.Submit",
														"title": "View Product",
														"data": {
															"type":"ViewProduct",
															"productType"		:	session.dialogData.discoverProducts.productType,
															"recordId"			: record.recordId
														}
												}*/
												{
								    				"type": "Action.OpenUrl",
								            "method": "POST",
								            "url": detailUrl,
								            "title": "Find it on schemaengine"
								    		}/*,
												 {
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "whatsapp://send?text=" +encodeURIComponent("Check out this page - ") +encodeURIComponent(detailUrl),
								            "title": "Share on WhatsApp"
								        }*/
								    ]
									}
								});
								/*atts.push(new builder.HeroCard(session)
								    .title(record.name)
								    .subtitle(record.esMeta)
								    .text(record.description)
								    .images([builder.CardImage.create(session, imageUrl)])
								    .buttons([
								        builder.CardAction.openUrl(session,detailUrl,"View Product")
								    	])
										);*/
							}
						});
						msg.attachmentLayout(builder.AttachmentLayout.carousel)
						msg.attachments(atts);
						session.conversationData={
							"Manufacturers" : session.conversationData?session.conversationData.Manufacturers:[],
							"type":"DiscoverProducts",
							"Manufacturer"	:	session.dialogData.discoverProducts.Manufacturer,
							"MfrId"					:	session.dialogData.discoverProducts.MfrId,
							"ProductCategory":session.dialogData.discoverProducts.ProductCategory,
							"productType"		:	session.dialogData.discoverProducts.productType,
							"ProCatId"			:	session.dialogData.discoverProducts.ProCatId,
							"skip"					:	session.dialogData.discoverProducts.skip+defaultLimit,
							"filters"				:	session.dialogData.discoverProducts.filters
						};
						if(atts.length>0){
							session.send(msg);
							if(data.records.length>defaultLimit){
								var msg = new builder.Message(session);
								msg.attachments([({
									contentType: "application/vnd.microsoft.card.adaptive",
									content: {
										 "type": "AdaptiveCard",
										 "body": [],
										 "actions": [
										       {
														"type": "Action.Submit",
														"title": "Show More",
														"data": {
															"type":"DiscoverProducts",
															"Manufacturer"	:	session.dialogData.discoverProducts.Manufacturer,
															"MfrId"					:	session.dialogData.discoverProducts.MfrId,
															"ProductCategory":session.dialogData.discoverProducts.ProductCategory,
															"productType"		:	session.dialogData.discoverProducts.productType,
															"ProCatId"			:	session.dialogData.discoverProducts.ProCatId,
															"skip"					:	session.dialogData.discoverProducts.skip+defaultLimit,
															"filters"				:	session.dialogData.discoverProducts.filters
														}
												}
									  	]
										}
								})]);
								session.endDialog(msg);
							}else{
								session.endDialog();
							}
						}else{
							session.endDialog("Sorry! Nothing found.");
						}
     		});     	
     }
]
