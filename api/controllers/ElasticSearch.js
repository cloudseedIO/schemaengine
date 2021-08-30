/**
 * @author saikiran.vadlakonda
 * 
 * Source:https://www.npmjs.com/package/elasticsearch
 * 
 */

var cloudinary = require('cloudinary');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var esHost="http://"+config.esAddress+":"+config.esPort;
var indexName = config.esIndex;
var elasticsearch = require('elasticsearch');
var limitCount=require("../utils/global.js").summaryLimitCount*2+1;//19;// 9
var client = new elasticsearch.Client({
	host: esHost
});
var ContentServer=require('../ContentServer.js');
var utility=require('./utility.js');
var GenericSummeryServer=require('./GenericSummeryServer.js');
var logger = require('../services/logseed').logseed;
var logQueries=false;
function isSubArray(mainArray,subArray){
	var flag=true;
	for(var i=0;i<subArray.length;i++){
		if(mainArray.indexOf(subArray[i])==-1){
			flag=false;
			break;
		}
	}
	return flag;
}

var stopWords=require("./search/stopwords.json");
var productTypes=require("./search/productTypes.json");
var productTypesMappings=require("./search/productTypesMappings.json");
var dependentProperties=require("./search/dependentProperties.json");

exports.service = function(request,response){
	var operationValue = request.query.operation; 
	if(operationValue == undefined){
		
	}
	switch(operationValue){
	case "getSearchCounts":
		getSearchCounts(request,function(jsonObject){
			response.contentType("application/json");
			response.send(jsonObject);
		});
		break;
	case "search":
		try{
			getSearchResults(request,function(jsonObject){
				response.contentType("application/json");
				response.send({"data":jsonObject});
			});
		}catch(e){
			console.log(e);
		}
			
		break;
	case "searchBydocType":
		try{
			getSearchResultsBydocType(request,function(jsonObject){
				response.contentType("application/json");
				response.send({"data":jsonObject});
			});
		}catch(e){
			console.log(e);
		}
			
		break;
	case "fieldSearch":
		try{
			getSearchResultsWithFields(request.body, function(jsonObject){
				response.contentType("application/json");
				response.send({data:jsonObject});
			});
		}catch(e){
			// TODO: handle exception
		}
		break;
	case "queryTester":
		queryTester(request,function(jsonObject){
				response.contentType("application/json");
				response.send(jsonObject);
		})
		break;
	case "searchSpecs":
		getSearchSpecs(request, function(jsonObject){
			response.contentType("application/json");
			response.send(jsonObject);
		});
		break;
	case "getSpecListDoc":
		getSpecListDocById(request,function(jsonObject){
			response.contentType("application/json");
			response.send(jsonObject);
		});
		break;
	default:
		response.contentType('application/json');
		response.send({"error":"invalid request"});
		break;
	}
};
/**
 * With free text not focused on a particular docType
 * @param request
 * @param callback
 * 
 */
function getSearchResults(request, callback){
	var searchData=request.body;
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	if(!searchData.searchText){
		callback({"error":"Invalid Search String"});
		return;
	}

	if(typeof searchData.searchText!="string"){
		searchData.fields=searchData.searchText;
		getSearchResultsWithFields(searchData, callback);
		return;
	}
	client.search({
		q: searchData.searchText,
		from:searchData.from?searchData.from:0,
		size:searchData.size?(searchData.size*1+1):limitCount,
		_source:'doc.docType',
		index: indexName
	}).then(function(result){
		callback({"result":result})
	}, function(error){
		if(error){
			logger.error({type:"ES:getSearchResults",error:error});
			callback({"error":"Error Occurred, Try Again"});
		}
	});
	
}


function queryTester(request, callback){
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	client.search(request.body,function(err,res){
		callback(res);
	});
}

