/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../../common.jsx");
var getContent = require("./getContent.jsx");
var global = require("../../../utils/global.js");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var SchemaStore = require("../../../stores/SchemaStore");
/**
 * rootSchema, dependentSchema, schemaDoc,  org, recordIds
 */

var schema;
var dependentSchema;
var recordIds = [];
var count = 0;
function saveFilters(id, value) {
  if (id && typeof Storage != "undefined") {
    id = "FILTERS-" + id;
    if (localStorage.getItem(id) != "ClickThroughNavFilters") {
      localStorage.setItem(id, JSON.stringify(value));
    } else {
      localStorage.removeItem(id);
    }
  }
}
exports.saveFilters = saveFilters;
function loadFilters(id) {
  var data;
  if (id && typeof Storage != "undefined") {
    id = "FILTERS-" + id;
    data = localStorage.getItem(id);
    if (data) {
      try {
        data = JSON.parse(data);
      } catch (err) {
        data = {};
      }
    }
    if (typeof data == "object" && Object.keys(data).length == 0) {
      data = null;
    }
  }
  return data;
}
exports.loadFilters = loadFilters;

function clearFilters(id) {
  id = "FILTERS-" + id;
  if (id && typeof Storage != "undefined") {
    //localStorage.removeItem(id);
    localStorage.setItem(id, "ClickThroughNavFilters");
  }
}
exports.clearFilters = clearFilters;

function clearCompareList() {
  schema = undefined;
  dependentSchema = undefined;
  recordIds = [];
  count = 0;
  showOrHideCompareButton();
}
exports.clearCompareList = clearCompareList;

function saveCompareList(id) {
  if (id && typeof Storage != "undefined") {
    localStorage.removeItem(id);
    if (Array.isArray(recordIds) && recordIds.length > 0)
      localStorage.setItem(
        id,
        JSON.stringify({
          schema: schema,
          dependentSchema: dependentSchema,
          recordIds: recordIds,
          count: count
        })
      );
  }
}
exports.saveCompareList = saveCompareList;

function loadCompareList(id) {
  clearCompareList();
  if (id && typeof Storage != "undefined") {
    var data = localStorage.getItem(id);
    if (data) {
      data = JSON.parse(data);
      schema = data.schema;
      dependentSchema = data.dependentSchema;
      recordIds = Array.isArray(data.recordIds) ? data.recordIds : [];
      count = !isNaN(data.count) ? data.count : 0;
    }
  }
  showOrHideCompareButton();
}
exports.loadCompareList = loadCompareList;

function addToCompare(data) {
  if (data.schema && data.recordId) {
    if (schema && data.schema == schema) {
      if (recordIds.indexOf(data.recordId) == -1) {
        if (recordIds.length < 6) {
          if (data.dependentSchema == dependentSchema) {
            recordIds.push(data.recordId);
          } else {
            dependentSchema = data.dependentSchema;
            recordIds = [data.recordId];
          }
        } else {
          alert("Can't compare more than 6 items");
        }
      } else {
        recordIds = recordIds.filter(function(i) {
          if (i != data.recordId) return true;
        });
      }
    } else {
      schema = data.schema;
      dependentSchema = data.dependentSchema;
      recordIds = [data.recordId];
    }
  }
  showOrHideCompareButton();
}
exports.addToCompare = addToCompare;
function showOrHideCompareButton() {
  if (recordIds.length > 1) {
    $("#compareButton").remove();
    var node = document.createElement("button");
    node.id = "compareButton";
    node.innerHTML = "Compare";
    node.className = "compareButton btn btn-success";
    node.onclick = compare;
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
  } else {
    $("#compareButton").remove();
  }
}
function getCompareList() {
  return recordIds;
}
exports.getCompareList = getCompareList;

