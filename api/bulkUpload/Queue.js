/**
* @author saikiran.vadlakonda
* Date: Nov 10, 2017
* 
*/


var Queue = function () {
	console.log("creating Queue");
	this.jobs = [];
	this.scrapedUrls = {};
	this.currentJob={};
};

Queue.prototype = {

	/**
	 * Returns false if page is already scraped
	 * @param job
	 * @returns {boolean}
	 */
	add: function (job) {

		if (this.canBeAdded(job)) {
			this.jobs.push(job);
			this._setUrlScraped(job.url);
			return true;
		}
		return false;
	},

	canBeAdded: function (job) {
		if(job.baseData && job.baseData.elementClick || job.baseData.paginate){
			return true;
		}
		if (this.isScraped(job.url)) {
			return false;
		}

		// reject documents
		if (job.url.match(/\.(doc|docx|pdf|ppt|pptx|odt)$/i) !== null) {
			return false;
		}
		return true;
	},

	getQueueSize: function () {
		return this.jobs.length;
	},

	isScraped: function (url) {
		return (this.scrapedUrls[url] !== undefined);
	},

	_setUrlScraped: function (url) {
		this.scrapedUrls[url] = true;
	},

	getNextJob: function () {

		// @TODO test this
		if (this.getQueueSize() > 0) {
			var currJob= this.jobs.pop();
			this.currentJob=currJob;
			return currJob;
		}
		else {
			return false;
		}
	},
	
	reset: function(){
		this.jobs = [];
		this.scrapedUrls = {};
		this.currentJob={};
	}
};

exports.Queue=Queue;