/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
//var WebUtils=require('../../../utils/WebAPIUtils.js');
var DefinitionStore = require("../../../stores/DefinitionStore");
var common = require("../../common.jsx");
var genericView = require("../genericView.jsx");
//var genericNav=require("../../nav/genericNav.jsx");
var linkGenerator = require("../../nav/linkGenerator.jsx");
var global = require("../../../utils/global.js");
var Link = require("react-router").Link;
//var browserHistory=require('react-router').browserHistory;
//var limitCount=global.limitCount;//9;
//var utility=require('../../Utility.jsx');
var workflow = require("./workflow.jsx");
var audit = require("./audit.jsx");
var box_com = require("./box_com.jsx");
var RequirementUpload = require("../../admin/RequirementUpload.jsx");
var setup = {
  projectGuideVideo:
    "http://res.cloudinary.com/dzd0mlvkl/video/upload/v1516362431/new_project.mp4",
  projectGuideVideoThumbnail:
    "http://res.cloudinary.com/dzd0mlvkl/video/upload/so_10.5/v1516362431/new_project.jpg",
  newProjectWorkFlow:
    "ProjectCreationWorkFlowWithDefaultRoleCheckFromDashBoard",
  orgGuideVideo:
    "http://res.cloudinary.com/dzd0mlvkl/video/upload/v1516362431/signup.mp4",
  orgGuideVideoThumbnail:
    "http://res.cloudinary.com/dzd0mlvkl/video/upload/so_14/v1516362431/signup.jpg",
  newOrgWorkFlow: "wlf"
};
/**
 * org
 * schema
 * groupName
 * gilters
 */
