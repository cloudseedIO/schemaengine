/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var global=require('../../utils/global.js');

function editNavigation(){
	common.startLoader();
	
	WebAPI.getDefinition(common.getConfigDetails().cloudPointNavDocId,function(data){
		common.stopLoader();
		if(data.error){
			alert(data.error);
		}else{
			 ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
		     common.clearMainContent();
		     ReactDOM.render(<NavViewer nav={data}/>,document.getElementById('dynamicContentDiv'));
	  		 common.adjustDivs();
		}
	});
}
exports.editNavigation=editNavigation;

var EditNavigation=React.createClass({
	getInitialState:function(){
		return {navDoc:undefined}
	},
	componentDidMount:function(){
		common.startLoader();
		var self=this;
		WebAPI.getDefinition(common.getConfigDetails().cloudPointNavDocId,function(data){
			common.stopLoader();
			if(data.error){
				alert(data.error);
			}else{
				self.setState({navDoc:data});
				common.adjustDivs();
			}
		});
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		if(this.state.navDoc){
			return <NavViewer nav={this.state.navDoc}/>
		}else{
			return <div>Fetching Navigation Document...</div>
		}
	}
});
exports.EditNavigation=EditNavigation;

var NavViewer=React.createClass({
	editNav:function(){
		ReactDOM.render(<NavEditor nav={this.props.nav}/>,document.getElementById('dynamicContentDiv'));
	},
	componentDidMount:function(){
		common.clearFilters();
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		if(this.props.nav && this.props.nav.elements){
			return (<div className="row">
				{
					this.props.nav.elements.map(function(element){
						return (<div className="row">
									<NavDetailer element={element}/>
								</div>)
					})
				}
				<br/>
				<input type="submit"  value="EDIT" className="action-button" onClick={this.editNav}/>
			</div>)
		}else{
			return <div>Not Found!</div>
		}
	}
})

var NavDetailer=React.createClass({
	render:function(){
		if(typeof this.props.element.target!="undefined"){
			if(typeof this.props.element.target.schema!="undefined"){
				return (<li key={global.guid()} className="toggleOnClickLater navElement">
							<span className="link">{this.props.element.displayName}</span>
						</li>)
			}else if(Array.isArray(this.props.element.target.elements)){
				var toggleId=global.guid();
				return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
							<ul key={"navlink"+global.guid()} className="list-unstyled no-padding-left navElementRoot"> 
								<div className="col-lg-2 no-padding-left">
									<li data-toggle="collapse" data-target={"#"+toggleId}>
										<h5 classnav="remove-margin-bottom text-uppercase ">
											<span className="nav-link">{this.props.element.displayName}</span>
										</h5>
									</li>
								</div>
								<div className="col-lg-10">
									<div className="padding"></div>
									<ul id={toggleId} className="collapse  list-unstyled no-padding-left">
									{
										this.props.element.target.elements.map(function(element){
											return <NavDetailer element={element}/>
										})
									}
								</ul>
								</div>
							</ul>
						</div>)
			}else{
				return <div></div>
			}
		}else{
			return <div></div>
		}
	}
})

