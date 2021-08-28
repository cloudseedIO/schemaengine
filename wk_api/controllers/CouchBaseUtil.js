/**
 * @author vikram.jakkampudi
 */
var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
var logger = require('../services/logseed').logseed;
config=reactConfig.init;
var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});  //config.cbAddress+":"+config.cbPort
//cluster.authenticate(config.cbUsername, config.cbPassword);

var cbMasterBucket=cluster.bucket(config.cbMasterBucket);
var cbContentBucket=cluster.bucket(config.cbContentBucket);
var cbDefinitionBucket=cluster.bucket(config.cbDefinitionBucket);
var cbKeywordBucket=cluster.bucket(config.cbKeywordBucket);
var cbMessagesBucket=cluster.bucket(config.cbMessagesBucket?config.cbMessagesBucket:"messages");
var cbSitemapsBucket=cluster.bucket(config.cbSitemapsBucket);
var cbAuditBucket=cluster.bucket(config.cbAuditBucket);

var cbContentCollection=cbContentBucket.defaultCollection();
var cbMasterCollection=cbMasterBucket.defaultCollection();
var cbDefinitionCollection=cbDefinitionBucket.defaultCollection();
var cbKeywordCollection=cbKeywordBucket.defaultCollection();
var cbMessageCollection=cbMessagesBucket.defaultCollection();
var cbSitemapsCollection=cbSitemapsBucket.defaultCollection();
var cbAuditCollection=cbAuditBucket.defaultCollection();


function shutDown(){
	console.log("closing couchbase bucket connections");
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
async function getDocumentByIdFromContentBucket(docId,callback){
	if(!docId){
		if(typeof callback=="function")
			callback({"error":"no Doc Id"});
		  return;
	}
	try{
		const result = await cbContentCollection.get(docId);
		if(typeof callback=="function")
		  callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbContentBucket});
	}
}
exports.getDocumentByIdFromContentBucket=getDocumentByIdFromContentBucket;
/**
 * 
 * @param docId
 * @param callback
 * 
 * getting the doc from the master bucket
 */
async function getDocumentByIdFromMasterBucket(docId,callback){
	if(!docId){
		if(typeof callback=="function")
		callback({"error":"no Doc Id"});
		  return;
	}
	try{
		const result = await cbMasterCollection.get(docId);
		if(typeof callback=="function")
		  callback(result);
	}catch(error){
		console.log(error);
		if(typeof callback=="function")
		callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbMasterBucket});
	}
}
exports.getDocumentByIdFromMasterBucket=getDocumentByIdFromMasterBucket;/**
 * 
 * @param docId
 * @param callback
 * 
 * getting the doc from the master bucket
 */
async function getDocumentByIdFromMessagesBucket(docId,callback){
	if(!docId){
		if(typeof callback=="function")
		callback({"error":"no Doc Id"});
		  return;
	}
	try{
		const result = await cbMessageCollection.get(docId);
		if(typeof callback=="function")
		  callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbMessagesBucket});
	}
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
	try{
		const result = await cbDefinitionCollection.get(docId);
		if(typeof callback=="function")
		  callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbDefinitionBucket});
	}
}
exports.getDocumentByIdFromDefinitionBucket=getDocumentByIdFromDefinitionBucket;



async function getDocumentsByIdsFromContentBucket(docIds,callback){
	if(docIds.length==0 || !Array.isArray(docIds)){
		if(typeof callback=="function")
		callback({});
		return;
	}
	try{
		try{
			var arrayOfResults={};
			for(var i=0;i<docIds.length;i++){
				arrayOfResults[docIds[i]]=await cbContentCollection.get(docIds[i]);
			}
			if(typeof callback=="function")
			  callback(arrayOfResults);
		}catch(error){
			console.log(error);
			if(typeof callback=="function")
			callback({"error":"while getting the docs with ids "+docIds+"  from bucket"+config.cbContentBucket});
		}
	}catch(err){
		if(typeof callback=="function")
		callback({});
		return;
	}
}
exports.getDocumentsByIdsFromContentBucket=getDocumentsByIdsFromContentBucket;



async function getDocumentsByIdsFromMasterBucket(docIds,callback){
	if(docIds.length==0){
		if(typeof callback=="function")
		callback({});
		return;
	}
	
	try{
		var arrayOfResults={};
		for(var i=0;i<docIds.length;i++){
			arrayOfResults[docIds[i]]=await cbMasterCollection.get(docIds[i]);
		}
		if(typeof callback=="function")
			callback(arrayOfResults);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbMasterBucket});
	}
}
exports.getDocumentsByIdsFromMasterBucket=getDocumentsByIdsFromMasterBucket;


