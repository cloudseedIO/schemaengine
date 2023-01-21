/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var browserHistory = require("react-router").browserHistory;
var genericView = require("../../view/genericView.jsx");
var manageRecords = require("../../records/manageRecords.jsx");
var SchemaStore = require("../../../stores/SchemaStore");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var global = require("../../../utils/global.js");
var common = require("../../common.jsx");
var signUp = require("../../auth/signUp.jsx");
var utility = require("../../Utility.jsx");
var linkGenerator = require("../../nav/linkGenerator.jsx");
var groupBy = require("./groupBy.jsx");

function workFlow(workFlowId, data, org, callback, cancelCalback) {
  org = typeof org == "string" ? org : undefined;
  var node = document.createElement("div");
  node.id = global.guid();
  var popUpId = global.guid();
  var contentDivId = global.guid();
  var sideDivId = global.guid();
  node.className =
    workFlowId +
    " lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
  ReactDOM.render(
    <common.GenericPopUpComponent
      popUpId={popUpId}
      contentDivId={contentDivId}
      sideDivId={sideDivId}
      alignMiddleDiv={true}
      close={cancelCalback}
    />,
    node
  );
  ReactDOM.render(
    <WorkFlow
      workFlowId={workFlowId}
      popUpId={popUpId}
      data={data}
      org={org ? org : "public"}
      callback={callback}
    />,
    document.getElementById(contentDivId)
  );
}
if (typeof window != "undefined") {
  window.workFlow = workFlow;
}
exports.workFlow = workFlow;

