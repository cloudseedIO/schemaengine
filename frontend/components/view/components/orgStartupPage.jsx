/**
 * @author - Vikram
 *
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var common = require("../../common.jsx");
var genericView = require("../genericView.jsx");
var global = require("../../../utils/global.js");
var genericNav = require("../../nav/genericNav.jsx");
//var Link=require('react-router').Link;
var browserHistory = require("react-router").browserHistory;
//var audit=require('./audit.jsx');
var linkGenerator = require("../../nav/linkGenerator.jsx");
//var box_com=require('./box_com.jsx');
/**
 * nav
 * allNavs
 *
 *
 */
var OrgNav = React.createClass({
  getNav: function(sublink, org) {
    browserHistory.push(genericNav.getSubNavUrl(sublink, org));
  },
  takeToOrgPage: function() {
    browserHistory.push(
      linkGenerator.getDetailLink({
        record: {},
        org: this.props.nav.org,
        schema: this.props.nav.orgSchema
          ? this.props.nav.orgSchema
          : "Organization",
        recordId: this.props.nav.org
      })
    );
  },
  handleBack: function() {
    history.back();
  },
  openBoxAPI: function() {
    /*	var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent alignMiddleDiv={true} popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={false}/>,node);
	    ReactDOM.render(<box_com.BoxView org={this.props.nav.org} />,document.getElementById(contentDivId));*/
  },
  render: function() {
    var self = this;
    /*  var textRight="";
        var config=common.getConfigDetails();
        if(config && config.handleBarTemplate && (config.handleBarTemplate=="jsm" || config.handleBarTemplate=="wevaha")){
            textRight="jsm";
        }else{
            textRight="text-right";
        }*/
    var nav = this.props.nav;
    var elements = nav.elements && nav.elements.length > 0 ? nav.elements : [];
    return (
      <ul
        key={global.guid()}
        className="margin-bottom-gap text-center col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
        style={{ fontSize: "16px" }}
      >
        <li className="h5 hidden remove-margin-top toggleOnClickLater">
          <span className="home-arrow link" />
          <span className="link" onClick={this.handleBack}>
            BACK
          </span>
        </li>
        {/*<li  className="display-inline-block extra-padding unequalDivs">
			                	<ul className="list-unstyled">
			                		<li className="toggleOnClick" >
					                	<span className="link" style={{"fontWeight":"700"}} onClick={this.openBoxAPI}>BOX</span>
					               </li>
				               </ul>
			               </li>*/}
        <li className="display-inline-block extra-padding unequalDivs">
          <ul className="list-unstyled">
            <li className="  toggleOnClick">
              <span
                className="link"
                style={{ fontWeight: "700" }}
                onClick={this.takeToOrgPage}
              >
                {this.props.nav.orgName.toUpperCase()}
              </span>
            </li>
          </ul>
        </li>
        {/*<li className="h5 remove-margin-top toggleOnClickLater">
			                    <li className="toggleOnClickLater search">
									<span className="link" onClick={this.takeToOrgPage}>
										{this.props.nav.orgName.toUpperCase()}
									</span>
								</li>
			               </li>*/}
        {elements.map(function(iNav) {
          return (
            <li
              key={global.guid()}
              className="display-inline-block extra-padding unequalDivs"
            >
              <ul className="list-unstyled">
                <li className="  toggleOnClick">
                  <span
                    style={{ fontWeight: "700" }}
                    className="link"
                    onClick={self.getNav.bind(null, iNav, self.props.nav.org)}
                  >
                    {iNav.displayName
                      ? iNav.displayName
                      : iNav.target.schema
                        ? iNav.target.schema
                        : "NA"}
                  </span>
                </li>
              </ul>
            </li>
          );
        })}
      </ul>
    );
  }
});
exports.OrgNav = OrgNav;

/**
 * nav
 * allNavs
 *
 *
 */
var OrgPage = React.createClass({
  hideDisplayName: function(schema) {
    if (this["org" + schema]) {
      this["org" + schema].className = "hidden";
    }
  },
  render: function() {
    var nav = this.props.nav;
    var self = this;
    return (
      <div
        className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding"
        key={global.guid()}
      >
        {/*<audit.Audit key={global.guid()}
				           		recordId={this.props.nav.org}
    	                        rootSchema={this.props.nav.orgSchema}
				           	org={this.props.nav.org}/>*/}

        {this.props.nav && this.props.nav.org && this.props.nav.orgSchema ? (
          <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
            <common.UserIcon
              id={this.props.nav.org}
              org={this.props.nav.org}
              viewName={"getSummary"}
              showAs={"full"}
              rootSchema={this.props.nav.orgSchema}
            />
          </div>
        ) : (
          <div className="hidden" />
        )}
        {["a"].map(function(temp) {
          if (nav.elements && nav.elements.length > 0) {
            return nav.elements.map(function(iNav) {
              if (iNav.target && Object.keys(iNav.target).length > 0) {
                var displayName = iNav.displayName
                  ? iNav.displayName
                  : iNav.target.schema
                    ? iNav.target.schema
                    : "";
                return (
                  <div
                    ref={div => {
                      self["org" + iNav.target.schema] = div;
                    }}
                    className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding"
                    key={global.guid()}
                  >
                    {
                      <h4 className={displayName.length > 0 ? "" : "hidden"}>
                        {displayName}
                      </h4>
                    }

                    <genericView.SummarizeAll
                      key={global.guid()}
                      schema={iNav.target.schema}
                      filters={iNav.target.filters}
                      dependentSchema={iNav.target.dependentSchema}
                      org={self.props.nav.org}
                      skip={iNav.target.skip}
                      limit={6}
                      hideDisplayName={self.hideDisplayName}
                      fromDetailView={true}
                      sortBy={iNav.target.sortBy}
                      sortOrder={iNav.target.sortOrder}
                    />
                  </div>
                );
              } else {
                return <div key={global.guid()} className="hidden" />;
              }
            });
          } else {
            return <div key={global.guid()} className="hidden" />;
          }
        })}
      </div>
    );
  }
});
exports.OrgPage = OrgPage;
