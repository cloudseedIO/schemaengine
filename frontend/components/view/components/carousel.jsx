/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var global = require("../../../utils/global.js");
var common = require("../../common.jsx");
//var ImageGallery = require('../../../react-responsive-carousel/components/ImageGallery.js');
//var Carousel = require('../../../react-responsive-carousel/components/Carousel.js');

var ImageGallery = React.createClass({
  getInitialState: function() {
    return { myCarouselId: global.guid() };
  },
  goDetail: function(img) {
    var image = img.url;
    if (image.indexOf("/facebook/") != -1 || image.indexOf("/gplus/") != -1) {
      image = image.replace("c_pad,h_150,w_150/", "");
    } else if (image.indexOf("/upload/") != -1) {
      image =
        image.substr(0, image.indexOf("/upload/") + 8) +
        image.substr(image.indexOf("/v"), image.length);
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
        noSideDiv={true}
      />,
      node
    );
    ReactDOM.render(
      <img key={global.guid()} src={image} style={{"width":"100%"}} className="img-responsive" />,
      document.getElementById(contentDivId)
    );
  },
  handleImagePopUp: function(images, url, id) {
    if (typeof this.props.viewRecord == "function") {
      this.props.viewRecord(id);
      return;
    }
    /*if(image.indexOf("/facebook/")!=-1 || image.indexOf("/gplus/")!=-1){
            image=image.replace("c_pad,h_150,w_150/","");

        }else if (image.indexOf("/upload/")!=-1){
            image=image.substr(0,image.indexOf("/upload/")+8)+image.substr(image.indexOf("/v"),image.length);
        }*/
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
        noSideDiv={true}
      />,
      node
    );
    //  ReactDOM.render(<img key={global.guid()}  src={image} className="img-responsive"/>,document.getElementById(contentDivId));
    ReactDOM.render(
      <ImageGallery
        url={url}
        id={id}
        type="slider"
        carousel={true}
        images={this.props.images}
        fromPopUp={true}
      />,
      document.getElementById(contentDivId)
    );
  },
  prev: function(id) {
    var totalItems = $("#" + id + " .item");
    for (var i = 0; i < totalItems.length; i++) {
      if (totalItems[i].className.indexOf("active") != -1) {
        this.hideAndShowArrows(i - 1, totalItems.length);
      }
    }
  },
  componentDidMount: function() {
    if (this.props.carousel) {
      if (this.props.images.length > 0) {
        if (
          this.props.url == this.props.images[0].url ||
          this.props.images.length == 1 ||
          this.props.images.length == 2
        ) {
          this.hideAndShowArrows(
            0,
            $("#" + this.state.myCarouselId + " .item").length
          );
        } else if (
          this.props.url == this.props.images[this.props.images.length - 1].url
        ) {
          this.hideAndShowArrows(
            this.props.images.length - 1,
            $("#" + this.state.myCarouselId + " .item").length
          );
        }
      }
    } else {
      this.hideAndShowArrows(
        0,
        $("#" + this.state.myCarouselId + " .item").length
      );
    }
  },
  hideAndShowArrows: function(i, totalLength) {
    if (i + 1 == totalLength) {
      this.rightArrow.className += " hidden";
    } else {
      this.rightArrow.className = this.rightArrow.className.replace(
        /hidden/g,
        ""
      );
    }
    if (i == 0) {
      this.leftArrow.className += " hidden";
    } else {
      this.leftArrow.className = this.leftArrow.className.replace(
        /hidden/g,
        ""
      );
    }
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
    var myCarouselId = this.state.myCarouselId;
    var self = this;

    var width = self.props.iconNav
      ? common.calWidth("true")
      : common.calWidth();
    var count = width.visibleCount;
    var colSize = width.colSize;
    var images = [];
    var temp = [];
    var i = 0;
    if (this.props.carousel) {
      return (
        <div
          key={global.guid()}
          id={myCarouselId}
          className="carousel slide"
          data-interval="false"
          data-ride="carousel"
        >
          <div className="carousel-inner carouselGallery">
            {this.props.images.map(function(img, index) {
              var firstSlide = "";
              if (self.props.url == img.url) {
                firstSlide = "active";
              }
              var url = img.url;
              if (self.props.fromPopUp) {
                if (
                  url.indexOf("/facebook/") != -1 ||
                  url.indexOf("/gplus/") != -1
                ) {
                  url = url.replace("c_pad,h_150,w_150/", "");
                } else if (url.indexOf("/upload/") != -1) {
                  url =
                    url.substr(0, url.indexOf("/upload/") + 8) +
                    url.substr(url.indexOf("/v"), url.length);
                }
              }
              return (
                <div key={global.guid()} className={"item " + firstSlide}>
                  <div className={"img-holder "+(self.props.fromPopUp?"text-center":"")} >
                    {self.props.fromPopUp ? (
                      <img
                        src={url}
                        alt={img.caption ? img.caption : ""}
                        title={img.caption ? img.caption : ""}
                        className="img-responsive"
                        style={{"width":"auto"}}
                      />
                    ) : (
                      <img
                        src={url}
                        onClick={self.goDetail.bind(null, img)}
                        alt={img.caption ? img.caption : ""}
                        title={img.caption ? img.caption : ""}
                        className="img-responsive"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <a
            className="left carousel-control link "
            style={{ width: "auto" }}
            ref={d => {
              self["leftArrow"] = d;
            }}
            title="Previous"
            href={"#" + myCarouselId}
            onClick={self.prev.bind(null, myCarouselId)}
            role="button"
            data-slide="prev"
          >
            <i className="sleekIcon-leftarrow fa-2x link " />
            <span className="sr-only">Previous</span>
          </a>
          <a
            className="right carousel-control link"
            href={"#" + myCarouselId}
            style={{ width: "auto" }}
            title="Next"
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
        </div>
      );
    } else {
      if (this.props.images.length < count) {
        images.push(this.props.images);
      } else {
        for (i = 0; i < this.props.images.length; i++) {
          temp.push(this.props.images[i]);
          if (i != 0 && (i + 1) % count == 0) {
            images.push(temp);
            temp = [];
          }
        }
        if (i + (1 % count) != 0 && temp.length > 0) {
          images.push(temp);
        }
      }
      if (this.props.fromArray) {
        return (
          <div
            key={global.guid()}
            id={myCarouselId}
            className="carousel slide"
            data-interval="false"
            data-ride="carousel"
          >
            <div className="carousel-inner carouselGallery">
              {images.map(function(arrayImage, index) {
                var firstSlide = index == 0 ? "active" : "";
                return (
                  <div key={global.guid()} className={"item " + firstSlide}>
                    {arrayImage.map(function(img, index1) {
                      return (
                        <div
                          key={global.guid()}
                          className={
                            "col-md-" +
                            colSize +
                            " col-sm-" +
                            colSize +
                            " col-xs-" +
                            colSize
                          }
                        >
                          <common.UserIcon
                            key={global.guid()}
                            fromRelation={self.props.fromRelation}
                            id={img}
                            viewName={self.props.viewName}
                            org={self.props.org}
                            noDetail={self.props.noDetail}
                            rootSchema={self.props.rootSchema}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <a
              className="left carousel-control link hidden"
              style={{ width: "auto" }}
              ref={d => {
                self["leftArrow"] = d;
              }}
              title="Previous"
              href={"#" + myCarouselId}
              onClick={self.prev.bind(null, myCarouselId)}
              role="button"
              data-slide="prev"
            >
              <i className="sleekIcon-leftarrow fa-2x link " />
              <span className="sr-only">Previous</span>
            </a>
            <a
              className="right carousel-control link"
              href={"#" + myCarouselId}
              title="Next"
              style={{ width: "auto" }}
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
          </div>
        );
      } else {
        return (
          <div
            key={global.guid()}
            id={myCarouselId}
            className="carousel slide"
            data-interval="false"
            data-ride="carousel"
          >
            <div className="carousel-inner carouselGallery">
              {images.map(function(arrayImage, index) {
                var firstSlide = index == 0 ? "active" : "";
                return (
                  <div key={global.guid()} className={"item " + firstSlide}>
                    {arrayImage.map(function(img, index1) {
                      return (
                        <div
                          key={global.guid()}
                          className={
                            "col-md-" +
                            colSize +
                            " col-sm-" +
                            colSize +
                            " col-xs-" +
                            colSize
                          }
                        >
                          {["a"].map(function(temp) {
                            if (self.props.fromDnd) {
                              return self.props.getDndImage(
                                img,
                                self.props.data
                              );
                            } else if (self.props.fromPopup) {
                              return (
                                <div className="img-holder" key={global.guid()}>
                                  <img
                                    src={img.url}
                                    alt={img.caption ? img.caption : ""}
                                    title={img.caption ? img.caption : ""}
                                    className="img-responsive"
                                  />
                                </div>
                              );
                            } else if (self.props.iconNav) {
                              return img;
                            } else {
                              return (
                                <div className="img-holder" key={global.guid()}>
                                  <img
                                    src={img.url}
                                    alt={img.caption ? img.caption : ""}
                                    title={img.caption ? img.caption : ""}
                                    className="img-responsive grow"
                                    onClick={self.handleImagePopUp.bind(
                                      null,
                                      self.props.images,
                                      img.url,
                                      img.id
                                    )}
                                  />
                                </div>
                              );
                            }
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <a
              className="left carousel-control link hidden"
              style={{ width: "auto" }}
              ref={d => {
                self["leftArrow"] = d;
              }}
              title="Previous"
              href={"#" + myCarouselId}
              onClick={self.prev.bind(null, myCarouselId)}
              role="button"
              data-slide="prev"
            >
              <i className="sleekIcon-leftarrow fa-2x link " />
              <span className="sr-only">Previous</span>
            </a>
            <a
              className="right carousel-control link"
              href={"#" + myCarouselId}
              style={{ width: "auto" }}
              title="Next"
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
          </div>
        );
      }
    }
    /*return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                    <div id={myCarouselId} className="carousel slide" data-ride="carousel">
                         <ol className="carousel-indicators">
                            <li data-target={"#"+myCarouselId} data-slide-to="0" className="active"></li>
                            {
                                this.props.images.map(function(record,index){
                                    if(index!=0)
                                        return <li data-target={"#"+myCarouselId} key={index} data-slide-to={""+index}></li>
                                })
                            }
                         </ol>
                          <div className="carousel-inner " role="listbox">
                            {
                                this.props.images.map(function(img,index){
                                    var firstSlide=(index==0)?"active":"";

                                    return (<div  key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding item "+firstSlide}>
                                                <div className='form-group'>
                                                    <div className='img-holder'>
                                                        <img src={img.url}
                                                            alt={img.caption?img.caption:""}
                                                            title={img.caption?img.caption:""}
                                                            className="img-responsive grow"
                                                            onClick={self.handleImagePopUp.bind(null,img.url,img.id)}/>
                                                    </div>
                                                </div>
                                            </div>)
                                })
                            }
                        </div>
                        <a className="left carousel-control link" href={"#"+myCarouselId} title="Previous" role="button" data-slide="prev">
                            <i  className="sleekIcon-leftarrow fa-2x link "></i>
                            <span className="sr-only">Previous</span>
                        </a>
                        <a className="right carousel-control link" href={"#"+myCarouselId} title="Next" role="button" data-slide="next">
                            <i  className="sleekIcon-rightarrow fa-2x link "></i>
                            <span className="sr-only">Next</span>
                        </a>

                      </div>
                </div>)*/
  }
});
exports.ImageGallery = ImageGallery;
exports.Carousel = ImageGallery;
