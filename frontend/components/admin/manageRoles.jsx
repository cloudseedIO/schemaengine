/**
 *@author Haritha
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var schema = require("./manageSchemaNew.jsx"); 
var DefinitionStore = require('../../stores/DefinitionStore');
var ActionCreator = require('../../actions/ActionCreator.js');
var global=require('../../utils/global.js');
var Utility=require("../Utility.jsx");

function createRoles(type,ev){
	common.clearMainContent();
	common.startLoader();
	 if(type=="new"){
        ReactDOM.render(<NewRoleComponent type={type}/>,document.getElementById('dynamicContentDiv'));
    }else if(type=="edit"){
		ReactDOM.render(<EditRoleComponent type={type}/>,document.getElementById('dynamicContentDiv'));
    } 
    common.stopLoader();
}
exports.createRoles=createRoles;

var NewRoleComponent=React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForAuthorization") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForAuthorization")});
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount : function(){
        var data=this.props.data; 
        ActionCreator.getDefinition("HelpTextForAuthorization");
		DefinitionStore.addChangeListener(this._onChange);
        var type = this.props.type;
        if(data){
            this.roleObjName.value=data.roleName;
            this.roleObjName.disabled=true;
            data.access.map(function(accessData,index){
               //if(index>0)
               addNewAccess(type);  
               renderObject(accessData.schema,function(schemaObj){
                    ReactDOM.render(<AccessSchemaComponent schemaObj={schemaObj} data={accessData} index={index} />,$("#acessObjectDiv .accessDiv").eq(index).find("div#dynamicSchemaContainer").get(0));    
               });
            });
        }
    },
    saveRolesRecord:function(ev){
        if(this.roleObjName.value.trim()!="" && this.roleObjName.value!=undefined){
            var data=this.props.data;
            var roles;
            if(data){
               roles=data;
            }else{
                roles={};
            } 
           
            roles.docType="Role";
            roles.roleName=this.roleObjName.value;
            roles.access=[];
            var accessDivs=$(this.acessObjectDiv).find(".accessDiv");
            for(var i=0;i<accessDivs.length;i++){
                var temp={};
                temp.schema=$(accessDivs[i]).find("#schemaObjName").val();
                var keyNames=["methods","navViews","create","detailView"];
                keyNames.map(function(key){
                     if(key=="create" || key=="detailView"){
                        temp[key]="";
                     }else{
                        temp[key]=[]; 
                     }
                    var selInputs=$(accessDivs[i]).find("div#"+key+i).find("input:checked");
                    if(selInputs.length!=0){
                        if(key=="create" || key=="detailView"){
                            temp[key]=selInputs.attr("id");
                        }else{
                           selInputs.map(function(index,inputEle){
                               temp[key].push(inputEle.id);
                            }); 
                        }
                    }
                });
                roles.access.push(temp);
            }
            roles["recordId"]=roles.hasOwnProperty("recordId") ? roles.recordId : (roles.roleName+global.guid());
            roles["author"]= roles.hasOwnProperty("author") ? roles.author : common.getUserDoc().recordId;
            roles["editor"]= roles.hasOwnProperty("editor") ? roles.author : common.getUserDoc().recordId;
            roles["dateCreated"]= roles.hasOwnProperty("createdOn") ? roles.createdOn : global.getDate();
            roles["dateModified"]=  global.getDate();
            roles["revision"]= roles.hasOwnProperty("revision")?roles.revision*1+1:1;
            roles["$status"]= "draft";
			common.startLoader();
            WebAPI.saveRole(roles,function(result){
            	common.stopLoader();
				alert("Role saved");
				common.clearMainContent();
            });
           
        }else{
            alert("please enter role name");
        }
        
    },
    checkRoleName:function(ev){
        var name=ev.target.value;
        var self=this;
        if(name!=""){
			common.startLoader();
	 		WebAPI.getAllRoles(function(roles){
	     		common.stopLoader();
	        	for(var i=0;i<roles.length;i++){
	         		if(roles[i].roleName==name){
	                	alert("Role name already exist. please try with another name");
	                	self.roleObjName.value="";
	                	return;
	         		}
	         	}
	      	});
      	}
    },
    render:function(){
        var type = this.props.type;
        var self=this;
        if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
        return(
            <div>
                <div id="roleObjectDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right ">
                    <label className="text-uppercase">ROLE NAME</label>
                    <div className="row no-margin " >
                         <input type='text' ref={(e)=>{this.roleObjName=e}} id="roleObjName" className="form-control " placeholder="enter role name" onBlur={this.checkRoleName}/>
                    </div>
                    {
						(self.state.helpText && self.state.helpText["roleObjectDiv"]!="")?(
							<div className={"col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding helpText"}>{self.state.helpText["roleObjectDiv"]}</div>
						):("")
					}
                </div>
                <div id="acessObjectDiv" ref={(e)=>{this.acessObjectDiv=e}} className="row margin-bottom-gap remove-margin-left remove-margin-right ">
                    {
						(self.state.helpText && self.state.helpText["acessObjectDiv"]!="")?(
							<div className={"col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding helpText"}>{self.state.helpText["acessObjectDiv"]}</div>
						):("")
					}
                </div>
                <div className="margin-bottom-gap remove-margin-left remove-margin-right">
                    <label>
                        <input type='button' id="accessBtn" ref={(e)=>{this.accessBtn=e}} className="btn  btn-warning  upload-drop-zone" onClick={addNewAccess.bind(null,type)} value='ADD ACCESS TO A SCHEMA'/>
                     </label>
                     {
                     	(self.state.helpText && self.state.helpText["accessBtn"]!="")?(
                     		<div className={"row no-margin helpText"}>{self.state.helpText["accessBtn"]}</div>
                     	):("")
					}
                </div>
                <div className="no-margin">
                    <label>
                        <input type='button' id="saveBtn" ref={(e)=>{this.saveBtn=e}} className="btn  btn-warning upload-drop-zone" onClick={this.saveRolesRecord} value='SAVE'/>
                     </label>
                </div>
            </div>
        );
    }
});
function addNewAccess(type,ev){
    var div = document.createElement("div");
  	$(div).attr("class","col-lg-6 col-md-6 col-sm-12 col-xs-12 no-margin accessDiv");
    $("#acessObjectDiv").append(div);
    ReactDOM.render(<AddAccessComponent type={type}/>,div);
}
function openSchemaNames(POT,type,ev){
	var schemaIndex=$(ev.target).parents(".accessDiv").index()-1;
	var node = document.createElement("div");
	node.id = global.guid();
	var popUpId = global.guid();
	var contentDivId = global.guid();
	var sideDivId = global.guid();
	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
    ReactDOM.render(<Utility.SelectSchema callback={function(schemaName){
    	var accessDivs=$(POT.schemaObjName).parents("#acessObjectDiv").find(".accessDiv");
	    if(accessDivs.length>0){
	    	for(var i=0;i<accessDivs.length;i++){
	        	if($(accessDivs[i]).find("#schemaObjName").val()==schemaName){
	            	alert(schemaName+" already selected,Please select another schema");
	                return;
	     		}
		   	}    
		}
		POT.schemaObjName.value = schemaName;
		renderObject(schemaName,function(schemaObj){
			ReactDOM.render(<AccessSchemaComponent schemaObj={schemaObj} index={schemaIndex} />,$("#acessObjectDiv .accessDiv").eq(schemaIndex).find("div#dynamicSchemaContainer").get(0));
		});
    }} popUpId={popUpId} />,document.getElementById(contentDivId));
}
 
function renderObject(schemaName,callback){
    var schemaObj={};
    common.startLoader();
	WebAPI.getMainSchema(schemaName,function(schemaDoc){
    	common.stopLoader();
    	if(schemaDoc.error){alert(schemaDoc.error);return;}
    	schemaObj["methods"]=[];
       	schemaObj["navViews"]=[];
       	schemaObj["create"]=[];
       	schemaObj["detailView"]=[];
       	Object.keys(schemaDoc).map(function(key){
        	if(key=="@operations"){
            	Object.keys(schemaDoc[key]).map(function(operationsKey){
                	if(operationsKey=="create"){
                    	schemaObj["create"].push(schemaDoc[key][operationsKey]);
                   	}else if(operationsKey=="read"){
                    	schemaObj["detailView"].push(schemaDoc[key][operationsKey]);
                   	}else if(operationsKey=="update" || operationsKey=="actions" || operationsKey=="delete" || operationsKey=="relations"){
                    	schemaObj["methods"].push(schemaDoc[key][operationsKey]);
                	}
         		});
       		}else if(key=="@navViews"){
            	Object.keys(schemaDoc[key]).map(function(operationsKey){
                var temp={};
                temp[schemaDoc[key][operationsKey].navName]=schemaDoc[key][operationsKey];
                	schemaObj["navViews"].push(temp);
            	});
     		}
     	});
      	callback(schemaObj);
    });
} 
var AccessSchemaComponent=React.createClass({
    componentDidMount : function(){
        var data=this.props.data;
        var index=this.props.index; 
        if(data){
          Object.keys(data).map(function(key){
              if(key=="schema"){
                $("#acessObjectDiv .accessDiv").eq(index).find("input[id='schemaObjName']").val(data.schema);
              }else{
                  if($.type(data[key])=="array"){
                      data[key].map(function(dataId){
                           $("#acessObjectDiv .accessDiv").eq(index).find("input[id='"+dataId+"']").attr("checked","true");
                      });
                  }else{
                      $("#acessObjectDiv .accessDiv").eq(index).find("input[id='"+data[key]+"']").attr("checked","true"); 
                  }
                  
              }
          });
           
        }
    },
    render:function(){
        var schemaObj=this.props.schemaObj;
        var schemaIndex=this.props.index;
        return(<div>{
            Object.keys(schemaObj).map(function(key){
                var checkState="";
                if(key=="methods"||key=="navViews"){
                    checkState="checkbox";
                }else if(key=="create"||key=="detailView"){
                    checkState="radio";
                }
                if(schemaObj[key].length==0){
                    return(<div key={global.guid()} className="row no-margin" id={key+schemaIndex}>
                            <div>
                                <span className="fieldText no-padding-left headerField title text-capitalize">{key}</span>
                            </div>
                            <h5>No {key} available</h5>
                        </div>)
                }else{
                    return(<div key={global.guid()} className="row no-margin" id={key+schemaIndex}>
                        <div>
                            <span className="fieldText no-padding-left headerField title text-capitalize">{key}</span>
                        </div>
                        <div>{
                            schemaObj[key].map(function(dataObj){
                                if($.type(dataObj)=="object"){
                                    if(Object.keys(dataObj).length==0){
                                         return(<h5 key={global.guid()}>No {key} available</h5>)
                                    }else{
                                        return(
                                        Object.keys(dataObj).map(function(subKey){
                                            return(<div key={global.guid()} className="row no-margin ">
                                                     <div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 no-padding">
                                                        <input type={checkState} name={key+schemaIndex} className={"property" } id={subKey}/>&nbsp;
                                                        <span className="fieldText link">{subKey}</span>
                                                    </div>
                                                  </div>)
                                            })
                                        )
                                    }
                                }
                            })
                        }</div>
                        </div>)
                }
                
            })
        }</div>)
    }
});
var AddAccessComponent = React.createClass({
	showOrHide:function(){
		if(this.arrow.className.indexOf("sleekIcon-arrows_down")>-1){
			this.arrow.classList.add("sleekIcon-arrows_up");
			this.arrow.classList.remove("sleekIcon-arrows_down");
			this.dynamicSchemaContainer.classList.add("hidden");
		}else{
			this.arrow.classList.remove("sleekIcon-arrows_up");
			this.arrow.classList.add("sleekIcon-arrows_down");
			this.dynamicSchemaContainer.classList.remove("hidden");
		}
	},
   	render : function(){
       var type=this.props.type;
       return (<div>
                       <span className="fieldText no-padding-left headerField title">ACCESS</span>
                       <div className="row no-margin">
                            <div>
                                <span className="fieldText no-padding-left headerField title">Schema</span>
                            </div>
                            <div className="col-lg-10 col-md-10 col-xs-10 col-sm-10 no-padding form-group">
                                 <input type='text' ref={(e)=>{this.schemaObjName=e}} id="schemaObjName" className="form-control remove-padding-left" placeholder="Select schema" onClick={openSchemaNames.bind(null,this,type)}/>
                            </div>
                            <div className="col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding form-group">
                            	<a className="sleekIcon-arrows_down fa fa-2x" href="#" ref={(e)=>{this.arrow=e}} onClick={this.showOrHide}/>
                            </div>
                       </div>
                       <div ref={(e)=>{this.dynamicSchemaContainer=e}} id="dynamicSchemaContainer" className=""></div>
                  </div>);
    }
                   
});
var EditRoleComponent=React.createClass({
    openDoc:function(type){
    	var node = document.createElement("div");
        node.id = global.guid();
        var popUpId = global.guid();
        var contentDivId = global.guid();
        var sideDivId = global.guid();
        node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
        document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
        ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<Utility.SelectRole callback={this.roleSelected} popUpId={popUpId} />,document.getElementById(contentDivId));
    },
    roleSelected:function(role){
    	WebAPI.getRole(role,function(data){
			common.clearMainContent();
			ReactDOM.render(<NewRoleComponent type={"edit"} data={data}/>,document.getElementById('dynamicContentDiv'));
        });
    },
    render : function(){
        var type=this.props.type;
        if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
        return(<div>
        		<div>
					 <h3 className="remove-margin-top">Edit Existing Role</h3>
				</div>
                <div className="row no-margin" id="editInputDiv">
                     <input type='text' id="editInput" className="form-control remove-padding-left relationWith" placeholder="click to edit roles" onClick={this.openDoc.bind(null,type)}/>
                </div>
             </div>);
    }
});