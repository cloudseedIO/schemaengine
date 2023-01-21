/**
 * @author saikiran.vadlakonda
 * source: https://www.npmjs.com/package/exotel, https://github.com/ramniquesingh/exotel
 * 
 * 
 * Date: 05-November-2015
 */

var exotel = require('exotel');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;

var CouchBaseUtil=require('../controllers/CouchBaseUtil');
var urlParser=require('url');
var getDocumentByIdFromContentBucket=CouchBaseUtil.getDocumentByIdFromContentBucket;
var getDocumentByIdFromMasterBucket=CouchBaseUtil.getDocumentByIdFromMasterBucket;
var getDocumentByIdFromDefinitionBucket=CouchBaseUtil.getDocumentByIdFromDefinitionBucket;
var logger = require('./logseed').logseed;

var xtlService = exotel({
	id: config.exotelSId, token: config.exotelToken
});
var exophone = '04039594260';
var messageService={};
exports.messageService=messageService;

exports.service = function(request,response){
	var operationValue = request.query.operation; 
	if(operationValue == undefined){
		operationValue = urlParser.parse(request.url,true).query["operation"];
	}
	var body={};
	if(request.method=="GET"){
		body=urlParser.parse(request.url,true);	
	}else{
		body=request.body;
	}
	console.log("Body:");
	console.log(JSON.stringify(body));
	console.log(JSON.stringify(request));
	/*response.contentType("application/json");
	response.send({"data":"returning manually"});*/
	
	switch(operationValue){
	case "makeACall":
		try{
			invokeCallService(request.body,function(jsonObject){
				console.log("Sending Search Results");
				response.contentType("application/json");
				response.send({"data":jsonObject});
			});
		}catch(e){
			console.log(e);
		}
			
		break;
	default:response.contentType("application/json");
			response.send({"data":"invalid operation"});
		break;
	}
}






messageService.sendSMS = function(to, msg, cb){
	if(isNaN(to) || to.length<10){
		cb({"error": "Invalid Mobile Number"});
	}else{
		xtlService.sendSMS(to, msg, cb, function(err, res){
			if(err){
				cb(err);
			}else{
				cb(res);
			}
		});
		
	}
}

/**
 * Source: https://github.com/vishnuj/exotel-client
 * 
 * */

var exotelClient = require('exotel-client');

exotelClient.init(config.exotelSId, config.exotelToken);


var sendSms = exports.sendSms = function(from, to, body, callback) {
	if(isNaN(from) || isNaN(to) || body.length>0){
		callback({'error':"Invalid parameters"});
	}else{
		exotelClient.send_sms(from, to, body, callback);
	}
}

/*
 * http://support.exotel.in/support/solutions/articles/48259-outbound-call-to-connect-an-agent-to-a-customer-
 * 
 * */
var makeACall = function(from, exophone, to, callback) {
	if(isNaN(from) || isNaN(to) || typeof callback!="function"){
		callback({'error':"Invalid parameters"});
	}else{
		exotelClient.call_number(from, exophone, to, function(err, res){
			if(err){
				callback(err);
			}else if(res){
				callback(res);
			}
		});
	}
}
exports.makeACall = makeACall; 






/*
t be made because of TRAI NDNC regulations.
Read more about this here: 
http://support.exotel.in/support/solutions/articles/35421-what-kind-of-calls-can-i-make-to-people-who-have-registered-in-the-ncpr-and-to-people-who-have-not


> 
exotel.call_number('9959697997', '04039594260', '8523093988', function(err, res){
if(err){
console.log(JSON.stringify(err));
}
if(res){
console.log(JSON.stringify(res));
}
});

exotel.send_sms('9700188138', '8523093988', 'This is from our exotel-client module',function(err, res){
if(err){
console.log(JSON.stringify(err));
}
if(res){
console.log(JSON.stringify(res));
}
});



> "{\"RestException\":{\"Status\":403,\"Message\":\"Call to [09989543212] can not be made because of TRAI NDNC regulations. Read more about this here: http:\\/\\/support.exotel.in\\/support\\/solutions\\/articles\\/35421-what-kind-of-calls-can-i-make-to-people-who-have-registered-in-the-ncpr-and-to-people-who-have-not\"}}"
*/