var WorkFlow = React.createClass({
  getInitialState: function() {
    return {
      workFlow: undefined,
      currentStep: undefined,
      previousStep: undefined,
      status: {},
      shouldComponentUpdate: false
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  closeWorkFlow: function() {
    try {
      common.showMainContainer();
      document.getElementById(this.props.popUpId).parentNode.remove();
    } catch (err) {
      console.log(err);
    }
  },
  componentDidMount: function() {
    var self = this;
    WebUtils.doPost(
      "/generic?operation=getDefinition",
      { recordId: this.props.workFlowId },
      function(result) {
        if (result.loginRequired && !common.getUserDoc().recordId) {
          self.closeWorkFlow();
          common.showLoginPopup();
          return;
        }
        if (!self._isUnmounted)
          self.setState({
            workFlow: result,
            currentStep: result.initialStep,
            shouldComponentUpdate: true
          });
      }
    );
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  render: function() {
    if (this.state.shouldComponentUpdate) {
      var style = {};
      if (this.state.workFlow["@contentMinHeight"]) {
        style = {
          minHeight: this.state.workFlow["@contentMinHeight"]
        };
      }
      return (
        <div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}>
          <div
            className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}
            style={style}
          >
            <WorkFlowContent
              currentStep={this.state.currentStep}
              workFlow={this.state.workFlow}
              previousStep={this.state.previousStep}
              status={this.state.status}
              shouldComponentUpdate={this.state.shouldComponentUpdate}
              workFlowId={this.props.workFlowId}
              popUpId={this.props.popUpId}
              data={this.props.data}
              org={this.props.org}
              callback={this.props.callback}
            />
          </div>
          {this.state.workFlow["@footers"] ? (
            <WorkFlowFooter footerData={this.state.workFlow["@footers"]} />
          ) : (
            <div className="hidden" />
          )}
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});

var WorkFlowHeader = React.createClass({
  render: function() {
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" />
    );
  }
});

var WorkFlowFooter = React.createClass({
  render: function() {
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding text-center">
        <signUp.Footer footerData={this.props.footerData} />
      </div>
    );
  }
});

var WorkFlowContent = React.createClass({
  getInitialState: function() {
    return {
      workFlow: this.props.workFlow,
      currentStep: this.props.currentStep,
      previousStep: this.props.previousStep,
      status: this.props.status,
      shouldComponentUpdate: this.props.shouldComponentUpdate
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextState.shouldComponentUpdate;
  },
  setCurrentStep: function(nextStep, currentStepStatus, current) {
    var status = this.state.status;
    var flag = true;
    if (
      current.validation &&
      current.validation.length > 0 &&
      Array.isArray(current.validation)
    ) {
      for (var i = 0; i < current.validation.length; i++) {
        if (
          typeof current.validation[i] == "object" &&
          status[Object.keys(current.validation[i])[0]]
        ) {
          if (
            Array.isArray(
              current.validation[i][Object.keys(current.validation[i])[0]]
            ) &&
            current.validation[i][Object.keys(current.validation[i])[0]]
              .length > 0
          ) {
            current.validation[i][Object.keys(current.validation[i])[0]].map(
              function(vIndex) {
                if (status[Object.keys(current.validation[i])[0]][vIndex]) {
                  //do nothing
                } else {
                  flag = false;
                }
              }
            );
          }
        } else {
          if (status[current.validation[i]]) {
            //do nothing
          } else {
            flag = false;
          }
        }
      }
    }
    if (!flag) {
      //common.createAlert("In complete",(current.validationError?current.validationError:"Please all the fields"));
      this.setCurrentStepError.className = "errorMsg";
      this.setCurrentStepError.innerHTML = current.validationError
        ? current.validationError
        : "Please all the fields";
      return;
    }
    if (currentStepStatus) {
      status[this.state.currentStep] = currentStepStatus;
    }
    this.setState({
      currentStep: nextStep,
      previousStep: this.state.currentStep,
      status: status,
      shouldComponentUpdate: true
    });
  },
  back: function(step) {
    this.setState({
      currentStep: step,
      previousStep: this.state.currentStep,
      shouldComponentUpdate: true
    });
  },
  invite: function() {
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
      <common.InvitePeople close={self.close} node={node} popUpId={popUpId} />,
      document.getElementById(contentDivId)
    );
  },
  openLink: function(part) {
    var link = "";
    var part = this.constructObject(part);
    if (part.linkType == "coe") {
      link = linkGenerator.getCOELink(part);
    } else if (part.linkType == "detail") {
      link = linkGenerator.getDetailLink(part);
    } else if (part.linkType == "summary") {
      link = linkGenerator.getSummaryLink(part);
    }
    common.reloadSession(function(res) {
      //location.href=link;
      browserHistory.push(link);
    });
  },
  openRecord: function(part) {
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
        sideDivId={sideDivId}
      />,
      node
    );
    ReactDOM.render(
      <genericView.GoIntoDetail
        rootSchema={part.schema}
        dependentSchema={part.dependentSchema}
        recordId={part.recordId}
        org={part.org ? part.org : this.props.org}
      />,
      document.getElementById(contentDivId)
    );
  },
  createdRecord: function(record) {
    var current = this.state.workFlow.workFlow[this.state.currentStep];
    var status = this.state.status;
    status[this.state.currentStep] = record;
    var nextAction;
    var stepThrough;
    for (var i = 0; i < current.length; i++) {
      if (current[i].type == "createNew") {
        nextAction = current[i].step;
        stepThrough = current[i].stepThrough;
      }
    }
    if (nextAction) {
      this.setState({
        status: status,
        currentStep: nextAction,
        previousStep: this.state.currentStep,
        shouldComponentUpdate: true
      });
    } else if (stepThrough) {
      var self = this;
      this.setState(
        { status: status, shouldComponentUpdate: false },
        function() {
          self.stepThrough(stepThrough);
        }
      );
    }
  },
  closeWorkFlow: function(closeAction) {
    if (closeAction) {
      if (closeAction == "refreshAndreload" || closeAction == "reload") {
        common.reloadSession();
      }
    }
    try {
      common.showMainContainer();
      document.getElementById(this.props.popUpId).parentNode.remove();
    } catch (err) {
      console.log(err);
    }
  },
  constructObject: function(data) {
    var newData = {};
    for (var key in data) {
      if (Array.isArray(data[key])) {
        newData[key] = [];
        for (var index in data[key]) {
          newData[key].push(
            this.constructObject({ temp: data[key][index] }).temp
          );
        }
      } else if (typeof data[key] == "object") {
        newData[key] = this.constructObject(data[key]);
      } else {
        if (typeof data[key] == "number") {
          newData[key] = data[key];
        } else if (
          data[key].indexOf("this.data") == 0 &&
          typeof this.props.data == "object"
        ) {
          eval(
            "newData['" +
              key +
              "']=this.props.data." +
              data[key]
                .split(".")
                .splice(2)
                .join(".")
          );
        } else if (
          data[key].indexOf("this.status") == 0 &&
          typeof this.state.status == "object"
        ) {
          eval(
            "newData['" +
              key +
              "']=this.state.status." +
              data[key]
                .split(".")
                .splice(2)
                .join(".")
          );
        } else if (
          data[key].indexOf("this.") == 0 &&
          typeof this.props == "object"
        ) {
          eval(
            "newData['" +
              key +
              "']=this.props." +
              data[key]
                .split(".")
                .splice(1)
                .join(".")
          );
        } else if (data[key] == "userId") {
          newData[key] = common.getUserDoc().recordId;
        } else if (data[key] == "org") {
          newData[key] = this.props.org;
        } else {
          newData[key] = data[key];
        }
      }
    }
    return newData;
  },
  stepThrough: function(doStep) {
    var self = this;
    if (
      self.state.workFlow &&
      self.state.workFlow.dos &&
      self.state.workFlow.dos[doStep] &&
      self.state.workFlow.dos[doStep].type
    ) {
      var data;

      if (self.state.workFlow.dos[doStep].type == "createFullRecord") {
        var record = JSON.parse(
          JSON.stringify(self.state.workFlow.dos[doStep].record).replace(
            /userId/g,
            common.getUserDoc().recordId
          )
        );
        record.recordId =
          self.state.workFlow.dos[doStep].schema + global.guid();
        if (!record.org) {
          record.org = self.state.workFlow.dos[doStep].org
            ? self.state.workFlow.dos[doStep].org
            : self.props.org;
        }
        record.docType = self.state.workFlow.dos[doStep].schema;
        record.author = record.author
          ? record.author
          : common.getUserDoc().recordId;
        record.editor = record.editor
          ? record.editor
          : common.getUserDoc().recordId;
        record.dateCreated = global.getDate();
        record.dateModified = global.getDate();
        record.revision = 1;
        record = self.constructObject(record);
        try {
          if (self.state.workFlow.dos[doStep].track) {
            try {
              trackThis(self.state.workFlow.dos[doStep].track, record);
            } catch (err) {}
          }
        } catch (err) {}

        WebUtils.doPost("/generic?operation=saveRecord", record, function(
          result
        ) {
          var status = self.state.status;
          status[self.state.currentStep] = record;
          //var current=self.state.workFlow.workFlow[self.state.currentStep];
          var nextAction = self.state.workFlow.dos[doStep].step;
          var stepThrough = self.state.workFlow.dos[doStep].stepThrough;
          if (nextAction) {
            self.setState({
              status: status,
              currentStep: nextAction,
              previousStep: self.state.currentStep,
              shouldComponentUpdate: true
            });
          } else if (stepThrough) {
            self.setState(
              { status: status, shouldComponentUpdate: false },
              function() {
                self.stepThrough(stepThrough);
              }
            );
          }
        });
      } else if (self.state.workFlow.dos[doStep].type == "invokeTrigger") {
        data = self.constructObject(
          self.state.workFlow.dos[doStep].triggerData
        );
        try {
          if (self.state.workFlow.dos[doStep].track) {
            try {
              trackThis(self.state.workFlow.dos[doStep].track, data);
            } catch (err) {}
          }
        } catch (err) {}
        WebUtils.invokeTrigger(data, function(d) {
          var status = self.state.status;
          status[self.state.currentStep] = record;
          //var current=self.state.workFlow.workFlow[self.state.currentStep];
          var nextAction = self.state.workFlow.dos[doStep].step;
          self.setState({
            status: status,
            currentStep: nextAction,
            previousStep: self.state.currentStep,
            shouldComponentUpdate: true
          });
        });
      } else if (self.state.workFlow.dos[doStep].type == "restAPITrigger") {
        try {
          data = self.constructObject(self.state.workFlow.dos[doStep].record);
        } catch (err) {
          return;
        }
        var operationValue = self.state.workFlow.dos[doStep].operationValue;
        try {
          if (self.state.workFlow.dos[doStep].track) {
            try {
              trackThis(self.state.workFlow.dos[doStep].track, data);
            } catch (err) {}
          }
        } catch (err) {}
        common.startLoader();
        WebUtils.doPost(
          "/restApiService?operation=" + operationValue,
          data,
          function(result) {
            console.log("restapi-----", result);
            var status;
            var nextAction;
            if (result.userExists) {
              if (result.response) {
                status = self.state.status;
                //var current=self.state.workFlow.workFlow[self.state.currentStep];
                nextAction =
                  self.state.workFlow.dos[doStep].callback.responseTrue.step;
                self.setState(
                  {
                    status: status,
                    currentStep: nextAction,
                    previousStep: self.state.currentStep,
                    shouldComponentUpdate: true
                  },
                  function() {
                    common.stopLoader();
                  }
                );
              } else {
                status = self.state.status;
                //var current=self.state.workFlow.workFlow[self.state.currentStep];
                nextAction =
                  self.state.workFlow.dos[doStep].callback.responseFalse.step;
                self.setState(
                  {
                    status: status,
                    currentStep: nextAction,
                    previousStep: self.state.currentStep,
                    shouldComponentUpdate: true
                  },
                  function() {
                    common.stopLoader();
                  }
                );
              }
            } else if (result.error) {
              common.stopLoader();
              common.createAlert("In complete", result.error, function() {
                location.href = "/";
              });
            } else {
              status = self.state.status;
              //var current=self.state.workFlow.workFlow[self.state.currentStep];
              nextAction = self.state.workFlow.dos[doStep].step;
              self.setState(
                {
                  status: status,
                  currentStep: nextAction,
                  previousStep: self.state.currentStep,
                  shouldComponentUpdate: true
                },
                function() {
                  common.stopLoader();
                }
              );
            }
          }
        );
      } else if (self.state.workFlow.dos[doStep].type == "callback") {
        if (typeof self.props.callback == "function") {
          var value = self.state.workFlow.dos[doStep].value;
          value = self.constructObject({ key: value }).key;
          if (self.state.workFlow.dos[doStep].valueType == "object") {
            WebUtils.doPost(
              "/schema?operation=getRecord",
              { name: value },
              function(savedRecord) {
                self.props.callback({ value: savedRecord.data, id: value });
                if (self.state.workFlow.dos[doStep].complete) {
                  self.closeWorkFlow();
                  return;
                }
                var status = self.state.status;
                //var current=self.state.workFlow.workFlow[self.state.currentStep];
                var nextAction = self.state.workFlow.dos[doStep].step;
                self.setState(
                  {
                    status: status,
                    currentStep: nextAction,
                    previousStep: self.state.currentStep,
                    shouldComponentUpdate: true
                  },
                  function() {
                    common.stopLoader();
                  }
                );
              }
            );
          } else {
            self.props.callback(value);
            if (self.state.workFlow.dos[doStep].complete) {
              self.closeWorkFlow();
              return;
            }
            var status = self.state.status;
            //var current=self.state.workFlow.workFlow[self.state.currentStep];
            var nextAction = self.state.workFlow.dos[doStep].step;
            self.setState(
              {
                status: status,
                currentStep: nextAction,
                previousStep: self.state.currentStep,
                shouldComponentUpdate: true
              },
              function() {
                common.stopLoader();
              }
            );
          }
        }
      }
    }
  },
  optionPicked: function(id) {
    var current = this.state.workFlow.workFlow[this.state.currentStep];
    var status = this.state.status;
    status[this.state.currentStep] = id;
    var nextAction;
    var stepThrough;
    for (var i = 0; i < current.length; i++) {
      if (
        current[i].type == "pickList" ||
        current[i].type == "lookUp" ||
        current[i].type == "getValue"
      ) {
        if (!id) {
          nextAction = current[i].errorStep;
        } else {
          nextAction = current[i].step;
        }
        stepThrough = current[i].stepThrough;
      }
    }
    var self = this;
    if (nextAction) {
      this.setState({
        status: status,
        currentStep: nextAction,
        previousStep: this.state.currentStep,
        shouldComponentUpdate: true
      });
    } else if (stepThrough) {
      this.setState(
        { status: status, shouldComponentUpdate: false },
        function() {
          self.stepThrough(stepThrough);
        }
      );
    }
  },
  setInputValue: function() {
    this.textInputErrMsg.className += " hidden";
    if (this.textInput.value.trim() == "") {
      this.textInputErrMsg.className = "errorMsg";
      this.textInputErrMsg.innerHTML = "Please enter a value.";
      //common.createAlert("In complete",("Please enter a value."));
      return;
    }
    var current = this.state.workFlow.workFlow[this.state.currentStep];
    var status = this.state.status;
    status[this.state.currentStep] = this.textInput.value.trim();
    var nextAction;
    var stepThrough;
    for (var i = 0; i < current.length; i++) {
      if (current[i].type == "textInput") {
        nextAction = current[i].step;
        stepThrough = current[i].stepThrough;
      }
    }
    if (nextAction) {
      var self = this;
      this.setState({
        status: status,
        currentStep: nextAction,
        previousStep: self.state.currentStep,
        shouldComponentUpdate: true
      });
    } else if (stepThrough) {
      this.stepThrough(stepThrough);
    }
  },
  resetStatusAtIndex: function(index) {
    if (this.state.status && this.state.status[this.state.currentStep]) {
      if (
        this.state.status[this.state.currentStep][index] &&
        this.state.status[this.state.currentStep][index] != ""
      ) {
        var status = this.state.status;
        if (
          Object.keys(status[this.state.currentStep]).length == 1 &&
          index == 0
        ) {
          delete status[this.state.currentStep];
        } else {
          delete status[this.state.currentStep][index];
        }

        this.setState({ status: status, shouldComponentUpdate: false });
      }
    }
  },
  setMultiText: function(refValue, current, index) {
    this[refValue + "error"].className = "hidden";
    this[refValue + "error2"].className = "hidden";
    var value = this[refValue].value.trim();
    if (value == "") {
      this[refValue + "error"].className = "";
      /* if(this.state.status && this.state.status[this.state.currentStep]){
                if(this.state.status[this.state.currentStep][index] && this.state.status[this.state.currentStep][index]!="" ){
                    var status=this.state.status;
                    delete status[this.state.currentStep][index];
                    this.setState({status:status,shouldComponentUpdate:false});
                }
            }*/
      this.resetStatusAtIndex(index);
      return;
    }
    if (current.validation) {
      if (current.validation == "email") {
        if (
          /^(\b.*[a-zA-Z]+.*\b)+@((\b.*[a-zA-Z]+.*\b)+.)+([a-zA-Z]{2,4})+$/.test(
            value
          )
        ) {
          if (current.validationDomains) {
            var domain = value
              .split("@")[1]
              .split(".")[0]
              .toLowerCase();
            if (current.validationDomains.indexOf(domain) != -1) {
              //common.createAlert("In complete",("please do not use public domain email ids"));
              this[refValue + "error2"].className = "";
              this[refValue + "error2"].innerHTML =
                "Please do not use public domain email ids";
              this[refValue].value = "";
              this.resetStatusAtIndex(index);
              return;
            } else {
              //do nothing
            }
          } else {
            //do nothing
          }
        } else {
          this[refValue + "error"].className = "";
          this.resetStatusAtIndex(index);
          return;
        }
      } else if (current.validation == "count") {
        if (
          current.validationCount &&
          value.length >= current.validationCount
        ) {
          //do nothing
        } else {
          this[refValue + "error"].className = "";
          this.resetStatusAtIndex(index);
          return;
        }
      }
    }
    var status = this.state.status;
    if (!status[this.state.currentStep]) {
      status[this.state.currentStep] = {};
    }
    status[this.state.currentStep][index] = value;
    this.setState({ status: status, shouldComponentUpdate: false });
  },
  render: function() {
    var self = this;
    var org;
    if (
      this.state.workFlow &&
      this.state.currentStep &&
      this.state.workFlow.workFlow &&
      this.state.workFlow.workFlow[this.state.currentStep]
    ) {
      return (
        <div
          key={global.guid()}
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"
        >
          {this.state.workFlow["@headers"] ? (
            <WorkFlowHeader />
          ) : (
            <div className="hidden" />
          )}
          {this.state.workFlow.workFlow[this.state.currentStep].map(function(
            part
          ) {
            var css = part.css ? utility.getReactStyles(part.css) : {};
            var buttonCSS = part.buttonCSS
              ? utility.getReactStyles(part.buttonCSS)
              : {};
            if (part.type == "createNew") {
              // var currentSchema=SchemaStore.getSchema(part.schema);
              var editFields = part.editFields ? part.editFields : undefined;
              var actions = part.recordsActions
                ? part.recordsActions
                : undefined;
              var readOnlyFields = part.readOnlyFields
                ? part.readOnlyFields
                : undefined;
              var knownData = {};
              if (part.knownData) {
                knownData = self.constructObject(part.knownData);
              }
              org = self.constructObject({
                org: part.org
                  ? part.org
                  : self.props.org
                    ? self.props.org
                    : "public"
              }).org;

              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                >
                  <manageRecords.DisplayCustomSchema
                    fromWorkFlow={true}
                    org={org}
                    schemaName={part.schema}
                    data={part.schema}
                    editFields={editFields}
                    readOnlyFields={readOnlyFields}
                    actions={actions}
                    dependentSchema={part.dependentSchema}
                    knownData={knownData}
                    createCallback={self.createdRecord}
                  />
                </div>
              );
            } else if (part.type == "message") {
              var message = "";
              if (part.message) {
                if (part.internalLink) {
                  if (part.message.indexOf("'$'") == -1) {
                    message = part.message;
                  } else {
                    return (
                      <div
                        key={global.guid()}
                        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding"
                        style={css}
                      >
                        <InternalLink
                          part={part}
                          message={part.message}
                          status={self.state.status}
                          actionView={self.openRecord}
                          closeWorkFlow={self.closeWorkFlow}
                          actionLink={self.openLink}
                        />
                      </div>
                    );
                  }
                } else if (part.dynamicStatus) {
                  evaluateDynamicStatus(
                    self.state.status,
                    part,
                    part.message,
                    function(result) {
                      message = result;
                    }
                  );
                } else {
                  message = part.message;
                }
              }
              if (part.icon) {
                var iconClass = part.icon;
                return (
                  <div
                    key={global.guid()}
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                      (part.class ? part.class : "")
                    }
                    style={css}
                  >
                    <span className={iconClass} />
                  </div>
                );
              }
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                >
                  <span
                    dangerouslySetInnerHTML={{ __html: message ? message : "" }}
                  />
                </div>
              );
            } else if (part.type == "linkToViewRecord") {
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                  onClick={self.openRecord.bind(null, part)}
                >
                  {part.message ? part.message : ""}
                </div>
              );
            } else if (part.type == "link") {
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                  onClick={self.openLink.bind(null, part)}
                >
                  {part.message ? part.message : ""}
                </div>
              );
            } else if (part.type == "nextStep") {
              if (part.stepThrough) {
                return (
                  <div
                    key={global.guid()}
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left " +
                      (part.class ? part.class : "")
                    }
                    style={css}
                  >
                    <input
                      type="submit"
                      style={buttonCSS}
                      value={part.displayName ? part.displayName : "CONTINUE"}
                      className={
                        "action-button " +
                        (part.buttonClass ? part.buttonClass : "")
                      }
                      onClick={self.stepThrough.bind(null, part.stepThrough)}
                    />
                  </div>
                );
              } else {
                return (
                  <div
                    key={global.guid()}
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left " +
                      (part.class ? part.class : "")
                    }
                    style={css}
                  >
                    <input
                      type="submit"
                      style={buttonCSS}
                      value={part.displayName ? part.displayName : "CONTINUE"}
                      className={
                        "action-button " +
                        (part.buttonClass ? part.buttonClass : "")
                      }
                      onClick={self.setCurrentStep.bind(
                        null,
                        part.step,
                        part.status,
                        part
                      )}
                    />
                    <span
                      className="errorMsg hidden"
                      ref={e => {
                        self.setCurrentStepError = e;
                      }}
                    />
                  </div>
                );
              }
            } else if (part.type == "prevStep") {
              if (part.linkType && part.linkType == "arrowBack") {
                return (
                  <div
                    key={global.guid()}
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left "
                    }
                    style={css}
                  >
                    <div
                      className="link"
                      onClick={self.back.bind(null, part.step)}
                    >
                      <div className="icons8-left-arrow-2  display-inline-block " />
                      <span>
                        &nbsp;{part.displayName ? part.displayName : "BACK"}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={global.guid()}
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left " +
                      (part.class ? part.class : "")
                    }
                    style={css}
                  >
                    <input
                      type="submit"
                      style={buttonCSS}
                      value={part.displayName ? part.displayName : "BACK"}
                      className={
                        "action-button " +
                        (part.buttonClass ? part.buttonClass : "")
                      }
                      onClick={self.back.bind(null, part.step)}
                    />
                  </div>
                );
              }
            } else if (part.type == "close") {
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                >
                  <input
                    type="submit"
                    style={buttonCSS}
                    value={part.displayName ? part.displayName : "CONTINUE"}
                    className={
                      "action-button " +
                      (part.buttonClass ? part.buttonClass : "")
                    }
                    onClick={self.closeWorkFlow.bind(null, part.closeAction)}
                  />
                </div>
              );
            } else if (part.type == "showRecord") {
              var recordId = self.constructObject({ recordId: part.recordId })
                .recordId;
              org = part.org
                ? self.constructObject({ recordId: part.org }).org
                : self.props.org;
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                >
                  <InternalDetail
                    rootSchema={part.schema}
                    dependentSchema={part.dependentSchema}
                    summary={part.summary}
                    viewName={part.viewName}
                    recordId={recordId}
                    org={org ? org : self.props.org}
                  />
                </div>
              );
            } else if (part.type == "invite") {
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                >
                  <input
                    type="submit"
                    style={buttonCSS}
                    value={part.displayName ? part.displayName : "INVITE"}
                    className="action-button"
                    onClick={self.invite}
                  />
                </div>
              );
            } else if (part.type == "pickList") {
              return (
                <PickList
                  key={global.guid()}
                  data={part}
                  constructObject={self.constructObject}
                  callback={self.optionPicked}
                />
              );
            } else if (part.type == "getValue") {
              return (
                <GetValue
                  key={global.guid()}
                  data={part}
                  constructObject={self.constructObject}
                  callback={self.optionPicked}
                />
              );
            } else if (part.type == "lookUp") {
              return (
                <LookUp
                  key={global.guid()}
                  data={part}
                  constructObject={self.constructObject}
                  callback={self.optionPicked}
                />
              );
            } else if (part.type == "textInput") {
              var textInputCss = part.textInputCss
                ? utility.getReactStyles(part.textInputCss)
                : {};
              return (
                <div
                  key={global.guid()}
                  className={
                    "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                    (part.class ? part.class : "")
                  }
                  style={css}
                >
                  <input
                    type="text"
                    style={textInputCss}
                    placeholder={part.prompt}
                    ref={e => {
                      self.textInput = e;
                    }}
                    className={
                      "form-control form-group " +
                      (part.textInputClass ? part.textInputClass : "")
                    }
                  />
                  <div>
                    <span
                      className="errorMsg hidden"
                      ref={e => {
                        self.textInputErrMsg = e;
                      }}
                    />
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left">
                    <input
                      type="submit"
                      style={buttonCSS}
                      value={part.displayName ? part.displayName : "CONTINUE"}
                      className="action-button"
                      onClick={self.setInputValue}
                    />
                  </div>
                </div>
              );
            } else if (part.type == "multiTextInput") {
              if (
                part.data &&
                part.data.length > 0 &&
                Array.isArray(part.data)
              ) {
                return (
                  <div
                    key={global.guid()}
                    className={
                      "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                      (part.class ? part.class : "")
                    }
                    style={css}
                  >
                    {part.data.map(function(input, index) {
                      return (
                        <div
                          key={global.guid()}
                          className={
                            "col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding " +
                            (input.class ? input.class : "")
                          }
                          style={
                            input.css ? utility.getReactStyles(input.css) : {}
                          }
                        >
                          <div
                            style={
                              input.textInputCss
                                ? utility.getReactStyles(input.textInputCss)
                                : {}
                            }
                            className={
                              input.textInputClass ? input.textInputClass : ""
                            }
                          >
                            <input
                              type="text"
                              placeholder={input.prompt}
                              ref={e => {
                                self["multiTextInput" + index] = e;
                              }}
                              className={"form-control "}
                              onBlur={self.setMultiText.bind(
                                null,
                                "multiTextInput" + index,
                                input,
                                index
                              )}
                            />
                            <div
                              className="hidden"
                              style={{
                                color: "red",
                                fontSize: "12px",
                                textAlign: "left"
                              }}
                              ref={e => {
                                self["multiTextInput" + index + "error"] = e;
                              }}
                            >
                              {input.errorPrompt
                                ? input.errorPrompt
                                : "Enter valid data"}
                            </div>
                            <div
                              className="hidden"
                              style={{
                                color: "red",
                                fontSize: "12px",
                                textAlign: "left"
                              }}
                              ref={e => {
                                self["multiTextInput" + index + "error2"] = e;
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } else {
                return <div key={global.guid()} className="hidden" />;
              }
            } else {
              return (
                <div
                  key={global.guid()}
                  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding"
                  style={css}
                >
                  {JSON.stringify(part)}
                </div>
              );
            }
          })}
        </div>
      );
    } else {
      return <div />;
    }
  }
});

