var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.openBucket(records);
var global=require('../utils/global.js');
var dateCreated=global.getDate();

var suppliers=[]
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
if(suppliers.length==0){
	return;
}else{
	processRow(0);
}

function processRow(index){
	if(index<suppliers.length){
		console.log("--------------------------------");
		console.log("Processing row : "+(index+1))
		updateSupplier(suppliers[index],function(){
			processRow(index+1);
		});
	}else{
		console.log("********************************");
		console.log("***********   DONE   ***********");
		console.log("********************************");
	}
}

function updateSupplier(data,callback){
	executeView("SELECT * from records where docType=$1 AND name=$2",["Supplier",data.DealerName],function(supSearchRes){
		if(supSearchRes.error){callback(supSearchRes);return;}
		if(supSearchRes.length>0){
			var supplier=supSearchRes[0].records;
			var newSupplier=JSON.parse(JSON.stringify(supSearchRes[0].records));
			newSupplier.website=data.Website;
			newSupplier.telephone=data.PhoneNumber?("+91-"+data.PhoneNumber):"";
			newSupplier.address={
					    "streetAddress": data.StreetAddress,
					    "addressLocality": data.City,
					    "addressRegion": data.State,
					    "addressCountry": data.Country,
					    "postalCode": data.Pincode,
					    "email": data.Email,
					    "telephone": data.TelephoneNumber?("+91-"+data.TelephoneNumber):"",
					    "poc":data.POC,
					    "fax":data.Fax?("+91-"+data.Fax):""
			};
			if(!newSupplier.address.telephone){
				newSupplier.address.telephone=newSupplier.telephone;
			}
			newSupplier.poc=data.POC;
			newSupplier.dateModified=dateCreated;
			newSupplier.poc=data.POC;
			
			console.log(newSupplier.recordId+"-->"+newSupplier.telephone+"-->"+newSupplier.address.telephone+"-->"+newSupplier.address.fax);
			
			cbContentBucket.upsert(newSupplier.recordId,newSupplier,function(err, result) {
				if (err) {
					if(typeof callback=="function")
						callback({"error":err});
					return;
				}
				if(typeof callback=="function")
					callback(newSupplier);
			});
		}else{
			console.log(data.DealerName);
			console.log("Suppleir Not Found");
			callback();
		}
	});
}
