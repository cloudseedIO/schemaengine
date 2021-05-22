/**
 * @author vikram.jakkampudi
 */
var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
var logger = require('../services/logseed').logseed;
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});  //config.cbAddress+":"+config.cbPort
//cluster.authenticate(config.cbUsername, config.cbPassword);
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;

var cbMasterBucket=cluster.bucket("schemas");
var cbContentBucket=cluster.bucket("records");
var cbDefinitionBucket=cluster.bucket("definitions");
var cbKeywordBucket=cluster.bucket("keywords");
var cbMessagesBucket=cluster.bucket("messages");
var cbSitemapsBucket=cluster.bucket("sitemaps");
var cbAuditBucket=cluster.bucket("audit");

var cbContentCollection=cbContentBucket.defaultCollection();
var cbMasterCollection=cbMasterBucket.defaultCollection();
var cbDefinitionCollection=cbDefinitionBucket.defaultCollection();
var cbKeywordCollection=cbKeywordBucket.defaultCollection();
var cbMessageCollection=cbMessagesBucket.defaultCollection();
var cbSitemapsCollection=cbSitemapsBucket.defaultCollection();
var cbAuditCollection=cbAuditBucket.defaultCollection();
//localhost password
var pass={
	audit:"e881649fcbae933f8dae41b6fd86e739",
	definitions:"b0697e1af45877710fad15b03203032b",
	keywords:"2fd261738a2cc22d3a47ae2deae52fd8",
	messages:"f68db1c7b58f66f13aa0b10504ec037b",
	records:"35fe1b5a84cde63991d5fa2e5e394a9f",
	schemas:"c2642ecf0de4f3add20e74cc7570afea",
	sessions:"eb586c9c77a615760b135e67c38b0c9c",
	sitemaps:"1c8d12697ad0da93f28e861824097155",
	};

	// var pass={
	// 	audit:"05972f7d6c09428b0468d18b87c8e9b9",
	// 	definitions:"948c9face62b5960b00e5a222052ad71",
	// 	keywords:"fd9aa626ecf39e313c7346f96223ca09",
	// 	messages:"5500e2ce09a82997a016e5a07a7289b2",
	// 	records:"e2c83a5440bda099f0e17a299670d0b5",
	// 	schemas:"ad712ccaeb7747c9774bbf983ec03f8b",
	// 	sessions:"5c16b79518a18e7bf573a9569dbd989d",
	// 	sitemaps:"2c5bd8b2f7eb3bbf6e67ff90981138c8",
	// 	};

//setTimeout(function(){
	cbContentBucket=cluster.bucket(cbContentBucket, function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+cbContentBucket});
		}
	});
	cbMasterBucket=cluster.bucket(cbMasterBucket, function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+cbMasterBucket});
		}
	});
	cbDefinitionBucket=cluster.bucket(cbDefinitionBucket, function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+cbDefinitionBucket});
		}
	});
	cbKeywordBucket=cluster.bucket(cbKeywordBucket, function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+cbKeywordBucket});
		}
	});
	cbAuditBucket=cluster.bucket(cbAuditBucket, function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+cbAuditBucket});
		}
	});
	cbMessagesBucket=cluster.bucket(cbMessagesBucket?cbMessagesBucket:"messages", function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+(cbMessagesBucket?cbMessagesBucket:"messages")});
		}
	});
	// cbKeywordBucket.setTranscoder(function(value) {
	// 	return {
	// 		value: new Buffer(JSON.stringify(value), 'utf8'),
	// 		flags: 0
	// 	};
	// }, function(doc) {
	// 	return JSON.parse(doc.value.toString('utf8'));
	// });
	cbSitemapsBucket=cluster.bucket(cbSitemapsBucket, function(err) {
		if (err) {
			logger.error({"error":"while connecting to bucket "+cbSitemapsBucket});
		}
	});

//},500);



function shutDown(){
	console.log("closing couchbase bucket connections");
	// cbContentBucket.disconnect();
	// cbMasterBucket.disconnect();
	// cbDefinitionBucket.disconnect();
	// cbKeywordBucket.disconnect();
	cluster.close();
}
exports.shutDown=shutDown;
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
	if(!docId){
		if(typeof callback=="function")
			callback({"error":"no Doc Id"});
		  return;
	}
	  cbContentCollection.get(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			 callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbContentBucket});
			  return;
		  }
		  if(typeof callback=="function")
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
	if(!docId){
		if(typeof callback=="function")
		callback({"error":"no Doc Id"});
		  return;
	}
	cbMasterCollection.get(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbMasterBucket});
			  return;
		  }
		  if(typeof callback=="function")
		  callback(result);
	  });
}
exports.getDocumentByIdFromMasterBucket=getDocumentByIdFromMasterBucket;

