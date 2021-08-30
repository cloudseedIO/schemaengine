/**
 * @author Vikram Jakkampudi
 */
var urlParser=require('./URLParser');
var CouchBaseUtil=require('./CouchBaseUtil');
var couchbase = require('couchbase');
var GenericServer=require('./GenericServer.js');
var utility=require('./utility.js');
var mailgun=require('../services/clsMailgun.js');
var nodemailer=require('nodemailer');

var limitCount=require("../utils/global.js").summaryLimitCount+1//19;// 9
var global=require('../utils/global.js');
var logger = require('../services/logseed').logseed;

exports.service = function(request,response){
	response.header("Cache-Control", "no-cache");
	var operationValue = urlParser.getRequestQuery(request).operation; 
	var body=urlParser.getRequestBody(request);
	switch(operationValue){
		case "updatenewsletter":
			if(checkUserValidity(request,response))
			updatenewsletter(body,function(res){
				response.contentType("application/json");
				response.send(res);
			});
			break;
		case "previewnewsletter":
			if(checkUserValidity(request,response))
			previewnewsletter(body,function(res){
				response.contentType("application/json");
				response.send(res);
			});
			break;
		case "processnewsletter":
			if(checkUserValidity(request,response))
			processnewsletter(body,function(res){
				response.contentType("application/json");
				response.header("Cache-Control", "no-cache");
				response.send(res);
			});
			break;
		case "testnewsletter":
			if(checkUserValidity(request,response))
			testnewsletter(body,function(res){
				response.contentType("application/json");
				response.header("Cache-Control", "no-cache");
				response.send(res);
			});
			break;
		case "getnewsletters":
			if(checkUserValidity(request,response))
			getNewsLetters(function(nls){
				response.contentType("application/json");
				response.header("Cache-Control", "no-cache");
				response.send(nls);
			});
			break;
		case "getnewsletter":
			if(checkUserValidity(request,response))
			getNewsLetter(body.recordId,function(nls){
				response.contentType("application/json");
				response.header("Cache-Control", "no-cache");
				response.send(nls);
			});
			break;
		case "deletenewsletter":
			if(checkUserValidity(request,response))
			deleteNewsLetter(body.recordId,function(nls){
				response.contentType("application/json");
				response.header("Cache-Control", "no-cache");
				response.send(nls);
			});
			break;
		case "getmfrrecords":
			if(checkUserValidity(request,response))
			getMfrRecords(function(records){
				response.contentType("application/json");
				if(records.error){
					response.send(records);
				}else{
					response.send({records:records});
				}
			});
			break;
		case "unsubscribe":
			var recordId=urlParser.getRequestQuery(request).recordId;
			unsubscribe(recordId,function(res){
				response.contentType("text/html");
				response.send("<h2>you are Unsubscribed successfully</h2><h3><a href='/newsletter?operation=subscribe&recordId="+recordId+"'>Click here to re subscribe</a></h3>");
			});
			break;
		case "subscribe":
			var recordId=urlParser.getRequestQuery(request).recordId;
			subscribe(recordId,function(res){
				response.contentType("text/html");
				response.send("<h2>you are Subscribed successfully</h2><h3><a href='/newsletter?operation=unsubscribe&recordId="+recordId+"'>Click here to unsubscribe</a></h3>");
			});
			break;
		default:
			response.contentType("application/json");
			response.send({"error":"invalid request"});
			break;
	}
};
function checkUserValidity(request,response){
	if(request && request.session && request.session.userData){
		if(request.session.navLinks && request.session.navLinks.cloudPointAdmin){
			return true;
		}else if(request.session.orgAndRoles && Array.isArray(request.session.orgAndRoles["public"]) && 
				request.session.orgAndRoles["public"].indexOf("RoleForNewsLetter")>-1){
			return true;
		}else{
			response.contentType("application/json");
			response.send({"error":"Invalid User"});
			return false;
		}
	}else{
		response.contentType("application/json");
		response.send({"error":"Not logged in"});
		return false;
	}
}

