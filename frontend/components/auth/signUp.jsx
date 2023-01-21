/**
 *@author vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var workflow=require('../view/components/workflow.jsx');
var setupAccount=require('./setupAccount.jsx');

var DefinitionStore = require('../../stores/DefinitionStore');
var SchemaStore = require('../../stores/SchemaStore');
var ActionCreator = require('../../actions/ActionCreator.js');
var ServerActionReceiver = require('../../actions/ServerActionReceiver.js');

var linkGenerator=require('../nav/linkGenerator.jsx');
var WebUtils=require('../../utils/WebAPIUtils.js');
var global=require('../../utils/global.js');
var Link=require('react-router').Link;
var browserHistory=require('react-router').browserHistory;
var defineRecordLayout = require('../admin/defineRecordLayout.jsx');
var manageRecords=require('../records/manageRecords.jsx');
var genericView=require('../view/genericView.jsx');


var LoginPopup=React.createClass({
	forceLogin:function(event){
		var code=event.keyCode? event.keyCode:event.which;
		if(code==13){
			this.login();
		}
	},

	login:function(){
		var userName=this.userName.value.trim();
		var password=this.password.value;
		var self=this;
		if(this.userNameError){
		    this.userNameError.className="hidden";
		}
		if(this.passwordError){
            this.passwordError.className="hidden";
        }
		if(userName==""){
		    this.userNameError.className="errorMsg";
		    this.userNameError.innerHTML="Please enter work email address"
			//alert("please enter user name");
			return;
		}
		if(password==""){
		    this.passwordError.className="errorMsg";
            this.passwordError.innerHTML="Please enter password"
            //alert("please enter password");
			return;
		}
		var userNameField=this.userName;
		var passwordField=this.password;

		if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userName)){
			userName=userName.toLowerCase();
		}

		common.startLoader();
		WebUtils.doPost("/user?operation=validateUser",{userName:userName,password:password},function(data){
			if(data.data=="validuser"){
				WebUtils.doPost("/user?operation=getUserDocByUserName",{userName:userName},function(result){
					common.setUserDoc(result.userData);//result.data[0]
					common.setSessionData(result);
					common.setUserOrgs(result.orgAndRoles);
					//ServerActionReceiver.receiveUserDoc(result.userData);
					ServerActionReceiver.receiveNavigationLinks(result.navLinks);
					common.redirectAfterLogin();
					//if(tracking is enabled)
					try{userLogin(common.getUserDoc())}catch(err){};
					if($(".popUpLoginDiv") && $(".popUpLoginDiv").find(".deleteIcon") && $(".popUpLoginDiv").find(".deleteIcon").length>0){
						$(".popUpLoginDiv").find(".deleteIcon").click();
					}
					common.stopLoader();
				});
			}else{
				common.stopLoader();

                 self.passwordError.className="errorMsg";
	             self.passwordError.innerHTML="Invalid email address and password combination"
				//alert("invalid username and password combination");
				passwordField.value="";
				userNameField.value="";
			}
		});

	},
	close:function(){
		//document.getElementById("loginDiv").style.display="none";
	},
	componentDidMount:function(){
		var self=this;
		$("#register").click(function(){
			self.register();
		});
		$("#forgotPassword").click(function(){
			self.forgotPassword();
		});
		if($("#userName") && $("#userName").length>0){
			$("#userName").focus();
		}
		try{guide("Guide-Register");}catch(err){};
	},
	register:function(){
		if($(".popUpLoginDiv") && $(".popUpLoginDiv").find(".deleteIcon") && $(".popUpLoginDiv").find(".deleteIcon").length>0){
			$(".popUpLoginDiv").find(".deleteIcon").click();
			workflow.workFlow("loginWorkFlow");
		}
		try{trackThis("register");}catch(err){}
	},
	forgotPassword:function(){
		if($(".popUpLoginDiv") && $(".popUpLoginDiv").find(".deleteIcon") && $(".popUpLoginDiv").find(".deleteIcon").length>0){
			$(".popUpLoginDiv").find(".deleteIcon").click();
				var node = document.createElement("div");
	            node.id = global.guid();
	            var popUpId = global.guid();
	            var contentDivId = global.guid();
	            var sideDivId = global.guid();
	            node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	            document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	            ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} alignMiddleDiv={true}/>,node);
	            ReactDOM.render(<GetForgotPassword popUpId={popUpId} />,document.getElementById(contentDivId));

		}
		try{trackThis("forgotPassword");}catch(err){}
	},
	render:function(){
		var content="";
		var self=this;
		if(typeof common.getUserDoc().recordId=="undefined"){
			content=(<div className="col-lg-3 col-md-4 col-sm-5 col-xs-12 no-padding popUpLogin">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group text-center search">
							<img src="/branding/wklogonopad.svg" className="branding h5"/>
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
    						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
    							<button className="form-control facebook" type="button" onClick={common.FBLogin}>
    								<i className="fa fa-facebook" style={{"color": "white"}}></i>&nbsp;&nbsp;&nbsp;&nbsp; Login with Facebook
    							</button>
    						</div>
    						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
    							<button className="form-control gplus" type="button" onClick={common.GoogleLogin} >
    								<i className="fa fa-google-plus" style={{"color": "white"}}></i>&nbsp;&nbsp;&nbsp;&nbsp; Sign in with Google+
    							</button>
    						</div>
    					</div>
					   {/* <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding form-group">
    								<div className="hzLineWithText">Or</div>
    					</div>*/}
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding">
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group text-center" style={{"fontSize":"24px","fontWeight":800}}>For Professionals</div>
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
                                <input className="form-control " type='text' defaultValue={this.props.emailId?this.props.emailId:""} onKeyPress={this.forceLogin} ref={(e)=>{this.userName=e}} id="userName" placeholder="Your work email address"/>
                                 <div ref={(e)=>{this.userNameError=e}} className=" errorMsg hidden"></div>
                            </div>
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
                                <input className="form-control " type='password' onKeyPress={this.forceLogin} ref={(e)=>{this.password=e}} id="password" placeholder="Password"/>
                                <div ref={(e)=>{this.passwordError=e}} className=" errorMsg hidden"></div>
                            </div>
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
                                <button id="continueLoginButton" className="form-control customLogin"  ref={(e)=>{this.current=e}} onClick={this.login}>CONTINUE</button>
                            </div>
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
                                <button className="pull-left noMinWidth  blueLink link" style={{"fontSize": "14px","cursor": "pointer"}} ref={(e)=>{this.forgetPassword=e}} id="forgotPassword">Forgot Password?</button>
                                <button className="pull-right noMinWidth blueLink link" style={{"fontSize": "14px","cursor": "pointer"}} id="register">SignUp</button>
                            </div>

                        </div>
 					  </div>
				);
		}
		if(common.getConfigDetails() && common.getConfigDetails().handleBarTemplate && common.getConfigDetails().handleBarTemplate=="jsm"){
			//content="";
		}



		return (
		<div  key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
			{content}
		</div>
		);
	}
});
exports.LoginPopup=LoginPopup;

