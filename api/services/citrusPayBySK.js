/**
 * 
 */
var crypto = require('crypto');
var citrus = require('./citruspay');
exports.generateSignature = generateSignature;
var reactConfig=require('../../config/ReactConfig');


function generateSignature(amount, callback) {
    //Need to change with your Secret Key
    var secret_key = "481857d5e5002f1e64be7310f99b8aaa84ba3ac1";
    
    //Need to change with your Access Key
    var accesskey = "84M66OU6QCKAM92GDBMO";
    
    //Should be unique for every transaction
    var txn_id = getTxnId();

    //Need to change with your Order Amount
    //var amount = request.query.amount;
    var data = 'merchantAccessKey=' + accesskey + '&transactionId=' + txn_id + '&amount=' + amount;

    console.log("Transaction Id: "+txn_id+", Amount: "+amount);
    
    // generate hmac
    var hmac = crypto.createHmac('sha1', secret_key);
    hmac.update(data);
    var sign = hmac.digest('hex');
    console.log("sign for "+txn_id+" is :"+sign);
    if(callback){
    	callback({"sign": sign, "txn_id": txn_id});
    }
    //return hmac.digest('hex');
}


function getTxnId(){
	return "CLSCTRS"+(reactConfig.guid());
}

exports.getTxnDetails = function(request, response, callback){
	if(!request || !request.body.txnId){
		callback({"Error":"While retrieving Transaction Number"});
	}
	//vanity, accessKey, secretKey
	var gateway = citrus.gateway('9ismcsgy0b', "84M66OU6QCKAM92GDBMO", "481857d5e5002f1e64be7310f99b8aaa84ba3ac1");
	gateway.enquire(request.body.txnId, function(res){
		if(res.enquiryResponse){
			callback(res.enquiryResponse);
		}else{
			callback(res?res:{"error":"Invalid Transaction ID"});
		}
	});
};



function getSignature(dataString){
	var secret_key = "481857d5e5002f1e64be7310f99b8aaa84ba3ac1";
	var signature = crypto.createHmac('sha1', secret_key).update(dataString).digest('hex');
	return signature;
}
exports.getSignature=getSignature;
