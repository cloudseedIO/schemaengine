var reactConfig=require('../../config/ReactConfig');
var config=reactConfig.init;
var urlParser=require('./URLParser');
var couchbase = require('couchbase');
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;

var CouchBaseUtil=require('./CouchBaseUtil');
var limitCount=require("../utils/global.js").summaryLimitCount*2+1//19;// 9

var utility=require('./utility.js');
var ContentServer=require('../ContentServer.js');
var ElasticSearch=require('./ElasticSearch.js');
var GenericServer=require('./GenericServer.js');
var logQueries=false;

//GenericController : getSchemaRecords
//Checked for schema previlege if error no records send
function checkAndGetSchemaRecords(request,callback){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=(ContentServer.getConfigDetails(hostname))?ContentServer.getConfigDetails(hostname).cloudPointHostId:undefined;
	var data=urlParser.getRequestBody(request);
	data.schemaRoleOnOrg={};
	data.cloudPointHostId=cloudPointHostId;
	GenericServer.getSchemaRoleOnOrg(request,{org:data.org,schema:data.schema},function(schemaRoles){
		data.schemaRoleOnOrg=schemaRoles;
		if(schemaRoles && Object.keys(schemaRoles).length>0){
			getSchemaRecords(data,function(resp){
				callback(resp);
			});
		}else{
			callback({"error":"No privilege"});
		}
	});
}
exports.checkAndGetSchemaRecords=checkAndGetSchemaRecords;


/**
 * 
 * @param data
 *            (schema,skip)
 * @param callback
 */
function lookupSchema(request,callback){
	var hostname=request.headers.host.split(":")[0];
	var cloudPointHostId=ContentServer.getConfigDetails(hostname).cloudPointHostId;
	
	var data=urlParser.getRequestBody(request);
	var filters=data.filters;
	if(data.filterKey){
		filters={};
		for(var key in data.filterKey){
			filters[key]=[data.filterKey[key]];
		}
	}// need to change public
	var org="public";
	if(data.org){
		org=data.org;
	}
	var data={
		lookup:true,
		userId:data.userId,
		org:org,
		schema:data.schema,
		dependentSchema:data.dependentSchema,
		skip:data.skip,
		limit:data.limit,
		filters:filters,
		viewName:data.viewName,
		searchKey:data.searchKey,
		stale:data.stale,
		cloudPointHostId:cloudPointHostId,
		identifierCheck:data.identifierCheck,
		onlyCurrentOrgRecords:data.onlyCurrentOrgRecords
	}
	/*request.body.userId=data.userId;
	request.body.org=org;
	request.body.schema=data.schema;
	request.body.skip=data.skip;
	request.body.filters=filters;
	request.body.viewName="summary";
	request.body.searchKey=data.searchKey;
	request.body.stale=data.stale;*/
	
	getSchemaRecords(data,function(response){
		if(data.identifierVal){
			var identifierStatus="notExists";
			var len = response.records.length;
	        if(len > 0){
		        for(var i = 0;i < len;i++){
		            if(data.recordId && response.records[i].id != data.recordId){
		                if(response.records[i].value[response.schema["@identifier"]] == data.identifierVal){
		                	identifierStatus="exists";
		                    return;
		                }
		            }
		        }
	        }
	        callback(identifierStatus);
		}else{
			callback(response);
		}
	});
}

exports.lookupSchema=lookupSchema;

function getSummaryKeys(schema){
	  var keys=[];

	    keys.push("recordId");
	    keys.push("org");
	    keys.push("$status");
	    keys.push("@uniqueUserName");
	    keys.push("record_header");
	    //keys.push("author");
	    //keys.push("editor");
	    //keys.push("dateModified");
	    //keys.push("dateCreated");
	    //keys.push("dependentProperties");
	    
	    var viewFound=false;
	    try{
			for(var i=0;i<schema["@views"].length;i++){
				if(schema["@views"][i].viewName=="summary"){
					viewFound=true;
					for(var index in schema["@views"][i].value){
						if(keys.indexOf(schema["@views"][i].value[index])==-1){
							keys.push(schema["@views"][i].value[index]);
						}
					}
					for(var index in schema["@views"][i].key){
						if(keys.indexOf(schema["@views"][i].key[index])==-1){
							keys.push(schema["@views"][i].key[index]);
						}
					}
					break;
				}
			}
			/**
			 * Code hack for products 
			 * updating all categories may failed for some products 
			 */
			if(schema["@id"]=="Product"){		
				[
				 "name","esMeta","productImages","Manufacturer","productImages","groupID","specifications","description","mfrProductNo",
				 "@uniqueUserName","dependentProperties","countryOfOrigin","countryOfAvailability","freeSampleAvailable","productType"
				].forEach(function(tk){	
					if(keys.indexOf(tk)==-1){keys.push(tk);}
				});			
			}
			var derivedKeys=[];
		    for(var key in schema["@properties"]){
		    	if(schema["@properties"][key].derivedProperty){
		    		derivedKeys.push(key);
		    	}else{
		    		if(!viewFound && keys.indexOf(key)==-1){
		    			keys.push(key);
		    		}
		    	}
		    }
		    
	    }catch(err){
	    	console.log(err);
	    }
	    
	    return {keys:keys,derivedKeys:derivedKeys};
}
exports.getSummaryKeys=getSummaryKeys;

function getSchemaRecordsN1ql(data,callback){
    var schema=data.schemaRecord;
    var filters=data.filters?data.filters:{};
    //filters.docType=data.schema;
    var docTypeCondition=" `docType`=\""+data.schema+"\" AND ";
    var addDefaultSortOrder=true;
    if(schema["@type"]=="abstractObject"){
		if(data.dependentSchema){
			//filters[schema["@dependentKey"]]=[data.dependentSchema];
			docTypeCondition+=" `"+schema["@dependentKey"]+"`=\""+data.dependentSchema+"\" AND ";
			if(data.dependentSchema=="Fabric" || data.dependentSchema=="Carpet" || data.dependentSchema=="Wallpapers"){
				addDefaultSortOrder=false;
			}
		}else if(data.schema=="Product"){
			addDefaultSortOrder=false;
		}
	}
    
    var orgSecurity=true
	if(schema["@security"]  && schema["@security"]["recordLevel"]){
		if(schema["@security"]["recordLevel"].view=="all" ||
				schema["@security"]["recordLevel"].view=="public" ||
				(data.schemaRoleOnOrg && data.schemaRoleOnOrg.cloudPointAdmin)){
		}else{
			filters[schema["@security"]["recordLevel"].view]=data.userId;
		}
		orgSecurity=false;
	}
	//filters.org=data.org;
    var keys=getSummaryKeys(schema).keys;
    var derivedKeys=getSummaryKeys(schema).derivedKeys;
    
    var queryString="";
	var queryString="SELECT "+(data.forCounts?" COUNT (*) AS total ":("`"+keys.join("`,`"))+"`")+" FROM records ";
	if(schema.globalIndex){
		queryString+=" USE INDEX ("+schema.globalIndex+") ";
	}
	queryString+=" WHERE "+docTypeCondition;
	if(orgSecurity && data.schema!="Role" && data.schema!="UserRole" && data.schema!="User"){
		var lookuptemp="";
		if(data.lookup && data.org!="public" && !data.onlyCurrentOrgRecords){
			lookuptemp=" OR `org` = \"public\" ";
		}
		var publicSummaryTemp="";
		if(data.org=="public"){
			publicSummaryTemp=" OR  `$status` = \"published\" ";
		}
		if(filters && Array.isArray(filters.org) && filters.org.length>0){
			queryString +="( `org` IN [\""+filters.org.join('","')+"\"] "+lookuptemp+" "+publicSummaryTemp+" ) AND ";
			delete filters.org;
		}else{
			queryString +="( `org` = \""+data.org+"\" "+lookuptemp+" "+publicSummaryTemp+" ) AND ";
		}
	}
	if(data.schema=="UserRole" && (!data.filters || (data.filters && !data.filters.org))){
		queryString +="`org`=\""+data.org+"\" AND ";
	}
	
	//if(Object.keys(data.filters).length==0){
		//queryString=queryString.trim();
		//queryString=queryString.replace(/WHERE$/,"");
		
	//}else{
		for(var key in filters){
			var tempKey=key;
			if(derivedKeys.indexOf(key)>-1){
				tempKey="`dependentProperties`.`"+key+"`";
			}else{
				tempKey="`"+key+"`";
			}
			if(schema["@properties"] && 
					schema["@properties"][key] && 
					schema["@properties"][key].dataType &&  
					schema["@properties"][key].dataType.type=="boolean"){
				var bval=false;
				if(Array.isArray(filters[key]) && filters[key].length>0){
					bval=filters[key][0];
				}else{
					bval=filters[key];
				}
				if(bval){
					queryString+= " "+tempKey+"=true  AND ";
				}else{
					queryString+= " ("+tempKey+"=false OR "+tempKey+" IS MISSING ) AND ";
				}
				
			}else if(schema["@properties"] && 
					schema["@properties"][key] && 
					schema["@properties"][key].dataType &&  
					(schema["@properties"][key].dataType.type=="number" ||
					(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="number"))){
				if(Array.isArray(filters[key])){
					if(filters[key].length==1){//minimum value provided
						filters[key].push(filters[key][0]);
					}
					if(schema["@properties"][key].dataType.type=="array"){
						queryString += "ANY item IN "+tempKey+" SATISFIES item >= "+filters[key][0]+" AND item <= "+filters[key][1]+"  END AND ";
					}else{
						queryString += ""+tempKey+" >="+ filters[key][0]*1+" AND "+tempKey+" <="+ filters[key][1]+" AND ";
					}
				}else{
					queryString += ""+tempKey+" ="+ filters[key]+" AND ";
				}
			}else if(schema["@properties"] && 
					schema["@properties"][key] && 
					schema["@properties"][key].dataType &&  
					(schema["@properties"][key].dataType.type=="color" || 
					(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="color"))){
				//ANY item	IN hobbies	SATISFIES item IN	["golf"] END
				var colorFltr="";
				if(Array.isArray(filters[key]) && filters[key].length>0){
					if(filters[key][0].split(" ").length==1){
						colorFltr=filters[key][0].split(" ")[0];
					}else if(filters[key][0].split(" ").length==2){
						colorFltr=filters[key][0].split(" ")[1];
					}else if(filters[key][0].split(" ").length>2){
						colorFltr=filters[key][0].split(" ")[2];
					}
				}else{
					colorFltr=filters[key];
				}
				if(schema["@properties"][key].dataType.type=="color" && (colorFltr && colorFltr.length>0)){
					queryString+="lower("+tempKey +") like \"%"+ colorFltr.toLowerCase()+"%\" AND ";
				}else{
					queryString += "ANY item IN "+tempKey+" SATISFIES item like \"%"+ filters[key].toLowerCase()+"%\"  END AND ";
				}
			}else if(schema["@properties"] && 
					schema["@properties"][key] && 
					schema["@properties"][key].dataType &&  
					(schema["@properties"][key].dataType.type=="multiPickList" || 
					schema["@properties"][key].dataType.type=="array")){
				//ANY item	IN hobbies	SATISFIES item IN	["golf"] END
				if(Array.isArray(filters[key])){
					if(filters[key].length==1){
						queryString += "ANY item IN "+tempKey+" SATISFIES item = \""+filters[key][0]+"\"  END AND ";
					}else if(filters[key].length>1){
						queryString += "ANY item IN "+tempKey+" SATISFIES item IN [\""+filters[key].join('","')+"\"]  END AND ";
					}
				}else{
					queryString += "ANY item IN "+tempKey+" SATISFIES item =\""+ filters[key]+"\"  END AND ";
				}
			}else{
				if(Array.isArray(filters[key])){
					if(filters[key].length==1){
						queryString+=tempKey+" = \""+filters[key][0]+"\" AND ";
					}else if(filters[key].length>1){
						queryString+=tempKey+" IN [\""+filters[key].join('","')+"\"] AND ";
					} 
				}else{
					queryString+=tempKey +"=\""+ filters[key]+"\" AND ";
				}
			}
		}
		queryString=queryString.trim();
		queryString=queryString.replace(/AND$/,"");
	//}
	if(data.searchKey && data.searchKey!=""){
		var flag=false;
		if(schema["@identifier"] && schema["@identifier"] != "recordId"){
			flag=true;
			if(queryString.indexOf("WHERE")>-1){
				queryString+=" AND ( LOWER(`"+schema["@identifier"]+"`) LIKE  '%"+data.searchKey.toLowerCase()+"%' ";
			}else{
				queryString+=" WHERE ( LOWER(`"+schema["@identifier"]+"`) LIKE  '%"+data.searchKey.toLowerCase()+"%' ";
			}
		}
		if(Array.isArray(schema["searchProperties"])){
			for(var i=0;i<schema["searchProperties"].length;i++){
				if(schema["searchProperties"][i]!=schema["@identifier"]){
					flag=true;
					if(queryString.indexOf("WHERE")>-1){
						queryString+=" OR LOWER(`"+schema["searchProperties"][i]+"`) LIKE  '%"+data.searchKey.toLowerCase()+"%' ";
					}else{
						queryString+=" WHERE LOWER(`"+schema["searchProperties"][i]+"`) LIKE  '%"+data.searchKey.toLowerCase()+"%' ";
					}
				}
			}
		}
		if(flag){
			queryString+=" )  ";
		}
		
	}

	
	
	if(!data.forCounts){
		if(data.sortBy){
			var sortKey=data.sortBy;
			if(schema["@sortBindings"] && schema["@sortBindings"][sortKey]){
				sortKey=schema["@sortBindings"][sortKey];
			}
			queryString +=" ORDER BY `"+sortKey+"` "+(data.sortOrder=="ascend"?"ASC":"DESC");
		}else if(schema["@identifier"] && schema["@identifier"] != "recordId"){
			if(addDefaultSortOrder){
				var sortKey=schema["@identifier"];
				if(schema["@sortBindings"] && schema["@sortBindings"][sortKey]){
					sortKey=schema["@sortBindings"][sortKey];
				}
				queryString +=" ORDER BY `"+sortKey+"` ";
			}
		}
		queryString +=" LIMIT "+(data.limit?(data.limit+1):limitCount)+" ";
		if(typeof data.skip !="undefined" && data.skip!=null){
			queryString +=" OFFSET "+data.skip+" ";
		}
	}
	if(logQueries){
		console.log("=======N1QL SUMMARY QUERY========");
		console.log(queryString);
		console.log("==================================");
	}
	//var query=N1qlQuery.fromString(queryString)
	//query.adhoc = false;
	CouchBaseUtil.executeN1QL(queryString,{parameters:[]},function(results){
		if(results.error){
			callback(results);
			return;
		};
		if(data.forCounts){
			try{callback({total:results[0].total});}catch(err){callback({total:0})}
		}else{
			var summary=[];
			for(var index in results){
				summary.push({id:results[index].recordId,value:results[index],key:[]})
			}
			callback({schema:schema,records:summary});
		}
	});
}

