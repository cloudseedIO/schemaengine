/*
@Author: Lakshman Veti
REST Gateway Connector
*/

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var config=require('../config/ReactConfig');
config=config.init;

var express = require('express'),
bodyParser = require('body-parser'),
http = require('http'),
request = require('request'),
cors = require('cors'),
multer = require('multer'),
path  = require('path'),
fs = require("fs"),
jwt = require('jsonwebtoken'),
//session = require('express-session'),
util = require('./config/util.js'),
q = require('q'), strm = {},
app = express(), _tmpFileUploadPath = 'upload/';
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, _tmpFileUploadPath)
  },
  filename: function (req, file, cb) {
    //var extArray = file.mimetype.split("/");
    //var extension = extArray[extArray.length - 1];
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage });
app.use(express.static(path.join(__dirname,'docs')));
app.use(cors());
/* app.use(bodyParser.urlencoded({
   extended: false
})); */
app.use(bodyParser.json());
//app.use(session({secret: "SECSALT"}));
//app.set('superSecret', 'PReVYGMsZTLQ1ixB7VTlKzucrpYxrEuB');

//getClient('32490063'); //default client

//authenticate app users
app.get('/login/:userEmail', function (req, res) {
   req.params.excludeAction = true;
  util.getClient(req).then(function(client){
    util.getUserFromJSON(req).then(function(user){
      if(!user) res.end(JSON.stringify({success: false, message: 'User not found.'}));
      client.users.get(user.id, null,  function(){}).then(function(data){
        if(!data.hasOwnProperty('id')){
            res.end(JSON.stringify(data));
        }else{
            var token = {token: jwt.sign({ login: data.login, userId: data.id}, 'RESTFULAPIs'), id: data.id};
            res.end(JSON.stringify(token));
          }
      })
    .catch(err => res.end(JSON.stringify(err)));
    });
  });
});

app.get('/token/get', function(req, res){
  var clientId="rt80u53n2vbqv20vxhlihjkftu2xhwye", clientSecret="GZPOwodgdjl9Ho1kwwRMyn2lQeVEsnLk",
      grantType= "authorization_code", code="ODt7HmVmS95ts8AbplUV942vMNiBACz4"

   request({
                    uri: 'https://api.box.com/oauth2/token',
                    method: 'POST',
                    form:{
                              "clientID": "rt80u53n2vbqv20vxhlihjkftu2xhwye",
                              "clientSecret": "GZPOwodgdjl9Ho1kwwRMyn2lQeVEsnLk",
                              "grant_type":"authorization_code",
                              "code":"ODt7HmVmS95ts8AbplUV942vMNiBACz4"
                         }
              },
              function(err, re, body){
               console.log(re);
                 res.end(body);
              });
});

//upload file by multipart post
app.post('/file/upload/:folderId', upload.single('file'), function(req, res){
    var target_path = _tmpFileUploadPath + req.file.originalname;
    stream = fs.createReadStream(target_path);
    if(req.body.asVersion && req.body.asVersion.toLowerCase() == 'true'){
    util.processReq('client.files.uploadNewFileVersion(req.params.folderId, stream, function(){})',res,req);
    }
    else{
    util.processReq('client.files.uploadFile(req.params.folderId, req.file.originalname, stream, function(){})',res,req);
    }
});

/*
Get file download URL
The download URL of a file an be retrieved by calling files.getDownloadURL(fileID, qs, callback). It returns the URL as a string.
});
*/
app.get('/file/downloadUrl/:fileId', function (req, res) {
  //req.headers['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbiI6Imxha3NobWkudmV0aUBnbWFpbC5jb20iLCJ1c2VySWQiOiIyODE0MDEzNjI4IiwiaWF0IjoxNTEwNjY5MzQ3fQ.D6kF-qwctXgmOUHdWIpMRIiKwf0PyHidMRDqzipPU08';
 util.processReq('client.files.getDownloadURL( req.params.fileId, null , function(){})',res,req);
});

