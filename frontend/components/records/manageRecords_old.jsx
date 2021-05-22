/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var genericView=require("../view/genericView.jsx");
var FilterResults=require("../nav/filters.jsx").FilterResults;
//var reactCrop=require('./imageCrop.jsx');
var ActionCreator = require('../../actions/ActionCreator.js');
var SchemaStore = require('../../stores/SchemaStore');
var JunctionStore=require('../../stores/JunctionStore');
var RecordDetailStore = require('../../stores/RecordDetailStore');
var count = 100000;//used for adding dynamic id to newly created array element
var lookupData = {};//used to store all lookup fileds document data
var finalObject1 = {};//used to hold multiple objs data(like object type,struct type[used in record creation])
var formulaFields = {};//used to store formula type property tempararly used in record saving
var DefinitionStore = require('../../stores/DefinitionStore');
var WebUtils=require('../../utils/WebAPIUtils.js');
var utility=require('../Utility.jsx');

var fileAttachment = {};//used to store file attacments
var imgIds=[];
var savedImgIds = [];
var limitCount=require("../../utils/global.js").limitCount*2;//18;
var RecordSummaryStore = require('../../stores/RecordSummaryStore');
var countriesList;//=[{countryCode:91,totalDigits:10,countryName:"India"},{countryCode:1,totalDigits:10,countryName:"US"},{countryCode:61,totalDigits:10,countryName:"Australia"},{countryCode:55,totalDigits:10,countryName:"Brazil"},{countryCode:1,totalDigits:10,countryName:"Canada"},{countryCode:86,totalDigits:10,countryName:"China"},{countryCode:49,totalDigits:10,countryName:"Germany"},{countryCode:39,totalDigits:10,countryName:"Italy"},{countryCode:34,totalDigits:10,countryName:"Spain"},{countryCode:66,totalDigits:10,countryName:"Thailand"},{countryCode:84,totalDigits:10,countryName:"Vietnam"},{countryCode:44,totalDigits:10,countryName:"United Kingdom"},{countryCode:62,totalDigits:10,countryName:"Indonesia"},{countryCode:30,totalDigits:10,countryName:"Berlin"},{countryCode:27,totalDigits:10,countryName:"SouthAfrica"},{countryCode:90,totalDigits:10,countryName:"Turkey"}];
var getURLContent=require('../view/components/getURLContent.jsx');

var linkGenerator=require('../nav/linkGenerator.jsx');
var global=require('../../utils/global.js');

var Link=require('react-router').Link;
var browserHistory=require('react-router').browserHistory;
var Editor = require('./richTextEditor.jsx').MyEditor;
var TagsInput=require('./tagsInput.jsx').TagsInput;
var ServerActionReceiver=require('../../actions/ServerActionReceiver.js');
var groupBy=require('../view/components/groupBy.jsx');

function createNewRecord(type,ev){
	ReactDOM.render(<CreateNewRecord  type={type}/>,document.getElementById('dynamicContentDiv'));
}
exports.createNewRecord=createNewRecord;

var CreateRecord=React.createClass({
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return <CreateNewRecord type={"new"}/>
	}
});
exports.CreateRecord=CreateRecord;

var EditRecord=React.createClass({
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return <CreateNewRecord type={"edit"}/>
	}
});
exports.EditRecord=EditRecord;

var CreateNewRecord = React.createClass({
	getInitialState: function() {
	    return {helpText: DefinitionStore.getDefinition("HelpTextForRecord") ,customSchema:undefined};
	},
	openRecords : function(schemalist,ev){
		var type = this.props.type;
		getPopupContent("Select Schema","search","");
		ReactDOM.render(<ShowSchemaNames fieldData = {schemalist}   search={"search"} type= {type} POT = {this}/>,document.getElementById('genericPopupBody'));
	},
	_onChange:function(){
		this.setState({helpText:DefinitionStore.getDefinition("HelpTextForRecord")});
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
  	componentDidMount:function(){
  		var self=this;
		WebUtils.doPost("/schema?operation=getCustomSchema",{},function(result){
			self.setState({customSchema : result.data});
		});
  		ActionCreator.getDefinition("HelpTextForRecord");
		DefinitionStore.addChangeListener(this._onChange);
  	},
	render : function(){
		var type = this.props.type;
		var title;
		var self=this;
		if(type=="new"){
			title = "Create New Record";
		}else if(type == "edit"){
			title = "Edit Existing Record";
		}
		var openRecords = this.openRecords;
		if(!this.state.customSchema){
			return <div>Loading...!</div>
		}
		return  (<div className="row">
					<h3 className="remove-margin-top">{title}</h3>
		            <div className="row no-margin ">
					 	<div className="row margin-bottom-gap remove-margin-left remove-margin-right ">
							<div className="col-lg-6 col-md-6 col-xs-12 col-sm-10 no-padding " >
								 <input type='text' ref={(e)=>{this.schema_name=e}} id="schema_name" className="form-control remove-padding-left relationWith" placeholder="Select schema" onClick={openRecords.bind(null,this.state.customSchema)}/>
							 </div>
							 {
								["a"].map(function(temp){
									var classNames="hidden helpText";
									var textValue="";
									if(self.state.helpText && self.state.helpText["schema_name"]!=""){
										classNames="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding helpText";
										textValue=self.state.helpText["schema_name"];
									}
									return(<div className={classNames}>{textValue}</div>)

								})
							}
			            </div>
		            </div>
	           		<div className="row no-margin " id="customSchema" ref={(e)=>{this.customSchema=e}}> 	</div>
				</div>);
			}
})

var ShowSchemaNames = React.createClass({
	renderSchema : function(schemaname,ev){
		deleteImages(imgIds);
		var type = this.props.type;
		if(!schemaname.name){
			finalObject1={};
			formulaFields = {};
			this.props.POT.schema_name.value = schemaname;
			ReactDOM.unmountComponentAtNode(document.getElementById('customSchema'));
			if(type == "new"){
				ReactDOM.render(<DisplayCustomSchema data = {schemaname}  admin={true} />,document.getElementById('customSchema'));
			}else if(type == "edit"){
				WebUtils.doPost("/schema?operation=getDocs",{"name":schemaname},function(result){
					var fieldData = result.data;
					getPopupContent("Select Record","search","");
					ReactDOM.render(<GetPopup fieldData = {fieldData}  refKey={"recordId"} identifier = {"identifier"} search={"search"}  button={""}/>,document.getElementById('genericPopupBody'));
			    })
			}
		}else{
			this.props.POT.schema_name.value = schemaname.name;
		}
		removeDilogBox();
	},
	render : function(){
		var fieldData = this.props.fieldData;
		var renderSchema = this.renderSchema;
		return (<div className="row no-margin ">
		{
			fieldData.map(function(schemaname){
						return (
							 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " onClick={renderSchema.bind(null,schemaname)}>
		            	   		<span className="fieldText no-padding-left link " >{schemaname}</span>
		            	    </div>
            	        )
            	      })
	            	}
			   </div>)
		}
})

/**
 * MAIN KEYS RENDARING
 */
var arrayJSON = {};//used for maintain array key values
var DisplayCustomSchema = React.createClass({
	getInitialState:function(){
		if(this.props.displayName){
			return {allChilds:{},superType:{},fullSchema:{}};
		}else{
	        return {
		        allChilds:SchemaStore.getSchema(this.props.data)["@properties"],
		        superType:{},
		        fullSchema:undefined,//SchemaStore.getSchema(this.props.data),
		        savedDoc:undefined
	        };
       }
    },
    componentWillReceiveProps: function(nextProps) {
    	if(!this.props.displayName){
			this.setState({
		        allChilds:SchemaStore.getSchema(this.props.data)["@properties"],
		        superType:{},
		        fullSchema:SchemaStore.getSchema(this.props.data),
		        savedDoc:undefined
	        });
		}
    },
    componentWillMount:function(){
       // this.setState({allChilds:this.props.data});
    },
    componentDidMount:function(){
    	//common.adjustDivs();
    	//common.clearFilters();
    	common.startLoader();
    	var savedDoc;
    	var self=this;
    	var schema = this.props.data;
    	if(typeof this.props.callbackToClosePopup=="function"){
    	    common.hideMainContainer();
    	}
    	//WebUtils.doPost("/schema?operation=getUniqueSchemaObjects",{"name":this.props.data},function(result){
    	WebUtils.getMainSchema(this.props.data,function(schemaRes){
    		var fullSchema=JSON.parse(JSON.stringify(schemaRes));
    		common.stopLoader();
    		if(schemaRes.error){
    			alert(schemaRes.error);
    			return;
    		}
			if(schemaRes["@relationDesc"]){
				this.props.relationDesc=schemaRes["@relationDesc"];
			}
			if(this.props.recordId){
				common.startLoader();
				WebUtils.doPost("/schema?operation=getRecord",{"name":this.props.recordId},function(savedRecord){
					common.stopLoader();
				{/*WebUtils.doPost("/generic?operation=getSchemaRecord",{schema:this.props.data,recordId:this.props.recordId,userId:UserDoc.id,org:this.props.org},function(savedRecord){*/}
			 		savedDoc = savedRecord.data;
			 		if(!this.props.callback || !typeof this.props.callback == "function"){
						if(this.isMounted()){
							 this.setState({
							 				fullSchema:fullSchema,
							 				allChilds:schemaRes["@properties"],
							 				savedDoc:savedDoc
							 			});
						}
				 	}else{
				 		if(this.isMounted()){
					 		 this.setState({
					 		 				fullSchema:fullSchema,
					 		 				allChilds:schemaRes["@properties"],
					 		 				savedDoc:this.props.record1
					 		 			  });
					 	}
				 	}
				}.bind(this));
			}else{
				/*Added by vikram for initial known data filling*/
				var allChilds=schemaRes["@properties"];
				var knownData=this.props.knownData?this.props.knownData:{};
				if(this.props.dependentSchema && this.state.fullSchema && this.state.fullSchema["@properties"]){
					for(var key in this.state.fullSchema["@properties"]){
						if(this.state.fullSchema["@properties"][key].dataType &&
						this.state.fullSchema["@properties"][key].dataType.derived){
							knownData[key]=this.props.dependentSchema;
						}
					}
				}
				if(knownData){
					for(var key in knownData){
						allChilds[key]=knownData[key];
						if(this.props.knownDataRecord)
							lookupData[knownData[key]]=this.props.knownDataRecord[knownData[key]];
					}
				}
				/*Added by vikram for initial known data filling*/

				getDefaultValues(allChilds,knownData,function(gdvr){
				if(self.props.callback && typeof self.props.callback == "function"){
			 		if(self.isMounted()){
			 			try{
			 				self.saveButton.style.display="none";
							self.saveButtonDiv.style.display="none";
						}catch(err){console.log(err);}
				 			self.setState({
				 						fullSchema:fullSchema,
				 		 				allChilds:gdvr,//getDefaultValues(allChilds,knownData),
				 		 				savedDoc:self.props.record1
				 		 			  });
				 	}
			 	}else{
			 		if(self.isMounted()){
						 self.setState({
						 				fullSchema:fullSchema,
						 				allChilds:gdvr,//getDefaultValues(allChilds,knownData),
						 				savedDoc:gdvr,//getDefaultValues(allChilds,knownData)
						 				});
					}
			 	}
			 });
			}
		}.bind(this));
		//this.fillKnownData();
    },
    componentDidUpdate:function(){
    	this.fillKnownData();
    	if(this.props.callback && typeof this.props.callback == "function"){
			try{
					this.saveButton.style.display="none";
					this.saveButtonDiv.style.display="none";
			}catch(err){console.log(err);}
		}
    },
	fillKnownData:function(){
    /*	if(typeof this.props.editFields!="undefined" && typeof  this.props.readOnlyFields!="undefined"){
    		for(var i=0;i<this.props.readOnlyFields.length;i++){
    			try{
    				if(this.props.edit && this.props.edit=="edit"){
    					$(this[this.props.readOnlyFields[i]]).css("display","block");
    				}else{
    					$(this[this.props.readOnlyFields[i]]).css("display","none");
    				}
    				$(this[this.props.readOnlyFields[i]]).css("pointer-events","none");
    			}catch(err){}
    		}
    		for(var i=0;i<this.props.editFields.length;i++){
    			try{
    				$(this[this.props.editFields[i]]).css("display","block");
    				$(this[this.props.editFields[i]]).css("pointer-events","auto");
    			}catch(err){}
    		}
    	}*/


    	var knownData=this.props.knownData?this.props.knownData:{};
    	if(this.props.dependentSchema && this.state.fullSchema && this.state.fullSchema["@properties"]){
    		for(var key in this.state.fullSchema["@properties"]){
    			if(this.state.fullSchema["@properties"][key].dataType &&
    			this.state.fullSchema["@properties"][key].dataType.derived){
    				knownData[key]=this.props.dependentSchema;
    			}
    		}
    	}
    	if(typeof knownData!="undefined"){
    		for(var i=0;i<Object.keys(knownData).length;i++){
    			try{
	    			$(this[Object.keys(knownData)[i]]).find("input").val(knownData[Object.keys(knownData)[i]]);
	    		}catch(err){}
	    		try{
	    			//if span
	    			if(!$($("#"+Object.keys(knownData)[i])).is("input")){
		    			$("#"+Object.keys(knownData)[i]).html(knownData[Object.keys(knownData)[i]]);
		    			$($("#"+Object.keys(knownData)[i])).parent().parent().parent().children().css("display","none");
		    			$($("#"+Object.keys(knownData)[i])).parent().parent().parent().children(".derived").css("display","block");
	    			}
	    		}catch(err){}
	    		try{
	    			//if input
	    			if($($("#"+Object.keys(knownData)[i])).is("input")){
		    			$("#"+Object.keys(knownData)[i]).val(knownData[Object.keys(knownData)[i]]);
		    			$(this[Object.keys(knownData)[i]]).css("display","none");
		    			$(this[Object.keys(knownData)[i]]).css("pointer-events","none");
	    			}
	    		}catch(err){}
    		}
    	}
    },
    setMyState:function(data,index,c,name,type,callback){
        if(this.props.type){
        	if(this.props.type == "array"){
						var state=this.state.allChilds;//["@properties"]
							if(c == "AIS"){
								if(state[Object.keys(data)[0]].hasOwnProperty("dataType")){
									state[Object.keys(data)[0]] =[];
								}
								state[Object.keys(data)[0]][index]=data[Object.keys(data)[0]]
								//this.props.callback(state);
								this.props.record=this.state;
							}else{
		            state[Object.keys(data)[0]]=data[Object.keys(data)[0]];
		            arrayJSON[Object.keys(data)[0]]=data[Object.keys(data)[0]];

		            if(index!=undefined && index!=-1){
		            	this.props.callback(state,index,'child',this.props.displayName);
		            }else if(Object.keys(arrayJSON).length == Object.keys(state).length){
		     					this.props.callback(arrayJSON,'','array',this.props.displayName);
	     					}
						 }
        	}
        }else if(type == "array"){
    				var state=this.state.allChilds;
            arrayJSON[Object.keys(data)[0]]=data[Object.keys(data)[0]];
            if(index!=undefined && index!=-1){
            	callback(arrayJSON[Object.keys(data)[0]],index,'child',Object.keys(data)[0]);
            }else if(Object.keys(arrayJSON).length == Object.keys(state).length){
     					this.props.callback(arrayJSON,'','array',this.props.displayName);
     				}
        }else if(c == "AIS"){
					  c="";
				  	var state=this.state.allChilds;//["@properties"]
						if(state[Object.keys(data)[0]].hasOwnProperty("dataType")){
							state[Object.keys(data)[0]] =[];
						}
					  state[Object.keys(data)[0]][index]=data[Object.keys(data)[0]]
				    var data={};
					  data[this.props.displayName]=state;
					  this.props.callback(data);
				}else if(this.props.callback && typeof this.props.callback == "function"){
            var state=this.state.allChilds;//["@properties"]
            state[Object.keys(data)[0]]=data[Object.keys(data)[0]]
		     		var data={};
		     		data[this.props.displayName]=state;
		     		this.props.callback(data);
        }else{
            var state=this.state.allChilds;
            if(c == 'array'){
            	if(this.state.allChilds[name].hasOwnProperty("dataType")){
            		state[name] =[];
            	}
              	state[name].push(data);
              	this.props.record=this.state;
            }else if(c == 'child'){
           		if(this.state.allChilds[name].hasOwnProperty("dataType")){
            		state[name] =[];
            	}
            	this.state.allChilds[name][index]=data;
            	//removing null n duplicates
            	/*var a=this.state.allChilds[name];
            	a=a.filter(function(elem, pos,arr) {
					    return arr.indexOf(elem) == pos;
					    });
            	a=a.filter(function(n,index){ return (n!="")});
            	this.state.allChilds[name]=a;*/
            	this.props.record=this.state;
            }else{
            	 state[Object.keys(data)[0]]=data[Object.keys(data)[0]];
            	 this.props.record=this.state;
            }
            //console.log(this.state.allChilds);
        }
    },
    getMyState:function(){
    	return this.state.allChilds;
    },
    cancel:function(){
    	var props=this.props;
    	if(props.fromPopUp && document.getElementById(props.contentDivId)){
			ReactDOM.unmountComponentAtNode(document.getElementById(props.fromPopUp));
			JunctionStore.clearJunctionsForRecord(props.recordId);
			ReactDOM.render(<genericView.GoIntoDetail  rootSchema={props.data}
									dependentSchema={props.dependentSchema}
									recordId={props.recordId}
									fromPopUp={props.fromPopUp}
									contentDivId={props.contentDivId}
									org={props.org ? props.org : "public"} />,document.getElementById(props.contentDivId));
			return;
		}
    	history.back();
    },

	render : function(){
		if(!this.state.fullSchema){
			return <div>Loading!</div>;	
		}
		var permission;
		var self=this;
		var type=this.props.type;
		var struct = this.props.struct;
		var structName = this.props.displayName;
		var filterConditionStructName = this.props.filterConditionStructName;
		var index=this.props.index;

		var savedDoc = this.state.savedDoc;
		var saved = this.props.saved;
		var fullSchema= this.state.fullSchema;
		var schemaObject = this.state.fullSchema.hasOwnProperty("@properties") ? this.state.fullSchema["@properties"] : {};

		var divLength="unequalDivs";
		var keysToBeCreated={};
		var keysAdded=[];

		if(fullSchema["@operations"] &&
				 fullSchema["@operations"]["create"] &&
				 fullSchema["@operations"]["create"]["createAll"] &&
				 fullSchema["@operations"]["create"]["createAll"].viewType){
				 	var viewName=fullSchema["@operations"]["create"]["createAll"].viewType;
					if(fullSchema["@operations"].read &&
						fullSchema["@operations"].read[viewName]  &&
						fullSchema["@operations"].read[viewName].UILayout){

						fullSchema["@operations"].read[viewName].UILayout.map(function(lay,mIndex){//checking for the schema getDetail view & loading the keys in that order
							if(lay.type=="generic"){
								divLength="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left unequalDivs";
								lay.layout.map(function(keys){
									if(keys.indexOf("#")==-1 && keys.indexOf("$")==-1 && keys.indexOf("@")==-1){
										var keyData=fullSchema["@properties"][keys]?fullSchema["@properties"][keys]:"";

										if(keyData!=""){
											var design={};
											design.divLength=divLength;
											design.layout="generic";
											keyData["design"]=design;
											keysToBeCreated[keys]=keyData;
											keysAdded.push(keys);
										}/*
										else if(fullSchema["@properties"][keys].dataType && fullSchema["@properties"][keys].dataType.type=="array"){
																		keysToBeCreated[keys]=keyData;
																		keysAdded.push(keys);
																	}*/

									}
								})
							}else if(lay.type=="columns"){
								var divCount=12/(lay.layout.length);
								var divLength="col-lg-"+ divCount+" col-md-"+ divCount +" col-sm-"+ divCount+" col-xs-12 no-padding-left unequalDivs";
						  		var innerDivLength=	"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left ";
						  		lay.layout.map(function(outerLayout,index){
						  			var addBreak="";
						  			if(index==lay.layout.length-1){
						  				addBreak="break";
						  			}
						  			if(outerLayout.toLocaleString()==""){
						  					var keyData={};
											var dataType={"type":"empty"}
											var design={};
												design.divLength=divLength;
												design.layout="columns";
												keyData["design"]=design;
												keyData["dataType"]=dataType;
												keyData["addBreak"]=addBreak;
												keysToBeCreated["column"+index+mIndex]=keyData;
						  			}else{
							  			outerLayout.map(function(keys,Mindex){
							  				if(keys.indexOf("#")==-1 && keys.indexOf("$")==-1 && keys.indexOf("@")==-1){
												var keyData=fullSchema["@properties"][keys]?fullSchema["@properties"][keys]:"";
												if(keyData!="" ){
													var design={};
													design.divLength=divLength;
													design.layout="columns";
													keyData["design"]=design;
													keyData["addBreak"]=addBreak;
													keysToBeCreated[keys]=keyData;
													keysAdded.push(keys);
												}/*
												else if(fullSchema["@properties"][keys].dataType && fullSchema["@properties"][keys].dataType.type=="array"){
																						keysToBeCreated[keys]=keyData;
																						keysAdded.push(keys);
																					}*/

											}
							  			})
						  			}
						  		})

							}else if(lay.type=="tabs"){
								Object.keys(lay.layout).map(function(tab){
									lay.layout[tab].properties.map(function(keys){
										if(keys.indexOf("#")==-1 && keys.indexOf("$")==-1 && keys.indexOf("@")==-1){
											var keyData=fullSchema["@properties"][keys]?fullSchema["@properties"][keys]:"";
											divLength=	"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left unequalDivs ";
											if(keyData!=""){
												var design={};
												design.divLength=divLength;
												design.layout="generic";
												keyData["design"]=design;
												keysToBeCreated[keys]=keyData;
												keysAdded.push(keys);
											}
										}
									})
								})

							}else if(lay.type=="banner"){
								var bannerData=[];
								Object.keys(lay.layout).map(function(bdata){
									if(typeof (lay.layout[bdata])=="object"){
										  Object.keys(lay.layout[bdata]).map(function(kData){
										  	bannerData.push(lay.layout[bdata][kData]);
										  })
									}else{
											bannerData.push(lay.layout[bdata]);
									}
								})
								bannerData.map(function(keys){
									var keyData=fullSchema["@properties"][keys]?fullSchema["@properties"][keys]:"";
									divLength="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left unequalDivs";
									if(keyData!=""){
										var design={};
										design.divLength=divLength;
										design.layout="generic";
										keyData["design"]=design;
										keysToBeCreated[keys]=keyData;
										keysAdded.push(keys);
									}
								})


							}



						})

						if(keysAdded.length!= Object.keys(fullSchema["@properties"])){
							Object.keys(fullSchema["@properties"]).map(function(keys){
							    if((keysAdded.indexOf(keys))==-1){
									var keyData=fullSchema["@properties"][keys]?fullSchema["@properties"][keys]:"";
										divLength="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left unequalDivs";
										if(keyData!="" ){
											var design={};
											design.divLength=divLength;
											design.layout="generic";
											keyData["design"]=design;
											keysToBeCreated[keys]=keyData;
											keysAdded.push(keys);
										}/*
										else if(fullSchema["@properties"][keys].dataType && fullSchema["@properties"][keys].dataType.type=="array"){
																		keysToBeCreated[keys]=keyData;
																		keysAdded.push(keys);
																	}*/

								}

							})
						}
					}else{

					}

		}

		schemaObject=(Object.keys(keysToBeCreated).length > 0)?keysToBeCreated:schemaObject;
		if(schemaObject){
			if(!this.props.callback){
				finalObject1 = mergeRecursive(JSON.parse(JSON.stringify(schemaObject)),finalObject1);
			}else{
				finalObject1 = mergeRecursive(finalObject1,JSON.parse(JSON.stringify(schemaObject)));
			}
		}

		var promptStyle={};
		if(this.state.fullSchema && this.state.fullSchema["@prompt"] && this.state.fullSchema["@prompt"].style){
			promptStyle=utility.getReactStyles(common.getConfigDetails().branding[this.state.fullSchema["@prompt"].style].normal);
		}else{
			promptStyle=utility.getReactStyles(common.getConfigDetails().branding["text"].normal);
			promptStyle["whiteSpace"]="pre-wrap";
		}
		var promptTop="";
		if((this.state.fullSchema && this.state.fullSchema["@prompt"])){
			promptTop=this.state.fullSchema["@prompt"].text;
			promptStyle=utility.getReactStyles(common.getConfigDetails().branding[self.state.fullSchema["@prompt"].style].normal);
		}else if(self.props.prompt && self.props.prompt.text){
			promptTop=self.props.prompt.text
			if(self.props.prompt.style){
				promptStyle=utility.getReactStyles(common.getConfigDetails().branding[self.props.prompt.style].normal);
			}
		}
		var createHeading="";
		var cHeading={};
		if(self.props.createHeading){
		    createHeading=self.props.createHeading;
		    cHeading=utility.getReactStyles(common.getConfigDetails().branding["title"].normal);
		}


		return (
				<div  className="col-lg-6 col-md-6 col-sm-10 col-xs-10 no-padding">
				{/*
					(this.state.fullSchema && (this.state.fullSchema["@displayName"] || this.state.fullSchema["displayName"]))?<div className="title col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">{this.state.fullSchema["@displayName"]}</div>:<div></div>
				*/}
				{
				    createHeading!=""?<div style={cHeading}>{createHeading}</div>:<div className="hidden"></div>
				}
				{
					promptTop!=""?<div className="margin-bottom-gap" style={promptStyle}>{promptTop}</div>:<div className="hidden"></div>
				}
				{
					Object.keys(schemaObject).map(function(key){
						permission = "";
						if(self.props.admin || self.props.permission == "admin"){
							permission = "admin";
						}else{
							if(self.props.editFields){
								if(self.props.editFields.indexOf(key) != -1){
									permission = "edit";
								}
							}
							if(self.props.readOnlyFields){

								if(self.props.readOnlyFields.indexOf(key) != -1 &&  self.props.editFields && self.props.editFields.indexOf(key) == -1){
									//permission = "read";
								}

							}
							if(self.props.permission == "edit"){
								permission = "edit";
							}
							if(self.props.permission == "read"){
								//permission = "read";
							}
						}
						 var childData={};
						 if(finalObject1[key].hasOwnProperty("dataType")){
						 	 if(finalObject1[key].dataType.type == "image" || finalObject1[key].dataType.type == "images" || finalObject1[key].dataType.type == "attachment" || finalObject1[key].dataType.type == "attachments" || finalObject1[key].dataType.type == "privateVideo"  || finalObject1[key].dataType.type == "privateVideos"){
							 	 childData[key]=[];
							 }else if(finalObject1[key].dataType.type == "array"){
							 	 if(finalObject1[key].dataType.elements.type == "image" || finalObject1[key].dataType.elements.type == "images" || finalObject1[key].dataType.elements.type == "attachment" || finalObject1[key].dataType.elements.type == "attachments" || finalObject1[key].dataType.elements.type == "privateVideo" || finalObject1[key].dataType.elements.type == "privateVideos"){
							 		childData[key]=[];
							 	}else{
							 	 	childData[key]="";
								 }
							 }else{
							 	 childData[key]="";
							 }
						 }

						 if(typeof savedDoc == "object" ){
						 	if(savedDoc.hasOwnProperty(key)){
						 		childData[key]=savedDoc[key];
						 	}else if(structName){
						 		if(savedDoc[self.props.index]){
						 			childData[key]=savedDoc[self.props.index][key];
						 		}
						 	}
						 }

						 if(schemaObject[key].hasOwnProperty("dataType")){
						 	var prompt = schemaObject[key].prompt ? schemaObject[key].prompt : schemaObject[key].displayName;
						 	var headdingFont = self.props.headding;
						 	var divLen=(schemaObject[key] && schemaObject[key].design && schemaObject[key].design.divLength)?schemaObject[key].design.divLength:"";
						 	var addColBreak=(schemaObject[key] && schemaObject[key].addBreak && schemaObject[key].addBreak=="break")?"<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12' ></div>":"";
						 	 if(schemaObject[key].dataType.type == "text" ||
						 	 schemaObject[key].dataType.type == "heading1" ||
						 	 schemaObject[key].dataType.type == "heading2" ||
						 	 schemaObject[key].dataType.type == "heading3"){
						 	 	if(type == "array"){
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
						 	 			<GetInputField callback={self.setMyState}
						 	 							data={childData}
						 	 							properties={schemaObject[key]}
						 	 							fieldName={key}
						 	 							index={index}
						 	 		                    getMyState={self.getMyState}
						 	 							headdingFont={headdingFont}
						 	 							structName={structName}
						 	 							permission={permission}
						 	 							fullSchema={self.state.fullSchema}
						 	 							org={self.props.org}/>
						 	 			<div className={addColBreak}></div>
						 	 			</div>);
						 	 	}else{
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
						 	 			<GetInputField key={global.guid()}
						 	 					callback={self.setMyState}
						 	 					data={childData}
						 	 					properties={schemaObject[key]}
						 	 					fieldName={key}
						 	 					index={index}
						 	 					headdingFont={headdingFont}
						 	 					structName={structName}
						 	 					permission={permission}
						 	 					fullSchema={self.state.fullSchema}
						 	 		            getMyState={self.getMyState}
						 	 					org={self.props.org}/>
						 	 			<div className={addColBreak}></div>
						 	 			</div>);
						 	 	}
						     }
						     else if(schemaObject[key].dataType.type == "richTextEditor"){
						     	if(type == "array"){
						 	 		return(<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
								 				<RichTextEditor callback={self.setMyState}
								 						data={childData}
						 	 							properties={schemaObject[key]}
						 	 							fieldName={key}
						 	 							index={index}
						 	 		                    getMyState={self.getMyState}
						 	 							headdingFont={headdingFont}
						 	 							structName={structName}
						 	 							permission={permission}
						 	 							fullSchema={self.state.fullSchema}
						 	 							org={self.props.org}/>
							 					<div className={addColBreak}></div>
								 			</div>);
						 	 	}else{

						 	 		return(<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
								 				<RichTextEditor callback={self.setMyState}
								 					key={global.guid()}
						 	 						callback={self.setMyState}
							 	 					data={childData}
							 	 					properties={schemaObject[key]}
							 	 					fieldName={key}
							 	 					index={index}
						 	 		                getMyState={self.getMyState}
							 	 					headdingFont={headdingFont}
							 	 					structName={structName}
							 	 					permission={permission}
							 	 					fullSchema={self.state.fullSchema}
							 	 					org={self.props.org}/>
							 					<div className={addColBreak}></div>
						 	 				</div>);
						 	 	}

							 }
							 else if(schemaObject[key].dataType.type == "tags"){
						     	if(type == "array"){
						 	 		return(<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
								 				<MyTagsInput callback={self.setMyState}
								 						data={childData}
						 	 							properties={schemaObject[key]}
						 	 							fieldName={key}
						 	 							index={index}
						 	 		                    getMyState={self.getMyState}
						 	 							headdingFont={headdingFont}
						 	 							structName={structName}
						 	 							permission={permission}
						 	 							fullSchema={self.state.fullSchema}
						 	 							org={self.props.org}/>
							 					<div className={addColBreak}></div>
								 			</div>);
						 	 	}else{

						 	 		return(<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
								 				<MyTagsInput callback={self.setMyState}
								 					key={global.guid()}
						 	 						callback={self.setMyState}
							 	 					data={childData}
							 	 					properties={schemaObject[key]}
							 	 					fieldName={key}
							 	 					index={index}
						 	 		                getMyState={self.getMyState}
							 	 					headdingFont={headdingFont}
							 	 					structName={structName}
							 	 					permission={permission}
							 	 					fullSchema={self.state.fullSchema}
							 	 					org={self.props.org}/>
							 					<div className={addColBreak}></div>
						 	 				</div>);
						 	 	}

							 }
						     else if(schemaObject[key].dataType.type == "email"){
						     	if(type == "array"){
						     		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetEmailField callback={self.setMyState} data={childData} getMyState={self.getMyState} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						     	}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetEmailField key={global.guid()} callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "number"){
							 	if(type == "array"){
									return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetNumberField callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else{
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetNumberField  key={global.guid()} callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}
							 }else if(schemaObject[key].dataType.type == "url"){
							 	if(type == "array"){
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetURLField callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else{
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetURLField key={global.guid()} getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}
							 }else if(schemaObject[key].dataType.type == "phone"){
							 	if(type == "array"){
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetPhoneField callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetPhoneField key={global.guid()} getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "textarea"){
							 	if(type == "array"){
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetTextareaField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetTextareaField getMyState={self.getMyState}  key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "date"){
							 	if(type == "array"){
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetDateField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetDateField  getMyState={self.getMyState} key={global.guid()}  callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "time"){
							 	if(type == "array"){
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetTimeField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetTimeField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "dateTime"){
							 	if(type == "array"){
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetDateTimeField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen }><GetDateTimeField getMyState={self.getMyState} key={global.guid()}  callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "object"){
							 	if(type == "array"){
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetObjectField getMyState={self.getMyState} srFilters={self.props.srFilters} junctionProperty={self.props.junctionProperty} filterKeys={self.props.filterKeys} callback={self.setMyState}  data={childData} properties={schemaObject[key]} fieldName={key} structName={structName} filterConditionStructName={filterConditionStructName} index={index} headdingFont={headdingFont} structName={structName} org={self.props.org} permission={permission}/><div className={addColBreak}></div></div>);
		            			}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetObjectField getMyState={self.getMyState} srFilters={self.props.srFilters} junctionProperty={self.props.junctionProperty} key={global.guid()} filterKeys={self.props.filterKeys} callback={self.setMyState}  data={childData} properties={schemaObject[key]} fieldName={key} structName={structName} filterConditionStructName={filterConditionStructName} index={index} headdingFont={headdingFont} structName={structName}  org={self.props.org} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "boolean"){
						 	 	if(type == "array"){
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetBooleanField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						 	 	}else{
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetBooleanField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						 	 	}
						     }else if(schemaObject[key].dataType.type == "video"){
							 	if(schemaObject[key].dataType.media == "mobile"  && detectmob()){
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else if(schemaObject[key].dataType.media == "web" && !detectmob()){
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField key={global.guid()} getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else if(schemaObject[key].dataType.media == "all"){
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField key={global.guid()} getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else{
							 		if(schemaObject[key].dataType.media == "mobile"  && !detectmob()){
							 			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField key={global.guid()} callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} alertMessage={true} message={"This video can only be played on a Mobile device"} headdingFont={headdingFont} permission={permission}/><div className={addColBreak}></div></div>);
								 	}else if(schemaObject[key].dataType.media == "web" && detectmob()){
								 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField key={global.guid()} callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} alertMessage={true} message={"This video can only be played on a Desketop"} headdingFont={headdingFont} permission={permission}/><div className={addColBreak}></div></div>);
								 	}
							 	}
						    }else if(schemaObject[key].dataType.type == "pickList"){
							 	var derivedObjData;
							 	if(savedDoc){
							 		derivedObjData= savedDoc["dependentProperties"];
							 	}else{
							 		derivedObjData = savedDoc;
							 	}
							 	if(type == "array"){
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetPickListField dependentSchema={self.props.dependentSchema} getMyState={self.getMyState} abstractSchema={self.props.data}  callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} record1={derivedObjData} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}else{
		            				return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetPickListField dependentSchema={self.props.dependentSchema}  getMyState={self.getMyState} key={global.guid()} abstractSchema={self.props.data}  callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} record1={derivedObjData} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
		            			}
							 }else if(schemaObject[key].dataType.type == "multiPickList"){
							 	if(type == "array"){
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetMultiPickListField callback={self.setMyState} data={childData} getMyState={self.getMyState} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}else{
							 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetMultiPickListField key={global.guid()} callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
							 	}
							 }else if(schemaObject[key].dataType.type == "images" || schemaObject[key].dataType.type == "image"){
							 	if(type == "array"){
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
			            						<GetImageField callback={self.setMyState}
			            										data={childData}
			            										length ={childData[key].length}
			            										properties={schemaObject[key]}
			            										fieldName={key}
			            										displayName={self.props.displayName}
			            										type={type}
			            			                            getMyState={self.getMyState}
			            										struct={struct}
			            										index={index}
			            										saved={savedDoc}
			            										headdingFont={headdingFont}
			            										structName={structName}
			            										permission={permission}/>
			            							<div className={addColBreak}></div>
			            						</div>)
			            		}else{
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}>
			            							<GetImageField key={global.guid()}
			            									callback={self.setMyState}
			            									data={childData}
			            									length ={childData[key].length}
			            									properties={schemaObject[key]}
			            									fieldName={key}
			            			                        getMyState={self.getMyState}
			            									displayName={self.props.displayName}
			            									type={type}
			            									struct={struct}
			            									index={index}
			            									saved={savedDoc}
			            									headdingFont={headdingFont}
			            									structName={structName}
			            									permission={permission}/>
			            								<div className={addColBreak}></div>
			            						</div>)
			            		}
						     }else if(schemaObject[key].dataType.type == "attachment" || schemaObject[key].dataType.type == "attachments"){
							 	if(type == "array"){
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetAttachmentField getMyState={self.getMyState} callback={self.setMyState} data={childData} length ={childData[key].length} properties={schemaObject[key]} fieldName={key} displayName={self.props.displayName} type={type} struct={struct} index={index} saved={savedDoc} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>)
			            		}else{
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetAttachmentField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} length ={childData[key].length} properties={schemaObject[key]} fieldName={key} displayName={self.props.displayName} type={type} struct={struct} index={index} saved={savedDoc} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>)
			            		}
						     }else if(schemaObject[key].dataType.type == "privateVideo"||schemaObject[key].dataType.type == "privateVideos"){
							     if(type == "array"){
                                        return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField1 getMyState={self.getMyState} /*PrivateVideoComponent*/ callback={self.setMyState} data={childData} length ={childData[key].length} properties={schemaObject[key]} fieldName={key} displayName={self.props.displayName} type={type} struct={struct} index={index} saved={savedDoc} structName={structName} permission={permission}/><div className={addColBreak}></div></div>)
                                 }else{
                                        return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetVideoField1 getMyState={self.getMyState} /*PrivateVideoComponent*/ key={global.guid()} callback={self.setMyState} data={childData} length ={childData[key].length} properties={schemaObject[key]} fieldName={key} displayName={self.props.displayName} type={type} struct={struct} index={index} saved={savedDoc} structName={structName} permission={permission}/><div className={addColBreak}></div></div>)
                                 }
                             }else if(schemaObject[key].dataType.type == "formula"){
						     	if(type == "array"){
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetFormulaField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
			            		}else{
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetFormulaField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
			            		}
						     }else if(schemaObject[key].dataType.type == "geoLocation"){
						     	if(type == "array"){
						     		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetGeoLocationField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						     	}else{
			            			return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetGeoLocationField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
			            		}
						     }else if(schemaObject[key].dataType.type == "rating"){
                                if(type == "array"){
                                    return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetRatingFiled getMyState={self.getMyState} ratingType={schemaObject[key].dataType.ratingType} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
                                }else{
                                    return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetRatingFiled  getMyState={self.getMyState} ratingType={schemaObject[key].dataType.ratingType} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
                                }
                             }else if(schemaObject[key].dataType.type == "label"){
						 	 	if(type == "array"){
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetLabelField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						 	 	}else{
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetLabelField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						 	 	}
						     }else if(schemaObject[key].dataType.type == "currency"){
						 	 	if(type == "array"){
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetCurrencyField getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						 	 	}else{
						 	 		return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetCurrencyField getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission}/><div className={addColBreak}></div></div>);
						 	 	}
						     }else if(schemaObject[key].dataType.type == "struct"){
						     	if(permission ==""){
						     		prompt="";
						     	}
								 if(savedDoc){
								 	return (<div  ref={(e)=>{self[key]=e}}  className={"dataField "+divLen} >
										<label><span className="fieldText no-padding-left headerField title">{prompt}</span></label>
											<div className="row no-margin" id={key}>
												<DisplayCustomSchema key={global.guid()} data={schemaObject[key].dataType.structRef} getMyState={self.getMyState} callback={self.setMyState} displayName={key} record1={savedDoc[key]} struct={"struct"}  saved={true} headding={true} permission={permission}/>
											</div><div className={addColBreak}></div>
										 </div>)
								 }else{
								 	return (<div ref={(e)=>{self[key]=e}}  className={"dataField "+divLen} >
										<label><span className="fieldText no-padding-left headerField title">{prompt}</span></label>
										<div className="row no-margin" id={key}>
											<DisplayCustomSchema key={global.guid()} data={schemaObject[key].dataType.structRef} getMyState={self.getMyState} callback={self.setMyState} displayName={key} struct={"struct"} headding={true}  permission={permission}/>
										</div><div className={addColBreak}></div>
										 </div>)
								 }
							 }else if(schemaObject[key].dataType.type == "array" ){
							 	 var clb = self.setMyState;
								if(!Array.isArray(childData[key])){
									childData[key]=[];
								}
								 if(savedDoc){
								 	if(schemaObject[key].dataType.elements.type == "struct"){
									 	return (<div ref={(e)=>{self[key]=e}} id={key} className={" "+divLen}>
													<NewLineComponent srFilters={self.props.srFilters} getMyState={self.getMyState} filterKeys={self.props.filterKeys} key={global.guid()} callback={self.setMyState} getMyState={self.getMyState} data={childData} properties={schemaObject[key]} fieldName={key} record1={savedDoc[key]} type={"array"} saved={true} permission={permission}/>
												<div className={addColBreak}></div>
												</div>)
								 	}else if(schemaObject[key].dataType.elements.type == "text" ||
								 	 schemaObject[key].dataType.elements.type == "number" ||
								 	  schemaObject[key].dataType.elements.type == "email" ||
								 	   schemaObject[key].dataType.elements.type == "url" ||
								 	   schemaObject[key].dataType.elements.type == "phone" ||
								 	    schemaObject[key].dataType.elements.type == "textarea" ||
								 	    schemaObject[key].dataType.elements.type == "date" ||
								 	    schemaObject[key].dataType.elements.type == "time" ||
								 	    schemaObject[key].dataType.elements.type == "dateTime" ||
								 	     schemaObject[key].dataType.elements.type == "object" ||
								 	     schemaObject[key].dataType.elements.type == "pickList" ||
								 	      schemaObject[key].dataType.elements.type == "multiPickList" ||
								 	      schemaObject[key].dataType.elements.type == "geoLocation" ||
								 	       schemaObject[key].dataType.elements.type == "socialShare" ||
								 	        schemaObject[key].dataType.elements.type == "rating" ||
								 	        schemaObject[key].dataType.elements.type == "label" ||
								 	        schemaObject[key].dataType.elements.type == "images" ||
								 	         schemaObject[key].dataType.elements.type == "image" ||
								 	          schemaObject[key].dataType.elements.type == "attachment" ||
								 	          schemaObject[key].dataType.elements.type == "attachments" ||
								 	           schemaObject[key].dataType.elements.type == "video" ||
								 	           schemaObject[key].dataType.elements.type == "boolean" ||
								 	            schemaObject[key].dataType.elements.type == "currency" ||
								 	            schemaObject[key].dataType.elements.type == "heading1" ||
								 	            schemaObject[key].dataType.elements.type == "heading2" ||
								 	            schemaObject[key].dataType.elements.type == "heading3"){
										 if(structName){
											 return (<div ref={(e)=>{self[key]=e}} className={" "+divLen}>
													<div className={addColBreak}></div>
													<NewLineComponent callback={self.setMyState} getMyState={self.getMyState} AIS={structName} data={childData} properties={schemaObject[key]} fieldName={key} type={"array"} saved={true} permission={permission}/>
												</div>)
										 }else{
											 return (<div ref={(e)=>{self[key]=e}} className={" "+divLen}>
													<div className={addColBreak}></div>
													<NewLineComponent key={global.guid()}  getMyState={self.getMyState} callback={self.setMyState} AIS={structName} data={childData} properties={schemaObject[key]} fieldName={key} type={"array"} saved={true} permission={permission}/>
												</div>)
									   }
								 	}
								 }else{
								 	if(schemaObject[key].dataType.elements.type == "struct"){
										return (<div ref={(e)=>{self[key]=e}} id={key} className={" "+divLen}>
													<NewLineComponent key={global.guid()} getMyState={self.getMyState} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} type={"array"}  permission={permission}/>
								 				<div className={addColBreak}></div>
								 				</div>)
								 	}else if(schemaObject[key].dataType.elements.type == "text" ||
								 	schemaObject[key].dataType.elements.type == "number" ||
								 	schemaObject[key].dataType.elements.type == "email" ||
								 	schemaObject[key].dataType.elements.type == "url" ||
								 	schemaObject[key].dataType.elements.type == "phone" ||
								 	schemaObject[key].dataType.elements.type == "textarea" ||
								 	schemaObject[key].dataType.elements.type == "date" ||
								 	schemaObject[key].dataType.elements.type == "time" ||
								 	schemaObject[key].dataType.elements.type == "dateTime" ||
								 	schemaObject[key].dataType.elements.type == "object" ||
								 	schemaObject[key].dataType.elements.type == "pickList" ||
								 	schemaObject[key].dataType.elements.type == "multiPickList" ||
								 	 schemaObject[key].dataType.elements.type == "geoLocation" ||
								 	  schemaObject[key].dataType.elements.type == "socialShare" ||
								 	  schemaObject[key].dataType.elements.type == "rating" ||
								 	  schemaObject[key].dataType.elements.type == "label" ||
								 	  schemaObject[key].dataType.elements.type == "images" ||
								 	  schemaObject[key].dataType.elements.type == "image" ||
								 	  schemaObject[key].dataType.elements.type == "attachment" ||
								 	  schemaObject[key].dataType.elements.type == "attachments" ||
								 	  schemaObject[key].dataType.elements.type == "video" ||
								 	  schemaObject[key].dataType.elements.type == "boolean" ||
								 	   schemaObject[key].dataType.elements.type == "currency" ||
								 	   schemaObject[key].dataType.elements.type == "heading1" ||
								 	   schemaObject[key].dataType.elements.type == "heading2" ||
								 	   schemaObject[key].dataType.elements.type == "heading3"){
										if(structName){
											return (<div ref={(e)=>{self[key]=e}} className={" "+divLen}>
														<NewLineComponent getMyState={self.getMyState} callback={self.setMyState} AIS={structName} data={childData} properties={schemaObject[key]} fieldName={key} type={"array"}  permission={permission}/>
									 				<div className={addColBreak}></div>
									 				</div>)
										}else{
											return (<div ref={(e)=>{self[key]=e}} className={" "+divLen}>
														<NewLineComponent getMyState={self.getMyState} key={global.guid()} callback={self.setMyState} AIS={structName} data={childData} properties={schemaObject[key]} fieldName={key} type={"array"}  permission={permission}/>
									 				<div className={addColBreak}></div>
									 				</div>)
										}
								 	}
								 }
							 }
							 else if(schemaObject[key].dataType.type == "autoNumber"){
							 	return <div className={divLen} ></div>
							 	//return (<div ref={(e)=>{self[key]=e}} className={"dataField "+divLen}><GetAutoNumberField key={global.guid()} callback={self.setMyState} data={childData} properties={schemaObject[key]} fieldName={key} index={index} headdingFont={headdingFont} structName={structName} permission={permission} recordId={self.state.fullSchema.autoNumberRecordId} PD={self.props}/><div className={addColBreak}></div></div>);
							 }else{
			                    self.setMyState(childData,index);
			                    return(<div className={divLen} ></div>)
			                  }
						 }
					})
				}
				<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left remove-margin-left remove-margin-right form-group" ref={(e)=>{this.saveButtonDiv=e}}>
					<div className="display-inline-block extra-padding-right"><button type='submit' ref={(e)=>{this.saveButton=e}} className="upload-btn" onClick={saveRecord.bind(null,this.props,this.state,"")}>
						{(self.state.fullSchema && self.state.fullSchema["@operations"] && self.state.fullSchema["@operations"].create && self.state.fullSchema["@operations"].create.displayName )?self.state.fullSchema["@operations"].create.displayName:"SAVE"}
					</button>
					</div>
					<div className="display-inline-block extra-padding-right">
					{
						[2].map(function(){
							if(self.props.actions){
								return self.props.actions.map(function(action){
									var displayName=action;
									try{
										displayName=self.state.fullSchema["@operations"].actions[action].displayName;
									}catch(err){}
									return <button type='submit' ref={(e)=>{self["saveButton"+action]=e}} className="upload-btn" onClick={saveRecord.bind(null,self.props,self.state,action)}>{displayName}</button>
								})
							}else{
								return <div className={"hidden"}></div>
							}
						})
					}
					</div>
					<div className="display-inline-block extra-padding-right">
					{
						["a"].map(function(temp){
							if(self.props.fromLefNav){
								return (<button type='submit' ref={(e)=>{self.cancelButton=e}} className="upload-btn" onClick={self.cancel}>CANCEL</button>)
							}else{
								return(<div className="hidden"></div>)
							}
						})
					}
					</div>

              	</div>

             </div>
		)
	}
})

