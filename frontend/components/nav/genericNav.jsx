/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
//var search=require('./search.jsx');
var linkGenerator=require('./linkGenerator.jsx');
var SchemaStore = require('../../stores/SchemaStore');
var DefinitionStore=require('../../stores/DefinitionStore');
var global=require('../../utils/global.js');
var WebUtils=require('../../utils/WebAPIUtils.js');
var workflow=require('../view/components/workflow.jsx');

var AdminConsole=require('./adminNav.jsx').AdminConsole;
var Link=require('react-router').Link;
var browserHistory=require('react-router').browserHistory;
var FilterResultsNew=require('./filters.jsx').FilterResultsNew;
var FilterResults=require('./filters.jsx').FilterResults;
//var FilterResultsNew=require('./filters.jsx').FilterResultsNew;
//var orgStartPage=require('../view/components/orgStartupPage.jsx');
var compareView=require('../view/components/compareView.jsx');


function loadGenericNav(){
	//ReactDOM.unmountComponentAtNode(document.getElementById('mainNavigation'));
	document.getElementById('mainNavigation').className=document.getElementById('mainNavigation').className.replace("hideMainNav","");
	try{
    //depending on the template we configure in the config file navigation is rendered
		if(common.getConfigDetails().handleBarTemplate=="jsm" || common.getConfigDetails().handleBarTemplate=="wevaha"){
			ReactDOM.render(<GenericTopNav/>,document.getElementById('mainNavigation'));
		}else{
			ReactDOM.render(<GenericNav/>,document.getElementById('mainNavigation'));
		}
	}catch(err){
		ReactDOM.render(<GenericNav/>,document.getElementById('mainNavigation'));
	}
}
exports.loadGenericNav=loadGenericNav;

function getSubNavUrl(sublink,org){
  // for sublinks in the navigation
	if(sublink.target.url){
		if(sublink.target.url.indexOf("/")==0){
			return sublink.target.url;
		} else {
			return "/"+sublink.target.url;
		}
	}else if(sublink.target.schema){
    // generates summary links for the navlinks
		return linkGenerator.getSummaryLink({org:org?org:"public",schema:sublink.target.schema,dependentSchema:sublink.target.dependentSchema,filters:sublink.target.filters});
	}else if(sublink.target.landingPage){
    // generates landing page links for the navLinks
		return linkGenerator.getLandingLink({landingPage:sublink.target.landingPage});
	}
}
exports.getSubNavUrl=getSubNavUrl;

// component for mobile navigation
var GenericMobileNav=React.createClass({
	goToInnerLink:function(sublink,org){
		if(this.mainNav){
			$(this.mainNav).addClass("hidden");
    	$(this.mainNav).removeClass("newSearch");
		}
			if(this.subNav){
        // component for mobile subnav
				ReactDOM.render(<InnerMenu sublink={sublink} navData={{"mainNav":this.mainNav,"subNav":this.subNav}} backLink={this.backLink} showMainNav={this.showMainNav} org={org} />,this.subNav);
				$(this.subNav).removeClass("hidden");
			}
	},
	backLink:function(navData){// function to show the previous nav and hide the present nav
			if(navData.subNav){
				ReactDOM.unmountComponentAtNode(navData.subNav);
				$(navData.subNav).addClass("hidden");
			}
      if(navData.mainNav){
  				$(navData.mainNav).removeClass("hidden");
          $(navData.mainNav).addClass("newSearch");
  		}
	},
	render:function(){
		var self=this;
			return (<div key={global.guid()} className="navbar-collapse navbar-collapse-1  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" role="navigation">
								<ul  className="nav navbar-nav  menu no-margin navMobile" id="navTop">
									{
										this.props.navs.map(function(nav,index){
											 if(nav.orgName!="" ){
												 //returning null as these are included at the user photo section
												 return ""
											 }else{
												 return <div key={global.guid()} className="newSearch col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(l)=>{self["mainNav"]=l}}>
												 					{
																		nav.elements.map(function(sublink){
																			if(sublink.target.elements){
																				 return  (<li key={global.guid()} onClick={self.goToInnerLink.bind(null,sublink.target.elements,nav.org)}>
																										<a >
																											<span>
																											 {sublink.displayName}
																										 	</span>
                                                      <span className="icons8-left-arrow pull-right" style={{"transform": "rotate(180deg)"}}>
                                                      </span>
																										 </a>
																								 	</li>)
																			}else{
																				return (<li key={global.guid()} className=" navHeading 1 navElement toggleOnClick">{/*  onClick={self.handleSubNav.bind(self,sublink,nav.org)}*/}
																									<Link   className="link" to={getSubNavUrl(sublink,nav.org)} ><span >{sublink.displayName}</span></Link>
																								</li>)
																			}
																	})
																}
																</div>
											 }
										 })
									 }
									 <div className="row no-margin hidden" ref={(l)=>{this.subNav=l}}>
									 </div>
								</ul>
							</div>)

	}
});
/*
sublink
org
*/
//component for 2nd level navigation in mobile
var InnerMenu=React.createClass({
	goToInnerLink:function(sublink){
		if(this.subNavHead){
				$(this.subNavHead).addClass("hidden");
        	$(this.subNavHead).removeClass("newSearch");
		}
			if(this.subNavInner){
				ReactDOM.render(<InnerMenu sublink={sublink} navData={{"mainNav":this.subNavHead,"subNav":this.subNavInner}} backLink={this.backLink} org={this.props.org} />,this.subNavInner);
				$(this.subNavInner).removeClass("hidden");
        	$(this.subNavInner).addClass("newSearch");
			}
	},
  backLink:function(navData){// function to show the previous nav and hide the present nav
			if(navData.subNav){
				ReactDOM.unmountComponentAtNode(navData.subNav);
				$(navData.subNav).addClass("hidden");
			}
      if(navData.mainNav){
  				$(navData.mainNav).removeClass("hidden");
          $(navData.mainNav).addClass("newSearch");
  		}
	},
	GoIntoDetail:function(url){
		if(url){
			browserHistory.push(url);
		}
	},
  goBackLink:function() {// function to back to the top level navigation
    this.props.backLink(this.props.navData);
  },

	render:function(){
		var self=this;
			return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding newSearch" ref={(l)=>{this.subNavHead=l}}>
                <div className="link backLink" style={{"textAlign":"left","fontSize":"14px","marginBottom":"10px"}}  onClick={this.goBackLink}>
                  <div  className="icons8-left-arrow-2  display-inline-block " >
                  </div>
                  <span>
                    &nbsp;{"BACK"}
                  </span>
                </div>
                {
									this.props.sublink.map(function(innerLink){
										if(innerLink.target && innerLink.target.elements && innerLink.target.elements.length>0){
											return (<li key={global.guid()} className="navHeading navElement toggleOnClick" onClick={self.goToInnerLink.bind(null,innerLink.target.elements)}>
																<a  className="link" >
																	<span >{innerLink.displayName}</span>
                                  <span className="icons8-left-arrow pull-right" style={{"transform": "rotate(180deg)"}}>
                                  </span>
																</a>
															</li>)
										}else{
											return (<li key={global.guid()} className="navHeading 2 navElement toggleOnClick">
																<a className="link" onClick={self.GoIntoDetail.bind(null,getSubNavUrl(innerLink,self.props.org))} >
																	<span>{innerLink.displayName}</span>
																</a>
															</li>)
										}
									})
								}
								</div>
								<div className=" col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(l)=>{this.subNavInner=l}}>
								</div>
							</div>)
	}
})