/*
Get File Info
Requesting information for only the fields you need with the `fields` query
string parameter can improve performance and reduce the size of the network
request.
*/
app.get('/file/get/:fileId/:fields', function (req, res) {
 util.processReq("client.files.get(req.params.fileId,  util.getFields(req.params.fields),  function(){})",res,req);
});

/*Update a File
Updating a file's information is done by calling files.update(fileId, options, callback) with the fields to be updated.*/
app.post('/file/update/:fileId', function (req, res) {
 util.processReq('client.files.update(req.params.fileId, req.body, function(){})',res,req);
});

/*Delete a File
Calling the files.delete(fileID, callback) method will move the file to the user's trash.*/
app.post('/file/delete/:fileId', function (req, res) {
   if(req.body.hasOwnProperty('isPermanent') && req.body.isPermanent == true )
      util.processReq('client.files.deletePermanently(req.params.fileId , function(){})',res,req);
     else
      util.processReq('client.files.delete( req.params.fileId , function(){})',res, req);
});

/*Copy a File
A file can be copied to a new folder with the files.copy(fileID, newParentID, callback) method.
client.files.copy('12345', '0', callback);*/
app.post('/file/copy/:fileId/:newParentId', function (req, res) {
 util.processReq('client.files.copy( req.params.fileId, req.params.newParentId , req.body,  function(){})',res,req);
});

/*Lock a File
A file can be locked, which prevents other users from editing the file, by calling the files.lock(fileID, options, callback) method You may optionally prevent other users from downloading the file, as well as set an expiration time for the lock.
expires_at: '2018-12-12T10:55:30-08:00'
*/
app.post('/file/lock/:fileId', function (req, res) {
 req.body = util.reqBodySerialize(req.body);
 util.processReq('client.files.lock( req.params.fileId, req.body , function(){})',res,req);
 /* client.post('/files/'+req.params.fileId, {body: req.body}, function(err, response) {
		if (!err) {
			res.end(JSON.stringify(response));
		} else {
			res.end(JSON.stringify(err));
		}
		});*/
});

/*Unlock a File
A file can be unlocked by calling the files.unlock(fileID, callback) method.
client.files.unlock('12345', callback);*/
app.get('/file/unLock/:fileId', function (req, res) {
 util.processReq('client.files.unlock( req.params.fileId , function(){})',res,req);
});

/*Get File Versions
Retrieve a list of previous versions of a file by calling the files.getVersions(fileID, qs, callback).;*/
app.get('/file/versions/:fileId/:fields', function (req, res) {
 util.processReq('client.files.getVersions( req.params.fileId ,  util.getFields(req.params.fields), null, function(){})',res,req);
});

/**
@Folders
Get a Folder's Information
Folder information can be retrieved by calling the folders.get(folderID, queryString, callback) method.
Use the queryString parameter to specify the desired fields.
**/
app.get('/folder/get/:folderId/:fields', function (req, res) {
 util.processReq('client.folders.get(req.params.folderId,  util.getFields(req.params.fields), function(){})',res,req);
});

//get folder items/contents by folderId, if none passed returns root folder(id:0) contents
app.post('/folder/Items/:folderId', function (req, res) {
  util.processReq('client.folders.getItems(req.params.folderId, req.body, function(){})',res,req);
});

//create new folder by parentFolderId, if parentFolderId is emptry takes root folder(id:0)
app.get('/folder/create/:parentFolderId/:newFolderName', function (req, res) {
  util.processReq('client.folders.create( req.params.parentFolderId, req.params.newFolderName, function(){})',res,req);
});

/*
Update a Folder's Information
Updating a folder's information is done by calling the folders.update(folderID, queryString, callback) method.
*/
app.post('/folder/update/:folderId', function (req, res) {
 util.processReq('client.folders.update(req.params.folderId, req.body, function(){})',res,req);
});

/*
Copy folder to different parentFolderId
Call the folders.copy(folderId, destinationFolderID, callback) method to copy a folder to another folder.
An optional name parameter can also be passed to rename the folder on copy. This can be used to avoid a name conflict when there is already an item with the same name in the target folder.
*/
app.post('/folder/copy/:folderId/:destinationFolderId', function (req, res) {
 util.processReq('client.folders.copy(req.params.folderId,req.params.destinationFolderId, req.body, function(){})',res,req);
});

