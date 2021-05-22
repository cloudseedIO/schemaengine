
var config=require('../config/ReactConfig');
config=config.init;

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');

var controller = require('./controller.js');
var myTopics=controller.myTopics;
var topicChat=controller.topicChat;
var recordsInfo=controller.recordsInfo;

var server;

if(config.Chat_Deploy_Protocol  && config.Chat_Deploy_Protocol=="http"){
	server = require('http').createServer(app);
}else{
	var https = require('https');
	server = https.createServer(config.sslOptions, app);
}

var io = require('socket.io')(server)//.listen(server,{ log: false });
var port =config.Chat_Deploy_Port || 3000;

app.use(express.static(__dirname + '/public'));
/*server.listen(port, function () {
  console.log('Server listening at port %d', port);
});*/
server.listen(port,function(){
	  var host = server.address().address
	  var port = server.address().port
	  console.log("REST app listening at https://%s:%s", host, port);
});

// routing
app.get('/chat', function (req, res) {
  res.sendFile(__dirname + '/chat.html');
});


app.get('/chat2', function (req, res) {
  res.sendFile(__dirname + '/chat2.html');
});

app.get('/org', function (req, res) {
  res.sendFile(__dirname + '/org.html');
});




io.sockets.on('connect', function(client) {
    //console.log(client.id + " is connected ");
});

