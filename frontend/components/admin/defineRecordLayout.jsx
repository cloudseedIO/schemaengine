/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var WebUtils=require('../../utils/WebAPIUtils.js');
var common=require('../common.jsx');
var ActionCreator = require('../../actions/ActionCreator.js');
var DefinitionStore = require('../../stores/DefinitionStore');
var ImageGallery = require('../view/components/carousel.jsx').ImageGallery;
var Carousel = require('../view/components/carousel.jsx').Carousel;         
var manageSchemaNew=require('./manageSchemaNew.jsx');
var global=require('../../utils/global.js')
var Utility=require("../Utility.jsx");

function createNewLayout(type,subType,ev){
	ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
    common.clearMainContent();
   	ReactDOM.render(<SelectLayout />,document.getElementById('dynamicContentDiv'));
}
exports.createNewLayout=createNewLayout;



/**
 *Structure of the define layouts
 * 
 * SelectLayout-->1.SelectLayoutForSchema--->1.SelectedLayoutForSchema--->1.PopUpComponent--->1.SelectLayoutForSummary---->
 * 																							  2.EditLayoutForSummary---->1.CardLayoutStructure-->1.CardLayoutDesign	
 * 
 *  
 */
/***
 *no props 
 */
var SelectLayout=React.createClass({
	
	getSchemas:function(){
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<Utility.SelectSchema callback={this.selectedSchema} popUpId={popUpId} />,document.getElementById(contentDivId));
	},
	selectedSchema:function(data){
		//on selection of the schema rendering to further level and rendering it layout ref
		if(data!=undefined){
			this.schemaSelected.className+=" hidden";
		}
		ReactDOM.unmountComponentAtNode(this.layout);
		ReactDOM.render(<SelectLayoutForSchema schemaName={data} changeSchema={this.getSchemas}/>,this.layout);
	},
	
	componentDidMount:function(){
		var self=this;
		$("input[name='lay']:radio").change(function () {
		    if ($(this).val() == "LP") {
		    	//selecting the layout for landing page template
		    	ReactDOM.unmountComponentAtNode(self.layout);
		      	ReactDOM.render(<SelectLayout1 />,self.layout);
		    } else {
		      	//selecting the layout for schema
		      	self.getSchemas();
		    }
		});
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return( <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
					<label> SELECT SCHEMA FOR DEFINING OR EDITING</label>
						<div className="col-lg-12  col-md-12 col-sm-12 col-xs-12 margin-bottom-gap no-padding hidden">
							<input key={global.guid()} type="radio" name="lay" value="LP" /><span>&nbsp;</span>
							<span className="fieldText no-padding-left ">Landing Page</span>
							<span>&nbsp;&nbsp;</span><input type="radio" name="lay" value="schema" />
							<span >&nbsp;</span><span className="fieldText no-padding-left ">Schema</span>
						</div>
						<input key={global.guid()} type="text" onChange={null} name="lay" ref={(e)=>{this.schemaSelected=e}} className="form-control" value="Select The Schema" onClick={this.getSchemas} /><span>&nbsp;</span>
						
						<div ref={(e)=>{this.layout=e}} key={global.guid()} className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
						
						</div>
				</div>)
	}
})
exports.SelectLayout=SelectLayout;
/**
 * schemaName----- the name of the schema
 * changeSchema-----the callback function
 * 
 */
var SelectLayoutForSchema=React.createClass({
	getInitialState:function(){
		return{fullSchema:{},layoutSelection:""}
	},
	designLayout:function(){
		//on selecting the layout for either summary or detail it respective action is sent to the following Component and rendered in layDesignSelected ref
		ReactDOM.unmountComponentAtNode(this.layDesignSelected);
		ReactDOM.render(<SelectedLayoutForSchema fullSchema={this.state.fullSchema} />,this.layDesignSelected)
	},
	componentDidMount:function(){
		var self=this;
		//getting the complete data of the selected schema
		 
		 WebUtils.getMainSchema(this.props.schemaName,function(result){
			 self.setState({"fullSchema":result},function(){
			 	self.designLayout();
			 });  
		  })
	},
	render:function(){
		return ( <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
                            <span className="fieldText no-padding-left ">{this.props.schemaName}</span>
                         </div>
                         <button className="upload-btn margin-bottom-gap" onClick={this.props.changeSchema} >Change Schema</button>
                         <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding hidden">
                            <span className="fieldText no-padding-left ">Choose The Layout </span>
                         </div>
                         <div className="col-lg-12  col-md-12 col-sm-12 col-xs-12 margin-bottom-gap no-padding hidden">
							<input key={global.guid()} type="radio" name="layDesign" value="summary" /><span>&nbsp;</span>
							<span className="fieldText no-padding-left ">Summary</span>
							<span>&nbsp;&nbsp;</span><input key={global.guid()} type="radio" name="layDesign" value="detail" />
							<span >&nbsp;</span><span className="fieldText no-padding-left ">Detail</span>
						</div>
						 <div  ref={(e)=>{this.layDesignSelected=e}} key={global.guid()} className="col-lg-12  col-md-12 col-sm-12 col-xs-12 margin-bottom-gap no-padding">
						 </div>
                         
				 </div>)
	}
});
/**
 *fullSchema---- schema details of selected schema
 * layoutSelected ---- the selected layout (summary or detail)
 */
var SelectedLayoutForSchema=React.createClass({
	getInitialState:function(){
		return{fullSchema:this.props.fullSchema}
	},
	selected:function(layDesign,layoutSelected){
		//based on the layout selected and on selecting the create new or other layout available it is sent to other component to open in popup
		/*var node=document.createElement("div");
		node.id= global.guid();
		$(".selectedLayout").remove();
		node.className="lookUpDialogBox selectedLayout col-lg-12 col-md-12 col-sm-12 col-xs-12";
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		ReactDOM.render(<common.PopUpComponent callback={this.callback} layoutSelected={layoutSelected} layDesign={layDesign} layoutDesign={"true"} fullSchema={this.props.fullSchema} />,node);
		*/
		
		$(".selectedLayout").remove();
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        
	
		if(layDesign=="Create New"){
			if(layoutSelected=="summary"){
	    		ReactDOM.render(<SelectLayoutForSummary callback={this.callback} layoutSelected={layoutSelected}  fullSchema={this.props.fullSchema} popUpId={popUpId} />,document.getElementById(contentDivId));
	    	}else{
	    		ReactDOM.render(<SelectLayoutForDetail callback={this.callback} layoutSelected={layoutSelected}  fullSchema={this.props.fullSchema} popUpId={popUpId} />,document.getElementById(contentDivId));
	    	}
	    }else{
	    	if(layoutSelected=="summary"){
	    		ReactDOM.render(<EditLayoutForSummary callback={this.callback} layoutSelected={layoutSelected} layDesign={layDesign} fullSchema={this.props.fullSchema} popUpId={popUpId} />,document.getElementById(contentDivId));
	    	}else{
	    		ReactDOM.render(<EditLayoutForDetail callback={this.callback} layoutSelected={layoutSelected} layDesign={layDesign} fullSchema={this.props.fullSchema} popUpId={popUpId} />,document.getElementById(contentDivId));
	    	}
	
	    }
	
	
	},
	callback:function(modifiedSchema){
		console.log(modifiedSchema)
		this.setState({fullSchema:modifiedSchema})
	},
	deleteLayout:function(layDesign){
		var modifiedSchema=this.state.fullSchema;
		if(modifiedSchema && modifiedSchema["@operations"] && modifiedSchema["@operations"]["read"] && modifiedSchema["@operations"]["read"][layDesign]){
			delete modifiedSchema["@operations"]["read"][layDesign];
				this.setState({fullSchema:modifiedSchema})		
		}		
	},
	backToShowRelated : function(){
		ReactDOM.render(<manageSchemaNew.ShowRelatedComp type={this.props.type}/>,document.getElementById('dynamicContentDiv'));
	},
	configTrigers : function(schemaJSON){
		//schemaJSON["@relationDesc"] ? schemaJSON["@relationDesc"] : schemaJSON["@relationDesc"] = [];
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
		manageSchemaNew.saveSchema(schemaJSON);
	},
	saveSchema:function(){
		var flag=true;
				if($("input:radio[name='defaultSummary']:checked").val()==undefined || $("input:radio[name='defaultSummary']").val()==""){
					flag=false;
					alert("select the default layout for summary")
				}
				if($("input:radio[name='defaultDetail']:checked").val()==undefined || $("input:radio[name='defaultDetail']").val()==""){
					flag=false;
					alert("select the default layout for detail")
				}
				if(flag){
					var schema=this.state.fullSchema;
					var temp={
						"summary":$("input:radio[name='defaultSummary']:checked").val(),
						"detail":$("input:radio[name='defaultDetail']:checked").val()
					}
					schema["@defaultViews"]=temp;
					/*if(this.props.fromSchema!="yes"){
						this.callback(schema)
					}else{
						this.configTrigers(schema);
					}*/
					this.configTrigers(schema);
				}
	},
	componentDidMount:function(){
		var detail=[];
		var summary=[];
		if(this.state.fullSchema && this.state.fullSchema["@defaultViews"]!=undefined && Object.keys(this.state.fullSchema["@defaultViews"]).length >0){
			if(this.state.fullSchema["@defaultViews"]["summary"]!=undefined){
				$("input:radio[value='"+this.state.fullSchema["@defaultViews"]["summary"]+"']").click();
			}
			if(this.state.fullSchema["@defaultViews"]["detail"]!=undefined){
				$("input:radio[value='"+this.state.fullSchema["@defaultViews"]["detail"]+"']").click();
			}
		}
	},
	render:function(){
		var detail=[];
		var summary=[];
		var schemaViews=true;
		if(this.state.fullSchema && this.state.fullSchema["@operations"] && this.state.fullSchema["@operations"]["read"]){
			var fullSchema=this.state.fullSchema;
			Object.keys(fullSchema["@operations"]["read"]).map(function(lay){
				if(Array.isArray(fullSchema["@operations"]["read"][lay].UILayout)){
					detail.push(lay);
				}else if(fullSchema["@operations"]["read"][lay] && fullSchema["@operations"]["read"][lay].UILayout){
					summary.push(lay);
				}else if(fullSchema["@views"]==undefined || ( fullSchema["@views"] && fullSchema["@views"].length < 1) ){
					schemaViews=false;
				}
			})
		}
		//pushing create new in both summary and detail so as on click  create  new gets created  
		summary.push("Create New");
		detail.push("Create New");
		var self=this;
		return(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					{
						["a"].map(function(temp){
							var summaryHeading="hidden";
							if(summary.length>0){
								summaryHeading="";
							}
							var detailHeading="hidden"
							if(detail.length>0){
								detailHeading="";
							}	
							return(<div key={global.guid()} className="col-lg-12  col-md-12 col-sm-12 col-xs-12 margin-bottom-gap no-padding">
									
										{
											["a"].map(function(temp){
												if(schemaViews){
													return(<div key={global.guid()} className={" text-uppercase col-lg-6  col-md-6 col-sm-6 col-xs-12 no-padding-left"}>
																<h5 className={summaryHeading}>The Available Summary Data Views Are </h5>
														   		{
														   			summary.map(function(layDesign){
														   				var create="";
														   				if(layDesign=="Create New"){
														   					create="hidden";
														   				}
														   				return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding parent-img-component" >
														   							<div className="child-img-component" style={{"display":"inline-block"}}>
														   								<input key={global.guid()} value={layDesign} title="Select to make it a default view" type="radio" className={"form-control "+create} name="defaultSummary" />
														   							</div>
														   							<div className="child-img-component" style={{"display":"inline-block"}}>
														   								<span className="link-btn link" onClick={self.selected.bind(null,layDesign,"summary")}>{layDesign}</span>
														   							</div>
														   							<div className={"child-img-component "+create} style={{"display":"inline-block"}} >
														   								<span className="icons8-delete  fa-2x  link" aria-hidden="true" onClick={self.deleteLayout.bind(null,layDesign,"summary")} ></span>
														   							</div>
														   						</div>)
														   			},this)	
														   		}
									                       </div>)
								                    }else{
								                    	return(<div key={global.guid()} className={" text-uppercase col-lg-6  col-md-6 col-sm-6 col-xs-12 no-padding-left"}>
								                    				<h5 >Cannot create Summary Views For This Schema.</h5><h5> Please Create the views in the schema creation page and then come here again</h5>
								                    			</div>)
								                    }
						                       })
					                       }
					                        <div className={" text-uppercase col-lg-6  col-md-6 col-sm-6 col-xs-12 margin-bottom-gap no-padding "}>
												<h5 className={detailHeading}>The Available Detail Data Views Are </h5>
										   		{
										   			detail.map(function(layDesign){
										   				var create="";
										   				if(layDesign=="Create New"){
										   					create="hidden";
										   				}
										   				return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 form-group no-padding parent-img-component" >
										   							<div className="child-img-component" style={{"display":"inline-block"}}>
										   								<input key={global.guid()} key={global.guid()} type="radio" value={layDesign} title="Select to make it a default view"  className={"form-control "+create} name="defaultDetail" />
										   							</div>
										   							<div className="child-img-component" style={{"display":"inline-block"}}>
										   								<span className="link-btn link" onClick={self.selected.bind(null,layDesign,"detail")}>{layDesign}</span>
										   							</div>
										   							<div className={"child-img-component "+create} style={{"display":"inline-block"}} >
										   								<span className="icons8-delete  fa-2x  link" aria-hidden="true"  onClick={self.deleteLayout.bind(null,layDesign,"detail")}></span>
										   							</div>
										   						</div>)
										   			},this)	
										   		}
					                      </div>
								   </div>)
						})
					}
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						<button className={this.props.fromSchema=="yes"?"btn  btn-warning ":"hidden"} onClick={this.backToShowRelated}>BACK</button>
						<button className="btn  btn-warning  pull-right" onClick={this.saveSchema}>{"SAVE SCHEMA"}</button>
					</div>
				</div>)
		
	}
	
})
exports.SelectedLayoutForSchema=SelectedLayoutForSchema;


/**
 *	callback
 * layoutSelected
 * fullSchema 
 */
var SelectLayoutForSummary=React.createClass({
	getInitialState:function(){
		return {outProperties:[],summaryViews:[]};
	},
	selectLayout:function(value){
		if(this.viewName.value!="" && this.customViewName.value!="Select View To Be Created"){
			if(value=="Card Layout"){
				this.selectType.innerHTML="Card Layout";
				ReactDOM.render(<CardLayoutPreview callback={this.props.callback} newLayout={"new"} viewName={this.viewName.value} layoutSelected={this.props.layoutSelected} outProperties={this.state.outProperties}  fullSchema={this.props.fullSchema} />,this.SelectedLayout);
			}else if(value=="Gallery Layout"){
				this.selectType.innerHTML="Gallery Layout";
				ReactDOM.render(<GalleryLayoutPreview callback={this.props.callback} newLayout={"new"} viewName={this.viewName.value} layoutSelected={this.props.layoutSelected} outProperties={this.state.outProperties}  fullSchema={this.props.fullSchema} />,this.SelectedLayout);
			}else if(value=="Side By Side Layout"){
				this.selectType.innerHTML="Side By Side Layout";
				ReactDOM.render(<GalleryLayoutPreview from={"sideByside"} columnCount={1}  callback={this.props.callback} newLayout={"new"} viewName={this.viewName.value} layoutSelected={this.props.layoutSelected} outProperties={this.state.outProperties}  fullSchema={this.props.fullSchema} />,this.SelectedLayout);
			}
		}else{
			alert("Please Fill the view Name")
		}
	},
	componentDidMount:function(){
		var fullSchema=this.props.fullSchema;
		if( fullSchema["@views"] && fullSchema["@views"][0] && fullSchema["@views"][0].value && fullSchema["@views"][0].value.length>0){
				var outProperties=fullSchema["@views"][0].value;
				var propertiesNotToShow=["org","id","requiredKeys","filters","dependentProperties","recordId"];
					propertiesNotToShow.map(function(property){
						if(outProperties.indexOf(property)!=-1){
							delete outProperties[outProperties.indexOf(property)];
							outProperties=outProperties.filter(function(n){ return (n != "" && n!= undefined)});
						}
					})
				this.setState({outProperties:outProperties});		
		}else{
			alert("Please Define the out properties for the summary view in schema")
		}
		
		var summary=["getSummary","quickView","customView"];
		if(fullSchema && fullSchema["@operations"] && fullSchema["@operations"]["read"]){
			Object.keys(fullSchema["@operations"]["read"]).map(function(lay){
				if(fullSchema["@operations"]["read"][lay] && !Array.isArray(fullSchema["@operations"]["read"][lay].UILayout)){
					if(summary.indexOf(lay)!=-1){
						delete 	summary[summary.indexOf(lay)];
						summary=summary.filter(function(n){ return (n != "" && n!= undefined)});					
					}
				}
			})
		}
		this.setState({summaryViews:summary})
	},
	selectView:function(viewName){
		if(viewName=="customView"){
			if(this.state.summaryViews.length==1 && this.state.summaryViews.indexOf(viewName)==0){
				this.customViewDiv.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left";
				this.customViewName.innerHTML=viewName;
			}else{
				alert("Please create the getSummary and quickView first");
			}
		}else{
			this.customViewDiv.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left hidden";
			this.customViewName.innerHTML=viewName;
			this.viewName.value=viewName;
		}
	},
	render:function(){
		var self=this;
		var data=["Card Layout","Gallery Layout","Side By Side Layout","Calender Layout"]
		return(<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
				   	<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap" >
			   			<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
			   				<span  ref={(e)=>{this.customViewName=e}} data-bind="label">Select View To Be Created</span>
			   			</button>
			   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
				   			{
				   				this.state.summaryViews.map(function(value){
				   					return( <li key={global.guid()} onClick={self.selectView.bind(null,value)}><span >{value}</span></li>)	
				   				},this)
				   			}
			   			</ul>
			   		</div>
		   			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left hidden" ref={(e)=>{this.customViewDiv=e}}>
						<label  className="text-uppercase">TYPE THE VIEW NAME</label>
						<input key={global.guid()} type="text" ref={(e)=>{this.viewName=e}} className="form-control margin-bottom-gap" placeholder="Enter the view name"/>
					</div>
				   	
				   	<label  className="text-uppercase">SELECT TYPE OF LAYOUT</label>
				   	
				   		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
				   			<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
				   				<span  ref={(e)=>{this.selectType=e}} data-bind="label">Select Type</span>
				   			</button>
				   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
					   			{
					   				data.map(function(value){
					   					return( <li key={global.guid()} onClick={self.selectLayout.bind(null,value)}><span >{value}</span></li>)	
					   				},this)
					   			}
				   			</ul>
				   		</div>
				   		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" ref={(e)=>{this.SelectedLayout=e}}>
				   		
				   		</div>
				   	</div>)
	}
})
exports.SelectLayoutForSummary=SelectLayoutForSummary;

