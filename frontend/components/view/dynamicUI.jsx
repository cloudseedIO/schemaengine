/**
 * @author - Vikram
 */
var React = require("react");

var common = require("../common.jsx");
var genericView = require("./genericView.jsx");
var getContent = require("./components/getContent.jsx");
var WebUtils = require("../../utils/WebAPIUtils.js");
var DefinitionStore = require("../../stores/DefinitionStore");
var RecordSummaryStore = require("../../stores/RecordSummaryStore");
var SchemaStore = require("../../stores/SchemaStore");
var ActionCreator = require("../../actions/ActionCreator");
var RecordDetailStore = require("../../stores/RecordDetailStore");
var utility = require("../Utility.jsx");
var linkGenerator = require("../nav/linkGenerator.jsx");
var global = require("../../utils/global.js");
var breadCrumbs = require("../nav/breadCrumbs.jsx");
var Carousel = require("./components/carousel.jsx").Carousel;
var Editor = require("../records/richTextEditor.jsx").MyEditor;
var Link = require("react-router").Link;
var workflow = require("../view/components/workflow.jsx");
var browserHistory = require("react-router").browserHistory;

var DynamicUI = React.createClass({
  getInitialState: function() {
    if (this.props.templateJSON) {
      return {
        shouldComponentUpdate: false,
        layoutJSON: this.props.templateJSON
      };
    } else {
      return {
        shouldComponentUpdate: false,
        layoutJSON: require("../../stores/DefinitionStore").getDefinition(
          this.props.templateId
        )
      };
    }
  },
  _onChange: function() {
    if (!this.props.templateJSON)
      this.setState({
        shouldComponentUpdate: true,
        layoutJSON: DefinitionStore.getDefinition(this.props.templateId)
      });
  },
  componentWillUnmount: function() {
    if (!this.props.templateJSON && !this.state.layoutJSON)
      DefinitionStore.removeChangeListener(
        this._onChange,
        this.props.templateId
      );
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
    //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
  },
  componentDidMount: function() {
    if (!this.props.templateJSON && !this.state.layoutJSON) {
      ActionCreator.getDefinition(this.props.templateId);
      DefinitionStore.addChangeListener(this._onChange, this.props.templateId);
    }
  },
  render: function() {
    var breadCrump = "";
    var showSlug = true;
    if (this.props.innerLanding) {
      showSlug = false;
    }
    if (common.getConfigDetails().landingTemplate == this.props.templateId) {
      showSlug = false;
    }
    if (
      typeof this.state.layoutJSON != "undefined" &&
      [false, "NO", "no", "No", "nO"].indexOf(
        this.state.layoutJSON["@showBreadCrumps"]
      ) != -1
    ) {
      showSlug = false;
    }
    if (showSlug && !common.getSiteSpecific()) {
      breadCrump = (
        <ul
          key={global.guid()}
          className="breadcrumb"
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
          {breadCrumbs.getBreadCrumbs({ landingPage: this.props.templateId }).breadCrumbs}
        </ul>
      );
    }
    if (this.state.layoutJSON) {
      return (
        <div className="container">
          {showSlug ? (
            <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 navItem">
              {breadCrump}
            </div>
          ) : (
            ""
          )}
          <ProcessDiv
            layoutJSON={this.state.layoutJSON}
            fromSummary={this.props.fromSummary}
            divStyle={{}}
            record={this.props.record}
            className={"row"}
            id={"root"}
            tree={this.state.layoutJSON.structure.root}
          />
        </div>
      );
    } else {
      return <div />;
    }
  }
});

exports.DynamicUI = DynamicUI;