exports.DisplayCustomSchema=DisplayCustomSchema;

var NewLineComponent = React.createClass({
	getInitialState:function(){
		if(this.props.saved){
			return {stateCount :this.props.data[this.props.fieldName].length>0 ? this.props.data[this.props.fieldName].length : 1};
		}else{
			return {stateCount :1};
		}
    },
    addNewElement : function(ev){
		this.setState({stateCount:this.state.stateCount+1});
	},
	render :function(){
		var self=this;
		var addNewElement = this.addNewElement;
		var data=[],displayData;
		for(var k=0;k<this.state.stateCount;k++){
			if(this.props.saved){
				var childData = {};
				if(this.props.data[this.props.fieldName][k]){
					childData[this.props.fieldName] = this.props.data[this.props.fieldName][k];
				}else{
					if(this.props.properties.dataType.elements.type == "image" || this.props.properties.dataType.elements.type == "images" || this.props.properties.dataType.elements.type == "attachment" || this.props.properties.dataType.elements.type == "attachments" || this.props.properties.dataType.elements.type == "privateVideo" || this.props.properties.dataType.elements.type == "privateVideos"){
						childData[this.props.fieldName] = [];
					}else{
						childData[this.props.fieldName] = "";
					}
				}
				displayData = childData;
			}else{
				displayData = self.props.data;
			}
			if(this.props.properties.dataType.elements.type  == "video"){
				if(this.props.properties.dataType.media == "mobile"  && detectmob()){
					data.push(
					<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<div className="arrayClass">
							<GetVideoField  getMyState={self.props.getMyState} callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"}  permission={self.props.permission}/>
						</div>
					</div>
				)
				}else if(this.props.properties.dataType.media == "web" && !detectmob()){
					data.push(
					<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<div className="arrayClass">
							<GetVideoField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
						</div>
					</div>
				)
				}else if(this.props.properties.dataType.media == "all"){
					data.push(
					<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<div className="arrayClass">
							<GetVideoField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
						</div>
					</div>
					)
				}

			}else if(this.props.properties.dataType.elements.type  == "text" ||
			this.props.properties.dataType.elements.type  == "heading1" ||
			this.props.properties.dataType.elements.type  == "heading2" ||
			this.props.properties.dataType.elements.type  == "heading3"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetInputField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "number"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetNumberField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "email"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetEmailField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "url"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetURLField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "phone"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetPhoneField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "textarea"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetTextareaField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "date"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetDateField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "time"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetTimeField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "dateTime"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetDateTimeField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "object"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<span className="fieldText no-padding-left headerField title">{prompt}</span>
					<div className="arrayClass">
						<GetObjectField getMyState={self.props.getMyState}  callback={self.props.callback} junctionProperty={self.props.junctionProperty} srFilters={self.props.srFilters} filterKeys={self.props.filterKeys} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"}  org={self.props.org} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "pickList"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<span className="fieldText no-padding-left headerField title">{prompt}</span>
					<div className="arrayClass">
						<GetPickListField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "multiPickList"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<span className="fieldText no-padding-left headerField title">{prompt}</span>
					<div className="arrayClass">
						<GetMultiPickListField getMyState={self.props.getMyState}   callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "geoLocation"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<span className="fieldText no-padding-left headerField title">{prompt}</span>
					<div className="arrayClass">
						<GetGeoLocationField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type == "rating"){
                data.push(
                <div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                    <span className="fieldText no-padding-left headerField title">{prompt}</span>
                    <div className="arrayClass">
                        <GetRatingFiled getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
                    </div>
                </div>)
             }else if(this.props.properties.dataType.elements.type  == "label"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetLabelField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "image" || this.props.properties.dataType.elements.type  == "images"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetImageField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} length={displayData[self.props.fieldName].length} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"arrayOfArray"} saved={this.props.saved} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "attachment" || this.props.properties.dataType.elements.type  == "attachments"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetAttachmentField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS}data={displayData} length={displayData[self.props.fieldName].length} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"arrayOfArray"} saved={this.props.saved} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "privateVideo" || this.props.properties.dataType.elements.type  == "privateVideos"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetVideoField1 getMyState={self.props.getMyState}  callback={self.props.callback} V data={displayData} length={displayData[self.props.fieldName].length} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"arrayOfArray"} saved={this.props.saved} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type == "struct"){
					var prompt = self.props.properties.prompt ? self.props.properties.prompt : self.props.properties.displayName;
					if(self.props.permission ==""){
						prompt="";
					}
					data.push(
					<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<span className="fieldText no-padding-left headerField title">{prompt}</span>
						<div className="arrayClass">
							<DisplayCustomSchema getMyState={self.props.getMyState}  callback={self.props.callback} data={self.props.properties.dataType.elements.structRef} displayName={self.props.fieldName} type={"array"} filterConditionStructName ={"arrayOfstruct"} index={k} record1={self.props.record1} saved={this.props.saved}  permission={self.props.permission}/>
						</div>
					</div>)

			}else if(this.props.properties.dataType.elements.type  == "boolean"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetBooleanField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}else if(this.props.properties.dataType.elements.type  == "currency"){
				data.push(
				<div className="dataField col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="arrayClass">
						<GetCurrencyField getMyState={self.props.getMyState}  callback={self.props.callback} AIS={self.props.AIS} data={displayData} properties={self.props.properties} fieldName={self.props.fieldName} index={k} type={"array"} permission={self.props.permission}/>
					</div>
				</div>
				)
			}
		}
		if(self.props.permission != "read" && self.props.permission != ""){
		    var prompt = self.props.properties.displayName ? self.props.properties.displayName : "";
			return (<div>
 			  		{data}
		 			<button className="action-button margin-bottom-gap-sm" onClick={addNewElement.bind(this)}>{"ADD "+(prompt?"OTHER "+prompt.toUpperCase():"")}</button>
	 			</div>)
		}else{
			return (<div>
 			  		{data}
	 			</div>)
		}
	}
})


