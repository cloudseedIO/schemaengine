/**
 * @author - Sathish
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebUtils=require("../../utils/WebAPIUtils.js");
var roles = require("./manageRoles.jsx");
var global=require('../../utils/global.js');

var DefinitionStore = require('../../stores/DefinitionStore');
var ActionCreator = require('../../actions/ActionCreator.js');

var dataTypes = ["text","email","number","autoNumber","url","phone","textarea","date","time","dateTime","geoLocation","boolean","currency","object","pickList","multiPickList","image","images","video","privateVideo","privateVideos","socialShare","rating","label","attachment","attachments","struct","array","formula"];
var structNames;//used to store all struct names
//var operators = ["+ Add","- Substract","* Multiply","/ Devide","= Equal","&& And","|| Or","> Greater Than",">= Greater Than Or Equal","< Less than","<= Less Than Or Equal",];
var globalObjects;//used to store 2 or more objects data(used while saving)
var formulaObjects={};//to maintain the  "formula field" selected properties (refer dialogbox)
var formulaRef = "";//used for storing selected property root trace in dialogbox(temparorly store)
var relationObjects = {};// to maintain data type of relation objects
var formulaFields = {};//used to store formula type property tempararly used in record saving 
var finalObject = {};//used to hold multiple objs data(like object type,struct type[used in schema creation])
var savedDoc;//used for store saved record tempararly
var count = 100000;//used for adding dynamic id to newly created array element
var lookupData = {};//used to store all lookup fileds document data
var views = [];//used to hold schema views
var allSchemaNames;//to hold all schema names including struct and stdlookup for uniqueness handling
var availableSchemas;//used to store only schemas used for Junction Object 
var schemaJSON = {};//used to save customschema data

var defineRecordLayout=require('./defineRecordLayout.jsx');

function numeralsOnly(e){
	if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
    	return false;
    }
}
function moveScroll(element){
	if(element){
		$('html, body').animate({
	    	scrollTop: $(element).offset().top-60
		}, 1000,function(){
			//$(element).parent().next().find("input:text").focus();
		});
	}

}

var sysProperties =  {
		    "org": {
		      "description": "org of the document",
		      "displayName": "record org",
		      "dataType": {
		        "type": "text"
		      }
		    },
		    "recordId": {
		      "description": "id of the document",
		      "displayName": "record id",
		      "dataType": {
		        "type": "text"
		      }
		    },
		    "revision": {
		      "description": "Revision of the document",
		      "displayName": "Revision",
		      "dataType": {
		        "type": "text"
		      }
		    },
		    "author": {
		      "description": "Creator of the document",
		      "displayName": "Created by",
		      "dataType": {
		        "type": "object",
		        "objRef": "User",
		        "refKey": "recordId",
		        "refType": "lookup"
		      }
		    },
		    "dateCreated": {
		      "description": "Created date",
		      "displayName": "Date created",
		      "dataType": {
		        "type": "date"
		      }
		    },
		    "editor": {
		      "description": "Editor of the  document",
		      "displayName": "Edited by ",
		      "dataType": {
		        "type": "object",
		        "objRef": "User",
		        "refKey": "recordId",
		        "refType": "lookup"
		      }
		    },
		    "dateModified": {
		      "description": "Modified date",
		      "displayName": "Date modified",
		      "dataType": {
		        "type": "text"
		      }
		    }
        };
		  
exports.createNewSchema=createNewSchema;

/**
 * used to get the categories and create "new schema" component
 */
function createNewSchema(name,type,ev){
	$("#pageStatus").text("");
	$("#landingPage").css("display","none");
	var mainTitle,subTitle,placeholder; 
	if(name == "schema" && type == "new"){
		mainTitle = "Create Schema";
		subTitle = "Schema Name";
		placeholder = "Enter Schema Name";
	}else if(name == "schema" && type == "edit"){
		mainTitle = "Edit Schema";
		subTitle = "Schema Name";
		placeholder = "Select Schema";
	}
	formulaObjects={};
	finalObject = {};
	schemaJSON = {};
	views = [];
	globalObjects = [];
	ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));	
	document.getElementById('dynamicContentDiv').style.display = "block";
	WebUtils.doPost("/schema?operation=getUserSchemas",{},function(structs){
		if(structs.data.error){
			alert(structs.data.error+" \n  select again");
		}
		structNames = structs.data;
		ReactDOM.render(<CreateNewSchema  schemaObjects ={""} mainTitle={mainTitle} subTitle={subTitle} placeholder={placeholder} name={name} type={type}/>,document.getElementById('dynamicContentDiv'));
	});
	WebUtils.doPost("/schema?operation=getAllSchemas",{},function(SchemaNames){
		if(SchemaNames.data.error){
			alert(SchemaNames.data.error+"\n  select again");
		}
		allSchemaNames = SchemaNames.data;
	});
}
exports.createNewSchema=createNewSchema;

var CreateSchema=React.createClass({
	componentDidMount:function(){
		formulaObjects={};
		finalObject = {};
		schemaJSON = {};
		views = [];
		globalObjects = [];
		WebUtils.doPost("/schema?operation=getUserSchemas",{},function(structs){
			if(structs.data.error){
				alert(structs.data.error+" \n  select again");
			}
			structNames = structs.data;
		});
		WebUtils.doPost("/schema?operation=getAllSchemas",{},function(SchemaNames){
			if(SchemaNames.data.error){
				alert(SchemaNames.data.error+"\n  select again");
			}
			allSchemaNames = SchemaNames.data;
		});
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return <CreateNewSchema  schemaObjects ={""} mainTitle={ "Create Schema"} subTitle={"Schema Name"} placeholder={"Enter Schema Name"} name={"schema"} type={"new"}/>;
		
	}
});
exports.CreateSchema=CreateSchema;

var EditSchema=React.createClass({
	componentDidMount:function(){
		formulaObjects={};
		finalObject = {};
		schemaJSON = {};
		views = [];
		globalObjects = [];
		WebUtils.doPost("/schema?operation=getUserSchemas",{},function(structs){
			if(structs.data.error){
				alert(structs.data.error+" \n  select again");
			}
			structNames = structs.data;
		});
		WebUtils.doPost("/schema?operation=getAllSchemas",{},function(SchemaNames){
			if(SchemaNames.data.error){
				alert(SchemaNames.data.error+"\n  select again");
			}
			allSchemaNames = SchemaNames.data;
		});
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return <CreateNewSchema  schemaObjects ={""} mainTitle={"Edit Schema"} subTitle={"Schema Name"} placeholder={ "Select Schema"} name={"schema"} type={"edit"}/>;
		
	}
});
exports.EditSchema=EditSchema;


var CreateNewSchema = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	getSuperTypeSchema : function(ev){//used to open super type
		var targetEle = ev.target;
		if($("#schemaName").val().trim() == ""){
			alert("please enter schema name");
			$("#schemaName").focus();
			return;
		}
		var id = $(ev.target)[0];
		WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{name:"superTypes"},function(result){
			if(result.data.error){
				alert(result.data.error+"\n  select again");
			}
			if(result.data){
				var supertype = [];
				Object.keys(result.data["@properties"]).map(function(property){
					supertype.push(property);
				})
			}
			getPopupContent("Select Super type","search","","","");
			ReactDOM.render(<GetObjectRelationPopup fieldData = {supertype} id={id} search={"search"} superType={"superType"} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
		})
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")});
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	componentDidMount : function(){
		var name = this.props.name;
		var type = this.props.type;
		
		ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);

		$("#filterKeys").attr("readonly","readonly");
		$("#superType,#referenceSchema,#abstractObjName,#junctionSchemaLeft,#junctionSchemaRight,#sec-rec-view,#sec-rec-update").attr("readonly","readonly");
		$("#viewObjRowDiv,#abstractObjectDiv,#junctionSchemaNameDiv,#junctionSchemaDiv,#junctionSchemaRelationDiv,#referenceDiv,#superTypeDiv,#operationsRowDiv,#systemFunctionsDiv,#itemTypeDiv,#securityRecordLevelDiv,#showRelatedDiv,#recordNavDiv,#navViewsDiv").css("display","none");
		$("#likeDetailsDiv,#followDetailsDiv").css("display","none");
		$("#superType").removeAttr("disabled");
		if(name == "schema" && type == "new"){
			$("#superTypeDiv,#schemaTypeDiv,#schemaDiv,#referenceDiv,#operationsRowDiv,#systemFunctionsDiv,#itemTypeDiv").css("display","block");
		}else if(name == "schema" && type == "edit"){
			$("#superType").attr("disabled","disabled");
			$("#schemaTypeDiv,#superTypeDiv,#viewObjRowDiv,#operationsRowDiv,#systemFunctionsDiv,#itemTypeDiv,#showRelatedDiv,#recordNavDiv,#navViewsDiv").css("display","block");
			$(this.schemaName).attr("readonly","readonly");
		}
		var data = this.props.data;
		if(data){
			if(data["@type"] == "Object" || data["@type"] == "abstractObject" || data["@type"] == "derivedObject"){
				$("#schemaType").text(data["@type"]);
				$("#schemaName").val(data["@id"]);
				$("#superType").val(data["@superType"]);
				$("#itemType").val(data["@itemType"]);
				if(data["@type"] == "derivedObject"){
					$("#abstractObjectDiv").css("display","block");
					$("#abstractObjName").val(data["@abstractObject"]);
				}
			}else if(data["@type"] == "RelationSchema"){
				$("#junctionSchemaDiv").css("display","block");
				$("#superTypeDiv,#schemaDiv").css("display","none");
				$("#junctionSchemaLeft").val(data["@leftSchema"]);
				$("#junctionSchemaRight").val(data["@rightSchema"]);
				$("#schemaType").text("Junction Object");
				$("#itemType").val(data["@itemType"]);
				if(type == "edit"){
					$("#junctionSchemaNameDiv").css("display","block")
					$("#junctionObjectName").val(data["@id"]);
				}
			}else if(data["@type"] == "struct"){
				$("#superTypeDiv,#itemTypeDiv,.microData").css("display","none");
				$("#schemaType").text(data["@type"]);
				$("#schemaName").val(data["@id"]);
			}
		}
	},
	selectSchemaType : function(schemaName,ev){
		globalObjects = [];
		/*if(schemaName == "Object" || schemaName == "Abstract Object"){
			$("#pageStatus").text("1 OF 7          (Basic Properties)");
		}else if(schemaName == "Junction Object"){
			$("#pageStatus").text("1 OF 8          (Basic Properties)");
		}else if(schemaName.toLowerCase() == "struct"){
			$("#pageStatus").text("1 OF 2          (Basic Properties)");
		}*/
		$("#itemType,#domainName").val("");
		var name = this.props.name;
		var type = this.props.type;
		$("#schemaDiv,#superTypeDiv,#referenceDiv,#itemTypeDiv").css("display","block");
		$("#likeDetailsDiv,#followDetailsDiv").css("display","none");
		$("#systemFunctionsDiv").find("input:checkbox").removeAttr("checked");
		if(schemaName.toLowerCase() == "struct" && type == "new"){
			$(".microData").css("display","none");
			mainTitle = "Create Struct";
			subTitle = "Struct Name";
			placeholder = "Enter Struct Name";
			WebUtils.doPost("/schema?operation=getSchemaObjects",{},function(result){
				if(result.data.error){
					alert(result.data.error+"\n  select again");
				}
				globalObjects = schemaObjects = result.data;
				ReactDOM.render(<CreateNewSchema  schemaObjects ={schemaObjects} mainTitle={mainTitle} subTitle={subTitle} placeholder={placeholder} name={"struct"} type={"new"}/>,document.getElementById('dynamicContentDiv'));
			});

		}else if(schemaName.toLowerCase() == "struct" && type == "edit"){
			mainTitle = "Edit Struct";
			subTitle = "Struct Name";
			placeholder = "Select Struct";
			ReactDOM.render(<CreateNewSchema  schemaObjects ={""} mainTitle={mainTitle} subTitle={subTitle} placeholder={placeholder} name={"struct"} type={"edit"}/>,document.getElementById('dynamicContentDiv'));
		}else if(type == "new"){
			$("#viewObjRowDiv,#operationsRowDiv").css("display","block");
			mainTitle = "Create "+schemaName;
			subTitle = "Schema Name";
			placeholder = "Enter Schema Name";
			ReactDOM.render(<CreateNewSchema  schemaObjects ={""} mainTitle={mainTitle} subTitle={subTitle} placeholder={placeholder} name={"schema"} type={"new"}/>,document.getElementById('dynamicContentDiv'));
		}else if(type == "edit"){
			$("#viewObjRowDiv,#operationsRowDiv").css("display","block");
			mainTitle = "Edit "+schemaName;
			subTitle = "Schema Name";
			placeholder = "Select Schema";
			ReactDOM.render(<CreateNewSchema  schemaObjects ={""} mainTitle={mainTitle} subTitle={subTitle} placeholder={placeholder} name={"schema"} type={"edit"}/>,document.getElementById('dynamicContentDiv'));
		}
		
		if(schemaName.toLowerCase() == "struct"){
			$("#superType,#referenceSchema,#abstractObjName,#junctionSchemaLeft,#junctionSchemaRight").attr("readonly","readonly");
			$("#viewObjRowDiv,#abstractObjectDiv,#junctionSchemaNameDiv,#junctionSchemaDiv,#junctionSchemaRelationDiv,#referenceDiv,#superTypeDiv,#operationsRowDiv,#systemFunctionsDiv,#itemTypeDiv,#showRelatedDiv,#recordNavDiv,#navViewsDiv").css("display","none");
			$("#likeDetailsDiv,#followDetailsDiv").css("display","none");
		}
		if($("#schemaType").text() != schemaName){
			$("#schemaName").val("");
			$("#superType").val("");
			$("#referenceSchema").val("");
		}
		$("#schemaType").text(schemaName);
		if(schemaName.toLowerCase() == "derived object"){
			if(type == "new"){
				alert("you can not create derived object you can edit");
				return;
			}
			$("#abstractObjectDiv").css("display","block");
			$("#abstractObjName").val("");
			$("#schemaName").val("");
			$("#superType").val("");
			$("#referenceSchema").val("");
		}else if(schemaName.toLowerCase() == "junction object"){
			$("#schemaDiv,#abstractObjectDiv,#superTypeDiv,#referenceDiv").css("display","none");
			$("#junctionSchemaDiv").find("input:text").val("");
			$("#junctionSchemaDiv").css("display","block");
			if(type == "edit"){
				$("#junctionSchemaNameDiv").css("display","block");
				WebUtils.doPost("/schema?operation=getUserSchemas",{"name":"RelationSchema"},function(result){
					if(result.data.error){
						alert(result.data.error+"\n  select again");
					}
					getPopupContent("Select Schema","search","");
					ReactDOM.render(<GetObjectRelationPopup fieldData = {result.data} id={$("#junctionObjectName")[0]} search={"search"}/>,document.getElementById('genericPopupBody'));
				})
			}
		}else{
			$("#abstractObjectDiv,#junctionSchemaNameDiv,#junctionSchemaDiv,#junctionSchemaRelationDiv").css("display","none");
		}
	},
	getJunctionObject : function(ev){
		var id = ev.target;
		if(availableSchemas){
			getPopupContent("Select Schema","search","","","");
			ReactDOM.render(<GetObjectRelationPopup fieldData = {availableSchemas} id={id} search={"search"} junctionObject={true}/>,document.getElementById('genericPopupBody'));
		}else{
			WebUtils.doPost("/schema?operation=getCustomSchema",{},function(AllSchemas){
				if(AllSchemas.data.error){
					alert(result.data.error+"\n  select again");
				}
				availableSchemas = AllSchemas.data;
				getPopupContent("Select Schema","search","","","");
				ReactDOM.render(<GetObjectRelationPopup fieldData = {availableSchemas} id={id} search={"search"} junctionObject={true}/>,document.getElementById('genericPopupBody'));
			})
		} 
	},
	checkSchemaType : function(ev){
		var targetEle = ev.target;
		var name = this.props.name;
		var type = this.props.type;
		if($("#schemaType").text().toLowerCase() != "struct" && type == "edit"){
			var ele = this.schemaName;
			$(ele).attr("readonly","readonly");
				var name;
				if($("#schemaType").text().toLowerCase() == "object"){
					name = "Object";
				}else if($("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "abstractobject"){
					name = "abstractObject";
				}else if($("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "derivedobject"){
					name = $("#abstractObjName").val().trim();
					if(name == ""){
						alert("please select Abstract Object");
						return;
					}
				}
				if($("#schemaType").text() == $("#schemaType").parent().next().find("li").eq(0).text()){
					alert("please select schema type");
					return;
				}
				if($("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "derivedobject"){
					WebUtils.doPost("/schema?operation=getDerivedObjects",{name:name},function(schemas){
						if(schemas.data.error){
							alert(schemas.data.error+"\n  select again");
						}
						getPopupContent("Select Schema","search","","","");
						ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas.data} id={ele} search={"search"} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
					});
				}else{
					WebUtils.doPost("/schema?operation=getUserSchemas",{name:name},function(schemas){
						if(schemas.data.error){
							alert(schemas.data.error +"\n select again");
						}
						getPopupContent("Select Schema","search","","","");
						ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas.data} id={ele} search={"search"} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
					});
				}
		}else if($("#schemaType").text().toLowerCase() == "struct" && type == "edit"){
			var ele = this.schemaName;
			$(ele).attr("readonly","readonly");
			WebUtils.doPost("/schema?operation=getUserSchemas",{name:'struct'},function(schemas){
				if(schemas.data.error){
					alert(schemas.data.error +"\n select again");
				}
				getPopupContent("Select Struct","search","","","");
				ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas.data} id={ele} search={"search"} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
			});
		}
	},
	checkAvailability:function(ev){
		var name = this.props.name;
		var type = this.props.type;
		if(name == "schema" && type != "edit"){
			if($("#schemaType").text() == $("#schemaType").parent().next().find("li").eq(0).text()){
				alert("please select schema type");
				ev.target.value="";
				return;
			}
		}
		if(type != "edit"){
			var newSchemaName = camelize($("#schemaName").val().trim()).toLowerCase();
			for(var i = 0;i < allSchemaNames.length;i++){
				if(allSchemaNames[i].toLowerCase() == newSchemaName){
					alert(name+" name already exist. please try with another name");
					ev.target.value="";
					return;
				}
			}
		}
	},
	getAbstractObjects : function(ev){
		var id = ev.target;
		WebUtils.doPost("/schema?operation=getUserSchemas",{name:"abstractObject"},function(schemas){
			if(schemas.data.error){
				alert(schemas.data.error +"\n select again");
			}
			getPopupContent("Select Schema","search","","","");
			ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas.data} id={id} search={"search"} exitPost={true}/>,document.getElementById('genericPopupBody'));
		});
	},
	getDoaminName : function(ev){
		$('#genericDilog2,.modal-backdrop').remove();
		getPopupContent2("Select Domain Name","","button",ev.target,"fillMultidialogBoxData");
		ReactDOM.render(<FillDomainNames  id={ev.target}  search={"search"} ok={"ok"} />,document.getElementById('genericPopupBody2'));
	},
	configProperties : function(){
		var type = this.props.type;
		if($("#schemaType").text() == $("#schemaType").parent().next().find("li").eq(0).text()){
			alert("please select schema type");
			return;
		}
		if($("#schemaType").text() == "Object" || $("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "abstractobject" || $("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "derivedobject"){
			if($("#schemaName").val().trim() == ""){
				alert("please enter schema name");
				return;
			}
			/*if($("#superType").val().trim() == ""){
				alert("please select super type");
				$("#superType").focus();
				return;
			}
			if($("#itemType").val().trim() == ""){
				alert("please enter item type");
				return;
			}*/
			schemaJSON["@displayName"] = ($("#summaryHeading").val().trim());
			schemaJSON["displayName"] = ($("#summaryHeading").val().trim());
			schemaJSON["@id"] = camelize2($("#schemaName").val().trim());
			schemaJSON["@type"] = "Object";
			if($("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "abstractobject"){
				schemaJSON["@type"] = "abstractObject";
			}else if($("#schemaType").text().toLowerCase().replace(/\s+/g, "") == "derivedobject"){
				if(schemaJSON["@abstractObject"] == ""){
					alert("please select Abstract Object");
					return; 
				}
				schemaJSON["@type"] = "derivedObject";
				schemaJSON["@abstractObject"] = $("#abstractObjName").val().trim();
				schemaJSON["@id"] = $("#schemaName").val().trim();
			}
			schemaJSON["@superType"] = $("#superType").val().trim();
			schemaJSON["@itemType"] = $("#itemType").val().trim();
			ReactDOM.render(<PropertiesComp data={schemaJSON} type={type}/>,document.getElementById('dynamicContentDiv'));
		}else if($("#schemaType").text() == "Junction Object"){
			if($("#junctionSchemaLeft").val().trim() == ""){
				alert("please select Junction Schema name");
				return;
			}
			if($("#junctionSchemaRight").val().trim() == ""){
				alert("please select Junction Schema name");
				return;
			}
			schemaJSON["@type"] = "RelationSchema";
			schemaJSON["@leftSchema"] = $("#junctionSchemaLeft").val().trim();
			schemaJSON["@rightSchema"] = $("#junctionSchemaRight").val().trim();
			schemaJSON["@id"] = $("#junctionSchemaLeft").val().trim()+""+$("#junctionSchemaRight").val().trim();
			schemaJSON["@itemType"] = $("#itemType").val().trim();
			ReactDOM.render(<JunctionSchemaRelation  data={schemaJSON} type={type}/>,document.getElementById('dynamicContentDiv'));
		}else if($("#schemaType").text().toLowerCase() == "struct"){
			if($("#schemaName").val().trim() == ""){
				alert("please enter struct name");
				return;
			}
			schemaJSON["@id"] = camelize2($("#schemaName").val().trim());
			schemaJSON["@type"] = "struct";
			ReactDOM.render(<PropertiesComp data={schemaJSON} type={type}/>,document.getElementById('dynamicContentDiv'));
		}
		schemaJSON.docType = "schema";
		schemaJSON["@sysProperties"] = sysProperties;
		console.log(schemaJSON);
		
	},
	render : function(){
		getObjects = this.getObjects;
		subTitle= this.props.subTitle;
		mainTitle= this.props.mainTitle;
		placeholder = this.props.placeholder;
		summaryPlaceHolder=this.props.summaryPlaceHolder!=undefined?this.props.summaryPlaceHolder:"Enter the display name for the schema"
		name = this.props.name;
		type = this.props.type;
		selectSchemaType = this.selectSchemaType;
		var self=this;
		var temp={
			"schemaTypeDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"abstractObjectDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"schemaDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"superTypeDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"itemTypeDiv":"",
			"domainNamesDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"referenceDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"junctionSchemaNameDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"junctionSchemaDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"junctionSchemaRelationDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"schemaObjRow":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"systemFunctionsDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"viewObjRowDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"filterKeysDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"operationsRowDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"stateRowDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"intialStateDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"navViewsDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"showRelatedDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"recordNavDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			"securityDiv":"Lorem ipsum dolor sit amet, consectetur adipiscing elit."
		};
		var schemaTypes = ["Object","Abstract Object","Derived Object","Junction Object","Struct"];
		return  (<div className="row">
						<h3 id="schemastructeditnew" style={{"color":"#666"}} className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding ">{mainTitle}</h3>
							<div>
									<div id="schemaTypeDiv" className="col-lg-8 col-md-8 col-xs-12 margin-bottom-gap col-sm-12 no-padding">
										<label className="text-uppercase">SCHEMA TYPE</label><span className='errorMsg'>&nbsp;required</span>
										<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
							                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
						                     	<span data-bind="label" id="schemaType" ref="schemaType">Select Schema Type</span>
						                    </button>
						                    <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
					                           	<li><span >Select Schema</span></li>
					                           	{ 
					                           		schemaTypes.map(function(schemaType){
					                           			return <li onClick={this.selectSchemaType.bind(this,schemaType)}><span >{schemaType}</span></li>
					                           		},this) 	 
					                           	}
				                          	</ul>
										</div>
										<div>
										{
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["schemaTypeDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
													textValue=self.state.helpText["schemaTypeDiv"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
										</div>
									</div>
									<div id="abstractObjectDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
					            	   <label className="text-uppercase">ABSTRACT OBJECT</label><span className='errorMsg'>&nbsp;required</span>
					            	   <div className="row no-margin " >
					            	   	 	<input type='text' id="abstractObjName"  ref="abstractObjName" className="form-control " placeholder="select abstract object" onClick={this.getAbstractObjects}/>
					            	   </div>
					            	   {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["abstractObjectDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
													textValue=self.state.helpText["abstractObjectDiv"]
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
		           	   				</div>
								 	<div id="schemaDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
					            	   <label className="text-uppercase">{subTitle}</label><span className='errorMsg'>&nbsp;required</span>
					            	   <div className="row no-margin " >
					            	   	 	<input type='text' id="schemaName"  ref={(e)=>{this.schemaName=e}} className="form-control " placeholder={placeholder} onClick={this.checkSchemaType} onBlur={this.checkAvailability}/>
					            	   </div>
					            	   <label className="text-uppercase margin-top-gap-sm ">{"Display Name For Schema"}</label>
					            	    <div className="row no-margin " >
					            	   	 	<input type='text' id="summaryHeading"  ref="summaryHeading" className="form-control " placeholder={summaryPlaceHolder} />
					            	   </div>
					            	   
					            	   {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["schemaDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
													textValue=self.state.helpText["schemaDiv"]
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
		           	   				</div>
									  <div id="junctionSchemaNameDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap  no-padding">
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " >
										 	<label className="text-uppercase">junction OBJECT name</label>
											 <input type='text'  id="junctionObjectName" className="form-control remove-padding-left " placeholder="Junction Object name"/>
										 </div>
										  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["junctionSchemaNameDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
													 textValue=self.state.helpText["junctionSchemaNameDiv"]
												}
													return(<div className={classNames}>{textValue}</div>)
													
											})
										  }
									 </div>
									 <div id="junctionSchemaDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
										 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left" >
										 	<label className="text-uppercase">SELECT RELATION SCHEMA</label>
											 <input type='text'  id="junctionSchemaLeft" className="form-control remove-padding-left " placeholder="Select Schema" onClick={this.getJunctionObject}/>
										 </div>
										 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right " >
										  <label className="text-uppercase">SELECT RELATION SCHEMA</label>
											 <input type='text'  id="junctionSchemaRight" className="form-control remove-padding-left " placeholder="Select Schema" onClick={this.getJunctionObject}/>
										 </div>
										 {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["junctionSchemaDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
													 textValue=self.state.helpText["junctionSchemaDiv"]
												}
													return(<div className={classNames}>{textValue}</div>)
													
											})
										  }
									 </div>
									 <div id="junctionSchemaRelationDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
									 	{
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["junctionSchemaRelationDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
													textValue=self.state.helpText["junctionSchemaRelationDiv"]
												}
													return(<div className={classNames}>{textValue}</div>)
													
											})
										  }
									 </div>
		           	   				<h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding microData" style={{"color":"#666"}} >Set Microdata</h3>
		           	   				<div id="superTypeDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
										<label className="text-uppercase">SUPER TYPE</label>
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " >
											 <input type='text'  id="superType" className="form-control remove-padding-left" placeholder="Select super type"   onClick={this.getSuperTypeSchema}/>
										 </div>
										 {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["superTypeDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
													textValue=self.state.helpText["superTypeDiv"]
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									 </div>
									 <div id="itemTypeDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
										<label className="text-uppercase">item TYPE</label>
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " >
											 <input type='text'  id="itemType" className="form-control remove-padding-left" placeholder="Please Enter item type" />
										 </div>
										 {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["itemTypeDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
													textValue=self.state.helpText["itemTypeDiv"]
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									 </div>
									 <div id="domainNamesDiv" className="hidden col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
										<label className="text-uppercase">Domain Name</label>
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " >
											 <input type='text'  id="domainName" className="form-control remove-padding-left" placeholder="Please Select Domain Name" onClick={this.getDoaminName}/>
										 </div>
										 {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["domainNamesDiv"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
													textValue=self.state.helpText["domainNamesDiv"]
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									 </div>
		           	   				
									
								</div>
			          <br />
			          {
				          ["s"].map(function(tt){
				          	if(typeof window !="undefined" && $("#schemaType").text() == "Junction Object"){
				          		return(
				          			<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
					              		<label className="">
					              			<input type='button' className="btn  btn-warning"  onClick={self.configProperties} value='Configure Junction Relation'/>
					              		</label>
					              	</div>
				          		)
				          	}else{
				          		return(
				          			<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
					              		<label className="">
					              			<input type='button' className="btn  btn-warning"  onClick={self.configProperties} value='Configure Properties'/>
					              		</label>
					              	</div>
				          		)
				          	}
				          	
				          })
			          }
					</div>);
			}
})


var PropertiesComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	componentDidMount : function(){
		$("#likeDetailsDiv,#followDetailsDiv").css("display","none");
		$("#referenceSchema").attr("readonly","readonly");
		if(this.props.data["@referenceSchema"]){
			$("#referenceSchema").val(this.props.data["@referenceSchema"]).attr("disabled","disabled");;
		}
		
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("2 OF 7          (Configure Properties)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("3 OF 8          (Configure Properties)");
		}else if(schemaJSON["@type"] == "struct"){
			$("#referenceDiv").val("").css("display","none");
			$("#pageStatus").text("2 OF 2          (Configure Properties)");
		}*/
		
		if(schemaJSON.hasOwnProperty("@relations")){
			var relations = schemaJSON["@relations"];
			Object.keys(relations).map(function(sysFunction){
				var sysFun= $("#systemFunctionsDiv").find("div.row").find("input:checkbox");
				for(var i = 0;i<sysFun.length;i++){
					if(sysFun.eq(i).attr("class") == sysFunction){
						sysFun[i].checked=true;
						$("#"+sysFunction+"DetailsDiv").css("display","block");
						$("#"+sysFunction+"DetailsDiv").find("input:text").eq(0).val(relations[sysFunction].action.displayName);
						$("#"+sysFunction+"DetailsDiv").find("input:text").eq(1).val(relations[sysFunction].showRelated.displayName);
						break;
					}else{
						console.log(2);
					}
				}
			})
		}
		
		if(this.props.data["@properties"]){
			ReactDOM.render(<DisplayObject schemaUniqueObject={this.props.data["@properties"]} header={"none"}/>,document.getElementById('schemaObjRow'));	
		}
	},
	getObjects : function(id,ev){//used to open reference type schema
		var refSchema = id;
		var targetEle = ev.target;
		var id = $(ev.target)[0];
		if(this.props.type == "new"){
			if(globalObjects.length == 0){
				WebUtils.doPost("/schema?operation=getUserSchemas",{name:schemaJSON["@type"]},function(schemas){
					if(schemas.data.error){
						alert(schemas.data.error +"\n select again");
					}
					globalObjects = schemas.data;
					getPopupContent("Select Schema","search","","","");
					ReactDOM.render(<GetObjectRelationPopup fieldData = {globalObjects} id={id} refSchema = {refSchema} search={"search"} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
				});
			}else{
				getPopupContent("Select Schema","search","","","");
				ReactDOM.render(<GetObjectRelationPopup fieldData = {globalObjects} id={id} refSchema = {refSchema} search={"search"} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
			}
		}
	},
	addNewField:function(name,type,ev){ /*used to open a new popup for selecting new property*/
		getPopupContent("Add New Property In Your Schema","","ok","","saveSingleProperty");
		ReactDOM.render(<AddFieldPopup dataTypes={dataTypes} ok={"ok"} name = {name} type = {type}/>,document.getElementById('genericPopupBody'));
	},
	getSystemFunctions : function(id,ev){
		if(ev.target.checked){
			$("#"+id).css("display","block");
		}else{
			$("#"+id).find("input:text").val("");
			$("#"+id).css("display","none");
		}
	},
	backToIntial : function(){
		var type = this.props.type;
		var title;
		if(type == "edit"){
			title = "Edit "+schemaJSON["@type"].replace(/([A-Z])/g, ' $1');
		}else{
			title = "Create "+schemaJSON["@type"].replace(/([A-Z])/g, ' $1');
		}
		
		if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject" || schemaJSON["@type"] == "derivedObject"){
			ReactDOM.render(<CreateNewSchema data={this.props.data} schemaObjects={""} mainTitle={title} subTitle={'Schema Name'} placeholder={'placeholder'} name={'schema'} type={type} data={schemaJSON}/>,document.getElementById('dynamicContentDiv'));
			//$("#pageStatus").text("1 OF 7          (Basic Properties)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			ReactDOM.render(<JunctionSchemaRelation  data={schemaJSON} type={type}/>,document.getElementById('dynamicContentDiv'));
			//$("#pageStatus").text("2 OF 8         (Configure Elements Properties)");
		}else if(schemaJSON["@type"] == "struct"){
			ReactDOM.render(<CreateNewSchema data={this.props.data} schemaObjects={""} mainTitle={title} subTitle={'Schema Name'} placeholder={'placeholder'} name={'schema'} type={type} data={schemaJSON}/>,document.getElementById('dynamicContentDiv'));
			//$("#pageStatus").text("1 OF 2          (Basic Properties)");
		}
	},
	configOperation : function(){
		schemaJSON["@referenceSchema"] = $("#referenceSchema").val().trim();
		schemaJSON["@properties"] ? schemaJSON["@properties"] : schemaJSON["@properties"] = {};
		try{schemaJSON["@displayName"]=$("#summaryHeading").val().trim();
		schemaJSON["displayName"]=$("#summaryHeading").val().trim();}catch(err){}
		schemaJSON["@properties"] ? schemaJSON["@properties"] : schemaJSON["@properties"] = {};
		var len = $("#schemaObjRow").find("input:checkbox:visible").length;
		for(var i = 0;i < len;i++){
			if($("#schemaObjRow").find("input:checkbox:visible")[i].checked){
				schemaJSON["@properties"][$("#schemaObjRow").find("input:checkbox:visible")[i].name] =JSON.parse(JSON.stringify(finalObject[$("#schemaObjRow").find("input:checkbox:visible")[i].name]));
			}
		}
		
		if(Object.keys(schemaJSON["@properties"]).length < 1){//required validation for selecting atleast one property
			alert("please select atleast one property to save");
			return false;
		}
		
		if(schemaJSON["@type"] != "derivedObject" && schemaJSON["@type"] != "RelationSchema"){
			if(!$("#schemaObjRow").find("input:radio.identifier:checked")[0]){//required validation for selecting atleast one radio button
				schemaJSON["@identifier"] = "recordId";
			}else{
				schemaJSON["@identifier"] = $("#schemaObjRow").find("input:radio.identifier:checked").attr("id");
			}
		}
		
		schemaJSON["@relations"] ? schemaJSON["@relations"] : schemaJSON["@relations"]={};
		var systemProperties = $("#systemFunctionsDiv").find("div.row");
		for(var i = 0;i < systemProperties.length;i++){
			if(systemProperties.eq(i).find("input:checkbox")[0].checked){
				var relationRefSchema,knownKey,relationName;
				if(systemProperties.eq(i).find("input:checkbox").attr("class") == "follow"){
					relationRefSchema = "Follow";
					knownKey = "followee";
					relationName = "followedBy";
				}else{//if(systemProperties[i].find("input:checkbox").attr("class") == "follow")
					relationRefSchema = "Like";
					knownKey = "likedFor";
					relationName = "likedBy";
				}
				var sysProp = systemProperties.eq(i).find("input:checkbox").eq(0).parent().find("label")[0].id;
				schemaJSON["@relations"][sysProp] = {};
				schemaJSON["@relations"][sysProp]["systemFunction"] = "yes";
				schemaJSON["@relations"][sysProp]["relationRefSchema"] =relationRefSchema;
				schemaJSON["@relations"][sysProp]["knownKey"] = knownKey;
				schemaJSON["@relations"][sysProp]["relationName"] = relationName;
				schemaJSON["@relations"][sysProp]["action"] = {};
				schemaJSON["@relations"][sysProp]["action"]["displayName"] = systemProperties.eq(i).find("input:text").eq(0).val().trim();
				schemaJSON["@relations"][sysProp]["showRelated"] = {};
				schemaJSON["@relations"][sysProp]["showRelated"]["displayName"] = systemProperties.eq(i).find("input:text").eq(1).val().trim();
			}
		}
		
		
		if(schemaJSON["@type"] == "abstractObject"){
			if(!$("#schemaObjRow").find("input:radio.dependentKey:checked")[0]){
				alert("please select dependentKey");
				return false;
			}else{
				if($("#dynamicContentDiv").data("@dependentKey")){
					var oldDependentKey = $("#dynamicContentDiv").data("@dependentKey");
					var newDependentKey = $("#schemaObjRow").find("input:radio.dependentKey:checked").attr("id");
					var status;
					if(oldDependentKey != newDependentKey){
						status = confirm("Dependent key changed. press OK to delete old Derived Objects");
						if(status){
							schemaJSON["deleteOldDerivedDocs"] = true;
						} else{
							return false;
						}
					}
				}
				schemaJSON["@properties"][$("#schemaObjRow").find("input:radio.dependentKey:checked").attr("id")].dataType["derived"] = true;
				var status;
				if(!schemaJSON.hasOwnProperty("deleteOldDerivedDocs")){
					Object.keys(schemaJSON["@properties"]).map(function(property){
						if(schemaJSON["@properties"][property].dataType.type == "pickList"){
							if(schemaJSON["@properties"][property].dataType.hasOwnProperty("derived")){
								var array1 = schemaJSON["@properties"][property].dataType.options;
								var array2 = $("#dynamicContentDiv").data("dependentFieldOptions");
								if(array1 && array2){
									if(JSON.stringify(array1)!=JSON.stringify(array2)){
										status = confirm("some options changed.do you want to proceed");
										if(status){
											var removedArray=[];
											for(var i =0;i<array2.length;i++){
											  if(array1.indexOf(array2[i]) != -1){
											    
											  }else{
											   	removedArray.push(array2[i]);
											  }
											}
											schemaJSON["removableDerivedObjects"] = removedArray;
											console.log(removedArray);
										}else{
											status = false;
										}
									}else{
										status = true;
									}
								}else{
									status = true;
								}
							}else{
								status = true;
							}
						}
					});
				}
				if(!status){
					return;
				}
				Object.keys(schemaJSON["@properties"]).map(function(property){
					if(schemaJSON["@properties"][property].dataType.type == "pickList"){
						if(schemaJSON["@properties"][property].dataType.hasOwnProperty("derived")){
							delete schemaJSON["@properties"][property].dataType.derived;
						}
					}
				});
				
				schemaJSON["@dependentKey"] = $("#schemaObjRow").find("input:radio.dependentKey:checked").attr("id");
				schemaJSON["@properties"][$("#schemaObjRow").find("input:radio.dependentKey:checked").attr("id")].dataType["derived"] = true;
			}
		}
		
		
		schemaJSON["@relationDesc"] ? schemaJSON["@relationDesc"] : schemaJSON["@relationDesc"] = [];
		Object.keys(schemaJSON["@properties"]).map(function(property){
		  if(schemaJSON["@properties"][property] && 
		  		schemaJSON["@properties"][property].dataType && 
		  		schemaJSON["@properties"][property].dataType.type &&
		  		schemaJSON["@properties"][property].dataType.type == "object"){
		    if(schemaJSON["@properties"][property].dataType.hasOwnProperty("relationDesc")){
		      schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].dataType.relationDesc[0]);
		      schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].dataType.relationDesc[1]);
		    }else if(schemaJSON["@properties"][property].hasOwnProperty("parentData")){
		    	 schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].parentData.relationDesc[0]);
		      	 schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].parentData.relationDesc[1]);
		    }
		  }
		});
		
		console.log(schemaJSON);
		if(schemaJSON["@type"] == "struct"){
			schemaJSON["schemaCreatedDate"] = schemaJSON.hasOwnProperty("schemaCreatedDate") ? schemaJSON.schemaCreatedDate : global.getDate();
			schemaJSON["schemaModifiedDate"] = global.getDate();
			schemaJSON["revision"] = schemaJSON.hasOwnProperty("revision") ? schemaJSON.revision+1 : 1;
			saveSchema(schemaJSON);
		}else{
			ReactDOM.render(<OperationsComp types={["create","update","actions","delete"]} data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));	
		}
	},
	render : function(){
		var self = this;
		return  (
			<div>
				 <h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding " style={{"color":"#666"}} >Configure Properties</h3>
		          
		          <div id="referenceDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
					<label className="text-uppercase">REFERENCE SCHEMA</label>
					 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " >
						 <input type='text'  id="referenceSchema" className="form-control remove-padding-left relationWith" placeholder="Select reference schema" onClick={this.getObjects.bind(this,"referenceSchema")}/>
					 </div>
					 {
						["a"].map(function(temp){
							var classNames="hidden helpText";
							var textValue="";
							if(self.state.helpText && self.state.helpText["referenceDiv"]!=""){
								classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
								 textValue=self.state.helpText["referenceDiv"]
							}
							return(<div className={classNames}>{textValue}</div>)
							
						})
					}
				 </div>
		          
		          <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
	          		<div className="row no-margin " id="schemaObjRow" ref="schemaObjRow"> 	</div>	    
	          		<br/>      			
	          		 <div className="no-margin">
		          		<label>
				         	<input type='button' className="btn  btn-warning upload-drop-zone" onClick={this.addNewField.bind(this,"schema","new")}  value='ADD NEW'/>
				         </label>
				      </div>
				      {
						["a"].map(function(temp){
							var classNames="hidden helpText";
							
							var textValue="";
							if(self.state.helpText && self.state.helpText["schemaObjRow"]!=""){
								classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
								 textValue=self.state.helpText["schemaObjRow"]
							}
								return(<div className={classNames}>{textValue}</div>)
								
						})
					  }
		          </div>
		          <br/>
	          		<div id="systemFunctionsDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
		          		 	<label className="text-uppercase"> enable system functions</label>&nbsp;
			          		 <div className="row no-margin">
			          			<input type='checkbox'  id="likecheckbox" className="like" onClick={this.getSystemFunctions.bind(this,"likeDetailsDiv")}/>&nbsp;
							 	<label className="text-uppercase" id="like">LIKE</label>
								<div id="likeDetailsDiv">
									<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 padding-left form-group" >
									  <label className="text-uppercase"> Button name</label>
									  <input type='text'  id="likeActionBtnName" className="form-control remove-padding-left " placeholder="Enter button text"/>
									 </div>
									 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
									   <label className="text-uppercase">Button name</label>
										 <input type='text'  id="likeRelatedName" className="form-control remove-padding-left " placeholder="Enter button text"/>
									 </div>
								</div>
							</div>
							<div className="row no-margin">
							 	<input type='checkbox'  id="followcheckbox" className="follow" onClick={this.getSystemFunctions.bind(this,"followDetailsDiv")}/>&nbsp;
								<label className="text-uppercase" id="follow">follow</label>
								 <div id="followDetailsDiv">
									<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 padding-left form-group" >
									  <label className="text-uppercase">Button name</label>
									  <input type='text'  id="followActionBtnName" className="form-control remove-padding-left " placeholder="Enter Buton text"/>
									 </div>
									 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
									   <label className="text-uppercase">Button name</label>
										 <input type='text'  id="followRelatedName" className="form-control remove-padding-left " placeholder="Enter button text"/>
									 </div>
								 </div>
							</div>
							 {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["systemFunctionsDiv"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
										textValue=self.state.helpText["systemFunctionsDiv"]
									}
										return(<div className={classNames}>{textValue}</div>)
										
								})
						  	}
			          </div>
		          <br/>
		          <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
		          	<label className="pull-left">
		            	<input type='button' className="btn  btn-warning"  onClick={this.backToIntial} value='back'/>
		            </label>
		          {
		          	["s"].map(function(temp){
		          		if(schemaJSON["@type"] == "struct"){
		          			return(
		          				<label className="pull-right">
					            	<input type='button' className="btn  btn-warning"  onClick={self.configOperation} value='Save'/>
					            </label>
		          			)
		          		}else{
		          			return(
		          				<label className="pull-right">
					            	<input type='button' className="btn  btn-warning"  onClick={self.configOperation} value='Configure Operations'/>
					            </label>
		          			)
		          		}
		          	})
		          }
		          	
		          </div>
			</div>
		)
	}
})

var OperationsComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	componentDidMount : function(){
		var self = this;
		if(this.props.data.hasOwnProperty("@operations")){
			var operations = this.props.data["@operations"];
			Object.keys(operations).map(function(operation){
				if(operation == "delete"){
					if(Object.keys(operations[operation]).length>0){//ss
						var displayName = operations[operation]["delete"].displayName;
						var div = document.createElement("div");
				    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 opertionRow");
				    	$("#operationsRow #"+operation).append(div);
				    	ReactDOM.render(<AddOperationToUI  opData={operations[operation]} target={div} dispName={displayName} editOpName={operation}/>,div);
				    }
				}else{
					for(var i = 0;i<Object.keys(operations[operation]).length;i++){
						var div = document.createElement("div");
				    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 opertionRow");
				    	$("#operationsRow #"+operation).append(div);
				    	ReactDOM.render(<AddOperationToUI  opData={operations[operation]} target={div} dispName={Object.keys(operations[operation])[i]} editOpName={operation}/>,div);
					}							
				}
			})
		}
		this.props.types.map(function(operation){
			if($("#"+operation).children().length == 0){
				$("#"+operation).css("display","none");
			}else{
				$("#"+operation).css("display","block");
			}
		})
		/*if((schemaJSON["@type"] == "Object" && self.props.types.length == 1) || (schemaJSON["@type"] == "abstractObject" && self.props.types.length == 1)){
			$("#pageStatus").text("7 OF 7          (Configure Read)");
		}else if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("3 OF 7          (Configure Operations)");
		}else if(schemaJSON["@type"] == "RelationSchema" && self.props.types.length == 1){
			$("#pageStatus").text("8 OF 8          (Configure Read)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("4 OF 8          (Configure Operations)");
		}*/
	},
	addOperation:function(name,type,ev){/*used to open new popup for operations*/
		var targetEle = ev.target;
		
		if(Object.keys(finalObject).length == 0){
			alert("please add atleast property");
			return;
		}
		//var operations = ["create","update","actions"];//,"relations","delete","read"  XXX
		getPopupContent("Add Operation","","ok","","addOperation");
		ReactDOM.render(<AddOperationsPopup operations={this.props.types} ok={"ok"} name = {name} type = {type} targetEle = {targetEle}/>,document.getElementById('genericPopupBody'));
	},
	backToProperties : function(){
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("2 OF 7          (Configure Properties)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("3 OF 8          (Configure Properties)");
		}*/
		ReactDOM.render(<PropertiesComp data={this.props.data} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configStateMachine : function(){
		ReactDOM.render(<StateMachineComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	backToShowRelated : function(){
		ReactDOM.render(<ShowRelatedComp type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configTrigers : function(){
		schemaJSON["@relationDesc"] ? schemaJSON["@relationDesc"] : schemaJSON["@relationDesc"] = [];
		Object.keys(schemaJSON["@properties"]).map(function(property){
		  if(schemaJSON["@properties"][property] && 
		  		schemaJSON["@properties"][property].dataType && 
		  		schemaJSON["@properties"][property].dataType.type &&
			  	schemaJSON["@properties"][property].dataType.type == "object"){
		    if(schemaJSON["@properties"][property].dataType.hasOwnProperty("relationDesc")){
		      schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].dataType.relationDesc[0]);
		      schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].dataType.relationDesc[1]);
		    }else if(schemaJSON["@properties"][property].hasOwnProperty("parentData")){
		    	 schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].parentData.relationDesc[0]);
		      	 schemaJSON["@relationDesc"].push(schemaJSON["@properties"][property].parentData.relationDesc[1]);
		    }
		  }
		});

		schemaJSON["schemaCreatedDate"] = schemaJSON.hasOwnProperty("schemaCreatedDate") ? schemaJSON.schemaCreatedDate : global.getDate();
		schemaJSON["schemaModifiedDate"] = global.getDate();
		schemaJSON["revision"] = schemaJSON.hasOwnProperty("revision") ? schemaJSON.revision+1 : 1;
		console.log(schemaJSON);
		saveSchema(schemaJSON);
	},
	render : function(){
		var self= this;
		var titleText;
		if(self.props.types.length == 1){
			titleText = "Read";
		}else{
			titleText = "Operations"
		}
		return(
			<div>
			  <h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding " style={{"color":"#666"}} >{'Configure '+titleText}</h3>
	           <div id="operationsRowDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
		            <label className="text-uppercase"> operations</label>&nbsp;
	          		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="operationsRow" ref="operationsRow">
	          			{
	          				self.props.types.map(function(opName){
	          					return(
	          						<div className="text-uppercase operationIni" id={opName} ref={opName}>{opName}</div>
	          					)
	          				})
	          			}
	          		</div>
	          		<div>&nbsp;</div>
	          		<div className="no-margin" >
		          		<label>
		          		{
			          		["s"].map(function(temp){
			          			if(self.props.types.length == 1){
			          				return(<input type='button' className="btn  btn-warning upload-drop-zone" onClick={self.addOperation.bind(this,'schema','new')}  value='ADD READ'/>)
				         		}else{
				         			return(<input type='button' className="btn  btn-warning upload-drop-zone" onClick={self.addOperation.bind(this,'schema','new')}  value='ADD OPERATION'/>)
				         		}
				         	})
				         }
				         </label>
				    </div>
				      {
							["a"].map(function(temp){
								var classNames="hidden helpText";
								var textValue="";
								if(self.state.helpText && self.state.helpText["operationsRowDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
									textValue=self.state.helpText["operationsRowDiv"];
								}
								
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  }
		        </div>
		        
		         <br/>
		          <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
		          	{
			          	["s"].map(function(temp){
			          		if(self.props.types.length == 1){
			          			return(
			          				<div>
			          					<label className="pull-left">
							            	<input type='button' className="btn  btn-warning"  onClick={self.backToShowRelated} value='back'/>
							            </label>
							          	<label className="pull-right">
							            	<input type='button' className="btn  btn-warning"  onClick={self.configTrigers} value='save'/>
							            </label>
			          				</div>
			          			)
			          		}else{
			          			return(
			          				<div>
			          					<label className="pull-left">
							            	<input type='button' className="btn  btn-warning"  onClick={self.backToProperties} value='back'/>
							            </label>
							          	<label className="pull-right">
							            	<input type='button' className="btn  btn-warning"  onClick={self.configStateMachine} value='Configure State Machine'/>
							            </label>
			          				</div>
			          			)
			          		}
			          	})
		          	}
		          </div>
			</div>
		)
	}
})

var StateMachineComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	addstateNames : function(ev){
         getPopupContent("State Names","","button",ev.target,"saveStateNames");
        // ReactDOM.render(<GetStateNamesPopup schemaData = {schemaJSON} id={ev.target}  search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
         ReactDOM.render(<StateNamesComponent search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
    },
    addState : function(ev){
		if(!schemaJSON["@stateNames"]){
			alert("please add State Names");
            return;
		}
		getPopupContent("Create State","","button",ev.target,"saveState");
		ReactDOM.render(<GetStatePopup  id={ev.target}  search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
		var div = document.createElement("div");
    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding stateRow");
    	$("#stateActionDiv").append(div);
		ReactDOM.render(<GetStateCommonPopup  id={ev.target}  search={""} ok={""} />,div);
	},
	selectIntialState : function(ev){
        if(schemaJSON.hasOwnProperty("@state")){
            getPopupContent("Select Initial State","search","","","");
            ReactDOM.render(<GetInitialStatePopup statesData = {schemaJSON["@state"]} id={ev.target}  search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
        }else{
            alert("please add Transitions");
        }   
    },
    backToOperations : function(){
    	/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("3 OF 7          (Configure Operations)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("4 OF 8          (Configure Operations)");
		}*/
		ReactDOM.render(<OperationsComp data={this.props.data} types={["create","update","actions","delete"]} data={this.props.data} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configView : function(){
		ReactDOM.render(<ShowViewComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	componentDidMount : function(){
		if(schemaJSON["@stateNames"]){
			ReactDOM.render(<AddstateNamesToUI  stateNames ={schemaJSON["@stateNames"]} />,document.getElementById('stateNamesRow'));
			$("#transitionDiv").css('display','block');
		}else{
			$("#transitionDiv,#intialStateDiv").css('display','none');
		}
		if(schemaJSON.hasOwnProperty("@state")){
			if(!schemaJSON.hasOwnProperty("@stateNames")){//ss
				schemaJSON["@stateNames"]={};
				Object.keys(schemaJSON["@state"]).map(function(SName){
					schemaJSON["@stateNames"][SName]={};
					schemaJSON["@stateNames"][SName]["displayName"]=SName;
				})
			}
			ReactDOM.render(<DisplayState  state ={schemaJSON["@state"]} />,document.getElementById('stateRow'));
			$("#initialStateInput").val(schemaJSON["@initialState"])
			$("#intialStateDiv").css('display','b');
		}else{
			$("#intialStateDiv").css('display','none');
		}
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("4 OF 7          (Configure State Machine)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("5 OF 8          (Configure State Machine)");
		}*/
	},
	render : function(){
		var self= this;
		return(
			<div>
				<h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding " style={{"color":"#666"}} >Configure State Machine</h3>
		          <div id="stateRowDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
		          	  <label className="text-uppercase" > states</label>
		          	  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="stateNamesRow" ref="stateNamesRow"></div>
		          	   <div className="no-margin">
		          		<label>
				         	<input type='button' className="btn  btn-warning upload-drop-zone"  onClick={this.addstateNames} value='ADD State'/>
				         </label>
				      </div>
				      <div id="transitionDiv">
			            <label className="text-uppercase"> Transitions</label>&nbsp;
		          		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="stateRow" ref="stateRow">
		          			
		          		</div>
		          		<div>&nbsp;</div>
	          		 	<div className="no-margin">
			          		<label>
					         	<input type='button' className="btn  btn-warning upload-drop-zone"  onClick={this.addState.bind(this)} value='ADD Transition'/>
					         </label>
				      	</div>
				      </div>
				      {
							["a"].map(function(temp){
								var classNames="hidden helpText";
								var textValue="";
								if(self.state.helpText && self.state.helpText["stateRowDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
									 textValue=self.state.helpText["stateRowDiv"];
								}
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  	}
		          </div>
		          
		          <div id="intialStateDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
                    <label className="text-uppercase">Select Intial State</label>&nbsp;
                    <input type='text'  id="initialStateInput" readOnly="true" className="form-control remove-padding-left " placeholder="Intial State" onClick={this.selectIntialState.bind(this)}/>
                  	 {
							["a"].map(function(temp){
								var classNames="hidden helpText";
								var textValue="";
								if(self.state.helpText && self.state.helpText["intialStateDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
									textValue=self.state.helpText["intialStateDiv"]
								}
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  	}
                  </div>
                  
                   <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
		          	<label className="pull-left">
		            	<input type='button' className="btn  btn-warning"  onClick={this.backToOperations} value='back'/>
		            </label>
		          	<label className="pull-right">
		            	<input type='button' className="btn  btn-warning"  onClick={this.configView} value='Configure Views'/>
		            </label>
		          </div>
			</div>
		)
	}
})


var ShowViewComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	addView:function(name,type,ev){//used to add views
		getPopupContent("Add View","","ok","","saveView");
		ReactDOM.render(<AddViewPopup  ok={"ok"}/>,document.getElementById('genericPopupBody'));
	},
	showSecurity : function(ev){
		$("#viewAll")[0].checked=false;
		$("#updateAll")[0].checked=false;
		$("#sec-rec-view,#sec-rec-update").val("");
		if(ev.target.checked){
			$("#securityRecordLevelDiv").css("display","block");
		}else{
			$("#securityRecordLevelDiv").css("display","none");
		}
	},
	openSecurityProps : function(ev){
		var props = mergeRecursive(formulaObjects,sysProperties);
		var temp = [];
		Object.keys(props).map(function(prop){temp.push(prop)})
		getPopupContent("Select Property","search","","","");
		ReactDOM.render(<GetObjectRelationPopup fieldData = {temp} id={ev.target} exitPost={true} search={"search"} superType={""}/>,document.getElementById('genericPopupBody'));
	},
	backToStateMachine : function(){
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("4 OF 7          (Configure State Machine)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("6 OF 8          (Configure State Machine)");
		}*/
		
		ReactDOM.render(<StateMachineComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	getFilterKeys : function(ev){
		var viewsLength = schemaJSON["@views"] ? schemaJSON["@views"].length : 0;
		if(viewsLength == 0){
			alert("please add SUMMARY view");
			return;
		}
		var status = true;
		for(var i = 0;i < viewsLength;i++){
			if(schemaJSON["@views"][i].viewName == "summary"){
				status = false
				/*if(schemaJSON["@views"][i].key[0] == "org"){
					$("input:text#filterKeys").val(schemaJSON["@views"][i].key.splice("1",schemaJSON["@views"][i].key.length));
					break;
				}else{
					$("input:text#filterKeys").val(schemaJSON["@views"][i].key);
				//	break;
				}*/
				getPopupContent("Select Filter Keys","","button",ev.target,"fillMultiCheckboxData");
				ReactDOM.render(<GetMultiCheckboxData  id={ev.target}  ok={"ok"} data={schemaJSON["@views"][i].key}/>,document.getElementById('genericPopupBody'));
				break;
			}
		}
		if(status){
			alert("please add SUMMARY view");
			return;
		}
	}, 
	configSecurity : function(){
		schemaJSON["@filterKeys"] = [];
		if($("input:text#filterKeys").val().trim() != ""){
			$("input:text#filterKeys").val().trim().split(",").map(function(key){
				schemaJSON["@filterKeys"].push(key);
			});
		}
		ReactDOM.render(<ShowSecurityComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	componentDidMount : function(){
		if(schemaJSON.hasOwnProperty("@filterKeys")){
			$("input:text#filterKeys").val(schemaJSON["@filterKeys"]);
		}
		if(schemaJSON.hasOwnProperty("@views")){
			views = schemaJSON["@views"];
			ReactDOM.render(<DisplayView  views ={schemaJSON["@views"]} />,document.getElementById('viewObjRow'));
			$("#filterKeysDiv").css('display','block');
		}else{
			$("#filterKeysDiv").css('display','none');
		}
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("5 OF 7          (Configure Views)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("6 OF 8          (Configure Views)");
		}*/
	},
	render : function(){
		var self= this;
		return(
			<div>
				<h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding " style={{"color":"#666"}} >Configure Views</h3>
				   <div  id="viewObjRowDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
		            <div><label >VIEWS</label></div>
	          		<div className="row no-margin " id="viewObjRow" ref="viewObjRow"> 	</div><br />
	          		
	          		 <div className="no-margin">
		          		<label>
				         	<input type='button' className="btn  btn-warning upload-drop-zone"  id="addViewBtn" onClick={this.addView.bind(this,name,type)} value='ADD VIEW'/>
				         </label>
				      </div>
				       {
							["a"].map(function(temp){
								var classNames="hidden helpText";
								var textValue="";
								if(self.state.helpText && self.state.helpText["viewObjRowDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
									 textValue=self.state.helpText["viewObjRowDiv"]
								}
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  	}
		          </div>
		          
		          <div  id="filterKeysDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
	          		<label className="text-uppercase">setup filters</label>
	          		 <div className="no-margin">
				         	<input type='text' className="form-control"  placeholder="select filterkeys" id="filterKeys" onClick={this.getFilterKeys.bind(this)}/>{/*onClick={this.getFilterKeys.bind(this)}*/}
				      </div>
				       {
							["a"].map(function(temp){
								var classNames="hidden helpText";
								var textValue="";
								if(self.state.helpText && self.state.helpText["filterKeysDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText";
									 textValue=self.state.helpText["filterKeysDiv"]
								}
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  	}
		          </div>
		          
		          <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
		          	<label className="pull-left">
		            	<input type='button' className="btn  btn-warning"  onClick={this.backToStateMachine} value='back'/>
		            </label>
		          	<label className="pull-right">
		            	<input type='button' className="btn  btn-warning"  onClick={this.configSecurity} value='Configure Security'/>
		            </label>
		          </div>
			</div>
		)
	}
})

var ShowSecurityComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	showSecurity : function(ev){
		$("#viewAll")[0].checked=false;
		$("#updateAll")[0].checked=false;
		$("#sec-rec-view,#sec-rec-update").val("");
		if(ev.target.checked){
			$("#securityRecordLevelDiv").css("display","block");
		}else{
			$("#securityRecordLevelDiv").css("display","none");
		}
	},
	openSecurityProps : function(ev){
		var props = mergeRecursive(formulaObjects,sysProperties);
		var temp = [];
		Object.keys(props).map(function(prop){temp.push(prop)})
		getPopupContent("Select Property","search","","","");
		ReactDOM.render(<GetObjectRelationPopup fieldData = {temp} id={ev.target} exitPost={true} search={"search"} superType={""}/>,document.getElementById('genericPopupBody'));
	},
	componentDidMount : function(){
		if(schemaJSON.hasOwnProperty("@security")){
			var security = schemaJSON["@security"];
			if(Object.keys(security).length > 0){
				$("#recordLevel")[0].checked = true;
				$("#securityRecordLevelDiv").css("display","block");
				$("#sec-rec-view,#sec-rec-update").val("");
				if(security.recordLevel.view == "all"){
					$("#viewAll")[0].checked = true;
				}else{
					$("input:text#sec-rec-view").val(security.recordLevel.view);
				}
				if(security.recordLevel.update == "all"){
					$("#updateAll")[0].checked = true;
				}else{
					$("input:text#sec-rec-update").val(security.recordLevel.update);
				}
			}
			
		}else{
			$("#recordLevel")[0].checked = false;
			$("#sec-rec-view,#sec-rec-update").val("");
			$("#securityRecordLevelDiv").css("display","none");
		}
	},
	backToViews : function(){
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("4 OF 7          (Configure Security");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("6 OF 8          (Configure State Machine)");
		}*/
		ReactDOM.render(<ShowViewComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configShowNavigation : function(){
		schemaJSON["@security"] = {}; 
		if($("#recordLevel")[0].checked){
			if(!$("#viewAll")[0].checked && $("#sec-rec-view").val().trim() == ""){
				alert("Please fill view in security");
				return;
			}
			if(!$("#updateAll")[0].checked && $("#sec-rec-update").val().trim() == ""){
				alert("Please fill update in security");
				return;
			}
			
			schemaJSON["@security"]["recordLevel"] = {};
			schemaJSON["@security"].recordLevel["view"] = $("#viewAll")[0].checked ? "all" : $("#sec-rec-view").val().trim();
			schemaJSON["@security"].recordLevel["update"]  = $("#updateAll")[0].checked ? "all" :  $("#sec-rec-update").val().trim();
		}
		ReactDOM.render(<ShowNavigationComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	render : function(){
		var self= this;
		return(<div>
				<h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding " style={{"color":"#666"}} >Configure Security</h3>
			 		<div id="securityDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
	          		 	<label className="text-uppercase"> security</label>&nbsp;
		          		 <div className="row no-margin">
		          			<input type='checkbox'  id="recordLevel" className="recordLevel" onClick={this.showSecurity.bind(this)}/>&nbsp;
						 	<label className="text-uppercase" id="like">record level</label>
							<div id="securityRecordLevelDiv">
								<div className="row no-margin " >
								  <label className="text-uppercase">view</label>&nbsp;&nbsp;&nbsp;
								   <input type='checkbox'  id="viewAll" className="viewAll"/>&nbsp;
						 		  <label className="text-uppercase" >all</label>&nbsp;
								  <input type='text'  id="sec-rec-view" className="form-control remove-padding-left " placeholder="select property" onClick={this.openSecurityProps.bind(this)}/>
								 
								 </div>
								 <div className="row no-margin " >
								   <label className="text-uppercase">update</label>&nbsp;&nbsp;&nbsp;
								   <input type='checkbox'  id="updateAll" className="updateAll"/>&nbsp;
						 		  <label className="text-uppercase" >all</label>&nbsp;
									<input type='text'  id="sec-rec-update" className="form-control remove-padding-left " placeholder="select property" onClick={this.openSecurityProps.bind(this)}/>
									
								 </div>
							</div>
						</div>
						{
							["a"].map(function(temp){
								var classNames="hidden helpText";var textValue="";var textValue="";
								if(self.state.helpText && self.state.helpText["securityDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
									textValue=self.state.helpText["securityDiv"]
								}
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  	}
			      </div>
		          <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
		          	<label className="pull-left">
		            	<input type='button' className="btn  btn-warning"  onClick={this.backToViews} value='back'/>
		            </label>
		          	<label className="pull-right">
		            	<input type='button' className="btn  btn-warning"  onClick={this.configShowNavigation} value='Configure Navigation'/>
		            </label>
		          </div>
		     </div>
		)
	}
})

var GetMultiCheckboxData = React.createClass({
	componentDidMount : function(){
		if(this.props.id.value != ""){
			this.props.id.value.split(",").map(function(prop){
				for(var i=0;i<$("#genericPopupBody").find("span.link").length;i++){
				  if($("#genericPopupBody").find("span.link").eq(i).text() == prop){
				  	$("#genericPopupBody").find("input:checkbox").eq(i).attr("checked","true")
				  }
				}
			})
		}
	},
	render : function(){
		var data = this.props.data;
		return (
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
				{
					data.map(function(data){
					    return (
								 <div className="row no-margin ">
									 <div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 no-padding">
									 	<input type="checkbox" className={data + " property" } id={data}/>&nbsp;
				            	   		<span className="fieldText link">{data}</span>
				            	    </div>
		            	        </div>
							 )
					})
				}
	         </div>
			)
	}
})

function fillMultiCheckboxData(target,ev){
	var length = $("#genericPopupBody input:checkbox:checked").length;
	var output = [];
	for(var i = 0;i < length;i++){
		output.push($("#genericPopupBody input:checkbox:checked")[i].id);
	}
	target.value = output;
	removeDilogBox();
}

var ShowNavigationComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	addNavView : function(ev){
	  
	   // $('#genericDilog,.modal-backdrop').remove();
        getPopupContent("Create NavView","","button",ev.target,"saveNavView");
        ReactDOM.render(<GetNavViewPopup schemaData = {schemaJSON} id={ev.target}  search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
   	},
	handleRecordNavSchema:function(ev){
        getPopupContent("RecordNav","","button",ev.target,"saveRecordNav");
        ReactDOM.render(<GetRecordNavPopup schemaData = {schemaJSON} id={ev.target}  search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
    },
    componentDidMount : function(){
        if(schemaJSON.hasOwnProperty("@navViews")){
		    ReactDOM.render(<DisplayNavView  navView ={schemaJSON["@navViews"]} />,document.getElementById('navViewRow'));
		}
	},
	backToSecurity : function(){
		ReactDOM.render(<ShowSecurityComp data={this.props.data} type={this.props.type} />,document.getElementById('dynamicContentDiv'));
	},
	configShowRelated : function(){
		ReactDOM.render(<ShowRelatedComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	render : function(){
		var self = this;
		return  (
			<div>
				<h3 className="remove-margin-top remove-margin-top line no-padding " style={{"color":"#666"}} >Configure Navigation</h3>
				 <div id="navViewsDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
                    <label className="text-uppercase">Navigation Elements</label>&nbsp;
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="navViewRow" ref="navViewRow">
                        
                    </div>
                    <div>&nbsp;</div>
                     <div className="no-margin">
                     
                        <label>
                            <input type='button' className="btn  btn-warning upload-drop-zone"  onClick={this.addNavView.bind(this)} value='ADD Element'/>
                         </label>
                      </div>
                      {
							["a"].map(function(temp){
								var classNames="hidden helpText";
								var textValue="";
								if(self.state.helpText && self.state.helpText["navViewsDiv"]!=""){
									classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  helpText"; 
									textValue=self.state.helpText["navViewsDiv"]
								}
									return(<div className={classNames}>{textValue}</div>)
									
							})
					  	}
                  </div>
			          
                  <div id="recordNavDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding"> 
                    <label className="text-uppercase link link-btn" onClick={this.handleRecordNavSchema}>record navigation</label>
                    {
						["a"].map(function(temp){
							var classNames="hidden helpText";
							var textValue="";;
							if(self.state.helpText && self.state.helpText["recordNavDiv"]!=""){
								classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
								textValue=self.state.helpText["recordNavDiv"]
							}
								return(<div className={classNames}>{textValue}</div>)
								
						})
				  	}
                  </div>
				  	
				  <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
			      	 	<label className="pull-left">
			            	<input type='button' className="btn  btn-warning"  onClick={this.backToSecurity} value='back'/>
			            </label>
			          	<label className="pull-right">
			            	<input type='button' className="btn  btn-warning"  onClick={this.configShowRelated} value='Configure Show Related'/>
			            </label>
		          </div>
			</div>
		)
	}
})

var ShowRelatedComp = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition('HelpTextForSchema')};
	},
	addShowRelated : function(ev){
       getPopupContent("Create ShowRelated","","button",ev.target,"saveShowRelated");
       ReactDOM.render(<GetShowRelatedPopup schemaData = {schemaJSON} id={ev.target}  search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
    },
    backToNavigation : function(){
    	/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("5 OF 7          (Configure Views)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("6 OF 8          (Configure Views)");
		}*/
		ReactDOM.render(<ShowNavigationComp data={this.props.data} type={this.props.type} />,document.getElementById('dynamicContentDiv'));
	},
	backToShowRelated : function(){
		ReactDOM.render(<ShowRelatedComp type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configStateMachine : function(data){
		ReactDOM.render(<StateMachineComp data={data} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configRead : function(){
		ReactDOM.render(<defineRecordLayout.SelectedLayoutForSchema fullSchema={schemaJSON} fromSchema={"yes"} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
		//ReactDOM.render(<OperationsComp types={["read"]} data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	componentDidMount : function(){
		if(schemaJSON.hasOwnProperty("@showRelated")){
            ReactDOM.render(<DisplayShowRelated  showRelated ={schemaJSON["@showRelated"]} />,document.getElementById('showRelatedRow'));
        }
		/*if(schemaJSON["@type"] == "Object" || schemaJSON["@type"] == "abstractObject"){
			$("#pageStatus").text("6 OF 7          (Configure Navigation)");
		}else if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("7 OF 8          (Configure Navigation)");
		}*/
	},
	render : function(){
		var self= this;
		return(
			 <div id="showRelatedDiv" className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
			 <h3 className="remove-margin-top remove-margin-top line no-padding " style={{"color":"#666"}} >Configure Show Related</h3>
                <label className="text-uppercase">show related</label>&nbsp;
                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="showRelatedRow" ref="showRelatedRow">
                    
                </div>
                 <div>&nbsp;</div>
                 <div className="no-margin">
                    <label>
                        <input type='button' className="btn  btn-warning upload-drop-zone"  onClick={this.addShowRelated.bind(this)} value='ADD ShowRelated'/>
                     </label>
                  </div>
                   {
						["a"].map(function(temp){
							var classNames="hidden helpText";
							var textValue="";
							if(self.state.helpText && self.state.helpText["showRelatedDiv"]!=""){
								classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-bottom-gap no-padding helpText"; 
								textValue=self.state.helpText["showRelatedDiv"];
							}
								return(<div className={classNames}>{textValue}</div>)
								
						})
				  	}
				  	<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
			          	<label className="pull-left">
			            	<input type='button' className="btn  btn-warning"  onClick={this.backToNavigation} value='back'/>
			            </label>
			          	<label className="pull-right">
			            	<input type='button' className="btn  btn-warning"  onClick={this.configRead} value='Configure Read'/>
			            </label>
		          </div>
             </div>
		)
	}
})
exports.ShowRelatedComp=ShowRelatedComp;

var FillDomainNames = React.createClass({
	componentDidMount : function(){
		var domainNames = $("#domainName").val().trim();
		if(domainNames){
			domainNames.split(",").map(function(domain){
				$("input:checkbox#"+domain).attr("checked","true");
			})
		}
	},
	render : function(){
		var domainNames = ["wevaha","jsm","localX","cloudC","cloudseed","development"];
		return  (
			<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
				{
					domainNames.map(function(domain){
						return (
								 <div className="row no-margin ">
									 <div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 no-padding">
									 	<input type="checkbox" className={domain + " property" } id={domain}/>&nbsp;
				            	   		<span className="fieldText link">{domain}</span>
				            	    </div>
		            	        </div>
							 )
					})
				}
	         </div>
		)
	}
})

var GetStateCommonPopup = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
       
	getActionName : function(action,ev){
		$(ev.target).parents("ul").parent().find("button span").text(action);
	},
	componentDidMount : function(){
		 ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);

		if(this.props.edit){
			$(this.getDOMNode()).find("span.stateActionNameSpan").text(this.props.actionName);
		}
	},
	render : function(){
		var self=this;
		var actions = [];
		var actionData={}
		actionData = mergeRecursive(actionData,schemaJSON["@operations"] ? schemaJSON["@operations"].update ? schemaJSON["@operations"].update: {} : {}); 
		actionData = mergeRecursive(actionData,schemaJSON["@operations"] ? schemaJSON["@operations"].actions ? schemaJSON["@operations"].actions: {} : {});
		actionData = mergeRecursive(actionData,schemaJSON["@operations"] ? schemaJSON["@operations"].delete ? schemaJSON["@operations"].delete: {} : {});
		actionData = mergeRecursive(actionData,schemaJSON["@operations"] ? schemaJSON["@operations"].relations ? schemaJSON["@operations"].relations: {} : {});
		Object.keys(actionData).map(function(action){
			actions.push(action);
		})
		return(<div>
				<div id="stateActionNameDiv" className="row remove-margin-left margin-bottom-gap remove-margin-right">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left">
						 <span>ACTION NAME</span>
						 {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["AddStateActionName"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["AddStateActionName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
		                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
	                     	<span data-bind="label" className="stateActionNameSpan" ref="stateActionNameSpan">Select Action Name</span>
	                    </button>
	                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
                           	<li><span >Select Action Name</span></li>
                           	{ 
                           		actions.map(function(action){
                           			return <li><span onClick={this.getActionName.bind(this,action)}>{action}</span></li>
                           		},this) 	 
                           	}
                      	</ul>
					</div>
				</div>
				<StateConditionComponent condData={this.props.data ? this.props.data : ""}/>
			</div>
		)
	}
})

var StateConditionComponent= React.createClass({
	getInitialState:function(){
		return {stateCount :this.props.condData ? this.props.condData.length : 1,helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
    },
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
       
	getActionName : function(action,ev){
		$(ev.target).parents("ul").parent().find("button span").text(action);
	},
    addStateCondition : function(){
    	this.setState(
    		{stateCount:this.state.stateCount+1}
    	);
    },
    selectDestinationState : function(state,ev){
		$(ev.target).parents("div").eq(0).find("button > span").text(state);
	},
	componentDidMount :function(){
		 ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
		var condData =  this.props.condData;
		for(var i=0;i<condData.length;i++){
			$(this.getDOMNode()).find("span.destinationState").eq(i).text(condData[i] ? condData[i].state : "");
		}
	},
	render:function(){
		var stateCondHtml=[];
		var stateNames;
		var self=this;
		schemaJSON["@stateNames"] ? (stateNames = schemaJSON["@stateNames"]) : (stateNames = {});
		var condData =  this.props.condData;
		for(var i=0;i<this.state.stateCount;i++){
			stateCondHtml.push(
							<div>
								<div id="stateConditionDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase stateConditionSpan">STATE CONDITION</span>
										 {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddStateStateCondition"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddStateStateCondition"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' defaultValue={condData[i] ? condData[i].condition : ""} className="form-control form-group stateCondition" placeholder="please enter State Condition" />
									</div>
								</div>
								
								<div id="stateDestinationDiv" className="row  remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span className="text-uppercase stateDestinationSpan">DESTINATION STATE</span>
									  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddStateDestinationState"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddStateDestinationState"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
								</div>
								<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
					                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="stateNameButton" data-toggle="dropdown">
				                     	<span data-bind="label" className="form-group destinationState" >Select Destination State</span>
				                    </button>
				                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
				                       	<li><span >Select Destination State</span></li>
				                       	{ 
				                       		Object.keys(stateNames).map(function(state){
				                       			return <li><span onClick={this.selectDestinationState.bind(this,state)}>{state}</span></li>
				                       		},this) 	 
				                       	}
				                  	</ul>
								</div>
								</div>
							</div>
						)
		}
		return(<div id="stateConditionsDiv">
				{stateCondHtml}
				<div className="row no-margin">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
	              		<label >
	  						<input type='button' className="btn  btn-warning upload-drop-zone form-group" value='ADD CONDITION' onClick={this.addStateCondition.bind(this)} />
	  					</label>
	  				</div>
  				</div>
			   </div>
		)
	}
})

var GetStatePopup = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount : function(){
        ActionCreator.getDefinition("HelpTextForAuthorization");
		DefinitionStore.addChangeListener(this._onChange);
		
		if(this.props.edit){
			var stateName = this.props.stateName;
			var stateData = schemaJSON["@state"][stateName];
			$("#stateName").text(stateName);
			var i = 0;
			Object.keys(schemaJSON["@state"][stateName]).map(function(stateDetails){
				var div = document.createElement("div");
		    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding stateRow");
		    	$("#stateActionDiv").append(div);
				ReactDOM.render(<GetStateCommonPopup  id={""}  edit = {true} search={""} ok={""}  data = {schemaJSON["@state"][stateName][stateDetails]} actionName={stateDetails}/>,div);
				i = i+1;
			})
		}
	},
	addGetStateCommonPopup : function(ev){
		var div = document.createElement("div");
    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding stateRow");
    	$("#stateActionDiv").append(div);
		ReactDOM.render(<GetStateCommonPopup  id={""}  search={""} ok={""} />,div);
	},
	selectStateName : function(state,ev){
		$("#stateName").text(state);
	},
	render : function(){
		var self=this;
		var stateNames;
		schemaJSON["@stateNames"] ? (stateNames = schemaJSON["@stateNames"]) : (stateNames = {}) 
		var selectStateName = this.selectStateName;
		return(<div>
				<div id="stateNameDiv" className="row remove-margin-left rmeove-margin-right margin-bottom-gap">
				<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
					 <span className="text-uppercase stateNameSpan">STATE NAME</span>
					 {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["AddStateName"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["AddStateName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
				</div>
				<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
	                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="stateNameButton" data-toggle="dropdown">
                     	<span data-bind="label" id="stateName">Select State Name</span>
                    </button>
                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
                       	<li><span >Select State Name</span></li>
                       	{ 
                       		Object.keys(stateNames).map(function(state){
                       			return <li><span onClick={this.selectStateName.bind(this,state)}>{state}</span></li>
                       		},this) 	 
                       	}
                  	</ul>
				</div>
				
				</div>
				<div id="stateActionDiv" className="row no-margin"></div>
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
              		<label >
  						<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD ACTION' onClick={this.addGetStateCommonPopup.bind(this)}/>
  					</label>
  				</div>
			</div>
		)
	}
});
var GetRecordNavPopup=React.createClass({
    componentDidMount:function(ev){
        var schemaData=this.props.schemaData;
        if(schemaData.hasOwnProperty("@recordNav")){
            Object.keys(schemaData["@recordNav"]).map(function(key,index){
                var temp={};
                temp.navName=key;
                temp.displayName=schemaData["@recordNav"][key].displayName;
                var div = document.createElement("div");
                $(div).attr("class","col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left recordNavDiv");
                $("#recordNavContainer").append(div);
                ReactDOM.render(<RecordNavComponent data={temp} index={index} />,div);
            });
            
        }else{
             addRecordNav();
        }
      
    },
    render:function(){
      return(<div>
                <div id="recordNavContainer"></div>
                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
                    <label >
                        <input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={addRecordNav.bind(this)}/>
                    </label>
                </div>
            </div>) 
    }
});

/*var GetStateNamesPopup = React.createClass({
    componentDidMount:function(){
        var schemaData=this.props.schemaData;
        var self = this;
        if(this.props.edit){
            Object.keys(this.props.schemaData).map(function(key,index){
            	if(self.props.editStateName.stateName == key){
            		var temp={};
	                temp.navName=key;
	                temp.displayName=schemaData[key].displayName;
	                var div = document.createElement("div");
	                $(div).attr("class","col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left stateNamesDiv");
	                $("#stateNamesContainer").append(div);
	                ReactDOM.render(<StateNamesComponent data={temp} index={0} />,div);
            	}
               
            });
            
        }else{
             addStateNames();
        }
    },
    render:function(){
      return(<div>
                <div id="stateNamesContainer"></div>
                <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
                    <label >
                        <input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={addStateNames.bind(this)}/>
                    </label>
               </div>
            </div>) 
    }
});*/

function addRecordNav(){
    var status=true;
    if($("#recordNavContainer .recordNavDiv").length!=0){
        var len=$("#recordNavContainer .recordNavDiv").length;
        if(($("#recordNavContainer").find(".recordNavDiv").eq(len-1).find(".recordNavName").val().trim()=="") || ($("#recordNavContainer").find(".recordNavDiv").eq(len-1).find(".recordDisplayName").val().trim()=="")){
            status=false;
        }
    }
    if(status==true){
        var div = document.createElement("div");
        $(div).attr("class","col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left recordNavDiv");
        $("#recordNavContainer").append(div);
        ReactDOM.render(<RecordNavComponent />,div);
    }else{
        alert("please fill data");
    }
}

function addStateNames(){
    var status=true;
    if($("#stateNamesContainer .stateNamesDiv").length!=0){
        var len=$("#stateNamesContainer .stateNamesDiv").length;
        if(($("#stateNamesContainer").find(".stateNamesDiv").eq(len-1).find(".stateName").val().trim()=="") || ($("#stateNamesContainer").find(".stateNamesDiv").eq(len-1).find(".stateNameDisplayName").val().trim()=="")){
            status=false;
        }
    }
    if(status==true){
        var div = document.createElement("div");
        $(div).attr("class","col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left stateNamesDiv");
        $("#stateNamesContainer").append(div);
        ReactDOM.render(<StateNamesComponent />,div);
    }else{
        alert("please fill data");
    }
}

var RecordNavComponent=React.createClass({
    componentDidMount:function(ev){
      if(this.props.data){
          var data=this.props.data;
          var index=this.props.index;
          $("#recordNavContainer").find(".recordNavDiv").eq(index).find(".recordNavName").val(data.navName);
          $("#recordNavContainer").find(".recordNavDiv").eq(index).find(".recordDisplayName").val(data.displayName);
          $(".recordNavName").attr("readonly","readonly");
      }  
    },
    render:function(){
       return(<div>
                <div className="row no-margin">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase recordNavNameSpan">NAV NAME</span>
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                         <input type='text'  className="form-control form-group recordNavName" placeholder="please enter nav name" />
                    </div>
                </div>
                <div className="row no-margin">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase recordDisplayNameSpan">DISPLAY NAME</span>
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                         <input type='text' className="form-control form-group recordDisplayName" placeholder="please enter display name" />
                    </div>
                </div>
            </div>) 
    }
});

var StateNamesComponent=React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount : function(ev){
        ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
      if(this.props.data){
          var data=this.props.data;
          //var index=this.props.index;
          $("#genericDilog .stateName").val(data.stateName);
          $("#genericDilog .stateNameDisplayName").val(data.displayName);
          $(".stateName").attr("readonly","readonly");
      }  
    },
    render:function(){
    	var self=this;
       return(<div>
               <div className="row remove-margin-left remove-margin-right margin-bottom-gap">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase stateNameSpan">state NAME</span>
                          {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["AddStateStateName"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["AddStateStateName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                         <input type='text'  className="form-control form-group stateName" placeholder="please enter state name" />
                    </div>
                </div>
                <div className="row remove-margin-left remove-margin-right margin-bottom-gap">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase stateNameSpanDisplayNameSpan">DISPLAY NAME</span>
                          {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["AddStateDisplayName"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["AddStateDisplayName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                         <input type='text' className="form-control form-group stateNameDisplayName" placeholder="please enter state display name" />
                    </div>
                </div>
            </div>) 
    }
});


var GetShowRelatedPopup=React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount : function(){
        ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
        if(this.props.edit){
            var relationName = this.props.relationName;
            var schemaData=this.props.schemaData;
            var relationData = schemaData["@showRelated"][relationName];
            Object.keys(relationData).map(function(key){
               showRelationTypeData(key,schemaData,relationData);
            });
        }
    },
    selectRelationType:function(option,ev){
        $(ev.target).parents("ul").parent().find("button span").text(option);
        var schemaData=this.props.schemaData;
        showRelationTypeData(option,schemaData);
     },
    render:function(){
    	var self =this;
        var schemaData=this.props.schemaData;
        return(<div>
                <div id="showRelatedNameDiv" className="row remove-margin-left margin-bottom-gap remove-margin-right">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase navViewNameSpan">RELATION NAME</span>
                         {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["showRelatedRelationName"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["showRelatedRelationName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                         <input type='text' id="showRelationName" className="form-control form-group" placeholder="please enter Relation name" />
                    </div>
                </div>
                <div  className="row remove-margin-left margin-bottom-gap remove-margin-right">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase">type</span>
                          {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["showRelatedType"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["showRelatedType"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding">
                        <button type="button" className="btn btn-default dropdown-toggle form-control" ref="showRelatedButton" data-toggle="dropdown">
                            <span data-bind="label" id="relationType" ref="opType">Select Type</span>
                        </button>
                        <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
                            <li><span onClick={this.selectRelationType.bind(this,"search")}>Search</span></li>
                            <li><span onClick={this.selectRelationType.bind(this,"viewQuery")}>View Query</span></li>
                        </ul>   
                    </div>
                </div>
                <div  className="row no-margin" id="relationTypeDiv">
                </div>
                </div>)
    }
});
function showRelationTypeData(option,schemaData,selectedData){
    var typeData=[];
    var keysList=[];
    var edit;
    if(selectedData!=undefined){
        edit="edit";
    }
    if(option=="search"){
        keysList=["@properties","@sysProperties"];
        keysList.map(function(keyName){
            Object.keys(schemaData[keyName]).map(function(dataJson){
                typeData.push(dataJson);
            });
        });
        ReactDOM.render(<ShowRelationTypeComponent typeData={typeData} edit={edit} selectedData={selectedData}  type={option} />,document.getElementById("relationTypeDiv"));
    }else if(option=="viewQuery"){
        keysList=schemaData["@filterKeys"];
        keysList.map(function(keyName){
            typeData.push(keyName);
        });
        ReactDOM.render(<FiltersComponent filtersData={typeData} propertyKey={"showRelated"} edit={edit} schemaData={schemaData} selectedData={selectedData}/>,document.getElementById("relationTypeDiv"));
    }
}
var ShowRelationTypeComponent=React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount:function(){
    	 ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
        if(this.props.edit){
            var selectData=this.props.selectedData;
            $("#showRelationName").val(selectData.search.displayName);
            $("#relationType").text("search");
            $("#conditionType").text(selectData.search.condition);
            selectData.search.keyWords.map(function(subKey){
                 $("#searchRelationTypeDiv").find("input:checkbox[class='"+subKey+"']").prop("checked",true);
            });
        }
        /*if(schemaJSON["@type"] == "Object"){
			$("#pageStatus").text("5 OF 7          (Configure Show Related)");
		}*/
    },
    selectRelationCondition:function(option,ev){
        $(ev.target).parents("ul").parent().find("button span").text(option);
    },
    render:function(){
    	var self=this;
        var typeData=this.props.typeData;
         return(<div  className="row remove-margin-left margin-bottom-gap remove-margin-right">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase" id="relationTypeTile">Key Words</span>
                          {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["showRelatedKeyWords"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["showRelatedKeyWords"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div id="searchRelationTypeDiv" className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                    {
                    typeData.map(function(data){
                        return(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left">
                                   <input  ref={data} type="checkbox" className = {data} name={data} />&nbsp;
                                   <span className="fieldText no-padding-left">{data}</span>
                            </div>)
                    })
                    }
                     </div>
                     <div  className="row remove-margin-left margin-bottom-gap remove-margin-right">
                        <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                             <span className="text-uppercase">condition</span>
                              {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["showRelatedCondition"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["showRelatedCondition"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                             
                        </div>
                        <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
                            <button type="button" className="btn btn-default dropdown-toggle form-control" ref="conditionButton" data-toggle="dropdown">
                                <span data-bind="label" id="conditionType" ref="opType">Select Condition</span>
                            </button>
                           <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
	                            <li><span onClick={this.selectRelationCondition.bind(this,"matchAll")}>matchAll</span></li>
	                            <li><span onClick={this.selectRelationCondition.bind(this,"matchAny")}>matchAny</span></li>
                            </ul>
                        </div>
                     </div>
                </div>)
    }
});
var GetInitialStatePopup=React.createClass({
    fillIntialState:function(data,ev){
        var id=this.props.id;
        $(id).val(data);
        schemaJSON["@initialState"]=data;
        $('#genericDilog,.modal-backdrop').remove();
    },
    render:function(){
        var statesData=this.props.statesData;
        var fillIntialState=this.fillIntialState;
        return (
                    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                    {
                        Object.keys(statesData).map(function(data){
                            return (
                                     <div className="row no-margin ">
                                         <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={fillIntialState.bind(this,data)} >
                                            <span className="fieldText link">{data}</span>
                                        </div>
                                    </div>
                                 )
                        })
                    }
                 </div>
                )
    }
});
var GetNavViewPopup=React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount : function(){
        ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
        var schemaData=this.props.schemaData;
        var filtersData;
        var showHideenFilterKeys=this.showHideenFilterKeys;
        if(schemaData.hasOwnProperty("@filterKeys")){
            filtersData=schemaData["@filterKeys"];
        }
        if(filtersData.length!=0){
            ReactDOM.render(<FiltersComponent filtersData={filtersData} schemaData={schemaData} edit={this.props.edit} navName={this.props.navName}/>,document.getElementById("navViewFiltersDiv"));
        }
    },
    render:function(){
    	var self=this;
         return(<div>
                <div id="navViewNameDiv" className="row remove-margin-left margin-bottom-gap remove-margin-right">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase navViewNameSpan">NAV NAME</span>
                          {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["NavViewNavName"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["NavViewNavName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                         <input type='text' id="navViewName" className="form-control form-group" placeholder="please enter NavView name" />
                    </div>
                </div>
                <div id="navViewFiltersDiv" className="row no-margin">
                </div>
                </div>)
    }
});

var FiltersComponent =React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
    componentDidMount : function(){
        ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
        if(this.props.edit){
            var schemaData=this.props.schemaData;
            var navViewData = {};
            var selectedData=this.props.selectedData;
            if(this.props.propertyKey){
                $("#showRelationName").val(selectedData.viewQuery.displayName);
                $("#relationType").text("View Query");
                navViewData= selectedData.viewQuery;
            }else{
                if(this.props.defineLayoutFiltersData){
                    navViewData= this.props.defineLayoutFiltersData;
                }else{
                    var navName = this.props.navName;
                    schemaData["@navViews"].map(function(dataJson){
                        if(dataJson.navName==navName){
                           navViewData= dataJson;
                        }
                    });
                    $("#navViewName").val(navName);
                }
            }
            Object.keys(navViewData["filters"]).map(function(key){
            // $("#filtersDiv").find("input:checkbox[class='"+key+"']").prop("checked",true);
                if(navViewData["filters"][key].length!=0){
                    $("#filtersDiv").find("input:checkbox[class='"+key+"']").click();
                    navViewData["filters"][key].map(function(subKey){
                        var divId=key+"Div";
                         $("#filtersDiv").find("div[id='"+divId+"']").find("input:checkbox[class='"+subKey+"']").prop("checked",true);
                    });
                }else{
                    $("#filtersDiv").find("input:checkbox[class='"+key+"']").prop("checked",true);
                }

            });
        }
    },
    showHideenFilterKeys:function(target,ev){
        var schemaData=this.props.schemaData;
         if(ev.target.checked==true){
             if(target=="$status"){
                  if(schemaData.hasOwnProperty("@state")){
                     var stateData=schemaData["@state"];
                     ReactDOM.render(<GetNavViewSubPopup data={stateData} title={"@state"}/>,document.getElementById(target+"Div"));
                  }
             }else{
                 if(schemaData["@properties"].hasOwnProperty(target)){
                     if(schemaData["@properties"][target].dataType.type=="pickList" || schemaData["@properties"][target].dataType.type=="multiPickList"){
                         var data=schemaData["@properties"][target].dataType.options;
                         ReactDOM.render(<GetNavViewSubPopup data={data} title={target}/>,document.getElementById(target+"Div"));
                     }
                 }
             }
           
        }else{
            ReactDOM.unmountComponentAtNode(document.getElementById(target+"Div"));
        }
    },
    render:function(){
    	var self=this;
        var filtersData=this.props.filtersData;
        var showHideenFilterKeys=this.showHideenFilterKeys;
        return(<div id="filtersDiv" className="row remove-margin-left margin-bottom-gap remove-margin-right">
                    <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                         <span className="text-uppercase" id="relationTypeTile">FILTERS</span>
                          {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["NavViewFilter"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["NavViewFilter"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
                    </div>
                    <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                    {
                        filtersData.map(function(data){
                            return(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left filtersRow" title={data}>
                                       <div className="filtersRowMain">
                                           <input  ref={data} type="checkbox" className = {data} name={data} onClick={showHideenFilterKeys.bind(this,data)}/>&nbsp;
                                           <span className="fieldText no-padding-left">{data}</span>
                                       </div>
                                       <div id={data+"Div"} className="filtersRowSub"></div>
                                    </div>)
                            })
                    }
                    </div>
                </div>)
    }
});
exports.FiltersComponent=FiltersComponent;
var GetNavViewSubPopup=React.createClass({
    render:function(){
        var data=this.props.data;
        var title=this.props.title;
        return(<div>
            {
                Object.keys(data).map(function(key){
                    var tempKey="";
                    if($.type(data)=="array"){
                        tempKey=data[key];
                    }else if($.type(data)=="object"){
                        tempKey=key;
                    }
                    return(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12" title={title}>
                               <input  ref={tempKey} type="checkbox" className = {tempKey} name={tempKey}/>&nbsp;
                               <span className="fieldText no-padding-left">{tempKey}</span>
                        </div>)
                })
            }
             </div>)
    }
});
function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
} 

function camelize2(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toUpperCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
} 
/**
* object createion
**/

var DisplayObject = React.createClass({
	componentDidMount:function(){
			if(this.props.fullSchemaData && this.props.refSchema != "referenceSchema"){//for edit schema filling
				if(this.props.fullSchemaData.hasOwnProperty("@relations")){
					var relations = this.props.fullSchemaData["@relations"];
					Object.keys(relations).map(function(sysFunction){
						var sysFun= $("#systemFunctionsDiv").find("div.row").find("input:checkbox");
						for(var i = 0;i<sysFun.length;i++){
							if(sysFun.eq(i).attr("class") == sysFunction){
								sysFun[i].checked=true;
								$("#"+sysFunction+"DetailsDiv").css("display","block");
								$("#"+sysFunction+"DetailsDiv").find("input:text").eq(0).val(relations[sysFunction].action.displayName);
								$("#"+sysFunction+"DetailsDiv").find("input:text").eq(1).val(relations[sysFunction].showRelated.displayName);
								break;
							}else{
								console.log(2);
							}
						}
					})
				}
				if(this.props.fullSchemaData.hasOwnProperty("@operations")){
					var operations = this.props.fullSchemaData["@operations"];
					Object.keys(operations).map(function(operation){
						if(operation == "delete"){
							if(Object.keys(operations[operation]).length>0){//ss
								var displayName = operations[operation]["delete"].displayName;
								var div = document.createElement("div");
						    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 opertionRow");
						    	$("#operationsRow #"+operation).append(div);
						    	ReactDOM.render(<AddOperationToUI  opData={operations[operation]} target={div} dispName={displayName} editOpName={operation}/>,div);
						    }
						}else{
							for(var i = 0;i<Object.keys(operations[operation]).length;i++){
								var div = document.createElement("div");
						    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 opertionRow");
						    	$("#operationsRow #"+operation).append(div);
						    	ReactDOM.render(<AddOperationToUI  opData={operations[operation]} target={div} dispName={Object.keys(operations[operation])[i]} editOpName={operation}/>,div);
							}							
						}
					})
				}
			}
			
    	
			if(schemaJSON.hasOwnProperty("@identifier")){
				$(this.getDOMNode()).find("input:radio.identifier#"+schemaJSON["@identifier"]).attr("checked","checked");
			}
			if(schemaJSON.hasOwnProperty("@dependentKey")){
				$(this.getDOMNode()).find("input:radio.dependentKey#"+schemaJSON["@dependentKey"]).attr("checked","checked");
			}
			data=this.props.schemaUniqueObject;
			structName = this.props.structName;
			var fullSchemaData = this.props.fullSchemaData;
			Object.keys(data).map(function(key){
			  if($.type(data[key]) == "object"){
			    for(var i = 0;i < $("#schemaObjRow").find("div.row").length;i++){
			    if($("#schemaObjRow").find("div.row").eq(i).find("input:checkbox")[0]){
			    	if($("#schemaObjRow").find("div.row").eq(i).find("input:checkbox")[0].name == key){
			    		if(data[key].dataType.type == "pickList"){
							$("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(1).removeAttr("disabled");
						}
				         $("#schemaObjRow").find("div.row").eq(i).find("input:checkbox").eq(0).attr("checked","checked");//.attr("disabled","disabled");
				         if(structName){
				         	$("#schemaObjRow").find("div.row").eq(i).find("input:checkbox").eq(0).hide();
				         	 $("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(0).hide();
				         	  $("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(1).hide();
				         }
				         if(data[key].dataType.type == "formula" || data[key].dataType.type == "struct" || data[key].dataType.type == "array"){
				         	$("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(0).hide();
				         	 $("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(1).hide();
				         }
				         //break;
				       if(schemaJSON["@type"] == "abstractObject"){
							$("#dependentFieldHeader").show();
							 $("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(1).show();
						}else  if($("#schemaType").text().toLowerCase() == "derived object"){
							$("#schemaObjRow").find("div.row").eq(i).find("input:radio").hide();
							 $("#dependentFieldHeader,#identifierFieldHeader").hide();
						}else{
							 $("#schemaObjRow").find("div.row").eq(i).find("input:radio").eq(1).hide();
							 $("#dependentFieldHeader").hide();
						}
				      }
			    	}
			    }
			    
			   }
			})
			if(fullSchemaData){
				if(fullSchemaData.hasOwnProperty('@identifier') && !this.props.structName){
					$("#schemaObjRow").find("input:radio.identifier"+fullSchemaData["@identifier"]).attr("checked","checked").removeAttr("disabled");
				}
				if(fullSchemaData.hasOwnProperty('@dependentKey') && !this.props.structName){
					$("#schemaObjRow").find("input:radio.dependentKey"+fullSchemaData["@dependentKey"]).attr("checked","checked").removeAttr("disabled");
					$("#schemaObjRow").find("input:radio.dependentKey"+fullSchemaData["@dependentKey"]).parents("div.row").eq(0).find("span.type");
					
					var span = $("#schemaObjRow").find("input:radio.dependentKey"+fullSchemaData["@dependentKey"]).parents("div.row").eq(0).find("span.type");//pradeep
					var dependentKey = fullSchemaData["@dependentKey"];
					Object.keys(fullSchemaData["@properties"]).map(function(prop){
						if(prop == dependentKey){
							$("#dynamicContentDiv").data("dependentFieldOptions",fullSchemaData["@properties"][prop].dataType.options);
						}
					})
				}
			}
	},
	expandObjStruct : function(data,name,structName,ev){ /*used to expand object and struct*/
		if($(ev.target).text() == "struct"){
			WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":data.dataType.structRef},function(result){
				if(result.data.error){
					alert(result.data.error +"\n select again");
				}
				schemaUniqueObject = result.data;
				if(result.data){
					//finalObject = mergeRecursive(finalObject,schemaUniqueObject["@properties"]);
					ReactDOM.render(<DisplayObject  fullSchemaData={schemaUniqueObject} schemaUniqueObject = {schemaUniqueObject["@properties"]} name={name} structName={name}/>,$("div#"+name)[0]);
				}
			});
		}
	},
	editProperty:function(objData,propName,ev){
		//$('#genericDilog,.modal-backdrop').remove();
		if(!this.props.structName){
			var title ="Edit " +objData.dataType.type + " Field";
			getPopupContent(title,"","ok",$(ev.target).parents("div.schemaRow:last")[0],"saveSingleProperty");
			ReactDOM.render(<AddFieldPopup dataTypes={dataTypes} ok={"ok"} objData={objData} propName={propName} />,document.getElementById('genericPopupBody'));
		}
	},
	render : function(){
		var headers = "";
		masterSchema = this.props.schemaUniqueObject;
		if(this.props.header){
			if(Object.keys(masterSchema).length > 0){
				headers = <div className="row remove-margin-left remove-margin-right ">
						
			         	   <div className="col-lg-4 col-md-4 col-xs-4 col-sm-4 no-padding-left" id="propertiesFieldHeader">
			         	   		<label >PROPERTIES IN USE</label>
			         	   </div>
			         	   <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-left" id="typeFieldHeader">
			         	   		<label >TYPE</label>
			     	   		</div>
			         	   <div className="col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding-left" id="identifierFieldHeader" >
			         	  		<label >IDENTIFIER</label>
			         	   </div>
			         	   <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-left" id="dependentFieldHeader">
			         	  		<label >DEPENDENT FIELD</label>
			         	   </div>
		         	   </div>
	         	 }
		} 
		
		var name = this.props.name;
		var structName = this.props.structName;
		expandObjStruct = this.expandObjStruct;
		handleCheckBox = this.handleCheckBox;
		editProperty = this.editProperty;
		return (
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
				{headers}
				{
					Object.keys(masterSchema).map(function(data){	
							if(masterSchema[data].dataType){
								if(masterSchema[data].dataType.type == "struct"){
									return (<div className="row no-margin schemaRow">
						            	   <div className="col-lg-4 col-md-4 col-xs-4 col-sm-4 no-padding-left " title={masterSchema[data].description}>
						            	   		<input  ref={data} type="checkbox" className = {name} name={data} />&nbsp;
						            	   		<span className="fieldText no-padding-left ">{data}</span>
						            	   </div>
						            	   <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-left" >
						            	   		<span className={"fieldText no-padding-left link link-btn "+masterSchema[data].dataType.type} onClick={this.expandObjStruct.bind(this,masterSchema[data],data,structName)}>{masterSchema[data].dataType.type}</span>
					            	   		</div>
						            	   <div className="col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding-left" >
						            	   		<input  type="radio" id={data} className={"identifier identifier"+data}  name="uniqueForDialogBox"/>
						            	   </div>
						            	   <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-left dependentKeyDiv" >
						            	   		<input  type="radio" id={data} className={"dependentKey dependentKey"+data}  name="dependentKeyRadio" disabled/>
						            	   </div>
						            	   <div className="row no-margin" id={data}></div>
					            	</div>)
								}else{
									var spanClass;
									if(!structName){
										spanClass = "fieldText no-padding-left link link-btn";
									}else{
										spanClass = "fieldText no-padding-left";
									}
									return (<div className="row no-margin schemaRow">
						            	   <div className="col-lg-4 col-md-4 col-xs-4 col-sm-4 no-padding-left " title={masterSchema[data].description}>
						            	   		<input  ref={data} type="checkbox" className = {name} name={data}/>&nbsp;
						            	   		<span className="fieldText no-padding-left">{data}</span>
						            	   </div>
						            	   <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-left" >
						            	   		<span className={spanClass +" type"} onClick={this.editProperty.bind(this,masterSchema[data],data)}>{masterSchema[data].dataType.type}</span>
					            	   		</div>
						            	   <div className="col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding-left" >
						            	   		<input  type="radio" id={data} className={"identifier identifier"+data}  name="uniqueForDialogBox"/>
						            	   </div>
						            	   <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-left dependentKeyDiv" >
						            	   		<input  type="radio" id={data} className={"dependentKey dependentKey"+data}  name="dependentKeyRadio" disabled/>
						            	   </div>
						            	   <div className="row no-margin" id={data}></div>
					            	</div>
					            	)
								}
							}
						})
					}
	        </div>
		)
	}
})

/**
 *used to open a popup for operations and add operations to the schema 
 */
var AddOperationsPopup = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	componentDidMount : function(){
		ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
		$("#buttonDiv,#deletePropsDiv").css("display","none");
		$("#inprops,.relName").attr("readonly","readonly");
		if(this.props.edit){
			$("#opNameDiv,#propsDiv,#relationDiv,#actionNameDiv,#propsDiv,#opNameDiv,#viewTypeDiv,#galleryColumnDiv").css("display","none");
			if(this.props.opData){
				if(this.props.opData.viewType != "summaryView"){
					$("#opName").val($(this.props.target).find("span").eq(0).text()).attr("readonly","readonly");//$(this.props.target).find("span").eq(0).text()
				}
			}
			
			$("#opType").text(this.props.opType);
			var opName = $(this.props.target).find("span").eq(0).text();
			if(this.props.opType == "create"){
				$("#genericDilog #propsDiv,#opNameDiv").css("display","block");
				$("#inprops").val(this.props.opData.in);
			}else if(this.props.opType == "update"){
				$("#genericDilog #propsDiv,#opNameDiv").css("display","block");
		    	$("#inprops").val(this.props.opData.update);
			}else if(this.props.opType == "actions"){
				$("#actionNameDiv").css("display","block");
				$(".actionName").val(this.props.editPropName);
				$("#operationsDiv #actionTrigger").val(this.props.opData.trigger);
				$("#operationsDiv #actionDisplayName").val(this.props.opData.displayName);
			}else if(this.props.opType == "relations"){
				$("#relationDiv").css("display","block");
				$(".relMethodName").val(this.props.editPropName);
				$(".relName").val(this.props.opData["relation"]);
			}else if(this.props.opType == "read"){
				$("#viewType").text(this.props.opData.viewType);
				if(this.props.opData.viewType == "summaryView"){
					$("#galleryColumnDiv,#viewTypeDiv").css("display","block")
					$("#propsDiv span.propsSpan").text("OUT PROPERTIES");
					$("#uiLayoutPropsDiv").html("");
					var div = document.createElement("div");
			    	$(div).attr("class","row no-margin opertionRow readRow ");
			    	$("#uiLayoutPropsDiv").append(div);
			    	var layouts = ["generic","gallery","card"];
			    	ReactDOM.render(<ReadComponentCreation name = {name} type = {type} layouts={layouts} edit={true} propertyData={this.props.opData} index={"summary"} layoutType={this.props.opData.UILayout.type}/>,div);
				}else{
					$("#genericDilog #opNameDiv,#propsDiv,#buttonDiv,#viewTypeDiv").css("display","block");
				 	$("#propsDiv span.propsSpan").text("OUT PROPERTIES");
				 	$("#inprops").val(this.props.opData.out);
				 	for(var k=0;k<this.props.opData.UILayout.length;k++){
						var div = document.createElement("div");
				    	$(div).attr("class","row no-margin opertionRow readRow ");
				    	$("#uiLayoutPropsDiv").append(div);
				    	var layouts = ["generic","columns","banner","tabs"];
				    	ReactDOM.render(<ReadComponentCreation name = {name} type = {type} layouts={layouts} edit={true} propertyData={this.props.opData} index={k} layoutType={this.props.opData.UILayout[k].type}/>,div);
			    	}
				}
			}else if(this.props.opType == "delete"){
				$("#deletePropsDiv").css("display","block");
				$("#deleteTrigger").val(this.props.deleteData.delete.trigger);
				$("#deleteDisplayName").val(this.props.deleteData.delete.displayName);
				$("#undeleteTrigger").val(this.props.deleteData.unDelete.trigger);
				$("#undeleteDisplayName").val(this.props.deleteData.unDelete.displayName);
				$("#harddeleteTrigger").val(this.props.deleteData.HardDelete.trigger);
				$("#harddeleteDisplayName").val(this.props.deleteData.HardDelete.displayName);
			}
		}else{
			$("#opNameDiv,#propsDiv,#relationDiv,#actionNameDiv,#propsDiv,#opNameDiv").css("display","none");
		}
	},
	selectOperation:function(op,ev){
		$("#opType").text(op);
		$("#genericDilog #actionNameDiv,#relationDiv,#propsDiv,#opNameDiv,#buttonDiv,#uiLayoutPropsDiv,#viewTypeDiv,#galleryColumnDiv,#deletePropsDiv").css("display","none");
		if(op == "create"){
			$("#genericDilog #propsDiv,#opNameDiv").css("display","block");
			 $("#propsDiv span.propsSpan").text("IN PROPERTIES");
		}else if(op == "update"){
			$("#genericDilog #propsDiv,#opNameDiv").css("display","block");
	    	 $("#propsDiv span.propsSpan").text("UPDATE PROPERTIES");
		}else if(op == "actions"){
			//$("#genericDilog #propsDiv,#opNameDiv").css("display","none");
			$("#genericDilog #actionNameDiv").css("display","inline");
		}else if(op == "relations"){
			$("#genericDilog #relationDiv").css("display","inline");
		}else if(op == "read"){
			$("#genericDilog #opNameDiv,#propsDiv,#buttonDiv,#uiLayoutPropsDiv,#viewTypeDiv").css("display","block");
			$("#viewType").text($("#viewType").parents("div").eq(0).find("ul li:eq(0)").text());
			$("#propsDiv span.propsSpan").text("OUT PROPERTIES");
			$("#uiLayoutPropsDiv").html("");
			var div = document.createElement("div");
	    	$(div).attr("class","row no-margin opertionRow readRow ");
	    	$("#uiLayoutPropsDiv").append(div);
	    	var layouts = ["generic","columns","banner","tabs","gallery","card"];
	    	ReactDOM.render(<ReadComponentCreation name = {name} type = {type} layouts={layouts}/>,div);
		}else if(op == "delete"){
			//var div = document.createElement("div");
	    	//$(div).attr("class","row no-margin opertionRow readRow ");
	    	//$("#uiLayoutPropsDiv").append(div);
			//ReactDOM.render(<DeleteComponentCreation name = {name} type = {type} />,div);
			$("#deletePropsDiv").css("display","block");
		}
	},
	getMultiDialogBox : function(reltype,ev){
		if(!reltype){
			if($("#opType").text() == "read" && $("#viewType").parents("div").eq(0).find("ul li:eq(0)").text() == $("#viewType").text()){
				alert("please select view type");
				return;
			}
			getPopupContent2("Select Properties","","button",ev.target,"fillMultidialogBoxData");
			ReactDOM.render(<GetMultiplePropertiesPopup  id={ev.target}  ok={"ok"} multicheck={true}/>,document.getElementById('genericPopupBody2'));
		}else{
			getPopupContent2("Select Properties","","",ev.target,"");
			ReactDOM.render(<GetMultiplePropertiesPopup  id={ev.target}  reltype={reltype}/>,document.getElementById('genericPopupBody2'));
		}
	},
	addUILayoutProps : function(){
		var div = document.createElement("div");
    	$(div).attr("class","row no-margin opertionRow readRow ");
    	$("#uiLayoutPropsDiv").append(div);
    	var layouts;
    	if($("#viewType").text() == "summaryView"){
    		layouts = ["generic","gallery","card"];
    	}else if($("#viewType").text() == "detailView"){
    		layouts = ["generic","columns","banner","tabs"];
    	}
    	
    	ReactDOM.render(<ReadComponentCreation name = {name} type = {type} layouts={layouts}/>,div);
	},
	selectView : function(op,ev){
		if(op == "summaryView"){
			if(schemaJSON["@operations"]){
				if(schemaJSON["@operations"].read){
					if(schemaJSON["@operations"].read.getSummary){
						var status = confirm("Do you want to override the existing get summary view");
						if(status){
							var spanLen = $("#read").find("span");
							for(var i = 0;i < spanLen.length;i++){
								if(spanLen.eq(i).text() == "getSummary"){
									$("#viewType").data("target",$("#read").find("span").eq(0).parent().parent()[0]);
								}
							}
						}else{
							return;
						}
					}
				}
			}
		}
		
		$("#viewType").text(op);
		if(op == "summaryView"){
			$("#genericDilog #actionNameDiv,#relationDiv,#propsDiv,#opNameDiv,#buttonDiv,#uiLayoutPropsDiv").css("display","none");
			$("#uiLayoutPropsDiv").css("display","block");
			$("#uiLayoutPropsDiv").html("");
			var div = document.createElement("div");
	    	$(div).attr("class","row no-margin opertionRow readRow ");
	    	$("#uiLayoutPropsDiv").append(div);
	    	var layouts = ["generic","gallery","card"];
	    	ReactDOM.render(<ReadComponentCreation name = {name} type = {type} layouts={layouts}/>,div);
		}else{
			$("#genericDilog #opNameDiv,#propsDiv,#buttonDiv,#uiLayoutPropsDiv,#viewTypeDiv").css("display","block");
			$("#propsDiv span.propsSpan").text("OUT PROPERTIES");
			$("#uiLayoutPropsDiv").html("");
			var div = document.createElement("div");
	    	$(div).attr("class","row no-margin opertionRow readRow ");
	    	$("#uiLayoutPropsDiv").append(div);
	    	var layouts = ["generic","columns","banner","tabs"];
	    	ReactDOM.render(<ReadComponentCreation name = {name} type = {type} layouts={layouts}/>,div);
		}
	},
	render : function(){
		var self=this;
		var operations = this.props.operations;
		var targetEle = this.props.targetEle;
		var viewTypes =["summaryView","detailView"]
			return (<div id="operationsDiv">
						<div className="row margin-bottom-gap remove-margin-left remove-margin-right opertionRow" >
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>OPERATION TYPE</span>
									 {
										["a"].map(function(temp){
											var classNames="hidden helpText";
											var textValue="";
											if(self.state.helpText && self.state.helpText["AddOperationType"]!=""){
												classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
												textValue=self.state.helpText["AddOperationType"];
											}
											return(<div className={classNames}>{textValue}</div>)
											
										})
									}
								</div>
								<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
					                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
				                     	<span data-bind="label" id="opType" ref="opType">Select Operation</span>
				                    </button>
				                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
			                           	<li><span >Select Operation</span></li>
			                           	{ 
			                           		operations.map(function(op){
			                           			return <li><span onClick={this.selectOperation.bind(this,op)}>{op}</span></li>
			                           		},this) 	 
			                           	}
		                          	</ul>
								</div>
							</div>
							
							<div id="viewTypeDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span className="text-uppercase opNameSpan">view type</span>
									 {
										["a"].map(function(temp){
											var classNames="hidden helpText";
											var textValue="";
											if(self.state.helpText && self.state.helpText["AddOperationViewType"]!=""){
												classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
												textValue=self.state.helpText["AddOperationViewType"];
											}
											return(<div className={classNames}>{textValue}</div>)
											
										})
									}
								</div>
								<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
 									<button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
				                     	<span data-bind="label" id="viewType" ref="opType">Select View</span>
				                    </button>
				                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
			                           	<li><span >Select View</span></li>
			                           	{ 
			                           		viewTypes.map(function(op){
			                           			return <li><span onClick={this.selectView.bind(this,op)}>{op}</span></li>
			                           		},this) 	 
			                           	}
		                          	</ul>								
		                        </div>
							</div>
							
							<div id="opNameDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span className="text-uppercase opNameSpan">OPERATION NAME</span>
									  {
										["a"].map(function(temp){
											var classNames="hidden helpText";
											var textValue="";
											if(self.state.helpText && self.state.helpText["AddOperationName"]!=""){
												classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
												textValue=self.state.helpText["AddOperationName"];
											}
											return(<div className={classNames}>{textValue}</div>)
											
										})
									}
								</div>
								<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="opName" className="form-control form-group" placeholder="please enter Operation name"  onBlur={checkFirstchar.bind(this)}/>
								</div>
							</div>
							
							<div id="propsDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span className="text-uppercase propsSpan">in properties</span>
									 {
										["a"].map(function(temp){
											var classNames="hidden helpText";
											var textValue="";
											if(self.state.helpText && self.state.helpText["AddOperationInProperties"]!=""){
												classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
												textValue=self.state.helpText["AddOperationInProperties"];
											}
											return(<div className={classNames}>{textValue}</div>)
											
										})
									}
								</div>
								<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text'  id='inprops' className="form-control form-group in-props" placeholder="please select properties"   onClick={this.getMultiDialogBox.bind(this,'')}/>
								</div>
							</div>
							
							<div id="actionNameDiv" className="row  remove-margin-left remove-margin-right">
								<div className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">action NAME</span>
										  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddOperationActionName"]!=""){
													classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddOperationActionName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									</div>
									<div  className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										<input type='text' className="form-control form-group actionName" placeholder="please enter action name"  onBlur={checkFirstchar.bind(this)}/>
									</div>
								</div>
								<div className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">trigger</span>
										  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddOperationActionTrigger"]!=""){
													classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddOperationActionTrigger"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="actionTrigger" className="form-control form-group" placeholder="trigger"/>
									</div>
								</div>
								<div className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">display name</span>
										  {
												["a"].map(function(temp){
													var classNames="hidden helpText";
													var textValue="";
													if(self.state.helpText && self.state.helpText["AddOperationActionTriggerDisplayName"]!=""){
														classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
														textValue=self.state.helpText["AddOperationActionTriggerDisplayName"];
													}
													return(<div className={classNames}>{textValue}</div>)
													
												})
											}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="actionDisplayName" className="form-control form-group" placeholder="display name"/>
									</div>
								</div>
							</div>
							
							<div id="relationDiv" className="row  remove-margin-left remove-margin-right">
								<div  className="row  remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">relation method NAME</span>
										  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddOperationRelationMethodName"]!=""){
													classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddOperationRelationMethodName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									</div>
									<div  className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										<input type='text' className="form-control form-group relMethodName" placeholder="please enter action name"  onBlur={checkFirstchar.bind(this)}/>
									</div>
								</div>
								<div id="relationDiv" className="row  remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">relation  NAME</span>
										  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddOperationRelationName"]!=""){
													classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddOperationRelationName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									</div>
									<div  className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										<input type='text' className="form-control form-group relName" placeholder="please enter action name"  onClick={this.getMultiDialogBox.bind(this,'relation')}/>
									</div>
								</div>
							</div>
							
							<div id="uiLayoutPropsDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right"></div>
							
							<div id="galleryColumnDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span className="text-uppercase opNameSpan">column number</span>
									  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddOperationColumnLayout"]!=""){
													classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddOperationColumnLayout"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
								</div>
								<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="galleryColumnFld" className="form-control form-group" placeholder="please enter number"/>
								</div>
							</div>
							
							<div id="deletePropsDiv">
								 <label className="text-uppercase">delete</label>
								<div id="deletePropsTriggerDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">trigger</span>
										  {
												["a"].map(function(temp){
													var classNames="hidden helpText";
													var textValue="";
													if(self.state.helpText && self.state.helpText["AddOperationDeleteTrigger"]!=""){
														classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
														textValue=self.state.helpText["AddOperationDeleteTrigger"];
													}
													return(<div className={classNames}>{textValue}</div>)
													
												})
											}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="deleteTrigger" className="form-control form-group" placeholder="trigger"/>
									</div>
								</div>
								<div id="deletePropsDisplayNameDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">display name</span>
										  {
												["a"].map(function(temp){
													var classNames="hidden helpText";
													var textValue="";
													if(self.state.helpText && self.state.helpText["AddOperationDeleteDisplayName"]!=""){
														classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
														textValue=self.state.helpText["AddOperationDeleteDisplayName"];
													}
													return(<div className={classNames}>{textValue}</div>)
													
												})
											}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="deleteDisplayName" className="form-control form-group" placeholder="display name"/>
									</div>
								</div>
								
								 <label className="text-uppercase">un delete</label>
								<div id="undeletePropsTriggerDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">trigger</span>
										  {
												["a"].map(function(temp){
													var classNames="hidden helpText";
													var textValue="";
													if(self.state.helpText && self.state.helpText["AddOperationUndeleteTrigger"]!=""){
														classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
														textValue=self.state.helpText["AddOperationUndeleteTrigger"];
													}
													return(<div className={classNames}>{textValue}</div>)
													
												})
											}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="undeleteTrigger" className="form-control form-group" placeholder="trigger"/>
									</div>
								</div>
								<div id="undeletePropsDisplayNameDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">display name</span>
										  {
											["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["AddOperationUndeleteDisplayName"]!=""){
													classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
													textValue=self.state.helpText["AddOperationUndeleteDisplayName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
										}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="undeleteDisplayName" className="form-control form-group" placeholder="display name"/>
									</div>
								</div>
								
								 <label className="text-uppercase">hard delete</label>
								<div id="harddeletePropsTriggerDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">trigger</span>
										  {
												["a"].map(function(temp){
													var classNames="hidden helpText";
													var textValue="";
													if(self.state.helpText && self.state.helpText["AddOperationHardDeleteTrigger"]!=""){
														classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
														textValue=self.state.helpText["AddOperationHardDeleteTrigger"];
													}
													return(<div className={classNames}>{textValue}</div>)
													
												})
											}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="harddeleteTrigger" className="form-control form-group" placeholder="trigger"/>
									</div>
								</div>
								<div id="harddeletePropsDisplayNameDiv" className="row margin-bottom-gap remove-margin-left remove-margin-right">
									<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
										 <span className="text-uppercase">display name</span>
										  {
												["a"].map(function(temp){
													var classNames="hidden helpText";
													var textValue="";
													if(self.state.helpText && self.state.helpText["AddOperationHardDeleteDisplayName"]!=""){
														classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
														textValue=self.state.helpText["AddOperationHardDeleteDisplayName"];
													}
													return(<div className={classNames}>{textValue}</div>)
													
												})
											}
									</div>
									<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input type='text' id="harddeleteDisplayName" className="form-control form-group" placeholder="display name"/>
									</div>
								</div>
							</div>
			
			
							
							<div id="buttonDiv" className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
								<label >
									<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD UI LAYOUT' onClick={this.addUILayoutProps}/>
								</label>
							</div>
						</div>
			)
	}
})


var ReadComponentCreation = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	
	componentDidMount : function(){
		ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
		
		$(this.getDOMNode()).find("#tabsButtonDiv,#columnsButtonDiv").css("display","none");
		$(this.getDOMNode()).find(".propertiesFld").attr("readonly","readonly");
		if(this.props.edit){
			$("#operationsDiv #inprops").val(this.props.propertyData.out);
			var divIndex = this.props.index;
			if($("#viewType").text() == "summaryView" && (this.props.layoutType == "gallery" || this.props.layoutType == "card" || this.props.layoutType == "generic")){
				$("#uiLayoutPropsDiv .readRow").eq(0).find(".uilayout").text(this.props.propertyData.UILayout.type);
			}else{
				$("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".uilayout").text(this.props.propertyData.UILayout[divIndex].type);
			}
			var localData = {},filledData;
			var outData = $("#operationsDiv #inprops").val().trim().split(",");
			for(var i = 0;i < outData.length;i++){
				localData[outData[i]] =  finalObject[outData[i]];
			}
			filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},localData);//ss
			
			if(schemaJSON.hasOwnProperty("@operations")){
				if(schemaJSON["@operations"].hasOwnProperty("actions")){
					filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].actions)) : filledData,filledData);
				}
				if(schemaJSON["@operations"].hasOwnProperty("update")){
					filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].update)) : filledData,filledData);
				}
			}
			
			
			if(this.props.layoutType == "generic"){
				$("#galleryColumnDiv").css("display","none");
				if($("#viewType").text() == "summaryView"){
					filledData = mergeRecursive(filledData,finalObject);
				}
				ReactDOM.render(<AddLayoutPropertyComponent  id={$("#operationsDiv #uilayout:visible")[0]} filledData={filledData} edit={true} propertyData = {this.props.propertyData} divIndex={divIndex}/>,$(this.getDOMNode()).find('.uiLayoutDiv')[0]);
			}else if(this.props.layoutType == "columns"){
				$(this.getDOMNode()).find("#columnsButtonDiv").css("display","block"); 
				for(var i = 0;i < Object.keys(this.props.propertyData.UILayout[divIndex].layout).length;i++){
					count--;
					var div = document.createElement("div");
				    $(div).attr("id",("columns"+count));
				    $(div).attr("class","columnsLayoutDiv");
				 	$("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".uiLayoutDiv").append(div);
					ReactDOM.render(<AddColumnsLayoutComponent  id={$("#operationsDiv #uilayout:visible")[0]} filledData={filledData} edit={true} propertyData = {this.props.propertyData.UILayout[divIndex].layout[i]} divIndex={divIndex}/>,$("#columns"+count)[0]);
				}
			}else if(this.props.layoutType == "banner"){
				ReactDOM.render(<AddBannerLayoutComponent  id={$("#operationsDiv #uilayout:visible")[0]} filledData={filledData} edit={true} propertyData = {this.props.propertyData} divIndex={divIndex}/>,$("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".uiLayoutDiv")[0]);
			}else if(this.props.layoutType == "tabs"){
				$("#tabsButtonDiv").css("display","block");
				for(var i = 0;i < Object.keys(this.props.propertyData.UILayout[divIndex].layout).length;i++){
					count--;
					var div = document.createElement("div");
				    $(div).attr("id",("tabs"+count));
				    $(div).attr("class","tabsLayoutDiv");
				    $("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".uiLayoutDiv").append(div);
					ReactDOM.render(<AddTabsLayoutComponent  id={""} filledData={filledData} edit={true} propertyData = {this.props.propertyData.UILayout[divIndex].layout[Object.keys(this.props.propertyData.UILayout[divIndex].layout)[i]]} />,$("#tabs"+count)[0]);
				}
			}else if(this.props.layoutType == "gallery"){
				$("#galleryColumnDiv").css("display","block");
				$("#buttonDiv").css("display","none");
				$("#galleryColumnFld").val(this.props.propertyData.UILayout.columnNo);
				$("#viewType").text($("#viewTypeDiv").find('li').eq(1).text());
				var filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},finalObject);
				ReactDOM.render(<AddLayoutPropertyComponent  id={$("#operationsDiv #uilayout:visible")[0]} filledData={filledData} edit={true} propertyData = {this.props.propertyData} divIndex={divIndex}/>,$("#uiLayoutPropsDiv .readRow").eq(0).find(".uiLayoutDiv")[0]);
			}else if(this.props.layoutType == "card"){
				$("#galleryColumnDiv").css("display","none");
				$("#viewType").text($("#viewTypeDiv").find('li').eq(1).text());
				ReactDOM.render(<AddCardLayoutPropertyComponent  id={""}  edit={true} propertyData = {this.props.propertyData} />,$("#uiLayoutPropsDiv .readRow").eq(0).find(".uiLayoutDiv")[0]);
			}
			
		}
	},
	getMultiDialogBox : function(ev){
		getPopupContent2("Select Properties","","button",ev.target,"fillMultidialogBoxData");
		ReactDOM.render(<GetMultiplePropertiesPopup  id={ev.target} ok={"ok"} multicheck={true}/>,document.getElementById('genericPopupBody2'));
	},
	selectLayoutType : function(layout,ev){
		if($("#viewType").text() != "summaryView"){
			if($("#viewType").parents("div").eq(0).find("ul li:eq(0)").text() == $("#viewType").text()){
				alert("please select view type");
				return;
			}
			if($("#operationsDiv #inprops:visible").val().trim() == ""){
				alert("please select OUT Properties");
				return;
			}
		}else{
			if($("#viewType").parents("div").eq(0).find("ul li:eq(0)").text() == $("#viewType").text()){
				alert("please select view type");
				return;
			}
		}
		
		$(ev.target).parents("ul").eq(0).parent().find("span").eq(0).text(layout);
		var targetEle = $(ev.target).parents("ul").eq(0).parents("div.readRow").find("#uiLayoutDiv")[0];
		targetEle.innerHTML = "";
		var localData = {};
		var outData = $("#operationsDiv #inprops").val().trim().split(",");
			for(var i = 0;i < outData.length;i++){
				localData[outData[i]] =  finalObject[outData[i]];
			}
			
		var filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},localData);
		if(schemaJSON.hasOwnProperty("@operations")){
			if(schemaJSON["@operations"].hasOwnProperty("actions")){
				filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].actions)) : filledData,filledData);
			}
			if(schemaJSON["@operations"].hasOwnProperty("update")){
				filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].update)) : filledData,filledData);
			}
		}
		$(this.getDOMNode()).find("#columnsButtonDiv,#tabsButtonDiv").css("display","none");
		$("#galleryColumnDiv").css("display","none");
		if(layout == "generic"){
			if($("#viewType").text() == "summaryView"){
				filledData = mergeRecursive(filledData,finalObject);
			}
			ReactDOM.render(<AddLayoutPropertyComponent  id={ev.target} filledData={filledData}/>,targetEle);
		}else if(layout == "columns"){
			$(this.getDOMNode()).find("#columnsButtonDiv").css("display","block");
			count--;
			var div = document.createElement("div");
		    $(div).attr("id",("columns"+count));
		    $(div).attr("class","columnsLayoutDiv");
		    $(ev.target).parents("div.readRow").find(".uiLayoutDiv").append(div);
			$(targetEle).append(div);
			ReactDOM.render(<AddColumnsLayoutComponent  id={ev.target} filledData={filledData}/>,$("#columns"+count)[0]);
		}else if(layout == "banner"){
			ReactDOM.render(<AddBannerLayoutComponent  id={ev.target} filledData={filledData}/>,targetEle);
		}else if(layout == "tabs"){
			$(this.getDOMNode()).find("#tabsButtonDiv").css("display","block");
			count--;
			var div = document.createElement("div");
		    $(div).attr("id",("tabs"+count));
		    $(div).attr("class","tabsLayoutDiv");
		    $(targetEle).append(div);
			ReactDOM.render(<AddTabsLayoutComponent  id={ev.target} filledData={filledData}/>,$("#tabs"+count)[0]);
		}else if(layout == "gallery"){
			$("#galleryColumnDiv").css("display","block");
			$("#buttonDiv").css("display","none");
			var filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},finalObject);
			ReactDOM.render(<AddLayoutPropertyComponent  id={ev.target} filledData={filledData}/>,targetEle);
		}else if(layout == "card"){
			$("#galleryColumnDiv").css("display","none");
			ReactDOM.render(<AddCardLayoutPropertyComponent  id={ev.target} filledData={filledData}/>,targetEle);
		}
	},
	addTabs : function(ev){
		var tabDivs = $("#uiLayoutDiv").find("div.tabsLayoutDiv");
		for(var i = 0;i < tabDivs.length;i++){
			if(tabDivs.eq(i).find("input:text").eq(0).val().trim() == ""){
				alert("please enter display name");
				return;
			}
			if(tabDivs.eq(i).find("input:text").eq(1).val().trim() == ""){
				alert("please select properties");
				return;
			}
		}
		var divIndex = this.props.index;
		var filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},finalObject);
		if(schemaJSON.hasOwnProperty("@operations")){
			if(schemaJSON["@operations"].hasOwnProperty("actions")){
				filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].actions)) : filledData,filledData);
			}
			if(schemaJSON["@operations"].hasOwnProperty("update")){
				filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].update)) : filledData,filledData);
			}
		}
		var targetEle = $("#uiLayoutDiv")[0];
		count--;
		var div = document.createElement("div");
	    $(div).attr("id",("tabs"+count));
	    $(div).attr("class","tabsLayoutDiv");
	    $(ev.target).parents("div.readRow").find(".uiLayoutDiv").append(div);
		ReactDOM.render(<AddTabsLayoutComponent  id={ev.target} filledData={filledData}/>,$("#tabs"+count)[0]);
	},
	addColumns : function(ev){
		var columnsDiv = $(this.getDOMNode()).find("div.columnsLayoutDiv");
		for(var i = 0;i < columnsDiv.length;i++){
			for(var j = 0;j<columnsDiv.eq(i).find("li:visible").length;j++){
				if(columnsDiv.eq(i).find("li:visible").eq(j).find("button span").text() == columnsDiv.eq(i).find("li:visible").eq(j).find("ul li").eq(0).text()){
					alert("please select layout");
					return;
				}
			}
		}
		var divIndex = this.props.index;
		var filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},finalObject);
		if(schemaJSON.hasOwnProperty("@operations")){
			if(schemaJSON["@operations"].hasOwnProperty("actions")){
				filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].actions)) : filledData,filledData);
			}
			if(schemaJSON["@operations"].hasOwnProperty("update")){
				filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].update)) : filledData,filledData);
			}
		}
		var targetEle = $("#uiLayoutDiv")[0];
		count--;
		var div = document.createElement("div");
	    $(div).attr("id",("columns"+count));
	    $(div).attr("class","columnsLayoutDiv");
	    $(ev.target).parents("div.readRow").find(".uiLayoutDiv").append(div);
		ReactDOM.render(<AddColumnsLayoutComponent  id={ev.target} filledData={filledData}/>,$("#columns"+count)[0]);
	},
	render : function(){
		var self=this;
		return(
			<div>
				<div className="row margin-bottom-gap remove-margin-left remove-margin-right ">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase">ui layout</span>
						 {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["readUILayout"]!=""){
										classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["readUILayout"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
		                <button type="button" className="btn btn-default dropdown-toggle form-control"  data-toggle="dropdown">
		                 	<span data-bind="label" className='uilayout' id="uilayout" ref="updateType">Select Layout</span>
		                </button>
		                <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
		                   	<li><span >Select Layout</span></li>
		                   	{ 
		                   		this.props.layouts.map(function(lo){
		                   			return <li><span onClick={this.selectLayoutType.bind(this,lo)}>{lo}</span></li>
		                   		},this) 	 
		                   	}
		              	</ul>
					</div>
				</div>
				
				<div className="row no-margin uiLayoutDiv" id="uiLayoutDiv"></div>
				<div  className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left "></div>
				<div id="tabsButtonDiv" className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding-left ">
					<label >
						<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD TAB' onClick={this.addTabs}/>
					</label>
				</div>
				<div id="columnsButtonDiv" className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
					<label >
						<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD COLUMN' onClick={this.addColumns}/>
					</label>
				</div>
			</div>
		)
	}
});




var AddCardLayoutPropertyComponent = React.createClass({
	componentDidMount : function(){
		$("#cardLayoutPropsDiv").find("input:text").attr("readonly","readonly");
		if(this.props.edit){
			var cardData = this.props.propertyData.UILayout.layout;
			$("#cardLayoutPropsDiv").find("input:text#cardProfileImgFld").val(cardData.profileImage);
			$("#cardLayoutPropsDiv").find("input:text#cardNameFld").val(cardData.name);
			$("#cardLayoutPropsDiv").find("input:text#cardAddressFld").val(cardData.address);
			$("#cardLayoutPropsDiv").find("input:text#cardImagesFld").val(cardData.images);
			$("#cardLayoutPropsDiv").find("input:text#cardAboutFld").val(cardData.about);
		}
	},
	getMultiDialogBox : function(ev){
		getPopupContent2("Select Property","","",ev.target,"");
		ReactDOM.render(<GetMultiplePropertiesPopup  id={ev.target}  />,document.getElementById('genericPopupBody2'));
	},
	render : function(){
		return(<div id="cardLayoutPropsDiv">
					<div id="cardProfileImgDiv" className="row no-margin">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span className="text-uppercase opNameSpan">profile image</span>
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="cardProfileImgFld" className="form-control form-group" placeholder="please select profile image" onClick={this.getMultiDialogBox}/>
						</div>
					</div>
					
					<div id="cardNameDiv" className="row no-margin">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span className="text-uppercase opNameSpan">NAME</span>
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="cardNameFld" className="form-control form-group" placeholder="please select name" onClick={this.getMultiDialogBox}/>
						</div>
					</div>
					
					<div id="cardAddressDiv" className="row no-margin">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span className="text-uppercase opNameSpan">address</span>
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="cardAddressFld" className="form-control form-group" placeholder="please select property" onClick={this.getMultiDialogBox}/>
						</div>
					</div>
					
					<div id="cardImagesDiv" className="row no-margin">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span className="text-uppercase opNameSpan">images</span>
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="cardImagesFld" className="form-control form-group" placeholder="please select property" onClick={this.getMultiDialogBox}/>
						</div>
					</div>
					
					<div id="cardAboutDiv" className="row no-margin">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span className="text-uppercase opNameSpan">about</span>
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="cardAboutFld" className="form-control form-group" placeholder="please select property" onClick={this.getMultiDialogBox}/>
						</div>
					</div>
			</div>
		)
	}
});
function checkFirstchar(ev){ 
	var regex=new RegExp("^[a-zA-Z]");
	if($(ev.target).val().trim() != ""){
		if(!regex.test($(ev.target).val().trim())){
			alert("first character must be an alphabetr");
			$(ev.target).val("");
			return false;
		}
		var str = $(ev.target).val().trim();
		if(/^[a-zA-Z0-9-_ ]*$/.test(str) == false) {
		   	alert("do not enter special characters");
		   	$(ev.target).val("");
		   	return false;
		}
		if(schemaJSON["@operations"]){
			var operations = schemaJSON["@operations"];
			for(var i = 0;i<Object.keys(operations).length;i++){
				var trgt;
				if($("#genericPopupBody #opType").text() == "actions"){
					trgt = $("#genericPopupBody .actionName");
				}else{
					trgt = $("#genericPopupBody #opName");
				}
				for(var j = 0;j < Object.keys(schemaJSON["@operations"][Object.keys(schemaJSON["@operations"])[i]]).length;j++){
					if(Object.keys(schemaJSON["@operations"][Object.keys(schemaJSON["@operations"])[i]])[j].toLowerCase() == trgt.val().trim().toLowerCase()){
						alert("Do not enter Duplicates");
						trgt.val("");
						return false;
					}
				}
			}
		}
	
	}
}
	
var AddLayoutPropertyComponent = React.createClass({
	componentDidMount : function(){
		 $("#layoutUL").sortable({
		 	revert: true
		});
		var divIndex = this.props.divIndex;
		
		if(this.props.edit){
			var UILayout = this.props.propertyData.UILayout;
			if(divIndex == "summary"){
				$("#uiLayoutPropsDiv .readRow").eq(0).find(".layoutUL")[0].innerHTML = "";
				for(var j = 0;j < UILayout.layout.length;j++){
					count--;
					var li = document.createElement("li");
					$(li).attr("id",("layout"+count));
					$(li).attr("class","margin-bottom-gap-sm ui-sortable-handle");
					//$("#uiLayoutPropsDiv .readRow").eq(0).find(".layoutUL").append(li);
					$(this.getDOMNode()).find(".layoutUL").append(li);
					target=$("li#layout"+count)[0]
					ReactDOM.render(<ViewInputOutputComponent data={UILayout.layout[j]} edit = {this.props.edit} type={"layout"}/>,target);
				}
			}else{
				$("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".layoutUL")[0].innerHTML = "";
				for(var j = 0;j < UILayout[divIndex].layout.length;j++){
					count--;
					var li = document.createElement("li");
					$(li).attr("id",("layout"+count));
					$(li).attr("class","margin-bottom-gap-sm ui-sortable-handle");
					//$("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".layoutUL").append(li);
					$(this.getDOMNode()).find(".layoutUL").append(li);
					target=$("li#layout"+count)[0]
					ReactDOM.render(<ViewInputOutputComponent data={UILayout[divIndex].layout[j]} edit = {this.props.edit} type={"layout"}/>,target);
				}
			}
		}
	},
	render : function(){
		var filledData = this.props.filledData;
		console.log(filledData);
		return(
			<div>
				<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
				 	<span>PROPERTIES</span>
				</div>
				<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding-left" >
					<ul id="layoutUL" className="row list-unstyled remove-margin-left layoutUL">
						<li className="margin-bottom-gap-sm">
							<div>
								<button type="button" className="btn btn-default dropdown-toggle  form-control no-margin " style={{width:"85%"}} data-toggle="dropdown">
									<span data-bind="label " className='layout'>Select Layout</span>
								</button>
								<ul className="dropdown-menu scrollable-menu col-lg-10 col-md-10 col-sm-10 col-xs-10 no-padding-left " role="menu">
									<li><span >Select Layout</span></li>
									{ 
										Object.keys(filledData).map(function(obj){
											if($.type(filledData[obj]) == "object"){
												return <li><span  onClick={selectInputOutput.bind(this,obj,"layout")}>{obj}</span></li>
											}
										},this) 	 
									}
								</ul>
							  
								<i  className="fa fa-arrows-v  border-none link special-padding-left"></i>
								<div className=" link col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left  form-group" style={{"font-size":"12px"}}  onClick={removeLI}>Remove</div>
							</div>
						</li>
					</ul>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
						<label >
							<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={addInputOutput.bind(this,"layout",filledData)}/>
						</label>
					</div>
				</div>
			</div>
		)
	}
});

var AddColumnsLayoutComponent = React.createClass({
	componentDidMount : function(){
		 $(".layoutUL").sortable({
		 	revert: true
		});
		var divIndex = this.props.divIndex;
		if(this.props.edit){
			//var UILayout = this.props.propertyData.UILayout;
			var UILayout = this.props.propertyData;
				$(this.getDOMNode()).find(".firstColumn").html("");
				for(var j = 0;j < UILayout.length;j++){
					count--;
					var li = document.createElement("li");
					$(li).attr("id",("layout"+count));
					$(li).attr("class","margin-bottom-gap-sm ui-sortable-handle");
					//$("#uiLayoutPropsDiv .readRow").eq(divIndex).find(".firstColumn").append(li);
					$(this.getDOMNode()).find(".firstColumn").append(li);
					target=$("li#layout"+count)[0]
					ReactDOM.render(<ViewInputOutputComponent edit = {this.props.edit} data={UILayout[j]} type={"layout"}/>,target);
				}
		}
	},
	render : function(){
		var filledData = this.props.filledData;
		console.log(filledData);
		return(
			<div>
				<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
				 	<span>COLUMN</span>
				</div>
				<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding-left" >
					<ul className="row list-unstyled remove-margin-left layoutUL firstColumn">
						<li className="margin-bottom-gap-sm">
							<div>
								<button type="button" className="btn btn-default dropdown-toggle  form-control no-margin " style={{width:"85%"}} data-toggle="dropdown">
									<span data-bind="label " className='layout'>Select Layout</span>
								</button>
								<ul className="dropdown-menu scrollable-menu col-lg-10 col-md-10 col-sm-10 col-xs-10 no-padding-left " role="menu">
									<li><span >Select Layout</span></li>
									{ 
										Object.keys(filledData).map(function(obj){
											if($.type(filledData[obj]) == "object"){
												return <li><span  onClick={selectInputOutput.bind(this,obj,"layout")}>{obj}</span></li>
											}
										},this) 	 
									}
								</ul>
							  
								<i  className="fa fa-arrows-v  border-none link special-padding-left"></i>
									<div className=" link col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left  form-group" style={{"font-size":"12px"}}  onClick={removeLI}>Remove</div>
								{/*<i className="icons8-delete fa-2x border-none link special-padding-left" onClick={removeLI}></i>*/}
							</div>
						</li>
					</ul>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
						<label >
							<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={addInputOutput.bind(this,"layout",filledData)}/>
						</label>
					</div>
				</div>
			</div>
		)
	}
});

var AddTabsLayoutComponent = React.createClass({
	componentDidMount : function(){
		$(this.getDOMNode()).find(".propertiesFld").attr("readonly","readonly");
		if(this.props.edit){
			$(this.getDOMNode()).find("input:text").eq(0).val(this.props.propertyData.displayName);
			$(this.getDOMNode()).find("input:text").eq(1).val(this.props.propertyData.properties);
		}
	},
	getMultiDialogBox : function(ev){
		getPopupContent2("Select Properties","","button",ev.target,"fillMultidialogBoxData");
		ReactDOM.render(<GetMultiplePropertiesPopup  id={ev.target} tabProps={true}  ok={"ok"} multicheck={true}/>,document.getElementById('genericPopupBody2'));
	},
	checkFirstChar : function(ev){
		var regex=new RegExp("^[a-zA-Z]");
		if($(ev.target).val().trim() != ""){
			if(!regex.test($(ev.target).val().trim())){
				alert("first character must be an alphabetr");
				$(ev.target).val("");
				return false;
			}
			var str = $(ev.target).val().trim();
			if(/^[a-zA-Z0-9-_ ]*$/.test(str) == false) {
			   	alert("do not enter special characters");
			   	$(ev.target).val("");
			   	return false;
			}
		}
	},
	render: function(){
		return(
			<div>
				<div className="row no-margin displayNameFldDiv">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase propsSpan">display name</span>
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
						 <input type='text' className="form-control form-group displayNameFld" placeholder="please enter display name" onBlur={this.checkFirstChar}/>
					</div>
				</div>
				<div className="row no-margin propertiesFldDiv">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase propsSpan">properties</span>
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
						 <input type='text'  className="form-control form-group propertiesFld" placeholder="please select properties" onClick={this.getMultiDialogBox}/>
					</div>
				</div>
			</div>
		)
	}
	
});
var AddBannerLayoutComponent = React.createClass({
	componentDidMount : function(){
		$(".bannerLayoutDiv").find("input:text").attr("readonly","readonly");
		if(this.props.edit){
			var localFilledData = this.props.propertyData.UILayout[this.props.divIndex].layout;
			$("#uiLayoutPropsDiv .readRow").eq(this.props.divIndex).find("input:text.coverImageFld").val(localFilledData.coverImage);
			$("#uiLayoutPropsDiv .readRow").eq(this.props.divIndex).find("input:text.profileImageFld").val(localFilledData.profileImage);
			$("#uiLayoutPropsDiv .readRow").eq(this.props.divIndex).find("input:text.headerFld").val(localFilledData.overlay.header);
			$("#uiLayoutPropsDiv .readRow").eq(this.props.divIndex).find("input:text.subHeaderFld").val(localFilledData.overlay.subHeader);
		}
	},
	getMultiDialogBox : function(type,ev){
		getPopupContent2("Select Property","","",ev.target,"");
		ReactDOM.render(<GetMultiplePropertiesPopup  id={ev.target}  bannerLayout={type}/>,document.getElementById('genericPopupBody2'));
	},
	render : function(){
		return(
			<div className="bannerLayoutDiv">
				<div className="row no-margin coverImgDiv">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase propsSpan">cover image</span>
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
						 <input type='text' className="form-control form-group coverImageFld" placeholder="please select cover image" onClick={this.getMultiDialogBox.bind(this,'image')}/>
					</div>
				</div>
				<div className="row no-margin profileImgDiv">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase propsSpan">profile image</span>
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
						 <input type='text'  className="form-control form-group profileImageFld" placeholder="please select profile image" onClick={this.getMultiDialogBox.bind(this,'image')}/>
					</div>
				</div>
				<div className="row no-margin headerDiv">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase propsSpan">header</span>
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
						 <input type='text' className="form-control form-group headerFld" placeholder="please select header" onClick={this.getMultiDialogBox.bind(this,'bannerLayout')}/>
					</div>
				</div>
				<div className="row no-margin subHeaderDiv">
					<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
						 <span className="text-uppercase propsSpan">sub header</span>
					</div>
					<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
						 <input type='text' className="form-control form-group subHeaderFld" placeholder="please select sub header" onClick={this.getMultiDialogBox.bind(this,'bannerLayout')}/>
					</div>
				</div>
			</div>
		)
	}
})
var GetMultiplePropertiesPopup = React.createClass({
	componentDidMount : function(){
		if(this.props.id.value != ""){
			this.props.id.value.split(",").map(function(prop){
				//$("#genericPopupBody2").find("input:checkbox.property."+prop).attr("checked","true")
				
				for(var i=0;i<$("#genericPopupBody2").find("span.link").length;i++){
				  if($("#genericPopupBody2").find("span.link").eq(i).text() == prop){
				  	$("#genericPopupBody2").find("input:checkbox").eq(i).attr("checked","true")
				  }
				}
			})
		}
	},
	render : function(){
		var ele = this.props.id;
		if(this.props.multicheck){
			var filledData;
			if(this.props.tabProps){
				filledData = mergeRecursive(schemaJSON["@relations"] ? JSON.parse(JSON.stringify(schemaJSON["@relations"])) : {},finalObject);
				if(schemaJSON.hasOwnProperty("@operations")){
					if(schemaJSON["@operations"].hasOwnProperty("actions")){
						filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].actions)) : filledData,filledData);
					}
					if(schemaJSON["@operations"].hasOwnProperty("update")){
						filledData = mergeRecursive(schemaJSON["@operations"] ? JSON.parse(JSON.stringify(schemaJSON["@operations"].update)) : filledData,filledData);
					}
				}
			}else if(this.props.firstPopup){
				filledData = mergeRecursive(finalObject,sysProperties);
				var temp = {};
				temp["$status"]={};
				temp["$status"]["displayName"] = "$status";
				temp["$status"]["dataType"] ={};
				temp["$status"]["dataType"]["type"] = "defaultField";
				filledData = mergeRecursive(finalObject,temp);
			}else{
				filledData = finalObject;
			}
		
			return (
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					{
						Object.keys(filledData).map(function(data){
							if($.type(filledData[data]) == "object"){
							    return (
										 <div className="row no-margin ">
											 <div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 no-padding">
											 	<input type="checkbox" className={data + " property" } id={data}/>&nbsp;
						            	   		<span className="fieldText link">{data}</span>
						            	    </div>
				            	        </div>
									 )
								}
						})
					}
		         </div>
				)
		}else if(this.props.bannerLayout == "image"){
			return(
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						{
							Object.keys(finalObject).map(function(data){
								if($.type(finalObject[data]) == "object" && (finalObject[data].dataType.type == "image" || finalObject[data].dataType.type == "images")){
									return (
											 <div className="row no-margin ">
												 <div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 no-padding">
							            	   		<span className="fieldText link" onClick={fillDataInDialogBox.bind(this,data,ele)}>{data}</span>
							            	    </div>
					            	        </div>
										 )
									}
							})
						}
			         </div>
				)
		}else{
			var filledData;
			if(this.props.reltype){//Object.keys(schemaJSON["@relations"]).length > 0 && $("#operationsDiv #updateType").text() == "relation"
				filledData = schemaJSON["@relations"];
			}else{
				filledData = finalObject;
			}
			if(filledData){
				return(
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						{
							Object.keys(filledData).map(function(data){
								if($.type(filledData[data]) == "object"){
									return (
											 <div className="row no-margin ">
												 <div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 no-padding">
							            	   		<span className="fieldText link" onClick={fillDataInDialogBox.bind(this,data,ele)}>{data}</span>
							            	    </div>
					            	        </div>
										 )
									}
							})
						}
			         </div>
				)
			}else{
				return(
					<div>No Data Found</div>
				)
			}
			
		}
		
	}
});


function fillDataInDialogBox(data,ele,ev){
	ele.value = data;
	$('#genericDilog2,.modal-backdrop').remove();
}

/**
 *used to generate content in dialogbox for new field  
 */
var AddFieldPopup = React.createClass({
	getInitialState: function() {
	    return {schemas: [],helpText: DefinitionStore.getDefinition("HelpTextForSchema")};
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	selectDataType : function(type){
		if($("#propName").val().trim() == ""){
			alert("please enter property name");
			return;
		}
		$("#defaultValue").removeAttr("disabled");
		this.dataType.innerHTML = type;
		$("#objectDiv").css("display","none");
		$("#optionalsDiv").css("display","inline");
		if(type == "boolean"){
			$("#defaultValue").val("").attr("disabled","disabled");
		}else{
			$("#defaultValue").val("").removeAttr("disabled");
		}
		if(type == "video"){
			$("#videoDimentionDiv").css("display","block");
			$("#defaultValue").val("").attr("disabled","disabled");
			$("#all").attr("checked","true");
		}else{
			$("#videoDimentionDiv").css("display","none");
		}
		if(type == "pickList" || type == "multiPickList"){
			$("#optionsDiv").css("display","inline");
		}else{
			$("#optionsDiv").css("display","none");
		}
		if(type == "label"){
			$("#labelDiv").css("display","inline");
		}else{
			$("#labelDiv").css("display","none");
		}
		if(type == "currency"){
			$("#currencyDiv").css("display","inline");
		}else{
			$("#currencyDiv").css("display","none");
		}
		
		if(type == "struct"){
			$("#structsDiv").css("display","inline");
			$("#optionalsDiv").css("display","none");
			$("#defaultValue").val("").attr("disabled","disabled");
		}else{
			$("#structsDiv").css("display","none");
		}
		if(type == "formula"){
			$("#defaultValue").val("").attr("disabled","disabled");
			$("#optionalsDiv").css("display","none");
			$("#formulaDiv,#formulaPropertiesDiv").css("display","block");
			$("#formulaEvaluatorField").val("").removeAttr("readonly");
			$("#functionPropertiesDiv").children().remove();
			$("#functionsDiv").find("span#formulaFunction").text($("#functionsDiv").find("ul li").eq(0).text());
		}else{
			$("#formulaDiv").css("display","none");
		}
		if(type == "array"){
			$("#arrayDiv").css("display","inline");
			$("#defaultValue").val("").attr("disabled","disabled");
		}else{
			$("#arrayDiv").css("display","none");
		}
		if(type == "object"){
			$("#objectDiv").css("display","inline");
			
			$("#genericPopupBody #knownkeyDiv,#relRefKeyDiv,#relationNameDiv,#actionButtonNameDiv,#showRelatedNameDiv,#relation_desc_div,#relationViewDiv").css("display","none");
			$("#objlookup")[0].checked=true;
			
			$("#structsDiv").css("display","none");
			$("#optionsDiv").css("display","none");
			$("#defaultValue").val("").attr("disabled","disabled");
			if(this.props.name == "struct" || $("#genericPopupBody #dataType").text() == "array"){
				$("#genericPopupBody #objchild").attr("disabled","disabled");
			}
		}else{
			$("#objectDiv").css("display","none");
		}
		if(type == "image" || type == "images"){
			$("#imageDimentionDiv").css("display","inline");
			$("#defaultValue").attr("disabled","disabled");
		}else{
			$("#imageDimentionDiv").css("display","none");
		}
		if(type == "phone"){
			$("#maskDiv").css("display","block");
		}else{
			$("#maskDiv").css("display","none");
		}
		if(type=="rating"){
            $("#ratingDiv").css("display","block");
            $("#genericPopupBody #ratingTypeValuesDiv").css("display","none");
        }else{
            $("#ratingDiv").css("display","none");
        }
        if(type=="autoNumber"){
            $("#genericPopupBody #autoNumber,#genericPopupBody #autoNumberDiv").css("display","block");
        }else{
            $("#genericPopupBody #autoNumber,#genericPopupBody #optionalsDiv").css("display","none");
            ReactDOM.unmountComponentAtNode(document.getElementById('autoNumberDiv'));
        }
	},
	
	selectStructName : function(struct){
		this.structReference.innerHTML = struct;
	},
	selectElementType : function(type,ev){
		this.eleType.innerHTML = type;
		$("#objectDiv,#labelDiv,#maskDiv,#ratingDiv,#optionsDiv,#structsDiv,#imageDimentionDiv,#videoDimentionDiv,#ratingTypeValuesDiv,#currencyDiv").css("display","none");
		if(type == "phone"){
			$("#maskDiv").css("display","block");
		}else if(type == "struct"){
			$("#structsDiv").css("display","inline");
		}else if(type == "object"){
			$("#objectDiv").css("display","inline");
			if(this.props.name == "struct" || $("#genericPopupBody #dataType").text() == "array"){
				$("#genericPopupBody #objchild").attr("disabled","disabled");
			}
		}else if(type == "pickList" || type == "multiPickList"){
			$("#optionsDiv").css("display","inline");
		}else if(type == "image" || type == "images"){
			$("#imageDimentionDiv").css("display","inline");
		}else if(type == "video"){
			$("#videoDimentionDiv").css("display","block");
			$("#all").attr("checked","true");
		}else if(type=="rating"){
            $("#ratingDiv").css("display","block");
        }else if(type == "label"){
			$("#labelDiv").css("display","inline");
		}else if(type == "currency"){
			$("#currencyDiv").css("display","inline");
		}
	},
	componentDidMount : function(){
		
		ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
		
		
		$("#defaultValue").attr("disabled","disabled");
		var self = this;
		WebUtils.doPost("/schema?operation=getSchemaObjects",{},function(result){
			if(result.data.error){
				alert(result.data.error +"\n select again");
			}
			self.setState({schemas: result.data});
	    }.bind(this));
		var objData = this.props.objData;
		$("#genericPopupBody #autoNumber,#structsDiv,#optionsDiv,#formulaDiv,#arrayDiv,#objectDiv,#imageDimentionDiv,#videoDimentionDiv,#defaultValDivOther,#defaultValDivFormula,#maskDiv,#ratingDiv,#labelDiv,#currencyDiv").css("display","none");
        ReactDOM.unmountComponentAtNode(document.getElementById('autoNumberDiv'))
		if(this.props.ok){
			$("div#footer").find("input[type='button']").show();
			$("div .modal-body #search").find("input:text").hide();
		}
		if(objData){
			if(objData.postValidation){
				$('#genericPopupBody #PVFormulaEvaluatorField').val(objData.postValidation.expression);
				$('#genericPopupBody #PVErrorMsg').val(objData.postValidation.errorMessage);
			}
			$('#genericPopupBody #propName').val(this.props.propName);
			$('#genericPopupBody #dispName').val(objData.displayName);
			$('#genericPopupBody #prompt').val(objData.prompt);
			$('#genericPopupBody #item_prop').val(objData.itemProp);
			$('#genericPopupBody #description').val(objData.description);
			$('#genericPopupBody #dataType').html(objData.dataType.type);
			$("#genericPopupBody #dataType").parent().attr("disabled","disabled");
			$('#genericPopupBody #propName').attr("disabled","disabled");
			$('#genericPopupBody #defaultValue').val(objData.defaultValue).removeAttr("disabled");
			if(objData.dataType.type == "object" || objData.dataType.type == "image" || objData.dataType.type == "images" || objData.dataType.type == "struct"){
				$("#defaultValue").attr("disabled","disabled");
			}
			if(objData.dataType.type == "phone"){
				$("#maskDiv").css("display","block");
				if(objData.hasOwnProperty("mask")){
					objData.mask ? $("#mask")[0].checked = true : $("#mask")[0].checked = false;
				}
			}
			if(objData.dataType.type == "label"){
				$("#labelDiv").css("display","block");
				$("#labelText").val(objData.dataType.labelText);
			}
			
			if(objData.dataType.type == "array"){
				if(objData.dataType.elements.type == "object" || objData.dataType.elements.type == "image" || objData.dataType.elements.type == "images" || objData.dataType.elements.type == "struct"){
					$("#defaultValue").attr("disabled","disabled");
				}else if(objData.dataType.elements.type == "video"){
					$("#videoDimentionDiv").css("display","block");
					$("#"+objData.dataType.media).attr("checked","true");
					$("#videoWidth").val(objData.dataType.width);
					$("#videoHeight").val(objData.dataType.height);
					$("#defaultValue").val("").attr("disabled","disabled");
				}else if(objData.dataType.elements.type == "label"){
					$("#labelDiv").css("display","block");
					$("#labelText").val(objData.dataType.elements.labelText);
				}else if(objData.dataType.elements.type == "currency"){
					$("#currencyDiv").css("display","block");
					$("#currencyType").text(objData.dataType.elements.currencyType);
				}
			}
			if(objData.dataType.type == "formula"){
				$("#formulaDiv").css("display","inline");
				if(this.props.objData.dataType.formulaFunction){
					$("#formulaFunction").text(this.props.objData.dataType.functionName);
					$('#formulaEvaluatorField').attr("readonly","readonly");
					$("#formulaPropertiesDiv").css("display","none");
					var functionProperties = {};
					Object.keys(finalObject).map(function(property){
						if(finalObject[property].dataType.type == "array" && finalObject[property].dataType.elements.type == "struct"){
							functionProperties[property] = finalObject[property];
						}
						
					});
					document.getElementById("functionPropertiesDiv").innerHTML = "";
					ReactDOM.render(<ShowFunctionPropComponent  functionProperties={functionProperties}/>,$("#functionPropertiesDiv")[0]);
				}
				
				$('#formulaEvaluatorField').val(objData.dataType.expression);
				var separators = [' ', '\\\+', '-', '\\\(', '\\\)', '\\*', '/', ':', '\\\?'];
				if(objData.dataType.functionName){
					
					var exp = (objData.dataType.expression.trim()).substring(objData.dataType.functionName.length).trim();
					var tokens = exp.split(new RegExp(separators.join('|'), 'g')); 
					
					getRelation(0,exp,tokens);
				}else{
					var exp = objData.dataType.expression.trim();
					var tokens = exp.split(new RegExp(separators.join('|'), 'g')); 
					
					getRelation(0,exp,tokens);
				}
			}else if(objData.dataType.type == "pickList" || objData.dataType.type == "multiPickList"){
				$("#optionsDiv").css("display","inline");
				$("#options").val( objData.dataType.options.join("\n")); 
			}else if(objData.dataType.type == "image" || objData.dataType.type == "images"){
				$("#imageDimentionDiv").css("display","inline");
				$("#genericPopupBody #thumbnailWidth").val(objData.dataType.thumbnailWidth);
				$("#genericPopupBody #thumbnailHeight").val(objData.dataType.thumbnailHeight);
				$("#genericPopupBody #imgWidth").val(objData.dataType.width);
				$("#genericPopupBody #imgHeight").val(objData.dataType.height);
				$("#genericPopupBody #imgRadious").val(objData.dataType.radius);
				$("#genericPopupBody #imgTransform").val(objData.dataType.transfom);
			}else if(objData.dataType.type == "video"){
				$("#videoDimentionDiv").css("display","block");
				$("#all").attr("checked","true");
				$("#videoWidth").val(objData.dataType.width);
				$("#videoHeight").val(objData.dataType.height);
				$("#defaultValue").attr("disabled","disabled");
				$("#"+objData.dataType.media).attr("checked","true");
			}else if(objData.dataType.type == "currency"){
				$("#currencyDiv").css("display","block");
				$("#currencyType").text(objData.dataType.currencyType);
			}else if(objData.dataType.type == "object"){
				$("#objectDiv").css("display","inline");
				if(objData.dataType.refType == "lookup"){
					$("#genericPopupBody #knownkeyDiv,#relRefKeyDiv,#relationNameDiv,#actionButtonNameDiv,#showRelatedNameDiv,#relation_desc_div,#relationViewDiv").css("display","none");
					$("#objlookup").attr("checked","checked").attr("disabled","disabled");
					$("#genericPopupBody #referencekey").val(objData.dataType.refKey);
					$("#objchild").attr("disabled","disabled");
				}else{
					$("#relationViewDiv").css("display","block");
					$("#objchild").attr("checked","checked").attr("disabled","disabled");
					$("#objlookup").attr("disabled","disabled");
					var relName = Object.keys(objData.parentData.relationData)[0];
					$("#genericPopupBody #referencekey").val(objData.dataType.refKey).attr("disabled","disabled");
					$("#genericPopupBody #knownkey").val(objData.parentData.relationData[relName].knownKey).attr("disabled","disabled");
					$("#genericPopupBody #relRefKey").val(objData.parentData.relationData[relName].relationRefKey).attr("readonly","readonly");
					$("#genericPopupBody #relationName").val(relName);
					if(objData.parentData.relationData[relName].relationView == ""){
						$("#genericPopupBody #relationView").text($("#genericPopupBody #relationView").parent().next().find("li").eq(0).text());
					}else{
						$("#genericPopupBody #relationView").text(objData.parentData.relationData[relName].relationView);
					}
					$("#genericPopupBody #actionButtonName").val(objData.parentData.relationData[relName].action.displayName);
					$("#genericPopupBody #showRelatedName").val(objData.parentData.relationData[relName].showRelated.displayName);
				}
				$("#genericPopupBody #reference_object").text(objData.dataType.objRef);
				
				if(/*($("#objlookup")[0].checked && objData.dataType.refKey == "recordId") ||*/ ($("#objchild")[0].checked && objData.dataType.refKey == "recordId")){
					ReactDOM.unmountComponentAtNode(document.getElementById('relation_desc_div'));
					ReactDOM.render(<RelationDescComponent  propertyData = {objData}/>,document.getElementById('relation_desc_div'));
				}
				$("#WhereClause").attr("disabled","disabled");
				$("#genericPopupBody #reference_object").parent().attr("disabled","disabled");
				
				WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":objData.dataType.objRef},function(result){
					if(result.data.error){
							alert(result.data.error +"\n select again");
						}
					$(self.WhereClause).data("properties",result.data);
					if(objData.dataType.hasOwnProperty("filterCondition")){
						var filterCondition = objData.dataType.filterCondition;
						self.WhereClause.checked = true;
						self.ShowHideFilter(filterCondition,self.WhereClause);
					}	
				});
			}else if(objData.dataType.type == "array"){
				$("#arrayDiv").css("display","inline");
				$("#genericPopupBody #eleType").parent().attr("disabled","disabled");
				$("#eleType").text(objData.dataType.elements.type);
				if(objData.dataType.elements.type == "pickList" || objData.dataType.elements.type == "multiPickList"){	
					$("#optionsDiv").css("display","inline");
					$("#options").val( objData.dataType.elements.options.join("\n"));
				}else if(objData.dataType.elements.type == "image" || objData.dataType.elements.type == "images"){	
					$("#imageDimentionDiv").css("display","inline");
					$("#genericPopupBody #thumbnailWidth").val(objData.dataType.thumbnailWidth);
					$("#genericPopupBody #thumbnailHeight").val(objData.dataType.thumbnailHeight);
					$("#genericPopupBody #imgWidth").val(objData.dataType.width);
					$("#genericPopupBody #imgHeight").val(objData.dataType.height);
					$("#genericPopupBody #imgRadious").val(objData.dataType.radius);
					$("#genericPopupBody #imgTransform").val(objData.dataType.transfom);
				}else if(objData.dataType.elements.type == "struct"){
					$("#structsDiv").css("display","inline");
					$("#structReference").text( objData.dataType.elements.structRef);
					$("#genericPopupBody #structReference").parent().attr("disabled","disabled");
				}else if(objData.dataType.elements.type == "object"){
					$("#objectDiv").css("display","inline");
					$("#genericPopupBody #reference_object").parent().attr("disabled","disabled");
					$("#reference_object").text(objData.dataType.elements.objRef);
					$("#referencekey").val(objData.dataType.elements.refKey);
					$("#WhereClause").attr("disabled","disabled");
					if(objData.dataType.elements.refType == "lookup"){
						$("#objlookup").attr("checked","checked").attr("disabled","disabled");
						$("#objchild").attr("disabled","disabled");
					}else{
						$("#objchild").attr("checked","checked").attr("disabled","disabled");
						$("#objlookup").attr("disabled","disabled");
					}
					WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":objData.dataType.elements.objRef},function(result){
						if(result.data.error){
							alert(result.data.error +"\n select again");
						}
						$(self.WhereClause).data("properties",result.data);
						if(objData.dataType.elements.hasOwnProperty("filterCondition")){
							var filterCondition = objData.dataType.filterCondition;
							self.WhereClause.checked = true;
							self.ShowHideFilter(filterCondition,self.WhereClause);
						}	
					});
				}else if(objData.dataType.elements.type == "phone"){
					$("#maskDiv").css("display","block");
					if(objData.hasOwnProperty("mask")){
						objData.mask ? $("#mask")[0].checked = true : $("#mask")[0].checked = false;
					}
				}else if(objData.dataType.elements.type == "rating"){
                    $("#ratingDiv").css("display","inline");
                    $("#ratingType").text(objData.dataType.elements.ratingType);
                    if(objData.dataType.elements.ratingType=="star"){
                         $("#genericPopupBody #ratingTypeValuesDiv").css("display","inline");
                         $("#bestRatingValue").val(objData.dataType.elements.best);
                         $("#worstRatingValue").val(objData.dataType.elements.worst);
                    }else{
                         $("#genericPopupBody #ratingTypeValuesDiv").css("display","none");
                    }
                   
                }
			}else if(objData.dataType.type == "rating"){
                $("#ratingDiv").css("display","inline");
                $("#ratingType").text(objData.dataType.ratingType);
                if(objData.dataType.ratingType=="star"){
                     $("#genericPopupBody #ratingTypeValuesDiv").css("display","inline");
                     $("#bestRatingValue").val(objData.dataType.best);
                     $("#worstRatingValue").val(objData.dataType.worst);
                }else{
                     $("#genericPopupBody #ratingTypeValuesDiv").css("display","none");
                }
               
            }else if(objData.dataType.type == "autoNumber"){
              	$("#genericPopupBody #autoNumber").css("display","inline");
              	$("#optionalsDiv").css("display","none");
              	if(objData.dataType.autoNumberType == "number"){
              		$("#an").attr("checked","checked");
              	}else{
              		$("#stran").attr("checked","checked");
              		ReactDOM.render(<AutoNumberComponent objData={objData} />,document.getElementById('autoNumberDiv'));
              	}
            }
			if(objData.hasOwnProperty("required")){
				if(objData.required == true){
					$("#requiredField").attr("checked","checked");
				}
				$("#AllowDuplicatesField").attr("checked",objData.dataType.unique);
			}
		}
	},
	selectRatingType:function(type,ev){
        this.ratingType.innerHTML = type;
        if(type=="star"){
           $("#genericPopupBody #ratingTypeValuesDiv").css("display","inline");
        }else{
           $("#genericPopupBody #ratingTypeValuesDiv").css("display","none");
        }
    },
	setDisplayName : function(ev){
		var property = $(ev.target).val();
		$("#dispName").val(property.toUpperCase());
		$("#prompt").val(property.toUpperCase());
	},
	checkFirstchar : function(ev){ /*used for check first character of the property name alphabet or not and for duplicate of propwerty name*/
		var regex=new RegExp("^[a-zA-Z]");
		var fieldName = $("#propName").val().trim();
		if($("#propName").val().trim() != ""){
			if(!regex.test(fieldName)){/*used to check first character alphabet or not*/
				alert("first character must be an alphabetr");
				$("#propName").val("");
				return false;
			}else{ /*used to check for duplicate property names*/
				fieldName = camelize(fieldName);
				Object.keys(formulaObjects).map(function(key){
					if(key==fieldName){
						alert("duplicate property names are not allowed");
						$("#propName").val("");
						return false;
					}
				});
			}
			var str = $("#propName").val().trim();
			if(/^[a-zA-Z0-9-_ ]*$/.test(str) == false) {
			   	alert("do not enter special characters");
			   	$("#propName").val("");
			   	return false;
			}
		}
	},
	selectOperator:function(op,id,ev){
		$("#"+id).val($("#"+id).val()+" "+op.split(" ")[0]+" ");
		if($(ev.target).parents("div").eq(0).find("button span").attr("id") == "formulaFunction"){
			$(ev.target).parents("div").eq(0).find("button span").text(op);
			$("#formulaEvaluatorField").val("");
			$("#formulaEvaluatorField").attr("readonly","readonly");
			$("#formulaEvaluatorField").val($("#formulaEvaluatorField").val()+" "+op.split(" ")[0]+" ");
			$("#formulaPropertiesDiv").css("display","none");
			var functionProperties = {};
			Object.keys(finalObject).map(function(property){
				if($.type(finalObject[property]) == "object"){
					if((finalObject[property].dataType.type == "text" || finalObject[property].dataType.type == "number" ) || finalObject[property].dataType.type == "array" && (finalObject[property].dataType.elements.type == "struct" || finalObject[property].dataType.elements.type == "number" || finalObject[property].dataType.elements.type == "text")){
						functionProperties[property] = finalObject[property];
					}
				}
			});
			document.getElementById("functionPropertiesDiv").innerHTML = "";
			ReactDOM.render(<ShowFunctionPropComponent  functionProperties={functionProperties}/>,$("#functionPropertiesDiv")[0]);
		}
	},
	ShowHideFilter : function(data,ev){
		var target;
		if(ev.target){
			target = $(ev.target).parent().next()[0];	
			ev=ev.target;
		}else{
			target = $(ev).parent().next()[0];
			ev=ev;
		}
		
		if(!ev.checked){
			target.innerHTML = "";
		}else{
			if($("#reference_object").text().trim() == $("#reference_object").parent().next().find("li").eq(0).text()){
				alert("please select object reference of "+$("#propName").val());
				return false;
			}else{
				ReactDOM.render(<ShowHideFilterComponent  data={data}/>,target);
			}
		}
	},
	selectObjRef : function(obj,ev){
		var self = this;
		this.reference_object.innerHTML = obj;
		$("#genericPopupBody #referencekey").val("");
		if($("#objchild").is(":checked")){
			$("#relation_desc_div").css("display","block");
			$("#genericPopupBody #referencekey").val("recordId").attr("disabled","disabled");
			$("#genericPopupBody #knownkey").val(camelize($("#genericPopupBody #propName").val())).attr("disabled","disabled");
			$("#genericPopupBody #relRefKey").val("recordId").attr("readonly","readonly");
			if(this.props.name == "schema" && $("#dataType").text() == "object"){
				ReactDOM.unmountComponentAtNode(document.getElementById('relation_desc_div'));
				ReactDOM.render(<RelationDescComponent  />,document.getElementById('relation_desc_div'));
			}
			WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":obj},function(result){
				if(result.data.error){
					alert(result.data.error +"\n select again");
				}
				$(self.WhereClause).data("properties",result.data);
			});
		}else if($("#objlookup").is(":checked")){
			$("#relation_desc_div").css("display","none");
			$("#genericPopupBody #referencekey").removeAttr("disabled","disabled");
			WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":obj},function(result){
				if(result.data.error){
					alert(result.data.error +"\n select again");
				}
				$(self.WhereClause).data("properties",result.data);
			});
		}else{
			alert("please select reference type");
			return;
		}
	},
	getReferenceKey : function(keyType,ev){
		if($("#genericPopupBody #WhereClause").data("properties")){
			var id = ev.target;
			var data;
			if(keyType == "knownKey"){
				data= {};
				data["@properties"] = {}; 
				data["@properties"] = finalObject;
			}else{
				data =$("#genericPopupBody #WhereClause").data("properties");
			}
			
			data["@properties"]["recordId"] ={};
			data["@properties"]["recordId"]["displayName"] = "RECORD ID";
			data["@properties"]["recordId"]["dataType"] ={};
			data["@properties"]["recordId"]["dataType"]["type"] = "text";
			getPopupContent2("Select Reference key","","","","");
			
			var showProps;
			if($("#objchild").is(":checked")){
				var properties=[];
				if(keyType == "knownKey"){
					var props = mergeRecursive(finalObject,sysProperties);
					Object.keys(props).map(function(name){
						properties.push(name);
					})
				}else{
					Object.keys(data["@properties"]).map(function(name){
						properties.push(name);  
					})
				}
				showProps = properties;
			}else{
				var len = data["@views"].length;
				for(var i = 0;i < len;i++){
			    	if(data["@views"][i].viewName == "summary"){
			    		showProps = data["@views"][i].value;
			    		break;
			    	}
			    }
		    }
			ReactDOM.render(<GetObjectRelationPopup fieldData = {data} showProps= {showProps}  id={id} targetEle = {id} doublePopup={true} exitPost={true}/>,document.getElementById('genericPopupBody2'));
		}else{
			alert("please select Object Reference");
			return;
		}
	},
	enableRelationDesc : function(id,ev){
		if(id == "objchild"){
			$("#relationName,#rel_name2").val("");
			$("#relation_desc_div").css("display","none");
			$("#genericPopupBody #knownkeyDiv,#relationViewDiv,#relRefKeyDiv,#relationNameDiv,#actionButtonNameDiv,#showRelatedNameDiv").css("display","block");
			$("#genericPopupBody #reference_object").text($("#genericPopupBody #reference_object").parent().next().find("li").eq(0).text());
			$("#genericPopupBody #referencekey").val("");
			var index = 0;
			Object.keys(finalObject).map(function(obj){
			  if(finalObject[obj].dataType.type == "object"){
			    if(finalObject[obj].dataType.refType == "child"){
			    	index = index+1;
			    }
			  }
			});
			if(index > 0){
				$("#genericPopupBody #objlookup")[0].checked=true;
				alert("you can not perform child operation");
				return;
			}
		}else{
			$("#genericPopupBody #reference_object").text($("#genericPopupBody #reference_object").parent().next().find("li").eq(0).text());
			$("#genericPopupBody #referencekey").val("");
			$("#genericPopupBody #knownkeyDiv,#relRefKeyDiv,#relationNameDiv,#actionButtonNameDiv,#showRelatedNameDiv,#relation_desc_div,#relationViewDiv").css("display","none");
			
			$("#genericPopupBody #referencekey").removeAttr("disabled");
			if($("#genericPopupBody #referencekey").val() != "recordId" && id == "objchild"){
				ReactDOM.unmountComponentAtNode(document.getElementById('relation_desc_div'));
			}
		}
	},
	showDefaultVal : function(id,ev){
		if($("#defaultFormula")[0].checked){
			$("#defaultValDivOther").css("display","block");
			$("#defaultValDivFormula").css("display","none");
		}else{
			$("#defaultValDivFormula").css("display","block");
			$("#defaultValDivOther").css("display","none");
		}
	},
	selectRelationViewName : function(view,ev){
		$("#relationView").text(view);
	},
	getCurrencyType : function(currencyType,ev){
		$("span#currencyType").text(currencyType);
	},
	autoNumberHTML : function(type,ev){
		if(type =="show"){
			ReactDOM.render(<AutoNumberComponent />,document.getElementById('autoNumberDiv'));
		}else{
			ReactDOM.unmountComponentAtNode(document.getElementById('autoNumberDiv'));
		}
	},
	
	render : function(){
	var self=this;
	var dataTypes = this.props.dataTypes;
	var mathFunctions = ["sum"];
	var operators = ["+ Add","- Substract","* Multiply","/ Devide","= Equal","&& And","|| Or","> Greater Than",">= Greater Than Or Equal","< Less than","<= Less Than Or Equal",];
	var relationViews = ["carousel","GoDetail","TableEditView"];
	formulaObjects = mergeRecursive(formulaObjects,sysProperties,"#");
	var currencyTypes = ["INR","USD","DINAR"];
	var getCurrencyType = this.getCurrencyType;
		return (
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>PROPERTY NAME</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesPropertyName"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesPropertyName"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="propName" className="form-control form-group" placeholder="please enter alphanumerals only" onKeyUp={this.setDisplayName} onBlur={this.checkFirstchar}/>
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>DISPLAY NAME</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesDisplayName"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesDisplayName"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="dispName"  className="form-control form-group reqfalse" placeholder="enter display name"/>
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>PROMPT NAME</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesPromptName"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesPromptName"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="prompt" className="form-control form-group" placeholder="please enter Prompt name" />
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>DESCRIPTION</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesDescription"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesDescription"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="description"  className="form-control form-group" placeholder="enter description"/>
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>ITEM PROPERTY</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesItemProperty"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesItemProperty"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="item_prop" className="form-control form-group" placeholder="please enter item property" />
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>DATA TYPE</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesDataType"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesDataType"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
			                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
		                     	<span data-bind="label" id="dataType" ref={(e)=>{this.dataType=e}}>Select DataType</span>
		                    </button>
		                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
	                           	<li><span >Select DataType</span></li>
	                           	{ 
	                           		this.props.dataTypes.map(function(datatype){
		                           		if($("input:radio#struct").is(":checked")){
		                           			if(datatype != "struct" && datatype != "array"){
		                           				return <li><span onClick={this.selectDataType.bind(this,datatype)}>{datatype}</span></li>
		                           			}
		                           		}else{
		                           			return <li><span onClick={this.selectDataType.bind(this,datatype)}>{datatype}</span></li>
		                           		}
	                           		},this) 	 
	                           	}
                          	</ul>
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>DEFAULT VALUE</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesDefaultValue"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesDefaultValue"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <input type='text' id="defaultValue" className="form-control form-group reqfalse" placeholder="please enter default value" />
						</div>
					</div>
					<div id="arrayDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>ELEMENT TYPE</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesElementType"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesElementType"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
			                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
		                     	<span data-bind="label" id="eleType" ref={(e)=>{this.eleType=e}}>Select Element Type</span>
		                    </button>
		                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
	                           	<li><span >Select Element Type</span></li>
	                           	{ 
	                           		dataTypes.map(function(type){
	                           			if(type != "array" && type != "formula"){
											return <li><span onClick={this.selectElementType.bind(this,type)}>{type}</span></li>	                           				
	                           			}
	                           		},this) 	 
	                           	}
                          	</ul>
						</div>
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap" id="structsDiv">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>Struct Reference</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesStructReference"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesStructReference"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding" >
			                <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
		                     	<span data-bind="label" id="structReference" ref={(e)=>{this.structReference=e}}>Select Struct Referencee</span>
		                    </button>
		                    <ul className="dropdown-menu  scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
	                           	<li><span >Select Struct Referencee</span></li>
	                           	{ 
	                           		structNames.map(function(struct){
	                           			return <li><span onClick={this.selectStructName.bind(this,struct)}>{struct}</span></li>
	                           		},this) 	 
	                           	}
                          	</ul>
						</div>
					</div>
					<div id="optionsDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>OPTIONS</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesOptions"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesOptions"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div  className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <textarea type='text' id="options"  className="form-control form-group" placeholder="enter options with new line.."/>
						</div>
					</div>
					
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap" id="labelDiv">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>LABEL TEXT</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesLabel"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesLabel"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
							 <textarea id="labelText" className="form-control form-group remove-padding-left" placeholder="please enter label text" />
						</div>
					</div>
					
					
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap" id="currencyDiv">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>CURRENCY TYPE</span>
							 {
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesCurrency"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesCurrency"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding add-border-bottom-white-screen" >
							<button type="button" className="btn btn-default dropdown-toggle form-control"  data-toggle="dropdown">
								 <span data-bind="label" id="currencyType" ref="PVOperator">Select Currency Type</span>
							</button>
							<ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
								<li><span >Select Currency Type</span></li>
								{ 
									currencyTypes.map(function(currency){
										return <li><span onClick={this.getCurrencyType.bind(this,currency)}>{currency}</span></li>
									},this) 	 
								}
							</ul>
						</div>
					</div>
							
					<div id="objectDiv" className="row no-margin">
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
							<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>REFERENCE TYPE</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesReferenceType"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesReferenceType"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
										 <input  id="objlookup" ref="objlookup" type="radio" name="objrelation" className="lookup" onClick={this.enableRelationDesc.bind(this,"objlookup")}/>&nbsp;
										 <span className="fieldText no-padding-left ">lookup</span>&nbsp;&nbsp;
										<input id="objchild" ref="objchild" type="radio" name="objrelation" className="child" onClick={this.enableRelationDesc.bind(this,"objchild")}/>&nbsp;
										<span className="fieldText no-padding-left ">child of</span>
								</div>
							</div>
							<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>REFERENCE OBJECT</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesReferenceObject"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesReferenceObject"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
				             	     	<span data-bind="label" id="reference_object" ref={(e)=>{this.reference_object=e}}>Select Property</span>
				                     </button>
				                  	<ul id="obj-ref" className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
				                       	<li><span >Select Property</span></li>
				                       	{ 
				                       		this.state.schemas.map(function(obj){
				                           		return <li><span onClick={this.selectObjRef.bind(this,obj)}>{obj}</span></li>
				                       		},this) 	 
				                       	}
				                  	</ul>
								</div>
							</div>
							<div id="referencekeyDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>REFERENCE KEY</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesReferenceKey"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesReferenceKey"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="referencekey"  ref="referencekey" className="form-control" placeholder="select reference key" onClick={this.getReferenceKey.bind(this,"referenceKey")}/>
								</div>
							</div>
							
							<div id="knownkeyDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>KNOWN KEY</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesKnownKey"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesKnownKey"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="knownkey"  ref="knownkey" className="form-control" placeholder="select known key" onClick={this.getReferenceKey.bind(this,"knownKey")}/>
								</div>
							</div>
							
							<div id="relRefKeyDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>RELATION REFERENCE KEY</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesRelationRefKey"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesRelationRefKey"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="relRefKey"  ref="relRefKey" className="form-control" placeholder="select reference key" onClick={this.getReferenceKey.bind(this,"relReferenceKey")}/>
								</div>
							</div>
							
							<div id="relationNameDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>RELATION NAME</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesRelationName"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesRelationName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="relationName" ref="relationName" className="form-control" onKeyUp={onlyAlphabets.bind(this)} placeholder="enter relation name"/>
								</div>
							</div>
							
							<div id="relationViewDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
								 	<span>RELATION VIEW</span>
								 	{
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesRelationView"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesRelationView"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>						
								<div className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									<button type="button" className="btn btn-default dropdown-toggle form-control" ref="relationViewLeft" data-toggle="dropdown">
				                     	<span data-bind="label" id="relationView" ref="relationView">Select relation view</span>
				                    </button>
				                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
			                           	<li onClick={this.selectRelationViewName.bind(this,"Select relation view")}><span >Select relation view</span></li>
			                           	{ 
			                           		relationViews.map(function(view){
			                           			return <li onClick={this.selectRelationViewName.bind(this,view)}><span >{view}</span></li>
			                           		},this) 	 
			                           	}
			                      	</ul>
								 </div>
					 		</div>
							
							<div id="actionButtonNameDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>ACTION BUTTON NAME</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesActionButtonName"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesActionButtonName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="actionButtonName"  ref="actionButtonName" className="form-control" placeholder="enter action button name"/>
								</div>
							</div>
							
							<div id="showRelatedNameDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
									 <span>SHOW RELATED NAME</span>
									 {
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesShowRelatedName"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesShowRelatedName"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
								<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
									 <input type='text' id="showRelatedName"  ref="showRelatedName" className="form-control" placeholder="enter show related name"/>
								</div>
							</div>
							<div id="relation_desc_div"></div>
							
							<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left margin-bottom-gap"  >
								<input type='checkbox'  ref={(e)=>{this.WhereClause=e}} id="WhereClause" name="filtareCondition" className="remove-padding-left "  onClick={this.ShowHideFilter.bind(this,"")}/>&nbsp;
								<span className="fieldText no-padding-left ">FILTER CONDITION</span>
								{
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesFilterCondition"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesFilterCondition"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
						    </div>
					  
					  		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 whereClauseDiv"></div>	
							
						</div>	
						
					</div>
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap" id="formulaDiv">
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
							<div className="row no-margin">
						    	<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
							 		<span>FORMULA FIELD</span>
							 		{
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesFormulaField"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesFormulaField"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
								</div>
						    </div>
							<div className="row remove-margin-left remove-margin-right margin-bottom-gap" >
								 <div id="functionsDiv" className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left " >
				              	    <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
			                     	     <span data-bind="label" id="formulaFunction" ref="formulaFunction">Select Function</span>
			                        </button>
		                          	<ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
			                           	<li><span >Select Function</span></li>
			                           	{ 
			                           		mathFunctions.map(function(operator){
			                           			return <li><span onClick={this.selectOperator.bind(this,operator,"formulaEvaluatorField")}>{operator}</span></li>
			                           		},this) 	 
			                           	}
		                          	</ul>
		                          	{
										["a"].map(function(temp){
												var classNames="hidden helpText";
												var textValue="";
												if(self.state.helpText && self.state.helpText["propertiesFormulaFunction"]!=""){
													classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
													textValue=self.state.helpText["propertiesFormulaFunction"];
												}
												return(<div className={classNames}>{textValue}</div>)
												
											})
									}
	                          	</div>
							
								<div id="formulaPropertiesDiv">
						    	 <div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding  pull-right" >
				              	     <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
			                     	     <span data-bind="label" id="Property" ref="Property">Select Property</span>
			                         </button>
		                          	<ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
			                           	<li><span >Select Property</span></li>
			                           	{ 
			                           		Object.keys(formulaObjects).map(function(property){
			                           			if(formulaObjects[property].hasOwnProperty("dataType")){
			                           				if(formulaObjects[property].dataType.type != "struct" && formulaObjects[property].dataType.type != "geoLocation"  && formulaObjects[property].dataType.type != "array"){//formulaObjects[property].dataType.type != "formula" &&
				                           				return <li><span onClick={selectProperty.bind(this,property,formulaObjects[property])}>{property+" ("+formulaObjects[property].dataType.type+")"}</span></li>
				                           			}
			                           			}
			                           		},this) 	 
			                           	}
		                          	</ul>
	                          	</div>
	                          </div>
	                          	
	                          	<div id="functionPropertiesDiv" className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding  pull-right"></div>
						    </div>
						    
						    <div className="row remove-margin-left remove-margin-right margin-bottom-gap">
						    	<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12   no-padding" >
									 <textarea id="formulaEvaluatorField" className="form-control remove-padding-left textarea" ></textarea>
								</div>
								{
									["a"].map(function(temp){
											var classNames="hidden helpText";
											var textValue="";
											if(self.state.helpText && self.state.helpText["propertiesFormulaEvaluatorField"]!=""){
												classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
												textValue=self.state.helpText["propertiesFormulaEvaluatorField"];
											}
											return(<div className={classNames}>{textValue}</div>)
											
										})
								}
						    </div>
						    <div className="row no-margin"></div>
							<div className="row remove-margin-left remove-margin-right margin-bottom-gap">
								 <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding" >
				              	    <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
			                     	     <span data-bind="label" id="formula" ref="formula">Select Operator</span>
			                        </button>
		                          	<ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
			                           	<li><span >Select Operator</span></li>
			                           	{ 
			                           		operators.map(function(operator){
			                           			return <li><span onClick={this.selectOperator.bind(this,operator,"formulaEvaluatorField")}>{operator}</span></li>
			                           		},this) 	 
			                           	}
		                          	</ul>
	                          	</div>
							</div>					
						</div>
					</div>
					<div id="videoDimentionDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>VIDEO WIDTH</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
								 <input type='text' id="videoWidth"  ref="videoWidth" className="form-control reqfalse" placeholder="enter video width" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>VIDEO HEIGHT</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
								 <input type='text' id="videoHeight"  ref="videoHeight" className="form-control reqfalse" placeholder="enter video height" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>MEDIA</span>
							</div>
							<div  className="form-group col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding form-group" >
								 <input type='radio' id="web" className="media"  ref="videoWeb"  name="videoMedia"/>&nbsp;
								 <span className="fieldText no-padding-left ">WEB</span>&nbsp;
							</div>
							<div  className="form-group col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding form-group" >
								 <input type='radio' id="mobile"  className="media" ref="videoMobile"  name="videoMedia"/>&nbsp;
								 <span className="fieldText no-padding-left ">MOBILE</span>&nbsp;
							</div>
							<div  className="form-group col-lg-2 col-md-2 col-xs-2 col-sm-2 no-padding " >
								 <input type='radio' id="all" className="media" ref="videoAll"  name="videoMedia"/>&nbsp;
								 <span className="fieldText no-padding-left ">ALL</span>
							</div>
					</div>
					<div id="imageDimentionDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>IMAGE WIDTH</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
								 <input type='text' id="thumbnailWidth"  ref="thumbnailWidth" className="form-control reqfalse" placeholder="enter thumbnail width" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>IMAGE HEIGHT</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group " >
								 <input type='text' id="thumbnailHeight"  ref="thumbnailHeight" className="form-control reqfalse" placeholder="enter thumbnail height" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>THUMBNAIL WIDTH</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
								 <input type='text' id="imgWidth"  ref="imgWidth" className="form-control reqfalse" placeholder="enter width" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>THUMBNAIL HEIGHT</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
								 <input type='text' id="imgHeight"  ref="imgHeight" className="form-control reqfalse" placeholder="enter height" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
							<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
								 <span>RADIUS</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
								 <input type='text' id="imgRadious"  ref="imgRadious" className="form-control reqfalse" placeholder="enter radius" onKeyPress={numeralsOnly.bind(this)}/>
							</div>
								<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left " >
								 <span>TRANSFORM</span>
							</div>
							<div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding " >
								 <input type='text' id="imgTransform"  ref="imgTransform" className="form-control reqfalse" placeholder="enter transform" />
							</div>									
						</div>			
					</div>
					
					<div className="row remove-margin-left remove-margin-right margin-bottom-gap maskDiv" id="maskDiv">
						<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding " >
		   					<input type="checkbox" ref="requiredField" id="mask" />&nbsp;&nbsp;
		   					<span className="fieldText">MASK</span>
			       		</div>
					</div>
					
					<div id="ratingDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
                       <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
                            <span>RATING TYPE</span>
                        </div>                      
                        <div className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" >
                            <button type="button" className="btn btn-default dropdown-toggle form-control" ref="ratingTypeView" data-toggle="dropdown">
                                <span data-bind="label" id="ratingType" ref={(e)=>{this.ratingType=e}}>Select rating type</span>
                            </button>
                            <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
                                <li onClick={this.selectRatingType.bind(this,"star")}><span >star</span></li>
                                <li onClick={this.selectRatingType.bind(this,"hand")}><span >hand</span></li> 
                                <li onClick={this.selectRatingType.bind(this,"smiley")}><span >smiley</span></li> 
                            </ul>
                         </div>
                         <div id="ratingTypeValuesDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
                             <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left form-group" >
                                 <span>Best Rating</span>
                             </div>
                             <div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding form-group" >
                                 <input type='text' id="bestRatingValue"  ref="bestRatingValue" className="form-control reqfalse" placeholder="enter best rating" onKeyPress={numeralsOnly.bind(this)}/>
                             </div> 
                             <div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left " >
                                 <span>Worst Rating</span>
                             </div>
                             <div  className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding " >
                                 <input type='text' id="worstRatingValue"  ref="worstRatingValue" className="form-control reqfalse" placeholder="enter worst rating" onKeyPress={numeralsOnly.bind(this)}/>
                             </div>
                         </div>    
                    </div>
					
					<div id="autoNumber" className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding" title="Allows only number">
		   					<input type="radio" id="an" name="autoNumberField" onClick={this.autoNumberHTML.bind(this,'none')}/>&nbsp;&nbsp;
		   					<span className="fieldText">NUMBER</span>
		   					{
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesAutoNumber"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesAutoNumber"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
			       		</div>
			       		<div className=" col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding" title="Allows string with number">
		   					<input type="radio" id="stran" name="autoNumberField" onClick={this.autoNumberHTML.bind(this,'show')}/>&nbsp;&nbsp;
		   					<span className="fieldText">PROPERTIES WITH NUMBER</span>
		   					{
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesAutoNumberWithProperties"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesAutoNumberWithProperties"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
			       		</div>
					</div>
					<div id="autoNumberDiv"></div>
					<div id="optionalsDiv" className="row remove-margin-left remove-margin-right margin-bottom-gap">
						<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding requiredDiv" title="Always require a value in this field in order to save a record">
		   					<input type="checkbox" ref="requiredField" id="requiredField" />&nbsp;&nbsp;
		   					<span className="fieldText">REQUIRED</span>
		   					{
								["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["propertiesRequired"]!=""){
											classNames="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left helpText"; 
											textValue=self.state.helpText["propertiesRequired"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							}
			       		</div>
					</div>
	         	</div>
		)
	}
})

var AutoNumberComponent = React.createClass({
    addProperty : function(ev){
    	if($(".autoNumberSpan:last").text() == $(".autoNumberSpan:last").parent().next().find("li:eq(0)").text()){
    		alert("please select property");
    		return;
    	}
	    count--;
		var li = document.createElement("li");
		var target;
		$(li).attr("id",("autoNumber"+count));
		$(li).attr("class","margin-bottom-gap-sm");
		$("#autoNumberUL").append(li);
		target=$("#autoNumber"+count)[0];
		ReactDOM.render(<AddPropertyComponent />,target);
	},
    fillPrpperty : function(selectedProp,ev){
   		$(ev.target).parents("ul").eq(0).siblings(0).find("span").text(selectedProp);
    },
    componentDidMount : function(){
    	if(this.props.hasOwnProperty("objData") && this.props.objData.dataType.prefixFields){
    		for(var i=1;i<this.props.objData.dataType.prefixFields.length;i++){
    			count--;
				var li = document.createElement("li");
				var target;
				$(li).attr("id",("autoNumber"+count));
				$(li).attr("class","margin-bottom-gap-sm");
				$("#autoNumberUL").append(li);
				target=$("#autoNumber"+count)[0];
				ReactDOM.render(<AddPropertyComponent objData={this.props.objData} />,target);
    		}
    		autoNumberSpan= $("#autoNumberUL").find("span.autoNumberSpan")
			for(var an=0;an<autoNumberSpan.length;an++){
				autoNumberSpan.eq(an).text(this.props.objData.dataType.prefixFields[an]);
			}
    	}
    },
	render : function(){
		addProperty = this.addProperty;
		fillPrpperty = this.fillPrpperty;
		return(
			<div>
				<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
					<span>SELECT PROPERTY</span>
				</div>
				<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding-left" >
					<ul id="autoNumberUL" className="row list-unstyled remove-margin-left remove-margin-bottom">
                       	<li>
                           	<div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 form-group no-padding-left">
	                           	<button type="button" className="btn btn-default dropdown-toggle  form-control no-margin " data-toggle="dropdown">
			                     	<span data-bind="label" className="autoNumberSpan">Select Property</span>
			                    </button>
			                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left " role="menu">
		                          <li><span className='layout'>Select Property</span></li>
				                   	{ 
				                   		Object.keys(sysProperties).map(function(obj){
				                   			return <li><span onClick={fillPrpperty.bind(this,obj)}>{obj}</span></li>
				                   		},this) 	 
				                   	}
	                          	</ul>
							</div>
							<div className="col-lg-1 col-md-1 col-xs-1 col-sm-1 form-group no-padding-left">
								<i className="icons8-delete fa-2x border-none link" onClick={removeRow.bind(this)}></i>
							</div>
                  		</li>
                  	</ul>
                </div>
                
              	<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" ></div>
              	<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding-left ">
              		<label>
  						<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={this.addProperty.bind(this)}/>
  					</label>
  				</div>
			</div>
		)
	}
})

var AddPropertyComponent = React.createClass({
 	fillPrpperty : function(selectedProp,ev){
   		$(ev.target).parents("ul").eq(0).siblings(0).find("span").text(selectedProp);
    },
    componentDidMount : function(){
    },
	render : function(){
		fillPrpperty = this.fillPrpperty;
		return (<div>
					<div className="col-lg-11 col-md-11 col-xs-11 col-sm-11 form-group no-padding-left">
						<button type="button" className="btn btn-default dropdown-toggle  form-control no-margin " data-toggle="dropdown">
		                     <span data-bind="label" className="autoNumberSpan">Select Property</span>
	                    </button>
	                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left " role="menu">
	                      <li><span className='layout'>Select Property</span></li>
		                   	{ 
		                   		Object.keys(sysProperties).map(function(key){
		                   			return <li><span onClick={fillPrpperty.bind(this,key)}>{key}</span></li>
		                   		},this) 	 
		                   	}
	                  	</ul>
	               	</div>
	               	<div className="col-lg-1 col-md-1 col-xs-1 col-sm-1 form-group no-padding-left">
						<i className="icons8-delete fa-2x border-none link" onClick={removeRow.bind(this)}></i>
					</div>
				</div>
         )
	}
})

function removeRow(ev){
	if($("#autoNumberUL").children().length > 1){
		$(ev.target).parents('li').remove();
	}else{
		$(ev.target).parents('li').find('button').find('span').text($(ev.target).parents('li').find('li').eq(0).find('span').text());
	}
}

function onlyAlphabets(ev){
 	var regex = /^[a-zA-Z]*$/;
  	if(regex.test(ev.target.value)){
  		var property = ev.target.value;
		$("#genericPopupBody #rel_name2").val(property).attr('readonly','readonly');
      	return true;
  	}else{
    	 alert("Alphabets Only");
    	 ev.target.value="";
    	 $("#genericPopupBody #rel_name2").val("");
    	 return false;
 	}
}

function getRelation(q,exp,tokens){
	if(q < tokens.length){
	 	if(tokens[q].trim() != ""){    
	       	var searchWord = exp.search(tokens[q]);
	       	if(searchWord != -1){
		       	ffFields = tokens[q].split("__");
			    if(ffFields.length >= 2){
			    	var input;
			    	if(finalObject[ffFields[0]].dataType.type == "array"){
			    		input = finalObject[ffFields[0]].dataType.elements.structRef;
			    	}else if(finalObject[ffFields[0]].dataType.type == "object"){
			    		input = finalObject[ffFields[0]].dataType.objRef;
			    	}
			        WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":input},function(result){
			        	if(result.data.error){
							alert(result.data.error +"\n select again");
						}else{
			        		relationObjects[tokens[q]]=result.data["@properties"][ffFields[1]];
				        		getRelation(q+1,exp,tokens);
				        	}
				    })
				  }else{
				  	getRelation(q+1,exp,tokens);
				  }
			}
		}else{
			getRelation(q+1,exp,tokens);
		}
	}	
}	

var ShowFunctionPropComponent = React.createClass({
	render : function(){
		var functionProperties = this.props.functionProperties;
		return(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 form-group no-padding pull-right">
			<button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
         	     <span data-bind="label" id="Property" ref="Property">Select Property</span>
             </button>
          	<ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
               	<li><span >Select Property</span></li>
               	{ 
               		Object.keys(functionProperties).map(function(property){
                   		return <li><span onClick={selectProperty.bind(this,property,functionProperties[property])}>{property+" ("+functionProperties[property].dataType.type+")"}</span></li>
               		},this) 	 
               	}
          	</ul>
		</div>
		)
	}
})

var RelationDescComponent = React.createClass({
	componentDidMount : function(){
		var propertyData = this.props.propertyData;
		if(propertyData){
			$("#rel_name1").val(propertyData.parentData.relationDesc[0].split("-")[1]);
			$("#rel_name2").val(propertyData.parentData.relationDesc[1].split("-")[1]);
		}
	},
	render : function(){
		var rel1 = $("#genericPopupBody #reference_object").text();
		var rel2 = $("#schemaName").val();
		return(<div className="row no-margin">
					<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
					 	<label className="text-uppercase">{rel2+" TO "+rel1+" Relation Name"}</label>
						 <input type='text'  id="rel_name1" className="form-control remove-padding-left "  placeholder="Enter relation name" onClick={this.getJunctionObject}/>
					 </div>
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right form-group" >
					  <label className="text-uppercase">{rel1+" TO "+rel2+" Relation Name"}</label>
						 <input type='text'  id="rel_name2" className="form-control remove-padding-left "  placeholder="Enter relation name" onClick={this.getJunctionObject}/>
					 </div>
				</div>)
	}
})
/**
 *used to capture selected dropdown value and pushed into formula evaluator field 
 */
function selectProperty(prop,obj,ev){
	if($("#formulaEvaluatorField").val().trim() != ""){ /* checking for math operator is selected or not*/
		var char = $("#formulaEvaluatorField").val().trim().substring($("#formulaEvaluatorField").val().trim().length-1);
		if($("#functionsDiv").find("ul li").eq(0).text() == $("#formulaDiv").find("span#formulaFunction").text()){
			if(char != "+" && char != "-" && char != "*" && char != "/"){
				alert("please select operator");
				return;
			}
		}
	}
	if(obj.dataType.type == "object" || (obj.dataType.type == "array" && obj.dataType.elements.type == "struct")){
		if($(ev.target).parents("ul").parent().nextAll().length > 0){
			$(ev.target).parents("ul").parent().nextAll().remove();
			formulaRef = "";
		}
		var objRef
		if(obj.dataType.type == "array" && obj.dataType.elements.type == "struct"){
			objRef = obj.dataType.elements.structRef;
		}else{
			objRef = obj.dataType.objRef;
		}
		
		$(ev.target).parents("ul").eq(0).prev().find("span").text(prop);
		WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":objRef},function(result){
			if(result.data.error){
				alert(result.data.error +"\n select again");
			}
			if(result.data){
				formulaRef += prop+"__"
				--count;
				var data = result.data["@properties"];
				var div = document.createElement("div");
			    $(div).attr("id",("child"+count));
			    $(div).attr("class","col-lg-12 col-md-12 col-xs-12 col-sm-12 form-group no-padding pull-right special");
			    if(obj.dataType.type == "array" && obj.dataType.elements.type == "struct"){
					 $("#functionPropertiesDiv").append(div);
				}else{
					 $("#formulaPropertiesDiv").append(div);
				}
			    var len = result.data["@views"].length;
			    var showProps;
			    if(obj.dataType.type == "array" && obj.dataType.elements.type == "struct"){
			    	showProps=[];
				    for(var j=0;j<Object.keys(data).length;j++){
			    		showProps.push(Object.keys(data)[j]);
			   		}
				}else{
			   		for(var i = 0;i < len;i++){
				    	if(result.data["@views"][i].viewName == "summary"){
				    		showProps = result.data["@views"][i].value;
				    		break;
				    	}
				    }	
				}
				ReactDOM.render(<FormulaRelatedObj  data={data} showProps ={showProps} name = {prop}/>,$("div#"+("child"+count))[0]);
				
			}
		})
	}else{
		if(formulaRef != ""){
			$("#formulaEvaluatorField").val($("#formulaEvaluatorField").val()+ formulaRef+prop);
			$("#Property").text($("#formulaPropertiesDiv").children().find("ul").eq(0).find("li").eq(0).text());
			$("#formulaPropertiesDiv").children().not(":first").remove();
			$("#functionPropertiesDiv").children().not(":first").remove();
			relationObjects[formulaRef+prop]=obj;
			formulaRef="";
		}else{
			$(ev.target).parents("ul").eq(0).prev().find("span").text(prop);
			$("#formulaEvaluatorField").val($("#formulaEvaluatorField").val()+ prop);
		}
	}
}

/**
 *used to add dropdown dynamically in dialogbox 
 */
var FormulaRelatedObj=React.createClass({
	render:function(){
		var data = this.props.data;
		var name = this.props.name;
		var showProps = this.props.showProps;
		return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 form-group no-padding pull-right">
	      			 <button type="button" className="btn btn-default dropdown-toggle form-control" ref="productButton" data-toggle="dropdown">
	             	     <span data-bind="label" id="Property" ref="Property">{"Select Properties in " +name}</span>
	                 </button>
	              	 <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " role="menu">
	                   	<li><span >{"Select Properties in " +name}</span></li>
	                   	{ 
	                   		showProps.map(function(property){
	                       		if($.type(data[property]) == "object"){
	                       			if(data[property].dataType.type != "struct"){
	                       				return <li><span onClick={selectProperty.bind(this,property,data[property])}>{property+" ("+data[property].dataType.type+")"}</span></li>
	                       			}
	                       		}else if($.type(sysProperties[property]) == "object"){
	                       			if(sysProperties[property].dataType.type != "struct"){
	                       				return <li><span onClick={selectProperty.bind(this,property,sysProperties[property])}>{property+" ("+sysProperties[property].dataType.type+")"}</span></li>
	                       			}
	                       		}
	                   		},this)
	                   	}
	              	</ul>
	   		</div>)
    }
});

/**
 *used to save subschema in db 
 * schemaJSON1		---	json object
 */
function saveSchema(schemaJSON1){
	WebUtils.doPost("/schema?operation=saveSchema",schemaJSON1,function(result){
		if(result.data.error){
			alert(result.data.error +"\n select again");
		}
		delete schemaJSON1.deleteOldDerivedDocs;//if schema dependent key is changed
		delete schemaJSON.junctionSchema;//if schema is junction schema
		delete schemaJSON["actionButtonNames"];//if schema is junction schema
		delete schemaJSON["relatedButtonNames"];//if schema is junction schema
		delete schemaJSON["showInsummary"];//if schema is junction schema
		delete schemaJSON["@relationDesc"];//if schema is junction schema (or) obj ref child
		
		allSchemaNames.push(schemaJSON1["@id"]);//for adding schema name to array
		schemaJSON1.hasOwnProperty("@identifier") ? $("#dynamicContentDiv").data("@identifier",schemaJSON1["@identifier"]) : $("#schemaType").removeData("@identifier");
		schemaJSON1.hasOwnProperty("@dependentKey") ? $("#dynamicContentDiv").data("@dependentKey",schemaJSON1["@dependentKey"]) : $("#schemaType").removeData("@dependentKey");
		if(schemaJSON1["@properties"][schemaJSON1["@dependentKey"]]){//pradeep
			$("#dynamicContentDiv").data("dependentFieldOptions",schemaJSON1["@properties"][schemaJSON1["@dependentKey"]].dataType.options);
		}
		alert("data saved");
    }.bind(this));
}
exports.saveSchema=saveSchema;

var ShowHideFilterComponent = React.createClass({
	getProperties : function(object,ev){
		var id= "WhereClause";
		var data = $("#"+id).data("properties");
		if(object){
			var temp={};
			temp["@properties"] = {};
			Object.keys(finalObject).map(function(obj){
				if($.type(finalObject[obj]) == "object"){
					if(finalObject[obj].dataType.type == "object"){
					    console.log(finalObject[obj])
					    temp["@properties"][obj] = finalObject[obj];
					  }
				}
			})
			getPopupContent2("Select Property","","","","");
			ReactDOM.render(<GetObjectRelationPopup fieldData = {temp} doublePopup={true} id={ev.target} />,document.getElementById('genericPopupBody2'));
		}else{
			if(data){
				getPopupContent2("Select Property","","","","");
				ReactDOM.render(<GetObjectRelationPopup fieldData = {data}  doublePopup={true} id={ev.target} />,document.getElementById('genericPopupBody2'));
			}else{
				alert("error");
			}
		}
	},
	componentDidMount : function(){
		var filterCondition = this.props.data;
		var separators = ['=', '<', '>'];
		var cond = filterCondition.split(new RegExp(separators.join('|'), 'g')); 
		$("input:text#LHSproperty").val(cond[0]);
		$("input:text#RHSproperty").val(cond[1]);
	},
	render : function(){
		var id= "WhereClause";
		var data = $("#"+id).data("properties");
		return (
				<div className="row">
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 " >
						<input type='text' id={"LHSproperty"} className="form-control remove-padding-left form-group relationWith" placeholder={"Select "+data["@id"]+" Property"}  onClick={this.getProperties.bind(this,"")}/>
					  </div>
					  <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 " >
						<input type='text' id={"RHSproperty"} className="form-control remove-padding-left form-group relationWith" placeholder={"Select "+$("#schemaName").val()+" Property"} onClick={this.getProperties.bind(this,"object")}/>
					  </div>
	         	</div>
		)
	}
})

/**
 *used to fill the data in dialogbox 
 */
var GetObjectRelationPopup = React.createClass({
	componentDidMount : function(){
		if(this.props.search){
			$("div .modal-body #search").find("input:text").show();
			$("div#footer").find("input[type='button']").hide();
		}
	},
	render : function(){
		fieldData = this.props.fieldData;
		var id = this.props.id;
		var structName = this.props.structName;
		var dependency = this.props.dependency;
		var superType = this.props.superType;
		var doublePopup = this.props.doublePopup;
		var exitPost = this.props.exitPost;
		var junctionObject = this.props.junctionObject;
		var showProps = this.props.showProps;
		var refSchema = this.props.refSchema;
		var targetEle = this.props.targetEle;
		if(!id.id){//for adding titles on dialogbox
			if($("div#"+id).find("input:radio.lookup").is(":checked")){
				$("#header").find("label").text("Select lookup record");
			}else if($("div#"+id).find("input:radio.child").is(":checked")){
				$("#header").find("label").text("Select parent record");
			}
		}
		if(fieldData){
			if($.type(fieldData) == "array"){
				return (
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					{
						fieldData.map(function(data){
							return (
									 <div className="row no-margin ">
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={fillData1.bind(this,data,id,structName,dependency,superType,exitPost,junctionObject,refSchema,targetEle)} >
					            	   		<span className="fieldText link">{data}</span>
					            	    </div>
			            	        </div>
								 )
						})
					}
		         </div>
				)
			}else{
				if(showProps){
					return (
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						{
							showProps.map(function(data){
								if($.type(fieldData["@properties"][data]) == "object"){
									return (
										 <div className="row no-margin ">
											 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={fillData2.bind(this,data,id,fieldData,doublePopup,exitPost,targetEle)} >
						            	   		<span className="fieldText link">{data}</span>
						            	    </div>
				            	        </div>
									 )
								}
							})
						}
			         </div>
				)
				}else{
					return (
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
							<span>No Data Found</span>
							<div>please define summary view in {fieldData["@id"]}</div>
						</div>
					)
				}
				
			}
		}else{
			return (
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<span>No Data Found</span>
					</div>
					)
		}
	}
})


function fillData2(data,id,property,doublePopup,exitPost,targetEle,ev){
	if(doublePopup){
		$('#genericDilog2,.modal-backdrop').remove();
	}else{
			$('#genericDilog,.modal-backdrop').remove();
	}
	if(exitPost && doublePopup){
		$(id).val(data);
		if($("#genericPopupBody #dataType").text() == "object"){
			if($("#genericPopupBody #referencekey").val() == "recordId" && $("#objlookup")[0].checked){
				ReactDOM.unmountComponentAtNode(document.getElementById('relation_desc_div'));
				//$("#relationViewDiv").css("display","block");
				ReactDOM.render(<RelationDescComponent  />,document.getElementById('relation_desc_div'));
			}
			if($("#genericPopupBody #referencekey").val() != "recordId" && $("#objlookup")[0].checked){
				$("#relationViewDiv").css("display","none");
			}
		}
		
	}else{
		if(property.hasOwnProperty("@id")){//for LHS property filling
			$(id).val(property["@id"] +" . "+data);
		}else{//for filling RHS object and object property
			$(id).val(data);
		}
	}
	moveScroll(targetEle);
}
/**
 *This functionn is used to fill the selected data in textbox and empty clear the dialogbox 
 * @param data	----	selected data from dialogbox
 * @param id	----	id of the input element
 */
function fillData1(data,id,structName,dependency,superType,exitPost,junctionObject,refSchema,targetEle,ev){
	$("input:text#initialStateInput").val("");
	var thisEle = ev.target; 
	$('#genericDilog,.modal-backdrop').remove();
	moveScroll(thisEle);
	if(junctionObject){
		$(id).val(data);
		if($("#junctionSchemaLeft").val() !="" || $("#junctionSchemaRight").val() != ""){
			if($("#junctionSchemaLeft").val() == $("#junctionSchemaRight").val()){
				$(id).val("");
				alert("please select another Schema");
				return;
			}
		}
	}else if(superType){
		if($(id).val() != data){
		globalObjects = [];
			$("#referenceSchema").val("");
			WebUtils.doPost("/schema?operation=getSuperTypeSchemas",{superType:data},function(result){
				if(result.data.error){
					alert(result.data.error +"\n select again");
				}
				if(result.data == null){
					globalObjects = [];
				}else{
					globalObjects = schemaObjects = result.data;
				}
			})
			$(id).val(data);
		}
	}else{
		if(id.id){
			$("#likecheckbox,#followcheckbox").removeAttr("checked");
			$("#likeDetailsDiv,#followDetailsDiv").css("display","none");
			$("#likeActionBtnName,#likeRelatedName,#followActionBtnName,#followRelatedName").val("");
			$(id).val(data);
			if($("#schemaType").text().toLowerCase() == "junction object" && type == "edit"){
				$("#junctionObjectName,#junctionSchemaLeft,#junctionSchemaRight").attr("disabled","disabled");
			}
			if(!exitPost){
				WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":data},function(result){
					if(result.data.error){
						alert(result.data.error+"\n  select again");
					}
					schemaUniqueObject = result.data;
					if(id.id != "referenceSchema"){
						schemaJSON = result.data;
					}
					result.data.hasOwnProperty("@identifier") ? $("#dynamicContentDiv").data("@identifier",result.data["@identifier"]) : $("#schemaType").removeData("@identifier");
					result.data.hasOwnProperty("@dependentKey") ? $("#dynamicContentDiv").data("@dependentKey",result.data["@dependentKey"]) : $("#schemaType").removeData("@dependentKey");
					if(type == "edit" && name == "schema"){
						$("#superType,#itemType,#referenceSchema,#filterKeys,#initialStateInput").val("");
						if(result.data.hasOwnProperty("@superType")){
							$("#superType").val(result.data["@superType"]).attr("disabled","disabled");
						}
						if(result.data.hasOwnProperty("@itemType")){
							$("#itemType").val(result.data["@itemType"]);
						}
					}
					finalObject = {};
					formulaObjects={};
					views = [];
					finalObject = mergeRecursive(schemaUniqueObject["@properties"],finalObject);
					formulaObjects=JSON.parse(JSON.stringify(schemaUniqueObject["@properties"]));
					if($("#schemaType").text().toLowerCase() == "junction object"){
						$("#junctionSchemaLeft").val(schemaJSON.junctionSchema[0]);
						$("#junctionSchemaRight").val(schemaJSON.junctionSchema[1]);
						ReactDOM.unmountComponentAtNode(document.getElementById('junctionSchemaRelationDiv'));
						$("#junctionSchemaRelationDiv").css("display","block");
					}
					if(refSchema == "referenceSchema"){
						ReactDOM.unmountComponentAtNode(document.getElementById('schemaObjRow'));
						ReactDOM.render(<DisplayObject fullSchemaData={schemaUniqueObject} schemaUniqueObject = {schemaUniqueObject["@properties"]} header={"none"} refSchema={refSchema}/>,document.getElementById('schemaObjRow'));
					}
				});
			}
			}else{
				if(structName){
					$("div#"+structName).find("input:text#"+id).eq(0).val(data);
				}else{
					$("input[type='text']#"+id).val(data);
				}
				WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":data},function(result){
					if(result.data.error){
						alert(result.data.error+"\n  select again");
					}
					if(formulaObjects.hasOwnProperty(id)){
						formulaObjects[id].dataType["objRef"] = data;
						formulaObjects[id].dataType["refKey"] = result.data["@identifier"][0];
						formulaObjects[id].dataType["refType"] = $("div#"+id).find("input:radio.child")[0].checked ? "child" : "lookup";
					}
					if(structName){
						$("div#"+structName).find("input[type='text']#"+id).eq(0).val($("div#"+structName).find("input[type='text']#"+id).eq(0).val()+" ("+result.data["@identifier"][0]+")");
					}else{
						$("input[type='text']#"+id).eq(0).val($("input[type='text']#"+id).eq(0).val()+" ("+result.data["@identifier"][0]+")");
					}
					$("input[type='text']#"+id).eq(0).parent().next().find("input:checkbox:eq(0)").data("properties",result.data);
				});
			}
	}
	
}

