var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.openBucket(records);
var global=require('../utils/global.js');
var dateCreated="2018/01/04 17:20:00 GMT+0530";
var Manufacturers=[];
function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	cbContentBucket.query(query, params,function(err, results) {
		if(err){
			if(typeof callback=="function")
				callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}

function getDocumentFromContent(docId,callback){
	cbContentBucket.get(docId,function(err, result){
		if(err){
			if(typeof callback=="function")
				callback({"error":err});
			return;
		}
		if(typeof callback=="function")
			callback(result);
	});
}

executeView("SELECT recordId,name from records where docType=$1 LIMIT $2 OFFSET $3",["Manufacturer",1,0],function(mfrs){
	if(mfrs.error){console.log(mfrs);return;}
	Manufacturers=mfrs;
	if(Manufacturers.length>0){
		processManufacturer(0)
	}
});

function getMfrCountries(mfrId,callback){
	executeView("SELECT DISTINCT City from records where docType=$1 AND Manufacturer=$2",["MfrProCatCity",mfrId],function(citiesres){
		if(citiesres.error){console.log(citiesres);callback(citiesres);}
		var cities=[];
		citiesres.forEach(function(city){
			cities.push(city.City)
		});
		executeView("SELECT DISTINCT region from records where docType=$1 AND recordId IN $2",["City",cities],function(regionsres){
			if(regionsres.error){console.log(regionsres);callback(regionsres);}
			var regions=[];
			regionsres.forEach(function(region){
				regions.push(region.region)
			});
			executeView("SELECT DISTINCT country from records where docType=$1 AND recordId IN $2",["Region",regions],function(countriesres){
				if(countriesres.error){console.log(countriesres);callback(countriesres);}
				var countries=[];
				countriesres.forEach(function(country){
					countries.push(country.country)
				});
				executeView("SELECT DISTINCT countryName from records where docType=$1 AND recordId IN $2",["Country",countries],function(countriesres){
					if(countriesres.error){console.log(countriesres);callback(countriesres);}
					var countries=[];
					countriesres.forEach(function(country){
						countries.push(country.countryName)
					});
					callback(countries);
				});
			});
		});
	});
}
function processManufacturer(index){
	if(index<Manufacturers.length){
		var Mfr=Manufacturers[index].recordId;
		console.log("Processing :"+(index+1)+" : "+Manufacturers[index].name+"     -   "+Mfr);
		getMfrCountries(Mfr,function(countries){
			processMfrProductsWithCounties(Mfr,countries,function(){
				processManufacturer(index+1);
			});
		})
	}else{
		console.log("********************************");
		console.log("***********   DONE   ***********");
		console.log("********************************");
	}
}

function processMfrProductsWithCounties(Mfr,countries,callback){
	executeView("UPDATE records SET countryOfAvailability=$3 where docType=$1 AND Manufacturer=$2 AND countryOfAvailability is null",["Product",Mfr,countries],function(res){
		console.log(res);
		callback(res);
	});
}