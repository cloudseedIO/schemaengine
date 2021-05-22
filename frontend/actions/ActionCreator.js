
var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var WebAPIUtils = require('../utils/WebAPIUtils.js');
var JunctionCountStore=require('../stores/JunctionCountStore');
var ActionTypes = Constants.ActionTypes;
module.exports = {
  getDefinition: function(recordId){
    WebAPIUtils.getDefinition(recordId);
  },
  getSchemaRecords:function(data){//schema,filters,dependentSchema,org,userId,skip,limit,noOrder
    WebAPIUtils.getSchemaRecords(data);
  },
  getSchemas:function(schema){
    WebAPIUtils.getSchemas(schema);
  },
  getAllSchemas:function(){
	WebAPIUtils.getAllSchemas();  
  },
  getUserDetails:function(id){
    WebAPIUtils.getUserDetails(id);
  },
  getRelatedCount:function(data){//recordId,relationName
	  WebAPIUtils.getRelatedCount(data);
  },
  getRelatedRecords:function(data){//recordId,relationName,rootSchema,relationRefSchema,relationView,userId,skip,org
	WebAPIUtils.getRelatedRecords(data);  
  },
  getSchemaRecord:function(data){//schema,ds,recordId,userId,org
    WebAPIUtils.getSchemaRecord(data);
  },
  createJunction:function(junctionRecord,callback){
	  WebAPIUtils.createJunction(junctionRecord,function(result){
		  if(result && result.data && !result.data.error){
			  try{
				  if(result.data.success=="deleted"){
					  if(junctionRecord.docType=="Like"){
						  Dispatcher.dispatch({
								type:ActionTypes.RECEIVE_RELATED_COUNT,
								data:{recordId:junctionRecord.likeFor,relationName:"likedBy",count:JunctionCountStore.getRelatedCount(junctionRecord.likeFor,"likedBy")*1-1}
							})  
					  }
					  if(junctionRecord.docType=="Follow"){
						  Dispatcher.dispatch({
								type:ActionTypes.RECEIVE_RELATED_COUNT,
								data:{recordId:junctionRecord.followee,relationName:"followedBy",count:JunctionCountStore.getRelatedCount(junctionRecord.followee,"followedBy")*1-1}
							})  
					  }
					  
				  }else{
					  Dispatcher.dispatch({
							type:ActionTypes.CREATE_JUNCTION_RECORD,
							record:junctionRecord
						})  
				  }
			  }catch(err){}
		  }
		  callback(result);
	  });
  },
  createRecord:function(record){
	  Dispatcher.dispatch({
		  type:ActionTypes.CREATE_RECORD,
		  record:record
	  })
  },
  getNavigationLinks:function(userId){
	  WebAPIUtils.getNavigationLinks(userId);
  },
  updateRecord:function(recordId,method){
	  Dispatcher.dispatch({
		  type:ActionTypes.UPDATE_RECORD,
		  recordId:recordId,
		  method:method
	  });
  }

};