/**
 *	callback
 * 	layoutSelected
 * 	fullSchema
 */
var SelectLayoutForDetail=React.createClass({
	getInitialState:function(){
		return{outProperties:[],detailViews:[],viewName:""}
	},
	componentDidMount:function(){
		var fullSchema=this.props.fullSchema;
		var detail=["getDetail","customView"];
		if(fullSchema && fullSchema["@operations"] && fullSchema["@operations"]["read"]){
			
			Object.keys(fullSchema["@operations"]["read"]).map(function(lay){
				if(fullSchema["@operations"]["read"][lay] && Array.isArray(fullSchema["@operations"]["read"][lay].UILayout)){
					if(detail.indexOf(lay)!=-1){
						delete 	detail[detail.indexOf(lay)];
						detail=detail.filter(function(n){ return (n != "" && n!= undefined)});					
					}
				}
			})
		}
		this.setState({detailViews:detail})
		console.log(this.viewName.value)
	},
	outProperty:function(){
		if(this.state.viewName!="" || (this.state.viewName=="customView" && this.viewName.value!="")){
			var viewName=this.state.viewName;
			if(this.state.viewName=="customView"){
				viewName=this.viewName.value;
				this.setState({viewName:this.viewName.value})
				this.customViewTitle.innerHTML=viewName;
				$(this.customViewTitle).removeClass("hidden");
				//this.customViewTitle.className=this.customViewTitle.className.replace("hidden","");
			}
			this.outPropertiesButton.className+=" hidden";
			this.viewNameDiv.className+=" hidden";
			$(this.customViewTitle).removeClass("hidden");
			this.outPropertiesDiv.className=this.outProperties.className.replace("hidden","");
			var self=this;
			var node=document.createElement("div");
			node.id= global.guid();
	        node.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 outProperties no-padding-left";
			ReactDOM.unmountComponentAtNode(this.outProperties);
			self["outProperties"].parentNode.parentNode.appendChild(node);
			ReactDOM.render(<AddStructFields  data={this.props.fullSchema} structData={this.state.outProperties} callback={this.saveOutProperties} property={viewName} />,this.outProperties)
		}else{
			alert("Please Fill the view Name")
		}
	},
	saveOutProperties:function(data){
		this.setState({outProperties:data[Object.keys(data)[0]]})
		//this.setState({outProperties:Object.values(data)[0]})
	},
	saveProperties:function(){
		if(this.state.outProperties.length>0){
			$(".outProperties").remove();
		//	this.outPropertiesButton.className=this.outPropertiesButton.getDOMNo8de().className.replace("hidden","");
			this.outPropertiesDiv.className+=" hidden";
			$(this.renderDiv1).removeClass("hidden");
			//this.renderDiv1.className=this.renderDiv1.className.replace("hidden","");
			ReactDOM.unmountComponentAtNode(this.renderDiv1);
			ReactDOM.render(<EditLayoutForDetail callback={this.props.callback} outProperties={this.state.outProperties} newLayout={"new"} layoutSelected={"detail"} layDesign={this.state.viewName} fullSchema={this.props.fullSchema} />,this.renderDiv1)
							
		}else{
			alert("Please select atleast one outProperty")
		}
	},
	selectView:function(viewName){
		if(viewName=="customView"){
			if(this.state.detailViews.length==1 && this.state.detailViews.indexOf(viewName)==0){
				this.viewNameDiv.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left";
				this.customViewName.innerHTML=viewName;
				this.setState({viewName:viewName})
			}else{
				alert("Please create the getDetail first");
			}
		}else{
			this.viewNameDiv.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left hidden";
			this.customViewName.innerHTML=viewName;
			this.viewName.value=viewName;
			this.setState({viewName:viewName})
		}
	},
	render:function(){
		var self=this;
		
		return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" >
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap" >
			   			<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
			   				<span  ref={(e)=>{this.customViewName=e}} data-bind="label">Select View To Be Created</span>
			   			</button>
			   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
				   			{
				   				this.state.detailViews.map(function(value){
				   					return( <li key={global.guid()} onClick={self.selectView.bind(null,value)}><span >{value}</span></li>)	
				   				},this)
				   			}
			   			</ul>
			   		</div>
		   			<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding-left hidden " ref={(e)=>{this.viewNameDiv=e}}>
						<label  className="text-uppercase">TYPE THE VIEW NAME</label>
						<input key={global.guid()} type="text" ref={(e)=>{this.viewName=e}} className="form-control margin-bottom-gap" placeholder="Enter the view name"/>
					</div>
					<label  className="text-uppercase hidden" ref={(e)=>{this.customViewTitle=e}}>CUSTOM</label>
						
					{
					/*<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap" ref={(e)=>{this.viewNameDiv=e}}>
						<label  className="text-uppercase ">TYPE THE VIEW NAME</label>
				   		<input key={global.guid()} type="text" ref={(e)=>{this.viewName=e}} className="form-control margin-bottom-gap " placeholder="Enter the view name"/>
				   	</div>*/
				   	}
				   	<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap" ref={(e)=>{this.outPropertiesButton=e}}>
						<button className="upload-btn" onClick={this.outProperty} >SET OUT PROPERTIES</button>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" ref={(e)=>{this.outPropertiesDiv=e}}>
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.outProperties=e}}>
							</div>
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
								<button className=" btn upload-drop-zone pull-right" onClick={this.saveProperties}>SAVE OUT PROPERTIES</button>
							</div>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" ref={(e)=>{this.renderDiv1=e}}>
					</div>
				</div>)
	}
})
exports.SelectLayoutForDetail=SelectLayoutForDetail;



/***
 * 	layoutSelected--selected layout (schema)
 * 	layDesign --(detail)
 * 	fullSchema--- schema data
 *  callback
 */
var EditLayoutForDetail=React.createClass({
	getInitialState:function(){
		return {UILayout:(this.props.newLayout && this.props.newLayout=="new")?[]:JSON.parse(JSON.stringify(this.props.fullSchema["@operations"]["read"][this.props.layDesign].UILayout)),previewRecord: DefinitionStore.getDefinition("PreviewRecord")}
	},
	deleteLayout:function(index){
		var UILayout=this.state.UILayout;
		delete UILayout[index];
		UILayout = UILayout.filter(function(n){ return (n != "" && n!= undefined)});
		this.setState({UILayout:UILayout})
	},
	editLayout:function(layout,index){
		var outProperties=[];
		$('html,body').scrollTop(0);
		if(this.props.outProperties && this.props.outProperties.length>0){
			outProperties=this.props.outProperties;
		}else if(this.props.fullSchema["@operations"]["read"][this.props.layDesign].out && this.props.fullSchema["@operations"]["read"][this.props.layDesign].out.length >0){
			outProperties=	this.props.fullSchema["@operations"]["read"][this.props.layDesign].out;
		}
		this.editData.className+=" hidden"; 
		this.saveSection.className+=" hidden"; 
		if(layout.type=="generic"){
			ReactDOM.render(<EditGenericPreview  type={"generic"} cancel={this.cancel} fullSchema={this.props.fullSchema} outProperties={outProperties} css={(layout.css!=undefined)?layout.css:undefined} objectDataViews={(layout.objectDataViews!=undefined)?layout.objectDataViews:undefined} relRefViews={(layout.relRefViews!=undefined)?layout.relRefViews:undefined} imgType={(layout.imgDisplay!=undefined)?layout.imgDisplay:undefined} callback={this.saveSectionDetail} navElement={layout.navElement} layout={layout.layout} UILayout={this.state.UILayout} index={index} previewRecord={this.state.previewRecord} />,this.renderDiv)
		}else if(layout.type=="columns"){
			ReactDOM.render(<EditGenericPreview  fullSchema={this.props.fullSchema} cancel={this.cancel} outProperties={outProperties} css={(layout.css!=undefined)?layout.css:undefined} relRefViews={(layout.relRefViews!=undefined)?layout.relRefViews:undefined} objectDataViews={(layout.objectDataViews!=undefined)?layout.objectDataViews:undefined} imgType={(layout.imgDisplay!=undefined)?layout.imgDisplay:undefined} callback={this.saveSectionDetail} navElement={layout.navElement} type={"columns"} layout={layout.layout} UILayout={this.state.UILayout} index={index} previewRecord={this.state.previewRecord} />,this.renderDiv)
		}else if(layout.type=="tabs"){
			ReactDOM.render(<TabPreview   fullSchema={this.props.fullSchema} relRefViews={(layout.relRefViews!=undefined)?layout.relRefViews:undefined} css={(layout.css!=undefined)?layout.css:undefined} objectDataViews={(layout.objectDataViews!=undefined)?layout.objectDataViews:undefined}  cancel={this.cancel}  outProperties={outProperties} callback={this.saveSectionDetail} imgType={(layout.imgDisplay!=undefined)?layout.imgDisplay:undefined} navElement={layout.navElement} type={"tabs"} layout={layout.layout} UILayout={this.state.UILayout} edit={"edit"} index={index} previewRecord={this.state.previewRecord} />,this.renderDiv)
		}else if(layout.type=="banner"){
			ReactDOM.render(<BannerLayoutPreview  systemRelations={layout.systemRelations} cancel={this.cancel} css={(layout.css!=undefined)?layout.css:undefined} objectDataViews={(layout.objectDataViews!=undefined)?layout.objectDataViews:undefined}  fullSchema={this.props.fullSchema} edit={"edit"} outProperties={outProperties} callback={this.saveSectionDetail} navElement={layout.navElement} type={"banner"} layout={layout.layout} UILayout={this.state.UILayout} index={index} previewRecord={this.state.previewRecord} />,this.renderDiv)
		}
	},
	shouldComponentUpdate: function(nextProps, nextState) {
  		return (JSON.stringify(this.state)!= JSON.stringify(nextState));
	},
	cancel:function(){
		ReactDOM.unmountComponentAtNode(this.renderDiv);
		$(this.editData).removeClass("hidden");
		$(this.saveSection).removeClass("hidden");
		//this.editData.className=this.editData.className.replace("hidden","");
		//this.saveSection.className=this.editData.className.replace("hidden","");
	},
	saveSectionDetail:function(layout,index,navElement,type,objRef,css,imgType,relRefViews,systemRelations){
		var self=this;
		if(typeof layout=="string"){
			if(layout=="delete"){
				this.deleteLayout(index);
				this.forceUpdate();
			}else{
			}
		}else{
			var UILayout=this.state.UILayout;
			if(UILayout[index]!=undefined || index==UILayout.length){
				if(index==UILayout.length){
					UILayout[index]={};	
					UILayout[index].type=type;
				}
				UILayout[index].layout=layout;
				if(navElement!="" && navElement!=undefined && typeof navElement=="string"){
					UILayout[index].navElement=navElement;
				}
				if(objRef!="" && objRef!=undefined && Object.keys(objRef).length>0){
					UILayout[index].objectDataViews=objRef;
				}
				if(css!="" && css!=undefined && Object.keys(css).length>0){
					UILayout[index].css=css;
				}
				if(imgType!="" && imgType!=undefined && Object.keys(imgType).length>0){
					UILayout[index].imgDisplay=imgType;
				}
				if(relRefViews!="" && relRefViews!=undefined && Object.keys(relRefViews).length>0){
					UILayout[index].relRefViews=relRefViews;
				}
				if(systemRelations!="" && systemRelations!=undefined){
					if(type=="banner"){
						UILayout[index].systemRelations=systemRelations;
					}
					else{
						UILayout[index].showDisplayNames=systemRelations;
					}
				}
				this.setState({UILayout:UILayout},function(){
					self.forceUpdate();
				});
			}
		}
		try{
			ReactDOM.unmountComponentAtNode(this.renderDiv);
		}catch(err){
			console.log("render Node not available")
		}
		$(this.editData).removeClass("hidden")
		$(this.saveSection).removeClass("hidden")
	},
	_onChange:function(){
		this.setState({previewRecord:DefinitionStore.getDefinition("PreviewRecord")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	componentDidMount:function(){
		ActionCreator.getDefinition("PreviewRecord");
		DefinitionStore.addChangeListener(this._onChange);
	},
	addSection:function(){
		this.editData.className+=" hidden"; 
		this.saveSection.className+=" hidden"; 
		$('html,body').scrollTop(0);
		
		if(this.props.outProperties && this.props.outProperties.length>0){
			outProperties=this.props.outProperties;
		}else if(this.props.fullSchema["@operations"]["read"][this.props.layDesign].out && this.props.fullSchema["@operations"]["read"][this.props.layDesign].out.length >0){
			outProperties=	this.props.fullSchema["@operations"]["read"][this.props.layDesign].out;
		}
		ReactDOM.render(<SelectSectionForDetail  cancel={this.cancel} fullSchema={this.props.fullSchema} outProperties={outProperties} callback={this.saveSectionDetail} index={this.state.UILayout.length} previewRecord={this.state.previewRecord} />,this.renderDiv)
	},
	saveLayout:function(){
		var newSchema=this.props.fullSchema;
		if(this.props.newLayout){
			if(typeof newSchema["@operations"]!="object"){
				newSchema["@operations"]={}
			}
			if(typeof newSchema["@operations"]["read"]!="object"){
				newSchema["@operations"]["read"]={}
			}
			newSchema["@operations"]["read"][this.props.layDesign]={
																"UILayout":this.state.UILayout,
																"in":"id",
																"out":this.props.outProperties
															}

		}
		else{
			newSchema["@operations"]["read"][this.props.layDesign].UILayout=this.state.UILayout;  		
  		}
  		$(".deleteIcon").click();
  		this.props.callback(newSchema);
	},
	render:function(){
		var fullSchema=this.props.fullSchema;
		var layDesign=this.props.layDesign;
		console.log(this.state)
		var outProperties=[];
		var self=this;
		if(this.props.outProperties && this.props.outProperties.length>0){
			outProperties=this.props.outProperties;
		}else if(this.props.fullSchema["@operations"]["read"][this.props.layDesign].out && this.props.fullSchema["@operations"]["read"][this.props.layDesign].out.length >0){
			outProperties=	this.props.fullSchema["@operations"]["read"][this.props.layDesign].out;
		}
		if(this.state.previewRecord && Object.keys(this.state.previewRecord).length >0 && Array.isArray(this.state.UILayout) ){
			return (<div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.editData=e}}>
						{
							this.state.UILayout.map(function(layout,index){
								
								if(layout.type=="generic"){
									var navElement=layout.navElement!=undefined?"":"hidden";
									return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component margin-bottom-gap">
												<div className="col-lg-11 col-md-11 col-sm-11 col-xs-10 " style={{"border": "1px solid #e9e9e9"}}>
													<h5 className={navElement+" profilehover remove-margin-bottom"}>Section Name : {layout.navElement}</h5>													
													<GenericPreview imgDisplay={layout.imgDisplay} previewRecord={self.state.previewRecord} navELement={layout.navElement} fullSchema={fullSchema} type={"generic"} layout={layout.layout} outProperties={outProperties} />
												</div>
												<div className="col-lg-1 col-md-1 col-sm-1 col-xs-2 no-padding-right">&nbsp;&nbsp;
													<div className="fa-pencil fa   margin-bottom-gap margin-top-gap  link" onClick={self.editLayout.bind(null,layout,index)}></div>
													<div className="icons8-delete fa-2x link" onClick={self.deleteLayout.bind(null,index)}></div></div>
											</div>)
								}else if(layout.type=="columns"){
									var navElement=layout.navElement!=undefined?"":"hidden";
									return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component margin-bottom-gap">
												<div className="col-lg-11 col-md-11 col-sm-11 col-xs-10" style={{"border": "1px solid #e9e9e9"}}>
													<h5 className={navElement+" profilehover  remove-margin-bottom"}>Section Name : {layout.navElement}</h5>
													<GenericPreview  imgDisplay={layout.imgDisplay} previewRecord={self.state.previewRecord} navELement={layout.navElement} fullSchema={fullSchema} type={"columns"} layout={layout.layout} outProperties={outProperties} />
												</div>
												<div className="col-lg-1 col-md-1 col-sm-1 col-xs-2 no-padding-right">&nbsp;&nbsp;
													<div className="fa-pencil fa  margin-bottom-gap margin-top-gap  link" onClick={self.editLayout.bind(null,layout,index)}></div>
													<div className="icons8-delete  fa-2x  link" onClick={self.deleteLayout.bind(null,index)}></div></div>
											</div>)
								}else if(layout.type=="banner"){
									var navElement=layout.navElement!=undefined?"":"hidden";
									return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component margin-bottom-gap">
												<div className="col-lg-11 col-md-11 col-sm-11 col-xs-10 " style={{"border": "1px solid #e9e9e9"}}>
													<h5 className={navElement+" profilehover  remove-margin-bottom"}>Section Name : {layout.navElement}</h5>
													<BannerLayoutPreview systemRelations={layout.systemRelations} key={global.guid()} layout={layout.layout} navELement={layout.navElement} fullSchema={fullSchema} previewRecord={self.state.previewRecord} outProperties={outProperties} />
												</div>
												<div className="col-lg-1 col-md-1 col-sm-1 col-xs-2 no-padding-right">&nbsp;&nbsp;
													<div className="fa-pencil fa  margin-bottom-gap margin-top-gap link" onClick={self.editLayout.bind(null,layout,index)}></div>
													<div className="icons8-delete  fa-2x  link" onClick={self.deleteLayout.bind(null,index)}></div></div>
											</div>)
								}else if(layout.type=="tabs"){
									var navElement=layout.navElement!=undefined?"":"hidden";
									return (<div  key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component margin-bottom-gap">
												<div className="col-lg-11 col-md-11 col-sm-11 col-xs-10 " style={{"border": "1px solid #e9e9e9"}}>
													<h5 className={navElement+" profilehover  remove-margin-bottom"}>Section Name : {layout.navElement}</h5>
													<TabPreview  imgDisplay={layout.imgDisplay} layout={layout.layout} navElement={layout.navElement} outProperties={outProperties} previewRecord={self.state.previewRecord} fullSchema={fullSchema} />
												</div>
												<div className="col-lg-1 col-md-1 col-sm-1 col-xs-2 no-padding-right">&nbsp;&nbsp;
													<div className="fa-pencil fa   margin-bottom-gap margin-top-gap link" onClick={self.editLayout.bind(null,layout,index)}></div>
													<div className="icons8-delete  fa-2x  link" onClick={self.deleteLayout.bind(null,index)}></div>
												</div>
											</div>)
								} 
							},this)
						}
						</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" ref={(e)=>{this.renderDiv=e}}>
						
						</div>
						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" ref={(e)=>{this.saveSection=e}}>
							<button className=" btn upload-drop-zone" onClick={this.addSection}>ADD SECTION</button>
							<button className=" btn upload-drop-zone pull-right" onClick={this.saveLayout}>SAVE LAYOUT</button>
						</div>
					</div>)
		}else{
			return (<div className="hidden"></div>)
		}
	}
})
exports.EditLayoutForDetail=EditLayoutForDetail;

