/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../common.jsx");
//var manageRoles=require('../admin/manageRoles.jsx');
//var RestAPIComposition=require("../admin/RestAPIComposition.jsx");
var ActionCreator = require("../../actions/ActionCreator");
var linkGenerator = require("../nav/linkGenerator.jsx");
var ReportsView = require("../admin/ReportsView.jsx");
var BulkUserCreation = require("../admin/BulkUserCreation.jsx");
var NewsLetter=require("../admin/NewsLetter.jsx");
//var TriggerComposition=require("../admin/TriggerComposition.jsx");

var global = require("../../utils/global.js");
var browserHistory = require("react-router").browserHistory;

var Link = require("react-router").Link;
var MyLink = React.createClass({
  open: function() {
    browserHistory.push(this.props.to);
    if (typeof this.props.callbackToClosePopup == "function") {
      this.props.callbackToClosePopup();
    }
  },
  render: function() {
    return (
      <a
        className=" action navElement navInnerLink link navItem"
        onClick={this.open}
      >
        {this.props.children}
      </a>
    );
  }
});
var AdminConsole = React.createClass({
  componentDidMount: function() {
    if (this.props.topNav && this.props.topNav == "topNav") {
      $(".action").click(function() {
        $(".navbar-toggle").click();
      });
    }
  },
  componentDidUpdate: function() {
    if (this.props.topNav && this.props.topNav == "topNav") {
      $(".action").click(function() {
        $(".navbar-toggle").click();
      });
    }
  },
  openReportView: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className ="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
    ReactDOM.render(<ReportsView.ReportSummary />,document.getElementById(contentDivId));
  },
  BulkUserCreation: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className ="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
    ReactDOM.render(<BulkUserCreation.BulkUserCreation />,document.getElementById(contentDivId));
  },
  NewsLetter:function(){
  	var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className ="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} />,node);
    ReactDOM.render(<NewsLetter.NewsLetter/>,document.getElementById(contentDivId));
  },
  render: function() {
    if (this.props.type && this.props.type == "topNav") {
      return (
        <li
          className={
            this.props.fromNewNav
              ? "newNavAdmin list-unstyled"
              : "dropdown mega-dropdown "
          }
        >
          <a
            className={this.props.fromNewNav ? "hidden" : "dropdown-toggle "}
            data-toggle="dropdown"
            href="#"
          >
            <span style={{ color: "#146dff" }}>ADMIN CONSOLE</span>
          </a>
          <ul
            className={
              this.props.fromNewNav
                ? "list-unstyled  col-lg-12 col-sm-12 col-xs-12 col-md-12"
                : "dropdown-menu mega-dropdown-menu mobile-no-padding mobile-no-margin"
            }
          >
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header ">Schema</li>
                <li>
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    className=" action navElement navInnerLink link navItem"
                    to="/admin/schema/create"
                  >
                    Create
                  </MyLink>
                </li>
                <li>
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    className=" action navElement navInnerLink link navItem"
                    to="/admin/schema/edit"
                  >
                    Edit
                  </MyLink>
                </li>
                <li>
                  <a
                    className=" action navElement navInnerLink link navItem"
                    onClick={ActionCreator.getAllSchemas}
                  >
                    Refresh Schemas
                  </a>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header">Records</li>
                <li>
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    className=" action navElement navInnerLink link navItem"
                    to="/admin/record/create"
                  >
                    Create
                  </MyLink>
                </li>
                <li>
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    className=" action navElement navInnerLink link navItem"
                    to="/admin/record/edit"
                  >
                    Edit
                  </MyLink>
                </li>
              </ul>
            </li>
            {/*<li className="col-sm-3 col-xs-12 unequalDivs">
								<ul>
									<li className="dropdown-header">Authorization</li>
									<li><a  className=" action navElement navInnerLink link navItem"  onClick={manageRoles.createRoles.bind(null,"new")} >Create</a></li>
			                        <li><a  className=" action navElement navInnerLink link navItem"   onClick={manageRoles.createRoles.bind(null,"edit")} >Edit</a></li>
								</ul>
					</li>*/}
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header">Landing Page</li>
                <li>
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    className=" action navElement navInnerLink link navItem"
                    to="/admin/landing/create"
                  >
                    Create
                  </MyLink>
                </li>
                <li>
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    className=" action navElement navInnerLink link navItem"
                    to="/admin/landing/edit"
                  >
                    Edit
                  </MyLink>
                </li>
              </ul>
            </li>
            {/*<li className="col-sm-3 col-xs-12 unequalDivs">
								<ul>
									<li className="dropdown-header">Triggers</li>
                                    <li><a  className=" action navElement navInnerLink link navItem"  onClick={TriggerComposition.createTrigger}>Create</a></li>
                                    <li><a  className=" action navElement navInnerLink link navItem"  onClick={TriggerComposition.editTrigger}>Edit</a></li>
                                </ul>
                            </li>
                            <li className="col-sm-3 col-xs-12 unequalDivs">
								<ul>
									<li className="dropdown-header">Rest Api Services</li>
                                    <li><a  className=" action navElement navInnerLink link navItem"  onClick={RestAPIComposition.createRestAPI}>Create</a></li>
                                    <li><a  className=" action navElement navInnerLink link navItem" onClick={RestAPIComposition.editRestAPI}>Edit</a></li>
                                </ul>
                            </li>*/}
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={linkGenerator.getSummaryLink({
                      schema: "UserRole",
                      org: "public"
                    })}
                  >
                    {common.getConfigDetails() &&
                    common.getConfigDetails().tradeName
                      ? common.getConfigDetails().tradeName
                      : ""}{" "}
                    Team
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={"/admin/all-orgs"}
                  >
                    All Orgs
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={"/admin/messaging-reports"}
                  >
                    Messaging Reports
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={"/admin/create-new-layout"}
                  >
                    Define Layout
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={"/admin/edit-navigation"}
                  >
                    Navigation
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={"/admin/edit-config"}
                  >
                    Config
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li className="dropdown-header link">
                  <MyLink
                    callbackToClosePopup={this.props.callbackToClosePopup}
                    to={"/admin/edit-html-meta"}
                  >
                    HTML META
                  </MyLink>
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li
                  className="dropdown-header link"
                  onClick={this.openReportView}
                >
                  REPORTS
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li
                  className="dropdown-header link"
                  onClick={this.BulkUserCreation}
                >
                  BulkUserCreation
                </li>
              </ul>
            </li>
            <li className="col-sm-3 col-xs-12 unequalDivs">
              <ul className={this.props.fromNewNav ? "list-unstyled" : ""}>
                <li
                  className="dropdown-header link"
                  onClick={this.NewsLetter}
                >
                  News Letter
                </li>
              </ul>
            </li>
          </ul>
        </li>
      );
    } else {
      return (
        <ul className="text-right list-unstyled no-padding-left remove-margin-bottom">
          <li data-toggle="collapse" data-target="#adminConsole">
            <h5 className="remove-margin-bottom">
              <span className="nav-link">ADMIN CONSOLE</span>
            </h5>
          </li>
          <ul
            id="adminConsole"
            className="collapse text-right list-unstyled no-padding-left"
          >
            <li data-toggle="collapse" data-target="#schema-link" className="">
              <h5 className=" text-uppercase ">
                <span className="nav-link">SCHEMA</span>
              </h5>
            </li>
            <ul
              id="schema-link"
              className="collapse text-right list-unstyled no-padding-left"
            >
              <li>
                <h5 className="">
                  <Link
                    to={"/admin/schema/create"}
                    className="link remove-margin-top"
                  >
                    Create
                  </Link>
                </h5>
              </li>
              <li>
                <h5 className="">
                  <Link
                    to={"/admin/schema/edit"}
                    className="link remove-margin-top"
                  >
                    Edit
                  </Link>
                </h5>
              </li>
              <li>
                <h5 className="">
                  <span
                    onClick={ActionCreator.getAllSchemas}
                    className="link remove-margin-top"
                  >
                    Refresh Schemas
                  </span>
                </h5>
              </li>
            </ul>
            <li data-toggle="collapse" data-target="#record" className="">
              <h5 className=" text-uppercase ">
                <span className="nav-link">RECORDS</span>
              </h5>
            </li>
            <ul
              id="record"
              className="collapse text-right list-unstyled no-padding-left"
            >
              <li>
                <h5 className="">
                  <Link
                    to="/admin/record/create"
                    className="link remove-margin-top"
                  >
                    Create
                  </Link>
                </h5>
              </li>
              <li>
                <h5 className="">
                  <Link
                    to="/admin/record/edit"
                    className="link remove-margin-top"
                  >
                    Edit
                  </Link>
                </h5>
              </li>
            </ul>
            {/* <li data-toggle="collapse" data-target="#roles" className=""><h5 className=" text-uppercase "><span className="nav-link">AUTHORIZATION</span></h5></li>
						<ul id="roles" className="collapse text-right list-unstyled no-padding-left">
							<li><h5 className="" ><span onClick={manageRoles.createRoles.bind(null,"new")} className='link remove-margin-top'>Create</span></h5></li>
	                        <li><h5 className="" ><span onClick={manageRoles.createRoles.bind(null,"edit")} className='link remove-margin-top'>Edit</span></h5></li>
	                   </ul>*/}
            <li data-toggle="collapse" data-target="#landingPage">
              <h5 className=" text-uppercase ">
                <span className="nav-link">Landing Page</span>
              </h5>
            </li>
            <ul
              id="landingPage"
              className="collapse text-right list-unstyled no-padding-left"
            >
              <li>
                <h5 className="">
                  <Link
                    to="/admin/landing/create"
                    className="link remove-margin-top"
                  >
                    Create
                  </Link>
                </h5>
              </li>
              <li>
                <h5 className="">
                  <Link
                    to="/admin/landing/edit"
                    className="link remove-margin-top"
                  >
                    Edit
                  </Link>
                </h5>
              </li>
            </ul>
            {/*<li data-toggle="collapse" data-target="#trigger"><h5 className=" text-uppercase "><span className="nav-link">Trigger</span></h5></li>
                        <ul id="trigger" className="collapse text-right list-unstyled no-padding-left">
                            <li><h5 className="" ><span onClick={TriggerComposition.createTrigger} className='link remove-margin-top'>Create</span></h5></li>
                            <li><h5 className="" ><span onClick={TriggerComposition.editTrigger} className='link remove-margin-top'>Edit</span></h5></li>
                        </ul>
                        <li data-toggle="collapse" data-target="#restapi"><h5 className=" text-uppercase "><span className="nav-link">REST API Service</span></h5></li>
                        <ul id="restapi" className="collapse text-right list-unstyled no-padding-left">
                            <li><h5 className="" ><span onClick={RestAPIComposition.createRestAPI} className='link remove-margin-top'>Create</span></h5></li>
                            <li><h5 className="" ><span onClick={RestAPIComposition.editRestAPI} className='link remove-margin-top'>Edit</span></h5></li>
                        </ul>
                       */}
            <li>
              <h5 className=" text-uppercase link">
                <Link
                  to={linkGenerator.getSummaryLink({
                    schema: "UserRole",
                    org: "public"
                  })}
                >
                  {common.getConfigDetails() &&
                  common.getConfigDetails().tradeName
                    ? common.getConfigDetails().tradeName
                    : ""}{" "}
                  Team
                </Link>
              </h5>
            </li>
            <li>
              <h5 className=" text-uppercase link">
                <Link to={"/admin/all-orgs"}>All Orgs</Link>
              </h5>
            </li>
            <li>
              <h5 className=" text-uppercase link">
                <Link to={"/admin/messaging-reports"}>Messaging Reports</Link>
              </h5>
            </li>
            <li>
              <h5 className=" text-uppercase link">
                <Link to={"/admin/create-new-layout"}>Define Layout</Link>
              </h5>
            </li>
            <li>
              <h5 className=" text-uppercase link">
                <Link to={"/admin/edit-navigation"}>Navigation</Link>
              </h5>
            </li>
            <li>
              <h5 className=" text-uppercase link">
                <Link to={"/admin/edit-config"}>Config</Link>
              </h5>
            </li>
            <li>
              <h5 className=" text-uppercase link">
                <Link to={"/admin/edit-html-meta"}>HTML META</Link>
              </h5>
            </li>
            <li>
              <h5
                className=" text-uppercase link"
                onClick={this.openReportView}
              >
                REPORTS
              </h5>
            </li>
            <li>
              <h5
                className=" text-uppercase link"
                onClick={this.BulkUserCreation}
              >
                BulkUserCreation
              </h5>
            </li>
            <li>
              <h5
                className=" text-uppercase link"
                onClick={this.NewsLetter}
              >
                NewsLetter
              </h5>
            </li>
          </ul>
        </ul>
      );
    }
  }
});
exports.AdminConsole = AdminConsole;
