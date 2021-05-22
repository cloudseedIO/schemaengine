/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var global=require('../../utils/global.js');

function editConfig(){
	common.startLoader();
	WebAPI.getDefinition(common.getConfigDetails().recordId,function(data){
		common.stopLoader();
		if(data.error){
			alert(data.error);
		}else{
			 ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
		     common.clearMainContent();
		     ReactDOM.render(<ConfigEditor config={data}/>,document.getElementById('dynamicContentDiv'));
	  		if(common.getConfigDetails() && common.getConfigDetails().handleBarTemplate && (common.getConfigDetails().handleBarTemplate=="jsm" || common.getConfigDetails().handleBarTemplate=="wevaha")){  			
	  			document.getElementById("sideFilterNavigation").className="col-xs-12 col-sm-3  col-lg-2 col-md-2 ";
	  			document.getElementById("dynamicContentDiv").className="col-xs-12 col-sm-9  col-lg-10 col-md-10 ";
	  		}
		}
	});
}
exports.editConfig=editConfig;

var EditConfig=React.createClass({
	getInitialState:function(){
		return {config:undefined};
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
	},
	componentDidMount:function(){
		common.startLoader();
			WebAPI.getDefinition(common.getConfigDetails().recordId,function(data){
				common.stopLoader();
				if(data.error){
					alert(data.error);
				}else{
					if(!this._isUnmounted)
					 this.setState({config:data});
					 if(common.getConfigDetails() && common.getConfigDetails().handleBarTemplate && (common.getConfigDetails().handleBarTemplate=="jsm" || common.getConfigDetails().handleBarTemplate=="wevaha")){  			
			  			document.getElementById("sideFilterNavigation").className="col-xs-12 col-sm-3  col-lg-2 col-md-2 ";
			  			document.getElementById("dynamicContentDiv").className="col-xs-12 col-sm-9  col-lg-10 col-md-10 ";
			  		}
				}
			}.bind(this));
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		if(this.state.config){
			return <ConfigEditor config={this.state.config}/>
		}else{
			return <div>Fetching  config..</div>
		}
	}
});
exports.EditConfig=EditConfig;


var ConfigEditor=React.createClass({
	getInitialState:function(){
		return {current:undefined}
	},
	setCurrent:function(mode){
		this.setState({current:mode});
	},
	render:function(){
		if(this.state.current==undefined){
			return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
						<div className="link" onClick={this.setCurrent.bind(null,"branding")}>Edit Branding</div>
						<div className="link" onClick={this.setCurrent.bind(null,"htmlToInclude")}>Edit HTML To Include</div>
				</div>)
		}else if(this.state.current=="branding"){
			return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
						<EditBranding branding={JSON.parse(JSON.stringify(this.props.config.branding))}/>
						<br/><br/>
					</div>)
		}else if(this.state.current=="htmlToInclude"){
			return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
						<EditHTMLToInclude html={this.props.config.htmlToInclude}/>
						<br/><br/>
					</div>)
		}
	}
});
var EditBranding=React.createClass({
	getInitialState:function(){
		return {branding:this.props.branding}
	},
	saveStyle:function(style){
		var branding=this.state.branding;
		branding[style.styleName]=style;
		
		if(branding[style.styleName].type==undefined){
			delete branding[style.styleName].type;
		}
		delete branding[style.styleName].styleName;
		this.setState({branding:branding})
	},
	deleteStyle:function(key){
		var branding=this.state.branding;
		delete branding[key];
		this.setState({branding:branding});
	},
	save:function(){
		common.startLoader();
		WebAPI.saveBranding(this.state.branding,function(data){
			common.stopLoader();
			if(data && data.error){
				alert(data.error)
			}
			editConfig();
		});
	},
	addOrEditStyle:function(styleName,style){
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<AddOrEditStyle callback={this.saveStyle} styleName={styleName} style={style} popUpId={popUpId} />,document.getElementById(contentDivId));
	},
	render:function(){
		var self=this;
		return (<div>
			{
				Object.keys(this.state.branding).map(function(key){
					return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding form-group">
								<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2 uppercase link" onClick={self.addOrEditStyle.bind(null,key,self.state.branding[key])}>{key}</div>
								<div className="col-lg-8 col-sm-8 col-xs-8 col-md-8 no-padding link" onClick={self.addOrEditStyle.bind(null,key,self.state.branding[key])}>
									<StyleView style={self.state.branding[key]}/>
								</div>
								<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2 link">
									<span className="icons8-delete fa-2x link" onClick={self.deleteStyle.bind(null,key)}/>
								</div>
						</div>)
				})
			}
			<button type='submit' className="upload-btn" onClick={this.addOrEditStyle.bind(null,undefined,undefined)}>ADD STYLE</button>
			<br/><br/>
			<input type="submit"  value="SAVE" className="action-button" onClick={this.save}/>
			</div>)
	}
});
var StyleView=React.createClass({
	render:function(){
		var self=this;
		return (<div>
		{
			Object.keys(self.props.style).map(function(key){
				if(key=="type"){
					return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding form-group">
								<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2">{key}</div>
								<div className="col-lg-10 col-sm-10 col-xs-10 col-md-10">{self.props.style[key]}</div>
							</div>)
				}
				return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding form-group">
					<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2">{key}</div>
					<div className="col-lg-10 col-sm-10 col-xs-10 col-md-10">
					{
						Object.keys(self.props.style[key]).map(function(innerKey){
							var color=""
							if(typeof self.props.style[key][innerKey]=="string" && 
									self.props.style[key][innerKey].indexOf("#")==0){
								color=<div style={{"height": "10px", "width": "10px", "border": "1px solid black", "background-color": self.props.style[key][innerKey], "display": "inline-block"}}></div>
							}
							return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
								<div  className="child-img-component">{innerKey}</div>
								<div  className="child-img-component">{self.props.style[key][innerKey]} &nbsp;&nbsp;&nbsp;&nbsp; {color}</div>
							</div>)
						})
					}
					</div>
					</div>)
			})
		}
		</div>)
	}
});

