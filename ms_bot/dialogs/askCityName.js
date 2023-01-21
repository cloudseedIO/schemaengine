var builder = require('botbuilder');
var schemaengine=require('../api/schemaengine.js');
var defaultLimit=schemaengine.defaultLimit;
var selectionLimit=schemaengine.selectionLimit;
module.exports=[
    function (session,args) {
    		console.log("In askCityName");
    		console.log(args);
        //builder.Prompts.text(session, 'Which city?');
   			session.sendTyping();
   			if(!args){
   				args={}
   			}
   			if(!session.dialogData){
   				session.dialogData={};
   			}
   			session.dialogData.includeAll=args.includeAll;
        args.skip=session.dialogData.skip=0;
        session.dialogData.args=args;
        schemaengine.getCities(args,function(data){
        	if(data.records.length==0){
        		//session.send(args.City+" not in the list.");
		      		delete args.City;
		      		session.dialogData.args=args;
		      		schemaengine.getCities(args,function(data){
		      			promptSelection(session,data);
		      		});
        	}else{
				 		promptSelection(session,data);
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
			//session.send("Please select a city from below");
			builder.Prompts.choice(
				session,
				"Select your City",
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
			schemaengine.getCities(args,function(data){
  			promptSelection(session,data);
  		});
	}
}
