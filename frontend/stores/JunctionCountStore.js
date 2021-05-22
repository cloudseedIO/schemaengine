var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var common = require('../components/common.jsx');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'JCSChange';

//var junctionCounts = {}

var Immutable = require('immutable');
var junctionCounts = Immutable.Map();


var JunctionCountStore = assign({}, EventEmitter.prototype, {

	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},

	/**
	 * @param {function} cal  lback
	 */
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
		//return junctionCounts[recordId];
		return junctionCounts.get(recordId);
	},

	getAll: function() {
		//return junctionCounts;
		return junctionCounts.toJSON();
	},
	clear:function(){
		//junctionCounts = {}
		junctionCounts=junctionCounts.clear();
	},
	clearAll:function(){
		junctionCounts = junctionCounts.clear();
	},
	receiveCount:function(data){//delete this
		this.monitorStore();
		/*if(typeof junctionCounts[data.recordId] == "undefined"){
			junctionCounts[data.recordId]={};
		}
		if(typeof junctionCounts[data.recordId][data.relationName] == "undefined"){
			junctionCounts[data.recordId][data.relationName]=0;
		}
		junctionCounts[data.recordId][data.relationName]=data.count;
		*/
		junctionCounts=junctionCounts.setIn([data.recordId,data.relationName],data.count)
	},
	getRelatedCount:function(recordId,relationName){
		/*if(typeof junctionCounts[recordId] == "undefined"){
			junctionCounts[recordId]={};
		}
		if(typeof junctionCounts[recordId][relationName] == "undefined"){
			junctionCounts[recordId][relationName]=0;
		}
		return junctionCounts[recordId][relationName];
		*/
		return junctionCounts.getIn([recordId,relationName]);
	},
	createJunctionRecord:function(record){
		//this.monitorStore();
		for(var i=0;i<record.relationDesc.length;i++){
			/*if(typeof junctionCounts[record[record.relationDesc[i].split("-")[0]]]=="undefined"){
				junctionCounts[record[record.relationDesc[i].split("-")[0]]]={};
			}
			if(typeof junctionCounts[record[record.relationDesc[i].split("-")[0]]] [record.relationDesc[i].split("-")[1]] == "undefined"){
				junctionCounts[record[record.relationDesc[i].split("-")[0]]] [record.relationDesc[i].split("-")[1]]=1;
			}else{
				junctionCounts[record[record.relationDesc[i].split("-")[0]]] [record.relationDesc[i].split("-")[1]]++;
			}*/
			var count=junctionCounts.getIn([record[record.relationDesc[i].split("-")[0]],record.relationDesc[i].split("-")[1]]);
			if(count){
				junctionCounts=junctionCounts.setIn([record[record.relationDesc[i].split("-")[0]],record.relationDesc[i].split("-")[1]],count++)
			}else{
				junctionCounts=junctionCounts.setIn([record[record.relationDesc[i].split("-")[0]],record.relationDesc[i].split("-")[1]],1)
			}
			
		}
	},

	updateRecord:function(recordId,method){
		if(method=="HardDelete"){
			
		}
	},
	monitorStore:function(){
		var storeLimit=100;
		if(common.getConfigDetails() && 
			common.getConfigDetails().storeLimits &&
			common.getConfigDetails().storeLimits.junctionStoreLimit){
			storeLimit=common.getConfigDetails().storeLimits.junctionStoreLimit;
		}
		
		/*if(Object.keys(junctionCounts).length>storeLimit){
			var count=0;
			for (var key in junctionCounts) {
				delete junctionCounts[key];
				count++;
				if(count==10){
					break;
				}
			}
		}*/
		if(junctionCounts.count()>storeLimit){
			var count=0;
			console.log("JunctionCountStore full "+junctionCounts.count());
			junctionCounts=junctionCounts.filters(function(record,id){
				if(count<=10){
					count++
					return false;
				} else {
					return true;
				}
			});
			console.log("JunctionCountStore cleaned "+junctionCounts.count()+" cleaned "+count);
		}
		
	}

});

JunctionCountStore.dispatchToken = Dispatcher.register(function(action) {
	
	
	switch(action.type) {
	case ActionTypes.RECEIVE_RELATED_COUNT:
		JunctionCountStore.receiveCount(action.data);
		JunctionCountStore.emitChange();
		break;
	case ActionTypes.CREATE_JUNCTION_RECORD: 
		JunctionCountStore.createJunctionRecord(action.record);
		JunctionCountStore.emitChange();
		break;
		
	case ActionTypes.UPDATE_RECORD:
		JunctionCountStore.updateRecord(action.recordId,action.method);
		JunctionCountStore.emitChange();
		break;
		
	case ActionTypes.CREATE_RECORD:
		if(action.record.relationDesc){
			JunctionCountStore.createJunctionRecord(action.record);
			JunctionCountStore.emitChange();
		}
		break;
	default:
		// do nothing
	}

});

JunctionCountStore.setMaxListeners(100);
module.exports = JunctionCountStore;
