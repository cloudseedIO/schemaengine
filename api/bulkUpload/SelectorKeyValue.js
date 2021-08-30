/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/



var SelectorKeyValue = {

	canReturnMultipleRecords: function () {
		return true;
	},

	canHaveChildSelectors: function () {
		return false;
	},

	canHaveLocalChildSelectors: function () {
		return false;
	},

	canCreateNewJobs: function () {
		return false;
	},
	willReturnElements: function () {
		return false;
	},
	getData:function(data){
		
		var textCon="";
		var record = {};
		var elements =[];
		var keySelector=data.keysSelector;
		var valueSelector = data.valuesSelector;
		var resJson={};
		
		if(data.visibleCss && data.click){
			document.querySelector(data.visibleCss).click();
		}else if(data.visibleCss && data.display){
			document.querySelector(data.visibleCss).style.display="block";
		}
		
		if(data.multiple){
			if(window.jQuery && data.selector.includes('contains')){
				elements = window.jQuery(data.selector);
			}else{
				elements = document.querySelectorAll(data.selector);
			}
			
		}else{
			if(window.jQuery && data.selector&& data.selector.includes && data.selector.includes('contains')){
				elements = window.jQuery(data.selector)[0];
				console.log("Jquery selector");
			}else{
				console.log("Error Jquery selector");
				elements = document.querySelector(data.selector);
			}
		}
		
		if(elements != null){
			if(keySelector && valueSelector && data.searchInSelector){
				console.error(elements.length);
				for(var header=0; header<elements.length; header++){
					console.error(header);
					if(elements[header].querySelector(keySelector) && elements[header].querySelector(keySelector).style){
						elements[header].querySelector(keySelector).style.visibility="visible";
					}
					
					if(elements[header].querySelector(valueSelector) && elements[header].querySelector(valueSelector).style){
						elements[header].querySelector(valueSelector).style.visibility="visible";
					}
					
					
					
					var kTxt = elements[header].querySelector(keySelector)!=null ? elements[header].querySelector(keySelector).innerText: "";
					var vTxt = elements[header].querySelector(valueSelector)!= null ?elements[header].querySelector(valueSelector).innerText:"";
					
					resJson[kTxt]=vTxt;
					if(vTxt=="" || !vTxt || vTxt.length==0 || vTxt.contains("?")){
						var innerElements = elements[header].querySelector(valueSelector) !=null ?elements[header].querySelector(valueSelector).children:[];
						if(data.multipleChildren){
							innerElements = elements[header].querySelectorAll(valueSelector);
							console.error(innerElements?innerElements.length:"innerElements");
						}					
						
						vTxt="";
						var childrenCnt=innerElements.length;
						if(childrenCnt){
							for(var inner=0; inner<childrenCnt; inner++){
								var innerElement = innerElements[inner];
								if(innerElement.hasAttribute('alt') && innerElement.getAttribute('alt')){
									vTxt+=(innerElement.getAttribute('alt')+",");
								}else if(innerElement.hasAttribute('title') && innerElement.getAttribute('title')){
									vTxt+=(innerElement.getAttribute('title')+",");
								}else if(innerElement.hasAttribute('alt') && innerElement.getAttribute('alt')){
									vTxt+=(innerElement.getAttribute('alt')+",");
								}else if(innerElement.hasAttribute('data-original-title') && innerElement.getAttribute('data-original-title')){
									vTxt+=(innerElement.getAttribute('data-original-title')+",");
								}else{
									
								}
							}
							resJson[kTxt]=vTxt.replace(/,$/g,'');
						}
					}
					console.log("header: "+ (elements[header].querySelector(keySelector)!=null ? elements[header].querySelector(keySelector).innerText: ""));
					//console.log("Value: "+(elements[header].querySelector(valueSelector).innerText));
				}
				
				record[data.id] = resJson;
			}
			
			
		}else{
			console.error("Elements not found");
		}
		
		return record;
	},
	getDataColumns: function () {
		return [this.id];
	},

	getFeatures: function () {
		return ['multiple', 'regex', 'delay', 'inSingleRow']
	}
};

exports.SelectorKeyValue=SelectorKeyValue;