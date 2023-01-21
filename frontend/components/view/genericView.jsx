/**
 *@author vikram & naveed
 */

var React = require("react");
var ReactDOM = require("react-dom");
var WebUtils = require("../../utils/WebAPIUtils.js");
var Link = require("react-router").Link;
var common = require("../common.jsx");
var chat = require("../Chat.jsx");
var manageRecords = require("../records/manageRecords.jsx");
var FilterResults = require("../nav/filters.jsx").FilterResults;
var FilterResultsNew = require("../nav/filters.jsx").FilterResultsNew;
var breadCrumbs = require("../nav/breadCrumbs.jsx");
var RecordSummaryStore = require("../../stores/RecordSummaryStore");
var RecordDetailStore = require("../../stores/RecordDetailStore");
var SchemaStore = require("../../stores/SchemaStore");
var JunctionStore = require("../../stores/JunctionStore");
var browserHistory = require("react-router").browserHistory;
var exportPPT = require("./components/exportPPT.jsx");
var ActionCreator = require("../../actions/ActionCreator.js");
var ServerActionReceiver = require("../../actions/ServerActionReceiver.js");

var search = require("../nav/search.jsx");
var advFilters = require("../nav/advFilters.jsx");

var socialShare = require("./components/socialShare.jsx");

var utility = require("../Utility.jsx");

var signUp = require("../auth/signUp.jsx");

var Carousel = require("./components/carousel.jsx");

var limitCount = require("../../utils/global.js").limitCount; //9;
var summaryLimitCount = require("../../utils/global.js").summaryLimitCount;
var carousel = [];
var linkGenerator = require("../nav/linkGenerator.jsx");
var groupBy = require("./components/groupBy.jsx");
var cardLayout = require("./components/cardLayout.jsx");
var junctionCount = require("./components/junctionCount.jsx");
var getContent = require("./components/getContent.jsx");
var editOrView = require("./components/EditOrView.jsx");
var banner = require("./components/banner.jsx");
var audit = require("./components/audit.jsx");
var compare = require("./components/compareView.jsx");
var changeId = require("./components/changeId.jsx");
var workflow = require("./components/workflow.jsx");
var defineRecordLayout = require("../admin/defineRecordLayout.jsx");
var metaUtility = require("../admin/metaUtility.jsx");
var JunctionCountStore = require("../../stores/JunctionCountStore.js");
var global = require("../../utils/global.js");
var Editor = require("../records/richTextEditor.jsx").MyEditor;

var genericNav = require("../nav/genericNav.jsx");
var showSideContent = require("../nav/genericNav.jsx").showSideContent;
var getCurrNav = require("../nav/genericNav.jsx").getCurrNav;
var RecordNav = require("../nav/genericNav.jsx").RecordNav;
/**
 * records
 * schema
 * rootSchema
 * dependentSchema
 * org
 * filters
 * showingForRelatedViewOfRecordId
 */
var SummarizeAll = React.createClass({
  getStateInfo: function(props,fromInnerView) {
    var skip = props.skip ? props.skip * 1 : 0;
    var limit = props.limit ? props.limit * 1 : summaryLimitCount;
    var records = require("../../stores/RecordSummaryStore").getSchemaRecords({
      schema: props.schema,
      filters: props.filters,
      dependentSchema: props.dependentSchema,
      org: props.org,
      userId: common.getUserDoc().recordId,
      skip: skip,
      limit: limit
    });
    var srs = records.length == 0 ? "awaiting" : "loadedPartially";
    var currentSchema = SchemaStore.get(props.schema);
    if (props.dependentSchema) {
      var dsRec = SchemaStore.get(props.schema + "-" + props.dependentSchema);
      if (dsRec) {
        currentSchema = combineSchemas(currentSchema, dsRec);
      }
    }
    return {
      shouldComponentUpdate: fromInnerView?true:false,
      advSearchEnabled: false,
      currentSchema: currentSchema,
      schema: props.schema,
      filters: props.filters,
      dependentSchema: props.dependentSchema,
      org: props.org,
      records: records,
      skip: skip,
      srs: srs,
      limit: limit,
      sortBy: props.sortBy ? props.sortBy : currentSchema["@defaultSortBy"],
      sortOrder: props.sortOrder
        ? props.sortOrder
        : currentSchema["@defaultSortOrder"],
      tabCheck: true,
      infiniteScrollProgress:props.infiniteScrollProgress
    };
  },
  getInitialState: function() {
    return this.getStateInfo(this.props);
  },
  enableAdvSearch: function() {
    this.setState({ advSearchEnabled: true });
  },
  componentWillReceiveProps: function(nextProps) {
    var self = this;
    this.setState(this.getStateInfo(nextProps), function() {
      self.loader();
      this.componentDidMount();
    });
  },
  callActionCreator: function() {
    ActionCreator.getSchemaRecords({
      schema: this.state.schema,
      filters: this.state.filters,
      dependentSchema: this.state.dependentSchema,
      org: this.state.org,
      userId: common.getUserDoc().recordId,
      skip: this.state.skip,
      limit: this.state.limit,
      sortBy: this.state.sortBy,
      sortOrder: this.state.sortOrder
    });
  },
  setSortBy: function(sortKey) {
    var self = this;
    var newProps = Object.assign({}, this.props);
    newProps.sortBy = sortKey;
    newProps.sortOrder =
      this.state.sortBy == sortKey && this.state.sortOrder != "descend"
        ? "descend"
        : "ascend";
    if (self.props.fromDetailView) {
      this.setState(this.getStateInfo(newProps,true), function() {
        self.callActionCreator();
      });
      return;
    }
    browserHistory.push(
      linkGenerator.getSummaryLink({
        org: this.props.org,
        schema: this.props.schema,
        dependentSchema: this.props.dependentSchema,
        filters: this.props.filters,
        skip: this.state.skip,
        limit: this.state.limit,
        sortBy: sortKey,
        sortOrder:
          this.props.sortBy == sortKey && this.props.sortOrder != "descend"
            ? "descend"
            : "ascend"
      })
    );
  },
  loader: function() {
  	if(this.state.infiniteScrollProgress){
    	common.stopLoader();
    	return;
    }
    var storeStatus = "";
    var currentSchema = this.state.currentSchema;
    var displayName = currentSchema.displayName
      ? currentSchema.displayName
      : "";
    //try{if(currentSchema["@operations"]["read"][getDefaultSummaryView(this.props.viewName,currentSchema)].UILayout.type=="summaryTable"){return;}}catch(err){}
    if (this.state.srs == "done") {
      if (this.state.records.length == 0) {
        storeStatus = "There are no " + displayName + ".";
        var addedOf = false;
        if (typeof this.props.filters == "object") {
          for (var key in this.props.filters) {
            if (
              key != "$status" &&
              key != "productType" &&
              this.props.filters[key].length > 0
            ) {
              try {
                if (
                  currentSchema["@properties"][key].dataType.type ==
                    "pickList" ||
                  currentSchema["@properties"][key].dataType.type ==
                    "multiPickList"
                ) {
                  if (!addedOf) {
                    storeStatus += "\n\t\tOf\n";
                    addedOf = true;
                  }
                  storeStatus +=
                    "\t\t" +
                    currentSchema["@properties"][key].displayName +
                    "  -  " +
                    this.props.filters[key].join(", ") +
                    "  \n";
                }
              } catch (err) {}
            }
          }
        }
        /** for org page
         *
         *
         */
        if (typeof this.props.hideDisplayName == "function") {
          this.props.hideDisplayName(this.props.schema);
        }

        //storeStatus+="\n\t\tPlease try other selections";
      }
      common.stopLoader();
    } else if (this.state.srs == "loadedPartially") {
      //storeStatus="Refreshing...!";
      storeStatus = "";
      common.startLoader();
    } else if (this.state.srs == "awaiting") {
      //storeStatus="Loading...!";
      storeStatus = "";
      common.startLoader();
    } else if (this.state.records.length > 0) {
      storeStatus = "";
      common.stopLoader();
    }
    this.srsInfo.innerHTML = storeStatus;
  },
  componentWillUnmount: function() {
    RecordSummaryStore.removeChangeListener(this._onChange, this.props.schema);
    //window.removeEventListener("scroll",this.handleScrollEvents);
  },
  _onChange: function() {
    var self = this;
    if(this.state.infiniteScrollProgress=="more" || this.state.infiniteScrollProgress=="prev"){
    	try{$("html, body,.lookUpDialogBox").animate({
    		scrollTop: $($(".SummarizeAll div[itemscope]")[Math.ceil($(".SummarizeAll div[itemscope]").length/2)]).offset().top - 60
    		}, 0);}catch(err){}
    }
    //if(this.isMounted()){
    this.setState({
      shouldComponentUpdate: true,
      infiniteScrollProgress:"done",
      srs: "done",
      records: RecordSummaryStore.getSchemaRecords({
        schema: this.props.schema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId,
        skip: this.state.skip,
        limit: this.state.limit * 1
      })
    });
    self.loader();
    //}
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
    /*var flag=(JSON.stringify(this.state.records)!= JSON.stringify(nextState.records)
		//|| this.state.srs!= nextState.srs
		|| this.state.advSearchEnabled!= nextState.advSearchEnabled);
		if(flag){}
  		return flag;*/
  },
  /*getRecords:function(){
		var self=this;
		WebUtils.getSchemaRecords({
			schema:this.props.schema,
			filters:this.props.filters,
			dependentSchema:this.props.dependentSchema,
			org:this.props.org,
			userId:common.getUserDoc().recordId,
			skip:this.state.skip,
			limit:this.props.limit*1},function(result){
			if(result.error){
				return;
			}
			self.setState({shouldComponentUpdate:true,records:result.records});
			//self.loader();
		});
	},*/
  componentDidMount: function() {
    var self = this;
    self.loader();
    this.callActionCreator();
    RecordSummaryStore.addChangeListener(this._onChange, this.props.schema);
    if (this.state.tabCheck) {
      this.tabData();
    }
    this.iAmFeelingLucky();

    try {
      if (typeof common.getUserDoc().recordId != "undefined") {
        require("../socket.io.js").createRoom(common.getUserDoc().recordId);
        require("../socket.io.js").socket.on(
          common.getUserDoc().recordId,
          function(data) {
            if (data.schema == this.props.schema) {
              setTimeout(function() {
                self.callActionCreator();
              }, 7000);
            }
          }.bind(this)
        );
      }
    } catch (err) {}
    //window.addEventListener("scroll",this.handleScrollEvents);
  },
  handleScrollEvents:function(){
	/*if(($(window).scrollTop() + $(window).height()) > ($(document).height()-$("#footer").parent().outerHeight())) {
  		if(this.state.records!=null && this.state.records.length > this.state.limit && !this.props.fromDetailView){
  			if(this.state.infiniteScrollProgress=="done"){
  				console.log(this.props.schema+(this.props.dependentSchema)+" LOADING MORE");
	  	 		//$(this.loadMoreButton).click();
	   			$(this.loadMoreButton).attr("disabled","disabled");
	   			this.loadMore();
	  	 	}
	  	}
	}*/
	/*if($(window).scrollTop()==0){
		if(this.state.skip>0 && !this.props.fromDetailView){
			if(this.state.infiniteScrollProgress=="done"){
				console.log(this.props.schema+(this.props.dependentSchema)+" PREVIOUS LOADING")
	    		//$(this.loadPrevButton).click();
	    		$(this.loadPrevButton).attr("disabled","disabled");
	    		this.loadPrev();
   			}
   		}
   	}*/
  },
  componentDidUpdate: function() {
    try {
      this.loader();
      this.iAmFeelingLucky();
    } catch (err) {}
  },
  tabData: function() {
    var self = this;
    if (
      self.props.tabData != undefined &&
      self.props.showTab != undefined &&
      self.state.records &&
      self.state.records.length > 0
    ) {
      self.setState({ tabCheck: false }, function() {
        self.props.showTab(self.props.tabData);
      });
    } else if (typeof this.props.tabData == "undefined") {
      self.setState({ tabCheck: false });
    }
  },
  iAmFeelingLucky: function() {
    var currentSchema = this.state.currentSchema;
    if (this.state.tabCheck) {
      this.tabData();
    }
    try {
      if (
        currentSchema["@operations"]["read"].getSummary.UILayout.IFeelLucky ==
        "yes"
      ) {
        if (this.state.records.length == 1) {
          //	common.clearMainContent(); common.clearLeftContent();
          browserHistory.push(
            linkGenerator.getDetailLink({
              record: this.state.records[0].value,
              org: this.props.org,
              schema: this.props.schema,
              recordId: this.state.records[0].id,
              dependentSchema: this.props.dependentSchema,
              filters: this.props.filters
            })
          );
        }
      }
    } catch (err) {}
  },
  pageSelected: function(pageNumber) {
    //trackThis("Paginate Schema",{org:this.props.org,schema:this.props.schema,type:"next"});
    var self = this;
    var newProps = Object.assign({}, this.props);
    newProps.skip = pageNumber * summaryLimitCount;
    if (self.props.fromDetailView) {
      this.setState(this.getStateInfo(newProps,true), function() {
        self.callActionCreator();
      });
      return;
    }
    // common.clearMainContent();common.clearLeftContent();
    browserHistory.push(
      linkGenerator.getSummaryLink({
        org: newProps.org,
        schema: newProps.schema,
        dependentSchema: newProps.dependentSchema,
        filters: newProps.filters,
        skip: newProps.skip,
        limit: self.state.limit
      })
    );
  },
  increaseSkipCount: function() {
    //trackThis("Paginate Schema",{org:this.props.org,schema:this.props.schema,type:"next"});
    var self = this;
    var newProps = Object.assign({}, this.props);
    newProps.skip = this.state.skip + this.state.limit;
    if (self.props.fromDetailView) {
      this.setState(this.getStateInfo(newProps,true), function() {
        self.callActionCreator();
      });
      return;
    }
    //common.clearMainContent();common.clearLeftContent();
    //location.hash=linkGenerator.getSummaryLink({org:newProps.org,schema:newProps.schema,dependentSchema:newProps.dependentSchema,filters:newProps.filters,skip:newProps.skip,limit:self.state.limit});
  },
  reduceSkipCount: function() {
    //trackThis("Paginate Schema",{org:this.props.org,schema:this.props.schema,type:"previous"});
    var self = this;
    if (this.state.skip != 0) {
      var newProps = Object.assign({}, this.props);
      newProps.skip =
        this.state.skip - this.state.limit > 0
          ? this.state.skip - this.state.limit
          : 0;
      if (self.props.fromDetailView) {
        this.setState(this.getStateInfo(newProps,true), function() {
          self.callActionCreator();
        });
        return;
      }
      //common.clearMainContent(); common.clearLeftContent();
      //location.hash=linkGenerator.getSummaryLink({org:newProps.org,schema:newProps.schema,dependentSchema:newProps.dependentSchema,filters:newProps.filters,skip:newProps.skip,limit:self.state.limit});
    }
  },
	loadMore:function(){
		console.log("Load More FC");
		var self=this;
		var limitCount=(this.props.limit)?this.props.limit*1:summaryLimitCount
		var newLimitCount=this.state.limit;
		var newSkip=this.state.skip;
		//currently viewing 18 records skip 0
		//next load more  36 skip 0
		//next load more 36 skip 18
		//next load more 36 skip 36
		if(newLimitCount>=limitCount*2){
			newSkip=this.state.skip+limitCount;
		}else{
			newLimitCount=this.state.limit+limitCount;
		}
		var newProps=Object.assign({},this.props);
		newProps.skip=newSkip;
		newProps.limit=newLimitCount;
		newProps.infiniteScrollProgress="more";
		this.setState(this.getStateInfo(newProps,true),function(){
			self.callActionCreator();
		}.bind(this));
	},
	loadPrev:function(){
		console.log("Load Previous FC");
		var self=this;
	    var limitCount=(this.props.limit)?this.props.limit*1:summaryLimitCount;
	    var newSkip=this.state.skip;
	    //reduce skip count on evey scroll up
	    if(newSkip>limitCount){
	    	newSkip=newSkip-limitCount;
	    }else{
	    	newSkip=0;
	    }
	    var newProps=Object.assign({},this.props);
		newProps.skip=newSkip;
		newProps.limit=this.state.limit;
		newProps.infiniteScrollProgress="prev";
		this.setState(this.getStateInfo(newProps,true),function(){
			self.callActionCreator();
		});
	},
  selectAllForMeta: function() {
    $("input[name='metaSelection']").attr("checked", true);
  },
  performMetaUpdation: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className =
      "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(
      <common.GenericPopUpComponent
        popUpId={popUpId}
        contentDivId={contentDivId}
        sideDivId={sideDivId}
      />,
      node
    );
    ReactDOM.render(
      <metaUtility.AddMeta popUpId={popUpId} />,
      document.getElementById(contentDivId)
    );
  },
  changeFilters: function(filters) {
    browserHistory.push(
      linkGenerator.getSummaryLink({
        org: this.props.org,
        schema: this.props.schema,
        dependentSchema: this.props.dependentSchema,
        filters: filters
      })
    );
  },
  render: function() {
    var self = this;
    var currentSchema = this.state.currentSchema;
    var displayName = currentSchema.displayName
      ? currentSchema.displayName
      : "";
    if (self.props.fromDetailView && !this.props.showHeading) {
      displayName = "";
    }

    var recordCount = 0;
    if (self.state.advSearchEnabled) {
      return (
        <advFilters.AdvFilter
          schema={currentSchema}
          org={self.props.org}
          rootSchema={this.props.schema}
        />
      );
    }
    var styleFromConfig = {};
    var styleFromConfigSubTitle = {};
    try {
      styleFromConfig = utility.getReactStyles(
        common.getConfigDetails().branding["title"].normal
      );
    } catch (err) {}
    try {
      styleFromConfigSubTitle = utility.getReactStyles(
        common.getConfigDetails().branding["text"].normal
      );
      styleFromConfigSubTitle["lineHeight"] = "3vw";
      styleFromConfigSubTitle["fontSize"] = "12px";
    } catch (err) {}

    var breadCrumb = "";
    if (
      !this.props.fromOrgStart &&
      !this.props.fromDetailView &&
      ((currentSchema["@showBreadCrumps"] &&
        currentSchema["@showBreadCrumps"] != "No") ||
        !currentSchema["@showBreadCrumps"])
    ) {
    	var genBreadCrumbs=breadCrumbs.getBreadCrumbs({
            schema: this.props.schema,
            dependentSchema: this.props.dependentSchema,
            org: this.props.org,
            noCurrent: true
          })
      breadCrumb = (
        <ul
          key={global.guid()}
          className="breadcrumb mobile-no-margin margin-top-gap-sm"
          itemScope="itemScope"
          itemType="http://schema.org/BreadcrumbList"
        >
          <li
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope="itemScope"
            itemType="http://schema.org/ListItem"
          >
            <Link itemProp="item" to="/">
              <span itemProp="name">Home</span>
            </Link>
            <meta itemProp="position" content={1} />
          </li>
          <span className="divider">/</span>
          {genBreadCrumbs.breadCrumbs}
          <li
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope="itemScope"
            itemType="http://schema.org/ListItem"
          >
            <Link
              itemProp="item"
              to={linkGenerator.getSummaryLink({
                org: this.props.org,
                schema: this.props.schema,
                dependentSchema: this.props.dependentSchema,
                filters: this.props.filters
              })}
            >
              <span itemProp="name">{displayName}</span>
            </Link>
             <meta itemProp="position" content={genBreadCrumbs.position} />
          </li>
          <span className="divider">/</span>
        </ul>
      );
    }
    var viewName = getDefaultSummaryView(self.props.viewName, currentSchema);
    var schemaRole = common.getSchemaRoleOnOrg(
      this.props.schema,
      this.props.org
    );
    var createLink;
    var createWorkFlow;
    if (
      schemaRole &&
      schemaRole.create &&
      schemaRole.create != "" &&
      !currentSchema.hideCreateLinkInSubNav
    ) {
      var coeData = {
        dependentSchema: this.props.dependentSchema,
        showCancel: true
      };
      createLink = linkGenerator.getCOELink({
        org: this.props.org,
        schema: this.props.schema,
        coeData: coeData
      });
      try {
        createWorkFlow = currentSchema["@operations"].create.workFlow;
      } catch (err) {}
    }
    var summaryTable = false;
    try {
      summaryTable =
        currentSchema["@operations"]["read"][viewName].UILayout.type ==
        "summaryTable";
    } catch (err) {}
    return (
      <div
        ref={input => {
          this.rooNode = input;
        }}
        className="row no-margin"
      >
        {!common.getSiteSpecific() ? breadCrumb : null}
        <div
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
          style={
            displayName && displayName.length > 0
              ? styleFromConfig
              : { display: "none" }
          }
        >
          {!this.props.fromDetailView || this.props.showHeading ? (
            <h1
              className="h1"
              style={{ paddingTop: "5px", paddingBottom: "15px" }}
            >
              {displayName}
            </h1>
          ) : (
            ""
          )}
        </div>
        {this.props.children}
        {!this.props.fromDetailView ? (
          <AppliedFilters
            changeFilters={self.changeFilters}
            filters={JSON.parse(JSON.stringify(self.props.filters))}
            properties={self.state.currentSchema["@properties"]}
            dependentKey={self.state.currentSchema["@dependentKey"]}
            rootSchema={self.props.schema}
            dependentSchema={self.props.dependentSchema}
            schemaDoc={self.state.currentSchema}
            recordId={self.props.recordId}
            org={self.props.org}
          />
        ) : (
          ""
        )}
        <div
          className={
            "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding noMinHeight"
          }
          style={
            displayName && displayName.length > 0
              ? styleFromConfigSubTitle
              : { display: "none" }
          }
          ref={d => {
            this.srsInfo = d;
          }}
        />

        {createLink &&
        this.state.records.length == 0 &&
        this.state.srs == "done" ? (
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
            <span style={styleFromConfigSubTitle}>
              Would you like to create new?
            </span>
            <div className="margin-top-gap-xs">
              {createWorkFlow ? (
                <div
                  className={"jRight buttonWidth noMinWidth"}
                  onClick={workflow.workFlow.bind(
                    null,
                    createWorkFlow,
                    undefined,
                    this.props.org
                  )}
                >
                  <div className="iconHeight">
                    <i className="icons8-plus newCustomIcon" />
                  </div>
                  <div
                    className="newCustomButton"
                    style={{ display: "block", fontSize: "9px" }}
                  >
                    Add New
                  </div>
                </div>
              ) : (
                <Link to={createLink}>
                  <div className={"jRight buttonWidth noMinWidth"}>
                    <div className="iconHeight">
                      <i className="icons8-plus newCustomIcon" />
                    </div>
                    <div
                      className="newCustomButton"
                      style={{ display: "block", fontSize: "9px" }}
                    >
                      Add New
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        ) : (
          ""
        )}

        {currentSchema["@advancedFilterKeys"] ? (
          <span onClick={this.enableAdvSearch} className="link" />
        ) : (
          <span />
        )}
        {summaryTable &&
        Array.isArray(this.state.records) &&
        this.state.records.length > 0 ? (
          <Table
            key={global.guid()}
            hideInlineEdit={self.props.hideInlineEdit}
            summary={true}
            viewName={viewName}
            dependentSchema={self.props.dependentSchema}
            rootSchema={self.props.schema}
            schemaDoc={currentSchema}
            records={self.state.records}
            setSortBy={self.setSortBy}
            sortStatus={{
              by: self.state.sortBy
                ? self.state.sortBy
                : self.state.currentSchema["@defaultSortBy"],
              order: self.state.sortOrder
                ? self.state.sortOrder
                : self.state.currentSchema["@defaultSortOrder"]
            }}
            showingForRelatedViewOfRecordId={
              self.props.showingForRelatedViewOfRecordId
            }
            org={self.props.org}
          />
        ) : (
          <span className="SummarizeAll">

          {(self.state.skip>0 && !self.props.fromDetailView)?
	 		<div className="text-center">
	 		{
	 				self.state.infiniteScrollProgress=="prev" ?
	 					<img key={global.guid()} className="innerLoader" src="/branding/schemaengineLoader.svg" />
	 				:
	 					<button className="loadPrev upload-btn pointer hidden" ref={(e)=>{this.loadPrevButton=e;}}  id="loadPrev" onClick={this.loadPrev}>Load Previous</button>
	 		}
	 		</div>:""}

            {this.state.records.map(function(data, index) {
              recordCount++;
              if (recordCount <= self.state.limit) {
                var summaryData = [];
                /*summaryData.push(<Link key={global.guid()} className="hhidden" to={linkGenerator.getDetailLink({record:data.value,org:self.props.org,schema:self.props.schema,dependentSchema:self.props.dependentSchema,recordId:data.id})}>
					    		          		                    {(currentSchema["@identifier"] && data.value[currentSchema["@identifier"]])?(data.value[currentSchema["@identifier"]]):("")}
					    		          		                   </Link>
					    		          		                    carousel={self.state.records})*/
                summaryData.push(
                  <GoIntoDetail
                    key={global.guid()}
                    summary={true}
                    filters={self.props.filters}
                    viewName={viewName}
                    showAdminInput={true}
                    dependentSchema={self.props.dependentSchema}
                    rootSchema={self.props.schema}
                    schemaDoc={currentSchema}
                    record={data}
                    recordId={data.id}
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId
                    }
                    org={self.props.org}
                  />
                );

                var layoutType = "";
                var layoutLine = "";
                try {
                  layoutLine =
                    currentSchema["@operations"]["read"][viewName].UILayout
                      .line;
                } catch (err) {}
                try {
                  layoutType =
                    currentSchema["@operations"]["read"][viewName].UILayout
                      .type;
                } catch (err) {}
                if (
                  layoutType != "" &&
                  recordCount < self.state.limit &&
                  ((layoutType == "generic" &&
                    index < self.state.records.length - 1) ||
                    (layoutType == "card" &&
                      index < self.state.records.length - 1) ||
                    (layoutLine != "" &&
                      layoutLine == "yes" &&
                      index < self.state.records.length - 1))
                ) {
                  return (
                    <div key={global.guid()}>
                      {summaryData}
                      <div
                        className={
                          "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
                        }
                      >
                        <div
                          className={
                            "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding line"
                          }
                        />
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={global.guid()} style={{ display: "inline" }}>
                      {summaryData}
                    </div>
                  );
                }
              } else {
                return <div className="hidden" key={global.guid()} />;
              }
            })}
          </span>
        )}


	 	{(self.state.records!=null && self.state.records.length > self.state.limit && !self.props.fromDetailView)?
	 		<div className="text-center margin-top-gap">
	 			{
	 				self.state.infiniteScrollProgress=="more" ?
	 					<img key={global.guid()} className="innerLoader" src="/branding/schemaengineLoader.svg" />
	 				:
	 					<button key={global.guid()} className="loadMore upload-btn pointer" ref={(e)=>{this.loadMoreButton=e;}} id="loadMore" onClick={this.loadMore}>Load More</button>
	 			}

	 		</div>:""}
        {/*
        			(common.isAdmin())?(<div className="form-group remove-margin-left remove-margin-right extra-padding-right ">
                    	<br/><br/><input type="submit" className="action-button form-group"	title={"Select All"}	value={"Select All"}	onClick={self.selectAllForMeta}/>
                    	<br/><input type="submit" className="action-button form-group"	title={"Add Keywords"}	value={"Add Keywords"}	onClick={self.performMetaUpdation}/>
                	</div>):("")
               	*/}
        <div
          className={
            "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding remove-margin-top " +
            (self.state.skip >= self.state.limit ||
            (self.state.records != null &&
              self.state.records.length > self.state.limit)
              ? "margin-bottom-gap"
              : "")
          }
        >
          <div className="pull-right">
            {self.state.skip >= self.state.limit ? (
              self.props.fromDetailView ? (
                <a className="unequalDivs vertical-align-middle">
                  <div
                    className="link parent-img-component extra-padding-right"
                    onClick={self.reduceSkipCount}
                  >
                    <div className="child-img-component no-padding">
                      <i className="sleekIcon-leftarrow fa-3x nextPrevIcons" />
                    </div>
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">PREVIOUS PAGE</span>
                    </div>
                  </div>
                </a>
              ) : (
                <Link
                  className="unequalDivs vertical-align-middle "
                  to={linkGenerator.getSummaryLink({
                    org: self.props.org,
                    schema: self.props.schema,
                    dependentSchema: self.props.dependentSchema,
                    filters: self.props.filters,
                    skip:
                      self.state.skip - self.state.limit > 0
                        ? self.state.skip - self.state.limit
                        : 0
                  })}
                >
                  <div className="link parent-img-component extra-padding-right">
                    <div className="child-img-component no-padding">
                      <i className="sleekIcon-leftarrow fa-3x nextPrevIcons" />
                    </div>
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">PREVIOUS PAGE</span>
                    </div>
                  </div>
                </Link>
              )
            ) : (
              <span />
            )}
            {self.state.records != null && (!self.state.infiniteScrollProgress || self.state.infiniteScrollProgress=="done") &&
            self.state.records.length > self.state.limit ? (
              <SummaryPagination
                key={global.guid()}
                summaryProps={self.props}
                limit={self.state.limit}
                summaryState={self.state}
                pageSelected={self.pageSelected}
              />
            ) : (
              ""
            )}
            {self.state.records != null &&
            self.state.records.length > self.state.limit ? (
              self.props.fromDetailView ? (
                <a className="unequalDivs vertical-align-middle">
                  <div
                    className="link parent-img-component"
                    onClick={self.increaseSkipCount}
                  >
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">NEXT PAGE</span>
                    </div>
                    <div className="child-img-component no-padding">
                      <i className="sleekIcon-rightarrow fa-3x nextPrevIcons " />
                    </div>
                  </div>
                </a>
              ) : (
                <Link
                  className="unequalDivs vertical-align-middle"
                  to={linkGenerator.getSummaryLink({
                    org: self.props.org,
                    schema: self.props.schema,
                    dependentSchema: self.props.dependentSchema,
                    filters: self.props.filters,
                    skip: (self.state.skip * 1 + self.state.limit) * 1
                  })}
                >
                  <div className="link parent-img-component">
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">NEXT PAGE</span>
                    </div>
                    <div className="child-img-component no-padding">
                      <i className="sleekIcon-rightarrow fa-3x nextPrevIcons " />
                    </div>
                  </div>
                </Link>
              )
            ) : (
              <span />
            )}
          </div>
        </div>

        <Editor
          content={currentSchema["@footerText"] ? currentSchema["@footerText"] : ""}
          mode="view"
        />

      </div>
    );
  }
});
exports.SummarizeAll = SummarizeAll;

