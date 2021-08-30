var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.openBucket(records);
var global=require('../utils/global.js');
var dateCreated="2018/01/04 17:20:00 GMT+0530";
/*
 
 {
	Brand:"Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7",
	City:"Delhi",
	DealerName:"Aeron Udyog",
	POC:"Mr. Naresh Gupta",
	Contact:"9810013566",
	Fax:"",	
	StreetAddress:"18, Virendra Complex Community Centre – II, Ashok Vihar Ph-II",
	State:"New Delhi",
	Country:"India",
	Pincode:"110052",
	Email:"nkg@aeronkitchens.com",
	Latitude:"28.4884099",
	Longitude:"77.0117954"
}
{
   "S.no": 1,
   "Brand": "Manufacturere2b399ea-ad89-0ecf-5206-5c564f589bf7",
   "DealerName": "B.C.Abrol & Company",
   "StreetAddress": "27C/1, Najafgarh Road, Next to BMW showroom, Moti Nagar",
   "City": "Delhi",
   "State": "New Delhi",
   "Country": "India",
   "Pincode": 110015,
   "Latitude": 28.663235,
   "Longitude": 77.1530764,
   "Country code": 91,
   "PhoneNumber": 1125114410,
   "Country code": 91,
   "TelephoneNumber": 9811080081,
   "Fax": "",
   "POC": "",
   "Email": ""
 },*/
