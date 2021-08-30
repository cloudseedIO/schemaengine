
/**
 * @author saikiran.vadlakonda
 * 
 * 
 * API URL
 * <a href='https://github.com/GoogleChrome/puppeteer/blob/v0.13.0/docs/api.md'> API Documentation</a>
 * <a href="https://developers.google.com/web/updates/2017/04/headless-chrome">Read more</a>
 * 
 * Puppeteer requires at least Node v6.4.0, but the code below use async/await which is only supported in Node v7.6.0 or greater.
 * When you install Puppeteer, it downloads a recent version of Chromium (~170Mb Mac, ~282Mb Linux, ~280Mb Win) that is guaranteed to work with the API. To skip the download, see Environment variables.
 * 
 */

var ScrapedRecords=[];
const puppeteer = require('puppeteer');
var options = {};
process.on('unhandledRejection', error => {
	console.error('unhandledRejection', error.message, error.stack, error);
	console.error("Exception occurred, trying to re-run");
	options['re-run']=true;
	
	console.log(JSON.stringify(options));
	process.exit(1);
	
});

/**
 * <a href='https://github.com/GoogleChrome/puppeteer/blob/v0.13.0/docs/api.md#puppeteerlaunchoptions'>Puppeteer Launch Options</a>
 */
var pupOptions = {
	ignoreHTTPSErrors: true,
	headless: false,
	args:['--disable-infobars','--start-maximized']
	
};

//var fs = require('fs');
var Selector = require('./Selector').Selector;
var SelectorText = require('./SelectorText').SelectorText;
var SelectorImage=require('./SelectorImage').SelectorImage;
var SelectorLink=require('./SelectorLink').SelectorLink;
var SelectorPagination=require('./SelectorPagination').SelectorPagination;
var SelectorLableClick=require('./SelectorLableClick').SelectorLableClick;
var SelectorElementClick=require('./SelectorElementClick').SelectorElementClick;
var SelectorElementAttribute=require('./SelectorElementAttribute').SelectorElementAttribute;
var SelectorKeyValue = require('./SelectorKeyValue').SelectorKeyValue;

var date=new Date();
var fileName = ""+date.getFullYear()+"_"+(date.getMonth()+1)+"_"+date.getDate()+"_"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()+"_"+date.getMilliseconds();

if(global){
	global['Selector']=Selector;
	global['SelectorText']=SelectorText;
	global['SelectorLink']=SelectorLink;
	global['SelectorLableClick']=SelectorLableClick;
	global['SelectorElementClick']=SelectorElementClick;
	global['SelectorImage']=SelectorImage;
	global['SelectorPagination']=SelectorPagination;
	global['SelectorElementAttribute']=SelectorElementAttribute;
	global['SelectorKeyValue']=SelectorKeyValue;
	global['date']=new Date();
	global['fileName']=fileName;
	//console.log('available', Object.keys(window).indexOf('SelectorImage'));
	
	if(checkArgs()){
		startScrape();
	}else{
		console.error("There is something wrong");
		process.exit(1);
	}
}