/*
Delete a Folder
A folder can be deleted with the folders.delete(folderID, qs, callback) method.
recursive:true, removes folder contents too.
*/
app.post('/folder/delete/:folderId', function (req, res) {
 util.processReq('client.folders.delete(req.params.folderId, req.body, function(){})',res,req);
});

/*Group*/
/*
To create a new group, call the groups.create(name, options, callback) method
*/
app.post('/group/create/:groupName', function (req, res) {
  util.processReq('client.groups.create(req.params.groupName, req.body, function(){})', res,req);
});

/*To retrieve the information for a group, call the groups.get(groupID, options, callback) method.*/
app.get('/group/get/:groupId/:fields', function (req, res) {
    util.processReq('client.groups.get(req.params.groupId, util.getFields(req.params.fields),function(){})', res,req);
});

/*
Update Group
To change the properties of a group object, call the method with `options` being the set of properties to update.*/
app.post('/group/update/:groupId', function (req, res) {
  util.processReq('client.groups.update(req.params.groupId, req.body, function(){})', res,req);
});

/*
Delete Group
To delete a group, call the below method.
*/
app.post('/group/delete/:groupId', function (req, res) {
  util.processReq('client.groups.delete(req.params.groupId, function(){})', res,req);
});

/*Returns all of the groups for given enterprise. Must have permissions to see an enterprise's groups.*/
app.get('/group/getEnterpriseGroups/:fields/:like', function (req, res) {
   util.getClient(req).then(function(obj){
    if(obj.success){
      var tempUrl = '/groups?', _prms=[];
      if(req.params.fields!='null')_prms.push('fields='+req.params.fields);
      if(req.params.like!='null')_prms.push('name='+req.params.like);
      tempUrl+=_prms.join('&');
      obj.client.get(tempUrl, null, function(err, response) {
        if (!err) res.end(JSON.stringify(response));
        else res.end(JSON.stringify(err));
        });
      }else res.end(JSON.stringify(obj));
   });
});


/*To add a user to a group, call the groups.addUser(groupID, userID, options, callback) method.*/
app.post('/group/addMember/:groupId/:userId', function (req, res) {
 util.processReq('client.groups.addUser(req.params.groupId, req.params.userId, req.body.role, function(){})',res,req);
});

/*
To retrieve information about a specific membership record, which shows that a given user is in the group, call the groups.getMembership(membershipID, options, callback) method.
*/
app.get('/group/getMembership/:membershipId', function (req, res) {
 util.processReq('client.groups.getMembership( req.params.membershipId, null, function(){})',res,req);
});

/*
To retrieve all members of a group, user groups.getMemberships(groupID, options, callback) method.
*/
app.get('/group/getMemberships/:groupId/:limit', function (req, res) {
 util.processReq("client.groups.getMemberships( req.params.groupId, req.params.limit!='null'?{limit:req.params.limit}:null, function(){})",res,req);
});

/*
Update Membership
To update a membership record, call the groups.updateMembership(membershipID, options, callback)`]
method with `options` being the properties to update.
// Promote a user to group admin pass param 'role'
{role: client.groups.userRoles.ADMIN}
*/
app.post('/group/updateMembership/:membershipId', function (req, res) {
  util.processReq('client.groups.updateMembership(req.params.groupId,req.body, function(){})', res,req);
});

/*
Remove Membership
To remove a specific membership record, which removes a user from the group, call the
[`groups.removeMembership(membershipID, callback)`]
method with the ID of the membership record to remove.
*/
app.post('/group/removeMember/:membershipId', function (req, res) {
  util.processReq('client.groups.removeMembership(req.params.membershipId, function(){})', res,req);
});

/*
@Collaborations
Collaborations are used to share folders between users or groups. They also define what permissions a user has for a folder.
*/
/*A collaboration can be added for an existing user with
collaborations.createWithUserID(userID, itemID, role, options, callback).
The role parameter determines what permissions the collaborator will have on the folder.
You can create a collaboration on a file by setting the type option to 'file'*/
app.post('/collaboration/create', function (req, res) {
   util.getClient(req).then(function(obj){
    if(obj.success){
      obj.client.post('/collaborations', {body: req.body}, function(err, response) {
          if (!err) res.end(JSON.stringify(response));
          else res.end(JSON.stringify(err));
        });
      }else res.end(JSON.stringify(obj));
     });
});