var processingData=[];
var noExistance=[];
var noCatsFound=[];
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
function getCity(cityName,callback){
	executeView("SELECT * from records where docType=$1 AND lower(cityName)=$2",["City",cityName.trim().toLowerCase()],function(citySearchRes){
		if(citySearchRes.error){callback(citySearchRes);return;}
		if(citySearchRes.length>0){
			callback(citySearchRes[0].records);
		}else{
			console.log("City Not Found");
			var City={
			   "cityName": cityName,
			   "State": "Statef846102a-a385-40c4-eed1-5b87568a5f50",
			   "region": "Region395a6d3c-b3f6-b687-7ec3-ee08e7058f97",
			   "recordId": "City"+global.guid(),
			   "org": "public",
			   "docType": "City",
			   "author": "administrator",
			   "editor": "administrator",
			   "dateCreated": dateCreated,
			   "dateModified": dateCreated,
			   "flag":"created with script",
			   "revision": 1,
			   "@superType": "Place",
			   "@identifier": "cityName",
			   "relationDesc": [],
			   "cloudPointHostId": "wishkarma",
			   "$status": "published"
			};
			cbContentBucket.insert(City.recordId,City,function(err, result) {
				if (err) {
					if(typeof callback=="function")
						callback({"error":err});
					return;
				}
				if(typeof callback=="function")
					callback(City);
			});
		}
	});
}
function getSupplier(data,callback){
	executeView("SELECT * from records where docType=$1 AND lower(name)=$2",["Supplier",data.DealerName.trim().toLowerCase()],function(supSearchRes){
		if(supSearchRes.error){callback(supSearchRes);return;}
		if(supSearchRes.length>0){
			callback(supSearchRes[0].records);
		}else{
			console.log("Suppleir Not Found");
			var Supplier={
				"name": data.DealerName,
				"featured": "no",
				"prospect": "New",
				"about":data.DealerName,
				"sourceUrl": "",
				"website": data.Website,
				"telephone": data.PhoneNumber?("+91-"+data.PhoneNumber):"",
				"poc":data.POC,
				"bannerImage": [],
				"profileImage": [],
				"address": {
				    "streetAddress": data.StreetAddress,
				    "addressLocality": data.City,
				    "addressRegion": data.State,
				    "addressCountry": data.Country,
				    "postalCode": data.Pincode,
				    "email": data.Email,
				    "telephone": data.TelephoneNumber?("+91-"+data.TelephoneNumber):"",
				    "poc":data.POC,
				    "fax":data.Fax?("+91-"+data.Fax):""
				},
				"images": [],
				"socialIdentity": {
				    "facebook": "",
				    "google": "",
				    "twitter": "",
				    "pinterest": ""
				},
				"geoLocation": {
				    "latitude": data.Latitude,
				    "longitude": data.Longitude,
				    "locationName": ""
				},
				"esMeta": "",
				"cityName": data.City,
				"metaTitle": data.DealerName+" | Wishkarma.com",
				"metaDescription": data.DealerName+". Chat with us for the best prices",
				"recordId": "Supplier"+global.guid(),
				"org": "public",
				"docType": "Supplier",
				"author": "administrator",
			    "editor": "administrator",
			    "dateCreated": dateCreated,
			    "dateModified": dateCreated,
			    "flag":"created with script",
			    "revision": 1,
				"@superType": "Organization",
				"@identifier": "name",
				"cloudPointHostId": "wishkarma",
				"$status": "published"
			};

			if(!Supplier.address.telephone){
				Supplier.address.telephone=Supplier.telephone;
			}
			cbContentBucket.insert(Supplier.recordId,Supplier,function(err, result) {
				if (err) {
					if(typeof callback=="function")
						callback({"error":err});
					return;
				}
				if(typeof callback=="function")
					callback(Supplier);
			});
		}
	});
}
function getMfrProCatCity(MfrProCat,City,callback){
	executeView("SELECT * from records where docType=$1 AND mfrProCat=$2 AND City=$3",["MfrProCatCity",MfrProCat.recordId,City.recordId],function(mfrProCatCityRes){
		if(mfrProCatCityRes.error){callback(mfrProCatCityRes);return;}
		if(mfrProCatCityRes.length>0){
			callback(mfrProCatCityRes[0].records);
		}else{
			console.log("MfrProCatCity Not Found");
			var MfrProCatCity={
			  "mfrProCat": MfrProCat.recordId,
			  "Manufacturer": MfrProCat.Manufacturer,
			  "ProductCategory": MfrProCat.ProductCategory,
			  "City": City.recordId,
			  "cityName": City.cityName,
			  "manufacturerName": MfrProCat.mfrName,
			  "productCategoryName": MfrProCat.categoryName,
			  "mfrprocatcity":MfrProCat.mfrName+" "+MfrProCat.categoryName+" "+ City.cityName,
			  "recordId": "MfrProCatCity"+global.guid(),
			  "org": "public",
			  "docType": "MfrProCatCity",
			  "author": "administrator",
			  "editor": "administrator",
			  "dateCreated": dateCreated,
			  "dateModified": dateCreated,
			  "flag":"created with script",
			  "revision": 1,
			  "@identifier": "mfrprocatcity",
			  "relationDesc": [
			    "mfrProCat-availableIn-City",
			    "City-hasMfrProCat-mfrProCat"
			  ],
			  "cloudPointHostId": "wishkarma",
			  "$status": "draft"
			};
			MfrProCatCity["@uniqueUserName"]=MfrProCatCity.manufacturerName.trim().replace(/\W+/g,"-").toLowerCase()+"-"+MfrProCatCity.productCategoryName.trim().replace(/\W+/g,"-").toLowerCase()+"-"+MfrProCatCity.cityName.trim().replace(/\W+/g,"-").toLowerCase();
			MfrProCatCity.metaTitle=MfrProCatCity.manufacturerName+" "+MfrProCatCity.productCategoryName+" In "+MfrProCatCity.cityName+" | Wishkarma.com";
			MfrProCatCity.metaDescription="Find all "+MfrProCatCity.productCategoryName+" manufactured by "+MfrProCatCity.manufacturerName+" available in "+MfrProCatCity.cityName+". Also chat with stores and dealers near you.";
			
			cbContentBucket.insert(MfrProCatCity.recordId,MfrProCatCity,function(err, result) {
				if (err) {
					if(typeof callback=="function")
						callback({"error":err});
					return;
				}
				if(typeof callback=="function")
					callback(MfrProCatCity);
			});
		}
	});
}
function getMfrProCatCitySupplier(MfrProCatCity,Supplier,callback){
	executeView("SELECT * from records where docType=$1 AND MfrProCatCity=$2 AND Supplier=$3",["MfrProCatCitySupplier",MfrProCatCity.recordId,Supplier.recordId],function(mfrProCatCitySupRes){
		if(mfrProCatCitySupRes.error){callback(mfrProCatCitySupRes);return;}
		if(mfrProCatCitySupRes.length>0){
			callback(mfrProCatCitySupRes[0].records);
		}else{
			console.log("MfrProCatCitySupplier Not Found");
			var MfrProCatCitySupplier={
			  "MfrProCatCity": MfrProCatCity.recordId,
			  "Supplier": Supplier.recordId,
			  "Manufacturer": MfrProCatCity.Manufacturer,
			  "mfrPriority": "",
			  "ProductCategory": MfrProCatCity.ProductCategory,
			  "City": MfrProCatCity.City,
			  "recordId": "MfrProCatCitySupplier"+global.guid(),
			  "org": "public",
			  "docType": "MfrProCatCitySupplier",
			  "author": "administrator",
			  "editor": "administrator",
			  "dateCreated": dateCreated,
			  "dateModified": dateCreated,
			  "flag":"created with script",
			  "revision": 1,
			  "@identifier": "recordId",
			  "relationDesc": [
			    "MfrProCatCity-hasSupplier-Supplier",
			    "Supplier-hasMfrProCatCity-MfrProCatCity"
			  ],
			  "cloudPointHostId": "wishkarma",
			  "$status": "draft"
			};
			cbContentBucket.insert(MfrProCatCitySupplier.recordId,MfrProCatCitySupplier,function(err, result) {
				if (err) {
					if(typeof callback=="function")
						callback({"error":err});
					return;
				}
				if(typeof callback=="function")
					callback(MfrProCatCitySupplier);
			});
		}
	});
}