var AddOrEditStyle=React.createClass({
	getInitialState:function(){
		return {
				styleName:this.props.styleName?this.props.styleName:"",
				normal:(this.props.style && this.props.style.normal)?this.props.style.normal:{},
				hover:(this.props.style && this.props.style.hover)?this.props.style.hover:{},
				active:(this.props.style && this.props.style.active)?this.props.style.active:{},
				appStyle:(this.props.style && this.props.style.appStyle)?this.props.style.appStyle:{},
				type:(this.props.style && this.props.style.type)?this.props.style.type:undefined,
		}
	},
	typeChanged:function(){
		if(this.styleType.checked){
			this.setState({type:"relGroup"})
		}else{
			this.setState({type:undefined});
		}
	},
	changeStyleName:function(){
		this.setState({styleName:this.styleName.value})
	},
	deleteStyle:function(group,key){
		var state=this.state;
		delete state[group][key];
		this.setState(state);
	},
	addStyle:function(group){
		var key=this[group+"Key"].value;
		var value=this[group+"Value"].value;
		if(!isNaN(value) && group=="appStyle"){
			value=value*1;
		}
		if(key!="" && value!=""){
			var state=this.state;
			state[group][key]=value;
			this.setState(state);
		}
	},
	updateStyle:function(group,key){
		var state=this.state;
		var value=this[group+key].value;
		state[group][key]=value;
		this.setState(state);
	},
	saveStyle:function(){
		this.props.callback(this.state);
		common.showMainContainer();
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	render:function(){
	var self=this;
		
	return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding form-group">
			
				<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 form-group">
					<h4>Enter Style Name</h4>
					<input type="text" className="form-control" ref={(e)=>{this.styleName=e}} defaultValue={this.state.styleName} placeholder="Enter unique style name" onBlur={this.changeStyleName}/>
				</div>
					
				<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding">
				
				{
				
				["normal","hover","active","appStyle"].map(function(group){
			return (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 no-padding form-group" key={global.guid()}>
						<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12">
							<label>{group}</label>
						</div>
						{
							Object.keys(self.state[group]).map(function(key){
								return  (<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 form-group" key={global.guid()}>
											<div className="col-lg-10 col-sm-10 col-xs-10 col-md-10 no-padding">
												<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
													{key}
												</div>
												<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
													<input type="text" className="form-control" defaultValue={self.state[group][key]} ref={(e)=>{self[group+key]=e}} onBlur={self.updateStyle.bind(null,group,key)}/>
												</div>
											</div>
											<div className="col-lg-2 col-sm-2 col-xs-2 col-md-2 no-padding">
												<span className="icons8-delete fa-2x link" onClick={self.deleteStyle.bind(null,group,key)}/>
											</div>
										</div>)
							})
						}
						<div className="col-lg-12 col-sm-12 col-xs-12 col-md-12 form-group" key={global.guid()}>
							<div className="col-lg-10 col-sm-10 col-xs-10 col-md-10 no-padding">
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
									<input type="text" className="form-control" ref={(e)=>{self[group+"Key"]=e}} defaultValue="" onBlur={self.addStyle.bind(null,group)}/>
								</div>
								<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
									<input type="text" className="form-control" ref={(e)=>{self[group+"Value"]=e}} defaultValue="" onBlur={self.addStyle.bind(null,group)} />
								</div>
							</div>
						</div>
						
					</div>)
				})
					
					
				}
					
				<br/>
				<div className="row form-group">
					<div className="child-img-component">Is this for relation records</div>
					<div className="child-img-component"><input type="checkbox" ref={(e)=>{this.styleType=e}}  defaultChecked={(this.state.type && this.state.type!="")?true:false} onChange={this.typeChanged}/></div>
				</div>
				<br/>
				
				<input type="submit"  value="SAVE" className="action-button" onClick={this.saveStyle}/>
					
				</div>
				
			</div>)
	}
});

var EditHTMLToInclude=React.createClass({
	saveHTML:function(){
		common.startLoader();
		WebAPI.saveConfigHTML(this.html.value,function(data){
			common.stopLoader();
			if(data && data.error){
				alert(data.error)
			}
			editConfig();
		});
	},
	render:function(){
		return (<div>
					<textarea  ref={(e)=>{this.html=e}} defaultValue={this.props.html} className="form-control"/>
					<br/><br/>
					<input type="submit" value="SAVE" className="action-button" onClick={this.saveHTML}/>
				</div>)
	}
})



