var builder = require('botbuilder');
var wishkarma=require('../api/wishkarma.js');
module.exports=[
    function (session,args) {
    		console.log("In viewProduct");
    		console.log(args);
   			session.sendTyping();
   			if(!args){
   				args={};
   			}
				if(!session.dialogData){
					session.dialogData={};
				}
   			if(args && args.recordId){
       		wishkarma.getProduct({recordId:args.recordId},function(record){
						 	var msg = new builder.Message(session);
							var imgId="wkcrash";
							try{imgId=record.productImages[0].produtImages[0].cloudinaryId}catch(err){};
							var imageUrl="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+imgId+".jpg";
							var detailUrl="http://www.wishkarma.com/"+record["@uniqueUserName"];
							if(!record["@uniqueUserName"]){
								detailUrl="https://www.wishkarma.com/d/Products/"+record.recordId+"/"+record.recordId+"?s=Product&ds="+record.productType
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
								            "text": record.esMeta,
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
								            "title": "Find it on Wishkarma"
								    		},
								    	/*	{
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
