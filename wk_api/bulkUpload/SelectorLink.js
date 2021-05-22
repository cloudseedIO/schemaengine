var SelectorLink = {
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
			console.error(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt')|| data.selector.includes('has')|| data.selector.includes('not')));
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt')|| data.selector.includes('has'))){
				elements = window.jQuery(data.selector);
			}else{
				elements = document.querySelectorAll(data.selector);
			}
			
		}else{
			console.log(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt')));
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt')|| data.selector.includes('has') || data.selector.includes('not'))){
				elements = window.jQuery(data.selector)[0];
				console.error("Jquery selector");
			}else{
				console.error("Error Jquery selector");
				elements = document.querySelector(data.selector);
			}
		}
		/*
		if(data.multiple){
			elements = document.querySelectorAll(data.selector);
			console.log("elements found: "+elements);
			
		}else{
			elements = document.querySelector(data.selector);
		}*/
		//this.echo('elements: '+elements);
		if(elements != null){
			console.log("elements not null");
			
			if(data.multiple && elements.length > 0){
				//console.log("elements length>0", elements.length);
				//console.log(elements[0]);
				//var dd = Array.prototype.map.call([12,34,345,5456,4565,7567,5], function(d){ console.log(d); return d;});
				//console.log(dd);
				
				var eleCnt = elements.length;
				
				for(var eleIndx =0; eleIndx<eleCnt; eleIndx++){
					var element = elements[eleIndx];
					
					//console.log("map fn", element);
					var record = {};
					//record[data.id] = element.textContent.trim();
					record._followSelectorId = data.id;
					record[data.id + '-href'] = element.href;
					record._follow = element.href;
					//console.log(record);
					links.push(record);
				}
				/*
				links = Array.prototype.map.call(elements, function(element){
					console.log("map fn", element);
					var record = {};
					//record[data.id] = element.textContent.trim();
					record._followSelectorId = data.id;
					record[data.id + '-href'] = element.href;
					record._follow = element.href;
					console.log(record);
					return record;
				});
				*/
			}else{
				var record = {};
				record[data.id] = elements.textContent?elements.textContent.trim():elements.textContent;
				record._followSelectorId = data.id;
				record[data.id + '-href'] = elements.href;
				record._follow = elements.href;
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

exports.SelectorLink=SelectorLink;