function updatenewsletter(newsletter,callback){
	CouchBaseUtil.upsertDocumentInContentBucket(newsletter.recordId,newsletter,function(res){
		if(typeof callback=="function")
		callback(res);
	});
}
function testnewsletter(newsletter,callback){
	var gmailSMTP=newsletter.gmailSMTP;
	getMfr(newsletter.manufacturers[0].recordId,function(mfr){
		var mailerinput={
				from:newsletter.from,
				manufacturer:mfr,
				subject:newsletter.subject,
				message:newsletter.message,
				includeUnsubscribe:newsletter.includeUnsubscribe,
				email:newsletter.email
		}
		getMailData(mailerinput,function(mailData){
			mailData.gmailSMTP=gmailSMTP;
			mailData.to=[newsletter.email];
			//mailgun.getMailgun().messages().send
			submitMail(mailData, function (err, result) {
				if(err){
					callback({error:"Send Fail"});
				}else{
					callback({success:"Sent"});
				}
			});
		});
	});
}
function processnewsletter(newsletter,callback){
	var gmailSMTP=newsletter.gmailSMTP;
	CouchBaseUtil.getDocumentByIdFromContentBucket(newsletter.recordId,function(res){
		if(res.error){callback(res);return};
		newsletter=res.value;
		if(!Array.isArray(newsletter.sendStatus)){
			newsletter.sendStatus=[];
		}
		if(newsletter["$status"]=="draft"){
			logger.info({type:"NewsLettrer",message:"News letter sending started",id:newsletter.recordId});
			newsletter["$status"]="Sending";
			updatenewsletter(newsletter);
			processMfr(0);
			callback({success:"Queued for sending"});
		}else if(newsletter["$status"]=="Sending"){
			callback({error:"Already Queued for sending"});
		}else if(newsletter["$status"]=="Sent"){
			callback({error:"This news letter already sent"});
		}else{
			callback({error:"Invalid State"});
		}
		function processMfr(index){
			if(index<newsletter.manufacturers.length){
				getMfr(newsletter.manufacturers[index].recordId,function(mfr){
					if(mfr.subscribed===false){
						newsletter.sendStatus.push({
							recordId:mfr.recordId,
							subscribed:false,
							name:mfr.name,
							unsubscribedDate:mfr.unsubscribedDate,
							error:"unsubscribed"
						});
						updatenewsletter(newsletter);
						processMfr(index+1);
					}else if(!mfr.address || (!mfr.address.email && !mfr.email)){
						newsletter.sendStatus.push({
							name:mfr.name,
							recordId:mfr.recordId,
							error:"No email id found in address field"
						});
						updatenewsletter(newsletter);
						processMfr(index+1);
					}else{
						var mailerinput={
								senderName:newsletter.senderName,
								from:newsletter.from,
								manufacturer:mfr,
								subject:newsletter.subject,
								message:newsletter.message,
								includeUnsubscribe:newsletter.includeUnsubscribe
						}
						getMailData(mailerinput,function(mailData){
							//mailgun.getMailgun().messages().send
							mailData.gmailSMTP=gmailSMTP;
							submitMail(mailData, function (err, result) {
								updateMfrAsContacted(mfr.recordId,function(result2){
									newsletter.sendStatus.push({
										recordId:mfr.recordId,
										name:mfr.name,
										error:err,
										success:result
									});
									//;process every message with 5 minutes interval
									updatenewsletter(newsletter);
									setTimeout(function(){ processMfr(index+1); },1*60*1000);
								});
							});
						});
					}
				});
			}else{
				newsletter["$status"]="Sent";
				updatenewsletter(newsletter);
			}
		}
	});
}

function previewnewsletter(newsletter,callback){
	if(Array.isArray(newsletter.manufacturers) && 
			newsletter.manufacturers.length>0 && 
			newsletter.manufacturers[0]){
		getMfr(newsletter.manufacturers[0].recordId,function(mfr){
			var mailerinput={
					senderName:newsletter.senderName,
					from:newsletter.from,
					manufacturer:mfr,
					subject:newsletter.subject,
					message:newsletter.message,
					includeUnsubscribe:newsletter.includeUnsubscribe
			}
			getMailData(mailerinput,callback);
		});
	}else{
		callback({"error":"No Manufacturer selected"});
	}
}
/**
 * data{from,manufacturer{recordId,email},subject,message}
 * 
 * */
