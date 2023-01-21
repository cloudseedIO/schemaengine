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
	'https://xxx.com',
	'https://www.xxx.com',
	'https://qa.xxx.com',
	'http://localhost', 
	'http://xxx.com',
	'http://www.xxx.com',
	'http://qa.xxx.com'
];
configuration.overrideConfig={
	/*"box_api": {
	  "client_domain": "https://xxx.com:8081"//"https://www.xxx.com:8081"
	},
	"chat_api": {
	  "client_domain": "https://xxx.com:3000"
	},
	"app_api": {
	  "client_domain": "https://localhost:9500"
	},*/
	"htmlToInclude":""
}

configuration.cbUsername="Administrator";
configuration.cbPassword="XXX";

configuration.cbAddress="127.0.0.1";

configuration.esAddress="127.0.0.1";



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
configuration.sessionsBucket="sessions";
configuration.cbPort=8091;
configuration.cbViewPort=8092;



/*Message Service Configuration*/
configuration.exotelSId="xxxx";
configuration.exotelToken="xx";

configuration.sslOptions={
		  key: fs.readFileSync('../config/xx/xx.key'),
		  passphrase:"xx",
		  ca:[fs.readFileSync('../config/xxx/www.xxx.com.ca-bundle'),fs.readFileSync('../config/xxx/www.xxx.com.p7b')],
		  cert: fs.readFileSync('../config/xxx/www.xxx.com.crt')
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
configuration.clCloud_name="XXX";
configuration.clAPI_key="XXXX";
configuration.clAPI_secret='XXXXX';

/* Mailgun Configurations*/
configuration.mailgunApiKey="XXXXX";
configuration.mailgunDomain="XXXX";
configuration.mailgunMailList="XXXXXX";

/*Loggly Configurations*/
//schemaengine:17f27ece-7143-4c11-b370-0feba1e48ee2
configuration.loggly_token="XXXXXXX";
configuration.loggly_subdomain="XXXX";
exports.init=configuration;
