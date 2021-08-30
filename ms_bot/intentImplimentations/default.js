var builder = require('botbuilder');
var wishkarma=require('../api/wishkarma.js');
module.exports=[
	function(session, args) {
    //session.send('You reached the default message handler. You said \'%s\'.', session.message.text);
    console.log(session.message);
    if(!session.message.text && session.message.value && session.message.value.type){
    	if(session.message.value.type=="DiscoverProducts"){
    		session.beginDialog("DiscoverProducts",{
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
								"entity": session.message.value.Manufacturer,
								"type": "Manufacturer"
							},
							{
								"entity": session.message.value.ProductCategory,
								"type": "ProductCategory"
							}
						],
						"compositeEntities": []
					},
					"libraryName": "*",
					"skip":session.message.value.skip,
					"MfrId":session.message.value.MfrId,
					"ProCatId":session.message.value.ProCatId,
					"CityId":session.message.value.CityId,
					"filters":session.message.value.filters,
					"productType":session.message.value.productType
				});
    	}else if(session.message.value.type=="LocateSuppliers"){
    		session.beginDialog("LocateSuppliers",{
					"action": "*:LocateSuppliers",
					"intent": {
						"intent": "Locate Suppliers",
						"intents": [
							{
								"intent": "Locate Suppliers"
							}
						],
						"entities": [
							{
								"entity": session.message.value.Manufacturer,
								"type": "Manufacturer"
							},
							{
								"entity": session.message.value.City,
								"type": "City"
							}
						],
						"compositeEntities": []
					},
					"libraryName": "*",
					"skip":session.message.value.skip,
					"MfrId":session.message.value.MfrId,
					"ProCatId":session.message.value.ProCatId,
					"CityId":session.message.value.CityId
				});
    	}else if(session.message.value.type=="ViewProduct"){
    		session.beginDialog("viewProduct",{
						"productType":session.message.value.productType,
						"recordId":session.message.value.recordId
				});
    	}else if(session.message.value.type=="ViewSupplier"){
		  	session.beginDialog("viewSupplier",{
						"recordId":session.message.value.recordId
				});
    	}else{
    		 session.endDialog("Oops! Something went wront.");
    	}
    }else{
		 /*builder.Prompts.choice(
		  	session, 
		  	"Welcome to Wishkarma! What are you looking for?", 
		  	["Products","Suppliers"],
		 
		  );*/ 
		  // 	{ listStyle: builder.ListStyle.button }
		  session.send("Welcome to Wishkarma! What are you looking for? eg: Show Grohe faucets, Find Duravit suppliers, I am looking for duravit sinks");
		  session.endDialog();
    }
}]