var GenericTopNav=React.createClass({
	getInitialState:function(){
    var mobile=false;
    if(typeof window!="undefined"
        &&  window
         && window.innerWidth <= 767) {
      mobile=true;
    }else{
      mobile=false;
    }

	  return ({shouldComponentUpdate:false,navLinks:require("../../stores/DefinitionStore").getNavigationLinks(),invite:"no","mobile":mobile});
	},
	componentWillUnmount:function(){
		DefinitionStore.removeChangeListener(this._onChange,"navigationLinks");
	},
	_onChange:function(){
		this.setState({shouldComponentUpdate:true,navLinks:DefinitionStore.getNavigationLinks()});
	},
	shouldComponentUpdate: function(nextProps, nextState) {
		return (JSON.stringify(this.state.navLinks)!= JSON.stringify(nextState.navLinks));
	},
	componentDidMount:function(){

		DefinitionStore.addChangeListener(this._onChange,"navigationLinks");
		$(".toggleOnClickLater").click(function(){
			$(".navbar-toggle").click();
			window.scrollTo(0,0);
		});
		if(this.state.mobile){
        // do nothing
		}else{
      // menu to wrap into MORE link in the navigation
			var self=this;
			var elemWidth, fitCount, varWidth = 0, ctr,
			menu = $("ul#navTop"), collectedSet;
			ctr = menu.children().length;
			menu.children().each(function() {
			  varWidth += $(this).outerWidth();
			});
			$(".menuwrap").removeClass("blackBackground");
			collect();
			$(window).resize(collect);

			function collect() {
				menu.children().removeClass("hidden");
		    elemWidth = menu.width();
		    fitCount = Math.floor((elemWidth / varWidth) * ctr) - 1;
		    collectedSet = menu.children(":gt(" + fitCount + ")");
		    $("#submenu").empty().append(collectedSet.clone());
		    collectedSet.addClass("hidden")
		    if( collectedSet.length>0){
		    	$(".collect").removeClass("hidden");
		    }else{
		    	$(".collect").addClass("hidden");
		    }
				$(".menuwrap").addClass("blackBackground");
				self.landingUrl();
			}
			if(document.getElementById("iconNav") && document.getElementById("navTop")){
				var node=document.createElement("div");
				node.id= global.guid();
				node.className="row userMobileImage";
				node.innerHTML=$("#iconNav").html();
				$("#navTop").prepend(node);
			}
		}
	},
	landingUrl:function(){
		$(".landingLinks").off('click');
		$(".landingLinks").click(function(e){
			if(e.currentTarget && e.currentTarget.parentElement && e.currentTarget.parentElement.parentElement && e.currentTarget.parentElement.parentElement.id && e.currentTarget.parentElement.parentElement.id=="submenu"){
					browserHistory.push(e.currentTarget.dataset.landingUrl);
			}
		})
	},
	componentDidUpdate:function(){
		var self=this;
		if(this.state.mobile){
        // do nothing
		}else{
			setTimeout(function(){
				var elemWidth, fitCount, varWidth = 0, ctr,
				menu = $("ul#navTop"), collectedSet;
				ctr = menu.children().length;
				menu.children().each(function() {
						varWidth += $(this).outerWidth();
				});
				$(".menuwrap").removeClass("blackBackground");
				collect();
				function collect() {
					menu.children().removeClass("hidden");
					elemWidth = menu.width();
					fitCount = Math.floor((elemWidth / varWidth) * ctr) - 1;
					collectedSet = menu.children(":gt(" + fitCount + ")");
					$("#submenu").empty().append(collectedSet.clone());
					collectedSet.addClass("hidden")
					if( collectedSet.length>0){
						$(".collect").removeClass("hidden");
					}else{
						$(".collect").addClass("hidden");
					}
					$(".menuwrap").addClass("blackBackground");
					self.landingUrl();
				}
			},100)
		}
	},
	render:function(){
		if(typeof this.state.navLinks == "undefined" || typeof this.state.navLinks.navs == "undefined"){
			return <div className="hidden"></div>
		}
		var self=this;
		if(typeof document !="undefined" && document.getElementById("iconNav")){
			document.getElementById("iconNav").innerHTML="";
		}
		var navs=[];
		//var projectNavs={
			//orgName:"My Projects",
			//elements:[]
		//};
		if(this.state.navLinks && this.state.navLinks.navs && this.state.navLinks.navs.length>0){
		    var publicOrgIndex=0;
		    this.state.navLinks.navs.map(function(newNav,index){
  		    if(newNav.orgSchema=="Project" || newNav.orgSchema=="MFRProject" ){
							//removing project from navigation
  		    }else{
  		        navs.push(newNav);
  		    }
    		});
		    if(navs[0] && navs[0].org!="public"){ // if public nav is not at the starting position of array then it is swapped
	        for(var i=0;i<navs.length;i++){
		        if(navs[i].org=="public"){
              publicOrgIndex=i;
            }
	        }
	        var temp=[];
	        var tempNav=navs;
	        temp=navs.slice(publicOrgIndex,publicOrgIndex+1);
	        delete tempNav[publicOrgIndex];
	        temp=temp.concat(tempNav);
	        temp = temp.filter(function( element ) {
	          return element !== undefined;
	         });
	        navs=temp;
		    }
		}
    var userData=common.getUserDoc();
    userData["profileLinks"]=[];
		if(this.state.mobile){
			return (<GenericMobileNav navs={navs} />)
		}else{
			return (<div itemScope="itemscope" itemType="http://www.schema.org/SiteNavigationElement" className="row">
									<div  className=" menuwrap navbar-collapse navbar-collapse-1  col-lg-12 col-md-12 col-sm-12 col-xs-12 extra-padding-top-xs extra-padding-bottom-xs " role="navigation">
		           			<ul  className="nav navbar-nav  menu no-margin" id="navTop">
		           				{
		           				 navs.map(function(nav,index){
		           						if(nav.orgName!="" ){
														//returning null as these are included at the user photo section
														return ""
		           						}else{
															return nav.elements.map(function(sublink){
																if(sublink.target.elements){
																	return (<li key={global.guid()} className="dropdown mega-dropdown">
																						<a className="dropdown-toggle link landingLinks" data-toggle="dropdown" data-landing-url={(sublink.landingPage?sublink.landingPage:"")} >
																						 	<span>
																						 	 	{sublink.displayName}
																					 		</span>
																						</a>
																						<DropDownNav
																						 	nav={sublink}
																						 	navlinks={self.props.navlinks}
																						 	org={nav.org}
																						 	elements={sublink.target.elements} />
																					</li>)
											 					}else{
																		if(sublink.profileLink  && sublink.profileLink=="true" && nav.org=="public"){
																			// not using right now
																			userData["profileLinks"].push({"navLink":sublink.displayName,"url":linkGenerator.getSummaryLink({org:"public",schema:sublink.target.schema,dependentSchema:sublink.target.dependentSchema,filters:sublink.target.filters})});
						                          common.setUserDoc(userData);
																		}else if(sublink.iconLink && nav.org=="public"){
																			// not using right now
																			if(typeof document !="undefined" && document.getElementById("iconNav")){
																					document.getElementById("iconNav").innerHTML+='<div class="display-inline-block extra-padding-right">'+
																								'<a  href=" '+linkGenerator.getSummaryLink({org:"public",schema:sublink.target.schema,dependentSchema:sublink.target.dependentSchema,filters:sublink.target.filters})+'" class="link">'+
																									'<img title="'+sublink.displayName+'" src="'+sublink.iconLink+'" class="profilePhoto pull-left img-circle"/>'+
																								'</a>'+
																								'</div>';
																			}
																			return ""
																		}else{
																			return (<li key={global.guid()} className="navHeading navElement toggleOnClick">{/*  onClick={self.handleSubNav.bind(self,sublink,nav.org)}*/}
																								<Link   className="link" to={getSubNavUrl(sublink,nav.org)} ><span >{sublink.displayName}</span></Link>
																							</li>)
																		}
																}
															},this)
														}
		           					})
		           				}
		           			</ul>
		           			 <ul className="nav  collect">
								        <li className="dropdown">
								            <div role="button" href="#" data-toggle="dropdown" className="dropdown-toggle">
									          	<div>More <span className="caret"></span></div>
									        	</div>
								            <ul id="submenu" className="dropdown-menu"></ul>
								        </li>
						    			</ul>
		           		</div>
							</div>)
		}
	}
});
exports.GenericTopNav=GenericTopNav;
/**
 *
 * navlinks
 * org
 * elements
 *
 **/