function getApplicableFilters(data,callback){
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		/*if(schema.summaryDatabase=="ES" || schema.summaryDatabase=="ElasticSearch"){
			getApplicableFiltersES(data,callback);
			return;
		}*/
		var allFilters=data.allFilters;
		var filters=data.selectedFilters;
		var filtersToGet=allFilters;
		/*if(schema["@type"]=="abstractObject"){
			if(data.dependentSchema){
				if(data.dependentSchema=="Fabric" || data.dependentSchema=="Carpet" || data.dependentSchema=="Wallpapers"){
					callback({error:"Data set limit exceeds"})
					return;
				}
			}
		}*/
		/*var filtersToGet=[];
		for(var i in allFilters){
			if(!filters[allFilters[i]]){
				filtersToGet.push(allFilters[i]);
			}else if(Array.isArray(filters[allFilters[i]]) && filters[allFilters[i]].length==0){
				filtersToGet.push(allFilters[i]);
			}
		}*/
		//console.log(filtersToGet);
		var resultsToSend={};
		getFilters(0);
		function getFilters(index){
			if(index<filtersToGet.length){
				var queryString="SELECT ";
				if(schema["@properties"] && schema["@properties"][filtersToGet[index]].derivedProperty){
					queryString+="distinct(dependentProperties.`"+filtersToGet[index]+"`) ";
				}else{
					queryString+="distinct(`"+filtersToGet[index]+"`) ";
				}
				queryString+=" FROM records ";
				if(schema.globalIndex){
					queryString+=" USE INDEX ("+schema.globalIndex+") ";
				}
				queryString+=" WHERE docType=\""+data.schema+"\"  AND ";
				if(schema["@type"]=="abstractObject"){
					if(data.dependentSchema){
						queryString+=" `"+schema["@dependentKey"]+"`=\""+data.dependentSchema+"\" AND ";
					}
				}
				for(var key in filters){
					if(key!=filtersToGet[index]){
						var tempKey=key;
						if(schema["@properties"] && schema["@properties"][key] && schema["@properties"][key].derivedProperty){
							tempKey="`dependentProperties`.`"+key+"`";
						}else{
							tempKey="`"+key+"`";
						}
						if(schema["@properties"] && 
								schema["@properties"][key] && 
								schema["@properties"][key].dataType &&  
								schema["@properties"][key].dataType.type=="boolean"){
							var bval=false;
							if(Array.isArray(filters[key]) && filters[key].length>0){
								bval=filters[key][0];
							}else{
								bval=filters[key];
							}
							if(bval){
								queryString+= " "+tempKey+"=true  AND ";
							}else{
								queryString+= " ("+tempKey+"=false OR "+tempKey+" IS MISSING ) AND ";
							}
							
						}else if(schema["@properties"] && 
								schema["@properties"][key] && 
								schema["@properties"][key].dataType &&  
								(schema["@properties"][key].dataType.type=="number" ||
								(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="number"))){
							if(Array.isArray(filters[key])){
								if(filters[key].length==1){//minimum value provided
									filters[key].push(filters[key][0]);
								}
								if(schema["@properties"][key].dataType.type=="array"){
									queryString += "ANY item IN "+tempKey+" SATISFIES item >= "+filters[key][0]+" AND item <= "+filters[key][1]*1+"  END AND ";
								}else{
									queryString += ""+tempKey+" >="+ filters[key][0]+" AND "+tempKey+" <="+ filters[key][1]+" AND ";
								}
							}else{
								queryString += ""+tempKey+" ="+ filters[key]+" AND ";
							}
						}else if(schema["@properties"] && 
								schema["@properties"][key] && 
								schema["@properties"][key].dataType &&  
								(schema["@properties"][key].dataType.type=="color" || 
								(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="color"))){
							//ANY item	IN hobbies	SATISFIES item IN	["golf"] END
							var colorFltr="";
							if(Array.isArray(filters[key]) && filters[key].length>0){
								if(filters[key][0].split(" ").length==1){
									colorFltr=filters[key][0].split(" ")[0];
								}else if(filters[key][0].split(" ").length==2){
									colorFltr=filters[key][0].split(" ")[1];
								}else if(filters[key][0].split(" ").length>2){
									colorFltr=filters[key][0].split(" ")[2];
								}
							}else{
								colorFltr=filters[key];
							}
							if(schema["@properties"][key].dataType.type=="color"){
								queryString+="lower("+tempKey +") like \"%"+ colorFltr.toLowerCase()+"%\" AND ";
							}else{
								queryString += "ANY item IN "+tempKey+" SATISFIES item like \"%"+ filters[key].toLowerCase()+"%\"  END AND ";
							}
						}else if(schema["@properties"] && 
								schema["@properties"][key] && 
								schema["@properties"][key].dataType &&  
								(schema["@properties"][key].dataType.type=="multiPickList" || 
								schema["@properties"][key].dataType.type=="array")){
							//ANY item	IN hobbies	SATISFIES item IN	["golf"] END
							if(Array.isArray(filters[key])){
								if(filters[key].length==1){
									queryString += "ANY item IN "+tempKey+" SATISFIES item = \""+filters[key][0]+"\"  END AND ";
								}else if(filters[key].length>1){
									queryString += "ANY item IN "+tempKey+" SATISFIES item IN [\""+filters[key].join('","')+"\"]  END AND ";
								}
							}else{
								queryString += "ANY item IN "+tempKey+" SATISFIES item =\""+ filters[key]+"\"  END AND ";
							}
						}else {
							if(Array.isArray(filters[key])){
								if(filters[key].length==1){
									queryString+=tempKey+" = \""+filters[key][0]+"\" AND ";
								}else if(filters[key].length>1){
									queryString+=tempKey+" IN [\""+filters[key].join('","')+"\"] AND ";
								}
							}else{
								queryString+=tempKey +"=\""+ filters[key]+"\" AND ";
							}
						}
					}
				}

				queryString=queryString.trim();
				queryString=queryString.replace(/AND$/,"");
				
				if(logQueries){
					console.log("======N1QL APPLICABLE QUERY=========");
					console.log(queryString);
					console.log("=====================================");
				}
				/*var query=N1qlQuery.fromString(queryString);
				query.adhoc = false;*/
				CouchBaseUtil.executeN1QL(queryString,{ parameters:[]},function(response){
					var tempRes=[];
					if(response.error){
						console.log(response);
					}else{
						response.map(function(res){
							if(res[filtersToGet[index]]){
								if(Array.isArray(res[filtersToGet[index]])){
									res[filtersToGet[index]].map(function(ele){
										if(tempRes.indexOf(ele)==-1){
											tempRes.push(ele);
										}
									});
								}else{
									tempRes.push(res[filtersToGet[index]]);
								}
							}
						});
						resultsToSend[filtersToGet[index]]=tempRes;
					}
					getFilters(index+1);
				});
					
			}else{
				callback(resultsToSend);
			}
		}
	});
}
exports.getApplicableFilters=getApplicableFilters;

