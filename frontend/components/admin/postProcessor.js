/*******************************************************************************
 * @author saikiran.vadlakonda
 *
 * D: 31st May, 2017
 *
 *
 *
 */


var totalProperties = {};

var currentPackage = [];
var errorProductIds = [];
var errorProductJson = [];
var errorIndex = [];

var Manufacturer = {};
var dependentSchema = "";
var dependentProperties = [];
var user = "BackendScraper";
var productIds = [];
var indexes = [];

var allSchemas = {};

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};


var dataParseTemplate = {};

function processRecord(postProcessorJson, scrappedRecs, callback, schma, dptSchma) {
	dataParseTemplate=postProcessorJson;
	allSchemas[schma['@id']]=schma;
	allSchemas[dptSchma['@id']]=dptSchma;

	if (scrappedRecs.length && scrappedRecs[0] && scrappedRecs[0]['sourceUrl']) {
		console.log("we can process and store");
		console.log("Got schema and dependent schema");
		processAndStoreRecord(scrappedRecs[0], function(rec, res, reason) {
			callback(rec, res, reason);
		});
	} else {
		console.log("We can't process this record");
		callback(scrappedRecs, true);
	}
}

function processAndStoreRecord(scrappedRecord, callback) {
	console.log("processing started.........");
	var schema = dataParseTemplate.Schema;
	var dependentSchema = dataParseTemplate.DependentSchema;
	var allProperties = {};

	if (allSchemas[schema]) {
	schema = allSchemas[schema];
	}
	if (allSchemas[dependentSchema]) {
	dependentSchema = allSchemas[dependentSchema];
	}

	// Object.assign(totalProperties, schema['@properties'],
	// dependentSchema['@properties']);//clubbing schema and dependentSchema
	// props into one json

	var newRecord = {};

	for ( var prop in schema['@properties']) {
	newRecord[prop] = "";
	switch (schema['@properties'][prop].dataType.type) {
	case "array":
	newRecord[prop] = [];
	break;
	case "multiPickList":
	newRecord[prop] = [];
	break;
	case "textarea":
	case "text":
	case "pickList":
	newRecord[prop] = "";
	break;
	case "image":
	case "images":
	case "attachments":
	case "attachment":
	newRecord[prop] = [];
	break;
	}
	}
	// console.log("props done", newRecord);


	if(dependentSchema){
	newRecord['dependentProperties'] = {};

	for ( var prop in dependentSchema['@properties']) {
	// newRecord['dependentProperties'][prop]="";
	switch (dependentSchema['@properties'][prop].dataType.type) {
	case "array":
	newRecord['dependentProperties'][prop] = [];
	break;
	case "multiPickList":
	newRecord['dependentProperties'][prop] = [];
	break;
	case "textarea":
	case "text":
	case "pickList":
	newRecord['dependentProperties'][prop] = "";
	break;
	case "image":
	case "images":
	case "attachments":
	case "attachment":
	newRecord['dependentProperties'][prop] = [];
	break;
	}
	}
	}

	// console.log("dependent props done", newRecord);

	// fillPropertiesWithDefaultStructure(newRecord, schema);
	// fillPropertiesWithDefaultStructure(newRecord, dependentSchema);
	setSystemProps(newRecord,schema,dependentSchema,function() {
		prefillDataFromPostDataTemplate(newRecord, dataParseTemplate.prefillData);

		// console.log(newRecord);
		newRecord['relationDesc'] = schema['@relationDesc'];// setting
		// relations
		// to record
		// and
		// associated
		// schema

		if (dependentSchema && dependentSchema['@relationDesc']) {
			// newRecord['relationDesc']=dependentSchema['@relationDesc'];//setting
			// relations to record and associated schema
		}
		parsePropertiesAndFill(dataParseTemplate, newRecord, scrappedRecord, function(newRecord1) {
			parseDependentPropertiesAndFill(dataParseTemplate, newRecord1, scrappedRecord, function(newRecord2) {
				newRecord2["sourceUrl"] = scrappedRecord["sourceUrl"];
				setEsTitleNMeta(newRecord2, function(newRecord3) {
					createSpec(dataParseTemplate, scrappedRecord, newRecord3, function(newRecord4) {
						console.log(newRecord4);
						callback(newRecord4);
					});
				});
			});
		});
	});

}

/**
 *
 * Setting System properties
 *
 */
function setSystemProps(newRecord, schema, dependentSchema, callback) {
	newRecord['docType'] = schema['@id'];
	newRecord['org'] = "public";
	newRecord['recordId'] = (schema['@id'] + "-" + Utility.guid());
	newRecord['revision'] = 1;
	newRecord['author'] = "Administrator";
	newRecord['dateCreated'] = Utility.getDate();
	newRecord['editor'] = "Administrator";
	if(dataParseTemplate.Schema == "collection"){
	newRecord['$status']="published";
	}else{
	newRecord['$status']="under_review";
	}

	newRecord['dateModified'] = Utility.getDate();
	newRecord['@superType'] = (schema['@id']);
	newRecord['@identifier'] = (schema['@identifier']);
	dependentSchema?(newRecord['@derivedObjName'] = (dependentSchema['@id'])):"";
	newRecord['cloudPointHostId'] = "cloudseed";
	console.log("sys props done");
	callback();
}

/**
 * Filling user configured fields into record
 *
 *
 */
function prefillDataFromPostDataTemplate(record, prefillDataJson) {
	console.log("filling prefill");
	var props = Object.keys(prefillDataJson);
	for ( var prop in prefillDataJson) {
	if(record.hasOwnProperty(prop)){
	record[prop] = prefillDataJson[prop];
	}else if(record.dependentProperties && record.dependentProperties.hasOwnProperty(prop)){
	record['dependentProperties'][prop] = prefillDataJson[prop];
	}else{
	record[prop] = prefillDataJson[prop];
	}

	}
	console.log("prefill done");
	// newRecord.Manufacturer=dataParseTemplate.Manufacturer.id;
	// newRecord.esMeta=dataParseTemplate.Manufacturer.name;

}

/**
 * Parsing Main Schema Properties and storing in new record
 *
 */
function parsePropertiesAndFill(dataParseTemplate, newRecord, scrappedRecord, callback) {
	console.log("parsing properties...");
	var propsToParse = Object.keys(dataParseTemplate.properties);

	parseProp(0, dataParseTemplate, newRecord, scrappedRecord, function() {
	callback(newRecord);
	});

}

/**
 * "name":{ "value":"name", "operations":["trim"] }, "groupID":{ "value":
 * "name", "operations":["matchWithRegex"], "regex":/[A-Za-z0-9]+(?=\w{2})/ }
 *
 * parseProp(0, dataParseTemplate, newRecord, scrappedRecord, callback);
 */
function parseProp(propIndex, dataParseTemplate, newRecord, scrappedRecord, callback) {
	var propsToParse = Object.keys(dataParseTemplate.properties);

	console.log("prop index: " + propIndex, propsToParse[propIndex]);

	if (propIndex >= propsToParse.length) {
	callback(newRecord);
	} else {
	var propertyJson = dataParseTemplate['properties'][propsToParse[propIndex]];
	var property = propsToParse[propIndex];
	newRecord[property] = "";
	// processing
	// console.log("property json", scrappedRecord);
	if (scrappedRecord[propertyJson.value]) {
	performOperations(newRecord,propertyJson,property,scrappedRecord,dataParseTemplate,function(operatedResult) {
	var schema = dataParseTemplate.Schema;
	var dependentSchema = dataParseTemplate.DependentSchema;
	var allProperties = {};

	if (allSchemas[schema]) {
	schema = allSchemas[schema];
	}

	var schemaProp = schema['@properties'][propsToParse[propIndex]];
	if(schemaProp && schemaProp.dataType){
	switch (schemaProp.dataType.type) {
	case "array":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord[property] = operatedResult;
	} else {
	newRecord[property] = [ operatedResult ];
	}
	} else {
	newRecord[property] = [];
	}
	break;
	case "multiPickList":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	var actualVals = schemaProp.dataType.options;
	var filteredVals=[];

	for(var res in operatedResult){
	if(actualVals.indexOf(operatedResult[res])!=-1){
	filteredVals.push(operatedResult[res]);
	}
	}
	newRecord[property] = filteredVals;
	} else {
	newRecord[property] = [ operatedResult ];
	}
	} else {
	newRecord[property] = [];
	}

	break;

	case "textarea":
	case "text":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord[property] = operatedResult
	.toString();
	} else {
	newRecord[property] = operatedResult;
	}
	} else {
	newRecord[property] = "";
	}

	break;

	case "pickList":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	var actualVals = schemaProp.dataType.options;
	var filteredVals=[];

	for(var res in operatedResult){
	if(actualVals.indexOf(operatedResult[res]) != -1){
	filteredVals=operatedResult[res];
	}
	}
	newRecord[property] = filteredVals;
	} else {
	newRecord[property] = operatedResult;
	}
	} else {
	newRecord[property] = "";
	}
	if (Array.isArray(newRecord[property])) {
	newRecord[property]=newRecord[property][0]?newRecord[property][0]:"";
	}

	break;
	case "image":
	case "images":
	case "attachments":
	case "attachment":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord[property] = operatedResult;
	} else {
	newRecord[property] = [ operatedResult ];
	}
	} else {
	newRecord[property] = [];
	}
	break;
	case "currency":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord[property] = operatedResult;
	} else {
	newRecord[property] =  operatedResult ;
	}
	} else {
	newRecord[property] = "";
	}
	break;

	case "object":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord[property] = operatedResult.toString();
	} else {
	newRecord[property] =  operatedResult ;
	}
	} else {
	newRecord[property] = "";
	}
	break;
	default: console.log("Invalid Prop");
	}
	}else{
	newRecord[property] = Array.isArray(operatedResult)?operatedResult[0]:operatedResult;
	}

	parseProp(propIndex + 1, dataParseTemplate, newRecord, scrappedRecord, callback);
	});
	} else {
	parseProp(propIndex + 1, dataParseTemplate, newRecord, scrappedRecord, callback);
	}

	}
}