var DropDownNav=React.createClass({
	handleSubNav:function(sublink,org){
		$(".dropdown-toggle").removeClass("navLink-border-bottom");
    if(sublink.target ){
      if(sublink.target.landingPage){
        browserHistory.push(sublink.target.landingPage);
        return;
      }
      if(sublink.target.url){
        browserHistory.push(sublink.target.url);
        return;
      }
    }
	},
	openWorkflow:function(){
		workflow.workFlow("pjctwfl",undefined,this.props.org);
	},
	render:function(){
		var self=this;
		//var className="arrow_box nav_arrow";
		//if(this.props.inner){
			//className='';
		//}

		return (<ul className="dropdown-menu mega-dropdown-menu mobile-no-padding mobile-no-margin">
							{
								(this.props.addOrgLink && this.props.elements.length>0)?
									(<li  key={global.guid()} className="col-sm-3 col-xs-12 unequalDivs">
											<ul>
												<li  className="dropdown-header toggleOnClick" >
													<Link className="link"
														style={{"color":"inherit!important"}}
														to={linkGenerator.getDetailLink({record:{},org:this.props.org,schema:this.props.orgSchema?this.props.orgSchema:"Organization",recordId:this.props.org})} >
															{this.props.addOrgLink.toUpperCase()}
													</Link>
												</li>
											</ul>
										</li>):("")
							}
							{
								this.props.elements.map(function(sublink){
									if(sublink.target.elements){
									    var org=sublink.org?sublink.org:self.props.org;
										return(<li  key={global.guid()} className="col-sm-3 col-xs-12 unequalDivs">
															<ul>
																<li className="dropdown-header" onClick={self.handleSubNav.bind(self,sublink)}>
																	<Link to={self.props.project?("/org/"+org):getSubNavUrl(sublink,org)} className="link"> {sublink.displayName}</Link>
																</li>
																{
																	["a"].map(function(){
																			return sublink.target.elements.map(function(innerLink,index){
																			    if(self.props.project){
																			        return(<li key={global.guid()} className="navElement navInnerLink toggleOnClick" style={{"paddingLeft":"30px","fontWeight":"lighter"}}>
				                                                <Link className="link" to={getSubNavUrl(innerLink,org)} >{innerLink.displayName}</Link>
				                                              </li>)
																			    }else{
				    																if(index<4){
				    																	return(<li key={global.guid()} className="navElement navInnerLink toggleOnClick" style={{"paddingLeft":"30px","fontWeight":"lighter"}}>
																												<Link className="link" to={getSubNavUrl(innerLink,org)} >{innerLink.displayName}</Link>
				    																					</li>)
				    																}else if(index==4){
				    																	return(<li key={global.guid()} className="navElement toggleOnClick" style={{"paddingLeft":"30px","fontWeight":"lighter"}}>
				    																						<Link className="link" style={{"fontWeight":"400!important"}} onClick={self.handleSubNav.bind(self,sublink)} to={getSubNavUrl(sublink,self.props.org)} >
				    																							<span className="read-more-trigger morelink link">MORE</span>
				    																						</Link>
				    																					</li>)
				    																}else{
				    																	return ""
				    																}
				    															}
																			})


																	})
																}
															</ul>
														</li>)
										}else{
											return(<li  key={global.guid()} className="col-sm-3 col-xs-12 unequalDivs">
															<ul>
																<li className="dropdown-header toggleOnClick" >
																		<Link className="link" style={{"color":"inherit!important"}} to={getSubNavUrl(sublink,self.props.org)} >{sublink.displayName}</Link>
																</li>
															</ul>
														</li>)
											}
								})
							}
					</ul>)
	}
});