var JunctionSchemaRelation = React.createClass({
	componentDidMount : function(){
		var data = this.props.data;
		if(data){
			if(data.relationView){
				$("#junctionSchemaLeftDisplayName").val(data["@properties"][data.junctionSchema[0]].displayName);
				$("#junctionSchemaRightDisplayName").val(data["@properties"][data.junctionSchema[1]].displayName);
				$("#junctionSchemaLeftRel").val(data["@relationDesc"][0].split("-")[1]);
				$("#junctionSchemaRightRel").val(data["@relationDesc"][1].split("-")[1]);
				$("#actionBtnNameLeft").val(data.actionButtonNames[0]);
				$("#actionBtnNameRight").val(data.actionButtonNames[1]);
				$("#showRelatedNameLeft").val(data.relatedButtonNames[0]);
				$("#showRelatedNameRight").val(data.relatedButtonNames[1]);
				$("#relationViewTypeLeft").text(data.relationView[0] != "" ? data.relationView[0] : "Select relation view");
				$("#relationViewTypeRight").text(data.relationView[1] != "" ? data.relationView[1] : "Select relation view");
			}
		}
		/*if(schemaJSON["@type"] == "RelationSchema"){
			$("#pageStatus").text("2 OF 8          (Configure Elements Properties)");
		}*/
	},
	selectRelationView : function(view,id,ev){
		$("#"+id).text(view);
	},
	backToJunctionSchemaMetaData : function(){
		var type = this.props.type;
		var title;
		if(type == "edit"){
			title = "Edit Junction Object"
		}else{
			title = "Create Junction Object";
		}
		//$("#pageStatus").text("1 OF 8          (Basic Properties)");
		ReactDOM.render(<CreateNewSchema  schemaObjects ={""} mainTitle={title} subTitle={'Schema Name'} placeholder={'placeholder'} name={'schema'} type={this.props.type} data={schemaJSON}/>,document.getElementById('dynamicContentDiv'));
	},
	configProperties : function(){
		if($("#junctionSchemaLeftRel").val().trim() == ""){
			alert("please enter Junction Object relation");
			return;
		}else if($("#junctionSchemaRightRel").val().trim() == ""){
			alert("please enter Junction Object relation");
			return;
		}else if($("#actionBtnNameLeft").val().trim() == ""){
			alert("please enter Action Button Display name");
			return;
		}else if($("#actionBtnNameRight").val().trim() == ""){
			alert("please enter Action Button Display name");
			return;
		}else if($("#showRelatedNameLeft").val().trim() == ""){
			alert("please enter Show Related Button Display name");
			return;
		}else if($("#showRelatedNameRight").val().trim() == ""){
			alert("please enter Show Related Button Display name");
			return;
		}
		schemaJSON["@relationDesc"] = [];
		schemaJSON["@relationDesc"].push(schemaJSON["@leftSchema"]+"-"+$("#junctionSchemaLeftRel").val()+"-"+schemaJSON["@rightSchema"]);
		schemaJSON["@relationDesc"].push(schemaJSON["@rightSchema"]+"-"+$("#junctionSchemaRightRel").val()+"-"+schemaJSON["@leftSchema"]);
		schemaJSON["junctionSchema"] = [];
		schemaJSON["actionButtonNames"] = [];
		schemaJSON["relatedButtonNames"] = [];
		schemaJSON["relationView"] = [];
		
		for(var i = 0;i < 2;i++){
			//var id = $("#dynamicContentDiv").find("input:text").eq(i).attr("id");
			var displayId,actionBtn,showRelated,relationView;
			i == 0 ? (displayId = "junctionSchemaLeftDisplayName") : (displayId = "junctionSchemaRightDisplayName");
			i == 0 ? (actionBtn = "actionBtnNameLeft") : (actionBtn = "actionBtnNameRight");
			i == 0 ? (showRelated = "showRelatedNameLeft") : (showRelated = "showRelatedNameRight");
			i == 0 ? (relationView = "relationViewTypeLeft") : (relationView = "relationViewTypeRight");
			i == 0 ? (id = schemaJSON["@leftSchema"]) : (id = schemaJSON["@rightSchema"]);
			schemaJSON["@properties"] ? schemaJSON["@properties"] : schemaJSON["@properties"] = {};
			schemaJSON["@properties"][id] = {};
			schemaJSON["@properties"][id]["description"] = id;
			schemaJSON["@properties"][id]["displayName"] = $("#"+displayId).val();
			schemaJSON["@properties"][id]["dataType"] = {};
			schemaJSON["@properties"][id]["dataType"]["type"] = "object";
			schemaJSON["@properties"][id]["dataType"]["objRef"] = id;
			schemaJSON["@properties"][id]["dataType"]["refKey"] = "recordId";
			schemaJSON["@properties"][id]["dataType"]["refType"] = "lookup";
			
			schemaJSON["junctionSchema"].push(id);
			schemaJSON["actionButtonNames"].push($("#"+actionBtn).val());
			schemaJSON["relatedButtonNames"] .push($("#"+showRelated).val());
			schemaJSON["relationView"] .push(($("#"+relationView).text().toLowerCase() != "select relation view") ? $("#"+relationView).text() : "");
			finalObject[id] = schemaJSON["@properties"][id];
		}
		console.log(schemaJSON);
		ReactDOM.render(<PropertiesComp data={schemaJSON} type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	render : function(){
		var data = this.props.data;
		var relationViews = ["carousel","GoDetail","TableEditView"];
		return(<div>
				 <h3 className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding " style={{"color":"#666"}} >Configure Junction Relation</h3>
				<div className="row no-margin">
					<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
					 	<label className="text-uppercase">display name</label>
						 <input type='text'  id="junctionSchemaLeftDisplayName" className="form-control remove-padding-left " placeholder="Enter Display name"/>
					 </div>
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right form-group" >
					  <label className="text-uppercase">display name</label>
						 <input type='text'  id="junctionSchemaRightDisplayName"  className="form-control remove-padding-left " placeholder="Enter Display name"/>
					 </div>
				</div>
				
				<div className="row no-margin">
					<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
					 	<label className="text-uppercase">{schemaJSON["@leftSchema"] +" to "+schemaJSON["@rightSchema"]+" Relation Name"}</label>
						 <input type='text'  id="junctionSchemaLeftRel" className="form-control remove-padding-left "  placeholder="Enter relation name" onClick={this.getJunctionObject}/>
					 </div>
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right form-group" >
					  <label className="text-uppercase">{schemaJSON["@rightSchema"] +" to "+schemaJSON["@leftSchema"]+" Relation Name"}</label>
						 <input type='text'  id="junctionSchemaRightRel" className="form-control remove-padding-left "  placeholder="Enter relation name" onClick={this.getJunctionObject}/>
					 </div>
				</div>
				
				<div className="row no-margin">
					<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
					 	<label className="text-uppercase">action button display name</label>
						 <input type='text'  id="actionBtnNameLeft" className="form-control remove-padding-left " placeholder="Enter Buton text"/>
					 </div>
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right form-group" >
					 	<label className="text-uppercase">action button display name</label>
						 <input type='text'  id="actionBtnNameRight"  className="form-control remove-padding-left " placeholder="Enter Buton text"/>
					 </div>
				</div>
				
				<div className="row no-margin">
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
					  <label className="text-uppercase">show related button display name</label>
						 <input type='text'  id="showRelatedNameLeft"  className="form-control remove-padding-left " placeholder="Enter show related name"/>
					 </div>
					  <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right form-group" >
					  <label className="text-uppercase">show related button display name</label>
						 <input type='text'  id="showRelatedNameRight"  className="form-control remove-padding-left " placeholder="Enter show related name"/>
					 </div>
				</div>
				
				<div className="row no-margin">
					 <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left form-group" >
					  <label className="text-uppercase">relation view</label>&nbsp;
						 <button type="button" className="btn btn-default dropdown-toggle form-control" ref="relationViewLeft" data-toggle="dropdown">
	                     	<span data-bind="label" id="relationViewTypeLeft" ref="relationViewTypeLeft">Select relation view</span>
	                    </button>
	                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
                           	<li><span >Select relation view</span></li>
                           	{ 
                           		relationViews.map(function(view){
                           			return <li onClick={this.selectRelationView.bind(this,view,"relationViewTypeLeft")}><span >{view}</span></li>
                           		},this) 	 
                           	}
                      	</ul>
					 </div>
					  <div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-right form-group" >
					  <label className="text-uppercase">relation view</label>&nbsp;
						 <button type="button" className="btn btn-default dropdown-toggle form-control" ref="relationViewRight" data-toggle="dropdown">
	                     	<span data-bind="label" id="relationViewTypeRight" ref="relationViewTypeRight">Select relation view</span>
	                    </button>
	                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
                           	<li><span >Select relation view</span></li>
                           	{ 
                           		relationViews.map(function(view){
                           			return <li onClick={this.selectRelationView.bind(this,view,"relationViewTypeRight")}><span >{view}</span></li>
                           		},this) 	 
                           	}
                      	</ul>
					 </div>
				</div>
				 <div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
		          	<label className="pull-left">
		            	<input type='button' className="btn  btn-warning"  onClick={this.backToJunctionSchemaMetaData} value='back'/>
		            </label>
		          	<label className="pull-right">
		            	<input type='button' className="btn  btn-warning"  onClick={this.configProperties} value='Configure Properties'/>
		            </label>
		          </div>
			</div>
		)
	}
})

var ObjectProperties = React.createClass({
	addDependentProperties:function(objData,ev){
		objData["dataType"]["dependentProperties"] = [];
		for(var i = 0;i < $(".dependencyDiv").find(".dependentProperties").length;i++){
			if($(".dependencyDiv").find(".dependentProperties").eq(i).find("input:checkbox").is(":checked")){
				objData["dataType"]["dependentProperties"].push($(".dependencyDiv").find(".dependentProperties").eq(i).find("input:checkbox").attr("id"));
			}
		}
	},
	render : function(){
		var data = this.props.data;
		obj = this.props.objData;
		addDependentProperties = this.addDependentProperties;
		return (
			<div>
			{
				Object.keys(data).map(function(key){
					if($.type(data[key]) == "object"){
						return(
							<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding dependentProperties">
			   					<input type="checkbox" ref={key} id={key} onClick={this.addDependentProperties.bind(this,obj)}/>&nbsp;&nbsp;
			   					<span className="fieldText link">{key}</span>
				       		</div>
						)
					}
				})
			}
			</div>
		)}
})

/**
 *used to combine 2 objects 
 * @param {Object} obj1	---	json object
 * @param {Object} obj2	--- json object
 */
function mergeRecursive(obj1, obj2,doller) {
    for (var p in obj2) {
        if(obj2.hasOwnProperty(p)){
        	if(doller){
				obj1[doller+p] = obj2[p];        		
        	}else{
        		obj1[p] = obj2[p];
        	}
        }
    }
    return obj1;
}

/**
 *used for call GenericPopup  
 */
function getPopupContent(title,search,button,target,functionName){
	$('#genericDilog,.modal-backdrop').remove();
	ReactDOM.render(<GenericPopup  title={title} search={search} button={button} target={target} functionName={functionName}/>,document.getElementById('dialogBoxDiv'));
	$('#genericDilog').modal("show");
}
exports.getPopupContent=getPopupContent;
function getPopupContent2(title,search,button,target,functionName){
	$('#genericDilog2,.modal-backdrop').remove();
	ReactDOM.render(<GenericPopup2  title={title} search={search} button={button} target={target} functionName={functionName} />,document.getElementById('dialogBoxDiv2'));
	$('#genericDilog2').modal("show");
}
exports.getPopupContent2=getPopupContent2;
/**
 *used for creating generic dialogbox code 
 */
var GenericPopup = React.createClass({
	componentDidMount:function(){
		$('html,body').scrollTop(0);
		var search = this.props.search;
		var button = this.props.button;
		if(!search){
			$("div .modal-body #search").find("input:text").hide();
		}else{
			$("div .modal-body #search").find("input:text").show();
		}
		if(!button){
			$("div#footer").find("input[type='button']").hide();
		}else{
			$("div#footer").find("input[type='button']").show();
		}
	},
	redirect:function(target,ev){
		var fnName = this.props.functionName;
		var propertyData = this.props.propertyData;
		if(fnName == "saveSingleProperty"){
			saveSingleProperty(target,ev);
		}else if(fnName == "saveView"){
			saveView(target,ev);
		}else if(fnName == "addOperation"){
			saveOperation(target,ev);
		}else if(fnName == "saveState"){
			saveState(target,ev);
		}else if(fnName == "selectRoleProperties"){ //Added for roles by Haritha.samudrala
            roles.selectRoleProperties(target,ev);
        }else if(fnName == "saveNavView"){ //Added by Haritha.samudrala
            saveNavView(target,ev);
        }else if(fnName == "saveShowRelated"){ //Added by Haritha.samudrala
            saveShowRelated(target,ev);
        }else if(fnName == "saveRecordNav"){ //Added by Haritha.samudrala 
            saveRecordNav(target,ev);
        }else if(fnName == "saveStateNames"){
        	saveStateNames(target,ev);
        }else if(fnName == "fillMultiCheckboxData"){
        	fillMultiCheckboxData(target,ev)
        }
	},
	render:function(){
		var title = this.props.title;
		var search = this.props.search;
		var button = this.props.button;
		var target = this.props.target;
		
		return (<div className="modal fade " id="genericDilog"  role="dialog" aria-labelledby="providerLabel" aria-hidden="true"  >
					  <div className="modal-dialog">
					    <div className="modal-content">
					      <div className="modal-header" id="header">
					   		<button aria-label="Close" data-dismiss="modal" className="close" type="button" onClick={removeDilogBox}><span className="icons8-delete fa-2x link" aria-hidden="true" /></button>
					        <label className="text-uppercase">{title}</label>	
					      </div>
					      <div className="modal-body">
					      	<div className="row no-margin" id="search">
					      		<input type='text' className="form-control form-group" placeholder="Search.."/>
					      	</div>
						      	<div id="genericPopupBody">
						      	
								</div>
					      </div>
					      <div className="modal-footer" id="footer">
					      		<label className="">
              						<input type='button' className="btn  btn-warning" value='OK' onClick={this.redirect.bind(this,target)}/>
              					</label>
					      </div>
					    </div>
					  </div>
					</div>)
   }	
});


var GenericPopup2 = React.createClass({
	componentDidMount:function(){
		$('html,body').scrollTop(0);
		var search = this.props.search;
		var button = this.props.button;
		if(!search){
			$("div#search2").find("input:text").hide();
		}else{
			$("div#search2").find("input:text").show();
		}
		if(!button){
			$("div#footer2").find("input[type='button']").hide();
		}else{
			$("div#footer2").find("input[type='button']").show();
		}
	},
	redirect2:function(target,ev){
		var fnName = this.props.functionName;
		var propertyData = this.props.propertyData;
		if(fnName == "fillMultidialogBoxData"){
			fillMultidialogBoxData(target,ev);
		}
	},
	render:function(){
		var title = this.props.title;
		var search = this.props.search;
		var button = this.props.button;
		var target = this.props.target;
		
		return (<div className="modal fade " id="genericDilog2" role="dialog" aria-labelledby="providerLabel" aria-hidden="true"  >
					  <div className="modal-dialog">
					    <div className="modal-content">
					      <div className="modal-header" id="header2">
					   		<button aria-label="Close" data-dismiss="modal" className="close" type="button" onClick={removeDilogBox2}><span className="icons8-delete fa-2x link" aria-hidden="true" /></button>
					        <label>{title}</label>	
					      </div>
					      <div className="modal-body">
					      	<div className="row no-margin" id="search2">
					      		<input type='text'   className="form-control form-group" placeholder="Search.."/>
					      	</div>
						      	<div id="genericPopupBody2">
						      	
								</div>
					      </div>
					      <div className="modal-footer" id="footer2">
					      		<label className="">
              						<input type='button' className="btn  btn-warning" value='OK' onClick={this.redirect2.bind(this,target)}/>
              					</label>
					      </div>
					    </div>
					  </div>
					</div>)
   }	
});


function saveSingleProperty(target,ev){ /*used for save single property (add new)*/
	if($(".dependencyDiv").find(".dependentProperties").length > 0){//object popup dialogbox ok button clicked
		
		$('#genericDilog,.modal-backdrop').remove();
	}else{//add new field is clicked
		var len = $(ev.target).parents("div").find("#genericPopupBody").find("input:text:visible").length;
		for(var i = 0;i < len;i++){
			if($(ev.target).parents("div").find("#genericPopupBody").find("input:text:visible").eq(i).attr("class").indexOf("reqfalse") == -1){
				if($(ev.target).parents("div").find("#genericPopupBody").find("input:text:visible").eq(i).val().trim() == ""){
					alert("please enter all fields data");
					return;
				}
			}
		}
		var temp = {};
		var obj = $("#propName").val();
		obj = camelize(obj);
		if($("#dataType").parent().next().find("li").eq(0).text() == $("#dataType").text()){
			alert("please select datatype");
			return;
		}
		temp[obj] = {};
		temp[obj]["description"] = $("#genericPopupBody #description").val().trim();
		temp[obj]["displayName"] = $("#genericPopupBody #dispName").val().trim();
		temp[obj]["prompt"] = $("#genericPopupBody #prompt").val().trim();
		temp[obj]["itemProp"] = $("#genericPopupBody #item_prop").val().trim();
		temp[obj]["dataType"] = {};
		temp[obj].dataType["type"] = $("#dataType").text();
		if(temp[obj].dataType["type"] == "video"){
			for(var i = 0;i < $(".media").length;i++){
				if($(".media").eq(i).is(":checked")){
					temp[obj].dataType["media"] = $(".media")[i].id;
				}
			}
			temp[obj].dataType["width"] = $("#videoWidth").val().trim();
			temp[obj].dataType["height"] = $("#videoHeight").val().trim()
		}else if(temp[obj].dataType["type"] != "object" && temp[obj].dataType["type"] != "struct"){
			temp[obj].dataType["length"] = "";
			temp[obj].dataType["helpText"] = "";
		}
		temp[obj]["required"] = $("#requiredField").is(":checked");
		temp[obj].dataType["unique"] = $("#AllowDuplicatesField").is(":checked");
		temp[obj]["defaultValue"] = $("#defaultValue").val().trim();
		
		/*used for handling 'pickList' type and 'multiPickList' type*/
		if(temp[obj].dataType["type"] == "pickList" || temp[obj].dataType["type"] == "multiPickList"){
			temp[obj]["dataType"]["options"] = [];
			var optionsData = $("#optionsDiv").find("textarea").val().trim();
			if(optionsData == ""){
				alert("please provide options");
				return;
			}
			var options = optionsData.split("\n");
			options.map(function(opt){
				if(opt.trim() != ""){
					temp[obj]["dataType"]["options"].push(opt.trim());
				}
			})
		}else if(temp[obj].dataType["type"] == "struct"){ /*used to required field validation for struct reference*/
			if($("#structReference").parent().next().find("li").eq(0).text() == $("#structReference").text()){
				alert("please select struct reference");
				return;
			}
			temp[obj]["dataType"]["structRef"]=$("#structReference").html();
			delete temp[obj]["dataType"].length;
			delete temp[obj]["dataType"].helpText;
			
		}else if(temp[obj].dataType["type"] == "image" || temp[obj].dataType["type"] == "images"){
			temp[obj]["dataType"]["thumbnailWidth"] = $("#genericPopupBody #thumbnailWidth").val();
			temp[obj]["dataType"]["thumbnailHeight"] = $("#genericPopupBody #thumbnailHeight").val();
			temp[obj]["dataType"]["width"] = $("#genericPopupBody #imgWidth").val();
			temp[obj]["dataType"]["height"] = $("#genericPopupBody #imgHeight").val();
			temp[obj]["dataType"]["radius"] = $("#genericPopupBody #imgRadious").val();
			temp[obj]["dataType"]["transfom"] = $("#genericPopupBody #imgTransform").val();
			
			
			delete temp[obj]["dataType"].length;
			delete temp[obj]["dataType"].helpText;
		}else if(temp[obj].dataType["type"] == "formula"){
			temp[obj]["dataType"]["expression"] = formulaEvaluatorField.value;
			delete temp[obj]["dataType"].length;
			delete temp[obj]["dataType"].helpText;
		}else if(temp[obj].dataType["type"] == "object"){
				if($("#objlookup").is(":checked") || $("#objchild").is(":checked")){
					if($("#reference_object").parent().next().find("li").eq(0).text() == $("#reference_object").text()){
						alert("please select reference object");
						return;
					}else{
						temp[obj]["dataType"]["refType"] = $("#objlookup").is(":checked") ? "lookup" : "child";
						temp[obj]["dataType"]["objRef"] = $("#reference_object").text();
						temp[obj]["dataType"]["refKey"] = $("#genericPopupBody #referencekey").val();
						if($("#objchild").is(":checked")){
							$("#schemaName").attr("readonly","readonly");
							temp[obj]["parentData"] = {}; 
							temp[obj]["parentData"]["relationDesc"] = [];
							temp[obj]["parentData"]["relationDesc"].push("recordId-"+$("#genericPopupBody #rel_name1").val()+"-"+Object.keys(temp)[0]);//.push($("#schemaName").val()+"-"+$("#genericPopupBody #rel_name1").val()+"-"+Object.keys(temp)[0]);
							temp[obj]["parentData"]["relationDesc"].push(Object.keys(temp)[0]+"-"+$("#genericPopupBody #rel_name2").val()+"-recordId");//.push(Object.keys(temp)[0]+"-"+$("#genericPopupBody #rel_name2").val()+"-"+$("#schemaName").val());
							temp[obj]["parentData"]["schemaName"] = $("#genericPopupBody #reference_object").text();
							temp[obj]["parentData"]["relationData"] = {};
							var rel_name = camelize($("#genericPopupBody #relationName").val().trim());
							temp[obj]["parentData"]["relationData"][rel_name] = {};
							temp[obj]["parentData"]["relationData"][rel_name]["relationRefSchema"] = schemaJSON["@id"];//  camelize2($("#schemaName").val().trim());//$("#genericPopupBody #reference_object").text();
							temp[obj]["parentData"]["relationData"][rel_name]["knownKey"] = $("#genericPopupBody #knownkey").val().trim();
							temp[obj]["parentData"]["relationData"][rel_name]["relationName"] = $("#genericPopupBody #relationName").val();
							if($("#genericPopupBody #relationView").parent().next().find("li").eq(0).text() == $("#genericPopupBody #relationView").text()){
								temp[obj]["parentData"]["relationData"][rel_name]["relationView"] = "";
							}else{
								temp[obj]["parentData"]["relationData"][rel_name]["relationView"] = $("#genericPopupBody #relationView").text();
							}
							temp[obj]["parentData"]["relationData"][rel_name]["relationRefKey"] = $("#genericPopupBody #relRefKey").val().trim();
							temp[obj]["parentData"]["relationData"][rel_name]["action"] = {}
							temp[obj]["parentData"]["relationData"][rel_name]["action"]["displayName"] = $("#genericPopupBody #actionButtonName").val().trim();
							temp[obj]["parentData"]["relationData"][rel_name]["showRelated"] = {};
							temp[obj]["parentData"]["relationData"][rel_name]["showRelated"]["displayName"] = $("#genericPopupBody #showRelatedName").val().trim();
						}
							
						if($("#LHSproperty").is(":visible")){
							var LHS = $("#LHSproperty").val().trim();
							if(LHS != ""){
								var RHS = $("#RHSproperty").val().trim();
								if(RHS != ""){
									temp[obj]["dataType"]["filterCondition"] = LHS+" = "+RHS;
									if(finalObject.hasOwnProperty(RHS)){
										finalObject[RHS]["dataType"]["dependentField"] = obj;//LHS.split(".")[0].trim();
									}
								}else{
									alert("please select "+$("#schemaName").val()+" property");
									return false;
								}
							}else{
								alert("please select property");
							}
						}
					}
				}else{
					alert("please select reference type");
					return;
				}
		}else if(temp[obj].dataType["type"] == "phone"){
			temp[obj]["mask"] = $("#mask")[0].checked;
		}else if(temp[obj].dataType["type"] == "currency"){
			temp[obj].dataType["currencyType"] = $("span#currencyType").text();
		}else if(temp[obj].dataType["type"] == "label"){
			if($("#labelText").val().trim() == ""){
				alert("please enter label text");
				return;
			}
			temp[obj]["dataType"]["labelText"] = $("#labelText").val().trim();
		}else if(temp[obj].dataType["type"] == "array"){
			if($("#eleType").parent().next().find("li").eq(0).text() == $("#eleType").text()){
				alert("please select element type");
				return;
			}
			temp[obj]["dataType"]["elements"] = {};
			if($("#eleType").text() == "label"){
				if($("#labelText").val().trim() == ""){
					alert("please enter label text");
					return;
				}
				temp[obj]["dataType"]["elements"]["labelText"] = $("#labelText").val().trim();
			}else if($("#eleType").text() == "phone"){
				temp[obj]["mask"] = $("#mask")[0].checked;
			}else if($("#eleType").text() == "currency"){
				if($("span#currencyType").parents("div").eq(0).find("ul > li").eq(0).text() == $("span#currencyType").text()){
					alert("Please Select Currency Type");
					return;
				}
				temp[obj]["dataType"]["elements"]["currencyType"] = $("span#currencyType").text();
			}else if($("#eleType").text() == "struct"){
				if($("#structReference").parent().next().find("li").eq(0).text() == $("#structReference").text()){
					alert("please select struct reference");
					return;
				}else{
					temp[obj]["dataType"]["elements"]["structRef"] = $("#structReference").text();
				}
			}else if($("#eleType").text() == "object"){
				if($("#objlookup").is(":checked") || $("#objchild").is(":checked")){
					if($("#reference_object").parent().next().find("li").eq(0).text() == $("#reference_object").text()){
						alert("please select reference object");
						return;
					}else{
						temp[obj]["dataType"]["elements"]["refType"] = $("#objlookup").is(":checked") ? "lookup" : "child";
						temp[obj]["dataType"]["elements"]["objRef"] = $("#reference_object").text();
						temp[obj]["dataType"]["elements"]["refKey"] = $("#genericPopupBody #referencekey").val();
					}
				}else{
					alert("please select reference type");
					return;
				}
			}else if($("#eleType").text() == "rating"){
    			    if($("#ratingType").text() == "Select rating type"){
                       alert("please select rating type");
                       return; 
                    }else{
                        temp[obj]["dataType"]["elements"]["ratingType"] =$("#ratingType").text();
                        if($("#ratingType").text()=="star"){
                            var best=parseInt($("#bestRatingValue").val());
                            var worst=parseInt($("#worstRatingValue").val());
                            if(best> 0 && worst> 0){
                               if(best>worst){
                                 temp[obj]["dataType"]["elements"]["best"]=parseInt($("#bestRatingValue").val());
                                 temp[obj]["dataType"]["elements"]["worst"]=parseInt($("#worstRatingValue").val());  
                               }else{
                                   alert("Best value should be grater than worst value");
                                   return;
                               }
                                
                           }else{
                               alert("Best and Worst values should be grater than zero");
                               return;
                           }
                           
                        }else{
                           temp[obj]["dataType"]["elements"]["best"]=1;
                           temp[obj]["dataType"]["elements"]["worst"]=0;
                        }
                    }
			}else if($("#eleType").text() == "pickList" || $("#eleType").text() == "multiPickList"){
				
				temp[obj]["dataType"]["elements"]["options"] = [];
				var optionsData = $("#optionsDiv").find("textarea").val().trim();
				if(optionsData == ""){
					alert("please provide options");
					return;
				}
				var options = optionsData.split("\n");
				options.map(function(opt){
					if(opt.trim() != ""){
						temp[obj]["dataType"]["elements"]["options"].push(opt.trim());
					}
				})
			}else if($("#eleType").text() == "image" || $("#eleType").text() == "images"){
				temp[obj]["dataType"]["thumbnailWidth"] = $("#genericPopupBody #thumbnailWidth").val();
				temp[obj]["dataType"]["thumbnailHeight"] = $("#genericPopupBody #thumbnailHeight").val();
				temp[obj]["dataType"]["width"] = $("#genericPopupBody #imgWidth").val();
				temp[obj]["dataType"]["height"] = $("#genericPopupBody #imgHeight").val();
				temp[obj]["dataType"]["radius"] = $("#genericPopupBody #imgRadious").val();
				temp[obj]["dataType"]["transfom"] = $("#genericPopupBody #imgTransform").val();
			}else if($("#eleType").text() == "video"){
				if(temp[obj].dataType["type"] == "array"){
					for(var i = 0;i < $(".media").length;i++){
						if($(".media").eq(i).is(":checked")){
							temp[obj].dataType["media"] = $(".media")[i].id;
						}
					}
					temp[obj].dataType["width"] = $("#videoWidth").val().trim();
					temp[obj].dataType["height"] = $("#videoHeight").val().trim()
				}
			}
			
			temp[obj]["dataType"]["elements"]["type"] = $("#eleType").text();
			delete temp[obj]["dataType"].length;
			delete temp[obj]["dataType"].helpText;
		}else if(temp[obj].dataType["type"] == "rating"){
		    if($("#ratingType").text() == "Select rating type"){
		       alert("please select rating type");
		       return; 
		    }else{
		        temp[obj]["dataType"]["ratingType"]=$("#ratingType").text();
                if($("#ratingType").text()=="star"){
                    var best=parseInt($("#bestRatingValue").val());
                    var worst=parseInt($("#worstRatingValue").val());
                    if(best> 0 && worst> 0){
                       if(best>worst){
                         temp[obj]["dataType"]["best"]=parseInt($("#bestRatingValue").val());
                         temp[obj]["dataType"]["worst"]=parseInt($("#worstRatingValue").val());  
                       }else{
                           alert("Best value should be grater than worst value");
                           return;
                       }
                        
                   }else{
                       alert("Best and Worst values should be grater than zero");
                       return;
                   }
                   
                }else{
                   temp[obj]["dataType"]["best"]=1;
                   temp[obj]["dataType"]["worst"]=0;
                }
		    }
        }else if(temp[obj].dataType["type"] == "autoNumber"){
        	if($("#an")[0].checked){
        		temp[obj]["dataType"]["autoNumberType"]="number"
        	}else{
        		temp[obj]["dataType"]["prefixFields"]=[];
        		temp[obj]["dataType"]["autoNumberType"]="propWithNumber"
        		autoNumberSpan= $("#autoNumberUL").find("span.autoNumberSpan")
				for(var an=0;an<autoNumberSpan.length;an++){
					temp[obj]["dataType"]["prefixFields"].push(autoNumberSpan.eq(an).text());
				}
        	}
        }
	
	    var x = $("#formulaEvaluatorField").val();
	    if($("#functionsDiv").find("span#formulaFunction").text() != $("#functionsDiv").find("ul li").eq(0).text()){
	    	x = x.substring($("#functionsDiv").find("span#formulaFunction").text().length+1).trim();
	    	temp[obj].dataType["formulaFunction"] = true;
	    	temp[obj].dataType["functionName"] = $("#functionsDiv").find("span#formulaFunction").text();
	    }
		var separators = [' ', '\\\+', '-', '\\\(', '\\\)', '\\*', '/', ':', '\\\?'];
		var tokens = x.split(new RegExp(separators.join('|'), 'g')); 
		for(var i = 0;i < tokens.length;i++){
		  if(tokens[i].trim() != ""){
		  	 if(tokens[i].trim().indexOf("__") != -1){
		  	 	Object.keys(relationObjects).map(function(key){
			      if(key == tokens[i].trim()){
			      	if(tokens[i].indexOf("#") == 0){
			      		if(sysProperties[tokens[i].trim().split("__")[0].split("#")[1]].dataType.type == "object"){
				      	 refProp = schemaJSON["@id"]+"."+key;//$("#schemaName").val().trim()
				      	}
			      	}else{
			      		if(finalObject[tokens[i].trim().split("__")[0]].dataType.type == "array"){
				      	refProp =  finalObject[tokens[i].trim().split("__")[0]].dataType.elements.structRef+"."+key;//camelize2(tokens[i].trim().split("__")[0])+"."+key;
				      }else if(finalObject[tokens[i].trim().split("__")[0]].dataType.type == "object"){
				      	refProp = schemaJSON["@id"]+"."+key;//$("#schemaName").val().trim()
				      }
			      	}
			      	
			      	temp[obj].dataType[key] = refProp;//camelize2($("#schemaName").val().trim())+"."+key;
			        if(relationObjects[key].dataType.type == "text"){
			          var searchWord = x.search(tokens[i]);
			          if(searchWord != -1){
			            x = x.replace(tokens[i],'"string"');
			          }
			        }else if(relationObjects[key].dataType.type == "number"){
			          var searchWord = x.search(tokens[i]);
			          if(searchWord != -1){
			            x = x.replace(tokens[i],11111);
			          }
			        }else if(relationObjects[key].dataType.type == "formula"){
			          var searchWord = x.search(tokens[i]);
			          if(searchWord != -1){
			          	if(relationObjects[key].dataType.returnType == "string"){
			          		x = x.replace(tokens[i],'"string"');
			          	}else{
			         		x = x.replace(tokens[i],11111); 	
			          	}
			          }
			        }
			      }
		   		 })
		  	 }else{
			    Object.keys(formulaObjects).map(function(key){
				      if(key == tokens[i].trim()){
				      	var schemaName;
				      	temp[obj].dataType[key] = schemaJSON["@id"]+"."+key;//camelize2($("#schemaName").val().trim())
				        if(key.indexOf("#") == 0){
				        	  x = x.replace(tokens[i],'"string"');
				        }else{
				        	if(formulaObjects[key].dataType.type == "text"){
					          var searchWord = x.search(tokens[i]);
					          if(searchWord != -1){
					            x = x.replace(tokens[i],'"string"');
					          }
					        }else if(formulaObjects[key].dataType.type == "number"){
					          var searchWord = x.search(tokens[i]);
					          if(searchWord != -1){
					            x = x.replace(tokens[i],11111);
					          }
					        }else if(formulaObjects[key].dataType.type == "formula"){
					          var searchWord = x.search(tokens[i]);
					          if(searchWord != -1){
					          		if(formulaObjects[key].dataType.returnType == "string"){
					          			x = x.replace(tokens[i],'"string"');	
					          		}else{
					          			x = x.replace(tokens[i],11111);
					          		}
					          }
					        }else if(formulaObjects[key].dataType.type == "array"){
					        	if(formulaObjects[key].dataType.elements.type == "number"){
					        		 var searchWord = x.search(tokens[i]);
							          if(searchWord != -1){
							            x = x.replace(tokens[i],11111);
							          }
					        	}else if(formulaObjects[key].dataType.elements.type == "text"){
					        		var searchWord = x.search(tokens[i]);
							          if(searchWord != -1){
							            x = x.replace(tokens[i],'"string"');
							          }
					        	}
					        }	
				        }
				        
				      }
			    })
			 }
		  }
		}
		try{
		      res = math.format(math.parser().eval(x), {
		         precision: 14
		      });
		      if(temp[obj].dataType.type == "formula"){
			      if(Number(res)){
		    		  temp[obj]["dataType"]["returnType"]="number"
		    	  }else{
		    	  	  temp[obj]["dataType"]["returnType"]="string"
		    	  }
		      }
	     }
	     catch (err) {
	        res = err.toString();
	        alert(res);
	       	return;
	      }
	   
		formulaObjects[Object.keys(temp)[0]]=temp[Object.keys(temp)[0]];
		console.log(temp);
		$('#genericDilog,.modal-backdrop').remove();
		header="";
		if(!finalObject.hasOwnProperty(Object.keys(temp)[0])){
			var div = document.createElement("div");
	    	$(div).attr("class","newFieldClass");
	    	
		    if($(".newFieldClass:last")[0]){
		    	$(".newFieldClass:last").after(div);
		    }else if($(".schemaRow")[0]){
		    	$(document.getElementById("schemaObjRow").children[0].lastChild).after(div);
		    }else{
		    	$("#schemaObjRow").append(div);
		    	header="none";
		    }
	    }
	    
	    if(finalObject.hasOwnProperty(Object.keys(temp)[0])){
	    	if(target == ""){
	    		target = $("#schemaObjRow").find("input:radio:visible.identifier#"+Object.keys(temp)[0]).parents("div.row")[0];
	    	}
	    	target.innerHTML = "";
	    	ReactDOM.render(<DisplayObject  header={header} schemaUniqueObject = {temp} />,target);
	    }else{
	    	ReactDOM.render(<DisplayObject  header={header} schemaUniqueObject = {temp} />,$(".newFieldClass:last")[0]);  
	    }
		finalObject = mergeRecursive(finalObject,temp);
		var checkbox = $("#schemaObjRow").find("input:checkbox");
		for(var i = 0;i < checkbox.length;i++){
		  if($(checkbox).eq(i).attr("name") == Object.keys(temp)[0]){
		    $(checkbox).eq(i).attr({"checked":"true"});
		  }
		}
	}
}

function removeDilogBox(){
	$('#genericDilog,.modal-backdrop').remove();
}

exports.removeDilogBox= removeDilogBox;

function removeDilogBox2(){
	$('#genericDilog2,.modal-backdrop').remove();
}
exports.removeDilogBox2= removeDilogBox2;

 var AddViewPopup = React.createClass({
 	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForSchema") };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	componentDidMount:function(){
		ActionCreator.getDefinition("HelpTextForSchema");
		DefinitionStore.addChangeListener(this._onChange);
		
		 $("#viewInputUL,#viewOutputUL").sortable({
		 	revert: true
		});
		 var obj = this.props.obj;
		 var edit = this.props.edit;
		 if(edit){
		 	$("#viewName").val(obj.viewName).attr("disabled","disabled");
		 	$("#viewInputUL")[0].innerHTML = "";
			for(var i = 0;i < obj.key.length;i++){
				count--;
				var li = document.createElement("li");
				$(li).attr("id",("inputView"+count));
				$("#viewInputUL").append(li);
				target=$("li#inputView"+count)[0]
				ReactDOM.render(<ViewInputOutputComponent data={obj.key[i]} edit={"edit"} type={"input"}/>,target);
			}
			$("#viewOutputUL")[0].innerHTML = "";
			for(var i = 0;i < obj.value.length;i++){
				count--;
				var li = document.createElement("li");
				$(li).attr("id",("outputView"+count));
				$("#viewOutputUL").append(li);
				target=$("li#outputView"+count)[0]
				ReactDOM.render(<ViewInputOutputComponent data={obj.value[i]} edit={"edit"} type={"output"}/>,target);
			}
		 }
	},
	checkViewFirstChar : function(ev){
		var regex=new RegExp("^[a-zA-Z]");
		var viewName = $("#viewName").val().trim();
		if(!regex.test(viewName)){
			alert("first character must be an alphabetr");
				$("#viewName").val("");
				return false;
		}
		var viewName1 = camelize(viewName);
		views.map(function(obj){
			if(obj.viewName==viewName1){
				alert("duplicate views names are not allowed");
				$("#viewName").val("");
				return false;
			}
		})
	},
	render : function(){
		var self=this;
		return (
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="row margin-bottom-gap remove-margin-left remove-margin-right" id="viewDiv">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>VIEW NAME</span>
							 {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["AddViewName"]!=""){
										classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
										textValue=self.state.helpText["AddViewName"];
									}
									return(<div className={classNames}>{textValue}</div>)
									
								})
							}
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 no-padding-left no-padding-right" >
							 <input type='text' id="viewName"  className="form-control form-group" placeholder="enter view name" onBlur={this.checkViewFirstChar}/>
						</div>
					</div>
					
					<div className="row margin-bottom-gap remove-margin-left remove-margin-right" id="inputDiv">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>INPUT</span>
							  {
									["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["AddViewInput"]!=""){
											classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
											textValue=self.state.helpText["AddViewInput"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							 }
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding-left" >
							<ul id="viewInputUL" className="row list-unstyled remove-margin-left">
	                           	<li className="margin-bottom-gap-sm">
		                           	<div style={{position:'relative'}}>
		                           		
			                           	<button type="button" className="btn btn-default dropdown-toggle  form-control no-margin " style={{width:"85%"}} data-toggle="dropdown">
					                     	<span data-bind="label" >Select Input</span>
					                    </button>
					                    <ul className="dropdown-menu scrollable-menu col-lg-10 col-md-10 col-sm-10 col-xs-10 no-padding-left " role="menu">
				                           	<li><span >Select Input</span></li>
				                           	{ 
				                           		Object.keys(finalObject).map(function(obj){
				                           			if($.type(finalObject[obj]) == "object"){
				                           				if(finalObject[obj].dataType.type != "array" && finalObject[obj].dataType.type != "struct" && finalObject[obj].dataType.type != "image"){
				                           					return <li><span onClick={selectInputOutput.bind(this,obj,"input")}>{obj}</span></li>
				                           				}
				                           			}
				                           		},this) 	 
				                           	}
			                          	</ul>
			                          
				                        <i  className="fa fa-arrows-v  border-none link special-padding-left"></i>
	 		                           	<div className=" link col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left  form-group" style={{"font-size":"12px"}}  onClick={removeLI}>Remove</div>
									</div>
                          		</li>
                          	</ul>
                          	<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
                          		<label >
              						<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={addInputOutput.bind(this,"input")}/>
              					</label>
              				</div>
						</div>
					</div>
					
					<div className="row margin-bottom-gap remove-margin-left remove-margin-right" id="outputDiv">
						<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left" >
							 <span>OUTPUT</span>
							  {
									["a"].map(function(temp){
										var classNames="hidden helpText";
										var textValue="";
										if(self.state.helpText && self.state.helpText["AddViewOutput"]!=""){
											classNames="col-lg-12  col-md-12 col-xs-12 col-sm-12 no-padding helpText"; 
											textValue=self.state.helpText["AddViewOutput"];
										}
										return(<div className={classNames}>{textValue}</div>)
										
									})
							  }
						</div>
						<div className="col-lg-7 col-md-7 col-xs-7 col-sm-7 form-group no-padding-left" >
							<ul id="viewOutputUL" className="row list-unstyled remove-margin-left">
	                           	<li className="margin-bottom-gap-sm">
	                           	<div style={{position:'relative'}}>
		                           	<button type="button" className="btn btn-default dropdown-toggle form-control no-margin" style={{width:"85%"}} data-toggle="dropdown">
				                     	<span data-bind="label" >Select Output</span>
				                    </button>
				                    <ul className="dropdown-menu scrollable-menu col-lg-10  col-md-10 col-sm-10 col-xs-10 no-padding-left " role="menu">
			                           	<li><span >Select Output</span></li>
			                           	{ 
			                           		Object.keys(finalObject).map(function(obj){
			                           			if($.type(finalObject[obj]) == "object"){
			                           				if(finalObject[obj].dataType.type != "array" && finalObject[obj].dataType.type != "struct"){
			                           					return <li><span onClick={selectInputOutput.bind(this,obj,"output")}>{obj}</span></li>
			                           				}
			                           			}
			                           		},this) 	 
			                           	}
		                          	</ul>
			                         <i  className="fa fa-arrows-v special-padding-left border-none link"></i>
			                         	<div className=" link col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left  form-group" style={{"font-size":"12px"}}  onClick={removeLI}>Remove</div>
                          		</div>
                          		</li>
                          	</ul>
                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left ">
                          		<label >
              						<input type='button' className="btn  btn-warning upload-drop-zone" value='ADD' onClick={addInputOutput.bind(this,"output")}/>
              					</label>
              				</div>
						</div>
					</div>
	         	</div>
		)
	}
})