/**
 * 
 * @param docId
 * @param callback
 * 
 * getting the doc from the master bucket
 */
function getDocumentByIdFromMessagesBucket(docId,callback){
	if(!docId){
		if(typeof callback=="function")
		callback({"error":"no Doc Id"});
		  return;
	}
	cbMessagesCollection.get(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbMessagesBucket});
			  return;
		  }
		  if(typeof callback=="function")
		  callback(result);
	  });
}
exports.getDocumentByIdFromMessagesBucket=getDocumentByIdFromMessagesBucket;

/**
 * 
 * @param docId
 * @param callback
 * 
 * getting the doc from the definition bucket
 */
 async function getDocumentByIdFromDefinitionBucket(docId,callback){
	if(!docId){
		if(typeof callback=="function")
		callback({"error":"no Doc Id"});
		  return;
	}
	await cbDefinitionCollection.get(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			callback({"error":"while getting the doc with id "+docId+"  from bucket "+cbDefinitionBucket});
			  return;
		  }
		  if(typeof callback=="function")
		  callback(result);
	  }).catch(e=>{console.log("erorrrrr",e);});
}
exports.getDocumentByIdFromDefinitionBucket=getDocumentByIdFromDefinitionBucket;



function getDocumentsByIdsFromContentBucket(docIds,callback){
	if(docIds.length==0 || !Array.isArray(docIds)){
		if(typeof callback=="function")
		callback({});
		return;
	}
	try{
	cbContentBucket.getMulti(docIds,function(err, result) {
		  if (err && err!=1) {
			  if(typeof callback=="function")
				callback({"error":"while getting the docs with ids "+docIds+"  from bucket"+config.cbContentBucket});
				  return;
			  }
		  if(typeof callback=="function")
			  callback(result);
		  });
	}catch(err){
		if(typeof callback=="function")
		callback({});
		return;
	}
}
exports.getDocumentsByIdsFromContentBucket=getDocumentsByIdsFromContentBucket;



function getDocumentsByIdsFromMasterBucket(docIds,callback){
	if(docIds.length==0){
		if(typeof callback=="function")
		callback({});
		return;
	}
	cbMasterBucket.getMulti(docIds,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
				callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbMasterBucket});
				  return;
			  }
		  if(typeof callback=="function")
			  callback(result);
		  });
}
exports.getDocumentsByIdsFromMasterBucket=getDocumentsByIdsFromMasterBucket;


function getDocumentsByIdsFromDefinitionBucket(docIds,callback){
	if(docIds.length==0){
		if(typeof callback=="function")
		callback({});
		return;
	}
	cbDefinitionBucket.getMulti(docIds,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
				callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbDefinitionBucket});
				  return;
			  }
		  if(typeof callback=="function")
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
				if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbContentBucket});
				return;
			}
			if(typeof callback=="function")
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
				if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbMasterBucket});
				return;
			}
			if(typeof callback=="function")
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
				if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbDefinitionBucket});
				return;
			}
			if(typeof callback=="function")
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
				if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbContentBucket});
				return;
			}
			if(typeof callback=="function")
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
/*function upsertDocumentInMasterBucket(docId,doc,callback,data){
		cbMasterBucket.upsert(docId,doc,data?data:{},function(err, result) {*/
			if (err) {
				if(typeof callback=="function")
					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbMasterBucket});
				return;
			}
			if(typeof callback=="function")
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
				if(typeof callback=="function")
					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbDefinitionBucket});
				return;
			}
			if(typeof callback=="function")
			callback(result);
		});
}
exports.upsertDocumentInDefinitionBucket=upsertDocumentInDefinitionBucket;


/**
 * 
 * @param docId
 * @param doc
 * @param callback
 * 
 * updating the doc using docId
 */
function upsertDocumentInAuditBucket(docId,doc,callback){
	cbAuditCollection.upsert(docId,doc,function(err, result) {
		if (err) {
			if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbAuditBucket});
			return;
		}
		if(typeof callback=="function")
		callback(result);
	});
}
exports.upsertDocumentInAuditBucket=upsertDocumentInAuditBucket;