var GenericNav=React.createClass({
	getInitialState:function(){
	    return ({shouldComponentUpdate:false,navLinks:require("../../stores/DefinitionStore").getNavigationLinks()});
	},
	componentWillUnmount:function(){
		DefinitionStore.removeChangeListener(this._onChange,"navigationLinks");
	},
	_onChange:function(){
		this.setState({shouldComponentUpdate:true,navLinks:DefinitionStore.getNavigationLinks()});
	},
	shouldComponentUpdate: function(nextProps, nextState) {
  		return nextState.shouldComponentUpdate;
	},
	componentDidMount:function(){
		DefinitionStore.addChangeListener(this._onChange,"navigationLinks");
		$(".toggleOnClick").click(function(){
					$(".navbar-toggle").click();
						window.scrollTo(0,0);
		});
		if(common.getConfigDetails() && common.getConfigDetails().messenger){//904397809584129
				document.getElementById("messageUs").innerHTML='<div class="fb-messengermessageus "    messenger_app_id="469497543229092" '+
					  ' page_id="'+common.getConfigDetails().messenger+'" color="blue" size="large">'+
					  '</div>';
		}
	},
	render:function(){
		var self=this;
		var adminNav="";
		if(typeof this.state.navLinks == "undefined" || typeof this.state.navLinks.navs == "undefined"){
			return <div></div>
		}
		if(this.state.navLinks.cloudPoint!="" && this.state.navLinks.cloudPointAdmin){
			adminNav=<AdminConsole/>
		}
		return (<div itemScope="itemscope" itemType="http://www.schema.org/SiteNavigationElement">
					<ul className="text-right list-unstyled no-padding-left ">
						{
							this.state.navLinks.navs.map(function(nav,index){
								if(nav.orgName==""){
									var marginGap="";
									if(self.state.navLinks.navs.length >1){
										marginGap="margin-top-gap-sm";
									}

									return	(<ul key={"navlink"+index} className={"text-right list-unstyled no-padding-left navRoot "+marginGap}>
												<ul  className="text-right list-unstyled no-padding-left navElementRoot">
													<LoopWithNavElements navlinks={self.props.navlinks} org={nav.org} elements={nav.elements}/>
												</ul>
											</ul>)
								}else{
								return	(<ul key={"navlink"+index} className="text-right list-unstyled no-padding-left navRoot">
											<li data-toggle="collapse" data-target={"#sub"+nav.org}>
												<span className="remove-margin-bottom text-uppercase org ">
												{/*<img  style={{display:"inline-block",height:"10px",width:"10px"}} src={"//res.cloudinary.com/dzd0mlvkl/image/upload/v1423542814/"+nav.orgIcon+".jpg"}/>*/}
													<span className="nav-link h5">{nav.orgName}</span>
												</span>
											</li>
											<ul id={"sub"+nav.org} className="collapse text-right list-unstyled no-padding-left navElementRoot">
												<LoopWithNavElements navlinks={self.state.navlinks} org={nav.org} orgName={nav.orgName} elements={nav.elements}/>
											</ul>
										</ul>)
									}
							}.bind(this))
						}
					</ul>
					{adminNav}
					 {/*
					 <ul className="text-right list-unstyled no-padding-left remove-margin-bottom">
					   <li className="toggleOnClickLater navElement">
						   <a href="https://m.me/904397809584129" target="_blank">MESSAGE US</a>
					   </li>
					 </ul>*/}
					 <div id="messageUs" className="text-right margin-top-gap-sm"></div>


				</div>)
	}
})
exports.GenericNav=GenericNav;

var LoopWithNavElements=React.createClass({
	render:function(){
		var self=this;
		return (
			<div>
			{
			self.props.elements.map(function(sublink){
				if(sublink.target.elements){
					var toggleId=global.guid();
					return (<ul key={"navlink"+global.guid()} className="text-right list-unstyled no-padding-left navElementRoot">
								<li data-toggle="collapse" data-target={"#"+toggleId}>
									<h5 classnav="remove-margin-bottom text-uppercase ">
										<span className="nav-link">{sublink.displayName}</span>
									</h5>
								</li>
								<ul id={toggleId} className="collapse text-right list-unstyled no-padding-left">
								<LoopWithNavElements  navlinks={self.props.navlinks} org={self.props.org} orgName={self.props.orgName}  elements={sublink.target.elements}/>
							</ul>
						</ul>)

				}else if(sublink.profileLink  && sublink.profileLink=="true" && self.props.org=="public"){
					if(typeof document !="undefined" && document.getElementById("userSubNav")){
						for(var i=0;i<document.querySelectorAll("#userSubNav").length;i++){
							if(document.querySelectorAll("#userSubNav").item(i).innerHTML.indexOf(sublink.displayName)==-1){
								document.querySelectorAll("#userSubNav").item(i).innerHTML='<li class="navElement">'+
								'<a  href=" '+linkGenerator.getSummaryLink({org:"public",schema:sublink.target.schema,dependentSchema:sublink.target.dependentSchema,filters:sublink.target.filters})+'" class="link">'+sublink.displayName+'</a>'+
								'</li>'+document.querySelectorAll("#userSubNav").item(i).innerHTML;
							}
						}
					}

				}else {
					return (<li key={global.guid()} className="toggleOnClickLater navElement">

							<Link className="link" to={getSubNavUrl(sublink,self.props.org)}>{sublink.displayName}</Link>
						</li>)
				}
			})
		}
		</div>
		)
	}
});
/**
 * schemaDoc
 * org
 * sublink
 */