/**
 *used for call GenericPopup
 */
function getPopupContent(title,search,button,target){
	ReactDOM.render(<GenericPopup  title={title} search={search} button={button} target={target}/>,document.getElementById('dialogBoxDiv'));
	$('#genericDilog').modal("show");
}

/**
 *used for creating generic dialogbox code
 */
var GenericPopup = React.createClass({
	componentDidMount:function(){
		try{
			var search = this.props.search;
			var button = this.props.button;
			if(search.trim() == ""){
				document.getElementById("search").style.display="none";
			}else{
				document.getElementById("search").style.display="block";
			}
			if(button.trim() == ""){
				document.getElementById("footer").querySelector("button").style.display="none";
			}else{
				document.getElementById("footer").querySelector("button").style.display="block";
			}
		}catch(err){}
	},
	render:function(){
		var title = this.props.title;
		return (<div className="modal fade " id="genericDilog" tabindex="-1" role="dialog" aria-labelledby="providerLabel" aria-hidden="true">
					  <div className="modal-dialog">
					    <div className="modal-content">
					      <div className="modal-header" id="header">
					   		<button aria-label="Close" data-dismiss="modal" className="close" type="button" onClick={removeDilogBox.bind(this)}><span className="sleekIcon-delete fa-2x link " aria-hidden="true" /></button>
					        <label>{title}</label>
					      </div>
					      <div className="modal-body">
					      	<div className="row no-margin" id="search">
					      		<input type='text'   className="form-control form-group" placeholder="Search.."/>
					      	</div>
						      	<div id="genericPopupBody">

								</div>
					      </div>
					      <div className="modal-footer" id="footer">
					      		<button className="upload-btn margin-bottom-gap">OK</button>
					      </div>
					    </div>
					  </div>
					</div>)
   }
});

var GetPopup = React.createClass({
	componentDidMount:function(){
		if(this.props.search != ""){
			document.getElementById("search").style.display="block";
		}else{
			document.getElementById("search").style.display="none";
		}
		if(this.props.button != ""){
			document.getElementById("footer").querySelector("button").style.display="block";
		}else{
			document.getElementById("footer").querySelector("button").style.display="none";
		}
	},
	render : function(){
		var fieldData = this.props.fieldData;
		var id= this.props.id;
		var refKey = this.props.refKey;
		var stateData = this.props.stateData;
		var identifier = this.props.identifier;
		var target = this.props.target;
		if(!fieldData){
			return (
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<span>No Data Found</span>
					</div>
					)
		}

		if(fieldData.length > 0){
			return (
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					{
						fieldData.map(function(data,index){

							var val=(typeof data[data["@identifier"]]!="undefined" && data[data["@identifier"]] != "" )? data[data["@identifier"]] : data.recordId;
							return (
									 <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left " onClick={fillData.bind(null,data[refKey],id,"",stateData,target)}>
				            	   		<span className="fieldText no-padding-left ">{val}</span>
				            	    </div>
								 )
						})
					}
	        	</div>
			)
		}else{
			return (
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<span>No Data Found</span>
					</div>
					)
		}

	}
})


/**
 *This function is used to fill the selected data from dialogbox to input element
 * data	---	show data
 * id	---	need to fill element
 * ev	---	this
 * stateData	---	value of the object component state
 */
function fillData(data,id,stateData,fillObject,target,rowData){
	if(rowData){
		lookupData[data] = rowData;
	}
	$('#genericDilog,.modal-backdrop').remove();
	$("#lookUpDialogBox .modal").modal("hide")
	arrayJSON={};
	if(id){
		clearDependentFields("",stateData,target);
		target.value = data;
		if(typeof fillObject != undefined){
			fillObject(rowData,target);

		}


		var childData={};
	     childData[Object.keys(stateData.data)[0]]=data;
	     var index = stateData.index;
			 if(stateData.AIS){
 					 stateData.callback(childData,index,'AIS');
 			 }else{
			     if(stateData.type){
			     	stateData.callback(childData,index,"","",stateData.type,stateData.callback);
			     }else{
			     	stateData.callback(childData,index);
			     }
			 }

	     moveScroll(target);
	}else{
		ReactDOM.render(<DisplayCustomSchema data = {document.getElementById("schema_name").value} recordId={data} admin={true} edit={"edit"}/>,document.getElementById('customSchema'));
	}
}

/**
 *used to combine 2 objects
 * @param {Object} obj1	---	json object
 * @param {Object} obj2	--- json object
 */
function mergeRecursive(obj1, obj2) {
    for (var p in obj2) {
        if(obj2.hasOwnProperty(p)){
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}


function numeralsOnly(e){
	if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
    	return false;
    }
}
exports.numeralsOnly = numeralsOnly;
/**
 *This function is used to evaluate email reqexp
 * @param {Object} e	--	element(this)
 */
function evaluateMailRegularExp(paramReqId,e){
   var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if(!paramReqId.target.value.match(mailformat))
	{
		$(paramReqId.target).parents("div.row").eq(0).find("span.errorMsg").text("You have entered an invalid email address!");
		paramReqId.target.value = "";
		return false;
	}
}

function evaluatePhoneNo(e){
	var myRegExp =  /\+?\d[\d -]{8,12}\d/;
	if(e.target.value.trim() != ""){
		if (!myRegExp.test(e.target.value)){
			alert("Not a valid phone no.");
			e.target.value = "";
			return;
		}
	}
}

 /*  ***************************** SUB COMPONENTS RENDARING   *********************  */



var GetVideoField = React.createClass({
	componentDidMount:function(){
		if(this.props.alertMessage){
			var childData={};
		    childData[Object.keys(this.props.data)[0]]="";
		    var index = this.props.index;
				if(this.props.AIS){
						this.props.callback(childData,index,'AIS');
				}else{
					if(this.props.type){
			    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			    }else{
			    	 this.props.callback(childData,index);
			    }
				}

		}else{
			if(this.props.properties.required){
				this.rootNode.querySelector("input[type='text']").setAttribute("required","true");
			}
			var videoData = this.props.data[Object.keys(this.props.data)[0]];
			var src;
			if(videoData.trim() == ""){
				var childData={};
			    childData[Object.keys(this.props.data)[0]]="";
			    var index = this.props.index;
					if(this.props.AIS){
							this.props.callback(childData,index,'AIS');
					}else{
				    if(this.props.type){
				    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
				    }else{
				    	 this.props.callback(childData,index);
				    }
					}
			}else{
				if(this.rootNode.querySelectorAll("input[type='radio']")[0].id == videoData.split("->")[0]){
					this.rootNode.querySelectorAll("input[type='radio']")[0].checked = true;
					this.rootNode.querySelector("input[type='text']").value = videoData.split("->")[1];
					src = "https://www.youtube.com/embed/"+videoData.split("->")[1];
				}else{
					this.rootNode.querySelectorAll("input[type='radio']")[1].checked = true;
					this.rootNode.querySelector("input[type='text']").value = videoData.split("->")[1];
					src = "https://player.vimeo.com/video/"+videoData.split("->")[1];
				}
				var target = this.rootNode.querySelectorAll("div.videoPlayerDiv")[0];
				ReactDOM.render(<GetVideoPlayer src = {src} allprops={this.props}/>,target);
				var childData={};
			    childData[Object.keys(this.props.data)[0]]=videoData.split("->")[0]+"-"+videoData.split("->")[1];
			    var index = this.props.index;
					if(this.props.AIS){
							this.props.callback(childData,index,'AIS');
					}else{
					    if(this.props.type){
					    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
					    }else{
					    	 this.props.callback(childData,index);
					    }
					}
			}
		}
	},
	clickHandler: function(event) {//pradep added 24-10-16 sources  bcoz are deleted earlier
	 	 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;
		 $(".errorMessage"+errorClass).html("");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
			 if(this.props.AIS){
						this.props.callback(childData,index,'AIS');
			 }else{
			     if(this.props.type){
			     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     	this.props.callback(childData,index);
			     }
			 }
	},
	getVideo : function(props,ev){
		var videoId = this.rootNode.querySelector("input[type='text']").value.trim();
		var videoSource,src;
		if(videoId != ""){
			if(this.rootNode.querySelectorAll("input[type='radio']")[0].checked){
				videoSource = "youtube";
				src = "https://www.youtube.com/embed/"+videoId;
			}else if(this.rootNode.querySelectorAll("input[type='radio']")[1].checked){
				videoSource = "vimeo";
				src = "https://player.vimeo.com/video/"+videoId;
			}else{
				alert("please selct video type");
				this.rootNode.querySelector("input[type='text']").value = "";
				return;
			}
			var target = this.rootNode.querySelectorAll("div.videoPlayerDiv")[0];
			var childData={};
		    childData[Object.keys(this.props.data)[0]]=videoSource+"->"+videoId;//this.props.properties.dataType.vsource+"-"+this.props.properties.dataType.remotevid;
		    var index = this.props.index;
				if(this.props.AIS){
						this.props.callback(childData,index,'AIS');
				}else{
				    if(this.props.type){
				    		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
				    }else{
				    	 	this.props.callback(childData,index);
				    }
				}
			ReactDOM.render(<GetVideoPlayer src = {src} allprops={this.props}/>,target);
		}
	},
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var prompt = properties.prompt ? properties.prompt : properties.displayName;
		count--;
		if(this.props.alertMessage){
			return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin ">
		   				<div className="margin-bottom-gap-xs">
		   					<span className={"fieldText no-padding-left headerField  "+ headdingFont} >{prompt}</span>
		   				</div>
		   				<div className="margin-bottom-gap-xs">
		   					<span className={"fieldText no-padding-left headerField  "+ headdingFont} >{this.props.message}</span>
		   				</div>
	   				</div>);
		}else{
			return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin ">
	   				<div className="margin-bottom-gap-xs">
	   					<span className={"fieldText no-padding-left headerField  "+headdingFont} >{prompt}</span>
	   				</div>
	   				<div id="videoSourceDiv" className="row no-margin">
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " >
		   					<input type="radio" ref={(e)=>{this.youtube=e}} id="youtube" className="video" name={"video"+count}/>&nbsp;&nbsp;
		   					<span className="fieldText link">YOUTUBE</span>
			       		</div>
			       		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
		   					<input type="radio" ref={(e)=>{this.vimeo=e}} id="vimeo" className="video" name={"video"+count}/>&nbsp;&nbsp;
		   					<span className="fieldText link">VIMEO</span>
			       		</div>
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<input type='text' ref={(e)=>{this[key]=e}} id={key}  onChange={this.clickHandler} placeholder={"Enter "+properties.displayName.toLowerCase()+" id"} className="form-control remove-padding-left video"  onBlur={this.getVideo.bind(null,properties)}/>
					</div>
					<div  className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group videoPlayerDiv" ></div>
	   			</div>)}
		}

})

var GetVideoPlayer = React.createClass({
	render : function(){
		return (
		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
			<iframe src={this.props.src} width={this.props.allprops.properties.dataType.width} height={this.props.allprops.properties.dataType.height}></iframe>
		</div>
		)
	}
})
var GetInputField = React.createClass({
	 clickHandler: function(event) {

	 	var searchKey=event.target.value;
	 	/*if(this.props.fullSchema &&
	 		this.props.fullSchema["@properties"] &&
			this.props.fullSchema["@identifier"] &&
			this.props.fullSchema["@identifier"] == this.props.fieldName && searchKey.trim()!=""){
					common.startLoader();
		 	 WebUtils.doPost("/generic?operation=lookupSchema",{
				 	 				searchKey:searchKey,
				 	 				schema:this.props.fullSchema["@id"],
				 	 				userId:common.getUserDoc().recordId,
				 	 				skip:0,
				 	 				org:"public",
				 	 				identifierCheck:true
		 	 				},function(result){
		 	 					common.stopLoader();
	            if(result.error){return;}
				if(result.records && Array.isArray(result.records)){
					for(var i=0;i<result.records.length;i++){
						if(result.records[i] && result.records[i].value && result.records[i].value[this.props.fieldName]==searchKey){
						 alert("already exists choose another");
						 try{
						 this[this.props.fieldName].value="";
						 }catch(err){
						 	console.log(err);
						}
					}
				}

				}
	         }.bind(this));
       }*/

	 	 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 $(".errorMessage"+errorClass).html("");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
			 if(this.props.AIS){
					this.props.callback(childData,index,'AIS');
			 }else{
		     	if(this.props.type){
		     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     	}else{
		     		this.props.callback(childData,index);
		     	}
			 }
	},
  componentDidMount:function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
				this.props.callback(childData,index,'AIS');
			}else{
		    if(this.props.type){
		    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		    }else{
		    	 this.props.callback(childData,index);
		    }
		  }
      if(index && index > 0 && !this.props.structName && this.props.permission != ""){
    	 	this["displayName"+this.props.fieldName].className+="  hidden";
	    }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var maxLength = properties.dataType.length ? properties.dataType.length : "";
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			//var placeholder=properties.displayName?properties.displayName.toLowerCase():properties.prompt;
			return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{properties.displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<input type='text' ref={(e)=>{this[key]=e}} id={key} maxLength={maxLength} defaultValue={defaultValue} onBlur={this.clickHandler} placeholder={prompt} className="form-control remove-padding-left email"/>
					</div>
	   			</div>)
	   	}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key}className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
	   	}else{
	   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>;
	   	}
	}

})


var RichTextEditor=React.createClass({
	editorCallback:function(text){
		var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		$(".errorMessage"+errorClass).html("");
	    var childData={};
	    childData[Object.keys(this.props.data)[0]]=text;
	    var index = this.props.index;
		if(this.props.AIS){
				this.props.callback(childData,index,'AIS');
		}else{
	     	if(this.props.type){
	     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
	     	}else{
	     		this.props.callback(childData,index);
	     	}
		}
	},
	componentDidMount:function(){
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
		if(this.props.AIS){
			this.props.callback(childData,index,'AIS');
		}else{
		    if(this.props.type){
		    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		    }else{
		    	 this.props.callback(childData,index);
		    }
		}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 	this["displayName"+this.props.fieldName].className+="  hidden";
		}
  	},
	render:function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var maxLength = properties.dataType.length ? properties.dataType.length : "";
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){

			return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{properties.displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
						<Editor mode="create" content={defaultValue} callback={this.editorCallback} />
					</div>
	   			</div>)
	   	}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<Editor mode="view" content={defaultValue} />
					</div>
	   			</div>)
	   	}else{
	   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>;
	   	}
	}
})

var MyTagsInput=React.createClass({
	editorCallback:function(text){
		var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		$(".errorMessage"+errorClass).html("");
	    var childData={};
	    childData[Object.keys(this.props.data)[0]]=text;
	    var index = this.props.index;
		if(this.props.AIS){
				this.props.callback(childData,index,'AIS');
		}else{
	     	if(this.props.type){
	     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
	     	}else{
	     		this.props.callback(childData,index);
	     	}
		}
	},
	componentDidMount:function(){
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
		if(this.props.AIS){
			this.props.callback(childData,index,'AIS');
		}else{
		    if(this.props.type){
		    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		    }else{
		    	 this.props.callback(childData,index);
		    }
		}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 	this["displayName"+this.props.fieldName].className+="  hidden";
		}
  	},
	render:function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var maxLength = properties.dataType.length ? properties.dataType.length : "";
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){

			return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{properties.displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
						<TagsInput mode="create" defaultValue={defaultValue} callback={this.editorCallback} />
					</div>
	   			</div>)
	   	}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div  className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					{defaultValue}
					</div>
	   			</div>)
	   	}else{
	   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>;
	   	}
	}
})


var GetCurrencyField = React.createClass({
	 clickHandler: function(event) {
	 	 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 $(".errorMessage"+errorClass).html("");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
			 if(this.props.AIS){
 					this.props.callback(childData,index,'AIS');
 			 }else{
		     if(this.props.type){
		     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     	this.props.callback(childData,index);
		     }
			}
	},
  componentDidMount:function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
		    if(this.props.type){
		    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		    }else{
		    	 this.props.callback(childData,index);
		    }
			}
      if(index && index > 0 && !this.props.structName && this.props.permission != ""){
    	 	this["displayName"+this.props.fieldName].className+="  hidden";
	    }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		var currencyType = this.props.properties.dataType.currencyType ? this.props.properties.dataType.currencyType : this.props.properties.dataType.elements.currencyType
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-9 col-md-9 col-xs-9 col-sm-9 no-padding-left form-group" >
	   					<input type='text' ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} onChange={this.clickHandler} placeholder={prompt} className="form-control remove-padding-left email"/>
					</div>
					<div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className={"form-control"}>{currencyType}</div>
					</div>
	   			</div>)
	   	}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin" title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-9 col-md-9 col-xs-9 col-sm-9 no-padding-left form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key}className="remove-padding-left ">{defaultValue}</div>
					</div>
					<div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key}>{currencyType}</div>
					</div>
	   			</div>)
	   	}else{
	   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>;
	   	}
	}

})


var GetLabelField = React.createClass({
	clickHandler: function(event) {
	 	 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 $(".errorMessage"+errorClass).html("");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
			     if(this.props.type){
			     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     		this.props.callback(childData,index);
			     }
			 }
	},
  componentDidMount:function(){
			var defaultValue = (this.props.properties.dataType.type == "label") ? this.props.properties.dataType.labelText : this.props.properties.dataType.elements.labelText;//this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
				  this.props.callback(childData,index,'AIS');
			}else{
			    if(this.props.type){
			    		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			    }else{
			    	 	this.props.callback(childData,index);
			    }
			}
      if(index && index > 0 && !this.props.structName && this.props.permission != ""){
    			this["displayName"+this.props.fieldName].className+="  hidden";
	   	}
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = (this.props.properties.dataType.type == "label") ? this.props.properties.dataType.labelText : this.props.properties.dataType.elements.labelText;//this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin"  title={description} >
		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
		   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
		   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
		   				</div>
		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
		   					<span ref={(e)=>{this[key]=e}} id={key}  className="remove-padding-left">{defaultValue}</span>
						</div>
		   			</div>)
		 }else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
	   	}else{
		 	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		 }
	}
})

var GetFormulaField = React.createClass({
	 clickHandler: function(event) {
	 	$(this).find("span.errorMsg").html("&nbsp;");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
	     if(this.props.type){
	     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
	     }else{
	     	this.props.callback(childData,index);
	     }
	},
  componentDidMount:function(){
    	formulaFields[this.props.fieldName] = this.props.properties;
    	if(this.props.permission != ""){
    		this[this.props.fieldName].setAttribute("readonly","readonly");
    	}
		var childData={};
	    childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
	    if(this.props.type){
	    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
	    }else{
	    	 this.props.callback(childData,index);
	    }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	     }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		formulaFields[key] =  properties;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin " title={description}>
		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
		   					<span className={"fieldText no-padding-left headerField "+headdingFont} >{displayName}</span>{/*+" ("+properties.dataType.type+")  ---> "+properties.dataType.expression*/}
		   				</div>
		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
		   					<input type='text' ref={(e)=>{this[key]=e}} id={key} defaultValue={this.props.data[Object.keys(this.props.data)[0]]} onChange={this.clickHandler} placeholder={prompt} disabled={true} className={"form-control remove-padding-left "+key} />
						</div>

		   			</div>)
		   }else if(this.props.permission == "read"){
		   		return (<div className="row no-margin " title={description}>
		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
		   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
		   				</div>
		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
		   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{this.props.data[Object.keys(this.props.data)[0]]}</div>
						</div>
		   			</div>)
		   	}else{
		   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		   }
		}
})

/**
 *used to render Email datatype component
 */
var GetEmailField = React.createClass({
	clickHandler: function(event) {
			var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
			$(".errorMessage"+errorClass).html("");
      var childData={};
      childData[Object.keys(this.props.data)[0]]=event.target.value;
      var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
	      	if(this.props.type){
		     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     	}else{
		     		this.props.callback(childData,index);
		     }
		  }
  },
  componentDidMount:function(){
    	var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
		    if(this.props.type){
		     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		    }else{
		     	this.props.callback(childData,index);
		    }
			}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin " title={description}>
					<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
						<span className={"fieldText no-padding-left headerField "+headdingFont} >{displayName}</span>
						&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
						<input type='email'  ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} className="form-control remove-padding-left email"  placeholder={prompt} onBlur={evaluateMailRegularExp.bind(this)} onChange={this.clickHandler}/>
					</div>
				</div>)
		}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
		   	}else{
				return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
			}
		}
	})

/**
 *used to render url datatype component
 */

var GetURLField = React.createClass({
	clickHandler: function(event) {
			 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
			 $(".errorMessage"+errorClass).html("");
		   var childData={};
		   childData[Object.keys(this.props.data)[0]]=event.target.value;
		   var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
			     if(this.props.type){
			     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     		this.props.callback(childData,index);
			     }
			 }
	},
	componentDidMount:function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
		     if(this.props.type){
		     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     		this.props.callback(childData,index);
		     }
		  }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
					<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
						<span className={"fieldText no-padding-left headerField  "+headdingFont}>{displayName}</span>
						&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
						<input type='text'   ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} className="form-control remove-padding-left"  placeholder={prompt}  onChange={this.clickHandler}/>
					</div>
				</div>)
		}else if(this.props.permission == "read"){
	   		return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	   				<div  className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
	   	}else{
			return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		}
	}
})


var GetPhoneField= React.createClass({
	getInitialState:function(){
		return {countriesList:[]};
	},
  clickHandler: function(event) {
    	 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		   $(".errorMessage"+errorClass).html("");
       var childData={};
       var phoneInput=this.rootNode.querySelectorAll("input[type='text']")[0].value.trim();
       if(phoneInput!=""){
          var code="+"+this.rootNode.querySelectorAll("button > span")[0].dataset.countryCode+"-";
          childData[Object.keys(this.props.data)[0]]=code+phoneInput;
       }else{
          childData[Object.keys(this.props.data)[0]]="";
       }
       var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
		       if(this.props.type){
		          this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		       }else{
		          this.props.callback(childData,index);
		       }
			 }
    },
    setCountryCode: function(countryObj,event){
       if(this.rootNode.querySelectorAll("button > span")[0].dataset.countryCode!=countryObj.countryCode){
           this.rootNode.querySelectorAll("button > span")[0].innerHTML=countryObj.countryName+"   +"+countryObj.countryCode;
           this.rootNode.querySelectorAll("button > span")[0].dataset.totalDigits=countryObj.totalDigits;
           this.rootNode.querySelectorAll("button > span")[0].dataset.countryCode=countryObj.countryCode;
           $(this.rootNode.querySelectorAll("input[type='text']")[0]).val("");
       }
       var childData={};
       var phoneInput=this.rootNode.querySelectorAll("input[type='text']")[0].value.trim();
       if(phoneInput!=""){
          var code="+"+this.rootNode.querySelectorAll("button > span")[0].dataset.countryCode+"-";
          childData[Object.keys(this.props.data)[0]]=code+phoneInput;
       }else{
          childData[Object.keys(this.props.data)[0]]="";
       }
       var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
		       if(this.props.type){
		          this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		       }else{
		          this.props.callback(childData,index);
		       }
			 }
    },
    checkPhoneNo:function(ev){
        if(this.rootNode.querySelectorAll("button > span")[0].dataset.totalDigits==undefined){
            $(ev.target).parents("div.row").eq(0).find("span.errorMsg").text("Please select country");
            ev.target.value = "";
        }else{
            if($(ev.target).val().length!=this.rootNode.querySelectorAll("button > span")[0].dataset.totalDigits){
                $(ev.target).parents("div.row").eq(0).find("span.errorMsg").text("Enter valid phone number");
                ev.target.value = "";
            }
        }
    },
    componentDidMount:function(){
    	var self=this;
    	WebUtils.getDefinition("CountryCodes",function(countryCodes){
				if(countryCodes.countryCodes){
					self.setState({countriesList:countryCodes.countryCodes});
				}
			});
			this.updateValue();
    },
    componentDidUpdate:function(){
    	this.updateValue();
    },
    updateValue:function(){
        var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
        var self=this;
        if(defaultValue!="" && this.props.permission != ""){
            var temp=defaultValue.split("-")[0];
            var code=temp.slice(1,temp.length);
            self.state.countriesList.map(function(countryObj){
              if(countryObj.countryCode==code){
                 self.dropdownspan.innerHTML=countryObj.countryName+"   +"+countryObj.countryCode;
                 self.dropdownspan.dataset.totalDigits=countryObj.totalDigits;
                 self.dropdownspan.dataset.countryCode=countryObj.countryCode;
              }
            });
        }
        var childData={};
        childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
        var index = this.props.index;
				if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
				}else{
		        if(this.props.type){
		            this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		        }else{
		            this.props.callback(childData,index);
		        }
				}
        if(index && index > 0 && !this.props.structName && this.props.permission != ""){
           	this["displayName"+this.props.fieldName].className+="  hidden";
        }
    },
    render : function(){
        var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
        var properties = this.props.properties;
        var key = this.props.fieldName;
				var displayName=properties.displayName?properties.displayName:key;
				var prompt = properties.prompt ? properties.prompt : displayName;
				var description=properties.description?properties.description:displayName;
        var errorClass = this.props.structName ? this.props.structName+key : key;
        var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
        if(defaultValue!=""){
            defaultValue=defaultValue.split("-")[1];
        }
        if(this.props.permission == "admin" || this.props.permission == "edit"){
	        return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	                    <div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	                        <span className={"fieldText no-padding-left headerField "+headdingFont}>{displayName}</span>
	                        &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	                    </div>
	                    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	                        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4 no-padding form-group">
	                            <button type="button" className="btn btn-default dropdown-toggle form-control"  data-toggle="dropdown">
	                                <span data-bind="label"  className = "picklistspan picklist" ref={(e)=>{this.dropdownspan=e}}>country</span>
	                            </button>
	                            <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
	                                {
	                                    this.state.countriesList.map(function(country){
	                                        return <li onClick={this.setCountryCode.bind(null,country)}><span>{country.countryName}   +{country.countryCode}</span></li>
	                                    },this)
	                                }
	                            </ul>
	                        </div>
	                        <div className="col-lg-8 col-md-8 col-sm-8 col-xs-8 no-padding-right">
	                            <input type='text'  ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} className="form-control remove-padding-left phone"   placeholder={prompt} onBlur={this.checkPhoneNo.bind(this)} onKeyPress={numeralsOnly.bind(this)} onChange={this.clickHandler}/>
	                        </div>
	                    </div>
	            </div>)
	        }else if(this.props.permission == "read"){
		   		return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	                    <div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	                        <span className={"fieldText no-padding-left headerField "+headdingFont}>{displayName}</span>
	                        &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	                    </div>
	                    <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	                        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4  no-padding form-group">
	                            <button type="button" className="btn btn-default dropdown-toggle"  data-toggle="dropdown">
	                                <span data-bind="label"  className = "picklistspan picklist" ref={(e)=>{this.dropdownspan=e}}>country</span>
	                            </button>

	                        </div>
	                        <div className="col-lg-8 col-md-8 col-xs-8 col-sm-8 no-padding-right">
	                            <div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left phone"  >{defaultValue}</div>
	                        </div>
	                    </div>
	            </div>)
		   	}else{
	        	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
	        }
        }
    })


