
/*

  var categoryMappings={
    "LightingID111":["L1","L2"]
  }
  1)get All distinct Manufacturers with previous category ids from MfrProCat junction
  select distinct raw Manufacturer from records where docType="MfrProCat" and ProductCategory in ["LightingID111"]
  ["M1","M2"]

  LOOP: for(var m1 mfrs){for(cat in Cats)}
  2)Get Mfr Cat Cities from MfrProCatCity
  select distinct raw City from records where docType="MfrProCatCity" and Manufacturer="M1" and ProductCategory="LightingID111"
  ["C1","C2"]
  LOOP: for(city in cities) for(newcat in catmaps["LightingID111"])
  Create New record with M1,L1,C1 (MfrProCatCity)
  Get Suppliers with M1,LightingID111,C1
  [S1,S2]
  create M1,L1,C1,S1
  create M1,L1,C1,S2

*/

var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.openBucket(records);
var global=require('../utils/global.js');

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

console.log("starting script");

var categoryMappings = {
  "ProductCategory6883b01b-f040-48d7-439d-25b9d5a42361":[
    "ProductCategoryadb4d509-5a7b-0470-42c7-fc98d9735827",
    "ProductCategorycf3b5eeb-16fe-c032-00e3-6159af7aada9",
    "ProductCategoryf0fe795c-8b39-b2cf-64b6-a587f97ea9bd",
    "ProductCategoryd5d9c694-86f8-9a60-5172-f60bca3031ea",
    "ProductCategory426adbc5-f9dd-bbba-a9f7-cc4422629459",
    "ProductCategory9d729f62-0aed-cc95-5a3a-959d01a8a830",
    "ProductCategory4b50b663-0b4b-bc4a-5872-8ff8fae0ccc4",
    "ProductCategory8a6e1ea1-ba7e-b34f-72f0-f3de9e5e98b4",
    "ProductCategorya5ce432e-3e9e-2b08-8332-478208cbdd99",
    "ProductCategory423c7467-1bed-fb42-9c04-b845e432d524",
    "ProductCategoryadb4d509-5a7b-0470-42c7-fc98d9735827"
  ]
}
var allCategories=Object.keys(categoryMappings);

executeView("select distinct raw Manufacturer from records where docType=$1 and ProductCategory in $2 and Manufacturer=$3 limit 10",
        ["MfrProCat",allCategories,"Manufacturer601a462b-afd8-772b-8fc7-d99b9c30622c"],function(mfrSearchRes){
  if(mfrSearchRes.error){console.log(mfrSearchRes);return;}
	console.log(mfrSearchRes.length);
	if(mfrSearchRes.length==0){
		console.log("Nothing found");
		console.log({error:"No Mfrs"});
	}else{
		//updateProCat(0);
    processMfr(0);
    function processMfr(mfrIndex){
      console.log("MFR INDEX "+mfrIndex)
      if(mfrIndex>=mfrSearchRes.length){
        console.log("========================================");
        console.log("processing all mfrs");
        console.log("========================================");
        return;
      }
      getCitiesWithMfrProCat(0);
      function getCitiesWithMfrProCat(allCatIndex){
        console.log("```````````````````````````````````````````")
        if(allCatIndex>=allCategories.length){
          processMfr(mfrIndex+1);
          return;
        }
        console.log("Processing "+mfrSearchRes[mfrIndex]+"  "+allCategories[allCatIndex]);
        executeView("select distinct raw City from records where docType=$1 and Manufacturer=$2 and ProductCategory=$3",["MfrProCatCity",mfrSearchRes[mfrIndex],allCategories[allCatIndex]],function(citySearchRes){
          if(citySearchRes.error || citySearchRes.length==0){
            if(citySearchRes.error) console.log(citySearchRes);
            getCitiesWithMfrProCat(allCatIndex+1);
            return;
          }
          console.log(citySearchRes);
          //var newCategoriesToCreate=categoryMappings[allCategories[allCatIndex]];
          createMfrCatCities(0);
          function createMfrCatCities(cityIndex){
            if(cityIndex>=citySearchRes.length){
              getCitiesWithMfrProCat(allCatIndex+1);
              return;
            }
            executeView("select distinct raw Supplier from records where docType=$1 and Manufacturer=$2 and ProductCategory=$3 and City=$4",
              ["MfrProCatCitySupplier",mfrSearchRes[mfrIndex],allCategories[allCatIndex],citySearchRes[cityIndex]],function(SuppSearchRes){
              if(SuppSearchRes.error){SuppSearchRes=[]};
              createCatCitiesAndSuppliers({
                Manufacturer:mfrSearchRes[mfrIndex],
                OldCategory:allCategories[allCatIndex],
                NewCategories:categoryMappings[allCategories[allCatIndex]],
                City:citySearchRes[cityIndex],
                Suppliers:SuppSearchRes
              },function(){
                createMfrCatCities(cityIndex+1);
              });
            });
          }

        });
      }
    }
  }
})








