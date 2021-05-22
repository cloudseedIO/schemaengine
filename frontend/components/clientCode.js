/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('./common.jsx');
var signUp=require('./auth/signUp.jsx');
var genericNav=require('./nav/genericNav.jsx');
var searchDiv=require('./nav/search.jsx');
var router=require('./nav/router.jsx');
var linkGenerator=require('./nav/linkGenerator.jsx');
var RecordSummaryStore = require('../stores/RecordSummaryStore');
var RecordDetailStore = require('../stores/RecordDetailStore');
var DefinitionStore=require('../stores/DefinitionStore');
var SchemaStore = require('../stores/SchemaStore');
var JunctionStore = require('../stores/JunctionStore');
var global=require('../utils/global.js')
var ServerActionReceiver = require('../actions/ServerActionReceiver.js');
var tagsInput=require('./records/tagsInput.jsx');
var WebUtils=require('../utils/WebAPIUtils.js');
var uploadingProducts=require('./admin/uploadingProducts.jsx');
var scrapedView=require('./admin/scrapedView.jsx');
var guide=require('./guide.jsx');


var state={};
var researchDiv=require('./nav/researchSpec.jsx');

window.mobilecheck =function() {
 if( navigator.userAgent.match(/Android/i)
 	|| navigator.userAgent.match(/webOS/i)
 	|| navigator.userAgent.match(/iPhone/i)
 	|| navigator.userAgent.match(/iPad/i)
 	|| navigator.userAgent.match(/iPod/i)
 	|| navigator.userAgent.match(/BlackBerry/i)
 	|| navigator.userAgent.match(/Windows Phone/i)){
   		return true;
  } else {
    return false;
  }
}

