/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/



var SelectorLableClick = {
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
		
		if(data.multiple){
			elements = document.querySelectorAll(data.selector);
		}else{
			elements = document.querySelector(data.selector);
		}
		
		if(elements != null){
			if(data.multiple && elements.length > 0){
				var eleCnt = elements.length;
				
				for(var eleIndx =0; eleIndx<eleCnt; eleIndx++){
					var element = elements[eleIndx];
					var record = {};
					record[data.id] = element.textContent.trim();
					record._followSelectorId = data.id;
					//record[data.id + '-href'] = element.href;
					record._follow = location.href;
					record['elementType']=element.localName;
					record['lable']=element.textContent;
					record['elementClick']=true;
					links.push(record);
				}
			}else{
				var record = {};
				record[data.id] = element.textContent.trim();
				record._followSelectorId = data.id;
				record[data.id + '-href'] = element.href;
				record._follow = element.href;
				record['elementType']=element.localName;
				record['lable']=element.textContent;
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

exports.SelectorLableClick=SelectorLableClick;