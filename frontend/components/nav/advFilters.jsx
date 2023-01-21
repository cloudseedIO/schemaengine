/**
 * @author - Vikram
 */

var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../common.jsx");
//var genericView=require('../view/genericView.jsx');
var manageRecords = require("../records/manageRecords.jsx");
//var manageRoles=require('../admin/manageRoles.jsx');
//var signUp=require('../auth/signUp.jsx');
//var Router = require('react-router');

//var ActionCreator = require('../../actions/ActionCreator');

var SchemaStore = require("../../stores/SchemaStore");
//var DefinitionStore=require('../../stores/DefinitionStore');
//var router = require('./router.jsx');
var global = require("../../utils/global.js");

var search = require("./search.jsx");

var AdvFilter = React.createClass({
  getInitialState: function() {
    return { filters: {}, done: false };
  },
  loadRecordsWithFilters: function(filters) {
    var self = this;
    this.setState({ filters: filters }, function() {
      self.applyFilters();
    });
  },
  redo: function() {
    this.setState({ done: false });
  },
  applyFilters: function() {
    var filters = this.state.filters;
    filters.docType = this.props.schema["@id"];
    this.setState({ filters: filters, done: true });
  },
  render: function() {
    if (!this.props.schema["@advancedFilterKeys"]) {
      return <div />;
    } else {
      var schema = this.props.schema;

      var filters = [];
      var allFilters = schema["@advancedFilterKeys"];
      for (var i = 0; i < allFilters.length; i++) {
        if (
          schema["@properties"][allFilters[i]] &&
          schema["@properties"][allFilters[i]].dataType &&
          schema["@properties"][allFilters[i]].dataType.type
        ) {
          var dataType = schema["@properties"][allFilters[i]].dataType.type;
          if (dataType == "pickList" || dataType == "multiPickList") {
            filters.push({
              filterType: "multiPickList",
              filterName: schema["@properties"][allFilters[i]].displayName,
              filterKey: allFilters[i],
              list: schema["@properties"][allFilters[i]].dataType.options
            });
          } else if (dataType == "object") {
            filters.push({
              filterType: "object",
              filterName: schema["@properties"][allFilters[i]].displayName,
              filterKey: allFilters[i],
              list: "",
              property: schema["@properties"][allFilters[i]]
            });
          } else if (dataType == "text" || dataType == "struct") {
            filters.push({
              filterType: "text",
              filterName: schema["@properties"][allFilters[i]].displayName,
              filterKey: allFilters[i],
              list: "",
              property: schema["@properties"][allFilters[i]]
            });
          } else if (dataType == "number") {
            filters.push({
              filterType: "number",
              filterName: schema["@properties"][allFilters[i]].displayName,
              filterKey: allFilters[i],
              list: "",
              property: schema["@properties"][allFilters[i]]
            });
          } else if (dataType == "date") {
            filters.push({
              filterType: "date",
              filterName: schema["@properties"][allFilters[i]].displayName,
              filterKey: allFilters[i],
              list: "",
              property: schema["@properties"][allFilters[i]]
            });
          }
        }
      }
      if (this.state.done) {
        return (
          <div>
            <search.SearchResults searchText={this.state.filters} />
            <div className="display-inline-block form-group remove-margin-left remove-margin-right extra-padding-right ">
              <input
                type="submit"
                onClick={this.redo}
                ref="disable_button"
                className="action-button"
                value="Find Again"
              />
            </div>
          </div>
        );
      }
      return (
        <FilterResults
          org={this.props.org}
          filters={filters}
          appliedFilters={this.state.filters}
          callback={this.loadRecordsWithFilters}
        />
      );
    }
  }
});
exports.AdvFilter = AdvFilter;

