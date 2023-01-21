
var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var ActionTypes = Constants.ActionTypes;
module.exports = {
  receiveDefinition:function(record){
    Dispatcher.dispatch({
      type:ActionTypes.RECEIVE_DEFINITION,
      record: record
    });
  },
  receiveSchemaRecords:function(data){
  	Dispatcher.dispatch({
  		type:ActionTypes.RECEIVE_SCHEMA_RECORDS,
  		data:data
  	})
  },
  receiveSchemas:function(schemas){
  	Dispatcher.dispatch({
  		type:ActionTypes.RECEIVE_SCHEMAS,
  		schemas:schemas
  	})
  },
  receiveAllSchemas:function(schemas){
	Dispatcher.dispatch({
		type:ActionTypes.RECEIVE_ALL_SCHEMAS,
		schemas:schemas
	})
  },
  receiveUserDetails:function(data){
    Dispatcher.dispatch({
      type:ActionTypes.RECEIVE_USER_DETAILS,
      data:data
    })
  },
receiveRelatedRecords:function(data){
    Dispatcher.dispatch({
      type:ActionTypes.RECEIVE_RELATED_RECORDS,
      data:data
    })
  },
  receiveRelatedCount:function(data){
	Dispatcher.dispatch({
		type:ActionTypes.RECEIVE_RELATED_COUNT,
		data:data
	})
  },
  receiveSchemaRecord:function(data){
    Dispatcher.dispatch({
      type:ActionTypes.RECEIVE_SCHEMA_RECORD,
      data:data
    })
  },
  receiveNavigationLinks:function(data){
	  Dispatcher.dispatch({
		 type:ActionTypes.RECEIVE_NAVIGATION_LINKS,
		 data:data
	  });
  },
  receiveUserDoc:function(data){
	  Dispatcher.dispatch({
		 type:"USER_DOC",
		 data:data
	  });
  },
  receiveOrgStatus:function(data){
    Dispatcher.dispatch({
		 type:"RECEIVE_ORG_STATUS",
		 data:data
	  });
  },
  receiveUserStatus:function(data){
    Dispatcher.dispatch({
		 type:"RECEIVE_USER_STATUS",
		 data:data
	  });
  },
  receiveChatRequests:function(data){
    Dispatcher.dispatch({
		 type:"RECEIVE_CHAT_REQUESTS",
		 data:data
	  });
  },
  receiveUserChatRequests :function(data){
    Dispatcher.dispatch({
		 type:"RECEIVE_USER_REQUESTS",
		 data:data
	  });
  },
  receivePrivateChat :function(data){
    Dispatcher.dispatch({
     type:"RECEIVE_PRIVATE_CHAT",
     data:data
    });
  },
  receiveTypeStatus : function(data){
    Dispatcher.dispatch({
     type:"RECEIVE_TYPE_STATUS",
     data:data
    });
  },
  storeAllOrgs : function(data){
    Dispatcher.dispatch({
     type:"RECEIVE_All_ORGS",
     data:data
    });
  },
  receiveLastMessage : function(data){
    Dispatcher.dispatch({
     type:"RECEIVE_LAST_MSG",
     data:data
    });
  },
  receiveNotification : function(data){
    Dispatcher.dispatch({
     type:"RECEIVE_NOTIFICATION",
     data:data
    });
  },
  clearStoreData : function(){
    Dispatcher.dispatch({
      type:"CLEAR_STORE_DATA",
    });
  }
};
