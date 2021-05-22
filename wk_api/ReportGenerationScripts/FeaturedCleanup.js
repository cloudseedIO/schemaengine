var couchbase = require('couchbase');

var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records="records";
var cbContentBucket=cluster.bucket(records);
var global=require('../utils/global.js');
var dateCreated="2018/01/03 16:05:00 GMT+0530";

function executeView(querystring,params,callback){
	var query = N1qlQuery.fromString(querystring);
	query.adhoc = false;
	cluster.query(query, params,function(err, results) {
		if(err){
			if(typeof callback=="function")
				callback({"error":err,"query":query,"params":params});
			return;
		}
		if(typeof callback=="function")
			callback(results);
	});
}

executeView("SELECT recordId,docType,featured,featuredDate,featuredPeriodInDays from records where docType IN $1 AND featured=$2",[["Product"],"yes"],function(featuredRecords){
	if(featuredRecords.error){console.log(featuredRecords);return;}
	if(featuredRecords.length==0){
		return;
	}else{
		console.log(featuredRecords.length);
		processRow(0);
	}
	function processRow(index){
		if(index<featuredRecords.length){
			console.log("--------------------------------");
			console.log("Processing row : "+(index+1));
			updateFeaturedRecord(featuredRecords[index],function(){
				processRow(index+1);
			});
		}else{
			console.log("********************************");
			console.log("***********   DONE   ***********");
			console.log("********************************");
		}
	}
});






function updateFeaturedRecord(data,callback){
	console.log(data);
	if(data.featuredDate && data.featuredPeriodInDays){
		var date1;
		var date2 = new Date();
		//mm//dd//yyyy
		if(data.featuredDate.match(/\d\d\/\d\d\/\d\d\d\d/)){//dd/mm/yyyy
			date1=new Date(data.featuredDate.split("/")[1]+"/"+data.featuredDate.split("/")[0]+"/"+data.featuredDate.split("/")[2])
		}
		if(data.featuredDate.match(/\d\d\d\d\/\d\d\/\d\d/)){//yyyy/mm/dd
			date1=new Date(data.featuredDate.split("/")[1]+"/"+data.featuredDate.split("/")[2]+"/"+data.featuredDate.split("/")[0])
		}
		
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
		if(diffDays>data.featuredPeriodInDays*1){
			executeView("UPDATE records set featured=undefined,featuredDate=undefined,featuredPeriod=undefined where recordId=$1 returning recordId,docType,featured,featuredDate,featuredPeriodInDays",[data.recordId],function(result){
				console.log(result);
				callback();
			});
		}else{
			callback();
		}
	}else{
		//executeView("UPDATE records set featured=undefined,featuredDate=undefined,featuredPeriod=undefined where recordId=$1 returning recordId,docType,featured,featuredDate,featuredPeriodInDays",[data.recordId],function(result){
			//console.log(result);
			callback();
		//});
	}
	
}