var CouchBaseUtil=require('./CouchBaseUtil');


setTimeout(function(){
	CouchBaseUtil.getDocumentByIdFromMasterBucket("MYCASTEST",function(response){
		console.log(response);
		var doc=response.value;
		var cas=response.cas;
		doc.vikram="jakkampudi";
		
		CouchBaseUtil.upsertDocumentInMasterBucket("MYCASTEST",doc,function(resp){
			console.log(resp);
			doc.jakkampudi="vikram"
			CouchBaseUtil.upsertDocumentInMasterBucket("MYCASTEST",doc,function(resp){
				console.log(resp);
			},{cas:cas})
		},{cas:cas})
		
		doc.n="t";
		CouchBaseUtil.upsertDocumentInMasterBucket("MYCASTEST",doc,function(resp){
			console.log(resp);
			doc.t="n"
			CouchBaseUtil.upsertDocumentInMasterBucket("MYCASTEST",doc,function(resp){
				console.log(resp);
			},{cas:cas})
		},{cas:cas})
	});
},1000);