function getCaseInsensitiveESSearchMatchJSON(key,value){
	//var wildcardJson={"wildcard":{}}
	//wildcardJson["wildcard"][key]="*"+value.toLowerCase()+"*";
	//{"regexp": {"countryName": ".*(i|I)(n|N)(d|D)(i|I)(a|A).*"}}	
	
	var wildcardJson={"regexp":{}};
	var regexp=".*";
	var reserved=[".","?","+","*","|","{","}","[","]","(",")","\"","\\"];//"#","@","&","<",">","~"
	for(var i=0;i<value.length;i++){
		if(reserved.indexOf(value[i])==-1){
			var reg=value[i];
			var inv=(reg==value[i].toUpperCase())?value[i].toLowerCase():value[i].toUpperCase();
			regexp+="("+reg+"|"+inv+")";
		}else{
			regexp+="\\"+value[i];
		}
	}
	regexp+=".*";
	wildcardJson["regexp"][key]=regexp;
	return wildcardJson;
	
}
function getApplicableFiltersES(data,callback){
	var keywordPrefix="doc.";
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		var allFilters=data.allFilters;
		var filters=data.selectedFilters;
		var filtersToGet=allFilters;
		var resultsToSend={};
		getFilters(0);
		function getFilters(index){
			if(index<filtersToGet.length){

				var mustMatchArray=[];
				var mustNotMatchArray=[];
				var rangeFilter={
					range: {}
				};
				
				var matchJson = {"match":{}};
				matchJson["match"][keywordPrefix+"docType"]=data.schema;
				mustMatchArray.push(matchJson);
				
				if(schema["@type"]=="abstractObject"){
					if(data.dependentSchema){
						var matchJson = {"match":{}};
						matchJson["match"][keywordPrefix+schema["@dependentKey"]]=data.dependentSchema;
						mustMatchArray.push(matchJson);
					}
				}
				
				
				for(var key in filters){
					if(key!=filtersToGet[index]){
					var tempKey=key;
					if(schema["@properties"] && schema["@properties"][key] && schema["@properties"][key].derivedProperty){
						tempKey="dependentProperties."+key+"";
					}
					if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							schema["@properties"][key].dataType.type=="boolean"){
						var bval=false;
						if(Array.isArray(filters[key]) && filters[key].length>0){
							bval=filters[key][0];
						}else{
							bval=filters[key];
						}
						var matchJson = {"match":{}};
						matchJson["match"][keywordPrefix+tempKey]=true;
						if(bval){
							mustMatchArray.push(matchJson);
						}else{
							//mustNotMatchArray.push(matchJson);
							//if true is taken how should we get it as distinct value
							//hense removing it
						}
						
					}else if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							(schema["@properties"][key].dataType.type=="number" ||
							(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="number"))){
						if(Array.isArray(filters[key])){
							if(filters[key].length==1){//minimum value provided
								filters[key].push(filters[key][0]);
							}
							rangeFilter.range[keywordPrefix+tempKey]={}
							rangeFilter.range[keywordPrefix+tempKey]["gte"]=filters[key][1];
							rangeFilter.range[keywordPrefix+tempKey]["lte"]=filters[key][0];
						}else{
							var matchJson = {"match":{}};
							matchJson["match"][keywordPrefix+tempKey]=filters[key];
							mustMatchArray.push(matchJson);
						}
					}else if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							(schema["@properties"][key].dataType.type=="color" || 
							(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="color"))){
					
						var colorFltr="";
						if(Array.isArray(filters[key]) && filters[key].length>0){
							if(filters[key][0].split(" ").length==1){
								colorFltr=filters[key][0].split(" ")[0];
							}else if(filters[key][0].split(" ").length==2){
								colorFltr=filters[key][0].split(" ")[1];
							}else if(filters[key][0].split(" ").length>2){
								colorFltr=filters[key][0].split(" ")[2];
							}
						}else{
							colorFltr=filters[key];
						}
						/*var wildcardJson={"wildcard":{}}
						wildcardJson["wildcard"][tempKey]="*"+colorFltr.toLowerCase()+"*";
						mustMatchArray.push(wildcardJson);*/
						mustMatchArray.push(getCaseInsensitiveESSearchMatchJSON(keywordPrefix+tempKey,colorFltr));
					}else if(schema["@properties"] && 
							schema["@properties"][key] && 
							schema["@properties"][key].dataType &&  
							(schema["@properties"][key].dataType.type=="multiPickList" || 
							schema["@properties"][key].dataType.type=="array")){
						if(Array.isArray(filters[key]) && filters[key].length==1){
							filters[key]=filters[key][0];
						}
						if(Array.isArray(filters[key])){
							var arrayMatchJson={
									"bool": {
										"should": []
									}
							};
							for(var ai=0;ai<filters[key].length;ai++){
								var matchJson = {"match":{}};
								matchJson["match"][keywordPrefix+tempKey]=filters[key][ai];
								arrayMatchJson.bool.should.push(matchJson);
							}
							mustMatchArray.push(arrayMatchJson);
						}else{
							var matchJson = {"match":{}};
							matchJson["match"][keywordPrefix+tempKey]=filters[key];
							mustMatchArray.push(matchJson);
						}
						
					}else{
						if(Array.isArray(filters[key]) && filters[key].length==1){
							filters[key]=filters[key][0];
						}
						if(Array.isArray(filters[key])){
							var arrayMatchJson={
									"bool": {
										"should": []
									}
							};
							for(var ai=0;ai<filters[key].length;ai++){
								var matchJson = {"match":{}};
								matchJson["match"][keywordPrefix+tempKey]=filters[key][ai];
								arrayMatchJson.bool.should.push(matchJson);
							}
							mustMatchArray.push(arrayMatchJson);
						}else{
							var matchJson = {"match":{}};
							matchJson["match"][keywordPrefix+tempKey]=filters[key];
							mustMatchArray.push(matchJson);
							
						}
					}
				}
				}
				
				
				
				var currentGetDistinct=filtersToGet[index];
				if(schema["@properties"][currentGetDistinct] && schema["@properties"][currentGetDistinct].derivedProperty){
					currentGetDistinct="dependentProperties."+currentGetDistinct;
				}
				currentGetDistinct=keywordPrefix+currentGetDistinct;
				
				var queryJSON={
						body:{
							query: {
								bool: {
									must: mustMatchArray,
									must_not:mustNotMatchArray
								}
							},
							aggs:{
							   distincts:{
								   terms: {
									  field: currentGetDistinct,
									  size:100
								   }
							   }
							},
							
						},
						size:0,
						index: config.esSummaryIndex
					};
					if(Object.keys(rangeFilter.range).length>0){
						queryJSON.body.filter=rangeFilter;
					}

					if(logQueries){
						console.log("=======ES APPLICABLE FILTERS QUERY========");
						console.log(JSON.stringify(queryJSON));
						console.log("===========================================");
					}
					ElasticSearch.getSummaryResults({query:queryJSON},function(result){
						var tempRes=[];
						result.aggregations.distincts.buckets.map(function(agg){
							if(agg.key)
							tempRes.push(agg.key);
						});
						resultsToSend[filtersToGet[index]]=tempRes;
						getFilters(index+1);
					});
				
			}else{
				callback(resultsToSend);
			}
		}
	});
}