var ProcessDiv = React.createClass({
  getInitialState: function() {
    var width = "";
    if (typeof window != "undefined") {
      try {
        width = $(window).width();
      } catch (err) {}
    }
    return {
      shouldComponentUpdate: false,
      width: width,
      record: this.props.record
    };
  },
  componentDidMount: function() {},
  _onChange: function() {},
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  componentWillUnmount: function() {},
  performButtonClickAction: function(content) {
    if (content.action) {
      if (content.action.type == "showLogin") {
        if (common.getUserDoc().recordId == undefined) {
          common.showLoginPopup();
        }
      } else if (content.action.type == "url") {
        var url = content.action.target;
        if (url.indexOf("/") == 0 || url.indexOf("http") != 0) {
          browserHistory.push(url);
        } else {
          window.open(url);
        }
      } else if (content.action.type == "workflow") {
        workflow.workFlow(content.action.target);
      }
    }
  },
  render: function() {
    var self = this;
    var width = self.state.width;
    return (
      <div
        style={this.props.divStyle}
        className={this.props.className}
        id={this.props.id}
      >
        {Object.keys(this.props.tree).map(function(divId) {
          var xsSize = self.props.layoutJSON.layout.xs[divId]
            ? self.props.layoutJSON.layout.xs[divId]
            : 12;
          var smSize = self.props.layoutJSON.layout.sm[divId]
            ? self.props.layoutJSON.layout.sm[divId]
            : 12;
          var lgSize = self.props.layoutJSON.layout.lg[divId]
            ? self.props.layoutJSON.layout.lg[divId]
            : 12;
          var mdSize = self.props.layoutJSON.layout.md[divId]
            ? self.props.layoutJSON.layout.md[divId]
            : 12;
          var divSizes =
            "col-xs-" +
            xsSize +
            " col-sm-" +
            smSize +
            " col-lg-" +
            lgSize +
            " col-md-" +
            mdSize;
          var divStyle = {};
          var mobile = false;
          if (width > 1200) {
            //do nothing
          } else if (width > 992 && width < 1200) {
            //do nothing
          } else if (width > 768 && width < 992) {
            //do nothing
          } /*else if(width > 480 && width < 768 ){
					mobile=true;
				}*/ else {
            mobile = true;
          }
          if (
            mobile &&
            self.props.layoutJSON.xsStyle &&
            self.props.layoutJSON.xsStyle[divId]
          ) {
            divStyle = utility.getReactStyles(
              self.props.layoutJSON.xsStyle[divId]
            );
          } else if (self.props.layoutJSON.style[divId]) {
            divStyle = utility.getReactStyles(
              self.props.layoutJSON.style[divId]
            );
          }
          if (self.props.tree[divId].content) {
            var content = self.props.tree[divId].content;
            if (content.type == "button") {
              if (
                (content.showTo == "loggedIn" &&
                  typeof common.getUserDoc().recordId != "undefined") ||
                (content.showTo == "unLogged" &&
                  typeof common.getUserDoc().recordId == "undefined") ||
                content.showTo == "all"
              ) {
                return (
                  <div className={divSizes} id={divId} key={global.guid()}>
                    <button
                      className="btn"
                      style={divStyle}
                      onClick={self.performButtonClickAction.bind(
                        null,
                        content
                      )}
                    >
                      {content.value}
                    </button>
                  </div>
                );
              } else {
                return (
                  <div className={divSizes} id={divId} key={global.guid()} />
                );
              }
            }
            return (
              <div
                style={divStyle}
                className={divSizes}
                id={divId}
                key={global.guid()}
              >
                <GetContent
                  layoutJSON={self.props.layoutJSON}
                  fromSummary={self.props.fromSummary}
                  content={self.props.tree[divId].content}
                  schema={self.state.schema}
                  record={self.state.record}
                />
              </div>
            );
          } else {
            return (
              <ProcessDiv
                key={global.guid()}
                layoutJSON={self.props.layoutJSON}
                fromSummary={self.props.fromSummary}
                divStyle={divStyle}
                className={divSizes}
                id={divId}
                tree={self.props.tree[divId]}
                record={self.state.record}
              />
            );
          }
        })}
      </div>
    );
  }
});