var FilterResults = React.createClass({
  _changeNavColor: function(id) {},
  _performFilter: function() {
    var filters = {};
    for (var i = 0; i < this.props.filters.length; i++) {
      var upper = undefined;
      var lower = undefined;
      var temp = undefined;
      var values = undefined;
      if (this.props.filters[i].filterType == "number") {
        upper = $(
          "input[name='upper" + this.props.filters[i].filterKey + "']"
        ).val();
        lower = $(
          "input[name='lower" + this.props.filters[i].filterKey + "']"
        ).val();
        temp = { upper: upper, lower: lower };
        filters[this.props.filters[i].filterKey] = temp;
      } else if (this.props.filters[i].filterType == "date") {
        upper = $(
          "input[name='end" + this.props.filters[i].filterKey + "']"
        ).val();
        lower = $(
          "input[name='start" + this.props.filters[i].filterKey + "']"
        ).val();
        temp = { upper: upper, lower: lower };
        filters[this.props.filters[i].filterKey] = temp;
      } else if (this.props.filters[i].filterType != "dependentPickList") {
        values = [];
        for (
          var k = 0;
          k <
          $("input[name='" + this.props.filters[i].filterKey + "']:checked")
            .length;
          k++
        ) {
          values.push(
            $("input[name='" + this.props.filters[i].filterKey + "']:checked")[
              k
            ].value
          );
        }
        filters[this.props.filters[i].filterKey] = values;
      } else {
        values = {};
        for (
          var k = 0;
          k <
          $("input[name='" + this.props.filters[i].filterKey + "']:checked")
            .length;
          k++
        ) {
          var dependent = $(
            "input[name='" + this.props.filters[i].filterKey + "']:checked"
          )[k].value;
          values[dependent] = [];

          for (
            var l = 0;
            l < $("input[name='" + dependent + "']:checked").length;
            l++
          ) {
            values[dependent].push(
              $("input[name='" + dependent + "']:checked")[l].value
            );
          }
        }
        filters[this.props.filters[i].filterKey] = values;
      }
    }
    if (this.props.callback && typeof this.props.callback == "function") {
      this.props.callback(filters);
    }
  },
  componentDidMount: function() {
    this.preSelected();
  },
  componentDidUpdate: function() {
    this.preSelected();
  },
  preSelected: function() {
    try {
      if (this.props.appliedFilters) {
        for (var key in this.props.appliedFilters) {
          for (var key1 in this.props.filters) {
            if (key == this.props.filters[key1].filterKey)
              if (
                this.props.filters[key1].filterType == "multiPickList" ||
                this.props.filters[key1].filterType == "pickList"
              ) {
                for (
                  var i = 0;
                  i < this.props.appliedFilters[key].length;
                  i++
                ) {
                  $("input[name='" + key + "']")
                    .filter(
                      "[value='" + this.props.appliedFilters[key][i] + "']"
                    )
                    .prop("checked", true);
                }
              }
          }
        }
      }
    } catch (err) {}
  },
  render: function() {
    return (
      <ul className="list-unstyled no-padding-left">
        {this.props.filters.map(function(filter) {
          var filterContent = [];
          filterContent.push(
            <li>
              <h5 className="remove-margin-bottom text-uppercase">
                <span
                  data-toggle="collapse"
                  data-target={"#" + filter.filterName + "List"}
                  className="link filterMainHeading"
                  id={filter.filterKey + "heading"}
                  onClick={this._changeNavColor.bind(
                    this,
                    filter.filterKey + "heading"
                  )}
                >
                  {filter.filterName}
                </span>
              </h5>
            </li>
          );
          var FilterLists = [];

          if (filter.filterType == "multiPickList") {
            for (var i = 0; i < filter.list.length; i++) {
              FilterLists.push(
                <div>
                  <input
                    className="toggleOnClick"
                    type="checkbox"
                    name={filter.filterKey}
                    value={filter.list[i]}
                  />&nbsp;&nbsp;<span>{filter.list[i]}</span>
                </div>
              );
            }
          } else if (filter.filterType == "pickList") {
            for (var i = 0; i < filter.list.length; i++) {
              FilterLists.push(
                <div>
                  <input
                    className="toggleOnClick"
                    type="radio"
                    name={filter.filterKey}
                    value={filter.list[i]}
                  />&nbsp;&nbsp;<span>{filter.list[i]}</span>
                </div>
              );
            }
          } else if (filter.filterType == "rangePickList") {
            for (var i = filter.min; i <= filter.max; i = i + filter.hop) {
              FilterLists.push(
                <div>
                  <span>
                    {i + "  "} - {i + (filter.hop - 1) + "  "}
                  </span>&nbsp;&nbsp;<input
                    className="toggleOnClick"
                    onChange={this._performFilter}
                    type="checkbox"
                    name={filter.filterKey}
                    value={i + "-" + (i + filter.hop - 1)}
                  />
                </div>
              );
            }
          } else if (filter.filterType == "dependentPickList") {
            for (var i = 0; i < Object.keys(filter.list).length; i++) {
              var dependentFilterContent = [];
              dependentFilterContent.push(
                <li>
                  <h5
                    className="remove-margin-bottom"
                    onClick={this._changeNavColor.bind(
                      this,
                      Object.keys(filter.list)[i] + "heading"
                    )}
                    data-toggle="collapse"
                    data-target={"#" + Object.keys(filter.list)[i] + "List"}
                  >
                    <span
                      className="nav-link filterSubHeading"
                      id={Object.keys(filter.list)[i] + "heading"}
                    >
                      {Object.keys(filter.list)[i]}
                    </span>&nbsp;&nbsp;<input
                      className="toggleOnClick"
                      onChange={this._performFilter}
                      type="radio"
                      name={filter.filterKey}
                      value={Object.keys(filter.list)[i]}
                    />
                  </h5>
                </li>
              );
              var dependentFilterLists = [];
              for (
                var j = 0;
                j < filter.list[Object.keys(filter.list)[i]].length;
                j++
              ) {
                dependentFilterLists.push(
                  <div>
                    <span>{filter.list[Object.keys(filter.list)[i]][j]}</span>&nbsp;&nbsp;<input
                      className="toggleOnClick"
                      onChange={this._performFilter}
                      type="checkbox"
                      name={Object.keys(filter.list)[i]}
                      value={filter.list[Object.keys(filter.list)[i]][j]}
                    />
                  </div>
                );
              }

              dependentFilterContent.push(
                <li
                  className="collapse in"
                  id={Object.keys(filter.list)[i] + "List"}
                >
                  <div id={Object.keys(filter.list)[i] + "Div"} className="">
                    {dependentFilterLists}
                  </div>
                </li>
              );
              FilterLists.push(
                <ul className="text-right list-unstyled no-padding-left ">
                  {dependentFilterContent}
                </ul>
              );
            }
          } else if (filter.filterType == "object") {
            FilterLists.push(
              <ObjectFilter
                key={global.guid()}
                filter={filter}
                org={this.props.org}
                appliedFilters={this.props.appliedFilters}
                performFilter={this._performFilter}
              />
            );
          } else if (filter.filterType == "text") {
            FilterLists.push(
              <TextFilter
                key={global.guid()}
                filter={filter}
                org={this.props.org}
                appliedFilters={this.props.appliedFilters}
                performFilter={this._performFilter}
              />
            );
          } else if (filter.filterType == "number") {
            FilterLists.push(
              <NumberFilter
                key={global.guid()}
                filter={filter}
                org={this.props.org}
                appliedFilters={this.props.appliedFilters}
                performFilter={this._performFilter}
              />
            );
          } else if (filter.filterType == "date") {
            FilterLists.push(
              <DateFilter
                key={global.guid()}
                filter={filter}
                org={this.props.org}
                appliedFilters={this.props.appliedFilters}
                performFilter={this._performFilter}
              />
            );
          }
          filterContent.push(
            <li className="collapse in" id={filter.filterKey + "List"}>
              <div
                id={filter.filterKey + "Div"}
                className="margin-bottom-gap h6 remove-margin-top "
              >
                {FilterLists}
              </div>
            </li>
          );

          return filterContent;
        }, this)}
        <li>
          <input
            type="submit"
            onClick={this._performFilter}
            className="action-button"
            value="Find"
          />
        </li>
      </ul>
    );
  }
});

