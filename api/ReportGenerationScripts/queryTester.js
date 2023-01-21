var args=process.argv;
args.splice(0,2);

var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");
var N1qlQuery = couchbase.N1qlQuery;
var bucket=cluster.openBucket("records");

if(typeof args[0]!="string"){
  console.error("No Query");
  return;
}

var query = N1qlQuery.fromString(args[0]);
args.splice(0,1);
bucket.query(query, args,function(err, results) {
  if(err){
    console.error(err);
  }else{
    console.log(results.length);
    console.log(results);
  }
});
