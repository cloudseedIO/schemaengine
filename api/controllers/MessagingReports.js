/**
 * @author Vikram Jakkampudi
 */
var urlParser=require('./URLParser');
var CouchBaseUtil=require('./CouchBaseUtil');
var couchbase = require('couchbase');
var GenericServer=require('./GenericServer.js');
var utility=require('./utility.js');
var mailgun=require('../services/clsMailgun.js');

var limitCount=require("../utils/global.js").summaryLimitCount+1//19;// 9
var schedule = require('node-schedule');
var logger = require('../services/logseed').logseed;
/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/

var j;
if(process.env.NODE_ENV=="production"){
	j = schedule.scheduleJob('0 0 12 * * *', function(){
		logger.info({type:"MessagingReports:DailyScheduler"});
		invokeEmailTriggerForUnAttendedChats(undefined,function(data){
			//console.log(data);
		});
	});
}
exports.service = function(request,response){
	response.contentType("application/json");
	response.header("Cache-Control", "no-cache");
	var operationValue = urlParser.getRequestQuery(request).operation; 
	var body=urlParser.getRequestBody(request);
	switch(operationValue){
		case "countByUserId":
			var options={};
			options.reduce=false;
			options.group=true;
			if(body.skip && !isNaN(body.skip)){
				options.skip=body.skip*1;
			}
			if(body.limit && !isNaN(body.limit)){
				options.limit=body.limit*1+1;
			}else{
				options.limit=limitCount;
			}
			CouchBaseUtil.executeViewInMessagesBucket("notifications", "countByUserId",options,function(data){
				response.send(data);
			});
			break;
		case "invokeEmailTriggerForUnAttendedChats":
			invokeEmailTriggerForUnAttendedChats(undefined,function(data){
				response.send(data);
			});
			break;
		case "invokeEmailTriggerForUnAttendedChatsForUser":
			if(body.userId){
				invokeEmailTriggerForUnAttendedChats(body.userId,function(data){
					response.send(data);
				});
			}else{
				response.send({error:"No UserId"});
			}
			break;
		case "invokeEmailTriggerForUnAttendedTopic":
			if(body.topicId && body.userId){
				invokeEmailTriggerForUnAttendedTopic(body.topicId,body.userId,function(data){
					response.send(data);
				});
			}else{
				response.send({error:"No UserId or topicId"});
			}
			break;
		case "invokeEmailTriggerForUnAttendedChat":
			if(body.chatId && body.userId){
				invokeEmailTriggerForUnAttendedChat(body.chatId,body.userId,function(data){
					response.send(data);
				});
			}else{
				response.send({error:"No UserId or topicId"});
			}
			break;
		case "noResponseTopics":
			var options={};
			options.reduce=false;
			if(body.skip && !isNaN(body.skip)){
				options.skip=body.skip*1;
			}
			if(body.limit && !isNaN(body.limit)){
				options.limit=body.limit*1+1;
			}else{
				options.limit=limitCount;
			}
			CouchBaseUtil.executeViewInMessagesBucket("notifications", "noResponseTopics",options,function(data){
				response.send(data);
			});
			break;
		case "allPendingChats":
			var options={};
			options.reduce=false;
			if(body.skip && !isNaN(body.skip)){
				options.skip=body.skip*1;
			}
			if(body.limit && !isNaN(body.limit)){
				options.limit=body.limit*1+1;
			}else{
				options.limit=limitCount;
			}
			CouchBaseUtil.executeViewInMessagesBucket("notifications", "allPendingChats",options,function(data){
				response.send(data);
			});
			break;
			break;
		case "allPendingTopicsByUser":
			var options={};
			if(body.key){
				options.key=body.key;
				options.reduce=false;
			}else{
				options.reduce=true;
				options.group=true;
			}
			if(body.skip && !isNaN(body.skip)){
				options.skip=body.skip*1;
			}
			if(body.limit && !isNaN(body.limit)){
				options.limit=body.limit*1+1;
			}else{
				options.limit=limitCount;
			}
			CouchBaseUtil.executeViewInMessagesBucket("notifications", "allPendingTopicsByUser",options,function(data){
				response.send(data);
			});
			break;
		default:
			response.send({"error":"invalid request"});
			break;
	}
};