var NavEditor=React.createClass({
	getInitialState:function(){
		return {nav:this.props.nav}
	},
	saveNav:function(){
		common.startLoader();
		WebAPI.doPost("/generic?operation=saveNavigation",{nav:this.state.nav},function(data){
			common.stopLoader();
			if(data && data.error){
				alert(data.error);
			}
			editNavigation();
		});
	},
	updateNav:function(index,element){
		var nav=this.state.nav;
		if(index=="0"){
			nav.elements.push(element)
		}else{
			index=index.replace("0,","");
			index="nav.elements["+index.replace(/\,/g,"].target.elements[")+"]";
			if(eval(index).target && eval(index).target.elements){
				eval(index).target.elements.push(element);
			}else{
				eval(index+"="+JSON.stringify(element));
			}
		}
		this.setState({nav:nav});
	},
	updateGroupDisplayName:function(index,displayName){
		var nav=this.state.nav;
		index=index.replace("0,","");
		index="nav.elements["+index.replace(/\,/g,"].target.elements[")+"]";
		eval(index).displayName=displayName;
		this.setState({nav:nav});
	},
	updateGroupLanding:function(index,landingPage){
		landingPage=landingPage.trim();
		if(landingPage && landingPage!=""){
			var nav=this.state.nav;
			index=index.replace("0,","");
			index="nav.elements["+index.replace(/\,/g,"].target.elements[")+"]";
			eval(index).target.landingPage=landingPage;
			this.setState({nav:nav});
		}else{
			var nav=this.state.nav;
			index=index.replace("0,","");
			index="nav.elements["+index.replace(/\,/g,"].target.elements[")+"]";
			eval(index).target.landingPage=undefined;
			this.setState({nav:nav});
		}
	},
	deleteNav:function(index){
		var nav=this.state.nav;
		if(index=="0"){
			return;
		}else{
			var lastDeleteIndex=index.substr(index.lastIndexOf(",")+1);
			index=index.substr(0,index.lastIndexOf(","));
			index=index.replace("0,","");
			if(index=="0"){
				index="nav.elements.splice("+lastDeleteIndex*1+",1)";
			}else{
				index="nav.elements["+index.replace(/\,/g,"].target.elements[")+"].target.elements.splice("+lastDeleteIndex*1+",1)";
			}
			eval(index)
		}
		this.setState({nav:nav});
	},
	moveUp:function(index){
		var nav=this.state.nav;
		if(index=="0"){
			return;
		}else{
			var lastUpdateIndex=index.substr(index.lastIndexOf(",")+1);
			index=index.substr(0,index.lastIndexOf(","));
			index=index.replace("0,","");
			var con="";
			var old_index=lastUpdateIndex*1;
			var new_index=lastUpdateIndex*1-1;
			if(index=="0"){
				con="nav.elements";
			}else{
				con="nav.elements["+index.replace(/\,/g,"].target.elements[")+"].target.elements";
			}
			if(new_index>=0 && new_index<eval(con+".length")){
				eval(con+".splice("+new_index+", 0, "+con+".splice("+old_index+", 1)[0])")
			}
		}
		this.setState({nav:nav});
	},
	moveDown:function(index){
		var nav=this.state.nav;
		if(index=="0"){
			return;
		}else{
			var lastUpdateIndex=index.substr(index.lastIndexOf(",")+1);
			index=index.substr(0,index.lastIndexOf(","));
			index=index.replace("0,","");
			var con="";
			var old_index=lastUpdateIndex*1;
			var new_index=lastUpdateIndex*1+1;
			if(index=="0"){
				con="nav.elements";
			}else{
				con="nav.elements["+index.replace(/\,/g,"].target.elements[")+"].target.elements";
			}
			if(new_index>=0 && new_index<eval(con+".length")){
				eval(con+".splice("+new_index+", 0, "+con+".splice("+old_index+", 1)[0])")
			}
		}
		this.setState({nav:nav});
	},
	componentDidMount:function(){
		try{
			document.getElementById("sideFilterNavigation").innerHTML="";
			document.getElementById("sideFilterNavigation").className="col-xs-12 col-sm-3  col-lg-2 col-md-2 "
		}catch(err){
			
		}
	},
	render:function(){
		if(this.props.nav && this.props.nav.elements){
			return (<div className="row" key={global.guid()}>
						<NavInner element={this.state.nav} 
								index="0" 
								updateNav={this.updateNav} 
								updateGroupDisplayName={this.updateGroupDisplayName} 
								updateGroupLanding={this.updateGroupLanding}
								deleteNav={this.deleteNav}
								moveUp={this.moveUp}
								moveDown={this.moveDown}/>
						<br/>
						<input type="submit"  value="SAVE" className="action-button" onClick={this.saveNav}/>
						</div>)
		}else{
			return <div>Not Found!</div>
		}
	}
})

