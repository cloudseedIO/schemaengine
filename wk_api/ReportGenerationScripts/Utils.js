/**
 * @author Vikram Jakkampudi
 */
/**
 * @author vikram.jakkampudi
 */
var couchbase = require('couchbase');
//const { config } = require('winston');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});//52.77.86.146");//52.76.7.57");//
var ViewQuery = couchbase.ViewQuery;

var cbContentBucket=cluster.bucket("records");
var cbMasterBucket=cluster.bucket("schemas");
var cbDefinitionBucket=cluster.bucket("definitions");

var cbContentCollection=cbContentBucket.defaultCollection();
var cbMasterCollection=cbMasterBucket.defaultCollection();
var cbDefinitionCollection=cbDefinitionBucket.defaultCollection();



//setTimeout(function(){
 cbContentBucket=cluster.bucket(cbContentBucket, function(err) {
	if (err) {
		console.log(err);
		 console.log({"error":"while connecting to bucket "+cbContentBucket});
		}
	});
 cbMasterBucket=cluster.bucket(cbMasterBucket, function(err) {
		if (err) {
			 console.log({"error":"while connecting to bucket "+cbMasterBucket});
			}
		});
 cbDefinitionBucket=cluster.bucket("definitions", function(err) {
		if (err) {
			 console.log({"error":"while connecting to bucket definitions"});
			}
		});
 
//},500)
 
 

 var cccluster= new couchbase.Cluster("couchbase://"+config.cbAddress);
 var cccbContentBucket;
 var cccbMasterBucket;

 
//setTimeout(function(){
 cccbContentBucket=cccluster.bucket("records", function(err) {
	if (err) {
		console.log(err);
		 console.log({"error":"while connecting to bucket "+cbContentBucket});
		}
	});
 
 cccbMasterBucket=cccluster.bucket("schemas", function(err) {
	if (err) {
		 console.log({"error":"while connecting to bucket "+cbMasterBucket});
		}
	});
 

 cccbDefinitionBucket=cccluster.bucket("definitions", function(err) {
	if (err) {
		 console.log({"error":"while connecting to bucket definition"});
		}
	});
 