app.post('/collaboration/update/:collaborationId', function (req, res) {
    util.processReq('client.collaborations.update(req.params.collaborationId, req.body, function(){})',res,req);
});


app.post('/collaboration/delete/:collaborationId', function (req, res) {
  util.processReq('client.collaborations.delete(req.params.collaborationId, function(){})',res,req);
});

app.get('/collaboration/get/:collaborationId/:fields', function (req, res) {
     util.processReq('client.collaborations.get(req.params.collaborationId, util.getFields(req.params.fields), function(){})',res,req);
});

/*Get the Collaborations on a Folder & File
You can get all of the collaborations on a folder by calling folders.getCollaborations(folderID, qs, callback) on the folder,
files.getCollaborations(fileID, options, callback) with the ID of the file.
*/
app.get('/collaborations/get/:itemId/:type', function (req, res) {
     if(req.params.type.toLowerCase() == "folder")
     util.processReq('client.folders.getCollaborations(req.params.itemId, util.getFields(req.params.fields), function(){})',res,req);
    else
    util.processReq('client.files.getCollaborations(req.params.itemId, util.getFields(req.params.fields), function(){})',res,req);
});

/*@Users
Users represent an individual's account on Box.*/
app.post('/user/create', function (req, res) {
  util.getClient(req).then(function(obj){
    if(obj.success){
      req.body.login = decodeURIComponent(req.body.login);
      obj.client.post('/users', {body: req.body}, function(err, response) {
        if (!err) {res.end(JSON.stringify(response));
        } else {res.end(JSON.stringify(err));}
      });
    }else res.end(JSON.stringify(obj));
    });
});

/*Get all enterprise users*/
app.get('/user/getEnterpriseUsers/:userType', function (req, res) {
  util.getClient(req).then(function(obj){
    if(obj.success){
    obj.client.get('/users?user_type='+req.params.userType, null, function(err, response) {
      if (!err) { res.end(JSON.stringify(response));}
      else {res.end(JSON.stringify(err));}
      });
      }else res.end(JSON.stringify(obj));
  });
});

/*Get User's Information
To get a user call the users.get(userID, queryString, callback) method.*/
app.get('/user/get/:userId/:fields', function (req, res) {
 util.processReq('client.users.get(req.params.userId, util.getFields(req.params.fields),  function(){})',res,req);
});

app.get('/user/avatar/:userId', function (req, res) {
   util.getClient(req).then(function(obj){
    if(obj.success){
      obj.client.get('/users/'+req.params.userId+'/avatar', {body: req.body}, function(err, response) {
          if (!err){
        	  if(response && response.statusCode=="200"){
        	  var t=new Buffer(response.body);
        	  res.set("accept-ranges",response.headers["accept-ranges"]);
        	  res.set("content-disposition",response.headers["content-disposition"]);
        	  res.set("content-length",response.headers["content-length"]);
        	  res.set("content-type",response.headers["content-type"]);
        	  res.end(t);      	  
        	  }else{
        		 res.status(404);
        		 res.end();
        	  }
          } else {
     		 res.status(404);
    		 res.end();
          }
        });
      }else {
 		 res.status(404);
 		 res.end();
      }
     });
});

/*
Update User
To update a user call the users.update(userID, options, callback) method where options contains the fields to update*/
app.post('/user/update/:userId', function (req, res) {
 util.processReq('client.users.update(req.params.userId, req.body, function(){})',res,req);
});

/*Delete User
To delete a user call the users.delete(userID, qs, callback) method.
If the user still has files in their account and the force parameter is not sent, an error is returned.
client.users.delete('123', null, callback);
// Delete the user even if they still have files in their account
client.users.delete('123', {force: true}, callback);*/
app.post('/user/delete/:userId', function (req, res) {
 util.processReq('client.users.delete(req.params.userId, req.body, function(){})',res,req);
});