function getSchemaRecordsES(data,callback){
	var keywordPrefix="doc.";
	var mustMatchArray=[];
	var mustNotMatchArray=[];
	var rangeFilter={
		range: {}
	};
	var sort={};
	var schema=data.schemaRecord;
    var keys=getSummaryKeys(schema).keys;
    var derivedKeys=getSummaryKeys(schema).derivedKeys;
	var filters=data.filters?data.filters:{};
	var matchJson = {"match":{}};
		matchJson["match"][keywordPrefix+"docType"]=data.schema;
		mustMatchArray.push(matchJson);
		
	if(schema["@type"]=="abstractObject"){
		if(data.dependentSchema){
			var matchJson = {"match":{}};
				matchJson["match"][keywordPrefix+schema["@dependentKey"]]=data.dependentSchema;
				mustMatchArray.push(matchJson);
			if(filters && Array.isArray(filters[schema["@dependentKey"]]) && filters[schema["@dependentKey"]].length>0){
				filters[schema["@dependentKey"]]=filters[schema["@dependentKey"]].filter(function(k){
					return k!=data.dependentSchema;
				});
				if(filters[schema["@dependentKey"]].length==0){
					delete filters[schema["@dependentKey"]];
				}
			}else if(filters && filters[schema["@dependentKey"]]==data.dependentSchema){
				delete filters[schema["@dependentKey"]];
			}
		}
	}
	    
    var orgSecurity=true
	if(schema["@security"]  && schema["@security"]["recordLevel"]){
		if(schema["@security"]["recordLevel"].view=="all" ||
				schema["@security"]["recordLevel"].view=="public" ||
				(data.schemaRoleOnOrg && data.schemaRoleOnOrg.cloudPointAdmin)){
		}else{
			var matchJson = {"match":{}};
			matchJson["match"][keywordPrefix+schema["@security"]["recordLevel"].view]=data.userId;
			mustMatchArray.push(matchJson);
		}
		orgSecurity=false;
	}
    if(orgSecurity && data.schema!="Role" && data.schema!="UserRole" && data.schema!="User"){
		var orgsToCheck=[data.org];
		var statusToCheck=[];
    	var lookuptemp="";
		if(data.lookup && data.org!="public" && !data.onlyCurrentOrgRecords){
			orgsToCheck.push("public");
		}
		var publicSummaryTemp="";
		if(data.org=="public"){
			statusToCheck.push("published");
		}
		if(filters && Array.isArray(filters.org) && filters.org.length>0){
			for(var ti=0;ti<filters.org.length;ti++){
				if(orgsToCheck.indexOf(filters.org[ti])==-1)
				orgsToCheck.push(filters.org[ti]);
			}
			delete filters.org;
		}
		var arrayMatchJson={
				"bool": {
					"should": []
				}
		};
		for(var ai=0;ai<statusToCheck.length;ai++){
			var matchJson = {"match":{}};
			matchJson["match"][keywordPrefix+"$status"]=statusToCheck[ai];
			arrayMatchJson.bool.should.push(matchJson);
		}
		for(var ai=0;ai<orgsToCheck.length;ai++){
			var matchJson = {"match":{}};
			matchJson["match"][keywordPrefix+"org"]=orgsToCheck[ai];
			arrayMatchJson.bool.should.push(matchJson);
		}
		mustMatchArray.push(arrayMatchJson);
	}else if(data.schema=="UserRole" && (!data.filters || (data.filters && !data.filters.org))){
		var matchJson = {"match":{}};
		matchJson["match"][keywordPrefix+"org"]=data.org;
		mustMatchArray.push(matchJson);
	}
		
	for(var key in filters){
		var tempKey=key;
		if(derivedKeys.indexOf(key)>-1){
			tempKey="dependentProperties."+key+"";
		}
		if(schema["@properties"] && 
				schema["@properties"][key] && 
				schema["@properties"][key].dataType &&  
				schema["@properties"][key].dataType.type=="boolean"){
			var bval=false;
			if(Array.isArray(filters[key]) && filters[key].length>0){
				bval=filters[key][0];
			}else{
				bval=filters[key];
			}
			var matchJson = {"match":{}};
			matchJson["match"][keywordPrefix+tempKey]=true;
			if(bval){
				mustMatchArray.push(matchJson);
			}else{
				//mustNotMatchArray.push(matchJson);
			}
			
		}else if(schema["@properties"] && 
				schema["@properties"][key] && 
				schema["@properties"][key].dataType &&  
				(schema["@properties"][key].dataType.type=="number" ||
				(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="number"))){
			if(Array.isArray(filters[key])){
				if(filters[key].length==1){//minimum value provided
					filters[key].push(filters[key][0]);
				}
				rangeFilter.range[keywordPrefix+tempKey]={}
				rangeFilter.range[keywordPrefix+tempKey]["gte"]=filters[key][1];
				rangeFilter.range[keywordPrefix+tempKey]["lte"]=filters[key][0];
			}else{
				var matchJson = {"match":{}};
				matchJson["match"][keywordPrefix+tempKey]=filters[key];
				mustMatchArray.push(matchJson);
			}
		}else if(schema["@properties"] && 
				schema["@properties"][key] && 
				schema["@properties"][key].dataType &&  
				(schema["@properties"][key].dataType.type=="color" || 
				(schema["@properties"][key].dataType.type=="array"  && schema["@properties"][key].dataType.elements.type=="color"))){
		
			var colorFltr="";
			if(Array.isArray(filters[key]) && filters[key].length>0){
				if(filters[key][0].split(" ").length==1){
					colorFltr=filters[key][0].split(" ")[0];
				}else if(filters[key][0].split(" ").length==2){
					colorFltr=filters[key][0].split(" ")[1];
				}else if(filters[key][0].split(" ").length>2){
					colorFltr=filters[key][0].split(" ")[2];
				}
			}else{
				colorFltr=filters[key];
			}
			/*var wildcardJson={"wildcard":{}}
			wildcardJson["wildcard"][tempKey]="*"+colorFltr.toLowerCase()+"*";
			mustMatchArray.push(wildcardJson);*/
			mustMatchArray.push(getCaseInsensitiveESSearchMatchJSON(keywordPrefix+tempKey,colorFltr));
		}else if(schema["@properties"] && 
				schema["@properties"][key] && 
				schema["@properties"][key].dataType &&  
				(schema["@properties"][key].dataType.type=="multiPickList" || 
				schema["@properties"][key].dataType.type=="array")){
			if(Array.isArray(filters[key]) && filters[key].length==1){
				filters[key]=filters[key][0];
			}
			if(Array.isArray(filters[key])){
				var arrayMatchJson={
						"bool": {
							"should": []
						}
				};
				for(var ai=0;ai<filters[key].length;ai++){
					var matchJson = {"match":{}};
					matchJson["match"][keywordPrefix+tempKey]=filters[key][ai];
					arrayMatchJson.bool.should.push(matchJson);
				}
				mustMatchArray.push(arrayMatchJson);
			}else{
				var matchJson = {"match":{}};
				matchJson["match"][keywordPrefix+tempKey]=filters[key];
				mustMatchArray.push(matchJson);
			}
			
		}else{
			if(Array.isArray(filters[key]) && filters[key].length==1){
				filters[key]=filters[key][0];
			}
			if(Array.isArray(filters[key])){
				var arrayMatchJson={
						"bool": {
							"should": []
						}
				};
				for(var ai=0;ai<filters[key].length;ai++){
					var matchJson = {"match":{}};
					matchJson["match"][keywordPrefix+tempKey]=filters[key][ai];
					arrayMatchJson.bool.should.push(matchJson);
				}
				mustMatchArray.push(arrayMatchJson);
			}else{
				var matchJson = {"match":{}};
				matchJson["match"][keywordPrefix+tempKey]=filters[key];
				mustMatchArray.push(matchJson);
				
			}
		}
	}
	if(data.searchKey && data.searchKey!=""){
		var flag=false;
		if(schema["@identifier"] && schema["@identifier"] != "recordId"){
			/*var wildcardJson={"wildcard":{}}
			wildcardJson["wildcard"][schema["@identifier"]]="*"+data.searchKey.toLowerCase()+"*";
			mustMatchArray.push(wildcardJson);*/
			mustMatchArray.push(getCaseInsensitiveESSearchMatchJSON(keywordPrefix+schema["@identifier"],data.searchKey));
		}
		if(Array.isArray(schema["searchProperties"])){
			var arrayMatchJson={
					"bool": {
						"should": []
					}
			};
			for(var i=0;i<schema["searchProperties"].length;i++){
				if(schema["searchProperties"][i]!=schema["@identifier"]){
					/*var wildcardJson={"wildcard":{}}
					wildcardJson["wildcard"][schema["@identifier"]]="*"+data.searchKey.toLowerCase()+"*";
					arrayMatchJson.bool.should.push(wildcardJson);*/
					arrayMatchJson.bool.should.push(getCaseInsensitiveESSearchMatchJSON(keywordPrefix+schema["@searchProperties"][i],data.searchKey));
				}
			}
			mustMatchArray.push(arrayMatchJson);
		}
	}

		
		
	if(!data.forCounts){
		if(data.sortBy){
			var sortKey=data.sortBy;
			if(schema["@sortBindings"] && schema["@sortBindings"][sortKey]){
				sortKey=schema["@sortBindings"][sortKey];
			}
			sort[sortKey]={"order":(data.sortOrder=="ascend"?"asc":"desc")}
		}else if(schema["@identifier"] && schema["@identifier"] != "recordId"){
			var sortKey=schema["@identifier"];
			if(schema["@sortBindings"] && schema["@sortBindings"][sortKey]){
				sortKey=schema["@sortBindings"][sortKey];
			}
			sort[sortKey]={"order":(data.sortOrder=="ascend"?"asc":"desc")}
		}
	}
	var queryJSON={
		body:{
			query: {
				bool: {
					must: mustMatchArray,
					must_not:mustNotMatchArray
				}
			},
			sort:sort
		},
		from:(typeof data.skip !="undefined" && data.skip!=null)?data.skip:0,
		size:(data.limit?(data.limit+1):limitCount),
		_source:'doc.docType',
		index: config.esSummaryIndex
	};
	if(Object.keys(rangeFilter.range).length>0){
		queryJSON.body.filter=rangeFilter;
	}
	if(Object.keys(sort).length>0){
		queryJSON.body.sort=sort;
	}
	
	queryJSON._source="";
	for(var i=0;i<keys.length;i++){
		queryJSON._source+="doc."+keys[i]+",";
	}
	queryJSON._source.replace(/\,$/,"");
	if(logQueries){
		console.log("=======ES SUMMARY QUERY========");
		console.log(JSON.stringify(queryJSON));
		console.log("===============================");
	}
	ElasticSearch.getSummaryResults({query:queryJSON},function(result){
		if(data.forCounts){
			callback({total:result.hits.total});
			return;
		}else{
			var records=[];
			try{
			result.hits.hits.map(function(record){
				records.push({
					id:record["_id"],
					key:[],
					value:record["_source"]["doc"]
				});
			});
			}catch(err){}
			callback({schema:schema,records:records});
		}
	});
}

/**
 * 
 * @param data
 * @param callback
 *            userId org schema(id) skip filters
 */
function getSchemaRecords(data,callback){
	if(!data.userId){
		data.userId="CommonUser";
	}
	utility.getMainSchema(data,function(schema){
		if(schema.error){callback(schema);return;}
		if(schema.cloudPointHostId==undefined ||
				data.cloudPointHostId==undefined ||
				(schema.cloudPointHostId!="master" && 
				schema.cloudPointHostId!=data.cloudPointHostId)){
			callback({error:"Invalid host details found"});
			return;
		}
		data.schemaRecord=schema;
		/*if(schema.summaryDatabase=="ES" || schema.summaryDatabase=="ElasticSearch"){
			getSchemaRecordsES(data,callback);return;
			return;
		}*/
		getSchemaRecordsN1ql(data,callback);return;
		
		
		
		
		
		if(!data.viewName){
			data.viewName="summary";
		}
		var keysLength=0;
		var viewIndex=0;
		var allKeys=[];
		
		for(var i=0;i<schema["@views"].length;i++){
			if(schema["@views"][i].viewName==data.viewName){
				keysLength=schema["@views"][i].key.length;
				allKeys=schema["@views"][i].key;
				viewIndex=i;
				break;
			}
		}

		if(!data.filters){
			data.filters={}
		}
		//var allFilters=JSON.parse(JSON.stringify(schema["@views"][viewIndex].key));
		//allFilters.splice(0,1);
		var allFilters=[];
		for(var i=1;i<schema["@views"][viewIndex].key.length;i++){
			allFilters.push(schema["@views"][viewIndex].key[i])
		}
		data.allFilters=allFilters;

		var firstKey=schema["@views"][viewIndex].key[0];
		var viewFirstKey=data[firstKey];
		if(schema["@security"]  && schema["@security"]["recordLevel"]){
			if(schema["@security"]["recordLevel"].view=="all" ||
					schema["@security"]["recordLevel"].view=="public"){
				if(!(typeof data.filters!="undefined" &&	
						(typeof data.filters["author"] != "undefined" || typeof data.filters[firstKey] != "undefined"))){
					viewFirstKey="public";
				}
			}
			if(data.schemaRoleOnOrg && data.schemaRoleOnOrg.cloudPointAdmin){
				viewFirstKey="admin";
			}
		}
		data.viewFirstKey=viewFirstKey;
		
		
		
		
		
		
		
		
		
		if(typeof data.filters !="undefined" && allFilters.length>0){
			for(var i=0;i<allFilters.length;i++){
				if(typeof data.filters[allFilters[i]] =="undefined"){
					data.filters[allFilters[i]]=[];
				}
			}
		}
		for(var i=0;i<allKeys.length;i++){
			/*if(schema["@properties"][allKeys[i]] &&
					schema["@properties"][allKeys[i]].dataType &&
					schema["@properties"][allKeys[i]].dataType.type &&
					schema["@properties"][allKeys[i]].dataType.type=="multiPickList" &&
					(typeof data.filters=="undefined" || typeof data.filters[allKeys[i]]=="undefined" || data.filters[allKeys[i]].length==0)){
					data.filters[allKeys[i]]=["NA"];
			}*/
			if(schema["@properties"][allKeys[i]] &&
					schema["@properties"][allKeys[i]].dataType &&
					schema["@properties"][allKeys[i]].dataType.type &&
					schema["@properties"][allKeys[i]].dataType.type=="array" &&
					(typeof data.filters=="undefined" || typeof data.filters[allKeys[i]]=="undefined" || data.filters[allKeys[i]].length==0)){
					data.filters[allKeys[i]]=["NA"];
			}
		}
		if(schema["@superType"] && schema["@superType"]!="Organization"){
			if(data.filters && data.filters["$status"] && data.filters["$status"].indexOf("claimed")>-1){
				data.filters["$status"]=data.filters["$status"].filter(function(n){
					return n!=null && n!="" && n!=undefined && n!="claimed";
				})
			}
		}
		
		
		console.log(data.schema+"  "+keysLength);
		

		if(data.identifierCheck){
			data.searchEndKey=data.searchKey;
		}else{
			if(data.searchKey && data.searchKey.trim()!=""){
				data.searchEndKey=data.searchKey+"z"
			}else{
				data.searchKey=null;
				data.searchEndKey="z";
			}
		}
		
		
		
		
		if(keysLength==8){
			getSchemaRecordsBySevenFilters(data,callback);
		}else if(keysLength==7){
			getSchemaRecordsBySixFilters(data,callback);
		}else if(keysLength==6){
			getSchemaRecordsByFiveFilters(data,callback);
		}else if(keysLength==5){
			getSchemaRecordsByFourFilters(data,callback);
		}else if(keysLength==4){
			getSchemaRecordsByThreeFilters(data,callback);
		}else if(keysLength==3){
			getSchemaRecordsByTwoFilters(data,callback);
		}else if(keysLength==2){
			getSchemaRecordsByOneFilters(data,callback);
		}else if(keysLength==1){
			var query = ViewQuery.from(data.schema, data.viewName).key([data.viewFirstKey]);
			if(data.searchKey){
				query = ViewQuery.from(data.schema,data.viewName).range([data.searchKey],[data.searchEndKey]);
			}
			readyToSendResults(query,[],data,callback);		
		}
	});
}
exports.getSchemaRecords=getSchemaRecords;