/**
 *used to render textarea datatype component
 */
var GetTextareaField = React.createClass({
	getInitialState:function(){
		return {url:null}
	},
	clickHandler: function(event) {
		 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 $(".errorMessage"+errorClass).html("");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
			     if(this.props.type){
			     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     	this.props.callback(childData,index);
			     }
			 }
	},
	renderURI:function(event){
		var code=event.keyCode? event.keyCode:event.which;
		if(code==32){
			try{
					var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[{};:'".,<>?Â«Â»â€œâ€�â€˜â€™]|\]|\?))/ig
					var text = this[this.props.fieldName].value;
					var allURIs=text.match(uri_pattern);
					if(allURIs && allURIs.length>0){
						this.setState({url:allURIs[0]});
					}else{
						this.setState({url:null});
					}
			}catch(err){}
		}
	},
	componentDidMount:function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	   	var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
		     if(this.props.type){
		     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     	this.props.callback(childData,index);
		     }
			}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
	    this.renderURI({keyCode:32});
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var maxLength = properties.dataType.length ? properties.dataType.length : "";
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		var urlfind="";
		if(this.state.url && this.state.url!=""){
			urlfind=<getURLContent.GetURLContent url={this.state.url}/>;
		}
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			var placeholder=properties.displayName?properties.displayName.toLowerCase():properties.prompt;
			return (<div className="row no-margin " title={description}>
					<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
						<span className={"fieldText no-padding-left headerField "+headdingFont}>{displayName}</span>
						&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
					</div>

	   				<div  key={global.guid()}  className={"col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding "+(urlfind?"form-group":"") }>
	   					{urlfind}
	   				</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
						 <textarea id={key}  ref={(e)=>{this[key]=e}} className="form-control remove-padding-left textarea" rows="6" maxLength={maxLength} defaultValue={defaultValue}   placeholder={prompt} onChange={this.clickHandler} onKeyPress={this.renderURI}></textarea>
					</div>
				</div>)
		}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div  key={global.guid()}  className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					{urlfind}
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
	   	}else{
			return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		}
	}
})

/**
 *used to render Date datatype component
 */
var GetDateField = React.createClass({
	clickHandler: function(event) {
		 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 $(".errorMessage"+errorClass).html("");
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=event.target.value;
	     var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
			     if(this.props.type){
			     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     		this.props.callback(childData,index);
			     }
		   }
	},
	componentDidMount : function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			if(this.props.permission != ""){
				$('.datepicker').datetimepicker({
					format: "DD-MMM-YYYY",
					showClose:true
				})
			}
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
		     if(this.props.type){
		     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     		this.props.callback(childData,index);
		     }
			}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
	},
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin " title={description}>
					<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
						<span className={"fieldText no-padding-left headerField "+headdingFont}>{displayName}</span>
						&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
						<input type='text'   ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} className="form-control remove-padding-left datepicker"   placeholder={prompt} onBlur={this.clickHandler}/>
						 <span className="add-on"><i className="icon-th"></i></span>
					</div>
				</div>)
			}else if(this.props.permission == "read"){
		   		return (<div className="row no-margin " title={description}>
		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
		   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
		   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
		   				</div>
		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
		   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
						</div>
		   			</div>)
		   	}else{
				return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
			}
		}
	})

var GetTimeField = React.createClass({
	clickHandler: function(event) {
		 	var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 	$(".errorMessage"+errorClass).html("");
		 	$(this).find("span.errorMsg").html("");
	    var childData={};
	    childData[Object.keys(this.props.data)[0]]=event.target.value;
	    var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
			     if(this.props.type){
			     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     	this.props.callback(childData,index);
			     }
			}
	},
	componentDidMount : function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			if(this.props.permission != ""){
				$('.time').datetimepicker({
					format: "LT",
					showClose:true
				})
			}

			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	   	var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
		     if(this.props.type){
		     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     	this.props.callback(childData,index);
		     }
		  }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
	},
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin " title={description}>
						<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
							<span className={"fieldText no-padding-left headerField title "+headdingFont}>{displayName}</span>
							&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
						</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
								<input type='text' ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} className="form-control remove-padding-left time"   placeholder={prompt} onBlur={this.clickHandler}/>
					 			<span className="add-on"><i className="icon-th"></i></span>
					  </div>
					</div>)
		}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
						</div>
	   			</div>)
	  }else{
				return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		}
	}
})


var GetDateTimeField = React.createClass({
	clickHandler: function(event) {
		 	var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 	$(".errorMessage"+errorClass).html("");
	    var childData={};
	    childData[Object.keys(this.props.data)[0]]=event.target.value;
	    var index = this.props.index;
			if(this.props.AIS){
				 this.props.callback(childData,index,'AIS');
			}else{
			   if(this.props.type){
			   		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			 	 }else{
			   		this.props.callback(childData,index);
			   }
			}
	},
	componentDidMount : function(){
			var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
			if(this.props.permission != ""){
				$('.dateTime').datetimepicker({
					format: "DD-MMM-YYYY hh:mm",
					showClose:true
				})
			}
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
		 		this.props.callback(childData,index,'AIS');
		  }else{
				 if(this.props.type){
		     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     		this.props.callback(childData,index);
		     }
			}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
	},
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin " title={description}>
						<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
							<span className={"fieldText no-padding-left headerField  "+headdingFont}>{displayName}</span>
							&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
						</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  form-group" >
							<input type='text'   ref={(e)=>{this[key]=e}} id={key} defaultValue={defaultValue} className="form-control remove-padding-left dateTime"  placeholder={prompt} onBlur={this.clickHandler}/>
							 <span className="add-on"><i className="icon-th"></i></span>
						</div>
					</div>)
			}else if(this.props.permission == "read"){
		   		return (<div className="row no-margin " title={description}>
		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
		   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
		   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
		   				</div>
		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
		   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
						</div>
		   			</div>)
		   	}else{
				return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
			}
		}
	})

/**
 *used to render MultiPickList datatype component
 */
var GetPickListField = React.createClass({
	clickHandler: function(option,ev) {
		 var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 $(".errorMessage"+errorClass).html("");
		 this.rootNode.querySelectorAll("button > span")[0].innerHTML=option;
	     var childData={};
	     childData[Object.keys(this.props.data)[0]]=option;
	     var index = this.props.index;
			 if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			 }else{
		     	 if(this.props.type){
			     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     		this.props.callback(childData,index);
			     }
			}
	    var properties = this.props.properties;
	    var key = this.props.fieldName;
	    if(properties.dataType.hasOwnProperty("derived")){
	    	var childData1={};//pradeep 22/09/15
	    	childData1[this.props.data[Object.keys(this.props.data)[0]]]="";//pradeep 22/09/15
	    	this.props.callback(childData1,index); //pradeep 22/09/15
		   	var name = this.props.abstractSchema+"-"+childData[this.props.fieldName];
		   	this.DerivedObjectRender.innerHTML ="";
		   //this.derivedHeader.innerHTML="<br /><label><span class='fieldText no-padding-left text-uppercase'></span></label>";//"+childData[this.props.fieldName]+" Properties
		  	ReactDOM.render(<DisplayCustomSchema data = {name}  callback={this.props.callback} displayName={"dependentProperties"}  admin={true}/>,this.DerivedObjectRender);
	    }
	},
	componentDidMount:function(){
		var properties = this.props.properties;
		var childData={};
		childData[Object.keys(this.props.data)[0]]=(this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : ""));
	    var index = this.props.index;
		if(this.props.AIS){
			this.props.callback(childData,index,'AIS');
		}else{
			if(this.props.type){
				this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			}else{
				this.props.callback(childData,index);
			}
		}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
			this["displayName"+this.props.fieldName].className+="  hidden";
	    }
		if(this.props.data[Object.keys(this.props.data)[0]] && this.props.permission != ""){
			this.rootNode.querySelectorAll("button > span")[0].innerHTML = this.props.data[Object.keys(this.props.data)[0]];
			if(properties.dataType.hasOwnProperty("derived")){
				var key = this.props.fieldName;
				var name = this.props.abstractSchema+"-"+this.props.data[Object.keys(this.props.data)[0]];
				this.DerivedObjectRender.innerHTML ="";
				//this.derivedHeader.innerHTML="<br /><label><span class='fieldText no-padding-left text-uppercase'>"+this.props.data[Object.keys(this.props.data)[0]]+" Properties</span></label>";
				ReactDOM.render(<DisplayCustomSchema data = {name}  callback={this.props.callback} record1={this.props.record1} displayName={"dependentProperties"}  admin={true}/>,this.DerivedObjectRender);
			}
		}else if(this.props.dependentSchema && properties.dataType.hasOwnProperty("derived")){// added by vikram for displaying ds properties
			this.rootNode.querySelectorAll("button > span")[0].innerHTML = this.props.dependentSchema;
			var key = this.props.fieldName;
			var name = this.props.abstractSchema+"-"+this.props.dependentSchema;
			this.DerivedObjectRender.innerHTML ="";
			//this.derivedHeader.innerHTML="<br /><label><span class='fieldText no-padding-left text-uppercase'>"+this.props.dependentSchema+" Properties</span></label>";
			ReactDOM.render(<DisplayCustomSchema data = {name}  callback={this.props.callback} record1={this.props.record1} displayName={"dependentProperties"}  admin={true}/>,this.DerivedObjectRender);
		}else{
			if(this.props.permission != ""){
				this.rootNode.querySelectorAll("button > span")[0].innerHTML = this.props.properties.defaultValue ? this.props.properties.defaultValue : (this.props.properties.prompt?this.props.properties.prompt:this.props.properties.displayName);
			}
		}
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		count--;
		clickHandler = this.clickHandler;
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var headding = [],options;
		if(this.props.type == "array"){
			options = properties.dataType.elements.options;
		}else{
			options = properties.dataType.options;
		}
		if(this.props.permission == "admin" || this.props.permission == "edit"){
		return (<div ref={(e)=>{this.rootNode=e}} className="row remove-margin-left remove-margin-right" title={description}>
					<div id="picklistTypeDiv" className="row no-margin ">
						<span className={headdingFont} ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
						&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 form-group margin-top-gap-xs no-padding" >
			                <button type="button" className="btn btn-default dropdown-toggle form-control"  data-toggle="dropdown">
		                     	<span data-bind="label" id={key}  className = "picklistspan picklist" ref={(e)=>{this.dropdownspan=e}}>Select</span>
		                    </button>
		                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
	                           {/*<li className="h5 link"><span >Select</span></li>*/}
	                           	{
	                           		options.map(function(option){
	                           			return <li className="h5 link" onClick={this.clickHandler.bind(null,option)}><span >{option}</span></li>
	                           		},this)
	                           	}
                          	</ul>
						</div>
						<div ref={(e)=>{this.derivedHeader=e}} className="derived"></div>
						<div ref={(e)=>{this.DerivedObjectRender=e}}  className="derived" id={key+"DerivedObjectRender"} ></div>
					</div>
				</div>)
			}else if(this.props.permission == "read"){
				return(<div ref={(e)=>{this.rootNode=e}} className="row remove-margin-left remove-margin-right form-group" title={description}>
					<div id="picklistTypeDiv" className="row no-margin ">
						<span className={headdingFont} ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
						&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 form-group no-padding" >
			                <button type="button" className="btn dropdown-toggle "  data-toggle="dropdown">
		                     	<span data-bind="label" id={key}  className = "picklistspan picklist" ref={(e)=>{this.dropdownspan=e}}>{(this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : ""))}</span>
		                    </button>

						</div>
					</div>
				</div>)
		   	}else{
				return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
			}
		}
	})
/**
 *used to render PickList datatype component
 */
var multiPick = [];//for store multipicklist values
var GetMultiPickListField = React.createClass({
	clickHandler: function(event) {
		 	var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 	$(".errorMessage"+errorClass).html("");
		 	var multiPickList = [];
		 	var length = this.rootNode.querySelectorAll("input[type='checkbox']").length;
		 	for(var i = 0;i < length;i++){
				if(this.rootNode.querySelectorAll("input[type='checkbox']")[i].checked){
						multiPickList.push(this.rootNode.querySelectorAll("input[type='checkbox']")[i].value);
				}
		 	}
		 	if(event.target.checked){
					multiPick.push(event.target.value);
		 	}else{
					multiPick.splice(multiPick.indexOf(event.target.value),1);
		 	}
	    var childData={};
	    childData[Object.keys(this.props.data)[0]]=multiPickList;
	    var index = this.props.index;
			if(this.props.AIS){
 					 this.props.callback(childData,index,'AIS');
 			}else{
			     if(this.props.type){
			     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     	this.props.callback(childData,index);
			     }
			}
	},
	componentDidMount:function(){
			multiPick = [];
			var childData={};
	    childData[Object.keys(this.props.data)[0]]=(this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : this.props.properties.defaultValue);
	   	var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
	    		if(this.props.type){
	     				this.props.callback(childData,index,"","",this.props.type,this.props.callback);
	     		}else{
	     				this.props.callback(childData,index);
	     		}
		  }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 	this["displayName"+this.props.fieldName].className+="  hidden";
	    }
	    if(this.props.permission != ""){
	     	 var k = 0;
		     for(var i = 0;i<this.rootNode.querySelectorAll("input[type='checkbox']").length;i++){
		     		if(this.rootNode.querySelectorAll("input[type='checkbox']")[i].value === this.props.data[Object.keys(this.props.data)[0]][k]){
		     			k++;
		     			this.rootNode.querySelectorAll("input[type='checkbox']")[i].setAttribute("checked","checked");
		     			multiPick.push(this.props.data[Object.keys(this.props.data)[0]][i]);
		     		}
		     }
		     if(!this.props.data[Object.keys(this.props.data)[0]]){//for check defaultValue
		     	var l = 0;
			     for(var i = 0;i<this.rootNode.querySelectorAll("input[type='checkbox']").length;i++){
			     	if(this.rootNode.querySelectorAll("input[type='checkbox']")[i].value === this.props.properties.defaultValue){
			     		l++;
			     		this.rootNode.querySelectorAll("input[type='checkbox']")[i].setAttribute("checked","checked");
			     		multiPick.push(this.props.data[Object.keys(this.props.data)[0]][i]);
			     	}
			     }
		     }
	     }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		clickHandler = this.clickHandler;
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var headding = [];
		var options;
		if(this.props.type == "array"){
			options = properties.dataType.elements.options;
		}else{
			options = properties.dataType.options;
		}
		options.map(function(MultiPickList){
			headding.push(<div>
				<input type="checkbox" className="vertical-align-middle" value={MultiPickList} id={MultiPickList+"MPL"} name={key} onChange={this.clickHandler}/>&nbsp;
	   				<span className="vertical-align-middle">{MultiPickList}</span>
				</div>)

		})
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="margin-bottom-gap-xs" ref={(e)=>{this.rootNode=e}} className="row remove-margin-left remove-margin-right form-group" title={description}>
						<span id={key}  className="fieldText no-padding-left headerField title multipicklist" ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
					    <div style={{"max-height":"250px","overflow-y":"auto"}}>{headding}</div>
					</div>)
		}else if(this.props.permission == "read"){
	   		return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{this.props.data[Object.keys(this.props.data)[0]]}</div>
					</div>
	   			</div>)
	   	}else{
			return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		}
	}
})


var GetBooleanField = React.createClass({
	 	clickHandler: function(event) {
	 	 		var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 		$(".errorMessage"+errorClass).html("");
		 		var value;
		  	if(this.rootNode.querySelector("input[type='radio'].booleanTrue").checked){
		    		value = true;
		    }else{
		    		value = false;
		   	}
	     	var childData={};
	     	childData[Object.keys(this.props.data)[0]]=value;
	     	var index = this.props.index;
				if(this.props.AIS){
						 this.props.callback(childData,index,'AIS');
				}else{
			     	if(this.props.type){
			     			this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     	}else{
			     			this.props.callback(childData,index);
			     	}
				}
		},
    componentDidMount:function(){
    	try{
				var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : false;
				//defaultValue = defaultValue == true ? defaultValue == true : defaultValue == false;
				var childData={};
	    	childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	     	var index = this.props.index;
				if(this.props.AIS){
						 this.props.callback(childData,index,'AIS');
				}else{
				    if(this.props.type){
				    	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
				    }else{
				    	 this.props.callback(childData,index);
				    }
				}
	    	if(defaultValue == true){
	    			this.rootNode.querySelector("input[type='radio'].booleanTrue").checked = true;
	    	}else{
	    			this.rootNode.querySelector("input[type='radio'].booleanFalse").checked = true;
	    	}
       	if(index && index > 0 && !this.props.structName && this.props.permission != ""){
    	 			this["displayName"+this.props.fieldName].className+="  hidden";
	     	}
	     }catch(err){}
  },
	render : function(){
		count --;
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
	   					<input type="radio" className="booleanTrue" value={true} name={key+count} onChange={this.clickHandler}/>&nbsp;
	   					<span>true</span>
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<input type="radio" className="booleanFalse" value={false} name={key+count} onChange={this.clickHandler}/>&nbsp;
	   					<span>false</span>
					</div>
	   			</div>)
	   	}else if(this.props.permission == "read"){
	   		return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key}className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
	   	}else{
	   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>;
	   	}
	}

})


/**
 *used to render Object datatype component
 */

var GetObjectField = React.createClass({
	  componentDidMount:function(){
	       var self = this;
	       if(this.props.permission != ""){
    			if(this.props.permission == "admin" || this.props.permission == "edit"){
    				this.rootNode.querySelector("input[type='text']#"+this.props.fieldName).setAttribute("readonly","true");
    				if(this.props.junctionProperty==this.props.fieldName){
    				        //Remove lookup popups only
    				        self[self.props.junctionProperty].click();
    				}
    			}
			}
			var childData={};
	    	childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
	    	var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
		     	if(this.props.type){
	     				this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     	}else{
		     			this.props.callback(childData,index);
		     	}
			}
	     	if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 	this["displayName"+this.props.fieldName].className+="  hidden";
	     	}

	     	if(this.props.data[Object.keys(this.props.data)[0]] != ""){
		     	var schema="";
		     	var refKey=""
		     	var refKeyType=undefined;
		     	var refKeyObjRef=undefined;
		     	if(this.props.properties.dataType.type=="array"){
		     		schema=this.props.properties.dataType.elements.objRef;
		     		refKey=this.props.properties.dataType.elements.refKey;
		     		refKeyType=this.props.properties.dataType.elements.refKeyType;
		     		refKeyObjRef=this.props.properties.dataType.elements.refKeyObjRef;
		     	}else{
		     		schema=this.props.properties.dataType.objRef;
		     		refKey=this.props.properties.dataType.refKey;
		     		refKeyType=this.props.properties.dataType.refKeyType;
		     		refKeyObjRef=this.props.properties.dataType.refKeyObjRef;
		     	}
				var key=self.props.fieldName;
				if(self.props.index){
				  	objRef=self.props.index;
				  	key=key+""+self.props.index;
				}
				if(refKey=="recordId" &&
    				this.props.data[Object.keys(this.props.data)[0]] &&
    				this.props.data[Object.keys(this.props.data)[0]]!="public"){//naveed
                        WebUtils.doPost("/schema?operation=getRecord",{"name":this.props.data[Object.keys(this.props.data)[0]]},function(savedRecord){
                            lookupData[self.props.data[Object.keys(self.props.data)[0]]] = savedRecord.data;
                            if(self && self[key] && self[key])
                            self.view(savedRecord.data,self[key]);
                        })
                }else if(refKeyType &&
                   	refKeyType=="object" &&
                   	refKeyObjRef &&
                   	this.props.data[Object.keys(this.props.data)[0]] &&
                   	this.props.data[Object.keys(this.props.data)[0]]!="public"){
                   	WebUtils.doPost("/schema?operation=getRecord",{"name":this.props.data[Object.keys(this.props.data)[0]]},function(savedRecord){
                            lookupData[self.props.data[Object.keys(self.props.data)[0]]] = savedRecord.data;
                            if(self && self[key] && self[key])
                            self.view(savedRecord.data,self[key],refKeyObjRef);
                    })
               }
		    }
	  },
	  deleteObject:function(){
				var objRef="";
				if(this.props.index){
					objRef=this.props.index;
				}
				var childData = {};
				childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
		    var index = this.props.index;
				if(this.props.AIS){
						 this.props.callback(childData,index,'AIS');
				}else{
				    if(this.props.type){
			     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
				    }else{
				     	this.props.callback(childData,index);
				    }
			  }
   			ReactDOM.unmountComponentAtNode(this["objectRender"+objRef]);
		  	this[this.props.fieldName+""+objRef].parentNode.className=this[this.props.fieldName+""+objRef].parentNode.className.replace("hidden", "")
	    	this[this.props.fieldName+""+objRef].className=this[this.props.fieldName+""+objRef].className.replace("hidden", "");
	    	this[this.props.fieldName+""+objRef].value="";
	    	ReactDOM.unmountComponentAtNode(this["displayName"+this.props.fieldName]);
		  	fillData("",(this.props.fieldName+objRef),this.props,function temp(){},this[this.props.fieldName+objRef],{})
	  },
	 view:function(data,target,refKeyObjRef){
	 		var self=this;
	 		var refKey="";
	 		var objRef="";
		   	var refKeyType=undefined;
		   	var refKeyObjRef=undefined;
	 		if(this.props.properties.dataType.type=="object"){
	 			refKey=this.props.properties.dataType.refKey;
	 			objRef=this.props.properties.dataType.objRef;
		   		refKeyType=this.props.properties.dataType.refKeyType;
		   		refKeyObjRef=this.props.properties.dataType.refKeyObjRef;
	 		}else if(this.props.properties.dataType.type=="array"){
	 			refKey=this.props.properties.dataType.elements.refKey;
	 			objRef=this.props.properties.dataType.elements.objRef;
		   		refKeyType=this.props.properties.dataType.elements.refKeyType;
		   		refKeyObjRef=this.props.properties.dataType.elements.refKeyObjRef;
	 		}
	 		var objRender="objectRender";
			if(this.props.index){
				objRender+=this.props.index;
			}
	 		if(refKey=="recordId" && data.recordId!="public"){
	 			target.className+=" hidden";
	 			target.parentNode.className+=" hidden";
				ReactDOM.unmountComponentAtNode(this[objRender]);

				ReactDOM.render((<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="child-img-component">
									<genericView.GoIntoDetail
												summary={true}
												displayName={"no"}
												viewName={"quickView"}
												fromRelation={"relation"}
												rootSchema={objRef}
												record={{value:data}}
												recordId={data.recordId}
												org={this.props.org}/>
								</div>
								<div className="child-img-component verticle-align-top">
									<div className="sleekIcon-delete fa-2x link form-group" onClick={this.deleteObject}/>
								</div>
								</div>),this[objRender]);

			}else if(refKeyType && refKeyType=="object" && refKeyObjRef){
				if(data[refKey]){
					WebUtils.doPost("/schema?operation=getRecord",{"name":data[refKey]},function(savedRecord){
	                        lookupData[data[refKey]] = savedRecord.data;
							target.className+=" hidden";
		 					target.parentNode.className+=" hidden";
							ReactDOM.unmountComponentAtNode(self[objRender]);
							ReactDOM.render((<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
											<div className="child-img-component">
												<common.UserIcon rootSchema={refKeyObjRef}
														id={data[refKey]}
	                                					org={self.props.org}/>
											</div>
											<div className="child-img-component verticle-align-top">
												<div className="sleekIcon-delete fa-2x link form-group" onClick={self.deleteObject}/>
											</div>
										</div>),self[objRender]);
					});
				}else{
				target.className+=" hidden";
	 			target.parentNode.className+=" hidden";
				ReactDOM.unmountComponentAtNode(this[objRender]);

				ReactDOM.render((<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
								<div className="child-img-component">
									<genericView.GoIntoDetail summary={true}
												displayName={"no"}
												viewName={"quickView"}
												fromRelation={"relation"}
												rootSchema={refKeyObjRef}
												record={{value:data}}
												recordId={data.recordId}
												org={this.props.org}/>
								</div>
								<div className="child-img-component verticle-align-top">
									<div className="sleekIcon-delete fa-2x link form-group" onClick={this.deleteObject}/>
								</div>
								</div>),this[objRender]);
				}
			}
	 	},
		render : function(){
			var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
			var properties = this.props.properties;
			var key = this.props.fieldName;
			this.props["POT"] = this;
			var self=this;
			var objRef="";
			var errorClass = this.props.structName ? this.props.structName+key : key;
			if(this.props.index){
				objRef=this.props.index;
				key=key+""+this.props.index;
			}
			var schemaRef="";
			if(properties.dataType.type=="object"){
				schemaRef=properties.dataType.objRef;
			}else if(properties.dataType.type=="array"){
				schemaRef=properties.dataType.elements.objRef;
			}
			var displayName=properties.displayName?properties.displayName:key;
			var prompt = properties.prompt ? properties.prompt : displayName;
			var description=properties.description?properties.description:displayName;
			if(this.props.permission == "admin" || this.props.permission == "edit"){
				return (<div  ref={(e)=>{this.rootNode=e}}  className="row no-margin " title={description}>
    						<div className="margin-bottom-gap-xs">
    							<span className={"fieldText no-padding-left "+headdingFont} ref={(e)=>{this["displayName"+this.props.fieldName]=e}} >{displayName}</span>
    							&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
    						</div>
    						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
    							<input type='text' id={this.props.fieldName} ref={(e)=>{this[key]=e}} defaultValue={this.props.data[Object.keys(this.props.data)[0]]} className="form-control remove-padding-left" placeholder={prompt}  onClick={getDataFromDB.bind(null,properties,key,this.props,this.view,this.props.getMyState())} />
    						</div>
    						<div ref={(e)=>{this["objectRender"+objRef]=e}}></div>
    					</div>)
	    	}else if(this.props.permission == "read"){
		   		return (<div  ref={(e)=>{this.rootNode=e}}  className="row no-margin " title={description}>
    		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
    		   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
    		   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
    		   				</div>
    		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
    		   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{this.props.data[Object.keys(this.props.data)[0]]}</div>
    						</div>
    		   			</div>)
		   	}else{
	    		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
	    	}
	   }
})