var GetContent = React.createClass({
  route: function() {
    /*	if(this.props.content.href.indexOf("http")!=-1){
			//location.href=
      browserHistory.push(this.props.content.href);
		}else{*/
    //location.href
    browserHistory.push(this.props.content.href);
    //}
  },
  componentDidMount: function() {
    this.componentDidUpdate();
  },
  componentDidUpdate: function() {
    if (this.props.disableClicks) {
      $("#dynamicContentDiv a,.contentDiv").css("pointer-events", "none");
    }
  },
  performButtonClickAction: function(content) {
    if (content.action) {
      if (content.action.type == "showLogin") {
        if (common.getUserDoc().recordId == undefined) {
          common.showLoginPopup();
        }
      } else if (content.action.type == "url") {
        var url = content.action.target;
        if (url.indexOf("/") == 0 || url.indexOf("http") != 0) {
          browserHistory.push(url);
        } else {
          window.open(url);
        }
      } else if (content.action.type == "workflow") {
        workflow.workFlow(content.action.target);
      }
    }
  },
  render: function() {
    //var self=this;
    if (this.props.content.type) {
      var contentStyle = utility.getReactStyles(this.props.content.style);
      if (
        this.props.content.type == "image" ||
        this.props.content.type == "video"
      ) {
        var imgStyle = {
          height: this.props.content.height,
          width: this.props.content.width
        };
        imgStyle = Object.assign(imgStyle, contentStyle);
        if (this.props.content.type == "image") {
          return (
            <div>
              <img
                style={imgStyle}
                className="img-responsive"
                src={this.props.content.url
                  .replace(/^https:/, "")
                  .replace(/^http:/, "")}
                alt={this.props.content.alt ? this.props.content.alt : "..."}
                title={this.props.content.alt ? this.props.content.alt : "..."}
              />
            </div>
          );
        } else {
          //if(this.props.content.type=="video"){
          if (
            this.props.content.videoType == "youtube" ||
            this.props.content.videoType == "vimeo"
          ) {
            var src = "";
            if (this.props.content.videoType == "youtube") {
              //src = "https://www.youtube.com/embed/"+this.props.content.url+"?rel=0&amp;controls=0&amp;showinfo=0";
              src =
                "https://www.youtube-nocookie.com/embed/" +
                this.props.content.url +
                "?rel=0&amp;showinfo=0";
            } else if (this.state.videoType == "vimeo") {
              src = "https://player.vimeo.com/video/" + this.props.content.url;
            }
            return (
              <iframe
                src={src}
                width={this.props.content.width}
                height={this.props.content.height}
                className="form-group"
                style={{ border: "none" }}
              />
            );
          } else {
            return <MyVideoTag css={imgStyle} content={this.props.content} />;
          }
        }
      } else if (this.props.content.type == "text") {
        return (
          <div>
            <span style={contentStyle}>{this.props.content.value}</span>{" "}
            <span
              className={
                this.props.content.classNames != undefined
                  ? this.props.content.classNames + " lpIcons "
                  : "hidden"
              }
            />
          </div>
        );
      } else if (this.props.content.type == "button") {
        if (
          (this.props.content.showTo == "loggedIn" &&
            typeof common.getUserDoc().recordId != "undefined") ||
          (this.props.content.showTo == "unLogged" &&
            typeof common.getUserDoc().recordId == "undefined") ||
          this.props.content.showTo == "all"
        ) {
          if (!contentStyle.cursor) {
            contentStyle.cursor = "pointer";
          }
          return (
            <div>
              <span
                style={contentStyle}
                onClick={this.performButtonClickAction.bind(
                  null,
                  this.props.content
                )}
              >
                {this.props.content.value}
              </span>
            </div>
          );
        } else {
          return <div />;
        }
      } else if (this.props.content.type == "richText") {
        return (
          <div>
            <Editor content={this.props.content.value} mode="view" />
          </div>
        );
      } else if (this.props.content.type == "heading") {
        if (!this.props.content.headingNumber) {
          return (
            <div>
              <h1 style={contentStyle}>{this.props.content.value}</h1>
            </div>
          );
        } else {
          if (
            this.props.content.headingNumber == "1" ||
            this.props.content.headingNumber == 1
          ) {
            return (
              <div>
                <h1 style={contentStyle}>{this.props.content.value}</h1>
              </div>
            );
          } else if (
            this.props.content.headingNumber == "2" ||
            this.props.content.headingNumber == 2
          ) {
            return (
              <div>
                <h2 style={contentStyle}>{this.props.content.value}</h2>
              </div>
            );
          } else if (
            this.props.content.headingNumber == "3" ||
            this.props.content.headingNumber == 3
          ) {
            return (
              <div>
                <h3 style={contentStyle}>{this.props.content.value}</h3>
              </div>
            );
          } else if (
            this.props.content.headingNumber == "4" ||
            this.props.content.headingNumber == 4
          ) {
            return (
              <div>
                <h4 style={contentStyle}>{this.props.content.value}</h4>
              </div>
            );
          } else if (
            this.props.content.headingNumber == "5" ||
            this.props.content.headingNumber == 5
          ) {
            return (
              <div>
                <h5 style={contentStyle}>{this.props.content.value}</h5>
              </div>
            );
          } else if (
            this.props.content.headingNumber == "6" ||
            this.props.content.headingNumber == 6
          ) {
            return (
              <div>
                <h6 style={contentStyle}>{this.props.content.value}</h6>
              </div>
            );
          } else {
            return <div className="hidden" />;
          }
        }
      } else if (this.props.content.type == "icon") {
        return <div className={this.props.content.classNames}> </div>;
      } else if (this.props.content.type == "summary") {
        return (
          <genericView.SummarizeAll
            fromDetailView="yes"
            viewName={
              this.props.content.viewName
                ? this.props.content.viewName
                : "getSummary"
            }
            schema={this.props.content.schema}
            filters={this.props.content.filters}
            dependentSchema={this.props.content.dependentSchema}
            org={this.props.content.org ? this.props.content.org : "public"}
            skip={this.props.content.skip ? this.props.content.skip : 0}
            limit={this.props.content.limit}
            sortBy={this.props.content.sortBy}
            sortOrder={this.props.content.sortOrder}
          />
        );
      } else if (this.props.content.type == "detail") {
        return (
          <genericView.GoIntoDetail
            rootSchema={this.props.content.schema}
            dependentSchema={this.props.content.dependentSchema}
            recordId={this.props.content.recordId}
            org={this.props.content.org ? this.props.content.org : "public"}
          />
        );
      } else if (this.props.content.type == "link") {
        var linkType = "textLink";
        if (this.props.content.linkType) {
          linkType = this.props.content.linkType;
        } else if (this.props.content.image) {
          linkType = "imageLink";
        }
        if (linkType == "imageLink") {
          var imgStyleLink = {
            height: this.props.content.image.height,
            width: this.props.content.image.width
          };
          //imgStyle=$.extend({},imgStyle,contentStyle);
          /*var hiddenLink=(this.props.content.href.indexOf("#")==0)?<a href={this.props.content.href.replace("#","")}  className="hidden" >
								{this.props.content.text?this.props.content.text:"..."}
							</a>:"";*/
          return (
            <div>
              <Link to={this.props.content.href.replace(/^#/, "")}>
                <img
                  style={imgStyleLink}
                  className="img-responsive link"
                  alt={
                    this.props.content.text ? this.props.content.text : "..."
                  }
                  title={
                    this.props.content.text ? this.props.content.text : "..."
                  }
                  src={this.props.content.image.url
                    .replace(/^https:/, "")
                    .replace(/^http:/, "")}
                />
              </Link>
            </div>
          );
        } else {
          /*var hiddenLink=(this.props.content.href.indexOf("#")==0)?<a href={this.props.content.href.replace("#","")}  className="hidden" >
								{this.props.content.text}
							</a>:"";*/
          var link = (
            <span className="link">
              <Link to={this.props.content.href.replace(/^#/, "")}>
                {this.props.content.text}
              </Link>
              <span
                className={
                  this.props.content.classNames != undefined
                    ? this.props.content.classNames + " lpIcons "
                    : "hidden"
                }
              />
            </span>
          );
          if (this.props.content.headingNumber) {
            if (
              this.props.content.headingNumber == "1" ||
              this.props.content.headingNumber == 1
            ) {
              return (
                <div>
                  <h1 style={contentStyle}>{link}</h1>
                </div>
              );
            } else if (
              this.props.content.headingNumber == "2" ||
              this.props.content.headingNumber == 2
            ) {
              return (
                <div>
                  <h2 style={contentStyle}>{link}</h2>
                </div>
              );
            } else if (
              this.props.content.headingNumber == "3" ||
              this.props.content.headingNumber == 3
            ) {
              return (
                <div>
                  <h3 style={contentStyle}>{link}</h3>
                </div>
              );
            } else if (
              this.props.content.headingNumber == "4" ||
              this.props.content.headingNumber == 4
            ) {
              return (
                <div>
                  <h4 style={contentStyle}>{link}</h4>
                </div>
              );
            } else if (
              this.props.content.headingNumber == "5" ||
              this.props.content.headingNumber == 5
            ) {
              return (
                <div>
                  <h5 style={contentStyle}>{link}</h5>
                </div>
              );
            } else if (
              this.props.content.headingNumber == "6" ||
              this.props.content.headingNumber == 6
            ) {
              return (
                <div>
                  <h6 style={contentStyle}>{link}</h6>
                </div>
              );
            } else {
              return <div className="hidden" />;
            }
          } else {
            return <div>{link}</div>;
          }
        }
      } else if (this.props.content.type == "carousel") {
        return <LandingCarousel element={this.props.content} />;
      } else if (this.props.content.type == "cardCarousel") {
        return <LandingCarousel type="card" element={this.props.content} />;
      } else if (this.props.content.type == "iconView") {
        return <LandingCarousel type="icon" element={this.props.content} />;
      } else if (this.props.content.type == "searchBar") {
        return <LandingSearch searchType={this.props.content} />;
      } else if (this.props.content.type == "schemaRelated") {
        return (
          <LandingSchemaRelated
            fromSummary={this.props.fromSummary}
            element={this.props.content}
            layoutJSON={this.props.layoutJSON}
            schema={this.props.schema}
            record={this.props.record}
          />
        );
      } else if (this.props.content.type == "landingPage") {
        return (
          <DynamicUI innerLanding={true} templateId={this.props.content.lpi} />
        );
      } else {
        return <div>"Un specified content type"</div>;
      }
    } else {
      return <div>{this.props.content}</div>;
    }
  }
});
exports.GetContent = GetContent;
function applyStyles(elementStyle, element) {
  Object.keys(elementStyle).forEach(function(styleKey) {
    $(element).css(styleKey, elementStyle[styleKey]);
  });
}

var LandingCarousel = React.createClass({
  getInitialState: function() {
    if (this.props.element.n1ql) {
      return { records: [] };
    }
    return {
      records: require("../../stores/RecordSummaryStore").getSchemaRecords({
        schema: this.props.element.schema,
        filters: this.props.element.filters,
        org: "public",
        userId: common.getUserDoc().recordId,
        skip: 0,
        limit: this.props.element.limit,
        noOrder: true
      })
    };
  },
  _onChange: function() {
    if (!this.props.element.n1ql)
      this.setState({
        records: RecordSummaryStore.getSchemaRecords({
          schema: this.props.element.schema,
          filters: this.props.element.filters,
          org: "public",
          userId: common.getUserDoc().recordId,
          skip: 0,
          limit: this.props.element.limit,
          noOrder: true
        })
      });
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
    if (this.props.element.schema && !this.props.element.n1ql) {
      RecordSummaryStore.removeChangeListener(this._onChange);
    }
  },
  componentDidMount: function() {
    //var self=this;
    if (
      this.props.element.schema &&
      this.state.records.length == 0 &&
      !this.props.element.n1ql
    ) {
      ActionCreator.getSchemaRecords({
        schema: this.props.element.schema,
        filters: this.props.element.filters,
        org: "public",
        userId: common.getUserDoc().recordId,
        skip: 0,
        limit: this.props.element.limit,
        sortBy: this.props.element.sortBy,
        sortOrder: this.props.element.sortOrder,
        noOrder: true
      });
      RecordSummaryStore.addChangeListener(this._onChange);
    }
    if (this.props.element.n1ql) {
      WebUtils.getResults(
        {
          query: this.props.element.n1ql,
          params: Array.isArray(this.props.element.params)
            ? this.props.element.params
            : [],
          skip: this.props.element.skip,
          limit: this.props.element.limit
        },
        function(recs) {
          common.stopLoader();
          var records = [];
          if (Array.isArray(recs)) {
            //change for-in to for-of
            for (var index in recs) {
              records.push({ value: recs[index], id: recs[index].recordId });
            }
          }
          if (!this._isUnmounted) this.setState({ records: records });
        }.bind(this)
      );
    }
  },
  componentDidUpdate: function() {
    common.updateErrorImages();
  },
  relocate: function(url) {
    browserHistory.push(url);
  },
  loadContent: function(record) {
    var self = this;
    var rootSchema = self.props.element.schema;
    common.clearMainContent();
    common.clearLeftContent();
    browserHistory.push(
      linkGenerator.getDetailLink({
        record: record ? record.value : {},
        org: "public",
        schema: rootSchema,
        recordId: record ? record.id : undefined,
        dependentSchema: self.props.element.dependentSchema
      })
    );
  },
  render: function() {
    var element = this.props.element;
    var self = this;
    var currentSchema = SchemaStore.get(self.props.element.schema);
    var myCarouselId = global.guid();
    if (this.state.records.length > 0) {
      if (this.props.type && this.props.type == "card") {
        return (
          <div>
            <div
              id={myCarouselId}
              className="carousel slide"
              data-ride="carousel"
            >
              <ol className="carousel-indicators">
                <li
                  data-target={"#" + myCarouselId}
                  data-slide-to="0"
                  className="active"
                />
                {this.state.records.map(function(record, index) {
                  if (index != 0)
                    return (
                      <li
                        data-target={"#" + myCarouselId}
                        key={index}
                        data-slide-to={"" + index}
                      />
                    );
                })}
              </ol>
              <div className="carousel-inner">
                {this.state.records.map(function(record, index) {
                  var firstSlide = "active";
                  if (index != 0) {
                    firstSlide = "";
                  }
                  var bannerImage = "";
                  var imageDesc = "";
                  if (
                    record.value[element.layout.bannerImage] &&
                    record.value[element.layout.bannerImage][0] &&
                    record.value[element.layout.bannerImage][0].cloudinaryId
                  ) {
                    bannerImage =
                      record.value[element.layout.bannerImage][0].cloudinaryId;
                    imageDesc = getContent.getImageDesc(
                      record.value[element.layout.bannerImage][0],
                      currentSchema,
                      undefined,
                      record.value
                    );
                    if (
                      bannerImage.indexOf("http") != 0 &&
                      bannerImage.indexOf("h_")
                    ) {
                      bannerImage =
                        "//res.cloudinary.com/dzd0mlvkl/image/upload/h_300,w_1500,c_fill,fl_progressive/v1623462816/" +
                        bannerImage +
                        ".jpg";
                    }
                  }
                  {
                    /*var profileImage="";
											if(record.value[element.layout.profileImage] && record.value[element.layout.profileImage][0] && record.value[element.layout.profileImage][0].cloudinaryId){
												profileImage=record.value[element.layout.profileImage][0].cloudinaryId;
												if((profileImage.indexOf("http")!=0) && profileImage.indexOf("h_")){
													profileImage="//res.cloudinary.com/dzd0mlvkl/image/upload/h_100,w_100,c_fill/v1623462816/"+profileImage+".jpg";
												}
											}
											var subHeader="";
											if(element.layout.subHeader == "address" && record.value[element.layout.subHeader]){
												if(record.value.address.addressLocality){
													subHeader=record.value.address.addressLocality+", "+record.value.address.addressCountry;
												}else{
													subHeader=record.value.address.addressCountry;
												}
											}else if(record.value[element.layout.subHeader]){

													if(Array.isArray(element.layout.subHeader)){
														element.layout.subHeader.map(function(subHead){
															if(self.props.record.value[subHead]){
																subHeader=subHeader+self.props.record.value[subHead]+" ";
															}
														})
													}else if(record[element.layout.subHeader]){
														subHeader=record.value[element.layout.subHeader];
													}
											}

											<div className='row no-margin txt '>
																<span className='display-inline-block'>
																	 <img src={profileImage} style={{"verticalAlign":"initial"}} className=' profilePicture'/>
																 </span>&nbsp;&nbsp;&nbsp;
																 <span className='display-inline-block'>
																	<ul className=' no-padding-left'>
																		<div>
																			<h3 className='no-margin fontHeader' >{record.value[element.layout.name]}</h3>
																			<h5 className='no-margin fontSubHeader' >{subHeader}</h5>
																		</div>
																	</ul>
																  </span>
															</div>
															<div className="bannerCarouselAbout">{record.value[element.layout.about].indexOf('. ')>-1?record.value[element.layout.about].substring(0, record.value[element.layout.about].indexOf('. ')):record.value[element.layout.about].substr(0,340)}</div>


											*/
                  }
                  {
                    /*return (<div className={"row bannerCarousel item "+firstSlide}  style={{ backgroundRepeat: "no-repeat",backgroundSize: "100% 100%",backgroundImage: "url("+bannerImage+")"}}>
											    		<div className="col-lg-8 col-md-8 col-sm-8 col-xs-12">
											    			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12"></div>
											    			<div className="row">
											    				<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3">
											    					<img src={profileImage} className="profileImage" style={{float:"right"}}/>
											    				</div>
											    				<div className="col-lg-9 col-md-9 col-sm-9 col-xs-9 no-padding-left">
											    					<div className="name col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding-left">
											    						 <Link  to={linkGenerator.getDetailLink({org:"public",schema:element.schema,recordId:record.id,record:record.value})}>{record.value[element.layout.name]} </Link>
											    					</div>
											    					<div className="subHeader col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding-left">
										    							 <Link  to={linkGenerator.getDetailLink({org:"public",schema:element.schema,recordId:record.id,record:record.value})}>{subHeader} </Link>
										    						</div>
											    				</div>
											    			</div>
											    		</div>
											    		<div className="col-lg-4 col-md-4 col-sm-4 col-xs-12 hidden-xs">
											    			<div className="about col-lg-12 col-md-12 col-sm-12 col-xs-12">{record.value[element.layout.about].substr(0,140)}</div>
											    		</div>
											    	</div>)*/
                  }

                  var lurl = linkGenerator.getDetailLink({
                    org: "public",
                    schema: element.schema,
                    recordId: record.id,
                    record: record.value
                  });
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding item " +
                        firstSlide
                      }
                      onClick={self.relocate.bind(self, lurl)}
                    >
                      <div className="main-block form-group">
                        <div className="banner-picture img-holder">
                          {/*<img className="img-responsive" src={bannerImage} />*/}
                          <div
                            className="img"
                            style={{
                              backgroundImage: "url(" + bannerImage + ")"
                            }}
                          >
                            <Link className="hidden" to={lurl}>
                              {imageDesc}{" "}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <a
                className="left carousel-control link"
                href={"#" + myCarouselId}
                role="button"
                title="Previous"
                data-slide="prev"
              >
                <i className="sleekIcon-leftarrow fa-2x link " />
                <span className="sr-only">Previous</span>
              </a>
              <a
                className="right carousel-control link"
                href={"#" + myCarouselId}
                role="button"
                title="Next"
                data-slide="next"
              >
                <i className="sleekIcon-rightarrow fa-2x link " />
                <span className="sr-only">Next</span>
              </a>
            </div>
          </div>
        );
      } else if (this.props.type && this.props.type == "icon") {
        var images = [];
        this.state.records.map(function(record, index) {
          var profileImage = "";
          var imageDesc = "";
          if (element.layout.profileImageType == "path") {
            profileImage = eval(
              "record.value." + element.layout.profileImage + "[0].cloudinaryId"
            );
            if (
              profileImage.indexOf("http") != 0 &&
              profileImage.indexOf("h_")
            ) {
              profileImage =
                "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_250,w_250/v1623462816/" +
                profileImage +
                ".jpg";
            }
            imageDesc = getContent.getImageDesc(
              eval("record.value." + element.layout.profileImage + "[0]"),
              currentSchema,
              undefined,
              record.value
            );
          }
          if (
            record &&
            record.value &&
            record.value[element.layout.profileImage] &&
            record.value[element.layout.profileImage][0] &&
            record.value[element.layout.profileImage][0].cloudinaryId
          ) {
            profileImage =
              record.value[element.layout.profileImage][0].cloudinaryId;
            if (
              profileImage.indexOf("http") != 0 &&
              profileImage.indexOf("h_")
            ) {
              profileImage =
                "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_250,w_250/v1623462816/" +
                profileImage +
                ".jpg";
            }
            imageDesc = getContent.getImageDesc(
              (record.value[element.layout.profileImage][0]),
              currentSchema,
              undefined,
              record.value
            );
          }
          var lurl = linkGenerator.getDetailLink({
            record: record ? record.value : {},
            org: "public",
            recordId: record && record.id ? record.id : undefined,
            schema: element.schema
          });
          images.push(
            <div key={global.guid()} onClick={self.relocate.bind(self, lurl)}>
              <img
                src={profileImage}
                title={imageDesc}
                alt={imageDesc}
                className="img-responsive link"
              />
              <Link className="hidden" to={lurl}>
                {imageDesc}{" "}
              </Link>
            </div>
          );
        });
        if (images.length > 0) {
          return <Carousel iconNav={true} images={images} noDetail={false} />;
        } else {
          return <div className="hidden" />;
        }
      } else {
        var heading = {};
        var galleryImages = [];
        this.state.records.map(function(record) {
          var img = "";
          if (
            record.value[element.layout.bannerImage] &&
            record.value[element.layout.bannerImage][0] &&
            record.value[element.layout.bannerImage][0].cloudinaryId
          ) {
            img = record.value[element.layout.bannerImage][0].cloudinaryId;
          }
          if (img.indexOf("http") != 0 && img.indexOf("h_")) {
            img =
              "//res.cloudinary.com/dzd0mlvkl/image/upload/h_500,w_750,c_fill,fl_progressive/v1623462816/" +
              img +
              ".jpg";
          }
          var temp = {};
          temp["url"] = img;
          var tempMap = {};
          temp["id"] = record.id;
          temp["caption"] = getContent.getImageDesc(
            record.value[element.layout.bannerImage][0],
            currentSchema,
            undefined,
            record.value
          );
          galleryImages.push(temp);
        });
        if (galleryImages.length > 0) {
          return (
            <div key={global.guid()} className="demo-slider">
              <Carousel
                type="slider"
                fromCrousel={"yes"}
                items={galleryImages}
                loadContent={self.loadContent}
                showControls={true}
                showStatus={true}
              />
            </div>
          );
        } else {
          return <div key={global.guid()} style={{ display: "none" }} />;
        }
      }
    } else {
      return <div key={global.guid()} style={{ display: "none" }} />;
    }
  }
});

var LandingSearch = React.createClass({
  forceSearch: function(event) {
    var code = event.keyCode ? event.keyCode : event.which;
    if (code == 13) {
      this.search();
    }
  },
  search: function() {
    var text = this.searchText.value.trim();
    if (!text) {
      console.log("Enter Text To Search");
    } else {
      common.clearMainContent();
      //location.href=
      browserHistory.push("/srch?st=" + text);
    }
  },
  render: function() {
    var style = {
      backgroundColor:
        this.props.searchType && this.props.searchType.searchButtonBGColor
          ? this.props.searchType.searchButtonBGColor
          : undefined
    };
    //"color":this.props.searchType.searchButtonFGColor
    return (
      <div
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding searchPosition"
        style={style}
      >
        <input
          type="text"
          ref={e => {
            self.searchText = e;
          }}
          className="form-control search-input"
          onKeyPress={this.forceSearch}
          placeholder={
            this.props.searchType ? this.props.searchType.placeholder : ""
          }
        />
        <img
          src="/branding/search.svg"
          alt="search"
          onClick={this.search.bind(this)}
          className="pointer searchImgPosition"
        />
      </div>
    );
  }
  /*<div className="col-lg-9 col-md-9 col-sm-9 col-xs-9 no-padding"  style={{"background-color":"white"}}>
						<input ref={(e)=>{self.searchText=e}} type="text" className=" form-control" placeholder={this.props.searchType?this.props.searchType.placeholder:""}  onKeyPress={this.forceSearch}/>
					</div>
					<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 no-padding">
						<button style={style} type="submit" className="form-control" value="SEARCH"  onClick={this.search.bind(this)}>SEARCH</button>
					</div>*/
});

var LandingSchemaRelated = React.createClass({
  render: function() {
    var element = this.props.element;
    var schema = this.props.schema;
    var record = this.props.fromSummary
      ? this.props.record
      : this.props.record.value;
    var property = element.value.slice(1); //to remove preceded symbol for coding
    if (record && Object.keys(record).length != 0) {
      if (element.group == "properties") {
        var tempRecord = {};
        tempRecord[property] = record[property];
        return (
          <genericView.GenericDisplayViewDetail
            dependentSchema={schema}
            relatedSchemas={this.props.record.relatedSchemas}
            rootSchema={this.props.layoutJSON["schemaName"]}
            record={tempRecord}
            recordId={this.props.layoutJSON["schemaRecordId"]}
            org={"public"}
            methods={this.props.record.methods}
          />
        );
      } else if (
        element.group == "relations" ||
        element.group == "actions" ||
        element.group == "update" ||
        element.group == "delete"
      ) {
        return (
          <genericView.GenericLayout
            key={global.guid()}
            singleCol={
              element.group == "relations" ? "$" + property : "#" + property
            }
            rootSchema={this.props.layoutJSON["schemaName"]}
            data={record}
            methods={this.props.record.methods}
            relatedSchemas={this.props.record.relatedSchemas}
            viewName={"getDetail"}
            recordId={this.props.layoutJSON["schemaRecordId"]}
            org={"public"}
          />
        );
      } else {
        return <div style={{ display: "none" }} />;
      }
    } else {
      return <div style={{ display: "none" }} />;
    }
  }
});

var MyVideoTag = React.createClass({
  IsElementInViewport: function(el) {
    if (typeof jQuery === "function" && el instanceof jQuery) {
      el = el[0];
    }
    var rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  componentDidMount: function() {
    var mobile = false;
    if (
      typeof navigator != "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      mobile = true;
    }
    /*if(!mobile)
        $(window).on('scroll',  this.ScrollControl);*/
  },
  componentWillUnmount: function() {
    //window.removeEventListener("scroll",this.ScrollControl);
  },
  ScrollControl: function() {
    /*if(this.player){
	        if(this.IsElementInViewport(this.player)){
	        	this.player.play();
	        }else{
	        	this.player.pause();
	        }
        }else if(document.getElementById("player")){
        	if(this.IsElementInViewport(document.getElementById("player"))){
	        	document.getElementById("player").play();
	        }else{
	        	document.getElementById("player").pause();
	        }
        }*/
  },
  render: function() {
    return (
      <div>
        <video
          id="player"
          ref={e => {
            this.player = e;
          }}
          controls={"true"}
          style={this.props.css ? this.props.css : {}}
          src={this.props.content.url}
          poster={this.props.content.thumbnail}
          preload="none"
          onClick={e => {
            e.target.paused ? e.target.play() : e.target.pause();
          }}
        />
      </div>
    );
  }
});