function getSearchCounts(request, callback){
	var searchData=request.body;
	if(typeof searchData.searchText!="string"  || searchData.searchText=="-"){
		callback({"error":"Invalid Search String"});
		return;
	}
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	var searchSchemas= ["Product","Manufacturer","collection","Supplier","Provider","Project","Article"];
	if(config.searchSchemas && Array.isArray(config.searchSchemas) && config.searchSchemas.length>0){
		searchSchemas=config.searchSchemas;
	}
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	
	var focusedSchemas=getFocussedSchemas(request)
	if(focusedSchemas.length>0){
		searchSchemas=focusedSchemas;
	}
		
	var countResp={};
	
	getSC(0);
	function getSC(index){
		request.body.docType=searchSchemas[index];
		var queryBody=constructSchemaSearchQuery(request);
			queryBody.search_type="count";
			if(logQueries){
				console.log("--------GET SEARCH COUNTS-----------");
				console.log(JSON.stringify(queryBody));
				console.log("-------------------------------------");
			}
		client.search(queryBody,function(err,res){
			if(res && res.hits && res.hits.total && res.hits.total>0){
				countResp[searchSchemas[index]]=res.hits.total;
			}
			if((index+1)<searchSchemas.length){
				getSC(index+1)
			}else{
				sendResponse();
			}
		});
	}
	function sendResponse(){
		callback(countResp);
	}
}

function getSearchResultsBydocType(request, callback){
	var searchData=request.body;
	if(!searchData.searchText){
		callback({"error":"Invalid Search String"});
		return;
	}
	if(typeof searchData.searchText!="string"){
		searchData.fields=searchData.searchText;
		getSearchResultsWithFields(searchData, callback);
		return;
	}
	if(!searchData.docType){
		callback({"error":"Invalid Search String"});
		return;
	}
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	getFocussedSchemas(request);
	var queryBody=constructSchemaSearchQuery(request);
	queryBody.from=searchData.from?searchData.from:0,
	queryBody.size=searchData.size?(searchData.size*1+1):limitCount;
	utility.getMainSchema({schema:searchData.docType},function(schema){
		if(schema.error){callback(schema);return;}
		var keys=GenericSummeryServer.getSummaryKeys(schema).keys;
		if(keys.indexOf("docType")==-1){
			keys.push("docType");
		}
		queryBody._source="";
		for(var i=0;i<keys.length;i++){
			queryBody._source+="doc."+keys[i]+",";
		};
		queryBody._source.replace(/\,$/,"");

		if(logQueries){
			console.log("--------GET SEARCH RESULTS BY DOCTYPE-----------");
			console.log(JSON.stringify(queryBody));
			console.log("-------------------------------------");
		}
		client.search(queryBody).then(function(result){
			callback({"result":result})
		},function(error){
			if(error){
				logger.error({type:"ES:getSearchResultsBydocType",error:error});
				callback({"error":"Error Occurred, Try Again"});
			}
		});
	});
}
exports.getSearchResultsBydocType=getSearchResultsBydocType;
/**
 * Understanding the search focus
 */
