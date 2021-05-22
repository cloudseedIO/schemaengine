/**
 * @author V SAIKIRAN
 * @Date: 20-08-2015
 * 
 */

var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'change';

Date.prototype.getFullMonthName = function(){
	var currDate = this;
	return currDate.monthNames[currDate.getMonth()];
}
Date.prototype.getMonthName = function(){
	var currDate = this;
	return currDate.months[currDate.getMonth()];
}
Date.prototype.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
Date.prototype.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var toDay = new Date();
var msgRecords = {};
var _store = {
	moment: {
		todayYear: toDay.getFullYear(),
		todayMonth: toDay.getFullMonthName(),
		today: toDay.getDate(),
		moment: toDay,
		num: toDay.getMonth() + 1,
		name: toDay.getFullMonthName(),
		year: toDay.getFullYear(),
		records:[],
		totalRecords:{}
	},
	selectedDay: {
		year: null,
		month: null,
		num: null,
		tasks: [],
	},
	weekDays:[],
	monthDays:[]
};
var selectDay = function(data) {
	_store.selectedDay = {
		year: data.year,
		monthName: data.monthName,
		num: data.num,
		tasks: data.tasks,
	};

};
var updateMonth = function(update) {
	var newMonth = _store.moment.num + update;
	if(newMonth == 0) {
		_store.moment.year -= 1;
		_store.moment.num = 12;
		_store.moment.moment = new Date(
				_store.moment.year,
				_store.moment.num - 1
		);
		_store.moment.name = _store.moment.moment.getFullMonthName();
		_store.moment.records = _store.moment.totalRecords[_store.moment.num-1]?_store.moment.totalRecords[_store.moment.num-1]:[];

	}
	else if(newMonth == 13) {
		_store.moment.year += 1;
		_store.moment.num = 1;
		_store.moment.moment = new Date(
				_store.moment.year,
				_store.moment.num - 1
			);
		_store.moment.name = _store.moment.moment.getFullMonthName();
		_store.moment.records = _store.moment.totalRecords[_store.moment.num-1]?_store.moment.totalRecords[_store.moment.num-1]:[];
	}
	else {
		_store.moment.num += update;
		_store.moment.moment = new Date(
			_store.moment.year,
			_store.moment.num - 1
		);
		_store.moment.name = _store.moment.moment.getFullMonthName();
		_store.moment.records = _store.moment.totalRecords[_store.moment.num-1]?_store.moment.totalRecords[_store.moment.num-1]:[];
	}

};

var CalendarStore = assign({}, EventEmitter.prototype, {
	emitChange: function() {
		if(typeof localStorage!="undefined"){
			localStorage.setItem('recordSummary', JSON.stringify(msgRecords));
		}
		this.emit(CHANGE_EVENT);
	},
	addChangeListener: function(cb) {
		this.on(CHANGE_EVENT, cb);
	},
	removeChangeListener: function(cb) {
		this.removeListener(CHANGE_EVENT, cb);
	},
	getMoment: function() {
		return _store.moment;
	},
	getSearch: function() {
		return _store.search;
	},
	getSelected: function() {
		return _store.selectedDay;
	},
	getMonthRecords:function(year, month){
		var records = [];
		var totalRecords = Object.keys(_store.moment.totalRecords);
		for(var count=0; count<totalRecords.length; count++){
			var record = _store.moment.totalRecords[totalRecords[count]];
			if(record){
				var dt = record.value.dateCreated.split(" ");
				var date = dt[0].split("/");
				var time = dt[1];
				time = time.split(":");
				date = new Date(date[2], date[1]-1, date[0], time[0], time[1]);
				record['dt']=date;
				if(date.getFullYear() == year && date.getMonth()==month){
					records.push(record);
				}
			}
		}
		
		return records;
	},
	updateMonth:function(update){
		updateMonth(update);
	}
});

CalendarStore.dispatchToken = Dispatcher.register(function(action) {
	switch (action.type) {
	case ActionTypes.RECEIVE_SCHEMA_RECORDS:
		var schema=action.data.schema;
		var keys=[];
		if(schema["@views"]){
			var viewIndex=0;
			for(var i=0;i<schema["@views"].length;i++){
				if(schema["@views"][i].viewName=="summary"){
					viewIndex=i;
					break;
				}
			}
			keys=schema["@views"][viewIndex].key;	
		}

		for (var i=0;i<action.data.records.length && action.data.records[i].id.indexOf("Message")!=-1;i++) {
			for(var j=0;j<keys.length;j++){
				action.data.records[i].value[keys[j]]=action.data.records[i].key[j];
			}  

			msgRecords[action.data.records[i].id]={
					id:action.data.records[i].id,
					schema:action.data.schema["@id"],
					org:action.data.org,
					value:action.data.records[i].value,
					dependentSchema:action.data.dependentSchema,
					methods:[],
					relations:[],
					relatedSchemas:[],
					viewName:"getDetail"
			};
		}
		
		/*
		 * Below lines are to arrange data in a year, month format
		 * 
		var records = Object.keys(msgRecords);
		var rcrds = [];
		records.forEach(function(recordId){
			var record = msgRecords[recordId];
			var dt = record.value.dateCreated.split(" ");
			var date = dt[0].split("/");
			var time = dt[1];
			time = time.split(":");
			date = new Date(date[2], date[1]-1, date[0], time[0], time[1]);
			record['dt']=date;
			rcrds.push(record);
		});
		var yearGrp = groupBy(rcrds, function(record){
			   return [record.dt.getFullYear()];
		   });
		var monthGrp = groupBy(rcrds, function(record){
			   return [record.dt.getMonth()];
		   });
		var rcrds1 = {};
		monthGrp.forEach(function(month){
			rcrds1[month[0].dt.getMonth()]=month;
		});
		
		
		_store.moment.totalRecords = rcrds1;
		console.log(rcrds1);*/
		_store.moment.totalRecords = msgRecords;
		CalendarStore.emitChange();
		break;
		
	default://console.log(action);
		break;
	}
})
/*
* This is to group the elements based on passed key
* Added by saikiran.vadlakonda
* 
* */
function groupBy( array , f ){
	
    var groups = {};
    array.forEach( function( o ){
    	var group = JSON.stringify( f(o) );
    	groups[group] = groups[group] || [];
    	groups[group].push( o );
    });
    return Object.keys(groups).map( function( group ){
      return groups[group]; 
    })
}
CalendarStore.setMaxListeners(30);
module.exports = CalendarStore;