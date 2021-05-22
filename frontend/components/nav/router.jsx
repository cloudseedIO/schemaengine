/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");

var Router = require("react-router").Router;
var Route = require("react-router").Route;
//var Link=require('react-router').Link;

var genericView = require("../view/genericView.jsx");
var calendarView = require("../view/calendarview.jsx");
var groupBy = require("../view/components/groupBy.jsx");
var dynamicUI = require("../view/dynamicUI.jsx");
var genericNav = require("../nav/genericNav.jsx");
var signUp = require("../auth/signUp.jsx");
var common = require("../common.jsx");
var compareView = require("../view/components/compareView.jsx");
var orgStartupPage = require("../view/components/orgStartupPage.jsx");

var search = require("./search.jsx");
var advFilters = require("./advFilters.jsx");
var manageRecords = require("../records/manageRecords.jsx");

var DefinitionStore = require("../../stores/DefinitionStore");
var JunctionStore = require("../../stores/JunctionStore");
var SchemaStore = require("../../stores/SchemaStore.js");
var RecordDetailStore = require("../../stores/RecordDetailStore.js");
var utility = require("../Utility.jsx");

var WebUtils = require("../../utils/WebAPIUtils.js");
var global = require("../../utils/global.js");
var IndexRoute = require("react-router").IndexRoute;
var browserHistory = require("react-router").browserHistory;
var explore = require("./explore.jsx");
var researchSpec = require("./researchSpec.jsx");
var setupAccount = require("../auth/setupAccount.jsx");
var projects = require("../view/components/projects.jsx");

var manageSchema = require("../admin/manageSchemaNew.jsx");
var defineLandingPageLayouts = require("../admin/defineLandingPageLayouts.jsx");
var defineRecordLayout = require("../admin/defineRecordLayout.jsx");
var orgManager = require("../admin/OrgManager.jsx");
var messagingReports = require("../admin/MessagingReports.jsx");
var navManager = require("../admin/navManager.jsx");
var configManager = require("../admin/configManager.jsx");
var HTMLMetaManager = require("../admin/HTMLMetaManager.jsx");
var HTMLMetaManager = require("../admin/HTMLMetaManager.jsx");
var sitemapUploader = require("../admin/sitemapUploader.jsx");
var RequirementsUpload = require("../admin/RequirementUpload.jsx");
var MfrReports = require("../admin/MfrReports.jsx");
var ManufacturerInfo = require("../view/components/ManufacturerInfo.jsx");

var Landing = React.createClass({
  processStateFromProps: function(props) {
    var lpi =
      typeof props.location.query.l == "undefined" ||
      props.location.query.l == "undefined"
        ? undefined
        : props.location.query.l;
    lpi = lpi
      ? lpi
      : common.getConfigDetails().landingTemplate
        ? common.getConfigDetails().landingTemplate
        : "CloudseedTemplate";
    return { lpi: lpi };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $(".loader").remove();
      }
    } catch (err) {}
  },
  componentDidUpdate: function() {
    this.updateNav();
    this.updateTitle();
    compareView.loadCompareList();
  },
  setDivs: function() {
    $("html,body").scrollTop(0);
    $("#landingPage").css("display", "none");
    $("#dynamicContentDiv").css("display", "block");
    $.ajaxQueue("clear");
    try {
      if (
        common.getConfigDetails().handleBarTemplate == "jsm" ||
        common.getConfigDetails().handleBarTemplate == "wevaha"
      ) {
        document.getElementById("sideFilterNavigation").className = "hidden";
        document.getElementById("summaryNav").parentNode.className += " hidden";
        document.getElementById("dynamicContentDiv").className =
          "col-xs-12 col-sm-12  col-lg-12 col-md-12";
        document.getElementById("rightContentDiv").className = "hidden";
      }
    } catch (err) {}
  },
  updateNav: function() {
    clearSideNav();
    if (document.getElementById("bottomNav")) {
      ReactDOM.unmountComponentAtNode(document.getElementById("bottomNav"));
      ReactDOM.render(
        <common.BottomNavComponent />,
        document.getElementById("bottomNav")
      );
    }
  },
  updateTitle: function() {
    var lpiDoc = DefinitionStore.get(this.state.lpi);
    var meta = "";
    if (this.state.lpi && lpiDoc && lpiDoc.htmlMeta && lpiDoc.htmlMeta.title) {
      meta = lpiDoc.htmlMeta.title;
    } else if (
      common.getConfigDetails().htmlMeta &&
      common.getConfigDetails().htmlMeta.title
    ) {
      meta = common.getConfigDetails().htmlMeta.title;
    } else {
      meta =
        (this.state.lpi ? this.state.lpi : "") +
        " | " +
        common.getConfigDetails().title;
    }
    try {
      document.getElementsByTagName("title")[0].innerHTML = meta;
    } catch (err) {}
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(this.processStateFromProps(nextProps));
  },
  componentDidMount: function() {
    DefinitionStore.addChangeListener(this.updateTitle, this.state.lpi);
    this.componentDidUpdate();
    this.setDivs();
    common.showMainContainer(0);
    try {
      if (common.getUserDoc().recordId) {
        guide("Guide-HomePageLoggedIn");
      } else {
        guide("Guide-HomePage");
      }
    } catch (err) {}
  },
  componentWillUnmount: function() {
    DefinitionStore.removeChangeListener(this.updateTitle, this.state.lpi);
  },
  render: function() {
    return (
      <div className="row margin-top-gap-sm mobile-no-margin">
        <dynamicUI.DynamicUI templateId={this.state.lpi} key={global.guid()} />
      </div>
    );
  }
});

