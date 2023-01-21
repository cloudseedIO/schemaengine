/**
 *
 * recordId
 * schema
 * rootSchema
 * record
 *
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var manageRecords = require("../../records/manageRecords.jsx");
var getContent = require("./getContent.jsx");
var global = require("../../../utils/global.js");
var common = require("../../common.jsx");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var SchemaStore = require("../../../stores/SchemaStore.js");

var EditOrView = React.createClass({
  getInitialState: function() {
    //var ep=this.getEditPrivilege();
    var property =
      typeof this.props.property == "object" &&
      !Array.isArray(this.props.property)
        ? Object.keys(this.props.property)[0]
        : this.props.property;
    var epdata = {
      property: property,
      rootSchema: this.props.rootSchema,
      org: this.props.org,
      schemaDoc: this.props.schemaDoc,
      fullRecord: this.props.fullRecord,
      recordId: this.props.recordId
    };
    var ep = getEditPrivileges(epdata);
    var current = "view";
    try {
      if (ep.canEdit) {
        if (this.props.defaultEdit) {
          current = "edit";
        } else if (
          (!this.props.fullRecord[property] ||
            this.props.fullRecord[property].length == 0) &&
          this.props.schemaDoc["@properties"][property].editIfNoData
        ) {
          current = "edit";
        }
      }
    } catch (err) {}

    return {
      value: this.props.fullRecord[property],
      canEdit: this.props.hideInlineEdit ? false : ep.canEdit,
      property: property,
      editMethod: ep.editMethod,
      current: current,
      shouldComponentUpdate: false,
      isDerivedProperty: ep.isDerivedProperty
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  setPropertyValue: function(property, value) {
    var dataType;
    try {
      dataType = this.props.schemaDoc["@properties"][property].dataType.type;
    } catch (err) {}
    if (JSON.stringify(value) != JSON.stringify(this.state.value)) {
      this.setState({ value: value, shouldComponentUpdate: false });
    } else if (dataType != "richText" && dataType != "tags") {
      this.cancel();
    }
    //this.setState({value:value,shouldComponentUpdate:false});
  },
  changeModeToEdit: function() {
    if (this.state.canEdit) {
      this.setState({ current: "edit", shouldComponentUpdate: true });
    } else {
      console.log("Can't Edit");
    }
  },
  cancel: function() {
    var self = this;
    this.setState({
      current: "view",
      value: self.props.fullRecord[self.state.property],
      shouldComponentUpdate: true
    });
  },
  updateValue: function() {
    var self = this;
    if ($("#uniqueDiv").length > 0) {
      $("#uniqueDiv").remove();
    }
    var value = {};
    var key = this.state.property;
    if (this.state.isDerivedProperty) {
      key = "dependentProperties";
      value.dependentProperties = {};
      value.dependentProperties[this.state.property] = this.state.value;
    } else {
      value[this.state.property] = this.state.value;
    }
    try {
      if (
        self.props.schemaDoc["@properties"][this.state.property].required &&
        !this.state.value
      ) {
        //common.createAlert("Try again","Value should not be empty");
        if (self.save.className.indexOf("pointer-events") == -1) {
          self.save.className += " pointer-events";
          self.save.parentNode.className += " cursorNotAllowed";
        }
        return;
      } else {
        self.save.className = self.save.className.replace("pointerEvents", "");
        self.save.parentNode.classNameself.save.parentNode.className.replace(
          "cursorNotAllowed",
          ""
        );
      }
    } catch (err) {}

    this.checkIdentifier(value, function(ures) {
      if (ures.unique) {
        //common.startLoader();
        WebUtils.doPost(
          "/generic?operation=updateRecord",
          {
            userId: common.getUserDoc().recordId,
            recordId: self.props.recordId,
            org: self.props.org,
            method: self.state.editMethod,
            updateKey: key,
            value: value
          },
          function(data) {
            //common.stopLoader();
            if (!self._isUnmounted)
              self.setState({ current: "view", shouldComponentUpdate: true });
          }
        );
      }
    });
  },
  checkIdentifier: function(createdDoc, callback) {
    var unique = true;
    var self = this;
    try {
      if (self.props.schemaDoc["@identifier"] != "recordId") {
        WebUtils.doPost(
          "/schema?operation=checkIdentifier",
          {
            org: this.props.org,
            schemaName: this.props.rootSchema,
            identifier: createdDoc[self.props.schemaDoc["@identifier"]]
              .trim()
              .toLowerCase()
          },
          function(result) {
            if (result.length > 0) {
              for (var f = 0; f < result.length; f++) {
                if (result[f].recordId != self.props.recordId) {
                  unique = false;
                  //common.createAlert("Duplicate","Alreay exists");
                  var node = document.createElement("span");
                  node.id = "uniqueDiv";
                  node.className = "errorMsg";
                  node.innerHTML =
                    "Record already exists with same value.Please fill with other data";
                  try {
                    $(
                      ".inlineEdit " +
                        "#" +
                        self.state.property +
                        " #" +
                        self.state.property +
                        "InCompleteError"
                    ).before(node);
                  } catch (err) {}
                  break;
                } else {
                  //do nothing
                }
              }
            }
            callback({ unique: unique });
          }
        );
      } else {
        callback({ unique: unique });
      }
    } catch (err) {
      callback({ unique: unique });
    }
  },
  componentDidMount: function() {
    if (this.state.canEdit) {
      if (this.props.tabData != undefined && this.props.showTab != undefined) {
        this.props.showTab(this.props.tabData);
      }
    }
  },
  componentDidUpdate: function() {
    if (this.state.current == "edit") {
      if (
        $(this.editDiv) &&
        $(this.editDiv).parents(".carousel-inner").length > 0
      ) {
        $(this.editDiv)
          .parents(".carousel-inner")
          .css("overflow", "visible");
      }
    } else {
      if (
        $(this.editDiv) &&
        $(this.editDiv).parents(".carousel-inner").length > 0
      ) {
        $(this.editDiv)
          .parents(".carousel-inner")
          .css("overflow", "hidden");
      }
    }
  },
  render: function() {
    var self = this;
    var record = self.props.fullRecord;
    var property = this.state.property;
    record[property] = this.state.value;
    var contentExists = false;
    if (typeof record[property] != "undefined") {
      contentExists = true;
      if (Array.isArray(record[property]) && record[property].length == 0) {
        contentExists = false;
      } else if (
        typeof record[property] == "object" &&
        Object.keys(record[property]).length == 0
      ) {
        contentExists = false;
      } else if (
        typeof record[property] == "string" &&
        record[property].trim() == ""
      ) {
        contentExists = false;
      }
    }
    /*** using formGroup prop for user-height alignment*/
    return (
      <div
        key={global.guid()}
        ref={div => {
          self["editDiv"] = div;
        }}
      >
        {this.state.current == "view" ? (
          <span
            onDoubleClick={this.changeModeToEdit}
            className={this.state.canEdit ? "pencil" : ""}
          >
            {contentExists ? (
              <getContent.GetContent
                formGroup={true}
                property={this.state.property}
                fullRecord={record}
                
                summary={self.props.summary}
                parentLayout={self.props.parentLayout}
                from={self.props.from}
                noDetail={self.props.noDetail}
                fullLayout={self.props.fullLayout}
                noGallery={self.props.noGallery}
                showTab={self.props.showTab}
                tabData={self.props.tabData}
                noFormGroup={self.props.noFormGroup}
                displayName={self.props.displayName}
                dependentSchema={self.props.dependentSchema}
                relatedSchemas={self.props.relatedSchemas}
                rootSchema={self.props.rootSchema}
                schemaDoc={self.props.schemaDoc}
                recordId={self.props.recordId}
                org={self.props.org}
                methods={self.props.methods}
                showingForRelatedViewOfRecordId={self.props.showingForRelatedViewOfRecordId}
              />/*{...this.props}*/
            ) : this.state.canEdit ? (
              <div className="fieldText no-padding-left headerField propertyName form-group">
                {
                  self.props.schemaDoc["@properties"][this.state.property]
                    .displayName
                }
              </div>
            ) : self.props.from && self.props.from == "table" ? (
              "-"
            ) : (
              ""
            )}
          </span>
        ) : (
          <span className="inlineEdit">
            <manageRecords.DataTypeDelegator
              key={global.guid()}
              innerComponent={true}
              inlineEdit={true}
              noDisplayName={self.props.from == "table"}
              org={self.props.org}
              propertyName={this.state.property}
              property={
                self.props.schemaDoc["@properties"][this.state.property]
              }
              defaultValue={this.state.value}
              permission={"edit"}
              setPropertyValue={self.setPropertyValue}
              getCurrentDoc={function() {
                return self.props.fullRecord;
              }}
            />
            <div className="inlineEditButtonGroup">
              <span
                type="submit"
                className={"link extra-padding-right inlineEditButton"}
                onClick={this.updateValue}
              >
                <span
                  ref={e => {
                    self["save"] = e;
                  }}
                >
                  {"Save"}
                </span>
              </span>
              <span
                type="submit"
                className={"link extra-padding-right inlineEditButton"}
                onClick={this.cancel}
              >
                {"Cancel"}
              </span>
            </div>
          </span>
        )}
      </div>
    );
  }
});
exports.EditOrView = EditOrView;

