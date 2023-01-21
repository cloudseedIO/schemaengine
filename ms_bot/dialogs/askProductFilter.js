var builder = require('botbuilder');
var schemaengine=require('../api/schemaengine.js');
module.exports=[
    function (session,args, next) {
    		console.log("In AskProductFilter");
    		//builder.Prompts.text(session, 'Any filter?');
    		if(!args){
    			args={};
    		}
    		if(!session.dialogData){
    			session.dialogData={};
    		}
    		session.dialogData.productType=args.productType;
    		session.dialogData.inputKeywords=args.inputKeywords;
    		session.dialogData.MfrId=args.MfrId;
    		if(args.ProCatId){
    			schemaengine.getCategorySchema(args,function(schema){
    				var filterProperties={};
    				var allFilterKeys=[];
    				if(schema && schema["@properties"]){
    					for(var key in schema["@properties"]){
    						try{
		  						if(schema["@properties"][key].derivedProperty && 
		  							(schema["@properties"][key].dataType.type=="pickList" ||
		  							schema["@properties"][key].dataType.type=="multiPickList" ||
		  							schema["@properties"][key].dataType.type=="color")){
		  							filterProperties[key]=schema["@properties"][key];
		  							if(Array.isArray(schema["@filterKeys"]) && schema["@filterKeys"].indexOf(key)>-1){
		  								allFilterKeys.push(key);
		  							}
		  						}
    						}catch(err){}
    					}
    				}
    				if(!args.MfrId){
							allFilterKeys.push("Manufacturer");
							filterProperties["Manufacturer"]=schema["@properties"]["Manufacturer"];
						}
    				if(allFilterKeys.length==0){
    					session.endDialogWithResult({});
    				}else{
    					session.dialogData.filterProperties=filterProperties;
    					session.dialogData.filters={};
    					session.dialogData.currentIndex=0;
    					session.dialogData.allFilterKeys=allFilterKeys;
    					next();
    				}
    			});
				}else{
					session.endDialogWithResult({});
				}
        
    },
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    getPrompter(),
    getPromptListenerAndIncrimentor(),
    
]

function getPrompter(){
	return function (session, results,next) {
    		if(session.dialogData.currentIndex>=5){
    			session.endDialogWithResult({filters:session.dialogData.filters});
    		}else if(session.dialogData.currentIndex<session.dialogData.allFilterKeys.length){
    			var postinput={
    				productType:session.dialogData.productType,
    				allFilterKeys:session.dialogData.allFilterKeys,
    				filters:session.dialogData.filters,
    				MfrId:session.dialogData.MfrId
    			};
					schemaengine.getApplicableFilters(JSON.parse(JSON.stringify(postinput)),function(applicable){
						var currentKey=session.dialogData.allFilterKeys[session.dialogData.currentIndex];
						var property=session.dialogData.filterProperties[currentKey];
						var curOptions=[];
						console.log(currentKey,applicable);
						/*if(property.dataType && (property.dataType.type=="pickList" || property.dataType.type=="multiPickList")){
							property.dataType.options;
						}*/
						curOptions=applicable[currentKey];
						
						if(property.dataType && property.dataType.type=="color"){
							var tempcolors=[];
							curOptions.forEach(function(c){
								c.split(" ").map(function(cc){
									if(cc.indexOf("#")==-1 && tempcolors.indexOf(cc)==-1){
										tempcolors.push(cc);
									}
								});
							});
							curOptions=tempcolors;
						}
						var options=[];
						var inputtextmatch=false;
						if(Array.isArray(session.dialogData.inputKeywords)){
								for(var i=0;i<curOptions.length;i++){
									if(session.dialogData.inputKeywords.indexOf((curOptions[i]+"").toLowerCase())>-1){
										options.push(curOptions[i]);
										inputtextmatch=true;
									}
								}
								if(options.length==0){
									options=curOptions;
								}
						}else{
							options=curOptions;
						}
						
						if(options.length>0){
							if(inputtextmatch && options.length==1){
								session.dialogData.filters[currentKey]=[options[0]];
								next();
							}else{
								if(property.dataType && (property.dataType.type=="pickList" || property.dataType.type=="multiPickList")){
									var promptText=property.prompt;
									if(!promptText || promptText==property.displayName){
										promptText="Select "+property.displayName;
									}
									builder.Prompts.choice(
											session,
											promptText, 
											["All"].concat(options),
											{listStyle: builder.ListStyle.button }
										);
								}else if(property.dataType && (property.dataType.type=="object")){
									session.beginDialog("askMfrName",{recordIds:options,includeAll:true,returnOnlyrecordId:true});
								}else if(property.dataType && (property.dataType.type=="color") && false){
										var promptText=property.prompt;
										if(!promptText || promptText==property.displayName){
											promptText="Select "+property.displayName;
										}
										builder.Prompts.choice(
												session,
												promptText, 
												["All"].concat(options),
												{listStyle: builder.ListStyle.button }
											);
								}else{
									next();
								}
							}
						}else{
							next();	
						}
					});
				}else{
					session.endDialogWithResult({filters:session.dialogData.filters});
				}
    }
}

function getPromptListenerAndIncrimentor(){
	return function(session,results,next){
			console.log(results);
    	if(results && results.response && results.response.entity && results.response.entity!="All"){
    		session.dialogData.filters[session.dialogData.allFilterKeys[session.dialogData.currentIndex]]=[results.response.entity];
    	}
    	if(results && results.name && results.recordId && results.recordId!="All"){
    		session.dialogData.filters[session.dialogData.allFilterKeys[session.dialogData.currentIndex]]=[results.recordId];
    	}
    	session.dialogData.currentIndex++;
    	next();
    }
}