function searchfor(schema, ds, elements) {
  var sublink = {
    dummy: true,
    displayName: schema,
    target: {
      create: "",
      methods: "",
      navViews: "",
      schema: schema,
      dependentSchema: ds
    }
  };
  try {
    for (var i = 0; i < elements.length; i++) {
      if (
        elements[i].target.schema == schema &&
        elements[i].target.dependentSchema == ds
      ) {
        sublink = elements[i];
        break;
      } else if (elements[i].target.elements) {
        sublink = searchfor(schema, ds, elements[i].target.elements);
        if (!sublink.dummy) {
          break;
        }
      }
    }
    return sublink;
  } catch (err) {
    return sublink;
  }
}
var SummarizeAll = React.createClass({
  processStateFromProps: function(props) {
    var schema = props.params.schema;
    var dependentSchema =
      typeof props.location.query.ds == "undefined" ||
      props.location.query.ds == "undefined" ||
      props.location.query.ds == ""
        ? undefined
        : props.location.query.ds;
    var filters =
      typeof props.location.query.flts == "undefined" ||
      props.location.query.flts == "undefined" ||
      props.location.query.flts == ""
        ? undefined
        : JSON.parse(decodeURIComponent(props.location.query.flts));
    var org =
      typeof props.location.query.org == "undefined" ||
      props.location.query.org == "undefined" ||
      props.location.query.org == ""
        ? "public"
        : props.location.query.org;
    var sortBy =
      typeof props.location.query.by == "undefined" ||
      props.location.query.by == "undefined" ||
      props.location.query.by == ""
        ? undefined
        : props.location.query.by;
    var sortOrder =
      typeof props.location.query.order == "undefined" ||
      props.location.query.order == "undefined" ||
      props.location.query.order == ""
        ? undefined
        : props.location.query.order;
    var skip = props.location.query.skp * 1;

    try {
      var savedFilters = compareView.loadFilters(schema + dependentSchema);
      var schemaDoc = SchemaStore.get(schema + "-" + dependentSchema);
      if (
        savedFilters &&
        global.filtersComparison(
          filters,
          global.cleanFilters(schemaDoc.navFilters["default"].filters)
        )
      ) {
        filters = savedFilters;
      }
    } catch (err) {
      //console.log(err);
    }
    var data = this.findPath(schema, dependentSchema, filters,org);
    return {
      schema: schema,
      dependentSchema: dependentSchema,
      filters: filters,
      org: org,
      skip: skip,
      sortBy: sortBy,
      sortOrder: sortOrder,
      sublink: data.sublink,
      orgName: data.orgName
    };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(this.processStateFromProps(nextProps));
  },
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $("html,body").scrollTop(0);
        $("#landingPage").css("display", "none");
        $("#search").css("display", "block");
        $("#dynamicContentDiv").css("display", "block");
        $(".loader").remove();
      }
    } catch (err) {}
  },
  componentDidMount: function() {
    this.componentDidUpdate();
    $(".lookUpDialogBox").remove();
    common.showMainContainer(0);
    try {
      guide("Guide-SummaryPage");
      var schemaDoc = SchemaStore.get(this.state.schema);
      if (schemaDoc.guide && schemaDoc.guide.summary) {
        guide(schemaDoc.guide.summary);
      }
    } catch (err) {}
  },
  updateBottomNav:function(){
    if (document.getElementById("bottomNav") && $("#bottomNav").height()>0) {
      if (document.getElementById("bottomNav")) {
        ReactDOM.unmountComponentAtNode(document.getElementById("bottomNav"));
        ReactDOM.render(
          <common.BottomNavComponent
            bottomFilterClick={"yes"}
            org={this.state.org}
            orgName={this.state.orgName}
            filters={this.state.filters}
            sublink={this.state.sublink}
          />,
          document.getElementById("bottomNav")
        );
        document.getElementById("filter").src = document
          .getElementById("filter")
          .src.replace("/branding/Filter1.png", "/branding/Filter2.png");
       	 $("#bottomFilter").removeClass("pointer-events");
      }
    }
  },
  componentDidUpdate: function() {
    this.updateTitle();
    this.updateBottomNav();
    compareView.loadCompareList(
      this.state.schema +
        (this.state.dependentSchema ? this.state.dependentSchema : "")
    );
    var schemaDoc = SchemaStore.get(this.state.schema);
    if (schemaDoc.trackEvents) {
      try {
        trackThis("summaryPage", {
          type: this.state.schema,
          subType: this.state.dependentSchema
        });
      } catch (err) {}
    }
  },
  updateTitle: function() {
    try {
      var schemaDoc = SchemaStore.get(this.state.schema);
      if (this.state.dependentSchema) {
        var dsRec = SchemaStore.get(
          this.state.schema + "-" + this.state.dependentSchema
        );
        if (dsRec) {
          schemaDoc = genericView.combineSchemas(schemaDoc, dsRec);
        }
      }
      var meta = "";
      if (schemaDoc.htmlMeta && schemaDoc.htmlMeta.title) {
        meta = schemaDoc.htmlMeta.title;
        if (
          this.props.path != undefined &&
          schemaDoc.navFilters &&
          schemaDoc.navFilters[this.props.path] &&
          typeof schemaDoc.navFilters[this.props.path].htmlMeta == "object"
        ) {
          meta = schemaDoc.navFilters[this.props.path].htmlMeta.title;
        }
      } else {
        meta =
          (this.state.schema ? this.state.schema : "") +
          " " +
          (this.state.dependentSchema ? this.state.dependentSchema : "") +
          " | " +
          common.getConfigDetails().title;
      }
      try {
        document.getElementsByTagName("title")[0].innerHTML = meta;
      } catch (err) {}
       $("html,body").scrollTop(0);
    } catch (err) {}
  },
  findPath: function(schema, dependentSchema, filters, org) {
    if (!schema) {
      var schema = this.state.schema;
      var dependentSchema = this.state.dependentSchema;
      var org = this.state.org;
    }
    var orgName = "";
    var navElements;
    var navLinks = DefinitionStore.getNavigationLinks();
    for (var i = 0; i < navLinks.navs.length; i++) {
      if (navLinks.navs[i].org == org) {
        orgName = navLinks.navs[i].orgName;
        navElements = navLinks.navs[i].elements;
        break;
      }
    }
    var sublink = searchfor(schema, dependentSchema, navElements);
    var data = { sublink: sublink, orgName: orgName };
    return data;
  },
  componentWillUnmount: function() {
    document.getElementById("bottomFilter").className = document
      .getElementById("bottomFilter")
      .className.replace("", "pointer-events ");
    document.getElementById(
      "bottomNotification"
    ).className = document
      .getElementById("bottomNotification")
      .className.replace(/hidden/g, "");

    document.getElementById("filter").src = document
      .getElementById("filter")
      .src.replace("/branding/Filter2.png", "/branding/Filter1.png");
    this.componentWillUpdate();
  },
  componentWillUpdate: function() {
    compareView.saveCompareList(
      this.state.schema +
        (this.state.dependentSchema ? this.state.dependentSchema : "")
    );
    if (this.state.dependentSchema) {
      var id = this.state.schema + this.state.dependentSchema;
      if (localStorage.getItem("FILTERS-" + id) != "ClickThroughNavFilters") {
        compareView.saveFilters(id, this.state.filters);
      }
    }
  },
  render: function() {
    var schema = SchemaStore.get(this.props.params.schema);
    var filters = this.state.filters ? this.state.filters : {};
    try {
      if (schema["@operations"].read.getSummary.viewType == "calendar") {
        return (
          <calendarView.Cal
            schema={this.state.schema}
            filters={filters}
            dependentSchema={this.state.dependentSchema}
            org={this.state.org}
            skip={this.state.skip}
            rootSchema={this.state.schema}
          />
        );
      }
    } catch (err) {}

    return (
      <div className="container margin-top-gap mobile-no-margin">
        <genericView.SummarizeAll
          key={global.guid()}
          schema={this.state.schema}
          filters={JSON.parse(JSON.stringify(filters))}
          dependentSchema={this.state.dependentSchema}
          org={this.state.org}
          sublink={this.state.sublink}
          orgName={this.state.orgName}
          skip={this.state.skip}
          sortBy={this.state.sortBy}
          sortOrder={this.state.sortOrder}
        >
          {typeof navigator != "undefined" &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) ? (
            ""
          ) : (
            <genericNav.SubList
              org={this.state.org}
              orgName={this.state.orgName}
              filters={JSON.parse(JSON.stringify(filters))}
              sublink={this.state.sublink}
            />
          )}
        </genericView.SummarizeAll>
      </div>
    );
  }
});

