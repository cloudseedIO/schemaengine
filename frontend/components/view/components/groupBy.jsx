/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var SchemaStore = require("../../../stores/SchemaStore");
var SearchStore = require("../../../stores/SearchStore");
var RecordDetailStore = require("../../../stores/RecordDetailStore");
var common = require("../../common.jsx");
var linkGenerator = require("../../nav/linkGenerator.jsx");
var getContent = require("./getContent.jsx");
var global = require("../../../utils/global.js");
var Link = require("react-router").Link;
var browserHistory = require("react-router").browserHistory;
var limitCount = global.limitCount; //9;
var utility = require("../../Utility.jsx");
var manageRecords = require("../../records/manageRecords.jsx");
/**
 * org
 * schema
 * groupName
 * gilters
 */
var GroupBy = React.createClass({
  getInitialState: function() {
    return {
      rows: [],
      groupDetails: this.props.groupDetails,
      serverFetchDone: false
    };
  },
  componentDidMount: function() {
    WebUtils.getGroupData(this.state.groupDetails, this.gotData);
  },
  componentDidUpdate: function() {
    this.tabData();
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  gotData: function(data) {
    var self = this;
    if (!this._isUnmounted)
      this.setState({ rows: data, serverFetchDone: true }, function() {
        if (
          self["noData"] &&
          self.props.displayName &&
          self.props.displayName.toLowerCase() == "no" &&
          self.props.tabData == undefined &&
          self.props.showTab == undefined
        ) {
          self.noData.className += " hidden";
        }
      });
  },
  more: function(groupDetails) {
    if (groupDetails) {
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
        <GroupBy org={this.props.org} groupDetails={groupDetails} />,
        document.getElementById(contentDivId)
      );
    }
  },
  furtherLink: function(groupDetails, key, value, rowKey) {
    var self = this;
    if (groupDetails.viewResp.furtherLink) {
      var ids = [];
      if (groupDetails.viewResp.furtherLink.collect) {
        var schemaDoc = SchemaStore.get(this.props.sourceSchema);

        if (
          groupDetails.viewResp.furtherLink.collect &&
          schemaDoc["@groups"] &&
          schemaDoc["@groups"][groupDetails.viewResp.furtherLink.collect]
        ) {
          var innerDeals = Object.assign(
            {},
            schemaDoc["@groups"][groupDetails.viewResp.furtherLink.collect]
          );
          var innerKey = [];
          for (var ki = 0; ki < rowKey.length; ki++) {
            innerKey.push(rowKey[ki]);
          }
          innerKey.push(key);
          innerDeals.key = innerKey;
          common.startLoader();
          WebUtils.getGroupData(innerDeals, function(data) {
            common.stopLoader();
            if (data.length > 0 && typeof data[0] == "object") {
              ids = data[0].value;
            }
            continueFurther();
          });
        } else {
          continueFurther();
        }
      } else {
        continueFurther();
      }

      function continueFurther() {
        var furtherLinkData = Object.assign(
          {},
          groupDetails.viewResp.furtherLink
        );
        if (groupDetails.viewResp.furtherLink) {
          for (var flk in furtherLinkData.filters) {
            if (Array.isArray(furtherLinkData.filters[flk])) {
              for (var i = 0; i < furtherLinkData.filters[flk].length; i++) {
                if (furtherLinkData.filters[flk][i] == "this.key") {
                  furtherLinkData.filters[flk][i] = key;
                } else if (furtherLinkData.filters[flk][i] == "this.in") {
                  furtherLinkData.filters[flk][i] =
                    groupDetails.key[groupDetails.key.length - 1];
                } else if (furtherLinkData.filters[flk][i] == "this.value") {
                  furtherLinkData.filters[flk][i] = value;
                }
              }
            } else {
              if (furtherLinkData.filters[flk] == "collected") {
                furtherLinkData.filters[flk] = ids;
              }
            }
          }
        }
        var furtherLink = linkGenerator.getSummaryLink(furtherLinkData);
        self.takeToPage(furtherLink);
      }
    } else {
      var current = "key";
      if (value) {
        current = "value";
      }
      if (groupDetails.viewResp[current].furtherLink) {
        var furtherLinkData = Object.assign(
          {},
          groupDetails.viewResp[current].furtherLink
        );
        if (groupDetails.viewResp[current].furtherLink) {
          for (var flk in furtherLinkData.filters) {
            for (var i = 0; i < furtherLinkData.filters[flk].length; i++) {
              if (furtherLinkData.filters[flk][i] == "this.key") {
                furtherLinkData.filters[flk][i] = key;
              } else if (furtherLinkData.filters[flk][i] == "this.in") {
                furtherLinkData.filters[flk][i] =
                  groupDetails.key[groupDetails.key.length - 1];
              } else if (furtherLinkData.filters[flk][i] == "this.value") {
                furtherLinkData.filters[flk][i] = value;
              }
            }
          }
        }
        var furtherLink = linkGenerator.getSummaryLink(furtherLinkData);
        this.takeToPage(furtherLink);
      }
    }
  },
  takeToPage: function(url) {
    common.showMainContainer(0);
    if (this.props.close && typeof this.props.close == "function") {
      this.props.close();
    }
    browserHistory.push(url);
  },
  tabData: function() {
    var self = this;
    if (
      self.props.tabData != undefined &&
      self.props.showTab != undefined &&
      self.state.rows &&
      self.state.rows.length > 0
    ) {
      self.props.showTab(self.props.tabData);
    }
  },
  returnSelectedItem: function(id, schema) {
    common.showMainContainer();
    if (id == "record") {
      this.props.callback(schema);
      return;
    }
    var record = RecordDetailStore.getSchemaRecord({
      schema: schema,
      recordId: id,
      userId: common.getUserDoc().recordId,
      org: "public"
    });
    record.value.id = id;
    record.value.recordId = id;
    this.props.callback(record);
  },
  getCreateLink: function() {
    if (this.props.showCreate && typeof this.props.callback == "function") {
      return (
        <div
          className="blueLink link pointer"
          onClick={() => {
            this.setState({ createNew: true });
          }}
        >
          Create New
        </div>
      );
    } else {
      return <div />;
    }
  },
  callbackToCreatedRecord: function(record) {
    this.props.callback({
      id: record.recordId,
      value: record
    });
  },
  render: function() {
    var self = this;
    var groupDetails = this.state.groupDetails;
    //	var schemaDoc=SchemaStore.get(this.props.sourceSchema);
    var style = {};
    if (
      groupDetails.viewResp &&
      groupDetails.viewResp.style &&
      groupDetails.viewResp.style != ""
    ) {
      style = getContent.getStyleFromConfig(groupDetails.viewResp.style).normal;
    }
    if (this.state.createNew) {
      return (
        <manageRecords.DisplayCustomSchema
          callbackToCreatedRecord={this.callbackToCreatedRecord}
          schemaName={this.props.sourceSchema}
          org={this.props.org}
        />
      );
    }
    if (this.state.rows.length > 0) {
      return (
        <div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
          {this.getCreateLink()}
          {global.makeHeader(
            this.props.rootRecord,
            groupDetails.heading,
            "forRelations"
          ).length > 0 ? (
            <h2 className="h2">
              {global.makeHeader(
                this.props.rootRecord,
                groupDetails.heading,
                "forRelations"
              )}
            </h2>
          ) : (
            ""
          )}
          <div
            className={
              self.props.displayName == "No" || self.props.displayName == "no"
                ? "hidden"
                : "title"
            }
          >
            {groupDetails.displayName.toUpperCase()}
          </div>
          <div
            className=" col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
            style={style}
          >
            {this.state.rows.map(function(row) {
              if (groupDetails.viewResp.type == "array") {
                return (
                  <div
                    key={global.guid()}
                    className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                  >
                    {groupDetails.mapView ? (
                      <GeoMap
                        key={global.guid()}
                        arrayResponse={true}
                        rowKey={row.key}
                        data={row.value}
                        groupDetails={groupDetails}
                        org={self.props.org}
                        sourceSchema={self.props.sourceSchema}
                        rootRecord={self.props.rootRecord}
                        furtherLink={self.furtherLink}
                        returnSelectedItem={self.returnSelectedItem}
                        more={self.more}
                        callback={self.props.callback}
                      />
                    ) : (
                      <ArrayPaginator
                        key={global.guid()}
                        arrayResponse={true}
                        rowKey={row.key}
                        data={row.value}
                        groupDetails={groupDetails}
                        org={self.props.org}
                        sourceSchema={self.props.sourceSchema}
                        rootRecord={self.props.rootRecord}
                        furtherLink={self.furtherLink}
                        returnSelectedItem={self.returnSelectedItem}
                        more={self.more}
                        callback={self.props.callback}
                      />
                    )}
                  </div>
                );
              } else if (groupDetails.viewResp.type == "object") {
                return (
                  <GroupViewObjectResponsePaginator
                    key={global.guid()}
                    data={row.value}
                    groupDetails={groupDetails}
                    org={self.props.org}
                    sourceSchema={self.props.sourceSchema}
                    rootRecord={self.props.rootRecord}
                    furtherLink={self.furtherLink}
                    returnSelectedItem={self.returnSelectedItem}
                    callback={self.props.callback}
                  />
                );
              } else {
                return <div key={global.guid()}>unspecified response type</div>;
              }
            })}
          </div>
        </div>
      );
    } else if (this.state.serverFetchDone) {
      if (this.state.groupDetails.onEmptyResults) {
        var target = this.state.groupDetails.onEmptyResults.target;
        var linkName = this.state.groupDetails.onEmptyResults.displayName;

        var url = "";
        if (target.method == "DetailView") {
          url = linkGenerator.getDetailLink({
            org: target.org ? target.org : "public",
            schema: target.schema,
            recordId: target.recordId,
            dependentSchema: target.dependentSchema
          });
        } else if (target.method == "SummaryView") {
          // need to change user to public
          url = linkGenerator.getSummaryLink({
            org: target.org ? target.org : "public",
            schema: target.schema,
            dependentSchema: target.dependentSchema,
            filters: target.filters
          });
        } else if (target.method == "Create") {
          // need to change user to public
          var schemaDoc = SchemaStore.getSchema(target.schema);
          var editFields;
          editFields = Object.keys(schemaDoc["@properties"]);
          var actions = [];
          try {
            var allActions = Object.keys(schemaDoc["@operations"]["actions"]);
            actions = allActions;
            var validMethods = Object.keys(
              schemaDoc["@state"][schemaDoc["@initialState"]]
            );
            var newActions = [];
            for (var i = 0; i < Linkctions.length; i++) {
              if (validMethods.indexOf(actions[i]) > -1) {
                newActions.push(actions[i]);
              }
            }
            actions = newActions;
          } catch (err) {
            console.log("error while deciding actions;");
          }
          var coeData = {
            editFields: editFields,
            readOnlyFields: [],
            actions: actions,
            knownData: target.knownData,
            dependentSchema: target.dependentSchema,
            prompt: target.prompt
          };
          url = linkGenerator.getCOELink({
            org: target.org ? target.org : "public",
            schema: target.schema,
            coeData: coeData
          });
        } else {
          //do nothing
        }
        return (
          <div>
            <div>{this.getCreateLink()}</div>
            <div
              className="upload-btn link col-lg-3 col-xm-6 col-sm-6 col-xs-6"
              title={linkName.toUpperCase()}
              onClick={self.takeToPage.bind(null, url)}
            >
              {linkName}
            </div>
          </div>
        );
      } else {
        return (
          <div>
            {this.getCreateLink()}
            <div
              ref={d => {
                this.noData = d;
              }}
            >
              {this.state.groupDetails.onEmptyResultsMessage?this.state.groupDetails.onEmptyResultsMessage:""}
            </div>
          </div>
        );
      }
    } else {
      return <div>{this.getCreateLink()}</div>;
    }
  }
});
exports.GroupBy = GroupBy;

