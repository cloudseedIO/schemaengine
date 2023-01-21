var builder = require('botbuilder');
var schemaengine=require('../api/schemaengine.js');
var defaultLimit=schemaengine.defaultLimit;
var selectionLimit=schemaengine.selectionLimit;
module.exports=[
    function (session, args, next) {
        // Resolve and store any Manufacturer entity passed from LUIS.
        console.log("------------------->IN locate suppliers 1");
        console.log(args);
        if(!args){
        	args={
        	"intent":{
							"intent": "Locate Suppliers",
							"intents": [
								{
									"intent": "Locate Suppliers"
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
        var category = builder.EntityRecognizer.findEntity(intent.entities, 'ProductCategory');
        var ProductCategory = category?category.entity:undefined;
       	if(ProductCategory){ProductCategory=ProductCategory.replace(/tap/gi,"faucet");}
       	
        var city = builder.EntityRecognizer.findEntity(intent.entities, 'City');

        var locateSuppliers = session.dialogData.locateSuppliers = {
          Manufacturer: mfr ? mfr.entity : undefined,
          ProductCategory: ProductCategory,
          City : city ? city.entity : undefined,
          skip: args.skip?args.skip:0,
          MfrId: args.MfrId,
          ProCatId: args.ProCatId,
          CityId: args.CityId,
          intent: "LocateSuppliers"
        };
        
        if(!locateSuppliers.MfrId){//if comming from fresh request
        	 if(locateSuppliers.ProductCategory && !locateSuppliers.ProCatId && locateSuppliers.skip==0){
       				locateSuppliers.lookingFor="ProductCategory";
       				session.beginDialog("askCategoryName",locateSuppliers);
    				}else{
    					locateSuppliers.lookingFor="Manufacturer";
        			session.beginDialog("askMfrName",locateSuppliers);
        		}
    		}else{
    			next();
    		}
    
    
    
    
    },
    function (session, results, next) {
    	console.log("------------------->IN locate suppliers 2");
      console.log(results);
      var locateSuppliers = session.dialogData.locateSuppliers;
      if(results){
      	if(locateSuppliers.lookingFor=="Manufacturer"){
				  if (results.name && results.recordId) {
				      locateSuppliers.Manufacturer = results.name;
				      locateSuppliers.MfrId = results.recordId;
				  }

					locateSuppliers.includeAll=true;
				  if(locateSuppliers.ProductCategory && !locateSuppliers.ProCatId && locateSuppliers.skip==0){
				   	session.dialogData.locateSuppliers.lookinfFor="ProductCategory";
				   	session.beginDialog("askCategoryName",locateSuppliers);
					}else{
						next();
					}
		  	}else if(locateSuppliers.lookingFor=="ProductCategory"){
		  		if (results.name && results.recordId) {
				      locateSuppliers.ProductCategory = results.name;
				      locateSuppliers.ProCatId = results.recordId;
				  }
		  		locateSuppliers.includeAll=true;
				  if(locateSuppliers.ProductCategory && !locateSuppliers.ProCatId && locateSuppliers.skip==0){
				   	session.dialogData.locateSuppliers.lookingFor="Manufacturer";
				   	session.beginDialog("askCategoryName",locateSuppliers);
					}else{
						next();
					}
		  	}
    	}else{
    		next();
    	}
    },
    
    function (session, results, next) {
       	console.log("------------------->IN locate suppliers 3");
        console.log(results);
        var locateSuppliers = session.dialogData.locateSuppliers;
        if(results){
        if (results.name && results.recordId && results.recordId!="All") {
            if(session.dialogData.locateSuppliers.lookingFor=="ProductCategory"){
            	locateSuppliers.ProductCategoryName = results.name;
           		locateSuppliers.ProCatId = results.recordId;
            }else if(session.dialogData.locateSuppliers.lookingFor=="Manufacturer"){
            	locateSuppliers.Manufacturer = results.name;
            	locateSuppliers.MfrId = results.recordId;
            }
        }
        }
      if(!locateSuppliers.CityId && locateSuppliers.skip==0){
       	session.beginDialog("askCityName",locateSuppliers);
    	}else{
    		next();
    	}
    },
    function (session, results,next) {
    		console.log("------------------->IN locate suppliers : Last but one");
        console.log(results);
        var locateSuppliers = session.dialogData.locateSuppliers;
        if (results && results.name && results.recordId && results.recordId!="All") {
            locateSuppliers.City = results.name;
            locateSuppliers.CityId=results.recordId
        }
        // Send confirmation to user
        /*session.send('Locating suppliers for brand "%s" in city "%s"', 
            locateSuppliers.Manufacturer, locateSuppliers.City);*/
         next();
    },
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    function (session, results) {
        console.log("------------------->IN locate suppliers :Last action");
    		console.log(results);
    		session.sendTyping();
    		console.log("sessionData");
    		console.log(session.dialogData.locateSuppliers);
     		schemaengine.getSuppliers(session.dialogData.locateSuppliers,function(data){
     			var msg = new builder.Message(session)	
					var atts=[];
					data.records.map(function(record,index){
						if(index<defaultLimit){
							var imgId="wkcrash";
							try{imgId=record.profileImage[0].cloudinaryId}catch(err){};
							var imageUrl="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+imgId+".jpg";
							var detailUrl="http://www.schemaengine.com/"+record["@uniqueUserName"];
							if(!record["@uniqueUserName"]){
								detailUrl="https://www.schemaengine.com/d/Suppliers/"+record.recordId+"/"+record.recordId+"?s=Supplier"
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
								            "text": getAddressString(record.address),
								            "wrap": true
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
								            "title": "View Supplier",
														"data": {
															"type":"ViewSupplier",
															"recordId":record.recordId
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
								    .subtitle("")
								    .text(record.about)
								    .images([builder.CardImage.create(session, imageUrl)])
								    	.buttons([
								        builder.CardAction.openUrl(session,detailUrl,"View Supplier")
								    	])
										);*/
							}
						});
						msg.attachmentLayout(builder.AttachmentLayout.carousel)
						msg.attachments(atts);
						if(atts.length>0){
							session.send(msg);
							if(data.records.length>defaultLimit){
								var msg=new builder.Message(session);
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
															"type":"LocateSuppliers",
															"Manufacturer":session.dialogData.locateSuppliers.Manufacturer,
															"ProductCategory":session.dialogData.locateSuppliers.ProductCategory,
															"City":session.dialogData.locateSuppliers.City,
															"skip":session.dialogData.locateSuppliers.skip+defaultLimit,
															"MfrId":session.dialogData.locateSuppliers.MfrId,
															"ProCatId":session.dialogData.locateSuppliers.ProCatId,
															"CityId":session.dialogData.locateSuppliers.CityId
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

function getAddressString(add){
		if(!add){
			return "";
		}
	   //{"addressCountry":"India","addressLocality":"Gurgaon","addressRegion":"New Delhi",
	   //"email":"customercare.in@grohe.com",
	   //"postalCode":"122001","streetAddress":"14th Floor, Building no5, Tower A DLF Cyber City, Phase III",
	   //"telephone":"+91-1244933000"}
	   var address="";
	   if(add.streetAddress){
	   	address+=add.streetAddress;
	   }
	   if(add.addressLocality && address.indexOf(add.addressLocality)==-1){
	   	address+=", "+add.addressLocality;
	   }
	   if(add.addressRegion && address.indexOf(add.addresRegion)==-1){
	   	address+=", "+add.addressRegion;
	   }
	   if(add.addressCountry && address.indexOf(add.addressCountry)==-1){
	   	address+=", "+add.addressCountry;
	   }
	   if(add.postalCode && address.indexOf(add.postalCode)==-1){
	   	address+=", "+add.postalCode;
	   }
	   return address; 
}

