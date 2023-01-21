/**
 * @author vikram
 */
var cloudinary = require('cloudinary');
var urlParser=require('./URLParser');
var SchemaController=require('./SchemaController.js');
var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var CouchBaseUtil=require('./CouchBaseUtil.js');

var GenericServer=require('./GenericServer.js');
var ContentServer=require('../ContentServer.js');
var utility=require('./utility.js');
var global=require('../utils/global.js');

cloudinary.config({ 
   cloud_name: config.clCloud_name,
   api_key: config.clAPI_key, 
   api_secret: config.clAPI_secret
});

var logger = require('../services/logseed').logseed;
const { ViewScanConsistency } = require('couchbase');


exports.service = function(request,response){
	var hostname=request.headers.host.split(":")[0];
	response.contentType("application/json");
	response.header("Cache-Control", "public, max-age=60");
	var operationValue = request.query.operation; 
	if(operationValue == undefined){
		operationValue = urlParser.getParameterValue(request.url,"operation");
	}
	var body={};
	if(request.method=="GET"){
		try{
		body=JSON.parse(urlParser.getParameterValue(request.url,"data"));	
		}catch(err){}
	}else{
		body=request.body;
	}
	/**
	 * The Following is used to match OperationValue of current Request  with the  (post or get ) requests 
	 */
	switch(operationValue) {
		case "getUniqueUserName":
			getUniqueUserName(body,function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
			
		case "validateUser":
			validateUser(body,function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
			
		case "getUserDocByUserName":
			getUserDocByUserName(body,function(jsonObject){
				request.session.userData=jsonObject;
				updateLastLoggedIn({userId:jsonObject.recordId});
				GenericServer.getNavigationLinks({"userId":jsonObject.recordId,"hostname":hostname},function(navlinks){
					console.log("UC:getUserDocByUserName:aftergetNavigationLinks");
					if(request && request.session){
						request.session.navLinks=navlinks.navigation;
					}
					if(request && request.session && request.session.userData){
						request.session.orgAndRoles=navlinks.orgs;
						request.session.privileges=navlinks.roles
					}
					response.send(request.session);
				});
			});
			break;
			
		case "getUserDocByEmail":
			getUserDocByEmail(body,function(jsonObject){
				request.session.userData=jsonObject;
				updateLastLoggedIn({userId:jsonObject.recordId});
				GenericServer.getNavigationLinks({"userId":jsonObject.recordId,"hostname":hostname},function(navlinks){
					if(request && request.session){
						request.session.navLinks=navlinks.navigation;
					}
					if(request && request.session && request.session.userData){
						request.session.orgAndRoles=navlinks.orgs;
						request.session.privileges=navlinks.roles
					}
					response.send(request.session);
				});
			});
			break;
			
		case "checksession":
			if(request.session && request.session.userData){
				response.send({"userExists":true,"sessionData":request.session});
			}else {
				response.send({"userExists":false,"sessionData":ContentServer.getUnLoggedSessionObject(hostname)});
			}
			break;
			
		case "getUserShortDetails":
			getUserShortDetails(body,function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
			
		case "getCloudPointConfig":
			getCloudPointConfig(function(jsonObject){
				response.send({"data":jsonObject});
			});
			break;
		case "saveDeviceToken":
			saveDeviceToken(body,function(data){
				response.send({"data":data});
			});
			break;	
		case "updateIntroStatus":
			updateIntroStatus(request,function(data){
				response.send({data:data});
			});
			break;
		case "updateIntroSummarySelection":
			updateIntroSummarySelection(request,function(data){
				response.send({data:data});
			});
			break;
		case "updateSearchText":
			updateSearchText(request,function(data){
				response.send({data:data});
			});
			break;
		case "checkUserExistance":
			checkUserExistance(request,function(data){
				response.send(data);
			});
			break;
		case "reloadSession":
			reloadSession(request,function(data){
				response.send(data);
			});
			break;
		case "changePassword":
			var code = request.query.code;
			changePassword(code,function(data){
				response.send(data);
			});
			break;
		case "activateAccount":
			var code = request.query.code;
			activateAccount(code,function(data){
				response.send(data);
			});
			break;
		case "joinPage":
			var code = request.query.code;
			joinPage(code,function(data){
				response.send(data);
			});
			break;
		default:
			response.send({"data":{"error":"ok","reason":"invalid request"}});
	} 
	
};

function reloadSession(request,callback){
	try{
		var hostname=request.headers.host.split(":")[0];
		if(request && request.session && request.session.userData){
			GenericServer.getNavigationLinks({"userId":request.session.userData.recordId,"hostname":hostname},function(navlinks){
				request.session.navLinks=navlinks.navigation;
				request.session.orgAndRoles=navlinks.orgs;
				request.session.privileges=navlinks.roles
				callback(request.session);
			});
		}else{
			callback(request.session);
		}
	}catch(err){
		callback(request.session);
	}
}
exports.reloadSession=reloadSession;

function isUserAuthenticated(request,response){
	if(request.session.userData){
		return true;
	}else {
		return false;
	}
}
exports.isUserAuthenticated=isUserAuthenticated;

function getUserById(data,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.recordId,callback);
}
exports.getUserById=getUserById;

function getUniqueUserName(data,callback){
	CouchBaseUtil.executeViewInContentBucket("User", "getUniqueUserName",{key:data.recordId,stale:ViewScanConsistency.NotBounded},function(response){
		if(response && response.length && response.length==1 && response[0].value){
			callback(response[0].value);
		}else{
			callback("");
		}
	});
}
exports.getUniqueUserName=getUniqueUserName;

function saveUser(data,callback){
	CouchBaseUtil.upsertDocumentInContentBucket(data.recordId,data,callback);
}
exports.saveUser=saveUser;


function updateUser(UserDoc,callback){
	getUserById(UserDoc,function(res){
		if(!UserDoc.loginPassword){
			UserDoc.loginPassword=res.value.loginPassword;
		}
		CouchBaseUtil.upsertDocumentInContentBucket(UserDoc.recordId,UserDoc,function(result) {
			if (result.error) {
				callback({"error":"notfound"});
				return;
			}
			callback(result);
		});
	});
}
exports.updateUser=updateUser;


function validateUser(data,callback){
	CouchBaseUtil.executeViewInContentBucket("User", "UserPassword",{key:data.userName,stale:ViewScanConsistency.RequestPlus},function(results){
		if(results.error){
			callback(results);
			return;
		}
		if(results.length>0 && results[0].value.loginPassword==data.password){
			callback("validuser");
		}else{
			callback("invaliduser");
		}
	});		
}
exports.validateUser=validateUser;

function getUserDocByUserName(data,callback){
	CouchBaseUtil.executeViewInContentBucket("User", "UserByLoginId",{key:data.userName,stale:ViewScanConsistency.RequestPlus},function(results){
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(var i in results){
			delete results[i].value.loginPassword;
			rowData.push(results[i].value);	
		}
		callback(rowData[0]);
	});	
}
exports.getUserDocByUserName=getUserDocByUserName;
function getUserDocByEmail(data,callback){
	CouchBaseUtil.executeViewInContentBucket("User", "UserByEmail",{key:data.email.toLowerCase(),stale:ViewScanConsistency.RequestPlus},function(results){
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(var i in results){
			rowData.push(results[i].value);	
		}
		
		if(rowData.length==0){
			var userId="User"+ utility.guid();
			logger.info({type:"UserController:NewUserIsBeingCreated",id:userId,email:data.email.toLowerCase()});
			var userDoc={
						"givenName": data.fname?data.fname:(data.displayName?data.displayName:((data.email).toLowerCase())),
						"familyName": data.lname?data.lname:"",
						"loginId": data.email.toLowerCase(),
						"loginPassword": "",
						"email": (data.email).toLowerCase(),
						"about": "",
						"globalLocationNumber": "",
						"image": [],
						"coverImage": [],
						"gender": data.gender,
						"address": {
						   "addressCountry": "",
						   "addressLocality": "",
						   "addressRegion": "",
						   "postOfficeBoxNumber": "",
						   "postalCode": "",
						   "streetAddress": "",
						   "areaServed": "",
						   "availableLanguage": "",
						   "contactOption": "",
						   "contactType": "",
						   "email": "",
						   "faxNumber": "",
						   "productSupported": "",
						   "telephone": ""
						 },
						 "telephone": "",
						 "$status": "draft",
						 "socialIdentity": {
						    "facebook": "",
						    "google": "",
						    "linkedin": "",
						    "twitter": "",
						    "pinterest": ""
						 },
						 "subscribe":"No",
						 "notify":"No",
						 "docType": "User",
						 "org":"public",
						 "cloudPointHostId":"master",
						 "recordId": userId,
						 "author": userId,
						 "editor":userId,
						 "dateCreated": global.getDate(),
						 "dateModified":global.getDate(),
						 "revision":1
			
			}
			if(data.activationCode){
				userDoc.userRole=data.userRole?data.userRole:"";
				userDoc.activationCode=data.activationCode;
				userDoc.activation=false;
				userDoc.loginId=(data.email).toLowerCase();
			}
			if(data.loggedInVia=="facebook"){
				userDoc.socialIdentity.facebook=data.id;
				userDoc.image=[{}];
				userDoc.image[0].facebook=data.id;
				//userDoc.image[0].imageId="http://res.cloudinary.com/dzd0mlvkl/image/facebook/"+data.id+".jpg";
				//userDoc.image[0].cloudinaryId="http://res.cloudinary.com/dzd0mlvkl/image/facebook/"+data.id+".jpg";
				userDoc.createdVia="facebook";
				userDoc.author=userDoc.recordId;
			}
			if(data.loggedInVia=="googleplus"){
				userDoc.image=[{}];
				userDoc.image[0].google=data.id;
				userDoc.socialIdentity.google=data.id;
				//userDoc.image[0].imageId="http://res.cloudinary.com/dzd0mlvkl/image/gplus/"+data.id+".jpg";
				//userDoc.image[0].cloudinaryId="http://res.cloudinary.com/dzd0mlvkl/image/gplus/"+data.id+".jpg";
				userDoc.createdVia="google";
				userDoc.author=userDoc.recordId;
			}
			if(data.loggedInVia=="linkedin"){
				userDoc.socialIdentity.linkedin=data.id;
				userDoc.image=[{}];
				var imgId="linkedin"+ data.id;
				var images={};
				images["type"]="Image";
				images[imgId]={
						"fromWeb":true,
						"imageName":"",
						"cloudinaryId": imgId,
						"imageId":imgId,
						"url":data.image
					}
				var imageObject={};
				imageObject["images"]=images;
				SchemaController.saveAllImages(imageObject,function(){});
				userDoc.image[0].imageId=imgId;
				userDoc.image[0].cloudinaryId=imgId;
				userDoc.createdVia="linkedin";
				userDoc.author=userDoc.recordId;
			}
			saveUser(userDoc,function(r){
				setTimeout(function(){
					callback(userDoc);
				},100)
			});
		}else{
			var userDoc=rowData[0];
			if(!userDoc.image || !userDoc.image[0]){
				userDoc.image=[{}];
			}
				
			if(data.loggedInVia){
				var modified=false;
				try{
					if(userDoc.givenName==(data.email).toLowerCase()){
						userDoc.givenName=data.fname?data.fname:(data.displayName?data.displayName:(data.email).toLowerCase());
						userDoc.familyName=data.lname?data.lname:"";
						userDoc.gender=data.gender;
						if(userDoc.givenName!=(data.email).toLowerCase()){
							modified=true;
						}
					}
				if(data.loggedInVia=="facebook" && !userDoc.image[0].facebook  ){ //&& userDoc.socialIdentity.facebook!=data.id
					
					if(!userDoc.image[0].google){
						userDoc.image[0].facebook=data.id;
					}
					console.log(userDoc.image);
					userDoc.dateModified = global.getDate();
					userDoc.socialIdentity.facebook=data.id;
					userDoc.socialIdentity.status="connected";
					modified=true;
					userDoc.author=userDoc.recordId;
				}
				if(data.loggedInVia=="googleplus"  && !userDoc.image[0].google  ){// && userDoc.socialIdentity.google!=data.id
					if(!userDoc.image[0].facebook){
						userDoc.image[0].google=data.id;
					}

					userDoc.dateModified = global.getDate();
					userDoc.socialIdentity.google=data.id;
					userDoc.socialIdentity.status="connected";
					modified=true;
					userDoc.author=userDoc.recordId;
				}
				if(data.loggedInVia=="linkedin"   && userDoc.image[0].imageId==""){// && userDoc.socialIdentity.linkedin!=data.id
					var imgId="linkedin"+ data.id;
					var images={};
					images["type"]="Image";
					images[imgId]={
							"fromWeb":true,
							"imageName":"",
							"cloudinaryId": imgId,
							"imageId":imgId,
							"url":data.image
						}
					var imageObject={};
					imageObject["images"]=images;
					console.log(images);
					SchemaController.saveAllImages(imageObject,function(){});
					userDoc.modifiedOn = global.getDate();

					userDoc.dateModified = global.getDate();
					userDoc.socialIdentity.linkedin=data.id;
					userDoc.socialIdentity.status="connected";
					modified=true;
					userDoc.author=userDoc.recordId;

				}
				}catch(err){logger.error({type:"UserController:preparingUserDoc",error:err.message});}
				if(modified){
					updateUser(userDoc,function(r){
						callback(userDoc);
					});
				}else{
					callback(userDoc);
				}
			}else{
				callback(userDoc);
			}
			
		}
	
		
	});	
}
exports.getUserDocByEmail=getUserDocByEmail;

{/*
function get_gravatar(email, size) {
  
    // MD5 (Message-Digest Algorithm) by WebToolkit
    //
     
    var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
     
    var size = size || 80;
     
    return 'http://www.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + size;
}
exports.get_gravatar=get_gravatar;
*/}

function getUserShortDetails(data,callback){
	CouchBaseUtil.executeViewInContentBucket("User", "UserDetail",{key:data.id,stale:ViewScanConsistency.NotBounded},function(results){
		if(results.error){
			callback(results);
			return;
		}
		var rowData=new Array();
		for(var i in results){
			rowData.push(results[i].value);	
		}
		callback(rowData);
	});	
}
exports.getUserShortDetails=getUserShortDetails;

/*
function getCloudPointConfig(callback){
	CouchBaseUtil.getDocumentByIdFromMasterBucket("CloudPointConfig",function(result) {
			callback({"status":"ok","res":result});
	});
}
exports.getCloudPointConfig=getCloudPointConfig;*/
function saveDeviceToken(data,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.userId,function(res){
		var UserDoc=res.value;
		if(!UserDoc.deviceToken  && typeof UserDoc.deviceToken!="object"){
			UserDoc.deviceToken={};
		}
		if(data.os && data.os=="ios"){
			UserDoc.deviceToken.ios=data.deviceToken;
		}
		if(data.os && data.os=="android"){
			UserDoc.deviceToken.android=data.deviceToken;
		}
		CouchBaseUtil.upsertDocumentInContentBucket(UserDoc.recordId,UserDoc,function(result) {
			if (result.error) {
				callback({"error":"notfound"});
				return;
			}
			callback(result);
		});
	});
}
function updateLastLoggedIn(data,callback){
	CouchBaseUtil.getDocumentByIdFromContentBucket(data.userId,function(res){
		var UserDoc=res.value;
		if(!isNaN(UserDoc.loggedInCount)){
			UserDoc.loggedInCount=UserDoc.loggedInCount*1+1;
		}else{
			UserDoc.loggedInCount=1;
		}
		UserDoc.lastLoggedIn=global.getDate();
		CouchBaseUtil.upsertDocumentInContentBucket(UserDoc.recordId,UserDoc,function(result) {
			if (result.error) {
				if(typeof callback=="function"){
					callback({"error":"notfound"});
				}
				return;
			}

			if(typeof callback=="function"){
				callback(result);
			}
		});
	});
}
function checkUserExistance(request,callback){
	var hostname=request.headers.host.split(":")[0];
	var config=ContentServer.getConfigDetails(hostname);
	CouchBaseUtil.executeViewInContentBucket("UserRole", "allUserRoles",{key:[config.cloudPointHostId,request.session.userData.recordId]},function(response){
		if(response.error){
			callback({userAssociatedWithAnOrg:true});
			return;
		}
		if(response.length==0){
			callback({userAssociatedWithAnOrg:false,allOrgs:response});
		}else{
			callback({userAssociatedWithAnOrg:true,allOrgs:response});
		}
	});	
}


function updateIntroStatus(request,callback){
	var data={};
	if(request.method=="GET"){
		data=JSON.parse(urlParser.getParameterValue(request.url,"data"));	
	}else{
		data=request.body;
	}
	try{
		data.userId=request.session.userData.recordId;	
	}catch(err){}
	
	if(data.userId && data.guideId){
		CouchBaseUtil.getDocumentByIdFromContentBucket(data.userId,function(res){
			var UserDoc=res.value;
			if(!Array.isArray(UserDoc.introsDone)){
				UserDoc.introsDone=[];
			}
			if(data.guideId=="RESTOREALL"){
				UserDoc.introsDone=[];
			}else	if(UserDoc.introsDone.indexOf(data.guideId)==-1){
				UserDoc.introsDone.push(data.guideId);
			}
			try{request.session.userData=UserDoc;}catch(err){}
			CouchBaseUtil.upsertDocumentInContentBucket(UserDoc.recordId,UserDoc,function(result) {
				if (result.error) {
					callback({"error":"notfound"});
					return;
				}
				callback(result);
			});
		});
	}else{
		callback({error:"No user exists"})
	}
}



function updateIntroSummarySelection(request,callback){
	var data={};
	if(request.method=="GET"){
		data=JSON.parse(urlParser.getParameterValue(request.url,"data"));	
	}else{
		data=request.body;
	}
	try{
		data.userId=request.session.userData.recordId;	
	}catch(err){}
	
	if(data.userId && data.status){
		CouchBaseUtil.getDocumentByIdFromContentBucket(data.userId,function(res){
			var UserDoc=res.value;
			UserDoc.introsSummarySelection=status;
			try{request.session.userData=UserDoc;}catch(err){}
			CouchBaseUtil.upsertDocumentInContentBucket(UserDoc.recordId,UserDoc,function(result) {
				if (result.error) {
					callback({"error":"notfound"});
					return;
				}
				callback(result);
			});
		});
	}else{
		callback({error:"No user exists"})
	}
}

function updateSearchText(request,callback){
	var data={};
	if(request.method=="GET"){
		data=JSON.parse(urlParser.getParameterValue(request.url,"data"));	
	}else{
		data=request.body;
	}
	try{
		data.userId=request.session.userData.recordId;	
	}catch(err){}
	
	if(data.userId){
		CouchBaseUtil.getDocumentByIdFromContentBucket(data.userId,function(res){
			var UserDoc=res.value;
			if(!Array.isArray(UserDoc.searches)){
				UserDoc.searches=[];
			}
			if(data.text && UserDoc.searches.indexOf(data.text)==-1){
				UserDoc.searches.push(data.text);
			}
			if(data.type && data.type=="remove"){
				UserDoc.searches=UserDoc.searches.filter(function(k){
					return k!=data.text;
				});
			}else if (data.type && data.type=="removeAll"){
				UserDoc.searches=[];
			}
			if(UserDoc.searches.length>100){
				UserDoc.searches.splice(0,1);
			}
			try{request.session.userData=UserDoc;}catch(err){}
			CouchBaseUtil.upsertDocumentInContentBucket(UserDoc.recordId,UserDoc,function(result) {
				if (result.error) {
					callback({"error":"notfound"});
					return;
				}
				callback(result);
			});
		});
	}else{
		callback({error:"No user exists"})
	}
}

function changePassword(code,callback){
		var userDoc={};
		//check the code in query params if exits send change page else error page
		if(code && typeof code!="undefined" && code!=null){
			//An index MUST BE created to execute this 
			//CREATE INDEX `wk_resetPasswordCode` ON `records`(`resetPasswordCode`) WHERE (`resetPasswordCode` is not missing) USING GSI
			var  qryString = " SELECT `records`  FROM records WHERE `resetPasswordCode`='"+code+"'";
			CouchBaseUtil.executeViewInContentBucket(qryString,{parameters:[]},function(result){
				if(result.length){
					userDoc = result[0].records;
					callback({
						userDoc:userDoc,
						code:code
					});
				}else{
					console.log("Code not found in our db");
					callback({error:"Invalid code | code not found"});
				}
			});
		}else{
			console.log("Code not found");
			callback({error:"Code not found"});
		}
}


function activateAccount(code,callback){
		var userDoc={};
		var orgDoc={};
		//if query param contains activate code then procees
		if(code && typeof code!="undefined" && code!=null){
			//AN INDEX must be there for the below query
			//CREATE INDEX `wk_activationCode` ON `records`(`activationCode`) WHERE (`activationCode` is not missing) USING GSI
			var  qryString = " SELECT `records`  FROM records WHERE `activationCode`='"+code+"'";
			CouchBaseUtil.executeViewInContentBucket(qryString,{parameters:[]},function(result){
				if(result.length){
					//User found using activation code
					//look for org domain
					userDoc = result[0].records;
					var userRole = userDoc.userRole;
					var orgDomain=((userDoc.email).split("@")[1]).split(".")[0];
					try{
						orgDomain=((userDoc.email).split("@")[1]).split(".");
						orgDomain.splice(orgDomain.length-1,1);
						orgDomain=orgDomain.join(".");
					}catch(err){
						orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
					}
					
					//INDEX FOR this query should exists
					//CREATE INDEX `wk_orgDomain` ON `records`(`orgDomain`) WHERE (`orgDomain` is not missing)  USING GSI
					//var qryString1 = " SELECT `records`  FROM records WHERE ANY org IN `orgDomain` SATISFIES org='"+(orgDomain)+"'  END "
					var qryString1 = " SELECT `records`  "+
									"FROM records "+
									"WHERE ANY domain IN `orgDomain` SATISFIES domain='"+(orgDomain)+"'  END  "+
									" AND (docType='Provider' OR docType='Manufacturer' OR docType='Developer' OR docType='Supplier' OR docType='ServiceProvider' OR docType='Organization')"
					//check for org page with the found org domain
					CouchBaseUtil.executeViewInContentBucket(qryString1,{parameters:[]},function(result){
						if(result && result.length){//org found
							//Org exists, so create a user role
							orgDoc = result[0].records;
							var orgType=orgDoc.docType;
							//check for user role existance if not create new
							qryString = " SELECT `records`  FROM records WHERE `docType`='UserRole' AND `User`='"+(userDoc.recordId)+"'  AND `org`='"+(orgDoc.recordId)+"'";
							CouchBaseUtil.executeViewInContentBucket(qryString,{parameters:[]},function(result){
								if(result && result.length==0){
									//Roles not found, create a role
									CouchBaseUtil.getDocumentByIdFromDefinitionBucket("RoleMappings",function(roles){
										if(roles.value){
											var rolesDoc=roles.value;
											var roleOnOrg="";
											var userRoleDoc = {
												  "User": userDoc.recordId,
												  "orgType": orgDoc.docType,
												  "roles": [ ],
												  "dependentProperties": {
												    "org": ""
												  },
												  "recordId": "UserRole"+utility.guid(),
												  "org": "",
												  "docType": "UserRole",
												  "author": "administrator",
												  "editor": "administrator",
												  "dateCreated": global.getDate(),
												  "dateModified":global.getDate(),
												  "revision": 1,
												  "@identifier": "recordId",
												  "@derivedObjName": "UserRole-",
												  "relationDesc": [
												    "User-hasRole-org",
												    "org-hasPerson-User"
												  ],
												  "cloudPointHostId": "cloudseed",
												  "record_header": "",
												  "$status": "published"
												};
											
											switch(userRole){
												case "architect":
													roleOnOrg="RoleForArchitect";
													break;
												case "designer":
													roleOnOrg="RoleForInteriorDesigner";
													break;
												case "manufacturer":
													roleOnOrg="RoleForManufacturer";
													break;
												case "developer":
													roleOnOrg="RoleForDeveloper";
													break;
												case "supplier":
													roleOnOrg="RoleForSupplier";
													break;
												case "serviceprovider":
													roleOnOrg="RoleForServiceProvider";
													break;
											}
											userRoleDoc.roles.push((rolesDoc.mappings)[roleOnOrg][orgType]) ;
											userRoleDoc.orgType = orgType;
											userRoleDoc.org=orgDoc.recordId;
											userRoleDoc.dependentProperties.org=orgDoc.recordId;
											userRoleDoc['record_header'] = orgDomain+" - Role(s) in "+orgDoc.name;
											GenericRecordServer.saveRecord({body:userRoleDoc}, function(res){
												if(res && !res.error){
													console.log("Role created"+userRoleDoc.recordId);
												}else{
													console.log("Error while creating user role on org"+orgDoc.recordId);
												}
												sendResponse();
											});
										}else{
											console.log("error in rolemappings");
											sendResponse();
										}
									});
								}else{
									console.log("Roles exist, so send response");
									sendResponse();
								}
							});
							
						}else{
							//Org not found
							sendResponse();
						}	
					});
					
				}else{
					console.log("Code not found in db");
					callback({error:"Invalid Code | Code not found"});
				}
			});
		}else{
			console.log("Code not found");
			callback({error:"Code not found"});
		}
		
		function sendResponse(){
			callback({
				current:"activate",
				userDoc:userDoc,
				orgDoc: orgDoc,
				code:code
			});
		}
}
exports.activateAccount=activateAccount;



function joinPage(code,callback){
		var userDoc={};
		var orgDoc={};
		if(code && typeof code!=undefined && code!=null){
			//AN INDEX must be there for the below query
			//CREATE INDEX `wk_activationCode` ON `records`(`activationCode`) WHERE (`activationCode` is not missing) USING GSI
			var  qryString = " SELECT `records`  FROM records WHERE `activationCode`='"+code+"'";
			CouchBaseUtil.executeViewInContentBucket(qryString,{parameters:[]},function(result){
				if(result.length){
					console.log("User found using activation code");
					userDoc = result[0].records;
					
					var orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
					try{
						orgDomain=((userDoc.email).split("@")[1]).split(".");
						orgDomain.splice(orgDomain.length-1,1);
						orgDomain=orgDomain.join(".");
					}catch(err){
						orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
					}
					//INDEX FOR this query should exists
					//CREATE INDEX `wk_orgDomain` ON `records`(`orgDomain`) WHERE (`orgDomain` is not missing)  USING GSI
					//var qryString1 = " SELECT `records`  FROM records WHERE ANY org IN `orgDomain` SATISFIES org='"+(orgDomain)+"'  END "

					var qryString = " SELECT `records`  "+
									"FROM records "+
									"WHERE ANY domain IN `orgDomain` SATISFIES domain='"+(orgDomain)+"'  END  "+
									" AND (docType='Provider' OR docType='Manufacturer' OR docType='Developer' OR docType='Supplier' OR docType='ServiceProvider' OR docType='Organization')"
					CouchBaseUtil.executeViewInContentBucket(qryString,{parameters:[]},function(result){
						if(result && result.length){
							console.log("Org exists");
							orgDoc = result[0].records;
							console.log('org id: '+(orgDoc.recordId));
							sendResponse();
						}else{
							sendResponse();
						}
					})
					
				}else{
					console.log("Code not found in db");
					callback({error:"Invalid Code | Code not found"});
				}
			});
		}else{
			console.log("Code not found");
			callback({error:"Code not found"});
		}
		
		function sendResponse(){
			callback({
				current:"join",
				userDoc:userDoc,
				orgDoc:orgDoc,
				code:code
			});
		}

}
exports.joinPage=joinPage;