async function startScrape(){
	
	puppeteer.launch(pupOptions).then(async browser => {
		
		console.error("launched"+ (Date.now()+"").substr(-6));
		//console.error(browser);
		const page = await browser.newPage();
		await page.setViewport({width: 1340, height: 900});
		console.error('page');
		var args = process.argv.slice(2);
		
		var options = {};
		for(var i in args) {
			if(args[i].indexOf("--") == 0 ) {
				var key = args[i].substr(2);
				res = key.split(/=(.+)?/);
				options[res[0]]=res[1];
			}
		}
		
		page.on('console', msg => {
		  for (let i = 0; i < msg.args.length; ++i)
		    console.error(`${i}: ${msg.args[i]}`);
		});
		
		//console.error(options);
		var children=[];
		var opts = options;
		
		var sitemap = JSON.parse(opts.sitemap);
		var parentSelector = opts.parentSelector;
		opts.baseData= JSON.parse(opts.baseData);
		opts.dataItems=JSON.parse(opts.dataItems);
		
		
		
		
		var response = await page.goto(opts.url, {'waitUntil':['domcontentloaded', 'networkidle0'], 'timeout': 3000000 });
		/*
		var isJqueryAvailable = await page.evaluate(function(){
			if (typeof jQuery == 'undefined') {
			    var script = document.createElement('script');
			    script.type = "text/javascript";
			    script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js";
			    document.getElementsByTagName('head')[0].appendChild(script);
			    return true;
			}else{
				return false;
			}
		});
		
		console.error("Jquery "+(isJqueryAvailable?" available ":"not available"));
		*/
		await page.waitFor(5*2000);
		//We make externally scroll to bottom in order to load every content on the page
		for(var i=0; i<5; i++){
			await page.evaluate(function(){
				window.scrollTo(0,document.body.scrollHeight);
				console.log("scrolled: ");
			});
			//await page.waitFor(5*2000);
		}
		
		
		
		try{
			
			if(response && response.status && response.status!="200"){
				console.error("Error response "+response.status+" for page: "+opts.url+", so exiting from current session");
				console.log(JSON.stringify(ScrapedRecords)); 
				console.error(JSON.stringify(ScrapedRecords)); 
				await browser.close();
				process.exit(1);
			}
			
			children = getChildElements(sitemap, opts.parentSelector);
		
			var childCnt=children.length;
			if(childCnt){
				
				var isJQuery = await page.evaluate(function(){
					var isJQuery={};
					if(window.jQuery){
						isJQuery['isJQuery']=true;
					}else{
						isJQuery['isJQuery']=false;
					}

					if(window.location.protocol=="https:"){
						isJQuery['protocol']="https";
					}else if(window.location.protocol=="http:"){
						isJQuery['protocol']="http";
					}else{
						console.error("Unknown protocol");
					}
					return isJQuery;
				});

				if(isJQuery && !isJQuery.isJQuery){
					//console.error(isJQuery);
					
					console.error("Injecting jQuery");
					try{
						await page.addScriptTag({url: (isJQuery.protocol+":"=="https:"?'https://code.jquery.com/jquery-3.2.1.min.js':'http://code.jquery.com/jquery-3.2.1.min.js')});
					}catch (e){
						console.error("error while injecting jquery");
						console.error(e);
						await page.addScriptTag({url: (isJQuery.protocol+":"=="https:"?'https://code.jquery.com/jquery-3.2.1.min.js':'http://code.jquery.com/jquery-3.2.1.min.js')});
					}

					console.error("Injected");
				}else{
					console.error("Not Injected");
					//fs.appendFileSync(__dirname+"/records/wkRecs_"+(process.fileName)+".json","\n"+(JSON.stringify(record.recordId))+", mfrProductNo: "+record.mfrProductNo+",", function(){});
				}
				
				
				scrapeChild(0);
			}else{
				console.error("No child found");
			}
			
			
			async function scrapeChild(childIndx){
				if(childIndx >= childCnt){
					//close the browser and return scrapped data
					//console.error('Clicked: '+ (Date.now()+"").substr(-6));
					console.log(JSON.stringify(ScrapedRecords));	
					console.error(JSON.stringify(ScrapedRecords));	
					//console.error('Clicked: '+ (Date.now()+"").substr(-6));
					await browser.close();
					process.exit(0);
					
				}else{
					var child = children[childIndx];
					var selector = new Selector(child);
					
					console.error("child: "+childIndx+", childId: "+child.id+", "+(Date.now()+"").substr(-6));
					
					if(child.pagination){
						console.error("Pagination");

						var record = {};
						//record[data.id] = element.textContent.trim();
						record._followSelectorId = child.paginateFrom;
						record[child.id + '-href'] = opts.url;
						record._follow = opts.url;
						record.paginate=true;

						for(var key in child.paginationData){
							record[key]=child.paginationData[key];
						}
						for(var key in opts.baseData){
							record[key]=opts.baseData[key];
						}

						//console.error("pushing record: "+JSON.stringify(record));
						//record.condition=child.condition;
						//record.leftElement=child.leftElement;
						//record.rightElement=child.rightElement;
						//record.opr=child.opr;
						//if(opts.baseData.paginateIndex ==1){
							ScrapedRecords.push(record);
						//}


					}



					if(opts.baseData && opts.baseData.elementClick ){
						if(opts.baseData.lable){
							//console.error('Clicking');
							 page.click(opts.baseData.lable, opts.baseData.elementType);
							//console.error('Clicked');
						}else if(opts.baseData.pagination){
							//if(opts.baseData.paginateIndex == "1"){
							//	console.error("index: "+opts.baseData.paginateIndex);
							//	opts.baseData.paginateIndex="2";
							//}

							if(opts.baseData.paginateIndex){
								console.error('Clicking CSS index');
								console.error((Date.now()+"").substr(-6)+" Clicked via b4");
								//https://github.com/GoogleChrome/puppeteer/blob/v0.13.0/docs/api.md#pagetypeselector-text-options
								//page.type(selector, text[, options])
								
								 await page.evaluate(function(d){
									var input = document.querySelector(d.paginateCss);
									if(input.nodeName == "INPUT"){
										input.setAttribute("value", d.paginateIndex);
										document.querySelector(d.css).click();
										return input.getAttribute("value");
									}else{
										return false;
									}
									

								}, opts.baseData);
								await page.waitFor((2)*5000);
								console.error((Date.now()+"").substr(-6)+" Clicked via");

							}else{
								console.error('Clicking CSS');
								 //await chromeless.click(opts.baseData.css);

								var res = await page.evaluate(function(css){
									var ele;
									if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
									if(ele != null){
										ele.click();
										return true;
									}
								}, opts.baseData.css);
								console.error('Clicked: '+res);
								console.error('Clicked: '+ (Date.now()+"").substr(-6));
								await page.waitFor(12*5000);
								console.error('Clicked: '+ (Date.now()+"").substr(-6));
							}


						}else if(opts.baseData.elementClick){
							console.error("Clicking CSS");
							if(opts.baseData.elementXpath && opts.baseData.elementIndex){
								var isClicked = await page.evaluate(function(data){
									if(data.elementXpath){
										var elements;
										if(window.jQuery && (data.css.includes(':')|| data.css.includes('contains')|| data.css.includes('lt')|| data.css.includes('gt'))){
											console.error("multiple jQuery");
											elements = window.jQuery(data.css);
											//console.error(elements);
										}else{
											console.error("multiple JavaScript");
											elements = document.querySelectorAll(data.css);
										}										
										var ele = elements[data.elementIndex];
										if(ele!=null){
											//ele = ele.singleNodeValue;											
											ele.click();
											return true;
										}else{
											return false;
										}
									}
								}, opts.baseData);
								console.error("Clicked by xpath "+isClicked);
							}else{
								await page.click(opts.baseData.css);
							}
							
							await page.waitFor(2*5000);
						}
					}



					console.error('evaluate: '+ (Date.now()+"").substr(-6));
					if( !child.selector.includes(':') && !child.selector.includes('contains') ){
						console.error('contains evaluate: '+ (Date.now()+"").substr(-6));
						await page.evaluate(function(data){
							if(document.querySelector(data.selector)!=null){
								document.querySelector(data.selector).scrollIntoView();
								
							}
						}, child);
					}
					
					if(child.loadMore || child.singlePageNavigation){
						
						if(child.loadMore){
							var eleExist = await page.evaluate(function(css){
								var ele ;
								if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
								console.error("Inside Browser: "+css);
								if(ele != null){
									console.error("Inside Browser element found");
									ele.click();

									console.error("Inside Browser element found clicked");
									return true;
								}else{
									console.error("Inside Browser element not found  "+css);
									console.error("Inside Browser element not found");
									return false;
								}
							},child.loadMoreCss);
							loadMoreFn(eleExist);
						}else if(child.singlePageNavigation){
							if(child.clickElement){
								var eleExist = await page.evaluate(function(css){
									var ele;
									if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
									console.error("Inside Browser: "+css);
									if(ele != null){
										console.error("Inside Browser element found");
										ele.click();
										console.log(window.performance.memory);
										console.error("Inside Browser element found clicked");
										return true;
									}else{
										console.error("Inside Browser element not found  "+css);
										console.error("Inside Browser element not found");
										return false;
									}
								},child.clickElementCss);
							}
							console.error("Waiting started: "+ (Date.now()+"").substr(-6));
							await page.waitFor((2)*1000);
							console.error("Waiting ended: "+ (Date.now()+"").substr(-6));
							
							var eleExist = await page.evaluate(function(css){
								var ele;
								if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
								
								console.error("Inside Browser: "+css);
								if(ele != null){
									console.error("Inside Browser element found");
									//ele.click();

									console.error("Inside Browser element found clicked");
									return true;
								}else{
									console.error("Inside Browser element not found  "+css);
									console.error("Inside Browser element not found");
									return false;
								}
							},child.navigationCss);
							singlePageNavigation(eleExist);
						}
						
						
						
						
						
						async function loadMoreFn(shouldLoadMore){
							console.error("Load More: "+shouldLoadMore);
							if(shouldLoadMore){
								
								await page.waitFor((10)*1000);
								
								var eleExist = await page.evaluate(function(css){
									var ele ;
									if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
									
									console.error("Inside Browser: "+css);
									if(ele != null){
										console.error("Inside Browser element found");
										var perfMem = window.performance.memory;
										console.error(perfMem.totalJSHeapSize, perfMem.jsHeapSizeLimit,perfMem.usedJSHeapSize);
										
										console.error(document.querySelectorAll("div.tab-content.active div.teaser-wrap a").length);
										console.error("getEntries: "+performance.getEntries().length);
										console.error("clearResourceTimings: "+performance.clearResourceTimings());
										console.error("getEntries: "+performance.getEntries().length);
										ele.click();
										console.error("Inside Browser element found clicked");
										return true;
									}else{
										console.error("Inside Browser element not found  "+css);
										console.error("Inside Browser element not found");
										return false;
									}
								},child.loadMoreCss);
								await page.waitFor((2)*1000);
								loadMoreFn(eleExist);
							}else{
								//scrape Data
								console.error("Load Finished");
								/*
								function loadMore(loadIndx){
									var res = await page.evaluate(function(css){
										var ele = document.querySelector(css);
										if(ele != null){
											ele.click();
											return true;
										}
									}, child.loadMoreCss);
									if(res){
										await page.click(child.loadMoreCss);
										await page.waitForNavigation({ timeout, waitUntil: 'load' });
										await page.waitForNavigation({ timeout, waitUntil: 'networkidle', 8000 });
									}
									
									
									
								}
								*//*
								var dd = await page.evaluate(function(data){
									var links=[];
									
									var elements = document.querySelectorAll(data.selector);
									
									if(elements != null){
										if(data.multiple && elements.length > 0){
											links = Array.prototype.map.call(elements, function(element){
												var record = {};
												//record[data.id] = element.textContent.trim();
												record._followSelectorId = data.id;
												record[data.id + '-href'] = element.href;
												record._follow = element.href;
												
												return record;
											});
										}else{
											var record = {};
											record[data.id] = elements.textContent.trim();
											record._followSelectorId = data.id;
											record[data.id + '-href'] = elements.href;
											record._follow = elements.href;
											links.push(record);
											
										}
										
									}
									
									return links;
									
									
								}, child);
								
								*/
								//console.error('res: ', dd);
								await page.waitFor((2)*1000);
								/*
								if(child.selector.includes('contains')){
									if(child.multiple){
										var res = await page.$$(child.selector);
										console.error('$$: '+ res);
									}else{
										var res = await page.$(child.selector);
										console.error('$$: '+ res);
									}
								}
								*/
								var   res;
								try{
									res = await page.evaluate(selector.getData,child);
								}catch(e){
									console.error(e);
									
								}
								/*
								if(sitemap.startUrl == "https://kvadrat.dk/products?group_types=curtains" && parentSelector=="_root"){
									res=res.slice(0,14);
								}
								
								if(sitemap.startUrl == "https://kvadrat.dk/products?group_types=upholstery" && parentSelector=="_root"){
									res=res.slice(0,19);
								}
								*/
								console.error('evaluated: '+ (Date.now()+"").substr(-6));

								if(res === null){
									if(ScrapedRecords[0] == undefined){
										ScrapedRecords[0]={};
									}
									ScrapedRecords[0][child.id]=null;
									console.error('scraped: '+res);

								}else if( res !== null && res.length === undefined){
									if(ScrapedRecords[0] == undefined){
										ScrapedRecords[0]={};
									}
									ScrapedRecords[0][child.id]=res[child.id];

									ScrapedRecords[0]['sourceUrl']=opts.url;

									console.error('scraped: '+(res[child.id]));
									//opts.dataItems[0][child.id+"-url"]=opts.url;


									//opts.dataItems.push(res);
								}else if(res !== null && res.forEach){
									res.forEach(function(re){
										ScrapedRecords.push(re);
									});
									//opts.dataItems=(res);
									console.error('scraped: '+(res[0]));
								}else {
									//console.error("problem: ", res, typeof res);
								}
								
								scrapeChild(childIndx+1);//Going to scrape next child
							}
							
						}
						
						
						async function singlePageNavigation(shouldLoadMore){
							console.error("Pagination: "+shouldLoadMore);
							if(shouldLoadMore){
								
								await page.waitFor(5*2000);
								//We make externally scroll to bottom in order to load every content on the page
								for(var i=0; i<13; i++){
									await page.evaluate(function(){
										window.scrollTo(0,document.body.scrollHeight);
										console.log("scrolled: ");
									});
									//await page.waitFor(5*2000);
								}
								await page.waitFor(5*2000);
								var   res;
								try{
									res = await page.evaluate(selector.getData,child);
								}catch(e){
									console.error(e);
									
								}
								/*
								if(sitemap.startUrl == "https://kvadrat.dk/products?group_types=curtains" && parentSelector=="_root"){
									res=res.slice(0,14);
								}
								
								if(sitemap.startUrl == "https://kvadrat.dk/products?group_types=upholstery" && parentSelector=="_root"){
									res=res.slice(0,19);
								}
								*/
								console.error('evaluated: '+ (Date.now()+"").substr(-6));

								if(res === null){
									if(ScrapedRecords[0] == undefined){
										ScrapedRecords[0]={};
									}
									ScrapedRecords[0][child.id]=null;
									console.error('scraped: '+res);

								}else if( res !== null && res.length === undefined){
									if(ScrapedRecords[0] == undefined){
										ScrapedRecords[0]={};
									}
									if(ScrapedRecords[0][child.id]){
										console.error('scraped2: '+(res[child.id]));
										ScrapedRecords[0][child.id]+=res[child.id];
									}else{
										console.error('12scraped2: '+(res[child.id]));
										ScrapedRecords[0][child.id]=res[child.id];
									}
									

									ScrapedRecords[0]['sourceUrl']=opts.url;

									
									//opts.dataItems[0][child.id+"-url"]=opts.url;


									//opts.dataItems.push(res);
								}else if(res !== null && res.forEach){
									res.forEach(function(re){
										ScrapedRecords.push(re);
									});
									//opts.dataItems=(res);
									console.error('scraped: '+(res[0]));
									/* res.forEach(function(rec, i){
										console.error((rec["pList-href"]).match(/\-[0-9A-Z]{4,}/g));
									}); */
									
									
								}else {
									//console.error("problem: ", res, typeof res);
								}
								
								await page.waitFor((2)*1000);
								await page.waitFor((10)*1000);
								var eleExist = await page.evaluate(function(css){
									var ele;
									if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
									console.error("Inside Browser: "+css);
									if(ele != null){
										console.error("Inside Browser element found");					
										
										ele.click();
										console.error("Inside Browser element found clicked");
										return true;
									}else{
										console.error("Inside Browser element not found  "+css);
										console.error("Inside Browser element not found");
										return false;
									}
								},child.navigationCss);
								await page.waitFor((10)*1000);
								await page.waitFor((10)*1000);
								await page.waitFor(5*2000);
								//We make externally scroll to bottom in order to load every content on the page
								for(var i=0; i<13; i++){
									await page.evaluate(function(){
										window.scrollTo(0,document.body.scrollHeight);
										console.log("scrolled: ");
									});
									//await page.waitFor(5*2000);
								}						
								await page.waitFor(5*2000);
								singlePageNavigation(eleExist);
							}else{
								//scrape Data
								console.error("Load Finished");
								/*
								function loadMore(loadIndx){
									var res = await page.evaluate(function(css){
										var ele = document.querySelector(css);
										if(ele != null){
											ele.click();
											return true;
										}
									}, child.loadMoreCss);
									if(res){
										await page.click(child.loadMoreCss);
										await page.waitForNavigation({ timeout, waitUntil: 'load' });
										await page.waitForNavigation({ timeout, waitUntil: 'networkidle', 8000 });
									}
									
									
									
								}
								*//*
								var dd = await page.evaluate(function(data){
									var links=[];
									
									var elements = document.querySelectorAll(data.selector);
									
									if(elements != null){
										if(data.multiple && elements.length > 0){
											links = Array.prototype.map.call(elements, function(element){
												var record = {};
												//record[data.id] = element.textContent.trim();
												record._followSelectorId = data.id;
												record[data.id + '-href'] = element.href;
												record._follow = element.href;
												
												return record;
											});
										}else{
											var record = {};
											record[data.id] = elements.textContent.trim();
											record._followSelectorId = data.id;
											record[data.id + '-href'] = elements.href;
											record._follow = elements.href;
											links.push(record);
											
										}
										
									}
									
									return links;
									
									
								}, child);
								
								*/
								//console.error('res: ', dd);
								await page.waitFor((2)*1000);
								/*
								if(child.selector.includes('contains')){
									if(child.multiple){
										var res = await page.$$(child.selector);
										console.error('$$: '+ res);
									}else{
										var res = await page.$(child.selector);
										console.error('$$: '+ res);
									}
								}
								*/
								
								
								scrapeChild(childIndx+1);//Going to scrape next child
							}
							
						}
						
						
						
					}else{
						
						//console.error("Load Finished");
						/*
						function loadMore(loadIndx){
							var res = await page.evaluate(function(css){
								var ele = document.querySelector(css);
								if(ele != null){
									ele.click();
									return true;
								}
							}, child.loadMoreCss);
							if(res){
								await page.click(child.loadMoreCss);
								await page.waitForNavigation({ timeout, waitUntil: 'load' });
								await page.waitForNavigation({ timeout, waitUntil: 'networkidle', 8000 });
							}
							
							
							
						}
						*/
						if(child.clickElement){
							var eleExist = await page.evaluate(function(css){
								var ele;
								if(window.jQuery && (css.includes(':')|| css.includes('contains')|| css.includes('lt')|| css.includes('gt'))){
										ele=window.jQuery(css)[0];
									}else{
										ele = document.querySelector(css);
									}
								
								console.error("Inside Browser: "+css);
								if(ele != null){
									console.error("Inside Browser element found");
									ele.click();
									console.log(window.performance.memory);
									console.error("Inside Browser element found clicked");
									return true;
								}else{
									console.error("Inside Browser element not found  "+css);
									console.error("Inside Browser element not found");
									return false;
								}
							},child.clickElementCss);
						}
						console.error("Waiting started: "+ (Date.now()+"").substr(-6));
						await page.waitFor((1)*1000);
						console.error("Waiting ended: "+ (Date.now()+"").substr(-6));
						/*
						if(child.selector.includes('contains')){
							if(child.multiple){
								var res = await page.$$(child.selector);
								console.error('$$: '+ res);
							}else{
								var res = await page.$(child.selector);
								console.error('$$: '+ res);
							}
						}
						*/
						var   res;
						try{
							res = await page.evaluate(selector.getData,child);
							console.error("result" , res);
						}catch(e){
							console.error(e);
							
						}
						
						
						
						/*
						if(sitemap.startUrl == "https://kvadrat.dk/products?group_types=upholstery" && parentSelector=="_root"){
							res=res.slice(0,19);
						}
						*/	
						if(sitemap.startUrl == "https://www.hookedonwalls.com/en" && parentSelector=="_root" ){
							
							res=[];
					
							var links=[{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/float"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/meduse"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/mermaid"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/reef"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/seahorse"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/underwater"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/scale"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fold"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fan"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/botany"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/majestic"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/palma"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/path"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/ypsilon"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/unit"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/lattice"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/outline"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/diamond"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/palm"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/shade"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/woods"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/prisma"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/icon"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/verve"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zest"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/puzzle"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/perplex"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/fury"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/deco"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/organic"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/fauna"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/eclectic"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/moon"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/rhythm"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/glare"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/pure-classic"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gravity"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/mayan"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/alcor"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/float/70010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/float/70011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/float/70012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/float/70013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/meduse/70070"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/meduse/70071"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/meduse/70072"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/mermaid/70050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/mermaid/70051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/mermaid/70052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/reef/70060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/reef/70061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/reef/70062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/reef/70063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/reef/70064"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/seahorse/70030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/seahorse/70031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/seahorse/70032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/seahorse/70033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/underwater/70040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/underwater/70041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/underwater/70042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/underwater/70043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/underwater/70044"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70100"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70101"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70102"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70103"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70104"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70105"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70106"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70107"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70108"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70109"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70110"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70111"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70112"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/tweed/70113"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/scale/70020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/scale/70021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/scale/70023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/scale/70024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/hidden-treasures/scale/70025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst/86060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst/86061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst/86062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst/86063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst/86064"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/burst/86065"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86044"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86045"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86046"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86047"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86048"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86049"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/carve/86050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86007"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86008"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86009"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/fur/86013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86026"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86027"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86028"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86029"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/arctic-fever/igloo/86033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces/68050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces/68051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces/68052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces/68053"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces/68054"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/pieces/68055"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fold/68010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fold/68011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fold/68012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fold/68013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fold/68014"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68026"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/blocks/68023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/flow/68006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fan/68030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fan/68031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fan/68032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fan/68033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/fan/68034"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68044"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68045"},{"plist-href":"https://www.hookedonwalls.com/en/collections/paper-craft/crinkle/68046"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway/15540"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway/15541"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway/15542"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway/15543"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway/15544"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/sway/15545"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful/15510"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful/15511"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful/15512"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful/15513"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful/15514"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/graceful/15515"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15520"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15521"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15522"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15523"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15524"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15525"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/beat/15526"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy/15500"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy/15501"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy/15502"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy/15503"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy/15504"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/classy/15505"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15530"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15531"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15532"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15533"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15534"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15535"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/twine/15536"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classy-vibes/tone/58006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66510"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66511"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66512"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66513"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66514"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66515"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66516"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/edge/66517"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/botany/36540"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/botany/36541"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/botany/36542"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/botany/36543"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery/36510"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery/36511"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery/36512"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery/36513"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery/36514"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/greenery/36515"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/majestic/36520"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/majestic/36521"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/majestic/36522"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/majestic/36523"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/majestic/36524"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/palma/36530"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/palma/36531"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/palma/36532"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/palma/36533"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/palma/36534"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal/36500"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal/36501"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal/36502"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal/36503"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal/36504"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/royal/36505"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70100"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70101"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70102"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70103"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70104"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70105"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70106"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70109"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70111"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70112"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/70113"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/path/66570"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/path/66571"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/path/66572"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/path/66573"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/path/66574"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66520"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66521"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66522"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66523"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66524"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66525"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66526"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/cubix/66527"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66500"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66502"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66503"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66504"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66505"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66506"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/tone/66507"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66510"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66511"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66512"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66513"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66514"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66515"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66516"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/edge/66517"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/ypsilon/66530"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/ypsilon/66531"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/ypsilon/66532"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/ypsilon/66533"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/ypsilon/66534"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/unit/66540"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/unit/66541"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/unit/66542"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/unit/66543"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/unit/66544"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/lattice/66550"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/lattice/66551"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/lattice/66552"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/lattice/66553"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/lattice/66554"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/outline/66560"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/outline/66561"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/outline/66562"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/outline/66563"},{"plist-href":"https://www.hookedonwalls.com/en/collections/gentle-groove/outline/66564"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/diamond/77050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/diamond/77051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/diamond/77052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/diamond/77053"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/diamond/77054"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77007"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77008"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77009"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/gloom/77011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/palm/77040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/palm/77041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/palm/77042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/palm/77043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77026"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/stream/77027"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77034"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77035"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77036"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/tile/77037"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/shade/77060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/shade/77061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/shade/77062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/shade/77063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/shade/77064"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/woods/77070"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/woods/77071"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/woods/77072"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/woods/77073"},{"plist-href":"https://www.hookedonwalls.com/en/collections/classic-victory/woods/77074"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73150"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73151"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73152"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73153"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73154"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73155"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73156"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/delicate-lines/73157"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-flower/73007"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73053"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73054"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73055"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/etched-drops/73056"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic/73100"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic/73101"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic/73102"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic/73103"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic/73104"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/ornament-chic/73105"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73200"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73201"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73202"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73203"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73204"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73205"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73206"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73207"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73208"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73209"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73210"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73211"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73212"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73213"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73214"},{"plist-href":"https://www.hookedonwalls.com/en/collections/delicate-chic/refined-grid/73215"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76007"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76008"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76009"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76014"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed/76015"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe/76020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe/76021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe/76022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe/76023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe/76024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/tweed-stripe/76025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask/76030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask/76031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask/76032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask/76033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask/76034"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/twisted-damask/76035"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/prisma/76040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/prisma/76041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/prisma/76042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/prisma/76043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/prisma/76044"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/icon/76050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/icon/76051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/icon/76052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/icon/76054"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament/76060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament/76061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament/76062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament/76063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament/76064"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/favourite-ornament/76065"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39007"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39008"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39009"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zen/39013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy/39020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy/39021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy/39022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy/39023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy/39024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/joy/39025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/verve/39030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/verve/39031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/verve/39032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/verve/39033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zest/39040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zest/39041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zest/39042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zest/39043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/zest/39044"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/puzzle/39050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/puzzle/39051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/puzzle/39052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/puzzle/39053"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/puzzle/39054"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/perplex/39060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/perplex/39061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/perplex/39062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/perplex/39063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/perplex/39064"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/fury/39070"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/fury/39071"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/fury/39072"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/fury/39073"},{"plist-href":"https://www.hookedonwalls.com/en/collections/mixed-moods/fury/39074"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/deco/58030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/deco/58031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/deco/58032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/deco/58033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/tone/58006"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58014"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58015"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/misty/58016"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/organic/58020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/organic/58021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/organic/58022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/organic/58023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/organic/58024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/fauna/58040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/fauna/58041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/fauna/58042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/fauna/58043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/eclectic/58050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/eclectic/58051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/eclectic/58052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/eclectic/58053"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/moon/58060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/moon/58061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/moon/58062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/moon/58063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/rhythm/58070"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/rhythm/58071"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/rhythm/58072"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/rhythm/58073"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/glare/58080"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/glare/58081"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/glare/58082"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/glare/58083"},{"plist-href":"https://www.hookedonwalls.com/en/collections/new-elegance/glare/58084"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21500"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21501"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21502"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21503"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21504"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21505"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gatsby/21506"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/pure-classic/21510"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/pure-classic/21511"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/pure-classic/21512"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/pure-classic/21513"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/pure-classic/21514"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21520"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21521"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21522"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21523"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21524"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21525"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/great-impulse/21526"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gravity/21530"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gravity/21531"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gravity/21532"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gravity/21533"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/gravity/21534"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/mayan/21540"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/mayan/21541"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/mayan/21542"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/mayan/21543"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/mayan/21544"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21550"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21551"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21552"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21553"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21554"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21555"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21556"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21557"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21558"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21559"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres/84000"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres/84001"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres/84002"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres/84003"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres/84004"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/ceres/84005"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84010"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84011"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84012"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84013"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84014"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84015"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84016"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84017"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84018"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84019"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84020"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84021"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84022"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84023"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84024"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/agena/84025"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84030"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84031"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84032"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84033"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84034"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84035"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/castor/84036"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin/84040"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin/84041"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin/84042"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin/84043"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin/84044"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/mazarin/84045"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak/84050"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak/84051"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak/84052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak/84053"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak/84054"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/merak/84055"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/alcor/84060"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/alcor/84061"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/alcor/84062"},{"plist-href":"https://www.hookedonwalls.com/en/collections/splendid-living/alcor/84063"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/21553"},{"plist-href":"https://www.hookedonwalls.com/en/collections/jungle-jive/tweed/21563"},{"plist-href":"https://www.hookedonwalls.com/en/collections/favourite-twist/icon/76052"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21560"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21561"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21562"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21563"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21564"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21565"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21566"},{"plist-href":"https://www.hookedonwalls.com/en/collections/pure-impulse/twisted-tweed/21567"}];
							
							links.forEach(function(link){
								var record = {};
								record._followSelectorId = child.id;
								record[child.id + '-href'] = link["plist-href"];
								record._follow = link["plist-href"];
								res.push(record);
							});
						}						
						
						
						//console.error('evaluated: '+ (Date.now()+"").substr(-6));
						//console.error('res', res);
						if(res === null || res == undefined){
							if(ScrapedRecords[0] == undefined){
								ScrapedRecords[0]={};
							}
							ScrapedRecords[0][child.id]=null;
							console.error('scraped: '+res);

						}else if( res !== null && res.length === undefined){
							if(ScrapedRecords[0] == undefined){
								ScrapedRecords[0]={};
							}
							ScrapedRecords[0][child.id]=res[child.id];

							ScrapedRecords[0]['sourceUrl']=opts.url;

							//console.error('scraped: '+(res[child.id]));
							//opts.dataItems[0][child.id+"-url"]=opts.url;


							//opts.dataItems.push(res);
						}else if(res !== null && res.forEach){
							res.forEach(function(re){
								ScrapedRecords.push(re);
							});
							//opts.dataItems=(res);
							console.error('scraped: '+(res[0]));
						}else {
							//console.error("problem: ", res, typeof res);
						}
						
						scrapeChild(childIndx+1);//Going to scrape next child
						
					}
					
				}
			}//scrapeChild(0);
			
		}catch(e){
			console.error("error");
			e.stack;
			//console.error('Clicked: '+ (Date.now()+"").substr(-6));
			console.log(JSON.stringify(ScrapedRecords));	
			console.error(JSON.stringify(ScrapedRecords));	
			//console.error('Clicked: '+ (Date.now()+"").substr(-6));
			await browser.close();
		}
		
		
		
	});
}





function checkArgs(){
	

	var args = process.argv.slice(2);
	
	for(var i in args) {
		if(args[i].indexOf("--") == 0 ) {
			var key = args[i].substr(2);
			res = key.split(/=(.+)?/);
			options[res[0]]=res[1];
		}
	}
	
	
	var opts = options;
	var checked=false;
	//console.error("before: "+JSON.stringify(opts));
	//opts=JSON.parse(opts);
	//console.error("After: "+opts);
	
	if(opts.url && opts.sitemap && Object.keys(JSON.parse(opts.sitemap)).length>0){
		checked=true;
	}
	
	
	//casper.echo("args: "+ args);
	//casper.echo("opts: "+ JSON.stringify(opts));

	console.error("URL: "+opts.url);
	//console.error(options);
	
	return checked;

	
}





function getChildElements(sitemap, parentElement){
		
	var groupBy = function(xs, key) {
	  return xs.reduce(function(rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	  }, {});
	};

	return groupBy(sitemap.selectors, "parentSelectors")[parentElement];

}