function performOperations(newRecord, propertyJson, property, scrappedRecord, dataParseTemplate, callback) {
	// "operations":["trim", "replaceNewLine", "replaceSpaces"]
	// console.log("operation on prop", newRecord);
	var operationsList = [];
	var finalVal = "";
	if (dataParseTemplate
	&& dataParseTemplate['properties']
	&& dataParseTemplate['properties'][property]
	&& dataParseTemplate['properties'][property]['operations']
	&& Array.isArray(dataParseTemplate['properties'][property]['operations'])) {
	operationsList = dataParseTemplate['properties'][property]['operations'];
	var operationsCnt = operationsList.length;
	// console.log("property : "+property);

	var operateRec = Utility.clone(scrappedRecord);
	var propJson = Utility.clone(propertyJson);

	performOperation(0)
	function performOperation(opIndex) {
	if (opIndex < operationsCnt) {
	var operation = operationsList[opIndex];
	var valueToParse = dataParseTemplate['properties'][property]['value'];
	// console.log("operation: "+operation, "propertyJson: ",
	// propertyJson ,"scrappedRec: ", scrappedRecord);
	//console.log(valueToParse, operation);
	if (typeof globalOperations[operation] == "function") {
	// from " Linen : 15% - Silk : 35% - Acrylic : 15% - Viscose
	// : 30% - Polyamide : 5% Cotton." -> will get-> ["Linen",
	// "Silk", "Acrylic", "Viscose", "Cotton"]
	globalOperations[operation](operateRec, propJson, function(operatedResult) {
	if (operatedResult) {
	operateRec[propJson.value] = operatedResult;
	//propJson[propJson.value] = operatedResult;
	finalVal = operatedResult;
	performOperation(opIndex + 1);
	}else{
	//propJson[propJson.value] = operatedResult;
	//finalVal = operatedResult;
	//performOperation(opIndex + 1);
	}



	});// processed data will be returned(like from "F3210015
	// FINE" will get "F32100"

	} else {
	console.log("function not defined....." + (operation));
	if (typeof operation == "object") {
	/*{"stringReplacer":{
	"replaceText" : [ "Durability", ".", "Martindale", "\n", "," ],
	"replaceWith" : " "
	}}*/
	var operationJson = operation;

	operation = Object.keys(operationJson)[0];
	for(var key in operationJson[operation]){
	propJson[key]=operationJson[operation][key];
	}

	console.log('obj op called');
	globalOperations[operation](operateRec, propJson, function(operatedResult) {
	operateRec[propJson.value] = operatedResult;
	finalVal = operatedResult;
	performOperation(opIndex + 1)
	});// processed data will be returned(like from "F3210015
	// FINE" will get "F32100"

	}
	}
	} else {
	//console.log("All operations done on this prop: ", propertyJson);
	callback(finalVal);
	}
	}
	/*
	 * for(var opIndx=0; opIndx<operationsCnt; opIndx++){ var operation =
	 * operationsList[opIndx]; var valueToParse=
	 * dataParseTemplate['properties'][property]['value'];
	 * //console.log("operation: "+operation, "propertyJson: ", propertyJson
	 * ,"scrappedRec: ", scrappedRecord); if(typeof
	 * globalOperations[operation] == "function"){ //from " Linen : 15% -
	 * Silk : 35% - Acrylic : 15% - Viscose : 30% - Polyamide : 5% Cotton." ->
	 * will get-> ["Linen", "Silk", "Acrylic", "Viscose", "Cotton"]
	 * globalOperations[operation](operateRec, propJson,
	 * function(operatedResult){ operateRec[propJson.value] =
	 * operatedResult; });//processed data will be returned(like from
	 * "F3210015 FINE" will get "F32100"
	 *
	 *
	 *
	 * }else{ console.log("function not defined....."+(operation)); } }
	 */

	} else {
	console.log("dataParseTemplate configuration....no operations defined");
	operatedResult = scrappedRecord[propertyJson.value];

	}

}

/**
 *
 * Functions to deal with Dependent Schema Properties
 *
 *
 */
function parseDependentPropertiesAndFill(dataParseTemplate, newRecord,scrappedRecord, callback) {

	var propsToParse = Object.keys(dataParseTemplate.dependentProperties);
	if (propsToParse.length) {
	parseDependentProp(0, dataParseTemplate, newRecord, scrappedRecord, function() {
	callback(newRecord);
	});
	} else {
	callback(newRecord);
	}
}
function parseDependentProp(propIndex, dataParseTemplate, newRecord, scrappedRecord, callback) {

	var propsToParse = Object.keys(dataParseTemplate.dependentProperties);
	if (propIndex >= propsToParse.length) {
	callback(newRecord);
	} else {
	var propertyJson = dataParseTemplate['dependentProperties'][propsToParse[propIndex]];
	var property = propsToParse[propIndex];
	// newRecord[property]="";
	// processing
	if (scrappedRecord[propertyJson.value]) {
	performOperationsOnDependentProps(newRecord, propertyJson, property, scrappedRecord, dataParseTemplate, function(operatedResult) {
	var schema = dataParseTemplate.Schema;
	var dependentSchema = dataParseTemplate.DependentSchema;
	var allProperties = {};

	if (allSchemas[dependentSchema]) {
	dependentSchema = allSchemas[dependentSchema];
	}
	if (!newRecord['dependentProperties']) {
	newRecord['dependentProperties'] = {};
	}

	var dSProp = dependentSchema['@properties'][propsToParse[propIndex]];
	console.log([propsToParse[propIndex]]);
	switch (dSProp.dataType.type) {
	case "array":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord['dependentProperties'][property] = operatedResult;
	} else {
	newRecord['dependentProperties'][property] = [ operatedResult ];
	}
	} else {
	newRecord['dependentProperties'][property] = [];
	}

	break;
	case "multiPickList":
	console.log("Multipicklist: "+operatedResult);
	if (operatedResult) {

	if (Array.isArray(operatedResult)) {
	var actualVals = dSProp.dataType.options;
	var filteredVals=[];

	for(var res in operatedResult){
	if(actualVals.indexOf(operatedResult[res]) != -1){
	filteredVals.push(operatedResult[res]);
	}
	}
	newRecord['dependentProperties'][property] = filteredVals;
	} else {
	var actualVals = dependentSchema['@properties'][propsToParse[propIndex]].dataType.options;
	var filteredVals=[];

	//for(var res in operatedResult){
	if(actualVals.indexOf(operatedResult) !=-1){
	filteredVals.push(operatedResult);
	}
	//}
	newRecord['dependentProperties'][property] = filteredVals;
	}
	} else {
	newRecord['dependentProperties'][property] = [];
	}

	break;

	case "textarea":
	case "text":
	if (operatedResult) {
	newRecord['dependentProperties'][property] = operatedResult;
	} else {
	newRecord['dependentProperties'][property] = "";
	}

	break;

	case "pickList":
	console.log("Picklist: "+operatedResult);
	if (operatedResult) {
	console.log("Picklist: "+operatedResult+" is array: "+Array.isArray(operatedResult));
	console.log(dSProp.dataType.options);
	if (Array.isArray(operatedResult)) {
	var actualVals = dSProp.dataType.options;
	var filteredVals=[];

	for(var res in operatedResult){
	console.log("res: "+res, actualVals.indexOf(operatedResult[res]), operatedResult[res]);
	if(actualVals.indexOf(operatedResult[res]) !=-1){
	filteredVals=operatedResult[res];
	}
	}
	newRecord['dependentProperties'][property] = filteredVals;
	console.log(property, newRecord['dependentProperties'][property]);
	//newRecord['dependentProperties'][property] = operatedResult.toString();
	} else {
	newRecord['dependentProperties'][property] = operatedResult;
	}
	} else {
	newRecord['dependentProperties'][property] = "";
	}
	if((newRecord['dependentProperties'][property]).constructor == Array){
	newRecord['dependentProperties'][property]=newRecord['dependentProperties'][property][0]?newRecord['dependentProperties'][property][0]:"";
	}

	break;
	case "image":
	case "images":
	case "attachments":
	case "attachment":
	if (operatedResult) {
	newRecord['dependentProperties'][property] = operatedResult;
	} else {
	newRecord['dependentProperties'][property] = "";
	}
	break;
	case "object":
	if (operatedResult) {
	if (Array.isArray(operatedResult)) {
	newRecord[property] = operatedResult.toString();
	} else {
	newRecord[property] =  operatedResult ;
	}
	} else {
	newRecord[property] = "";
	}
	break;
	default: console.log("Invalid Prop");

	}
	parseDependentProp(propIndex + 1, dataParseTemplate, newRecord, scrappedRecord, callback);
	});
	} else {
	parseDependentProp(propIndex + 1, dataParseTemplate, newRecord, scrappedRecord, callback);
	}

	}
}
function performOperationsOnDependentProps(newRecord, propertyJson, property, scrappedRecord, dataParseTemplate, callback) {
	// "operations":["trim", "replaceNewLine", "replaceSpaces"]
	console.log("dependent prop operation");
	var operationsList = [];
	var finalVal = "";

	if (dataParseTemplate
	&& dataParseTemplate['dependentProperties']
	&& dataParseTemplate['dependentProperties'][property]
	&& dataParseTemplate['dependentProperties'][property]['operations']
	&& Array.isArray(dataParseTemplate['dependentProperties'][property]['operations'])) {

	operationsList = dataParseTemplate['dependentProperties'][property]['operations'];
	var operationsCnt = operationsList.length;

	var operateRec = Utility.clone(scrappedRecord);
	var propJson = Utility.clone(propertyJson);

	performOperation(0)
	function performOperation(opIndex) {
	if (opIndex < operationsCnt) {
	var operation = operationsList[opIndex];
	var valueToParse = dataParseTemplate['dependentProperties'][property]['value'];

	console.log(operation, typeof globalOperations[operation]);

	if (typeof operation == "string" && typeof globalOperations[operation] == "function") {
	// from " Linen : 15% - Silk : 35% - Acrylic : 15% - Viscose
	// : 30% - Polyamide : 5% Cotton." -> will get-> ["Linen",
	// "Silk", "Acrylic", "Viscose", "Cotton"]
	console.log('fn op called');
	globalOperations[operation](operateRec, propJson, function(operatedResult) {
	operateRec[propJson.value] = operatedResult;
	finalVal = operatedResult;
	performOperation(opIndex + 1)
	});// processed data will be returned(like from "F3210015
	// FINE" will get "F32100"

	}else if (typeof operation == "object") {
	/*{"stringReplacer":{
	"replaceText" : [ "Durability", ".", "Martindale", "\n", "," ],
	"replaceWith" : " "
	}}*/
	var operationJson = operation;

	operation = Object.keys(operationJson)[0];
	for(var key in operationJson[operation]){
	propJson[key]=operationJson[operation][key];
	}

	console.log('obj op called');
	globalOperations[operation](operateRec, propJson, function(operatedResult) {
	operateRec[propJson.value] = operatedResult;
	finalVal = operatedResult;
	performOperation(opIndex + 1)
	});// processed data will be returned(like from "F3210015
	// FINE" will get "F32100"

	}

	} else {
	callback(finalVal);
	}
	}

	/*
	 * for(var opIndx=0; opIndx<operationsCnt; opIndx++){ var operation =
	 * operationsList[opIndx]; var valueToParse=
	 * dataParseTemplate['dependentProperties'][property]['value'];
	 * if(typeof globalOperations[operation] == "function"){ //from " Linen :
	 * 15% - Silk : 35% - Acrylic : 15% - Viscose : 30% - Polyamide : 5%
	 * Cotton." -> will get-> ["Linen", "Silk", "Acrylic", "Viscose",
	 * "Cotton"] operatedResult = globalOperations[operation](operateRec,
	 * propJson);//processed data will be returned(like from "F3210015 FINE"
	 * will get "F32100" operateRec[propJson.value] = operatedResult; } }
	 */
	}else{
	console.log(Array.isArray(dataParseTemplate['dependentProperties'][property]['operations']), property);
	}

	// callback(operatedResult);

}





