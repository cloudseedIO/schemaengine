'use strict';
var React = require("react");
var ReactDOM = require("react-dom");
var global = require("../../../utils/global.js");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var common = require("../../common.jsx");
var manageRecords =require("../../records/manageRecords.jsx");
var browserHistory = require("react-router").browserHistory;


class ManufacturerInfo extends React.Component {
	componentDidMount(){
			var node = document.createElement("div");
		 	node.id = global.guid();


      node.style.backgroundImage="url('https://res.cloudinary.com/dzd0mlvkl/image/upload/v1540537230/Test_Landing_Page_c57ntm.jpg')";

			node.style.backgroundSize="cover";
			node.style.zIndex="9999";

		 	var popUpId = global.guid();
		 	var contentDivId = global.guid();
		 	var sideDivId = global.guid();
		  node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
			ReactDOM.render(<common.GenericPopUpComponent hideClose={true} popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true} alignMiddleDiv={true}/>,node);
			ReactDOM.render(<ManufacturerInfoComponent node={node} contentDivId={contentDivId}/>,document.getElementById(contentDivId));
	}
	render(){
		return (<div className="hidden"></div>);
	}
}
exports.ManufacturerInfo=ManufacturerInfo;


class ManufacturerInfoComponent extends React.Component {
  constructor(props) {
    super(props);
		this.state={
			categories:[]
		}
		this.setPropsToShow=this.setPropsToShow.bind(this)
		this.professionSelect=this.professionSelect.bind(this)
  }
	submit(){
		var self = this;
		this["errorFirstName"].className="hidden";
		this["errorLastName"].className="hidden";
		this["errorEmail"].className="hidden";
		this["errorCompanyName"].className="hidden";
		this["errorPhoneNo"].className="hidden";
		this["errorWebsite"].className="hidden";
		if(this.props.architect){
					this["errorProfession"].className="hidden";
					if(this["errorOtherProfession"])
					this["errorOtherProfession"].className="hidden";
					this["errorCity"].className="hidden";
		}else{
			this["errorCategories"].className="hidden";
			if(this["errorOtherCategory"])
			this["errorOtherCategory"].className="hidden";
		}

		var givenName=this["givenName"].value.trim();
		var familyName=this["lastName"].value.trim();
		var email=this["email"].value.trim();
		var phoneNo=this["phoneNo"].value.trim();
		var companyName=this["companyName"].value.trim();
		var website=this["website"].value.trim();
		if(typeof website=="string"){
			website = website.toLowerCase();
		}
		var self=this;
		var regForUrl = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
		var regForWebsite = /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
		var flag=false;
		if(givenName == ""){
			this["errorFirstName"].className="";
			scrollTo(this["errorFirstName"]);
		}else if(familyName == ""){
			this["errorLastName"].className="";
			scrollTo(this["errorLastName"]);
		}else if((email == "") ||(email!="" && !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)))){
			this["errorEmail"].className="";
			scrollTo(this["errorEmail"]);
		}else if(companyName == ""){
			this["errorCompanyName"].className="";
			scrollTo(this["errorCompanyName"]);
		}else if((website=="") ||(website!="" && !regForWebsite.test(website))){
			this["errorWebsite"].className="";
			scrollTo(this["errorWebsite"]);
		}else if(phoneNo == "" || (phoneNo!="" && (!(/^\d{10}$/).test(phoneNo)))){
			this["errorPhoneNo"].className="";
			scrollTo(this["errorPhoneNo"]);
		}else if(this.state.categories.length==0 && typeof this.props.architect =="undefined"){
			this["errorCategories"].className="";
			scrollTo(this["errorCategories"]);
		}else if(this.state.categories.indexOf("Other")!=-1 && typeof this.props.architect =="undefined"){
				if(this.otherCategory.value.trim()!==""){
						var val=this.state.categories;
						val=val.concat(this.otherCategory.value.trim().split(","));
						this.setState({categories:val},function(){
						save();
						})
				}else{
					this["errorOtherCategory"].className="";
					scrollTo(this["errorOtherCategory"]);
				}
		}else if(typeof this.props.architect !="undefined"){
			var city=this.city.value.trim();
			var profession=this.profession.value;
			if(city==""){
				this["errorCity"].className="";
				scrollTo(this["errorCity"]);
			}else if (profession=="Select your profession"){
				this["errorProfession"].className="";
				scrollTo(this["errorProfession"]);
			}else if (profession=="Other"){
					if(this.otherProfession.value.trim()!==""){
						save();
					}else{
						this["errorOtherProfession"].className="";
						scrollTo(this["errorOtherProfession"]);
					}

			}else{
				save();
			}
		}else{
			save();
		}
		function save(){
			var record = {};
			record={"docType": "ManufacturerInfo",
			  "cloudPointHostId": "wishkarma",
			  "recordId": "ManufacturerInfo-"+global.guid(),
			  "author": "administrator",
			  "editor": "administrator",
			  "dateCreated": global.getDate(),
			  "dateModified":global.getDate(),
			  "revision": 1,
			  "org": "public",
			  "$status": "published"
			}
			record.givenName=givenName;
			record.familyName=familyName;
			record.email=email;
			record.phoneNo=phoneNo;
			record.companyName=companyName;
			record.website=website;
			record.requestType=self.props.architect?"Architect":"Manufacturer";
			if(self.props.architect){
					record.profession = self.otherProfession.value.trim();
					record.city = self.city.value.trim();
			}else{
					record.categories=self.state.categories;
			}
			record.additionalInfo=$(self["textarea"])[0].value.trim();
			common.startLoader();
      WebUtils.doPost("/generic?operation=saveRecord",record,function(result){
				common.stopLoader();
				if(result && result.data && result.data.success){
					if(self.props.architect){
							//do nothing
					}else{
							browserHistory.push("/");
					}
					self.props.node.remove();
				}else{
					common.createAlert("In complete","SomeThing went wrong Try Again");
					browserHistory.push("/manufacturerInfo")
				}
			});
		}
		function scrollTo(node){
	       node.parentNode.scrollIntoView();
 		}
	}
	setPropsToShow(data){
		var self=this;
		var flag=false;
		if(this.state.categories.indexOf("Other")==-1 && data.indexOf("Other")!=-1){
			flag=true;
		}
		this.setState({categories:data},function(){
			try{
				self["errorCategories"].className="hidden";
				if(!flag){
					$($(self.categories).children()[1]).addClass("open");
				}
			}catch(err){

			}
		})
	}
	professionSelect(){
			if(this.profession.value=="Other"){
					$(this.otherProfessionDiv).removeClass("hidden");
			}else{
					$(this.otherProfessionDiv).addClass("hidden");
			}
	}
  render(){
		var categories=["Bathroom","Lighting","Kitchen","Furniture","Electrical","Material","Fixtures","Plumbing","Outdoor","Equipment","Safety","Other"];
		var profession=["Architect","Interior Designer","Property Developer","Designer","Other"];
		var self=this;
    return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"  ref={(e)=>{this.container=e}}>
              <div className="col-lg-8 col-md-8 col-sm-6 col-xs-12  " style={{"background":"#FFFFFF"}}>
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" >
									<img src="/branding/wklogonopad.svg" className="img-responsive" style={{"margin": "3% 0","height":"5vw" }}/>
								</div>
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm" >
									<img  className="img-responsive"  src="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1540383260/mfrinfo.jpg"/>
								</div>
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center margin-bottom-gap-sm">
									<h2>{this.props.architect?"Get Product Quotes, Lead Times and Product Customizations Directly From Best Brands and Manufacturers across the Globe":"The Worlds leading design brands are already on board"}</h2>
									<div><h5>{this.props.architect?"Wishkarma allows Architects, Interior Designers, and Property Builders to directly interact with 3000+ top brands across the globe":"We are proud to host more than 200,000 products from more than 3,000 brands and manufacturers across the globe"}</h5></div>
								</div>
              </div>
							<div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{"border":"1px solid","borderRadius":"5px","background":"#000","color":"#fff"}}>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap margin-top-gap text-center" style={{"fontSize":"18px","fontWeight":"600"}}>
											Request Information {this.props.architect?"To Brand":""}
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<input type="text" className="form-control text-indent" placeholder="First Name"  ref={(e)=>{this.givenName=e}} />
											<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorFirstName"]=e}}>Please enter first name </div>
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<input type="text" className="form-control text-indent" placeholder="Last Name"   ref={(e)=>{this.lastName=e}} />
											<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorLastName"]=e}}>Please enter last name </div>
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<input type="email" className="form-control text-indent" placeholder="Email Id"   ref={(e)=>{this.email=e}} />
											<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorEmail"]=e}}>Please enter valid email id </div>
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<input type="text" className="form-control text-indent" placeholder="Company Name"   ref={(e)=>{this.companyName=e}} />
											<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorCompanyName"]=e}}>Please enter company name </div>
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<input type="text" className="form-control text-indent" placeholder="Website"   ref={(e)=>{this.website=e}} />
											<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorWebsite"]=e}}>Please enter valid website address </div>
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<input type="tel" className="form-control" placeholder="Phone No"   ref={(e)=>{this.phoneNo=e}} />
											<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorPhoneNo"]=e}}>Please enter valid phone number </div>
										</div>
											{
												this.props.architect?
													(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group ">
															<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding">
																<input type="text" className="form-control text-indent" placeholder="Location/City"   ref={(e)=>{this.city=e}} />
																<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorCity"]=e}}>Please enter location </div>
															</div>
															<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding" >
																<select className="form-control" onClick={self.professionSelect} ref={(e)=>{this.profession=e}}>
																	<option >Select your profession</option>
																	{
																			profession.map(function(prof){
																				return (<option value={prof}>{prof}</option>)
																			})
																	}
																</select>
																<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorProfession"]=e}}>
																	Please select profession
																</div>
															</div>
															<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding hidden" ref={(e)=>{this.otherProfessionDiv=e}}>
																<input type="text" className="form-control text-indent" placeholder="Enter other profession"   ref={(e)=>{this.otherProfession=e}} />
																<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorOtherProfession"]=e}}>
																	Please fill other profession
																</div>
															</div>
														</div>)
															:(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group list-unstyled" ref={(e)=>{this.categories=e}}>
																	<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "+(this.state.categories.length>0?"margin-top-gap-xs  margin-bottom-gap-xs":"hidden")} style={{"minHeight":"0px"}} >
																		{
																					this.state.categories.map(function(category){
																								return <div key={global.guid()} className="display-inline-block">{category}&nbsp;&nbsp;</div>
																					})
																		}
																	</div>
																	<div style={{position: "relative"}}>
																    <a data-toggle="dropdown" className="dropdown-toggle" aria-expanded="false">
																				<button style={{"color":"#000","fontWeight":"800"}} className="form-control" >
																					Select your categories
																				</button>
																		</a>
																    <ul style={{padding: "10px","color":"#000","maxHeight":"10vw","width": "100%"}} className="dropdown-menu arrow_box">
																			<manageRecords.CustomMultiPickList
														            onChange={self.setPropsToShow}
														            optionsType="arrayOfStrings"
														            options={categories}
														            displayName={"displayName"}
														            minSelect={0}
																				checkBoxPosition={"right"}
														          />
																		</ul>
																</div>
																<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorCategories"]=e}}>
																	Please select atleast one category
																</div>
																		{
																				(this.state.categories.indexOf("Other")!=-1)?
																						(	<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-top-gap form-group no-padding list-unstyled" ref={(e)=>{this.otherCategories=e}}>
																									<input type="text" className="form-control text-indent" placeholder="Enter categories seperated with comma(,) "   ref={(e)=>{this.otherCategory=e}} />
																								<div className="hidden" style={{"color":"white","fontSize":"12px","textAlign":"left","paddingTop":"5px"}} ref={(e)=>{this["errorOtherCategory"]=e}}>
																									Please fill other category
																								</div>
																							</div>):(<div className="hidden" />)
																		}
															</div>)
												}
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
											<textarea className="form-control text-indent" placeholder="Additional Requests if any"  rows="5" ref={(e)=>{this.textarea=e}} />
										</div>
										<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
											<button style={{"color":"#000","fontWeight":"800"}} onClick={this.submit.bind(this)} className="form-control margin-bottom-gap margin-top-gap-sm"   ref={(e)=>{this.continuebutton=e}}>SUBMIT</button>
										</div>
									</div>
							</div>
            </div>)
  }

}
exports.ManufacturerInfoComponent=ManufacturerInfoComponent;

