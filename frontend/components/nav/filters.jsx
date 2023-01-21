/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../common.jsx");
var manageRecords = require("../records/manageRecords.jsx");
var SchemaStore = require("../../stores/SchemaStore");
var global = require("../../utils/global.js");
var WebUtils = require("../../utils/WebAPIUtils.js");
var compare = require("../view/components/compareView.jsx");
var objectCount = 0;


function constructFilters(schema) {
  var filters = [];
  var allFilters = Array.isArray(schema["@filterKeys"])?schema["@filterKeys"]:[];
  if (schema["@type"] == "abstractObject") {
    var index = schema["@filterKeys"].indexOf(schema["@dependentKey"]);
    if (index > -1) {
      schema["@filterKeys"].splice(index, 1);
    }
  }
  if (schema["@sysProperties"] ){
    for (var key in schema["@sysProperties"] ){
      schema["@properties"][key]=schema["@sysProperties"][key];
    }
  }
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
          property: schema["@properties"][allFilters[i]],
          derivedId: schema["@derivedId"]
        });
      } else if (
        dataType == "array" &&
        typeof schema["@properties"][allFilters[i]].dataType.elements ==
          "object" &&
        schema["@properties"][allFilters[i]].dataType.elements.type == "object"
      ) {
        filters.push({
          filterType: "object",
          filterName: schema["@properties"][allFilters[i]].displayName,
          filterKey: allFilters[i],
          list: "",
          property: {
            description: schema["@properties"][allFilters[i]].description,
            displayName: schema["@properties"][allFilters[i]].displayName,
            dataType: schema["@properties"][allFilters[i]].dataType.elements
          },
          derivedId: schema["@derivedId"]
        });
      } else if (dataType == "color") {
        filters.push({
          filterType: "color",
          filterName: schema["@properties"][allFilters[i]].displayName,
          filterKey: allFilters[i],
          list: "",
          property: schema["@properties"][allFilters[i]],
          derivedId: schema["@derivedId"]
        });
      } else if (dataType == "number") {
        filters.push({
          filterType: "range",
          filterName: schema["@properties"][allFilters[i]].displayName,
          filterKey: allFilters[i],
          list: "",
          property: schema["@properties"][allFilters[i]],
          derivedId: schema["@derivedId"]
        });
      } else if (
        dataType == "array" &&
        typeof schema["@properties"][allFilters[i]].dataType.elements ==
          "object" &&
        schema["@properties"][allFilters[i]].dataType.elements.type == "number"
      ) {
        filters.push({
          filterType: "range",
          filterName: schema["@properties"][allFilters[i]].displayName,
          filterKey: allFilters[i],
          list: "",
          property: {
            description: schema["@properties"][allFilters[i]].description,
            displayName: schema["@properties"][allFilters[i]].displayName,
            dataType: schema["@properties"][allFilters[i]].dataType.elements
          }
        });
      } else if (dataType == "boolean") {
        filters.push({
          filterType: "boolean",
          filterName: schema["@properties"][allFilters[i]].displayName,
          filterKey: allFilters[i],
          list: "",
          property: schema["@properties"][allFilters[i]],
          derivedId: schema["@derivedId"]
        });
      }
      /*else if(dataType=="text" || dataType=="struct"){
				filters.push({
						filterType:"text",
						filterName:schema["@properties"][allFilters[i]].displayName,
						filterKey:allFilters[i],
						list:"",
						property:schema["@properties"][allFilters[i]]
					});
			}*/
    }
  }
  return filters;
}

