/*
 * @author saikiran.vadlakonda
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var common = require("../common.jsx");
//var genericView=require('../view/genericView.jsx');
//var SchemaStore = require('../../stores/SchemaStore');
//var router = require('../nav/router.jsx');
//var limitCount=require("../../utils/global.js").limitCount;//9;
//var WebUtils=require('../../utils/WebAPIUtils.js');
var global = require("../../utils/global.js");
//var linkGenerator=require('./linkGenerator.jsx');
//var browserHistory=require('react-router').browserHistory;
//var SearchStore=require('../../stores/SearchStore');

var SearchSpecs = React.createClass({
  getInitialState: function() {
    return { result: [], searchSpecInput: "", isVisible: false };
  },
  forceSearch: function(event) {
    var code = event.keyCode ? event.keyCode : event.which;
    if (code == 13) {
      this.searchSpec();
    }
  },
  setDivs: function() {
    $("html,body").scrollTop(0);
    $("#landingPage").css("display", "none");
    $("#dynamicContentDiv").css("display", "block");
    $.ajaxQueue("clear");
    //ReactDOM.unmountComponentAtNode(document.getElementById("landingPage"));
    try {
      if (
        common.getConfigDetails().handleBarTemplate == "jsm" ||
        common.getConfigDetails().handleBarTemplate == "wevaha"
      ) {
        document.getElementById("sideFilterNavigation").className = "hidden";
        document.getElementById("summaryNav").parentNode.className += " hidden";
        document.getElementById("dynamicContentDiv").className =
          "col-xs-12 col-sm-12  col-lg-12 col-md-12";
      }
    } catch (err) {}
  },
  searchSpec: function() {
    var self = this;
    var searchData = self.searchSpecInput.value.trim();

    if (searchData.length > 2) {
      $.post(
        "/search?operation=searchSpecs",
        { text: searchData },
        function(data, err) {
          if (data.result.hits.hits.length > 0) {
            if (!this._isUnmounted)
              this.setState(
                {
                  result: data.result.hits.hits,
                  isVisible: true,
                  searchSpecInput: searchData
                },
                function() {
                  this.searchSpecInput.value = searchData;
                }.bind(this)
              );
          } else {
            if (!this._isUnmounted)
              this.setState(
                { result: [], searchSpecInput: searchData },
                function() {
                  this.searchSpecInput.value = searchData;
                }.bind(this)
              );
            console.log("No match Found");
          }
        }.bind(this)
      );
    }
  },
  getDoc: function(hit) {
    //var self=this;
    console.log(hit);
    var docId = hit._id;

    if (docId) {
      common.startLoader();
      $.post("/search?operation=getSpecListDoc", { docId: docId }, function(
        data,
        err
      ) {
        if (data.result) {
          var doc = data.result;
          if (download.constructor == Function) {
            download(
              "data:" + doc._source.type + ";base64," + doc._source.content,
              doc._source.name,
              doc._source.type
            );
          }
        } else {
          alert("Unable to Download");
        }
        common.stopLoader();
      });
    }
  },
  componentDidMount: function() {
    var self = this;

    self.searchSpecInput.focus();
    this.setDivs();
    /*
		$.post("/search?operation=searchSpecs",{text: ''}, function(data, err){
				if(data.result.hits.hits.length>0){
					self.setState({	result: data.result.hits.hits });
				}else{
					console.log("No match Found");
				}
			});
		*/
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var self = this;
    var classNames = "hidden";
    if (self.state.result.length > 0) {
      classNames = "";
    }

    return (
      <div
        className="container"
        style={{ padding: "15px" }}
        key={global.guid()}
      >
        <h1>Research Specifications</h1>
        <div
          className="h5 searchPosition form-group"
          style={{ width: "40%", borderBottom: " 1px solid #B6B6B6" }}
        >
          <input
            type="search"
            className="form-control search-input researchSpecInput"
            placeholder="Search across specs, standards, how-to guides..."
            onKeyPress={this.forceSearch}
            ref={input => {
              this.searchSpecInput = input;
            }}
          />
          <img
            src="/branding/search.svg"
            alt="search"
            onClick={this.search}
            className="pointer searchImgPosition"
          />
        </div>

        <div
          className={"col-lg-9 col-md-9 col-xs-12 col-sm-12 " + classNames}
          style={{
            background: "#f8f8f8",
            padding: "15px",
            border: "1px solid #FAFAFA"
          }}
          ref="results"
        >
          <div className="form-group">
            <h6 className="lightgray">
              Found {self.state.result.length} results for query{" "}
              <strong>{self.state.searchSpecInput}</strong>
            </h6>
          </div>
          {self.state.result.map(function(hit) {
            var cls = "";
            var txt = "file";
            if (
              hit._source.type === "application/msword" ||
              hit._source.type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
              cls = "fa fa-file-word-o";
              txt = "DOC";
              console.log(hit._source.name);
            } else if (hit._source.type === "application/pdf") {
              cls = "fa fa-file-pdf-o";
              txt = "PDF";
            } else if (hit._source.type === "application/excel") {
              cls = "fa fa-file-excel-o";
              txt = "XLS";
            } else if (hit._source.type === "application/csv") {
              cls = "fa fa-file-csv-o";
              txt = "CSV";
            } else {
              cls = "fa fa-file-excel-o";
            }

            return (
              <div
                className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"
                key={global.guid()}
              >
                <ul className="list-group">
                  <li className="list-group-item">
                    <div className="media">
                      <div
                        className="media-body"
                        style={{ paddingBottom: "10px" }}
                      >
                        <div className="pull-right text-center pointer">
                          <i
                            className={cls}
                            onClick={self.getDoc.bind(null, hit)}
                            style={{ fontSize: "18px" }}
                          />
                          <div
                            className="no-margin"
                            style={{ fontSize: "10px" }}
                          >
                            {txt}
                          </div>
                        </div>
                        <strong
                          className="pointer"
                          onClick={self.getDoc.bind(null, hit)}
                        >
                          {" "}
                          {hit._source.name}
                        </strong>&nbsp; &nbsp;
                        {/*
																['a'].map(function(){
																	if(self.state.isVisible){
																		return (<i>
																				<button type="button" className="btn btn-default btn-sm" onClick={self.getDoc.bind(this,hit)}>
																	  				<span className="glyphicon glyphicon-download-alt"></span> Download
																				</button>
																				</i>)
																	}
																})
															*/}
                        {["a"].map(function() {
                          if (hit._source.publisher && hit._source.docType) {
                            return (
                              <div
                                key={global.guid()}
                                style={{ color: "gray", fontSize: "10px" }}
                              >
                                <div>
                                  <span>Document Category: </span>&nbsp;<span
                                    className="pointer"
                                    onClick={self.getDoc.bind(null, hit)}
                                  >
                                    {hit._source.docType}
                                  </span>
                                </div>
                                <div>
                                  <span>Publisher: </span>&nbsp;<span
                                    className="pointer"
                                    onClick={self.getDoc.bind(null, hit)}
                                  >
                                    {hit._source.publisher}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                    {["a"].map(function() {
                      if (
                        hit &&
                        hit.highlight &&
                        hit.highlight.content.length > 0
                      ) {
                        var textToShow = hit.highlight.content.join("...");
                        var about1 = textToShow
                          .split("<mark>")
                          .splice(0, 5)
                          .join("<mark>");
                        var about2 =
                          " " +
                          textToShow
                            .split("<mark>")
                            .splice(5, textToShow.length)
                            .filter(function(n) {
                              return n != "" && n != undefined;
                            })
                            .join("<mark>");
                        var abt = about2;
                        if (abt.length > 1) {
                          var recordId = global.guid();
                          about =
                            '<div style="max-width:900px">' +
                            '<input type="checkbox" class="read-more-state" id=' +
                            recordId +
                            " />" +
                            '<p class="read-more-wrap no-margin" >' +
                            about1 +
                            '<span class="read-more-target">' +
                            "..." +
                            about2 +
                            "..." +
                            "</span></p>" +
                            "&nbsp;<label for=" +
                            recordId +
                            ' class="read-more-trigger morelink link"></label></div>';
                        } else {
                          about =
                            '<div><p class="no-margin">' +
                            "..." +
                            about1 +
                            "..." +
                            "</p></div>";
                        }
                        return (
                          <div key={global.guid()} style={{ fontSize: "12px" }}>
                            <span dangerouslySetInnerHTML={{ __html: about }} />
                          </div>
                        );
                      }
                    })}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
        {["a"].map(function() {
          if (
            self.state.result.length == 0 &&
            self.state.searchSpecInput.trim().length > 0
          ) {
            return (
              <div key={global.guid()} className="form-group">
                <h6 className="lightgray">
                  No Match Found for query{" "}
                  <strong>{self.state.searchSpecInput}</strong>
                </h6>
              </div>
            );
          }
        })}
      </div>
    );
  }
});

exports.SearchSpecs = SearchSpecs;
