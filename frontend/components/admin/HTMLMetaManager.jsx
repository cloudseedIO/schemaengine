/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var Utility=require("../Utility.jsx");
var global=require('../../utils/global.js');
var Editor = require('../records/richTextEditor.jsx').MyEditor;
function editHTMLMeta(){
	 ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
     common.clearMainContent();
     ReactDOM.render(<HTMLMeta/>,document.getElementById('dynamicContentDiv'));
}
exports.editHTMLMeta=editHTMLMeta;


var HTMLMeta=React.createClass({
	getInitialState:function(){
		return {
			scu:false,
			schemaName:undefined,
			displayName:undefined,
			footerText:"",
			webCrawlerIndex:false,
			uniqueUserName:undefined,
			htmlMeta:{
				title:"",
				description:"",
				keywords:"",
				ogTitle:"",
				ogDescription:"",
				image_src:""
			},
			navFilters:undefined
		};
	},
	setFooterText:function(text){
		this.setState({footerText:text,scu:false});
	},
	getSchema:function(){
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
        ReactDOM.render(<Utility.SelectSchema callback={this.gotSchema} popUpId={popUpId} />,document.getElementById(contentDivId));
	},
	shouldComponentUpdate: function(nextProps, nextState){ 
		return this.state.scu;
	},
	gotSchema:function(name){
		var self=this;
		common.startLoader();
		WebAPI.getMainSchema(name,function(result){
    		common.stopLoader();
    		if(result.error){alert(result.error);return;}
    		var schema=result;
    		var urlName=(schema["@displayName"]?schema["@displayName"]:schema.displayName)?(schema["@displayName"]?schema["@displayName"]:schema.displayName):schema["@id"]+"s";
    		var htmlMeta=schema.htmlMeta?schema.htmlMeta:{};
    		if(!htmlMeta.title){htmlMeta.title="";}
    		if(!htmlMeta.description){htmlMeta.description="";}
    		if(!htmlMeta.keywords){htmlMeta.keywords="";}
    		if(!htmlMeta.image_src){htmlMeta.image_src="";}
    		if(!htmlMeta.ogTitle){htmlMeta.ogTitle="";}
    		if(!htmlMeta.ogDescription){htmlMeta.ogDescription="";}
    		
    		self.setState({
    			scu:true,
    			schemaName:name,
    			displayName:urlName,
    			footerText:schema["@footerText"]?schema["@footerText"]:"",
    			uniqueUserName:schema["@uniqueUserName"],
    			webCrawlerIndex:schema.webCrawlerIndex,
    			htmlMeta:htmlMeta,
    			navFilters:schema.navFilters?schema.navFilters:{}
    		},function(){
    			self.forceUpdate();
    		});
		});
	},
	saveHTMLMeta:function(){
		if(this.state.schemaName==undefined ||
			this.state.schemaName==""){
				alert("Please select a Schema");
			}
		var displayName=this.displayName.value.trim();
		var uniqueUserName=this.uniqueUserName.value.trim();
		var webCrawlerIndex=this.webCrawlerIndex.checked;
		var htmlMeta={
				title:this.title.value.trim(),
				description:this.description.value.trim(),
				keywords:this.keywords.value.trim(),
				image_src:this.image_src.value.trim(),
				ogTitle:this.ogTitle.value.trim(),
				ogDescription:this.ogDescription.value.trim()
		};
		var navFilters=this.state.navFilters;
		common.startLoader();
		WebAPI.saveHTMLMeta({schemaName:this.state.schemaName,
			uniqueUserName:uniqueUserName,
			webCrawlerIndex:webCrawlerIndex,
			navFilters:navFilters,
			displayName:displayName,
			htmlMeta:htmlMeta,
			footerText:this.state.footerText},function(data){
			common.stopLoader();
			if(data && data.error){
				alert(data.error);
			}
			alert("data saved");
		});
	},
	updateNavFilters:function(filters){
		this.setState({navFilters:filters,scu:true});
	},
	editNavFilters:function(){
		var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
	  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} noSideDiv={true}/>,node);
        ReactDOM.render(<NavFilters navFilters={Object.assign({},this.state.navFilters)} callback={this.updateNavFilters} popUpId={popUpId} />,document.getElementById(contentDivId));
	},
	setData:function(){
		this.setState({
    			scu:true,
    			displayName:this.displayName.value.trim(),
    			uniqueUserName:this.uniqueUserName.value.trim(),
    			webCrawlerIndex:this.webCrawlerIndex.checked,
    			htmlMeta:{
						title:this.title.value.trim(),
						description:this.description.value.trim(),
						keywords:this.keywords.value.trim(),
						image_src:this.image_src.value.trim(),
						ogTitle:this.ogTitle.value.trim(),
						ogDescription:this.ogDescription.value.trim()
				}
    	});
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return (<div key={global.guid()} className="margin-top-gap">
			SCHEMA
			<input type="text" 
					ref={(i)=>{this.schema=i}} 
					className="form-control" 
					defaultValue={this.state.schemaName?this.state.schemaName:""} 
					placeholder={"Click to select Schema"}
					onClick={this.getSchema}/>
			
			DISPLAY NAME(Will be shown in summary pages only)
			<input type="text" 
					placeholder={"Summary display name"}
					ref={(i)=>{this.displayName=i}} 
					className="form-control" 
					defaultValue={this.state.displayName?this.state.displayName:""} />
			UNIQUE USER NAME
			<input type="text" 
					placeholder={"URL Slug"}
					ref={(i)=>{this.uniqueUserName=i}} 
					className="form-control" 
					defaultValue={this.state.uniqueUserName?this.state.uniqueUserName:""} />
			ENABLE WEB CRAWLER INDEXING
			<input type="checkbox" 
					ref={(i)=>{this.webCrawlerIndex=i}}
					className=""
					defaultChecked={this.state.webCrawlerIndex?true:false}/>
			<br/><br/>
			
			TITLE:{this.state.htmlMeta.title.length}
			<input type="text" 
					placeholder={"Web Title"}
					ref={(i)=>{this.title=i}} 
					className="form-control" 
					onBlur={this.setData}
					defaultValue={this.state.htmlMeta.title}/>
			
			DESCRIPTION:{this.state.htmlMeta.description.length}
			<textarea  ref={(i)=>{this.description=i}}
				placeholder={"Web Description"} 
				className="form-control" 
				onBlur={this.setData}
				defaultValue={this.state.htmlMeta.description}/>
			
			KEYWORDS
			<textarea  ref={(i)=>{this.keywords=i}} 
					placeholder={"Web keywords"}
					className="form-control" 
					defaultValue={this.state.htmlMeta.keywords}/>
					
			IMAGE
			<input type="text" 
					placeholder={"image_src"}
					ref={(i)=>{this.image_src=i}} 
					className="form-control" 
					defaultValue={this.state.htmlMeta.image_src}/>
					
			<br/><br/>
			
			
			OG:TITLE:{this.state.htmlMeta.ogTitle.length}
			<input type="text" 
					placeholder={"Open Graph Title"}
					ref={(i)=>{this.ogTitle=i}} 
					className="form-control" 
					onBlur={this.setData}
					defaultValue={this.state.htmlMeta.ogTitle}/>
			OG:DESCRIPTION::{this.state.htmlMeta.ogDescription.length}
			<input type="text" 
					placeholder={"Open Graph Description"}
					ref={(i)=>{this.ogDescription=i}} 
					className="form-control" 
					onBlur={this.setData}
					defaultValue={this.state.htmlMeta.ogDescription}/>
			
			<br/><br/>
			NAV FILTERS
			{(typeof this.state.navFilters=="object")?(<div>{Object.keys(this.state.navFilters).join(", ")}</div>):("")}
			<input type="button" value="UPDATE NAV FILTERS" className="action-button" onClick={this.editNavFilters}/>
			<br/><br/>
			FOOTER TEXT
			<Editor mode="create"  
					content={this.state.footerText} 
					callback={this.setFooterText}/>
			
			<br/><br/>
			<input type="submit" value="SAVE" className="action-button" onClick={this.saveHTMLMeta}/>
			
		</div>)
	}
});
exports.HTMLMeta=HTMLMeta;



