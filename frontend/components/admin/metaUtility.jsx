/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var global=require('../../utils/global.js');

var AddMeta=React.createClass({
	getIds:function(){
		var all=$("input[name='metaSelection']:checked");
		var ids=[];
		for(var i=0;i<all.length;i++){
			ids.push(all[i].value);
		}
		return ids;
	},
	getInitialState:function(){
		return {ids:this.getIds(),keywords:[]}
	},
	save:function(){
		if(common.isAdmin()){
			var self=this;
			this.setState({keywords:this.keywords.value.split(",")},function(){
				if(self.state.ids.length==0 || self.state.keywords.length==0){
					alert("please fill records ids and keywords");
					return;
				}else{
					WebAPI.doPost("/generic?operation=saveKeywords",self.state,function(data){
		                common.showMainContainer();
		                document.getElementById(self.props.popUpId).parentNode.remove();
					});
				}
			});
		}
	},
	selectAll:function(){
		$("input[name='metaSelection']").attr("checked",true);
		this.setState({ids:this.getIds()});
		this.getKeywords();
	},
	setKeywords:function(){
		this.setState({keywords:this.keywords.value});
	},
	componentDidMount:function(){
		this.getKeywords();
	},
	getKeywords:function(){
		var self=this;
		WebAPI.doPost("/generic?operation=getKeywords",this.state,function(data){
			self.setState({keywords:data});
		});
	},
	render:function(){
		if(!common.isAdmin()){
			return <div><h1>Un authorized to access this Page.</h1></div>
		}
		return (<div key={global.guid()}>
				RECORD IDS
				<input type="text" ref={(e)=>{this.schema=e}} className="form-control" value={this.state.ids} />
				<br/><br/>
				KEYWORDS
				<textarea  ref={(e)=>{this.keywords=e}} className="form-control" 
						placeholder={"Enter keywords seperated by comma(,)"} 
						defaultValue={this.state.keywords} 
						onChange={this.setKeyWords}/>
				<br/><br/>
				{/*<input type="submit" value="Select all current products" className="action-button" onClick={this.selectAll}/>*/}
				<br/><br/>
				<input type="submit" value="SAVE" className="action-button" onClick={this.save}/>
				</div>)
	}
});
exports.AddMeta=AddMeta;
