	/**
	 * @author - Vikram
	 */
	var React = require("react");
	var ReactDOM = require("react-dom");
	var genericView = require("./view/genericView.jsx");
	var OrgNav = require("./view/components/orgStartupPage.jsx").OrgNav;
	var linkGenerator = require("./nav/linkGenerator.jsx");
	var signUp = require("./auth/signUp.jsx");
	var AdminConsole = require("./nav/adminNav.jsx").AdminConsole;
	var genericNav = require("./nav/genericNav.jsx");
	var search = require("./nav/search.jsx");
	//var researchSpecs=require('./nav/researchSpec.jsx');
	var DefinitionStore = require("../stores/DefinitionStore");
	var RecordSummaryStore = require("../stores/RecordSummaryStore");
	var RecordDetailStore = require("../stores/RecordDetailStore");
	var SchemaStore = require("../stores/SchemaStore");
	var JunctionStore = require("../stores/JunctionStore");
	var JunctionCountStore = require("../stores/JunctionCountStore");
	var Chat = require("./Chat.jsx");
	var ActionCreator = require("../actions/ActionCreator.js");
	var ServerActionReceiver = require("../actions/ServerActionReceiver.js");

	var WebUtils = require("../utils/WebAPIUtils.js");
	var global = require("../utils/global.js");
	var browserHistory = require("react-router").browserHistory;
	var Link = require("react-router").Link;
	var workflow = require("./view/components/workflow.jsx");

	var NewsLetter=require("./admin/NewsLetter.jsx");

	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		  results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return "";
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
	exports.getParameterByName = getParameterByName;



	var ChatBotComponent = React.createClass({
		getInitialState:function(){
		  return {showButton:true,expanded:false};
		},
		expand:function(){
			if(this.state.expanded){
				this.chatWindow.style.height="";
				this.chatWindow.style.width="";
			}else{
				this.chatWindow.style.height=($(window).height()-60)+"px";
				this.chatWindow.style.width=($(window).width()-20)+"px";
			}
			this.setState({expanded:!this.state.expanded});
		},
		componentDidMount:function(){
			this.expand();
		},
		render: function() {
		  return (
		    <div className={"chatBotBlock"}>
		        <div className={this.state.showButton?"":"hidden"}>
		          <button type="button" className="upload-btn pointer no-margin" onClick={()=>{this.setState({showButton:false})}}>Chat</button>
		        </div>
		        <div className={this.state.showButton?"hidden":""}>
		        	<div className="chatbotheader" onDoubleClick={this.expand}>
				        <div className="chatClose" onClick={()=>{this.setState({showButton:true})}} title="Minimize">
				            <span className="icons8-expand-arrow fontSizeDelete  fa-3x deleteIcon link" aria-hidden="true"></span>
				        </div>
				        <div className="chatExpand" onClick={this.expand} title="Resize">
				            <span className="icons8-change fontSizeDelete  fa-3x deleteIcon link" aria-hidden="true"></span>
				        </div>
		          </div>
		          		{/*src="https://webchat.botframework.com/embed/cloudseed?s=2M_Sutw65r8.cwA.DN4.UdfO1IBmhVbYe8OTchY4oLSQLdU-WPkddW4bQRTNhVs"*/}
		          <iframe ref={(e)=>{this.chatWindow=e;}}
		          		src="/chatbot.html"
		          		 border="none"/>
		        </div>
		    </div>
		  )
		}
	});
	exports.ChatBotComponent=ChatBotComponent



	function showLoginPopup() {
		if (
		  (UserDoc == undefined || UserDoc.recordId == undefined) &&
		  window.sessionChecked &&
		  $(".popUpLoginDiv").length == 0 &&
		  !siteSpecific
		) {
		  try {
		    if ($(".walkthrough-overlay").length > 0) {
		      return;
		    }
		  } catch (err) {}
		  if (getParameterByName("ctar")) {
		    workflow.workFlow("loginWorkFlow");
		    return;
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
		    <GenericPopUpComponent
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		      sideDivId={sideDivId}
		      noSideDiv={true}
		    />,
		    node
		  );
		  ReactDOM.render(
		    <signUp.LoginPopup popUpId={popUpId} contentDivId={contentDivId} />,
		    document.getElementById(contentDivId)
		  );
		}
	}
	exports.showLoginPopup = showLoginPopup;
	function showChat() {
		if (UserDoc != undefined && UserDoc.recordId != undefined) {
		  var node = document.createElement("div");
		  node.id = global.guid();
		  var popUpId = global.guid();
		  var contentDivId = global.guid();
		  var sideDivId = global.guid();
		  node.className =
		    "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  node.style.overflow = "hidden";
		  var mobile = false;
		  if (
		    typeof navigator != "undefined" &&
		    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		      navigator.userAgent
		    )
		  ) {
		    node.style.overflow = "unset";
		    mobile = true;
		  }
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  ReactDOM.render(
		    <GenericPopUpComponent
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		      mobile={mobile}
		      sideDivId={sideDivId}
		      close={function() {
		        document.getElementById("topNav").className = document
		          .getElementById("topNav")
		          .className.replace(/hidden/g, "");
		      }}
		      chatDiv={true}
		      noSideDiv={true}
		    />,
		    node
		  );
		  ReactDOM.render(
		    <Chat.ChatComponent userId={UserDoc.recordId} mobile={mobile} />,
		    document.getElementById(contentDivId)
		  );
		  try {
		    trackThis("chat", { type: "general", id: undefined });
		  } catch (err) {}
		}
	}
	exports.showLoginPopup = showLoginPopup;
	if (typeof window != "undefined") {
		window.showChat = showChat;
	}
	function hideLoginPopup() {
		//document.getElementById("loginDiv").style.display="none";
	}
	exports.hideLoginPopup = hideLoginPopup;

	function clearLeftContent() {
		try {
		  if (
		    configDetails.handleBarTemplate == "jsm" ||
		    configDetails.handleBarTemplate == "wevaha"
		  ) {
		    return;
		  }
		} catch (err) {}
	}
	exports.clearLeftContent = clearLeftContent;
	function adjustDivs() {
		try {
		  if (
		    getConfigDetails().handleBarTemplate == "jsm" ||
		    getConfigDetails().handleBarTemplate == "wevaha"
		  ) {
		    document.getElementById("sideFilterNavigation").className =
		      " col-lg-2 col-md-2 col-sm-3 col-xs-12 ";
		    document.getElementById("dynamicContentDiv").className =
		      " col-lg-8 col-md-8 col-sm-9 col-xs-12 ";
		    document.getElementById("rightContentDiv").className =
		      " col-lg-2 col-md-2 col-sm-12 col-xs-12 ";
		  }
		} catch (err) {}
	}
	exports.adjustDivs = adjustDivs;
	function clearFilters() {
		document.getElementById("sideFilterNavigation").innerHTML = "";
	}
	exports.clearFilters = clearFilters;
	function clearRightContent() {
		//ReactDOM.unmountComponentAtNode(document.getElementById('rightContentDiv'));
	}
	exports.clearRightContent = clearRightContent;
	function clearMainContent() {
		try {
		  RecordSummaryStore.removeAllChangeListeners();
		  RecordDetailStore.removeAllChangeListeners();
		  SchemaStore.removeAllChangeListeners();
		  JunctionStore.removeAllChangeListeners();
		  JunctionStore.clear();
		  JunctionCountStore.removeAllChangeListeners();
		  /*if(!ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'))){
				document.getElementById('dynamicContentDiv').innerHTML="";
			};*/
		  document.getElementById("dynamicContentDiv").style.display = "block";
		  $.ajaxQueue("clear");
		} catch (err) {
		  try {
		    document.getElementById("dynamicContentDiv").innerHTML = "";
		  } catch (err) {}
		}
	}
	exports.clearMainContent = clearMainContent;

	function garbageCollect() {
		RecordSummaryStore.removeAllChangeListeners();
		RecordDetailStore.removeAllChangeListeners();
		SchemaStore.removeAllChangeListeners();
		JunctionStore.removeAllChangeListeners();
		JunctionStore.clear();
		JunctionCountStore.removeAllChangeListeners();
		$.ajaxQueue("clear");
	}
	exports.garbageCollect = garbageCollect;

	var UserDoc = {};
	var UserInfo = {};
	function setUserDoc(userDoc) {
		DefinitionStore.addUserDoc(userDoc);
		UserDoc = userDoc;
	}
	exports.setUserDoc = setUserDoc;
	function getUserDoc() {
		return UserDoc;
	}
	exports.getUserDoc = getUserDoc;

	var SessionData = {};
	function setSessionData(doc) {
		SessionData = doc;
	}
	exports.setSessionData = setSessionData;
	function getSessionData() {
		return SessionData;
	}
	exports.getSessionData = getSessionData;

	function getSchemaRoleOnOrg(schema, org) {
		var schemaRoles = {};
		try {
		  if (Array.isArray(schema)) {
		    for (var i = 0; i < schema.length; i++) {
		      if (SessionData.navLinks && SessionData.navLinks.cloudPointAdmin) {
		        schemaRoles[schema[i]] = {
		          cloudPointAdmin: true,
		          create: "createAll",
		          detailView: "getDetail",
		          methods: "all",
		          navViews: "all"
		        };
		      } else if (
		        SessionData.privileges[org] &&
		        SessionData.privileges[org][schema[i]]
		      ) {
		        schemaRoles[schema[i]] = SessionData.privileges[org][schema[i]];
		      } else {
		        schemaRoles[schema[i]] = {};
		      }
		    }
		  } else {
		    if (SessionData.navLinks && SessionData.navLinks.cloudPointAdmin) {
		      schemaRoles = {
		        cloudPointAdmin: true,
		        create: "createAll",
		        detailView: "getDetail",
		        methods: "all",
		        navViews: "all"
		      };
		    } else if (
		      SessionData.privileges[org] &&
		      SessionData.privileges[org][schema]
		    ) {
		      schemaRoles = SessionData.privileges[org][schema];
		    } else {
		      schemaRoles = {};
		    }
		  }
		} catch (err) {
		  //console.log("ERROR IN getSchemaRoleOnOrg "+err);
		}
		return schemaRoles;
	}

	exports.getSchemaRoleOnOrg = getSchemaRoleOnOrg;

	var slugs = {};
	function getSlugDetails(slug, path) {
		if (slugs[slug]) {
		  if (path) {
		    return slugs[slug][path];
		  } else if (slugs[slug].type) {
		    return slugs[slug];
		  } else {
		    return undefined;
		  }
		} else {
		  return undefined;
		}
	}
	exports.getSlugDetails = getSlugDetails;

	function setSlugDetails(slug, path, data) {
		if(data.error){
			return;
		}
		if (path) {
		  slugs[slug] = {};
		  slugs[slug][path] = data;
		} else {
		  slugs[slug] = data;
		}
	}
	exports.setSlugDetails = setSlugDetails;
	function clearSlugs() {
		slugs = {};
	}
	exports.clearSlugs = clearSlugs;

	function getAllSlugs() {
		return slugs;
	}
	exports.getAllSlugs = getAllSlugs;
	function setSlugs(ss) {
		slugs = ss;
	}
	exports.setSlugs = setSlugs;

	var userOrgs = [];
	var orgsAndRoles = [];
	function setUserOrgs(orgs) {
		if (Array.isArray(orgs)) {
		  orgs.forEach(function(o) {
		    orgsAndRoles.push(o.value);//{org:"",roles:[]}
		    if (userOrgs.indexOf(o.value.org) == -1 && o.value.org != "public") {
		      userOrgs.push(o.value.org);
		    }
		  });
		}else if(orgs && typeof orgs=="object"){
			for(var org in orgs){
			orgsAndRoles.push({org:org,roles:orgs[org]});//{org:"",roles:[]}
		  	if (userOrgs.indexOf(org) == -1 && org != "public") {
		  	   userOrgs.push(org);
		  	}
			}
		}
	}
	exports.setUserOrgs = setUserOrgs;

	function getUserOrgs() {
		return userOrgs;
	}
	exports.getUserOrgs = getUserOrgs;

	function getUserOrgsAndRoles() {
		return orgsAndRoles;
	}
	exports.getUserOrgsAndRoles = getUserOrgsAndRoles;
	function getUserRolesOnOrg(org) {
		var roles = [];
		if (Array.isArray(orgsAndRoles)) {
		  // for-in changed to for-of
		  for (var index in orgsAndRoles) {
		    if (orgsAndRoles[index].org == org) {
		      roles = orgsAndRoles[index].roles;
		      break;
		    }
		  }
		}
		return roles;
	}
	exports.getUserRolesOnOrg = getUserRolesOnOrg;
	var configDetails = {};
	function setConfigDetails(doc) {
		configDetails = doc;
		Chat.initChat();
	}
	exports.setConfigDetails = setConfigDetails;
	function getConfigDetails() {
		return configDetails;
	}
	exports.getConfigDetails = getConfigDetails;

	var siteSpecific = false;
	function setSiteSpecific(ss) {
		siteSpecific = ss;
	}
	exports.setSiteSpecific = setSiteSpecific;
	function getSiteSpecific() {
		return siteSpecific;
	}
	exports.getSiteSpecific = getSiteSpecific;

	var showOnlyMainContent = false;
	function setShowOnlyMainContent(value) {
		showOnlyMainContent = value;
	}
	exports.setShowOnlyMainContent = setShowOnlyMainContent;
	function getShowOnlyMainContent() {
		return showOnlyMainContent;
	}
	exports.getShowOnlyMainContent = getShowOnlyMainContent;

	var adminUser = false;
	function setAdmin() {
		adminUser = true;
	}
	exports.setAdmin = setAdmin;
	function isAdmin() {
		return adminUser;
	}
	exports.isAdmin = isAdmin;

	function saveImages(images) {
		for (var i = 0; i < images.length; i++) {
		  WebUtils.doPost("/createProject?operation=saveImages", images[i], function(
		    result
		  ) {});
		}
	}
	exports.saveImages = saveImages;
	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}
	exports.validateEmail = validateEmail;

	function startLoader() {
		//<img id="ajax-loader" alt="{{title}} loader"  />
		var node = document.createElement("img");
		node.id = global.guid();
		node.className = "loader";
		node.alt = configDetails.tradeName + " Loader Image";
		node.src = "/branding/" + configDetails.loader;
		document.body.appendChild(node);
		//document.getElementById("ajax-loader").style.display="block";
	}
	exports.startLoader = startLoader;
	function stopLoader() {
		try {
		  document.getElementsByClassName("loader")[0].remove();
		} catch (err) {
		  console.log("No active loader found");
		}
		//document.getElementById("ajax-loader").style.display="none";
	}
	exports.stopLoader = stopLoader;

	function startLoadMore() {
		document.getElementById("loadMore").innerHTML =
		  "<img src='/branding/loader.gif' style='width:45px'>";
		document.getElementsByClassName("loadMore").innerHTML =
		  "<img src='/branding/loader.gif' style='width:45px'>";
		$("#loadMore, .loadMore")
		  .html("<img src='/branding/loader.gif' style='width:45px'>")
		  .css("display", "inline");
	}
	exports.startLoadMore = startLoadMore;

	function stopLoadMore() {
		document.getElementById("loadMore").style.display = "none";
		document.getElementsByClassName("loadMore").style.display = "none";
		//$("#loadMore, .loadMore").html("").css("display","none");
	}
	exports.stopLoadMore = stopLoadMore;

	/*********************************FBLOGIN**************************************************/

	function FBLogin() {
		FB.login(
		  function(response) {
		    if (response.status === "connected") {
		      getUserInfo();
		    } else if (response.status === "not_authorized") {
		      console.log("Failed to Connect facebook");
		    } else {
		      console.log("Logged Out");
		    }
		  },
		  { scope: "public_profile,email", return_scopes: true }
		);
	}
	//user_friends,user_likes,user_birthday,user_location,user_work_history
	exports.FBLogin = FBLogin;
	function FBLogout() {
		FB.logout(function(response) {
		  UserDoc = {};
		  SessionData = {};
		  document.getElementById("userPhoto").innerHTML = "";
		});
	}
	exports.FBLogout = FBLogout;

	/*
	function fbShare() {
		FB.ui({
			method: 'share',
			href: 'https://developers.facebook.com/docs/',
		},function(response){});
	}*/
	function getUserInfo() {
		FB.api("/me/picture?type=normal", function(res) {
		  try {
		    UserInfo.image = res.data.url;
		  } catch (err) {}
		  if (
		    $(".popUpLoginDiv") &&
		    $(".popUpLoginDiv").find(".deleteIcon") &&
		    $(".popUpLoginDiv").find(".deleteIcon").length > 0
		  ) {
		    $(".popUpLoginDiv")
		      .find(".deleteIcon")
		      .click();
		  }
		  startLoader();
		  //link
		  FB.api("/me?fields=email,name,id,first_name,last_name,gender", function(
		    response
		  ) {
		    UserInfo.loggedInVia = "facebook";
		    UserInfo.displayName = response.name;
		    UserInfo.email = response.hasOwnProperty("email")
		      ? response.email
		      : response.id + "@facebook.com"; //sat
		    UserInfo.gender = response.gender;
		    UserInfo.fname = response.first_name;
		    UserInfo.lname = response.last_name;
		    //UserInfo.link=response.link;
		    UserInfo.id = response.id;
		    WebUtils.doPost("/user?operation=getUserDocByEmail", UserInfo, function(
		      res
		    ) {
		      loggedInVia = "facebook";
		      UserDoc = res.userData; //res.data;
		      SessionData = res;
		      setUserDoc(res.userData);
		      setUserOrgs(res.orgAndRoles);
		      //ServerActionReceiver.receiveUserDoc(res.userData);
		      ServerActionReceiver.receiveNavigationLinks(res.navLinks);
		      try {
		        userLogin(UserDoc);
		      } catch (err) {}
		      redirectAfterLogin();
		      stopLoader();
		    });
		  });
		});
	}
	exports.getUserInfo = getUserInfo;

	/******************     LinkedinLogin **************************************************/

	function LinkedInLogin() {
		IN.User.authorize(getProfileData);
	}

	function onSuccess(data) {
		startLoader();
		UserInfo.image = data.pictureUrl;
		UserInfo.loggedInVia = "linkedin";
		UserInfo.displayName = data.firstName + " " + data.lastName;
		UserInfo.email = data.emailAddress;
		UserInfo.fname = data.firstName;
		UserInfo.lname = data.lastName;
		UserInfo.link = data.publicProfileUrl;
		UserInfo.id = data.id;
		WebUtils.doPost("/user?operation=getUserDocByEmail", UserInfo, function(res) {
		  loggedInVia = "linkedin";
		  UserDoc = res.userData;
		  SessionData = res;
		  setUserDoc(res.userData);
		  setUserOrgs(res.orgAndRoles);
		  //ServerActionReceiver.receiveUserDoc(res.userData);
		  ServerActionReceiver.receiveNavigationLinks(res.navLinks);
		  redirectAfterLogin();
		  try {
		    userLogin(UserDoc);
		  } catch (err) {}
		  stopLoader();
		});
	}

	function onError(error) {
		console.log(error);
	}
	/*function onSuccessShare(data) {
		console.log(data);
	}*/
	// Use the API call wrapper to request the member's basic profile data
	function getProfileData() {
		IN.API.Raw(
		  "/people/~:(id,first-name,last-name,email-address,picture-url,public-profile-url)"
		)
		  .result(onSuccess)
		  .error(onError);
	}
	exports.LinkedInLogin = LinkedInLogin;

	/*
	function shareContent(){
		// Build the JSON payload containing the content to be shared
		  var payload = {
		  	"comment": "Check out developer.linkedin.com! https://linkd.in/1FC2PyG",
		    	"visibility": {
		      	"code": "anyone"
		    	}
		  };
		  IN.API.Raw("/people/~/shares?format=json")
		    .method("POST")
		    .body(JSON.stringify(payload))
		    .result(onSuccessShare)
		    .error(onError);
	}
	*/

	function INLogout() {
		IN.User.logout(function(response) {
		  UserDoc = {};
		  SessionData = {};
		  //  $("#userPhoto").html("");
		  document.getElementById("userPhoto").innerHTML = "";
		});
	}
	exports.INLogout = INLogout;

	/************************** GOOGLE PLUS **************************************************/

	function gApiLoginCallback(result) {
		if (result["status"]["signed_in"]) {
		  var request = gapi.client.plus.people.get({
		    userId: "me"
		  });
		  request.execute(function(resp) {
		    var email = "";
		    if (resp["emails"]) {
		      for (var i = 0; i < resp["emails"].length; i++) {
		        if (resp["emails"][i]["type"] == "account") {
		          email = resp["emails"][i]["value"];
		        }
		      }
		    }

		    UserInfo = {
		      loggedInVia: "googleplus",
		      displayName: resp.displayName,
		      email: email,
		      gender: resp.gender,
		      image: resp.image.url,
		      fname: resp.name.givenName,
		      lname: resp.name.familyName,
		      link: resp.url,
		      id: resp.id
		    };
		    loggedInVia = "google";
		    //changed for login in popup
		    if (
		      $(".popUpLoginDiv") &&
		      $(".popUpLoginDiv").find(".deleteIcon") &&
		      $(".popUpLoginDiv").find(".deleteIcon").length > 0
		    ) {
		      $(".popUpLoginDiv")
		        .find(".deleteIcon")
		        .click();
		    }
		    startLoader();
		    WebUtils.doPost("/user?operation=getUserDocByEmail", UserInfo, function(
		      res
		    ) {
		      setUserDoc(res.userData); //res.data
		      setSessionData(res);
		      setUserOrgs(res.orgAndRoles);
		      //ServerActionReceiver.receiveUserDoc(res.userData);
		      ServerActionReceiver.receiveNavigationLinks(res.navLinks);
		      var userDoc = res.userData; // res.data;
		      redirectAfterLogin();
		      //mixpannel tracking code
		      try {
		        userLogin(userDoc);
		      } catch (err) {}
		      //genericNav.loadGenericNav();
		      stopLoader();
		    });
		  });
		}
	}
	exports.gApiLoginCallback = gApiLoginCallback;

	function onLoadGApiCallback() {
		gapi.client.setApiKey(getConfigDetails().auth.gplus.API_key);
		gapi.client.load("plus", "v1", function() {});
	}
	exports.onLoadGApiCallback = onLoadGApiCallback;

	function GoogleLogout() {
		gapi.auth.signOut();
		location.reload();
	}
	exports.GoogleLogout = GoogleLogout;

	function GoogleLogin() {
		var myParams = {
		  apiKey: getConfigDetails().auth.gplus.API_key,
		  clientid: getConfigDetails().auth.gplus.Client_ID,
		  cookiepolicy: "single_host_origin",
		  callback: "gApiLoginCallback",
		  prompt: "consent",
		  scope: "email"
		};
		gapi.auth.signIn(myParams);
		//'approvalprompt':'force',
	}
	exports.GoogleLogin = GoogleLogin;

	function redirectAfterLogin() {
		if (
		  configDetails.afterLogin &&
		  configDetails.afterLogin == "landOnUserPage"
		) {
		  browserHistory.push(
		    linkGenerator.getDetailLink({
		      record: UserDoc,
		      org: "public",
		      schema: "User",
		      recordId: UserDoc.recordId
		    })
		  );
		} else {
		  var current = location.pathname + location.search;
		  browserHistory.push("/");
		  browserHistory.push(current);
		}
		try {
		  require("./socket.io.js").createRoom(UserDoc.recordId);
		} catch (err) {}
		if (document.getElementById("bottomNav")) {
		  if (document.getElementById("bottomLogin")) {
		    document.getElementById(
		      "bottomLogin"
		    ).className = document
		      .getElementById("bottomLogin")
		      .className.replace("", " hidden ");
		  }
		  ReactDOM.render(
		    <BottomNavComponent />,
		    document.getElementById("bottomNav")
		  );
		}
		checkOrgs();
	}
	exports.redirectAfterLogin = redirectAfterLogin;
	function checkOrgs() {
		if (UserDoc.recordId != undefined) {
		  WebUtils.doPost("/user?operation=checkUserExistance", {}, function(result) {
		    if (!result.userAssociatedWithAnOrg && !window.claiming) {
		      if (
		        configDetails.newLoginWorkFlow &&
		        configDetails.newLoginWorkFlow != ""
		      ) {
		        workflow.workFlow(
		          configDetails.newLoginWorkFlow,
		          undefined,
		          undefined
		        );
		      }
		    } else {
		      setUserOrgs(result.allOrgs);
		    }
		    localStorage.setItem("sound", "false");
		  });
		}
	}
	exports.checkOrgs = checkOrgs;

	var InvitePeople = React.createClass({
		componentWillUnmount: function() {
		  if (this.props.node != undefined) {
		    ReactDOM.unmountComponentAtNode(this.props.node);
		  }
		},
		invite: function() {
		  var self = this;
		  var emails = this.email.value.trim().split(",");
		  var mailformat = global.emailFormate;
		  var flag = true;
		  for (var i = 0; i < emails.length; i++) {
		    if (!emails[i].match(mailformat)) {
		      flag = false;
		      createAlert(
		        "Error",
		        "please enter correct email address: " + emails[i] + "  "
		      );
		      //createAlert();
		    }
		  }

		  if (flag) {
		    try {
		      self.props.close();
		    } catch (err) {}
		    require("../utils/WebAPIUtils.js").invite(emails, function(data) {
		      createAlert(
		        "Success",
		        "Invitation sent!"
		      );
		    //  createAlert("Invitation sent!");
		    });
		    try {
		      trackThis("invite", { inviter: UserDoc.email, invitee: emails });
		    } catch (err) {}
		  }
		},
		inviteViaFb: function() {
		  FB.getLoginStatus(function(response) {
		    console.log(response);
		    if (response.status === "connected") {
		      FB.ui({ method: "send", link: location.href }, function(response) {
		        if (response && !response.error_message) {
		          //alert('Posting completed.');
		        } else {
		          // alert('Error while posting.');
		        }
		      });
		    } else {
		      FBLogin();
		    }
		  });
		},
		render: function() {
		  return (
		    <div
		      className="col-lg-12 col-md-12 col-sm-12 col-xs-12"
		      style={{ marginTop: "5%" }}
		    >
		      <div className="title form-group margin-bottom-gap">
		        Spread the love. Invite your friends to cloudseed.
		      </div>
		      <div>
		        <input
		          type="email"
		          ref={input => {
		            this.email = input;
		          }}
		          className="form-control margin-bottom-gap"
		          placeholder="Please enter correct email address"
		        />
		        <div className="display-inline-block extra-padding-right">
		          <button
		            type="button"
		            onClick={this.invite}
		            className="action-button   margin-bottom-gap-sm "
		          >
		            Invite
		          </button>
		        </div>
		        {/*<div className="display-inline-block extra-padding-right"><button type='button'  onClick={this.inviteViaFb} className="action-button margin-bottom-gap-sm">Invite via Facebook</button></div>*/}
		        <div className="display-inline-block extra-padding-right">
		          <button
		            type="button"
		            className="action-button "
		            onClick={this.props.close}
		          >
		            Cancel
		          </button>
		        </div>
		      </div>
		    </div>
		  );
		}
	});
	exports.InvitePeople = InvitePeople;

	var UserPhoto = React.createClass({
		getInitialState: function() {
		  return {
		    userDoc: DefinitionStore.get("userDoc"),
		    projectLinks: [],
		    orgLinks: [],
		    topNav: [],
		    shouldComponentUpdate: false,
		    navLinks: DefinitionStore.getNavigationLinks(),
		    invite: "no"
		  };
		},
		componentWillUnmount: function() {
		  DefinitionStore.removeChangeListener(this._onChange, "navigationLinks");
		  DefinitionStore.removeChangeListener(this._onUserDocChange, "userDoc");
		},
		_onUserDocChange:function(){
			this.setState(
		    {
		      userDoc: DefinitionStore.getDefinition("userDoc"),
		      shouldComponentUpdate: true
		    }
		  );
		},
		_onChange: function() {
		  this.setState(
		    {
		      userDoc: DefinitionStore.getDefinition("userDoc"),
		      shouldComponentUpdate: false,
		      navLinks: DefinitionStore.getNavigationLinks()
		    },
		    this.constructNavs
		  );
		},
		shouldComponentUpdate: function(nextProps, nextState) {
		  return nextState.shouldComponentUpdate;
		  //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
		},/*
		componentWillReceiveProps: function(nextProps) {
		  this.forceUpdate();
		},*/
		profile: function(link) {
		  browserHistory.push(link);
		},
		componentDidMount: function() {
		  this.constructNavs();
		  DefinitionStore.addChangeListener(this._onChange, "navigationLinks");
		  DefinitionStore.addChangeListener(this._onUserDocChange, "userDoc");
		  updateErrorImages();
		},
		componentDidUpdate: function() {
		  updateErrorImages();
		},
		login: function() {
		  showLoginPopup();
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
		    <GenericPopUpComponent
		      alignMiddleDiv={true}
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		      sideDivId={sideDivId}
		      noSideDiv={true}
		    />,
		    node
		  );
		  ReactDOM.render(
		    <InvitePeople
		      close={function() {
		        showMainContainer();
		        document.getElementById(popUpId).parentNode.remove();
		      }}
		      node={node}
		      popUpId={popUpId}
		    />,
		    document.getElementById(contentDivId)
		  );
		},
		openResearchSpecs: function() {
		  browserHistory.push("/research/specifications");
		},
		showNewsLetterMenu:function(){
			var node = document.createElement("div");
		  node.id = global.guid();
		  var popUpId = global.guid();
		  var contentDivId = global.guid();
		  var sideDivId = global.guid();
		  node.className ="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  ReactDOM.render(<GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} />,node);
		  ReactDOM.render(<NewsLetter.NewsLetter/>,document.getElementById(contentDivId));
		},
		constructNavs: function() {
		  if (
		    this.state.navLinks &&
		    this.state.navLinks.navs &&
		    this.state.navLinks.navs.length > 0
		  ) {
		    var projectNavs = {
		      orgName: "My Projects",
		      elements: []
		    };
		    var orgNavs = {
		      orgName: "My Orgs",
		      elements: []
		    };
		    var topNav = [];
		    this.state.navLinks.navs.map(function(newNav, index) {
		      var innerTemp = {};
		      if (newNav.orgSchema == "Project" || newNav.orgSchema == "MFRProject") {
		        innerTemp = {};
		        innerTemp["displayName"] = newNav.orgName;
		        innerTemp["org"] = newNav.org;
		        innerTemp["target"] = {
		          elements: newNav.elements
		        };
		        projectNavs["type"] = "project";
		        projectNavs["elements"].push(innerTemp);
		      } else if (newNav.org != "public") {
		        innerTemp = {};
		        innerTemp["displayName"] = newNav.orgName;
		        innerTemp["org"] = newNav.org;
		        innerTemp["target"] = {
		          elements: newNav.elements
		        };
		        orgNavs["type"] = "orgNav";
		        orgNavs["elements"].push(innerTemp);
		      } else if (newNav.topNav && false) {
		        //topNav.push(newNav);////added false as this is not required now
		      } else if (newNav.org == "public" && false) {
		        if (newNav.elements && newNav.elements.length > 0) {
		          newNav.elements.map(function(nav) {
		            if (nav.topNav) {
		              var temp = nav;
		              temp["org"] = newNav.org;
		              topNav.push(temp);
		            }
		          });
		        }
		      }
		    });
		    this.setState({
		      projectLinks: projectNavs,
		      orgLinks: orgNavs,
		      shouldComponentUpdate: true
		    });
		  }
		},
		myProjects: function() {
		  var node = document.createElement("div");
		  node.id = global.guid();
		  var popUpId = global.guid();
		  var contentDivId = global.guid();
		  var sideDivId = global.guid();
		  node.className =
		    "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  ReactDOM.render(
		    <GenericPopUpComponent
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		      sideDivId={sideDivId}
		      noSideDiv={true}
		    />,
		    node
		  );
		  ReactDOM.render(
		    <NavMenu
		      links={this.state.projectLinks}
		      displayName={
		        this.state.projectLinks && this.state.projectLinks.orgName
		          ? this.state.projectLinks.orgName
		          : undefined
		      }
		      callbackToClosePopup={function(newRec) {
		        showMainContainer();
		        node.remove();
		      }}
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		    />,
		    document.getElementById(contentDivId)
		  );
		},
		adminConsole: function() {
		  var node = document.createElement("div");
		  node.id = global.guid();
		  var popUpId = global.guid();
		  var contentDivId = global.guid();
		  var sideDivId = global.guid();
		  node.className =
		    "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  ReactDOM.render(
		    <GenericPopUpComponent
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		      sideDivId={sideDivId}
		      noSideDiv={true}
		    />,
		    node
		  );
		  ReactDOM.render(
		    <AdminConsole
		      type={"topNav"}
		      displayName={"ADMIN CONSOLE"}
		      fromNewNav={true}
		      callbackToClosePopup={function(newRec) {
		        showMainContainer();
		        node.remove();
		      }}
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		    />,
		    document.getElementById(contentDivId)
		  );
		},
		render: function() {
		  var self = this;
		  var photoUrl = "/branding/loggedIn.png";
		  if (
		    self.state.userDoc == undefined ||
		    self.state.userDoc.recordId == undefined
		  ) {
		    return (
		      <div
		        key={global.guid()}
		        id="userPhoto"
		        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component"
		      >
		        <div
		          id="loginButton"
		          className="search  child-img-component  extra-margin-top pull-right no-padding-right"
		        >
		          <div className="text-center link">
		            <i
		              style={{ fontSize: "24px", position: "relative", top: "-8px" }}
		              alt="login"
		              onClick={this.login}
		              className="icons8-user"
		            />
		          </div>
		          {/*}<img alt="login" src="/branding/login.png" onClick={this.login} className="profilePhoto "/>*/}
		          <h6
		            onClick={this.login}
		            className="hidden text-center text-uppercase pointer"
		          >
		            Sign In
		          </h6>
		        </div>
		        <UserNewNav
		          navLinks={this.state.navLinks}
		          topNav={this.state.topNav}
		        />
		      </div>
		    );
		  }


		  var adminNav = "";
		  if (typeof this.state.navLinks != "undefined" &&
		    this.state.navLinks.cloudPoint != "" &&
		    this.state.navLinks.cloudPointAdmin) {
		    setAdmin();
		    adminNav = (
		      <li className="navElement">
		        <a className="link" onClick={this.adminConsole}>
		          ADMIN CONSOLE
		        </a>
		      </li>
		    );
		  } else {
		    adminNav = <li className="navElement hidden" />;
		  }

		  var showUploadLink = false;
		  var publicRoles = getUserRolesOnOrg("public");
		  if ((Array.isArray(publicRoles) && publicRoles.indexOf("RoleContentEditor") > -1) ||isAdmin()) {
		    showUploadLink = true;
		  }
			var showSuggestMfrLink = false;
			if ((Array.isArray(publicRoles) && publicRoles.indexOf("RoleForInteriorDesigner") > -1 && publicRoles.indexOf("RoleForArchitect") > -1) ||isAdmin()) {
		    showSuggestMfrLink = true;
		  }


		  var showNewsLetterLink = false;
		  var publicRoles = getUserRolesOnOrg("public");
		  if ((Array.isArray(publicRoles) && publicRoles.indexOf("RoleForNewsLetter") > -1) ||isAdmin()) {
		    showNewsLetterLink = true;
		  }

		  if (self.state.userDoc.image && Array.isArray(self.state.userDoc.image)) {
		    if (
		      self.state.userDoc.image[0] &&
		      self.state.userDoc.image[0].cloudinaryId &&
		      self.state.userDoc.image[0].cloudinaryId != ""
		    ) {
		      if (self.state.userDoc.image[0].cloudinaryId.indexOf("http") == 0) {
		        photoUrl = self.state.userDoc.image[0].cloudinaryId;
		      } else {
		        photoUrl =
		          "//res.cloudinary.com/dzd0mlvkl/image/upload/v1423542814/" +
		          self.state.userDoc.image[0].cloudinaryId +
		          ".jpg";
		      }
		    } else if (
		      self.state.userDoc.image[0] &&
		      self.state.userDoc.image[0].facebook
		    ) {
		      photoUrl =
		        "//res.cloudinary.com/dzd0mlvkl/image/facebook/" +
		        self.state.userDoc.image[0].facebook +
		        ".jpg";
		    } else if (
		      self.state.userDoc.image[0] &&
		      self.state.userDoc.image[0].google
		    ) {
		      photoUrl =
		        "//res.cloudinary.com/dzd0mlvkl/image/gplus/" +
		        self.state.userDoc.image[0].google +
		        ".jpg";
		    }
		  }

		  var invite = "hidden";
		  if (configDetails.invitePerson && configDetails.invitePerson == "yes") {
		    invite = "invite";
		  }

		  var profileLinks = [];

		  if (
		    self.state.userDoc.profileLinks &&
		    Array.isArray(self.state.userDoc.profileLinks) &&
		    self.state.userDoc.profileLinks.length > 0
		  ) {
		    profileLinks = self.state.userDoc.profileLinks.map(function(link) {
		      return (
		        <li key={global.guid()} className="navElement">
		          <a
		            className="link"
		            key={global.guid()}
		            onClick={self.profile.bind(null, link.url)}
		          >
		            {link.navLink}
		          </a>
		        </li>
		      );
		    });
		  }

		  if (
		    configDetails.handleBarTemplate &&
		    configDetails.handleBarTemplate == "jsm"
		  ) {
		    return (
		      <div
		        key={global.guid()}
		        id="userPhoto"
		        className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding parent-img-component"
		      >
		        <ul
		          style={{ paddingTop: "2px" }}
		          className="pull-right list-unstyled child-img-component no-padding-right extra-margin-top-xs extra-margin-bottom "
		        >
		          <li className="userNavHover" style={{ position: "relative" }}>
		            <div
		              id="userImage"
		              className=""
		              data-toggle=""
		              aria-expanded="false"
		            >
		              <div
		                className="child-img-component no-padding"
		                style={{ verticalAlign: "middle" }}
		                title={
		                  self.state.userDoc.givenName +
		                  "" +
		                  (self.state.userDoc.mname
		                    ? self.state.userDoc.mname
		                    : " ") +
		                  "" +
		                  (self.state.userDoc.familyName
		                    ? self.state.userDoc.familyName
		                    : "")
		                }
		              >
		                <img
		                  className="img-circle userPhoto img-holder profilePhoto"
		                  src={photoUrl}
		                />
		              </div>
		              <div
		                style={{ lineHeight: "51px" }}
		                className="parent-img-component hidden"
		              >
		                <a className="dropdown-toggle" aria-expanded="false" />
		                <a style={{ whiteSpace: "nowrap" }}>
		                  <span
		                    style={{ paddingTop: "5px", fontSize: "12px" }}
		                    className="no-margin pointer"
		                  >
		                    {self.state.userDoc.givenName +
		                      "" +
		                      (self.state.userDoc.mname
		                        ? self.state.userDoc.mname
		                        : " ") +
		                      "" +
		                      (self.state.userDoc.familyName
		                        ? self.state.userDoc.familyName
		                        : "")}
		                  </span>
		                </a>
		              </div>
		            </div>
		            <ul
		              style={{
		                right: "-15px",
		                minWidth: "50%",
		                left: "auto",
		                marginTop: "20%"
		              }}
		              className="dropdown-menu arrow_box"
		              id="userSubNav"
		            >
		              {profileLinks}
		              <li className="navElement">
		                <a
		                  className="link"
		                  onClick={this.profile.bind(
		                    null,
		                    linkGenerator.getDetailLink({
		                      record: self.state.userDoc,
		                      org: "public",
		                      schema: "User",
		                      recordId: self.state.userDoc.recordId
		                    })
		                  )}
		                >
		                  PROFILE
		                </a>
		              </li>
		              {adminNav}
		              <li className="navElement">
		                <Link to="/myfirms">MY FIRMS</Link>
		              </li>
		              {showUploadLink?
		               <li className="navElement">
		                <Link to="/sitemapUploader">SITE MAP UPLOADER</Link>
		              </li>:""}
		              {showUploadLink?
		               <li className="navElement">
		                <Link to="/requirementsUploader">BUILDER REQUIREMENTS</Link>
		              </li>:""}
                  {showUploadLink?
                    <li className="navElement">
                      <Link to="/mfrReports">MFR REPORTS</Link>
                  </li>:""}
									{showSuggestMfrLink?
										<li className="navElement">
			                <a
			                  className="link"
			                  onClick={this.profile.bind(
			                    null,
			                    linkGenerator.getCOELink({
			                      org: "public",
			                      schema: "Manufacturer",
														coeData:{
															knownData:{"$status":"suggested"}
														}
			                    })
			                  )}
			                >
			                  SUGGEST MFR
			                </a>
			              </li>:""}
		              {showNewsLetterLink?
		               <li className="navElement">
		                <a className="link"
		                  onClick={this.showNewsLetterMenu}>
		                  NEWS LETTERS
		                </a>
		              </li>:""}
		              <li className="navElement hidden">
		                <Link to="/templates">TEMPLATES</Link>
		              </li>
		              <li className="navElement">
		                <a className={"link"} onClick={this.invite}>
		                  INVITE
		                </a>
		              </li>
		              {/*<li className="navElement">
		                                    	<a  className="link" onClick={this.openResearchSpecs}>RESEARCH SPECS</a>
		                                   </li>*/}
		              <li className="navElement">
		                <a id="logoutButton" className="link" onClick={logout}>
		                  LOGOUT
		                </a>
		              </li>
		            </ul>
		          </li>
		        </ul>
		        <ul className="list-unstyled pull-right child-img-component extra-margin-top-xs extra-margin-bottom ">
		          <li
		            style={{ position: "relative" }}
		            onClick={function() {
		              showChat();
		            }}
		          >
		            <span
		              className="icons8-notification pointer"
		              style={{ fontSize: "26px" }}
		            />
		            {typeof UserDoc != "undefined" && UserDoc.recordId ? (
		              <Chat.NotificationsCount
		                userId={UserDoc.recordId}
		                wrap={true}
		              />
		            ) : (
		              ""
		            )}
		          </li>
		        </ul>
		        <UserNewNav
		          navLinks={this.state.navLinks}
		          topNav={this.state.topNav}
		          project={
		            self.state.projectLinks &&
		            self.state.projectLinks.elements &&
		            self.state.projectLinks.elements.length > 0
		              ? true
		              : false
		          }
		          projectCallback={self.myProjects}
		        />
		      </div>
		    );
		  } else if (
		    configDetails.handleBarTemplate &&
		    configDetails.handleBarTemplate == "wevaha"
		  ) {
		    return (
		      <div
		        key={global.guid()}
		        id="userPhoto"
		        className="search col-lg-2 col-md-2 col-sm-2 col-xs-3"
		      >
		        <ul className="nav navbar-nav">
		          <li className="dropdown">
		            <div
		              id="userImage"
		              className="parent-img-component  extra-padding dropdown-toggle"
		              data-toggle="dropdown"
		              aria-expanded="false"
		            >
		              <div
		                className="child-img-component"
		                style={{ height: "51px", verticalAlign: "middle" }}
		              >
		                <img
		                  className="img-circle userPhoto  img-holder profilePhoto"
		                  src={photoUrl}
		                />
		              </div>
		              <div
		                style={{ lineHeight: "51px" }}
		                className="parent-img-component"
		              >
		                <a
		                  data-toggle="dropdown"
		                  className="dropdown-toggle"
		                  aria-expanded="false"
		                />
		                <a style={{ whiteSpace: "nowrap" }}>
		                  <span
		                    className="no-margin pointer"
		                    style={{ paddingTop: "5px", fontSize: "12px" }}
		                  >
		                    {self.state.userDoc.givenName +
		                      "  " +
		                      (self.state.userDoc.mname
		                        ? self.state.userDoc.mname
		                        : " ") +
		                      " " +
		                      (self.state.userDoc.familyName
		                        ? self.state.userDoc.familyName
		                        : "")}
		                  </span>
		                </a>
		              </div>
		            </div>
		            <ul
		              className="dropdown-menu col-lg-12 col-md-12 col-xs-12 col-sm-12"
		              id="userSubNav"
		            >
		              <li className="navElement">
		                <a className={"link " + invite}>INVITE</a>
		              </li>
		              <li className="navElement">
		                <Link
		                  to={linkGenerator.getDetailLink({
		                    record: self.state.userDoc,
		                    org: "public",
		                    schema: "User",
		                    recordId: self.state.userDoc.recordId
		                  })}
		                  className="link"
		                >
		                  PROFILE
		                </Link>
		              </li>
		              <li className="navElement">
		                <a onClick={logout} className="link">
		                  LOGOUT
		                </a>
		              </li>
		              {configDetails.newLoginWorkFlow ? (
		                <li
		                  className="navElement"
		                  onClick={workflow.workFlow.bind(
		                    null,
		                    configDetails.newLoginWorkFlow
		                  )}
		                >
		                  <a className="link">JOIN AN ORG</a>
		                </li>
		              ) : (
		                ""
		              )}
		            </ul>
		          </li>
		        </ul>
		      </div>
		    );
		  } else {
		    return (
		      <div
		        key={global.guid()}
		        id="userPhoto"
		        className="search col-lg-2 col-md-2 col-sm-2 col-xs-3"
		      >
		        <ul className="text-right list-unstyled no-padding-left wrapper">
		          <li className="dropdown">
		            <figure>
		              <img
		                className="pull-right img-circle userPhoto img-holder personalPicture"
		                src={photoUrl}
		              />
		              <figcaption>
		                <Link
		                  className="login-user"
		                  to={linkGenerator.getDetailLink({
		                    record: self.state.userDoc,
		                    org: "public",
		                    schema: "User",
		                    recordId: self.state.userDoc.recordId
		                  })}
		                >
		                  {self.state.userDoc.givenName +
		                    "  " +
		                    (self.state.userDoc.mname
		                      ? self.state.userDoc.mname
		                      : " ") +
		                    " " +
		                    (UserDoc.familyName ? UserDoc.familyName : "")}
		                </Link>
		              </figcaption>
		            </figure>
		          </li>
		        </ul>
		      </div>
		    );
		  }
		}
	});
	exports.UserPhoto = UserPhoto;
	/**
	 *search
	 * navs
	 */
	var UserNewNav = React.createClass({
		getInitialState: function() {
		  return { search: false };
		},
		searchIcon: function() {
		  var self = this;
		  this.setState({ search: true }, function() {
		    if (self.searchText) $(self.searchText).focus();
		  });
		},
		closeSearch: function() {
		  this.setState({ search: false });
		},
		goNav: function(nav) {
		  if (nav.target) {
		    if (nav.target.elements && nav.target.elements.length > 0) {
		      var node = document.createElement("div");
		      node.id = global.guid();
		      var popUpId = global.guid();
		      var contentDivId = global.guid();
		      var sideDivId = global.guid();
		      node.className =
		        "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		      document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		      ReactDOM.render(
		        <GenericPopUpComponent
		          popUpId={popUpId}
		          contentDivId={contentDivId}
		          sideDivId={sideDivId}
		          noSideDiv={true}
		        />,
		        node
		      );
		      ReactDOM.render(
		        <NavMenu
		          links={nav.target}
		          displayName={nav.displayName}
		          callbackToClosePopup={function(newRec) {
		            showMainContainer();
		            node.remove();
		          }}
		          popUpId={popUpId}
		          contentDivId={contentDivId}
		        />,
		        document.getElementById(contentDivId)
		      );
		    } else {
		      var url = genericNav.getSubNavUrl(nav, nav.org);
		      browserHistory.push(url);
		    }
		  }
		},
		render: function() {
		  var self = this;
		  if (this.state.search) {
		    return (
		      <search.SearchComponent
		        desktop={true}
		        closeSearch={this.closeSearch}
		        navLinks={this.props.navLinks}
		      />
		    );
		  } else {
		    return (
		      <div
		        key={global.guid()}
		        className="child-img-component search "
		        style={{ marginTop: "10px" }}
		      >
		        {/*<div className="display-inline-block vertical-align-top pull-right" style={{"paddingRight": "15px","position":"relative","top": "-4px"}}>
								<span className="icons8-search link" style={{"fontSize":"20px"}} onClick={self.searchIcon}></span>
							</div>*/}
		        <search.SearchComponent
		          desktop={true}
		          closeSearch={this.closeSearch}
		          navLinks={this.props.navLinks}
		        />
		        {UserDoc && UserDoc.recordId ? (
		          <div
		            key={global.guid()}
		            className=" display-inline-block pull-right"
		            style={{ paddingRight: "15px", paddingTop: "5px" }}
		          >
		            <span
		              className="link "
		              style={{ fontSize: "14px", fontWeight: "600" }}
		            >
		              <Link to="/myprojects">My Projects</Link>
		            </span>
		          </div>
		        ) : (
		          ""
		        )}
		        {["a"].map(function(temp) {
		          if (self.props.topNav && self.props.topNav.length > 0) {
		            return self.props.topNav.map(function(nav) {
		              return (
		                <div
		                  key={global.guid()}
		                  className=" display-inline-block pull-right"
		                  style={{ paddingRight: "15px" }}
		                >
		                  <span
		                    className="link text-capitalize"
		                    style={{ fontSize: "14px", fontWeight: "600" }}
		                    onClick={self.goNav.bind(null, nav)}
		                  >
		                    {nav.displayName.toLowerCase()}
		                  </span>
		                </div>
		              );
		            });
		          } else {
		            return <div key={global.guid()} className="hidden" />;
		          }
		        })}
		      </div>
		    );
		  }
		}
	});
	/**
	 * links
	 * displayName
	 */
	var NavMenu1 = React.createClass({
		goToPage: function(innerLink, nav) {
		  var url = genericNav.getSubNavUrl(innerLink, nav.org);
		  browserHistory.push(url);
		  if (typeof this.props.callbackToClosePopup == "function") {
		    this.props.callbackToClosePopup();
		  }
		},
		render: function() {
		  if (
		    this.props.links &&
		    this.props.links.elements &&
		    this.props.links.elements.length > 0
		  ) {
		    var self = this;
		    return (
		      <div
		        key={global.guid()}
		        className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
		      >
		        <h4
		          className={
		            "text-center " + (this.props.displayName ? "" : "hidden")
		          }
		        >
		          {this.props.displayName ? this.props.displayName : ""}
		        </h4>
		        {this.props.links.elements.map(function(link) {
		          return (
		            <div
		              key={global.guid()}
		              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding menuNav"
		            >
		              <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding menuNavHeading">
		                <div className="link">{link.displayName.toUpperCase()}</div>
		              </div>
		              <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding menuNavContent">
		                {["a"].map(function(temp) {
		                  if (
		                    link.target &&
		                    link.target.elements &&
		                    link.target.elements.length > 0
		                  ) {
		                    return link.target.elements.map(function(innerLink) {
		                      return (
		                        <div
		                          key={global.guid()}
		                          className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding innerMenuNavContent"
		                        >
		                          <div
		                            className="link"
		                            onClick={self.goToPage.bind(
		                              null,
		                              innerLink,
		                              link
		                            )}
		                          >
		                            {innerLink.displayName.toUpperCase()}
		                          </div>
		                        </div>
		                      );
		                    });
		                  } else {
		                    return <div key={global.guid()} className="hidden" />;
		                  }
		                })}
		              </div>
		            </div>
		          );
		        })}
		      </div>
		    );
		  } else {
		    return <div key={global.guid()} className="hidden" />;
		  }
		}
	});
	exports.NavMenu1 = NavMenu1;

	var NavMenu = React.createClass({
		goToPage: function(innerLink, nav) {
		  var url = genericNav.getSubNavUrl(innerLink, nav.org);
		  browserHistory.push(url);
		  if (typeof this.props.callbackToClosePopup == "function") {
		    this.componentWillUnmount();
		    this.props.callbackToClosePopup();
		  }
		},
		componentDidMount: function() {
		  if (
		    typeof navigator != "undefined" &&
		    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		      navigator.userAgent
		    )
		  ) {
		    $(".navbar-toogle").removeClass("hidden");
		  } else {
		    //do nothing
		  }
		},
		componentWillUnmount: function() {
		  if (
		    typeof navigator != "undefined" &&
		    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		      navigator.userAgent
		    )
		  ) {
		    $(".navbar-toogle").addClass("hidden");
		  } else {
		    //do nothing
		  }
		},
		goToContent: function(index) {
		  if (
		    this.props.links &&
		    this.props.links.elements &&
		    this.props.links.elements.length > 0
		  ) {
		    var count = this.props.links.elements.length;
		    if (this["menuMainNav"] && this["menuMainContent"]) {
		      if (this.menuMainNav.className.indexOf("col-lg-12") != -1) {
		        this.menuMainNav.className =
		          "col-lg-6 col-sm-6 col-md-6 col-xs-12  paddingMenu  menuNav ";
		      }
		      if (this.menuMainNav.className.indexOf("borderRight") == -1) {
		        this.menuMainNav.className =
		          "col-lg-6 col-sm-6 col-md-6 col-xs-12  paddingMenu  menuNav borderRight";
		      }
		      if (this.menuMainContent.className.indexOf("hidden") != -1) {
		        this["menuMainContent"].className = this[
		          "menuMainContent"
		        ].className.replace(/hidden/g, "");
		      }
		      for (var i = 0; i < count; i++) {
		        if (this["menuNav" + i] && this["menuContent" + i]) {
		          if (i != index) {
		            this["menuNav" + i].className = this[
		              "menuNav" + i
		            ].className.replace("activated", "");
		            //this["menuContent"+i].className+=" hidden";
		            this["menuContent" + i].style.display = "none";
		            this["menuContent" + i].className = this[
		              "menuContent" + i
		            ].className.replace(/animatedSlide/g, "");
		          } else {
		            this["menuNav" + i].className += " activated";
		            //	this["menuContent"+i].className=this["menuContent"+i].className.replace(/hidden/g,"")+" animatedSlide";
		            var effect = "slide";
		            // Set the options for the effect type chosen
		            var options = { direction: "left" };

		            // Set the duration (default: 400 milliseconds)
		            var duration = 400;

		            $(this["menuContent" + i]).toggle(effect, options, duration);
		          }
		        }
		      }
		    }
		  }
		},
		goToContentMobile: function(index) {
		  if (
		    this.props.links &&
		    this.props.links.elements &&
		    this.props.links.elements.length > 0
		  ) {
		    if (this["menuMainNav"] && this["menuContent" + index]) {
		      this["menuMainNav"].className += " hidden";
		      this["menuContent" + index].className = this[
		        "menuContent" + index
		      ].className.replace(/hidden/g, "");
		    }
		  }
		},
		back: function(index) {
		  if (
		    this.props.links &&
		    this.props.links.elements &&
		    this.props.links.elements.length > 0
		  ) {
		    if (this["menuMainNav"] && this["menuContent" + index]) {
		      this["menuContent" + index].className += " hidden";
		      this["menuMainNav"].className = this["menuMainNav"].className.replace(
		        /hidden/g,
		        ""
		      );
		    }
		  }
		},
		render: function() {
		  if (
		    this.props.links &&
		    this.props.links.elements &&
		    this.props.links.elements.length > 0
		  ) {
		    var self = this;
		    if (
		      typeof navigator != "undefined" &&
		      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		        navigator.userAgent
		      )
		    ) {
		      return (
		        <div
		          key={global.guid()}
		          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
		        >
		          <h4
		            className={
		              "text-center " + (this.props.displayName ? "" : "hidden")
		            }
		          >
		            {this.props.displayName ? this.props.displayName : ""}
		          </h4>

		          <div
		            className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding menuNav paddingMenu text-center"
		            ref={d => {
		              self["menuMainNav"] = d;
		            }}
		          >
		            {this.props.links.elements.map(function(link, index) {
		              return (
		                <div
		                  key={global.guid()}
		                  className="link"
		                  ref={d => {
		                    self["menuNav" + index] = d;
		                  }}
		                  style={{}}
		                  onClick={self.goToContentMobile.bind(null, index)}
		                >
		                  <span>{link.displayName.toUpperCase()}</span>
		                </div>
		              );
		            })}
		          </div>
		          {this.props.links.elements.map(function(link, index) {
		            return (
		              <div
		                key={global.guid()}
		                className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding menuContent text-center hidden"
		                ref={d => {
		                  self["menuContent" + index] = d;
		                }}
		              >
		                <h5
		                  className={"text-center link "}
		                  onClick={self.back.bind(null, index)}
		                >
		                  {"BACK"}
		                </h5>
		                {link.target.elements.map(function(innerLink) {
		                  return (
		                    <div
		                      key={global.guid()}
		                      className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding innerMenuNavContent"
		                    >
		                      <div
		                        className="link"
		                        onClick={self.goToPage.bind(null, innerLink, link)}
		                      >
		                        <span>{innerLink.displayName.toUpperCase()}</span>
		                      </div>
		                    </div>
		                  );
		                })}
		              </div>
		            );
		          })}
		        </div>
		      );
		    } else {
		      return (
		        <div
		          key={global.guid()}
		          className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding "
		        >
		          <h4
		            style={{
		              position: "fixed",
		              top: "3.2vw",
		              left: "42%",
		              margin: "0"
		            }}
		            className={
		              "text-center margin-bottom-gap " +
		              (this.props.displayName ? "" : "hidden")
		            }
		          >
		            {this.props.displayName ? this.props.displayName : ""}
		          </h4>
		          <div
		            className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"
		            style={{ marginTop: "5vw" }}
		          >
		            <div
		              className="col-lg-12 col-md-12 col-sm-12 col-xs-12 menuNav paddingMenu"
		              ref={d => {
		                self["menuMainNav"] = d;
		              }}
		            >
		              {this.props.links.elements.map(function(link, index) {
		                return (
		                  <div
		                    key={global.guid()}
		                    className="link"
		                    ref={d => {
		                      self["menuNav" + index] = d;
		                    }}
		                    style={{}}
		                    onClick={self.goToContent.bind(null, index)}
		                  >
		                    <span>{link.displayName.toUpperCase()}</span>
		                  </div>
		                );
		              })}
		            </div>
		            <div
		              className="col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding menuMainContent"
		              ref={d => {
		                self["menuMainContent"] = d;
		              }}
		            >
		              {this.props.links.elements.map(function(link, index) {
		                return (
		                  <div
		                    key={global.guid()}
		                    className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding menuContent"
		                    style={{ display: "none" }}
		                    ref={d => {
		                      self["menuContent" + index] = d;
		                    }}
		                  >
		                    {link.target.elements.map(function(innerLink) {
		                      return (
		                        <div
		                          key={global.guid()}
		                          className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding innerMenuNavContent"
		                        >
		                          <div
		                            className="link"
		                            onClick={self.goToPage.bind(
		                              null,
		                              innerLink,
		                              link
		                            )}
		                          >
		                            <span>{innerLink.displayName.toUpperCase()}</span>
		                          </div>
		                        </div>
		                      );
		                    })}
		                  </div>
		                );
		              })}
		            </div>
		          </div>
		        </div>
		      );
		    }
		  } else {
		    return <div className="hidden" />;
		  }
		}
	});
	exports.NavMenu = NavMenu;

	function logout() {
		WebUtils.logout(function(res){
			location.href="/";
		});
		/*UserProfile = {};
		UserInfo = {};
		if (loggedInVia == "facebook") {
		  FB.logout(function(response) {});
		} else if (loggedInVia == "google") {
		  gapi.auth.signOut();
		}
		location.href = "/logout";*/
	}
	exports.logout = logout;
	function changeNavColor(id) {
		setTimeout(function() {
		  document.getElementsByClassName(
		    "explorePicturesSelection"
		  ).className = document
		    .getElementsByClassName("org")
		    .className.replace(/\bexplorePicturesSelectionCurrent\b/, "");
		  //	var node = document.getElementById().parentNode;
		  var x = getParents(document.getElementById(id));
		  function getParents(el) {
		    var parents = [];
		    var p = el.parentNode;
		    while (p !== null) {
		      var o = p;
		      parents.push(o);
		      p = o.parentNode;
		    }
		    return parents;
		  }
		  if (!x.nextSibling.className.indexOf(" in ")) {
		    document.getElementById(id).className = document
		      .getElementById(id)
		      .className.replace(/\bexplorePicturesSelectionCurrent\b/, "");
		  } else {
		    document.getElementById(id).className = document.getElementById(
		      id
		    ).className +=
		      "explorePicturesSelectionCurrent";
		  }
		}, 500);
	}
	exports.changeNavColor = changeNavColor;

	var UserIcon = React.createClass({
		getInitialState: function() {
		  return {
		    record: this.props.record
		      ? this.props.record
		      : RecordDetailStore.getSchemaRecord({
		          schema: this.props.rootSchema,
		          recordId: this.props.id,
		          userId: getUserDoc().recordId,
		          org: this.props.org
		        }),
		    shouldComponentUpdate: false
		  };
		},
		_onChange: function() {
		  //if(this.isMounted()){
		  if (this.state.record == undefined) {
		    this.setState({
		      shouldComponentUpdate: true,
		      record: RecordDetailStore.getSchemaRecord({
		        schema: this.props.rootSchema,
		        recordId: this.props.id,
		        userId: getUserDoc().recordId,
		        org: this.props.org
		      })
		    });
		  }
		  //	}
		},
		shouldComponentUpdate: function(nextProps, nextState) {
		  return nextState.shouldComponentUpdate;
		},
		goToUserPage: function() {
		  if (!this.props.noDetail) {
		    //clearMainContent(); clearLeftContent();
		    browserHistory.push(
		      linkGenerator.getDetailLink({
		        record: this.state.record ? this.state.record.value : {},
		        org: "public",
		        schema: "User",
		        recordId: this.props.id
		      })
		    );
		    //router.routTheApp();
		  }
		},
		componentWillUnmount: function() {
		  RecordDetailStore.removeChangeListener(this._onChange, this.props.id);
		},
		componentDidMount: function() {
		  var prod = [];
		  var self = this;
		  var flag = false;
		  if (this.state.record == undefined) {
		    flag = true;
		  } else if (
		    typeof this.state.record.value == "object" &&
		    Object.keys(this.state.record.value).length == 0
		  ) {
		    flag = true;
		  }
		  if (flag) {
		    ActionCreator.getSchemaRecord({
		      schema: this.props.rootSchema,
		      dependentSchema: this.props.dependentSchema,
		      recordId: this.props.id,
		      userId: getUserDoc().recordId,
		      org: self.props.org ? self.props.org : "public"
		    });
		    RecordDetailStore.addChangeListener(this._onChange, this.props.id);
		  }
		  updateErrorImages();
		},
		componentDidUpdate: function() {
		  updateErrorImages();
		},
		viewRecord: function() {
		  if (
		    typeof this.props.fromRelation == "undefined" ||
		    this.props.fromRelation == "search"
		  ) {
		    if (!this.props.noDetail) {
		      //		var schema=this.props.schema;
		      var org = this.props.org;
		      var recordId = this.props.id;
		      var rootSchema = this.props.rootSchema;
		      browserHistory.push(
		        linkGenerator.getDetailLink({
		          record: this.state.record ? this.state.record.value : {},
		          org: org,
		          schema: rootSchema,
		          recordId: recordId,
		          dependentSchema: this.props.dependentSchema
		        })
		      );
		    }
		  }
		},
		render: function() {
		  var self = this;
		  var schemaRec = SchemaStore.get(this.props.rootSchema);

		  if (!this.state.record) {
		    return <div />;
		  }
		  if (self.props.filter && self.props.filter == "filter") {
		    var value = self.state.record.value[self.props.identifier]
		      ? self.state.record.value[self.props.identifier]
		      : "";
		    return (
		      <div>
		        <span>{value}</span>
		      </div>
		    );
		  } else if (this.props.rootSchema && this.props.rootSchema == "User") {
		    var user = self.state.record.value;
		    if (typeof user == "undefined") {
		      return <div className="display-inline-block" />;
		    }
		    var img =
		      "//res.cloudinary.com/dzd0mlvkl/image//upload/h_150,w_150/v1426847732/default-user.jpg";
		    if (user.image && user.image[0]) {
		      if (user.image[0].cloudinaryId && user.image[0].cloudinaryId != "") {
		        if (user.image[0].cloudinaryId.indexOf("http") != -1) {
		          img = user.image[0].cloudinaryId;
		        } else {
		          img =
		            "//res.cloudinary.com/dzd0mlvkl/image/upload/h_150,w_150/v1441279368/" +
		            user.image[0].cloudinaryId +
		            ".jpg";
		        }
		      } else {
		        if (user.image[0].facebook) {
		          img =
		            "//res.cloudinary.com/dzd0mlvkl/image/facebook/h_150,w_150/" +
		            user.image[0].facebook +
		            ".jpg";
		        } else if (user.image[0].google) {
		          img =
		            "//res.cloudinary.com/dzd0mlvkl/image/gplus/h_150,w_150/" +
		            user.image[0].google +
		            ".jpg";
		        }
		      }
		    }

		    if (self.props.topToDown) {
		      return (
		        <div className="display-inline-block">
		          <figure key={global.guid()}>
		            <img src={img} className=" img-circle   profilePhoto" />
		            <figcaption
		              className="text-center name"
		              onClick={self.goToUserPage}
		            >
		              <span className="userName">{user.givenName}</span>
		            </figcaption>
		          </figure>
		        </div>
		      );
		    } else if (self.props.onlyImage) {
		      return (
		        <div className="display-inline-block">
		          <img
		            src={img}
		            className=" img-circle   profilePhoto"
		            onClick={self.goToUserPage}
		          />
		        </div>
		      );
		    } else if (self.props.onlyName) {
		      return (
		        <div className="display-inline-block">
		          <span className="userName" onClick={self.goToUserPage}>
		            {user.givenName + " " + (user.familyName ? user.familyName : "")}
		          </span>
		        </div>
		      );
		    } else {
		      return (
		        <div className="display-inline-block">
		          <div
		            className={
		              "parent-img-component userIcon-height " +
		              (this.props.formGroup ? "" : "form-group")
		            }
		          >
		            <div className="child-img-component">
		              <img
		                src={img}
		                className=" img-circle profilePhoto pull-left img-holder"
		              />
		            </div>
		            <div className="link child-img-component text-wrap">
		              <span className="userName" onClick={self.goToUserPage}>
		                {user.givenName +
		                  " " +
		                  (user.familyName ? user.familyName : "")}
		              </span>
		            </div>
		          </div>
		        </div>
		      );
		    }
		  } else {
		    var viewName = "";
		    try {
		      if (
		        !self.props.viewName &&
		        typeof schemaRec["@operations"]["read"]["quickView"] != "undefined"
		      ) {
		        viewName = "quickView";
		      } else {
		        if (
		          typeof schemaRec["@operations"]["read"][self.props.viewName] !=
		          "undefined"
		        ) {
		          viewName = self.props.viewName;
		        } else {
		          if (
		            typeof schemaRec["@operations"]["read"]["quickView"] !=
		            "undefined"
		          ) {
		            viewName = "quickView";
		          } else {
		            viewName = genericView.getDefaultSummaryView(
		              undefined,
		              schemaRec
		            );
		          }
		        }
		      }
		    } catch (err) {}
		    var userIcon = "userIcon";
		    var flag = false;
		    if (self.props.fromRelation == "search") {
		      flag = true;
		      if (typeof self.props.fromExplore != "undefined") {
		        for (
		          var i = 0;
		          i < Object.keys(schemaRec["@operations"]["read"]).length;
		          i++
		        ) {
		          var readView = Object.keys(schemaRec["@operations"]["read"])[i];
		          if (
		            schemaRec["@operations"]["read"][readView] &&
		            schemaRec["@operations"]["read"][readView].UILayout.viewType &&
		            schemaRec["@operations"]["read"][readView].UILayout.viewType ==
		              "discover"
		          ) {
		            viewName = readView;
		            flag = false;
		            break;
		          }
		        }
		      }
		      userIcon = undefined;
		    }
		    if (flag) {
		      viewName = genericView.getDefaultSummaryView(undefined, schemaRec);
		    }
		    if (self.props.showAs == "full") {
		      userIcon = undefined;
		    }
		    var header;
		    if (this.props.heading && this.props.rootRecord) {
		      header = (
		        <h2 className="h2">
		          {global.makeHeader(
		            Object.assign(this.props.rootRecord, {
		              key: this.state.record.value
		            }),
		            this.props.heading
		          )}
		        </h2>
		      );
		    } else if (this.props.header) {
		      header = this.props.header;
		    }
		    /*		var orgData={};
				try{
				orgData = {
						"orgName" : self.state.record.value ? self.state.record.value.name : self.state.record.name,
						"orgLocation" : "",
						"orgImage" : self.state.record.value ? self.state.record.value.profileImage ? "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1623462816/"+self.state.record.value.profileImage[0].cloudinaryId+".jpg"  : (self.state.record.profileImage ? "//res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1623462816/"+self.state.record.profileImage[0].cloudinaryId+".jpg" :"") : ""
				};
				}catch(err){
					orgData={};
				}*/
		    return (
		      <genericView.GoIntoDetail
		        hideInlineEdit={true}
		        summary={true}
		        fromExplore={self.props.fromExplore}
		        noGallery={self.props.noGallery}
		        userIcon={userIcon}
		        noDetail={self.props.noDetail}
		        displayName={"no"}
		        viewName={viewName}
		        showingForRelatedViewOfRecordId={
		          self.props.showingForRelatedViewOfRecordId
		        }
		        key={global.guid()}
		        parentLayout={self.props.parentLayout}
		        rootSchema={self.props.rootSchema}
		        record={self.state.record}
		        recordId={this.props.id}
		        schemaDoc={schemaRec}
		        org={self.props.org}
		        header={header}
		        chat={true}
		      />
		    );
		  }
		}
	});

	exports.UserIcon = UserIcon;

	function mobileSearch() {
		if ($(".lookUpDialogBox").length == 1) {
		  document.getElementById("topNav").className = document
		    .getElementById("topNav")
		    .className.replace("hidden", "");
		}
		document.getElementById("srcSearch").src = document
		  .getElementById("srcSearch")
		  .src.replace("/branding/Search3.svg", "/branding/Search2.svg");
		if (document.getElementById("bottomMore")) {
		  document.getElementById("bottomMore").className = document
		    .getElementById("bottomMore")
		    .className.replace("pointer-events", "");
		}
		//document.getElementById("bottomFilter").className=document.getElementById("bottomFilter").className.replace("pointer-events","");
		//document.getElementById("bottomHome").className=document.getElementById("bottomHome").className.replace("pointer-events","");
	}
	exports.mobileSearch = mobileSearch;

	var BottomNavComponent = React.createClass({
		componentDidMount: function() {
		  var self = this;
		  /*var textRight="";
			if(getConfigDetails() && getConfigDetails().handleBarTemplate && (getConfigDetails().handleBarTemplate=="jsm" || getConfigDetails().handleBarTemplate=="wevaha")){
				textRight="jsm";
			}else{
				textRight="text-right";
			}*/
		  if (self.props.bottomFilterClick == "yes") {
		    document.getElementById(
		      "bottomFilter"
		    ).className = document
		      .getElementById("bottomFilter")
		      .className.replace("pointer-events", "");
		  }
		  if (UserDoc && UserDoc.recordId) {
		    document.getElementById("bottomMore").className = document
		      .getElementById("bottomMore")
		      .className.replace("pointer-events", "");
		    document.getElementById("more").src = document
		      .getElementById("more")
		      .src.replace("/branding/More1.png", "/branding/More2.png");
		  }
		},
		closePopUp: function() {
		  showMainContainer();
		  $(".lookUpDialogBox").remove();
		  showToggleBar();
		},
		clickClose: function() {
		  document.getElementById("filter").src = document
		    .getElementById("filter")
		    .src.replace("/branding/Filter3.png", "/branding/Filter2.png");
		  /*if($(".lookUpDialogBox").length == 1){
				  showToggleBar();
			}*/
		  this.closePopUp();
		  if (document.getElementById("bottomMore")) {
		    document.getElementById("bottomMore").className = document
		      .getElementById("bottomMore")
		      .className.replace("pointer-events", "");
		  }
		  document.getElementById("bottomSearch").className = document
		    .getElementById("bottomSearch")
		    .className.replace("pointer-events", "");
		},
		bottomHome: function() {
		  this.closePopUp();
		  document.getElementById("home").src = document
		    .getElementById("home")
		    .src.replace("/branding/Home2.svg", "/branding/Home3.svg");
		  if (
		    document.getElementById("more") &&
		    document.getElementById("more").src &&
		    document.getElementById("more").src.indexOf("More3") != -1
		  ) {
		    document.getElementById("more").src = document
		      .getElementById("more")
		      .src.replace("/branding/More3.png", "/branding/More2.png");
		  }
		  if (
		    document.getElementById("srcSearch").src &&
		    document.getElementById("srcSearch").src.indexOf("Search3") != -1
		  ) {
		    document.getElementById("srcSearch").src = document
		      .getElementById("srcSearch")
		      .src.replace("/branding/Search3.svg", "/branding/Search2.svg");
		  }
		  if (
		    document.getElementById("filter").src &&
		    document.getElementById("filter").src.indexOf("Filter3") != -1
		  ) {
		    document.getElementById("filter").src = document
		      .getElementById("filter")
		      .src.replace("/branding/Filter3.png", "/branding/Filter2.png");
		  }
		  if (document.getElementById("topNav").className.indexOf("hidden") != -1) {
		    document.getElementById("topNav").className = document
		      .getElementById("topNav")
		      .className.replace("hidden", "");
		  }
		  $(".branding").click();
		},
		bottomFilter: function() {
		  this.closePopUp();
		  var self=this;
		  document.getElementById("topNav").className += " hidden";
		  document.getElementById("filter").src = document
		    .getElementById("filter")
		    .src.replace("/branding/Filter2.png", "/branding/Filter3.png");
		  /*if(document.getElementById("bottomMore")){
				document.getElementById("bottomMore").className=document.getElementById("bottomMore").className.replace("","pointer-events ");
			}
			document.getElementById("bottomSearch").className=document.getElementById("bottomSearch").className.replace("","pointer-events ");
			document.getElementById("bottomHome").className=document.getElementById("bottomHome").className.replace("","pointer-events ");*/
		  if (
		    document.getElementById("srcSearch").src &&
		    document.getElementById("srcSearch").src.indexOf("Search3") != -1
		  ) {
		    document.getElementById("srcSearch").src = document
		      .getElementById("srcSearch")
		      .src.replace("/branding/Search3.svg", "/branding/Search2.svg");
		  }
		  var node = document.createElement("div");
		  node.id = global.guid();
		  var popUpId = global.guid();
		  var contentDivId = global.guid();
		  var sideDivId = global.guid();
		  node.className =
		    "lookUpDialogBox bottomClose bottomFilterNav col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  if (
		    this.props.nav &&
		    typeof this.props.nav == "object" &&
		    Object.keys(this.props.nav).length > 0
		  ) {
		    ReactDOM.render(
		      <GenericPopUpComponent
		        close={self.clickClose}
		        popUpId={popUpId}
		        contentDivId={contentDivId}
		        sideDivId={sideDivId}
		        noSideDiv={true}
		      />,
		      node
		    );
		    ReactDOM.render(
		      <OrgNav
		        nav={self.props.nav}
		        noSearch={true}
		        clickClose={this.clickClose}
		        allNavs={self.props.allNavs}
		      />,
		      document.getElementById(contentDivId)
		    );
		    //ReactDOM.render(<PopUpComponent nav={this.props.nav} detailNav={"yes"} allNavs={this.props.allNavs} />,node);
		  } else {
		    ReactDOM.render(
		      <GenericPopUpComponent
		        close={self.clickClose}
		        popUpId={popUpId}
		        contentDivId={contentDivId}
		        sideDivId={sideDivId}
		        noSideDiv={true}
		      />,
		      node
		    );
		    ReactDOM.render(
		      <genericNav.SubList
		        org={self.props.org}
		        mobile={true}
		        clickClose={this.clickClose}
		        orgName={self.props.orgName}
		        filters={self.props.filters}
		        sublink={self.props.sublink}
		      />,
		      document.getElementById(contentDivId)
		    );
		    //ReactDOM.render(<PopUpComponent org={self.props.org} orgName={self.props.orgName} filters={self.props.filters} sublink={self.props.sublink} bottomFilter={"yes"} node={node}/>,node);
		  }
		},
		bottomSearch: function() {
		  this.closePopUp();
		  //	var self=this;
		  document.getElementById("topNav").className += " hidden";
		  document.getElementById("srcSearch").src = document
		    .getElementById("srcSearch")
		    .src.replace("/branding/Search2.svg", "/branding/Search3.svg");
		  /*if(document.getElementById("bottomMore")){
				document.getElementById("bottomMore").className=document.getElementById("bottomMore").className.replace("","pointer-events ");
			}
			document.getElementById("bottomFilter").className=document.getElementById("bottomFilter").className.replace("","pointer-events ");
			document.getElementById("bottomHome").className=document.getElementById("bottomHome").className.replace("","pointer-events ");

			if(document.getElementById("home").src && document.getElementById("home").src.indexOf("Home3") != -1 ){
				document.getElementById("home").src=document.getElementById("home").src.replace("/branding/Home3.svg","/branding/Home2.svg");
			}*/
		  if (
		    document.getElementById("filter").src &&
		    document.getElementById("filter").src.indexOf("Filter3") != -1
		  ) {
		    document.getElementById("filter").src = document
		      .getElementById("filter")
		      .src.replace("/branding/Filter3.png", "/branding/Filter2.png");
		  }
		  if (
		    document.getElementById("more") &&
		    document.getElementById("more").src &&
		    document.getElementById("more").src.indexOf("More3") != -1
		  ) {
		    document.getElementById("more").src = document
		      .getElementById("more")
		      .src.replace("/branding/More3.png", "/branding/More2.png");
		  }
		  var node = document.createElement("div");
		  node.id = global.guid();
		  node.className =
		    "lookUpDialogBox bottomClose col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  ReactDOM.render(
		    <PopUpComponent bottomNavSearch={"yes"} node={node} />,
		    node
		  );
		},
		bottomUser: function() {
		  this.closePopUp();
		  var self = this;
		  document.getElementById("topNav").className += " hidden";
		  if (
		    document.getElementById("srcSearch").src &&
		    document.getElementById("srcSearch").src.indexOf("Search3") != -1
		  ) {
		    document.getElementById("srcSearch").src = document
		      .getElementById("srcSearch")
		      .src.replace("/branding/Search3.svg", "/branding/Search2.svg");
		  }
		  /*
			if(document.getElementById("home").src && document.getElementById("home").src.indexOf("Home3") != -1 ){
				document.getElementById("home").src=document.getElementById("home").src.replace("/branding/Home3.svg","/branding/Home2.svg");
			}*/
		  if (
		    document.getElementById("filter").src &&
		    document.getElementById("filter").src.indexOf("Filter3") != -1
		  ) {
		    document.getElementById("filter").src = document
		      .getElementById("filter")
		      .src.replace("/branding/Filter3.png", "/branding/Filter2.png");
		  }

		  var node = document.createElement("div");
		  node.id = global.guid();
		  var popUpId = global.guid();
		  var contentDivId = global.guid();
		  var sideDivId = global.guid();
		  node.className =
		    "lookUpDialogBox bottomClose popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  ReactDOM.render(
		    <GenericPopUpComponent
		      close={self.closePopUp}
		      popUpId={popUpId}
		      contentDivId={contentDivId}
		      sideDivId={sideDivId}
		      noSideDiv={true}
		    />,
		    node
		  );
		  ReactDOM.render(
		    <signUp.LoginPopup popUpId={popUpId} />,
		    document.getElementById(contentDivId)
		  );
		},
		bottomMore: function() {
		  if (UserDoc && UserDoc.recordId) {
		    //	var self=this;
		    document.getElementById("topNav").className += " hidden";
		    document.getElementById("more").src = document
		      .getElementById("more")
		      .src.replace("/branding/More2.png", "/branding/More3.png");
		    if (
		      document.getElementById("srcSearch").src &&
		      document.getElementById("srcSearch").src.indexOf("Search3") != -1
		    ) {
		      document.getElementById("srcSearch").src = document
		        .getElementById("srcSearch")
		        .src.replace("/branding/Search3.svg", "/branding/Search2.svg");
		    }
		    /*if(document.getElementById("home").src && document.getElementById("home").src.indexOf("Home3") != -1 ){
					document.getElementById("home").src=document.getElementById("home").src.replace("/branding/Home3.svg","/branding/Home2.svg");
				}*/
		    if (
		      document.getElementById("filter").src &&
		      document.getElementById("filter").src.indexOf("Filter3") != -1
		    ) {
		      document.getElementById("filter").src = document
		        .getElementById("filter")
		        .src.replace("/branding/Filter3.png", "/branding/Filter2.png");
		    }
		    document.getElementById(
		      "bottomFilter"
		    ).className = document
		      .getElementById("bottomFilter")
		      .className.replace("", "pointer-events ");
		    var node = document.createElement("div");
		    node.id = global.guid();
		    node.className =
		      "lookUpDialogBox bottomClose col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		    ReactDOM.render(<PopUpComponent bottomMore={"yes"} node={node} />, node);
		  }
		},
		render: function() {
		  var self = this;
		  return (
		    <div className="row">
		      {/*<div id="bottomHome" className="col-xs-3 bottomNavText bottomHome" onClick={this.bottomHome}>
							<img id="home" src='/branding/Home2.svg' style={{'width':'20px','height':'20px'}} />   <span style={{'fontSize':'12px'}} >Home</span>
						</div>*/}
		      <div
		        id="bottomFilter"
		        className="col-xs-3 bottomNavText bottomFilter pointer-events"
		        onClick={self.bottomFilter}
		      >
		        <img
		          id="filter"
		          src="/branding/Filter1.png"
		          style={{ width: "20px", height: "20px" }}
		        />{" "}
		        <span style={{ fontSize: "12px" }}>Filters</span>
		      </div>
		      <div
		        id="bottomNotification"
		        className="col-xs-3 bottomNavText bottomNotification "
		        onClick={function() {
		          showChat();
		        }}
		      >
		        <img
		          id="notofication"
		          src={
		            typeof UserDoc != "undefined" && UserDoc.recordId
		              ? "/branding/icons8-notification.svg"
		              : "/branding/icons8-notification-grey.svg"
		          }
		          style={{ width: "20px", height: "20px" }}
		        />
		        {typeof UserDoc != "undefined" && UserDoc.recordId ? (
		          <Chat.NotificationsCount userId={UserDoc.recordId} wrap={true} />
		        ) : (
		          ""
		        )}
		        <span style={{ fontSize: "12px" }}>Notifications</span>
		      </div>
		      <div
		        id="bottomSearch"
		        className="col-xs-3 bottomNavText bottomSearch"
		        onClick={self.bottomSearch}
		      >
		        <img
		          id="srcSearch"
		          src="/branding/Search2.svg"
		          style={{ width: "20px", height: "20px" }}
		        />{" "}
		        <span style={{ fontSize: "12px" }}>Search</span>
		      </div>
		      {["a"].map(function(temp) {
		        if (UserDoc && UserDoc.recordId) {
		          return (
		            <div
		              key={global.guid()}
		              id="bottomMore"
		              className="col-xs-3 bottomNavText bottomMore"
		              onClick={self.bottomMore}
		            >
		              <img
		                id="more"
		                src="/branding/More2.png"
		                style={{ width: "20px", height: "20px" }}
		              />{" "}
		              <span style={{ fontSize: "12px" }}>More</span>
		            </div>
		          );
		        } else {
		          return (
		            <div
		              key={global.guid()}
		              id="bottomLogin"
		              className="col-xs-3 bottomNavText bottomLogin"
		              onClick={self.bottomUser}
		            >
		              <img
		                src="/branding/UserLogin2.png"
		                style={{ width: "20px", height: "20px" }}
		              />{" "}
		              <span style={{ fontSize: "12px" }}>Login</span>
		            </div>
		          );
		        }
		      })}
		    </div>
		  );
		}
	});
	exports.BottomNavComponent = BottomNavComponent;

	var BottomMoreComponent = React.createClass({
		getInitialState: function() {
		  return {
		    shouldComponentUpdate: false,
		    navLinks: require("../stores/DefinitionStore").getNavigationLinks()
		  };
		},
		componentWillUnmount: function() {
		  DefinitionStore.removeChangeListener(this._onChange, "navigationLinks");
		},
		_onChange: function() {
		  //if(this.isMounted()){
		  this.setState({
		    shouldComponentUpdate: true,
		    navLinks: DefinitionStore.getNavigationLinks()
		  });
		  //}
		},
		shouldComponentUpdate: function(nextProps, nextState) {
		  return nextState.shouldComponentUpdate;
		  //return (JSON.stringify(this.state)!= JSON.stringify(nextState));
		},
		componentDidMount: function() {
		  DefinitionStore.addChangeListener(this._onChange, "navigationLinks");
		  var self = this;
		  if (
		    configDetails &&
		    configDetails.handleBarTemplate &&
		    configDetails.handleBarTemplate == "jsm"
		  ) {
		    if (configDetails.invitePerson && configDetails.invitePerson == "yes") {
		      $(".invite").click(function() {
		        self.props.close();
		        document.getElementById("topNav").className += " hidden";
		        var node = document.createElement("div");
		        node.id = global.guid();
		        var popUpId = global.guid();
		        var contentDivId = global.guid();
		        var sideDivId = global.guid();
		        node.className =
		          "lookUpDialogBox bottomClose  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		        document
		          .getElementById("lookUpDialogBox")
		          .parentNode.appendChild(node);
		        ReactDOM.render(
		          <GenericPopUpComponent
		            close={self.props.close}
		            popUpId={popUpId}
		            contentDivId={contentDivId}
		            sideDivId={sideDivId}
		            noSideDiv={true}
		          />,
		          node
		        );
		        ReactDOM.render(
		          <InvitePeople node={node} popUpId={popUpId} />,
		          document.getElementById(contentDivId)
		        );
		      });
		    }
		  }
		},
		goTo: function(url) {
		  $("#topNav").removeClass("hidden");
		  browserHistory.push(url);
		},
		inviteCancel: function() {
		  $(".bottomMore").click();
		},
		render: function() {
		  try {
		    require("./socket.io.js").createRoom(UserDoc.recordId);
		  } catch (err) {}
		  var photoUrl =
		    "//res.cloudinary.com/dzd0mlvkl/image//upload/h_150,w_150/v1426847732/user_icon.jpg";
		  if (
		    UserDoc.image &&
		    UserDoc.image[0] &&
		    UserDoc.image[0].cloudinaryId &&
		    UserDoc.image[0].cloudinaryId != ""
		  ) {
		    if (UserDoc.image[0].cloudinaryId.indexOf("http") == 0) {
		      photoUrl = UserDoc.image[0].cloudinaryId;
		    } else {
		      photoUrl =
		        "//res.cloudinary.com/dzd0mlvkl/image/upload/v1423542814/" +
		        UserDoc.image[0].cloudinaryId +
		        ".jpg";
		    }
		  } else {
		    if (UserDoc.image && UserDoc.image[0]) {
		      var tempPath = "";
		      if (UserDoc.image[0].facebook) {
		        tempPath =
		          "//res.cloudinary.com/dzd0mlvkl/image/facebook/" +
		          UserDoc.image[0].facebook +
		          ".jpg";
		        photoUrl = tempPath;
		      } else if (UserDoc.image[0].google) {
		        tempPath =
		          "//res.cloudinary.com/dzd0mlvkl/image/gplus/" +
		          UserDoc.image[0].google +
		          ".jpg";
		        photoUrl = tempPath;
		      } else {
		        photoUrl =
		          "//res.cloudinary.com/dzd0mlvkl/image/upload/v1441279368/default_image.jpg";
		      }
		    }
		  }
		  var self = this;
		  return (
		    <div id="bottomMoreDiv" className="mobile-nav-links">
		      <div
		        className="child-img-component"
		        style={{ height: "51px", verticalAlign: "middle" }}
		      >
		        <img className="img-circle  img-holder profilePhoto" src={photoUrl} />
		      </div>
		      <div style={{ lineHeight: "51px" }} className="child-img-component">
		        <span className="no-margin pointer" style={{ paddingTop: "5px" }}>
		          {UserDoc.givenName +
		            " " +
		            (UserDoc.mname ? UserDoc.mname : " ") +
		            " " +
		            (UserDoc.familyName ? UserDoc.familyName : "")}
		        </span>
		      </div>
		      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 extra-padding-left">
		        <div>
		          {this.state.navLinks.navs.map(
		            function(nav, index) {
		              if (nav.orgName == "") {
		                return nav.elements.map(function(sublink) {
		                  if (
		                    sublink.profileLink &&
		                    sublink.profileLink == "true" &&
		                    nav.org == "public"
		                  ) {
		                    return (
		                      <div key={global.guid()} className="navElement">
		                        {" "}
		                        <a
		                          onClick={self.goTo.bind(
		                            null,
		                            linkGenerator.getSummaryLink({
		                              org: "public",
		                              schema: sublink.target.schema,
		                              dependentSchema: sublink.target.dependentSchema,
		                              filters: sublink.target.filters
		                            })
		                          )}
		                          className="link"
		                        >
		                          {sublink.displayName}
		                        </a>
		                      </div>
		                    );
		                  } else {
		                    return <div key={global.guid()} className="hidden" />;
		                  }
		                });
		              } else {
		                return <div key={global.guid()} className="hidden" />;
		              }
		            }.bind(this)
		          )}
		        </div>
		        <div className="navElement">
		          <a href="/myprojects" className="link">
		            MY PROJECTS
		          </a>
		        </div>
		        <div className="navElement">
		          <a href="/myfirms" className="link">
		            MY FIRMS
		          </a>
		        </div>
		        <div className="navElement">
		          <a className="link invite">INVITE</a>
		        </div>
		        <div className="navElement">
		          <a
		            onClick={self.goTo.bind(
		              null,
		              linkGenerator.getDetailLink({
		                record: UserDoc,
		                org: "public",
		                schema: "User",
		                recordId: UserDoc.recordId
		              })
		            )}
		            className="link"
		          >
		            PROFILE
		          </a>
		        </div>
		        <div className="navElement">
		          <a onClick={logout} className="link">
		            LOGOUT
		          </a>
		        </div>
		      </div>

		      <div
		        className={
		          "footer margin-top-gap-lg no-padding form-group bottomNavFooterMargin"
		        }
		      >
		        <signUp.Footer fromBottomMore={true} close={self.props.close} />
		      </div>
		    </div>
		  );
		}
	});

	function updateErrorImages() {
		var imgId = "wkcrash.jpg";
		if (getConfigDetails() && getConfigDetails().crashImage) {
		  imgId = getConfigDetails().crashImage;
		}

		$("img").error(function() {
		  var user = false;
		  var imageSrc = $(this).attr("src");
		  var id = "";
		  for (var i = imageSrc.length; i > 0; i--) {
		    if (imageSrc[i] == "/") {
		      id = imageSrc.substr(i + 1, imageSrc.length);
		      imageSrc = imageSrc.substr(0, i);
		      break;
		    }
		  }
		  if (id != "wkcrash.jpg" && id != "default-user.jpg") {
		    if (
		      imageSrc.indexOf("gplus") == -1 &&
		      imageSrc.indexOf("facebook") == -1
		    ) {
		      imageSrc = imageSrc + "/" + imgId;
		    } else {
		      user = true;
		      if (imageSrc.indexOf("gplus") != -1) {
		        imageSrc = imageSrc.replace("gplus", "upload");
		      } else if (imageSrc.indexOf("facebook") != -1) {
		        imageSrc = imageSrc.replace("facebook", "upload");
		      }

		      //	if($(this).attr("class").indexOf("userPhoto")!=-1 || user){
		      imgId = "default-user.jpg";
		      //   }
		      imageSrc = imageSrc + "/" + imgId;
		    }
		    $(this).attr("src", imageSrc);
		  }
		});
		try {
		  if ($("div[itemType='http://schema.org/Product']").length <= 1) {
		    $(".addToCompareButton").each(function(i, e) {
		      $(e).addClass("hidden");
		    });
		  } else {
		    $(".addToCompareButton").each(function(i, e) {
		      $(e).removeClass("hidden");
		    });
		  }
		} catch (err) {}
	}
	exports.updateErrorImages = updateErrorImages;

	/**
	 *it needs three div ids as props
	 * 1) popUpId
	 * 2) sideDivId
	 * 3) contentDivId
	 */
	var GenericPopUpComponent = React.createClass({
		componentWillMount: function() {},
		close: function() {
		  showMainContainer();
		  if (typeof this.props.clear == "function") {
		    this.props.clear();
		  }
		  if (typeof this.props.close == "function") {
		    this.props.close();
		  }
		  $(document).unbind("keyup", this.keyUpFunc);
		  this.rootNode.style.display = "none";
		  this.rootNode.parentNode.style.display = "none";
		  this.rootNode.parentNode.remove();
		},
		componentDidMount: function() {
		  hideMainContainer();
		  $("html,body").scrollTop(0);

		  $(document).bind("keyup", this.keyUpFunc);
		  this.rootNode.style.display = "block";
		  if (this.props.hideClose) {
		    $(".icons8-delete").addClass("hidden");
		  }
		},
		keyUpFunc: function(e) {
		  if (e.keyCode == 27 && !this.props.hideClose) {
		    this.close();
		  }
		},
		render: function() {
		  var self = this;
		  var main = [];
		  //(this.props.alignMiddleDiv || true) && -- removed from below if   statement
		  if (!this.props.chatDiv) {
		  /*  main.push(<div
		                  key={global.guid()}
		                  className="hidden-xs hidden-sm  col-lg-1 col-md-1  " />
		              );*/
		    main.push(<div className="container">
		                <div
		                  key={global.guid()}
		                  className="col-xs-12 col-sm-12  col-lg-12 col-md-12  "
		                  style={{}}
		                  id={this.props.contentDivId} />
		              </div>
		              );
		/*    main.push(<div
		                  key={global.guid()}
		                  className="hidden-xs hidden-sm  col-lg-1 col-md-1  " />
		              );*/
		  } else {
		    if (!this.props.noSideDiv) {
		      main.push(<div
		                  key={global.guid()}
		                  role="navigation"
		                  className="col-xs-6 col-sm-6 col-lg-2 col-md-2 sidebar-offcanvas"
		                  id={this.props.sideDivId} />
		              );
		      main.push(<div
		                  key={global.guid()}
		                  className="col-xs-12 col-sm-12  col-lg-10 col-md-10  "
		                  style={{ minHeight: "750px" }}
		                  id={this.props.contentDivId} />
		              );
		    }
		    if (this.props.noSideDiv) {
		      main.push(<div
		                    key={global.guid()}
		                    className="col-xs-12 col-sm-12  col-lg-12 col-md-12 no-padding "
		                    id={this.props.contentDivId} />
		                );
		    }
		  }
		  var style = {};
		/*if (this.props.chatDiv) {
		    style = { top: "2%", right: "1%" };
		    if (this.props.mobile) {
		      style = { top: "-9vw",position: "absolute" };
		    }
		  }*/
		  return (
		    <div
		    	key={global.guid()}
		      className="popupAnimation"
		      ref={d => {
		        this.rootNode = d;
		      }}
		      style={{ display: "none", height: "100%" }}
		      id={this.props.popUpId}  >
		      <div style={{ padding: "0px", height: "100%" }}>
		        <div className=" row-offcanvas row-offcanvas-left">
		          <div className="row no-margin">
		            <span
		              className={"icons8-delete fontSizeDelete  fa-3x deleteIcon pull-right link "+(this.props.chatDiv?"chatDeleteIcon":"")}
		              style={style}
		              onClick={this.close}
		              aria-hidden="true" />
		          </div>
		          <div
		            style={
		              self.props.chatDiv
		                ? { clear: "both" }
		                : { clear: "both", marginTop: "100px" }
		            }
		            className="row remove-margin-top-mobile remove-margin-left remove-margin-right ">
		            {main}
		          </div>
		        </div>
		      </div>
		    </div>
		  );
		}
	});
	exports.GenericPopUpComponent = GenericPopUpComponent;

	var GenericPopup = React.createClass({
		componentDidMount: function() {
		  $("html,body").scrollTop(0);
		  //$('.modal-backdrop').remove();
		  $("#" + this.props.popUpId).modal({ show: true, backdrop: "static" });
		  //$(".modal-backdrop").click(this.removeDialogBox);
		},
		removeDialogBox: function() {
		  if (typeof this.props.clear == "function") {
		    this.props.clear();
		  }
		  $(".modal-backdrop").remove();
		  this.rootNode.style.display = "none";
		  this.rootNode.parentNode.style.display = "none";
		  this.rootNode.parentNode.remove();
		},
		render: function() {
		  return (
		    <div
		      ref={d => {
		        this.rootNode = d;
		      }}
		      className="modal fade "
		      id={this.props.popUpId}
		      tabIndex="-1"
		      role="dialog"
		      aria-labelledby="providerLabel"
		      aria-hidden="true"
		    >
		      <div className="modal-dialog">
		        <div className="modal-content">
		          <div className="modal-header" id="header">
		            <button
		              aria-label="Close"
		              data-dismiss="modal"
		              className="close"
		              type="button"
		              onClick={this.removeDialogBox}
		            >
		              <span className="icons8-delete fa-2x link" aria-hidden="true" />
		            </button>
		            <label className="text-uppercase">
		              {this.props.title ? this.props.title : ""}
		            </label>
		          </div>
		          <div className="modal-body">
		            <div id={this.props.contentDivId} />
		          </div>
		          <div className="modal-footer" id="footer" />
		        </div>
		      </div>
		    </div>
		  );
		}
	});
	exports.GenericPopup = GenericPopup;

	function getHandleBars() {
		return {
		  title:
		    configDetails && configDetails.title ? configDetails.title : "Cloudseed",
		  logo:
		    configDetails && configDetails.logo
		      ? configDetails.logo
		      : "cloudseed.png",
		  favIcon:
		    configDetails && configDetails.favIcon
		      ? configDetails.favIcon
		      : configDetails && configDetails.logo
		        ? configDetails.logo
		        : "cloudseed.png",
		  loader:
		    configDetails && configDetails.loader
		      ? configDetails.loader
		      : "cloudseedLoader.gif",
		  handleBarTemplate:
		    configDetails && configDetails.handleBarTemplate
		      ? configDetails.handleBarTemplate
		      : "main",
		  htmlToInclude:
		    configDetails && configDetails.htmlToInclude
		      ? configDetails.htmlToInclude
		      : "",
		  navBarStyle:
		    configDetails && configDetails.navBarStyle
		      ? configDetails.navBarStyle
		      : {},
		  footerStyle:
		    configDetails && configDetails.footerStyle
		      ? configDetails.footerStyle
		      : {},
		  lpi:
		    configDetails && configDetails.landingTemplate
		      ? configDetails.landingTemplate
		      : "CloudseedTemplate",
		  cloudPointHostId:
		    configDetails && configDetails.cloudPointHostId
		      ? configDetails.cloudPointHostId
		      : "cloudseed"
		  //url:request.protocol+"://"+hostname+""+request.originalUrl,
		  //canonicalUrl:configDetails.canonicalDomain?(request.protocol+"://"+configDetails.canonicalDomain+""+request.originalUrl):undefined
		};
	}

	exports.getHandleBars = getHandleBars;

	function showToggleBar() {
		document.getElementById("topNav").className = document
		  .getElementById("topNav")
		  .className.replace("hidden", "");
	}
	exports.showToggleBar = showToggleBar;
	/*
	function hideToggleBar(){
		  document.getElementById("topNav").className+=" hidden";
	}*/
	//initializing the scroll position
	var scrollPosition=0;

	function hideMainContainer() {
	//check if already mainContainer is hidden or not
		if(document.getElementById("mainContainer").clientHeight >0){
		  try{
		  //getting the current scroll position and assigning it to scrollPosition
		    scrollPosition=$(window).scrollTop();
		  }catch(err){}
		  //hide mainContainer
		  $("#mainContainer").hide();
		}else{

		  //do nothing
		}
	}
	exports.hideMainContainer = hideMainContainer;

	function showMainContainer(currentPosition) {
	//show mainContainer
		$("#mainContainer").show();

		try{
		//currentPosition is the desired position to which window has to flow
		  if(typeof currentPosition!="undefined"){
		    scrollPosition=currentPosition;
		  }
		  //scroll window to scrollPosition
		  $(window).scrollTop(scrollPosition);
		}catch(err){}
	}
	exports.showMainContainer = showMainContainer;

	function updateIntroStatus(guideId) {
		if (!Array.isArray(UserDoc.introsDone)) {
		  UserDoc.introsDone = [];
		}
		if (UserDoc.introsDone.indexOf(guideId) == -1) {
		  UserDoc.introsDone.push(guideId);
		}
	}
	exports.updateIntroStatus = updateIntroStatus;


	function updateIntroSummaryStatus(status) {
		UserDoc.introsSummarySelection=status;
	}
	exports.updateIntroSummaryStatus = updateIntroSummaryStatus;

	function updateSearchText(text, remove) {
		if (!Array.isArray(UserDoc.searches)) {
		  UserDoc.searches = [];
		}
		if (text && UserDoc.searches.indexOf(text) == -1) {
		  UserDoc.searches.push(text);
		}
		if (UserDoc.searches.length > 100) {
		  UserDoc.searches.splice(0, 1);
		}
		if (remove == "removeAll") {
		  UserDoc.searches = [];
		} else if (remove == "remove") {
		  UserDoc.searches = UserDoc.searches.filter(function(k) {
		    return k != text;
		  });
		}
	}
	exports.updateSearchText = updateSearchText;

	var PopUpComponent = React.createClass({
		componentWillMount: function() {},
		close: function() {
		  showMainContainer();
		  if (this.props.bottomNavSearch && this.props.bottomNavSearch == "yes") {
		    mobileSearch();
		    this.rootNode.style.display = "none";
		    this.rootNode.parentNode.style.display = "none";
		    this.rootNode.parentNode.remove();
		  }
		  if (this.props.bottomMore && this.props.bottomMore == "yes") {
		    if ($(".lookUpDialogBox").length == 1) {
		      //	document.getElementById("topNav").className=document.getElementById("topNav").className.replace("hidden","");
		      showToggleBar();
		    }
		    document.getElementById("more").src = document
		      .getElementById("more")
		      .src.replace("/branding/More3.png", "/branding/More2.png");
		    document.getElementById(
		      "bottomFilter"
		    ).className = document
		      .getElementById("bottomFilter")
		      .className.replace("pointer-events", "");
		  }
		  if (this.props.login && this.props.login == "yes") {
		    if ($(".lookUpDialogBox").length == 1) {
		      showToggleBar();
		      //document.getElementById("topNav").className=document.getElementById("topNav").className.replace("hidden","");
		    }
		  }
		  if (this.props.invite && this.props.invite == "yes") {
		    //			document.getElementById("topNav").className=document.getElementById("topNav").className.replace("hidden","");
		    showToggleBar();
		  }
		  if (this.props.detailNav && this.props.detailNav == "yes") {
		    document.getElementById("filter").src = document
		      .getElementById("filter")
		      .src.replace("/branding/Filter3.png", "/branding/Filter2.png");
		    if ($(".lookUpDialogBox").length == 1) {
		      showToggleBar();
		      //document.getElementById("topNav").className=document.getElementById("topNav").className.replace("hidden","");
		    }
		  }
		  //$("#mainContainer").css("display","block");
		  if (this.props.edit && this.props.edit == "edit") {
		    if (document.getElementsByClassName("lookUpDialogBox")) {
		      $(".lookUpDialogBox").remove();
		    }
		  } else {
		    this.rootNode.style.display = "none";
		    this.rootNode.parentNode.style.display = "none";
		    this.rootNode.parentNode.remove();
		  }
		},
		componentDidMount: function() {
		  hideMainContainer();
		  $("html,body").scrollTop(0);

		  //$("#mainContainer").css("display","none");
		  this.rootNode.style.display = "block";
		},
		render: function() {
		  var self = this;
		  return (
		    <div className="popupAnimation"
		         ref={input => {this.rootNode = input;}}
		         style={{ display: "none", height: "100%" }}>
		      <div className="container popContainer">
		        <div className="row remove-margin-top-mobile row-offcanvas row-offcanvas-left">
		          <div className="row no-margin">
		            <span
		              className="icons8-delete fontSizeDelete  fa-3x deleteIcon pull-right link"
		              onClick={this.close}
		              aria-hidden="true" />
		          </div>
		          <div
		            style={{ clear: "both", marginTop: "100px" }}
		            className="row remove-margin-top-mobile remove-margin-left remove-margin-right mobile-padding-left-right " >
		            <div
		              role="navigation"
		              className="col-xs-6 col-sm-6 col-lg-2 col-md-2 sidebar-offcanvas"
		              id="popUpNavigation"/>
		            <div className="col-xs-12 col-sm-12  col-lg-10 col-md-10  "
		                id="popUpContentDiv">
		              <div className="col-xs-12 col-sm-12  col-lg-12 col-md-12 ">
		                {[1].map(function(item) {
		                  if (self.props.bottomNavSearch) {
		                    return (
		                      <search.SearchComponent
		                        key={global.guid()}
		                        from={"mobile"}
		                        close={self.close}
		                      />
		                    );
		                  } else if (self.props.bottomMore) {
		                    return (
		                      <BottomMoreComponent
		                        key={global.guid()}
		                        close={self.close}   />
		                    );
		                  } else if (self.props.bottomFilter) {
		                    return (
		                      <div key={global.guid()}>
		                        <genericNav.SubList
		                          org={self.props.org}
		                          mobile={true}
		                          orgName={self.props.orgName}
		                          filters={self.props.filters}
		                          clickClose={this.close}
		                          sublink={self.props.sublink}  />
		                        {/*<span className="doneButton upload-btn pull-right link" onClick={this.close}>Done</span>*/}
		                      </div>
		                    );
		                  } else if (self.props.detailNav) {
		                    return (
		                      <OrgNav
		                        nav={self.props.nav}
		                        noSearch={true}
		                        allNavs={self.props.allNavs}
		                        close={self.close} />
		                    );
		                  } else {
		                    return <div key={global.guid()} className="hidden" />;
		                  }
		                }, this)}
		              </div>
		            </div>
		          </div>
		        </div>
		      </div>
		    </div>
		  );
		}
	});

	exports.PopUpComponent = PopUpComponent;

	function createAlert(title, content, callback) {
		//alert(content);return;
		var node = document.createElement("div");
		node.title = title ? title : "";
		node.innerHTML = content;
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		$(node).dialog({
		  dialogClass: "no-close",
		  buttons: [
		    {
		      text: "OK",
		      click: function() {
		        $(this).dialog("destroy");
		        this.remove();
		        if (callback && typeof callback == "function") {
		          callback();
		        }
		      }
		    }
		  ]
		});
		/*setTimeout(function(){
			$(node).dialog("destroy");
			node.remove();
		},5000);*/
	}
	exports.createAlert = createAlert;

	function createConfirm(title, content, callback) {
		//alert(content);return;
		var node = document.createElement("div");
		node.title = title ? title : "";
		node.innerHTML = content;
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		$(node).dialog({
		  dialogClass: "no-close",
		  modal: true,
		  buttons: [
		    {
		      text: "OK",
		      click: function() {
		        $(this).dialog("destroy");
		        this.remove();
		        if (callback && typeof callback == "function") {
		          callback(true);
		        }
		      }
		    },
		    {
		      text: "CANCEL",
		      click: function() {
		        $(this).dialog("destroy");
		        this.remove();
		        if (callback && typeof callback == "function") {
		          callback(false);
		        }
		      }
		    }
		  ]
		});
		/*setTimeout(function(){
			$(node).dialog("destroy");
			node.remove();
		},5000);*/
	}
	exports.createConfirm = createConfirm;

	function reloadSession(callback) {
		WebUtils.doPost("/user?operation=reloadSession", {}, function(res) {
		  if (!res.userData) {
		    if (UserDoc.recordId) {
		      location.reload();
		    }
		  }
		  setUserDoc(res.userData ? res.userData : {});
		  setUserOrgs(res.orgAndRoles);
		  setSessionData(res);
		  //ServerActionReceiver.receiveUserDoc(res.userData);
		  if (res.navLinks) {
		    ServerActionReceiver.receiveNavigationLinks(res.navLinks);
		  }
		  if (typeof callback == "function") {
		    callback(res);
		  }
		});
	}
	exports.reloadSession = reloadSession;

	try {
		if (typeof window != "undefined") window.reloadSession = reloadSession;
	} catch (r) {}

	function calWidth(nav) {
		var width = 1200;
		try {
		  width = $(window).width();
		} catch (err) {}
		var colSize = 0;
		var visibleCount = 0;
		if (width > 1032) {
		  if (nav) {
		    colSize = 1;
		    visibleCount = 12;
		  } else {
		    colSize = 2;
		    visibleCount = 6;
		  }
		} else if (width > 768) {
		  if (nav) {
		    colSize = 2;
		    visibleCount = 6;
		  } else {
		    colSize = 4;
		    visibleCount = 3;
		  }
		} else {
		  if (nav) {
		    colSize = 3;
		    visibleCount = 4;
		  } else {
		    colSize = 6;
		    visibleCount = 2;
		  }
		}
		return { colSize: colSize, visibleCount: visibleCount };
	}
	exports.calWidth = calWidth;

	function hideMainNavigation() {
		if (
		  $("#mainNavigation").find(".navbar-collapse").length > 0 &&
		  $("#mainNavigation")
		    .find(".navbar-collapse")
		    .hasClass("in")
		) {
		  $("#mainNavigation")
		    .find(".navbar-collapse")
		    .removeClass("in");
		  /*
			$("#mainNavigation").find(".navbar-collapse").attr("class").indexOf("in")!=-1){
				$("#mainNavigation").find(".navbar-collapse").attr("class",$("#mainNavigation").find(".navbar-collapse").attr("class").replace("in",""));*/
		}
	}

	exports.hideMainNavigation = hideMainNavigation;
	function showDynamicContentDiv() {
		$("#dynamicContentDiv").css("display", "block");
		document.getElementById(
		  "dynamicContentDiv"
		).className = document
		  .getElementById("dynamicContentDiv")
		  .className.replace(/hidden/g, "");
	}
	exports.showDynamicContentDiv = showDynamicContentDiv;