var SubList=React.createClass({
	getInitialState:function(){
    	return this.getStateInfo(this.props);
	},
	getStateInfo:function(props){
		if(typeof props.sublink !="undefined"){
			return {
		    	schemaDoc:SchemaStore.getSchema(props.sublink.target.schema),
		        dependentSchema:SchemaStore.getSchema(props.sublink.target.schema+"-"+props.sublink.target.dependentSchema),
		        roles:undefined,
		        filters:props.filters?props.filters:{},
		        flag:true
		      };
		} else {
		 	return {roles:undefined,filters:props.filters?props.filters:{},flag:true};
		}
	},
	componentWillReceiveProps: function(nextProps) {
		var self=this;
		this.setState(this.getStateInfo(nextProps),function(){
			self.checkRole();
		});
	},
	shouldComponentUpdate: function(nextProps, nextState) {
  		return true;
	},
	componentDidUpdate:function(){
		if(common.getConfigDetails() && common.getConfigDetails().handleBarTemplate && (common.getConfigDetails().handleBarTemplate=="jsm" || common.getConfigDetails().handleBarTemplate=="wevaha")){
		//	$("#mainNavigation").addClass("hideMainNav");
			/*if(document.getElementsByClassName("summaryNav")[0] &&
					document.getElementsByClassName("summaryNav")[0].className &&
					document.getElementsByClassName("summaryNav")[0].className.indexOf(" in")!=-1){

				document.getElementsByClassName("summaryNav")[0].className=document.getElementsByClassName("summaryNav")[0].className.replace(" in","");
			}*/
		}
		SchemaStore.addChangeListener(this._onChange);
		this.loadFilters();
	},
	componentDidMount:function(){
		this.componentDidUpdate();
		/*$("#dynamicContentDiv").on('click', function(e) {
			if(!$(e.target).hasClass("filterContent")) {
			    var dropdowns = self.myDropdown;

			      if (dropdowns.classList.contains('show')) {
			        dropdowns.classList.remove('show');
			      }

			  }
		});*/
		this.checkRole();
	},
	checkRole:function(){
		common.startLoader();
        WebUtils.getSchemaRoleOnOrg(this.props.sublink.target.schema,this.props.org,function(response){
        	if(!this._isUnmounted)
            this.setState({roles:response},common.stopLoader);
        }.bind(this));
	},
	handleCreate:function(target){
		if(typeof this.props.clickClose != "undefined"){
			this.props.clickClose();
		}
		if(this.state.roles && ((this.state.roles.create && this.state.roles.create!="") || this.state.roles.cloudPointAdmin) &&
			this.state.schemaDoc &&
			this.state.schemaDoc["@operations"] &&
			this.state.schemaDoc["@operations"].create){
			var coeData={
				dependentSchema:this.props.sublink.target.dependentSchema,
				showCancel:true
			};
			if(this.state.schemaDoc["@operations"].create.workFlow){
				workflow.workFlow(this.state.schemaDoc["@operations"].create.workFlow,undefined,this.props.org);
			}else{
				browserHistory.push(linkGenerator.getCOELink({org:this.props.org,schema:this.props.sublink.target.schema,coeData:coeData}));
		    }
		}
	},
	loadFiltersWithRecords:function(filters){
		var currFilters=this.props.filters;
		if(typeof currFilters !="object"){
			currFilters={};
		}
		for(var key in filters){
			currFilters[key]=filters[key];
		}
		var self=this;
		var target=self.props.sublink.target;
		if(typeof this.props.callback=="function"){
			this.props.callback(currFilters);
			return;
		}
		browserHistory.push(linkGenerator.getSummaryLink({org:self.props.org,schema:target.schema,dependentSchema:target.dependentSchema,filters:currFilters}));
	},
	handleList:function(navFilters){
		//$(".navbar-toggle").click();
		if(typeof this.props.clickClose != "undefined"){
			this.props.clickClose();
		}
		var filters={};
		if(this.props.filters){
			filters=this.props.filters;
		}
		if(this.state.schemaDoc["@type"]=="abstractObject" && this.props.sublink.target.dependentSchema){
			filters[this.state.schemaDoc["@dependentKey"]]=[this.props.sublink.target.dependentSchema];
		}
		if(navFilters){
			filters=navFilters;
		}
		var self=this;
		//common.clearMainContent();
		//common.clearLeftContent();

		var target=self.props.sublink.target;
		compareView.clearFilters(target.schema+target.dependentSchema);
		if(typeof this.props.callback=="function"){
			this.props.callback(filters);
			return;
		}
		browserHistory.push(linkGenerator.getSummaryLink({org:self.props.org,schema:target.schema,dependentSchema:target.dependentSchema,filters:filters}));
	},
	handleBack:function(){
		//common.clearMainContent(); common.clearLeftContent();
		if(common.getConfigDetails() && common.getConfigDetails().handleBarTemplate ){
			if(common.getConfigDetails().handleBarTemplate=="jsm"){
				document.getElementById('mainNavigation').className="col-lg-12 col-md-12 col-sm-12 col-xs-12 "+common.getConfigDetails().title;
			}else if(common.getConfigDetails().handleBarTemplate=="wevaha"){
				document.getElementById('mainNavigation').className="col-lg-10 col-md-10 col-sm-6 col-xs-12 "+common.getConfigDetails().title;
			}
			//ReactDOM.unmountComponentAtNode(document.getElementById('mainNavigation'));
			ReactDOM.render(<GenericTopNav/>,document.getElementById('mainNavigation'));
			//try{
			//	ReactDOM.unmountComponentAtNode(document.getElementById('summaryNav'));
			//}catch(err){
				//document.getElementById('dynamicContentDiv').innerHTML="summaryNav";
			//}
		}else{
			ReactDOM.render(<GenericNav />,document.getElementById('mainNavigation'));
		}
	    browserHistory.push("/");
	},
	_onChange:function(){
		this.loadFilters();
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
    	SchemaStore.removeChangeListener(this._onChange);
	},
	loadFilters:function(){
		//$(".toggleOnClick").click(function(){ $(".navbar-toggle").click(); window.scrollTo(0,0);});
	},
	advSearch:function(){
	    browserHistory.push(linkGenerator.getAdvancedSearchLink({org:this.props.org,schema:this.props.sublink.target.schema,dependentSchema:this.props.sublink.target.dependentSchema}));
	},
	dropDownShow:function(schema){
		//$(this.myDropdown).toggleClass("show");
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} alignMiddleDiv={true} sideDivId={sideDivId}/>,node);
       	ReactDOM.render(<FilterResults
       						type={"desktop"}
							key={global.guid()}
							clickClose={this.props.clickClose}
							rootSchema={this.props.sublink.target.schema}
							dependentSchema={this.props.sublink.target.dependentSchema}
							textRight={"textRight"}
							dropDownClass={" "}
							org={this.props.org}
							schema={schema}
							appliedFilters={Object.assign({},this.state.filters)}
							callback={this.loadFiltersWithRecords}
			    			callbackToClosePopup={
			    				function(newRec){
			    					common.showMainContainer();node.remove();
			    				}
			    			}/>,document.getElementById(contentDivId));

	},
	render:function(){
		var textRight="";
		var self=this;
		var schemaDoc=this.state.schemaDoc;
		if(common.getConfigDetails() && common.getConfigDetails().handleBarTemplate && (common.getConfigDetails().handleBarTemplate=="jsm" || common.getConfigDetails().handleBarTemplate=="wevaha")){
			textRight="jsm";
		}else{
			textRight="text-right";
		}
		if(typeof this.props.sublink =="undefined"){
			return (<ul className={"list-unstyled no-padding-left "+textRight}>
						<li className="h5 remove-margin-top toggleOnClickLater" ><span className="home-arrow link"/><span className="link" onClick={this.handleBack}>HOME</span></li>
					</ul>)
		}
		var links=[];
		var createLink=[];
		if(schemaDoc && !schemaDoc.hideCreateLinkInSubNav && this.state.roles && ((this.state.roles.create && this.state.roles.create!="") || this.state.roles.cloudPointAdmin)){
		    if(self.props.mobile){
		    	 createLink.push(<li key={global.guid()} className="navLinksArea toggleOnClickLater">
		    	                   <div className="margin-bottom-gap col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center" onClick={this.handleCreate.bind(this,this.props.sublink.target)}>
		    	                       <div className={"pull-right jRight buttonWidth "+textRight}>
		    	                               <div className="iconHeight"><i className="icons8-plus newCustomIcon"></i></div>
		    	                               <div  className="newCustomButton">
		    	                                   Add New
		    	                               </div>
		                               </div>
		                           </div>
					           </li>);
		    }else{
			    createLink.push(<li key={global.guid()} className="display-inline-block unequalDivs navLinksArea " onClick={this.handleCreate.bind(this,this.props.sublink.target)}>
	    	                       <div className={"jRight buttonWidth noMinWidth "+textRight}  style={{"textAlign":"center"}}>
	    	                               <div className="iconHeight"><i className="icons8-plus newCustomIcon"></i></div>
	    	                               <div  className="newCustomButton">
	    	                                   Add New
	    	                               </div>
		                           </div>
				          	 </li>);
          	}
		}
		if(this.props.dependentSchema){
			{/*links=[];links.push(<li key={global.guid()} className="text-uppercase" >{this.props.dependentSchema}</li>);*/}
		}
		var FilterComponent="";
		var statusFilter="";
		var advSearchLink="";
		if(this.state.schemaDoc){
				var schema= this.state.schemaDoc;
				var dependentSchema=this.state.dependentSchema;
				if(dependentSchema){
					if(dependentSchema["@filterKeys"] && dependentSchema["@filterKeys"].length>0){
						schema["@filterKeys"]=dependentSchema["@filterKeys"];
					}
					//Assinging dependent schema properties to the top schema
					for(var i=0;i<Object.keys(dependentSchema["@properties"]).length;i++){
						schema["@properties"][Object.keys(dependentSchema["@properties"])[i]]=dependentSchema["@properties"][Object.keys(dependentSchema["@properties"])[i]];
					}

					if(dependentSchema["@navViews"]  && Object.keys(dependentSchema["@navViews"]).length>0){
						schema["@navViews"]=dependentSchema["@navViews"];
					}
					if(dependentSchema["@derivedId"]){
						schema["@derivedId"]=dependentSchema["@derivedId"];
					}
				}

				if(schema["@navViews"]){
					for(var i=0;i<schema["@navViews"].length;i++){
						/*if(this.props.sublink.target.navViews &&
							(this.props.sublink.target.navViews=="all" ||
							this.props.sublink.target.navViews.indexOf(schema["@navViews"][i].navName)!=-1))*/
						if(typeof this.state.roles !="undefined" &&
							typeof this.state.roles.navViews !="undefined" &&
							(this.state.roles.navViews=="all" || this.state.roles.navViews.indexOf(schema["@navViews"][i].navName)!=-1)){
							var highlightFlag=isSubSet(this.props.filters,schema["@navViews"][i].filters);
							if(self.props.mobile){
								links.push(<li key={global.guid()} className="navLinksArea toggleOnClickLater" ><span className={"link "+(highlightFlag?" blueLink":"") } onClick={this.handleList.bind(this,schema["@navViews"][i].filters)}>{schema["@navViews"][i].navName}</span></li>);
							}else{
								statusFilter+=highlightFlag?(schema["@navViews"][i].navName+" "):"";
								links.push(<li key={global.guid()} className="navLinksArea toggleOnClickLater" ><span className={"link "+(highlightFlag?" blueLink":"") } onClick={this.handleList.bind(this,schema["@navViews"][i].filters,schema["@navViews"][i].navName)}>{schema["@navViews"][i].navName}</span></li>);
							}
						}
					}
				}
				if(schema["@filterKeys"]){
					if(self.props.mobile){
						FilterComponent=(<FilterResults
											key={global.guid()}
											clickClose={this.props.clickClose}
											textRight={textRight}
						                    createLink={createLink}
											org={this.props.org}
											schema={schema}
											rootSchema={this.props.sublink.target.schema}
											dependentSchema={this.props.sublink.target.dependentSchema}
											appliedFilters={Object.assign({},this.state.filters)}
											callback={this.loadFiltersWithRecords}
											callbackToClosePopup={this.props.clickClose}/>)
					}else{
						FilterComponent=(schema["@filterKeys"].length>0)?
											(<li className="display-inline-block unequalDivs list-unstyled dropdown filterContent no-padding">
						                        <div  className="link filterContent jRight buttonWidth" style={{"textAlign":"right"}} >
						                            <div className="filterContent" onClick={self.dropDownShow.bind(null,schema)}>
						                                <i className="icons8-filter-4 newCustomIcon"></i>
						                            </div>
			    	                                <div  className="newCustomButton">
			    	                                	Filters
			    	                                </div>
						                        </div>
						                      </li>):"";
					}
				}
				if(schema["@advancedFilterKeys"])
				advSearchLink=<li className="navLinksArea toggleOnClickLater" ><span className="link" onClick={this.advSearch}>Advanced Search</span></li>
			}
			if(self.props.mobile){
				return (<ul className={textRight+" list-unstyled no-padding col-lg-12 col-sm-12 col-md-12 col-xs-12 sideSpace "} >
							<li className={"h5 navLinksArea remove-margin-top toggleOnClickLater "+(this.props.clickClose?"hidden":"") }><span className="home-arrow link"/><span className="link" onClick={this.handleBack}>HOME</span></li>
							{/*<li className="navLinksArea text-uppercase">{this.props.orgName}</li>
								<li className="navLinksArea text-uppercase">{this.props.sublink.displayName}</li>*/}
							{createLink}
							{links}
							{/*
								<li className="toggleOnClickLater"><span className="link" onClick={this.handleList.bind(this,undefined)}>List All</span></li>
							*/}
							<li className="filtersArea"  ref={(l)=>{this.filtersArea=l}}>{FilterComponent}</li>

							{advSearchLink}
						</ul>)
			}else{
				/*style={self.props.fromEmbedSummary?{"position":"absolute","top":"0px"}:{}}*/
				return (<ul  key={global.guid()} className="list-unstyled"  >
							 <div style={{"position":"absolute","right":"0px"}}>
							 {(createLink.length>0)?createLink:""}
									{links.length>0?
										(<li className="userNavHover display-inline-block unequalDivs" style={{"position":"relative"}}>
												<div className="child-img-component no-padding"  style={{"verticalAlign": "middle"}}>
					                    			 <button style={{"fontSize":"14px","height":"auto","textAlign":"right"}} className="btn dropdown-toggle no-padding remove-margin-right noMinWidth buttonWidth " type="button" ref={(l)=>{self.dropdownMenu1=l}} id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
										            	<a  className="dropdown-toggle" aria-expanded="false"><i className="icons8-folder newCustomIcon"></i></a>
										            </button>
					                    		</div>
						          				<ul  style={{"right":"-15px","left":"auto"}} className="dropdown-menu arrow_box"  id="userSubNav">
						                            {links}
						                        </ul>
						                  </li>)
						                   :""}

		                   	</div>
		                   	<div className="row" >
			                   	<FilterResultsNew
        	       						type={"desktop"}
            								clickClose={this.props.clickClose}
            								rootSchema={this.props.sublink.target.schema}
            								dependentSchema={this.props.sublink.target.dependentSchema}
            								textRight={"textRight"}
            								dropDownClass={" "}
            								org={this.props.org}
            								schema={schema}
            								appliedFilters={Object.assign({},this.state.filters)}
            								callback={this.loadFiltersWithRecords}
          				    			callbackToClosePopup={
          				    				function(newRec){
          				    					common.showMainContainer();node.remove();
          				    				}
          				    			}/>
		                    </div>
                       </ul>)
			}



}
})
exports.SubList=SubList;

