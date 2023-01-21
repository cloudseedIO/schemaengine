var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var SchemaStore = require('../stores/SchemaStore');
var assign = require('object-assign');
var global = require("../utils/global.js");
var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'RSSChange';

var common = require('../components/common.jsx');

//var records = {};
var Immutable = require('immutable');
var records = Immutable.Map();

var age=1;
var currDelCount=1;
var RecordSummaryStore = assign({}, EventEmitter.prototype, {

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
		/*for (var key in records) {
			if(!records[key].landing || records[key].landing!="landing"){
				delete records[key];
			}
		}*/
		
		var count=0;
		//Deleting all except landing records
		records=records.filter(function(record,recordId){
			if(!record.get("landing") || record.get("landing")!="landing"){
					count++;
					return false;
			}else{
				return true;
			}
		});
		currDelCount+=count;
		
	},
	clearAll:function(){
		records=records.clear();
	},
	clearByCloudPointId:function(cloudPointHostId){
		//currDelCount=1;age=1;records = Immutable.Map();

		var count=0;
		//Deleting only landing records with cloudpointhostid
		records=records.filter(function(record,recordId){
			if(record.get("cloudPointHostId") && record.get("cloudPointHostId")==cloudPointHostId && record.get("landing")=="landing"){
					count++;
					return false;
			}else{
				return true;
			}
		});
		currDelCount+=count;
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
				recordNo:1,
				schema:record.docType,
				org:record.org,
				value:record,
				methods:[],
				relatedSchemas:[],
				viewName:"getSummary",
				age:age++
			}));
		this.emit(record.docType);
	},
	receiveSchemaRecords:function(data){
		this.monitorStore();
		var schema=data.schema;
		/*var keys=[];
		if(schema["@views"]){
			var viewIndex=0;
			for(var i=0;i<schema["@views"].length;i++){
				if(schema["@views"][i].viewName=="summary"){
					viewIndex=i;
					break;
				}
			}
			keys=schema["@views"][viewIndex].key;	
		}*/
		
		/*if(data.skip && data.skip!=0 &&
				data.records[0] && 
				data.records[0].id && 
				records[data.records[0].id] && 
				records[data.records[0].id].recordNo){
			data.skip=records[data.records[0].id].recordNo*1-1;			
		}else if(data.skip==undefined){
			data.skip=0;
		}*/
		if(data.skip && data.skip!=0 &&
				data.records[0] && 
				data.records[0].id && 
				records.get(data.records[0].id) && 
				records.get(data.records[0].id).get("recordNo")){
			data.skip=records.get(data.records[0].id).get("recordNo")*1-1;			
		}else if(data.skip==undefined){
			data.skip=0;
		}
		
		for (var i=0;i<data.records.length;i++) {
			if(data.records[i].value.dependentProperties){
				for(var key in data.records[i].value.dependentProperties){
					data.records[i].value[key]=data.records[i].value.dependentProperties[key];
				}
			}
			/*for(var j=0;j<keys.length;j++){
				if(!data.records[i].value[keys[j]]){
					data.records[i].value[keys[j]]=data.records[i].key[j];
				}
			}*/ 
			var landing=data.landing;
			/*for(rk in records){
				if(records[rk].schema==data.schema["@id"] && records[rk].recordNo==(data.skip+i+1)){
					if(!records[rk].landing || records[rk].landing!="landing"){
						
					}else{
						landing="landing";
					}
					delete records[rk];
				}
			}*/
			/*records[data.records[i].id]={
					id:data.records[i].id,
					recordNo:data.skip+i+1,
					schema:data.schema["@id"],
					org:data.org,
					value:data.records[i].value,
					dependentSchema:data.dependentSchema, 
					landing:landing,
					methods:[],
					relations:[],
					relatedSchemas:[],
					viewName:"getSummary",
					age:age++
			};*/
			var recordNo=data.skip+i+1;
			records=records.filter(function(record,id){
				if(data.noOrder){
					return true;
				}
				if(record && 
						record.get("recordNo") && 
						record.get("recordNo")==recordNo &&
						!record.get("landing") && 
						record.get("schema") &&
						record.get("schema")==data.schema["@id"]){
					return false;
				}else{
					return true;
				}
			});
			/*if(records.has(data.records[i].id)){
				records=records.delete(data.records[i].id);
			}*/
			
			records=records.set(data.records[i].id,Immutable.fromJS({
					id:data.records[i].id,
					recordNo:data.noOrder?(data.skip+1):recordNo,
					schema:data.schema["@id"],
					org:data.org,
					value:data.records[i].value,
					dependentSchema:data.dependentSchema, 
					landing:data.landing,
					cloudPointHostId:data.cloudPointHostId,
					methods:[],
					relations:[],
					relatedSchemas:[],
					viewName:"getSummary",
					age:age++
			}));
		}
		this.emit(schema["@id"]);
	},
	getSchemaRecords: function(data) {
		//schema,flts,dependentSchema,org,userId,skip,limit,noOrder
		var filters={};
		//stringifying and parsing so that to have immutability on reference object
		try{filters=JSON.parse(JSON.stringify(data.filters));}catch(err){}
		
		var limitCount=global.summaryLimitCount//9;
		//if need more records than default limit count
		if(data.limit && !isNaN(data.limit)){
			limitCount=data.limit*1;
		}
		
		
		var schemaDoc=SchemaStore.get(data.schema);
    	if(data.dependentSchema){
			var dsRec=SchemaStore.get(data.schema+"-"+data.dependentSchema);
			if(dsRec){
				schemaDoc=global.combineSchemas(schemaDoc,dsRec);
			}
		}
		/*if(schemaDoc && 
				schemaDoc["@views"] && 
				Array.isArray(schemaDoc["@views"]) && 
				filters && 
				filters.constructor==Object){//requested records schema is having summary view and filters object is passed
			var viewIndex=0;
			for(var i=0;i<schemaDoc["@views"].length;i++){
				if(schemaDoc["@views"][i].viewName=="summary"){
					viewIndex=i;
					break;
				}
			}
			var filterKeys=schemaDoc["@views"][viewIndex].key;//holds summary view  keys
			
			for(var i=0;i<Object.keys(filters).length;i++){
				if(Object.keys(filters)[i] !="author" && filterKeys.indexOf(Object.keys(filters)[i])==-1){//if filters object is having other filters which are not there in the view except author
					delete filters[Object.keys(filters)[i]];//delete the filter from filters object
				}
			}
		}*/
		
		if(filters && JSON.stringify(filters).indexOf("userId")!=-1){//if filters is having userId key replacing it with the actual user recordId|userId
			filters=JSON.parse(JSON.stringify(filters).replace("userId",data.userId));
			var navLinks=require("../stores/DefinitionStore").getNavigationLinks();
			if(navLinks.cloudPoint!="" && navLinks.cloudPointAdmin){
				filters=JSON.parse(JSON.stringify(filters).replace(data.userId,"admin"));
			}
			filters.userId=filters.author;//copying author filter to userId filter
			delete filters.author;//deleting author filter;
			//since the back end server script validates the filter with userId for record level security purpose 
		}
		
		var skipCount=0;
		//if skip is requested updating the default skip count
		if(data.skip && !isNaN(data.skip)){
			skipCount=data.skip*1;
		}
		
		var count=0;
		var schemaRecords = [];//holds the records to be sent 
		
		
		//looping through the records in the store
	/*	StoreRecordsLoop:
			for (var recordId in records) {
			//checking for the equality with the requested org, schema and dependentSchema 
			if (records[recordId].schema === data.schema && 
					records[recordId].org === data.org && 
					(data.dependentSchema?(records[recordId].dependentSchema==data.dependentSchema):true)) {
				
				//three conditions satisfied 1.org, 2.schema, 3.dependentSchema
				var validRecord=true;
				
				
				//if filters found in the request checking the records with the filters
				
				if(filters && Object.keys(filters).length>0){
					var filterKeys=Object.keys(filters);
					FiltersLoop:
					for(var kc in filterKeys){
						//if the current filter key is having keywords then check for the validity
						if(filterKeys[kc] && filters[filterKeys[kc]].length>0){
							
							//if the record is having this filter in its keys then process for keywords else confirm it is not a valid record
							if(typeof records[recordId].value[filterKeys[kc]] !="undefined" && records[recordId].value[filterKeys[kc]]!=null){
								//(filters[filterKeys[kc]].indexOf(records[recordId].value[filterKeys[kc]])>-1)
								
								//if record value for this filter is string or picklist picked key
								if(typeof records[recordId].value[filterKeys[kc]]=="string" ){
									if((filters[filterKeys[kc]].indexOf(records[recordId].value[filterKeys[kc]])==-1)){
										validRecord=false;
										break FiltersLoop;
									}
								}else{
									//if record value is array or multipicklist selection
									if(typeof records[recordId].value[filterKeys[kc]]=="object" && records[recordId].value[filterKeys[kc]] != null){
										MultipickListLoop: 
										for(var fin=0;fin<filters[filterKeys[kc]].length;fin++){
											if(records[recordId].value[filterKeys[kc]].indexOf(filters[filterKeys[kc]][fin])==-1){
												validRecord=false;
												break FiltersLoop;
											}
										}
									}
							   }
								
								
							}else{
								validRecord=false;
								break FiltersLoop;
							}
						}
					}
				}

				if(validRecord){
					if(records[recordId].recordNo>skipCount  && records[recordId].recordNo<=(skipCount+limitCount+1)){ 
						count++;
						var tempr=JSON.parse(JSON.stringify(records[recordId]));
						delete tempr.age;
						schemaRecords.push(tempr);
					}
					if(count==(limitCount+1)){ break; }
					
				}
			}
		}*/
		//return schemaRecords;
		
		
		
		
		return records.filter(function(record,recordId){
			//checking for the equality with the requested org, schema and dependentSchema 
			if (record.get("schema") === data.schema && 
					(record.get("org") === data.org || (data.org=="public" && record.get("$status")=="published")) && 
					(data.dependentSchema?(record.get("value").get(schemaDoc["@dependentKey"])==data.dependentSchema):true)) {
				
				//three conditions satisfied 1.org, 2.schema, 3.dependentSchema
				var validRecord=true;
				
				
				//if filters found in the request checking the records with the filters
				
				if(filters && Object.keys(filters).length>0){
					var filterKeys=Object.keys(filters);
					FiltersLoop:
					for(var kc in filterKeys){
						//added if filter is passed as string
						if(!Array.isArray(filters[filterKeys[kc]]) && filters[filterKeys[kc]]!=null && filters[filterKeys[kc]]!=undefined){
							filters[filterKeys[kc]]=[filters[filterKeys[kc]]];
						}
						//if the current filter key is having keywords then check for the validity
						if(filterKeys[kc] && Array.isArray(filters[filterKeys[kc]]) && filters[filterKeys[kc]].length>0){
							
							//if the record is having this filter in its keys then process for keywords else confirm it is not a valid record
							if(typeof record.get("value").get(filterKeys[kc]) !="undefined" && record.get("value").get(filterKeys[kc])!=null){
								//(filters[filterKeys[kc]].indexOf(record.value[filterKeys[kc]])>-1)
								
								//if record value for this filter is string or picklist picked key
								var colorKey=false;
								var numberKey=false;
								var booleanKey=false;
								try{
									if(schemaDoc["@properties"][filterKeys[kc]].dataType.type=="color"){
										colorKey=true;
									}
									if(schemaDoc["@properties"][filterKeys[kc]].dataType.type=="boolean"){
										booleanKey=true;
									}
									if(schemaDoc["@properties"][filterKeys[kc]].dataType.type=="number" || 
											(schemaDoc["@properties"][filterKeys[kc]].dataType.type=="array" && schemaDoc["@properties"][filterKeys[kc]].dataType.elements.type=="number")){
										numberKey=true;
									}
								}catch(err){}
								if(booleanKey){
									var bval=false;
									if(Array.isArray(filters[filterKeys[kc]]) && filters[filterKeys[kc]].length>0){
										bval=filters[filterKeys[kc]][0];
									}else{
										bval=filters[filterKeys[kc]];
									}
									var rbval=record.get("value").get(filterKeys[kc])?true:false;
									if(bval != rbval){
										validRecord=false;
										break FiltersLoop;
									}
								}else if(numberKey){
									if(Array.isArray(filters[filterKeys[kc]]) && filters[filterKeys[kc]].length>0){
										if(filters[filterKeys[kc]].length==1){
											filters[filterKeys[kc]].push(filters[filterKeys[kc]][0]);
										}
										if(schemaDoc["@properties"][filterKeys[kc]].dataType.type=="array" && 
												Array.isArray(record.get("value").get(filterKeys[kc]).toJSON()) ){
											var temnumvalue=record.get("value").get(filterKeys[kc]).toJSON();
											for(var fin=0;fin<temnumvalue.length;fin++){
												if(temnumvalue[fin]*1<filters[filterKeys[kc]][0] ||
														temnumvalue[fin]*1>filters[filterKeys[kc]][1]){
													validRecord=false;
													break FiltersLoop;
												}
											}
											
										}else{//minimum and maximum values given
											if(record.get("value").get(filterKeys[kc])*1<filters[filterKeys[kc]][0] ||
													record.get("value").get(filterKeys[kc])*1>filters[filterKeys[kc]][1]){
												validRecord=false;
												break FiltersLoop;
											}
										}
									}
								}else if(colorKey){
									var colorFltr="";
									if(Array.isArray(filters[filterKeys[kc]]) && filters[filterKeys[kc]].length>0){
										if(filters[filterKeys[kc]][0].split(" ").length==1){
											colorFltr=filters[filterKeys[kc]][0].split(" ")[0];
										}else if(filters[filterKeys[kc]][0].split(" ").length==2){
											colorFltr=filters[filterKeys[kc]][0].split(" ")[1];
										}else if(filters[filterKeys[kc]][0].split(" ").length>2){
											colorFltr=filters[filterKeys[kc]][0].split(" ")[2];
										}
									}else{
										colorFltr=filters[filterKeys[kc]];
									}
									colorFltr=colorFltr.toLowerCase();
									if(record.get("value").get(filterKeys[kc]).toLowerCase().indexOf(colorFltr)==-1){
										validRecord=false;
										break FiltersLoop;
									}
								}else if(typeof record.get("value").get(filterKeys[kc])=="string" ){
									if((filters[filterKeys[kc]].indexOf(record.get("value").get(filterKeys[kc]))==-1)){
										validRecord=false;
										break FiltersLoop;
									}
								}else{
									//if record value is array or multipicklist selection
									if(typeof record.get("value").get(filterKeys[kc])=="object" && record.get("value").get(filterKeys[kc]) != null){
										var foundFlag=false;
										MultipickListLoop: 
										for(var fin=0;fin<filters[filterKeys[kc]].length;fin++){
											if(record.get("value").get(filterKeys[kc]).indexOf(filters[filterKeys[kc]][fin])!=-1){
												foundFlag=true;
												//validRecord=false;
												//break FiltersLoop;
											}
										}
										if(!foundFlag){
											validRecord=false;
											break FiltersLoop;
										}
									}
							   }
								
								
							}else{
								validRecord=false;
								break FiltersLoop;
							}
						}
					}
				}

				if(validRecord){
					if(data.noOrder){
						return true;
					}
					if(record.get("recordNo")>skipCount  && record.get("recordNo")<=(skipCount+limitCount+1)){//&& count<=(limitCount+1) 
						count++;
						//delete record.age;
						//schemaRecords.push(record);
						return true;
					}else{
						return false
					}
				}else{
					return false;
				}
			}else{
				return false
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
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
	},
	updateRecord:function(recordId,method){
		if(method=="HardDelete"){
			//delete records[recordId];
			records=records.delete(recordId)
		}
	},
	monitorStore:function(){

		var storeLimit=100;
		try{
			storeLimit=common.getConfigDetails().storeLimits.recordSummaryStoreLimit;
		}catch(err){}
		
		/*if(Object.keys(records).length>storeLimit){
			var count=0;
			for (var key in records) {
				if(!records[key].landing || records[key].landing!="landing"){
					if(records[key] && records[key].age && records[key].age<=currDelCount+10){
						delete records[key];
						count++;
						currDelCount++;
						if(count==10){
							break;
						}
					}
				}
			}
		}*/
		if(records.count()>storeLimit){
			var count=0;
			//console.log("RecordSummaryStore full "+records.count());
			records=records.filter(function(record,recordId){
				if(!record.get("landing") || record.get("landing")!="landing"){
					if(record.get("age") && record.get("age")<=currDelCount+global.summaryLimitCount){
						count++;
						return false;
					}else{
						return true;
					}
				}else{
					return true;
				}
			});
			currDelCount+=count;
			//console.log("RecordSummaryStore cleaned "+records.count()+" cleaned "+count);
		}
	}

});

RecordSummaryStore.dispatchToken = Dispatcher.register(function(action) {
	
	switch(action.type) {

	case ActionTypes.RECEIVE_SCHEMA_RECORDS:
		RecordSummaryStore.receiveSchemaRecords(action.data);
		RecordSummaryStore.emitChange();
		break;


	case ActionTypes.CREATE_RECORD:
		RecordSummaryStore.createRecord(action.record);
		RecordSummaryStore.emitChange();
		break;
	case ActionTypes.UPDATE_RECORD:
		RecordSummaryStore.updateRecord(action.recordId,action.method);
		RecordSummaryStore.emitChange();
		break;

	default:
		// do nothing
	}

});

RecordSummaryStore.setMaxListeners(100);
module.exports = RecordSummaryStore;