var InternalLink = React.createClass({
  login: function() {
    if (typeof this.props.closeWorkFlow == "function") {
      this.props.closeWorkFlow();
      var email = "";
      if (this.props.status && this.props.status.signup) {
        email = this.props.status.signup[0]
          ? this.props.status.signup[0].toLowerCase()
          : "";
      }
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
          sideDivId={sideDivId}
          noSideDiv={true}
        />,
        node
      );
      ReactDOM.render(
        <signUp.LoginPopup
          popUpId={popUpId}
          contentDivId={contentDivId}
          emailId={email}
        />,
        document.getElementById(contentDivId)
      );
    }
  },
  getData: function(data) {
    if (this.props.part[data]) {
      /*            "type": "link",
            "linkType": "coe",
            "message": "Create Moodboard",
            "schema": "IdeaBoard",
            "org": "this.status.projectCreation.recordId",
            "css": {
              "color": "#399cfd",
              "cursor": "pointer",
              "font-size": "18px",
              "fontWeight": 400,
              "text-transform": "uppercase",
              "font-family": "Lato"
            }*/
      if (
        this.props.part[data].linkType == "login" &&
        this.props.part[data].message
      ) {
        return (
          <span
            key={global.guid()}
            onClick={this.login}
            style={
              this.props.part[data] && this.props.part[data].css
                ? utility.getReactStyles(this.props.part[data].css)
                : {}
            }
          >
            {this.props.part[data].message}&nbsp;
          </span>
        );
      } else {
        if (this.props.part[data].message) {
          return (
            <span
              key={global.guid()}
              onClick={
                this.props.part[data].type == "linkToViewRecord"
                  ? this.props.actionView.bind(null, this.props.part[data])
                  : this.props.actionLink.bind(null, this.props.part[data])
              }
              style={
                this.props.part[data] && this.props.part[data].css
                  ? utility.getReactStyles(this.props.part[data].css)
                  : {}
              }
            >
              {this.props.part[data].message}&nbsp;
            </span>
          );
        } else {
          return <span key={global.guid()} className="hidden" />;
        }
      }
    } else {
      return <span key={global.guid()} className="hidden" />;
    }
  },
  render: function() {
    var contents = this.props.message.split("'$'");
    var self = this;
    return (
      <span key={global.guid()}>
        {contents.map(function(content, index) {
          if (index == 0) {
            return <span key={global.guid()}>{content}&nbsp;</span>;
          } else {
            if (content.split(" ").length > 0) {
              return content.split(" ").map(function(innerContent, id) {
                if (id == 0) {
                  return self.getData(innerContent);
                } else {
                  return <span key={global.guid()}>{innerContent}&nbsp;</span>;
                }
              });
            } else {
              return self.getData(content);
            }
          }
        })}
      </span>
    );
  }
});