/**
 *used to render Number datatype component
 */
var GetNumberField = React.createClass({
	clickHandler: function(event) {
		  var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		  $(".errorMessage"+errorClass).html("");
   		var childData={};
     	childData[Object.keys(this.props.data)[0]]=event.target.value;
     	var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
			     if(this.props.type){
			     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     	this.props.callback(childData,index);
			     }
		  }
	},
	componentDidMount:function(){
	  	var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
	  	var childData={};
	    childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
		     if(this.props.type){
		     	 	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     	 	this.props.callback(childData,index);
		     }
		  }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
  },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
						<div className="margin-bottom-gap-xs">
							<span className={"fieldText no-padding-left headerField "+ headdingFont} ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
							&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
						</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
							<input type='text' id={key} defaultValue={defaultValue} className="form-control remove-padding-left"  placeholder={prompt} onKeyPress={numeralsOnly.bind(this)} onChange={this.clickHandler}/>
						</div>
				   </div>)
		}else if(this.props.permission == "read"){
	   		return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
	   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{this.props.data[Object.keys(this.props.data)[0]]}</div>
					</div>
	   			</div>)
	   	}else{
			return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		}
	}
})


var GetGeoLocationField = React.createClass({
	 clickHandler: function(event) {
	 	 var targetDiv = this.rootNode.querySelectorAll("div.geoLocation")[0];
	 	 var latitude = this.rootNode.querySelectorAll("input[type='text']")[1];
	 	 var longitude = this.rootNode.querySelectorAll("input[type='text']")[2];
	 	 if(latitude.value.trim() != "" && longitude.value.trim() != ""){
	 		 displayMap(latitude.value,longitude.value,this);
	 	 }else{
	 		targetDiv.style.height = "0px";
	 		targetDiv.innerHTML = "";
	 	 }
	 	var temp = {};
		temp["latitude"] = latitude.value.trim();
		temp["longitude"] = longitude.value.trim();
		temp["locationName"]=this.searchPlace.value;//Added by saikiran.vadlakonda

		 var childData={};
	     childData[Object.keys(this.props.data)[0]]=temp;
	     var index = this.props.index;
			 if(this.props.AIS){
 					 this.props.callback(childData,index,'AIS');
 			 }else{
			     if(this.props.type){
			     		this.props.callback(childData,index,"","",this.props.type,this.props.callback);
			     }else{
			     		this.props.callback(childData,index);
			     }
			 }
	},
  componentDidMount:function(){
    	var targetDiv,latitude,longitude;
    	if(this.props.permission != ""){
    		targetDiv = this.rootNode.querySelectorAll("div.geoLocation")[0];
		     latitude = this.latitude;//.querySelectorAll("input[type='text']")[1];
		 	 longitude = this.longitude;//.querySelectorAll("input[type='text']")[2];
		 	 if(this.props.permission == "read"){
		 	 	 if(latitude.innerHTML != "" && longitude.innerHTML != ""){
			 		displayMap(latitude.innerHTML,longitude.innerHTML,this);
			 	}else{
			 		targetDiv.style.height = "0px";
			 		targetDiv.innerHTML = "";
			 	}
		 	 }else{
		 	 	 if(latitude.value.trim() != "" && longitude.value.trim() != ""){
			 		displayMap(latitude.value,longitude.value,this);
			 	}else{
			 		targetDiv.style.height = "0px";
			 		targetDiv.innerHTML = "";
			 	}
		 	 }
    	}


	 	 var childData={};
	   childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
		 var index = this.props.index;
		 if(this.props.AIS){
					this.props.callback(childData,index,'AIS');
		 }else{
			 	 if(this.props.type){
		     	this.props.callback(childData,index,"","",this.props.type,this.props.callback);
		     }else{
		     	this.props.callback(childData,index);
		     }
		 }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
	    	 this["displayName"+this.props.fieldName].className+="  hidden";
	    }
	     /*
	      * Below lines added saikiran.vadlakonda
	      */
	     if(this.props.permission != ""){
	     	var searchInput = this.searchPlace;
		     var self = this;
		     var searchBox = new google.maps.places.SearchBox(searchInput);
		     var latInput = this.rootNode.querySelectorAll("input[type='text']")[1];
		     var langInput = this.rootNode.querySelectorAll("input[type='text']")[2];

		     google.maps.event.addListener(searchBox, 'places_changed', function() {
		     	var place = searchBox.getPlaces()[0];
		     	latInput.value=place.geometry.location.lat();
		     	langInput.value=place.geometry.location.lng();
		     	var latitude={},longitude={};
		     	latitude.value = place.geometry.location.lat();
		     	longitude.value = place.geometry.location.lng();
		     	if(latInput.value!="" && langInput.value!=""){
		     		displayMap(latitude.value, longitude.value, self);
		     	}

		     	/*
		     	 * Storing latitude, longitude values
		     	 * */
		     	var temp = {};
				temp["latitude"] = latitude.value;
				temp["longitude"] = longitude.value;
				temp["locationName"]=self.searchPlace.value;//Added by saikiran.vadlakonda
			 	var childData={};
		     	childData[Object.keys(self.props.data)[0]]=temp;
		     	var index = self.props.index;
					if(self.props.AIS){
							 self.props.callback(childData,index,'AIS');
					}else{
				     	if(self.props.type){
				     		self.props.callback(childData,index,"","",self.props.type,self.props.callback);
				     	}else{
				     		self.props.callback(childData,index);
				     	}
					}
		     });
	     }

    },
	render : function(){
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
						<div className="margin-bottom-gap-xs">
							<span className="fieldText no-padding-left headerField title " ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
							&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
						</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group no-padding" >
		   					<span className="fieldText no-padding-left headerField title " >SEARCH BY LOCATION</span>
		   					<input type='text' ref={(e)=>{this.searchPlace=e}}  defaultValue={this.props.data[Object.keys(this.props.data)[0]]["locationName"]}  placeholder="Search Your Place" className="form-control remove-padding-left email search" />
						</div>
		   				<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6  form-group no-padding" >
		   					<span className="fieldText no-padding-left headerField title " >LATITUDE</span>
		   					<input type='text' id={key+"Latitude"}  ref={(e)=>{this.latitude=e}} defaultValue={this.props.data[Object.keys(this.props.data)[0]]["latitude"]} onBlur={this.clickHandler} placeholder="Enter Latitude" className="form-control remove-padding-left latitude" />
						</div>
						<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6  form-group no-padding-right" >
		   					<span className="fieldText no-padding-left headerField title " >LONGITUDE</span>
		   					<input type='text'  id={key+"Longitude"} ref={(e)=>{this.longitude=e}} defaultValue={this.props.data[Object.keys(this.props.data)[0]]["longitude"]} onBlur={this.clickHandler} placeholder="Enter Longitude" className="form-control remove-padding-left longitude" />
						</div>
						<div ref={(e)=>{this.geoLocation=e}}  className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group geoLocation" ></div>
		   			</div>)
		   	}else if(this.props.permission == "read"){
				return (<div ref={(e)=>{this.rootNode=e}} className="row no-margin " title={description}>
							<div className="margin-bottom-gap-xs">
								<span className="fieldText no-padding-left headerField title " ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
								&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
							</div>
							<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group no-padding" >
			   					<span className="fieldText no-padding-left headerField title " >SEARCH BY LOCATION</span>
			   					<div ref={(e)=>{this.searchPlace=e}}  className="remove-padding-left email search" >{this.props.data[Object.keys(this.props.data)[0]]["locationName"]}</div>
							</div>
			   				<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6  form-group no-padding" >
			   					<span className="fieldText no-padding-left headerField title " >LATITUDE</span>
			   					<div id={key+"Latitude"}  ref={(e)=>{this.latitude=e}}  className="remove-padding-left " >{this.props.data[Object.keys(this.props.data)[0]]["latitude"]}</div>
							</div>
							<div className="col-lg-6 col-md-6 col-xs-6 col-sm-6  form-group no-padding-right" >
			   					<span className="fieldText no-padding-left headerField title " >LONGITUDE</span>
			   					<div id={key+"Longitude"} ref={(e)=>{this.longitude=e}} className=" remove-padding-left " >{this.props.data[Object.keys(this.props.data)[0]]["longitude"]}</div>
							</div>
							<div  ref={(e)=>{this.geoLocation=e}}  className="col-lg-12 col-md-12 col-xs-12 col-sm-12  form-group geoLocation" ></div>
			   			</div>)
			   	}else{
			   		return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		   		}
	  	}
})


function displayMap(latitude,longitude,self){
	 var errorClass = self.props.structName ? self.props.structName+self.props.fieldName : self.props.fieldName;//ss
	$(".errorMessage"+errorClass).html("");
	//var targetDiv = self.querySelectorAll("div.geoLocation")[0];
	var targetDiv=self.geoLocation;
	var myCenter=new google.maps.LatLng(latitude,longitude);
	var marker;
	var mapProp = {
	  center:myCenter,
	  zoom:15,
	  mapTypeId:google.maps.MapTypeId.ROADMAP
	};
	targetDiv.style.height = "350px";
	var map=new google.maps.Map(targetDiv,mapProp);

	var marker=new google.maps.Marker({
	  position:myCenter,
	  animation:google.maps.Animation.BOUNCE
	  });
	marker.setMap(map);
}
var GetRatingFiled=React.createClass({
    clickHandler:function(ev){
        var ratingType=this.props.ratingType;
        var selectedData="";
        if(ratingType=="star"){
            if($(ev.target).parent().find("input#"+ev.target.dataset.id).prop("checked")){
                var str="star-"+(parseInt(ev.target.dataset.id.split("-")[1])-1);
                if(str=="star-0"){
                   $(ev.target).parent().find("input#"+ev.target.dataset.id).prop("checked",false);
                }else{
                    $(ev.target).parent().find("input#"+str).prop("checked",true);
                }
            }else{
                $(ev.target).parent().find("input#"+ev.target.dataset.id).prop("checked",true);
            }
           selectedData= $(ev.target).parent().find("input[type='radio']:checked").val() ? $(ev.target).parent().find("input[type='radio']:checked").val() : "";
        }else{
           if($(ev.target).parent().find("input[type='radio']").prop("checked")){
                $(ev.target).parents(".star-thumb-group").find("input[type='radio']").prop("checked",false);
           }else{
                $(ev.target).parents(".star-thumb-group").find("input[type='radio']").prop("checked",false);
                $(ev.target).parent().find("input[type='radio']").prop("checked",true);
           }
           selectedData= $(ev.target).parents(".star-thumb-group").find("input[type='radio']:checked").val() ? $(ev.target).parents(".star-thumb-group").find("input[type='radio']:checked").val() : "";
        }
         var errorClass = this.props.structName ? this.props.structName+this.props.fieldName : this.props.fieldName;//ss
		 	 	 $(".errorMessage"+errorClass).html("");
         var childData={};
         childData[Object.keys(this.props.data)[0]]=selectedData;
         var index = this.props.index;
				 if(this.props.AIS){
	 					 this.props.callback(childData,index,'AIS');
	 			 }else{
		         if(this.props.ratingType){
		            this.props.callback(childData,index,"","",this.props.ratingType,this.props.callback);
		         }else{
		            this.props.callback(childData,index);
		         }
				 }
    },
    componentDidMount:function(){
         var ratingType=this.props.ratingType;
         var defaultValue = this.props.data[Object.keys(this.props.data)[0]] ? this.props.data[Object.keys(this.props.data)[0]] : (this.props.properties.defaultValue ? this.props.properties.defaultValue : "");
         if(defaultValue!=""){
             var divId=Object.keys(this.props.data)[0];
             if(ratingType=="star"){
                $("#"+divId).find(".star-cb-group").find("input[type='radio']#star-"+defaultValue).prop("checked",true);
             }else{
                $("#"+divId).find(".star-thumb-group").find("input[type='radio']#"+(ratingType+"-"+defaultValue)).prop("checked",true);
             }
        }
        var childData={};
        childData[Object.keys(this.props.data)[0]]=defaultValue;//this.props.data[Object.keys(this.props.data)[0]];
        var index = this.props.index;
				if(this.props.AIS){
						 this.props.callback(childData,index,'AIS');
				}else{
		        if(this.props.ratingType){
		            this.props.callback(childData,index,"","",this.props.ratingType,this.props.callback);
		        }else{
		             this.props.callback(childData,index);
		        }
				}
       if(index && index > 0 && !this.props.structName && this.props.permission != ""){
         this["displayName"+this.props.fieldName].className+="  hidden";
         }
    },
    render:function(){
        var properties = this.props.properties;
        var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
        var errorClass = this.props.structName ? this.props.structName+key : key;
        var ratingType=this.props.ratingType;
        var classList={};
        var clickHandler=this.clickHandler;
        count--;
        if(ratingType=="star"){
          classList={"fa-star-o":1};
        }else if(ratingType=="hand"){
            classList={"fa-thumbs-o-down":"false","fa-thumbs-o-up":"true"};
        }else if(ratingType=="smiley"){
            classList={"fa-smile-o":"good","fa-meh-o":"better","fa-frown-o":"bad"};
        }
        if(this.props.permission == "admin" || this.props.permission == "edit"){
	        return(<div className="row no-margin">
	                <div className="margin-bottom-gap-xs">
	                    <span className="fieldText no-padding-left headerField title text-uppercase" ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
	                    &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	                </div>
	                <div id={key}>
	                  <span className="star-thumb-group">{
	                      Object.keys(classList).map(function(key,index){
	                          var inputId="";
	                          var result=[];
	                          if(ratingType=="star"){
	                              var temp=[];
	                              for(var i=properties.dataType.best;i>=properties.dataType.worst;i--){
	                                 temp.push(<input type="radio" id={"star-"+i} name={"star"+count}  value={i} />)
	                                 temp.push(<label data-id={"star-"+i} onClick={clickHandler} title={i+" star"}></label>)
	                              }
	                              result.push(<span className="rating star-cb-group">{temp}</span>)
	                          }else{
	                              inputId=ratingType+'-'+classList[key];
	                               result.push(<span className="rating">
	                                    <input type="radio" id={inputId} name={ratingType+count}  value={classList[key]} />
	                                    <label data-id={inputId} className={key} onClick={clickHandler} title={classList[key]}></label>
	                                 </span>)
	                          }
	                          return(result)
	                      })
	                  }
	                  </span>
	                  </div>
	             </div>)
		    }else if(this.props.permission == "read"){
	        return(<div className="row no-margin">
	                <div className="margin-bottom-gap-xs">
	                    <span className="fieldText no-padding-left headerField title text-uppercase" ref={(e)=>{this["displayName"+key]=e}}>{displayName}</span>
	                    &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	                </div>
	                <div id={key}>
	                  <span className="star-thumb-group">{
	                      Object.keys(classList).map(function(key,index){
	                          var inputId="";
	                          var result=[];
	                          if(ratingType=="star"){
	                              var temp=[];
	                              for(var i=properties.dataType.best;i>=properties.dataType.worst;i--){
	                                 temp.push(<input type="radio" id={"star-"+i} name={"star"+count}  value={i} />)
	                                 temp.push(<label data-id={"star-"+i} title={i+" star"}></label>)
	                              }
	                              result.push(<span className="rating star-cb-group">{temp}</span>)
	                          }else{
	                              inputId=ratingType+'-'+classList[key];
	                               result.push(<span className="rating">
	                                    <input type="radio" id={inputId} name={ratingType+count}  value={classList[key]} />
	                                    <label data-id={inputId} className={key}  title={classList[key]}></label>
	                                 </span>)
	                          }
	                          return(result)
	                      })
	                  }
	                  </span>
	                  </div>
	             </div>)
		    }else{
		    	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		    }
	    }
});


/**
 *data = objData	----	schema property object
 * id	----	element id(this id)
 * stateData	---	value of the object component state
 */
function getDataFromDB(data,id,stateData,fillObject,currentStateRecord,ev){
	//$(".lookUpFromDCS").remove();
	$(ev.target).parents("div.row").eq(0).find("span.errorMsg").html("");
	var name;
	var org=data.org?data.org:"public";
	var target = ev.target;
	var refKey = data.dataType.refKey;
	if(data.dataType.type == "object"){
		name = data.dataType.objRef;
	}else if(data.dataType.type == "array"){
		if(data.dataType.elements.type == "object"){
			name = data.dataType.elements.objRef;
			refKey = data.dataType.elements.refKey;
		}
	}
	var filters={};
	if((stateData.srFilters && Object.keys(stateData.srFilters).length>0) && (stateData.filterKeys && stateData.filterKeys.length>0)){
	    stateData.filterKeys.map(function(fKey){
	        if(fKey[stateData.fieldName] && fKey[stateData.fieldName].length > 0){
	            fKey[stateData.fieldName].map(function(innerFkey){
	                if(stateData.srFilters[innerFkey]){
	                    filters[innerFkey]=stateData.srFilters[innerFkey];
	                }
	            })
	        }
	    })
	}

	if(data.dataType.getFromGroupView){
		getFromGroupView(data.dataType.getFromGroupView,currentStateRecord,function(groupData){
			var node = document.createElement("div");
		 	node.id = global.guid();
		 	var popUpId = global.guid();
		 	var contentDivId = global.guid();
		 	var sideDivId = global.guid();
		  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
	        ReactDOM.render(<groupBy.GroupBy key={global.guid()}
				              				sourceSchema={data.dataType.objRef}
				              				displayName={data.displayName}
				              				org={"public"}
				              				groupDetails={groupData}
				              				rootRecord={currentStateRecord}
				              				callback={function(item){
				              					fillData(item.value[refKey],id,stateData,fillObject,target,item.value,item);
				              					node.remove();
				              				}}/>,document.getElementById(contentDivId));
		});

		return;
	}

	if(data.dataType.hasOwnProperty("filterCondition")){
		var temp = {};
		var filterCondition=data.dataType.filterCondition;
		var separators = ['=', '<', '>'];
		var cond = filterCondition.split(new RegExp(separators.join('|'), 'g'));
		temp["ddname"] = cond[0].split(".")[0].trim();
		temp["viewName"] = "dependentView";
		temp["viewInput"] =  cond[0].split(".")[1].trim();
		temp["viewOutput"] =  refKey;

		if(stateData.hasOwnProperty("filterConditionStructName") && stateData.filterConditionStructName){
			if(this.parentNode.parentNode.querySelector("input[type='text']#"+cond[1].trim()).value.trim()!=""){
				temp["recordInput"] = this.parentNode.parentNode.querySelector("input[type='text']#"+cond[1].trim()).value.trim();
			}else{
				alert("please select "+cond[1].trim());
				return;
			}
		}else if(stateData.structName){
			if(document.getElementById(stateData.structName).querySelector("input[type='text']#"+cond[1].trim()).value.trim()!=""){
				temp["recordInput"] = document.getElementById(stateData.structName).querySelector("input[type='text']#"+cond[1].trim()).value.trim();
			}else{
				alert("please select "+cond[1].trim());
				return;
			}
		}else{
			var dkValue="";
			if(document.getElementById(cond[1].trim())){
				if(document.getElementById(cond[1].trim()).value){
					dkValue=document.getElementById(cond[1].trim()).value.trim();
				}else if(document.getElementById(cond[1].trim()).innerHTML){
					dkValue=document.getElementById(cond[1].trim()).innerHTML.trim();
				}
			}
			if(dkValue!=""){
				temp["recordInput"] = dkValue;
			}else{
				alert("please select "+cond[1].trim());
				return;
			}
		}
		//WebUtils.doPost("/schema?operation=dynamicViewCreation",temp,function(result){
				var input = {};
				input[cond[0].split(".")[1].trim()] = temp.recordInput;
			  //ReactDOM.unmountComponentAtNode(document.getElementById('lookUpDialogBox'));
	   		  var node=document.createElement("div");
	   		  node.id= global.guid();
	   		  node.className="lookUpDialogBox lookUpFromDCS col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	   		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	   		  ReactDOM.render(<LookupComponent schema={name} filters={filters}   id={id} refKey={refKey} objData = {data} fillObject={fillObject} stateData={stateData} target={target} filterCondition={"true"} filterKey={input}  org={org}/>,node);
		//})
	}else{
	   // ReactDOM.unmountComponentAtNode(document.getElementById('lookUpDialogBox'));
	     var node=document.createElement("div");
	   		  node.id= global.guid();
	   		  node.className="lookUpDialogBox lookUpFromDCS  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	   		  document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	    	  ReactDOM.render(<LookupComponent schema={name} filters={filters}   id={id} refKey={refKey} fillObject={fillObject} objData = {data} stateData={stateData} target={target} org={org}/>,node);
	}
}


var GetImageField=React.createClass({
	getInitialState : function(){
		if(this.props.saved){
			return{imagesData : this.props.data[this.props.fieldName]};
		}else{
			return {imagesData : []};
		}

	},
    deleteImage : function(publicId,imgSaveStatus,ev){
		var ele = ev.target;
		var self = this;
		var cloudinaryId = publicId;
		var totalProps = self.props;
		var imagesData = self.props.data[totalProps.fieldName];
		var status = confirm("Are you sure You want to Delete Image?");
		if(status){
			if(imgSaveStatus){
				console.log("saved images are deleted.");
				savedImgIds.push(publicId);
				deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus);
			}else{
				console.log("unsaved images are deleted.");
				WebUtils.doPost("/schema?operation=deleteImage",{"publicId":[publicId]},function(result){
					if(result.data.deleted){
						deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus);
					}
				})
			}
		}
	},
	clickHandler : function(imgData,idx,ev){
		var caption = ev.target.value.trim();
		var index = this.props.index;
		//var test =JSON.parse(JSON.stringify(this.props.data));
		var test={};
		test[this.props.fieldName]=this.state.imagesData;
	    test[this.props.fieldName][idx].caption = caption;
			if(this.props.AIS){
 					 this.props.callback(test,index,'AIS');
 			}else{
				if(this.props.type == "arrayOfArray"){
	    	 		this.props.callback(test,index,"","","array",this.props.callback);
	    	}else{
	    	 		this.props.callback(test,index);
	    	}
			}
	    this.props.data = test;
	},
    componentDidMount : function(){
    	var childData={};
	    childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
			    if(this.props.type == "arrayOfArray"){
			    	 this.props.callback(childData,index,"","","array",this.props.callback);
			    }else{
			    	 this.props.callback(childData,index);
			    }
			}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
             this["displayName"+this.props.fieldName].className+="  hidden";
         }
    },
    render:function(){
    	var self = this;
        var properties = this.props.properties;
        var fieldName = this.props.fieldName;
        var key=fieldName;
        var clbk = this.props.callback;
        var type = this.props.type;
        var struct = this.props.struct;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
        var errorClass = this.props.structName ? this.props.structName+fieldName : fieldName;
        var index = this.props.index;
        count--;
        var deleteImage = this.deleteImage;
       clickHandler = this.clickHandler;
       if(this.props.permission == "admin" || this.props.permission == "edit"){
       		if(this.state.imagesData.constructor == Array){
       		 return(<div className="row" title={description}>
                   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 remove-margin-left remove-margin-right form-group">
                        <div  className="form-group" ref={(e)=>{this["displayName"+fieldName]=e}}>
                            <span className="fieldText no-padding-left headerField title ">{displayName}</span>
                            &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
                        </div>
                        <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
                          {
                          	self.state.imagesData.map(function(image,i){
                          		var path="";
                          		var height=(self.props.height!=undefined && self.props.height!=0)?h_self.props.height:"";
                          		var width=(self.props.width!=undefined && self.props.width!=0)?w_self.props.width:"";
                          		path=height+width;
                          		var src= "";
                          		if(image.cloudinaryId!=""){
                          			src="https://res.cloudinary.com/dzd0mlvkl/image/upload/"+path+"v1423542814/"+image.cloudinaryId+".jpg";
                          		}else if(image.cloudinaryId ==""){
									if(image.facebook ){
										var tempPath="https://res.cloudinary.com/dzd0mlvkl/image/facebook/"+path+"/"+image.facebook+".jpg"
									src=tempPath;
									}else if(image.google ){
										var tempPath="https://res.cloudinary.com/dzd0mlvkl/image/gplus/"+path+"/"+image.google+".jpg"
										src=tempPath;
									}else{
										src="https://res.cloudinary.com/dzd0mlvkl/image/upload/"+path+"/v1441279368/default_image.jpg";
									}
								}
                          		var imgSaveStatus;
                          		if(i < self.props.length){
                          			imgSaveStatus = true;
                          		}else{
                          			imgSaveStatus = false;
                          		}
								return (
									<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12  form-group  mobile-image-no-padding imgDeleteDiv">
							            <div className="showDelete">
								             <img src={src} alt="img" className="img-responsive" />
								             <span className="sleekIcon-delete fa-2x link deleteImage" aria-hidden="true" onClick={deleteImage.bind(null,image.cloudinaryId,imgSaveStatus)}></span>
								        </div>
							                 <span><input type='text' className="form-control" ref={(e)=>{self.caption=e}} defaultValue={image.caption}   placeholder="enter caption" onChange={self.clickHandler.bind(null,image,i)}/></span>
						            </div>
					            )
							})
						}
                        </div>
                        <button className="action-button" onClick={getCloudinaryWidget.bind(null,self.props,self,"image",properties)}>{prompt}</button>
                   </div>
              </div>)
       }else{
       			return(<div className="row" title={description}>
                   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 remove-margin-left remove-margin-right form-group">
                        <div  className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+fieldName]=e}}>
                            <span className="fieldText no-padding-left headerField title ">{prompt}</span>
                            &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
                        </div>
                        <div id={fieldName}  ref={(e)=>{self.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
                        </div>
                        <button className="action-button" onClick={getCloudinaryWidget.bind(null,self.props,self,"image",properties)}>{prompt}</button>
                   </div>
              </div>)
       	    }
       }else if(this.props.permission == "read"){
       	if(this.state.imagesData.constructor == Array){
       		 return(<div className="row" title={description}>
                   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 remove-margin-left remove-margin-right form-group">
                        <div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+fieldName]=e}}>
                            <span className="fieldText no-padding-left headerField title ">{displayName}</span>
                            &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
                        </div>
                        <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
                          {
                          	self.state.imagesData.map(function(image,i){
                          		var src= "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1423542814/"+image.cloudinaryId+".jpg";
                          		var imgSaveStatus;
                          		if(i < self.props.length){
                          			imgSaveStatus = true;
                          		}else{
                          			imgSaveStatus = false;
                          		}
								return (
									<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12  form-group  mobile-image-no-padding imgDeleteDiv">
							            <div className="showDelete">
								             <img src={src} alt="img" className="img-responsive" />
								        </div>
							                 <span className="form-control" ref={(e)=>{self.caption=e}}>{image.caption}</span>
						            </div>
					            )
							})
						}
                        </div>
                        <button className="action-button" >{prompt}</button>
                   </div>
              </div>)
       }else{
       			return(<div className="row" title={description}>
                   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 remove-margin-left remove-margin-right form-group">
                        <div className="margin-bottom-gap-xs">
                            <span className="fieldText no-padding-left headerField title ">{prompt}</span>
                            &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
                        </div>
                        <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
                        </div>
                        <button className="action-button">{prompt}</button>
                   </div>
              </div>)

       }
       }else{
       	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
       }

    }
});



