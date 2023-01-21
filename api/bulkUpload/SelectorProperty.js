/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/


var SelectorProperty = {
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
		var elements =[];
		var properties=[];
		//var records=[];
		
		//data = {"parentSelectors":["_root"],"type":"SelectorLink","multiple":true,"id":"popUp","selector":"a.link-box.open-popup","delay":"1000"}
		if(data.multiple){
			elements = document.querySelectorAll(data.selector);
		}else{
			elements = document.querySelector(data.selector);
		}
		//this.echo('elements: '+elements);
		if(elements != null){
			if(data.multiple && elements.length > 0){
				var eleCnt = elements.length;
				var imageSrcs =[];
				for(var eleIndx =0; eleIndx<eleCnt; eleIndx++){
					var element = elements[eleIndx];
					imageSrcs.push(element[data.extractProperty]);
				}
				properties=[{}];
				properties[0][data.id]=imageSrcs;
				
			}else{
				var record = {};
				//record[data.id + '-src'] = elements[data.extractProperty];
				record[data.id] = elements[data.extractProperty];
				console.error("SelectorProperty");
				console.error(record[data.id]);
				console.error(elements[data.extractProperty], data.extractProperty);
				console.error("SelectorProperty");				
				if(data.regex && data.regex!="" && record[data.id].match){
					record[data.id] = record[data.id].match(data.regex)[0];
				}
				properties.push(record);
				
			}
			
		}
		
		return properties[0];
	},
	getDataColumns: function () {
		return [this.id + '-src'];
	},

	getFeatures: function () {
		return ['multiple', 'delay', 'downloadImage', 'inSingleRow']
	},

	getItemCSSSelector: function() {
		return "img";
	}
};


exports.SelectorProperty=SelectorProperty;