function getFocussedSchemas(request){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	
	var searchData=JSON.parse(JSON.stringify(request.body));
	try{searchData.searchText=searchData.searchText.toLowerCase().replace(/[^\w\s]/g," ").trim();}catch(err){}
	var searchKeywords=searchData.searchText.toLowerCase().split(" ");
	var schemas=["Product","Architect","Provider","Mfr","Manufacturer","Supplier","Distibutor","Dealer","ServiceProvider","service","Article","collection"];
	
	//if(config.searchSchemas && Array.isArray(config.searchSchemas) && config.searchSchemas.length>0){schemas=config.searchSchemas;}
	
	if(config.searchDependentProperties && Array.isArray(config.searchDependentProperties) && config.searchDependentProperties.length>0){
		dependentProperties=config.searchDependentProperties;
	}
	var focusedSchemas=[];
	searchKeywords.map(function(ele){
		var actual=ele;
		ele=ele.trim();
		//converting plural to singular
		ele=ele.replace(/s$/,"");
		ele=ele.replace(/S$/,"");
		ele=ele.replace(/IES$/,"");
		ele=ele.replace(/ies$/,"");
		for(var i=0;i<schemas.length;i++){
			if(schemas[i].toLowerCase()==ele.toLowerCase()){
				if(schemas[i]=="Architect"){
					focusedSchemas.push("Provider");
				}else if(schemas[i]=="Dealer" || schemas[i]=="Distibutor"){
					focusedSchemas.push("Supplier");
				}else if(schemas[i]=="Mfr"){
					focusedSchemas.push("Manufacturer");
				}else if(schemas[i]=="service"){
					focusedSchemas.push("ServiceProvider");
				}else{
					focusedSchemas.push(schemas[i]);
				}
				//searchData.searchText=searchData.searchText.replace(actual,"");
				searchData.searchText=searchData.searchText.replace(" "+actual,"");
				searchData.searchText=searchData.searchText.replace(actual+" ","");
			}
		}
		//removing dependentProperties key names from the search terms
		for(var i=0;i<dependentProperties.length;i++){
			if(dependentProperties[i].toLowerCase()==ele){
				/*searchData.searchText=searchData.searchText.replace(new RegExp("^"+actual+" ","gi")," ");
				searchData.searchText=searchData.searchText.replace(new RegExp(" "+actual+"$","gi")," ");
				searchData.searchText=searchData.searchText.replace(new RegExp(" "+actual+" ","gi")," ");
				*/
				searchData.searchText=searchData.searchText.replace(" "+actual,"");
				searchData.searchText=searchData.searchText.replace(actual+" ","");
			}
		}
		//removing stop words
		for(var i=0;i<stopWords.length;i++){
			if(stopWords[i].toLowerCase()==ele){
				/*searchData.searchText=searchData.searchText.replace(new RegExp("^"+actual+" ","gi")," ");
				searchData.searchText=searchData.searchText.replace(new RegExp(" "+actual+"$","gi")," ");
				searchData.searchText=searchData.searchText.replace(new RegExp(" "+actual+" ","gi")," ");
				*/
				searchData.searchText=searchData.searchText.replace(" "+actual,"");
				searchData.searchText=searchData.searchText.replace(actual+" ","");
			}
		}
		//for replacing plural to singular
		searchData.searchText=searchData.searchText.replace(actual,ele);
	});

	
	if(focusedSchemas.indexOf("Product")==-1){
		for(var pt in productTypesMappings){
			var productType=pt.toLowerCase();
			if(isSubArray(searchData.searchText.split(" "),[productType])){
				focusedSchemas.push("Product");
				break;
			}
			var foundFlag=false;
			if(Array.isArray(productTypesMappings[pt]) && productTypesMappings[pt].length>0){
				for(var index in productTypesMappings[pt]){
					var temp=productTypesMappings[pt][index].toLowerCase();
					if(isSubArray(searchData.searchText.split(" "),temp.split(" "))){
						focusedSchemas.push("Product");
						foundFlag=true;
						break;
					}
				}
				if(foundFlag){
					break;
				}
			}
		}
	}
	
	
	request.body.originalSearchText=request.body.searchText;
	request.body.searchText=searchData.searchText;
	return focusedSchemas;
}

