/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var Link=require('react-router').Link;
var global=require('../../utils/global.js');
var limitCount=global.auditLimitCount;
var common=require('../common.jsx');
var WebUtils=require("../../utils/WebAPIUtils.js");
var linkGenerator=require('../nav/linkGenerator.jsx');

var BulkUserCreation=React.createClass({
	getInitialState:function(){
		return {current:undefined};
	},
	setCurrent:function(curr){
		this.setState({current:curr});
	},
	createSingleUser:function(){
		var data={
			email:this.email.value.trim(),
			name:this.name.value.trim(),
			message:this.message.value.trim(),
			role:this.role.value.trim(),
			org:this.org.value.trim()
		};
		this.signupUser(data,function(result){
			this.result.innerHTML+=("<br/>"+JSON.stringify(result));
		}.bind(this));
	},
	signupUser:function(data,callback){
		if(typeof callback!="function"){
			callback=function(){};
		}
		if(!data.email || !data.email.match(global.emailFormate)){
			callback("Please current email"+JSON.stringify(data));
			return;
		}
		if(!data.role){
			callback("Please select role"+JSON.stringify(data));
			return;
		}
		WebUtils.doPost("/restApiService?operation=userSignUp",data,function(result){
			if(result.userId && data.org){
				data.userId=result.userId;
				this.associateUser(data,callback);
			}else{
				callback(result);
			}
		}.bind(this));
	},
	associateUser:function(data,callback){
		var self=this;
		if(data.userId && data.org && this.state.RoleMappings){
			var rolesDoc=this.state.RoleMappings;
			var publicRole;
			switch(data.role){
				case "architect":
					publicRole="RoleForArchitect";
					break;
				case "designer":
					publicRole="RoleForInteriorDesigner";
					break;
				case "manufacturer":
					publicRole="RoleForManufacturer";
					break;
				case "developer":
					publicRole="RoleForDeveloper";
					break;
				case "supplier":
					publicRole="RoleForSupplier";
					break;
				case "serviceprovider":
					publicRole="RoleForServiceProvider";
					break;
				default:
					publicRole="RoleForCommonUser";
					break;
			}
			WebUtils.doPost("/schema?operation=getRecord",{"name":data.org},function(savedRecord){
				var orgDoc=savedRecord.data;
				var userRoleDoc = {
					  "User": data.userId,
					  "orgType": orgDoc.docType,
					  "roles": [rolesDoc.mappings[publicRole][orgDoc.docType]?(rolesDoc.mappings)[publicRole][orgDoc.docType]:"RoleForOrgMember"],
					  "dependentProperties": {
					    "org": data.org
					  },
					  "recordId": "UserRole"+global.guid(),
					  "org": data.org,
					  "docType": "UserRole",
					  "author": "administrator",
					  "editor": "administrator",
					  "dateCreated": global.getDate(),
					  "dateModified":global.getDate(),
					  "revision": 1,
					  "@identifier": "recordId",
					  "@derivedObjName": "UserRoles-",
					  "relationDesc": [
					    "User-hasRole-org",
					    "org-hasPerson-User"
					  ],
					  "cloudPointHostId": "cloudseed",
					  "record_header": data.email+" Roles In "+orgDoc.name,
					  "$status": "published"
				};
				WebUtils.doPost("/generic?operation=saveRecord",userRoleDoc,function(result){
					data.userRoleId=userRoleDoc.recordId;
					data.userRoleCreationResponse=result;
					callback(data);
				});
            });
		}else{
			callback(data);
		}
	},
	createMultipleUsers:function(){
		var usersJSON=[];
		try{
			usersJSON=JSON.parse(this.usersJSON.value);
		}catch(err){
			alert("Invalid Users Array");
			return;
		}
		if(!Array.isArray(usersJSON)){
			alert("Invalid Users Array");
			return;
		}
		if(usersJSON.length==0){
			alert("No Users to create");
			return;
		}
		for(var i=0;i<usersJSON.length;i++){
			if(!usersJSON[i].email || !usersJSON[i].email.match(global.emailFormate)){
				alert("Please current email at index :"+(i+1));
				return;
			}
		}
		console.log(this.message.value);
		var self=this;
		createUser(0);
		function createUser(index){
			if(index<usersJSON.length){
				var user=usersJSON[index];
				if(!user.role){
					user.role=self.role.value.trim();
				}
				user.message=self.message.value.trim();
				self.signupUser(user,function(result){
					self.result.innerHTML+=("<br/> "+JSON.stringify(result));
					createUser(index+1);
				});
			}else{
				self.result.innerHTML+="<br/> DONE CREATION";
			}
		}
	},
	
	componentDidMount:function(){
		WebUtils.getDefinition("RoleMappings",function(defRes){
			if(!this._isUnmounted)
			this.setState({RoleMappings:defRes});
		}.bind(this));
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
	},

	render:function(){
		var self=this;
		if(this.state.current=="single"){
			return <div className="row no-margin">
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,null)}>BACK</div>
				<input type="text" ref={(e)=>{this.name=e;}} placeholder="Name" className="form-control"/>
				<input type="text" ref={(e)=>{this.email=e;}} placeholder="Email" className="form-control"/>
				<input type="text" ref={(e)=>{this.org=e;}} placeholder="Organization Id" className="form-control"/>
				<select ref={(e)=>{this.role=e;}} className="form-control">
					<option value="">Select Role</option>
					<option value="architect">architect</option>
					<option value="designer">designer</option>
					<option value="manufacturer">manufacturer</option>
					<option value="developer">developer</option>
					<option value="supplier">supplier</option>
					<option value="serviceprovider">serviceprovider</option>
				</select>
				<textarea ref={(e)=>{this.message=e;}} placeholder="Message" className="form-control"></textarea>
				<br/>
				<input type="button" className="btn btn-warn" value="Create" onClick={this.createSingleUser}/>
				<div className="row no-margin" ref={(e)=>{this.result=e;}}></div>
			</div>;
		}else if(this.state.current=="multiple"){
			return <div className="row no-margin">
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,null)}>BACK</div>
				<h2>
					The input JSON Must be an array of objects where each object is having email,role
				</h2>
				<h3>
					If you select a role the selected role will be applied to all users
				</h3>
				<select ref={(e)=>{this.role=e;}} className="form-control">
					<option value="">Select Role</option>
					<option value="architect">architect</option>
					<option value="designer">designer</option>
					<option value="manufacturer">manufacturer</option>
					<option value="developer">developer</option>
					<option value="supplier">supplier</option>
					<option value="serviceprovider">serviceprovider</option>
				</select>
				<textarea ref={(e)=>{this.usersJSON=e;}} placeholder="Users JSON" className="form-control"></textarea>
				<textarea ref={(e)=>{this.message=e;}} placeholder="Message" className="form-control"></textarea>
				<br/>
				<input type="button" className="btn btn-warn" value="Create" onClick={this.createMultipleUsers}/>
				<div className="row no-margin" ref={(e)=>{this.result=e;}}></div>
			</div>;
		}else{
			return <div className="row no-margin">
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"single")}>
					<h3>Signup single user</h3>
				</div>
				<div className="row no-margin blueLink link" onClick={this.setCurrent.bind(null,"multiple")}>
					<h3>Signup multiple users with JSON input</h3>
				</div>
			</div>;
		}
	}
});
exports.BulkUserCreation=BulkUserCreation;