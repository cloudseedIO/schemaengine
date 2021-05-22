var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.bucket(records);
var cbMasterBucket=cluster.bucket(schemas);
var cbContentCollection=cbContentCollection.defaultCollection();
var cbMasterCollection=cbMasterBucket.defaultCollection();
function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
//var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
var query=await cbMasterBucket.viewQuery("Test", "test");
cluster.query(query, function(err, data) {
	if(err){
		console.log(err);
		return;
	}
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		/*var urlName=(docu["@displayName"]?docu["@displayName"]:docu.displayName)?(docu["@displayName"]?docu["@displayName"]:docu.displayName):docu["@id"]+"s";
		docu.displayName=urlName;
		docu["@displayName"]=urlName;
		docu["@uniqueUserName"]="all-"+docu.displayName.trim().toLowerCase().replace(/\W+/g,"-");
		docu.navFilters={
				"default":{
					"filters": {
						"$status": [ "published" ],
						"productType": [ data[index].id.split("-")[1] ]
					}
				}
		};*/
		/*if(!docu["@showRelated"]){
			docu["@showRelated"]= {
			    "relatedProducts": {
			        "search": {
			          "keyWords": [
			            "docType",
			            "productType"
			          ],
			          "condition": "matchAll",
			          "heading": [
			            "Similar Products"
			          ],
			          "UILayout": "CarouselGallery"
			        }
			      }
			    };
			if(Array.isArray(docu["@filterKeys"])){
				for(var ind in docu["@filterKeys"]){
					var temp=["$status", "productType","Manufacturer","countryOfOrigin","countryOfAvailability"];
					if(temp.indexOf(docu["@filterKeys"][ind])==-1){
						docu["@showRelated"].relatedProducts.search.keyWords.push(docu["@filterKeys"][ind]);
					}
				}
			}
			console.log(docu["@showRelated"].relatedProducts.search.keyWords);
		}*/
		if(Array.isArray(docu["@filterKeys"])){
			if(docu["@filterKeys"].indexOf("countryOfAvailability")==-1){
				docu["@filterKeys"].push("countryOfAvailability");
			}
			if(docu["@filterKeys"].indexOf("freeSampleAvailable")==-1){
				docu["@filterKeys"].push("freeSampleAvailable");
			}
			
			
		}
		
		/*for(var key in docu["@properties"]){
			if(docu["@properties"][key]["description"]=="on"){
				docu["@properties"][key]["description"]=docu["@properties"][key]["displayName"];
			}
			if(docu["@properties"][key]["promptName"]){
				if(!docu["@properties"][key]["prompt"]){
					docu["@properties"][key]["prompt"]=docu["@properties"][key]["promptName"];
				}
			}
			delete docu["@properties"][key]["promptName"];
			["description","displayName","prompt"].map(function(updateKey){
				if(docu["@properties"][key][updateKey])
				docu["@properties"][key][updateKey]=toTitleCase(docu["@properties"][key][updateKey])	
			});
		}*/
		console.log("Updating ........."+ (index*1+1) +"          "+data[index].id+"             ");	
		cbMasterCollection.upsert(data[index].id,docu,function(err, result) {
			if (err) { console.log(err); }
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		});
	}
});

