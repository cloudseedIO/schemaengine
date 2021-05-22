

var React=require('react');
var ReactDOM = require('react-dom');
var browserHistory=require('react-router').browserHistory;
var WebUtils=require('../../utils/WebAPIUtils.js');
var linkGenerator=require('../nav/linkGenerator.jsx');
var global=require('../../utils/global.js');
var common=require('../common.jsx');
var signUp=require('./signUp.jsx');
var workflow=require('../view/components/workflow.jsx');

function setupAccount(){
	var node = document.createElement("div");
 	node.id = global.guid();
 	var popUpId = global.guid();
 	var contentDivId = global.guid();
 	var sideDivId = global.guid();
  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} alignMiddleDiv={true}/>,node);
	ReactDOM.render(<SetupAccount contentDivId={contentDivId}/>,document.getElementById(contentDivId));
}
if(typeof window!="undefined"){
	window.setupAccount=setupAccount;
}
exports.setupAccount=setupAccount;



var ActivateAccount = React.createClass({
	componentDidMount:function(){
		if(typeof common.getUserDoc()=="object" && common.getUserDoc().recordId){
			location.href="/";
			return;
		}
		console.log(JSON.parse(document.getElementById('documentState').innerHTML).userDoc);
		var userDoc = JSON.parse(document.getElementById('documentState').innerHTML).userDoc;
		var orgDoc = JSON.parse(document.getElementById('documentState').innerHTML).orgDoc;
		var currentPage = JSON.parse(document.getElementById('documentState').innerHTML).current;
		if(typeof userDoc == "object" && userDoc!=null && Object.keys(userDoc).length>0){
			if(!userDoc.activation){
				var node = document.createElement("div");
			 	node.id = global.guid();
			 	var popUpId = global.guid();
			 	var contentDivId = global.guid();
			 	var sideDivId = global.guid();
			  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
			  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
				ReactDOM.render(<common.GenericPopUpComponent hideClose={true} popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} alignMiddleDiv={true}/>,node);
				ReactDOM.render(<SetupAccount userDoc={userDoc} orgDoc={orgDoc} currentPage={currentPage} contentDivId={contentDivId}/>,document.getElementById(contentDivId));

			}else{
				//common.createAlert("In complete",("You have already activated your profile"),function(){
	        		location.href="/";
	        	//});
			}
		}else{
			workflow.workFlow("loginWorkFlow",{},"public",undefined,function(){location.href="/";});
		}
	},
	render:function(){
		return (<div className="hidden"></div>);
	}
});
exports.ActivateAccount=ActivateAccount;



