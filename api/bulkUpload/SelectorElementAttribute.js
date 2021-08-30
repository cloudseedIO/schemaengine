var SelectorElementAttribute = {
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
		var result={};
		//var records=[];
		
		//data = {"parentSelectors":["_root"],"type":"SelectorLink","multiple":true,"id":"popUp","selector":"a.link-box.open-popup","delay":"1000"}
		if(data.multiple){
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt')|| data.selector.includes(':'))){
				elements = window.jQuery(data.selector);
			}else{
				elements = document.querySelectorAll(data.selector);
			}
			
		}else{
			if(window.jQuery && (data.selector.includes('contains')|| data.selector.includes('lt')|| data.selector.includes('gt')|| data.selector.includes(':'))){
				elements = window.jQuery(data.selector)[0];
				console.log("Jquery selector");
			}else{
				console.log("Error Jquery selector");
				elements = document.querySelector(data.selector);
			}
		}
		//this.echo('elements: '+elements);
		if(elements != null){
			if(data.multiple && elements.length > 0){
				var eleCnt = elements.length;
				var links =[];
				for(var eleIndx =0; eleIndx<eleCnt; eleIndx++){
					var element = elements[eleIndx];
					if(data.extractAttribute == 'href'){
						var href = element.getAttribute(data.extractAttribute);
						if(element.href){
							href=element.href;
						}
						if(href.indexOf("//") == 0){
							href ="http:"+href;
							console.error("changed: ", href);
						}
						try{
							href = new URL(href).href;
						}catch(e){
							href = new URL(window.location.origin+href).href;
						}
						console.error(href);
						if(data.generateLink){
							var record = {};
							//record[data.id] = element.textContent.trim();
							record._followSelectorId = data.id;
							record[data.id + '-href'] = element.href;
							record._follow = element.href;
							//console.log(record);
							links.push(record);
							
						}else{
							links.push(href);
						}
					}else{
						if(data.generateLink){
							var record = {};
							//record[data.id] = element.textContent.trim();
							record._followSelectorId = data.id;
							record[data.id + '-href'] = element.getAttribute(data.extractAttribute);
							record._follow = element.getAttribute(data.extractAttribute);
							//console.log(record);
							links.push(record);
						}else{
							links.push(element.getAttribute(data.extractAttribute));
						}
					}
					
					
				}
				
				/*
				var links = Array.prototype.map.call(elements, function(element){
					var record = {};
					//record[data.id] = element.textContent.trim();
					//record._followSelectorId = data.id;
					//record[data.id + '-href'] = element.href;
					//record._follow = element.href;
					if(data.extractAttribute == 'href'){
						var href = element.getAttribute(data.extractAttribute);
						try{
							href = new URL(href).href;
						}catch(e){
							href = new URL(window.location.origin+href).href;
						}
						return href;
					}
					return element.getAttribute(data.extractAttribute);
				});
				*/
				result[data.id]=links.toLocaleString();
				if(data.extractAttribute == 'href'){
					result[data.id]=links;
				}
			}else{
				//var record = {};
				if(data.extractAttribute == 'href' || data.extractAttribute ==  'srcset'){
					var href = elements.getAttribute(data.extractAttribute);
					if(elements.href){
						href=elements.href;
					}
					if(href.indexOf("//") == 0){
						href ="http:"+href;
						console.error("changed: ", href);
					}
					
					try{
						result[data.id] = new URL(href).href;
					}catch(e){
						result[data.id] = new URL(window.location.origin+href).href;
					}
					console.error(result[data.id]);
				}else{
					result[data.id] = elements.getAttribute(data.extractAttribute);
					console.error(result[data.id]);
				}
				
				//record._followSelectorId = data.id;
				//record[data.id + '-href'] = elements.href;
				//record._follow = elements.href;
				//links.push(record);
				if(data.regex && data.regex!=""){
					console.error("match: ", typeof result[data.id].match);
					if(typeof result[data.id].match != undefined){
						console.error("const", result[data.id], typeof result[data.id],  result[data.id].constructor);
						console.error(result[data.id].match(data.regex));
						result[data.id] = result[data.id].match(data.regex);
						console.error("final: ", result[data.id][0]);
					}
					
				}
				
				
				if(data.resultAttrib && data.resultAttrib!=""){
					console.error("match: ", typeof result[data.id].match);
					if(result[data.id][data.resultAttrib]){
						
						console.error("const", result[data.id], typeof result[data.id],  result[data.id].constructor);
						console.error(result[data.id].match(data.regex));
						result[data.id] = result[data.id][data.resultAttrib];
						if(data.resRegex){
							result[data.id] = result[data.id].match(data.resRegex);
						}
						
						console.error("final: ", result[data.id][0]);
					}
					
				}
				
				
			}
			
		}
		return result;
		
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

exports.SelectorElementAttribute=SelectorElementAttribute;

