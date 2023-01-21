/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../common.jsx");
var genericView = require("../view/genericView.jsx");
var FilterResults = require("../nav/filters.jsx").FilterResults;
var FilterResultsNew = require("../nav/filters.jsx").FilterResultsNew;
var ActionCreator = require("../../actions/ActionCreator.js");
var SchemaStore = require("../../stores/SchemaStore");
var JunctionStore = require("../../stores/JunctionStore");
var RecordDetailStore = require("../../stores/RecordDetailStore");
var WebUtils = require("../../utils/WebAPIUtils.js");
var utility = require("../Utility.jsx");
var limitCount = require("../../utils/global.js").limitCount; //18;
var RecordSummaryStore = require("../../stores/RecordSummaryStore");
var getURLContent = require("../view/components/getURLContent.jsx");
var getContent = require("../view/components/getContent.jsx");
var linkGenerator = require("../nav/linkGenerator.jsx");
var global = require("../../utils/global.js");
var Link = require("react-router").Link;
var browserHistory = require("react-router").browserHistory;
var Editor = require("./richTextEditor.jsx").MyEditor;
var TagsInput = require("./tagsInput.jsx").TagsInput;
var groupBy = require("../view/components/groupBy.jsx");
var ServerActionReceiver = require("../../actions/ServerActionReceiver.js");
var genericNav = require("../nav/genericNav.jsx");

/*try{
 	window.openSchemaRender=function(schemaName,knownData,recordId,editMethod){
		var node = document.createElement("div");
		node.id = global.guid();
		var popUpId = global.guid();
		var contentDivId = global.guid();
		var sideDivId = global.guid();
		node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
		ReactDOM.render(<DisplayCustomSchema schemaName={schemaName} recordId={recordId} editMethod={editMethod} knownData={knownData}/>,document.getElementById(contentDivId));
	};
}catch(err){


}

*/

var CreateRecord = React.createClass({
  render: function() {
    if (!common.isAdmin()) {
      return (
        <div>
          <h1>Un authorized to access this Page.</h1>
        </div>
      );
    }
    return <CreateNewRecord type={"new"} />;
  }
});
exports.CreateRecord = CreateRecord;

var EditRecord = React.createClass({
  render: function() {
    if (!common.isAdmin()) {
      return (
        <div>
          <h1>Un authorized to access this Page.</h1>
        </div>
      );
    }
    return <CreateNewRecord type={"edit"} />;
  }
});
exports.EditRecord = EditRecord;

var CreateNewRecord = React.createClass({
  getInitialState: function() {
    return {
      selectedSchema: undefined,
      recordId: undefined
    };
  },
  selectSchema: function() {
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
      <utility.SelectSchema callback={this.gotSchemaName} popUpId={popUpId} />,
      document.getElementById(contentDivId)
    );
  },
  gotSchemaName: function(name) {
    var self = this;
    this.setState({ selectedSchema: name }, function() {
      if (self.props.type == "edit") {
        self.getRecordId();
      }
    });
  },
  getRecordId: function() {
    var node = document.createElement("div");
    node.id = global.guid();
    node.className =
      "lookUpDialogBox lookUpFromDCS  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(
      <LookupComponent
        schema={this.state.selectedSchema}
        org={this.props.org ? this.props.org : "public"}
        callback={this.gotRecordId}
      />,
      node
    );
  },
  gotRecordId: function(data) {
    this.setState({ recordId: data.id });
  },
  componentDidMount: function() {
    this.selectSchema();
  },
  render: function() {
    if (this.state.selectedSchema == undefined) {
      return (
        <button className="upload-btn" onClick={this.selectSchema}>
          Select Schema
        </button>
      );
    } else if (this.props.type == "new") {
      return <DisplayCustomSchema schemaName={this.state.selectedSchema} />;
    } else if (this.props.type == "edit") {
      if (this.state.recordId == undefined) {
        return (
          <button className="upload-btn" onClick={this.getRecordId}>
            Select Record to Edit
          </button>
        );
      } else {
        return (
          <DisplayCustomSchema
            schemaName={this.state.selectedSchema}
            recordId={this.state.recordId}
            editMethod={"Edit"}
          />
        );
      }
    } else {
      return null;
    }
  }
});

/**
 * schemaName
 * [knownData]
 * [recordId,editMethod]
 * [fromPopUp,contentDivId]
 * [srFilters,filterKeys]
 */
