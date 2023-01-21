/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var common = require("../../common.jsx");
var SchemaStore = require("../../../stores/SchemaStore");
//var ActionCreator = require('../../../actions/ActionCreator.js');
var linkGenerator = require("../../nav/linkGenerator.jsx");
//var junctionCount=require('./junctionCount.jsx');
//var WebUtils=require('../../../utils/WebAPIUtils.js');
var getContent = require("./getContent.jsx");
var global = require("../../../utils/global.js");
var Link = require("react-router").Link;
var browserHistory = require("react-router").browserHistory;
/**
 * recordId
 * schema
 * rootSchema
 * record
 */
var CardLayout = React.createClass({
  /*getInitialState:function(){
		return ({follow:"Follow",like:"Like",prevLike:null,prevFollow:null});
	},
	shouldComponentUpdate: function(nextProps, nextState) {
  		return (JSON.stringify(this.state)!= JSON.stringify(nextState));
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
/*	saveDoc:function(doc){
		if(typeof common.getUserDoc().recordId != "undefined"){
			{/*if(doc.docType=="Follow" && (this.state.prevFollow==null || (new Date() - this.state.prevFollow) >10000)){
				var newFollowStatus="Following";
				if(this.state.follow=="Follow"){
					newFollowStatus="Following";
					this["follow_button"].className=" name fa fa-rss";
				}else{
					newFollowStatus="Follow";
					this["follow_button"].className=" fa fa-rss";
				}
				this.setState({follow:newFollowStatus,prevFollow:new Date()},function(){
					ActionCreator.createJunction(doc);
				})
			}
			if(doc.docType=="Like" && (this.state.prevLike==null || (new Date() - this.state.prevLike)>10000)){
				var newLikeStatus="Liked";
				if(this.state.like=="Like"){
					newLikeStatus="Liked";
					this["like_button"].className=" name fa fa-thumbs-up";
				}else{
					newLikeStatus="Like";
					this["like_button"].className="fa fa-thumbs-o-up";
				}
				this.setState({like:newLikeStatus,prevLike:new Date()},function(){
					ActionCreator.createJunction(doc);
				})
			}
		}
	},*/
  viewRecord: function() {
    if (typeof this.props.fromRelation == "undefined") {
      //	var schema=this.props.schema;
      var org = this.props.org;
      var recordId = this.props.recordId;
      var rootSchema = this.props.rootSchema;
      var dependentSchema = this.props.dependentSchema;
      trackThis("View record detail", {
        org: org,
        schema: rootSchema,
        recordId: recordId
      });
      //  common.clearMainContent();common.clearLeftContent();
      browserHistory.push(
        linkGenerator.getDetailLink({
          record: this.props.record,
          org: org,
          schema: rootSchema,
          recordId: recordId,
          dependentSchema: dependentSchema,
          filters: this.props.filters
        })
      );
    }
  },
  componentDidMount: function() {
    //ActionCreator.getRelatedCount(this.props.recordId,"likedBy");
    //ActionCreator.getRelatedCount(this.props.recordId,"followedBy");
    //var self=this;
    /*if(typeof common.getUserDoc().recordId != "undefined"){
			WebUtils.doPost("/generic?operation=checkRelated",{"recordId":common.getUserDoc().recordId,
			"relatedRecordId":this.props.recordId,
			"relationName":"isLiking"
			,
										"docType":"Like",
										"likeFor":this.props.recordId,
										"likedBy":common.getUserDoc().recordId},function(data){
				if(data.result=="related"){
          if(self["like_button"]){
					     self.setState({like:"Liked"});
          }
					try{
					self["like_button"].className=" fa fa-thumbs-up name";
					}catch(err){}
				}
			},true);
			{/*WebUtils.doPost("/generic?operation=checkRelated",{"recordId":common.getUserDoc().recordId,
			"relatedRecordId":this.props.recordId,
			"relationName":"isFollowing",
			"docType":"Follow",
								"followee":this.props.recordId,
								"follower":common.getUserDoc().recordId},function(data){
				if(data.result=="related"){
					self.setState({follow:"Following"});
					try{
					self["follow_button"].className=" name fa fa-rss";
					}catch(err){}
				}
			},true)}

		}*/
    this.componentDidUpdate();
    common.updateErrorImages();
  },
  componentDidUpdate: function() {
    for (var i = 0; i < $("[data-onmouseover]").length; i++) {
      $($("[data-onmouseover]")[i]).attr(
        "onmouseover",
        $($("[data-onmouseover]")[i]).attr("data-onmouseover")
      );
    }
    for (var i = 0; i < $("[data-onmouseout]").length; i++) {
      $($("[data-onmouseout]")[i]).attr(
        "onmouseout",
        $($("[data-onmouseout]")[i]).attr("data-onmouseout")
      );
    }
    for (var i = 0; i < $("[data-onclick]").length; i++) {
      $($("[data-onclick]")[i]).attr(
        "onclick",
        $($("[data-onclick]")[i]).attr("data-onclick")
      );
    }
  },

  detail: function() {
    browserHistory.push(
      linkGenerator.getDetailLink({
        record: this.props.record,
        org: this.props.org,
        schema: this.props.rootSchema,
        recordId: this.props.recordId,
        dependentSchema: this.props.dependentSchema,
        filters: this.props.filters
      })
    );
  },
  render: function() {
    var self = this;
    var recordId = this.props.recordId;
    var record = this.props.record;
    var schema = SchemaStore.get(self.props.rootSchema);
    var profileImage = "";
    var locality = "";
    var country = "";
    var about = "";
    var images = [];
    var card = this.props.fullLayout.layout;
    var css = this.props.fullLayout.css;
    var profileAlt = "";
    try {
      if (record[card.profileImage][0].cloudinaryId) {
        profileImage = record[card.profileImage][0].cloudinaryId;
        profileAlt = record[card.profileImage][0].caption;
      } else {
        profileImage = "default-user";
        profileAlt = "Default user";
      }
    } catch (err) {
      profileImage = "default-user";
      profileAlt = "Default user";
    }
    if (profileImage.indexOf("http") != 0) {
      profileImage =
        "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1441279368/" +
        profileImage +
        ".jpg";
      //profileImage="//res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1623462816/"+profileImage+".jpg";
    }
    if (card.images) {
      if (record[card.images] && record[card.images].length > 0) {
        images.push(record[card.images]);
      } else {
        var image = [];
        image.push("image");
        images.push(image);
      }
    }

    /*** changing to allow all datatypes except images for name about address ***/

    var cardData = {};
    cardData["address"] = card.address;
    cardData["name"] = card.name;
    cardData["about"] = card.about;
    var recordData = {};
    var identifier = "";
    var textArea = false;
    Object.keys(cardData).forEach(function(data) {
      recordData[data] = {};
      if (schema["@identifier"] == cardData[data]) {
        if (self.props.noDetail) {
          recordData[data]["identifier"] = "JavaScript:void(0)";
        } else {
          recordData[data]["identifier"] =
            "" +
            linkGenerator.getDetailLink({
              record: record,
              org: self.props.org,
              schema: self.props.rootSchema,
              recordId: self.props.recordId,
              dependentSchema: self.props.dependentSchema,
              filters: self.props.filters
            });
        }
      }
      if (typeof cardData[data] == "object") {
        recordData[data]["value"] = "";
        cardData[data][Object.keys(cardData[data])[0]].map(function(
          obj,
          index
        ) {
          var comma = ", ";
          if (
            cardData[data][Object.keys(cardData[data])[0]].length - 1 ==
            index
          ) {
            comma = "";
          }
          try {
            recordData[data]["value"] +=
              self.props.record[Object.keys(cardData[data])[0]][
                cardData[data][Object.keys(cardData[data])[0]][index]
              ] + comma;
          } catch (err) {
            console.log("error while reading card values");
          }
        });
        /*Object.keys(cardData[data]).map(function(obj){
    					recordData[data]["value"]=obj+" ";
    				})*/
      } else if (
        schema["@properties"] &&
        schema["@properties"][cardData[data]] &&
        schema["@properties"][cardData[data]]["dataType"] &&
        schema["@properties"][cardData[data]]["dataType"].type == "textarea"
      ) {
        try {
          var about1 = record[cardData[data]].substr(0, 280);
          var about2 = record[cardData[data]].substr(
            280,
            record[cardData[data]].length
          );
          if (about2.length > 0) {
            recordData[data]["value"] =
              "<div>" +
              '<input type="checkbox" class="read-more-state" id=' +
              recordId +
              " />" +
              '<p class="read-more-wrap no-margin">' +
              about1 +
              '<span class="read-more-target">' +
              about2 +
              "</span></p>" +
              "<label for=" +
              recordId +
              ' class="read-more-trigger morelink link"></label></div>';
          } else {
            recordData[data]["value"] =
              '<div><p class="no-margin">' + about1 + "</p></div>";
          }
          recordData[data]["textArea"] = true;
        } catch (err) {
          console.log("error while reading card values");
        }
      } else {
        if (typeof record[cardData[data]] == "object") {
          var temp = "";
          for (var key in record[cardData[data]]) {
            if (
              typeof record[cardData[data]][key] == "string" &&
              record[cardData[data]][key].trim() != ""
            )
              temp += record[cardData[data]][key].trim() + ", ";
          }
          temp = temp.replace(/,\s$/, ".");
          recordData[data]["value"] = temp;
        } else {
          recordData[data]["value"] = record[cardData[data]];
        }
      }

      /*** assigning css **/

      if (
        (css &&
          Object.keys(css).length > 0 &&
          css[cardData[data]] != "" &&
          css[cardData[data]] != undefined) ||
        (typeof cardData[data] == "object" &&
          css[Object.keys(cardData[data])[0]] != undefined &&
          css[Object.keys(cardData[data])[0]] != "")
      ) {
        var allStyles = {};
        if (typeof cardData[data] == "object") {
          allStyles = getContent.getStyleFromConfig(
            css[Object.keys(cardData[data])[0]]
          );
        } else {
          allStyles = getContent.getStyleFromConfig(css[cardData[data]]);
        }
        recordData[data]["css"] = {};
        recordData[data]["css"]["normal"] = allStyles.normal;
        if (schema["@identifier"] == data) {
          recordData[data]["css"]["onMouseOver"] = allStyles.mouseOver;
          recordData[data]["css"]["onMouseOut"] = allStyles.mouseOut;
          recordData[data]["css"]["onClick"] = allStyles.click;
        }
      }
    });
    /*
    if(card.address && record[card.address]){
      locality=record[card.address].addressLocality;
      country=record[card.address].addressCountry;
    }
    if(card.about && record[card.about]){
      var about1=record[card.about].substr(0,140);
      var about2=record[card.about].substr(140,(record[card.about]).length);
      if(about2.length >0){
	      about=('<div>'+
	  			'<input type="checkbox" class="read-more-state" id='+recordId+' />'+
	  			'<p class="read-more-wrap no-margin">'+about1+'<span class="read-more-target">'+about2+'</span></p>'+
			  	'<label for='+recordId+ ' class="read-more-trigger morelink link"></label></div>');
		}else{
			about=('<div><p class="no-margin">'+about1+'</p></div>');
		}
    }
    */

    /*var linkToRecord="";
     if(self.props.from && self.props.from=="lookUpPopup"){
     	linkToRecord= <h5 itemProp="name" className="remove-margin-bottom" ><span className="orgName">{record[card.name]}</span></h5>
     }else{
          linkToRecord=( <Link   to={linkGenerator.getDetailLink({record:record,
     															org:this.props.org,schema:this.props.rootSchema,
     															recordId:this.props.recordId,
     															dependentSchema:this.props.dependentSchema,
     															filters:this.props.filters})}>{/* onClick={self.viewRecord}
    	                         <h5 itemProp="name" className="remove-margin-bottom" ><span className="orgName">{record[card.name]}</span></h5>
    	                     </Link>)
	    //linkToRecord= <h5 onClick={self.viewRecord} itemProp="name" className="remove-margin-bottom" ><span className="orgName">{record[card.name]}</span></h5>
     }*/
    // <span dangerouslySetInnerHTML={{__html:about }} />
    return (
      <div className="row no-margin">
        <div className="col-lg-2 col-md-2 col-sm-6 col-xs-12 no-padding-left  ">
          <div className="row remove-margin-right remove-margin-left form-group ">
            <div className="row no-margin" style={{ paddingBottom: "8px" }}>
              <img
                src={profileImage}
                alt={profileAlt}
                title={profileAlt}
                onClick={this.detail}
                className="pull-left   img-holder profilePicture100"
              />
            </div>
            <div className="row pointer no-margin ">
              {recordData["name"]["textArea"] != undefined &&
              recordData["name"]["textArea"] ? (
                <Link
                  key={global.guid()}
                  className={
                    recordData["name"]["identifier"] != undefined
                      ? ""
                      : "cardAnchor"
                  }
                  style={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].normal
                  }
                  data-onmouseover={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].onMouseOver
                  }
                  data-onmouseout={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].onMouseOut
                  }
                  data-onclick={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].onClick
                  }
                  to={
                    recordData["name"]["identifier"] != undefined
                      ? "" + recordData["name"]["identifier"]
                      : "JavaScript:void(0)"
                  }
                >
                  <span itemProp={"name"}>{recordData["name"]["value"]}</span>
                </Link>
              ) : (
                <Link
                  className={
                    recordData["name"]["identifier"] != undefined
                      ? ""
                      : "cardAnchor"
                  }
                  style={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].normal
                  }
                  data-onmouseover={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].onMouseOver
                  }
                  data-onmouseout={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].onMouseOut
                  }
                  data-onclick={
                    recordData["name"]["css"] &&
                    recordData["name"]["css"].onClick
                  }
                  to={
                    recordData["name"]["identifier"] != undefined
                      ? "" + recordData["name"]["identifier"]
                      : "JavaScript:void(0)"
                  }
                >
                  <span itemProp={"name"}>{recordData["name"]["value"]}</span>{" "}
                </Link>
              )}
            </div>
          </div>

          {/*<div className="row remove-margin-right remove-margin-left form-group ">
	               		<div className="col-lg-5 col-md-5 col-sm-5 col-xs-4 no-padding-left" >
	                    	<img src={profileImage} alt={profileAlt}  title={profileAlt} className="pull-left   img-holder profilePicture"/>
	                	</div>
	                	<div className="col-lg-7 col-md-7 col-sm-7 col-xs-8 no-padding-left">
	                		<div className="row pointer no-margin ">
	                			{
		            		  		(recordData["name"]["textArea"]!=undefined && recordData["name"]["textArea"])?(
		            			   		<Link  key={global.guid()} className={recordData["name"]["identifier"]!=undefined?"":"cardAnchor"}
		            					  	style={recordData["name"]["css"] && recordData["name"]["css"].normal}
			          			  			data-onmouseover={recordData["name"]["css"] && recordData["name"]["css"].onMouseOver}
			          			  			data-onmouseout={recordData["name"]["css"] && recordData["name"]["css"].onMouseOut}
			          			  			data-onclick={recordData["name"]["css"] && recordData["name"]["css"].onClick}
		            			  			 to={recordData["name"]["identifier"]!=undefined?""+recordData["name"]["identifier"]:"JavaScript:void(0)"}>
					  	                   <span itemProp={"name"}>{recordData["name"]["value"]}</span>
						            	</Link>):(
						                	<Link className={recordData["name"]["identifier"]!=undefined?"":"cardAnchor"}
		            			  				style={recordData["name"]["css"] && recordData["name"]["css"].normal}
		            			  				data-onmouseover={recordData["name"]["css"] && recordData["name"]["css"].onMouseOver}
		            			  				data-onmouseout={recordData["name"]["css"] && recordData["name"]["css"].onMouseOut}
		            			  				data-onclick={recordData["name"]["css"] && recordData["name"]["css"].onClick}
		            			  			 	to={recordData["name"]["identifier"]!=undefined?""+recordData["name"]["identifier"]:"JavaScript:void(0)"}>
		            			  			 	<span  itemProp={"name"}>{recordData["name"]["value"]}</span> </Link>
		            		  			)

		              			}
				                  <div  itemProp="location" className="remove-margin-top">
				                  	{
					   	            	  (recordData["address"]["textArea"]!=undefined && recordData["address"]["textArea"])?(
					   	            			   <Link  className={recordData["address"]["identifier"]!=undefined?"":"cardAnchor"}
					   	            			  		style={recordData["address"]["css"] &&  recordData["address"]["css"].normal}
					   	            			  		data-onmouseover={recordData["address"]["css"] && recordData["address"]["css"].onMouseOver}
					   	            			  		data-onmouseout={recordData["address"]["css"] && recordData["address"]["css"].onMouseOut}
					   	            			  		data-onclick={recordData["address"]["css"] &&  recordData["address"]["css"].onClick}
					   	            			  		 to={recordData["address"]["identifier"]!=undefined?recordData["address"]["identifier"]:"JavaScript:void(0)"}>
					   				  	                   <span dangerouslySetInnerHTML={{__html:recordData["address"]["value"] }} />
					   					        </Link>):( <Link className={recordData["address"]["identifier"]!=undefined?"":"cardAnchor"}
					   	            			  		style={recordData["address"]["css"] && recordData["address"]["css"].normal}
					   	            			  		data-onmouseover={recordData["address"]["css"] && recordData["address"]["css"].onMouseOver}
					   	            			  		data-onmouseout={recordData["address"]["css"] && recordData["address"]["css"].onMouseOut}
					   	            			  		data-onclick={recordData["address"]["css"] && recordData["address"]["css"].onClick}
					   	            			  		 to={recordData["address"]["identifier"]!=undefined?recordData["address"]["identifier"]:"JavaScript:void(0)"}>{recordData["address"]["value"]} </Link>
					   	            			 )
					   	            }
				                  </div>
	                		</div>
			                {
				               (self.props.fullLayout.systemRelations=="Yes")?(
				                		<div className="row no-margin">
								                  	<div className="display-inline-block ">
								                  		<span  onClick={self.follow}  ref={(e)=>{self.follow_button=e}} className="fa fa-rss">&nbsp;</span>
								                  		<span ref={(e)=>{self.followCount=e}}><junctionCount.JunctionCount recordId={self.props.recordId} relationName="followedBy"/></span>
								                  		&nbsp;&nbsp;
								                  </div>
													<div className="display-inline-block">
														<span  ref={(e)=>{self.like_button=e}} onClick={self.like} className="fa fa-thumbs-o-up">&nbsp;</span>
														<span ref={(e)=>{self.likeCount=e}}><junctionCount.JunctionCount recordId={self.props.recordId} relationName="likedBy"/></span>
														&nbsp;&nbsp;
													</div>
								                </div>):(<div className="hidden"></div>)
		                	}
	              		</div>
	            	</div>
	  	               {
	  	               		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group ">
	  	               			<button className="btn btn-xs btn-default relation-button" type="button">
	      							Contact
	      						</button>
	  						</div>
	  			        }*/}
        </div>
        <div className="col-lg-10 col-md-10 col-sm-10 col-xs-12 no-padding-left margin-bottom-gap-sm mobile-padding-left">
          <div itemProp="description" className="row no-margin">
            <ul className="list-unstyled">
              <li>
                {recordData["about"]["textArea"] != undefined &&
                recordData["about"]["textArea"] ? (
                  <a
                    className={
                      recordData["about"]["identifier"] != undefined
                        ? ""
                        : "cardAnchor"
                    }
                    style={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].normal
                    }
                    data-onmouseover={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].onMouseOver
                    }
                    data-onmouseout={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].onMouseOut
                    }
                    data-onclick={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].onClick
                    }
                    to={
                      recordData["about"]["identifier"] != undefined
                        ? recordData["about"]["identifier"]
                        : "JavaScript:void(0)"
                    }
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: recordData["about"]["value"]
                      }}
                    />
                  </a>
                ) : (
                  <a
                    className={
                      recordData["about"]["identifier"] != undefined
                        ? ""
                        : "cardAnchor"
                    }
                    style={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].normal
                    }
                    data-onmouseover={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].onMouseOver
                    }
                    data-onmouseout={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].onMouseOut
                    }
                    data-onclick={
                      recordData["about"]["css"] &&
                      recordData["about"]["css"].onClick
                    }
                    to={
                      recordData["about"]["identifier"] != undefined
                        ? recordData["about"]["identifier"]
                        : "JavaScript:void(0)"
                    }
                  >
                    {recordData["about"]["value"]}{" "}
                  </a>
                )}
              </li>
            </ul>
          </div>
          {["a"].map(function(temp) {
            if (Array.isArray(images) && Array.isArray(images[0])) {
              return images[0].map(function(image, index) {
                // var image=JSON.parse(JSON.stringify(imagejson));
                var imagePath = "";
                if (index < 3)
                  if (image.cloudinaryId) {
                    if (image.cloudinaryId.indexOf("http") != 0) {
                      //image.cloudinaryId="//res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1623462816"+image.cloudinaryId+".jpg";
                      imagePath =
                        "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_250/v1441279368/" +
                        image.cloudinaryId +
                        ".jpg";
                    }
                    return (
                      <div
                        itemProp="image"
                        key={global.guid()}
                        className="col-lg-4 col-md-4 col-sm-6 col-xs-6 form-group no-padding-left "
                      >
                        <div className="thumbnail-picture  img-holder ">
                          <div
                            className="img  "
                            style={{
                              backgroundImage: "url('" + imagePath + "')"
                            }}
                          />
                        </div>
                      </div>
                    );
                  } else {
                    var defaultImg =
                      "//res.cloudinary.com/dzd0mlvkl/image/upload/v1441279368/" +
                      "default_image" +
                      ".jpg";
                    return (
                      <div
                        key={global.guid()}
                        className="col-lg-4 col-md-4 col-sm-6 col-xs-6 form-group no-padding-left"
                      >
                        <div className="thumbnail-picture  img-holder ">
                          <div
                            className="img"
                            style={{
                              backgroundImage: "url('" + defaultImg + "')"
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
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
exports.CardLayout = CardLayout;
