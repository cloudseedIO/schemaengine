/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('./common.jsx');
var WebAPI=require("../utils/WebAPIUtils.js");
var global=require('../utils/global.js');
var SelectSchema=React.createClass({
	getInitialState:function(){
		return {allSchemaNames : [],searchText:""};
	},
	selectedSchema:function(name){
		this.props.callback(name);
		common.showMainContainer();
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	componentDidMount:function(){
		var self=this;
		common.startLoader();
		WebAPI.getAllSchemaNames(function(SchemaNames){
			common.stopLoader();
			if(SchemaNames.error){
				alert("There was an error");
			}else{
				if(!self._isUnmounted)
				self.setState({allSchemaNames : SchemaNames});
			}
		});
		try{this.searchField.focus();}catch(err){}
	},
	setSearchText:function(){
		this.setState({searchText:this.searchField.value.trim()});
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
	},
	render:function(){
		var self=this;
		if(this.state.allSchemaNames.length==0){
			return <div>Loading....!</div>
		}else{
			return (<div>
				<div>
					<input ref={(input)=>{this.searchField=input}} type="text" className="form-control" defaultValue={this.state.searchText} onChange={this.setSearchText} autoFocus={true}/>
				</div>
				{
					this.state.allSchemaNames.map(function(name){
						if(self.state.searchText!="" && name.toLowerCase().indexOf(self.state.searchText.toLowerCase())>-1){
							return <div onClick={self.selectedSchema.bind(null,name)} key={global.guid()}>{name}</div>
						}else if(self.state.searchText==""){
							return <div onClick={self.selectedSchema.bind(null,name)} key={global.guid()}>{name}</div>
						}else{
							return <div className="hidden" key={global.guid()}></div>
						}
					})
				}
			</div>)
		}
	}
})
exports.SelectSchema=SelectSchema;




var SelectLandingPage=React.createClass({
	getInitialState:function(){
		return {lpis:undefined,searchText:""};
	},
	componentDidMount:function(){
		var self=this;
		WebAPI.getAllLandingPages(function(result){
			if(result.error){
				alert("There was an error");	
			}else{
				if(!self._isUnmounted)
            	self.setState({lpis:result});
            }
        });
        try{this.searchField.focus();}catch(err){}
	},
	landingPageSelected:function(id){
		this.props.callback(id);
		common.showMainContainer();
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	setSearchText:function(){
		this.setState({searchText:this.searchField.value.trim()});
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
	},
	render:function(){
		if(this.state.lpis==undefined){
			return <div>Loading....!</div>
		}else{
			var self=this;
			return (<div>
				<div>
					<input ref={(input)=>{this.searchField=input}} type="text" className="form-control" defaultValue={this.state.searchText} onChange={this.setSearchText} autoFocus={true}/>
				</div>
				{
					this.state.lpis.map(function(lpi){
						if(self.state.searchText!="" && lpi.templateName.toLowerCase().indexOf(self.state.searchText.toLowerCase())>-1){
								return <div key={global.guid()} className="link" onClick={self.landingPageSelected.bind(null,lpi.recordId)} title={lpi.recordId}>{lpi.templateName}</div>
						}else if(self.state.searchText==""){
							return <div key={global.guid()} className="link" onClick={self.landingPageSelected.bind(null,lpi.recordId)} title={lpi.recordId}>{lpi.templateName}</div>
						}else{
							return <div className="hidden" key={global.guid()}></div>
						}
					})
				}
				</div>)		
		}
	}
});
exports.SelectLandingPage=SelectLandingPage;






var SelectRole=React.createClass({
	getInitialState:function(){
		return {roles:undefined,searchText:""};
	},
	componentDidMount:function(){
		var self=this;
		WebAPI.getAllRoles(function(result){
			if(result.error){
				alert("There was an error");	
			}else{
				if(!self._isUnmounted)
            	self.setState({roles:result});
            }
        });
	},
	landingPageSelected:function(id){
		this.props.callback(id);
		common.showMainContainer();
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	setSearchText:function(){
		this.setState({searchText:this.searchField.value.trim()});
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
	},
	render:function(){
		if(this.state.roles==undefined){
			return <div>Loading....!</div>
		}else{
			var self=this;
			return (<div>
				<div>
					<input ref={(input)=>{this.searchField=input}} type="text" className="form-control" defaultValue={this.state.searchText} onChange={this.setSearchText} autoFocus={true}/>
				</div>
				{
					this.state.roles.map(function(role){
						if(self.state.searchText!="" && role.roleName.toLowerCase().indexOf(self.state.searchText.toLowerCase())>-1){
								return <div key={global.guid()} className="link" onClick={self.landingPageSelected.bind(null,role.recordId)} title={role.recordId}>{role.roleName}</div>
						}else if(self.state.searchText==""){
							return <div key={global.guid()} className="link" onClick={self.landingPageSelected.bind(null,role.recordId)} title={role.recordId}>{role.roleName}</div>
						}else{
							return <div className="hidden" key={global.guid()}></div>
						}
					})
				}
				</div>)		
		}
	}
});
exports.SelectRole=SelectRole;


var SelectOrg=React.createClass({
	getInitialState:function(){
		return {};
	},
	componentDidMount:function(){
		
	},
	orgSelected:function(id){
		this.props.callback(id);
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	render:function(){
		var self=this;
		return <div className={"col-xs-10 col-sm-10  col-lg-8 col-md-8 form-group"}>
                	<div className="h1 extra-padding"> Select Org</div>
                	<div className="link h2 extra-padding" onClick={self.orgSelected.bind(null,"public")}>
    					public
    				</div>
                	{
                		common.getUserOrgs().map(function(o){
                			if(o=="public"){
                				return <div key={global.guid()} className="link"></div>
                			}else{
                				return 	<div key={global.guid()} className="link" onClick={self.orgSelected.bind(null,o)}>
                						<common.UserIcon  
											id={o}
											org={"public"}
											rootSchema={"Organization"}
											noDetail={true}/>
									</div>
							}
                		})
                	}
                </div>
	}
});
exports.SelectOrg=SelectOrg;


function getReactStyles(style){
	if(style!=undefined && typeof style=="object"){
		var reactStyle={};
		for(var key in style){
			if(key.indexOf("-")){
				reactStyle[camelize(key.split("-").join(" "))]=style[key];
			}else{
				reactStyle[key]=style[key];
			}
		}
		return reactStyle;
	}else{
		return {}
	}
}
exports.getReactStyles=getReactStyles;

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
} 
