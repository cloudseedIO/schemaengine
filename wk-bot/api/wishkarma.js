var https = require('https');
var defaultLimit=9;
var selectionLimit=9;
exports.defaultLimit=defaultLimit;
exports.selectionLimit=selectionLimit;
var endPoint='www.wishkarma.com';
var endPointPort='9500';
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
function getRemoteData(post_data,callback){
	
  var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/search?operation=searchBydocType',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}

function getRemoteDataFromGroupView(post_data,callback){
	var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/generic?operation=groupView',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}
function getCitiesFromGroupView(post_data,callback){
	var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/generic?operation=getCitiesFromGroupView',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}
function getSuppliersFromGroupView(post_data,callback){
	var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/generic?operation=getSuppliersFromGroupView',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}

function getRemoteDataSummary(post_data,callback){

  var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/generic?operation=getSchemaRecords',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}


function getRemoteDataApplicableFilters(post_data,callback){

  var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/generic?operation=getApplicableFilters',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}



function getRemoteDataRecord(post_data,callback){

  var requestOptions = {
      host: endPoint,
      port: endPointPort,
      path: '/generic?operation=getSchemaRecordForView',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  };

  var post_req = https.request(requestOptions, function(res) {
      res.setEncoding('utf8');
      var htmlString="";
			res.on('data', function(chunk){
				htmlString+=chunk;   
			});
			res.on('end', function(){
				callback(htmlString)
			});
  });
  post_req.write(JSON.stringify(post_data));
  post_req.end();
}


function parseSearchResult(htmlString,callback){
	var records=[];
	try{
		var result=JSON.parse(htmlString);
		try{
			result.data.result.hits.hits.map(function(rec){
				records.push(rec._source.doc);
			});
		}catch(err){}
	}catch(err){}
	callback({records:records});
}
function parseGroupViewResult(htmlString,callback){
	var records=[];
	try{
		var result=JSON.parse(htmlString);
		try{
			records=result[0].value;
		}catch(err){}
	}catch(err){}
	callback({records:records});
}

function parseSummaryResult(htmlString,callback){
	var records=[];
	try{
		var result=JSON.parse(htmlString);
		try{
			if(Array.isArray(result.records)){
				records=result.records.map(function(re){
					return re.value;
				});
			}
		}catch(err){console.log("parseSummaryResult:Not valid array");}
	}catch(err){console.log("parseSummaryResult:Parsing error");}
	callback({records:records});
}

function parseRecordResult(htmlString,callback){
	var record={};
	try{
		record=JSON.parse(htmlString);
	}catch(err){console.log("Parse error: parseRecordResult");}
	callback(record);
}
/*
Get Products
*/

function getProducts(data,callback){
	console.log("API :------------------->getProducts");
	console.log(data);
	if(data.MfrId || data.ProCatId){
		var post_data={
				schema: "Product",
				filters: {
					"$status": [
						"published"
					]
				},
				org: "public",
				skip: data.skip?data.skip:0,
				limit: defaultLimit,
				sortBy:"name"
			};
			if(data.MfrId){
				post_data.filters.Manufacturer=[data.MfrId];
			}
			if(data.ProCatId){
				post_data.filters.productCategory=[data.ProCatId];
			}
			if(data.filters){
				for(var key in data.filters){
					post_data.filters[key]=data.filters[key];
				}
			}
			if(data.productType){
				post_data.dependentSchema=data.productType;
			}
			console.log("GETPRODUCTS:POST DATA");
			console.log(post_data);;
			getRemoteDataSummary(post_data,function(rd){
				parseSummaryResult(rd,function(result){
					callback({records:result.records});
				});
			});
	}else{
		//searchText:{docType:"Product",productType:data.ProductCategory,esMeta:data.Manufacturer}
		var post_data={
			from:data.skip?data.skip:0,
			size:9,
			docType:"Product",
			searchText: data.ProductCategory +"  "+data.Manufacturer
		};
		getRemoteData(post_data,function(rd){
			parseSearchResult(rd,callback);
		});
	}
}
exports.getProducts=getProducts;

/*
Get Suppliers
*/
function getSuppliers(data,callback){
	console.log("API :------------------->getSuppliers");
	console.log(data);
	getSuppliersFromGroupView(data,function(rd){
		parseGroupViewResult(rd,function(pgr){
		 if(pgr.records.length==0){
		 	callback({records:[]});
		 	return;
		 }
			var post_data={
				schema: "Supplier",
				filters: {
					recordId: pgr.records
				},
				org: "public",
				skip: data.skip,
				limit: defaultLimit,
				sortBy:"name",
				sortOrder:"ascend"
			};	
			getRemoteDataSummary(post_data,function(rd){
				parseSummaryResult(rd,function(result){
					callback({records:result.records});
				});
			});
		});
	});
}
exports.getSuppliers=getSuppliers;

/*
Get Product Categories
*/
function getProductCategories(data,callback){
	console.log("API :------------------->getProductCategories");
	console.log(data);
	if(data.MfrId){
		var post_data={
				schema: "MfrProCat",
				filters: {
					Manufacturer: [
						data.MfrId
					]
				},
				org: "public",
				skip: data.skip?data.skip:0,
				limit: selectionLimit,
				sortBy:"categoryName",
				sortOrder:"ascend"
			};
			if(data.ProductCategory){
				post_data.searchKey=data.ProductCategory;
			}
			console.log(post_data);
			getRemoteDataSummary(post_data,function(rd){
				parseSummaryResult(rd,function(result){
					var cats=result.records.map(function(rec){
						return {name:rec.categoryName,recordId:rec.ProductCategory,productType:rec.productType};
					});
					callback({records:cats});
				});
			});
	}else{
		var post_data={
			schema:"ProductCategory",
			filters:{},
			org:"public",
			skip:data.skip?data.skip:0,
			limit:selectionLimit,
			sortBy:"categoryName",
			sortOrder:"ascend"
		};
		if(data.ProductCategory){
			post_data.searchKey=data.ProductCategory;
		}
		
		if(data.ProductCategoryGroup){
			getCatDocIdsWithGroup(data.ProductCategoryGroup,function(ids){
				if(Array.isArray(ids) && ids.length>0){
					post_data.filters.proCatGroups=ids;
				}
				getCats();
			});
		}else if(data.ProductCategoryMasterGroup){
			getCatDocIdsWithMasterGroup(data.ProductCategoryMasterGroup,function(ids){
				if(Array.isArray(ids) && ids.length>0){
					post_data.filters.proCatGroups=ids;
				}
				getCats();
			});
		}else{
			getCats();
		}
		
		function getCats(){
			console.log(post_data);
			getRemoteDataSummary(post_data,function(rd){
				parseSummaryResult(rd,function(result){
						var cats=result.records.map(function(rec){
							return {name:rec.categoryName,recordId:rec.recordId,productType:rec.productType}
						});
					callback({records:cats});
				});
			});
		}
		/*var post_data={
			from:data.skip?data.skip:0,
			size:1000,
			searchText:{docType:"ProductCategory"}
		};
		getRemoteData(post_data,function(rd){
			parseSearchResult(rd,callback);
		});*/
	}
}
exports.getProductCategories=getProductCategories;


function getCatDocIdsWithGroup(groupname,callback){
	console.log("----------> IN API :    getCatDocIdsWithGroup");
	var post_data={
			schema:"ProCatGroup",
			filters:{},
			org:"public",
			skip:0,
			limit:selectionLimit,
			searchKey:groupname
		};
		console.log(post_data);
		getRemoteDataSummary(post_data,function(rd){
			parseSummaryResult(rd,function(result){
					var cats=result.records.map(function(rec){
						return rec.recordId;
					});
				callback(cats);
			});
		});
}
function getCatDocIdsWithMasterGroup(mastergroupname,callback){
	console.log("----------> IN API :    getCatDocIdsWithMasterGroup");
	var post_data={
			schema:"ProCatMasterGroup",
			filters:{},
			org:"public",
			skip:0,
			limit:selectionLimit,
			searchKey:mastergroupname
		};
		console.log(post_data);
		getRemoteDataSummary(post_data,function(rd){
			parseSummaryResult(rd,function(result){
					var cats=result.records.map(function(rec){
						return rec.recordId;
					});
					
					var post_data={
						schema:"ProCatGroup",
						filters:{
							proCatMasterGroups:cats
						},
						org:"public",
						skip:0,
						limit:selectionLimit
					};
					console.log(post_data);
					getRemoteDataSummary(post_data,function(rd){
						parseSummaryResult(rd,function(result){
								var cats=result.records.map(function(rec){
									return rec.recordId;
								});
							callback(cats);
						});
					});
					
					
			});
		});
}

/*
Get Manufacturers
*/
function getManufacturers(data,callback){
	console.log("API :------------------->getManufacturers");
	console.log(data);
	if(data.ProCatId){
			var post_data={
				schema: "MfrProCat",
				filters: {
					ProductCategory: [
						data.ProCatId
					]
				},
				org: "public",
				skip: data.skip?data.skip:0,
				limit:selectionLimit,
				sortBy: "mfrName",
				sortOrder:"ascend"
			};
			if(data.Manufacturer){
				post_data.searchKey=data.Manufacturer;
			}
			getRemoteDataSummary(post_data,function(rd){
				parseSummaryResult(rd,function(result){
					var mfrs=result.records.map(function(rec){
						return {name:rec.mfrName,recordId:rec.Manufacturer}
					});
					callback({records:mfrs});
				});
			});
		}else{
			var post_data={
				schema:"Manufacturer",
				filters:{
					"$status":["published"]
				},
				org:"public",
				skip: data.skip?data.skip:0,
				limit: selectionLimit ,
				sortBy:"name",
				sortOrder:"ascend"
			};
			if(data.Manufacturer){
				post_data.searchKey=data.Manufacturer;
			}
			if(Array.isArray(data.recordIds)){
				post_data.filters.recordId=data.recordIds;
			}
			getRemoteDataSummary(post_data,function(rd){
				parseSummaryResult(rd,function(result){
					var mfrs=result.records.map(function(rec){
						return {name:rec.name,recordId:rec.recordId}
					});
					callback({records:mfrs});
				});
			});
			/*var post_data={
				from:data.skip?data.skip:0,
				size:10000,
				searchText:{docType:"Manufacturer"}
			};
			getRemoteData(post_data,function(rd){
				parseSearchResult(rd,callback);
			});*/
		}
}
exports.getManufacturers=getManufacturers;


/*
Get Cities
*/
function getCities(data,callback){
	console.log("API :------------------->getCities");
	console.log(data);
	if(data.MfrId || data.ProCatId){
		getCitiesFromGroupView(data,function(rd){
			parseGroupViewResult(rd,function(pgr){
				if(pgr.records.length==0){
				 	callback({records:[]});
				 	return;
				 }
				var post_data={
					schema: "City",
					filters: {
						recordId: pgr.records
					},
					org: "public",
					skip: data.skip?data.skip:0,
					limit: selectionLimit,
					sortBy:"cityName",
					sortOrder:"ascend"
				};	
				
				if(data.City){
					post_data.searchKey=data.City;
				}
				console.log(post_data);
				getRemoteDataSummary(post_data,function(rd){
					parseSummaryResult(rd,function(result){
						var cities=result.records.map(function(rec){
							return {name:rec.cityName,recordId:rec.recordId}
						});
						callback({records:cities});
					});
				});
			});
		});
	}else{
		var post_data={
			schema:"City",
			filters:{
			},
			org:"public",
			skip: data.skip?data.skip:0,
			limit: selectionLimit,
			sortBy:"cityName",
			sortOrder:"ascend"
		};
		if(data.City){
			post_data.searchKey=data.City;
		}
		getRemoteDataSummary(post_data,function(rd){
			parseSummaryResult(rd,function(result){
				var cities=result.records.map(function(rec){
					return {name:rec.cityName,recordId:rec.recordId}
				});
				callback({records:cities});
			});
		});
	}
}
exports.getCities=getCities;

function getCategorySchema(data,callback){
	console.log("API :------------------->getCategorySchema");
	console.log(data);
	var post_data={
		schema:"ProductCategory",
		org:"public",
		recordId:data.ProCatId
	};
	getRemoteDataRecord(post_data,function(rd){
		parseRecordResult(rd,function(data){
			if(data.record && data.record.productType){
				var pd={
					schema:"Product",
					recordId:"Product9311ae22-3341-9a5a-f4a5-7003cce4546e",
					org:"public",
					dependentSchema:data.record.productType
				};
				getRemoteDataRecord(pd,function(rd2){
					parseRecordResult(rd2,function(data2){
						if(data2.schema){
							callback(data2.schema);
						}else{
							callback({});
						}
					});
				});
			}else{
				callback({});
			}
		});
	});
}
exports.getCategorySchema=getCategorySchema;

function getProductCategoryRecord(data,callback){
	console.log("API :------------------->getProductCategoryRecord");
	console.log(data);
	var post_data={
		schema:"ProductCategory",
		org:"public",
		recordId:data.ProCatId
	};
	getRemoteDataRecord(post_data,function(rd){
		parseRecordResult(rd,function(data){
			callback(data.record?data.record:{});
		});
	});
}
exports.getProductCategoryRecord=getProductCategoryRecord;


function getApplicableFilters(data,callback){
	var post_data={
  	schema:"Product",
  	dependentSchema: data.productType,
  	allFilters: data.allFilterKeys,
  	selectedFilters: data.filters?data.filters:{}
	};
	post_data.selectedFilters["$status"]=["published"];
	post_data.selectedFilters.productType=[data.productType];
	if(data.MfrId){
		post_data.selectedFilters.Manufacturer=[data.MfrId];
	}
	getRemoteDataApplicableFilters(post_data,function(rd){
		var result={};
		try{result=JSON.parse(rd);}catch(err){console.log("ERROR while parsing applicablefilters response");}
		callback(result);
	});
}
exports.getApplicableFilters=getApplicableFilters;



function getSupplier(data,callback){
	console.log("API :------------------->get Supplier");
	console.log(data);
	var post_data={
		schema:"Supplier",
		org:"public",
		recordId:data.recordId
	};
	getRemoteDataRecord(post_data,function(rd){
		parseRecordResult(rd,function(data){
			callback(data.record?data.record:{});
		});
	});
}
exports.getSupplier=getSupplier;



function getProduct(data,callback){
	console.log("API :------------------->get Product");
	console.log(data);
	var post_data={
		schema:"Product",
		org:"public",
		dependentSchema:data.productType,
		recordId:data.recordId
	};
	getRemoteDataRecord(post_data,function(rd){
		parseRecordResult(rd,function(data){
			callback(data.record?data.record:{});
		});
	});
}
exports.getProduct=getProduct;