/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsBySevenFilters(data,callback) {
	var queries=[];
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,null,null,null,null,data.searchKey],
														 [data.viewFirstKey,"z","z","z","z","z","z",data.searchEndKey]);
	
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0 && 
				data.filters[allFilters[5]].length==0 && 
				data.filters[allFilters[6]].length==0 && !data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,null,null,null,null,data.searchKey],
															 [data.viewFirstKey,"z","z","z","z","z","z",data.searchEndKey]);
			
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0 && 
				data.filters[allFilters[5]].length==0 && 
				data.filters[allFilters[6]].length==0 ){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
				                                                       data.filters[allFilters[0]][i],
				                                                       null,null,null,null,null,data.searchKey],
																		[data.viewFirstKey,
																		 data.filters[allFilters[0]][i],
																		 "z","z","z","z","z",data.searchEndKey]));
			}	
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				 data.filters[allFilters[1]].length!=0 && 
				 data.filters[allFilters[2]].length==0 && 
				 data.filters[allFilters[3]].length==0 && 
				 data.filters[allFilters[4]].length==0 && 
				 data.filters[allFilters[5]].length==0 && 
				 data.filters[allFilters[6]].length==0 ){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       data.filters[allFilters[1]][j],
						                                                       null,
						                                                       null,
						                                                       null,
						                                                       null,
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        data.filters[allFilters[1]][j],
						                                                        "z",
						                                                        "z",
						                                                        "z",
						                                                        "z",
						                                                        data.searchEndKey]));
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0 && 
				data.filters[allFilters[5]].length==0 && 
				data.filters[allFilters[6]].length==0 ){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       data.filters[allFilters[1]][j],
							                                                       data.filters[allFilters[2]][k],
							                                                       null,
							                                                       null,
							                                                       null,
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        data.filters[allFilters[1]][j],
							                                                        data.filters[allFilters[2]][k],
							                                                        "z",
							                                                        "z",
							                                                        "z",
							                                                        data.searchEndKey]));
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0 && 
				data.filters[allFilters[4]].length==0 && 
				data.filters[allFilters[5]].length==0 && 
				data.filters[allFilters[6]].length==0 ){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       data.filters[allFilters[2]][k],
								                                                       data.filters[allFilters[3]][l],
								                                                       null,
								                                                       null,
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        data.filters[allFilters[2]][k],
								                                                        data.filters[allFilters[3]][l],
								                                                        "z",
								                                                        "z",
								                                                        data.searchEndKey]));
						}
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0 && 
				data.filters[allFilters[4]].length!=0 && 
				data.filters[allFilters[5]].length==0 && 
				data.filters[allFilters[6]].length==0 ){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							for(var m=0;m<data.filters[allFilters[4]].length;m++){
							
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       data.filters[allFilters[2]][k],
								                                                       data.filters[allFilters[3]][l],
								                                                       data.filters[allFilters[4]][m],
								                                                       null,
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        data.filters[allFilters[2]][k],
								                                                        data.filters[allFilters[3]][l],
								                                                        data.filters[allFilters[4]][m],
								                                                        "z",
								                                                        data.searchEndKey]));
							}
						}
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0 && 
				data.filters[allFilters[4]].length!=0 && 
				data.filters[allFilters[5]].length!=0 && 
				data.filters[allFilters[6]].length==0 ){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							for(var m=0;m<data.filters[allFilters[4]].length;m++){
								for(var n=0;n<data.filters[allFilters[5]].length;n++){
									
										queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
										                                                       data.filters[allFilters[0]][i],
										                                                       data.filters[allFilters[1]][j],
										                                                       data.filters[allFilters[2]][k],
										                                                       data.filters[allFilters[3]][l],
										                                                       data.filters[allFilters[4]][m],
										                                                       data.filters[allFilters[5]][n],
										                                                       data.searchKey],
										                                                       [data.viewFirstKey,
										                                                        data.filters[allFilters[0]][i],
										                                                        data.filters[allFilters[1]][j],
										                                                        data.filters[allFilters[2]][k],
										                                                        data.filters[allFilters[3]][l],
										                                                        data.filters[allFilters[4]][m],
										                                                        data.filters[allFilters[5]][n],
										                                                        data.searchEndKey]));
								}
							}
						}
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0 && 
				data.filters[allFilters[4]].length!=0 && 
				data.filters[allFilters[5]].length!=0 && 
				data.filters[allFilters[6]].length!=0 ){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							for(var m=0;m<data.filters[allFilters[4]].length;m++){
								for(var n=0;n<data.filters[allFilters[5]].length;n++){
									for(var o=0;o<data.filters[allFilters[6]].length;o++){
										keys.push([data.viewFirstKey,
										           data.filters[allFilters[0]][i],
										           data.filters[allFilters[1]][j],
										           data.filters[allFilters[2]][k],
										           data.filters[allFilters[3]][l],
										           data.filters[allFilters[4]][m],
										           data.filters[allFilters[5]][n],
										           data.filters[allFilters[6]][o]]);
									}
								}
							}
						}
					}
				}
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,queries,data,callback)
		}else{
			
			function getActualKeys(){
				var keys=[];
				for(var i=0;i<data.filters[allFilters[0]].length;i++){
					for(var j=0;j<data.filters[allFilters[1]].length;j++){
						for(var k=0;k<data.filters[allFilters[2]].length;k++){
							for(var l=0;l<data.filters[allFilters[3]].length;l++){
								for(var m=0;m<data.filters[allFilters[4]].length;m++){
									for(var n=0;n<data.filters[allFilters[5]].length;n++){
										for(var o=0;o<data.filters[allFilters[6]].length;o++){
								keys.push(
										[
										 data.viewFirstKey,
										 data.filters[allFilters[0]][i],
										 data.filters[allFilters[1]][j],
										 data.filters[allFilters[2]][k],
										 data.filters[allFilters[3]][l],
										 data.filters[allFilters[4]][m],
										 data.filters[allFilters[5]][n],
										 data.filters[allFilters[6]][o]
										]);
								}
									}
								}
							}
						}
					}
				}
				if(typeof data.skip!="undefined"){
					query = ViewQuery.from(designDoc,viewName).keys(keys).limit(limitCount).skip(data.skip);
				}else{
					query = ViewQuery.from(designDoc,viewName).keys(keys);
				}
				if(data.filters[allFilters[6]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								for(var l=0;l<data.filters[allFilters[3]].length;l++){
									for(var m=0;m<data.filters[allFilters[4]].length;m++){
										for(var n=0;n<data.filters[allFilters[5]].length;n++){
											
												queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
												                                                       data.filters[allFilters[0]][i],
												                                                       data.filters[allFilters[1]][j],
												                                                       data.filters[allFilters[2]][k],
												                                                       data.filters[allFilters[3]][l],
												                                                       data.filters[allFilters[4]][m],
												                                                       data.filters[allFilters[5]][n],
												                                                       
												                                                       data.searchKey],
												                                                       [data.viewFirstKey,
												                                                        data.filters[allFilters[0]][i],
												                                                        data.filters[allFilters[1]][j],
												                                                        data.filters[allFilters[2]][k],
												                                                        data.filters[allFilters[3]][l],
												                                                        data.filters[allFilters[4]][m],
												                                                        data.filters[allFilters[5]][n],
												                                                        
												                                                        data.searchEndKey]));
										}
									}
								}
							}
						}
					}
				}
				if(data.filters[allFilters[5]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								for(var l=0;l<data.filters[allFilters[3]].length;l++){
									for(var m=0;m<data.filters[allFilters[4]].length;m++){
									
										queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
										                                                       data.filters[allFilters[0]][i],
										                                                       data.filters[allFilters[1]][j],
										                                                       data.filters[allFilters[2]][k],
										                                                       data.filters[allFilters[3]][l],
										                                                       data.filters[allFilters[4]][m],
										                                                       null,
										                                                       data.searchKey],
										                                                       [data.viewFirstKey,
										                                                        data.filters[allFilters[0]][i],
										                                                        data.filters[allFilters[1]][j],
										                                                        data.filters[allFilters[2]][k],
										                                                        data.filters[allFilters[3]][l],
										                                                        data.filters[allFilters[4]][m],
										                                                        "z",
										                                                        data.searchEndKey]));
								}
								}
							}
						}
					}
				}
				if(data.filters[allFilters[4]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								for(var l=0;l<data.filters[allFilters[3]].length;l++){
									
										queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
										                                                       data.filters[allFilters[0]][i],
										                                                       data.filters[allFilters[1]][j],
										                                                       data.filters[allFilters[2]][k],
										                                                       data.filters[allFilters[3]][l],
										                                                       null,
										                                                       null,
										                                                       data.searchKey],
										                                                       [data.viewFirstKey,
										                                                        data.filters[allFilters[0]][i],
										                                                        data.filters[allFilters[1]][j],
										                                                        data.filters[allFilters[2]][k],
										                                                        data.filters[allFilters[3]][l],
										                                                        "z",
										                                                        "z",
										                                                        data.searchEndKey]));
								}
							}
						}
					}
				}
				if(data.filters[allFilters[3]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								
									queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
									                                                       data.filters[allFilters[0]][i],
									                                                       data.filters[allFilters[1]][j],
									                                                       data.filters[allFilters[2]][k],
									                                                       null,
									                                                       null,
									                                                       null,
									                                                       data.searchKey],
									                                                       [data.viewFirstKey,
									                                                        data.filters[allFilters[0]][i],
									                                                        data.filters[allFilters[1]][j],
									                                                        data.filters[allFilters[2]][k],
									                                                        "z",
									                                                        "z",
									                                                        "z",
									                                                        data.searchEndKey]));
							}
						}
					}
				}
				if(data.filters[allFilters[2]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       null,
								                                                       null,
								                                                       null,
								                                                       null,
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        "z",
								                                                        "z",
								                                                        "z",
								                                                        "z",
								                                                        data.searchEndKey]));
						}
					}
				}

				if(data.filters[allFilters[1]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,data.filters[allFilters[0]][i],null,null,null,null,null,data.searchKey],
																				  [data.viewFirstKey,data.filters[allFilters[0]][i],"z","z","z","z","z",data.searchEndKey]));
					}
				}
				if(data.filters[allFilters[0]].length==0){
					
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,null,null,null,null,data.searchKey],
																			  [data.viewFirstKey,"z","z","z","z","z","z",data.searchEndKey]));
				}
				readyToSendResults(query,queries,data,callback)
			}
			getQueryFilters(data,schema,allFilters,getActualKeys);
		}	
	}else{
		readyToSendResults(query,queries,data,callback)
	}
	
}
exports.getSchemaRecordsBySevenFilters=getSchemaRecordsBySevenFilters;