//{property,rootSchema,org,schemaDoc,fullRecord,recordId}
function getEditPrivileges(data) {
  var canEdit = false;
  var editMethod;
  var isDerivedProperty = false;
  var propertyToCheck = data.property;
  var roles = common.getSchemaRoleOnOrg(data.rootSchema, data.org);
  var schema = data.schemaDoc
    ? data.schemaDoc
    : SchemaStore.get(data.rootSchema);
  var record = data.fullRecord;

  var recordLevelSecurityPassed = false;
  try {
    if (
      schema["@properties"][data.property].dataType.type != "formula" ||
      schema["@properties"][data.property].dataType.enableEdit == true ||
      schema["@properties"][data.property].dataType.type == "translateField" ||
      schema["@properties"][data.property].dataType.resultType ==
        "translateField"
    ) {
      if (roles.cloudPointAdmin) {
        recordLevelSecurityPassed = true;
      } else if (
        schema["@security"] &&
        schema["@security"]["recordLevel"] &&
        schema["@security"]["recordLevel"].update
      ) {
        if (data.recordId == common.getUserDoc().recordId) {
          //this check is for User Schema record update by the same user
          recordLevelSecurityPassed = true;
        }
        if (
          schema["@security"]["recordLevel"].update == "all" ||
          schema["@security"]["recordLevel"].update == "public"
        ) {
          recordLevelSecurityPassed = true;
        } else {
          var secInfo = record[schema["@security"]["recordLevel"].update];
          if (
            secInfo && //if record it self containing the @security information
            (JSON.stringify(secInfo).indexOf(userId) != -1 ||
              JSON.stringify(secInfo).indexOf("public") != -1 ||
              JSON.stringify(secInfo).indexOf("all") != -1)
          ) {
            recordLevelSecurityPassed = true;
          }
        }
      } else {
        recordLevelSecurityPassed = true;
      }

      if (recordLevelSecurityPassed && roles.methods) {
        var EditMethods = [];
        if (roles.methods == "all") {
          EditMethods = Object.keys(schema["@operations"].update);
        } else if (Array.isArray(roles.methods)) {
          for (var index in roles.methods) {
            if (schema["@operations"].update[roles.methods[index]]) {
              EditMethods.push(roles.methods[index]);
            }
          }
        }

        if (schema["@properties"][data.property].derivedProperty) {
          isDerivedProperty = true;
          propertyToCheck = "dependentProperties";
        }
        for (var index1 in EditMethods) {
          if (
            schema["@operations"].update[EditMethods[index1]].update.indexOf(
              propertyToCheck
            ) > -1
          ) {
            canEdit = true;
            editMethod = EditMethods[index1];
            break;
          }
        }

        // checking the state of the record
        //assigning state if no state in the record
        if (
          typeof record != "undefined" &&
          typeof record["$status"] == "undefined"
        ) {
          record["$status"] = schema["@initialState"]
            ? schema["@initialState"]
            : "draft";
        }
        //processing state machine
        if (
          schema["@state"] &&
          typeof schema["@state"] == "object" &&
          Object.keys(schema["@state"]).length > 0
        ) {
          if (schema["@state"][record["$status"]][editMethod]) {
            canEdit = true;
          } else {
            canEdit = false;
          }
        }
      }
    }
  } catch (err) {
    //console.log("from EditOrView.jsx -> "+" "+err.name+" : "+err.message);
  }
  return {
    canEdit: canEdit,
    editMethod: editMethod,
    isDerivedProperty: isDerivedProperty
  };
}
exports.getEditPrivileges = getEditPrivileges;