function getMailData(data){
	var name=data.name;
	var email=data.email;
	var count=data.count?data.count:1;
	var subject="You have "+count+" notifications";
	var message="<div>Hello "+name+",</div>" +
	"<div>You have "+ count +" messages waiting for you.";
	if(data.type && (data.type=="Topic" || data.type=="Chat")){
		if(data.type=="Topic"){
			subject="You have new Topic";
		}else{
			subject="You have new messages";
		}
		if(data.fromUser){
			subject+=" from "+data.fromUser;
		}
		if(data.message)
		message=data.message;
	}
return {
		from:"cloudseed <info@cloudseed.com>",
		to:[email],
		inline : [process.cwd()+"/views/branding/wklogonopad.jpg"],
		subject:subject,
		//text:"You have Notifications",
		html: "<!DOCTYPE html><html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: Montserrat;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
		"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
		"<link href='https://fonts.googleapis.com/css?family=Montserrat:200,300,400,500' rel='stylesheet'/>"+
		"<link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
	"</head>" +
	"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: &quot;Montserrat&quot;,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
		"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
			/*"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'>" +
				"<img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'>" +
			"</div>" +*/
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
				"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'>" +
					"<a href='https://www.cloudseed.com'>" +
						"<img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'>" +
					"</a>"+
				"</div>" +
			"</div>" +
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
				"<span style='font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
					"<div>" +
						message+
					"</div>" +
				"</span>" +
			"</div>" +
			/*"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 30px 30px 50px 30px'>" +
				"<a href='https://www.cloudseed.com' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;margin:10px;'>" +
						"cloudseed" +
				"</a>" +
			"</div>" +
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
				"<span style='font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
					"If the button above does not work, paste this into your browser:" +
				"</span>" +
			"</div>" +*/
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 100px;'>" +
				"<span style='font-size: 13px;color: #4992E3;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
					"https://www.cloudseed.com"+
				"</span>" +
			"</div>" +
			"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
				"<span style='font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
						"Copyright @"+(new Date().getFullYear())+", cloudseed Media Works LLP, All rights reserved." +
				"</span>" +
			"</div>"+
		"</div>" +
	"</body>" +
"</html>",
	};
}

function invokeEmailTriggerForUnAttendedChats(key,callback){
	CouchBaseUtil.executeViewInMessagesBucket("notifications","countByUserId",{group:true,reduce:true,key:key}, function(counts) {
		if(counts.error){
			console.log(error);
			if(typeof callback=="function")
			callback(error);
			return;
		}else if(Array.isArray(counts) && counts.length>0){
			
			processEmail(0);
			function processEmail(index){
				if(index<counts.length){
					
					CouchBaseUtil.getDocumentByIdFromContentBucket(counts[index].key,function(userRes){
						if(userRes.error){
							processEmail(index+1);
						}else if(typeof userRes=="object" && 
								typeof userRes.value=="object" && 
								typeof userRes.value.email =="string"){
							var name=(userRes.value.givenName+" "+(userRes.value.familyName?userRes.value.familyName:"")).trim();
							console.log(userRes.value.recordId,name,userRes.value.email,counts[index].value);
							var mailData=getMailData({name:name,email:userRes.value.email,count:counts[index].value});
							if((userRes.value.type && userRes.value.type=="demo")){
								console.log("Demo User");
							}else{
								mailgun.getMailgun().messages().send(mailData, function (err, result) {
									console.log(err,result)
								});
							}
							processEmail(index+1);
						}else{
							processEmail(index+1);
						}
					});
					
				}else{
					if(typeof callback=="function")
						callback({success:true});
				}
			}
		}else{
			if(typeof callback=="function")
				callback(counts);
		}
	});
}

