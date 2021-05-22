/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var WebUtils = require("../../../utils/WebAPIUtils.js");
var Carousel = require("./carousel.jsx").Carousel;
//var global=require('../../../utils/global.js')
var GetURLContent = React.createClass({
  getInitialState: function() {
    return { result: null };
  },
  componentDidMount: function() {
    WebUtils.getURLContent(this.props.url, this.result);
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return JSON.stringify(this.state) != JSON.stringify(nextState);
  },
  result: function(data) {
    if (!this._isUnmounted) this.setState({ result: data });
  },
  close: function() {
    this.result(null);
  },
  action: function() {
    this.anchor.click();
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var self = this;
    if (this.state.result != null) {
      var title = "";
      var flag = false;
      if (this.state.result.titles.length > 0) {
        title = this.state.result.titles[0];
        flag = true;
      }
      var images = [];
      var website = "";
      var url = "";
      var protocol = "";
      if (this.state.result.webSite.indexOf("http://") != -1) {
        this.state.result.webSite.replace("http://", "");
        protocol = "http://";
      } else if (this.state.result.webSite.indexOf("https://") != -1) {
        url = this.state.result.webSite.replace("https://", "");
        protocol = "https://";
      }
      var options = {
        host: url.indexOf("/") > -1 ? url.substr(0, url.indexOf("/")) : url,
        port:
          url.indexOf("/") > -1
            ? url.substr(0, url.indexOf("/")).indexOf(":") > -1
              ? url.substr(0, url.indexOf("/")).split(":")[1]
              : 80
            : 80,
        path: url.indexOf("/") > -1 ? url.substr(url.indexOf("/")) : "/"
      };
      /*
			links/image_src
			links/url/thumbnailUrl
			*/
      if (this.state.result.links) {
        var temp = {};
        if (
          this.state.result.links.image_src &&
          this.state.result.links.image_src != ""
        ) {
          temp["url"] = this.state.result.links.image_src;
          images.push(temp);
          flag = true;
        } else if (
          this.state.result.links.url &&
          this.state.result.links.url != ""
        ) {
          temp["url"] = this.state.result.links.url;
          images.push(temp);
          flag = true;
        } else if (
          this.state.result.links.thumbnailUrl &&
          this.state.result.links.thumbnailUrl != ""
        ) {
          temp["url"] = this.state.result.links.thumbnailUrl;
          images.push(temp);
          flag = true;
        } else if (this.state.result.images.length > 0) {
          var count = 0;
          this.state.result.images.map(function(image, index) {
            temp = {};
            if (
              image != null &&
              image.indexOf(".svg") == -1 &&
              image.indexOf(".gif") == -1 &&
              image.indexOf("data:") == -1 &&
              count < 5
            ) {
              if (
                image.indexOf("https:") == -1 &&
                image.indexOf("http:") == -1
              ) {
                temp["url"] = protocol + "" + options.host + "" + image;
              } else {
                temp["url"] = image;
              }
              count = count + 1;
              images.push(temp);
            }
          });
          flag = true;
        }
      }
      var description = "";
      Object.keys(this.state.result.data).forEach(function(temp, index) {
        if (
          temp.toLowerCase() == "description" &&
          self.state.result.data[temp].length > 0
        ) {
          description = self.state.result.data[temp];
          flag = true;
        }
      });
      var className1 = "row no-margin";
      var className2 = "row no-margin";
      if (images.length > 0) {
        className1 = "col-lg-3 col-md-3 col-sm-6 col-xs-12 no-padding urlScrap";
        className2 = "col-lg-9 col-md-9 col-sm-6 col-xs-12 no-padding";
      }
      if (description.length > 200) {
        description = description.substr(0, 200) + "..";
      }
      if (this.props.share != undefined) {
        // customized for share via email
        return (
          <div style={{ padding: "15px", width: "100%" }}>
            <img
              src={
                Array.isArray(images) &&
                typeof images[0] != "undefined" &&
                typeof images[0].url != "undefined"
                  ? images[0].url
                  : ""
              }
              style={{ float: "left", maxWidth: "25%", display: "table-cell" }}
              href={this.state.result.webSite}
            />
            <div style={{ marginTop: "8%", display: "table-cell" }}>
              <h3>
                <a
                  href={this.state.result.webSite}
                  style={{ textDecoration: "none", color: "black" }}
                >
                  {title.length > 0 ? title : ""}
                </a>
              </h3>
              <div>
                <a
                  href={this.state.result.webSite}
                  style={{ textDecoration: "none", color: "black" }}
                >
                  {description}
                </a>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="row no-margin url">
          <a
            className="hidden "
            ref={a => {
              this.anchor = a;
            }}
            target="_blank"
            href={this.state.result.webSite}
          />
          {/*
					<div className="row no-margin deleteHover">
											<span className="icons8-delete fontSizeDelete  deleteIcon fa-3x  pull-right link" onClick={this.close} aria-hidden="true"></span>
										</div>*/}
          <div className={className1}>
            {images.length == 1 ? (
              <div className="demo-slider col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                <img src={images[0].url} className="img-responsive" />
              </div>
            ) : images.length > 0 ? (
              <div className="demo-slider col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                <Carousel
                  type="slider"
                  items={images}
                  images={images}
                  showControls={false}
                />
              </div>
            ) : (
              <div className="hidden" />
            )}
          </div>
          <div className={className2} onClick={this.action}>
            {title.length > 0 ? (
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 link">
                <div className="textEllipsis remove-margin-bottom robotoSlabThin">
                  {title}
                </div>
              </div>
            ) : (
              <div className="hidden" />
            )}

            {description.length > 0 ? (
              <div
                className={
                  "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-margin latoThin"
                }
              >
                {description}
              </div>
            ) : (
              <div className="hidden" />
            )}
          </div>
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});
exports.GetURLContent = GetURLContent;
