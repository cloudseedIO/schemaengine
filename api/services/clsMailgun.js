/**
 * @author saikiran.vadlakonda
 */

var fs = require('fs');
var path = require('path');
var Mailgun = require('mailgun-js');
var reactConfig=require('../../config/ReactConfig');
var config = reactConfig.init;
var https = require('https');
var cloudinary = require('cloudinary');
var logger = require('./logseed').logseed;
//var GenericController=require('../controllers/GenericController');
var mailgun;

getMailgun();

cloudinary.config({ 
	   cloud_name: config.clCloud_name,
	   api_key: config.clAPI_key, 
	   api_secret: config.clAPI_secret
});
/*
GenericController.getDefinition({recordId:"CloudPointConfig"},function(response){
	console.log("Mail Config");
	var mailConfig = response.email.mailGun;
	config.mailgunApiKey= mailConfig.API_key;
	config.mailgunDomain= mailConfig.Domain_name;
	config.mailgunMailList= mailConfig.main_list;
	
});*/


/**
 * This function is to send mail.
 * 
 * @param mailData - JSON Object.
 * 
 * mailData should contain 
 *    from      -> String,
 *    to        -> This should be in array format,
 *    subject   -> String,
 *    html      -> Optional (If specifying, should be a valid HTML),
 *    text		-> Plain Text,
 *    attachment-> Optional (If specified, should be in file Reading stream)
 *    
 *    
 *    To enable tracking we need to include following keys
 *    
 * @param callback 
 * 
 * @type JSON
 * 
 * @returns JSON
 */
exports.sendMail = function(mailData, callback){
	if(mailData.hasOwnProperty("subject") && mailData.hasOwnProperty("to")){
		try {
			if(!mailData.hasOwnProperty("from")){
				mailData['from']='Cloudseed <no-reply@cloudseed.io>';
			}
			
			//var filepath = path.join(__dirname, 'Waterlilies.jpg');
			//var file = fs.readFileSync(filepath);
			//var attch = new mailgun.Attachment({"data": file, "filename": 'Waterlilies.jpeg', "contentType": "image/jpeg"});
			//mailData['attachment'] = attch;
			/*
			mailgun.get('/lists', { }, function (error, body) {
				if(error){
					console.log("get err");console.log(error);//callback(error);
				}else{
					console.log("get body");console.log(body);//callback(body);
				}
				  
			});*/
			/*
			mailgun.get(resource, data, callback) - sends GET request to the specified resource on api.
			*/
			var userExists = false;
			console.log("Mailing Service");
			https.get( "https://api:"+config.mailgunApiKey+"@api.mailgun.net/v3/"+config.mailgunDomain+"/unsubscribes", function(result){
				result.on("data",function(data){
					data = data.toString('ascii');
					data = JSON.parse(data);
					members = data.items;
					for(var i=0; i<members.length; i++){
						  if(mailData['to'] == members[i]['address']){//checking whether the current user is in unsubscribed list
							  userExists = true;  
						  }
						}
						if(!userExists){
							if(mailgun){
								mailgun.messages().send(mailData, function (err, result) {
								  console.log("In mail send service");
							        if (err) {
							        	console.log("Error occurred while sending mail: "+err);
							        	console.log("Error While sending Mail");
										callback({"error":"Error While sending Mail","reason":err});
							        }else {
							        	if(callback && result.hasOwnProperty("id")){
											console.log("Successfully Mail Has been sent");
											callback({"success":"Mail has been sent","data":result});
										}else{
											console.log("Error While sending Mail From mail service");
											callback({"error":"Error While sending Mail","reason":result});
										}
							        }
							    });
							}else{
								console.log("Error While sending Mail, Mailing Service is unavailable");
								callback({"error":"Error While sending Mail","reason": "Unable to get Mail configuration details"});
							}
						 }else{
						  console.log("Error While sending Mail");
						  callback({"error":"Error While sending Mail","reason": "User has unsubscribed from our domain"});
						 }
					
				});
				/*
				if(err){
					console.log("Error: "+err);callback({"Error": "Error has been raised", "data": err});
				}else{
					console.log("Unsubscribers list");
					console.log(members);
					var usersCount = members.total_count;
					var usersList = members.items;
					var userExists = false;
					
				  }*/
			});
			
			/*Below code for list of available campaigns
			mailgun.campaigns().list(function(err, data){
				if(err){
					console.log("err"+err);
					callback({"Error": "Error has been occurred", "data": err});
				}else{
					//data format, which is passed by mailgun will be like below
					//{ items:
					//	   [ { bounced_count: 0,
					//	       clicked_count: 0,
					//	       complained_count: 0,
					//	       created_at: 'Sat, 23 May 2015 05:18:01 GMT',
					//	       delivered_count: 0,
					//	       dropped_count: 0,
					//	       id: 'fe0za',
					//	       name: 'invite',
					//	       opened_count: 0,
					//	       submitted_count: 0,
					//	       unsubscribed_count: 0 } ],
					//	  total_count: 1 }
					console.log(data);
					callback({"Success":"Ok", "data":data});
				}
			});
			
			mailgun.unsubscribes().list(function(err, members) {
				if(err){
					console.log("Error: "+err);callback({"Error": "Error has been raised", "data": err});
				}else{
				  console.log("Unsubscribers list");
				  console.log(members);
				  var usersCount = members.total_count;
				  var usersList = members.items;
				  var userExists = false;
				  for(var i=0; i<usersCount; i++){
					  if(mailData['to'] == usersList[i]['address']){//checking whether the current user is in unsubscribed list
						userExists = true;  
					  }
				  }
				  if(!userExists){
					  mailgun.messages().send(mailData, function (err, result) {
					        if (err) {
					        	console.log("Error occurred while sending mail: "+err);
					        	console.log("Error While sending Mail Line No:63");
								callback({"error":"Error While sending Mail","reason":err});
					        }else {
					        	if(callback && result.hasOwnProperty("id")){
									console.log("Successfully Mail Has been sent Line No:67");
									callback({"success":"Mail has been sent","data":result});
								}else{
									console.log("Error While sending Mail Line No:70");
									callback({"error":"Error While sending Mail","reason":result});
								}
					        }
					    });
				  }else{
					  console.log("Error While sending Mail Line No:76");
					  callback({"error":"Error While sending Mail","reason": "User has unsubscribed from our domain"});
				  }
				}
			});
			*/
		} catch (e) {
			console.log(e);
			callback({"error":"Error Occurred while sending email", "reason": e});
		}
	}else{
		console.log("Error Occurred while parsing JSON");
		callback({"error":"Error Occurred while parsing JSON", "reason":"Invalid JSON Format"});
	}
}