var DateFilter = React.createClass({
  componentDidMount: function() {
    var self = this;
    $("#start" + self.props.filter.filterName).datepicker({
      onSelect: function(selected) {
        var dt = new Date(selected);
        dt.setDate(dt.getDate());
        $("#end" + self.props.filter.filterName).datepicker(
          "option",
          "minDate",
          dt
        );
      }
    });
    $("#end" + self.props.filter.filterName).datepicker({
      onSelect: function(selected) {
        var dt = new Date(selected);
        dt.setDate(dt.getDate());
        $("#start" + self.props.filter.filterName).datepicker(
          "option",
          "maxDate",
          dt
        );
      }
    });
    if (Object.keys(this.props.appliedFilters).length > 0) {
      if (Object.keys(self.props.appliedFilters).indexOf("dateDataType")) {
        if (self.props.appliedFilters.dateDataType.lower != "") {
          $("#start" + self.props.filter.filterName).datepicker(
            "setDate",
            self.props.appliedFilters.dateDataType.lower != ""
              ? self.props.appliedFilters.dateDataType.lower
              : new Date()
          );
        }
        if (self.props.appliedFilters.dateDataType.upper != "") {
          $("#end" + self.props.filter.filterName).datepicker(
            "setDate",
            self.props.appliedFilters.dateDataType.upper != ""
              ? self.props.appliedFilters.dateDataType.upper
              : new Date()
          );
        }
      }
    }
  },
  render: function() {
    var self = this;
    return (
      <div className="parent-img-component">
        <div className="child-img-component">
          <h5>Start Date</h5>
          <input
            type="text"
            id={"start" + self.props.filter.filterName}
            name={"start" + self.props.filter.filterKey}
            className="form-control remove-padding-left datepicker"
            ref={"start" + self.props.filter.filterName}
            placeholder="dd-MM-yy"
          />
        </div>
        <div className="child-img-component ">
          <h5>&nbsp; </h5>&nbsp; to &nbsp;
        </div>
        <div className="child-img-component ">
          <h5>End Date</h5>
          <input
            type="text"
            id={"end" + self.props.filter.filterName}
            name={"end" + self.props.filter.filterKey}
            className="form-control remove-padding-left datepicker"
            ref={"end" + self.props.filter.filterName}
            placeholder="dd-MM-yy"
          />
        </div>
      </div>
    );
  }
});

