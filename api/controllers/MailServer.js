/**
 * @author Vikram Jakkampudi
 */
var urlParser=require('./URLParser');
var ContentServer=require('../ContentServer.js');
var CouchBaseUtil=require('./CouchBaseUtil');
var utility=require('./utility.js');
var UserController=require("./UserController.js");
var mailgun=require('../services/clsMailgun.js');
var logger = require('../services/logseed').logseed;

function shareByEmail(request,response){
	var hostname = request.headers.host.split(":")[0];
	var title=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).title:"";
	var invitedTo=request.protocol+"://"+request.headers.host;
	var invitedBy="";
	if(request && request.session && request.session.userData){
		if(request.session.userData.givenName){
			invitedBy+=request.session.userData.givenName;
		}
		if(request.session.userData.familyName){
			invitedBy+="  "+ request.session.userData.familyName;
		}
		var name=invitedBy;
		if(request.session.userData.email){
			invitedBy+="  ("+request.session.userData.email+")  ";
		}
	}
	var data=urlParser.getRequestBody(request);

	var email=data.email;
	if(email==undefined || email=="" || email==null){
		response.contentType("application/json");
		response.send({sent:false});
		return;
	}
	//style='text-decoration:none;color:#333333'
	var html="<br><h3 style='text-align: center;color:#333333'>"+invitedBy +"sent you this via <a href="+invitedTo+">"+ title+"</a>.</h3>" +
			"<h4 style='text-align:center;font-style: italic;'><a  href="+data.url+">"+data.message+"<a></h4><div>"+ data.link+"</div>"
	var mailData={
			from:name+" <no-reply@cloudseed.io>",
			to:[email],
			subject:"Check this out at "+title,
			//text:text,
			html:html
		}
	mailgun.getMailgun().messages().send(mailData, function (err, result) {
		if (err) {
			response.contentType("application/json");
			response.send({sent:false});
		}else {
			response.contentType("application/json");
			response.send({sent:true});
		}
	});
}
exports.shareByEmail=shareByEmail;


