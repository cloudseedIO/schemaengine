var config=require('../../config/ReactConfig');
config=config.init;
var winston = require('winston');
require('winston-loggly-bulk');
var logseed = {}; 
winston.add(winston.transports.Loggly, {
    token: config.loggly_token,
    subdomain: config.loggly_subdomain,
    tags: ["Winston-NodeJS"],
    json:true
});
logseed.info = function (msg){
	winstonLog("info",msg);
}
logseed.warn = function (msg){
	winstonLog('warn',msg);
}
logseed.error = function (msg){
	winstonLog('error',msg);
}
logseed.debug = function (msg){
	winstonLog('debug',msg);
}
//UserId|Username must be included in the name
function winstonLog(level,msg){
	if(typeof msg=="string"){
		msg={message:msg};	
	}
	if(process.env.NODE_ENV=="development"){
		console.log(level.toUpperCase()+":"+JSON.stringify(msg));
	}else{
		winston.log(level.toLowerCase(),msg);
	} 
}
exports.logseed = logseed;
/*
process.env.LOGGLY_TOKEN=config.loggly_token;
process.env.LOGGLY_SUBDOMAIN=config.loggly_subdomain;
var log = require('logglyfy');
var logseed = {};
logseed.info = function(msg, json){
	log.info(msg, {"timestamp":new Date().toISOString(), "json":json, "message":msg});
}
logseed.warn = function(msg, json){
	log.warn(msg, {"timestamp":new Date().toISOString(), "json":json,"message":msg});
}
logseed.error = function(msg, json){
	log.error(msg, {"timestamp":new Date().toISOString(), "json":json,"message":msg});
}
exports.logseed = logseed;
*/
