/**
 * @author Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var dynamicUI = require("../view/dynamicUI.jsx"); 
var changeId=require('../view/components/changeId.jsx');
var manageRecords=require('../records/manageRecords.jsx');
var RecordDetailStore = require('../../stores/RecordDetailStore');
var SchemaStore = require('../../stores/SchemaStore');
var Editor = require('../records/richTextEditor.jsx').MyEditor;

var Utility=require("../Utility.jsx");
var global=require('../../utils/global.js');

var browserHistory=require('react-router').browserHistory;

var layout;
var uniqueSchemaObj;
var layoutNames=[];
var filterSchemaData;
var undoActions=[];
function cleanObject(){
    layout = {};
    layout["layout"]={};
    layout["style"]={}; 
    layout["structure"]={};
    layout["structure"]["root"]={};
    undoActions=[];
    cleanLayout();
}
function cleanLayout(){
    layout["layout"]["lg"]={};
    layout["layout"]["md"]={};
    layout["layout"]["sm"]={};
    layout["layout"]["xs"]={};
}
function createNewLayout(type,subType){
    common.clearMainContent();
    cleanObject();
    ReactDOM.render(<NewLayout mode={subType} />,document.getElementById('dynamicContentDiv'));
}
exports.createNewLayout=createNewLayout;

var CreateLanding=React.createClass({
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return <NewLayout  mode={"create"} />
	}
});
exports.CreateLanding=CreateLanding;

var EditLanding=React.createClass({
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return <NewLayout  mode={"edit"} />
	}
});
exports.EditLanding=EditLanding;


var Template=React.createClass({
	getInitialState: function() {
        return {lpis:undefined};
    },
	componentDidMount:function(){
		var self=this;
		WebAPI.getAllLandingPages(function(result){
			if(result.error){
				alert("There was an error");	
			}else{
            	self.setState({lpis:result});
            }
        });
	},
	render:function(){
		if(this.props.route && this.props.route.path && this.props.route.path.indexOf("template")!=-1 && this.state.lpis){
			return <DefinedTemplated lpis={this.state.lpis} />
		}
		return (<div className="hidden" />)
	}
	
})
exports.Template=Template;

var DefinedTemplated=React.createClass({
	getInitialState: function() {
          return {defaultLpis:[],userLpis:[]};
    },
    componentDidMount:function(){
    	var defaultLpis=[];
    	var userLpis=[];
    	var lpis=this.props.lpis;
    	for(var i=0;i<lpis.length;i++){
    		if(lpis[i] && lpis[i].landingType){
    			if(lpis[i].landingType=="defaultTemplate"){
    				defaultLpis.push(lpis[i]);
    			}else if(lpis[i].landingType=="userTemplate"){
    				userLpis.push(lpis[i]);
    			}
    		}
    	}
    	this.setState({defaultLpis:defaultLpis,userLpis:userLpis})
    },
    goToLanding:function(lpi,defaultLayout,newLayout){
    	
    	ReactDOM.render(<NewLayout mode={typeof newLayout=="string"?"create":"edit"} lpi={lpi} defaultLayout={defaultLayout} fromTemplate={true}/>,this.templateDiv)
    },
    setDiv:function(lpi,defaultLayout){
    	return (<div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
					<div className="text-center text-uppercase link" onClick={this.goToLanding.bind(null,lpi,defaultLayout)} style={{"border": "1px solid lightgrey","padding": "50px"}}>
						{lpi.templateName}
					</div>
				</div>)
    },
    render:function(){
    	var self=this;
    	
    	return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.templateDiv=e}}>
    				<h1 className={this.state.userLpis.length>0?"":"hidden"}>Pages</h1>
    				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
		    			<div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
							<div className="text-center text-uppercase link" onClick={this.goToLanding.bind(null,{},undefined,"create")} style={{"border": "1px solid lightgrey","padding": "50px"}}>
								CREATE A NEW PAGE
							</div>
						</div>
	    			{
	    				this.state.userLpis.map(function(lpi){
	    					return self.setDiv(lpi);
	    				})
	    			}
	    			
	    			</div>
    				<h1 className={this.state.defaultLpis.length>0?"":"hidden"}>Templates</h1>
    				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
	    			{
	    				this.state.defaultLpis.map(function(lpi){
	    					return self.setDiv(lpi,true);
	    				})
	    			}
	    			</div>
	    			
    			</div>)
    }
})

var NewLayout = React.createClass({
    getInitialState: function() {
        return {helpText:undefined,data:undefined};
    },
    componentWillUnmount: function() {
        
    },
    componentWillMount:function(){
    	cleanObject();
    },
    componentDidMount:function(){
        var self=this;
        if(this.props.fromTemplate){
        	if(this.props.mode=="edit"){
        		this.landingPageSelected(this.props.lpi.recordId);
        	}
        }
        WebAPI.getDefinition("HelpTextForDefineLayout",function(result){
            if(result.error){
                return;
            }
            self.setState({helpText:result});
        });
        
    },
    fillData:function(){
        var data=this.state.data;
        if(data){
            this.layoutName.value=data.templateName;
            this.layoutName.disabled=true;
            this.gridSpan.value="lg";
            if(data.htmlMeta){
                document.getElementById("layoutMetaTitle").value=data.htmlMeta.title?data.htmlMeta.title:"";
                document.getElementById("layoutMetaDescription").value=data.htmlMeta.description?data.htmlMeta.description:"";
                document.getElementById("layoutMetaKeywords").value=data.htmlMeta.keywords?data.htmlMeta.keywords:"";
                document.getElementById("layoutOGTitle").value=data.htmlMeta.ogTitle?data.htmlMeta.ogTitle:"";
                document.getElementById("layoutOGDescription").value=data.htmlMeta.ogDescription?data.htmlMeta.ogDescription:"";
                document.getElementById("layoutImageSrc").value=data.htmlMeta.image_src?data.htmlMeta.image_src:"";
            }
         	document.getElementById("webCrawlerIndex").checked=data.webCrawlerIndex?true:false;
         	//document.getElementById("uniqueUserName").value=data["@uniqueUserName"]?data["@uniqueUserName"]:"";
         	   
         	
            layout=data;
            fillDataStructure(layout.structure.root);
            enableSorting();
        }
    },
    deleteLayout:function(){
    	var self=this;
    	if(confirm("Confirm Deletion: "+layout.recordId)){
    		WebAPI.deleteDefinition(layout.recordId,function(result){
    			common.createAlert("",layout.recordId+" Deleted");
    			self.setState({data:undefined});
    			//browserHistory.push("/admin/landing/edit");
    		});
    	}
    },
    viewLayout:function(ev){
        if(formLayoutObject()){
            /*var node=document.createElement("div");
            node.id= global.guid();
            node.className="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
            document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
            ReactDOM.render(<common.PopUpComponent layoutJSON={layout}/>,node);  
            */
            
	       	var node = document.createElement("div");
	        node.id = global.guid();
	        var popUpId = global.guid();
	        var contentDivId = global.guid();
	        var sideDivId = global.guid();
	        node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	        ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
	       	ReactDOM.render(<dynamicUI.DynamicUI templateJSON={layout}/>,document.getElementById(contentDivId));
	            
            
        };
    },
    saveAsLayout:function(){
    	var self=this;
    	
		var node = document.createElement("div");
		node.title = "Save As";
		node.innerHTML='<h4>Enter The Layout Name to Be Saved</h4><input type="text" style="z-index:10000" id="saveAsLayoutName"/>';
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		/*$("input#saveAsLayoutName").blur(function(){
		     self.layoutName.value=name;
			 self.checkLayoutName(function(layoutExists){
			 	
			 });
		});*/
		$(node).dialog({
				  dialogClass: "no-close",
				  buttons: [
				    {
				      text:"OK",
				      click:function(){
				      	var name = $('input[id="saveAsLayoutName"]').val();
				      	 self.layoutName.value=name;
				      	 self.checkLayoutName(function(layoutExists){
						 	if(!layoutExists){
						 		delete layout["recordId"];
						 		layout["landingType"]="userTemplate";
						 		self.saveLayout();
						 	}
						});
				        $(this).dialog("destroy");
				        this.remove();
				       
				      }
				    },
				    {
				      text:"CANCEL",
				      click:function(){
				        $(this).dialog("destroy");
				        this.remove();
				      }
				    }
				  ]
				});
    	
    },
    saveLayout:function(){
        if(formLayoutObject()){
          	common.startLoader();
            WebAPI.saveDefinition(layout,function(result){
            	common.stopLoader();
                common.createAlert("","layout data saved");
            });
        }
    },
    showLayoutOption:function(ev){
        var targetNode;
        var elementData;
        if(ev.target.id=="layoutDiv" || $(ev.target).hasClass("gridDiv")){
            targetNode=ev.target;
            elementData=layout.style[targetNode.dataset.no];
        }else{
            targetNode=$(ev.target).parents("div.gridDiv:eq(0)")[0];
            $(ev.target).hasClass("contentDiv") ? elementData=$(ev.target).data().style : elementData=$(ev.target).parents("div.contentDiv:eq(0)").data().style;
            if(ev.target.nodeName=="DIV"){
                elementData=layout.style[targetNode.dataset.no];
            }
        } 
        
        
        
       // var node = document.createElement("div");
        //node.id = global.guid();
        //var popUpId = global.guid();
        //var contentDivId = global.guid();
        //v/ar sideDivId = global.guid();
        //node.className = "smallDialogBox";
        var oldBorder=targetNode.style.border;
        //document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        /*ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true} clear={function(){
        targetNode.classList.remove("big-border-white-screen");
        targetNode.classList.add("add-border-white-screen");
        }}/>,this.innerSideContent);*/
       try {
		    ReactDOM.unmountComponentAtNode(this.innerSideContent);
		  } catch (e) {
		    console.error(e);
		  }
		  this.sideContent.className+=" hidden";
		  this.innerSideContent.className=this.innerSideContent.className.replace(/hidden/g,"")
		  var self=this;
        ReactDOM.render(<ShowLayoutOptions 
                                targetNode={targetNode} 
                                actTarget={ev.target} 
                                close={function(){
                                	    targetNode.classList.remove("big-border-white-screen");
        								targetNode.classList.add("add-border-white-screen");
        								self.sideContent.className=self.sideContent.className.replace(/hidden/g,"");
		  								self.innerSideContent.className+=" hidden";
                                }}
                                elementData={elementData}
                                />,this.innerSideContent);
    },
    setGridSize:function(){
    	var gridText=this.gridSpan.value;
     //   if(this.gridSpan.textContent!=gridText){
            //this.rootNode.querySelectorAll("#gridSpan")[0].innerHTML=gridText;
            if($(".gridDiv").length!=0){
               if(gridText=="lg"){
                   enableSorting();
               }else{
                   $(".gridDiv").parent().sortable('disable');
               } 
            }
            setDivSizes(gridText);
        //}
    },
    checkLayoutName : function(callback){
    	var flag=false;
        var name=this.layoutName.value;
        if(name!=""){
            common.startLoader();
            WebAPI.getAllLandingPages(function(lpis){
            	for(var i=0;i<lpis.length;i++){
                    if(lpis[i].templateName==name){
                        this.layoutName.value="";
                        flag=true;
                        common.createAlert("","Layout already exists. Choose a different name");
                        break;
                    }
                }
                if(typeof callback=="function"){
                	callback(flag);
                }
                common.stopLoader();
            });
        }
    },
   landingPageSelected:function(lpi){
        //ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
        cleanObject();
       	var self=this;
        WebAPI.getDefinition(lpi,function(result){
        	if(result["landingType"]=="defaultTemplate" && self.props.mode=="edit"){
	    		delete result["@uniqueUserName"];
	    	}
        	self.setState({data:result},function(){
        		self.fillData();
        	});
            //ReactDOM.render(<NewLayout data={result}/>,document.getElementById('dynamicContentDiv'));
        }.bind(this));
   },
    getLandingPage:function(){
        var node = document.createElement("div");
        node.id = global.guid();
        var popUpId = global.guid();
        var contentDivId = global.guid();
        var sideDivId = global.guid();
        node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<Utility.SelectLandingPage callback={this.landingPageSelected} popUpId={popUpId} />,document.getElementById(contentDivId));
    },
    render : function(){
        var self=this;
       if(this.props.mode=="edit" && !this.state.data ){
           return(<div ref={(e)=>{this.rootNode=e}} className="row remove-margin-right remove-margin-left margin-top-gap" ref={(e)=>{this.layoutNameDiv=e}}>
                    <label className="text-uppercase">Select landing page</label>
                    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
                         <input type='text' ref={(e)=>{this.layoutName=e}} id="layoutName" className="form-control no-padding-left" placeholder="select layout" onClick={this.getLandingPage}/>
                     </div>
                </div>)
       }else{
           return(<div ref={(e)=>{this.rootNode=e}} className="row remove-margin-right">
           			<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left margin-top-gap">
           				<div className="col-lg-3 col-md-4 col-xs-4 col-sm-6 no-padding-left no-padding-right" style={{"position":"fixed","zIndex":"99","paddingBottom":"40px","background":"white","overflowY":"auto","height":"88.5%","top":"11.5%"}}>
           				
					        <div className={"col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding slideLanding"} ref={(e)=>{this.sideContent=e}}  >
				                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left form-group">
			                            <input type='text' ref={(e)=>{this.layoutName=e}} id="layoutName" className="form-control no-padding-left" placeholder="Enter layout name" onBlur={this.checkLayoutName}/>
			                      </div>
			                      <div className="col-lg-12 col-md-12  col-sm-6 col-xs-12 no-padding-left form-group">
			                        	 <div className="display-inline-block extra-padding-right">
			                        	 	Change Grid
			                        	 </div>
				                        <div className="link unequalDivs extra-padding-right vertical-align-top nextPrevIcons">
					                       <select className="form-control" id="gridSpan" ref={(e)=>{this.gridSpan=e}}  onChange={self.setGridSize}>
											  	<option value={"lg"}>lg</option>
											  	<option value={"md"}>md</option>
											  	<option value={"sm"}>sm</option>
											  	<option value={"xs"}>xs</option>
											 </select>
		                              	</div>
			                      </div>
			                      <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
			                         <changeId.ChangeId data={this.state.data} mode={this.props.mode} landingPage={true}/>
			                      </div>
				                  <div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-bottom-gap link collapsed"}  data-toggle="collapse" data-target={"#MetaDivCollapse"} aria-expanded="true">
				                        <div className="parent-img-component col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
				                            <div className="child-img-component">Meta Data</div>
				                            <div className="pull-right child-img-component no-padding"><span className="collapseLayout icons8-plus-math fa-2x"></span></div>
				                         </div>
				                   </div>
				                   <div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding-left collapse"} id={"MetaDivCollapse"}>
					                    <div className="remove-margin-left remove-margin-right row form-group">
					                         <div className={"col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"}>
					                            HTML Meta tags content
					                         </div>
					                        <div className={"col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding "}>
					                        TITLE
					                        <input type="text" ref={(e)=>{this.layoutMetaTitle=e}} id="layoutMetaTitle" className="form-control"/>
					                        DESCRIPTION
					                        <textarea  ref={(e)=>{this.layoutMetaDescription=e}}  id="layoutMetaDescription" className="form-control"/>
					                        KEYWORDS
					                        <textarea  ref={(e)=>{this.layoutMetaKeywords=e}} id="layoutMetaKeywords" className="form-control"/>
					                        OG:TITLE
					                         <input type="text" ref={(e)=>{this.layoutOGTitle=e}} id="layoutOGTitle" className="form-control"/>
					                        OG:DESCRIPTION
					                         <input type="text" ref={(e)=>{this.layoutOGDescription=e}} id="layoutOGDescription" className="form-control"/>
					                        IMAGE_SRC
					                         <input type="text" ref={(e)=>{this.layoutImageSrc=e}} id="layoutImageSrc" className="form-control"/>
					                        </div>
					                        
					                        <input type="text" ref={(e)=>{this.uniqueUserName=e}}  className="form-control hidden"/>
					                        ENABLE WEB CRAWLER INDEXING
											<input type="checkbox" 
													ref={(i)=>{this.webCrawlerIndex=i}}
													className=""
													id="webCrawlerIndex" />
											
					                    </div>
				                   </div>
				                   <div className="row remove-margin-left remove-margin-right  ">
				                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						                    <label>
						                        <input type='button' className="upload-btn no-margin" onClick={this.props.defaultLayout?this.saveAsLayout:this.saveLayout} value='SAVE'/>
						                    </label>
						                     {(this.state.data)?(<label className="extra-padding-left">
						                        <input type='button' className="action-button" onClick={this.deleteLayout} value='DELETE'/>
						                    </label>):("")}
						                </div> 
				                        
				                    </div>
				            </div>
				            
		                    <div className={"col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding hidden slideLanding"} ref={(e)=>{this.innerSideContent=e}}  >
		                
		                    </div>
			           </div>
                   
                    <div className="col-lg-9 col-md-9 col-xs-12 col-sm-12 no-padding" style={{"left":"27%"}}>
	                    <div className="row remove-margin-left previewDiv">
	                    	<div  className="link preview " title="Preview" onClick={this.viewLayout}>
	                    		<i className="fa fa-arrows-v fa-2x" style={{"transform": "rotate(135deg)"}}></i></div>
	                       {/*<input type='button' className="upload-btn form-group pull-right extra-padding-right remove-margin-top" onClick={this.viewLayout} value='PREVIEW'/>*/}
		                    <div id="layoutDiv" ref={(e)=>{this.layoutDiv=e}} onDoubleClick={this.showLayoutOption} className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-right form-group add-border-white-screen">
		                        
		                    </div>
		                 </div>
	                 </div>
                   </div> 
            </div>)
       }
    }
});
function setDivSizes(gridText){
    Object.keys(layout["layout"][gridText]).map(function(key){
        setGridClassWidth($("#layoutDiv").find(".gridDiv[data-no='"+key+"']"),layout["layout"][gridText][key]);
    });
}
function formLayoutObject(){
    layout["templateType"]="LandingPage";
    var layoutName=document.getElementById("layoutName").value;
    if(layoutName==""){
        common.createAlert("","please enter layout name");
        return false;
    }
    layout["templateName"]=layoutName;
    
    layout["htmlMeta"]={
        "title": document.getElementById("layoutMetaTitle").value,
        "description":document.getElementById("layoutMetaDescription").value, 
        "keywords": document.getElementById("layoutMetaKeywords").value,
        "image_src":document.getElementById("layoutImageSrc").value,
        "ogTitle":document.getElementById("layoutOGTitle").value,
        "ogDescription":document.getElementById("layoutOGDescription").value
    };
    layout.webCrawlerIndex=document.getElementById("webCrawlerIndex").checked;
    /*if(document.getElementById("uniqueUserName").value.trim()!=""){
    	layout["@uniqueUserName"]=document.getElementById("uniqueUserName").value.trim();
    }*/
   if(document.getElementById("uniqueUserName")){
   		if(document.getElementById("uniqueUserName").innerHTML.indexOf("<a")!=-1){
   			if(document.querySelectorAll("#uniqueUserName a")[0].innerHTML && 
   					document.querySelectorAll("#uniqueUserName a")[0] && 
   					document.querySelectorAll("#uniqueUserName a")[0].innerHTML!=""){
   				layout["@uniqueUserName"]=document.querySelectorAll("#uniqueUserName a")[0].innerHTML.trim();
   			}
   		}else if(document.getElementById("uniqueUserName").innerHTML!=""){
			layout["@uniqueUserName"]=document.getElementById("uniqueUserName").innerHTML.trim();
   		}
	} 
    layout["dateCreated"]= global.getDate();
 	layout["dateModified"]= global.getDate();
  	layout["author"]= common.getUserDoc().recordId;
   	layout["editor"]= common.getUserDoc().recordId;
    layout["structure"]["root"]={};
    layout.style={};
    nestedLoopHandler($("#layoutDiv"),true);
    layout["recordId"]=layout.hasOwnProperty("recordId") ? layout.recordId : (common.getConfigDetails().cloudPointHostId+"-"+layoutName);
    layout["docType"]="UITemplate";
    return true;
}
var ShowLayoutOptions=React.createClass({
    getInitialState:function(){
        var targetNode=this.props.targetNode;
        var editable=(targetNode.dataset.no!=undefined)?true:false;
        var currentSectionData=undefined;
        var optedSizesFor="new";
        if(editable){
            currentSectionData=getDataObject(targetNode).content;
            if(currentSectionData && currentSectionData.type=="link"){
                if(currentSectionData.image){
                    currentSectionData.linkType="imageLink";
                }else{
                    currentSectionData.linkType="textLink";
                }
            }
            optedSizesFor=undefined;
        }
        return {
            deleteAllowed:false,
            divEdit:editable,
            optedSizesFor:optedSizesFor,
            currentSectionData:currentSectionData,
            prevSectionData:currentSectionData,
            prevContentType:(currentSectionData && currentSectionData.type)?currentSectionData.type:"",
            prevContentData:(currentSectionData && currentSectionData.value)?currentSectionData.value:"",
            valueEntered:false,
            sectionName:(currentSectionData && currentSectionData.sectionName)?currentSectionData.sectionName:""
        };
        
    },
    optForSizes:function(type){
        this.setState({
            optedSizesFor:type
        });
    },
    undo:function(){
    	var lastAction=undoActions.pop();
    	var self=this;
    	if(undoActions.length==0){
			if(document.getElementById("undoButton")){
				document.getElementById("undoButton").className+=" hidden";
			}		
		}
		this.setState({prevSectionData:lastAction.content,currentSectionData:lastAction.content,valueEntered:false},function(){
			self.forceUpdate();
		});
		
    	updateContent(lastAction.target,lastAction.content);
    	/*var type=(lastAction && lastAction.content && lastAction.content.type)?lastAction.content.type:undefined
		if(type && self["opt-"+type]){
			$(self["opt-"+type]).click();
		}*/
    },
    optContentType:function(type){
        var currentContent={};
        var prevContentType="";
        var prevSectionData={};
        var flag=false;
        if(this.state.valueEntered){
        	flag=true;
        }
        if(this.state.currentSectionData){
        	currentContent={};
        	prevSectionData=(this.state.valueEntered)?this.state.currentSectionData:this.state.prevSectionData;
        }
        currentContent["type"]=type;
        this.setState({currentSectionData:currentContent,prevSectionData:prevSectionData,valueEntered:false});
    },
    setLinkType:function(linkType){
        var currentContent=this.state.currentSectionData?Object.assign({},this.state.currentSectionData):{};
        if(linkType=="text"){
            currentContent.linkType="textLink";
        }else if(linkType=="image"){
            currentContent.linkType="imageLink";
            currentContent.image={};
        }
        this.setState({currentSectionData:currentContent});
    },
    setLink:function(){
        var content=this.state.currentSectionData?Object.assign({},this.state.currentSectionData):{};
        content["sectionName"]=this.state.sectionName;
        content.href=this.linkHref.value;
        content.text=this.linkText.value;
        if(content.href==""){
            common.createAlert("","please enter a valid hyper reference");
            return;
        }
        if(content.text==""){
            common.createAlert("","please enter valid anchor text");
            return;
        }
        if(content.linkType=="imageLink"){
            content.image.url=this.imageUrl.value;
            content.image.height=setPixel(this.imageHeight.value);
            content.image.width=setPixel(this.imageWidth.value);
            if(content.image.url==""){
                common.createAlert("","please enter a valid image url");
                return;
            }
        }
        content.type="link";
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
       // this.close();
    },
    editCurrentSectionSizes:function(){
        var targetNode=this.props.targetNode;
        if(targetNode.dataset.no!=undefined){
            var sizes={ 
                    lgSize:this.lgSize.value*1,
                    mdSize:this.mdSize.value*1,
                    smSize:this.smSize.value*1,
                    xsSize:this.xsSize.value*1
            };
            layout["layout"]["lg"][targetNode.dataset.no]=sizes.lgSize;
            layout["layout"]["md"][targetNode.dataset.no]=sizes.mdSize;
            layout["layout"]["sm"][targetNode.dataset.no]=sizes.smSize;
            layout["layout"]["xs"][targetNode.dataset.no]=sizes.xsSize;
            
           var gridText=$("#gridSpan").val();
           editGridClass(targetNode,gridText,layout["layout"][gridText][targetNode.dataset.no]);
       }
       // this.close();        
    },
    duplicateSection:function(){
    	var self=this;
    	var targetNode=this.props.targetNode;
        if(targetNode.dataset.no!=undefined){
            var parentNo=targetNode.parentNode.dataset.no;
	        var newDivNo=((parentNo!=undefined)?(parentNo+"."):"")+($(targetNode.parentNode).find(">.gridDiv").length+1);
	        var currentDivNo=targetNode.dataset.no;
	        var currentDivPath=[];
	        
	        var copyEvalStringLeft='layout["structure"]["root"]';
	        var swapContentPath='';
	        var copyEvalStringRight='layout["structure"]["root"]';
			newDivNo.split(".").map(function(rtn,index){
				if(index<newDivNo.split(".").length){
					copyEvalStringLeft +='["'+newDivNo.split(".").slice(0,index+1).join(".") +'"]';
					swapContentPath +='["'+newDivNo.split(".").slice(0,index+1).join(".") +'"]';
				}
			});
			currentDivNo.split(".").map(function(rtn,index){
				if(index<currentDivNo.split(".").length){
					copyEvalStringRight +='["'+currentDivNo.split(".").slice(0,index+1).join(".") +'"]';
					currentDivPath.push(currentDivNo.split(".").slice(0,index+1).join("."));
				}
			});
			
			var swapContent={};
			copyContent(currentDivPath,newDivNo,layout["structure"]["root"]);
					
	        function copyContent(currentPath,newDivNo,rootLayout){
	        	var newPath=JSON.parse(JSON.stringify(currentPath));
	        	for(var index=0;index<newPath.length;index++){
	        		if(newPath[index].split(".").length>=newDivNo.split(".").length){
	        			/*var regex=new RegExp("^.{"+newDivNo.length+"}");
	        			newPath[index]=newPath[index].replace(regex,newDivNo);*/
	        			var tp=newPath[index].split(".");
	        			newDivNo.split(".").map(function(v,i){
	        				tp[i]=v;
	        			});
	        			newPath[index]=tp.join(".");
	        		}
	        	}
	        	["lg","md","sm","xs"].map(function(bs){
					layout["layout"][bs][newPath[newPath.length-1]]=layout["layout"][bs][currentPath[currentPath.length-1]];	
		        });
		        layout["style"][newPath[newPath.length-1]]=layout["style"][currentPath[currentPath.length-1]];
		        var path="";
    			newPath.map(function(tk,tkin){
    				path+='["'+tk+'"]';
    				if(eval('swapContent'+path)==undefined){
    					eval('swapContent'+path+'={}');
    				}
    			});
    			var contentPath="";
    			currentPath.map(function(tk,tkin){
    				contentPath+='["'+tk+'"]';
    			});
	        	if(eval('rootLayout'+contentPath).hasOwnProperty("content") || Object.keys(eval('rootLayout'+contentPath)).length==0){
	        		eval('swapContent'+path+'=rootLayout'+contentPath);
	        	}else{
	        		eval('swapContent'+path+'={}');
	        		for(var key in eval('rootLayout'+contentPath)){
	        			var loopPath=JSON.parse(JSON.stringify(currentPath));
	        			loopPath.push(key);
	        			copyContent(loopPath,newDivNo,layout["structure"]["root"]);
	        		}
	        	}	
	        }
	        
			eval(copyEvalStringLeft+"=JSON.parse(JSON.stringify(swapContent"+swapContentPath+"))");
			//this.close();
	        $("#layoutDiv").html("");
     		fillDataStructure(layout.structure.root);
       }else{
       //	this.close();
       }
    },
    createNewSection:function(type){
        var targetNode=this.props.targetNode;
        var self=this;
        sizes={ 
                lgSize:12,
                mdSize:12,
                smSize:12,
                xsSize:12
            };
        sizes={ 
                lgSize:this.lgSize.value*1,
                mdSize:this.mdSize.value*1,
                smSize:this.smSize.value*1,
                xsSize:this.xsSize.value*1
            };
        //this.basicContainer.innerHTML="";
        var newDiv=document.createElement("div");
        //newDiv.className="gridDiv add-border-white-screen col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
        newDiv.className="gridDiv add-border-white-screen col-lg-"+sizes.lgSize+" col-md-"+sizes.mdSize+" col-sm-"+sizes.smSize+" col-xs-"+sizes.xsSize+" no-padding";
        if(type=="newAbove"){
        	
	        var parentNo=targetNode.parentNode.dataset.no;
	        var divNo=$(targetNode.parentNode).find(">.gridDiv").length;
	        if(parentNo!=undefined){
	            newDiv.dataset.no=parentNo+"."+divNo;
	        }else{
	            newDiv.dataset.no=divNo;
	        }
        	targetNode.parentNode.insertBefore(newDiv,targetNode);
        }else if(type=="newBelow"){
        	
	        var parentNo=targetNode.parentNode.dataset.no;
	        var divNo=$(targetNode.parentNode).find(">.gridDiv").length;
	        if(parentNo!=undefined){
	            newDiv.dataset.no=parentNo+"."+divNo;
	        }else{
	            newDiv.dataset.no=divNo;
	        }
        	targetNode.parentNode.insertBefore(newDiv,targetNode.nextSibling);
        }else{
        	
	        var parentNo=targetNode.dataset.no;
	        var divNo=$(targetNode).find(">.gridDiv").length;
	        if(parentNo!=undefined){
	            newDiv.dataset.no=parentNo+"."+divNo;
	        }else{
	            newDiv.dataset.no=divNo;
	        }
        	targetNode.appendChild(newDiv);
        }
        $(newDiv).data("style",{});
        var gridWidth=Math.round(($(targetNode).width()-2)/12);
        $(newDiv).resizable({
            autoHide: true,
            containment: "parent",
            grid:gridWidth,
            stop: function( event, ui ) {
               var gridText=$("#gridSpan").val();
               var currDiv=ui.originalElement.attr("data-no");
               var gridSize=Math.round(($(ui.originalElement).width()-2)/(($(ui.originalElement).parent().width()-2)/12));
               editGridClass(ui.originalElement,gridText,gridSize);
               layout["layout"][gridText][currDiv]=gridSize;
               setDivSizes(gridText);
            }
        });
        //if($("#gridSpan").val()=="lg"){
           enableSorting();
        //}
        //console.log("Created New div With no   "+newDiv.dataset.no);
        getDataObject(newDiv);// to initialize div in layout[structure][root] object
        layout["layout"]["lg"][newDiv.dataset.no]=sizes.lgSize;//Math.round($(newDiv).width()/gridWidth);
        layout["layout"]["md"][newDiv.dataset.no]=sizes.mdSize;//Math.round($(newDiv).width()/gridWidth);
        layout["layout"]["sm"][newDiv.dataset.no]=sizes.smSize;//Math.round($(newDiv).width()/gridWidth);
        layout["layout"]["xs"][newDiv.dataset.no]=sizes.xsSize;//Math.round($(newDiv).width()/gridWidth);
        layout["style"][newDiv.dataset.no]={};
       //	this.close();
    },
    deleteSection:function(){
        var targetNode=this.props.targetNode;
        if(targetNode.id!="layoutDiv"){
            //if(confirm("Are you sure to delete this")){
                var currObj=getDataObject(targetNode);
                delete currObj.content;
                targetNode.remove();
                cleanLayout();
                nestedLoopHandler($("#layoutDiv"));
           //     this.close();
            //}
        }
    },
    applySchemaContent:function(content,prevData){
        content["sectionName"]=this.state.sectionName;
        if(!isEquivalent(content, prevData)){
        	this.setState({valueEntered:true,currentSectionData:content});
        	updateContent(this.props.targetNode,content);
        	undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
        }
       
       // this.close();
    },
    setText:function(){
        var content={};
        content["sectionName"]=this.state.sectionName;
        content["type"]="text";
        content["value"]=this.text.value;
        content["style"]={
            "white-space":"pre-wrap",
            "font-weight":this.headingFontWeight.value,
            "fontWeight":this.headingFontWeight.value
        };
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
       // this.close();
    },
    setRichTextOnTheFly:function(text){
        var currentContent=this.state.currentSectionData?Object.assign({},this.state.currentSectionData):{};
        currentContent.value=text;
        this.setState({currentSectionData:currentContent});
    },
    setRichText:function(){
        var content={};
        content["sectionName"]=this.state.sectionName;
        content["type"]="richText";
        content["value"]=this.state.currentSectionData.value;
        content["style"]={};
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType,this.state.prevContentData);
       // this.close();
    },
    setHeading:function(){
        var content={};
        content["sectionName"]=this.state.sectionName;
        content["type"]="heading";
        content["value"]=this.headingText.value;
        content["headingNumber"]=(this.headingNumber && this.headingNumber.innerText && this.headingNumber.innerText.toLowerCase().indexOf("heading")!=-1?this.headingNumber.innerText.replace(/heading/ig,""):this.headingNumber.innerText);
        content["style"]={
            "white-space":"pre-wrap",
            "font-weight":this.headingFontWeight.value,
            "fontWeight":this.headingFontWeight.value
        };
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
       // this.close();
    },
    setIconClassNames:function(){
        var content={};
        content["sectionName"]=this.state.sectionName;
        content["type"]="icon";
        content["classNames"]=this.iconClassNames.value;
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
      //  this.close();
    },
    setImageOrVideo:function(type){
        var content={};
        content["sectionName"]=this.state.sectionName;
        var imageUrl=this.imageUrl.value;
        var alt=this.imageAlt.value;
        if(imageUrl==""){
            common.createAlert("","please enter url");
            return;
        }
        if(alt==""){
            common.createAlert("","please enter alt value");
            return;
        }
        content.type=type;
        try{content.videoType=this.videoType.value;}catch(err){}
        content.url=imageUrl;
        content.alt=alt;
        content.width=setPixel(this.imageWidth.value);
        content.height=setPixel(this.imageHeight.value);
        content.altText=this.imageAltText.value;
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
      //  this.close();
    },
    setSearchBar:function(){
        var searchPlaceholder=this.searchBarPlaceholder.value;
        if(searchPlaceholder!=""){
            var content={};
            content["type"]="searchBar";
            content["sectionName"]=this.state.sectionName;
            content["placeholder"]=searchPlaceholder;
            content["searchButtonBGColor"]=this.searchBarBGColor.value;
            content["searchButtonFGColor"]=this.searchBarFGColor.value;
             this.setState({valueEntered:true,currentSectionData:content});
            updateContent(this.props.targetNode,content);
            undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
          //  this.close();
        }else{
            common.createAlert("","please enter searchbar placeholder");
        }
    },
    landingPageSelected:function(lpi){
         var content={};
         content["sectionName"]=this.state.sectionName;
         content["type"]="landingPage";
         content["lpi"]=lpi;
         this.setState({valueEntered:true,currentSectionData:content});
         updateContent(this.props.targetNode,content);
         undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
       //  this.close();
   },
    getLandingPage:function(){
        var node = document.createElement("div");
        node.id = global.guid();
        var popUpId = global.guid();
        var contentDivId = global.guid();
        var sideDivId = global.guid();
        node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<Utility.SelectLandingPage callback={this.landingPageSelected} popUpId={popUpId} />,document.getElementById(contentDivId));
    },
    setDetail:function(){
        var content={};
        content["sectionName"]=this.state.sectionName;
        content["type"]="detail";
        content["schema"]=this.detailSchemaName.value.trim();
        content["dependentSchema"]=this.detailDependentSchemaName.value.trim();
        content["recordId"]=this.detailRecordId.value.trim();
        content["org"]="public";
        if(content.schema==""){
            common.createAlert("","Please enter schema name");
            return;
        }
        if(content.dependentSchame==""){
            delete content.dependentSchema;
        }
        if(content.recordId==""){
            common.createAlert("","Please enter recordId");
            return;
        }
        this.setState({valueEntered:true,currentSectionData:content});
        updateContent(this.props.targetNode,content);
        undoStyle(this.props.targetNode,this.state.prevSectionData,this.state.prevContentType);
       // this.close();
    },
    close:function(){
        //this.componentWillUnmount();
        common.showMainContainer();
        if(typeof this.props.close!="undefined"){
        	this.props.close();	
        }
       // document.getElementById(this.props.popUpId).parentNode.remove();
        //$('.modal-backdrop').remove();
    },
    componentWillUnmount:function(){
        this.props.targetNode.classList.remove("big-border-white-screen");
        this.props.targetNode.classList.add("add-border-white-screen");
    },
    componentDidMount:function(){
        this.props.targetNode.classList.remove("add-border-white-screen");
        this.props.targetNode.classList.add("big-border-white-screen");
      $('#layoutPopup a').click(function (e) {
          e.preventDefault();
          $(this).tab('show');
       });
   },
   setSectionName:function(){
        this.setState({sectionName:this.sectionName.value.trim()});
   },
   navigateToSub:function(menuItem){
   	var menuItems=["manageSections","presentation","content"];
   	if(menuItems.indexOf(menuItem)!=-1){
   		var self=this;
   		menuItems.map(function(item){
   			if(document.getElementById(item)){
	   			if(item==menuItem){
	   				document.getElementById(item).className=document.getElementById(item).className.replace(/hidden/g,"");	
	   			}else{
	   				document.getElementById(item).className+=" hidden";
	   			}
	   			self.designHeader.className+=" hidden";
   				self.designContent.className=self.designContent.className.replace(/hidden/g,"");		
	   		}
   		});
   	}
   },
   goToDesign:function(value){
   		var self=this;
   		if(undoActions.length>0){
	   		common.createConfirm("Save","Do you want to save the changes",function(confirm){
				if(confirm){
					undoActions=[];
					self.setState({prevSectionData:self.state.currentSectionData,valueEntered:false},function(){
						self.forceUpdate();
						hideUndoButton();
					});	
					closeDesign();
				}else{
					common.createConfirm("Discard","Do you want to discard your changes?",function(confirm1){
						if(confirm1){
							self.popUndoActions(undoActions.length-1);
							closeDesign();	
						}else{
							
						}
					})
				}
			});
		}else{
			closeDesign();
		}
		
		function closeDesign(){
	   		self.designContent.className+=" hidden";
			self.designHeader.className=self.designHeader.className.replace(/hidden/g,"");
		}
   		
   }, 
   popUndoActions:function(index){
   		var self=this;
		if(index!=0){
			undoActions.pop();
			popUndoActions(undoActions.length-1);
		}else{
			var lastAction=undoActions.pop();
			this.setState({prevSectionData:lastAction.content,currentSectionData:lastAction.content,valueEntered:false},function(){
				self.forceUpdate();
				hideUndoButton();
			});	
			updateContent(lastAction.target,lastAction.content);
		}
   },
   selectHeading:function(headingNumber){
   		if(headingNumber && (headingNumber*1)>0){
   			this.headingNumber.innerHTML="heading"+headingNumber;
   		}
   },
   selectheadingFontWeight:function(headingFontWeight){
   		if(headingFontWeight && (headingFontWeight.length)>0){
   			this.headingFontWeight.innerHTML=headingFontWeight;
   		}
   },                      
   render : function(){
         var targetNode=this.props.targetNode;
         var self=this;
         var sizes={
                    lgSize:12,
                    mdSize:12,
                    smSize:12,
                    xsSize:12
                };
                
		if(this.state.optedSizesFor=="current"){
                sizes={    
                        lgSize:(targetNode.dataset.no && layout["layout"]["lg"] && layout["layout"]["lg"][targetNode.dataset.no])?layout["layout"]["lg"][targetNode.dataset.no]:12,
                        mdSize:(targetNode.dataset.no && layout["layout"]["md"] && layout["layout"]["md"][targetNode.dataset.no])?layout["layout"]["md"][targetNode.dataset.no]:12,
                        smSize:(targetNode.dataset.no && layout["layout"]["sm"] && layout["layout"]["sm"][targetNode.dataset.no])?layout["layout"]["sm"][targetNode.dataset.no]:12,
                        xsSize:(targetNode.dataset.no && layout["layout"]["xs"] && layout["layout"]["xs"][targetNode.dataset.no])?layout["layout"]["xs"][targetNode.dataset.no]:12 
                };
            }   
            
            
            return (
                <div id="layoutPopup"> 
                	<div className="display-inline-block extra-padding-right form-group hidden" id="undoButton">
	                     <i className="fa fa-2x fa-undo link"  onClick={this.undo}></i>
	                </div>
                	<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.designHeader=e}}  >
            			<div className="link backLink form-group"  onClick={this.props.close}>
							<div  className="icons8-left-arrow-2  display-inline-block " >
							</div>
							<span>
								&nbsp;{"Home"}
							</span>
						</div>
                		<div role="presentation" className="navElement form-group link" onClick={this.navigateToSub.bind(null,"manageSections")}> Manage Sections</div>
	                    {(this.state.divEdit)?(<div  className="navElement form-group link" onClick={this.navigateToSub.bind(null,"presentation")}> Presentation</div>):("")}
	                    {(this.state.divEdit)?(<div  className="navElement form-group link link-content" onClick={this.navigateToSub.bind(null,"content")}> Content</div>):("")}
                	</div>
                 
	                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.designContent=e}} >
	                   <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" id="manageSections">
		                   <div className="backLink form-group"  >
								<div className="link"  onClick={(this.state.divEdit?this.goToDesign:this.props.close)}>
									<span  className="icons8-left-arrow-2  display-inline-block " >
									</span>
									<span>
										&nbsp;{"Design"}
									</span>
								</div>
							</div>
                        {
                            (this.state.divEdit)?(
                                <div>
                                    <div onClick={this.optForSizes.bind(null,"newAbove")} title="Insert Section Above this"  className="text-center extra-padding link form-group">
                                        <div className="fa fa-x fa-toggle-up"></div>
                                        <div>Insert Section Above</div>
                                    </div>
                                    <div onClick={this.optForSizes.bind(null,"new")} title="Create sub section"  className="text-center extra-padding link form-group">
                                        <div className="fa fa-x fa-columns"></div>
                                        <div>Sub Section</div>
                                    </div>
                                    <div onClick={this.optForSizes.bind(null,"newBelow")} title="Insert Section Below this"  className="text-center extra-padding link form-group">
                                        <div className="fa fa-x fa-toggle-down"></div>
                                        <div>Insert Section Below</div>
                                    </div>
                                    <div onClick={this.optForSizes.bind(null,"current")} title="Edit current section sizes"  className="text-center extra-padding link form-group">
                                        <div className="fa fa-x fa-expand"></div>
                                        <div>Edit Sizes</div>
                                    </div>
                                    <div onClick={this.deleteSection} title="Delete current section"  className="text-center extra-padding link form-group">
                                        <div className="fa fa-x icons8-delete"></div>
                                        <div>Delete</div>
                                    </div>
                                    <div onClick={this.duplicateSection} title="Duplicate current section"  className="text-center extra-padding link form-group">
                                        <div className="fa fa-x fa-copy"></div>
                                        <div>Duplicate</div>
                                    </div>
                                </div>
                            ):("")
                        }
                        {
                            (this.state.optedSizesFor!=undefined)?
                            	(<div className="extra-padding margin-top-gap">
	                        		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
	                                	{(this.state.optedSizesFor=="newAbove")?(<div>Select sizes for Creating a section above this current section</div>):("")}
	                                	{(this.state.optedSizesFor=="new")?(<div>Select sizes for Creating a New section</div>):("")}
	                                	{(this.state.optedSizesFor=="newBelow")?(<div>Select sizes for Creating a section below this current section</div>):("")}
	                                	{(this.state.optedSizesFor=="current")?(<div>Adjust sizes for current section</div>):("")}
	                            	</div>
	                                <div className="col-lg-3 col-md-3 col-xs-3 col-sm-6 no-padding title">
	                                    <div title="LG SIZE" className="text-center display-inline-block extra-padding link ">
	                                        <div className="fa fa-2x fa-desktop"></div>
	                                        <div><select className="form-controlb" ref={(e)=>{this.lgSize=e}} defaultValue={sizes.lgSize}>
	                                                    <option value="1">1</option>
	                                                    <option value="2">2</option>
	                                                    <option value="3">3</option>
	                                                    <option value="4">4</option>
	                                                    <option value="5">5</option>
	                                                    <option value="6">6</option>
	                                                    <option value="7">7</option>
	                                                    <option value="8">8</option>
	                                                    <option value="9">9</option>
	                                                    <option value="10">10</option>
	                                                    <option value="11">11</option>
	                                                    <option value="12">12</option>
	                                                </select></div>
	                                    </div>
	                                    
	                                </div>
	                                 <div className="col-lg-3 col-md-3 col-xs-3 col-sm-6 no-padding title">
	                                    <div title="MD SIZE" className="text-center display-inline-block extra-padding link ">
	                                        <div className="fa fa-2x fa-laptop"></div>
	                                        <div><select  className="form-controlb" ref={(e)=>{this.mdSize=e}} defaultValue={sizes.mdSize}>
	                                                    <option value="1">1</option>
	                                                    <option value="2">2</option>
	                                                    <option value="3">3</option>
	                                                    <option value="4">4</option>
	                                                    <option value="5">5</option>
	                                                    <option value="6">6</option>
	                                                    <option value="7">7</option>
	                                                    <option value="8">8</option>
	                                                    <option value="9">9</option>
	                                                    <option value="10">10</option>
	                                                    <option value="11">11</option>
	                                                    <option value="12">12</option>
	                                                </select></div>
	                                    </div>
	                                    
	                                </div>
	                                 <div className="col-lg-3 col-md-3 col-xs-3 col-sm-6 no-padding title">
	                                    <div title="SM SIZE" className="text-center display-inline-block extra-padding link ">
	                                        <div className="fa fa-2x fa-tablet"></div>
	                                        <div><select  className="form-controlb" ref={(e)=>{this.smSize=e}} defaultValue={sizes.smSize}>
	                                                    <option value="1">1</option>
	                                                    <option value="2">2</option>
	                                                    <option value="3">3</option>
	                                                    <option value="4">4</option>
	                                                    <option value="5">5</option>
	                                                    <option value="6">6</option>
	                                                    <option value="7">7</option>
	                                                    <option value="8">8</option>
	                                                    <option value="9">9</option>
	                                                    <option value="10">10</option>
	                                                    <option value="11">11</option>
	                                                    <option value="12">12</option>
	                                                </select></div>
	                                    </div>
	                                   
	                                </div>
	                                 <div className="col-lg-3 col-md-3 col-xs-3 col-sm-6 no-padding title">
	                                    <div title="XS SIZE" className="text-center display-inline-block extra-padding link">
	                                        <div className="fa fa-2x fa-mobile"></div>
	                                        <div><select  className="form-controlb" ref={(e)=>{this.xsSize=e}} defaultValue={sizes.xsSize}>
	                                                    <option value="1">1</option>
	                                                    <option value="2">2</option>
	                                                    <option value="3">3</option>
	                                                    <option value="4">4</option>
	                                                    <option value="5">5</option>
	                                                    <option value="6">6</option>
	                                                    <option value="7">7</option>
	                                                    <option value="8">8</option>
	                                                    <option value="9">9</option>
	                                                    <option value="10">10</option>
	                                                    <option value="11">11</option>
	                                                    <option value="12">12</option>
	                                                </select></div>
	                                    </div>
	                                    
	                                </div>
	                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-top-gap">
	                                {
	                                    (this.state.optedSizesFor!="current")?(
	                                        <span className="btn  action-button link title"  onClick={this.createNewSection.bind(null,this.state.optedSizesFor)}>CONFIRM</span>
	                                    ):(
	                                        <span className="btn  action-button link title" onClick={this.editCurrentSectionSizes}>CONFIRM</span>
	                                    )
	                                    
	                                }
	                                </div>
                               </div>):("")
	                        }
	                    </div>
                        {
                            (this.state.divEdit)?(<div  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" id="presentation">
	                             <div className="backLink form-group" >
									<div className="link"  onClick={this.goToDesign}>
										<span  className="icons8-left-arrow-2  display-inline-block " >
										</span>
										<span>
											&nbsp;{"Design"}
										</span>
									</div>
								</div>
                                <CSSPicker targetNode={this.props.targetNode}/>
                            </div>):("")
                        }
                    
                    
                    
                    {
                            (this.state.divEdit)?(
                   			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" id="content">
                   				<div className=" backLink form-group">
               						<div className="link"  onClick={this.goToDesign}>
										<span  className="icons8-left-arrow-2  display-inline-block " >
										</span>
										<span>
											&nbsp;{"Design"}
										</span>
									</div>
								</div>
	                            <div>
	                                <input type="text" className="form-control form-group" 
	                                    placeholder="Enter section name" 
	                                    ref={(e)=>{this.sectionName=e}} 
	                                    defaultValue={(this.state.currentSectionData && this.state.currentSectionData.sectionName)?this.state.currentSectionData.sectionName:""}
	                                    onChange={this.setSectionName}/>
	                            </div>
                            	<div>
		                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group popUpContentIcons">
	                                    <div onClick={this.optContentType.bind(null,"image")} ref={(e)=>{this["opt-image"]=e}}  title="Image" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-image"></div>
	                                        <div>Image</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"video")} ref={(e)=>{this["opt-video"]=e}} title="Video" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-film"></div>
	                                        <div>Video</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"link")} title="Link" ref={(e)=>{this["opt-link"]=e}} className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-link"></div>
	                                        <div>Link</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"text")} title="Text"  ref={(e)=>{this["opt-text"]=e}} className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-file-text"></div>
	                                        <div>Text</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"richText")} title="Rich Text" ref={(e)=>{this["opt-richText"]=e}} className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-file-word-o"></div>
	                                        <div>Rich Text</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"heading")} title="Heading" ref={(e)=>{this["opt-heading"]=e}} className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-header"></div>
	                                        <div>Header</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"icon")} ref={(e)=>{this["opt-icon"]=e}} title="Font awecome icons" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-fonticons"></div>
	                                        <div>Icon</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"searchBar")} title="Search Bar" ref={(e)=>{this["opt-searchBar"]=e}} className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-search"></div>
	                                        <div>Search</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"summary")} title="Summary" ref={(e)=>{this["opt-summary"]=e}} className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-list"></div>
	                                        <div>Summary</div>
	                                    </div>
	                                    {/*<div onClick={this.optContentType.bind(null,"carousel")} title="Carousel" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-slideshare"></div>
	                                        <div>Carousel</div>
	                                   </div>*/}
	                                    <div onClick={this.optContentType.bind(null,"cardCarousel")} ref={(e)=>{this["opt-cardCarousel"]=e}} title="Card Carousel" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-sliders"></div>
	                                        <div>Carousel</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"iconView")} ref={(e)=>{this["opt-iconView"]=e}} title="Icon View" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-th-large"></div>
	                                        <div>Icons</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"button")} ref={(e)=>{this["opt-button"]=e}} title="Button" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-hand-pointer-o"></div>
	                                        <div>Button</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"detail")} ref={(e)=>{this["opt-detail"]=e}} title="Detail" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-file-o"></div>
	                                        <div>Detail</div>
	                                    </div>
	                                    <div onClick={this.optContentType.bind(null,"landingPage")} ref={(e)=>{this["opt-landingPage"]=e}} title="Landing Page" className="text-center extra-padding link col-lg-3 col-md-3 col-sm-4 col-xs-6  form-group unequalDivs no-padding-left">
	                                        <div className="fa fa-x fa-home"></div>
	                                        <div>Landing Page</div>
	                                    </div>
		                              </div>
                            		<div>
                                {
                                    (this.state.currentSectionData==undefined)?(""):((this.state.currentSectionData.type!=undefined)?(<div>
                                        {
                                        (this.state.currentSectionData.type=="text")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                                                <label>TEXT</label>
                                            </div>
                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
                                               <textarea ref={(e)=>{this.text=e}} className="form-group form-control no-padding-left" placeholder="Enter your text here" defaultValue={this.state.currentSectionData.value?this.state.currentSectionData.value:""}/>
                                            </div>
                                             <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left  form-group">
												<label className="extra-padding-right">Text Font Weight</label>		
                                                <div className="dropdown">
												    <button className="btn btn-default dropdown-toggle" ref={(e)=>{this.headingFontWeight=e}} type="button" data-toggle="dropdown">
												    	{this.state.currentSectionData.style && this.state.currentSectionData.style["font-weight"]?this.state.currentSectionData.style["font-weight"]:"bold"}
												    </button>
												    <ul className="dropdown-menu">
												      <li onClick={self.selectheadingFontWeight.bind(null,"lighter")}>
												      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"lighter"}}>text--lighter</div>
												      </li>
												      <li onClick={self.selectheadingFontWeight.bind(null,"100")}>
												      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"100"}}>text--100</div>
												      </li>
												      <li onClick={self.selectheadingFontWeight.bind(null,"400")}>
												      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"400"}}>text--400</div>
												      </li>
												      <li onClick={self.selectheadingFontWeight.bind(null,"600")}>
												      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"600"}}>text--600</div>
												      </li>
												      <li onClick={self.selectheadingFontWeight.bind(null,"800")}>
												      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"800"}}>text--800</div>
												      </li>
												       <li onClick={self.selectheadingFontWeight.bind(null,"bold")}>
												      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"bold"}}>text--bold</div>
												      </li>
												    </ul>
												 </div>
                                            </div>
                                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left">
                                                    <span className="btn  action-button link title" onClick={this.setText}>CONFIRM</span>
                                               </div>
                                       </div>):("")
                                    
                                		}
                                		{
	                                        (this.state.currentSectionData.type=="richText")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
	                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
	                                              <label>  RICH TEXT</label>
	                                            </div>
	                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left form-group">
	                                               <Editor mode="create"  content={this.state.currentSectionData.value?this.state.currentSectionData.value:""} callback={this.setRichTextOnTheFly}/>
	                                            </div>
	                                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left">
	                                                    <span className="btn  action-button link title" onClick={this.setRichText}>CONFIRM</span>
	                                               </div>
	                                       </div>):("")
                                    
                                		}
                                		{
		                                    (this.state.currentSectionData.type=="heading")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
		                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
		                                                <label>Heading Content</label>
		                                            </div>
		                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
		                                               <textarea ref={(e)=>{this.headingText=e}} className="form-group form-control no-padding-left" placeholder="Enter your text here" defaultValue={this.state.currentSectionData.value?this.state.currentSectionData.value:""}/>
		                                            </div>
		                                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left">
		                                            	<label className="extra-padding-right">Heading Tag</label>
		                                             	<div className="dropdown">
														    <button className="btn btn-default dropdown-toggle" ref={(e)=>{this.headingNumber=e}} type="button" data-toggle="dropdown">
														    	heading{this.state.currentSectionData.headingNumber?this.state.currentSectionData.headingNumber:"1"}
														    </button>
														    <ul className="dropdown-menu">
														      <li onClick={self.selectHeading.bind(null,"1")}><h1 className="no-margin link extra-padding-left">heading1</h1></li>
														      <li onClick={self.selectHeading.bind(null,"2")}><h2 className="no-margin link extra-padding-left">heading2</h2></li>
														      <li onClick={self.selectHeading.bind(null,"3")}><h3 className="no-margin link extra-padding-left">heading3</h3></li>
														      <li onClick={self.selectHeading.bind(null,"4")}><h4 className="no-margin link extra-padding-left">heading4</h4></li>
														      <li onClick={self.selectHeading.bind(null,"5")}><h5 className="no-margin link extra-padding-left">heading5</h5></li>
														      <li onClick={self.selectHeading.bind(null,"6")}><h6 className="no-margin link extra-padding-left">heading6</h6></li>
														    </ul>
														 </div>
		                                            </div>
		                                             <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding-left">
		                                             	 <label className="extra-padding-right">Font Weight</label>
			                                             <div className="dropdown">
														    <button className="btn btn-default dropdown-toggle" ref={(e)=>{this.headingFontWeight=e}} type="button" data-toggle="dropdown">
														    	{this.state.currentSectionData.style && this.state.currentSectionData.style["font-weight"]?this.state.currentSectionData.style["font-weight"]:"bold"}
														    </button>
														    <ul className="dropdown-menu">
														      <li onClick={self.selectheadingFontWeight.bind(null,"bold")}>
														      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"bold"}}>heading--bold</div>
														      </li>
														      <li onClick={self.selectheadingFontWeight.bind(null,"lighter")}>
														      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"lighter"}}>heading--lighter</div>
														      </li>
														      <li onClick={self.selectheadingFontWeight.bind(null,"100")}>
														      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"100"}}>heading--100</div>
														      </li>
														      <li onClick={self.selectheadingFontWeight.bind(null,"400")}>
														      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"400"}}>heading--400</div>
														      </li>
														      <li onClick={self.selectheadingFontWeight.bind(null,"600")}>
														      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"600"}}>heading--600</div>
														      </li>
														      <li onClick={self.selectheadingFontWeight.bind(null,"800")}>
														      	<div className="no-margin link extra-padding-left" style={{"fontWeight":"800"}}>heading--800</div>
														      </li>
														    </ul>
														 </div>
		                                            </div>
		                                            <div className=" title">
		                                                    <span className="btn  action-button link title" onClick={this.setHeading}>CONFIRM</span>
		                                               </div>
		                                       </div>):("")
		                                    
                                		}
                                		{
		                                    (this.state.currentSectionData.type=="icon")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
		                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
		                                                <label>FONT AWESOME CLASSES</label>
		                                            </div>
		                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left form-group">
		                                               <textarea ref={(e)=>{this.iconClassNames=e}} className="form-control no-padding-left" placeholder="Enter your icon class names here" defaultValue={this.state.currentSectionData.classNames}/>
		                                            </div>
		                                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left">
		                                                    <span className="btn  action-button link title" onClick={this.setIconClassNames}>CONFIRM</span>
		                                               </div>
		                                       </div>):("")
                                    
                                		}
                                		{
		                                    (this.state.currentSectionData.type=="image" || this.state.currentSectionData.type=="video")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
		                                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
		                                            <label>{this.state.currentSectionData.type.toUpperCase()}</label>
		                                        </div>
		                                        {
		                                        	this.state.currentSectionData.type=="video"?(
		                                        	    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
					                                       <select ref={(e)=>{this.videoType=e}} defaultValue={this.state.currentSectionData.videoType}>
					                                       	<option value="">Custom</option>
					                                       	<option value="youtube">Youtube</option>
					                                       	<option value="vimeo">Vimeo</option>
					                                       </select>
					                                    </div>	
		                                        	):""
		                                        }
		                                    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
		                                       <input type='text' ref={(e)=>{this.imageUrl=e}} defaultValue={this.state.currentSectionData.url} className="form-control no-padding-left" 
		                                       	placeholder={this.state.currentSectionData.type=="video"?"In case of youtube or vimeo please provide video id":"url"}/>
		                                    </div>
		                                     <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
		                                       <input type='text' ref={(e)=>{this.imageAlt=e}} defaultValue={this.state.currentSectionData.alt} className="form-control no-padding-left" placeholder="alt"/>
		                                    </div>
		                                    <div className="row">
		                                       <div className="col-lg-5 col-md-6 col-xs-12 col-sm-12 form-group">
		                                            <input type='text' ref={(e)=>{this.imageWidth=e}} defaultValue={this.state.currentSectionData.width}  className="form-control no-padding-left" placeholder="width"/>
		                                       </div>
		                                       <div className="col-lg-5 col-md-5 col-xs-12 col-sm-12  form-group">
		                                            <input type='text' ref={(e)=>{this.imageHeight=e}} defaultValue={this.state.currentSectionData.height} className="form-control no-padding-left" placeholder="height"/>
		                                       </div>
		                                       <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group">
		                                            <input type='text' ref={(e)=>{this.imageAltText=e}} defaultValue={this.state.currentSectionData.altText} className="form-control no-padding-left" placeholder="Alt text or description"/>
		                                       </div>
		                                       <div className="col-lg-2 col-md-1 col-sm-6 col-xs-12">
		                                            <span className="btn  action-button link title" onClick={this.setImageOrVideo.bind(null,this.state.currentSectionData.type)}>CONFIRM</span>
		                                       </div>
		                                    </div>
		                                   </div>):("")
                                		}
                                		{
		                                    (this.state.currentSectionData.type=="link")?(<div>
	                                        {
		                                            (this.state.currentSectionData.linkType==undefined)?(
		                                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
			                                                <label className="extra-padding-right">Link Type</label>
			                                                 <div className="dropdown">
															    <button className="btn btn-default dropdown-toggle" ref={(e)=>{this.radioButtonsDiv=e}} type="button" data-toggle="dropdown">
															    	Select Link Type
															    </button>
															    <ul className="dropdown-menu">
															      <li onClick={self.setLinkType.bind(null,"text")}>
															      	<div className="no-margin link extra-padding-left"  >Text link</div>
															      </li>
															      <li onClick={self.setLinkType.bind(null,"image")}>
															      	<div className="no-margin link extra-padding-left" >Image link</div>
															      </li>
															    </ul>
															 </div>
                                                       </div>):(<div>
			                                                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
			                                                        		<label className="extra-padding-right">Link Type</label>
				                                                         <div className="dropdown">
																		    <button className="btn btn-default dropdown-toggle" ref={(e)=>{this.radioButtonsDiv=e}} type="button" data-toggle="dropdown">
																		    	{this.state.currentSectionData.linkType=="textLink"?"Text Link":"Image Link"}
																		    </button>
																		    <ul className="dropdown-menu">
																		      <li onClick={self.setLinkType.bind(null,"text")}>
																		      	<div className="no-margin link extra-padding-left"  >Text link</div>
																		      </li>
																		      <li onClick={self.setLinkType.bind(null,"image")}>
																		      	<div className="no-margin link extra-padding-left" >Image link</div>
																		      </li>
																		    </ul>
																		 </div>
			                                                       </div>
					                                                {
					                                                    (this.state.currentSectionData.linkType=="textLink")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					                                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
					                                                                  <label>Target Link </label>
					                                                                <input type='text' ref={(e)=>{this.linkHref=e}} defaultValue={this.state.currentSectionData.href} className="form-control no-padding-left" placeholder="Enter link href"/> 
					                                                            </div>
					                                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					                                                             <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding">
					                                                                <label> Link Text </label>
					                                                               <input type='text' ref={(e)=>{this.linkText=e}} defaultValue={this.state.currentSectionData.text} className="form-control no-padding-left form-group" placeholder="Enter link text"/>
					                                                             </div>
					                                                             <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					                                                               <span className="btn  action-button link title" onClick={this.setLink.bind(null,"textLink")}>CONFIRM</span>
					                                                             </div>
					                                                            </div>
					                                                          </div>):(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					                                                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
						                                                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
						                                                                   <label> Target Text </label>
						                                                                   <input type='text' ref={(e)=>{this.linkHref=e}} defaultValue={this.state.currentSectionData.href}  className="form-control no-padding-left" placeholder="Enter link href"/> 
						                                                                </div>
						                                                                <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding">
						                                                                	<label> Link Text </label>
						                                                                 	<input type='text' ref={(e)=>{this.linkText=e}} id="linkText" defaultValue={this.state.currentSectionData.text}  className="form-control no-padding-left form-group" placeholder="Enter link text"/>
						                                                                </div>
						                                                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding title">
						                                                                   	<label>Image Url</label>
						                                                                    <input type='text' ref={(e)=>{this.imageUrl=e}} defaultValue={this.state.currentSectionData.image.url} className="form-control no-padding-left" placeholder="url"/>
						                                                                 </div>
					                                                                </div>
					                                                                <div className="row">
					                                                                   <div className="col-lg-6 col-md-6 col-xs-12 col-sm-12 form-group">
					                                                                        <input type='text' ref={(e)=>{this.imageWidth=e}} defaultValue={this.state.currentSectionData.image.width}  className="form-control no-padding-left" placeholder="width"/>
					                                                                   </div>
					                                                                   <div className="col-lg-6 col-md-6 col-xs-12 col-sm-12  form-group">
					                                                                        <input type='text' ref={(e)=>{this.imageHeight=e}} defaultValue={this.state.currentSectionData.image.height} className="form-control no-padding-left" placeholder="height"/>
					                                                                   </div>
					                                                                   <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
					                                                                        <span className="btn  action-button link title" onClick={this.setLink.bind(null,"imageLink")}>CONFIRM</span>
					                                                                   </div>
					                                                                </div>
					                                                               </div>)
						                                                }
			                                           			 </div>)
                            							}
                								</div>):("")
                                			}
                                			{
			                                    (this.state.currentSectionData.type=="searchBar")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
			                                                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
			                                                                    <label>SEARCH BAR</label>
			                                                                </div>
			                                                                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left form-group">
			                                                                    <input type='text' ref={(e)=>{this.searchBarPlaceholder=e}} defaultValue={this.state.currentSectionData.placeholder} className="form-control no-padding-left" placeholder="Enter searchbar placeholder"/> 
			                                                                </div>
			                                                                <div className="row ">
			                                                                 <div className="col-lg-5 col-md-5 col-xs-6 col-sm-6 form-group">
			                                                                    BG Color
			                                                                   <input type='color' ref={(e)=>{this.searchBarBGColor=e}} defaultValue={this.state.currentSectionData.searchButtonBGColor?this.state.currentSectionData.searchButtonBGColor:"#FFFFFF"} className="form-control no-padding-left form-group" title="Searchbar background color"/>
			                                                                 </div>
			                                                                 <div className="col-lg-5 col-md-5 col-xs-6 col-sm-6 form-group">
			                                                                    FG Color
			                                                                   <input type='color' ref={(e)=>{this.searchBarFGColor=e}} defaultValue={this.state.currentSectionData.searchButtonFGColor?this.state.currentSectionData.searchButtonFGColor:"#000000"} className="form-control no-padding-left form-group" title="Searchbar foreground color"/>
			                                                                 </div>
			                                                                 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
			                                                                   <span className="btn  action-button link title" onClick={this.setSearchBar}>CONFIRM</span>
			                                                                 </div>
			                                                                </div>
			                                                              </div>):("")
			                                    
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="landingPage")?(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
			                                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
			                                                LANDING PAGE
			                                            </div>
			                                            <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title">
			                                               <input ref={(e)=>{this.iconClassNames=e}} className="form-control no-padding-left" placeholder="Enter your icon class names here" value={this.state.currentSectionData.lpi} onClick={this.getLandingPage} placeholder={"click to select landing page"}/>
			                                            </div>
			                                       </div>):("")
			                                    
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="cardCarousel")?(<SchemaContent landingType={"cardCarousel"} prevSectionData={this.state.prevSectionData} content={this.state.currentSectionData} callback={this.applySchemaContent}/>):("")
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="carousel")?(<SchemaContent landingType={"carousel"} prevSectionData={this.state.prevSectionData} content={this.state.currentSectionData} callback={this.applySchemaContent}/>):("")
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="summary")?(<SchemaContent landingType={"summary"} prevSectionData={this.state.prevSectionData} content={this.state.currentSectionData} callback={this.applySchemaContent}/>):("")
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="detail")?(<SchemaContent landingType={"detail"} prevSectionData={this.state.prevSectionData} content={this.state.currentSectionData} callback={this.applySchemaContent}/>):("")
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="iconView")?(<SchemaContent landingType={"iconView"} prevSectionData={this.state.prevSectionData} content={this.state.currentSectionData} callback={this.applySchemaContent}/>):("")
			                                }
			                                {
			                                    (this.state.currentSectionData.type=="button")?(<SchemaContent landingType={"button"} prevSectionData={this.state.prevSectionData} content={this.state.currentSectionData} callback={this.applySchemaContent}/>):("")
			                                }
                            			</div>):(""))
	                            		}
	                            	</div>
		                        </div>
		                    </div>
	                      ):("")
                       }
                  </div>
                </div>
            );
            
        
    }
});
var CSSCache;
var CSSPicker=React.createClass({
    getInitialState:function(){
        var targetNode=this.props.targetNode;
        if(targetNode.id!="layoutDiv"){
            return {css:layout["style"][targetNode.dataset.no]?layout["style"][targetNode.dataset.no]:{}}
        }else{
            return{css:{}}
        }
    },
    increaseFontSize:function(){
        var cs=14;
        if(this.state.css["font-size"] && !isNaN(Number.parseInt(this.state.css["font-size"]))){
            cs=Number.parseInt(this.state.css["font-size"]);
        }
        cs++;
        this.setCSS("font-size",cs+"px")
    },
    decreaseFontSize:function(){
        var cs=14;
        if(this.state.css["font-size"] && !isNaN(Number.parseInt(this.state.css["font-size"]))){
            cs=Number.parseInt(this.state.css["font-size"]);
        }
        cs--;
        this.setCSS("font-size",cs+"px")
    },
    changeStyle:function(property,op){
    	var cs=0;
    	if(property=="font-size"){
    		cs=14;
    	}
    	if(this.state.css[property] && !isNaN(Number.parseInt(this.state.css[property]))){
            cs=Number.parseInt(this.state.css[property]);
        }
        if(op=="increase"){
        	
        	cs=(property=="font-size"?cs+1:cs+5);
        }else{
        	cs=(property=="font-size"?cs-1:cs-5)
        }
        this.setCSS(property,cs+"px");
    },
    setCSS:function(property,value){
        var targetNode=this.props.targetNode;
        $(targetNode).data().style[property]=value;
        layout["style"][targetNode.dataset.no][property]=value;
        targetNode.style[property]=value;
        this.setProperty(property,value);
   },
   setFontFamily:function(){
        this.setCSS("font-family",this.fontFamily.value);
   },
   setStyleProperty:function(){
        var property=this.propertyName.value.trim();
        var value=this.propertyValue.value.trim();
        if(property=="" || value==""){
            common.createAlert("","Please fill name and value");
            return;
        }
        this.setCSS(property,value);
   },
   setProperty:function(property,value){
        var css=this.state.css;
        css[property]=value;
        this.setState({css:css});
   },
   removeProperty:function(property){
        var css=this.state.css;
        delete css[property];
        this.setState({css:css});
   },
   deleteStyleProperty:function(property){
        var currEle=this.props.targetNode;
        if(this.props.targetNode.nodeName=="DIV"){
            currEle=$(currEle).hasClass("gridDiv") ? currEle : $(currEle).parents("div.gridDiv:eq(0)")[0];
            delete layout.style[currEle.dataset.no][property];
            delete $(currEle).data().style[property];
        }else{
            $(currEle).hasClass("contentDiv") ? delete $(currEle).data().style[property] : delete $(currEle).parents("div.contentDiv:eq(0)").data().style[property];
        }
        $(currEle).css(property,"");
        this.removeProperty(property);
   },
   componentDidMount:function(){
        this.componentDidUpdate();
   },
   componentDidUpdate:function(){
    
   },
   setColor:function(type){
    if(type=="color"){
        this.setCSS(type,this.color.value);
    }else{
        this.setCSS(type,this.BGColor.value);
    }
   },
   copyCSS:function(){
   	 	var targetNode=this.props.targetNode;
        CSSCache=layout["style"][targetNode.dataset.no];
        
   },
   pasteCSS:function(){
   		 var targetNode=this.props.targetNode;
   		 layout["style"][targetNode.dataset.no]=CSSCache;
   		 if(CSSCache)
   		 for(var key in CSSCache){
   		 	targetNode.style[key]=CSSCache[key];
   		 	 $(targetNode).data().style[key]=CSSCache[key];
   		 }
   },
   render:function(){
        var self=this;
        
        var showCopyCSSOption=false;
        var showPasteCSSOption=false;
        try{
        	if(layout.style[this.props.targetNode.dataset.no] && Object.keys(layout.style[this.props.targetNode.dataset.no]).length>0){
        		showCopyCSSOption=true;
        	}
        	if(CSSCache && Object.keys(CSSCache).length>0){
        		showPasteCSSOption=true;
        	}
        }catch(err){}
        
        if(this.props.targetNode.id && this.props.targetNode.id!="layoutDiv"){
            return <div></div>
        }else{
            return (<div className="row no-padding">
                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 ">
                            <div className="form-group">
                                <select ref={(e)=>{this.fontFamily=e}} onChange={this.setFontFamily} defaultValue={this.state.css["font-family"]?this.state.css["font-family"]:""}>
                                    <option value="">Select Font family</option>
                                    <option value="futura">Futura</option>
                                    <option value="josefinSlab">Josefin Slab</option>
                                    <option value="Roboto Slab">Roboto slab</option>
                                    <option value="Lato">Lato</option>
                                    <option value="Julius Sans One">Julius Sans One</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Arial">Arial</option>
                                </select>
                            </div>
                            
                            {/*
                                (this.state.css["text-align"] && this.state.css["text-align"]=="justify")?(
                                    <div onClick={this.removeProperty.bind(null,"text-align")} title="Text justify" className="fa fa-align-justify fa-x  btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-align","justify")} title="Text justify" className="fa fa-align-justify fa-x  display-inline-block extra-padding-right form-group"></div>)
                            */}
                            {
                                (this.state.css["text-align"] && this.state.css["text-align"]=="left")?(
                                    <div onClick={this.removeProperty.bind(null,"text-align")} title="Text left" className="fa fa-align-left fa-x  btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-align","left")} title="Text left" className="fa fa-align-left fa-x  display-inline-block extra-padding-right form-group"></div>)
                            }
                            {
                                (this.state.css["text-align"] && this.state.css["text-align"]=="center")?(
                                    <div onClick={this.removeProperty.bind(null,"text-align")} title="Text center" className="fa fa-align-center fa-x  btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-align","center")} title="Text center" className="fa fa-align-center fa-x  display-inline-block extra-padding-right form-group"></div>)
                            }
                            {
                                (this.state.css["text-align"] && this.state.css["text-align"]=="right")?(
                                    <div onClick={this.removeProperty.bind(null,"text-align")} title="Text right" className="fa fa-align-right fa-x  btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-align","right")} title="Text right" className="fa fa-align-right fa-x  display-inline-block extra-padding-right form-group"></div>)
                            }
                            {
                                (this.state.css["text-decoration"] && this.state.css["text-decoration"]=="line-through")?(
                                    <div onClick={this.removeProperty.bind(null,"text-decoration")} title="Line through" className="fa fa-strikethrough fa-x  btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-decoration","line-through")} title="Line through" className="fa fa-strikethrough fa-x  display-inline-block extra-padding-right form-group"></div>)
                            }   
                            {
                                (this.state.css["text-decoration"] && this.state.css["text-decoration"]=="underline")?(
                                    <div onClick={this.removeProperty.bind(null,"text-decoration")} title="Underline" className="fa fa-underline fa-x  btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-decoration","underline")} title="Underline" className="fa fa-underline fa-x   display-inline-block extra-padding-right form-group"></div>)
                            }
                            <div className="display-inline-block extra-padding-right  form-group">
                            	<div onClick={this.changeStyle.bind(null,"text-indent","increase")} title="Increase Text Indent" className="fa fa-indent  vertical-align-top link fa-x" style={{"paddingTop": "1px"}}></div>
                            </div>
                            <div className="display-inline-block extra-padding-right  form-group">
                            	<div onClick={this.changeStyle.bind(null,"text-indent","decrease")} title="Decrease Text Indent" className="fa fa-indent vertical-align-top link fa-x" style={{"paddingTop": "1px","transform": "rotate(180deg)"}}></div>
                            </div>
                            <div className="display-inline-block extra-padding-right  form-group">
                            	<div onClick={this.changeStyle.bind(null,"padding-top","increase")} title="Increase Margin Top" className="fa fa-indent  vertical-align-top link fa-x" style={{"transform": "rotate(270deg)"}}></div>
                            </div>
                            <div className="display-inline-block extra-padding-right  form-group">
                            	<div onClick={this.changeStyle.bind(null,"padding-top","decrease")} title="Decrease Margin Top" className="fa fa-indent  vertical-align-top link fa-x" style={{"transform": "rotate(90deg)"}}></div>
                            </div>
                        </div>
                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group">
                           <div onClick={this.changeStyle.bind(null,"font-size","increase")} title="Increase font size" className="fa fa-font link fa-2x display-inline-block extra-padding-right form-group"></div>
                            <div onClick={this.changeStyle.bind(null,"font-size","decrease")} title="Decrease font size" className="fa fa-font link fa-x display-inline-block extra-padding-right form-group"></div>
                            {
                                (this.state.css["text-style"] && this.state.css["text-style"]=="italic")?(
                                    <div onClick={this.removeProperty.bind(null,"text-style")} title="Italic" className="fa fa-italic fa-x  btn-warning display-inline-block extra-padding-right form-group link"></div>
                                ):(<div onClick={this.setCSS.bind(null,"text-style","italic")} title="Italic" className="fa fa-italic fa-x  display-inline-block extra-padding-right form-group link"></div>)
                            }
                            {
                                (this.state.css["font-weight"] && this.state.css["font-weight"]=="bold")?(
                                    <div onClick={this.setCSS.bind(null,"font-weight","lighter")} title="Lighter" className="fa fa-bold fa-x link btn-warning display-inline-block extra-padding-right form-group"></div>
                                ):(<div onClick={this.setCSS.bind(null,"font-weight","bold")} title="Bold" className="fa fa-bold fa-x link display-inline-block extra-padding-right form-group"></div>)
                            }
                            <div className="display-inline-block extra-padding-right link">
                                <input type="color" ref={(e)=>{this.color=e}} defaultValue={this.state.css.color?this.state.css.color:""} onChange={this.setColor.bind(null,"color")}/>
                                 <div className="margin-top-gap-xs">FG Color</div>
                            </div>
                            <div className="display-inline-block extra-padding-right link">
                                <input type="color" ref={(e)=>{this.BGColor=e}} defaultValue={this.state.css["background-color"]?this.state.css["background-color"]:""} onChange={this.setColor.bind(null,"background-color")}/>
                                <div className="margin-top-gap-xs">BG Color</div>
                            </div>
                        </div>
                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 form-group hidden">
                            <BoxLayout targetNode={this.props.targetNode}/>
                        </div>
                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 hidden">
                            SET CUSTOM CSS
                        </div>
                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 ">
                       {
                        Object.keys(this.state.css).map(function(key){
                            if(key!="font-family" &&
                                key!="text-align" &&
                                key!="text-decoration" && 
                                key!="font-size" &&
                                key!="font-weight" &&
                                key!="fontWeight" &&
                                key!="text-style" && 
                                key!="background-color" &&
                                key!="color" &&
                               /* key!="top" &&
                                key!="right" &&
                                key!="bottom" &&
                                key!="left" &&
                                key!="margin-top" &&
                                key!="margin-right" &&
                                key!="margin-bottom" &&
                                key!="margin-left" &&
                                key!="border-top-width" &&
                                key!="border-right-width" &&
                                key!="border-bottom-width" &&
                                key!="border-left-width" &&*/
                                key!="padding-top" &&
                                /*key!="padding-right" &&*/
                                key!="padding-bottom" &&
                                /*key!="padding-left"*/
                               key!="text-indent"){
                            return (<div className="row" key={key}>
                                       <div className="col-lg-5 col-md-5 col-xs-12 col-sm-12 title">
                                            {key}
                                       </div>
                                       <div className="col-lg-5 col-md-5 col-xs-12 col-sm-12  title">
                                            {self.state.css[key]}
                                       </div>
                                       <div className="col-lg-2 col-md-2 col-sm-6 col-xs-12">
                                            <span className="icons8-delete fa-2x link" onClick={self.deleteStyleProperty.bind(null,key)}></span>
                                       </div>
                                   </div>)  
                            }else{
                                return <div></div>
                            }                   
                        })
                       }
                       </div>
                      
			            
                       <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left form-group" key={global.guid()}>
                           <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 title">
                                <input type='text' ref={(e)=>{this.propertyName=e}}  className="form-control no-padding-left" placeholder="Enter property name"/>
                           </div>
                           <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  title">
                                <input type='text' ref={(e)=>{this.propertyValue=e}} className="form-control no-padding-left" placeholder="Enter property value"/>
                           </div>
                           <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-top-gap-sm">
                                <span className="btn  action-button link title" onClick={this.setStyleProperty}>ADD CUSTOM CSS</span>
                           </div>
                       </div>
                        
			           <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  " >
				           {(showCopyCSSOption)?(<div className="link" onClick={this.copyCSS}>Copy CSS</div>):""}
				           {(showPasteCSSOption)?(<div className="link" onClick={this.pasteCSS}>Paste CSS</div>):""}
			           </div>
                       
                       
                   </div>)
           }
    }
});