function setEsTitleNMeta(record, callback){
	if(record.docType=="Product"){
	//SLUG: w.com/ <Mfr> <Product Name> <Prod No>
	//if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
	var userName=record.esMeta.trim().replace(/\W+/g,"-").toLowerCase()+"-"+ record.name.trim().substr(0,50).replace(/\W+/g,"-").toLowerCase();
	if(record.mfrProductNo && record.mfrProductNo.trim()!=""){
	userName+="-"+record.mfrProductNo.trim().replace(/\W+/g,"").toLowerCase()
	}
	record["@uniqueUserName"]=userName;
	//}
	record.metaTitle=record.esMeta.trim()+" "+ record.name.trim().substr(0.40)+" "+record.mfrProductNo.trim()+" | cloudseed.com";
	record.metaDescription=record.esMeta+" "+ record.name+" "+record.mfrProductNo+". Find and chat with local suppliers and dealers near you."
	}
	if(record.docType=="collection"){
	var userName=record.esMeta.trim().replace(/\W+/g,"-").toLowerCase()+"-"+ record.collection.trim().substr(0,50).replace(/\W+/g,"-").toLowerCase();
	if(record.mfrProductNo && record.mfrProductNo.trim()!=""){
	userName+="-"+record.mfrProductNo.trim().replace(/\W+/g,"").toLowerCase()
	}
	record["@uniqueUserName"]=userName;
	record.metaTitle=record.esMeta.trim()+" "+ record.collection.trim().substr(0.40)+" | cloudseed.com";
	record.metaDescription="Find all products in "+ record.collection+" by "+record.esMeta;
	}
	callback(record);
}


function createSpec(dataParseTemplate, scrappedRecord, newRecord, callback){
	var propertyJson = dataParseTemplate.createSpec;
	console.log("specFromJson called");
	var jsonData = scrappedRecord[propertyJson.value];
	var finalValue = "";
	finalValue = "";

	if(jsonData){
	for(var header in jsonData){
	finalValue+=(header.toUpperCase().trim().replace(/:$/g, '')+"\n");
	finalValue+=(jsonData[header].trim()+"\n\n");
	}
	finalValue = finalValue.replace(/\n\b[a-z](?=[a-z]{2})/g, function(letter) {
	return letter.toUpperCase();
	});
	finalValue=finalValue.trim().replace(/\n$/g, '');
	console.log("getValue -- "+finalValue);
	newRecord['specifications']=finalValue.trim();
	}else{

	}


	callback(newRecord);
}