/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsBySixFilters(data,callback) {
	var queries=[];
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	
	
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,null,null,null,data.searchKey],
														 [data.viewFirstKey,"z","z","z","z","z",data.searchEndKey]);
	
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0 && 
				data.filters[allFilters[5]].length==0 && !data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,null,null,null,data.searchKey],
															[data.viewFirstKey,"z","z","z","z","z",data.searchEndKey]);
			
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
					data.filters[allFilters[1]].length==0 && 
					data.filters[allFilters[2]].length==0 && 
					data.filters[allFilters[3]].length==0 && 
					data.filters[allFilters[4]].length==0 && 
					data.filters[allFilters[5]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,data.filters[allFilters[0]][i],null,null,null,null,data.searchKey],
																		  [data.viewFirstKey,data.filters[allFilters[0]][i],"z","z","z","z",data.searchEndKey]));
			}	
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
					data.filters[allFilters[1]].length!=0 && 
					data.filters[allFilters[2]].length==0 && 
					data.filters[allFilters[3]].length==0 && 
					data.filters[allFilters[4]].length==0 && 
					data.filters[allFilters[5]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       data.filters[allFilters[1]][j],
						                                                       null,
						                                                       null,
						                                                       null,
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        data.filters[allFilters[1]][j],
						                                                        "z",
						                                                        "z",
						                                                        "z",
						                                                        data.searchEndKey]));
					
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
					data.filters[allFilters[1]].length!=0 && 
					data.filters[allFilters[2]].length!=0 && 
					data.filters[allFilters[3]].length==0 && 
					data.filters[allFilters[4]].length==0 && 
					data.filters[allFilters[5]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
					
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       data.filters[allFilters[1]][j],
							                                                       data.filters[allFilters[2]][k],
							                                                       null,
							                                                       null,
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        data.filters[allFilters[1]][j],
							                                                        data.filters[allFilters[2]][k],
							                                                        "z",
							                                                        "z",
							                                                        data.searchEndKey]));
						
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
					data.filters[allFilters[1]].length!=0 && 
					data.filters[allFilters[2]].length!=0 && 
					data.filters[allFilters[3]].length!=0 && 
					data.filters[allFilters[4]].length==0 && 
					data.filters[allFilters[5]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       data.filters[allFilters[2]][k],
								                                                       data.filters[allFilters[3]][l],
								                                                       null,
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        data.filters[allFilters[2]][k],
								                                                        data.filters[allFilters[3]][l],
								                                                        "z",
								                                                        data.searchEndKey]));
							
						}
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
					data.filters[allFilters[1]].length!=0 && 
					data.filters[allFilters[2]].length!=0 && 
					data.filters[allFilters[3]].length!=0 && 
					data.filters[allFilters[4]].length!=0 && 
					data.filters[allFilters[5]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							for(var m=0;m<data.filters[allFilters[4]].length;m++){
							
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       data.filters[allFilters[2]][k],
								                                                       data.filters[allFilters[3]][l],
								                                                       data.filters[allFilters[4]][m],
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        data.filters[allFilters[2]][k],
								                                                        data.filters[allFilters[3]][l],
								                                                        data.filters[allFilters[4]][m],
								                                                        data.searchEndKey]));
							}
						}
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
					data.filters[allFilters[1]].length!=0 && 
					data.filters[allFilters[2]].length!=0 && 
					data.filters[allFilters[3]].length!=0 && 
					data.filters[allFilters[4]].length!=0 && 
					data.filters[allFilters[5]].length!=0){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							for(var m=0;m<data.filters[allFilters[4]].length;m++){
								for(var n=0;n<data.filters[allFilters[5]].length;n++){
									keys.push([data.viewFirstKey,
									           data.filters[allFilters[0]][i],
									           data.filters[allFilters[1]][j],
									           data.filters[allFilters[2]][k],
									           data.filters[allFilters[3]][l],
									           data.filters[allFilters[4]][m],
									           data.filters[allFilters[5]][n]]);
								}
							}
						}
					}
				}
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,queries,data,callback)
		}else{
			function getActualKeys(){
				var keys=[];
				for(var i=0;i<data.filters[allFilters[0]].length;i++){
					for(var j=0;j<data.filters[allFilters[1]].length;j++){
						for(var k=0;k<data.filters[allFilters[2]].length;k++){
							for(var l=0;l<data.filters[allFilters[3]].length;l++){
								for(var m=0;m<data.filters[allFilters[4]].length;m++){
									for(var n=0;n<data.filters[allFilters[5]].length;n++){
								keys.push(
										[
										 data.viewFirstKey,
										 data.filters[allFilters[0]][i],
										 data.filters[allFilters[1]][j],
										 data.filters[allFilters[2]][k],
										 data.filters[allFilters[3]][l],
										 data.filters[allFilters[4]][m],
										 data.filters[allFilters[5]][n]
										]);
								}
								}
							}
						}
					}
				}
				if(typeof data.skip!="undefined"){
					query = ViewQuery.from(designDoc,viewName).keys(keys).limit(limitCount).skip(data.skip);
				}else{
					query = ViewQuery.from(designDoc,viewName).keys(keys);
				}
				if(data.filters[allFilters[5]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								for(var l=0;l<data.filters[allFilters[3]].length;l++){
									for(var m=0;m<data.filters[allFilters[4]].length;m++){
									
										queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
										                                                       data.filters[allFilters[0]][i],
										                                                       data.filters[allFilters[1]][j],
										                                                       data.filters[allFilters[2]][k],
										                                                       data.filters[allFilters[3]][l],
										                                                       data.filters[allFilters[4]][m],
										                                                       data.searchKey],
										                                                       [data.viewFirstKey,
										                                                        data.filters[allFilters[0]][i],
										                                                        data.filters[allFilters[1]][j],
										                                                        data.filters[allFilters[2]][k],
										                                                        data.filters[allFilters[3]][l],
										                                                        data.filters[allFilters[4]][m],
										                                                        data.searchEndKey]));
								}
								}
							}
						}
					}
				}
				if(data.filters[allFilters[4]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								for(var l=0;l<data.filters[allFilters[3]].length;l++){
									
										queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
										                                                       data.filters[allFilters[0]][i],
										                                                       data.filters[allFilters[1]][j],
										                                                       data.filters[allFilters[2]][k],
										                                                       data.filters[allFilters[3]][l],
										                                                       null,
										                                                       data.searchKey],
										                                                       [data.viewFirstKey,
										                                                        data.filters[allFilters[0]][i],
										                                                        data.filters[allFilters[1]][j],
										                                                        data.filters[allFilters[2]][k],
										                                                        data.filters[allFilters[3]][l],
										                                                        "z",
										                                                        data.searchEndKey]));
									
								}
							}
						}
					}
				}
				if(data.filters[allFilters[3]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								
									queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
									                                                       data.filters[allFilters[0]][i],
									                                                       data.filters[allFilters[1]][j],
									                                                       data.filters[allFilters[2]][k],
									                                                       null,
									                                                       null,
									                                                       data.searchKey],
									                                                       [data.viewFirstKey,
									                                                        data.filters[allFilters[0]][i],
									                                                        data.filters[allFilters[1]][j],
									                                                        data.filters[allFilters[2]][k],
									                                                        "z",
									                                                        "z",
									                                                        data.searchEndKey]));
								
							}
						}
					}
				}
				if(data.filters[allFilters[2]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       null,
								                                                       null,
								                                                       null,
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        "z",
								                                                        "z",
								                                                        "z",
								                                                        data.searchEndKey]));
							
						}
					}
				}

				if(data.filters[allFilters[1]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       null,
							                                                       null,
							                                                       null,
							                                                       null,
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        "z",
							                                                        "z",
							                                                        "z",
							                                                        "z",
							                                                        data.searchEndKey]));
						
					}
				}
				if(data.filters[allFilters[0]].length==0){
					
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,null,null,null,data.searchKey],
																			  [data.viewFirstKey,"z","z","z","z","z",data.searchEndKey]));
					
				}
				readyToSendResults(query,queries,data,callback)
			}
			getQueryFilters(data,schema,allFilters,getActualKeys);
		}	
	}else{
		readyToSendResults(query,queries,data,callback)
	}
}
exports.getSchemaRecordsBySixFilters=getSchemaRecordsBySixFilters;









