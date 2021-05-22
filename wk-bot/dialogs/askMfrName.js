var builder = require('botbuilder');
var wishkarma=require('../api/wishkarma.js');
var defaultLimit=wishkarma.defaultLimit;
var selectionLimit=wishkarma.selectionLimit;
module.exports=[
    function (session,args,next) {
    		console.log("In askMfrName");
    		console.log(args);
        //builder.Prompts.text(session, 'Which brand?');
        session.sendTyping();
        if(!args){
        	args={};
        }
        if(!session.dialogData){
        	session.dialogData={};
        }
        session.dialogData.includeAll=args.includeAll;
        args.skip=session.dialogData.skip=0;
        session.dialogData.args=args;
        wishkarma.getManufacturers(args,function(data){
        	if(data.records.length==0){
        			session.send(args.Manufacturer+" doesn't match any manufacturers.");
		      		delete args.Manufacturer;
		      		session.dialogData.args=args;
		      		wishkarma.getManufacturers(args,function(data){
		      			promptSelection(session,data);
		      		});
        	}else{
        		exactResult={records:[]};
		      	data.records.forEach(function(record,index){
		      		if(args.Manufacturer && record.name && 
		      			 record.name.toLowerCase()==args.Manufacturer.toLowerCase()){
								exactMatch=true;
							 	exactResult.records.push(record);
							 }
						});
		   			promptSelection(session,exactResult.records.length>0?exactResult:data);
					}	
				});
    },
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator(),
    
    getNextSetOfRecordsandPrompt(),
    getPromptResponseEvaluator()
]


function promptSelection(session,data){
	if(data.records.length==1){
			session.endDialogWithResult({name:data.records[0].name,recordId:data.records[0].recordId});
	}else{
		session.dialogData.choicesObject={};
		var moreplusIndex=0;
		if(session.dialogData.includeAll){
			moreplusIndex+=1;
			session.dialogData.choicesObject["All"]={name:"All",recordId:"All"};
		}
		var lastRecIndex=0;
		data.records.forEach(function(record,index){
				lastRecIndex=index;
			 session.dialogData.choicesObject[record.name]={name:record.name,recordId:record.recordId};
		});
		var selectStrings=Object.keys(session.dialogData.choicesObject);
		if(lastRecIndex==selectionLimit){
			selectStrings[selectionLimit+moreplusIndex]="More";
		}
		if(selectStrings.length==0){
			session.endDialogWithResult({});
		}else if(selectStrings.length==1){
			session.endDialogWithResult(session.dialogData.choicesObject[selectStrings[1]]);
		}else{
			//session.send("Please select a manufacturer from below");
			if(!session.conversationData){session.conversationData={};};
			session.conversationData.Manufacturers=selectStrings.map(function(d){return d.toLowerCase();});
			
			builder.Prompts.choice(
				session,
				"Select Manufacturer",
				selectStrings,
				{ listStyle: builder.ListStyle.button, maxRetries: 1 }
			);//,{ listStyle: builder.ListStyle.button });
		}
	}
}

function getPromptResponseEvaluator(){
	return function (session, results, next) {
    		console.log(results);//{ resumed: 0,response: { index: 256, entity: 'Doors', score: 1 },childId: 'BotBuilder:prompt-choice' }
				if(results.response.entity!="More"){
					console.log(session.dialogData.choicesObject[results.response.entity]);
		      session.endDialogWithResult(session.dialogData.choicesObject[results.response.entity]);
        }else{
        	next();
        }
    }
}
function getNextSetOfRecordsandPrompt(){
	return function(session,next){
			var args=session.dialogData.args;
			args.skip=session.dialogData.skip=session.dialogData.skip+selectionLimit;
			wishkarma.getManufacturers(args,function(data){
  			promptSelection(session,data);
  		});
	}
}
