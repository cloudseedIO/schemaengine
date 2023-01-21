var db = require('./config/dbconn.js');
var couchbase = require('couchbase');
var queries = require('./config/queries.js');
var SpatialQuery = couchbase.SpatialQuery;
var ViewQuery = couchbase.ViewQuery;
/*
var cloudinary = require('cloudinary');
configuration.clCloud_name="";
configuration.clAPI_key="";
configuration.clAPI_secret='';
cloudinary.config({ 
   cloud_name: "dzd0mlvkl",
   api_key: "672411818681184", 
   api_secret: "mqpdhFgkCTUyrdg318Var9_dH-I"
});*/
function getDate(){
	var today = new Date();
	today.setMinutes ( today.getMinutes() + (today.getTimezoneOffset()+330) );
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var hours = today.getHours();
	var minutes=today.getMinutes();
	var yyyy = today.getFullYear();
	var seconds =today.getSeconds();
	if(dd<10){dd='0'+dd;} if(mm<10){mm='0'+mm;} if(hours<10){hours='0'+hours;} if(minutes<10){minutes='0'+minutes;} if(seconds<10){seconds='0'+seconds;}
	//var date = dd + "/" + mm + "/" + yyyy;
	var date = yyyy + "/" + mm + "/" + dd;
	var time = hours + ":" + minutes + ":" + seconds;
	return date+" "+time+" GMT+0530";
}

var guid = (function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return function() {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
	};
})();
var users=[
       {
    	 "userId":"Userda51013b-4cef-2fe6-0599-ad2d65149356",
    	 "name":"Yatheendra",
    	 "status":"pending",
    	 "org":"cloudseed",
    	 "orgName":"cloudseed"
       },
       {
      	 "userId":"User7576f075-4f7b-f647-b776-bb0034ed0ecb",
      	 "name": "Naveed Mastan",
      	 "status":"pending",
      	 "org":"cloudseed",
      	 "orgName":"cloudseed"
       },
       {
      	 "userId":"User2cc75dc3-44b0-45c3-4532-a20724a73dc5",
      	 "name": "Vikram Jakkampudi",
      	 "status":"pending",
    	 "org":"cloudseed",
    	 "orgName":"cloudseed"
       }
];


function getFromSuppliersSpatialView(data,range,callback){
	/*var curr=[17.4295317,78.4126599];//Hyderabad
	var curr=[6.9218374,79.8211001];//Colombo,Srilanka
	var curr=[-33.9142626,18.0942419];//Cafe town, south africa
	var curr=[3.1385035,101.6167773];//koula lampure, malasia*/
	var curr=[data.locationNeeded.latitude*1,data.locationNeeded.longitude*1];
	var query = SpatialQuery.from('Supplier', 'getByGeo');
	query.stale(SpatialQuery.Update.NONE);
	//query.bbox([curr[1]-range,curr[0]-range,curr[1]+range,curr[0]+range]);
	query.custom({
		start_range:'['+(curr[1]-range)+','+(curr[0]-range)+']',
		end_range:'['+(curr[1]+range)+','+(curr[0]+range)+']'
	});
	db.execRecordsSpatView(query,function(res){
		var ids=[];
		if(res.error){
			console.log("Error at executing spatial view")
			console.log(res.error);
			callback(ids);
		}else{
			//console.log(res.length+" Suppliers found with range "+range);
			for(var i in res){
				ids.push(res[i].id);
			}
			//callback(ids);
			var subquery="SELECT distinct Supplier " +
					"FROM records " +
					"WHERE ProductCategory='"+data.category+"' AND docType='MfrProCatCitySupplier' AND Supplier IN ['"+ids.join("','")+"']";
			db.exec(subquery, '', function(Res){
				if(Res.error){
					callback([]);
				}else{
					var innerIds=[];
					for(var i in Res.results){
						innerIds.push(Res.results[i].Supplier);
					}
					callback(innerIds);
				}
			});
		}
	})
}
function getUsersOfOrgs(orgs,callback){
	if(!Array.isArray(orgs)){
		orgs=[];
	}
	if(orgs.length==0){
		orgs.push("cloudseed");
	}
	var query="SELECT `User` as userId, \"pending\" as status,org FROM records WHERE docType=\"UserRole\" AND `$status`=\"published\" AND org IN [\""+orgs.join('","')+"\"] ";
	db.exec(query, '', function(userRes){
		if(userRes.error || userRes.results.length==0){
			if(orgs.indexOf("cloudseed")>-1){
				callback(users);
			}else{
				getUsersOfOrgs(["cloudseed"],callback);
			}
		}else{
			callback(userRes.results);
		}
	});
}
function getConactPersons(data,callback){
	if(data.manufacturer || data.supplier){
		var orgs=[];
		if(data.manufacturer){
			orgs.push(data.manufacturer);
		}
		if(data.supplier){
			orgs.push(data.supplier);
		}
		getUsersOfOrgs(orgs,callback);
	}else if(data.spec_category){
		getUsersOfOrgs(["cloudseed"],callback);
	}else{
		var range=0.5;
		getSuppliers(range);
		
		function getSuppliers(range){
			getFromSuppliersSpatialView(data,range,function(orgsRes){
				if(orgsRes.length<10 && range<10){
					range=range+0.5;
					getSuppliers(range)
				}else{
					getUsersOfOrgs(orgsRes,callback);
				}
			});
		}
	}
}
/*getConactPersons({category: "ProductCategoryb8497d67-431a-82be-6857-183b4bd1bbd6", "locationNeeded": {
    "latitude": "17.385044",
    "locationName": "Hyderabad, Telangana, India",
    "longitude": "78.486671"
  }},function(userRes){
	console.log(userRes);
});*/

