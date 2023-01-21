/**
 * @author - Vikram
 */
var genericView = require("../view/genericView.jsx");
var SchemaStore = require("../../stores/SchemaStore.js");
var DefinitionStore = require("../../stores/DefinitionStore.js");
var global = require("../../utils/global.js");
var endPoints = require("../../endPoints.js");
var APIEndPoint=endPoints.apiServerAddress || "";

function getSummaryLink(data) {
  data.filters = global.cleanFilters(data.filters);
  var schema = SchemaStore.get(data.schema);
  if (
    typeof schema != "undefined" &&
    data.dependentSchema &&
    typeof SchemaStore.get(data.schema + "-" + data.dependentSchema) !=
      "undefined"
  ) {
    schema = genericView.combineSchemas(
      schema,
      SchemaStore.get(data.schema + "-" + data.dependentSchema)
    );
  }
  var urlName = "";
  if (schema) {
    urlName = (schema["@displayName"]
    ? schema["@displayName"]
    : schema.displayName)
      ? schema["@displayName"]
        ? schema["@displayName"]
        : schema.displayName
      : schema["@id"] + "s";
  }
  urlName = urlName.replace(/\s/g, "");
  //var link="/s/"+data.org+"/"+data.schema;

  if (
    schema &&
    schema["@uniqueUserName"] &&
    schema.navFilters &&
    (!data.org || data.org == "public")
  ) {
    if (typeof schema.navFilters == "object") {
      for (var key in schema.navFilters) {
        //if(JSON.stringify(data.filters)==JSON.stringify(global.cleanFilters(schema.navFilters[key].filters))){
        if (
          global.filtersComparison(
            data.filters,
            global.cleanFilters(schema.navFilters[key].filters)
          )
        ) {
          var uniqueLink = "/" + schema["@uniqueUserName"];
          if (key != "default") {
            uniqueLink += "/" + key;
          }
          if (data.skip && !isNaN(data.skip) && data.skip != 0) {
            uniqueLink += "?page=" + (data.skip / global.summaryLimitCount + 1);
          }
          return uniqueLink;
        }
      }
    }
  }

  var link = "/s/" + urlName + "/" + data.schema;
  var query = "";
  if (data.dependentSchema && data.dependentSchema != "") {
    query += "ds=" + data.dependentSchema;
  }
  if (
    data.filters &&
    typeof data.filters == "object" &&
    Object.keys(data.filters).length > 0
  ) {
    query += "&flts=" + encodeURIComponent(JSON.stringify(data.filters));
  }
  if (data.skip && !isNaN(data.skip)) {
    query += "&skp=" + data.skip;
  }
  if (data.limit && !isNaN(data.limit)) {
    query += "&lmt=" + data.limit;
  }
  if (data.org && data.org != "public") {
    query += "&org=" + data.org;
  }
  if (data.sortBy) {
    query += "&by=" + data.sortBy;
  }
  if (data.sortOrder) {
    query += "&order=" + data.sortOrder;
  }
  if (query == "") {
    return link;
  } else {
    return link + "?" + query;
  }
}
exports.getSummaryLink = getSummaryLink;

function defaultSummaryLink(data) {
  var schema = SchemaStore.get(data.schema);
  if (
    typeof schema != "undefined" &&
    data.dependentSchema &&
    typeof SchemaStore.get(data.schema + "-" + data.dependentSchema) !=
      "undefined"
  ) {
    schema = genericView.combineSchemas(
      schema,
      SchemaStore.get(data.schema + "-" + data.dependentSchema)
    );
  }
  var urlName = "";
  if (schema) {
    urlName = (schema["@displayName"]
    ? schema["@displayName"]
    : schema.displayName)
      ? schema["@displayName"]
        ? schema["@displayName"]
        : schema.displayName
      : schema["@id"] + "s";
  }
  urlName = urlName.replace(/\s/g, "");

  if (
    schema &&
    schema["@uniqueUserName"] &&
    schema.navFilters &&
    (!data.org || data.org == "public")
  ) {
    if (typeof schema.navFilters == "object") {
      if (typeof schema.navFilters.default == "object") {
        return "/" + schema["@uniqueUserName"];
      }
    }
  }

  var link = "/s/" + urlName + "/" + data.schema;
  var query = "";
  if (data.dependentSchema && data.dependentSchema != "") {
    query += "ds=" + data.dependentSchema;
  }
  if (data.org && data.org != "public") {
    query += "&org=" + data.org;
  }
  if (query == "") {
    return link;
  } else {
    return link + "?" + query;
  }
}
exports.defaultSummaryLink = defaultSummaryLink;

