var builder = require('botbuilder');
var schemaengine=require('../api/schemaengine.js');
module.exports=[
    function (session,args) {
    		console.log("In View Supplier");
    		console.log(args);
   			session.sendTyping();
   			if(!args){
   				args={};
   			}
				if(!session.dialogData){
					session.dialogData={};
				}
   			if(args && args.recordId){
       		schemaengine.getSupplier({recordId:args.recordId},function(record){
						 	var msg = new builder.Message(session);
							var imgId="wkcrash";
							try{imgId=record.profileImage[0].cloudinaryId}catch(err){};
							var imageUrl="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+imgId+".jpg";
							var detailUrl="http://www.schemaengine.com/"+record["@uniqueUserName"];
							if(!record["@uniqueUserName"]){
								detailUrl="https://www.schemaengine.com/d/Suppliers/"+record.recordId+"/"+record.recordId+"?s=Supplier"
							}
							
							var att={
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
								       			"type": "TextBlock",
								            "text": record.about,
								            "wrap": true
								        },
								        {
								            "type": "Image",
								            "size": "large",
								            "url":imageUrl
								        }
								    ],
								    "actions": [
								    		{
								    				"type": "Action.OpenUrl",
								            "method": "POST",
								            "url": detailUrl,
								            "title": "Find it on schemaengine"
								    		},
								    		/*{
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "https://www.facebook.com/sharer/sharer.php?u=" +encodeURIComponent(detailUrl),
								            "title": "Share on facebook"
								        },
								        {
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "https://twitter.com/home?status=" + encodeURIComponent(detailUrl),
								            "title": "Share on twitter"
								        },
								        {
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "https://www.linkedin.com/cws/share?url=" + encodeURIComponent(detailUrl),
								            "title": "Share on linkedin"
								        },
								        {
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "https://plus.google.com/share?url=" + encodeURIComponent(detailUrl),
								            "title": "Share on google plus"
								        },
								        {
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "http://pinterest.com/pin/create/button/?url=" + encodeURIComponent(detailUrl),
								            "title": "Share on pinterest"
								        },*/
								        {
								            "type": "Action.OpenUrl",
								            "method": "POST",
								            "url": "whatsapp://send?text=" +encodeURIComponent("Check out this page - ") +encodeURIComponent(detailUrl),
								            "title": "Share on WhatsApp"
								        }
								    ]
								  }
							};
							if(record.specifications){
									att.content.body.push( {
					            "type": "TextBlock",
					            "text": record.specifications,
					            "wrap": true
					        });
							}
							if(record.description){
									att.content.body.push( {
					            "type": "TextBlock",
					            "text": record.description,
					            "wrap": true
					        });
							}
       				msg.attachments([att]);
							session.endDialog(msg);				
					});
				}else{
					session.endDialog("Oops something went wrong start again!");	
				}
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