function myTopics(userId, options, callback){
	switch(options.action){
		case 'get_orgs':
			db.exec(queries["fetch_my_orgs"].makeQuery({userId:userId}, true), '', function(res){
				callback(res);
			});
			break;
		case 'get_topics':
			if(options.searchText){
				db.exec(queries["search_my_topics"].makeQuery({userId:userId,searchText:options.searchText.toLowerCase()}, false), '', function(res){
					callback(res);
				});
			}else{
				db.exec(queries["fetch_my_topics"].makeQuery({userId:userId}, false), '', function(res){
					callback(res);
				});
			}
			break;
		case 'get_all_my_notfications_count':
			db.exec(queries["fetch_all_my_notfications_count"].makeQuery({userId:userId}, false), '', function(res){
				callback(res);
			});
			break;
		case 'get_my_topics_and_chats':
			if(options.searchText){
				db.exec(queries["search_my_topics_and_chats"].makeQuery({userId:userId,searchText:options.searchText.toLowerCase()},false),'',function(res){
					callback(res);
				});
			}else{
				/*db.exec(queries["fetch_my_topics_and_chats"].makeQuery({userId:userId},false),'',function(res){
					callback(res);
				});*/
				var query = ViewQuery.from("notifications", "myTopicsAndChats").range([userId,"zzzz"],[userId,null]).order(ViewQuery.Order.DESCENDING);
				db.execView(query,function(res){
					if(res.error && !Array.isArray(res)){
						callback(res.error);
					}else{
						var temp=[];
						for(var ind in res){
							temp.push(res[ind].value);
						}
						callback({results:temp});
					}
				});
			}
			
		case 'add_topic':
			var obj=options.data;
			if(obj && obj.topic){
				getConactPersons(obj,function(usrsRes){
					if(!obj.id){
						obj.id="Topic"+guid();
					}
					obj.status = {};
					obj.counter={};
					obj.createdDate = getDate();
					obj.updatedDate = getDate();
					obj.userId = userId;  
					obj.type = 'Topic';
					obj.contacted = usrsRes;
					
					obj.status[userId] = {"type": "pending", updatedDate: getDate()};
					obj.counter[userId] ={"count": 0};
					for(var i=0;i<obj.contacted.length;i++){
						obj.status[obj.contacted[i].userId]={"type":"pending",updatedDate:getDate()};
						obj.counter[obj.contacted[i].userId] ={"count": 1};
					}
					
					db.exec(queries["add_to_topics"].makeQuery({k: obj.id, data:obj}, false), '', function(res){
						callback(obj);
					});
				});
			}
			break;
		case 'get_topic_by_id':
			db.get(options.id,function(topic){
				callback(topic);
			});
			break;
		case 'get_pending_topics':
			if(options.searchText){
				db.exec(queries["search_from_my_pending_topics"].makeQuery({userId:userId,searchText:options.searchText.toLowerCase()}, true), '', function(res){
					callback(res);
				});
			}else{
				db.exec(queries["fetch_from_my_pending_topics"].makeQuery({userId:userId}, true), '', function(res){
					callback(res);
				});
			}
		break;
		case 'get_archived_topics':
			if(options.searchText){
				db.exec(queries["search_from_my_archived_topics"].makeQuery({userId:userId,searchText:options.searchText.toLowerCase()}, true), '', function(res){
					callback(res);
				});
			}else{
				db.exec(queries["fetch_from_my_archived_topics"].makeQuery({userId:userId}, true), '', function(res){
					callback(res);
				});
			}
		break;
		case 'update_topic_status_to_archvie':
			db.exec(queries["update_topic_status_for_user"].makeQuery({id:options.id, userId:userId,  status:'archived', date:getDate()}, false), '', function(res){
				callback(res);
			});
			break;
		case 'update_topic_status_to_active':
			db.exec(queries["update_topic_status_for_user"].makeQuery({id:options.id, userId:userId,  status:'active', date:getDate()}, false), '', function(res){
				callback(res);
			});
			break;
		case 'update_topic_status_to_delete':
			db.exec(queries["update_topic_status_for_user"].makeQuery({id:options.id, userId:userId,  status:'deleted', date:getDate()}, false), '', function(res){
				callback(res);
			});
			break;

		case 'reset_topic_counter_for_user':
			db.exec(queries["reset_topic_counter_for_user"].makeQuery({id:options.id, userId:userId}, true), '', function(r){
				if(typeof callback=="function"){
					callback(r);
				}
			});
			break;
		case 'delete_user_from_topic':
			db.get(options.id,function(topic){
				if(!topic){
					if(typeof callback =="function"){
						callback({error:"noTopic found"});
					}
				}else{
					if(Array.isArray(topic.contacted)){
						topic.contacted=topic.contacted.filter(function(contacted){
							if(contacted.org==options.userDetails.org && 
									contacted.userId==options.userDetails.userId){
								return false;
							}else{
								return true;
							}
						});
					}
					delete topic.status[options.userDetails.userId];
					delete topic.counter[options.userDetails.userId];
					topic.updatedDate=getDate();
					db.update(topic.id,topic,function(res){
						if(typeof callback=="function"){
							callback(topic);
						}
					})
				}
			});
			break;
		case 'add_user_to_topic':
			db.get(options.id,function(topic){
				if(!topic){
					if(typeof callback =="function"){
						callback({error:"noTopic found"});
					}
				}else{
					if(!Array.isArray(topic.contacted)){
						topic.contacted=[];
					}
					topic.contacted=topic.contacted.filter(function(contacted){
						if(contacted.org==options.userDetails.org && 
								contacted.userId==options.userDetails.userId){
							return false;
						}else{
							return true;
						}
					});
					
					topic.contacted.push(options.userDetails);
					if(!topic.status){
						topic.status={};
					}
					if(!topic.counter){
						topic.counter={};
					}
					topic.status[options.userDetails.userId]={type:"active",updatedDate:getDate()};
					topic.counter[options.userDetails.userId]={count:1};
					topic.updatedDate=getDate();
					
					db.update(topic.id,topic,function(res){
						if(typeof callback=="function"){
							callback(topic);
						}
					})
				}
			});
			break;
		
	}
}

