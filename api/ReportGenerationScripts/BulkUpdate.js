var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);

var query = ViewQuery.from("Test", "NonWordCharsCheck");//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
/*
 function (doc, meta) {
  
  ["name","record_header"].map(function(key){
    if(typeof doc[key] =="string")
      if(doc[key].match(/\\|\"/g)){
       emit(key, doc[key])
      } 
  })
}
 */

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


cbContentBucket.query(query, function(err, data) {
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
		var key=data[index].key;
		var value=data[index].value.replace(/\\|\"|\'/g,"").trim();
		var recordId=data[index].id;
		executeView("UPDATE records set "+key+"='"+value+"' where recordId='"+recordId+"' returning recordId,"+key,[],function(res){
			console.log(res);
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		});
		/*var docu=data[index].value;
		var website=docu.website?docu.website:"";
		var email=docu.address?docu.address.email:"";
		if(!email){
			email="";
		}
		website=website.toLowerCase();
		email=email.toLowerCase();
		var orgDomain=docu.orgDomain;
		if(typeof orgDomain=="string"){
			orgDomain=[orgDomain];
		}else{
			orgDomain=[];
		}
		var emailDomain
		if(email){
			try{
				emailDomain=((email).split("@")[1]).split(".");
				emailDomain.splice(emailDomain.length-1,1);
				emailDomain=emailDomain.join(".");
				 if([
	              "gmail",
	              "yahoo",
	              "yahoo.co",
	              "yahoomail",
	              "email",
	              "hotmail",
	              "outlook",
	              "zoho",
	              "ymail",
	              "rediff",
	              "rediffmail"
	            ].indexOf(emailDomain)>-1){
					 emailDomain=undefined;
				 }
			}catch(err){
				
			}
		}
		website=website.replace(/http:/g,"");
		website=website.replace(/https:/g,"");
		website=website.replace(/\/\//,"");
		website=website.replace(/www\./g,"");
		website=website.split(".")[0];
		if(website && orgDomain.indexOf(website)==-1){
			orgDomain.push(website);
		}
		//if(emailDomain && orgDomain.indexOf(emailDomain)==-1 ){orgDomain.push(emailDomain);}
		//console.log(orgDomain)
		console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             "+orgDomain);	
		docu.orgDomain=orgDomain;
		docu.odFlag=true;
		cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
			if (err) { console.log(err); }
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		});*/
	}
});


