/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
var common = require("../../common.jsx");
//var getContent=require('./getContent.jsx');
var global = require("../../../utils/global.js");
var WebUtils = require("../../../utils/WebAPIUtils.js");
//var linkGenerator=require('../../nav/linkGenerator.jsx');
//var Link=require('react-router').Link;
var baseURL;

var endPoints=require('../../../endPoints.js');
var baseURL=endPoints.boxAPIAddress || "https://localhost:8081";
//2017-11-29T00:33:29-08:00
/*function getDateString(date){
	//'28/08/2017 16:36:29 IST'
	var dateString="";
	return global.getLocaleDateString(dateString);
}*/
function updateErrorImage(event) {
  event.target.onerror = null;
  event.target.src = "/branding/loggedIn.png";
}
function doGet(postUrl, args, callback) {
  try {
    //baseURL = common.getConfigDetails().box_api.client_domain;
  } catch (err) {}

  common.startLoader();
  var args = args ? args : {};
  $.ajax({
    type: "get",
    url: baseURL + postUrl, //+"?isSandbox=true",
    headers: args.headers,
    success: function(res) {
      common.stopLoader();
      callback(res);
    },
    error: function(xhr, ajaxOptions, thrownError) {
      common.stopLoader();
      if (ajaxOptions == "timeout") {
        callback({ error: "Request Timed out !" });
      } else {
        callback({ error: "Request Response error !" });
      }
    }
  });
}
function doPost(postUrl, args, callback) {
  try {
    baseURL = common.getConfigDetails().box_api.client_domain;
  } catch (err) {}

  var multipartData = false;
  args = args ? args : { data: {} };
  //typeof args!="undefined" &&
  if (typeof args.data != "undefined" && args.data.constructor == FormData) {
    multipartData = true;
  }
  common.startLoader();
  $.ajax({
    type: "post",
    url: baseURL + postUrl, //+"?isSandbox=true",
    headers: args.headers,
    data: multipartData ? args.data : JSON.stringify(args.data),
    contentType: multipartData ? false : "application/json; charset=utf-8",
    enctype: multipartData ? "multipart/form-data" : undefined,
    processData: multipartData ? false : undefined,
    success: function(res) {
      common.stopLoader();
      callback(res);
    },
    error: function(xhr, ajaxOptions, thrownError) {
      common.stopLoader();
      if (ajaxOptions == "timeout") {
        callback({ error: "Request Timed out !" });
      } else {
        callback({ error: "Request Response error !" });
      }
    }
  });
}
//	//userId:"2814013628"/userId:(window && window.boxUserId)?window.boxUserId:"2808197967",
var BoxView = React.createClass({
  getInitialState: function() {
    return {
      current: "files",
      token: undefined,
      userId: undefined,
      enterpriseId: undefined,
      user: {},
      error: undefined
    };
  },
  componentDidMount: function() {
    var self = this;
    common.startLoader();
    var data = {};
    if (this.props.orgType == "Project") {
      data.project = this.props.org;
    } else {
      data.org = this.props.org;
    }
    WebUtils.getBoxCredentials(data, function(boxCreds) {
      common.stopLoader();
      if (!boxCreds.error) {
        var userId = boxCreds.userData.userId;
        var email = boxCreds.userData.email;
        var enterpriseId = boxCreds.orgData.enterpriseId;
        var args = {
          headers: {
            "x-business-id": enterpriseId,
            "x-access-token": undefined
          }
        };
        doGet("/login/" + email, args, function(loginTokenRes) {
          var token;
          if (typeof loginTokenRes == "string") {
            temp = JSON.parse(loginTokenRes);
            token = temp.token;
            userId = temp.id;
          } else {
            token = loginTokenRes.token;
            userId = loginTokenRes.id;
          }
          if (!token) {
            self.setState({ error: "Login failed, Please try again." });
            return;
          }
          args.headers["x-access-token"] = token;
          doGet("/user/get/" + userId + "/null", args, function(userInfoRes) {
            var userInfo = JSON.parse(userInfoRes);
            if (
              userInfo.response &&
              userInfo.response.body &&
              userInfo.response.body.type == "error"
            ) {
              self.setState({ error: userInfo.response.body.message });
              return;
            }
            doGet("/user/get/" + userId + "/role", args, function(roleRes) {
              self.setState({
                userId: userId,
                enterpriseId: enterpriseId,
                token: token,
                currentUserInfo: userInfo,
                user: JSON.parse(roleRes)
              });
            });
          });
        });
      } else {
        //Either you don't have a box acount or You are not associated with the current organization's enterprise account
        self.setState({
          error: "Contact project admin to setup document collboration space."
        });
      }
    });
  },
  setCurrent: function(curr) {
    if (this.state.current != curr) {
      this.setState({ current: curr });
    }
  },
  render: function() {
    if (this.state.error) {
      return (
        <div className="form-group">
          <div>{this.state.error}</div>
          <div />
        </div>
      );
    } else if (this.state.token) {
      return (
        <div>
          <UserIcon
            currentUserInfo={this.state.currentUserInfo}
            enterpriseId={this.state.enterpriseId}
            token={this.state.token}
            userId={this.state.userId}
            role={this.state.role}
          />
          <div className="add-border-bottom-white-screen">
            <div
              onClick={this.setCurrent.bind(null, "files")}
              className="unequalDivs extra-padding-right-lg pointer no-margin extra-padding-bottom-pin tabsHeading"
            >
              <span className={this.state.current == "files" ? "tab-view" : ""}>
                ALL FILES
              </span>
            </div>
            {(this.state.user && this.state.user.role == "admin") ||
            this.state.user.role == "coadmin" ? (
              <div
                onClick={this.setCurrent.bind(null, "groups")}
                className="unequalDivs extra-padding-right-lg pointer no-margin extra-padding-bottom-pin tabsHeading"
              >
                <span
                  className={this.state.current == "groups" ? "tab-view" : ""}
                >
                  GROUPS
                </span>
              </div>
            ) : (
              ""
            )}
            {(this.state.user && this.state.user.role == "admin") ||
            this.state.user.role == "coadmin" ? (
              <div
                onClick={this.setCurrent.bind(null, "users")}
                className="unequalDivs extra-padding-right-lg pointer no-margin extra-padding-bottom-pin tabsHeading"
              >
                <span
                  className={this.state.current == "users" ? "tab-view" : ""}
                >
                  USERS
                </span>
              </div>
            ) : (
              ""
            )}
          </div>
          {this.state.current == "files" ? (
            <FolderOrFileView
              enterpriseId={this.state.enterpriseId}
              token={this.state.token}
              userId={this.state.userId}
              role={this.state.user.role}
              id={0}
              type={"folder"}
            />
          ) : this.state.current == "groups" ? (
            <GroupsManager
              enterpriseId={this.state.enterpriseId}
              token={this.state.token}
              role={this.state.user.role}
              userId={this.state.userId}
            />
          ) : this.state.current == "users" ? (
            <UsersManager
              enterpriseId={this.state.enterpriseId}
              token={this.state.token}
              role={this.state.user.role}
              userId={this.state.userId}
            />
          ) : (
            ""
          )}
        </div>
      );
    } else {
      return <div />;
    }
  }
});
exports.BoxView = BoxView;