var DisplayCustomSchema = React.createClass({
  getInitialState: function() {
    return {
      schemaName: this.props.schemaName,
      schema: undefined,
      createdDoc: this.props.createdDoc ? this.props.createdDoc : {},
      editFields: this.props.editFields ? this.props.editFields : [],
      readOnlyFields: this.props.readOnlyFields
        ? this.props.readOnlyFields
        : [],
      selectedObjects: {},
      shouldComponentUpdate: false,
      currentWindowImages: [],
      actions: []
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  getCurrentDoc: function() {
    return this.state.createdDoc;
  },
  setSelectedObject: function(object) {
    var selectedObjects = this.state.selectedObjects;
    if (!selectedObjects[object.id]) {
      selectedObjects[object.id] = object.value;
      this.setState({
        selectedObjects: selectedObjects,
        shouldComponentUpdate: false
      });
    }
  },
  addToCurrentWindowImages: function(imageId) {
    var current = this.state.currentWindowImages;
    current.push(imageId);
    this.setState({
      currentWindowImages: current,
      shouldComponentUpdate: false
    });
  },
  setPropertyValue: function(property, value, forceUpdate) {
    var self = this;
    var currentDoc = this.state.createdDoc;
    currentDoc[property] = value;
    try {
      if (!$("#" + property + "InCompleteError").hasClass("hidden")) {
        $("#" + property + "InCompleteError").addClass("hidden");
      }
    } catch (err) {}
    if (this.props.setPropertyValue) {
      //this is for inner struct informing to parent
      this.props.setPropertyValue(
        this.props.propertyName,
        currentDoc,
        this.props.fromArray
      );
    } else {
      //this is for main rendering
      if (
        this.state.schema["@type"] == "abstractObject" &&
        this.state.schema["@dependentKey"] &&
        this.state.schema["@dependentKey"] == property &&
        this.state.schema["@properties"][property].dataType.derived
      ) {
        var currentSchema = this.state.schema;
        currentSchema["@properties"]["dependentProperties"] = {
          description: value + "  properties",
          prompt: value + "  properties",
          displayName: "",
          dataType: {
            type: "struct",
            structRef: this.props.schemaName + "-" + value
          }
        };
        self.setState({
          schema: currentSchema,
          createdDoc: currentDoc,
          shouldComponentUpdate: true
        });
        /*WebUtils.doPost("/generic?operation=getMainSchema",{"schema":this.props.schemaName+"-"+value},function(result){
                 });*/
      } else {
        self.setState(
          {
            createdDoc: currentDoc,
            shouldComponentUpdate: forceUpdate ? true : false
          },
          function() {
            self.evaluateFormulas(function() {
              try {
                if (
                  self.state.editFields.length == 1 &&
                  self.state.createdDoc[self.state.editFields[0]] &&
                  property == self.state.editFields[0] &&
                  self.state.schema["@properties"][self.state.editFields[0]]
                    .dataType.type == "object"
                ) {
                  self.saveRecord();
                }
              } catch (err) {}
            });
          }
        );
      }
    }
  },
  calculateFormulaValue: function(key, callback) {
    /**
    	 *
			sum poLines__amount(PurchaseOrder)
			#author__recordId(Message
			City__cityName(MfrProCatCity)

			(MfrRFQResponse)
			MfrRFQ__quantity * MfrRFQ__unitPrice

			(PurchaseOrderLines)
			quantity * item__price
    	 */
    var record = this.state.createdDoc;
    var schema = this.state.schema;
    var lookUpData = this.state.selectedObjects;
    var formulaField = schema["@properties"][key];
    var separators = [" ", "\\+", "-", "\\(", "\\)", "\\*", "/", ":", "\\?"];
    var expression = schema["@properties"][key].dataType.expression.trim();
    //formula function hack
    if (expression.indexOf("sum") == 0) {
      expression = expression.replace("sum", "");
      expression = expression.trim();
    }
    var tokens = expression.split(new RegExp(separators.join("|"), "g"));
    var formulaResult;

    var valueCalculated = [];
    var NA = "";
    evaluateTokens(0);
    function evaluateTokens(i) {
      if (i >= tokens.length) {
        if (valueCalculated.indexOf(true) > -1) {
          try {
            formulaResult = eval(expression);
          } catch (err) {
            console.log("All tokens done");
            console.log(err.name);
            console.log(err.message);
          }
        }
        callback(formulaResult);
      } else {
        if (
          tokens[i].trim() != "" &&
          isNaN(+tokens[i]) &&
          expression.search(tokens[i]) != -1
        ) {
          var ffFields = tokens[i].split("__");
          if (
            tokens[i].indexOf("#") == 0 ||
            tokens[i].indexOf("author") == 0 ||
            tokens[i].indexOf("editor") == 0 ||
            tokens[i].indexOf("dateModified") == 0 ||
            tokens[i].indexOf("dateCreated") == 0 ||
            tokens[i].indexOf("org") == 0
          ) {
            ffFields[0] = ffFields[0].replace("#", "");
            var oneValue;
            if (ffFields[0].indexOf("#") == 0) {
              expression = expression.replace(
                tokens[i],
                '"' + ffFields[0].replace("#", "") + '"'
              );
              valueCalculated.push(true);
              evaluateTokens(i + 1);
            } else if (ffFields.length == 1) {
              expression = expression.replace(
                tokens[i],
                '"' + record[tokens[i]] + '"'
              );
              valueCalculated.push(true);
              evaluateTokens(i + 1);
            } else if (ffFields.length == 2) {
              if (record[ffFields[0]]) {
                expression = expression.replace(
                  tokens[i],
                  '"' + lookUpData[record[ffFields[0]]][ffFields[1]] + '"'
                );
                valueCalculated.push(true);
              } else {
                expression = expression.replace(tokens[i], '"' + "NA" + '"');
                valueCalculated.push(false);
              }
              evaluateTokens(i + 1);
            } else {
              ivaluateExpression(
                {
                  record: record,
                  expression:
                    "this." + tokens[i].replace("#", "").replace(/__/g, ".")
                },
                function(result) {
                  if (result && result != "error") {
                    expression = expression.replace(
                      tokens[i],
                      '"' + result + '"'
                    );
                    valueCalculated.push(true);
                  } else {
                    expression = expression.replace(
                      tokens[i],
                      '"' + "NA" + '"'
                    );
                    valueCalculated.push(false);
                  }
                  evaluateTokens(i + 1);
                }
              );
            }
          } else if (ffFields.length == 1) {
            oneValue = JSON.stringify(record[tokens[i]]);
            if (typeof record[tokens[i]] == "object") {
              oneValue = (
                "JSON.parse('" +
                JSON.stringify(record[tokens[i]]) +
                "')"
              ).replace(/\\\"/g, "");
            }
            valueCalculated.push(true);
            expression = expression.replace(tokens[i], oneValue);
            evaluateTokens(i + 1);
          } else if (ffFields.length == 2) {
            if (record[ffFields[0]]) {
              if (
                schema["@properties"][ffFields[0]] &&
                schema["@properties"][ffFields[0]].dataType &&
                schema["@properties"][ffFields[0]].dataType.type
              ) {
                if (
                  schema["@properties"][ffFields[0]].dataType.type == "object"
                ) {
                  var valueObject = lookUpData[record[ffFields[0]]];
                  if (valueObject) {
                    oneValue = JSON.stringify(valueObject[ffFields[1]]);
                    if (typeof valueObject[ffFields[1]] == "object") {
                      oneValue = (
                        "JSON.parse('" +
                        JSON.stringify(valueObject[ffFields[1]]) +
                        "')"
                      ).replace(/\\\"/g, "");
                    }
                    expression = expression.replace(tokens[i], oneValue);
                    valueCalculated.push(true);
                  } else {
                    expression = expression.replace(tokens[i], "NA");
                    valueCalculated.push(false);
                  }
                } else if (
                  schema["@properties"][ffFields[0]].dataType.type == "struct"
                ) {
                  expression = expression.replace(
                    tokens[i],
                    '"' + record[ffFields[0]][ffFields[1]] + '"'
                  );
                  valueCalculated.push(true);
                } else if (
                  schema["@properties"][ffFields[0]].dataType.type == "array"
                ) {
                  var innerArrayValue = "";
                  if (
                    schema["@properties"][ffFields[0]].dataType.elements.type ==
                    "struct"
                  ) {
                    for (var j = 0; j < record[ffFields[0]].length; j++) {
                      if (innerArrayValue) {
                        innerArrayValue += " + ";
                      }
                      innerArrayValue += record[ffFields[0]][j][ffFields[1]];
                      valueCalculated.push(true);
                    }
                  } else if (
                    schema["@properties"][ffFields[0]].dataType.elements.type ==
                    "object"
                  ) {
                    for (var j = 0; j < record[ffFields[0]].length; j++) {
                      if (innerArrayValue) {
                        innerArrayValue += " + ";
                      }
                      if (lookUpData[record[ffFields[0]][j]] && lookUpData[record[ffFields[0]][j]][ffFields[1]]) {
                        innerArrayValue +=
                          JSON.stringify(lookUpData[record[ffFields[0]][j]][ffFields[1]]);
                        valueCalculated.push(true);
                      } else {
                        valueCalculated.push(false);
                      }
                    }
                  }
                  try {
                    innerArrayValue =
                      innerArrayValue != "" ? eval(innerArrayValue) : "";
                  } catch (err) {
                    console.log("ffFields length 2");
                    console.log(err.name);
                    console.log(err.message);
                  }
                  expression = expression.replace(
                    tokens[i],
                    '"' + innerArrayValue + '"'
                  );
                } else {
                  expression = expression.replace(
                    tokens[i],
                    '"' + record[ffFields[0]][ffFields[1]] + '"'
                  );
                }
              }
            } else {
              expression = expression.replace(tokens[i], "NA");
              valueCalculated.push(false);
            }
            evaluateTokens(i + 1);
          } else {
            ivaluateExpression(
              {
                record: record,
                expression: "this." + tokens[i].replace(/__/g, ".")
              },
              function(result) {
                if (result && result != "error") {
                  expression = expression.replace(
                    tokens[i],
                    '"' + result + '"'
                  );
                  valueCalculated.push(true);
                } else {
                  expression = expression.replace(tokens[i], '"' + "NA" + '"');
                  valueCalculated.push(false);
                }
                evaluateTokens(i + 1);
              }
            );
          }
        } else {
          valueCalculated.push(true);
          evaluateTokens(i + 1);
        }
      }
    }
  },
  evaluateFormulas: function(callback) {
    var self = this;
    var record = this.state.createdDoc;
    var schema = this.state.schema;
    //  var lookUpData=this.state.selectedObjects;
    var recordUpdateFlag = false;
    var allFormulas = [];
    for (var key in schema["@properties"]) {
      if (
        !Array.isArray(schema["@properties"][key]) &&
        schema["@properties"][key] != null &&
        schema["@properties"][key].dataType &&
        schema["@properties"][key].dataType.type == "formula"
      ) {
        allFormulas.push(key);
      }
    }
    calculateFormula(0);
    function calculateFormula(index) {
      if (index < allFormulas.length) {
        self.calculateFormulaValue(allFormulas[index], function(result) {
          if (
            result != undefined &&
            JSON.stringify(record[allFormulas[index]]) != JSON.stringify(result)
          ) {
            var forceUpdate =
              self.state.editFields.indexOf(allFormulas[index]) > 0;
            self.setPropertyValue(allFormulas[index], result, forceUpdate);
            //record[allFormulas[index]]=result;
            //self.setState({createdDoc:record,shouldComponentUpdate:true});
          }
          calculateFormula(index + 1);
        });
      } else {
        if (typeof callback == "function") {
          callback();
        }
      }
    }
  },
  saveRecord: function(action) {
    var self = this;
    var record = this.state.createdDoc;
    var schema = this.state.schema;
    var saveFlag = true;
    //  var lookUpData=this.state.selectedObjects;
    var editFields = this.state.editFields;
    if (editFields.length == 0) {
      return;
    }
    //Identifier checking
    var idpn = "";
    var idValue = "";
    if (
      schema["@identifier"] &&
      schema["@identifier"] != "recordId" &&
      schema["@identifier"] != "" &&
      editFields.indexOf(schema["@identifier"]) > -1
    ) {
      //idpn=(schema["@properties"][schema["@identifier"]].displayName)?(schema["@properties"][schema["@identifier"]].displayName):schema["@identifier"];
      idValue = record[schema["@identifier"]];
      if (!idValue || idValue == "") {
        moveScroll(schema["@identifier"]);
        try {
          $(
            "#" +
              schema["@id"] +
              " " +
              "#" +
              schema["@identifier"] +
              "InCompleteError"
          ).removeClass("hidden");
        } catch (err) {}
        //common.createAlert("In complete","Missing: "+idpn);
        saveFlag = false;
        return;
      }
    }
    //Checking required fields
    for (var key in schema["@properties"]) {
      //  var displayName=schema["@properties"][key].displayName?schema["@properties"][key].displayName:key;
      if (schema["@properties"][key].required && editFields.indexOf(key) > -1) {
        if (!record[key] || record[key] == "" || record[key].length == 0) {
          moveScroll(key);
          try {
            $(
              "#" + schema["@id"] + " " + "#" + key + "InCompleteError"
            ).removeClass("hidden");
          } catch (err) {}
          //common.createAlert("In complete","Missing: "+displayName);
          saveFlag = false;
          break;
        }
      }
    }
    if (!saveFlag) {
      return;
    }
    //checking identifier uniqueness
    if (idValue) {
      this.checkUnique(record, function(data) {
        if (!data.unique) {
          moveScroll(schema["@identifier"]);
          try {
            $(
              "#" +
                schema["@id"] +
                " " +
                "#" +
                schema["@identifier"] +
                "InCompleteError"
            )
              .removeClass("hidden")
              .html("Should be unique and not empty");
          } catch (err) {}
          //common.createAlert("Duplicate",idpn+" should be unique");
        } else if (data.unique) {
          self.checkDependentProperties(record, function(dpv) {
            if (dpv.valid) {
              self.continueSaving(record, action);
            }
          });
        }
      });
    } else {
      self.checkDependentProperties(record, function(dpv) {
        if (dpv.valid) {
          self.continueSaving(record, action);
        }
      });
    }
  },
  checkUniquenessInOrg: function(org, createdDoc, callback) {
    var unique = true;
    common.startLoader();
    WebUtils.doPost(
      "/schema?operation=checkIdentifier",
      {
        org: org,
        schemaName: this.props.schemaName,
        identifier: createdDoc[this.state.schema["@identifier"]]
          .trim()
          .toLowerCase()
      },
      function(result) {
        common.stopLoader();
        if (result.length > 0) {
          for (var f = 0; f < result.length; f++) {
            if (result[f].recordId != createdDoc["recordId"]) {
              unique = false;
              break;
            }
          }
        }
        callback({ unique: unique });
      }
    );
  },
  checkUnique: function(createdDoc, callback) {
    var self = this;
    if (
      this.state.schema.hasOwnProperty("@identifier") &&
      this.state.schema["@identifier"] != "" &&
      this.state.schema["@identifier"] != "recordId"
    ) {
      if (this.props.org != "public") {
        this.checkUniquenessInOrg("public", createdDoc, function(put) {
          self.checkUniquenessInOrg(self.props.org, createdDoc, function(cout) {
            if (!put.unique || !cout.unique) {
              if (!put.unique && !cout.unique) {
                callback({ unique: false });
              } else if (!put.unique) {
                var confirmMessage =
                  "Given name already exists in public content. Do you wish to create new in the current org?";
                if (self.props.editMethod) {
                  confirmMessage =
                    "Edited name already exists in public content. Do you wish to continue?";
                }
                common.createConfirm("Confirm", confirmMessage, function(
                  confirm
                ) {
                  if (confirm) {
                    callback({ unique: cout.unique });
                  } else {
                    callback({ unique: false });
                  }
                });
              } else {
                callback({ unique: cout.unique });
              }
            } else {
              callback({ unique: true });
            }
          });
        });
      } else {
        this.checkUniquenessInOrg(this.props.org, createdDoc, callback);
      }
    } else {
      callback({ unique: true });
    }
  },
  checkDependentProperties: function(createdDoc, callback) {
    //	var self=this;
    var valid = true;
    if (
      this.state.schema &&
      this.state.schema["@type"] &&
      this.state.schema["@type"] == "abstractObject"
    ) {
      var dependentKey;
      if (typeof this.state.schema["@properties"] == "object") {
        for (var key in this.state.schema["@properties"]) {
          if (
            !Array.isArray(this.state.schema["@properties"][key]) &&
            this.state.schema["@properties"][key] != null &&
            this.state.schema["@properties"][key].dataType &&
            this.state.schema["@properties"][key].dataType.derived
          ) {
            dependentKey = key;
            break;
          }
        }
      }
      if (
        createdDoc[dependentKey] == undefined ||
        createdDoc[dependentKey] == ""
      ) {
        //var idpn=(this.state.schema["@properties"][dependentKey].displayName)?(this.state.schema["@properties"][dependentKey].displayName):dependentKey;
        //common.createAlert("In complete","Missing "+idpn);
        //valid=false;
        callback({ valid: valid });
        return;
      }
      var dependentSchemaName =
        this.state.schema["@id"] + "-" + createdDoc[dependentKey];
      WebUtils.getMainSchema(dependentSchemaName, function(schemaRes) {
        if (schemaRes && schemaRes["@properties"]) {
          for (var key in schemaRes["@properties"]) {
            if (schemaRes["@properties"][key].required) {
              if (
                !createdDoc.dependentProperties ||
                createdDoc.dependentProperties[key] == undefined ||
                createdDoc.dependentProperties[key] == ""
              ) {
                //	var idpn=(schemaRes["@properties"][key].displayName)?(schemaRes["@properties"][key].displayName):key;
                moveScroll(key);
                try {
                  $(
                    "#" + schemaRes["@id"] + " " + "#" + key + "InCompleteError"
                  ).removeClass("hidden");
                } catch (err) {}
                //common.createAlert("In complete","Missing "+idpn);
                valid = false;
                break;
              }
            }
          }
        }
        callback({ valid: valid });
      });
    } else {
      callback({ valid: valid });
    }
  },
  continueSaving: function(record, action) {
    var self = this;
    try {
      this.saveButton.disabled = "disabled";
    } catch (err) {}
    if (this.props.editMethod) {
      common.startLoader();
      WebUtils.doPost(
        "/generic?operation=updateRecord",
        {
          userId: common.getUserDoc().recordId,
          recordId: this.props.recordId,
          org: this.props.org ? this.props.org : "public",
          method: this.props.editMethod,
          value: record
        },
        function(data) {
          //If saveRecordUpdate callback is passed
          try {
            if (typeof self.props.saveRecordUpdate == "function") {
              self.props.saveRecordUpdate(record);
            }
          } catch (err) {}
          common.stopLoader();
          if (typeof data.recRes == "object") {
            data.recRes.schema = self.props.schemaName;
            data.recRes.recordId = self.props.recordId;
            data.recRes.dependentSchema = self.dependentSchema;
            data.recRes.userId = common.getUserDoc().recordId;
            data.recRes.org = self.props.org ? self.props.org : "public";
            ServerActionReceiver.receiveSchemaRecord(data.recRes);
          }
          try {
            require("../socket.io.js").socket.emit(
              self.props.recordId,
              "RecordUpdated"
            );
          } catch (err) {}
          if (
            self.props.createCallback &&
            typeof self.props.createCallback == "function"
          ) {
            self.props.createCallback(record);
            return;
          }
          if (
            self.props.fromPopUp &&
            document.getElementById(self.props.contentDivId)
          ) {
            ReactDOM.unmountComponentAtNode(
              document.getElementById(self.props.contentDivId)
            );
            JunctionStore.clearJunctionsForRecord(self.props.recordId);
            ReactDOM.render(
              <genericView.GoIntoDetail
                rootSchema={self.props.schemaName}
                dependentSchema={self.props.dependentSchema}
                recordId={self.props.recordId}
                fromPopUp={self.props.fromPopUp}
                record={RecordDetailStore.getSchemaRecord({
                  schema: self.props.data,
                  recordId: self.props.recordId,
                  userId: common.getUserDoc().recordId,
                  org: self.props.org ? self.props.org : "public"
                })}
                gotRecord={true}
                contentDivId={self.props.contentDivId}
                org={self.props.org ? self.props.org : "public"}
              />,
              document.getElementById(self.props.contentDivId)
            );
            return;
          }
          browserHistory.push(
            linkGenerator.getDetailLink({
              record: record,
              org: self.props.org ? self.props.org : "public",
              schema: self.props.schemaName,
              recordId: self.props.recordId,
              dependentSchema: self.props.dependentSchema
            })
          );
          return;
        }
      );
    } else {
      setTimeout(function() {}, 5000);
      common.startLoader();
      WebUtils.doPost(
        "/generic?operation=saveRecord",
        record,
        function(result) {
          try {
            if (self.state.schema["@superType"] == "Organization")
              common.reloadSession();
          } catch (err) {}
          ActionCreator.createRecord(record);
          if (typeof action != "undefined" && action != "" && action != null) {
            WebUtils.doPost(
              "/generic?operation=updateRecord",
              {
                userId: common.getUserDoc().recordId,
                recordId: record.recordId,
                org: self.props.org,
                method: action
              },
              function(data) {}
            );
          }
          common.stopLoader();
          if (
            self.props.createCallback &&
            typeof self.props.createCallback == "function"
          ) {
            self.props.createCallback(record, result);
            return;
          }
          if (self.props.callbackToCreatedRecord) {
            self.props.callbackToCreatedRecord(record, result);
            return;
          }
          if (self.props.callbackToClosePopup) {
            self.props.callbackToClosePopup(record, result);
            return;
          }
          var ds; // "@derivedObjName": "Product-Faucet",
          if (record["@derivedObjName"]) {
            ds = record["@derivedObjName"].split("-")[1];
          }
          if (
            self.props.fromPopUp &&
            document.getElementById(self.props.contentDivId)
          ) {
            ReactDOM.unmountComponentAtNode(
              document.getElementById(self.props.fromPopUp)
            );
            JunctionStore.clearJunctionsForRecord(record.recordId);
            ReactDOM.render(
              <genericView.GoIntoDetail
                rootSchema={self.props.schemaName}
                dependentSchema={ds}
                recordId={record.recordId}
                fromPopUp={self.props.fromPopUp}
                contentDivId={self.props.contentDivId}
                org={self.props.org ? self.props.org : "public"}
              />,
              document.getElementById(self.props.contentDivId)
            );
            return;
          }
          browserHistory.push(
            linkGenerator.getDetailLink({
              record: record,
              org: self.props.org ? self.props.org : "public",
              schema: self.props.schemaName,
              recordId: record.recordId,
              dependentSchema: ds
            })
          );
          return;
        }.bind(this)
      );
    }
  },
  componentDidMount: function() {
    var self = this;
    WebUtils.doPost(
      "/generic?operation=getSchemaRoleOnOrg",
      {
        schema: this.props.schemaName,
        userId: common.getUserDoc().recordId,
        org: this.props.org ? this.props.org : "public"
      },
      function(privileges) {
        if (typeof self.props.setPropertyValue == "function") {
          privileges = {
            create: "createAll",
            detailView: "getDetail",
            methods: "all",
            navViews: "all"
          };
        }
        WebUtils.doPost(
          "/generic?operation=getMainSchema",
          { schema: self.props.schemaName },
          function(currentSchema) {
            if (self.props.recordId) {
              WebUtils.doPost(
                "/schema?operation=getRecord",
                { name: self.props.recordId },
                function(savedRecord) {
                  self.gotSchemaAndRecord(
                    currentSchema,
                    savedRecord.data,
                    privileges
                  );
                }
              );
            } else {
              var record = self.props.knownData
                ? Object.assign({}, self.props.knownData)
                : {};
              if (
                self.props.createdDoc != null &&
                typeof self.props.createdDoc == "object"
              ) {
                record = Object.assign(record, self.props.createdDoc);
              }
              if (self.props.dependentSchema) {
                record[currentSchema["@dependentKey"]] =
                  self.props.dependentSchema;
              }
              if (typeof self.props.setPropertyValue == "function") {
                record = Object.assign(record, self.props.getCurrentDoc());
              }
              self.gotSchemaAndRecord(currentSchema, record, privileges);
            }
          }
        );
      }
    );
  },
  decidePermissions: function(schemaDoc, privileges) {
    var editFields = [];
    var readOnlyFields = [];
    var actions = [];

    if (schemaDoc && schemaDoc["@operations"]) {
      /**
       * For New Record Creation
       */
      if (!this.props.recordId) {
        //Edit fields
        if (schemaDoc["@operations"].create) {
          if (
            privileges.create &&
            schemaDoc["@operations"].create[privileges.create] &&
            schemaDoc["@operations"].create[privileges.create].in
          ) {
            editFields = schemaDoc["@operations"].create[privileges.create].in;
          } else {
            //editFields=Object.keys(schemaDoc["@properties"]);
          }
        }

        //Actions
        if (schemaDoc["@operations"]["actions"]) {
          var allActions = Object.keys(schemaDoc["@operations"]["actions"]);
          if (privileges.methods == "all") {
            actions = allActions;
          } else {
            for (var i = 0; i < allActions.length; i++) {
              if (
                privileges.methods &&
                privileges.methods.indexOf(allActions[i]) > -1
              ) {
                actions.push(allActions[i]);
              }
            }
          }
          if (
            schemaDoc["@state"] &&
            schemaDoc["@initialState"] &&
            schemaDoc["@state"][schemaDoc["@initialState"]]
          ) {
            var validMethods = Object.keys(
              schemaDoc["@state"][schemaDoc["@initialState"]]
            );
            var newActions = [];
            for (var i = 0; i < actions.length; i++) {
              if (validMethods.indexOf(actions[i]) > -1) {
                newActions.push(actions[i]);
              }
            }
            actions = newActions;
          }
        }
        if (
          this.props.fromWorkFlow &&
          Array.isArray(this.props.editFields) &&
          this.props.editFields.length > 0
        ) {
          editFields = this.props.editFields;
          if (Array.isArray(this.props.readOnlyFields)) {
            readOnlyFields = [];
          }
          actions = [];
        }
      } else {
        if (
          this.props.editMethod &&
          privileges.methods &&
          (privileges.methods == "all" ||
            privileges.methods.indexOf(this.props.editMethod) > -1)
        ) {
          if (
            schemaDoc["@operations"]["update"] &&
            schemaDoc["@operations"]["update"][this.props.editMethod] &&
            schemaDoc["@operations"]["update"][this.props.editMethod].update
          ) {
            editFields =
              schemaDoc["@operations"]["update"][this.props.editMethod].update;
          }
        }
      }

      var allFieldsAccessTo = [];
      if (
        privileges.detailView &&
        schemaDoc["@operations"]["read"] &&
        schemaDoc["@operations"]["read"][privileges.detailView] &&
        schemaDoc["@operations"]["read"][privileges.detailView]["out"]
      ) {
        allFieldsAccessTo =
          schemaDoc["@operations"]["read"][privileges.detailView]["out"];
      }
      for (var i = 0; i < allFieldsAccessTo.length; i++) {
        if (editFields.indexOf(allFieldsAccessTo[i]) == -1) {
          readOnlyFields.push(allFieldsAccessTo[i]);
        }
      }
    }

    if (this.props.permission == "edit") {
      editFields = Object.keys(schemaDoc["@properties"]);
    } else if (this.props.permission == "read") {
      readOnlyFields = Object.keys(schemaDoc["@properties"]);
    }
    return {
      editFields: editFields,
      readOnlyFields: readOnlyFields,
      actions: actions
    };
  },
  gotSchemaAndRecord: function(schema, record, privileges) {
    var self = this;
    var doc = this.props.createdDoc
      ? this.props.createdDoc
      : record
        ? record
        : {};
    if (this.props.recordId) {
      doc = record ? record : {};
    }
    for (var property in doc) {
      if (
        schema["@type"] == "abstractObject" &&
        schema["@dependentKey"] &&
        schema["@dependentKey"] == property &&
        schema["@properties"][property].dataType.derived &&
        doc[property]
      ) {
        schema["@properties"]["dependentProperties"] = {
          description: doc[property] + "  properties",
          prompt: doc[property] + "  properties",
          displayName: "",
          dataType: {
            type: "struct",
            structRef: self.props.schemaName + "-" + doc[property]
          }
        };
        break;
      }
    }
    var access = this.decidePermissions(schema, privileges);
    var selectedObjects = this.state.selectedObjects;
    selectedObjects[common.getUserDoc().recordId] = common.getUserDoc();
    selectedObjects["public"] = {};

    if (schema) {
      doc.org = self.props.org;
      getDefaultValues(schema, doc, function(gdvr) {
        if (!gdvr.org) {
          gdvr["org"] = self.props.org ? self.props.org : "public";
        }

        if (self.props.knownData && self.props.knownData.org) {
          gdvr.org = self.props.knownData.org;
        }
        var objectsToFetch = [];
        if (gdvr.org != "public") {
          objectsToFetch.push(gdvr.org);
        }
        if (typeof self.props.setPropertyValue == "function") {
          delete gdvr.org;
          delete gdvr.docType;
          delete gdvr["@superType"];
          delete gdvr["@identifier"];
          delete gdvr["relationDesc"];
          delete gdvr.cloudPointHostId;
          delete gdvr.recordId;
          delete gdvr.author;
          delete gdvr.editor;
          delete gdvr.dateCreated;
          delete gdvr.dateModified;
          delete gdvr.revision;
          delete gdvr["$status"];
          delete gdvr.dependentProperties;
        }
        for (var key in schema["@properties"]) {
          if (
            !Array.isArray(schema["@properties"][key]) &&
            typeof schema["@properties"][key].dataType == "object" &&
            typeof schema["@properties"][key].dataType.type == "string"
          ) {
            if (
              (schema["@properties"][key].dataType.type == "object" &&
                (schema["@properties"][key].dataType.refKey == "recordId" ||
                  schema["@properties"][key].dataType.refKeyType ==
                    "object")) ||
              schema["@properties"][key].dataType.resultType == "object"
            ) {
              if (gdvr[key]) {
                objectsToFetch.push(gdvr[key]);
              }
            }
          }
        }
        getObject(0);
        function getObject(index) {
          if (index < objectsToFetch.length) {
            WebUtils.doPost(
              "/schema?operation=getRecord",
              { name: objectsToFetch[index] },
              function(savedRecord) {
                selectedObjects[objectsToFetch[index]] = savedRecord.data;
                getObject(index + 1);
              }.bind(this)
            );
          } else {
            if (!self._isUnmounted)
              self.setState(
                {
                  schema: schema,
                  createdDoc: gdvr,
                  selectedObjects: selectedObjects,
                  editFields: access.editFields,
                  readOnlyFields: access.readOnlyFields,
                  actions: access.actions,
                  shouldComponentUpdate: true
                },
                function() {
                  self.evaluateFormulas();
                }
              );
          }
        }
      });
    }
  },
  cancel: function() {
    if (typeof this.props.cancelCallback == "function") {
      this.props.cancelCallback();
    } else if (
      this.props.fromPopUp &&
      document.getElementById(this.props.contentDivId)
    ) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById(this.props.contentDivId)
      );
      JunctionStore.clearJunctionsForRecord(this.props.recordId);
      ReactDOM.render(
        <genericView.GoIntoDetail
          rootSchema={this.props.schemaName}
          dependentSchema={this.props.dependentSchema}
          recordId={this.props.recordId}
          fromPopUp={this.props.fromPopUp}
          contentDivId={this.props.contentDivId}
          org={this.props.org ? this.props.org : "public"}
        />,
        document.getElementById(this.props.contentDivId)
      );
    } else {
      history.back();
    }
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var self = this;
    var promptStyle = {};
    if (
      this.state.schema &&
      this.state.schema["@prompt"] &&
      this.state.schema["@prompt"].style
    ) {
      promptStyle = utility.getReactStyles(
        common.getConfigDetails().branding[this.state.schema["@prompt"].style].normal
      );
    } else {
      promptStyle = utility.getReactStyles(
        common.getConfigDetails().branding["text"].normal
      );
      promptStyle["whiteSpace"] = "pre-wrap";
    }
    var promptTop = "";
    if (this.state.schema && this.state.schema["@prompt"]) {
      promptTop = this.state.schema["@prompt"].text;
      promptStyle = utility.getReactStyles(
        common.getConfigDetails().branding[self.state.schema["@prompt"].style].normal
      );
    } else if (self.props.prompt && self.props.prompt.text) {
      promptTop = self.props.prompt.text;
      if (self.props.prompt.style) {
        promptStyle = utility.getReactStyles(
          common.getConfigDetails().branding[self.props.prompt.style].normal
        );
      }
    }
    var schemaDoc = this.state.schema;
    var saveDisplayName = "SAVE";
    if (schemaDoc && schemaDoc["@operations"]) {
      if (
        schemaDoc["@operations"].create &&
        schemaDoc["@operations"].create.displayName
      ) {
        saveDisplayName = schemaDoc["@operations"].create.displayName;
      }
      if (
        this.props.editMethod &&
        schemaDoc["@operations"]["update"] &&
        schemaDoc["@operations"]["update"][this.props.editMethod]
      ) {
        if (
          schemaDoc["@operations"]["update"][this.props.editMethod].displayName
        ) {
          saveDisplayName =
            schemaDoc["@operations"]["update"][this.props.editMethod]
              .displayName;
        }
        //overriding save action button name with saveName
        if (
          schemaDoc["@operations"]["update"][this.props.editMethod].saveName
        ) {
          saveDisplayName =
            schemaDoc["@operations"]["update"][this.props.editMethod].saveName;
        }
      }
    }
    return (
      <div className="form-group" id={this.props.schemaName}>
        {promptTop != "" ? (
          <div className="margin-bottom-gap" style={promptStyle}>
            {promptTop}
          </div>
        ) : (
          <div className="hidden" />
        )}
        {this.state.schema && this.state.schema["@properties"] ? (
          <div>
            {Object.keys(this.state.schema["@properties"]).map(function(key) {
              var permission;
              if (key == "dependentProperties") {
                permission = "edit";
              } else if (self.state.editFields.indexOf(key) > -1) {
                permission = "edit";
              } else if (self.state.readOnlyFields.indexOf(key) > -1) {
                permission = "read";
              }
              if (!permission) {
                return <div className="hidden" key={global.guid()} />;
              } else if (permission == "edit") {
                return (
                  <DataTypeDelegator
                    key={global.guid()}
                    org={self.props.org}
                    schemaDoc={self.state.schema}
                    propertyName={key}
                    inlineEdit={self.props.inlineEdit}
                    fromStruct={self.props.fromStruct}
                    property={self.state.schema["@properties"][key]}
                    defaultValue={self.state.createdDoc[key]}
                    permission={permission}
                    setPropertyValue={self.setPropertyValue}
                    innerComponent={
                      typeof self.props.setPropertyValue == "function"
                        ? true
                        : false
                    }
                    setSelectedObject={self.setSelectedObject}
                    addToCurrentWindowImages={self.addToCurrentWindowImages}
                    getCurrentDoc={self.getCurrentDoc}
                    fromArray={self.props.fromArray}
                    srFilters={self.props.srFilters}
                    filterKeys={self.props.filterKeys}
                    openDefault={
                      key == schemaDoc["@openDefault"] ||
                      self.state.editFields.length == 1
                    }
                  />
                );
              } else if (permission == "read") {
                return <div key={global.guid()} className="hidden" />;
                /*return <getContent.GetContent key={global.guid()}
                                                        noDetail={true}
                                                        dependentSchema={self.props.dependentSchema}
                                                        rootSchema={self.props.schemaName}
                                                        schemaDoc={self.state.schema}
                                                       	property={key}
                                                        fullRecord={self.state.createdDoc}
                                                        recordId={"NA"}
                                                        org={self.props.org}/>*/
              }
            })}
          </div>
        ) : (
          <div className="row no-margin" key={global.guid()}>
            <img src="/branding/cloudseedLoader.svg" height="50px" />
          </div>
        )}
        {!this.props.propertyName ? (
          <div className="row no-margin">
            <div className="display-inline-block extra-padding-right">
              {Array.isArray(this.state.editFields) &&
              this.state.editFields.length > 0 ? (
                <button
                  type="submit"
                  className="upload-btn"
                  onClick={this.saveRecord.bind(null, null)}
                  ref={e => {
                    this.saveButton = e;
                  }}
                >
                  {saveDisplayName}
                </button>
              ) : (
                <div />
              )}
            </div>
            {/*
									this.state.actions.map(function(action){
										var displayName=action;
										try{
											displayName=self.state.schema["@operations"].actions[action].displayName;
										}catch(err){}
										return (<div className="display-inline-block extra-padding-right">
												<button type='submit'
			                     					className="upload-btn"
			                     					onClick={self.saveRecord.bind(null,action)}
			                     					ref={(e)=>{self["action"+action]=e}}>
													{displayName}
												</button>
												</div>);
									})
								*/}

            {this.props.showCancel ? (
              <div className="display-inline-block extra-padding-right">
                <button
                  type="submit"
                  ref={e => {
                    this.cancelButton = e;
                  }}
                  className="upload-btn"
                  onClick={this.cancel}
                >
                  CANCEL
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
});
exports.DisplayCustomSchema = DisplayCustomSchema;

/**
 * property
 * propertyName
 * setPropertyValue
 * permission
 */
var DataTypeDelegator = React.createClass({
  componentDidMount: function() {
    try {
      if (
        this.props.schemaDoc["@identifier"] == this.props.propertyName &&
        !this.props.fromStruct
      ) {
        $("#" + this.props.propertyName + " input")[0].focus();
      } else if (
        (!this.props.schemaDoc["@identifier"] ||
          this.props.schemaDoc["@identifier"] == "recordId") &&
        this.props.property["defaultFocus"]
      ) {
        $("#" + this.props.propertyName + " input")[0].focus();
      }
    } catch (err) {}
  },
  render: function() {
    var self = this;
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    //  var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    //  var description=this.props.property.description?this.props.property.description:displayName;
    //{(this.props.property.required && !this.props.fromFormula)?():("")}
    return (
      <div
        id={key}
        className={
          self.props.innerComponent ||
          typeof self.props.fromArray != "undefined"
            ? "padding-left"
            : "row no-margin"
        }
        key={global.guid()}
      >
        <div
          className={
            self.props.innerComponent ||
            typeof self.props.fromArray != "undefined"
              ? typeof self.props.fromArray != "undefined"
                ? "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                : "form-group"
              : "col-lg-8 col-md-8 col-sm-10 col-xs-10 no-padding"
          }
        >
          <div>
            {this.props.noDisplayName ? (
              <span />
            ) : (
              <span className="fieldText no-padding-left headerField propertyName extra-padding-right">
                {displayName}
              </span>
            )}
            <span className="extra-padding-right">
              <span
                id={this.props.propertyName + "InCompleteError"}
                className="errorMsg hidden"
              >
                {this.props.property.inCompleteErrorMessage
                  ? this.props.property.inCompleteErrorMessage
                  : "Please fill this field."}
              </span>
              {this.props.property.required &&
              displayName.trim() != "" &&
              !this.props.noDisplayName ? (
                <span className="errorMsg">*</span>
              ) : (
                <span />
              )}
            </span>
          </div>
          {self.props.property.dataType.type == "text" ||
          self.props.property.dataType.type == "heading1" ||
          self.props.property.dataType.type == "heading2" ||
          self.props.property.dataType.type == "heading3" ||
          self.props.property.dataType.type == "email" ||
          self.props.property.dataType.type == "number" ||
          self.props.property.dataType.type == "url" ||
          self.props.property.dataType.type == "textarea" ||
          self.props.property.dataType.type == "date" ||
          self.props.property.dataType.type == "time" ||
          self.props.property.dataType.type == "dateTime" ||
          self.props.property.dataType.type == "richTextEditor" ||
          self.props.property.dataType.type == "richText" ||
          self.props.property.dataType.type == "tags" ||
          //self.props.property.dataType.type=="currency" ||
          self.props.property.dataType.type == "password" ? (
            <TextField
              org={self.props.org}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "currency" ? (
            <CurrencyField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "object" ? (
            <ObjectField
              org={self.props.org}
              schemaDoc={self.props.schemaDoc}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              openDefault={self.props.openDefault}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
              srFilters={self.props.srFilters}
              filterKeys={self.props.filterKeys}
            />
          ) : self.props.property.dataType.type == "pickList" ? (
            <PickListField
              org={self.props.org}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "multiPickList" ? (
            <MultiPickListField
              org={self.props.org}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "array" ? (
            <ArrayField
              org={self.props.org}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              addToCurrentWindowImages={self.props.addToCurrentWindowImages}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
              srFilters={self.props.srFilters}
              filterKeys={self.props.filterKeys}
            />
          ) : self.props.property.dataType.type == "struct" ? (
            <DisplayCustomSchema
              org={self.props.org}
              schemaDoc={self.props.schemaDoc}
              fromStruct={true}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              schemaName={self.props.property.dataType.structRef}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              addToCurrentWindowImages={self.props.addToCurrentWindowImages}
              createdDoc={self.props.defaultValue}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
              srFilters={self.props.srFilters}
              filterKeys={self.props.filterKeys}
            />
          ) : self.props.property.dataType.type == "image" ||
          self.props.property.dataType.type == "images" ||
          self.props.property.dataType.type == "privateVideo" ||
          self.props.property.dataType.type == "privateVideos" ||
          self.props.property.dataType.type == "attachment" ||
          self.props.property.dataType.type == "attachments" ? (
            <ImageField
              org={self.props.org}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              addToCurrentWindowImages={self.props.addToCurrentWindowImages}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "boolean" ? (
            <BooleanField
              org={self.props.org}
              propertyName={self.props.propertyName}
              inlineEdit={self.props.inlineEdit}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "video" ? (
            <EmbeddedVideoField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "formula" ? (
            <FormulaField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              schemaDoc={self.props.schemaDoc}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
              srFilters={self.props.srFilters}
              filterKeys={self.props.filterKeys}
            />
          ) : self.props.property.dataType.type == "geoLocation" ? (
            <GeoLocationField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "rating" ? (
            <RatingFiled
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "autoNumber" ? (
            <div className="form-group" />
          ) : self.props.property.dataType.type == "translateField" ? (
            <TranslateField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "color" ? (
            <ColorField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "phone" ? (
            <PhoneField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "dndImage" ? (
            <DndImageField
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              addToCurrentWindowImages={self.props.addToCurrentWindowImages}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : self.props.property.dataType.type == "userDefinedFields" ? (
            <UserDefinedFields
              org={self.props.org}
              inlineEdit={self.props.inlineEdit}
              propertyName={self.props.propertyName}
              property={self.props.property}
              permission={self.props.permission}
              defaultValue={self.props.defaultValue}
              setPropertyValue={self.props.setPropertyValue}
              setSelectedObject={self.props.setSelectedObject}
              addToCurrentWindowImages={self.props.addToCurrentWindowImages}
              getCurrentDoc={self.props.getCurrentDoc}
              fromArray={self.props.fromArray}
            />
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
});
exports.DataTypeDelegator = DataTypeDelegator;

var ArrayField = React.createClass({
  getInitialState: function() {
    var count =
      this.props.defaultValue && this.props.defaultValue.length > 0
        ? this.props.defaultValue.length
        : 0;
    try {
      if (!isNaN(this.props.property.dataType.maxLength)) {
        if (count < this.props.property.dataType.maxLength) {
          count = count + 1;
        }
      } else {
        count = count + 1;
      }
    } catch (err) {}
    return {
      count: count,
      value: Array.isArray(this.props.defaultValue)
        ? this.props.defaultValue
        : [],
      shouldComponentUpdate: false,
      maxLength: this.props.property.dataType.maxLength
    };
  },
  valueAdded: function(name, value, index) {
    //  var self=this;
    var existingValues = this.state.value;
    var newValues = JSON.parse(JSON.stringify(existingValues));
    newValues[index] = value;
    newValues = newValues.filter(function(n) {
      if (typeof n != "object") {
        return n != "" && n != undefined;
      } else {
        if (Object.keys(n).length > 0) {
          for (var i = 0; i < Object.keys(n).length; i++) {
            if (
              Array.isArray(n[Object.keys(n)[i]]) &&
              n[Object.keys(n)[i]].length > 0
            ) {
              return n;
            } else if (
              n[Object.keys(n)[i]] != "" &&
              n[Object.keys(n)[i]] != undefined
            ) {
              return n;
            }
          }
        }
      }
    });
    var count = this.state.count;
    if (!isNaN(this.state.maxLength)) {
      if (newValues.length + 1 <= this.state.maxLength)
        count = newValues.length + 1;
    } else {
      count = newValues.length + 1;
    }
    this.setState({
      value: newValues,
      shouldComponentUpdate:
        newValues.length != existingValues.length || count != this.state.count,
      count: count
    });
    this.props.setPropertyValue(
      this.props.propertyName,
      newValues,
      this.props.fromArray
    );
  },
  removeValue: function(remIndex) {
    //  var self=this;
    var existingValues = this.state.value;
    var newValues = JSON.parse(JSON.stringify(existingValues));
    newValues = newValues.filter(function(val, index) {
      if (index != remIndex) {
        return true;
      } else {
        return false;
      }
    });
    newValues = newValues.filter(function(n) {
      return n != "" && n != undefined;
    });
    var count = this.state.count;
    if (!isNaN(this.state.maxLength)) {
      if (newValues.length + 1 <= this.state.maxLength)
        count = newValues.length + 1;
    } else {
      count = newValues.length + 1;
    }
    this.setState({
      value: newValues,
      shouldComponentUpdate: true,
      count: count
    });
    this.props.setPropertyValue(
      this.props.propertyName,
      newValues,
      this.props.fromArray
    );
  },
  addNew: function() {
    if (this.state.count == this.state.value.length) {
      //     var self=this;
      var count = this.state.count;
      if (!isNaN(this.state.maxLength)) {
        if (this.state.count + 1 <= this.state.maxLength) {
          this.setState({ count: count + 1, shouldComponentUpdate: true });
        }
      } else {
        this.setState({ count: count + 1, shouldComponentUpdate: true });
      }
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  render: function() {
    var self = this;
    var arrayCount = [];
    for (var i = 0; i < this.state.count; i++) {
      arrayCount.push(i);
    }
    var elementsType;
    try {
      elementsType = self.props.property.dataType.elements.type;
    } catch (err) {}
    return (
      <div>
        {arrayCount.map(function(temp, index) {
          return (
            <div
              className="showDelete col-lg-12 col-sm-12 col-xs-12 col-md-12  no-padding"
              key={global.guid()}
            >
              <DataTypeDelegator
                propertyName={self.props.propertyName}
                org={self.props.org}
                property={{
                  prompt: self.props.property.prompt,
                  displayName: "",
                  dataType: self.props.property.dataType.elements,
                  workFlow: self.props.property.workFlow
                    ? self.props.property.workFlow
                    : undefined
                }}
                defaultValue={
                  self.state.value[temp] ? self.state.value[temp] : undefined
                }
                permission={self.props.permission}
                setPropertyValue={self.valueAdded}
                setSelectedObject={self.props.setSelectedObject}
                addToCurrentWindowImages={self.props.addToCurrentWindowImages}
                getCurrentDoc={self.props.getCurrentDoc}
                fromArray={temp}
                srFilters={self.props.srFilters}
                filterKeys={self.props.filterKeys}
              />
              {self.state.value.length == 0 ||
              index == arrayCount.length - 1 ||
              (elementsType && elementsType == "object") ? (
                ""
              ) : (
                <span
                  className="icons8-delete link deleteImage extra-padding-left"
                  aria-hidden="true"
                  title="Click to remove"
                  onClick={self.removeValue.bind(null, temp)}
                />
              )}
            </div>
          );
        })}

        {/*<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
		        <button className={"action-button "+(self.state.value.length==0?"hidden":"")} ref={(e)=>{this.addButton=e}}   onClick={this.addNew}>Add Another {this.props.property.displayName}</button>
		      </div>*/}
      </div>
    );
  }
});

var TextField = React.createClass({
  getInitialState: function() {
    return {
      value:
        typeof this.props.defaultValue != "undefined"
          ? this.props.defaultValue
          : "",
      url: undefined
    };
  },
  updateText: function(event) {
    var value = event.target.value.trim();
    if (this.props.property.dataType.type == "email") {
      var mailformat = global.emailFormate;
      if (!value.match(mailformat)) {
        this.showError();
        value = "";
      } else {
        this.removeError();
      }
    } else if (this.props.property.dataType.type == "url") {
      var urlformat = /^(ftp|http|https):\/\/[^ "]+$/;
      if (!value.match(urlformat)) {
        this.showError();
        value = "";
      } else {
        this.removeError();
      }
    } else if (this.props.property.dataType.type == "number") {
      if (isNaN(value)) {
        this.showError();
        value = "";
      } else {
        this.removeError();
      }
    } else if (this.props.property.dataType.regex) {
      var regex = new RegExp(
        this.props.property.dataType.regex,
        this.props.property.dataType.modifier
      );
      if (!value.match(regex)) {
        this.showError();
        value = "";
      } else {
        this.removeError();
      }
    }
    //To Extract URI and show the scraped content on top it
    var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[{};:'".,<>?Ã‚Â«Ã‚Â»Ã¢â‚¬Å“Ã¢â‚¬ï¿½Ã¢â‚¬ËœÃ¢â‚¬â„¢]|\]|\?))/gi;
    var allURIs = value.match(uri_pattern);
    var url;
    if (Array.isArray(allURIs) && allURIs.length > 0) {
      url = allURIs[0];
    }
    try {
      if (value == "" && this.props.property.dataType.defaultValue) {
        value = this.props.property.dataType.defaultValue;
        this.inputField.value = this.props.property.dataType.defaultValue;
      }
    } catch (err) {}

    this.setState({ value: value, url: url });
    this.props.setPropertyValue(
      this.props.propertyName,
      value,
      this.props.fromArray
    );
  },
  showError: function() {
    try {
      $(this.errMsg).removeClass("hidden");
    } catch (err) {}
  },
  removeError: function() {
    try {
      if (!$(this.errMsg).hasClass("hidden")) {
        $(this.errMsg).addClass("hidden");
      }
    } catch (err) {}
  },
  editorCallback: function(text) {
    this.props.setPropertyValue(
      this.props.propertyName,
      text,
      this.props.fromArray
    );
  },
  componentDidUpdate: function() {
    if (this.props.property.dataType.type == "time") {
      $(this.inputField).datetimepicker({
        format: "LT",
        showClose: true
      });
    } else if (this.props.property.dataType.type == "date") {
      $(this.inputField).datetimepicker({
        format: "YYYY/MM/DD",
        showClose: true
      });
    } else if (this.props.property.dataType.type == "dateTime") {
      $(this.inputField).datetimepicker({
        format: "YYYY/MM/DD HH:mm",
        showClose: true
      });
    } else if (this.props.property.dataType.type == "textarea") {
      if (this[this.props.propertyName + "textarea"]) {
        $(this[this.props.propertyName + "textarea"]).height(
          this[this.props.propertyName + "textarea"].scrollHeight
        );
        if (this.props.inlineEdit) {
          if (
            this.props.property.editIfNoData &&
            this.state.value.length == 0
          ) {
            // do nothing
          } else {
            $(this[this.props.propertyName + "textarea"]).focus();
          }
          this[this.props.propertyName + "textarea"].setSelectionRange(
            this[this.props.propertyName + "textarea"].value.length,
            this[this.props.propertyName + "textarea"].value.length
          );
        }
      }
    }

    if (this.props.inlineEdit && this.inputField) {
      this["inputField"].setSelectionRange(
        this.inputField.value.length,
        this.inputField.value.length
      );
      $(this.inputField).focus();
    }
  },
  componentDidMount: function() {
    this.componentDidUpdate();
  },
  onFocus: function() {
    try {
      if (
        this.inputField.value.trim() ==
        this.props.property.dataType.defaultValue
      ) {
        this.inputField.value = "";
      }
    } catch (err) {}
  },
  render: function() {
    //    var editable=(this.props.permission=="read")?false:true;
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    var maxLength = this.props.property.maxLength
      ? this.props.property.maxLength
      : "auto";
    var err = "";
    if (this.props.property.dataType.type == "email") {
      err = "You have entered an invalid email address!";
    } else if (this.props.property.dataType.type == "url") {
      err = "You have entered an invalid url";
    } else if (this.props.property.dataType.type == "number") {
      err = "You have entered an invalid number";
    } else if (this.props.property.dataType.errorMessage) {
      err = this.props.property.dataType.errorMessage;
    }

    if (this.props.property.dataType.type == "textarea") {
      return (
        <div key={global.guid()} className="form-group" title={description}>
          {this.state.url ? (
            <getURLContent.GetURLContent url={this.state.url} />
          ) : (
            ""
          )}
          <span
            ref={e => {
              this.errMsg = e;
            }}
            className="errorMsg hidden"
          >
            {err}
          </span>
          <textarea
            ref={d => {
              this[key + "textarea"] = d;
            }}
            className="form-control paddingTopChat"
            defaultValue={this.state.value ? this.state.value : ""}
            placeholder={prompt}
            rows="5"
            maxLength={maxLength}
            onBlur={this.updateText}
          />
        </div>
      );
    } else if (
      this.props.property.dataType.type == "richTextEditor" ||
      this.props.property.dataType.type == "richText"
    ) {
      return (
        <div className="form-group" title={description}>
          <Editor
            mode="create"
            content={this.props.defaultValue ? this.props.defaultValue : ""}
            callback={this.editorCallback}
          />
        </div>
      );
    } else if (this.props.property.dataType.type == "tags") {
      return (
        <div className="from-group" title={description}>
          <TagsInput
            mode="create"
            defaultValue={
              this.props.defaultValue ? this.props.defaultValue : ""
            }
            callback={this.editorCallback}
          />
        </div>
      );
    } else if (this.props.property.dataType.type == "password") {
      return (
        <div className="form-group" title={description}>
          <PasswordField
            inlineEdit={this.props.inlineEdit}
            setPropertyValue={this.props.setPropertyValue}
            propertyName={this.props.propertyName}
            fromArray={this.props.fromArray}
            description={description}
            defaultValue={
              this.props.defaultValue ? this.props.defaultValue : undefined
            }
            prompt={prompt}
          />
        </div>
      );
    } else {
      return (
        <div className="form-group" title={description}>
          <span
            ref={e => {
              this.errMsg = e;
            }}
            className="errorMsg hidden"
          >
            {err}
          </span>
          <input
            ref={e => {
              this.inputField = e;
            }}
            type={"text"}
            className="form-control"
            onFocus={this.onFocus}
            defaultValue={
              typeof this.props.defaultValue != "undefined"
                ? this.props.defaultValue
                : ""
            }
            placeholder={prompt}
            onBlur={this.updateText}
          />
        </div>
      );
    }
  }
});

var PasswordField = React.createClass({
  getInitialState: function() {
    return {
      previous: this.props.defaultValue ? false : true,
      newValue: false
    };
  },
  checkPreviousPassword: function(event) {
    var value = event.target.value.trim();
    this.errPreviousMsg.className = "errorMsg hidden";
    if (this.props.defaultValue == value) {
      this.setState({ previous: true });
    } else {
      this.errPreviousMsg.className = "errorMsg";
    }
  },
  checkValidation: function(event) {
    var value = event.target.value.trim();
    this.errValidationMsg.className = "errorMsg hidden";
    if (this.errPreviousMsg) {
      this.errPreviousMsg.className = "errorMsg hidden";
    }
    if (value != "" && value.length < 5) {
      this.errValidationMsg.className = "errorMsg";
    } else if (!this.state.previous) {
      this.errPreviousMsg.className = "errorMsg";
    } else {
      this.setState({ newValue: value });
    }
  },
  updateText: function(event) {
    var value = event.target.value.trim();
    this.errReenterMsg.className = "errorMsg hidden";
    this.errValidationMsg.className = "errorMsg hidden";
    if (this.errPreviousMsg) {
      this.errPreviousMsg.className = "errorMsg hidden";
    }
    if (!this.state.previous) {
      this.errPreviousMsg.className = "errorMsg";
    } else if (this.state.newValue == false) {
      this.errValidationMsg.className = "errorMsg";
    } else if (value != this.state.newValue) {
      this.errReenterMsg.className = "errorMsg";
    } else {
      this.props.setPropertyValue(
        this.props.propertyName,
        value,
        this.props.fromArray
      );
    }
  },
  componentDidMount: function() {
    if (this.props.inlineEdit) {
      if (!this.state.previous) {
        $(this.inputPreviousField).focus();
      } else {
        $(this.inputValidationField).focus();
      }
    }
  },
  render: function() {
    return (
      <div className="form-group" title={this.props.description}>
        {this.props.defaultValue ? (
          <div className="form-group">
            <span
              ref={e => {
                this.errPreviousMsg = e;
              }}
              className="errorMsg hidden"
            >
              {"Password incorrect. Please try again."}
            </span>
            <input
              ref={e => {
                this.inputPreviousField = e;
              }}
              type={"password"}
              className="form-control"
              placeholder={"Enter current password"}
              onBlur={this.checkPreviousPassword}
            />
          </div>
        ) : (
          <div className="hidden" />
        )}
        <div className="form-group">
          <span
            ref={e => {
              this.errValidationMsg = e;
            }}
            className="errorMsg hidden"
          >
            <div className="margin-bottom-gap-sm">
              <div>
                <b>Password must:</b>
              </div>
              <div style={{ color: "red", fontSize: "12px" }}>
                Contain at least 6 characters
              </div>
            </div>
            <div>
              <div>
                <b>Password must NOT:</b>
              </div>
              <div style={{ color: "red", fontSize: "12px" }}>
                Contain only one character (111111 or aaaaaa).
              </div>
              <div style={{ color: "red", fontSize: "12px" }}>
                Contain only consecutive characters (123456 or abcdef).
              </div>
            </div>
          </span>
          <input
            ref={e => {
              this.inputValidationField = e;
            }}
            type={"password"}
            className="form-control"
            placeholder={"Enter new password"}
            onBlur={this.checkValidation}
          />
        </div>
        <div className="form-group">
          <span
            ref={e => {
              this.errReenterMsg = e;
            }}
            className="errorMsg hidden"
          >
            {"Password mismatch. Please try again."}
          </span>
          <input
            ref={e => {
              this.inputReenterField = e;
            }}
            type={"password"}
            className="form-control"
            placeholder={"Re-enter the new password"}
            onBlur={this.updateText}
          />
        </div>
      </div>
    );
  }
});

var PhoneField = React.createClass({
  getInitialState: function() {
    return {
      countriesList: [],
      code: this.props.defaultValue
        ? this.props.defaultValue.split("-")[0]
        : "",
      no: this.props.defaultValue ? this.props.defaultValue.split("-")[1] : ""
    };
  },
  setCountryCode: function() {
    var code = this.selectBox.value;
    if (code != "") {
      var self = this;
      try {
        if (!$(this.codeErrMsg).hasClass("hidden")) {
          $(this.codeErrMsg).addClass("hidden");
        }
      } catch (err) {}
      this.setState({ code: code }, function() {
        if (self.phone.value.trim()) {
          self.checkPhoneNo();
        }
      });
    }
  },
  checkPhoneNo: function() {
    var no = this.phone.value.trim();
    if (no != "") {
      if (isNaN(no * 1)) {
        try {
          $(this.phoneErrMsg).removeClass("hidden");
        } catch (err) {}
        this.phone.value = "";
        return;
      } else {
        try {
          if (!$(this.phoneErrMsg).hasClass("hidden")) {
            $(this.phoneErrMsg).addClass("hidden");
          }
        } catch (err) {}
      }
      if (this.state.code == "") {
        try {
          $(this.codeErrMsg).removeClass("hidden");
        } catch (err) {}
        return;
      } else {
        try {
          if (!$(this.codeErrMsg).hasClass("hidden")) {
            $(this.codeErrMsg).addClass("hidden");
          }
        } catch (err) {}
      }

      //checking the length of the phone number
      var code = this.state.code.replace("+", "").trim() * 1;
      var totalDigits = 10;
      for (var i = 0; i < this.state.countriesList.length; i++) {
        if (this.state.countriesList[i].countryCode == code) {
          totalDigits = this.state.countriesList[i].totalDigits;
          break;
        }
      }
      if (
        isNaN(totalDigits) &&
        (!isNaN(totalDigits.min) && !isNaN(totalDigits.max))
      ) {
        if (no.length < totalDigits.min || no.length > totalDigits.max) {
          try {
            $(this.phoneErrMsg).removeClass("hidden");
          } catch (err) {}
          //this.phone.value="";
          return;
        }
      } else if (no.length != totalDigits) {
        try {
          $(this.phoneErrMsg).removeClass("hidden");
        } catch (err) {}
        //this.phone.value="";
        return;
      } else {
        try {
          if (!$(this.phoneErrMsg).hasClass("hidden")) {
            $(this.phoneErrMsg).addClass("hidden");
          }
        } catch (err) {}
      }
      var self = this;
      this.setState({ no: no }, function() {
        self.saveNumber();
      });
    }
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },

  componentDidMount: function() {
    WebUtils.getDefinition(
      "CountryCodes",
      function(countryCodes) {
        if (countryCodes.countryCodes) {
          if (!this._isUnmounted)
            this.setState({ countriesList: countryCodes.countryCodes });
        }
      }.bind(this)
    );
  },
  saveNumber: function() {
    if (this.state.code != "" && this.state.no != "") {
      this.props.setPropertyValue(
        this.props.propertyName,
        this.state.code + "-" + this.state.no,
        this.props.fromArray
      );
    }
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    //	var self=this;
    return (
      <div className="form-group" title={description}>
        <div className="display-inline-block extra-padding-right">
          <span
            ref={e => {
              this.codeErrMsg = e;
            }}
            className="errorMsg hidden"
          >
            {"Please select country"}
          </span>
          <select
            key={global.guid()}
            ref={e => {
              this.selectBox = e;
            }}
            className="form-control"
            onChange={this.setCountryCode}
            defaultValue={this.state.code}
          >
            {this.state.code == "" ? (
              <option value="">{"Select Country"}</option>
            ) : (
              ""
            )}
            {this.state.countriesList.map(function(country) {
              return (
                <option value={"+" + country.countryCode} key={global.guid()}>
                  {country.countryName + "  " + country.countryCode}
                </option>
              );
            })}
          </select>
        </div>
        <div className="display-inline-block">
          <span
            ref={e => {
              this.phoneErrMsg = e;
            }}
            className="errorMsg hidden"
          >
            {"Please enter valid phone number"}
          </span>
          <input
            type="tel"
            ref={e => {
              this.phone = e;
            }}
            className="form-control"
            placeholder={prompt}
            defaultValue={this.state.no}
            onBlur={this.checkPhoneNo}
          />
        </div>
      </div>
    );
  }
});

var CurrencyField = React.createClass({
  getInitialState: function() {
    var no = "";
    var code = "INR (₹)";
    if (this.props.defaultValue) {
      no = this.props.defaultValue.split(" ")[0];
      code = this.props.defaultValue.replace(no, "").trim();
    }
    return {
      currenciesList: [],
      no: no,
      code: code
    };
  },
  setCurrencyCode: function() {
    var code = this.selectBox.value;
    if (code != "") {
      var self = this;
      try {
        if (!$(this.codeErrMsg).hasClass("hidden")) {
          $(this.codeErrMsg).addClass("hidden");
        }
      } catch (err) {}
      this.setState({ code: code }, function() {
        self.saveNumber();
      });
    }
  },
  checkCurrencyNo: function() {
    var no = this.currency.value.trim();
    if (no != "") {
      if (isNaN(no * 1)) {
        try {
          $(this.currencyErrMsg).removeClass("hidden");
        } catch (err) {}
        this.phone.value = "";
        return;
      } else {
        try {
          if (!$(this.currencyErrMsg).hasClass("hidden")) {
            $(this.currencyErrMsg).addClass("hidden");
          }
        } catch (err) {}
      }
      if (this.state.code == "") {
        try {
          $(this.codeErrMsg).removeClass("hidden");
        } catch (err) {}
        return;
      } else {
        try {
          if (!$(this.codeErrMsg).hasClass("hidden")) {
            $(this.codeErrMsg).addClass("hidden");
          }
        } catch (err) {}
      }
      var self = this;
      this.setState({ no: no }, function() {
        self.saveNumber();
      });
    }
  },
  componentDidMount: function() {
    WebUtils.getDefinition(
      "CurrencyCodes",
      function(currencyCodes) {
        if (currencyCodes.currencyCodes) {
          if (!this._isUnmounted)
            this.setState({ currenciesList: currencyCodes.currencyCodes });
        }
      }.bind(this)
    );
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },

  saveNumber: function() {
    //if(this.state.code!="" && this.state.no!=""){
    this.props.setPropertyValue(
      this.props.propertyName,
      this.state.no + " " + this.state.code,
      this.props.fromArray
    );
    //}
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    //	var self=this;
    return (
      <div className="form-group" title={description}>
        <div className="display-inline-block">
          <span
            ref={e => {
              this.currencyErrMsg = e;
            }}
            className="errorMsg hidden"
          >
            {"Please enter valid number"}
          </span>
          <input
            type="tel"
            ref={e => {
              this.currency = e;
            }}
            className="form-control"
            placeholder={prompt}
            defaultValue={this.state.no}
            onBlur={this.checkCurrencyNo}
          />
        </div>

        <div className="display-inline-block extra-padding-right">
          <span
            ref={e => {
              this.codeErrMsg = e;
            }}
            className="errorMsg hidden"
          >
            {"Please select currency code"}
          </span>
          <select
            key={global.guid()}
            ref={e => {
              this.selectBox = e;
            }}
            className="form-control"
            onChange={this.setCurrencyCode}
            defaultValue={this.state.code}
          >
            {this.state.code == "" ? (
              <option value="">{"Select currency code"}</option>
            ) : (
              ""
            )}
            {this.state.currenciesList.map(function(currency) {
              return (
                <option
                  title={currency.name}
                  value={currency.code + " (" + currency.symbol + ")"}
                  key={global.guid()}
                >
                  {currency.code + " (" + currency.symbol + ")"}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  }
});

var ObjectField = React.createClass({
  getInitialState: function() {
    return {
      value: this.props.defaultValue,
      filters: {},
      dependentSchema: undefined,
      lookUpNodeId: global.guid()
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return JSON.stringify(this.state) != JSON.stringify(nextState);
  },
  getFilters: function(callback) {
  	//if current doc updated get filters else callback
  	if(JSON.stringify(this.state.currentDoc)==JSON.stringify(this.props.getCurrentDoc())){
  		 if (typeof callback == "function") {callback();}
  		return;
  	}
    var self = this;
    var property = this.props.property;
    var filters = {};
    //When the related record is creating
    //if the other end is an object and looking for only that object
    //the second schema can be filtered with some filters those are configured in the parent schema
    //they are send in srFilters
    if (
      this.props.srFilters &&
      Object.keys(this.props.srFilters).length > 0 &&
      (Array.isArray(this.props.filterKeys) && this.props.filterKeys.length > 0)
    ) {
      this.props.filterKeys.map(function(fKey) {
        if (
          Array.isArray(fKey[self.props.propertyName]) &&
          fKey[self.props.propertyName].length > 0
        ) {
          fKey[self.props.propertyName].map(function(innerFkey) {
            if (self.props.srFilters[innerFkey]) {
              filters[innerFkey] = self.props.srFilters[innerFkey];
            }
          });
        }
      });
    }
    if (
      property.dataType.filters &&
      typeof property.dataType.filters == "object"
    ) {
      constructFilters(
        property.dataType.filters,
        self.props.getCurrentDoc(),
        function(flts) {
          filters = flts;
          self.saveFilters(filters, callback);
        }
      );
    } else {
      this.saveFilters(filters, callback);
    }
  },
  saveFilters: function(filters, callback) {
    if (
      filters &&
      Array.isArray(filters.roleType) &&
      filters.roleType.indexOf("Provider") > -1
    ) {
      filters.roleType.push("Architect");
    }
    var dependentSchema = undefined;
    if (
      filters &&
      Array.isArray(filters.dependentSchema) &&
      filters.dependentSchema.length > 0
    ) {
      dependentSchema = filters.dependentSchema[0];
      delete filters.dependentSchema;
    }
    if (!this._isUnmounted)
      this.setState(
        { filters: filters, dependentSchema: dependentSchema,currentDoc:this.props.getCurrentDoc() },
        function() {
          if (typeof callback == "function") {
            callback();
          }
        }
      );
  },
  getValue: function() {
    var self = this;
    var property = this.props.property;
    try {
      if (property.dataType.dependentOn) {
        var dependents = property.dataType.dependentOn;
        if (!Array.isArray(dependents)) {
          dependents = [dependents];
        }
        for (var index in dependents) {
          if (!self.props.getCurrentDoc()[dependents[index]]) {
            moveScroll(dependents[index]);
            try {
              $("#"+self.props.schemaDoc["@id"]+" "+"#"+dependents[index]+"InCompleteError").removeClass("hidden");
            } catch (err) {}
            return;
          }
        }
      }
    } catch (err) {}
    this.getFilters(function() {
      var currentStateRecord = self.props.getCurrentDoc();
      if (property.workFlow) {
        workFlow(
          property.workFlow,
          currentStateRecord,
          self.props.org,
          self.gotValue
        );
        return;
      }
      if (property.dataType.getFromGroupView) {
        constructArrayOfFormulas(
          property.dataType.getFromGroupView.key,
          currentStateRecord,
          function(arrKeyResp) {
            var groupData = property.dataType.getFromGroupView;
            groupData.key = arrKeyResp;
            var node = document.createElement("div");
            node.id = self.state.lookUpNodeId; //global.guid();
            var popUpId = global.guid();
            var contentDivId = global.guid();
            var sideDivId = global.guid();
            node.className =
              "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding " +
              self.state.lookUpNodeId;
            document
              .getElementById("lookUpDialogBox")
              .parentNode.appendChild(node);
            ReactDOM.render(
              <common.GenericPopUpComponent
                popUpId={popUpId}
                contentDivId={contentDivId}
                sideDivId={sideDivId}
              />,
              node
            );
            ReactDOM.render(
              <groupBy.GroupBy
                key={global.guid()}
                sourceSchema={property.dataType.objRef}
                displayName={property.displayName}
                org={self.props.org}
                groupDetails={groupData}
                rootRecord={currentStateRecord}
                showCreate={true}
                callback={function(item) {
                  self.gotValue(item);
                  node.remove();
                }}
              />,
              document.getElementById(contentDivId)
            );
          }
        );
      } else {
        var node = document.createElement("div");
        node.id = self.state.lookUpNodeId; //global.guid();
        node.className =
          "lookUpDialogBox lookUpFromDCS  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding " +
          self.state.lookUpNodeId;
        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        ReactDOM.render(
          <LookupComponent
            schema={property.dataType.objRef}
            property={property}
            dependentSchema={
              self.state.dependentSchema ||
              property.dataType.objeRefDependentSchema
            }
            filters={self.state.filters}
            org={self.props.org ? self.props.org : "public"}
            callback={self.gotValue}
          />,
          node
        );
      }
    });
  },
  gotValue: function(value) {
    var currVal = value.value[this.props.property.dataType.refKey];
    if (!this._isUnmounted) this.setState({ value: currVal });
    if (typeof this.props.setSelectedObject == "function") {
      this.props.setSelectedObject(value);
    }

    if (this.props.property.dataType.refKey == "recordId") {
      this.props.setPropertyValue(
        this.props.propertyName,
        value.id,
        this.props.fromArray
      );
    } else if (this.props.property.dataType.refKeyType == "object") {
      WebUtils.doPost(
        "/schema?operation=getRecord",
        { name: currVal },
        function(savedRecord) {
          if (typeof this.props.setSelectedObject == "function") {
            this.props.setSelectedObject({
              id: savedRecord.data.recordId,
              value: savedRecord.data
            });
          }
          this.props.setPropertyValue(
            this.props.propertyName,
            currVal,
            this.props.fromArray
          );
        }.bind(this)
      );
    } else {
      this.props.setPropertyValue(
        this.props.propertyName,
        currVal,
        this.props.fromArray
      );
    }
    moveScroll(this.props.propertyName);
  },
  componentDidMount: function() {
    var self = this;
    if (this.state.value && this.state.value != "") {
      WebUtils.doPost(
        "/schema?operation=getRecord",
        { name: this.state.value },
        function(savedRecord) {
          if (typeof self.props.setSelectedObject == "function") {
            self.props.setSelectedObject({
              id: savedRecord.data.recordId,
              value: savedRecord.data
            });
          }
        }
      );
    } else {
      if (
        this.props.property.dataType.refType != "ajax" &&
        this.props.openDefault
      ) {
        this.getValue();
      }
    }
  },
  deleteObject: function() {
    if (!this._isUnmounted) this.setState({ value: undefined });
    this.props.setPropertyValue(
      this.props.propertyName,
      undefined,
      this.props.fromArray
    );
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
    try {
      document.getElementById(this.state.lookUpNodeId).remove();
    } catch (err) {}
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;

    return (
      <div
        className="form-group"
        title={description}
        onMouseEnter={this.getFilters}
      >
        {this.state.value ? (
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
            <div className="child-img-component extra-padding-right-sm">
              {this.props.property.dataType.refKey == "recordId" ||
              this.props.property.dataType.refKeyType == "object" ? (
                <common.UserIcon
                  org={this.props.org ? this.props.org : "public"}
                  id={this.state.value}
                  rootSchema={
                    this.props.property.dataType.refKeyObjRef
                      ? this.props.property.dataType.refKeyObjRef
                      : this.props.property.dataType.objRef
                  }
                  viewName={this.props.property.dataType.viewName}
                  noDetail={true}
                />
              ) : (
                <div className="form-group">{this.state.value}</div>
              )}
            </div>
            <div className="child-img-component no-padding">
              <div
                className="icons8-delete link form-group"
                title="Click to reselect"
                onClick={this.deleteObject}
              />
            </div>
          </div>
        ) : this.props.property.dataType.refType == "ajax" ? (
          <AjaxLookUpComponent
            key={global.guid()}
            prompt={prompt}
            schema={this.props.property.dataType.objRef}
            hideCreateOption={
              this.props.property.dataType.hideCreateOption
                ? this.props.property.dataType.hideCreateOption
                : false
            }
            property={this.props.property}
            getCurrentDoc={this.props.getCurrentDoc}
            dependentSchema={
              this.state.dependentSchema ||
              this.props.property.dataType.objeRefDependentSchema
            }
            filters={this.state.filters}
            org={this.props.org ? this.props.org : "public"}
            callback={this.gotValue}
            inline={true}
            openDefault={this.props.openDefault}
          />
        ) : (
          <div className="display-inline-block remove-margin-left remove-margin-right extra-padding-right paddingTopChat margin-bottom-gap-xs">
            <button
              type="submit"
              className="action-button "
              title={prompt}
              onClick={this.getValue}
            >
              {prompt}
            </button>
          </div>
        )}
      </div>
    );
  }
});

var FormulaField = React.createClass({
  render: function() {
    //	var key = this.props.propertyName;
    //      var displayName=typeof this.props.property.displayName!="undefined"?this.props.property.displayName:key;
    //  var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    //  var description=this.props.property.description?this.props.property.description:displayName;
    var self = this;
    var newProperty = JSON.parse(JSON.stringify(this.props.property));
    newProperty.displayName = "";
    newProperty.dataType.type = this.props.property.dataType.resultType
      ? this.props.property.dataType.resultType
      : "text";
    return (
      <DataTypeDelegator
        propertyName={this.props.propertyName}
        org={self.props.org}
        fromFormula={true}
        property={newProperty}
        defaultValue={this.props.defaultValue}
        inlineEdit={this.props.inlineEdit}
        permission={this.props.permission}
        setPropertyValue={this.props.setPropertyValue}
        setSelectedObject={this.props.setSelectedObject}
        addToCurrentWindowImages={this.props.addToCurrentWindowImages}
        getCurrentDoc={this.props.getCurrentDoc}
        innerComponent={true}
        srFilters={this.props.srFilters}
        filterKeys={this.props.filterKeys}
      />
    );
  }
});

var PickListField = React.createClass({
  valueChanged: function(value) {
    this.selectBox.innerHTML = value;
    this.props.setPropertyValue(
      this.props.propertyName,
      value,
      this.props.fromArray
    );
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    var self = this;

    return (
      <div
        className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
        title={description}
      >
        <button
          type="button"
          className="btn btn-default dropdown-toggle form-control"
          style={{ textTransform: "none", padding: "0", fontSize: "14px" }}
          title="Click here to change"
          data-toggle="dropdown"
        >
          <span
            ref={e => {
              this.selectBox = e;
            }}
          >
            {" "}
            {this.props.defaultValue ? this.props.defaultValue : prompt}
          </span>
          <div className="display-inline-block groubyTransform pickListArrow">
            <span className="sleekIcon-rightarrow fa-2x " />
          </div>
        </button>
        <ul
          className="dropdown-menu scrollable-menu  col-lg-12 col-md-12 col-xs-12 col-sm-12 widthAuto "
          role="menu"
        >
          <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
            {this.props.property.dataType.options.map(function(value) {
              return (
                <li
                  key={global.guid()}
                  className="h5 link"
                  onClick={self.valueChanged.bind(null, value)}
                >
                  {value}
                </li>
              );
            })}
          </div>
        </ul>
        {/*
					<select ref={(e)=>{this.selectBox=e}}  className="form-control" multiple={this.props.property.dataType.type=="multiPickList"?true:false}
						onChange={this.valueChanged}
						defaultValue={this.props.defaultValue}>
						{(this.props.property.dataType.type=="pickList")?(<option value="">{prompt}</option>):("")}
		                 {
		                    this.props.property.dataType.options.map(function(value){
		                        return    (<option value={value} key={global.guid()}>{value}</option>)
		                    })
		                 }
                	</select>*/}
      </div>
    );
  }
});

var MultiPickListField = React.createClass({
  valueChanged: function(value) {
    this.props.setPropertyValue(
      this.props.propertyName,
      value,
      this.props.fromArray
    );
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    // var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    //   var self=this;

    return (
      <div className="form-group" title={description}>
        <CustomMultiPickList
          checkBoxPosition={"right"}
          onChange={this.valueChanged}
          optionsType="arrayOfStrings"
          options={this.props.property.dataType.options}
          defaultValue={this.props.defaultValue}
        />
      </div>
    );
  }
});
var BooleanField = React.createClass({
  valueChanged: function(event) {
    this.props.setPropertyValue(
      this.props.propertyName,
      this.selectBox.checked,
      this.props.fromArray
    );
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    //var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    // var self=this;

    return (
      <div className="form-group" title={description}>
        <div className="pull-left padding-left">
          {/*<input ref={(e)=>{this.selectBox=e}} type="checkbox"  className="extra-padding-left"
							onChange={this.valueChanged}
							defaultChecked={this.props.defaultValue}/>*/}
          <input
            type="checkbox"
            onChange={this.valueChanged}
            ref={e => {
              this.selectBox = e;
            }}
            id={"mpl" + key}
            defaultChecked={this.props.defaultValue}
          />
          <label
            htmlFor={"mpl" + key}
            className="vertical-align-middle no-margin"
            style={{ fontWeight: "normal", fontSize: "16px" }}
          >
            <div
              style={{ float: "left", fontSize: "14px", paddingRight: "5px" }}
            >
              {displayName}
            </div>
          </label>
        </div>
      </div>
    );
  }
});
var EmbeddedVideoField = React.createClass({
  getInitialState: function() {
    return {
      videoType: this.props.defaultValue
        ? this.props.defaultValue.split("->")[0]
        : "",
      id: this.props.defaultValue ? this.props.defaultValue.split("->")[1] : "",
      src: ""
    };
  },
  setVideoType: function(type) {
    if (type == "youtube" || type == "vimeo") {
      this.setState({ videoType: type, id: "", src: "" });
    }
    //	this.setState({videoType:$(this.videoType).val(),id:"",src:""});
  },
  getVideo: function(event) {
    var videoId = event.target.value.trim();
    var src = "";
    if (this.state.videoType && videoId) {
      if (this.state.videoType == "youtube") {
        src =
          "https://www.youtube.com/embed/" +
          videoId +
          "?rel=0&amp;controls=0&amp;showinfo=0";
      } else if (this.state.videoType == "vimeo") {
        src = "https://player.vimeo.com/video/" + videoId;
      }
    }
    this.setState({ src: src, id: videoId });
    this.props.setPropertyValue(
      this.props.propertyName,
      this.state.videoType + "->" + videoId,
      this.props.fromArray
    );
  },
  render: function() {
    //	var editable=(this.props.permission=="read")?false:true;
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;

    return (
      <div
        className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
        title={description}
      >
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
          <button
            type="button"
            className="btn btn-default dropdown-toggle form-control"
            style={{ textTransform: "none", padding: "0", fontSize: "14px" }}
            title="Click here to change"
            data-toggle="dropdown"
          >
            <span
              ref={e => {
                this.selectBox = e;
              }}
            >
              {" "}
              {this.state.videoType
                ? this.state.videoType.toUpperCase()
                : prompt}
            </span>
            <div
              className="display-inline-block groubyTransform"
              style={{ position: "relative", top: "8px", left: "-8px" }}
            >
              <span className="sleekIcon-rightarrow fa-2x " />
            </div>
          </button>
          <ul className="dropdown-menu scrollable-menu" role="menu">
            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
              <li
                value="youtube"
                onClick={this.setVideoType.bind(null, "youtube")}
              >
                YOUTUBE
              </li>
              <li value="vimeo" onClick={this.setVideoType.bind(null, "vimeo")}>
                VIMEO
              </li>
            </div>
          </ul>
        </div>
        <select
          ref={e => {
            this.videoType = e;
          }}
          className="form-control form-group hidden"
          defaultValue={this.state.videoType}
          onChange={this.setVideoType}
        >
          <option value="">{prompt}</option>
          <option value="youtube">YOUTUBE</option>
          <option value="vimeo">VIMEO</option>
        </select>
        {this.state.videoType ? (
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
            <input
              type="text"
              className="form-control form-group"
              defaultValue={this.state.id}
              placeholder={
                "Please enter the " + this.state.videoType + " video id"
              }
              onBlur={this.getVideo}
            />
          </div>
        ) : (
          ""
        )}
        {this.state.src ? (
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
            <iframe
              src={this.state.src}
              className="form-group"
              style={{ border: "none" }}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
});

var GeoLocationField = React.createClass({
  getInitialState: function() {
    return {
      latitude: this.props.defaultValue ? this.props.defaultValue.latitude : "",
      longitude: this.props.defaultValue
        ? this.props.defaultValue.longitude
        : "",
      locationName: this.props.defaultValue
        ? this.props.defaultValue.locationName
        : ""
    };
  },
  setLatLangs: function() {
    if (this.latitude.value.trim() && this.longitude.value.trim()) {
      this.setState(
        {
          latitude: this.latitude.value.trim(),
          longitude: this.longitude.value.trim(),
          locationName: this.search.value.trim()
        },
        function() {
          this.displayMap();
          var value = this.state;
          if (!value.locationName) {
            value.locationName = this.search.value.trim();
          }
          this.props.setPropertyValue(
            this.props.propertyName,
            value,
            this.props.fromArray
          );
        }.bind(this)
      );
    }
  },
  displayMap: function() {
    var self = this;
    if (this.state.latitude && this.state.longitude) {
      var targetDiv = this.geoLocation;
      this.geoLocation.className = "form-group";
      var myCenter = new google.maps.LatLng(
        this.state.latitude,
        this.state.longitude
      );
      var marker;
      var mapProp = {
        center: myCenter,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      targetDiv.style.height = "350px";
      var map = new google.maps.Map(targetDiv, mapProp);
      marker = new google.maps.Marker({
        position: myCenter,
        draggable: true,
        title: "Drag me!"
      });
      google.maps.event.addListener(marker, "dragend", function(event) {
        self.useSearchBoxPosition(
          { lat: this.getPosition().lat(), lng: this.getPosition().lng() },
          "drag"
        );
      });
      marker.setMap(map);
    }
  },
  componentDidUpdate: function() {
    var self = this;
    this.displayMap();
    var searchBox = new google.maps.places.SearchBox(this.search);
    google.maps.event.addListener(searchBox, "places_changed", function() {
      var place = searchBox.getPlaces()[0];
      self.useSearchBoxPosition(place);
    });
  },
  useSearchBoxPosition: function(place, drag) {
    if (drag) {
      this.latitude.value = place.lat;
      this.longitude.value = place.lng;
    } else {
      this.latitude.value = place.geometry.location.lat();
      this.longitude.value = place.geometry.location.lng();
      this.search.value = place.formatted_address
        ? place.formatted_address
        : "";
    }
    this.setLatLangs();
  },
  componentDidMount: function() {
    this.componentDidUpdate();
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return false;
    //return nextState.shouldComponentUpdate;
  },
  usePosition: function(position) {
    this.latitude.value = position.coords.latitude;
    this.longitude.value = position.coords.longitude;
    this.setLatLangs();
  },
  locateMe: function() {
    navigator.geolocation.getCurrentPosition(this.usePosition);
  },
  render: function() {
    //var editable=(this.props.permission=="read")?false:true;
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    //  var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;

    return (
      <div className="form-group" title={description}>
        <div className="col-lg-10 col-md-10 col-sm-10 col-xs-10 no-padding">
          <input
            type="text"
            ref={e => {
              this.search = e;
            }}
            className="form-control form-group"
            defaultValue={
              this.state.locationName ? this.state.locationName : ""
            }
            placeholder={"Search by location"}
          />
        </div>
        <div
          className="col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding"
          onClick={this.locateMe}
          title="Use my current location"
        >
          <i className="fa fa-2x fa-map-marker form-group form-control text-right pointer" />
        </div>
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding-left hidden ">
          <input
            type="text"
            ref={e => {
              this.latitude = e;
            }}
            className="form-control form-group"
            defaultValue={this.state.latitude}
            placeholder={"Please enter the Latitude"}
            onBlur={this.setLatLangs}
          />
        </div>
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding-right hidden">
          <input
            type="text"
            ref={e => {
              this.longitude = e;
            }}
            className="form-control form-group"
            defaultValue={this.state.longitude}
            placeholder={"Please enter the Langitude"}
            onBlur={this.setLatLangs}
          />
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
          <div
            ref={e => {
              this.geoLocation = e;
            }}
            className="form-group"
          />
        </div>
      </div>
    );
  }
});
var RatingFiled = React.createClass({
  getInitialState: function() {
    return { value: this.props.defaultValue };
  },
  clickHandler: function(value, ev) {
    this.setState({ value: value });
    this.props.setPropertyValue(
      this.props.propertyName,
      value,
      this.props.fromArray
    );
  },
  componentDidMount: function() {},
  render: function() {
    var self = this;
    var property = this.props.property;
    //	var editable=(this.props.permission=="read")?false:true;
    var key = this.props.propertyName;
    var displayName =
      typeof property.displayName != "undefined" ? property.displayName : key;
    //  var prompt = property.prompt ? property.prompt : displayName;
    var description = property.description ? property.description : displayName;
    var ratingType = property.dataType.ratingType
      ? property.dataType.ratingType
      : "star";
    var classList = {};
    if (ratingType == "star") {
      classList = { "fa-star-o": 1 };
    } else if (ratingType == "hand") {
      classList = { "fa-thumbs-o-down": "false", "fa-thumbs-o-up": "true" };
    } else if (ratingType == "smiley") {
      classList = {
        "fa-smile-o": "good",
        "fa-meh-o": "better",
        "fa-frown-o": "bad"
      };
    }
    return (
      <div className="row no-margin" title={description}>
        <span className="star-thumb-group">
          {Object.keys(classList).map(function(key, index) {
            var inputId = "";
            var result = [];
            var defaultChecked;
            if (ratingType == "star") {
              var temp = [];
              for (
                var i = property.dataType.best ? property.dataType.best : 5;
                i >= (property.dataType.worst ? property.dataType.worst : 1);
                i--
              ) {
                defaultChecked = false;
                if (self.state.value == i) {
                  defaultChecked = true;
                }
                temp.push(
                  <input
                    key={global.guid()}
                    checked={defaultChecked}
                    type="radio"
                    id={"star-" + i}
                    name={"star" + self.props.propertyName}
                    value={i}
                  />
                );
                temp.push(
                  <label
                    key={global.guid()}
                    data-id={"star-" + i}
                    onClick={self.clickHandler.bind(null, i)}
                    title={i + " star"}
                  />
                );
              }
              result.push(
                <span key={global.guid()} className="rating star-cb-group">
                  {temp}
                </span>
              );
            } else {
              inputId = ratingType + "-" + classList[key];
              defaultChecked = false;
              if (self.state.value == classList[key]) {
                defaultChecked = true;
              }
              result.push(
                <span key={global.guid()} className="rating">
                  <input
                    checked={defaultChecked}
                    type="radio"
                    id={inputId}
                    name={ratingType + self.props.propertyName}
                    value={classList[key]}
                  />
                  <label
                    data-id={inputId}
                    className={key}
                    onClick={self.clickHandler.bind(null, classList[key])}
                    title={classList[key]}
                  />
                </span>
              );
            }
            return result;
          })}
        </span>
      </div>
    );
  }
});

var ImageField = React.createClass({
  getInitialState: function() {
    return {
      images: Array.isArray(this.props.defaultValue)
        ? this.props.defaultValue
        : []
    };
  },
  allowMultiple: function() {
    var property = this.props.property;
    if (
      property.dataType.type == "attachment" ||
      property.dataType.type == "image" ||
      property.dataType.type == "privateVideo"
    ) {
      return false;
    } else if (
      property.dataType.type == "attachments" ||
      property.dataType.type == "images" ||
      property.dataType.type == "privateVideos"
    ) {
      return true;
    } else if (property.dataType.type == "array") {
      if (
        property.dataType.elements.type == "attachment" ||
        property.dataType.elements.type == "image" ||
        property.dataType.elements.type == "privateVideo"
      ) {
        return false;
      } else if (
        property.dataType.elements.type == "attachments" ||
        property.dataType.elements.type == "images" ||
        property.dataType.elements.type == "privateVideos"
      ) {
        return true;
      }
    }
  },
  getResourceType: function() {
    if (
      this.props.property.dataType.type == "attachment" ||
      this.props.property.dataType.type == "attachments"
    ) {
      return "auto";
    } else if (
      this.props.property.dataType.type == "image" ||
      this.props.property.dataType.type == "images"
    ) {
      return "image";
    } else if (
      this.props.property.dataType.type == "privateVideo" ||
      this.props.property.dataType.type == "privateVideos"
    ) {
      return "video";
    } else {
      return "auto";
    }
  },
  getImages: function(inline_container) {
    var self = this;
    //  var key = this.props.propertyName;
    //    var displayName=typeof this.props.property.displayName!="undefined"?this.props.property.displayName:key;
    //var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    //  var description=this.props.property.description?this.props.property.description:displayName;
    // 1500000 (1.5 MB)file limit in bytes 1MB(1500000) 0.5MB(500000)
    cloudinary.openUploadWidget(
      {
        cloud_name: "dzd0mlvkl",
        upload_preset: "p33vombo",
        sources:(self.getResourceType()=="image")?[
          "local",
          "url",
          "image_search",
          "dropbox",
          "facebook",
          "google_photos"
        ]:["local",
        "url",
        "dropbox",
        "facebook"],
        theme: "white",
        google_api_key: "AIzaSyD3TrCo6Jt-lc1qpbVxEOVD_VC_tiBeWdQ",
        search_by_sites: ["all", "google.com", "pinterest.com"],
        multiple: self.allowMultiple(),
        resource_type: self.getResourceType(),
        max_file_size: self.props.property.dataType.max_file_size
          ? self.props.property.dataType.max_file_size
          : 5000000,
        cropping: self.props.property.dataType.cropping ? "server" : undefined,
        client_allowed_formats: self.props.property.dataType
          .client_allowed_formats
          ? self.props.property.dataType.client_allowed_formats
          : null,
        show_powered_by: false
      },
      /*  stylesheet:'#cloudinary-widget .placeholder_image {width:100px; height:60px;}'+
	         			'#cloudinary-widget .image_cover {height:60px;}'+
	         			'#cloudinary-widget .image_holder {height:60px;border: none;}'+
	         			'#cloudinary-widget .error {float:left; font-size:9pt;color:#000}'+
	         			'#cloudinary-widget .panel.progress .thumbnails .thumbnail .error{color:#000}'+
	         			'#cloudinary-widget .panel.progress .thumbnails {width:250px; height:100px;}'+
	         			'#cloudinary-widget .panel.progress .thumbnails .thumbnail {margin:0px; padding:0px; background-color:#fff; position:relative; top:0px; left:0px; width:60px; height:60px; float:left;}'+
	         			'.widget .panel.url .note{padding:0 22px 5px 22px}'+
	         			'#cloudinary-navbar {box-shadow:none;border:0;background:#fff;-moz-border-radius: 0px; -webkit-border-radius: 0px; border-radius: 0px;}'+
	         			'#cloudinary-widget { font-family:sans-serif ;background:#fff; border:0px; box-shadow:none;-moz-border-radius: 0px -webkit-border-radius: 0px; border-radius: 0px;} '+
	         			'#cloudinary-widget .drag_area {border:2px dashed grey;padding: 10px 0;margin-top: 0;}'+
	         			'#cloudinary-navbar .close {display:none;} '+
	         			'.widget .panel.url .validation_error{margin-top:5px;height:15px}'+
	         			'.widget .panel.url .button_holder{margin-top:0}'+
	         			'.source.camera{display:none}'+
	         			'.widget .panel.progress .thumbnails .thumbnail.failed .file_name{display:none}'+
	         			'#cloudinary-widget .panel.camera .video_holder{height:50px}'+
	         			'.widget .panel.url .button_holder{margin:0}'+
                        '.widget .panel.local .drag_area .drag_content{margin-top:auto}'+
                        '#cloudinary-navbar .source.active{border-color:#000}'+
	         		  	'#cloudinary-navbar {box-shadow:none;border:0;background:#fff;-moz-border-radius: 0px; -webkit-border-radius: 0px; border-radius: 0px;} '+
	         			'.widget .panel.local .drag_area .drag_content .or {color:#000}'+
	         			'#cloudinary-widget .button, #cloudinary-widget .button.small_button {font-size:20px;font-family:sans-serif;background:#000;border-radius:0} '+
	         			'#cloudinary-navbar .source.active{border-bottom: 3px solid #000;} '+
                        '#cloudinary-widget .button:hover, #cloudinary-widget .button.small_button:hover, #cloudinary-widget .upload_button_holder:hover .button{background: #000;opacity: 0.5;} '+
	         			'#cloudinary-widget .panel.local .drag_area .drag_content .label {color:#000}'+
	         			'#cloudinary-widget {background-color: #fff; max-height:240px; margin-left:-0px;}'+
	         			'#cloudinary-widget .panel.local .drag_area .drag_content .label {color:#000}'+
	         			'#cloudinary-navbar .source .label {color:black;font-size:12px}'+
	         			'.widget .panel.progress .thumbnails .thumbnail .image{display:none}'+
	         			'.widget .panel.progress .thumbnails .thumbnail .file_info{color:#000}'+
	         			'#cloudinary-widget .image_cover { background-color: #fff;background: url(https://cloudseed.com/branding/cloudseedLoader.svg);  background-position: center;  background-repeat:no-repeat;background-size: 60px 60px;}'+
	         			'.drag_area img {display:none;}',*/
      function(error, result) {
        if (!error) {
          $(".cloudinary-thumbnails").remove();
          var images = [];
          for (var i = 0; i < result.length; i++) {
            var temp = {};
            temp["cloudinaryId"] = result[i].public_id;
            temp["name"] = result[i].original_filename;
            temp["type"] = result[i].resource_type;
            temp["caption"] = "";
            temp["url"] = result[i].secure_url;
            images.push(temp);
            if (typeof self.props.addToCurrentWindowImages == "function") {
              self.props.addToCurrentWindowImages(result[i].public_id);
            }
          }
          var existingImages = self.state.images;
          existingImages = existingImages.concat(images);
          self.setState({ images: existingImages }, function() {
            self.props.setPropertyValue(
              self.props.propertyName,
              existingImages,
              self.props.fromArray
            );
          });
        } else {
          //alert("error");
        }
      }
    );
  },
  removeImage: function(remIndex) {
    var self = this;
    var existingImages = self.state.images;
    var imageToDelete = existingImages[remIndex];

    existingImages = existingImages.filter(function(val, index) {
      if (index != remIndex) {
        return true;
      } else {
        return false;
      }
    });

    WebUtils.doPost(
      "/schema?operation=deleteImage",
      { publicId: [imageToDelete.cloudinaryId] },
      function(result) {
        if (result.data.deleted) {
          self.props.setPropertyValue(
            self.props.propertyName,
            existingImages,
            self.props.fromArray
          );
          if (!self._isUnmounted) self.setState({ images: existingImages });
        }
      }
    );
  },
  setCaption: function(index, event) {
    var caption = event.target.value.trim();
    if (caption) {
      var existingImages = this.state.images;
      existingImages[index].caption = caption;
      this.props.setPropertyValue(
        this.props.propertyName,
        existingImages,
        this.props.fromArray
      );
      this.setState({ images: existingImages });
    }
  },
  inlineRender: function() {
    if (this.state.images.length == 0 || this.allowMultiple()) {
      //this.getImages("#"+this.uploadWidgetArea.id);
    }
  },
  componentDidMount: function() {
    //this.inlineRender();
  },
  componentDidUpdate: function() {
    //	this.inlineRender();
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    //  var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    var self = this;
    return (
      <div className="row extra-padding-left" key={global.guid()}>
        {this.state.images.map(function(image, index) {
          //var imagePath="https://res.cloudinary.com/dzd0mlvkl/image/upload/t_media_lib_thumb/v1623462816/"+image.cloudinaryId+".jpg";
          var src = "";
          if (image.cloudinaryId) {
            src =
              "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/" +
              image.cloudinaryId +
              ".jpg";
          } else if (image.cloudinaryId == "" || typeof image.cloudinary =="undefined") {
            if (image.facebook) {
              src =
                "https://res.cloudinary.com/dzd0mlvkl/image/facebook/" +
                image.facebook +
                ".jpg";
            } else if (image.google) {
              src =
                "https://res.cloudinary.com/dzd0mlvkl/image/gplus/" +
                image.google +
                ".jpg";
            } else {
              src =
                "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1441279368/default_image.jpg";
            }
          }
          var content = "";
          if (self.getResourceType() == "image") {
            content = (
              <img src={src} alt="img" className="img-responsive form-group" />
            );
          } else if (self.getResourceType() == "video") {
            content = (
              <iframe
                src={image.url}
                alt="video"
                className="form-group"
                style={{ border: "none" }}
              />
            );
          } else if (self.getResourceType() == "auto") {
            content = (
              <div
                className="nav-link child-img-component form-group"
                onClick={function() {
                  window.open(image.url, "_blank");
                }}
              >
                {image.name}
              </div>
            );
          }
          return (
            <div
              key={global.guid()}
              className="col-lg-6 col-md-6 col-sm-6 col-xs-12  unequalDivs form-group  mobile-image-no-padding imgDeleteDiv"
            >
              <div
                className="col-lg-12 col-sm-12 col-xs-12 col-md-12 showDelete "
                style={{ backgroundColor: "#f0f0f0", padding: "25px" }}
              >
                <div className="" title={description}>
                  {content}
                </div>
                <div>
                  <input
                    type="text"
                    style={{ textIndent: "5px" }}
                    className="form-control margin-bottom-gap-xs"
                    defaultValue={image.caption}
                    placeholder="Enter caption"
                    onBlur={self.setCaption.bind(null, index)}
                  />
                  <div
                    title={"Delete Image"}
                    className="link text-grey"
                    style={{ fontSize: "10px" }}
                    aria-hidden="true"
                    onClick={self.removeImage.bind(null, index)}
                  >
                    Delete
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div
          className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding-left"
          ref={e => (this.uploadWidgetArea = e)}
          id={"IMAGE" + global.guid()}
        >
          {this.state.images.length > 0 && !this.allowMultiple() ? (
            ""
          ) : (
            <div
              onClick={this.getImages.bind(null, undefined)}
              className=" margin-top-gap-sm margin-bottom-gap-xs"
            >
              <div className={"jRight buttonWidth margin-bottom-gap-xs"}>
                <div className="iconHeight parent-img-component">
                  <div className="child-img-component hidden">{"Upload"}</div>
                  <div className="child-img-component no-padding">
                    <i
                      className="icons8-upload-to-the-cloud-2"
                      style={{ fontSize: "30px" }}
                    />
                  </div>
                </div>
                <div className="newCustomButton">Upload</div>
              </div>
              <button className="action-button hidden">{"Upload"}</button>
            </div>
          )}
        </div>
      </div>
    );
  }
});

var DndImageField = React.createClass({
  getInitialState: function() {
    return { images: this.props.defaultValue ? this.props.defaultValue : [] };
  },
  setCaption: function(propertyName, data, fromArray, index) {
    var caption = data;
    if (caption) {
      var existingImages = this.state.images;
      existingImages[index][propertyName] = caption;
      this.props.setPropertyValue(
        this.props.propertyName,
        existingImages,
        this.props.fromArray
      );
      this.setState({ images: existingImages });
    }
  },
  removeImage: function(remIndex) {
    var self = this;
    var existingImages = self.state.images;
    var imageToDelete = existingImages[remIndex];
    existingImages = existingImages.filter(function(val, index) {
      if (index != remIndex) {
        return true;
      } else {
        return false;
      }
    });
    WebUtils.doPost(
      "/schema?operation=deleteImage",
      { publicId: [imageToDelete.cloudinaryId] },
      function(result) {
        if (result.data.deleted) {
          self.props.setPropertyValue(
            self.props.propertyName,
            existingImages,
            self.props.fromArray
          );
          if (!self.isUnmounted)
            self.setState({ images: existingImages }, function() {});
        }
      }
    );
  },
  componentDidMount: function() {
    this.componentDidUpdate();
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  componentDidUpdate: function() {
    var obj = this.dragArea;
    var self = this;
    $(obj).on("dragenter", function(e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).css("border", "2px dashed #0B85A1");
    });
    $(obj).on("dragover", function(e) {
      e.stopPropagation();
      e.preventDefault();
    });
    $(obj).on("drop", function(e) {
      $(this).css("border", "");
      e.preventDefault();
      var files = e.originalEvent.dataTransfer.files;
      //We need to send dropped files to Server
      self.handleFileUpload(files);
    });

    $(document).on("dragenter", function(e) {
      e.stopPropagation();
      e.preventDefault();
    });
    $(document).on("dragover", function(e) {
      e.stopPropagation();
      e.preventDefault();
      $(obj).css("border", "2px dashed #0B85A1");
    });
    $(document).on("drop", function(e) {
      $(obj).css("border", "");
      e.stopPropagation();
      e.preventDefault();
    });
  },
  addImage: function() {
    $("#" + this.fileUpload.id).click();
  },
  handleFileUpload: function(files) {
    for (var i = 0; i < files.length; i++) {
      this.getFile(undefined, files[i]);
    }
  },
  getFile: function(event, dragData) {
    var file = {};
    if (typeof event == "undefined") {
      file = dragData;
    } else {
      file = event.target.files[0];
    }
    var reader = new FileReader();
    reader.readAsDataURL(file);
    var id = global.guid();
    var self = this;
    var images = this.state.images;
    this.loader.className = this.loader.className.replace("hidden", "");
    self.loader.className += " unequalDivs";

    setTimeout(function() {
      if (reader.result != null) {
        WebUtils.doPost(
          "/generic?operation=saveCloudinaryData",
          { url: reader.result, id: id },
          function(result) {
            self.fileUploadErr.className = "hidden";
            if (result.data.indexOf("success") != -1) {
              var temp = {};
              temp["cloudinaryId"] = id;
              temp["name"] = file.name;
              temp["type"] = "images";
              temp["caption"] = "";
              images.push(temp);
              self.setState({ images: images }, function() {
                self.props.setPropertyValue(
                  self.props.propertyName,
                  images,
                  self.props.fromArray
                );
                self.loader.className += " hidden";
                self.loader.className = self.loader.className.replace(
                  "unequalDivs",
                  ""
                );
              });
            } else {
              self.loader.className += " hidden";
              self.loader.className = self.loader.className.replace(
                "unequalDivs",
                ""
              );
              //common.createAlert("Try again","Please Upload The File Again")
              self.fileUploadErr.className = "errorMsg";
              self.fileUploadErr.innerHTML = "Please Upload The File Again";
            }
          }
        );
      } else {
        self.loader.className += " hidden";
        self.loader.className = self.loader.className.replace(
          "unequalDivs",
          ""
        );
        self.fileUploadErr.className = "errorMsg";
        self.fileUploadErr.innerHTML = "Please Upload The Image Again";
        //common.createAlert("Try again","Upload The Image Again")
      }
    }, 1000);
  },
  openUdf: function(index) {
    if (this["udf" + index]) {
      this["udf" + index].className = this["udf" + index].className.replace(
        /hidden/g,
        ""
      );
    }
  },
  render: function() {
    var self = this;
    var prompt = this.props.property.prompt ? this.props.property.prompt : "";
    return (
      <div
        key={global.guid()}
        className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding"
      >
        <div
          className={
            prompt.length > 0 ? "form-group paddingTopChat  " : "hidden"
          }
        >
          {prompt}
        </div>
        {this.state.images.map(function(image, index) {
          var src = "";
          if (image.cloudinaryId != "") {
            src =
              "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/" +
              image.cloudinaryId +
              ".jpg";
          } else if (image.cloudinaryId == "") {
            if (image.facebook) {
              src =
                "https://res.cloudinary.com/dzd0mlvkl/image/facebook/" +
                image.facebook +
                ".jpg";
            } else if (image.google) {
              src =
                "https://res.cloudinary.com/dzd0mlvkl/image/gplus/" +
                image.google +
                ".jpg";
            } else {
              src =
                "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1441279368/default_image.jpg";
            }
          }

          return (
            <div
              key={global.guid()}
              className="col-lg-4 col-md-4 col-sm-12 col-xs-12 no-padding-left unequalDivs  form-group  mobile-image-no-padding imgDeleteDiv"
            >
              <div
                className="col-lg-12 col-sm-12 col-xs-12 col-md-12 showDelete "
                style={{ backgroundColor: "#f2f2f2", padding: "10px" }}
              >
                <div>
                  <img
                    src={src}
                    alt="img"
                    className="img-responsive form-group"
                  />

                  <li
                    className="userNavHover  dnd list-unstyled"
                    style={{ position: "relative" }}
                  >
                    <div className="dropdown-toggle" aria-expanded="false">
                      <span className="link pull-right icons8-three-dots-symbol-2 " />
                    </div>
                    <ul
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                        marginTop: "10%",
                        paddingLeft: "5px"
                      }}
                      className="dropdown-menu arrow_box col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding"
                      id="userSubNav"
                    >
                      <div
                        className="link  margin-top-gap-sm extra-padding-bottom"
                        onClick={self.openUdf.bind(null, index)}
                        style={{ borderBottom: "1px solid lightgrey" }}
                      >
                        Create your own fields
                      </div>
                      <div
                        className="link  margin-top-gap-sm extra-padding-bottom"
                        onClick={self.removeImage.bind(null, index)}
                      >
                        Remove
                      </div>
                    </ul>
                  </li>
                  {/*}<span className="icons8-delete link deleteImage" style={{"display":"block","top":"0","right":"0"}}  aria-hidden="true" onClick={self.removeImage.bind(null,index)}></span>*/}
                </div>
                <div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
                  <UserDefinedFields
                    key={global.guid()}
                    propertyName={"udf"}
                    property={{
                      prompt: "Create your own fields",
                      description: "User defined fields",
                      displayName: "User defined fields",
                      itemProp: "",
                      dataType: {
                        type: "userDefinedFields"
                      }
                    }}
                    content={"onlyContent"}
                    permission={self.props.permission}
                    defaultValue={image.udf}
                    index={index}
                    setPropertyValue={self.setCaption}
                  />
                </div>
                <div
                  className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding hidden"
                  ref={e => (self["udf" + index] = e)}
                >
                  <UserDefinedFields
                    key={global.guid()}
                    propertyName={"udf"}
                    property={{
                      prompt: "Create your own fields",
                      description: "User defined fields",
                      displayName: "User defined fields",
                      itemProp: "",
                      dataType: {
                        type: "userDefinedFields"
                      }
                    }}
                    content={"showButton"}
                    permission={self.props.permission}
                    defaultValue={image.udf}
                    index={index}
                    setPropertyValue={self.setCaption}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div
          key={global.guid()}
          ref={e => (this.loader = e)}
          id={"loader" + global.guid()}
          className="hidden col-lg-4 col-md-4 col-sm-12 col-xs-12  form-group  mobile-image-no-padding"
        >
          <img src="/branding/cloudseedLoader.svg" height="50px" />
        </div>
        <div
          key={global.guid()}
          className="col-lg-4 col-md-4 col-sm-12 col-xs-12 no-padding-left unequalDivs form-group  mobile-image-no-padding"
        >
          <div
            className="dndButton"
            ref={e => (this.dragArea = e)}
            onClick={this.addImage}
          >
            <i className="fa fa-3x sleekIcon-arrows_plus link" />
            <input
              type="file"
              className="hidden"
              ref={e => (this.fileUpload = e)}
              id={"IMAGE" + global.guid()}
              onChange={this.getFile}
            />
          </div>
          <span ref={e => (this.fileUploadErr = e)} className="hidden" />
        </div>
      </div>
    );
  }
});

var UserDefinedFields = React.createClass({
  getInitialState: function() {
    return {
      value: this.props.defaultValue
        ? typeof this.props.defaultValue == "object" &&
          !Array.isArray(this.props.defaultValue)
          ? this.props.defaultValue
          : {}
        : {},
      showInputs: false
    };
  },
  updateText: function() {
    //  var self=this;
    var key = this.keyInputField.value.trim();
    var value = this.valueInputField.value.trim();
    var currentValue = this.state.value;
    if (key != "" && value != "") {
      currentValue[key] = value;
      this.setState({ value: currentValue, showInputs: false });
      this.props.setPropertyValue(
        this.props.propertyName,
        currentValue,
        this.props.fromArray,
        this.props.index
      );
    }
  },
  deleteProperty: function(key) {
    var currentValue = this.state.value;
    delete currentValue[key];
    this.setState({ value: currentValue, showInputs: false });
    this.props.setPropertyValue(
      this.props.propertyName,
      currentValue,
      this.props.fromArray,
      this.props.index
    );
  },
  showError: function() {
    try {
      $(this.errMsg).removeClass("hidden");
    } catch (err) {}
  },
  removeError: function() {
    try {
      if (!$(this.errMsg).hasClass("hidden")) {
        $(this.errMsg).addClass("hidden");
      }
    } catch (err) {}
  },
  showInputs: function() {
    this.setState({ showInputs: true });
  },
  componentDidUpdate: function() {},
  componentDidMount: function() {
    this.componentDidUpdate();
  },
  render: function() {
    //  var editable=(this.props.permission=="read")?false:true;
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    var self = this;
    var onlyContent =
      this.props.content && this.props.content == "onlyContent" ? "hidden" : "";
    var showButton =
      this.props.content && this.props.content == "showButton" ? true : false;
    return (
      <div
        className={
          this.props.index || this.props.index == 0
            ? ""
            : "form-group margin-top-gap-sm row remove-margin-left remove-margin-right"
        }
      >
        {Object.keys(this.state.value).map(function(key) {
          if (showButton) {
            return <div className="hidden" key={global.guid()} />;
          }
          return (
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-xs"
              key={global.guid()}
              style={{ fontSize: "12px" }}
            >
              <div className="parent-img-component ">
                <div className="child-img-component extra-padding-right-sm ">
                  <div style={{ fontSize: "10px" }} className="text-uppercase">
                    {key}
                  </div>
                  <div>{self.state.value[key]}</div>
                </div>
                <div className="child-img-component no-padding">
                  <span
                    className="icons8-delete link pull-right"
                    onClick={self.deleteProperty.bind(null, key)}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {this.state.showInputs || showButton ? (
          <div className={"row no-margin " + onlyContent} title={description}>
            <span
              ref={e => {
                this.errMsg = e;
              }}
              className="errorMsg hidden"
            >
              {"Please Fill"}
            </span>
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
              <div>
                <span className="fieldText no-padding-left headerField">
                  Field Name
                </span>
              </div>
              <input
                ref={e => {
                  this.keyInputField = e;
                }}
                type="text"
                className="form-control"
                defaultValue={""}
                placeholder={"Name your field"}
              />
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group">
              <div>
                <span className="fieldText no-padding-left headerField">
                  Content
                </span>
              </div>
              <textarea
                className="form-control"
                ref={e => {
                  this.valueInputField = e;
                }}
                defaultValue={""}
                placeholder={"Enter details"}
              />
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
              <button
                type="submit"
                className="upload-btn remove-margin-top margin-bottom-gap-sm"
                onClick={this.updateText}
              >
                ADD
              </button>
            </div>
          </div>
        ) : (
          <div
            className={
              "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group " +
              onlyContent
            }
          >
            <div className="dndButtonLink pointer" onClick={this.showInputs}>
              {prompt}
            </div>
          </div>
        )}
      </div>
    );
  }
});

var AjaxLookUpComponent = React.createClass({
  getInitialState: function() {
    return {
      skip: 0,
      limitCount: limitCount,
      currentSelectionList: [],
      showAddWithEmail: "select",
      roles: common.getSchemaRoleOnOrg(this.props.schema, this.props.org),
      currentSearchText: "",
      shouldComponentUpdate: false
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  componentWillReceiveProps: function(nextProps) {
    if (JSON.stringify(this.props.filters) != JSON.stringify(nextProps)) {
      this.setState(
        { skip: 0, shouldComponentUpdate: false },
        this.getCurrentSelectionList
      );
    }
  },
  getMore: function() {
    common.startLoader();
    var self = this;
    var newLimitCount = this.state.limitCount;
    var newSkip = 0;
    if (newLimitCount >= limitCount * 2) {
      newSkip = this.state.skip + limitCount;
    } else {
      newLimitCount = this.state.limitCount + limitCount;
    }
    if (
      self.props.filterDiv &&
      $("#" + self.props.filterDiv + "Div") &&
      $("#" + self.props.filterDiv + "Div").parent() &&
      $("#" + self.props.filterDiv + "Div")
        .parent()
        .parent() &&
      !$("#" + self.props.filterDiv + "Div")
        .parent()
        .parent()
        .hasClass("open")
    ) {
      $("#" + self.props.filterDiv + "Div")
        .parent()
        .parent()
        .addClass("open");
    }
    this.setState(
      {
        skip: newSkip,
        limitCount: newLimitCount,
        shouldComponentUpdate: false
      },
      function() {
        common.stopLoader();
        self.getCurrentSelectionList();
      }
    );
  },
  increaseSkipCount: function() {
    common.startLoader();
    var self = this;
    this.setState(
      {
        skip: self.state.skip + self.state.limitCount,
        shouldComponentUpdate: false
      },
      function() {
        common.stopLoader();
        self.getCurrentSelectionList();
      }
    );
  },
  reduceSkipCount: function() {
    var self = this;
    if (this.state.skip != 0) {
      common.startLoader();
      this.setState(
        {
          skip: self.state.skip - self.state.limitCount,
          shouldComponentUpdate: false
        },
        function() {
          common.stopLoader();
          self.getCurrentSelectionList();
        }
      );
    }
  },
  componentDidMount: function() {
    //  var self=this;
    if (!this.props.inline || this.props.openDefault) {
      this.getCurrentSelectionList();
      if (this.props.filter && this.props.filter == "filter") {
        //do nothing
      } else {
        this.searchText.focus();
      }
    }
    //this.searchText.focus();
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  getCurrentSelectionList: function() {
  	 try {
      if (this.props.property.dataType.dependentOn) {
        var dependents = this.props.property.dataType.dependentOn;
        if (!Array.isArray(dependents)) {
          dependents = [dependents];
        }
        for (var index in dependents) {
          if (!this.props.getCurrentDoc()[dependents[index]]) {
            moveScroll(dependents[index]);
            try {
            	if(this.props.schemaDoc){
              		$("#"+this.props.schemaDoc["@id"]+" "+"#"+dependents[index]+"InCompleteError").removeClass("hidden");
             	}else{
             		$("#"+dependents[index]+"InCompleteError").removeClass("hidden");
             	}
            } catch (err) {}
            return;
          }
        }
      }
    } catch (err) {}
    var fromES = false;
    try {
      if (this.props.property.dataType.refType == "ES") {
        fromES = true;
      }
    } catch (err) {}
    if (fromES) {
      this.getRecordsFromES();
    } else {
      common.startLoader();
      //	var self=this;
      WebUtils.doPost(
        "/generic?operation=lookupSchema",
        {
          filters: this.props.filters,
          searchKey: this.searchText.value,
          schema: this.props.schema,
          dependentSchema: this.props.dependentSchema,
          skip: this.state.skip,
          limit: this.state.limitCount,
          userId: common.getUserDoc().recordId,
          onlyCurrentOrgRecords:
            typeof this.props.property == "object"
              ? this.props.property.onlyCurrentOrgRecords
              : undefined,
          org: this.props.org
        },
        function(result) {
          common.stopLoader();
          if (result.error) {
            return;
          }
          try {
            $(this.createLink).removeClass("hidden");
          } catch (err) {}
          if (!this._isUnmounted)
            this.setState({
              shouldComponentUpdate: true,
              currentSelectionList: result.records,
              showAddWithEmail: "select"
            });
        }.bind(this),
        "AjaxQueue"
      );
    }
  },
  getRecordsFromES: function() {
    var self = this;
    var schema = this.props.schema;
    var searchText = this.searchText.value.trim();
    if (searchText == "") {
      searchText = schema;
    }
    var searchData = {
      searchText: searchText,
      docType: schema,
      from: this.state.skip,
      size: this.state.limitCount
    };
    common.startLoader();
    WebUtils.doPost("/search?operation=searchBydocType", searchData, function(
      result
    ) {
      common.stopLoader();
      if (result.data.result) {
        var ids = [];
        try {
          ids = result.data.result.hits.hits.map(function(record) {
            return record["_id"];
          });
          common.startLoader();
          WebUtils.getSearchResults(schema, ids, function(data) {
            try {
              $(self.createLink).removeClass("hidden");
            } catch (err) {}
            common.stopLoader();
            if (data.error) {
              console.log(data.error);
            } else {
              if (!self._isUnmounted)
                self.setState({
                  currentSelectionList: Array.isArray(data.records)
                    ? data.records
                    : [],
                  shouldComponentUpdate: true,
                  showAddWithEmail: "select"
                });
            }
          });
        } catch (err) {
          console.log(err);
        }
      }
    });
  },
  showAddWithEmail: function(type) {
    this.setState({ showAddWithEmail: type, shouldComponentUpdate: true });
  },
  addWithEmail: function() {
    var email = this.addWithEmailInput.value.trim();
    var mailformat = global.emailFormate;
    var self = this;
    this.errAddEmailMsg.className = "hidden";
    if (email.match(mailformat)) {
      var emailData = {
        email: email,
        org: this.props.org
      };
      common.startLoader();
      WebUtils.invite(emailData, function(data) {
        common.stopLoader();
        if (
          self.props.property &&
          self.props.property.dataType &&
          self.props.property.dataType.refKeyObjRef == "User"
        ) {
          var temp = {};
          temp[self.props.property.dataType.refKey] = data.recordId;
          self.fillData({ id: data.recordId, value: temp });
        } else {
          self.fillData({ id: data.recordId, value: data });
        }
      });
    } else {
      this.errAddEmailMsg.className = "errorMsg";
      this.errAddEmailMsg.innerHTML = "Please enter valid email address";
    }
  },
  handleCreate: function() {
    var self = this;
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className =
      "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    var schemaDoc = SchemaStore.get(this.props.schema);
    var knownData = {};
    try {
      if (schemaDoc["@identifier"] && schemaDoc["@identifier"] != "recordId") {
        knownData[schemaDoc["@identifier"]] = this.searchText.value;
      }
    } catch (err) {}
    ReactDOM.render(
      <common.GenericPopUpComponent
        popUpId={popUpId}
        contentDivId={contentDivId}
        sideDivId={sideDivId}
      />,
      node
    );
    ReactDOM.render(
      <DisplayCustomSchema
        callbackToCreatedRecord={function(record) {
          common.showMainContainer();
          node.remove();
          self.fillData({
            id: record.recordId,
            value: record
          });
        }}
        data={this.props.schema}
        knownData={knownData}
        schemaName={this.props.schema}
        org={this.props.org}
      />,
      document.getElementById(contentDivId)
    );
  },
  fillData: function(data) {
    this.props.callback(data);
  },
  searchOnEnter: function(e) {
    this.searchText.focus();
    //0 48, 9 57
    //a 65, z 90
    //0 96, 9 105
    //13 enter, 37 left, 38 up, 39 right, 40 down, 46 delete,9 tab, 32 space, 8 backspace
    if (
      (e.keyCode >= 48 && e.keyCode <= 57) ||
      (e.keyCode >= 65 && e.keyCode <= 90) ||
      (e.keyCode >= 96 && e.keyCode <= 105) ||
      e.keyCode == 13 ||
      e.keyCode == undefined ||
      e.keyCode == 46 ||
      e.keyCode == 8 ||
      e.keyCode == 9
    ) {
      if (
        this.state.currentSelectionList.length == 0 ||
        this.state.currentSearchText != this.searchText.value
      )
        this.setState(
          {
            skip: 0,
            currentSearchText: this.searchText.value,
            shouldComponentUpdate: false
          },
          this.getCurrentSelectionList
        );
    }
  },
  render: function() {
    var self = this;
    var schemaRec = SchemaStore.get(this.props.schema);
    var createLink = "";
    var viewName = "quickView";
    try {
      if (
        typeof this.props.property.dataType.lookupViewName == "string" &&
        this.props.property.dataType.lookupViewName != ""
      ) {
        viewName = this.props.property.dataType.lookupViewName;
      }
      if (
        this.props.property.dataType.type == "array" &&
        typeof this.props.property.dataType.elements.lookupViewName ==
          "string" &&
        this.props.property.dataType.elements.lookupViewName != ""
      ) {
        viewName = this.props.property.dataType.elements.lookupViewName;
      }
    } catch (err) {}
    if (
      this.state.roles &&
      this.state.roles.create &&
      this.state.roles.create != "" &&
      this.state.currentSelectionList.length <= this.state.limitCount &&
      (!this.props.hideCreateOption && this.props.inline)
    ) {
      createLink = (
        <span className="link" onClick={this.handleCreate}>
          <div className={"jRight buttonWidth margin-bottom-gap"}>
            <div className="iconHeight">
              <i className="icons8-plus newCustomIcon" />
            </div>
            <div className="newCustomButton">ADD NEW</div>
          </div>
        </span>
      );
    }

    var publicOption = "";
    try {
      if (
        this.props.property.dataType.type == "array" &&
        this.props.property.dataType.elements.objRef == "User" &&
        this.props.property.dataType.elements.refKey == "recordId"
      ) {
        publicOption = (
          <div className="col-xs-10 col-sm-10  col-lg-12 col-md-12">
            <div
              onClick={this.fillData.bind(null, {
                id: "public",
                value: { recordId: "public" }
              })}
              className="pointer"
            >
              Public
            </div>
          </div>
        );
      }
    } catch (err) {
      console.log("No Public option");
    }
    var placeHolder = this.props.prompt;
    if (!placeHolder) {
      placeHolder =
        "Search for " +
        (schemaRec["@displayName"]
          ? schemaRec["@displayName"]
          : schemaRec.displayName
            ? schemaRec.displayName
            : this.props.schema) +
        "";
    }
    if (this.props.filter == "filter") {
      placeHolder = "Search";
    }
    return (
      <div
        className={
          this.props.inline && !this.props.openDefault ? "AjaxAPIListRoot" : ""
        }
        id="AjaxAPIListRoot"
      >
        <div className="col-xs-12 col-sm-12  col-lg-12 col-md-12 no-padding form-group ">
          <div
            className={
              "searchPosition " +
              (this.props.filter == "filter" ? "no-margin-top" : "")
            }
          >
            <input
              type="text"
              ref={e => {
                this.searchText = e;
              }}
              onKeyUp={this.searchOnEnter}
              onClick={this.searchOnEnter}
              className={
                this.props.fullSearchBox
                  ? "form-control display-inline-block "
                  : "form-control display-inline-block maxWidthForLookUpInput"
              }
              placeholder={placeHolder}
            />
            <span
              className={
                this.props.fullSearchBox
                  ? "icons8-search pointer searchImgPosition"
                  : "icons8-search pointer searchImgPosition searchForLookup"
              }
              onClick={this.searchOnEnter}
            />
          </div>
          {publicOption}
          <div
            key={global.guid()}
            className={
              "" +
              (this.props.inline && !this.props.openDefault
                ? "AjaxAPIList"
                : "")
            }
            id="AjaxAPIList"
          >
            {/*style={this.state.currentSelectionList.length?{}:{}}*/}
            {this.state.currentSelectionList.map(function(item, index) {
              item.value.recordId = item.id;
              if (self.state.schemas != "" && index < self.state.limitCount) {
                // var singleDivWidth=(12/(Object.keys(item.value).length-1));
                return (
                  <span
                    key={global.guid()}
                    onClick={this.fillData.bind(null, item)}
                    className={"link " + (index == 0 ? "spaceAdd" : "")}
                  >
                    <genericView.GoIntoDetail
                      hideInlineEdit={true}
                      summary={true}
                      noDetail={true}
                      displayName={"no"}
                      viewName={viewName}
                      noFormGroup={self.props.noFormGroup}
                      rootSchema={self.props.schema}
                      record={item}
                      recordId={item.id}
                      org={self.props.org ? self.props.org : "public"}
                    />
                  </span>
                );
              } else {
                return <div key={global.guid()} />;
              }
            }, this)}
            {self.props.inline &&
            self.state.currentSelectionList.length > self.state.limitCount ? (
              <div
                className={
                  "col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding"
                }
                onClick={self.getMore}
              >
                <span className="blueLink pointer">More..</span>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>

        <div
          className="col-xs-12 col-sm-12  col-lg-12 col-md-12 form-group hidden no-padding"
          ref={e => {
            this.createLink = e;
          }}
        >
          {createLink}
        </div>
        {this.state.currentSelectionList.length <= self.state.limitCount &&
        (this.props.schema == "User" ||
          (this.props.property &&
            this.props.property.dataType &&
            this.props.property.dataType.refKeyObjRef == "User")) ? (
          <div className="col-xs-10 col-sm-10  col-lg-8 col-md-8 no-padding form-group">
            {this.state.showAddWithEmail == "email" ? (
              <div>
                <input
                  type="email"
                  ref={e => {
                    this.addWithEmailInput = e;
                  }}
                  placeholder="Enter email Address"
                  className="form-control"
                />
                <span
                  ref={e => {
                    this.errAddEmailMsg = e;
                  }}
                  className="errorMsg hidden"
                />
                <br />
                <div className="display-inline-block extra-padding-right">
                  <button
                    type="submit"
                    className="upload-btn"
                    onClick={this.addWithEmail}
                  >
                    Invite and add
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="pointer"
                onClick={this.showAddWithEmail.bind(null, "email")}
              >
                Click here to invite and add with email id.
              </div>
            )}
          </div>
        ) : (
          ""
        )}

        {/*(self.state.currentSelectionList.length<self.state.limitCount?"hidden":"")*/}
        {this.props.inline ? (
          ""
        ) : (
          <div
            className={
              "col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding margin-bottom-gap-bkp "
            }
          >
            <div
              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
              style={{ rightbkp: "5%" }}
            >
              <div className="pull-right" style={{ display: "table" }}>
                {self.state.skip >= self.state.limitCount ? (
                  <div
                    className="link display-table-cell extra-padding-right"
                    onClick={self.reduceSkipCount}
                  >
                    <div className="child-img-component no-padding">
                      <i className="sleekIcon-leftarrow fa-2x nextPrevIcons" />
                    </div>
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">PREV</span>
                    </div>
                  </div>
                ) : (
                  ""
                )}
                <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                {self.state.currentSelectionList.length >
                self.state.limitCount ? (
                  <div
                    className="link display-table-cell  "
                    onClick={self.increaseSkipCount}
                  >
                    <div className="child-img-component no-padding">
                      <span className="nextPrevIcons">NEXT</span>
                    </div>
                    <div className="child-img-component no-padding">
                      <i className="sleekIcon-rightarrow fa-2x nextPrevIcons" />
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
});
exports.AjaxLookUpComponent = AjaxLookUpComponent;

var LookupComponent = React.createClass({
  getInitialState: function() {
    var filters = this.props.filters ? this.props.filters : {};
    var currentOrg = this.props.org ? this.props.org : "public";
    var schemaRec = SchemaStore.get(this.props.schema);
    return {
      shouldComponentUpdate: false,
      initialFilters: filters,
      currentOrg: currentOrg,
      showOrgOptions: false,
      schemaRec: schemaRec,
      dependentSchema: this.props.dependentSchema,
      roles: common.getSchemaRoleOnOrg(this.props.schema, currentOrg)
    };
  },
  componentDidMount: function() {
    common.hideMainContainer();
    $("html,body").scrollTop(0);
    var self = this;

    /*$(".toggleOnClick").click(function() {
      if ($(".navbar-toggle").height() > 0) {
        //$(".navbar-toggle").click();
        window.scrollTo(0, 0);
      }
    });
    $(".navbar-toggle").click(function() {
      if ($(".navbar-toggle").height() > 0) {
        if (self.rootNode && self.rootNode.parentNode) {
          $(self.rootNode.parentNode).scrollTop(0);
        }
        setTimeout(function() {
          self.checkToggle();
        }, 500);
      }
    });*/
    this.loadRecordsWithFilters(this.state.initialFilters);
  },
  checkToggle: function() {
    var self = this;
    var flag = true;
    if (self.popUpNavigation && self.popUpContentDiv) {
      if (
        self.popUpNavigation.className &&
        self.popUpNavigation.className.indexOf("in") != -1
      ) {
        flag = false;
      }
      if (flag) {
        $(self.popUpContentDiv).show();
        $(self.popUpNavigation).hide();
      } else {
        $(self.popUpContentDiv).hide();
        $(self.popUpNavigation).show();
      }
    }
  },
  loadRecordsWithFilters: function(filters) {
    var self = this;
    if (self.popUpNavigation) {
      if (
        self.popUpNavigation.className &&
        self.popUpNavigation.className.indexOf("in") != -1
      ) {
        $(".navbar-toggle").click();
      }
    }
    if (
      this.state.schemaRec &&
      this.state.schemaRec["@type"] == "abstractObject" &&
      this.state.schemaRec["@dependentKey"] &&
      this.state.schemaRec["@dependentKeyDerivedFrom"] &&
      Array.isArray(
        filters[this.state.schemaRec["@dependentKeyDerivedFrom"]]
      ) &&
      filters[this.state.schemaRec["@dependentKeyDerivedFrom"]].length == 1
    ) {
      WebUtils.doPost(
        "/schema?operation=getRecord",
        { name: filters[this.state.schemaRec["@dependentKeyDerivedFrom"]][0] },
        function(savedRecord) {
          var dependentSchema = self.props.dependentSchema;
          if (
            savedRecord.data &&
            savedRecord.data[self.state.schemaRec["@dependentKey"]]
          ) {
            dependentSchema =
              savedRecord.data[self.state.schemaRec["@dependentKey"]];
          }
          if (!self._isUnmounted)
            self.setState({
              initialFilters: filters,
              dependentSchema: dependentSchema,
              shouldComponentUpdate: true
            });
        }
      );
    } else {
      if (
        JSON.stringify(this.state.initialFilters) != JSON.stringify(filters)
      ) {
        this.setState({ initialFilters: filters, shouldComponentUpdate: true });
      }
    }
  },
  componentDidUpdate: function() {
  /*  if ($(".navbar-toggle").height() > 0) {
      var self = this;
      setTimeout(function() {
        self.checkToggle();
      }, 500);
    }*/
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  handleCreate: function(methodName) {
    ReactDOM.unmountComponentAtNode(this.popUpContentCreateDiv);
    this.popUpContentCreateDiv.style.display = "block";
    this.popUpNavigation.style.display = "none";
    this.popUpContentDiv.style.display = "none";
    ReactDOM.render(
      <DisplayCustomSchema
        callbackToCreatedRecord={this.callbackToCreatedRecord}
        schemaName={this.props.schema}
        org={this.state.currentOrg}
      />,
      this.popUpContentCreateDiv
    );
  },
  callbackToCreatedRecord: function(record) {
    this.fillData({
      id: record.recordId,
      value: record
    });
  },
  fillData: function(data) {
    this.close();
    if (this.props.storeInGlobal) {
      window[this.props.schema] = data.id;
      window[this.props.storeInGlobal] = data.id;
    }
    this.props.callback(data);
  },
  close: function() {
    common.showMainContainer();
    this.rootNode.style.display = "none";
    this.rootNode.parentNode.style.display = "none";
    this.rootNode.parentNode.remove();
  },
  showOrgOptions: function() {
    this.setState({ showOrgOptions: true });
  },
  setCurrentOrg: function(org) {
    //	var self=this;
    this.setState({
      showOrgOptions: false,
      currentOrg: org,
      roles: common.getSchemaRoleOnOrg(this.props.schema, org)
    });
  },
  temp: function() {},
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  dropDownShow: function(schema) {
    //$(this.myDropdown).toggleClass("show");
    var node = document.createElement("div");
    node.id = global.guid();
    var popUpId = global.guid();
    var contentDivId = global.guid();
    var sideDivId = global.guid();
    node.className =
      "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(
      <common.GenericPopUpComponent
        popUpId={popUpId}
        contentDivId={contentDivId}
        alignMiddleDiv={true}
        sideDivId={sideDivId}
      />,
      node
    );
    ReactDOM.render(
      <FilterResults
        textRight={"textRight"}
        dropDownClass={" "}
        org={this.props.org}
        callback={this.loadRecordsWithFilters}
        callbackToClosePopup={function(newRec) {
          node.remove();
        }}
        clickClose={$(".navbar-toggle").height() > 0 ? this.temp : undefined}
        schema={this.state.schemaRec}
        appliedFilters={JSON.parse(JSON.stringify(this.state.initialFilters))}
        dependentSchema={this.state.dependentSchema}
        rootSchema={this.props.schema}
      />,
      document.getElementById(contentDivId)
    );
  },
  render: function() {
    var self = this;
    //    var id= this.props.id;
    var links = [];
    var schemaRec = this.state.schemaRec;
    var createLink = [];
    if (this.state.dependentSchema) {
      var dsRec = SchemaStore.get(
        this.props.schema + "-" + this.state.dependentSchema
      );
      if (dsRec) {
        schemaRec = global.combineSchemas(schemaRec, dsRec);
      }
    }
    var mobile=($(".navbar-toggle").height() > 0)?true:false;
    var textRight = "";
    if (
      this.state.roles &&
      this.state.roles.create &&
      this.state.roles.create != ""
    ) {
      if (
        common.getConfigDetails() &&
        common.getConfigDetails().handleBarTemplate &&
        (common.getConfigDetails().handleBarTemplate == "jsm" ||
          common.getConfigDetails().handleBarTemplate == "wevaha")
      ) {
        textRight = "jsm";
      } else {
        textRight = "text-right";
      }
      createLink.push(
        <li
          key={global.guid()}
          className="display-inline-block unequalDivs navLinksArea  "
          onClick={this.handleCreate}
        >
          <div className={"jRight buttonWidth noMinWidth" + textRight}>
            <div className="iconHeight">
              <i className="icons8-plus newCustomIcon" />
            </div>
            <div className="newCustomButton">ADD NEW</div>
          </div>
        </li>
      );
    }

    var userOrgs = [this.props.org]; //common.getUserOrgs()
    if (this.props.org != "public") {
      userOrgs.push("public");
    }
    var showOrgsSelection = true;

    var FilterComponent = [];
    var statusFilter = "";
    if (schemaRec) {
      if (schemaRec["@security"] && schemaRec["@security"]["recordLevel"]) {
        showOrgsSelection = false;
      }
      if (schemaRec["@filterKeys"]) {
        if (schemaRec["@navViews"]) {
          for (var i = 0; i < schemaRec["@navViews"].length; i++) {
            if (
              this.state.roles &&
              this.state.roles.navViews &&
              (this.state.roles.navViews == "all" ||
                this.state.roles.navViews.indexOf(
                  schemaRec["@navViews"][i].navName
                ) != -1)
            ) {
              var highlightFlag = genericNav.isSubSet(
                this.state.initialFilters,
                schemaRec["@navViews"][i].filters
              );
              statusFilter += highlightFlag
                ? schemaRec["@navViews"][i].navName + " "
                : "";
              links.push(
                <li
                  key={global.guid()}
                  className="navLinksArea toggleOnClickLater">
                  <span
                    className={"link " + (highlightFlag ? " blueLink" : "")}
                    onClick={this.loadRecordsWithFilters.bind(
                      null,
                      schemaRec["@navViews"][i].filters
                    )}>
                    {schemaRec["@navViews"][i].navName}
                  </span>
                </li>
              );
            }
            // links.push(<li className="toggleOnClick" onClick={this.loadRecordsWithFilters.bind(null,schemaRec["@navViews"][i].filters)}><span className="link">{schemaRec["@navViews"][i].navName}</span></li>);
          }
        }
        if(mobile){
          if(schemaRec["@filterKeys"].length > 0)
              FilterComponent.push(
                 <li className="display-inline-block unequalDivs list-unstyled dropdown filterContent no-padding">
                      <button
                        onClick={self.dropDownShow.bind(null, schemaRec)}
                        className="upload-btn  btn remove-margin-top"
                        type="submit">
                        {"CHOOSE FILTERS"}
                      </button>
                </li>);
        }else{
          FilterComponent.push(<FilterResultsNew
                            type="desktop"
                            textRight={"textRight"}
                            dropDownClass={" "}
                            org={this.props.org}
                            callback={this.loadRecordsWithFilters}
                            schema={this.state.schemaRec}
                            dependentSchema={self.state.dependentSchema}
                            rootSchema={self.props.schema}
                            appliedFilters={JSON.parse(JSON.stringify(this.state.initialFilters))}
                          />);
          }
          if(FilterComponent.length>0)
            FilterComponent.push(<genericView.AppliedFilters
                                    changeFilters={self.loadRecordsWithFilters}
                                    filters={JSON.parse(JSON.stringify(this.state.initialFilters))}
                                    properties={self.state.schemaRec["@properties"]}
                                    dependentKey={self.state.schemaRec["@dependentKey"]}
                                    rootSchema={self.props.schema}
                                    dependentSchema={self.state.dependentSchema}
                                    schemaDoc={self.state.schemaRec}
                                    recordId={self.props.recordId}
                                    org={self.props.org}
                                  />)

        /*FilterComponent=(<li className="child-img-component list-unstyled dropdown filterContent mega-dropdown ">
					                         <a  className="link filterContent "  >
					                             <span style={{"color":"#eb5433"}} className="filterContent" onClick={self.dropDownShow}>
					                                 {"FILTERS"}
					                              </span>
					                          </a>
					                          <div className="dropHide filterNav" ref={(l)=>{this.myDropdown=l}}>
						                          <FilterResults
														key={global.guid()}
													    clickClose={($(".navbar-toggle").height()>0)?this.temp:undefined}
														textRight={textRight}
														dropDownClass={" "}
									                    createLink={createLink}
														org={this.props.org}
														schema={schemaRec}
														appliedFilters={this.state.initialFilters}
														callback={this.loadRecordsWithFilters}/>
												</div>
					                       </li>
										);*/
        /*FilterComponent=<FilterResults key={global.guid()}
	            					appliedFilters={this.state.initialFilters}
	            					schema={schemaRec}
	                                clickClose={($(".navbar-toggle").height()>0)?this.temp:undefined}
	            					callback={this.loadRecordsWithFilters}/>*/
      }
    }

    var fromES = false;
    try {
      if (this.props.property.dataType.refType == "ES") {
        fromES = true;
      }
    } catch (err) {}
    var nav = (
      <ul
        key={global.guid()}
        style={{ zIndex: "2" }}
        className="margin-top-gap list-unstyled">
        <div className="parent-img-component">
          {createLink.length > 0 ? createLink : ""}
          {links.length > 0 ? (
            <li
              className="userNavHover display-inline-block unequalDivs"
              style={{ position: "relative" }}>
              <div
                className="child-img-component no-padding"
                style={{ verticalAlign: "middle" }} >
                <button
                  style={{ fontSize: "14px" }}
                  className="btn dropdown-toggle no-padding remove-margin-right noMinWidth"
                  type="button"
                  ref={l => {
                    self.dropdownMenu1 = l;
                  }}
                  id="dropdownMenu1"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false">
                  <a className="dropdown-toggle" aria-expanded="false">
                    <i className="icons8-folder newCustomIcon" />
                  </a>
                </button>
              </div>
              <ul
                style={{ right: "-18px", left: "auto" }}
                className="dropdown-menu arrow_box"
                id="userSubNav">
                {links}
              </ul>
            </li>
          ) : (
            ""
          )}
          {  (mobile)?FilterComponent:""}
        </div>
        {  (mobile)?"":FilterComponent}
      </ul>
    );
    /*	var nav=(<ul  key={global.guid()} className="list-unstyled col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
					 <div className="pull-right parent-img-component">
					 {(Array.isArray(createLink)>0 && createLink.length>0)?createLink:""}
							{links.length>0?
								(<li className="child-img-component list-unstyled extra-padding-right">
							                        <div className="dropdown">
											            <button style={{"fontSize":"14px"}} className="btn dropdown-toggle no-padding remove-margin-right noMinWidth" type="button" ref={(l)=>{self.dropdownMenu1=l}} id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
											            	{(statusFilter && statusFilter.length>0)?statusFilter:"Select"}
											            </button>
											            <ul className="dropdown-menu ">
											                {links}
											            </ul>
											        </div>
				                   </li>)
				                   :""}
		                   	{(!fromES)?FilterComponent:""}
                   	</div>
               </ul>)*/
    /*   var nav= (<ul className={"list-unstyled margin-bottom-gap-lg col-xs-12 "+textRight}>
                    {links}
                    <li ref={(e)=>{this.filtersArea=e}} style={{"clear":"both"}}>{(!fromES)?(FilterComponent):("")}</li>
                </ul>)
                var num=2;*/
    var extraDiv = this.props.fromWorkFlow ? (
      ""
    ) : (
      <div className="col-lg-1 col-md-1 hidden-sm hidden-xs" />
    );
    return (
      <div
        ref={e => {
          this.rootNode = e;
        }}
        className="popupAnimationDeleted">
        <div
          style={{ padding: "0px", height: "100%" }}
          className="container-fluid">
          <div className="row row-offcanvas row-offcanvas-left">
            {this.props.fromWorkFlow ? (
              ""
            ) : (
              <div className="row no-margin">
                <span
                  className="icons8-delete fontSizeDelete  fa-3x pull-right deleteIcon link"
                  onClick={this.close}
                  style={{}}
                  aria-hidden="true" />
              </div>
            )}
            <div
              style={{ clear: "both" }}
              className="row margin-top-gap-md remove-margin-top-mobile remove-margin-left remove-margin-right ">
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
                {extraDiv}
                <div
                  className={
                    this.props.fromWorkFlow
                      ? "col-xs-12 col-sm-12 col-lg-12 col-md-12"
                      : "col-xs-12 col-sm-12 col-lg-10 col-md-10"
                  } >
                  <div
                    className="col-xs-12 col-sm-12 col-lg-12 col-md-12"
                    ref={e => {
                      this.popUpNavigation = e;
                    }}>
                    {nav}
                  </div>
                  <div
                    className="col-xs-12 col-sm-9  col-lg-12 col-md-12 "
                    style={{ minHeight: "750px", display: "none" }}
                    ref={e => {
                      this.popUpContentCreateDiv = e;
                    }} />
                  <div
                    className="col-xs-12 col-sm-12  col-lg-12 col-md-12 "
                    style={{ minHeight: "750px" }}
                    ref={e => {
                      this.popUpContentDiv = e;
                    }}>
                    {/*
											(userOrgs.length>1 && showOrgsSelection)?
											(<div>
												<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  margin-top-gap-xs propertyName " >Currently Viewing</div>
												<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
													<div className="col-lg-6 col-md-6 col-xs-12 col-sm-12 margin-top-gap-xs no-padding" >
										                <button type="button" className="btn btn-default dropdown-toggle form-control"  style={{"textTransform":"none"}} title="Click here to change"  data-toggle="dropdown">
									                     	{(this.state.currentOrg=="public")?(
								                                	<div className="link" style={{"font-size":"18px","cursor": "pointer","padding-left":"25px"}}>Public</div>):(
								                                		<div key={global.guid()} className="link">
																		  	<common.UserIcon
																					id={this.state.currentOrg}
																					org={"public"}
																					rootSchema={"Organization"}
																					noDetail={true}/>
								                                		</div>
								                                	)}
									                    </button>
									                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
									                       	<li className="h5 link"  onClick={self.setCurrentOrg.bind(null,"public")}><span style={{"fontSize":"18px","cursor": "pointer","paddingLeft":"35px"}}>Public</span></li>
									                       {
									                       	userOrgs.map(function(o){
					                                			if(o=="public"){
					                                				return <li key={global.guid()} className="link hidden"></li>
					                                			}else{
					                                				return 	<li key={global.guid()} className="h5 link" onClick={self.setCurrentOrg.bind(null,o)}>
							                                					<span>
							                                						<common.UserIcon
																						id={o}
																						org={"public"}
																						rootSchema={"Organization"}
																						noDetail={true}/>
																				</span>
																		</li>
																}
					                                		})
					                                	}
									                  	</ul>
											            <div className="display-inline-block" style={{"position": "absolute","right": "3%","top":"0","transform":"rotate(90deg)"}}>
											                <span className="sleekIcon-rightarrow fa-2x "></span>
											            </div>
										           </div>
												</div></div>):("")
										*/}
                    <AjaxLookUpComponent
                      filter={this.props.filter}
                      key={global.guid()}
                      getCurrentDoc={this.props.getCurrentDoc}
                      schema={this.props.schema}
                      dependentSchema={this.state.dependentSchema}
                      property={this.props.property}
                      org={this.state.currentOrg}
                      filters={this.state.initialFilters}
                      callback={this.fillData}
                    />
                  </div>
                </div>
                {extraDiv}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
exports.LookupComponent = LookupComponent;

/**
 * data{record, expression}
 */
function ivaluateExpression(data, callback) {
  WebUtils.doPost("/generic?operation=ivaluateExpression", data, function(
    result
  ) {
    if (result && result.result) {
      callback(result.result);
    } else {
      callback("error");
    }
  });
}

function constructArrayOfFormulas(arrData, record, callback) {
  record = record ? record : {};
  if (Array.isArray(arrData)) {
    var currentValues = [];
    getVal(0);
    function getVal(index) {
      if (index < arrData.length) {
        if (arrData[index].indexOf("this") == 0) {
          ivaluateExpression(
            { record: record, expression: arrData[index] },
            function(result) {
              if (result && result != "error") {
                currentValues.push(result);
              }
              getVal(index + 1);
            }
          );
        } else {
          currentValues.push(arrData[index]);
          getVal(index + 1);
        }
      } else {
        callback(currentValues);
      }
    }
  } else {
    callback([]);
  }
}
exports.constructArrayOfFormulas = constructArrayOfFormulas;
function constructFilters(flts, record, callback) {
  record = record ? record : {};
  var filters = {};
  try {
    filters = Object.assign({}, flts);
  } catch (err) {}
  var currentKeys = Object.keys(filters);
  if (currentKeys.length == 0) {
    callback({});
  } else {
    getVal(0);
    function getVal(index) {
      if (index < currentKeys.length) {
        constructArrayOfFormulas(filters[currentKeys[index]], record, function(
          arrResp
        ) {
          filters[currentKeys[index]] = arrResp;
          getVal(index + 1);
        });
      } else {
        callback(filters);
      }
    }
  }
}
exports.constructFilters = constructFilters;

function getDefaultValues(schema, record, callback) {
  var properties = schema ? schema["@properties"] : {};
  var newObject = {};

  newObject["docType"] = schema ? schema["@id"] : undefined;
  newObject["@superType"] = schema ? schema["@superType"] : undefined;
  newObject["@identifier"] = schema ? schema["@identifier"] : undefined;
  newObject["relationDesc"] = schema ? schema["@relationDesc"] : undefined;
  newObject["cloudPointHostId"] = schema
    ? schema["cloudPointHostId"]
    : undefined;

  newObject["recordId"] = record.recordId
    ? record.recordId
    : schema["@id"] + global.guid();
  newObject["author"] = record.author
    ? record.author
    : common.getUserDoc().recordId;
  newObject["editor"] = common.getUserDoc().recordId;
  newObject["dateCreated"] = record.dateCreated
    ? record.dateCreated
    : global.getDate();
  newObject["dateModified"] = global.getDate();
  newObject["revision"] = record.hasOwnProperty("revision")
    ? record.revision * 1 + 1
    : 1;

  var keys = Object.keys(properties);
  get(0);
  function get(index) {
    if (index < keys.length) {
      var key = keys[index];
      if (
        typeof properties[key] == "object" &&
        typeof properties[key].dataType == "object"
      ) {
        var type = properties[key].dataType.type;
        if (
          type == "multiPickList" ||
          type == "array" ||
          type == "image" ||
          type == "images" ||
          type == "attachment" ||
          type == "attachments" ||
          type == "privateVideo" ||
          type == "privateVideos" ||
          type == "dndImage" ||
          type == "tags"
        ) {
          newObject[key] = [];
        } else if (
          type == "struct" ||
          type == "geoLocation" ||
          type == "userDefinedFields" ||
          type == "richText"
        ) {
          newObject[key] = {};
        } else if (type == "boolean") {
          newObject[key] = false;
        } else if (type == "number") {
          newObject[key] = undefined;
        } else {
          newObject[key] = "";
        }
        if (
          record &&
          !record[key] &&
          properties[key].dataType &&
          typeof properties[key].dataType.defaultValue != "undefined"
        ) {
          if (
            typeof properties[key].dataType.defaultValue == "string" &&
            properties[key].dataType.defaultValue.indexOf("this") == 0
          ) {
            ivaluateExpression(
              {
                record: record,
                expression: properties[key].dataType.defaultValue
              },
              function(result) {
                if (result && result != "error") {
                  newObject[key] = result;
                }
                get(index + 1);
              }
            );
          } else if (Array.isArray(properties[key].dataType.defaultValue)) {
            constructArrayOfFormulas(
              properties[key].dataType.defaultValue,
              Object.assign(record, newObject),
              function(result) {
                newObject[key] = result;
                get(index + 1);
              }
            );
          } else {
            newObject[key] = properties[key].dataType.defaultValue;
            get(index + 1);
          }
        } else {
          newObject[key] = record && record[key] ? record[key] : undefined;
          get(index + 1);
        }
      } else {
        newObject[key] = properties[key];
        get(index + 1);
      }
    } else {
      if (record.dependentProperties) {
        newObject.dependentProperties = record.dependentProperties;
      }
      if (record["$status"]) {
        newObject["$status"] = record["$status"];
      }
      callback(newObject);
    }
  }
}

function moveScroll(elementId) {
  try {
    $("html, body, .lookUpDialogBox, #topicContent").animate(
      {
        scrollTop: $("#" + elementId).offset().top - 60
      },
      0
    );
  } catch (err) {}
}

exports.moveScroll = moveScroll;

/*
 * onChange
 * optionsType=
 * options=
 * returnValue
 * displayName
 * difaultValue
 *
 * optionsType : "object"
 * options : {
 * "optionReturnValue1":{"displayName":"......"},
 * "optionReturnValue2":{"displayName":"......"}
 *
 * "optionReturnValuen":{"displayName":"......"}
 * }
 *
 * optionsType : "arrayOfStrings"
 * Options : ["optionReturnValue1","optionReturnValue2",........."optionReturnValuen"]
 *
 * optionsType : "arrayOfObjects"
 * options : [{},{},....{}]
 *
 */
var CustomMultiPickList = React.createClass({
  getInitialState: function() {
    var defaultValue = Array.isArray(this.props.defaultValue)
      ? this.props.defaultValue
      : [];
    var options = {};
    if (this.props.optionsType == "object") {
      options = this.props.options;
    } else if (this.props.optionsType == "arrayOfStrings") {
      for (var i in this.props.options) {
        options[this.props.options[i]] = { displayName: this.props.options[i] };
      }
    } else if (this.props.optionsType == "arrayOfObjects") {
      for (var i in this.props.options) {
        options[
          this.props.options[i][this.props.returnValue]
        ] = this.props.options[i];
        if (this.props.displayName) {
          options[
            this.props.options[i][this.props.returnValue]
          ].displayName = this.props.options[i][this.props.displayName];
        }
      }
    }
    for (var i in defaultValue) {
      options[defaultValue[i]].selected = true;
    }
    return { defaultValue: defaultValue, options: options };
  },
  setValue: function(key) {
    var options = this.state.options;
    options[key].selected = this["mpl" + key].checked;
    var self = this;
    var values = [];
    for (var key in this.state.options) {
      if (this.state.options[key].selected) {
        values.push(key);
      }
    }
    if (!isNaN(this.props.minSelect) && values.length < this.props.minSelect) {
      this["mpl" + key].checked = true;
      options[key].selected = true;
      values.push(key);
    }
    this.setState({ options: options }, function() {
      self.props.onChange(values);
    });
  },
  render: function() {
    var self = this;
    var positionStyle = {
      float: "left",
      fontSize: "14px",
      paddingRight: "5px"
    };
    var labelPosition = { fontWeight: "normal", fontSize: "16px" };
    if (this.props.checkBoxPosition && this.props.checkBoxPosition == "right") {
      positionStyle = { fontSize: "14px", paddingLeft: "5px" };
      labelPosition = {
        display: "-moz-box",
        display: "-webkit-box",
        fontWeight: "normal",
        fontSize: "15px"
      };
    }
    return (
      <div>
        {Object.keys(this.state.options).map(function(key) {
          var boxId = global.guid();
          return (
            <div key={global.guid()} className="margin-bottom-gap-xs">
              <input
                type="checkbox"
                onChange={self.setValue.bind(null, key)}
                ref={e => {
                  self["mpl" + key] = e;
                }}
                id={boxId}
                defaultChecked={self.state.options[key].selected}
                value={key}
              />
              <label
                htmlFor={boxId}
                className="vertical-align-middle no-margin"
                style={labelPosition}
              >
                <div style={positionStyle}>
                  {self.state.options[key].displayName}
                </div>
              </label>

              {/*<input type="checkbox"
										className="vertical-align-middle"
										value={key}
										ref={(e)=>{self["mpl"+key]=e}}
									 	onChange={self.setValue.bind(null,key)}/>&nbsp;
	   							<span className="vertical-align-middle">{self.state.options[key].displayName}</span>*/}
            </div>
          );
        })}
      </div>
    );
  }
});
exports.CustomMultiPickList = CustomMultiPickList;
var TranslateField = React.createClass({
  getInitialState: function() {
    var val = this.props.defaultValue;
    try {
      var temp = localStorage.getItem(
        this.props.org + "-" + this.props.defaultValue
      );
      if (temp) {
        val = temp;
      }
    } catch (err) {}
    return { value: val };
  },
  updateText: function(event) {
    var self = this;
    var value = event.target.value.trim();
    if (value != "" && this.state.value != value) {
      try {
        localStorage.setItem(
          self.props.org + "-" + self.props.defaultValue,
          value
        );
      } catch (err) {}
      this.setState({ value: value });
      WebUtils.doPost(
        "/generic?operation=setOrgSpecificValue",
        { org: self.props.org, key: self.props.defaultValue, value: value },
        function(result) {}
      );
    }
    this.props.setPropertyValue(
      this.props.propertyName,
      this.props.defaultValue,
      this.props.fromArray
    );
  },
  componentDidMount: function() {
    var self = this;
    WebUtils.doPost(
      "/generic?operation=getOrgSpecificValue",
      { org: this.props.org, key: this.props.defaultValue },
      function(result) {
        if (result.value) {
          try {
            localStorage.setItem(
              self.props.org + "-" + self.props.defaultValue,
              result.value
            );
          } catch (err) {}
          if (!self._isUnmounted)
            self.setState({ value: result.value }, self.componentDidUpdate);
        } else {
          self.componentDidUpdate();
        }
      }
    );
  },
  componentDidUpdate: function() {
    if (this.props.inlineEdit && this.inputField) {
      $(this.inputField).focus();
      this["inputField"].setSelectionRange(
        this.inputField.value.length,
        this.inputField.value.length
      );
    }
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    var prompt = this.props.property.prompt
      ? this.props.property.prompt
      : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    //   var self=this;

    return (
      <div className="form-group" title={description} key={global.guid()}>
        {this.state.value == "" ||
        this.state.value == this.props.property.dataType.defaultValue ? (
          this.state.value || this.props.property.dataType.defaultValue
        ) : (
          <input
            ref={e => {
              this.inputField = e;
            }}
            type={"text"}
            className="form-control"
            defaultValue={this.state.value}
            placeholder={prompt}
            onBlur={this.updateText}
          />
        )}
      </div>
    );
  }
});

var ColorField = React.createClass({
  rgbToHsl: function(r, g, b) {
    if (r == "") r = 0;
    if (g == "") g = 0;
    if (b == "") b = 0;
    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);
    if (r < 0) r = 0;
    if (g < 0) g = 0;
    if (b < 0) b = 0;
    if (r > 255) r = 255;
    if (g > 255) g = 255;
    if (b > 255) b = 255;
    hex = r * 65536 + g * 256 + b;
    hex = hex.toString(16); //(16,6)
    len = hex.length;
    if (len < 6) for (var i = 0; i < 6 - len; i++) hex = "0" + hex;
    r /= 255;
    g /= 255;
    b /= 255;
    M = Math.max(r, g, b);
    m = Math.min(r, g, b);
    d = M - m;
    if (d == 0) h = 0;
    else if (M == r) h = ((g - b) / d) % 6;
    else if (M == g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    l = (M + m) / 2;
    if (d == 0) s = 0;
    else s = d / (1 - Math.abs(2 * l - 1));
    s *= 100;
    l *= 100;
    return [h.toFixed(0) * 1, s.toFixed(1) * 1, l.toFixed(1) * 1];
  },
  calcDistance: function(v1, v2) {
    var dx = v1[0] - v2[0];
    var dy = v1[1] - v2[1];
    var dz = v1[2] - v2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
  classify: function(hex) {
    hex = hex.replace("#", "");
    var hsl = this.rgbToHsl(
      hex.substr(0, 2),
      hex.substr(2, 2),
      hex.substr(4, 2)
    );
    var distance;
    var result;
    for (var group in this.state.colors) {
      for (var colorIndex in this.state.colors[group]) {
        if (!Array.isArray(this.state.colors[group][colorIndex].hsl)) {
          var string = this.state.colors[group][colorIndex].hex.replace(
            "#",
            ""
          );
          this.state.colors[group][colorIndex].hsl = this.rgbToHsl(
            string.substr(0, 2),
            string.substr(2, 2),
            string.substr(4, 2)
          );
        }
        var temp = this.calcDistance(
          hsl,
          this.state.colors[group][colorIndex].hsl
        );
        if (distance == undefined || temp < distance) {
          distance = temp;
          result = this.state.colors[group][colorIndex];
          result.group = group;
        }
      }
    }
    return result;
  },
  getInitialState: function() {
    var current;
    if (this.props.defaultValue) {
      current = {};
      if (this.props.defaultValue.split(" ").length > 0) {
        current.hex = this.props.defaultValue.split(" ")[0];
      }
      if (this.props.defaultValue.split(" ").length > 1) {
        current.group = this.props.defaultValue.split(" ")[1];
      }
      if (this.props.defaultValue.split(" ").length > 2) {
        current.name = this.props.defaultValue.replace(current.hex, "").trim();
        current.name = current.name.replace(current.group, "").trim();
        if (!current.name) {
          current.name = current.group;
        }
      }
    }
    return { current: current };
  },
  componentDidMount: function() {
    var self = this;
    WebUtils.getDefinition("Colors", function(result) {
      if (!self._isUnmounted) self.setState({ colors: result });
    });
  },
  setColor: function(color) {
    this.setState({ current: color });
  },
  setSearchText: function() {
    this.setState({ searchText: this.searchBox.value.trim() });
  },
  doneColor: function() {
    var value = "";
    if (this.state.current) {
      if (this.state.current.hex) {
        value += this.state.current.hex;
      }
      if (this.state.current.group) {
        value += " " + this.state.current.group;
      }
      if (this.state.current.name) {
        value += " " + this.state.current.name;
      }
    }
    this.props.setPropertyValue(
      this.props.propertyName,
      value,
      this.props.fromArray
    );
    this.setState({ showColorSelector: false });
  },
  setCustomColor: function() {
    var color = {
      hex: this.colorInput.value.trim(),
      name: this.colorNameInput.value.trim()
    };
    var classified = this.classify(color.hex);
    color.group = classified.group;
    if (typeof color.name == "string" && color.name != "") {
      color.name += " " + classified.name;
    } else {
      color.name = classified.name;
    }

    this.setState({ showCustomColorInputs: false, current: color });
  },
  getCustomColorInputs: function() {
    return (
      <div className="child-img-component">
        {this.state.showCustomColorInputs ? (
          <div>
            <input
              type="color"
              ref={e => {
                this.colorInput = e;
              }}
              placeholder="Enter Color Code In Hex formate #XXXXXX"
            />
            <input
              type="text"
              ref={e => {
                this.colorNameInput = e;
              }}
              placeholder="Enter Color Name"
            />
            <span className="pointer" onClick={this.setCustomColor}>
              SET
            </span>
          </div>
        ) : (
          <div
            className="pointer"
            onClick={() => {
              this.setState({ showCustomColorInputs: true });
            }}
          >
            Custom
          </div>
        )}
      </div>
    );
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    var self = this;
    var key = this.props.propertyName;
    var displayName =
      typeof this.props.property.displayName != "undefined"
        ? this.props.property.displayName
        : key;
    //    var prompt = this.props.property.prompt ? this.props.property.prompt : displayName;
    var description = this.props.property.description
      ? this.props.property.description
      : displayName;
    return (
      <div
        className="form-group"
        title={description}
        style={{
          fontSize: "14px",
          maxWidth: "500px",
          overflowY: "auto",
          overflowX: "auto"
        }}
      >
        {self.state.colors &&
        typeof self.state.colors == "object" &&
        self.state.showColorSelector ? (
          <div>
            {/*SEARCH FOR COLORS*/}
            <div className="child-img-component">
              <div
                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
                style={{
                  fontSize: "14px",
                  maxHeight: "350px",
                  overflowY: "auto",
                  overflowX: "hidden"
                }}
              >
                <div className="searchPosition margin-bottom-gap-sm">
                  <input
                    type="text"
                    ref={e => {
                      self.searchBox = e;
                    }}
                    className="form-control"
                    placeholder="Search for colors"
                    onChange={self.setSearchText}
                  />
                  <span className="icons8-search pointer filterSearch" />
                </div>
                <ul className="list-unstyled">
                  {Object.keys(self.state.colors).map(function(group) {
                    return self.state.colors[group].map(function(color) {
                      color.group = group;
                      if (
                        !self.state.searchText ||
                        (color.name
                          .toLowerCase()
                          .indexOf(self.state.searchText.toLowerCase()) != -1 ||
                          color.hex
                            .toLowerCase()
                            .indexOf(self.state.searchText.toLowerCase()) !=
                            -1 ||
                          color.group
                            .toLowerCase()
                            .indexOf(self.state.searchText.toLowerCase()) != -1)
                      )
                        return (
                          <li
                            key={global.guid()}
                            className={
                              "pointer " +
                              (self.state.current &&
                              self.state.current.hex == color.hex
                                ? "colorBorder"
                                : "")
                            }
                            onClick={self.setColor.bind(null, color)}
                          >
                            <span
                              className={
                                "display-inline-block " +
                                (self.state.currGroup == group
                                  ? "colorBorder"
                                  : "")
                              }
                              style={{
                                backgroundColor: color.hex,
                                padding: "10px"
                              }}
                              title={color.name}
                            />
                            <span className="display-inline-block">
                              {color.name}
                            </span>
                          </li>
                        );
                    });
                  })}
                </ul>
              </div>
            </div>
            {/*GROUP SELECTOR*/}
            <div className="child-img-component">
              {Object.keys(self.state.colors).map(function(group) {
                var curr;
                self.state.colors[group].map(function(color) {
                  if (color.name == group) {
                    curr = color;
                  }
                });
                curr.group = group;
                return (
                  <div
                    className={
                      "colorGroup " +
                      (self.state.current && self.state.current.group == group
                        ? "colorBorder"
                        : "")
                    }
                    onClick={self.setColor.bind(null, curr)}
                    style={{ backgroundColor: curr.hex }}
                    title={group}
                    key={global.guid()}
                  />
                );
              })}
            </div>
            {/*COLOR SELECTOR*/}
            <div className="child-img-component">
              {self.state.colors[
                self.state.current && self.state.current.group
                  ? self.state.current.group
                  : Object.keys(self.state.colors)[0]
              ].map(function(color) {
                return (
                  <div
                    className={
                      "color " +
                      (self.state.current && self.state.current.hex == color.hex
                        ? "colorBorder"
                        : "")
                    }
                    onClick={self.setColor.bind(null, color)}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    key={global.guid()}
                  />
                );
              })}
            </div>

            {/*SELECTED COLOR*/}
            {self.state.current && self.state.current.hex ? (
              <div className="child-img-component">
                <span
                  className="display-inline-block"
                  style={{
                    backgroundColor: self.state.current.hex,
                    padding: "10px"
                  }}
                  title={self.state.current.name}
                />
                <span className="display-inline-block extra-padding-left">
                  {self.state.current.name}
                </span>
                <span
                  className="display-inline-block extra-padding-left pointer"
                  onClick={self.doneColor}
                >
                  OK
                </span>
                {self.getCustomColorInputs()}
              </div>
            ) : (
              self.getCustomColorInputs()
            )}
          </div>
        ) : (
          <div>
            {/*SELECTED COLOR*/}
            {self.state.current && self.state.current.hex ? (
              <div
                className="child-img-component pointer"
                onClick={() => {
                  self.setState({ showColorSelector: true });
                }}
              >
                <span
                  className="display-inline-block"
                  style={{
                    backgroundColor: self.state.current.hex,
                    padding: "10px"
                  }}
                  title={self.state.current.name}
                />
                <span className="display-inline-block extra-padding-left">
                  {self.state.current.name}
                </span>
              </div>
            ) : (
              <div
                className="child-img-component pointer"
                onClick={() => {
                  self.setState({ showColorSelector: true });
                }}
              >
                Select Color
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
});
exports.ColorField = ColorField;
