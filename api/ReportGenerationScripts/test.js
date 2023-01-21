var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var cbBucket=cluster.openBucket("keywords");


cbBucket.setTranscoder(function(value) {
	return {
		value: new Buffer(JSON.stringify(value), 'utf8'),
		flags: 0
	};
}, function(doc) {
	return JSON.parse(doc.value.toString('utf8'));
});


var keywords=[
              "Toilet",
              "Faucet",
              "Bathroom",
              "Kitchen",
              "Living Room",
              "Beds",
              "Sofa",
              "Fan",
              "Home",
              "Building",
              "cloudseed"
              ];

create(0);
function create(index){
	console.log(index+ " "+ keywords[index]);
	if(index<keywords.length){
		cbBucket.upsert(keywords[index], keywords[index] , function(err, res) {
			if (err) {
				console.log('operation failed', err);
				return;
			}
			create(index+1);
		});
	}else{
		console.log("Done Creating");
	}
}