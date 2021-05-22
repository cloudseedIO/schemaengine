var q = require('q'),
fs = require("fs"),
jwt = require('jsonwebtoken'),
path = require('path'),
db = require('../config/configsfromdb.js'),
BoxSDK = require('box-node-sdk');

var util = {
/*
get the client (enterprise) account dynamically from config/db (currently loading from config)
x-business-id is required to be sent through header
*/
 getCl: function(conf, req){
     var sdk = new BoxSDK(conf), _ret, it=this, deferred = q.defer(); // load business dev config
      client=sdk.getAppAuthClient('enterprise', conf.businessId); //retrieve client
      if(req.params.excludeAction) //exclude token check for actions like login
        deferred.resolve(client); // pass direct client without authorizing user (for login)
      else{
        //authenticate user tokens, and return client object
         it.tokenGen(req, client).then(function(tokn){
                 console.log(tokn.message);
                 deferred.resolve(tokn);
         });
      }
   return deferred.promise;
 },
 getClient: function(req){
  var it = this, deferred = q.defer(), configMode = 'json'; //configMode = json|db
   if(configMode === 'db'){  //reading from db file
     var businessId = req.headers['x-business-id'];
     db.getConfig(businessId, function(conf, req){
       it.getCl(conf, req).then(function(clt){
          deferred.resolve(clt);
        });
     });
   }
   if(configMode === 'json'){  //reading from config file
     var businessId = (req.headers['x-business-id'])?req.headers['x-business-id']:'32490063';
    fs.readFile('./config/config.json', 'utf8', function (err, data){
    if (err) throw err;
    var _opts = JSON.parse(data);
     for(i in _opts){
       //match the passed businessId received from header
        if(businessId == _opts[i].businessId){
          it.getCl(_opts[i], req).then(function(clt){
            deferred.resolve(clt);
          });
          break;
        }
     }
  });
  }
    return deferred.promise;
},
/*
  Out of box functionality from BOX.COM, to authenticate by email.
  Lookup in users.json file with email, if user found pick userId use [asUser]; If not exist, get all users from businessAccount insert
  into users.json and return userID.
*/
getUserFromJSON: function(req){
 var email = (req.headers['x-user-email'] || req.params.userEmail || req.body.userEmail),
  deferred = q.defer(),
  userJsonPath='./config/users.json';
  //if(!email) email = 'avinashpaladugu@lakshman.net'; //_testing
  fs.readFile(userJsonPath, 'utf8', function (err, data) {
    if (err) throw err;
    var users = JSON.parse(data), userExist = false;
   for(var i in users){
      if(email == users[i].login){
        userExist = true;
        deferred.resolve(users[i]);
      }
   }

    if(!userExist){
          client.enterprise.getUsers(null, function(){}).then(function(data){
                  if(data.hasOwnProperty('entries')){
                       var userData = data.entries
                          for(var i in userData){
                              if(email == userData[i].login){
                                  users.push(userData[i]);
                                  fs.writeFile(userJsonPath, JSON.stringify(users), 'utf8', function(){
                                    userExist = true;
                                    deferred.resolve(userData[i]);
                                  });
                                  break;
                              }
                          }
                        if(!userExist) deferred.resolve(null);
                  }
          });
    }
  });
    return deferred.promise;
},
getFields: function(param){
  var _opt = {fields:param}
  if(param === null || param == 'null' || param == ' ') _opt = {};
  return _opt;
},
/*Common function to process REST response*/
tokenGen:function(req,client){
/*check if the user is logged in, if not respond with request failure message,
  else if userId is available in session, use as-user to bypass service account to app user account*/
  //console.log(req.body.isSandbox,req.query.isSandbox );
 var deferred = q.defer();
  if(!req.query.isSandbox && !req.body.isSandbox){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if(token){
    // verifies secret and checks exp
    jwt.verify(token, 'RESTFULAPIs', function(err, decoded) {
      if (!err){
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        console.log(req.decoded);
        client.asUser(decoded.userId);
       deferred.resolve({ success: true, client:client, message:'token verified'});
      }else
        deferred.resolve({ success: false, message: 'Failed to authenticate token.'})
    });
  }else {
     deferred.resolve({ success: false, message: 'No token provided.'});
  }
  }else{
    var userEmail = (req.headers['x-user-email'] || req.params.userEmail || req.body.userEmail);
    if(userEmail){
       //if(req.headers['x-user'] == '2809785160') client.asSelf();
       this.getUserFromJSON(req).then(function(user){
            if(user){
                client.asUser(user.id);
                deferred.resolve({success: true, client:client, message:'sanbox user bypass' });
            }else deferred.resolve({success:false, message: 'not a valid user'});
       });
    }else{
      client.asSelf();
      deferred.resolve({ success: true, client:client,  message: 'sanbox default user'});
    }
  }
  return deferred.promise;
},
reqBodySerialize: function(bdy){
  var jsonString = JSON.stringify(bdy);
  jsonString = jsonString.replace(/'true'|"true"/gi, true);
   jsonString = jsonString.replace(/'false'|"false"/gi, false);
   return JSON.parse(jsonString);
},
  /*
    commom gateway function to process all requests
  */
processReq: function(fn, res, req){
    var it = this;
    this.getClient(req).then(function(obj){
     if(obj.success){ //if promise returns client
       //console.log(fn);
      eval(`obj.${fn}`).then(function(data){
        res.end(JSON.stringify(data));
        //if the call is from fileupload, clear temp uploads folder after successful upload
        if(fn.indexOf('client.files.upload')!=-1){
          it.clearUploads('./upload');
        }
      }).catch(err => res.end(JSON.stringify(err)));
     }else res.end(JSON.stringify(obj));
     });
},
  clearUploads: function(dir){
    fs.readdir(dir, (err, files) => {
      for (file of files) {
        fs.unlink(path.join(dir, file), err => {
          console.log(err);
        });
      }
  });
  }
}//end obj
module.exports = util;
