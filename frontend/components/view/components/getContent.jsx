/**
 *
 * recordId
 * schema
 * rootSchema
 * record
 *
 */
var React = require("react");
var ReactDOM = require("react-dom");
var SchemaStore = require("../../../stores/SchemaStore");
var common = require("../../common.jsx");
var linkGenerator = require("../../nav/linkGenerator.jsx");
var genericView = require("../genericView.jsx");
var getURLContent = require("./getURLContent.jsx");
//var socialShare=require('./socialShare.jsx');
var rating = require("./rating.jsx");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var ImageGallery = require("./carousel.jsx").ImageGallery;
//var Carousel = require('./carousel.jsx').Carousel;
var defineRecordLayout = require("../../admin/defineRecordLayout.jsx");
var utility = require("../../Utility.jsx");
var global = require("../../../utils/global.js");
var Link = require("react-router").Link;
var browserHistory = require("react-router").browserHistory;
var imageTagging = require("./imageTagging.jsx");
var Editor = require("../../records/richTextEditor.jsx").MyEditor;
//var WebUtils=require("../../../utils/WebAPIUtils.js");

var GetContent = React.createClass({
  viewRecord: function() {
    if (typeof this.props.fromRelation == "undefined") {
      if (!this.props.noDetail) {
        //if(tracking is enabled on this method in schema)
        //trackThis("View record",{org:this.props.org,schema:this.props.rootSchema,recordId:this.props.recordId});
        browserHistory.push(this.getDetailLink());
        return;
      }
    }
  },
  getDetailLink: function() {
    var temp = genericView.getProxyLink(
      this.props.fullLayout,
      this.props.fullRecord
    );
    if (temp) {
      return temp;
    }
    return linkGenerator.getDetailLink({
      recordId: this.props.recordId,
      record: this.props.fullRecord ? this.props.fullRecord : this.props.record,
      org: this.props.org,
      schema: this.props.rootSchema,
      dependentSchema: this.props.dependentSchema,
      filters: this.props.filters
    });
  },
  componentDidMount: function() {
    this.tabChecking();
    this.componentDidUpdate();
  },
  tabChecking: function() {
    var record = this.props.fullRecord;
    var key = this.props.property;
    var self = this;
    if (self.props.tabData != undefined && self.props.showTab != undefined)
      if (typeof record == "object" && Object.keys(record).length > 0) {
        if (record[key])
          if (Array.isArray(record[key]) && record[key].length != 0) {
            self.props.showTab(self.props.tabData);
          } else if (
            typeof record[key] == "object" &&
            Object.keys(record[key]).length != 0
          ) {
            for (var innerKey in record[key]) {
              if (record[key][innerKey]) {
                self.props.showTab(self.props.tabData);
                break;
              }
            }
          } else if (record[key] != "" && record[key] != undefined) {
            self.props.showTab(self.props.tabData);
          }
      } /*else if(record!="" && record!=undefined){
			self.props.showTab(self.props.tabData);
		}*/
	},
	componentDidUpdate:function(){
		common.updateErrorImages();
		/*for(var i=0;i<$("[data-onmouseover]").length;i++){
			$($("[data-onmouseover]")[i]).attr("onmouseover",$($("[data-onmouseover]")[i]).attr("data-onmouseover"));
		}
		for(var i=0;i<$("[data-onmouseout]").length;i++){
			$($("[data-onmouseout]")[i]).attr("onmouseout",$($("[data-onmouseout]")[i]).attr("data-onmouseout"));
		}
		for(var i=0;i<$("[data-onclick]").length;i++){
			$($("[data-onclick]")[i]).attr("onclick",$($("[data-onclick]")[i]).attr("data-onclick"));
		}*/
	},
	componentWillUnmount:function(){
	},
	makeCall:function(fromUserId, toUserId){
		/*var self = this;
		fromUserId=common.getUserDoc().recordId;
		toUserId=this.props.recordId;
		this.phone.style.pointerEvents='none';
		if(fromUserId && toUserId){
			WebUtils.doPost("/callService?operation=makeACall",{from:fromUserId, to:toUserId},function(result){
				self.phone.style.pointerEvents='';
				if(result.error){
					alert(JSON.stringify(result));
				}else{
					alert(JSON.stringify(result));
				}
			});
		}*/
  },
  handleImagePopUp: function(image,imageDesc) {
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
      "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    if (this.props.schemaDoc && this.props.schemaDoc["@imageAnnotations"]) {
      ReactDOM.render(
        <common.GenericPopUpComponent
          popUpId={popUpId}
          contentDivId={contentDivId}
          alignMiddleDiv={true}
          sideDivId={sideDivId}
          noSideDiv={true}
        />,
        node
      );
      ReactDOM.render(
        <CanvasImage
          image={image}
          property={this.props.property}
          callbackToClosePopup={function(newRec) {
            common.showMainContainer();
            node.remove();
          }}
          recordId={this.props.recordId}
          schema={this.props.rootSchema}
        />,
        document.getElementById(contentDivId)
      );
      return;
    }
    var schema = this.getRenderSchema();
    if (
      schema &&
      schema["@tagging"] &&
      schema["@tagging"].relation &&
      schema["@tagging"].relation != "" &&
      schema["@relations"] &&
      schema["@relations"][schema["@tagging"].relation]
    ) {
      var taggingRelation = schema["@relations"][schema["@tagging"].relation];
      ReactDOM.render(
        <common.GenericPopUpComponent
          popUpId={popUpId}
          contentDivId={contentDivId}
          alignMiddleDiv={true}
          sideDivId={sideDivId}
          noSideDiv={true}
        />,
        node
      );
      ReactDOM.render(
        <imageTagging.TagImage
          org={this.props.org}
          recordId={this.props.recordId}
          imageUrl={image}
          rootSchema={this.props.rootSchema}
          relation={taggingRelation}
        />,
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
        <img src={image} alt={imageDesc} title={imageDesc} className="img-responsive" />,
        document.getElementById(contentDivId)
      );
    }
    //if(!this.props.noDetail){
  },
  getRenderSchema: function() {
    if (typeof this.props.schemaDoc == "object") {
      return this.props.schemaDoc;
    }
    var schema = SchemaStore.get(this.props.rootSchema);
    if (this.props.dependentSchema) {
      var dsRec = SchemaStore.get(
        this.props.rootSchema + "-" + this.props.dependentSchema
      );
      if (dsRec) {
        schema = genericView.combineSchemas(schema, dsRec);
      }
    }
    return schema;
  },
  getDndImage: function(image, data) {
    if (typeof image.udf == "undefined") {
      image["udf"] = {};
    }
    var temp = {};
    temp["url"] = imagePath(
      image,
      data.schema["@properties"][data.key].dataType,
      500
    ); //imageJson.cloudinaryId;
    temp["id"] = imagePath(
      image,
      data.schema["@properties"][data.key].dataType,
      500
    ); //imageJson.cloudinaryId;
    temp["caption"] = getImageDesc(image,data.schema,this.props.fullRecord);
    return (
      <div
        key={global.guid()}
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 "
        style={{ padding: "4% 8%", marginTop: "4%", background: "#f2f2f2" }}
      >
        <div
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
          style={{ overflow: "hidden" }}
        >
          <img
            src={temp.url}
            alt={temp.caption ? temp.caption : ""}
            title={temp.caption ? temp.caption : ""}
            className="img-responsive grow"
            onClick={this.handleImagePopUp.bind(null, temp.id,temp.caption)}
          />
        </div>
        {Object.keys(image.udf).map(function(property, index) {
          return (
            <div
              key={global.guid()}
              className={
                (index < Object.keys(image.udf) - 1 ? "form-group " : "") +
                data.divType
              }
              title={data.description}
            >
              <div
                className={
                  "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding uppercase "
                }
              >
                <span
                  className="remove-margin-bottom text-uppercase "
                  style={{ fontSize: "10px" }}
                >
                  {property}
                </span>
              </div>
              <div
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                style={data.styleFromConfig}
                itemProp={data.itemProp}
              >
                {image["udf"][property]}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
  render: function() {
    var self = this;
    var record = this.props.fullRecord;
    var schema = this.getRenderSchema();
    var linkRel = ""; //"nofollow";
    if (
      typeof this.props.fullRecord != "undefined" &&
      this.props.fullRecord.webCrawlerIndex
    ) {
      linkRel = "";
    }
    var divType = "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left";
    if (this.props.divType != undefined) {
      divType = this.props.divType;
    }
    if (typeof record != "object" && typeof schema != "object") {
      return <div />;
    }
    var propertyDef;
    var classNames = "";
    var displayNameVisibility = "";
    if (
      (this.props.displayName &&
        (this.props.displayName == "no" || this.props.displayName == "No")) ||
      (typeof self.props.showDisplayNames != "undefined" &&
        self.props.showDisplayNames == false)
    ) {
      displayNameVisibility = " hidden";
      classNames =
        "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-xs";
    }

    var metaKeys = [
      "docType",
      "id",
      "identifier",
      "filterKeys",
      "requiredKeys",
      "recordId",
      "primaryKey",
      "revision",
      "revison",
      "relationDesc",
      "@uniqueUserName"
    ];
    var key = this.props.property;
    if (
      metaKeys.indexOf(key) > -1 ||
      record[key] == "" ||
      record[key] == null ||
      record[key] === undefined
    ) {
      return <div />;
    }

    var dataType = "";
    var description = "";
    var displayName = "";
    var itemProp = "";
    var GointoDetail = "";
    if (self.props.fromArray && self.props.fromArray == "array") {
      dataType = self.props.dataType;
    } else {
      try {
        if (typeof schema["@properties"][key] != "undefined") {
          dataType = schema["@properties"][key].dataType.type;
          if (
            dataType == "formula" &&
            schema["@properties"][key].dataType.resultType
          ) {
            dataType = schema["@properties"][key].dataType.resultType;
          }
          description = schema["@properties"][key].description;
          displayName = schema["@properties"][key].displayName;
          itemProp = schema["@properties"][key].itemProp
            ? schema["@properties"][key].itemProp
            : "";
          propertyDef = schema["@properties"][key];
        } else if (typeof schema["@sysProperties"][key] != "undefined") {
          dataType = schema["@sysProperties"][key].dataType.type;
          description = schema["@sysProperties"][key].description;
          displayName = schema["@sysProperties"][key].displayName;
          itemProp = schema["@sysProperties"][key].itemProp
            ? schema["@sysProperties"][key].itemProp
            : "";
          propertyDef = schema["@sysProperties"][key];
        } else if (key == "$status") {
          if (
            schema["@metaData"] &&
            schema["@metaData"][key] &&
            schema["@metaData"][key].displayName
          ) {
            displayName = schema["@metaData"][key].displayName;
          } else {
            displayName = "STATUS";
          }

          description = "STATUS";
        } else {
          console.log("error", record[key], key);
          return <div className="hidden noMinWidth" />;
        }
      } catch (err) {}
      
      /*if (
        schema["@identifier"] &&
        schema["@identifier"] == key && //|| dataType!="object" || dataType!="textarea"
        !self.props.noDetail
      ) */
      if( 
      	((schema["@identifier"] && schema["@identifier"] == key) || 
        ( dataType!="object" || dataType!="textarea"))&&
        !self.props.noDetail ){
        GointoDetail = self.viewRecord;
      }
    }

    var styleFromConfig = {};
    var onMouseOver = "";
    var onMouseOut = "";
    var onClick = "";
    var styleName = "";

    /***adding css ***/
    if (
      self.props.fullLayout &&
      self.props.fullLayout["css"] &&
      self.props.fullLayout["css"][key] != undefined &&
      dataType != "struct" &&
      dataType != "array"
    ) {
      styleName = self.props.fullLayout["css"][key];
    } else {
      styleName = "text";
    }

    var allStyles = getStyleFromConfig(styleName);
    styleFromConfig = allStyles.normal;
    if (schema["@identifier"] == key) {
      onMouseOver = allStyles.mouseOver;
      onMouseOut = allStyles.mouseOut;
      onClick = allStyles.click;
    }

    /**
     * If Struct styles defined in its parent schema
     */
    if (self.props.style) {
      styleFromConfig = self.props.style;
    }
    var tempRecord = {};
    var displayNameComponent = (
      <div
        className={
          "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding uppercase " +
          displayNameVisibility
        }
      >
        <span className="remove-margin-bottom propertyName ">
          {displayName}
        </span>
      </div>
    );
    //["text","tags","num","pickList","formula","email","time","number","autoNumber","date","dateTime","time","currency"].indexOf(dataType)>=-1
    if (
      dataType == "text" ||
      dataType == "tags" ||
      dataType == "num" ||
      dataType == "pickList" ||
      dataType == "formula" ||
      dataType == "email" ||
      dataType == "time" ||
      dataType == "number" ||
      dataType == "autoNumber" ||
      dataType == "date" ||
      dataType == "dateTime" ||
      dataType == "time" ||
      dataType == "currency"
    ) {
      var valueToDisplay = record[key];
      if (dataType == "date") {
        valueToDisplay = global.getLocaleDateString(valueToDisplay);
      }

      if (dataType == "tags" && Array.isArray(valueToDisplay)) {
        valueToDisplay = valueToDisplay.join(", ");
      }
      if (dataType == "currency") {
        //if(schema["@properties"][key] && schema["@properties"][key].dataType && schema["@properties"][key].dataType.currencyType)
        //valueToDisplay+=" "+schema["@properties"][key].dataType.currencyType;
        //valueToDisplay+= " INR (₹)";
        if (valueToDisplay.split(" ").length < 2) {
          valueToDisplay = "₹" + valueToDisplay;
        } else {
          try {
            valueToDisplay =
              valueToDisplay.split(" ")[2].replace(/\(|\)/g, "") +
              valueToDisplay.split(" ")[0];
          } catch (err) {
            valueToDisplay = record[key];
          }
        }
      }
      if (dataType == "number" && schema["@properties"][key].dataType.units) {
        valueToDisplay =
          record[key] + " " + schema["@properties"][key].dataType.units;
      }
      if (self.props.summary) {
        var name = valueToDisplay;
        if (name.length > 300) {
          name = valueToDisplay.substr(0, 300) + "...";
        }
        var tempLink = "";
        if (GointoDetail == "" || self.props.noDetail) {
          tempLink = (
            <div
              className={classNames}
              style={styleFromConfig}
              itemProp={itemProp}
            >
              <div className="extra-padding-right ellipsis">{name}</div>
            </div>
          );
        } else {
          tempLink = (
            <div
              className={classNames}
              style={styleFromConfig}
              itemProp={itemProp}
            >
              <div className="extra-padding-right ellipsis">
                <Link rel={linkRel} to={self.getDetailLink()}>
                  {name}
                </Link>
              </div>
            </div>
          );
        }
        return (
          <div
            key={global.guid()}
            className="row remove-margin-left remove-margin-right margin-bottom-gap-xs"
            title={description}
          >
            {displayNameComponent}
            {tempLink}
          </div>
        );
      } else {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
              style={styleFromConfig}
              itemProp={itemProp}
            >
              {valueToDisplay}
            </div>
          </div>
        );
      }
    } else if (dataType == "color") {
      var current = {};
      if (record[key].split(" ").length > 0) {
        current.hex = record[key].split(" ")[0];
      }
      if (record[key].split(" ").length > 1) {
        current.group = record[key].split(" ")[1];
      }
      if (record[key].split(" ").length > 2) {
        current.name = record[key].replace(current.hex, "").trim();
        current.name = current.name.replace(current.group, "").trim();
        if (!current.name) {
          current.name = current.group;
        }
      }
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
            itemProp={itemProp}
          >
            {GointoDetail == "" || self.props.noDetail ? (
              <div>
                <span
                  className="child-img-component"
                  style={{ backgroundColor: current.hex, padding: "10px" }}
                  title={current.name}
                />
                <span className="child-img-component extra-padding-left no-padding-right">
                  {current.name}
                </span>
              </div>
            ) : (
              <Link rel={linkRel} to={self.getDetailLink()}>
                <span
                  className="child-img-component"
                  style={{ backgroundColor: current.hex, padding: "10px" }}
                  title={current.name}
                />
                <span className="child-img-component extra-padding-left no-padding-right">
                  {current.name}
                </span>
              </Link>
            )}
          </div>
        </div>
      );
    } else if (dataType == "heading1") {
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
            itemProp={itemProp}
          >
            {GointoDetail == "" || self.props.noDetail ? (
              <h1 style={styleFromConfig} className="h1">
                {record[key]}
              </h1>
            ) : (
              <h1 style={styleFromConfig} className="h1">
                <Link rel={linkRel} to={self.getDetailLink()}>
                  {record[key]}
                </Link>
              </h1>
            )}
          </div>
        </div>
      );
    } else if (dataType == "heading2") {
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
            itemProp={itemProp}
          >
            {GointoDetail == "" || self.props.noDetail ? (
              <h2 style={styleFromConfig} className="h2">
                {record[key]}
              </h2>
            ) : (
              <h2 style={styleFromConfig} className="h2">
                <Link rel={linkRel} to={self.getDetailLink()}>
                  {record[key]}
                </Link>
              </h2>
            )}
          </div>
        </div>
      );
    } else if (dataType == "heading3") {
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
            itemProp={itemProp}
          >
            {GointoDetail == "" || self.props.noDetail ? (
              <h3 style={styleFromConfig} className="h3">
                {record[key]}
              </h3>
            ) : (
              <h3 style={styleFromConfig} className="h3">
                <Link rel={linkRel} to={self.getDetailLink()}>
                  {record[key]}
                </Link>
              </h3>
            )}
          </div>
        </div>
      );
    } else if (dataType == "textarea") {
      var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[{};:'".,<>?Â«Â»â€œâ€�â€˜â€™]|\]|\?))/gi;
      var text = record[key];
      var urlfind = "";
      var allURIs = text.match(uri_pattern);
      var textToShow = record[key];
      var newline = String.fromCharCode(13, 10);
      var tab = String.fromCharCode(9);
      textToShow = textToShow.replace(/\\n/g, newline);
      textToShow = textToShow.replace(/\\t/g, tab);
      if (allURIs && allURIs.length > 0) {
        urlfind = <getURLContent.GetURLContent url={allURIs[0]} />;
        textToShow = textToShow.replace(allURIs[0], "");
      }

      var stringCount = 20;
      var moreFlag = false;
      var summaryFlag = false;
      if (
        self.props.fullLayout &&
        self.props.fullLayout.textArea &&
        self.props.fullLayout.textArea[key]
      ) {
        stringCount = self.props.fullLayout.textArea[key]; // adding more or less to textarea at schema level;
        moreFlag = true;
      }
      if (self.props.summary || self.props.audit) {
        moreFlag = true;
        summaryFlag = true;
      }
      if (moreFlag) {
        var about1 = textToShow
          .split(" ")
          .splice(0, stringCount * 1)
          .join(" ");
        var about2 =
          " " +
          textToShow
            .split(" ")
            .splice(stringCount * 1, textToShow.length)
            .filter(function(n) {
              return n != "" && n != undefined;
            })
            .join(" ");
        var abt = about2;
        var about = "";
        var link = "";
        if (summaryFlag && GointoDetail != "") {
          about2 =
            '<a  href="' +
            linkGenerator.getDetailLink({
              record: self.props.fullRecord
                ? self.props.fullRecord
                : self.props.record,
              org: self.props.org,
              schema: self.props.rootSchema,
              recordId: self.props.recordId
            }) +
            '">' +
            about2 +
            "</a>";
          about1 =
            '<a  href="' +
            linkGenerator.getDetailLink({
              record: self.props.fullRecord
                ? self.props.fullRecord
                : self.props.record,
              org: self.props.org,
              schema: self.props.rootSchema,
              recordId: self.props.recordId
            }) +
            '">' +
            about1 +
            "</a>";
        }
        if (abt.length > 1) {
          var recordId = global.guid();
          about =
            "<div>" +
            '<input type="checkbox" class="read-more-state" id=' +
            recordId +
            " />" +
            '<p class="read-more-wrap no-margin" >' +
            about1 +
            '<span class="read-more-target">' +
            about2 +
            "</span></p>" +
            "&nbsp;<label for=" +
            recordId +
            ' class="read-more-trigger morelink link"></label>' +
            "</div>";
        } else {
          about = '<div><p class="no-margin">' + about1 + "</p></div>";
        }
        textToShow = about;
      }
      if (summaryFlag) {
        return (
          <div
            key={global.guid()}
            className="row  remove-margin-left remove-margin-right"
            title={description}
          >
            {displayNameComponent}
            <div
              className={classNames + " margin-bottom-gap-sm "}
              style={styleFromConfig}
              itemProp={itemProp}
            >
              <div className="extra-padding-right">{urlfind}</div>
              <div className="extra-padding-right">
                <span dangerouslySetInnerHTML={{ __html: textToShow }} />
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding ">
              {urlfind}
            </div>
            {displayNameComponent}
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
              style={styleFromConfig}
              itemProp={itemProp}
            >
              {moreFlag ? (
                <span dangerouslySetInnerHTML={{ __html: textToShow }} />
              ) : (
                textToShow
              )}
            </div>
          </div>
        );
      }
    } else if (dataType == "phone") {
      if (schema["@properties"][key].mask == true) {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
              style={styleFromConfig}
              itemProp={itemProp}
            >
              <a href={"tel:" + record[key]} target={"_blank"}>
                <i
                  className="fa fa-phone pointer link"
                  onClick={self.makeCall}
                />&nbsp;&nbsp;
              </a>
            </div>
          </div>
        );
      } else {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12  text-area no-padding"
              style={styleFromConfig}
              itemProp={itemProp}
            >
              <a href={"tel:" + record[key]} target={"_blank"}>
                <i
                  className="fa fa-phone pointer link"
                  onClick={self.makeCall}
                />&nbsp;&nbsp;{record[key]}
              </a>
            </div>
          </div>
        );
      }
    } else if (dataType == "richText" || dataType == "richTextEditor") {
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          <Editor mode="view" content={record[key]} />
        </div>
      );
    } else if (dataType == "url") {
      var href = "";
      if (record[key].indexOf("http") != 0) {
        href = "http://" + record[key];
      } else {
        href = record[key];
      }
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div
            className={
              "col-lg-12 col-md-12 col-sm-12 col-xs-12  link no-padding"
            }
            style={styleFromConfig}
            itemProp={itemProp}
          >
            <a target="_blank" href={href}>
              {" "}
              {record[key]}
            </a>
          </div>
        </div>
      );
    } else if (dataType == "array") {
      var rootSchema = self.props.rootSchema;
      if (schema["@properties"][key].dataType.elements.type == "struct") {
        rootSchema = schema["@properties"][key].dataType.elements.structRef;
      }
      var detailLink = "" + self.getDetailLink();
      var flag = true;
      if (record[key]) {
        if (Array.isArray(record[key]) && record[key].length == 1) {
          flag = false;
          if (
            typeof record[key][0] == "object" &&
            !Array.isArray(record[key][0])
          ) {
            Object.keys(record[key][0]).forEach(function(innerData) {
              if (
                typeof record[key][0][innerData] != "undefined" &&
                record[key][0][innerData] != ""
              ) {
                flag = true;
              }
            });
          } else if (
            Array.isArray(record[key][0]) &&
            record[key][0].length > 0
          ) {
            flag = true;
          } else if (
            typeof record[key][0] != "undefined" &&
            record[key][0] != ""
          ) {
            flag = true;
          } else {
            //do nothing
          }
        }
      } else {
        flag = false;
      }
      if (self.props.audit) {
        return (
          <div>
            {(self.props.auditMessage ? self.props.auditMessage : "") + " "}
          </div>
        );
      } else if (flag) {
        var arrayView = undefined;
        if (self.props.fullLayout && self.props.fullLayout["arrayView"]) {
          arrayView = self.props.fullLayout["arrayView"];
        }
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
              <GetArrayContent
                summary={self.props.summary}
                handleImagePopUp={self.handleImagePopUp}
                noDetail={self.props.noDetail}
                arrayView={arrayView}
                detailLink={self.props.summary ? detailLink : ""}
                relatedSchemas={self.props.relatedSchemas}
                dependentSchema={self.props.dependentSchema}
                rootSchema={rootSchema}
                fullLayout={self.props.fullLayout}
                layout={schema["@properties"][key].layout}
                schemaDetail={schema["@properties"][key].dataType}
                keys={key}
                displayName={self.props.displayName}
                data={record[key]}
                fullRecord={self.props.fullRecord}
                recordId={self.props.recordId}
                org={self.props.org}
                methods={self.props.methods}
              />
            </div>
          </div>
        );
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "rating") {
      return (
        <div key={global.guid()} className={divType} title={description}>
          {displayNameComponent}
          <div
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
            onClick={GointoDetail}
            style={styleFromConfig}
            itemProp={itemProp}
          >
            <rating.RatingComponent
              properties={schema["@properties"][key]}
              data={record[key]}
            />
          </div>
        </div>
      );
    } else if (dataType == "multiPickList") {
      if (Array.isArray(record[key])) {
        var styleFromConfig1 = styleFromConfig;
        //	styleFromConfig1["whiteSpace"]="pre";
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
              style={styleFromConfig1}
            >
              {record[key].map(function(pickList) {
                return (
                  <span
                    className="pull-left"
                    key={global.guid()}
                    itemProp={itemProp}
                  >
                    {pickList} &nbsp;&nbsp;
                  </span>
                );
              })}
            </div>
          </div>
        );
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "struct" || key.indexOf(".") != -1) {
      var temp = {};
      var structRef = "";
      var data = {};
      if (key.indexOf(".") != -1) {
        var tempKey = key.substr(0, key.indexOf("."));
        var subKey = key.substr(key.indexOf(".") + 1, key.length);
        temp[tempKey] = {};
        try {
          temp[tempKey][subKey] = record[key][subKey];
        } catch (err) {
          temp[tempKey][subKey] = "";
        }
        structRef = schema["@properties"][tempKey].dataType.structRef;
        data = temp[tempKey];
      } else {
        temp[key] = record[key];
        structRef = schema["@properties"][key].dataType.structRef;
        data = temp[key];
      }
      var cnt = 0;
      if (
        record[key] != undefined ||
        (record[key] != "" && typeof record[key] == "object")
      ) {
        Object.keys(record[key]).forEach(function(temp) {
          if (record[key][temp] == "") {
            cnt++;
          }
        });
        if (cnt == Object.keys(record[key]).length) {
          displayNameComponent = "";
        }
      }
      delete data.org;
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
            {Object.keys(data).map(function(structKey) {
              return (
                <GetContent
                  key={global.guid()}
                  fullLayout={
                    self.props.fullLayout
                      ? self.props.fullLayout[key]
                      : undefined
                  }
                  showingForRelatedViewOfRecordId={
                    self.props.showingForRelatedViewOfRecordId
                  }
                  style={styleFromConfig}
                  property={structKey}
                  org={self.props.org}
                  noFormGroup={"yes"}
                  parentSchema={self.props.rootSchema}
                  rootSchema={structRef}
                  displayName={self.props.displayName}
                  fullRecord={data}
                  showDisplayNames={
                    schema["@properties"][key.split(".")[0]].dataType
                      .showDisplayNames
                  }
                />
              );
            })}
          </div>
        </div>
      );
    } else if (dataType == "image") {
      tempRecord = record[key];
      if (record[key] != "" && Array.isArray(tempRecord)) {
        if (self.props.audit) {
          return (
            <div>
              {(self.props.auditMessage ? self.props.auditMessage : "") +
                " Image"}
            </div>
          );
        } else if (self.props.summary) {
          return (
            <div
              key={global.guid()}
              className="row  remove-margin-left remove-margin-right"
              title={description}
            >
              {displayNameComponent}
              {tempRecord.map(function(imageJson, index) {
                if (index == 0 && imageJson.cloudinaryId) {
                  var imageurl = imagePath(imageJson,schema["@properties"][key].dataType,300,true,styleFromConfig);
                  var imageDesc = getImageDesc(imageJson,schema,self.props.fullRecord);

                  if (schema["@identifier"] != key && !self.props.summary) {
                    if (imageurl.indexOf("/facebook/") != -1) {
                      GointoDetail = self.handleImagePopUp.bind(null,"//res.cloudinary.com/dzd0mlvkl/image/facebook/" +imageJson.facebook +".jpg",imageDesc);
                    } else if (imageurl.indexOf("/gplus/") != -1) {
                      GointoDetail = self.handleImagePopUp.bind(null,"//res.cloudinary.com/dzd0mlvkl/image/gplus/" +imageJson.google +".jpg",imageDesc);
                    } else {
                      GointoDetail = self.handleImagePopUp.bind(null, imageurl,imageDesc);
                    }
                  }
                  if (true || 
                    self.props.parentLayout == "gallery" ||
                    self.props.childLayout == "gallery"
                  ) {
                    return (
                      <div
                        itemProp="image"
                        key={global.guid()}
                        className="display-inline-block extra-padding-right remove-zoom-padding"
                        onClick={GointoDetail}
                      >
                        <Link
                          rel={linkRel}
                          to={self.props.noDetail ? "" : self.getDetailLink()}
                        >
                          <img
                            className="img-responsive grow "
                            alt={imageDesc}
                            title={imageDesc}
                            src={imageurl}
                          />
                        </Link>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        itemProp="image"
                        key={global.guid()}
                        className="display-inline-block remove-zoom-padding"
                        onClick={GointoDetail}
                      >
                        <img
                          className="img-responsive grow extra-padding-right "
                          alt={imageDesc}
                          title={imageDesc}
                          src={imageurl}
                        />
                      </div>
                    );
                  }
                } else {
                  return (
                    <div key={global.guid()} className="hidden">
                      {" "}
                    </div>
                  );
                }
              })}
            </div>
          );
        } else {
          return (
            <div
              key={global.guid()}
              className={
                (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
              }
              title={description}
            >
              {record[key].map(function(imageJson, index) {
                var cols = "extra-padding-right";
                var imageDesc = getImageDesc(imageJson,schema,self.props.fullRecord);
                if (index == 0) {
                  return (
                    <div
                      key={global.guid()}
                      className={cols}
                      style={{ float: "left" }}
                    >
                      <img
                        itemProp={itemProp}
                        alt={imageDesc}
                        title={imageDesc}
                        src={imagePath(
                          imageJson,
                          schema["@properties"][key].dataType,
                          500,
                          false,
                          styleFromConfig
                        )}
                        className="img-responsive "
                        onClick={self.handleImagePopUp.bind(null,imagePath(imageJson,schema["@properties"][key].dataType,500),imageDesc)}
                      />
                    </div>
                  );
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              })}
            </div>
          );
        }
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "images") {
      tempRecord = record[key];
      if (record[key] != "" && Array.isArray(tempRecord)) {
        if (self.props.audit) {
          return (
            <div>
              {(self.props.auditMessage ? self.props.auditMessage : "") +
                " Images"}
            </div>
          );
        } else if (self.props.summary) {
          return (
            <div
              key={global.guid()}
              className="row  remove-margin-left remove-margin-right"
              title={description}
            >
              <div className={" uppercase " + displayNameVisibility}>
                <span className="remove-margin-bottom propertyName">
                  {displayName}
                </span>
              </div>
              {record[key].map(function(imageJson, index) {
                var imageurl = imagePath(imageJson,schema["@properties"][key].dataType,500,true);
                var imageDesc = getImageDesc(imageJson,schema,self.props.fullRecord);

                if (schema["@identifier"] != key) {
                  GointoDetail = self.handleImagePopUp.bind(null, imageurl,imageDesc);
                }
                if (
                  self.props.parentLayout == "gallery" ||
                  self.props.childLayout == "gallery"
                ) {
                  if (index == 0) {
                    return (
                      <div
                        itemProp="image"
                        key={global.guid()}
                        className="display-inline-block image-height remove-zoom-padding  "
                        onClick={GointoDetail}
                      >
                        <img
                          className="extra-padding-right grow"
                          alt={imageDesc}
                          title={imageDesc}
                          src={imageurl}
                        />
                      </div>
                    );
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                } else {
                  return (
                    <div
                      itemProp="image"
                      key={global.guid()}
                      className="display-inline-block margin-bottom-gap remove-zoom-padding"
                      onClick={GointoDetail}
                    >
                      <img
                        className="extra-padding-right grow"
                        alt={imageDesc}
                        title={imageDesc}
                        src={imageurl}
                      />
                    </div>
                  );
                }
              })}
            </div>
          );
        } else {
          var images = [];
          record[key].forEach(function(image) {
            var temp = {};
            temp["url"] = imagePath(image,schema["@properties"][key].dataType,500); //imageJson.cloudinaryId;
            temp["id"] = imagePath(image,schema["@properties"][key].dataType,500); //imageJson.cloudinaryId;
            temp["caption"] = getImageDesc(image,schema,self.props.fullRecord);
            images.push(temp);
          });
          var imgDisplayType = "Grid";
          var count = 4;
          try {
            imgDisplayType = self.props.fullLayout["imgDisplay"][key];
            if (imgDisplayType == "Grid") {
              count = 4;
            } else if (imgDisplayType == "Stack") {
              count = 1;
            }
          } catch (err) {}
          var cols = defineRecordLayout.calculateCols(count);
          return (
            <div
              key={global.guid()}
              className={
                (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
              }
              title={description}
            >
              <div className={cols + " uppercase " + displayNameVisibility}>
                <span className="remove-margin-bottom propertyName">
                  {displayName}
                </span>
              </div>
              <ImageDisplay
                cols={cols}
                imgDisplayType={imgDisplayType}
                images={images}
                click={self.handleImagePopUp}
              />
            </div>
          );
        }
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "object") {
      if (key == "author" || key == "editor" || key == "org") {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
              style={styleFromConfig}
            >
              <common.UserIcon
                rootSchema={schema["@sysProperties"][key].dataType.objRef}
                showingForRelatedViewOfRecordId={
                  self.props.showingForRelatedViewOfRecordId +
                  self.props.recordId
                }
                id={record[key]}
                formGroup={self.props.formGroup}
                org={self.props.org}
                noDetail={self.props.noDetail}
                fromRelation={
                  self.props.fromRelation || self.props.from || "innerContent"
                }
              />
            </div>
          </div>
        );
      } else {
        if (
          schema["@properties"][key].dataType.refKey == "recordId" ||
          schema["@properties"][key].dataType.refKeyType == "object"
        ) {
          var ObjectViewName = undefined;
          /*if(schema["@properties"][key].dataType.viewName){
                    			ObjectViewName=schema["@properties"][key].dataType.viewName;
                    		}*/
          try {
            ObjectViewName = self.props.fullLayout["objectDataViews"][key];
          } catch (err) {}
          if (
            self.props.showingForRelatedViewOfRecordId &&
            self.props.showingForRelatedViewOfRecordId.indexOf(record[key]) > -1
          ) {
            return <div key={global.guid()} />;
          }
          return (
            <div key={global.guid()} className={divType} title={description}>
              {displayNameComponent}
              <div
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
                style={styleFromConfig}
                itemProp={itemProp}
              >
                <common.UserIcon
                  fromRelation={
                    self.props.fromRelation || self.props.from || "innerContent"
                  }
                  showingForRelatedViewOfRecordId={
                    self.props.showingForRelatedViewOfRecordId +
                    self.props.recordId
                  }
                  id={record[key]}
                  noGallery={self.props.noGallery}
                  org={self.props.org}
                  viewName={ObjectViewName}
                  noDetail={self.props.noDetail}
                  rootSchema={
                    schema["@properties"][key].dataType.refKeyObjRef
                      ? schema["@properties"][key].dataType.refKeyObjRef
                      : schema["@properties"][key].dataType.objRef
                  }
                />
              </div>
            </div>
          );
        } else {
          return (
            <div key={global.guid()} className={divType} title={description}>
              {displayNameComponent}
              <div
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
                style={styleFromConfig}
                itemProp={itemProp}
              >
                {record[key]}
              </div>
            </div>
          );
        }
      }
    } else if (dataType == "geoLocation") {
      if (self.props.audit) {
        return (
          <div>
            {(self.props.auditMessage ? self.props.auditMessage : "") +
              " GeoLocation"}
          </div>
        );
      } else {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
              itemProp={itemProp}
            >
              <GeoMap data={record[key]} />
            </div>
          </div>
        );
      }
    } else if (dataType == "privateVideo") {
      tempRecord = record[key];
      if (self.props.audit) {
        return (
          <div>
            {(self.props.auditMessage ? self.props.auditMessage : "") +
              " Video"}
          </div>
        );
      } else {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            {tempRecord.map(function(video, index) {
              if (index == 0) {
                var videoJson = {};
                videoJson = JSON.parse(JSON.stringify(video));
                var height = schema["@properties"][key].dataType.height
                  ? schema["@properties"][key].dataType.height
                  : "440";
                var width = schema["@properties"][key].dataType.width
                  ? schema["@properties"][key].dataType.width
                  : "440";
                var transform = schema["@properties"][key].dataType.transform
                  ? "c_" + schema["@properties"][key].dataType.transform + ","
                  : "";
                var path = transform + "h_" + height + ",w_" + width;

                if (videoJson.cloudinaryId != "") {
                  if (videoJson.cloudinaryId.indexOf("http") == -1) {
                    videoJson.cloudinaryId =
                      "//res.cloudinary.com/dzd0mlvkl/video/upload/" +
                      path +
                      "/v1423542814/" +
                      videoJson.cloudinaryId +
                      ".mp4";
                  }
                }

                return (
                  <div
                    itemProp="video"
                    key={global.guid()}
                    className="display-inline-block remove-zoom-padding"
                  >
                    <video className="extra-padding-right" controls>
                      <source src={videoJson.cloudinaryId} type="video/mp4" />
                    </video>
                  </div>
                );
              } else {
                return (
                  <div key={global.guid()} className="hidden">
                    {" "}
                  </div>
                );
              }
            })}
          </div>
        );
      }
    } else if (dataType == "privateVideos") {
      if (self.props.audit) {
        return (
          <div>
            {(self.props.auditMessage ? self.props.auditMessage : "") +
              " Videos"}
          </div>
        );
      } else if (Array.isArray(record[key])) {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            {record[key].map(function(video, index) {
              var videoJson = JSON.parse(JSON.stringify(video));
              var height = schema["@properties"][key].dataType.height
                ? schema["@properties"][key].dataType.height
                : "220";
              var width = schema["@properties"][key].dataType.width
                ? schema["@properties"][key].dataType.width
                : "220";
              if (videoJson.cloudinaryId != "") {
                if (videoJson.cloudinaryId.indexOf("http") == -1) {
                  videoJson.cloudinaryId =
                    "//res.cloudinary.com/dzd0mlvkl/video/upload/c_fill,h_" +
                    height +
                    ",w_" +
                    width +
                    "/v1623462816/" +
                    videoJson.cloudinaryId +
                    ".mp4";
                }
              }
              return (
                <div
                  itemProp="video"
                  key={global.guid()}
                  className="display-inline-block no-padding margin-bottom-gap remove-zoom-padding"
                >
                  <video className="extra-padding-right" controls>
                    <source src={videoJson.cloudinaryId} type="video/mp4" />
                  </video>
                </div>
              );
            })}
          </div>
        );
      } else {
        return <div />;
      }
    } else if (dataType == "video") {
      var videoKey = [];
      videoKey =
        record[key] != undefined && record[key].length > 0
          ? record[key].split("->")
          : "";
      if (self.props.audit) {
        return (
          <div>
            {(self.props.auditMessage ? self.props.auditMessage : "") +
              " Videos"}
          </div>
        );
      } else if (Array.isArray(videoKey) && videoKey.length >= 2) {
        var url =
          videoKey[0] == "vimeo"
            ? "https://player.vimeo.com/video/"
            : "https://www.youtube.com/embed/";
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            <div>
              <iframe src={url + videoKey[1]} width="300" height="200" />
            </div>
          </div>
        );
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "attachments") {
      if (self.props.audit) {
        return (
          <div>
            {(self.props.auditMessage ? self.props.auditMessage : "") +
              " Attachments"}
          </div>
        );
      } else if (record[key] && record[key] != "") {
        return (
          <div
            key={global.guid()}
            className={
              (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
            }
            title={description}
          >
            {displayNameComponent}
            {record[key].map(function(attach) {
              var a = "";
              a = attach.url;
              var ext = "";

              ext = a.split(".").pop();
              var href = "";
              var imageDesc = getImageDesc(attach,schema,self.props.fullRecord);
              if (ext == "pdf") {
                var imageurl = imagePath( attach,schema["@properties"][key].dataType,300,true);
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src={imageurl} title={imageDesc} alt={imageDesc}/>
                    </a>
                  </div>
                );
              } else if (ext == "doc" || ext == "docx") {
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_fill,h_30,w_30,fl_progressive/v1466588414/docx-file-img_g47btw.png" />
                    </a>
                  </div>
                );
              } else if (ext == "ppt" || ext == "pptx") {
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_fill,h_30,w_30,fl_progressive/v1466589619/pptx-file-img_a96bnh.png"
                      		alt={imageDesc}
                      		title={imageDesc}/>
                    </a>
                  </div>
                );
              } else if (ext == "zip") {
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_fill,h_30,w_30,fl_progressive/v1466589857/zip-file-img_jofyfj.png"
                      		alt={imageDesc}
                      		title={imageDesc}/>
                    </a>
                  </div>
                );
              } else if (ext == "dxf" || ext == "dwg" || ext == "dwf") {
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_fill,h_30,w_30,fl_progressive/v1466590172/cad-file-img_cervuj.png"
                      		alt={imageDesc}
                      		title={imageDesc}/>
                    </a>
                  </div>
                );
              } else if (ext == "xls") {
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="display-inline-block extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_fill,h_30,w_30,fl_progressive/v1466590023/xls-file-img_ikryiw.png"
                      		alt={imageDesc}
                      		title={imageDesc}/>
                    </a>
                  </div>
                );
              } else if (ext == "jpg" || ext == "png") {
                href = attach.url;
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <img src={href} className="img-responsive"
                      		alt={imageDesc}
                      		title={imageDesc}/>
                  </div>
                );
              } else {
                href = attach.url;
                href=href.replace("upload/","upload/fl_attachment/");
                return (
                  <div
                    key={global.guid()}
                    className="unequalDivs extra-padding-right remove-zoom-padding"
                  >
                    <a
                      target="_blank"
                      href={href}
                      className="extra-padding-right"
                    >
                      <img src="//res.cloudinary.com/dzd0mlvkl/image/upload/c_fill,h_30,w_30,fl_progressive/v1466587721/pdf-file-img_l9fe1y.png"
                      		alt={imageDesc}
                      		title={imageDesc}/>
                    </a>
                  </div>
                );
              }
            })}
          </div>
        );
      } else {
        return <div />;
      }
    } else if (dataType == "userDefinedFields") {
      if (
        typeof record[key] == "object" &&
        Object.keys(record[key]).length > 0
      ) {
        return (
          <div>
            {Object.keys(record[key]).map(function(property) {
              return (
                <div
                  key={global.guid()}
                  className={
                    (self.props.noFormGroup == "yes" ? "" : "form-group ") +
                    divType
                  }
                  title={description}
                >
                  <div
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding uppercase "
                    }
                  >
                    <span className="remove-margin-bottom propertyName ">
                      {property}
                    </span>
                  </div>
                  <div
                    className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                    style={styleFromConfig}
                    itemProp={itemProp}
                  >
                    {record[key][property]}
                  </div>
                </div>
              );
            })}
          </div>
        );
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "dndImage") {
      if (self.props.audit) {
        return <div>Uploaded Images</div>;
      } else if (Array.isArray(record[key]) && record[key].length > 0) {
        if (self.props.summary) {
          return (
            <div
              key={global.guid()}
              className="row  remove-margin-left remove-margin-right"
              title={description}
            >
              {displayNameComponent}
              {record[key].map(function(image, index) {
                if (index == 0) {
                  if (typeof image.udf == "undefined") {
                    image["udf"] = {};
                  }
                  var temp = {};
                  temp["url"] = imagePath(image,schema["@properties"][key].dataType,500); //imageJson.cloudinaryId;
                  temp["id"] = imagePath(image,schema["@properties"][key].dataType,500); //imageJson.cloudinaryId;
                  temp["caption"] = getImageDesc(image,schema,self.props.fullRecord);

                  return (
                    <div
                      key={global.guid()}
                      className={
                        "col-lg-12 col-md-12 col-sm-12 col-xs-12 unequalDivs no-padding-left remove-zoom-padding form-group"
                      }
                    >
                      <div
                        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 "
                        style={{
                          padding: "4% 8%",
                          marginTop: "4%",
                          background: "#f2f2f2"
                        }}
                      >
                        <div
                          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                          style={{ overflow: "hidden" }}
                        >
                          <Link
                            rel={linkRel}
                            to={self.props.noDetail ? "" : self.getDetailLink()}
                          >
                            <img
                              src={temp.url}
                              alt={temp.caption ? temp.caption : ""}
                              title={temp.caption ? temp.caption : ""}
                              className="img-responsive grow"
                            />
                          </Link>
                        </div>
                        {Object.keys(image.udf).map(function(property, index) {
                          return (
                            <div
                              key={global.guid()}
                              className={
                                (index < Object.keys(image.udf) - 1
                                  ? "form-group "
                                  : "") + divType
                              }
                              title={description}
                            >
                              <div
                                className={
                                  "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding uppercase "
                                }
                              >
                                <span
                                  className="remove-margin-bottom text-uppercase "
                                  style={{ fontSize: "10px" }}
                                >
                                  {property}
                                </span>
                              </div>
                              <div
                                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                                style={styleFromConfig}
                                itemProp={itemProp}
                              >
                                {image["udf"][property]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  return <div key={global.guid()} className="hidden" />;
                }
              })}
            </div>
          );
        } else {
          return (
            <div
              key={global.guid()}
              className={
                (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
              }
              title={description}
            >
              {displayNameComponent}
              {["a"].map(function(temp) {
                var imgDisplayType = undefined;
                try {
                  imgDisplayType = self.props.fullLayout["imgDisplay"][key];
                } catch (err) {}
                var data = {
                  divType: divType ? divType : undefined,
                  itemProp: itemProp ? itemProp : undefined,
                  description: description ? description : undefined,
                  key: key ? key : undefined,
                  schema: schema ? schema : undefined,
                  styleFromConfig: styleFromConfig ? styleFromConfig : undefined
                };
                if (imgDisplayType == "Carousel" || true) {
                  return (
                    <div
                      key={global.guid()}
                      className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                    >
                      <ImageGallery
                        images={record[key]}
                        data={data}
                        getDndImage={self.getDndImage}
                        fromDnd={true}
                      />
                    </div>
                  );
                } else {
                  return record[key].map(function(image) {
                    return (
                      <div
                        key={global.guid()}
                        className={
                          "col-lg-4 col-md-4 col-sm-6 col-xs-12 unequalDivs no-padding-left remove-zoom-padding form-group"
                        }
                      >
                        {self.getDndImage(image, data)}
                      </div>
                    );
                  });
                }
              })}
            </div>
          );
        }
      } else {
        return <div className="hidden" />;
      }
    } else if (dataType == "password") {
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div>********</div>
        </div>
      );

      // 		return <div>{""}</div>
    } else if (dataType == "translateField") {
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <TranslateFieldValue
            propertyDef={propertyDef}
            org={self.props.org}
            style={styleFromConfig}
            value={record[key]}
          />
        </div>
      );
    } else if (key == "$status") {
      var statusKey = record[key];
      var statusName = statusKey;
      var style = {};
      try {
        statusName = schema["@stateNames"][statusKey].displayName;
        style = utility.getReactStyles(
          schema["@stateNames"][statusKey].css
            ? schema["@stateNames"][statusKey].css
            : {}
        );
      } catch (err) {}
      return (
        <div
          key={global.guid()}
          className={
            (self.props.noFormGroup == "yes" ? "" : "form-group ") + divType
          }
          title={description}
        >
          {displayNameComponent}
          <div className="statusName" style={style}>
            {statusName}
          </div>
        </div>
      );
      //return <div className="statusName" style={style}>{statusName}</div>
    } else {
      if (self.props.showNoDataTypeValue) {
        return <div>{typeof record[key] == "string" ? record[key] : ""}</div>;
      } else {
        return <div />;
      }
    }
  }
});
exports.GetContent = GetContent;

var GetArrayContent = React.createClass({
  render: function() {
    var self = this;
    var arrayKey = this.props.keys;
    var data = Array.isArray(this.props.data) ? this.props.data : [];
    var schemaDetail = this.props.schemaDetail;
    var tableHeaderContent = [];

    if (self.props.layout && self.props.layout == "table") {
      var tableHeaders = [];
      var schemaRec = SchemaStore.get(schemaDetail.elements.structRef);
      for (var item in Object.keys(schemaRec["@properties"])) {
        if (
          schemaRec["@properties"][Object.keys(schemaRec["@properties"])[item]]
            .dataType
        ) {
          tableHeaders.push(
            Object.keys(schemaRec["@properties"])[item].toUpperCase()
          );
        }
      }
      var singleDivWidth = (12 / tableHeaders.length).toFixed();
      for (var arrayKey1 in tableHeaders)
        tableHeaderContent.push(
          <div className={"col-lg-" +singleDivWidth +" col-md-" +singleDivWidth +" col-sm-" +(3 / 2) * singleDivWidth +" col-xs-12  form-group no-padding-left"}>
            <strong>{tableHeaders[arrayKey1]}</strong>
          </div>
        );
    }
    return (
      <div
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
        key={global.guid()}
      >
        <div>{tableHeaderContent}</div>
        {["a"].map(function(temp) {
          if (self.props.arrayView) {
            if (
              schemaDetail.elements.refKey == "recordId" ||
              (schemaDetail.elements.refKeyType == "object" &&
                self.props.arrayView == "carousel")
            ) {
              var ObjectViewName = undefined;
              try {
                ObjectViewName =
                  self.props.fullLayout["objectDataViews"][arrayKey];
              } catch (err) {}
              return (
                <div
                  key={global.guid()}
                  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                >
                  <ImageGallery
                    fromRelation={
                      self.props.fromRelation
                        ? self.props.fromRelation
                        : self.props.from
                          ? self.props.from
                          : "innerContent"
                    }
                    images={data}
                    fromArray={true}
                    viewName={ObjectViewName}
                    org={self.props.org}
                    noDetail={false}
                    rootSchema={
                      schemaDetail.elements.refKeyObjRef
                        ? schemaDetail.elements.refKeyObjRef
                        : schemaDetail.elements.objRef
                    }
                  />
                </div>
              );
            } else {
              return <div key={global.guid()} className="hidden" />;
            }
          } else {
            return data.map(function(innerKey, index) {
              var type = schemaDetail.elements.type;
              if (
                schemaDetail.elements.refKey &&
                schemaDetail.elements.refKey != "recordId"
              ) {
                //type="text";
              }
              if (type == "array") {
                return (
                  <GetArrayContent
                    key={global.guid()}
                    handleImagePopUp={self.props.handleImagePopUp}
                    rootSchema={self.props.rootSchema}
                    showingForRelatedViewOfRecordId={
                      self.props.showingForRelatedViewOfRecordId
                    }
                    recordId={self.props.recordId}
                    org={self.props.org}
                    schemaDetail={schema["@properties"][arrayKey]}
                    record={innerKey}
                    noDetail={self.props.noDetail}
                    fullRecord={self.props.fullRecord}
                    keys={arrayKey}
                  />
                );
              } else if (type == "struct") {
                if (
                  schemaDetail.elements.view &&
                  schemaDetail.elements.view == "table"
                ) {
                  var locSchema = SchemaStore.get(
                    schemaDetail.elements.structRef
                  );
                  var records = [];
                  for (var element in data) {
                    records[element] = {
                      id: self.props.recordId,
                      value: data[element]
                    };
                  }
                  if (index == 0) {
                    return (
                      <genericView.Table
                        key={global.guid()}
                        data={data}
                        org={self.props.org}
                        records={records}
                        struct={"true"}
                        schemaDoc={locSchema}
                        rootSchema={schemaDetail.elements.structRef}
                      />
                    );
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                } else if (schemaDetail.elements["@variant"]) {
                  /** structSchema---contains the schema of a struct   */
                  if (index == 0) {
                    return (
                      <ArrayOfStruct
                        key={global.guid()}
                        property={arrayKey}
                        handleImagePopUp={self.props.handleImagePopUp}
                        fullLayout={self.props.fullLayout}
                        variant={schemaDetail.elements["@variant"]}
                        summary={self.props.summary}
                        detailLink={self.props.detailLink}
                        showDisplayNames={
                          schemaDetail.elements.showDisplayNames
                        }
                        showingForRelatedViewOfRecordId={
                          self.props.showingForRelatedViewOfRecordId
                        }
                        org={self.props.org}
                        parentSchema={self.props.rootSchema}
                        rootSchema={schemaDetail.elements.structRef}
                        structSchema={SchemaStore.get(
                          schemaDetail.elements.structRef
                        )}
                        record={data}
                        noDetail={self.props.noDetail}
                        fullRecord={self.props.fullRecord}
                      />
                    );
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                } else if (schemaDetail.elements["@float"]) {
                  if (index == 0) {
                    return (
                      <ArticleImageStruct
                        key={global.guid()}
                        handleImagePopUp={self.handleImagePopUp}
                        summary={self.props.summary}
                        detailLink={self.props.detailLink}
                        showDisplayNames={
                          schemaDetail.elements.showDisplayNames
                        }
                        showingForRelatedViewOfRecordId={
                          self.props.showingForRelatedViewOfRecordId
                        }
                        org={self.props.org}
                        parentSchema={self.props.rootSchema}
                        rootSchema={schemaDetail.elements.structRef}
                        structSchema={SchemaStore.get(
                          schemaDetail.elements.structRef
                        )}
                        record={data}
                        noDetail={self.props.noDetail}
                        fullRecord={self.props.fullRecord}
                      />
                    );
                  } else {
                    return <div key={global.guid()} className="hidden" />;
                  }
                } else {
                  return (
                    <div
                      key={global.guid()}
                      className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                    >
                      {Object.keys(innerKey).map(function(structKey) {
                        if (structKey == "org") {
                          return <div key={global.guid()} className="hidden" />;
                        }
                        var temp = {};
                        temp[structKey] = {};
                        temp[structKey] = innerKey[structKey];
                        return (
                          <GetContent
                            key={global.guid()}
                            displayName={self.props.displayName}
                            showDisplayNames={
                              schemaDetail.elements.showDisplayNames
                            }
                            showingForRelatedViewOfRecordId={
                              self.props.showingForRelatedViewOfRecordId
                            }
                            org={self.props.org}
                            fullLayout={self.props.fullLayout}
                            parentSchema={self.props.rootSchema}
                            rootSchema={schemaDetail.elements.structRef}
                            property={structKey}
                            fullRecord={innerKey}
                          />
                        );
                      })}
                    </div>
                  );
                }
              } else if (type == "object") {
                if (
                  schemaDetail.elements.refKey == "recordId" ||
                  schemaDetail.elements.refKeyType == "object"
                ) {
                  var ObjectViewName = undefined;
                  /*if(schema["@properties"][key].dataType.viewName){
					                        			ObjectViewName=schema["@properties"][key].dataType.viewName;
					                        		}*/
                  try {
                    ObjectViewName =
                      self.props.fullLayout["objectDataViews"][arrayKey];
                  } catch (err) {}
                  if (
                    self.props.showingForRelatedViewOfRecordId &&
                    self.props.showingForRelatedViewOfRecordId.indexOf(
                      innerKey
                    ) > -1
                  ) {
                    return <div key={global.guid()} />;
                  } else {
                    return (
                      <common.UserIcon
                        key={global.guid()}
                        fromRelation={
                          self.props.fromRelation
                            ? self.props.fromRelation
                            : self.props.from
                              ? self.props.from
                              : "innerContent"
                        }
                        //	showingForRelatedViewOfRecordId={self.props.showingForRelatedViewOfRecordId+self.props.recordId}
                        id={innerKey}
                        viewName={ObjectViewName}
                        org={self.props.org}
                        noDetail={self.props.noDetail}
                        rootSchema={
                          schemaDetail.elements.refKeyObjRef
                            ? schemaDetail.elements.refKeyObjRef
                            : schemaDetail.elements.objRef
                        }
                      />
                    );
                    //rootSchema={schemaDetail.elements.objRef}/>)
                  }
                } else {
                  return (
                    <div
                      key={global.guid()}
                      className={
                        "row  margin-bottom-gap-xs remove-margin-left remove-margin-right "
                      }
                    >
                      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
                        {innerKey}
                      </div>
                    </div>
                  );
                }
              } else {
                var record = {};
                record[arrayKey] = innerKey;
                return (
                  <div key={global.guid()} className="row no-margin">
                    <GetContent
                      dataType={type}
                      dependentSchema={self.props.dependentSchema}
                      fromArray={"array"}
                      relatedSchemas={self.props.relatedSchemas}
                      rootSchema={self.props.rootSchema}
                      property={arrayKey}
                      fullRecord={record}
                      recordId={self.props.recordId}
                      org={self.props.org}
                      noDetail={self.props.noDetail}
                      showingForRelatedViewOfRecordId={
                        self.props.showingForRelatedViewOfRecordId
                      }
                      methods={self.props.methods}
                    />
                  </div>
                );
              }
            });
          }
        })}
      </div>
    );
  }
});
exports.GetArrayContent = GetArrayContent;

/**
 * 	variant
 *	showDisplayNames
 *	showingForRelatedViewOfRecordId
 *	org
 *	rootSchema
 *	structSchema
 *	record
 */
var ArrayOfStruct = React.createClass({
  handleImagePopUp: function(image,imageDesc) {
    this.props.handleImagePopUp(image,imageDesc);
  },
  render: function() {
    var self = this;
    var structKeys = Object.keys(self.props.structSchema["@properties"]);
    var imageField = "";
    var textField = "";
    var linkRel = ""; //"nofollow";
    if (
      typeof this.props.fullRecord != "undefined" &&
      this.props.fullRecord.webCrawlerIndex
    ) {
      linkRel = "";
    }
    if (structKeys.length > 0) {
      var style = {};
      if (
        self.props.fullLayout &&
        self.props.fullLayout["css"] &&
        self.props.fullLayout["css"][self.props.property]
      ) {
        style = getStyleFromConfig(
          self.props.fullLayout["css"][self.props.property]
        ).normal;
      }
      structKeys.forEach(function(structKey) {
        if (self.props.structSchema["@properties"][structKey].dataType) {
          if (
            self.props.structSchema["@properties"][structKey].dataType.type ==
            "images"
          ) {
            imageField = structKey;
          } else if (
            self.props.structSchema["@properties"][structKey].dataType.type ==
            "text"
          ) {
            textField = structKey;
          }
        }
      });

      if (self.props.summary && imageField != "") {
        try {
          var sUrl = imagePath(self.props.record[0][imageField][0],self.props.structSchema["@properties"][imageField].dataType,"0",self.props.summary,style);
          var schema = SchemaStore.get(self.props.parentSchema? self.props.parentSchema: self.props.rootSchema);
          var imageDesc = getImageDesc(self.props.record[0][imageField][0],schema,self.props.fullRecord);
          return (
            <div
              itemProp="image"
              key={global.guid()}
              className="display-inline-block extra-padding-right remove-zoom-padding"
            >
              <Link
                rel={linkRel}
                to={self.props.noDetail ? "" : self.props.detailLink}
              >
                <img
                  src={sUrl}
                  alt={imageDesc}
                  title={imageDesc}
                  className="img-responsive "
                />
              </Link>
            </div>
          );
        } catch (err) {
          return <div />;
        }
      }
      var structCarouselData = {};
      var variantData = [];
      var temp = "";
      structCarouselData["all"] = [];
      self.props.record.map(function(data, index) {
        if (
          textField != "" &&
          data[textField] != undefined &&
          data[textField] != "" &&
          imageField != ""
        ) {
          if (temp != data[textField].toLowerCase()) {
            temp = data[textField].toLowerCase();
            variantData.push(data[textField]);
            structCarouselData[data[textField]] = [];
            structCarouselData[data[textField]] = structCarouselData[
              data[textField]
            ].concat(data[imageField]);
          } else {
            structCarouselData[data[textField]] = structCarouselData[
              data[textField]
            ].concat(data[imageField]);
          }
        } else if (imageField != "") {
          structCarouselData["all"] = structCarouselData["all"].concat(
            data[imageField]
          );
        }
      });
      return (
        <ArrayOfStructCarousel
          data={structCarouselData}
          style={style}
          variantData={variantData}
          handleImagePopUp={self.handleImagePopUp}
          imageDataType={
            imageField != ""
              ? self.props.structSchema["@properties"][imageField].dataType
              : ""
          }
          schema={self.props.structSchema}
          fullRecord={self.props.fullRecord}
        />
      );
    }
    return <div className="hidden">ABC</div>;
  }
});

/**
  	data
	variantData
	imageDataType
 */
var ArrayOfStructCarousel = React.createClass({
  getInitialState: function() {
    return {
      variantIndex: 0,
      variantData:
        this.props.variantData.length > 0 ? this.props.variantData : ["all"]
    };
  },
  handleImagePopUp: function(image,imageDesc) {
    this.props.handleImagePopUp(image,imageDesc);
  },
  changeCarousel: function(variant) {
    var index = this.state.variantData.indexOf(variant);
    if (index != -1 && index != this.state.variantIndex) {
      this.setState({ variantIndex: index });
    }
  },
  render: function() {
    var imageDataType = this.props.imageDataType;

    var images = [];
    var self = this;

    return (
      <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
        <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding form-group">
          {self.state.variantData.map(function(variant, index) {
            if (index == self.state.variantIndex) {
              images = [];
              self.props.data[variant].map(function(image) {
                var temp = {};
                temp["url"] = imagePath(image,imageDataType,500,false,self.props.style);
                temp["id"] = imagePath(image,imageDataType,500,false,self.props.style);
                temp["caption"] = getImageDesc(image,self.props.schema,self.props.fullRecord);
                images.push(temp);
              });
              return (
                <ImageDisplay
                  key={global.guid()}
                  imgDisplayType={"Slideshow"}
                  height={"auto"}
                  images={images}
                  click={self.handleImagePopUp}
                />
              );
            } else {
              return <div key={global.guid()} className="hidden" />;
            }
          })}
        </div>
        <div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding mobile-text-left">
          {self.props.variantData.map(function(variant, index) {
            return (
              <div
                key={global.guid()}
                className="extra-padding-right display-inline-block form-group"
              >
                <button
                  type="submit"
                  className="action-button"
                  onClick={self.changeCarousel.bind(null, variant)}
                >
                  {variant}
                </button>
              </div>
            );
          }, this)}
        </div>
      </div>
    );
  }
});

/*
 * imageUrl---url of the image
 * imageDataType-- full DataType values of image
 * defaultNumber--- default value of image height n width
 *
 */
function imagePath(
  imageUrl,
  imageDataType,
  defaultNumber,
  summary,
  styleFromConfig
) {
  var width;
  var height;
  if (imageUrl == undefined) {
    imageUrl = {};
    imageUrl["cloudinaryId"] =
      "//res.cloudinary.com/dzd0mlvkl/image/upload/v1441279368/" +
      "default_image" +
      ".jpg";
  }
  var radius="";
  var transform ="";
  var path = "";
  if(imageDataType){
    if (summary) {
      width = imageDataType.tWidth ? imageDataType.tWidth : defaultNumber;
      height = imageDataType.tHeight ? imageDataType.tHeight : defaultNumber;
    } else {
      height = imageDataType.height ? imageDataType.height : defaultNumber;
      width = imageDataType.width ? imageDataType.width : defaultNumber;
    }
    radius = imageDataType.radius ? "r_" + imageDataType.radius : "r_0";
    transform = imageDataType.transform
      ? "c_" + imageDataType.transform + ","
      : "";
    path = transform + radius;
  }
  if (styleFromConfig && Object.keys(styleFromConfig).length > 0) {
    if (styleFromConfig.height) {
      height = styleFromConfig.height;
    }
    if (styleFromConfig.width) {
      width = styleFromConfig.width;
    }
  }

  if (height == "0") {
    path += "";
  } else {
    path += ",h_" + height;
  }
  if (width == "0") {
    path += "";
  } else {
    path += ",w_" + width;
  }
  path += ",fl_progressive";
  //var path=transform+"h_"+height+",w_"+width+",r_"+radius+",fl_progressive";
  var imageJson = JSON.parse(JSON.stringify(imageUrl));
  if (
    typeof imageJson.cloudinaryId == "string" &&
    imageJson.cloudinaryId != ""
  ) {
    var tempPath = "";
    if (imageJson.cloudinaryId.indexOf("http") != 0) {
      imageJson.cloudinaryId =
        "//res.cloudinary.com/dzd0mlvkl/image/upload/" +
        path +
        "/v1623462816/" +
        imageJson.cloudinaryId +
        ".jpg";
    } else if (
      imageJson.cloudinaryId.indexOf("h_") != -1 ||
      imageJson.cloudinaryId.indexOf("w_") != -1
    ) {
      tempPath =
        imageJson.cloudinaryId.substr(
          0,
          imageJson.cloudinaryId.indexOf("/upload/") + 8
        ) +
        path +
        imageJson.cloudinaryId.substr(
          imageJson.cloudinaryId.indexOf("/v"),
          imageJson.cloudinaryId.length
        );
      imageJson.cloudinaryId = tempPath;
    } else if (
      imageJson.cloudinaryId.indexOf("h_") == -1 ||
      imageJson.cloudinaryId.indexOf("w_") == -1
    ) {
      tempPath =
        imageJson.cloudinaryId.substr(
          0,
          imageJson.cloudinaryId.indexOf("/upload/") + 8
        ) +
        path +
        imageJson.cloudinaryId.substr(
          imageJson.cloudinaryId.indexOf("/v"),
          imageJson.cloudinaryId.length
        );
      imageJson.cloudinaryId = tempPath;
    }
  } else {
    if (imageJson.facebook) {
      imageJson.cloudinaryId =
        "//res.cloudinary.com/dzd0mlvkl/image/facebook/" +
        path +
        "/" +
        imageJson.facebook +
        ".jpg";
    } else if (imageJson.google) {
      imageJson.cloudinaryId =
        "//res.cloudinary.com/dzd0mlvkl/image/gplus/" +
        path +
        "/" +
        imageJson.google +
        ".jpg";
    }
  }

  return imageJson.cloudinaryId;
}
function getImageDesc(imageJson,schema,fullRecord){
	/*if(imageJson && imageJson.caption && typeof imageJson.caption=="string" && imageJson.caption!=""){
		return imageJson.caption;
	}else {
		if(schema && schema["@identifier"] &&
				fullRecord && typeof fullRecord[schema["@identifier"]]=="string"){
			return fullRecord[schema["@identifier"]];
		}else if(imageJson && imageJson.imageName && imageJson.imageName!=""){
			return imageJson.imageName;
		}else{
			return "IMAGE";
		}
	}*/
	var caption="";
	if(schema && schema["@imageAlt"] && fullRecord){
		if(Array.isArray(schema["@imageAlt"])){
			schema["@imageAlt"].forEach(function(iak){
				if(typeof fullRecord[iak]=="string"){
					if(caption.indexOf(fullRecord[iak])==-1)
					caption+= " "+fullRecord[iak];
				}
			});
		}else{
			if(typeof fullRecord[schema["@imageAlt"]]=="string"){
				caption+= fullRecord[schema["@imageAlt"]];
			}
		}
	}

	if(imageJson && imageJson.caption && typeof imageJson.caption=="string" && imageJson.caption!=""){
		if(caption.indexOf(imageJson.caption)==-1)
		caption+=" "+imageJson.caption;
	}else{
		if(schema && schema["@identifier"] &&
				fullRecord && typeof fullRecord[schema["@identifier"]]=="string"){
			if(caption.indexOf(fullRecord[schema["@identifier"]])==-1)
			caption+=fullRecord[schema["@identifier"]];
		}else if(imageJson && imageJson.imageName && imageJson.imageName!=""){
			if(caption.indexOf(imageJson.imageName)==-1)
			caption+=" "+imageJson.imageName;
		}else{
			caption+=" "+"IMAGE";
		}
	}
	return caption.trim();
}
exports.getImageDesc = getImageDesc;

function getStyleFromConfig(styleName) {
  var config = common.getConfigDetails();
  var cssStyle = {};
  var styleFromConfig = {};
  var onMouseOver = "";
  var onMouseOut = "";
  var onClick = "";
  try {
    if (config.branding[styleName]) {
      cssStyle = config.branding[styleName];
    } else if (config.branding["text"]) {
      cssStyle = config.branding["text"];
      styleName = "text";
    }
    if (cssStyle.normal) {
      cssStyle.normal = utility.getReactStyles(cssStyle.normal);
      styleFromConfig = cssStyle.normal;
    }
    if (cssStyle.hover) {
      cssStyle.hover = utility.getReactStyles(cssStyle.hover);
      Object.keys(cssStyle.hover).forEach(function(styleName) {
        onMouseOver +=
          "this.style." + styleName + '="' + cssStyle.hover[styleName] + '";';
      });
    }
    if (cssStyle.active) {
      cssStyle.active = utility.getReactStyles(cssStyle.active);
      Object.keys(cssStyle.active).forEach(function(styleName) {
        onClick +=
          "this.style." + styleName + '="' + cssStyle.active[styleName] + '";';
      });
    }
    if (cssStyle.normal) {
      Object.keys(cssStyle.normal).forEach(function(styleName) {
        onMouseOut +=
          "this.style." + styleName + '="' + cssStyle.normal[styleName] + '";';
      });
    }
  } catch (err) {}

  return {
    normal: styleFromConfig,
    mouseOver: onMouseOver,
    mouseOut: onMouseOut,
    click: onClick,
    styleName: styleName
  };
}
exports.getStyleFromConfig = getStyleFromConfig;

var GeoMap = React.createClass({
  componentDidMount: function() {
    try {
      var latitude = this.props.data.latitude;
      var longitude = this.props.data.longitude;
      var targetDiv = this.rootDiv;
      var myCenter = new google.maps.LatLng(latitude, longitude);
      var marker;
      var mapProp = {
        center: myCenter,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      targetDiv.style.height = "250px";
      var map = new google.maps.Map(targetDiv, mapProp);
      marker = new google.maps.Marker({
        position: myCenter,
        animation: google.maps.Animation.DROP
      });
      marker.setMap(map);
    } catch (err) {
      console.log("Erro in GeoMap componentdidmount" + err);
    }
  },
  render: function() {
    return (
      <div
        ref={d => {
          this.rootDiv = d;
        }}
      />
    );
  }
});

/***
 * 	To display image in carousel slideshow grid or stacked format
 * 	PROPS
 * 	cols-for grid
 * 	imgDisplayType - type of the image to be displayed
 * 	images - images array
 * 	click open image in popup
 * */

var ImageDisplay = React.createClass({
  click: function(record) {
    //	this.props.click(record.id);
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
        url={record.url}
        id={record.id}
        type="slider"
        carousel={true}
        images={this.props.images}
        fromPopUp={true}
      />,
      document.getElementById(contentDivId)
    );
  },
  render: function() {
    var self = this;
    if (self.props.images.length > 0) {
      if (self.props.imgDisplayType == "Slideshow") {
        return (
          <div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}>
            <ImageGallery
              height={self.props.height ? self.props.height : "500"}
              images={self.props.images}
            />
          </div>
        );
      } else if (self.props.imgDisplayType == "Carousel") {
        return (
          <div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}>
            <ImageGallery
              type="slider"
              carousel={true}
              images={self.props.images}
              fromPopUp={false}
              height={self.props.height ? self.props.height : "500"}
              items={self.props.images}
            />
          </div>
        );
      } else {
        return (
          <div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}>
            {self.props.images.map(function(img) {
              return (
                <div
                  key={global.guid()}
                  className={
                    self.props.cols + " remove-zoom-padding form-group"
                  }
                >
                  <img
                    src={img.url}
                    alt={img.caption ? img.caption : ""}
                    title={img.caption ? img.caption : ""}
                    className="img-responsive grow"
                    onClick={self.click.bind(null, img)}
                  />
                </div>
              );
            }, this)}
          </div>
        );
      }
    } else {
      return <div className="hidden" />;
    }
  }
});
exports.ImageDisplay = ImageDisplay;

var ArticleImageStruct = React.createClass({
  handleImagePopUp: function(image,imageDesc) {
    image =
      image.substr(0, image.indexOf("/upload/") + 8) +
      image.substr(image.indexOf("/v"), image.length);
    this.props.handleImagePopUp(image,imageDesc);
  },
  render: function() {
    if (this.props.record) {
      var self = this;
      return (
        <div
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
          key={global.guid()}>
          {
              this.props.record.map(function(rec) {
                var images=[];
                var style={
                  "height":rec.height?rec.height:500,
                  "width":rec.width?rec.width:500
                };
                if((typeof rec.video == "undefined")||(rec.video && rec.video.length==0)){
                  rec.video=[]
                }
                if(rec.image && Array.isArray(rec.image)){
                  rec.image.forEach(function(image) {
                    var temp = {};
                    temp["url"] = imagePath(image,self.props.structSchema["@properties"]["image"].dataType,500,false,style); //imageJson.cloudinaryId;
                    temp["id"] = imagePath(image,self.props.structSchema["@properties"]["image"].dataType,500,false,style); //imageJson.cloudinaryId;
                    images.push(temp);
                  });
                }
                var contentGrid = rec.contentGrid ? rec.contentGrid : "";
                var imageGrid = rec.imageGrid ? rec.imageGrid : "";
                var extraDiv =
                  contentGrid * 1 + imageGrid * 1 == 12
                    ? ""
                    : 12 - (contentGrid * 1 + imageGrid * 1);
                var cols = defineRecordLayout.calculateCols(rec.imgCol?rec.imgCol:12);
                if (rec.layout && rec.layout == "content-image") {
                  return (
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"    key={global.guid()} >
                      <div className={
                                    contentGrid != ""
                                      ? "col-lg-" +
                                        contentGrid +
                                        " col-md-" +
                                        contentGrid +
                                        " col-sm-" +
                                        contentGrid +
                                        " col-xs-12 no-padding-left"
                                      : "hidden"
                                  }>
                        <Editor content={rec.content} mode={"view"} />
                      </div>
                      <div  className={ imageGrid != ""
                                        ? "col-lg-" +
                                          imageGrid +
                                          " col-md-" +
                                          imageGrid +
                                          " col-sm-" +
                                          imageGrid +
                                          " col-xs-12 no-padding-left"
                                        : "hidden"
                                    }>
                          <ImageDisplay
                            cols={cols}
                            imgDisplayType={"Grid"}
                            images={images}
                            click={self.handleImagePopUp}
                          />
                      </div>
                          {
                              rec.video.map(function(video, index) {
                                var videoJson = JSON.parse(JSON.stringify(video));
                                if (videoJson.cloudinaryId != "") {
                                  if (videoJson.cloudinaryId.indexOf("http") == -1) {
                                      videoJson.cloudinaryId =
                                        "//res.cloudinary.com/dzd0mlvkl/video/upload/c_fill,h_1.0,w_1.0/v1623462816/" +
                                        videoJson.cloudinaryId +
                                        ".mp4";
                                  }
                                }
                                return (
                                        <div itemProp="video" key={global.guid()} className="display-inline-block no-padding margin-bottom-gap remove-zoom-padding">
                                          <video className="extra-padding-right" controls>
                                            <source src={videoJson.cloudinaryId} type="video/mp4" />
                                          </video>
                                        </div>
                                )

                              })
                            }
                          </div>
                  );
                } else {
                  return (
                    <div
                      className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"
                      key={global.guid()}
                    >
                      <div className={
                          imageGrid != ""
                            ? "col-lg-" +
                              imageGrid +
                              " col-md-" +
                              imageGrid +
                              " col-sm-" +
                              imageGrid +
                              " col-xs-12 no-padding-left"
                            : "hidden"
                        } >
                      <ImageDisplay
                        cols={cols}
                        imgDisplayType={"Grid"}
                        images={images}
                        click={self.handleImagePopUp}
                      />
                      </div>
                      <div   className={
                          contentGrid != ""
                            ? "col-lg-" +
                              contentGrid +
                              " col-md-" +
                              contentGrid +
                              " col-sm-" +
                              contentGrid +
                              " col-xs-12 no-padding-left"
                            : "hidden"
                        }
                      >
                        <Editor content={rec.content} mode={"view"} />
                      </div>
                      {
                        rec.video.map(function(video, index) {
                          var videoJson = JSON.parse(JSON.stringify(video));
                          if (videoJson.cloudinaryId != "") {
                            if (videoJson.cloudinaryId.indexOf("http") == -1) {
                                videoJson.cloudinaryId =
                                  "//res.cloudinary.com/dzd0mlvkl/video/upload/c_fill,h_1.0,w_1.0/v1623462816/" +
                                  videoJson.cloudinaryId +
                                  ".mp4";
                            }
                          }
                          return (<video  key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap remove-zoom-padding" controls>
                                      <source src={videoJson.cloudinaryId} type="video/mp4" />
                                    </video>)

                        })
                      }
                    </div>
                  );
                }
            })
          }
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});

var TranslateFieldValue = React.createClass({
  getInitialState: function() {
    var val;
    try {
      val = localStorage.getItem(this.props.org + "-" + this.props.value);
    } catch (err) {}
    return { value: val ? val : this.props.value };
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  componentDidMount: function() {
    var fetchFlag = true;
    if (
      this.props.propertyDef &&
      this.props.propertyDef.dataType &&
      this.props.propertyDef.dataType.defaultValue &&
      this.props.propertyDef.dataType.defaultValue == this.props.value
    ) {
      fetchFlag = false;
    }
    if (fetchFlag) {
      WebUtils.doPost(
        "/generic?operation=getOrgSpecificValue",
        {
          org: this.props.org,
          key: this.props.value
        },
        function(result) {
          if (result.error) {
            if (!this._isUnmounted) this.setState({ value: this.props.value });
          } else {
            try {
              localStorage.setItem(
                this.props.org + "-" + this.props.value,
                result.value
              );
            } catch (err) {}
            if (this.state.value != result.value) {
              if (!this._isUnmounted) this.setState({ value: result.value });
            }
          }
        }.bind(this)
      );
    }
  },
  render: function() {
    return <div style={this.props.style}>{this.state.value}</div>;
  }
});

/**
 * image ---- url
 * property --- Property Name
 * recordId --Record Id
 * schema-- Schema Name
 */

/**
 * image ---- url
 * property --- Property Name
 * recordId --Record Id
 * schema-- Schema Name
 */

var CanvasImage = React.createClass({
  getInitialState: function() {
    //intialize the canvas,image,restore
    return {
      canvas: "",
      image: this.props.image,
      restore: this.props.image.indexOf("-canvas-") == -1 ? false : true
    };
  },
  handleImageLoaded: function() {
    var self = this;
    var canvas = "";
    if (this.state.canvas == "") {
      canvas = new fabric.Canvas("canvas", { stateful: false }); // creating a canvas instance using fabricjs
    } else {
      canvas = this.state.canvas;
    }
    //storing the canvas in the state to use for later additions (line, text)
    this.setState(
      {
        canvas: canvas
      },
      function() {
        canvas.clear(); //clearing the canvas
        var imgHeight = "";
        var imgWidth = "";
        if (
          this.state.image.indexOf("data:") == -1 &&
          this.state.image.indexOf("-canvas-") == -1
        ) {
          imgHeight =
            self.refs.image.height < 500 ? self.refs.image.height : 500; //max-height for image used is 500
          imgWidth = self.refs.image.width < 400 ? self.refs.image.width : 400; //max-width for image used is 400
          canvas.setWidth(2 * imgWidth); // changing the canvas providing white space
          canvas.setHeight(imgHeight + 150);
        } else {
          imgHeight = self.refs.image.height;
          imgWidth = self.refs.image.width;
          canvas.setHeight(imgHeight); // allocating same as img width height as image is already an edited one
          canvas.setWidth(imgWidth);
        }
        // fabricjs image loader
        fabric.Image.fromURL(
          self.state.image,
          function(img) {
            canvas.add(
              img.set({
                width: imgWidth,
                height: imgHeight,
                hasBorders: false,
                hasControls: false,
                selectable: false
              })
            );
            img.sendToBack();
          },
          {
            crossOrigin: "Anonymous"
          }
        );
      }
    );
    // used to get the selectable object borders and scaling properties
    canvas.on("after:render", function() {
      this.calcOffset();
    });
  },
  line: function() {
    //fabric js line
    if (this.state.restore) {
      // this.setState({restore:false});
      this.refs.delete.className = "hidden";
      this.refs.restore.className = "hidden";
    }
    line = new fabric.Line([150, 150, 250, 150], {
      strokeWidth: 1,
      fill: "#0070c9",
      stroke: "#0070c9",
      centeredRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      padding: 15,
      lockRotation: false,
      hasControls: true
    });
    this.refs.delete.className =
      "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right";
    //adding line to canvas
    this.state.canvas.add(line);
  },
  dimension: function() {
    if (this.state.restore) {
      // this.setState({restore:false});
      this.refs.delete.className = "hidden";
      this.refs.restore.className = "hidden";
    }
    var line = new fabric.Line([50, 50, 215, 50], {
      strokeWidth: 1,
      fill: "#0070c9",
      stroke: "#0070c9",
      centeredRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      strokeDashArray: [5, 5],

      lockRotation: false,
      hasControls: true
    });
    var line1 = new fabric.Line([288, 120, 288, -20], {
      strokeWidth: 1,
      fill: "#0070c9",
      stroke: "#0070c9",
      centeredRotation: false,
      lockScalingX: false,
      lockScalingY: false,

      lockRotation: false,
      hasControls: true
    });
    var line2 = new fabric.Line([50, 200, 215, 200], {
      strokeWidth: 1,
      fill: "#0070c9",
      stroke: "#0070c9",
      strokeDashArray: [5, 5],
      centeredRotation: false,
      lockScalingX: false,
      lockScalingY: false,

      lockRotation: false,
      hasControls: true
    });
    var larrow = new fabric.Triangle({
      left: 290,
      top: 55,
      originX: "center",
      originY: "center",
      hasBorders: false,
      hasControls: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      pointType: "arrow_start",
      angle: 0,
      width: 10,
      height: 10,
      fill: "#0070c9"
    });
    var rarrow = new fabric.Triangle({
      left: 290,
      top: 196,
      originX: "center",
      originY: "center",
      hasBorders: false,
      hasControls: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      pointType: "arrow_start",
      angle: 180,
      width: 10,
      height: 10,
      fill: "#0070c9"
    });
    var group = new fabric.Group([larrow, rarrow, line, line1, line2], {
      left: 150,
      top: 50
    });
    this.refs.delete.className =
      "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right";
    this.state.canvas.add(group);
    this.state.canvas.bringToFront(group);
  },
  lineArrow: function() {
    var line = new fabric.Line([50, 50, 250, 50], {
      strokeWidth: 1,
      fill: "#0070c9",
      stroke: "#0070c9",
      centeredRotation: false,
      lockScalingX: false,
      lockScalingY: false,

      lockRotation: false,
      hasControls: true
    });
    var arrow = new fabric.Triangle({
      left: 350,
      top: 50,
      originX: "center",
      originY: "center",
      hasBorders: false,
      hasControls: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      pointType: "arrow_start",
      angle: -30,
      width: 10,
      height: 10,
      fill: "#0070c9"
    });
    var group = new fabric.Group([arrow, line], {
      left: 150,
      top: 50
    });
    this.state.canvas.add(group);
    this.refs.delete.className =
      "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right";
  },
  text: function() {
    if (this.state.restore) {
      //   this.setState({restore:false});
      this.refs.delete.className = "hidden";
      this.refs.restore.className = "hidden";
    }
    //fabric js text
    var text = new fabric.IText("Type your text", {
      left: 40,
      top: 40,
      radius: 50,
      stroke: "#000",
      strokeWidth: 2,
      fontSize: 15,
      fontFamily: "Montserrat",
      centeredRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      hasControls: true
    });
    this.refs.delete.className =
      "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right";
    //adding text to canvas
    this.state.canvas.add(text);
  },
  deleteObjects: function() {
    //getting current object selected in canvas
    var activeObject = this.state.canvas.getActiveObject(),
      activeGroup = this.state.canvas.getActiveGroup(); //getting a group of elements if selected in canvas
    if (activeObject) {
      //we use this mostly
      if (confirm("Are you sure want to delete ?")) {
        this.state.canvas.remove(activeObject);
        if (this.state.canvas.getObjects().length == 1) {
          this.refs.delete.className = "hidden";
        }
      }
    } else if (activeGroup) {
      if (confirm("Are you sure want to delete ?")) {
        var objectsInGroup = activeGroup.getObjects();
        this.state.canvas.discardActiveGroup();
        objectsInGroup.forEach(function(object) {
          this.state.canvas.remove(object);
        });
      }
    } else {
      //use this to write any message to the select an object to delete
    }
  },
  replaceUrl: function(id, url) {
    //update the id in url
    var temp = id.substr(0, id.indexOf("-canvas-"));
    var tempImg = url.replace(id, temp);
    return tempImg;
  },
  getImageId: function(url) {
    var id = "";
    //get the exact cloudinayId at the end of full url
    if (url.split(".").length > 2) {
      var temp = url.split(".")[url.split(".").length - 2];
      if (temp.split("/").length > 0) {
        id = temp.split("/")[temp.split("/").length - 1];
      }
    }
    return id;
  },
  savePNG: function() {
    var self = this; // saving the canvas using fabricjs and updating state property
    if (this.state.canvas.getObjects().length == 1 && !this.state.restore) {
      self.props.callbackToClosePopup();
    } else {
      this.state.canvas.discardActiveObject();
      this.setState(
        {
          image: this.state.canvas.toDataURL("png")
        },
        function() {
          common.startLoader();
          self.save();
        }
      );
    }
  },
  save: function() {
    var self = this;
    function s4() {
      //function to get unique id
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    var oldId = this.getImageId(this.props.image); //getting the id from intial prop image
    var id = "";
    if (this.state.restore && this.state.canvas.getObjects().length == 1) {
      id = oldId.substr(0, oldId.indexOf("-canvas-"));
    } else {
      if (oldId.indexOf("-canvas-") != -1) {
        id =
          oldId.substr(0, oldId.indexOf("-canvas-")) +
          "-canvas-" +
          s4() +
          s4() +
          s4() +
          s4();
      } else {
        id = oldId + "-canvas-" + s4() + s4() + s4() + s4();
      }
    }
    if (oldId != "" && id != "") {
      if (this.state.restore && this.state.canvas.getObjects().length == 1) {
        WebUtils.doPost(
          "/generic?operation=updateImageAnnotation",
          {
            oldId: oldId,
            newId: id,
            recordId: self.props.recordId,
            property: self.props.property
          },
          function(recordSave) {
            if (recordSave.data && recordSave.data.indexOf("Success") != -1) {
              self.props.callbackToClosePopup();
              common.stopLoader();
              WebUtils.doPost(
                "/generic?operation=extractImagesAndDelete",
                { productImages: { cloudinaryId: oldId } },
                function(result) {
                  console.log(result);
                }
              );
            } else if (recordSave.data) {
              common.stopLoader();
              self.refs.errorMessage.className = "errorMsg";
              self.refs.errorMessage.innerHTML = recordSave.data;
            } else {
              common.stopLoader();
              self.refs.errorMessage.className = "errorMsg";
              self.refs.errorMessage.innerHTML =
                "Some thing went wrong.Try Again ";
            }
          }
        );
      } else {
        WebUtils.doPost(
          "/generic?operation=saveCloudinaryData",
          { data: this.state.image, id: id },
          function(result) {
            if (result.data && result.data.indexOf("success") != -1) {
              WebUtils.doPost(
                "/generic?operation=updateImageAnnotation",
                {
                  oldId: oldId,
                  newId: id,
                  recordId: self.props.recordId,
                  property: self.props.property
                },
                function(recordSave) {
                  common.stopLoader();
                  if (
                    recordSave.data &&
                    recordSave.data.indexOf("Success") != -1
                  ) {
                    if (oldId.indexOf("-canvas-") != -1) {
                      WebUtils.doPost(
                        "/generic?operation=extractImagesAndDelete",
                        { productImages: { cloudinaryId: oldId } },
                        function(result) {
                          console.log(result);
                          self.props.callbackToClosePopup();
                        }
                      );
                    } else {
                      self.props.callbackToClosePopup();
                    }
                  } else if (recordSave.data) {
                    self.refs.errorMessage.className = "errorMsg";
                    self.refs.errorMessage.innerHTML = recordSave.data;
                  } else {
                    self.refs.errorMessage.className = "errorMsg";
                    self.refs.errorMessage.innerHTML =
                      "Some thing went wrong.Try Again ";
                  }
                }
              );
            } else {
              //do nothing
            }
          }
        );
      }
    }
  },
  restore: function() {
    var flag = false;
    var self = this;
    if (confirm("All changes will be lost. Are you sure ?")) {
      if (this.props.image.indexOf("-canvas-") != -1) {
        common.startLoader();
        this.refs.restore.className = "hidden";
        var id = this.getImageId(this.props.image);
        if (id.indexOf("-canvas-") > 0) {
          var temp = this.replaceUrl(id, this.props.image);
          this.setState({ image: temp, restore: true }, function() {
            common.stopLoader();
            self.forceUpdate();
          });
        } else {
          flag = true;
        }
      } else {
        flag = true;
      }
      if (flag) {
        common.stopLoader();
        this.refs.errorMessage.className = "errorMsg";
        this.refs.errorMessage.innerHTML =
          "Some thing went wrong.Try Again or contact Admin";
      }
    }
  },
  render: function() {
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap">
          <div
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
            title={"DRAW LINE"}
          >
            <div className="buttonWidth" onClick={this.line}>
              <div className="iconHeight">
                <i className={"icons8-horizontal-line newCustomIcon"} />
              </div>
              <div className="newCustomButton">DRAW LINE</div>
            </div>
          </div>

          <div
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
            title={"DRAW ARROW"}
          >
            <div className="buttonWidth" onClick={this.lineArrow}>
              <div className="iconHeight">
                <i className={"icons8-right-pointing-arrow newCustomIcon"} />
              </div>
              <div className="newCustomButton">DRAW ARROW</div>
            </div>
          </div>

          <div
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
            title={"DRAW DIMENSION"}
          >
            <div className="buttonWidth" onClick={this.dimension}>
              <div className="iconHeight">
                <i className={"icons8-height newCustomIcon"} />
              </div>
              <div className="newCustomButton">DRAW DIMENSION</div>
            </div>
          </div>

          <div
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
            title={"INSERT TEXT"}
          >
            <div className="buttonWidth" onClick={this.text}>
              <div className="iconHeight">
                <i className={"icons8-add-text newCustomIcon"} />
              </div>
              <div className="newCustomButton">INSERT TEXT</div>
            </div>
          </div>

          <div
            ref="delete"
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right hidden"
            title={"DELETE OBJECT"}
          >
            <div className="buttonWidth" onClick={this.deleteObjects}>
              <div className="iconHeight">
                <i className={"icons8-delete newCustomIcon"} />
              </div>
              <div className="newCustomButton">DELETE OBJECT</div>
            </div>
          </div>

          <div
            ref="restore"
            className={
              "display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right " +
              (!this.state.restore ? "hidden" : "")
            }
            title={"RESTORE ORIGINAL"}
          >
            <div className="buttonWidth" onClick={this.restore}>
              <div className="iconHeight">
                <i className={"icons8-restore newCustomIcon"} />
              </div>
              <div className="newCustomButton">RESTORE ORIGINAL</div>
            </div>
          </div>

          <div
            ref="save"
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
            title={"SAVE"}
          >
            <div className="buttonWidth" onClick={this.savePNG}>
              <div className="iconHeight">
                <i className={"icons8-save-close newCustomIcon"} />
              </div>
              <div className="newCustomButton">SAVE</div>
            </div>
          </div>
          <h5 ref="errorMessage" className="hidden" />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
          <div id="canvas1">
            <canvas id="canvas" width="400" height="400" ref="canvas" />
            <img
              ref={"image"}
              src={this.state.image}
              onLoad={this.handleImageLoaded}
              onError={this.handleImageErrored}
              className="hidden"
              id="image"
            />
            <p className="save" />
          </div>
        </div>
      </div>
    );
  }
});