function constructSchemaSearchQuery(request){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	var config=ContentServer.getConfigByHostId(cloudPointHostId);
	var searchData=request.body;
	var searchKeys= ["about","docType","mfrProductNo","name","productType","recordId","tags","esMeta"];
	
    
	
	if(config.searchKeys && Array.isArray(config.searchKeys) && config.searchKeys.length>0){
		searchKeys=config.searchKeys;
	}if(config.searchProductTypes && Array.isArray(config.searchProductTypes) && config.searchProductTypes.length>0){
		productTypes=config.searchProductTypes;
	}if(config.searchDependentProperties && Array.isArray(config.searchDependentProperties) && config.searchDependentProperties.length>0){
		dependentProperties=config.searchDependentProperties;
	}
	var queryBody={
		"body":{
			"query":{
				"bool" : {
					"must" : [{"match" : { "docType" : searchData.docType }},{"match" : {"$status":"published"}}]
				}
			}
		},
		"index": indexName,
		"_source":"doc.docType"
	};
	try{searchData.searchText=searchData.searchText.replace(/[^\w\s]/g," ").trim().toLowerCase();}catch(err){}
	if(searchData.docType=="Product"){
		var actualSearchText=searchData.searchText;
		var productTypesBoolQuery={bool:{should:[],minimum_should_match: 1}};
		for(var pt in productTypesMappings){
			var productType=pt.toLowerCase();
			if(isSubArray(actualSearchText.split(" "),[productType])){
				//productTypesBoolQuery.bool.should.push({"match" : { "productType" : productType }});
				
				var matchObj={"wildcard":{}};
				matchObj["wildcard"]["productType"]={value:productType,boost:1};
				productTypesBoolQuery.bool.should.push(matchObj);
				//console.log(productType,"-",actualSearchText,"-",productType)
				searchData.searchText=searchData.searchText.replace(productType,"");
				continue;
			}
			if(Array.isArray(productTypesMappings[pt]) && productTypesMappings[pt].length>0){
				var foundFlag=false;
				var flengtn=1;
				for(var index in productTypesMappings[pt]){
					var productTypeSubMapping=productTypesMappings[pt][index].toLowerCase();
					if(isSubArray(actualSearchText.split(" "),productTypeSubMapping.split(" "))){
						foundFlag=true;
						if(flengtn<productTypeSubMapping.split(" ").length){
							flengtn=productTypeSubMapping.split(" ").length;
						}
						//console.log(pt,"-",actualSearchText,"-",productTypeSubMapping)
						searchData.searchText=searchData.searchText.replace(productTypeSubMapping,"");
					}
				}
				if(foundFlag){
					//productTypesBoolQuery.bool.should.push({"match" : { "productType" : productType }});
					var matchObj={"wildcard":{}};
					matchObj["wildcard"]["productType"]={value:productType,boost:flengtn};
					productTypesBoolQuery.bool.should.push(matchObj);
				}
			}
		}
		if(productTypesBoolQuery.bool.should.length>0){
			queryBody.body.query.bool.must.push(productTypesBoolQuery);
		}
	}
	
	var searchKeywords=searchData.searchText.split(" ");
	searchKeywords=searchKeywords.filter(function(element){
		return element!=undefined && element!="" && element!=null;
	});
	/*
	best_fields (match any field, get score from best field)
	most_fields (match any fields and combine score from all fields)
	cross_fields (look for each word in any field)
	phrase (match phrase on each field and combine the score)
	phrase_prefixe (match prefix and combine score from each field) 
	*/
	if(searchKeywords.length>0){
		queryBody.body.query.bool.should=[];
		queryBody.body.query.bool.minimum_should_match=1;
		
		var queryKeys=searchData.docType=="Product"?searchKeys.concat(dependentProperties):searchKeys;
		queryKeys=queryKeys.filter(function(k){
			return k!="docType" && k!="$status";
		});
		/*queryBody.body.query.bool.should.push({
	        "multi_match": {
	          "query": searchData.searchText,
	          "type": "cross_fields",
	          "fields": queryKeys,
	          "boost": 3
	        }
		});*/
		
		var innerShouldMatch={bool:{should:[],minimum_should_match:searchKeywords.length}};
		for(var sl=0;sl<searchKeywords.length;sl++){
			var skShould={bool:{should:[],minimum_should_match:1}};
			for(var ski=0;ski<queryKeys.length;ski++){
				if(queryKeys[ski]!="height" && queryKeys[ski]!="depth"){
					var matchObj={"term":{}};
					matchObj["term"][queryKeys[ski]]={value:searchKeywords[sl].toLowerCase(),boost:3};
					skShould.bool.should.push(matchObj);
					
					if(queryKeys[ski]=="name"){
						/*var matchObj1={"wildcard":{}};
						matchObj1["wildcard"][queryKeys[ski]]={value:"*"+searchKeywords[sl].toLowerCase()+"*",boost:2};
						skShould.bool.should.push(matchObj1);*/
						
						var matchObj2={"fuzzy":{}};
						matchObj2["fuzzy"][queryKeys[ski]]={
								value:searchKeywords[sl].toLowerCase(),
								max_expansions:100
						};
						skShould.bool.should.push(matchObj2);
					}
				}
			}
			innerShouldMatch.bool.should.push(skShould);
		}
		queryBody.body.query.bool.should.push(innerShouldMatch);
	}
	//console.log("-----------\n"+JSON.stringify(queryBody)+"\n---------");
	return queryBody;
}


