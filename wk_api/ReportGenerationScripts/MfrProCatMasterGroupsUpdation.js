var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.openBucket(records);
var global=require('../utils/global.js');

function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	cbContentBucket.query(query, params,function(err, results) {
		if(err){
			if(typeof callback=="function")
				callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}
console.log("starting script");
executeView("select raw records from records where docType=$1 AND any item in productTypes satisfies item=$2 end ",["Manufacturer","ProductCategory6883b01b-f040-48d7-439d-25b9d5a42361"],function(mfrSearchRes){
	if(mfrSearchRes.error){console.log(mfrSearchRes);callback(mfrSearchRes);return;}
	console.log(mfrSearchRes.length);
	if(mfrSearchRes.length==0){
		console.log("Nothing found");
		callback({error:"No Mfrs"});
	}else{
		console.log(mfrSearchRes.length);
		updateProCat(0);
		function updateProCat(index){
			console.log("Cuurent : "+index);
			if(index>=mfrSearchRes.length){
				console.log("===========DONE=============");
				return;
			}
			var mfrRec=mfrSearchRes[index];
			console.log(mfrRec.name+"  "+mfrRec.recordId);
			if(!Array.isArray(mfrRec.productTypes)){
				mfrRec.productTypes=[]
			}
			console.log(mfrRec.productTypes);
			executeView("select distinct raw productCategory from records where Manufacturer=$1 and docType=$2 and productCategory is not missing",[mfrRec.recordId,"Product"],function(pcrfp){
				console.log(pcrfp);//ProductCategories Response From Products
				if(Array.isArray(pcrfp) && pcrfp.length>0){
					var tempdds=[];
					pcrfp.forEach(function(i){
						if(i &&tempdds.indexOf(i)==-1){
							//mfrRec.productTypes.push(i);
							tempdds.push(i);
						}
					})
					mfrRec.productTypes=tempdds;
				}
				console.log(mfrRec.productTypes);
				if(Array.isArray(mfrRec.productTypes)){

					processRow(0);
					function processRow(index) {
					    if (index < (mfrRec.productTypes.length)) {
					        console.log("--------------------------------");
					        console.log("Creating Junction : " + (index + 1))
					        createMFRProCatRecord(mfrRec.productTypes[index],mfrRec, function() {
					         processRow(index + 1);
					        });
					    } else {
					        console.log("***********   DONE Creating junctions    ***********");
									continueGroupsUpdation();
					    }
					}


				function continueGroupsUpdation(){
					executeView("select raw proCatGroups from records use keys $1 where proCatGroups is not missing",[mfrRec.productTypes],function(pcgr){
						if(pcgr.error){// ProductCategoryGroups Response
							console.log(pcgr);
							updateProCat(index+1);
						}else{
						 var subGroups=[];
						 if(Array.isArray(pcgr))
							pcgr.forEach(function(pcgg){
								if(Array.isArray(pcgg))
								pcgg.forEach(function(i){
									if(subGroups.indexOf(i)==-1)
										subGroups.push(i);
								});
							});
							if(subGroups.length>0){
								executeView("select raw proCatMasterGroups from records use keys $1 where proCatMasterGroups is not missing",[subGroups],function(pcmgr){
									if(pcmgr.error){
										console.log(pcmgr);
										updateProCat(index+1);
									}else{
										 var masterGroups=[];
										 if(Array.isArray(pcmgr))
										 pcmgr.forEach(function(pcmgg){
										 	if(Array.isArray(pcmgg))
											pcmgg.forEach(function(i){
												if(masterGroups.indexOf(i)==-1)
													masterGroups.push(i);
											});
										});
										console.log(subGroups);
										console.log(masterGroups);
										executeView("update records use keys $1 set productTypes=$2, proCatGroups=$3,proCatMasterGroups=$4 returning name,productTypes, proCatGroups,proCatMasterGroups",
											[mfrRec.recordId,mfrRec.productTypes,subGroups,masterGroups],function(res){
											console.log(res);
											updateProCat(index+1);
										});
									}
								});
							}else{
								updateProCat(index+1);
							}
						}

					});
				}
				}else{
					updateProCat(index+1);
				}
			});
		}
	}
});
//proCatGroups, proCatMasterGroups

process.on('uncaughtException', function (error) {
	console.log(error);
});





function createMFRProCatRecord(catId, mfrRecord, callback) {
		executeView("SELECT RAW recordId from records where docType=$1 and Manufacturer=$2 and ProductCategory=$3",
					["MfrProCat",mfrRecord.recordId,catId],function(relSearchRes){
			if (relSearchRes.error) {
					callback(relSearchRes);
					return;
			}
			if(relSearchRes.length==0){

		    executeView("SELECT RAW records from records use keys $1", [catId], function(catSearchRes) {
		        if (catSearchRes.error) {
		            callback(catSearchRes);
		            return;
		        }
		        if (catSearchRes.length > 0) {
		            var catDoc = catSearchRes[0];
		            var record = {
		                "flag": "uploadedViaBulkScript",
		                "$status": "published",
		                "@identifier": "mfrProCatName",
		                "Manufacturer": mfrRecord.recordId,
		                "ProductCategory": catId,
		                "about": "All " + catDoc.categoryName + " manufactured by " + mfrRecord.name + ".",
		                "author": "administrator",
		                "categoryName": catDoc.categoryName,
		                "cloudPointHostId": "wishkarma",
		                "dateCreated": global.getDate(),
		                "dateModified": global.getDate(),
		                "docType": "MfrProCat",
		                "editor": "administrator",
		                "image": [],
		                "metaDescription": "Find all " + catDoc.categoryName + " manufactured by " + mfrRecord.name + ". Also locate and chat with stores and dealers near you.",
		                "metaTitle": mfrRecord.name + " " + catDoc.categoryName + " | wishkarma.com",
		                "mfrName": mfrRecord.name,
		                "mfrProCatName": mfrRecord.name + " " + catDoc.categoryName,
		                "org": "public",
		                "recordId": "MfrProCat" + global.guid(),
		                "relationDesc": [
		                    "Manufacturer-manufacturesCategory-ProductCategory",
		                    "ProductCategory-byManufacturer-Manufacturer"
		                ],
		                "revision": 1,
		                "@uniqueUserName": mfrRecord.name.trim().replace(/\W+/g, "-").toLowerCase() + "-" + catDoc.categoryName.trim().replace(/\W+/g, "-").toLowerCase()
		            };
								doneCreation();
		            function doneCreation() {
		                cbContentBucket.upsert(record.recordId, record, function(err, result) {
		                    if (err) {
		                        if (typeof callback == "function")
		                            callback({
		                                "error": err
		                            });
		                        return;
		                    }
		                    console.log(record.recordId + " is created");
		                    if (typeof callback == "function")
		                        callback(record);
		                });
		            }
		        } else {
		            console.log("Not found cat " + catId);
		            callback({
		                error: "Not Found"
		            });
		        }
		    });
			}else{
				console.log("Relation exists ");
				console.log(relSearchRes);
				callback(relSearchRes);
			}
		})
}