/***
 * fullSchema
 * outProperties
 * callback
 * index
 * previewRecord
 */

var SelectSectionForDetail=React.createClass({
	select:function(section){
		this.section.innerHTML=section;
		var layout=[];
		if(section=="Generic"){
			ReactDOM.render(<EditGenericPreview  fullSchema={this.props.fullSchema} cancel={this.props.cancel} type={"generic"} outProperties={this.props.outProperties} callback={this.props.callback} navElement={undefined} layout={layout} index={this.props.index} previewRecord={this.props.previewRecord} />,this.newSection)
		}else if(section=="Columns"){
			ReactDOM.render(<EditGenericPreview  fullSchema={this.props.fullSchema} cancel={this.props.cancel} outProperties={this.props.outProperties} callback={this.props.callback}  type={"columns"} navElement={undefined} layout={layout} index={this.props.index} previewRecord={this.props.previewRecord} />,this.newSection)
		}else if(section=="Tabs"){
			layout={};
			ReactDOM.render(<TabPreview  fullSchema={this.props.fullSchema} cancel={this.props.cancel} outProperties={this.props.outProperties} callback={this.props.callback} navElement={layout.navElement} type={"tabs"} layout={layout} edit={"edit"} index={this.props.index} previewRecord={this.props.previewRecord} />,this.newSection)
		}else if(section=="Banner"){
			layout={};
			ReactDOM.render(<BannerLayoutPreview   cancel={this.props.cancel} css={(layout.css!=undefined)?layout.css:undefined} objectDataViews={(layout.objectDataViews!=undefined)?layout.objectDataViews:undefined}  fullSchema={this.props.fullSchema} edit={"edit"} outProperties={this.props.outProperties} callback={this.props.callback} navElement={layout.navElement} type={"banner"} layout={layout} index={this.props.index} previewRecord={this.props.previewRecord} />,this.newSection)
		}
	},
	render:function(){
		var self=this;
		var sections=["Generic","Columns","Tabs","Banner"];
		return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap-sm" >
			   			<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
			   				<span  ref={(e)=>{this.section=e}} data-bind="label">Select The Type of Section</span>
			   			</button>
			   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
					   		{
					   			sections.map(function(section){
					   				return(<li key={global.guid()} ><span onClick={self.select.bind(null,section)}>{section}</span></li>)
					   			},this)
					   		}
			   			</ul>
			   			<h5 ref={(e)=>{this.errorMsg=e}} className="hidden" style={{"color":"red"}}>Please select the field completely with all the required options checked  or picked </h5>
			   		</div>
			   		<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.newSection=e}}>
			   		
			   		
			   		</div>
				   		
				</div>)
	}
})
/***
 * 	layout
 * 	index
 * 	previewRecord
 * 	fullSchema
 * 	callback
 * 	outProperties
 */

var EditGenericPreview=React.createClass({
	getInitialState:function(){
		return {layout:JSON.parse(JSON.stringify(this.props.layout)),objectDataViews:(this.props.objectDataViews!=undefined && Object.keys(this.props.objectDataViews).length>0)?JSON.parse(JSON.stringify(this.props.objectDataViews)):undefined,css:(this.props.css!=undefined && Object.keys(this.props.css).length>0)?(this.props.css):{},navElement:this.props.navElement,imgType:(this.props.imgType!=undefined && Object.keys(this.props.imgType).length>0)?(JSON.parse(JSON.stringify(this.props.imgType))):{},
			relRefViews:(this.props.relRefViews!=undefined && Object.keys(this.props.relRefViews).length>0)?JSON.parse(JSON.stringify(this.props.relRefViews)):undefined,
			showDisplayNames:"Yes"
			};
	},
	componentWillReceiveProps: function(nextProps) {
		this.forceUpdate();
	},
	deleteProperty:function(property,index){
		var layout=this.state.layout;
		if(this.props.type=="columns"){
			if(layout[index].indexOf(property)!=-1){
				delete layout[index][layout[index].indexOf(property)]
				layout[index] = layout[index].filter(function(n){ return (n != "" && n!= undefined)});
				this.setState({layout:layout});
			}
		}else{
			if(layout.indexOf(property)!=-1){
				delete layout[layout.indexOf(property)];
				layout = layout.filter(function(n){ return (n != "" && n!= undefined)});
				this.setState({layout:layout});
			}
		}
	},
	callback:function(){
			this.props.callback(this.state.layout,this.props.index,this.state.navElement,this.props.type,this.state.objectDataViews,this.state.css,this.state.imgType,this.state.relRefViews,this.state.showDisplayNames);
	},
	cancel:function(){
		this.props.cancel();
	},
	saveValue:function(property,objRef,cssSelected,index,imgTypeSelected,relRefView){
		var data=[];
		var self=this;
		if(this.props.type=="columns"){
			data=this.state.layout;
		}else{
			data.push(this.state.layout);
		}
		var flag=true;
		data.map(function(innerData){
			if(typeof property=="object" && data.length >0){
				innerData.map(function(selectedProperty,index){
					if(typeof selectedProperty=="object" && JSON.stringify(selectedProperty)==JSON.stringify(property)){
							flag=false;
					}
				})
			}else if(data.indexOf(property)!=-1){
				flag=false;
			}
	  	})
	  	var objectDataViews=(this.state.objectDataViews!=undefined && Object.keys(this.state.objectDataViews).length>0)?this.state.objectDataViews:{};
  		if(objRef!="" && objRef!=undefined){
  			objectDataViews[property]=objRef;
  		}
  		var css=(this.state.css!=undefined && Object.keys(this.state.css).length>0)?this.state.css:{};
  		if(cssSelected!=undefined){
  			if(typeof property=="object"){
  				css[Object.keys(property)[0]]=cssSelected;
  			}else{
  				css[property]=cssSelected;
  			}
  		}
  		
  		var imgTypes=(this.state.imgType!=undefined && Object.keys(this.state.imgType).length>0)?this.state.imgType:{};
  		if(imgTypeSelected!=undefined){
  			if(typeof property=="object"){
  				imgTypes[Object.keys(property)[0]]=imgTypeSelected;
  			}else{
  				imgTypes[property]=imgTypeSelected;
  			}
  		}
  		
  		var relRefViews=(this.state.relRefViews!=undefined && Object.keys(this.state.relRefViews).length>0)?this.state.relRefViews:{};
  		if(relRefView!=undefined){
  			relRefViews[Object.keys(relRefView)[0]]=relRefView[Object.keys(relRefView)[0]]
  			//Object.values(relRefView)[0];
  		}
  		
		if(flag){
			var temp=this.state.layout;
			if(this.props.type=="columns"){
				temp[index].push(property);
			}else{
				temp.push(property);
			}
			console.log(css)
			this.setState({layout:temp,objectDataViews:objectDataViews,css:css,imgType:imgTypes,relRefViews:relRefViews},function(){
				if(self.props.type=="tabs"){
					self.props.callback(self.state.layout,self.state.objectDataViews,self.state.css,self.props.index,self.state.imgType,self.state.relRefViews);
				}	
			});
		}
	},
	delColumn:function(index){
		var flag=true;
		if(this.props.type=="columns"){
			var layout=this.state.layout;
			delete layout[index];
			layout = layout.filter(function(n){ return (n != "" && n!= undefined)});
			if(layout.length>0){
				flag=false;
				this.setState({layout:layout});
			}
		}
		if(flag){
			if(this.props.type=="tabs"){
				this.props.callback("delete",this.state.objectDataViews,this.state.css,this.props.index);
			}else{
				this.props.callback("delete",this.props.index,this.state.navElement);
			}
		}
	},
	addingData:function(index){
		manageSchemaNew.getPopupContent("Select Property Type ","");
    	ReactDOM.render(<PropertySelection  detail={"detail"} imgType={this.state.imgType} css={this.state.css} index={index} callback={this.saveValue} objRef={this.state.objectDataViews}  fullSchema={this.props.fullSchema} outProperties={this.props.outProperties}  />,document.getElementById('genericPopupBody'))
	},
	addCol:function(){
		var layout=this.state.layout;
		if(layout.length<4){
			var temp=[];
			layout.push(temp);
			this.setState({layout:layout});
		}else{
			alert("Max 4 columns are allowed")
		}
	},
	changeNavElement:function(){
		this.navElement.className+=" hidden";
		$(this.navElementEdit).removeClass("hidden");
		//this.navElementEdit.className=this.navElementEdit.className.replace("hidden","");
	},
	setNavElement:function(){
		var self=this;
		var navElement=$("input[name='navElement']").val();
		this.setState({navElement:navElement},function(){
			self.cancelNavElement();
		});
	},
	showDisplayNames:function(){
		var self=this;
		var value=$("input[name='showDisplayNames']:checked").val();
		this.setState({showDisplayNames:value},function(){
			
		})
	},
	cancelNavElement:function(){
		this.navElementEdit.className+=" hidden";
		$(this.navElement).removeClass("hidden");
		//this.navElement.className=this.navElement.className.replace("hidden","");
	},
	componentDidMount:function(){
		if($("input[value='"+this.state.showDisplayNames+"']"))
		$("input[value='"+this.state.showDisplayNames+"']").click();
	},
	render:function(){
		var layout=[];
		var self=this;
		if(this.props.type!="columns"){
			layout.push(this.state.layout);
		}else{
			layout=this.state.layout;
		}
		var divType=calculateCols(layout.length);
		return(<div ref={(e)=>{this.renderDiv=e}}>
					{
						["a"].map(function(temp){
							if(self.props.type!="tabs"){
								return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{this.navElement=e}}>
											<h5 className=""  style={{"display":"inline-block"}}>{(self.state.navElement!=undefined && self.state.navElement!="")?self.state.navElement:""}</h5>
											<button className="upload-btn extra-padding" style={{"display":"inline-block"}} onClick={self.changeNavElement}>{(self.state.navElement!=undefined && self.state.navElement!="")?"Edit Section Name":"Add Section Name"}</button>
										</div>)
							}else{
								return(<div key={global.guid()} className="hidden"></div>)
							}
						})
					}
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component">
						SHOW DISPLAY NAME FOR PROPERTIES								 
					 	<input type="radio" name="showDisplayNames" value="Yes" onClick={this.showDisplayNames}/>
					 	<span>&nbsp;&nbsp;</span>
						<span className="fieldText no-padding-left ">Yes</span>
						<span>&nbsp;&nbsp;</span>
						<input type="radio" name="showDisplayNames" value="No"  onClick={this.showDisplayNames} />
						<span >&nbsp;</span>
						<span className="fieldText no-padding-left ">No</span>
		           </div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" ref={(e)=>{this.navElementEdit=e}}>
						<div className="col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding">
							<input key={global.guid()} type="text" name="navElement" className="form-control" placeholder="Enter The NavElement " />
						</div>
						<button className="upload-btn extra-padding mobile-no-padding" style={{"display":"inline-block"}} onClick={this.setNavElement}>OK</button>
						<button className="upload-btn extra-padding" style={{"display":"inline-block"}} onClick={this.cancelNavElement}>Cancel</button>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" >
						<h5 className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">EDIT THE PROPERTIES IN SECTION </h5>
						{
							layout.map(function(innerLayout,index){
								return (<div key={global.guid()} className={divType}>
											{
												innerLayout.map(function(property){
													return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component">
																<div className="child-img-component" style={{"display":"inline-block"}}>{property}</div>
																<div className="child-img-component" style={{"display":"inline-block"}}>
																	<span className="icons8-delete  fa-2x  link" onClick={self.deleteProperty.bind(null,property,index)} />
																</div>
															</div>)												
												},this)	
											}
											<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-top-gap-sm" ref={(e)=>{this.delCol=e}}>
												<button className="btn action-button" onClick={self.delColumn.bind(null,index)}>{self.props.type=="columns"?"DELETE COLUMN":"DELETE SECTION"}</button>
											</div>
											<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-top-gap-sm" ref={(e)=>{this.addData=e}}>
												<button className="btn action-button" onClick={self.addingData.bind(null,index)}>Add Data</button>
											</div>
										</div>)
							},this)
						}
					</div>
					<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-top-gap">
						{
							["a"].map(function(temp){
								if(self.props.type=="columns"){
									return <button key={global.guid()} className={" btn upload-drop-zone margin-bottom-gap"} onClick={self.addCol}>ADD COLUMN</button>
								}else{
									return(<div key={global.guid()} className="hidden"></div>)
								}
							},this)
						}
						{
							["a"].map(function(temp){
								var addCol="hidden"
								if(self.props.type!="tabs"){
									return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
												<button className={" btn upload-drop-zone pull-right "} onClick={self.callback}>SAVE SECTION</button>
												<button className={" btn upload-drop-zone pull-left "} onClick={self.cancel}>CANCEL</button>
											</div>)
								}else{
									return(<div key={global.guid()} className="hidden"></div>)
								}
							},this)
						}
					</div>	
							
				</div>)
	}
})

/**
 * layout 
 * navELement 
 * outProperties 
 * previewRecord 
 * fullSchema
 */