var SetForgotPassword = React.createClass({
	componentDidMount:function(){
		if(JSON.parse(document.getElementById('documentState').innerHTML).userDoc != undefined
				&& JSON.parse(document.getElementById('documentState').innerHTML).userDoc.recordId){
			var node = document.createElement("div");
	        node.id = global.guid();
	        var popUpId = global.guid();
	        var contentDivId = global.guid();
	        var sideDivId = global.guid();
	        node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	        ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} hideClose={true}  sideDivId={sideDivId} noSideDiv={true}/>,node);
	        ReactDOM.render(<ForgotPassword popUpId={popUpId} />,document.getElementById(contentDivId));
		}
	},
	render:function(){
		return (<div className="hidden"></div>);
	}
});
exports.SetForgotPassword=SetForgotPassword;


var GetForgotPassword = React.createClass({
    getInitialState:function(){
        return ({msg:undefined,sendEmail:false});
    },
	validateEmail:function(){
		this["errorEmail"].className="hidden";
		var value=this["validateEmail"].value.trim();
		var validationDomainsbkp=["gmail",
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
		var validationDomains=[];
		if(value==""){
			this["errorEmail"].className="";
			this["errorEmail"].innerHTML="Please enter valid email address";
			this.hideSendButton();
		    return;
		}else{
			 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)){
            	var domain=((value.split("@")[1]).split(".")[0]).toLowerCase();
            	if(validationDomains.indexOf(domain) != -1){
            		//common.createAlert("In complete",("please do not use public domain email ids"));
            	    this["errorEmail"].className="";
                    this["errorEmail"].innerHTML="Please do not use public domain email address";
            	    this["validateEmail"].value="";
            	    this.hideSendButton();
            		return;
            	}else{
                    this.showSendButton();
                }
			 }else{
			     this["errorEmail"].className="";
	             this["errorEmail"].innerHTML="Please enter valid email address";
	             this.hideSendButton();
			 	return;
			 }
		}
	},
	hideSendButton:function(){
		this.sendEmail.className+=" pointer-events opcaity-half";
	},
	showSendButton:function(){
		this.sendEmail.className=this.sendEmail.className.replace(/pointer-events opcaity-half/g,"");
	},
  componentDidMount:function(){
    if(this["validateEmail"]){
      //on mounting just focus on the input box
      $(this["validateEmail"]).focus();
    }
  },
	sendEmail1:function(){
	    var self=this;
		var data=this["validateEmail"].value.trim();
		if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data)){
			data=data.toLowerCase();
			var emailId={"email":data};
			WebUtils.doPost("/restApiService?operation=changePasswordEmail",emailId,function(result){
				if(result.error){
					if(!this._isUnmounted)
				    this.setState({msg:(result.error?result.error:"Some thing went wrong please try again"),sendEmail:true,"docStatus":result.signup})
					//common.createAlert("In complete",(result.error));
				}else{
					if(!this._isUnmounted)
				    this.setState({msg:"An email address was sent to your inbox. It contains a link which you must click to confirm your password change.",sendEmail:true})
					/*common.createAlert("In complete",(""),function(){
						location.href="/";
					});*/
				}
			}.bind(this));
		}
	},

   register:function(){
        if($(".popUpLoginDiv") && $(".popUpLoginDiv").find(".deleteIcon") && $(".popUpLoginDiv").find(".deleteIcon").length>0){
            $(".popUpLoginDiv").find(".deleteIcon").click();
            workflow.workFlow("loginWorkFlow");
        }
    },
    close:function(){
        if($(".popUpLoginDiv") && $(".popUpLoginDiv").find(".deleteIcon") && $(".popUpLoginDiv").find(".deleteIcon").length>0){
            $(".popUpLoginDiv").find(".deleteIcon").click();
        }
    },
    componentWillUnmount:function(){
		this._isUnmounted=true;
	},
	render:function(){
		var self=this;
		if(this.state.sendEmail){
		    return(<div className="col-lg-4 col-md-5 col-sm-5 col-xs-12 popUpLogin text-center"  style={{"box-shadow":"none"}}>
		            <div className={" "+(this.state.docStatus?"icons8-id-not-verified":"icons8-send-email")} style={{"fontSize":"80px"}} />
		            {this.state.msg}
		            {
		                this.state.docStatus?
		                        (<span> Please <span className="link" style={{"color":"#3690fb"}} onClick={this.register}  >SignUp</span> to continue</span>)
		                    :(<div className="link margin-top-gap "  style={{"color":"#3690fb"}}  onClick={this.close}  >Close</div>)
		            }
		            </div>)
		}else{
		    return(<div className="col-lg-4 col-md-5 col-sm-6 col-xs-12 popUpLogin" style={{"box-shadow":"none"}}>
                    <h2 >
                    	Forgot Your Password?
                    </h2>
                    <div>Enter your email address and we will send you a link to reset the password.</div>
                    <input className="form-control margin-top-gap" type='email' ref={(e)=>{self["validateEmail"]=e}} onBlur={this.validateEmail} placeholder="Enter email address"/>
                    <div className="hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{self["errorEmail"]=e}}>Enter valid email address</div>
                    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-12 no-padding">
                        <button className="form-control margin-bottom-gap-sm margin-top-gap-sm customLogin pointer-events opcaity-half" onClick={this.sendEmail1} ref={(e)=>{this.sendEmail=e}}>SEND</button>
                    </div>
                </div>)
		}
	}
});
exports.GetForgotPassword=GetForgotPassword;