function getMailData(data,callback){
	var components=[];
	var temp=data.subject.match(/\*\|[^(\||\*)]+\|\*/g);
	if(temp){
		components=temp.map(function(c){
			return c.replace(/\*|\|/g,"");
		});
	}
	temp=data.message.match(/\*\|[^(\||\*)]+\|\*/g);
	if(temp){
		temp.forEach(function(c){
			if(components.indexOf(c.replace(/\*|\|/g,""))==-1){
				components.push(c.replace(/\*|\|/g,""));
			};
		});
	}
	getMfrMessageComponents(data.manufacturer.recordId,components,function(res){
		var html=res.html;
		components.forEach(function(c){
			var regexp=new RegExp("\\*\\|"+c+"\\|\\*","g")
			data.subject=data.subject.replace(regexp,html[c]);
			data.message=data.message.replace(regexp,html[c]);
		});
		data.message=data.message.replace(/(?:\r\n|\r|\n)/g, '<br>');
		var email=data.manufacturer.address.email || data.manufacturer.email;
		var to =[email];
		if(data.manufacturer.contactPerson && data.manufacturer.contactPerson.email){
			to.push(data.manufacturer.contactPerson.email);
		}
		//to=["sidhartha@cloudseed.io"]//,"sidhartha@cloudseed.io","editorial@wishkarma.com"];
		var from = ""+(data.senderName?data.senderName:data.from.split("@")[0])+(" <"+data.from+">");
		callback({
				from:from,
				to:to,
				inline :[],
				subject:data.subject,
				html: "<!DOCTYPE html>"+
						"<html lang='en'>" +
						"<head>" +
							"<link href='https://fonts.googleapis.com/css?family=Montserrat:200,300,400,500' rel='stylesheet'/>"+
						"</head>" +
						"<body style='margin: 0;font-family: &quot;Montserrat&quot;,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
							"<div style='margin: 0 auto;text-align: center;'>" +
								"<div style='text-align: left;'>" +
									"<div style='font-size: 13px;color: black;'>" +
										data.message +
									"</div>" +
								"</div>" +
								"<br/>" +
								(data.includeUnsubscribe?("<div class='row' style='text-align: left;margin-bottom: 10px;'>" +
									"<span style='font-size: 13px;color: black;'>" +
										"<a href='https://www.wishkarma.com/newsletter?operation=unsubscribe&recordId="+data.manufacturer.recordId+"'>unsubscribe here</a>" +
									"</span>" +
								"</div>"):"")+
							"</div>" +
						"</body>" +
						"</html>"
		});
	});
}
function getNewsLetters(callback){
	var query = 'SELECT raw records FROM records WHERE docType="NewsLetter"';
	CouchBaseUtil.executeN1QL(query,{parameters:[]},function(results){
		callback(results);
	});
}
function deleteNewsLetter(recordId,callback){
	CouchBaseUtil.removeDocumentByIdFromContentBucket(recordId,callback);
}

function getMfrRecords(callback){
	var query = 'SELECT recordId,name,address,contacted,`$status` FROM records WHERE docType="Manufacturer"';
	CouchBaseUtil.executeN1QL(query,{parameters:[]},function(results){
		callback(results);
	});
}
function updateMfrAsContacted(recordId,callback){
	if(recordId){
		var query = 'UPDATE records USE KEYS $1 SET contacted=true returning recordId,contacted';
		CouchBaseUtil.executeN1QL(query,{parameters:[recordId]},function(results){
			if(typeof callback=="function")
			callback(results);
		});
	}else{
		if(typeof callback=="function")
			callback({error:"No recordId"});
	}
}
function getMfr(recordId,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(res){
		callback(res.value);
	});
}
function getNewsLetter(recordId,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(res){
		callback(res.value);
	});
}
function subscribe(recordId,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(res){
		if(res.error){
			callback(res)
		}else{
			var mfr=res.value;
			mfr.subscribed=true;
			mfr.subscribedDate=global.getDate();
			CouchBaseUtil.upsertDocumentInContentBucket(recordId,mfr,function(res){
				callback(res);
			});
		}
	});
}
function unsubscribe(recordId,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(res){
		if(res.error){
			callback(res)
		}else{
			var mfr=res.value;
			mfr.subscribed=false;
			mfr.unsubscribedDate=global.getDate();
			CouchBaseUtil.upsertDocumentInContentBucket(recordId,mfr,function(res){
				callback(res);
			});
		}
	});
}
function getMfrCats(recordId,callback){
	var query = 'SELECT raw records FROM records WHERE docType="MfrProCat" AND Manufacturer= $1 ORDER BY name ASC';
	CouchBaseUtil.executeN1QL(query,{parameters:[recordId]},function(results){
		callback(results);
	});
}
function getMfrCatsProCounts(recordId,catIds,callback){
	var query='select productCategory,count(*) as total from records where docType="Product" AND Manufacturer = $1 AND productCategory in $2  GROUP BY productCategory ORDER BY total DESC';
	CouchBaseUtil.executeN1QL(query,{parameters:[recordId,catIds]},function(results){
		callback(results);
	});
}

function getMfrCatsCount(recordId,callback){
	var query = 'SELECT count(*) as count FROM records WHERE docType="MfrProCat" AND Manufacturer= $1';
	CouchBaseUtil.executeN1QL(query,{parameters:[recordId]},function(results){
		var count=0;
		if(results.length>0){
			count=results[0].count;
		}
		callback(count);
	});
}

function getMfrProCount(recordId,callback){
	var query = 'SELECT count(*) as count FROM records WHERE docType="Product" AND Manufacturer= $1 ORDER BY name ASC';
	CouchBaseUtil.executeN1QL(query,{parameters:[recordId]},function(results){
		var count=0;
		if(results.length>0){
			count=results[0].count;
		}
		callback(count);
	});
}

