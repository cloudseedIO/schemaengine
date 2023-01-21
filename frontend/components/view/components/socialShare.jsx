/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../../common.jsx");
var getURLContent = require("./getURLContent.jsx");
var global = require("../../../utils/global.js");
var signUp = require("../../auth/signUp.jsx");
var SocialShare = React.createClass({
  getInitialState: function() {
    if (typeof location != "undefined" && location.protocol) {
      var url = location.protocol + "//" + location.host + this.props.href;
      return { url: url };
    } else {
      return { url: this.props.url };
    }
  },
  email: function(url) {
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className =
      "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);

    if (typeof common.getUserDoc().recordId != "undefined") {
      ReactDOM.render(
        <common.GenericPopUpComponent
          popUpId={popUpId}
          contentDivId={contentDivId}
          sideDivId={sideDivId}
        />,
        node
      );
      ReactDOM.render(
        <EmailComponent url={url} popUpId={popUpId} />,
        document.getElementById(contentDivId)
      );
    } else {
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
    }
  },

  render: function() {
    //var href=this.props.href;
    var url = this.state.url;
    var whatsapp = "hidden";
    var device = "";
    if (
      typeof navigator != "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      whatsapp = "";
      device = navigator.userAgent.toLowerCase();
    }
    if (url != undefined && url != "") {
      return (
        <ul
          style={{ paddingTop: "2px" }}
          className="pull-right list-unstyled child-img-component no-padding-right extra-margin-top-xs extra-margin-bottom "
        >
          <li className="userNavHover share" style={{ position: "relative" }}>
            {/*<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding uppercase">
                                <span className="propertyName">Share</span>
                            </div>*/}
            <div className="buttonWidth noMinHeight">
              <div className="iconHeight">
                <a className="dropdown-toggle" aria-expanded="false">
                  <i className="icons8-share-arrow newCustomIcon" />
                </a>
              </div>
            </div>
            <ul
              style={{
                minWidth: "50%",
                left: "auto",
                marginTop: "20%",
                paddingLeft: "5px",
                background: "white"
              }}
              className="dropdown-menu arrow_box"
              id="userSubNav"
            >
              <a
                href={
                  "https://www.facebook.com/sharer/sharer.php?u=" +
                  encodeURIComponent(url)
                }
                title="Share via Facebook"
                className="child-img-component"
                target="_blank"
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Facebook.svg"
                  className="img socialIcon"
                  title={"Share On Facebook"}
                  alt={"Share On Facebook"}
                />
              </a>

              <a
                className="child-img-component"
                onClick={this.email.bind(this, url)}
                title={"Share Via Email"}
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Email.svg"
                  className="img socialIcon"
                  title={"Share Via Email"}
                  alt={"Share Via Email"}
                />
              </a>

              <a
                href={
                  "https://twitter.com/home?status=" + encodeURIComponent(url)
                }
                className="child-img-component"
                target="_blank"
                title={"Share On Twitter"}
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Twitter.svg"
                  className="img socialIcon"
                  title={"Share On Twitter"}
                  alt={"Share On Twitter"}
                />
              </a>

              <a
                href={
                  "https://www.linkedin.com/cws/share?url=" +
                  encodeURIComponent(url)
                }
                className="child-img-component"
                target="_blank"
                title="Share via LinkedIn"
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/LinkedIn.svg"
                  className="img socialIcon"
                  title={"Share Via LinkedIn"}
                  alt={"Share Via LinkedIn"}
                />
              </a>

              <a
                href={
                  "https://plus.google.com/share?url=" + encodeURIComponent(url)
                }
                className="child-img-component"
                target="_blank"
                title={"Share On Google Plus"}
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/GooglePlus.svg"
                  className="img socialIcon"
                  title={"Share On Google Plus"}
                  alt={"Share On Google Plus"}
                />
              </a>

              <a
                href={
                  "http://pinterest.com/pin/create/button/?url=" +
                  encodeURIComponent(url)
                }
                className="child-img-component"
                target="_blank"
                title="Share via Pinterest"
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Pinterest.svg"
                  className="img socialIcon"
                  title={"Pin it on Pinterest"}
                  alt={"Pin it on Pinterest"}
                />
              </a>

              <a
                href={
                  "whatsapp://send?text=" +
                  encodeURIComponent("Check out this page ") +
                  " - " +
                  encodeURIComponent(url)
                }
                title="Share via WhatsApp"
                className={"child-img-component " + whatsapp}
                target="_blank"
              >
                <img
                  src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/WhatsApp.svg"
                  className={"img socialIcon " + whatsapp}
                  title={"Share Via WhatsApp"}
                  alt={"Share Via WhatsApp"}
                />
              </a>
              {["a"].map(function(temp) {
                var tempUrl = "";
                if (
                  device.indexOf("iphone") > -1 ||
                  device.indexOf("ipad") > -1
                )
                  tempUrl = "sms:?&body=" + encodeURIComponent(url);
                else tempUrl = "sms:?body=" + encodeURIComponent(url);
                return (
                  <a
                    key={global.guid()}
                    href={tempUrl}
                    className={"child-img-component " + whatsapp}
                    title="Share via Message"
                    target="_blank"
                  >
                    <img
                      src="//res.cloudinary.com/dzd0mlvkl/image/upload/v1466587721/Message.svg"
                      className={"img socialIcon "}
                      title={"Share Via Message"}
                      alt={"Share Via Message"}
                    />
                  </a>
                );
              })}
            </ul>
          </li>
        </ul>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});
exports.SocialShare = SocialShare;

var EmailComponent = React.createClass({
  closePopUp: function() {
    try {
      common.showMainContainer();
      document.getElementById(this.props.popUpId).parentNode.remove();
    } catch (err) {
      console.log(err);
    }
  },
  validate: function() {
    document.getElementById("demo").className = "hidden";
    var emailList = this.to.value.split(",");
    var self = this;
    for (var i = 0; i < emailList.length; i++) {
      for (i = 0; i < emailList.length; i++) {
        var expr = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        var result = expr.test(emailList[i]);
        if (!result) {
          document.getElementById("demo").className =
            "col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding";
          document.getElementById("demo").style.color = "red";
          document.getElementById("demo").innerHTML =
            "Sorry enter a valid email adrress";
        }
      }
      console.log(emailList);
      require("../../../utils/WebAPIUtils.js").doPost(
        "/generic?operation=shareByEmail",
        {
          email: emailList.join(","),
          url: this.props.url,
          message: this.message.value,
          link: this.link.innerHTML
        },
        function(result) {
          if (result && result.sent == true) {
            common.createAlert(
              "Success",
              "Email was sent successfully",
              function() {
                self.closePopUp();
              }
            );
          } else {
            alert("Error Try Again");
          }
        }
      );
    }
  },
  render: function() {
    return (
      <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
        <label className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
          <span className="fieldText no-padding-left headerField title">
            To
          </span>
        </label>
        <div className="col-lg-8 col-sm-8 col-md-8 col-xs-12 no-padding form-group">
          <textarea
            ref={t => {
              this.to = t;
            }}
            className="form-control textarea"
            placeholder="Enter email ids separated by a comma (,)"
          />
          <div id="demo" className="hidden" />
        </div>
        <label className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
          <span className="fieldText no-padding-left headerField title">
            Message
          </span>
        </label>
        <div className="col-lg-8 col-sm-8 col-md-8 col-xs-12 no-padding form-group">
          <textarea
            ref={t => {
              this.message = t;
            }}
            className="form-control textarea"
            defaultValue="Check out this link"
          />
        </div>
        <div
          className="col-lg-8 col-sm-8 col-xs-12 col-md-8 no-paading "
          style={{ marginBottom: "15px" }}
          ref={e => {
            this.link = e;
          }}
        >
          <getURLContent.GetURLContent share={"share"} url={this.props.url} />
        </div>
        <div className="col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding">
          <input
            type="submit"
            ref={input => {
              this.disable_button;
            }}
            onClick={this.validate}
            className="action-button"
            value="SEND"
          />
        </div>
      </div>
    );
  }
});