var SetupAccount = React.createClass({
	/*getInitialState:function(){
		return {
			userDoc:JSON.parse(document.getElementById('documentState').innerHTML).userDoc?
				JSON.parse(document.getElementById('documentState').innerHTML).userDoc:{}
				}
	},*/
	componentDidMount : function(){
		var self=this;
		grecaptcha.render('recaptcha', {
	        'sitekey' : '6LfgLC0UAAAAAJmH-yM_K84BsZb-YGQq3EjUc9zy',
 	        'callback' : self.handleCaptcha
        });
	},
	handleCaptcha:function(captchaStr){
		this["errorCaptcha"].className="hidden";
		WebUtils.doPost("/restApiService?operation=validateCaptcha",{captchaStr: captchaStr},function(result){
			console.log("restapi-----",result);
			if(result && result.success){
				//common.createAlert("In complete",("Please fill all the fields"));
			}else{
				this["errorCaptcha"].className="col-lg-12 col-md-12 col-sm-12 col-xs-12";
				this["errorCaptcha"].innerHTML="Captcha Failed, Please try again";
				//common.createAlert("In complete",("Captcha Failed, Please try again"));
			}

		});
	},
	inviteColleagues:function(){
		this["errorFirstName"].className="hidden";
		this["errorLastName"].className="hidden";
		this["errorPassword1"].className="hidden";
		this["errorPassword2"].className="hidden";
		this["errorCaptcha"].className="hidden";

		var value1=this["password1"].value.trim();
		var value2=this["password2"].value.trim();
		var givenName=this["givenName"].value.trim();
		var familyName=this["familyName"].value.trim();
		var self=this;
		if(givenName == ""){
			this["errorFirstName"].className="";
		}else if(familyName == ""){
			this["errorLastName"].className="";
		}else if(value1 == ""){
			this["errorPassword1"].className="";
		}else if(value2 == ""){
			this["errorPassword2"].className="";
		}else if(grecaptcha.getResponse() == ""){
			this["errorCaptcha"].className="col-lg-12 col-md-12 col-sm-12 col-xs-12";
		}else if(value1.length > 5 && value1 != "" && value2 != "" && value1 == value2 && givenName != "" && familyName != ""){
			if(this.props.userDoc){
				self.props.userDoc.activation = true;
				self.props.userDoc.givenName = givenName;
				self.props.userDoc.familyName = familyName;
				self.props.userDoc.loginPassword = value1;
				WebUtils.doPost("/generic?operation=saveRecord",self.props.userDoc,function(result){
					console.log("userDoc----:", result);
					WebUtils.doPost("/user?operation=getUserDocByUserName",{userName:self.props.userDoc.loginId},function(result){
						common.reloadSession();
						WebUtils.doPost("/user?operation=checkUserExistance",{},function(result){
							common.setUserOrgs(result.allOrgs);
						});
					});
				});
			}
			var userDoc=self.props.userDoc;
			var orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
			try{
				orgDomain=((userDoc.email).split("@")[1]).split(".");
				orgDomain.splice(orgDomain.length-1,1);
				orgDomain=orgDomain.join(".");
			}catch(err){
				orgDomain = ((userDoc.email).split("@")[1]).split(".")[0];
			}
			var publicDomain=false;
				var publicDomains=["gmail",
		              "yahoo",
		              "yahoomail",
		              "email",
		              "hotmail",
		              "outlook",
		              "zoho",
		              "ymail",
		              "rediff",
		              "rediffmail",
		              "aol"];
					if(publicDomains.indexOf(orgDomain.toLowerCase())>-1){
						publicDomain=true;
					}

			if(this.props.orgDoc && !this.props.orgDoc.recordId && this.props.currentPage == "activate" && !publicDomain){
				ReactDOM.render(<SetupFirmPage userDoc={self.props.userDoc} contentDivId={self.props.contentDivId}/>,document.getElementById(this.props.contentDivId));
			}else if(this.props.currentPage && this.props.currentPage == "join"){
				ReactDOM.render(<PickUserRole orgDoc={self.props.orgDoc} userDoc={self.props.userDoc} contentDivId={self.props.contentDivId}/>,document.getElementById(this.props.contentDivId));
			}else{
				ReactDOM.render(<InviteColleagues contentDivId={this.props.contentDivId}/>,document.getElementById(this.props.contentDivId));
			}
		}else{
			this["errorPassword2"].className="";
			this["errorPassword2"].innerHTML="Passwords do not match. Please re-enter";
			//common.createAlert("In complete",("Please fill all the fields"));
		}

	},
	validatePassword:function(){
		this["errorPassword"].className="hidden";
		this["errorPassword2"].className="hidden";
		var value1=this["password1"].value.trim();
		var value2=this["password2"].value.trim();
		if(value1!="" && value1.length<5){
			this["errorPassword"].className="";
		}else if(value1 != "" ){
			if(value2 != ""){
				if(value1 == value2){

				}else{
					this["errorPassword2"].className="";
					this["errorPassword2"].innerHTML="Passwords do not match. Please re-enter";
					//common.createAlert("In complete",("Passwords do not match. Please re-enter"));
				}
			}
		}else{

		}
	},
	validateFirstName:function(){
		this["errorFirstName"].className="hidden";
		var givenName=this["givenName"].value.trim();
		if(givenName == ""){
			this["errorFirstName"].className="";
		}else{}
	},
	validateLastName:function(){
		this["errorLastName"].className="hidden";
		var familyName=this["familyName"].value.trim();
		if(familyName == ""){
			this["errorLastName"].className="";
		}else{}
	},
	render:function(){
		return(
			<div className="col-lg-4 col-md-5 col-sm-5 col-xs-12 no-padding activation popUpLogin">
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" style={{"fontSize":"28px","fontWeight":"800"}}>Welcome to Wishkarma</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">Hi,<span style={{"fontWeight":"800"}}> {this.props.userDoc.email}.</span></div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">Your account will be activated successfully</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap-sm">if you fill these fields. Please set your name and password to continue.</div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
					<input type="text" className="form-control" placeholder="First Name" onBlur={this.validateFirstName} ref={(e)=>{this.givenName=e}} />
					<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this["errorFirstName"]=e}}>Please enter first name </div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
					<input type="text" className="form-control" placeholder="Last Name" onBlur={this.validateLastName} ref={(e)=>{this.familyName=e}} />
					<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this["errorLastName"]=e}}>Please enter last name </div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
					<input type="password" className="form-control" placeholder="Password" onBlur={this.validatePassword} ref={(e)=>{this.password1=e}} />
					<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this["errorPassword1"]=e}}>Please fill password field </div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm hidden" ref={(e)=>{this.errorPassword=e}}>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12"><b>Password must:</b></div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{"color":"red","fontSize":"12px"}}>Contain at least 6 characters</div>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12"><b>Password must NOT:</b></div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{"color":"red","fontSize":"12px"}}>Contain only one character (111111 or aaaaaa)</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{"color":"red","fontSize":"12px"}}>Contain only consecutive characters (123456 or abcdef)</div>
					</div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
					<input type="password" className="form-control" placeholder="Confirm Password" onBlur={this.validatePassword} ref={(e)=>{this.password2=e}} />
					<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this["errorPassword2"]=e}}>Please fill confirm password field </div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 recaptcha" id="recaptcha" data-sitekey="6LfgLC0UAAAAAJmH-yM_K84BsZb-YGQq3EjUc9zy"></div>
				<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this["errorCaptcha"]=e}}>Please verify captcha </div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button className="form-control margin-bottom-gap-sm margin-top-gap-sm customLogin" onClick={this.inviteColleagues} ref={(e)=>{this.continuebutton=e}}>Let me in</button>
				</div>
			</div>)
	}
});
exports.SetupAccount = SetupAccount;