/*
 * To know the status of DND of a mobile number
 * It'll return a html page
 * */
function getDNDStatus(number, callback){
	req.post('http://exotel.in/hacks/exotel-geo/iframe-index.php', {form:{mobile_number:number}}, function(err, res){
		 if(err){
			 console.log(err);
			 callback(err);
		 }
		 if(res){
			 console.log(res);
			 callback(res);
		 }
	});
}


/*
 * {from:fromUserId, to:toUserId}
 * */
function invokeCallService(jsonData, callback){
	if(jsonData['from'] && jsonData['to']){
		getDocumentByIdFromContentBucket(jsonData['from'], function(fromUserRecord){
			fromUserRecord = fromUserRecord.value;
			console.log("from user found ");
			var fromNumber = fromUserRecord.phone;
			if(!fromNumber){
				fromNumber=fromUserRecord.telephone;
			}
			if(!fromNumber){
				fromNumber=fromUserRecord.address.telephone;
			}
			if(!fromNumber){
				callback({error: "You don't have a phone number to make a call, kindly update your phone number in your profile"});
			}else{
				console.log("from user number: "+fromNumber);
				fromNumber = fromNumber.replace(/\s/g, '');
				console.log("from user number: "+fromNumber);
				getDocumentByIdFromContentBucket(jsonData['to'],function(toUserRecord){
					toUserRecord=toUserRecord.value;
					console.log("to user found ");
					var toNumber = toUserRecord.phone;
					if(!toNumber){
						toNumber = toUserRecord.telephone;
					}
					if(!toNumber){
						toNumber = toUserRecord.address.telephone;
					}
					if(!toNumber){
						callback({error: toUserRecord.name+" "+toUserRecord.docType+" don't have a phone number to make a call"});
					}else{
						console.log("to user number: "+toNumber);
						toNumber = toNumber.replace(/\s/g, '');
						console.log("to user number: "+toNumber);
						makeACall(fromNumber, exophone, toNumber, function(res){
							if(res.error){
								console.log(JSON.stringify(res));
								callback({error: 'some problem occurred', reason: res.error});
							}else if(res.RestException){
								console.log(JSON.stringify(res));
								callback({error: 'some problem occurred', reason: res.RestException.message});
							}else{
								console.log(JSON.stringify(res));
								callback({success: 'calling request initiated'});
							}
						});
					}
					
				});
			}
			
		});
	}else{
		callback({error: "invalid data for this service"});
	}
}


/*
 * Next:-
 * http://support.exotel.in/support/solutions/articles/48283-working-with-passthru-applet
 * and
 * http://support.exotel.in/support/solutions/articles/177719-how-do-i-integrate-exotel-into-my-crm-
 * 
 * Need to write code for call log using passthru applet.
 * (Record creation by using the URL parameter keys and values, after call completion update the record)
 * 
 * Develop user pop-up/notification for agents for their incoming call
 * http://support.exotel.in/support/solutions/articles/121409-how-do-i-popup-a-window-in-my-crm-for-an-incoming-call-
 * 
 * 
 * Connecting customer to app
 * http://support.exotel.in/support/solutions/articles/48278-exotel-call-api-doc-how-to-connect-a-customer-to-an-existing-app-in-your-company-
 * 
 * White listing a customer manually
 * http://support.exotel.in/support/solutions/articles/167971-how-do-i-whitelist-a-number-which-is-part-of-the-dnd-ncpr-registry-
 * 
 * */



/*
 * Below code is to get details of the call, whenever any user calls to our app number
 * */

exports.exotelSerice=function(request, response){
	var body={};
	console.log("Request from exotel....");
	if(request.method=="GET"){
		body=urlParser.parse(request.url,true).query;	
	}else{
		body=request.body;
	}
	
	var params = Object.keys(body);
	
	/*
	 * Record creation code
	 * 
	 * */
	
	
	
	response.contentType("application/json");
	response.send({"data":body});
}


function isValidPhoneNumber(phNum){
	var isValid=false;
	if(typeof phNum=="string" ){
		
	}else{
		
	}
	
	return isValid;
}