var NumberFilter = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return false;
    //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
  },
  componentDidMount: function() {
    var self = this;

    if (
      typeof self.props.appliedFilters != "undefined" &&
      Object.keys(self.props.appliedFilters).indexOf(
        self.props.filter.filterKey
      ) != -1 &&
      self.props.appliedFilters[self.props.filter.filterKey].lower &&
      self.props.appliedFilters[self.props.filter.filterKey].upper
    ) {
      this.refs["lower" + self.props.filter.filterName].getDOMNode().value =
        self.props.appliedFilters[self.props.filter.filterKey].lower;
      this.refs["upper" + self.props.filter.filterName].getDOMNode().value =
        self.props.appliedFilters[self.props.filter.filterKey].upper;
    }
  },
  clickHandler: function() {
    var self = this;
    if (
      this.refs["upper" + self.props.filter.filterName].getDOMNode().value !=
        "" &&
      this.refs["upper" + self.props.filter.filterName].getDOMNode().value !=
        "" &&
      this.refs["lower" + self.props.filter.filterName].getDOMNode().value >
        this.refs["upper" + self.props.filter.filterName].getDOMNode().value
    ) {
      this.refs["lower" + self.props.filter.filterName].getDOMNode().value = "";
      this.refs["upper" + self.props.filter.filterName].getDOMNode().value = "";
      $("input[name='lowernumberDataType']")
        .parent()
        .parent()
        .append("<div class='errorMsg'>Please enter  valid numbers</div>");
    } else if ($(".errorMsg")) {
      $(".errorMsg").remove();
    }
  },

  render: function() {
    var self = this;

    return (
      <div className="parent-img-component">
        <div className="child-img-component">
          <input
            type="number"
            className="form-control"
            name={"lower" + self.props.filter.filterKey}
            onBlur={this.clickHandler}
            ref={"lower" + self.props.filter.filterName}
          />
        </div>
        <div className="child-img-component ">&nbsp; to &nbsp;</div>
        <div className="child-img-component ">
          <input
            type="number"
            className="form-control"
            name={"upper" + self.props.filter.filterKey}
            onBlur={this.clickHandler}
            ref={"upper" + self.props.filter.filterName}
          />
        </div>
      </div>
    );
  }
});