var InviteColleagues=React.createClass({
	getInitialState:function(){
		return {emailCount:1,emailIds:[],shouldComponentUpdate:false};
	},
	shouldComponentUpdate: function(nextProps, nextState) {
         return nextState.shouldComponentUpdate;
    },
	addAnotherEmail:function(){
		this["errorPreviousEmail"].className="hidden";
		for(var i=0;i<this.state.emailCount;i++){
			if(this["errorEmail"+i])
			this["errorEmail"+i].className="hidden";
		}

		if(this.state.emailIds.length == this.state.emailCount){
			var emailCount=this.state.emailCount+1;
			this.setState({emailCount:emailCount,shouldComponentUpdate:true});
		}else{
			this["errorPreviousEmail"].className="col-lg-12 col-md-12 col-sm-12 col-xs-12";
			//common.createAlert("In complete",("Please fill the previous value"));
		}
	},
	validateEmail:function(index){
		this["errorEmail"+index].className="hidden";
		this["errorPreviousEmail"].className="hidden";
		var value=this["inviteEmail"+index].value.trim();
		if(value==""){
			this["errorEmail"+index].className="";
			var emailIds=this.state.emailIds;
			delete emailIds[index];
			emailIds = emailIds.filter(function(n){return n!= "" && n != undefined});
			this.setState({emailIds:emailIds,shouldComponentUpdate:false});
			return;
		}else{
			 if (/^(\b.*[a-zA-Z]+.*\b)+@((\b.*[a-zA-Z]+.*\b)+.)+([a-zA-Z]{2,4})+$/.test(value)){
					var emailIds=this.state.emailIds;
					emailIds[index]=value.toLowerCase();
					this.setState({emailIds:emailIds,shouldComponentUpdate:false});
			 }else{
				this["errorEmail"+index].className="";
			 	return;
			 }
		}
	},
	invite:function(){
		var self=this;
		this["errorPreviousEmail"].className="hidden";
		if(self.state.emailIds && self.state.emailIds.length>0){
			common.startLoader();
			require("../../utils/WebAPIUtils.js").invite(self.state.emailIds,function(data){
				common.stopLoader();
				//common.createAlert("In complete",("Invitation sent!"),function(){
        			self.getStarted();
        		//});
			});
		}else{
			this["errorPreviousEmail"].className="col-lg-12 col-md-12 col-sm-12 col-xs-12";
			this["errorPreviousEmail"].innerHTML="Please enter a valid email";
			//common.createAlert("In complete",("Please enter a valid email"));
		}


	},
	getStarted:function(){
		ReactDOM.render(<GetStarted orgDoc={this.props.orgDoc} userRoleDoc={this.props.userRoleDoc} contentDivId={this.props.contentDivId}/>,document.getElementById(this.props.contentDivId));
	},
	render:function(){
		var self=this;
		var count=[];
		for(var i=0;i<this.state.emailCount;i++){
			count.push("i");
		}
		return(<div key={global.guid()} className="col-lg-3 col-md-3 col-sm-4 col-xs-12 no-padding activation popUpLogin">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" style={{"fontSize":"28px","fontWeight":"800"}}>Invite Colleagues</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap-sm" style={{"fontWeight":"800"}}>Invite your colleagues to create their own free Wishkarma account.</div>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm">
							{
								count.map(function(temp,index){
									return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group" id="inviteEmail">
												<input className="form-control" type='email' defaultValue={(self.state.emailIds && self.state.emailIds[index])?self.state.emailIds[index]:""} ref={(e)=>{self["inviteEmail"+index]=e}} onBlur={self.validateEmail.bind(null,index)} placeholder="Enter email address"/>
												<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{self["errorEmail"+index]=e}}>Enter valid data</div>
											</div>)
								})
							}
						<div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{self["errorPreviousEmail"]=e}}>Please fill the above value</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group text-center">
							<button className="noMinWidth" style={{"fontSize": "14px","color": "#3690fb","cursor": "pointer"}} onClick={this.addAnotherEmail}>Add another email</button>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
							<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
								<button className="form-control noMinWidth margin-bottom-gap-sm customLogin" onClick={this.invite}>INVITE</button>
							</div>
							<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
								<button className="form-control noMinWidth margin-bottom-gap-sm" onClick={this.getStarted}>SKIP</button>
							</div>
						</div>
					</div>

				</div>)
	}
})
exports.InviteColleagues=InviteColleagues;