var globalOperations = {
	assign : function(scrappedRecord, propertyJson, callback) {
	callback(scrappedRecord[propertyJson.value]);
	},
	trim : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	console.log(value)
	if (value.constructor == String) {
	callback(value.trim());
	}
	callback("");
	},
	replaceNewLine : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];

	if (value.constructor == String) {
	callback(value.replace(/\n/g, ''));
	}
	callback("");
	},
	replaceSpaces : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];

	if (value.constructor == String) {
	callback(value.replace(/\s/g, ''));
	}
	callback("");
	},
	matchWithRegex : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	if (value) {
	var regex = propertyJson.regex;
	var res = value.match(regex);
	console.log("matchWithRegex res: ", res);
	if (res) {
	console.log("matchWithRegex res1: ");
	if (!res.input) {
	console.log("matchWithRegex !res.input: ", res);
	if(res.constructor == Array){
	res=res[0];
	/* if(res.index == 0 || res.index){
	res=res[res.index];
	}else{
	res=res[0];
	} */
	}
	if(res == null){
	res="";
	}
	callback(res);
	} else {
	console.log("matchWithRegex res.input: ", res);
	if(res.constructor == Array){
	res=res[0];
	/* if(res.index == 0 || res.index){
	res=res[0];
	}else{

	} */
	}
	if(res == null){
	res="";
	}
	console.log("matchWithRegex going back ", res);
	callback(res);
	}
	} else {
	callback("");
	}
	// return value.match(regex);
	} else {
	callback("");
	}

	},
	numericRange : function(scrappedRecord, propertyJson, callback) {
	// console.log("%%%% "+scrappedRecord[propertyJson.value])
	var value = Number(scrappedRecord[propertyJson.value].toString()
	.replace(/\./g, "").replace(/,/g, ""));

	if (value) {
	var range = propertyJson.range;
	for (var i = 0; i < Object.keys(range).length; i++) {
	var rangeKey = Object.keys(range)[i].split("-");
	// console.log("sat "+value);

	if (rangeKey[1] != "Infinity") {
	if (value >= Number(rangeKey[0])
	&& value <= Number(rangeKey[1])) {

	callback(range[Object.keys(range)[i]]);
	break;
	}
	} else {
	// console.log(" "+value)
	if (value >= Number(rangeKey[0])) {

	callback(range[Object.keys(range)[i]]);
	break;
	}
	}
	}
	} else {
	callback("");
	}
	},
	stringRange : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value].toString();
	//console.log("Srange value: ", value);
	if (value) {
	var range = propertyJson.range;
	var res = [];
	for (var i = 0; i < Object.keys(range).length; i++) {
	var rangeKey = Object.keys(range)[i];

	var rangeValues = range[rangeKey];

	for(var rangeIndx in rangeValues){
	var rangeTxt = rangeValues[rangeIndx];
	//console.log(value.toLowerCase(), (rangeTxt.toLowerCase()), value.toLowerCase().indexOf(rangeTxt.toLowerCase()));
	if (value.toLowerCase().indexOf(rangeTxt.toLowerCase()) != -1) {//ignore case here
	res.indexOf(rangeKey)==-1?res.push(rangeKey):'';
	console.log('res', res);
	}
	}


	}


	if (!res.length) {
	//res.push("Other");
	}
	callback(res);
	} else {
	callback("");
	}
	},
	generateImageStructure : function(scrappedRecord, propertyJson, callback) {
		var images = scrappedRecord[propertyJson.value];
		// start from here

		if (!Array.isArray(images)) {// convert value into Array
			if (images && images.indexOf && images.indexOf(",") != -1 && images.match(/,\ *http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/)) {
				if(images.match(/,\ *http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/).length){

				}
				var multipleImgs=images.split(",");
				var canSplit=false;
				for(var img=0; img<multipleImgs.length; img++){
					if(multipleImgs[img].match(/http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/)){
						canSplit=true;
					}else{
						canSplit=false;
					}
				}

				if(canSplit){
					images = images.split(",");
				}else {
					images = [ images ];
				}

			} else {
				images = [ images ];
			}

		}

		if(dataParseTemplate.Schema == "collection"){

			var image = [];
			var flag = false;
			// console.log(images)
			for (var i = 0; i < images.length; i++) {
				var id = Utility.guid();
				var temp = {
					"cloudinaryId" : id,
					"name" : id,
					"caption": "",
					"url" : images[i].indexOf("http://")==-1?(images[i].indexOf("//")==0?"http:"+images[i]:images[i]):images[i]
				};

				image.push(temp);

			}
			console.log(image);
			callback(image);
		}else{

			var productImages = [];
			var flag = false;
			// console.log(images)
			for (var i = 0; i < images.length; i++) {
				var id = Utility.guid();
				var temp = {
					"cloudinaryId" : id,
					"imageName" : id,
					"caption": "",
					"url" : images[i].indexOf("http://")==-1?(images[i].indexOf("//")==0?"http:"+images[i]:images[i]):images[i]
				};

				if(decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g) != null && decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0]){
					temp['caption']= decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0].replace("/", "");
				}else{
					console.log("null coming::: "+ temp.url);
				}

				productImages.push({
					"produtImages" : [ temp ],
					"variant" : ""
				});

			}
			console.log(productImages);
			callback(productImages);
		}


	},

	generateAttachmentStructure : function(scrappedRecord, propertyJson, callback) {
		var images = scrappedRecord[propertyJson.value];
		// start from here

		if (!Array.isArray(images)) {// convert value into Array
			if (images && images.indexOf && images.indexOf(",") != -1 && images.match(/,\ *http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/)) {
				if(images.match(/,\ *http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/).length){

				}
				var multipleImgs=images.split(",");
				var canSplit=false;
				for(var img=0; img<multipleImgs.length; img++){
					if(multipleImgs[img].match(/http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/)){
						canSplit=true;
					}else{
						canSplit=false;
					}
				}

				if(canSplit){
					images = images.split(",");
				}else {
					images = [ images ];
				}

			} else {
				images = [ images ];
			}

		}

		//var type = propertyJson.type;

		var productImages = [];
		var flag = false;
		// console.log(images)
		for (var i = 0; i < images.length; i++) {
			var id = Utility.guid();
			var temp = {
				"cloudinaryId" : id,
				"imageName" : id,
				"caption": "",
				"url" : images[i].indexOf("http://")==-1?(images[i].indexOf("//")==0?"http:"+images[i]:images[i]):images[i]
			};

			if(decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g) != null && decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0]){
				temp['caption']= decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0].replace("/", "");
			}else{
				console.log("null coming::: "+ temp.url);
			}
			productImages.push(temp);

		}
		console.log(productImages);
		callback(productImages);



	},
	processWithNLP : function(scrappedRecord, propertyJson, callback) {
	console.log('op ex start');
	var value = scrappedRecord[propertyJson.value];
	var keys = propertyJson.key;
	var keysLen = propertyJson.key.length;

	if (value) {
	subProcess(0);
	} else {
	callback("");
	}

	function subProcess(keyIndex) {
	if (keyIndex < keysLen) {
	nlp.getFromNLP(value, keys[keyIndex], function(res) {

	// value = res.join(" ");
	value = res.toString();
	console.log("______" + value)
	if (value) {
	subProcess(keyIndex + 1)
	} else {
	callback(value);
	}
	});
	} else {
	callback(value);
	}
	}
	},
	mergeFields : function(scrappedRecord, propertyJson, callback) {
	var fields = propertyJson.fields;
	var fieldsLen = propertyJson.fields.length;
	var temp = "";
	var mergeText = propertyJson.mergeWith;
	for (var i = 0; i < fieldsLen; i++) {
		if(i==fieldsLen-1){
			temp = temp + (scrappedRecord[fields[i]]?scrappedRecord[fields[i]]:"");
		}else{
			temp = temp + (scrappedRecord[fields[i]]?scrappedRecord[fields[i]]:"") + (mergeText?mergeText:"");
		}

	}
	/*
	if(temp.lastIndexOf(mergeText) == temp.length-1){
		console.log(temp);
		temp=temp.slice(0, -(mergeText.length));
		console.log(temp);
	}*/

	console.log(temp)
	callback(temp);
	},
	stringReplacer : function(scrappedRecord, propertyJson, callback) {
	//console.log("SR called");
	var value = scrappedRecord[propertyJson.value];
	var replaceText = propertyJson.replaceText;
	var replaceWith = propertyJson.replaceWith;
	var finalValue = "";
	finalValue = value;

	if(finalValue.constructor == String){

	}else if(finalValue.constructor == Object){

	}else if(finalValue.constructor == Array){
		finalValue = finalValue.toString();
	}else{
		finalValue = finalValue.toString();
	}

	for (var i = 0; i < replaceText.length; i++) {
		// console.log(finalValue);
		var repText = replaceText[i];

		if((repText.indexOf("/") != -1) && (repText.indexOf("/g") != -1)){
			var regex = new RegExp(repText);
			console.log("regex--",regex);
			finalValue = finalValue.replace(regex, replaceWith);
		}else{
			finalValue = finalValue.replace(repText, replaceWith);
		}

		//finalValue = finalValue.replace(replaceText[i], replaceWith);
	}
	callback(finalValue);
	},
	getValueFromJson : function(scrappedRecord, propertyJson, callback) {
	console.log("getValue called");
	var value = scrappedRecord[propertyJson.value];
	var keyName = propertyJson.keyText;
	var finalValue = "";
	finalValue = value;

	if(value.constructor == Object && value.hasOwnProperty(keyName)){
	finalValue=value[keyName];
	}else if(!value.hasOwnProperty(keyName)){
	finalValue="";
	}

	if(finalValue == undefined || finalValue == null){
	finalValue="";
	}
	console.log("getValue -- "+finalValue);
	callback(finalValue);
	},
	capitalize : function(scrappedRecord, propertyJson, callback) {
	console.log("getValue called");
	var value = scrappedRecord[propertyJson.value];
	//var keyName = propertyJson.keyText;
	var finalValue = "";
	finalValue = value;

	if(finalValue.constructor == String){
  	finalValue=finalValue.toLowerCase();
  	finalValue=finalValue.capitalize();
	}
	console.log("getValue -- "+finalValue);
	callback(finalValue);
	},
  sentenceCase : function(scrappedRecord, propertyJson, callback) {
    var value = scrappedRecord[propertyJson.value];
    var finalValue = "";
  	finalValue = value;
    if(finalValue.constructor == String){
      function sentenceCaseFunc(input, lowercaseBefore) {
         input = ( input === undefined || input === null ) ? '' : input;
         if (lowercaseBefore) { input = input.toLowerCase(); }
         return input.toString().replace( /(^|\. *)([a-z])/g, function(match, separator, char) {
             // return separator + char.toUpperCase();
         return match.toUpperCase();
         });
      }
      finalValue=sentenceCaseFunc(finalValue,true)
  	}
  	console.log("getValue -- "+finalValue);
  	callback(finalValue);

  },
	addText : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	var text = propertyJson.text;
	if(value.constructor == String){
	callback(value+text);
	}else{
	callback(value);
	}


	},
	addTextAtBegining : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	var text = propertyJson.text;
	if(value.constructor == String){
	callback(text+value);
	}else{
	callback(value);
	}


	}
}

exports.processRecord = processRecord;

/*
 * function updateFields(scrappedRecord,propertyJson){
 * console.log("::::::::::::::::::::::") console.log(scrappedRecord)
 * if(propertyJson.hasOwnProperty('updatedFields')){ var keys =
 * Object.keys(propertyJson['updatedFields']); console.log("....."+keys) for(var
 * i=0;i<keys.length;i++){ scrappedRecord[keys[i]] =
 * propertyJson['updatedFields'][keys[i]]; } } }
 */