var FilterResultsNew = React.createClass({
  getInitialState: function() {
    return {
      filters: constructFilters(this.props.schema),
      selectedFilters: this.props.appliedFilters
        ? this.props.appliedFilters
        : {},
      applicableFilters: {}
    };
  },
  getApplicableFilters: function() {
    //return;
    var allFilters = [];
    for (var index in this.state.filters) {
      allFilters.push(this.state.filters[index].filterKey);
    }
    //common.startLoader();
    if(!this.props.noApplicable)
    WebUtils.doPost(
      "/generic?operation=getApplicableFilters",
      {
        schema: this.props.rootSchema,
        dependentSchema: this.props.dependentSchema,
        allFilters: allFilters,
        selectedFilters: this.state.selectedFilters
      },
      function(result) {
        //common.stopLoader();
        if (!this._isUnmounted)
          this.setState({
            applicableFilters: result,
            shouldComponentUpdate: true
          });
      }.bind(this)
    );
  },
  _performFilter: function(key, value) {
    var selectedFilters = this.state.selectedFilters;
    selectedFilters[key] = value;
    var currFilter;
    this.state.filters.map(function(filter) {
      if (filter.filterKey == key) {
        currFilter = filter;
      }
    });
    this.setState(
      { selectedFilters: selectedFilters, shouldComponentUpdate: true },
      function() {
        if (currFilter.filterType != "range") {
          if (this.props.callback && typeof this.props.callback == "function") {
            this.props.callback(selectedFilters);
          }
          this.getApplicableFilters();
        }
      }.bind(this)
    );
  },
  apply: function() {
    var filters = this.state.selectedFilters;
    if (this.props.callback && typeof this.props.callback == "function") {
      compare.clearFilters(
        this.props.rootSchema +
          (this.props.dependentSchema ? this.props.dependentSchema : "")
      );
      this.props.callback(filters);
      if (
        this.props.callbackToClosePopup &&
        typeof this.props.callbackToClosePopup == "function"
      ) {
        this.props.callbackToClosePopup();
      }
    }
  },
  reset: function() {
    this.setState({ filters: constructFilters(this.props.schema) });
    if (
      this.props.callbackToClosePopup &&
      typeof this.props.callbackToClosePopup == "function"
    ) {
      this.props.callbackToClosePopup();
    }
  },
  componentDidMount: function() {
    this.getApplicableFilters();
  },
  componentDidUpdate: function() {},
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  getFilterType: function(filter, selected, applicable) {
    /*var selected=this.state.selectedFilters[filter.filterKey];
		var applicable=this.state.applicableFilters[filter.filterKey];
		if(!Array.isArray(selected)){
			selected=[];
		}
		if(filter.filterType=="multiPickList" || filter.filterType=="pickList"){
			if(Array.isArray(filter.list)){
				if(Array.isArray(applicable)){
					applicable=applicable.filter(function(key){
						return filter.list.indexOf(key)>-1;
					});
				}
				if(Array.isArray(selected)){
					selected=selected.filter(function(key){
						return filter.list.indexOf(key)>-1;
					});
				}
			}
		}*/
    if (
      (!Array.isArray(selected) || selected.length == 0) &&
      (Array.isArray(applicable) && applicable.length == 0)
    ) {
      return null;
    }

    return filter.filterType == "multiPickList" ||
      filter.filterType == "pickList" ? (
      <MultiPickListFilter
        device={this.props.type}
        callback={this._performFilter}
        filter={filter}
        selected={selected}
        applicable={applicable}
      />
    ) : filter.filterType == "color" ? (
      <ColorFilter
        device={this.props.type}
        callback={this._performFilter}
        filter={filter}
        selected={
          Array.isArray(selected) && selected.length > 0
            ? selected[0]
            : undefined
        }
        applicable={applicable}
      />
    ) : filter.filterType == "range" ? (
      <RangeFilter
        device={this.props.type}
        callback={this._performFilter}
        filter={filter}
        selected={selected}
        applicable={applicable}
      />
    ) : filter.filterType == "object" ? (
      <ObjectFilter
        objectCount={objectCount++}
        filter={filter}
        selected={selected}
        device={this.props.type}
        applicable={applicable}
        org={this.props.org}
        appliedFilters={this.props.appliedFilters}
        performFilter={this._performFilter}
      />
    ) : filter.filterType == "text" ? (
      <TextFilter
        filter={filter}
        device={this.props.type}
        org={this.props.org}
        appliedFilters={this.props.appliedFilters}
        performFilter={this._performFilter}
      />
    ) : filter.filterType == "boolean" &&
    Array.isArray(applicable) &&
    (applicable.indexOf("T") != -1 || applicable.indexOf(true) != -1) ? (
      <BooleanFilter
        device={this.props.type}
        callback={this._performFilter}
        filter={filter}
        selected={
          Array.isArray(selected) && selected.length > 0
            ? selected[0]
            : undefined
        }
        applicable={applicable}
      />
    ) : (
      ""
    );
  },
  render: function() {
    var self = this;
    if (this.props.type == "desktop") {
      //var space=this.props.textRight=="jsm"?"hidden":"";
      var filterStatus = "hidden";
      if (
        this.state.applicableFilters &&
        Object.keys(this.state.applicableFilters).length > 0
      ) {
        Object.keys(this.state.applicableFilters).forEach(function(filter) {
          if (
            self.state.applicableFilters[filter] &&
            self.state.applicableFilters[filter].length > 0
          ) {
            filterStatus = "";
          }
        });
      }
      if(this.props.noApplicable){
        filterStatus="";
      }
      return (
        <div
          className={
            "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding noMinWidth"
          }
        >
          <div
            className={
              " toggleOnClick col-lg-12 col-md-12 col-sm-12 col-xs-12 noMinWidth topLine extra-padding-top-sm add-border-bottom-pin extra-padding-bottom-sm margin-bottom-gap-sm " +
              this.props.dropDownClass +
              " " +
              filterStatus
            }
            ref={l => {
              this.filterDiv = l;
            }}
          >
            {this.state.filters.map(function(filter) {
              var selected = this.state.selectedFilters[filter.filterKey];
              var applicable = this.state.applicableFilters[filter.filterKey];
              if (!Array.isArray(selected)) {
                selected = [];
              }
              if (
                filter.filterType == "multiPickList" ||
                filter.filterType == "pickList"
              ) {
                if (Array.isArray(filter.list)) {
                  if (Array.isArray(applicable)) {
                    applicable = applicable.filter(function(key) {
                      return filter.list.indexOf(key) > -1;
                    });
                  }

                  selected = selected.filter(function(key) {
                    return filter.list.indexOf(key) > -1;
                  });
                }
              }
              if (
                selected.length == 0 &&
                (Array.isArray(applicable) && applicable.length == 0)
              ) {
                return null;
              }

              if (
                filter.filterType == "boolean" &&
                Array.isArray(applicable) &&
                (applicable.indexOf("T") == -1 &&
                  applicable.indexOf(true) == -1)
              ) {
                return null;
              }
              var filterStyle = {
                minWidth: "max-content",
                padding: "15px"
              };
              if (filter.filterType == "object") {
                filterStyle = {
                  padding: "15px"
                };
              }
              return (
                <div key={global.guid()} className="btn-group">
                  <button
                    type="button"
                    className="dropdown-toggle noMinWidth extra-padding-right-sm"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <span
                      ref={e => {
                        this.selectBox = e;
                      }}
                    >
                      {" "}
                      {filter.filterName.toUpperCase()}
                    </span>
                    <div
                      className="display-inline-block groupbyTransform2"
                      style={{ verticalAlign: "middle", fontSize: "20px" }}
                    >
                      <span className="sleekIcon-rightarrow" />
                    </div>
                  </button>
                  <div
                    className="dropdown-menu scrollable-menu"
                    style={filterStyle}
                    id={filter.filterKey + "List"}
                  >
                    <div id={filter.filterKey + "Div"}>
                      {this.getFilterType(filter, selected, applicable)}
                    </div>
                  </div>
                </div>
              );
            }, this)}
          </div>
        </div>
      );
    } else {
      //var space=this.props.textRight=="jsm"?"hidden":"";
      return (
        <ul
          className={
            this.props.textRight +
            " list-unstyled no-padding-left toggleOnClick"
          }
        >
          <li
            className={
              "lightgray " +
              (this.props.createLink && this.props.createLink.length > 0
                ? " margin-top-gap form-group"
                : "") +
              (this.state.filters.length > 0 ? "" : " hidden")
            }
            style={{ fontSize: "10px" }}
          >
            FILTER BY
          </li>
          {this.state.filters.map(function(filter) {
            var selected = this.state.selectedFilters[filter.filterKey];
            var applicable = this.state.applicableFilters[filter.filterKey];
            if (!Array.isArray(selected)) {
              selected = [];
            }
            if (
              filter.filterType == "multiPickList" ||
              filter.filterType == "pickList"
            ) {
              if (Array.isArray(filter.list)) {
                if (Array.isArray(applicable)) {
                  applicable = applicable.filter(function(key) {
                    return filter.list.indexOf(key) > -1;
                  });
                }

                selected = selected.filter(function(key) {
                  return filter.list.indexOf(key) > -1;
                });
              }
            }
            if (
              selected.length == 0 &&
              (Array.isArray(applicable) && applicable.length == 0)
            ) {
              return null;
            }

            if (
              filter.filterType == "boolean" &&
              Array.isArray(applicable) &&
              (applicable.indexOf("T") == -1 && applicable.indexOf(true) == -1)
            ) {
              return null;
            }
            return (
              <li
                key={global.guid()}
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                id={filter.filterKey + "List"}
              >
                <h5 className="text-uppercase no-margin">
                  <span className="link filterMainHeading">
                    {filter.filterName}
                  </span>
                </h5>
                <div
                  id={filter.filterKey + "Div"}
                  style={{ fontSize: "14px" }}
                  className="margin-bottom-gap-xs h6 remove-margin-top "
                >
                  {this.getFilterType(filter, selected, applicable)}
                </div>
              </li>
            );
          }, this)}
          <li className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-lg">
            <div className="filterFooterIcons text-center extra-margin-right ">
              <button
                onClick={self.reset}
                className="action-button extra-margin-right extra-padding"
                type="submit"
              >
                {"CANCEL"}
              </button>
              <button
                onClick={self.apply}
                className="upload-btn extra-padding no-margin"
                type="submit"
              >
                {"APPLY"}
              </button>
            </div>
          </li>
        </ul>
      );
    }
  }
});
exports.FilterResultsNew = FilterResultsNew;

