/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../../common.jsx");
//var ActionCreator = require('../../../actions/ActionCreator.js');
//var junctionCount=require('./junctionCount.jsx');
//var WebUtils=require('../../../utils/WebAPIUtils.js');
var getContent = require("./getContent.jsx");
var genericNav = require("../../nav/genericNav.jsx");
var SchemaStore = require("../../../stores/SchemaStore.js");
var global = require("../../../utils/global.js");
//var genericView=require('../genericView.jsx');
var EditOrView = require("./EditOrView.jsx");
var BannerComponent = React.createClass({
  getInitialState: function() {
    /*follow:"Follow",like:"Like",*/
    return {
      prevLike: null,
      prevFollow: null,
      bannerData: this.getBannerData()
    };
  },
  getBannerData: function() {
    var self = this;
    var profileImage = "";
    var coverImage = "";
    var bannerProperties = {};
    var css = this.props.fullLayout.css;
    bannerProperties["header"] =
      this.props.fullLayout.layout.header != undefined
        ? this.props.fullLayout.layout.header
        : this.props.fullLayout.layout.overlay != undefined &&
          this.props.fullLayout.layout.overlay.header != undefined
          ? this.props.fullLayout.layout.overlay.header
          : undefined;
    bannerProperties["subHeader"] =
      this.props.fullLayout.layout.subHeader != undefined
        ? this.props.fullLayout.layout.subHeader
        : this.props.fullLayout.layout.overlay &&
          this.props.fullLayout.layout.overlay.subHeader != undefined
          ? this.props.fullLayout.layout.overlay.subHeader
          : undefined;

    var recordData = {};
    ["header", "subHeader"].forEach(function(data) {
      recordData[data] = {};
      var editKey = undefined;
      if (typeof bannerProperties[data] == "object") {
        if (
          Array.isArray(
            bannerProperties[data][Object.keys(bannerProperties[data])[0]]
          ) &&
          bannerProperties[data][Object.keys(bannerProperties[data])[0]]
            .length > 0
        ) {
          recordData[data]["value"] = "";
          bannerProperties[data][Object.keys(bannerProperties[data])[0]].map(
            function(obj, index) {
              try {
                var comma = ", ";
                if (
                  bannerProperties[data][Object.keys(bannerProperties[data])[0]]
                    .length -
                    1 ==
                  index
                ) {
                  comma = "";
                } else if (
                  !self.props.record[Object.keys(bannerProperties[data])[0]][
                    bannerProperties[data][
                      Object.keys(bannerProperties[data])[0]
                    ][index]
                  ]
                ) {
                  comma = "";
                }
                var innerValue = "";
                if (
                  self.props.record[Object.keys(bannerProperties[data])[0]][
                    bannerProperties[data][
                      Object.keys(bannerProperties[data])[0]
                    ][index]
                  ]
                ) {
                  innerValue =
                    self.props.record[Object.keys(bannerProperties[data])[0]][
                      bannerProperties[data][
                        Object.keys(bannerProperties[data])[0]
                      ][index]
                    ];
                }
                recordData[data]["value"] += innerValue + comma;
              } catch (err) {}
            }
          );
          bannerProperties[data] = Object.keys(bannerProperties[data])[0];
        }
      } else if (typeof self.props.record[bannerProperties[data]] == "object") {
        var temp = "";
        try {
          for (var key in self.props.record[bannerProperties[data]]) {
            if (self.props.record[bannerProperties[data]][key].trim() != "")
              temp +=
                self.props.record[bannerProperties[data]][key].trim() + ", ";
          }
        } catch (err) {}
        temp = temp.replace(/,\s$/, ".");
        recordData[data]["value"] = temp;
      } else {
        recordData[data]["value"] = self.props.record[bannerProperties[data]];
      }

      /*** assigning css **/
      recordData[data]["css"] = {};
      if (
        css &&
        Object.keys(css).length > 0 &&
        ((css[bannerProperties[data]] != "" &&
          css[bannerProperties[data]] != undefined) ||
          (typeof bannerProperties[data] == "object" &&
            css[Object.keys(bannerProperties[data])[0]] != undefined &&
            css[Object.keys(bannerProperties[data])[0]] != ""))
      ) {
        var allStyles = {};
        if (typeof bannerProperties[data] == "object") {
          allStyles = getContent.getStyleFromConfig(
            css[Object.keys(bannerProperties[data])[0]]
          );
        } else {
          allStyles = getContent.getStyleFromConfig(
            css[bannerProperties[data]]
          );
        }
        recordData[data]["css"]["normal"] = allStyles.normal;
      }
    });
    var profileAlt = "";
    if (
      this.props.record[this.props.fullLayout.layout.profileImage] &&
      this.props.record[this.props.fullLayout.layout.profileImage].length > 0 &&
      typeof this.props.record[this.props.fullLayout.layout.profileImage][0] ==
        "object" &&
      this.props.record[this.props.fullLayout.layout.profileImage][0]
        .cloudinaryId &&
      this.props.record[this.props.fullLayout.layout.profileImage][0]
        .cloudinaryId != ""
    ) {
      profileImage = this.props.record[
        this.props.fullLayout.layout.profileImage
      ][0].cloudinaryId;
      profileAlt = this.props.record[
        this.props.fullLayout.layout.profileImage
      ][0].caption;
      if (profileImage && profileImage.indexOf("http") != 0) {
        profileImage =
          "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1623462816/" +
          profileImage +
          ".jpg";
      }
    } else {
      var image =
        this.props.fullLayout.layout.profileImage != "" &&
        this.props.record[this.props.fullLayout.layout.profileImage] &&
        this.props.record[this.props.fullLayout.layout.profileImage].length > 0
          ? this.props.record[this.props.fullLayout.layout.profileImage][0]
          : undefined;
      profileAlt = "default";
      var tempPath = "";
      if (image && image.facebook) {
        tempPath =
          "//res.cloudinary.com/dzd0mlvkl/image/facebook/c_pad,h_150,w_150/" +
          image.facebook +
          ".jpg";
        profileImage = tempPath;
        profileAlt = "user";
      } else if (image && image.google) {
        tempPath =
          "//res.cloudinary.com/dzd0mlvkl/image/gplus/c_pad,h_150,w_150/" +
          image.google +
          ".jpg";
        profileImage = tempPath;
        profileAlt = "user";
      } else {
        //profileImage="//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1426847732/user_icon.jpg";
      }
    }
    var bannerAlt = "";
    if (
      this.props.record[this.props.fullLayout.layout.coverImage] &&
      this.props.record[this.props.fullLayout.layout.coverImage].length > 0 &&
      typeof this.props.record[this.props.fullLayout.layout.coverImage][0] ==
        "object" &&
      this.props.record[this.props.fullLayout.layout.coverImage][0] &&
      this.props.record[this.props.fullLayout.layout.coverImage][0]
        .cloudinaryId &&
      this.props.record[this.props.fullLayout.layout.coverImage][0]
        .cloudinaryId != ""
    ) {
      coverImage = this.props.record[this.props.fullLayout.layout.coverImage][0]
        .cloudinaryId;
      bannerAlt = this.props.schemaDoc["@properties"].bannerImage.description;
      if (coverImage.indexOf("http") != 0) {
        coverImage =
          "//res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/" +
          coverImage +
          ".jpg";
      }
    } else {
      var imgId = "wkbanner.jpg";
      bannerAlt = "default";
      if (common.getConfigDetails() && common.getConfigDetails().crashBanner) {
        imgId = common.getConfigDetails().crashBanner;
      }
      coverImage = "/branding/" + imgId;
    }
    bannerProperties["profile"] = this.props.fullLayout.layout.profileImage;
    bannerProperties["cover"] = this.props.fullLayout.layout.coverImage;
    return {
      profileImage: profileImage,
      coverImage: coverImage,
      recordData: recordData,
      profileAlt: profileAlt,
      bannerAlt: bannerAlt,
      bannerProperties: bannerProperties
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
    //return (JSON.stringify(this.props)!= JSON.stringify(nextProps));
  },
  /*	like:function(){
		var like={
		  "likeFor": this.props.recordId,
		  "likedBy": common.getUserDoc().recordId,
		  "relationDesc": [
		    "likeFor-likedBy-likedBy",
		    "likedBy-isLiking-likeFor"
		  ],
		  "org": this.props.org,
		  "docType": "Like",
		  "recordId": "Like"+global.guid(),
		  "author": common.getUserDoc().recordId,
		  "editor": common.getUserDoc().recordId,
		  "dateCreated": global.getDate(),
		  "dateModified": global.getDate(),
		  "revision": "1"
		};
		this.saveDoc(like);
	},
	follow:function(){
		var follow={
		  "followee": this.props.recordId,
		  "follower": common.getUserDoc().recordId,
		  "relationDesc": [
		    "followee-followedBy-follower",
		    "follower-isFollowing-followee"
		  ],
		   "org": this.props.org,
		  "docType": "Follow",
		  "recordId": "Follow"+global.guid(),
		  "author": common.getUserDoc().recordId,
		  "editor": common.getUserDoc().recordId,
		  "dateCreated": global.getDate(),
		  "dateModified": global.getDate(),
		  "revision": "1"
		};
		this.saveDoc(follow);
	},
	saveDoc:function(doc){
		if(typeof common.getUserDoc().recordId != "undefined"){
			if(doc.docType=="Follow" && (this.state.prevFollow==null || (new Date() - this.state.prevFollow) >10000)){
				var newFollowStatus;
				if(this.state.follow=="Follow"){
					newFollowStatus="Following";
					this["follow_button"].className=" name fa fa-rss";
				}else{
					newFollowStatus="Follow";
					this["follow_button"].className=" fa fa-rss";
				}
				this.setState({follow:newFollowStatus,prevFollow:new Date()},function(){
					ActionCreator.createJunction(doc);
				});
			}
			if(doc.docType=="Like" && (this.state.prevLike==null || (new Date() - this.state.prevLike)>10000)){
				var newLikeStatus;
				if(this.state.like=="Like"){
					newLikeStatus="Liked";
					this["like_button"].className=" name fa fa-heart";
				}else{
					newLikeStatus="Like";
					this["like_button"].className="fa fa-heart-o";
				}
				this.setState({like:newLikeStatus,prevLike:new Date()},function(){
					ActionCreator.createJunction(doc);
				});
			}
		}
	},
	showRelation:function(relation){

 		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
       	ReactDOM.render(<genericView.RelatedRecords
       								rootSchema={this.props.rootSchema}
       								recordId={this.props.recordId}
       								relation={SchemaStore.get(this.props.rootSchema)["@relations"][this.props.relation]}
       								org={this.props.org}/>,document.getElementById(contentDivId));
	},*/
  componentDidMount: function() {
    /*	var self=this;
    /*
		if(typeof common.getUserDoc().recordId != "undefined"){
			WebUtils.doPost("/generic?operation=checkRelated",{
										"recordId":common.getUserDoc().recordId,
										"relatedRecordId":this.props.recordId,
										"relation":"isLiking",
										"docType":"Like",
										"likeFor":this.props.recordId,
										"likedBy":common.getUserDoc().recordId
										},function(data){
				if(data.result=="related"){
					self.setState({like:"Liked"});
					try{
						self.like_button.className="fa fa-heart name";
					}catch(err){}
				}
			},true);
			WebUtils.doPost("/generic?operation=checkRelated",{
								"recordId":common.getUserDoc().recordId,
								"relatedRecordId":this.props.recordId,
								"relation":"isFollowing",
								"docType":"Follow",
								"followee":this.props.recordId,
								"follower":common.getUserDoc().recordId
								},function(data){
				if(data.result=="related"){
					self.setState({follow:"Following"});
					try{
						self.follow_button.className="fa fa-rss name";
					}catch(err){}
				}
			},true);
		}*/
    common.updateErrorImages();
  },
  handleImagePopUp: function(image, property) {
    var epdata = {
      property: this.state.bannerData.bannerProperties[property],
      rootSchema: this.props.rootSchema,
      org: this.props.org,
      schemaDoc: this.props.schemaDoc,
      fullRecord: this.props.record,
      recordId: this.props.recordId
    };
    var piep = EditOrView.getEditPrivileges(epdata); //Profile Image Edit Privileges
    if (piep.canEdit) {
      this.editProperty(property);
      return;
    }

    if (image) {
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
        <img key={global.guid()} src={image} className="img-responsive" />,
        document.getElementById(contentDivId)
      );
    }
  },
  editProperty: function(property) {
    var self = this;
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
      />,
      node
    );
    ReactDOM.render(
      <EditOrView.EditOrView
        key={global.guid()}
        dependentSchema={self.props.dependentSchema}
        relatedSchemas={self.props.relatedSchemas}
        rootSchema={self.props.rootSchema}
        schemaDoc={this.props.schemaDoc}
        property={this.state.bannerData.bannerProperties[property]}
        fullRecord={self.props.record}
        recordId={self.props.recordId}
        defaultEdit={true}
        org={self.props.org}
      />,
      document.getElementById(contentDivId)
    );
  },
  render: function() {
    if (this.props.fullLayout && this.props.fullLayout.layout) {
      var profileImage = this.state.bannerData.profileImage;
      var coverImage = this.state.bannerData.coverImage;
      var recordData = this.state.bannerData.recordData;
      var profileAlt = this.state.bannerData.profileAlt;
      var bannerAlt = this.state.bannerData.bannerAlt;
      var schemaRec = SchemaStore.get(this.props.rootSchema);
      /*var orgData = {
				"orgName" : recordData["header"]["value"],
				"orgLocation" : recordData["subHeader"]["value"],
				"orgImage" : profileImage
			};*/

      return (
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          <div className="main-block">
            <div className="banner-picture img-holder">
              <div
                itemProp={"image"}
                content={coverImage}
                className="img text-right"
                title={bannerAlt}
                style={{ backgroundImage: "url(" + coverImage + ")" }}
                onClick={this.handleImagePopUp.bind(null, coverImage, "cover")}
              />
            </div>
            <div className="row no-margin txt ">
              <span
                className="display-inline-block"
                onClick={this.handleImagePopUp.bind(
                  null,
                  profileImage,
                  "profile"
                )}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    itemProp={"image"}
                    alt={profileAlt}
                    title={profileAlt}
                    className=" profilePicture"
                  />
                ) : (
                  <span className="minBox pencil">&nbsp;&nbsp;&nbsp;</span>
                )}
              </span>
              &nbsp;&nbsp;&nbsp;
              <span className="display-inline-block">
                <ul className=" no-padding-left">
                  <div>
                    <div
                      itemProp={"name"}
                      style={recordData["header"]["css"].normal}
                      className="form-group minBox pencil"
                      onClick={this.handleImagePopUp.bind(
                        null,
                        undefined,
                        "header"
                      )}
                    >
                      {recordData["header"]["value"]
                        ? recordData["header"]["value"]
                        : "       "}
                    </div>
                    <div
                      itemProp={"address"}
                      style={recordData["subHeader"]["css"].normal}
                      className="minBox pencil"
                      onClick={this.handleImagePopUp.bind(
                        null,
                        undefined,
                        "subHeader"
                      )}
                    >
                      {recordData["subHeader"]["value"]
                        ? recordData["subHeader"]["value"]
                        : "        "}
                    </div>
                  </div>
                </ul>
              </span>
            </div>
          </div>
          {/*
		               (this.props.fullLayout.systemRelations=="Yes")?(<div key={global.guid()}  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left ">
											<div className="display-inline-block ">
												<span  onClick={this.follow}  ref={(s)=>{this.follow_button=s}} className="fa fa-rss">&nbsp;</span>
												<span ref={(s)=>{this.followCount=s}}  className="pointer" onClick={this.showRelation.bind(null,"follow")}  >
												<junctionCount.JunctionCount recordId={this.props.recordId} relation="followedBy"/></span> &nbsp;&nbsp;</div>
											<div className="display-inline-block">
												<span  ref={(s)=>{this.like_button=s}} onClick={this.like} className="fa fa-heart-o">&nbsp;</span>
												<span ref={(s)=>{this.likeCount=s}}  className="pointer" onClick={this.showRelation.bind(null,"like")} >
												<junctionCount.JunctionCount recordId={this.props.recordId} relation="likedBy"/></span> &nbsp;&nbsp;</div>
										</div>):(<div className="hidden"></div>)
                	*/}
          {this.props.fullLayout.layout.includeNav ? (
            <div className=" col-lg-12  col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm margin-top-gap-sm">
              <genericNav.RecordNav
                inRecord={true}
                recordNav={schemaRec["@recordNav"]}
              />
            </div>
          ) : (
            ""
          )}
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});
exports.BannerComponent = BannerComponent;
  