var Detail = React.createClass({
  processStateFromProps: function(props) {
    try {
      $.ajaxQueue("clear");
    } catch (err) {}
    //var schema=props.params.schema;
    var schema =
      typeof props.location.query.s == "undefined" ||
      props.location.query.s == "undefined" ||
      props.location.query.s == ""
        ? undefined
        : props.location.query.s;
    var dependentSchema =
      props.location.query.ds == "undefined"
        ? undefined
        : props.location.query.ds;
    //var org=props.params.org;
    var org =
      typeof props.location.query.org == "undefined" ||
      props.location.query.org == "undefined" ||
      props.location.query.org == ""
        ? "public"
        : props.location.query.org;
    var recordId = props.params.recordId;
    var filters =
      typeof props.location.query.flts == "undefined" ||
      props.location.query.flts == "undefined" ||
      props.location.query.flts == ""
        ? undefined
        : JSON.parse(decodeURIComponent(props.location.query.flts));
    return {
      org: org,
      schema: schema,
      dependentSchema: dependentSchema,
      recordId: recordId,
      filters: filters
    };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $("html,body").scrollTop(0);
        $("#search").css("display", "block");
        $("#landingPage").css("display", "none");
        $("#dynamicContentDiv").css("display", "block");
        $.ajaxQueue("clear");
        $(".loader").remove();
        JunctionStore.clear();
        this.updateNav();
      }
    } catch (err) {}
  },
  componentDidMount: function() {
    this.componentDidUpdate();
    RecordDetailStore.addChangeListener(this.updateTitle, this.state.recordId);
    RecordDetailStore.addChangeListener(this.trackEvent, this.state.recordId);
    $(".lookUpDialogBox").remove();
    //common.showLoginPopup();

    /*	try{
			if(document.getElementsByClassName("summaryNavigation")[0] &&
					document.getElementsByClassName("summaryNavigation")[0].className &&
					document.getElementsByClassName("summaryNavigation")[0].className.indexOf("in")!=-1){

						document.getElementsByClassName("summaryNavigation")[0].className=document.getElementsByClassName("summaryNavigation")[0].className.replace("in","");
			}
		}catch(err){

		}*/
    try {
      guide("Guide-DetailPage");
      var schemaDoc = SchemaStore.get(this.state.schema);
      if (schemaDoc.guide && schemaDoc.guide.detail) {
        guide(schemaDoc.guide.detail);
      }
    } catch (err) {}
  },
  componentWillUnmount: function() {
    RecordDetailStore.removeChangeListener(
      this.updateTitle,
      this.state.recordId
    );
    RecordDetailStore.removeChangeListener(
      this.trackEvent,
      this.state.recordId
    );
    this.componentWillUpdate();
  },
  componentWillUpdate: function() {
    compareView.saveCompareList(this.state.recordId);
  },
  componentDidUpdate: function() {
    this.updateNav();
    this.updateTitle();
    common.showMainContainer(0);
    $("html,body").scrollTop(0);
    compareView.loadCompareList(this.state.recordId);
  },
  trackEvent: function() {
    var record = RecordDetailStore.getSchemaRecord({
      schema: this.state.schema,
      recordId: this.state.recordId,
      userId: common.getUserDoc().recordId,
      org: this.state.org
    });
    record =
      typeof record == "object" && typeof record.value == "object"
        ? record.value
        : {};
    var schemaRec = SchemaStore.get(this.state.schema);
    if (schemaRec.trackEvents) {
      var properties = {
        type: this.state.schema,
        id: this.state.recordId
      };
      if (Array.isArray(schemaRec.trackProperties)) {
        for (var ind = 0; ind < schemaRec.trackProperties.length; ind++) {
          properties[schemaRec.trackProperties[ind]] =
            record[schemaRec.trackProperties[ind]];
        }
      }
      try {
        trackThis("detailPage", properties);
      } catch (err) {}
    }
    RecordDetailStore.removeChangeListener(
      this.trackEvent,
      this.state.recordId
    );
  },
  updateTitle: function() {
    var record = RecordDetailStore.getSchemaRecord({
      schema: this.state.schema,
      recordId: this.state.recordId,
      userId: common.getUserDoc().recordId,
      org: this.state.org
    });
    record =
      typeof record == "object" && typeof record.value == "object"
        ? record.value
        : {};
    var schemaRec = SchemaStore.get(this.state.schema);
    var metaTitle = "";
    var name = "";
    if (
      schemaRec &&
      schemaRec["@identifier"] &&
      schemaRec["@identifier"] != "recordId" &&
      typeof record[schemaRec["@identifier"]] == "string"
    ) {
      name = record[schemaRec["@identifier"]];
    }
    try {
      if (schemaRec && schemaRec["titleProperties"].length > 0) {
        for (var i = schemaRec["titleProperties"].length - 1; i >= 0; i--) {
          if (record[schemaRec["titleProperties"][i]]) {
            var innerWords = record[schemaRec["titleProperties"][i]].split(" ");
            var wordToAdd = "";
            if (schemaRec["titleProperties"].length > 1) {
              for (var j = 0; j < innerWords.length; j++) {
                if (
                  metaTitle.length + wordToAdd.length <=
                  65 - innerWords[j].length
                ) {
                  wordToAdd += " " + innerWords[j].trim();
                }
              }
            } else {
              wordToAdd = record[schemaRec["titleProperties"][i]];
            }
            metaTitle = " " + wordToAdd.trim() + " " + metaTitle.trim();
          }
        }
        metaTitle = metaTitle.trim();
      }
    } catch (err) {
      metaTitle = name + " | " + common.getConfigDetails().title;
      metaTitle = metaTitle
        .trim()
        .replace("|", "")
        .trim();
    }
    try{
      document.getElementsByTagName("title")[0].innerHTML = metaTitle;
    }catch(err){}

  },
  updateNav: function() {
    try {
      var rootSchema = this.state.schema;
      var dsName = this.state.dependentSchema;
      clearSideNav();
      var config = common.getConfigDetails();

      if (
        config.handleBarTemplate == "jsm" ||
        config.handleBarTemplate == "wevaha"
      ) {
        if (common.getSiteSpecific()) {
          document.getElementById("bottomNav").className = "hidden";
          document.getElementById("dynamicContentDiv").className =
            "col-xs-12 col-sm-12  col-lg-12 col-md-12 ";
          document.getElementById("rightContentDiv").className = "hidden";
          $("body").css("paddingTop", "0px");
        } else {
          document.getElementById("sideFilterNavigation").className =
            "hidden-sm-up col-lg-2 col-md-2 col-sm-3 hidden col-xs-12 ";
          document.getElementById("dynamicContentDiv").className =
            " col-lg-12 col-md-12 col-sm-12 col-xs-12 ";
          document.getElementById("rightContentDiv").className =
            " col-lg-2 col-md-2 col-sm-12 col-xs-12 hidden";
        }
        //divId="sideFilterNavigation";
      }
    } catch (err) {}
  },
  componentWillReceiveProps: function(nextProps) {
    if (JSON.stringify(this.props) != JSON.stringify(nextProps)) {
      JunctionStore.clear();
      this.setState(this.processStateFromProps(nextProps));
    }
  },
  doNavUpdate: function(recordId) {
    if (recordId == this.state.recordId) {
      history.back();
    }
  },
  render: function() {
    return (
      <div className="container margin-top-gap mobile-no-margin">
        <genericView.GoIntoDetail
          key={global.guid()}
          rootSchema={this.state.schema}
          recordNav={true}
          filters={this.state.filters}
          dependentSchema={this.state.dependentSchema}
          recordId={this.state.recordId}
          doNavUpdate={this.doNavUpdate}
          org={this.state.org}
        />
      </div>
    );
  }
});