function getDetailLink(data) {
  if (!data.org) {
    data.org = "public";
  }
  if (data.record && data.record["@uniqueUserName"] && data.org == "public") {
    return "/" + data.record["@uniqueUserName"].toLowerCase();
  }

  var schema = SchemaStore.get(data.schema);
  if (
    schema &&
    data.dependentSchema &&
    SchemaStore.get(data.schema + "-" + data.dependentSchema)
  ) {
    schema = genericView.combineSchemas(
      schema,
      SchemaStore.get(data.schema + "-" + data.dependentSchema)
    );
  }
  var urlName = "";
  if (schema) {
    urlName = (schema["@displayName"]
    ? schema["@displayName"]
    : schema.displayName)
      ? schema["@displayName"]
        ? schema["@displayName"]
        : schema.displayName
      : schema["@id"] + "s";
  }

  var identifier = "";
  if (
    data.record &&
    schema &&
    schema["@identifier"] &&
    data.record[schema["@identifier"]] &&
    typeof data.record[schema["@identifier"]] == "string"
  ) {
    identifier = data.record[schema["@identifier"]];
    identifier = identifier.replace(/\W/g, "").substring(0, 50);
  } else {
    identifier = data.recordId ? data.recordId : "";
  }
  if (!identifier) {
    identifier = "__";
  }

  urlName += "/" + identifier;
  urlName = urlName.replace(/\s/g, "");

  //var link="/d/"+data.org+"/"+data.schema+"/"+data.recordId;
  var link = "/d/" + urlName + "/" + data.recordId;
  var query = "";
  if (data.dependentSchema && data.dependentSchema != "") {
    query += "ds=" + data.dependentSchema;
  }
  /*if(data.filters && data.filters!=null && typeof data.filters=="object" && Object.keys(data.filters).length>0){
		query+="&flts="+encodeURIComponent(JSON.stringify(data.filters));
	}*/
  if (data.org && data.org != "public") {
    if (query == "") {
      query += "org=" + data.org;
    } else {
      query += "&org=" + data.org;
    }
  }
  if (data.schema) {
    if (query == "") {
      query += "s=" + data.schema;
    } else {
      query += "&s=" + data.schema;
    }
  }
  if (query == "") {
    return link;
  } else {
    return link + "?" + query;
  }
}
exports.getDetailLink = getDetailLink;

function getLandingLink(data) {
  var link = "/";
  var query = "";
  if (data.landingPage && data.landingPage != "") {
    query += "l=" + data.landingPage;

    var lpd = DefinitionStore.get(data.landingPage);
    if (lpd && lpd["@uniqueUserName"]) {
      return "/" + lpd["@uniqueUserName"].toLowerCase();
    }
  }
  if (query == "") {
    return link;
  } else {
    return link + "?" + query;
  }
}
exports.getLandingLink = getLandingLink;

function getCOELink(data) {
  var link =
    "/coe/" +
    data.org +
    "/" +
    data.schema +
    "/" +
    "?data=" +
    encodeURIComponent(JSON.stringify(data.coeData));
  return link;
}
exports.getCOELink = getCOELink;

function getMyProjectsLink(data) {
  var link = "/myprojects";
  if (data.org) {
    link += "?org=" + data.org;
    if (data.schema) {
      link += "&schema=" + data.schema;
    }
    if (data.dependentSchema) {
      link += "&ds=" + data.dependentSchema;
    }
  }
  return link;
}
exports.getMyProjectsLink = getMyProjectsLink;

function getMyFirmsLink(data) {
  var link = "/myfirms";
  if (data.org) {
    link += "?org=" + data.org;
    if (data.schema) {
      link += "&schema=" + data.schema;
    }
    if (data.dependentSchema) {
      link += "&ds=" + data.dependentSchema;
    }
  }
  return link;
}
exports.getMyFirmsLink = getMyFirmsLink;

function getAdvancedSearchLink(data) {
  var link = "/advsrch/" + data.org + "/" + data.schema;
  if (data.dependentSchema && data.dependentSchema != "") {
    query += "ds=" + data.dependentSchema;
  }
  if (query == "") {
    return link;
  } else {
    return link + "?" + query;
  }
}
exports.getAdvancedSearchLink = getAdvancedSearchLink;

function getSearchLink(data) {
  if (data.mobile) {
    return "/discover/" + data.text + "?mobile=true";
  } else {
    return "/discover/" + data.text;
  }
}
exports.getSearchLink = getSearchLink;
function getPDFLink(data) {
    var link=APIEndPoint+"/getPDF/" + data.recordId;
    if(data.preview){
    	link+="?preview=true";
    }
    return link;
}
exports.getPDFLink = getPDFLink;

function getPageNotFoundLink(data) {
  return "/views/pageNotFound";
}
exports.getPageNotFoundLink = getPageNotFoundLink;
function getGroupViewLink(data) {
  var params = "";
  if (
    Array.isArray(data.key) &&
    Array.isArray(data.keyMap) &&
    data.key.length == data.keyMap.length
  ) {
    for (var index in data.key) {
      params += "" + data.keyMap[index] + "=" + data.key[index] + "&";
    }
  }
  params = params.replace(/&$/, "");

  if (data.org && data.org != "public") {
    params += "&org=" + data.org;
  }

  var link =
    "/gv/" +
    data.schema +
    "/" +
    data.viewName +
    "/" +
    data.displayName.replace(/\s/g, "");
  if (params != "") {
    link += "?" + params;
  }
  return link;
}
exports.getGroupViewLink = getGroupViewLink;
