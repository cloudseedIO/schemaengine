/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPIUtils=require("../../utils/WebAPIUtils.js");
var global=require('../../utils/global.js');

var NewsLetter=React.createClass({
	getInitialState:function(){
		return {newsletters:[]};
	},
	componentDidMount:function(){
		this.getNewsletters();
	},
	getNewsletters:function(){
		common.startLoader();
		WebAPIUtils.doPost("/newsletter?operation=getnewsletters",{},function(result){
			common.stopLoader();
			if(Array.isArray(result))
			this.setState({newsletters:result});
  		}.bind(this));
	},
	backToAll:function(){
		this.setState({mode:undefined,current:undefined},this.getNewsletters);
	},
	render:function(){
		if(this.state.mode=="create"){
			return <MfrNewsLetterComposer cancel={this.backToAll}/>
		}else if(this.state.current){
			return <MfrNewsLetterView newsletter={this.state.current} cancel={this.backToAll}/>
		}else{
			return <div>
				<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<h1>Manufacturers Newsletters</h1>
				</div>
				<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Status</th>
								<th>Date Created</th>
								<th>Date Modified</th>
							</tr>
						</thead>
						<tbody>
						{
							this.state.newsletters.map(function(newsletter){
								return <tr key={newsletter.recordId} className="pointer" onClick={()=>{this.setState({current:newsletter})}}>
									<td>{newsletter.name}</td>
									<td>{newsletter["$status"]}</td>
									<td>{global.getLocaleDateString(newsletter.dateCreated)}</td>
									<td>{global.getLocaleDateString(newsletter.dateModified)}</td>
								</tr>
							}.bind(this))
						}
						</tbody>
					</table>
				</div>
				
				<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<div className="display-inline-block extra-padding-right">
						<button type="button"  className="chatButton" onClick={()=>{this.setState({mode:"create"})}}>
							Create New
						</button>
					</div>
				</div>
			</div>
		}
	}
});
exports.NewsLetter=NewsLetter;


var SignInWithGmail = React.createClass({
	sendNewsLetter:function(){
		
		var userName=this.email.value.trim();
		var password=this.password.value;
		var self=this;
		if(this.gmailError){
		    this.gmailError.className="hidden";
		}
		if(this.passwordError){
            this.passwordError.className="hidden";
        }
		if(userName==""){
		    this.gmailError.className="errorMsg";
		    this.gmailError.innerHTML="Please enter work email address"
			//alert("please enter user name");
			return;
		}
		if(password==""){
		    this.passwordError.className="errorMsg";
            this.passwordError.innerHTML="Please enter password"
            //alert("please enter password");
			return;
		}

		if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userName)){
			userName=userName.toLowerCase();
			var email=userName;
			var password=password;
			this.props.callbackToClosePopup();
			this.props.submitNewsLetter(email,password);
		}else{
			this.gmailError.className="errorMsg";
		    this.gmailError.innerHTML="Please enter vaild email address"
		}
		
	},
	skipNewsLetter:function(){
		this.props.callbackToClosePopup();
		this.props.submitNewsLetter();
	},
	render:function(){
		return(
			<div className="col-lg-3 col-md-4 col-sm-5 col-xs-12 no-padding popUpLogin">
	            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group text-center" style={{"fontSize":"24px","fontWeight":800}}>Send NewsLetter with your personal email?</div>
	            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
	                <input className="form-control " type='text' ref={(e)=>{this.email=e}} id="email" placeholder="Enter your email address"/>
	                 <div ref={(e)=>{this.gmailError=e}} className=" errorMsg hidden"></div>
	            </div>
	            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
	                <input className="form-control " type='password' ref={(e)=>{this.password=e}} id="password" placeholder="Password"/>
	                <div ref={(e)=>{this.passwordError=e}} className=" errorMsg hidden"></div>
	            </div>
	            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
		            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
		                <button id="sendButton" className="form-control customLogin"  ref={(e)=>{this.sendButton=e}} onClick={this.sendNewsLetter}>SEND</button>
		            </div>
		            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group margin-top-gap">
		                <button id="skipButton" className="form-control customLogin"  ref={(e)=>{this.skipButton=e}} onClick={this.skipNewsLetter}>
		                	USE MAILGUN
		                </button>
		            </div>
		        </div>
	
	        </div>
		)
	}
})


