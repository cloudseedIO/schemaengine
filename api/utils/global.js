var limitCount=24;
var summaryLimitCount=24;
var emailFormate=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
exports.emailFormate=emailFormate;
exports.limitCount=limitCount;
exports.summaryLimitCount=summaryLimitCount;
exports.auditLimitCount=30;
var guid = (function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return function() {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
	};
})();
exports.guid=guid;

function getDate(){
	var today = new Date();
	today.setMinutes ( today.getMinutes() + (today.getTimezoneOffset()+330) );
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var hours = today.getHours();
	var minutes=today.getMinutes();
	var yyyy = today.getFullYear();
	var seconds =today.getSeconds();
	if(dd<10){dd='0'+dd;} if(mm<10){mm='0'+mm;} if(hours<10){hours='0'+hours;} if(minutes<10){minutes='0'+minutes;} if(seconds<10){seconds='0'+seconds;}
	//var date = dd + "/" + mm + "/" + yyyy;
	var date = yyyy + "/" + mm + "/" + dd;
	var time = hours + ":" + minutes + ":" + seconds;
	return date+" "+time+" GMT+0530";
}
exports.getDate=getDate;
//'28/08/2017 16:36:29 IST'
function getTimeZone(){
	var timeZone=new Date().toString().match(/\(([A-Za-z\s].*)\)/)[1];
	if(timeZone.split(" ").length>1){
		timeZone=timeZone.split(" ").map(function(str){return str[0]}).join("");
		
	}
	return timeZone;
}
function getLocaleDateString(dateString){
	try{
		var year=dateString.split(" ")[0].split("/")[2];
		var month=dateString.split(" ")[0].split("/")[1]-1;
		var date=dateString.split(" ")[0].split("/")[0];
		var hours=dateString.split(" ")[1].split(":")[0];
		var minutes=dateString.split(" ")[1].split(":")[1];
		var seconds=0;
		if(year.length==2 && date.length==4){
			var temp=date;
			date=year;
			year=temp;
		}
		try{
			seconds=dateString.split(" ")[1].split(":")[2];
		}catch(err){}
		
		var today=new Date(year, month, date, hours?hours:0, minutes?minutes:0, seconds?seconds:0);
		today.setMinutes ( today.getMinutes() - (today.getTimezoneOffset()+330));
		return today.toString().substr(0,24)+" "+getTimeZone();
	}catch(err){
		return dateString
	}
}
exports.getLocaleDateString=getLocaleDateString;

function makeHeader(doc,header,forRelations){
	if(doc.record_header  && !forRelations){
		return doc.record_header;
	}
	if(typeof doc=="object" && 
		doc!=null && 
		Array.isArray(header) &&
		header.length>0){
			var hs="";
			for(var i=0;i<header.length;i++){
				if(header[i].indexOf("this")==0){
					if(doc[header[i].split(".")[1]]!=undefined){
						if(typeof doc[header[i].split(".")[1]]=="object"){
							if(header[i].split(".").length>2){
								if(doc[header[i].split(".")[1]][header[i].split(".")[2]]!=undefined)
								hs+=doc[header[i].split(".")[1]][header[i].split(".")[2]]+" ";
							}
						}else if(header[i].split(".").length==2){
							hs+=doc[header[i].split(".")[1]]+" ";
						}
					}
				}else{
					hs+=header[i]+" ";
				}
			}
			return hs.trim();
		}else{
			return "";
		}
}

exports.makeHeader=makeHeader;

function formGroupDetailRawData(group,record){
	var groupDetails={};
	try{
		groupDetails=Object.assign({},group);
	}catch(err){}
	if(group.key){
        if(Array.isArray(group.key)){
			var currentFKeys=group.key;
        	var currentValues=[];
        	for(var srfi=0;srfi<currentFKeys.length;srfi++){
        		if(currentFKeys[srfi].indexOf("this")==0){
					if(currentFKeys[srfi].split("this.")[1]=="recordId"){
    					currentValues.push(record.recordId);
    				}else{
    					currentValues.push(record[currentFKeys[srfi].split("this.")[1]]);
    				}			        			
        		}else{
        			currentValues.push(currentFKeys[srfi]);
        		}
        	}
			groupDetails.key=currentValues;
        }
  	}
	return groupDetails;
}
exports.formGroupDetailRawData=formGroupDetailRawData;

function cleanFilters(filters){
	if(filters==undefined){
		return undefined;
	}else if(typeof filters=="object"){
		if(Object.keys(filters).length==0){
			return undefined;
		}else{
			var newFilters={};
			for(var key in filters){
				if(Array.isArray(filters[key]) && 
						filters[key].length>0){
					var newValues=filters[key].filter(function(val){if(val!="" && val!="NA"){return true}else{return false}});
					if(newValues.length>0)
					newFilters[key]=newValues;
				}
			}
			if(Object.keys(newFilters).length==0){
				return undefined;
			}else{
				return newFilters;
			}
		}
	}
}
exports.cleanFilters=cleanFilters;



