/*
 * @author saikiran.vadlakonda
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../common.jsx");
var genericView = require("../view/genericView.jsx");
var SchemaStore = require("../../stores/SchemaStore");
var DefinitionStore = require("../../stores/DefinitionStore");
var router = require("../nav/router.jsx");
var summaryLimitCount = require("../../utils/global.js").summaryLimitCount; //9;
var WebUtils = require("../../utils/WebAPIUtils.js");
var global = require("../../utils/global.js");
var linkGenerator = require("./linkGenerator.jsx");
var genericNav = require("./genericNav.jsx");
var browserHistory = require("react-router").browserHistory;
var SearchStore = require("../../stores/SearchStore");
var SearchComponent = React.createClass({
  getInitialState: function() {
    var searches = common.getUserDoc().searches;
    if (!Array.isArray(searches)) {
      searches = [];
    }

    if (typeof Storage != "undefined") {
      if (
        Array.isArray(JSON.parse(localStorage.getItem("searches"))) &&
        searches.length == 0
      ) {
        searches = JSON.parse(localStorage.getItem("searches"));
      }
    }
    var temp = [];
    for (var i = searches.length - 1; i > -1; i--) {
      temp.push(searches[i]);
    }
    return { searches: temp, searchText: "" };
  },
  showRecent: function() {
    this.setState({ searchText: this.searchText.value.trim() });
  },
  setText: function(text) {
    this.searchText.value = text;
    this.search();
  },
  removeAllTexts: function() {
    if (common.getUserDoc().recordId) {
      common.updateSearchText(undefined, "removeAll");
      WebUtils.doPost(
        "/user?operation=updateSearchText",
        { type: "removeAll" },
        function() {}
      );
    }
    localStorage.setItem("searches", JSON.stringify([]));
    this.setState({ searches: [] });
  },
  removeText: function(text) {
    if (common.getUserDoc().recordId) {
      common.updateSearchText(text, "remove");
      WebUtils.doPost(
        "/user?operation=updateSearchText",
        { text: text, type: "remove" },
        function() {}
      );
    }
    var searches = common.getUserDoc().searches;
    if (!Array.isArray(searches)) {
      searches = [];
    }
    if (
      Array.isArray(JSON.parse(localStorage.getItem("searches"))) &&
      searches.length == 0
    ) {
      searches = JSON.parse(localStorage.getItem("searches"));
    }
    searches = searches.filter(function(k) {
      return k != text;
    });
    localStorage.setItem("searches", JSON.stringify(searches));
    this.setState({ searches: searches });
  },
  newSearch: function(text) {
    if (common.getUserDoc().recordId) {
      common.updateSearchText(text);
      WebUtils.doPost(
        "/user?operation=updateSearchText",
        { text: text, type: "add" },
        function() {}
      );
    }
    var searches = common.getUserDoc().searches;
    if (!Array.isArray(searches)) {
      searches = [];
    }
    if (
      Array.isArray(JSON.parse(localStorage.getItem("searches"))) &&
      searches.length == 0
    ) {
      searches = JSON.parse(localStorage.getItem("searches"));
    }
    if (searches.indexOf(text) == -1) {
      searches.push(text);
    }
    if (searches.length > 100) {
      searches.splice(0, 1);
    }
    localStorage.setItem("searches", JSON.stringify(searches));
  },
  forceSearch: function(event) {
    var code = event.keyCode ? event.keyCode : event.which;
    if (code == 13) {
      this.search();
    } else {
      this.showRecent();
    }
  },
  search: function() {
    var self = this;
    var text = this.searchText.value.trim();
    if (!text) {
      console.log("Enter Text To Search");
    } else if (/[\w]{3}/.test(text)) {
      this.newSearch(text);
      if (this.props.from == "mobile") {
        if (typeof self.props.close == "function") {
          self.props.close();
        }
        browserHistory.push(
          linkGenerator.getSearchLink({ text: text, mobile: true })
        );
      } else {
        browserHistory.push(linkGenerator.getSearchLink({ text: text }));
      }
      try {
        trackThis("search", { text: text });
      } catch (err) {}
    } else {
      alert("Enter Minimum 3 letters to search...\nThank you");
    }
  },
  componentDidMount: function() {
    var self = this;
    /*	$(this.searchText).focus(function(){
			   $(self.searchItems).removeClass("hidden");
			});
			$(this.searchText).blur(function(){
				 $(self.searchItems).addClass("hidden");
			});*/
  },
  takeToLink: function(sublink) {
    browserHistory.push(genericNav.getSubNavUrl(sublink, "public"));
  },
  getSearchItems: function() {
    var count = 0;
    var self = this;
    var navLinks = DefinitionStore.getNavigationLinks();
    return (
      <div>
        {this.state.searches.map(function(st) {
          if (count > 5) {
            return null;
          }
          if (
            self.state.searchText != "" &&
            st.toLowerCase().indexOf(self.state.searchText.toLowerCase()) > -1
          ) {
            count++;
            return (
              <div key={global.guid()}>
                <div
                  className="icons8-browser-history child-img-component fa-2x"
                  style={{ color: "grey" }}
                />
                <div
                  className="link child-img-component"
                  onClick={self.setText.bind(null, st)}
                  title={st}
                >
                  {st}
                </div>
                <div
                  className="icons8-delete link child-img-component"
                  style={{ fontSize: "14px" }}
                  onClick={self.removeText.bind(null, st)}
                  title={st}
                />
              </div>
            );
          } else if (self.state.searchText == "") {
            count++;
            return (
              <div key={global.guid()}>
                <div
                  className="icons8-browser-history child-img-component fa-2x"
                  style={{ color: "grey" }}
                />
                <div
                  className="link child-img-component"
                  onClick={self.setText.bind(null, st)}
                  title={st}
                >
                  {st}
                </div>
                <div
                  className="icons8-delete link child-img-component"
                  style={{ fontSize: "14px" }}
                  onClick={self.removeText.bind(null, st)}
                  title={st}
                />
              </div>
            );
          } else {
            return <div className="hidden" key={global.guid()} />;
          }
        })}
        {typeof navLinks == "object" &&
        navLinks != null &&
        Array.isArray(navLinks.navs) ? (
          <div>
            {navLinks.navs.map(function(orgNav) {
              if (orgNav.org == "public" && Array.isArray(orgNav.elements)) {
                return orgNav.elements.map(function(sublink) {
                  if (sublink.target && sublink.target.schema) {
                    if (
                      self.state.searchText == "" ||
                      sublink.displayName
                        .toLowerCase()
                        .indexOf(self.state.searchText.toLowerCase()) > -1
                    )
                      return (
                        <div key={global.guid()}>
                          <div
                            className="icons8-summary-list-2 child-img-component fa-2x"
                            style={{ color: "grey" }}
                          />
                          <div
                            className="link text-capitalize child-img-component"
                            onClick={self.takeToLink.bind(null, sublink)}
                            dangerouslySetInnerHTML={{
                              __html: sublink.displayName
                                .toLowerCase()
                                .replace(
                                  new RegExp(self.state.searchText, "ig"),
                                  "<b>" + self.state.searchText + "</b>"
                                )
                            }}
                          />
                        </div>
                      );
                  } else if (Array.isArray(sublink.target.elements)) {
                    if (self.state.searchText != "")
                      return sublink.target.elements.map(function(level2links) {
                        if (level2links.target && level2links.target.schema) {
                          if (
                            level2links.displayName
                              .toLowerCase()
                              .indexOf(self.state.searchText.toLowerCase()) > -1
                          )
                            return (
                              <div key={global.guid()}>
                                <div
                                  className="icons8-summary-list-2 child-img-component fa-2x"
                                  style={{ color: "grey" }}
                                />
                                <div
                                  className="link text-capitalize child-img-component"
                                  onClick={self.takeToLink.bind(
                                    null,
                                    level2links
                                  )}
                                  dangerouslySetInnerHTML={{
                                    __html: level2links.displayName
                                      .toLowerCase()
                                      .replace(
                                        new RegExp(self.state.searchText, "ig"),
                                        "<b>" + self.state.searchText + "</b>"
                                      )
                                  }}
                                />
                              </div>
                            );
                        } else if (Array.isArray(level2links.target.elements)) {
                          return level2links.target.elements.map(function(
                            level3links
                          ) {
                            if (
                              level3links.target &&
                              level3links.target.schema
                            ) {
                              if (
                                level3links.displayName
                                  .toLowerCase()
                                  .indexOf(
                                    self.state.searchText.toLowerCase()
                                  ) > -1
                              )
                                return (
                                  <div key={global.guid()}>
                                    <div
                                      className="icons8-summary-list-2 child-img-component fa-2x"
                                      style={{ color: "grey" }}
                                    />
                                    <div
                                      className="link text-capitalize child-img-component"
                                      onClick={self.takeToLink.bind(
                                        null,
                                        level3links
                                      )}
                                      dangerouslySetInnerHTML={{
                                        __html: level3links.displayName
                                          .toLowerCase()
                                          .replace(
                                            new RegExp(
                                              self.state.searchText,
                                              "ig"
                                            ),
                                            "<b>" +
                                              self.state.searchText +
                                              "</b>"
                                          )
                                      }}
                                    />
                                  </div>
                                );
                            } else if (
                              Array.isArray(level3links.target.elements)
                            ) {
                              return null;
                              /*return level3links.target.elements.map(function(level4links){
																return <div>level4links</div>
															})*/
                            }
                          });
                        }
                      });
                  }
                });
              }
            })}
          </div>
        ) : (
          ""
        )}
        {this.state.searchText == "" && this.state.searches.length > 1 ? (
          <div>
            <div
              className="link child-img-component blueLink"
              onClick={this.removeAllTexts}
              title="Clear search history"
            >
              {"Clear search history"}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    );
  },
  render: function() {
    var self = this;

    if (this.props.desktop) {
      /*return (<div  key={global.guid()}  className="child-img-component  extra-margin-bottom    col-lg-10 col-md-10 col-sm-8 col-xs-12 no-padding" style={{"marginTop":"8px"}} >
						<div className="display-inline-block extra-padding-right-sm vertical-align-top ">
							<span className="icons8-search" style={{"fontSize":"20px","position": "relative","top": "3px"}}></span>
						</div>
						<div className="searchPosition newSearch display-inline-block">
							<input type='text' style={{"textIndent":"10px"}} ref={(input)=>{this.searchText=input}} placeholder={(getConfigDetails() && getConfigDetails().searchBarText)?getConfigDetails().searchBarText:"Search"} className="form-control navSearchInput search-input" onKeyPress={this.forceSearch}></input>
							<span className="icons8-delete link searchImgPosition" style={{"top": "5px","right": "5px","width": "auto"}} onClick={this.closeSearch} />
						</div>
					</div>)*/

      return (
        <div className="col-lg-9 col-md-9 col-sm-8 col-xs-12 no-padding">
          <div className="searchPosition searchBox">
            <input
              type="text"
              style={{ textIndent: "10px" }}
              ref={input => {
                this.searchText = input;
              }}
              placeholder={
                common.getConfigDetails() &&
                common.getConfigDetails().searchBarText
                  ? common.getConfigDetails().searchBarText
                  : "Search"
              }
              className="form-control navSearchInput search-input"
              onKeyUp={this.forceSearch}
              defaultValue={this.state.searchText}
              onClick={this.showRecent}
              maxLength={60}
            />
            <span
              className="icons8-search searchImgPosition"
              style={{ fontSize: "20px", top: "3px" }}
            />
            <span
              className="icons8-delete link searchImgPosition hidden"
              style={{ top: "5px", right: "5px", width: "auto" }}
              onClick={this.props.closeSearch}
            />
          </div>
          <div
            className="searchPosition  display-inline-block searchItems"
            ref={input => {
              this.searchItems = input;
            }}
            style={{
              backgroundColor: "#FFFFFF",
              paddingLeft: "10px",
              maxHeight: "500px",
              overflow: "auto"
            }}
          >
            {this.getSearchItems()}
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="h5 searchPosition">
          <input
            type="text"
            ref={input => {
              this.searchText = input;
            }}
            title={"Please enter text to search"}
            onClick={this.showRecent}
            placeholder={
              common.getConfigDetails() &&
              common.getConfigDetails().searchBarText
                ? common.getConfigDetails().searchBarText
                : "Search"
            }
            className="form-control search-input"
            onKeyUp={this.forceSearch}
          />
          <span
            className="icons8-search pointer searchImgPosition"
            onClick={this.search}
          />
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "10px" }}>
          {this.getSearchItems()}
        </div>
      </div>
    );
  }
});
exports.SearchComponent = SearchComponent;