var ForgotPassword = React.createClass({
	/*getInitialState:function(){
		return {
			userDoc:JSON.parse(document.getElementById('documentState').innerHTML).userDoc?
				JSON.parse(document.getElementById('documentState').innerHTML).userDoc:{}
			};
	},*/
	componentDidMount:function(){
		var userDoc=JSON.parse(document.getElementById('documentState').innerHTML).userDoc;
		if(userDoc && userDoc.resetPasswordCode == ""){
			common.createAlert("In complete",("Your reset password code has been expired.click on forgot password to reset your password"),function(){
				location.href="/";
			});
		}
	},
	validatePassword:function(){
		this["errorPassword"].className="hidden";
		this["errorSamePswd"].className="hidden";
		var value1=this["password1"].value.trim();
		var value2=this["password2"].value.trim();
		if(value1!="" && value1.length<5){
			this["errorPassword"].className="";
		}else if(value1 != "" ){
			if(value2 != ""){
				if(value1 == value2){

				}else{
					this["errorFillData"].className="hidden";
					this["errorSamePswd"].className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group";
				}
			}
		}
	},
	savePassword:function(){
		this["errorFillData"].className="hidden";
		var value1=this["password1"].value.trim();
		var value2=this["password2"].value.trim();
		if(value1.length > 5 && value1 != "" && value2 != "" && value1 == value2){
			var userDoc=JSON.parse(document.getElementById('documentState').innerHTML).userDoc;
			if(userDoc){
				userDoc.resetPasswordCode = "";
				userDoc.loginPassword = value1;
				common.startLoader();
				WebUtils.doPost("/generic?operation=saveRecord",userDoc,function(result){
					common.stopLoader();
					console.log("userDoc----:", result);
					common.createAlert("In complete",("Password Reset Successfully"),function(){
						location.href="/";
					});
				});
			}
		}else{
			this["errorFillData"].className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group";
		}
	},
	render:function(){
		return(
			<div className="col-lg-3 col-md-3 col-sm-4 col-xs-12 no-padding popUpLogin" style={{"box-shadow":"none"}}>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-top-gap-sm form-group">
					<div className="margin-bottom-gap" style={{"fontSize":"28px","fontWeight":"800"}}>Change Password:</div>
					<input type="password" className="form-control" placeholder="Password" onBlur={this.validatePassword} ref={(e)=>{this.password1=e}} />
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
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this.errorSamePswd=e}}>Please enter same passwords</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group hidden" style={{"color":"red","fontSize":"12px","textAlign":"left"}} ref={(e)=>{this.errorFillData=e}}>Please fill all the fields</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<button className="form-control margin-bottom-gap-sm customLogin" onClick={this.savePassword}>Update</button>
				</div>
			</div>
		);
	}
});
exports.ForgotPassword=ForgotPassword;


