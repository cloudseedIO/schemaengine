var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var fs=require("fs");

var Result=[];

var query = N1qlQuery.fromString("SELECT recordId,name FROM records  WHERE docType=$1 ");
cbContentBucket.query(query,["Manufacturer"] ,function(err, result) {
	if(err){console.log(err);return;}
	if(result.length==0){console.log("No Records");return;}
	console.log(result.length);
	process(0);
	function process(index){
		if(index>=result.length){
			writeToFile();
			return;
		}
		
		console.log("Processing "+ index);
		var query2 = N1qlQuery.fromString("SELECT RAW categoryName FROM records WHERE docType=$1 AND Manufacturer=$2");
		cbContentBucket.query(query2,["MfrProCat",result[index].recordId] ,function(err, result2) {
			if(err){
				console.log(err);
			}else{
				Result.push({"Manufacturer":result[index].name,"Categories":result2});
				var query3 = N1qlQuery.fromString("UPDATE records SET esMeta=$1 WHERE docType=$2 AND recordId=$3 returning recordId,name,esMeta");
				cbContentBucket.query(query3,[result2.join(", "),"Manufacturer",result[index].recordId] ,function(err, result3) {
					console.log(result3);
					process(index+1);
				});
				
			}
			
		});
		
		//cbContentBucket.get(allCategories[index],function(caterr, catresult) {});	
	}
});
	
function writeToFile(){
	console.log("Writing to file");
	fs.appendFile("/home/ubuntu/MfrsAndCats.json", JSON.stringify(Result), function(err){
		  if (err) throw err;
		  console.log("Writed here "+"/home/ubuntu/MfrsAndCats.json");
	});
}

