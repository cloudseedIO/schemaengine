var args=process.argv;
args.splice(0,2);

var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var N1qlQuery = couchbase.N1qlQuery;
var cbContentBucket=cluster.bucket("records");
var cbContentCollection=cbContentBucket.defaultCollection();

if(typeof args[0]!="string"){
  console.error("No Query");
  return;
}

var query = N1qlQuery.fromString(args[0]);
args.splice(0,1);
cluster.query(query, args,function(err, results) {
  if(err){
    console.error(err);
  }else{
    console.log(results.length);
    console.log(results);
  }
});