var OrgPage = React.createClass({
  processStateFromProps: function(props) {
    var orgId =
      typeof props.params.orgId == "undefined" ||
      props.params.orgId == "undefined"
        ? undefined
        : props.params.orgId;
    var orgData = {};
    var navLinks = DefinitionStore.getNavigationLinks();
    if (navLinks && navLinks.navs && navLinks.navs.length > 0) {
      for (var i = 0; i < navLinks.navs.length; i++) {
        if (navLinks.navs[i].org == orgId) {
          orgData = navLinks.navs[i];
          break;
        }
      }
    }
    return { orgId: orgId, orgData: orgData };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $("html,body").scrollTop(0);
        $("#search").css("display", "block");
        $("#landingPage").css("display", "none");
        $("#dynamicContentDiv").css("display", "block");
        $.ajaxQueue("clear");
        $(".loader").remove();
      }
    } catch (err) {}
  },
  componentDidMount: function() {
    this.componentDidUpdate();
    $(".lookUpDialogBox").remove();
    //common.showMainContainer(0);
    //common.showLoginPopup();
  },
  componentWillReceiveProps: function(nextProps) {
    if (JSON.stringify(this.props) != JSON.stringify(nextProps)) {
      JunctionStore.clear();
      this.setState(this.processStateFromProps(nextProps));
    }
  },
  componentDidUpdate: function() {
    this.updateNav();
    common.showMainContainer(0);
    $("html,body").scrollTop(0);
  },
  updateNav: function() {
    clearSideNav();
    var config = common.getConfigDetails();
    try {
      if (
        config.handleBarTemplate == "jsm" ||
        config.handleBarTemplate == "wevaha"
      ) {
        if (common.getSiteSpecific()) {
          document.getElementById("bottomNav").className = "hidden";
          document.getElementById("dynamicContentDiv").className =
            "col-xs-12 col-sm-12  col-lg-12 col-md-12 ";
          document.getElementById("rightContentDiv").className = "hidden";
          $("body").css("paddingTop", "0px");
        } else {
          document.getElementById("sideFilterNavigation").className =
            "hidden-sm-up col-lg-2 col-md-2 col-sm-3 col-xs-12 ";
          document.getElementById("dynamicContentDiv").className =
            " col-lg-12 col-md-12 col-sm-12 col-xs-12 ";
          document.getElementById("rightContentDiv").className =
            " hidden-sm-up col-lg-2 col-md-2 col-sm-12 col-xs-12 ";
        }
      }
    } catch (err) {}
  },
  render: function() {
    if (Object.keys(this.state.orgData).length > 0) {
      return (
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap-sm">
          <orgStartupPage.OrgNav
            nav={this.state.orgData}
            allNavs={this.state.navLinks}
          />
          <orgStartupPage.OrgPage
            key={global.guid()}
            nav={this.state.orgData}
          />
        </div>
      );
    } else {
      return <div key={global.guid()} />;
    }
  }
});

