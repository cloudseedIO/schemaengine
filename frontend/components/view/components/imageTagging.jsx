/**
 *@author vikram & naveed
 */

var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../../common.jsx");
var manageRecords = require("../../records/manageRecords.jsx");
var genericView = require("../genericView.jsx");
var JunctionStore = require("../../../stores/JunctionStore");
var ActionCreator = require("../../../actions/ActionCreator.js");
var SchemaStore = require("../../../stores/SchemaStore.js");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var global = require("../../../utils/global.js");
/**
 * imageUrl,recordId,org,rootSchema,relation{relationName,relationRefSchema}
 */
var TagImage = React.createClass({
  getInitialState: function() {
    return {
      records: JunctionStore.getRelatedRecords({
        recordId: this.props.recordId,
        relationName: this.props.relation.relationName,
        rootSchema: this.props.rootSchema,
        relationRefSchema: this.props.relation.relationRefSchema,
        userId: common.getUserDoc().recordId,
        skip: 0,
        org: this.props.org
      }),
      skip: 0
    };
  },
  _onChange: function() {
    var self = this;
    this.setState(
      {
        records: JunctionStore.getRelatedRecords({
          recordId: this.props.recordId,
          relationName: this.props.relation.relationName,
          rootSchema: this.props.rootSchema,
          relationRefSchema: this.props.relation.relationRefSchema,
          userId: common.getUserDoc().recordId,
          skip: this.state.skip,
          org: this.props.org
        })
      },
      function() {
        common.startLoader();
        self.assignTag();
      }
    );
  },
  componentWillUnmount: function() {
    JunctionStore.removeChangeListener(
      this._onChange,
      this.props.recordId + "-" + this.props.relation.relationName
    );
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },
  componentDidMount: function() {
    var self = this;
    ActionCreator.getRelatedRecords({
      recordId: this.props.recordId,
      relationName: this.props.relation.relationName,
      rootSchema: this.props.rootSchema,
      relationRefSchema: this.props.relation.relationRefSchema,
      userId: common.getUserDoc().recordId,
      skip: 0,
      org: this.props.org
    });
    JunctionStore.addChangeListener(
      this._onChange,
      this.props.recordId + "-" + this.props.relation.relationName
    );
    var $img = $(this.length);

    if ($img.length > 0 && !$img.get(0).complete) {
      common.startLoader();
      $img.on("load", self.assignTag);
    }
    //this.assignTag();
  },
  componentDidUpdate: function() {
    this.assignTag();
  },
  assignTag: function() {
    var self = this;
    if (this.state.records != "") {
      setTimeout(function() {
        self.state.records.map(function(data, index) {
          common.stopLoader();
          var tagY = (self.image.height * data.value.coordY) / 100;
          var tagX = (self.image.width * data.value.coordX) / 100;
          var style =
            "display:block; position:absolute; color:#67ff6b; left:" +
            tagX +
            "px; top:" +
            tagY +
            "px;";
          if (self["tag" + index]) {
            self["tag" + index].setAttribute("style", style);
          }
        });
      }, 2000);
    }
  },
  createTag: function(event) {
    var self = this;
    knownData = {};
    knownData[this.props.relation.knownKey] = self.props.recordId;
    var totalY = self.image.height;
    var totalX = self.image.width;
    knownData.coordX = (event.nativeEvent.layerX / totalX) * 100;
    knownData.coordY = (event.nativeEvent.layerY / totalY) * 100;

    WebUtils.doPost(
      "/generic?operation=getSchemaRoleOnOrg",
      {
        schema: this.props.relation.relationRefSchema,
        userId: common.getUserDoc().recordId,
        org: this.props.org ? this.props.org : "public"
      },
      function(response) {
        if (response && response.create && response.create != "") {
          var editFields = [];
          var readOnlyFields = [];
          var schemaDoc = SchemaStore.get(
            self.props.relation.relationRefSchema
          );
          if (
            schemaDoc &&
            schemaDoc["@operations"] &&
            schemaDoc["@operations"].create
          ) {
            if (
              schemaDoc["@operations"].create[response.create] &&
              schemaDoc["@operations"].create[response.create].in
            ) {
              editFields = schemaDoc["@operations"].create[response.create].in;
            } else {
              editFields = Object.keys(schemaDoc["@properties"]);
            }
            readOnlyFields = Object.keys(schemaDoc["@properties"]);
          }

          var node = document.createElement("div");
          node.id = global.guid();
          var popUpId = global.guid();
          var contentDivId = global.guid();
          var sideDivId = global.guid();
          node.className =
            "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
          document
            .getElementById("lookUpDialogBox")
            .parentNode.appendChild(node);
          ReactDOM.render(
            <common.GenericPopUpComponent
              popUpId={popUpId}
              contentDivId={contentDivId}
              sideDivId={sideDivId}
              alignMiddleDiv={true}
            />,
            node
          );
          ReactDOM.render(
            <manageRecords.DisplayCustomSchema
              data={self.props.relation.relationRefSchema}
              schemaName={self.props.relation.relationRefSchema}
              callbackToClosePopup={function() {
                common.showMainContainer();
                node.remove();
              }}
              knownData={knownData}
              editFields={editFields}
              readOnlyFields={readOnlyFields}
              org={self.props.org}
            />,
            document.getElementById(contentDivId)
          );
        }
      }
    );
  },
  showContent: function(index) {
    this["content" + index].style.display = "inline";
  },
  hideContent: function(index) {
    this["content" + index].style.display = "none";
  },
  render: function() {
    var self = this;
    return (
      <div
        key={global.guid()}
        className="col-lg-10 col-md-10 col-sm-10 col-xs-12 no-padding"
        style={{ position: "relative" }}
      >
        <img
          onClick={this.createTag}
          src={this.props.imageUrl}
          className="img-responsive taggableImage no-margin"
          ref={e => {
            this.image = e;
          }}
        />
        {self.state.records.map(function(data, index) {
          if (data.value.coordX && data.value.coordY) {
            return (
              <div
                key={global.guid()}
                style={{ display: "none" }}
                ref={e => {
                  self["tag" + index] = e;
                }}
              >
                <div>
                  <span
                    onMouseOver={self.showContent.bind(null, index)}
                    onMouseOut={self.hideContent.bind(null, index)}
                    className="fa fa-2x fa-tag swingtag"
                  />
                </div>
                <div
                  ref={e => {
                    self["content" + index] = e;
                  }}
                  onClick={self.close}
                  style={{ display: "none" }}
                  className="tagPopUp row no-margin"
                >
                  <span className="fa fa-2x fa-tag " />
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <genericView.GoIntoDetail
                      rootSchema={self.props.relation.relationRefSchema}
                      relatedSchemas={self.state.relatedSchemas}
                      data={data.value}
                      viewName={"getDetail"}
                      recordId={data.id}
                      org={self.props.org}
                      methods={data.methods}
                    />
                  </div>
                </div>
              </div>
            );
          } else {
            return <div key={global.guid()} style={{ display: "none" }} />;
          }
        }, this)}
      </div>
    );
  }
});
exports.TagImage = TagImage;
