var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var bucket=cluster.openBucket("records");

/*
var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);

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
		
		
		//Product
		if(docu.docType=="Product"){
			//SLUG: w.com/ <Mfr> <Product Name> <Prod No>
			//if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				var userName=docu.esMeta.trim().replace(/\W+/g,"-").toLowerCase()+"-"+ docu.name.trim().substr(0,50).replace(/\W+/g,"-").toLowerCase();
				if(isNaN(docu.mfrProductNo) && docu.mfrProductNo.trim()!=""){
					userName+="-"+docu.mfrProductNo.trim().replace(/\W+/g,"").toLowerCase()
				}else{
					userName+="-"+docu.mfrProductNo;
				}
				docu["@uniqueUserName"]=userName;
			//}
			docu.metaTitle=docu.esMeta.trim()+" "+ docu.name.trim().substr(0.40)+" "+docu.mfrProductNo+" | cloudseed.com";
			docu.metaDescription=docu.esMeta+" "+ docu.name+" "+docu.mfrProductNo+". Find and chat with local suppliers and dealers near you."
		}
		console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
		bucket.upsert(docu.recordId,docu,function(err, result) {
			if (err) { console.log(err); }
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		});
	}
});
*/

function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	bucket.query(query, params,function(err, results) {
		if(err){
			if(typeof callback=="function")
				callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}
//select `@uniqueUserName`,count(*) as total from records where `@uniqueUserName` is not missing group by `@uniqueUserName` having count(*)>1 order by total desc limit 10 
var getQuery	=	"SELECT `@uniqueUserName`,count(*) AS total "+
					"FROM records "+
					"WHERE `@uniqueUserName` IS NOT MISSING "+
					"GROUP BY `@uniqueUserName` "+
					"HAVING count(*)>1 "+
					"ORDER by total DESC ";//"LIMIT 10";
executeView(getQuery,[],function(dupRes){
	if(dupRes.error){console.log(dupRes);return;}
	if(dupRes.length==0){
		console.log("No Records to process");
		return;
	}else{
		processRow(0);
	}

	function processRow(index){
		if(index<dupRes.length){
			console.log("--------------------------------");
			console.log("Processing row : "+(index+1))
			updateDuplicates(dupRes[index],function(){
				processRow(index+1);
			});
		}else{
			console.log("********************************");
			console.log("***********   DONE   ***********");
			console.log("********************************");
		}
	}
});

function updateDuplicates(data,callback){
	console.log(data);
	executeView("SELECT RAW recordId FROM records WHERE `@uniqueUserName`=$1",[data["@uniqueUserName"]],function(recIds){
		console.log(recIds);
		if(recIds.error){console.log(recIds);callback();return;}
		if(recIds.length==0){
			callback();
			return;
		}else{
			processUpdateRec(0);
		}

		function processUpdateRec(index){
			if(index<recIds.length){
				console.log("--------------------------------");
				console.log("Processing recordId : "+(recIds[index]));
				executeView("UPDATE records SET `@uniqueUserName`=$2 WHERE `recordId`=$1 RETURNING recordId,`@uniqueUserName` ",[recIds[index],data["@uniqueUserName"]+"-"+(index+1)],function(upres){
					console.log(upres);
					processUpdateRec(index+1);
				});
			}else{
				console.log("=================================");
				console.log("***********   DONE   ***********");
				console.log("=================================");
				callback();
			}
		}
	});
}
