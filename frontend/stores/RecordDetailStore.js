var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'RDSChange';


var common = require('../components/common.jsx');

//var records = {};
var Immutable = require('immutable');
var records = Immutable.Map();

var age=1;
var currDelCount=1;

var RecordDetailStore = assign({}, EventEmitter.prototype, {

	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},

	/**
	 * @param {function} callback
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
		//return records[recordId];
		if(records.has(recordId)){
			return records.get(recordId).toJSON();
		}else{
			  return undefined;
		}
	},
	getCount:function(){
		return records.count()
	},

	getAll: function() {
		//return records;
		return records.toJSON();
	},
	putAll: function(recs){
		//records=recs;
		records=Immutable.fromJS(recs);
	},
	clear:function(){
		//records={};
		records=records.clear();
		age=1;
		currDelCount=1;
	},
	clearAll:function(){
		records=records.clear();
		age=1;
		currDelCount=1;
	},
	createRecord:function(record){
		/*records[record.recordId]={
				id:record.recordId,
				schema:record.docType,
				org:record.org,
				value:record,
				methods:[],
				relatedSchemas:[],
				viewName:"getSummary"
			}*/
		records=records.set(record.recordId,Immutable.fromJS({
				id:record.recordId,
				schema:record.docType,
				org:record.org,
				value:record,
				methods:[],
				relatedSchemas:[],
				viewName:"getSummary"
			}));
		this.emit(record.recordId);
	},
	receiveSchemaRecord:function(record){
		this.monitorStore();
		/*records[record.recordId]={
				id:record.recordId,
				schema:record.schema,
				org:record.org,
				value:record.record,
				methods:record.methods,
				relatedSchemas:record.relatedSchemas,
				viewName:record.viewName,
				age:age++
			};*/
		records=records.set(record.recordId,Immutable.fromJS({
				id:record.recordId,
				schema:record.schema,
				org:record.org,
				value:record.record,
				methods:record.methods,
				relatedSchemas:record.relatedSchemas,
				viewName:record.viewName,
				age:age++
			}));
		this.emit(record.recordId);
	},
	receiveSchemaRecords:function(data){
		this.monitorStore();
		/*for (var i=0;i<data.records.length;i++) {
			if(records[data.records[i].id]==undefined){
				records[data.records[i].id]={
						id:data.records[i].id,
						schema:data.schema["@id"],
						org:data.org,
						value:data.records[i].value,
						methods:[],
						relatedSchemas:[],
						viewName:"getSummary",
						age:age++
				};
			}
		}*/
		data.records.map(function(record,index){
			if(!records.has(record.id)){
				records=records.set(record.id,Immutable.fromJS({
					id:record.id,
					schema:data.schema["@id"],
					org:data.org,
					value:record.value,
					methods:[],
					relatedSchemas:[],
					viewName:"getSummary",
					age:age++
				}))
			}
		})
	},
	getSchemaRecord:function(data){
		//schema,recordId,userId,org
		/*var temp
		if(records[data.recordId] && typeof records[data.recordId]=="object"){
			temp=JSON.parse(JSON.stringify(records[data.recordId]));
			delete temp.age;
		}
		return temp;*/
		if(records.has(data.recordId)){
			return records.get(data.recordId).delete("age").toJSON();
		}else{
			return undefined;
		}
	},
	updateRecord:function(recordId,method){
		if(method=="HardDelete"){
			//delete records[recordId];
			records=records.delete(recordId);
		}
		this.emit(recordId);
	},
	monitorStore:function(){

		var storeLimit=100;
		try{
			storeLimit=common.getConfigDetails().storeLimits.recordDetailStoreLimit;
		}catch(err){}
		
		/*if(Object.keys(records).length>storeLimit){
			var count=0;
			for (var key in records) {
				if(records[key] && records[key].age && records[key].age<=currDelCount+10){
					delete records[key];
					count++;
					if(count==10){
						break;
					}
				}
			}
		}*/
		if(records.count()>storeLimit){
			var count=0;
			console.log("RecordDetailStore full "+records.count());
			records=records.filter(function(record,recordId){
				if(record.get("age") && record.get("age")<=currDelCount+10){
					count++;
					return false;
				}else{
					return true;
				}
			});
			currDelCount+=count;
			console.log("RecordDetailStore cleaned "+records.count()+" cleaned "+count);
		}
	}

});

RecordDetailStore.dispatchToken = Dispatcher.register(function(action) {
	
	
	switch(action.type) {
	
	case ActionTypes.RECEIVE_SCHEMA_RECORDS:
		RecordDetailStore.receiveSchemaRecords(action.data);
		RecordDetailStore.emitChange();
		break;

	case ActionTypes.RECEIVE_SCHEMA_RECORD:
		RecordDetailStore.receiveSchemaRecord(action.data);
		RecordDetailStore.emitChange();
		break;
		
	case ActionTypes.CREATE_RECORD:
		//RecordDetailStore.createRecord(action.record);
		//RecordDetailStore.emitChange();
		break;
		
	case ActionTypes.UPDATE_RECORD:
		RecordDetailStore.updateRecord(action.recordId,action.method);
		RecordDetailStore.emitChange();
		break;
		
	default:
		// do nothing
	}

});

RecordDetailStore.setMaxListeners(100);
module.exports = RecordDetailStore;