function saveView(target,ev){
	var viewName = camelize($("#viewName").val().trim());//$("#viewName").val().trim();
	if(viewName != ""){
		$("#filterKeysDiv").css('display','block');
		var inputLen = $("#viewInputUL")[0].children.length;
		var inputArray = [];
		var multipick=[]
		for(var i = 0;i < inputLen;i++){
			if($("#viewInputUL")[0].children[i].querySelector('span').textContent.toLowerCase() != "select input"){
				inputArray.push($("#viewInputUL")[0].children[i].querySelector('span').textContent);
				if(finalObject[$("#viewInputUL")[0].children[i].querySelector('span').textContent]){
					if(finalObject[$("#viewInputUL")[0].children[i].querySelector('span').textContent].dataType.type == "multiPickList"){
						multipick.push($("#viewInputUL")[0].children[i].querySelector('span').textContent);
					}
				}
			}else{
				alert("please select input");
				return;
			}
		}
		console.log(inputArray);
		var outputLen = $("#viewOutputUL")[0].children.length;
		var outputArray = [];
		for(var i = 0;i < outputLen;i++){
			if($("#viewOutputUL")[0].children[i].querySelector('span').textContent.toLowerCase() != "select output"){
				outputArray.push($("#viewOutputUL")[0].children[i].querySelector('span').textContent);
			}else{
				alert("please select output");
				return;
			}
		}
		console.log(outputArray);
		var viewObject = {};
		viewObject["viewName"] = viewName;
		viewObject["key"] = inputArray;
		viewObject["value"] = outputArray;
		viewObject["multipick"] = multipick;
		
		
		for(var i=0;i<views.length;i++){
			if(views[i]["viewName"]==viewName){
				views[i]=viewObject;
				break;
			}
			if(i == views.length-1){
				views.push(viewObject);
			}
		}
		if(views.length ==0){
			views.push(viewObject);
		}
		console.log(views);
		var views1 = JSON.parse(JSON.stringify(views));
		
		
		/*var viewsLength = views1.length;
		for(var i = 0;i < viewsLength;i++){
			if(views1[i].viewName == "summary"){
				if(views1[i].key[0] == "org"){
					$("input:text#filterKeys").val(views1[i].key.splice("1",views1[i].key.length));
					break;
				}else{
					$("input:text#filterKeys").val(views1[i].key);
					break;
				}
			}
		}*/
		
		$('#genericDilog,.modal-backdrop').remove();
		ReactDOM.unmountComponentAtNode(document.getElementById('viewObjRow'));
		schemaJSON["@views"] = views;	
		ReactDOM.render(<DisplayView  views ={views} />,document.getElementById('viewObjRow'));
	}else{
		alert("please enter view name");
		return;
	}
}

