    // Initialize variables
    var my_username = '';
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box
    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page');
    var $currentInput = $usernameInput.focus();
    var username, roomsArray=[], myPendingTopics= [], myTopics=[], currentTopic, currentSubTopic;
    var SERVER_URL = 'https://localhost:3000';


    var socket = io.connect(SERVER_URL);

	 
		// get username param  from url
	  var urlParam = location.search.split('username=');
	  if(urlParam.length>1 && urlParam[1]){
		my_username = urlParam[1];
		//add client to chat server
		socket.emit('adduser', my_username);
	  }
	  else document.body.innerHTML = '<h1>Append username query param in URL; ex: ?username=john</h1>';
	  
	  //on receivedTopics emit (incoming messages)
	  socket.on('received_topics', function (receivedTopics, current_top, username) {
		   if(username && username != my_username) return;
			console.log(rooms, current_room);
			
			// hide & show default elements based on history
			$('#rooms, #conversation').empty();
			initDefultsViews(rooms, historyData);
			
			$.each(receivedTopics, function(key, value) {
			  createTopics(value, current_topic);
			});
	  });
	  
	  socket.on('update_history', function (chat, topic, username, belongTo) {
		   currentSubTopic = belongTo, currentTopic = topic.id;
		   setTopicChat(chat.results, topic, belongTo);
	  });
	  
	  socket.on('update_my_user_details', function (myUserDetails) {
		//   console.log(myUserDetails);
	  });
	  
	   socket.on('update_topic_details', function (topics, topic) {
		   //console.log(topics.results);
		   setTopicDetails(topics.results, topic);
	  });
	  
	  socket.on('update_topic_notifications', function (username, notifications) {
		  console.log(notifications);
		  setTimeout(function(){
		  if(notifications.results.length>0)
			updateSubtopicCounter(notifications.results);
		  }, 1000);
	  });
	  
	  
	  // listener, whenever the server emits 'store_username', this updates the username
      socket.on('store_username', function (username) {
        my_username = username;
      });

      
      // listener, whenever the server emits 'update_my_topics', this updates the room the client is in
      //autoSwitch is when server adds members of an organization to a room
      socket.on('update_my_topics', function(topics, current_room, usrName, autoSwitch, belongTo) {
		
        if(usrName && usrName != my_username) return;
        
		//console.log(rooms, current_room, usrName, autoSwitch);		
		// hide & show default elements based on history
		$('#rooms, #conversation').empty();
		//initDefultsViews(topics);
		
		if(topics.results.length>0){
			myTopics = topics.results;
			$.each(topics.results, function(key, value) {
			  createTopics(value, socket.belongTo);
			});
			
			$('#rooms').removeClass('hide');
			$('.defaultMsg').hide();
			bindTapEvents('#rooms');//bind only for topic element
			
		}else{
			 setDefaultMsg(DEFAULT_ROOM_MSG, '#rooms');
		}
		
		
        /*if(autoSwitch){
			switchRoom(current_room);
			collapseItem(current_room, belongTo)
		}*/
		
		
      });
	  
	  //single room/topic update
	socket.on('update_topic', function(topic, usrName, autoSwitch, belongTo) { 
	
        console.log(topic, usrName, autoSwitch, belongTo);
	
		if(usrName && usrName != my_username) return;
		
		createTopics(topic, belongTo, true, 'subtopic'); //true for appending to existing
		
		initDefultsViews(myTopics, true);
		
		//if(!currentSubTopic) currentSubTopic = belongTo;
		
		//update room history
		console.log(isActiveTab(topic[0].messages.topicId, belongTo));
		
		if(isActiveTab(topic[0].messages.topicId, belongTo)){
			$('#conversation').empty();
			setTopicChat(topic, topic, belongTo)
		}else{
			//updateSubtopicCounter(topic[0].messages.counter[my_username], currentTopic, belongTo);
			getTopicDetails(currentTopic)
			if(belongTo==my_username && topic[0].messages.chat.length==1) //notification block if same user first time response
			return;
			socket.emit('update_subchat_counter', my_username, topic[0].messages.topicId, belongTo);
		}
		 
		// if(autoSwitch)
		//	collapseItem(topic.id, belongTo)
		
	});

	socket.on('update_subchat_counter', function(data, topic, belongTo){
		if(data.results.length>0)
		updateSubtopicCounter(data.results[0], topic, belongTo);
	});
	
	socket.on('update_chat_delete', function(topic, chat) {
		updateAction('delete', topic, chat);
	});
	
	socket.on('update_chat_archive', function(topic, chat) {
		updateAction('archive', topic, chat);
	});
	
	
	socket.on('get_archived_topics', function(topics){
		console.log(topics);
		if(topics.results.length>0){
			createTopics(topics.results, null, null, 'archive')
		 }else{
			 setDefaultMsg(DEFAULT_EMPTY_MSG, '#archive');
		 }
	});	
	
	socket.on('update_archive_chat', function(chat, topic, username, belongTo){
		currentTopic = topic, currentSubTopic = belongTo;
		var prop = {card:'#cards .archive ', selector: '#cards .archive #chat-room-'+topic+"-"+belongTo, chatElId:'chat-room-'+topic+"-"+belongTo};
		setTopicChat(chat.results, topic, belongTo);
	});
	
	socket.on('get_subtopics', function(topics,type){
		if(!type) type = 'subtopic'
		console.log(type);
		createTopics(topics.results, null, null, type)
	});
	
	socket.on('get_pending_topics', function(topics){
		 //console.log(topics.results);
		 if(topics.results.length>0){
			myPendingTopics = topics.results;
			createTopics(topics.results, null, null, 'pending')
		 }else{
			 setDefaultMsg(DEFAULT_EMPTY_MSG, '#pending');
		 }
	});
	
	socket.on('get_org_topics', function(topics){
		 console.log(topics.results);
		 if(topics.results.length>0){
			$('#orgs').html('').removeClass('hide');
			$.each(topics.results, function(key, value) {
			  createTopics(value, null, null, 'org');
			});
			
			bindTapEvents('#orgs');//bind only for topic element
			
		 }else{
			 setDefaultMsg(DEFAULT_EMPTY_MSG, '#orgs');
		 }
	});
	
	
	//send files
	ss(socket).on('downloadFile', function(stream,data) {
	 var fileBuffer = [], fileLength=0;
	  stream.on('data', function(chunk) {
		  fileLength += chunk.length;
			fileBuffer.push(chunk);
	});

	stream.on('end', function(dt) {
		  var filedata = new Uint8Array(fileLength),i=0;
		  fileBuffer.forEach(function (buff) {
				for (var j = 0; j < buff.length; j++) {
					filedata[i] = buff[j];
					i++;
				}
		  });

		  downloadBlob(filedata, data, "application/octet-stream");
	});
	});
	
    // Sends a chat message
    function sendMessage(el) {
        var message = el.val();
        if (message) {
          socket.emit('sendchat', my_username, message, currentTopic, currentSubTopic);
        }
      el.val('');
    }

	function isActiveTab(topicId, subTopicId){
		return $('[data-id="'+topicId+'"][data-belong="'+subTopicId+'"]').hasClass('active');
	}

	function createTopics(room, belongTo, appendTo, type){
          var _isCurrent = '',_members= room.contacted;
		if(!type){
			console.log(room);
		 $('#rooms').append(`<div class="accordn collapsed" data-toggle="collapse" data-type="accordian" data-id="${room.username}" data-target="#${room.id}" aria-expanded="false">
			<li>
				<div class="box-start">
						<h6>${room.topic}</h6>
						<span>2 converstations</span>
				</div>
				<span class="box-end"><span class="counter"></span> <i class="fa-times fa fa-2x pull-right"></i></span>
			</li>
		  </div>`);
	  	
          $('#rooms').append(`<div id="${room.id}" class="accordn-item" aria-expanded="false"><li data-type="root" data-id="${room.id}" class="${_isCurrent} she" >
                                  <div class="info"><div class="name">
                                    <span class="left room-name">${room.topic}</span>
                                    <span class="right time">${timeFormat(room.createdDate)}<i class="fa fa-angle-right" aria-hidden="true"></i></span>
                                  </div>
								  <div class="people clear">${$.map(room.contacted, function(contact){return contact.name;})}</div>	
								  <div class="box">
                                 	 <span class="left desc">started by ${room.username}</span>
									 <!--span class="right cursor icon-ellipsis-h r-align"><i class="fa fa-ellipsis-h pointer" aria-hidden="true"></i></span-->
									 <!--ul href="#" class="up-arrow" style="display:none;">
										<li class="archive">Archive</li>
										<li class="delete">Delete</li>
									</ul-->
								  </div>	
                                  </div></li></div>`);
		//setTopicChat(rooms, current_room, belongTo);
           $('.conversation-header').show();
		}
		
		if(type == 'archive'){
			var _selector = '.left-panes .tab-items #archive';
			$(_selector).html('');
			$.each(room, function(i, v){
			$(_selector).append(`<li data-id="${v.messages.topicId}" data-belong="${v.messages.chatFrom}" data-type="archive" class="she">
                                  <div class="info"><div class="name">
                                    <span class="left room-name">${v.messages.topic}</span>
                                    <span class="right time">${timeFormat(v.messages.updatedDate)} <i class="fa fa-angle-right" aria-hidden="true"></i></span>
                                  </div>
								  <div class="people clear">${v.messages.chatFrom},${v.messages.chatTo}</div>
								  <div class="">
                                 	 <span class="left desc">started by ${v.messages.chatTo}</span>
									 <span class="right icon-ellipsis-h r-align"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></span>
								  </div>
                                  </div>
                                  </li>`);
			});
		}
		
		if(type == 'subtopic'){
			if(room){
				$.each(room, function(i, v){
					console.log(v);
			    if($('#rooms #'+v.messages.topicId+' [data-belong="'+v.messages.chatFrom+'"]').length==0){
					$('#rooms #'+v.messages.topicId).append(`<li data-id="${v.messages.topicId}" data-belong="${v.messages.chatFrom}" data-type="topic" class="${_isCurrent} she">
									  <div class="info"><div class="name">
										<span class="left room-name">${v.messages.chatFrom}</span>
										<span class="right time">${timeFormat(v.messages.updatedDate)}  <i class="fa fa-angle-right" aria-hidden="true"></i></span>
									  </div>
									  <div class="people clear">${v.messages.chatFrom},${v.messages.chatTo}</div>	
									  <div class="">
										 <span class="left desc">started by ${v.messages.chatTo}</span>
										 <span class="right"><span class="counter ${v.messages.counter[my_username].count>0?'has':''}">${v.messages.counter[my_username].count}</span><span class="icon-ellipsis-h r-align pointer"><i data-topic="${v.messages.topicId}" data-subtopic="${v.messages.chatFrom}" class="fa fa-ellipsis-h" aria-hidden="true"></i></span></span>
									  </div>	
									  </div></li>`);
				}
				});
				
			}
		}
		
		
		if(type == 'orgs_subtopic'){
			if(room){
				$.each(room, function(i, v){
					console.log(v);
			    if($('#orgs #'+v.messages.org+' [data-belong="'+v.messages.chatFrom+'"]').length==0){
					$('#orgs #'+v.messages.org).append(`<li data-id="${v.messages.topicId}" data-belong="${v.messages.chatFrom}" data-type="topic" class="${_isCurrent} she">
									  <div class="info"><div class="name">
										<span class="left room-name">${v.messages.chatFrom}</span>
										<span class="right time">${timeFormat(v.messages.updatedDate)}  <i class="fa fa-angle-right" aria-hidden="true"></i></span>
									  </div>
									  <div class="people clear">${v.messages.chatFrom},${v.messages.chatTo}</div>	
									  <div class="">
										 <span class="left desc">started by ${v.messages.chatTo}</span>
										 <span class="right"><span class="counter ${v.messages.counter[my_username].count>0?'has':''}">${v.messages.counter[my_username].count}</span><span class="icon-ellipsis-h r-align pointer"><i data-topic="${v.messages.topicId}" data-subtopic="${v.messages.chatFrom}" class="fa fa-ellipsis-h" aria-hidden="true"></i></span></span>
									  </div>	
									  </div></li>`);
				}
				});
				
			}
		}
		
		if(type == 'pending'){
			$('#pending').html('');
			if(room){
				$.each(room, function(i, room){
			    $('#pending').append(`<li data-type="pending" data-id="${room.id}" class="she" >
                                  <div class="info"><div class="name">
                                    <span class="left room-name">${room.topic}</span>
                                    <span class="right time">${timeFormat(room.createdDate)} <i class="fa fa-angle-right" aria-hidden="true"></i></span>
                                  </div>
								  <div class="people clear">${$.map(room.contacted, function(contact){return contact.name;})}</div>	
								  <div class="box">
                                 	 <span class="left desc">started by ${room.username}</span>
									 <span class="right cursor icon-ellipsis-h r-align"><i class="fa fa-ellipsis-h pointer" aria-hidden="true"></i></span>
								  </div>	
                                  </div></li>`);
				});
				
			}
		}
		
		if(type == 'org'){
			$('#orgs').append(`<div class="accordn collapsed orgs" data-toggle="collapse" data-type="accordian" data-id="${room.org}" data-target="#${room.org}" aria-expanded="false">
			<li>
				<div class="box-start">
						<h6>${room.org}</h6>
						<span>2 converstations</span>
				</div>
				<span class="box-end"><span class="counter"></span> <i class="fa-times fa fa-2x pull-right"></i></span>
			</li>
		  </div>`);
		  $('#orgs').append(`<div id="${room.org}" class="accordn-item" aria-expanded="false"></div>`);
		}

	}

	function getSubTopics(data,type){
		
		 currentTopic = data.target.replace('#','');
		 socket.emit('get_subtopics', currentTopic, data.id, type);
	}
	
	function setTopicChat(historyData, topic, belongTo, prop){
	  
	  if(historyData.length == 0) return;
	  //console.log(historyData);
	  
	  //set right chat header info
	  setChatHeader(historyData[0].messages.topic, historyData[0].messages.chatFrom+ "," +historyData[0].messages.chatTo);
	  
	  if(!prop){
		var _slug = historyData[0].messages.topicId+"-"+belongTo;
		prop={card:'#conversation', selector: '#conversation #chat-room-'+_slug, chatElId:'chat-room-'+_slug};
	  }
	  
	  $(prop.card).removeClass('hide');
	  
	  if($(prop.selector).length===0)
	  $(prop.card).append(`<div id="${prop.chatElId}" class="active"></div>`);
	  $(prop.selector).html('');
	  
	  
	  $.each(historyData[0].messages.chat, function(key, value) {
		var isSelf = 'me';
		if(value.chatFrom!=my_username) isSelf = 'others'
		$(prop.selector).append(`<li class="${isSelf}">
			<div class="thread"><h6> ${value.chatFrom}</h6><div class="msg">${value.message}</div><div class="time r-align s-txt">${value.date?value.date:''}</div></div></li>`);
	  });
	  
	  $(prop.card+' > div').removeClass('active');
	  $(prop.card+' [data-belong="'+belongTo+'"], '+prop.selector).addClass('active');
	}
		
	function getTopicDetails(topicId){
	  //console.log(topicId);
	  //var topic = findTopicById(myTopics,topicId);
	  socket.emit('topicDetails', topicId); //has to be chaged to just topicId
	}
	
	//to set default topic chat	
	function setTopicDetails(topicDetails, topic){
		//console.log(topicDetails);
		if(topicDetails.length == 0) return;
		var topic = topicDetails[0], _slug = topic.id+"-root";

		if($('#conversation #chat-room-'+_slug).length===0)
		$('#conversation').append(`<div id="chat-room-${_slug}" class="active"></div>`);
		$('#conversation #chat-room-'+_slug).html('');
		$('#conversation').removeClass('hide');
		
		setChatHeader(topic.topic, topic.contacted);
		
		$('#conversation #chat-room-'+_slug).html(`<li class="pending">
			<div class="thread"><div class="msg c-align">${topic.username} created topic ${topic.topic}</div></div></li>`);
		
		var _startConv=false;
		
		$.each(topicDetails[0].contacted, function(key, value) {
			if(value.name!=my_username && value.status=='responded') 
			$('#conversation #chat-room-'+_slug).append(`<li class="pending">
				<div class="thread c-align"><div class="msg">${value.name} started conversation</div></div></li>`);
			if(topic.username!=my_username && value.name==my_username && value.status!='responded') 
				_startConv = true;
		});
		  
		if(_startConv)
		$('#conversation #chat-room-'+_slug).append(`<li class="pending"><button type="button" class="btn strt-conv">Start Conversation</button></li>`);			  
		
		$('#conversation > div').removeClass('active');
		$('#conversation #chat-room-'+_slug).addClass('active');
	}
		
	function updateSubtopicCounter(counter, topic, belongTo){
		if(topic){ //for single notification
				console.log(counter);
				if(counter.counter[my_username].count == 0) return;
				$('[data-id="'+topic+'"][data-belong="'+belongTo+'"] .counter').html(counter.count).addClass('has');
				var _notif = $('[data-type="accordian"][data-target="#'+topic+'"] .counter').text(); //existing notification
				$('[data-type="accordian"][data-target="#'+topic+'"] .counter').html(_notif?(parseInt(_notif)+counter.count):counter.count).addClass('has');
		}else{
			var _incr = 0;
			
			$.each(counter, function(i,v){
				if(v.counter[my_username].count != 0){
				_incr+= v.counter[my_username].count;
				//	console.log(v)
				 $('[data-id="'+v.topicId+'"][data-belong="'+v.chatFrom+'"] .counter').html(v.counter[my_username].count).addClass('has');
				 $('[data-type="accordian"][data-target="#'+v.topicId+'"] .counter').html(_incr).addClass('has');
				}
				 //console.log(_incr);
			});
		}
	}	
	
	function performListActions(data){
		if(data.action == 'delete'){
			var isTrue = confirm("sure u wanna delete");
			if(isTrue) socket.emit('deleteChat', data.topic, data.subtopic);
		}
		if(data.action == 'archive'){
			socket.emit('archiveChat', data.topic, data.subtopic);
		}
	}	
		
	function switchRoom(topicId, belongTo){
	  currentSubTopic = belongTo, currentTopic = topicId;
	  var topic = findTopicById(myTopics,topicId);
	  socket.emit('switchRoom', topic, belongTo);
	  
	  $inputMessage.attr('placeholder','broadcast to all '+topic.topic);

	  $('#conversation>div').removeClass('active');
	  $('#conversation #chat-room-'+topicId).addClass('active');
	  
	  resetTopicsNotifications(topicId, belongTo);
	  
	  $('.chat-input').show();
	}

	function resetTopicsNotifications(topicId, belongTo){
	  $('[data-id="'+topicId+'"][data-belong="'+belongTo+'"] .counter').html("").removeClass('has'); //remove under counter badge upon tapping subtopic	
	  $('[data-target="#'+topicId+'"].accordn .counter').html("").removeClass('has');
	}
	
	function getArchiveTopicChat(topicId, belongTo){
	  currentSubTopic = belongTo, currentTopic = topicId;
	  socket.emit('switchArchiveTopic', topicId, belongTo);
	  $inputMessage.attr('placeholder','');
	  $('.chat-input').show();
	}
	
	function getPeindingTopics(){
		socket.emit('get_pending_topics', my_username);
	}
	function getPendingTopicChat(id){
	  var topic = findTopicById(myPendingTopics, id);
	  if(!topic) return;
	  console.log(topic);
	  $('#cards .pending.page').removeClass('hide');
	  $('#cards .pending.page>div').addClass('active');
	  setChatHeader(topic.topic, topic.contacted)
	  $('#cards .pending.page').html($('#cards .pending.page').html().compile(topic,true));
	  
	  $.each(topic.contacted, function(i, v){
		  $('#cards .pending.page .contacted').append(`<div>
								<li>
									<h6>${v.name}</h6>
									<p>loer posm, outer ring road service</p>
								</li>
								<span class="pointer"><i class="fa fa-hand-o-up" aria-hidden="true"></i></span>
								<span class="pointer"><i class="fa fa-reply" aria-hidden="true"></i></span>
							</div>`);
	  });
	}
	
	function getOrgs(){
		socket.emit('get_org_topics', my_username);
	}
	
	function getArchiveTopics(){
		//console.log('trigger');
		socket.emit('get_archived_topics', my_username);
	}
	
	// on load of page
	$window.keydown(function (event) {
		// Auto-focus the current input when a key is typed
		if (!(event.ctrlKey || event.metaKey || event.altKey)) {
		  //$currentInput.focus();
		}
		// When the client hits ENTER on their keyboard
		if (event.which === 13) {
		  var _el = $(event.target);
		  if(_el.hasClass('inputMessage')){
			sendMessage(_el);
			//socket.emit('stop typing');
			//typing = false;
		  } 
		  updateScrollBars(); //update scrollbars
		}
		else if (event.which === 27) {
		   if($(event.target).hasClass('roomInput')) $('.login').hide(200);
		}

	});


      function msgToOrg(orgId, room, membrs){
           socket.emit('message_to_org', my_username, orgId);
            //switchRoom(room, membrs);
      }


       downloadBlob = function(data, fileName, mimeType) {
      var blob, url;
      blob = new Blob([data], {
        type: mimeType
      });
      url = window.URL.createObjectURL(blob);
      downloadURL(url, fileName, mimeType);
      setTimeout(function() {
        return window.URL.revokeObjectURL(url);
      }, 1000);
    };

    downloadURL = function(data, fileName) {
      var a;
      a = document.createElement('a');
      a.href = data;
      a.download = fileName;
      document.body.appendChild(a);
      a.style = 'display: none';
      a.click();
      a.remove();
    };

    function findTopicById(topics, id){
		for(var i in topics){
			if(topics[i].id === id){
				return topics[i]; break;
			}
		}
	}

	 $(document).ready(function(){
		 
		 //get topic level notifications
		 socket.emit('get_topic_notifications');
		 
		 //file upload
		$(document).on("change", "input.file" , function(e) {
			var file = e.target.files[0];
			var stream = ss.createStream();
			var opts = {size: file.size, name:file.name};

			if($(e.target).hasClass('self')){
			   opts.to = $(e.target).attr('name');
			   opts.from = my_username;
			  $('#chat_box_'+opts.to+' .conversation').append('<li class="me">file sent</li>');
			}
			// upload a file to the server.
			//console.log(opts);
			ss(socket).emit('file', stream, opts);
			ss.createBlobReadStream(file).pipe(stream);
		  // console.log(stream);
		});
		
		$("#compose").submit(function(e) {
			var formData = serializeFormObj($("#compose").serializeArray());
			//send 
			//socket.emit('compose', formData, my_username); 
			socket.emit('message_to_members', formData, my_username);
			$('#msg-composer').hide();
			e.preventDefault();
		});
	  });


function timeFormat(strDate){
	var time = new Date(strDate).toLocaleTimeString();	
	return time.toString().substring(0, time.lastIndexOf(':')) + "  "
}

String.prototype.compile = function(obj, doLog){
	
	var q = this.replace(/{[^{}]+}/g, function(key){
		if(typeof obj[key.replace(/[{}]+/g, "")] == 'object')
			return JSON.stringify(obj[key.replace(/[{}]+/g, "")]);
		else
			return obj[key.replace(/[{}]+/g, "")] || "";
	});
	if(doLog){
		console.log("\n");
		console.log("#### query: "+q);
		console.log("\n");
	}
	return q;
}