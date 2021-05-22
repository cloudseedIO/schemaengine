/**
 * @author - Vikram
 */
var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var linkGenerator=require('../nav/linkGenerator.jsx');
var global=require('../../utils/global.js');
var Link=require('react-router').Link;
var limitCount=global.limitCount;//9;

var browserHistory=require('react-router').browserHistory;

var GetAllOrgs=React.createClass({
	loadTeam:function(org){
		browserHistory.push(linkGenerator.getSummaryLink({schema:"UserRole",org:org}));
	},
	getInitialState:function(){
		return {orgs:undefined,skip:0,orgType:"",sortBy:"dateCreated",sortOrder:"desc"};
	},
	increaseSkipCount:function(){
		this.setState({skip:this.state.skip+limitCount});
	},
	reduceSkipCount:function(){
		this.setState({skip:this.state.skip-limitCount});
	},
	pageSelected:function(){
		this.setState({skip:this["pageSelect"].value*limitCount});
	},
	setOrgType:function(){
		this.setState({orgType:this.orgType.value,skip:0},this.getAllOrgs);
	},
	setSortBy:function(){
		this.setState({sortBy:this.sortBy.value,skip:0},this.getAllOrgs);
	},
	setSortOrder:function(){
		this.setState({sortOrder:this.sortOrder.value,skip:0},this.getAllOrgs);
	},
	componentDidMount:function(){
		this.getAllOrgs();
	},
	getAllOrgs:function(){
		var self=this;
		common.startLoader();
		WebAPI.doPost("/generic?operation=getAllOrgsWithOrgType",{orgType:this.state.orgType,sortBy:this.state.sortBy,sortOrder:this.state.sortOrder},function(data){
			common.stopLoader();
			if(data.error){
				alert(data.error);
			}else{
				 self.setState({orgs:data});
			}
		});
	},
	render:function(){
		var self=this;
		if(!common.isAdmin()){
			return <div className="margin-top-gap"><h1>Un authorized to access this Page.</h1></div>
		}
		if(Array.isArray(this.state.orgs)){
			return (<div className="margin-top-gap">
					<div title="Select Organization Type" className="display-inline-block extra-padding-right">
						<select ref={(e)=>{this.orgType=e}} onChange={this.setOrgType} defaultValue={this.state.orgType}>
							<option value="">All</option>
							<option value="Project">Project</option>
							<option value="MFRProject">MFRProject</option>
							<option value="Provider">Provider</option>
							<option value="Supplier">Supplier</option>
							<option value="Manufacturer">Manufacturer</option>
							<option value="ServiceProvider">ServiceProvider</option>
							<option value="Developer">Developer</option>
							<option value="Organization">Other</option>
						</select>
					</div>
					<div title="Select Sort By" className="display-inline-block extra-padding-right">
						<select ref={(e)=>{this.sortBy=e}} onChange={this.setSortBy} defaultValue={this.state.sortBy}>
							<option value="count">Members Count</option>
							<option value="dateCreated">Date Created</option>
						</select>
					</div>
					<div title="Select Sort Order" className="display-inline-block extra-padding-right">
						<select ref={(e)=>{this.sortOrder=e}} onChange={this.setSortOrder} defaultValue={this.state.sortOrder}>
							<option value="asc">Ascending</option>
							<option value="desc">Descending</option>
						</select>
					</div>
				<div className="allOrgsList">
					{
						this.state.orgs.map(function(org,index){
							if(org!="public" &&
								(index>=self.state.skip && ((index+1)<=self.state.skip+limitCount))){
								return (<div key={global.guid()} className="col-lg-3 col-md-4 col-sm-6 col-xs-12 extra-padding-bottom">
										<Link target="_blank" title={"Click to view team"} to={linkGenerator.getSummaryLink({schema:"UserRole",org:org.org})}>
											<div>{org.docType}</div>
											<div className="h2">{(org.name?org.name:org.org)+"   ("+org.count+")"}</div>
											<div>{org.dateCreated}</div>
											{/*<common.UserIcon   id={org.org} 
													org={"public"}    
													rootSchema={"Organization"}
												noDetail={true}/>*/}
										</Link>
									</div>);
							}
						})
					}
					<div  className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  remove-margin-top">
						<div className="pull-right">
						{
								(self.state.skip && self.state.skip>=limitCount)?(<div className="link display-table-cell extra-padding-right " onClick={self.reduceSkipCount}>
									<div className="child-img-component no-padding"><i className="sleekIcon-leftarrow fa-2x nextPrevIcons" /></div>
									<div className="child-img-component no-padding"><span className="nextPrevIcons">PREV</span></div>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
								</div>):(<span></span>)
				        }
				        {
				        	(self.state.orgs.length > limitCount)?(
				        			<div className="link display-table-cell extra-padding-right vertical-align-top">
											  <select className="form-control" ref={(select)=>{self["pageSelect"]=select}} onChange={self.pageSelected} defaultValue={Math.floor((self.state.skip?self.state.skip:0)/limitCount)} key={global.guid()}>
												  <option value={0}>1</option>
												  {
												   [1].map(function(){
												   	 var options=[];
												   	 for(var si=1;si<self.state.orgs.length/limitCount;si++){
											   	 		options.push(<option key={global.guid()}  value={si*1}>{si+1}</option>);
												   	 }
												   	 return options;
												   })
												   }
											  </select>
									     </div>):(<span className="hidden"></span>)
				        }
				        {
				          	(self.state.orgs.length > (limitCount+(self.state.skip?self.state.skip:0)))?(<div className="link display-table-cell" onClick={self.increaseSkipCount}>
				          				<div className="child-img-component no-padding"><span className="nextPrevIcons">NEXT</span></div>
				          				<div className="child-img-component no-padding"><i className="sleekIcon-rightarrow fa-2x nextPrevIcons"/></div>
				          				</div>):(<span></span>)
						}
					</div>
					</div>
					</div></div>)
		}else{
			return <div>Fetching all orgs...</div>
		}
	}
});
exports.GetAllOrgs=GetAllOrgs;