function addInputOutput(type,filledData,ev){
	if(type == "input"){
		id = "viewInputUL";
	}else if(type == "output"){
		id = "viewOutputUL";
	}else if(type == "layout"){
		id = "layoutUL";
	}
	var inputLen = $("#"+id).children().length;
	for(var i = 0;i < inputLen;i++){
		if($("#"+id).children().eq(i).find("button span").text().toLowerCase() == "select "+type){
			alert("please select "+(i + 1)+" level "+type);
			return;
		}
	}
	count--;
	var li = document.createElement("li");
	var target;
	if(type == "input"){
		$(li).attr("id",("inputView"+count));
		$(li).attr("class","margin-bottom-gap-sm");
		$("#viewInputUL").append(li);
		target=$("#inputView"+count)[0];
		ReactDOM.render(<ViewInputOutputComponent  type={type} />,target);
	}else if(type == "output"){
		$(li).attr("id",("outputView"+count));
		$(li).attr("class","margin-bottom-gap-sm");
		$("#viewOutputUL").append(li);
		target=$("#outputView"+count)[0];
		ReactDOM.render(<ViewInputOutputComponent  type={type} />,target);
	}else if(type == "layout"){
		$(li).attr("id",("layout"+count));
		$(li).attr("class","margin-bottom-gap-sm");
		//$("#layoutUL").append(li);
		$(ev.target).parents("div").eq(1).find(".layoutUL").append(li);
		target=$("#layout"+count)[0];
		ReactDOM.render(<ViewInputOutputComponent  type={type} filledData={filledData}/>,target);
	}
}