var NavInner=React.createClass({
	headingChanged:function(){
		this.props.updateGroupDisplayName(this.props.index,this.groupHeading.value);
	},
	landingChanged:function(){
		this.props.updateGroupLanding(this.props.index,this.groupLanding.value);
	},
	saveNav:function(element){
		this.props.updateNav(this.props.index,element);
	},
	addNav:function(index){
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<CreateOrEditNav callback={this.saveNav} popUpId={popUpId} />,document.getElementById(contentDivId));
	},
	editNav:function(){
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<CreateOrEditNav callback={this.saveNav} popUpId={popUpId}  element={{navType:"single",nav:this.props.element}}/>,document.getElementById(contentDivId));
	},
	render:function(){
		var self=this;
		if(this.props.element.elements && Array.isArray(this.props.element.elements)){
			return (<div>
					{
						this.props.element.elements.map(function(element,index){
							var ni=self.props.index;
							ni+=","+index;
							return (<div className="row">
										<NavInner element={element} 
												index={ni} 
												updateNav={self.props.updateNav} 
												updateGroupDisplayName={self.props.updateGroupDisplayName} 
												updateGroupLanding={self.props.updateGroupLanding}
												deleteNav={self.props.deleteNav}
												moveUp={self.props.moveUp}
												moveDown={self.props.moveDown}/>
									</div>)
						})
					}
					<button type='submit' className="upload-btn" onClick={this.addNav}>ADD</button>
				</div>)
		}else if(this.props.element.target && typeof this.props.element.target.schema !="undefined"){
			return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 navLinkEdit">
						<div className="child-img-component">
							<div title={"Click to move up"} className="sleekIcon-arrows_up fa-2x link controlls" onClick={this.props.moveUp.bind(null,this.props.index)}></div>
							<div title={"Click to move down"} className="sleekIcon-arrows_down fa-2x link controlls" onClick={this.props.moveDown.bind(null,this.props.index)}></div>
						</div>
						<div className="child-img-component link"  title={"Click to edit"}  onClick={this.editNav}>{this.props.element.displayName?this.props.element.displayName:""}</div>
						<div className="child-img-component link controlls"  title={"Click to delete"} onClick={this.props.deleteNav.bind(null,this.props.index)}><span className="icons8-delete fa-2x link"/></div>
					</div>)
		}else if(this.props.element.target && this.props.element.target.elements && Array.isArray(this.props.element.target.elements)){
			return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12">
						<div className="col-lg-2 no-padding-left navLinkEdit">
							<div className="child-img-component">
								<div title={"Click to move up"} className="sleekIcon-arrows_up fa-2x link controlls" onClick={this.props.moveUp.bind(null,this.props.index)}></div>
								<div title={"Click to move down"} className="sleekIcon-arrows_down fa-2x link controlls" onClick={this.props.moveDown.bind(null,this.props.index)}></div>
							</div>
							<div className="child-img-component link"  title={"Click to edit"} >
								<input className="form-control border-none no-padding" ref={(e)=>{this.groupHeading=e}} defaultValue={this.props.element.displayName} onBlur={this.headingChanged}/>
							</div>
							<div className="child-img-component link controlls"  title={"Click to delete"}  onClick={this.props.deleteNav.bind(null,this.props.index)}><span className="icons8-delete fa-2x link"/></div>
						</div>
						<div className="col-lg-10"> 
						<div className="child-img-component link"  title={"Click to edit"} >
							<input className="form-control border-none no-padding" placeholder="LandingPage Id" ref={(e)=>{this.groupLanding=e}} defaultValue={this.props.element.target.landingPage?this.props.element.target.landingPage:""} onBlur={this.landingChanged}/>
						</div>
						{
							this.props.element.target.elements.map(function(element,index){
								var ni=self.props.index;
								ni+=","+index;
								return <NavInner element={element} 
											index={ni} 
											updateNav={self.props.updateNav}  
											updateGroupDisplayName={self.props.updateGroupDisplayName}
											updateGroupLanding={self.props.updateGroupLanding}
											deleteNav={self.props.deleteNav}
											moveUp={self.props.moveUp}
											moveDown={self.props.moveDown}/>
							})
						}
						<button type='submit' className="upload-btn" onClick={this.addNav}>ADD</button>
						</div>
					</div>)
				
		}else{
			return <div></div>
		}
	}
})

