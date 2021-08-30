/**
 * @author saikiran.vadlakonda
 * 
 * this file is never used  instead Use TriggerController.expEvaluator
 * 
 */

var GenericController=require('./GenericController.js');

var allSchemas = {};
GenericController.getAllSchemasStructsDependentSchemas(undefined, function(res){
	res.forEach(function(schema){ if(schema.id)allSchemas[schema.id]=schema.value; });
});
function expEvaluator(context, exp){//exp = User.socialIdentity.facebook
	if(context.constructor == Object && exp && exp.indexOf('.')!=-1){
		var result='';
		var depth = 0;
		var exp = exp.split(".");
		if(exp.length>1){
			var next = schemaEvaluator(allSchemas[exp[depth]], exp[++depth]);
			
			while(allSchemas[next] && allSchemas[next].constructor == Object){
				context=context[exp[depth]];
				next = schemaEvaluator(allSchemas[next], exp[++depth]);
			}
			result=context[exp[depth]];
			console.log(result);
		}
		
	}else{
		return context[exp];
	}
}


function schemaEvaluator(schema, prop){
	if(schema.constructor == Object && prop){
		if(schema["@properties"][prop].dataType.type == "struct"){
			return schema["@properties"][prop].dataType.structRef;
		}else if(schema["@properties"][prop].dataType.type == "object"){
			return schema["@properties"][prop].dataType.objRef;
		}else{
			return schema["@properties"][prop].dataType.type;
		}
	}
}
















/** 
 * @author saikiran
 * Below is to get the value from the given string 
 * 
 * 
 * Cart->hasProduct.Product.quantity
 * record.Product.quantity
 * */
function expEvaluator(context, exp, callback){//exp = User.socialIdentity.facebook
	logger("start of expEval: "+exp);

	if(context && context.constructor == Object && exp && exp.indexOf('.')!=-1){
		var result='';
		var exp = exp.split(".");
		
		if(exp.length>1){
			processExp(context, exp.join("."), 1, function(res){
				logger("expression evaluation is done: "+res);
				if(typeof res=="string" && res!=null && res.trim()!="null" && res.trim()!="error"){
					if(res)
					res=res.replace(/\"/g, "");
					
					callback(res);
				}else{
					callback(res);// sai kiran modified for array 
				}
				
				
			});
		}
	}else{
		callback(context[exp]);
	}
}
exports.expEvaluator=expEvaluator;

exports.processExp = processExp;


function processExp(context, expstring, expInd, callback){
	try {
		var exp = expstring.split(".");
		if(expInd>=exp.length){
			//logger("Before return: "+context);
			callback(context);
		}else{
			if(!context[exp[expInd]]){
				context[exp[expInd]]
			}
			if(typeof context[exp[expInd]] == undefined || context[exp[expInd]]==null){
				callback('');
			}else if( context[exp[expInd]]['constructor'] == String){
				//logger(context[exp[expInd]]);
				if(expInd == exp.length-1){
					context = JSON.stringify(context[exp[expInd]]);
					processExp(context, exp.join("."), expInd+1, callback);
				}else{
					CouchBaseUtil.getDocumentByIdFromContentBucket(context[exp[expInd]], function(res){
						if(!res.error){
							context = res.value;
							logger("Got record from exp eval: "+context);
							processExp(context, exp.join("."), expInd+1, callback);
						}else{
							logger("There is something wrong with expression: "+(exp.join("."))+" while looking into "+exp[expInd]);
							//callback({"error":"there is something wrong with expression: "+(exp.join("."))+" while looking into "+exp[expInd]});
							callback("error");
						}
					});
				}
			}else if(context[exp[expInd]]['constructor'] == Object){
				context = context[exp[expInd]];
				if(context){
					processExp(context, exp.join("."), expInd+1, callback);
				}
				
			}else if(context[exp[expInd]]['constructor'] == Array){
				if(expInd == exp.length-1){
					callback(context[exp[expInd]]);
				}else{
					var Result=[];
					processArrayIndex(0);
					function processArrayIndex(lindex){
						if(lindex>=context[exp[expInd]].length){
							callback(Result);
							return;
						}
						CouchBaseUtil.getDocumentByIdFromContentBucket(context[exp[expInd]][lindex], function(res){
							if(!res.error){
								processExp(res.value, exp.join("."), expInd+1, function(ares){
									Result.push(JSON.parse(ares));
									processArrayIndex(lindex+1);
								});
							}else{
								processArrayIndex(lindex+1)
							}
						});
					}
				}
			}else if(context[exp[expInd]]['constructor'] == Number ||context[exp[expInd]]['constructor'] == Boolean){
				context=JSON.stringify(context[exp[expInd]]);
				processExp(context, exp.join("."), expInd+1, callback);
				
				
			}else{
				logger('constructor', context[exp[expInd]]['constructor']);
				logger('context', JSON.stringify(context), 'exp', exp, 'expInd', expInd);
				callback(null);
				logger("There is something wrong with expression: "+(exp.join(".")));
			}
		}
	} catch (e) {
		logger("Error: while parsing expression");
		logger(e);
		logger(e.stackTrace);
		callback("error");
	}
	
}


