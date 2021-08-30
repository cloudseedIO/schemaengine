/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/


var SelectorPagination = {
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
		var self=this;
		var elements =[];
		var pagination=[];
		var paginate=true;
		
		//var records=[];
		
		/**
		* Utility functions
		*		
		*/
		function getValFromEle(element){
			var val="";
			if(window.jQuery && (element.includes('contains')|| element.includes('lt')|| element.includes('gt'))){
				element = $(element)[0];
			}else{
				element=document.querySelector(element);
			}
			
			switch(element.nodeName){
				case "INPUT":
					val=element.value;
					break;
				case "SPAN":
					val=element.textContent;
					val=val?val.trim():val;
					break;
				case "LI":
					val=element.textContent;
					val=val?val.trim():val;
					break;
				default:
					val=element.textContent;
					break;
			}
			return val;
		}
		
		function getParameterByName(name, url) {
			if (!url) url = window.location.href;
			if(!name)name="";
			name = name.replace(/[\[\]]/g, "\\$&");
			var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, " "));
		}
		
		
		//data = {"parentSelectors":["_root"],"type":"SelectorLink","multiple":true,"id":"popUp","selector":"a.link-box.open-popup","delay":"1000"}
		if(data.multiple){
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt'))){
				elements = $(data.selector);
			}else{
				elements = document.querySelectorAll(data.selector);
			}
			
		}else{
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt'))){
				elements = $(data.selector)[0];
			}else{
				elements = document.querySelector(data.selector);
			}
			
		}
		//this.echo('elements: '+elements);
			if(data.condition){
				//data={"parentSelectors":["p-links"],"type":"SelectorPagination","mutliple":false,"id":"pagination","selector":"div.floatleft.next",
				//	   "condition":"number",
				//	   "leftElement":"input.page-input",
				//	  "rightElement":"span.nb-page",
				//	  "opr":"==",
				//	   "regex":"","delay":""}
				
				switch(data.condition){
					case "number":
						var leftOpr = data.leftElement;
						var rightOpr = data.rightElement;
						var opr = data.opr;
						leftOpr=getValFromEle(leftOpr);
						rightOpr=getValFromEle(rightOpr);
						if(eval(leftOpr+opr+rightOpr)){
							paginate=false;
						}
						
						break;
						
					case "element_exist":
						var element;
						if(window.jQuery && (data.elementCss.includes('contains')|| data.elementCss.includes('lt')|| data.elementCss.includes('gt'))){
							element = $(data.elementCss)[0];
						}else{
							element = document.querySelector(data.elementCss);
						}
						
						if(element == null){
							paginate=false;
						}
						break;
						
						
						
				}
				
			}
			//document.querySelector(data.paginateIndex).value = (getValFromEle(data.paginateIndex)*1)+1;
			switch(data.paginationType){
				case "number":
					if(paginate){
						var record = {};
						record[data.id] = elements.textContent.trim();
						record._followSelectorId = data.paginateFrom;
						//record[data.id + '-href'] = element.href;
						record._follow = location.href;
						record['elementType']=elements.localName;
						record['css']=data.selector;
						record['elementClick']=true;
						record['pagination']=true;
						record['paginate']=true;
						record['parentSelectors']=[data.paginateFrom];
						record['paginateIndex']=getValFromEle(data.paginateIndex);
						record['paginateCss']=data.paginateIndex;

						pagination.push(record);
					}
					break;
				case "element_exist":
				case "storeNextBtnURL":
					if(paginate){
						if(data.queryParamName){
							var url = window.location.href;
							var currPI = getParameterByName(data.queryParamName, url)*(1);
							var followURL ;
							var nextPI=0;
							
							if(data.incrmtBy){
								nextPI = currPI+data.incrmtBy;
							}
							if(getParameterByName(data.queryParamName, url) == null){
								followURL = url.concat("&"+data.queryParamName+"="+nextPI);
							}else{
								followURL = url.replace(data.queryParamName+"="+currPI, data.queryParamName+"="+nextPI);
							}
							
							
							var record = {};
							record[data.id] = elements.textContent.trim();
							record._followSelectorId = data.paginateFrom;
							//record[data.id + '-href'] = element.href;
							record._follow = followURL;
							record['elementType']=elements.localName;
							record['css']=data.selector;
							//record['elementClick']=true;
							record['pagination']=true;
							record['paginate']=true;
							record['parentSelectors']=[data.paginateFrom];
							record['paginateIndex']=getValFromEle(data.paginateIndex) *1+1;
							record['paginateCss']=data.paginateIndex;

							pagination.push(record);
							
							
						}else if(data.paginationType == 'storeNextBtnURL'){
							
							var nextPageURL ;
							if(window.jQuery && (data.elementCss.includes('contains')|| data.elementCss.includes('lt')|| data.elementCss.includes('gt'))){
								nextPageURL= $(data.elementCss)[0];
							}else{
								nextPageURL= document.querySelector(data.elementCss);
							}
							if(nextPageURL != null){
								nextPageURL = nextPageURL.href;
								var record = {};
								record[data.id] = elements.textContent.trim();
								record._followSelectorId = data.paginateFrom;
								//record[data.id + '-href'] = element.href;
								record._follow = nextPageURL;
								record['elementType']=elements.localName;
								record['css']=data.selector;
								//record['elementClick']=true;
								record['pagination']=true;
								record['paginate']=true;
								record['parentSelectors']=[data.paginateFrom];
								record['paginateIndex']=getValFromEle(data.paginateIndex) *1+1;
								record['paginateCss']=data.paginateIndex;
							}
							
							

							pagination.push(record);
							
						}
					}
					break;
				case "eleClickPagination":
					if(paginate){
						var url = window.location.href;
						
						var followURL ;
						var nextPI=0;

												
						
						
						var record = {};
						record[data.id] = elements.textContent.trim();
						record._followSelectorId = data.paginateFrom;
						//record[data.id + '-href'] = element.href;
						record._follow = url;
						record['elementType']=elements.localName;
						record['css']=data.selector;
						record['elementClick']=true;
						record['pagination']=true;
						record['paginate']=true;
						record['parentSelectors']=[data.paginateFrom];
						record['paginateIndex']=getValFromEle(data.paginateIndex);
						//record['lable']=getValFromEle(data.lableCSS);
						record['paginateCss']=data.paginateCss;

						pagination.push(record);
					}
					break;
				case "labelClickPagination":
					if(paginate){
						var url = window.location.href;
						var currPI = getParameterByName(data.queryParamName, url)*(1);
						var followURL ;
						var nextPI=0;

						if(data.incrmtBy){
							nextPI = currPI+data.incrmtBy;
						}
						if(getParameterByName(data.queryParamName, url) == null){
							followURL = url.concat("&"+data.queryParamName+"="+nextPI);
						}else{
							followURL = url.replace(data.queryParamName+"="+currPI, data.queryParamName+"="+nextPI);
						}
						
						
						
						var record = {};
						record[data.id] = elements.textContent.trim();
						record._followSelectorId = data.paginateFrom;
						//record[data.id + '-href'] = element.href;
						record._follow = followURL;
						record['elementType']=elements.localName;
						record['css']=data.selector;
						record['elementClick']=true;
						record['pagination']=true;
						record['paginate']=true;
						record['parentSelectors']=[data.paginateFrom];
						record['paginateIndex']=getValFromEle(data.paginateIndex);
						record['lable']=getValFromEle(data.lableCSS);
						record['paginateCss']=data.paginateIndex;

						pagination.push(record);
					}
					break;
					
					
			}		
		
		return pagination;
	},
	getParameterByName: function(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
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

exports.SelectorPagination=SelectorPagination;