/**
 * @author Vikram
 * creation Date 10-10-2018
 */

var config=require('../config/ReactConfig');
config=config.init;
var logger 				= require('./services/logseed').logseed;
var GenericServer	=	require('./controllers/GenericServer.js');
var utility				=	require('./controllers/utility.js');

var hostsAndConfigIds={};//holds all host ids and config ids
var configDetails = {};//Holds all configs with hostname
var unLoggedSessionObject={};//holds all cloudpoints unlogged session objects by hostname
var allSchemasStructsDependentSchemas={};//holds all schemas of all sites by hostname

//Get Config details by hostname
function getConfigDetails(hostname){
	return configDetails[hostname];
}
exports.getConfigDetails=getConfigDetails;
//Get Config details by hostid
function getConfigByHostId(hostId){
	var config={};
	for(var hostname in configDetails){
		if(configDetails[hostname].cloudPointHostId==hostId){
			config=configDetails[hostname];
		}
	}
	return config;
}
exports.getConfigByHostId=getConfigByHostId;




//gets Hosts and config ids file (hostsAndConfigIds)
function getHostsAndConfigIds(callback){
	utility.getDefinition("hostsAndConfigIds",function(response){
		hostsAndConfigIds=response;
		if(typeof callback=="function"){
			callback();
		}
	});
}
exports.getHostsAndConfigIds=getHostsAndConfigIds;



setTimeout(function(){
	//Processing all hostnames in hosts and config files
	getHostsAndConfigIds(function(){
		var allHosts=[];
		for(var key in hostsAndConfigIds){
			if(key!="recordId"){allHosts.push(key);}
		}
		iterate(0);
		function iterate(index){
			getCloudPointConfig(allHosts[index],function(){
				index++;
				if(index<allHosts.length){
					iterate(index);
				}else{
					console.log("Got All configs")
				}
			});
		}
	});
},1000);






//Every cloudpoint is associated with a public role 
//the navigation and access roles for un logged users will be in this object with key as hostname
function getUnLoggedSessionObject(hostname){
	return unLoggedSessionObject[hostname];
}
exports.getUnLoggedSessionObject=getUnLoggedSessionObject;



function prepareUnloggedUserSessionObject(hostname,callback){
	unLoggedSessionObject[hostname]={
			userData:{},
			navLinks:{},
			privileges:{},
			orgAndRoles:{}
		};
	console.log("getting navigation links for host "+hostname);
	GenericServer.getNavigationLinks({"userId":"CommonUser","hostname":hostname},function(navlinks){
		unLoggedSessionObject[hostname].navLinks=navlinks.navigation;
		unLoggedSessionObject[hostname].orgAndRoles=navlinks.orgs;
		unLoggedSessionObject[hostname].privileges=navlinks.roles
		console.log("got navigation  for host "+hostname);
		
		for(var key in hostsAndConfigIds){
			if(key!=hostname && hostsAndConfigIds[key]==hostsAndConfigIds[hostname]){
				unLoggedSessionObject[key]=unLoggedSessionObject[hostname];
			}
		}
		
		if(typeof callback=="function"){
			callback();
		}
	});
}
exports.prepareUnloggedUserSessionObject=prepareUnloggedUserSessionObject;





/*
 * gets cloudpoint config document 
 * all schemas and structs
 * process the default landing page
 * mobile landing page for mobile app
 * footer doc id
 */
function getCloudPointConfig(hostname,callback,forceUpdate){
	if(typeof configDetails[hostname]=="undefined" || typeof forceUpdate=="string"){
		console.log("Processing  "+hostname);
		console.log("getting cloud point config "+hostsAndConfigIds[hostname]);
		var pr=new Date();
		 
		utility.getDefinition(hostsAndConfigIds[hostname],function(response){
			console.log("got config "+((new Date()-pr)/1000));
			console.log("got cloud point config "+hostsAndConfigIds[hostname]);
			//if the environment is dev we can skip some config keys with react/ReactConfig   keys
			if(typeof config.overrideConfig == "object"){
				for(var key in config.overrideConfig){
					response[key]=config.overrideConfig[key];
				}
			}
			
			configDetails[hostname]=response;
			//if multiple hostnames are having same config id the adding to configDetails object
			for(var key in hostsAndConfigIds){
				if(key!=hostname && hostsAndConfigIds[key]==hostsAndConfigIds[hostname]){
					configDetails[key]=response;
				}
			}
			
			var cloudPointHostId=configDetails[hostname].cloudPointHostId?configDetails[hostname].cloudPointHostId:"cloudseed";
			
			console.log('getting all schemas and structs');
			var pre=new Date();
			utility.getAllSchemasStructsDependentSchemas(cloudPointHostId,function(data){
				console.log("got schemas for "+cloudPointHostId+" in "+((new Date()-pre)/1000));
					var schemasandds={};
					if(Array.isArray(data)){
						data.forEach(function(rec){
							schemasandds[rec.id]=rec.value;
						});
					}
					allSchemasStructsDependentSchemas[hostname]=schemasandds;
					//if multiple hostnames are having same config id the adding to configDetails object
					for(var key in hostsAndConfigIds){
						if(key!=hostname && hostsAndConfigIds[key]==hostsAndConfigIds[hostname]){
							allSchemasStructsDependentSchemas[key]=schemasandds;
						}
					}
					//processing unlogged user role
					prepareUnloggedUserSessionObject(hostname,function(){
						console.log("done processing "+ hostname);
						if(typeof callback=="function"){
							callback();
						}
					});
			});
		});
	}else{
		if(typeof callback=="function"){
			callback();
		}
	}
}
exports.getCloudPointConfig=getCloudPointConfig;


function getBootData(request,response){
	var hostname=request.headers.host.split(":")[0];
	response.contentType("application/json");
	response.send({
		configDetails:configDetails[hostname],
		schemaState:allSchemasStructsDependentSchemas[hostname],
		unLoggedSessionObject:unLoggedSessionObject[hostname]
	});
}
exports.getBootData=getBootData;