var GetVideoField1=React.createClass({
	getInitialState : function(){
		return{imagesData : this.props.data[this.props.fieldName]};
	},
    deleteImage : function(publicId,imgSaveStatus,ev){
		var ele = ev.target;
		var self = this;
		var cloudinaryId = publicId;
		var totalProps = self.props;
		var imagesData = self.props.data[totalProps.fieldName];
		var status = confirm("Are you sure You want to Delete Image?");
		if(status){
			if(imgSaveStatus){
				console.log("saved images are deleted.");
				savedImgIds.push(publicId);
				deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus);
			}else{
				console.log("unsaved videos are deleted.");
				WebUtils.doPost("/schema?operation=deleteImage",{"publicId":[publicId]},function(result){
					if(result.data.deleted){
						deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus);
					}
				})
			}
		}
	},
	clickHandler : function(imgData,idx,ev){
		var caption = ev.target.value.trim();
		var index = this.props.index;
		var test =JSON.parse(JSON.stringify(this.props.data));
	     test[this.props.fieldName][idx].caption = caption;
		if(this.props.type == "arrayOfArray"){
	    	 this.props.callback(test,index,"","","array",this.props.callback);
	    }else{
	    	 this.props.callback(test,index);
	    }
	    this.props.data = test;
	},
    componentDidMount : function(){
    	var childData={};
	    childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
	    if(this.props.type == "arrayOfArray"){
	    	 this.props.callback(childData,index,"","","array",this.props.callback);
	    }else{
	    	 this.props.callback(childData,index);
	    }
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
             this["displayName"+this.props.fieldName].className+="  hidden";
         }
    },
    render:function(){
    	var self = this;
        var properties = this.props.properties;
        var fieldName = this.props.fieldName;
        var key=fieldName;
        var clbk = this.props.callback;
        var type = this.props.type;
        var struct = this.props.struct;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
        var errorClass = this.props.structName ? this.props.structName+fieldName : fieldName;
        var index = this.props.index;
        count--;
        var deleteImage = this.deleteImage;
       clickHandler = this.clickHandler;
       if(this.props.permission == "admin" || this.props.permission == "edit"){
       		return(<div className="row" title={description}>
                   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 remove-margin-left remove-margin-right form-group">
                        <div className="margin-bottom-gap-xs">
                            <span className="fieldText no-padding-left headerField title ">{displayName}</span>
                            &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
                        </div>
                        <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
                          {
                          	self.state.imagesData.map(function(image,i){
                          		var imgSaveStatus;
                          		if(i < self.props.length){
                          			imgSaveStatus = true;
                          		}else{
                          			imgSaveStatus = false;
                          		}
								return (
									<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12  form-group  mobile-image-no-padding imgDeleteDiv">
							            <div className="showDelete">
											<iframe className="img-responsive" alt= "video" src={image.url} style={{"minWidth":"100%"}} autoplay={false}></iframe>
								             <span className="sleekIcon-delete fa-2x link deleteImage" aria-hidden="true" onClick={deleteImage.bind(null,image.cloudinaryId,imgSaveStatus)}></span>
								        </div>
							                 <span><input type='text' className="form-control" ref={(e)=>{this.caption=e}} defaultValue={image.caption}   placeholder="enter caption" onChange={self.clickHandler.bind(null,image,i)}/></span>
						            </div>
					            )
							})
						}
                        </div>
                        <button className="action-button" onClick={getCloudinaryWidget.bind(null,self.props,self,"video",properties)}>{prompt}</button>
                   </div>
              </div>)
       }else if(this.props.permission == "read"){
       		return(<div className="row" title={description}>
                   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 remove-margin-left remove-margin-right form-group">
                        <div className="margin-bottom-gap-xs">
                            <span className="fieldText no-padding-left headerField title ">{displayName}</span>
                            &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
                        </div>
                        <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
                          {
                          	self.state.imagesData.map(function(image,i){
                          		var imgSaveStatus;
                          		if(i < self.props.length){
                          			imgSaveStatus = true;
                          		}else{
                          			imgSaveStatus = false;
                          		}
								return (
									<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12  form-group  mobile-image-no-padding imgDeleteDiv">
							            <div className="showDelete">
											<iframe className="img-responsive" alt= "video" src={image.url} style={{"minWidth":"100%"}} autoplay={false}></iframe>
								        </div>
							                 <span className="form-control" ref={(e)=>{this.caption=e}}>{image.caption}</span>
						            </div>
					            )
							})
						}
                        </div>
                        <button className="action-button" >{prompt}</button>
                   </div>
              </div>)
       }else{
       	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
       }

    }
});



var GetAttachmentField=React.createClass({
	getInitialState : function(){
		return{imagesData : this.props.data[this.props.fieldName]};
	},
    deleteImage : function(publicId,imgSaveStatus,ev){
		var ele = ev.target;
		var self = this;
		var cloudinaryId = publicId;
		var totalProps = self.props;
		var imagesData = self.props.data[totalProps.fieldName];
		var status = confirm("Are you sure You want to Delete Image?");
		if(status){
			if(imgSaveStatus){
				console.log("saved images are deleted.");
				savedImgIds.push(publicId);
				deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus);
			}else{
				console.log("unsaved images are deleted.");
				WebUtils.doPost("/schema?operation=deleteImage",{"publicId":[publicId]},function(result){
					if(result.data.deleted){
						deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus);
					}
				})
			}
		}
	},
	clickHandler : function(imgData,idx,ev){
		var caption = ev.target.value.trim();
		var index = this.props.index;
		var test =JSON.parse(JSON.stringify(this.props.data));
	     test[this.props.fieldName][idx].caption = caption;
			 if(this.props.AIS){
 					 this.props.callback(childData,index,'AIS');
 			 }else{
					if(this.props.type == "arrayOfArray"){
		    	 	this.props.callback(test,index,"","","array",this.props.callback);
		    	}else{
		    	 	this.props.callback(test,index);
		    	}
			}
	    this.props.data = test;
	},
    componentDidMount : function(){
    	var childData={};
	    childData[Object.keys(this.props.data)[0]]=this.props.data[Object.keys(this.props.data)[0]];
	    var index = this.props.index;
			if(this.props.AIS){
					 this.props.callback(childData,index,'AIS');
			}else{
			    if(this.props.type == "arrayOfArray"){
			    	 this.props.callback(childData,index,"","","array",this.props.callback);
			    }else{
			    	 this.props.callback(childData,index);
			    }
			}
	    if(index && index > 0 && !this.props.structName && this.props.permission != ""){
             this["displayName"+this.props.fieldName].className+="  hidden";
         }
    },
    openAttachment : function(attachmentData,ev){
    	window.open(attachmentData.url, "_blank")
    },
    render:function(){
    	var self = this;
        var properties = this.props.properties;
        var fieldName = this.props.fieldName;
        var key=fieldName;
        var clbk = this.props.callback;
        var type = this.props.type;
        var struct = this.props.struct;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
        var errorClass = this.props.structName ? this.props.structName+fieldName : fieldName;
        var index = this.props.index;
        //var label = ((properties.dataType.type == "array") ? properties.dataType.elements.type : properties.dataType.type);
        count--;
        //var existingImages=[];
        var deleteImage = this.deleteImage;
       //this.props.data[this.props.fieldName]=this.state.imagesData;
        clickHandler = this.clickHandler;
        openAttachment = this.openAttachment;
       if(this.props.permission == "admin" || this.props.permission == "edit"){
       		return(<div className="row no-margin " title={description}>
	                <div className="margin-bottom-gap-xs">
	                    <span className="fieldText no-padding-left headerField title ">{displayName}</span>
	                    &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	                </div>
	                <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
	                  {
	                  	self.state.imagesData.map(function(image,i){
	                  		var src= "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1423542814/"+image.cloudinaryId+".jpg";
	                  		var imgSaveStatus;
	                  		if(i < self.props.length){
	                  			imgSaveStatus = true;
	                  		}else{
	                  			imgSaveStatus = false;
	                  		}
							return (
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
						            <div className="parent-img-component">
							            <span className="sleekIcon-delete fa-2x link child-img-component" aria-hidden="true" onClick={deleteImage.bind(null,image.cloudinaryId,imgSaveStatus)}></span>
							             <span className="nav-link child-img-component" onClick={openAttachment.bind(null,image)}>{image.attachmentName}</span>

							        </div>
					            </div>
				            )
						})
					}
	                </div>
	                <button className="action-button form-group" onClick={getCloudinaryWidget.bind(null,self.props,self,"auto",properties)}>{prompt}</button>
	    	  </div>)
       }else if(this.props.permission == "read"){
       		return(<div className="row no-margin " title={description}>
	                <div className="margin-bottom-gap-xs">
	                    <span className="fieldText no-padding-left headerField title ">{displayName}</span>
	                    &nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	                </div>
	                <div id={fieldName}  ref={(e)=>{this.imageList=e}} className=" row remove-margin-left remove-margin-right imageList">
	                  {
	                  	self.state.imagesData.map(function(image,i){
	                  		var src= "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1423542814/"+image.cloudinaryId+".jpg";
	                  		var imgSaveStatus;
	                  		if(i < self.props.length){
	                  			imgSaveStatus = true;
	                  		}else{
	                  			imgSaveStatus = false;
	                  		}
							return (
								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
						            <div className="parent-img-component">
							             <span className="nav-link child-img-component" onClick={openAttachment.bind(null,image)}>{image.attachmentName}</span>

							        </div>
					            </div>
				            )
						})
					}
	                </div>
	                <button className="action-button" >{prompt}</button>
	    	  </div>)
       }else{
       	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
       }

     }
});


function getCloudinaryWidget(compProps,self,resourceType,properties,ev){
	//$(self).find("span.errorMsg").html("");
	var errorClass = self.props.structName ? self.props.structName+self.props.fieldName : self.props.fieldName;//ss
	$(".errorMessage"+errorClass).html("");
	var self = self;
	var compProps = compProps;
	var blobName;
	if(resourceType == "image"){
		blobName = "imageName";
	}else if(resourceType == "video"){
		blobName = "videoName";
	}else{
		blobName = "attachmentName";
	}
	cloudinary.openUploadWidget({
         cloud_name: 'dzd0mlvkl',
         upload_preset: 'p33vombo',
         theme:'white',
         show_powered_by:false,
         multiple : checkForMultiple(properties),
         resource_type : resourceType,
         max_file_size : properties.dataType.max_file_size?properties.dataType.max_file_size:500000,
         stylesheet:'#cloudinary-overlay.modal{background-color: #fff;} #cloudinary-navbar .close:hover{opacity:0.5}#cloudinary-navbar .close{font-weight:100;color:#000;position: fixed;top: auto;font-size: 40px;right: 10%;top: 5%;}#cloudinary-widget .placeholder_image {width:100px; height:60px;} #cloudinary-widget .image_cover {width:100px; height:60px;} #cloudinary-widget .image_holder {width:100px; height:60px;} #cloudinary-widget .panel.progress .thumbnails {width:290px; height:100px;} #cloudinary-widget .panel.progress .thumbnails .thumbnail {margin:0px; padding:0px; background-color:#fafafa; position:relative; top:0px; left:0px; width:60px; height:60px; float:left;} #remote_url {margin-top:-45px;} #cloudinary-navbar {box-shadow:none;border:0;background:#fff;-moz-border-radius: 0px; -webkit-border-radius: 0px; border-radius: 0px;} #cloudinary-widget { font-family:sans-serif ;background:#fff; border:0px; box-shadow:none;-moz-border-radius: 0px -webkit-border-radius: 0px; border-radius: 0px;} #cloudinary-widget .drag_area {margin:5px;background:#fff;} #cloudinary-overlay {background-color: transparent;} #cloudinary-navbar .source.active{border-bottom: 3px solid #000;} #cloudinary-widget .button:hover, #cloudinary-widget .button.small_button:hover, #cloudinary-widget .upload_button_holder:hover .button{background: #000;opacity: 0.5;}.widget .panel.local .drag_area .drag_content .or {color:#000} #cloudinary-widget .button, #cloudinary-widget .button.small_button {font-size:20px;font-family:sans-serif;background:#000;border-radius:0} #cloudinary-widget .panel.local .drag_area .drag_content .label {color:#000} div.panel.local.active {height:140px; padding:5px; overflow-y:hidden;} #cloudinary-navbar .source .label {color:black;font-size:12px;} .widget .panel.progress .thumbnails .thumbnail .image{display:none} #cloudinary-widget .image_cover { background: url(https://wishkarma.com/branding/wishkarmaLoader.svg);  background-position: center;  background-repeat:no-repeat;background-size: 60px 60px;} .drag_area img {display:none;}',
         client_allowed_formats : null
        
    },
    function(error, result) {
    	if(result){
    	   $(".cloudinary-thumbnails").remove();
    	   var test =JSON.parse(JSON.stringify(compProps.data));
    	   test[compProps.fieldName]=Array.isArray(self.state.imagesData)?self.state.imagesData:[];
    	   //var test=self.state.imagesData
    	   var index = compProps.index;
           for(var i=0;i<result.length;i++){
           		imgIds.push(result[i].public_id);
           		var temp = {};
           		temp["cloudinaryId"] = result[i].public_id;
           		temp[blobName] = result[i].original_filename;
           		temp["caption"] = "";
           		temp["url"] = result[i].secure_url;

           		if(properties.dataType.type == "attachment" || properties.dataType.type == "image" || properties.dataType.type == "privateVideo"){
           			if(compProps.length == 1){
           				try{
           				savedImgIds.push(test[compProps.fieldName][0].cloudinaryId);
           				}catch(err){}
           				 compProps.length = compProps.length-1;
           			}
           			test[compProps.fieldName] = [];
           		}else if(properties.dataType.type == "array"){
           			if(properties.dataType.elements.type == "attachment" || properties.dataType.elements.type == "image" || properties.dataType.elements.type == "privateVideo"){
           				if(compProps.length == 1){
           					try{
	           				savedImgIds.push(test[compProps.fieldName][0].cloudinaryId);
	           				}catch(err){}
	           				 compProps.length = compProps.length-1;
	           			}

           				test[compProps.fieldName] = [];
           			}
           		}

           		test[compProps.fieldName].push(temp);
							if(compProps.AIS){
								compProps.callback(test,index,'AIS');
							}else{
								if(compProps.type == "arrayOfArray"){
						    	 compProps.callback(test,index,"","","array",compProps.callback);
						    }else{
						    	 compProps.callback(test,index);
						    }
							}

           }

          compProps.data = test;
          self.setState({"imagesData" : test[compProps.fieldName]});
          console.log("id= "+savedImgIds);
    	}else{
    		//alert("error");
    	}
    });
}

function checkForMultiple(properties){
	if(properties.dataType.type == "attachment" || properties.dataType.type == "image" || properties.dataType.type == "privateVideo"){
    	return false;
    }else if(properties.dataType.type == "attachments" || properties.dataType.type == "images" || properties.dataType.type == "privateVideos"){
    	return true;
    }else if(properties.dataType.type == "array"){
    	if(properties.dataType.elements.type == "attachment" || properties.dataType.elements.type == "image" || properties.dataType.elements.type == "privateVideo"){
        	return false;
        }else if(properties.dataType.elements.type == "attachments" || properties.dataType.elements.type == "images" || properties.dataType.elements.type == "privateVideos"){
        	return true;
        }
    }
}


function deleteBlobData(imagesData,totalProps,cloudinaryId,self,imgSaveStatus){
	var length = imagesData.length;
	for(var i = 0;i < length;i++){
		if(imagesData[i].cloudinaryId == cloudinaryId){
			imagesData.splice(i,1);
			break;
		}
	}
	if(!imgSaveStatus){
		for(var i = 0;i < imgIds.length;i++){
			if(imgIds[i] == cloudinaryId){
				imgIds.splice(i,1);
				break;
			}
		}
	}else{
		 self.props.length = self.props.length-1;
	}

	var test = {};
	test[totalProps.fieldName] = imagesData;
	var index = totalProps.index;
	if(totalProps.AIS){
		totalProps.callback(test,index,'AIS');
	}else{
		if(totalProps.type == "arrayOfArray"){
			 totalProps.callback(test,index,"","","array",totalProps.callback);
		}else{
			 totalProps.callback(test,index);
		}
	}

	self.props.data = test;
	self.setState({
	imagesData: self.state.imagesData.filter(function(img){
		return img.cloudinaryId !== cloudinaryId;
	 })
   });
}

exports.deleteImages=deleteImages;
exports.imgIds=imgIds;
function deleteImages(publicIds){
	var length = publicIds.length;
	if(length > 0){
		WebUtils.doPost("/schema?operation=deleteImage",{"publicId":publicIds},function(result){
			console.log("unsaved images are deleted.");
			imgIds = [];
			savedImgIds = [];
		})
	}
}


function getImageIds(){
	return imgIds;
}
exports.getImageIds=getImageIds;

var GetAutoNumberField = React.createClass({
	getInitialState:function(){
		var self = this;
		var defaultValue = self.props.data[self.props.fieldName] ? self.props.data[self.props.fieldName] : (self.props.properties.defaultValue ? self.props.properties.defaultValue : "");
		return({
			count : defaultValue,
		})
	},
    componentDidMount:function(){
		var defaultValue = "0";
		var self = this;
		var index = self.props.index;

		if(!this.props.PD.edit){
			WebUtils.getDefinition(this.props.recordId,function(res){
				self.setState({
					count: res.prefix+"-"+res.count,
				});

				var childData={};
			    childData[Object.keys(self.props.data)[0]]=self.state.count;//this.props.data[Object.keys(this.props.data)[0]];

			    if(self.props.type){
			    	this.props.callback(childData,index,"","",self.props.type,self.props.callback);
			    }else{
			    	 self.props.callback(childData,index);
			    }
			})
		}else{
			self.setState({
				count: self.props.data[self.props.fieldName],
			});
			var childData={};
		    childData[Object.keys(self.props.data)[0]]=self.state.count;//this.props.data[Object.keys(this.props.data)[0]];

		    if(self.props.type){
		    	this.props.callback(childData,index,"","",self.props.type,self.props.callback);
		    }else{
		    	 self.props.callback(childData,index);
		    }
		}


       if(index && index > 0 && !this.props.structName && this.props.permission != ""){
    	 this["displayName"+this.props.fieldName].className+="  hidden";
	   }
    },
	render : function(){
		var headdingFont = this.props.headdingFont ? this.props.headdingFont : "title";
		var properties = this.props.properties;
		var key = this.props.fieldName;
		var displayName=properties.displayName?properties.displayName:key;
		var prompt = properties.prompt ? properties.prompt : displayName;
		var description=properties.description?properties.description:displayName;
		var errorClass = this.props.structName ? this.props.structName+key : key;
		var defaultValue = 0;
		//if(this.props.permission == "admin" || this.props.permission == "edit"){
			return (<div className="row no-margin"  title={description} >
		   				<div className="margin-bottom-gap-xs" ref={(e)=>{this["displayName"+key]=e}}>
		   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
		   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
		   				</div>
		   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
		   					<span ref={(e)=>{this[key]=e}} id={key}  className="remove-padding-left">{this.state.count}</span>
						</div>
		   			</div>)
		 /*}else if(this.props.permission == "read"){
	   		return (<div className="row no-margin " title={description}>
	   				<div ref={(e)=>{this["displayName"+key]=e}}>
	   					<span className={"fieldText no-padding-left headerField "+headdingFont } >{displayName}</span>
	   					&nbsp;<span className={"errorMsg errorMessage"+errorClass} ></span>
	   				</div>
	   				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group" >
	   					<div ref={(e)=>{this[key]=e}} id={key} className="remove-padding-left ">{defaultValue}</div>
					</div>
	   			</div>)
	   	}else{
		 	return <div ref={(e)=>{this.rootNode=e}} className="hidden"></div>
		 }*/
	}
})


function moveScroll(element){
	if(element){
		$('html, body').animate({
	    	scrollTop: $(element).offset().top-60
		}, 1000,function(){
			//$(element).parent().next().find("input:text").focus();
		});
	}else{
		alert("You can not perform this operation.contact Administrator");
		return;
	}

}

exports.moveScroll = moveScroll;


var RecordSummaryStore = require('../../stores/RecordSummaryStore');




