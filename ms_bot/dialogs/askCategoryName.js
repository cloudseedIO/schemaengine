var builder = require('botbuilder');
var wishkarma=require('../api/wishkarma.js');

var defaultLimit=wishkarma.defaultLimit;
var selectionLimit=wishkarma.selectionLimit;

module.exports=[
    function (session,args,next) {
    		console.log("In askCategoryName");
    		console.log(args);
        //builder.Prompts.text(session, 'What category?');
        session.sendTyping();
        if(!session.dialogData){session.dialogData={};}
        if(!args){
       		args={};
       	}
        session.dialogData.includeAll=args.includeAll;
       	args.skip=session.dialogData.skip=0;
       	session.dialogData.args=args;
       	wishkarma.getProductCategories(args,function(data){
        	if(data.records.length==0){
        		if(args.ProductCategory){
        			//session.send(args.ProductCategory+" not in the list.");
        		}
        		
        		delete args.ProductCategory;
        		session.dialogData.args=args;
        		wishkarma.getProductCategories(args,function(data){
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
];

function promptSelection(session,data){
		var args=session.dialogData.args;
		if(data.records.length==1){
			singleRecordCallback(session,data);
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
			}else if(selectStrings.length==1 || args.intent == "LocateSuppliers"){
				singleRecordCallback(session,data);
			}else {
				//session.send("Please select a category from below");
				builder.Prompts.choice(
					session, 
					"Select Product Category", 
					selectStrings,
					{ listStyle: builder.ListStyle.button ,maxRetries: 1 }
				);//,{ listStyle: builder.ListStyle.button });
			}
		}
}
function getPromptResponseEvaluator(){
	return function (session, results, next) {
    		console.log(results);//{ resumed: 0,response: { index: 256, entity: 'Doors', score: 1 },childId: 'BotBuilder:prompt-choice' }
				if(results.response && results.response.entity!="More"){
					console.log(session.dialogData.choicesObject[results.response.entity]);
		      var catdoc=session.dialogData.choicesObject[results.response.entity];
					if(catdoc.productType || catdoc.recordId=="All"){
						session.endDialogWithResult(catdoc);
					}else{
						wishkarma.getProductCategoryRecord({ProCatId:catdoc.recordId},function(doc){
							catdoc.productType=doc.productType;
							session.endDialogWithResult(catdoc);
						});
					}	
				}else{
        	next();
        }
    }
}
function getNextSetOfRecordsandPrompt(){
	return function(session,next){
			var args=session.dialogData.args;
			args.skip=session.dialogData.skip=session.dialogData.skip+selectionLimit;
			wishkarma.getProductCategories(args,function(data){
  			promptSelection(session,data);
  		});
	}
}
function singleRecordCallback(session,data){
	var catdoc={name:data.records[0].name,recordId:data.records[0].recordId,productType:data.records[0].productType};
	if(catdoc.productType){
		session.endDialogWithResult(catdoc);
	}else{
		wishkarma.getProductCategoryRecord({ProCatId:catdoc.recordId},function(doc){
			catdoc.productType=doc.productType;
			session.endDialogWithResult(catdoc);
		});
	}
}
