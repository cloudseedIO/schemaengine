var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var cbContentBucket=cluster.bucket("records");
var cbMasterBucket=cluster.bucket("schemas");
var cbContentCollection=cbContentBucket.defaultCollection();


//var query = ViewQuery.from("UpdationScriptViews", "dateUpdate").skip(0).limit(5000).stale(ViewQuery.Update.BEFORE);
var query=await cbContentBucket.viewQuery("UpdationScriptViews", "dateUpdate",skip(0),limit(5000));
cluster.query(query, function(err, data) {
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
		
		if(typeof docu.createdOn == "string"){
			docu.dateCreated=docu.createdOn;
		}else if(typeof docu.createdOn == "object"){
			docu.dateCreated=docu.createdOn.date+" "+docu.createdOn.time;
		}
		delete docu.createdOn;
		
		var keys=["dateCreated","dateModified"];
		for(var i=0;i<keys.length;i++){
			var currDate=docu[keys[i]];
			console.log("Before "+"- "+keys[i]+"  -  "+currDate)
			if(currDate && currDate.match(/\d\d\/\d\d\/\d\d\d\d\s\d\d:\d\d IST/)){
				var dateNos=currDate.split(" ")[0].split("/");
				var time=currDate.split(" ")[1];
				if(time.split(":").length==2){
					time+=":00";
				}
				docu[keys[i]]=dateNos[2]+"/"+dateNos[1]+"/"+dateNos[0]+" "+time+" GMT+0530";
			}else if(currDate && (currDate.match(/\d-\d-\d\d\d\d/) || currDate.match(/\d\d-\d-\d\d\d\d/) || 
					currDate.match(/\d-\d\d-\d\d\d\d/) ||
					currDate.match(/\d\d-\d\d-\d\d\d\d/))){
				var dateNos=currDate.split(" ")[0].split("-");
				if(dateNos[0].length==1){
					dateNos[0]="0"+dateNos[0];
				}
				if(dateNos[1].length==1){
					dateNos[1]="0"+dateNos[1];
				}
				var time="00:00:00";
				docu[keys[i]]=dateNos[2]+"/"+dateNos[1]+"/"+dateNos[0]+" "+time+" GMT+0530";
			}else{
				var dateNos=["01","05","2018"];
				var time="00:00:00";
				docu[keys[i]]=dateNos[2]+"/"+dateNos[1]+"/"+dateNos[0]+" "+time+" GMT+0530";
			}
			console.log("After "+"- "+keys[i]+"  -  "+docu[keys[i]])
		}
		console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
		cbContentCollection.upsert(docu.recordId,docu,function(err, result) {
			if (err) { console.log(err); }
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		});
	}
});