var FolderOrFileView = React.createClass({
  getInitialState: function() {
    return {
      info: undefined,
      contents: undefined,
      id: this.props.id,
      type: this.props.type ? this.props.type : "folder",
      showNewFolderOptions: false,
      showLockOptions: false,
      role: undefined
    };
  },
  componentDidUpdate: function() {
    if (this.lockTime)
      $(this.lockTime).datetimepicker({
        format: "YYYY-MM-DDTHH:mm:ssZ",
        sideBySide: true,
        minDate: new Date(),
        keepOpen: true
      });
  },
  componentDidMount: function() {
    this.getFolderOrFileInfo();
  },
  getFolderOrFileInfo: function(callback) {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet(
      "/" + this.state.type + "/get/" + this.state.id + "/null",
      args,
      function(data) {
        var info = JSON.parse(data);
        var role = undefined;
        if (info.owned_by && info.owned_by.id == self.props.userId) {
          role = "owner";
        }
        self.setState({ info: info, role: role }, self.getFolderContent);
      }
    );
  },
  getFolderContent: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    if (this.state.type == "folder") {
      doPost("/folder/items/" + this.state.id, args, function(data) {
        self.setState({ contents: JSON.parse(data) });
      });
    } else {
      doGet("/file/downloadUrl/" + this.state.id, args, function(data) {
        doGet(
          "/" + self.state.type + "/get/" + self.state.id + "/lock",
          args,
          function(lockInfo) {
            doGet(
              "/" + self.state.type + "/versions/" + self.state.id + "/null",
              args,
              function(versionInfo) {
                var download_url = JSON.parse(data);
                if (
                  download_url.response &&
                  download_url.response.body &&
                  download_url.response.body.type == "error"
                ) {
                  download_url = undefined;
                }
                self.setState({
                  contents: {
                    downloadUrl: download_url,
                    lockInfo: JSON.parse(lockInfo),
                    versions: JSON.parse(versionInfo)
                  }
                });
              }
            );
          }
        );
      });
    }
  },
  downloadFileVersion: function(version_id) {
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/file/downloadUrl/" + version_id, args, function(data) {
      window.open(data);
    });
  },
  setCurrent: function(id, type) {
    this.setState(
      {
        id: id,
        type: type,
        contents: undefined,
        info: undefined,
        showNewFolderOptions: false,
        showLockOptions: false,
        role: undefined
      },
      this.getFolderOrFileInfo
    );
  },
  createNewFolder: function() {
    var folderName = this.newFolderName.value.trim();
    if (!folderName) {
      common.createAlert("Error", "Please enter folder name");
      return;
    }
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/folder/create/" + this.state.id + "/" + folderName, args, function(
      response
    ) {
      try {
        var response = JSON.parse(response);
        if (
          typeof response == "object" &&
          response.response &&
          response.response.body &&
          response.response.body.type == "error"
        ) {
          common.createAlert("Error", response.response.body.message);
        }
      } catch (err) {}
      //self.setCurrent(JSON.parse(data).id,"folder");
      self.setCurrent(self.state.id, "folder");
    });
  },
  deleteFileOrFolder: function() {
    var self = this;
    common.createConfirm(
      "Confirm",
      "Are you sure you want to delete this " + this.state.type + "?",
      function(confirm) {
        if (confirm) {
          var args = {
            headers: {
              "x-business-id": self.props.enterpriseId,
              "x-access-token": self.props.token
            },
            data: { recursive: true, isPermanent: true }
          };
          doPost(
            "/" + self.state.type + "/delete/" + self.state.id,
            args,
            function(response) {
              try {
                var response = JSON.parse(response);
                if (
                  typeof response == "object" &&
                  response.response &&
                  response.response.body &&
                  response.response.body.type == "error"
                ) {
                  common.createAlert("Error", response.response.body.message);
                }
              } catch (err) {}
              self.setCurrent(self.state.info.parent.id, "folder");
            }
          );
        }
      }
    );
  },
  createNewFile: function() {
    if (
      this.newFile.files &&
      this.newFile.files.constructor == FileList &&
      this.newFile.files.length > 0
    ) {
      var self = this;
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: new FormData(this.newFileForm)
      };
      doPost("/file/upload/" + this.state.id, args, function(response) {
        try {
          var response = JSON.parse(response);
          if (
            typeof response == "object" &&
            response.response &&
            response.response.body &&
            response.response.body.type == "error"
          ) {
            common.createAlert("Error", response.response.body.message);
          }
        } catch (err) {}
        self.setCurrent(self.state.id, "folder");
      });
    }
  },
  updateExistingFile: function() {
    if (
      this.updateFile.files &&
      this.updateFile.files.constructor == FileList &&
      this.updateFile.files.length > 0
    ) {
      var self = this;
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: new FormData(this.updateFileForm)
      };
      doPost("/file/upload/" + this.state.id, args, function(data) {
        self.setCurrent(self.state.id, "file");
      });
    }
  },
  copyFile: function(newFolderId) {
    var self = this;
    $(this.folderSelectorButtonForCopy).removeClass("hidden");
    ReactDOM.unmountComponentAtNode(this.folderSelectorDiv);
    $(this.folderSelectorDiv).addClass("hidden");
    if (newFolderId) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        }
      };
      doPost(
        "/" + this.state.type + "/copy/" + this.state.id + "/" + newFolderId,
        args,
        function(data) {
          //self.setCurrent(self.state.id,"file");
          self.setCurrent(newFolderId, "folder");
        }
      );
    }
  },
  moveFile: function(newFolderId) {
    var self = this;
    $(this.folderSelectorButtonForMove).removeClass("hidden");
    ReactDOM.unmountComponentAtNode(this.folderSelectorDiv);
    $(this.folderSelectorDiv).addClass("hidden");
    if (newFolderId) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: { parent: { id: newFolderId } }
      };
      doPost("/" + this.state.type + "/update/" + this.state.id, args, function(
        data
      ) {
        //self.setCurrent(self.state.id,"file");
        self.setCurrent(newFolderId, "folder");
      });
    }
  },
  showFolderSelector: function(type) {
    $(this.folderSelectorDiv).removeClass("hidden");
    if (type == "copy") {
      $(this.folderSelectorButtonForCopy).addClass("hidden");
    } else {
      $(this.folderSelectorButtonForMove).addClass("hidden");
    }

    ReactDOM.render(
      <FolderSelector
        enterpriseId={this.props.enterpriseId}
        id={
          this.state.type == "file" ? this.state.info.parent.id : this.state.id
        }
        userId={this.props.userId}
        role={this.props.role}
        token={this.props.token}
        callback={type == "copy" ? this.copyFile : this.moveFile}
      />,
      this.folderSelectorDiv
    );
  },
  lockFile: function() {
    var self = this;
    var expires_at = this.lockTime.value; //'2018-12-12T10:55:30-08:00';
    if (!expires_at) {
      this.lockTime.focus();
      return;
    }
    var is_download_prevented = this.downloadPrevent.checked;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: {
        expires_at: expires_at,
        is_download_prevented: is_download_prevented
      }
    };
    doPost("/file/lock/" + this.state.id, args, function(data) {
      self.setCurrent(self.state.id, "file");
    });
  },
  unLockFile: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/file/unLock/" + this.state.id, args, function(data) {
      self.setCurrent(self.state.id, "file");
    });
  },
  openOrCloseInfo: function() {
    if ($(this.infoDiv).hasClass("hidden")) {
      $(this.infoDiv).removeClass("hidden");
    } else {
      $(this.infoDiv).addClass("hidden");
    }
  },
  changeName: function() {
    var self = this;
    var name = this.name.value.trim();
    if (name && this.state.info.name != name) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: { name: name }
      };
      doPost("/" + this.state.type + "/update/" + this.state.id, args, function(
        data
      ) {
        var currentInfo = self.state.info;
        currentInfo.name = name;
        self.setState({ info: currentInfo });
      });
    }
  },
  changeDescription: function() {
    var self = this;
    var description = this.description.value.trim();
    if (description && this.state.info.description != description) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: { description: description }
      };
      doPost("/" + this.state.type + "/update/" + this.state.id, args, function(
        data
      ) {
        var currentInfo = self.state.info;
        currentInfo.description = description;
        self.setState({ info: currentInfo });
      });
    }
  },
  render: function() {
    var self = this;
    return (
      <div className="form-group">
        {this.state.info &&
        this.state.info.path_collection &&
        Array.isArray(this.state.info.path_collection.entries) ? (
          <div className="form-group">
            {this.state.info.path_collection.entries.map(function(entry) {
              return (
                <div
                  key={global.guid()}
                  onClick={self.setCurrent.bind(null, entry.id, entry.type)}
                  className="link blueLink display-inline-block"
                >
                  {entry.name + "  /"}&nbsp;&nbsp;
                </div>
              );
            })}
            <div className="link display-inline-block extra-padding-right">
              {this.state.info.name}
            </div>
            {this.state.id.toString() != "0" ? (
              <i
                className="icons8-info pointer"
                onClick={this.openOrCloseInfo}
              />
            ) : (
              ""
            )}
          </div>
        ) : (
          ""
        )}
        {this.state.id.toString() != "0" && this.state.info ? (
          <div
            className="form-group hidden"
            ref={e => {
              this.infoDiv = e;
            }}
          >
            <div className=" form-group">
              <input
                type="text"
                style={{ border: "none" }}
                onBlur={this.changeName}
                ref={e => {
                  this.name = e;
                }}
                defaultValue={this.state.info.name}
              />
            </div>
            <div className="form-group">
              <textarea
                onBlur={this.changeDescription}
                style={{ border: "none" }}
                ref={e => {
                  this.description = e;
                }}
                defaultValue={this.state.info.description}
              />
            </div>
          </div>
        ) : (
          ""
        )}
        {this.state.type == "folder" ? (
          <div>
            {this.state.contents ? (
              <div>
                {/*<div>Total: {this.state.contents.total_count}</div>*/}
                {this.state.contents.entries.map(function(entry) {
                  return (
                    <div
                      key={global.guid()}
                      onClick={self.setCurrent.bind(null, entry.id, entry.type)}
                      className="link"
                    >
                      {entry.type == "folder" ? (
                        <i className="icons8-folder-invoices">&nbsp;&nbsp;</i>
                      ) : (
                        <i className="icons8-file">&nbsp;&nbsp;</i>
                      )}
                      <span>{entry.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div />
            )}
            <br />
            {!this.state.showNewFolderOptions ? (
              <i
                onClick={() => {
                  this.setState({ showNewFolderOptions: true });
                }}
                className="icons8-add-folder newCustomIcon extra-padding-right"
                title="New Folder"
              />
            ) : (
              ""
            )}
            <form
              ref={e => {
                this.newFileForm = e;
              }}
              encType="multipart/form-data"
              className="display-inline-block form-group extra-padding-right"
            >
              <i
                onClick={event => {
                  event.preventDefault();
                  this.newFile.click();
                }}
                title="New File"
                className="icons8-add-list newCustomIcon"
              />
              <input
                key={global.guid()}
                type="file"
                name="file"
                className="hidden"
                ref={e => {
                  this.newFile = e;
                }}
                onChange={this.createNewFile}
              />
            </form>
            {this.state.info &&
            typeof this.state.info.parent != "undefined" &&
            this.state.info.parent != null ? (
              <span
                ref={e => {
                  this.folderSelectorButtonForCopy = e;
                }}
                className="icons8-copy-file-2 fa-2x pointer display-inline-block extra-padding-right"
                title="Copy Folder"
                onClick={this.showFolderSelector.bind(null, "copy")}
              />
            ) : (
              ""
            )}
            {this.state.info &&
            typeof this.state.info.parent != "undefined" &&
            this.state.info.parent != null ? (
              <span
                ref={e => {
                  this.folderSelectorButtonForMove = e;
                }}
                className="icons8-paper-with-arrow-right-2 fa-2x pointer display-inline-block extra-padding-right"
                title="Move Folder"
                onClick={this.showFolderSelector.bind(null, "move")}
              />
            ) : (
              ""
            )}
            {this.state.info &&
            typeof this.state.info.parent != "undefined" &&
            this.state.info.parent != null ? (
              <i
                className="icons8-trash-can fa-2x pointer display-inline-block extra-padding-right"
                title="Delete Folder"
                onClick={self.deleteFileOrFolder}
                aria-hidden="true"
              />
            ) : (
              ""
            )}
          </div>
        ) : (
          <span>
            {this.state.contents && this.state.contents.downloadUrl ? (
              <a
                className="display-inline-block extra-padding-right"
                title="Download"
                href={this.state.contents.downloadUrl}
                target="_blank"
              >
                <i className="icons8-download-2 fa-2x" />
              </a>
            ) : (
              ""
            )}

            <form
              ref={e => {
                this.updateFileForm = e;
              }}
              encType="multipart/form-data"
              className="display-inline-block form-group extra-padding-right"
            >
              <i
                onClick={event => {
                  event.preventDefault();
                  this.updateFile.click();
                }}
                title="Update File"
                className="icons8-add-list newCustomIcon"
              />
              <input
                key={global.guid()}
                type="file"
                name="file"
                className="hidden"
                ref={e => {
                  this.updateFile = e;
                }}
                onChange={this.updateExistingFile}
              />
              <input
                type="text"
                className="hidden"
                name="asVersion"
                value="true"
              />
            </form>

            <span
              ref={e => {
                this.folderSelectorButtonForCopy = e;
              }}
              className="icons8-copy-file-2 fa-2x pointer display-inline-block extra-padding-right"
              title="Copy File"
              onClick={this.showFolderSelector.bind(null, "copy")}
            />
            <span
              ref={e => {
                this.folderSelectorButtonForMove = e;
              }}
              className="icons8-paper-with-arrow-right-2 fa-2x pointer display-inline-block extra-padding-right"
              title="Move File"
              onClick={this.showFolderSelector.bind(null, "move")}
            />
            {!this.state.showLockOptions &&
            (this.state.contents &&
              this.state.contents.lockInfo &&
              (!this.state.contents.lockInfo.lock ||
                (this.state.contents.lockInfo.lock &&
                  !this.state.contents.lockInfo.lock.expires_at))) ? (
              <span
                className="icons8-add-key fa-2x pointer display-inline-block extra-padding-right"
                title="Lock File"
                onClick={() => {
                  this.setState({ showLockOptions: true });
                }}
              />
            ) : (
              ""
            )}

            {this.state.contents &&
            this.state.contents.lockInfo &&
            this.state.contents.lockInfo.lock &&
            this.state.contents.lockInfo.lock.expires_at != null ? (
              <span
                className="icons8-remove-key fa-2x pointer display-inline-block extra-padding-right"
                title="Unlock File"
                onClick={this.unLockFile}
              />
            ) : (
              ""
            )}

            {this.state.info && typeof this.state.info.parent != "undefined" ? (
              <i
                className="icons8-trash-can fa-2x pointer display-inline-block extra-padding-right"
                title="Delete File"
                onClick={self.deleteFileOrFolder}
                aria-hidden="true"
              />
            ) : (
              ""
            )}
            {this.state.info ? (
              <div>
                <div>
                  Created at {this.state.info.created_at} By{" "}
                  {this.state.info.created_by.name}
                </div>
                <div>
                  Last modified by {this.state.info.modified_at} By{" "}
                  {this.state.info.modified_by.name}
                </div>
              </div>
            ) : (
              ""
            )}
            {this.state.contents && this.state.contents.versions ? (
              <div className="form-group">
                {this.state.contents.versions.entries.map(function(entry) {
                  return (
                    <div
                      key={global.guid()}
                      onClick={self.downloadFileVersion.bind(null, entry.id)}
                      className="link"
                    >
                      <div>
                        <i className="icons8-file">&nbsp;&nbsp;</i> {entry.name}
                      </div>
                      <div>
                        Modified At {entry.modified_at} By{" "}
                        {entry.modified_by.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              ""
            )}
            <Comments
              enterpriseId={this.props.enterpriseId}
              id={this.state.id}
              token={this.props.token}
              userId={this.props.userId}
              role={this.props.role}
            />
          </span>
        )}
        {!this.state.showNewFolderOptions ? (
          ""
        ) : (
          <div className="form-group">
            <input
              type="text"
              className="form-control form-group"
              ref={e => {
                this.newFolderName = e;
              }}
              placeholder="Enter Folder Name"
              autoFocus={true}
            />
            <input
              className="action-button extra-margin-right"
              onClick={this.createNewFolder}
              title="Create"
              value="Create"
              type="submit"
            />
            <input
              className="action-button extra-margin-right"
              onClick={() => {
                this.setState({ showNewFolderOptions: false });
              }}
              title="Cancel"
              value="Cancel"
              type="submit"
            />
          </div>
        )}
        {!this.state.showLockOptions ? (
          ""
        ) : (
          <div className="form-group">
            <input
              className="form-control form-group"
              ref={e => {
                this.lockTime = e;
              }}
              type="text"
              placeholder={"Select lock period from now"}
            />
            <div className="form-group">
              <input
                type="checkbox"
                onChange={this.valueChanged}
                ref={e => {
                  this.downloadPrevent = e;
                }}
                id={"mpl" + this.state.id}
              />
              <label
                htmlFor={"mpl" + this.state.id}
                className="vertical-align-middle no-margin"
                style={{ fontWeight: "normal", fontSize: "16px" }}
              >
                <div
                  style={{
                    float: "left",
                    fontSize: "14px",
                    paddingRight: "5px"
                  }}
                >
                  Prevent downloading
                </div>
              </label>
            </div>
            <input
              className="action-button extra-margin-right"
              onClick={this.lockFile}
              title="Create"
              value="Create"
              type="submit"
            />
            <input
              className="action-button extra-margin-right"
              onClick={() => {
                this.setState({ showLockOptions: false });
              }}
              title="Cancel"
              value="Cancel"
              type="submit"
            />
          </div>
        )}
        {this.state.id.toString() != "0" && this.state.info ? (
          <Collaborations
            key={global.guid()}
            enterpriseId={this.props.enterpriseId}
            id={this.state.id}
            type={this.state.type}
            token={this.props.token}
            userId={this.props.userId}
            role={this.props.role}
          />
        ) : (
          ""
        )}
        <div
          className="hidden"
          ref={e => {
            this.folderSelectorDiv = e;
          }}
        />
      </div>
    );
  }
});

var Comments = React.createClass({
  getInitialState: function() {
    return {
      comments: undefined,
      showNewCommentOption: false
    };
  },
  componentDidMount: function() {
    this.getComments();
  },
  getComments: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/comments/get/" + this.props.id, args, function(data) {
      var response = JSON.parse(data);
      if (
        response.response &&
        response.response.body &&
        response.response.body.type == "error"
      ) {
        self.setState({ comments: undefined, showNewCommentOption: false });
      } else {
        self.setState({
          comments: response.body.entries,
          showNewCommentOption: false
        });
      }
    });
  },
  addComment: function() {
    var comment = this.comment.value.trim();
    if (!comment) {
      common.createAlert("No value!", "Please enter text to save");
      return;
    }
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: {
        message: comment
      }
    };
    var self = this;
    doPost("/comment/create/" + this.props.id, args, function(data) {
      self.getComments();
    });
  },
  render: function() {
    var self = this;
    return (
      <div className="form-group">
        {Array.isArray(this.state.comments) ? (
          <div className="form-group">
            {this.state.comments.map(function(comment) {
              return (
                <ViewOrUpdateComment
                  key={comment.id}
                  comment={comment}
                  enterpriseId={self.props.enterpriseId}
                  token={self.props.token}
                  userId={self.props.userId}
                  role={self.props.role}
                />
              );
            })}
          </div>
        ) : (
          ""
        )}
        {this.state.showNewCommentOption ? (
          <div className="form-group">
            <div className="form-group">
              <textarea
                ref={e => {
                  this.comment = e;
                }}
                className="fa-x"
              />
            </div>
            <div className="form-group">
              <input
                className="action-button extra-margin-right"
                onClick={this.addComment}
                title="Add"
                value="Add"
                type="submit"
              />
            </div>
          </div>
        ) : (
          <input
            className="action-button extra-margin-right"
            onClick={() => {
              this.setState({ showNewCommentOption: true });
            }}
            title="Add Comment"
            value="Add Comment"
            type="submit"
          />
        )}
      </div>
    );
  }
});
var ViewOrUpdateComment = React.createClass({
  getInitialState: function() {
    return { comment: this.props.comment, edit: false };
  },
  updateComment: function() {
    var text = this.comment.value.trim();
    if (!text) {
      common.createAlert("No value!", "Please enter text to save");
      return;
    }
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: {
        message: text
      }
    };
    var self = this;
    doPost("/comment/update/" + this.state.comment.id, args, function(data) {
      self.setState({ comment: JSON.parse(data), edit: false });
    });
  },
  deleteComment: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doPost("/comment/delete/" + this.state.comment.id, args, function(data) {
      self.setState({ comment: undefined });
      console.log(data);
    });
  },
  render: function() {
    if (this.state.comment == undefined) {
      return <div />;
    }
    return (
      <div className="form-group">
        {this.state.edit ? (
          <div className="form-group">
            <div className="form-group">
              <textarea
                ref={e => {
                  this.comment = e;
                }}
                defaultValue={this.state.comment.message}
                className="fa-x"
              />
            </div>
            <div className="form-group">
              <input
                className="action-button extra-margin-right"
                onClick={this.updateComment}
                title="Update"
                value="Update"
                type="submit"
              />
              <input
                className="action-button extra-margin-right"
                onClick={() => {
                  this.setState({ edit: false });
                }}
                title="Cancel"
                value="Cancel"
                type="submit"
              />
            </div>
          </div>
        ) : (
          <div
            className="h3 pencil"
            onClick={() => {
              this.setState({ edit: true });
            }}
          >
            {this.state.comment.message}
          </div>
        )}
        <div>
          <span>
            on {this.state.comment.created_at} By{" "}
            {this.state.comment.created_by.name}
          </span>
          <i
            className="icons8-trash-can fa-2x pointer display-inline-block extra-padding-right extra-padding-left"
            title="Delete User"
            onClick={this.deleteComment}
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
});
var Collaborations = React.createClass({
  getInitialState: function() {
    return {
      collaborations: undefined,
      showCreateCollaboration: false
    };
  },
  componentDidMount: function() {
    this.getCollaborations();
  },
  getCollaborations: function() {
    var self = this;
    if (this.props.id != "0") {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        }
      };
      doGet(
        "/collaborations/get/" + this.props.id + "/" + this.props.type,
        args,
        function(data) {
          var response = JSON.parse(data);
          if (
            response.response &&
            response.response.body &&
            response.response.body.type == "error"
          ) {
            self.setState({ collaborations: undefined });
          } else {
            self.setState({ collaborations: response });
          }
        }
      );
    }
  },
  close: function(update) {
    this.setState({ showCreateCollaboration: false });
    if (update) {
      this.getCollaborations();
    }
  },
  render: function() {
    var self = this;
    return (
      <div className="form-group">
        <h4>Collaborations</h4>
        {this.state.collaborations ? (
          <div className="form-group">
            {this.state.collaborations.entries.map(function(entry) {
              return (
                <ViewOrUpdateCollaboration
                  enterpriseId={self.props.enterpriseId}
                  key={global.guid()}
                  collaboration={entry}
                  token={self.props.token}
                  userId={self.props.userId}
                  role={self.props.role}
                  id={self.props.id}
                />
              );
            })}
          </div>
        ) : (
          ""
        )}
        {this.state.showCreateCollaboration ? (
          <CreateCollaboration
            enterpriseId={this.props.enterpriseId}
            token={this.props.token}
            userId={this.props.userId}
            role={this.props.role}
            id={this.props.id}
            cancelCallback={this.close}
            type={this.props.type}
          />
        ) : (
          <i
            className="icons8-add-user-male fa-2x pointer display-inline-block extra-padding-right"
            title="Add Collaborator"
            onClick={() => {
              this.setState({ showCreateCollaboration: true });
            }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
});

var ViewOrUpdateCollaboration = React.createClass({
  getInitialState: function() {
    return this.props.collaboration;
  },
  changeToRoleEdit: function() {
    $(this.roleDisplay).addClass("hidden");
    $(this.roleSelectionDiv).removeClass("hidden");
  },
  setRole: function() {
    $(this.roleDisplay).removeClass("hidden");
    $(this.roleSelectionDiv).addClass("hidden");
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: { role: this.role.value }
    };
    doPost("/collaboration/update/" + this.state.id, args, function(response) {
      var response;
      try {
        response = JSON.parse(response);
      } catch (err) {}
      if (
        response &&
        response.response &&
        response.response.body &&
        response.response.body.type == "error"
      ) {
        common.createAlert("Error", response.response.body.message);
        self.setState({ id: undefined });
      } else {
        self.setState({ role: self.role.value });
      }
    });
  },
  removeMember: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doPost("/collaboration/delete/" + this.state.id, args, function() {
      self.setState({ id: undefined });
    });
  },
  render: function() {
    var self = this;
    if (!this.state.id) {
      return null;
    }
    return (
      <div>
        {this.state.accessible_by ? (
          <div className="display-inline-block extra-padding-right-sm">
            {/*<UserIcon token={self.props.token} id={self.state.accessible_by.id}/>*/}
            {this.state.accessible_by.type == "user" ? (
              <i
                className="icons8-user extra-padding-right"
                aria-hidden="true"
              />
            ) : (
              <i
                className="icons8-group extra-padding-right"
                aria-hidden="true"
              />
            )}
            {this.state.accessible_by.name}
          </div>
        ) : (
          <div className="display-inline-block extra-padding-right-sm">
            pending
          </div>
        )}
        <div
          className="extra-padding-right pointer display-inline-block"
          ref={e => {
            this.roleDisplay = e;
          }}
          onClick={this.changeToRoleEdit}
        >
          <b>{this.state.role}</b>
        </div>
        <div
          className="display-inline-block extra-padding-right hidden"
          ref={e => {
            this.roleSelectionDiv = e;
          }}
        >
          <select
            className="form-control form-group"
            ref={e => {
              this.role = e;
            }}
            onChange={this.setRole}
          >
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
            <option value="previewer">previewer</option>
            <option value="uploader">uploader</option>
            <option value="previewer uploader">previewer uploader</option>
            <option value="viewer uploader">viewer uploader</option>
            <option value="co-owner">co-owner</option>
          </select>
        </div>
        <div className="display-inline-block extra-padding-right-sm">
          <i
            className="icons8-trash-can fa-x pointer display-inline-block extra-padding-right"
            title="Remove member from this group."
            onClick={self.removeMember}
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
});

var CreateCollaboration = React.createClass({
  getInitialState: function() {
    return {
      collaborationType: undefined,
      selectedUser: undefined,
      selectedGroup: undefined,
      role: undefined,
      email: undefined
    };
  },
  setCollaborationType: function() {
    if (this.state.collaborationType != this.collaborationType.value) {
      this.setState({
        collaborationType: this.collaborationType.value,
        selectedUser: undefined,
        selectedGroup: undefined
      });
    }
  },
  selectedUser: function(doc) {
    this.setState({ selectedUser: doc });
  },
  selectedGroup: function(doc) {
    this.setState({ selectedGroup: doc });
  },
  createCollaboration: function() {
    if (!this.state.collaborationType) {
      common.createAlert("Error", "Please select Collaboratin type");
      return;
    }
    if (this.state.collaborationType == "user") {
      if (!this.state.selectedUser) {
        common.createAlert("Error", "Please select user");
        return;
      }
    }

    if (this.state.collaborationType == "group") {
      if (!this.state.selectedGroup) {
        common.createAlert("Error", "Please select group");
        return;
      }
    }
    if (this.state.collaborationType == "email") {
      if (!this.state.email.match(global.emailFormate)) {
        common.createAlert("Error", "Please enter a valid email address");
        return;
      }
    }
    if (!this.state.role) {
      common.createAlert("Error", "Please select role");
      return;
    }
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: {
        item: {
          type: this.props.type,
          id: this.props.id
        },
        accessible_by: {
          type:
            this.state.collaborationType == "email"
              ? undefined
              : this.state.collaborationType,
          id:
            this.state.collaborationType == "user" ||
            this.state.collaborationType == "group"
              ? this.state.collaborationType == "user"
                ? this.state.selectedUser.id
                : this.state.selectedGroup.id
              : undefined,
          login: this.state.email
        },
        role: this.state.role
      }
    };
    doPost("/collaboration/create", args, function(res) {
      try {
        var res = JSON.parse(res);
        if (res && res.body && res.body.type == "error") {
          common.createAlert("Error", res.body.message);
        }
      } catch (err) {}
      self.props.cancelCallback(true);
    });
  },
  reselectUser: function() {
    this.setState({ selectedUser: undefined });
  },
  reselectGroup: function() {
    this.setState({ selectedGroup: undefined });
  },
  setRole: function() {
    this.setState({ role: this.role.value });
  },
  setEmail: function() {
    this.setState({ email: this.email.value.trim() });
  },
  render: function() {
    return (
      <div className="form-group margin-top-gap">
        <div className="form-group">
          <div className="display-inline-block extra-padding-right-sm">
            <select
              className="form-group"
              defaultValue={this.state.collaborationType}
              ref={e => {
                this.collaborationType = e;
              }}
              onChange={this.setCollaborationType}
            >
              <option value="">Select collaboration type</option>
              <option value="user">user</option>
              <option value="group">group</option>
              <option value="email">email</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          {this.state.collaborationType == "user" ? (
            <div className="display-inline-block extra-padding-right-sm">
              {this.state.selectedUser ? (
                <div>
                  <div className="child-img-component extra-padding-right-sm">
                    <UserIcon
                      currentUserInfo={this.state.selectedUser}
                      enterpriseId={this.props.enterpriseId}
                      token={this.props.token}
                      userId={this.props.userId}
                      role={this.props.role}
                    />
                  </div>
                  <div className="child-img-component no-padding">
                    <div
                      className="icons8-delete link"
                      onClick={this.reselectUser}
                      title="Click to reselect"
                    />
                  </div>
                </div>
              ) : (
                <UsersManager
                  enterpriseId={this.props.enterpriseId}
                  token={this.props.token}
                  userId={this.props.userId}
                  role={this.props.role}
                  callback={this.selectedUser}
                />
              )}
            </div>
          ) : this.state.collaborationType == "group" ? (
            <div className="display-inline-block extra-padding-right-sm">
              {this.state.selectedGroup ? (
                <div>
                  <div className="child-img-component extra-padding-right-sm">
                    {this.state.selectedGroup.name}
                  </div>
                  <div className="child-img-component no-padding">
                    <div
                      className="icons8-delete link"
                      onClick={this.reselectGroup}
                      title="Click to reselect"
                    />
                  </div>
                </div>
              ) : (
                <GroupsManager
                  enterpriseId={this.props.enterpriseId}
                  token={this.props.token}
                  userId={this.props.userId}
                  role={this.props.role}
                  callback={this.selectedGroup}
                />
              )}
            </div>
          ) : this.state.collaborationType == "email" ? (
            <input
              type="text"
              ref={e => {
                this.email = e;
              }}
              placeholder={"Please enter here a valid email address"}
              onBlur={this.setEmail}
              className="form-control"
            />
          ) : (
            ""
          )}
        </div>
        <div className="display-inline-block extra-padding-right-sm">
          <select
            className="form-control form-group"
            ref={e => {
              this.role = e;
            }}
            onChange={this.setRole}
          >
            <option value="">Select Role</option>
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
            <option value="previewer">previewer</option>
            <option value="uploader">uploader</option>
            <option value="previewer uploader">previewer uploader</option>
            <option value="viewer uploader">viewer uploader</option>
            <option value="co-owner">co-owner</option>
          </select>
        </div>
        <div>
          <input
            className="action-button extra-margin-right"
            onClick={this.createCollaboration}
            title="Add"
            value="Add"
            type="submit"
          />
          <input
            className="action-button extra-margin-right"
            onClick={() => {
              this.props.cancelCallback(false);
            }}
            title="Cancel"
            value="Cancel"
            type="submit"
          />
        </div>
      </div>
    );
  }
});

var UserIcon = React.createClass({
  getInitialState: function() {
    return {
      currentUserInfo: this.props.currentUserInfo,
      avatar: undefined
    };
  },
  componentDidMount: function() {
    var self = this;
    if (!this.props.currentUserInfo) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        }
      };
      doGet("/user/get/" + this.props.id + "/null", args, function(
        userInfoRes
      ) {
        self.setState({ currentUserInfo: JSON.parse(userInfoRes) });
      });
    }
  },
  render: function() {
    if (!this.state.currentUserInfo) {
      return <div />;
    } else {
      return (
        <div className="display-inline-block">
          <div className={"parent-img-component userIcon-height"}>
            <div className="child-img-component">
              <img
                ref={e => {
                  this.img = e;
                }}
                src={
                  "/user/avatar/" +
                  this.state.currentUserInfo.id +
                  "?token=" +
                  this.props.token
                }
                onError={updateErrorImage}
                className=" img-circle profilePhoto pull-left img-holder"
                alt={this.state.currentUserInfo.name[0]}
                title={this.state.currentUserInfo.name[0]}
              />
            </div>
            <div className="link child-img-component">
              <span className="userName">
                {this.state.currentUserInfo.name}
              </span>
            </div>
          </div>
        </div>
      );
    }
  }
});
var FolderSelector = React.createClass({
  getInitialState: function() {
    return {
      id: this.props.id ? this.props.id : "0",
      contents: undefined,
      info: undefined,
      showNewFolderOptions: false
    };
  },
  setCurrent: function(id) {
    this.setState(
      {
        id: id,
        contents: undefined,
        info: undefined,
        showNewFolderOptions: false
      },
      this.getFolderOrFileInfo
    );
  },
  getFolderContent: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doPost("/folder/items/" + this.state.id, args, function(data) {
      self.setState({ contents: JSON.parse(data) });
    });
  },
  getFolderOrFileInfo: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/folder/get/" + this.state.id + "/null", args, function(data) {
      self.setState({ info: JSON.parse(data) }, self.getFolderContent);
    });
  },
  componentDidMount: function() {
    this.getFolderOrFileInfo();
  },
  selectThisFolder: function() {
    this.props.callback(this.state.id);
  },
  cancelSelection: function() {
    this.props.callback(undefined);
  },
  createNewFolder: function() {
    var folderName = this.newFolderName.value.trim();
    if (!folderName) {
      common.createAlert("Error", "Please enter folder name");
      return;
    }
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/folder/create/" + this.state.id + "/" + folderName, args, function(
      response
    ) {
      response = JSON.parse(response);
      if (
        response &&
        response.response &&
        response.response.body &&
        response.response.body.type == "error"
      ) {
        common.createAlert("Error", response.response.body.message);
        self.state({ showNewFolderOptions: false });
      } else {
        self.setCurrent(response && response.id ? resposne : undefined);
        //self.setCurrent(self.state.id);
      }
    });
  },
  render: function() {
    var self = this;
    var all_parent_folders = [];
    if (
      this.state.info &&
      this.state.info.path_collection &&
      Array.isArray(this.state.info.path_collection.entries)
    ) {
      this.state.info.path_collection.entries.forEach(function(entry) {
        all_parent_folders.push(entry.id.toString());
      });
    }
    return (
      <div
        key={global.guid()}
        className="margin-top-gap"
        style={{ border: "1px solid gray", width: "30%", padding: "10px" }}
      >
        <span
          className="icons8-multiply  pull-right link"
          onClick={this.cancelSelection}
          aria-hidden="true"
        />
        {this.state.info &&
        this.state.info.path_collection &&
        Array.isArray(this.state.info.path_collection.entries) ? (
          <div>
            {this.state.info.path_collection.entries.map(function(entry) {
              return (
                <div
                  key={global.guid()}
                  onClick={self.setCurrent.bind(null, entry.id, entry.type)}
                  className="link blueLink display-inline-block"
                >
                  {entry.name + "  /"}&nbsp;&nbsp;
                </div>
              );
            })}
            <div className="link display-inline-block">
              {this.state.info.name}
            </div>
          </div>
        ) : (
          <div />
        )}
        <br />

        {this.state.contents ? (
          <div>
            {this.state.contents.entries.map(function(entry) {
              var selectFlag = true;
              if (all_parent_folders.indexOf(self.props.id) > -1) {
                selectFlag = false;
              }
              //this flag useful to check when moving inside of it
              //cyclic moving
              return (
                <div key={global.guid()}>
                  <span
                    className={
                      entry.type == "folder" && selectFlag
                        ? "link blueLink"
                        : ""
                    }
                    onClick={
                      entry.type == "folder" && selectFlag
                        ? self.setCurrent.bind(null, entry.id)
                        : () => {}
                    }
                  >
                    <i
                      className={
                        entry.type == "folder"
                          ? "icons8-folder-invoices"
                          : "icons8-file"
                      }
                    >
                      &nbsp;&nbsp;
                    </i>
                    <span>{entry.name}</span>
                  </span>
                </div>
              );
            })}

            <br />
            {!this.state.showNewFolderOptions ? (
              <i
                onClick={() => {
                  this.setState({ showNewFolderOptions: true });
                }}
                className="icons8-add-folder newCustomIcon"
                title="New Folder"
              />
            ) : (
              ""
            )}
            {typeof this.props.id != "undefined" &&
            this.state.id != this.props.id ? (
              <span
                onClick={this.selectThisFolder}
                title="Select"
                className="icons8-ok fa-2x pointer extra-padding-right"
              />
            ) : (
              ""
            )}
            <br />
            {!this.state.showNewFolderOptions ? (
              ""
            ) : (
              <div className="form-group">
                <input
                  type="text"
                  className="form-control form-group"
                  ref={e => {
                    this.newFolderName = e;
                  }}
                  placeholder="Enter Folder Name"
                  autoFocus={true}
                />
                <input
                  className="action-button extra-margin-right"
                  onClick={this.createNewFolder}
                  title="Create"
                  value="Create"
                  type="submit"
                />
                <input
                  className="action-button extra-margin-right"
                  onClick={() => {
                    this.setState({ showNewFolderOptions: false });
                  }}
                  title="Cancel"
                  value="Cancel"
                  type="submit"
                />
              </div>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
});
var UsersManager = React.createClass({
  getInitialState: function() {
    return {
      showNewUserOption: false,
      users: undefined,
      total_count: undefined,
      searchText: "",
      current: undefined
    };
  },
  componentDidMount: function() {
    this.getAllUsers();
  },
  getAllUsers: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/user/getEnterpriseUsers/all", args, function(data) {
      var users = JSON.parse(data).body;
      self.setState({
        total_count: users.total_count,
        users: users.entries
      });
    });
  },
  selectUser: function(userdoc) {
    if (typeof this.props.callback == "function") {
      this.props.callback(userdoc);
    } else {
      this.setState({ current: userdoc }, this.getUserInfo);
    }
  },
  getUserInfo: function() {
    var self = this;
    if (this.state.current) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        }
      };
      doGet("/user/get/" + this.state.current.id + "/null", args, function(
        userInfoRes
      ) {
        self.setState({ currentUserInfo: JSON.parse(userInfoRes) });
      });
    } else {
      this.getAllUsers();
    }
  },
  setSearchText: function() {
    this.setState({ searchText: this.searchText.value.trim() });
  },
  createNewUser: function() {
    var data = {
      login: this.login.value.trim(),
      name: this.name.value.trim(),
      role: this.role.value.trim(),
      is_sync_enabled: this.is_sync_enabled.checked,
      can_see_managed_users: this.can_see_managed_users.checked,
      space_amount: this.space_amount.value.trim() * 1 * 1024 * 1024,
      is_exempt_from_login_verification: this.is_exempt_from_login_verification
        .checked,
      status: this.status.value.trim()
    };
    var self = this;

    if (!data.login.match(global.emailFormate)) {
      common.createAlert(
        "Error",
        "Please enter a valid email address in login field"
      );
      return;
    }
    if (!data.name) {
      common.createAlert("Error", "Please enter a name");
      return;
    }
    if (!data.role) {
      common.createAlert("Error", "Please select a role");
      return;
    }
    if (!data.space_amount) {
      common.createAlert(
        "Error",
        "Please enter space allocation for the user in mega bytes"
      );
      return;
    }
    if (!data.status) {
      common.createAlert("Error", "Please select a status");
      return;
    }
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: data
    };
    doPost("/user/create", args, function(data) {
      var result = JSON.parse(data).body;
      //on success result.body contains user info
      //on error alos body.type=error
      if (result.type && result.type == "error") {
        common.createAlert(
          "Error",
          result.message + "\n Inviting to the organization"
        );
        if (result.code == "user_login_already_used") {
          args.data = {
            enterprise: {
              id: "32490063"
            },
            actionable_by: {
              login: self.login.value.trim()
            }
          };
          doPost("/user/invite/", args, function(response) {
            //success response
            //{"type":"invite","id":"921894","invited_to":{"type":"enterprise","id":"32490063","name":""},"actionable_by":{"type":"user","id":"2954577281","name":"Madhuri Namala","login":"madhuri.namala@cloudseed.io"},"invited_by":{"type":"user","id":"2808197967","name":"Dev","login":"dev.boxapi@gmail.com"},"status":"pending","created_at":"2017-12-01T01:44:52-08:00","modified_at":"2017-12-01T01:44:52-08:00"}
            var response = JSON.parse(response);
            if (
              response &&
              response.response &&
              response.response.body &&
              response.response.body.type == "error"
            ) {
              common.createAlert("Error", response.response.body.message);
            } else {
              common.createAlert("Error", "invitation sent successfully");
            }
          });
        }
      } else {
        var users = self.state.users;
        users.push(result);
        self.setState({
          total_count: self.state.total_count++,
          current: result,
          users: users,
          showNewUserOption: false
        });
      }
    });
  },
  deleteUser: function() {
    var self = this;
    common.createConfirm(
      "Confirm",
      "Are you sure you want to delete this User?",
      function(confirm) {
        if (confirm) {
          var args = {
            headers: {
              "x-business-id": self.props.enterpriseId,
              "x-access-token": self.props.token
            }
          };
          doPost("/user/delete/" + self.state.current.id, args, function(
            response
          ) {
            var response = JSON.parse(response);
            if (
              response.response &&
              response.response.body &&
              response.response.body.type == "error"
            ) {
              common.createAlert("Error", response.response.body.message);
            } else {
              self.setState({ current: undefined }, self.getUserInfo);
            }
          });
        }
      }
    );
  },
  render: function() {
    var self = this;
    if (this.state.current) {
      return (
        <div className="form-group">
          <span
            className="blueLink pointer form-group margin-bottom-gap"
            onClick={this.selectUser.bind(null, undefined)}
          >
            All Users
          </span>
          <div className="pointer form-group">
            <ViewOrUpdateUser
              enterpriseId={this.props.enterpriseId}
              user={this.state.current}
              token={this.props.token}
              userId={this.props.userId}
              role={this.props.role}
            />
          </div>
          <i
            className="icons8-trash-can fa-2x pointer display-inline-block extra-padding-right"
            title="Delete User"
            onClick={self.deleteUser}
            aria-hidden="true"
          />
        </div>
      );
    } else if (Array.isArray(this.state.users)) {
      return (
        <div className="form-group">
          <input
            type="text"
            className="form-group form-control"
            placeholder="Search users with id | name | email"
            onChange={this.setSearchText}
            ref={e => {
              this.searchText = e;
            }}
          />
          {this.state.users.map(function(user) {
            if (self.state.searchText) {
              if (
                user.name.toLowerCase().indexOf(self.state.searchText) > -1 ||
                user.login.toLowerCase().indexOf(self.state.searchText) > -1 ||
                user.id.toLowerCase().indexOf(self.state.searchText) > -1
              ) {
                return (
                  <div key={user.id} onClick={self.selectUser.bind(null, user)}>
                    <UserIcon
                      currentUserInfo={user}
                      enterpriseId={self.props.enterpriseId}
                      token={self.props.token}
                      userId={self.props.userId}
                      role={self.props.role}
                    />
                  </div>
                );
              } else {
                return null;
              }
            } else {
              return (
                <div key={user.id} onClick={self.selectUser.bind(null, user)}>
                  <UserIcon
                    currentUserInfo={user}
                    enterpriseId={self.props.enterpriseId}
                    token={self.props.token}
                    userId={self.props.userId}
                    role={self.props.role}
                  />
                </div>
              );
            }
          })}
          {this.props.role == "admin" || this.props.role == "coadmin" ? (
            <div className="form-group">
              {!this.state.showNewUserOption ? (
                <div className="form-group">
                  <input
                    className="action-button extra-margin-right"
                    onClick={() => {
                      this.setState({ showNewUserOption: true });
                    }}
                    title="New User"
                    value="New User"
                    type="submit"
                  />
                </div>
              ) : (
                <div className="form-group">
                  login:
                  <input
                    ref={e => {
                      this.login = e;
                    }}
                    type="text"
                    placeholder="The email address the user uses to login"
                    className="form-group form-control"
                  />
                  name :
                  <input
                    ref={e => {
                      this.name = e;
                    }}
                    type="text"
                    placeholder="The name of the user"
                    className="form-group form-control"
                  />
                  role :
                  <select
                    ref={e => {
                      this.role = e;
                    }}
                    title="coadmin | user, the user’s enterprise role"
                    className="form-group form-control"
                  >
                    <option value="">Select role</option>
                    <option value="coadmin">coadmin</option>
                    <option value="user">user</option>
                  </select>
                  <div title="is_sync_enabled" className="form-group">
                    <input
                      type="checkbox"
                      ref={e => {
                        this.is_sync_enabled = e;
                      }}
                      id={"is_sync_enabled"}
                    />
                    <label
                      htmlFor={"is_sync_enabled"}
                      className="vertical-align-middle no-margin"
                      style={{ fontWeight: "normal", fontSize: "16px" }}
                    >
                      <div
                        style={{
                          float: "left",
                          fontSize: "14px",
                          paddingRight: "5px"
                        }}
                      >
                        Whether the user can use Box Sync
                      </div>
                    </label>
                  </div>
                  <div title="can_see_managed_users" className="form-group">
                    <input
                      type="checkbox"
                      ref={e => {
                        this.can_see_managed_users = e;
                      }}
                      id={"can_see_managed_users"}
                    />
                    <label
                      htmlFor={"can_see_managed_users"}
                      className="vertical-align-middle no-margin"
                      style={{ fontWeight: "normal", fontSize: "16px" }}
                    >
                      <div
                        style={{
                          float: "left",
                          fontSize: "14px",
                          paddingRight: "5px"
                        }}
                      >
                        Can see managed users
                      </div>
                    </label>
                  </div>
                  space_amount(mb) :
                  <input
                    ref={e => {
                      this.space_amount = e;
                    }}
                    type="number"
                    placeholder="The user’s total available space amount in mega bytes"
                    className="form-group form-control"
                  />
                  <div
                    title="is_exempt_from_login_verification"
                    className="form-group"
                  >
                    <input
                      type="checkbox"
                      ref={e => {
                        this.is_exempt_from_login_verification = e;
                      }}
                      id={"is_exempt_from_login_verification"}
                    />
                    <label
                      htmlFor={"is_exempt_from_login_verification"}
                      className="vertical-align-middle no-margin"
                      style={{ fontWeight: "normal", fontSize: "16px" }}
                    >
                      <div
                        style={{
                          float: "left",
                          fontSize: "14px",
                          paddingRight: "5px"
                        }}
                      >
                        Whether the user must use two-factor authentication
                      </div>
                    </label>
                  </div>
                  status:<select
                    ref={e => {
                      this.status = e;
                    }}
                    className="form-control form-group"
                  >
                    <option value="">Select status</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="cannot_delete_edit">
                      cannot_delete_edit
                    </option>
                    <option value="cannot_delete_edit_upload">
                      cannot_delete_edit_upload
                    </option>
                  </select>
                  <input
                    className="action-button extra-margin-right"
                    onClick={this.createNewUser}
                    title="Create"
                    value="Create"
                    type="submit"
                  />
                  <input
                    className="action-button extra-margin-right"
                    onClick={() => {
                      this.setState({ showNewUserOption: false });
                    }}
                    title="Cancel"
                    value="Cancel"
                    type="submit"
                  />
                </div>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
      );
    } else {
      return <div />;
    }
  }
});

var ViewOrUpdateUser = React.createClass({
  getInitialState: function() {
    return {
      mode: "view",
      user: this.props.user
    };
  },
  componentDidMount: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet(
      "/user/get/" +
        this.state.user.id +
        "/notify,is_sync_enabled,can_see_managed_users,is_exempt_from_login_verification",
      args,
      function(userInfoRes) {
        var current = self.state.user;
        var res = JSON.parse(userInfoRes);
        current.is_sync_enabled = res.is_sync_enabled;
        current.can_see_managed_users = res.can_see_managed_users;
        current.is_exempt_from_login_verification =
          res.is_exempt_from_login_verification;
        current.notify = res.notify;
        self.setState({ user: current });
      }
    );
  },
  changeMode: function() {
    this.setState({ mode: this.state.mode == "view" ? "edit" : "view" });
  },
  updateUser: function() {
    var data = {
      notify: this.notifySetting.checked,
      name: this.name.value.trim(),
      role: this.role.value.trim(),
      is_sync_enabled: this.is_sync_enabled.checked,
      can_see_managed_users: this.can_see_managed_users.checked,
      space_amount: this.space_amount.value.trim() * 1 * 1024 * 1024,
      is_exempt_from_login_verification: this.is_exempt_from_login_verification
        .checked,
      status: this.status.value.trim()
    };
    var self = this;
    if (!data.name) {
      common.createAlert("Error", "Please enter a name");
      return;
    }
    if (data.role == "user") {
      data.role = undefined;
    }
    if (!data.role) {
      //common.createAlert("Error","Please select a role");
      //return;
    }

    //bytes kb mb gb
    if (!data.space_amount) {
      common.createAlert(
        "Error",
        "Please enter space allocation for the user in mega bytes"
      );
      return;
    }
    if (!data.status) {
      common.createAlert("Error", "Please select a status");
      return;
    }
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: data
    };
    doPost("/user/update/" + this.state.user.id, args, function(res) {
      var current = self.state.user;
      current = Object.assign(current, data);
      self.setState({ user: current, mode: "view" });
    });
  },
  render: function() {
    if (this.state.mode == "view") {
      return (
        <div className="form-group">
          <h2>
            <i className="fa fa-3x extra-padding-right">
              <img
                ref={e => {
                  this.img = e;
                }}
                src={
                  "/user/avatar/" +
                  this.state.user.id +
                  "?token=" +
                  this.props.token
                }
                onError={updateErrorImage}
                alt={this.state.user.name[0]}
                title={this.state.user.name[0]}
              />
            </i>
            {this.state.user.name}
          </h2>
          <div className="form-group">
            Login : <span>{this.state.user.login}</span>
          </div>
          <div className="form-group">
            Created On : <span>{this.state.user.created_at}</span>
          </div>
          <div className="form-group">
            Space Amount :{" "}
            <span>
              {this.state.user.space_amount * 1 == 0
                ? "0"
                : this.state.user.space_amount / 1024 / 1024}
            </span>mb
          </div>
          <div className="form-group">
            Space Used :{" "}
            <span>
              {this.state.user.space_used * 1 == 0
                ? "0"
                : (this.state.user.space_used * 1) / 1024 / 1024}
            </span>mb
          </div>
          <div className="form-group">
            Max Upload Size :{" "}
            <span>{this.state.user.max_upload_size / 1024 / 1024}</span>mb
          </div>
          {this.state.user.notify ? (
            <div className="form-group">Notification enabled</div>
          ) : (
            ""
          )}
          {this.state.user.is_sync_enabled ? (
            <div className="form-group">Sync enabled</div>
          ) : (
            ""
          )}
          {this.state.user.can_see_managed_users ? (
            <div className="form-group">Can see managed users</div>
          ) : (
            ""
          )}
          {this.state.user.is_exempt_from_login_verification ? (
            <div className="form-group">Exempted from login verification</div>
          ) : (
            ""
          )}
          <input
            className="action-button extra-margin-right"
            onClick={this.changeMode}
            title="Edit"
            value="Edit"
            type="submit"
          />
        </div>
      );
    } else {
      return (
        <div>
          <div className="form-group">
            <input
              type="checkbox"
              ref={e => {
                this.notifySetting = e;
              }}
              id={"mpl" + this.state.user.id}
            />
            <label
              htmlFor={"mpl" + this.state.user.id}
              className="vertical-align-middle no-margin"
              style={{ fontWeight: "normal", fontSize: "16px" }}
            >
              <div
                style={{ float: "left", fontSize: "14px", paddingRight: "5px" }}
              >
                Notify the user
              </div>
            </label>
          </div>
          name :
          <input
            ref={e => {
              this.name = e;
            }}
            defaultValue={this.state.user.name}
            type="text"
            placeholder="The name of the user"
            className="form-group form-control"
          />
          role :
          <select
            defaultValue={this.state.user.role}
            ref={e => {
              this.role = e;
            }}
            title="coadmin | user, the user’s enterprise role"
            className="form-group form-control"
          >
            <option value="coadmin">coadmin</option>
            <option value="user">user</option>
          </select>
          <div title="is_sync_enabled" className="form-group">
            <input
              type="checkbox"
              ref={e => {
                this.is_sync_enabled = e;
              }}
              id={"is_sync_enabled"}
              defaultChecked={this.state.user.is_sync_enabled}
            />
            <label
              htmlFor={"is_sync_enabled"}
              className="vertical-align-middle no-margin"
              style={{ fontWeight: "normal", fontSize: "16px" }}
            >
              <div
                style={{ float: "left", fontSize: "14px", paddingRight: "5px" }}
              >
                Whether the user can use Box Sync
              </div>
            </label>
          </div>
          <div title="can_see_managed_users" className="form-group">
            <input
              type="checkbox"
              ref={e => {
                this.can_see_managed_users = e;
              }}
              id={"can_see_managed_users"}
              defaultChecked={this.state.user.can_see_managed_users}
            />
            <label
              htmlFor={"can_see_managed_users"}
              className="vertical-align-middle no-margin"
              style={{ fontWeight: "normal", fontSize: "16px" }}
            >
              <div
                style={{ float: "left", fontSize: "14px", paddingRight: "5px" }}
              >
                Can see managed users
              </div>
            </label>
          </div>
          space_amount (mb) :
          <input
            ref={e => {
              this.space_amount = e;
            }}
            defaultValue={
              this.state.user.space_amount * 1 == 0
                ? "0"
                : this.state.user.space_amount / 1024 / 1024
            }
            type="number"
            placeholder="The user’s total available space amount in mb"
            className="form-group form-control"
          />
          <div title="is_exempt_from_login_verification" className="form-group">
            <input
              type="checkbox"
              ref={e => {
                this.is_exempt_from_login_verification = e;
              }}
              id={"is_exempt_from_login_verification"}
            />
            <label
              htmlFor={"is_exempt_from_login_verification"}
              className="vertical-align-middle no-margin"
              style={{ fontWeight: "normal", fontSize: "16px" }}
            >
              <div
                style={{ float: "left", fontSize: "14px", paddingRight: "5px" }}
              >
                Whether the user must use two-factor authentication
              </div>
            </label>
          </div>
          status:<select
            ref={e => {
              this.status = e;
            }}
            defaultValue={this.state.user.status}
            className="form-control form-group"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="cannot_delete_edit">cannot_delete_edit</option>
            <option value="cannot_delete_edit_upload">
              cannot_delete_edit_upload
            </option>
          </select>
          <input
            className="action-button extra-margin-right"
            onClick={this.updateUser}
            title="Update"
            value="Update"
            type="submit"
          />
          <input
            className="action-button extra-margin-right"
            onClick={this.changeMode}
            title="Cancel"
            value="Cancel"
            type="submit"
          />
        </div>
      );
    }
  }
});
var GroupsManager = React.createClass({
  getInitialState: function() {
    return {
      showNewGroupOptions: false,
      total_count: undefined,
      groups: undefined,
      current: undefined,
      showCreateMember: false,
      searchText: ""
    };
  },
  componentDidMount: function() {
    this.getAllGroups();
  },
  getAllGroups: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doGet("/group/getEnterpriseGroups/null/null", args, function(data) {
      var gd = JSON.parse(data).body;
      self.setState({
        total_count: gd.total_count,
        groups: gd.entries,
        showNewGroupOptions: false,
        showCreateMember: false
      });
    });
  },
  close: function(update) {
    this.setState({ showCreateMember: false });
    if (update) this.getGroupInformation();
  },
  getGroupInformation: function() {
    var self = this;
    if (this.state.current) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        }
      };
      doGet(
        "/group/get/" + this.state.current.id + "/name,description",
        args,
        function(data) {
          doGet(
            "/group/getMemberships/" + self.state.current.id + "/null",
            args,
            function(memres) {
              self.setState({
                currentGroupData: {
                  info: JSON.parse(data),
                  members: JSON.parse(memres)
                }
              });
            }
          );
        }
      );
    } else {
      this.getAllGroups();
    }
  },
  createNewGroup: function() {
    var self = this;
    var groupName = this.newGroupName.value.trim();
    var groupDescription = this.newGroupDescription.value.trim();
    if (groupName != "" && groupDescription != "") {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: { description: groupDescription }
      };
      doPost("/group/create/" + groupName, args, function(data) {
        self.getAllGroups();
      });
    }
  },
  setCurrent: function(group) {
    if (typeof this.props.callback == "function") {
      this.props.callback(group);
    } else {
      this.setState(
        {
          current: group,
          currentGroupData: undefined,
          showCreateMember: false
        },
        this.getGroupInformation
      );
    }
  },
  setDescription: function() {
    //var self=this;
    if (
      this.state.currentGroupData.info.description != this.desc.value.trim()
    ) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: { description: this.desc.value.trim() }
      };
      doPost("/group/update/" + this.state.current.id, args, function(data) {
        //self.getGroupInformation();
      });
    }
  },
  setName: function() {
    //var self=this;
    if (this.state.current.name != this.name.value.trim()) {
      var args = {
        headers: {
          "x-business-id": this.props.enterpriseId,
          "x-access-token": this.props.token
        },
        data: { name: this.name.value.trim() }
      };
      doPost("/group/update/" + this.state.current.id, args, function(data) {
        //self.getGroupInformation();
      });
    }
  },
  deleteGroup: function() {
    var self = this;
    common.createConfirm(
      "Confirm",
      "Are you sure you want to delete this Group?",
      function(confirm) {
        if (confirm) {
          var args = {
            headers: {
              "x-business-id": self.props.enterpriseId,
              "x-access-token": self.props.token
            }
          };
          doPost("/group/delete/" + self.state.current.id, args, function() {
            self.setCurrent(undefined);
          });
        }
      }
    );
  },
  setSearchText: function() {
    this.setState({ searchText: this.searchText.value.trim() });
  },
  render: function() {
    var self = this;
    if (this.state.current) {
      return (
        <div>
          <span
            className="blueLink pointer form-group margin-bottom-gap"
            onClick={this.setCurrent.bind(null, undefined)}
          >
            All Groups
          </span>
          <div className="pointer form-group">
            <i
              className="icons8-group fa-2x extra-padding-right"
              aria-hidden="true"
            />
            <input
              type="text"
              style={{ border: "none" }}
              onBlur={this.setName}
              defaultValue={this.state.current.name}
              ref={e => {
                this.name = e;
              }}
              className="fa-2x display-inline-block"
            />
            {this.state.currentGroupData && this.state.currentGroupData.info ? (
              <div className="form-group">
                <textarea
                  style={{ border: "none" }}
                  onBlur={this.setDescription}
                  ref={e => {
                    this.desc = e;
                  }}
                  defaultValue={this.state.currentGroupData.info.description}
                  className="fa-x"
                />
              </div>
            ) : (
              ""
            )}
          </div>
          {this.state.currentGroupData &&
          this.state.currentGroupData.members &&
          Array.isArray(this.state.currentGroupData.members.entries) ? (
            <div>
              {this.state.currentGroupData.members.entries.map(function(entry) {
                return (
                  <ViewOrUpdateGroupMember
                    enterpriseId={this.props.enterpriseId}
                    key={global.guid()}
                    data={entry}
                    token={self.props.token}
                    userId={self.props.userId}
                    role={self.props.role}
                  />
                );
              })}
            </div>
          ) : (
            ""
          )}
          {this.state.showCreateMember ? (
            <CreateGroupMember
              enterpriseId={this.props.enterpriseId}
              token={this.props.token}
              id={this.state.current.id}
              userId={this.props.userId}
              role={this.props.role}
              cancelCallback={this.close}
            />
          ) : (
            <i
              className="icons8-add-user-male fa-2x pointer display-inline-block extra-padding-right"
              title="Add Collaborator"
              onClick={() => {
                this.setState({ showCreateMember: true });
              }}
              aria-hidden="true"
            />
          )}
          <i
            className="icons8-trash-can fa-2x pointer display-inline-block extra-padding-right"
            title="Delete Group"
            onClick={self.deleteGroup}
            aria-hidden="true"
          />
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="text"
            className="form-group form-control"
            placeholder="Search groups with id | name"
            onChange={this.setSearchText}
            ref={e => {
              this.searchText = e;
            }}
          />
          {Array.isArray(this.state.groups) ? (
            <div>
              {this.state.groups.map(function(group) {
                if (self.state.searchText) {
                  if (
                    group.name.toLowerCase().indexOf(self.state.searchText) >
                      -1 ||
                    group.id.toLowerCase().indexOf(self.state.searchText) > -1
                  ) {
                    return (
                      <div
                        key={group.id}
                        onClick={self.setCurrent.bind(null, group)}
                        className="pointer form-group"
                      >
                        <i
                          className="icons8-group fa-x extra-padding-right"
                          aria-hidden="true"
                        />
                        <span>{group.name}</span>
                      </div>
                    );
                  } else {
                    return null;
                  }
                } else {
                  return (
                    <div
                      key={group.id}
                      onClick={self.setCurrent.bind(null, group)}
                      className="pointer form-group"
                    >
                      <i
                        className="icons8-group fa-x extra-padding-right"
                        aria-hidden="true"
                      />
                      <span>{group.name}</span>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            ""
          )}
          {this.props.role == "admin" || this.props.role == "coadmin" ? (
            <div>
              {!this.state.showNewGroupOptions ? (
                <div>
                  <input
                    className="action-button extra-margin-right"
                    onClick={() => {
                      this.setState({ showNewGroupOptions: true });
                    }}
                    title="New Group"
                    value="New Group"
                    type="submit"
                  />
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    className="form-control form-group"
                    ref={e => {
                      this.newGroupName = e;
                    }}
                    placeholder="Enter Group name"
                    autoFocus={true}
                  />
                  <textarea
                    type="text"
                    className="form-control form-group"
                    ref={e => {
                      this.newGroupDescription = e;
                    }}
                    placeholder="Enter Group description"
                  />
                  <input
                    className="action-button extra-margin-right"
                    onClick={this.createNewGroup}
                    title="Create"
                    value="Create"
                    type="submit"
                  />
                  <input
                    className="action-button extra-margin-right"
                    onClick={() => {
                      this.setState({ showNewGroupOptions: false });
                    }}
                    title="Cancel"
                    value="Cancel"
                    type="submit"
                  />
                </div>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
      );
    }
  }
});

var CreateGroupMember = React.createClass({
  getInitialState: function() {
    return {
      selectedUser: undefined,
      role: undefined
    };
  },
  selectedUser: function(doc) {
    this.setState({ selectedUser: doc });
  },
  createMember: function() {
    if (!this.state.selectedUser) {
      common.createAlert("Error", "Please select user");
      return;
    }
    if (!this.state.role) {
      common.createAlert("Error", "Please select role");
      return;
    }
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: { role: this.state.role }
    };
    doPost(
      "/group/addMember/" + this.props.id + "/" + this.state.selectedUser.id,
      args,
      function(res) {
        self.props.cancelCallback(true);
      }
    );
  },
  reselectUser: function() {
    this.setState({ selectedUser: undefined });
  },
  setRole: function() {
    this.setState({ role: this.role.value });
  },
  render: function() {
    return (
      <div className="form-group margin-top-gap">
        <div className="form-group">
          {this.state.selectedUser ? (
            <div>
              <div className="child-img-component extra-padding-right-sm">
                <UserIcon
                  currentUserInfo={this.state.selectedUser}
                  enterpriseId={this.props.enterpriseId}
                  token={this.props.token}
                  userId={this.props.userId}
                  role={this.props.role}
                />
              </div>
              <div className="child-img-component no-padding">
                <div
                  className="icons8-delete link"
                  onClick={this.reselectUser}
                  title="Click to reselect"
                />
              </div>
            </div>
          ) : (
            <UsersManager
              enterpriseId={this.props.enterpriseId}
              token={this.props.token}
              userId={this.props.userId}
              role={this.props.role}
              callback={this.selectedUser}
            />
          )}
        </div>
        <select
          className="form-control form-group"
          ref={e => {
            this.role = e;
          }}
          onChange={this.setRole}
        >
          <option value="">Select Role</option>
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>

        <input
          className="action-button extra-margin-right"
          onClick={this.createMember}
          title="Add"
          value="Add"
          type="submit"
        />
        <input
          className="action-button extra-margin-right"
          onClick={() => {
            this.props.cancelCallback(false);
          }}
          title="Cancel"
          value="Cancel"
          type="submit"
        />
      </div>
    );
  }
});

var ViewOrUpdateGroupMember = React.createClass({
  getInitialState: function() {
    return this.props.data;
  },
  changeToRoleEdit: function() {
    $(this.roleName).addClass("hidden");
    $(this.roleSelection).removeClass("hidden");
  },
  setRole: function() {
    $(this.roleName).removeClass("hidden");
    $(this.roleSelection).addClass("hidden");
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      },
      data: { role: this.roleSelection.value }
    };
    doPost("/group/updateMembership/" + this.state.id, args, function(data) {
      self.setState({ role: self.roleSelection.value });
    });
  },
  removeMember: function() {
    var self = this;
    var args = {
      headers: {
        "x-business-id": this.props.enterpriseId,
        "x-access-token": this.props.token
      }
    };
    doPost("/group/removeMember/" + this.state.id, args, function() {
      self.setState({ id: undefined });
    });
  },
  render: function() {
    if (!this.state.id) {
      return null;
    } else {
      return (
        <div className="form-group">
          <div className="display-inline-block extra-padding-right-sm">
            {/*<UserIcon token={self.props.token} id={this.props.data.user.id}/>*/}
            {this.state.user.name}
          </div>
          <div
            className="display-inline-block extra-padding-right-sm pencil"
            onClick={this.changeToRoleEdit}
            ref={e => {
              this.roleName = e;
            }}
          >
            <b>{this.state.role}</b>
          </div>
          <div className="display-inline-block extra-padding-right-sm">
            <select
              className="form-group hidden"
              defaultValue={this.state.role}
              ref={e => {
                this.roleSelection = e;
              }}
              onChange={this.setRole}
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="display-inline-block extra-padding-right-sm">
            <i
              className="icons8-trash-can fa-x pointer display-inline-block extra-padding-right"
              title="Remove member from this group."
              onClick={self.removeMember}
              aria-hidden="true"
            />
          </div>
        </div>
      );
    }
  }
});
