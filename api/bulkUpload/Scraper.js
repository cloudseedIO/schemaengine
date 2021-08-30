var Job = require('./Job').Job;
var fs = require('fs');
//var RecordDataProcessor = require('./RecordDataProcessor.js');

var Scraper = function (options) {
	console.log('options: '+Object.keys(options));
	this.queue = options.queue;
	this.sitemap = options.siteTemplate;
	this.postProcessorJson = options.postProcessorJson;
	fromPreview = options.fromPreview;
	this.scrapedRecords=[];
};


Scraper.prototype = {
	initFirstJob:function(){
		var url = this.sitemap.startUrl;
		var firstJob = new Job(url, "_root", this);
		this.queue.add(firstJob);
	},
	recordCanHaveChildJobs: function (record) {
		console.log("recordCanHaveChildJobs");
		console.log(record);
		if (record._follow === undefined) {
			return false;
		}

		var selectorId = record._followSelectorId;
		var childSelectors = this.sitemap.selectors.map(function(selector){
			if(selector['parentSelectors'].indexOf(selectorId)!=-1){
				return selector;
			}
		});
		
		
		 //this.sitemap.getDirectChildSelectors(selectorId);
		if (childSelectors.length === 0) {
			return false;
		}
		else {
			return true;
		}
	},
	run: function (executionCallback) {
		var scraper = this;
		var self=this;
		console.log(Date.now());
		
		
		// callback when scraping is finished
		this.executionCallback = executionCallback;
		/*var initData = fs.readFileSync(__dirname+"/config/initConfig.json");
		initData = initData.toString()
		console.log(initData);
		if(initData){
			initData=JSON.parse(initData);
		}
		
		console.log("initData length: "+(initData.jobs?initData.jobs.length:initData.length));
		
		if(initData.length){
			self.queue.reset();
			console.log("Reset Done");
		}
		var jobs=initData.jobs?initData.jobs:initData;
		var queueJobs=[];
		
		for(var jobIndex=0; jobIndex<jobs.length; jobIndex++){
			var record=jobs[jobIndex];	
			//console.log(jobIndex);
			var followSelectorId = record.parentSelector;
			var followURL = record['url'];

			var newJob = new Job(followURL, followSelectorId, self);
			queueJobs.push(newJob);
		}
		
		for(var qJob=queueJobs.length-1; qJob>=0;qJob--){
			self.queue.add(queueJobs[qJob]);
		}
		if(!jobs.length){
			console.log("No Jobs found from the last session");
			this.initFirstJob();
		}else{
			console.log("Session found, restoring from previous session");
			if(initData.siteMap){
				self.sitemap=initData.siteMap;
			}
			
		}*/
		scraper.initFirstJob();
		scraper._run();
		
	},
	_run:function(){
		var self=this;
		var job = self.queue.getNextJob();
		if (job === false) {
			console.log("Scraper execution is finished");
			/*fs.writeFile(__dirname+"/config/initConfig.json","", function(){
				console.log("Scrapping completed, so config cleared");
			});*/
			
			//console.log("Total Scraped Records:  "+JSON.stringify(self.scrapedRecords));
			///var date=new Date();
			
			//var fileName = ""+date.getFullYear()+"_"+(date.getMonth()+1)+"_"+date.getDate()+"_"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()+"_"+date.getMilliseconds();
			
			
			//fs.appendFile(__dirname+"/output/scrapedRecords_VSK_"+(fileName)+".json","\n"+(JSON.stringify(self.scrapedRecords)), function(){});
			self.executionCallback(self.scrapedRecords);
			return;
		}else{
			
			
			try{
				var chrome=self.chrome;
				
				
				job.execute(chrome, function(job){
					
					var records = job.getResults();
					//console.log(JSON.stringify(records));
					
					if(records && records.length){
					records.forEach(function (record, recInd) {
						if(record.paginate){
							console.log("Pagination rec: "+(JSON.stringify(record)));
						}
						//if(recInd ==0){
							//console.log("ind 0:"+(JSON.stringify(record)));
						//}
						
						
						if (self.recordCanHaveChildJobs(record) && record._follow!=null) {
							
							var followSelectorId = record._followSelectorId;
							var followURL = record['_follow'];
							var followSelectorId = record['_followSelectorId'];
							delete record['_follow'];
							delete record['_followSelectorId'];
							var newJob = new Job(followURL, followSelectorId, self, job, record);
							
							if (self.queue.canBeAdded(newJob)) {
								self.queue.add(newJob);
								console.log("Job added to Queue: "+self.queue.getQueueSize()+", "+followURL+", followSelectorId:"+followSelectorId);
							}
							// store already scraped links
							else {
								console.log("Ignoring next: "+followURL);
								//console.log(record);
								//scrapedRecords.push(record);
							}
						}else {
							//console.log("Deleting");
							if (record._follow !== undefined) {
								console.log(record._follow);
								delete record['_follow'];
								delete record['_followSelectorId'];
							}
							
							
							//scrapedRecords.push(record);
						}
						
					});
					}else{
						console.log("Records not found");
					}
					//var fileName=window.fileName;
					//if(!fileName){
					//	fileName = ""+date.getFullYear()+"_"+(date.getMonth()+1)+"_"+date.getDate()+"_"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()+"_"+date.getMilliseconds();
					//}
					//fs.write("scrapedRecords_"+(fileName)+".json","\n"+JSON.stringify(records), 'a');
					if(process.fileName){
						//records = records.reverse();
						//if(records.length==1)
						fs.appendFile(__dirname+"/output/scrapedRecords_"+(process.fileName)+".json","\n"+(JSON.stringify(records))+",", function(){});
						//fs.appendFile("scrapedRecords_2017_11_22_14_47_47_263.json","\n"+(JSON.stringify(records))+",", function(){});
					}
					if(records.length==1 || records[0] && records[0].sourceUrl){
						self.scrapedRecords.push(records[0]);
					}
					
					/*
					if(self._run){
						self._run();
					}else{
						console.log("run not defined");
						self.executionCallback();
					}*/
					
					//console.log("records: "+JSON.stringify(records));
					//console.log("job parent: "+job.parentSelector);
					
					//
					if ((records.length==1 || records[0]) && records[0].sourceUrl && fromPreview) {
						


						self.queue.reset();
						self.scrapedRecords=[];
						self.scrapedRecords.push(records[0]);
					
						if(self._run){
							self._run();
						}else{
							console.log("run not defined");
							self.executionCallback();
						}
						
						/*RecordDataProcessor.processRecord(self.postProcessorJson, records, function(processedRec, res, reason){
							if(res){
								console.log("record saved with id: "+(processedRec.recordId));
								self.queue.currentJob=false;
							}else{
								console.log("record saving failed, reason: ", reason);
							}
							//console.log(" processed record: ", processedRec);
							//if(processedRec){
								//fs.appendFile(__dirname+"/output/processedRec_"+(process.fileName)+".json","\n"+(JSON.stringify(processedRec))+",", function(){});
							//}
							if(processedRec.name && processedRec.sourceUrl && processedRec.Manufacturer){
								self.queue.reset();
								self.scrapedRecords=[];
								self.scrapedRecords.push(processedRec);
							}
							if(self._run){
								self._run();
							}else{
								console.log("run not defined");
								self.executionCallback();
							}
						});*/
						
						
					}else if ((records.length==1 || records[0]) && records[0].sourceUrl) {
						
						console.log("postprocessing");					
						/*RecordDataProcessor.processRecord(self.postProcessorJson, records, function(processedRec, res, reason){
							if(res){
								console.log("record saved with id: "+(processedRec.recordId));
								self.queue.currentJob=false;
							}else{
								console.log("record saving failed, reason: ", reason);
							}
							//console.log(" processed record: ", processedRec);
							//if(processedRec){
								//fs.appendFile(__dirname+"/output/processedRec_"+(process.fileName)+".json","\n"+(JSON.stringify(processedRec))+",", function(){});
							//}
							if(processedRec.name && processedRec.sourceUrl && processedRec.Manufacturer){
								self.queue.reset();
								self.scrapedRecords=[];
								self.scrapedRecords.push(processedRec);
							}
							if(self._run){
								self._run();
							}else{
								console.log("run not defined");
								self.executionCallback();
							}
						});*/
						self.executionCallback();
						
					}else{
						if(self._run){
							self._run();
						}else{
							console.log("run not defined");
							self.executionCallback();
						}
					}
					
				
				});
				
				
				
				
				
				
			}catch(e){
				console.log(e);
				console.log(e.message, e.stack);
			}
		}
		
		/*
		job.execute(this.chrome, function (job) {
			
			
		});
		*/
		
	},
	getChildElements: function(sitemap, parentElement){
		
		var groupBy = function(xs, key) {
		  return xs.reduce(function(rv, x) {
			(rv[x[key]] = rv[x[key]] || []).push(x);
			return rv;
		  }, {});
		};

		return groupBy(sitemap.selectors, "id")[parentElement];

	}
}


exports.Scraper=Scraper;