function selectInputOutput(input,type,ev){
	if(type == "input"){
		var len = $("#viewInputUL")[0].children.length;
		for(var i = 0;i < len;i++){
			if($("#viewInputUL").find("button").eq(i).find("span").text() == input){
				alert(input+" already selected");
				return;
			}
		}
	}else if(type == "output"){
		var len = $("#viewOutputUL")[0].children.length;
		for(var i = 0;i < len;i++){
			if($("#viewOutputUL").find("button").eq(i).find("span").text() == input){
				alert(input+" already selected");
				return;
			}
		}
	}else if(type == "layout"){
		var len = $(ev.target).parents('.layoutUL')[0].children.length;
		for(var i = 0;i < len;i++){
			if($(ev.target).parents('.layoutUL').find("button").eq(i).find("span").text() == input){
				alert(input+" already selected");
				return;
			}
		}
	}
	$(ev.target).parents("ul").eq(0).siblings(0).find("span").text(input);
}

var ViewInputOutputComponent = React.createClass({
	componentDidMount:function(){
		if(this.props.edit){
			var data = this.props.data;
			$(this.getDOMNode()).find("button span").html(data);
			if($("#operationsDiv #opType").text() == "read"){
				if(data.indexOf("#") != -1){
					$(this.getDOMNode()).find("button span").html(data.split("#")[1]);
				}else if(data.indexOf("$") != -1){
					$(this.getDOMNode()).find("button span").html(data.split("$")[1]);
				}
			}
		}
	},
	render : function(){
		var type=this.props.type;
		var localData;
		if(this.props.filledData){
			localData = this.props.filledData 
		}else{
			localData = finalObject;
		}
		return (<div style={{position:'relative'}}>
						<button type="button" className="btn btn-default dropdown-toggle form-control no-margin" style={{width:"85%"}} data-toggle="dropdown">
	                     	<span data-bind="label">{"Select "+type }</span>
	                    </button>
	                    <ul className="dropdown-menu scrollable-menu col-lg-10  col-md-10 col-xs-10 col-sm-10  no-padding-left " role="menu">
		                   	<li><span className='layout'>Select Input</span></li>
		                   	{ 
		                   		Object.keys(localData).map(function(obj){
		                   			if($.type(localData[obj]) == "object"){
		                   				if(type == "input"){
				                           	if(localData[obj].dataType.type != "array" && localData[obj].dataType.type != "struct"  && finalObject[obj].dataType.type != "image"){
			                   					return <li><span onClick={selectInputOutput.bind(this,obj,type)}>{obj}</span></li>
			                   				}
		                   				}else if(type == "output"){
		                   					if(localData[obj].dataType.type != "array" && localData[obj].dataType.type != "struct"){
			                   					return <li><span onClick={selectInputOutput.bind(this,obj,type)}>{obj}</span></li>
			                   				}
		                   				}else if(type == "layout"){
			                   				return <li><span onClick={selectInputOutput.bind(this,obj,type)}>{obj}</span></li>
		                   				}
		                   				
		                   			}
		                   		},this) 	 
		                   	}
	              		</ul>
              		
              		<i  className="fa fa-arrows-v  border-none link special-padding-left"></i>
              			<div className=" link col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left  form-group" style={{"font-size":"12px"}}  onClick={removeLI}>Remove</div>		
               	</div>
               )}
})

