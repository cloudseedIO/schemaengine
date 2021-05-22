//process.env.NODE_ENV = 'production';
process.env.NODE_ENV = 'development';
var configuration={};
var fs = require('fs');
configuration.cloudPointDocId="CloudPointConfig";

configuration.API_Deploy_Protocol="https";
configuration.API_Deploy_Port=9500;

configuration.Front_End_Deploy_Protocol="https";
configuration.Front_End_Deploy_Port=443;

configuration.Chat_Deploy_Protocol="https";
configuration.Chat_Deploy_Port=3000;

configuration.Box_API_Deploy_Protocol="https";
configuration.Box_API_Deploy_Port=8081;

configuration.boxAPILocalAddress="https://localhost:8081";
configuration.boxAPIAddress="https://localhost:8081";

configuration.clientVersion="";
configuration.API_whitelist_domains=[
	'https://localhost',
	'https://wishkarma.com',
	'https://www.wishkarma.com',
	'https://qa.wishkarma.com',
	'http://localhost', 
	'http://wishkarma.com',
	'http://www.wishkarma.com',
	'http://qa.wishkarma.com'
];
configuration.overrideConfig={
	/*"box_api": {
	  "client_domain": "https://wishkarma.com:8081"//"https://www.wishkarma.com:8081"
	},
	"chat_api": {
	  "client_domain": "https://wishkarma.com:3000"
	},
	"app_api": {
	  "client_domain": "https://localhost:9500"
	},*/
	"htmlToInclude":""
}

configuration.cbUsername="Administrator";
configuration.cbPassword="password";

//configuration.cbAddress="ec2-35-154-234-150.ap-south-1.compute.amazonaws.com";
configuration.cbAddress="63.142.252.3";

//configuration.esAddress="13.127.67.38";
configuration.esAddress="63.142.252.3";



//configuration.esIndex="wk_prod_new";
configuration.esIndex="search_index";
configuration.esSummaryIndex="summary_index";

configuration.esPort="9200";
configuration.cbContentBucket ='records';
configuration.cbMasterBucket ='schemas';
configuration.cbDefinitionBucket="definitions";
configuration.cbKeywordBucket="keywords";
configuration.cbAuditBucket="audit";
configuration.cbSitemapsBucket="sitemaps";
configuration.cbMessagesBucket="messages";
configuration.cbPort=8091;
configuration.cbViewPort=8092;



/*Message Service Configuration*/
configuration.exotelSId="wishkarma";
configuration.exotelToken="d6f8af803c812189f326c7fd2d4ac45d57d9e6aa";
/*
configuration.sslOptions={
		  key: fs.readFileSync('../config/cloudseed/csserver.key'),
		  passphrase:"cloudseed",
		  ca:[fs.readFileSync('../config/cloudseed/AddTrustExternalCARoot.crt'),fs.readFileSync('../config/cloudseed/COMODORSAAddTrustCA.crt'),fs.readFileSync('../config/cloudseed/COMODORSADomainValidationSecureServerCA.crt')],
		  cert: fs.readFileSync('../config/cloudseed/www_cloudseed_io.crt')
}

*/
/*configuration.sslOptions={
		  key: fs.readFileSync('../config/wishkarma/wkserver.key'),
		  passphrase:"cloudseed",
		  ca:[fs.readFileSync('../config/wishkarma/AddTrustExternalCARoot.crt'),fs.readFileSync('../config/wishkarma/COMODORSAAddTrustCA.crt'),fs.readFileSync('../config/wishkarma/COMODORSADomainValidationSecureServerCA.crt')],
		  cert: fs.readFileSync('../config/wishkarma/www_wishkarma_com.crt')
}*/
configuration.sslOptions={
		  key: fs.readFileSync('../config/wishkarma/wishkarma.key'),
		  passphrase:"wishkarma",
		  ca:[fs.readFileSync('../config/wishkarma/www.wishkarma.com.ca-bundle'),fs.readFileSync('../config/wishkarma/www.wishkarma.com.p7b')],
		  cert: fs.readFileSync('../config/wishkarma/www.wishkarma.com.crt')
}
configuration.apnsOptions = {
   key: fs.readFileSync("../config/apns/applePushNotificationServiceKeyNoEnc.pem"),
   cert : fs.readFileSync("../config/apns/applePushNotificationService.pem"),
   ca:[fs.readFileSync("../config/apns/entrust_2048_ca.cer")],
   debug : true,
   gateway:"gateway.push.apple.com",
   port:2195,
   production:true,
   errorCallback:function(){
     console.log("Error occured while processing request");
   }
};
 

/*Cloudinary configurations*/
//to be moved to database
configuration.clCloud_name="dzd0mlvkl";
configuration.clAPI_key="672411818681184";
configuration.clAPI_secret='mqpdhFgkCTUyrdg318Var9_dH-I';

/* Mailgun Configurations*/
configuration.mailgunApiKey="key-3e7b06e3d1e27eefb1bdcce7713dccce";
configuration.mailgunDomain="mg.wishkarma.com";
configuration.mailgunMailList="developer@mg.cloudseed.io";

/*Loggly Configurations*/
//cloudseed:17f27ece-7143-4c11-b370-0feba1e48ee2
configuration.loggly_token="43611d24-7880-4b19-a215-05aed6ee09b7";
configuration.loggly_subdomain="wishkarma";
exports.init=configuration;