/**
 * 
 * @param searchData
 * searchData - structure 
 * searchData:{
 * 	fields:{
 *  	"docType":  "Product",
 *  	"collection": "collection9994006b-ad66-05c2-47f1-fcd945dd6aa7"
 * 	},
 * 	from:0,
 * 	size:10
 * } 
 * 
 * 
 * 
 * 
 * single string search "onlyStringToSearch"
 * {
 *  "query": { "match": { "address": "onlyStringToSearch" } }
 * }
 * multiple strings to search ["string1","string2","string3",.........]
 * {
 * "query": {
 *   "bool": {
 *     "should": [
 *       { "match": { "address": "string1" } },
 *       { "match": { "address": "string2" } }
 *     ]
 *   }
 * }
 * range query { "upper":"upperValue","lower":"lowerValue"}
 * 
 * 
 * 
 *  "range" : {
 *               "born" : {
  *                  "gte": "01/01/2012",
  *                  "lte": "2013",
  *                  "format": "dd/MM/yyyy||yyyy"
  *              }
  *          }
 * 
 * 
 * 
 * @param callback
 * 
 * @Source: https://www.elastic.co/guide/en/elasticsearch/guide/current/multi-query-strings.html
 */
function getSearchResultsWithFields(searchData, callback){
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	if(!searchData.fields){
		callback({"error":"Invalid Search Data"});
	}else{
		var fields = Object.keys(searchData.fields);
		var mustMatchArray=[];
		var filter={
			range: {}
		};
		utility.getMainSchema({schema:searchData.fields.docType,dependentSchema:searchData.dependentSchema},function(schema){
			if(schema.error){callback(schema);return;}
			for(var i=0; i<fields.length; i++){
				if(typeof searchData.fields[fields[i]]=="string"){
					var matchJson = {};
					matchJson['match']= {};
					matchJson['match'][fields[i]]=searchData.fields[fields[i]];
					mustMatchArray.push(matchJson);
				}else if(Array.isArray(searchData.fields[fields[i]]) && searchData.fields[fields[i]].length>0){
					var arrayMatchJson={
							"bool": {
								"should": []
							}
					};
					for(var ai=0;ai<searchData.fields[fields[i]].length;ai++){
						var matchJson = {};
						matchJson['match']= {};
						matchJson['match'][fields[i]]=searchData.fields[fields[i]][ai];
						arrayMatchJson.bool.should.push(matchJson);
					}
					mustMatchArray.push(arrayMatchJson);
				}else if(typeof searchData.fields[fields[i]]=="object" && 
						(searchData.fields[fields[i]].upper || searchData.fields[fields[i]].lower)){
					filter.range[fields[i]]={}
					if(searchData.fields[fields[i]].upper){
						filter.range[fields[i]]["gte"]=searchData.fields[fields[i]].upper;
					}
					if(searchData.fields[fields[i]].lower){
						filter.range[fields[i]]["lte"]=searchData.fields[fields[i]].lower;
					}
				}
			}
			var queryJSON={
				body:{
					query: {
						bool: {
							must: mustMatchArray
						}
					}
				},
				from:searchData.from?searchData.from:0,
				size:searchData.size?(searchData.size*1+1):limitCount,
				_source:'doc.docType',
				index: indexName
			};
			if(Object.keys(filter.range).length>0){
				queryJSON.body.filter=filter;
			}
			
			var keys=GenericSummeryServer.getSummaryKeys(schema).keys;
			if(keys.indexOf("docType")==-1){
				keys.push("docType");
			}
			queryJSON._source="";
			for(var i=0;i<keys.length;i++){
				queryJSON._source+="doc."+keys[i]+",";
			};
			queryJSON._source.replace(/\,$/,"");
			if(logQueries){
				console.log("------------Search Results With Fields-----------------");
				console.log(JSON.stringify(queryJSON));
				console.log("-------------------------------------------------------");
			}
			client.search(queryJSON).then(function(result){
				callback({"result":result})
			}, function(error){
				if(error){
					logger.error({type:"ES:getSearchResultsWithFields",error:error});
					callback({"error":"Error Occurred, Try Again"});
				}
			});
		});
	}
}
exports.getSearchResultsWithFields=getSearchResultsWithFields;