function topicChat(userId, topicId, options ,callback){
	switch(options.action){
		case 'get_subchats':
			var q="";
			if(options.type == 'org'){
				q = queries["fetch_from_my_org_chats"].makeQuery({id:options.belongTo, from:userId}, true);
			}else{
				q = queries["fetch_from_chats_by_topic_id"].makeQuery({id:options.belongTo, from:userId, status:'active'}, true);
			}
			db.exec(q, '', function(res){
				callback(res);
			});
			break;
		case 'get_archive_chats':
			if(options.searchText){
				db.exec(queries["search_from_my_archive_chats"].makeQuery({userId:userId,searchText:options.searchText.toLowerCase()}, true), '', function(res){
					callback(res);
				});
			}else{
				db.exec(queries["fetch_from_my_archive_chats"].makeQuery({userId:userId}, true), '', function(res){
					callback(res);
				});
			}
			break;
		case 'get_chat_by_user_topic':
			db.exec(queries["fetch_chat_by_topic_user_org"].makeQuery({from:userId, id:topicId,org:options.org}, true), '', function(res){
				callback(res);
			});
			break;
		case 'get_chat_by_id':
			db.get(options.id,function(chat){
				callback(chat);
			});
			break;
		case 'insert':
			db.exec(queries["fetch_topic_by_id"].makeQuery({id:topicId}, true), '', function(data){
				if(data.results.length==0) callback({error:"Topic doesn't exist"});
				var topic = data.results[0];
				
				db.exec(queries["fetch_chat_by_topic_user_org"].makeQuery({from:userId, id:topic.id,org:options.org}, true), '', function(r){
					if(r.results.length==0){ // if new chat	//new converstation
						var userInfo={};
						if(Array(topic.contacted)){
							for(var i=0;i<topic.contacted.length;i++){
								if(topic.contacted[i].userId==userId){
									userInfo=topic.contacted[i];
								}
							}
						}
						var data = {
							  "chat": [{"chatFrom": userId,"date": getDate(), "message": options.message.trim()}],
							  "chatFrom": userId,
							  "chatTo": topic.userId,
							  "createdDate": getDate(),
							  "updatedDate": getDate(),
							  "topicId": topic.id,
							  "chatFromUserInfo":userInfo,
							  "org": options.org,
							  "topic":topic.topic,
							  "status": {},
							  "counter":{},
							  "type": "PersonalChat"
						};
						data.id="PersonalChat"+guid();
						data.status[userId] = {"type": "active", updatedDate: getDate()};
						data.status[topic.userId] = {"type": "active", updatedDate: getDate()};
						data.counter[userId] ={"count": 0};
						data.counter[topic.userId]={"count": 1};
						  
						db.exec(queries["new_chat"].makeQuery({data:data,k:data.id}, true), '', function(res){
							callback(data);
						});
					}else{
						var data = {"chatFrom": userId,"date": getDate(), "message": typeof options.message=="string"?options.message.trim():options.message};
						db.exec(queries["add_to_chat"].makeQuery({data:data, from:userId, id:topic.id,org:options.org,date:getDate()}, true), '', function(res){
							//callback({topic:topic});
							try{
								var chat=res.results[0].messages;
								var receiver=chat.chatFrom==userId?chat.chatTo:chat.chatFrom;
								db.exec(queries["update_chat_counter_for_user"].makeQuery({id:chat.id, userId:receiver,date:getDate()}, true), '', function(res){
									chat.counter[receiver].count=chat.counter[receiver].count*1+1;
									callback(chat);	
								});
								
							}catch(err){
								callback({error:"Error getting chat"});
							}
						});
						
					}
				
					db.exec(queries["update_topic_status_for_user_in_contacted"].makeQuery({id:topic.id, userId:userId, status:'responded',org:options.org,date:getDate()}, true), '', function(res){
						//console.log(res);
					});
					db.exec(queries["update_topic_status_for_user"].makeQuery({id:topic.id, userId:userId, status:'active',date:getDate()}, true), '', function(res){});
					db.exec(queries["update_topic_status_for_user"].makeQuery({id:topic.id, userId:topic.userId, status:'active',date:getDate()}, true), '', function(res){});
				});
			});
		  break;
		case 'switch_chat_to_user':
			db.exec(queries["switch_chat_to_user"].makeQuery({id:options.id,userId:userId,newUserId:newUserId,date:getDate()}, true), '', function(res){
				callback(res);
			});
			break;
		case 'reset_chat_counter_for_user':
			db.exec(queries["reset_chat_counter_for_user"].makeQuery({id:options.id, userId:userId}, true), '', function(r){
				if(typeof callback=="function"){
					callback(r);
				}
			});
			break;
		case 'update_chat_status_to_archvie':
			db.exec(queries["update_chat_status_for_user"].makeQuery({id:options.id, userId:userId,  status:'archived', date:getDate()}, false), '', function(res){
				callback(res);
			});
			break;
		case 'update_chat_status_to_active':
			db.exec(queries["update_chat_status_for_user"].makeQuery({id:options.id, userId:userId,  status:'active', date:getDate()}, false), '', function(res){
				callback(res);
			});
			break;
		case 'update_chat_status_to_delete':
			db.exec(queries["update_chat_status_for_user"].makeQuery({id:topicId, userId:userId,  status:'deleted', date:getDate()}, false), '', function(res){
				callback(res);
			});
			break;
		case 'my_chat_notifications':
			db.exec(queries["fetch_my_chat_notifications"].makeQuery({userId:userId}, true), '', function(res){
				callback(res);
			});
			break;
		case 'update_chat_counter_for_user':
			db.exec(queries["update_chat_counter_for_user"].makeQuery({id:topicId, userId:userId,date:getDate()}, true), '', function(res){
				callback(res);
			});
			break;
	}
}


function recordsInfo(type,recordId,callback){
	switch(type){
		case 'user':
			db.exec(queries.fetch_from_users.makeQuery({recordId:recordId}, false), '', function(res){
				if(Array.isArray(res.results) && res.results.length>0){
					callback(res.results[0]);
				}else{
					callback({});
				}
			});
			break;
		case 'org':
			db.exec(queries.fetch_from_orgs.makeQuery({recordId:recordId}, false), '', function(res){
				if(Array.isArray(res.results) && res.results.length>0){
					callback(res.results[0]);
				}else{
					callback({});
				}
			});
			break;
		case 'product':
			db.exec(queries.fetch_from_products.makeQuery({recordId:recordId}, false), '', function(res){
				if(Array.isArray(res.results) && res.results.length>0){
					callback(res.results[0]);
				}else{
					callback({});
				}
			});
			break;
		case "spec_item":
			db.exec(queries.fetch_from_specItems.makeQuery({recordId:recordId}, false), '', function(res){
				if(Array.isArray(res.results) && res.results.length>0){
					callback(res.results[0]);
				}else{
					callback({});
				}
			});
			break;
	}
}

exports.topicChat=topicChat;
exports.myTopics=myTopics;
exports.recordsInfo=recordsInfo;