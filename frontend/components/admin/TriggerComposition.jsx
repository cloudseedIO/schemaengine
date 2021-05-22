/**
 * @author saikiran
 */

var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");

var DefinitionStore = require('../../stores/DefinitionStore');
var ActionCreator = require('../../actions/ActionCreator.js');
var SchemaStore = require("../../stores/SchemaStore");
var manageSchema = require("./manageSchemaNew.jsx");
var global=require('../../utils/global.js');
var allSchemas=[];
function createTrigger(){
	$("#pageStatus").text("");
	$("#landingPage").css("display","none");
	console.log(ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv')));
	ReactDOM.render(<CreateNewTrigger  edit={"false"} schemaObjects ={""} mainTitle={"Create Trigger"} subTitle={"Trigger Name"} placeholder={"Enter Trigger Name"}/>, document.getElementById('dynamicContentDiv'));
	
}
function editTrigger(){
	$("#pageStatus").text("");
	$("#landingPage").css("display","none");
	var subTitle= "";
	var mainTitle= "";
	var placeholder = "";
	console.log(ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv')));
	ReactDOM.render(<CreateNewTrigger edit={"true"} schemaObjects ={""} mainTitle={"Edit Trigger"} subTitle={"Trigger Name"} placeholder={"Enter Trigger Name"}/>, document.getElementById('dynamicContentDiv'));
}
var currIndex;
var selectedSchema={
	"@id":"",
	"@properties":{},
	"@sysProperties":{},
	"@relations":{}
};
var selectedTrigger={recordId:""};
var triggerDoc={
  "docType": "trigger",
  "recordId": "",
  "title": "",
  "description": "",
  "active": true,
  "schemas": {
    "sourceSchema": ""
  },
  "input": [
    "recordId",
    "userId",
    "org"
  ],
  "actions": {
  },
  "orderOfProcessing": [],
  "successMessage": "",
  "return": "",
  "response": {
    "targetContext": "detailView"
  },
  "$status": "draft",
  "cloudPointHostId": "wishkarma"
};
var CreateNewTrigger=React.createClass({
	getInitialState: function() {
		var self=this;
		if(self.props.schema){
			selectedSchema=self.props.schema;
		}else{
			selectedSchema={
						"@id":"",
						"@properties":{},
						"@sysProperties":{},
						"@relations":{}
					};
		}
		allSchemas=[];
		if(this.props.triggerDoc){
			triggerDoc=this.props.triggerDoc;
		}else{
			triggerDoc.actions={};
		}
		//var d={actions:[{actionName:"", forEach:false, forAll:true, forAny:false, conditions:[{left:"",right:"",expr:""},{left:"",right:"",expr:""}], operation:{}}, {conditions:[{left:"",right:"",expr:""},{left:"",right:"",expr:""}], operation:{}}]};
		
	    return {
	    	schema: selectedSchema, 
	    	actions:[{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false,extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}], parseResult:''}, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}],
	    	triggerDoc:triggerDoc,
	    	triggerName:"",
	    	triggerTitle:"",
	    	triggerDesc:"",
	    	editTrigger:self.props.edit
	    };
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForSchema")});
	},
	componentWillUnmount: function() {
    	//DefinitionStore.removeChangeListener(this._onChange);
  	},
	componentDidMount : function(){
		common.stopLoader();
		//console.log(this.state);
	},
	/*shouldComponentUpdate: function(nextProps, nextState){
		return true;
		/*
		console.log("this.state: ");
		console.log(this.state);
		console.log("nextState: ");
		console.log(nextState);
		//console.log(this.state!=nextState);
		return (this.state!=nextState);
	},*/
	componentWillUpdate: function(){
		common.startLoader();
		console.log("Will update");
	},
	componentDidUpdate:function(){
		common.stopLoader();
		console.log("Did update");
		
	},
	checkAvailability: function(){
		var self=this;
		var docId=self.triggerName.value;
		if(docId && docId.length>5){
			common.startLoader();
			WebUtils.doPost("/trigger?operation=checkDocName", {docId: docId}, function(availability){
				common.stopLoader();
				if(!availability.status){
					var decision = confirm("Trigger Already exists, would you like to edit");
					if(decision){
						console.log("Open Trigger doc in edit mode");
					}else{
						self.triggerName.value="";
					}
					
				}else{
					self.setState({triggerName: docId});
				}
			});
		}
		
	},
	setTriggerTitle:function(ev){
		if(ev.target.value){
			this.setState({triggerTitle: ev.target.value});
		}
	},
	setTriggerDesc:function(ev){
		if(ev.target.value){
			this.setState({triggerDesc: ev.target.value});
		}
	},
	displaySchemasDialog:function(name, ev){
		var self=this;
		var ele = this.schemaName;
		$(ele).attr("readonly","readonly");
		var targetEle = ev.target;
		common.startLoader();
		WebUtils.doPost("/trigger?operation=getAllSchemas",{},function(schemas){
			if(schemas.error){
				alert(schemas.data.error +"\n select again");
			}
			allSchemas={};
			schemas.forEach(function(schema){
				allSchemas[schema.id]=schema.value;
			});
			common.stopLoader();
			manageSchema.getPopupContent("Select Schema","search","","","");
			ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas} id={ele} search={"search"} targetEle = {targetEle} calback={self.fillSelectedSchema}/>,document.getElementById('genericPopupBody'));
		});
	},
	displayTriggersDialog:function(name, ev){
		console.log(arguments);
		var d={
			actions:[{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false,extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}], parseResult:''}, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}],
	    	triggerDoc:triggerDoc,
	    	triggerName:"",
	    	triggerTitle:"",
	    	triggerDesc:""
	    	};
	    var self=this;
		var ele = ev.target;
		$(ele).attr("readonly","readonly");
		var targetEle = ev.target;
		common.startLoader();
		WebUtils.doPost("/trigger?operation=getAllTriggers",{},function(triggers){
			if(triggers.error){
				alert(triggers.data.error +"\n select again");
			}
			allTriggers={};
			triggers.forEach(function(trigger){
				allTriggers[trigger.id]=trigger.value;
			});
			common.stopLoader();
			manageSchema.getPopupContent("Select Schema","search","","","");
			ReactDOM.render(<GetObjectRelationPopup fieldData = {triggers} id={ele} search={"search"} targetEle = {targetEle} calback={self.fillSelectedTrigger}/>,document.getElementById('genericPopupBody'));
			
		});
	},
	selectSchema: function(){
		var self=this;
		//manageSchema.getPopupContent(title,search,button,target,functionName)
		manageSchema.getPopupContent("Select Schema", "", "", self.schemaName, "");
	},
	addAction: function(name,type,ev){
		var self=this;
		var actions = self.state.actions;
		actions.push({actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false,extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}],parseResult:''}, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{},  conditions:[{left:"",right:"",expr:""}], operation:{}});
		self.setState({actions: actions});
		/*
		manageSchema.getPopupContent("Add Action","","ADD","","");
		
		ReactDOM.render(<GetObjectRelationPopup fieldData = {self.schema} id={ev.target} search={"search"} targetEle = {"actions"} action={name}/>,document.getElementById('genericPopupBody'));
		*/
		console.log(arguments);
	},
	removeAction:function(actionIndex, name){
		var self=this;
		var actions=self.state.actions;
		//console.log(arguments);
		//console.log(actions);
		actions.splice(actionIndex, 1);
		//console.log(actions);
		self.setState({actions: actions});
	},
	fillSelectedSchema: function(data,id,targetEle,ev){
		var self=this;
		$("input:text#initialStateInput").val("");
		$('#genericDilog,.modal-backdrop').remove();
		console.log(arguments);
		
		if(data.value && data.value['@triggers'] && data.value['@triggers'].length){
			selectedSchema=data.value;
			manageSchema.getPopupContent("Select Trigger","","","","");
			ReactDOM.render(<ShowTriggers triggers={data.value['@triggers']} callback={self.fillSelectedTrigger}/>,document.getElementById('genericPopupBody'));
			
		}else{
			$(id).val(data.id);
			selectedSchema=data.value;
			this.setState({schema: data.value,
				actions:[{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false,extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}],parseResult:''}, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}]
				});
		}
		$(id).val(data.id);
		selectedSchema=data.value;
		this.setState({schema: data.value,
			actions:[{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false,extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}],parseResult:''}, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}]
			});
	},
	fillSelectedTrigger: function(data, editVal, ev){
		var self=this;
		$("input:text#initialStateInput").val("");
		$('#genericDilog,.modal-backdrop').remove();
		console.log(arguments);
		self.triggerName.value=data.id;
		self.schemaName.value=data.value.schemas.sourceSchema;
		
		//$(id).val(data.id);
		selectedTrigger=data.value;
		common.startLoader();
		WebUtils.doPost("/trigger?operation=getAllSchemas",{},function(schemas){
			if(schemas.error){
				common.stopLoader();
				alert(schemas.data.error +"\n select again");
			}
			allSchemas={};
			schemas.forEach(function(schema){
				allSchemas[schema.id]=schema.value;
			});
			selectedSchema=allSchemas[selectedTrigger.schemas.sourceSchema];
			var actions=[];
			selectedTrigger.orderOfProcessing.forEach(function(procName){
				var triggerAction=selectedTrigger.actions[procName];
				var action={};
				
				action['actionName']=procName;
				action['forEach']=false;
				action['forAll']=false;
				action['forAny']=false;
				action['create']=false;
				action['assign']=false;
				action['incr']=false;
				action['incrAct']={};
				action['decr']=false;
				action['invokeExtr'] = false;
				action['extrData'] = {};
				action['decrAct']={};
				action['operation']={};
				action['assignAct']=[{left:"",right:""}];
				
				
				//forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{},
				/*
				 * Below Code for Error message  */
				if(triggerAction.errorMessage){
						action['errorMsgValue']=triggerAction.errorMessage;
						action['errorMsg']=true;
					
				}else if(triggerAction.for && triggerAction.for.errorMessage){
					action['errorMsgValue']=triggerAction.for.errorMessage;
					action['errorMsg']=true;
				}else{
					action['errorMsgValue']="";
					action['errorMsg']=false;
				}
				
				/* 
				 * Below code for conditions
				 * */
				if(triggerAction.for && triggerAction.for.Each){
					action['forEach']=true;
					action['forEachVal']=triggerAction.for.Each;
					
					action['conditions']=[];
					if(triggerAction.for.conditions.all && triggerAction.for.conditions.all.length>0){
						
						triggerAction.for.conditions.all.forEach(function(triggerCond){
							action['conditions'].push(extractCondition(triggerCond));
						});
						
					}else{
						action['conditions']=[{left:"",right:"",expr:""}];
					}
				}else{
					action['forAll']=true;
					action['conditions']=[];
					if(triggerAction.conditions.all && triggerAction.conditions.all.length>0){
						
						triggerAction.conditions.all.forEach(function(triggerCond){
							action['conditions'].push(extractCondition(triggerCond));
						});
						
					}else{
						action['conditions']=[{left:"",right:"",expr:""}];
					}
				}
				
				/*
				 * Below code is for actions
				 */ 
				if(triggerAction.actions){
					if(triggerAction.actions.assign && triggerAction.actions.assign.length>0){
						action.assign=true;
						action['assignAct']=[];
						triggerAction.actions.assign.forEach(function(assign){
							action.assignAct.push({left:assign.property, right:assign.value});
						});
					}
					if(triggerAction.actions.create){
						action.create=true;
						action['createAct']={schemaName:triggerAction.actions.create.record, props:[{left:"",right:""}]};
						/* 
						 * 
						 * Need to write code for 
						 * 
						 * 
						 */ 
					}
					if(triggerAction.actions.invokeService){
						action['invokeExtr']=true;
						action['extrData']=triggerAction.actions.invokeService;
						if(action.extrData.result.length==0){
							action.extrData.result.push({prop:"", parseAs:""});
						}
					}
				}else if(triggerAction.for && triggerAction.for.Each){
					
					if(triggerAction.for.actions.assign && triggerAction.for.actions.assign.length>0){
						action.assign=true;
						action['assignAct']=[];
						triggerAction.for.actions.assign.forEach(function(assign){
							action.assignAct.push({left:assign.property, right:assign.value});
						});
					}
					if(triggerAction.for.actions.create){
						action.create=true;
						action['createAct']={schemaName:triggerAction.for.actions.create.record, props:[{left:"",right:""}]};
					}
				}
				console.log(action);
				actions.push(action);
			});
			
			var triggerDoc=selectedTrigger;
			var triggerName=selectedTrigger.recordId;
			var triggerTitle=selectedTrigger.title;
			var triggerDesc=selectedTrigger.description;
			console.log(selectedSchema);
			if(editVal=="true"){
				self.props.edit="true";
				self.props.mainTitle="Edit Trigger";
			}
			
			
			common.stopLoader();
			self.setState({
				schema:selectedSchema,
				actions:actions,
				triggerDoc:triggerDoc,
				triggerName:triggerName,
				triggerTitle:triggerTitle,
				triggerDesc:triggerDesc
			});
		});
		
		
		
		/*
		 * 
		 * 
		 * self.setState({schema:selectedSchema,
			actions:actions
		});
		 * "assignLocationName": {
      "conditions": {
        "all": []
      },
      "actions": {
        "assign": [
          {
            "property": "locationName",
            "value": "MfrProCatLoc.Location.locationName"
          }
        ]
      },
      "errorMessage": "Location is not available"
    }
		 * 
		 *
		 * actions:[{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}],
	    triggerDoc:triggerDoc,
	    triggerName:"",
	    triggerTitle:"",
	    triggerDesc:"" 
		 * 
		this.setState({schema: selectedSchema,
			actions:[{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}]
			});*/
	},
	addCondition:function(actionIndex){
		var self=this;
		var action=self.state.actions[actionIndex];
		console.log(arguments);
		self.state.actions[actionIndex].conditions.push({left:"",right:"",expr:""});
		self.setState({actions: self.state.actions});
	},
	removeCondition:function(actionIndex, index, ev){
		var self=this;
		var actions=self.state.actions;
		actions[actionIndex].conditions.splice(index,1);
		
		self.setState({action: actions});
		//console.log(arguments);
	},
	setLeftOperand: function(val, actionIndex, index, propRel){
		var self=this;
		console.log(arguments);
		
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].conditions[index].left=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setLeftOperand} schema={selectedSchema} actionIndex={actionIndex} index={index}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			//console.log(arguments);
			
			if(propRel=="props" || propRel=="sysProp"){
				self.state.actions[actionIndex].conditions[index].left=selectedSchema['@id']+"."+val;
			}else if(propRel=="rels"){
				self.state.actions[actionIndex].conditions[index].left=selectedSchema['@id']+"->"+val;
			}
			self.setState({actions:self.state.actions});
			
		}
		
	},
	setRightOperand: function(val, actionIndex, index, propRel){
		var self=this;
		console.log(arguments);
		
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].conditions[index].right=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			//console.log(val);
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			//console.log(selectedSchema);
			//console.log(document.getElementById('genericPopupBody'));
			ReactDOM.render(<ShowProperties callback={self.setRightOperand} schema={selectedSchema} actionIndex={actionIndex} index={index}/>, document.getElementById('genericPopupBody'));
		}else if(val=="comboprop"){
			//console.log(val);
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ComboPropDialog callback={self.setRightOperand} schema={selectedSchema} actionIndex={actionIndex} index={index}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			
			console.log(arguments);
			
			if(propRel=="props" || propRel=="sysProp"){
				self.state.actions[actionIndex].conditions[index].right=selectedSchema['@id']+"."+val;
				$('#genericDilog,.modal-backdrop').remove();
			}else if(propRel=="rels"){
				self.state.actions[actionIndex].conditions[index].right=selectedSchema['@id']+"->"+val;
				$('#genericDilog,.modal-backdrop').remove();
			}
			if(propRel=="comboprop"){
				self.state.actions[actionIndex].conditions[index].right=selectedSchema['@id']+"->"+val;
				ReactDOM.unmountComponentAtNode(document.getElementById("genericDilog"));
			}
			self.setState({actions:self.state.actions});
		}
	},
	setOperator: function(val, actionIndex, index){
		var self=this;
		console.log(arguments);
		switch(val){
			case "==":val="==";break;
			case "&ne;":val="!=";break;
			case "&lt;":val="<";break;
			case "&gt;":val=">";break;
			case "&le;":val="<=";break;
			case "&ge;":val=">=";break;
		}
		self.state.actions[actionIndex].conditions[index].expr=val;
		self.setState({actions:self.state.actions});
		
	},
	setActionName:function(actionIndex, ev){
		var self=this;
		var actions=self.state.actions;
		actions[actionIndex].actionName=ev.target.value;
		
		if((actions[actionIndex].actionName==ev.target.value) || (!self.state.triggerDoc.actions[ev.target.value])){
			self.state.triggerDoc.actions[ev.target.value]={};
		}else{
			ev.target.value="";
			alert("Action already exists, Try to enter another name");
			return;
			
		}
		
		self.setState({actions: actions});
	},
	fromForEach:function(actionIndex, ev){
		var self=this;
		self.state.actions[actionIndex].forEach=true;
		self.state.actions[actionIndex].forAll=false;
		self.state.actions[actionIndex].forAny=false;
		self.setState({actions:self.state.actions});
		
	},
	fromForAny:function(actionIndex,ev){
		var self=this;
		self.state.actions[actionIndex].forEach=false;
		self.state.actions[actionIndex].forAll=false;
		self.state.actions[actionIndex].forAny=true;
		self.setState({actions:self.state.actions});
	},
	fromForAll:function(actionIndex,ev){
		var self=this;
		self.state.actions[actionIndex].forEach=false;
		self.state.actions[actionIndex].forAll=true;
		self.state.actions[actionIndex].forAny=false;
		self.setState({actions:self.state.actions});
	},
	forEachDialog:function(val, actionIndex, index, propRel){
		var self=this;
		console.log(arguments);
		
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			if(txt=="\"\"" || txt=="''"){
				txt='';
			}
			self.state.actions[actionIndex].forEachVal=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			//console.log(val);
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.forEachDialog} schema={selectedSchema} actionIndex={actionIndex} index={0} forEach={"true"}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			console.log(arguments);
			
			if(propRel=="props" || propRel=="sysProp"){
				self.state.actions[actionIndex].forEachVal=selectedSchema['@id']+"."+val;
			}else if(propRel=="rels"){
				self.state.actions[actionIndex].forEachVal=selectedSchema['@id']+"->"+val;
			}
			self.setState({actions:self.state.actions});
		}
		
	},
	fromCreate:function(actionIndex,ev){
		//create:false, assign:false, incr:false, decr:false
		var self=this;
		self.state.actions[actionIndex].create=true;
		self.state.actions[actionIndex].assign=false;
		self.state.actions[actionIndex].incr=false;
		self.state.actions[actionIndex].decr=false;
		self.state.actions[actionIndex].invokeExtr=false;
		self.setState({actions:self.state.actions});
	},
	fromAssign:function(actionIndex,ev){
		var self=this;
		self.state.actions[actionIndex].create=false;
		self.state.actions[actionIndex].assign=true;
		self.state.actions[actionIndex].incr=false;
		self.state.actions[actionIndex].decr=false;
		self.state.actions[actionIndex].invokeExtr=false;
		self.setState({actions:self.state.actions});
	},
	fromIncrement:function(actionIndex,ev){
		var self=this;
		self.state.actions[actionIndex].create=false;
		self.state.actions[actionIndex].assign=false;
		self.state.actions[actionIndex].incr=true;
		self.state.actions[actionIndex].decr=false;
		self.state.actions[actionIndex].invokeExtr=false;
		self.setState({actions:self.state.actions});
	},
	fromDecrement:function(actionIndex,ev){
		var self=this;
		self.state.actions[actionIndex].create=false;
		self.state.actions[actionIndex].assign=false;
		self.state.actions[actionIndex].incr=false;
		self.state.actions[actionIndex].decr=true;
		self.state.actions[actionIndex].invokeExtr=false;
		self.setState({actions:self.state.actions});
	},
	fromInvokeExtenalAPI:function(actionIndex,ev){
		var self=this;
		self.state.actions[actionIndex].create=false;
		self.state.actions[actionIndex].assign=false;
		self.state.actions[actionIndex].incr=false;
		self.state.actions[actionIndex].decr=false;
		self.state.actions[actionIndex].invokeExtr=true;
		self.setState({actions:self.state.actions});
	},
	displaySchemasDialogForCreate:function(actionIndex, name, ev){
		console.log(arguments);
		var self=this;
		if(typeof actionIndex=="number"){
			var ele = ev.target;
			$(ele).attr("readonly","readonly");
			var targetEle = actionIndex;
			common.startLoader();
			WebUtils.doPost("/trigger?operation=getAllSchemas",{},function(schemas){
				if(schemas.error){
					alert(SchemaNames.data.error +"\n select again");
				}
				common.stopLoader();
				manageSchema.getPopupContent("Select Schema","search","","","");
				ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas} id={ele} search={"search"} targetEle = {targetEle} calback={self.displaySchemasDialogForCreate}/>,document.getElementById('genericPopupBody'));
			});
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			console.log(arguments);
			
			self.state.actions[ev].createAct.schemaName=actionIndex.id;
			self.setState({actions:self.state.actions});
			/*setRightValue setLeftProp
			self.state.actions[actionIndex].
			
			console.log(arguments);
			$(id).val(data.id);
			selectedSchema=data.value;
			this.setState({schema: data.value});*/
		}
		
	},
	setRightValue:function(val, actionIndex, actIndex, dialogVal){
		var self=this;
		console.log(arguments);
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].assignAct[actIndex].right=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setRightValue} schema={selectedSchema} actionIndex={actionIndex} index={actIndex} />, document.getElementById('genericPopupBody'));
		}else if(val=="comboprop"){
			//console.log(val);
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ComboPropDialog callback={self.setRightValue} schema={selectedSchema} actionIndex={actionIndex} index={actIndex}/>, document.getElementById('genericPopupBody'));
		}else{
			console.log("else");
			$("input:text#initialStateInput").val("");
			
			if(dialogVal=="props" || dialogVal=="sysProp"){
				self.state.actions[actionIndex].assignAct[actIndex].right=selectedSchema['@id']+"."+val;
				self.setState({actions:self.state.actions});
				$('#genericDilog,.modal-backdrop').remove();
			}else if(dialogVal=="comboprop"){
				self.state.actions[actionIndex].assignAct[actIndex].right=val;
				self.setState({actions:self.state.actions});
			}
			console.log(arguments);
		}
		
	}, 
	setLeftProp:function(val, actionIndex, actIndex, dialogVal){
		var self=this;
		console.log(arguments);
		if(val=="prop"){
			self.state.actions[actionIndex].assignAct[actIndex].left=dialogVal.target.innerText;
			self.setState({actions:self.state.actions});
			/*
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setLeftProp} schema={selectedSchema} actionIndex={actionIndex} index={actIndex}/>, document.getElementById('genericPopupBody'));
			*/
		}else{
			//assignAct:[{left:"",right:""}]
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			if(dialogVal=="props" || dialogVal=="sysProp"){
				self.state.actions[actionIndex].assignAct[actIndex].left=selectedSchema['@id']+"."+val;
				self.setState({actions:self.state.actions});
			}else if(dialogVal=="props"){
				self.state.actions[actionIndex].assignAct[actIndex].left=selectedSchema['@id']+"->"+val;
				self.setState({actions:self.state.actions});
			}
		}
		
	},
	setLeftPropForCreate:function(val, actionIndex, createIndex, dialogVal){
		var self=this;
		if(val=="prop"){
			if(self.state.actions[actionIndex] && self.state.actions[actionIndex].createAct.props.length){
				self.state.actions[actionIndex].createAct.props[createIndex].left=dialogVal;
				self.setState({actions:self.state.actions});
			}
		}
	},
	setRightValueForCreate:function(val, actionIndex, createIndex, dialogVal){
		var self=this;
		console.log(arguments);
		var selectedSchemaForCreate=allSchemas[self.state.actions[actionIndex].createAct.schemaName];
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].createAct.props[createIndex].right=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setRightValueForCreate} schema={selectedSchema} actionIndex={actionIndex} index={createIndex} />, document.getElementById('genericPopupBody'));
		}else if(val=="comboprop"){
			//console.log(val);
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ComboPropDialog callback={self.setRightValue} schema={selectedSchema} actionIndex={actionIndex} index={createIndex}/>, document.getElementById('genericPopupBody'));
		}else{
			console.log("else");
			$("input:text#initialStateInput").val("");
			
			if(dialogVal=="props" || dialogVal=="sysProp"){
				self.state.actions[actionIndex].createAct.props[createIndex].right=selectedSchemaForCreate['@id']+"."+val;
				self.setState({actions:self.state.actions});
				$('#genericDilog,.modal-backdrop').remove();
			}else if(dialogVal=="comboprop"){
				self.state.actions[actionIndex].createAct.props[createIndex].right=val;
				self.setState({actions:self.state.actions});
			}
			console.log(arguments);
		}
	},
	addAssignOper:function(actionIndex, assignActIndex){
		var self=this;
		self.state.actions[actionIndex].assignAct.push({left:"",right:""});
		self.setState({actions:self.state.actions});
	},
	removeAssignOper:function(actionIndex, assignActIndex){
		var self=this;
		self.state.actions[actionIndex].assignAct.splice(assignActIndex, 1);
		self.setState({actions:self.state.actions});
	},
	removeCreateOper:function(){
		console.log(arguments);
	},
	addCreateOper:function(){
		console.log(arguments);
	},
	setErrorMsg:function(actionIndex, ev){
		console.log(arguments);
		//console.log("val: "+ev.target.value);
		var self=this;
		self.state.actions[actionIndex].errorMsg=!self.state.actions[actionIndex].errorMsg;
		self.setState({actions: self.state.actions});
	},
	setErrorMsgVal:function(actionIndex, ev){
		console.log(arguments);
		var self=this;
		self.state.actions[actionIndex].errorMsgValue=ev.target.value;
		self.setState({actions: self.state.actions});
	},
	done:function(){
		
		console.log(this.state);
		var self=this;
		var state=this.state;
		if(state.schema['@id']){
			var docId=state.triggerName;
			if((docId && docId.length>=10) || self.props.edit=="true"){
				var saveStatus=true;
				var message="";
				var triggerToSaveDoc={};
				triggerToSaveDoc['schemas']={};
				triggerToSaveDoc['schemas']['sourceSchema']=state.schema['@id'];
				triggerToSaveDoc["input"]= ["recordId", "userId", "org"];
				triggerToSaveDoc["docType"]= "trigger";
				triggerToSaveDoc["recordId"]=docId;
				triggerToSaveDoc["title"]=state.triggerTitle;
				triggerToSaveDoc["description"]=state.triggerDesc;
				//storeActions(triggerDoc, state);
				/*start */
				triggerToSaveDoc['actions']={};
				state.actions.forEach(function(action, actionIndex){
					
					if(action.actionName){
						 triggerToSaveDoc['actions'][action.actionName]={};
							if(action.forEach){
								triggerToSaveDoc['actions'][action.actionName]={for: {Each: action.forEachVal,conditions: {all: []}}};
											
								action.conditions.forEach(function(cond){
									if(cond.left!=""){
										if(cond.right=="\"\"" || cond.right=="''"){
											cond.right="''";
										}
										var condition=cond.left+" "+cond.expr+" "+(isNaN(parseFloat(cond.right))?cond.right:parseFloat(cond.right));
										triggerToSaveDoc['actions'][action.actionName].for["conditions"].all.push(condition);
									}
								});
											
							}else if(action.forAll){
								triggerToSaveDoc['actions'][action.actionName]["conditions"]={"all": []};
								action.conditions.forEach(function(cond){
									if(cond.left!=""){
										console.log(cond.right);
										if(cond.right=="\"\"" || cond.right=="''"){
											cond.right="''";
										}
										console.log(cond.right);
										var condition=cond.left+" "+cond.expr+" "+(isNaN(parseFloat(cond.right))?cond.right:parseFloat(cond.right));
										console.log(condition);
										triggerToSaveDoc['actions'][action.actionName]["conditions"].all.push(condition);
									}
								});
							}else if(action.forAny){
								
							}
					}else if(actionIndex==0){
						saveStatus=false;
						common.stopLoader();
						message = "Enter Action Name";
					}else{
						
					}
					
					if(action.actionName){
						if(action.create){
							
							if(action.forEach){
								triggerToSaveDoc['actions'][action.actionName].for["create"]= {"record": action.createAct.schemaName,"createMethod": "createMethod"};
								var createPropsJson={};
								action.createAct.props.forEach(function(createProp){
									if(createProp.left && createProp.left.length>0 && createProp.right && createProp.right.length>0){
										createPropsJson[createProp.left]=createProp.right;
									}
								});
								triggerToSaveDoc['actions'][action.actionName].for["create"]['props']=createPropsJson;
							}else{
								triggerToSaveDoc['actions'][action.actionName]["actions"]= {"create": {"record": action.createAct.schemaName,"createMethod": "createMethod"}};
								var createPropsJson={};
								action.createAct.props.forEach(function(createProp){
									if(createProp.left && createProp.left.length>0 && createProp.right && createProp.right.length>0){
										createPropsJson[createProp.left]=createProp.right;
									}
								});
								triggerToSaveDoc['actions'][action.actionName]['actions']["create"]['props']=createPropsJson;
							}
						}else if(action.assign){
							
								if(action.forEach){
									triggerToSaveDoc['actions'][action.actionName].for["actions"]={assign:[]};
									action.assignAct.forEach(function(assign){
										if(assign.left && assign.left.length>0 && assign.right && assign.right.length>0){
											triggerToSaveDoc['actions'][action.actionName].for["actions"].assign.push({
												property:assign.left,
												value:assign.right
											});
										}
										
									});
								}else{
									triggerToSaveDoc['actions'][action.actionName]["actions"]={assign:[]};
								
									action.assignAct.forEach(function(assign){
										if(assign.left && assign.left.length>0 && assign.right && assign.right.length>0){
											triggerToSaveDoc['actions'][action.actionName]["actions"].assign.push({
												property:assign.left,
												value:assign.right
											});
										}
									});
							}
						}else if(action.incr){
							
						}else if(action.decr){
							
						}else if(action.invokeExtr){
							var extrData = action.extrData;
							if(!extrData.serviceDoc.serviceName || !extrData.path){
								saveStatus=false;
								message="Kindly select a service and path";
								return;
							}
							extrData.serviceDoc.pathAndParams.forEach(function(pathAndParam){
								if(extrData.path==pathAndParam.path && !extrData.result){
									saveStatus=false;
									message="Kindly select a property to store result";
									return;
								}
							});
							var serviceDoc = action.extrData.serviceDoc;
							var path=action.extrData.path;
							var result=action.extrData.result;
							
							if(action.forEach){
								triggerToSaveDoc['actions'][action.actionName].for["actions"]={invokeService:{serviceName: "RestApiService", path:path, serviceDoc:serviceDoc, result: result }};
							}else{
								triggerToSaveDoc['actions'][action.actionName]["actions"]={invokeService:{serviceName: "RestApiService", path:path, serviceDoc:serviceDoc, result: result }};
							}
							
						}
						
						if(action.errorMsg){
							if(action.forEach){
								triggerToSaveDoc['actions'][action.actionName].for['errorMessage']=action.errorMsgValue;
							}else{
								triggerToSaveDoc['actions'][action.actionName]['errorMessage']=action.errorMsgValue;
							}
							
						}
					}else{
						console.log("Action name is not entered, so ignoring");
					}
					
				});
				
				
				
				triggerToSaveDoc['orderOfProcessing']=Object.keys(triggerToSaveDoc.actions);
				
				if(triggerToSaveDoc['orderOfProcessing'].length>0){
					triggerToSaveDoc['orderOfProcessing'].forEach(function(name){
						if(name==""){
							saveStatus=false;
						}
					});
				}else{
					saveStatus=false;
				}
				
				if(saveStatus){
					if(this.props.edit=="true"){
						if(self.state.triggerDoc && self.state.triggerDoc.revision){
							triggerToSaveDoc['revision']=self.state.triggerDoc.revision;
						}
						if(self.state.triggerDoc && self.state.triggerDoc.author){
							triggerToSaveDoc['author']=self.state.triggerDoc.author;
						}
						if(self.state.triggerDoc && self.state.triggerDoc['cloudPointHostId']){
							triggerToSaveDoc['cloudPointHostId']=self.state.triggerDoc['cloudPointHostId'];
						}
						console.log(triggerToSaveDoc);
						
						common.startLoader();
						WebUtils.doPost("/trigger?operation=editTrigger",{trigger:triggerToSaveDoc},function(result){
							common.stopLoader();
							console.log(result);
							if(result.error){
								common.stopLoader();
							}else{
								common.stopLoader();
								self.setState({
									actions:[{
										schema: {},
										actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false, extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}],parseResult:''},forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}}],
									    triggerDoc:triggerDoc,
									    triggerName:"",
									    triggerTitle:"",
									    triggerDesc:""
								});
							}
						});
						
					}else{
						triggerToSaveDoc['dateCreated']=global.getDate();
						console.log(triggerToSaveDoc);
						
						common.startLoader();
						
						WebUtils.doPost("/trigger?operation=saveTrigger",{trigger:triggerToSaveDoc},function(result){
							common.stopLoader();
							console.log(result);
							if(result.error){
								
							}else{
								common.stopLoader();
								self.setState({
									actions:[{
										schema: {},
										actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false,invokeExtr:false,extrData:{method:'', serviceDoc:{}, userInputs:[{name:'', value:''}], path:'', finalURL:'', result:[{prop:"", parseAs:""}],parseResult:''}, forEach:false, forAll:true, forAny:false, forEachVal:"", createAct:{schemaName:"", props:[{left:"",right:""}]}, assignAct:[{left:"",right:""}], incrAct:{}, decrAct:{}, conditions:[{left:"",right:"",expr:""}], operation:{}
										}],
								    triggerDoc:triggerDoc,
								    triggerName:"",
								    triggerTitle:"",
								    triggerDesc:""
								});
							}
						});
						
					}
					
				}else{
					common.stopLoader();
					alert(message);
				}
				console.log(JSON.stringify(triggerToSaveDoc));
				
				console.log(triggerToSaveDoc);
				
				/* end*/
			}else{
				common.stopLoader();
				alert("Enter Valid Name for Trigger Document (Minimum length 10)");
				return;
			}
		}else{
			common.stopLoader();
			alert("Select Schema");
			return;
		}
		
	},
	selectRestAPI:function(actionIndex,ev){
		var self=this;
		var ele=ev.target;
		var targetEle=actionIndex;
		common.startLoader();
			WebUtils.doPost("/restApiService?operation=getAllRestApiServices",{},function(schemas){
				if(schemas.error){
					alert(SchemaNames.data.error +"\n select again");
				}
				common.stopLoader();
				manageSchema.getPopupContent("Select Schema","search","","","");
				ReactDOM.render(<GetObjectRelationPopup fieldData = {schemas} id={ele} search={"search"} targetEle = {targetEle} calback={self.onSelectRestAPI}/>,document.getElementById('genericPopupBody'));
			});
	},
	onSelectRestAPI:function(doc, input, actionIndex){
		$('#genericDilog,.modal-backdrop').remove();
		var self=this;
		if(self.state.actions[actionIndex].extrData.path){
			self.state.actions[actionIndex].extrData.path="";
		}
		if(self.state.actions[actionIndex].extrData.result){
			self.state.actions[actionIndex].extrData.result=[{prop:"", parseAs:""}];
		}
		self.state.actions[actionIndex].extrData.serviceDoc=doc.value;
		self.setState({actions: self.state.actions});
		
	},
	setMethod:function(actionIndex, ev){
		var self=this;
		if(self.state.actions[actionIndex].invokeExtr && self.state.actions[actionIndex].extrData){
			self.state.actions[actionIndex].extrData.method=ev.target.innerText;
			self.setFinalVal(self, actionIndex);
			self.setState({actions: self.state.actions});
		}
	},
	setUserInput:function(val, actionIndex, inputIndex, ev){
		var self=this;
		if(self.state.actions[actionIndex].invokeExtr && self.state.actions[actionIndex].extrData){
			self.state.actions[actionIndex].extrData.userInputs[inputIndex][val]=ev.target.value;
			console.log(self.state.actions[actionIndex].extrData);
			self.setFinalVal(self, actionIndex);
			self.setState({actions: self.state.actions});
			
		}
	},
	setFinalVal:function(self, actionIndex){
		var finalVal = '';
		finalVal+=self.state.actions[actionIndex].extrData.method+"  ";
		finalVal+=self.state.actions[actionIndex].extrData.serviceDoc.apiEndPointURL;
		finalVal+=self.state.actions[actionIndex].extrData.path;
		finalVal+='?';
		Object.keys(self.state.actions[actionIndex].extrData.serviceDoc.parameters).forEach(function(param, index){
			finalVal+=(param+"="+self.state.actions[actionIndex].extrData.serviceDoc.parameters[param]+"&");
		});
		if(finalVal[finalVal.length-1]=="&" && Object.keys(self.state.actions[actionIndex].extrData.serviceDoc.parameters).length==0){
			finalVal = finalVal.replace(/&$/,'');
		}
		self.state.actions[actionIndex].extrData.userInputs.forEach(function(input, index){
			if(input.name && input.value){
				finalVal+=(input.name+"="+input.value+"&");
			}
			
		});
		if(finalVal[finalVal.length-1]=="&"){
			finalVal = finalVal.replace(/&$/,'');
		}
		if(finalVal[finalVal.length-1]=="?"){
			finalVal = finalVal.replace(/\?$/,'');
		}
		console.log(finalVal);
		self.state.actions[actionIndex].extrData.finalURL=finalVal;
	},
	setPath:function(actionIndex, path){
		var self=this;
		if(self.state.actions[actionIndex].invokeExtr && self.state.actions[actionIndex].extrData){
			self.state.actions[actionIndex].extrData.path=path;
			
			//self.setFinalVal(self, actionIndex);
			self.setState({actions: self.state.actions});
		}
	},
	testAPI:function(actionIndex, pathIndex){
		var self=this;
		var doc={};
		console.log(self);
		var serviceDoc=self.state.actions[actionIndex].extrData.serviceDoc;
		
		doc['apiEndPointURL']=serviceDoc.apiEndPointURL+serviceDoc.pathAndParams[pathIndex].path;
		doc['otherConfigs']=[];
		doc['method']=serviceDoc.pathAndParams[pathIndex].method;
		
		if(serviceDoc.otherConfigs && serviceDoc.otherConfigs.length){
			serviceDoc.otherConfigs.forEach(function(data){
				if(data.key && data.value){
					doc['otherConfigs'].push(data);
				}
			});
		}
		
		doc['parameters']={};
		serviceDoc.pathAndParams[pathIndex].queryParams.forEach(function(param){
			doc['parameters'][param.key]=param.value;
		});
		//doc['parameters'] = serviceDoc.parameters; This was causing issue
		if(serviceDoc.otherConfigs && serviceDoc.otherConfigs.length){
			serviceDoc.otherConfigs.forEach(function(data){
				if(data.key && data.value && data.useAsInParam){
					doc['parameters'][data.key]=data.value;
				}
			});
		}
		
		if(doc.method!="GET"){
			var dataJson={};
			serviceDoc.pathAndParams[pathIndex].data.forEach(function(data){
				
				prepareJson(data, dataJson, function(finalTempJson){
					console.log("Final Temp Json");
					console.log(finalTempJson);
					
				});
			});
			doc['data']=dataJson;
		}
		console.log(doc);
		
		common.startLoader();
		WebUtils.doPost("/restApiService?operation=testAPI", {serviceDoc: doc}, function(res){
			common.stopLoader();
			//if(res.status){
				//console.log(JSON.stringify(res.data));
				//alert("Result: "+JSON.stringify(res));
				var result=res.data;
				if(self.state.actions[actionIndex].extrData.parseResult){
					self.state.actions[actionIndex].extrData.parseResult.split(".").forEach(function(k){
						result=result[k];
					});
				}
				self.state.actions[actionIndex].extrData.result=(result);
				self.setState({actions: self.state.actions});
				/*
				if(res.data.constructor==String && res.data.indexOf("html")==-1){
					self.setState({result: res.data});
				}else{
					self.setState({result: JSON.stringify(res.data)});
				}*/
				
			//}
		});
	},
	setInParamVal: function(val, actionIndex, index, propRel){
		var self=this;
		console.log(arguments);
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].queryParams[propRel].value=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			currIndex=propRel;
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setInParamVal} schema={selectedSchema} actionIndex={actionIndex} index={index}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			console.log(arguments);
			
			if(propRel=="props" || propRel=="sysProp"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].queryParams[currIndex].value=selectedSchema['@id']+"."+val;
			}else if(propRel=="rels"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].queryParams[currIndex].value=selectedSchema['@id']+"."+val;
			}
			self.setState({actions:self.state.actions});
			
			
		}
		
	},
	setInDataVal: function(val, actionIndex, index, propRel){
		var self=this;
		console.log(arguments);
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].data[propRel].value=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			currIndex=propRel;
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setInDataVal} schema={selectedSchema} actionIndex={actionIndex} index={index}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			console.log(arguments);
			
			if(propRel=="props" || propRel=="sysProp"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].data[currIndex].value=selectedSchema['@id']+"."+val;
			}else if(propRel=="rels"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].data[currIndex].value=selectedSchema['@id']+"->"+val;
			}
			self.setState({actions:self.state.actions});
			
			
		}
		
	},
	setInPathParamVal: function(val, actionIndex, index, paramIndex, ev){
		var self=this;
		console.log(arguments);
		
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].pathParams[paramIndex].value=txt;
			self.setState({actions:self.state.actions});
		}else if(val=="prop"){
			currIndex=paramIndex;
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setInPathParamVal} schema={selectedSchema} actionIndex={actionIndex} index={index}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			console.log(arguments);
			
			if(paramIndex=="props" || paramIndex=="sysProp"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].pathParams[currIndex].value=selectedSchema['@id']+"."+val;
			}else if(paramIndex=="rels"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].pathParams[currIndex].value=selectedSchema['@id']+"->"+val;
			}
			self.setState({actions:self.state.actions});
			
		}
		
	},
	setResultProp:function(actionIndex, resultIndex, prop){
		//{prop:"", parseAs:""}
		var self=this;
		self.state.actions[actionIndex].extrData.result[resultIndex].prop=prop;
		self.setState({actions: self.state.actions});
	},
	setResultParse:function(actionIndex, resultIndex, ev){
		var self=this;
		self.state.actions[actionIndex].extrData.result[resultIndex].parseAs=ev.target.value;
		self.setState({actions: self.state.actions});
	},
	addMoreResult:function(actionIndex, mapIndex){
		var self=this;
		self.state.actions[actionIndex].extrData.result.push({prop:"", parseAs:""});
		self.setState({actions: self.state.actions});
	},
	removeMoreResult:function(actionIndex, mapIndex){
		var self=this;
		self.state.actions[actionIndex].extrData.result.splice(mapIndex, 1);
		self.setState({actions: self.state.actions});
	},
	updateData:function(parent, actionIndex, pathIndex, dataIndex, childIndex){
		console.log(arguments);
		var self=this;
		console.log(self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[pathIndex].data[dataIndex][childIndex]);
		
		if(self.state.actions[actionIndex].extrData &&
			self.state.actions[actionIndex].extrData.serviceDoc &&
			self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[pathIndex] &&
			self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[pathIndex].data &&
			self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[pathIndex].data[dataIndex]){
				
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[pathIndex].data[dataIndex]=parent;
		}
		
		self.setState({actions:self.state.actions});
			
	},
	setArrayRef:function(){
		console.log(arguments);
	},
	render: function(){
		var self=this;
		var subTitle= this.props.subTitle;
		var mainTitle= this.props.mainTitle;
		var placeholder = this.props.placeholder;
		var actions = this.state.actions;
		var edit=this.props.edit;
		//console.log("actions: ");
		console.log(self.state);
		var operators=["==","!=","<",">","<=",">="];
		return (<div className="row" key={global.guid()}>
					<h3 id="schemastructeditnew" style={{"color":"#666"}} className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding ">{mainTitle}</h3>
					<div>
						{
							['a'].map(function(){
								if(self.props.edit=="true"){
									return (<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
										<div  className="col-lg-12 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
											<label  className="text-uppercase">Select Trigger</label>
												<div  className="row no-margin ">
												<input type="text" placeholder="Select Trigger" className="form-control" ref={(e)=>{self.triggerName=e}} id="triggerName" onClick={self.displayTriggersDialog} readOnly="readonly" defaultValue={self.state.triggerDoc.recordId}/>
												</div>
											</div>
										
										<div  className="col-lg-12 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
											<label  className="text-uppercase">Mapped Schema</label>
												<div  className="row no-margin ">
												<input type="text" placeholder="Select Schema" className="form-control" ref={(e)=>{self.schemaName=e}} id="schemaName" readOnly="readonly" defaultValue={self.state.schema['@id']}/>
												</div>
											</div>
											</div>)
													
								}else{
									return (
										<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
										<div  className="col-lg-12 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
											<label  className="text-uppercase">Select Schema</label>
												<div  className="row no-margin ">
												<input type="text" placeholder="Select Schema" className="form-control" onClick={self.displaySchemasDialog} ref={(e)=>{self.schemaName=e}} id="schemaName" readOnly="readonly" defaultValue={self.state.schema['@id']}/>
												</div>
											</div>
											<div  className="col-lg-12 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
												<label  className="text-uppercase">Trigger Name</label>
												<div  className="row no-margin ">
													<input type="text" placeholder="Enter Trigger Name" className="form-control" onBlur={self.checkAvailability} ref={(e)=>{self.triggerName=e}} defaultValue={self.state.triggerName}/>
												</div>
											</div>
											</div>)
								}
							})
						}
						
						<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
							<label  className="text-uppercase">Trigger Title</label>
							<div  className="row no-margin ">
								<input type="text" placeholder="Enter Trigger Title" className="form-control" onBlur={self.setTriggerTitle} defaultValue={self.state.triggerTitle} />
							</div>
						</div>
						<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
							<label  className="text-uppercase">Trigger Description</label>
							<div  className="row no-margin ">
								<input type="text" placeholder="Enter Trigger Description" className="form-control" onBlur={self.setTriggerDesc} defaultValue={self.state.triggerDesc} />
							</div>
						</div>
						<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
							<label  className="text-uppercase">Configure Actions</label>
							<div id="actions">
								{
									//actions:[{actionName:"",create:false, assign:false, incr:false, decr:false, forEach:false, forAll:true, forAny:false, conditions:[{left:"",right:"",expr:""}], operation:{}}]
									actions.map(function(action, actionIndex){
										//return (<CondActionConfigComp  action={action} key={global.guid()}/>)
										return ((<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-bottom-gap no-padding" key={global.guid()}>
										
												<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
													<div >
													  <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
													  <span>{actionIndex+1+") "}Name of the Action</span>
													  </div>
													  <div className="col-lg-9 col-md-9 col-xs-12 col-sm-12 no-padding">
													  <input type="text" placeholder="Enter Action Name" className="form-control" onBlur={self.setActionName.bind(this, actionIndex)} defaultValue={action.actionName?action.actionName:''}  />
													  </div>
													  {
													  	['a'].map(function(){
													  		if(actionIndex==actions.length-1){
													  			return <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-right"><button className="btn  btn-warning upload-drop-zone form-control" onClick={self.addAction.bind(this,"addAction","new")}>Add  Action</button></div>
													  		}else{
													  			return <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-right"><button className="btn  btn-warning upload-drop-zone form-control" onClick={self.removeAction.bind(this,actionIndex, "removeAction","new")}>Remove  Action</button></div>
													  		}
													  	})
													  }
													  
													</div>
												</div>
												<div className="row remove-margin-left remove-margin-right form-group">
													<div><span className="text-uppercase">CONDITION</span></div>
													<div> 
														<input type="radio" onChange={self.fromForEach.bind(this, actionIndex)} checked={action.forEach} /><span>For Each </span>
														<input type="radio" onChange={self.fromForAll.bind(this, actionIndex)} checked={action.forAll} /><span>All Conditions</span>
														<input type="radio" onChange={self.fromForAny.bind(this, actionIndex)} checked={action.forAny} /><span>Any Condition</span>
													</div>
													{
														['a'].map(function(){
															if(action.forEach){
																return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																		<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" >
																			<span data-bind="label">{action.forEachVal?action.forEachVal:'Select '} </span></button>
																			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " >
																				<li><span>Select Operand</span></li>
																				<li onClick={self.forEachDialog.bind(this, "text", actionIndex)}><span>Text</span></li>
																				<li onClick={self.forEachDialog.bind(this, "prop", actionIndex)}><span>Schema Property</span></li>
																			</ul>
																	</div>)
															}
															
														})	
													}
												</div>
												{
													//{actionName:"",errorMsg:false, errorMsgValue:"", create:false, assign:false, incr:false, decr:false, forEach:false, forAll:true, forAny:false, conditions:[{left:"",right:"",expr:""}], operation:{}}
													action.conditions.map(function(condition, index){
														{ /*return (<ConditionComponent condition={condition} addCondition={self.addCondition} actions={self.state.action.conditions} index={index} removeCondition={self.removeCondition}/>) */}
														return (<div className="row remove-margin-left remove-margin-right form-group"> 
																	<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5  no-padding-left">
																		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																		<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																			<span data-bind="label" ref={(e)=>{self.leftOperand}}>{condition.left?condition.left:"Select Operand"}</span>
																		</button>
																		<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
																		 {/*<li><span>Select Operand</span></li>*/}
																		  <li onClick={self.setLeftOperand.bind(this, "text", actionIndex, index)}><span>Text</span></li>
																		  <li onClick={self.setLeftOperand.bind(this, "prop", actionIndex, index)}><span>Schema Property</span></li>
																		 </ul>
																		</div>
																	</div>
																<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left">
																 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																   <span data-bind="label" ref={(e)=>{self.operator=e}}>{condition.expr?condition.expr:""}</span>
																  </button>
																  <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																  {
																  	operators.map(function(opr){
																  		return <li onClick={self.setOperator.bind(this, opr, actionIndex, index)}><span> {opr} </span></li>
																  	})
																  }
																  </ul>
																 </div>
																</div>
															<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5  no-padding-left">
															 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
															 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
															 <span data-bind="label" ref={(e)=>{self.rightOperand=e}}>{condition.right?condition.right:"Select Operand"}</span>
															 </button>
															 <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
															  {/*<li><span>Select Operand</span></li>*/}
															  <li onClick={self.setRightOperand.bind(this, "text", actionIndex, index)}><span>Text</span></li>
															  <li onClick={self.setRightOperand.bind(this, "prop", actionIndex, index)}><span>Schema Property</span></li>
															  {/*<li onClick={self.setRightOperand.bind(this, "comboprop", actionIndex, index)}><span>Properties Combo</span></li>*/}
															 </ul>
															</div>
															</div>
															{
																['a'].map(function(){
																	if(index==action.conditions.length-1){
																		return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus"  onClick={self.addCondition.bind(this, actionIndex, index)}></span></div>
																	}else{
																		return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus"  onClick={self.removeCondition.bind(this, actionIndex, index)}></span></div>
																	}
																})
																
															}
															
															</div>)
																	
																})
															}
														<div className="row remove-margin-left remove-margin-right form-group">
															<div className="col-lg-12 no-padding"><span className="text-uppercase">OPERATION</span></div>
															<div className="col-lg-12 no-padding">
																<input type="radio" onChange={self.fromCreate.bind(this, actionIndex)} checked={action.create} /><span >Create </span>
																<input type="radio" onChange={self.fromAssign.bind(this, actionIndex)} checked={action.assign} /><span>Assign</span>
																<input type="radio" onChange={self.fromIncrement.bind(this, actionIndex)} checked={action.incr} /><span>Increment</span>
																<input type="radio" onChange={self.fromDecrement.bind(this, actionIndex)} checked={action.decr} /><span>Decrement</span>
																<input type="radio" onChange={self.fromInvokeExtenalAPI.bind(this, actionIndex)} checked={action.invokeExtr} /><span>Invoke Rest API</span>
															</div>
															{
																['a'].map(function(){
																	if(action.create){
																		return (<div className="col-lg-12 no-padding">
																					<div className="form-group">
																						<input type="text" placeholder="Select Schema" className="form-control" onClick={self.displaySchemasDialogForCreate.bind(this, actionIndex, "schema create")} readOnly="readonly" defaultValue={action.createAct.schemaName} />
																					</div>
																					{
																						['a'].map(function(){
																							if(action.createAct.schemaName){
																								return (<div className="text-center">
																									{
																									action.createAct.props.map(function(createAct, createActIndex){
																										
																										return (<div className="row remove-margin-left remove-margin-right form-group"> 
																													<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5  no-padding-left">
																														<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																														
																														<button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																														 <span data-bind="label">{createAct.left?createAct.left:"Select Property"}</span>
																														 </button>
																														 	<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																														 	{
																														 		Object.keys(allSchemas[action.createAct.schemaName]['@properties']).map(function(prop){
																														 			return (<li onClick={self.setLeftPropForCreate.bind(this, "prop", actionIndex, createActIndex, prop)}><span>{prop}</span></li>)
																														 		})
																														 	}
																														    </ul>
																														 
																														</div>
																													</div>
																												<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left">
																												 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																												   <span data-bind="label" >{"="}</span>
																												 </div>
																												</div>
																											<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5  no-padding-left">
																											 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																											 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																											 <span data-bind="label">{createAct.right?createAct.right:"Select Value"}</span>
																											 </button>
																												 <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																												  <li onClick={self.setRightValueForCreate.bind(this, "text", actionIndex, createActIndex)}><span>Text</span></li>
																												  <li onClick={self.setRightValueForCreate.bind(this, "prop", actionIndex, createActIndex)}><span>Schema Property</span></li>
																												{/* <li onClick={self.setRightValueForCreate.bind(this, "comboprop", actionIndex, createActIndex)}><span>Properties Combo</span></li>*/}
																												 </ul>
																											</div>
																											</div>
																											{
																												['a'].map(function(){
																													if(createActIndex==action.createAct.props.length-1){
																														return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus"  onClick={self.addCreateOper.bind(this, actionIndex, createActIndex)}></span></div>
																													}else{
																														return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus"  onClick={self.removeCreateOper.bind(this, actionIndex, createActIndex)}></span></div>
																													}
																												})
																												
																											}
																											
																											</div>)
																									
																								})
																								}
																								</div>)
																							}
																						})
																					}
																				</div>)
																		
																	}else if(action.assign){
																		/*return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																				    <button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																				      <span data-bind="label">Select Schema</span>
																				    </button>
																				    <ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
																				      <li><span>Select Operand</span></li>
																				      <li><span>Text</span></li>
																				      <li><span>Schema Property</span></li>
																				    </ul>
																				  </div>)*/
																		return (<div>
																					{/*{actionName:"",create:false, assign:false, incr:false, decr:false, forEach:false, forAll:true, forAny:false, conditions:[{left:"",right:"",expr:""}], operation:{}}*/}
																					{ 
																						action.assignAct.map(function(assignAct, assignActIndex){
																						{ /*return (<ConditionComponent condition={condition} addCondition={self.addCondition} actions={self.state.action.conditions} index={index} removeCondition={self.removeCondition}/>) */}
																						return (<div className="row remove-margin-left remove-margin-right form-group"> 
																									<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5  no-padding-left">
																										<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																										{
																											/*Below code is to show dialog box
																											 <button data-toggle="dropdown" className="btn btn-default  form-control" type="button" onClick={self.setLeftProp.bind(this, "prop", actionIndex, assignActIndex)}>
																												<span data-bind="label" ref={(e)=>{self.leftOperand=e}}>{assignAct.left?assignAct.left:"Select Property"}</span>
																											</button>
																											 */
																										}
																										<button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																										 <span data-bind="label">{assignAct.left?assignAct.left:"Select Property"}</span>
																										 </button>
																										 	<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																										 	{
																										 		Object.keys(selectedSchema['@properties']).map(function(prop){
																										 			return (<li onClick={self.setLeftProp.bind(this, "prop", actionIndex, assignActIndex)}><span>{prop}</span></li>)
																										 		})
																										 	}
																										    </ul>
																										 
																										</div>
																									</div>
																								<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left">
																								 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																								   <span data-bind="label" >{"="}</span>
																								 </div>
																								</div>
																							<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5  no-padding-left">
																							 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
																							 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																							 <span data-bind="label">{assignAct.right?assignAct.right:"Select Value"}</span>
																							 </button>
																								 <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																								  <li onClick={self.setRightValue.bind(this, "text", actionIndex, assignActIndex)}><span>Text</span></li>
																								  <li onClick={self.setRightValue.bind(this, "prop", actionIndex, assignActIndex)}><span>Schema Property</span></li>
																								  <li onClick={self.setRightValue.bind(this, "comboprop", actionIndex, assignActIndex)}><span>Properties Combo</span></li>
																								 </ul>
																							</div>
																							</div>
																							{
																								['a'].map(function(){
																									if(assignActIndex==action.assignAct.length-1){
																										return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus"  onClick={self.addAssignOper.bind(this, actionIndex, assignActIndex)}></span></div>
																									}else{
																										return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus"  onClick={self.removeAssignOper.bind(this, actionIndex, assignActIndex)}></span></div>
																									}
																								})
																								
																							}
																							
																							</div>)
																									
																								})
																							}</div>)
																	}else if(action.invokeExtr){
																		return (<div className="col-lg-12 no-padding">
																			<div className="col-lg-12 no-padding">
																				<input type="text" onClick={self.selectRestAPI.bind(this, actionIndex)} className="form-control" placeholder="Select a Service" defaultValue={action.extrData.serviceDoc.serviceName?(action.extrData.serviceDoc.serviceName):''} readOnly="true" />
																			</div>
																			{
																				['a'].map(function(){
																					if(action.invokeExtr && action.extrData.serviceDoc.apiEndPointURL){
																						return (<div className="col-lg-12 no-padding">
																							<div className="col-lg-12 no-padding">
																								<input type="text" readOnly="true" value={action.extrData.serviceDoc.apiEndPointURL} className="form-control"  disabled="disabled" />
																							</div>
																							<div className="col-lg-12 no-padding">
																								<label>Choose a path to invoke</label>
																							</div>
																							{
																									action.extrData.serviceDoc.pathAndParams.map(function(pathAndParam, pathIndex){
																										return(<div className="col-lg-12">
																											{
																												['a'].map(function(){
																													if(pathAndParam.path!="")
																													return (<div className="col-lg-12 no-padding">
																																<input type="radio" checked={action.extrData.path==pathAndParam.path} onChange={self.setPath.bind(this, actionIndex, pathAndParam.path)}/>
																																<span>{pathAndParam.path}</span>
																															</div>)
																												})
																											}
																											
																											{
																												['a'].map(function(){
																													if(action.extrData.path==pathAndParam.path && pathAndParam.path.indexOf("${")!=-1){
																														return (<div  className="col-lg-12 no-padding">
																															<div  className="col-lg-12 no-padding">
																																<span>Path Placeholders:</span>
																															</div>
																															{
																																pathAndParam.pathParams.map(function(pathParam, pathParamIndex){
																																	if(pathParam.key){
																																		return (<div className="col-lg-12 no-padding">
																																				<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={pathParam.key} readOnly={"true"} disabled="disabled"/></div>
																																				<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding">
																																				<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																																					<span data-bind="label">{pathParam.value?pathParam.value:"Select Param Value"}</span>
																																				</button>
																																				<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
																																				  <li onClick={self.setInPathParamVal.bind(this, "text", actionIndex, pathIndex, pathParamIndex)}><span>Text</span></li>
																																				  <li onClick={self.setInPathParamVal.bind(this, "prop", actionIndex, pathIndex, pathParamIndex)}><span>Schema Property</span></li>
																																				 </ul>
																																				</div>
																																			</div>)
																																	}
																																})
																															}
																														</div>)
																													}
																												})
																											}
																											{
																												['a'].map(function(){
																													if(pathAndParam.queryParams.length && action.extrData.path==pathAndParam.path){
																														return (<div  className="col-lg-12 no-padding">
																															<span>Query Parameters: </span>
																														</div>)
																													}
																												})
																											}
																											{
																												pathAndParam.queryParams.map(function(param, paramIndex){
																													if(pathAndParam.path!="" && action.extrData.path==pathAndParam.path){
																														if(param.key){
																															return (<div className="col-lg-12 no-padding">
																																	<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={param.key} readOnly={"true"} disabled="disabled"/></div>
																																	<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding">
																																	<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																																		<span data-bind="label">{param.value?param.value:"Select Param Value"}</span>
																																	</button>
																																	<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
																																	  <li onClick={self.setInParamVal.bind(this, "text", actionIndex, pathIndex, paramIndex)}><span>Text</span></li>
																																	  <li onClick={self.setInParamVal.bind(this, "prop", actionIndex, pathIndex, paramIndex)}><span>Schema Property</span></li>
																																	 </ul>
																																	</div>
																																</div>)
																														}
																													}
																													
																												})
																											}
																											{
																												['a'].map(function(){
																													if(pathAndParam.path!="" && action.extrData.path==pathAndParam.path){
																														return (<div className="col-lg-12 no-padding">
																														<div className="col-lg-6 no-padding"><span>Method</span></div>
																															<div className="col-lg-6 no-padding"><span>{pathAndParam.method}</span></div>
																															{
																																['a'].map(function(){
																																	if(pathAndParam.method!="GET" && pathAndParam.data.length>0){
																																		return (<div className="col-lg-12 no-padding">
																																		<div className="col-lg-12 no-padding">
																																			<span>{pathAndParam.method+" Data:"}</span>
																																		</div>
																																		{
																																		 pathAndParam.data.map(function(data, dataIndex){
																																		 	if(data.dataKey && data.value)
																																			return (<div className="col-lg-12 no-padding margin-bottom-gap">
																																					<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={data.dataKey} readOnly={"true"} disabled="disabled"/></div>
																																					{
																																						['a'].map(function(){
																																							if((data.value=="Array of Objects" || data.value=="Object") && data.child.length ){
																																								return (<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={data.value} readOnly={"true"} disabled="disabled"/></div>)
																																							}
																																						})
																																					}
																																					{/*
																																						['a'].map(function(){
																																							if(data.value=="Array of Objects" || data.value=="Array of Strings/Numbers"){
																																								return (<div className="col-lg-12 no-padding">
																																											<div className="col-lg-6 no-padding">
																																												<span>Select Reference</span>
																																											</div>
																																											<div className="col-lg-6 no-padding">
																																												<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																																														<span data-bind="label">{data.value?data.value:"Select Param Value"}</span>
																																													</button>
																																													<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
																																													  <li onClick={self.setArrayRef.bind(this, "text", actionIndex, pathIndex, dataIndex)}><span>Text</span></li> 
																																													  <li onClick={self.setArrayRef.bind(this, "prop", actionIndex, pathIndex, dataIndex)}><span>Schema Property</span></li>
																																													 </ul>
																																											</div>
																																										</div>)
																																							}
																																						})
																																					*/}
																																					{
																																						['a'].map(function(){
																																							if((data.value=="Array of Objects" || data.value=="Object") && data.child.length ){
																																								return data.child.map(function(child, childIndex){
																																									return (<DataConfiguration dataKey={child.dataKey} value={child.value} dataIndex={dataIndex} child={child.child} parent={data} callback={self.updateData} childIndex={childIndex} pathIndex={pathIndex} actionIndex={actionIndex} />)
																																								})
																																							}else{
																																								return (<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding">
																																										<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																																											<span data-bind="label">{data.value?data.value:"Select Param Value"}</span>
																																										</button>
																																										<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
																																										  <li onClick={self.setInDataVal.bind(this, "text", actionIndex, pathIndex, dataIndex)}><span>Text</span></li>
																																										  <li onClick={self.setInDataVal.bind(this, "prop", actionIndex, pathIndex, dataIndex)}><span>Schema Property</span></li>
																																										 </ul>
																																										</div>)
																																							}
																																						})
																																					}
																																				</div>)
																																		 })
																																		}
																																		</div>)
																																	}
																																})
																															}
																															{
																																/*
																																 * <div className="col-lg-12 no-padding"> </div>
																																	<div className="col-lg-12 no-padding">
																																		<input className="btn btn-warning upload-drop-zone" type="button" value="TEST" onClick={self.testAPI.bind(this, actionIndex, pathIndex)} />
																																	</div>
																																 * 
																																 * */
																															}
																															
																														</div>)
																													}
																												})
																											}
																										</div>)
																									})
																									
																							}
																							{/*
																								['a'].map(function(){
																									if(Object.keys(action.extrData.serviceDoc.parameters).length>0){
																										
																										return (
																											<div className="col-lg-12 no-padding">
																											<div className="col-lg-12 no-padding"><input type="checkbox" /><span>Include Params</span></div>
																											{
																												Object.keys(action.extrData.serviceDoc.parameters).map(function(param){
																												return (<div className="col-lg-12 no-padding">
																													<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={param} readOnly={"true"} /></div>
																													<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={action.extrData.serviceDoc.parameters[param]} readOnly={"true"} /></div>
																												</div>)
																												})
																											}
																											</div>)
																									}
																								})
																								
																							*/}
																							{/*
																								action.extrData.userInputs.map(function(userInput, inputIndex){
																									
																									return (<div className="col-lg-12 no-padding">
																													<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={userInput.name} placeholder="Enter input param name" onBlur={self.setUserInput.bind(this, "name", actionIndex, inputIndex)}  /></div>
																													<div className="col-lg-6 no-padding"><input type="text" className="form-control" defaultValue={userInput.value} placeholder="Enter input param value" onBlur={self.setUserInput.bind(this, "value", actionIndex, inputIndex)}  /></div>
																												</div>)
																								})
																								
																								
																								
																								
																								<div className="col-lg-12 no-padding">
																								<div className="col-lg-6 no-padding"><span>Choose Method</span></div>
																								<div className="col-lg-6 no-padding">
																									<button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																									 	<span data-bind="label">{action.extrData.method?action.extrData.method:"Select a method"}</span>
																									</button>
																									<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																									  <li onClick={self.setMethod.bind(this, actionIndex)}><span>GET</span></li>
																									  <li onClick={self.setMethod.bind(this, actionIndex)}><span>PUT</span></li>
																									  <li onClick={self.setMethod.bind(this, actionIndex)}><span>POST</span></li>
																									  <li onClick={self.setMethod.bind(this, actionIndex)}><span>DELETE</span></li>
																									 </ul>
																								</div>
																							</div>
																							
																							<div className="col-lg-12 no-padding">
																								<label>Final URL :</label>
																							</div>
																							<div className="col-lg-12 no-padding">
																								<span>{action.extrData.finalURL}</span>
																							</div>
																							<div className="col-lg-12 no-padding">
																								<label>Parse Result as: </label>
																							</div>
																							<div className="col-lg-12 no-padding">
																								<input type="text" className="form-control" defaultValue={action.extrData.parseResult} onBlur={self.setResultParse.bind(this, actionIndex)}/>
																							</div>
																							
																							{
																								['a'].map(function(){
																									if(action.extrData.result){
																										return (<div className="col-lg-12 no-padding">
																											<label>Result: </label>
																											<span className="text-area"> {action.extrData.result}</span>
																										</div>)
																									}
																								})
																							}
																							
																							
																							*/}
																							
																						</div>)
																					}
																				})
																			}
																		</div>)
																		//self.state.actions[actionIndex].invokeExtr=false;
																	}
																})
															}
														</div>
														{
															['a'].map(function(){
																if(action.invokeExtr && action.extrData.result.length){
																	return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group">
																		<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left">
																			<span>Select Property</span>
																		</div>
																		<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left">
																			<span>Enter Parsing Text</span>
																		</div>
																	</div>)
																}
															})
														}
														{
															action.extrData.result.map(function(mapJ, mapIndex){
																
																if(action.invokeExtr && action.extrData && action.extrData.serviceDoc 
																		&& action.extrData.serviceDoc.apiEndPointURL){
																			
																	return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group">
																				<div className="col-lg-5 col-md-5 col-xs-5 col-sm-5 no-padding-left">
																				<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
																					<span data-bind="label">{mapJ.prop?mapJ.prop:"Select Property"}</span>
																				</button>
																				<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																				 	{
																				 		Object.keys(selectedSchema['@properties']).map(function(prop){
																				 			return (<li onClick={self.setResultProp.bind(this, actionIndex, mapIndex, prop)}><span>{prop}</span></li>)
																				 		})
																				 	}
																			    </ul>
																			 </div>
																			<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding-left">
																				<input type="text" className="form-control" defaultValue={mapJ.parseAs?mapJ.parseAs:""} placeholder="Enter parsing notation" onBlur={self.setResultParse.bind(this, actionIndex, mapIndex)} />
																			</div>
																			{
																				['a'].map(function(){
																					if(mapIndex==action.extrData.result.length-1){
																						return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus"  onClick={self.addMoreResult.bind(this, actionIndex, mapIndex)}></span></div>
																					}else{
																						return <div className="col-lg-1 col-md-1 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus"  onClick={self.removeMoreResult.bind(this, actionIndex, mapIndex)}></span></div>
																					}
																				})
																			}
																		</div>)
																}
															})
														}
															
														<div>
															<div>
																<input type="checkbox" onChange={self.setErrorMsg.bind(this, actionIndex)} defaultChecked={action.errorMsg} /><span className="text-uppercase"> configure error message for above action</span>
															</div>
															{
																['a'].map(function(){
																	if(action.errorMsg){
																		return (<div><input type="text" className="form-control" defaultValue={action.errorMsgValue} onBlur={self.setErrorMsgVal.bind(this, actionIndex)} placeholder="Enter Error Message"/></div>)
																	}
																})
															}
														</div>
													</div>
											))
										
									})
								}
							</div>
							<div  className="row no-margin ">
								<input type='button' className="btn  btn-warning upload-drop-zone"   value='DONE' onClick={self.done}/>
							</div>
						</div>
						
						
					</div>
				</div>)
	}
});
exports.editTrigger=editTrigger;
exports.createTrigger=createTrigger;


