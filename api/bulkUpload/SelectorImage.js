
var SelectorImage = {
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
		var images=[];
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
				var imageSrcs =[];
				for(var eleIndx =0; eleIndx<eleCnt; eleIndx++){
					var element = elements[eleIndx];
					imageSrcs.push(element.currentSrc);
				}
				/*
				var imageSrcs = Array.prototype.map.call(elements, function(element){
					
					/*
					var record = {};
					record[data.id + '-src'] = element.src;
					record[data.id] = element.src;
					record._followSelectorId = data.id;
					record[data.id + '-href'] = element.href;
					record._follow = element.href;
					 
					return element.src;
				});
				*/
				images=[{}];
				images[0][data.id]=imageSrcs;
				
			}else{
				var record = {};
				//record[data.id + '-src'] = elements.src;
				//record[data.id] = elements.src;
				
				
				if(elements.src.indexOf('http') == -1){
					record[data.id + '-src'] = elements.currentSrc;
					record[data.id] = elements.currentSrc;
				}else{
					record[data.id + '-src'] = elements.currentSrc;
					record[data.id] = elements.currentSrc;
				}
				/*
				record._followSelectorId = data.id;
				record[data.id + '-href'] = element.href;
				record._follow = element.href;
				*/
				images.push(record);
				
			}
			
		}
		
		return images[0];
	},
	downloadFileAsBlob: function(url) {

		var deferredResponse = $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (this.readyState == 4) {
				if(this.status == 200) {
					var blob = this.response;
					deferredResponse.resolve(blob);
				}
				else {
					deferredResponse.reject(xhr.statusText);
				}
			}
		};
		xhr.open('GET', url);
		xhr.responseType = 'blob';
		xhr.send();

		return deferredResponse.promise();
	},

	downloadImageBase64: function(url) {

		var deferredResponse = $.Deferred();
		var deferredDownload = this.downloadFileAsBlob(url);
		deferredDownload.done(function(blob) {
			var mimeType = blob.type;
			var deferredBlob = Base64.blobToBase64(blob);
			deferredBlob.done(function(imageBase64) {
				deferredResponse.resolve({
					mimeType: mimeType,
					imageBase64: imageBase64
				});
			}.bind(this));
		}.bind(this)).fail(deferredResponse.fail);
		return deferredResponse.promise();
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


exports.SelectorImage=SelectorImage;