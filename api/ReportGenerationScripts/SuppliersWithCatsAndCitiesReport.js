var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var fs=require("fs");

var Result=[];

var query = N1qlQuery.fromString("SELECT recordId,name FROM records WHERE docType=$1");
cbContentBucket.query(query,["Supplier"] ,function(err, result) {
	if(err){console.log(err);return;}
	if(result.length==0){console.log("No Records");return;}
	console.log(result.length);
	process(0);
	function process(index){
		if(index>=result.length){
			console.log("Processing DONE with all suppliers");
			writeToFile();
			return;
		}

		console.log("Processing "+ index);
		//GETTING CATEGORIES NAMES
		var categoriesQuery = N1qlQuery.fromString("SELECT DISTINCT(ProductCategory) FROM records  WHERE docType=$1 AND Supplier=$2");
		cbContentBucket.query(categoriesQuery,["MfrProCatCitySupplier",result[index].recordId] ,function(err, ProCatsRes) {
			if(err){
				console.log(err);
				process(index+1);
			}else{
				var ProCats = ProCatsRes.map(function(entry){
					return entry.ProductCategory;
				});
				var proCatsNamesQuery = N1qlQuery.fromString("SELECT RAW categoryName FROM records USE KEYS $1");
				cbContentBucket.query(proCatsNamesQuery,[ProCats] ,function(err, proCatNames) {
					//GETTING MANUFACTURER NAMES
					var categoriesQuery = N1qlQuery.fromString("SELECT DISTINCT(Manufacturer) FROM records  WHERE docType=$1 AND Supplier=$2");
					cbContentBucket.query(categoriesQuery,["MfrProCatCitySupplier",result[index].recordId] ,function(err, MfrsRes) {
						if(err){
							console.log(err);
							process(index+1);
						}else{
							var Mfrs = MfrsRes.map(function(entry){
								return entry.Manufacturer;
							});
							var mfrNamesQuery = N1qlQuery.fromString("SELECT RAW name FROM records USE KEYS $1");
							cbContentBucket.query(mfrNamesQuery,[Mfrs] ,function(err, mfrNames) {
								//GETTING CITIES NAMES
								var citiesQuery = N1qlQuery.fromString("SELECT DISTINCT(City) FROM records  WHERE docType=$1 AND Supplier=$2");
								cbContentBucket.query(citiesQuery,["MfrProCatCitySupplier",result[index].recordId] ,function(err, citiesRes) {
									if(err){
										console.log(err);
										process(index+1);
									}else{
										var Cities = citiesRes.map(function(entry){
											return entry.City;
										});
										var cityNamesQuery = N1qlQuery.fromString("SELECT RAW cityName FROM records USE KEYS $1");
										cbContentBucket.query(cityNamesQuery,[Cities] ,function(err, cityNames) {
											Result.push({"Supplier":result[index].name,"Categories":proCatNames,"Manufacturers":mfrNames,"Cities":cityNames});
												process(index+1);
											//Updating Supplier esMeta
											/*var esMetaString="Manufacturers :  "+mfrNames.join(", ")+"\n Categories : "+proCatNames.join(", ")+" \n Cities: "+ cityNames.join(", ");
											var queryFinal = N1qlQuery.fromString("UPDATE records SET esMeta=$1 WHERE docType=$2 AND recordId=$3 returning recordId,name,esMeta");
											cbContentBucket.query(queryFinal,[esMetaString,"Supplier",result[index].recordId] ,function(err, result3) {
												console.log(result3);
												process(index+1);
											});*/
										});
									}
								});
							});
						}
					});

				});
			}

		});

		//cbContentBucket.get(allCategories[index],function(caterr, catresult) {});
	}
});

function writeToFile(){
	console.log("Writing to file");
	fs.appendFile("./SupplierCatsMfrsAndCities.json", JSON.stringify(Result), function(err){
		  if (err) throw err;
		  console.log("Writed here "+"./SupplierCatsMfrsAndCities.json");
	});
}
