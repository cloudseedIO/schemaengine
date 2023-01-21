var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress);
var N1qlQuery = couchbase.N1qlQuery;
var cbContentBucket=cluster.openBucket(config.cbContentBucket);

var requiredFormat={
		"clientID":"",
		"clientSecret": "",
		"appAuth": {
			"keyID":"",
		    "publicKeyID": "",
		    "privateKey": "",
		    "passphrase": ""
		},
		"businessId": ""
};
var dbFormate={
		box_com_data:{
			enterpriseId: '34660778',
			settings: ''+
				'{\n'+
				'	"boxAppSettings": {\n'+
				'		"clientID": "asdf",\n '+
				'		"clientSecret": "asdf",\n '+
				'		"appAuth": {\n      '+
				'			"publicKeyID": "r5ba2ln4",\n '+
				'			"privateKey": "-"'+
				'			"passphrase": "asdf"\n'+
				'		}\n'+
				'	},\n '+
				'	"enterpriseID": "34660778"\n'+
				'}}',

			userId: '2953690826'
		}
}
function getConfig(enterpriseId,callback){
	var query=N1qlQuery.fromString('select box_com_data from records where docType="Provider" and box_com_data.enterpriseId=$1');
	query.adhoc = false;
	cbContentBucket.query(query,[enterpriseId],function(err, results) {
		var config={};
		if(Array.isArray(results) && results.length>0 && typeof results[0] =="object" && results[0] != null && results[0].box_com_data){
			var temp=results[0].box_com_data;
			if(temp.settings){
				try{
					var settings=JSON.parse(temp.settings);
					config=settings.boxAppSettings;
					config.appAuth.keyID=config.appAuth.publicKeyID;
					config.businessId=settings.enterpriseID;
				}catch(err){
					config={error:"No proper config details found",details:err};
				}
			}else{
				config={
					"clientID":temp.clientID,
					"clientSecret": temp.clientSecret,
					"appAuth": {
						"keyID":temp.publicKeyID,
					    "publicKeyID": temp.publicKeyID,
					    "privateKey": temp.privateKey,
					    "passphrase": temp.passphrase
					},
					"businessId": temp.enterpriseId
				};
			}



		}else{
			config={error:"No config details found"};
		}
		if(typeof callback=="function"){
			callback(config);
		}
	});
}
exports.getConfig=getConfig;
/*getConfig("34660778",function(data){
	console.log(data);
})
getConfig("32490063",function(data){
	console.log(data);
})
getConfig("random",function(data){
	console.log(data);
})*/