var TabPreview=React.createClass({
	getInitialState:function(){
		return {layout:JSON.parse(JSON.stringify(this.props.layout)),navElement:this.props.navElement,objectDataViews:(this.props.objectDataViews!=undefined && Object.keys(this.props.objectDataViews).length>0)?JSON.parse(JSON.stringify(this.props.objectDataViews)):undefined,css:(this.props.css!=undefined && (this.props.css).length>0)?(this.props.css):undefined,imgType:(this.props.imgType!=undefined && this.props.imgType.length>0)?(JSON.parse(JSON.stringify(this.props.imgType))):undefined,relRefViews:(this.props.relRefViews!=undefined && this.props.relRefViews.length>0)?(JSON.parse(JSON.stringify(this.props.relRefViews))):undefined}
	},
	showTab:function(tab,layout){
		var self=this;
			Object.keys(layout).map(function(key,index){ 
				if(key!=tab.key){
					(self[key+index+"$"]).className="hidden";
					(self[key+"tab"]).className="";
				}else{
					(self[key+index+"$"]).className="";
					(self[key+"tab"]).className="tab-view";
				}
			})
	},
	changeNavElement:function(){
		this.navElement.className+=" hidden";
		$(this.navElementEdit).removeClass("hidden");
		//this.navElementEdit.className=this.navElementEdit.className.replace("hidden","");
	},
	setNavElement:function(){
		var self=this;
		var navElement=$("input[name='navElement']").val();
		this.setState({navElement:navElement},function(){
			self.cancelNavElement();
		});
	},
	cancelNavElement:function(){
		this.navElementEdit.className+=" hidden";
		$(this.navElement).removeClass("hidden");
		//this.navElement.className=this.navElement.className.replace("hidden","");
	},
	componentWillReceiveProps: function(nextProps) {
		var self=this;
		this.setState({layout:JSON.parse(JSON.stringify(nextProps.layout))},function(){
			self.forceUpdate();
		});
	},
	componentDidMount:function(){
		this.tabCheck();
	},
	componentDidUpdate:function(){
		this.tabCheck();
	},
	tabCheck:function(){
		var self=this;
		Object.keys(this.state.layout).map(function(key,index){ 
			if(index!=0){
				self[key+index+"$"].className+=" hidden";
				self[key+"tab"].className="";
			}else{
				(self[key+index+"$"]).className="";
				(self[key+"tab"]).className+=" tab-view";
			}
		})
	},
	newTab:function(layout){
		var self=this;
		this.setState({layout:layout},function(){
				$(".modal").click();
				self.tabCheck();
		});
	},
	addTab:function(){
		manageSchemaNew.getPopupContent("Add New Tab","");
    	ReactDOM.render(<AddNewTab  layout={this.state.layout} callback={this.newTab}  />,document.getElementById('genericPopupBody'))
	},
	saveValue:function(tabData,objDataViews,css,index,imgType,relRefViews){
		var layout={};
		if(this.state.layout!="" && this.state.layout.length==undefined && !Array.isArray(this.state.layout)){
			layout=this.state.layout;
		}
		var flag=false;
		if(typeof tabData=="string"){
			//delete the tab
			if(Object.keys(layout)[index]!=undefined){
				var temp=Object.keys(layout)[index];
				delete layout[temp];
				flag=true;
			}
		}
		else if(layout[Object.keys(layout)[index]]!=undefined && layout[Object.keys(layout)[index]]["properties"]!=undefined){
			if(layout[Object.keys(layout)[index]].objDataViews!=undefined){
				Object.assign(objDataViews,layout[Object.keys(layout)[index]].objDataViews);
			}
			if(layout[Object.keys(layout)[index]].css!=undefined){
				Object.assign(css,layout[Object.keys(layout)[index]].css);
			}
			if(layout[Object.keys(layout)[index]].imgDisplay!=undefined){
				Object.assign(imgType,layout[Object.keys(layout)[index]].imgDisplay);
			}
			Object.assign(layout[Object.keys(layout)[index]],{
													"properties":tabData,
													"objDataViews":objDataViews,
													"css":css,
													"imgDisplay":imgType,
													"relRefViews":relRefViews
													
												})
			flag=true;
		}else{
			Object.assign(layout[Object.keys(layout)[index]],{
													"properties":tabData,
													"objDataViews":objDataViews,
													"css":css,
													"imgDisplay":imgType,
													"relRefViews":relRefViews
												})
			flag=true;
		}
		if(flag){
			this.setState({layout:layout})
		}
	},
	callback:function(cancel){
		//layout,index,navElement,type,objRef,css
		//saveSection:function(layout,index,navElement,type,objRef,css){
			if(cancel=="cancel"){
					this.props.cancel();
			}else{
				this.props.callback(this.state.layout,this.props.index,this.state.navElement,"tabs",this.state.ObjDataViews,this.state.css,this.state.relRefViews);
			}
	},
	render:function(){
		var self=this;
		if(Object.keys(this.state.layout).length >0){
			var tabs=[];		
			var layout=this.state.layout;
			Object.keys(layout).map(function(key){
				tabs.push({"value":layout[key].displayName!=undefined?layout[key].displayName:key,"key":key});
			})
			var divLength=12/(tabs.length);
			var tabCol="col-lg-"+divLength+" col-md-"+(divLength < 4 ?"4": divLength)+" col-sm-"+Math.round(((3/2)*divLength))+" col-xs-12 no-padding";
			return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
						
						{
							["a"].map(function(temp){
								if(self.props.edit=="edit"){
			 						return(<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm">
				 								<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" ref={(e)=>{self.navElement=e}}>
													<h5 className=""  style={{"display":"inline-block"}}>{(self.state.navElement!=undefined && self.state.navElement!="")?self.state.navElement:""}</h5>
													<button className="upload-btn extra-padding" style={{"display":"inline-block"}} onClick={self.changeNavElement}>{(self.state.navElement!=undefined && self.state.navElement!="")?"Edit Section Name":"Add Section Name"}</button>
												</div>
												<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding hidden" ref={(e)=>{self.navElementEdit=e}}>
													<div className="col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding">
														<input key={global.guid()} type="text" name="navElement" className="form-control" placeholder="Enter The NavElement " />
													</div>
													<button className="upload-btn extra-padding mobile-no-padding" style={{"display":"inline-block"}} onClick={self.setNavElement}>OK</button>
													<button className="upload-btn extra-padding" style={{"display":"inline-block"}} onClick={self.cancelNavElement}>Cancel</button>
												</div>
											</div>)
			 					}else{
			 						return (<div key={global.guid()} className="hidden"/>)
			 					}
			 				})
		 				}
						<div  ref={(e)=>{this.line=e}}>
							{
								tabs.map(function(tab,index){
									if(index ==0){
										return (<div  key={global.guid()} ref={(e)=>{self[tab.key]=e}} key={global.guid()} className="display-inline-block">
													<h5 onClick={self.showTab.bind(self,tab,layout)} className="pointer no-margin extra-padding-bottom-pin"  ><span ref={(e)=>{self[tab.key+"tab"]=e}}>{tab.value.toUpperCase()}</span></h5>
												</div>)
									}else{
										return (<div  key={global.guid()} ref={(e)=>{self[tab.key]=e}} key={global.guid()} className="display-inline-block extra-padding">
													<h5 onClick={self.showTab.bind(self,tab,layout)} className="pointer no-margin extra-padding-bottom-pin"  ><span ref={(e)=>{self[tab.key+"tab"]=e}}>{tab.value.toUpperCase()}</span></h5>
												</div>)
									}
								})
							}
							{
				 				["a"].map(function(temp){
				 					if(self.props.edit=="edit"){
				 						return(<div key={global.guid()} className="display-inline-block">
				 									<button className="upload-btn extra-padding" onClick={self.addTab}>ADD NEW TAB</button>
											   </div>)
				 								
				 					}else{
				 						return (<div key={global.guid()} className="hidden"/>)
				 					}
				 				})
				 			}
							
						</div>
						<div className="row no-margin">
						{
							Object.keys(layout).map(function(tab,index){
								if(layout[tab].properties ){
									return(<div key={global.guid()} ref={(e)=>{self[tab+index+"$"]=e}}  key={global.guid()}>
											 <h6>{layout[tab].displayName!=undefined?layout[tab].displayName:tab} TabData:</h6>
								 			{
								 				["a"].map(function(temp){
								 					if(self.props.edit=="edit"){
								 						return(<EditGenericPreview key={global.guid()} type={"tabs"} fullSchema={self.props.fullSchema} outProperties={self.props.outProperties} callback={self.saveValue} navElement={self.props.navElement} css={(layout[tab].css!=undefined)?layout[tab].css:undefined} objectDataViews={(layout[tab].objectDataViews!=undefined)?layout[tab].objectDataViews:undefined} relRefViews={(layout[tab].relRefViews!=undefined)?layout[tab].relRefViews:undefined} layout={layout[tab].properties} UILayout={self.props.UILayout} index={index} previewRecord={self.props.previewRecord} />)
								 								
								 					}else{
								 						return (<GenericPreview key={global.guid()} previewRecord={self.props.previewRecord}  imgDisplay={self.props.imgDisplay} navElement={undefined} fullSchema={self.props.fullSchema} type={"generic"} layout={layout[tab].properties} outProperties={self.props.outProperties} />)
								 					}
								 				})
								 			}
								 			</div>);
									}else{
										return(<div key={global.guid()} className="hidden"></div>)
									}
							})
						}
						</div>	
						{
							["a"].map(function(temp){
								if(self.props.edit=="edit"){
									return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
												<button className={" btn upload-drop-zone pull-right "} onClick={self.callback}>SAVE SECTION</button>
												<button className={" btn upload-drop-zone pull-left "} onClick={self.callback.bind(null,"cancel")}>CANCEL</button>
											</div>)
								}else{
									return(<div key={global.guid()} className="hidden"></div>)
								}			
							},this)
						}
					</div>)
		}else{
			return(<div  key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
					{
		 				["a"].map(function(temp){
		 					if(self.props.edit=="edit"){
		 						return(<div key={global.guid()} className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
		 								<div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding margin-bottom-gap">
		 									<button className="upload-btn extra-padding" onClick={self.addTab}>ADD NEW TAB</button>
		 								</div>
		 								<div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding">
		 									<button className="btn upload-drop-zone" onClick={self.props.cancel}>CANCEL</button>
		 									<button className={" btn upload-drop-zone pull-right "} onClick={self.callback}>SAVE SECTION</button>
		 								</div>
									   </div>)
		 								
		 					}else{
		 						return (<div className="hidden"/>)
		 					}
		 				})
		 			}
					</div>)
		}
	}
})


/***
 *
 *  
 */
var AddNewTab=React.createClass({
	addTab:function(){
		this.errorMsg.className="no-margin hidden";
		var flag=true;
		var self=this;
		if($("input[name='newTab']").val()!="" && $("input[name='newTab']").val()!=undefined){
			//check whether the same tab exist or not
			var layout=this.props.layout;
			Object.keys(layout).map(function(tab){
				if(tab.toLowerCase()==$("input[name='newTab']").val().toLowerCase()){
					self.errorMsg.className="no-margin";
					self.errorMsg.innerHTML="Name Already Exists";
					flag=false;
				}else{
					
				}
			})
			if(flag){
				var tabName=$("input[name='newTab']").val();
				var newTab={
					"properties":[],
					"displayName":tabName
				}
				layout[tabName]=newTab;
				self.props.callback(layout);
			}
		}else{
			this.errorMsg.className="no-margin";
			this.errorMsg.innerHTML="Enter Valid Data";	
		}
	},
	render:function(){
		return(	<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap-sm">
						<label>Display Name</label>
						<input key={global.guid()} type="text" placeholder="Enter the display name for the tab " className="form-control" name="newTab"/>
						<h6 ref={(e)=>{this.errorMsg=e}} className="no-margin hidden" style={{"color":"red"}}>Enter Valid Data</h6>
					</div>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						<button onClick={this.addTab} className="btn upload-drop-zone pull-right">ADD TAB</button>
					</div>
				</div>)
	}
})


/***
 *
 *  
 * callback
 * objRef
 * css
 * outProperties
 * fullSchema
 * 
 */
var PropertySelection=React.createClass({
	getInitialState:function(){
		return {actions:[],relations:[],showRelated:[],uniqueActions:[],objectDataViews:{},css:{},groupBy:{}}
	},
	componentDidMount:function(){
		var relations={};
		var actions=[];
		var uniqueActions=[];
		var showRelated=[];
		var groupBy=[];
		var schema=this.props.fullSchema;
		if(schema["@operations"] ){
			if(schema["@operations"].update){
				actions=actions.concat(Object.keys(schema["@operations"].update));
			}
            if(schema["@operations"].delete){
                actions=actions.concat(Object.keys(schema["@operations"].delete));
            }
            if(schema["@operations"].actions){
                actions=actions.concat(Object.keys(schema["@operations"].actions));
            }
            if(schema["@operations"].relations && Object.keys(schema["@operations"].relations).length >0){
            	var tempData=[];
            	var tempRelRef={};
            	Object.keys(schema["@operations"].relations).map(function(rel){
            		tempData.push(schema["@operations"].relations[rel].relation)
            	})
               relations["data"]=tempData;//inserting the relations names
               
               tempData.map(function(relation){
               		if(schema["@relations"][relation] && schema["@relations"][relation]["relationRefSchema"]!=undefined){
               			tempRelRef[relation]=schema["@relations"][relation]["relationRefSchema"]
               		}
               })
               relations["relationRef"]=tempRelRef;//inserting the relation Ref schema names
            }
            if(schema["@showRealted"] && Object.keys(schema["@showRealted"]).length > 0){
            	showRelated=showRelated.concat(Object.keys(schema["@showRealted"]));
            }
          	if(schema["@superType"] && schema["@superType"]=="Organization"){
            	uniqueActions=uniqueActions.concat("uniqueUserName");
            }
            if(schema["@groups"] ){
            	groupBy=groupBy.concat(Object.keys(schema["@groups"]));
            }
            this.setState({actions:actions,relations:relations,showRelated:showRelated,uniqueActions:uniqueActions,groupBy:groupBy});
        } 
        if(actions.length ==0){
            	this["actionButton"].className+=" hidden"
            }
            if(showRelated.length ==0){
            	this["showRelated"].className+=" hidden"
            }
            if(relations==undefined || relations.data==undefined || Object.keys(relations.data).length ==0){
            	this["relationButton"].className+=" hidden"
            	this["relation"].className+=" hidden"
            }
            if(uniqueActions.length ==0){
            	this["unique"].className+=" hidden"
            }
             if(groupBy.length ==0){
            	this["groupBy"].className+=" hidden"
            }
	},
	addProperty:function(value){
		var data="";
		var relRef=undefined;
		if(value!="Property"){
			if(value=="Action Button"){
				data=this.state.actions;
			}else if(value=="Show Related"){
				data=this.state.showRelated;
			}else if(value=="Unique Action"){
				data=this.state.uniqueActions;
			}else if(value=="Group By"){
				data=this.state.groupBy;
			}else{
				data=this.state.relations.data;
				relRef=this.state.relations.relationRef;
			}
	    	ReactDOM.render(<OtherDataEdit value={value} relRef={relRef} callback={this.callback} data={data}  fullSchema={this.props.fullSchema} />,document.getElementById('genericPopupBody'));
    	}else{
    		ReactDOM.render(<PropertyEdit detail={this.props.detail} callback={this.callback} objRef={this.state.objectDataViews} css={this.state.css} outProperties={this.props.outProperties}  fullSchema={this.props.fullSchema}   />,document.getElementById('genericPopupBody'));
    	}
	},
	callback:function(temp,property,objRef,cssSelected,imgType,relRefView){
		this.props.callback(property,objRef,cssSelected,this.props.index,imgType,relRefView)
	},
	render:function(){
		return(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					<button className="upload-btn extra-padding form-group " onClick={this.addProperty.bind(null,"Property")}>Add Property</button>
					<button className="upload-btn extra-padding form-group" ref={(e)=>{this.actionButton=e}} onClick={this.addProperty.bind(null,"Action Button")}>Add Action Button</button>
					<button className="upload-btn extra-padding form-group" ref={(e)=>{this.relationButton=e}} onClick={this.addProperty.bind(null,"Relation Button")}>Add Relation Button</button>
					<button className="upload-btn extra-padding form-group" ref={(e)=>{this.relation=e}} onClick={this.addProperty.bind(null,"Relation")}>Add Related Records</button>
					<button className="upload-btn extra-padding form-group"  ref={(e)=>{this.showRelated=e}} onClick={this.addProperty.bind(null,"Show Related")}>Add Show Related Records</button>
					<button className="upload-btn extra-padding form-group" ref={(e)=>{this.unique=e}} onClick={this.addProperty.bind(null,"Unique Action")}>Add Unique Actions</button>
					<button className="upload-btn extra-padding form-group" ref={(e)=>{this.groupBy=e}} onClick={this.addProperty.bind(null,"Group By")}>Add Group By Records</button>
				</div>)
	}
})

/**
 *	previewRecord
 * 	fullSchema
 * 	type
 * 	layout
 */