function removeLI(ev){
	if($(ev.target).parents("ul")[0].children.length > 1){
		$(ev.target).parents('li')[0].remove();
	}else{
		alert("Atleast one property must be selected");
	}
}

var DisplayView = React.createClass({
	editView : function(obj,ev){
		getPopupContent("Add View","","ok","","saveView");
		ReactDOM.render(<AddViewPopup edit={"edit"} obj={obj} ok={"ok"} />,document.getElementById('genericPopupBody'));
	},
	render : function(){
		var views=this.props.views;
		editView = this.editView;
		return (<div>
	         	   {
		         	   views.map(function(obj){
		         	   	return(
		         	   		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left viewRow" onClick={this.editView.bind(this,obj)}>
		            	   		<span className={"fieldText no-padding-left link link-btn "} >{obj.viewName}</span>
		        	   		</div>
		        	   		)
		         	   })
					}
              	</div>)}
})

function fillMultidialogBoxData(target,ev){
	var checkBoxLen = $("#genericPopupBody2").find("input:checkbox").length;
	if(!$("#genericPopupBody2").find("input:checkbox.property:checked")[0]){
		alert("please select atleast one property");
		return;	
	}
	var props = [];
	for(var i = 0;i < checkBoxLen;i++){
		if($("#genericPopupBody2").find("input:checkbox")[i].checked){
			props.push($("#genericPopupBody2").find("input:checkbox")[i].id);
		}
	}
	target.value=props;
	$('#genericDilog2,.modal-backdrop').remove();
}