var DashBoard = React.createClass({
  processStateFromProps: function(props) {
    if (common.getConfigDetails().dashboardSetup) {
      setup = common.getConfigDetails().dashboardSetup;
    }
    var schema =
      typeof props.location.query.schema == "undefined" ||
      props.location.query.schema == "undefined" ||
      props.location.query.schema == ""
        ? undefined
        : props.location.query.schema;
    var dependentSchema =
      typeof props.location.query.ds == "undefined" ||
      props.location.query.ds == "undefined" ||
      props.location.query.ds == ""
        ? undefined
        : props.location.query.ds;
    var org =
      typeof props.location.query.org == "undefined" ||
      props.location.query.org == "undefined" ||
      props.location.query.org == ""
        ? "public"
        : props.location.query.org;
    if (typeof Storage != "undefined") {
      var id = "DASHBOARD-MYPROJECTS";
      if (props.route.name == "myfirms") {
        id = "DASHBOARD-MYFIRMS";
      }
      if (org != undefined && org != "public") {
        localStorage.setItem(id, org);
      } else if (localStorage.getItem(id)) {
        org = localStorage.getItem(id);
      }
    }
    var navs = this.constructNavs({
      org: org,
      schema: schema,
      dependentSchema: dependentSchema,
      routeName: props.route.name
    });
    return {
      navLinks: DefinitionStore.getNavigationLinks(),
      projectLinks: navs.projectLinks,
      orgNavs: navs.orgNavs,
      current: navs.current,
      navItem: navs.navItem,
      shouldComponentUpdate: true,
      routeName: props.route.name
    };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillUnmount: function() {
    DefinitionStore.removeChangeListener(this._onChange, "navigationLinks");
  },
  _onChange: function() {
    this.setState(this.processStateFromProps(this.props));
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  componentWillReceiveProps: function(nextProps) {
    if (JSON.stringify(this.props) != JSON.stringify(nextProps)) {
      this.setState(this.processStateFromProps(nextProps));
    }
  },
  componentDidMount: function() {
    $(".lookUpDialogBox").remove();
    common.showMainContainer();
    window.scrollTo(0, 0);
    this.componentDidUpdate();
    DefinitionStore.addChangeListener(this._onChange, "navigationLinks");
    try {
      trackThis("dashboard", { type: this.state.routeName });
    } catch (err) {}
    common.showLoginPopup();
    try {
      guide("Guide-Dashboard");
    } catch (err) {}
  },
  componentDidUpdate: function() {
  //  common.showDynamicContentDiv();
    //common.hideMainNavigation();

    var linksToRender = "projectLinks";
    if (this.state.routeName == "myfirms") {
      linksToRender = "orgNavs";
    }
    if (
      this.state[linksToRender] &&
      Array.isArray(this.state[linksToRender].elements) &&
      this.state[linksToRender].elements.length > 0
    ) {
      //do nothing
    } else {
      this.openNewProjectFlow();
    }
  },
  constructNavs: function(data) {
    var navLinks = DefinitionStore.getNavigationLinks();
    if (navLinks && navLinks.navs && navLinks.navs.length > 0) {
      var projectLinks = {
        orgName: "My Projects",
        elements: []
      };
      var orgNavs = {
        orgName: "My Orgs",
        elements: []
      };
      var topNav = [];
      navLinks.navs.map(function(newNav, index) {
        var innerTemp = {};
        innerTemp["displayName"] = newNav.orgName;
        innerTemp["org"] = newNav.org;
        innerTemp["orgSchema"] = newNav.orgSchema;
        innerTemp["target"] = {
          elements: newNav.elements
        };
        if (newNav.orgSchema == "Project" || newNav.orgSchema == "MFRProject") {
          projectLinks["type"] = "project";
          projectLinks["elements"].push(innerTemp);
        } else if (newNav.org != "public") {
          orgNavs["type"] = "orgNav";
          orgNavs["elements"].push(innerTemp);
        } else if (newNav.topNav) {
          topNav.push(newNav);
        } else if (newNav.org == "public") {
          if (newNav.elements && newNav.elements.length > 0) {
            newNav.elements.map(function(nav) {
              if (nav.topNav) {
                var temp = nav;
                temp["org"] = newNav.org;
                topNav.push(temp);
              }
            });
          }
        }
      });
      var current = projectLinks.elements[0];
      if (data.org) {
        projectLinks.elements.forEach(function(project) {
          if (project.org == data.org) {
            current = project;
          }
        });
      }
      if (data.routeName == "myfirms") {
        current = orgNavs.elements[0];
        if (data.org) {
          orgNavs.elements.forEach(function(org) {
            if (org.org == data.org) {
              current = org;
            }
          });
        }
      }
      var navItem;
      if (current) {
        navItem = current.target.elements[0];
        if (data.schema) {
          if (
            data.schema == "audit" ||
            data.schema == "box" ||
            data.schema == "page" ||
            data.schema == "RFI" ||
            data.schema == "bulkupload"
          ) {
            navItem = { target: data };
          } else {
            current.target.elements.forEach(function(element) {
              if (
                element.target.schema == data.schema &&
                element.target.dependentSchema == data.dependentSchema
              ) {
                navItem = element;
              }
            });
          }
        }
      }
      return {
        projectLinks: projectLinks,
        orgNavs: orgNavs,
        current: current,
        navItem: navItem
      };
    }
  },
  openNewProjectFlow: function() {
    var wfId;
    if (this.props.route.name == "myfirms") {
      wfId = setup.newOrgWorkFlow;
    } else {
      wfId = setup.newProjectWorkFlow;
    }
    if ($("." + wfId).length > 0) {
      console.log("Workflow exists");
      return;
    }
    workflow.workFlow(wfId);
  },
  getLink: function(data) {
    var link;
    if (this.props.route.name == "myfirms") {
      link = linkGenerator.getMyFirmsLink(data);
    } else {
      link = linkGenerator.getMyProjectsLink(data);
    }
    return link;
  },
  render: function() {
    var self = this;
    var target;
    var linkName = "";
    if (this.props.route.name == "myfirms") {
      linkName = "Firm";
    } else {
      linkName = "Project";
    }
    if (
      this.state.current &&
      this.state.current.target &&
      Array.isArray(this.state.current.target.elements)
    ) {
      target = {};
      target.org = this.state.current.org;
      var navItem = this.state.navItem;
      if (!navItem) {
        navItem = this.state.current.target.elements[0];
      }
      target.create = navItem.target.create;
      target.filters = navItem.target.filters;
      target.methods = navItem.target.methods;
      target.navViews = navItem.target.navViews;
      target.schema = navItem.target.schema;
      target.displayName = navItem.displayName;
      target.dependentSchema = navItem.target.dependentSchema;
    }
    if (target && target.schema == "RFI") {
      if (this.state.current.orgSchema == "Manufacturer") {
        target.filters = {
          manufacturer: [target.org]
        };
      } else {
        target.filters = {
          project: [target.org]
        };
      }
      target.org = "public";
    }
    var linksToRender = "projectLinks";
    if (this.state.routeName == "myfirms") {
      linksToRender = "orgNavs";
    }
    var showBulkUploadLink = false;
    /*var publicRoles = common.getUserRolesOnOrg("public");
    if (
      Array.isArray(publicRoles) &&
      publicRoles.indexOf("RoleForDeveloper") > -1
    ) {
      showBulkUploadLink = true;
    }*/
    if (
      typeof navigator != "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      return (
        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-top-gap-xs no-padding">
          {this.state[linksToRender] &&
          Array.isArray(this.state[linksToRender].elements) &&
          this.state[linksToRender].elements.length > 0 ? (
            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-top-gap-xs no-padding">
              <button
                type="button"
                className="btn btn-default dropdown-toggle form-control"
                style={{ textTransform: "none" }}
                title="Click here to change"
                data-toggle="dropdown"
              >
                <div
                  className="link no-padding text-capitalize text-right child-img-component"
                  style={{ fontWeight: "800", fontSize: "16px" }}
                >
                  {this.state.current && this.state.current.displayName
                    ? this.state.current.displayName.toLowerCase()
                    : ""}
                </div>
                <div className="link child-img-component dropDownSleekArrow">
                  <span
                    className="sleekIcon-rightarrow"
                    style={{ fontWeight: "800", fontSize: "20px" }}
                  />
                </div>
              </button>
              <ul
                className="dropdown-menu  col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding "
                role="menu"
              >
                <li
                  className=" link extra-margin-top text-capitalize extra-margin-bottom"
                  onClick={this.openNewProjectFlow}
                >
                  <span className="textEllipsis">{"Add New " + linkName}</span>
                </li>
                {this.state[linksToRender].elements.map(function(project) {
                  return (
                    <li
                      key={global.guid()}
                      className=" link extra-margin-top text-capitalize extra-margin-bottom"
                    >
                      <Link
                        to={self.getLink({
                          org: project.org,
                          schema: target.schema,
                          dependentSchema: target.dependentSchema
                        })}
                        className="textEllipsis"
                      >
                        {project.displayName
                          ? project.displayName.toLowerCase()
                          : ""}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="margin-top-gap">
              <div
                  className="blueLink pointer dashBoardNavItem"
                  onClick={self.openNewProjectFlow}>
                  <span className={"link  fontSize12"}>
                    {"Add New " + linkName}
                  </span>
              </div>
            </div>
          )}
          {this.state.current &&
          this.state.current.target &&
          Array.isArray(this.state.current.target.elements) ? (
            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-top-gap-xs no-padding">
              <button
                type="button"
                className="btn btn-default dropdown-toggle form-control"
                style={{ textTransform: "none" }}
                title="Click here to change"
                data-toggle="dropdown"
              >
                <div
                  className="link no-padding text-capitalize text-right child-img-component"
                  style={{ fontWeight: "800", fontSize: "16px" }}
                >
                  {typeof target.displayName == "string"
                    ? target.displayName.toLowerCase()
                    : typeof target.schema == "string"
                      ? target.schema.toLowerCase()
                      : ""}
                </div>
                <div className="link child-img-component dropDownSleekArrow">
                  <span
                    className="sleekIcon-rightarrow"
                    style={{ fontWeight: "800", fontSize: "20px" }}
                  />
                </div>
              </button>
              <ul
                className="dropdown-menu  col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding "
                role="menu"
              >
                {this.state.current.target.elements.map(function(navItem) {
                  return (
                    <li key={global.guid()} className={"  text-capitalize "}>
                      <Link
                        to={self.getLink({
                          org: self.state.current.org,
                          schema: navItem.target.schema,
                          dependentSchema: navItem.target.dependentSchema
                        })}
                      >
                        <span className={"link "}>
                          {navItem.displayName.toLowerCase()}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {self.state.routeName != "myfirms" ||
                self.state.current.orgSchema == "Manufacturer" ? (
                  <li className={"  text-capitalize "}>
                    <Link
                      to={self.getLink({
                        org: self.state.current.org,
                        schema: "RFI"
                      })}
                    >
                      <span className={"link  fontSize16"}>RFIs</span>
                    </Link>
                  </li>
                ) : (
                  ""
                )}
                <li className={"  text-capitalize "}>
                  <Link
                    to={self.getLink({
                      org: self.state.current.org,
                      schema: "box"
                    })}
                  >
                    <span className={"link  fontSize16"}>documents</span>
                  </Link>
                </li>
                <li className={"  text-capitalize "}>
                  <Link
                    to={self.getLink({
                      org: self.state.current.org,
                      schema: "audit"
                    })}
                  >
                    <span className={"link  fontSize16"}>audit</span>
                  </Link>
                </li>
                {self.state.routeName == "myfirms" ? (
                  <li className={"  text-capitalize "}>
                    <Link
                      to={self.getLink({
                        org: self.state.current.org,
                        schema: "page"
                      })}
                    >
                      <span className={"link  fontSize16"}>
                        {(this.state.current && this.state.current.displayName
                          ? this.state.current.displayName.toLowerCase()
                          : "") + " Page"}
                      </span>
                    </Link>
                  </li>
                ) : showBulkUploadLink ? (
                  <li className={"  text-capitalize "}>
                    <Link
                      to={self.getLink({
                        org: self.state.current.org,
                        schema: "bulkupload"
                      })}
                    >
                      <span className={"link  fontSize16"}>
                        {"Bulk Upload"}
                      </span>
                    </Link>
                  </li>
                ) : (
                  ""
                )}
                <li
                  className="blueLink pointer  topLine"
                  onClick={this.openNewProjectFlow}
                >
                  <span className={"link  fontSize12"}>
                    {"Add New " + linkName}
                  </span>
                </li>
              </ul>
            </div>
          ) : (
            ""
          )}
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap-sm"
            style={target?{ background: "#F8F8F8", minHeight: "45vw" }:{}}
          >
            {target ? (
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right margin-top-gap-sm ">
                {target.schema == "bulkupload" ? (
                  <RequirementUpload.RequirementsUpload
                    org={this.state.current.org}
                  />
                ) : target.schema == "page" ? (
                  <genericView.GoIntoDetail
                    key={global.guid()}
                    rootSchema={this.state.current.orgSchema}
                    recordNav={true}
                    recordId={this.state.current.org}
                    org={this.state.current.org}
                  />
                ) : target.schema == "audit" ? (
                  <audit.Audit
                    key={global.guid()}
                    recordId={this.state.current.org}
                    rootSchema={this.state.current.orgSchema}
                    org={this.state.current.org}
                  />
                ) : target.schema == "box" ? (
                  <box_com.BoxView
                    orgType={
                      this.state.routeName == "myprojects"
                        ? "Project"
                        : undefined
                    }
                    org={this.state.current.org}
                  />
                ) : (
                  <genericView.EmbedSummary
                    showFilters={true}
                    key={global.guid()}
                    schema={target.schema}
                    filters={target.filters}
                    dependentSchema={target.dependentSchema}
                    org={target.org}
                    sublink={target}
                    orgName={target.orgName}
                    skip={target.skip}
                    sortBy={target.sortBy}
                    sortOrder={target.sortOrder}
                  />
                )}
              </div>
            ) : (
              <div>
                {/*
						  				<div className="margin-bottom-gap" style={{"font-size": "30px","font-weight": "700"}}>
						  					{this.state.routeName=="myfirms"?setup.orgStartMessage:setup.projectStartMessage}
						  				</div>
						  				<video controls="true"
												style={{width:"100%","height":"32pw"}}
												src={this.state.routeName=="myfirms"?setup.orgGuideVideo:setup.projectGuideVideo}
												poster={this.state.routeName=="myfirms"?setup.orgGuideVideoThumbnail:setup.projectGuideVideoThumbnail}
											preload="none" onClick={(e)=>{e.target.paused ? e.target.play() : e.target.pause();}}></video>
						  				<div className="margin-top-gap-sm pointer" title="Add Project" onClick={this.openNewProjectFlow}>
						  						<div className={"jRight buttonWidth noMinWidth"}>
			    	                               <div className="iconHeight">
			    	                               	<i className="icons8-plus newCustomIcon"></i>
			    	                               </div>
			    	                               <div  className="newCustomButton" style={{"display":"block","font-size":"9px"}}>
			    	                                   Add New
			    	                              </div>
					                           </div>
					                     </div>*/}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={global.guid()} className="negativeMarginLeft">
          <div
            className="col-lg-2 col-md-2 col-sm-4 col-xs-12 dashboardNavColor  no-padding text-right"
            style={{ minHeight: "45vw" }}>
            {this.state[linksToRender] &&
            Array.isArray(this.state[linksToRender].elements) &&
            this.state[linksToRender].elements.length > 0 ? (
              <div
                className="extra-padding-bottom  userNavHover col-lg-12 col-md-12 col-xs-11 col-sm-11 line-sm remove-margin-bottom margin-top-gap text-right pull-right no-padding-right"
                style={{ position: "relative" }}>
                <a
                  data-toggle="dropdown"
                  className="dropdown-toggle"
                  aria-expanded="false">
                  <div
                    className="link no-padding text-capitalize text-right child-img-component"
                    style={{ fontWeight: "800" }}>
                    {this.state.current && this.state.current.displayName
                      ? this.state.current.displayName.toLowerCase()
                      : ""}
                  </div>
                  <div className="link child-img-component dropDownSleekArrow">
                    <span
                      className="sleekIcon-rightarrow"
                      style={{ fontWeight: "800", fontSize: "20px" }}
                    />
                  </div>
                </a>
                <ul
                  style={{ maxWidth: "100%" }}
                  className="dropdown-menu arrow_box no-padding-top no-margin projectDashBoard">
                  <li
                    className={
                      " link text-capitalize margin-top-gap-xs add-border-bottom-pin margin-bottom-gap-xs"
                    }
                    onClick={this.openNewProjectFlow}>
                    <a className="textEllipsis">{"Add New " + linkName}</a>
                  </li>
                  { this.state[linksToRender].elements.map(function(
                      project,
                      index
                    ) {
                      var topClass = "";
                    if (index == 0 && false) {
                      topClass = "extra-margin-top";
                    } else if (
                      index ==
                      self.state[linksToRender].elements.length - 1
                    ) {
                      topClass = "extra-margin-bottom";
                    }
                    return (
                      <li
                        key={global.guid()}
                        className={" link text-capitalize " + topClass}>
                        <Link
                          to={self.getLink({
                            org: project.org,
                            schema: target.schema,
                            dependentSchema: target.dependentSchema
                          })}
                          className="textEllipsis">
                          {project.displayName
                            ? project.displayName.toLowerCase()
                            : ""}
                        </Link>
                      </li>
                    );
                  })
                }
                </ul>
              </div>
            ) : (""
            )
          }
            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
              {this.state.current &&
              this.state.current.target &&
              Array.isArray(this.state.current.target.elements) ? (
                <div>
                  {this.state.current.target.elements.map(function(navItem) {
                    /*var url="/myprojects?org="+self.state.current.org+"&schema="+navItem.target.schema;
												if(navItem.target.dependentSchema){
													url+="&ds="+navItem.target.dependentSchema;
												}*/
                    return (
                      <Link
                        to={self.getLink({
                          org: self.state.current.org,
                          schema: navItem.target.schema,
                          dependentSchema: navItem.target.dependentSchema
                        })}
                        key={global.guid()}>
                        <li
                          className={
                            "search dashBoardNavItem text-capitalize " +
                            (target.schema == navItem.target.schema &&
                            target.dependentSchema ==
                              navItem.target.dependentSchema
                              ? "whiteLink"
                              : "")
                          }>
                          <span className={"link  fontSize16"}>
                            {navItem.displayName.toLowerCase()}
                          </span>
                        </li>
                      </Link>
                    );
                  })}

                  {self.state.routeName != "myfirms" ||
                  self.state.current.orgSchema == "Manufacturer" ? (
                    <Link
                      to={self.getLink({
                        org: self.state.current.org,
                        schema: "RFI"
                      })}>
                      <li
                        className={
                          "search dashBoardNavItem text-capitalize " +
                          (target.schema == "RFI" ? "whiteLink" : "")
                        }>
                        <span className={"link  fontSize16"}>RFIs</span>
                      </li>
                    </Link>
                  ) : (
                    ""
                  )
                }
                <Link
                    to={self.getLink({
                      org: self.state.current.org,
                      schema: "box"
                    })}>
                    <li
                      className={
                        "search dashBoardNavItem text-capitalize " +
                        (target.schema == "box" ? "whiteLink" : "")
                      }>
                      <span className={"link  fontSize16"}>documents</span>
                    </li>
                  </Link>
                  <Link
                    to={self.getLink({
                      org: self.state.current.org,
                      schema: "audit"
                    })}>
                    <li
                      className={
                        "search dashBoardNavItem text-capitalize " +
                        (target.schema == "audit" ? "whiteLink" : "")
                      }>
                      <span className={"link  fontSize16"}>audit</span>
                    </li>
                  </Link>
                  {self.state.routeName == "myfirms" ? (
                    <Link
                      to={self.getLink({
                        org: self.state.current.org,
                        schema: "page"
                      })}>
                      <li
                        className={
                          "search dashBoardNavItem text-capitalize " +
                          (target.schema == "page" ? "whiteLink" : "")
                        }>
                        <span className={"link  fontSize16"}>
                          {(this.state.current && this.state.current.displayName
                            ? this.state.current.displayName.toLowerCase()
                            : "") + " Page"}
                        </span>
                      </li>
                    </Link>
                  ) : showBulkUploadLink ? (
                    <Link
                      to={self.getLink({
                        org: self.state.current.org,
                        schema: "bulkupload"
                      })}>
                      <li
                        className={
                          "search dashBoardNavItem text-capitalize " +
                          (target.schema == "bulkupload" ? "whiteLink" : "")
                        }>
                        <span className={"link  fontSize16"}>
                          {"Bulk Upload"}
                        </span>
                      </li>
                    </Link>
                  ) : (
                    ""
                  )}
                </div>
              ) : (
                ""
              )
            }
            <div
                className="blueLink pointer dashBoardNavItem topLine"
                onClick={this.openNewProjectFlow}>
                <span className={"link  fontSize12"}>
                  {"Add New " + linkName}
                </span>
              </div>
            </div>
          </div>
          <div
            className="col-lg-10 col-md-10 col-sm-8 col-xs-12"
            style={{ minHeight: "45vw" }}>
            {target ? (
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-right margin-top-gap-sm ">
                {target.schema == "bulkupload" ? (
                  <RequirementUpload.RequirementsUpload
                    org={this.state.current.org}
                  />
                ) : target.schema == "page" ? (
                  <genericView.GoIntoDetail
                    key={global.guid()}
                    rootSchema={this.state.current.orgSchema}
                    recordNav={true}
                    recordId={this.state.current.org}
                    org={this.state.current.org}
                  />
                ) : target.schema == "audit" ? (
                  <audit.Audit
                    key={global.guid()}
                    recordId={this.state.current.org}
                    rootSchema={this.state.current.orgSchema}
                    org={this.state.current.org}
                  />
                ) : target.schema == "box" ? (
                  <box_com.BoxView
                    orgType={
                      this.state.routeName == "myprojects"
                        ? "Project"
                        : undefined
                    }
                    org={this.state.current.org}
                  />
                ) : (
                  <genericView.EmbedSummary
                    showFilters={true}
                    key={global.guid()}
                    schema={target.schema}
                    filters={target.filters}
                    dependentSchema={target.dependentSchema}
                    org={target.org}
                    sublink={target}
                    orgName={target.orgName}
                    skip={target.skip}
                    sortBy={target.sortBy}
                    sortOrder={target.sortOrder}
                  />
                )}
              </div>
            ) : (
              <div>
                {/*
						  				<div className="margin-bottom-gap" style={{"font-size": "24px","font-weight": "800"}}>
						  					{this.state.routeName=="myfirms"?setup.orgStartMessage:setup.projectStartMessage}
						  				</div>
						  				<video controls="true"
												style={{width:"100%","height":"32vw"}}
												src={this.state.routeName=="myfirms"?setup.orgGuideVideo:setup.projectGuideVideo}
												poster={this.state.routeName=="myfirms"?setup.orgGuideVideoThumbnail:setup.projectGuideVideoThumbnail}
											preload="none" onClick={(e)=>{e.target.paused ? e.target.play() : e.target.pause();}}></video>
						  				<div className="margin-top-gap-sm pointer" title="Add Project" onClick={this.openNewProjectFlow}>
						  						<div className={"jRight buttonWidth noMinWidth"}>
			    	                               <div className="iconHeight">
			    	                               	<i className="icons8-plus newCustomIcon"></i>
			    	                               </div>
			    	                               <div  className="newCustomButton" style={{"display":"block","font-size":"9px"}}>
			    	                                   Add New
			    	                              </div>
					                           </div>
					                     </div>*/}
              </div>
            )}
          </div>
        </div>
      );
    }
  }
});
exports.DashBoard = DashBoard;