var Footer = React.createClass({
    getInitialState:function(){
        return ({footer:(this.props.footerData?this.props.footerData:require('../../stores/DefinitionStore').getDefinition((common.getConfigDetails() && common.getConfigDetails().footerDocId)?common.getConfigDetails().footerDocId:"Footer"))});
    },
    _onChange:function(){
        this.setState({footer:(this.props.footerData?this.props.footerData:require('../../stores/DefinitionStore').getDefinition((common.getConfigDetails() && common.getConfigDetails().footerDocId)?common.getConfigDetails().footerDocId:"Footer"))});
    },
    componentWillUnmount: function() {
        require('../../stores/DefinitionStore').removeChangeListener(this._onChange);
    },
    componentDidMount:function(){
        if(!this.props.footerData){
            ActionCreator.getDefinition((common.getConfigDetails() && common.getConfigDetails().footerDocId)?common.getConfigDetails().footerDocId:"Footer");
            require('../../stores/DefinitionStore').addChangeListener(this._onChange);
        }
    },
    linkDetail:function(url,target,authentication){
        var flag=false;
        if(authentication!=undefined && authentication==true){
            if(typeof common.getUserDoc().recordId !="undefined"){
                flag=true;
            }else{
                /*var node=document.createElement("div");
                node.id= global.guid();
                node.className="lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
                document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
                ReactDOM.render(<common.PopUpComponent login={"login"}/>,node);*/
                var node = document.createElement("div");
                node.id = global.guid();
                var popUpId = global.guid();
                var contentDivId = global.guid();
                var sideDivId = global.guid();
                node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
                document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
                ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
                ReactDOM.render(<LoginPopup popUpId={popUpId} />,document.getElementById(contentDivId));
            }
        }else{
            flag=true;
        }
        if(flag){
            if(this.props.fromBottomMore){
                this.props.close();
            }
            $('html,body').scrollTop(0);
            if(this.props.footerData && target && target.method ){
                var node = document.createElement("div");
                node.id = global.guid();
                var popUpId = global.guid();
                var contentDivId = global.guid();
                var sideDivId = global.guid();
                node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
                document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
                ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
                if(target.method=="DetailView"){
                    ReactDOM.render(<genericView.GoIntoDetail  rootSchema={target.schema}
                                        dependentSchema={target.dependentSchema}
                                        recordId={target.recordId}
                                        org={target.org?target.org:"public"} />,document.getElementById(contentDivId));
                }else if(target.method=="SummaryView"){
                    ReactDOM.render(<genericView.SummarizeAll
                                        schema={target.schema}
                                        filters={target.filters}
                                        dependentSchema={target.dependentSchema}
                                        org={target.org?target.org:"public"}
                                        skip={target.skip?target.skip:0}/>,document.getElementById(contentDivId));
                }else if(target.method=="Create"){
                    var schemaDoc=SchemaStore.getSchema(target.schema);
                    var editFields;
                    editFields=Object.keys(schemaDoc["@properties"]);
                    ReactDOM.render(<manageRecords.DisplayCustomSchema  org={target.org?target.org:"public"}
                                            schemaName={target.schema}
                                            prompt={target.prompt}
                                            createHeading={target.createHeading}
                                            knownData={target.knownData}
                                            editFields={editFields}
                                            dependentSchema={target.dependentSchema}
                                        />,document.getElementById(contentDivId));
                }
            }else{
                browserHistory.push(url);
            }

        }

    },

    render:function(){
        var self=this;
        var divLength=12;
        if(self.state.footer){
            divLength=12/(self.state.footer.columnNo);
        }
    //  var tabCol="col-lg-"+divLength+" col-md-"+(divLength < 4 ?"4": divLength  )+" col-sm-"+Math.round(((3/2)*divLength))+" col-xs-12"+" text-left no-padding-left text-uppercase";
        return (<div className="">
                    <div id="footerSocial">
                    {
                        (self.state.footer && self.state.footer.socialPages)?(
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group margin-bottom-gap  text-center margin-top-gap-sm">
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding uppercase margin-bottom-gap-xs">
                                <span className="propertyName">CONNECT WITH US</span>
                            </div>
                            {(self.state.footer.socialPages.facebook)?(
                            <a href={self.state.footer.socialPages.facebook.url}
                                    title={self.state.footer.socialPages.facebook.displayName}
                                    className="btn btn-social grow  no-padding-left"
                                    target="_blank">
                                <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Facebook.svg" className="img socialIcon" alt={self.state.footer.socialPages.facebook.displayName}/>
                            </a>):("")}
                            {(self.state.footer.socialPages.twitter)?(
                            <a href={self.state.footer.socialPages.twitter.url}
                                    className="btn btn-social grow  no-padding-left"
                                    target="_blank"
                                    title={self.state.footer.socialPages.twitter.displayName}>
                                <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Twitter.svg" className="img socialIcon" alt={self.state.footer.socialPages.twitter.displayName}/>
                            </a>):("")}
                            {(self.state.footer.socialPages.linkedin)?(
                            <a href={self.state.footer.socialPages.linkedin.url}
                                    className="btn btn-social grow  no-padding-left"
                                    target="_blank"
                                    title={self.state.footer.socialPages.linkedin.displayName}>
                                <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/LinkedIn.svg" className="img socialIcon" alt={self.state.footer.socialPages.linkedin.displayName}/>
                            </a>):("")}
                            {(self.state.footer.socialPages.gplus)?(
                            <a href={self.state.footer.socialPages.gplus.url}
                                    className="btn btn-social grow  no-padding-left"
                                    target="_blank"
                                    title={self.state.footer.socialPages.gplus.displayName}>
                                <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/GooglePlus.svg" className="img socialIcon" alt={self.state.footer.socialPages.gplus.displayName}/>
                            </a>):("")}

                        </div>):("")
                    }
                    </div>
                    <div id="footerLinks">
                    {
                        ["a"].map(function(temp){
                            if(self.state.footer && self.state.footer.UILayout){
                                return(<div key={global.guid()} className="row no-margin">
                                {
                                self.state.footer.UILayout.map(function(Layout){
                                    return  Layout.map(function(link){
                                        var linkName="";
                                        var target={};
                                        var authentication=false;
                                            self.state.footer.footerLinks.map(function(footerLink){
                                                if(footerLink.footerId==link){
                                                    linkName=footerLink.displayName;
                                                    target=footerLink.target;
                                                    authentication=footerLink.authentication;

                                                }
                                            });
                                            if(linkName!=""){
                                                var url="";
                                                if(target.url){
                                                    url=target.url;
                                                }else if(target.method=="DetailView"){
                                                    url=(linkGenerator.getDetailLink({org:target.org?target.org:"public",schema:target.schema,recordId:target.recordId,dependentSchema:target.dependentSchema}));
                                                }else if(target.method=="SummaryView"){
                                                    url=linkGenerator.getSummaryLink({org:target.org?target.org:"public",schema:target.schema,dependentSchema:target.dependentSchema,filters:target.filters});
                                                }else if(target.method=="Create"){
                                                        var schemaDoc=SchemaStore.getSchema(target.schema);
                                                        var editFields;
                                                        editFields=Object.keys(schemaDoc["@properties"]);

                                                        var actions=[];
                                                        try{
                                                            var allActions=Object.keys(schemaDoc["@operations"]["actions"]);
                                                                actions=allActions;
                                                            var validMethods=Object.keys(schemaDoc["@state"][schemaDoc["@initialState"]]);
                                                            var newActions=[];
                                                            for(var i=0;i<actions.length;i++){
                                                                if(validMethods.indexOf(actions[i])>-1){
                                                                    newActions.push(actions[i]);
                                                                }
                                                            }
                                                            actions=newActions;
                                                        }catch(err){
                                                            console.log("error while deciding actions;");
                                                        }
                                                        var coeData={
                                                            editFields:editFields,
                                                            readOnlyFields:[],
                                                            actions:actions,
                                                            knownData:target.knownData,
                                                            dependentSchema:target.dependentSchema,prompt:target.prompt,createHeading:linkName
                                                        };
                                                        url=linkGenerator.getCOELink({org:target.org?target.org:"public",schema:target.schema,coeData:coeData});
                                                   }else{

                                                   }

                                                return (<div key={global.guid()} className={(self.props.footerData && self.props.footerData.columnNo )?defineRecordLayout.calculateCols(self.props.footerData.columnNo):"col-lg-2 col-md-2 col-sm-4 col-xs-12 text-left no-padding-left text-uppercase text-center "}>
                                                            <span onClick={self.linkDetail.bind(self,url,target,authentication)} className="link h6">{linkName}</span>
                                                            {(target && target.method!="Create")?(<Link className="hhidden" to={url}>{linkName}</Link>):("")}
                                                        </div>)
                                            }else{
                                                return (<div key={global.guid()} className="hidden"></div>)
                                            }
                                        })
                                    })
                                    }
                                    </div>)
                            }else{
                                return (<div key={global.guid()} className="hidden"></div>)
                            }
                        })
                    }
                    </div>
                    {
                        this.props.footerData?(<div className="hidden"></div>):
                            (<div className="row no-margin text-center footerText">
                                <div>Copyright 	&copy;&nbsp;{new Date().getUTCFullYear()} {(common.getConfigDetails() && common.getConfigDetails().tradeName)?<span>{common.getConfigDetails().tradeName}</span>:<span></span>}.</div>
                                <div>The {(common.getConfigDetails() && common.getConfigDetails().title)?<span>{common.getConfigDetails().title.replace(".com","")}</span>:<span></span>} name and logo are registered trademarks of {(common.getConfigDetails() && common.getConfigDetails().tradeName)?<span>{common.getConfigDetails().tradeName}</span>:<span></span>}. Use of this website constitutes acceptance of our Terms of Use.</div>
                                <div>The material on this website may not be reproduced, distributed, transmitted, cached or otherwise used, except with the prior written permission of {(common.getConfigDetails() && common.getConfigDetails().tradeName)?<span>{common.getConfigDetails().tradeName}</span>:<span></span>}.</div>
                            </div>)
                    }
        </div>);
    }
})
exports.Footer=Footer;
