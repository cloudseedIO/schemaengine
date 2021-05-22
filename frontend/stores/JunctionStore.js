var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var common = require('../components/common.jsx');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'JSChange';


//var junctions = {}
var Immutable = require('immutable');
var junctions = Immutable.Map();

var age=1;
var currDelCount=1;



var JunctionStore = assign({}, EventEmitter.prototype, {

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
		//return junctions[recordId];
		if(junctions.has(recordId)){
			return junctions.get(recordId).toJSON();
		}else{
			return undefined;
		}
	},

	getAll: function() {
		//return junctions;
		return junctions.toJSON();
	},
	putAll:function(recs){
		//junctions=recs;
		junctions=Immutable.fromJS(recs);
	},
	clearJunctionsForRecord:function(recordId){
		var self=this;
		if(junctions.has(recordId))
		junctions.get(recordId).map(function(value,key){
			if(junctions.hasIn([recordId,key]))
			junctions.getIn([recordId,key]).map(function(value2,key2){
				self.clearJunctionsForRecord(key2);
			});
		});
		junctions=junctions.remove(recordId)
	},
	clear:function(){
		this.removeAllChangeListeners();
		//junctions = {}
		junctions=junctions.clear();
		age=1;
		currDelCount=1;
	},
	clearAll:function(){
		junctions=junctions.clear();
	},
	/*receiveRelated:function(data){//delete this
		if(typeof junctions[data.recordId] == "undefined"){
			junctions[data.recordId]={};
		}
		if(typeof junctions[data.recordId][data.relationName] == "undefined"){
			junctions[data.recordId][data.relationName]=[];
		}
		for(var i=0;i<data.related.length;i++){
			junctions[data.recordId][data.relationName].push(data.related[i].value);
		}
		junctions[data.recordId][data.relationName] = junctions[data.recordId][data.relationName].filter(function(item, pos) {
			return junctions[data.recordId][data.relationName].indexOf(item) == pos;
		})
	},*/
	receiveRelatedRecords:function(data){
		//this.monitorStore();
		/*if(typeof junctions[data.recordId] == "undefined"){
			junctions[data.recordId]={};
		}
		if(typeof junctions[data.recordId][data.relationName] == "undefined"){
			junctions[data.recordId][data.relationName]={};
		}*/
		try{
			if(junctions.getIn([data.recordId,data.relationName])){
				var curr=junctions.getIn([data.recordId,data.relationName]).filter(function(a,b){
					if(a.get("recordNo")>=(data.skip?data.skip:0) || 
							a.get("recordNo")<=((data.skip?data.skip:0)*1+data.related.records.length)){
						return false;
					}else{
						return true;
					}
				}); 
				junctions=junctions.setIn([data.recordId,data.relationName],curr);
			}
			for(var i=0;i<data.related.records.length;i++){
				/*junctions[data.recordId][data.relationName][data.related.records[i].id]={
					id:data.related.records[i].id,
					schema:data.related.schema["@id"],
					org:data.org,
					value:data.related.records[i].value,
					methods:data.related.records[i].methods,
					relatedSchemas:data.related.relatedSchemas,
					viewName:data.related.viewName,
					age:age++
				};*/
				//if(!junctions.hasIn([data.recordId,data.relationName,data.related.records[i].id])){
					junctions=junctions.setIn([data.recordId,data.relationName,data.related.records[i].id],Immutable.fromJS({
						id:data.related.records[i].id,
						schema:data.related.schema["@id"],
						org:data.org,
						value:data.related.records[i].value,
						methods:data.related.records[i].methods,
						relatedSchemas:data.related.records[i].relatedSchemas,
						viewName:data.related.viewName,
						age:age++,
						recordNo:(data.skip?data.skip:0)+i+1
					}))
				//}
			}
			this.emit(data.recordId+"-"+data.relationName);
		}catch(err){}
		
		
		
		
		
	},
	createJunctionRecord:function(record){
		//this.monitorStore();
		for(var i=0;i<record.relationDesc.length;i++){
			/*if(typeof junctions[record[record.relationDesc[i].split("-")[0]]]=="undefined"){
				junctions[record[record.relationDesc[i].split("-")[0]]]={};
			}
			if(typeof junctions[record[record.relationDesc[i].split("-")[0]]] [record.relationDesc[i].split("-")[1]] == "undefined"){
				junctions[record[record.relationDesc[i].split("-")[0]]] [record.relationDesc[i].split("-")[1]]={};
			}*/
			/*junctions[record[record.relationDesc[i].split("-")[0]]] [record.relationDesc[i].split("-")[1]][record.recordId]={
					id:record.recordId,
					schema:record.docType,
					org:record.org,
					value:record,
					methods:[],
					relatedSchemas:[],
					viewName:"getDetail",
					age:age++
			}*/
			junctions=junctions.setIn([record[record.relationDesc[i].split("-")[0]],record.relationDesc[i].split("-")[1],record.recordId],Immutable.fromJS({
					id:record.recordId,
					schema:record.docType,
					org:record.org,
					value:record,
					methods:[],
					relatedSchemas:[],
					viewName:"getDetail",
					age:age++
			}));
			this.emit(record[record.relationDesc[i].split("-")[0]]+"-"+record.relationDesc[i].split("-")[1]);
		}
		
	},
	/*getRelated: function(recordId,relationName,skip) {//delete this
		if(typeof junctions[recordId]=="undefined" || typeof junctions[recordId][relationName]=="undefined"){
			return [];
		}
		return junctions[recordId][relationName].slice(skip).splice(0,9);
	},*/
	getRelatedRecords: function(data) {
		//recordId,relationName,rootSchema,relationRefSchema,userId,skip,org
		var limitCount=require("../utils/global.js").limitCount//9;
		if(!isNaN(data.limit)){
			limitCount=data.limit*1;
		}
		//if need more records than default limit count
		/*if(limit && !isNaN(limit*1)){
			limitCount=limit*1;
		}*/
		/*if(typeof junctions[data.recordId]=="undefined" || typeof junctions[data.recordId][data.relationName]=="undefined"){
			return [];
		}
		var keys=Object.keys(junctions[data.recordId][data.relationName]);
		if(typeof data.skip !="undefined"){
			keys=keys.slice(data.skip).splice(0,10)
		}
		var records=[];
		for(var i=0;i<keys.length;i++){
			var temp=junctions[data.recordId][data.relationName][keys[i]];
			delete temp.age;
			records.push(temp);
		}
		return records;*/
		var records=junctions.getIn([data.recordId,data.relationName]);
		if(!records){
			return [];
		}
		var skipCount=0
		if(typeof data.skip !="undefined"){
			skipCount=data.skip*1
		}
		
		
		return records.filter(function(record,recordId){
			if(!record.has("recordNo")){
				return true;
			}
			if(record.get("recordNo")>skipCount  && record.get("recordNo")<=(skipCount+limitCount+1)){
				return true;
			}else{
				return false;
			}
		}).take(limitCount+1).map(function(record,recordId){
			return record.delete("age").toJSON();
		}).toArray().sort(function(a,b) {
			  if (a.recordNo < b.recordNo)
				    return -1;
				  if (a.recordNo> b.recordNo)
				    return 1;
				  return 0;
		});
		
		
		/*return records.skip(skipCount).take(10).map(function(record,recordId){
			return record.delete(age).toJSON();
		}).toArray();*/
	},
	updateRecord:function(recordId,method){
		if(method=="HardDelete"){
			/*
			delete junctions[recordId];
			for (var recId in junctions) {
				for(var relation in junctions[recId]){
					delete junctions[recId][relation];
				}
			}
			*/
			junctions=junctions.filter(function(record,id){
				if(recordId==id){
					return  false;
				}else{
					return true;
				}
			});
			var rels=[];
			junctions=junctions.map(function(record,id){
				return record.map(function(relrecs,rel){
					return relrecs.filter(function(rr,rrid){
						if(rrid==recordId){
							rels.push(rel);
							return false;
						}else{
							return true;
						}
					});
				});
			})
			for(var i=0;i<rels.length;i++){
				this.emit(recordId+"-"+rels[i]);
			}
		}
	},
	monitorStore:function(){
		var storeLimit=100;
		try{
			storeLimit=common.getConfigDetails().storeLimits.junctionStoreLimit;
		}catch(err){}
		
		/*if(Object.keys(junctions).length>storeLimit){
			var count=0;
			for (var key in junctions) {
				if(junctions[key] && junctions[key].age && junctions[key].age<=currDelCount+10){
					delete junctions[key];
					count++;
					currDelCount++;
					if(count==10){
						break;
					}
				}
			}
		}*/
		if(age>storeLimit){
			var count=0;
			console.log("JunctionStore full "+junctions.count());
			junctions=junctions.map(function(record,id){
				return record.map(function(relrecs,rel){
					return relrecs.filter(function(rr,rrid){
						if(rr.get("age") && rr.get("age")<=currDelCount+10){
							count++;
							return false;
						}else{
							return true;
						}
					});
				});
			});
			currDelCount+=count;
			console.log("JunctionStore cleaned "+junctions.count()+" cleaned "+count);
		}
	}

});

JunctionStore.dispatchToken = Dispatcher.register(function(action) {
	
	
	switch(action.type) { 
		//case ActionTypes.RECEIVE_RELATED:
		//	JunctionStore.receiveRelated(action.data);
		//	JunctionStore.emitChange();
		//	break;

		case ActionTypes.RECEIVE_RELATED_RECORDS:
			JunctionStore.receiveRelatedRecords(action.data);
			//JunctionStore.emitChange();
			break;
		case ActionTypes.CREATE_JUNCTION_RECORD: 
			JunctionStore.createJunctionRecord(action.record);
			//JunctionStore.emitChange();
			break;
		case ActionTypes.CREATE_RECORD:
			if(action.record.relationDesc){
				JunctionStore.createJunctionRecord(action.record);
				//JunctionStore.emitChange();
			}
			break;

		case ActionTypes.UPDATE_RECORD:
			JunctionStore.updateRecord(action.recordId,action.method);
			//JunctionStore.emitChange();
			break;
			
		default:
		// do nothing
	}

});

JunctionStore.setMaxListeners(100);
module.exports = JunctionStore;