function upsertDocumentInSitemapBucket(docId,doc,callback){
	cbSitemapsCollection.upsert(docId,doc,function(err, result) {
		if (err) {
			if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbSitemapsBucket});
			return;
		}
		if(typeof callback=="function")
		callback(result);
	});
}
exports.upsertDocumentInSitemapBucket=upsertDocumentInSitemapBucket;





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
				if(typeof callback=="function")
				callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbContentBucket});
				return;
			}
			if(typeof callback=="function")
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
				if(typeof callback=="function")
					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbMasterBucket});
				return;
			}
			if(typeof callback=="function")
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
 * Insert the doc using docId
 */
function insertDocumentInDefinitionBucket(docId,doc,callback){
		cbDefinitionCollection.insert(docId,doc,function(err, result) {
			if (err) {
				if(typeof callback=="function")
					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbDefinitionBucket});
				return;
			}
			if(typeof callback=="function")
			callback(result);
		});
}
exports.insertDocumentInDefinitionBucket=insertDocumentInDefinitionBucket;


/**
 * 
 * @param docId
 * @param doc
 * @param callback
 * 
 * Insert the doc using docId
 */
function insertDocumentInAuditBucket(docId,doc,callback){
		cbAuditCollection.insert(docId,doc,function(err, result) {
			if (err) {
				if(typeof callback=="function")
					callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbAuditBucket});
				return;
			}
			if(typeof callback=="function")
			callback(result);
		});
}
exports.insertDocumentInAuditBucket=insertDocumentInAuditBucket;




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
 async function executeViewInContentBucket(query,callback){
	// if(query.constructor == ViewQuery){
	// 	var newKeys=[];
	// 	var keysRemain=[];
	// 	try{
	// 		var keys=JSON.parse(query.options.keys);
	// 		if(keys.length>800){
	// 			console.log("all keys length "+keys.length);
	// 			if(typeof callback=="function")
	// 			callback({"error":"while executing view in "+config.cbContentBucket,"query":"Exceeded max keys length"});
	// 			return;
	// 		}
	// 		if(keys.length>10){
	// 			newKeys=keys.splice(0,10);
	// 			query.options.keys=JSON.stringify(newKeys);
	// 			keysRemain=keys;
	// 			delete query.options.limit;
	// 			delete query.options.skip;
	// 		}
	// 	}catch(err){
	// 	}
	// 	cbContentBucket.query(query, function(err, results) {
	// 		if(err){
	// 			logger.error({type:"ContentBucketViewQueryError",query:query,error:err});
	// 			if(typeof callback=="function")
	// 			callback({"error":"while executing view in "+config.cbContentBucket,"query":query});
	// 			return;
	// 		}
	// 		if(keysRemain.length>0){
	// 			query.options.keys=JSON.stringify(keysRemain);
	// 			executeViewInContentBucket(query,function(newRes){
	// 				if(newRes.error){
	// 					if(typeof callback=="function")
	// 					callback(results.concat(newRes))
	// 				}else{
	// 					if(typeof callback=="function")
	// 					callback(results.concat(newRes));
	// 				}
	// 			})
	// 		}else{
	// 			if(typeof callback=="function")
	// 			callback(results);
	// 		}
	// 	});	
	// }else{
		await cluster.query(query, function(err, results) {
			if(err){
				logger.error({type:"ContentBucketViewQueryError",query:query,error:err});
				if(typeof callback=="function")
				callback({"error":"while executing view in "+config.cbContentBucket,"query":query});
				return;
			}
			if(typeof callback=="function")
				callback(results);
		});
	}
//}
exports.executeViewInContentBucket=executeViewInContentBucket;


/*
function executeViewInContentBucket(query,callback){
	cbContentBucket.query(query, function(err, results) {
		if(err){
			callback({"error":"while executing view in "+config.cbContentBucket,"query":query});
			return;
		}
		callback(results);
	});	
}
exports.executeViewInContentBucket=executeViewInContentBucket;
*/
/**
 * 
 * @param query
 * @param callback
 * view on the doc in Master Bucket
 * 
 */
// async function executeViewInMasterBucket(query,callback){
// 	var result=await cluster.query(query, function(err, results) {
// 		console.log(err);
// 		console.log(results);
// 		if(err){
// 			if(typeof callback=="function")
// 			callback({"error":"while executing view in "+config.cbMasterBucket,"query":query});
// 			return;
// 		}
// 		if(typeof callback=="function")
// 		callback(results);
// 	});	
// }