var GetStarted=React.createClass({
	//getInitialState:function(){
		//return {userOrgsAndRoles:"",shouldComponentUpdate:false};
	//},
	setupProject:function(){
		browserHistory.push("/myprojects");
	},
	loadProfilePage:function(){
		browserHistory.push(linkGenerator.getDetailLink({record:common.getUserDoc(),org:"public",schema:"User",recordId:common.getUserDoc().recordId}));
	},
	loadFirmPage:function(){
		browserHistory.push("/myfirms");
		return;
		var orgId = (this.props.orgDoc && this.props.orgDoc.recordId)?this.props.orgDoc.recordId:JSON.parse(document.getElementById('documentState').innerHTML).orgDoc.recordId;
		if(orgId.indexOf("ServiceProvider") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"ServiceProvider",recordId:orgId}));
		}else if(orgId.indexOf("Manufacturer") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Manufacturer",recordId:orgId}));
		}else if(orgId.indexOf("Supplier") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Supplier",recordId:orgId}));
		}else if(orgId.indexOf("Provider") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Provider",recordId:orgId}));
		}else if(orgId.indexOf("Developer") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Developer",recordId:orgId}));
		}else if(orgId.indexOf("Organization") != -1){
			WebUtils.doPost("/schema?operation=getRecord",{"name":orgId},function(result){
				browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:result.data.docType,recordId:orgId}));
			});
		}else{

		}
	},
	setupFirmPage:function(){
		ReactDOM.render(<SetupFirmPage contentDivId={this.props.contentDivId}/>,document.getElementById(this.props.contentDivId));
	},
	reload:function(){
		location.href="/";
	},
	/*componentDidMount:function(){
		var userOrgsAndRoles = (common.getUserOrgsAndRoles()).length>0?common.getUserOrgsAndRoles()[0].roles[0]:"";
		this.setState({userOrgsAndRoles:userOrgsAndRoles,shouldComponentUpdate:true});
	},
	shouldComponentUpdate: function(nextProps, nextState) {
         return nextState.shouldComponentUpdate;
    },*/
	render:function(){
		var self=this;
		return(<div className="col-lg-3 col-md-3 col-sm-4 col-xs-12 no-padding activation popUpLogin">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" style={{"fontSize":"28px","fontWeight":"800"}}>Get Started</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap-sm" style={{"fontWeight":"800"}}>You may setup project groups and collaboration spaces</div>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center margin-bottom-gap-sm">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadProfilePage}>SETUP PROFILE</button>
						</div>
						{
							(self.props.userRoleDoc && self.props.userRoleDoc.roles[0] == "RoleForMembersManager")?
									(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
										<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage}>SETUP FIRM PROFILE</button>
									</div>):
									(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
										<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage}>VIEW FIRM PAGE</button>
									</div>)
						}

						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.setupProject}>SETUP PROJECT</button>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm" onClick={this.reload}>SKIP</button>
						</div>
					</div>

				</div>)
	}
})
exports.GetStarted=GetStarted;