/**
 *
 *	schema
 *	searchText
 */
var SearchResultsBySchema = React.createClass({
  getStateFromProps: function(props) {
    var searchRecords = SearchStore.get(props.searchText, props.schema);
    searchRecords = Array.isArray(searchRecords) ? searchRecords : [];
    return {
      data: searchRecords,
      schema: props.schema,
      searchText: props.searchText,
      skip: 0,
      limit: props.limit ? props.limit * 1 : summaryLimitCount,
      total: 0,
      tabCheck: true,
      shouldComponentUpdate:false
    };
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState(this.getStateFromProps(nextProps), function() {
      this.componentDidMount();
    });
  },
  getInitialState: function() {
    return this.getStateFromProps(this.props);
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  getRecsSearchBydocType:function(){
	var self = this;
    var searchData = {
      searchText: this.state.searchText,
      docType: this.state.schema,
      from: this.state.skip,
      size: this.state.limit
    };
    common.startLoader();
    WebUtils.doPost("/search?operation=searchBydocType",searchData,function(result) {
        if (result.data.result) {
	        var serchRecords = [];
	        var total = 0;
	        try {
	           serchRecords = result.data.result.hits.hits;
	           total = result.data.result.hits.total;
	        } catch (err) {}
		    var schema = this.state.schema;
			var records = [];
	    	serchRecords.map(function(record) {
	      		if (schema == undefined) {schema = record["_source"]["doc"]["docType"];}
  				if (schema && record["_source"]["doc"]["docType"] == schema) {
    				records.push({
      					id: record["_id"],
      					key: [],
      					value: record["_source"]["doc"]
    				});
  				}
    		});
    	 	if (!this._isUnmounted)
	    	this.setState({total:total,data: records, schema: schema,shouldComponentUpdate:true }, function() {
	      		if (this.state.tabCheck) {
	        		this.tabData();
 	    		}
    		}.bind(this));
          	common.stopLoader();
		} else {
			console.log("Try Again" + JSON.stringify(result.data));
			common.stopLoader();
		}
	}.bind(this));
  },
  componentDidMount: function() {
    this.getRecsSearchBydocType();
	if (document.getElementById("bottomNav")) {
		ReactDOM.render(<common.BottomNavComponent />,document.getElementById("bottomNav"));
	}
  },
  pageSelected: function() {
    this.setState({loadMore:false,shouldComponentUpdate:false,skip:this.pageSelect.value * 1 * this.state.limit},function(){
    	this.getRecsSearchBydocType();
    	this.scrollToRoot();
    }.bind(this));
  },
  reduceSkipCount: function() {
    if (this.state.skip > 0) {
      this.setState({loadMore:false,shouldComponentUpdate:false,skip:this.state.skip - this.state.limit},function(){
    		this.getRecsSearchBydocType();
    		this.scrollToRoot();
 	   }.bind(this));
    }
  },
  scrollToRoot: function() {
  	if(this.state.loadMore){
  		try{$("html, body,.lookUpDialogBox").animate({
    		scrollTop: $($(".SummarizeAll div[itemscope]")[Math.ceil($(".SummarizeAll div[itemscope]").length/2)]).offset().top - 60
    	}, 0);}catch(err){}
  	}else{
	    var top = $(this.rootNode).offset().top - 150;
	    $("html, body").animate({
	      scrollTop: top
	    });
   }
  },
  increaseSkipCount: function() {
    if (this.state.total >= this.state.skip + this.state.limit + 1) {
		this.setState({loadMore:false,shouldComponentUpdate:false,skip:this.state.skip + this.state.limit},function(){
    		this.getRecsSearchBydocType();
    		this.scrollToRoot();
   		}.bind(this));
    }
  },
  loadMore:function(){
	var self=this;
	var limitCount=(this.props.limit)?this.props.limit*1:summaryLimitCount//default limitCount
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
	this.setState({loadMore:true,shouldComponentUpdate:false,skip:newSkip,limit:newLimitCount},function(){
    	this.getRecsSearchBydocType();
    	this.scrollToRoot();
    }.bind(this));
  },
  loadPrev:function(){
	var self=this;
    var limitCount=(this.props.limit)?this.props.limit*1:summaryLimitCount;//default limitCount
    var newSkip=this.state.skip;
    //reduce skip count on evey scroll up
    if(newSkip>limitCount){
    	newSkip=newSkip-limitCount;
    }else{
    	newSkip=0;
    }
  	this.setState({shouldComponentUpdate:false,skip:newSkip,limit:newLimitCount},function(){
    	this.getRecsSearchBydocType();
    	this.scrollToRoot();
    }.bind(this));
  },
  tabData: function() {
    var self = this;
    if (self.props.tabData != undefined && self.props.showTab != undefined) {
      if (self.state.data && self.state.data.length > 0) {
        self.setState({ tabCheck: false }, function() {
          self.props.showTab(self.props.tabData);
        });
      }
    } else if (typeof this.props.tabData == "undefined") {
      self.setState({ tabCheck: false });
    }
  },
  render: function() {
    var self = this;
    var heading = "";
    var UILayout =this.props.UILayout && this.props.UILayout == "CarouselGallery"? true: false;
    if (
      typeof this.props.searchText == "string" &&
      self.state.schema &&
      SchemaStore.get(self.state.schema) &&
      SchemaStore.get(self.state.schema)["displayName"] &&
      !self.props.fromExplore
    ) {
      heading = (
        <h5 className="form-group remove-margin-top">
          {" Showing " +
            '"' +
            this.props.searchText +
            '" ' +
            SchemaStore.get(self.state.schema)["displayName"].toUpperCase()}
        </h5>
      );
    }
    if (this.props.showRelatedHeading && self.state.data.length > 0) {
      var marginTop = UILayout ? "margin-top-gap-sm" : "";
      heading = (
        <h2 className={" " + marginTop}>{this.props.showRelatedHeading}</h2>
      );
    }
    var count = 0;
    return (
      <div
        ref={input => {this.rootNode = input;}}
        className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
        {heading}
        {UILayout && self.state.data && self.state.data.length > 0 ? (
          <CarouselGallery
            data={self.state.data}
            searchText={self.props.searchText}
            fromExplore={self.props.fromExplore}
            viewName={self.props.viewName}
            rootSchema={self.state.schema}
            limit={self.state.limit}
            reduceSkipCount={
              self.state.skip > 0 ? this.reduceSkipCount : undefined
            }
            increaseSkipCount={
              self.state.total >= this.state.skip + this.state.limit + 1
                ? this.increaseSkipCount
                : undefined
            }
          />
        ) : (
          <div className="SummarizeAll col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
            {self.state.data.map(function(record) {
              count++;
              if (count > self.state.limit) {
                return null;
              }
              return (
                <genericView.GoIntoDetail
                  key={global.guid()}
                  summary={true}
                  fromExplore={self.props.fromExplore}
                  noGallery={self.props.noGallery}
                  displayName={"no"}
                  viewName={self.props.viewName}
                  rootSchema={self.state.schema}
                  record={record}
                  recordId={record["id"]}
                  org={"public"}
                  fromRelation={"search"}
                />
              );
            })}

             {this.state.total >= this.state.skip + this.state.limit + 1 ? (
              <div className="text-center margin-top-gap">
                <button key={global.guid()} className="loadMore upload-btn pointer" ref={(e)=>{this.loadMoreButton=e;}} id="loadMore" onClick={this.loadMore}>Load More</button>
              </div>
              ):(<span />)}

          </div>
        )}
        <div
          ref={d => {
            this.paginationDiv = d;
          }}
          className={
            "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap pagination " +
            (UILayout ? "hidden" : "")
          }
          id={"pagination"}
        >
          <div className="pull-right">
            {this.state.skip > 0 ? (
              <div
                className="link display-table-cell extra-padding-right"
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
            {this.state.total && this.state.total > this.state.limit ? (
              <div className="link display-table-cell extra-padding-right vertical-align-top">
                <select
                  className="form-control"
                  ref={select => {
                    self.pageSelect = select;
                  }}
                  onChange={self.pageSelected}
                  defaultValue={Math.floor(self.state.skip / this.state.limit)}
                  key={global.guid()}
                >
                  <option value={0}>1</option>
                  {[1].map(function() {
                    var options = [];
                    for (
                      var si = 1;
                      si < self.state.total / self.state.limit;
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
            {this.state.total >= this.state.skip + this.state.limit + 1 ? (
              <div
                className="link display-table-cell  "
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

exports.SearchResultsBySchema = SearchResultsBySchema;

var CarouselGallery = React.createClass({
  getInitialState: function() {
    return { myCarouselId: global.guid() };
  },

  componentDidMount: function() {
    this.hideAndShowArrows(
      0,
      $("#" + this.state.myCarouselId + " .item").length
    );
  },
  seeAll: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className =
      "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    common.startLoader();
    ReactDOM.render(
      <common.GenericPopUpComponent
        popUpId={popUpId}
        contentDivId={contentDivId}
        sideDivId={sideDivId}
      />,
      node
    );
    if (this.props.searchText) {
      ReactDOM.render(
        <SearchResultsBySchema limit={18} searchText={this.props.searchText} />,
        document.getElementById(contentDivId)
      );
    } else {
      var relation = this.props.relation;
      relation["relationView"] = "";
      ReactDOM.render(
        <genericView.RelatedRecords
          summary={this.props.summary}
          parentLayout={this.props.parentLayout}
          showingForRelatedViewOfRecordId={
            this.props.showingForRelatedViewOfRecordId
          }
          css={this.props.css}
          rootSchema={this.props.mainRootSchema}
          dependentSchema={this.props.dependentSchema}
          schemaDoc={this.props.mainSchemaDoc}
          recordId={this.props.recordId}
          relation={relation}
          limit={18}
          org={this.props.org}
          rootRecord={this.props.rootRecord}
        />,
        document.getElementById(contentDivId)
      );
    }
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
      if (typeof this.props.increaseSkipCount == "function")
        this.rightArrowRF.className = this.rightArrow.className.replace(
          /hidden/g,
          ""
        );
    } else {
      this.rightArrow.className = this.rightArrow.className.replace(
        /hidden/g,
        ""
      );
      if (typeof this.props.increaseSkipCount == "function")
        this.rightArrowRF.className += " hidden";
    }
    if (i == 0) {
      this.leftArrow.className += " hidden";
      if (typeof this.props.reduceSkipCount == "function")
        this.leftArrowRF.className = this.leftArrow.className.replace(
          /hidden/g,
          ""
        );
    } else {
      this.leftArrow.className = this.leftArrow.className.replace(
        /hidden/g,
        ""
      );
      if (typeof this.props.reduceSkipCount == "function")
        this.leftArrowRF.className += " hidden";
    }
  },
  componentDidUpdate: function() {
    this.componentDidMount();
  },
  next: function(id) {
    var totalItems = $("#" + id + " .item");
    for (var i = 0; i < totalItems.length; i++) {
      if (totalItems[i].className.indexOf("active") != -1) {
        this.hideAndShowArrows(i + 1, totalItems.length);
      }
    }
  },
  render: function() {
    var width = common.calWidth();
    var count = width.visibleCount;
    var colSize = width.colSize;
    var myCarouselId = this.state.myCarouselId;
    var self = this;
    var totalCards = [];
    var flag = 0;
    var limit = this.props.limit
      ? this.props.limit * 1
      : this.props.data.length - 1;
    do {
      var temp = [];
      for (
        var ti = flag;
        ti < (flag + count < limit ? flag + count : this.props.data.length - 1);
        ti++
      ) {
        temp.push(this.props.data[ti]);
      }
      flag += count;
      totalCards.push(temp);
    } while (flag < this.props.data.length - 1);
    return (
      <div
        className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding line-sm "
        key={global.guid()}
      >
        {/*<h5 className="pull-right link hidden" onClick={self.seeAll} style={{"position":"relative","top":"-20px"}}>See All</h5>*/}
        <div
          id={myCarouselId}
          className="carousel slide margin-bottom-gap"
          data-interval="false"
          data-ride="carousel"
        >
          <div className="carousel-inner carouselGallery">
            {totalCards.map(function(arrayData, index) {
              var firstSlide = index == 0 ? "active" : "";
              return (
                <div
                  key={global.guid()}
                  ref={d => {
                    self["item" + index] = d;
                  }}
                  className={"item " + firstSlide}
                >
                  {arrayData.map(function(record, index1) {
                    if (record) {
                      return (
                        <div
                          key={global.guid()}
                          className={
                            "col-md-" +
                            colSize +
                            " col-sm-" +
                            colSize +
                            " col-xs-" +
                            colSize +
                            " innerItems"
                          }
                        >
                          <common.UserIcon
                            fromRelation={
                              self.props.fromRelation == "noSearch"
                                ? undefined
                                : "search"
                            }
                            parentLayout={"gallery"}
                            fromExplore={self.props.fromExplore}
                            viewName={self.props.viewName}
                            id={record["id"]}
                            record={record}
                            org={"public"}
                            rootSchema={self.props.rootSchema}
                          />
                        </div>
                      );
                    } else {
                      return <div key={global.guid()} />;
                    }
                  })}
                </div>
              );
            })}
          </div>
          <a
            className="left carousel-control hidden"
            style={{ width: "auto" }}
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
          {typeof this.props.reduceSkipCount == "function" ? (
            <a
              className="left carousel-control hidden"
              style={{ width: "auto" }}
              ref={d => {
                self["leftArrowRF"] = d;
              }}
              onClick={self.props.reduceSkipCount}
            >
              <i className="sleekIcon-leftarrow fa-2x link " />
              <span className="sr-only">Previous</span>
            </a>
          ) : (
            ""
          )}
          <a
            className="right carousel-control hidden"
            style={{ width: "auto" }}
            href={"#" + myCarouselId}
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
          {typeof this.props.increaseSkipCount == "function" ? (
            <a
              className="right carousel-control hidden"
              style={{ width: "auto" }}
              ref={d => {
                self["rightArrowRF"] = d;
              }}
              onClick={self.props.increaseSkipCount}
            >
              <i className="sleekIcon-rightarrow fa-2x link " />
              <span className="sr-only">Next</span>
            </a>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
});
exports.CarouselGallery = CarouselGallery;

/***
 *	searchText
 * 	searchResult
 */
var SearchNav = React.createClass({
  searchByschema: function(result) {
    if (this.props.mobile) {
      $(".navbar-toggle").click();
    }
    this.props.changeState(result);
    //	ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
    //ReactDOM.render(<SearchResultsBySchema schema={result} searchText={this.props.searchText}/>,document.getElementById('dynamicContentDiv'))
  },
  handleBack: function() {
    history.back();
    return;
  },
  componentDidMount: function() {
    if (this.props.mobile) {
      $(".navbar-toggle").click();
      setTimeout(function() {
        if (
          document
            .getElementById("summaryNav")
            .parentNode.className.indexOf("collapse ") == -1 &&
          document
            .getElementById("summaryNav")
            .parentNode.className.indexOf("in") == -1
        ) {
          document.getElementById("summaryNav").parentNode.className +=
            " collapse in";
        }
      }, 1000);
    }
  },
  render: function() {
    var self = this;
    if (
      self.props.searchResult &&
      typeof self.props.searchResult == "object" &&
      Object.keys(self.props.searchResult).length > 0
    ) {
      return (
        <ul className="jsm list-unstyled no-padding-left">
          <li className="form-group ">
            {this.props.mobile ? (
              <span>
                <span>Showing results for &nbsp;</span>
                <span>{'"' + this.props.searchText + '" '}</span>
              </span>
            ) : (
              <span>
                <span className="home-arrow link" />
                <span className="link" onClick={this.handleBack}>
                  BACK
                </span>
              </span>
            )}
          </li>
          {Object.keys(self.props.searchResult).map(function(result) {
            var name = result;
            if (
              SchemaStore.get(result) &&
              SchemaStore.get(result)["displayName"]
            ) {
              name = SchemaStore.get(result)["displayName"];
            }
            return (
              <li key={global.guid()} className="form-group">
                <span
                  className="link "
                  onClick={self.searchByschema.bind(null, result)}
                >
                  {name + "  (" + self.props.searchResult[result] + ")  "}
                </span>
              </li>
            );
          }, this)}
        </ul>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});

/**
 *
 *  **/
var SearchResults = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return JSON.stringify(this.state) != JSON.stringify(nextState);
  },
  getInitialState: function() {
    return { searchResult: {}, loading: "Searching...", schemaCount: 0 };
  },
  componentWillMount: function() {
    if (typeof window != "undefined") {
      document.getElementById("sideFilterNavigation").className =
        "col-xs-12 col-sm-3  col-lg-2 col-md-2 ";
      document.getElementById("dynamicContentDiv").className =
        "col-xs-12 col-sm-9  col-lg-10 col-md-10 ";
    }
  },
  componentDidUpdate: function() {
    document.getElementById("sideFilterNavigation").className =
      "col-xs-12 col-sm-3  col-lg-2 col-md-2 ";
    document.getElementById("dynamicContentDiv").className =
      "col-xs-12 col-sm-9  col-lg-10 col-md-10 ";
  },
  componentDidMount: function() {
    WebUtils.doPost(
      "/search?operation=getSearchCounts",
      { searchText: this.props.searchText },
      function(result) {
        var divId = "sideFilterNavigation";
        if (this.props.mobile == "true") {
          //for mobile
          $("#mainNavigation").addClass("hideMainNav");
          if (
            document.getElementsByClassName("summaryNavigation")[0] &&
            document.getElementsByClassName("summaryNavigation")[0].className &&
            document
              .getElementsByClassName("summaryNavigation")[0]
              .className.indexOf("in") != -1
          ) {
            document.getElementsByClassName(
              "summaryNavigation"
            )[0].className = document
              .getElementsByClassName("summaryNavigation")[0]
              .className.replace("in", "");
          }
          divId = "summaryNav";
          common.mobileSearch();
          try {
            //ReactDOM.unmountComponentAtNode(document.getElementById("mainNavigation"))
            document.getElementById("summaryNav").parentNode.className =
              "col-lg-12 col-md-12 col-sm-12 col-xs-12 navbar-collapse-1 summaryNavigation";
          } catch (err) {
            console.log(err);
          }
          if (document.getElementsByClassName("lookUpDialogBox")) {
            $(".lookUpDialogBox").remove();
          }
          $(".summaryNavigation").removeClass("hidden");
          $("#summaryNav").removeClass("hidden");
          //document.getElementById("summaryNav").className=document.getElementById("summaryNav").className.replace("hidden","");
          //	$(".summaryNavigation").addClass("showContent");
        }
        //
        if (
          result &&
          typeof result == "object" &&
          Object.keys(result).length > 0
        ) {
          if (!this._isUnmounted)
            this.setState(
              { searchResult: result, loading: "" },
              function() {
                //ReactDOM.unmountComponentAtNode(document.getElementById(divId));
                ReactDOM.render(
                  <SearchNav
                    changeState={this.changeState}
                    mobile={this.props.mobile}
                    searchResult={this.state.searchResult}
                    searchText={this.props.searchText}
                  />,
                  document.getElementById(divId)
                );
              }.bind(this)
            );
        } else {
          //ReactDOM.unmountComponentAtNode(document.getElementById(divId));
          this.setState({ loading: "No Results Found" });
          console.log("Try Again Invalid Search");
        }
      }.bind(this)
    );
  },
  changeState: function(schema) {
    var schemaCount = Object.keys(this.state.searchResult).indexOf(schema);
    if (schemaCount != this.state.schemaCount) {
      this.setState({ schemaCount: schemaCount });
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return JSON.stringify(this.state) != JSON.stringify(nextState);
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    if (
      this.state.searchResult &&
      typeof this.state.searchResult == "object" &&
      Object.keys(this.state.searchResult).length > 0
    ) {
      return (
        <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
          <SearchResultsBySchema
            schema={
              Object.keys(this.state.searchResult)[this.state.schemaCount]
            }
            searchText={this.props.searchText}
          />
        </div>
      );
    } else {
      return (
        <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
          <h5>{this.state.loading}</h5>
        </div>
      );
    }
  }
});
exports.SearchResults = SearchResults;