var Search = React.createClass({
  processStateFromProps: function(props) {
    //var searchText=(typeof props.location.query.st=="undefined" || props.location.query.st=="undefined" )?undefined:props.location.query.st;
    var searchText =
      typeof props.params.st == "undefined" || props.params.st == "undefined"
        ? undefined
        : props.params.st;
    var mobile =
      typeof props.location.query.mobile != "undefined"
        ? props.location.query.mobile
        : undefined;
    return { searchText: searchText, mobile: mobile };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $(".loader").remove();
      }
    } catch (err) {}
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(this.processStateFromProps(nextProps));
  },
  componentDidMount: function() {
    $("#search").css("display", "block");
    this.updateTitle();
    //common.showLoginPopup();
  },
  componentDidUpdate() {
    this.componentDidMount();
    common.showMainContainer(0);
  },
  updateTitle: function() {
    var searchText = this.state.searchText;
    var meta = searchText + " | " + common.getConfigDetails().title;
    try {
      document.getElementsByTagName("title")[0].innerHTML = meta;
    } catch (err) {}
  },
  render: function() {
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap-sm">
        <search.SearchResults
          key={global.guid()}
          searchText={this.state.searchText}
          mobile={this.state.mobile}
        />
      </div>
    );
  }
});
var AdvSearch = React.createClass({
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $(".loader").remove();
      }
    } catch (err) {}
  },
  componentDidMount: function() {
    $("#search").css("display", "block");
    this.updateTitle();
    common.showMainContainer(0);
  },
  updateTitle: function() {
    var meta = " Advanced Search | " + common.getConfigDetails().title;
    try {
      document.getElementsByTagName("title")[0].innerHTML = meta;
    } catch (err) {}
  },
  render: function() {
    return (
      <advFilters.AdvFilter
        schema={SchemaStore.get(this.props.params.schema)}
        org={this.props.params.org}
        rootSchema={this.props.params.schema}
      />
    );
  }
});
var CreateOrEdit = React.createClass({
  componentWillMount: function() {
    try {
      if (typeof window != "undefined") {
        $(".loader").remove();
      }
    } catch (err) {}
  },
  componentDidMount: function() {
    $("#search").css("display", "block");
    this.updateTitle();
    $(".lookUpDialogBox").remove();
    common.showMainContainer(0);
    var config = common.getConfigDetails();
    common.clearFilters();
    ReactDOM.render(
      <genericNav.RecordNav />,
      document.getElementById("sideFilterNavigation")
    );

    //common.showLoginPopup();
    try {
      if (
        config.handleBarTemplate == "jsm" ||
        config.handleBarTemplate == "wevaha"
      ) {
        if (common.getSiteSpecific()) {
          document.getElementById("bottomNav").className = "hidden";
          document.getElementById("dynamicContentDiv").className =
            "col-xs-12 col-sm-12  col-lg-12 col-md-12 ";
          document.getElementById("rightContentDiv").className = "hidden";
          $("body").css("paddingTop", "0px");
        } else {
          document.getElementById("sideFilterNavigation").className =
            "hidden-sm-up col-lg-2 col-md-2 col-sm-3 col-xs-12 ";
          document.getElementById("dynamicContentDiv").className =
            " col-lg-12 col-md-12 col-sm-12 col-xs-12 ";
          document.getElementById("rightContentDiv").className =
            " hidden-sm-up col-lg-2 col-md-2 col-sm-12 col-xs-12 ";
        }
      }
    } catch (err) {}
  {/*  if (typeof common.getUserDoc().recordId == "undefined") {
      var node = document.createElement("div");
      node.id = global.guid();
      var popUpId = global.guid();
      var contentDivId = global.guid();
      var sideDivId = global.guid();
      node.className =
        "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
      document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
      ReactDOM.render(
        <common.GenericPopUpComponent
          popUpId={popUpId}
          contentDivId={contentDivId}
          sideDivId={sideDivId}
          noSideDiv={true}
        />,
        node
      );
      ReactDOM.render(
        <signUp.LoginPopup popUpId={popUpId} />,
        document.getElementById(contentDivId)
      );
    }*/}
  },
  updateTitle: function() {
    var meta = "Create/Edit Record | " + common.getConfigDetails().title;
    try {
      document.getElementsByTagName("title")[0].innerHTML = meta;
    } catch (err) {}
  },
  render: function() {
    var coeData = {};
    if (this.props.location.query && this.props.location.query.data) {
      try {
        coeData = JSON.parse(
          decodeURIComponent(this.props.location.query.data)
        );
      } catch (err) {
        coeData = {};
      }
    }
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap">
        <div className="col-lg-1 col-md-1 col-sm-1 hidden-xs no-padding" />
        <div className="col-lg-10 col-md-10 col-sm-10 col-xs-12 no-padding">
          <manageRecords.DisplayCustomSchema
            org={this.props.params.org}
            schemaName={this.props.params.schema}
            prompt={coeData.prompt}
            createHeading={coeData.createHeading}
            knownData={coeData.knownData}
            recordId={coeData.recordId}
            editMethod={coeData.editMethod}
            dependentSchema={coeData.dependentSchema}
            showCancel={coeData.showCancel}
          />
        </div>
        <div className="col-lg-1 col-md-1 col-sm-1 hidden-xs no-padding" />
      </div>
    );
  }
});
exports.CreateOrEdit = CreateOrEdit;

