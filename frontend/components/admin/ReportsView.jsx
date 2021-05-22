/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var Link=require('react-router').Link;
var global=require('../../utils/global.js');
var limitCount=global.auditLimitCount;
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var linkGenerator=require('../nav/linkGenerator.jsx');
var genericView=require('../view/genericView.jsx');
/*
try{
 	window.openReportView=function(query,params){
 		
		query=query?query:"SELECT * FROM records WHERE docType=$1";
		params=params?params:["Measurement"];

		var node = document.createElement("div");
		node.id = global.guid();
		var popUpId = global.guid();
		var contentDivId = global.guid();
		var sideDivId = global.guid();
		node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
		ReactDOM.render(<ReportView data={query:query,params:params} />,document.getElementById(contentDivId));
	};
}catch(err){
	
	
}*/
/**
 * @props
 * query 
 * params
 * 
 * 
 */
var ReportSummary=React.createClass({
	getInitialState:function(){
		return {all:{},current:undefined}
	},
	setCurrent:function(curr){
		this.setState({current:curr});
	},
	componentDidMount:function(){
		common.startLoader();
		WebAPI.getDefinition("WKReports",function(result){
			common.stopLoader();
			this.setState({all:result});
		}.bind(this));
	},
	render:function(){
		var self=this;
		if(this.state.current){
			return (<div>
				<ReportView data={this.state.all.reports[this.state.current]} />
				<button onClick={this.setCurrent.bind(null,undefined)}>BACK</button>
			</div>)
		}else{
			if(this.state.all && typeof this.state.all.reports=="object" && Object.keys(this.state.all.reports).length>0){
				return (<div>
					{
						Object.keys(this.state.all.reports).map(function(key){
							return <div className="link" key={global.guid()} onClick={self.setCurrent.bind(null,key)}>{self.state.all.reports[key].description}</div>
						})
					}
				</div>)
			}else{
				return <div></div>
			}
		}
	}
});
exports.ReportSummary=ReportSummary;
var ReportView=React.createClass({
	getInitialState:function(){
		return {entries:[],skip:0,total:0,keys:[]};
	},
	increaseSkipCount:function(){
		this.setState({skip:this.state.skip+limitCount},this.getResults);
	},
	reduceSkipCount:function(){
		this.setState({skip:this.state.skip-limitCount},this.getResults);
	},
	pageSelected:function(){
		this.setState({skip:this["pageSelect"].value*limitCount},this.getResults);
	},
	componentDidMount:function(){
		this.getTotalResults(this.getResults);
	},
	getTotalResults:function(callback){
		var self=this;
		if(this.props.data.query.indexOf("GROUP")>-1 || this.props.data.query.indexOf("group")>-1 ||
				this.props.data.query.indexOf("COUNT")>-1 || this.props.data.query.indexOf("count")>-1){
			self.setState({total:NaN},callback);
		}else{
			common.startLoader();
			WebAPI.getTotalResults({query:this.props.data.query,params:this.props.data.params},function(recs){
				common.stopLoader();
				self.setState({total:recs.total},callback);
			});		
		}
	},
	getResults:function(){
		var self=this;
		common.startLoader();
		WebAPI.getResults({query:this.props.data.query,params:this.props.data.params,skip:this.state.skip},function(recs){
			common.stopLoader();
			if(Array.isArray(recs)){
				var keys=[];
				recs.forEach(function(entry){
					if(keys.length<Object.keys(entry).length){
						keys=Object.keys(entry);
					}
				})
				self.setState({entries:recs,keys:keys});
			}
		});
	},
	render:function(){
		var self=this;
		return (<div className="auditContent col-lg-12 col-md-12 col-sm-12 col-xs-12">
					<h3 className="h3">{this.props.data.description}</h3>
					
					<table>
					{
						this.state.entries.map(function(entry){
							if(entry.records){
								return <tr><td><genericView.GoIntoDetail key={global.guid()} summary={true}
			          								rootSchema={entry.records.docType}
			          								record={{recordId:entry.records.recordId,value:entry.records,id:entry.records.recordId}}
			          								recordId={entry.records.recordId}
			          								org={entry.records.org}/></td></tr>
							}else{
								return (<tr>
									{
									self.state.keys.map(function(key){
										if(self.props.data.outProps && 
											self.props.data.outProps[key] && 
											self.props.data.outProps[key].dataType=="object" ){
											return (<td><div className="display-inline-block extra-padding-right vertical-align-middle"><common.UserIcon key={global.guid()}    
														id={entry[key]} org={"public"}   
														rootSchema={self.props.data.outProps[key].objRef}/></div></td>)
										}else{
											return <td><div key={global.guid()} className="display-inline-block extra-padding-right vertical-align-middle">{entry[key]?entry[key]:"-"}</div></td>
										}
									})
								}
								</tr>);
							}
						})
					}
					
					</table>
					{(!isNaN(this.state.total))?(<div  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  remove-margin-top">
						<div className="pull-left">
							<div className="nextPrevIcons">TOTAL : {self.state.total}</div>
						</div>
						<div className="pull-right">
						{
								(self.state.skip && self.state.skip>=limitCount)?(<div className="link display-table-cell extra-padding-right " onClick={self.reduceSkipCount}>
									<div className="child-img-component no-padding"><i className="sleekIcon-leftarrow fa-2x nextPrevIcons" /></div>
									<div className="child-img-component no-padding"><span className="nextPrevIcons">PREV</span></div>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
								</div>):(<span></span>)
				        }
				        {
				        	(self.state.total > limitCount)?(
				        			<div className="link display-table-cell extra-padding-right vertical-align-top">
											  <select className="form-control" ref={(select)=>{self["pageSelect"]=select}} onChange={self.pageSelected} defaultValue={Math.floor((self.state.skip?self.state.skip:0)/limitCount)} key={global.guid()}>
												  <option value={0}>1</option>
												  {
												   [1].map(function(){
												   	 var options=[];
												   	 for(var si=1;si<self.state.total/limitCount;si++){
											   	 		options.push(<option key={global.guid()}  value={si*1}>{si+1}</option>);
												   	 }
												   	 return options;
												   })
												   }
											  </select>
									     </div>):(<span className="hidden"></span>)
				        }
				        {
				          	(self.state.total > (limitCount+(self.state.skip?self.state.skip:0)))?(<div className="link display-table-cell" onClick={self.increaseSkipCount}>
				          				<div className="child-img-component no-padding"><span className="nextPrevIcons">NEXT</span></div>
				          				<div className="child-img-component no-padding"><i  className="sleekIcon-rightarrow fa-2x nextPrevIcons " /></div>
				          				</div>):(<span></span>)
						}
					</div>
				</div>):(<div className="pull-right">
						{
								(self.state.skip && self.state.skip>=limitCount)?(<div className="link display-table-cell extra-padding-right " onClick={self.reduceSkipCount}>
									<div className="child-img-component no-padding"><i className="sleekIcon-leftarrow fa-2x nextPrevIcons" /></div>
									<div className="child-img-component no-padding"><span className="nextPrevIcons">PREV</span></div>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
								</div>):(<span></span>)
				        }
				        {
				          	(this.state.entries.length > (limitCount-1) )?(<div className="link display-table-cell" onClick={self.increaseSkipCount}>
				          				<div className="child-img-component no-padding"><span className="nextPrevIcons">NEXT</span></div>
				          				<div className="child-img-component no-padding"><i  className="sleekIcon-rightarrow fa-2x nextPrevIcons " /></div>
				          				</div>):(<span></span>)
						}
					</div>)}
					
					
					
				</div>);
	}
});
exports.ReportView=ReportView;