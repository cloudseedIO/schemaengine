var spawn = require('child_process').spawn;

var Job = function (url, parentSelector, scraper, parentJob, baseData) {

	if (parentJob !== undefined) {
		this.url = this.combineUrls(parentJob.url, url);
	} else {
		this.url = url;
	}
	this.parentSelector = parentSelector;
	this.scraper = scraper;
	this.dataItems = [];
	this.baseData = baseData || {};
	if(baseData && Object.keys(baseData).length){
		console.log("baseData");
		console.log(baseData);
	}
	
};

Job.prototype = {
	combineUrls: function (parentUrl, childUrl) {

		var urlMatcher = new RegExp("(https?://)?([a-z0-9\\-\\.]+\\.[a-z0-9\\-]+(:\\d+)?|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d+)?)?(\\/[^\\?]*\\/|\\/)?([^\\?]*)?(\\?.*)?", "i");

		var parentMatches = parentUrl.match(urlMatcher);
		var childMatches = childUrl.match(urlMatcher);

		// special case for urls like this: ?a=1  or like-this/
		if (childMatches[1] === undefined && childMatches[2] === undefined && childMatches[5] === undefined && childMatches[6] === undefined) {

			var url = parentMatches[1] + parentMatches[2] + parentMatches[5] + parentMatches[6] + childMatches[7];
			return url;
		}

		if (childMatches[1] === undefined) {
			childMatches[1] = parentMatches[1];
		}
		if (childMatches[2] === undefined) {
			childMatches[2] = parentMatches[2];
		}
		if (childMatches[5] === undefined) {
			if(parentMatches[5] === undefined) {
				childMatches[5] = '/';
			}
			else {
				childMatches[5] = parentMatches[5];
			}
		}

		if (childMatches[6] === undefined) {
			childMatches[6] = "";
		}
		if (childMatches[7] === undefined) {
			childMatches[7] = "";
		}

		return childMatches[1] + childMatches[2] + childMatches[5] + childMatches[6] + childMatches[7];
	},

	execute: function (chrome, callback) {

		var sitemap = this.scraper.sitemap;
		//var chrome = this.scraper.chrome;
		var job = this;
		//console.log("curr URL: "+chrome.getCurrentUrl());
		console.log("Job execution started: "+this.url);
		var children = [];
		
		
		var result={};
		//chrome.clickLabel('Diego', 'div');
		children = job.getChildElements(sitemap, job.parentSelector);
		if(!children || !children.length){
			console.log("Parent Selector: "+job.parentSelector, children);
		}
		var childCnt=children.length;
		//iterateChild(0);

		
		var opts = [];
		
		opts.push(__dirname + '/puppeteer.js');
		opts.push('--url='+job.url);
		opts.push('--parentSelector='+job.parentSelector);
		opts.push('--dataItems='+JSON.stringify(job.dataItems));
		opts.push('--baseData='+JSON.stringify(job.baseData));
		
		opts.push('--sitemap='+(JSON.stringify(sitemap)));
		
		var puppeteer = spawn('node', opts/*[
			__dirname + '/chrome.js',
			"--sitemap=" + JSON.stringify(sitemap),
			"--url=" + job.url,
			"--id="+job.parentSelector
		]*/,{
			//stdio: [process.stdin, process.stdout, process.stderr, 'ipc']
		});
		
		if(!global['child_processes'] ){
			global['child_processes']=[];
			console.log("Attaching child process, pid: "+puppeteer.pid);
			global['child_processes'].push(puppeteer);
		}else{
			console.log("Attaching child process, pid: "+puppeteer.pid);
			global['child_processes'].push(puppeteer);
		}
		var scrapedData='';
		
		/*
		puppeteer.stdout.write('data', (data) => {
		});
		*/
		puppeteer.stdout.on('data', (data) => {
			data = (data.toString('utf-8'));
			scrapedData += data;
			console.log("data: ", data);
			
		});
		puppeteer.stdout.on('end', () => {
			console.log("End function", scrapedData);
			try{
				job.dataItems = JSON.parse(scrapedData);
			}catch(e){
				console.log(e.message);
				console.log(e.stack);
			}
		});
		puppeteer.stderr.on('data', (data) => {
			data = (data.toString('utf-8'));
			console.log(`[puppeteer err]: ${data}`);
		});
		
		puppeteer.on('close', (code, signal) => {
		//if(code != 0)
		  console.log(`chrome-child closed with code ${code} signal ${signal}`);
			//ind=1;
			console.log("Job records: "+(job.dataItems.length));
			callback(job);//Invoking callback after child process is closed
		});
		puppeteer.on('exit', (code, signal) => {
			//if(code != 0)
			console.log(`chrome-child exited with code ${code} signal ${signal}`);
			//ind=1;
			if(!global['child_processes'] && global['child_processes'].length){
				global['child_processes'].pop();
			}
			
		});
		
		puppeteer.on('message', (msg, signal) => {
		//if(code != 0)
		  console.log(`chrome-child messages with code ${msg} signal ${signal}`);
			//ind=1;
		});
		
	},
	
	getChildElements: function(sitemap, parentElement){
		
		var groupBy = function(xs, key) {
		  return xs.reduce(function(rv, x) {
			(rv[x[key]] = rv[x[key]] || []).push(x);
			return rv;
		  }, {});
		};
		
		return groupBy(sitemap.selectors, "parentSelectors")[parentElement];
		
	},
	getResults: function () {
		return this.dataItems;
	}
};

exports.Job=Job;