var Group = React.createClass({
  processStateFromProps: function(props) {
    var state = props.params ? props.params : {};
    state.htmlMeta = props.htmlMeta;
    if (props.location.query && typeof props.location.query == "object") {
      for (var i = 0; i < Object.keys(props.location.query).length; i++) {
        state[Object.keys(props.location.query)[i]] =
          props.location.query[Object.keys(props.location.query)[i]];
      }
    }
    state.org = state.org ? state.org : "public";
    return state;
  },
  componentDidMount: function() {
    this.updateTitle();
    common.showMainContainer(0);
  },
  updateTitle: function() {
    var meta = this.state.text + " | " + common.getConfigDetails().title;
    if (typeof this.state.htmlMeta == "object") {
      meta = this.state.htmlMeta.title;
    }
    try {
      document.getElementsByTagName("title")[0].innerHTML = meta;
    } catch (err) {}
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(this.processStateFromProps(nextProps));
  },
  render: function() {
    return (
      <groupBy.GroupByWithinSchema data={this.state} key={global.guid()} />
    );
  }
});

var PageNotFound = React.createClass({
  componentDidMount: function() {
    common.showMainContainer(0);
  },
  render: function() {
    return (
      <div className="text-center">
        <h1>404</h1>
        <h2>Sorry, the page you have requested is not available</h2>
        <h3>
          Please click on the menu options or try search above to find what you
          are looking for
        </h3>
      </div>
    );
  }
});
exports.PageNotFound = PageNotFound;

var Slug = React.createClass({
  processStateFromProps: function(props) {
    return {
      slug: props.params.slug,
      path: props.params.path,
      details: common.getSlugDetails(props.params.slug, props.params.path)
        ? common.getSlugDetails(props.params.slug, props.params.path)
        : undefined
    };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillReceiveProps: function(nextProps) {
    var self = this;
    this.setState(this.processStateFromProps(nextProps), function() {
      self.getSlugDetails();
    });
  },
  componentDidMount: function() {
    this.getSlugDetails();
    this.componentDidUpdate();
  },
  componentDidUpdate: function() {},
  getSlugDetails: function() {
    if (this.state.details == undefined || this.state.details.error) {
      common.startLoader();
      WebUtils.getSlugDetails(
        { slug: this.state.slug, path: this.state.path },
        function(data) {
          if (!this._isUnmounted)
            this.setState({ details: data }, common.stopLoader);
        }.bind(this)
      );
    }
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    if (this.state.details) {
      if (this.state.details.error) {
        return <PageNotFound />;
      } else {
        if (this.state.details.type && this.state.details.type == "summary") {
          var skip = this.props.location.query.page
            ? (this.props.location.query.page - 1) * global.summaryLimitCount
            : undefined;
          return (
            <SummarizeAll
              slug={this.state.slug}
              path={this.state.path}
              params={{ schema: this.state.details.target.schema }}
              location={{
                query: {
                  s: this.state.details.target.schema,
                  ds: this.state.details.target.dependentSchema,
                  flts: encodeURIComponent(
                    JSON.stringify(this.state.details.target.filters)
                  ),
                  skp: skip,
                  org: undefined
                }
              }}
            />
          );
        } else if (
          this.state.details.type &&
          this.state.details.type == "landingPage"
        ) {
          return (
            <Landing
              slug={this.state.slug}
              location={{ query: { l: this.state.details.target.landingPage } }}
            />
          );
        } else if (
          this.state.details.type &&
          this.state.details.type == "groupView"
        ) {
          return (
            <Group
              slug={this.state.slug}
              params={{
                schema: this.state.details.target.schema,
                viewName: this.state.details.target.viewName,
                text: this.state.details.displayName
              }}
              htmlMeta={this.state.details.htmlMeta}
              location={{ query: this.state.details.target.keys }}
            />
          );
        } else if (
          this.state.details.type &&
          this.state.details.type == "detail"
        ){
          return (
            <Detail
              slug={this.state.slug}
              params={{ recordId: this.state.details.target.recordId }}
              location={{
                query: {
                  s: this.state.details.target.schema,
                  ds: this.state.details.target.dependentSchema,
                  org: undefined
                }
              }}
            />
          );
        }else{
        	return <div/>;
        }
      }
    } else {
      return <div />;
    }
  }
});
exports.Slug = Slug;

var Explore = React.createClass({
  processStateFromProps: function(props) {
    var uniqueUserName =
      typeof props.params.st == "undefined" || props.params.st == "undefined"
        ? undefined
        : props.params.st;
    var mobile =
      typeof props.location.query.mobile != "undefined"
        ? props.location.query.mobile
        : undefined;
    return { uniqueUserName: uniqueUserName, mobile: mobile };
  },
  getInitialState: function() {
    return this.processStateFromProps(this.props);
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(this.processStateFromProps(nextProps));
  },
  componentDidMount: function() {
    $("#search").css("display", "block");
    this.updateTitle();
    $("html,body").scrollTop(0);
    $("#landingPage").css("display", "none");
    $("#dynamicContentDiv").css("display", "block");
    $.ajaxQueue("clear");
    try {
      if (
        common.getConfigDetails().handleBarTemplate == "jsm" ||
        common.getConfigDetails().handleBarTemplate == "wevaha"
      ) {
        document.getElementById("sideFilterNavigation").className = "hidden";
        document.getElementById("summaryNav").parentNode.className += " hidden";
        document.getElementById("dynamicContentDiv").className =
          "col-xs-12 col-sm-12  col-lg-12 col-md-12";
        document.getElementById("rightContentDiv").className = "hidden";
      }
    } catch (err) {}
  },
  componentDidUpdate() {
    this.componentDidMount();
  },
  updateTitle: function() {
    var uniqueUserName = this.state.uniqueUserName;
    var meta = uniqueUserName + " | " + common.getConfigDetails().title;
    try {
      document.getElementsByTagName("title")[0].innerHTML = meta;
    } catch (err) {}
  },
  render: function() {
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap-sm">
        <explore.ExploreView
          key={global.guid()}
          uniqueUserName={this.state.uniqueUserName}
          mobile={this.state.mobile}
        />
      </div>
    );
  }
});