var FilterResults = React.createClass({
  getInitialState: function() {
    return {
      filters: constructFilters(this.props.schema),
      selectedFilters: this.props.appliedFilters
        ? this.props.appliedFilters
        : {},
      applicableFilters: {}
    };
  },
  getApplicableFilters: function() {
    //return;
    var allFilters = [];
    for (var index in this.state.filters) {
      allFilters.push(this.state.filters[index].filterKey);
    }
    //common.startLoader();
    if(!this.props.noApplicable)
    WebUtils.doPost(
      "/generic?operation=getApplicableFilters",
      {
        schema: this.props.rootSchema,
        dependentSchema: this.props.dependentSchema,
        allFilters: allFilters,
        selectedFilters: this.state.selectedFilters
      },
      function(result) {
        //common.stopLoader();
        if (!this._isUnmounted)
          this.setState({
            applicableFilters: result,
            shouldComponentUpdate: true
          });
      }.bind(this)
    );
  },
  _performFilter: function(key, value) {
    var selectedFilters = this.state.selectedFilters;
    selectedFilters[key] = value;
    var currFilter;
    this.state.filters.map(function(filter) {
      if (filter.filterKey == key) {
        currFilter = filter;
      }
    });
    this.setState(
      { selectedFilters: selectedFilters, shouldComponentUpdate: true },
      function() {
        if (currFilter.filterType != "range") {
          this.getApplicableFilters();
        }
      }.bind(this)
    );
  },
  apply: function() {
    var filters = this.state.selectedFilters;
    if (this.props.callback && typeof this.props.callback == "function") {
      compare.clearFilters(
        this.props.rootSchema +
          (this.props.dependentSchema ? this.props.dependentSchema : "")
      );
      this.props.callback(filters);
      if (
        this.props.callbackToClosePopup &&
        typeof this.props.callbackToClosePopup == "function"
      ) {
        this.props.callbackToClosePopup();
      }
    }
  },
  reset: function() {
    this.setState({ filters: constructFilters(this.props.schema) });
    if (
      this.props.callbackToClosePopup &&
      typeof this.props.callbackToClosePopup == "function"
    ) {
      this.props.callbackToClosePopup();
    }
  },
  componentDidMount: function() {
    this.getApplicableFilters();
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  getFilterType: function(filter, selected, applicable) {
    /*var selected=this.state.selectedFilters[filter.filterKey];
		var applicable=this.state.applicableFilters[filter.filterKey];
		if(!Array.isArray(selected)){
			selected=[];
		}
		if(filter.filterType=="multiPickList" || filter.filterType=="pickList"){
			if(Array.isArray(filter.list)){
				if(Array.isArray(applicable)){
					applicable=applicable.filter(function(key){
						return filter.list.indexOf(key)>-1;
					});
				}
				if(Array.isArray(selected)){
					selected=selected.filter(function(key){
						return filter.list.indexOf(key)>-1;
					});
				}
			}
		}*/
    if (selected.length == 0 &&
        (Array.isArray(applicable) && applicable.length == 0)) {
          return null;
    }

    return(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
            <div className="link backLink" style={{"textAlign":"left","fontSize":"14px","marginBottom":"10px"}}  onClick={this.goBackLink}>
              <div  className="icons8-left-arrow-2  display-inline-block " >
              </div>
              <span>
                &nbsp;{"BACK"}
              </span>
            </div>
            {
                filter.filterType == "multiPickList" ||
                    filter.filterType == "pickList" ? (
                    <MultiPickListFilter
                      callback={this._performFilter}
                      filter={filter}
                      mobile={true}
                      selected={selected}
                      applicable={applicable}
                    />
                  ) : filter.filterType == "color" ? (
                    <ColorFilter
                      callback={this._performFilter}
                      filter={filter}
                      mobile={true}
                      selected={
                        Array.isArray(selected) && selected.length > 0
                          ? selected[0]
                          : undefined
                      }
                      applicable={applicable}
                    />
                  ) : filter.filterType == "range" ? (
                    <RangeFilter
                      callback={this._performFilter}
                      filter={filter}
                      mobile={true}
                      selected={selected}
                      applicable={applicable}
                    />
                  ) : filter.filterType == "object" ? (
                    <ObjectFilter
                      objectCount={objectCount++}
                      filter={filter}
                      mobile={true}
                      selected={selected}
                      applicable={applicable}
                      org={this.props.org}
                      appliedFilters={this.props.appliedFilters}
                      performFilter={this._performFilter}
                    />
                  ) : filter.filterType == "text" ? (
                    <TextFilter
                      filter={filter}
                      mobile={true}
                      org={this.props.org}
                      appliedFilters={this.props.appliedFilters}
                      performFilter={this._performFilter}
                    />
                  ) : filter.filterType == "boolean" &&
                  Array.isArray(applicable) &&
                  (applicable.indexOf("T") != -1 || applicable.indexOf(true) != -1) ? (
                    <BooleanFilter
                      callback={this._performFilter}
                      filter={filter}
                      mobile={true}
                      selected={
                        Array.isArray(selected) && selected.length > 0
                          ? selected[0]
                          : undefined
                      }
                      applicable={applicable}
                    />
                  ) : (
                    ""
                  )
          }
          <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding  margin-bottom-gap filterFooter">
            <div className="filterFooterIcons text-center extra-margin-right form-group">
              <button onClick={this.goBackLink} className="upload-btn" type="submit">
                {"DONE"}
              </button>
            </div>
          </div>
        </div>)
  },
  goBackLink:function() {// function to back to the top level navigation
    if(this.subFilter){
      ReactDOM.unmountComponentAtNode(this.subFilter);
      $(this.subFilter).addClass("hidden");
    }
    if(this.mainFilterDiv){
        $(this.mainFilterDiv).removeClass("hidden");
        $(this.mainFilterDiv).addClass("newSearch");
    }
    if(this.filterNavigation){
        $(this.filterNavigation).removeClass("hidden");
    }
  },
  goToInnerLinkFilter:function(filter){
    var selected = this.state.selectedFilters[filter.filterKey];
    var applicable = this.state.applicableFilters[filter.filterKey];
    if (!Array.isArray(selected)) {
      selected = [];
    }
    if (filter.filterType == "multiPickList" ||
      filter.filterType == "pickList") {
      if (Array.isArray(filter.list)) {
        if (Array.isArray(applicable)) {
          applicable = applicable.filter(function(key) {
            return filter.list.indexOf(key) > -1;
          });
        }
        selected = selected.filter(function(key) {
          return filter.list.indexOf(key) > -1;
        });
      }
    }
    if (selected.length == 0 &&
       (Array.isArray(applicable) &&
       applicable.length == 0)) {
         return null;
    }
    if (filter.filterType == "boolean" &&
          Array.isArray(applicable) &&
          (applicable.indexOf("T") == -1 &&
            applicable.indexOf(true) == -1)) {
              return null;
    }
    if(this.mainFilterDiv){
      $(this.mainFilterDiv).addClass("hidden");
      $(this.mainFilterDiv).removeClass("newSearch");
    }
    if(this.filterNavigation){
      $(this.filterNavigation).addClass("hidden");
    }
      if(this.subFilter){
        // component for mobile subnav
        ReactDOM.render(this.getFilterType(filter, selected, applicable),this.subFilter);
        $(this.subFilter).removeClass("hidden");
      }
  },
  render: function() {
    var self = this;
    // filters for mobile
    return (<div className="row no-margin nav navbar-nav" >
                <ul className="newSearch margin-top-gap col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding list-unstyled" ref={(l)=>{self["mainFilterDiv"]=l}}>
                    {
                      this.state.filters.map(function(filter){
                        if(Object.keys(self.state.applicableFilters).includes(filter.filterKey) && self.state.applicableFilters[filter.filterKey].length>0){

                          return (<li key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group" onClick={self.goToInnerLinkFilter.bind(null,filter)}>
                                    <div>
                                      <a>
                                        <span className="link filterMainHeading">
                                          {filter.filterName}
                                        </span>
                                        <span className="icons8-left-arrow pull-right" style={{"transform": "rotate(180deg)"}}>
                                        </span>
                                      </a>
                                    </div>
                                    <div>
                                      {/* Applicable Filters.... */}
                                    </div>
                                  </li>)
                        }else{
                          return null;
                        }
                      })
                    }
                </ul>
                <div className="row no-margin hidden" ref={(l)=>{this.subFilter=l}}>
                </div>
                <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding  margin-bottom-gap filterFooter"  ref={(l)=>{this.filterNavigation=l}}>
                  <div className="filterFooterIcons text-center extra-margin-right form-group">
                    <button
                      onClick={self.reset}
                      className="action-button extra-margin-right"
                      type="submit">
                      {"CANCEL"}
                    </button>
                    <button onClick={self.apply} className="upload-btn" type="submit">
                      {"APPLY"}
                    </button>
                  </div>
                </div>

            </div>)
    if (this.props.type == "desktop") {
      //var space=this.props.textRight=="jsm"?"hidden":"";
      var style = {};
      if (this.state.filters.length <= 1) {
        style = {
          verticalAlign: "top",
          display: "table-cell",
          minHeight: "355px"
        };
      } else {
        style = {
          borderRight: "1px solid lightgrey",
          verticalAlign: "top",
          minHeight: "355px",
          display: "table-cell"
        };
      }
      return (
        <div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}>
          <div
            className={
              "list-unstyled toggleOnClick margin-top-gap col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" +
              this.props.dropDownClass
            }
            ref={l => {
              this.filterDiv = l;
            }}
          >
            {this.state.filters.map(function(filter) {
              var selected = this.state.selectedFilters[filter.filterKey];
              var applicable = this.state.applicableFilters[filter.filterKey];
              if (!Array.isArray(selected)) {
                selected = [];
              }
              if (
                filter.filterType == "multiPickList" ||
                filter.filterType == "pickList"
              ) {
                if (Array.isArray(filter.list)) {
                  if (Array.isArray(applicable)) {
                    applicable = applicable.filter(function(key) {
                      return filter.list.indexOf(key) > -1;
                    });
                  }

                  selected = selected.filter(function(key) {
                    return filter.list.indexOf(key) > -1;
                  });
                }
              }
              if (
                selected.length == 0 &&
                (Array.isArray(applicable) && applicable.length == 0)
              ) {
                return null;
              }
              if (
                filter.filterType == "boolean" &&
                Array.isArray(applicable) &&
                (applicable.indexOf("T") == -1 &&
                  applicable.indexOf(true) == -1)
              ) {
                return null;
              }
              return (
                <div
                  key={global.guid()}
                  className="col-lg-2 col-md-3 col-sm-3 col-xs-12 margin-bottom-gap unequalDivs extra-padding-right-sm extra-padding-left-sm "
                  style={style}
                >
                  <ul
                    key={global.guid()}
                    className="list-unstyled "
                    id={filter.filterKey + "List"}
                  >
                    <h5 className="text-uppercase no-margin">
                      <span className="filterMainHeading">
                        {filter.filterName}
                      </span>
                    </h5>
                    <div id={filter.filterKey + "Div"}>
                      {this.getFilterType(filter, selected, applicable)}
                    </div>
                  </ul>
                </div>
              );
            }, this)}
          </div>
          <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding  margin-bottom-gap filterFooter">
            <div className="filterFooterIcons text-center extra-margin-right form-group">
              <button
                onClick={self.reset}
                className="action-button extra-margin-right"
                type="submit"
              >
                {"CANCEL"}
              </button>
              <button onClick={self.apply} className="upload-btn" type="submit">
                {"APPLY"}
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      //var space=this.props.textRight=="jsm"?"hidden":"";
      return (
        <ul
          className={
            this.props.textRight +
            " list-unstyled no-padding-left toggleOnClick"
          }
        >
          <li
            className={
              "lightgray " +
              (this.props.createLink && this.props.createLink.length > 0
                ? " margin-top-gap form-group"
                : "") +
              (this.state.filters.length > 0 ? "" : " hidden")
            }
            style={{ fontSize: "10px" }}
          >
            FILTER BY
          </li>
          {this.state.filters.map(function(filter) {
            var selected = this.state.selectedFilters[filter.filterKey];
            var applicable = this.state.applicableFilters[filter.filterKey];
            if (!Array.isArray(selected)) {
              selected = [];
            }
            if (
              filter.filterType == "multiPickList" ||
              filter.filterType == "pickList"
            ) {
              if (Array.isArray(filter.list)) {
                if (Array.isArray(applicable)) {
                  applicable = applicable.filter(function(key) {
                    return filter.list.indexOf(key) > -1;
                  });
                }

                selected = selected.filter(function(key) {
                  return filter.list.indexOf(key) > -1;
                });
              }
            }
            if (
              selected.length == 0 &&
              (Array.isArray(applicable) && applicable.length == 0)
            ) {
              return null;
            }

            if (
              filter.filterType == "boolean" &&
              Array.isArray(applicable) &&
              (applicable.indexOf("T") == -1 && applicable.indexOf(true) == -1)
            ) {
              return null;
            }
            return (
              <li
                key={global.guid()}
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                id={filter.filterKey + "List"}
              >
                <h5 className="text-uppercase no-margin">
                  <span className="link filterMainHeading">
                    {filter.filterName}
                  </span>
                </h5>
                <div
                  id={filter.filterKey + "Div"}
                  style={{ fontSize: "14px" }}
                  className="margin-bottom-gap-xs h6 remove-margin-top "
                >
                  {this.getFilterType(filter, selected, applicable)}
                </div>
              </li>
            );
          }, this)}
          <li className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-lg">
            <div className="filterFooterIcons text-center extra-margin-right ">
              <button
                onClick={self.reset}
                className="action-button extra-margin-right extra-padding"
                type="submit"
              >
                {"CANCEL"}
              </button>
              <button
                onClick={self.apply}
                className="upload-btn extra-padding no-margin"
                type="submit"
              >
                {"APPLY"}
              </button>
            </div>
          </li>
        </ul>
      );
    }
  }
});
exports.FilterResults = FilterResults;

var MultiPickListFilter = React.createClass({
  getInitialState: function() {
    return {
      filter: this.props.filter,
      changeState: "false",
      selected: this.props.selected
    };
  },
  searchOnEnter: function() {
    var input, filter, ul, li, a, i;
    input = this.searchText;
    filter = input.value.toUpperCase();
    ul = this.ul;
    li = ul.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
      a = li[i].getElementsByClassName("labelValue")[0];
      if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
        li[i].style.display = "";
      } else {
        li[i].style.display = "none";
      }
    }
  },
  performFilter: function(value) {
    this.searchText.value = "";
    this.searchOnEnter();
    var selected = this.state.selected;
    if (selected.indexOf(value) == -1) {
      selected.push(value);
    } else {
      selected = selected.filter(function(e) {
        return e != value;
      });
    }
    this.setState({ selected: selected });
    if (typeof this.props.callback == "function") {
      this.props.callback(this.state.filter.filterKey, selected);
    }
  },
  shouldComponentUpdate: function() {
    return false;
  },
  render: function() {
    var FilterLists = [];
    var filter = this.state.filter;
    for (var i = 0; i < filter.list.length; i++) {
      var id = global.guid();
      var labelStyle = {
        fontWeight: "normal",
        fontSize: "16px",
        display: "inline-flex",
        paddingLeft: "1px"
      };
      var notapplicable =
        Array.isArray(this.props.applicable) &&
        this.props.applicable.indexOf(filter.list[i]) == -1;
      var defaultChecked =
        this.props.selected.indexOf(filter.list[i]) > -1 ? true : false;
      //if(notapplicable){	defaultChecked=false; }
      var disabledStatus = notapplicable
        ? defaultChecked
          ? false
          : true
        : false;
      if (disabledStatus) {
        labelStyle["opacity"] = "0.3";
      }
      FilterLists.push(
        <li
          key={global.guid()}
          style={{ margin: "0px 0" }}
          className="form-group h4"
        >
          <input
            onChange={this.performFilter.bind(null, filter.list[i])}
            type="checkbox"
            id={id}
            name={filter.filterKey}
            value={filter.list[i]}
            defaultChecked={defaultChecked}
            disabled={disabledStatus}
          />
          <label
            htmlFor={id}
            className="vertical-align-middle no-margin"
            style={labelStyle}
          >
            <div
              className="labelValue"
              style={{
                padding: "0px 5px 5px 10px",
                margin: "-3px 0px",
                fontSize: "13px",
                width: "fit-content",
                whiteSpace: "pre-wrap"
              }}
            >
              {filter.list[i]}
            </div>
          </label>
        </li>
      );
    }
    var style = {};
    style =
      filter.list.length <= 6
        ? { fontSize: "14px", maxHeight: "350px" }
        : {
            fontSize: "14px",
            maxHeight: "310px",
            overflowY: "auto",
            overflowX: "hidden",
            paddingLeft: "1px !important"
          };
    if (this.props.device && this.props.device == "desktop") {
      style = { fontSize: "14px" };
    }
    return (
      <div
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  form-group"
        style={style}
      >
        <div className="searchPosition no-margin-top margin-bottom-gap-sm">
          <input
            type="text"
            ref={e => {
              this.searchText = e;
            }}
            onKeyUp={this.searchOnEnter}
            onClick={this.searchOnEnter}
            className="form-control"
            placeholder={"Search"}
          />
          <span
            className="icons8-search pointer filterSearch"
            onClick={this.searchOnEnter}
          />
        </div>
        <ul
          className="list-unstyled"
          ref={e => {
            this.ul = e;
          }}
        >
          {FilterLists}
        </ul>
      </div>
    );
  }
});