var AddToCompareList = React.createClass({
  add: function() {
    addToCompare({
      schema: this.props.rootSchema,
      dependentSchema: this.props.dependentSchema,
      recordId: this.props.recordId
    });
    this.forceUpdate();
  },
  render: function() {
    if (recordIds.indexOf(this.props.recordId) == -1) {
      if (
        this.props.schemaDoc &&
        this.props.schemaDoc["@metaData"] &&
        this.props.schemaDoc["@metaData"]["@compare"] &&
        this.props.schemaDoc["@metaData"]["@compare"]["addToCompare"] &&
        this.props.schemaDoc["@metaData"]["@compare"]["addToCompare"][
          "iconClass"
        ]
      ) {
        return (
          <div
            key={global.guid()}
            className={
              "display-inline-flex  extra-padding-right form-group addToCompareButton"
            }
          >
            <div className="buttonWidth" onClick={this.add}>
              <div className="iconHeight">
                <i
                  className={
                    this.props.schemaDoc["@metaData"]["@compare"][
                      "addToCompare"
                    ]["iconClass"] + " newCustomIcon"
                  }
                />
              </div>
              <div className="newCustomButton">Add to Compare</div>
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <button
              className="btn btn-success addToCompareButton"
              onClick={this.add}
            >
              Add to Compare
            </button>
          </div>
        );
      }
    } else {
      if (
        this.props.schemaDoc &&
        this.props.schemaDoc["@metaData"] &&
        this.props.schemaDoc["@metaData"]["@compare"] &&
        this.props.schemaDoc["@metaData"]["@compare"]["removeFromCompare"] &&
        this.props.schemaDoc["@metaData"]["@compare"]["removeFromCompare"][
          "iconClass"
        ]
      ) {
        return (
          <div
            key={global.guid()}
            className={"display-inline-flex  extra-padding-right form-group"}
          >
            <div className="buttonWidth" onClick={this.add}>
              <div className="iconHeight">
                <i
                  className={
                    this.props.schemaDoc["@metaData"]["@compare"][
                      "removeFromCompare"
                    ]["iconClass"] + " newCustomIcon"
                  }
                />
              </div>
              <div className="newCustomButton">Remove from Compare list</div>
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <button className="btn btn-success" onClick={this.add}>
              Remove from Compare list
            </button>
          </div>
        );
      }
    }
  }
});
exports.AddToCompareList = AddToCompareList;

function getRenderSchema() {
  var schemaDoc = SchemaStore.get(schema);
  if (dependentSchema) {
    var dsRec = SchemaStore.get(schema + "-" + dependentSchema);
    if (dsRec) {
      schemaDoc = global.combineSchemas(schemaDoc, dsRec);
    }
  }
  return schemaDoc;
}
function compare() {
  if (recordIds.length < 2) {
    alert("Add atleast two items to compare");
    return;
  }
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
      clear={function() {}}
    />,
    node
  );
  ReactDOM.render(
    <CompareView
      rootSchema={schema}
      dependentSchema={dependentSchema}
      org="public"
      schemaDoc={getRenderSchema()}
      recordIds={recordIds}
    />,
    document.getElementById(contentDivId)
  );
}
exports.compare = compare;

if (typeof window != "undefined") {
  window.compare = compare;
}

