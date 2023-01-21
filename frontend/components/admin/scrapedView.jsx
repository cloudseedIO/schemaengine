var React=require('react');
var ReactDOM = require('react-dom');
var WebUtils=require("../../utils/WebAPIUtils.js");
var manageSchemaNew = require("./manageSchemaNew.jsx");
var global=require('../../utils/global.js');
var common=require('../common.jsx');
var SchemaStore = require('../../stores/SchemaStore');
var manageRecords=require('../records/manageRecords.jsx');
var genericView = require('../view/genericView.jsx');


var ScrapedView = React.createClass({
	getInitialState:function(){
		return	{
					dependentSchema:"",
					data:[],
					fileName:"",
					productIds:[],
					schema:SchemaStore.get("Product"),
					Manufacturer:{},
					//index:0,
					record: {}
				};
	},
	componentDidMount:function(){
		var self=this;
		$("button:contains('SAVE')").css("display", "none");
		$("button:contains('CANCEL')").css("display", "none");
		if(Object.keys(self.state.Manufacturer).length==2  && this.state.dependentSchema!=""){
			self.refs.getRecBtn.style.display="";
		}
	},
	componentDidUpdate:function(){
		var self=this;
		if(Object.keys(self.state.Manufacturer).length==2  && self.state.dependentSchema!=""){
			self.refs.getRecBtn.style.display="";
		}
		if(Object.keys(self.state.record).length){
			self.refs.getRecBtn.style.display="none";
		}
		
	},
	loadManufacturer:function(){
		var node=document.createElement("div");
   		node.id= global.guid();
		node.className="lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		ReactDOM.render(<manageRecords.LookupComponent 
								org={"public"} 
								schema={"Manufacturer"} 
								filter={true}
								sublink={{target:''}}
								callback={this.saveManufacturer}/>,node);
	},
	saveManufacturer:function(data){
		var self=this;
		try{
			var mfrData={
			            "id":data.id,
						"name":data.value.name
					};
		}catch(err){
			console.log(err);
		}
		if(Object.keys(mfrData).length==2  && this.state.dependentSchema!=""){
			self.refs.getRecBtn.style.display="";
		}
		this.setState({Manufacturer:mfrData});
	},
	loadProductTypes:function(ev){
		var self=this;
		WebUtils.doPost("/schema?operation=getDerivedObjects",{name:"Product"},function(schemas){
			if(schemas.data.error){
				alert(schemas.data.error+"\n  select again");
			}
			var node = document.createElement("div");
		 	node.id = global.guid();
		 	var popUpId = global.guid();
		 	var contentDivId = global.guid();
		 	var sideDivId = global.guid();
		  	node.className = "lookUpDialogBox  col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
		  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		  	ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId}/>,node);
		    ReactDOM.render(<GetProductDependentProperties popUpId={popUpId} data = {schemas.data} id={"Product"} search={"search"} callback = {self.getDerivedProperties}/>,document.getElementById(contentDivId));
		});
	},
	getDerivedProperties:function(dependentSchema){
		var self=this;
		self.setState({dependentSchema:dependentSchema});
		if(Object.keys(this.state.Manufacturer).length==2  && dependentSchema!=""){
			self.refs.getRecBtn.style.display="";
		}
	},
	resetManufacturer:function(){
	    this.setState({Manufacturer:{}, record: {}/*, index: 0*/});
	    this.refs.getRecBtn.style.display="none";
	},
	resetDPS:function(){
	    this.setState({dependentSchema:"", record: {}/*, index: 0*/});
	    this.refs.getRecBtn.style.display="none";
	},
	resetAll:function(){
	    if (confirm('Are you sure you want to create New Products?')) {
	        this.resetManufacturer();
	        this.resetDPS();
	        //this.deleteFile();
	        //this.resetProducts();
	        //this.setState({index:0});
	    } else {
	        
	    }
	    
	},
	getProducts: function(){
		var self=this;
		if(Object.keys(this.state.Manufacturer).length==2  && this.state.dependentSchema!=""){
		    var data={
		            "Manufacturer":this.state.Manufacturer,
		            "allRecords":this.state.data,
		            "dependentSchema":this.state.dependentSchema,
		            //"index":this.state.index,
		            "user":common.getUserDoc().recordId
		    };
		    common.startLoader();
		    console.log(data);
		    
		    
		    
		    WebUtils.doPost("/generic?operation=getScrapedRecs",data,function(result){
		        common.stopLoader();
		        var data1=result;
		        if(!data1.record){
		        	data1.record=(data1 && data1[0] && data1[0]['records']) ?data1[0].records:false;
		        }
		        
		        
		        if(data1){
    		        if(data1.record){
    		        	//var index = self.state.index+1;
    		            self.setState({/*index: index,*/ record: data1.record},function(){});
    		        }else{
    		        	self.setState({record: {}},function(){});
    		        	console.log(data1);
    		        }
    		        
		        }else{
		            common.createAlert("Data Base Error","Something went wrong try again");
		        }
		    });
		    
		 }else {
			alert("Fill all fields");
		}
	},
	getNextRecord:function(){
		
		var self=this;
		var data={
            "Manufacturer":self.state.Manufacturer,
            "allRecords":self.state.data,
            "dependentSchema":self.state.dependentSchema,
           // "index":this.state.index,
            "user":common.getUserDoc().recordId
    	};
		
		if(Object.keys(self.state.Manufacturer).length==2  && self.state.dependentSchema!=""){
		    common.startLoader();
		    var record=self.state.record;
			//WebUtils.doPost("/schema?operation=getRecord",{"name":record.recordId},function(savedRecordData){
				
				/*
				var ll={
									"userId":"User2cc75dc3-44b0-45c3-4532-a20724a73dc5",
									"recordId":"Product-2c888136-6332-d3af-4f78-0fbf999b9507",
									"org":"public",
									"method":"publish"
									};*/
				
				var sendData={
					"userId":common.getUserDoc().recordId,
					"recordId":record.recordId,
					"org":record.org?record.org:"public",
					"method":"publish"
				};
				WebUtils.doPost("/generic?operation=updateRecord",sendData,function(res){
			    	console.log(res);
			    	
					WebUtils.doPost("/generic?operation=getScrapedRecs",data,function(result){
						common.stopLoader();
				        var data1=result;
				        if(!data1.record){
				        	data1.record=(data1 && data1[0] && data1[0]['records']) ?data1[0].records:false;
				        }
				        
				        
				        if(data1){
		    		        if(data1.record){
		    		        	//var index = self.state.index+1;
		    		            self.setState({/*index: index,*/ record: data1.record},function(){});
		    		        }else{
		    		        	self.setState({record: {}},function(){});
		    		        	console.log(data1);
		    		        }
		    		        
				        }else{
				            common.createAlert("Data Base Error","Something went wrong try again");
				        }
			    	});
			    });
				
			//});
		    	
		 }else {
			alert("Fill all fields");
		}
	},
	resetProducts:function(){
	    this.setState({productIds:[]});
	},
	render:function(){
		var self=this;
		var record = this.state.record;
		if(record.dependentProperties && typeof record.dependentProperties=="object"){
			for(var key in record.dependentProperties){
				record[key]=record.dependentProperties[key];
			}
		}
		return (<div key={global.guid()} className = "row no-margin">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
							{
							    this.state.dependentSchema==""?
							                (<button className="upload-btn" onClick={this.loadProductTypes} value="Submit">Select Dependent Schema</button>)
							                :(<div>
                                                    <h5>Selected Dependent Schema</h5>
                                                    <div className="parent-img-component">
                                                        <div className="child-img-component">
                                                            {self.state.dependentSchema}
                                                        </div>
                                                        <div className="child-img-component">
                                                            <span className="fa fa-2x sleekIcon-delete link" onClick={self.resetDPS} />
                                                        </div>
                                                    </div>
                                                </div>)
							                    
							}
							{/*<input type="text" className="form-control" placeholder={this.state.dependentSchema!=""?this.state.dependentSchema:"Select dependentSchema ..."} onClick={this.loadProductTypes}/>*/}
						</div>
						<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
							
							{
							    Object.keys(this.state.Manufacturer).length==0?
                                            (<button className="upload-btn" onClick={this.loadManufacturer} value="Submit">Select Manufacturer</button>)
                                            :(<div>
                                                    <h5>Selected Manufacturer</h5>
                                                    <div className="parent-img-component">
                                                        <div className="child-img-component">
                                                            {self.state.Manufacturer.name}
                                                        </div>
                                                        <div className="child-img-component">
                                                            <span className="fa fa-2x sleekIcon-delete link" onClick={self.resetManufacturer} />
                                                        </div>
                                                    </div>
                                                </div>)
                            }
							{/*<input type="text" className="form-control" placeholder={Object.keys(this.state.Manufacturer).length>0!=""?this.state.Manufacturer.name:"Select Manufacturer..."} onClick={this.loadManufacturer}/>*/}
						</div>
					</div>
					<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding">
						<button className="upload-btn" onClick={this.getProducts} value="Submit" ref="getRecBtn" style={{display: "none"}}>GET SCRAPPED RECS</button>
					</div>
						{
						        (Object.keys(this.state.Manufacturer).length>0 && this.state.dependentSchema!="" && Object.keys(this.state.record).length>0)?
						        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						                    <genericView.GoIntoDetail key={global.guid()} 
					    			          								viewName={"scrapedView"}
					    			          								noBreadCrumb={true}
					    			          								showAdminInput={true}
					    			          								dependentSchema={self.state.dependentSchema.split("-")[1]}
					    			          								rootSchema={"Product"}
					    			          								recordId={record.recordId}
					    			          								org={"public"} /> 
					    			          								
					    			          <div className="display-inline-block form-group remove-margin-left remove-margin-right extra-padding-right ">
					    			          	<input type="submit" className="action-button"  title="NEXT RECORD" value="SAVE & CONTINUE" onClick={self.getNextRecord} />
					    			          </div>
					    		</div>
					    			          								:<div className="hidden"></div>
						}
				</div>);
	}
});