/*Invite non-business user to enterprise*/
app.post('/user/invite', function (req, res) {
  util.processReq('client.enterprise.inviteUser(req.body.enterprise.id, req.body.actionable_by.login, function(){})',res,req);
});

/*
@Comments
Comment objects represent a user-created comment on a file. They can be added directly to a file.
*/
//Calling comments.get(commentId, qs, callback) on a comment returns a snapshot of the comment's info.
app.get('/comment/get/:commentId/:fields', function (req, res) {
 util.processReq('client.comments.get(req.params.commentId, util.getFields(req.params.fields),  function(){})',res,req);
});

//You can get all of the comments on a file by calling the files.getComments(fileId, qs, callback) method.
app.get('/comments/get/:fileId', function (req, res) {
    util.getClient(req).then(function(obj){
      if(obj.success){
        //console.log(req.query);
         obj.client.get(`/files/${req.params.fileId}/comments`, req.query,  function(err, response) {
            if (!err) res.end(JSON.stringify(response));
            else res.end(JSON.stringify(err));
          });
        }else res.end(JSON.stringify(obj));
  });
});


/*A comment can be added to a file with the comments.create(fileId, text, callback) method.
A comment's message can also contain @mentions by using the string @[userid:username] anywhere within the message,
where userid and username are the Id and username of the person being mentioned. [See the documentation]
(https://developers.box.com/docs/#comments-comment-object) on the tagged_message field for more information on @mentions.
To make a tagged comment, use the comments.createTaggedComment(fileId, text, callback) method.
*/
app.post('/comment/create/:fileId', function (req, res) {
  if(req.body.type && req.body.type=='tagged')
 util.processReq('client.comments.createTaggedComment(req.params.fileId, req.body.message, function(){})',res,req);
  else
 util.processReq('client.comments.create(req.params.fileId, req.body.message, function(){})',res,req);
});

/*
The message of a comment can be changed with the comments.update(commentID, options, callback) method.
*/
app.post('/comment/update/:commentId', function (req, res) {
 util.processReq('client.comments.update(req.params.commentId, req.body, function(){})',res,req);
});

//A comment can be deleted with the comments.delete(commentId, callback) method.
app.post('/comment/delete/:commentId', function (req, res) {
 util.processReq('client.comments.delete(req.params.commentId, function(){})',res,req);
});

/*docs navigation*/
app.get('/docs', function (req, res) {
 res.sendFile(path.join(__dirname+"/docs/index.html"))
});



/*
app.get('/getAuthToken', function (req, res) {
	http.post('https://api.box.com/oauth2/token', {
	  form: {
		grant_type: 'authorization_code',
		client_id: 'hpjmar3kag84ui8w51gglz61kgfkek95',
		client_secret: 'PReVYGMsZTLQ1ixB7VTlKzucrpYxrEuB',
		code: '1mH6V52s0yIhKsjhrFYL09My2oJiSHQk'
	  },
	}, function (err, response, body) {
	  res.end(JSON.stringify(body));
	})

});


app.get('/userAs', function (req, res) {
	http.request(' https://api.box.com/2.0/folders/0', {
	  headers: {
		 'Authorization':'Bearer 1mH6V52s0yIhKsjhrFYL09My2oJiSHQk',
		 'As-User': ''
	  },
	}, function (err, response, body) {
	  res.end(JSON.stringify(body));
	})

});
*/

var _port = config.Box_API_Deploy_Port || 8081;
if(process.argv.length>2)
    _port = process.argv[2];
    
var server;
/*server listening */
if(config.Box_API_Deploy_Protocol && config.Box_API_Deploy_Protocol=="http"){
	server = app.listen(_port, function () {
		var host = server.address().address
		var port = server.address().port
		console.log("REST app listening at http://%s:%s", host, port);
	});
}else{

	var https = require('https');
	server = https.createServer(config.sslOptions, app);
	server.listen(_port,function(){
			var host = server.address().address
			var port = server.address().port
			console.log("REST app listening at https://%s:%s", host, port);
	});
}