exports.Explore = Explore;

var App = React.createClass({
  loadHome: function() {
    browserHistory.push("/");
    if ($(".navbar-toggle").height() > 0) {
      if (
        $("#dynamicContentDiv")
          .attr("style")
          .indexOf("display: none") != -1
      ) {
        $("#dynamicContentDiv").show();
        $(".footer").show();
      }
      if (
        $("#mainNavigation").find(".navbar-collapse").length > 0 &&
        $("#mainNavigation")
          .find(".navbar-collapse")
          .hasClass("in") == true
      ) {
        $("#mainNavigation")
          .find(".navbar-collapse")
          .removeClass("in");
      }
    }
  },
  componentDidUpdate: function() {
    if ($(".navbar-toggle").height() > 0) {
      if (document.getElementsByClassName("summaryNavigation")[0]) {
        if (
          document.getElementsByClassName("summaryNavigation")[0].className &&
          document
            .getElementsByClassName("summaryNavigation")[0]
            .className.indexOf("in") != -1
        )
          document.getElementsByClassName(
            "summaryNavigation"
          )[0].className = document
            .getElementsByClassName("summaryNavigation")[0]
            .className.replace("in", "");
      } else if (
        $("#mainNavigation").find(".navbar-collapse").length > 0 &&
        $("#mainNavigation")
          .find(".navbar-collapse")
          .hasClass("in")
      ) {
        $("#mainNavigation")
          .find(".navbar-collapse")
          .removeClass("in");
      }
    }
  },
  brandPromo:function () {
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
    ReactDOM.render(<common.GenericPopUpComponent  popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true} alignMiddleDiv={true}/>,node);
    ReactDOM.render(<ManufacturerInfo.ManufacturerInfoComponent architect={true} node={node} contentDivId={contentDivId}/>,document.getElementById(contentDivId));
  },
  componentDidMount: function() {
    window.scrollTo(0, 0);
    if(this.props.location && this.props.location.query && this.props.location.query.utm_campaign && this.props.location.query.utm_campaign=="brandpromo"){
      $("#brandPromo").removeClass("hidden");
    }
    $(".navbar-toggle").click(function() {
      if ($(".navbar-toggle").height() > 0) {
        setTimeout(function() {
          var flag;
          if (
            $("#dynamicContentDiv")
              .attr("style")
              .indexOf("display: none") != -1
          ) {
            flag = false;
          } else {
            flag = true;
          }
          if (
            $("#mainNavigation").find(".navbar-collapse").length > 0 &&
            $("#mainNavigation")
              .find(".navbar-collapse")
              .hasClass("in") == false
          ) {
            //	nothing to return
          }
          if (!flag) {
            $("#dynamicContentDiv").show();
            $(".footer").show();
          } else {
            $("#dynamicContentDiv").hide();
            $(".footer").hide();
          }
        }, 0);
      }
    });
  },
  render: function() {
    var siteSpecificHidden = common.getSiteSpecific() ? "hidden" : "";
    var sideFiltersClassName = " col-lg-2 col-md-2 col-sm-3 col-xs-12 hidden ";
    var dynamicContentDivClassName =
      " col-lg-12 col-md-12 col-sm-12 col-xs-12 ";
    var rightContentDivClassName =
      " hidden col-lg-2 col-md-2 col-sm-12 col-xs-12 ";

    if (common.getSiteSpecific() || common.getShowOnlyMainContent()) {
      sideFiltersClassName = "hidden";
      dynamicContentDivClassName = "col-lg-12  col-md-12 col-sm-12 col-xs-12 ";
      rightContentDivClassName = "hidden";
    }

    return (
      <div>
        <div className={"navbar navbar-fixed-top " + siteSpecificHidden} role="navigation" style={{ height: "50px", minHeight: "33px", background: "#FFFFFF" }}>
          <div className="navbar-header col-lg-3 col-md-3 col-sm-4 col-xs-12">
            <button id="topNav" data-target=".navbar-collapse-1" data-toggle="collapse" className="navbar-toggle noMinWidth" type="button">
              <span className="sleekIcon-toggle" />
            </button>
            <div className="remove-margin-bottom  pull-left link" onClick={this.loadHome} title="Home">
              <img alt={common.getHandleBars().title + " logo"} src={"/branding/" + common.getHandleBars().logo} className="branding"/>
            </div>
          </div>
          <div className="search col-lg-9 col-md-9 col-sm-8 col-xs-12" id="search">
            <common.UserPhoto />
          </div>
        </div>

        <div className="" style={utility.getReactStyles(common.getHandleBars().navBarStyle)} id="mainContainer" >
          <div className="row row-offcanvas row-offcanvas-left" style={{ margin: "0px" }} >
            <div id="mainNavigation"
            	className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left no-padding-right "+common.getHandleBars().title +" " +siteSpecificHidden}
              	style={{ paddingBottom: "10px" }}>
              <genericNav.GenericTopNav />
            </div>
            <div className=" hidden">
              <ul className="navbar-collapse" id="summaryNav" />
            </div>
            <div className="row">
              <div
                className="col-xs-12 col-sm-12 col-lg-12 col-md-12 sidebar-offcanvas"
                style={{ minHeight: "0px" }}
                id="sidebar"
                role="navigation">
                <div className="row">
                  <div className="mobileSearch" id="mobileSearch">
                    <search.SearchComponent />
                  </div>
                </div>
              </div>
              <div id="landingPage" className="col-lg-12 col-md-12 col-xs-12 col-sm-12 mobile-no-padding hidden"/>
            </div>
            <div className="row remove-margin-left remove-margin-right">
              <div
                id="sideFilterNavigation"
                className={sideFiltersClassName}
                role="navigation"/>
              <div
                className={dynamicContentDivClassName}
                style={{ minHeight: "50vw" }}
                id="dynamicContentDiv">
                {this.props.children}
              </div>
              <div className={rightContentDivClassName} id="rightContentDiv" />
            </div>
          </div>
        </div>
         <button type="button" id="brandPromo" className="upload-btn pointer no-margin hidden" onClick={this.brandPromo} style={{"position":"fixed","top": "10vw","right": "0.5vw"}} >Request Info To Brand</button>
        <div
          className={"footer margin-top-gap-lg no-padding form-group bottomNavFooterMargin " +common.getHandleBars().title +" " +siteSpecificHidden}
          style={utility.getReactStyles(common.getHandleBars().footerStyle)}>
          <div className="" id="footer">
            <signUp.Footer />
          </div>
        </div>
      </div>
    );
  }
});
exports.App = App;