//},500)
 /**
  * ID based Getting
  */

 /**
  * 
  * @param docId
  * @param callback
  * 
  * getting the doc Id from the content bucket
  */
 function getDocumentByIdFromContentBucket(docId,callback){
 	  cbContentCollection.get(docId,function(err, result) {
 		  if (err) {
 			 callback({"error":"while getting the doc with id "+docId+"  from bucket"+cbContentBucket});
 			  return;
 		  }
 		  callback(result);
 	  });
 }
 exports.getDocumentByIdFromContentBucket=getDocumentByIdFromContentBucket;
 /**
  * 
  * @param docId
  * @param callback
  * 
  * getting the doc from the master bucket
  */
 function getDocumentByIdFromMasterBucket(docId,callback){
	cbMasterCollection.get(docId,function(err, result) {
 		  if (err) {
 			callback({"error":"while getting the doc with id "+docId+"  from bucket"+cbMasterBucket});
 			  return;
 		  }
 		  callback(result);
 	  });
 }
 exports.getDocumentByIdFromMasterBucket=getDocumentByIdFromMasterBucket;

 /**
  * 
  * @param docId
  * @param callback
  * 
  * getting the doc from the definition bucket
  */
 function getDocumentByIdFromDefinitionBucket(docId,callback){
 	cbDefinitionCollection.get(docId,function(err, result) {
 		  if (err) {
 			callback({"error":"while getting the doc with id "+docId+"  from bucket"+cbDefinitionBucket});
 			  return;
 		  }
 		  callback(result);
 	  });
 }
 exports.getDocumentByIdFromDefinitionBucket=getDocumentByIdFromDefinitionBucket;



 function getDocumentsByIdsFromContentBucket(docIds,callback){
 	if(docIds.length==0){
 		callback({});
 		return;
 	}
 	cbContentBucket.getMulti(docIds,function(err, result) {
 		  if (err && err!=1) {
 				callback({"error":"while getting the docs with ids "+docIds+"  from bucket"+cbContentBucket});
 				  return;
 			  }
 			  callback(result);
 		  });
 }
 exports.getDocumentsByIdsFromContentBucket=getDocumentsByIdsFromContentBucket;



 function getDocumentsByIdsFromMasterBucket(docIds,callback){
 	if(docIds.length==0){
 		callback({});
 		return;
 	}
 	cbMasterBucket.getMulti(docIds,function(err, result) {
 		  if (err) {
 				callback({"error":"while getting the doc with id "+docId+"  from bucket"+cbMasterBucket});
 				  return;
 			  }
 			  callback(result);
 		  });
 }
 exports.getDocumentsByIdsFromMasterBucket=getDocumentsByIdsFromMasterBucket;


 function getDocumentsByIdsFromDefinitionBucket(docIds,callback){
 	if(docIds.length==0){
 		callback({});
 		return;
 	}
 	cbDefinitionBucket.getMulti(docIds,function(err, result) {
 		  if (err) {
 				callback({"error":"while getting the doc with id "+docId+"  from bucket"+cbDefinitionBucket});
 				  return;
 			  }
 			  callback(result);
 		  });
 }
 exports.getDocumentsByIdsFromDefinitionBucket=getDocumentsByIdsFromDefinitionBucket;



 /**
  * Replacing document
  */

 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function replaceDocumentInContentBucket(docId,doc,callback){
 	cbContentCollection.replace(docId,doc,function(err, result) {
 			if (err) {
 				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbContentBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.replaceDocumentInContentBucket=replaceDocumentInContentBucket;
 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function replaceDocumentInMasterBucket(docId,doc,callback){
 	cbMasterCollection.replace(docId,doc,function(err, result) {
 			if (err) {
 				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbMasterBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.replaceDocumentInMasterBucket=replaceDocumentInMasterBucket;

 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function replaceDocumentInDefinitionBucket(docId,doc,callback){
 	cbDefinitionCollection.replace(docId,doc,function(err, result) {
 			if (err) {
 				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbDefinitionBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.replaceDocumentInDefinitionBucket=replaceDocumentInDefinitionBucket;












 /**
  * Creating or updating document
  */

 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function upsertDocumentInContentBucket(docId,doc,callback){
 	cbContentCollection.upsert(docId,doc,function(err, result) {
 			if (err) {
 				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbContentBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.upsertDocumentInContentBucket=upsertDocumentInContentBucket;
 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function upsertDocumentInMasterBucket(docId,doc,callback){
 		cbMasterCollection.upsert(docId,doc,function(err, result) {
 			if (err) {
 					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbMasterBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.upsertDocumentInMasterBucket=upsertDocumentInMasterBucket;

 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function upsertDocumentInDefinitionBucket(docId,doc,callback){
 		cbDefinitionCollection.upsert(docId,doc,function(err, result) {
 			if (err) {
 					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbDefinitionBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.upsertDocumentInDefinitionBucket=upsertDocumentInDefinitionBucket;







 /**
  * inserting brand new document
  */

 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function insertDocumentInContentBucket(docId,doc,callback){
 	cbContentCollection.insert(docId,doc,function(err, result) {
 			if (err) {
 				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbContentBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.insertDocumentInContentBucket=insertDocumentInContentBucket;
 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function insertDocumentInMasterBucket(docId,doc,callback){
 		cbMasterCollection.insert(docId,doc,function(err, result) {
 			if (err) {
 					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbMasterBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.insertDocumentInMasterBucket=insertDocumentInMasterBucket;

 /**
  * 
  * @param docId
  * @param doc
  * @param callback
  * 
  * updating the doc using docId
  */
 function insertDocumentInDefinitionBucket(docId,doc,callback){
 		cbDefinitionCollection.insert(docId,doc,function(err, result) {
 			if (err) {
 					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+cbDefinitionBucket});
 				return;
 			}
 			callback(result);
 		});
 }
 exports.insertDocumentInDefinitionBucket=insertDocumentInDefinitionBucket;





 /**
  * View Execution
  */

 /**
  * 
  * @param query
  * @param callback
  * view on the doc in ContentBucket
  * 
  */
 function executeViewInContentBucket(query,callback){
 	//console.log(query);
 	cluster.query(query, function(err, results) {
 		if(err){
 			callback({"error":"while executing view in "+cbContentBucket,"query":query});
 			return;
 		}
 		callback(results);
 	});	
 }
 exports.executeViewInContentBucket=executeViewInContentBucket;
 /**
  * 
  * @param query
  * @param callback
  * view on the doc in Master Bucket
  * 
  */
 function executeViewInMasterBucket(query,callback){
 	cluster.query(query, function(err, results) {
 		if(err){
 			callback({"error":"while executing view in "+cbMasterBucket,"query":query});
 			return;
 		}
 		callback(results);
 	});	
 }
 exports.executeViewInMasterBucket=executeViewInMasterBucket;


 /**
  * 
  * @param query
  * @param callback
  * view on the doc in Definition Bucket
  * 
  */
 function executeViewInDefinitionBucket(query,callback){
 	cluster.query(query, function(err, results) {
 		if(err){
 			callback({"error":"while executing view in "+cbDefinitionBucket,"query":query});
 			return;
 		}
 		callback(results);
 	});	
 }
 exports.executeViewInDefinitionBucket=executeViewInDefinitionBucket;














 function removeDocumentByIdFromMasterBucket(docId,callback){
 	cbMasterCollection.remove(docId,function(err, result) {
 		  if (err) {
 			callback({"error":"while removing the doc with id "+docId+"  from bucket"+cbMasterBucket});
 			  return;
 		  }
 		  callback(result);
 	  });
 }
 exports.removeDocumentByIdFromMasterBucket=removeDocumentByIdFromMasterBucket;


 function removeDocumentByIdFromContentBucket(docId,callback){
 	cbContentCollection.remove(docId,function(err, result) {
 		  if (err) {
 			callback({"error":"while removing the doc with id "+docId+"  from bucket"+cbContentBucket});
 			  return;
 		  }
 		  callback(result);
 	  });
 }
 exports.removeDocumentByIdFromContentBucket=removeDocumentByIdFromContentBucket;


 function removeDocumentByIdFromDefinitionBucket(docId,callback){
 	cbDefinitionCollection.remove(docId,function(err, result) {
 		  if (err) {
 			callback({"error":"while removing the doc with id "+docId+"  from bucket"+cbDefinitionBucket});
 			  return;
 		  }
 		  callback(result);
 	  });
 }
 exports.removeDocumentByIdFromDefinitionBucket=removeDocumentByIdFromDefinitionBucket;

var ProductProperties= [
    "image",
    "name",
    "Manufacturer",
    "collection",
    "mfrProductNo",
    "specifications",
    "description"
	]
var Manufacturers={}
var relationDesc= [
"Manufacturer-manufactures-recordId",
"recordId-manufacturedBy-Manufacturer",
"collection-hasProduct-recordId",
"recordId-ofCollection-collection"
             ]
//5707
//for updating hobs
/*var query = ViewQuery.from("Test", "test").skip(0).limit(10).stale(ViewQuery.Update.BEFORE);
executeViewInContentBucket(query,function(data){
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		if(docu.dependentProperties && docu.dependentProperties.type && docu.dependentProperties.type=="Built-in"){
			docu.dependentProperties.mounting="Built-in";
			docu.dependentProperties.type="Gas Hobs";
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId);	
			upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})
*/
//size {size unit},finish


// for updating Refrigerators
/*var query = ViewQuery.from("Test", "test").skip(0).limit(100).stale(ViewQuery.Update.BEFORE);
executeViewInContentBucket(query,function(data){
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		if(docu.docType=="Product" &&
				docu.productType=="Refrigerator" &&
				docu.dependentProperties && docu.dependentProperties.type){
			if(docu.dependentProperties.type=="Single-Door"){
				docu.dependentProperties.noOfDoors="1";
				docu.dependentProperties.type="With Door";
			}
			if(docu.dependentProperties.type=="Double-Door"){
				docu.dependentProperties.noOfDoors="2";
				docu.dependentProperties.type="With Door";
			}
			if(docu.dependentProperties.type=="3 Door"){
				docu.dependentProperties.noOfDoors="3";
				docu.dependentProperties.type="With Door";
			}
			if(docu.dependentProperties.type=="4 Door"){
				docu.dependentProperties.noOfDoors="4";
				docu.dependentProperties.type="With Door";
			}
			if(docu.dependentProperties.type=="6 Door"){
				docu.dependentProperties.noOfDoors="6";
				docu.dependentProperties.type="With Door";
			}
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId);	
			upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})
*/    


/*
var query = ViewQuery.from("Test", "test").skip(0).limit(100).stale(ViewQuery.Update.BEFORE);
executeViewInContentBucket(query,function(data){
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		if(docu.docType=="Product" &&
				docu.productType=="Sink" &&
				docu.dependentProperties && docu.dependentProperties.type){
			if(docu.dependentProperties.type=="Single Bowl"){
				docu.dependentProperties.type="Without Drain";
			}
			if(docu.dependentProperties.type=="Single Bowl Single Drain"){
				docu.dependentProperties.type="With Drain";
			}
			if(docu.dependentProperties.type=="Double Bowl"){
				docu.dependentProperties.type="Without Drain";
			}
			if(docu.dependentProperties.type=="Double Bowl Double Drain"){
				docu.dependentProperties.type="With Drain";
			}
			if(docu.dependentProperties.type=="Double Bowl Single Drain"){
				docu.dependentProperties.type="With Drain";
			}

			if(docu.dependentProperties.type=="Triple Bowl"){
				docu.dependentProperties.type="Without Drain";
			}
			if(docu.dependentProperties.type=="Triple Bowl Single Drain"){
				docu.dependentProperties.type="With Drain";
			}
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             "+docu.dependentProperties.type);	
			upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})



*/


//For renaming the document ids.....
/*
var query = ViewQuery.from("Address", "test").skip(0).limit(2).stale(ViewQuery.Update.BEFORE);
executeViewInContentBucket(query,function(data){
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		if(!docu.idUpdated){
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			console.log("removing:"+docu.recordId);
			removeDocumentByIdFromContentBucket(data[index].id,function(delres){
				if(delres.error){
					if((index+1)<data.length){
						updateProduct(index+1);
					}
				}else{
					var flagValue=1;
					var newId=((docu.name==undefined || docu.name=="" || docu.name==null)?(docu.name+(flagValue++)):docu.name).replace(/[^A-Z0-9]+/ig, "").substring(0,50);
					updateCB(newId,docu);
					
					function updateCB(lid,doc){
						console.log("Trying newId:  "+ lid)
						doc.recordId=lid;
						doc.updatedId=true;
						insertDocumentInContentBucket(lid,doc,function(updateResult){
							if(updateResult.error){
								console.log("Failed :  "+ lid)
								console.log("error:"+updateResult.error);
								newId=((lid)+(flagValue++))//.replace(/[^A-Z0-9]+/ig, "").substring(0,50);
								updateCB(newId,doc);
							}else{
								console.log("created  "+lid);
								if((index+1)<data.length){
									updateProduct(index+1);
								}
							}
						});
					}	
					
					
					
					
					
					
					
					
					
					
					
					
					
				}
			})
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})

*/


 /*

var query = ViewQuery.from("Test", "role").stale(ViewQuery.Update.BEFORE).limit(10000);
cbContentBucket.query(query, function(err, data) {
	if(err){
		console.log(err);
	}
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		if(true){
			docu.cloudPointHostId="wishkarma";
			
			console.log(docu.roles);
			
			 var newRoles=[];
			 if(Array.isArray(docu.roles))
			 for(var t=0;t<docu.roles.length;t++){
			 	if(docu.roles[t]=="cloudPointAdmin"){
			 		newRoles.push("RoleForcloudPointAdmin");
			 	}
			 	if(docu.roles[t]=="contentEditor"){
			 		newRoles.push("RoleContentEditor");
			 	}
			 	if(docu.roles[t]=="contentUploader"){
			 		newRoles.push("Role3");
			 	}
			 	if(docu.roles[t]=="orgOwner"){
			 		newRoles.push("Role2");
			 	}
			 	if(docu.roles[t]=="public"){
			 		newRoles.push("Role1");
			 	}
			 	if(docu.roles[t]=="user"){
			 		newRoles.push("RoleForCommonUser");
			 	}
			 	
			 }
			 docu.roles=newRoles;
			 
			 console.log(docu.roles);
			
			
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId);	
			
			cbContentBucket.upsert(data[index].id,docu,function(err, result) {
				if((index+1)<data.length){
					updateProduct(index+1);
				}
	 		});
			
			
			
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})




*/




























/*

var fs=require('fs');
fs.readFile('designdocs.json',function(err,data){
	if(err){
		console.log(err);
		return;
	}
	var dd=JSON.parse(data);
	var bm=cbContentBucket.manager();
	updateDD(0);
	function updateDD(i){
		var ddid=dd[i].doc.meta.id.split("/")[1];
		 if(ddid=="CcMaterials" || 
				 ddid=="CcJobMixFormula" || 
				 ddid=="CcPurchaseOrders" || 
				 ddid=="CcAssetCategory" || 
				 ddid=="CcRepairAndMaintenanceProcedures" || 
				 ddid=="CcFinancialCost" || 
				 ddid=="CcOperations" || 
				 ddid=="CcConsumption" || 
				 ddid=="CcCrew" || 
				 ddid=="AssetMaster" || 
				 ddid=="CcWarrantyCoverage " || 
				 ddid=="CcMastersAssembly" || 
				 ddid=="CcBillOfMaterial" || 
				 ddid=="MastersSupplier" || 
				 ddid=="CcPurchasing" || 
				 ddid=="CcAddress" || 
				 ddid=="MasterClient" || 
				 ddid=="CcAddress" || 
				 ddid=="CostCode" || 
				 ddid=="CcTax" || 
				 ddid=="UnitofMeasure" || 
				 ddid=="CcPersonalInformation" || 
				 ddid=="CcInformation" || 
				 ddid=="CcweatherPatterns" || 
				 ddid=="Ccshifts" || 
				 ddid=="CcnonWorkingDays" || 
				 ddid=="Ccbilling" || 
				 ddid=="CcProjectJobCard" || 
				 ddid=="CcTestResult" || 
				 ddid=="CcMeasurement" || 
				 ddid=="CcInspections" || 
				 ddid=="CcMachinery" || 
				 ddid=="CcManpower" || 
				 ddid=="ProjectBoqs" || 
				 ddid=="ProjectBoqLines" || 
				 ddid=="BOQCostWorkOut" || 
				 ddid=="CcEquipmentJobCard" || 
				 ddid=="CcParts" || 
				 ddid=="CcEstimatedLabour" || 
				 ddid=="CcIncidentals" || 
				 ddid=="EquipmentIndent" || 
				 ddid=="CcEquipmentIndentLines" || 
				 ddid=="LabourIndentLines" || 
				 ddid=="LabourIndent" || 
				 ddid=="CcLosheet" || 
				 ddid=="CcLogSheetLines" || 
				 ddid=="PurchaseRequest" || 
				 ddid=="PurchaseRequestLines" || 
				 ddid=="PurchaseOrder" || 
				 ddid=="PurchaseOrderLines" || 
				 ddid=="CcStoreReceiptVocher" || 
				 ddid=="StoreReceiptVoucherlines" || 
				 ddid=="CcStoreIssueVocher" || 
				 ddid=="IssueVoucherlines" || 
				 ddid=="rfqVendor"){
			 	console.log(ddid);
			 	bm.upsertDesignDocument(ddid, dd[i].doc.json, function(err, res) {
					if(err){
						console.log(ddid +" updation failed");
						  callback({"error":"internalerror"});
					}else{
						console.log(ddid +" updation success. view name = ");
					}
					if((i+1)<dd.length-1){
						updateDD(i+1);
					}
				  });
		 }else{
			 if((i+1)<dd.length-1){
					updateDD(i+1);
				}
		 }
	}
})




*/








/*
 * 

var query = ViewQuery.from("genericMeta", "test")//.skip(0).limit(100).stale(ViewQuery.Update.BEFORE);
cccbMasterBucket.query(query, function(err, data) {
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
		docu.recordId=data[index].id;
		if(docu.recordId.indexOf("trigger")>=0){
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbMasterBucket.insert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})
*/










/**
 * if(doc.docType=="Product" && doc.productType=="Toilets"){
    if(doc.dependentProperties && 
       (!doc.dependentProperties.type ||
      doc.dependentProperties.type=="") ){
    	emit(meta.id,doc)
      }
  }
 

var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
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
		if(docu.productType && docu.productType=="Toilets"){
			//docu.productType="Toilets";
			//docu.productCategory="ProductCategorydff97e68-7cad-bea5-89ff-41d8915198a5";
			//if(docu.dependentProperties){
				//if(docu.dependentProperties.type && docu.dependentProperties.type!="Close Coupled"){
				//	docu.dependentProperties.type=""
				//}
				//if(docu.dependentProperties.finish){
					//docu.dependentProperties.color=docu.dependentProperties.finish;
					//docu.dependentProperties.mounting="";
					//delete docu.dependentProperties.finish;
				//}
			//}
			if(docu.dependentProperties){
				if(!docu.dependentProperties.type || docu.dependentProperties.type==""){
					docu.dependentProperties.type="Rimless"
				}
			}
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})


*/








/**
 *  if(doc.docType=="Product" && doc.productType=="WashBasin"){
    if(doc.dependentProperties && 
       doc.dependentProperties.type &&
      (doc.dependentProperties.type=="Semi recessed" ||
       doc.dependentProperties.type=="Wall hung" ||
       doc.dependentProperties.type=="Countertop (Insert Basins)" ||
       doc.dependentProperties.type=="Under counter basins"||
       doc.dependentProperties.type=="Wash basin with pedestals")){
    	emit(meta.id,doc)
      }
  }
 
var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
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
		if(docu.productType && docu.productType=="WashBasin"){
			docu.productCategory="ProductCategory29e1a27c-7cba-8181-8d74-1c1be637b817";
			if(docu.dependentProperties && docu.dependentProperties.type){
			
				if(docu.dependentProperties.type=="Semi recessed"){
					docu.dependentProperties.type="Semi- Inset"
				}
				if(docu.dependentProperties.type=="Wall hung"){
					docu.dependentProperties.type="Wall- Mounted"
				}
				if(docu.dependentProperties.type=="Countertop (Insert Basins)"){
					docu.dependentProperties.type="Inset"
				}
				if(docu.dependentProperties.type=="Under counter basins"){
					docu.dependentProperties.type="Undermount"
				}
				if(docu.dependentProperties.type=="Wash basin with pedestals"){
					docu.dependentProperties.type="Pedestal"
				}
				
				
			}
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})
*/


/*
var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
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
		if(docu.productType && docu.productType=="Faucet"){
	          //"Lavatory",
	          //"Sink Mixer",
	          //"Accessories",
	          //"Others"
			if(docu.dependentProperties && docu.dependentProperties.faucetType){
				if(docu.dependentProperties.mounting){
					if(docu.dependentProperties.mounting=="Wall"){
						docu.dependentProperties.mounting="Wall mounted";
					}
					if(docu.dependentProperties.mounting=="Ceiling"){
						docu.dependentProperties.mounting="Ceiling mounted";
					}
					if(docu.dependentProperties.mounting=="Floor"){
						docu.dependentProperties.mounting="Floor standing";
					}
				}	
				if(docu.dependentProperties.finish){
					if(docu.dependentProperties.finish=="Chrome"){
						docu.dependentProperties.finish="Polished";
						docu.dependentProperties.color="Chrome";
					}
				}
				if(docu.dependentProperties.faucetType=="Bath Mixer"){
					docu.productType="BathtubFaucet";
					docu.productCategory="ProductCategoryb8497d67-431a-82be-6857-183b4bd1bbd6";
				}
				if(docu.dependentProperties.faucetType=="Shower" ||
						docu.dependentProperties.faucetType=="Shower Mixer"){
					docu.productType="ShowerFaucet";
					docu.productCategory="ProductCategory76bf0319-adc2-d981-f921-c0723ad50d82";
				}
				if(docu.dependentProperties.faucetType=="Bath Tub"){
					docu.productType="Spout";
					docu.productCategory="ProductCategoryc7f3649c-3ee2-d148-5205-6af4f6ed45bd";
				}
				if(docu.dependentProperties.faucetType=="Divertor" ||
						docu.dependentProperties.faucetType=="Valves"){
					docu.productType="Diverter";
					docu.productCategory="ProductCategory735f6b5d-a8b1-9a52-e49f-bba44cf5a247";
				}
				if(docu.dependentProperties.faucetType=="Bidet" ||
						docu.dependentProperties.faucetType=="Bidet Mixer"){
					docu.productType="BidetFaucet";
					docu.productCategory="ProductCategory1da47a65-7d3f-c7e1-fbf2-5f085c78d1d5";
				}
				if(docu.dependentProperties.faucetType== "Wash Basin" ||
						docu.dependentProperties.faucetType=="Basin Mixer"){
					docu.productType="WashbasinFaucet";
					docu.productCategory="ProductCategoryb5bb1d07-fd5a-65d0-2c9f-9fc0164c894e";
				}
			}
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})
*/











/*
var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
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
		if(docu.productType && docu.productType=="BathroomAccessories"){
	          
			if(docu.dependentProperties && docu.dependentProperties.type){
				console.log(docu.dependentProperties.type);
				//finish=["Chrome","Crystal","Brushed Nickel","White","Stainless Steel" ]
				
		          
		          //TOWEL RACKS==ProductCategory806661dd-795f-05df-d130-642db3991fa1
		          
		          
		         // SOAP DISHES==
		          if(docu.dependentProperties.type=="Soap Holder"||
		        		  docu.dependentProperties.type=="Trays"){
		        	docu.productType="SoapDish";
		        	docu.productCategory="ProductCategoryd782c015-6730-3b5f-7f76-19551df1f6bb";
		          }
		          
		          //TOOHBRUSH HOLDERS==
		          if(docu.dependentProperties.type=="Brush Holder"){
		        	  docu.productType="ToothbrushHolder";
			        	docu.productCategory="ProductCategoryc245af60-1e68-7f47-9f7f-17de85088f69";
		          }

		          //BATHROOM WALL SHELVES==
		          if(docu.dependentProperties.type=="Shelf"){
		        	  docu.productType="BathroomWallshelf";
			        	docu.productCategory="ProductCategory456c25d5-2128-21db-190d-46a6f5abaa7d";
		          }
		          
		          //TISSUE DISPENSER==ProductCategory3d930c27-45ef-922a-b4bb-1459235bf54f
		          
		          //MIRRORS==
		          if(docu.dependentProperties.type=="Vanity Mirrors"){
		        	  docu.productType="Mirror";
			        	docu.productCategory="ProductCategory9ed48444-a1c1-ba4d-685c-5fef3219556c";
		          }
		          
		          //TOILET BRUSHES==
		          if(docu.dependentProperties.type=="Toilet Brushes"||
		        		  docu.dependentProperties.type=="Cleaning Brush"){
		        	  docu.productType="ToiletBrush";
			        	docu.productCategory="ProductCategory5895b0f6-c9f4-6627-4f88-f634643e5210";
		          }
		          
		          //BATH STOOLS==
		          if(docu.dependentProperties.type=="Shower Seats"){
		        	  docu.productType="BathStool";
			        	docu.productCategory="ProductCategory3822cfd3-4e4c-624a-a3be-6ef3ff56845b";
		          }
		          
		          //BATH LINEN==ProductCategorycc381c74-4095-575b-4c12-320e9055afde
		          //SHOWER CURTAINS==ProductCategory31db89a3-df76-dd39-f56b-4f442efdac08
		          //TOILET SEATS==ProductCategoryed7880ba-813b-4d0c-003f-3562303ba035
		          
		          //WASTE BINS==
		          if(docu.dependentProperties.type=="Waste Baskets"||
		        		  docu.dependentProperties.type=="Trash Can"){
		        	  docu.productType="WasteBin";
			        	docu.productCategory="ProductCategory7266a6af-ea5f-397c-077b-16c3e185fa01";
		          }
		          
		          //LIQUID SOAP DISPENSERS==
		          if(docu.dependentProperties.type=="Soap Dispensers"){
		        	  docu.productType="LiquidSoapDispenser";
			        	docu.productCategory="ProductCategory22a1b230-5f97-2cde-2839-fb84a03ac3b4";
		          }
		          
		         // ROBE HOOKS==
		          if(docu.dependentProperties.type=="Hooks"){
		        	  docu.productType="RobeHook";
			        	docu.productCategory="ProductCategory6ef997a8-e9de-ee96-e2f9-30c1556fb9b3";
		          }
		          
		          //TOILET ROLL HOLDERS==
		          if(docu.dependentProperties.type=="Toilet Caddies" || 
		        		  docu.dependentProperties.type=="Toilet Paper Holders"||
		        		  docu.dependentProperties.type=="Toilet Paper Holders"){
		        	  docu.productType="ToiletRollHolder";
			        	docu.productCategory="ProductCategorye825dfee-328c-1f44-70bc-7f9706c24d10";
		          }
		          
		         // HEALTH FAUCETS ==ProductCategory9d333934-f4ad-dcb8-517d-56d26cc6fc83
		          
		         // TOWEL RINGS & RODS==
		          if(docu.dependentProperties.type=="Towel Rings"||
		        		  docu.dependentProperties.type=="Towel Ring/Rod"){
		        	  docu.productType="TowelHolder";
			        	docu.productCategory="ProductCategory4c5fa998-68f8-08d4-fcd7-96b047c67f58";
		          }
		        
			}
			console.log(docu.productType);
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})*/



/*var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
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
		if(docu.productType && docu.productType=="Shower"){
	          
			if(docu.dependentProperties && docu.dependentProperties.type){
				
		          //"Shower Trim",
		          //"Steam showers",
				if(docu.dependentProperties.type=="Overhead Showers"){
					docu.productType="OverheadShower";
					docu.productCategory="ProductCategory71d5e77f-77a6-23a5-d4bc-211116ac46d4";
				}
				if(docu.dependentProperties.type=="Hand Showers" || 
						docu.dependentProperties.type=="Slimline Showers"){
					docu.productType="HandShower";
					docu.productCategory="ProductCategory82006712-c7f8-512d-b677-3f969443e405";
				}
				//if(docu.dependentProperties.type==""){
					//docu.productType="HandShowerHolder";
					//docu.productCategory="ProductCategorycdddda7b-540a-e663-3a4c-159c225b6fb2";
				//}
				if(docu.dependentProperties.type=="Shower pannels"){
					docu.productType="ShowerPanel";
					docu.productCategory="ProductCategory95636c20-bb12-15f6-216d-d48b80395e0c";
				}
				//if(docu.dependentProperties.type==""){
					//docu.productType="ShowerTrays";
					//docu.productCategory="ProductCategoryb3c22f1b-0e19-2cad-6bce-91bb2d4f677d";
				//}
				//if(docu.dependentProperties.type==""){
					//docu.productType="ShowerCabins";
					//docu.productCategory="ProductCategorybdf013c7-c439-41a9-a9b6-4d0299dc33ce";
				//}
				if(docu.dependentProperties.type=="Rain Showers"){
					docu.productType="RainShower";
					docu.productCategory="ProductCategory39ba1593-9083-fd7c-a94d-9991455b23ad";
				}
				if(docu.dependentProperties.type=="LED Showers"){
					docu.productType="LEDShower";
					docu.productCategory="ProductCategory2d42e6a8-183d-173f-3064-84307ae5b4bc";
				}
				if(docu.dependentProperties.type=="Shower heads"){
					docu.productType="ShowerHead";
					docu.productCategory="ProductCategory6db181ee-ace3-bd16-803e-0beabe0eb56f";
				}
				//if(docu.dependentProperties.type==""){
					//docu.productType="ShowerRail";
					//docu.productCategory="ProductCategoryc6457296-d573-f7bc-8bac-23c2b60a81b8";
				//}
				if(docu.dependentProperties.type=="Body Jet"){
					docu.productType="BodyJet";
					docu.productCategory="ProductCategorye2868311-cbec-c26c-47e5-37fae6a3fbd9";
				}
				//if(docu.dependentProperties.type==""){
				//	docu.productType="ShowerWallPanels";
					//docu.productCategory="ProductCategory4c17e986-cc0b-fbb1-8bdc-684a40afb3f2";
				//}
				if(docu.dependentProperties.type=="Showers screens" ||
						docu.dependentProperties.type=="Accessories"){
					docu.productType="ShowerAccessory";
					docu.productCategory="ProductCategorya9da80f1-b376-f485-afbc-cc5fc974a1c5";
				}
			}
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})*/



/*
var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
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
		if(docu.productType && docu.productType=="Washbasin"){
	          
			if(docu.dependentProperties && docu.dependentProperties.type){
		        if(docu.dependentProperties.type=="Floor-standing"){
					docu.dependentProperties.type="Floor standing"
				}
				if(docu.dependentProperties.type=="Free-standing" ||
						docu.dependentProperties.type=="Freestanding"){
					docu.dependentProperties.type="Free standing"
				}
				if(docu.dependentProperties.type=="Semi-recessed"){
					docu.dependentProperties.type="Semi recessed"
				}
				if(docu.dependentProperties.type== "Wall-mounted"){
					docu.dependentProperties.type= "Wall mounted"
				}
			}
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//upsertDocumentInContentBucket(data[index].id,docu,function(updateResult){
			cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
	 			if (err) {
	 				console.log(err);
	 				//return;
	 			}
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})
*/









var expression="Cart->hasProduct.Product.quantity";
var recordId="CartUser2cc75dc3-44b0-45c3-4532-a20724a73dc5";

expression="Manufacturer->manufactures->hasImage"
recordId="Manufacturer949b52c5-9788-6335-4876-81ffa9813f31";

//expression="Project->hasImage->isIn";
//recordId="Project0b31c9de-f506-3eaa-d0de-d048a1b063b9";

//expression="collection->hasProduct.Manufacturer.name";
//recordId="collection27847370-a426-b12c-8216-25feb300777d";

//expression="Product.Manufacturer.address.streetAddress";
//recordId="Product2fce0bc2-29d1-a18b-f86b-410db6033f0a";


function getDependentSchema(schema,relation){
	var dependentSchema="";
	for(var i=0;i<Object.keys(schema["@relations"]).length;i++){
		if(schema["@relations"][Object.keys(schema["@relations"])[i]].relationName==relation){
			dependentSchema=schema["@relations"][Object.keys(schema["@relations"])[i]].relationRefSchema;
			break;
		}
	}
	return dependentSchema;
}
function getDataType(schema,property){
	var dataType="";
	for(var i=0;i<Object.keys(schema["@properties"]).length;i++){
		if(Object.keys(schema["@properties"])[i]==property){
			dataType=schema["@properties"][Object.keys(schema["@properties"])[i]].dataType;
			break;
		}
	}
	if(dataType=="" && schema["@sysProperties"]){
		for(var i=0;i<Object.keys(schema["@sysProperties"]).length;i++){
			if(Object.keys(schema["@sysProperties"])[i]==property){
				dataType=schema["@sysProperties"][Object.keys(schema["@sysProperties"])[i]].dataType;
				break;
			}
		}
	}
	return dataType;
}
function evaluateExpression(expression,recordId,callback){
	var givenExpression=expression;
	console.log("start of expression : "+givenExpression);
	getDocumentByIdFromMasterBucket(expression.split(/->|\./g)[0],function(schemaRes){
		var schema=schemaRes.value;
		getDocumentByIdFromContentBucket(recordId,function(recordRes){
			var record=recordRes.value;
			var processed="record";
			proceedToNext();
			async function proceedToNext(){
				expression=expression.replace(expression.split(/->|\./g)[0],"");
				if(expression!="" && expression.split(/->|\./g).length>0){
					if(expression.indexOf("->")==0){
						expression=expression.replace("->","");
						record[expression.split(/->|\./g)[0]]=[];
						processed+="."+expression.split(/->|\./g)[0];
						
						//var query = ViewQuery.from("relation","getRelated").key([recordId,expression.split(/->|\./g)[0]]).reduce(false).stale(ViewQuery.Update.NONE);
						var query=await cbContentBucket.viewQuery("relation","getRelated",{key:([recordId,expression.split(/->|\./g)[0]]).reduce(false)});
						executeViewInContentBucket(query,function(junctionRecords){
							console.log(junctionRecords.length);
							processJunctionRecords(0);
							function processJunctionRecords(index){
								console.log(index);
								if(index>=junctionRecords.length){
									doneGettingRelationRecords();
									return;
								}
								//getDocumentByIdFromContentBucket(junctionRecords[index].id,function(recRes){
									//record[expression.split(/->|\./g)[0]].push(recRes.value);
									var newExpression=expression;
									newExpression=newExpression.replace(expression.split(/->|\./g)[0],getDependentSchema(schema,expression.split(/->|\./g)[0]));
									evaluateExpression(newExpression,junctionRecords[index].id,function(relRecRes){
										record[expression.split(/->|\./g)[0]].push(relRecRes);
										processJunctionRecords(index+1);
									})
								//});
							}
							function doneGettingRelationRecords(){
								proceedToNext();
							}
							
							
						})
						
						
						
						
						//proceedToNext();
					}else if(expression.indexOf(".")==0){
						expression=expression.replace(".","");
						processed+="."+expression.split(/->|\./g)[0];
						var DataType=getDataType(schema,expression.split(/->|\./g)[0]);
						console.log(DataType);
						if(DataType!="" && DataType.type=="object"){
							if(eval(processed)){
								getDocumentByIdFromContentBucket(eval(processed),function(res){
									eval(""+processed+"="+JSON.stringify(res.value));
									proceedToNext();
								})
							}else{
								proceedToNext();
							}
						}else{
							proceedToNext();
						}
					}
				}else{
					readyToSendResult();
				}
			}
			
			function readyToSendResult(){
				//console.log(record);

				console.log("End of expression : "+givenExpression);
				callback(record);
			}
		});
	});
}
/*
exports.evaluateExpression=evaluateExpression;
evaluateExpression(expression,recordId,function(res){
	if(expression.indexOf("->")>-1){
		console.log(JSON.stringify(res));
	}else{
		var evalString=expression.replace(expression.split(".")[0]+"","res");
		console.log(evalString);
		console.log(eval(evalString));
		//console.log(res);
	}
})

*/





