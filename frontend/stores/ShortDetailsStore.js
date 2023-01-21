var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var CHANGE_EVENT = 'SDSChange';
var common = require('../components/common.jsx');
var Immutable = require('immutable');
var records = Immutable.Map();
var age=1;
var currDelCount=1;

var ShortDetailsStore = assign({}, EventEmitter.prototype, {

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
	getCount:function(){
		return records.count()
	},
	clear:function(){
		records=records.clear();
		age=1;
		currDelCount=1;
	},
	clearAll:function(){
		records=records.clear();
		age=1;
		currDelCount=1;
	},
	receiveShortDetails:function(record){
		this.monitorStore();
		record.age=age++;
		if(records.has(record.recordId)){
			record.status=records.get(record.recordId).toJSON().status
		}
		records=records.set(record.recordId,Immutable.fromJS(record));
		this.emit(record.recordId);
	},
	reduceNotificationsCount:function(record){
		var count=this.getShortDetails(record).count;
		if(count!=undefined){
			count=count-record.count;
			records=records.setIn([record.recordId,"count"],count);
			this.emit(record.recordId);
		}
	},
	receiveUserStatus:function(id,status){
		records=records.setIn([id,"status"],status);
		this.emit(id);
	},
	getShortDetails:function(data){
		if(records.has(data.recordId)){
			return records.get(data.recordId).delete("age").toJSON();
		}else{
			return undefined;
		}
	},
	get: function(recordId) {
		if(records.has(recordId)){
			return records.get(recordId).toJSON();
		}else{
			  return undefined;
		}
	},
	monitorStore:function(){

		var storeLimit=100;
		if(records.count()>storeLimit){
			var count=0;
			console.log("ShortDetailsStore full "+records.count());
			records=records.filter(function(record,recordId){
				if(record.get("age") && record.get("age")<=currDelCount+10){
					count++;
					return false;
				}else{
					return true;
				}
			});
			currDelCount+=count;
			console.log("ShortDetailsStore cleaned "+records.count()+" cleaned "+count);
		}
	}

});

ShortDetailsStore.dispatchToken = Dispatcher.register(function(action) {
	switch(action.type) {
		case "RECEIVE_SHORT_DETAILS":
			ShortDetailsStore.receiveShortDetails(action.data);
			ShortDetailsStore.emitChange();
			break;
		default:
		// do nothing
	}
});

ShortDetailsStore.setMaxListeners(100);
module.exports = ShortDetailsStore;