function invite(request,response){
	var hostname = request.headers.host.split(":")[0];
	var title=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).title:"";
	var invitedTo=request.protocol+"://"+request.headers.host;
	var invitedBy="";
	if(request && request.session && request.session.userData){
		if(request.session.userData.givenName){
			invitedBy+=request.session.userData.givenName;
		}
		if(request.session.userData.familyName){
			invitedBy+="  "+ request.session.userData.familyName;
		}
		if(request.session.userData.email){
			invitedBy+="  ("+request.session.userData.email+") ";
		}
	}
	var data=urlParser.getRequestBody(request);
	var email=undefined;
	var org=undefined;
	if(data.email){
		if(data.email.email){
		//add member invite
			email=data.email.email;
			if(data.email.org){
				org=data.email.org;
			}
		}else{
			email=data.email;
		}
	}
	if(!email){
		response.contentType("application/json");
		response.send({sent:false});
		return;
	}
	var emails=Array.isArray(email)?email:[email];
	var mailData={};
	var activationCode = ""+utility.guid().replace(/-/g,"")+utility.guid().replace(/-/g,"");
	if(org){
			CouchBaseUtil.getDocumentByIdFromContentBucket(org,function(actualRecord){
				var orgName="";
				if(actualRecord.error  || typeof actualRecord.value=="undefined"){

				}
				if(actualRecord.value){
					orgName=actualRecord.value.name;
				}
				mailData={
						to: emails,
						html: "<!DOCTYPE html><html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: Montserrat;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
								"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
									"<meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
									"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
									"<link href='https://fonts.googleapis.com/css?family=Montserrat:200,300,400,500' rel='stylesheet'/>"+
									"<link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
								"</head>" +
								"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: &quot;Montserrat&quot;,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
									"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
										"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'>" +
											"<img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'>" +
										"</div>" +
										"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
											"<span style='font-size: 20px;font-weight: 100;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"You are invited!" +
											"</span>" +
										"</div>" +
										"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
											"<span style='font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"<div>" +
													"<div>Hello,</div>" +
													"<div>Your colleague "+ invitedBy +"has invited you "+(orgName?("to join "+orgName):"") +",a private collaboration space for your organization</div>"+
												"</div>" +
											"</span>" +
										"</div>" +
										"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 30px 30px 50px 30px'>" +
											"<a href='https://www.cloudseed.com/join?code="+(activationCode)+"' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;margin:10px;'>" +
													"ACCEPT" +
											"</a>" +
										"</div>" +
										"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
											"<span style='font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"If the button above does not work, paste this into your browser:" +
											"</span>" +
										"</div>" +
										"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 100px;'>" +
											"<span style='font-size: 13px;color: #4992E3;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
												"https://www.cloudseed.com/join?code="+(activationCode)+
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
						subject: "Invited to cloudseed",
						from: "cloudseed <no-reply@cloudseed.com>",
						inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
						};
				mailgun.getMailgun().messages().send(mailData, function (err, result) {
					console.log(JSON.stringify(mailData))
					UserController.getUserDocByEmail({email:email,activationCode:activationCode,invitedOrg:org},function(userDoc){
						response.contentType("application/json");
						response.send(userDoc);

					});

				})

			})
	}else{
		 mailData={
					to: emails,
					html: "<!DOCTYPE html><html lang='en' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: Montserrat;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: rgba(0,0,0,0);'>" +
							"<head style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
								"<meta charset='utf-8' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
								"<link type='text/css' rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
								"<link href='https://fonts.googleapis.com/css?family=Montserrat:200,300,400,500' rel='stylesheet'/>"+
								"<link type='text/css' rel='stylesheet' href='https://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.min.css' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
							"</head>" +
							"<body style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 0;font-family: &quot;Montserrat&quot;,Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857143;color: #333;background-color: #fff;padding: 0px;'>" +
								"<div style='margin: 0 auto;text-align: center;border: 1px solid lightgrey;padding: 2% 10%;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
									"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 40px;'>" +
										"<img src='cid:wklogonopad.jpg' style='width: 160px;color: lightgrey;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;border: 0;vertical-align: middle;page-break-inside: avoid;max-width: 100%!important;'>" +
									"</div>" +
									"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
										"<span style='font-size: 20px;font-weight: 100;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
											"You are invited!" +
										"</span>" +
									"</div>" +
									"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
										"<span style='font-size: 13px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
											"<div>" +
												"<div>Hello,</div>" +
												"<div>Your colleague "+ invitedBy +"has invited you "+
											"</div>" +
										"</span>" +
									"</div>" +
									"<div style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin: 30px 30px 50px 30px'>" +
										"<a href='https://www.cloudseed.com' style='-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;box-sizing:border-box;box-sizing:border-box;box-sizing:border-box;text-decoration:none;color:white;background-color:black;padding:5px 40px;margin:10px;'>" +
												"ACCEPT" +
										"</a>" +
									"</div>" +
									"<div style='text-align: left;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;margin-bottom: 10px;'>" +
										"<span style='font-size: 12px;color: black;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;'>" +
											"If the button above does not work, paste this into your browser:" +
										"</span>" +
									"</div>" +
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
					subject: "Invited to cloudseed",
					from: "cloudseed <no-reply@cloudseed.com>",
					inline : [process.cwd()+"/views/branding/wklogonopad.jpg"]
				};
		 mailgun.getMailgun().messages().send(mailData, function (err, result) {
		 		if(err){
		 			logger.error({type:"MailServer",error:err});
		 		}
				if(org){

				}else{
					if (err) {
						response.contentType("application/json");
						response.send({sent:false});
					}else {
						response.contentType("application/json");
						response.send({sent:true});
					}
				}
			});
	}


}
exports.invite=invite;