var ObjectFilter = React.createClass({
  getInitialState: function() {
    return { selectedObjects: [], changeState: "false" };
  },
  lookUp: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    node.className =
      "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(
      <manageRecords.LookupComponent
        key={global.guid()}
        schema={this.props.filter.property.dataType.objRef}
        filter={"filter"}
        callback={this.fillData}
      />,
      node
    );
  },
  fillData: function(record) {
    var item = [];
    var flag = 0;
    if (this.state.selectedObjects.length > 0) {
      item = this.state.selectedObjects;
      for (var i = 0; i < item.length; i++) {
        if (item[i] == record.id) {
          flag = 1;
        }
      }
    }
    if (flag == 0) {
      item.push(record.id);
      this.setState({ selectedObjects: item }, function() {});
    } else {
      console.log("Already Selected");
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return (
      JSON.stringify(this.state.selectedObjects) != JSON.stringify(nextState)
    );
  },

  componentDidMount: function() {
    var self = this;
    if (
      typeof self.props.appliedFilters != "undefined" &&
      Object.keys(self.props.appliedFilters).indexOf(
        self.props.filter.filterKey
      ) != -1 &&
      self.props.appliedFilters[self.props.filter.filterKey].length > 0
    ) {
      var value = this.state.selectedObjects;
      if (this.state.selectedObjects.length > 0) {
        var item = this.state.selectedObjects;
        for (var i = 0; i < item.length; i++) {
          for (
            var j = 0;
            j < self.props.appliedFilters[self.props.filter.filterKey].length;
            j++
          ) {
            if (
              item[i] !=
              self.props.appliedFilters[self.props.filter.filterKey][j]
            ) {
              value.push(
                self.props.appliedFilters[self.props.filter.filterKey][j]
              );
            }
          }
        }
      } else {
        for (
          var j = 0;
          j < self.props.appliedFilters[self.props.filter.filterKey].length;
          j++
        ) {
          value.push(self.props.appliedFilters[self.props.filter.filterKey][j]);
        }
      }
      this.setState({ selectedObjects: value });
    }
  },
  close: function(rootNode) {
    this.refs[rootNode].getDOMNode().className = " +hidden";
    var temp = [];
    if (this.state.selectedObjects.length > 0) {
      temp = this.state.selectedObjects;
    }
    var flag = 0;
    for (var i = 0; i < temp.length; i++) {
      if (temp[i] == rootNode) {
        delete temp[i];
        flag = 1;
      }
    }
    temp = temp.filter(function(n) {
      return n != undefined;
    });
    if (flag == 1) {
      this.setState({ selectedObjects: temp }, function() {});
    }
  },

  render: function() {
    var self = this;
    var identifier = SchemaStore.get(
      self.props.filter.property.dataType.objRef
    )["@identifier"];
    return (
      <div className="row no-margin">
        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
          <button type="button" className="upload-btn" onClick={this.lookUp}>
            Select
          </button>
        </div>
        <div ref={"objectRender"}>
          {["a"].map(function(temp) {
            if (self.state.selectedObjects.length > 0) {
              return self.state.selectedObjects.map(function(val) {
                return (
                  <div>
                    <span className="parent-img-component" ref={val}>
                      <span key={global.guid()} className="child-img-component">
                        <common.UserIcon
                          filter={"filter"}
                          id={val}
                          org={self.props.org}
                          identifier={identifier}
                          rootSchema={
                            self.props.filter.property.dataType.objRef
                          }
                        />
                      </span>
                      <span className="child-img-component">
                        &nbsp;&nbsp;
                        <span
                          className="icons8-delete  fa-2x  pull-right link"
                          onClick={self.close.bind(this, val)}
                          aria-hidden="true"
                        />
                        <input
                          className="toggleOnClick hidden"
                          type="checkbox"
                          name={self.props.filter.filterKey}
                          value={val}
                          checked
                        />
                      </span>
                    </span>
                  </div>
                );
              });
            } else {
              return <div key={global.guid()} className="hidden" />;
            }
          })}
        </div>
      </div>
    );
  }
});