function evaluateDynamicStatus(status, part, message, callback) {
  if (message.indexOf("'$'") == -1) {
    callback(message);
  } else {
    var index = message.indexOf("'$'");
    var dS = message.substr(index + 3, message.length).split(" ")[0];
    if (dS && dS.length > 0) {
      var cS = "";
      if (dS.indexOf("[") == -1) {
        cS = status[dS] ? status[dS] : "";
        message = message.replace(
          "'$'" + message.substr(index + 3, message.length).split(" ")[0],
          cS
        );
      } else if (
        dS.split("[").length == 2 &&
        dS.split("[")[1].split("]").length == 2 &&
        status[dS.split("[")[0]]
      ) {
        cS = status[dS.split("[")[0]][dS.split("[")[1].split("]")[0]];
        message = message.replace(
          "'$'" + message.substr(index + 3, message.length).split(" ")[0],
          cS
        );
      }
      var nextMessage = message.substr(index + 3, message.length);
      if (nextMessage.indexOf("'$'") == -1) {
        console.log(message);
        callback(message);
      } else {
        evaluateDynamicStatus(status, part, message, callback);
      }
    } else {
      console.log(message);
      callback(message);
    }
  }
}

var InternalDetail = React.createClass({
  getInitialState: function() {
    return { id: global.guid() };
  },
  componentDidMount: function() {
    if (this.props.summary) {
      ReactDOM.render(
        <common.UserIcon
          id={this.props.recordId}
          recordId={this.props.recordId}
          org={this.props.org}
          rootSchema={this.props.rootSchema}
          viewName={this.props.viewName}
          noDetail={true}
        />,
        document.getElementById(this.state.id)
      );
    } else {
      ReactDOM.render(
        <genericView.GoIntoDetail
          rootSchema={this.props.rootSchema}
          dependentSchema={this.props.dependentSchema}
          recordId={this.props.recordId}
          org={this.props.org}
          viewName={this.props.viewName}
          fromPopUp={this.state.id}
          contentDivId={this.state.id}
        />,
        document.getElementById(this.state.id)
      );
    }
  },
  render: function() {
    return <div id={this.state.id} />;
  }
});
var LookUp = React.createClass({
  gotValue: function(value) {
    var property = this.props.data.property;
    var currVal = value.value[property.dataType.refKey];
    this.props.callback(currVal);
  },
  render: function() {
    var self = this;
    var property = this.props.data.property;
    var schema = property.dataType.objRef;
    var filters = property.dataType.filters;
    if (typeof filters == "object") {
      filters = self.props.constructObject(filters);
    }
    var org = property.org
      ? self.props.constructObject({ org: property.org }).org
      : "public";
    if (property.dataType.getFromGroupView) {
      var groupData = property.dataType.getFromGroupView;
      var arrKeyResp = this.props.constructObject({
        key: property.dataType.getFromGroupView.key
      }).key;
      //		var groupData=property.dataType.getFromGroupView;
      groupData.key = arrKeyResp;
      var currentStateRecord = {};
      return (
        <groupBy.GroupBy
          key={global.guid()}
          sourceSchema={schema}
          displayName={property.displayName}
          org={org}
          groupDetails={groupData}
          rootRecord={currentStateRecord}
          showCreate={false}
          callback={function(item) {
            self.gotValue(item);
          }}
        />
      );
    } else {
      return (
        <div>
          <manageRecords.LookupComponent
            schema={schema}
            fromWorkFlow={true}
            property={property}
            dependentSchema={property.dataType.objRefDependentSchema}
            filters={filters}
            org={org}
            callback={self.gotValue}
          />
        </div>
      );
    }
  }
});
var PickList = React.createClass({
  getInitialState: function() {
    return { options: [], doneFetching: false, errorMsg: "" };
  },
  componentDidMount: function() {
    var self = this;
    if (this.props.data.elements && this.props.data.elements.options) {
      if (this.props.data.elements.options.type == "getFromURL") {
        common.startLoader();
        WebUtils.doPost(
          this.props.data.elements.options.url,
          this.props.data.elements.options.postData,
          function(projectOrgs) {
            self.setState({ options: projectOrgs.value, doneFetching: true });
            common.stopLoader();
          }
        );
      } else if (this.props.data.elements.options.type == "lookup") {
        var schema = self.props.constructObject({
          schema: this.props.data.elements.options.schema
        }).schema;
        var org = self.props.constructObject({
          org: this.props.data.elements.options.org
        }).org;
        var flts = self.props.constructObject(
          this.props.data.elements.options.filters
        );
        WebUtils.doPost(
          "/generic?operation=lookupSchema",
          {
            filters: flts,
            schema: schema,
            userId: common.getUserDoc().recordId,
            org: org
          },
          function(result) {
            if (result.error) {
              //common.createAlert("In complete",(result.error));
              self.setState({ errorMsg: result.error });
            } else if (Array.isArray(result.records)) {
              self.setState({
                options: result.records,
                doneFetching: true,
                errorMsg: result.records.length == 0 ? "No Results found." : ""
              });
            } else {
              self.setState({
                options: [],
                doneFetching: true,
                errorMsg: "Error while fetching records."
              });
            }
            common.stopLoader();
          }
        );
      }
    }
  },
  optionSelected: function(id) {
    if (this.props.data.elements.type == "object") {
      var self = this;
      common.startLoader();
      WebUtils.doPost("/schema?operation=getRecord", { name: id }, function(
        savedRecord
      ) {
        self.props.callback(savedRecord.data);
        common.stopLoader();
      });
    } else {
      this.props.callback(id);
    }
  },
  render: function() {
    var self = this;
    var css = this.props.data.css
      ? utility.getReactStyles(this.props.data.css)
      : {};
    return (
      <div
        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group"
        style={css}
      >
        <div>
          {this.state.doneFetching && this.state.options.length == 0
            ? this.props.data.noContentMessage
              ? this.props.data.noContentMessage
              : ""
            : this.state.doneFetching
              ? this.props.data.message
                ? this.props.data.message
                : ""
              : this.state.errorMsg}
        </div>
        {this.state.options.map(function(o) {
          if (self.props.data.elements.type == "object") {
            if (typeof o == "string") {
              return (
                <div
                  key={global.guid()}
                  className="link"
                  onClick={self.optionSelected.bind(null, o)}
                >
                  <common.UserIcon
                    id={o}
                    org={"public"}
                    rootSchema={self.props.data.elements.objRef}
                    noDetail={true}
                  />
                </div>
              );
            } else {
              return (
                <div
                  key={global.guid()}
                  className="link"
                  onClick={self.optionSelected.bind(null, o.id)}
                >
                  <genericView.GoIntoDetail
                    summary={true}
                    noDetail={true}
                    displayName={"no"}
                    viewName={"quickView"}
                    rootSchema={self.props.data.elements.options.schema}
                    record={o}
                    recordId={o.id}
                    org={"public"}
                  />
                </div>
              );
            }
          } else {
            return (
              <div key={global.guid()} className="link">
                o
              </div>
            );
          }
        })}
      </div>
    );
  }
});
var GetValue = React.createClass({
  getInitialState: function() {
    return {
      value: undefined,
      showError: false,
      showSelection: false
    };
  },
  componentDidMount: function() {
    var self = this;
    common.startLoader();
    var data = this.props.constructObject(this.props.data.postData);
    WebUtils.doPost(this.props.data.url, data, function(defaultRole) {
      common.stopLoader();
      self.setState({ value: defaultRole.value }, self.checkReturnType);
    });
  },
  checkReturnType: function() {
    if (
      this.props.data.resultType == "array" &&
      this.props.data.returnType == "string"
    ) {
      if (this.state.value.length == 0) {
        this.setState({ showError: true });
        this.props.callback(null);
      } else if (this.state.value.length == 1) {
        this.props.callback(this.state.value[0]);
      } else {
        this.setState({ showSelection: true });
      }
    } else {
      this.props.callback(this.state.value);
    }
  },
  selectItem: function(item) {
    this.props.callback(item);
  },
  render: function() {
    var self = this;
    var css = this.props.data.css
      ? utility.getReactStyles(this.props.data.css)
      : {};
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group">
        <div style={css}>
          {this.props.data.message ? this.props.data.message : ""}
        </div>
        {this.state.showError ? (
          <div style={css}>{this.props.data.errorMessage}</div>
        ) : (
          ""
        )}
        {this.state.showSelection ? (
          <div>
            {this.state.value.map(function(item) {
              if (
                typeof self.props.data.dataType == "object" &&
                self.props.data.dataType.type == "object"
              ) {
                return (
                  <div key={item} onClick={self.selectItem.bind(null, item)}>
                    <common.UserIcon
                      id={item}
                      org={"public"}
                      rootSchema={self.props.data.dataType.objRef}
                      noDetail={true}
                    />
                  </div>
                );
              } else {
                return (
                  <div key={item} onClick={self.selectItem.bind(null, item)}>
                    {item}
                  </div>
                );
              }
            })}
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
});
