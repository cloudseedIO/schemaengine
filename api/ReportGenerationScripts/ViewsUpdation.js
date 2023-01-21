var couchbase = require('couchbase');
//var cluster = new couchbase.Cluster("couchbase://52.77.86.146");
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);

var cbContentBucketManager=cbContentBucket.manager();


var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbMasterBucket.query(query, function(err, data) {
		if(err){
			console.log(err);
			return;
		}
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		if(docu["docType"]=="schema"  
				 //&& docu["@type"]=="Object" 
				//&& docu["@type"]!="abstractObject" 
				//&& docu["@type"]!="dependentObject" 
			&& docu["@id"]=="Product-StoneAdhesive"		
			// && (docu["@id"]=="Project" || docu["@id"]=="Manufacturer" || docu["@id"]=="Stream" || docu["@id"]=="Supplier")
				){
			
			
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu["@id"]+"             ");	
			createView(docu,function() {
	 			
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}else{
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		}
	}
})



function createView(schema,callback){
	var viewIndex=undefined;
	if(Array.isArray(schema["@views"])){
		for(var i=0;i<schema["@views"].length;i++){
			if(typeof schema["@views"][i]=="object" &&
					schema["@views"][i].viewName=="summary"){
				viewIndex=i;
				break;
			}
		}
	}
	if(viewIndex==undefined){
		callback();
		return;
	}
	var viewDef=schema["@views"][viewIndex];
	var keys=[];
	var multiPicklistKeys=[];
	var values=["@uniqueUserName","webCrawlerIndex"];
	keys=viewDef.key;
	values=values.concat(viewDef.value)
	var secViewKey="";
	var secViewKeyDataType="";
	
	/**
	 * Key construction
	 */
	var keyToInsert="[";
	var publishedPublicKey="[";
	var adminkey="[";
	var secKeyToInsert="[";
	for(var i=0;i<keys.length;i++){
		if(i==0){
			publishedPublicKey+="\"public\"";
			adminkey+="\"admin\"";
			if(keys[i]!="org"){
				if(typeof schema["@security"] =="object" &&
						typeof schema["@security"]["recordLevel"] =="object" &&
						typeof schema["@security"]["recordLevel"].view =="string"){
					secViewKey=schema["@security"]["recordLevel"].view;
					if(typeof schema["@properties"] =="object" &&
							typeof schema["@properties"][secViewKey]=="object" &&
							typeof schema["@properties"][secViewKey].dataType=="object" &&
							typeof schema["@properties"][secViewKey].dataType.type=="string" &&
							schema["@properties"][secViewKey].dataType.type.toLowerCase()=="array".toLowerCase()){

						secViewKeyDataType="array";
						secKeyToInsert+="doc[\""+secViewKey+"[i]\"]";
						keyToInsert+="doc[\"author\"]";
						
					}else{
						if(secViewKey=="all" || secViewKey=="public"){
							keyToInsert+="\"public\"";
						}else{
							keyToInsert+="doc[\""+secViewKey+"\"]";
						}
					}
				}else{
					keyToInsert+="doc[\"author\"]";
				}
			}else{
				keyToInsert+="doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
			}
		}else{
			if(typeof schema["@properties"] =="object" &&
					typeof schema["@properties"][keys[i]]=="object" &&
					typeof schema["@properties"][keys[i]].dataType=="object" &&
					typeof schema["@properties"][keys[i]].dataType.type=="string" &&
					schema["@properties"][keys[i]].dataType.type.toLowerCase()=="multiPicklist".toLowerCase()){
				multiPicklistKeys.push(keys[i]);
				keyToInsert+=",\"NA\"";
				publishedPublicKey+=",\"NA\"";
				adminkey+=",\"\NA\"";
				secKeyToInsert+=",\"\NA\"";
			}else{
				keyToInsert+=",doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
				publishedPublicKey+=",doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
				adminkey+=",doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
				secKeyToInsert+=",doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
			}
		}
	}
	keyToInsert+="]";
	publishedPublicKey+="]";
	adminkey+="]";
	secKeyToInsert+="]";
	/**
	 * Value construction
	 */
	var valueToInsert="var value={\n";
	for(var i=0;i<values.length;i++){
		if(i!=0){
			valueToInsert+=",\n";
		}
		valueToInsert+= "\t\t\t\""+values[i]+"\": doc[\""+values[i]+"\"]";
	}
	valueToInsert+="\n\t\t}";
	
	
	/**
	 * Multiple Pick List Emit construction
	 */
	var multiPickListEmit="";
	if(multiPicklistKeys.length==1){
		multiPickListEmit="if(Array.isArray(doc[\""+multiPicklistKeys[0]+"\"]){\n" +
							"	\t\tfor(var i=0;i<doc[\""+multiPicklistKeys[0]+"\"].length;i++){\n";
		var multiPickListKey="[";
		for(var i=0;i<keys.length;i++){
			if(i!=0){
				multiPickListKey+=",";
			}
			if(multiPicklistKeys.indexOf(keys[i])>-1){
				multiPickListKey+="doc[\""+keys[i]+"\"][i]";
			}else{
				multiPickListKey+="doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
			}
		}
		multiPickListKey+="]";
		multiPickListEmit+="		\t\temit("+multiPickListKey+",value);\n"+	
							"	\t\t}\n" +
							"\t\t}"
	}
	if(multiPicklistKeys.length==2){
		multiPickListEmit="if(Array.isArray(doc[\""+multiPicklistKeys[0]+"\"] && Array.isArray(doc[\""+multiPicklistKeys[1]+"\"]){\n" +
							"	\t\tfor(var i=0;i<doc[\""+multiPicklistKeys[0]+"\"].length;i++){\n" +
							"		\t\tfor(var j=0;j<doc[\""+multiPicklistKeys[1]+"\"].length;j++){\n";
		var multiPickListKey="[";
		for(var i=0;i<keys.length;i++){
			if(i!=0){
				multiPickListKey+=",";
			}
			if(multiPicklistKeys.indexOf(keys[i])==0){
				multiPickListKey+="doc[\""+keys[i]+"\"][i]";
			}else if(multiPicklistKeys.indexOf(keys[i])==1){
				multiPickListKey+="doc[\""+keys[i]+"\"][j]";
			}else{
				multiPickListKey+="doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
			}
		}
		multiPickListKey+="]";
		multiPickListEmit+="			\t\temit("+multiPickListKey+",value);\n"+	
							"		\t\t}\n" +
							"	\t\t}\n" +
							"\t\t}"
	}
	if(multiPicklistKeys.length==3){
		multiPickListEmit="if(Array.isArray(doc[\""+multiPicklistKeys[0]+"\"] && Array.isArray(doc[\""+multiPicklistKeys[1]+"\"] && Array.isArray(doc[\""+multiPicklistKeys[2]+"\"]){\n" +
							"	\t\tfor(var i=0;i<doc[\""+multiPicklistKeys[0]+"\"].length;i++){\n" +
							"		\t\tfor(var j=0;j<doc[\""+multiPicklistKeys[1]+"\"].length;j++){\n" +
							"			\t\tfor(var k=0;k<doc[\""+multiPicklistKeys[2]+"\"].length;k++){\n";
		var multiPickListKey="[";
		for(var i=0;i<keys.length;i++){
			if(i!=0){
				multiPickListKey+=",";
			}
			if(multiPicklistKeys.indexOf(keys[i])==0){
				multiPickListKey+="doc[\""+keys[i]+"\"][i]";
			}else if(multiPicklistKeys.indexOf(keys[i])==1){
				multiPickListKey+="doc[\""+keys[i]+"\"][j]";
			}else if(multiPicklistKeys.indexOf(keys[i])==2){
				multiPickListKey+="doc[\""+keys[i]+"\"][k]";
			}else{
				multiPickListKey+="doc[\""+keys[i]+"\"]?doc[\""+keys[i]+"\"]:\"\"";
			}
		}
		multiPickListKey+="]";
		multiPickListEmit+="				\t\temit("+multiPickListKey+",value);\n"+	
							"			\t\t}\n" +
							"		\t\t}\n" +
							"	\t\t}\n" +
							"\t\t}"
	}
	
	/**
	 * RecordLevel Security Emit for Array of viewers construction
	 */
	var secureEmit="";
	if(secViewKeyDataType=="array" && secViewKey!=""){
		secureEmit+="if(Array.isArray(doc[\""+secViewKey+"\"])){\n" +
					"	\t\tfor(var i=0;i<doc[\""+secViewKey+"\"].length;i++){\n" +
					"		\t\temit("+secKeyToInsert+",value);\n" +
					"	\t\t}\n" +
					"\t\t}";
	}
	
	var adminEmit="";
	if(keys[0]!="org"){
		adminEmit="emit("+adminkey+",value);"
	}

	var viewToCreate="function(doc,meta){\n" +
					 "	if(doc.docType==\""+schema["@id"]+"\"){\n" +
					 "		" +valueToInsert+"\n"+
					 "		emit(" +keyToInsert+",value);\n" +
					 "		"+secureEmit+"\n"+
					 "		if(doc[\"$status\"]==\"published\" && doc.org!=\"public\"){\n"+
					 "			emit(" +publishedPublicKey+",value);\n" +
					 "		}\n"+	
					 "		emit(meta.id,value);\n"+
					 "		"+multiPickListEmit+"\n"+
					 "		"+adminEmit+"\n"+
					 "	}\n" +
					 "}";
	console.log(viewToCreate);
	callback();
	/*cbContentBucketManager.getDesignDocument(schema["@id"],function(err,res){
		if(err){
			console.log(err);
			console.log("Design Document doesn't exists creating new ");
			var views={};
			views["summary"]={
					map: viewToCreate,
					reduce: "_count"
			}
			cbContentBucketManager.insertDesignDocument(schema["@id"], {views: views}, function(err, res) {
				if(err){
					console.log(err);
					console.log("failed to create "+schema["@id"]);
					callback({"error":"internalerror"});
				}else{
					console.log(schema["@id"] +" created successfully. view name = summary");
					callback({"result":"View Created"});
				}
			});
		}else{
			console.log("Design Document exists updating it ");
			var views=res.views;
			views["summary"]={
					map: viewToCreate,
					reduce: "_count"
			}
			cbContentBucketManager.upsertDesignDocument(schema["@id"], {views: views}, function(err, res) {
				if(err){
					console.log(err);
					console.log(schema["@id"] +" updation failed");
					callback({"error":"internalerror"});
				}else{
					console.log(schema["@id"] +" updation success. view name = summary");
					callback({"result":"View Updated"});
				}
			});
		}
	});*/
}