var NavFilters=React.createClass({
	getInitialState:function(){
		var navFilters=this.props.navFilters;
		if(!navFilters.default){
			navFilters.default={filters:{}};
		}
		return {navFilters:this.props.navFilters,newSet:{title:"",description:"",slug:"",filters:"",image_src:"",keywords:"",ogTitle:"",ogDescription:""}};
	},
	setData:function(){
		this.setState({
			newSet:{
				slug:this.newNavKey.value.trim(),
				filters:this.newNavFilters.value.trim(),
				title:this.newNavTitle.value.trim(),
				description:this.newNavDescription.value.trim(),
				keywords:this.newNavKeyWords.value.trim(),
				image_src:this.newNavImageSrc.value.trim(),
				ogTitle:this.newNavOGTitle.value.trim(),
				ogDescription:this.newNavOGDescription.value.trim()
			}
		});
	},
	addNewNav:function(){
		var navFilters=this.state.navFilters;
		var key=this.newNavKey.value.trim();
		if(key==""){
			alert("Enter slug name");
			return;
		}
		var filters={};
		try{
			filters=JSON.parse(this.newNavFilters.value);
		}catch(err){
			alert("Please enter a valid filters json");
			return;
		}
		navFilters[key.toLowerCase()]={
			filters:filters,
			htmlMeta:{
				title:this.newNavTitle.value.trim(),
				description:this.newNavDescription.value.trim(),
				keywords:this.newNavKeyWords.value.trim(),
				image_src:this.newNavImageSrc.value.trim(),
				ogTitle:this.newNavOGTitle.value.trim(),
				ogDescription:this.newNavOGDescription.value.trim()
			}
		};
		this.setState({navFitlers:navFilters,newSet:{title:"",description:"",slug:"",filters:"",keywords:"",ogTitle:"",ogDescription:"",image_src:""}});
	},
	deleteNav:function(key){
		var navFilters=this.state.navFilters;
		delete navFilters[key];
		this.setState({navFilters:navFilters});
	},
	editNav:function(key){
		/*this.newNavKey.value=key;
		this.newNavFilters.value=JSON.stringify(this.state.navFilters[key].filters?this.state.navFilters[key].filters:{});
		if(this.state.navFilters[key].htmlMeta){
			this.newNavTitle.value=this.state.navFilters[key].htmlMeta.title;
			this.newNavDescription.value=this.state.navFilters[key].htmlMeta.description;
			this.newNavKeyWords.value=this.state.navFilters[key].htmlMeta.keywords;
			this.newNavOGTitle.value=this.state.navFilters[key].htmlMeta.ogTitle;
			this.newNavOGDescription.value=this.state.navFilters[key].htmlMeta.ogDescription;
			this.newNavImageSrc.value=this.state.navFilters[key].htmlMeta.image_src;
		}*/
		var self=this;
		this.setState({
			newSet:{
				slug:key,
				filters:JSON.stringify(this.state.navFilters[key].filters?this.state.navFilters[key].filters:{}),
				title:this.state.navFilters[key].htmlMeta.title?this.state.navFilters[key].htmlMeta.title:"",
				description:this.state.navFilters[key].htmlMeta.description?this.state.navFilters[key].htmlMeta.description:"",
				keywords:this.state.navFilters[key].htmlMeta.keywords?this.state.navFilters[key].htmlMeta.keywords:"",
				image_src:this.state.navFilters[key].htmlMeta.image_src?this.state.navFilters[key].htmlMeta.image_src:"",
				ogTitle:this.state.navFilters[key].htmlMeta.ogTitle?this.state.navFilters[key].htmlMeta.ogTitle:"",
				ogDescription:this.state.navFilters[key].htmlMeta.ogDescription?this.state.navFilters[key].htmlMeta.ogDescription:""
			}
		},function(){
			self.newNavTitle.focus();
		});
		
	},
	save:function(){
		this.props.callback(this.state.navFilters);
		common.showMainContainer();
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	render:function(){
		var self=this;
		return (<div key={global.guid()}>
			DEFAULT FILTERS:
			<textarea  ref={(i)=>{this.defaultFilters=i}}
					placeholder={"Default Filters"} 
					className="form-control" 
					defaultValue={JSON.stringify(this.state.navFilters.default.filters)}/>
			{
				(Object.keys(this.state.navFilters)).map(function(key){
					if(key!="default"){
						return (<div key={global.guid()}>
							<h2>{key}</h2>
							
							<span className="fa fa-times fa-x link" aria-hidden="true" onClick={self.deleteNav.bind(null,key)}/>
							 
							<span className="fa fa-pencil fa-x link" aria-hidden="true" onClick={self.editNav.bind(null,key)}/><br/>
							
							FILTERS:<b>{JSON.stringify(self.state.navFilters[key].filters)}</b><br/>
							TITLE:<b>{self.state.navFilters[key].htmlMeta?self.state.navFilters[key].htmlMeta.title:""}</b><br/>
							DESCRIPTION:<b>{self.state.navFilters[key].htmlMeta?self.state.navFilters[key].htmlMeta.description:""}</b><br/>
							KEYWORDS:<b>{self.state.navFilters[key].htmlMeta?self.state.navFilters[key].htmlMeta.keywords:""}</b><br/>
							IMAGE_SRC:<b>{self.state.navFilters[key].htmlMeta?self.state.navFilters[key].htmlMeta.image_src:""}</b><br/>
							OG TITLE:<b>{self.state.navFilters[key].htmlMeta?self.state.navFilters[key].htmlMeta.ogTitle:""}</b><br/>
							OG DESCRIPTION:<b>{self.state.navFilters[key].htmlMeta?self.state.navFilters[key].htmlMeta.ogDescription:""}</b><br/>
						</div>);
					}
				})
			}
			<hr className=""/>
			NEW SLUG
			<input type="text" 
					ref={(i)=>{this.newNavKey=i}} 
					placeholder="Nav slug"
					onBlur={this.setData}
					className="form-control"
					defaultValue={this.state.newSet.slug}/>
			FILTERS
			<textarea  ref={(i)=>{this.newNavFilters=i}}
					placeholder={"Nav Filters"} 
					onBlur={this.setData}
					className="form-control"
					defaultValue={this.state.newSet.filters}/>
			TITLE:({this.state.newSet.title.length})
			<input type="text"  
					ref={(i)=>{this.newNavTitle=i}}
					onBlur={this.setData}
					placeholder={"Nav Title"} 
					className="form-control" 
					defaultValue={this.state.newSet.title}/>
			DESCRIPTION:({this.state.newSet.description.length})
			<textarea  ref={(i)=>{this.newNavDescription=i}}
					placeholder={"Nav Description"} 
					onBlur={this.setData}
					className="form-control" 
					defaultValue={this.state.newSet.description}/>
			KEYWORDS
			<textarea  ref={(i)=>{this.newNavKeyWords=i}}
					placeholder={"Nav Kewwords"} 
					onBlur={this.setData}
					className="form-control" 
					defaultValue={this.state.newSet.keywords}/>
					
			IMAGE_SRC		
			<input type="text"  
					ref={(i)=>{this.newNavImageSrc=i}}
					onBlur={this.setData}
					placeholder={"Nav Image Src"} 
					className="form-control" 
					defaultValue={this.state.newSet.image_src}/>
			OG TITLE:({this.state.newSet.ogTitle.length})
			<input type="text"  
					ref={(i)=>{this.newNavOGTitle=i}}
					onBlur={this.setData}
					placeholder={"Nav OG Title"} 
					className="form-control" 
					defaultValue={this.state.newSet.ogTitle}/>
			OG DESCRIPTION:({this.state.newSet.ogDescription.length})
			<textarea  ref={(i)=>{this.newNavOGDescription=i}}
					placeholder={"Nav OG Description"} 
					onBlur={this.setData}
					className="form-control" 
					defaultValue={this.state.newSet.ogDescription}/>
			
			<input type="submit" value="ADD" className="action-button" onClick={this.addNewNav}/>
			<br/><br/>
			<input type="submit" value="SAVE" className="action-button" onClick={this.save}/>
		</div>)
	}
});