exports.subscribeUser = function(mailData, callback){
	if(mailData.hasOwnProperty("mailId")){
		try {
			if(!mailgun){
				mailgun = getMailgun();
			}
				if(mailgun){
					var list = mailgun.lists(config.mailgunMailList);
					var user = {
							  subscribed: true,
							  address: mailData['mailId'],
							  name: mailData['name'],
							  upsert: "yes" 			//yes to update member if present, no to raise error in case of a duplicate member (default) 
							};
					/**
					 * Deleting user from Un-subscribed list
					 */
					mailgun.unsubscribes(mailData['mailId']).delete(function(err, data){
						if(err){
							console.log("err"+err);
							callback({"Error": "Error has been occurred", "data": err});
						}else{
							console.log(data);
							list.members().create(user, function (err, result) {
								if(err){
									console.log("Error Occurred while Subscribing User");
									callback({"error":"Error Occurred while Subscribing User", "reason": e});
								}else{
									if(callback){
										console.log("User subscribed successfully");
										callback({"Success": "User has been subscribed", "data": result});
									}
								}
							});
							
							mailgun.lists().list(function(err, data){
								if(err){
									console.log("err"+err);
								}else{
									console.log(data);
								}
							});
						}
						
					});
				}else{
					console.log("Error While sending Mail");
					callback({"error":"Error While sending Mail","reason": "Unable to get Mail configuration details"});
				}
		} catch (e) {
			console.log("Error Occurred while Subscribing User");
			callback({"error":"Error Occurred while Subscribing User", "reason": e});
		}
		
	}else{
		console.log("Invalid JSON Format for subscribing");
		callback({"error":"Error Occurred while parsing JSON", "reason":"Invalid JSON Format"});
	}
}