/*
 * function fillPropertiesWithDefaultStructure(record, schema){
 *
 * var props = Object.keys(schema['@properties']);
 *
 * for(var prop in props){ record[prop]=""; }
 *
 * return record;
 *  }
 *
 *
 *
 *
 * function generateMeta(record){ return (Manufacturer.name+" "+record.name+"
 * "+(record.mfrProductNo?record.mfrProductNo:""));//update fields manually }
 *
 * function generateImages(imageUrl,type,record){ var productImages=[]; var
 * flag=false; for(var i=0;i<imageUrl.length;i++){ var id=global.guid(); var
 * temp={ "cloudinaryId":id, "imageName":id , // "caption":
 * record?generateMeta(record):"", "url": imageUrl[i] }; if(type=="image"){
 * productImages.push({ "produtImages": [temp], "variant": "" }); }else{
 * productImages.push(temp); } } return productImages; }
 *
 *
 *
 *
 * var fillValueBasedOnDataType = {
 *
 * formula:function(property, record, schema){ } };
 */

/**
 * Utility functions
 *
 *
 */
var Utility = {
	guid : (function() {
	function s4() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16)
	.substring(1);
	}
	return function() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-'
	+ s4() + s4() + s4();
	};
	})(),
	getDate : function() {
	var today = new Date();
	today
	.setMinutes(today.getMinutes()
	+ (today.getTimezoneOffset() + 330));
	var dd = today.getDate();
	var mm = today.getMonth() + 1; // January is 0!
	var hours = today.getHours();
	var minutes = today.getMinutes();
	var yyyy = today.getFullYear();
	var seconds = today.getSeconds();
	if (dd < 10) {
	dd = '0' + dd;
	}
	if (mm < 10) {
	mm = '0' + mm;
	}
	if (hours < 10) {
	hours = '0' + hours;
	}
	if (minutes < 10) {
	minutes = '0' + minutes;
	}
	if (seconds < 10) {
	seconds = '0' + seconds;
	}
	// var date = dd + "/" + mm + "/" + yyyy;
	var date = yyyy + "/" + mm + "/" + dd;
	var time = hours + ":" + minutes + ":" + seconds;
	return date + " " + time + " GMT+0530";
	},
	clone : function(i) {
	var w = {};
	for ( var v in i) {
	w[v] = (i[v]);
	}
	return w;
	}

}

/**
 *
 *
 * DBUtility functions
 *
 */
function getSchemaAndDependentSchema(callback) {
	var schema = dataParseTemplate.Schema;
	var dependentSchema = dataParseTemplate.DependentSchema;
	cbMasterBucket.get(schema, function(err, res) {
	if (err) {
	getSchemaAndDependentSchema(callback);
	} else {
	var value = res.value;
	allSchemas[schema] = value;
	if(dependentSchema){
	getDependentSchema(dependentSchema, callback);
	}else{
	callback();
	}

	}
	});

}
function getDependentSchema(dependentSchema, callback) {
	cbMasterBucket.get(dependentSchema, function(err, res) {
	if (err) {
	console.log(err);
	callback();
	} else {
	var value = res.value;
	allSchemas[dependentSchema] = value;
	callback();
	}

	});
}