/*
 * filters
 */
var AppliedFilters = React.createClass({
  changeFilters: function(filterKey, filterValue) {
    var filters = this.props.filters;
    if (filters[filterKey] && filters[filterKey].indexOf(filterValue) != -1) {
      delete filters[filterKey][filters[filterKey].indexOf(filterValue)];
      filters[filterKey] = filters[filterKey].filter(function(element) {
        return element != undefined;
      });
      compare.clearFilters(
        this.props.rootSchema +
          (this.props.dependentSchema ? this.props.dependentSchema : "")
      );
      this.callBackChange(filters);
    }
  },
  removeFilters: function(filterKey) {
    var filters = this.props.filters;
    delete filters[filterKey];
    this.callBackChange(filters);
  },
  callBackChange: function(filters) {
    if (typeof this.props.changeFilters == "function") {
      this.props.changeFilters(filters);
    }
  },
  clearAll: function(filters) {
    /*var newFilters=this.props.filters;
		Object.keys(filters).map(function(filter){
			if(newFilters[filter]){
				newFilters[filter]=[];
			}
		});*/
    var newFilters = {};
    for (var key in this.props.filters) {
      if (key == "$status" || key == this.props.dependentKey) {
        newFilters[key] = this.props.filters[key];
      }
    }
    compare.clearFilters(
      this.props.rootSchema +
        (this.props.dependentSchema ? this.props.dependentSchema : "")
    );
    this.callBackChange(newFilters);
  },
  render: function() {
    var self = this;
    var filters = {};
    var clearAllList = [];
    for (var key in this.props.filters) {
      if (key != "$status" && key != this.props.dependentKey && (this.props.schemaDoc && this.props.schemaDoc["@filterKeys"] && this.props.schemaDoc["@filterKeys"].indexOf(key)>-1)) {

        filters[key] = this.props.filters[key];
        clearAllList.push(key);
      }
    }
    //check filters whether they are empty or not
    var filtersExists=false;
    for(var i=0;i<clearAllList.length;i++){
      if(filters[clearAllList[i]].length>0){
        filtersExists=true;
        break;
      }
    }


    if (filtersExists) {
      return (
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  form-group">
          {Object.keys(filters).map(function(filter) {
            var currFilterDataType;
            var identifier;
            try {
              currFilterDataType =
                self.props.properties[filter]["dataType"]["type"];
            } catch (err) {}
            if (!currFilterDataType) {
              return null;
            }
            if (Array.isArray(filters[filter]) && filters[filter].length > 0) {
              if (
                currFilterDataType == "number" ||
                (currFilterDataType == "array" &&
                  self.props.properties[filter]["dataType"]["elements"].type ==
                    "number")
              ) {
                var units = "";
                try {
                  units = self.props.properties[filter]["dataType"]["units"];
                  if (!units) {
                    units = "";
                  }
                } catch (err) {}
                return (
                  <div
                    key={global.guid()}
                    className="child-img-component form-group"
                  >
                    <div
                      className="parent-img-component strike"
                      onClick={self.removeFilters.bind(null, filter)}
                    >
                      <div className="child-img-component no-padding">
                        {filters[filter][0] +
                          " " +
                          units +
                          " - " +
                          filters[filter][1] +
                          " " +
                          units}
                      </div>
                      <div
                        className="icons8-delete  child-img-component form-group no-padding-right"
                        style={{ fontSize: "12px", paddingLeft: "3px" }}
                      />
                    </div>
                  </div>
                );
              }
              return filters[filter].map(function(filterValue) {
                if (
                  self.props.properties[filter] &&
                  self.props.properties[filter]["dataType"]
                ) {
                  if (currFilterDataType == "object") {
                    identifier = SchemaStore.get(
                      self.props.properties[filter]["dataType"].objRef
                    )["@identifier"];
                    if (
                      self.props.properties[filter]["dataType"].refKeyObjRef
                    ) {
                      identifier = SchemaStore.get(
                        self.props.properties[filter]["dataType"].refKeyObjRef
                      )["@identifier"];
                    }
                    return (
                      <div
                        key={global.guid()}
                        className="display-inline-block extra-padding-right form-group"
                      >
                        <div
                          className="parent-img-component strike"
                          onClick={self.changeFilters.bind(
                            null,
                            filter,
                            filterValue
                          )}
                        >
                          <div className="child-img-component no-padding">
                            {self.props.properties[filter]["dataType"]
                              .refKeyType == "text" ? (
                              <span>{filterValue}</span>
                            ) : (
                              <common.UserIcon
                                filter={"filter"}
                                id={filterValue}
                                org={self.props.org}
                                identifier={identifier}
                                rootSchema={
                                  self.props.properties[filter]["dataType"]
                                    .refKeyObjRef
                                    ? self.props.properties[filter]["dataType"]
                                        .refKeyObjRef
                                    : self.props.properties[filter]["dataType"]
                                        .objRef
                                }
                              />
                            )}
                          </div>
                          <div
                            className="icons8-delete  child-img-component form-group no-padding"
                            style={{ fontSize: "12px", paddingLeft: "3px" }}
                          />
                        </div>
                      </div>
                    );
                  } else if (
                    currFilterDataType == "array" &&
                    self.props.properties[filter]["dataType"]["elements"]
                  ) {
                    identifier = "";
                    try {
                      identifier = SchemaStore.get(
                        self.props.properties[filter]["dataType"]["elements"]
                          .objRef
                      )["@identifier"];
                    } catch (err) {}
                    return (
                      <div
                        key={global.guid()}
                        className="display-inline-block extra-padding-right form-group"
                      >
                        <div
                          className="parent-img-component strike"
                          onClick={self.changeFilters.bind(
                            null,
                            filter,
                            filterValue
                          )}
                        >
                          <div className="child-img-component no-padding">
                            {self.props.properties[filter]["dataType"] &&
                            self.props.properties[filter]["dataType"][
                              "elements"
                            ] &&
                            self.props.properties[filter]["dataType"][
                              "elements"
                            ].type &&
                            self.props.properties[filter]["dataType"][
                              "elements"
                            ].type != "object" ? (
                              <span>{filterValue}</span>
                            ) : (
                              <common.UserIcon
                                filter={"filter"}
                                id={filterValue}
                                org={self.props.org}
                                identifier={identifier}
                                rootSchema={
                                  self.props.properties[filter]["dataType"][
                                    "elements"
                                  ].objRef
                                }
                              />
                            )}
                          </div>
                          <div
                            className="icons8-delete child-img-component form-group no-padding"
                            style={{ fontSize: "12px", paddingLeft: "3px" }}
                          />
                        </div>
                      </div>
                    );
                  } else if (currFilterDataType == "color") {
                    var temp = {};
                    temp[filter] = filterValue;
                    return (
                      <div
                        key={global.guid()}
                        className="display-inline-block extra-padding-right form-group"
                      >
                        <div
                          className="parent-img-component strike"
                          onClick={self.changeFilters.bind(
                            null,
                            filter,
                            filterValue
                          )}
                        >
                          <div className="child-img-component no-padding">
                            <getContent.GetContent
                              noDetail={true}
                              displayName={"no"}
                              noFormGroup={"yes"}
                              divType={
                                "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                              }
                              rootSchema={self.props.rootSchema}
                              schemaDoc={self.props.schemaDoc}
                              property={filter}
                              fullRecord={temp}
                              record={temp}
                              recordId={self.props.recordId}
                              org={self.props.org}
                            />
                          </div>
                          <div
                            className="icons8-delete child-img-component form-group no-padding-right"
                            style={{ fontSize: "12px", paddingLeft: "3px" }}
                          />
                        </div>
                      </div>
                    );
                  } else if (currFilterDataType == "boolean") {
                    return (
                      <div
                        key={global.guid()}
                        className="display-inline-block extra-padding-right form-group"
                      >
                        <div
                          className="parent-img-component strike"
                          onClick={self.changeFilters.bind(
                            null,
                            filter,
                            filterValue
                          )}
                        >
                          <div className="child-img-component no-padding">
                            {self.props.properties[filter].displayName}
                          </div>
                          <div
                            className="icons8-delete  child-img-component form-group no-padding-right"
                            style={{ fontSize: "12px", paddingLeft: "3px" }}
                          />
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={global.guid()}
                        className="display-inline-block extra-padding-right form-group"
                      >
                        <div
                          className="parent-img-component strike"
                          onClick={self.changeFilters.bind(
                            null,
                            filter,
                            filterValue
                          )}
                        >
                          <div className="child-img-component no-padding">
                            {filterValue}
                          </div>
                          <div
                            className="icons8-delete  child-img-component form-group no-padding-right"
                            style={{ fontSize: "12px", paddingLeft: "3px" }}
                          />
                        </div>
                      </div>
                    );
                  }
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              });
            } else {
              return <div key={global.guid()} className="hidden" />;
            }
          })}
          <div
            className="display-inline-block link"
            onClick={this.clearAll.bind(null, clearAllList)}
            style={{
              fontSize: "12px",
              color: "#808080",
              fontWeight: "normal",
              verticalAlign: "top"
            }}
          >
            Clear All
          </div>
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});
exports.AppliedFilters=AppliedFilters;

var SummaryPagination = React.createClass({
  getInitialState: function() {
    return { total: 0 };
  },
  pageSelected: function() {
    this.props.pageSelected(this.pageSelect.value * 1);
  },
  componentDidMount: function() {
    //	var dependentSchema=this.props.summaryState.dependentSchame;
    //if(dependentSchema=="Fabric" ){return;}//|| dependentSchema=="Carpet" || data.dependentSchema=="Wallpapers"){
    WebUtils.doPost(
      "/generic?operation=getSchemaRecords",
      {
        forCounts: true,
        schema: this.props.summaryState.schema,
        filters: this.props.summaryState.filters,
        dependentSchema: this.props.summaryState.dependentSchema,
        org: this.props.summaryState.org,
        userId: common.getUserDoc().recordId
      },
      function(result) {
        try {
          if (result.total) {
            if (!this._isUnmounted) this.setState({ total: result.total });
          }
        } catch (err) {}
      }.bind(this)
    );
  },
  scrollTop: function() {
    $("html,body").scrollTop(0);
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var self = this;
    var slc = this.props.limit ? this.props.limit : summaryLimitCount;
    return this.state.total > slc ? (
      <div className="link unequalDivs extra-padding-right vertical-align-top nextPrevIcons">
        <select
          className="form-control"
          ref={select => {
            this.pageSelect = select;
          }}
          onChange={self.pageSelected}
          defaultValue={Math.floor(
            self.props.summaryState.skip / summaryLimitCount
          )}
          key={global.guid()}
        >
          <option value={0}>1</option>
          {[1].map(function() {
            var options = [];
            for (var si = 1; si < self.state.total / slc; si++) {
              options.push(
                <option
                  key={global.guid()}
                  onClick={self.scrollTop}
                  value={si * 1}
                >
                  {si + 1}
                </option>
              );
            }
            return options;
          })}
        </select>
      </div>
    ) : (
      <span className="hidden" />
    );
  }
});
var EmbedSummary = React.createClass({
  getInitialState: function() {
    var currentSchema = SchemaStore.get(this.props.schema);
    if (this.props.dependentSchema) {
      var dsRec = SchemaStore.get(
        this.props.schema + "-" + this.props.dependentSchema
      );
      if (dsRec) {
        currentSchema = combineSchemas(currentSchema, dsRec);
      }
    }
    return {
      schemaDoc: currentSchema,
      filters: this.props.filters ? this.props.filters : {}
    };
  },
  loadRecordsWithFilters: function(filters) {
    if (JSON.stringify(this.state.filters) != JSON.stringify(filters))
      this.setState({ filters: filters });
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return (
      JSON.stringify(this.state.filters) != JSON.stringify(nextState.filters)
    );
  },
  render: function() {
    if (!this.props.showFilters) {
      return (
        <SummarizeAll
          fromDetailView="fromDetailView"
          showingForRelatedViewOfRecordId={
            this.props.showingForRelatedViewOfRecordId
          }
          schema={this.props.schema}
          filters={this.state.filters}
          showTab={this.props.showTab}
          tabData={this.props.tabData}
          dependentSchema={this.props.dependentSchema}
          org={this.props.org}
        />
      );
    } else {
      /*var FilterComponent="";
			if(this.state.schemaDoc){
				var schema= this.state.schemaDoc;
				if(schema["@filterKeys"]){

					FilterComponent=<FilterResults
											key={global.guid()}
											clickClose={this.props.clickClose}
											textRight={"textRight"}
											org={this.props.org}
											schema={schema}
											appliedFilters={this.state.filters}
											callback={this.loadRecordsWithFilters}/>
					FilterComponent=<FilterResultsNew
							key={global.guid()}
							clickClose={this.props.clickClose}
							textRight={"textRight"}
							dropDownClass={" "}
							org={this.props.org}
							schema={schema}
							appliedFilters={this.state.filters}
							callback={this.loadRecordsWithFilters}
			    			callbackToClosePopup={undefined}/>
				}
			}
				<div className="col-lg-3 col-md-3 col-sm-3 col-xs-12">
					<div className="title">FILTER BY</div>
					{FilterComponent}
			</div>*/
      return (
        <div className="row no-margin">
          <SummarizeAll
            fromDetailView="fromDetailView"
            showHeading={true}
            showingForRelatedViewOfRecordId={
              this.props.showingForRelatedViewOfRecordId
            }
            schema={this.props.schema}
            showTab={this.props.showTab}
            tabData={this.props.tabData}
            filters={this.state.filters}
            dependentSchema={this.props.dependentSchema}
            org={this.props.org}
          >
            <genericNav.SubList
              org={this.props.org}
              orgName={""}
              fromEmbedSummary={true}
              filters={JSON.parse(JSON.stringify(this.state.filters))}
              sublink={{
                target: {
                  schema: this.props.schema,
                  dependentSchema: this.props.dependentSchema
                }
              }}
              callback={this.loadRecordsWithFilters}
            />
          </SummarizeAll>
        </div>
      );
    }
  }
});

exports.EmbedSummary = EmbedSummary;

/**
 * schema
 * rootSchema
 * data
 * recordId
 * org
 * methods
 */
var GoIntoDetail = React.createClass({
  getStateFromProps: function(props, forceUpdate) {
    var record;
    if ((props.summary || props.gotRecord) && !this.props.refreshRecord) {
      record = props.record;
    } else {
      record = RecordDetailStore.getSchemaRecord({
        schema: props.rootSchema,
        recordId: props.recordId,
        userId: common.getUserDoc().recordId,
        org: props.org
      });
    }

    var schema;
    if (typeof this.props.schemaDoc == "object") {
      schema = this.props.schemaDoc;
    } else {
      schema = SchemaStore.get(this.props.rootSchema);
      var dsRec;
      if (this.props.dependentSchema) {
        dsRec = SchemaStore.get(
          this.props.rootSchema + "-" + this.props.dependentSchema
        );
        if (dsRec) {
          schema = combineSchemas(schema, dsRec);
        }
      } else {
        try {
          var dependentSchema =
            schema["@type"] == "abstractObject"
              ? record.value[schema["@dependentKey"]]
                ? record.value[schema["@dependentKey"]]
                : undefined
              : undefined;
          if (dependentSchema) {
            dsRec = SchemaStore.get(
              this.props.rootSchema + "-" + dependentSchema
            );
            if (dsRec) {
              schema = combineSchemas(schema, dsRec);
            }
          }
        } catch (err) {}
      }
    }

    return {
      shouldComponentUpdate: forceUpdate ? true : false,
      record: record,
      schema: schema
    };
  },
  getInitialState: function() {
    return this.getStateFromProps(this.props, false);
  },
  componentWillUnmount: function() {
    if (!this.props.summary || this.props.refreshRecord) {
      RecordDetailStore.removeChangeListener(
        this._onChange,
        this.props.recordId
      );
      try {
        require("../socket.io.js").leaveRoom(this.props.recordId);
      } catch (err) {}
    }
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(
      this.getStateFromProps(
        nextProps,
        this.props.recordId != nextProps.recordId ? true : false
      ),
      function() {
        this.componentDidMount();
      }
    );
  },
  updateRecord: function(record) {
    if (!record && typeof this.props.doNavUpdate == "function") {
      this.props.doNavUpdate(this.props.recordId);
    }
    this.setState({ shouldComponentUpdate: true, record: record });
  },
  _onChange: function() {
    //if(this.isMounted()){
    this.setState(this.getStateFromProps(this.props, true));
    //this.tabCheck();
    //}
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
    //return (JSON.stringify(this.state.record)!= JSON.stringify(nextState.record));
  },

  componentDidUpdate: function() {
    this.sideNavClick();
  },
  sideNavClick: function(value) {
    var sideNav = false;
    var self = this;
    if (self.state.schema && self.state.schema["@sideNav"]) {
      sideNav = true;
    }
    if (sideNav) {
      if (Object.keys(self.state.schema["@sideNav"]).length > 0) {
        common.stopLoader();
        if (value) {
          showSideContent(Object.keys(self.state.schema["@sideNav"])[0]);
        } else {
          if (getCurrNav() == "") {
            showSideContent(Object.keys(self.state.schema["@sideNav"])[0]);
          } else {
            showSideContent(getCurrNav());
          }
        }
      }
    }
  },
  componentDidMount: function() {
    if (!this.props.summary || this.props.refreshRecord) {
      if (!this.props.gotRecord || this.props.refreshRecord) {
        ActionCreator.getSchemaRecord({
          schema: this.props.rootSchema,
          dependentSchema: this.props.dependentSchema,
          recordId: this.props.recordId,
          userId: common.getUserDoc().recordId,
          org: this.props.org
        });
      }
      RecordDetailStore.addChangeListener(
        this._onChange,
        this.props.recordId
      ); /*}
		  			}
		  		}
		  	}catch(err){}
		  	if(hasLike){
	  			ActionCreator.getRelatedCount({recordId:this.props.recordId,relationName:"likedBy"});
	  		}
	  		{/*if(hasFollow){
				ActionCreator.getRelatedCount({recordId:this.props.recordId,relationName:"followedBy"});
			}}*/
      /*	var schema=this.state.schema;
			/*var hasLike=false;
		  	var hasFollow=false;
		  	try{
		  		for(var i=0;i<Object.keys(schema["@relations"]).length;i++){
		  			var relationKey=Object.keys(schema["@relations"])[i];
		  			if(schema["@relations"][relationKey] && schema["@relations"][relationKey].systemFunction){
		  				if(schema["@relations"][relationKey].relationRefSchema=="Like"){
		  					hasLike=true;
		  				}
		  				{/*if(schema["@relations"][relationKey].relationRefSchema=="Follow"){
		  					hasFollow=true;
		  				}*/ var self = this;
      var sideNav = false;
      if (self.state.schema && self.state.schema["@sideNav"]) {
        //code for showing only the first sideNav
        sideNav = true;
        $("#dynamicContentDiv .navElement").hide();
      }
      setTimeout(function() {
        self.tabCheck();
        if (sideNav) {
          self.sideNavClick("initial");
        }
      }, 2000);

      try {
        require("../socket.io.js").createRoom(this.props.recordId);
        require("../socket.io.js").socket.on(
          this.props.recordId,
          function(data) {
            ActionCreator.getSchemaRecord({
              schema: this.props.rootSchema,
              dependentSchema: this.props.dependentSchema,
              recordId: this.props.recordId,
              userId: common.getUserDoc().recordId,
              org: this.props.org
            });
          }.bind(this)
        );
      } catch (err) {}
    }
  },

  tabCheck: function() {
    try {
      var schema = this.state.schema;
      var self = this;
      var viewName =
        this.state.record && this.state.record.viewName
          ? this.state.record.viewName
          : undefined;
      if (!self.props.summary && (viewName == undefined || viewName == "")) {
        viewName =
          schema["@defaultViews"] &&
          schema["@defaultViews"]["detail"] &&
          schema["@defaultViews"]["detail"] != ""
            ? schema["@defaultViews"]["detail"]
            : viewName;
      }

      if (Array.isArray(schema["@operations"].read[viewName].UILayout))
        schema["@operations"].read[viewName].UILayout.map(function(
          layout,
          mindex
        ) {
          if (layout && layout.type == "tabs") {
            var tabIndex = -1;
            for (var i = Object.keys(layout.layout).length; i > -1; i--) {
              if (self[Object.keys(layout.layout)[i]]) {
                if (
                  self[Object.keys(layout.layout)[i]].className ==
                  "unequalDivs extra-padding-right-lg visibleTab"
                ) {
                  tabIndex = i;
                }
              }
            }
            var index1 = 0;
            for (var i = 0; i < Object.keys(layout.layout).length; i++) {
              if (
                tabIndex == i &&
                self[Object.keys(layout.layout)[i] + "tab"]
              ) {
                self[Object.keys(layout.layout)[i] + "tab"].className =
                  "tab-view";
                for (
                  index1 = 0;
                  index1 <
                    layout.layout[Object.keys(layout.layout)[i]].properties
                      .length &&
                  self[Object.keys(layout.layout)[i] + "" + index1];
                  index1++
                ) {
                  self[Object.keys(layout.layout)[i] + "" + index1].className =
                    "tabData";
                }
              } else {
                if (
                  self[Object.keys(layout.layout)[i]] &&
                  self[Object.keys(layout.layout)[i]].className ==
                    "unequalDivs extra-padding-right-lg visibleTab"
                ) {
                  self[Object.keys(layout.layout)[i] + "tab"].className = "";
                  for (
                    index1 = 0;
                    index1 <
                      layout.layout[Object.keys(layout.layout)[i]].properties
                        .length &&
                    self[Object.keys(layout.layout)[i] + "" + index1];
                    index1++
                  ) {
                    self[
                      Object.keys(layout.layout)[i] + "" + index1
                    ].className =
                      "hidden tabData";
                  }
                } else {
                  if (self[Object.keys(layout.layout)[i]]) {
                    if (
                      self[Object.keys(layout.layout)[i]].className &&
                      self[Object.keys(layout.layout)[i]].className.indexOf(
                        "visibleTab"
                      ) == -1
                    ) {
                      self[Object.keys(layout.layout)[i]].className = "hidden";
                      for (
                        index1 = 0;
                        index1 <
                          layout.layout[Object.keys(layout.layout)[i]]
                            .properties.length &&
                        self[Object.keys(layout.layout)[i] + "" + index1];
                        index1++
                      ) {
                        self[
                          Object.keys(layout.layout)[i] + "" + index1
                        ].className =
                          "hidden";
                      }
                    } else {
                      if (self[Object.keys(layout.layout)[i]].className) {
                        self[Object.keys(layout.layout)[i]].className =
                          "hidden";
                      }
                      for (
                        index1 = 0;
                        index1 <
                          layout.layout[Object.keys(layout.layout)[i]]
                            .properties.length &&
                        self[Object.keys(layout.layout)[i] + "" + index1];
                        index1++
                      ) {
                        self[
                          Object.keys(layout.layout)[i] + "" + index1
                        ].className =
                          "hidden";
                      }
                    }
                  }
                }
              }
            }
          }
          /* if($(self["navTab"+mindex]).find(".tab-view").length ==0){
            	  		     self["navTab"+mindex].className+=" hidden"
            	  		 } else{
            	  		   $(self["navTab"+mindex]).removeClass("hidden");
            	  		 }*/
        });
    } catch (err) {}
  },
  displayTab: function(value, check) {
    if (value.collapse) {
      if (
        document.getElementById(value.ref) &&
        document.getElementById(value.ref).className != undefined &&
        document.getElementById(value.ref).className.indexOf("hidden") != -1
      ) {
        document.getElementById(value.ref).className = document
          .getElementById(value.ref)
          .className.replace("hidden", "");
      }
    } else {
      if (this[value.tab] && this[value.tab].className != undefined) {
        this[value.tab].className =
          "unequalDivs extra-padding-right-lg visibleTab";
      }
      if (this[value.tab + value.index]) {
        this[value.tab + value.index].className = "row no-margin hidden";
      }
      if (this["line" + value.lIndex]) {
        this["line" + value.lIndex].className =
          "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding add-border-bottom-white-screen tabMobile";
      }
      if (this[value.tab + "displayTab"]) {
        this[value.tab + "displayTab"].className =
          "col-lg-12 col-md-12 col-sm-12 col-xs-12 uppercase no-padding tabMobileDisplayName";
      }
      if (this[value.tab + "h5"]) {
        this[value.tab + "h5"].className =
          "pointer no-margin extra-padding-bottom-pin ";
      }

      this.tabCheck();
    }
  },
  showTab: function(tab, layout) {
    var self = this;
    Object.keys(layout).forEach(function(key) {
      layout[key].properties.forEach(function(innerkey, index1) {
        if (key != tab.key) {
          self[key + index1].className = "hidden tabData";
          self[key + "tab"].className = "";
        } else {
          self[key + index1].className = "tabData";
          self[key + "tab"].className = "tab-view";
        }
      });
    });
  },
  getLayout: function(singleCol, fullLayout, tabData, fromGeneric) {
    var record = this.state.record
      ? Object.assign({}, this.state.record.value)
      : undefined;
    var schema = this.state.schema;
    var parentLayout = this.props.parentLayout
      ? this.props.parentLayout
      : undefined;
    try {
      parentLayout =
        schema["@operations"]["read"][this.getViewName()].UILayout.type;
    } catch (err) {}
    var displayName = this.props.displayName ? this.props.displayName : "yes";
    try {
    	var dpn=schema["@operations"]["read"][viewName].displayName;
      if ( dpn== "no") {
        displayName = "no";
      }
    } catch (err) {}
    return (
      <GenericLayout
        key={global.guid()}
        singleCol={singleCol}
        parentLayout={parentLayout}
        fullLayout={fullLayout}
        displayName={fullLayout.showDisplayNames == undefined ||fullLayout.showDisplayNames == ""? displayName: fullLayout.showDisplayNames}
        updateRecord={this.updateRecord}
        schemaDoc={schema}
        data={record}
        viewName={this.getViewName()}
        methods={this.state.record ? this.state.record.methods : []}
        relatedSchemas={this.state.record && this.state.record.relatedSchemas? this.state.record.relatedSchemas: []}
        header={this.getHeader()}
        tabData={tabData}
        showTab={fromGeneric ? this.showGenericTab : this.displayTab}

        hideInlineEdit={this.props.hideInlineEdit}
        iconClass={this.props.iconClass}
        iconClassTitle={this.props.iconClassTitle}
        summary={this.props.summary}
        fromPopUp={this.props.fromPopUp}
        contentDivId={this.props.contentDivId}
        saveRecordUpdate={this.props.saveRecordUpdate}
        noDetail={this.props.noDetail}
        from={this.props.from}
        fromTable={this.props.fromTable}
        rootSchema={this.props.rootSchema}
        dependentSchema={this.props.dependentSchema}
        recordId={this.props.recordId}
        noFormGroup={this.props.noFormGroup}
        org={this.props.org}
        showingForRelatedViewOfRecordId={this.props.showingForRelatedViewOfRecordId + this.props.recordId}
      />/*{...this.props}*/
    );
  },
  showGenericTab: function(value) {
    if (value.heading != undefined && value.index != undefined) {
      var temp = value.heading + value.index;
      if (document.getElementsByClassName(temp)[0].className) {
        document.getElementsByClassName(
          temp
        )[0].className = document
          .getElementsByClassName(temp)[0]
          .className.replace(/hidden/g, "");
      }
    }
  },

  getDetailUrl: function() {
    var schema = this.state.schema;
    var viewName = this.getViewName();
    var record = this.state.record
      ? Object.assign({}, this.state.record.value)
      : undefined;
    try {
      if (schema["@operations"]["read"][viewName].link) {
        var temp = getProxyLink(
          schema["@operations"]["read"][viewName],
          record
        );
        if (temp) return temp;
      }
    } catch (err) {}
    //	var record=this.state.record?Object.assign({},this.state.record.value):undefined;
    return linkGenerator.getDetailLink({
      record: record,
      org: this.props.org,
      schema: this.props.rootSchema,
      recordId: this.props.recordId,
      dependentSchema: this.props.dependentSchema,
      filters: this.props.filters
    });
  },
  getHeader: function() {
    var header = "";
    var record = this.state.record
      ? Object.assign({}, this.state.record.value)
      : undefined;
    var schema = this.state.schema;
    if (this.props.header != undefined) {
      header = this.props.header;
    } else if (record && schema["@identifier"]) {
      if (!this.props.summary) {
        try {
          //if(schema["@properties"][schema["@identifier"]].dataType.type!="object"){
          header = (
            <h1
              className="h1"
              style={{ paddingTop: "5px", paddingBottom: "8px" }}
              itemProp="name"
            >
              {global.makeHeader(record, schema.heading)}
            </h1>
          );
          //}
        } catch (err) {}
      } else if (!this.props.userIcon) {
        //
        try {
          //if(schema["@properties"][schema["@identifier"]].dataType.type!="object"){
          if (this.props.noDetail) {
            header = (
              <span itemProp="name">
                {global.makeHeader(record, schema.heading)}
              </span>
            );
          } else {
            header = (
              <span itemProp="name">
                <Link to={"" + this.getDetailUrl()}>
                  {global.makeHeader(record, schema.heading)}
                </Link>
              </span>
            );
          }
          //}
        } catch (err) {}
      }
    }

    return header;
  },
  getDetailLink: function() {
    var link = "";
    var linkClassName = "dlink";
    var record = this.state.record
      ? Object.assign({}, this.state.record.value)
      : undefined;
    var schema = this.state.schema;
    if (record && schema["@identifier"]) {
      if (
        (!record[schema["@identifier"]] ||
          schema["@identifier"] == "recordId" ||
          schema["@identifier"] == "") &&
        !schema["heading"] &&
        (!this.props.fromTable || this.props.fromTable != "yes")
      ) {
        linkClassName = "dlink";
      } else {
        linkClassName = "hhidden";
      }
    }
    if (this.props.summary) {
      link = (
        <Link to={this.getDetailUrl()} className={linkClassName}>
          {global.makeHeader(record, schema.heading) ? (
            <h3 className="link propertyName">
              {global.makeHeader(record, schema.heading)}
            </h3>
          ) : (
            <img
              src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_30,w_30/v1484565104/link.png"
              style={{ width: "20px", height: "20px" }}
              alt={"Link"}
              className="pointer"
            />
          )}
        </Link>
      );
    }
    return link;
  },
  getBreadCrump: function() {
    var breadCrumb = "";
    var record = this.state.record
      ? Object.assign({}, this.state.record.value)
      : undefined;
    var schema = this.state.schema;
    if (
      this.props.org == "public" &&
      !this.props.summary &&
      global.makeHeader(record, schema.heading) != "" &&
      !this.props.fromPopUp &&
      !this.props.noBreadCrumb &&
      ((schema["@showBreadCrumps"] && schema["@showBreadCrumps"] != "No") ||
        !schema["@showBreadCrumps"])
    ) {
    	var genBreadCrumbs=breadCrumbs.getBreadCrumbs({
            schema: this.props.rootSchema,
            dependentSchema: this.props.dependentSchema,
            org: this.props.org,
            noCurrent: true,
            landingPage:record["@uniqueUserName"]
         });
         if(!genBreadCrumbs.urlMatch){
         genBreadCrumbs.breadCrumbs.push(<li
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope="itemScope"
            itemType="http://schema.org/ListItem">
            <Link
              itemProp="item"
              to={linkGenerator.defaultSummaryLink({
                schema: this.props.rootSchema,
                dependentSchema: this.props.dependentSchema
              })}>
              <span itemProp="name">
                {schema["@displayName"] || schema.displayName}
              </span>
            </Link>
            <meta itemProp="position" content={genBreadCrumbs.position} />
          </li>);
           genBreadCrumbs.breadCrumbs.push(<span className="divider">/</span>);
           genBreadCrumbs.breadCrumbs.push(<li
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope="itemScope"
            itemType="http://schema.org/ListItem">
            <Link itemProp="item" to={this.getDetailUrl}>
              <span itemProp="name">
                {global.makeHeader(record, schema.heading)}
              </span>
            </Link>
            <meta itemProp="position" content={genBreadCrumbs.position+1} />
          </li>);
          genBreadCrumbs.breadCrumbs.push(<span className="divider">/</span>);
          }
      breadCrumb = (
        <ul
          key={global.guid()}
          className="breadcrumb mobile-no-margin margin-top-gap-sm"
          itemScope="itemScope"
          itemType="http://schema.org/BreadcrumbList">
          <li
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope="itemScope"
            itemType="http://schema.org/ListItem">
            <Link itemProp="item" to="/">
              <span itemProp="name">Home</span>
            </Link>
            <meta itemProp="position" content={1} />
          </li>
          <span className="divider">/</span>
          {genBreadCrumbs.breadCrumbs}
          
        </ul>
      );
    }
    return breadCrumb;
  },
  getRecordNav: function() {
    //	var self=this;
    var nav = "";
    if (this.props.recordNav) {
      var schema = this.state.schema;
      //	var filters=this.state.filters;
      var backName = schema["@displayName"]
        ? schema["@displayName"]
        : schema["@id"] + "s";
      backName = backName.toUpperCase();
      nav = (
        <RecordNav
          backName={backName}
          viewName={this.getViewName()}
          schemaDoc={schema}
          sideNav={schema["@sideNav"]}
          recordNav={schema["@recordNav"]}
          rootSchema={this.props.rootSchema}
          dependentSchema={this.props.dependentSchema}
          filters={this.props.filters}
          recordId={this.props.recordId}
          org={this.props.org}
        />
      );
    }
    return nav;
  },
  getViewName: function() {
    var viewName = "";
    var schema = this.state.schema;
    viewName = getDefaultSummaryView(
      this.state.record ? this.state.record.viewName : undefined,
      schema,
      this.props.fromRelation
    );
    if (!this.props.summary && (viewName == undefined || viewName == "")) {
      viewName =
        schema["@defaultViews"] &&
        schema["@defaultViews"]["detail"] &&
        schema["@defaultViews"]["detail"] != ""
          ? schema["@defaultViews"]["detail"]
          : viewName;
    }
    if (this.props.summary || this.props.viewName) {
      try {
        if (schema["@operations"]["read"][this.props.viewName]) {
          viewName = this.props.viewName;
        }
      } catch (err) {}
    }

    return viewName;
  },
  prev: function(id) {
    var totalItems = $("#" + id + " .item");
    for (var i = 0; i < totalItems.length; i++) {
      if (totalItems[i].className.indexOf("active") != -1) {
        this.hideAndShowArrows(i - 1, totalItems.length);
      }
    }
  },

  hideAndShowArrows: function(i, totalLength) {
    if (i + 1 == totalLength) {
      this.rightArrow.className += " hidden";
    } else {
      this.rightArrow.className = this.rightArrow.className.replace(
        /hidden/g,
        ""
      );
    }
    if (i == 0) {
      this.leftArrow.className += " hidden";
    } else {
      this.leftArrow.className = this.leftArrow.className.replace(
        /hidden/g,
        ""
      );
    }
  },
  next: function(id) {
    var totalItems = $("#" + id + " .item");
    for (var i = 0; i < totalItems.length; i++) {
      if (totalItems[i].className.indexOf("active") != -1) {
        this.hideAndShowArrows(i + 1, totalItems.length);
      }
    }
  },
  toggleClose:function(id){
    setTimeout(function(){
      if($("#collapse"+id) && $("#collapse"+id).children()[0]){
        if($($("#collapse"+id).children()[0]).hasClass("collapsed")){
          try{
              $($($("#collapse"+id).children()[0]).find(".collapseLayout ")).attr('title', 'Expand');
          }catch(err){}
        }else{
          try{
              $($($("#collapse"+id).children()[0]).find(".collapseLayout ")).attr('title', 'Close');
          }catch(err){}
        }
      }
    },100)
  },
  render: function() {
    var self = this;
    var schema = this.state.schema;
    var record = self.state.record
      ? Object.assign({}, self.state.record.value)
      : undefined;
    if (typeof record == "undefined" || typeof schema == "undefined") {
      return <div key={global.guid()}>{this.getDetailLink}</div>;
    }
    var viewName = this.getViewName();
    var header = this.getHeader();
    var className = "row no-margin";
    if (self.props.junctionGallery && self.props.junctionGallery == "yes") {
      className = "";
    }
    if (self.props.summary) {
      try {
        var userIcon = this.props.userIcon ? " no-padding" : "";
        if (self.props.parentLayout != "gallery") {
          // && self.props.parentLayout!="table"
          var cols = defineRecordLayout.calculateCols(
            schema["@operations"]["read"][viewName].UILayout.columnNo
          );
          var bottomClass =
            schema["@operations"]["read"][viewName].UILayout &&
            schema["@operations"]["read"][viewName].UILayout.bottomClass
              ? schema["@operations"]["read"][viewName].UILayout.bottomClass
              : "margin-bottom-gap-sm";
          className =
            cols +
            " unequalDivs no-padding-left " +
            (cols.indexOf("col-lg-12 col-md-12") == -1 ? bottomClass : "") +
            userIcon +
            (typeof self.props.fromExplore != "undefined" ? "form-group" : "");
        }
        if (this.props.userIcon) {
          className = "display-inline-block";
        }
      } catch (err) {}
    }
    var layouts = [];
    try {
      if (schema["@operations"].read[viewName].UILayout) {
        if (!Array.isArray(schema["@operations"].read[viewName].UILayout)) {
          layouts = [schema["@operations"].read[viewName].UILayout];
        } else {
          layouts = schema["@operations"].read[viewName].UILayout;
        }
      } else {
        layouts = [
          {
            type: "generic",
            layout: schema["@operations"].read[viewName].out
              ? schema["@operations"].read[viewName].out
              : Object.keys(schema["@properties"])
          }
        ];
      }
    } catch (err) {}
    //var bottomHeader=JSON.stringify(layouts).indexOf("gallery")>-1?true:false;
    /*var noHeader=JSON.stringify(layouts).indexOf("card")>-1?true:false;
		noHeader=true;*/
    var breadCrumb = this.getBreadCrump();

    var recordNav = this.getRecordNav();
    /*	var orgData={};
		try{
			orgData = {
					"orgName" : self.props.record.value ? self.props.record.value.name : self.props.record.name,
					"orgLocation" : "",
					"orgImage" : self.props.record.value ? self.props.record.value.profileImage ? "https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1623462816/"+self.props.record.value.profileImage[0].cloudinaryId+".jpg"  : (self.props.record.profileImage ? "https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1623462816/"+self.props.record.profileImage[0].cloudinaryId+".jpg" :"") : ""
			};
		}catch(err){}*/

    return (
      <div
        key={global.guid()}
        ref={input => {
          this.rooNode = input;
        }}
        className={className}
        itemScope="itemscope"
        itemType={schema["@itemType"] ? schema["@itemType"] : ""}
        onClick={this.props.parentView ? this.props.parentView : ""}
      >
        {!common.getSiteSpecific() ? breadCrumb : null}

        {/*(!noHeader&&!bottomHeader)?header:""*/}
        {recordNav}
        {typeof this.props.parentView != "function" ? this.getDetailLink() : ""}
        {["a"].map(function(temp) {
          if (
            self.props.junctionGallery &&
            self.props.junctionGallery == "yes"
          ) {
            return (
              <JunctionGallery
                key={global.guid()}
                schemaDoc={schema}
                data={record}
                methods={methods}
                relatedSchemas={relatedSchemas}
                fromTable={self.props.fromTable}
                rootSchema={self.props.rootSchema}
                dependentSchema={self.props.dependentSchema}
                recordId={self.props.recordId}
                org={self.props.org}
                showingForRelatedViewOfRecordId={
                  self.props.showingForRelatedViewOfRecordId
                }
                height={self.props.height}
              />
            );
          } else if (layouts.length > 0) {
            return layouts.map(function(block, lIndex) {
              if (block.type) {
                var divType = undefined;
                var line = undefined;
                var fromGeneric = undefined;
                var tabData = undefined;
                var layout = undefined;
                if (block.type == "banner") {
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "navElement  " +
                        (block.navElement ? block.navElement : " ")
                      }
                    >
                      <banner.BannerComponent
                        fullLayout={block}
                        schemaDoc={schema}
                        header={header}
                        record={record}
                        org={self.props.org}
                        rootSchema={self.props.rootSchema}
                        dependentSchema={self.props.dependentSchema}
                        recordId={self.props.recordId}
                      />
                    </div>
                  );
                } else if (block.type == "card") {
                  return (
                    <div
                      key={global.guid()}
                      className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                      itemScope="itemscope"
                      itemType={schema["@itemType"] ? schema["@itemType"] : ""}
                    >
                      <cardLayout.CardLayout
                        fullLayout={block}
                        schemaDoc={schema}
                        record={record}
                        header={header}
                        filters={self.props.filters}
                        showingForRelatedViewOfRecordId={
                          self.props.showingForRelatedViewOfRecordId
                        }
                        from={self.props.from}
                        fromPopUp={self.props.fromPopUp}
                        contentDivId={self.props.contentDivId}
                        noDetail={self.props.noDetail}
                        fromRelation={self.props.fromRelation}
                        dependentSchema={self.props.dependentSchema}
                        rootSchema={self.props.rootSchema}
                        recordId={self.props.recordId}
                        org={self.props.org}
                      />
                    </div>
                  );
                } else if (block.type == "columns") {
                  var divCount = 12 / block.layout.length;
                  divType =
                    "col-lg-" +
                    divCount +
                    " col-md-" +
                    divCount +
                    " col-sm-" +
                    divCount +
                    " col-xs-12 no-padding-left";
                  line = block.lineRequired ? "line" : "";

                  if (block.lineStyle) {
                    line = block.lineStyle;
                  }
                  fromGeneric = false;
                  if (line.length > 0) {
                    fromGeneric = true;
                    (tabData = {
                      heading: block.type,
                      index: lIndex + self.props.recordId
                    }),
                      (line +=
                        " hidden " +
                        block.type +
                        "" +
                        lIndex +
                        self.props.recordId);
                  }
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  navElement  " +
                        (block.navElement ? block.navElement : " ") +
                        " " +
                        line
                      }
                    >
                      {block.heading && block.heading != "" ? (
                        <div
                          style={
                            block.headingCss
                              ? getContent.getStyleFromConfig(block.headingCss)
                                  .normal
                              : {}
                          }
                        >
                          {block.heading}
                        </div>
                      ) : (
                        ""
                      )}
                      {block.layout.map(function(singleCol, index) {
                        if (!Array.isArray(singleCol)) {
                          singleCol = [singleCol];
                        }
                        return (
                          <div
                            className={
                              divType +
                              (index + 1 == block.layout.length
                                ? " no-padding"
                                : "")
                            }
                            key={global.guid()}
                          >
                            {singleCol.map(function(element) {
                              return self.getLayout(
                                element,
                                block,
                                tabData,
                                fromGeneric
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                } else if (
                  block.type == "table" ||
                  block.type == "sideByside"
                ) {
                  divType =
                    "child-img-component " +
                    (block.childClass ? block.childClass : "");
                  var parentImg =
                    "parent-img-component " +
                    (block.parentClass ? block.parentClass : "");
                  var colDivs = "";
                  if (block.colDivs && block.colDivs.length > 0) {
                    colDivs = block.colDivs;
                    parentImg = "";
                  }
                  line = block.lineRequired ? "line" : "";
                  if (block.lineStyle) {
                    line = block.lineStyle;
                  }
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "row  no-margin navElement  " +
                        parentImg +
                        " " +
                        (block.navElement ? block.navElement : " ") +
                        " " +
                        line
                      }
                    >
                      {block.heading && block.heading != "" ? (
                        <div
                          style={
                            block.headingCss
                              ? getContent.getStyleFromConfig(block.headingCss)
                                  .normal
                              : {}
                          }
                        >
                          {block.heading}
                        </div>
                      ) : (
                        ""
                      )}
                      {block.layout.map(function(singleCol, index) {
                        if (!Array.isArray(singleCol)) {
                          singleCol = [singleCol];
                        }
                        if (Array.isArray(colDivs)) {
                          divType =
                            "col-lg-" +
                            colDivs[index] +
                            " col-md-" +
                            colDivs[index] +
                            " col-sm-" +
                            colDivs[index] +
                            " col-xs-12 no-padding-left";
                        }
                        return (
                          <div className={divType} key={global.guid()}>
                            {singleCol.map(function(sck) {
                              //if(self.props.singleKey && self.props.singleKey != undefined){
                              return self.getLayout(sck, block);
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                } else if (block.type == "tabs") {
                  var tabs = [];
                  layout = block.layout;
                  Object.keys(layout).forEach(function(key) {
                    tabs.push({
                      value: layout[key].displayName
                        ? layout[key].displayName
                        : key,
                      key: key
                    });
                  });
                  //var divLength=12/(tabs.length);
                  //var tabCol="col-lg-"+divLength+" col-md-"+(divLength < 4 ?"4": divLength)+" col-sm-"+Math.round(((3/2)*divLength))+" col-xs-12 no-padding";
                  return (
                    <div
                      key={global.guid()}
                      ref={div => {
                        self["navTab" + lIndex] = div;
                      }}
                      className={
                        "tabs navElement margin-top-gap " +
                        (block.navElement ? block.navElement : " ") +
                        " " +
                        (block.lineRequired ? "line" : "")
                      }
                    >
                      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap">
                        <div
                          className="add-border-bottom-white-screen hideTabData hidden"
                          ref={h => {
                            self["line" + lIndex] = h;
                          }}
                        >
                          {tabs.map(function(tab, index) {
                            return (
                              <div
                                className={"unequalDivs extra-padding-right-lg"}
                                id={tab.key}
                                ref={h5 => {
                                  self[tab.key] = h5;
                                }}
                                key={global.guid()}
                              >
                                <div
                                  onClick={self.showTab.bind(null, tab, layout)}
                                  id={tab.key + "h5"}
                                  ref={h => {
                                    self[tab.key + "h5"] = h;
                                  }}
                                  className="pointer no-margin extra-padding-bottom-pin tabsHeading"
                                >
                                  <span
                                    ref={h => {
                                      self[tab.key + "tab"] = h;
                                    }}
                                    id={tab.key + "tab"}
                                  >
                                    {tab.value.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="row no-margin">
                          {Object.keys(layout).map(function(tab, sIndex) {
                            if (layout[tab].properties) {
                              return (
                                <div key={global.guid()}>
                                  <div
                                    className="hidden"
                                    ref={h => {
                                      self[tab + "displayTab"] = h;
                                    }}
                                  >
                                    <span className="remove-margin-bottom propertyName">
                                      {tabs[sIndex].value.toUpperCase()}
                                    </span>
                                  </div>
                                  {layout[tab].properties.map(function(
                                    element,
                                    index
                                  ) {
                                    return (
                                      <div
                                        ref={div => {self[tab + index] = div;}} id={tab + index} key={global.guid()} className="row no-margin">
                                        {self.getLayout(element, layout[tab], {tab: tab,index: index,lIndex: lIndex})}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  );
                } else if (
                  block.type == "generic" ||
                  block.type == "gallery" ||
                  block.type == "summaryTable"
                ) {
                  line = block.lineRequired ? "line" : "";
                  if (block.lineStyle) {
                    line = block.lineStyle;
                  }
                  fromGeneric = false;
                  //     tabData=undefined;
                  if (line.length > 0) {
                    fromGeneric = true;
                    (tabData = {
                      heading: block.type,
                      index: lIndex + self.props.recordId
                    }),
                      (line +=
                        " hidden " +
                        block.type +
                        "" +
                        lIndex +
                        self.props.recordId);
                  }
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "navElement   " +
                        (block.navElement ? block.navElement : " ") +
                        " " +
                        line
                      }
                    >
                      {block.heading && block.heading != "" ? (
                        <div
                          style={
                            block.headingCss
                              ? getContent.getStyleFromConfig(block.headingCss)
                                  .normal
                              : {}
                          }
                        >
                          {block.heading}
                        </div>
                      ) : (
                        ""
                      )}
                      {block.layout.map(function(singleCol) {
                        if (
                          typeof self.props.showingForRelatedViewOf ==
                            "undefined" ||
                          self.props.showingForRelatedViewOf != singleCol
                        ) {
                          //return self.getLayout(singleCol,block);
                          return self.getLayout(
                            singleCol,
                            block,
                            tabData,
                            fromGeneric
                          );
                        } else {
                          return <div key={global.guid()} className="hidden" />;
                        }
                      })}
                    </div>
                  );
                } else if (block.type == "userDefinedCols") {
                  var colLen = block.colLen;
                  layout = block.layout;
                  line = block.lineRequired ? "line" : "";
                  if (block.lineStyle) {
                    line = block.lineStyle;
                  }
                  fromGeneric = false;
                  //     tabData=undefined;
                  if (line.length > 0) {
                    fromGeneric = true;
                    (tabData = {
                      heading: block.type,
                      index: lIndex + self.props.recordId
                    }),
                      (line +=
                        " hidden " +
                        block.type +
                        "" +
                        lIndex +
                        self.props.recordId);
                  }
                  if (colLen.length == layout.length) {
                    return (
                      <div
                        key={global.guid()}
                        className={
                          "navElement col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding " +
                          (block.navElement ? block.navElement : " ") +
                          " " +
                          line
                        }
                      >
                        {block.heading && block.heading != "" ? (
                          <div
                            style={
                              block.headingCss
                                ? getContent.getStyleFromConfig(
                                    block.headingCss
                                  ).normal
                                : {}
                            }
                          >
                            {block.heading}
                          </div>
                        ) : (
                          ""
                        )}
                        {colLen.map(function(col, index) {
                          var colDiv = defineRecordLayout.calculateCols(col);
                          return (
                            <div
                              key={global.guid()}
                              className={colDiv + " no-padding-left"}
                            >
                              {layout[index].map(function(singleCol) {
                                if (
                                  typeof self.props.showingForRelatedViewOf ==
                                    "undefined" ||
                                  self.props.showingForRelatedViewOf !=
                                    singleCol
                                ) {
                                  //return self.getLayout(singleCol,block);
                                  return self.getLayout(
                                    singleCol,
                                    block,
                                    tabData,
                                    fromGeneric
                                  );
                                } else {
                                  return (
                                    <div
                                      key={global.guid()}
                                      className="hidden"
                                    />
                                  );
                                }
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                } else if (block.type == "sideBysideCarousel") {
                  var myCarouselId = global.guid();
                  var width = common.calWidth();
                  var visibleCount = width.visibleCount;
                  var colSize = width.colSize;
                  line = block.lineRequired ? "line" : "";
                  if (block.lineStyle) {
                    line = block.lineStyle;
                  }
                  var count = 0;
                  var items = [];
                  block.layout.forEach(function(singleCol, index) {
                    var epdata = {
                      property: singleCol,
                      rootSchema: self.props.rootSchema,
                      org: self.props.org,
                      schemaDoc: self.state.schema,
                      fullRecord: self.state.record
                        ? Object.assign({}, self.state.record.value)
                        : undefined,
                      recordId: self.props.recordId
                    };
                    var ep = editOrView.getEditPrivileges(epdata);
                    if (
                      ep.canEdit ||
                      (record[singleCol] &&
                        ((typeof record[singleCol] == "object" &&
                          Object.keys(record[singleCol]).length > 0) ||
                          record[singleCol].length > 0) &&
                        (self.state.schema &&
                          self.state.schema["@properties"] &&
                          Object.keys(self.state.schema["@properties"]).length >
                            0 &&
                          Object.keys(self.state.schema["@properties"]).indexOf(
                            singleCol
                          ) != -1))
                    ) {
                      count = count + 1;
                      items.push(
                        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                          {self.getLayout(singleCol, block)}
                        </div>
                      );
                    }
                  });
                  var carouselItems = [];
                  var temp = [];
                  var i = 0;
                  if (items.length < visibleCount) {
                    carouselItems.push(items);
                  } else {
                    for (i = 0; i < items.length; i++) {
                      temp.push(items[i]);
                      if (i != 0 && (i + 1) % visibleCount == 0) {
                        carouselItems.push(temp);
                        temp = [];
                      }
                    }
                    if (i + (1 % visibleCount) != 0 && temp.length > 0) {
                      carouselItems.push(temp);
                    }
                  }
                  if (items.length > 0) {
                    return (
                      <div
                        key={global.guid()}
                        className={
                          "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding navElement  " +
                          (block.navElement ? block.navElement : " ") +
                          " " +
                          line
                        }
                      >
                        {block.heading && block.heading != "" ? (
                          <div
                            style={
                              block.headingCss
                                ? getContent.getStyleFromConfig(
                                    block.headingCss
                                  ).normal
                                : {}
                            }
                          >
                            {block.heading}
                          </div>
                        ) : (
                          ""
                        )}
                        <div
                          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                          style={{ minHeight: "9vw" }}
                        >
                          <div
                            id={myCarouselId}
                            className="carousel slide margin-bottom-gap-xs sideBysideCarousel"
                            data-interval="false"
                            data-ride="carousel"
                          >
                            <div
                              className="carousel-inner carouselGallery"
                              style={{ zIndex: "11" }}
                            >
                              {carouselItems.map(function(carouselItem, index) {
                                var firstSlide = index == 0 ? "active" : "";
                                return (
                                  <div
                                    key={global.guid()}
                                    className={"item " + firstSlide}
                                  >
                                    {carouselItem.map(function(item, index1) {
                                      return (
                                        <div
                                          key={global.guid()}
                                          ref={div => {
                                            self[
                                              "sideBysideCarousel" + (count - 1)
                                            ] = div;
                                          }}
                                          className={
                                            "col-md-" +
                                            colSize +
                                            " col-sm-" +
                                            colSize +
                                            " col-xs-" +
                                            colSize
                                          }
                                        >
                                          {item}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                            <a
                              className="left carousel-control link hidden"
                              style={{ width: "auto" }}
                              title="Previous"
                              ref={d => {
                                self["leftArrow"] = d;
                              }}
                              href={"#" + myCarouselId}
                              onClick={self.prev.bind(null, myCarouselId)}
                              role="button"
                              data-slide="prev"
                            >
                              <i className="sleekIcon-leftarrow fa-2x link " />
                              <span className="sr-only">Previous</span>
                            </a>
                            <a
                              className={
                                "right carousel-control link " +
                                (carouselItems.length > 1 ? "" : "hidden")
                              }
                              title="Next"
                              href={"#" + myCarouselId}
                              style={{ width: "auto" }}
                              ref={d => {
                                self["rightArrow"] = d;
                              }}
                              onClick={self.next.bind(null, myCarouselId)}
                              role="button"
                              data-slide="next"
                            >
                              <i className="sleekIcon-rightarrow fa-2x link " />
                              <span className="sr-only">Next</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return <div className="hidden" />;
                  }
                } else if (block.type == "collapsible") {
                  line = block.lineRequired ? "line" : "";
                  if (block.lineStyle) {
                    line = block.lineStyle;
                  }
                  var id = global.guid();
                  return (
                    <div
                      key={global.guid()}
                      id={"collapse" + id}
                      className={
                        "hidden navElement  col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding " +
                        (block.navElement ? block.navElement : " ") +
                        " " +
                        line
                      }
                    >
                      <div
                        className={
                          "col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-bottom-gap link " +
                          (block.collapsed ? "" : "collapsed")
                        }
                        data-toggle="collapse"
                        data-target={"#" + id}
                        aria-expanded="true"
                        onClick={self.toggleClose.bind(null,id)}>
                        <div className="parent-img-component col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
                          <div
                            style={
                              block.headingCss
                                ? getContent.getStyleFromConfig(
                                    block.headingCss
                                  ).normal
                                : {}
                            }
                            className="child-img-component"
                          >
                            {block.heading}
                          </div>
                          <div className="pull-right child-img-component no-padding" >
                            <span className="collapseLayout icons8-plus-math fa-2x" title={(block.collapsed ?"Close":"Expand")} />
                          </div>
                        </div>
                      </div>
                      <div
                        className={
                          "col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding collapse " +
                          (block.collapsed ? "in " + block.collapsed : "")
                        }
                        id={id}
                      >
                        {block.layout.map(function(singleCol, index) {
                          var condition =
                            typeof self.props.showingForRelatedViewOf ==
                              "undefined" ||
                            self.props.showingForRelatedViewOf != singleCol
                              ? true
                              : false;
                          return (
                            <div
                              key={global.guid()}
                              className={
                                "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding " +
                                (index != block.layout.length - 1 && condition
                                  ? "form-group"
                                  : "")
                              }
                            >
                              {["a"].map(function(temp) {
                                if (condition) {
                                  return self.getLayout(singleCol, block, {
                                    ref: "collapse" + id,
                                    index: index,
                                    collapse: true
                                  });
                                } else {
                                  return (
                                    <div
                                      key={global.guid()}
                                      className="hidden"
                                    />
                                  );
                                }
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              }
            });
          } else {
            var layoutG = { layout: Object.keys(schema["@properties"]) };
            return (
              <div key={global.guid()} className={"navElement"}>
                {layoutG.layout.map(function(singleCol) {
                  if (
                    typeof self.props.showingForRelatedViewOf == "undefined" ||
                    self.props.showingForRelatedViewOf != singleCol
                  ) {
                    return self.getLayout(singleCol, layoutG);
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                })}
              </div>
            );
          }
        })}
        {/*(!noHeader && bottomHeader && header &&  header!="")?<div className="margin-bottom-gap-lg row remove-margin-left remove-margin-right">{header}</div>:""*/}
        {/*(common.isAdmin() && this.props.showAdminInput)?(<span><input type="checkbox" value={this.props.recordId} name="metaSelection"/><span>Select</span></span>):("")*/}
      </div>
    );
  }
});

exports.GoIntoDetail = GoIntoDetail;

var CreateVariant = React.createClass({
  getInitialState: function() {
    return common.getSchemaRoleOnOrg(this.props.schema, this.props.org);
  },
  create: function() {
    var record = {};
    if (Array.isArray(this.props.variantFields)) {
      for (var index in this.props.variantFields) {
        record[this.props.variantFields[index]] = this.props.record[
          this.props.variantFields[index]
        ];
      }
    }
    var self = this;
    if (this.props.noGroup) {
      self.continueCreation(record);
    } else {
      WebUtils.doPost(
        "/generic?operation=createOrGetGroupID",
        { recordId: this.props.recordId },
        function(data) {
          if (data.error) {
            return;
          }
          record["groupID"] = data.groupID;
          self.continueCreation(record);
        }
      );
    }
  },
  continueCreation: function(record) {
    var self = this;
    var coeData = {
      knownData: record
    };
    browserHistory.push(
      linkGenerator.getCOELink({
        org: self.props.org,
        schema: self.props.schema,
        coeData: coeData
      })
    );
    return;
    /*
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
       	ReactDOM.render(<manageRecords.DisplayCustomSchema
						    			schemaName = {self.props.schema}
						    			knownData={record}
						    			org={self.props.org}
						    			callbackToClosePopup={
						    				function(newRec){
						    					common.showMainContainer();node.remove();
						    				}
						    			}
						    			/>,document.getElementById(contentDivId));*/
  },
  render: function() {
    //titlebkp={this.props.iconClassTitle?this.props.iconClassTitle:"CREATE VARIANT"}
    return this.state.create ? (
      this.props.iconClass ? (
        <div
          key={global.guid()}
          className={
            "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
            this.props.styleClass
          }
        >
          <div className="buttonWidth" onClick={this.create}>
            <div className="iconHeight">
              <i className={this.props.iconClass + " newCustomIcon"} />
            </div>
            <div className="newCustomButton">
              {this.props.displayName
                ? this.props.displayName
                : "CREATE VARIANT"}
            </div>
          </div>
        </div>
      ) : (
        <div className="extra-padding-right form-group ">
          <button type="submit" className="upload-btn" onClick={this.create}>
            {this.props.displayName ? this.props.displayName : "CREATE VARIANT"}
          </button>
        </div>
      )
    ) : (
      <div />
    );
  }
});

function toDataURL(images, count, slide, callback, outputFormat) {
  if (count < images.length) {
    var img = new Image();
    var src =
      "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/" +
      images[count].cloudinaryId +
      ".jpg";
    img.crossOrigin = "Anonymous";
    img.onload = function() {
      var canvas = document.createElement("CANVAS");
      var ctx = canvas.getContext("2d");
      var dataURL;
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      ctx.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL(outputFormat);
      slide.addImage({
        data: dataURL,
        x: 0.5 + count * 3.5,
        y: "50%",
        w: "30%",
        h: "35%"
      });
      toDataURL(images, count + 1, slide, callback, outputFormat);
    };
    img.src = src;
    if (img.complete || img.complete === undefined) {
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      img.src = src;
    }
  } else {
    callback("save");
  }
}

/*
 *
 *
schema
rootSchema
dependentSchema
relatedSchemas
data
recordId
org
methods
*
*
* */

var GenericLayout = React.createClass({
  getInitialState: function() {
    var schema;
    if (this.props.schemaDoc) {
      schema = this.props.schemaDoc;
    } else {
      schema = SchemaStore.get(this.props.rootSchema);
      if (this.props.dependentSchema) {
        var dsRec = SchemaStore.get(
          this.props.rootSchema + "-" + this.props.dependentSchema
        );
        if (dsRec) {
          schema = combineSchemas(schema, dsRec);
        }
      }
    }
    return { schema: schema };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  editRecord: function(recordId, method) {
    if (this["disable_edit"]) {
      this["disable_edit"].className = +"  disabled";
      this["disable_edit"].disabled = "disabled";
    }
    $("html,body").scrollTop(0);
    common.startLoader();
    readOnlyFields = [];
    var rootSchema = this.props.rootSchema;
    var org = this.props.org;
    //if(tracking is enabled on this method in schema)
    //trackThis("Edit record",{org:org,schema:rootSchema,recordId:recordId,method:method});
    if (typeof document != "undefined") {
      if (this.props.fromPopUp) {
        var popUpId = this.props.fromPopUp;
        var contentDivId = this.props.contentDivId;
        try {
          ReactDOM.unmountComponentAtNode(
            document.getElementById(contentDivId)
          );
        } catch (err) {}
        ReactDOM.render(
          <manageRecords.DisplayCustomSchema
            fromPopUp={popUpId}
            contentDivId={contentDivId}
            schemaName={rootSchema}
            recordId={recordId}
            renderTarget={this.props.target}
            editMethod={method}
            saveRecordUpdate={this.props.saveRecordUpdate}
            org={org}
          />,
          document.getElementById(contentDivId)
        );
      } else {
        var coeData = {
          recordId: recordId,
          editMethod: method,
          showCancel: true
        };
        browserHistory.push(
          linkGenerator.getCOELink({
            org: org,
            schema: rootSchema,
            coeData: coeData
          })
        );
        common.stopLoader();
      }
    }
    common.stopLoader();
  },
  performUpdation: function(recordId, method, key, value) {
    if (this.props.fromTable == "table") {
      common.showMainContainer();
      $(".lookUpDialogBox").remove();
    }
    var self = this;
    var schemaRec = this.state.schema;
    if (
      schemaRec &&
      schemaRec["@operations"] &&
      schemaRec["@operations"].actions &&
      schemaRec["@operations"].actions[method] &&
      schemaRec["@operations"].actions[method].auth
    ) {
      if (typeof common.getUserDoc().recordId == "undefined") {
        if (method == "claim" && window.location.search.indexOf("utm") > -1) {
          window.claiming = true;
        }

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

        return;
      }
    }
    var confirmMessage = undefined;
    try {
      if (
        schemaRec &&
        schemaRec["@operations"] &&
        schemaRec["@operations"].actions &&
        schemaRec["@operations"].actions[method] &&
        schemaRec["@operations"].actions[method].confirmMessage
      ) {
        confirmMessage =
          schemaRec["@operations"].actions[method].confirmMessage;
      }
    } catch (err) {}
    try {
      if (
        schemaRec &&
        schemaRec["@operations"] &&
        schemaRec["@operations"].delete &&
        schemaRec["@operations"].delete[method] &&
        schemaRec["@operations"].delete[method].confirmMessage
      ) {
        confirmMessage = schemaRec["@operations"].delete[method].confirmMessage;
      }
    } catch (err) {}

    try {
      this["disable_button"].className += "  disabled";
      this["disable_button"].disabled = "disabled";
    } catch (err) {
      console.log("no disable button");
    }
    $("html,body").scrollTop(0);
    if (confirmMessage) {
      common.createConfirm("Confirm", confirmMessage, function(confirm) {
        if (confirm) {
          continueUpdation();
        }
      });
    } else {
      continueUpdation();
    }
    function continueUpdation() {
      common.startLoader();
      WebUtils.doPost(
        "/generic?operation=updateRecord",
        {
          userId: common.getUserDoc().recordId,
          recordId: recordId,
          org: self.props.org,
          method: method,
          value: value
        },
        function(data) {
          if (
            data.error &&
            (data.error == "method not allowed" || data.error == "No Changes")
          ) {
            common.stopLoader();
            return;
          }
          try {
            if (method == "HardDelete") {
              if (
                common.getUserOrgs().indexOf(recordId) > -1 ||
                self.props.rootSchema == "UserRole"
              ) {
                common.reloadSession(function(res) {
                  //browserHistory.push("/");
                });
              }
            }
          } catch (err) {
            console.log(err);
          }
          if (data.recRes != undefined) {
            data.recRes.schema = self.props.rootSchema;
            data.recRes.recordId = self.props.recordId;
            data.recRes.dependentSchema = self.props.dependentSchema;
            data.recRes.userId = common.getUserDoc().recordId;
            data.recRes.org = self.props.org ? self.props.org : "public";
            ServerActionReceiver.receiveSchemaRecord(data.recRes);
          }
          common.stopLoader();
          var messageToDisplay = "";
          if (schemaRec && schemaRec["@operations"]) {
            if (
              schemaRec["@operations"].actions &&
              schemaRec["@operations"].actions[method] &&
              schemaRec["@operations"].actions[method].message
            ) {
              messageToDisplay =
                schemaRec["@operations"].actions[method].message;
            }
            if (
              schemaRec["@operations"].update &&
              schemaRec["@operations"].update[method] &&
              schemaRec["@operations"].update[method].message
            ) {
              messageToDisplay =
                schemaRec["@operations"].update[method].message;
            }
            if (
              schemaRec["@operations"].delete &&
              schemaRec["@operations"].delete[method] &&
              schemaRec["@operations"].delete[method].message
            ) {
              messageToDisplay =
                schemaRec["@operations"].delete[method].message;
            }
          }
          if (data != "method not allowed") {
            if (
              messageToDisplay != "" &&
              messageToDisplay.successMessage &&
              messageToDisplay.successMessage != ""
            ) {
              alert(messageToDisplay.successMessage);
            }
            if (data.error) {
              console.log(data.error);
            } else {
              ActionCreator.updateRecord(recordId, method);
            }
          } else {
            if (
              messageToDisplay != "" &&
              messageToDisplay.failureMessage &&
              messageToDisplay.filureMessage != ""
            ) {
              alert(messageToDisplay.failureMessage);
            }
          }
          var target = {};
          target.schemaId = self.props.rootSchema;
          target.recordId = recordId;
          target.userId = common.getUserDoc().recordId;
          target.org = self.props.org;
          target.dsId = self.props.dependentSchema;
          if (
            schemaRec &&
            typeof schemaRec["@operations"] != "undefined" &&
            typeof schemaRec["@operations"].actions != "undefined" &&
            typeof schemaRec["@operations"].actions[method] != "undefined"
          ) {
            target.method = "detailView";
          } else if (
            schemaRec &&
            typeof schemaRec["@operations"].delete != "undefined" &&
            typeof schemaRec["@operations"].delete[method] != "undefined"
          ) {
            if (method == "HardDelete") {
              if (typeof self.props.updateRecord == "function") {
                self.props.updateRecord(undefined);
              }
              if (typeof self.props.updateRecordWithMethod == "function") {
                self.props.updateRecordWithMethod();
              }

              target.method = "home";
            } else {
              target.method = "detailView";
            }
          }
          if (typeof data.success == "object") {
            if (typeof data.success.targetContext == "string")
              target.method = data.success.targetContext;
            if (typeof data.success.recordId == "string")
              target.recordId = data.success.recordId;
            if (typeof data.success.schema == "string")
              target.schemaId = data.success.schema;
            if (typeof data.success.dependentSchema == "string")
              target.dsId = data.success.dependentSchema;
          }

          if (target.method == "redirect") {
            location.href = data.response.url + "?" + $.param(data);
            return;
          } else if (target.method == "home") {
            self.forceUpdate();
            if (
              self.props.fromTable &&
              document.getElementById(self.props.popUpId)
            ) {
              //ReactDOM.unmountComponentAtNode(document.getElementById(self.props.popUpId));
            }
            return;
          }
          common.stopLoader();
          if (target.recordId == self.props.recordId) {
            if (
              typeof self.props.updateRecord == "function" ||
              typeof self.props.updateRecordWithMethod == "function"
            ) {
              if (typeof self.props.updateRecord == "function") {
                self.props.updateRecord(
                  RecordDetailStore.getSchemaRecord({
                    schema: target.schemaId,
                    recordId: target.recordId,
                    userId: common.getUserDoc().recordId,
                    org: target.org
                  })
                );
              }
              if (typeof self.props.updateRecordWithMethod == "function") {
                self.props.updateRecordWithMethod();
              }
              return;
            }
          }
          if (
            self.props.fromPopUp &&
            document.getElementById(self.props.contentDivId)
          ) {
            //ReactDOM.unmountComponentAtNode(document.getElementById(self.props.fromPopUp));
            JunctionStore.clearJunctionsForRecord(target.recordId);
            ReactDOM.render(
              <GoIntoDetail
                rootSchema={target.schemaId}
                dependentSchema={target.dsId}
                recordId={target.recordId}
                fromPopUp={self.props.fromPopUp}
                contentDivId={self.props.contentDivId}
                org={target.org}
              />,
              document.getElementById(self.props.contentDivId)
            );
          } else if (target.method == "summary") {
            browserHistory.push(
              linkGenerator.getSummaryLink({
                org: target.org,
                schema: target.schemaId,
                dependentSchema: self.props.dependentSchema,
                filters: self.props.filters
              })
            );
          } else {
            browserHistory.push(
              linkGenerator.getDetailLink({
                record: self.props.data,
                org: target.org,
                schema: target.schemaId,
                recordId: target.recordId,
                dependentSchema: target.dsId
              })
            );
          }
        }
      );
    }
  },

  componentDidMount: function() {
    var self = this;
    var schema = this.state.schema;
    var singleCol = this.props.singleCol;
    /*	var hasLike=false;
  		var hasFollow=false;*/
    /*for (var i = 0; i < $("[data-onmouseover]").length; i++) {
      $($("[data-onmouseover]")[i]).attr(
        "onmouseover",
        $($("[data-onmouseover]")[i]).attr("data-onmouseover")
      );
    }
    for (var i = 0; i < $("[data-onmouseout]").length; i++) {
      $($("[data-onmouseout]")[i]).attr(
        "onmouseout",
        $($("[data-onmouseout]")[i]).attr("data-onmouseout")
      );
    }
    for (var i = 0; i < $("[data-onclick]").length; i++) {
      $($("[data-onclick]")[i]).attr(
        "onclick",
        $($("[data-onclick]")[i]).attr("data-onclick")
      );
    }*/
    /*try{
  			for(var i=0;i<Object.keys(schema["@relations"]).length;i++){
  				var relationKey=Object.keys(schema["@relations"])[i];
  				if(schema["@relations"][relationKey] && schema["@relations"][relationKey].systemFunction){
  					if(schema["@relations"][relationKey].relationRefSchema=="Like"){
  						hasLike=true;
  					}
  					{/*if(schema["@relations"][relationKey].relationRefSchema=="Follow"){
  						hasFollow=true;
  					}}
  				}
  			}
  		}catch(err){}
  		try{
	  	 if(typeof common.getUserDoc().recordId!="undefined" && hasLike &&
	  	 	this.like_button.props.className=="fa fa-thumbs-o-up"){

		  	 WebUtils.doPost("/generic?operation=checkRelated",{"recordId":common.getUserDoc().recordId,"relatedRecordId":this.props.recordId,"relationName":"isLiking"},function(data){
				if(data.result=="related"){
					self.setState({like:"Liked"});
					if(self.like_button && self.like_button)
					self.like_button.className="fa fa-thumbs-up name";
				}
			});

	  	 }
	  	}catch(err){}
	  	{/*try{
	  	 if(typeof common.getUserDoc().recordId!="undefined" &&
	  	 		hasFollow && this.follow_button.props.className=="fa fa-rss"){
	  	  	WebUtils.doPost("/generic?operation=checkRelated",{"recordId":common.getUserDoc().recordId,"relatedRecordId":this.props.recordId,"relationName":"isFollowing"},function(data){
				if(data.result=="related"){
					self.setState({follow:"Following"});
					if(self.follow_button && self.follow_button)
					self.follow_button.className="fa fa-rss name";
				}
			});
	  	 }
     }catch(err){}*/

    if (
      self.props.tabData != undefined &&
      self.props.showTab != undefined &&
      typeof singleCol != "object"
    ) {
      //Vikram updated this to show temporarity  tabs
      /*if(singleCol.indexOf("^")==0 || singleCol.indexOf("#")==0  || singleCol.indexOf("&")==0 || singleCol.indexOf("@")==0 ){
				self.props.showTab(self.props.tabData);
			}*/

      if (singleCol.indexOf("^") == 0) {
        singleCol = singleCol.replace("^", "");
        if (Array.isArray(self.props.relatedSchemas)) {
          self.props.relatedSchemas.forEach(function(relatedSchema) {
            try {
              if (
                schema["@relations"][singleCol].relationRefSchema ==
                  relatedSchema &&
                getMethodExecutePrivilegeOnorgSchema(
                  self.props.org,
                  schema,
                  self.props.data,
                  singleCol
                )
              ) {
                self.props.showTab(self.props.tabData);
              }
            } catch (err) {}
          });
        }
      } else if (singleCol.indexOf("#") == 0) {
        singleCol = singleCol.replace("#", "");
        if (self.props.methods == "all") {
          self.props.showTab(self.props.tabData);
        } else {
          if (Array.isArray(self.props.methods)) {
            self.props.methods.map(function(method) {
              if (method == singleCol) {
                self.props.showTab(self.props.tabData);
              }
            });
          }
        }
      } else if (singleCol.indexOf("&") == 0) {
        //self.props.showTab(self.props.tabData);
        singleCol = singleCol.replace("&", "");
        try {
          if (
            Object.keys(schema["@showRelated"][singleCol]).indexOf(
              "viewQuery"
            ) != -1 &&
            schema["@showRelated"][singleCol].viewQuery.filters
          ) {
            //	self.props.showTab(self.props.tabData);
          } else if (
            Object.keys(schema["@showRelated"][singleCol]).indexOf("search") !=
              -1 &&
            schema["@showRelated"][singleCol].search.keyWords &&
            schema["@showRelated"][singleCol].search.keyWords.length > 0
          ) {
            //		self.props.showTab(self.props.tabData);
          }
        } catch (err) {}
      } else if (singleCol.indexOf("@") == 0) {
        //if(singleCol=="@uniqueUserName" || singleCol=="@socialShare" || singleCol=="@audit" || singleCol=="@saveAsPDF"){
        self.props.showTab(self.props.tabData);
        //}
      }

      /*else if(singleCol.indexOf("%")==0){
				 	self.props.showTab(self.props.tabData);
				 }*/
    }
  },
  componentDidUpdate: function() {
    if (this.state.like == "Liked") {
      this["like_button"].className = "fa fa-thumbs-up name";
    }
    {
      /*else if(this.state.follow=="Following"){
		  	this["follow_button"].className="fa fa-rss name";
		  }*/
    }
  },
  jumpTo: function(jumpData) {
    var link = "";
    var self = this;
    if (jumpData.type == "summary") {
      link = linkGenerator.getSummaryLink({
        org: self.props.org,
        schema: jumpData.schema ? jumpData.schema : self.props.rootSchema,
        dependentSchema: jumpData.dependentSchema
          ? jumpData.dependentSchema
          : self.props.dependentSchema,
        filters: jumpData.filters ? jumpData.filters : self.props.filters
      });
      browserHistory.push(link);
    } else if (jumpData.type == "detail") {
      if (typeof jumpData.recordId == "string") {
        link = linkGenerator.getDetailLink({
          record: {},
          org: self.props.org,
          schema: jumpData.schema ? jumpData.schema : rootSchema,
          recordId: self.props.data[jumpData.recordId]
        });
        browserHistory.push(link);
      } else if (
        typeof jumpData.recordId == "object" &&
        jumpData.recordId.type == "n1ql"
      ) {
        var params = [];
        if (Array.isArray(jumpData.recordId.params)) {
          for (var i = 0; i < jumpData.recordId.params.length; i++) {
            if (jumpData.recordId.params[i].indexOf("this") == 0) {
              if (jumpData.recordId.params[i].split("this.")[1] == "recordId") {
                params.push(self.props.recordId);
              } else {
                params.push(
                  self.props.data[jumpData.recordId.params.split("this.")[1]]
                );
              }
            } else {
              params.push(jumpData.recordId.params[i]);
            }
          }
        }
        //	var self=this;
        WebUtils.getResults(
          { query: jumpData.recordId.query, params: params },
          function(result) {
            if (Array.isArray(result) && result.length > 0) {
              try {
                var id = "";
                if (jumpData.recordId.path) {
                  var evalString = "result" + jumpData.recordId.path;
                  id = eval(evalString);
                } else {
                  id = result[0].recordId;
                }
                link = linkGenerator.getDetailLink({
                  record: {},
                  org: self.props.org,
                  schema: jumpData.schema ? jumpData.schema : rootSchema,
                  recordId: id
                });
                browserHistory.push(link);
              } catch (err) {
                if (jumpData.recordId.errorMessage) {
                  common.createAlert(
                    "Not found!",
                    jumpData.recordId.errorMessage
                  );
                }
              }
            } else {
              if (jumpData.recordId.errorMessage) {
                common.createAlert(
                  "Not found!",
                  jumpData.recordId.errorMessage
                );
              }
            }
          }
        );
      }
    }
  },
  openGroupViewPopUp: function(groupDetails) {
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className =
      "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(
      <common.GenericPopUpComponent
        popUpId={popUpId}
        contentDivId={contentDivId}
        sideDivId={sideDivId}
      />,
      node
    );
    ReactDOM.render(
      <groupBy.GroupBy
        key={global.guid()}
        tabData={this.props.tabData}
        showTab={this.props.showTab}
        sourceSchema={this.props.rootSchema}
        displayName={this.props.displayName}
        org={this.props.org}
        groupDetails={groupDetails}
        rootRecord={this.props.data}
      />,
      document.getElementById(contentDivId)
    );
  },
  exportPPT: function() {
    exportPPT.exportPPT(this.props.data, this.props.rootSchema);
  },
  render: function() {
  	var self = this;
    var schema = this.state.schema;
    var singleCol = this.props.singleCol;
    var flag = undefined;
    var pdfLinkName = undefined;
    var css = {};
    var iconClass = undefined;
    var iconClassTitle = undefined;
    //If directly pointing to a property value
    if (
      typeof singleCol == "object" ||
      singleCol == "$status" ||
      (singleCol.indexOf("$") != 0 &&
        singleCol.indexOf("#") != 0 &&
        singleCol.indexOf("^") != 0 &&
        singleCol.indexOf("&") != 0 &&
        singleCol.indexOf("@") != 0 &&
        singleCol.indexOf("%") != 0)
    ) {
      if (singleCol == "record_header") {
        flag = true;
        if (self.props.fromTable == "yes") {
          if (self.props.data["record_header"]) {
            flag = true;
          } else {
            flag = false;
          }
        }
        if (flag) {
          var style = {};
          if (self.props.fullLayout && self.props.fullLayout["css"] && self.props.fullLayout["css"]["record_header"] != undefined) {
            style = getContent.getStyleFromConfig(self.props.fullLayout["css"]["record_header"]).normal;
          }
          if (this.props.iconClass) {
            return (
              <div  className="display-inline-flex  form-group extra-padding-right" title={this.props.iconClassTitle ? this.props.iconClassTitle : ""}>
                {this.props.header? this.props.header: self.props.data["record_header"]}
              </div>
            );
          } else {
            return (
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-xs" style={style}>
                {this.props.header? this.props.header: self.props.data["record_header"]}
              </div>
            );
          }
        }
      }
      return (
        <editOrView.EditOrView
          schemaDoc={schema}
          property={singleCol}
          fullRecord={self.props.data}

          summary={self.props.summary}
          hideInlineEdit={self.props.hideInlineEdit}
          parentLayout={self.props.parentLayout}
          from={self.props.from}
          noDetail={self.props.noDetail}
          viewName={self.props.viewName}
          fullLayout={self.props.fullLayout}
          noGallery={self.props.noGallery}
          showTab={self.props.showTab}
          tabData={self.props.tabData}
          noFormGroup={self.props.noFormGroup}
          displayName={self.props.displayName}
          dependentSchema={self.props.dependentSchema}
          relatedSchemas={self.props.relatedSchemas}
          rootSchema={self.props.rootSchema}
          recordId={self.props.recordId}
          org={self.props.org}
          methods={self.props.methods}
          showingForRelatedViewOfRecordId={self.props.showingForRelatedViewOfRecordId}
        />/*{...this.props}*/
      );
    } else if (singleCol.indexOf("^") == 0) {
      singleCol = singleCol.replace("^", "");
      flag = 0;
      if (Array.isArray(self.props.relatedSchemas)) {
        self.props.relatedSchemas.map(function(relatedSchema) {
          try {
            if (schema["@relations"][singleCol].relationRefSchema == relatedSchema &&
              getMethodExecutePrivilegeOnorgSchema(self.props.org,schema,self.props.data,singleCol)) {
              flag = 1;
            }
          } catch (err) {}
        });
      }
      if (
        self.props.summary ||
        (self.props.from && self.props.from == "table")
      ) {
        flag = getMethodExecutePrivilegeOnorgSchema(self.props.org,schema,self.props.data,singleCol);
      }
      if (flag == 1) {
        return (
          <CreateRelation
            fullLayout={self.props.fullLayout}
            singleCol={singleCol}
            schemaDoc={schema}
            fullRecord={self.props.data}
            recordId={self.props.recordId}
            org={self.props.org}
            performUpdation={self.performUpdation}
            rootSchema={self.props.rootSchema}
          />
        );
      } else {
        return <div className="hidden" />;
      }
    } else if (singleCol.indexOf("$") == 0) {
      singleCol = singleCol.replace("$", "");
      flag = 0;

      var RelatedRecordsData = "";
      try {
        if (schema["@relations"][singleCol]) {
          RelatedRecordsData = (
            <RelatedRecords
              summary={self.props.summary}
              noDetail={self.props.noDetail}
              parentLayout={self.props.parentLayout}
              key={global.guid()}
              fromPopUp={self.props.fromPopUp}
              contentDivId={self.props.contentDivId}
              showingForRelatedViewOfRecordId={
                self.props.showingForRelatedViewOfRecordId
              }
              tabData={self.props.tabData}
              css={
                self.props.fullLayout &&
                self.props.fullLayout["css"] &&
                self.props.fullLayout["css"]["$" + singleCol]
                  ? self.props.fullLayout["css"]["$" + singleCol]
                  : undefined
              }
              showTab={self.props.showTab}
              rootSchema={self.props.rootSchema}
              dependentSchema={self.props.dependentSchema}
              schemaDoc={schema}
              recordId={self.props.recordId}
              relation={schema["@relations"][singleCol]}
              limit={
                schema["@relations"][singleCol] &&
                schema["@relations"][singleCol]["limit"]
                  ? schema["@relations"][singleCol]["limit"]
                  : undefined
              }
              org={self.props.org}
              rootRecord={self.props.data}
            />
          );
          try {
            if (
              schema["@relations"][singleCol].showRelated.showRecords == "no"
            ) {
              RelatedRecordsData = "";
            }
          } catch (err) {}
        }
      } catch (err) {}
      return (
        <div
          key={global.guid()}
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
        >
          {RelatedRecordsData}
        </div>
      );
    } else if (singleCol.indexOf("#") == 0) {
      singleCol = singleCol.replace("#", "");
      flag = 0;
      if (self.props.methods == "all") {
        flag = 1;
      } else {
        if (Array.isArray(self.props.methods)) {
          self.props.methods.map(function(method) {
            if (method == singleCol) {
              flag = 1;
            }
          });
        }
        if (
          self.props.summary ||
          (self.props.from && self.props.from == "table")
        ) {
          flag = getMethodExecutePrivilegeOnorgSchema(
            self.props.org,
            schema,
            self.props.data,
            singleCol
          );
        }
      }
      css =
        self.props.fullLayout &&
        self.props.fullLayout["css"] &&
        self.props.fullLayout["css"]["#" + singleCol]
          ? self.props.fullLayout["css"]["#" + singleCol]
          : undefined;
      var styleFromConfig = {};
      var onMouseOver = "";
      var onMouseOut = "";
      var onClick = "";
      var styleName = "";
      var actionButton = "action-button";
      if (css) {
        var allStyles = getContent.getStyleFromConfig(css);
        if (allStyles.styleName != "text") {
          actionButton = "";
          styleFromConfig = allStyles.normal;
          onMouseOver = allStyles.mouseOver;
          onMouseOut = allStyles.mouseOut;
          onClick = allStyles.click;
        }
      }

      if (flag == 1) {
        if (
          schema["@operations"].update &&
          schema["@operations"].update[singleCol]
        ) {
          if (schema["@operations"].update[singleCol]["iconClass"]) {
            //titlebkp={schema["@operations"].update[singleCol].iconClassTitle?schema["@operations"].update[singleCol].iconClassTitle:singleCol}
            return (
              <div
                key={global.guid()}
                className={
                  "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
                  css
                }
              >
                <div
                  className="buttonWidth"
                  onClick={self.editRecord.bind(
                    null,
                    self.props.recordId,
                    singleCol,
                    schema["@operations"].update[singleCol].update
                  )}
                >
                  <div className="iconHeight">
                    <i
                      className={
                        schema["@operations"].update[singleCol]["iconClass"] +
                        " newCustomIcon"
                      }
                    />
                  </div>
                  <div className="newCustomButton">
                    {schema["@operations"].update[singleCol]["displayName"]
                      ? schema["@operations"].update[singleCol]["displayName"]
                      : singleCol}
                  </div>
                </div>
              </div>
            );
          } else {
          	/*
          	 *
                  data-onmouseover={onMouseOver}
                  data-onmouseout={onMouseOut}
                  data-onclick={onClick}
          	 */
            return (
              <div
                key={global.guid()}
                className="display-inline-block form-group remove-margin-left remove-margin-right extra-padding-right "
              >
                <input
                  type="submit"
                  ref={e => {
                    self["disable_edit"] = e;
                  }}
                  className={actionButton}
                  style={styleFromConfig}
                  title={
                    schema["@operations"].update[singleCol]["toolTip"]
                      ? schema["@operations"].update[singleCol]["toolTip"]
                      : singleCol
                  }
                  value={
                    schema["@operations"].update[singleCol]["displayName"]
                      ? schema["@operations"].update[singleCol]["displayName"]
                      : singleCol
                  }
                  onClick={self.editRecord.bind(
                    null,
                    self.props.recordId,
                    singleCol,
                    schema["@operations"].update[singleCol].update
                  )}
                />
              </div>
            );
          }
        } else if (
          schema["@operations"].actions &&
          schema["@operations"].actions[singleCol]
        ) {
          if (schema["@operations"].actions[singleCol]["iconClass"]) {
            //titlebkp={schema["@operations"].actions[singleCol].iconClassTitle?schema["@operations"].actions[singleCol].iconClassTitle:singleCol}
            return (
              <div
                key={global.guid()}
                className={
                  "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
                  css
                }
              >
                <div
                  className="buttonWidth"
                  onClick={self.performUpdation.bind(
                    null,
                    self.props.recordId,
                    singleCol,
                    schema["@operations"].actions[singleCol].key,
                    schema["@operations"].actions[singleCol].value
                  )}
                >
                  <div className="iconHeight">
                    <i
                      className={
                        schema["@operations"].actions[singleCol]["iconClass"] +
                        " newCustomIcon"
                      }
                    />
                  </div>
                  <div className="newCustomButton">
                    {schema["@operations"].actions[singleCol]["displayName"]
                      ? schema["@operations"].actions[singleCol]["displayName"]
                      : singleCol}
                  </div>
                </div>
              </div>
            );
          } else {
          	/*
          	 *
                  data-onmouseover={onMouseOver}
                  data-onmouseout={onMouseOut}
                  data-onclick={onClick}
          	 */
            return (
              <div
                key={global.guid()}
                className="display-inline-block form-group remove-margin-left remove-margin-right extra-padding-right "
              >
                <input
                  type="submit"
                  ref={e => {
                    self["disable_button"] = e;
                  }}
                  className={actionButton}
                  style={styleFromConfig}
                  title={
                    schema["@operations"].actions[singleCol]["toolTip"]
                      ? schema["@operations"].actions[singleCol]["toolTip"]
                      : singleCol
                  }
                  value={
                    schema["@operations"].actions[singleCol]["displayName"]
                      ? schema["@operations"].actions[singleCol]["displayName"]
                      : singleCol
                  }
                  onClick={self.performUpdation.bind(
                    null,
                    self.props.recordId,
                    singleCol,
                    schema["@operations"].actions[singleCol].key,
                    schema["@operations"].actions[singleCol].value
                  )}
                />
              </div>
            );
          }
        } else if (
          schema["@operations"].delete &&
          schema["@operations"].delete[singleCol]
        ) {
          if (schema["@operations"].delete[singleCol]["iconClass"]) {
            //titlebkp={schema["@operations"].delete[singleCol].iconClassTitle?schema["@operations"].delete[singleCol].iconClassTitle:singleCol}
            return (
              <div
                key={global.guid()}
                className={
                  "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
                  css
                }
              >
                <div
                  className="buttonWidth"
                  onClick={self.performUpdation.bind(
                    null,
                    self.props.recordId,
                    singleCol,
                    schema["@operations"].delete[singleCol].key,
                    schema["@operations"].delete[singleCol].value
                  )}
                >
                  <div className="iconHeight">
                    <i
                      className={
                        schema["@operations"].delete[singleCol]["iconClass"] +
                        " newCustomIcon"
                      }
                    />
                  </div>
                  <div className="newCustomButton">
                    {schema["@operations"].delete[singleCol]["displayName"]
                      ? schema["@operations"].delete[singleCol]["displayName"]
                      : singleCol}
                  </div>
                </div>
              </div>
            );
          } else {
          	/*
          	 *
                  data-onmouseover={onMouseOver}
                  data-onmouseout={onMouseOut}
                  data-onclick={onClick}
          	 */
            return (
              <div
                key={global.guid()}
                className="display-inline-block form-group remove-margin-left remove-margin-right extra-padding-right "
              >
                <input
                  type="submit"
                  ref={e => {
                    self["disable_button"] = e;
                  }}
                  className={actionButton}
                  style={styleFromConfig}
                  title={
                    schema["@operations"].delete[singleCol]["toolTip"]
                      ? schema["@operations"].delete[singleCol]["toolTip"]
                      : singleCol
                  }
                  value={
                    schema["@operations"].delete[singleCol]["displayName"]
                      ? schema["@operations"].delete[singleCol]["displayName"]
                      : singleCol
                  }
                  onClick={self.performUpdation.bind(
                    null,
                    self.props.recordId,
                    singleCol,
                    schema["@operations"].delete[singleCol].key,
                    schema["@operations"].delete[singleCol].value
                  )}
                />
              </div>
            );
          }
        } else if (
          schema["@operations"].jumpTo &&
          schema["@operations"].jumpTo[singleCol]
        ) {
          if (schema["@operations"].jumpTo[singleCol]["iconClass"]) {
            //titlebkp={schema["@operations"].jumpTo[singleCol].iconClassTitle?schema["@operations"].jumpTo[singleCol].iconClassTitle:singleCol}
            return (
              <div
                key={global.guid()}
                className={
                  "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
                  css
                }
              >
                <div
                  className="buttonWidth"
                  onClick={self.jumpTo.bind(
                    null,
                    schema["@operations"].jumpTo[singleCol]
                  )}
                >
                  <div className="iconHeight">
                    <i
                      className={
                        schema["@operations"].jumpTo[singleCol]["iconClass"] +
                        " newCustomIcon"
                      }
                    />
                  </div>
                  <div className="newCustomButton">
                    {schema["@operations"].jumpTo[singleCol]["displayName"]
                      ? schema["@operations"].jumpTo[singleCol]["displayName"]
                      : singleCol}
                  </div>
                </div>
              </div>
            );
          } else {
          	/*
                  data-onmouseover={onMouseOver}
                  data-onmouseout={onMouseOut}
                  data-onclick={onClick}
                  */
            return (
              <div
                key={global.guid()}
                className="display-inline-block form-group remove-margin-left remove-margin-right extra-padding-right "
              >
                <input
                  type="submit"
                  ref={e => {
                    self["disable_button"] = e;
                  }}
                  className={actionButton}
                  style={styleFromConfig}
                  title={
                    schema["@operations"].jumpTo[singleCol]["toolTip"]
                      ? schema["@operations"].jumpTo[singleCol]["toolTip"]
                      : singleCol
                  }
                  value={
                    schema["@operations"].jumpTo[singleCol]["displayName"]
                      ? schema["@operations"].jumpTo[singleCol]["displayName"]
                      : singleCol
                  }
                  onClick={self.jumpTo.bind(
                    null,
                    schema["@operations"].jumpTo[singleCol]
                  )}
                />
              </div>
            );
          }
        } else {
          return <div className="hidden" />;
        }
      } else {
        return <div className="hidden" />;
      }
    } else if (singleCol.indexOf("&") == 0) {
      singleCol = singleCol.replace("&", "");
      var addClass = "";
      if (self.props.displayName == "no") {
        addClass = "hidden";
      }
      try {
        if (
          Object.keys(schema["@showRelated"][singleCol]).indexOf("viewQuery") !=
            -1 &&
          schema["@showRelated"][singleCol].viewQuery.filters
        ) {
          var srSchema = schema["@showRelated"][singleCol].viewQuery.schema
            ? schema["@showRelated"][singleCol].viewQuery.schema
            : self.props.rootSchema;
          var srDSchema = schema["@showRelated"][singleCol].viewQuery
            .dependentSchema
            ? schema["@showRelated"][singleCol].viewQuery.dependentSchema
            : self.props.dependentSchema;
          var srFilters = {};
          if (schema["@showRelated"][singleCol].viewQuery.filters) {
            if (
              typeof schema["@showRelated"][singleCol].viewQuery.filters ==
              "object"
            ) {
              var currentFKeys = Object.keys(
                schema["@showRelated"][singleCol].viewQuery.filters
              );
              for (var srfi = 0; srfi < currentFKeys.length; srfi++) {
                srFilters[currentFKeys[srfi]] = [];
                var currentFKValues =
                  schema["@showRelated"][singleCol].viewQuery.filters[
                    currentFKeys[srfi]
                  ];
                for (var srfj = 0; srfj < currentFKValues.length; srfj++) {
                  if (currentFKValues[srfj].indexOf("this") == 0) {
                    if (currentFKValues[srfj].split("this.")[1] == "recordId") {
                      srFilters[currentFKeys[srfi]].push(self.props.recordId);
                    } else {
                      srFilters[currentFKeys[srfi]].push(
                        self.props.data[currentFKValues[srfj].split("this.")[1]]
                      );
                    }
                  } else {
                    srFilters[currentFKeys[srfi]].push(currentFKValues[srfj]);
                  }
                }
              }
            }
          }
          var showRelatedHeading = global.makeHeader(
            self.props.data,
            schema["@showRelated"][singleCol].viewQuery.heading,
            "forRelations"
          );
          {
            /*self.props.data[schema["@identifier"]]+" "+schema["@showRelated"][singleCol].viewQuery.displayName*/
          }
          return (
            <div>
              <div
                className={
                  "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding " +
                  addClass
                }
              >
                {schema["@showRelated"][singleCol].viewQuery.displayName
                  ? schema["@showRelated"][singleCol].viewQuery.displayName
                  : ""}
              </div>
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                {showRelatedHeading != "" ? (
                  <h2 className="h2">{showRelatedHeading}</h2>
                ) : (
                  ""
                )}
                <EmbedSummary
                  fromDetailView="fromDetailView"
                  showingForRelatedViewOfRecordId={
                    self.props.showingForRelatedViewOfRecordId +
                    self.props.recordId
                  }
                  schema={srSchema}
                  showTab={self.props.showTab}
                  tabData={self.props.tabData}
                  filters={srFilters}
                  dependentSchema={srDSchema}
                  showFilters={
                    schema["@showRelated"][singleCol].viewQuery.showFilters
                  }
                  org={self.props.org}
                />
              </div>
            </div>
          );
        } else if (
          Object.keys(schema["@showRelated"][singleCol]).indexOf("search") !=
            -1 &&
          schema["@showRelated"][singleCol].search.keyWords &&
          schema["@showRelated"][singleCol].search.keyWords.length > 0
        ) {
          var searchText = "";
          var fields = {};
          var UILayout =
            schema["@showRelated"][singleCol].search &&
            schema["@showRelated"][singleCol].search.UILayout
              ? schema["@showRelated"][singleCol].search.UILayout
              : "";
          for (
            var ki = 0;
            ki < schema["@showRelated"][singleCol].search.keyWords.length;
            ki++
          ) {
            var value =
              self.props.data[
                schema["@showRelated"][singleCol].search.keyWords[ki]
              ];
            if (!value) {
              value = "";
              if (
                schema["@showRelated"][singleCol].search.keyWords[ki] ==
                "docType"
              ) {
                value = self.props.rootSchema;
              }
            }
            searchText += " " + value;
            fields[
              schema["@showRelated"][singleCol].search.keyWords[ki]
            ] = value;
          }
          showRelatedHeading = global.makeHeader(
            self.props.data,
            schema["@showRelated"][singleCol].search.heading,
            "forRelations"
          );
          {
            /*self.props.data[schema["@identifier"]]+" "+schema["@showRelated"][singleCol].search.displayName*/
          }
          return (
            <div>
              <div
                className={
                  "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding " +
                  addClass
                }
              >
                {schema["@showRelated"][singleCol].search.displayName}
              </div>
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                <search.SearchResultsBySchema
                  showTab={self.props.showTab}
                  showRelatedHeading={showRelatedHeading}
                  tabData={self.props.tabData}
                  UILayout={UILayout}
                  searchText={fields}
                />
              </div>
            </div>
          );
        } else {
          //
          return <div className="hidden" />;
        }
      } catch (err) {
        return <div className="hidden" />;
      }
    } else if (singleCol.indexOf("@") == 0) {
      if (singleCol == "@uniqueUserName") {
        //if(self.props.methods=="all" || self.props.methods.indexOf("@uniqueUserName")>-1){
        return (
          <div>
            <changeId.ChangeId
              id={self.props.recordId}
              schema={self.props.rootSchema}
              org={self.props.org}
            />
          </div>
        );
        //}else{
        //return(<div className="hidden"></div>)
        //}
      } else if (singleCol == "@socialShare") {
        return (
          <div
            key={global.guid()}
            className={
              "display-inline-flex  form-group extra-padding-right  " + css
            }
            title="Share"
          >
            <socialShare.SocialShare
              href={linkGenerator.getDetailLink({
                record: self.props.data,
                org: self.props.org,
                schema: self.props.rootSchema,
                recordId: self.props.recordId
              })}
            />
          </div>
        );
      } else if (singleCol == "@audit") {
        return (
          <audit.Audit
            key={global.guid()}
            rootSchema={self.props.rootSchema}
            dependentSchema={self.props.dependentSchema}
            schemaDoc={schema}
            recordId={self.props.recordId}
            org={self.props.org}
            rootRecord={self.props.data}
          />
        );
      } else if (singleCol == "@compare") {
        return (
          <compare.AddToCompareList
            key={global.guid()}
            rootSchema={self.props.rootSchema}
            dependentSchema={self.props.dependentSchema}
            schemaDoc={schema}
            recordId={self.props.recordId}
            org={self.props.org}
            rootRecord={self.props.data}
          />
        );
      } else if (singleCol == "@saveAsPDF") {
        pdfLinkName = "Save As PDF";
        var previewName = "Preview";
        var downloadName = "Download";
        try {
          pdfLinkName =
            schema["@metaData"] &&
            schema["@metaData"]["@saveAsPDF"] &&
            schema["@metaData"]["@saveAsPDF"].displayName
              ? schema["@metaData"]["@saveAsPDF"].displayName
              : pdfLinkName;
          if (
            pdfLinkName &&
            pdfLinkName.toLowerCase().indexOf("download") > -1
          ) {
            previewName = pdfLinkName;
            previewName = previewName.toLowerCase();
            previewName = previewName.replace("download", "");
            previewName = previewName.trim();
            previewName = "Preview " + previewName;
            downloadName = pdfLinkName;
          } else {
            previewName = pdfLinkName;
            previewName = previewName.toLowerCase();
            previewName = previewName.trim();
            previewName = "Preview " + previewName;

            downloadName = pdfLinkName;
            downloadName = downloadName.toLowerCase();
            downloadName = downloadName.trim();
            downloadName = "Download " + downloadName;
          }
        } catch (err) {}
        if (
          schema["@metaData"] &&
          schema["@metaData"]["@saveAsPDF"] &&
          schema["@metaData"]["@saveAsPDF"].iconClass
        ) {
          css =
            self.props.fullLayout &&
            self.props.fullLayout["css"] &&
            self.props.fullLayout["css"]["@saveAsPDF"]
              ? self.props.fullLayout["css"]["@saveAsPDF"]
              : "";
          //titlebkp={schema["@metaData"]["@saveAsPDF"].iconClassTitle?schema["@metaData"]["@saveAsPDF"].iconClassTitle:"SAVE AS PDF"}
          return (
            <div
              key={global.guid()}
              className={
                "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
                css
              }
            >
              {/*<a className="blueLink" href={linkGenerator.getPDFLink({recordId:self.props.recordId})} target="_blank" download={global.makeHeader(self.props.data,schema.heading)}>
                                    <div className="buttonWidth">
                                        <div className="iconHeight">
                                            <i  className={schema["@metaData"]["@saveAsPDF"].iconClass+" newCustomIcon"} />
                                        </div>
                                        <div className="newCustomButton">
                                           {pdfLinkName}
                                        </div>
                                    </div>
                               </a>*/}

              <div
                className="userNavHover share pdf"
                style={{ position: "relative" }}
              >
                <a
                  data-toggle="dropdown"
                  className="dropdown-toggle"
                  aria-expanded="false"
                >
                  <div className="iconHeight">
                    <i
                      className={
                        schema["@metaData"]["@saveAsPDF"].iconClass +
                        " newCustomIcon"
                      }
                    />
                  </div>
                </a>
                <ul
                  style={{
                    minWidth: "65px",
                    left: "14%",
                    fontSize: "12px",
                    marginTop: "5px"
                  }}
                  className="dropdown-menu arrow_box remove-margin-left noMinWidth remove-margin-right"
                >
                  <li className="navElement">
                    <a
                      className="link"
                      href={linkGenerator.getPDFLink({recordId:self.props.recordId,preview:true})}
                      target="_blank"
                    >
                      {previewName}
                    </a>
                  </li>
                  <li className="navElement">
                    <a
                      className="link"
                      href={linkGenerator.getPDFLink({recordId:self.props.recordId})}
                      target="_blank"
                      download={global.makeHeader(
                        self.props.data,
                        schema.heading
                      )}
                    >
                      {downloadName}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          );
        } else {
          return (
            <div className="extra-padding-right form-group ">
              <div
                className="userNavHover chat"
                style={{ position: "relative" }}
              >
                <a
                  data-toggle="dropdown"
                  className="dropdown-toggle"
                  aria-expanded="false"
                >
                  {pdfLinkName}
                </a>
                <ul
                  style={{
                    minWidth: "65px",
                    left: "14%",
                    fontSize: "12px",
                    marginTop: "5px"
                  }}
                  className="dropdown-menu arrow_box remove-margin-left noMinWidth remove-margin-right"
                >
                  <li className="navElement">
                    <a
                      className="link"
                      href={linkGenerator.getPDFLink({recordId:self.props.recordId,preview:true})}
                      target="_blank"
                    >
                      Preview
                    </a>
                  </li>
                  <li className="navElement">
                    <a
                      className="link"
                      href={linkGenerator.getPDFLink({recordId:self.props.recordId})}
                      target="_blank"
                      download={global.makeHeader(
                        self.props.data,
                        schema.heading
                      )}
                    >
                      Download
                    </a>
                  </li>
                </ul>
              </div>
              {/*<a className="blueLink" href={linkGenerator.getPDFLink({recordId:self.props.recordId})} target="_blank" download={global.makeHeader(self.props.data,schema.heading)}>
    			       				{pdfLinkName}
    			       			</a>*/}
            </div>
          );
        }
      } else if (singleCol == "@saveAsPPT") {
        pdfLinkName = "Save As PPT";
        try {
          pdfLinkName =
            schema["@metaData"] &&
            schema["@metaData"]["@saveAsPPT"] &&
            schema["@metaData"]["@saveAsPPT"].displayName
              ? schema["@metaData"]["@saveAsPPT"].displayName
              : pdfLinkName;
        } catch (err) {}
        if (
          schema["@metaData"] &&
          schema["@metaData"]["@saveAsPPT"] &&
          schema["@metaData"]["@saveAsPPT"].iconClass
        ) {
          css =
            self.props.fullLayout &&
            self.props.fullLayout["css"] &&
            self.props.fullLayout["css"]["@saveAsPPT"]
              ? self.props.fullLayout["css"]["@saveAsPPT"]
              : "";
          //titlebkp={schema["@metaData"]["@saveAsPPT"].iconClassTitle?schema["@metaData"]["@saveAsPPT"].iconClassTitle:"SAVE AS PPT"}
          return (
            <div
              key={global.guid()}
              className={
                "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
                css
              }
            >
              <div className="buttonWidth" onClick={self.exportPPT}>
                <div className="iconHeight">
                  <i
                    className={
                      schema["@metaData"]["@saveAsPPT"].iconClass +
                      " newCustomIcon"
                    }
                  />
                </div>
                <div className="newCustomButton">{pdfLinkName}</div>
              </div>
            </div>
          );
        } else {
          return (
            <div
              className="extra-padding-right form-group link "
              onClick={self.exportPPT}
            >
              {pdfLinkName}
            </div>
          );
        }
      } else if (singleCol == "@group") {
        var createGroupName = "CREATE VARIANT";
        var groupCreateData = schema["@metaData"]["group"];
        createGroupName =
          groupCreateData && groupCreateData.displayName
            ? groupCreateData.displayName
            : createGroupName;
        iconClass =
          groupCreateData && schema["@metaData"]["group"].iconClass
            ? schema["@metaData"]["group"].iconClass
            : undefined;
        iconClassTitle =
          groupCreateData && schema["@metaData"]["group"].iconClassTitle
            ? schema["@metaData"]["group"].iconClassTitle
            : undefined;
        css =
          self.props.fullLayout &&
          self.props.fullLayout["css"] &&
          self.props.fullLayout["css"]["@group"]
            ? self.props.fullLayout["css"]["@group"]
            : "";
        return (
          <div>
            {Array.isArray(schema["@createVariant"]) ? (
              <div>
                {this.props.data.groupID ? (
                  <RelatedRecords
                    summary={self.props.summary}
                    noDetail={self.props.noDetail}
                    key={global.guid()}
                    fromPopUp={self.props.fromPopUp}
                    contentDivId={self.props.contentDivId}
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId
                    }
                    rootSchema={self.props.rootSchema}
                    dependentSchema={self.props.dependentSchema}
                    schemaDoc={schema}
                    recordId={self.props.recordId}
                    relation={schema["@relations"]["group"]}
                    org={self.props.org}
                    rootRecord={self.props.data}
                  />
                ) : (
                  ""
                )}

                <CreateVariant
                  key={global.guid()}
                  schema={self.props.rootSchema}
                  iconClass={iconClass}
                  styleClass={css}
                  iconClassTitle={iconClassTitle}
                  variantFields={schema["@createVariant"]}
                  record={self.props.data}
                  recordId={self.props.recordId}
                  displayName={createGroupName}
                  org={self.props.org}
                />
              </div>
            ) : (
              ""
            )}
          </div>
        );
      } else if (singleCol == "@backLink") {
        var backLinkName = "BACK";
        var backLink = linkGenerator.getSummaryLink({
          org: self.props.org,
          schema: self.props.rootSchema,
          dependentSchema: self.props.dependentSchema,
          filters: self.props.filters
        });
        try {
          var backLinkData = schema["@metaData"][singleCol];
          backLinkName =
            backLinkData && backLinkData.displayName
              ? backLinkData.displayName
              : backLinkName;
          if (backLinkData && backLinkData.type == "summary") {
            backLink = linkGenerator.getSummaryLink({
              org: self.props.org,
              schema: backLinkData.schema
                ? backLinkData.schema
                : self.props.rootSchema,
              dependentSchema: backLinkData.dependentSchema
                ? backLinkData.dependentSchema
                : self.props.dependentSchema,
              filters: backLinkData.filters
                ? backLinkData.filters
                : self.props.filters
            });
          } else if (backLinkData && backLinkData.type == "detail") {
            if (self.props.data[backLinkData.recordId]) {
              backLink = linkGenerator.getDetailLink({
                record: {},
                org: self.props.org,
                schema: backLinkData.schema ? backLinkData.schema : rootSchema,
                recordId: self.props.data[backLinkData.recordId]
              });
            } else {
              return <span />;
            }
          } else if (backLinkData && backLinkData.type == "myprojects") {
            backLink = linkGenerator.getMyProjectsLink({
              org: self.props.org,
              schema: backLinkData.schema,
              dependentSchema: backLinkData.dependentSchema
            });
          } else {
            if (
              typeof schema["@metaData"] == "object" &&
              typeof schema["@metaData"][singleCol] == "object" &&
              typeof schema["@metaData"][singleCol].iconClass == "string"
            ) {
              css =
                self.props.fullLayout &&
                self.props.fullLayout["css"] &&
                self.props.fullLayout["css"][singleCol]
                  ? self.props.fullLayout["css"][singleCol]
                  : "";
              //titlebkp={schema["@metaData"][singleCol].iconClassTitle?schema["@metaData"][singleCol].iconClassTitle:backLinkName}
              return (
                <div
                  key={global.guid()}
                  className={
                    "display-inline-flex pointer  extra-padding-right form-group " +
                    css
                  }
                >
                  <div className="buttonWidth">
                    <span
                      onClick={function() {
                        history.back();
                      }}
                    >
                      <div className="iconHeight">
                        <i
                          className={
                            schema["@metaData"][singleCol].iconClass +
                            " newCustomIcon"
                          }
                        />
                      </div>
                      <div className="newCustomButton">{backLinkName}</div>
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div className="extra-padding-right form-group ">
                <div
                  className="link backLink"
                  onClick={function() {
                    history.back();
                  }}
                >
                  <div className="icons8-left-arrow-2  display-inline-block " />
                  <span>&nbsp;{backLinkName}</span>
                </div>
                {/*}<span className="blueLink pointer" onClick={function(){history.back();}}>
    			       				{backLinkName}
    			       			</span>*/}
              </div>
            );
          }
        } catch (err) {}
        if (
          typeof schema["@metaData"] == "object" &&
          typeof schema["@metaData"][singleCol] == "object" &&
          typeof schema["@metaData"][singleCol].iconClass == "string"
        ) {
          css =
            self.props.fullLayout &&
            self.props.fullLayout["css"] &&
            self.props.fullLayout["css"][singleCol]
              ? self.props.fullLayout["css"][singleCol]
              : "";
          //titlebkp={schema["@metaData"][singleCol].iconClassTitle?schema["@metaData"][singleCol].iconClassTitle:backLinkName}
          return (
            <div
              key={global.guid()}
              className={
                "display-inline-flex pointer  extra-padding-right form-group " +
                css
              }
            >
              <div className="buttonWidth">
                <Link to={backLink}>
                  <div className="iconHeight">
                    <i
                      className={
                        schema["@metaData"][singleCol].iconClass +
                        " newCustomIcon"
                      }
                    />
                  </div>
                  <div className="newCustomButton">{backLinkName}</div>
                </Link>
              </div>
            </div>
          );
        } else {
          return (
            <div className="extra-padding-right form-group pointer">
              <Link className="blueLink" to={backLink}>
                <div className="link backLink">
                  <div className="icons8-left-arrow-2  display-inline-block " />
                  <span>&nbsp;{backLinkName}</span>
                </div>
              </Link>
            </div>
          );
        }
      } else if (singleCol == "@createLink") {
        var variantFields = [];
        var buttonName = "+CREATE NEW";
        iconClass = undefined;
        iconClassTitle = undefined;
        try {
          buttonName = schema["@metaData"]["@createLink"].displayName
            ? schema["@metaData"]["@createLink"].displayName
            : buttonName;
          variantFields = schema["@metaData"]["@createLink"].variantFields
            ? schema["@metaData"]["@createLink"].variantFields
            : [];
          iconClass = schema["@metaData"]["@createLink"].iconClass
            ? schema["@metaData"]["@createLink"].iconClass
            : undefined;
          iconClassTitle = schema["@metaData"]["@createLink"].iconClassTitle
            ? schema["@metaData"]["@createLink"].iconClassTitle
            : undefined;
        } catch (err) {}
        css =
          self.props.fullLayout &&
          self.props.fullLayout["css"] &&
          self.props.fullLayout["css"][singleCol]
            ? self.props.fullLayout["css"][singleCol]
            : "";

        return (
          <div
            className={
              iconClass
                ? "display-inline-block"
                : "extra-padding-right form-group "
            }
          >
            <CreateVariant
              key={global.guid()}
              schema={self.props.rootSchema}
              variantFields={variantFields}
              noGroup={true}
              styleClass={css}
              iconClassTitle={iconClassTitle}
              iconClass={iconClass}
              displayName={buttonName}
              record={self.props.data}
              recordId={self.props.recordId}
              org={self.props.org}
            />
          </div>
        );
      } else if (singleCol == "@chat") {
        if (
          typeof schema["@metaData"] == "object" &&
          typeof schema["@metaData"][singleCol] == "object" &&
          typeof schema["@metaData"][singleCol].iconClass == "string"
        ) {
          var scmaRole = common.getSchemaRoleOnOrg(
            schema["@id"],
            self.props.org
          );
          if (
            scmaRole &&
            scmaRole.methods &&
            (scmaRole.methods == "all" ||
              scmaRole.methods.indexOf(singleCol) > -1)
          ) {
            css =
              self.props.fullLayout &&
              self.props.fullLayout["css"] &&
              self.props.fullLayout["css"][singleCol]
                ? self.props.fullLayout["css"][singleCol]
                : "";
            var type = self.props.rootSchema;
            var id = self.props.recordId;
            var displayName = "Chat";

            if (schema["@metaData"][singleCol].displayName) {
              displayName = schema["@metaData"][singleCol].displayName;
            }
            //titlebkp={schema["@metaData"][singleCol].iconClassTitle?schema["@metaData"][singleCol].iconClassTitle:backLinkName}
            return (
              <div
                key={global.guid()}
                className={
                  "display-inline-flex pointer  extra-padding-right form-group " +
                  css
                }
              >
                <div className="buttonWidth">
                  <span onClick={chat.startConversation.bind(null, type, id)}>
                    <div className="iconHeight">
                      <i
                        className={
                          schema["@metaData"][singleCol].iconClass +
                          " newCustomIcon"
                        }
                      />
                    </div>
                    <div className="newCustomButton">{displayName}</div>
                  </span>
                </div>
              </div>
            );
          } else {
            return <div className="hidden" />;
          }
        } else {
          return (
            <chat.SendMessage
              type={self.props.rootSchema}
              id={self.props.recordId}
            />
          );
        }
      } else {
        return <div className="hidden" />;
      }
    } else if (singleCol.indexOf("%") == 0) {
      singleCol = singleCol.replace("%", "");
      try {
        var groupDetails = global.formGroupDetailRawData(
          schema["@groups"][singleCol],
          Object.assign(self.props.data, { recordId: self.props.recordId })
        );
        groupDetails.org = self.props.org;
        if (
          self.props.fullLayout &&
          self.props.fullLayout.groupViews &&
          self.props.fullLayout.groupViews[singleCol] &&
          self.props.fullLayout.groupViews[singleCol].type
        ) {
          if (self.props.fullLayout.groupViews[singleCol].type == "popUp") {
            if (
              self.props.fullLayout.groupViews[singleCol] &&
              self.props.fullLayout.groupViews[singleCol].iconClass
            ) {
              css =
                self.props.fullLayout["css"] &&
                self.props.fullLayout["css"][singleCol]
                  ? self.props.fullLayout["css"][singleCol]
                  : "";
              //titlebkp={self.props.fullLayout.groupViews[singleCol].iconClassTitle?self.props.fullLayout.groupViews[singleCol].iconClassTitle:singleCol}
              return (
                <div
                  key={global.guid()}
                  className={
                    "display-inline-flex  form-group extra-padding-right " + css
                  }
                >
                  <div className="buttonWidth">
                    <div className="iconHeight">
                      <i
                        className={
                          self.props.fullLayout.groupViews[singleCol]
                            .iconClass + " newCustomIcon"
                        }
                        onClick={self.openGroupViewPopUp.bind(
                          null,
                          groupDetails
                        )}
                      />
                    </div>
                    <div
                      className="newCustomButton"
                      onClick={self.openGroupViewPopUp.bind(null, groupDetails)}
                    >
                      {self.props.fullLayout.groupViews[singleCol].displayName
                        ? self.props.fullLayout.groupViews[singleCol]
                            .displayName
                        : singleCol}
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <button
                  className="clickToPopUp"
                  onClick={self.openGroupViewPopUp.bind(null, groupDetails)}
                >
                  {self.props.fullLayout.groupViews[singleCol].displayName
                    ? self.props.fullLayout.groupViews[singleCol].displayName
                    : singleCol}
                </button>
              );
            }
          } else if (
            self.props.fullLayout.groupViews[singleCol].type == "link"
          ) {
            var linkName = "";
            if (
              global.makeHeader(self.props.data, groupDetails.heading, true)
            ) {
              linkName = global.makeHeader(
                self.props.data,
                groupDetails.heading
              );
            }
            if (!groupDetails.displayName) {
              groupDetails.displayName = linkName;
            }
            if (
              self.props.fullLayout.groupViews[singleCol] &&
              self.props.fullLayout.groupViews[singleCol].iconClass
            ) {
              css =
                self.props.fullLayout &&
                self.props.fullLayout["css"] &&
                self.props.fullLayout["css"][singleCol]
                  ? self.props.fullLayout["css"][singleCol]
                  : "";
              //titlebkp={self.props.fullLayout.groupViews[singleCol].iconClassTitle?self.props.fullLayout.groupViews[singleCol].iconClassTitle:singleCol}
              return (
                <div
                  key={global.guid()}
                  className={
                    "display-inline-flex  form-group extra-padding-right " + css
                  }
                >
                  <div className="buttonWidth">
                    <Link to={linkGenerator.getGroupViewLink(groupDetails)}>
                      <div className="iconHeight">
                        <i
                          className={
                            self.props.fullLayout.groupViews[singleCol]
                              .iconClass + " newCustomIcon"
                          }
                          onClick={self.createRelation.bind(
                            null,
                            schema["@relations"][singleCol],
                            self.props.recordId,
                            singleCol
                          )}
                        />
                      </div>
                      <div
                        className="newCustomButton"
                        onClick={self.createRelation.bind(
                          null,
                          schema["@relations"][singleCol],
                          self.props.recordId,
                          singleCol
                        )}
                      >
                        {self.props.fullLayout.groupViews[singleCol].displayName
                          ? self.props.fullLayout.groupViews[singleCol]
                              .displayName
                          : singleCol}
                      </div>
                    </Link>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="display-inline-block link blueLink">
                  <Link to={linkGenerator.getGroupViewLink(groupDetails)}>
                    {self.props.fullLayout.groupViews[singleCol].displayName
                      ? self.props.fullLayout.groupViews[singleCol].displayName
                      : singleCol}
                  </Link>
                </div>
              );
            }
          } else {
            return <div />;
          }
        } else {
          return (
            <groupBy.GroupBy
              key={global.guid()}
              tabData={self.props.tabData}
              showTab={self.props.showTab}
              sourceSchema={self.props.rootSchema}
              displayName={self.props.displayName}
              org={self.props.org}
              groupDetails={groupDetails}
              rootRecord={self.props.data}
            />
          );
          {
            /*rootRecordIdentifier={(self.props.data && typeof schema!="undefined" && schema["@identifier"] && typeof self.props.data[schema["@identifier"]]=="string")?self.props.data[schema["@identifier"]]:""}/>*/
          }
        }
      } catch (err) {
        return <div className="hidden" />;
      }
    } else {
      return <div className="hidden" />;
    }
  }
});

exports.GenericLayout = GenericLayout;

var CreateRelation = React.createClass({
  getInitialState: function() {
    return {
      follow: "Follow",
      like: "Like",
      prevLike: null,
      prevFollow: null,
      schema: this.props.schemaDoc
    };
  },
  createSystemRelation: function(relationData, recordId) {
    /* 	if(typeof common.getUserDoc().recordId != "undefined"){
	 		var doc={};
	    	if(relationData.relationRefSchema=="Like" ){
				  doc={
				    "likeFor": this.props.recordId,
					"likedBy": common.getUserDoc().recordId,
					"relationDesc": [
					  "likeFor-likedBy-likedBy",
					  "likedBy-isLiking-likeFor"
					],
					"org": this.props.org,
					"docType": "Like",
					"recordId": "Like"+global.guid(),
					"author": common.getUserDoc().recordId,
					"editor": common.getUserDoc().recordId,
					"dateCreated": global.getDate(),
					"dateModified": global.getDate(),
					"revision": 1
				  };
			}{/*else  if(relationData.relationRefSchema=="Follow" ){
				  doc={
				    "followee": this.props.recordId,
					"follower": common.getUserDoc().recordId,
					"relationDesc": [
					  "followee-followedBy-follower",
					  "follower-isFollowing-followee"
					],
					"org": this.props.org,
					"docType": "Follow",
					"recordId": "Follow"+global.guid(),
					"author": common.getUserDoc().recordId,
					"editor": common.getUserDoc().recordId,
					"dateCreated": global.getDate(),
					"dateModified": global.getDate(),
					"revision": 1
				  };
			}
			if(doc.docType=="Follow" && (this.state.prevFollow==null || (new Date() - this.state.prevFollow) >10000)){
				var newFollowStatus="Following";
				if(this.state.follow=="Follow"){
					newFollowStatus="Following";
					this["follow_button"].className=" name fa fa-rss";
				}else{
					newFollowStatus="Follow";
					this["follow_button"].className=" fa fa-rss";
				}
				this.setState({follow:newFollowStatus,prevFollow:new Date()},function(){
					ActionCreator.createJunction(doc);
				});
			}
			if(doc.docType=="Like" && (this.state.prevLike==null || (new Date() - this.state.prevLike)>10000)){
				var newLikeStatus="Liked";
				if(this.state.like=="Like"){
					newLikeStatus="Liked";
					this["like_button"].className=" name fa fa-thumbs-up";
				}else{
					newLikeStatus="Like";
					this["like_button"].className="fa fa-thumbs-o-up";
				}
				this.setState({like:newLikeStatus,prevLike:new Date()},function(){
					ActionCreator.createJunction(doc);
				});
			}
		}*/
  },
  afterCreateRelation: function(relationMethod) {
    console.log("performing After creating relation actions");
    var schemaRec = this.state.schema;
    try {
      if (Object.keys(schemaRec["@state"]).length > 0) {
        this.props.performUpdation(this.props.recordId, relationMethod);
      }
    } catch (err) {
      console.log("error updating after create relation action");
    }
  },
  createRelation: function(relationData, recordId, relationMethod) {
    var self = this;
    if (relationData.systemFunction) {
      self.createSystemRelation(relationData, recordId);
      return;
    }
    if (
      relationData.workFlows &&
      relationData.workFlows.creationWorkFlow &&
      relationData.workFlows.creationWorkFlow != ""
    ) {
      var wfd = self.props.fullRecord;
      wfd.recordId = self.props.recordId;
      wfd.org = self.props.org;
      workflow.workFlow(
        relationData.workFlows.creationWorkFlow,
        wfd,
        self.props.org
      );
      return;
    }
    //var schemaRec=SchemaStore.get(self.props.rootSchema);
    if (typeof common.getUserDoc().recordId == "undefined") {
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
        />,
        node
      );
      ReactDOM.render(
        <signUp.LoginPopup popUpId={popUpId} />,
        document.getElementById(contentDivId)
      );
      return;
    }
    /*if((!schemaRec["@security"] || Object.keys(schemaRec["@security"]).length==0) &&
			common.getUserOrgs().length>0 && self.props.org=="public"){
			var node = document.createElement("div");
		 	node.id = global.guid();
		 	var popUpId = global.guid();
		 	var contentDivId = global.guid();
		 	var sideDivId = global.guid();
		  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  	//node.className = "smallDialogBox";
		  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
	        ReactDOM.render(<utility.SelectOrg popUpId={popUpId} callback={continueCreation} />,document.getElementById(contentDivId));
	    }else{
	    	continueCreation(self.props.org);
	    }*/
    //continueCreation(self.props.org);

    var srFilters = undefined;
    if (typeof relationData.filters == "object") {
      /*srFilters={};
        	var currentFKeys=Object.keys(relationData.filters);
        	for(var srfi=0;srfi<currentFKeys.length;srfi++){
        		srFilters[currentFKeys[srfi]]=[];
        		var currentFKValues=relationData.filters[currentFKeys[srfi]];
        		for(var srfj=0;srfj<currentFKValues.length;srfj++){
        			if(currentFKValues[srfj].indexOf("this")==0){
        				if(currentFKValues[srfj].split("this.")[1]=="recordId"){
        					srFilters[currentFKeys[srfi]].push(self.props.recordId);
        				}else{
        					srFilters[currentFKeys[srfi]].push(self.props.fullRecord[currentFKValues[srfj].split("this.")[1]]);
        				}
        			}else{
        				srFilters[currentFKeys[srfi]].push(currentFKValues[srfj]);
        			}
        		}
        	}*/
      manageRecords.constructFilters(
        relationData.filters,
        Object.assign(self.props.fullRecord, { recordId: self.props.recordId }),
        function(fltsRes) {
          srFilters = fltsRes;
          continueCreation(self.props.org);
        }
      );
    } else {
      continueCreation(self.props.org);
    }

    function continueCreation(org) {
      //self[relationMethod+"action"].className+=" pointer-events";
      //trackThis("Create relation",{org: org,relationName:relationData.relationRefSchema});
      var knownData = {};
      knownData[relationData.knownKey] = recordId;
      var knownDataRecord = {};
      knownDataRecord[recordId] = self.props.fullRecord;

      if (relationData.knownData && relationData.knownData.length > 0) {
        for (var ri = 0; ri < relationData.knownData.length; ri++) {
          if (relationData.knownData[ri].valueType == "fixed") {
            knownData[relationData.knownData[ri].property] =
              relationData.knownData[ri].value;
          } else if (relationData.knownData[ri].valueType == "determine") {
            var value = "";
            var key = relationData.knownData[ri].property;
            if (relationData.knownData[ri].value == "userId") {
              value = common.getUserDoc().recordId;
            } else if (relationData.knownData[ri].value == "recordId") {
              value = recordId;
            } else {
              value = self.props.fullRecord[relationData.knownData[ri].value];
            }
            if (relationData.knownData[ri].property.indexOf(".") > -1) {
              key = relationData.knownData[ri].property.split(".")[0];
              var flag = {};
              flag[relationData.knownData[ri].property.split(".")[1]] = value;
              value = flag;
            }
            if (value == undefined) {
              return;
            }
            if (
              relationData.knownData[ri].dataType &&
              relationData.knownData[ri].dataType == "array"
            ) {
              knownData[key] = [value];
            } else {
              knownData[key] = value;
            }
          } else {
            knownData[relationData.knownData[ri].property] =
              self.props.fullRecord[relationData.knownData[ri].value];
          }
        }
      }

      WebUtils.doPost(
        "/schema?operation=getUniqueSchemaObjects",
        { name: relationData.relationRefSchema },
        function(result) {
          //WebUtils.doPost("/generic?operation=getSchemaRoleOnOrg",{schema:relationData.relationRefSchema,userId:common.getUserDoc().recordId,org:org},function(response){
          var response = common.getSchemaRoleOnOrg(
            relationData.relationRefSchema,
            org
          );
          //for user role creation
          if (knownData.org) {
            //org=knownData.org;
          }
          if (response && response.create && response.create != "") {
            var schema = result.data;
            if (
              Object.keys(schema["@properties"]).length == 2 &&
              schema["@properties"][Object.keys(schema["@properties"])[0]]
                .dataType.type == "object" &&
              schema["@properties"][Object.keys(schema["@properties"])[1]]
                .dataType.type == "object"
            ) {
              $(self[relationMethod + "action"]).addClass("pointer-events");
              junctionRecord = {};
              junctionRecord[relationData.knownKey] = recordId;
              var unKnownKey = "";
              function saveJunctionRecord() {
                junctionRecord[unKnownKey] = window[unKnownKey];
                junctionRecord.relationDesc = schema["@relationDesc"];
                junctionRecord.org = org;
                junctionRecord.docType = relationData.relationRefSchema;
                junctionRecord.recordId =
                  relationData.relationRefSchema + global.guid();
                junctionRecord.author = common.getUserDoc().recordId;
                junctionRecord.editor = common.getUserDoc().recordId;
                junctionRecord.dateCreated = global.getDate();
                junctionRecord.dateModified = global.getDate();
                junctionRecord.revision = 1;
                ActionCreator.createJunction(junctionRecord, function(result) {
                  if (result && result.data && !result.data.error) {
                    self.afterCreateRelation(relationMethod);
                  }
                });
                if (
                  relationData.workFlows &&
                  relationData.workFlows.createdWorkFlow &&
                  relationData.workFlows.createdWorkFlow != ""
                ) {
                  workflow.workFlow(
                    relationData.workFlows.createdWorkFlow,
                    junctionRecord
                  );
                }
                $(self[relationMethod + "action"]).removeClass(
                  "pointer-events"
                );
              }
              for (
                var i = 0;
                i < Object.keys(schema["@properties"]).length;
                i++
              ) {
                if (
                  Object.keys(schema["@properties"])[i] != relationData.knownKey
                ) {
                  unKnownKey = Object.keys(schema["@properties"])[i];
                  delete window[unKnownKey];
                  if (
                    Object.keys(schema["@properties"])[i] !=
                    relationData.knownKey
                  ) {
                    if (
                      schema["@properties"][
                        Object.keys(schema["@properties"])[i]
                      ] &&
                      schema["@properties"][
                        Object.keys(schema["@properties"])[i]
                      ].dataType &&
                      schema["@properties"][
                        Object.keys(schema["@properties"])[i]
                      ].dataType.expression &&
                      schema["@properties"][
                        Object.keys(schema["@properties"])[i]
                      ].dataType.expression == "#author__recordId"
                    ) {
                      window[unKnownKey] = common.getUserDoc().recordId;
                      saveJunctionRecord();
                    } else {
                      var node = document.createElement("div");
                      node.id = global.guid();
                      node.className =
                        "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
                      document
                        .getElementById("lookUpDialogBox")
                        .parentNode.appendChild(node);
                      ReactDOM.render(
                        <manageRecords.LookupComponent
                          org={org}
                          schema={
                            schema["@properties"][
                              Object.keys(schema["@properties"])[i]
                            ].dataType.objRef
                          }
                          objData={
                            schema["@properties"][
                              Object.keys(schema["@properties"])[i]
                            ]
                          }
                          storeInGlobal={unKnownKey}
                          filters={srFilters}
                          callback={saveJunctionRecord}
                        />,
                        node
                      );
                    }
                  }
                }
              }
            } else {
              //if(true){
              $(self.buttonArea).addClass("hidden");
              $(self.creationArea).removeClass("hidden");
              if (
                self.creationArea &&
                self.creationArea.parentNode &&
                self.creationArea.parentNode.className.indexOf(
                  "display-inline-flex"
                ) != -1
              ) {
                self.creationArea.parentNode.className = "";
              }

              ReactDOM.render(
                <manageRecords.DisplayCustomSchema
                  key={global.guid()}
                  schemaName={relationData.relationRefSchema}
                  knownData={knownData}
                  knownDataRecord={knownDataRecord}
                  org={org}
                  junctionProperty={
                    relationData.junctionProperty
                      ? relationData.junctionProperty
                      : undefined
                  }
                  srFilters={srFilters}
                  showCancel={true}
                  cancelCallback={function() {
                    $(self.creationArea).addClass("hidden");
                    $(self.buttonArea).removeClass("hidden");
                    if (
                      self.creationArea &&
                      self.creationArea.parentNode &&
                      self.creationArea.parentNode.className == ""
                    ) {
                      self.creationArea.parentNode.className =
                        "display-inline-flex extra-padding-right form-group";
                    }
                    $("html, body").animate({
                      scrollTop: $(self.buttonArea).top - 50
                    });
                  }}
                  filterKeys={
                    relationData.filterKeys
                      ? relationData.filterKeys
                      : undefined
                  }
                  callbackToClosePopup={function(record, result) {
                    if (result && result.data && !result.data.error) {
                      self.afterCreateRelation(relationMethod);
                    }
                    $(self.creationArea).addClass("hidden");
                    $(self.buttonArea).removeClass("hidden");
                    if (self.creationArea.parentNode.className == "") {
                      try {
                        self.creationArea.parentNode.className =
                          "display-inline-flex extra-padding-right form-group";
                      } catch (err) {}
                    }
                    $("html, body").animate({
                      scrollTop: $(self.buttonArea).top - 50
                    });
                  }}
                />,
                self.creationArea
              );
              /*}else{

								var node = document.createElement("div");
							 	node.id = global.guid();
							 	var popUpId = global.guid();
							 	var contentDivId = global.guid();
							 	var sideDivId = global.guid();
							  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
							  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
							  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
						       	ReactDOM.render(<manageRecords.DisplayCustomSchema
												    			schemaName = {relationData.relationRefSchema}
												    			knownData={knownData}
												    			knownDataRecord={knownDataRecord}
												    			org={org}
						       	                                junctionProperty={relationData.junctionProperty?relationData.junctionProperty:undefined}
						       	                                srFilters={srFilters}
						       	                                filterKeys={relationData.filterKeys?relationData.filterKeys:undefined}
												    			callbackToClosePopup={
												    				function(record,result){
												    					if(result && result.data && !result.data.error){
												    						self.afterCreateRelation(relationMethod);
												    					}
												    					common.showMainContainer();node.remove();
												    				}
												    			}
												    	/>,document.getElementById(contentDivId));
							}*/
            }
          } else {
            common.showMainContainer(0);
            common.createAlert(
              "No Privilege",
              "You don't have enought privileges to perform this action...!"
            );
          }
          //});
        }
      );
    }
  },
  render: function() {
    var self = this;
    var singleCol = self.props.singleCol;
    var schema = self.props.schemaDoc;
    var css =
      self.props.fullLayout &&
      self.props.fullLayout["css"] &&
      self.props.fullLayout["css"]["^" + singleCol]
        ? self.props.fullLayout["css"]["^" + singleCol]
        : undefined;
    var styleFromConfig = {};
    var onMouseOver = "";
    var onMouseOut = "";
    var onClick = "";
    var styleName = "";
    var actionButton = "upload-btn";
    if (css) {
      var allStyles = getContent.getStyleFromConfig(css);
      if (allStyles.styleName != "text") {
        actionButton = "";
        styleFromConfig = allStyles.normal;
        onMouseOver = allStyles.mouseOver;
        onMouseOut = allStyles.mouseOut;
        onClick = allStyles.click;
      }
    }
    if (schema["@relations"][singleCol].action && schema["@relations"][singleCol].action.iconClass) {
      //titlebkp={schema["@relations"][singleCol].action.iconClassTitle?schema["@relations"][singleCol].action.iconClassTitle:schema["@relations"][singleCol].action.displayName}
      return (
        <div className={"display-inline-flex  form-group extra-padding-right " + css}>
          <div className="buttonWidth"    ref={s => {this["buttonArea"] = s;}}>
            <div className="iconHeight">
              <i className={schema["@relations"][singleCol].action.iconClass +" newCustomIcon"}
                onClick={self.createRelation.bind(
                	null,
                  	schema["@relations"][singleCol],
                  	self.props.recordId,
                  	singleCol
                )}/>
            </div>
            <div
              className="newCustomButton"
              onClick={self.createRelation.bind(
                null,
                schema["@relations"][singleCol],
                self.props.recordId,
                singleCol
              )}>
              {schema["@relations"][singleCol].action.displayName}
            </div>
          </div>
          <div
            className="inlineEditbkp col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden"
            ref={s => {this["creationArea"] = s;}}/>
        </div>
      );
    } else {
      return (
        <div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "} >
          <span className="display-inline-block" ref={s => {this["buttonArea"] = s;}}>
            {["a"].map(function(temp) {
              if (schema["@relations"][singleCol].action.displayName == "Like") {
                return (
                  <label key={global.guid()} className="extra-padding-right form-group ">
                    <span onClick={self.createSystemRelation.bind(null,schema["@relations"][singleCol],self.props.recordId)}
                      ref={s => {self["like_button"] = s;}}
                      className="fa fa-thumbs-o-up"/>&nbsp;
                    <span ref={s => {self["likeCount1"] = s;}}>
                      {!schema["@relations"][singleCol].hideCount ? (
                        <junctionCount.JunctionCount
                          rootSchema={self.props.rootSchema}
                          recordId={self.props.recordId}
                          relationName="likedBy"
                          relationRefSchema="Like"/>
                      ) : ("")}
                    </span>{" "}   &nbsp;&nbsp;
                  </label>
                );
              } else if (schema["@relations"][singleCol].action.displayName == "Follow") {
                return (
                  <label key={global.guid()} className="extra-padding-right form-group ">
                    <span
                      onClick={self.createSystemRelation.bind(
                        null,
                        schema["@relations"][singleCol],
                        self.props.recordId
                      )}
                      ref={s => {self["follow_button"] = s;}}
                      className="fa fa-rss"/>&nbsp;
                    <span ref={s => {self["followCount1"] = s;}}>
                      {!schema["@relations"][singleCol].hideCount ? (
                        <junctionCount.JunctionCount
                          rootSchema={self.props.rootSchema}
                          recordId={self.props.recordId}
                          relationName="followedBy"
                          relationRefSchema="Follow"
                        />
                      ) : ("")}
                    </span>{" "}
                    &nbsp;&nbsp;
                  </label>
                );
              } else {
                var bTitle = schema["@relations"][singleCol].toolTip
                  ? schema["@relations"][singleCol].toolTip
                  : schema["@relations"][singleCol].action.displayName;
                  /*
                   *
                      data-onmouseover={onMouseOver}
                      data-onmouseout={onMouseOut}
                      data-onclick={onClick}
                   */
                return (
                  <div className="extra-padding-right form-group ">
                    <button
                      type="submit"
                      style={styleFromConfig}
                      ref={b => {self[singleCol + "action"] = b;}}
                      className={actionButton}
                      onClick={self.createRelation.bind(
                        null,
                        schema["@relations"][singleCol],
                        self.props.recordId,
                        singleCol
                      )}
                      title={bTitle}>
                      {schema["@relations"][singleCol].action.displayName}
                    </button>
                  </div>
                );
              }
            })}
          </span>
          <span className="inlineEditbkp hidden" ref={s => {this["creationArea"] = s;}}/>
        </div>
      );
    }
  }
});

/**
 * rootSchema
 * recordId
 * relation
 * org
 * type
 * rootRecord
 */
var RelatedRecords = React.createClass({
  getInitialState: function() {
    var props = this.props;
    var rootRecordId = props.recordId;
    var recordId = props.recordId;

    try {
      if (
        props.relation &&
        props.relation.relationRefKey &&
        typeof props.rootRecord[props.relation.relationRefKey] != "undefined"
      ) {
        //	rootRecordId=props.recordId;
        recordId = props.rootRecord[props.relation.relationRefKey];
      }
    } catch (err) {}
    if (!props.relation) {
      return {};
    }
    return {
      shouldComponentUpdate: false,
      recordId: recordId,
      rootRecordId: rootRecordId,
      records: JunctionStore.getRelatedRecords({
        recordId: recordId,
        relationName: props.relation.relationName,
        rootSchema: props.rootSchema,
        relationRefSchema: props.relation.relationRefSchema,
        userId: common.getUserDoc().recordId,
        skip: 0,
        limit: props.limit,
        org: props.org
      }),
      skip: 0,
      tabCheck: true
    };
  },
  setSortBy: function(sortKey) {
    var self = this;
    this.setState(
      {
        shouldComponentUpdate: true,
        sortBy: sortKey,
        sortOrder:
          this.state.sortBy == sortKey && this.state.sortOrder != "descend"
            ? "descend"
            : "ascend"
      },
      function() {
        self.createGetRecordsAction();
      }
    );
  },
  _onChange: function() {
    //if(this.isMounted()){
    this.setState({
      shouldComponentUpdate: true,
      records: JunctionStore.getRelatedRecords({
        recordId: this.state.recordId,
        relationName: this.props.relation.relationName,
        rootSchema: this.props.rootSchema,
        relationRefSchema: this.props.relation.relationRefSchema,
        userId: common.getUserDoc().recordId,
        skip: this.state.skip,
        org: this.props.org,
        limit: this.props.limit,
        sortBy: this.state.sortBy,
        sortOrder: this.state.sortOrder
      })
    });
    //}
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
    JunctionStore.removeChangeListener(
      this._onChange,
      this.state.recordId + "-" + this.props.relation.relationName
    );
  },
  componentDidUpdate: function() {
    if (this.state.tabCheck) {
      this.tabData();
    }
    common.updateErrorImages();
  },
  viewRecord: function(recordId) {
    var org = this.props.org;
    var rootSchema = this.props.relation.relationRefSchema;
    //common.clearMainContent();common.clearLeftContent();
    browserHistory.push(
      linkGenerator.getDetailLink({
        record: {},
        org: org,
        schema: rootSchema,
        recordId: recordId,
        dependentSchema: undefined,
        filters: this.props.filters
      })
    );
  },
  parentView: function() {
    var org = this.props.org;
    var rootSchema = this.props.rootSchema;
    // common.clearMainContent();common.clearLeftContent();
    browserHistory.push(
      linkGenerator.getDetailLink({
        record: this.props.rootRecord,
        org: org,
        schema: rootSchema,
        recordId: this.props.recordId,
        dependentSchema: this.props.dependentSchema
      })
    );
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
    //return (this.state.records.length!=nextState.records.length)
    //return (JSON.stringify(this.state.records)!= JSON.stringify(nextState.records));
  },
  tabData: function() {
    var self = this;
    if (this.state.records.length == 0 && this.relationCount) {
      this.relationCount.className += " hidden";
      if (this.rootNode) {
        this.rootNode.className += " hidden";
      }
    }
    if (
      self.props.tabData != undefined &&
      self.props.showTab != undefined &&
      self.state.records &&
      self.state.records.length > 0
    ) {
      self.setState({ tabCheck: false }, function() {
        self.props.showTab(self.props.tabData);
      });
    } else if (typeof this.props.tabData == "undefined") {
      self.setState({ tabCheck: false });
    }
  },
  createGetRecordsAction: function() {
    var defaultSortBy;
    var defaultSortOrder;
    try {
      defaultSortBy = SchemaStore.get(this.props.relation.relationRefSchema)[
        "@defaultSortBy"
      ];
      defaultSortOrder = SchemaStore.get(this.props.relation.relationRefSchema)[
        "@defaultSortOrder"
      ];
    } catch (err) {}
    ActionCreator.getRelatedRecords({
      recordId: this.state.recordId,
      relationName: this.props.relation.relationName,
      rootSchema: this.props.rootSchema,
      relationRefSchema: this.props.relation.relationRefSchema,
      relationView: this.props.relation.relationView,
      userId: common.getUserDoc().recordId,
      skip: this.state.skip,
      org: this.props.org,
      limit: this.props.limit,
      sortBy: this.state.sortBy ? this.state.sortBy : defaultSortBy,
      sortOrder: this.state.sortOrder ? this.state.sortOrder : defaultSortOrder,
      filters:this.props.relation.filters
    });
  },
  getRecords: function() {
    var self = this;
    common.startLoader();
    WebUtils.doPost(
      "/generic?operation=getRelatedRecords",
      {
        recordId: this.state.recordId,
        relationName: this.props.relation.relationName,
        relationRefSchema: this.props.relation.relationRefSchema,
        skip: this.state.skip,
        userId: common.getUserDoc().recordId,
        rootSchema: this.props.rootSchema,
        limit: this.props.limit,
        org: this.props.org,
        filters:this.props.relation.filters
      },
      function(response) {
        common.stopLoader();
        if (response.error || Array.isArray(response)) {
          return;
        }
        if (!self._isUnmounted)
          self.setState({
            shouldComponentUpdate: true,
            records: response.records
          });
      },
      "ajaxQueue"
    );
  },
  componentDidMount: function() {
    //this.getRecords();
    this.createGetRecordsAction();
    JunctionStore.addChangeListener(
      this._onChange,
      this.state.recordId + "-" + this.props.relation.relationName
    );
    //  var rootSchema=this.props.rootSchema;
    // var currentSchemaName=this.props.relation.relationRefSchema;
    var currentView = this.props.relation.relationView;
    this.tabData();
    if (currentView == "carousel" && this.pagination) {
      this.pagination.className += " hidden";
    }
    common.updateErrorImages();
  },
  scrollToRoot: function() {
    var top = $(this.rootNode).offset().top - 150;
    $("html, body").animate({
      //'scrollTop' : $("."+nav).children().position().top
      scrollTop: top
    });
  },
  increaseSkipCount: function() {
    var limitCountLocal = limitCount;
    if (!isNaN(this.props.limit)) {
      limitCountLocal = this.props.limit * 1;
    }
    var self = this;
    this.setState(
      { shouldComponentUpdate: false, skip: self.state.skip + limitCountLocal },
      function() {
        self.scrollToRoot();
        self.createGetRecordsAction();
        //self.getRecords();
      }
    );
  },
  reduceSkipCount: function() {
    var self = this;
    var limitCountLocal = limitCount;
    if (!isNaN(this.props.limit)) {
      limitCountLocal = this.props.limit * 1;
    }
    if (this.state.skip != 0) {
      this.setState(
        {
          shouldComponentUpdate: false,
          skip:
            this.state.skip - limitCountLocal > 0
              ? this.state.skip - limitCount
              : 0
        },
        function() {
          self.scrollToRoot();
          self.createGetRecordsAction();
          //self.getRecords();
        }
      );
    }
  },
  pageSelected: function() {
    var self = this;
    this.setState(
      {
        shouldComponentUpdate: false,
        skip: this.pageSelect.value * limitCount
      },
      function() {
        self.createGetRecordsAction();
        //self.getRecords();
      }
    );
  },
  render: function() {
    var self = this;
    var currentSchemaName = this.props.relation.relationRefSchema;
    var relationRefSchemaRec = SchemaStore.get(currentSchemaName);
    var currentSchema = relationRefSchemaRec;
    //  	var org=this.props.org;
    var rootSchema = this.props.rootSchema;
    var noOfHops = "one";
    var secondEndKey = "";
    var limitCountLocal = limitCount;
    if (!isNaN(this.props.limit)) {
      limitCountLocal = this.props.limit * 1;
    }
    var secondEndSchema = "";
    var relatedRecHoldingKey = "";
    if (
      relationRefSchemaRec &&
      typeof relationRefSchemaRec["@properties"] == "object"
    ) {
      for (var key in relationRefSchemaRec["@properties"]) {
        try {
          if (
            relationRefSchemaRec["@properties"][key].dataType.type ==
              "object" &&
            relationRefSchemaRec["@properties"][key].dataType.objRef ==
              rootSchema
          ) {
            relatedRecHoldingKey = key;
          }
        } catch (err) {}
      }
    }
    if (currentSchema && currentSchema["@relationDesc"]) {
      if (
        currentSchema["@relationDesc"].toString().indexOf("recordId") > -1 ||
        currentSchema["@relationDesc"].toString().indexOf("org") > -1
      ) {
        noOfHops = "one";
      } else {
        if (Object.keys(currentSchema["@properties"]).length == 2) {
          noOfHops = "two";
        } else {
          noOfHops = "one";
        }
        for (var i = 0; i < currentSchema["@relationDesc"].length; i++) {
          if (
            currentSchema["@relationDesc"][i].split("-")[2] !=
            relatedRecHoldingKey
          ) {
            secondEndKey = currentSchema["@relationDesc"][i].split("-")[2];
            try {
              secondEndSchema =
                currentSchema["@properties"][secondEndKey].dataType.objRef;
            } catch (err) {}
          }
        }
      }
    }
    if (secondEndKey == "likeFor" || secondEndKey == "followee") {
      //secondEndSchema=rootSchema;
    }
    if (secondEndKey == "likedBy" || secondEndKey == "follower") {
      secondEndSchema = "User";
    }
    var currentView = this.props.relation.relationView;
    // var schemaRec=SchemaStore.get(rootSchema);
    var recordCount = 0;
    var style = {};
    if (this.props.relation.style && this.props.relation.style != "") {
      style = getContent.getStyleFromConfig(this.props.relation.style).normal;
    } else if (
      this.props.css != "" &&
      this.props.css != undefined &&
      typeof this.props.css == "string"
    ) {
      style = getContent.getStyleFromConfig(this.props.css).normal;
    }
    var header = "";
    var newRec = Object.assign({}, this.props.rootRecord);
    delete newRec.record_header;
    var relatedHederFromRelation = global.makeHeader(
      newRec,
      self.props.relation.heading,
      "forRelations"
    );
    {
      /*(self.props.relation.showRelated.displayName.trim()!="")?(this.props.rootRecord[schemaRec["@identifier"]]+" "+self.props.relation.showRelated.displayName):""*/
    }
    try {
      header =
        relatedHederFromRelation != "" ? (
          <h2
            ref={input => {
              self["relationCount"] = input;
            }}
            className=""
          >
            {relatedHederFromRelation + "  "}
            <span className={this.props.relation.hideCount ? "hidden" : ""}>
              <junctionCount.JunctionCount
                recordId={self.state.recordId}
                relationName={self.props.relation.relationName}
                withBrackets={true}
              />
            </span>
          </h2>
        ) : (
          <span className={"hidden"}>
            <junctionCount.JunctionCount
              recordId={self.state.recordId}
              relationName={self.props.relation.relationName}
              withBrackets={true}
            />
          </span>
        );
    } catch (err) {}
    return (
      <div
        ref={input => {
          this.rootNode = input;
        }}
        style={style}
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
        key={global.guid()}
      >
        {header}

        {/*
                	(this.state.records.length>0 && self.props.relation.showRelated.displayName!="")?
                    (<div className="uppercase span showRelated"  ref={(e)=>{self.relatedHeading=e}}>
                  	 {this.props.relation.showRelated.displayName+"   "}
               		   {(!this.props.relation.hideCount)?(<junctionCount.JunctionCount recordId={self.state.recordId} relationName={self.props.relation.relationName}/>):("")}
                  	</div>):
                    (<div></div>)
                */}

        {["a"].map(function(a) {
          if (self.state.records && self.state.records.length != 0) {
            if (currentView == "GoDetail") {
              var isJunctionGallery = false;
              try {
                isJunctionGallery =
                  self.props.relation.relationLayout == "junctionGallery";
              } catch (err) {}
              return self.state.records.map(function(data, index) {
                recordCount++;
                if (recordCount <= limitCountLocal) {
                  if (data && data.id != self.state.rootRrecordId) {
                    var height =
                      self.props.relation.relationHeight != undefined
                        ? self.props.relation.relationHeight + "px"
                        : "auto";
                    var header = undefined;
                    if (self.props.relation.linkHeading) {
                      var link = (
                        <Link
                          to={linkGenerator.getDetailLink({
                            record: data.value,
                            org: self.props.org,
                            schema: currentSchemaName,
                            recordId: data.id
                          })}
                        >
                          {self.props.relation.linkHeading.displayName}
                        </Link>
                      );
                      if (self.props.relation.linkHeading.iconClass) {
                        //titlebkp={self.props.relation.linkHeading.iconClassTitle?self.props.relation.linkHeading.iconClassTitle:self.props.relation.linkHeading.displayName}
                        header = (
                          <div className="buttonWidth">
                            <Link
                              to={linkGenerator.getDetailLink({
                                record: data.value,
                                org: self.props.org,
                                schema: currentSchemaName,
                                recordId: data.id
                              })}
                            >
                              <div className="iconHeight">
                                <i
                                  className={
                                    self.props.relation.linkHeading[
                                      "iconClass"
                                    ] + " newCustomIcon"
                                  }
                                />
                              </div>
                              <div className="newCustomButton">
                                {self.props.relation.linkHeading.displayName}
                              </div>
                            </Link>
                          </div>
                        );
                      } else if (self.props.relation.linkHeading.css) {
                        header = (
                          <div
                            style={utility.getReactStyles(
                              self.props.relation.linkHeading.css
                            )}
                          >
                            {link}
                          </div>
                        );
                      } else {
                        header = <h2 className="h2">{link}</h2>;
                      }
                    }
                    var rrgid = (
                      <GoIntoDetail
                        key={global.guid()}
                        header={header}
                        iconClass={
                          self.props.relation &&
                          self.props.relation.linkHeading &&
                          self.props.relation.linkHeading.iconClass
                            ? true
                            : false
                        }
                        summary={
                          self.props.relation && self.props.relation.linkHeading
                            ? true
                            : false
                        }
                        refreshRecord={true}
                        viewName={
                          self.props.relation && self.props.relation.detailView
                            ? self.props.relation.detailView
                            : undefined
                        }
                        showingForRelatedViewOf={rootSchema}
                        noDetail={false}
                        showingForRelatedViewOfRecordId={
                          self.props.showingForRelatedViewOfRecordId +
                          self.state.recordId
                        }
                        rootSchema={currentSchemaName}
                        recordId={data.id}
                        record={data}
                        org={self.props.org}
                        fromPopUp={self.props.fromPopUp}
                        contentDivId={self.props.contentDivId}
                        noBreadCrumb={true}
                        junctionGallery={isJunctionGallery ? "yes" : undefined}
                        height={isJunctionGallery ? height : undefined}
                      />
                    );
                    if (isJunctionGallery) {
                      return rrgid;
                    } else {
                      return (
                        <div
                          key={global.guid()}
                          className={"margin-bottom-top-gap-sm "}
                        >
                          {rrgid}
                        </div>
                      );
                    }
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              });
            } else if (currentView == "TableEditView") {
              return (
                <div key={global.guid()} className="margin-bottom-gap-sm">
                  <Table
                    key={global.guid()}
                    hideInlineEdit={self.props.hideInlineEdit}
                    org={self.props.org}
                    records={self.state.records}
                    viewName={self.props.relation.summaryView}
                    rootSchema={self.props.relation.relationRefSchema}
                    schemaDoc={relationRefSchemaRec}
                    setSortBy={self.setSortBy}
                    sortStatus={{
                      by: self.state.sortBy,
                      order: self.state.sortOrder
                    }}
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId +
                      self.state.recordId
                    }
                  />
                </div>
              );
            } else if (currentView == "CarouselGallery") {
              return (
                <search.CarouselGallery
                  key={global.guid()}
                  data={self.state.records}
                  viewName={self.props.relation.summaryView}
                  org={self.props.org}
                  fromRelatedRecords={"true"}
                  fromRelation={self.props.relation.fromRelation}
                  rootSchema={self.props.relation.relationRefSchema}
                  schemaDoc={relationRefSchemaRec}
                  showingForRelatedViewOfRecordId={
                    self.props.showingForRelatedViewOfRecordId +
                    self.state.recordId
                  }
                  summary={self.props.summary}
                  parentLayout={self.props.parentLayout}
                  css={self.props.css}
                  mainRootSchema={self.props.rootSchema}
                  dependentSchema={self.props.dependentSchema}
                  mainSchemaDoc={self.props.schemaDoc}
                  recordId={self.props.recordId}
                  relation={self.props.relation}
                  increaseSkipCount={
                    self.state.records != null &&
                    self.state.records.length > limitCountLocal
                      ? self.increaseSkipCount
                      : undefined
                  }
                  reduceSkipCount={
                    self.state.skip >= limitCountLocal
                      ? self.reduceSkipCount
                      : undefined
                  }
                  limit={limitCountLocal}
                  rootRecord={self.props.rootRecord}
                />
              );
            } else if (
              currentView == "carousel" &&
              noOfHops == "one" &&
              self.props.parentLayout != "gallery" &&
              self.props.parentLayout != "table"
            ) {
              var galleryImages = [];
              self.state.records.map(function(record) {
                recordCount++;
                if (recordCount <= limitCount) {
                  try {
                    if (
                      record &&
                      record.value &&
                      Object.keys(record.value).length > 0
                    ) {
                      Object.keys(record.value).forEach(function(key) {
                        try {
                          if (
                            relationRefSchemaRec["@properties"][key].dataType
                              .type == "image" ||
                            relationRefSchemaRec["@properties"][key].dataType
                              .type == "images" ||
                            relationRefSchemaRec["@properties"][key].dataType
                              .type == "dndImage"
                          ) {
                            if (record.value[key]) {
                              record.value[key].forEach(function(imageJson) {
                                var image = imageJson;
                                var tempPath = "";
                                if (image.cloudinaryId.indexOf("http") != 0) {
                                  image.cloudinaryId =
                                    "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/" +
                                    image.cloudinaryId +
                                    ".jpg";
                                } else if (
                                  image.cloudinaryId.indexOf("h_") ||
                                  image.cloudinaryId.indexOf("w_")
                                ) {
                                  tempPath =
                                    image.cloudinaryId.substr(
                                      0,
                                      image.cloudinaryId.indexOf("/upload/") + 8
                                    ) +
                                    image.cloudinaryId.substr(
                                      image.cloudinaryId.indexOf("/v"),
                                      image.cloudinaryId.length
                                    );
                                  image.cloudinaryId = tempPath;
                                }
                                height = relationRefSchemaRec["@properties"][
                                  key
                                ].dataType.height
                                  ? relationRefSchemaRec["@properties"][key]
                                      .dataType.height
                                  : "500";
                                width = relationRefSchemaRec["@properties"][key]
                                  .dataType.width
                                  ? relationRefSchemaRec["@properties"][key]
                                      .dataType.width
                                  : "750";
                                var hei = height * 1 == 0 ? "" : "h_" + height;
                                var wdt = width * 1 == 0 ? "" : "w_" + width;
                                var path = hei + (hei == "" ? "" : ",") + wdt;
                                if (
                                  image.cloudinaryId.indexOf("https") != 0 &&
                                  image.cloudinaryId.indexOf("http") != 0
                                ) {
                                  image.cloudinaryId =
                                    "https://res.cloudinary.com/dzd0mlvkl/image/upload/" +
                                    path +
                                    ",c_pad " +
                                    "/v1623462816/" +
                                    image.cloudinaryId +
                                    ".jpg";
                                } else if (
                                  image.cloudinaryId.indexOf("/h_") == -1 &&
                                  image.cloudinaryId.indexOf(",w_") == -1
                                ) {
                                  tempPath =
                                    image.cloudinaryId.substr(
                                      0,
                                      image.cloudinaryId.indexOf("/upload/") + 8
                                    ) +
                                    path +
                                    ",c_pad" +
                                    "/" +
                                    image.cloudinaryId.substr(
                                      image.cloudinaryId.indexOf("/upload/") +
                                        8,
                                      image.cloudinaryId.length
                                    );
                                  image.cloudinaryId = tempPath;
                                } else {
                                  console.log(
                                    "image.cloudinaryId" + "invalid image "
                                  );
                                }
                                var temp = {};
                                temp["url"] = image.cloudinaryId;

                                temp["id"] = record.id;
                                temp["caption"] = image.caption;
                                galleryImages.push(temp);
                              });
                            }
                          }
                        } catch (err) {}
                      });
                    }
                  } catch (err) {
                    console.log(
                      "Error in Related records gallery or courasal " + err
                    );
                  }
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              });
              if (galleryImages.length > 0) {
                return (
                  <div
                    key={global.guid()}
                    className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm"
                  >
                    <Carousel.ImageGallery
                      reduceSkipCount={self.reduceSkipCount}
                      noDetail={self.props.noDetail}
                      increaseSkipCount={self.increaseSkipCount}
                      images={galleryImages}
                      imageHeight={height}
                      imageWidth={width}
                      viewRecord={self.viewRecord}
                    />
                  </div>
                );
              } else {
                return <div key={global.guid()} className="hidden" />;
              }
            } else {
              return (
                <div key={global.guid()}>
                  {self.state.records.map(function(data, index) {
                    var linkRel = ""; //"nofollow";
                    if (
                      data &&
                      typeof data.value != "undefined" &&
                      data.value.webCrawlerIndex
                    ) {
                      linkRel = "";
                    }
                    var relHeader = global.makeHeader(
                      data && data.value ? data.value : undefined,
                      currentSchema.heading
                    );
                    var subHeading =
                      relHeader != "" ? (
                        <h3 itemProp="name" className="propertyName">
                          <Link
                            rel={linkRel}
                            to={linkGenerator.getDetailLink({
                              record: data.value,
                              org: self.props.org,
                              schema: currentSchemaName,
                              recordId: data.id
                            })}
                          >
                            {relHeader}
                          </Link>
                        </h3>
                      ) : (
                        ""
                      );
                    recordCount++;
                    if (recordCount <= limitCountLocal) {
                      if (data && data.id != self.state.rootRecordId) {
                        {
                          /*onClick={self.viewRecord.bind(null,data.id)}                 fromRelation={"relation"} */
                        }
                        var viewName = getDefaultSummaryView(
                          undefined,
                          currentSchema
                        );
                        try {
                          if (
                            currentSchema["@operations"]["read"][currentView]
                          ) {
                            viewName = currentView;
                          }
                        } catch (err) {}

                        if (
                          noOfHops == "one" &&
                          self.props.parentLayout != "gallery"
                        ) {
                          return (
                            <GoIntoDetail
                              key={global.guid()}
                              summary={true}
                              noDetail={self.props.noDetail}
                              viewName={viewName}
                              header={subHeading}
                              from={self.props.relation}
                              showingForRelatedViewOfRecordId={
                                self.props.showingForRelatedViewOfRecordId +
                                self.state.recordId
                              }
                              parentLayout={self.props.parentLayout}
                              rootSchema={currentSchemaName}
                              record={Object.assign({}, data)}
                              recordId={data.id}
                              org={self.props.org}
                            />
                          );
                        } else if (
                          noOfHops == "one" &&
                          self.props.parentLayout == "gallery"
                        ) {
                          if (index == 0) {
                            var onclick = "";
                            if (self.props.relation.showParentOnly) {
                              onclick = self.parentView;
                            }
                            return (
                              <GoIntoDetail
                                key={global.guid()}
                                summary={true}
                                header={subHeading}
                                parentView={onclick}
                                noDetail={
                                  typeof self.props.noDetail != "undefined"
                                    ? self.props.noDetail
                                    : onclick == ""
                                      ? false
                                      : true
                                }
                                viewName={viewName}
                                from={self.props.relation}
                                parentLayout={self.props.parentLayout}
                                showingForRelatedViewOfRecordId={
                                  self.props.showingForRelatedViewOfRecordId +
                                  self.state.recordId
                                }
                                rootSchema={currentSchemaName}
                                record={Object.assign({}, data)}
                                recordId={data.id}
                                org={self.props.org}
                              />
                            );
                          } else {
                            return (
                              <div key={global.guid()} className="hidden" />
                            );
                          }
                        } else {
                          if (currentSchemaName == "Like") {
                            return (
                              <span key={global.guid()} className="form-group">
                                <common.UserIcon
                                  id={data.value.likedBy}
                                  org={self.props.org}
                                  rootSchema={"User"}
                                />
                              </span>
                            );
                          } else if (currentSchemaName == "Follow") {
                            {
                              /*return <span key={global.guid()} className="form-group"><common.UserIcon    id={data.value.follower} org={self.props.org}   rootSchema={"User"}/></span>*/
                            }
                          } else {
                            if (
                              self.props.showingForRelatedViewOfRecordId &&
                              self.props.showingForRelatedViewOfRecordId.indexOf(
                                data.value[secondEndKey]
                              ) != -1
                            ) {
                              return <span key={global.guid()} />;
                            } else {
                              return (
                                <span
                                  key={global.guid()}
                                  className="form-group extra-padding-right"
                                >
                                  <span
                                    onClick={self.viewRecord.bind(
                                      null,
                                      data.id
                                    )}
                                    className={"dlink"}
                                  >
                                    {relHeader ? (
                                      <h3 className="h3 propertyName link">
                                        {relHeader}
                                      </h3>
                                    ) : (
                                      <img
                                        src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_30,w_30/v1484565104/link.png"
                                        style={{
                                          width: "20px",
                                          height: "20px"
                                        }}
                                        alt={"Link"}
                                        className="pointer"
                                      />
                                    )}
                                  </span>
                                  {/*subHeading*/}
                                  <common.UserIcon
                                    showingForRelatedViewOf={rootSchema}
                                    showingForRelatedViewOfRecordId={
                                      self.props
                                        .showingForRelatedViewOfRecordId +
                                      self.state.recordId
                                    }
                                    id={data.value[secondEndKey]}
                                    org={self.props.org}
                                    rootSchema={secondEndSchema}
                                    noDetail={self.props.noDetail}
                                  />
                                  {/*viewName={self.props.relation.viewName?self.props.relation.viewName:"getSummary"}*/}
                                </span>
                              );
                            }
                          }
                        }
                      } else {
                        return <div key={global.guid()} className="hidden" />;
                      }
                    } else {
                      return <div key={global.guid()} className="hidden" />;
                    }
                  })}
                </div>
              );
            }
            /*   return (<div key={global.guid()}>
                                  {
                	                 	self.state.records.map(function(record){
                	                 		return <div key={global.guid()} >{record.id}</div>
                	                 	})
                	                }
                                  </div>)*/
          } else {
            return <div key={global.guid()} className="hidden" />;
          }
        })}
        {currentView != "CarouselGallery" ? (
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  remove-margin-top"
            ref={e => {
              self.pagination = e;
            }}
          >
            {self.props.parentLayout && self.props.parentLayout == "gallery" ? (
              <div className="hidden" />
            ) : (
              <div className="pull-right">
                {self.state.skip >= limitCountLocal ? (
                  <div
                    className="link display-table-cell extra-padding-right "
                    onClick={self.reduceSkipCount}
                  >
                    <div className="child-img-component no-padding">
                      <i
                        ref={input => {
                          self.moveBack = input;
                        }}
                        className="sleekIcon-leftarrow fa-2x nextPrevIcons"
                      />
                    </div>
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">PREV</span>
                    </div>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </div>
                ) : (
                  <span />
                )}

                {JunctionCountStore.getRelatedCount(
                  self.state.recordId,
                  self.props.relation.relationName
                ) &&
                JunctionCountStore.getRelatedCount(
                  self.state.recordId,
                  self.props.relation.relationName
                ) > limitCountLocal ? (
                  <div className="link display-table-cell extra-padding-right vertical-align-top">
                    <select
                      className="form-control"
                      ref={select => {
                        self.pageSelect = select;
                      }}
                      onChange={self.pageSelected}
                      defaultValue={Math.floor(
                        self.state.skip / limitCountLocal
                      )}
                      key={global.guid()}
                    >
                      <option value={0}>1</option>
                      {[1].map(function() {
                        var options = [];
                        for (
                          var si = 1;
                          si <
                          JunctionCountStore.getRelatedCount(
                            self.state.recordId,
                            self.props.relation.relationName
                          ) /
                            limitCountLocal;
                          si++
                        ) {
                          options.push(
                            <option key={global.guid()} value={si * 1}>
                              {si + 1}
                            </option>
                          );
                        }
                        return options;
                      })}
                    </select>
                  </div>
                ) : (
                  <span className="hidden" />
                )}

                {self.state.records != null &&
                self.state.records.length > limitCountLocal ? (
                  <div
                    className="link display-table-cell"
                    onClick={self.increaseSkipCount}
                  >
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">NEXT</span>
                    </div>
                    <div className="child-img-component no-padding">
                      <i
                        ref={input => {
                          self.moveForward = input;
                        }}
                        className="sleekIcon-rightarrow fa-2x nextPrevIcons "
                      />
                    </div>
                  </div>
                ) : (
                  <span />
                )}
              </div>
            )}
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
});
exports.RelatedRecords = RelatedRecords;

var JunctionGallery = React.createClass({
  render: function() {
    var self = this;
    var schemaRec = SchemaStore.get(self.props.rootSchema);
    var oneRecord = "";
    //	var marginGap=self.props.methods.length>0?"margin-bottom-gap":"a";
    var relatedSchemas = Array.isArray(self.props.relatedSchemas)
      ? self.props.relatedSchemas
      : [];
    return (
      <div
        className="col-lg-2 col-md-2 col-sm-4 col-xs-12 wishList"
        style={{ height: self.props.height ? self.props.height : "auto" }}
      >
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left">
          {Object.keys(self.props.data).map(function(key) {
            if (
              self.props.showingForRelatedViewOfRecordId &&
              self.props.showingForRelatedViewOfRecordId.indexOf(
                self.props.data[key]
              ) > -1
            ) {
              oneRecord = "true";
              return <div key={global.guid()} className="hidden" />;
            } else {
              if (
                schemaRec &&
                schemaRec["@properties"] &&
                schemaRec["@properties"][key] &&
                schemaRec["@properties"][key].dataType &&
                schemaRec["@properties"][key].dataType.objRef
              ) {
                return (
                  <common.UserIcon
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId +
                      self.props.recordId
                    }
                    fromRelation={self.props.fromRelation}
                    key={global.guid()}
                    id={self.props.data[key]}
                    noGallery={"yes"}
                    org={self.props.org}
                    rootSchema={schemaRec["@properties"][key].dataType.objRef}
                  />
                );
              } else {
                return (
                  <GenericLayout
                    noGallery={"yes"}
                    hideInlineEdit={self.props.hideInlineEdit}
                    from={"search"}
                    fromTable={self.props.fromTable}
                    key={global.guid()}
                    singleCol={key}
                    rootSchema={self.props.rootSchema}
                    dependentSchema={self.props.dependentSchema}
                    relatedSchemas={self.props.relatedSchemas}
                    data={self.props.data}
                    recordId={self.props.recordId}
                    org={self.props.org}
                    methods={self.props.methods}
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId +
                      self.props.recordId
                    }
                  />
                );
              }
            }
          })}
        </div>
        <div
          className={
            "text-center col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left "
          }
        >
          {relatedSchemas.map(function(rlschema) {
            var relationkey = "";
            for (var rlkey in schemaRec["@relations"]) {
              if (
                schemaRec["@relations"][rlkey].relationRefSchema == rlschema
              ) {
                relationkey = rlkey;
              }
            }
            return (
              <GenericLayout
                key={global.guid()}
                hideInlineEdit={self.props.hideInlineEditActionCreator}
                singleCol={"$" + relationkey}
                rootSchema={self.props.rootSchema}
                relatedSchemas={self.props.relatedSchemas}
                data={self.props.data}
                recordId={self.props.recordId}
                org={self.props.org}
                methods={self.props.methods}
                showingForRelatedViewOfRecordId={
                  self.props.showingForRelatedViewOfRecordId +
                  self.props.recordId
                }
              />
            );
          })}
        </div>
        <div
          className={
            "text-center col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left wishRemove"
          }
        >
          {["a"].map(function(temp) {
            var locMethods = Array.isArray(self.props.methods)
              ? self.props.methods
              : [];
            if (oneRecord == "true" && self.props.data.length == 1) {
              //do nothing
            } else {
              return locMethods.map(function(method) {
                return (
                  <GenericLayout
                    fromTable={self.props.fromTable}
                    hideInlineEdit={self.props.hideInlineEdit}
                    key={global.guid()}
                    singleCol={"#" + method}
                    rootSchema={self.props.rootSchema}
                    dependentSchema={self.props.dependentSchema}
                    relatedSchemas={self.props.relatedSchemas}
                    data={self.props.data}
                    recordId={self.props.recordId}
                    org={self.props.org}
                    methods={self.props.methods}
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId
                    }
                  />
                );
              });
            }
          })}
        </div>
      </div>
    );
  }
});

var Table = React.createClass({
  getInitialState: function() {
    var schemaRec = this.props.schemaDoc;
    if (!schemaRec) {
      schemaRec = SchemaStore.get(this.props.rootSchema);
    }
    var columns = {};
    try {
      var propsToShow = {};
      var actualPrivilegedProps = [];
      if (this.props.struct) {
        propsToShow = Object.keys(schemaRec["@properties"]);
        actualPrivilegedProps = Object.keys(schemaRec["@properties"]);
      } else {
        propsToShow =
          schemaRec["@operations"]["read"][this.props.viewName].UILayout.layout;
        actualPrivilegedProps =
          schemaRec["@operations"]["read"][
            common.getSchemaRoleOnOrg(this.props.rootSchema, this.props.org)
              .detailView
          ].out;
      }
      for (var index in propsToShow) {
        if (actualPrivilegedProps.indexOf(propsToShow[index]) != -1) {
          var displayName = "";
          try {
            if (
              schemaRec["@properties"][propsToShow[index]] &&
              schemaRec["@properties"][propsToShow[index]].displayName
            ) {
              displayName =
                schemaRec["@properties"][propsToShow[index]].displayName;
            } else if (
              schemaRec["@sysProperties"][propsToShow[index]] &&
              schemaRec["@sysProperties"][propsToShow[index]].displayName
            ) {
              displayName =
                schemaRec["@sysProperties"][propsToShow[index]].displayName;
            } else if (
              schemaRec["@metaData"] &&
              schemaRec["@metaData"][propsToShow[index]] &&
              schemaRec["@metaData"][propsToShow[index]].displayName
            ) {
              displayName =
                schemaRec["@metaData"][propsToShow[index]].displayName;
            }
          } catch (err) {
            displayName = propsToShow[index];
          }
          columns[propsToShow[index]] = {
            displayName: displayName,
            show: true
          };
        }
      }
    } catch (err) {
      console.log(err.name + " " + err.message);
    }

    var width = 1200;
    try {
      width = $(window).width();
    } catch (err) {}
    var colSize = 0;
    var visibleCount = 0;
    /*if(width>1200){
			colSize=2;
			visibleCount=6;
		}else*/ if (width > 1032) {
      colSize = 3;
      visibleCount = 4;
    } else if (width > 768) {
      colSize = 4;
      visibleCount = 3;
      /*}else if(width > 480 && width < 768 ){
			colSize=6;
			visibleCount=2;
		}*/
    } else {
      colSize = 6;
      visibleCount = 2;
    }
    var colLen = Object.keys(columns).length;
    if (colLen > 0 && colLen < visibleCount) {
      if (colLen <= 2) {
        colSize = 6;
        visibleCount = 2;
      } else if (colLen == 3) {
        colSize = 4;
        visibleCount = 3;
      } else if (colLen == 4) {
        colSize = 3;
        visibleCount = 4;
      }
    }
    return {
      count: 0,
      colSize: colSize,
      visibleCount: visibleCount,
      columns: columns,
      records: this.props.records,
      shouldComponentUpdate: false
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  setSortBy: function(key) {
    if (this.props.setSortBy) this.props.setSortBy(key);
  },
  edit: function(record, index) {
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
        alignMiddleDiv={true}
        contentDivId={contentDivId}
        sideDivId={sideDivId}
      />,
      node
    );
    JunctionStore.clearJunctionsForRecord(this.state.records[index].id);
    ReactDOM.render(
      <GoIntoDetail
        fromRelation={"relation"}
        target={node}
        fromTable={"table"}
        rootSchema={this.props.rootSchema}
        dependentSchema={this.props.dependentSchema}
        recordId={record.id}
        org={this.props.org}
        fromPopUp={popUpId}
        contentDivId={contentDivId}
      />,
      document.getElementById(contentDivId)
    );
  },
  increaseCount: function() {
    var self = this;
    var count = this.state.count + 1;
    this.setState({ count: count, shouldComponentUpdate: false }, function() {
      var colSize = this.state.colSize;
      try {
        for (var j = 0; j < self.state.records.length; j++) {
          for (var i = 1; i < this.columnsToShow().length; i++) {
            if (self["data" + i + "" + j]) {
              if (i >= count + 1 && i < count + self.state.visibleCount) {
                self["column" + i].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  th";
                self["data" + i + j].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  td";
              } else {
                self["column" + i].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  th hidden";
                self["data" + i + j].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  td hidden";
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
      self.checkPagination();
    });

    /*
		var self=this;
		var count=this.state.count+1;
		var colSize=this.state.colSize;
		this.setState({count:count},function(){
			for(var j=0;j < self.state.records.length;j++){
				for(var i=1;i< Object.keys(self.state.columns).length;i++){
					if( i>=self.state.count+1 && i< self.state.count+self.state.visibleCount){
						self["column"+i].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  th";
						self["data"+i+j].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  td";
					}else{
						self["column"+i].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  th hidden";
						self["data"+i+j].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  td hidden";
					}
				}
			}
			self.checkPagination();
		})*/
  },
  componentDidMount: function() {
    this.checkPagination();
    try {
      guide("Guide-Tableview");
    } catch (err) {}
  },
  reduceCount: function() {
    var self = this;
    var count = this.state.count - 1;
    if (count < 0) {
      count = 0;
    }
    this.setState({ count: count, shouldComponentUpdate: false }, function() {
      var colSize = this.state.colSize;
      try {
        for (var j = 0; j < self.state.records.length; j++) {
          for (var i = 1; i < this.columnsToShow().length; i++) {
            if (self["data" + i + "" + j]) {
              if (i >= count + 1 && i < count + self.state.visibleCount) {
                self["column" + i].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  th";
                self["data" + i + j].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  td";
              } else {
                self["column" + i].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  th hidden";
                self["data" + i + j].className =
                  "col-lg-" +
                  colSize +
                  " col-md-" +
                  colSize +
                  " col-sm-" +
                  colSize +
                  "  col-xs-" +
                  colSize +
                  "  td hidden";
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
      self.checkPagination();
    });

    /*
		var self=this;
		var count=this.state.count-1;
		var colSize=this.state.colSize;
		this.setState({count:count},function(){
			for(var j=0;j < self.state.records.length;j++){
				for(var i=1;i< Object.keys(self.state.columns).length;i++){
					if( i>=self.state.count+1 && i< self.state.count+self.state.visibleCount){
						self["column"+i].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  th";
						self["data"+i+j].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  td";
					}else{
						self["column"+i].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  th hidden";
						self["data"+i+j].className="col-lg-"+colSize+" col-md-"+colSize+" col-sm-"+colSize+"  col-xs-"+colSize+"  td hidden";
					}
				}
			}
			self.checkPagination();
		})*/
  },
  checkPagination: function(value) {
    var forward = false;
    var backward = false;
    var count = this.state.count;
    var columnsToShow = this.columnsToShow();
    if (count + this.state.visibleCount < columnsToShow.length) {
      this.moveForward.className =
        "sleekIcon-rightarrow fa-2x nextPrevIcons link pointer ";
    } else {
      forward = true;
      this.moveForward.className =
        "sleekIcon-rightarrow fa-2x nextPrevIcons lightgrey pointer-events";
    }
    if (count > 0) {
      this.moveBack.className =
        "sleekIcon-leftarrow fa-2x nextPrevIcons link pointer";
    } else {
      backward = true;
      this.moveBack.className =
        "sleekIcon-leftarrow fa-2x nextPrevIcons lightgrey pointer-events";
    }
    if (forward && backward) {
      this.paginationBack.className = "hidden";
      this.paginationForward.className = "hidden";
      this.paginationEllipsis.className =
        "display-inline-block vertical-align-middle extra-padding-right dataToggle pull-right " +
        (value != undefined ? "open" : "");
    } else {
      this.paginationEllipsis.className =
        "display-inline-block pull-right vertical-align-middle dataToggle " +
        (value != undefined ? "open" : "");
      this.paginationBack.className =
        "display-inline-block vertical-align-middle";
      this.paginationForward.className =
        "display-inline-block vertical-align-middle extra-padding-right";
    }
    common.stopLoader();
    /*common.startLoader();
		if(this.state.count+this.state.visibleCount < Object.keys(this.state.columns).length){
			this.moveForward.className="sleekIcon-rightarrow fa-2x nextPrevIcons"
		}else{
			this.moveForward.className="sleekIcon-rightarrow fa-2x nextPrevIcons hidden"
		}
		if(this.state.count > 0){
			this.moveBack.className="sleekIcon-leftarrow fa-2x nextPrevIcons"
		}else{
			this.moveBack.className="sleekIcon-leftarrow fa-2x nextPrevIcons link hidden"
		}
		common.stopLoader();*/
  },
  setPropsToShow: function(props) {
    //var props=$(this.selectBox).val();
    var flag = false;
    var currentColumns = this.state.columns;
    for (var key in currentColumns) {
      if (props.indexOf(key) > -1) {
        flag = true;
        currentColumns[key].show = true;
      } else {
        currentColumns[key].show = false;
      }
    }

    if (!flag) {
      currentColumns[Object.keys(currentColumns)[0]].show = true;
    }

    var self = this;
    this.setState(
      { count: 0, columns: currentColumns, shouldComponentUpdate: true },
      function() {
        self.checkPagination("open");
      }
    );
  },
  updateRecord: function(record) {
    try {
      var recIndex = undefined;
      for (var index in this.state.records) {
        if (this.state.records[index].id == record.id) {
          recIndex = index;
          break;
        }
      }
      if (recIndex != undefined) {
        var curRecs = this.state.records;
        curRecs[recIndex] = record;
        this.setState({ records: curRecs, shouldComponentUpdate: true });
      }
    } catch (err) {}
  },
  updateRecordWithMethod: function(recId, method) {
    if (method == "#HardDelete") {
      var recIndex = undefined;
      for (var index in this.state.records) {
        if (this.state.records[index].id == recId) {
          recIndex = index;
          break;
        }
      }
      if (recIndex != undefined) {
        var curRecs = this.state.records;
        curRecs.splice(recIndex, recIndex + 1);
        this.setState({ records: curRecs, shouldComponentUpdate: true });
      }
    }
  },
  showMoreRow: function(index) {
    if ($(this["moreRow" + index]).hasClass("hidden")) {
      $(this["moreRow" + index]).removeClass("hidden");
    } else {
      $(this["moreRow" + index]).addClass("hidden");
    }
  },
  showColumnSelectionDiv: function() {
    if ($(this["columnSelectionDiv"]).hasClass("hidden")) {
      $(this["columnSelectionDiv"]).removeClass("hidden");
    } else {
      $(this["columnSelectionDiv"]).addClass("hidden");
    }
  },
  columnsToShow: function() {
    var columnsToShow = [];
    for (var key in this.state.columns) {
      if (this.state.columns[key].show) {
        columnsToShow.push(key);
      }
    }
    return columnsToShow;
  },
  moreActionsToDoDiv:function(moreActionsToDo,fullLayout,schemaRec,record,viewName){
    var self=this;
    return moreActionsToDo.map(function(singleCol) {
      return (
        <GenericLayout
          key={global.guid()}
          singleCol={singleCol}
          fullLayout={fullLayout}
          schemaDoc={schemaRec}
          data={record.value}
          viewName={viewName}
          updateRecord={self.updateRecord}
          updateRecordWithMethod={self.updateRecordWithMethod.bind(
            null,
            record.id,
            singleCol
          )}
          methods={record.methods}
          relatedSchemas={record.relatedSchemas}
          rootSchema={self.props.rootSchema}
          dependentSchema={self.props.dependentSchema}
          recordId={record.id}
          org={self.props.org}
          from={"table"}
          showingForRelatedViewOfRecordId={
            self.props.showingForRelatedViewOfRecordId
          }
        />
      );
    })
  },
  render: function() {
    var self = this;
    //		var divLength=3;
    var colSize = this.state.colSize;
    var schemaRec = this.props.schemaDoc;
    var viewName = "quickView";
    var fullLayout = undefined;
    var moreActions = [];
    var mobile=($(".navbar-toggle").height() > 0)?true:false;
    try {
      if (schemaRec["@operations"]["read"][self.props.viewName]) {
        viewName = self.props.viewName;
      }
      fullLayout = schemaRec["@operations"]["read"][viewName].UILayout;
      moreActions =
        schemaRec["@operations"]["read"][this.props.viewName].UILayout
          .moreActions;
    } catch (err) {}
    if (!moreActions) {
      moreActions = [];
    }
    var mobile=($(".navbar-toggle").height() > 0)?true:false;
    var columnsToShow = this.columnsToShow();
    return (
      <div className="pure-table pure-table-striped col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left">
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding line-xs form-group">
          <div className="col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding thead  margin-bottom-gap">
            {columnsToShow.map(function(column, index) {
              var sortColumn = column;
              if (
                schemaRec["@sortBindings"] &&
                schemaRec["@sortBindings"][column]
              ) {
                sortColumn = schemaRec["@sortBindings"][column];
              }
              var displayName = self.state.columns[column].displayName;
              var header = (
                <div className="parent-img-component">
                  <div
                    className="child-img-component pointer text-capitalize"
                    onClick={self.setSortBy.bind(null, column)}
                  >
                    {displayName.toLowerCase()}
                  </div>
                  <div className="child-img-component ">
                    {self.props.sortStatus &&
                    (self.props.sortStatus.by == sortColumn ||
                      self.props.sortStatus.by == column) ? (
                      self.props.sortStatus.order == "ascend" ? (
                        <div className="icons8-sort-up fa-x" />
                      ) : (
                        <div className="icons8-sort-down fa-x" />
                      )
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              );
              if (index < self.state.visibleCount) {
                if (index == 0) {
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "col-lg-" +
                        colSize +
                        " col-md-" +
                        colSize +
                        " col-sm-" +
                        colSize +
                        "  col-xs-" +
                        colSize +
                        "  th"
                      }
                    >
                      {header}
                    </div>
                  );
                }
                return (
                  <div
                    key={global.guid()}
                    ref={d => {
                      self["column" + index] = d;
                    }}
                    className={
                      "col-lg-" +
                      colSize +
                      " col-md-" +
                      colSize +
                      " col-sm-" +
                      colSize +
                      "  col-xs-" +
                      colSize +
                      "  th"
                    }
                  >
                    {header}
                  </div>
                );
              } else {
                return (
                  <div
                    key={global.guid()}
                    ref={d => {
                      self["column" + index] = d;
                    }}
                    className={
                      "col-lg-" +
                      colSize +
                      " col-md-" +
                      colSize +
                      " col-sm-" +
                      colSize +
                      "  col-xs-" +
                      colSize +
                      "  th hidden"
                    }
                  >
                    {header}
                  </div>
                );
              }
            })}
          </div>

          <div className={" margin-bottom-gap col-lg-2 col-sm-3 col-md-3 col-xs-12 no-padding "+(mobile?" text-right ":"pull-right")}>
            <div
              className="link display-inline-block"
              ref={input => {
                self.paginationBack = input;
              }}
            >
              <i
                ref={input => {
                  self.moveBack = input;
                }}
                className="sleekIcon-leftarrow fa-2x nextPrevIcons hidden"
                onClick={this.reduceCount}
              />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
            <div
              className="link display-inline-block"
              ref={input => {
                self.paginationForward = input;
              }}
            >
              <i
                ref={input => {
                  self.moveForward = input;
                }}
                className="sleekIcon-rightarrow fa-2x nextPrevIcons "
                onClick={this.increaseCount}
              >
                {""}
              </i>
            </div>

            <div
              className={"link display-inline-block"+(mobile?"":"pull-right")}
              title={"Select columns"}
              ref={input => {
                self.paginationEllipsis = input;
              }}
              style={{ position: "relative", paddingTop: "1px" }}>
              <a
                data-toggle="dropdown"
                className="dropdown-toggle"
                aria-expanded="false"
              >
                <span className=" icons8-view-column newCustomIcon link pointer pull-right" />
              </a>
              <ul
                style={{ right: "10px", left: "auto", padding: "10px" }}
                className="dropdown-menu arrow_box"
              >
                <manageRecords.CustomMultiPickList
                  checkBoxPosition={"right"}
                  onChange={self.setPropsToShow}
                  optionsType="object"
                  options={self.state.columns}
                  displayName={"displayName"}
                  defaultValue={columnsToShow}
                  minSelect={1}
                />
              </ul>
            </div>
          </div>
        </div>
        <div
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding line hidden text-right"
          ref={e => {
            self.columnSelectionDiv = e;
          }}
        >
          <manageRecords.CustomMultiPickList
            onChange={self.setPropsToShow}
            optionsType="object"
            options={self.state.columns}
            displayName={"displayName"}
            defaultValue={columnsToShow}
            minSelect={1}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding tbody">
          {this.state.records.map(function(record, index1) {
            var detailLink = linkGenerator.getDetailLink({
              record: record.value,
              org: self.props.org,
              schema: self.props.rootSchema,
              recordId: record.id,
              dependentSchema: self.props.dependentSchema
            });
            var moreActionsToDo = [];
            for (var i = 0; i < moreActions.length; i++) {
              if (
                getMethodExecutePrivilegeOnorgSchema(
                  self.props.org,
                  schemaRec,
                  record.value,
                  moreActions[i].substr(1)
                )
              ) {
                moreActionsToDo.push(moreActions[i]);
              }
            }
            return (
              <div
                key={global.guid()}
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  line-xs"
              >
                <div className="col-lg-10 col-md-9 col-sm-9 col-xs-12  no-padding   no-margin tr">
                  {columnsToShow.map(function(key, index) {
                    var content = (
                      <editOrView.EditOrView
                        hideInlineEdit={self.props.hideInlineEdit}
                        summary={false}
                        from={"table"}
                        noDetail={true}
                        displayName={"no"}
                        fullLayout={fullLayout}
                        noFormGroup={self.props.noFormGroup}
                        dependentSchema={self.props.dependentSchema}
                        rootSchema={self.props.rootSchema}
                        schemaDoc={schemaRec}
                        property={key}
                        fullRecord={record.value}
                        recordId={record.id}
                        org={self.props.org}
                        showingForRelatedViewOfRecordId={
                          self.props.showingForRelatedViewOfRecordId
                        }
                      />
                    );
                    /*if(record.value[key] && typeof record.value[key] =="string" && record.value[key].length==0){
																	content="-"
																}else if (!record.value[key]){
																	content="-";
																}*/
                    if (index < self.state.visibleCount) {
                      if (index == 0) {
                        return (
                          <div
                            key={global.guid()}
                            className={
                              "col-lg-" +
                              colSize +
                              " col-md-" +
                              colSize +
                              " col-sm-" +
                              colSize +
                              "  col-xs-" +
                              colSize +
                              "  td"
                            }
                            ref={d => {
                              self["data" + index + index1] = d;
                            }}
                          >
                            {content}
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={global.guid()}
                            className={
                              "col-lg-" +
                              colSize +
                              " col-md-" +
                              colSize +
                              " col-sm-" +
                              colSize +
                              "  col-xs-" +
                              colSize +
                              "  td"
                            }
                            ref={d => {
                              self["data" + index + index1] = d;
                            }}
                          >
                            {content}
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div
                          key={global.guid()}
                          className={
                            "col-lg-" +
                            colSize +
                            " col-md-" +
                            colSize +
                            " col-sm-" +
                            colSize +
                            "  col-xs-" +
                            colSize +
                            "  td hidden"
                          }
                          ref={d => {
                            self["data" + index + index1] = d;
                          }}
                        >
                          {content}
                        </div>
                      );
                    }
                  })}
                </div>
                <div
                  className={"col-lg-2 col-sm-3 col-md-3 col-xs-12  no-padding "}
                >
                  {/*titlebkp={"Click to view Detail"}titlebkp={"Click to see the actions"}*/}
                  <div className={"parent-img-component "+(mobile?"margin-top-gap-sm form-group":" pull-right")}>
                    {self.props.struct ? (
                      <div className="hidden" />
                    ) : (
                      <div
                        className={
                          "display-table-cell vertical-align-top " +
                          (moreActions.length > 0 ? (mobile?"extra-padding-right":"") : "no-padding")
                        }
                      >
                        <Link to={detailLink}>
                          <div className="buttonWidth  form-group">
                            <div className="iconHeight">
                              <i className={"icons8-analyze newCustomIcon"} />
                            </div>
                            <div className="newCustomButton">View Detail</div>
                          </div>
                        </Link>
                      </div>
                    )}
                    {moreActionsToDo.length > 0 &&!mobile ? (
                      <div className="display-table-cell no-padding vertical-align-top">
                        <div
                          className="buttonWidth  form-group"
                          onClick={self.showMoreRow.bind(null, index1)}
                        >
                          <div className="iconHeight">
                            <i className={"icons8-menu-2 newCustomIcon"} />
                          </div>
                          <div className="newCustomButton">More Actions</div>
                        </div>
                      </div>
                    ) : (
                      <div className="hidden" />
                    )}
                    {
                        (mobile && moreActionsToDo.length>0)?self.moreActionsToDoDiv(moreActionsToDo,fullLayout,schemaRec,record,viewName):""
                    }
                  </div>
                </div>
                {
                  (!mobile && moreActionsToDo.length>0)?
                              (<div
                                className={"col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding no-margin tr  hidden"}
                                ref={e => {
                                  self["moreRow" + index1] = e;
                                }}
                              >
                                {self.moreActionsToDoDiv(moreActionsToDo,fullLayout,schemaRec,record,viewName)}
                              </div>):""
                }
              </div>
            );
          }, this)}
        </div>
      </div>
    );
  }
});

exports.Table = Table;

//<div className={" pull-right col-lg-1 col-sm-3 col-md-1 col-xs-3 h4 no-padding-left "+((self.props.edit && self.props.edit=="edit")?"":"hidden")}><span className=" pull-right fa fa-eye link pointer" ></span></div>

/***Gallery Carosel **/

function combineSchemas(schema, subSchema) {
  return global.combineSchemas(schema, subSchema);
}
exports.combineSchemas = combineSchemas;

function getDefaultSummaryView(viewName, currentSchema, fromRelation) {
  var viewN = "";
  if (typeof viewName != "undefined" && viewName != "") {
    viewN = viewName;
  } else {
    try {
      viewN = currentSchema["@defaultViews"]["summary"];
      if (fromRelation && fromRelation == "search") {
        viewN = currentSchema["@defaultViews"]["search"];
      }
    } catch (err) {}
    if (viewN == undefined || viewN == "") {
      var flag = true;
      try {
        Object.keys(currentSchema["@operations"]["read"]).forEach(function(
          lay
        ) {
          if (
            !Array.isArray(
              currentSchema["@operations"]["read"][lay].UILayout
            ) &&
            flag
          ) {
            viewN = lay;
            flag = false;
          }
        });
      } catch (err) {}
    }
  }
  return viewN;
}
exports.getDefaultSummaryView = getDefaultSummaryView;

function getMethodExecutePrivilegeOnorgSchema(org, schemaDoc, record, method) {
  var flag = 0;
  try {
    var scmaRole = common.getSchemaRoleOnOrg(schemaDoc["@id"], org);
    if (
      scmaRole &&
      scmaRole.methods &&
      (scmaRole.methods == "all" || scmaRole.methods.indexOf(method) > -1)
    ) {
      // checking the state of the record
      //assigning state if no state in the record
      if (
        typeof record != "undefined" &&
        typeof record["$status"] == "undefined"
      ) {
        record["$status"] = schemaDoc["@initialState"]
          ? schemaDoc["@initialState"]
          : "draft";
      }
      //processing state machine
      if (schemaDoc["@state"] && Object.keys(schemaDoc["@state"]).length > 0) {
        if (schemaDoc["@state"][record["$status"]][method]) {
          flag = 1;
        } else {
          flag = 0;
        }
      } else {
        flag = 1;
      }
    } else {
      flag = 0;
    }
  } catch (err) {}
  return flag;
}
/**
* if onclick on a pointer link should take to different url
*/

function getProxyLink(layout, record) {
  try {
    if (layout.link.type == "summary" && layout.link.schema != undefined) {
      return linkGenerator.getSummaryLink(
        copyThisValues(
          {
            org: layout.link.org ? layout.link.org : "public",
            schema: layout.link.schema,
            dependentSchema: layout.link.dependentSchema,
            filters: layout.link.filters
          },
          record
        )
      );
    }
    if (
      layout.link.type == "detail" &&
      layout.link.schema != undefined &&
      layout.link.recordId != undefined
    ) {
      return linkGenerator.getDetailLink(
        copyThisValues(
          {
            org: layout.link.org ? layout.link.org : "public",
            schema: layout.link.schema,
            recordId: layout.link.recordId,
            dependentSchema: layout.link.dependentSchema
          },
          record
        )
      );
    }
  } catch (err) {
    return undefined;
  }
}
exports.getProxyLink = getProxyLink;
function copyThisValues(obj, fromObj) {
  if (!fromObj) {
    fromObj = {};
  }
  var newObj;
  if (Array.isArray(obj)) {
    newObj = [];
    for (var i = 0; i < obj.length; i++) {
    	var temp=copyThisValues(obj[i], fromObj);
    	if(temp){
     		newObj.push(temp);
     	}
    }
  } else if (typeof obj == "object") {
    newObj = {};
    for (var key in obj) {
      newObj[key] = copyThisValues(obj[key], fromObj);
    }
  } else if (typeof obj == "string") {
    newObj = "";
    if (obj.indexOf("this.") == 0) {
      newObj = fromObj[obj.split(".")[1]];
    } else {
      newObj = obj;
    }
  }
  return newObj;
}