function createCatCitiesAndSuppliers(data,callback){
/*
{
  Manufacturer
  OldCategory
  NewCategories []
  City
  Suppliers []
}

*/
  var mfrRecord={};
  var catRecord={};
  var mfrCatRecord={};
  var cityRecord={};
  var supRecord={};
  console.log(data);
//getting Manufacturer and City Records
  executeView("SELECT RAW records from records use keys $1",[data.Manufacturer],function(mfrRecordRes){
    if (mfrRecordRes.error) {
        console.log(mfrRecordRes.error);
    }
    mfrRecord=mfrRecordRes[0];
    executeView("SELECT RAW records from records use keys $1",[data.City],function(cityRecordRes){
      if (cityRecordRes.error) {
          console.log(cityRecordRes.error);
      }
      cityRecord=cityRecordRes[0];
      createCatCities(0);
    })
  })

  //Looping with new Categories
  function createCatCities(newCatIndex){
    //Done with all new Categories
    if(newCatIndex>=data.NewCategories.length){
      console.log("---------"+data.Manufacturer+"-----DONE with all new categories");
      callback();
      return;
    }
    executeView("SELECT RAW records from records where docType=$1 and Manufacturer=$2 and ProductCategory=$3",["MfrProCat",data.Manufacturer,data.NewCategories[newCatIndex]],function(mfrProCatSearchRes){
      if(mfrProCatSearchRes.error || mfrProCatSearchRes.length == 0){
        if(mfrProCatSearchRes.error){
          console.log(mfrProCatSearchRes);
        }else{
          console.log(data.Manufacturer+" ****NOT RELATED****  "+data.NewCategories[newCatIndex]);
        };
        //if Not processing next record
        createCatCities(newCatIndex+1);
        return;
      }
      mfrCatRecord=mfrProCatSearchRes[0];
      //Getting the new category record
      executeView("SELECT RAW records from records use keys $1",[data.NewCategories[newCatIndex]],function(catRecord){
      if (catRecord.error) {
          console.log(catRecord.error);
          createCatCities(newCatIndex+1);
          return;
      }
      catRecord = catRecord[0];
      //Creating MfrProCatCity
      var mfrProCatCityRecord = {
            "$status": "published",
            "@identifier": "mfrprocatcity",
            "@uniqueUserName": mfrRecord.name.trim().replace(/\W+/g, "-").toLowerCase() + "-" + catRecord.categoryName.trim().replace(/\W+/g, "-").toLowerCase() + "-" + cityRecord.cityName.trim().replace(/\W+/g, "-").toLowerCase(),
            "City": data.City,
            "Manufacturer": data.Manufacturer,
            "ProductCategory": data.NewCategories[newCatIndex],
            "author": "administrator",
            "cityName": cityRecord.cityName,
            "cloudPointHostId": "wishkarma",
            "dateCreated": global.getDate(),
            "dateModified": global.getDate(),
            "docType": "MfrProCatCity",
            "editor": "administrator",
            "flag": "created with script",
            "manufacturerName": mfrRecord.name,
            "metaDescription": "Find all " + catRecord.categoryName + " manufactured by " + mfrRecord.name + "in" + cityRecord.cityName +". Also locate and chat with stores and dealers near you.",
            "metaTitle": mfrRecord.name + " " + catRecord.categoryName + "in" + cityRecord.cityName +" | Wishkarma.com",
            "mfrProCat": mfrCatRecord.recordId,
            "mfrprocatcity": mfrRecord.name + " " + catRecord.categoryName + " " + cityRecord.cityName,
            "org": "public",
            "productCategoryName": catRecord.categoryName,
            "recordId": "MfrProCatCity" + global.guid(),
            "relationDesc": [
              "mfrProCat-availableIn-City",
              "City-hasMfrProCat-mfrProCat"
            ],
            "revision": 1
          }

          createRecordInDataBase(mfrProCatCityRecord,function(crr){
            mfrProCatCityRecord=crr;
            console.log("mfrProCatCityRecord----",mfrProCatCityRecord.recordId);
            createCatCitySupplier(0);
          });
          function createCatCitySupplier(supplierIndex){
            if(supplierIndex>=data.Suppliers.length){
              //createCatCitySupplier();
              createCatCities(newCatIndex+1);
              return;
            }

            executeView("SELECT RAW records from records use keys $1",[data.Suppliers[supplierIndex]],function(supRecordRes){
                if (supRecordRes.error) {
                    console.log(supRecordRes.error);
                    createCatCitySupplier(supplierIndex+1);
                    return;
                }
                supRecord = supRecordRes[0];
                var mfrProCatCitySupRecord = {
                  "$status": "published",
                  "@identifier": "recordId",
                  "City": data.City,
                  "Manufacturer": data.Manufacturer,
                  "ProductCategory": data.NewCategories[newCatIndex],
                  "MfrProCatCity": mfrProCatCityRecord.recordId,
                  "Supplier": data.Suppliers[supplierIndex],
                  "author": "administrator",
                  "cloudPointHostId": "wishkarma",
                  "dateCreated": global.getDate(),
                  "dateModified": global.getDate(),
                  "docType": "MfrProCatCitySupplier",
                  "editor": "administrator",
                  "flag": "created with script",
                  "org": "public",
                  "recordId": "MfrProCatCitySupplier"+ global.guid(),
                  "relationDesc": [
                    "MfrProCatCity-hasSupplier-Supplier",
                    "Supplier-hasMfrProCatCity-MfrProCatCity"
                  ],
                  "revision": 1
                }

                createRecordInDataBase(mfrProCatCitySupRecord,function(crr2){
                  mfrProCatCitySupRecord=crr2;
                  console.log("mfrProCatCitySupRecord----",mfrProCatCitySupRecord.recordId);
                  createCatCitySupplier(supplierIndex+1);
                });
            })

          }

    })
  });
  }
}











function createRecordInDataBase(record,callback) {
  if(record.docType=="MfrProCatCity"){
    executeView("SELECT RAW records from records where docType=$1 and Manufacturer=$2 and ProductCategory=$3 and City=$4",
      ["MfrProCatCity",record.Manufacturer,record.ProductCategory,record.City],function(res){
      if(res.error || res.length == 0){
				console.log(res);
				console.log("Creating New ");
        cbContentBucket.upsert(record.recordId, record, function(err, result) {
            callback(record);
        });
      }else{

				console.log("Created already ");
        callback(res[0]);
      }
    });
  }else if(record.docType=="MfrProCatCitySupplier"){
    executeView("SELECT RAW records from records where docType=$1 and Manufacturer=$2 and ProductCategory=$3 and City=$4 and Supplier=$5",
      ["MfrProCatCitySupplier",record.Manufacturer,record.ProductCategory,record.City,record.Supplier],function(res){
      if(res.error || res.length == 0){
				console.log(res);
				console.log("Creating New ");
        cbContentBucket.upsert(record.recordId, record, function(err, result) {
            callback(record);
        });
      }else{
				console.log("Created already ");
        callback(res[0]);
      }
    });
  }else{
		console.log("Invalid docType");
    callback(record);
  }

}