var LookupComponent=React.createClass({
    getInitialState:function(){
    	var skip=0;
        if(this.props.skip){
            skip=this.props.skip;
        }
    	var filters=this.props.filters?this.props.filters:{};
        if(this.props.objData && this.props.objData.dataType && this.props.objData.dataType.filters){
        	filters=this.props.objData.dataType.filters;
        }
		if(this.props.filterKey){
			for(var key in this.props.filterKey){
				filters[key]=[this.props.filterKey[key]];
			}
		}
		var currentOrg=this.props.org?this.props.org:"public";
		currentOrg="public";
        return {
        		shouldComponentUpdate:false,
        		skip:skip,
        		initialFilters:filters,
        		currentOrg:currentOrg,
        		//currentSelectionList:[],
        		currentSelectionList:RecordSummaryStore.getSchemaRecords({
        			schema:this.props.schema,
        			filters:filters,
        			dependentSchema:this.props.dependentSchema,
        			org:currentOrg,
        			userId:common.getUserDoc().recordId,
        			skip:skip,
        			limit:limitCount}),
        		currentFocus:0,
        		showOrgOptions:false,
        		roles:undefined
        	};
    },
    componentDidMount:function(){
       $('html,body').scrollTop(0);
        var self=this;
        common.hideMainContainer();
        ActionCreator.getSchemaRecords({
        	schema:this.props.schema,
        	filters:this.state.initialFilters,
        	dependentSchema:this.props.dependentSchema,
        	org:this.state.currentOrg,
        	userId:common.getUserDoc().recordId,
        	skip:this.state.skip,
        	limit:limitCount});
        RecordSummaryStore.addChangeListener(this._onChange,this.props.schema);
        this.managePagination();

        common.startLoader();
        WebUtils.doPost("/generic?operation=getSchemaRoleOnOrg",{schema:this.props.schema,userId:common.getUserDoc().recordId,org:this.state.currentOrg},function(response){
            self.setState({shouldComponentUpdate:true,roles:response},function(){
                self.rootNode.style.display="block";
                self.forceUpdate();
                common.stopLoader();
            });
        });
        this.searchText.focus();
        $(document).keydown(function(e){
		    if (e.keyCode==38){
		    	self.upArrowPressed();
		    }
		    if (e.keyCode==40){
		    	self.downArrowPressed();
		    }
		    if(e.keyCode==13){
		    	self.selectItem();
		    }

		});
    },
    upArrowPressed:function(){
    	var self=this;
    	if(this.isMounted())
    	if(this.state.currentFocus>0){
    		this.setState({currentFocus:this.state.currentFocus-1},function(){
    			if(self.state.currentFocus==0){
    				self.searchText.focus();
    			}else{
    				self.searchText.blur();
    			}
    		});
    	}
    },
    downArrowPressed:function(){
    	var self=this;
    	if(this.isMounted())
    	if(this.state.currentFocus<limitCount){
    		this.setState({currentFocus:this.state.currentFocus+1});
    		self.searchText.blur();
    	}else{
    		this.setState({currentFocus:0},function(){
				self.searchText.focus();
    		});
    	}
    },
    selectItem:function(){
    	if(this.isMounted())
    	if(this.state.currentFocus!=0){
    		var item=this.state.currentSelectionList[this.state.currentFocus-1];
    		this.fillData(item.value[this.props.refKey],this.props.id,this.props.stateData,this.props.fillObject,this.props.target,item.value,item);
    	}
    },
    loadRecordsWithFilters:function(filters){
        common.startLoader();
        var self=this;
        var prevSkip=this.state.skip;
        if(this.props.filterKey){
			for(var key in this.props.filterKey){
				filters[key]=[this.props.filterKey[key]];
			}
		}
        WebUtils.doPost("/generic?operation=lookupSchema",{filters:filters,searchKey:this.searchText.value,schema:self.props.schema,skip:self.state.skip,limit:limitCount,userId:common.getUserDoc().recordId,org:this.state.currentOrg},function(result){
            if(result.error){
                alert(result.error);
            }else{
                if(result.length!=0){
           			self.setState({shouldComponentUpdate:true,currentSelectionList:result.records,initialFilters:filters});
			       	self.popUpContentCreateDiv.style.display="none";
            		self.popUpContentDiv.style.display="block";
                }else{
                    self.setState({skip:prevSkip});
                }
            }
            common.stopLoader();
        });
    },
    managePagination:function(){
	    var currentSchema=SchemaStore.get(this.props.schema);
		this["paginationDiv1"].style.display="none";
		var self=this;
		this["paginationDiv1"].style.display="none";
		this["moveForward1"].style.display="none";
		this["moveBack1"].style.display="none";

		if(this.state.currentSelectionList!=null && this.state.currentSelectionList.length > limitCount ){
			this["paginationDiv1"].style.display="block";
			this["moveForward1"].style.display="inline";
		}
		if(this.state.skip>=limitCount){
			this["paginationDiv1"].style.display="block";
			this["moveBack1"].style.display="inline";
		}
	},
    increaseSkipCount:function(){
        common.startLoader();
        var self=this;
        var prevSkip=this.state.skip;
        this.disableComponent();
        this.setState({skip:this.state.skip+limitCount},function(){
			self._onChange();
			common.stopLoader();
            ActionCreator.getSchemaRecords({
            		schema:self.props.schema,
            		filters:self.state.initialFilters,
            		dependentSchema:self.props.dependentSchema,
            		org:self.state.currentOrg,
            		userId:common.getUserDoc().recordId,
            		skip:this.state.skip,
            		limit:limitCount});
        });
    },
    reduceSkipCount:function(){
        var self=this;
        common.startLoader();
        this.disableComponent();
        if(this.state.skip!=0){
            common.startLoader();
            this.setState({skip:this.state.skip-limitCount},function(){
				self._onChange();
				common.stopLoader();
                ActionCreator.getSchemaRecords({
                	schema:self.props.schema,
                	filters:self.state.initialFilters,
                	dependentSchema:self.props.dependentSchema,
                	org:self.state.currentOrg,
                	userId:common.getUserDoc().recordId,
                	skip:self.state.skip,
                	limit:limitCount});
            });
        }
    },
    getCurrentSelectionList:function(e){
        if (e.keyCode == 13) {
            common.startLoader();
            WebUtils.doPost("/generic?operation=lookupSchema",{filters:this.state.initialFilters,
            													searchKey:this.searchText.value,
            													schema:this.props.schema,
            													skip:0,
            													limit:limitCount,
            													userId:common.getUserDoc().recordId,
            													org:this.state.currentOrg},function(result){
                if(result.error){
                    common.stopLoader();
                    return;
                }
                this.setState({shouldComponentUpdate:true,currentSelectionList:result.records});
                common.stopLoader();
            }.bind(this));
        }
    },
    componentWillReceiveProps: function(nextProps) {
       var skip=0;
        if(nextProps.skip){
            skip=nextProps.skip;
        }
         this.setState({records:RecordSummaryStore.getSchemaRecords({
         				schema:nextProps.schema,
         				filters:nextProps.filters,
         				dependentSchema:nextProps.dependentSchema,
         				org:"public",
         				userId:common.getUserDoc().recordId,
         				skip:skip}),skip:skip,stop:false},function(){
             this.componentDidMount();
         });
    },
    componentDidUpdate:function(){
        this.enableComponent();
        this.managePagination();
    },
    componentWillUnmount:function(){
        RecordSummaryStore.removeChangeListener(this._onChange,this.props.schema);
    },
    _onChange:function(){
        this.enableComponent();
        if(this.isMounted()){
            this.setState({
            	shouldComponentUpdate:true,
            	currentSelectionList:RecordSummaryStore.getSchemaRecords({
            										schema:this.props.schema,
            										filters:this.state.initialFilters,
            										dependentSchema:this.props.dependentSchema,
            										org:this.state.currentOrg,
            										userId:common.getUserDoc().recordId,
            										skip:this.state.skip,
            										limit:limitCount})});
            common.stopLoader();
        }
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        var flag=nextState.shouldComponentUpdate;
        if(flag)
        	this.disableComponent();
		return flag;
    },
    disableComponent:function(){
        try{
            this.rootNode.style.opacity=0.5;
            this.rootNode.style.pointerEvents="none";
        }catch(err){

        }

    },
    enableComponent:function(){
	  	try{
            this.rootNode.style.opacity=1;
            this.rootNode.style.pointerEvents="auto";
        }catch(err){}
    },
    handleCreate:function(methodName){
    	var schemaRec=SchemaStore.get(this.props.schema);
        if(methodName &&
            methodName!="" &&
            schemaRec &&
            schemaRec["@operations"] &&
            schemaRec["@operations"].create){
            var editFields;
            if(methodName=="all"){
                editFields=Object.keys(schemaRec["@properties"]);
            }else if(schemaRec["@operations"].create[methodName] &&
                schemaRec["@operations"].create[methodName].in){
                editFields=schemaRec["@operations"].create[methodName].in;
            }
            var readOnlyFields=Object.keys(schemaRec["@properties"]);
            ReactDOM.unmountComponentAtNode(this.popUpContentCreateDiv);
            this.popUpContentCreateDiv.style.display="block";
            this.popUpContentDiv.style.display="none";
            ReactDOM.render(<DisplayCustomSchema callbackToCreatedRecord={this.callbackToCreatedRecord} data = {this.props.schema} editFields={editFields} readOnlyFields={readOnlyFields} org={this.props.org}/>,this.popUpContentCreateDiv);
        }
    },
    callbackToCreatedRecord:function(record){

        var self=this;
        var id= this.props.id;
        var objData = this.props.objData;
        var refKey = this.props.refKey;
        var stateData = this.props.stateData;
        var identifier = this.props.identifier;
        var target = this.props.target;
        var fillObject=this.props.fillObject;

        var item={};
        item.id=record.recordId;
        item.value=record;
        this.fillData(item.value[refKey],id,stateData,fillObject,target,item.value,item);
    },
    fillData:function(data,id,stateData,fillObject,target,rowData,item){
        this.close();
        if(this.props.storeInGlobal){
            window[this.props.schema]=item.id;
            window[this.props.storeInGlobal]=item.id;
            //$("#lookUpDialogBox .modal").modal("hide");
            this.props.callback();
            return;
        }
        if(this.props.filter){
            this.props.callback(item);
            return;
        }
        fillData(data,id,stateData,fillObject,target,rowData);
    },
    close:function(){
        //$("#mainContainer").css("display","block");
        common.showMainContainer();
        this.rootNode.style.display="none";
        this.rootNode.parentNode.style.display="none";
        this.rootNode.parentNode.remove();
        //moveScroll(this.props.target);
    },
    showOrgOptions:function(){
    	this.setState({showOrgOptions:true});
    },
    setCurrentOrg:function(org){
    	var self=this;
    	this.setState({showOrgOptions:false,currentOrg:org},function(){
    		ActionCreator.getSchemaRecords({
    						schema:self.props.schema,
    						filters:self.state.initialFilters,
    						dependentSchema:self.props.dependentSchema,
    						org:self.state.currentOrg,
    						userId:common.getUserDoc().recordId,
    						skip:self.state.skip,
    						limit:limitCount});
        	self.managePagination();
    	});
    },
    render:function(){
        var self=this;
        var id= this.props.id;
        var objData = this.props.objData;
        var refKey = this.props.refKey;
        var stateData = this.props.stateData;
        var identifier = this.props.identifier;
        var target = this.props.target;
        var fillObject=this.props.fillObject;
        var links=[];
        var createLink="";
        var schemaRec=SchemaStore.get(this.props.schema);
        if(this.state.roles && this.state.roles.create && this.state.roles.create!="" ){
            //links.push(<li className="toggleOnClickLater" onClick={this.handleCreate.bind(null,this.state.roles.create)}><span className="link">Create New</span></li>);
			createLink=(<span className="link" onClick={this.handleCreate.bind(null,this.state.roles.create)}>Create New</span>);
        }
        var publicOption="";

        if(objData && objData.dataType &&
        	objData.dataType.type && objData.dataType.type=="array" &&
        	objData.dataType.elements && objData.dataType.elements.objRef &&
        	objData.dataType.elements.objRef=="User" && objData.dataType.elements.refKey &&
        	objData.dataType.elements.refKey=="recordId"){
        	publicOption=(<div className="col-xs-10 col-sm-10  col-lg-8 col-md-8">
        		<div onClick={this.fillData.bind(null,"public","public",stateData,fillObject,target,{"recordId":"public"},{"recordId":"public"})} className="pointer">Public</div>
        	</div>)
        }

        var FilterComponent="";
        if(schemaRec && schemaRec["@filterKeys"]){
            if(schemaRec["@navViews"]){
                for(var i=0;i<schemaRec["@navViews"].length;i++){
                    if(this.state.roles &&
                        this.state.roles.navViews &&
                        (this.state.roles.navViews=="all" ||
                        this.state.roles.navViews.indexOf(schemaRec["@navViews"][i].navName)!=-1))
                    links.push(<li className="toggleOnClickLater" onClick={this.loadRecordsWithFilters.bind(null,schemaRec["@navViews"][i].filters)}><span className="link">{schemaRec["@navViews"][i].navName}</span></li>);
                }
            }


            var schema= schemaRec;
            var dependentSchema=this.state.dependentSchema;

            //Removing dependent property from filter keys
            /*if(schema["@type"]=="abstractObject"){
                var index=schema["@filterKeys"].indexOf(schema["@dependentKey"])
                if(index>-1){
                    schema["@filterKeys"].splice(index,1);
                }
            }
            */

            var filters=[];
            var allFilters=schema["@filterKeys"];
            for(var i=0;i<allFilters.length;i++){
            	if(allFilters[i]=="org"){
							filters.push({
								filterType:"object",
								filterName:"Organization",
								filterKey:allFilters[i],
								list:"",
								property:{
								      "description": "org of the document",
								      "displayName": "record org",
								      "dataType": {
								        "type": "object",
								        "objRef": "Organization",
								        "refKey": "recordId"
								      }
								    }
							});
				}else if(schema["@properties"][allFilters[i]] && schema["@properties"][allFilters[i]].dataType && schema["@properties"][allFilters[i]].dataType.type){
                    var dataType=schema["@properties"][allFilters[i]].dataType.type;
                    if(dataType=="pickList" || dataType=="multiPickList"){
                        filters.push({
                            filterType:"multiPickList",
                            filterName:schema["@properties"][allFilters[i]].displayName,
                            filterKey:allFilters[i],
                            list:schema["@properties"][allFilters[i]].dataType.options
                        });
                    }else if(dataType=="object"){
							filters.push({
								filterType:"object",
								filterName:schema["@properties"][allFilters[i]].displayName,
								filterKey:allFilters[i],
								list:"",
								property:schema["@properties"][allFilters[i]],
								derivedId:schema["@derivedId"]
							});
					}
                }
            }
            FilterComponent=<FilterResults appliedFilters={this.state.initialFilters} filters={filters} callback={this.loadRecordsWithFilters}/>
        }
        var nav= (<ul className="text-right list-unstyled no-padding-left ">

                    {links}
                    {/*<li className="toggleOnClickLater" onClick={this.loadRecordsWithFilters.bind(null,undefined)}><span className="link">List All</span></li>*/}
                    <br/>
                    <li ref={(e)=>{this.filtersArea=e}}>{FilterComponent}</li>

                </ul>)
                var num=2;
        return (<div ref={(e)=>{this.rootNode=e}} className="popupAnimation"  style={{"display":"none","height":"100%"}}>
                    <div style={{"padding": "0px","height":"100%"}} className="container-fluid">
                        <div style={{"margin":"20px"}} className="row row-offcanvas row-offcanvas-left">
	                        <div className="row no-margin">
                        	    <span className="sleekIcon-delete  fa-3x pull-right deleteIcon link" onClick={this.close} style={{}} aria-hidden="true"></span>
	                        </div>
                            <div style={{"clear":"both"}} className="row margin-top-gap-lg remove-margin-top-mobile remove-margin-left remove-margin-right ">
                                <div role="navigation" className="col-xs-6 col-sm-6 col-lg-2 col-md-2 sidebar-offcanvas" ref={(e)=>{this.popUpNavigation=e}}>
                                    {nav}
                                </div>
                                <div className="col-xs-12 col-sm-12  col-lg-10 col-md-10 " style={{"minHeight":"750px","display":"none"}} ref={(e)=>{this.popUpContentCreateDiv=e}}>
                                </div>
                                <div className="col-xs-12 col-sm-12  col-lg-10 col-md-10 " style={{"minHeight":"750px"}} ref={(e)=>{this.popUpContentDiv=e}}>

                               {/* <div className="col-xs-10 col-sm-10  col-lg-8 col-md-8 form-group" onClick={this.showOrgOptions} title="Click to change org">
                                {(this.state.currentOrg=="public")?(
                                	<div className="link h2 extra-padding">public</div>):(
                                		<div className="link">

										  <common.UserIcon
													id={this.state.currentOrg}
													org={"public"}
													rootSchema={"Organization"}
													noDetail={true}/>
                                		</div>
                                	)}
                                </div>
                                <div className={this.state.showOrgOptions?"col-xs-10 col-sm-10  col-lg-8 col-md-8 form-group":"hidden"}>
                                	<div key={global.guid()} className="link h2 extra-padding" onClick={self.setCurrentOrg.bind(null,"public")}>
                    					public
                    				</div>
                                	{
                                		common.getUserOrgs().map(function(o){
                                			if(o=="public"){
                                				return <div key={global.guid()} className="link"></div>
                                			}else{
                                				return 	<div key={global.guid()} className="link" onClick={self.setCurrentOrg.bind(null,o)}>
                                						<common.UserIcon
															id={o}
															org={"public"}
															rootSchema={"Organization"}
															noDetail={true}/>
													</div>
											}
                                		})
                                	}
                                </div>*/}




								{/*<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  margin-top-gap-xs propertyName " >Currently Viewing</div>
								<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
									<div className="col-lg-6 col-md-6 col-xs-12 col-sm-12 margin-top-gap-xs no-padding" >
						                <button type="button" className="btn btn-default dropdown-toggle form-control"  style={{"textTransform":"none"}} title="Click here to change"  data-toggle="dropdown">
					                     	{(this.state.currentOrg=="public")?(
				                                	<div className="link" style={{"font-size":"18px","cursor": "pointer","padding-left":"25px"}}>Public</div>):(
				                                		<div key={global.guid()} className="link">
														  	<common.UserIcon
																	id={this.state.currentOrg}
																	org={"public"}
																	rootSchema={"Organization"}
																	noDetail={true}/>
				                                		</div>
				                                	)}
					                    </button>
					                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
					                       	<li className="h5 link"  onClick={self.setCurrentOrg.bind(null,"public")}><span style={{"fontSize":"18px","cursor": "pointer","paddingLeft":"35px"}}>Public</span></li>
					                       {
					                       	common.getUserOrgs().map(function(o){
	                                			if(o=="public"){
	                                				return <li key={global.guid()} className="link hidden"></li>
	                                			}else{
	                                				return 	<li key={global.guid()} className="h5 link" onClick={self.setCurrentOrg.bind(null,o)}>
			                                					<span>
			                                						<common.UserIcon
																		id={o}
																		org={"public"}
																		rootSchema={"Organization"}
																		noDetail={true}/>
																</span>
														</li>
												}
	                                		})
	                                	}
					                  	</ul>
							            <div className="display-inline-block" style={{"position": "absolute","right": "3%","top":"0","transform":"rotate(90deg)"}}>
							                <span className="sleekIcon-rightarrow fa-2x "></span>
							            </div>
						           </div>
								</div>*/}











                                <div className="col-xs-10 col-sm-10  col-lg-8 col-md-8 form-group">
                                  	{createLink}
                                  </div>

                                <div className="col-xs-12 col-sm-12  col-lg-10 col-md-10 hidden">
                                      <h5 className=" form-group" >{schemaRec["displayName"]?schemaRec["displayName"]:this.props.schema} Lookup </h5>
                                  </div>
                                <div className="col-xs-12 col-sm-12  col-lg-8 col-md-8">
                                      <input type='text' ref={(e)=>{this.searchText=e}} onKeyUp={this.getCurrentSelectionList} className="form-control form-group" placeholder={"Search for "+(schemaRec["@displayName"]?schemaRec["@displayName"]:(schemaRec.displayName?schemaRec.displayName:this.props.schema))+""}/>
                                  </div>

                                  {publicOption}

                                <div className="col-xs-12 col-sm-12  col-lg-8 col-md-8" ref={(e)=>{this.content=e}}>
                                    {
                                        this.state.currentSelectionList.map(function(item,index){
                                            item.value.recordId=item.id;

                                            if(self.state.schemas!="" && index<limitCount){

                                                var singleDivWidth=(12/(Object.keys(item.value).length-1));
                                            	return (<div onClick={this.fillData.bind(null,item.value[refKey],id,stateData,fillObject,target,item.value,item)}
	                                            			className={"link   "+((index==self.state.currentFocus-1)?"addDashedBorder":"")} >
	                                                        <genericView.GoIntoDetail
	                                                        summary={true}
	                                                        noDetail={true}
	                                                        displayName={"no"}
	                                                        viewName={"quickView"}
	                                                        rootSchema={self.props.schema}
	                                                        record={item}
	                                                        recordId={item.id}
	                                                        org={self.props.org}/>
                                                    {/*<genericView.TableView singleDivWidth={singleDivWidth} rootSchema={self.props.schema}  record={item.value}/>*/}
                                                    </div>)
                                            }else{
                                                return <div></div>
                                            }
                                        },this)
                                    }
                                </div>
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" ref={(e)=>{this.paginationDiv1=e}}>

										<div className="col-lg-11 col-md-11 col-sm-11 col-xs-12" style={{ "right": "5%","zIndex": "2"}}>
                                        <div className="pull-right">

											<div  ref={(e)=>{this.moveBack1=e}} className="link display-table-cell extra-padding-right" onClick={self.reduceSkipCount}>
											<div className="child-img-component no-padding"><i ref={(e)=>{this.moveBack=e}} className="sleekIcon-leftarrow fa-2x nextPrevIcons" ></i></div>
												<div className="child-img-component no-padding"><span className="nextPrevIcons" >PREV</span></div>
												&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
											</div>
	                                         <div ref={(e)=>{this.moveForward1=e}} className="link display-table-cell  " onClick={self.increaseSkipCount}>
							   						<div className="child-img-component no-padding"><span className="nextPrevIcons">NEXT</span></div>
							   						<div className="child-img-component no-padding"><i ref={(e)=>{this.moveForward=e}} className="sleekIcon-rightarrow fa-2x nextPrevIcons "/></div>
											</div>




                                        </div>
                                    </div>
                                </div>
                                </div>
                              </div>
                        </div>
                    </div>
                </div>
            );

    }
});
exports.LookupComponent=LookupComponent;


/**
 *This function is used to save the record in db
 */

function removeEmptyValue(data){
     Object.keys(data).map(function(key){
       if(data[key] && data[key].constructor == Array){
         for(var i=0;i<data[key].length;i++){
	         if(Object.keys(data[key][i]).length > 0 && data[key][i].constructor != String){
	               removeEmptyValue(data[key][i])
	         }else if(data[key][i] == ""){
	               data[key].splice(i, 1);
		       i--;
	         }
         }
       }
     })
}