function saveOperation(target,ev){
	if($("#genericPopupBody #opType").text() == $("#genericPopupBody #opType").parents("div").eq(0).find("ul li").eq(0).text()){
		alert("please select Operation Type");
		return;
	}
	if($("#viewType").is(":visible")){
		if($("#viewType").text() != "summaryView"){
			if($("#genericPopupBody #opName").val().trim() == "" && $("#genericPopupBody #opType").text() != "actions" && $("#genericPopupBody #opType").text() != "relations"){
				alert("please enter operation name");
				return;
			}
		}
	}
	
	schemaJSON.hasOwnProperty("@operations") ? schemaJSON["@operations"] = schemaJSON["@operations"] : schemaJSON["@operations"] = {};
	schemaJSON["@operations"][$("#opType").text()] ? schemaJSON["@operations"][$("#opType").text()] = schemaJSON["@operations"][$("#opType").text()] : schemaJSON["@operations"][$("#opType").text()] = {};
	
	var opname =$("#operationsDiv #opName").val().trim();
		
	if($("#genericPopupBody #opType").text() == "create"){
		if($("#genericPopupBody #inprops").val().trim() == ""){
			alert("please select IN Properties");
			return;
		}
		
		schemaJSON["@operations"]["create"][opname] = {};
		schemaJSON["@operations"]["create"][opname]["in"] = [];
		$("#operationsDiv #inprops").val().split(",").map(function(key){
			schemaJSON["@operations"]["create"][opname]["in"].push(key)
		})
	}else if($("#genericPopupBody #opType").text() == "update"){
		if($("#genericPopupBody #inprops").val().trim() == ""){
			alert("please select Update Properties");
			return;
		}
		schemaJSON["@operations"]["update"][opname] = {};
		schemaJSON["@operations"]["update"][opname]["in"]=["id"];
		schemaJSON["@operations"]["update"][opname]["out"]=["id"];
		schemaJSON["@operations"]["update"][opname]["update"]=[];
		$("#operationsDiv #inprops").val().split(",").map(function(key){
				schemaJSON["@operations"]["update"][opname]["update"].push(key);
		})
	}else if($("#genericPopupBody #opType").text() == "actions"){
		if($("#genericPopupBody .actionName").val().trim() == ""){
			alert("please enter action name");
			return;
		}
		
		schemaJSON["@operations"]["actions"][$("#genericPopupBody .actionName").val().trim()] = {};
		schemaJSON["@operations"]["actions"][$("#genericPopupBody .actionName").val().trim()]["trigger"] = $("#operationsDiv #actionTrigger").val().trim();
		schemaJSON["@operations"]["actions"][$("#genericPopupBody .actionName").val().trim()]["displayName"] = $("#operationsDiv #actionDisplayName").val().trim();

	}else if($("#genericPopupBody #opType").text() == "relations"){
		if($("#operationsDiv .relMethodName").val().trim() == ""){
			alert("please enter relation method name ");
			return;
		}
		if($("#operationsDiv .relName").val().trim() == ""){
			alert("please select relation name");
			return;
		}
		schemaJSON["@operations"]["relations"][$("#operationsDiv .relMethodName").val().trim()] = {};
		schemaJSON["@operations"]["relations"][$("#operationsDiv .relMethodName").val().trim()]["relation"]=$("#operationsDiv .relName").val().trim();
		
	}else if($("#genericPopupBody #opType").text() == "read"){
		if($("#viewType").text() != "summaryView"){
			if($("#operationsDiv #inprops").val().trim() == ""){
				alert("please select out params");
				return;
			}
		}
		
		if($("#viewType").text() != "summaryView"){
			schemaJSON["@operations"]["read"][opname] = {};
			schemaJSON["@operations"]["read"][opname]["in"] = ["id"];
			schemaJSON["@operations"]["read"][opname]["out"] = [];
			$("#operationsDiv #inprops:visible").val().trim().split(",").map(function(outparam){
				schemaJSON["@operations"]["read"][opname]["out"].push(outparam);
			})
			schemaJSON["@operations"]["read"][opname]["UILayout"] = [];
			schemaJSON["@operations"]["read"][opname]["viewType"] = $("#viewType").text();
		}else{
			schemaJSON["@operations"]["read"]["getSummary"] = {};
			schemaJSON["@operations"]["read"]["getSummary"]["viewType"] = $("#viewType").text();
		}
		uiLayouts = $("#uiLayoutPropsDiv .readRow");
		for(var i=0;i<uiLayouts.length;i++){
			if($("#operationsDiv .uilayout").eq(i).text() == $("#operationsDiv .uilayout").eq(i).parents("div").eq(0).find("ul li").eq(0).text()){
				alert("please select layout");
				return;
			}
			var temp = {};
			temp["type"] = $("#uiLayoutPropsDiv .readRow").eq(i).find(".uilayout").text();
			if(temp["type"] == "generic"){
				var layoutLen = uiLayouts.eq(i).find(".layoutUL")[0].children.length;
				var layoutArray = [];//,layoutArray2 =[];
				for(var j = 0;j < layoutLen;j++){
					if(uiLayouts.eq(i).find(".layoutUL")[0].children[j].querySelector('span').textContent.toLowerCase() != "select layout"){
						layoutArray.push(uiLayouts.eq(i).find(".layoutUL")[0].children[j].querySelector('span').textContent);
					}else{
						alert("please select layout "+(j+1)+" props in uilayout "+(i+1));
						return;
					}
				}
				
				temp["layout"] = layoutPropertPrefiex(layoutArray,schemaJSON["@operations"]);
				if($("#viewType").text() == "summaryView"){
					schemaJSON["@operations"]["read"]["getSummary"]["UILayout"] = {};
					schemaJSON["@operations"]["read"]["getSummary"]["UILayout"] = temp;
				}else{
					schemaJSON["@operations"]["read"][opname]["UILayout"].push(temp);
				}
				
			}else if(temp["type"] == "columns"){
				var layoutArray = [];
				temp["layout"]=[];//,layoutArray2 =[];
				for(var d = 0 ;d< uiLayouts.eq(i).find("#uiLayoutDiv")[0].children.length;d++){
					var layoutLen = $(uiLayouts.eq(i).find("#uiLayoutDiv")[0].children[d]).find(".firstColumn")[0].children.length;
					layoutArray = [];
					for(var j = 0;j < layoutLen;j++){
						if($(uiLayouts.eq(i).find("#uiLayoutDiv")[0].children[d]).find(".firstColumn")[0].children[j].querySelector('span').textContent.toLowerCase() != "select layout"){
							layoutArray.push($(uiLayouts.eq(i).find("#uiLayoutDiv")[0].children[d]).find(".firstColumn")[0].children[j].querySelector('span').textContent);
						}else{
							alert("please select layout "+(j+1)+" props in uilayout "+(i+1));
							return;
						}
					}
					temp["layout"].push(layoutPropertPrefiex(layoutArray,schemaJSON["@operations"]));
				}
				schemaJSON["@operations"]["read"][opname]["UILayout"].push(temp);
			}else if(temp["type"] == "banner"){
				for(var z = 0;z< uiLayouts.eq(i).find("input:text").length;z++){
					if(uiLayouts.eq(i).find("input:text").eq(z).val().trim() == ""){
						alert("please select all fields");
						return;
					}
				}
				temp["layout"] = {};
				temp["layout"]["coverImage"] = uiLayouts.eq(i).find("input:text.coverImageFld").val().trim();
				temp["layout"]["profileImage"] = uiLayouts.eq(i).find("input:text.profileImageFld").val().trim();
				temp["layout"]["overlay"] = {};
				temp["layout"]["overlay"]["header"] = uiLayouts.eq(i).find("input:text.headerFld").val().trim();
				temp["layout"]["overlay"]["subHeader"] = uiLayouts.eq(i).find("input:text.subHeaderFld").val().trim();
				schemaJSON["@operations"]["read"][opname]["UILayout"].push(temp);
			}else if(temp["type"] == "tabs"){
				temp["layout"] = {};
				for(var s=0;s<uiLayouts.eq(i).find(".tabsLayoutDiv").length;s++){
					if(uiLayouts.eq(i).find(".tabsLayoutDiv").eq(s).find("input:text").eq(0).val().trim() != ""){
						if(uiLayouts.eq(i).find(".tabsLayoutDiv").eq(s).find("input:text").eq(1).val().trim() != ""){
							var obj = camelize(uiLayouts.eq(i).find(".tabsLayoutDiv").eq(s).find("input:text").eq(0).val().trim());
							temp["layout"][obj] = {};
							temp["layout"][obj]["displayName"] = uiLayouts.eq(i).find(".tabsLayoutDiv").eq(s).find("input:text").eq(0).val().trim();
							temp["layout"][obj]["properties"] = [];
							uiLayouts.eq(i).find(".tabsLayoutDiv").eq(s).find("input:text").eq(1).val().trim().split(",").map(function(key){
								temp["layout"][obj]["properties"].push(key);
							})
						}else{
							alert("please select properties");
							return;
						}
					}else{
						alert("please enter display name");
						return;
					}
				}
				schemaJSON["@operations"]["read"][opname]["UILayout"].push(temp);
				temp= {};
			}else if(temp["type"] == "gallery"){
				schemaJSON["@operations"]["read"]["getSummary"] = {};
				var layoutLen = uiLayouts.eq(i).find(".layoutUL")[0].children.length;
				var layoutArray = [];
				for(var j = 0;j < layoutLen;j++){
					if(uiLayouts.eq(i).find(".layoutUL")[0].children[j].querySelector('span').textContent.toLowerCase() != "select layout"){
						layoutArray.push(uiLayouts.eq(i).find(".layoutUL")[0].children[j].querySelector('span').textContent);
					}else{
						alert("please select layout "+(j+1)+" props");
						return;
					}
				}
				if($("#galleryColumnFld").val().trim() == ""){
					alert("please enter column count");
					return;
				}
				temp["layout"] = layoutPropertPrefiex(layoutArray,schemaJSON["@operations"]);
				schemaJSON["@operations"]["read"]["getSummary"]["UILayout"]={};
				schemaJSON["@operations"]["read"]["getSummary"]["UILayout"] =  temp;
				schemaJSON["@operations"]["read"]["getSummary"]["UILayout"]["columnNo"] = $("#galleryColumnFld").val().trim();
			}else if(temp["type"] == "card"){
				for(var m = 0 ;m < $("#cardLayoutPropsDiv").find("input:text").length;m++){
					if($("#cardLayoutPropsDiv").find("input:text").eq(i).val().trim() == ""){
						alert("please select all fields");
						return;
					}
				}
				temp["layout"]={};
				schemaJSON["@operations"]["read"]["getSummary"] = {};
				schemaJSON["@operations"]["read"]["getSummary"]["UILayout"]={};
				temp["layout"]["profileImage"] = $("#cardLayoutPropsDiv #cardProfileImgFld").val().trim();
				temp["layout"]["name"] = $("#cardLayoutPropsDiv #cardNameFld").val().trim();
				temp["layout"]["address"] = $("#cardLayoutPropsDiv #cardAddressFld").val().trim();
				temp["layout"]["images"] = $("#cardLayoutPropsDiv #cardImagesFld").val().trim();
				temp["layout"]["about"] = $("#cardLayoutPropsDiv #cardAboutFld").val().trim();
				schemaJSON["@operations"]["read"]["getSummary"]["UILayout"] = temp;
			}
		}
	}else if($("#genericPopupBody #opType").text() == "delete"){
		schemaJSON["@operations"].hasOwnProperty("delete") ? schemaJSON["@operations"].delete :	schemaJSON["@operations"]["delete"] = {};
		var temp = {};
		temp["trigger"] = $("#deleteTrigger").val().trim();
		temp["displayName"] = $("#deleteDisplayName").val().trim();
		schemaJSON["@operations"]["delete"]["delete"] = temp;
		
		temp = {};
		temp["trigger"] = $("#undeleteTrigger").val().trim();
		temp["displayName"] = $("#undeleteDisplayName").val().trim();
		schemaJSON["@operations"].delete["unDelete"] = temp;
		
		temp = {};
		temp["trigger"] = $("#harddeleteTrigger").val().trim();
		temp["displayName"] = $("#harddeleteDisplayName").val().trim();
		schemaJSON["@operations"].delete["HardDelete"] = temp;
		
	}
	
	var displayName;
	if($("#genericPopupBody #opType").text() == "actions"){
		displayName = $("#genericPopupBody .actionName").val().trim();
	}else if($("#genericPopupBody #opType").text() == "relations"){
		displayName = $("#genericPopupBody .relMethodName").val().trim();
	}else if($("#viewType").text() == "summaryView" && ($("#genericPopupBody #uilayout").text() == "gallery" || $("#genericPopupBody #uilayout").text() == "card" || $("#genericPopupBody #uilayout").text() == "generic")){
		displayName = "getSummary";
	}else if($("#genericPopupBody #opType").text() == "delete"){
		displayName = $("#deleteDisplayName").val().trim();
	}else{
		displayName = $("#operationsDiv #opName").val()
	}
	if(target){
		target.innerHTML="";
		ReactDOM.render(<AddOperationToUI  opData={schemaJSON["@operations"][$("#opType").text()]} target={div} dispName={displayName}/>,target);
	}else if($("#viewType").data("target")){
		$("#viewType").data("target").innerHTML="";
		ReactDOM.render(<AddOperationToUI  opData={schemaJSON["@operations"][$("#opType").text()]} target={div} dispName={displayName}/>,$("#viewType").data("target"));
		$("#viewType").removeData("target");
	}else{
		var div = document.createElement("div");
    	$(div).attr("class","col-lg-12 col-md-12 col-sm-12 col-xs-12 opertionRow");
    	$("#operationsRow #"+$("#genericPopupBody #opType").text()).css("display","block");
    	$("#operationsRow #"+$("#genericPopupBody #opType").text()).append(div);
    	ReactDOM.render(<AddOperationToUI  opData={schemaJSON["@operations"][$("#opType").text()]} target={div} dispName={displayName}/>,div);
	}
	$('#genericDilog,.modal-backdrop').remove();
	console.log(schemaJSON);
}

function layoutPropertPrefiex(layoutArray,json){
	for(var p=0;p<layoutArray.length;p++){
		if(json.hasOwnProperty("actions")){
			for(var x=0;x<Object.keys(json.actions).length;x++){
				if(layoutArray[p] == Object.keys(json.actions)[x]){
					layoutArray[p]="#"+layoutArray[p];
				}
			}
		}
		if(json.hasOwnProperty("update")){
			for(var x=0;x< Object.keys(json.update).length;x++){
				if(layoutArray[p] == Object.keys(json.update)[x]){
					layoutArray[p]="#"+layoutArray[p];
				}
			}
		}
		if(schemaJSON.hasOwnProperty("@relations")){
			for(var x=0;x< Object.keys(schemaJSON["@relations"]).length;x++){
				if(layoutArray[p] == Object.keys(schemaJSON["@relations"])[x]){
					layoutArray[p]="$"+layoutArray[p];
				}
			}
		}
	}
	return layoutArray;
}
var AddOperationToUI = React.createClass({
	editOperation : function(target,opType,ev){
		var localVar;
		if(this.props.editOpName){
			localVar = this.props.editOpName
		}else{
			localVar = opType;
		}
		var opData = this.props.opData[$(ev.target).text()];
		var deleteData;
		deleteData = this.props.opData; 
		var operations = ["create","update","actions","relations","delete","read"];
		$('#genericDilog,.modal-backdrop').remove();
		getPopupContent("Add Operation","","ok",$(ev.target).parent().parent()[0],"addOperation");
		ReactDOM.render(<AddOperationsPopup editPropName={$(ev.target).text()} operations={operations} ok={"ok"} name = {name} type = {type} opData={opData} deleteData = {deleteData} opType={localVar} target={$(ev.target).parent().parent()[0]} edit={true}/>,document.getElementById('genericPopupBody'));
	},
	render : function(){
		return(
			<div className="no-margin">
				<span className="fieldText no-padding-left link link-btn" onClick={this.editOperation.bind(this,this.props.target,$("#opType").text())}>{this.props.dispName}</span>
			</div>
		)
	}
})

function saveState(target,ev){
	if($("#stateName").text().trim() == $("#stateName").parents("div:eq(0)").find("ul li").eq(0).text()){
		alert("please select State Name");
		return;
	}
	schemaJSON["@state"] ? schemaJSON["@state"] : schemaJSON["@state"] = {};
	var stateName = $("#stateName").text().trim();
	schemaJSON["@state"][stateName] ? schemaJSON["@state"][stateName] : schemaJSON["@state"][stateName] = {};
	var len = $("#stateActionDiv").children().length;
	for(var i = 0;i < len;i++){
		if($("#stateActionDiv").children().eq(i).find("span.stateActionNameSpan").text() != $("#stateActionDiv").children().eq(i).find("ul li").eq(0).text()){
			schemaJSON["@state"][stateName][$("#stateActionDiv").children().eq(i).find("span.stateActionNameSpan").text()] = [];
			var stateCondLen =$("#stateActionDiv").children().eq(i).find("#stateConditionsDiv").find("input:text.stateCondition").length;
			for(j=0;j<stateCondLen;j++){
				var temp = {};
				temp["condition"] = $("#stateActionDiv").children().eq(i).find("#stateConditionsDiv").find("input:text.stateCondition").eq(j).val().trim();
				temp["state"] =$("#stateActionDiv").children().eq(i).find("#stateConditionsDiv").find("span.destinationState").eq(j).text().trim();
				
				if(temp["state"] == $("#stateActionDiv").children().eq(i).find("#stateConditionsDiv").find("span.destinationState").eq(j).parents("div:eq(0)").find("ul li").eq(0).text()){
					alert("please enter destination state");
					return;
				}
				schemaJSON["@state"][stateName][$("#stateActionDiv").children().eq(i).find("span.stateActionNameSpan").text()].push(temp);
				$("#intialStateDiv").css('display','block');
			}
		}else{
			alert("please select action");
			return;
		}
	}
	console.log(schemaJSON["@state"]);
	$('#genericDilog,.modal-backdrop').remove();
	ReactDOM.unmountComponentAtNode(document.getElementById('stateRow'));	
	ReactDOM.render(<DisplayState  state ={schemaJSON["@state"]} />,document.getElementById('stateRow'));
}

function saveNavView(target,ev){
    if($("#navViewName").val().trim() == ""){
        alert("please enter navView name");
        return;
    }
    schemaJSON["@navViews"] ? schemaJSON["@navViews"] : schemaJSON["@navViews"] = [];
    var temp={};
    temp.navName = $("#navViewName").val().trim();
    var filterDivs=$("#filtersDiv .filtersRow");
    temp.filters={};
    for(var i = 0;i < filterDivs.length;i++){
        if($(filterDivs[i]).find("div.filtersRowMain").find("input:checkbox").prop("checked")){
            var header=$(filterDivs[i]).find("div.filtersRowMain").find("input:checkbox").attr("name");
            temp.filters[header]=[];
            var selInputs=$(filterDivs[i]).find("div.filtersRowSub").find("input:checkbox:checked");
            selInputs.map(function(index,dataInp){
                temp.filters[header].push(dataInp.name);
            });
        }
    }
    var uniqueIndex;
    schemaJSON["@navViews"].map(function(dataJson,index){
        if(schemaJSON["@navViews"][index].navName==temp.navName){
           uniqueIndex=index
        }
    });
    if(uniqueIndex!=undefined){
        schemaJSON["@navViews"][uniqueIndex].filters=temp.filters;
    }else{
        schemaJSON["@navViews"].push(temp);
    }
    $('#genericDilog,.modal-backdrop').remove();
    ReactDOM.unmountComponentAtNode(document.getElementById('navViewRow'));  
    ReactDOM.render(<DisplayNavView  navView ={schemaJSON["@navViews"]} />,document.getElementById('navViewRow')); 
}

function saveShowRelated(target,ev){
    if($("#showRelationName").val().trim() == ""){
        alert("please enter relation name");
        return;
    }
    var condition=$("#conditionType").text();
    var relationType=camelize($("#relationType").text());
    if(condition=="Select Condition"){
        alert("Please "+condition);
        return;
    }
    if(relationType=="Select Type"){
        alert("Please "+relationType);
        return;
    }
    schemaJSON["@showRelated"] ? schemaJSON["@showRelated"] : schemaJSON["@showRelated"] = {};
    var relationName=camelize($("#showRelationName").val());
    var temp={};
    temp[relationType]={};
    temp[relationType].displayName=camelize2($("#showRelationName").val());
    var relationTypeTitle=$("#relationTypeTile").text();
    if(relationType=="search"){
        var title=camelize(relationTypeTitle);
        temp[relationType][title]=[];
        temp[relationType].condition=$("#conditionType").text();
        var selInputs=$("#searchRelationTypeDiv").find("input:checkbox:checked");
        selInputs.map(function(index,dataInp){
            temp[relationType][title].push(dataInp.name);
        });
    }else{
        var filters={};
        var filterDivs=$("#filtersDiv .filtersRow");
        var title=relationTypeTitle.toLowerCase();
        for(var i = 0;i < filterDivs.length;i++){
            if($(filterDivs[i]).find("div.filtersRowMain").find("input:checkbox").prop("checked")){
                var header=$(filterDivs[i]).find("div.filtersRowMain").find("input:checkbox").attr("name");
                filters[header]=[];
                var selInputs=$(filterDivs[i]).find("div.filtersRowSub").find("input:checkbox:checked");
                selInputs.map(function(index,dataInp){
                    filters[header].push(dataInp.name);
                });
            }
        }
        temp[relationType][title]=filters;
    }
    console.log(temp);
    schemaJSON["@showRelated"][relationName]=temp;
    $('#genericDilog,.modal-backdrop').remove();
    ReactDOM.unmountComponentAtNode(document.getElementById('showRelatedRow'));  
    ReactDOM.render(<DisplayShowRelated  showRelated ={schemaJSON["@showRelated"]} />,document.getElementById('showRelatedRow')); 
}
function saveRecordNav(){
    var recordNavs=$("#recordNavContainer .recordNavDiv");
    var status=true;
    for(var i=0 ;i<recordNavs.length;i++){
       if($(recordNavs[i]).find(".recordNavName").val().trim()=="" || $(recordNavs[i]).find(".recordDisplayName").val().trim()==""){
           status=false;
       }
    }
    if(status==true){
        schemaJSON["@recordNav"] ? schemaJSON["@recordNav"] : schemaJSON["@recordNav"] = {};
        for(var i=0 ;i<recordNavs.length;i++){
            var navName=camelize($(recordNavs[i]).find(".recordNavName").val().trim());
            var displayName=$(recordNavs[i]).find(".recordDisplayName").val().trim();
            schemaJSON["@recordNav"][navName]={};
            schemaJSON["@recordNav"][navName].displayName=displayName;
        }
        console.log(schemaJSON["@recordNav"]);
        $('#genericDilog,.modal-backdrop').remove();
          
    }else{
        alert("Please fill data completely");
    }
}

function saveStateNames(){
	/*var stateNames=$("#stateNamesContainer .stateNamesDiv");
	var status=true;
    for(var i=0 ;i<stateNames.length;i++){
       if($(stateNames[i]).find(".stateName").val().trim()=="" || $(stateNames[i]).find(".stateNameDisplayName").val().trim()==""){
           status=false;
       }
    }*/
    if($("#genericPopupBody .stateName").val().trim()==""){
    	alert('please enter state name');
    	return
    }
    if($("#genericPopupBody .stateNameDisplayName").val().trim()==""){
    	alert('please enter display name');
    	return
    }
    //if(status==true){
    	
    	$("#transitionDiv").css('display','block');
    	
		schemaJSON["@stateNames"] ? schemaJSON["@stateNames"] : schemaJSON["@stateNames"] = {};
	    //for(var i=0 ;i<stateNames.length;i++){
	        var sName=camelize($("#genericPopupBody .stateName").val().trim());
	        var displayName=$("#genericPopupBody .stateNameDisplayName").val().trim();
	        schemaJSON["@stateNames"][sName]={};
	        schemaJSON["@stateNames"][sName].displayName=displayName;
	        schemaJSON["@stateNames"][sName].stateName=sName;
	    //}
	    console.log(schemaJSON["@stateNames"]);
		ReactDOM.render(<AddstateNamesToUI  stateNames ={schemaJSON["@stateNames"]} />,document.getElementById('stateNamesRow'));
	    $('#genericDilog,.modal-backdrop').remove();	
   // }else{
       // alert("Please fill data completely");
    ///}
}

var AddstateNamesToUI = React.createClass({
	editStateNames : function(stateName,stateData,ev){
		getPopupContent("State Names","","button",ev.target,"saveStateNames");
       // ReactDOM.render(<GetStateNamesPopup editStateName={stateName} schemaData = {schemaJSON["@stateNames"]} id={ev.target}  search={""} ok={"ok"} edit={true}/>,document.getElementById('genericPopupBody'));
        
        var temp={};
	    temp.stateName=stateName;
	    temp.displayName=stateData.displayName;
        ReactDOM.render(<StateNamesComponent data={temp} search={""} ok={"ok"} edit={true}/>,document.getElementById('genericPopupBody'));
        
	},
	render : function(){
		var stateNames=this.props.stateNames;
		editStateNames = this.editStateNames;
		return (<div className="col-md-12 col-lg-12 padding">
	         	   {
		         	   Object.keys(stateNames).map(function(name){
		         	   	return(
		         	   		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left stateNameRow"  onClick={this.editStateNames.bind(this,name,stateNames[name])}>
		            	   		<span className="fieldText no-padding-left link link-btn">{name}</span>
		        	   		</div>
		        	   		)
		         	   })
					}
              	</div>
              )
	}
})

var DisplayState = React.createClass({
	editState : function(stateName,ev){
		getPopupContent("Edit State ("+stateName+")","","button","","saveState");
		ReactDOM.render(<GetStatePopup edit={"edit"} stateName={stateName} search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
	},
	render : function(){
		var state=this.props.state;
		editState = this.editState;
		return (<div>
	         	   {
		         	   Object.keys(state).map(function(stateName){
		         	   	return(
		         	   		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left stateNameRow" onClick={this.editState.bind(this,stateName)}>
		            	   		<span className={"fieldText no-padding-left link link-btn "} >{stateName}</span>
		        	   		</div>
		        	   		)
		         	   })
					}
              	</div>)}
});
var DisplayNavView=React.createClass({
    editNavView : function(navName,ev){
        getPopupContent("Edit NavView ("+navName+")","","button","","saveNavView");
        ReactDOM.render(<GetNavViewPopup edit={"edit"} schemaData = {schemaJSON} navName={navName} search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
    },
    render : function(){
        var navView=this.props.navView;
        var editNavView = this.editNavView;
        return (<div>
                   {
                       navView.map(function(navObj){
                        return(
                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left stateNameRow" onClick={editNavView.bind(this,navObj.navName)}>
                                <span className={"fieldText no-padding-left link link-btn "} >{navObj.navName}</span>
                            </div>
                            )
                       })
                        }
                </div>)}
});
var DisplayShowRelated=React.createClass({
    editShowRelated : function(relationName,ev){
        getPopupContent("Edit ShowRelated ("+relationName+")","","button","","saveShowRelated");
        ReactDOM.render(<GetShowRelatedPopup edit={"edit"} schemaData = {schemaJSON} relationName={relationName} search={""} ok={"ok"} />,document.getElementById('genericPopupBody'));
    },
    render : function(){
        var showRelated=this.props.showRelated;
        var editShowRelated = this.editShowRelated;
        return (<div>
                   {
                       Object.keys(showRelated).map(function(key){
                        return(
                            <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left stateNameRow" onClick={editShowRelated.bind(this,key)}>
                                <span className={"fieldText no-padding-left link link-btn "} >{key}</span>
                            </div>
                            )
                       })
                        }
                </div>)}
});

