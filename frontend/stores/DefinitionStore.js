var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'DSChange';

//var definitions = {}
var Immutable = require('immutable');
var definitions = Immutable.Map();

var DefinitionStore = assign({}, EventEmitter.prototype, {

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
    //return definitions[recordId];
	  if(definitions.has(recordId) && definitions.get(recordId)!=undefined){
		  return definitions.get(recordId).toJSON();
	  }else{
		  return undefined;
	  }
  },
  receiveDefinition: function(record){
	  if(record.recordId && record.recordId.indexOf("CloudPointConfig")==0){
		  //definitions["CloudPointConfigDefinition"]=record;
		  definitions=definitions.set("CloudPointConfigDefinition",Immutable.fromJS(record));
	  }
	  //definitions[record.recordId]=record;
	  definitions=definitions.set(record.recordId,Immutable.fromJS(record));
	  this.emit(record.recordId);
  },
  addNavigationLinks:function(record){
	  //definitions["navigationLinks"]=record;
	  var navUpdatedFlag=true;
	  try{
		  if(definitions.has("navigationLinks") && JSON.stringify(definitions.get("navigationLinks").toJSON())==JSON.stringify(record)){
			  navUpdatedFlag=false;
		  }
	  }catch(err){}
	  if(navUpdatedFlag){
		  definitions=definitions.set("navigationLinks",Immutable.fromJS(record));
		  this.emit("navigationLinks");
	  }
  },
  addUserDoc:function(record){
	  //definitions["userDoc"]=record;
	  definitions=definitions.set("userDoc",Immutable.fromJS(record));
	  this.emit("userDoc");
  },
  getCloudPointConfigDefinition:function(){
	  //return definitions["CloudPointConfigDefinition"];
	  return definitions.get("CloudPointConfigDefinition").toJSON();
  },
  getAll: function() {
    //return definitions;
	  return definitions.toJSON();
  },
  putAll: function(recs){
	//definitions=recs;
	  definitions=Immutable.fromJS(recs);
  },
  clear:function(cphi){
	//definitions={};  
	  definitions = definitions.filter(function(def,id){
			var flag=true;
			try{
				if(def.get("cloudPointHostId")==cphi){
					return false;
				}
			}catch(err){}
			return flag;
		});
  },
  clearAll:function(){
  	definitions = definitions.clear();
  },
  getDefinition: function(id ) {
    return this.get(id);
  },
  getNavigationLinks:function(){
	  return this.get("navigationLinks");
  }

});

DefinitionStore.dispatchToken = Dispatcher.register(function(action) {

  switch(action.type) {
    case ActionTypes.RECEIVE_DEFINITION:
    	DefinitionStore.receiveDefinition(action.record);
    	DefinitionStore.emitChange();
    	break;
      
    case ActionTypes.RECEIVE_NAVIGATION_LINKS:
    	DefinitionStore.addNavigationLinks(action.data);
    	DefinitionStore.emitChange();
    	break;
    case "USER_DOC":
    	DefinitionStore.addUserDoc(action.data);
    	DefinitionStore.emitChange();
    	break;
    default:
      // do nothing
  }
 
});

DefinitionStore.setMaxListeners(30);
module.exports = DefinitionStore;