function invokeEmailTriggerForUnAttendedTopic(topicId,userId,callback){
	if(!topicId || !userId){
		callback({error:"No topic Id or UserId"});
		return;
	}
	CouchBaseUtil.getDocumentByIdFromMessagesBucket(topicId,function(topicRes){
		if(topicRes.error){
			callback(topicRes);
			return;
		}
		var topic=topicRes.value;
		if(topic.userId==userId){
			callback({error:"Trying to send email to the creator of the topic"});
			return;
		}
		CouchBaseUtil.getDocumentByIdFromContentBucket(userId,function(userRes){
			if(userRes.error){
				callback(userRes);
				return;
			}
			var user=userRes.value;
			CouchBaseUtil.getDocumentByIdFromContentBucket(topic.userId,function(creatorRes){
				if(creatorRes.error){
					callback(creatorRes);
					return;
				}
				var creator=creatorRes.value;
				var creatorName=(creator.givenName+" "+(creator.familyName?creator.familyName:"")).trim();
				var name=(user.givenName+" "+(user.familyName?user.familyName:"")).trim();
			var message="<div>Hello "+name+",</div>" +
				"<div>You have new message from "+creatorName+"</div>"+
				"<div><b>"+topic.topic+"</b></div><br/>"+
				"<div>"+(topic.message?topic.message:"")+"</div><br/>";
			var mailData=getMailData({type:"Topic",name:name,email:user.email,message:message,fromUser:creatorName});
			/*if((user.type && user.type=="demo") || user.internal){
				console.log("Demo User");
				callback({"error":"demo user"})
			}else{*/
				mailgun.getMailgun().messages().send(mailData, function (err, result) {
					console.log(err,result);
					callback(result);
				});
			//}
			});
		});
 
	});
}
function invokeEmailTriggerForUnAttendedChat(chatId,userId,callback){
	if(!chatId || !userId){
		callback({error:"No chat Id or UserId"});
		return;
	}
	CouchBaseUtil.getDocumentByIdFromMessagesBucket(chatId,function(chatRes){
		if(chatRes.error){
			callback(chatRes);
			return;
		}
		var chat=chatRes.value;
		if(!(chat.counter && chat.counter[userId] && chat.counter[userId].count>0)){
			callback({error:"No notifications available"});
			return;	
		}
		CouchBaseUtil.getDocumentByIdFromContentBucket(userId,function(userRes){
			if(userRes.error){
				callback(userRes);
				return;
			}
			var user=userRes.value;
			var senderId=chat.chatFrom==userId?chat.chatTo:chat.chatFrom;
			CouchBaseUtil.getDocumentByIdFromContentBucket(senderId,function(senderRes){
				if(senderRes.error){
					callback(senderRes);
					return;
				}
				var sender=senderRes.value;
				var senderName=(sender.givenName+" "+(sender.familyName?sender.familyName:"")).trim();
				var name=(user.givenName+" "+(user.familyName?user.familyName:"")).trim();
			var message="<div>Hello "+name+",</div>" +
				"<div>You have "+(chat.counter[userId].count)+" new message"+(chat.counter[userId].count>1?"s":"")+" from "+senderName+"</div>"+
				"<div>Topic : <b>"+chat.topic+"</b></div><br/>";
			var mailData=getMailData({type:"Chat",name:name,email:user.email,message:message,fromUser:senderName});
			/*if((user.type && user.type=="demo") || user.internal){
				console.log("Demo User");
				callback({"error":"demo user"})
			}else{*/
				mailgun.getMailgun().messages().send(mailData, function (err, result) {
					if(err){
						logger.error({type:"MessagingReports",error:err});
					}
					callback(result);
				});
			//}
			});
		});
 
	});
}