var SetupFirmPage = React.createClass({
	loadFirmPage:function(value){
		var self=this;
		WebUtils.doPost("/restApiService?operation=setOrgAndRole",{"userId":self.props.userDoc.recordId,"orgType":value},function(result){
			console.log(result);
			ReactDOM.render(<InviteColleagues orgDoc={result.orgDoc} userRoleDoc={result.userRoleDoc} contentDivId={self.props.contentDivId}/>,document.getElementById(self.props.contentDivId));
		});


		/*if(value.indexOf("Provider") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Provider",recordId:common.getUserOrgsAndRoles()[0].org}));
			WebUtils.doPost("/schema?operation=getRecord",{"name":common.getUserOrgsAndRoles()[0].org},function(result){
				result.data.docType="Provider";
				WebUtils.doPost("/generic?operation=saveRecord",result.data,function(result){
					console.log("changed docType--"+result);
				});
			});
		}else if(value.indexOf("Manufacturer") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Manufacturer",recordId:common.getUserOrgsAndRoles()[0].org}));
			WebUtils.doPost("/schema?operation=getRecord",{"name":common.getUserOrgsAndRoles()[0].org},function(result){
				result.data.docType="Manufacturer";
				WebUtils.doPost("/generic?operation=saveRecord",result.data,function(result){
					console.log("changed docType--"+result);
				});
			});
		}else if(value.indexOf("Supplier") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Supplier",recordId:common.getUserOrgsAndRoles()[0].org}));
			WebUtils.doPost("/schema?operation=getRecord",{"name":common.getUserOrgsAndRoles()[0].org},function(result){
				result.data.docType="Supplier";
				WebUtils.doPost("/generic?operation=saveRecord",result.data,function(result){
					console.log("changed docType--"+result);
				});
			});
		}else if(value.indexOf("ServiceProvider") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"ServiceProvider",recordId:common.getUserOrgsAndRoles()[0].org}));
			WebUtils.doPost("/schema?operation=getRecord",{"name":common.getUserOrgsAndRoles()[0].org},function(result){
				result.data.docType="ServiceProvider";
				WebUtils.doPost("/generic?operation=saveRecord",result.data,function(result){
					console.log("changed docType--"+result);
				});
			});

		}else if(value.indexOf("Developer") != -1){
			browserHistory.push(linkGenerator.getDetailLink({record:{},org:"public",schema:"Developer",recordId:common.getUserOrgsAndRoles()[0].org}));
			WebUtils.doPost("/schema?operation=getRecord",{"name":common.getUserOrgsAndRoles()[0].org},function(result){
				result.data.docType="Developer";
				WebUtils.doPost("/generic?operation=saveRecord",result.data,function(result){
					console.log("changed docType--"+result);
				});
			});

		}else{

		}*/

	},
	render:function(){
		return(<div className="col-lg-3 col-md-3 col-sm-4 col-xs-12 no-padding text-center popUpLogin">
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" style={{"fontSize":"28px","fontWeight":"800"}}>CHOOSE YOUR FIRM TYPE</div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage.bind(null,"Provider")}>ARCHITECTURE FIRM</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage.bind(null,"Manufacturer")}>MANUFACTURER FIRM</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage.bind(null,"Supplier")}>SUPPLIER FIRM</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage.bind(null,"ServiceProvider")}>SERVICE PROVIDER FIRM</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadFirmPage.bind(null,"Developer")}>DEVELOPER FIRM</button>
				</div>
			</div>)
	}
});
exports.SetupFirmPage=SetupFirmPage;