/**
 *used to fill the data in dialogbox 
 */
var GetObjectRelationPopup = React.createClass({
	componentDidMount : function(){
		if(this.props.search){
			$("div#search").find("input:text").show();
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
		var refSchema = this.propschema;
		var targetEle = this.props.targetEle;
		var callback=this.props.calback;
		var action=this.props.action;
		console.log(this.props);
		/*if(!id.id){//for adding titles on dialogbox
			if($("div#"+id).find("input:radio.lookup").is(":checked")){
				$("#header").find("label").text("Select lookup record");
			}else if($("div#"+id).find("input:radio.child").is(":checked")){
				$("#header").find("label").text("Select parent record");
			}
		}*/
		if(action=="addAction"){
			return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						
					</div>)
		}else if(fieldData){
			if($.type(fieldData) == "array"){
				return (
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					{
						fieldData.map(function(data){
							if($.type(data) == "object"){
								return (
									 <div className="row no-margin ">
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={callback.bind(this,data,id,targetEle)} >
					            	   		<span className="fieldText link">{data.id}</span>
					            	    </div>
			            	        </div>
								 )
							}else{
								return (
									 <div className="row no-margin ">
										 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={callback.bind(this,data,id,targetEle)} >
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
				if(showProps){
					return (
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						{
							/*Object.keys(fieldData["@properties"]).map(function(data){
								if($.type(fieldData["@properties"][data]) == "object"){
									return (
										 <div className="row no-margin ">
											 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={fillData2.bind(this,data,id,fieldData,doublePopup,exitPost)} >
						            	   		<span className="fieldText link">{data}</span>
						            	    </div>
				            	        </div>
									 )
								}
							})*/
							showProps.map(function(data){
								if($.type(fieldData["@properties"][data]) == "object"){
									return (
										 <div className="row no-margin ">
											 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding"  onClick={fillSelectedSchema.bind(this,data,id,fieldData,doublePopup,exitPost,targetEle)} >
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
});

exports.GetObjectRelationPopup=GetObjectRelationPopup;


var ShowProperties=React.createClass({
	getInitialState: function(){
		return {prop:true, sysProp:false, rels:false};
	},
	fromProps:function(e){
		this.setState({prop:true, sysProp:false, rels:false});
	},
	fromRels:function(e){
		this.setState({prop:false, sysProp:false, rels:true});
	},
	fromSysProps:function(){
		this.setState({prop:false, sysProp:true, rels:false});
	},
	showProps:function(val, actionIndex, condIndex, dialogVal, propJson){
		//opr, actionIndex, condIndex, "props", currProps[opr]
		var self=this;
		console.log(arguments);
		
		if(propJson.dataType && propJson.dataType.type=="object" && propJson.dataType.refKey=="recordId" && propJson.dataType.objRef && allSchemas[propJson.dataType.objRef]){
			var id=self.props.id;
			var title = this.props.title;
			var search = this.props.search;
			var target = this.props.target;
			var schema=allSchemas[propJson.dataType.objRef];
			var callback=self.props.callback;
			if(!document.getElementById('myModel')){
				$("body").append("<div id='myModel' ></div>");
			}
			console.log(schema);
			ReactDOM.render(<PropertiesDialog  key={global.guid()} schema={schema} callback={callback} val={val} actionIndex={actionIndex} condIndex={condIndex} dialogVal={dialogVal}/>, document.getElementById('myModel'));
			$("#myModelDialog").modal("show");
		}else if(propJson.dataType && propJson.dataType.type=="struct" && propJson.dataType.structRef && allSchemas[propJson.dataType.structRef]){
			
			var schema=allSchemas[propJson.dataType.structRef];
			var callback=self.props.callback;
			if(!document.getElementById('myModel')){
				$("body").append("<div id='myModel' ></div>");
			}
			console.log(schema);
			ReactDOM.render(<PropertiesDialog  key={global.guid()} schema={schema} callback={callback} val={val} actionIndex={actionIndex} condIndex={condIndex} dialogVal={dialogVal}/>, document.getElementById('myModel'));
			$("#myModelDialog").modal("show");
		}else{
			self.props.callback(val, actionIndex, condIndex, dialogVal, propJson);
		}
	},
	render:function(){
		var self=this;
		var callback=self.props.callback;
		var actionIndex=self.props.actionIndex;
		var condIndex=self.props.index;
		var properties=[];
		if(self.props.schema["@properties"]){
			properties=Object.keys(self.props.schema["@properties"]);
		}
		var relations=[];
		if(self.props.schema['@relations'] && self.props.forEach=="true"){
			relations=Object.keys(self.props.schema['@relations']);
		}
		var sysProps=[];
		if(self.props.schema['@sysProperties']){
			sysProps=Object.keys(self.props.schema['@sysProperties']);
		}
		var currProps=self.props.schema['@properties'];
		var className="";
		if(properties.length && relations.length && sysProps.length){
			className="col-lg-4 col-md-4 col-xs-4 col-sm-4 no-padding";
		}else if(properties.length && relations.length || properties.length && sysProps.length || relations.length&&properties.length){
			className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding";
		}else{
			className="col-lg-12 col-md-12 col-xs-12 col-sm-5  no-padding";
		}
		
		
		return (
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-5  no-padding-left">
				<div className=""><span>Choose from</span></div>
	  			<div>
	  			{
	  				['a'].map(function(){
	  					if(properties.length){
	  						return (<div className={className}><input type="radio" className="propRelations" onChange={self.fromProps} checked={self.state.prop} /> <span>Properties </span></div>)
	  					}
	  				})
	  			}
	  			{
	  				['a'].map(function(){
	  					if(relations.length){
	  						return (<div className={className}><input type="radio" className="propRelations" onChange={self.fromRels} checked={self.state.rels} /><span> Relations </span></div>)
	  					}
	  				})
	  			}
	  			{
	  				['a'].map(function(){
	  					if(sysProps.length){
	  						return (<div className={className}><input type="radio" className="propRelations" onChange={self.fromSysProps} checked={self.state.sysProp} /><span> System Properties </span></div>)
	  					}
	  				})
	  			}
		  			 
	  			 </div>
				
				{
					['a'].map(function(){
						if(self.state.prop){
							return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
								 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
								   <span data-bind="label" ref={(e)=>{self.operator=e}}>Select Property</span>
								  </button>
								  <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
								  {
								  	properties.map(function(opr, index){
								  		return <li onClick={self.showProps.bind(this, opr, actionIndex, condIndex, "props", currProps[opr])}><span> {opr} </span></li>
								  	})
								  }
								  </ul>
								 </div>)
						}else if(self.state.rels){
							return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
										<RelationsComp relations={relations} callback={callback} actionIndex={actionIndex} condIndex={condIndex}/>
								 </div>)
						}else{
							return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
								 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
								   <span data-bind="label" ref={(e)=>{self.operator=e}}>Select System Properties</span>
								  </button>
								  <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
								  {
								  	sysProps.map(function(opr, index){
								  		return <li onClick={callback.bind(this, opr, actionIndex, condIndex, "sysProp", relations)}><span> {opr} </span></li>
								  	})
								  }
								  </ul>
								 </div>)
						}
					})
				}
				 
			</div>
			)
	}
});


var RelationsComp=React.createClass({
	getInitialState:function(){
		return {text:""};
	},
	onChange:function(val){
		console.log(arguments);
		this.state.text=val;
		this.setState({text:this.state.text});
	},
	render:function(){
		var relations=this.props.relations;
		var self=this;
		var calbk=this.props.callback;
		if(this.props.relations && this.props.relations.length==0){
			relations=[];
		}
		return (<div>{
					relations.map(function(relName){
						return (<div className="col-lg-12">
									<div className="col-lg-6">
								  	<input type="radio" className="propRelations" onChange={self.onChange.bind(this, relName)} checked={self.state.text==relName} /><span >{(selectedSchema['@relations'][relName]['relationName'])+" ("+(selectedSchema['@relations'][relName]['relationRefSchema'])+")"} </span>
								  </div>
								  
								  <div className="col-lg-6">
									<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
								  		<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button" disabled={self.state.text!=relName}><span data-bind="label">Select Property</span></button>
									  <ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
										  {
										  	Object.keys(allSchemas[selectedSchema['@relations'][relName]['relationRefSchema']]['@properties']).map(function(prop){
										  		return (<li onClick={calbk.bind(this, selectedSchema['@relations'][relName]['relationName']+"."+prop, self.props.actionIndex, self.props.condIndex, "rels", relations)}><span>{prop}</span></li>)
										  	})
										  }
									  </ul>
								 	</div>
								</div>
								</div>) 
					})
				}</div>)
		
	}
});

function storeActions(triggerDoc, state){
	/*
	 {actionName:"",
	 errorMsg:false, errorMsgValue:"",
	 create:false, assign:false, incr:false, decr:false,
	 forEach:false, forAll:true, forAny:false,
	 createAct:{schemaName:""},
	 assignAct:[{left:"",right:""}],
	 incrAct:{},
	 decrAct:{},
	 conditions:[{left:"",right:"",expr:""}],
	 operation:{}}
	 * */
	
	
	
}



var PropertiesDialog=React.createClass({
	getInitialState:function(){
		var self=this;
		console.log(self.props);
		return {text:self.props.val, schema: self.props.schema};
	},
	showProps:function(propJson, ev){
		var self=this;
		if(propJson.dataType && propJson.dataType.type=="object" && propJson.dataType.refKey=="recordId" && propJson.dataType.objRef && allSchemas[propJson.dataType.objRef]){
			
			var text = self.state.text+"."+(ev.target.innerText);
			var schema=allSchemas[propJson.dataType.objRef];
			self.setState({text:text, schema:schema});
		}else if(propJson.dataType && propJson.dataType.type=="struct" && propJson.dataType.structRef && allSchemas[propJson.dataType.structRef]){
			var text = self.state.text+"."+(ev.target.innerText);
			var schema=allSchemas[propJson.dataType.structRef];
			self.setState({text:text, schema:schema});
		}else{
			var val=self.props.val;
			var actionIndex=self.props.actionIndex;
			var condIndex=self.props.condIndex;
			var dialogVal=self.props.dialogVal;
			$("#myModelDialog").hide();
			self.props.callback((self.state.text+"."+(ev.target.innerText)), actionIndex, condIndex, dialogVal);
			//self.invokeBack(arguments);
		}
		
	},
	shouldComponentUpdate:function(nextProps, nextState){
		return ((JSON.stringify(this.state))!=(JSON.stringify(nextState)));
	},
	componentDidMount:function(){
		
		$(this.myFoot).find("input[type='button']").show();
	},
	invokeBack:function(){
		console.log();
		console.log(arguments);
	},
	render:function(){
		var self=this;
		var title="Select Property";
		var schema=this.state.schema;
		console.log(self.props);
		var properties=[];
		var callback=this.props.callback;
		if(schema['@properties']){
			properties=Object.keys(schema['@properties']);
		}
		return (<div id="myModelDialog" className="modal fade " role="dialog">
					  <div className="modal-dialog">
					    <div className="modal-content">
					      <div className="modal-header">
					   		<button aria-label="Close" data-dismiss="modal" className="close" type="button"><span className="sleekIcon-delete fa-2x link" aria-hidden="true" /></button>
					        <label className="text-uppercase">{title}</label>	
					      </div>
					      <div className="modal-body">
					      	<div className="row no-margin">
					      		<span >{self.state.text}</span>
					      	</div>
						      	<div>
						      		{
						      			<div className="col-lg-6">
											<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
										  		<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button"><span data-bind="label">Select Property</span></button>
											  <ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
												  {
												  	properties.map(function(prop){
												  		return (<li onClick={self.showProps.bind(this, schema['@properties'][prop])}><span>{prop}</span></li>)
												  	})
												  }
											  </ul>
										 	</div>
										</div>
						      		}
								</div>
					      </div>
					      <div className="modal-footer" ref={(e)=>{this.myFoot=e}}>
					      		<label className="">
              						<input type='button' className="btn  btn-warning" value='OK' onClick={self.invokeBack}/>
              					</label>
					      </div>
					    </div>
					  </div>
					</div>)
   }
});

function extractCondition(cond){
	var co={left:"", right:"", expr:""};
	
	if(cond.indexOf("==")!=-1){
		co.expr="==";
	}else if(cond.indexOf("!=")!=-1){
		co.expr="!=";
	}else if(cond.indexOf("<=")!=-1){
		co.expr="<=";
	}else if(cond.indexOf(">=")!=-1){
		co.expr=">=";
	}else if(cond.indexOf(">")!=-1){
		co.expr=">";
	}else if(cond.indexOf("<")!=-1){
		co.expr="<";
	}
	console.log(cond);
	co.left=cond.split(/>=|<=|==|<|>|!=/g)[0];
	co.right=cond.split(/>=|<=|==|<|>|!=/g)[1];
	return co;
}


var comboIndex;
var ComboPropDialog = React.createClass({
	getInitialState:function(){
		var self=this;
		var schema=self.props.schema;
		return {text:"",schema:schema, propsArray:[{text:""}]};
	},
	setText:function(val, actionIndex, condIndex, dialogVal, index){
		console.log("setText called");
		var self=this;
		if(index>=0){
			comboIndex=index;
		}
		var selectedSchemaName=self.props.schema['@id'];
		if(val.indexOf(".")==-1){
			var propJson = this.state.schema['@properties'][val];
			console.log(arguments);
			//(propJson.dataType && propJson.dataType.type=="object" && propJson.dataType.refKey=="recordId" && propJson.dataType.objRef && allSchemas[propJson.dataType.objRef]){
			if(propJson.dataType && propJson.dataType.type=="object" && propJson.dataType.refKey=="recordId" && propJson.dataType.objRef && allSchemas[propJson.dataType.objRef]){
				var schema=allSchemas[propJson.dataType.objRef];
				var callback=self.props.callback;
				if(!document.getElementById('myModel')){
					$("body").append("<div id='myModel' ></div>");
				}
				console.log(schema);
				ReactDOM.render(<PropertiesDialog  key={global.guid()} schema={schema} callback={self.setText} val={val} actionIndex={actionIndex} condIndex={condIndex} dialogVal={dialogVal}/>, document.getElementById('myModel'));
				$("#myModelDialog").modal("show");
			}else if(propJson.dataType && propJson.dataType.type=="struct" && propJson.dataType.structRef && allSchemas[propJson.dataType.structRef]){
				
				var schema=allSchemas[propJson.dataType.structRef];
				var callback=self.props.callback;
				if(!document.getElementById('myModel')){
					$("body").append("<div id='myModel' ></div>");
				}
				console.log(schema);
				ReactDOM.render(<PropertiesDialog  key={global.guid()} schema={schema} callback={self.setText} val={val} actionIndex={actionIndex} condIndex={condIndex} dialogVal={dialogVal}/>, document.getElementById('myModel'));
				$("#myModelDialog").modal("show");
			}else{
				console.log(arguments);
				var propsArray=self.state.propsArray;
				propsArray[index].text=selectedSchemaName+"."+val;
				console.log(propsArray);
				var text="";
				
				propsArray.forEach(function(cText, index){
					if(index>0){
						text=text+"+";
					}
					text=text+cText.text;
				});
				console.log(text);
				self.setState({text:text, propsArray:propsArray});
				//self.setState({propsArray:propsArray});
				
			}
		}else{
			console.log("comboindex: "+comboIndex);
			console.log(arguments);
			$($(".modal-backdrop")[0]).remove();
			var propsArray=self.state.propsArray;
			propsArray[comboIndex].text=selectedSchemaName+"."+val;
			var text="";
			propsArray.forEach(function(cText, index){
				if(index>0){
					text=text+"+";
				}
				text=text+cText.text;
			});
			console.log(text);
			console.log(propsArray);
			self.setState({text:text, propsArray:propsArray});
		}	
		
	},
	addComboProp:function(){
		var self=this;
		var propsArray=self.state.propsArray;
		propsArray.push({text:''});
		self.setState({propsArray:propsArray});
		
	},
	removeComboProp:function(index){
		var self=this;
		var propsArray=self.state.propsArray;
		propsArray.splice(index,1);
		var text="";
		propsArray.forEach(function(cText, index){
			if(index>0){
				text=text+"+";
			}
			text=text+cText.text;
		});
		self.setState({propsArray:propsArray, text:text});
		console.log(arguments);
	},
	componentDidMount:function(){
		var self=this;
		$("div#footer").remove();
		/*
		$("#genericDilog").find("#footer").find("input").on("click", function(){
			self.props.callback(self.state.text, self.props.actionIndex, self.props.index, "comboprop");
			
		});*/
	},
	done:function(){
		var self=this;
		if(self.state.text){
			self.props.callback(self.state.text, self.props.actionIndex, self.props.index, "comboprop");
			$('#genericDilog,.modal-backdrop').remove();
		}else{
			$('#genericDilog,.modal-backdrop').remove();
		}
	},
	componentWillUnmount:function(){
		console.log(arguments);
	},
	render:function(){
		var self=this;
		console.log(self.props);
		console.log(self.state);
		var schema=self.props.schema;
		var propsArray=self.state.propsArray;
		var actionIndex=self.props.actionIndex;
		var condIndex=self.props.index;
		var properties=[];
		var callback=this.props.callback;
		if(schema['@properties']){
			properties=Object.keys(schema['@properties']);
		}
		//ReactDOM.render(<ShowProperties callback={self.setRightValue} schema={selectedSchema} actionIndex={actionIndex} index={actIndex}/>, document.getElementById('genericPopupBody'));
		return (<div>
				<div className=""><span>{self.state.text}</span></div>
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					{
						propsArray.map(function(prop, propIndex){
							return (<div>
									<div className="col-lg-10 col-md-10 col-xs-10 col-sm-10 no-padding">
									 <button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
									   <span data-bind="label" ref={(e)=>{self.operator=e}}>{prop.text?prop.text:"Select Property"}</span>
									  </button>
									  <ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
									  {
									  	properties.map(function(opr, index){
									  		return <li onClick={self.setText.bind(this, opr, actionIndex, condIndex, "props", propIndex)}><span> {opr} </span></li>
									  	})
									  }
									  </ul>
								 </div>
								 {
									['a'].map(function(){
										if(propIndex==propsArray.length-1){
											return <div className="col-lg-2 col-md-2 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus"  onClick={self.addComboProp.bind(this, propIndex)}></span></div>
										}else{
											return <div className="col-lg-2 col-md-2 col-xs-12 col-sm-5  no-padding-left"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus"  onClick={self.removeComboProp.bind(this, propIndex)}></span></div>
										}
									})
									
								}
							</div>)
						})
					}
				</div>
				<div className="modal-footer">
					<label>
						<input className="btn btn-warning" type="button" value="OK" onClick={self.done} />
					</label>
				</div>
				</div>);
		
	}
});



var ShowTriggers=React.createClass({
	getInitialState:function(){
		return {selectedTrigger: ''};
	},
	componentDidMount:function(){
		$("div#footer").remove();
	},
	editTrigger:function(){
		var self=this;
		if(self.state.selectedTrigger==""){
			alert("Select a Trigger to Edit");
		}else{
			common.startLoader();
			WebUtils.doPost("/trigger?operation=getTriggerDoc",{triggerDocId: self.state.selectedTrigger},function(triggerDoc){
				if(triggerDoc.error){
					common.stopLoader();
					alert("Trigger Document not found");
				}else{
					common.stopLoader();
					$('#genericDilog,.modal-backdrop').remove();
					self.props.callback(triggerDoc.triggerDoc, "true");
				}
				
			});
		}
	},
	close:function(){
		$('#genericDilog,.modal-backdrop').remove();
	},
	setTrigger:function(triggerName){
		this.setState({selectedTrigger:triggerName});
	},
	render:function(){
		var self=this;
		var triggers=self.props.triggers;
		
		return (<div>
					<div>
					<span>Below are the Triggers configured for selected schema, select and click EDIT Or NEW</span>
					</div>
				{
					triggers.map(function(triggerName){
						
						return (<div className="col-lg-12">
								  	<input type="radio" className="propRelations" onChange={self.setTrigger.bind(this, triggerName)} checked={self.state.selectedTrigger==triggerName} />
								  	<span >{triggerName} </span>
								  </div>)
					})
				}
				<div className="modal-footer">
					<label className="">
						<input type="button" className="btn  btn-warning" value="New" onClick={self.close}/>
					</label>
		      		<label className="">
  						<input type='button' className="btn  btn-warning" value='Edit' onClick={self.editTrigger.bind()}/>
  					</label>
		      	</div>
		      </div>)
	}
});



var DataConfiguration = React.createClass({
	getInitialState:function(){
		var self=this;
		return {dataKey: self.props.dataKey, 
				value: self.props.value,
				child: self.props.child,
				dataIndex: self.props.dataIndex,
				parent: self.props.parent,
				childIndex: self.props.childIndex};
	},
	setInDataVal:function(val){
		
		var self=this;
		if(val=="text"){
			var txt = prompt("Enter value for Text");
			//console.log(txt);
			while(!txt){
				txt = prompt("Enter value for Text");
			}
			
			self.state.parent.child[self.state.childIndex].value=txt;
			
			if(self.props.callback)
			self.props.callback(self.state.parent, self.props.actionIndex, self.props.pathIndex, self.props.dataIndex, self.state.childIndex);
			
		}else if(val=="prop"){
			
			if(!selectedSchema['@id']){
				alert("Select Schema");
				return;
			}
			manageSchema.getPopupContent("Select Schema Property","","ADD","","");
			ReactDOM.render(<ShowProperties callback={self.setInDataVal} schema={selectedSchema} actionIndex={self.props.actionIndex} index={self.props.pathIndex}/>, document.getElementById('genericPopupBody'));
		}else{
			$("input:text#initialStateInput").val("");
			$('#genericDilog,.modal-backdrop').remove();
			console.log(arguments);
			self.state.parent.child[self.state.childIndex].value=selectedSchema['@id']+"."+val;
			if(self.props.callback)
			self.props.callback(self.state.parent, self.props.actionIndex, self.props.pathIndex, self.props.dataIndex, self.state.childIndex);
			/*
			if(paramIndex=="props" || paramIndex=="sysProp"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].pathParams[currIndex].value=selectedSchema['@id']+"."+val;
			}else if(paramIndex=="rels"){
				self.state.actions[actionIndex].extrData.serviceDoc.pathAndParams[index].pathParams[currIndex].value=selectedSchema['@id']+"->"+val;
			}
			self.setState({actions:self.state.actions});
			*/
		}
		
		
		/*
		self.state.dataKey=ev.target.value;
		self.state.parent.child[self.state.childIndex].dataKey=ev.target.value;
		
		console.log("Parent key: "+self.state.parent.child[self.props.childIndex].dataKey);
		if(self.props.callback)
		self.props.callback(self.state.parent, self.props.pathIndex);
		*/
		//self.setState({dataKey: self.state.dataKey, parent: self.state.parent});
	},
	render:function(){
		var self=this;
		console.log(self);
		
		return (<div className="col-lg-12">
				<div className="col-lg-12 no-padding">
					<span>{self.state.parent.dataKey}</span>
				</div>
				<div className="col-lg-6 col-md-6 col-xs-12 col-sm-6 no-padding">
			     	 <input type="text" className="form-control" readOnly={"true"} disabled="disabled" defaultValue={self.state.dataKey?self.state.dataKey:''} />
				</div>
				{
					['a'].map(function(){
						if((self.state.value=="Array of Objects" || self.state.value=="Object") && self.state.child.length ){
							<div className="col-lg-6 col-md-6 col-xs-12 col-sm-6 no-padding">
						     	 <input type="text" className="form-control" readOnly={"true"} disabled="disabled" defaultValue={self.state.value?self.state.value:''} />
							</div>
						}
					})
				}
				{
					['a'].map(function(){
						if(self.state.child && self.state.child.length){
							return self.state.child.map(function(child, childIndex){
								return (<DataConfiguration dataKey={child.dataKey} value={child.value} dataIndex={self.props.dataIndex} child={child.child} parent={self.state} childIndex={childIndex}  callback={self.props.callback} pathIndex={self.props.pathIndex} actionIndex={self.props.actionIndex} />)
							})
						}else{
							return (<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6 no-padding">
										<button data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
											<span data-bind="label">{self.state.value?self.state.value:"Select Param Value"}</span>
										</button>
										<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
											  <li onClick={self.setInDataVal.bind(this, "text", self.props.actionIndex, self.props.pathIndex, self.state.dataIndex)}><span>Text</span></li>
											  <li onClick={self.setInDataVal.bind(this, "prop", self.props.actionIndex, self.props.pathIndex, self.state.dataIndex)}><span>Schema Property</span></li>
										 </ul>
									</div>)
						}
					})
				}
				</div>)
	}
});