/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/



var SelectorText = {

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
		
		if(data.multiple){
			if(window.jQuery && (data.selector.includes(':')|| data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt'))){
				console.error("multiple jQuery");
				elements = window.jQuery(data.selector);
				console.error(elements);
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
		
		if(elements != null){
			if(data.multiple && elements.length > 0){
				
				var eleCnt = elements.length;
				var links =[];
				for(var eleIndx =0; eleIndx<eleCnt; eleIndx++){
					var element = elements[eleIndx];
					links.push(element.innerText?element.innerText:element.textContent);
				}				
				record[data.id]=links.join('');//If we want use a special character to separate them
			}else{
				//var record = {};
				//record[data.id] = elements.textContent;
				if(!elements.innerText && elements[0]){
					elements =elements[0];
				}
				if(elements.innerText){
					record[data.id] = elements.innerText;
				}else{
					record[data.id] = elements.textContent;
				}
				
				//record._followSelectorId = data.id;
				//record[data.id + '-href'] = elements.href;
				//record._follow = elements.href;
				//links.push(record);
				
				if(data.regex!=""){
					var regex = new RegExp(data.regex);
					if(record[data.id].match(regex)){
						record[data.id] = record[data.id].match(regex)[0];
					}else{
						//record[data.id] = elements.match(regex)[0];
					}
					
				}
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

exports.SelectorText=SelectorText;