async function getDocumentsByIdsFromDefinitionBucket(docIds,callback){
	if(docIds.length==0){
		if(typeof callback=="function")
		callback({});
		return;
	}
	
	try{
		var arrayOfResults={};
		for(var i=0;i<docIds.length;i++){
			arrayOfResults[docIds[i]]=await cbDefinitionCollection.get(docIds[i]);
		}
		if(typeof callback=="function")
			callback(arrayOfResults);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while getting the doc with id "+docId+"  from bucket"+config.cbDefinitionBucket});
	}
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
async function replaceDocumentInContentBucket(docId,doc,callback){
	try{
		const result = await cbContentCollection.replace(docId,doc);
		if(typeof callback=="function")
		  callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbContentBucket});
	}
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
async function replaceDocumentInMasterBucket(docId,doc,callback){
	try{
		const result = await cbMasterCollection.replace(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbMasterBucket});
	}
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
async function replaceDocumentInDefinitionBucket(docId,doc,callback){
	try{
		const result = await cbDefinitionCollection.replace(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbDefinitionBucket});
	}
	
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

async function upsertDocumentInContentBucket(docId,doc,callback){
	try{
		const result = await cbContentCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbContentBucket});
	}
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

async function upsertDocumentInMasterBucket(docId,doc,callback){
	try{
		const result = await cbMasterCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbMasterBucket});
	}
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
async function upsertDocumentInDefinitionBucket(docId,doc,callback){
	try{
		const result = await cbDefinitionCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbDefinitionBucket});
	}
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
async function upsertDocumentInAuditBucket(docId,doc,callback){
	try{
		const result = await cbAuditCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbAuditBucket});
	}
}
exports.upsertDocumentInAuditBucket=upsertDocumentInAuditBucket;