function saveRecord(record, callback) {
	if (cbContentBucket.connected) {
	cbContentBucket.upsert(record["recordId"], record,
	function(err, result) {
	if (err) {
	console.log(err + "--" + "--");
	// callback({"productIds":productIds,"message":"Error at
	// creation in
	// "+(productIndex+1),"error":true,"index":productIndex});
	callback(record, false, err);
	} else {
	//fs.appendFile(__dirname+"/records/uploadedRecs_"+(process.fileName)+".json","\n"+(JSON.stringify(record.recordId))+",", function(){});
	console.log("Success " + record["recordId"]);
	callback(record, true);
	// productIds.push(record["recordId"]);
	// createProduct(productIndex+1,callback);
	}
	});
	} else {
	console.log("We are not connected to DB...Plzzz re try");
	callback(record, false);
	}
}
var ColorGroups={
  "Pink": [
    {
      "hex": "#FFC0CB",
      "name": "Pink",
      "hsl": [
        350,
        100,
        87.6
      ]
    },
    {
      "hex": "#FFB6C1",
      "name": "LightPink",
      "hsl": [
        351,
        100,
        85.7
      ]
    },
    {
      "hex": "#FF69B4",
      "name": "HotPink",
      "hsl": [
        330,
        100,
        70.6
      ]
    },
    {
      "hex": "#FF1493",
      "name": "DeepPink",
      "hsl": [
        328,
        100,
        53.9
      ]
    },
    {
      "hex": "#DB7093",
      "name": "PaleVioletRed",
      "hsl": [
        340,
        59.8,
        64.9
      ]
    },
    {
      "hex": "#C71585",
      "name": "MediumVioletRed",
      "hsl": [
        322,
        80.9,
        43.1
      ]
    }
  ],
  "Purple": [
    {
      "hex": "#E6E6FA",
      "name": "Lavender",
      "hsl": [
        240,
        66.7,
        94.1
      ]
    },
    {
      "hex": "#D8BFD8",
      "name": "Thistle",
      "hsl": [
        300,
        24.3,
        79.8
      ]
    },
    {
      "hex": "#DDA0DD",
      "name": "Plum",
      "hsl": [
        300,
        47.3,
        74.7
      ]
    },
    {
      "hex": "#DA70D6",
      "name": "Orchid",
      "hsl": [
        302,
        58.9,
        64.7
      ]
    },
    {
      "hex": "#EE82EE",
      "name": "Violet",
      "hsl": [
        300,
        76.1,
        72.2
      ]
    },
    {
      "hex": "#FF00FF",
      "name": "Magenta",
      "hsl": [
        300,
        100,
        50
      ]
    },
    {
      "hex": "#BA55D3",
      "name": "MediumOrchid",
      "hsl": [
        288,
        58.9,
        58
      ]
    },
    {
      "hex": "#9932CC",
      "name": "DarkOrchid",
      "hsl": [
        280,
        60.6,
        49.8
      ]
    },
    {
      "hex": "#9400D3",
      "name": "DarkViolet",
      "hsl": [
        282,
        100,
        41.4
      ]
    },
    {
      "hex": "#8A2BE2",
      "name": "BlueViolet",
      "hsl": [
        271,
        75.9,
        52.7
      ]
    },
    {
      "hex": "#8B008B",
      "name": "DarkMagenta",
      "hsl": [
        300,
        100,
        27.3
      ]
    },
    {
      "hex": "#800080",
      "name": "Purple",
      "hsl": [
        300,
        100,
        25.1
      ]
    },
    {
      "hex": "#9370DB",
      "name": "MediumPurple",
      "hsl": [
        260,
        59.8,
        64.9
      ]
    },
    {
      "hex": "#7B68EE",
      "name": "MediumSlateBlue",
      "hsl": [
        249,
        79.8,
        67.1
      ]
    },
    {
      "hex": "#6A5ACD",
      "name": "SlateBlue",
      "hsl": [
        248,
        53.5,
        57.8
      ]
    },
    {
      "hex": "#483D8B",
      "name": "DarkSlateBlue",
      "hsl": [
        248,
        39,
        39.2
      ]
    },
    {
      "hex": "#663399",
      "name": "RebeccaPurple",
      "hsl": [
        270,
        50,
        40
      ]
    },
    {
      "hex": "#4B0082",
      "name": "Indigo ",
      "hsl": [
        275,
        100,
        25.5
      ]
    }
  ],
  "Red": [
    {
      "hex": "#FFA07A",
      "name": "LightSalmon",
      "hsl": [
        17,
        100,
        73.9
      ]
    },
    {
      "hex": "#FA8072",
      "name": "Salmon",
      "hsl": [
        6,
        93.2,
        71.4
      ]
    },
    {
      "hex": "#E9967A",
      "name": "DarkSalmon",
      "hsl": [
        15,
        71.6,
        69.6
      ]
    },
    {
      "hex": "#F08080",
      "name": "LightCoral",
      "hsl": [
        0,
        78.9,
        72.2
      ]
    },
    {
      "hex": "#CD5C5C",
      "name": "IndianRed ",
      "hsl": [
        0,
        53.1,
        58.2
      ]
    },
    {
      "hex": "#DC143C",
      "name": "Crimson",
      "hsl": [
        348,
        83.3,
        47.1
      ]
    },
    {
      "hex": "#FF0000",
      "name": "Red",
      "hsl": [
        0,
        100,
        50
      ]
    },
    {
      "hex": "#B22222",
      "name": "FireBrick",
      "hsl": [
        0,
        67.9,
        41.6
      ]
    },
    {
      "hex": "#8B0000",
      "name": "DarkRed",
      "hsl": [
        0,
        100,
        27.3
      ]
    }
  ],
  "Orange": [
    {
      "hex": "#FFA500",
      "name": "Orange",
      "hsl": [
        39,
        100,
        50
      ]
    },
    {
      "hex": "#FF8C00",
      "name": "DarkOrange",
      "hsl": [
        33,
        100,
        50
      ]
    },
    {
      "hex": "#FF7F50",
      "name": "Coral",
      "hsl": [
        16,
        100,
        65.7
      ]
    },
    {
      "hex": "#FF6347",
      "name": "Tomato",
      "hsl": [
        9,
        100,
        63.9
      ]
    },
    {
      "hex": "#FF4500",
      "name": "OrangeRed",
      "hsl": [
        16,
        100,
        50
      ]
    }
  ],
  "Yellow": [
    {
      "hex": "#FFD700",
      "name": "Gold",
      "hsl": [
        51,
        100,
        50
      ]
    },
    {
      "hex": "#FFFF00",
      "name": "Yellow",
      "hsl": [
        60,
        100,
        50
      ]
    },
    {
      "hex": "#FFFFE0",
      "name": "LightYellow",
      "hsl": [
        60,
        100,
        93.9
      ]
    },
    {
      "hex": "#FFFACD",
      "name": "LemonChiffon",
      "hsl": [
        54,
        100,
        90.2
      ]
    },
    {
      "hex": "#FAFAD2",
      "name": "LightGoldenRodYellow",
      "hsl": [
        60,
        80,
        90.2
      ]
    },
    {
      "hex": "#FFEFD5",
      "name": "PapayaWhip",
      "hsl": [
        37,
        100,
        91.8
      ]
    },
    {
      "hex": "#FFE4B5",
      "name": "Moccasin",
      "hsl": [
        38,
        100,
        85.5
      ]
    },
    {
      "hex": "#FFDAB9",
      "name": "PeachPuff",
      "hsl": [
        28,
        100,
        86.3
      ]
    },
    {
      "hex": "#EEE8AA",
      "name": "PaleGoldenRod",
      "hsl": [
        55,
        66.7,
        80
      ]
    },
    {
      "hex": "#F0E68C",
      "name": "Khaki",
      "hsl": [
        54,
        76.9,
        74.5
      ]
    },
    {
      "hex": "#BDB76B",
      "name": "DarkKhaki",
      "hsl": [
        56,
        38.3,
        58
      ]
    }
  ],
  "Green": [
    {
      "hex": "#ADFF2F",
      "name": "GreenYellow",
      "hsl": [
        84,
        100,
        59.2
      ]
    },
    {
      "hex": "#7FFF00",
      "name": "Chartreuse",
      "hsl": [
        90,
        100,
        50
      ]
    },
    {
      "hex": "#7CFC00",
      "name": "LawnGreen",
      "hsl": [
        90,
        100,
        49.4
      ]
    },
    {
      "hex": "#00FF00",
      "name": "Lime",
      "hsl": [
        120,
        100,
        50
      ]
    },
    {
      "hex": "#32CD32",
      "name": "LimeGreen",
      "hsl": [
        120,
        60.8,
        50
      ]
    },
    {
      "hex": "#98FB98",
      "name": "PaleGreen",
      "hsl": [
        120,
        92.5,
        79
      ]
    },
    {
      "hex": "#90EE90",
      "name": "LightGreen",
      "hsl": [
        120,
        73.4,
        74.9
      ]
    },
    {
      "hex": "#00FA9A",
      "name": "MediumSpringGreen",
      "hsl": [
        157,
        100,
        49
      ]
    },
    {
      "hex": "#00FF7F",
      "name": "SpringGreen",
      "hsl": [
        150,
        100,
        50
      ]
    },
    {
      "hex": "#3CB371",
      "name": "MediumSeaGreen",
      "hsl": [
        147,
        49.8,
        46.9
      ]
    },
    {
      "hex": "#2E8B57",
      "name": "SeaGreen",
      "hsl": [
        146,
        50.3,
        36.3
      ]
    },
    {
      "hex": "#228B22",
      "name": "ForestGreen",
      "hsl": [
        120,
        60.7,
        33.9
      ]
    },
    {
      "hex": "#008000",
      "name": "Green",
      "hsl": [
        120,
        100,
        25.1
      ]
    },
    {
      "hex": "#006400",
      "name": "DarkGreen",
      "hsl": [
        120,
        100,
        19.6
      ]
    },
    {
      "hex": "#9ACD32",
      "name": "YellowGreen",
      "hsl": [
        80,
        60.8,
        50
      ]
    },
    {
      "hex": "#6B8E23",
      "name": "OliveDrab",
      "hsl": [
        80,
        60.5,
        34.7
      ]
    },
    {
      "hex": "#556B2F",
      "name": "DarkOliveGreen",
      "hsl": [
        82,
        39,
        30.2
      ]
    },
    {
      "hex": "#66CDAA",
      "name": "MediumAquaMarine",
      "hsl": [
        160,
        50.7,
        60.2
      ]
    },
    {
      "hex": "#8FBC8F",
      "name": "DarkSeaGreen",
      "hsl": [
        120,
        25.1,
        64.9
      ]
    },
    {
      "hex": "#20B2AA",
      "name": "LightSeaGreen",
      "hsl": [
        177,
        69.5,
        41.2
      ]
    },
    {
      "hex": "#008B8B",
      "name": "DarkCyan",
      "hsl": [
        180,
        100,
        27.3
      ]
    },
    {
      "hex": "#008080",
      "name": "Teal",
      "hsl": [
        180,
        100,
        25.1
      ]
    }
  ],
  "Cyan": [
    {
      "hex": "#00FFFF",
      "name": "Cyan",
      "hsl": [
        180,
        100,
        50
      ]
    },
    {
      "hex": "#E0FFFF",
      "name": "LightCyan",
      "hsl": [
        180,
        100,
        93.9
      ]
    },
    {
      "hex": "#AFEEEE",
      "name": "PaleTurquoise",
      "hsl": [
        180,
        64.9,
        81
      ]
    },
    {
      "hex": "#7FFFD4",
      "name": "Aquamarine",
      "hsl": [
        160,
        100,
        74.9
      ]
    },
    {
      "hex": "#40E0D0",
      "name": "Turquoise",
      "hsl": [
        174,
        72.1,
        56.5
      ]
    },
    {
      "hex": "#48D1CC",
      "name": "MediumTurquoise",
      "hsl": [
        178,
        59.8,
        55.1
      ]
    },
    {
      "hex": "#00CED1",
      "name": "DarkTurquoise",
      "hsl": [
        181,
        100,
        41
      ]
    }
  ],
  "Blue": [
    {
      "hex": "#5F9EA0",
      "name": "CadetBlue",
      "hsl": [
        182,
        25.5,
        50
      ]
    },
    {
      "hex": "#4682B4",
      "name": "SteelBlue",
      "hsl": [
        207,
        44,
        49
      ]
    },
    {
      "hex": "#B0C4DE",
      "name": "LightSteelBlue",
      "hsl": [
        214,
        41.1,
        78
      ]
    },
    {
      "hex": "#ADD8E6",
      "name": "LightBlue",
      "hsl": [
        195,
        53.3,
        79
      ]
    },
    {
      "hex": "#B0E0E6",
      "name": "PowderBlue",
      "hsl": [
        187,
        51.9,
        79.6
      ]
    },
    {
      "hex": "#87CEFA",
      "name": "LightSkyBlue",
      "hsl": [
        203,
        92,
        75.5
      ]
    },
    {
      "hex": "#87CEEB",
      "name": "SkyBlue",
      "hsl": [
        197,
        71.4,
        72.5
      ]
    },
    {
      "hex": "#6495ED",
      "name": "CornflowerBlue",
      "hsl": [
        219,
        79.2,
        66.1
      ]
    },
    {
      "hex": "#00BFFF",
      "name": "DeepSkyBlue",
      "hsl": [
        195,
        100,
        50
      ]
    },
    {
      "hex": "#1E90FF",
      "name": "DodgerBlue",
      "hsl": [
        210,
        100,
        55.9
      ]
    },
    {
      "hex": "#4169E1",
      "name": "RoyalBlue",
      "hsl": [
        225,
        72.7,
        56.9
      ]
    },
    {
      "hex": "#0000FF",
      "name": "Blue",
      "hsl": [
        240,
        100,
        50
      ]
    },
    {
      "hex": "#0000CD",
      "name": "MediumBlue",
      "hsl": [
        240,
        100,
        40.2
      ]
    },
    {
      "hex": "#00008B",
      "name": "DarkBlue",
      "hsl": [
        240,
        100,
        27.3
      ]
    },
    {
      "hex": "#000080",
      "name": "Navy",
      "hsl": [
        240,
        100,
        25.1
      ]
    },
    {
      "hex": "#191970",
      "name": "MidnightBlue",
      "hsl": [
        240,
        63.5,
        26.9
      ]
    }
  ],
  "Brown": [
    {
      "hex": "#FFF8DC",
      "name": "Cornsilk",
      "hsl": [
        48,
        100,
        93.1
      ]
    },
    {
      "hex": "#FFEBCD",
      "name": "BlanchedAlmond",
      "hsl": [
        36,
        100,
        90.2
      ]
    },
    {
      "hex": "#FFE4C4",
      "name": "Bisque",
      "hsl": [
        33,
        100,
        88.4
      ]
    },
    {
      "hex": "#FFDEAD",
      "name": "NavajoWhite",
      "hsl": [
        36,
        100,
        83.9
      ]
    },
    {
      "hex": "#F5DEB3",
      "name": "Wheat",
      "hsl": [
        39,
        76.7,
        83.1
      ]
    },
    {
      "hex": "#DEB887",
      "name": "BurlyWood",
      "hsl": [
        34,
        56.9,
        70
      ]
    },
    {
      "hex": "#D2B48C",
      "name": "Tan",
      "hsl": [
        34,
        43.7,
        68.6
      ]
    },
    {
      "hex": "#BC8F8F",
      "name": "RosyBrown",
      "hsl": [
        0,
        25.1,
        64.9
      ]
    },
    {
      "hex": "#F4A460",
      "name": "SandyBrown",
      "hsl": [
        28,
        87.1,
        66.7
      ]
    },
    {
      "hex": "#DAA520",
      "name": "GoldenRod",
      "hsl": [
        43,
        74.4,
        49
      ]
    },
    {
      "hex": "#B8860B",
      "name": "DarkGoldenRod",
      "hsl": [
        43,
        88.7,
        38.2
      ]
    },
    {
      "hex": "#CD853F",
      "name": "Peru",
      "hsl": [
        30,
        58.7,
        52.5
      ]
    },
    {
      "hex": "#D2691E",
      "name": "Chocolate",
      "hsl": [
        25,
        75,
        47.1
      ]
    },
    {
      "hex": "#808000",
      "name": "Olive",
      "hsl": [
        60,
        100,
        25.1
      ]
    },
    {
      "hex": "#8B4513",
      "name": "SaddleBrown",
      "hsl": [
        25,
        75.9,
        31
      ]
    },
    {
      "hex": "#A0522D",
      "name": "Sienna",
      "hsl": [
        19,
        56.1,
        40.2
      ]
    },
    {
      "hex": "#A52A2A",
      "name": "Brown",
      "hsl": [
        0,
        59.4,
        40.6
      ]
    },
    {
      "hex": "#800000",
      "name": "Maroon",
      "hsl": [
        0,
        100,
        25.1
      ]
    }
  ],
  "White": [
    {
      "hex": "#FFFFFF",
      "name": "White",
      "hsl": [
        0,
        0,
        100
      ]
    },
    {
      "hex": "#FFFAFA",
      "name": "Snow",
      "hsl": [
        0,
        100,
        99
      ]
    },
    {
      "hex": "#F0FFF0",
      "name": "HoneyDew",
      "hsl": [
        120,
        100,
        97.1
      ]
    },
    {
      "hex": "#F5FFFA",
      "name": "MintCream",
      "hsl": [
        150,
        100,
        98
      ]
    },
    {
      "hex": "#F0FFFF",
      "name": "Azure",
      "hsl": [
        180,
        100,
        97.1
      ]
    },
    {
      "hex": "#F0F8FF",
      "name": "AliceBlue",
      "hsl": [
        208,
        100,
        97.1
      ]
    },
    {
      "hex": "#F8F8FF",
      "name": "GhostWhite",
      "hsl": [
        240,
        100,
        98.6
      ]
    },
    {
      "hex": "#F5F5F5",
      "name": "WhiteSmoke",
      "hsl": [
        0,
        0,
        96.1
      ]
    },
    {
      "hex": "#FFF5EE",
      "name": "SeaShell",
      "hsl": [
        25,
        100,
        96.7
      ]
    },
    {
      "hex": "#F5F5DC",
      "name": "Beige",
      "hsl": [
        60,
        55.6,
        91.2
      ]
    },
    {
      "hex": "#FDF5E6",
      "name": "OldLace",
      "hsl": [
        39,
        85.2,
        94.7
      ]
    },
    {
      "hex": "#FFFAF0",
      "name": "FloralWhite",
      "hsl": [
        40,
        100,
        97.1
      ]
    },
    {
      "hex": "#FFFFF0",
      "name": "Ivory",
      "hsl": [
        60,
        100,
        97.1
      ]
    },
    {
      "hex": "#FAEBD7",
      "name": "AntiqueWhite",
      "hsl": [
        34,
        77.8,
        91.2
      ]
    },
    {
      "hex": "#FAF0E6",
      "name": "Linen",
      "hsl": [
        30,
        66.7,
        94.1
      ]
    },
    {
      "hex": "#FFF0F5",
      "name": "LavenderBlush",
      "hsl": [
        340,
        100,
        97.1
      ]
    },
    {
      "hex": "#FFE4E1",
      "name": "MistyRose",
      "hsl": [
        6,
        100,
        94.1
      ]
    }
  ],
  "Gray": [
    {
      "hex": "#DCDCDC",
      "name": "Gainsboro",
      "hsl": [
        0,
        0,
        86.3
      ]
    },
    {
      "hex": "#D3D3D3",
      "name": "LightGray",
      "hsl": [
        0,
        0,
        82.7
      ]
    },
    {
      "hex": "#C0C0C0",
      "name": "Silver",
      "hsl": [
        0,
        0,
        75.3
      ]
    },
    {
      "hex": "#A9A9A9",
      "name": "DarkGray",
      "hsl": [
        0,
        0,
        66.3
      ]
    },
    {
      "hex": "#696969",
      "name": "DimGray",
      "hsl": [
        0,
        0,
        41.2
      ]
    },
    {
      "hex": "#808080",
      "name": "Gray",
      "hsl": [
        0,
        0,
        50.2
      ]
    },
    {
      "hex": "#778899",
      "name": "LightSlateGray",
      "hsl": [
        210,
        14.3,
        53.3
      ]
    },
    {
      "hex": "#708090",
      "name": "SlateGray",
      "hsl": [
        210,
        12.6,
        50.2
      ]
    },
    {
      "hex": "#2F4F4F",
      "name": "DarkSlateGray",
      "hsl": [
        180,
        25.4,
        24.7
      ]
    },
    {
      "hex": "#000000",
      "name": "Black",
      "hsl": [
        0,
        0,
        0
      ]
    }
  ]
};

