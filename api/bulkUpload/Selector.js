/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/


var Selector = function (selector) {
	this.updateData(selector);
	this.initType();
};

Selector.prototype = {

	/**
	 * Is this selector configured to return multiple items?
	 * @returns {boolean}
	 */
	willReturnMultipleRecords: function () {
		return this.canReturnMultipleRecords() && this.multiple;
	},

	/**
	 * Update current selector configuration
	 * @param data
	 */
	updateData: function (data) {
		var allowedKeys = ['id', 'type', 'selector', 'parentSelectors'];
		
		for (var key in data) {
			if (allowedKeys.indexOf(key) !== -1 || typeof data[key] === 'function') {
				this[key] = data[key];
			}
		}

		// remove values that are not needed for this type of selector
		for (var key in this) {
			if (allowedKeys.indexOf(key) === -1 && typeof this[key] !== 'function') {
				//alert("deleting:"+key);
				delete this[key];
			}
		}
	},

	/**
	 * CSS selector which will be used for element selection
	 * @returns {string}
	 */
	getItemCSSSelector: function() {
		return "*";
	},

	/**
	 * override objects methods based on seletor type
	 */
	initType: function () {
		
		if (global[this.type] === undefined) {
			throw "Selector type not defined " + this.type;
		}

		// overridding objects methods
		for (var i in global[this.type]) {
			//console.log("loop", window[this.type], i);
			this[i] = global[this.type][i];
		}
	},

	/**
	 * Check whether a selector is a paren selector of this selector
	 * @param selectorId
	 * @returns {boolean}
	 */
	hasParentSelector: function (selectorId) {
		return (this.parentSelectors.indexOf(selectorId) !== -1);
	},

	removeParentSelector: function (selectorId) {
		var index = this.parentSelectors.indexOf(selectorId);
		if(index !== -1) {
			this.parentSelectors.splice(index, 1);
		}
	},

	renameParentSelector: function (originalId, replacementId) {
		if (this.hasParentSelector(originalId)) {
			var pos = this.parentSelectors.indexOf(originalId);
			this.parentSelectors.splice(pos, 1, replacementId);
		}
	},

	getDataElements: function (parentElement) {

		var elements = ElementQuery(this.selector, parentElement);
		if (this.multiple) {
			return elements;
		}
		else if (elements.length > 0) {
			return [elements[0]];
		}
		else {
			return [];
		}
	},

	getData: function(parentElement) {
		if(this._getData){
			return this._getData(parentElement);
		}else{
			return null;
		}
	}
};

exports.Selector=Selector;
	
	