var saveflag = true;
function saveRecord(props,state,action,ev){
	saveflag = true;
	removeEmptyValue(state.allChilds);
	state.allChilds["recordId"] = props.hasOwnProperty("recordId") ? props.recordId : (props.data+global.guid());
	var knownData=props.knownData?props.knownData:{};
	if(props.dependentSchema && state.fullSchema && state.fullSchema["@properties"]){
		for(var key in state.fullSchema["@properties"]){
			if(state.fullSchema["@properties"][key].dataType &&
			state.fullSchema["@properties"][key].dataType.derived){
				knownData[key]=props.dependentSchema;
			}
		}
	}
	if(knownData){
		for(var key in knownData){
			state.allChilds[key]=knownData[key]
			if(props.knownDataRecord)
				lookupData[knownData[key]]=props.knownDataRecord[knownData[key]];
		}
	}
	//checking for unique fields validation against identifier
	var focusElement=0;
	if(state.fullSchema.hasOwnProperty("@identifier")){
		if(state.allChilds[state.fullSchema["@identifier"]] == ""){
			//alert("please enter "+ state.fullSchema["@identifier"]);
			//return;
			$(".errorMessage"+state.fullSchema["@identifier"]).text("required");
			saveflag = false;
			focusElement == 0 ? moveScroll($(".errorMessage"+state.fullSchema["@identifier"])[0]) : "";
			focusElement = focusElement+1;
		}
	}

	var identifier = state.fullSchema["@identifier"];//for unique validation
	var identifierVal = "";
	/*try{
		if(typeof document.querySelectorAll("input[type='text']#"+identifier)!="undefined" &&
		typeof document.querySelectorAll("input[type='text']#"+identifier)[0]!="undefined"  &&
		typeof document.querySelectorAll("input[type='text']#"+identifier)[0].value !="undefined" &&
		typeof document.querySelectorAll("input[type='text']#"+identifier)[0].value.trim()!="undefined" )
		identifierVal=document.querySelectorAll("input[type='text']#"+identifier)[0].value.trim();
	}catch(r){}*/
//	WebUtils.doPost("/generic?operation=lookupSchema",{searchKey:identifierVal,identifierVal:identifierVal,schema:props.data,"recordId":props.recordId,"stale":false},function(result){
	//	if(result.notExists){
			/*var len = result.records.length;
			if(len > 0){
				for(var i = 0;i < len;i++){
					if(result.records[i].id != props.recordId){
						if(result.records[i].value["@identifier"] == identifierVal){
							document.querySelectorAll("input[type='text']#"+identifier)[0].value="";
							state.allChilds[state.fullSchema["@identifier"]] = "";
							alert("identifier value should be unique");
							return;
						}
					}
				}
			}*/

		var properties = JSON.parse(JSON.stringify(state.fullSchema["@properties"]));
		var len1 = Object.keys(properties).length;
		for(var i = 0;i < len1;i++){
			if(properties[Object.keys(properties)[i]] && properties[Object.keys(properties)[i]].constructor == Object){
				if(properties[Object.keys(properties)[i]].dataType.type != "array" && properties[Object.keys(properties)[i]].dataType.type != "struct"){//for plain required
					if(properties[Object.keys(properties)[i]].required == true){
						if(properties[Object.keys(properties)[i]].dataType.type == "geoLocation"){//for plain map(geo lacation)
							if(state.allChilds[Object.keys(properties)[i]] == ""){
								var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
								$(".errorMessage"+Object.keys(properties)[i]).text("required");
								saveflag = false;
							 	focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i])[0]) : "";
								focusElement = focusElement+1;
							}else if(state.allChilds[Object.keys(properties)[i]].latitude == ""){
								var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName+" latitude" : properties[Object.keys(properties)[i]].prompt+" latitude";
								$(".errorMessage"+Object.keys(properties)[i]).text("required");
								saveflag = false;
								focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i])[0]) : "";
								focusElement = focusElement+1;
							}else if(state.allChilds[Object.keys(properties)[i]].longitude == ""){
								var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName+" longitude" : properties[Object.keys(properties)[i]].prompt+" longitude";
								$(".errorMessage"+Object.keys(properties)[i]).text("required");
								saveflag = false;
								focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i])[0]) : "";
								focusElement = focusElement+1;
							}
						}else{
							if(Object.keys(properties)[i] != "boolean"){
								if(state.allChilds[Object.keys(properties)[i]] == ""){//for plain remaining
									var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
									//alert("please fill "+msg);
									$(".errorMessage"+Object.keys(properties)[i]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i])[0]) : "";
									focusElement = focusElement+1;
								}
							}
						}
					}
				}else if(properties[Object.keys(properties)[i]].dataType.type == "array"){
					if(properties[Object.keys(properties)[i]].dataType.elements.type == "geoLocation"){//for array of map(geo lacation)
						var len = state.allChilds[Object.keys(properties)[i]].length;
						for(var z = 0;z < len;z++){
							if(properties[Object.keys(properties)[i]].required == true){
								if(state.allChilds[Object.keys(properties)[i]][z] == ""){
									var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
									$(".errorMessage"+Object.keys(properties)[i]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(z)[0]) : "";
									focusElement = focusElement+1;
								}else if(state.allChilds[Object.keys(properties)[i]][z].latitude == ""){
									var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName+" latitude" : properties[Object.keys(properties)[i]].prompt+" latitude";
									$(".errorMessage"+Object.keys(properties)[i]).text("please fill latitude");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(z)[0]) : "";
									focusElement = focusElement+1;
								}else if(state.allChilds[Object.keys(properties)[i]][z].longitude == ""){
									var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName+" longitude" : properties[Object.keys(properties)[i]].prompt+" longitude";
									$(".errorMessage"+Object.keys(properties)[i]).text("please fill longitude");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(z)[0]) : "";
									focusElement = focusElement+1;
								}
							}
						}
						}else if(properties[Object.keys(properties)[i]].dataType.elements.type == "image" || properties[Object.keys(properties)[i]].dataType.elements.type == "images"){
							var len = state.allChilds[Object.keys(properties)[i]].length;
							for(var z = 0;z < len;z++){
								if(properties[Object.keys(properties)[i]].required == true){
									if(state.allChilds[Object.keys(properties)[i]][z] === ""){
										var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
										$(".errorMessage"+Object.keys(properties)[i]).text("required");
										saveflag = false;
										focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(z)[0]) : "";
										focusElement = focusElement+1;
									}
									if(Object.keys(state.allChilds[Object.keys(properties)[i]][z]).length == 0){
										var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
										$(".errorMessage"+Object.keys(properties)[i]).text("required");
										saveflag = false;
										focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(z)[0]) : "";
										focusElement = focusElement+1;
									}
								}
							}
						}else if(properties[Object.keys(properties)[i]].dataType.elements.type == "struct"){
							var structData = state.allChilds[Object.keys(properties)[i]];
							var structDataLen = Object.keys(structData[0]).length;
							for(var k = 0;k <structData.length;k++){
								for(var l = 0;l < structDataLen;l++){
									if(finalObject1[Object.keys(structData[k])[l]].dataType.type != "boolean"){
										if(finalObject1[Object.keys(structData[k])[l]].required == true){
											if(state.allChilds[Object.keys(properties)[i]][k][Object.keys(structData[k])[l]] == ""){
												var msg = finalObject1[Object.keys(structData[k])[l]].displayName ? finalObject1[Object.keys(structData[k])[l]].displayName : finalObject1[Object.keys(structData[k])[l]].prompt;
												$(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData[k])[l]).eq(k).text("required");
												saveflag = false;
												focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData[k])[l]).eq(k)[0]) : "";
												focusElement = focusElement+1;
											}
										}
									}
								}
							}
					}else if(properties[Object.keys(properties)[i]].dataType.elements.type != "boolean"){
						if(properties[Object.keys(properties)[i]].required == true){
							var arrayLen = state.allChilds[Object.keys(properties)[i]].length;
							if(arrayLen==0){
								var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
									$(".errorMessage"+Object.keys(properties)[i]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(0)[0]) : "";
									focusElement = focusElement+1;
							}
							for(var j = 0;j < arrayLen;j++){
								if(state.allChilds[Object.keys(properties)[i]][j] == ""){
									var msg = properties[Object.keys(properties)[i]].displayName ? properties[Object.keys(properties)[i]].displayName : properties[Object.keys(properties)[i]].prompt;
									$(".errorMessage"+Object.keys(properties)[i]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]).eq(0)[0]) : "";
									focusElement = focusElement+1;
								}
							}
						}
					}

				}else if(properties[Object.keys(properties)[i]].dataType.type == "struct"){
					var structData = state.allChilds[Object.keys(properties)[i]];
					var structDataLen = Object.keys(structData).length;
					for(var k = 0;k < structDataLen;k++){
						if(finalObject1[Object.keys(structData)[k]].dataType.type != "boolean"){
							if(finalObject1[Object.keys(structData)[k]].required == true){
								if(state.allChilds[Object.keys(properties)[i]][Object.keys(structData)[k]] == ""){
									var msg = finalObject1[Object.keys(structData)[k]].displayName ? finalObject1[Object.keys(structData)[k]].displayName : finalObject1[Object.keys(structData)[k]].prompt;
									$(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData)[k]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData)[k])[0]) : "";
									focusElement = focusElement+1;
								}
								if(state.allChilds[Object.keys(properties)[i]][Object.keys(structData)[k]].latitude == ""){
									var msg = finalObject1[Object.keys(structData)[k]].displayName ?  finalObject1[Object.keys(structData)[k]].displayName+" latitude" : finalObject1[Object.keys(structData)[k]].prompt+" latitude";
									$(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData)[k]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData)[k])[0]) : "";
									focusElement = focusElement+1;
								}else if(state.allChilds[Object.keys(properties)[i]][Object.keys(structData)[k]].longitude == ""){
									var msg = finalObject1[Object.keys(structData)[k]].displayName ? finalObject1[Object.keys(structData)[k]].displayName+" longitude" : finalObject1[Object.keys(structData)[k]].prompt+" longitude";
									$(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData)[k]).text("required");
									saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+Object.keys(properties)[i]+Object.keys(structData)[k])[0]) : "";
									focusElement = focusElement+1;
								}

							}
						}
					}
				}
			}
		}

		if(!saveflag){
			return false;
		}

		if(props.edit=="edit"){
			state.allChilds["editor"] = common.getUserDoc().recordId;
			state.allChilds["dateModified"] = global.getDate();
			state.allChilds["revision"] = state.allChilds.hasOwnProperty("revision")?state.allChilds.revision*1+1:1;
			state.allChilds["author"] =state.savedDoc.author;
			lookupData[common.getUserDoc().recordId] = common.getUserDoc();
			state.allChilds["dateCreated"] =state.savedDoc.dateCreated;
		}else{
			state.allChilds["org"]=props.org ? props.org : "public";
			state.allChilds["docType"] =props.data// $("#customSchemeType").text();//vikram

			//state.allChilds["recordId"] = props.hasOwnProperty("recordId") ? props.recordId : (props.data+global.guid());
			props["recordId"] = state.allChilds["recordId"];
			if(state.allChilds["recordId"] == undefined){
				state.allChilds["recordId"]=props.data+global.guid();
			}
			state.allChilds["author"] = state.allChilds.hasOwnProperty("author") ? state.allChilds.author : common.getUserDoc().recordId;
			lookupData[common.getUserDoc().recordId] = common.getUserDoc();
			state.allChilds["editor"] = state.allChilds.hasOwnProperty("editor") ? state.allChilds.editor : common.getUserDoc().recordId;
			state.allChilds["dateCreated"] = state.allChilds.hasOwnProperty("dateCreated") ? state.allChilds.dateCreated : global.getDate();
			state.allChilds["dateModified"] = global.getDate();
			state.allChilds["revision"] = 1;
			state.allChilds["@superType"] =  state.fullSchema["@superType"];
			state.allChilds["@identifier"] = state.fullSchema["@identifier"];
			if(state.fullSchema["@type"] == "abstractObject"){
				state.allChilds["@derivedObjName"] = state.fullSchema["@id"]+"-"+state.allChilds[state.fullSchema["@dependentKey"]];
			}
	   }



		var x,x1 = {},x2;
		for(var f=0;f< Object.keys(formulaFields).length;f++){
			key =Object.keys(formulaFields)[f];
			if(state.fullSchema["@properties"].hasOwnProperty(key)){
				if(formulaFields[key].dataType.formulaFunction){
					res="FROM GG";
					x1[key] = formulaFields[key];
				}else{
					var separators = [' ', '\\\+', '-', '\\\(', '\\\)', '\\*', '/', ':', '\\\?'];
					x = formulaFields[key].dataType.expression;
					var tokens = x.split(new RegExp(separators.join('|'), 'g'));
				    calculation(0);
				}
			}

		}

		function calculation(j){
			 for(var i = 0;i < tokens.length;i++){
			 	if(tokens[i].trim() != "" &&  !Number(+tokens[i])){//!Number.isInteger(+tokens[i])
			       var searchWord = x.search(tokens[i]);
			       if(searchWord != -1 && tokens[i].indexOf("#") != 0){
			       		if(!formulaFields[key].dataType[tokens[i]]){
							x = x.replace(tokens[i], tokens[i]);
					      	if(i == tokens.length-1){
							    showCalculatedValue($("input:text#"+key),x,state.allChilds,key,saveflag);
					  		}
			       		}else{
				       		for(var key1 in finalObject1){
				       			var obj = formulaFields[key].dataType[tokens[i]].split(".")[0];
								  if(finalObject1[key1].constructor == Object){
								    if(finalObject1[key1].dataType.type == "array"){//for each datatype
								      if(finalObject1[key1].dataType.elements.type == "struct"){
								        if(finalObject1[key1].dataType.elements.structRef == obj){
								         var ffFields = formulaFields[key].dataType[tokens[i]].split(".")[1].split("__");
								          if(ffFields.length >= 2){
								              var input = ffFields[0];
								              if(state.allChilds[key1][j][ffFields[1]] !=""){
								              		for(var k = 0;k<Object.keys(lookupData).length;k++){
										              	if(state.allChilds[key1][j][input] == Object.keys(lookupData)[k]){
										              	    x = x.replace(tokens[i], lookupData[Object.keys(lookupData)[k]][ffFields[1]]);
											            }
									             	}

									                if(!lookupData.hasOwnProperty(state.allChilds[key1][j][input])){
									              		x = x.replace(tokens[i], state.allChilds[key1][j][ffFields[1]]);
									                }

											       	if(i == tokens.length-1){
										 				try{
													     	res = math.format(math.parser().eval(x), {
													         	precision: 14
													       	});
													       	 res = res.replace(/['"]+/g, '');//used to delete quotes in the expression
														    if($("div#"+obj)[0]){
														    	$("div#"+obj).find('.'+key).eq(j).val(res);
														    }else{
														    	$('.'+key).eq(j).val(res);
														    }

											 				if(state.allChilds[key1][j].hasOwnProperty(key)){
											 					state.allChilds[key1][j][key] = res;
											 				}else{
											 					state.allChilds[key] = res;
											 				}

											 				if(state.allChilds[key1][j+1]){
												 				x=formulaFields[key].dataType.expression;
												 				calculation(j+1);
											 				}
												     	}
													    catch (err) {
													       res = err.toString();
													        alert(res);
													       saveflag = false;
													    }

										 			}
								              }else{
								                	saveflag = false;
								              		$("span.errorMessage"+key1+input).eq(j).text("required.Used in Formula");
								              }
								          }else{
								          	if(state.allChilds[key1][j][tokens[i].trim()] !=""){
								          		if(finalObject1[key1].dataType.type == "text"){
										       		 x = x.replace(tokens[i], '"'+state.allChilds[key1][j][tokens[i].trim()]+'"');
										       	}else{
										       		 x = x.replace(tokens[i], state.allChilds[key1][j][tokens[i].trim()]);
										       	}
									       	 	if(i == tokens.length-1){
										       		try{
												     	res = math.format(math.parser().eval(x), {
												         	precision: 14
												       	});
												       	res = res.replace(/['"]+/g, '');//used to delete quotes in the expression
														$("div#"+key1).find("."+key).eq(j).val(res);
														state.allChilds[key1][j][key] = res;
														if(state.allChilds[key1][j+1]){
											 				x=formulaFields[key].dataType.expression;
											 				calculation(j+1);
										 				}
											     	}
												    catch (err) {
												       res = err.toString();
												       alert(res);
												       saveflag = false;
												    }
										       	}
								          	}else{
								          	  	saveflag = false;
								          		$("span.errorMessage"+key1+tokens[i].trim()).eq(j).text("required.Used in Formula");
								          	}
								          }
								        }
								      }
								    }else if(finalObject1[key1].dataType.type == "number" || finalObject1[key1].dataType.type == "text"){
								    	var searchWord = x.search(key1);
								    	if(state.allChilds[tokens[i]] != ""){
						       				if(searchWord != -1 && state.allChilds[tokens[i]]){
						       					if(finalObject1[key1].dataType.type == "number"){
						       						x = x.replace(tokens[i], state.allChilds[tokens[i]]);
						       					}else if(finalObject1[key1].dataType.type == "text"){
						       						x = x.replace(tokens[i], '"'+state.allChilds[tokens[i]]+'"');
						       					}
									        }
									       	if(i == tokens.length-1 && state.allChilds[tokens[i]] && key1 == tokens[i]){
											   showCalculatedValue($("input:text#"+key),x,state.allChilds,key,saveflag);
									       	}
								       	}else{
								       		if(key1 == tokens[i]){
								       	  		saveflag = false;
								       			$("span.errorMessage"+tokens[i].trim()).text("required.Used in Formula");
								       		}
								       	}
								    }else if(finalObject1[key1].dataType.type == "object"){
								    	  var ffFields = formulaFields[key].dataType[tokens[i]].split(".")[1].split("__");
										  if(ffFields.length >= 2){
												var input = ffFields[0];
												if(finalObject1[key1].dataType.objRef == finalObject1[input].dataType.objRef ){

												  if(state.allChilds[key1] != ""){
														for(var k = 0;k<Object.keys(lookupData).length;k++){
															if(state.allChilds[key1] == Object.keys(lookupData)[k]){
																try{
																	if(finalObject1[key1].dataType.refKeyObjRef){
																		if(SchemaStore.getSchema(finalObject1[key1].dataType.refKeyObjRef)["@properties"][ffFields[1]].dataType.type == "number"){
																			x = x.replace(tokens[i], lookupData[Object.keys(lookupData)[k]][ffFields[1]]);
																		}else{
																			x = x.replace(tokens[i], '"'+lookupData[Object.keys(lookupData)[k]][ffFields[1]]+'"');
																		}
																	}else if(SchemaStore.getSchema(finalObject1[key1].dataType.objRef)["@properties"][ffFields[1]].dataType.type == "number"){
																		x = x.replace(tokens[i], lookupData[Object.keys(lookupData)[k]][ffFields[1]]);
																	}else{
																		x = x.replace(tokens[i], '"'+lookupData[Object.keys(lookupData)[k]][ffFields[1]]+'"');
																	}
																}catch(err){
																	console.log(err);
																}
															}
														}
														if(i == tokens.length-1){
															showCalculatedValue($("input:text#"+key),x,state.allChilds,key,saveflag);
														}
												  }else{
												    saveflag = false;
													$("span.errorMessage"+key1).text("required.Used in Formula");
												  }
											   }
										  }
								      }else if(finalObject1[key1].dataType.type == "formula"){
								      		if(key1 == tokens[i]){
								      			if(state.allChilds[tokens[i]] != ""){
								      				if(finalObject1[key].dataType.returnType == "number"){
							       						x = x.replace(tokens[i], state.allChilds[tokens[i]]);
							       					}else{
							       						x = x.replace(tokens[i], '"'+state.allChilds[tokens[i]]+'"');
							       					}
								      			}else{
								      				if(saveflag){
									      				x = formulaFields[key1].dataType.expression;
									      				key = key1;
														tokens = x.split(new RegExp(separators.join('|'), 'g'));
			    										calculation(0);
														f--;
													}
								      			}

								      			if(i == tokens.length-1){
													showCalculatedValue($("input:text#"+key),x,state.allChilds,key,saveflag);
												}
								      		}
								      }
								  }
							}
						}
			       }else{//for system properties
				        var ffFields = formulaFields[key].dataType[tokens[i]].split(".")[1].split("__");
			         	if(ffFields.length >= 2){
			              var input = ffFields[0];
			              for(var k = 0;k<Object.keys(lookupData).length;k++){
				              	if(state.allChilds[input.split("#")[1]] == Object.keys(lookupData)[k]){
				              	    x = x.replace(tokens[i], '"'+lookupData[Object.keys(lookupData)[k]][ffFields[1]]+'"');
					            }
			              }
			            }else{
			           		x = x.replace(tokens[i], '"'+state.allChilds[tokens[i].split("#")[1]]+'"');
			            }

				      	if(i == tokens.length-1){
						    showCalculatedValue($("input:text#"+key),x,state.allChilds,key,saveflag);
				  		}
			       }
			     }else{//for fixed numbers like 10(field + 10)
			     	if(tokens[i].trim() != "" ){
				     	x = x.replace(tokens[i], tokens[i]);
				      	if(i == tokens.length-1){
						  	showCalculatedValue($("input:text#"+key),x,state.allChilds,key,saveflag);
				  		}
					}
			    }
		 	}
		}


		if(Object.keys(x1).length > 0){
			Object.keys(x1).map(function(key){
				var separators = [' ', '\\\+', '-', '\\\(', '\\\)', '\\*', '/', ':', '\\\?'];
				x2 = (x1[key].dataType.expression.trim()).substring(x1[key].dataType.functionName.length).trim();
				var tokens = x2.split(new RegExp(separators.join('|'), 'g'));
				 for(var q = 0;q < tokens.length;q++){
			 		if(tokens[q].trim() != ""){
				       	var searchWord = x2.search(tokens[q]);
				       	if(searchWord != -1){
				       		if(x1[key].dataType.hasOwnProperty(tokens[q])){
					       		var ffFields = x1[key].dataType[tokens[q]].split(".")[1].split("__");
						        if(ffFields.length >= 2){
						            var input = ffFields[0];
						            var sum=0;
									for(var p=0;p<state.allChilds[input].length;p++){
										sum= sum + (+state.allChilds[input][p][ffFields[1]]);
									}
									x2 = x2.replace(tokens[q], sum);
				       			}else if(finalObject1[ffFields].dataType.type == "array"){
					       			if(finalObject1[ffFields].dataType.elements.type == "number"){
					       				 var sum=0;
										for(var p=0;p<state.allChilds[ffFields].length;p++){
											sum= sum + (+state.allChilds[ffFields][p]);
										}
										x2 = x2.replace(tokens[q], sum);
					       			}else if(finalObject1[ffFields].dataType.elements.type == "text"){
					       				 var sum="";
										for(var p=0;p<state.allChilds[ffFields].length;p++){
											sum= sum + state.allChilds[ffFields][p];
										}
										x2 = x2.replace(tokens[q], '"'+sum+'"');
					       			}
				       			}else if(finalObject1[ffFields].dataType.type == "number"){
									x2 = x2.replace(tokens[q], state.allChilds[ffFields]);
					       		}else if(finalObject1[ffFields].dataType.type == "text"){
									x2 = x2.replace(tokens[q], '"'+state.allChilds[ffFields]+'"');
					       		}
			       			}else{
			       				x2 = x2.replace(tokens[q], tokens[q]);
			       			}
				       	}
			    	}
			     }
				 if(q == tokens.length){
			       		try{
					     	 res = math.format(math.parser().eval(x2), {
					         	precision: 14
					       	});
				     	}
					    catch (err) {
					       res = err.toString();
					       alert(res);
					       saveflag = false;
					    }
					    res = res.replace(/['"]+/g, '');//used to delete quotes in the expression
					    document.querySelectorAll("input[type='text']#"+key)[0].value=res;
						//$("input:text#"+key).val(res);
						state.allChilds[key] = res;
		       	  }
				return res;
			})
		}

			//image setandget ref code1
			//video setandget ref code1
			//save images ref code2


		if(!saveflag){
			return false;
		}



		if(props.relationDesc){
			state.allChilds["relationDesc"]=props.relationDesc;
		}
		if(state.fullSchema["@relationDesc"]){
			state.allChilds["relationDesc"]=state.fullSchema["@relationDesc"];
		}

		deleteImages(savedImgIds);


		if(state.fullSchema &&
	   		state.fullSchema["@type"] &&
	   		state.fullSchema["@type"]=="abstractObject" &&
	   		state.allChilds.dependentProperties){
	   			var dependentKey;
	   			if(typeof state.fullSchema["@properties"] == "object"){
	   				for(var key in state.fullSchema["@properties"]){
	   					if(state.fullSchema["@properties"][key].dataType &&
	   						state.fullSchema["@properties"][key].dataType.derived){
	   							dependentKey=key;
	   							break;
	   						}
	   				}
	   			}
	   			if(state.allChilds[dependentKey] == undefined ||
	   				state.allChilds[dependentKey]==""){
	   					$(".errorMessagedependentProperties"+dependentKey).html("required");
	   					moveScroll($(".errorMessagedependentProperties"+dependentKey)[0]);
	   					//alert("please fill "+state.fullSchema["@properties"][dependentKey].displayName);
	   					return;
	   				}
	   			var dependentSchemaName=state.fullSchema["@id"]+"-"+state.allChilds[dependentKey];
	   			WebUtils.getMainSchema(dependentSchemaName,function(schemaRes){
	   				var saveFlag=true;
	   				if(schemaRes && schemaRes["@properties"]){
	   					for(var key in schemaRes["@properties"]){
	   						if(schemaRes["@properties"][key].required){
	   							if(state.allChilds.dependentProperties[key]==undefined ||
	   								state.allChilds.dependentProperties[key]==""){
	   									$(".errorMessagedependentProperties"+key).html("required")
	   									moveScroll($(".errorMessagedependentProperties"+key)[0]);
	   									//alert("please fill "+schemaRes["@properties"][key].displayName);
	   									saveFlag=false;
	   									//break;
	   								}else{
	   									$(".errorMessagedependentProperties"+key).html("");
	   								}
	   						}
	   					}
	   				}
	   				if(saveFlag){
	   					checkUnique();
	   				}else{
	   					return;
	   				}

	   			});

	   		}else{
	   			checkUnique();
	   		}
				// to check identifier uniqueness
				function checkUnique(){
					var matched = false;
					if(state.fullSchema.hasOwnProperty("@identifier")){
						var temp={
						   	schemaName : state.fullSchema["@id"],
							  identifier : state.allChilds[state.fullSchema["@identifier"]].trim().toLowerCase()
						   }
						   WebUtils.doPost("/schema?operation=checkIdentifier",temp,function(result){
							 if(result.length>0){
								for(var f=0;f<result.length;f++){
									if(result[f].value.recordId == state.allChilds["recordId"]){
										matched = true;
										break;
									}
								}
								if(!matched){
									$(".errorMessage"+state.fullSchema["@identifier"]).text("must be unique");
									     saveflag = false;
									focusElement == 0 ? moveScroll($(".errorMessage"+state.fullSchema["@identifier"])[0]) : "";
									focusElement = focusElement+1;
									     alert("Record extsts with identifier "+ state.allChilds[state.fullSchema["@identifier"]].trim() +". "+ state.fullSchema["@properties"][state.fullSchema["@identifier"]].displayName +"  must be unique");
								}else{
									continueSaving();
								}
							 }else{
								continueSaving();
							 }
						   });
					}else{
						continueSaving();
					}
				}


		//continueSaving();
		function continueSaving(){
		if(props.edit=="edit"){
			try{ev.target.disabled = 'disabled';}catch(err){}
			common.startLoader();
			WebUtils.doPost("/generic?operation=updateRecord",{"userId":common.getUserDoc().recordId,"recordId":props.recordId,"org":props.org,"method":props.method,"value":state.allChilds},function(data){
				if(typeof data.recRes =="object"){
					data.recRes.schema=props.data;
					data.recRes.recordId=props.recordId;
					data.recRes.dependentSchema=props.dependentSchema;
					data.recRes.userId=common.getUserDoc().recordId;
					data.recRes.org=props.org?props.org:"public";
					ServerActionReceiver.receiveSchemaRecord(data.recRes);
				}
				try{
					require('../socket.io.js').socket.emit(props.recordId,"RecordUpdated");
				}catch(err){

				}
				imgIds = [];//empty the image public ids
				common.stopLoader();
				saveflag=true;
				$(".relationModal").modal("hide");

				if(props.createCallback && typeof props.createCallback=="function"){
					props.createCallback(state.allChilds);
					return;
				}
				/*if((state.allChilds.relationDesc  && props.knownData )|| props.multiEdit){
					return;
				}*/
				if(props.fromPopUp && document.getElementById(props.contentDivId)){
					ReactDOM.unmountComponentAtNode(document.getElementById(props.contentDivId));
					JunctionStore.clearJunctionsForRecord(props.recordId);
					 ReactDOM.render(<genericView.GoIntoDetail  rootSchema={props.data}
										dependentSchema={props.dependentSchema}
										recordId={props.recordId}
										fromPopUp={props.fromPopUp}
										record={RecordDetailStore.getSchemaRecord({
											schema:props.data,
											recordId:props.recordId,
											userId:common.getUserDoc().recordId,
											org:props.org?props.org:"public"})}
										gotRecord={true}
										contentDivId={props.contentDivId}
										org={props.org ? props.org : "public"} />,document.getElementById(props.contentDivId));
					return;
				}
				//common.clearMainContent(); common.clearLeftContent();
				if(typeof props.renderTarget=="undefined"){
                    //location.hash=
                    browserHistory.push(linkGenerator.getDetailLink({record:state.allChilds,org:(props.org ? props.org : "public"),schema:props.data,recordId:props.recordId,dependentSchema:props.dependentSchema}));
                }
				return;
			});
		}else{
			ActionCreator.createRecord(state.allChilds);
			//ActionCreator.createJunction(state.allChilds);
			try{ev.target.disabled = 'disabled';}catch(err){}
			common.startLoader();
			WebUtils.doPost("/generic?operation=saveRecord",state.allChilds,function(result){
				imgIds = [];
				if(action && action!=""){
					WebUtils.doPost("/generic?operation=updateRecord",{"userId":common.getUserDoc().recordId,"recordId":state.allChilds.recordId,"org":props.org,"method":action},function(data){

					  });
				}
				common.stopLoader();
				saveflag=true;
				$(".relationModal").modal("hide");
				if(props.createCallback && typeof props.createCallback=="function"){
					props.createCallback(state.allChilds);
					return;
				}
				if(props.callbackToCreatedRecord){
					props.callbackToCreatedRecord(state.allChilds);
					return;
				}
				if(props.callbackToClosePopup){
					props.callbackToClosePopup();
					return;
				}
				/*if(state.allChilds.relationDesc  && props.knownData){
					return;
				}*/
				var ds;// "@derivedObjName": "Product-Faucet",
				if(state.allChilds["@derivedObjName"]){
					ds=state.allChilds["@derivedObjName"].split("-")[1];
				}
				if(props.fromPopUp && document.getElementById(props.contentDivId)){
					ReactDOM.unmountComponentAtNode(document.getElementById(props.fromPopUp));
					JunctionStore.clearJunctionsForRecord(state.allChilds.recordId);
					 ReactDOM.render(<genericView.GoIntoDetail  rootSchema={props.data}
										dependentSchema={ds}
										recordId={state.allChilds.recordId}
										fromPopUp={props.fromPopUp}
										contentDivId={props.contentDivId}
										org={props.org ? props.org : "public"} />,document.getElementById(props.contentDivId));
					return;
				}

				//common.clearMainContent(); common.clearLeftContent();
				//location.hash=
        browserHistory.push(linkGenerator.getDetailLink({record:state.allChilds,org:(props.org ? props.org : "public"),schema:props.data,recordId:state.allChilds.recordId,dependentSchema:ds}));
				return;
		    }.bind(this));
	   }
	  }
   		/*}else{
   			document.querySelectorAll("input[type='text']#"+identifier)[0].value="";
			state.allChilds[state.fullSchema["@identifier"]] = "";
			alert("identifier value should be unique");
			return;
   		}*/
  // })
}

function showCalculatedValue(destDom,x,destJSON,key,flag){
	saveflag=flag;
	try{
		res = math.format(math.parser().eval(x),{
			precision: 14
		});
	}catch(err){
	  res=x;
	}
	res = res.replace(/['"]+/g, '');//used to delete quotes in the expression
	$(destDom).val(res);
	destJSON[key] = res;
	/*}
	catch (err) {
	   res = err.toString();
	   alert(res);
	   saveflag = false;
	}*/
}


/**
 *This function is used to close the dialogbox
 */
function removeDilogBox(){
	 document.getElementById("genericDilog").remove();
     document.getElementsByClassName("modal-backdrop")[0].remove();
}

/**
 *This function is used to clear the dependendent field value(state  ---- district ----- address)
 * @param {Object} dependent	-----  selected data from dialogbox
 * @param {Object} stateData	-----	perticular field related data and schema property
 * @param {Object} target		-----	target element
 */
function clearDependentFields(dependent,stateData,target){
	if(dependent){
		var dependentField = dependent.dataType.dependentField;
			if(stateData.hasOwnProperty("filterConditionStructName") && stateData.filterConditionStructName){
				stateData.POT.parentNode.parentNode.querySelector("input[type='text']#"+dependentField).value = "";
			}else if(stateData.structName){
				document.getElementById(stateData.structName).querySelector("input[type='text']#"+dependentField).value = "";
			}else{
				document.querySelector("input[type='text']#"+dependentField).value = "";
			}
			if(finalObject1.hasOwnProperty(dependentField)){
				if(finalObject1[dependentField].dataType.hasOwnProperty("dependentField")){
					clearDependentFields(finalObject1[dependentField],stateData,target)
				}
			}else{
				alert("you are not added "+dependentField+" in "+document.getElementById("schema_name").value);
				return;
			}
	}else{
		if(stateData.properties.dataType.hasOwnProperty("dependentField")){
			var dependentField = stateData.properties.dataType.dependentField;
			if(stateData.hasOwnProperty("filterConditionStructName") && stateData.filterConditionStructName){
				stateData.POT.parentNode.parentNode.querySelector("input[type='text']#"+dependentField).value = "";
			}else if(stateData.structName){
				document.getElementById(stateData.structName).querySelector("input[type='text']#"+dependentField).value = "";
			}else{
				document.querySelector("input[type='text']#"+dependentField).value = "";
			}
			if(finalObject1.hasOwnProperty(dependentField)){
				if(finalObject1[dependentField].dataType.hasOwnProperty("dependentField")){
					clearDependentFields(finalObject1[dependentField],stateData,target)
				}
			}else{
				alert("you are not added "+dependentField+" in "+document.getElementById("schema_name").value);
				return;
			}
		}
	}
}


/**
 *used to detect mobile or system
 */
function detectmob() {
 if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ){
    return true;
  }
 else {
    return false;
  }
}

if(typeof window!="undefined"){
	window.onbeforeunload = function(e){
	   setTimeout(function(){
		   deleteImages(getImageIds());
	   },100);
	    return null;
	};
}

function getDefaultValues(properties,record,callback){
	var newObject={};
	var keys=Object.keys(properties);
	get(0);
	function get(index){
		if(index<keys.length){
			var key=keys[index];
			if(typeof properties[key]=="object"){
				var type=properties[key].dataType.type;
				if(type=="multiPickList" ||
					type=="array"  ||
					type=="image"   ||
					type=="images"   ||
					type=="attachment"   ||
					type=="attachments"   ||
					type=="privateVideo"   ||
					type=="privateVideos"){
					newObject[key]=[];
				}else if(type=="struct"){
					newObject[key]={};
				}else{
					newObject[key]="";
				}
				if(properties[key].dataType && properties[key].dataType.defaultValue){
					if(typeof properties[key].dataType.defaultValue=="string" && 
						properties[key].dataType.defaultValue.indexOf("this")==0){
						WebUtils.doPost("/generic?operation=ivaluateExpression",{record:record,expression:properties[key].dataType.defaultValue},function(result){
							if(result.error || result.result=="error" || result.result==undefined || result.result==null){
								//newObject[key]=[];
							}else{
								newObject[key]=result.result;
							}
							get(index+1);
					    });
					}else{
						newObject[key]=properties[key].dataType.defaultValue;
						get(index+1);
					}
					
				}else{
					get(index+1);
				}
			}else{
				newObject[key]=properties[key];
				get(index+1);
			}
		}else{
			callback(newObject);
		}
	}
}

function getFromGroupView(group,record,callback){
	var groupDetails={};
	try{
		groupDetails=Object.assign({},group);
	}catch(err){}
	if(group.key){
        if(Array.isArray(group.key)){
			var currentFKeys=group.key;
        	var currentValues=[];
        	getVal(0);
        	function getVal(index){
        		if(index<currentFKeys.length){
        			if(currentFKeys[index].indexOf("this")==0){
	        			WebUtils.doPost("/generic?operation=ivaluateExpression",{record:record,expression:currentFKeys[index]},function(result){
							currentValues.push(result.result);
							getVal(index+1);
					    });
				    }else{
				    	currentValues.push(currentFKeys[index]);
						getVal(index+1);
				    }
        		}else{
        			doneSend();
        		}
        	}
			groupDetails.key=currentValues;
        }
  	}
  	function doneSend(){
		callback(groupDetails);
	}
}