function getSummaryResults(searchData, callback){
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	if(!searchData.query){
		callback({"error":"Invalid Search Data"});
	}else{
		client.search(searchData.query).then(function(result){
			callback(result);
		}, function(error){
			if(error){
				//console.log(error);
				//logger.error({type:"ES:getSummaryResults",error:error});
				callback({"error":"Error Occurred, Try Again"});
			}
		});;
	}
}
exports.getSummaryResults=getSummaryResults;



/**
 * 
 * @param request
 * @param callback
 * @Source https://www.elastic.co/guide/en/elasticsearch/reference/1.7/search-request-highlighting.html
 */
function getSearchSpecs(request, callback){
	var searchData=request.body.text;
	var body= {
			"index":"attachments",
			"type":"document",
			"body":{
				"from":0,"size":300,
				"_source":{"exclude":["content"]},
				/*"query":{"query_string":{"query":searchData}},*/
				"query":{
					"bool": {
					     "should": [
					       { "match_phrase_prefix": { "content": searchData } },
					       { "query_string": { default_field : "content", query: searchData } }
					     ]
					   }
				},
				"highlight":{
					"pre_tags":["<mark>"],"post_tags":["</mark>"],
					"fields":{"content":{"number_of_fragments":300}}
				}
			}
	};
	
	if(!client){
		client = new elasticsearch.Client({host:esHost});
	}
	if(searchData.length>0){
		
		client.search(body).then(function(result){
			callback({"result":result})
		}, function(error){
			if(error){
				logger.error({type:"ES:getSearchSpecs:>0",error:error});
				callback({"error":"Error Occurred, Try Again"});
			}
		});
	}else if(searchData==''){
		body.body={  "from": 0, "size": 300,  "_source": { "exclude": ["content"]}};
		client.search(body).then(function(result){
			callback({"result":result})
		}, function(error){
			if(error){
				logger.error({type:"ES:getSearchSpecs:''",error:error});
				callback({"error":"Error Occurred, Try Again"});
			}
		});
	}
	
	
}



/**
 * 
 * @param req
 * @param callback
 * @Source 
 */
function getSpecListDocById(req, callback){
	var docId=req.body.docId;
	if(docId){
		if(!client){
			client = new elasticsearch.Client({host:esHost});
		}
		client.get({
			"index":"attachments", 
			"type":"document", 
			id: docId, 
			ignore: [404]
		},function(error, body){
			if(error){
				logger.error({type:"ES:getSpecListDocById",error:error});
				callback({error: "We are facing problems, Try again later"});
			}
			if(body){
				console.log("Doc Found with ID: "+docId);
				callback({result: body});
			}
			
		});
	}else{
		callback({error: "Doc ID is missing"});
	}
}