var GenericPreview=React.createClass({
	componentWillReceiveProps: function(nextProps) {
		this.forceUpdate();
	},
	render:function(){
		var self=this;
		var layout=[];
		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"])
		if(this.props.type!="columns"){
			layout.push(this.props.layout);
		}else{
			layout=this.props.layout;
		}
		var divType=calculateCols(layout.length);
		
		return (<div className="margin-bottom-gap margin-top-gap col-lg-12 col-md-12 col-sm-12 col-xs-12">
			{
				layout.map(function(innerLayout){
						return (<div key={global.guid()} className={divType}>
									{
										innerLayout.map(function(property){
											
												if(typeof property=="object" || (property.indexOf("&")==-1 && property.indexOf("#")==-1 && property.indexOf("@")==-1 && property.indexOf("$")==-1 && property.indexOf("^")==-1 && property.indexOf("%")==-1)){
														if(typeof property =="object"){
															property=Object.keys(property)[0];
														}
														if(properties && properties[property] && properties[property]["dataType"].type && self.props.previewRecord && Object.keys(self.props.previewRecord).length >0){		  
															var value=(self.props.previewRecord[properties[property]["dataType"].type]!=undefined)?self.props.previewRecord[properties[property]["dataType"].type]:"Datatype value not in preview Record "+properties[property]["dataType"].type;
															if(properties[property]["dataType"].type=="images" || properties[property]["dataType"].type=="image"){
																	var flag=true;
																	if(self.props.imgDisplay!=undefined && self.props.imgDisplay[property]!=undefined){//if any imgDisplay selected
																		var dataImg=[];
																		value=self.props.previewRecord["carousel"];
																		if(self.props.imgDisplay[property]=="Slideshow"){
																			flag=false;
																			return (<div key={global.guid()} className={""}>
																						<h6 style={{"margin-bottom":"0px", "color":"rgb(192, 192, 192)"}}>
																							{
																								(properties[property].displayName!=undefined && properties[property].displayName!="")?properties[property].displayName:
																																		((properties[property].prompt!=undefined && properties[property].prompt!="")?
																																			properties[property].prompt:property)
																							}
																						</h6>
																						<div className={"col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding"}>
																							<ImageGallery 	images={value}	 />
																						</div>
																					</div>)		
																		}else if(self.props.imgDisplay[property]=="Carousel"){
																			flag=false;
																			return (<div key={global.guid()} className={"col-lg-4 col-md-4 col-sm-6 col-xs-12 no-padding"}>
																						<h6 style={{"margin-bottom":"0px", "color":"rgb(192, 192, 192)"}}>
																							{
																								(properties[property].displayName!=undefined && properties[property].displayName!="")?properties[property].displayName:
																																		((properties[property].prompt!=undefined && properties[property].prompt!="")?
																																			properties[property].prompt:property)
																							}
																						</h6>
													                                    <Carousel key={global.guid()}    type="slider"  fromCrousel={"yes"}  items={ value }   loadContent={self.loadContent}    showControls={true}    showStatus={true} />
													                                </div>)
																		}else if(self.props.imgDisplay[property]=="Grid"){
																			flag=false;
																			return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}>
																						<h6 style={{"margin-bottom":"0px", "color":"rgb(192, 192, 192)"}}>
																							{
																								(properties[property].displayName!=undefined && properties[property].displayName!="")?properties[property].displayName:
																																		((properties[property].prompt!=undefined && properties[property].prompt!="")?
																																			properties[property].prompt:property)
																							}
																						</h6>
																						{
																							value.map(function(img){
																								return(<div key={global.guid()} className="col-lg-6 col-md-6 col-sm-6 col-xs-6 form-group no-padding-left">
																											<img src={img.url} className="pull-left" style={{"height":"120px"}} />
																										</div>)
																							})
																						}
													                                </div>)
																		}																								
																	}
																	if(flag){
																		return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																					<h6 style={{"margin-bottom":"0px", "color":"rgb(192, 192, 192)"}}>
																						{
																							(properties[property].displayName!=undefined && properties[property].displayName!="")?properties[property].displayName:
																																	((properties[property].prompt!=undefined && properties[property].prompt!="")?
																																		properties[property].prompt:property)
																						}
																					</h6>
																					<img src={value[0].url} className="pull-left" style={{"height":"120px"}} />
																				</div>)
																	}else{
																		return(<div></div>)
																	}
															}else{
																var text=JSON.stringify(value);
																return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																		<h6 style={{"margin-bottom":"0px", "color":"rgb(192, 192, 192)"}}>
																			{(properties[property].displayName!=undefined && properties[property].displayName!="")?properties[property].displayName:
																														((properties[property].prompt!=undefined && properties[property].prompt!="")?
																															properties[property].prompt:property)}
																		</h6>
																		{text}
																		</div>)	
															}
													}else{
														return (<div key={global.guid()} className="hidden">{property}</div>)
													}		
												}else if(property.indexOf("#")==0){
													var value=property.replace("#","");
													return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																<input key={global.guid()}type='submit' className="action-button" value={value} />
															</div>)
												}else if(property.indexOf("^")==0){
													var value=property.replace("^","");
													return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																<button  className="upload-btn btn">{value}</button>
															</div>)
												}else if(property.indexOf("$")==0){
													var value=property.replace("&","");
													return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																{"Related Records Of "+value+" Schema"}
															</div>)
												}else if(property.indexOf("@")==0){
													var value=property.replace("@","");
													return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																{"Unique Action  "+value}
															</div>)
												}else if(property.indexOf("&")==0){
													var value=property.replace("&","");
													return (<div  key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																{"Show Related Records Of "+value}
															</div>)
												}else if(property.indexOf("%")==0){
													var value=property.replace("%","");
													return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group "}>
																{"Group By Records Of "+value}
															</div>)
												}else{
													return (<div key={global.guid()} className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding form-group hidden"}>
																
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

/**
 *	layoutSelected--selected layout (schema)
 * 	layDesign --(summary or detail)
 * 	fullSchema--- schema data
 *  callback
 */
var EditLayoutForSummary=React.createClass({
	render:function(){
		var fullSchema=this.props.fullSchema;
		var layDesign=this.props.layDesign;
		var UILayout=[];
		var outProperties=[];
		if(this.props.layoutSelected=="summary"){
			if( fullSchema["@views"] && fullSchema["@views"][0] && fullSchema["@views"][0].value && fullSchema["@views"][0].value.length>0){
					outProperties=	fullSchema["@views"][0].value;		
			}else{
				alert("Please Define the out properties for the summary View in schema")
			}
			UILayout[0]=fullSchema["@operations"]["read"][layDesign].UILayout;
		}else{
			if(fullSchema["@operations"]["read"][layDesign].out && fullSchema["@operations"]["read"][layDesign].out.length >0){
					outProperties=	fullSchema["@operations"]["read"][layDesign].out;
			}
			UILayout=fullSchema["@operations"]["read"][layDesign].UILayout;
		}
		var self=this;
		return(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					{
						UILayout.map(function(layout){
							if(layout.type){
								if(layout.type=="generic"){
									return (<GalleryLayoutPreview key={global.guid()} from={"schema"} columnCount={1} edit={"edit"} callback={self.props.callback} viewName={layDesign} outProperties={outProperties} data={layout.layout} fullSchema={self.props.fullSchema} objectDataViews={layout.objectDataViews} css={layout.css} />)	
								}else if(layout.type=="card"){
									return (<CardLayoutPreview from={"schema"} edit={"edit"} callback={self.props.callback} systemRelations={layout.systemRelations} viewName={layDesign} outProperties={outProperties} layout={layout.layout} fullSchema={self.props.fullSchema} objectDataViews={layout.objectDataViews} css={layout.css} />)
								}else if(layout.type=="gallery" ){
									return (<GalleryLayoutPreview key={global.guid()} from={"schema"} columnCount={layout.columnNo} edit={"edit"} callback={self.props.callback} viewName={layDesign} outProperties={outProperties} data={layout.layout} fullSchema={self.props.fullSchema} objectDataViews={layout.objectDataViews} css={layout.css} />)
								}else if(layout.type=="table" || layout.type=="sideByside"){
									return (<GalleryLayoutPreview key={global.guid()} from={"sideByside"} columnCount={1} edit={"edit"} callback={self.props.callback} viewName={layDesign} outProperties={outProperties} data={layout.layout} fullSchema={self.props.fullSchema} objectDataViews={layout.objectDataViews} css={layout.css}  />)
								}
							}
						})
					}
				</div>)
	}
})
exports.EditLayoutForSummary=EditLayoutForSummary;


/**
 * layout-->card layout data
 * fullSchema-->schema data
 * outProperties-->out properties available
 */

var PropertyEdit=React.createClass({
	getInitialState: function() {
	    return {savedProperty:(this.props.editField && this.props.layout && this.props.layout[this.props.editField] && this.props.layout[this.props.editField]!=undefined)?this.props.layout[this.props.editField]:"",objRef:(this.props.objRef!=undefined && Object.keys(this.props.objRef).length >0)?this.props.objRef:"",css:(this.props.css!=undefined && Object.keys(this.props.css).length >0)?this.props.css:{},imgType:this.props.imgType};
	},
	saveProperty:function(property,objRef,imgType){
		//saving the selected property and objRef is from AddObject
		this.setState({savedProperty:property,objRef:objRef,imgType:imgType})	
	},
	select:function(selectedProperty){
		var self=this;
		this["errorMsg"].className="hidden";
		if(selectedProperty!="None"){
			var properties=Object.assign({},this.props.fullSchema["@properties"]);
			Object.assign(properties,this.props.fullSchema["@sysProperties"]);
			var dataType=properties[selectedProperty]["dataType"]["type"];
			var flag=false;
			if(this.props.reqDataType!=undefined){
				if(this.props.reqDataType=="image"){
					if(dataType=="image" || dataType=="images"){
						flag=true;
					}else{
						this["errorMsg"].className="";	
					}
				}else if(this.props.reqDataType=="notImage"){
					if(dataType=="image" || dataType=="images"){
						this["errorMsg"].className="";
					}else{
						flag=true;
					}	
				}
			}else{
				flag=true;
			}
			if(flag){
				if((dataType=="images" || dataType=="image") ){
						$(".struct").remove();//deleting all the already existing struct preview
						$(".object").remove();
						this.property.innerHTML=selectedProperty;	
						if(this.props.detail=="detail"){
							this.image(selectedProperty);	
						}else{
							this.saveProperty(selectedProperty)
						}
				}else{
					if(dataType=="struct"){
						this.property.innerHTML=selectedProperty;	
						this.struct(selectedProperty);
						$(".struct").remove();
						$(".object").remove();//deleting all the already existing object preview
						this["errorMsg"].className="hidden"
					}else if(dataType=="object"){
						$(".struct").remove();
						this.object(selectedProperty);
						this.property.innerHTML=selectedProperty;	
						
					}else{
						$(".struct").remove();
						$(".object").remove();
						this.property.innerHTML=selectedProperty;	
						this.saveProperty(selectedProperty);//calling the save property function to set it in the state
					}
				}
			}
		}else{
			$(".struct").remove();
			this.property.innerHTML=selectedProperty;
			if(this.props.editField!=undefined){
				this.saveProperty(selectedProperty);
			}
		}
	},
	image:function(selectedProperty){
		var self=this;
		var node=document.createElement("div");
		node.id= global.guid();
        node.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 struct no-padding-left";
        self["errorMsg"].parentNode.appendChild(node);
		ReactDOM.render(<AddImage callback={self.saveProperty} property={selectedProperty} />,node)
	},
	selectCss:function(cssProperty){
		var self=this;
		this.css.innerHTML=cssProperty;
		this["errorCss"].className="hidden";
		$(".css").remove();
		var node=document.createElement("div");
		node.id= global.guid();
        node.className="col-lg-12 col-md-12/ col-sm-12 col-xs-12 css no-padding-left";
        this["errorCss"].parentNode.appendChild(node);
        this.setState({css:cssProperty})
		ReactDOM.render(<AddCssFileds cssFullData={common.getConfigDetails().branding} cssProperty={cssProperty} />,node)
	},
	object:function(selectedProperty,viewName){
		var self=this;
		var node=document.createElement("div");
		node.id= global.guid();
        node.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 struct no-padding-left";
      	var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
        var objData=undefined;
 		if(self.props.layout!=undefined){
	 		if(Array.isArray(self.props.layout)){
	 			objData=self.props.layout[selectedProperty];
	 		}else{
	 				objData=(self.props.editField && self.props.layout[self.props.editField] && self.props.layout[self.props.editField][selectedProperty])?self.props.layout[self.props.editField][selectedProperty]:undefined;		
	 		}	
	 	}
		 WebUtils.getMainSchema(properties[selectedProperty]["dataType"].objRef,function(result){
			self["errorMsg"].parentNode.appendChild(node);
			ReactDOM.render(<AddObject data={result} viewName={viewName} objData={objData} callback={self.saveProperty} property={selectedProperty} />,node)
	 	 	
		 })
	},
	struct:function(selectedProperty){
		var self=this;
		var node=document.createElement("div");
		node.id= global.guid();
        node.className="col-lg-12 col-md-12 col-sm-12 col-xs-12 struct no-padding-left";
        var structData=undefined;
	 	if(self.props.layout!=undefined){
	 		if(Array.isArray(self.props.layout)){
	 			structData=self.props.layout[selectedProperty];
	 		}else{
	 				structData=(self.props.editField && self.props.layout[self.props.editField] && self.props.layout[self.props.editField][selectedProperty])?self.props.layout[self.props.editField][selectedProperty]:undefined;		
	 		}	
	 	}
 		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
		 WebUtils.getMainSchema(properties[selectedProperty]["dataType"].structRef,function(result){
			self["errorMsg"].parentNode.appendChild(node);
			ReactDOM.render(<AddStructFields data={result} structData={structData} callback={self.saveProperty} property={selectedProperty} />,node)
			
		 })
		 
	},
	submitProperty:function(){
		if((Object.keys(this.state.css) && Object.keys(this.state.css).length>0) && this.state.savedProperty!="" && (this.css.innerHTML!="Select The Style" || (this.props.fullSchema["@properties"][this.state.savedProperty]["dataType"]["type"]=="images" || this.props.fullSchema["@properties"][this.state.savedProperty]["dataType"]["type"]=="image") )){
			$(".modal").click();
			var savedProperty=this.state.savedProperty;
			var css=this.state.css;
			if(this.state.savedProperty=="None"){ 
				savedProperty="";
				css=undefined;
			}
			this.props.callback(this.props.editField,savedProperty,this.state.objRef,css,this.state.imgType);
		}else if(this.state.savedProperty==""){
			this["errorMsg"].className="no-margin";
		}else{
			this["errorCss"].className="no-margin";
		}
	},
	componentDidMount:function(){
		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
		
		if(this.props.layout && this.props.editField && this.props.layout[this.props.editField]!=""){
			if(typeof this.props.layout[this.props.editField]=="object" && Object.keys(this.props.layout[this.props.editField]).length >0 ) {
				this.struct(Object.keys(this.props.layout[this.props.editField])[0]);
			}else if(this.props.layout[this.props.editField]!=undefined &&  properties[this.props.layout[this.props.editField]] && properties[this.props.layout[this.props.editField]]["dataType"].type=="object" && this.state.objRef){
				this.object(this.props.layout[this.props.editField],this.state.objRef[this.props.layout[this.props.editField]])
			}
		}
		if(this.state.savedProperty!=undefined && this.state.css[this.state.savedProperty]!=undefined){
			this.selectCss(this.state.css[this.state.savedProperty]);
		}
	},
	componentDidUpdate:function(){
		this["errorCss"].className="hidden";
	},
	render:function(){
		var outProperties=this.props.outProperties;
		if(outProperties.indexOf("None")==-1){
			outProperties.push("None");
		}
		var cssProperties=(common.getConfigDetails() && common.getConfigDetails().branding && Object.keys(common.getConfigDetails().branding).length >0)?Object.keys(common.getConfigDetails().branding):[];
		
		var self=this;
		var cssSelected="Select The Style";
		
		return(<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<div className="col-lg-6 col-md-6 col-xs-12 col-sm-12 no-padding-left">
							<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
					   			<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
					   				<span  ref={(e)=>{this.property=e}} data-bind="label">{(this.props.layout && this.props.editField && this.props.layout[this.props.editField]!=""  && this.props.layout[this.props.editField]!=undefined)?(typeof this.props.layout[this.props.editField]!="object"?this.props.layout[this.props.editField]:Object.keys(this.props.layout[this.props.editField])[0]):"Select Property"}</span>
					   			</button>
					   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
							   		{
							   			outProperties.map(function(outProperty){
							   				var pointerEvents="";
							   				if(self.props.editField==undefined && outProperty=="None"){
							   						pointerEvents="pointer-events";
							   				}
							   				return(<li key={global.guid()} className={pointerEvents}><span onClick={self.select.bind(null,outProperty)}>{outProperty}</span></li>)
							   			},this)
							   		}
					   			</ul>
					   		</div>
					   		<h5 ref={(e)=>{this.errorMsg=e}} className="hidden" style={{"color":"red"}}>Please select the field completely with all the required options checked  or picked </h5>
			   			</div> 
			   			<div className="col-lg-6 col-md-6 col-xs-12 col-sm-12 no-padding-left">
	   						<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
				   				<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
					   				<span  ref={(e)=>{this.css=e}} data-bind="label">{cssSelected}</span>
					   			</button>
					   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
							   		{
							   			cssProperties.map(function(cssProperty){
							   				return(<li key={global.guid()} ><span onClick={self.selectCss.bind(null,cssProperty)}>{cssProperty}</span></li>)
							   			},this)
							   		}
					   			</ul>
					   		</div>
					   		<h5 ref={(e)=>{this.errorCss=e}} className="hidden" style={{"color":"red"}}>Please select the style </h5>
			   			</div>
			   		</div>
				   	<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  margin-top-gap" >
				   		<label  className="pull-right">
							<input key={global.guid()} type='button' className="btn  upload-drop-zone pull-right" value='SAVE PROPERTY' onClick={this.submitProperty}/>
						</label>
					</div>
				
			</div>)
	}
	
	
})
/**
 * property
 * callback
 */
var AddImage=React.createClass({
	getInitialState:function(){
		return{imgTypes:["Slideshow","Carousel","Grid","Stack"]}
	},
	select:function(selectedImgType){
		var self=this;
		this.state.imgTypes.map(function(imgType){
			if(selectedImgType==imgType){
				self[imgType].className=self[imgType].className.replace("imgOptions","imgFill");
				self.props.callback(self.props.property,undefined,selectedImgType);
			}else{
				self[imgType].className=self[imgType].className.replace("imgFill","imgOptions")
			}
		})
	},
	render:function(){
		var self=this;
		return(	<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
				<h5 className="margin-top-gap-sm">Select the Image View</h5>
					{
						this.state.imgTypes.map(function(imgType){
							return (<div key={global.guid()} className="col-lg-6 col-md-6 col-sm-6 col-xs-6 form-group">
										<div className="col-lg-12 col-sm-12 col-md-12 col-xs-12 imgOptions" ref={(e)=>{self[imgType]=e}} onClick={self.select.bind(null,imgType)}>
											<img src={"./branding/"+imgType.toLowerCase()+".png"} />
											<h5 className="text-center">{imgType.toUpperCase()}</h5>
										</div>
									</div>)
						},this)
					}
				</div>)
	}
})


/**
 *cssFullData
 *
 * cssProperty 
 */
var AddCssFileds=React.createClass({
	shouldComponentUpdate: function(nextProps, nextState) {
  		return (JSON.stringify(this.props)!= JSON.stringify(nextProps));
	},
	componentDidMount:function(){
		for(var i=0;i<$("[data-onmouseover]").length;i++){
			$($("[data-onmouseover]")[i]).attr("onmouseover",$($("[data-onmouseover]")[i]).attr("data-onmouseover"));	
		}
		for(var i=0;i<$("[data-onmouseout]").length;i++){
			$($("[data-onmouseout]")[i]).attr("onmouseout",$($("[data-onmouseout]")[i]).attr("data-onmouseout"));	
		}
		for(var i=0;i<$("[data-onclick]").length;i++){
			$($("[data-onclick]")[i]).attr("onclick",$($("[data-onclick]")[i]).attr("data-onclick"));	
		}
	},
	componentDidUpdate:function(){
		for(var i=0;i<$("[data-onmouseover]").length;i++){
			$($("[data-onmouseover]")[i]).attr("onmouseover",$($("[data-onmouseover]")[i]).attr("data-onmouseover"));	
		}
		for(var i=0;i<$("[data-onmouseout]").length;i++){
			$($("[data-onmouseout]")[i]).attr("onmouseout",$($("[data-onmouseout]")[i]).attr("data-onmouseout"));	
		}
		for(var i=0;i<$("[data-onclick]").length;i++){
			$($("[data-onclick]")[i]).attr("onclick",$($("[data-onclick]")[i]).attr("data-onclick"));	
		}
	},
	render:function(){
		var self=this;
		var styleFormconfig="";
		var onMouseOver="";
		var onMouseOut="";
		var cssStyle={};
		var onClick="";
		var cssSelected=(this.props.cssFullData && this.props.cssProperty && this.props.cssFullData[this.props.cssProperty])?this.props.cssFullData[this.props.cssProperty]:{};
		//normal 
		styleFormconfig=cssSelected.normal;
		//for hover
		if(cssSelected && cssSelected.hover){
			Object.keys(cssSelected.hover).map(function(styleName){
				
				var oldStyleName=styleName;
				while(styleName.indexOf("-")>-1){
					var hyphenIndex=styleName.indexOf("-");
					styleName=styleName.replace("-","");
					styleName=styleName.replace(styleName[hyphenIndex],styleName[hyphenIndex].toUpperCase())
				}
				onMouseOver+='this.style.'+styleName+'="'+cssSelected.hover[oldStyleName]+'";';
			})
		}
		Object.keys(cssSelected.normal).map(function(styleName){
			var oldStyleName=styleName;
			while(styleName.indexOf("-")>-1){
				var hyphenIndex=styleName.indexOf("-");
				styleName=styleName.replace("-","");
				styleName=styleName.replace(styleName[hyphenIndex],styleName[hyphenIndex].toUpperCase())
			}
			onMouseOut+='this.style.'+styleName+'="'+cssSelected.normal[oldStyleName]+'";';
		})
		
		//for active
		if(cssSelected && cssSelected.active ){
			Object.keys(cssSelected.active).map(function(styleName){
				
				var oldStyleName=styleName;
				while(styleName.indexOf("-")>-1){
					var hyphenIndex=styleName.indexOf("-");
					styleName=styleName.replace("-","");
					styleName=styleName.replace(styleName[hyphenIndex],styleName[hyphenIndex].toUpperCase())
				}
				onClick+='this.style.'+styleName+'="'+cssSelected.active[oldStyleName]+'";';
			})
		}	
		
		
		return(<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
			   {
			   	Object.keys(cssSelected).map(function(innerCss){
			   		//innercss means normal hover in the css 
			   		if(innerCss!="type"){
				   		return (<div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
				   					<h5>{innerCss}</h5>
				   					{
				   						Object.keys(cssSelected[innerCss]).map(function(inlineCss){
				   							return (<div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
				   										<div className="col-lg-5 col-sm-5 col-xs-5 col-md-5 no-padding">{inlineCss}</div>
				   										<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2 no-padding">
				   											<div  >:</div>
				   										</div>
				   										<div className="col-lg-5 col-sm-5 col-xs-5 col-md-5 no-padding">{cssSelected[innerCss][inlineCss]}</div>
				   									</div>)
				   						})			
				   					}
				   				</div>)
			   		}else{
			   			return (<div key={global.guid()} className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
				   					<div className="col-lg-5 col-sm-5 col-xs-5 col-md-5 no-padding">{innerCss}</div>
									<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2 no-padding">
										<div  >:</div>
									</div>
									<div className="col-lg-5 col-sm-5 col-xs-5 col-md-5 no-padding">{cssSelected[innerCss]}</div>
								</div>)
			   		}
			   	})
			   }
			   <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-top-gap">
			   		<h5 className="">Preview Of The Style</h5>
				   <div style={styleFormconfig} data-onmouseover={onMouseOver} data-onclick={onClick} data-onmouseout={onMouseOut}>
				   		Lorem ipsum dolor sit amet
				   </div>
			   </div>
			   </div>)
	}
})

/***
 * data 
 * objData 
 * callback 
 * property
 */
var AddObject =React.createClass({
	getInitialState:function(){
		return {objData:(this.props.objData!=undefined && this.props.objData!="")?this.props.objData:[] };
	},
	componentDidMount:function(){
		var self=this;
		$("input[name='objSelect']:radio").change(function () {
		  if($(this).val()!=undefined){
		  	self.props.callback(self.props.property,$(this).val());
		  }
		})
		if(this.props.viewName!=undefined &&  $("input[value='"+this.props.viewName +"']:radio").length>0){
			$("input[value='"+this.props.viewName +"']:radio").click();
		}
	},
	componentDidUpdate:function(){
		var self=this;
		$("input[name='objSelect']:radio").change(function () {
		  if($(this).val()!=undefined){
		  	self.props.callback(self.props.property,$(this).val());
		  }
		})
	},
	render:function(){
		var objSchema=this.props.data;
		var summary=[];
		if(objSchema && objSchema["@operations"] && objSchema["@operations"]["read"]){
			Object.keys(objSchema["@operations"]["read"]).map(function(lay){
				if( objSchema["@operations"]["read"][lay].UILayout && Array.isArray(objSchema["@operations"]["read"][lay].UILayout)){
					
				}else if(objSchema["@operations"]["read"][lay] && objSchema["@operations"]["read"][lay].UILayout){
					summary.push(lay);
				}
			})
		}
		var self=this;
		return(<div >
					<h5>Select the data view in the object field selected</h5>
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						{
							["a"].map(function(temp){
								if(summary.length ==0){
									return (<h5 key={global.guid()}>This Schema does not contain a summary  data view please create it first </h5>)
								}else{
									return summary.map(function(lay){
										var layoutInlay=objSchema["@operations"]["read"][lay].UILayout.type;
										return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
													<div className="col-lg-1 col-md-1 col-sm-1 col-xs-2 no-padding-left">
														<input key={global.guid()} type="radio" name="objSelect" value={lay} className="form-control" /><span></span>
													</div>
													<div className="col-lg-11 col-md-11 col-sm-11 col-xs-10 no-padding-left">
														<h5>{"Select "+lay+" with "+layoutInlay+" layout" }</h5>
													</div>
													
												</div>)
									})
								}
							})
						}
					</div>
				</div>)
	}
})

/**
 * adding struct values
 * props:
 * 	data
 * 	structData
 * 	callback
 * 	property 
 */
var AddStructFields=React.createClass({
	getInitialState:function(){
		return {structData:(this.props.structData!=undefined && this.props.structData!="")?this.props.structData:[] };
	},
	check:function(value){
		var data=this.state.structData;
		var self=this;
		if(data.indexOf(value)==-1){
			data.push(value);
			this.setState({structData:data},function(){
				self.callback();
			});
		}
	},
	callback:function(){
		var data={};
		data[this.props.property]=this.state.structData;
		this.props.callback(data);
	},	
	componentDidMount:function(){
		if(this.state.structData && this.state.structData.length>0){
			this["selectedMsg"].className="";
			this["selectedProperties"].className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left";
		}
	},
	componentDidUpdate:function(){
		if(this.state.structData && this.state.structData.length>0){
			this["selectedMsg"].className="";
			this["selectedProperties"].className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left";
		}
	},
	deleteProperty:function(value){
		var data=this.state.structData;
		if(data.indexOf(value)!=-1){
			var pos=data.indexOf(value);
			delete data[pos];
			data = data.filter(function(n){ return (n != "" && n!= undefined)});
			this.setState({structData:data});
		}
	},
	render:function(){
		var self=this;
		var properties=Object.assign({},this.props.data["@properties"]);
		Object.assign(properties,this.props.data["@sysProperties"]);
		var propertiesNotToShow=["org","id","requiredKeys","filters","dependentProperties","recordId"];
			propertiesNotToShow.map(function(property){
				if(Object.keys(properties).indexOf(property)!=-1){
					delete properties[Object.keys(properties)[Object.keys(properties).indexOf(property)]]
					//console.log(properties);
					//outProperties = outProperties.filter(function(n){ return (n != "" && n!= undefined)});
				}
			})
		return (<div>
					<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5 no-padding-left">
						<h5>Available </h5>
							{
								Object.keys(properties).map(function(property){
									return(<div key={global.guid()} className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left">
												<span onClick={self.check.bind(null,property)} className="link " title="Click to add the property" >{property}</span> 
										   </div>)
								},this)
							}
					</div>
					<div className="col-lg-3 col-md-3 col-sm-3 hidden-xs"  >
						<div style={{"margin-top":"5px"}} className=" fa-2x sleekIcon-rightarrow"></div>
					</div>
					<div className="col-lg-4 col-md-4 col-xs-12 col-sm-4 no-padding-left">
						<h5 ref={(e)=>{this.selectedMsg=e}} className="" >Selected</h5>
						<div ref={(e)=>{this.selectedProperties=e}} className="hidden">
							{
								["a"].map(function(temp){
									if(self.state.structData && self.state.structData.length && Array.isArray(self.state.structData) ){
										return self.state.structData.map(function(property){
											return(<div key={global.guid()} className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding-left">
														<span title="Click to delete the property" onClick={self.deleteProperty.bind(null,property)} className="link " >{property}</span> 
												   </div>)				
										},this)
									}else{
										return(<div key={global.guid()} className="hidden"></div>)
									} 
								},this)
							}
						</div>
					</div>
					<h5 className="hidden" style={{"color":"red"}} ref={(e)=>{this.errorMsg=e}}>For better look and feel use maximum of two properties</h5>
				</div>)
	}
})


/***
 *
 * calculating col length values for gallery n columns  
 */
function calculateCols(columnCount){
	columnCount=columnCount*1;
	if(columnCount > 0 ){
		var colLg="12";
		var colMd="12";
		var colSm="12";
		var colXs="12";
		switch(columnCount){
			case 1:
				colLg="1";
				colMd="1";
				colSm="1";
				colXs="3";
				break;
			case 2:
				colLg="2";
				colMd="2";
				colSm="2";
				colXs="6";
				break;
			case 3:
				colLg="3";
				colMd="3";
				colSm="3";
				colXs="12";
				break;
			case 4:
				colLg="4";
				colMd="4";
				colSm="4";
				colXs="12";
				break;
			case 5:
				colLg="5";
				colMd="5";
				colSm="5";
				colXs="12";
				break;
			case 6:
				colLg="6";
				colMd="6";
				colSm="6";
				colXs="12";
				break;
			case 7:
				colLg="7";
				colMd="7";
				colSm="7";
				colXs="12";
				break;
			case 8:
				colLg="8";
				colMd="8";
				colSm="8";
				colXs="12";
				break;
			case 9:
				colLg="9";
				colMd="9";
				colSm="9";
				colXs="12";
				break;
			case 10:
				colLg="10";
				colMd="10";
				colSm="10";
				colXs="12";
				break;
			case 11:
				colLg="11";
				colMd="11";
				colSm="11";
				colXs="12";
				break;
			default:
				colLg="12";
				colMd="12";
				colSm="12";
				colXs="12";
				break;
			
		}
		return "col-lg-"+colLg+" col-md-"+colMd+"  col-sm-"+colSm+" col-xs-"+colXs+" no-padding-left";
	}else{
		return "col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding";
	}
}
exports.calculateCols=calculateCols;

/**
 *	data--- layout
 *  columnCOunt--no.of columns
 * 	
 */
var GalleryLayoutPreview=React.createClass({
	getInitialState:function(){
		return {actions:[],relations:[],data:(this.props.data!=undefined)?this.props.data:[],columnCount:(this.props.columnCount!=undefined)?this.props.columnCount:3,previewRecord: DefinitionStore.getDefinition("PreviewRecord"),layout:(this.props.layout!=undefined &&  Object.keys(this.props.layout).length >0)?this.props.layout:{},objectDataViews:(this.props.objectDataViews!=undefined &&  Object.keys(this.props.objectDataViews).length >0)?this.props.objectDataViews:{},css:(this.props.css!=undefined &&  Object.keys(this.props.css).length >0)?this.props.css:{},relRefViews:(this.props.relRefViews!=undefined &&  Object.keys(this.props.relRefViews).length >0)?this.props.relRefViews:{}};
	},	
	_onChange:function(){
		this.setState({previewRecord:DefinitionStore.getDefinition("PreviewRecord")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
	componentDidMount:function(){
		ActionCreator.getDefinition("PreviewRecord");
		DefinitionStore.addChangeListener(this._onChange);
		var self=this;
		var relations=[];
		var actions=[];
		var schema=this.props.fullSchema;
		if(schema["@operations"] ){
			if(schema["@operations"].update){
				actions=actions.concat(Object.keys(schema["@operations"].update));
			}
            if(schema["@operations"].delete){
                actions=actions.concat(Object.keys(schema["@operations"].delete));
            }
            if(schema["@operations"].actions){
                actions=actions.concat(Object.keys(schema["@operations"].actions));
            }
             if(schema["@operations"].relations && Object.keys(schema["@operations"].relations).length >0){
            	var tempData=[];
            	var tempRelRef={};
            	Object.keys(schema["@operations"].relations).map(function(rel){
            		tempData.push(schema["@operations"].relations[rel].relation)
            	})
               relations["data"]=tempData;//inserting the relations names
               
               tempData.map(function(relation){
               		if(schema["@relations"][relation] && schema["@relations"][relation]["relationRefSchema"]!=undefined){
               			tempRelRef[relation]=schema["@relations"][relation]["relationRefSchema"]
               		}
               })
               relations["relationRef"]=tempRelRef;//inserting the relation Ref schema names
            }
            this.setState({actions:actions,relations:relations},function(){
            	if(self.state.actions.length >0){
            		$(self["actionButton"]).removeClass("hidden");
		        	//self["actionButton"].className=self["actionButton"].className.replace("hidden","");
		        }
		        if(self.state.relations.length >0){
		        	$(self["relationButton"]).removeClass("hidden");
		        	$(self["relation"]).removeClass("hidden");
		        	//self["relationButton"].className=self["relationButton"].className.replace("hidden","");
		        	//self["relation"].className=self["relation"].className.replace("hidden","");
		        } 
            });
        }
        if(actions.length ==0 || this.state.actions.length ==0){
        	this["actionButton"].className+=" hidden"
        }
        if(relations==undefined || relations.data==undefined || Object.keys(relations.data).length ==0 || this.state.relations.length ==0){
        	this["relationButton"].className+=" hidden"
        	this["relation"].className+=" hidden"
        } 
	},
	addProperty:function(){
		manageSchemaNew.getPopupContent("Select Property","");
    	ReactDOM.render(<PropertyEdit  callback={this.saveValue} objRef={this.state.objectDataViews} css={this.state.css} outProperties={this.props.outProperties}  fullSchema={this.props.fullSchema}   />,document.getElementById('genericPopupBody'));
	},
	saveValue:function(temp,property,objRef,cssSelected,imgType,relRefView){
		var data=this.state.data;
		var flag=true;
		if(typeof property=="object" && data.length >0){
			data.map(function(selectedProperty,index){
				if(typeof selectedProperty=="object" && JSON.stringify(selectedProperty)==JSON.stringify(property)){
						flag=false;
				}
			})
		}else if(data.indexOf(property)!=-1){
			flag=false;
		}
		var objectDataViews=(this.state.objectDataViews!=undefined && Object.keys(this.state.objectDataViews).length>0)?this.state.objectDataViews:{};
  		if(objRef!="" && objRef!=undefined){
  			objectDataViews[property]=objRef;
  		}
  		var css=(this.state.css!=undefined && Object.keys(this.state.css).length>0)?this.state.css:{};
  		
  		if(cssSelected!=undefined && cssSelected!="" && typeof cssSelected!="object"){
  			if(typeof property=="object"){
  				css[Object.keys(property)[0]]=cssSelected;
  			}else{
  				css[property]=cssSelected;
  			}
  		}
  		var relRefViews=(this.state.relRefViews!=undefined && Object.keys(this.state.relRefViews).length>0)?this.state.relRefViews:{};
  		if(relRefView!=undefined && relRefView!="" && typeof relRefView!="object"){
  			if(typeof property=="object"){
  				relRefViews[Object.keys(property)[0]]=relRefView;
  			}else{
  				relRefViews[property]=relRefView;
  			}
  		}
		if(flag){
			data.push(property);
				this.setState({data:data,objectDataViews:objectDataViews,css:css,relRefViews:relRefViews},function(){
			});
		}
		
	},
	addOther:function(value){
		manageSchemaNew.getPopupContent("Select "+value,"");
		var data="";
		if(value=="Action Button"){
			data=this.state.actions;
		}else{
			data=this.state.relations.data;
			relRef=this.state.relations.relationRef;

		}
    	ReactDOM.render(<OtherDataEdit value={value}  relRef={relRef} callback={this.saveValue} data={data}  fullSchema={this.props.fullSchema} />,document.getElementById('genericPopupBody'));
	},
	deleteProperty:function(value){
		var data=this.state.data;
		var css=this.state.css;
		var self=this;
		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
		if(properties[value] && properties[value]["dataType"] && properties[value]["dataType"].type=="struct"){
			data.map(function(selectedProperty,index){
				if(typeof selectedProperty=="object" && Object.keys(selectedProperty)[0]==value){
					delete data[index];
					data = data.filter(function(n){ return (n != "" && n!= undefined)});
					self.setState({data:data});
				}
			})
		}else if(data.indexOf(value)!=-1){
			var pos=data.indexOf(value);
			var css=this.state.css;
			var objectDataViews=(this.state.objectDataViews!=undefined && Object.keys(this.state.objectDataViews).length>0)?this.state.objectDataViews:{};
			delete data[pos];
			data = data.filter(function(n){ return (n != "" && n!= undefined)});
			if(css!=undefined && Object.keys(css).length >0 && css[value]!=undefined){
				delete css[value];
			}
			if(objectDataViews!=undefined && Object.keys(objectDataViews).length >0 && objectDataViews[value]!=undefined){
				delete objectDataViews[value];
			}
			this.setState({data:data,objectDataViews:objectDataViews,css:css});
		}
	},
	selectColumnCount:function(column){
		this.setState({columnCount:column})
	},
	saveLayout:function(){
		var newSchema=this.props.fullSchema;
		var layoutName="gallery"
		if(this.props.from=="sideByside"){
			layoutName="sideByside";
		}
  		if(this.props.edit){
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.type=layoutName;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.layout=this.state.data;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.objectDataViews=this.state.objectDataViews;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.css=this.state.css;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.columnNo=this.state.columnCount;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.relRefViews=this.state.relRefViews;
  		}else{
  			if(this.props.newLayout){
  				var data={};
  				data["UILayout"]={
  					"type":layoutName,
  					"layout":this.state.data,"objectDataViews":this.state.objectDataViews,"css":this.state.css,"columnNo":this.state.columnCount,
  					"relRefViews":this.state.relRefViews,
  				}
  				if(typeof newSchema["@operations"]!="object"){
  					newSchema["@operations"]={}
  				}
  				if(typeof newSchema["@operations"]["read"]!="object"){
  					newSchema["@operations"]["read"]={}
  				}
  				newSchema["@operations"]["read"][this.props.viewName]=data;
  				
  			}
  		}
  		$(".deleteIcon").click();
  		console.log(data)
  		this.props.callback(newSchema);
	},
	render:function(){
		var self=this;
		var divLength="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		var columnCount=[];
		var table="";
		if(this.props.from!="sideByside"){
			for(var i=0;i<this.state.columnCount;i++){
				columnCount.push("temp");
			}
			divLength=calculateCols(this.state.columnCount)
			
		}else{
				columnCount.push("temp");
				divLength="row no-margin parent-img-component";
				table="child-img-component";
		}
		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
		return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
					{
						["a"].map(function(temp){
							if(self.props.from!="sideByside"){
								var columnValues=[1,2,3,4,6];
								return (<div key={global.guid()} className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
											<label  className="text-uppercase">SELECT NUMBER OF RECORDS TO BE SHOWN PER ROW</label>
											<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding margin-bottom-gap">
												<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
									   				<span  ref={(e)=>{this.columnCount=e}} data-bind="label">{self.state.columnCount}</span>
									   			</button>
									   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
											   		{
											   			columnValues.map(function(column){
											   				return(<li key={global.guid()}><span onClick={self.selectColumnCount.bind(null,column)}>{column}</span></li>)
											   			},this)
											   		}
									   			</ul>
											</div>
										</div>)
							}else{
								return (<div key={global.guid()} className="hidden"></div>)
							}
						})	
					}
					
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding form-group">
							{
								columnCount.map(function(temp){
									
									return (<div key={global.guid()} className={divLength}>
											{
												 self.state.data.map(function(property){
														if(typeof property=="object" || (property.indexOf("#")==-1 && property.indexOf("$")==-1 && property.indexOf("^")==-1 && property.indexOf("@")==-1 && property.indexOf("%")==-1)){
																if(typeof property =="object"){
																	property=Object.keys(property)[0];
																}
																if(properties && properties[property] && properties[property]["dataType"].type && self.state.previewRecord && Object.keys(self.state.previewRecord).length >0){		  
																	var value=(self.state.previewRecord[properties[property]["dataType"].type]!=undefined)?self.state.previewRecord[properties[property]["dataType"].type]:"Datatype value not in preview Record"
																	if(properties[property]["dataType"].type=="images" || properties[property]["dataType"].type=="image"){
																			return (<div key={global.guid()} className={table}>
																						<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component form-group -"}>
																							<div className="child-img-component" style={{"display": "inline-block"}}><img src={value[0].url} className="pull-left" style={{"height":"120px"}} /></div>
																							 <div className="child-img-component" style={{"display": "inline-block", "margin-top": "6px"}}>
																							 	<span className="fa-2x icons8-delete link" onClick={self.deleteProperty.bind(null,property)} />
																							 </div>
																						</div>
																					</div>)
																	}else{
																		var text=JSON.stringify(value);
																		return (<div key={global.guid()} className={table}>
																					<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component form-group -"+value}>
																						<div className="child-img-component" style={{"display": "inline-block"}}>
																							<h6 style={{"margin-bottom":"0px", "color":"rgb(192, 192, 192)"}}>
																							{
																								(properties[property].displayName!=undefined && properties[property].displayName!="")?properties[property].displayName:
																																		((properties[property].prompt!=undefined && properties[property].prompt!="")?
																																			properties[property].prompt:property)
																							}
																						</h6>
																							{text}
																						</div>
																						 <div className="child-img-component" style={{"display": "inline-block", "margin-top": "6px"}}>
																						 	<span className="fa-2x icons8-delete link" onClick={self.deleteProperty.bind(null,property)} />
																						 </div>
																					</div>
																				</div>)	
																			
																	}
															}else{
																return (<div key={global.guid()} className="hidden"></div>)
															}		
														}else if(property.indexOf("#")==0){
															var value=property.replace("#","");
															return (<div key={global.guid()} className={table}>
																		<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component form-group -"+value}>
																			 <div className="child-img-component" style={{"display": "inline-block"}}>
																				<input key={global.guid()} type='submit' className="action-button" value={value} />
																			</div>
																			 <div className="child-img-component" style={{"display": "inline-block", "margin-top": "6px"}}>
																			 	<span className="fa-2x icons8-delete link" onClick={self.deleteProperty.bind(null,property)} />
																			 </div>
																		</div>
																	</div>)
														}else if(property.indexOf("^")==0){
															var value=property.replace("^","");
															return (<div key={global.guid()} className={table}>
																		<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component form-group -"+value}>
																			<div className="child-img-component" style={{"display": "inline-block"}}>
																				<button  className="upload-btn btn">{value}</button>
																			</div>
																			 <div className="child-img-component" style={{"display": "inline-block", "margin-top": "6px"}}>
																			 	<span className="fa-2x icons8-delete link" onClick={self.deleteProperty.bind(null,property)} />
																			 </div>
																		</div>
																	</div>)
														}else if(property.indexOf("$")==0){
															var value=property.replace("$","");
															return (<div key={global.guid()} className={table}>
																		<div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component form-group -"+value}>
																			 <div className="child-img-component" style={{"display": "inline-block"}}>{"Related Records Of "+value+" Schema"}</div>
																			 <div className="child-img-component" style={{"display": "inline-block", "margin-top": "6px"}}>
																			 	<span className="fa-2x icons8-delete link" onClick={self.deleteProperty.bind(null,property)} />
																			 </div>
																		</div>
																	</div>)
														}
													})
											}
										</div>)
								})
							}	
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<label  className="extra-padding no-padding-left form-group">
							<input key={global.guid()} type='button' ref={(e)=>{this.property=e}} className="btn  upload-drop-zone" value='ADD PROPERTY' onClick={this.addProperty}/>
						</label>
						<label  className="extra-padding no-padding-left form-group hidden">
							<input key={global.guid()} type='button' ref={(e)=>{this.actionButton=e}} className="btn  upload-drop-zone " value='ADD ACTION BUTTON' onClick={this.addOther.bind(null,"Action Button")}/>
						</label>
						<label  className="extra-padding no-padding-left form-group">
							<input key={global.guid()} type='button' ref={(e)=>{this.relation=e}} className="btn  upload-drop-zone " value='ADD RELATION' onClick={this.addOther.bind(null,"Relation")}/>
						</label>
						<label  className="extra-padding no-padding-left form-group">
							<input key={global.guid()} type='button' ref={(e)=>{this.relationButton=e}} className="btn  upload-drop-zone " value='ADD RELATION BUTTON' onClick={this.addOther.bind(null,"Relation Button")}/>
						</label>
					</div>
					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						<label  className="extra-padding no-padding-left form-group">
							<input key={global.guid()} type='button' ref={(e)=>{this.saveButton=e}} className="btn  upload-drop-zone" value='Save Layout' onClick={this.saveLayout}/>
						</label>
					</div>
				</div>)
	}
})

/**
 * callback
 * data--- set of all values available
 * fullSchema 
 * value---Other data Type i.e rel action group
 * relRef--set of ref schemas available
 * 
 */
var OtherDataEdit=React.createClass({
	getInitialState: function() {
	    return {cssFields:{},property:"",cssSelected:"",viewName:""};
	},
	close:function(property,css,viewName){
		$(".modal").click();
		if(css=="None" || css==""){
			css=undefined;
		}
		this.props.callback(undefined,property,undefined,css,undefined,viewName);
	},
	select:function(propertySelected){
		var property=propertySelected;
		var flag=true;
		var self=this;
		this["otherProperty"].innerHTML=property;
		if(this.props.value=="Action Button"){
			property="#"+property;
		}else if(this.props.value=="Relation Button"){
			property="^"+property;
		}else if(this.props.value=="Relation"){
			property="$"+property;
			flag=false;
		}else if (this.props.value=="Show Related"){
			property="&"+property;
		}else if (this.props.value=="Unique Action"){
			property="@"+property;
		}else if (this.props.value=="Group By"){
			flag=false
			property="%"+property;
		}   
		if(flag){
			self.close(property);
		}else{
			if(Object.keys(this.state.cssFields).length == 0){
				self.close(property)
			}else{
				this.setState({property:property})
			}
			if(this.props.relRef && 
						Object.keys(this.props.relRef).length>0 && 
						this.props.value=="Relation" &&
						self.props.relRef[propertySelected]!="Follow" && 
						self.props.relRef[propertySelected]!="Like"){
					var self=this;
					this["errorMsg"].className="hidden";
					$(".relView").remove();
					var node=document.createElement("div");
					node.id= global.guid();
			        node.className="col-lg-12 col-md-12/ col-sm-12 col-xs-12 relView no-padding-left";
					 WebUtils.getMainSchema(self.props.relRef[propertySelected],function(result){
						self["errorMsg"].parentNode.appendChild(node);
						ReactDOM.render(<AddObject data={result} viewName={undefined} objData={undefined} callback={self.saveRelView} property={propertySelected} />,node)
					 })
				
			}else{
				this.setState({viewName:undefined})
			}
		}
	},
	saveRelView:function(relRef,relView){
		console.log(relRef,relView);
		var temp={}; 
		temp[relRef]=relView;
		this.setState({viewName:temp})
	},
	selectCss:function(cssSelected){
		if(cssSelected!="None"){
			var self=this;
			this["errorCss"].className="hidden";
			$(".css").remove();
			var node=document.createElement("div");
			node.id= global.guid();
	        node.className="col-lg-12 col-md-12/ col-sm-12 col-xs-12 css no-padding-left";
	        this["errorCss"].parentNode.appendChild(node);
	        
			ReactDOM.render(<AddCssFileds cssFullData={this.state.cssFields} cssProperty={cssSelected} />,node)
		}
		this.css.innerHTML=cssSelected;
		this.setState({cssSelected:cssSelected});
	},
	submitProperty:function(){
		if(this.props.value!="Relation"){
			this.close(this.state.property,this.state.cssSelected)
		}else{
			if(this.state.viewName==""){
				this["errorMsg"].className="";
			}else{
				this.close(this.state.property,this.state.cssSelected,this.state.viewName)
			}
		}
	},
	componentDidMount:function(){
		var self=this;
		if(this.props.value=="Relation" ||  this.props.value=="Group By"){
			var configDetails=(common.getConfigDetails() && common.getConfigDetails().branding && Object.keys(common.getConfigDetails().branding).length >0)?common.getConfigDetails().branding:{};
			if(configDetails && Object.keys(configDetails).length >0){
				var css={};
				Object.keys(configDetails).map(function(style,index){
					if(configDetails[style].type && configDetails[style].type=="relGroup"){
						css[(Object.keys(configDetails)[index])]=configDetails[style];
					}
				})
				css["None"]="None";
				this.setState({cssFields:css},function(){
					if(Object.keys(css).length > 1){
						$(self.cssRel).removeClass("hidden");
						//self.cssRel.className=self.cssRel.className.replace("hidden","");
					}
				})	
			}
		}
	},
	render:function(){
		var self=this;
		var divType="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding";
		if(this.props.value=="Relation" ||  this.props.value=="Group By"){
			divType="col-lg-6 col-md-6 col-xs-6 col-sm-12 no-padding-left";
		}
		return( 
				<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
		   			<div className={ divType+" form-group" }>
			   			<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
			   				<span  ref={(e)=>{this.otherProperty=e}} data-bind="label">{"Select "+this.props.value}</span>
			   			</button>
			   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
					   		{
					   			this.props.data.map(function(outProperty){
					   				return(<li key={global.guid()} ><span onClick={self.select.bind(null,outProperty)}>{outProperty}</span></li>)
					   			},this)
					   		}
			   			</ul>
			   			<h5 ref={(e)=>{this.errorMsg=e}} className="hidden" style={{"color":"red"}}>Please select the Data View </h5>
		   			 </div>
	   				<div className={divType+" hidden"} ref={(e)=>{this.cssRel=e}}>
	   					<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
		   			 	{
		   			 		["a"].map(function(temp){
		   			 			
		   						return(<div key={global.guid()} className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding" >
							   				<button  data-toggle="dropdown" className="btn btn-default dropdown-toggle form-control" type="button">
								   				<span  ref={(e)=>{self.css=e}} data-bind="label">{self.state.cssSelected!=""?self.state.cssSelected:"Select The Style"}</span>
								   			</button>
								   			<ul role="menu" className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding ">
										   		{
										   			Object.keys(self.state.cssFields).map(function(cssProperty){
										   				return(<li key={global.guid()}><span onClick={self.selectCss.bind(null,cssProperty)}>{cssProperty}</span></li>)
										   			},this)
										   		}
								   			</ul>
								   		</div>)
		   			 		})
		   			 	}
		   			 	</div>
	   			 		<h5 ref={(e)=>{this.errorCss=e}} className="hidden" style={{"color":"red"}}>Please select the style </h5>
   			 	 	</div>
		   			 		<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding  margin-top-gap" >
						   		<label  className="pull-right">
									<input key={global.guid()} type='button' className="btn  upload-drop-zone pull-right" value='SAVE PROPERTY' onClick={this.submitProperty}/>
								</label>
							</div>
			   			
		   			
		   		
				</div>)
	}
})


var BannerLayoutPreview=React.createClass({
	getInitialState: function() {
	    return {data:{},systemRelations:(this.props.systemRelations!=undefined)?this.props.systemRelations:"No",layout:(this.props.layout!=undefined &&  Object.keys(this.props.layout).length >0)?this.props.layout:{},objectDataViews:(this.props.objectDataViews!=undefined &&  Object.keys(this.props.objectDataViews).length >0)?this.props.objectDataViews:{},css:(this.props.css!=undefined &&  Object.keys(this.props.css).length >0)?this.props.css:{}};
	},
	shouldComponentUpdate: function(nextProps, nextState) {
  		return (JSON.stringify(this.state)!= JSON.stringify(nextState));
	},
	componentWillMount:function(){
		if(typeof window!="undefined"){
			this.loadData();
		}
	},
	loadData:function(){
		var props=this.props;
		var state=this.state;
		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
  		var self=this;
  		if(this.props.previewRecord && Object.keys(this.props.previewRecord).length > 0){
  			var layData={};
  			var layout={
	              "coverImage": "",
	              "profileImage": "",
	              "header": "",
                  "subHeader": ""
  			};
	  		if(Object.keys(state.layout).length > 0){
	  			var lay=this.state.layout;
	  			
  				var temp=lay.overlay!=undefined?Object.assign(lay.overlay):undefined;
  				if(temp!=undefined && Object.keys(temp).length>0){
  					$.extend(lay,temp);
  				}
				if(lay.overlay!=undefined){
					delete lay.overlay; 
				}
				if(JSON.stringify(lay)!=JSON.stringify(layout)){
					this.setState({layout:lay})
				}
		  		Object.keys(lay).map(function(temp){
		  			if(lay[temp]!="" ){
		  				layData[temp]=(typeof state.layout[temp]!="object" && properties[state.layout[temp]]!=undefined)?(props.previewRecord[properties[state.layout[temp]].dataType.type]!=undefined?props.previewRecord[properties[state.layout[temp]].dataType.type]:"Data Not Available In Preview"):(typeof state.layout[temp]!="object"?"Data Not Available In Preview":props.previewRecord["struct"]);
		  			}else{
		  				layData[temp]="No Property Selected";
		  			}
		  		})
	  		}else{
	  			Object.keys(layout).map(function(temp){
		  			layData[temp]=layout[temp]!=""?(self.props.previewRecord[layout[temp]]!=undefined?self.props.previewRecord[layout[temp]]:"Data Not Available in Preview Record"):"No Property Selected";
		  		})
		  		this.setState({layout:layout})
	  		}
	  		this.setState({data:layData})
  		}
	},
	change:function(layout,dataType){
  	 	manageSchemaNew.getPopupContent("Select Property","");
    	ReactDOM.render(<PropertyEdit layout={this.state.layout} reqDataType={dataType} callback={this.saveProperty} objRef={this.state.objectDataViews} css={this.state.css} outProperties={this.props.outProperties} editField={layout} fullSchema={this.props.fullSchema} edit={this.props.edit}  />,document.getElementById('genericPopupBody'));
  	},
  	saveProperty:function(field,property,objRef,cssSelected){
  		var self=this;
  		var objectDataViews=(this.state.objectDataViews!=undefined && Object.keys(this.state.objectDataViews).length>0)?this.state.objectDataViews:{};
  		var tempProperty=typeof property!="object"?property:Object.keys(property)[0];
  		if(objRef!="" && objRef!=undefined){
  			objectDataViews[tempProperty]=objRef;
  		}
  		var css=(this.state.css!=undefined && Object.keys(this.state.css).length>0)?this.state.css:{};
  		if(cssSelected!=undefined){
  			if(typeof tempProperty=="object"){
  				css[Object.keys(tempProperty)[0]]=cssSelected;
  			}else{
  				css[tempProperty]=cssSelected;
  			}
  		}
		 /* var css=this.state.css;
			if(css!="" && css!=undefined){
				css[tempProperty]=cssSelected;
			}*/
		  
  		var layout=this.state.layout;
  		layout[field]=property;
  		this.setState({layout:layout,objectDataViews:objectDataViews,css:css},function(){
  			self.loadData();
  		});
	},
	componentDidMount:function(){
		$("input[name='systemRelations'][value='"+this.state.systemRelations +"']").click()
	},
	callback:function(){
		this.props.callback(this.state.layout,this.props.index,this.state.navElement,this.props.type,this.state.objectDataViews,this.state.css,undefined,undefined,this.state.systemRelations);
	},
	systemRelation:function(){
		var self=this;
		var value=$("input[name='systemRelations']:checked").val();
		this.setState({systemRelations:value},function(){
			self.showSystemRelations();
		})
	},
	showSystemRelations:function(){
		if(this.state.systemRelations=="Yes"){
			this.systemRelations.className="row no-margin"
		}else{
			this.systemRelations.className+=" hidden"
		}
	},
	render:function(){
		var self=this;
		if(Object.keys(this.state.data).length>0){
			var data=this.state.data;
			var profileImage="https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1441279368/default_image.jpg";
			var coverImage="https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_500,w_500/v1441279368/default_image.jpg";
			 if(data.profileImage && data.profileImage[0] && data.profileImage[0].cloudinaryId ){
			 	if(data.profileImage[0].cloudinaryId.indexOf("http")!=0){
		    		profileImage="https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1441279368/"+data.profileImage[0].cloudinaryId+".jpg";
				}else{
					profileImage=data.profileImage[0].cloudinaryId;
				}
			 }
			 if(data.coverImage && data.coverImage[0] && data.coverImage[0].cloudinaryId ){
			 	if(data.coverImage[0].cloudinaryId.indexOf("http")!=0){
		    		coverImage="https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_500,w_500/v1441279368/"+data.coverImage[0].cloudinaryId+".jpg";
				}else{
					coverImage=data.coverImage[0].cloudinaryId;
				}
			 }
			 var subHeader="";
			 if(typeof data.subHeader=="object"){
			 	var objData="";
			 	Object.keys(data.subHeader).map(function(innerData){
			 		objData+=data.subHeader[innerData]+" ";
			 	})
			 	subHeader=objData;
			 	
			 }else{
			 	subHeader=data.subHeader;
			 }
			 var change=(this.props.edit=="edit")?"Change":"";
			 var relations=[];
				if(this.props.fullSchema["@relations"] && Object.keys(this.props.fullSchema["@relations"]).length>0){
					Object.keys(this.props.fullSchema["@relations"]).map(function(temp){
							relations.push(self.props.fullSchema["@relations"][temp].relationRefSchema);
					})
				}
				var systemRel=this.state.systemRelations!="Yes"?"hidden":"";
			return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						<div className='main-block'> 
							<div className='banner-picture img-holder profilehover'> 
								<div className="img" style={{"background-image":"url("+coverImage+")"}} ></div>
							</div>
							<h6 className={"link no-margin  pull-right "} onClick={this.change.bind(null,"coverImage","image")}>{change}</h6>
							<div className='row no-margin txt '>
								<span className='display-inline-block'> 
									 <img src={profileImage} className=' profilePicture profilehover'/> 
									 <h6 className={"link no-margin  "} onClick={this.change.bind(null,"profileImage","image")}>{change}</h6>
								 </span>&nbsp;&nbsp;&nbsp; 
								 <span className='display-inline-block'> 
									<ul className=' no-padding-left'> 
										<div className="row no-margin">
											<h3 className='profilehover remove-margin-bottom display-inline-block'>{data.header}</h3> 
											<h6 className={"link  display-inline-block  remove-margin-bottom "} onClick={this.change.bind(null,"header","notImage")}>&nbsp;&nbsp;&nbsp;{change}</h6>
										</div>
										<div className="row no-margin">
											<h5 className='link  display-inline-block  remove-margin-top'>{subHeader}</h5> 
											<h6 className="link  display-inline-block  remove-margin-top" onClick={this.change.bind(null,"subHeader","notImage")}>&nbsp;&nbsp;&nbsp;{change}</h6>
										</div>
									</ul> 
								  </span> 								  
							</div> 
						</div>
						<div className={"row no-margin "+systemRel} ref={(e)=>{this.systemRelations=e}}>
			                {
			                	["a"].map(function(temp){
			                		console.log(self.state.systemRelations);
			                		if(relations.indexOf("Like")!=-1){
			                			return (<div key={global.guid()} className={"display-inline-block "}><span  className="fa fa-heart-o">&nbsp;</span> &nbsp;&nbsp;</div>)
			                		}else{
			                			return(<div key={global.guid()} className="hidden"></div>)
			                		}
		                		})
		                	}
		                	{
	                			["a"].map(function(temp){
			                		if(relations.indexOf("Follow")!=-1){
			                			return (<div key={global.guid()} className={"display-inline-block "}><span   className="fa fa-rss">&nbsp;</span>&nbsp;&nbsp;</div>)
			                		}else{
			                			return(<div  key={global.guid()} className="hidden"></div>)
			                		}
		                		})
	
			                }
			            </div>
						<div className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-top-gap "+self.props.edit!=undefined?"":"hidden"}>
						{
							["a"].map(function(temp){
								if(self.props.edit=="edit"){
									return (<div key={global.guid()} className={"col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding margin-top-gap "}>
												<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding margin-bottom-gap">
													ADD SYSTEM PROPERTIES&nbsp;&nbsp;&nbsp;								 
												 	<input type="radio" name="systemRelations" value="Yes" onClick={self.systemRelation}/>
												 	<span>&nbsp;</span>
													<span className="fieldText no-padding-left ">Yes</span>
													<span>&nbsp;&nbsp;</span>
													<input type="radio" name="systemRelations" value="No"  onClick={self.systemRelation} />
													<span >&nbsp;</span>
													<span className="fieldText no-padding-left ">No</span>
									           </div>
									           <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding ">
													<button className="btn upload-drop-zone pull-right" onClick={self.callback}>SAVE SECTION</button>
													<button className="btn upload-drop-zone pull-left" onClick={self.props.cancel}>CANCEL</button>
												</div>
											</div>)
								}else{
									return (<div key={global.guid()} className="hidden"></div>)
								}
							})
						}
						
						</div>	
					</div>)
		}else{
			return(<div>Banner</div>)
		}
	}
})

var CardLayoutPreview=React.createClass({
	getInitialState: function() {
	    return {systemRelations:(this.props.systemRelations!=undefined)?this.props.systemRelations:"No",previewRecord: DefinitionStore.getDefinition("PreviewRecord"),data:{},layout:(this.props.layout!=undefined &&  Object.keys(this.props.layout).length >0)?this.props.layout:{},objectDataViews:(this.props.objectDataViews!=undefined &&  Object.keys(this.props.objectDataViews).length >0)?this.props.objectDataViews:{},css:(this.props.css!=undefined &&  Object.keys(this.props.css).length >0)?this.props.css:{}};
	},
	_onChange:function(){
		this.setState({previewRecord:DefinitionStore.getDefinition("PreviewRecord")})
	},
	componentWillUnmount: function() {
    	DefinitionStore.removeChangeListener(this._onChange);
  	},
  	componentWillReceiveProps: function(nextProps) {
		this.forceUpdate();
	},
  	loadData:function(){
		var props=this.props;
		var state=this.state;
  		var self=this;
		var properties=Object.assign({},this.props.fullSchema["@properties"]);
		Object.assign(properties,this.props.fullSchema["@sysProperties"]);
  		if(this.state.previewRecord && Object.keys(this.state.previewRecord).length > 0){
	  		if(Object.keys(state.layout).length > 0){
	  			var layData={};
		  		Object.keys(state.layout).map(function(temp){
		  			
		  			layData[temp]=(state.layout[temp]!="" && typeof state.layout[temp]!="object" && properties[state.layout[temp]]!=undefined)?self.state.previewRecord[properties[state.layout[temp]].dataType.type]:(typeof state.layout[temp]!="object"?"":self.state.previewRecord["struct"]);
		  		})
		  		this.setState({data:layData},function(){
		  			self.showSystemRelations();
		  		})
	  		}else{
	  			var layData={};
	  			var layout={
		            "profileImage": "image",
		            "name": "text",
		            "address": "struct",
		            "images": "images",
		            "about": "textarea"
	  			}
	  			Object.keys(layout).map(function(temp){
		  			layData[temp]=layout[temp]!=""?self.state.previewRecord[layout[temp]]:"";
		  		})
	  			this.setState({data:layData},function(){
	  				self.showSystemRelations();
	  			})
	  		}
  		}
  	},
  	shouldComponentUpdate: function(nextProps, nextState) {
  		return (JSON.stringify(this.state.data)!= JSON.stringify(nextState.data) || JSON.stringify(this.state.previewRecord)!= JSON.stringify(nextState.previewRecord));
	},
	saveProperty:function(field,property,objRef,cssSelected){
  		var self=this;
  		var objectDataViews=(this.state.objectDataViews!=undefined && Object.keys(this.state.objectDataViews).length>0)?this.state.objectDataViews:{};
  		var tempProperty=typeof property!="object"?property:Object.keys(property)[0];
  		if(objRef!="" && objRef!=undefined){
  			objectDataViews[tempProperty]=objRef;
  		}
  		var css=(this.state.css!=undefined && Object.keys(this.state.css).length>0)?this.state.css:{};
  		if(cssSelected!=undefined){
  			if(typeof tempProperty=="object"){
  				css[Object.keys(tempProperty)[0]]=cssSelected;
  			}else{
  				css[tempProperty]=cssSelected;
  			}
  		}
  	/*	var css=this.state.css;
  		if(css!="" && css!=undefined){
  			css[tempProperty]=cssSelected;
  		}*/
  		var layout=this.state.layout;
  		layout[field]=property;
  		this.setState({layout:layout,objectDataViews:objectDataViews,css:css},function(){
  			self.loadData();
  		});
	},
	change:function(layout,dataType){
  	 	manageSchemaNew.getPopupContent("Select Property","");
    	ReactDOM.render(<PropertyEdit layout={this.state.layout} reqDataType={dataType} callback={this.saveProperty} objRef={this.state.objectDataViews} css={this.state.css} outProperties={this.props.outProperties} editField={layout} fullSchema={this.props.fullSchema} edit={this.props.edit}  />,document.getElementById('genericPopupBody'));
  	},
  	saveLayout:function(){
  		var newSchema=this.props.fullSchema;
  		if(this.props.edit){
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.layout=this.state.layout;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.objectDataViews=this.state.objectDataViews;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.css=this.state.css;
  			newSchema["@operations"]["read"][this.props.viewName].UILayout.systemRelations=this.state.systemRelations;
  		}else{
  			if(this.props.newLayout){
  				var data={};
  				data["UILayout"]={
  					"type":"card",
  					"layout":this.state.layout,"objectDataViews":this.state.objectDataViews,"css":this.state.css,"systemRelations":this.state.systemRelations
  				}
  				if(typeof newSchema["@operations"]!="object"){
  					newSchema["@operations"]={}
  				}
  				if(typeof newSchema["@operations"]["read"]!="object"){
  					newSchema["@operations"]["read"]={}
  				}
  				newSchema["@operations"]["read"][this.props.viewName]=data;
  			}
  		}
  		$(".deleteIcon").click();
  		this.props.callback(newSchema);
  	},
	componentDidMount : function(){
	  	ActionCreator.getDefinition("PreviewRecord");
	  	var self=this;
		DefinitionStore.addChangeListener(this._onChange);
		if(Object.keys(this.state.layout).length >0){
				this.loadData();
		}else{
			var layout={
				"profileImage":"",
				"images":"",
				"namelayout":"",
				"address":"",
				"about":""
			};
			this.setState({layout:layout},function(){
				self.loadData();
			});
		}
		
		
	},
	systemRelation:function(){
		var self=this;
		var value=$("input[name='systemRelations']:checked").val();
		this.setState({systemRelations:value},function(){
			self.showSystemRelations();
		})
	},
	showSystemRelations:function(){
		if(this.state.systemRelations=="Yes"){
			this.systemRelations.className="row no-margin";
		}else{
			this.systemRelations.className+=" hidden"
		}
		if($("input[name='systemRelations']:checked").val()==undefined){
			$("input[name='systemRelations'][value='"+this.state.systemRelations +"']").click();
		}
	},
	componentDidUpdate:function(){
		this.loadData();
	},
	render:function(){
		var self=this;
		if(Object.keys(this.state.data).length>0){
			var data=this.state.data;
			var profileImage="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1441279368/"+"default_image"+".jpg";
			 if(data.profileImage && data.profileImage[0] && data.profileImage[0].cloudinaryId ){
			 	if(data.profileImage[0].cloudinaryId.indexOf("http")!=0){
		    		profileImage="https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_150,w_150/v1441279368/"+data.profileImage[0].cloudinaryId+".jpg";
				}else{
					profileImage=data.profileImage[0].cloudinaryId;
				}
			}
			Object.keys(data).map(function(data){
				if(typeof data[data] =="object" && !Array.isArray(data[data])){
					var objData="";
					Object.keys(data[data]).map(function(innerData){
						objData+=data[data][innerData]+" ";
					})
					data[data]=objData;
				}
			})
			var relations=[];
			if(this.props.fullSchema["@relations"] && Object.keys(this.props.fullSchema["@relations"]).length>0){
				Object.keys(this.props.fullSchema["@relations"]).map(function(temp){
						relations.push(self.props.fullSchema["@relations"][temp].relationRefSchema);
				})
			}
			return(<div className="row no-margin" >
						<h4 className="margin-bottom-gap">Card Layout Preview </h4>
				          <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12 no-padding-left form-group  ">
				            <div className="row remove-margin-right remove-margin-left form-group ">
					               <div className="col-lg-5 col-md-5 col-sm-5 col-xs-4 no-padding-left" >
					                    <img src={profileImage} className="pull-left   img-holder profilePicture profilehover"/>
					                    <h6 className="link no-margin cardProfile" onClick={this.change.bind(null,"profileImage","image")}>Change</h6>
					                </div>
					                <div className="col-lg-7 col-md-7 col-sm-7 col-xs-8 no-padding-left ">
						                <div className="row pointer no-margin ">  
						                   <div className="namehover">
							                   <span> {(data.name!="" && data.name!=undefined)?data.name.toString():"No Property was selected"}</span>
							                   <span className="link no-margin cardName extra-padding no-padding-left" style={{"font-size":"12px"}} onClick={this.change.bind(null,"name","notImage")}>Change</span>
						                	</div>
						                  	<h6  className="no-margin addresshover"><span className="subheader">{(data.address!="" && data.address!=undefined)?data.address.toString():"No Property was selected"}</span><h6 className="link no-margin cardAddress" onClick={this.change.bind(null,"address","notImage")}>Change</h6></h6>
						                </div>
							            <div className="row no-margin hidden" ref={(e)=>{this.systemRelations=e}}>
							                {
							                	["a"].map(function(temp){
							                		if(relations.indexOf("Like")!=-1){
							                			return (<div key={global.guid()} className={"display-inline-block "}><span  className="fa fa-heart-o">&nbsp;</span> &nbsp;&nbsp;</div>)
							                		}else{
							                			return(<div key={global.guid()} className="hidden"></div>)
							                		}
						                		})
						                	}
						                	{
					                			["a"].map(function(temp){
							                		if(relations.indexOf("Follow")!=-1){
							                			return (<div key={global.guid()} className={"display-inline-block "}><span   className="fa fa-rss">&nbsp;</span>&nbsp;&nbsp;</div>)
							                		}else{
							                			return(<div key={global.guid()} className="hidden"></div>)
							                		}
						                		})
					
							                }
							            </div>
					              	</div>
				           	 </div>
				          </div>
				          <div className="col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding-left form-group  mobile-padding-left ">
				            <div itemProp="description" className="row no-margin">
				             	<ul className="list-unstyled abouthover">
					             	<li>
					              		<span ref={(e)=>{this.about=e}}>{(data.about!="" && data.about!=undefined)?data.about:"No Property was selected" }</span>
					               	</li>
					              	 <li style={{"font-size":"12px"}} className="link no-margin cardAbout" onClick={this.change.bind(null,"about","notImage")}>Change</li>
					            	</ul>
				              </div>
				              <div className="imagehover">
				              {
				              	["a"].map(function(temp){
						    		if(data.images.length > 0){			
							              return data.images.map(function(image,index){
								               	if(index < 3){
									               	if(image.cloudinaryId){
									               		if(image.cloudinaryId.indexOf("http")!=0){
															image.cloudinaryId="https://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_250/v1441279368/"+image.cloudinaryId+".jpg";
														}
									                return (<div key={global.guid()} itemProp="image" key={global.guid()} className="col-lg-4 col-md-4 col-sm-6 col-xs-6  no-padding-left">
									                        
									                        <div className="thumbnail-picture  img-holder " >
									                        <div className="img  " style={{"background-image":"url('"+image.cloudinaryId+"')"}}></div>     
									                        </div>  
									                    </div>)
									                 }else{
									                 	var defaultImg="https://res.cloudinary.com/dzd0mlvkl/image/upload/v1441279368/"+"default_image"+".jpg";
											
									                 	return(<div  key={global.guid()} className="col-lg-4 col-md-4 col-sm-6 col-xs-6 form-group no-padding-left">
											                        <div className="thumbnail-picture  img-holder ">
											                        <div className="img" style={{"background-image":"url('"+defaultImg+"')"}}></div>     
											                        </div>  
											                    </div>) 
									                 }
								                 }else{
								                 	return(<div key={global.guid()}  className="hidden"></div>)
								                 }
							              })
						             }else{
					                 	return(<div key={global.guid()}  className="">No Property was selected</div>)
					                 }
					              })
					            }
				            	</div>
		           				 <h6 className="link no-margin col-lg-12 col-sm-12 col-md-12 col-xs-12 no-padding-left cardImage" onClick={this.change.bind(null,"images","image")}>Change</h6>
		           			</div>
				           <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding parent-img-component">
									ADD SYSTEM PROPERTIES&nbsp;&nbsp;&nbsp;								 
								 	<input type="radio" ref={(e)=>{this.systemRelationsYes=e}} name="systemRelations" value="Yes" onClick={this.systemRelation}/>
								 	<span>&nbsp;</span>
									<span className="fieldText no-padding-left ">Yes</span>
									<span>&nbsp;&nbsp;</span>
									<input type="radio" ref={(e)=>{this.systemRelationsNo=e}} name="systemRelations" value="No"  onClick={this.systemRelation} />
									<span >&nbsp;</span>
									<span className="fieldText no-padding-left ">No</span>
				           </div>
				           <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
					           <label className="pull-right">
									<input type='button' className="btn  btn-warning" value='SAVE LAYOUT' onClick={this.saveLayout}/>
								</label>
							</div>
			          </div>)
          }else{
          	return(<div className="hidden"></div>)
          }
	}
})
