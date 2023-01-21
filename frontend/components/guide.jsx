var React=require('react');
var ReactDOM = require('react-dom');
var WebUtils=require('../utils/WebAPIUtils.js');
var global=require('../utils/global.js');
var common=require("./common.jsx");
var introCompleteUploadStatus={};
var currentGuide;

function lockScroll(){
	try{$("body").css("overflow", "hidden");}catch(err){}
}
function unlockScroll(){
	try{$("body").css("overflow", "auto");}catch(err){}
}

function setCookie(cname,cvalue){
		var d = new Date();
    d.setTime(d.getTime() + (365*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    var temp=getCookie(cname);
    if(temp.indexOf(cvalue)==-1){
    	temp+=(temp?",":"")+cvalue;
    }
    document.cookie = cname+"=" + temp + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname+"=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}





function updateIntroStatus(guideId){
	currentGuide=undefined;
	if(!introCompleteUploadStatus[guideId]){
		introCompleteUploadStatus[guideId]="done";
		localStorage.setItem(guideId,"done");
		setCookie("introsDone",guideId);
		if(common.getUserDoc().recordId){
				common.updateIntroStatus(guideId);
  			WebUtils.doPost("/user?operation=updateIntroStatus",{guideId:guideId},function(){});
  		}
	}
}
function updateIntroSummarySelection(status){
		localStorage.setItem("introsSummarySelection",status);
		setCookie("introsSummarySelection",status);
		if(common.getUserDoc().recordId){
				common.updateIntroSummaryStatus(status);
  			WebUtils.doPost("/user?operation=updateIntroSummarySelection",{status:status},function(){});
  	}
}

function getIntrosSummaryStatus(){
	if(localStorage.getItem("introsSummarySelection")){return localStorage.getItem("introsSummarySelection");}
	if(getCookie("introsSummarySelection")){return getCookie("introsSummarySelection");}
	if(common.getUserDoc() && common.getUserDoc()["introsSummarySelection"]){return common.getUserDoc()["introsSummarySelection"];}
}
function showIntrosSummaryStatus(callback){
	if(typeof callback!="function"){ callback=function(){};}
	showStep("IntrosSummary", {
      "stepNo": "1",
      "heading": "Welcome to schemaengine!",
      "subHeading": "We will show you some introduction guides to our site.",
      "element": {
        "type": "clickable",
        "selector": "body",
        "mobileSelector": "body"
      }
    },function(){//close
    	unlockScroll();
    	$(".IntrosSummary").remove();
    	updateIntroSummarySelection("skip");
    },function(){//next="continue"
    	unlockScroll();
    	$(".IntrosSummary").remove();
    	updateIntroSummarySelection("continue");
    	callback();
    },function(){//prev="skip"
    	unlockScroll();
    	$(".IntrosSummary").remove();
    	updateIntroSummarySelection("skip");
    },"introsSummary");
		
}

function guide(guideId){
	//return;
	if(!guideId){return;}
	if(!getIntrosSummaryStatus()){
		showIntrosSummaryStatus(continueGuide);
	}else if(getIntrosSummaryStatus()=="continue"){
		continueGuide();
	}
	function continueGuide(){
		if(localStorage.getItem(guideId)){return;}
		if(getCookie("introsDone") && getCookie("introsDone").indexOf(guideId)>-1){return;}
		if(common.getUserDoc() && common.getUserDoc()["introsDone"] && common.getUserDoc()["introsDone"].indexOf(guideId)>-1){return;}
		if(currentGuide==undefined){
			executeGuide(guideId);
		}
	}
};
exports.guide=guide;
function executeGuide(guideId){
	currentGuide=guideId;
	WebUtils.doPost("/generic?operation=getDefinition",{recordId:guideId},function(guide){
		if(guide.error){
			currentGuide=undefined;
			console.log(guide.error);
			return;
		}
		if(guide.loginRequired && !common.getUserDoc().recordId){
			currentGuide=undefined;
			common.showLoginPopup();
			return;
		}
		var current=0;
		var allSteps=[];
		
		var guideStarted=false;
		var GuideStartInterval;
		function stopCheckInterval(){
			clearInterval(GuideStartInterval);
		}
		GuideStartInterval=setInterval(function(){
			if(!guideStarted && $.active==0 && $("walkthrough-overlay").length==0){
				guideStarted=true;
				startGuide();
			}
			if(guideStarted){
				stopCheckInterval();
			}
		},1000);
		function startGuide(){
			guide.steps.map(function(step){
				var element;
				if(mobilecheck() && step.element.mobileSelector){
					element=step.element.mobileSelector;
				}else if(!mobilecheck()){
					element= step.element.selector;
				}
				if(typeof element!="undefined" && $(element).length>0)
				allSteps.push({
				    element:{selector:element},
				    heading: step.heading,
				    subHeading:step.subHeading
				});
			});
			if(allSteps.length>0){
				showStep(guideId,allSteps[current],closeCallback,current<(allSteps.length-1)?nextCallback:undefined,current>0?prevCallback:undefined);
			}else{
				currentGuide=undefined;
			}
		}
		function closeCallback(ErrorClose){
			unlockScroll();
			currentGuide=undefined;
			//if(ErrorClose!="ErrorClose"){
				updateIntroStatus(guideId);
			//}
			$("."+guideId).remove();
		}
		function nextCallback(){
			unlockScroll();
			$("."+guideId).remove();
			current++;
			if(current<allSteps.length){
				showStep(guideId,allSteps[current],closeCallback,current<(allSteps.length-1)?nextCallback:undefined,current>0?prevCallback:undefined);
			}else{
				closeCallback();
			}
		}
		function prevCallback(){
			unlockScroll();
			$("."+guideId).remove();
			current--;
			if(current>-1){
				showStep(guideId,allSteps[current],closeCallback,current<(allSteps.length-1)?nextCallback:undefined,current>0?prevCallback:undefined);
			}
		}
	});	
}

if(typeof window!="undefined"){
    window.guide=guide;
}

function _getOffset(element) {
	if(element){
	    var body = document.body;
	    var docEl = document.documentElement;
	    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
	    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
	    var x = element.getBoundingClientRect();
	    return {
	      top: x.top ,//+ scrollTop,
	      width: x.width,
	      height: x.height,
	      left: x.left //+ scrollLeft
	    };
   }else{
	   	return {
	   		top:0,
	   		width:0,
	   		height:0,
	   		left:0
	   	};
   }
}
function showStep(guideId,step,closeCallback,nextCallback,prevCallback,summaryStep){
	window.scrollTo(0,0);
	var id=global.guid();
	var  elementPosition = _getOffset($(step.element.selector)[0]);
	if(!$(step.element.selector)[0] ||
		(elementPosition.top==0 && elementPosition.width==0 && elementPosition.height==0 && elementPosition.left==0)){
		if(typeof nextCallback=="function"){
			nextCallback();
		}else if(typeof closeCallback=="function"){
			closeCallback("ErrorClose");
		}
		return;
	}
	helperLayerCSSText = 'width:'+(elementPosition.width+10)+'px; height:'+(elementPosition.height+10)+'px; top:'+(elementPosition.top-5)+ 'px; left:'+(elementPosition.left-5)+'px;';
	//$("body").append('<div class="walkthrough-overlay '+guideId+'" style="top: 0px; bottom: 0px; left: 0px; right: 0px; position: fixed; opacity: 0.8;"></div>');
	
	var node = document.createElement("div");
 	node.className = "walkthrough-overlay "+guideId;
 	node.style.cssText="top: 0px; bottom: 0px; left: 0px; right: 0px; position: fixed; opacity: 0.5;";
 	node.onclick=closeCallback;
 	document.body.appendChild(node);
 	var fixedElementCSS="";
  	if(_isFixed($(step.element.selector)[0])){
  		fixedElementCSS="walkthrough-fixedTooltip";
  	}
	$("body").append('<div class="walkthrough-helperLayer '+guideId+' '+fixedElementCSS+'" style="'+helperLayerCSSText+'"></div>');
	$("body").append('<div class="walkthrough-tooltipReferenceLayer '+guideId+' '+fixedElementCSS+'"  id="'+id+'"  style="'+helperLayerCSSText+'"></div>');
	ReactDOM.render(<Guide step={step} closeCallback={closeCallback} nextCallback={nextCallback} prevCallback={prevCallback} summaryStep={summaryStep}/>,document.getElementById(id));
    
    //setTimeout(function(){
	    var windowSize={};
	    if(window && window.innerWidth !== undefined){
			windowSize= { width: window.innerWidth, height: window.innerHeight };
		}else{
			var D=document.documentElement;
			windowSize= { width: D.clientWidth, height: D.clientHeight };
		}
	  
	 	var toolTipPosition=_getOffset($(".walkthrough-tooltip")[0]);
	    if (toolTipPosition.left + toolTipPosition.width > windowSize.width) {
	      //$(".walkthrough-tooltip").css("left",(windowSize.width - toolTipPosition.width - toolTipPosition.left) + 'px');
	      $(".walkthrough-tooltip")[0].style.removeProperty("left");
	    }
	    if (toolTipPosition.left< 0) {
	      $(".walkthrough-tooltip").css("left", (-elementPosition.left+10) + 'px');
	    }
	    
		var rect = $(step.element.selector)[0].getBoundingClientRect();
	    if (!_elementInViewport($(step.element.selector)[0]) || !_elementInViewport($(".walkthrough-tooltip")[0])){
	      var top = rect.bottom - (rect.bottom - rect.top);
	      if (top < 0 || $(step.element.selector)[0].clientHeight > windowSize.height) {//scroll down
	        window.scrollBy(0, rect.top - ((windowSize.height / 2) -  (rect.height / 2)));
	      } else {
	        window.scrollBy(0, rect.top - ((windowSize.height / 2) -  (rect.height / 2)));
	      }
	    }
	    
	    
    //},1000);
    lockScroll();
}

var Guide=React.createClass({
	render:function(){
		return (
		<div className="walkthrough-tooltip" role="dialog" style={{right: this.props.summaryStep?"calc(50% - 150px)":"0px", top: "50px"}}>
			{(typeof this.props.closeCallback=="function")?<span className="icons8-delete fa-x pull-right link pointer" onClick={this.props.closeCallback}/>:""}
			<div className="">{this.props.step.heading}</div>
			<div className="">{this.props.step.subHeading?this.props.step.subHeading:""}</div>
			<div className="walkthrough-arrow top-middle" style={{display: "inherit"}}></div>
			<div className="walkthrough-tooltipbuttons">
				{(typeof this.props.prevCallback=="function")?<span onClick={this.props.prevCallback} className="blueLink link pointer pull-left">{this.props.summaryStep?"Skip":"Previous"}</span>:""}
       			{(typeof this.props.nextCallback=="function")?<span onClick={this.props.nextCallback} className="blueLink link pointer pull-right">{this.props.summaryStep?"Continue":"Next"}</span>:(
       				(typeof this.props.closeCallback=="function")?<span onClick={this.props.closeCallback} className="blueLink link pointer pull-right">Got it</span>:""
       			)}
			</div>
	</div>)
		
	}
});



function _elementInViewport(el) {
	var rect = el.getBoundingClientRect();
	try{if(el.tagName.toLowerCase()=="body"){
	 return true;
	}}catch(err){}
	return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      (rect.bottom+80) <= window.innerHeight && 
      rect.right <= window.innerWidth
    );
 }
 
 function _isFixed (element) {
 	var p = element.parentNode;
 	if (!p || p.nodeName === 'HTML'){return false;}
 	if (_getPropValue(element, 'position') === 'fixed') {return true;}
 	return _isFixed(p);
 }
 function _getPropValue (element, propName) {
 	var propValue = '';
 	if (element.currentStyle) { //IE
      propValue = element.currentStyle[propName];
    } else if (document.defaultView && document.defaultView.getComputedStyle) { //Others
      propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propName);
    }
    if (propValue && propValue.toLowerCase) {
      return propValue.toLowerCase();
    } else {
      return propValue;
    }
  }