$(document).ready(function(){
	 $('[data-toggle="offcanvas"]').click(function () {
	    $('.row-offcanvas').toggleClass('active')
	  });
	  $(".popUpClose").click(function(){
		  $("#popUp").css("display","none");
	  });
	  
    /*var node = document.createElement("div");
    node.id = global.guid();
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    ReactDOM.render(<common.ChatBotComponent/>,node);*/

	  //Reload Session Every 1Minutes
	  setInterval(function(){common.reloadSession(); if(window.location.pathname!="/")common.showLoginPopup();},1000*60*5);
	  //Reload Page Every 1Hours
	  //setInterval(function(){location.reload()},1000*60*60);
	  //Clearing loaders every 10seconds
	  setInterval(function(){if($.active==0){ $(".loader").remove();}},1000*10);


	  $(document).mouseup(function(e){
	      var container = $(".AjaxAPIListRoot");
	      // if the target of the click isn't the container nor a descendant of the container
	      if (!container.is(e.target) && container.has(e.target).length === 0){
	          $(".AjaxAPIList").hide();
	      }
	  });


	  $(".navbar-toggle").click(function(){
		  if($(".navbar-toggle").height()>0){
			  window.scrollTo(0,0);
		  }
	  });

	  $(window).scroll(function () {
		  if ($(this).scrollTop() > 100) {
			$('.scrollup').fadeIn();
		  } else {
			  $('.scrollup').fadeOut();
		  }
	  });

	  $('.scrollup').click(function () {
		  $("html, body").animate({
			  scrollTop: 0
		  }, 600);
		  return false;
	  });
	  WebUtils.getBootData(function(state){
		if(document.getElementById('documentState').innerHTML!=""){
			var currState = JSON.parse(document.getElementById('documentState').innerHTML);
			Object.assign(state,currState);
			if(state.allSlugs){
				common.setSlugs(state.allSlugs);
			}
			if(state.configDetails)
			common.setConfigDetails(state.configDetails);
			
			if(state.summaryState)
			RecordSummaryStore.putAll(state.summaryState);
			
			if(state.definitionState)
			DefinitionStore.putAll(state.definitionState);
			
			if(state.schemaState)
			SchemaStore.putAll(state.schemaState);
			
			if(state.junctionState){
				JunctionStore.putAll(state.junctionState);
			}
			if(state.detailState){
				RecordDetailStore.putAll(state.detailState);
			}
			if(state.unLoggedSessionObject)
				DefinitionStore.addNavigationLinks(state.unLoggedSessionObject.navLinks)
		
			if(state.siteSpecific){
				common.setSiteSpecific(true);
				$(".navbar,.footer,#mainNavigation,#sideFilterNavigation").hide()
			}
			common.startLoader();
			//Checking user session
			window.sessionChecked=false;
			
		
			WebUtils.doPost("/user?operation=checksession",{},function(res){
				window.sessionChecked=true;
				common.stopLoader();
				try{
					common.setUserDoc(res.sessionData.userData);
					common.setSessionData(res.sessionData);
					common.setUserOrgs(res.sessionData.orgAndRoles);
					//ServerActionReceiver.receiveUserDoc(res.sessionData.userData);
					ServerActionReceiver.receiveNavigationLinks(res.sessionData.navLinks);
					//common.loadUserPhoto();
				}catch(err){console.log("There was an error reading session info");}
				if(res.userExists){
					common.checkOrgs();
					if(document.getElementById("loginButton")){
						document.getElementById("loginButton").className+=" hidden";
					}
					//Tracking Code mix pannel
					try{userReopened(common.getUserDoc());}catch(err){}
				}else{
					//common.showLoginPopup();
					if(common.getParameterByName("ctar")){
						common.showLoginPopup();
					}
					if(document.getElementById("loginButton")){
						document.getElementById("loginButton").className=document.getElementById("loginButton").className.replace("hidden","");
					}
				}
				ReactDOM.render(<common.BottomNavComponent/>,document.getElementById('bottomNav'));
			});
			/*
			var currentLocation=location.hash.replace("#","");
			if(state.slug){
				currentLocation="/"+state.slug;
			}else if(state.current=="summary"){
				currentLocation=linkGenerator.getSummaryLink({org:state.org,schema:state.schema,dependentSchema:state.dependentSchema,filters:state.filters,skip:state.skip});
			}else if(state.current=="recordView"){
				var record=RecordDetailStore.getSchemaRecord({
							schema:state.schema,
							recordId:state.recordId,
							userId:common.getUserDoc().recordId,
							org:state.org});
				if(record && record.value){
					record=record.value;
				}else{
					record={};
				}
				currentLocation=linkGenerator.getDetailLink({
					org:state.org,
					schema:state.schema,
					recordId:state.recordId,
					dependentSchema:state.dependentSchema,
					record:record
				});
			}else if(state.landingPage && state.landingPage!=""){
				currentLocation=linkGenerator.getLandingLink({landingPage:state.landingPage})
			}else if(state.current=="groupView"){
				if(state.slug){
					currentLocation="/"+state.slug;
				}else{
					var params="?";
					for(var key in state.data){
						if(key!="schema" && key!="viewName" && key!="text" && key!="displayName"){
							params+=key+"="+state.data[key]+"&"
						}
					}
					currentLocation=linkGenerator.getGroupViewLink({
						schema:state.data.schema,
						viewName:state.data.viewName,
						text:state.data.text,
						displayName:state.data.displayName,
						params:params
					});
				}
			}else if(state.pageNotFound){
				currentLocation=linkGenerator.getPageNotFoundLink();//"pageNotFound";
			}
			try{
				//history.pushState({hash:currentLocation},"",currentLocation);
			}catch(err){}
			//location.hash=currentLocation;
			*/
			//setTimeout(function(){
				router.routTheApp();
			//},500);

			common.stopLoader();

			$.ajax({
				url:"https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment.min.js",
				dataType: 'script',
				success: function(){
					$.ajax({
						url:  "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.7.14/js/bootstrap-datetimepicker.min.js",
						dataType: 'script',
						success: function(){
						},
						async: true
					});
				},
				async: true
			});

			$.ajax({
				url: "https://apis.google.com/js/client:platform.js",
				dataType: 'script',
				success: function(){
					gapi.load('client', function(){
						common.onLoadGApiCallback();
					});
				},
				async: true
			});

			$.ajax({
				url: "https://connect.facebook.net/en_US/sdk.js",
				dataType: 'script',
				success: function(){
					FB.init({
						appId      : state.configDetails.auth.fb.APP_ID,
						status     : true,
						cookie     : true,
						xfbml      : true,
						version    : 'v2.3'
					});
				},
				async: true
			});
			window.gApiLoginCallback = common.gApiLoginCallback;

		}else{
			alert("network error please try after some time");
		}
	});
});