function combineSchemas(schema,subSchema){
	if(typeof subSchema.displayName !="undefined"){
		schema.displayName=subSchema.displayName;
	}
	if(typeof subSchema["@displayName"] !="undefined"){
		schema["@displayName"]=subSchema["@displayName"];
	}
	if(typeof subSchema["globalIndex"] !="undefined"){
		schema["globalIndex"]=subSchema["globalIndex"];
	}
	if(typeof subSchema["@prompt"] !="undefined"){
		schema["@prompt"]=subSchema["@prompt"];
	}
	if(typeof subSchema["@filterKeys"] !="undefined"  &&  subSchema["@filterKeys"].length>0){
		schema["@filterKeys"]=subSchema["@filterKeys"];
	}
	if(typeof subSchema["@views"] !="undefined"  &&  Object.keys(subSchema["@views"]).length>0){
		schema["@views"]=subSchema["@views"];
	}
	if(typeof subSchema["@operations"]  !="undefined"  &&  Object.keys(subSchema["@operations"]).length>0){
		schema["@operations"]=subSchema["@operations"];
	}
	//try{schema["@operations"].update.Edit.update.push(requestbody.dependentSchema)}catch(err){console.log("push error");};
	//relations
	if(typeof subSchema["@relations"]  !="undefined"  &&  Object.keys(subSchema["@relations"]).length>0){
		schema["@relations"]=subSchema["@relations"];
	}
	if(typeof subSchema["@navViews"]  !="undefined"  &&  Object.keys(subSchema["@navViews"]).length>0){
		schema["@navViews"]=subSchema["@navViews"];
	}
	if(typeof subSchema["@state"]  !="undefined"  &&  Object.keys(subSchema["@state"]).length>0){
		schema["@state"]=subSchema["@state"];
	}
	if(typeof subSchema["@showRelated"]  !="undefined"  &&  Object.keys(subSchema["@showRelated"]).length>0){
		schema["@showRelated"]=subSchema["@showRelated"];
	}
	//Assinging dependent schema properties to the top schema
	if(typeof subSchema["@properties"] == "object"){
		for(var key in subSchema["@properties"]){
			var derivedProperty=false;
			if(!schema["@properties"][key]){
				derivedProperty=true;
			}
			schema["@properties"][key]=subSchema["@properties"][key];
			schema["@properties"][key].derivedProperty=derivedProperty;
		}
	}
	if(typeof subSchema["@recordNav"]  !="undefined"  &&  Object.keys(subSchema["@recordNav"]).length>0){
		schema["@recordNav"]=subSchema["@recordNav"];
	}
	if(typeof subSchema["@groups"]  !="undefined"  &&  Object.keys(subSchema["@groups"]).length>0){
		schema["@groups"]=subSchema["@groups"];
	}
	if(typeof subSchema["@variant"] !="undefined"){
		schema["@variant"]=subSchema["@variant"];
	}
	if(typeof subSchema["@derivedId"] !="undefined"){
		schema["@derivedId"]=subSchema["@derivedId"];
	}
	if(typeof subSchema["htmlMeta"]!="undefined"){
		schema["htmlMeta"]=subSchema["htmlMeta"];
	}
	if(typeof subSchema["@uniqueUserName"]!="undefined"){
		schema["@uniqueUserName"]=subSchema["@uniqueUserName"];
	}
	if(typeof subSchema["navFilters"]!="undefined"){
		schema["navFilters"]=subSchema["navFilters"];
	}
	if(typeof subSchema["@footerText"]!="undefined"){
		schema["@footerText"]=subSchema["@footerText"];
	}
	if(typeof subSchema["webCrawlerIndex"]!="undefined"){
		schema["webCrawlerIndex"]=subSchema["webCrawlerIndex"];
	}
	if(typeof subSchema.cloudPointHostId != "undefined"){
		schema.cloudPointHostId=subSchema.cloudPointHostId;
	}
	return schema;
}

exports.combineSchemas=combineSchemas;

function filtersComparison(f1,f2){
	if(f1==undefined && f2==undefined){
		return true;
	}else if(f1==undefined || f2==undefined){
		return false;
	}else if(typeof f1!="object" || typeof f2!="object"){
		return false;
	}else{
		var keys1=Object.keys(f1);
		var keys2=Object.keys(f2);
		if(keys1.length!=keys2.length){
			return false;
		}else{
			var flag=true;
			keys1.map(function(key){
				if(!arrayComparison(f1[key],f2[key])){
					flag=false;
				}
			});
			return flag;
		}
	}
}
exports.filtersComparison=filtersComparison;
function arrayComparison(a1,a2){
	if(!Array.isArray(a1) || !Array.isArray(a2)){
		return false;
	}else{
		var flag=true;
		a1.map(function(key){
			if(a2.indexOf(key)==-1){
				flag=false;
			}
		});
		return flag;
	}
}
