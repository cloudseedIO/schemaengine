var Dispatcher = require('../dispatcher/Dispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var ActionTypes = Constants.ActionTypes;
var CHANGE_EVENT = 'SearchStoreChange';


var Immutable = require('immutable');
var search = Immutable.Map();

var SearchStore = assign({}, EventEmitter.prototype, {
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
	get: function(searchText,schemaName) {
		var records=search.getIn([searchText,schemaName]);
		if(records){
			return records.toJSON();
		}else{
			return undefined;
		}
	},
	put:function(searchText,schemaName,records){
		search=search.setIn([searchText,schemaName],Immutable.fromJS(records));
	},
	getAll: function() {
		return search.toJSON();
	},
	putAll:function(s){
		search=Immutable.fromJS(s);
	},
	clear:function(){
		search=search.clear();
	},
	clearAll:function(){
		search=search.clear();
	}
});

SearchStore.dispatchToken = Dispatcher.register(function(action) {

  switch(action.type) {
    case "RECEIVE_SEARCH":
      SearchStore.receiveSearch(action.search);
      SearchStore.emitChange();
      break;
  }
});

SearchStore.setMaxListeners(100);

module.exports = SearchStore;