var routes = (
  <Route name="root" path="/" component={App}>
    <IndexRoute component={Landing} />
    <Route
      name="summary"
      path="s/:identifier/:schema"
      component={SummarizeAll}
    />
    <Route
      name="summary2"
      path="s/:identifier/:schema/"
      component={SummarizeAll}
    />
    <Route
      name="detail"
      path="d/:identifier/:identifier2/:recordId"
      component={Detail}
    />
    <Route
      name="detail2"
      path="d/:identifier/:identifier2/:recordId/"
      component={Detail}
    />
    <Route name="group" path="gv/:schema/:viewName/:text" component={Group} />
    <Route name="group2" path="gv/:schema/:viewName/:text/" component={Group} />
    <Route name="advSearch" path="advSrch/:org/:schema" component={AdvSearch} />
    <Route
      name="advSearch2"
      path="advSrch/:org/:schema/"
      component={AdvSearch}
    />
    <Route name="coe" path="coe/:org/:schema/" component={CreateOrEdit} />
    <Route name="coe2" path="coe/:org/:schema" component={CreateOrEdit} />
    <Route
      name="pageNotFound"
      path="views/pageNotFound"
      component={PageNotFound}
    />
    <Route
      name="pageNotFound2"
      path="views/pageNotFound/"
      component={PageNotFound}
    />
    <Route name="search" path="srch/:st" component={Search} />
    <Route name="search2" path="srch/:st/" component={Search} />
    <Route name="discover" path="discover/:st" component={Explore} />
    <Route name="discover2" path="discover/:st/" component={Explore} />
    <Route name="siteSpecific" path="siteSpecific/:slug" component={Slug} />
    <Route name="siteSpecific" path="siteSpecific/:slug/" component={Slug} />
    <Route
      name="allOrgs"
      path="admin/all-orgs"
      component={orgManager.GetAllOrgs}
    />
    <Route
      name="allOrgs"
      path="admin/messaging-reports"
      component={messagingReports.MessagingReports}
    />
    <Route
      name="createNewLayout"
      path="admin/create-new-layout"
      component={defineRecordLayout.SelectLayout}
    />
    <Route
      name="editNavigation"
      path="admin/edit-navigation"
      component={navManager.EditNavigation}
    />
    <Route
      name="editConfig"
      path="admin/edit-config"
      component={configManager.EditConfig}
    />
    <Route
      name="editHtmlMeta"
      path="admin/edit-html-meta"
      component={HTMLMetaManager.HTMLMeta}
    />
    <Route
      name="layoutCreate"
      path="admin/landing/create"
      component={defineLandingPageLayouts.CreateLanding}
    />
    <Route
      name="layoutEdit"
      path="admin/landing/edit"
      component={defineLandingPageLayouts.EditLanding}
    />
    <Route
      name="schemaCreate"
      path="admin/schema/create"
      component={manageSchema.CreateSchema}
    />
    <Route
      name="schemaEdit"
      path="admin/schema/edit"
      component={manageSchema.EditSchema}
    />
    <Route
      name="recordCreate"
      path="admin/record/create"
      component={manageRecords.CreateRecord}
    />
    <Route
      name="recordEdit"
      path="admin/record/edit"
      component={manageRecords.EditRecord}
    />
    <Route name="orgPage" path="org/:orgId" component={OrgPage} />
    <Route
      name="researchSpecific"
      path="research/specifications"
      component={researchSpec.SearchSpecs}
    />
    <Route
      name="activate"
      path="activate"
      component={setupAccount.ActivateAccount}
    />
    <Route
      name="resetpassword"
      path="resetpassword"
      component={signUp.SetForgotPassword}
    />
    <Route name="join" path="join" component={setupAccount.ActivateAccount} />
    <Route name="myprojects" path="myprojects" component={projects.DashBoard} />
    <Route name="myfirms" path="myfirms" component={projects.DashBoard} />
    <Route name="sitemapUploader" path="sitemapUploader" component={sitemapUploader.SiteMapUploader} />
    <Route name="requirementsUploader" path="requirementsUploader" component={RequirementsUpload.RequirementsUpload} />
    <Route name="mfrReports" path="mfrReports" component={MfrReports.MfrReports} />
    <Route name="manufacturerInfo" path="manufacturerInfo" component={ManufacturerInfo.ManufacturerInfo} />
    <Route
      name="templates"
      path="templates"
      component={defineLandingPageLayouts.Template}
    />
    <Route name="slug" path=":slug" component={Slug} />
    <Route name="slug2" path=":slug/" component={Slug} />
    <Route name="slugpath" path=":slug/:path" component={Slug} />
    <Route name="slugpath2" path=":slug/:path/" component={Slug} />
  </Route>
);
exports.routes = routes;

function routTheApp() {
  $("html,body").scrollTop(0);
  common.clearMainContent();
  //browserHistory //hashHistory
  ReactDOM.render(
    <Router routes={routes} history={require("react-router").browserHistory} />,
    document.getElementById("renderingDiv")
  );
}
exports.routTheApp = routTheApp;

if (typeof window != "undefined") {
  window.routTheApp = routTheApp;
}

function clearSideNav() {
  if (
    document
      .getElementById("mainNavigation")
      .className.indexOf("hideMainNav") != -1
  ) {
    document.getElementById(
      "mainNavigation"
    ).className = document
      .getElementById("mainNavigation")
      .className.replace("hideMainNav", "");
  }
  if (document.getElementById("summaryNav")) {
    document.getElementById("summaryNav").parentNode.className = "hidden";
  }
}