function rgbToHsl(r, g, b) {
	if( r=="" ) r=0;
	if( g=="" ) g=0;
	if( b=="" ) b=0;
	r = parseInt(r,16);
	g = parseInt(g,16);
	b = parseInt(b,16);
	if( r<0 ) r=0;
	if( g<0 ) g=0;
	if( b<0 ) b=0;
	if( r>255 ) r=255;
	if( g>255 ) g=255;
	if( b>255 ) b=255;
	hex = r*65536+g*256+b;
	hex = hex.toString(16,6);
	len = hex.length;
	if( len<6 )
		for(i=0; i<6-len; i++)
			hex = '0'+hex;
	r/=255;
	g/=255;
	b/=255;
	M = Math.max(r,g,b);
	m = Math.min(r,g,b);
	d = M-m;
	if( d==0 ) h=0;
	else if( M==r ) h=((g-b)/d)%6;
	else if( M==g ) h=(b-r)/d+2;
	else h=(r-g)/d+4;
	h*=60;
	if( h<0 ) h+=360;
	l = (M+m)/2;
	if( d==0 )
		s = 0;
	else
		s = d/(1-Math.abs(2*l-1));
	s*=100;
	l*=100;
	return [h.toFixed(0)*1,s.toFixed(1)*1,l.toFixed(1)*1];
}
function calcDistance(v1,v2){
	var dx = v1[0] - v2[0];
	var dy = v1[1] - v2[1];
	var dz = v1[2] - v2[2];
	return Math.sqrt( dx * dx + dy * dy + dz * dz );
}
function classify(hex){
	hex=hex.replace("#","");
	var hsl=rgbToHsl(hex.substr(0,2),hex.substr(2,2),hex.substr(4,2));
	var distance;
	var result;
	for(var group in ColorGroups){
		for(var colorIndex in ColorGroups[group]){
			if(!Array.isArray(ColorGroups[group][colorIndex].hsl)){
				var string=ColorGroups[group][colorIndex].hex.replace("#","");
				ColorGroups[group][colorIndex].hsl=rgbToHsl(string.substr(0,2),string.substr(2,2),string.substr(4,2));
			}
			var temp=calcDistance(hsl,ColorGroups[group][colorIndex].hsl);
			if(distance==undefined || temp<distance){
				distance=temp;
				result=ColorGroups[group][colorIndex];
				result.group=group;
			}
		}
	}
	return result;//{hex:"#aaaaaa",name:"dds",group:" "}
}





/**
 * Cloudinary API
 *
 *
 *
 */
