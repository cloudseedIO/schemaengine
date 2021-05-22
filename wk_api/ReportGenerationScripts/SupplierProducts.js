var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var fs=require("fs");

//var supId="Supplierc4a45c57-bbae-488c-557d-ad5c929a8909";
var supId="SupplierStanjo";
//var supId="Supplierb4f24d17-e3c1-c5ca-02e8-bdba83feaa5d";
var supName="";
var Result={};
cbContentBucket.get(supId,function(serr, result) {
	if (serr) { console.log(serr);	}
	try{
	 supName=result.value.name;
	}catch(err){}
	Result[supName]={};
	var query = ViewQuery.from("MfrProCatCitySupplier", "getSupCat").key(["public",supId]).reduce(true).group(-1).stale(ViewQuery.Update.BEFORE);
	cbContentBucket.query(query, function(err, data) {
		if(err){
			console.log(err);
			return;
		}
		console.log(supName);
		console.log(data.length);
		if(data.length==0){
			return;
		}
		var allCategories=data[0].value;
		console.log("allCategories "+allCategories.length);
		
		process(0);
		function process(index){
			console.log("Processing "+ index);
			cbContentBucket.get(allCategories[index],function(caterr, catresult) {
				if (caterr) { console.log(caterr);	}
				var catName="";
				try{
					catName=catresult.value.categoryName;
				}catch(err){}
				
				var innerQuery = ViewQuery.from("relation","getRelated").key([allCategories[index],"hasProduct"]).reduce(false).stale(ViewQuery.Update.NONE);
				cbContentBucket.query(innerQuery,function(relerr,relresponse){
					if(relerr){
						console.log(relerr);
						return;
					}
					var recordIds=[];
					for(var i=0;i<relresponse.length;i++){
						recordIds.push(relresponse[i].id);
					}
					if(recordIds.length!=0){
						cbContentBucket.getMulti(recordIds,function(multierr, multiresult) {
							  if (multierr) {
								  console.log("ERROR While getting multi docs (producs)  "+multierr);
								  console.log("all inns "+ recordIds.length);
								  proProcess(0);
								  function proProcess(inn){
									  console.log("inn " +inn);
									  cbContentBucket.get(recordIds[inn],function(proError, proResult) {
										  if(proError){console.log(proError);}
										  if(!Result[supName][catName]){
											  Result[supName][catName]={};
										  }
										  if(Result[supName][catName][proResult.value.esMeta]){
											  Result[supName][catName][proResult.value.esMeta].push(proResult.value.name);
										  }else{
											  Result[supName][catName][proResult.value.esMeta]=[proResult.value.name];
										  }
										  if((inn+1)<recordIds.length){
											  proProcess(inn+1);
										  }else{
											  if((index+1)<allCategories.length){
												  process(index+1);
											  }else{
												  writeToFile();
											  }
										  }
									  });
								  }
								  
								  
								}else{
							  	  var names={};
								  for(var recordId in multiresult){
									  if(names[multiresult[recordId].value.esMeta]){
										  names[multiresult[recordId].value.esMeta].push(multiresult[recordId].value.name);
									  }else{
										  names[multiresult[recordId].value.esMeta]=[multiresult[recordId].value.name];
									  }
								  }
								  Result[supName][catName]=names;
								  if((index+1)<allCategories.length){
									  process(index+1);
								  }else{
									  writeToFile();
								  }
								}
							});
							
					}else{
						if((index+1)<allCategories.length){
							process(index+1);
						}else{
							writeToFile();
						}
					}
				});
			
			
			
			});	
			
		}
		
		
		
		
	})
	
});
function writeToFile(){
	console.log("Writing to file");
	fs.appendFile('/home/ubuntu/'+supName+".json", JSON.stringify(Result), function(err){
		  if (err) throw err;
		  console.log("Writed here "+"/home/ubuntu/"+supName+".json");
	});
}