var CompareView = React.createClass({
  getInitialState: function() {
    var width = 1200;
    try {
      width = $(window).width();
    } catch (err) {}
    var visibleCount = 0;
    var colSize = 12;
    if (width > 992) {
      colSize = 3;
      visibleCount = 4;
    } else if (width > 768 && width < 992) {
      colSize = 4;
      visibleCount = 3;
    } else if (width > 450 && width < 767) {
      colSize = 6;
      visibleCount = 2;
    } else {
      visibleCount = 1;
      colSize = 12;
    }
    return { records: {}, visibleCount: visibleCount, colSize: colSize };
  },
  removeFromCompareList: function(recordId) {
    addToCompare({
      recordId: recordId,
      schema: this.props.rootSchema,
      dependentSchema: this.props.dependentSchema
    });
    var records = {};
    for (var key in this.state.records) {
      if (key != recordId) {
        records[key] = this.state.records[key];
      }
    }
    this.setState({ records: records });
  },
  increaseCount: function() {
    var self = this;
    count = count + 1;
    var colSize = this.state.colSize;
    try {
      for (
        var j = 0;
        j <
        Object.keys(this.state.records[Object.keys(this.state.records)[0]])
          .length;
        j++
      ) {
        for (var i = 0; i < Object.keys(self.state.records).length; i++) {
          if (self["td" + i + "" + j]) {
            if (i >= count && i < count + self.state.visibleCount) {
              self["td" + i + "" + j].className =
                "col-lg-" +
                colSize +
                " col-md-" +
                colSize +
                " col-sm-" +
                colSize +
                "  col-xs-" +
                colSize +
                "  td";
            } else if (self["td" + i + "" + j]) {
              self["td" + i + "" + j].className =
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
  },
  reduceCount: function() {
    var self = this;
    count = count - 1;
    var colSize = this.state.colSize;
    try {
      for (
        var j = 0;
        j <
        Object.keys(this.state.records[Object.keys(this.state.records)[0]])
          .length;
        j++
      ) {
        for (var i = 0; i < Object.keys(self.state.records).length; i++) {
          if (self["td" + i + "" + j]) {
            if (i >= count && i < count + self.state.visibleCount) {
              self["td" + i + "" + j].className =
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
              self["td" + i + "" + j].className =
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
  },

  checkPagination: function() {
    common.startLoader();
    var forward = false;
    var backward = false;
    if (
      count + this.state.visibleCount <
      Object.keys(this.state.records).length
    ) {
      this.moveForward.className =
        "sleekIcon-rightarrow fa-3x nextPrevIcons link pointer ";
    } else {
      forward = true;
      this.moveForward.className =
        "sleekIcon-rightarrow fa-3x nextPrevIcons lightgrey pointer-events";
    }
    if (count > 0) {
      this.moveBack.className =
        "sleekIcon-leftarrow fa-3x nextPrevIcons link pointer";
    } else {
      backward = true;
      this.moveBack.className =
        "sleekIcon-leftarrow fa-3x nextPrevIcons lightgrey pointer-events";
    }
    if (forward && backward) {
      this.pagination.className = "hidden";
    } else {
      this.pagination.className = "pull-right";
    }
    common.stopLoader();
  },
  componentDidMount: function() {
    var self = this;
    if (
      Array.isArray(this.props.recordIds) &&
      this.props.recordIds.length > 0
    ) {
      for (var index in this.props.recordIds) {
        WebUtils.getSchemaRecord(
          {
            schema: this.props.rootSchema,
            dependentSchema: this.props.dependentSchema,
            recordId: this.props.recordIds[index],
            userId: common.getUserDoc().recordId,
            org: this.props.org
          },
          function(data) {
            var records = self.state.records;
            records[data.recordId] = data.record;
            self.setState({ records: records }, function() {
              count = 0;
              self.checkPagination();
            });
          }
        );
      }
    }
  },
  render: function() {
    var self = this;
    var propertiesToCompare = [];
    var removeIndex;
    if (
      Array.isArray(this.props.recordIds) &&
      this.props.recordIds.length > 0 &&
      Object.keys(this.state.records).length > 0
    ) {
      propertiesToCompare =
        this.state.records && Object.keys(this.state.records).length > 0
          ? Object.keys(this.state.records[Object.keys(this.state.records)[0]])
          : [];

      var colSize = this.state.colSize;
      return (
        <div className="pure-table pure-table-striped row no-margin">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding h1 ">
            Feature Comparision
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding line">
            <div className="col-lg-11 col-md-11 col-sm-9 col-xs-9 no-padding thead no-margin" />
            <div className="col-lg-1 col-sm-3 col-md-1 col-xs-3 no-padding-left">
              <div
                ref={input => {
                  self.pagination = input;
                }}
                className="hidden"
                style={{ background: "white" }}
              >
                <div>
                  <span
                    ref={input => {
                      self.moveBack = input;
                    }}
                    onClick={this.reduceCount}
                    className="sleekIcon-leftarrow fa fa-3x"
                  />
                  <span
                    ref={input => {
                      self.moveForward = input;
                    }}
                    onClick={this.increaseCount}
                    className="sleekIcon-rightarrow fa fa-3x "
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding tbody">
            {propertiesToCompare.map(function(key, pIndex) {
              if (
                key != "$status" &&
                key != "metaTitle" &&
                key != "metaDescription" &&
                key != "record_header" &&
                key != "@uniqueUserName" &&
                key != "webCrawlerIndex" &&
                key != "dependentProperties"
              ) {
                if (removeIndex == undefined) removeIndex = pIndex;
                return (
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  line">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding   no-margin tr">
                      <div className={"col-lg-2 col-md-3 col-sm-4 col-xs-4 td"}>
                        {key == "$status"
                          ? "Status"
                          : self.props.schemaDoc["@properties"][key]
                            ? self.props.schemaDoc["@properties"][key]
                                .displayName
                            : key}
                      </div>
                      <div
                        className={"col-lg-10 col-md-9 col-sm-8 col-xs-8 td"}
                      >
                        {Object.keys(self.state.records).map(function(
                          recordId,
                          index
                        ) {
                          var classNames = "hidden";
                          if (index < self.state.visibleCount) {
                            classNames = "";
                          }
                          //if(typeof self.state.records[recordId][key] !="undefined"){
                          if (self.state.records[recordId][key]) {
                            var rec = {};
                            rec[key] = self.state.records[recordId][key];
                            return (
                              <div
                                className={
                                  classNames +
                                  " col-lg-" +
                                  colSize +
                                  " col-md-" +
                                  colSize +
                                  " col-sm-" +
                                  colSize +
                                  "  col-xs-" +
                                  colSize +
                                  "  td"
                                }
                                key={global.guid()}
                                ref={a => {
                                  self["td" + index + "" + pIndex] = a;
                                }}
                                style={{ overflow: "hidden" }}
                              >
                                {pIndex == removeIndex ? (
                                  <span
                                    className="icons8-delete fontSizeDelete  fa-3x deleteIcon pull-right link"
                                    title="Remove from comparision"
                                    onClick={self.removeFromCompareList.bind(
                                      null,
                                      recordId
                                    )}
                                  />
                                ) : (
                                  ""
                                )}
                                <getContent.GetContent
                                  displayName="No"
                                  dependentSchema={self.props.dependentSchema}
                                  rootSchema={self.props.rootSchema}
                                  schemaDoc={self.props.schemaDoc}
                                  record={rec}
                                  property={key}
                                  fullRecord={self.state.records[recordId]}
                                  recordId={recordId}
                                  showNoDataTypeValue={true}
                                  org={self.props.org}
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div
                                key={global.guid()}
                                className={
                                  classNames +
                                  " col-lg-" +
                                  colSize +
                                  " col-md-" +
                                  colSize +
                                  " col-sm-" +
                                  colSize +
                                  "  col-xs-" +
                                  colSize +
                                  "  td"
                                }
                                key={global.guid()}
                                ref={a => {
                                  self["td" + index + "" + pIndex] = a;
                                }}
                              >
                                {pIndex == removeIndex ? (
                                  <span
                                    className="icons8-delete fontSizeDelete  fa-3x pull-right link"
                                    title="Remove from comparision"
                                    onClick={self.removeFromCompareList.bind(
                                      null,
                                      recordId
                                    )}
                                  />
                                ) : (
                                  ""
                                )}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});
exports.CompareView = CompareView;
