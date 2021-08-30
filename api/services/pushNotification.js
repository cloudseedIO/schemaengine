var apn = require('apn');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var options =config.apnsOptions;
var apnConnection;
function init(){
	if(typeof apnConnection=="undefined"){
		apnConnection = new apn.Connection(options);
	}
}
function send(deviceToken,data){
	init();
	var device=new apn.Device(deviceToken);
	var note = new apn.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = 1;
	note.sound = "ping.aiff";
	note.alert = (data && data.alert)?data.alert:"You have a new alert";
	note.payload = (data && data.payload)?data.payload:{"key": "value"};
	apnConnection.pushNotification(note, device);
}
exports.send=send;
function shutdown(){
	apnConnection.shutdown();
}
exports.shutdown=shutdown;
//send("ca6a083cf3400029f46f04fe92a538ee60431006b818c79edd5a425c7738fb55"); // 5s
//send("b4dd08d51bb7e44ae020b2b0cd91ef8881438f0432c850493d622f0a90e20ed5"); // 4s 