exports.unSubscribeUser = function(mailData, callback){
	if(mailData.hasOwnProperty("mailId")){
		try {
			if(!mailgun){
				mailgun = getMailgun();
				if(mailgun){
					mailgun.lists(config.mailgunMailList)
				    .members(config.mailgunMailList)
				    .update({"subscribed":"no"}, function(err, result){
				    	if(err){
				    		console.log("Error Occurred while unsubscribing user:"+mailData['mailId']);
				    		console.log(err);
				    		callback({"error":"Error Occurred while Unsubscribing User", "reason": err});
				    	}else{
				    		console.log("User Successfully Unsubscribed");
				    		console.log(result);
				    		callback({"success": "User has been subscribed", "data": result});
				    	}
				    });
				}else{
					console.log("Error While sending Mail");
					callback({"error":"Error While sending Mail","reason": "Unable to get Mail configuration details"});
				}
			}
			
		} catch (e) {
			console.log("Error Occurred while Unsubscribing User");
			callback({"error":"Error Occurred while Unsubscribing User", "reason": e});
		}
		
	}else{
		console.log("Invalid JSON Format for unsubscribing");
		callback({"error":"Error Occurred while parsing JSON", "reason":"Invalid JSON Format"});
	}
}
/*
 * Need to write campaign creation code
 * To create campaign we need campaign name and id,
 * ID is optional [If user doesn't provide ID, then mailgun will generate]
 * 
 * 
 * For More Info
 * https://github.com/1lobby/mailgun-js/blob/master/docs/campaign.md
 * 
 * */

exports.createCampaign = function(campaignData, callback){
	try {
		if(!mailgun){
			mailgun = getMailgun();
			if(mailgun){
				mailgun.campaigns().list(function(error, result){/* Retrieving Existing Campaigns List */
					if(error){
						callback({"error":"Error Occurred while creating campaign", "reason":"Network Problem"});
					}else{
						for(var i=0; i<result.total_count; i++){
							if(result.item[i].name == campaignData.name){
								callback({"error":"Error Occurred while creating campaign", "reason":"Campaign with this name already exists, Delete previous campaign and proceed"});
							}
						}
						mailgun.campaigns().create(campaignData, function(err, res){
							if(err){
								callback(err);
							}else{
								callback(res);
							}
						});
					}
				});
			}else{
				console.log("Error While sending Mail");
				callback({"error":"Error While sending Mail","reason": "Unable to get Mail configuration details"});
			}
		}
	}catch(e){
		console.log("Error Occurred while creating campaign");
		callback({"error":"Error Occurred while creating campaign", "reason": e});
	}
}

/**
 * To create Mailing List
 * 
 * For More Info
 * https://github.com/1lobby/mailgun-js/blob/master/docs/list.md
 * And
 * https://documentation.mailgun.com/api-mailinglists.html#mailing-lists
 * 
 * Parameters to create Mailing List
 * address     -	A valid email address for the mailing list, e.g. developers@mg.cloudseed.io, or Developers <devs@mg.cloudseed.io>
 * name        -	New name, e.g. My newsletter
 * description - 	Description string
 * access_level- 	List access level, one of: readonly (default), members, everyone
 * 
 * mailgun.lists('developer@mg.cloudseed.io').members().list({subscribed:true, skip:1}, function(err, res){ console.log(err);console.log(res);});
 * 
 * sample response will be like this
 * {
 *  "message": "Mailing list has been created",
 *  "list": {
 *     "created_at": "Tue, 06 Mar 2012 05:44:45 GMT",
 *     "address": "dev@samples.mailgun.org",
 *     "members_count": 0,
 *     "description": "Mailgun developers list",
 *     "name": ""
 *  }
 * }
 * 
 * 
 * */

var createMailingList = exports.createMailingList = function(listData, callback){
	if(!listData.hasOwnProperty('address')){
		try {
			if(!mailgun){
				mailgun = getMailgun();
				if(mailgun){
					mailgun.lists().create(listData, function(error, result){
						if(error){
							callback(error);
						}else{
							callback(result);
						}
					});
				}else{
					console.log("Error While sending Mail");
					callback({"error":"Error While sending Mail","reason": "Unable to get Mail configuration details"});
				}
			}
		}catch(e){
			console.log("Error Occurred while creating mailing list");
			callback({"error":"Error Occurred while creating mailing list", "reason": e});
		}
	}else{
		console.log("Invalid JSON Format for creating mailing list");
		callback({"error":"Error Occurred while parsing JSON", "reason":"Invalid JSON Format"});
	}
}

/**
 * Adds a member to the mailing list.
 * 
 * 
 * memberData.data should have following fields
 * address     -	Valid email address specification, e.g. Alice <alice@example.com> or just alice@example.com
 * name        - 	Optional member name
 * vars        -	JSON-encoded dictionary string with arbitrary parameters, e.g. {"gender":"female","age":27}
 * subscribed  - 	yes to add as subscribed (default), no as unsubscribed
 * upsert      - 	yes to update member if present, no to raise error in case of a duplicate member (default) 
 */
