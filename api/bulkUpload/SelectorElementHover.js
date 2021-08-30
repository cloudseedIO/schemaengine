
var SelectorElementHover = {
	canReturnMultipleRecords: function () {
		return true;
	},

	canHaveChildSelectors: function () {
		return true;
	},

	canHaveLocalChildSelectors: function () {
		return false;
	},

	canCreateNewJobs: function () {
		return true;
	},
	willReturnElements: function () {
		return false;
	},
	getData: function (data) {
		
		var elements =[];
		var links=[];
		//var records=[];
		
		//data = {"parentSelectors":["_root"],"type":"SelectorLink","multiple":true,"id":"popUp","selector":"a.link-box.open-popup","delay":"1000"}
		if(data.multiple){
			if(window.jQuery && (data.selector.includes(':')|| data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt'))){
				console.error("multiple jQuery");
				elements = window.jQuery(data.selector);
				//console.error(elements);
			}else{
				console.error("multiple JavaScript");
				elements = document.querySelectorAll(data.selector);
			}
			
		}else{
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt'))){
				elements = window.jQuery(data.selector);
				console.log("Jquery selector");
			}else{
				console.log("Error Jquery selector, JavaScript");
				elements = document.querySelector(data.selector);
			}
		}
		//this.echo('elements: '+elements);
		if(elements != null){
			if(data.multiple && elements.length > 0){
				console.error("Found");
				for(var i=0; i<elements.length; i++){
					var element = elements[i];
					console.error("element: "+element.localName);
					
					var record = {};
					record[data.id] = element.localName;
					record._followSelectorId = data.id;
					//record[data.id + '-href'] = element.href;
					record._follow = location.href;
					record['elementType']=element.localName;
					record['css']=data.selector;
					record['elementIndex']=i;
					record['elementClick']=true;
					links.push(record);					
					
				}
				
				
				/* links = Array.prototype.map.call(elements, function(element){
					var record = {};
					record[data.id] = element.textContent.trim();
					record._followSelectorId = data.id;
					//record[data.id + '-href'] = element.href;
					record._follow = location.href;
					record['elementType']=element.localName;
					record['css']=data.selector;
					record['elementClick']=true;
					
					
					return record;
				}); */
			}else{
				var record = {};
				record[data.id] = element.textContent.trim();
				record._followSelectorId = data.id;
				record[data.id + '-href'] = element.href;
				record._follow = element.href;
				record['elementType']=element.localName;
				record['css']=data.selector
				record['elementClick']=true;
				links.push(record);
				
			}
			
		}
		return links;
	},

	getDataColumns: function () {
		return [this.id, this.id + '-href'];
	},

	getFeatures: function () {
		return ['multiple', 'delay']
	},

	getItemCSSSelector: function() {
		return "a";
	}
};

exports.SelectorElementHover=SelectorElementHover;