var MfrNewsLetterView=React.createClass({
	getInitialState:function(){
		return {newsletter:this.props.newsletter,mode:"view"};
	},
	componentDidMount:function(){
		this.getPreview();
	},
	getPreview:function(){
		WebAPIUtils.doPost("/newsletter?operation=getnewsletter",this.state.newsletter,function(nlr){
			this.setState({newsletter:nlr},function(){
				WebAPIUtils.doPost("/newsletter?operation=previewnewsletter",this.state.newsletter,function(result){
					for(var i=0;i<this.previewDiv.children.length;i++){
						this.previewDiv.children[i].remove();
					}
					var node = document.createElement("iframe");
					node.style.border="0px";
					node.style.width="100%";
					node.style.height="-webkit-fill-available";//,-moz-available,fill-available";
					node.style.maxHeight="50%";
					node.src = 'data:text/html;charset=utf-8,' + encodeURI(result.html);					
					node.id = global.guid();
					this.previewDiv.appendChild(node);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	},
	submitNewsLetter:function(email,password){
		var newsletter=this.state.newsletter;
		if(email && password){
			newsletter["gmailSMTP"]={
				email:email,
				password:password
			};
		}
		WebAPIUtils.doPost("/newsletter?operation=processnewsletter",this.state.newsletter,function(result){
			if(result.error){
				common.createAlert("Error",result.error);
			}else{
				common.createAlert("Success",result.success)
			}
			this.props.cancel();
  		}.bind(this));
	},
	confirmNewsLetter:function(){
		common.createConfirm("Confirm",
			"Are you sure you want to send this newsletter to "+
			this.state.newsletter.manufacturers.length+" Manufacturers",function(confirmresult){
				if(confirmresult){
					var node = document.createElement("div");
				 	node.id = global.guid();
				 	var popUpId = global.guid();
				 	var contentDivId = global.guid();
				 	var sideDivId = global.guid();
				  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
				  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
					ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} alignMiddleDiv={true}/>,node);
					ReactDOM.render(<SignInWithGmail 
									submitNewsLetter={this.submitNewsLetter} 
									contentDivId={contentDivId}
									callbackToClosePopup={function() {
							            node.remove();
							        }}/>,document.getElementById(contentDivId));
				}
	  	}.bind(this));
	},
	testNewsLetter:function(){
		var newsletter=Object.assign({},this.state.newsletter);
		var email=prompt("Enter Email to send test mail","editorial@cloudseed.com");
		var mailformat = global.emailFormate;
		if(email && email.match(mailformat)){
			newsletter.email=email;
			WebAPIUtils.doPost("/newsletter?operation=testnewsletter",newsletter,function(result){
				if(result.error){
					common.createAlert("Error",result.error);
				}else{
					common.createAlert("Success",result.success)
				}
	  		}.bind(this));
	  	}
	},
	deleteNewsLetter:function(){
		common.createConfirm(this.state.newsletter.name,
			"Are you sure you want to delete this news letter ",function(confirmresult){
				if(confirmresult){
					WebAPIUtils.doPost("/newsletter?operation=deletenewsletter",{recordId:this.state.newsletter.recordId},function(result){
						this.props.cancel();
			  		}.bind(this));
				}
	  	}.bind(this));
	},
	backToView:function(newnewsletter){
		this.setState({newsletter:newnewsletter?newnewsletter:this.state.newsletter,mode:"view"},this.getPreview);
	},
	render:function(){
		if(this.state.mode=="view"){
			return <div>
				<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
					Name:{this.state.newsletter.name}<br/>
					From:{this.state.newsletter.from}<br/>
					Manufactures:<MfrFeild key={global.guid()} defaultValue={this.state.newsletter.manufacturers?this.state.newsletter.manufacturers:[]}/>
					<br/>
					Status:{this.state.newsletter["$status"]}<br/>
					Subject:{this.state.newsletter.subject}
				</div>
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"  ref={(e)=>{this.previewDiv=e;}}>
					<img className="innerLoader" src="/branding/cloudseedLoader.svg" />
				</div>
				{Array.isArray(this.state.newsletter.sendStatus)?(
					<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
						<h3 className="h3">Sending Status</h3>
						{
							this.state.newsletter.sendStatus.map(function(status){
								return <div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
									name:{status.name}<br/>
									Status:{status.error?JSON.stringify(status.error):JSON.stringify(status.success)}
								</div>
							})
						}
					</div>
				):""}
				<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<div className="display-inline-block extra-padding-right">
						<button type="button"  className="chatButton" onClick={()=>{this.setState({mode:"edit"})}}>
							Edit
						</button>
					</div>
					
					{this.state.newsletter && this.state.newsletter["$status"]=="draft"?(
					<div className="display-inline-block extra-padding-right">
						<button ref={(e)=>{this.sendButton=e}} type="button" className="chatButton" onClick={this.confirmNewsLetter}>
							Send
						</button>
					</div>
					):""}
					
					{this.state.newsletter && this.state.newsletter["$status"]=="draft"?(
					<div className="display-inline-block extra-padding-right">
						<button ref={(e)=>{this.testButton=e}} type="button" className="chatButton" onClick={this.testNewsLetter}>
							Send Test Mail
						</button>
					</div>
					):""}
					
					<div className="display-inline-block extra-padding-right">
						<button type="button"  className="chatButton" onClick={this.deleteNewsLetter}>
							Delete
						</button>
					</div>
					
					<div className="display-inline-block extra-padding-right">
						<button type="button"  className="chatButton" onClick={this.props.cancel}>
							Back to All
						</button>
					</div>
				</div>
				
			</div>
		}else{
			return <MfrNewsLetterComposer newsletter={this.state.newsletter} cancel={this.backToView.bind(null,undefined)}/>
		}
	}
});
var MfrNewsLetterComposer=React.createClass({
	getInitialState:function(){
		return this.props.newsletter?this.props.newsletter:{};
	},
	setPropertyValue(key,value){
		var state=this.state;
		state[key]=value;
		try{if(!$("#"+key+"InCompleteError").hasClass("hidden")){$("#"+key+"InCompleteError").addClass("hidden");}}catch(err){}
		this.setState(state);
	},
	showError:function(key){
		try{
			$('html, body,.lookUpDialogBox,#MfrNewsLetterContent').animate({
	    		scrollTop: $("#"+key).offset().top-60
			},0);
		}catch(err){}
        try{$("#"+"MfrNewsLetterContent"+" "+"#"+key+"InCompleteError").removeClass("hidden");}catch(err){}
	},
	hideError:function(key){
		try{if(!$("#"+key+"InCompleteError").hasClass("hidden")){$("#"+key+"InCompleteError").addClass("hidden");}}catch(err){}
	},
	updateMfrs:function(mfrs){
		this.setState({manufacturers:mfrs})
	},
	validateData:function(){
		var formData={};
		for(var key in this.state){
			formData[key]=this.state[key];
		}
		
		formData.name=this.name.value.trim();
		formData.senderName=this.senderName.value.trim();
		formData.subject=this.subject.value.trim();
		formData.message=this.message.value.trim();
		formData.from=this.fromemail.value.trim();
		formData.includeUnsubscribe=this.includeUnsubscribe.checked;
		if(!formData.name){
			this.showError("name");
			return false;
		}else{
			this.hideError("name");
		}
		
		if(!formData.senderName){
			this.showError("senderName");
			return false;
		}else{
			this.hideError("senderName");
		}
		
		if(!formData.from){
			this.showError("fromemail");
			return false;
		}else{
			this.hideError("fromemail");
		}
		if(!formData.manufacturers){
			this.showError("manufacturers");
			return false;
		}else{
			this.hideError("manufacturers");
		}
		if(!formData.message){
			this.showError("message");
			return false;
		}else{
			this.hideError("message");
		}
		if(!formData.subject){
			this.showError("subject");
			return false;
		}else{
			this.hideError("subject");
		}
		formData.docType="NewsLetter";
		formData.dateCreated = formData.dateCreated?formData.dateCreated:global.getDate();
		formData.dateModified = global.getDate();
		formData.author = formData.author?formData.author:common.getUserDoc().userId;
		formData.editor=common.getUserDoc().userId;
		formData.recordId=formData.recordId?formData.recordId:("NewsLetter"+global.guid());
		formData.revision=formData.revision?formData.revision+1:1;
		formData["$status"]=formData["$status"]?formData["$status"]:"draft";
		return formData;
	},
	preview:function(){
		var data=this.validateData();
		if(data){
			common.startLoader();
			WebAPIUtils.doPost("/newsletter?operation=previewnewsletter",data,function(result){
				common.stopLoader();
				for(var i=0;i<this.previewDiv.children.length;i++){
					this.previewDiv.children[i].remove();
				}
				var node = document.createElement("iframe");
				node.style.border="0px";
				node.style.width="100%";
				node.style.height="-webkit-fill-available";//,-moz-available,fill-available";
				node.src = 'data:text/html;charset=utf-8,' + encodeURI(result.html);					
				node.id = global.guid();
				this.previewDiv.appendChild(node);
			}.bind(this));
      	}
	},
	save:function(){
		var data=this.validateData();
		if(data){
			WebAPIUtils.doPost("/newsletter?operation=updatenewsletter",data,function(result){
				this.preview();
			}.bind(this));
      	}
	},
	saveAsNew:function(){
		var data=this.validateData();
		if(data){
			data.recordId="NewsLetter"+global.guid();
			data.dateCreated = global.getDate();
			data.dateModified = global.getDate();
			data.author = common.getUserDoc().userId;
			data.editor=common.getUserDoc().userId;
			data.revision=1;
			data["$status"]="draft";
			data.sendStatus=[];
			WebAPIUtils.doPost("/newsletter?operation=updatenewsletter",data,function(result){
				//this.preview();
				this.props.cancel(data);
			}.bind(this));
      	}
	},
	addToFocusedInput:function(val){
		if(this.state.current && this.state.current!="fromemail"){
			//this[this.state.current].value=this[this.state.current].value.trim()+" *|"+val+"|* ";
			//this[this.state.current].focus();
			
			var caretPos = this[this.state.current].selectionStart;
			var textAreaTxt = this[this.state.current].value;
			var txtToAdd = " *|"+val+"|* ";
			$(this[this.state.current]).val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos) );
		}
	},
	getMetaTags:function(){
		return <div className="row no-margin extra-padding">
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_SLUG")} title="Link to Manufacturer's page">Slug</div>
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_NAME")} title="Manufacturer's Name">Name</div>
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_CATS_NAMES")} title="Manufacturer's Product Category Names">Cat_Names</div>
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_CATS_GALLERY")} title="Manufacturer's Product Categories Gallery (Image, name and products count)">Cat_Gallery</div>
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_TOTAL_CATS")} title="Manufacturer's Total Categories count">Total_Cats</div>
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_TOTAL_PRO")} title="Manufacturer's Total Products count">Total_Products</div>
					<div className="link child-img-component" onClick={this.addToFocusedInput.bind(null,"MFR_PRODUCTS")} title="Manufacturer's 20 sample products (image and name)">Sample_Products</div>
				</div>
	},
	render:function(){
		return <div>
				<div className="parent contentNavHeight" id="MfrNewsLetterContent">
					<div  className="row no-margin">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<h2>Composing Newsletter</h2>
						</div>
					</div>
				<div  className="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding">
					
					<div  className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding-left extra-padding-right-lg">
					
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right">
									<span id={"name"+"InCompleteError"} className="errorMsg hidden">{"Please enter a name to the newsletter"}</span>
								</span>
								<input maxLength="60"
										id="name"
										type="text"
										className="form-control"
										defaultValue={this.state.name?this.state.name:""}
										ref={(e)=>{this.name=e}}
										placeholder="Enter newsletter name"/>
							</div>
						</div>
					
					
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right">
									<span id={"senderName"+"InCompleteError"} className="errorMsg hidden">{"Please enter sender name"}</span>
								</span>
								<input id="senderName"
										type="text"
										defaultValue={this.state.senderName?this.state.senderName:"Sidhartha Meka"}
										className="form-control"
										ref={(e)=>{this.senderName=e}}
										placeholder="Enter Sender Name"/>
							</div>
						</div>
						
					
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right">
									<span id={"fromemail"+"InCompleteError"} className="errorMsg hidden">{"Please enter from email Address"}</span>
								</span>
								<input id="fromemail"
										type="text"
										defaultValue={this.state.from?this.state.from:"sid.meka@cloudseed.com"}
										className="form-control"
										ref={(e)=>{this.fromemail=e}}
										placeholder="Enter from email"
										onFocus={()=>{this.setState({current:"fromemail"});}}/>
							</div>
						</div>
						
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<span className="extra-padding-right">
									<span id={"manufacturers"+"InCompleteError"} className="errorMsg hidden">{"Please select Manufacturers"}</span>
								</span>
								<MfrFeild defaultValue={this.state.manufacturers?this.state.manufacturers:[]} callback={this.updateMfrs}/>
							</div>
						</div>
						
						
						{(this.state.current=="subject")?(this.getMetaTags()):""}
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right">
									<span id={"subject"+"InCompleteError"} className="errorMsg hidden">{"Please enter subject"}</span>
								</span>
								<input maxLength="61"
										id="subject"
										type="text"
										className="form-control"
										ref={(e)=>{this.subject=e}}
										defaultValue={this.state.subject?this.state.subject:""}
										placeholder="Enter Newsletter subject"
										onFocus={()=>{this.setState({current:"subject"});}}/>
							</div>
						</div>
						
						
						{(this.state.current=="message")?(this.getMetaTags()):""}
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right">
									<span id={"message"+"InCompleteError"} className="errorMsg hidden">{"Please Enter message"}</span>
								</span>
								<textarea type="text"
										id="message"
										className="form-control"
										ref={(e)=>{this.message=e}}
										defaultValue={this.state.message?this.state.message:""}
										placeholder="Message"
										onFocus={()=>{this.setState({current:"message"});}}>
								</textarea>
							</div>
						</div>
						
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right">
								<span className="extra-padding-right">
									<span id={"message"+"InCompleteError"} className="errorMsg hidden">{""}</span>
								</span>
								<input type="checkbox"
										id="includeUnsubscribe"
										className="form-control"
										ref={(e)=>{this.includeUnsubscribe=e}}
										defaultChecked={this.state.includeUnsubscribe?this.state.includeUnsubscribe:""}/>
								<label htmlFor="includeUnsubscribe" className="vertical-align-middle no-margin">
					            	&nbsp;&nbsp;&nbsp;{"Include Unsubscribe link"}
   					            </label>
							</div>
						</div>
						
						<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
							{(!this.props.newsletter || this.props.newsletter["$status"]=="draft") ?(
							<div className="display-inline-block extra-padding-right">
								<button ref={(e)=>{this.saveButton=e}} type="button" className="chatButton" onClick={this.save}>
									Save
								</button>
							</div>
							):""}
							{this.props.newsletter?(
							<div className="display-inline-block extra-padding-right">
								<button ref={(e)=>{this.saveButton=e}} type="button" className="chatButton" onClick={this.saveAsNew}>
									Save as New
								</button>
							</div>
							):""}
							<div className="display-inline-block extra-padding-right">
								<button ref={(e)=>{this.previewButton=e}} type="button" className="chatButton" onClick={this.preview}>
									Preview
								</button>
							</div>
							<div className="display-inline-block extra-padding-right">
								<button type="button"  className="chatButton" onClick={this.props.cancel}>
									Back
								</button>
							</div>
						</div>
						
				</div>
				</div>
				<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding"  ref={(e)=>{this.previewDiv=e;}}>
					
				</div>
			</div>
		</div>
	}
});
var MfrFeild=React.createClass({
	getInitialState:function(){
		return {selected:Array.isArray(this.props.defaultValue)?this.props.defaultValue:[]};
	},
	updateSelection:function(selected){
		this.setState({selected:selected});
		this.props.callback(selected);
	},
	selectMfrs:function(){
		var node = document.createElement("div");
	    node.id = global.guid();
	    var popUpId = global.guid();
	    var contentDivId = global.guid();
	    var sideDivId = global.guid();
	    node.className ="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	    ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} />,node);
	    ReactDOM.render(<MfrSelection selected={this.state.selected} 
	    	callback={this.updateSelection}
	    	callbackToClosePopup={
				function(){
					node.remove();
				}
			}/>,document.getElementById(contentDivId));
	},
	render:function(){
		var textToShow=this.state.selected.map(function(record){return record.name}).join(", ");
		var recordId=global.guid();
	    var stringCount = 20;
	    var moreFlag = true;
	    var about1 = textToShow.split(", ").splice(0, stringCount * 1).join(", ");
	    var about2 =" " +textToShow.split(", ").splice(stringCount * 1, textToShow.length).filter(function(n) {return n != "" && n != undefined;}).join(", ");
	    if (about2.length > 1) {
	        var recordId = global.guid();
	        textToShow = "<div>" +
	           '<input type="checkbox" class="read-more-state" id=' +recordId +" />" +
	            '<p class="read-more-wrap no-margin" >' + about1 +'<span class="read-more-target">' + about2 +     "</span></p>" +
	            "&nbsp;<label for=" +recordId +' class="read-more-trigger morelink link"></label>' +"</div>";
		} else {
			textToShow = '<div><p class="no-margin">' + about1 + "</p></div>";
		}
		return <div>
			<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
				<h3>{this.state.selected.length +" "+"Manufacturers Selected"}</h3>
				<div>
					<span dangerouslySetInnerHTML={{ __html: textToShow }} />
				</div>
			</div>
			{typeof this.props.callback=="function"?(
			<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
				<div className="display-inline-block extra-padding-right">
					<button type="button"  className="chatButton" onClick={this.selectMfrs}>
						Select/Update Manufacturers
					</button>
				</div>
			</div>):("")}
		</div>
	}
});
var MfrSelection=React.createClass({
	getInitialState:function(){
		return {
			skip:0,
			limit:1500,
			records:[],
			selected:Array.isArray(this.props.selected)?this.props.selected:[],
			searchText:"",
			searchTextAdd:"",
			contacted:"all",
			"$status":"published"
		};
	},
	setSearchText:function(){
		this.setState({searchText:this.searchField.value.trim()});
	},
	setSearchTextAdd:function(){
		this.setState({searchTextAdd:this.searchFieldAdd.value.trim()});
	},
	setContacted:function(){
		this.setState({contacted:this.contacted.value});
	},
	setDocStatus:function(){
		this.setState({"$status":this["$status"].value});
	},
	componentDidMount:function(){
		this.getRecords();
	},
	getRecords:function(){
		var data={
	      schema: "Manufacturer",
	      filters: {},
	      org: "public",
	      skip: this.state.skip,
	      limit: this.state.limit,
	      sortBy: "name",
	      sortOrder: "ascend"
	   	};
	    common.startLoader();
		WebAPIUtils.doPost("/newsletter?operation=getmfrrecords",data,function(result){
			common.stopLoader();
			if(result.error){return;}
			this.setState({records:result.records});
		}.bind(this));
	},
	updateSelection:function(record){
		var selected=this.state.selected;
		if(document.getElementById(record.recordId).checked){
			selected=this.state.selected.concat([record]);
		}else{
			selected=this.state.selected.filter(function(s){
				return s.recordId!=record.recordId;
			});
		}
		this.setState({selected:selected});
	},
	selectAll:function(){
		var currselected=this.state.selected;
		this.state.records.map(function(record){
			var selected=false;
			this.state.selected.forEach(function(sr){
				if(sr.recordId==record.recordId){
					selected=true;
				}
			})
			
			var addressString=getAddressString(record.address);
			if(record.name.toLowerCase().indexOf(this.state.searchText.toLowerCase())>-1 && !selected){
				if(addressString.toLowerCase().indexOf(this.state.searchTextAdd.toLowerCase())>-1){
				
				if(this.state.contacted=="all" ||
								(this.state.contacted=="contacted" && record.contacted) ||
								(this.state.contacted=="notcontacted" && !record.contacted)){
							if(this.state["$status"]==record["$status"]){
				
				
					currselected.push(record);
				}
				}
				}
			}
		}.bind(this));
		this.setState({selected:currselected});
	},
	clearAll:function(){
		this.setState({selected:[]});
	},
	returnMfrs:function(){
		this.props.callback(this.state.selected);
		this.props.callbackToClosePopup();
	},
	render:function(){
		return <div>
				<div>
					<div className="pointer child-img-component">
						<input ref={(input)=>{this.searchField=input}} 
							type="text" 
							className="form-control" 
							placeholder="Name"
							defaultValue={this.state.searchText} 
							onChange={this.setSearchText} 
							autoFocus={true}/>
					</div>
					<div className="pointer child-img-component">
						<input ref={(input)=>{this.searchFieldAdd=input}} 
							type="text" 
							className="form-control" 
							placeholder="Address"
							defaultValue={this.state.searchTextAdd} 
							onChange={this.setSearchTextAdd}/>
					</div>
					<div className="pointer child-img-component">
						Contacted
						<select ref={(e)=>{this.contacted=e}} defaultValue={this.state.contacted} onChange={this.setContacted}>
							<option value="all">all</option>
							<option value="contacted">contacted</option>
							<option value="notcontacted">not contacted</option>
						</select>
					</div>
					<div className="pointer child-img-component">
						Doc Status
						<select ref={(e)=>{this["$status"]=e}} defaultValue={this.state["$status"]} onChange={this.setDocStatus}>
							<option value="draft">Draft</option>
							<option value="underReview">Under Review</option>
							<option value="published">Published</option>
							<option value="unPublished">Un Published</option>
							<option value="deleted">Deleted</option>
						</select>
					</div>
					<div className="pointer child-img-component">
						<button type="button"  className="chatButton" onClick={this.selectAll}>
							Select All
						</button>
					</div>
					<div className="pointer child-img-component">
						<button type="button"  className="chatButton" onClick={this.clearAll}>
							Clear All
						</button>
					</div>
					<div className="pointer child-img-component">
						<button type="button"  className="chatButton" onClick={this.returnMfrs}>
							Done
						</button>
					</div>
				</div>
				<div>
					<div>
					{
						this.state.selected.map(function(record){
							return <div key={global.guid()} className="pointer">
								<div className="link child-img-component">
									<input id={record.recordId} type="checkbox" 
										defaultChecked={true}
										onChange={this.updateSelection.bind(null,record)}/>
									
									<label htmlFor={record.recordId} className="vertical-align-middle no-margin">
						            	&nbsp;&nbsp;&nbsp;{record.name}
						          </label>
								</div>
								<div className="link child-img-component">
									{record.address?record.address.email:""}
								</div>
								<div className="link child-img-component">
									{getAddressString(record.address)}
								</div>
							</div>
						}.bind(this))
					}
					</div>
				
					<div>
					{
						this.state.records.map(function(record){
							var selected=false;
							this.state.selected.forEach(function(sr){
								if(sr.recordId==record.recordId){
									selected=true;
								}
							})
							var addressString=getAddressString(record.address);
							if(record.name.toLowerCase().indexOf(this.state.searchText.toLowerCase())>-1 && !selected){
							if(addressString.toLowerCase().indexOf(this.state.searchTextAdd.toLowerCase())>-1){
							if(this.state.contacted=="all" ||
								(this.state.contacted=="contacted" && record.contacted) ||
								(this.state.contacted=="notcontacted" && !record.contacted)){
							if(this.state["$status"]==record["$status"]){
								return <div key={global.guid()} className="pointer">
									<div className="link child-img-component">
										<input id={record.recordId} type="checkbox" 
											defaultChecked={selected}
											onChange={this.updateSelection.bind(null,record)}/>
										
										<label htmlFor={record.recordId} className="vertical-align-middle no-margin">
							            	&nbsp;&nbsp;&nbsp;{record.name}
							          </label>
									</div>
									<div className="link child-img-component">
										{record.address?record.address.email:""}
									</div>
									<div className="link child-img-component">
										{addressString}
									</div>
								</div>
							}
							}
							}
							}
						}.bind(this))
					}
					</div>
				</div>
				<div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-top-gap">
					<div className="display-inline-block extra-padding-right">
						<button type="button"  className="chatButton" onClick={this.returnMfrs}>
							Done
						</button>
					</div>
				</div>
			</div>
		}
});

function getAddressString(add){
		if(!add){
			return "";
		}
	   //{"addressCountry":"India","addressLocality":"Gurgaon","addressRegion":"New Delhi",
	   //"email":"customercare.in@grohe.com",
	   //"postalCode":"122001","streetAddress":"14th Floor, Building no5, Tower A DLF Cyber City, Phase III",
	   //"telephone":"+91-1244933000"}
	   var address="";
	   /*if(add.streetAddress){
	   	address+=add.streetAddress;
	   }
	   if(add.addressLocality && address.indexOf(add.addressLocality)==-1){
	   	address+=", "+add.addressLocality;
	   }*/
	   if(add.addressRegion && address.indexOf(add.addresRegion)==-1){
	   	address+=", "+add.addressRegion;
	   }
	   if(add.addressCountry && address.indexOf(add.addressCountry)==-1){
	   	address+=", "+add.addressCountry;
	   }
	   /*if(add.postalCode && address.indexOf(add.postalCode)==-1){
	   	address+=", "+add.postalCode;
	   }*/
	   return address; 
}