function uploadToCloudinary(record, callback) {
	var productImages ;
	if(record.docType=="Product"){
	productImages = record["productImages"];
	}

	if(record.docType=="collection"){
	productImages = record["image"];
	}
	var attachments = record["attachments"];
	var allData = attachments?productImages.concat(attachments):productImages;

	//console.log(record);
	if (allData.length > 0) {
	addImagesToCloudinary(0);
	}else{
	callback(record);
	}

	function addImagesToCloudinary(index) {
		var url = "";
		var id = "";
		if (index >= allData.length) {
			callback(record);
		} else {
			if (allData[index].produtImages) {
				id = allData[index].produtImages[0].cloudinaryId;
				url = allData[index].produtImages[0].url;
			} else {
				id = allData[index].cloudinaryId;
				url = allData[index].url;
			}
			cloudinary.v2.uploader.upload(url,{"public_id" : id,"colors" : true}, function(err, result) {
				if (err) {
					console.log("Error occurred while uploading image at index "+ index+ " for record: "+ record['recordId']);
					// delete created images and attachments for
					// this product
					var dRecords = []
					for (var i = 0; i < index + 1; i++) {
						if (allData[index]) {
							if (allData[index].produtImages) {
								dRecords.push(allData[index].produtImages[index].cloudinaryId);
							} else {
								dRecords.push(allData[index].cloudinaryId);
							}
						}
					}
					cloudinary.v2.api.delete_resources(dRecords,function(error, result) {
						if (error) {
							console.log(error);
						} else {
							console.log(result);
						}
						// callback({"productIds":productIds,"message":"Error
						// at image uploading in
						// "+(productIndex+1)+"
						// at "+(index+1)+"
						// image or
						// attachment","index":productIndex,"error":true});
						addImagesToCloudinary(index + 1);
					});
				} else {
					console.log("after cloudinary", result);
					console.log(result.predominant);

					if(index==0 && allData[index].produtImages){
						if(record && record.dependentProperties && (record.dependentProperties.hasOwnProperty('color') || record.dependentProperties.hasOwnProperty('colorGroup')) ){
							record['dependentProperties']['predominant']=result.predominant;
							record['dependentProperties']['colors']=result.colors;
							try{
								if((result.colors[0][0]).indexOf("#")==0){
									var clr = classify(result.colors[0][0]);
									//{hex:"#aaaaaa",name:"dds",group:" "}
									record['dependentProperties']['color']=clr.hex+(clr.group?" "+clr.group:"")+(clr.name?" "+clr.name:"");
									console.log(classify(result.colors[0][0]));
									console.log("Color added");
								}else{
									console.log("# is missing");
								}

							}catch(e){
								console.log("Problem while classifying color");
							}


						}else{
							console.log("Color Ignored");
						}
					}
					//fs.appendFile(__dirname+"/images/uploadedImgs_"+(process.fileName)+".json","\n"+(JSON.stringify(result.public_id))+",", function(){});
					addImagesToCloudinary(index + 1);
				}
			});

		}/*
			 * else if(index+1 > allData.length){
			 *
			 *
			 * /*cbContentBucket.upsert(record["recordId"],record,function(err,
			 * result) { if (err) { console.log(err+"--"+"--"+productIndex);
			 * callback({"productIds":productIds,"message":"Error at creation in
			 * "+(productIndex+1),"error":true,"index":productIndex}); }else{
			 * console.log("Success "+record["recordId"]+"--"+productIndex);
			 * productIds.push(record["recordId"]);
			 * createProduct(productIndex+1,callback); } })/ }
			 */
	}
}

/*
 * var test = [ { "name": "Time 300 - 0913", "sourceUrl":
 * "https://kvadrat.dk/products/time-300?colorway=0913", "productImages": [
 * "https://static.kvadrat.dk/assets/images/collection/fabric/1536/f-5293-c0913.jpg",
 * "https://static.kvadrat.dk/assets/images/collection/3d-shapes/medium/3ds-5293-c0913-w24-closed.jpg" ],
 * "mfrProductNo": "0913", "specifications": "Specifications\nNameTime 300 -
 * 0913\nDesignerE.O. J??nsen, Aggebo &
 * Henriksen\nTypeCurtains\nPatternSolid\nComposition100% Trevira CS\nWeight580
 * g/lin.m\nWidth300 cm\nPillingNone\nLightfastness7\nSustainabilityReduced
 * environmental impact\nCare\n", "care": "Fire resistant,No dryer,No
 * chlorine,Clean,Wash 50 dg. care,Ironing temperature 2", "attachments":
 * "https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-sas-nzs-1530-3.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-bs-5867-part-2-type-b.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-sdin-4102-b1.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-sen-13-773-class-1.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-snf-p-92-507-m1.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-ssn-198-898-5-2.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-uni-9177-classe-1.pdf,https://static.kvadrat.dk/assets/pdf/collection/fire/a4/b-5293-simo-ftp-code-2010-part-7.pdf,https://static.kvadrat.dk/assets/pdf/collection/technical-requirements/a4/t-5293-stechnical-specifications.pdf,https://static.kvadrat.dk/assets/pdf/collection/product-description/a4/h-5293-sstory-text.pdf,https://static.kvadrat.dk/assets/pdf/collection/lightfastness/a4/l-5293-slightfastness.pdf,https://static.kvadrat.dk/assets/pdf/collection/sound-air/a4/s-5293-ssound-absorbtion.pdf",
 * "flammability": "AS/NZS 1530.3", "abrasionResistance":
 * "Certificates\nLightfastness\nSound Absorption and Airflow\n", "martindale":
 * "Width300 cm", "material": "Composition100% Trevira CS", "pattern":
 * "PatternSolid", "use": "TypeCurtains" } ]
 */

/*
var test ="";
var savedRecs=[];
var date=new Date();
var fileName =  ""+date.getFullYear()+"_"+(date.getMonth()+1)+"_"+date.getDate()+"_"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()+"_"+date.getMilliseconds();

fs.readFile(__dirname+"/output/kvadrat_rugs.json", function(err, res){
	if(!err){
	test = JSON.parse(res.toString());
	temp(0);
	}else{
	console.log(err);
	console.log("unable to find file");
	}
});


function temp(a){
	if(a<test.length){
	var record = test[a];
	processRecord([record],function(newRec){
	console.log("------------------------------");
	console.log("------ "+a+"-------");
	console.log(newRec);
	savedRecs.push(newRec);
	console.log("------------------------------");
	temp(a+1);
	});
	}else{
	fs.appendFile(__dirname+"/output/uploadedRecords_VSK_"+(fileName)+".json","\n"+(JSON.stringify(savedRecs)), function(){});
	console.log("process done");
	return;
	}
}

*/







function checkForRecord(scrappedRec, callback){
	if(dataParseTemplate.checkForRecord){
	var mfrProductNo=scrappedRec.mfrProductNo;
	mfrProductNo = mfrProductNo?mfrProductNo.trim():mfrProductNo;

	cbContentBucket.query(N1qlQuery.fromString("SELECT * FROM records WHERE `Manufacturer`='Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7' AND `mfrProductNo`='"+mfrProductNo+"'"), function(err, res){
	if(err){
	console.log(err);
	callback(err);
	}
	if(res!=""){
	if(res[0] && res[0].records){
	console.log("**************************************************************************************************");
	console.log("Record found for mfrProductNo: "+mfrProductNo);
	console.log("***************************************************************************************************");
	callback(res[0].records, true);
	}else{
	callback(res, false);
	}

	}

	if(res==""){
	console.log("record not found for mfrProductNo: "+mfrProductNo);
	callback(scrappedRec, false);
	}

	});
	}else{

	callback(scrappedRec, false);

	}

}


/*
var foundList=[];
var newProds=[];

function checkList(listInd){
	console.log("Index: "+listInd);
	if(listInd<links.length){
	var rec = links[listInd];
	var mfrProductNo = (rec["pList-href"]).match(/\-[0-9A-Z]{4,}/g);
	if(mfrProductNo.constructor == Array){
	mfrProductNo=mfrProductNo[0];
	}
	mfrProductNo = mfrProductNo.trim();
	mfrProductNo = mfrProductNo.replace("-", "");
	checkForRecord(mfrProductNo, function(res, isFound){
	 checkList(listInd+1);
	})
	}else{
	console.log("OVer");
	}
}


function checkForRecord(mfrProductNo, callback){

	cbContentBucket.query(N1qlQuery.fromString("SELECT * FROM records WHERE `Manufacturer`='Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7' AND `mfrProductNo`='"+mfrProductNo+"'"), function(err, res){
	if(err){
	console.log(err);
	callback(err);
	}
	if(res!=""){
	if(res[0] && res[0].records){
	console.log("**************************************************************************************************");
	console.log("Record found for mfrProductNo: "+mfrProductNo);
	console.log("***************************************************************************************************");
	foundList.push(mfrProductNo);
	callback(res[0].records, true);
	}else{
	console.log("Prob Record found for mfrProductNo: "+mfrProductNo);
	newProds.push(mfrProductNo);
	callback(res, false);
	}

	}

	if(res==""){
	newProds.push(mfrProductNo);
	console.log("record not found for mfrProductNo: "+mfrProductNo);
	callback(mfrProductNo, false);
	}

	});
}


*/
///cbContentBucket.query(N1qlQuery.fromString("SELECT * FROM records WHERE `Manufacturer`='Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7' AND `mfrProductNo` IN  "+mfrNos+" "), function(err, res){