var ObjectFilter = React.createClass({
  getInitialState: function() {
    return { selectedObjects: this.props.selected, changeState: "false" };
  },
  lookUp: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    node.className =
      "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    var filters = {};
    if (
      this.props.filter.property &&
      this.props.filter.property.dataType &&
      this.props.filter.property.dataType.sideFilterBy &&
      this.props.filter.property.dataType.sideFilterBy == "@derivedId"
    ) {
      if (
        this.props.filter.property.dataType.hasOwnProperty("filterCondition")
      ) {
        var filterCondition = this.props.filter.property.dataType
          .filterCondition;
        var separators = ["=", "<", ">"];
        var cond = filterCondition.split(new RegExp(separators.join("|"), "g"));
        if (this.props.filter.derivedId != null) {
          filters[cond[0].split(".")[1].trim()] = [this.props.filter.derivedId];
        } else if (
          this.props.appliedFilters &&
          this.props.appliedFilters[cond[1].trim()]
        ) {
          filters[cond[0].split(".")[1].trim()] = this.props.appliedFilters[
            cond[1].trim()
          ];
        }
      }
    }
    if (
      Array.isArray(this.props.applicable) &&
      this.props.applicable.length > 0
    ) {
      filters[
        this.props.filter.property.dataType.refKey
      ] = this.props.applicable;
    }
    ReactDOM.render(
      <manageRecords.LookupComponent
        key={global.guid()}
        schema={
          this.props.filter.property &&
          this.props.filter.property.dataType.objRef
        }
        filters={filters}
        filter={"filter"}
        callback={this.fillData}
        org={this.props.org}
      />,
      node
    );
  },
  fillData: function(record) {
    var value = record.id;
    if (
      this.props.filter.property &&
      this.props.filter.property.dataType &&
      this.props.filter.property.dataType.refKey != "recordId"
    ) {
      value = record.value[this.props.filter.property.dataType.refKey];
    }
    var selected = this.state.selectedObjects;
    if (selected.indexOf(value) == -1) {
      selected.push(value);
      this.setState({ selectedObjects: selected }, function() {
        //self.props.performFilter();
      });
    } else {
      console.log("Object already selected");
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    //return (JSON.stringify(this.state.selectedObjects)!= JSON.stringify(nextState.selectedObjects));
    return true;
  },
  componentDidUpdate: function() {
    this.props.performFilter(
      this.props.filter.filterKey,
      this.state.selectedObjects
    );
  },
  componentDidMount: function() {},
  close: function(objVal) {
    //var self=this;
    this[objVal].className += " hidden";
    try {
      $("." + objVal)
        .find("input")
        .attr("checked", false);
      $(this[objVal])
        .find(".ObjectFilter")
        .removeClass("ObjectFilter");
    } catch (err) {
      console.log(err);
    }
    var temp = this.state.selectedObjects.filter(function(n) {
      return n != undefined && n != objVal;
    });
    this.setState({ selectedObjects: temp }, function() {
      //self.props.performFilter();
    });
  },
  render: function() {
    var self = this;
    var identifier = SchemaStore.get(
      self.props.filter.property.dataType.objRef
    )["@identifier"];
    if (self.props.filter.property.dataType.refKeyObjRef) {
      identifier = SchemaStore.get(
        self.props.filter.property.dataType.refKeyObjRef
      )["@identifier"];
    }
    var filters = {};
    if (
      this.props.filter.property &&
      this.props.filter.property.dataType &&
      this.props.filter.property.dataType.sideFilterBy &&
      this.props.filter.property.dataType.sideFilterBy == "@derivedId"
    ) {
      if (
        this.props.filter.property.dataType.hasOwnProperty("filterCondition")
      ) {
        var filterCondition = this.props.filter.property.dataType
          .filterCondition;
        var separators = ["=", "<", ">"];
        var cond = filterCondition.split(new RegExp(separators.join("|"), "g"));
        if (this.props.filter.derivedId != null) {
          filters[cond[0].split(".")[1].trim()] = [this.props.filter.derivedId];
        } else if (
          this.props.appliedFilters &&
          this.props.appliedFilters[cond[1].trim()]
        ) {
          filters[cond[0].split(".")[1].trim()] = this.props.appliedFilters[
            cond[1].trim()
          ];
        }
      }
    }
    if (
      Array.isArray(this.props.applicable) &&
      this.props.applicable.length > 0
    ) {
      filters[
        this.props.filter.property.dataType.refKey
      ] = this.props.applicable.filter(
        function(ele) {
          if (Array.isArray(this.state.selectedObjects)) {
            if (this.state.selectedObjects.indexOf(ele) > -1) {
              return false;
            } else {
              return true;
            }
          } else {
            return true;
          }
        }.bind(this)
      );
    }
    /*var filterComponent=<manageRecords.LookupComponent key ={global.guid()}
							schema={this.props.filter.property.dataType.objRef}
							filters={filters}
							filter={"filter"}
							callback={this.fillData}
							org={this.props.org}/>;*/
    var filterComponent = "";
    //if(Array.isArray(filters[this.props.filter.property.dataType.refKey]) && filters[this.props.filter.property.dataType.refKey].length>0)
    if (
      Array.isArray(this.props.applicable) &&
      Array.isArray(this.state.selectedObjects) &&
      this.state.selectedObjects.length == this.props.applicable.length
    ) {
      // nothing to return
    } else {
      filterComponent = (
        <manageRecords.AjaxLookUpComponent
          key={global.guid()}
          schema={this.props.filter.property.dataType.objRef}
          property={this.props.filter.property}
          filterDiv={this.props.filter.filterKey}
          org={this.props.org}
          noFormGroup={"yes"}
          filters={filters}
          filter={"filter"}
          callback={this.fillData}
          fullSearchBox={true}
          inline={true}
          openDefault={true}
        />
      );
    }
    //hidden
    var style = {
      fontSize: "14px",
      maxHeight: "300px",
      overflowY: "auto",
      overflowX: "hidden",
      paddingLeft: "1px !important"
    };
    if (this.props.device && this.props.device == "desktop") {
      style = {};
    }
    return (
      <div
        className={"row no-margin object" + this.props.objectCount + ""}
        style={style}
      >
        {/*<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-top-gap-sm " >
					<button type='button' className="action-button text-right noMinWidth" style={{"border":"none","padding":"0px","margin":"0px"}} onClick={this.lookUp}>Select</button>
			</div>*/}
        <div
          className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"
          ref={d => {
            this.objectRender = d;
          }}
        >
          {["a"].map(function(temp) {
            if (self.state.selectedObjects.length > 0) {
              return self.state.selectedObjects.map(function(val) {
                return (
                  <div key={global.guid()}>
                    <div
                      className={"parent-img-component " + val}
                      ref={s => {
                        self[val] = s;
                      }}
                    >
                      <div className="child-img-component extra-padding-right textEllipsis objectFilterMaxWidth ">
                        {self.props.filter.property.dataType.refKeyType ==
                        "text" ? (
                          <div>{val}</div>
                        ) : (
                          <common.UserIcon
                            filter={"filter"}
                            id={val}
                            org={self.props.org}
                            identifier={identifier}
                            rootSchema={
                              self.props.filter.property.dataType.refKeyObjRef
                                ? self.props.filter.property.dataType
                                    .refKeyObjRef
                                : self.props.filter.property.dataType.objRef
                            }
                          />
                        )}
                      </div>
                      <div className="child-img-component no-padding">
                        <div
                          className="icons8-delete  pull-right link"
                          style={{ fontSize: "14px" }}
                          onClick={self.close.bind(null, val)}
                          aria-hidden="true"
                        />
                        <input
                          className=" hidden ObjectFilter"
                          type="checkbox"
                          checked
                          name={self.props.filter.filterKey}
                          value={val}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            } else {
              return <div key={global.guid()} className="hidden" />;
            }
          })}
          <div className="col-xs-12 col-sm-12  col-lg-12 col-md-12 no-padding">
            {filterComponent}
          </div>
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
    var self = this;
    var all = this.state.all;
    this.textBox.value = "";
    if (all.indexOf(text) == -1) {
      all.push(text);
      this.setState({ all: all }, function() {
        self.props.performFilter();
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
    var value = this.textBox.value.trim();
    if (value != "") {
      self.fillData(value);
    }
  },
  close: function(objVal) {
    var self = this;
    this[objVal].className += " hidden";
    var temp = [];
    if (this.state.all.length > 0) {
      temp = this.state.all;
    }
    var flag = 0;
    for (var i = 0; i < temp.length; i++) {
      if (temp[i] == objVal) {
        delete temp[i];
        flag = 1;
      }
    }
    temp = temp.filter(function(n) {
      return n != undefined;
    });
    if (flag == 1) {
      this.setState({ all: temp }, function() {
        self.props.performFilter();
      });
    }
  },
  render: function() {
    var self = this;
    //var identifier=self.props.filter.property.displayName;
    var all = self.state.all;
    return (
      <div className="row no-margin">
        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding parent-img-component">
          <div className="child-img-component">
            <input
              type="text"
              className=""
              ref={input => {
                this.textBox = input;
              }}
            />
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
              <div key={global.guid()}>
                <span
                  className="parent-img-component"
                  ref={s => {
                    self[val] = s;
                  }}
                >
                  <span
                    key={global.guid()}
                    className="child-img-component extra-padding-right-sm "
                  >
                    {val}
                  </span>
                  <span className="child-img-component no-padding ">
                    &nbsp;&nbsp;
                    <span
                      className="icons8-delete  pull-right link"
                      onClick={self.close.bind(null, val)}
                      aria-hidden="true"
                    />
                    <input
                      className=" hidden ObjectFilter"
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

var ColorFilter = React.createClass({
  getInitialState: function() {
    var current;
    if (this.props.selected) {
      current = {};
      if (this.props.selected.split(" ").length > 0) {
        current.hex = this.props.selected.split(" ")[0];
      }
      if (this.props.selected.split(" ").length > 1) {
        current.group = this.props.selected.split(" ")[1];
      }
      if (this.props.selected.split(" ").length > 2) {
        current.name = this.props.selected.replace(current.hex, "").trim();
        current.name = current.name.replace(current.group, "").trim();
        if (!current.name) {
          current.name = current.group;
        }
      }
    }
    return { current: current };
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  componentDidMount: function() {
    WebUtils.getDefinition(
      "Colors",
      function(result) {
        if (!this._isUnmounted) this.setState({ colors: result });
      }.bind(this)
    );
  },
  setColor: function(color) {
    var value = "";
    if (color) {
      if (color.hex) {
        value += color.hex;
      }
      if (color.group) {
        value += " " + color.group;
      }
      if (color.name) {
        value += " " + color.name;
      }
    }
    this.setState({ current: color });
    this.props.callback(this.props.filter.filterKey, [value]);
  },
  render: function() {
    var self = this;
    if (
      typeof self.state.colors != "object" ||
      self.state.colors == undefined
    ) {
      return <div />;
    }
    return (
      <div
        className="form-group"
        style={{
          fontSize: "14px",
          maxWidth: "500px",
          overflowY: "auto",
          overflowX: "auto"
        }}
      >
        {
          <div>
            {/*GROUP SELECTOR*/}
            <div className="child-img-component">
              {Object.keys(self.state.colors).map(function(group) {
                var curr;
                self.state.colors[group].map(function(color) {
                  if (color.name == group) {
                    curr = color;
                  }
                });
                curr.group = group;
                return (
                  <div
                    className={
                      "colorGroup " +
                      (self.state.current && self.state.current.group == group
                        ? "colorBorder"
                        : "")
                    }
                    onClick={self.setColor.bind(null, curr)}
                    style={{ backgroundColor: curr.hex }}
                    title={group}
                    key={global.guid()}
                  />
                );
              })}
            </div>
            {/*COLOR SELECTOR*/}
            {self.state.current &&
            self.state.current.group &&
            typeof self.state.colors[self.state.current.group] == "object" ? (
              <div className="child-img-component">
                {self.state.colors[self.state.current.group].map(function(
                  color
                ) {
                  color.group = self.state.current
                    ? self.state.current.group
                    : "";
                  return (
                    <div
                      className={
                        "color " +
                        (self.state.current &&
                        self.state.current.hex == color.hex
                          ? "colorBorder"
                          : "")
                      }
                      onClick={self.setColor.bind(null, color)}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      key={global.guid()}
                    />
                  );
                })}
              </div>
            ) : (
              ""
            )}
          </div>
        }
      </div>
    );
  }
});

var RangeFilter = React.createClass({
  getInitialState: function() {
    var property = this.props.filter.property;
    var min = 0;
    var max = 1000;
    try {
      min = property.dataType.min ? property.dataType.min * 1 : 0;
      max = property.dataType.max ? property.dataType.max * 1 : 1000;
    } catch (err) {}
    return {
      current:
        Array.isArray(this.props.selected) && this.props.selected.length == 2
          ? this.props.selected
          : [min, max],
      min: min,
      max: max
    };
  },
  componentDidMount: function() {
    var self = this;
    $(this.slider).slider({
      range: true,
      min: self.state.min,
      max: self.state.max,
      values: self.state.current,
      slide: function(event, ui) {
        self.setRange(ui.values[0], ui.values[1]);
      }
    });
  },
  setRange: function(min, max) {
    this.setState({ current: [min, max] });
    this.props.callback(this.props.filter.filterKey, [min, max]);
  },
  render: function() {
    var units = "";
    try {
      units = this.props.filter.property.dataType.units;
      if (!units) {
        units = "";
      }
    } catch (err) {}
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  form-group margin-top-gap-sm">
        <div
          ref={e => {
            this.slider = e;
          }}
        />
        <div
          ref={e => {
            this.value = e;
          }}
          className="margin-top-gap-sm"
        >
          {Array.isArray(this.state.current)
            ? this.state.current[0] +
              " " +
              units +
              " - " +
              this.state.current[1] +
              " " +
              units
            : this.state.min +
              " " +
              units +
              " - " +
              this.state.max +
              " " +
              units}
        </div>
      </div>
    );
  }
});

var BooleanFilter = React.createClass({
  getInitialState: function() {
    return { current: this.props.selected };
  },
  componentDidMount: function() {},
  setProperty: function() {
    this.props.callback(this.props.filter.filterKey, [this.checkBox.checked]);
    this.setState({ current: this.checkBox.checked });
  },
  render: function() {
    //var self=this;
    var notapplicable =
      Array.isArray(this.props.applicable) &&
      this.props.applicable.indexOf(true) == -1 &&
      this.props.applicable.indexOf("T") == -1;
    var id = global.guid();
    var labelStyle = {
      fontWeight: "normal",
      fontSize: "16px",
      display: "inline-flex",
      paddingLeft: "1px"
    };
    if (notapplicable) {
      labelStyle["opacity"] = "0.3";
    }
    return (
      <div className="form-group" style={{ fontSize: "14px" }}>
        <input
          onChange={this.setProperty}
          type="checkbox"
          id={id}
          ref={e => {
            this.checkBox = e;
          }}
          checked={this.state.current}
          disabled={notapplicable ? true : false}
        />
        <label
          htmlFor={id}
          className="vertical-align-middle no-margin"
          style={labelStyle}
        >
          <div
            className="labelValue"
            style={{
              padding: "0px 5px 5px 10px",
              margin: "-4px 0px",
              fontSize: "13px",
              width: "fit-content",
              whiteSpace: "pre-wrap"
            }}
          >
            {this.props.filter.property && this.props.filter.property.prompt
              ? this.props.filter.property.prompt
              : this.props.filter.filterName}
          </div>
        </label>
      </div>
    );
  }
});
