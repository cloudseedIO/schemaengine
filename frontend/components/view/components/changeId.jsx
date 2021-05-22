/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var common = require("../../common.jsx");
var WebUtils = require("../../../utils/WebAPIUtils.js");
//var linkGenerator=require('../../nav/linkGenerator.jsx');
var browserHistory = require("react-router").browserHistory;
var global = require("../../../utils/global.js");
/**
 *id,schema,org
 */
var ChangeId = React.createClass({
  getInitialState: function() {
    return { current: "", userName: undefined };
  },
  changeToEdit: function() {
    this.setState({ current: "edit" });
  },
  validateName: function() {
    var self = this;
    var name = self.name.value;
    if (name != "" && name.indexOf(" ") > -1) {
      self.nameSpace.innerHTML = "Spaces are no allowed";
      self.checkButton.style.display = "none";
    }
  },
  disableSubmit: function() {
    this.submit.style.display = "none";
    this.checkButton.style.display = "inline-flex";
    this.availability.innerHTML = "";
    this.nameSpace.innerHTML = "";
  },
  checkAvailability: function() {
    var self = this;
    var newId = this.name.value.trim().toUpperCase();
    if (self.state.userName && newId == self.state.userName.toUpperCase()) {
      self.availability.innerHTML = "username already taken by you";
      return;
    }
    if (newId != "") {
      //WebUtils.doPost("/generic?operation=checkForExistance",{id:newId},function(res){
      WebUtils.doPost(
        "/generic?operation=getSlugDetails",
        { slug: newId },
        function(res) {
          if (res.error && res.error.indexOf("Slug defintion for") != -1) {
            self.availability.innerHTML = "Available";
            self.submit.style.display = "inline-flex";
            self.checkButton.style.display = "none";
          } else {
            self.availability.innerHTML = "Requested Slug is already taken!";
            self.submit.style.display = "none";
            self.checkButton.style.display = "inline-flex";
          }
          /*if(res.exists && res.exists==true){
					self.availability.innerHTML="Requested Slug is already taken!";
					self.submit.style.display="none";
					self.checkButton.style.display="inline-flex";
				}else{
					self.availability.innerHTML="Available";
					self.submit.style.display="inline-flex";
					self.checkButton.style.display="none";
				}*/
        }
      );
    } else {
      self.availability.innerHTML = "Please choose a name";
    }
  },
  changeName: function() {
    var self = this;
    var newId = this.name.value.trim().toUpperCase();
    if (newId == "") {
      this.availability.innerHTML = "Please choose a name";
    } else {
      if (!this.props.landingPage) {
        WebUtils.doPost(
          "/generic?operation=updateId",
          {
            id: this.props.id,
            newId: newId,
            schema: this.props.schema,
            userId: common.getUserDoc().recordId,
            org: this.props.org
          },
          function(res) {
            if (res.success) {
              //location.hash=linkGenerator.getDetailLink({record:{},org:self.props.org,schema:self.props.schema,recordId:self.props.id});
              browserHistory.push("/" + newId.toLowerCase());
            }
            //self.setState({current:"button"});
          }
        );
      } else {
        self.setState({
          current: "changeButton",
          userName: newId.toLowerCase()
        });
      }
    }
  },
  componentDidMount: function() {
    var self = this;
    if (this.props.landingPage) {
      if (
        this.props.data &&
        this.props.data["@uniqueUserName"] &&
        this.props.data["@uniqueUserName"] != ""
      ) {
        self.setState({
          current: "changeButton",
          userName: this.props.data["@uniqueUserName"]
        });
      } else {
        self.setState({ current: "button" });
      }
    } else {
      WebUtils.doPost(
        "/generic?operation=getSchemaRoleOnOrg",
        {
          schema: this.props.schema,
          userId: common.getUserDoc().recordId,
          org: this.props.org
        },
        function(response) {
          if (
            response &&
            response.methods &&
            (response.methods == "all" ||
              response.methods.indexOf("@uniqueUserName") > -1)
          ) {
            WebUtils.doPost(
              "/user?operation=getUniqueUserName",
              { recordId: self.props.id },
              function(res) {
                if (res.data && res.data != "") {
                  var userName = res.data.toLowerCase();
                  self.setState({
                    current: "changeButton",
                    userName: userName
                  });
                } else {
                  self.setState({ current: "button" });
                }
              }
            );
          }
        }
      );
    }
  },
  componentDidUpdate: function() {
    if (
      this.currentUserName &&
      this.state.userName &&
      !this.props.landingPage
    ) {
      this.currentUserName.innerHTML =
        "<a href='" +
        location.protocol +
        "//" +
        location.host +
        "/" +
        this.state.userName +
        "'>" +
        this.state.userName +
        "</a>";
    }
  },
  cancel: function() {
    var self = this;
    self.setState({ current: "changeButton", userName: self.state.userName });
  },
  render: function() {
    if (this.state.current == "button") {
      return (
        <div
          key={global.guid()}
          title={"Set Slug"}
          className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
        >
          <div className="buttonWidth" onClick={this.changeToEdit}>
            <div className="iconHeight">
              <i className={"icons8-id-card newCustomIcon"} />
            </div>
            <div className="newCustomButton">Set Slug</div>
          </div>
        </div>
      );
      //return <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"><button type="button" className=" action-button" onClick={this.changeToEdit}>Set Slug</button></div>
    } else if (this.state.current == "changeButton") {
      return (
        <div
          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group"
          title={"Edit Slug"}
        >
          <div
            ref={e => {
              this.currentUserName = e;
            }}
            id="uniqueUserName"
            className="form-group"
          >
            {this.state.userName}
          </div>
          <div
            onClick={this.changeToEdit}
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
          >
            <div className="buttonWidth">
              <div className="iconHeight">
                <i className={"icons8-id-card newCustomIcon"} />
              </div>
              <div className="newCustomButton">Edit Slug</div>
            </div>
          </div>
        </div>
      );
      //<button type="button" className=" action-button" style={{"marginTop":"0px"}} onClick={this.changeToEdit}>Edit Slug</button>
    } else if (this.state.current == "edit") {
      /*	return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group inlineEdit">
            			<input ref={(e)=>{this.name=e}} onFocus={this.disableSubmit} onBlur={this.validateName} defaultValue={this.state.userName} type="text" placeholder="Choose a name" className=" form-control remove-padding-left"/>
            			<div ref={(e)=>{this.nameSpace=e}}></div>
            			<br/>
            			<button ref={(e)=>{this.checkButton=e}}  className="action-button" style={{"marginTop":"0px"}} onClick={this.checkAvailability}>Check availability</button>
            			<div ref={(e)=>{this.availability=e}}></div>
            			<br/>
            			<button type="button" ref={(e)=>{this.submit=e}} style={{display:"none"}} className=" action-button" onClick={this.changeName}>Set</button>
            			</div>)*/
      return (
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group inlineEdit">
          <input
            ref={e => {
              this.name = e;
            }}
            id="uniqueUserName"
            onFocus={this.disableSubmit}
            onBlur={this.validateName}
            defaultValue={this.state.userName}
            type="text"
            placeholder="Choose a name"
            className=" form-control remove-padding-left"
          />
          <div
            ref={e => {
              this.nameSpace = e;
            }}
          />
          <br />
          <div
            onClick={this.checkAvailability}
            title={"Check availability"}
            ref={e => {
              this.checkButton = e;
            }}
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
          >
            <div className="buttonWidth">
              <div className="iconHeight">
                <i className={"icons8-rotate newCustomIcon"} />
              </div>
              <div className="newCustomButton">Check availability</div>
            </div>
          </div>
          <div
            ref={e => {
              this.submit = e;
            }}
            title={"Set The Slug"}
            style={{ display: "none" }}
            onClick={this.changeName}
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
          >
            <div className="buttonWidth">
              <div className="iconHeight">
                <i className={"icons8-ok newCustomIcon"} />
              </div>
              <div className="newCustomButton">SET</div>
            </div>
          </div>
          <div
            onClick={this.cancel}
            title={"Cancel"}
            ref={e => {
              this.cancelButton = e;
            }}
            className="display-inline-flex  form-group remove-margin-left remove-margin-right extra-padding-right "
          >
            <div className="buttonWidth">
              <div className="iconHeight">
                <i className={"icons8-cancel newCustomIcon"} />
              </div>
              <div className="newCustomButton">Cancel</div>
            </div>
          </div>
          <div
            ref={e => {
              this.availability = e;
            }}
          />
        </div>
      );
    } else {
      return <div className="hidden" />;
    }
  }
});

exports.ChangeId = ChangeId;
