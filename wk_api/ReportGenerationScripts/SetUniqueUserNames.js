var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var bucket=cluster.openBucket("records");
var query = ViewQuery.from("Test", "test")//.skip(40000).limit(10000).stale(ViewQuery.Update.BEFORE);



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
		//Manufacturer
		if(docu.docType=="Manufacturer"){
			//SLUG:  w.com/<Mfr Short Name>
			if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				console.log(docu.name.replace(/\W/g,"").toLowerCase()+" UserName Set");
				docu["@uniqueUserName"]=docu.name.replace(/\W/g,"").toLowerCase();
			}
			if(!docu.metaTitle){
				docu.metaTitle=docu.name+" | Wishkarma.com";
			}
			if(!docu.metaDescription){
				docu.metaDescription="Find all products manufactured by "+ docu.name+". Also locate and chat with stores and dealers in India.";
			}
		}
		
		//ProductCategory
		if(docu.docType=="ProductCategory"){
			//SLUG: w.com/<Product Category>
			if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.categoryName.trim().replace(/\W+/g,"-").toLowerCase();
			}
			docu.metaTitle=docu.categoryName+" | Wishkarma.com";
			docu.metaDescription="Find all "+docu.categoryName+" manufactured by the world's leading brands. Also locate and chat with stores and dealers near you.";
		}
		
		//MfrProCat
		if(docu.docType=="MfrProCat"){
			//if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.mfrName.trim().replace(/\W+/g,"-").toLowerCase()+"-"+docu.categoryName.trim().replace(/\W+/g,"-").toLowerCase();
			//}
			//docu.metaTitle=docu.categoryName+" By "+docu.mfrName;
			docu.metaTitle=docu.mfrName+" "+docu.categoryName+" | Wishkarma.com";
			//docu.metaDescription="All "+docu.categoryName+" manufactured by "+docu.mfrName;
			docu.metaDescription="Find all "+docu.categoryName+" manufactured by "+docu.mfrName+". Also locate and chat with stores and dealers near you.";
		}
		
		//MFR-PROCAT-CITY
		if(docu.docType=="MfrProCatCity"){
			if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.manufacturerName.replace(/\W/g,"").toLowerCase()+"-"+docu.productCategoryName.replace(/\W/g,"").toLowerCase()+"-"+docu.cityName.replace(/\W/g,"").toLowerCase();
			}
			docu.metaTitle=docu.manufacturerName+" "+docu.productCategoryName+" In "+docu.cityName+" | Wishkarma.com";
			docu.metaDescription="Find all "+docu.productCategoryName+" manufactured by "+docu.manufacturerName+" available in "+docu.cityName+". Also chat with stores and dealers near you.";
		}

		//collection
		if(docu.docType=="collection"){
			//SLUG: w.com/<Mfr Name>-<Collection Name> 
			if(docu.mfrName && docu.mfrName!=""){
				if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
					docu["@uniqueUserName"]=docu.mfrName.replace(/\W/g,"").toLowerCase()+"-"+docu.collection.replace(/\W/g,"").toLowerCase();
				}
				docu.metaTitle = docu.mfrName+" - "+docu.collection+" | Wishkarma.com";
				docu.metaDescription = "Find all products in "+docu.collection+" by "+docu.mfrName+".";
				
			}else{
				if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
					docu["@uniqueUserName"]=docu.collection.replace(/\W/g,"").toLowerCase();
				}
				docu.metaTitle = docu.collection+" | Wishkarma.com";
				docu.metaDescription = "Find all products in "+docu.collection+".";
			}
		}
		
		//Supplier
		
		if(docu.docType=="Supplier"){
			if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.name.replace(/\W/g,"").toLowerCase();
			}
			docu.metaTitle=docu.name+" | Wishkarma.com";
			docu.metaDescription=docu.name+". Chat with us for the best prices";// on <ProCats> by <Mfrs>";
		}
		
		//ARCHITECTS
		if(docu.docType=="Provider"){
			if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.name.replace(/\W/g,"").toLowerCase();
			}
			if(docu.address && docu.address.addressLocality && docu.address.addressLocality!=""){
				docu.metaTitle=docu.name+" | "+docu.address.addressLocality+" | Wishkarma.com";
			}else{
				docu.metaTitle=docu.name+" | Wishkarma.com";
			}
			docu.metaDescription=docu.name+": Find our portfolio of projects. Chat with us to discover the right design option for you.";
		}
		
		
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
			docu.metaTitle=docu.esMeta.trim()+" "+ docu.name.trim().substr(0.40)+" "+docu.mfrProductNo.trim()+" | Wishkarma.com";
			docu.metaDescription=docu.esMeta+" "+ docu.name+" "+docu.mfrProductNo+". Find and chat with local suppliers and dealers near you."
		}
		
		//ServiceProvider specialities
		if(docu.docType=="ServiceProvider"){
			var specialities=[];
			if(docu.specialities && Array.isArray(docu.specialities)){
				specialities=JSON.parse(JSON.stringify(docu.specialities));
			}
			if(!docu["@uniqueUserName"] || docu["@uniqueUserName"]==""){
				docu["@uniqueUserName"]=docu.name.replace(/\W/g,"").toLowerCase();
			}
			var Title="";
			if(specialities.length>0){
				for(var i=0;i<3;i++){
					if(i<specialities.length){
						Title+=specialities[i]+" ";
					}
				}
			}
			Title=Title.trim();
			if(docu.address && docu.address.addressLocality && docu.address.addressLocality!=""){
				Title+=" | "+docu.address.addressLocality;
			}
			Title+=docu.name+" | Wishkarma.com";
			docu.metaTitle=Title;
			docu.metaDescription=docu.name+": "+(specialities?("Experts in "+specialities+". "):"")+"Browse through our portfolio of projects. We offer best prices for Wishkarma customers.";
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