var GetProductDependentProperties = React.createClass({
	getInitialState:function(){
		return {data : this.props.data,searchText:""};
	},
	selectedSchema:function(name){
		this.props.callback(name);
		common.showMainContainer();
		document.getElementById(this.props.popUpId).parentNode.remove();
	},
	setSearchText:function(){
		this.setState({searchText:this.searchField.value.trim()});
	},
	render:function(){
		
		var self=this;
		if(this.state.data.length==0){
			return <div>Loading....!</div>
		}else{
			return (<div>
				<div>
					<input ref={(input)=>{this.searchField=input}} type="text" className="form-control" defaultValue={this.state.searchText} onChange={this.setSearchText}/>
				</div>
				{
					self.state.data.map(function(name){
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
});





function loadScrapedView(){
	ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
	ReactDOM.render(<ScrapedView />,document.getElementById('dynamicContentDiv'));
}
exports.loadScrapedView=loadScrapedView;

if(typeof window != undefined){
	window.loadScrapedView=loadScrapedView;
}






 /*
  
   var couchbase = require('couchbase');
   var cluster = new couchbase.Cluster("couchbase://35.154.234.150");//52.77.86.146");//52.76.7.57");
   var ViewQuery = couchbase.ViewQuery;
   var records="records";
   var schemas="schemas";
   var cbContentBucket=cluster.openBucket(records);
   var cbMasterBucket=cluster.openBucket(schemas);
   var N1qlQuery = couchbase.N1qlQuery;
   cbContentBucket.query(N1qlQuery.fromString("SELECT * FROM records WHERE `Manufacturer`='Manufacturerf6c63e52-470d-28fc-6eb5-5e3620b20b74' AND `docType`='Product'"), function(err, res){ console.log(res); });
   
   
   
   
   
   
   
   
   
   
   <manageRecords.DisplayCustomSchema org={this.props.params.org}
							schemaName={this.props.params.schema}
							prompt={coeData.prompt}
		                    createHeading={coeData.createHeading}
							knownData={coeData.knownData}
							recordId={coeData.recordId}
							editMethod={coeData.editMethod}
							dependentSchema={coeData.dependentSchema}
							showCancel={coeData.showCancel}
						/>
 */
 