var TextFilter = React.createClass({
  getInitialState: function() {
    return { all: [] };
  },
  fillData: function(text) {
    var all = this.state.all;
    this.refs.textBox.getDOMNode().value = "";
    if (all.indexOf(text) == -1) {
      all.push(text);
      this.setState({ all: all }, function() {
        //self.props.performFilter();
      });
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
    //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
  },
  componentDidMount: function() {
    var self = this;
    if (
      typeof self.props.appliedFilters != "undefined" &&
      Object.keys(self.props.appliedFilters).indexOf(
        self.props.filter.filterKey
      ) != -1 &&
      self.props.appliedFilters[self.props.filter.filterKey].length > 0
    ) {
      var value = this.state.all;
      for (
        var j = 0;
        j < self.props.appliedFilters[self.props.filter.filterKey].length;
        j++
      ) {
        if (
          value.indexOf(
            self.props.appliedFilters[self.props.filter.filterKey][j]
          ) == -1
        )
          value.push(self.props.appliedFilters[self.props.filter.filterKey][j]);
      }
      this.setState({ all: value });
    }
  },
  addNew: function() {
    var self = this;
    var value = this.refs.textBox.getDOMNode().value.trim();
    if (value != "") {
      self.fillData(value);
    }
  },
  close: function(rootNode) {
    this.refs[rootNode].getDOMNode().className += " hidden";
    var temp = [];
    if (this.state.all.length > 0) {
      temp = this.state.all;
    }
    var flag = 0;
    for (var i = 0; i < temp.length; i++) {
      if (temp[i] == rootNode) {
        delete temp[i];
        flag = 1;
      }
    }
    temp = temp.filter(function(n) {
      return n != undefined;
    });
    if (flag == 1) {
      this.setState({ all: temp }, function() {
        //self.props.performFilter();
      });
    }
  },
  render: function() {
    var self = this;
    var all = self.state.all;
    return (
      <div className="row no-margin">
        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding parent-img-component">
          <div className="child-img-component">
            <input type="text" className="" ref="textBox" />
          </div>
          <div className="child-img-component no-padding">
            <span
              aria-hidden="true"
              className="glyphicon glyphicon-plus link"
              onClick={this.addNew}
            />
            {/*<button type='button' className="upload-btn" onClick={this.addNew}>Add</button>*/}
          </div>
        </div>
        <div>
          {all.map(function(val) {
            return (
              <div key={global.guid()} className="">
                <span
                  key={global.guid()}
                  className="parent-img-component"
                  ref={val}
                >
                  <span key={global.guid()} className="child-img-component">
                    {val}
                  </span>
                  <span className="child-img-component no-padding">
                    &nbsp;&nbsp;
                    <span
                      className="icons8-delete  fa-2x  pull-right link"
                      onClick={self.close.bind(this, val)}
                      aria-hidden="true"
                    />
                    <input
                      className="toggleOnClick hidden"
                      type="checkbox"
                      name={self.props.filter.filterKey}
                      value={val}
                      checked
                    />
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
});
