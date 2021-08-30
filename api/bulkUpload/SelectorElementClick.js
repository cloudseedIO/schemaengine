/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/



var SelectorElementClick = {
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
		//var util={
			function getElementXpath(elm) {
				console.error("getElementXpath");
				var allNodes = document.getElementsByTagName('*'); 
				for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) 
				{ 
					if (elm.hasAttribute('id')) { 
							var uniqueIdCount = 0; 
							for (var n=0;n < allNodes.length;n++) { 
								if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++; 
								if (uniqueIdCount > 1) break; 
							}; 
							if ( uniqueIdCount == 1) { 
								segs.unshift('id("' + elm.getAttribute('id') + '")'); 
								return segs.join('/'); 
							} else { 
								segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]'); 
							} 
					} else if (elm.hasAttribute('class')) { 
						segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]'); 
					} else { 
						for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) { 
							if (sib.localName == elm.localName)  i++; }; 
							segs.unshift(elm.localName.toLowerCase() + '[' + i + ']'); 
					}; 
				}; 
				return segs.length ? '/' + segs.join('/') : null; 
			}
		//};
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
					try{
						record['elementXpath']=getElementXpath(element);
					}catch(e){
						console.error("Exception raised");
						console.error(e);
					}
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
				record['elementXpath']=util.getElementXpath(element);
				record['elementClick']=true;
				links.push(record);
				
			}
			
		}
		console.error("Returning");
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

exports.SelectorElementClick=SelectorElementClick;