/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsByFiveFilters(data,callback) {
	var queries=[];
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	
	
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
	                                                      null,
	                                                      null,
	                                                      null,
	                                                      null,
	                                                      data.searchKey],
														[data.viewFirstKey,
														 "z",
														 "z",
														 "z",
														 "z",
														 data.searchEndKey]);
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0 && 
				!data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
			                                                  null,
			                                                  null,
			                                                  null,
			                                                  null,
			                                                  data.searchKey],
			                                                  [data.viewFirstKey,
			                                                   "z",
			                                                   "z",
			                                                   "z",
			                                                   "z",
			                                                   data.searchEndKey]);
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
				                                                       data.filters[allFilters[0]][i],
				                                                       null,
				                                                       null,
				                                                       null,
				                                                       data.searchKey],
				                                                       [data.viewFirstKey,
				                                                        data.filters[allFilters[0]][i],
				                                                        "z",
				                                                        "z",
				                                                        "z",
				                                                        data.searchEndKey]));
			}	
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       data.filters[allFilters[0]][i],
					                                                       data.filters[allFilters[1]][j],
					                                                       null,
					                                                       null,
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        data.filters[allFilters[0]][i],
					                                                        data.filters[allFilters[1]][j],
					                                                        "z",
					                                                        "z",
					                                                        data.searchEndKey]));
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length==0 && 
				data.filters[allFilters[4]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       data.filters[allFilters[1]][j],
						                                                       data.filters[allFilters[2]][k],
						                                                       null,
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        data.filters[allFilters[1]][j],
						                                                        data.filters[allFilters[2]][k],
						                                                        "z",
						                                                        data.searchEndKey]));
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0 && 
				data.filters[allFilters[4]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       data.filters[allFilters[1]][j],
							                                                       data.filters[allFilters[2]][k],
							                                                       data.filters[allFilters[3]][l],
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        data.filters[allFilters[1]][j],
							                                                        data.filters[allFilters[2]][k],
							                                                        data.filters[allFilters[3]][l],
							                                                        data.searchEndKey]));
						}
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0 && 
				data.filters[allFilters[4]].length!=0){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							for(var m=0;m<data.filters[allFilters[4]].length;m++){
								keys.push([data.viewFirstKey,
								           data.filters[allFilters[0]][i],
								           data.filters[allFilters[1]][j],
								           data.filters[allFilters[2]][k],
								           data.filters[allFilters[3]][l],
								           data.filters[allFilters[4]][m]]);
							}
						}
					}
				}
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,queries,data,callback)
		}else{
			function getActualKeys(){
				var keys=[];
				for(var i=0;i<data.filters[allFilters[0]].length;i++){
					for(var j=0;j<data.filters[allFilters[1]].length;j++){
						for(var k=0;k<data.filters[allFilters[2]].length;k++){
							for(var l=0;l<data.filters[allFilters[3]].length;l++){
								for(var m=0;m<data.filters[allFilters[4]].length;m++){
								keys.push(
										[
										 data.viewFirstKey,
										 data.filters[allFilters[0]][i],
										 data.filters[allFilters[1]][j],
										 data.filters[allFilters[2]][k],
										 data.filters[allFilters[3]][l],
										 data.filters[allFilters[4]][m]
										]);
								}
							}
						}
					}
				}
				if(typeof data.skip!="undefined"){
					query = ViewQuery.from(designDoc,viewName).keys(keys).limit(limitCount).skip(data.skip);
				}else{
					query = ViewQuery.from(designDoc,viewName).keys(keys);
				}
				if(data.filters[allFilters[4]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								for(var l=0;l<data.filters[allFilters[3]].length;l++){
									queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
									                                                       data.filters[allFilters[0]][i],
									                                                       data.filters[allFilters[1]][j],
									                                                       data.filters[allFilters[2]][k],
									                                                       data.filters[allFilters[3]][l],
									                                                       data.searchKey],
									                                                       [data.viewFirstKey,
									                                                        data.filters[allFilters[0]][i],
									                                                        data.filters[allFilters[1]][j],
									                                                        data.filters[allFilters[2]][k],
									                                                        data.filters[allFilters[3]][l],
									                                                        data.searchEndKey]));
								}
							}
						}
					}
				}
				if(data.filters[allFilters[3]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       data.filters[allFilters[2]][k],
								                                                       null,
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        data.filters[allFilters[2]][k],
								                                                        "z",
								                                                        data.searchEndKey]));
							}
						}
					}
				}
				if(data.filters[allFilters[2]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       data.filters[allFilters[1]][j],
							                                                       null,
							                                                       null,
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        data.filters[allFilters[1]][j],
							                                                        "z",
							                                                        "z",
							                                                        data.searchEndKey]));
						}
					}
				}

				if(data.filters[allFilters[1]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       null,
						                                                       null,
						                                                       null,
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        "z",
						                                                        "z",
						                                                        "z",
						                                                        data.searchEndKey]));
					}
				}
				if(data.filters[allFilters[0]].length==0){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       null,
					                                                       null,
					                                                       null,
					                                                       null,
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        "z",
					                                                        "z",
					                                                        "z",
					                                                        "z",
					                                                        data.searchEndKey]));
				}
				readyToSendResults(query,queries,data,callback)
			}
			getQueryFilters(data,schema,allFilters,getActualKeys);
		}	
	}else{
		readyToSendResults(query,queries,data,callback)
	}
}
exports.getSchemaRecordsByFiveFilters=getSchemaRecordsByFiveFilters;









/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsByFourFilters(data,callback) {
	var queries=[];
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	
	
	
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
	                                                      null,
	                                                      null,
	                                                      null,
	                                                      data.searchKey],
	                                                      [data.viewFirstKey,
	                                                       "z",
	                                                       "z",
	                                                       "z",
	                                                       data.searchEndKey]);
	
	//console.log(data.filters);
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0 && 
				!data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
			                                                  null,
			                                                  null,
			                                                  null,
			                                                  data.searchKey],
			                                                  [data.viewFirstKey,
			                                                   "z",
			                                                   "z",
			                                                   "z",
			                                                   data.searchEndKey]);
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
				                                                       data.filters[allFilters[0]][i],
				                                                       null,
				                                                       null,
				                                                       data.searchKey],
				                                                       [data.viewFirstKey,
				                                                        data.filters[allFilters[0]][i],
				                                                        "z",
				                                                        "z",
				                                                        data.searchEndKey]));
			}	
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length==0 && 
				data.filters[allFilters[3]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       data.filters[allFilters[0]][i],
					                                                       data.filters[allFilters[1]][j],
					                                                       null,
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        data.filters[allFilters[0]][i],
					                                                        data.filters[allFilters[1]][j],
					                                                        "z",
					                                                        data.searchEndKey]));
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       data.filters[allFilters[1]][j],
						                                                       data.filters[allFilters[2]][k],
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        data.filters[allFilters[1]][j],
						                                                        data.filters[allFilters[2]][k],
						                                                        data.searchEndKey]));
					}
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0 && 
				data.filters[allFilters[3]].length!=0){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						for(var l=0;l<data.filters[allFilters[3]].length;l++){
							keys.push([data.viewFirstKey,
							           data.filters[allFilters[0]][i],
							           data.filters[allFilters[1]][j],
							           data.filters[allFilters[2]][k],
							           data.filters[allFilters[3]][l]]);
						}
					}
				}
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,queries,data,callback)
		}else{
			function getActualKeys(){
				var keys=[];
				for(var i=0;i<data.filters[allFilters[0]].length;i++){
					for(var j=0;j<data.filters[allFilters[1]].length;j++){
						for(var k=0;k<data.filters[allFilters[2]].length;k++){
							for(var l=0;l<data.filters[allFilters[3]].length;l++){
								keys.push(
										[
										 data.viewFirstKey,
										 data.filters[allFilters[0]][i],
										 data.filters[allFilters[1]][j],
										 data.filters[allFilters[2]][k],
										 data.filters[allFilters[3]][l]
										]);
							}
						}
					}
				}
				query = ViewQuery.from(designDoc,viewName).keys(keys);
				if(data.filters[allFilters[3]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							for(var k=0;k<data.filters[allFilters[2]].length;k++){
								queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
								                                                       data.filters[allFilters[0]][i],
								                                                       data.filters[allFilters[1]][j],
								                                                       data.filters[allFilters[2]][k],
								                                                       data.searchKey],
								                                                       [data.viewFirstKey,
								                                                        data.filters[allFilters[0]][i],
								                                                        data.filters[allFilters[1]][j],
								                                                        data.filters[allFilters[2]][k],
								                                                        data.searchEndKey]));
							}
						}
					}
				}
				if(data.filters[allFilters[2]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       data.filters[allFilters[1]][j],
							                                                       null,
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        data.filters[allFilters[1]][j],
							                                                        "z",
							                                                        data.searchEndKey]));
						}
					}
				}

				if(data.filters[allFilters[1]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       null,
						                                                       null,
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        "z",
						                                                        "z",
						                                                        data.searchEndKey]));
					}
				}
				if(data.filters[allFilters[0]].length==0){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       null,
					                                                       null,
					                                                       null,
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        "z",
					                                                        "z",
					                                                        "z",
					                                                        data.searchEndKey]));
				}
				readyToSendResults(query,queries,data,callback)
			}
			getQueryFilters(data,schema,allFilters,getActualKeys);
		}	
	}else{
		readyToSendResults(query,queries,data,callback)
	}
}
exports.getSchemaRecordsByFourFilters=getSchemaRecordsByFourFilters;