function executeViewInMasterBucket(query,callback){
	cluster.query(query, function(err, results) {
		if(err){
			if(typeof callback=="function")
			callback({"error":"while executing view in "+config.cbMasterBucket,"query":query});
			return;
		}
		if(typeof callback=="function")
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
			if(typeof callback=="function")
			callback({"error":"while executing view in "+config.cbDefinitionBucket,"query":query});
			return;
		}
		if(typeof callback=="function")
		callback(results);
	});	
}
exports.executeViewInDefinitionBucket=executeViewInDefinitionBucket;








/**
 * 
 * @param query
 * @param callback
 * view on the doc in Definition Bucket
 * 
 */
function executeViewInMessagesBucket(query,callback){
	cluster.query(query, function(err, results) {
		if(err){
			if(typeof callback=="function")
			callback({"error":"while executing view in "+config.cbMessagesBucket,"query":query});
			return;
		}
		if(typeof callback=="function")
		callback(results);
	});	
}
exports.executeViewInMessagesBucket=executeViewInMessagesBucket;





/**
 * 
 * @param query
 * @param callback
 * view on the doc in Sitemaps Bucket
 * 
 */
function executeViewInSitemapsBucket(query,callback){
	cluster.query(query, function(err, results) {
		if(err){
			if(typeof callback=="function")
			callback({"error":"while executing view in "+config.cbSitemapsBucket,"query":query});
			return;
		}
		if(typeof callback=="function")
		callback(results);
	});	
}
exports.executeViewInSitemapsBucket=executeViewInSitemapsBucket;










function removeDocumentByIdFromMasterBucket(docId,callback){
	cbMasterCollection.remove(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			callback({"error":"while removing the doc with id "+docId+"  from bucket"+config.cbMasterBucket});
			  return;
		  }
		  if(typeof callback=="function")
		  callback(result);
	  });
}
exports.removeDocumentByIdFromMasterBucket=removeDocumentByIdFromMasterBucket;


function removeDocumentByIdFromContentBucket(docId,callback){
	cbContentCollection.remove(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			callback({"error":"while removing the doc with id "+docId+"  from bucket"+config.cbContentBucket});
			  return;
		  }
		  if(typeof callback=="function")
		  callback(result);
	  });
}
exports.removeDocumentByIdFromContentBucket=removeDocumentByIdFromContentBucket;


function removeDocumentByIdFromDefinitionBucket(docId,callback){
	cbDefinitionCollection.remove(docId,function(err, result) {
		  if (err) {
			  if(typeof callback=="function")
			callback({"error":"while removing the doc with id "+docId+"  from bucket"+config.cbDefinitionBucket});
			  return;
		  }
		  if(typeof callback=="function")
		  callback(result);
	  });
}
exports.removeDocumentByIdFromDefinitionBucket=removeDocumentByIdFromDefinitionBucket;



/**
 * Keyword Bucket stuff
 * 
 */

function createKeyword(keyword,callback){
	cbKeywordCollection.upsert(keyword, keyword , function(err, res) {
		if (err) {
			console.log('operation failed', err);
			if(typeof callback=="function"){
				callback({error:"failed to upsert"});
			}
			return;
		}
		if(typeof callback=="function"){
			callback({success:keyword});
		}
	});
}
exports.createKeyword=createKeyword;

async function getKeywords(srchkey,callback){
	var startKey=null;
	var endKey="z";
	if(typeof srchkey!="undefined" && srchkey!=null){
		startKey=srchkey;
		endKey=srchkey+"z";
	}
	var results = await cbKeywordBucket.viewQuery("keywords","getKeywords",{range:[startKey,endKey]},limit(10)).catch(e=>{console.log(e);});
	// cluster.query(query, function(err, results) {
		if(result.err){
			callback({"error":"while executing view in "+config.cbMasterBucket,"query":query});
			return;
		}
	// 	if(typeof callback=="function")
	 	callback(results);
	// });	
	//return viewResult;
}
exports.getKeywords=getKeywords;

function executeN1QLInAuditBucket(query,params,callback){
	executeN1QL(query,params,callback);
}
exports.executeN1QLInAuditBucket=executeN1QLInAuditBucket;

function executeN1QLInContentBucket(query,params,callback){
	executeN1QL(query,params,callback);
}
exports.executeN1QLInContentBucket=executeN1QLInContentBucket;

function executeN1QL(query,params,callback){
	cluster.query(query, params,function(err, results) {
		if(err){
			logger.error({type:"N1QLQueryError",error:err});
			if(typeof callback=="function")
			callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}
exports.executeN1QL=executeN1QL;
