var React=require('react');
var ReactDOM = require('react-dom');
var global=require('../../utils/global.js');
var WebUtils=require('../../utils/WebAPIUtils.js');
var genericView = require('../view/genericView.jsx');
var SchemaStore = require('../../stores/SchemaStore');
var common=require('../common.jsx');
var FilterResultsNew=require('../nav/filters.jsx').FilterResultsNew;
var endPoints=require('../../endPoints.js');
var MfrReports=React.createClass({
	getInitialState:function(){
		return {
			skip:0,
			limit:9,
			infiniteScrollProgress:"more",
			currFilters:{},
			records:[],
			schema:SchemaStore.get("SpecListProductCategory")
		}

	},
	componentDidMount:function(){
		var self = this;
		if(this.state.skip == "0" && this.state.limit == "9"){
			WebUtils.doPost("/generic?operation=getMfrReports",{}, function(result) {
				console.log(result);
				var initialResult = result;
				if(result.length > 9){
					result=result.slice(0,9);
				}
				self.setState({records:result,infiniteScrollProgress:((initialResult.length)>9)?"more":undefined});
			});
		}
  },
	shouldComponentUpdate:function(){
		return true;
	},
	loadMore:function(){
		var self = this;
		var skip = this.state.skip+9;
		var records = this.state.records;
		WebUtils.doPost("/generic?operation=getMfrReports",{"skip":skip,"limit":this.state.limit,"filters":this.state.currFilters}, function(result) {
      console.log(result);
			var initialResult = result;
			if(result.length > 9){
				result=result.slice(0,9);
			}
			var temp = records.concat(result);
      self.setState({records:temp,skip:skip,infiniteScrollProgress:(initialResult.length)>9?"more":undefined});
    });
		//this.setState({infiniteScrollProgress:"more"});

	},
	loadFiltersWithRecords:function(filters){

		var currFilters=this.props.filters;
		if(typeof currFilters !="object"){
			currFilters={};
		}
		for(var key in filters){
			currFilters[key]=filters[key];
		}
		var self=this;
		if(typeof this.props.callback=="function"){
			this.props.callback(currFilters);
			return;
		}
		WebUtils.doPost("/generic?operation=getMfrReports",{filters:currFilters}, function(result) {
      console.log(result);
			var initialResult = result;
			if(result.length > 9){
				result=result.slice(0,9);
			}
      self.setState({records:result,currFilters:currFilters,skip:0,limit:9,infiniteScrollProgress:initialResult.length>9?"more":""});
    });
	},
	downloadReports:function(){
		/*WebUtils.doPost("/generic?operation=getMfrReports",{"download":true,"filters":this.state.currFilters}, function(result) {
      console.log(result);
    });*/
		var url=(endPoints.apiServerAddress || "")+"/mfrReportsPDF/?data="+ encodeURIComponent(JSON.stringify({filters:this.state.currFilters}))
		var win = window.open(url, '_blank');
  	win.focus();
	},
	render:function(){
		var self = this;

			var records=this.state.records;
			var temp=[];
			for(var i = 0;i<records.length;i++){
				temp.push({"value":records[i]});
			}
				return (
				<div className="row">
					<div><h1>Mfr Reports</h1></div>
					<div className="row" >
						<FilterResultsNew
							type={"desktop"}
							clickClose={true}
							rootSchema={"SpecListProductCategory"}
							textRight={"textRight"}
							dropDownClass={" "}
							schema={this.state.schema}
							noApplicable={true}
							callbackToClosePopup={
								function(newRec){
									common.showMainContainer();node.remove();
								}
							}
							callback={this.loadFiltersWithRecords}
							/>
					</div>
					<genericView.Table
						key={global.guid()}
						hideInlineEdit={false}
						org={"public"}
						records={temp}
						rootSchema={"SpecListProductCategory"}
						schemaDoc={this.state.schema}
						viewName={"reportView"}
					/>
					{(self.state.records!=null && self.state.records.length > 0 && self.state.infiniteScrollProgress=="more")?
				 		<div className="text-center margin-top-gap">
							<button key={global.guid()} className="loadMore upload-btn pointer" ref={(e)=>{this.loadMoreButton=e;}} id="loadMore" onClick={this.loadMore}>Load More</button>
						</div>:""}
						<div className="text-center margin-top-gap">
							<button key={global.guid()} className="upload-btn pointer" ref={(e)=>{this.downloadButton=e;}} onClick={this.downloadReports}>Download</button>
						</div>
				</div>)
	}
});
exports.MfrReports=MfrReports;
