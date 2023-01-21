1)Topics that do not have any chats.
VIEWQUERY

function(doc,meta){
	if(doc.type=="Topic" && Array.isArray(doc.contacted)){
		var flag=true;
		for(var i=0;i<doc.contacted.length;i++){
                  	
			if(doc.contacted[i].status!="pending"){
				flag=false;
				break;
			}
		}
		if(flag){
			var value={
			     type:doc.type,
			     userId:doc.userId,
			     message:doc.message,
			     status:doc.status,
			     topic:doc.topic,
			     createdDate:doc.createdDate,
			     contacted:doc.contacted,
			     counter:doc.counter,
			     id:doc.id
			};
			emit([doc.userId],value);
		}
	}
}



2)Topics by user that are not responded yet.
VIEWQUERY allPendingTopicsUser

function(doc,meta){
	if(doc.type=="Topic" && Array.isArray(doc.contacted)){
		var value={
		     type:doc.type,
		     userId:doc.userId,
		     message:doc.message,
		     status:doc.status,
		     topic:doc.topic,
		     createdDate:doc.createdDate,
		     contacted:doc.contacted,
		     counter:doc.counter,
		     id:doc.id
		   };
		for(var i=0;i<doc.contacted.length;i++){
			if(doc.contacted[i].status=="pending"){
				emit([doc.contacted[i].userId,doc.contacted[i].org,doc.userId],value);
			}
		}
	}
}

3)Chats by user that are not responded.

VIEW QUERY allPendingChats
function(doc,meta){
	if(doc.type=="PersonalChat"){
		 var value={
			     chatFrom:doc.chatFrom,
			     chatTo:doc.chatTo,
			     counter:doc.counter,
			     createdDate:doc.createdDate,
			     org:doc.org,
			     status:doc.status,
			     topic:doc.topic,
			     topicId:doc.topicId,
			     type:doc.type,
			     id:doc.id,
			     updatedDate:doc.updatedDate
			   };
		for(var key in doc.status){
			if(doc.counter[key].count>0 && doc.status[key].type=="active"){
				emit([key],value)
			}
		}
	}
}