var React = require("react");
var ReactDOM = require("react-dom");
var WebUtils = require("../../utils/WebAPIUtils.js");
//var Utility=require("../Utility.jsx");
var common = require("../common.jsx");
var Editor = require("../records/richTextEditor.jsx").MyEditor;
//var router=require('./router.jsx');
//var genericNav=require('./genericNav.jsx');
var search = require("./search.jsx");
var SchemaStore = require("../../stores/SchemaStore.js");
var manageSchemaNew = require("../admin/manageSchemaNew.jsx");
var global = require("../../utils/global.js");
//var linkGenerator=require('./linkGenerator.jsx');
var browserHistory = require("react-router").browserHistory;

var ExploreMeta = React.createClass({
  getInitialState: function() {
    if (this.props.data) {
      return {
        searchText: this.props.searchText,
        recordId: this.props.data.recordId,
        webCrawlerIndex: this.props.data.webCrawlerIndex,
        mainLayout: this.props.data.mainLayout /*layout **/,
        headingContent: this.props.data.headingContent,
        htmlMeta: this.props.data.htmlMeta,
        heading1: this.props.data.heading1,
        uniqueUserName: this.props.data["@uniqueUserName"]
      };
    } else {
      return {
        searchText: this.props.searchText,
        webCrawlerIndex: false,
        recordId: "discover-" + global.guid(),
        mainLayout: [] /*layout **/,
        headingContent: "",
        htmlMeta: {
          title: "",
          description: "",
          keywords: "",
          image_src: "",
          ogTitle: "",
          ogDescription: ""
        },
        heading1: this.props.searchText,
        uniqueUserName: this.props.searchText.split(" ").join("-")
      };
    }
  },

  saveExploreMeta: function() {
    this.rearrangeDiv();
    var webCrawlerIndex = this.webCrawlerIndex.checked;
    var self = this;
    var htmlMeta = {
      title: this.title.value.trim(),
      description: this.description.value.trim(),
      keywords: this.keywords.value.trim(),
      image_src: this.image_src.value.trim(),
      ogTitle: this.ogTitle.value.trim(),
      ogDescription: this.ogDescription.value.trim()
    };
    common.startLoader();
    /** saving the data **/
    var data = {
      docType: "Discover",
      recordId: this.state.recordId,
      searchText: this.props.searchText,
      "@uniqueUserName": this.state.uniqueUserName,
      webCrawlerIndex: webCrawlerIndex,
      htmlMeta: htmlMeta,
      heading1: this.heading1.value.trim(),
      mainLayout: this.state.mainLayout,
      headingContent: this.state.headingContent
    };
    WebUtils.doPost("/generic?operation=saveExploreMeta", data, function(res) {
      common.stopLoader();
      if (res && res.error) {
        alert(res.error);
      }
      browserHistory.push(location.pathname);
      //location.reload();
      self.close();
    });
  },

  close: function() {
    common.showMainContainer();
    document.getElementById(this.props.popUpId).parentNode.remove();
  },

  addSearchResultsBySchema: function() {
    manageSchemaNew.getPopupContent("Add Search Results By Schema", "");
    ReactDOM.render(
      <AddSearchResults
        searchResult={this.props.searchResult}
        callback={this.setSearchResultsBySchema}
      />,
      document.getElementById("genericPopupBody")
    );
  },

  setSearchResultsBySchema: function(
    schemaName,
    richTextContent,
    richBottomContent,
    index
  ) {
    var layDesign = {
      type: "searchSchema",
      schemaName: schemaName,
      richTextContent: richTextContent,
      richBottomContent: richBottomContent
    };
    var mainLayout = this.state.mainLayout;
    if (typeof index != "undefined") {
      delete mainLayout[index];
      mainLayout[index] = layDesign;
    } else {
      mainLayout.push(layDesign);
    }
    this.setState({ mainLayout: mainLayout });
  },

  setRichText: function(text, index) {
    var layDesign = {
      type: "richText",
      content: text
    };
    var mainLayout = this.state.mainLayout;
    if (typeof index != "undefined") {
      delete mainLayout[index];
      mainLayout[index] = layDesign;
    } else {
      mainLayout.push(layDesign);
    }
    this.setState({ mainLayout: mainLayout });
  },

  addRichText: function() {
    manageSchemaNew.getPopupContent("Add RichText", "");
    ReactDOM.render(
      <ExploreRichText
        mode="create"
        content={""}
        callback={this.setMainRichText}
      />,
      document.getElementById("genericPopupBody")
    );
  },
  setMainRichText: function(text) {
    this.setState({ headingContent: text });
  },
  deleteLayout: function(index) {
    var mainLayout = this.state.mainLayout;
    delete mainLayout[index];
    mainLayout = mainLayout.filter(function(n) {
      return n != "" && n != undefined;
    });
    this.setState({ mainLayout: mainLayout });
  },

  editLayout: function(layout, index, type) {
    if (type == "searchSchema") {
      manageSchemaNew.getPopupContent("Add Search Results By Schema", "");
      ReactDOM.render(
        <AddSearchResults
          index={index}
          searchResult={this.props.searchResult}
          data={layout}
          callback={this.setSearchResultsBySchema}
        />,
        document.getElementById("genericPopupBody")
      );
    } else if (type == "richText") {
      manageSchemaNew.getPopupContent("Add RichText", "");
      ReactDOM.render(
        <ExploreRichText
          mode="create"
          content={layout.content}
          index={index}
          callback={this.setRichText}
        />,
        document.getElementById("genericPopupBody")
      );
    }
  },
  rearrangeDiv: function() {
    var divOrder = [];
    for (
      var i = 0;
      i < document.getElementById("sortable").querySelectorAll("li").length;
      i++
    ) {
      divOrder.push(
        document.getElementById("sortable").querySelectorAll("li")[i].id
      );
    }
    var initialOrder = [];
    for (var i = 0; i < this.state.mainLayout.length; i++) {
      initialOrder.push("" + i);
    }
    var mainLayout = [];

    if (initialOrder == divOrder) {
      // do nothing
      //mainLayout=this.state.mainLayout;
    } else {
      console.log(initialOrder, divOrder);
      var tmp = this.state.mainLayout;
      for (var i = 0; i < divOrder.length; i++) {
        mainLayout.push(tmp[divOrder[i]]);
      }
      var self = this;
      this.setState({ mainLayout: mainLayout }, function() {
        self.forceUpdate();
      });
    }
  },
  deleteHeadingContent: function() {
    var self = this;
    this.setState({ headingContent: "" }, function() {
      self.forceUpdate();
    });
  },
  editHeadingContent: function() {
    manageSchemaNew.getPopupContent("Add RichText", "");
    ReactDOM.render(
      <ExploreRichText
        mode="create"
        content={this.state.headingContent}
        callback={this.setMainRichText}
      />,
      document.getElementById("genericPopupBody")
    );
  },
  componentDidMount: function() {
    this.componentDidUpdate();
  },

  componentDidUpdate: function() {
    var self = this;
    $("#sortable")
      .sortable({
        update: function(event, ui) {
          self.rearrangeDiv();
        }
      })
      .disableSelection();
  },

  render: function() {
    var self = this;
    return (
      <div key={global.guid()}>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          <div className="parent-img-component">
            <div className="child-img-component">WEB CRAWLER INDEX</div>
            <div className="child-img-component">
              <input
                type="checkbox"
                ref={i => {
                  this.webCrawlerIndex = i;
                }}
                defaultChecked={this.state.webCrawlerIndex ? true : false}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          TITLE
          <input
            type="text"
            placeholder={"Web Title"}
            ref={i => {
              this.title = i;
            }}
            className="form-control"
            defaultValue={this.state.htmlMeta.title}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          DESCRIPTION
          <textarea
            ref={i => {
              this.description = i;
            }}
            placeholder={"Web Description"}
            className="form-control"
            defaultValue={this.state.htmlMeta.description}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          KEYWORDS
          <textarea
            ref={i => {
              this.keywords = i;
            }}
            placeholder={"Web keywords"}
            className="form-control"
            defaultValue={this.state.htmlMeta.keywords}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          IMAGE
          <input
            type="text"
            placeholder={"image_src"}
            ref={i => {
              this.image_src = i;
            }}
            className="form-control"
            defaultValue={this.state.htmlMeta.image_src}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          OG:TITLE
          <input
            type="text"
            placeholder={"Open Graph Title"}
            ref={i => {
              this.ogTitle = i;
            }}
            className="form-control"
            defaultValue={this.state.htmlMeta.ogTitle}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          OG:DESCRIPTION
          <input
            type="text"
            placeholder={"Open Graph Description"}
            ref={i => {
              this.ogDescription = i;
            }}
            className="form-control"
            defaultValue={this.state.htmlMeta.ogDescription}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          HEADING H1
          <input
            type="text"
            placeholder={"h1 Heading"}
            ref={i => {
              this.heading1 = i;
            }}
            className="form-control"
            defaultValue={this.state.heading1}
          />
        </div>
        {self.state.mainLayout.length > 0 ? "LAYOUT DESIGN" : ""}
        <div
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"
          style={{ border: "1px solid lightgrey" }}
        >
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
            MAIN CONTENT
            {self.state.headingContent != "" ? (
              <ul
                key={global.guid()}
                className="pointer col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group"
                style={{
                  border: "1px dashed lightgrey",
                  marginTop: "15px",
                  listStyle: "none"
                }}
              >
                <div className="col-lg-11 col-md-11 col-sm-11 col-xs-11 no-padding-left">
                  <Editor content={self.state.headingContent} mode="view" />
                </div>
                <div className="col-lg-1 col-md-1 col-sm-1 col-xs-1 no-padding">
                  <div
                    className="fa-pencil fa   margin-bottom-gap margin-top-gap  link"
                    onClick={self.editHeadingContent.bind(
                      null,
                      self.state.headingContent
                    )}
                  />
                  <div
                    className="icons8-delete fa-2x link"
                    onClick={self.deleteHeadingContent}
                  />
                </div>
              </ul>
            ) : (
              <button
                type="submit"
                ref={b => {
                  self.addRichTextButton = b;
                }}
                className="upload-btn extra-padding-right"
                onClick={self.addRichText}
                title={"Add"}
              >
                Add Main Heading
              </button>
            )}
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <ul id="sortable">
              {self.state.mainLayout.map(function(layout, index) {
                if (layout) {
                  if (layout.type == "searchSchema") {
                    return (
                      <li
                        id={index}
                        key={global.guid()}
                        className="pointer col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group"
                        style={{
                          border: "1px dashed lightgrey",
                          marginTop: "15px",
                          listStyle: "none"
                        }}
                      >
                        <div className="col-lg-11 col-md-11 col-sm-11 col-xs-11 no-padding">
                          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                            <Editor
                              content={layout.richTextContent}
                              mode="view"
                            />
                          </div>
                          <div
                            className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"
                            style={{
                              border: "1px black dashed",
                              margin: "15px 0"
                            }}
                          >
                            {"Search Results Of " + layout.schemaName}
                          </div>
                          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                            <Editor
                              content={layout.richBottomContent}
                              mode="view"
                            />
                          </div>
                        </div>
                        <div className="col-lg-1 col-md-1 col-sm-1 col-xs-1 no-padding">
                          <div
                            className="fa-pencil fa   margin-bottom-gap margin-top-gap  link"
                            onClick={self.editLayout.bind(
                              null,
                              layout,
                              index,
                              "searchSchema"
                            )}
                          />
                          <div
                            className="icons8-delete fa-2x link"
                            onClick={self.deleteLayout.bind(null, index)}
                          />
                        </div>
                      </li>
                    );
                  }
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              })}
            </ul>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group margin-top-gap-sm">
            <button
              type="submit"
              ref={e => {
                this.addSchemaButton = e;
              }}
              className="upload-btn"
              onClick={this.addSearchResultsBySchema}
              title={"Add"}
            >
              Add Search Results Of A Schema
            </button>
          </div>
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group margin-top-gap-sm">
          <input
            type="submit"
            value="SAVE"
            className="action-button extra-padding-right"
            onClick={this.saveExploreMeta}
          />
          <input
            type="submit"
            value="CANCEL"
            className="action-button"
            onClick={this.close}
          />
        </div>
      </div>
    );
  }
});
exports.ExploreMeta = ExploreMeta;

var AddSearchResults = React.createClass({
  getInitialState: function() {
    return {
      richTextContent:
        this.props.data && this.props.data.richTextContent
          ? this.props.data.richTextContent
          : "",
      richBottomContent:
        this.props.data && this.props.data.richBottomContent
          ? this.props.data.richBottomContent
          : "",
      schemaName:
        this.props.data && this.props.data.schemaName
          ? this.props.data.schemaName
          : "Select The Schema"
    };
  },
  select: function(schemaName) {
    this.schema.innerHTML = schemaName;
    this.setState({ schemaName: schemaName });
  },
  setRichText: function(text) {
    this.setState({ richTextContent: text });
  },
  setBottomText: function(text) {
    this.setState({ richBottomContent: text });
  },
  shouldComponentUpdate: function() {
    return false;
  },
  callback: function() {
    if (typeof this.props.callback == "function") {
      $(".modal").click();
      this.props.callback(
        this.state.schemaName,
        this.state.richTextContent,
        this.state.richBottomContent,
        this.props.index
      );
    }
  },
  render: function() {
    var self = this;

    return (
      <div
        key={global.guid()}
        className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"
      >
        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
            <Editor
              mode="create"
              content={this.state.richTextContent}
              callback={this.setRichText}
            />
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
            <button
              data-toggle="dropdown"
              className="btn btn-default dropdown-toggle form-control"
              type="button"
            >
              <span
                ref={e => {
                  this.schema = e;
                }}
                data-bind="label"
              >
                {this.state.schemaName != ""
                  ? this.state.schemaName
                  : "Select Schema"}
              </span>
            </button>
            <ul
              role="menu"
              className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding "
            >
              {Object.keys(self.props.searchResult).map(function(schemaName) {
                return (
                  <li key={global.guid()}>
                    <span onClick={self.select.bind(null, schemaName)}>
                      {schemaName}
                    </span>
                  </li>
                );
              }, this)}
            </ul>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-top-gap-sm form-group">
            <Editor
              mode="create"
              content={this.state.richBottomContent}
              callback={this.setBottomText}
            />
          </div>
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group margin-top-gap-sm">
          <input
            type="submit"
            value="SAVE"
            className="action-button"
            onClick={this.callback}
          />
        </div>
      </div>
    );
  }
});

var ExploreRichText = React.createClass({
  getInitialState: function() {
    return {
      content: this.props.content
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return false;
    //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
  },
  setRichText: function(text) {
    this.setState({ content: text });
  },
  callback: function() {
    if (typeof this.props.callback == "function") {
      $(".modal").click();
      this.props.callback(this.state.content, this.props.index);
    }
  },

  render: function() {
    var self = this;
    return (
      <div
        key={global.guid()}
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
      >
        <Editor
          mode="create"
          content={this.state.content}
          callback={this.setRichText}
        />
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group margin-top-gap-sm">
          <input
            type="submit"
            className="action-button form-group"
            title={"Submit"}
            value={"Add"}
            onClick={self.callback}
          />
        </div>
      </div>
    );
  }
});

var ExploreView = React.createClass({
  getInitialState: function() {
    return {
      data: common.getSlugDetails(this.props.uniqueUserName)
        ? common.getSlugDetails(this.props.uniqueUserName)
        : undefined,
      current: 0
    };
  },
  constructUndefinedSearchText: function() {
    var self = this;
    var searchText = self.props.uniqueUserName.split("-").join(" ");
    WebUtils.doPost(
      "/search?operation=getSearchCounts",
      { searchText: searchText },
      function(result) {
        if (result) {
          var data = {};
          var mainLayout = [];
          Object.keys(result).forEach(function(schema) {
            //var text=searchText.toUpperCase()+" "+SchemaStore.get(schema)["displayName"].toUpperCase();
            var layDesign = {
              type: "searchSchema",
              schemaName: schema,
              richTextContent:
                "" /*{
                            "entityMap": {},
                            "blocks": [
                              {
                                "key": "3hg66",
                                "text": text,
                                "type": "header-two",
                                "depth": 0,
                                "inlineStyleRanges": [],
                                "entityRanges": [],
                                "data": {}
                              }
                            ]
                          },*/,
              richBottomContent: ""
            };

            mainLayout.push(layDesign);
          });
          data["mainLayout"] = mainLayout;
          data["searchText"] = searchText;
          self.setState({ data: data, current: 0 }, function() {
            self.defaultTab();
            common.stopLoader();
          });
        }
      }
    );
  },
  defaultTab: function() {
    /*$(".defaultTab").addClass("tab-view");
    $(".discoverContent").addClass("hidden");
    $(".defaultContent").removeClass("hidden");
  */
  },
  componentDidUpdate: function() {
    this.defaultTab();
  },
  componentDidMount: function() {
    var self = this;
    common.startLoader();
    if (this.state.data == undefined) {
      WebUtils.doPost(
        "/generic?operation=getExploreUniqueUserName",
        { "@uniqueUserName": this.props.uniqueUserName },
        function(res) {
          if (res && res.error) {
            self.constructUndefinedSearchText();
          } else {
            self.setState({ data: res, current: 0 }, function() {
              self.defaultTab();
              common.stopLoader();
            });
          }
        }
      );
    } else if (this.state.data.error) {
      self.constructUndefinedSearchText();
    } else {
      self.defaultTab();
    }
  },
  createExplore: function() {
    var self = this;
    common.startLoader();
    WebUtils.doPost(
      "/generic?operation=checkUniqueUserName",
      { searchText: self.state.data.searchText },
      function(res) {
        var node = document.createElement("div");
        node.id = global.guid();
        var popUpId = global.guid();
        var contentDivId = global.guid();
        var sideDivId = global.guid();
        node.className =
          "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        WebUtils.doPost(
          "/search?operation=getSearchCounts",
          { searchText: self.state.data.searchText },
          function(result) {
            common.stopLoader();
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
              <ExploreMeta
                node={node}
                popUpId={popUpId}
                data={res.error ? undefined : res}
                searchText={self.state.data.searchText}
                searchResult={result}
              />,
              document.getElementById(contentDivId)
            );
          }
        );
      }
    );
  },
  displayTab: function(tabName, recordNav, currindex) {
    var self = this;
    this.setState({ current: currindex });
    recordNav.map(function(tab, index) {
      if (tab == tabName || (tabName == "default" && index == 0)) {
        self[tab + "tab"].className += " tab-view";
        self[tab + "Content"].className =
          " col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group";
      } else {
        self[tab + "tab"].className = "";
        self[tab + "Content"].className = " hidden";
      }
    });
  },
  render: function() {
    var self = this;
    if (this.state.data && this.state.data.mainLayout) {
      var recordNav = {};
      if (this.state.data.mainLayout.length > 0) {
        for (var i = 0; i < this.state.data.mainLayout.length; i++)
          if (this.state.data.mainLayout[i].type == "searchSchema") {
            recordNav[
              "discover-" + this.state.data.mainLayout[i].schemaName
            ] = {};
            recordNav[
              "discover-" + this.state.data.mainLayout[i].schemaName
            ] = {
              displayName: SchemaStore.get(
                this.state.data.mainLayout[i].schemaName
              )["displayName"]
            };
          }
      }
      var headingContent = "";
      if (this.state.data && this.state.data.headingContent != "") {
        headingContent = this.state.data.headingContent;
      }
      return (
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <h1>
              {this.state.data.heading1
                ? this.state.data.heading1.toUpperCase()
                : this.state.data.searchText.toUpperCase()}
            </h1>
          </div>
          {/*
                        Object.keys(recordNav).length>0?(<div className=" col-lg-12  col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm margin-top-gap-sm"><genericNav.RecordNav inRecord={true} recordNav={recordNav}/></div>):""
                      */}

          <div
            key={global.guid()}
            className={
              "col-lg-12 col-md-12 col-sm-12 col-xs-12 " +
              (headingContent != "" ? "form-group" : "")
            }
          >
            <Editor content={headingContent} mode="view" />
          </div>

          <div className="text-center mobileHorizontalScroll">
            {Object.keys(recordNav).map(function(tab, index) {
              return (
                <div
                  className={"unequalDivs extra-padding-right-lg"}
                  key={global.guid()}
                >
                  <div
                    ref={e => {
                      self[tab] = e;
                    }}
                    className="pointer no-margin extra-padding-bottom-pin discoverTab"
                    onClick={self.displayTab.bind(
                      null,
                      tab,
                      Object.keys(recordNav),
                      index
                    )}
                  >
                    <span
                      ref={h => {
                        self[tab + "tab"] = h;
                      }}
                      className={index == self.state.current ? "tab-view" : ""}
                    >
                      {recordNav[tab].displayName.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {this.state.data.mainLayout.map(function(layout, index) {
            if (layout) {
              if (layout.type == "searchSchema") {
                return (
                  <div
                    key={global.guid()}
                    ref={h => {
                      self["discover-" + layout.schemaName + "Content"] = h;
                    }}
                    className={
                      " col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group discoverContent " +
                      (self.state.current == index ? " " : " hidden")
                    }
                  >
                    <Editor content={layout.richTextContent} mode="view" />
                    {self.state.current == index ? (
                      <search.SearchResultsBySchema
                        fromExplore={true}
                        schema={layout.schemaName}
                        searchText={self.state.data.searchText}
                      />
                    ) : (
                      ""
                    )}
                    <Editor
                      content={
                        layout.richBottomContent ? layout.richBottomContent : ""
                      }
                      mode="view"
                    />
                  </div>
                );
              } else {
                return <div key={global.guid()} className="hidden" />;
              }
            }
          })}
          {common.isAdmin() ? (
            <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
              <button
                type="submit"
                ref={b => {
                  this.createExploreButton = b;
                }}
                className="upload-btn pull-right"
                onClick={this.createExplore}
                title={"Create"}
              >
                Create/Edit Discover Page
              </button>
            </div>
          ) : (
            <div className="hidden" />
          )}
        </div>
      );
    } else {
      return <div />;
      // return (<router.PageNotFound/>)
    }
  }
});
exports.ExploreView = ExploreView;