var BoxLayout=React.createClass({
    getInitialState:function(){
        var targetNode=this.props.targetNode;
        if(targetNode.id!="layoutDiv"){
            return {css:layout["style"][targetNode.dataset.no]?layout["style"][targetNode.dataset.no]:{}}
        }else{
            return{css:{}}
        }
    },
    setPositions:function(){
        var targetNode=this.props.targetNode;
        
        var style={
            "top"                   :   this["top"].value.trim()+"px",
            "right"                 :   this["right"].value.trim()+"px",
            "bottom"                :   this["bottom"].value.trim()+"px",
            "left"                  :   this["left"].value.trim()+"px",
            "margin-top"            :   this["margin-top"].value.trim()+"px",
            "margin-right"          :   this["margin-right"].value.trim()+"px",
            "margin-bottom"         :   this["margin-bottom"].value.trim()+"px",
            "margin-left"           :   this["margin-left"].value.trim()+"px",
            "border-top-width"      :   this["border-top-width"].value.trim()+"px",
            "border-right-width"    :   this["border-right-width"].value.trim()+"px",
            "border-bottom-width"   :   this["border-bottom-width"].value.trim()+"px",
            "border-left-width"     :   this["border-left-width"].value.trim()+"px",
            "padding-top"           :   this["padding-top"].value.trim()+"px",
            "padding-right"         :   this["padding-right"].value.trim()+"px",
            "padding-bottom"        :   this["padding-bottom"].value.trim()+"px",
            "padding-left"          :   this["padding-left"].value.trim()+"px"
        };
       for(var key in style){
        if(style[key]=="0px"){
            delete style[key];
            var currEle=this.props.targetNode;
            if(this.props.targetNode.nodeName=="DIV"){
                currEle=$(currEle).hasClass("gridDiv") ? currEle : $(currEle).parents("div.gridDiv:eq(0)")[0];
                delete layout.style[currEle.dataset.no][key];
                delete $(currEle).data().style[key];
            }else{
                $(currEle).hasClass("contentDiv") ? delete $(currEle).data().style[key] : delete $(currEle).parents("div.contentDiv:eq(0)").data().style[key];
            }
            $(currEle).css(key,"");
        }else{
            $(targetNode).data().style[key]=style[key];
            layout["style"][targetNode.dataset.no][key]=style[key];
            targetNode.style[key]=style[key];
        }
       }
    },
    render:function(){
        var style={
            "top"                   :   Number.parseInt(this.state.css["top"]?this.state.css["top"]:"0"),
            "right"                 :   Number.parseInt(this.state.css["right"]?this.state.css["right"]:"0"),
            "bottom"                :   Number.parseInt(this.state.css["bottom"]?this.state.css["bottom"]:"0"),
            "left"                  :   Number.parseInt(this.state.css["left"]?this.state.css["left"]:"0"),
            "margin-top"            :   Number.parseInt(this.state.css["margin-top"]?this.state.css["margin-top"]:"0"),
            "margin-right"          :   Number.parseInt(this.state.css["margin-right"]?this.state.css["margin-right"]:"0"),
            "margin-bottom"         :   Number.parseInt(this.state.css["margin-bottom"]?this.state.css["margin-bottom"]:"0"),
            "margin-left"           :   Number.parseInt(this.state.css["margin-left"]?this.state.css["margin-left"]:"0"),
            "border-top-width"      :   Number.parseInt(this.state.css["border-top-width"]?this.state.css["border-top-width"]:"0"),
            "border-right-width"    :   Number.parseInt(this.state.css["border-right-width"]?this.state.css["border-right-width"]:"0"),
            "border-bottom-width"   :   Number.parseInt(this.state.css["border-bottom-width"]?this.state.css["border-bottom-width"]:"0"),
            "border-left-width"     :   Number.parseInt(this.state.css["border-left-width"]?this.state.css["border-left-width"]:"0"),
            "padding-top"           :   Number.parseInt(this.state.css["padding-top"]?this.state.css["padding-top"]:"0"),
            "padding-right"         :   Number.parseInt(this.state.css["padding-right"]?this.state.css["padding-right"]:"0"),
            "padding-bottom"        :   Number.parseInt(this.state.css["padding-bottom"]?this.state.css["padding-bottom"]:"0"),
            "padding-left"          :   Number.parseInt(this.state.css["padding-left"]?this.state.css["padding-left"]:"0"),
        };
        return (<div className="blboxroot">
            <div ref={(e)=>{this.blheading=e}} className="blbox">
                    <span className="bltext"></span>
                    <span className="bltext heading">top</span>
                    <span className="bltext heading">left</span>
                    <span className="bltext heading">bottom</span>
                    <span className="bltext heading">right</span>
            </div>
            <div ref={(e)=>{this.blposition=e}} className="blbox blposition">
                <span className="bltext">position</span>
                <input className="blinput" type="number" placeholder="top" defaultValue={style["top"]} ref={(e)=>{this.top=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="right" defaultValue={style["right"]} ref={(e)=>{this.right=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="bottom" defaultValue={style["bottom"]} ref={(e)=>{this.bottom=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="left" defaultValue={style["left"]} ref={(e)=>{this.left=e}} onChange={this.setPositions}/>
            </div>
            
            <div ref={(e)=>{this.blmargin=e}} className="blbox blmargin">
                <span className="bltext">margin</span>
                <input className="blinput" type="number" placeholder="top" defaultValue={style["margin-top"]} ref={(e)=>{this["margin-top"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="right" defaultValue={style["margin-right"]} ref={(e)=>{this["margin-right"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="bottom" defaultValue={style["margin-bottom"]} ref={(e)=>{this["margin-bottom"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="left" defaultValue={style["margin-left"]} ref={(e)=>{this["margin-left"]=e}} onChange={this.setPositions}/>
            </div>
            <div ref={(e)=>{this.blborder=e}} className="blbox blborder">
                <span className="bltext">border</span>
                <input className="blinput" type="number" placeholder="top" defaultValue={style["border-top-width"]} ref={(e)=>{this["border-top-width"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="right" defaultValue={style["border-right-width"]} ref={(e)=>{this["border-right-width"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="bottom" defaultValue={style["border-bottom-width"]} ref={(e)=>{this["border-bottom-width"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="left" defaultValue={style["border-left-width"]} ref={(e)=>{this["border-left-width"]=e}} onChange={this.setPositions}/>
            </div>
            <div ref={(e)=>{this.blpadding=e}} className="blbox blpadding">
                <span className="bltext">padding</span>
                <input className="blinput" type="number" placeholder="top" defaultValue={style["padding-top"]} ref={(e)=>{this["padding-top"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="right" defaultValue={style["padding-right"]} ref={(e)=>{this["padding-right"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="bottom" defaultValue={style["padding-bottom"]} ref={(e)=>{this["padding-bottom"]=e}} onChange={this.setPositions}/>
                <input className="blinput" type="number" placeholder="left" defaultValue={style["padding-left"]} ref={(e)=>{this["padding-left"]=e}} onChange={this.setPositions}/>
            </div>
            
        </div>)
    }
});

var SchemaContent=React.createClass({
    getInitialState:function(){
        return {content:Object.assign({},this.props.content),schema:undefined};
    },
    selectSchema:function(){
        var node = document.createElement("div");
        node.id = global.guid();
        var popUpId = global.guid();
        var contentDivId = global.guid();
        var sideDivId = global.guid();
        node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<Utility.SelectSchema callback={this.gotSchemaName} popUpId={popUpId} />,document.getElementById(contentDivId));
    },
    gotSchemaName:function(name){
        var content=this.state.content;
        content.schema=name;
        var self=this;
        this.setState({content:content},function(){
            self.getSchema();
        });
    },
    setViewName:function(){
        var content=this.state.content;
        content.viewName=this.summaryViewName.value;
        if(content.viewName==""){
            delete content.viewName;
        }
        this.setState({content:content});
    },
    getSchema:function(){
        var self=this;
        if(this.state.content.schema){
            common.startLoader();
            WebAPI.getMainSchema(this.state.content.schema,function(result){
                common.stopLoader();
                self.setState({schema:result});
            });
        }
    },
    componentDidMount:function(){
        this.getSchema();
    },
    setSummary:function(){//cardCarousel
        var content={};
        content["type"]=this.props.landingType;
        try{
        	content["schema"]=this.schemaName.value.trim();
            content["dependentSchema"]=this.DSName.value.trim();
        }catch(err){}
        content["org"]="public";
        if(this.props.landingType!="button" && content.schema==""){
            common.createAlert("","Please enter schema name");
            return;
        }
        if(this.props.landingType=="button"){
        	content["value"]=this.buttonText.value.trim();
        	content["showTo"]=this.showTo.value;
        	content["action"]={};
        	content["action"]["type"]=this.actionType.value;
        	content["action"]["target"]=this.actionTarget.value;
        	if(!content.value){
        		common.createAlert("","Please enter button text");
        		return;
        	}
        	if(content.showTo=="loggedIn" && content.action.type=="showLogin"){
        		common.createAlert("Error","Your trying to create a login button for logged in people");
        		return;
        	}
        	if(content.action.type!="showLogin" && !content.action.target){
        		common.createAlert("Error","Please enter button target");
        		return;
        	}
        }else if(this.props.landingType=="detail"){
            content["recordId"]=this.recordId.value.trim();
            if(content.recordId==""){
                common.createAlert("","Please enter recordId");
                return;
            }
        }else{
            content["filters"]=this.summaryFilters.value.trim();
            content["skip"]=this.summarySkip.value.trim();
            content["limit"]=this.summaryLimit.value.trim();
            if(this.props.landingType=="summary"){
                content["viewName"]=this.summaryViewName.value.trim();
                 if(content.viewName==""){
                    delete content.viewName;
                }
            }else{
                content["layout"]={
                        "profileImage": this.layoutProfileImage.value.trim(),
                        "bannerImage": this.layoutBannerImage.value.trim(),
                        "name": this.layoutName.value.trim(),
                        "subHeader": this.layoutSubHeader.value.trim(),
                        "images": this.layoutImages.value.trim(),
                        "about": this.layoutAbout.value.trim()
                }
            }
            if(content.filters!=""){
                try{
                    content.filters=JSON.parse(content.filters);
                }catch(err){
                    common.createAlert("","Please enter valid filters in JSON format");
                    return;
                }
            }else{
                delete content.filters;
            }
                
            if(content.skip!="" && !isNaN(Number.parseInt(content.skip))){
                content.skip=Number.parseInt(content.skip);
            }else{
                delete content.skip;
            }
            if(content.limit!="" && !isNaN(Number.parseInt(content.limit))){
                content.limit=Number.parseInt(content.limit);
            }else{
                delete content.limit;
            }
        }
       
        if(content.dependentSchema && content.dependentSchema==""){
            delete content.dependentSchema;
        }
       this.props.callback(content,this.props.content);
    },
    render:function(){
        var allKeys=[];
        if(this.state.schema!=undefined && typeof this.state.schema["@properties"]!="undefined"){
            allKeys=Object.keys(this.state.schema["@properties"]);
        }
        return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                        <label>{this.props.landingType.toUpperCase()}</label>
                    </div>
                    {(this.props.landingType!="button")?(
                    <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title">
                       <label> Schema Name</label>
                        <input ref={(e)=>{this.schemaName=e}} className="form-control no-padding-left" placeholder="Enter Schema Name" value={this.state.content.schema} onClick={this.selectSchema}/>
                    </div>
                    ):""}
                    <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title">
                        
                                {
                                    (typeof this.state.schema!="undefined" &&
                                        this.state.schema["@type"]=="abstractObject" &&
                                        this.state.schema["@dependentKey"] &&
                                        this.state.schema["@properties"] &&
                                        this.state.schema["@properties"][this.state.schema["@dependentKey"]] &&
                                        this.state.schema["@properties"][this.state.schema["@dependentKey"]].dataType &&
                                        this.state.schema["@properties"][this.state.schema["@dependentKey"]].dataType.options )?(
                                        <div>
                                            <label>Dependent Schema Name</label>
                                            <select ref={(e)=>{this.DSName=e}} defaultValue={this.state.content.dependentSchema?this.state.content.dependentSchema:""}>
                                            <option value="">Select Dependent Schema</option>
                                            {
                                                    this.state.schema["@properties"][this.state.schema["@dependentKey"]].dataType.options.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                            </select>
                                        </div>
                                    ):("")
                                    
                                }
                            
                       </div>
                       {
                       		(this.props.landingType=="button")?(
                       			<div>
                       			<div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding-left">
                                    <label>Show To </label>
                                    <select ref={(e)=>{this.showTo=e}}  
                                    	className="form-group form-control no-padding-left"
                                    	defaultValue={this.state.content.showTo?this.state.content.showTo:""}>
	                                    <option value="">Select button applicability</option>
	                                    <option value="loggedIn">Logged In</option>
	                                    <option value="unLogged">Un Logged</option>
	                                    <option value="all">All</option>
                                    </select>
                                </div>
                                <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding-left">
                                	<label>Button Text</label>
                                    <input ref={(e)=>{this.buttonText=e}} className="form-group form-control no-padding-left" placeholder="Enter Button Text" defaultValue={this.state.content.value}/>
                                </div>
                                <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding-left">
                                	<label>Button Action</label>
                                    <select ref={(e)=>{this.actionType=e}}  
                                    	className="form-group form-control no-padding-left"
                                    	defaultValue={this.state.content.action?(this.state.content.action.type?this.state.content.action.type:""):""}>
	                                    <option value="">Select button action</option>
	                                    <option value="showLogin">Show Login</option>
	                                    <option value="url">URL</option>
	                                    <option value="workflow">Workflow</option>
                                    </select>
                                </div>
                                <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding-left">
                                	<label>Action Target</label>
                                    <input ref={(e)=>{this.actionTarget=e}} className="form-group form-control no-padding-left" placeholder="Enter URL or workFlowId" defaultValue={this.state.content.action?this.state.content.action.target:""}/>
                                </div>
                               </div>
                       		):(this.props.landingType=="detail")?(
                                <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding-left">
                                        <label>Record Id</label>
                                        <input ref={(e)=>{this.recordId=e}} className="form-group form-control no-padding-left" placeholder="Enter recordId" defaultValue={this.state.content.recordId}/>
                                    </div>
                            ):(
                                <div>
                                    <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding-left">
                                        <label>Filters</label>
                                        <textarea ref={(e)=>{this.summaryFilters=e}} className="form-control no-padding-left" placeholder="Enter Filters" defaultValue={this.state.content.filters?JSON.stringify(this.state.content.filters):""}/>
                                    </div>
                            
                                    <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title">
                                        <label>Skip Count</label>
                                        <input ref={(e)=>{this.summarySkip=e}} className="form-control no-padding-left" placeholder="Enter Skip value" defaultValue={this.state.content.skip}/>
                                    </div>
                                    <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title">
                                        <label>Limit Count</label>
                                        <input ref={(e)=>{this.summaryLimit=e}} className="form-control no-padding-left" placeholder="Enter Limit value" defaultValue={this.state.content.limit}/>
                                    </div>
                            
                            
                                    {
                                    (this.props.landingType=="summary")?(
                                         <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title">
                                           
                                            {
                                                (typeof this.state.schema!="undefined" &&
                                                    this.state.schema["@operations"] &&
                                                    this.state.schema["@operations"]["read"] &&
                                                    typeof this.state.schema["@operations"]["read"] == "object"  && Object.keys(this.state.schema["@operations"]["read"]).length>0)?(
                                                    <div> <label>View Name:</label>
                                                    <select ref={(e)=>{this.summaryViewName=e}} defaultValue={this.state.content.viewName?this.state.content.viewName:""} onChange={this.setViewName}>
                                                    <option value="">Select View Name</option>
                                                    {
                                                            Object.keys(this.state.schema["@operations"]["read"]).map(function(value){
                                                                return <option value={value} key={value}>{value}</option>   
                                                            })      
                                                    }
                                                    </select>
                                                    </div>
                                                ):("")
                                                
                                            }
                                        </div>
                                    ):(
                                    <div className="col-lg-10 col-md-10 col-xs-12 col-sm-12 no-padding title layoutProperties">
                                        <label className="property margin-bottom-gap-xs">Layout Properties</label>
                                        <label className="property">Profile Image</label>
                                        <select ref={(e)=>{this.layoutProfileImage=e}} defaultValue={(this.state.content.layout && this.state.content.layout.profileImage)?this.state.content.layout.profileImage:""}>
                                            <option value="">Select profileImage </option>
                                            {
                                                    allKeys.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                        </select>
                                        <label className="property margin-bottom-gap-xs">Banner Image</label>
                                        <select ref={(e)=>{this.layoutBannerImage=e}} defaultValue={(this.state.content.layout && this.state.content.layout.bannerImage)?this.state.content.layout.bannerImage:""}>
                                            <option value="">Select bannerImage</option>
                                            {
                                                    allKeys.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                        </select>
                                         <label className="property margin-bottom-gap-xs">Name</label>
                                         <select ref={(e)=>{this.layoutName=e}} defaultValue={(this.state.content.layout && this.state.content.layout.name)?this.state.content.layout.name:""}>
                                            <option value="">Select name</option>
                                            {
                                                    allKeys.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                        </select>
                                         <label className="property margin-bottom-gap-xs">Sub Header</label>
                                         <select ref={(e)=>{this.layoutSubHeader=e}} defaultValue={(this.state.content.layout && this.state.content.layout.subHeader)?this.state.content.layout.subHeader:""}>
                                            <option value="">Select subHeader</option>
                                            {
                                                    allKeys.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                        </select>
                                         <label className="property margin-bottom-gap-xs">Images</label>
                                         <select ref={(e)=>{this.layoutImages=e}} defaultValue={(this.state.content.layout && this.state.content.layout.images)?this.state.content.layout.images:""}>
                                            <option value="">Select images</option>
                                            {
                                                    allKeys.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                        </select>
                                         <label className="property margin-bottom-gap-xs">about:</label>
                                         <select ref={(e)=>{this.layoutAbout=e}} defaultValue={(this.state.content.layout && this.state.content.layout.about)?this.state.content.layout.about:""}>
                                            <option value="">Select about</option>
                                            {
                                                    allKeys.map(function(value){
                                                        return <option value={value} key={value}>{value}</option>   
                                                    })      
                                            }
                                        </select>
                                    </div>)
                                    }
                            
                            </div>)
                            
                            
                            
                         }

                        <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left">
                            <span className="btn  action-button title link"  onClick={this.setSummary}>CONFIRM</span>
                        </div>
            </div>)
    }
});

function getDataObject(targetNode){
   var currDivNo=targetNode.dataset.no;
   var parentObjList=getObjectPosition(currDivNo);
   var str='layout["structure"]["root"]';
   var currObj;
   for(var i=0;i<parentObjList.length;i++){
   if(i != parentObjList.length-1){
       str = str +"[" +'"' +parentObjList[i] +'"' +"]";
   }else{
       eval(str).hasOwnProperty(parentObjList[i]) ? eval(str)[parentObjList[i]]: eval(str)[parentObjList[i]]={};
       if(parentObjList[i]!=currDivNo){
           eval(str)[parentObjList[i]].hasOwnProperty(currDivNo) ? eval(str)[parentObjList[i]][currDivNo]: eval(str)[parentObjList[i]][currDivNo]={};
           currObj=eval(str)[parentObjList[i]][currDivNo];
            
       }else{
           currObj=eval(str)[parentObjList[i]];
       }
    }
  }
  return currObj;
}

function undoStyle(target,content,prevType,prevData){
	/*if(content.type){
	
	}else{
		content.type="";
	}
	if(content.value){
	
	}else{
		content.value="";
	}
	content.type=prevType;
		content.value=prevData?prevData:content.value;*/
	var undoData={
		"target":target,
		"content":content
	};
	
	undoActions.push(undoData);
	if(undoActions.length>0){
		if(document.getElementById("undoButton")){
			document.getElementById("undoButton").className=document.getElementById("undoButton").className.replace(/hidden/g,"");
		}		
	}
}
function hideUndoButton(){
   	if(document.getElementById("undoButton")){
		document.getElementById("undoButton").className+=" hidden";
	}
 }

function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

function updateContent(target,content){
    if($(target).children().not(".ui-resizable-handle").length==0){
        var contentDiv=document.createElement("div");
        contentDiv.className="contentDiv";
        target.appendChild(contentDiv);
    }
    var target=$(target).hasClass("conentDiv") ? target : $(target).find("div.contentDiv")[0];
    ReactDOM.unmountComponentAtNode(target);
    var schemaData={};
    if(SchemaStore.get(layout["schemaName"])){
        schemaData=SchemaStore.get(layout["schemaName"]);
    }
    var record=RecordDetailStore.getSchemaRecord({
    	schema:layout["schemaName"],
    	recordId:layout["schemaRecordId"],
    	userId:common.getUserDoc().recordId,
    	org:"public"});
    ReactDOM.render(React.createElement(dynamicUI.GetContent, {disableClicks:true,layoutJSON:layout,content:JSON.parse(JSON.stringify(content)),schema:schemaData,record:record} ),target);
    var currObj=getDataObject(target.parentElement);
    currObj.content=content;
    $(target).data("content",content);
    $(target).data("style",content.style);
    currObj.content.style= $(target).data("style");
    applyStyles($(target).data("style"),$(target).children().eq(0).children().eq(0));
}
function fillDataStructure(dataObj){
     var layoutObj=layout.layout;
     if(Object.keys(dataObj).length!=0){
         Object.keys(dataObj).map(function(keyName){
             if(!dataObj[keyName].hasOwnProperty("content")){
                 createContainerElement(keyName);
                 var div=$("#layoutDiv").find(".gridDiv[data-no='"+keyName+"']");
                 if(layout.style[keyName] && (Object.keys(layout.style[keyName]).length!=0)){
                     applyStyles(layout.style[keyName],div);
                 }
                 fillDataStructure(dataObj[keyName]);
             }else{
                createContainerElement(keyName);
                var div=$("#layoutDiv").find(".gridDiv[data-no='"+keyName+"']");
                if(Object.keys(dataObj[keyName].content).length!=0){
                    createContentElement(keyName,dataObj[keyName]);
                    if(layout.style[keyName] && (Object.keys(layout.style[keyName]).length!=0)){
                        applyStyles(layout.style[keyName],div);
                    }
                }
             }
         });
     }
}
function createContainerElement(keyName){
    var layoutObj=layout.layout;
    var div=document.createElement("div");
    var sizes=["lg","md","sm","xs"];
    var classList="gridDiv add-border-white-screen ";
    sizes.map(function(size){
        if(layoutObj[size][keyName]==undefined ||layoutObj[size][keyName]==""){
            classList=classList+" "+"col-"+size+"-"+12;
        }else{
            classList=classList+" "+"col-"+size+"-"+layoutObj[size][keyName];
        }
    });
    div.className=classList;
    div.dataset.no=keyName;
    var parentDivNo = keyName.substring(0, keyName.lastIndexOf("."));
    var gridSize=layoutObj.lg[keyName]?layoutObj.lg[keyName]:12;
    if(parentDivNo){
        $("#layoutDiv").find(".gridDiv[data-no='"+parentDivNo+"']").append(div);
    }else{
        $("#layoutDiv").append(div);
    }
    var actWidth=(($(div).parent().width()/12)*gridSize)-4;
    $(div).css("width",actWidth);
    layout["style"][keyName] ? layout["style"][keyName] : layout["style"][keyName]={};
    $(div).data("style",layout["style"][keyName]);
    var gridWidth=Math.round(($(div).parent().width()-2)/12);
    $(div).resizable({
        autoHide: true,
        containment: "parent",
        grid:gridWidth,
        stop: function( event, ui ) {
           var gridText=$("#gridSpan").val();
           var currDiv=ui.originalElement.attr("data-no");
           var gridSize=Math.round(($(ui.originalElement).width()-2)/(($(ui.originalElement).parent().width()-2)/12));
           editGridClass(ui.originalElement,gridText,gridSize);
           layout["layout"][gridText][currDiv]=gridSize;
           setDivSizes(gridText);
        }
    });            
}

function createContentElement(keyName,keyData){
    var contentDiv= document.createElement("div");
    contentDiv.className="contentDiv";
    var schema={};
    if(SchemaStore.get(layout["schemaName"])){
        schema=SchemaStore.get(layout["schemaName"]);
    }
    var record=RecordDetailStore.getSchemaRecord({
    	schema:layout["schemaName"],
    	recordId:layout["schemaRecordId"],
    	userId:common.getUserDoc().recordId,
    	org:"public"});
    var styleData=layout.style[keyName];
    var parentNode=$("#layoutDiv").find(".gridDiv[data-no='"+keyName+"']");
    if(Object.keys(keyData.content).length!=0){
        ReactDOM.render(React.createElement(dynamicUI.GetContent, {disableClicks:true,layoutJSON:layout,content:keyData.content,schema:schema,record:record} ),contentDiv);
        if(keyData.content.hasOwnProperty("style")){
            setStyleData(keyData.content.style,contentDiv);
        }
        $(contentDiv).data("content",keyData.content);
        parentNode.append(contentDiv);                 
    }
}
function setPixel(keyData){
    var data=keyData.toLowerCase();
    if(keyData.length!=0){
        if(data.indexOf("px")==-1 && data.indexOf("%")==-1){
            data=data+"px";
        }
    }
    return data;
}
function setStyleData(styleData,element){
    if(Object.keys(styleData).length!=0){
        applyStyles(styleData,element);
        $(element).data("style",styleData);
    }else{
        $(element).data("style",{});
    }
}
function applyStyles(elementStyle,element){
    if(typeof elementStyle=="object" && elementStyle!=undefined){
        Object.keys(elementStyle).map(function(styleKey){
            $(element).css(styleKey,elementStyle[styleKey]);
        });
   }
}
function nestedLoopHandler(currentDiv,saveStatus){
    var gridDivs=$(currentDiv).find(">.gridDiv");
    for(var i=0;i<gridDivs.length;i++){
        if($(gridDivs[i]).find(">.gridDiv").length!=0){
            if(saveStatus){
                saveDivContent($(gridDivs[i]));
                nestedLoopHandler($(gridDivs[i]),saveStatus);
            }else{
               setData($(gridDivs[i]),i); 
               nestedLoopHandler($(gridDivs[i]));
            }
            
        }else{
            if(saveStatus){
                saveDivContent($(gridDivs[i]));
            }else{ 
                setData($(gridDivs[i]),i);
            }
        }
    }
}
function getObjectPosition(divNo){
    var tempList=[];
    while(divNo.lastIndexOf(".") != -1){
        var str=divNo.substring(0, divNo.lastIndexOf("."));
        tempList.push(str);
        divNo=str;
    }
    if(tempList.length!=0){
        return tempList.reverse();
    }else{
        tempList.push(divNo);
        return tempList;
    }
    
}
function saveDivContent(currentDiv){
   // var childEle=currentDiv.children().not(".ui-resizable-handle").find("div.content");
    var childEle=$(currentDiv).find(">.contentDiv:eq(0)");
    var currDivNo=currentDiv[0].dataset.no;
    var divText="";
    try{
        divText=currentDiv.contents().get(0).nodeValue;
    }catch(err){}
    var content={};
    if(childEle.length!=0){
        if(childEle.nodeName=="BR"){
            content.type="text";
            content.value=currentDiv.text();
        }else{
            content=$(childEle).data().content ? $(childEle).data().content : {};
            //content.style=$(childEle).data().style ? $(childEle).data().style:{};
        }
    }else if(divText!="" && divText!=null){
         content.type="text";
         content.value=currentDiv.text();
    }
    var currObj=getDataObject(currentDiv[0]);
    if(Object.keys(content).length!=0){
         currObj["content"]=content;
    }
    layout["style"][currDivNo]=$(currentDiv).data().style;
}
function setData(currDiv,idx){
    var lg=$(currDiv).attr("class").match(/(\bcol-lg-\S+\b)/,'i')[0].split("-");
    var md=$(currDiv).attr("class").match(/(\bcol-md-\S+\b)/,'i')[0].split("-");
    var sm=$(currDiv).attr("class").match(/(\bcol-sm-\S+\b)/,'i')[0].split("-");
    var xs=$(currDiv).attr("class").match(/(\bcol-xs-\S+\b)/,'i')[0].split("-");
    if(currDiv.parent().attr("id")!="layoutDiv"){
        $(currDiv).attr("data-no",currDiv.parent().attr("data-no")+"."+(idx+1));
    }else{
        $(currDiv).attr("data-no",(idx+1));
    }
    layout["layout"]["lg"][currDiv.attr("data-no")]=Number(lg[lg.length-1]);
    layout["layout"]["md"][currDiv.attr("data-no")]=Number(md[md.length-1]);;
    layout["layout"]["sm"][currDiv.attr("data-no")]=Number(sm[sm.length-1]);;
    layout["layout"]["xs"][currDiv.attr("data-no")]=Number(xs[xs.length-1]);;
}
function editGridClass(currDiv,gridText,gridSize){
   var currDivClassList=$(currDiv).attr("class");
   var gridClass='(\\bcol-'+gridText+'-\\S+\\b)';
   var regex=new RegExp(gridClass,'i');
   var tempClass=currDivClassList.match(regex);
   $(currDiv).removeClass(tempClass[0]).addClass("col-"+gridText+"-"+gridSize); 
   Object.keys(layout["layout"][gridText]).map(function(key){
        setGridClassWidth($("#layoutDiv").find(".gridDiv[data-no='"+key+"']"),layout["layout"][gridText][key]);
   });
}
function enableSorting(){
	cleanLayout();
    nestedLoopHandler($("#layoutDiv"));
    if($(".gridDiv").length!=0){
        $(".gridDiv").parent().sortable();
        $(".gridDiv").parent().sortable('enable');
        $(".gridDiv").parent().sortable({cursor: "grab"});
        $(".gridDiv").parent().on("sortupdate", function(event,ui){
            cleanLayout();
            nestedLoopHandler($("#layoutDiv"));
        });
    }
}
function setGridClassWidth(currDiv,gridSize){
    var actWidth=(($(currDiv).parent().width()/12)*gridSize)-4;
    $(currDiv).css("width",actWidth);
}
function getLookupComponent(schemaName,inputNode){
    var unKnownKey="schemaRecordIdToSave";
    delete window[unKnownKey];
    var node=document.createElement("div");
    node.id= global.guid();
    node.className="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
    function callBackToGetRecordId(data){
        inputNode.value=window[unKnownKey];
        layout["schemaRecordId"]=window[unKnownKey];
    }
    document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
    $("#genericDilog").zIndex($(".lookUpDialogBox").zIndex()-10);
    ReactDOM.render(<manageRecords.LookupComponent schema={schemaName}  storeInGlobal={unKnownKey}  callback={callBackToGetRecordId}/>,node);
}