var addListMember = exports.addListMember = function(memberData, callback){
	var mailingList = memberData.mailingList;
	var memberDetails = memberData.data;
	if(mailingList && membersDetails){
		try {
			if(!mailgun){
				mailgun = getMailgun();
				if(mailgun){
					mailgun.lists(mailingList).members().create(memberDetails, function(error, result){
						if(error){
							callback(error);
						}else{
							callback(result);
						}
						
					});
				}else{
					console.log("Error While sending Mail");
					callback({"error":"Error While sending Mail","reason": "Unable to get Mail configuration details"});
				}
			}
		}catch(e){
			console.log("Error Occurred while adding a member to mailing list");
			callback({"error":"Error Occurred while adding a member to mailing list", "reason": e});
		}
	}else{//Invalid JSON
		console.log("Invalid JSON Format for adding a member to mailing list");
		callback({"error":"Error Occurred while parsing JSON", "reason":"Invalid JSON Format"});
	}
}

/**
 * Adding members to Mailing list will do here
 * Adds multiple members, up to 1,000 per call, to a Mailing List.
 * 
 * membersData should contain following fields
 * address -   Address of the mailing list
 * members -   JSON-encoded array. Elements can be either addresses, e.g. ["bob@example.com", "alice@example.com"], or JSON objects, e.g. [{"address": "bob@example.com", "name": "Bob", "subscribed": false}, {"address": "alice@example.com", "name": "Alice"}] . Custom variables can be provided, see examples.
 * upsert  -   yes to update existing members, no (default) to ignore duplicates
 * 
 */
var addListMembers = exports.addListMembers = function(membersData, callback){
	try {
		if(!mailgun){
			mailgun = getMailgun();
			if(mailgun){
				mailgun.lists(membersData.address).members().add(membersData.list, function(error, result){
					if(error){
						callback(error);
					}else{
						callback(result);
					}
				});
			}else{
				console.log("Error While adding members to mailing list");
				callback({"error":"Error While adding members to mailing list","reason": "Unable to get Mail configuration details"});
			}
		}
	}catch(e){
		console.log("Error Occurred while adding members to mailing list");
		callback({"error":"Error Occurred while adding members to mailing list", "reason": e});
	}
	
}

/**
 * Delete a mailing list member.
 * 
 * memberData should contain following fields
 * address - Mailing List email ID
 * member_address - email id of the member
 * 
 * */
var deleteAMember = exports.deleteAMember = function(memberData, callback){
	try {
		if(!mailgun){
			mailgun = getMailgun();
			if(mailgun){
				mailgun.lists(memberData.address).members(memberData.member_address).delete(function(error ,result){
					if(error){
						callback(error);
					}else{
						callback(result);
					}
				});
			}else{
				console.log("Error While deleting a member from mailing list");
				callback({"error":"Error While deleting a member from mailing list","reason": "Unable to get Mail configuration details"});
			}
		}
	}catch(e){
		console.log("Error Occurred while deleting a member from mailing list");
		callback({"error":"Error Occurred while deleting a member from mailing list", "reason": e});
	}
}


/**
 * a list of mailing lists under your account.
 * 
 * 
 */

var getAllMailingLists = exports.getAllMailingLists = function(callback){
	 mailgun.lists().list(function(err, res){
		 if(error){
			 callback(error);
		 }else{
			 callback(result);
		 }
	});
}

/**
 * Deletes a mailing list.
 * 
 * address - Address of the mailing list
 */
var deleteMailingList = exports.deleteMailingList = function(address, callback){
	if(address.indexOf('@')!=-1){
		mailgun.lists(address).delete(function(err, res){
			if(err){
				callback(err);
			}else{
				callback(res);
			}
		});
	}else{
		//Invalid JSON
	}
}

/**
 * To validate EMAIL-ID
 * 
 * 
 */
var validateEmailID = exports.validateEmailID = function(emailID, callback){
	
	https.get('https://api:pubkey-5ogiflzbnjrljiky49qxsiozqef5jxp7@api.mailgun.net/v3/address/validate?address='+emailID, function(res){
		res.on('data', function(data){
			var result = data.toString('ascii');
			callback(result);
		});
	});
}


function getMailgun(){
	if(!mailgun){
		if(config.mailgunApiKey && config.mailgunDomain){
			mailgun = new Mailgun({apiKey: config.mailgunApiKey, domain: config.mailgunDomain});
		}else{
			logger.error("Unable to get configuration details.Check Your Mail configuration.");
			mailgun=false;
		}
	}
	return mailgun;
}
exports.getMailgun=getMailgun;