var CreateOrEditNav=React.createClass({
	getInitialState:function(){
		if(this.props.element){
			return this.props.element
		}else{
			return {navType:undefined,nav:undefined}
		}
	},
	setNavType:function(navType){
		if(navType=="single"){
			this.setState({
					"navType":navType,
					"nav":{
						"displayName": "",
						"target": {
							"schema": "",
							"filters": {
							}
						}
					}
				});
		}else if(navType=="group"){
			this.setState({
				"navType":navType,
				"nav":{
		          "displayName": "",
		          "target": {
		            "elements": [
		              
		            ]
		          }
		        }
			});
		}
	},
	saveNav:function(){
		var self=this;
		var displayName=this.displayName.value;
		if(displayName==""){
			this.displayNameError.className=""
			return;
		}
		var state=this.state;
		state.nav.displayName=displayName
		if(this.state.navType=="single"){
			if(this.profileLink.checked){
				state.nav.profileLink="true";
			}
			if(this.iconLink.value!=""){
				state.nav.profileLink=this.iconLink.value;
			}
			state.nav.navType=this.navType.value;
			var schemaName=this.schemaName.value;
			var dsName=this.dependentSchemaName.value;
			var filters=this.filters.value;
			if(schemaName==""){
				this.schemaNameError.className="";
					return;
			}
			if(dsName==""){
				dsName=undefined;
			}
			if(filters!=""){
				try{
					filters=JSON.parse(filters);
				}catch(err){
					this.filtersError.className="";
					return;
				}
			}
			state.nav.target.schema=schemaName;
			state.nav.target.dependentSchema=dsName;
			state.nav.target.filters=filters;
		}
		this.setState(state,function(){
			self.props.callback(self.state.nav);
			common.showMainContainer();
			document.getElementById(self.props.popUpId).parentNode.remove();
		})
	},
	render:function(){
		if(this.state.navType==undefined){
			return (<div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<h3>Please Select Link Type</h3>
						</div>
						<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
							<button type='submit' className="upload-btn" onClick={this.setNavType.bind(this,"single")}>Single</button>
						</div>
						<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
							<button type='submit' className="upload-btn" onClick={this.setNavType.bind(this,"group")}>Group</button>
						</div>
					</div>)
		}else if(this.state.navType=="single"){
			return (<div className="row form-group">
						<div className="row form-group">
							<input type="text" ref={(e)=>{this.displayName=e}} className="form-control" placeholder="Enter link display name" defaultValue={this.props.element?this.props.element.nav.displayName:""}/>
							<span className="hidden" style={{color:"red"}} ref={(e)=>{this.displayNameError=e}}>Please enter displayName</span>
						</div>
						<div className="row form-group">
							<div className="child-img-component">Is this Profile link</div>
							<div className="child-img-component"><input type="checkbox" ref={(e)=>{this.profileLink=e}}  defaultChecked={this.props.element?(this.props.element.nav.profileLink?true:false):false}/></div>
						</div>
						<div className="row form-group">
							<div className="child-img-component">Is this Icon link</div>
							<div className="child-img-component"><input type="text" ref={(e)=>{this.iconLink=e}}  defaultValue={this.props.element?(this.props.element.nav.iconLink?this.props.element.nav.iconLink:""):""}/></div>
						</div>
						<div className="row form-group">
							<div className="child-img-component">Select Link Type</div>
							<div className="child-img-component">
								<select ref={(e)=>{this.navType=e}} defaultValue={(this.props.element && this.props.element.nav && this.props.element.nav.navType !=undefined)?this.props.element.nav.navType:"public"}>
									<option value="both">both</option>
									<option value="public">public</option>
									<option value="org">org</option>
								</select>
							</div>
						</div>
						<div className="row form-group">
							<div className="row form-group">
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">Schema Name</div>
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
									<input type="text" ref={(e)=>{this.schemaName=e}} className="form-control" placeholder="Enter Schema name"  defaultValue={this.props.element?this.props.element.nav.target.schema:""}/>
									<span className="hidden" style={{color:"red"}} ref={(e)=>{this.schemaNameError=e}}>Please enter Schema name</span>
								</div>
							</div>
							<div className="row form-group">
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">Dependent Schema Name</div>
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
									<input type="text" ref={(e)=>{this.dependentSchemaName=e}} className="form-control" placeholder="Enter Dependent schema name"  defaultValue={this.props.element?this.props.element.nav.target.dependentSchema:""}/>
								</div>
							</div>
							<div className="row form-group">
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">Filters</div>
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
									<textarea type="text" ref={(e)=>{this.filters=e}} className="form-control" placeholder="Enter Filters"  defaultValue={this.props.element?JSON.stringify(this.props.element.nav.target.filters):""}/>
									<span className="hidden" style={{color:"red"}} ref={(e)=>{this.filtersError=e}}>Error while parsing filters!</span>
								</div>
							</div>
						</div>
						<div className="row form-group">
							<input type="submit"  value="SAVE" className="action-button" onClick={this.saveNav}/>
						</div>
					</div>)
		}else if(this.state.navType=="group"){
			return (<div className="row form-group">
						<div className="row form-group">
							<input type="text" ref={(e)=>{this.displayName=e}} className="form-control" placeholder="Enter link display name"/>
							<span className="hidden" ref={(e)=>{this.displayNameError=e}}>Please enter displayName</span>
						</div>
						<div className="row form-group">
							<input type="submit"  value="SAVE" className="action-button" onClick={this.saveNav}/>
						</div>
					</div>)
		}
	}
});