/**
 * this for Group Views directly from url
 * for full page rendering
 * /gv/:schema/:viewname
 */
var GroupByWithinSchema = React.createClass({
  getInitialState: function() {
    var viewDefinition;
    var schemaViewDef;
    if (this.props.viewDefinition) {
      viewDefinition = this.props.viewDefinition;
    }
    if (!this.props.viewDefinition) {
      var schema = SchemaStore.get(this.props.data.schema);
      if (schema && schema["@views"] && Array.isArray(schema["@views"])) {
        for (var i = 0; i < schema["@views"].length; i++) {
          if (
            schema["@views"][i] &&
            schema["@views"][i].viewName &&
            schema["@views"][i].viewName == this.props.data.viewName
          ) {
            if (!viewDefinition) {
              viewDefinition = schema["@views"][i];
            }
            schemaViewDef = schema["@views"][i];
          }
        }
      }
    }
    var ssd = SearchStore.get("GroupViewResults", this.props.data.schema);
    return {
      data: this.props.data,
      org: this.props.data.org ? this.props.data.org : "public",
      viewDefinition: viewDefinition,
      schemaViewDef: schemaViewDef,
      viewResponse: ssd ? ssd : []
    };
  },
  componentDidMount: function() {
    common.adjustDivs();
    common.clearFilters();
    WebUtils.getGroupData(this.state.data, this.gotData);
  },
  gotData: function(data) {
    this.setState({ viewResponse: data });
  },
  render: function() {
    var self = this;
    if (!this.state.viewDefinition) {
      return <div />;
    } else {
      return (
        <div className="margin-top-gap">
          <h1 className="h1">{this.state.data.text}</h1>
          {this.state.viewResponse.map(function(row) {
            return (
              <div key={global.guid()}>
                {self.state.viewDefinition.key.map(function(ele, index) {
                  if (ele == "org") {
                    return <div key={global.guid()} />;
                  } else {
                    return (
                      <common.UserIcon
                        key={global.guid()}
                        id={row.key[index]}
                        org={"public"}
                        rootSchema={ele}
                      />
                    );
                  }
                })}
                {self.state.viewDefinition.value &&
                self.state.viewDefinition.value.type &&
                self.state.viewDefinition.value.type == "array" ? (
                  <div>
                    {row.value.map(function(ele, index) {
                      var header = undefined;
                      if (self.state.schemaViewDef.value.elements.linkHeading) {
                        var link = (
                          <Link
                            to={linkGenerator.getDetailLink({
                              record: {},
                              org: self.props.org,
                              schema:
                                self.state.schemaViewDef.value.elements.objRef,
                              recordId: row.value[index]
                            })}
                          >
                            {
                              self.state.schemaViewDef.value.elements
                                .linkHeading.displayName
                            }
                          </Link>
                        );
                        if (
                          self.state.schemaViewDef.value.elements.linkHeading
                            .iconClass
                        ) {
                          header = (
                            <div
                              className="buttonWidth"
                              title={
                                self.state.schemaViewDef.value.elements
                                  .linkHeading.iconClassTitle
                                  ? self.state.schemaViewDef.value.elements
                                      .linkHeading.iconClassTitle
                                  : self.state.schemaViewDef.value.elements
                                      .linkHeading.displayName
                              }
                            >
                              <Link
                                to={linkGenerator.getDetailLink({
                                  record: {},
                                  org: self.props.org,
                                  schema:
                                    self.state.schemaViewDef.value.elements
                                      .objRef,
                                  recordId: row.value[index]
                                })}
                              >
                                <div className="iconHeight">
                                  <i
                                    className={
                                      self.state.schemaViewDef.value.elements
                                        .linkHeading["iconClass"] +
                                      " newCustomIcon"
                                    }
                                  />
                                </div>
                                <div className="newCustomButton">
                                  {
                                    self.state.schemaViewDef.value.elements
                                      .linkHeading.displayName
                                  }
                                </div>
                              </Link>
                            </div>
                          );
                        } else if (
                          self.state.schemaViewDef.value.elements.linkHeading
                            .css
                        ) {
                          header = (
                            <div
                              style={utility.getReactStyles(
                                self.state.schemaViewDef.value.elements
                                  .linkHeading.css
                              )}
                            >
                              {link}
                            </div>
                          );
                        } else {
                          header = <h2 className="h2">{link}</h2>;
                        }
                      }
                      return (
                        <common.UserIcon
                          key={global.guid()}
                          header={header}
                          id={row.value[index]}
                          org={self.state.org}
                          viewName={
                            self.state.schemaViewDef.value.elements.viewName
                          }
                          showAs={"full"}
                          rootSchema={
                            self.state.viewDefinition.value.elements.objRef
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div />
                )}
              </div>
            );
          })}
        </div>
      );
    }
  }
});
exports.GroupByWithinSchema = GroupByWithinSchema;

var GroupViewObjectResponsePaginator = React.createClass({
  getInitialState: function() {
    var curkey = Object.keys(this.props.data)[0];
    if (this.props.groupDetails && this.props.groupDetails.viewName) {
      try {
        if (
          this.props.data[
            localStorage.getItem(this.props.groupDetails.viewName)
          ]
        ) {
          curkey = localStorage.getItem(this.props.groupDetails.viewName);
        }
      } catch (err) {}
    }
    return { currentKey: curkey };
  },
  changeKey: function(key) {
    if (this.props.groupDetails && this.props.groupDetails.viewName) {
      try {
        localStorage.setItem(this.props.groupDetails.viewName, key);
      } catch (err) {}
    }
    this.setState({ currentKey: key });
  },
  render: function() {
    var self = this;
    var groupDetails = this.props.groupDetails;
    return (
      <div>
        <div className="col-lg-6 col-md-6 col-xs-12 col-sm-12 form-group margin-top-gap-xs no-padding">
          <button
            type="button"
            className="btn btn-default dropdown-toggle form-control"
            style={{ textTransform: "none" }}
            title="Click here to change"
            data-toggle="dropdown"
          >
            <common.UserIcon
              noDetail={true}
              key={global.guid()}
              id={this.state.currentKey}
              fromRelation={groupDetails.viewResp.fromRelation}
              org={self.props.org}
              rootSchema={groupDetails.viewResp.key.objRef}
              rootRecord={self.props.rootRecord}
              heading={groupDetails.viewResp.key.heading}
            />
            <div
              className="display-inline-block groubyTransform"
              style={{ position: "absolute", right: "3%", top: "0" }}
            >
              <span className="sleekIcon-rightarrow fa-2x " />
            </div>
          </button>
          <ul
            className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding "
            role="menu"
          >
            {Object.keys(this.props.data).map(function(key) {
              return (
                <li
                  key={global.guid()}
                  className="h5 link"
                  onClick={self.changeKey.bind(null, key)}
                >
                  <span>
                    <common.UserIcon
                      noDetail={true}
                      key={global.guid()}
                      id={key}
                      fromRelation={groupDetails.viewResp.fromRelation}
                      org={self.props.org}
                      rootSchema={groupDetails.viewResp.key.objRef}
                      rootRecord={self.props.rootRecord}
                      heading={groupDetails.viewResp.key.heading}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        {groupDetails.mapView ? (
          <GeoMap
            key={global.guid()}
            headKey={this.state.currentKey}
            data={this.props.data[this.state.currentKey]}
            groupDetails={groupDetails}
            org={this.props.org}
            sourceSchema={this.props.sourceSchema}
            rootRecord={this.props.rootRecord}
            furtherLink={this.props.furtherLink}
            returnSelectedItem={this.props.returnSelectedItem}
            callback={this.props.callback}
          />
        ) : (
          <ArrayPaginator
            key={global.guid()}
            headKey={this.state.currentKey}
            data={this.props.data[this.state.currentKey]}
            groupDetails={groupDetails}
            org={this.props.org}
            sourceSchema={this.props.sourceSchema}
            rootRecord={this.props.rootRecord}
            furtherLink={this.props.furtherLink}
            returnSelectedItem={this.props.returnSelectedItem}
            callback={this.props.callback}
          />
        )}

        {/*
			Object.keys(this.props.data).map(function(key){
				return <div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						{
							[key].map(function(ele){
								var eleData=<span key={global.guid()}></span>;
								var OnClick=function(){};
								if(groupDetails.viewResp.key.type=="object"){
									var noDetail=true;
									if(!groupDetails.viewResp.key.processInner && !groupDetails.viewResp.key.furtherLink){
										noDetail=false;
									}
									if(typeof self.props.callback == "function" && self.props.sourceSchema==groupDetails.viewResp.key.objRef){
										noDetail=true;
										OnClick=self.props.returnSelectedItem.bind(null,ele,groupDetails.viewResp.key.objRef);
									}
									eleData=<common.UserIcon noDetail={noDetail}
												key={global.guid()}
												id={ele}
												fromRelation={groupDetails.viewResp.fromRelation}
												org={self.props.org}
												rootSchema={groupDetails.viewResp.key.objRef}
												rootRecord={self.props.rootRecord}
												heading={groupDetails.viewResp.key.heading}/>;
								}else{
									eleData=<span key={global.guid()}>{ele}</span>
								}
								if(groupDetails.viewResp.key.furtherLink){
									return <span key={global.guid()} onClick={self.props.furtherLink.bind(null,groupDetails,key,undefined)} className="link">{eleData}</span>
								}else{
									return <span key={global.guid()} onClick={OnClick}>{eleData}</span>;
								}
							})
						}
						</div>
						<ArrayPaginator key={global.guid()}
							headKey={key}
							data={self.props.data[key]}
        					groupDetails={groupDetails}
        					org={self.props.org}
        					sourceSchema={self.props.sourceSchema}
        					rootRecord={self.props.rootRecord}
        					furtherLink={self.props.furtherLink}
        					returnSelectedItem={self.props.returnSelectedItem}
        					callback={self.props.callback}/>
        				</div>
			})
		*/}
      </div>
    );
  }
});

var ArrayPaginator = React.createClass({
  getInitialState: function() {
    return { skip: 0 };
  },
  increaseSkipCount: function() {
    var self = this;
    this.setState({ skip: self.state.skip + limitCount });
  },
  reduceSkipCount: function() {
    var self = this;
    this.setState({ skip: self.state.skip - limitCount });
  },
  pageSelected: function() {
    var self = this;
    this.setState({ skip: self["pageSelect"].value * limitCount });
  },

  render: function() {
    var key = this.props.headKey;
    var self = this;
    var groupDetails = this.props.groupDetails;
    return (
      <div className="row no-margin">
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          {self.props.data.map(function(ele, index) {
            if (
              index < self.state.skip ||
              index + 1 > self.state.skip + limitCount
            ) {
              return <div key={global.guid()} className="hidden" />;
            }

            if (self.props.arrayResponse) {
              var OnClick = "";
              var inner = [];
              var innerDeals;
              var rowKey = self.props.rowKey;
              if (
                groupDetails.viewResp.processInner &&
                schemaDoc["@groups"] &&
                schemaDoc["@groups"][groupDetails.viewResp.processInner]
              ) {
                innerDeals = Object.assign(
                  {},
                  schemaDoc["@groups"][groupDetails.viewResp.processInner]
                );
                var innerKey = [];
                for (var ki = 0; ki < rowKey.length; ki++) {
                  innerKey.push(rowKey[ki]);
                }
                innerKey.push(ele);
                innerDeals.key = innerKey;
                inner.push(
                  <span
                    key={global.guid()}
                    className="link"
                    onClick={self.more.bind(null, innerDeals)}
                  >
                    view
                  </span>
                );
                OnClick = self.props.more.bind(null, innerDeals);
              }
              if (groupDetails.viewResp.furtherLink) {
                inner.push(
                  <span
                    key={global.guid()}
                    className="link"
                    onClick={self.props.furtherLink.bind(
                      null,
                      groupDetails,
                      ele,
                      undefined,
                      rowKey
                    )}
                  >
                    view
                  </span>
                );
                OnClick = self.props.furtherLink.bind(
                  null,
                  groupDetails,
                  ele,
                  undefined,
                  rowKey
                );
              }
              var noDetail = true;
              if (
                !groupDetails.viewResp.processInner &&
                !groupDetails.viewResp.furtherLink
              ) {
                noDetail = false;
              }
              if (
                typeof self.props.callback == "function" &&
                self.props.sourceSchema == groupDetails.viewResp.elements.objRef
              ) {
                noDetail = true;
                OnClick = self.props.returnSelectedItem.bind(
                  null,
                  ele,
                  groupDetails.viewResp.elements.objRef
                );
              }
              if (groupDetails.viewResp.elements.type == "object") {
                return (
                  <span onClick={OnClick} key={global.guid()} className="link">
                    <common.UserIcon
                      viewName={groupDetails.viewResp.elements.viewName}
                      noDetail={noDetail}
                      id={ele}
                      fromRelation={groupDetails.viewResp.fromRelation}
                      org={self.props.org}
                      rootSchema={groupDetails.viewResp.elements.objRef}
                    />
                  </span>
                );
              } else {
                return (
                  <span
                    onClick={self.props.more.bind(null, innerDeals)}
                    key={global.guid()}
                    className="link"
                  >
                    {ele}
                  </span>
                );
              }
            } else {
              //var eleData=<span key={global.guid()}></span>;
              OnClick = function() {};
              if (groupDetails.viewResp.value.elements.type == "object") {
                noDetail = true;
                if (
                  !groupDetails.viewResp.value.processInner &&
                  !groupDetails.viewResp.value.furtherLink
                ) {
                  noDetail = false;
                }
                if (
                  typeof self.props.callback == "function" &&
                  self.props.sourceSchema ==
                    groupDetails.viewResp.value.elements.objRef
                ) {
                  noDetail = true;
                  OnClick = self.props.returnSelectedItem.bind(
                    null,
                    ele,
                    groupDetails.viewResp.value.elements.objRef
                  );
                }
                eleData = (
                  <common.UserIcon
                    noDetail={noDetail}
                    key={global.guid()}
                    id={ele}
                    fromRelation={groupDetails.viewResp.fromRelation}
                    org={self.props.org}
                    rootSchema={groupDetails.viewResp.value.elements.objRef}
                  />
                );
              } else {
                eleData = <span key={global.guid()}>{ele}</span>;
              }
              if (groupDetails.viewResp.value.furtherLink) {
                return (
                  <span
                    key={global.guid()}
                    onClick={self.props.furtherLink.bind(
                      null,
                      groupDetails,
                      key,
                      ele
                    )}
                    className="link"
                  >
                    {eleData}
                  </span>
                );
              } else {
                return (
                  <span key={global.guid()} onClick={OnClick}>
                    {eleData}
                  </span>
                );
              }
            }
          })}
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  remove-margin-top">
          <div className="pull-right">
            {self.state.skip && self.state.skip >= limitCount ? (
              <div
                className="link display-table-cell extra-padding-right "
                onClick={self.reduceSkipCount}
              >
                <div className="child-img-component no-padding">
                  <i className="sleekIcon-leftarrow fa-2x nextPrevIcons" />
                </div>
                <div className="child-img-component no-padding">
                  <span className="nextPrevIcons">PREV</span>
                </div>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </div>
            ) : (
              <span />
            )}
            {self.props.data.length > limitCount ? (
              <div className="link display-table-cell extra-padding-right vertical-align-top">
                <select
                  className="form-control"
                  ref={select => {
                    self["pageSelect"] = select;
                  }}
                  onChange={self.pageSelected}
                  defaultValue={Math.floor(
                    (self.state.skip ? self.state.skip : 0) / limitCount
                  )}
                  key={global.guid()}
                >
                  <option value={0}>1</option>
                  {[1].map(function() {
                    var options = [];
                    for (
                      var si = 1;
                      si < self.props.data.length / limitCount;
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
            {self.props.data.length >
            limitCount + (self.state.skip ? self.state.skip : 0) ? (
              <div
                className="link display-table-cell"
                onClick={self.increaseSkipCount}
              >
                <div className="child-img-component no-padding">
                  <span className="nextPrevIcons">NEXT</span>
                </div>
                <div className="child-img-component no-padding">
                  <i className="sleekIcon-rightarrow fa-2x nextPrevIcons " />
                </div>
              </div>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    );
  }
});

var GeoMap = React.createClass({
  getInitialState: function() {
    return {
      data: [],
      map: undefined,
      center: undefined,
      shouldComponentUpdate: false,
      schema: undefined
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
    return this.state.shouldComponentUpdate;
  },
  getRecords: function() {
    var self = this;
    var groupDetails = this.props.groupDetails;
    var ids = this.props.data;
    var schema;
    if (self.props.arrayResponse) {
      schema = groupDetails.viewResp.elements.objRef;
    } else {
      schema = groupDetails.viewResp.value.elements.objRef;
    }
    common.startLoader();
    WebUtils.getSearchResults(schema, ids, function(data) {
      if (data.error) {
        common.stopLoader();
        console.log(data.error);
      } else {
        self.locateCenter(function(center) {
          if (!self._isUnmounted)
            self.setState(
              {
                center: center,
                data: Array.isArray(data.records) ? data.records : [],
                schema: schema,
                shouldComponentUpdate: true
              },
              function() {
                common.stopLoader();
                self.plotData();
              }
            );
        });
      }
    });
  },
  componentDidMount: function() {
    this.getRecords();
    this.activateLocationSearch();
  },
  locateCenter: function(callback) {
    //var self=this;
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var browserPoint = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        callback(browserPoint);
      },
      function() {
        callback(undefined);
      }
    );
  },
  getAddressString: function(address) {
    var addString = "";
    if (address) {
      if (address.streetAddress) {
        addString += address.streetAddress + "\n";
      }
      if (address.addressLocality) {
        addString += address.addressLocality + ",";
      }
      if (address.addressRegion) {
        addString += address.addressRegion + "\n";
      }
      if (address.addressCountry) {
        addString += address.addressCountry + ",";
      }
      if (address.postalCode) {
        addString += address.postalCode + "\n";
      }
      if (address.telephone) {
        addString += address.telephone;
      }
    }
    return addString;
  },
  selectItem: function(id) {
    common.showMainContainer();
    var record;
    for (var i = 0; i < this.state.data.length; i++) {
      if (this.state.data[i].id == id) {
        record = this.state.data[i];
        break;
      }
    }

    record.value.id = id;
    record.value.recordId = id;
    this.props.callback(record);
  },
  plotData: function() {
    try {
      var self = this;
      var map;
      var infoWindow = new google.maps.InfoWindow();
      var center;

      function addMarker(place) {
        if (!map) {
          var myCenter = new google.maps.LatLng(
            place.latitude * 1,
            place.longitude * 1
          );
          center = self.state.center ? self.state.center : myCenter;
          var mapProp = {
            center: center,
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          self.rootDiv.style.height = "500px";
          map = new google.maps.Map(self.rootDiv, mapProp);
        }
        var pos = new google.maps.LatLng(
          place.latitude * 1,
          place.longitude * 1
        );
        if (self.state.center) {
          place.text +=
            "<br/><span style='color:red'}>" +
            (
              google.maps.geometry.spherical.computeDistanceBetween(
                self.state.center,
                pos
              ) / 1000
            ).toFixed(2) +
            " km</span>";
        }
        var marker = new google.maps.Marker({
          text: place.text,
          position: pos
        });
        google.maps.event.addListener(marker, "click", function() {
          infoWindow.setContent(marker.text);
          infoWindow.open(map, marker);
          map.setCenter(marker.getPosition());
        });
        marker.setMap(map);
      }

      for (var i = 0; i < this.state.data.length; i++) {
        if (this.state.data[i] && this.state.data[i].value) {
          var place = this.state.data[i].value.geoLocation;
          if (place && place.latitude) {
            var link = linkGenerator.getDetailLink({
              org: "public",
              schema: this.state.schema,
              recordId: this.state.data[i].id
            });
            var address = this.getAddressString(
              this.state.data[i].value.address
            );
            window.selectItem = this.selectItem;
            if (typeof self.props.callback == "function") {
              place.text =
                "<b class='text-uppercase'><b class='pointer' onclick='selectItem(\"" +
                this.state.data[i].id +
                "\")' href='" +
                link +
                "'>" +
                this.state.data[i].value.name +
                "</b></b><br/><span class='text-area'>" +
                address +
                "</span>";
            } else {
              place.text =
                "<b class='text-uppercase'><a target='_blank' href='" +
                link +
                "'>" +
                this.state.data[i].value.name +
                "</a></b><br/><span class='text-area'>" +
                address +
                "</span>";
            }
            addMarker(place);
          }
        }
      }
      if (self.state.center) {
        var marker = new google.maps.Marker({
          map: map,
          position: self.state.center,
          icon: {
            url:
              "https://developers.google.com/maps/documentation/javascript/images/circle.png",
            anchor: new google.maps.Point(10, 10),
            scaledSize: new google.maps.Size(10, 17)
          }
        });
        marker.setMap(map);
      }
      if (!self._isUnmounted)
        self.setState(
          { map: map, shouldComponentUpdate: false, center: center },
          self.findClosest
        );
    } catch (err) {
      console.log("Error in GeoMap plotData" + err);
    }
  },
  resizemap: function() {
    if (this.state.map && !this.state.resized) {
      google.maps.event.trigger(this.state.map, "resize");
      if (!this._isUnmounted) this.setState({ resized: true });
    }
  },
  activateLocationSearch: function() {
    var self = this;
    var searchBox = new google.maps.places.SearchBox(this.search);
    google.maps.event.addListener(searchBox, "places_changed", function() {
      var place = searchBox.getPlaces()[0];
      var latitude = place.geometry.location.lat();
      var longitude = place.geometry.location.lng();
      self.search.value = place.formatted_address;
      var browserPoint = new google.maps.LatLng(latitude, longitude);
      if (!self._isUnmounted)
        self.setState(
          { center: browserPoint, shouldComponentUpdate: false },
          self.plotData
        );
    });
  },
  findClosest: function() {
    var self = this;
    var center = this.state.center;
    var place = undefined;
    var point = undefined;
    if (center) {
      var distances = [];
      var closest = -1;
      closestPoint = center;
      for (var i = 0; i < this.state.data.length; i++) {
        if (this.state.data[i] && this.state.data[i].value) {
          place = this.state.data[i].value.geoLocation;
          if (place && place.latitude) {
            point = new google.maps.LatLng(place.latitude, place.longitude);
            distances[i] =
              (
                google.maps.geometry.spherical.computeDistanceBetween(
                  center,
                  point
                ) / 1000
              ).toFixed(2) * 1;
            if (closest == -1 || distances[i] < distances[closest]) {
              closest = i;
              closestPoint = point;
            }
          }
        }
      }
      distances = distances.sort(function(a, b) {
        return a * 1 - b * 1;
      });
      var newData = [];

      for (var i = 0; i < this.state.data.length; i++) {
        if (this.state.data[i] && this.state.data[i].value) {
          place = this.state.data[i].value.geoLocation;
          if (place && place.latitude) {
            point = new google.maps.LatLng(place.latitude, place.longitude);
            var distance =
              (
                google.maps.geometry.spherical.computeDistanceBetween(
                  center,
                  point
                ) / 1000
              ).toFixed(2) * 1;
            newData[distances.indexOf(distance)] = this.state.data[i];
          }
        }
      }
      if (!this._isUnmounted)
        this.setState(
          { data: newData, shouldComponentUpdate: true },
          function() {
            self.forceUpdate();
          }
        );
      this.state.map.setCenter(closestPoint);
      //this.state.map.setZoom(15);
    }
  },
  setCenter: function(place) {
    var point = new google.maps.LatLng(place.latitude, place.longitude);
    var infoWindow = new google.maps.InfoWindow({
      content: place.text,
      position: point
    });
    infoWindow.open(this.state.map);
    this.state.map.setCenter(point);
    //this.state.map.setZoom(15);
  },
  getDistance: function(place) {
    var distance = "";
    try {
      distance = (
        google.maps.geometry.spherical.computeDistanceBetween(
          this.state.center,
          new google.maps.LatLng(place.latitude, place.longitude)
        ) / 1000
      ).toFixed(2);
    } catch (err) {}
    return distance;
  },
  getAreasList: function() {
    var self = this;
    return (
      <div>
        {this.state.data.map(function(entry, index) {
          if (entry) {
            var distance = "";
            if (entry.value.geoLocation) {
              distance = self.getDistance(entry.value.geoLocation);
            }
            if (distance) {
              distance += " km";
            }
            var link = linkGenerator.getDetailLink({
              org: "public",
              schema: self.state.schema,
              recordId: entry.id
            });
            return (
              <div
                key={entry.id + "-" + distance}
                className="text-area pointer form-group extra-padding-bottom"
              >
                <b
                  className="text-uppercase form-group"
                  title="View on map"
                  onClick={self.setCenter.bind(null, entry.value.geoLocation)}
                >
                  {index + 1 + ".  "}
                </b>
                <b
                  className="text-uppercase form-group"
                  title="View on map"
                  onClick={self.setCenter.bind(null, entry.value.geoLocation)}
                >
                  {entry.value.name}
                </b>
                <span>&nbsp;&nbsp;</span>
                <a target="_blank" title="Go to page" href={link}>
                  <span className="fa fa-external-link" />
                </a>
                {typeof self.props.callback == "function" ? (
                  <span
                    className="icons8-ok-3 extra-padding-left"
                    title="Select"
                    onClick={self.selectItem.bind(null, entry.id)}
                  />
                ) : (
                  ""
                )}
                <br />
                <span
                  title="View on map"
                  onClick={self.setCenter.bind(null, entry.value.geoLocation)}
                >
                  {self.getAddressString(entry.value.address)}
                </span>
                <br />
                <span style={{ color: "red" }}>{distance} </span>
              </div>
            );
          } else {
            return <div key={global.guid()} />;
          }
        })}
      </div>
    );
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    //var self=this;
    //var groupDetails=this.props.groupDetails;
    return (
      <div
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-margin no-padding"
        onMouseEnter={this.resizemap}
      >
        <div>
          <input
            type="text"
            ref={e => {
              this.search = e;
            }}
            className="form-control maxWidthForSupplierMap form-group"
            defaultValue={this.state.locationName}
            style={{ display: "inline-block" }}
            placeholder={"Search by location"}
          />
          <span className="icons8-search pointer searchForSupplierMap" />
        </div>
        <div
          ref={d => {
            this.areasListDiv = d;
          }}
          className="col-lg-3 col-md-3 col-sm-6 col-xs-12 no-padding"
          style={{ height: "500px", overflowY: "scroll" }}
        >
          {this.getAreasList()}
        </div>
        <div
          ref={d => {
            this.rootDiv = d;
          }}
          className="col-lg-9 col-md-9 col-sm-6 col-xs-12"
          style={{ height: "500px" }}
        />
      </div>
    );
  }
});
