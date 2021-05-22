var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress);
var N1qlQuery = couchbase.N1qlQuery;
var cbContentBucket=cluster.openBucket(config.cbContentBucket);

var requiredFormat={
		"clientID":"",
		"clientSecret": "",
		"appAuth": {
			"keyID":"",
		    "publicKeyID": "",
		    "privateKey": "",
		    "passphrase": ""
		},
		"businessId": ""
};
var dbFormate={
		box_com_data:{
			enterpriseId: '34660778',
			settings: ''+
				'{\n'+
				'	"boxAppSettings": {\n'+
				'		"clientID": "d6r7s873xyf8z80rfeou3mlnk6fzekud",\n '+
				'		"clientSecret": "rqkje1p0kCQF4cmwHdVo2tfmTfBK4L12",\n '+
				'		"appAuth": {\n      '+
				'			"publicKeyID": "r5ba2ln4",\n '+
				'			"privateKey": "-----BEGIN ENCRYPTED PRIVATE KEY-----\\nMIIFDjBABgkqhkiG9w0BBQ0wMzAbBgkqhkiG9w0BBQwwDgQIW/zWt/aaqJkCAggA\\nMBQGCCqGSIb3DQMHBAjYtbbDrG1nWQSCBMitN3C1vx1sqZE2e9XdDbT8uj9QmrRP\\nV6rS2LWcAQQrTOQzrydtG9f/mDd/A2xhZoy738b+wR96E8vI3H3YLRVKLDP73f7y\\nezXhKyGxXjovPE+MGQlUPlaSm0tl2tip+CJCR6GGQmczSJAse3wplQ+pJnM1TNWP\\n5UjgZfSyUw+RRyNQ06voJtBVo7xuT6QnDzCrl1DtC8UYWGiMT/jYXpHx6GeIm6LU\\n2fk65L80XjRB8sKeOyqrmWDhsFgWDvqMCHdIQP3XXvzs9ekBlg+ASIg5JA3aFprI\\nMQDG8EjcCwHqGx5NKzsp973aeH/A+mMAj2LM03TMGTloyUgLoJl5qaAjTKENC4Qz\\n59oUT3UrTJzyoICfigAaOptkKZLMAUwkiTnLgB7Nku7Z6lyjSkMk90qtx3e9lvIT\\n1pwdcHPZ90EV/hY1XQZLXA9pN+/JCmlj/bQ+ar2jHeP4W6UOG8N4FGxseREKhlWn\\nd8IzXGDnKts8fPzkUjhAg9D2L1u+VHbyVj15mi47VjUghjQN4XyJmZlMRNS7yU3t\\n3qeFLBXaHNsA1eZsraC2bHSKIYX8wffm30lIWmvg6YKf9RTmYRC49SeQ8qA8seB+\\nkoCvebaGC3Emb0YNayX/mfo1plU/mWdEdUFS04CLcJCLWOpMlzYc6r0OPOepbLzk\\nh2UVnBwZYFjhTmaU7pdFxjN+yXDN/GqBjvN7RXpOzssMWdT/nZyDFUE2/XwMmSz8\\nYpX3kwFeBd9pbVM7+2x9AvkG58UsmtXB5HRhdJamEiU1kliFO5T0FrDbDnosy45W\\nN5i8uiHOmOCgFW3EXwBhZ5o2+mjElhxrkt/VDEx++58j3y0jgW93jhUBpW0vJOTJ\\nFu7MPjtc7xbebQluAK4LIlaSKl6DxmiHQ6IBvqIT2nyWT18DR6x8igT5StnA5n5j\\nnJ6fT8VBCZVbi2MZU7mVx5ZOJyd+cDHpx4VayOE6L3pkAzmE3pDddVl56fP0IIz3\\nltmBiQwLwjTvE2CGWa1kaUj2QykMYMRH52odkFDP70EKuTheCNgNFtzz0dqPMuEE\\n2xtzHukkfT6IpRB6KhZx+pf7f0z5K1h8D2wnu2tG26cxcsfK7wZt1Se8/qy9J9jx\\nt+VnISMZwzQrG30p7MtJFvIldRh+Bk01LskWulu9ATCTDjmO3w5dfJSuCyht0QdA\\nNPGptKhKE87r5OoanYocbUDOJKVv3oAPSl+LDWv1HY+BxaYCfwwGkV7H7mDwc4T8\\nj8wKaZWNfWkOO29Xpq02cRtkYZEThBiiCR1T7ti57wl7nFbFSVTSqgzSAOWjU8tx\\n56Os5Wn+kTZLNM59pvD6cS0KtULKMEOp1N24nL8RCXUQar2GpjXMn55juJq1IA4R\\nSxtMUBMf2yvurEF4+NYpm2wc6MI2doHxB/PQX4FksDrOehj+n8dvnnHoFO7u6ac/\\nOOlkD6w06CBOP5wa6OkAqqNrnsfqxrYxvVIoozg1iVluAItF3V35aWp0zvFBgY/X\\n717tIt8CzjuFqycOfiw+c8G/I5sdxKYoWUaEqBaqF5s8xi8/IcmmZE5MYNwqprJj\\nHQ02R5b3h6s6cQxZUKXzyQr7x8frv1nwm1lOmDtuQQU5jJ1pQNoDQO402v3bTJwd\\nBIw=\\n-----END ENCRYPTED PRIVATE KEY-----\\n"'+
				'			"passphrase": "07e4da4513aeb69babfa3dec90daca50"\n'+
				'		}\n'+
				'	},\n '+
				'	"enterpriseID": "34660778"\n'+
				'}}',

			userId: '2953690826'
		}
}
function getConfig(enterpriseId,callback){
	var query=N1qlQuery.fromString('select box_com_data from records where docType="Provider" and box_com_data.enterpriseId=$1');
	query.adhoc = false;
	cbContentBucket.query(query,[enterpriseId],function(err, results) {
		var config={};
		if(Array.isArray(results) && results.length>0 && typeof results[0] =="object" && results[0] != null && results[0].box_com_data){
			var temp=results[0].box_com_data;
			if(temp.settings){
				try{
					var settings=JSON.parse(temp.settings);
					config=settings.boxAppSettings;
					config.appAuth.keyID=config.appAuth.publicKeyID;
					config.businessId=settings.enterpriseID;
				}catch(err){
					config={error:"No proper config details found",details:err};
				}
			}else{
				config={
					"clientID":temp.clientID,
					"clientSecret": temp.clientSecret,
					"appAuth": {
						"keyID":temp.publicKeyID,
					    "publicKeyID": temp.publicKeyID,
					    "privateKey": temp.privateKey,
					    "passphrase": temp.passphrase
					},
					"businessId": temp.enterpriseId
				};
			}



		}else{
			config={error:"No config details found"};
		}
		if(typeof callback=="function"){
			callback(config);
		}
	});
}
exports.getConfig=getConfig;
/*getConfig("34660778",function(data){
	console.log(data);
})
getConfig("32490063",function(data){
	console.log(data);
})
getConfig("random",function(data){
	console.log(data);
})*/

