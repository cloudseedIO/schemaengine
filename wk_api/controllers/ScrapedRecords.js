/**
 * 
 * @author saikiran.vadlakonda
 * @date 23rd Jan, 2018
 * 
 */
 
var reactConfig=require('../../config/ReactConfig');
var config=reactConfig.init;
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});  //config.cbAddress+":"+config.cbPort

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

var records="records";
var schemas="schemas";

var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var global=require('../utils/global.js');
var cloudinary = require('cloudinary');
var CouchBaseUtil=require('./CouchBaseUtil');



/*cloudinary.config({ 
   cloud_name: "dzd0mlvkl",
   api_key: "672411818681184", 
   api_secret:'mqpdhFgkCTUyrdg318Var9_dH-I'
});
*/
cloudinary.config({ 
   cloud_name: config.clCloud_name,
   api_key: config.clAPI_key, 
   api_secret: config.clAPI_secret
});

function getScrapedRecs(data, callback){
	
	var manufacturerId=data.Manufacturer.id;
	var dependentSchema=data.dependentSchema;
	console.log('Manufacturer: '+manufacturerId, 'dependentSchema: '+dependentSchema);
	
	var query="SELECT * FROM records WHERE `Manufacturer`='"+manufacturerId+"' AND `@derivedObjName`='"+dependentSchema+"' AND `$status`='under_review'  LIMIT 1";
	try {
		executeN1QL(query,{parameters:[]}, function(err, res){
			if(err){
				console.log(err); 
				callback(err);
			}else{
				if(res.length && res[0] && res[0]['records']){
					callback({'record':res[0]['records']});
				}else{
					callback({});
				}
				
			}
		});
	} catch (e) {
		console.log(e);
		console.log("Something went wrong");
		callback("Something went wrong");
	}
}



exports.getScrapedRecs=getScrapedRecs;