/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsByThreeFilters(data,callback) {
	var queries=[];
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	
	
	
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,null,data.searchKey],[data.viewFirstKey,"z","z",data.searchEndKey]);
	//console.log(data.filters);
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0 && 
				!data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
			                                                  null,
			                                                  null,
			                                                  data.searchKey],
			                                                  [data.viewFirstKey,
			                                                   "z",
			                                                   "z",
			                                                   data.searchEndKey]);
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length==0 && 
				data.filters[allFilters[2]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
				                                                       data.filters[allFilters[0]][i],
				                                                       null,
				                                                       data.searchKey],
				                                                       [data.viewFirstKey,
				                                                        data.filters[allFilters[0]][i],
				                                                        "z",
				                                                        data.searchEndKey]));
			}	
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       data.filters[allFilters[0]][i],
					                                                       data.filters[allFilters[1]][j],
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        data.filters[allFilters[0]][i],
					                                                        data.filters[allFilters[1]][j],
					                                                        data.searchEndKey]));
				}
			}
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && 
				data.filters[allFilters[1]].length!=0 && 
				data.filters[allFilters[2]].length!=0){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					for(var k=0;k<data.filters[allFilters[2]].length;k++){
						keys.push([data.viewFirstKey,
						           data.filters[allFilters[0]][i],
						           data.filters[allFilters[1]][j],
						           data.filters[allFilters[2]][k]]);
					}
				}
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,queries,data,callback)
		}else{
			function getActualKeys(){
				var keys=[];
				for(var i=0;i<data.filters[allFilters[0]].length;i++){
					for(var j=0;j<data.filters[allFilters[1]].length;j++){
						for(var k=0;k<data.filters[allFilters[2]].length;k++){
							keys.push([data.viewFirstKey,
							           data.filters[allFilters[0]][i],
							           data.filters[allFilters[1]][j],
							           data.filters[allFilters[2]][k]]);
						}
					}
				}
				query = ViewQuery.from(designDoc,viewName).keys(keys);
				

				if(data.filters[allFilters[2]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						for(var j=0;j<data.filters[allFilters[1]].length;j++){
							queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
							                                                       data.filters[allFilters[0]][i],
							                                                       data.filters[allFilters[1]][j],
							                                                       data.searchKey],
							                                                       [data.viewFirstKey,
							                                                        data.filters[allFilters[0]][i],
							                                                        data.filters[allFilters[1]][j],
							                                                        data.searchEndKey]));
						}
					}
				}
				
				if(data.filters[allFilters[1]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       null,
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        "z",
						                                                        data.searchEndKey]));
					}
				}
				
				if(data.filters[allFilters[0]].length==0){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       null,
					                                                       null,
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        "z",
					                                                        "z",
					                                                        data.searchEndKey]));
				}
				
				readyToSendResults(query,queries,data,callback)
			}
			getQueryFilters(data,schema,allFilters,getActualKeys);
		}	
	}else{
		readyToSendResults(query,queries,data,callback)
	}
}
exports.getSchemaRecordsByThreeFilters=getSchemaRecordsByThreeFilters;
/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsByTwoFilters(data,callback) {
	var queries=[];
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,data.searchKey],[data.viewFirstKey,"z",data.searchEndKey]);
	
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && data.filters[allFilters[1]].length==0 && !data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,null,data.searchKey],[data.viewFirstKey,"z",data.searchEndKey]);
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && data.filters[allFilters[1]].length==0){
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
				                                                       data.filters[allFilters[0]][i],
				                                                       data.searchKey],
				                                                       [data.viewFirstKey,
				                                                        data.filters[allFilters[0]][i],
				                                                        data.searchEndKey]));
			}	
			readyToSendResults(query,queries,data,callback)
		}else if(data.filters[allFilters[0]].length!=0 && data.filters[allFilters[1]].length!=0){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				for(var j=0;j<data.filters[allFilters[1]].length;j++){
					keys.push([data.viewFirstKey,data.filters[allFilters[0]][i],data.filters[allFilters[1]][j]]);
				}
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,queries,data,callback)
		}else{
			function getActualKeys(){
				var keys=[];
				for(var i=0;i<data.filters[allFilters[0]].length;i++){
					for(var j=0;j<data.filters[allFilters[1]].length;j++){
						keys.push([data.viewFirstKey,data.filters[allFilters[0]][i],data.filters[allFilters[1]][j]]);
					}
				}
				query = ViewQuery.from(designDoc,viewName).keys(keys);
				
				if(data.filters[allFilters[1]].length==0){
					for(var i=0;i<data.filters[allFilters[0]].length;i++){
						queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
						                                                       data.filters[allFilters[0]][i],
						                                                       data.searchKey],
						                                                       [data.viewFirstKey,
						                                                        data.filters[allFilters[0]][i],
						                                                        data.searchEndKey]));
					}
				}
				
				if(data.filters[allFilters[0]].length==0){
					queries.push(ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,
					                                                       null,
					                                                       data.searchKey],
					                                                       [data.viewFirstKey,
					                                                        "z",
					                                                        data.searchEndKey]));
				}
				
				
				readyToSendResults(query,queries,data,callback)
			}
			getQueryFilters(data,schema,allFilters,getActualKeys);
		}	
	}else{
		readyToSendResults(query,queries,data,callback)
	}
}
exports.getSchemaRecordsByTwoFilters=getSchemaRecordsByTwoFilters;

function getQueryFilters(data,schema,allFilters,callback){
	gqf(0);
	function gqf(index){
		var dataType="";
		if(schema["@properties"][allFilters[index]] && 
				schema["@properties"][allFilters[index]].dataType && 
				schema["@properties"][allFilters[index]].dataType.type){
			dataType=schema["@properties"][allFilters[index]].dataType.type;
		}
		if(data.filters[allFilters[index]] && 
				Array.isArray(data.filters[allFilters[index]]) && 
				data.filters[allFilters[index]].length==0){
			if(dataType=="pickList" || dataType=="multiPickList"){
				data.filters[allFilters[index]]=schema["@properties"][allFilters[index]].dataType.options;
				data.filters[allFilters[index]].push("");
			}else{
				if(allFilters[index]=="$status" && schema["@state"]){
					data.filters[allFilters[index]]=Object.keys(schema["@state"]);
				}else{
					data.filters[allFilters[index]]=[];
				}
			}
			if(index<Object.keys(data.filters).length-1){
				gqf(index+1)
			}else{
				callback();
			}
		}else{
			if(index<Object.keys(data.filters).length-1){
				gqf(index+1)
			}else{
				callback();
			}
		}
	}
}


/**
 * 
 * @param data
 * @param callback
 *            userId org schema(doc) skip filters
 */
function getSchemaRecordsByOneFilters(data,callback) {
	var schema=data.schemaRecord;
	var designDoc=schema["@id"];
	var viewName=data.viewName;
	var allFilters=data.allFilters;
	
	
	
	var query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,data.searchKey],[data.viewFirstKey,data.searchEndKey]);
	//console.log(data.filters);
	if(data.filters){
		if(data.filters[allFilters[0]].length==0 && !data.searchKey){
			query = ViewQuery.from(designDoc,viewName).range([data.viewFirstKey,data.searchKey],[data.viewFirstKey,data.searchEndKey]);
			readyToSendResults(query,[],data,callback)
		}else if(data.filters[allFilters[0]].length!=0){
			var keys=[];
			for(var i=0;i<data.filters[allFilters[0]].length;i++){
				keys.push([data.viewFirstKey,data.filters[allFilters[0]][i]]);
			}
			query = ViewQuery.from(designDoc,viewName).keys(keys);
			readyToSendResults(query,[],data,callback)
		}else{
			readyToSendResults(query,[],data,callback)
		}	
	}else{
		readyToSendResults(query,[],data,callback)
	}
}
exports.getSchemaRecordsByOneFilters=getSchemaRecordsByOneFilters;


/*function readyToSendResults(query,queries,data,callback){
	// console.log(queries);
	// console.log(query);
	if(queries.length==0 || queries.length==1){
		if(queries.length==1){
			query=queries[0];
		}
		if(typeof data.skip!="undefined"){
			query.limit(limitCount).skip(data.skip);
		}
		query.stale((data.stale && data.stale=="false")?ViewQuery.Update.BEFORE:ViewQuery.Update.NONE);
		CouchBaseUtil.executeViewInContentBucket(query, function(results) {
			if(results.error){
				callback(results);
				return;
			}
			var rowData=new Array();
			for(var i in results){
				rowData.push(results[i]);
			}
			callback({records:rowData,schema:data.schemaRecord});
		});	
	}else{
		var rowData=new Array();
		getQueryResult(0)
		function getQueryResult(j){
			if(typeof data.skip!="undefined"){
				//queries[j].limit(limitCount).skip(data.skip);
			}
			queries[j].stale((data.stale && data.stale=="false")?ViewQuery.Update.BEFORE:ViewQuery.Update.NONE);
			if(data.stale && data.stale=="false"){
				queries[j].state(ViewQuery.Update.BEFORE);
			}
			CouchBaseUtil.executeViewInContentBucket(queries[j], function(results) {
				if(results.error){
					callback(results);
					return;
				}
				for(var i in results){
					rowData.push(results[i]);
				}
				if(j<queries.length-1){
					getQueryResult(j+1)
				}else{
					if(typeof data.skip!="undefined"){
						console.log(rowData.length);
						 rowData=rowData.slice(data.skip*1).splice(0,limitCount)
					}
					callback({records:rowData,schema:data.schemaRecord});
				}
			});	
		}
	}
	
}*/
function readyToSendResults(query,queries,data,callback){
	if(data.forCounts){
		getCounts(query,queries,data,callback);
		return;
	}
	if(queries.length==0 || queries.length==1){
		if(queries.length==1){
			query=queries[0];
		}
		//console.log(query);
		if(typeof data.skip!="undefined"){
			query.limit(limitCount).skip(data.skip);
		}
		query.stale((data.stale && data.stale=="false")?ViewQuery.Update.BEFORE:ViewQuery.Update.NONE);
		query.reduce(false);
		CouchBaseUtil.executeViewInContentBucket(query, function(results) {
			if(results.error){
				callback(results);
				return;
			}
			var rowData=new Array();
			for(var i in results){
				rowData.push(results[i]);
			}
			doneGetting({records:rowData,schema:data.schemaRecord});
		});	
	}else{
		var rowData=new Array();
		var skipped=0;
		if(typeof data.skip!="undefined"){
			skipped=data.skip*1;
		}
		if(queries.length>300){
			callback({"error":"No of queries exceeded limit(300)"});
		}else{
			getQueryResult(0)
		}
		function getQueryResult(j){
			if(typeof data.skip!="undefined"){
				queries[j].limit(skipped+limitCount);
			}
			queries[j].stale((data.stale && data.stale=="false")?ViewQuery.Update.BEFORE:ViewQuery.Update.NONE);
			queries[j].reduce(false);
			//console.log(queries[j]);
			CouchBaseUtil.executeViewInContentBucket(queries[j], function(results) {
				if(results.error){
					doneGetting({records:rowData,schema:data.schemaRecord});//callback(results);
					return;
				}else{
					//console.log(results.length);
					for(var i in results){
						rowData.push(results[i]);
					}
					if(typeof data.skip!="undefined"){
						if(skipped>0){
							if(rowData.length>0){
								var currSkip=0;
								if(rowData.length<=skipped){
									currSkip=rowData.length;
								}else{
									currSkip=skipped;
								}
								//console.log("Currently skipping : "+currSkip);
								rowData=rowData.slice(skipped).splice(0,limitCount);
								skipped=skipped-currSkip;
							}
						}
						//console.log("After Skiping  "+rowData.length);
					}
					if(j<queries.length-1){
						if(typeof data.skip=="undefined"){
							getQueryResult(j+1)
						}else if(rowData.length<limitCount){
							getQueryResult(j+1)
						}else{
							doneGetting({records:rowData,schema:data.schemaRecord});
						}
					}else{
						doneGetting({records:rowData,schema:data.schemaRecord});
					}
				}
			});	
		}
	}
	function doneGetting(data){
		callback(data);
	}
}



function getCounts(query,queries,data,callback){
	if(queries.length==0 || queries.length==1){
		if(queries.length==1){
			query=queries[0];
		}
		query.reduce(true).group(true);
		CouchBaseUtil.executeViewInContentBucket(query, function(result) {
			var total=0;
			if(!result.error && Array.isArray(result)){
				for(var i=0;i<result.length;i++){
					total+=result[i].value;
				}
			}
			callback({total:total});
		});	
	}else{
		var grandTotal=0;
		getQueryResult(0)
		function getQueryResult(j){
			queries[j].reduce(true).group(true);
			CouchBaseUtil.executeViewInContentBucket(queries[j], function(result) {
				var total=0;
				if(!result.error && Array.isArray(result)){
					for(var i=0;i<result.length;i++){
						total+=result[i].value;
					}
				}
				grandTotal+=total;
				if(j<queries.length-1){
					getQueryResult(j+1)
				}else{
					callback({total:grandTotal});	
				}
				
			});	
		}
	}
}