function getManufacturer(name,callback){
	/*getDocumentFromContent(current.Brand,function(mfrRes){
		if(mfrRes.error){callback(mfrRes);return;}
		callback(mfrRes.value)
	});*/
	executeView("SELECT * from records where docType=$1 AND lower(name)=$2",["Manufacturer",name.trim().toLowerCase()],function(mfrSearchRes){
		if(mfrSearchRes.error){callback(mfrSearchRes);return;}
		if(mfrSearchRes.length>0){
			callback(mfrSearchRes[0].records);
		}else{
			if(noExistance.indexOf(name)==-1)
			noExistance.push(name);
			callback({error:"NotFound"})
		}
	});
}
/**
 * steps
 * 1) get the mfr documemt
 * 2) get the product categories sold by the mfr
 * 3) create supplier document or get the supplier document
 * 4) loof with product categori and city
 * 	->For every pc in product categories  
 * 			create MfrProCatCity reference
 * 			create MfrProCatCitySupplier reference
 * 			
 */
if(processingData.length==0){
	return;
}else{
	processRow(0);
}

function processRow(index){
	if(index<processingData.length){
		console.log("--------------------------------");
		console.log("Processing row : "+(index+1))
		var current=processingData[index];
		getManufacturer(current.Brand,function(Manufacturer){
			if(Manufacturer.error){console.log(current.Brand+"  "+Manufacturer.error);processRow(index+1);return;}
			console.log("Manufacturere Id - "+Manufacturer.recordId);
			getSupplier(current,function(Supplier){
				console.log("Supplier Id  - "+Supplier.recordId);
				getCity(current.City,function(City){
					console.log(City.recordId)
					executeView("SELECT * from records where docType=$1 AND Manufacturer=$2",["MfrProCat",Manufacturer.recordId],function(mfrProCatRes){
						if(mfrProCatRes.error){processRow(index+1);}
						if(mfrProCatRes.length>0){
							createmfrcatcityandsup(0);
							function createmfrcatcityandsup(pcindex){
								if(pcindex<mfrProCatRes.length){
									var MfrProCat=mfrProCatRes[pcindex].records;
									console.log(pcindex+"->"+MfrProCat.recordId);
									getMfrProCatCity(MfrProCat,City,function(MfrProCatCity){
										console.log("MfrProCatCity - "+MfrProCatCity.recordId)
										getMfrProCatCitySupplier(MfrProCatCity,Supplier,function(MfrProCatCitySupplier){
											console.log("MfrProCatCitySupplier"+MfrProCatCitySupplier.recordId);
											createmfrcatcityandsup(pcindex+1);
										});
									});
								}else{
									processRow(index+1);
								}
							}
							
						}else{
							console.log("No Categories created for this manufacturer");
							if(noCatsFound.indexOf(Manufacturer.name)==-1)
							noCatsFound.push(Manufacturer.name);
							processRow(index+1);
						}
					});
				});
			});
		});
	}else{
		console.log("********************************");
		console.log("***********   DONE   ***********");
		console.log("********************************");
		console.log("NOT EXISTING MFRS");
		console.log(noExistance);
		console.log("No Cats Found");
		console.log(noCatsFound);
	}
} 