var currentNav="";
function getCurrNav(){
    return currentNav;
}exports.getCurrNav=getCurrNav;

function showSideContent(nav){
    currentNav=nav;
    $("#dynamicContentDiv .navElement").hide();
    if(nav=="default"){
        $("#dynamicContentDiv .navElement.undefined").show();
        $("#dynamicContentDiv .navElement.default").show();
        $("#dynamicContentDiv .navElement").show();
    }else{
        $("#dynamicContentDiv .navElement.default").show();
        $("#dynamicContentDiv .navElement."+nav).show();
        $("#dynamicContentDiv .navElement."+nav+" .navElement").show();

        try{
        	if($("#dynamicContentDiv .navElement."+nav+" [aria-expanded]").attr("aria-expanded")=="false" ||
		        	$("#dynamicContentDiv .navElement."+nav+" [aria-expanded]").hasClass("in")==false)
        				$("#dynamicContentDiv .navElement."+nav+" .collapseLayout").click();
      	}catch(err){}
    }
}
exports.showSideContent=showSideContent;

var RecordNav=React.createClass({
	getInitialState:function(){
		var sideNav=this.props.sideNav;
		try{
			var newSideNav={};
			if(this.props.inRecord){
				sideNav=this.props.recordNav;
			}else{
				if(this.props.schemaDoc){
					if(this.props.viewName){
						if(this.props.schemaDoc["@operations"] &&
						 		this.props.schemaDoc["@operations"].read &&
								this.props.schemaDoc["@operations"].read[this.props.viewName]){
									this.props.schemaDoc["@operations"].read[this.props.viewName].UILayout.map(function(layout){
										if(layout.navElement){
											newSideNav[layout.navElement]=self.props.schemaDoc["@sideNav"][layout.navElement];
										}
									})
									sideNav=newSideNav;
						}
					}
				}
			}
		}catch(err){
			sideNav=this.props.sideNav;
		}
		return ({sideNav:sideNav});
	},
	showSideContent:function(nav){
	    showSideContent(nav);

		//moved to scroll to exact position and also to make width:100%
		/*var navClassNames=$("."+nav).attr('class');
		if($("."+nav).attr('class').indexOf("col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding")==-1){
			navClassNames+=' col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding';
			$("."+nav).attr('class',navClassNames);
		}

		try{
			var top=$("."+nav).offset().top-50;
				if(top==0 || top==undefined){
					for(index=0;(index<$("."+nav).children().length);index++){
						if($("."+nav).children()[index].offsetTop!=0){
							top=$("."+nav).children()[index].offsetTop;
							break;
						}
					}
				}

			$('html, body').animate({
			 //'scrollTop' : $("."+nav).children().position().top
			 'scrollTop' : top
			});
		}catch(err){
			console.log(err);
		}*/
	},
	showContent:function(nav){
		/*$("#dynamicContentDiv .navElement").hide();
		if(nav=="default"){
			$("#dynamicContentDiv .navElement.undefined").show();
			$("#dynamicContentDiv .navElement.default").show();
			$("#dynamicContentDiv .navElement").show();
		}else{
			$("#dynamicContentDiv .navElement.default").show();
			$("#dynamicContentDiv .navElement."+nav).show();
		}
		*/
		//moved to scroll to exact position and also to make width:100%

		try{
			var navClassNames=$("."+nav).attr('class');
			if($("."+nav).attr('class').indexOf("col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding")==-1){
				navClassNames+=' col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding';
				$("."+nav).attr('class',navClassNames);
			}

			var top=$("."+nav).offset().top-($(".breadcrumb").length>0?100:50);
				/*if($("."+nav).height()<2){
					top=0;
				}*/
				if(top==0){
					for(var index=0;(index<$("."+nav).children().length);index++){
						if($("."+nav).children()[index].offsetTop!=0){
							top=$("."+nav).children()[index].offsetTop;
							break;
						}
					}
				}

			$('html, body').animate({
			 //'scrollTop' : $("."+nav).children().position().top
			 'scrollTop' : top
			},function(){
				if($("."+nav) &&
					$("."+nav)[0] && $("."+nav)[0].children[0] &&
					$($("."+nav)[0].children[0]).attr("data-toggle")=="collapse"){
					if($($("."+nav)[0].children[0]).attr("class").indexOf("collapsed")!=-1){
						$("."+nav)[0].children[0].click();
					}
				}
			});
		}catch(err){
			console.log(err);
		}
	},
	handleBack:function(){
		history.back();
		return;
	},
	componentDidMount:function(){
		var self=this;
		if(self.state.sideNav && Object.keys(self.state.sideNav).length>0)
			setTimeout(function(){
				Object.keys(self.state.sideNav).forEach(function(key){
					if($("."+key).height()>0){
							$(self[key]).removeClass("hidden")
					}else{
						//do nothing
					}
				})
			},3000)

	},
	render:function(){
		var self=this;
		var textRight=""
		var config=common.getConfigDetails();
		if(config && config.handleBarTemplate && (config.handleBarTemplate=="jsm" || config.handleBarTemplate=="wevaha")){
			textRight="jsm";
		}else{
			textRight="text-right";
		}
		var sideNav=this.state.sideNav;
		if(typeof sideNav=="undefined" || Object.keys(sideNav).length==0){
				return (<ul className={"hidden"}>
								</ul>)
		}
		if(this.props.inRecord){
			return (<div className={"text-center col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-top-gap mobile-no-margin "+(Object.keys(self.props.recordNav).length>0?"":"hidden")} style={{"fontSize":"18px"}}>
								{
									Object.keys(sideNav).map(function(key){
										return <button key={global.guid()} className="display-inline-block extra-padding hidden"  ref={(l)=>{self[key]=l}}  onClick={self.showContent.bind(self,key)} style={{"border":"none"}} type="submit">{self.props.recordNav[key].displayName}</button>
									})
								}
							</div>)
		}else if(sideNav){
			return (<ul className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 text-center list-unstyled no-padding-left margin-top-gap mobile-no-margin "+(Object.keys(sideNav).length>0?"":"hidden")}>
								<li className="h5 remove-margin-top toggleOnClickLater hidden" ><span className="home-arrow link"/><span className="link" onClick={this.handleBack}>BACK</span></li>
								{
									Object.keys(sideNav).map(function(key){
									    return (<li  key={global.guid()} className="display-inline-block extra-padding-right" ref={(l)=>{self[key]=l}} ><span className="link" onClick={self.showSideContent.bind(self,key)}>{sideNav[key].displayName}</span></li>);
									})
								}
							</ul>)
		}else{
			return (<ul className={textRight+" list-unstyled no-padding-left hidden"}>
								<li className="h5 remove-margin-top toggleOnClickLater" ><span className="home-arrow link"/><span className="link" onClick={this.handleBack}>BACK</span></li>
							</ul>)
		}
	}
});
exports.RecordNav=RecordNav;

function isSubSet(rootFilters,currFilters){
	if(typeof rootFilters =="object" && typeof currFilters=="object" && rootFilters!=null && currFilters!=null){
		var currKeys=Object.keys(currFilters);
		var rootKeys=Object.keys(rootFilters);
		var flag=true;
		for(var i=0;i<currKeys.length;i++){
			if(rootKeys.indexOf(currKeys[i])==-1){
				flag=false;
				break;
			}
		}
		if(flag){
			try{
				for(var i=0;i<currKeys.length;i++){
					for(var j=0;j<currFilters[currKeys[i]].length;j++){
						if(rootFilters[currKeys[i]].indexOf(currFilters[currKeys[i]][j])==-1){
							flag=false;
							break;
						}
					}
					if(!flag){
						break;
					}
				}
				return flag;
			}catch(err){
				return false;
			}
		}else{
			return false;
		}
	}else{
		return false;
	}
}
exports.isSubSet=isSubSet;