function getMfrSamplePro(recordId,callback){
	var query = 'SELECT raw records FROM records WHERE docType="Product" AND Manufacturer= $1 ORDER BY name ASC LIMIT 20';
	CouchBaseUtil.executeN1QL(query,{parameters:[recordId]},function(results){
		callback(results);
	});
}
/*MFR_NAME
MFR_CATS_NAMES
MFR_CATS_GALLERY
MFR_TOTAL_CATS
MFR_TOTAL_PRO
MFR_PRODUCTS*/
function getMfrMessageComponents(recordId,components,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(mfrRes){
		if(mfrRes.error){callback(mfrRes);return;}
		var mfrRecord=mfrRes.value;
		var result={};
		get(0);
		function get(index){
			if(index<components.length){
				getMfrComponent(mfrRecord,components[index],function(res){
					result[components[index]]=res.html;
					get(index+1);
				});
			}else{
				callback({html:result});
			}
		}
		
	});
}
function getMfrComponent(mfrRecord,component,callback){
	if(component=="MFR_SLUG"){
		if(mfrRecord["@uniqueUserName"]){
			callback({html:"<a href='https://www.wishkarma.com/"+mfrRecord["@uniqueUserName"].toLowerCase()+"'>wishkarma.com/"+mfrRecord["@uniqueUserName"].toLowerCase()+"</a>"});
		}else{
			callback({html:""});
		}
	}else if(component=="MFR_NAME"){
		callback({html:mfrRecord.name});
	}else if(component=="MFR_TOTAL_CATS"){
		getMfrCatsCount(mfrRecord.recordId,function(res){
			callback({html:res});
		});
	}else if(component=="MFR_CATS_NAMES"){
		getMfrCats(mfrRecord.recordId,function(res){
			var temp=[];
			res.forEach(function(record){
				temp.push(record.categoryName);
			});
			callback({html:temp.join(", ")});
		});
	}else if(component=="MFR_CATS_GALLERY"){
		getMfrCats(mfrRecord.recordId,function(res){
			var catIds=[];
			var catDocs={};
			res.forEach(function(record){
				catIds.push(record.ProductCategory);
				catDocs[record.ProductCategory]=record;
			});
			getMfrCatsProCounts(mfrRecord.recordId,catIds,function(res){
				var html="<div style='margin-top:15px;'>";
				res.forEach(function(recCount){
					var img="";
					try{
						var url="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+catDocs[recCount.productCategory].image[0].cloudinaryId+".jpg";
						img="<img height='150px' width='150px' src='"+url+"'/>";
						
						html+="<div style='padding: 15px;float: none;display: inline-block;'>" +
									(catDocs[recCount.productCategory]["@uniqueUserName"]?(
										"<a style='color:black;text-decoration:none;' href='https://www.wishkarma.com/"+catDocs[recCount.productCategory]["@uniqueUserName"]+"'>"
									):"")+
									"<div>"+
										img +
									"</div>"+
									"<div>" +
										"<b>" +catDocs[recCount.productCategory].categoryName+"("+recCount.total+")"+"</b>" +
									"</div>"+
									(catDocs[recCount.productCategory]["@uniqueUserName"]?"</a>":"")+
								"</div>";

					}catch(err){}
				});
				html+="</div>";
				callback({html:html});
			});
		});
	}else if(component=="MFR_TOTAL_PRO"){
		getMfrProCount(mfrRecord.recordId,function(res){
			callback({html:res});
		});
	}else if(component=="MFR_PRODUCTS"){
		getMfrSamplePro(mfrRecord.recordId,function(res){
			var html="<div style='margin-top:15px;'>";
			res.forEach(function(product){
				var img="";
				try{
					var url="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+product.productImages[0].produtImages[0].cloudinaryId+".jpg";
					img="<img height='150px' width='150px' src='"+url+"'/>";
					html+="<div style='padding: 15px;float: none;display: inline-block;'>" +
								(product["@uniqueUserName"]?(
										"<a style='color:black;text-decoration:none;' href='https://www.wishkarma.com/"+product["@uniqueUserName"]+"'>"
								):"")+
								"<div>"+
									img +
								"</div>"+
								"<div>" +
									"<b>"+product.name+"</b>"+
								"</div>"+
								(product["@uniqueUserName"]?"</a>":"")+
							"</div>";

				}catch(err){}
			});
			html+="</div>";
			callback({html:html});
		});
	}
}




function submitMail(mailData,callback){
	if(mailData.gmailSMTP && mailData.gmailSMTP.email && mailData.gmailSMTP.password){
		var smtpConfig = {
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					user: mailData.gmailSMTP.email,
					pass: mailData.gmailSMTP.password
				},
		        tls: {
		        	rejectUnauthorized: false
		        }
			};
		var transporter = nodemailer.createTransport(smtpConfig);
		//transporter.verify(function(error, success) {});
		transporter.sendMail(mailData, function(err,res){
		    callback(err,res);
		});	
	}else{
		delete mailData.gmailSMTP;
		mailgun.getMailgun().messages().send(mailData, callback);
	}
}