async function upsertDocumentInSitemapBucket(docId,doc,callback){
	try{
		const result = await cbSitemapsCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbSitemapsBucket});
	}
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
async function insertDocumentInContentBucket(docId,doc,callback){
	try{
		const result = await cbContentCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbContentBucket});
	}
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
async function insertDocumentInMasterBucket(docId,doc,callback){
	try{
		const result = await cbMasterCollection.upsert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbMasterBucket});
	}
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
async function insertDocumentInDefinitionBucket(docId,doc,callback){
	try{
		const result = await cbDefinitionCollection.insert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbDefinitionBucket});
	}
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
async function insertDocumentInAuditBucket(docId,doc,callback){
	try{
		const result = await cbAuditCollection.insert(docId,doc);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while replacing  the doc with id "+docId+"  from bucket "+config.cbAuditBucket});
	}
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
/*async function executeViewInContentBucket(query,callback){
	if(query.constructor == ViewQuery){
		var newKeys=[];
		var keysRemain=[];
		try{
			var keys=JSON.parse(query.options.keys);
			if(keys.length>800){
				console.log("all keys length "+keys.length);
				if(typeof callback=="function")
				callback({"error":"while executing view in "+config.cbContentBucket,"query":"Exceeded max keys length"});
				return;
			}
			if(keys.length>10){
				newKeys=keys.splice(0,10);
				query.options.keys=JSON.stringify(newKeys);
				keysRemain=keys;
				delete query.options.limit;
				delete query.options.skip;
			}
		}catch(err){
		}
		cbContentBucket.query(query, function(err, results) {
			if(err){
				logger.error({type:"ContentBucketViewQueryError",query:query,error:err});
				if(typeof callback=="function")
				callback({"error":"while executing view in "+config.cbContentBucket,"query":query});
				return;
			}
			if(keysRemain.length>0){
				query.options.keys=JSON.stringify(keysRemain);
				executeViewInContentBucket(query,function(newRes){
					if(newRes.error){
						if(typeof callback=="function")
						callback(results.concat(newRes))
					}else{
						if(typeof callback=="function")
						callback(results.concat(newRes));
					}
				})
			}else{
				if(typeof callback=="function")
				callback(results);
			}
		});	
	}else{
		cbContentBucket.query(query, function(err, results) {
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
}
exports.executeViewInContentBucket=executeViewInContentBucket;*/



async function executeViewInContentBucket(dd,vn,options,callback){
	const viewResult = await cbContentBucket.viewQuery(
		dd,
		vn,
		options,
		function(err, results) {
			if(err){
				console.log(err)
				callback({"error":"while executing view in "+config.cbContentBucket,"query":dd+"->"+vn,"options":options});
				return;
			}
			callback(results.rows);
		}
	  );
}
exports.executeViewInContentBucket=executeViewInContentBucket;

/**
 * 
 * @param query
 * @param callback
 * view on the doc in Master Bucket
 * 
 */
async function executeViewInMasterBucket(dd,vn,options,callback){
	const viewResult = await cbMasterBucket.viewQuery(
		dd,
		vn,
		options,
		function(err, results) {
			if(err){
				callback({"error":"while executing view in "+config.cbMasterBucket,"query":dd+"->"+vn,"options":options});
				return;
			}
			callback(results.rows);
		}
	  )
}
exports.executeViewInMasterBucket=executeViewInMasterBucket;


/**
 * 
 * @param query
 * @param callback
 * view on the doc in Definition Bucket
 * 
 */
async function executeViewInDefinitionBucket(dd,vn,options,callback){
	const viewResult = await cbDefinitionBucket.viewQuery(
		dd,
		vn,
		options,
		function(err, results) {
			if(err){
				callback({"error":"while executing view in "+config.cbDefinitionBucket,"query":dd+"->"+vn,"options":options});
				return;
			}
			callback(results.rows);
		}
	  )
}
exports.executeViewInDefinitionBucket=executeViewInDefinitionBucket;








/**
 * 
 * @param query
 * @param callback
 * view on the doc in Definition Bucket
 * 
 */
async function executeViewInMessagesBucket(query,callback){
	const viewResult = await cbMessagesBucket.viewQuery(
		dd,
		vn,
		options,
		function(err, results) {
			if(err){
				callback({"error":"while executing view in "+config.cbMessagesBucket,"query":dd+"->"+vn,"options":options});
				return;
			}
			callback(results.rows);
		}
	  )
}
exports.executeViewInMessagesBucket=executeViewInMessagesBucket;





/**
 * 
 * @param query
 * @param callback
 * view on the doc in Sitemaps Bucket
 * 
 */
async function executeViewInSitemapsBucket(query,callback){
	const viewResult = await cbSitemapsBucket.viewQuery(
		dd,
		vn,
		options,
		function(err, results) {
			if(err){
				callback({"error":"while executing view in "+config.cbSitemapsBucket,"query":dd+"->"+vn,"options":options});
				return;
			}
			callback(results.rows);
		}
	  )
}
exports.executeViewInSitemapsBucket=executeViewInSitemapsBucket;










async function removeDocumentByIdFromMasterBucket(docId,callback){
	try{
		const result = await cbMasterCollection.remove(docId);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while removing the doc with id "+docId+"  from bucket"+config.cbMasterBucket});
	}
}
exports.removeDocumentByIdFromMasterBucket=removeDocumentByIdFromMasterBucket;


async function removeDocumentByIdFromContentBucket(docId,callback){
	try{
		const result = await cbContentCollection.remove(docId);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while removing the doc with id "+docId+"  from bucket"+config.cbContentBucket});
	}
}
exports.removeDocumentByIdFromContentBucket=removeDocumentByIdFromContentBucket;


async function removeDocumentByIdFromDefinitionBucket(docId,callback){
	try{
		const result = await cbDefinitionCollection.remove(docId);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({"error":"while removing the doc with id "+docId+"  from bucket"+config.cbDefinitionBucket});
	}
}
exports.removeDocumentByIdFromDefinitionBucket=removeDocumentByIdFromDefinitionBucket;



/**
 * Keyword Bucket stuff
 * 
 */

async function createKeyword(keyword,callback){
	try{
		const result = await cbKeywordCollection.upsert(docId);
		if(typeof callback=="function")
			callback(result);
	}catch(error){
		if(typeof callback=="function")
		callback({error:"failed to upsert"});
	}
}
exports.createKeyword=createKeyword;

async function getKeywords(srchkey,callback){
	var startKey=null;
	var endKey="z";
	if(typeof srchkey!="undefined" && srchkey!=null){
		startKey=srchkey;
		endKey=srchkey+"z";
	}
	const viewResult = await cbSitemapsBucket.viewQuery(
		"keywords",
		"getKeywords",
		{idRange:{start:startKey,end:endKey},limit:10},
		function(err, results) {
			if(err){
				callback({"error":"while executing view in "+config.cbKeywordBucket,"query":dd+"->"+vn,"options":options});
				return;
			}
			callback(results);
		}
	  )
}
exports.getKeywords=getKeywords;

async function executeN1QLInAuditBucket(query,params,callback){
	executeN1QL(query,params,callback);
}
exports.executeN1QLInAuditBucket=executeN1QLInAuditBucket;

async function executeN1QLInContentBucket(query,params,callback){
	executeN1QL(query,params,callback);
}
exports.executeN1QLInContentBucket=executeN1QLInContentBucket;

async function executeN1QL(query,params,callback){
	console.log(query);
	console.log(params);
	await cluster.query(query, (params && params.parameters)?params.parameters:[],function(err, results) {
		if(err){
			logger.error({type:"N1QLQueryError",error:err});
			if(typeof callback=="function")
			callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results.rows);
	});
}
exports.executeN1QL=executeN1QL;
