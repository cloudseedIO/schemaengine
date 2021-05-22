var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'SchemaStoreChange';


var Immutable = require('immutable');
var schemas = Immutable.Map();

var SchemaStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
	  this.emit(CHANGE_EVENT);
  },
  addChangeListener: function(callback,changeEvent) {
		if(changeEvent){
			this.on(changeEvent,callback);
		}else{
			this.on(CHANGE_EVENT, callback);
		}
	},

	removeChangeListener: function(callback,changeEvent) {
		if(changeEvent){
			this.removeListener(changeEvent,callback);
		}else{
			this.removeListener(CHANGE_EVENT, callback);
		}
	},
	removeAllChangeListeners:function(){
		try{
			var allEvents=Object.keys(this._events);
			for(var i=0;i<allEvents.length;i++){
				this.removeAllListeners(allEvents[i]);
			}
		}catch(err){}
	},
  get: function(recordId) {
    /*var schemaRes=undefined;
	try{
	  schemaRes = JSON.parse(JSON.stringify(schemas[recordId]));
	}catch(err){
		  
	}
    return schemaRes;*/
	  if(schemas.has(recordId)){
		  return schemas.get(recordId).toJSON();
	  }else{
		  return undefined;
	  }
  },
  receiveAllSchemas:function(data){
	 for(var i=0;i<data.length;i++){
		 //schemas[data[i].id]=data[i].value;
		 schemas=schemas.set(data[i].id,Immutable.fromJS(data[i].value))
  	}  
  },
  receiveSchemas:function(data){
	  for (var id in data) {
		  //schemas[id]=data[id];
		  schemas=schemas.set(id,Immutable.fromJS(data[id]))
	  }
  },
  getAll: function() {
    //return schemas;
    return schemas.toJSON();
  },
  getAllByCloudPointHostId:function(cloudPointHostId){
	/*var schemasToSend={};
	for(var key in schemas){
		if(schemas[key].cloudPointHostId && (schemas[key].cloudPointHostId==cloudPointHostId || schemas[key].cloudPointHostId=="master")){
			schemasToSend[key]=schemas[key];
		}
	}
	return schemasToSend;*/
	return schemas.filter(function(schema,id){
		var flag=false;
		try{
			if(schema.get("cloudPointHostId")==cloudPointHostId || schema.get("cloudPointHostId")=="master"){
				return true;
			}
		}catch(err){}
		return flag;
	}).toJSON();
  },
  putAll:function(s){
	//schemas=s;
	schemas=Immutable.fromJS(s);
  },
  clear:function(){
	//schemas={};
  },
  clearAll:function(){
  	schemas=schemas.clear();
  },
  putSchema:function(id,schema){
	  //schemas[id]=schema;
	  schemas=schemas.set(id,Immutable.fromJS(schema));
  },
  getSchema: function(id ) {
	  return this.get(id);
  }

});

SchemaStore.dispatchToken = Dispatcher.register(function(action) {

  switch(action.type) {
    case ActionTypes.RECEIVE_SCHEMAS:
      SchemaStore.receiveSchemas(action.schemas);
      SchemaStore.emitChange();
      break;
    case ActionTypes.RECEIVE_ALL_SCHEMAS:
    	SchemaStore.receiveAllSchemas(action.schemas);
    	SchemaStore.emitChange();
    	break;
    	default:
      // do nothing
  }
});

SchemaStore.setMaxListeners(100);

module.exports = SchemaStore;
