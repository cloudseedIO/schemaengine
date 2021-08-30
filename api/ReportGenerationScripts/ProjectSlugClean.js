var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var bucket=cluster.openBucket("records");
var query = ViewQuery.from("Test", "test").skip(160)//.limit(1).stale(ViewQuery.Update.BEFORE);



bucket.query(query, function(err, data) {
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
		var architects=[];
		var innerQuery = ViewQuery.from("relation","getRelated").key([docu.recordId,"hasProvider"]).reduce(false).stale(ViewQuery.Update.NONE);
		bucket.query(innerQuery,function(err2,response){
			if(err2){
				nextProcess();
				return;
			}
			var recordIds=[];
			for(var i=0;i<response.length;i++){
				recordIds.push(response[i].id);
			}
			if(recordIds.length>0){
				bucket.getMulti(recordIds,function(err, result) {
					  var archsToFetch=[];
					  for(var rl in result){
						  archsToFetch.push(result[rl].value.Provider);
					  }
					  if(archsToFetch.length>0){
						  bucket.getMulti(archsToFetch,function(errw, resultw) {
							  for(var rl in resultw){
								  try{
									  architects.push(resultw[rl].value.name);
								  }catch(err){console.log(resultw[rl])}
							  }
							  nextProcess();
						  });
					  }else{
						  nextProcess();
					  }
					  
				});
			}else{
				nextProcess();
			}
		});
		
		
		function nextProcess(){
			
			
			
			

			
			//<Project Name>-By-<Architect Name>-<Project City>
			//                        <Project Name> By <Architect Name> - <Project City> | Wishkarma.com
			//<Project Name> By <Architect Name> <(Type)> - <Project City>
			if(docu.docType=="Project"){
				if(docu.name && docu.name.trim()!=""){
					docu["@uniqueUserName"]=docu.name.trim().replace(/\W+/g,"-").toLowerCase();
					docu.metaTitle=docu.name.trim();
					docu.metaDescription=docu.name.trim();
				}
				if(architects.length>0){
					docu["@uniqueUserName"]+="-by-"+architects.join("-").replace(/\W+/g,"-").toLowerCase();
					docu.metaTitle+=" By "+architects.join(" ");
					docu.metaDescription+=" By "+architects.join(" ");
				}
				if(docu.type){
					docu.metaDescription+=", "+docu.type;
				}
				if(docu.address.addressLocality){
					docu["@uniqueUserName"]+="-"+docu.address.addressLocality.trim().replace(/\W+/g,"-").toLowerCase();
					docu.metaTitle+=", "+docu.address.addressLocality.trim();
					docu.metaDescription+=", "+docu.address.addressLocality;
				}
				//<Project Name> By <Architect Name> <(Type)> - <Project City>
				docu.metaTitle+=" | Wishkarma.com";
				
				
			}
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
			//console.log(docu["@uniqueUserName"]);
			//console.log(docu.metaTitle);
			//console.log(docu.metaDescription);
			bucket.upsert(docu.recordId,docu,function(err, result) {
				if (err) { console.log(err); }
				if((index+1)<data.length){
					updateProduct(index+1);
				}
			});
		}
	}
});