io.sockets.on('connection', function (socket){
	//console.log(socket.id+"    connected");
	socket.on('adduser', function(userId){
		//console.log(socket.id+" updated with its userId "+ userId);
		socket.userId = userId;
		socket.join(userId);
		io.sockets.emit('user_status', userId,"connected");
	});
	socket.on('update_my_topics',function(userId,searchText){
		myTopics(userId, {action:'get_topics',searchText:searchText}, function(data){ //update topic list
			socket.emit('update_my_topics', data);
		});
	});
	socket.on('get_my_topics_and_chats',function(userId,searchText){
		myTopics(userId,{action:"get_my_topics_and_chats",searchText:searchText},function(data){
			socket.emit('update_my_topics_and_chats',data);
		});
	});
	socket.on('get_user_details',function(recordId){
		recordsInfo("user",recordId, function(data){
			data.id=recordId;
			socket.emit('update_user_details', data);
		});
	});

	socket.on('get_org_details',function(recordId){
		recordsInfo("org",recordId, function(data){
			data.id=recordId;
			socket.emit('update_org_details', data);
		});
	});
	socket.on('get_product_details',function(recordId){
		recordsInfo("product",recordId, function(data){
			data.id=recordId;
			socket.emit('update_product_details', data);
		});
	});
	socket.on('get_spec_item_details',function(recordId){
		recordsInfo("spec_item",recordId, function(data){
			data.id=recordId;
			socket.emit('update_spec_item_details', data);
		});
	});
	
	socket.on('message_to_members', function(userId,obj){
		myTopics(userId, {action:'add_topic', data:obj}, function(createdTopic){ //add topic
			var _usrs=createdTopic.contacted;
			socket.emit("new_topic",createdTopic);
			for(var x in _usrs){
				io.sockets.in(_usrs[x].userId).emit("new_topic",createdTopic);
			}
		});
	});

	
	socket.on('switchToTopic', function(userId,topicId){
		
		//socket.leave(socket.currentTopic);
		//socket.join(topicId);
		//socket.currentTopic = topicId;
		
		myTopics(userId, {action:'get_topic_by_id',id:topicId}, function(res){
			if(res.error){
				return;
			}
			myTopics(userId,{action:"reset_topic_counter_for_user",id:topicId},function(){});
			socket.emit('update_topic_details',res,topicId,userId);
		});
	});

	
	socket.on('get_topic_details', function(userId,topicId){		
		myTopics(userId, {action:'get_topic_by_id',id:topicId}, function(res){
			if(res.error){
				return;
			}
			socket.emit('update_topic_details',res,topicId,userId);
		});
	});
	
	
	socket.on('get_pending_topics', function(userId,searchText){
		myTopics(userId, {action:'get_pending_topics',searchText:searchText}, function(res){
			 socket.emit('get_pending_topics', res);
		});
	});
	

	socket.on('get_archived_topics', function(userId,searchText){
		myTopics(userId, {action:'get_archived_topics',searchText:searchText}, function(res){
			 socket.emit('get_archived_topics', res);
		});
	});
	
	socket.on('get_orgs', function(userId){
		myTopics(userId, {action:'get_orgs'}, function(res){
			 socket.emit('get_orgs', res);
		});
	});
	

	socket.on('archiveTopic', function(userId,id){//topic, subtopic
		myTopics(userId,{action:'update_topic_status_to_archvie',id:id}, function(res){
			 socket.emit('update_topic_archive', id,userId);
		});
	});
	
	socket.on('unArchiveTopic', function(userId,id){//topic, subtopic
		myTopics(userId,{action:'update_topic_status_to_active',id:id}, function(res){
			 socket.emit('update_topic_un_archive', id,userId);
		});
	});
	
	socket.on('deleteTopic', function(userId,id){//topic, subtopic
		myTopics(userId,{action:'update_topic_status_to_delete', id:id}, function(res){
			 socket.emit('update_topic_delete', id,userId);
		});
	});

	socket.on('reset_topic_counter', function(userId,id){
		myTopics(userId,{action:'reset_topic_counter_for_user',id:id}, function(res){
			 socket.emit('reset_topic_counter', id,userId);
		});
	});

	
	
	socket.on("deleteUserFromTopic",function(userId,id,userDetails){
		myTopics(userId,{action:'delete_user_from_topic',id:id,userDetails:userDetails}, function(res){
			socket.emit('update_topic_details',res,id,userId);
			io.sockets.in(userDetails.userId).emit('update_topic_delete', id,userId);
		});
	});
	socket.on("addUserToTopic",function(userId,id,userDetails){
		myTopics(userId,{action:'add_user_to_topic',id:id,userDetails:userDetails}, function(res){
			socket.emit('update_topic_details',res,id,userId);
			io.sockets.in(userDetails.userId).emit("new_topic",res);
		});
	});
	
	
	socket.on('get_subchats', function(userId,belongTo, type){
		topicChat(userId,{}, {action:'get_subchats', belongTo:belongTo, type:type}, function(res){
			socket.emit('get_subchats',res, belongTo, type);
		});
	});
	
	
	socket.on('sendchat', function (userId, msg, currentTopicId, chatTo,org){
		topicChat(userId, currentTopicId, {action:'insert',message:msg, belongTo: chatTo,org:org}, function(chat){
			if(chat.error){
				return;
			}
			//socket.leave(socket.currentTopic);
			//socket.join(chat.id);
			//socket.currentTopic = chat.id;
			
			socket.emit("new_chat",chat,userId);
			if(chat.chatFrom==userId){
				io.sockets.in(chat.chatTo).emit("new_chat",chat,userId);
			}else if(chat.chatTo==userId){
				io.sockets.in(chat.chatFrom).emit("new_chat",chat,userId);
			}
		});
	}); 
	
	


	socket.on('switchToChat', function(userId,id,isNewRoom){
		topicChat(userId,undefined,{action:'get_chat_by_id',id:id}, function(chat){
			
			//socket.leave(socket.currentTopic);
			//socket.join(chat.topicId);
			//socket.currentTopic = chat.topicId;
			
			topicChat(userId,chat.topicId,{action:"reset_chat_counter_for_user",id:chat.id},function(){});
			socket.emit('update_chat_details', chat);
		});
	});
	
	socket.on("switchChatToUser",function(userId,id,newUserId){
		topicChat(userId,undefined,{action:"switch_chat_to_user",id:id,newUserId:newUserId},function(res){
			socket.emit("switchChatToUser",userId,id,newUserId);
		});
	});

	socket.on('archiveChat', function(userId,id){//topic, subtopic
		topicChat(userId, undefined,{action:'update_chat_status_to_archvie',id:id}, function(res){
			 socket.emit('update_chat_archive', id,userId);
		});
	});

	socket.on('unArchiveChat', function(userId,id){//topic, subtopic
		topicChat(userId, undefined,{action:'update_chat_status_to_active',id:id}, function(res){
			 socket.emit('update_chat_un_archive', id,userId);
		});
	});
	socket.on('reset_chat_counter', function(userId,id){//topic, subtopic
		topicChat(userId, undefined,{action:'reset_chat_counter_for_user',id:id}, function(res){
			 socket.emit('reset_chat_counter', id,userId);
		});
	});
	
	socket.on('deleteChat', function(userId,id){//topic, subtopic
		topicChat(userId, undefined,{action:'update_chat_status_to_delete', id:id}, function(res){
			 socket.emit('update_chat_delete', id,userId);
		});
	});
	
	socket.on('get_archived_chats', function(userId,searchText){
		topicChat(userId,undefined,{action:'get_archive_chats',searchText:searchText}, function(res){
			 socket.emit('get_archived_chats', res);
		});
	});

	socket.on('get_my_chat_notifications', function(userId){
		topicChat(userId,undefined,{action:'my_chat_notifications'},function(res){
			socket.emit('update_my_chat_notifications',res,userId);
		});
	});

	socket.on('get_all_my_notifications_count', function(userId){
		myTopics(userId,{action:'get_all_my_notfications_count'},function(res){
			socket.emit('update_all_my_notfications_count',res,userId);
		});
	});

	socket.on('check_user_status', function(userId){
		//console.log("Check Status "+userId);
		//console.log(socket.rooms);
		socket.emit('user_status',userId,socket.rooms[userId]?"connected":"disconnected");
	});	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		//console.log(socket.id +"   is disconnected");
		socket.leave(socket.userId);		
		
		if(socket.userId)
			socket.broadcast.emit('user_status', socket.userId , "disconnected");
		
	});

});