var PickUserRole = React.createClass({
	loadCreateRole:function(value){
		var self=this;
		WebUtils.doPost("/restApiService?operation=setUserRoleOnPublicOrg",{"userId":self.props.userDoc.recordId,"userRole":value},function(result){
			console.log(result);
			if(self.props.orgDoc && !self.props.orgDoc.recordId){
				ReactDOM.render(<SetupFirmPage userDoc={self.props.userDoc} contentDivId={self.props.contentDivId}/>,document.getElementById(this.props.contentDivId));
			}else{
				WebUtils.doPost("/restApiService?operation=setUserRoleOnOrg",{"userId":self.props.userDoc.recordId,"userRole":value,"orgDoc":self.props.orgDoc},function(result){
					console.log(result);
					ReactDOM.render(<InviteColleagues orgDoc={self.props.orgDoc} userRoleDoc={result.userRoleDoc} contentDivId={self.props.contentDivId}/>,document.getElementById(self.props.contentDivId));
				});
			}
		});


	},
	render:function(){
		return(<div className="col-lg-3 col-md-3 col-sm-4 col-xs-12 no-padding text-center popUpLogin">
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" style={{"fontSize":"28px","fontWeight":"800"}}>CHOOSE YOUR ROLE</div>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadCreateRole.bind(null,"Provider")}>ARCHITECT</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadCreateRole.bind(null,"Manufacturer")}>MANUFACTURER</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadCreateRole.bind(null,"Supplier")}>SUPPLIER</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadCreateRole.bind(null,"ServiceProvider")}>SERVICE PROVIDER</button>
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button style={{"width":"200px"}} className="action-button margin-bottom-gap-sm customLogin" onClick={this.loadCreateRole.bind(null,"Developer")}>DEVELOPER</button>
				</div>
			</div>)
	}
});
exports.PickUserRole=PickUserRole;
