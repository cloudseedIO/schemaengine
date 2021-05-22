/**
 * @author saikiran.vadlakonda
 */

var React=require('react');
var ReactDOM = require('react-dom');
var WebUtils=require("../../utils/WebAPIUtils.js");
var manageSchemaNew = require("./manageSchemaNew.jsx");
var global=require('../../utils/global.js');
var common=require('../common.jsx');
var SchemaStore = require('../../stores/SchemaStore');
var manageRecords=require('../records/manageRecords.jsx');
var genericView = require('../view/genericView.jsx');
var postProcessor = require('./postProcessor.js');



function loadSiteMapUploader(){
	//ReactDOM.unmountComponentAtNode(document.getElementById("dynamicContentDiv"));
	ReactDOM.render(<SiteMapUploader />,document.getElementById("dynamicContentDiv"));
}


var SiteMapUploader = React.createClass({
	getInitialState:function(){
		return	{
					dependentSchema:"",
					data:[],
					fileName:"",
					productIds:[],
					schema:SchemaStore.get("Product"),
					Manufacturer:{},
					record: {}
				};
	},
	createSiteMap:function(){
		ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv'));
		ReactDOM.render(<CreateSiteMap />,document.getElementById('dynamicContentDiv'));
	},
	render:function(){
		return (<div key={global.guid()} className = "row no-margin">
					<div>
						<span>Sitemap Uploader:</span>
					</div>
					<div key={global.guid()}>
						<button className="upload-btn" onClick={this.createSiteMap} value="Submit"> CREATE </button>
					</div>
					<div>
						<button className="upload-btn"> EDIT </button>
					</div>
		{/*
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
					    		</div>:<div className="hidden"></div>
						} */}
				</div>);
	}
});
exports.SiteMapUploader=SiteMapUploader;


var CreateSiteMap = React.createClass({
	getInitialState:function(){
		return	{
					dependentSchema:"",
					data:[],
					fileName:"",
					productIds:[],
					schema:SchemaStore.get("Product"),
					Manufacturer:{},
					record: {},
					propertyValue:{},
					propertyData:{},
					postProcessedData:{},
					previewData:{},
					enableSave:false,
					shouldComponentUpdate:false
				};
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

		this.setState({Manufacturer:mfrData,shouldComponentUpdate:true});
	},
	getDerivedProperties:function(dependentSchema){
		var self=this;
		self.setState({dependentSchema:SchemaStore.get(dependentSchema),shouldComponentUpdate:true});
		if(Object.keys(this.state.Manufacturer).length==2  && dependentSchema!=""){
			//self.refs.getRecBtn.style.display="";
		}
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

	resetManufacturer:function(){
	    this.setState({Manufacturer:{},record: {},
					propertyValue:{},
					propertyData:{},
					postProcessedData:{},
					previewData:{}});
	    //this.refs.getRecBtn.style.display="none";
	},
	resetDPS:function(){
	    this.setState({dependentSchema:"",record: {},
					propertyValue:{},
					propertyData:{},
					postProcessedData:{},
					previewData:{}});
	},
	deletePreFillValue:function(key){
    	var propertyData=this.state.propertyData;
    	delete propertyData["prefillData"][key];
    	//propertyData=propertyData.filter(function(n){ return (n != "" && n!= undefined);});
    	this.setState({propertyData:propertyData});
    	console.log(this.state.propertyData);
	},
	setPreFillValueToProperty:function(property,value){
		var propertyData=this.state.propertyData;
		if(!propertyData.hasOwnProperty("prefillData")){
			propertyData["prefillData"]={};
		}
		if(property == "countryOfAvailability"){
			var fields = value.replace(/\ *\,\ */g, ",");
	    	fields = value.split(",");
	    	propertyData["prefillData"][property]=fields;
		}else{
			propertyData["prefillData"][property]=value;
		}

		this.setState({propertyData:propertyData});
		console.log(this.state.propertyData);
	},
	setValueToProperty:function(value,property,sitemapValue,fromProp){

        var propertyData=this.state.propertyData;
       // if((propertyData["properties"] || propertyData["dependentProperties"]) &&(propertyData["properties"][property] || propertyData["dependentProperties"][property]) && (propertyData["properties"][property]["sitemapValue"] || propertyData["dependentProperties"][property]["sitemapValue"])){
        if(fromProp){
        	if(!propertyData["properties"]){
        		propertyData["properties"]={};
        	}
        	if(!propertyData["properties"][property]){
        		propertyData["properties"][property]={};
        	}
        	if(!propertyData["properties"][property]["value"]){
        		propertyData["properties"][property]["value"]="";
        	}if(!propertyData["properties"][property]["operations"]){
        		propertyData["properties"][property]["operations"]=[];
        	}else{

        	}

        	propertyData["properties"][property]["value"]=sitemapValue;
			//propertyData[property]["operations"]=[];
			propertyData["properties"][property]["operations"]=value;




        }else{
        	if(!propertyData["dependentProperties"]){
        		propertyData["dependentProperties"]={};
        	}
        	if(!propertyData["dependentProperties"][property]){
        		propertyData["dependentProperties"][property]={};
        	}
        	if(!propertyData["dependentProperties"][property]["value"]){
        		propertyData["dependentProperties"][property]["value"]="";
        	}if(!propertyData["dependentProperties"][property]["operations"]){
        		propertyData["dependentProperties"][property]["operations"]=[];
        	}else{

        	}

        	propertyData["dependentProperties"][property]["value"]=sitemapValue;
			//propertyData[property]["operations"]=[];
			propertyData["dependentProperties"][property]["operations"]=value;
        }


		this.setState({propertyData:propertyData,shouldComponentUpdate:false});

		/*
		var currentData=this.state.propertyData;
		var temp={};
		temp[this.state.propertyValue]=value;
    	currentData.push(temp);
    	this.setState({propertyData:currentData});



		var self=this;
		var temp={};
		temp[this.state.propertyValue]=value;
		var temp1=[];
		if(this.state.propertyData.length>0){
			temp1.push(self.state.propertyData);
		}
		temp1.push(temp);
		self.setState({propertyData:temp1});*/
		console.log(this.state.propertyData);
	},
	saveSitemap: function(){
		var self=this;
		var postProcessedData=this.state.postProcessedData;
		postProcessedData["sitemap"]={};
		if(self.sitemapDiv.value != ""){
			postProcessedData["sitemap"]=self.sitemapDiv.value;
		}
		this.setState({postProcessedData:postProcessedData,shouldComponentUpdate:true});
		if(postProcessedData.sitemap.constructor == String){
    		postProcessedData.sitemap=JSON.parse(postProcessedData.sitemap);
    	}
    	common.startLoader();
		WebUtils.doPost("/scrape?operation=preview",postProcessedData,function(result){
	        common.stopLoader();
	        console.log(result);
	        self.setState({previewData:result[0],shouldComponentUpdate:true});
	    });
		console.log(this.state.postProcessedData);
	},
	shouldComponentUpdate: function(nextProps, nextState) {
         return nextState.shouldComponentUpdate;
    },
    enableSave:function(){
    	this.setState({enableSave:true,shouldComponentUpdate:true});
    },
    testSiteMap:function(){
    	var self=this;
    	var json={};
    	var postProcessedData=this.state.postProcessedData;
    	if(postProcessedData.sitemap && postProcessedData.sitemap.constructor == String){
    		postProcessedData.sitemap=JSON.parse(postProcessedData.sitemap);
    	}
    	if(postProcessedData.sitemap && postProcessedData.sitemap.hasOwnProperty("startUrl") && postProcessedData.sitemap.hasOwnProperty("_id")
    	&& postProcessedData.sitemap.hasOwnProperty("selectors") ){

    		if(postProcessedData.sitemap && postProcessedData.sitemap.startUrl && postProcessedData.sitemap.startUrl.constructor == Array){
    			postProcessedData.sitemap.startUrl=postProcessedData.sitemap.startUrl[0];
    		}
    		var dataParseTemplate={};

	    	json['siteMap']=(postProcessedData.sitemap);

	    	dataParseTemplate['Schema']="Product";
	    	dataParseTemplate['DependentSchema']=self.state.dependentSchema['@id'];

	    	dataParseTemplate['test']=true;
	    	dataParseTemplate['checkForRecord']=false;

	    	dataParseTemplate['prefillData']={};
	    	for(var prop in self.state.propertyData["prefillData"]){
	    		dataParseTemplate['prefillData'][prop]=self.state.propertyData["prefillData"][prop];
	    	}
	    	dataParseTemplate['prefillData']['Manufacturer']=self.state.Manufacturer.id;
	    	dataParseTemplate['prefillData']['productCategory']=self.state.dependentSchema["@derivedId"];
	    	dataParseTemplate['prefillData']['esMeta']=self.state.Manufacturer.name;
	    	dataParseTemplate['prefillData']['productType']=dataParseTemplate['DependentSchema'].split("-")[1];


	    	dataParseTemplate['properties']={};
	    	for(var prop in self.state.propertyData.properties){
	    		dataParseTemplate['properties'][prop]=self.state.propertyData.properties[prop];
	    	}

	    	dataParseTemplate['dependentProperties']={};
	    	for(var prop in self.state.propertyData["dependentProperties"]){
	    		dataParseTemplate['dependentProperties'][prop]=self.state.propertyData["dependentProperties"][prop];
	    	}

	    	dataParseTemplate['createSpec']={};
	    	for(var i=0; i<postProcessedData.sitemap.selectors.length; i++){
	    		var selector=postProcessedData.sitemap.selectors[i];
	    		if(selector.type=="SelectorKeyValue"){
	    			dataParseTemplate['createSpec']['value']=selector.id;
	    			dataParseTemplate['createSpec']["operations"]=["specFromJson"];
	    		}
	    	}
	    	if(!dataParseTemplate['createSpec'].hasOwnProperty('value')){
	    		dataParseTemplate['createSpec']['value']="specificationsJson";
	    	}

	    	var url = postProcessedData.sitemap.startUrl;
	    	var ext;
	    	if((url.indexOf("http") != -1) || (url.indexOf("https") != -1)){
	    		url = url.split("/");
	    		ext = url[2];
	    	}else{
	    		url = url.split("/");
	    		ext = url[0];
	    	}

	    	ext = ext.split(".").pop();

	    	json['recordId']=self.state.Manufacturer.name+"-"+dataParseTemplate['DependentSchema'].split("-")[1]+"-"+ext+"-"+global.guid();
	    	json['dataParseTemplate']=dataParseTemplate;
	    	json['dateCreated']=global.getDate();
	    	json['author']=common.getUserDoc().recordId;
	    	json['$status']="created";
	    	common.startLoader();
	    	postProcessor.processRecord(json['dataParseTemplate'], [self.state.previewData],  function(processedRec){
	    		common.stopLoader();
	    		var node = document.createElement("div");
			 	node.id = global.guid();
			 	var popUpId = global.guid();
			 	var contentDivId = global.guid();
			 	var sideDivId = global.guid();
			  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
			  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
				ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} alignMiddleDiv={true}/>,node);
				ReactDOM.render(<genericView.GoIntoDetail key={global.guid()}
										rootSchema="Product"
										dependentSchema={self.state.dependentSchema['@id']}
										gotRecord={true}
										recordId={processedRec.recordId}
										viewName={"getDetail"}
										record={{value: processedRec}}
										contentDivId={contentDivId}
										org="public" />,document.getElementById(contentDivId))
	    	}, self.state.schema, self.state.dependentSchema);


	    	if(self.state.enableSave){
	    		common.startLoader();
	    		WebUtils.doPost("/scrape?operation=saveSitemap",json,function(result){
					common.stopLoader();
					console.log(result);
					if(result.error){
						alert(result.error);
					}else{
						self.setState({record:result[0],shouldComponentUpdate:true,enableSave:false});
					}

				});
	    	}
	    	/*
			WebUtils.doPost("/scrape?operation=test",json,function(result){
							common.stopLoader();
							console.log(result);
							self.setState({record:result[0],shouldComponentUpdate:true})
						});*/

    	}else{
    		alert("Invalid configuration");
    	}



    },
    viewRecord:function(){
    	var self=this;
    	var node = document.createElement("div");
	 	node.id = global.guid();
	 	var popUpId = global.guid();
	 	var contentDivId = global.guid();
	 	var sideDivId = global.guid();
	  	node.className = "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
	  	document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
		ReactDOM.render(<common.GenericPopUpComponent popUpId={popUpId} contentDivId={contentDivId} sideDivId={sideDivId} alignMiddleDiv={true}/>,node);
		ReactDOM.render(<genericView.GoIntoDetail key={global.guid()}
								rootSchema="Product"
								dependentSchema={self.state.dependentSchema['@id']}
								gotRecord={true}
								recordId={self.state.record.recordId}
								viewName={"getDetail"}
								record={{value: self.state.record}}
								contentDivId={contentDivId}
								org="public" />,document.getElementById(contentDivId))
    },
	render:function(){
		var self=this;

		var defaultSitemap = "";
		if((self.state.postProcessedData && self.state.postProcessedData["sitemap"])){
			if(self.state.postProcessedData.sitemap.constructor == Object){
	    		defaultSitemap=JSON.stringify(self.state.postProcessedData.sitemap);
	    	}else{
	    		defaultSitemap=self.state.postProcessedData.sitemap;
	    	}
		}


		return (<div>
			<div className=" col-lg-12 col-md-12 col-sm-12 col-xs-12 " key={global.guid()}>
			<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">

				{
				    Object.keys(self.state.Manufacturer).length==0?
                                (<button className="upload-btn" onClick={self.loadManufacturer} value="Submit">Select Manufacturer</button>)
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
			</div>
			<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">

				{
				    self.state.dependentSchema==""?
				                (<button className="upload-btn" onClick={self.loadProductTypes} value="Submit">Select Product Type</button>)
				                :(<div>
                                        <h5>Selected Product Type</h5>
                                        <div className="parent-img-component">
                                            <div className="child-img-component">
                                                {self.state.dependentSchema['@id']}
                                            </div>
                                            <div className="child-img-component">
                                                <span className="fa fa-2x sleekIcon-delete link" onClick={self.resetDPS} />
                                            </div>
                                        </div>
                                    </div>)

				}
				</div>
			</div>
			<div className=" col-lg-12 col-md-12 col-sm-12 col-xs-12 ">
			{
				['a'].map(function(){
					if(self && self.state && self.state.dependentSchema && self.state.Manufacturer){
						return (<div className="row siteMapForm" key={global.guid()}>
									<div className= "col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" style={{"paddingTop": "30px"}}>
										<div className=" col-lg-2 col-md-2 col-sm-2 col-xs-2 "><span><b>SITEMAP: </b></span></div>
										<div className="operations col-lg-8 col-md-8 col-sm-8 col-xs-8">
											<textarea className="form-control" ref={(e)=>self.sitemapDiv=e} defaultValue={defaultSitemap} placeholder="Sitemap" style={{"height": "200px"}}></textarea>
										</div>
										<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveSitemap}>SET</div>
									</div>
									{/*<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap">
										<div className=" col-lg-2 col-md-2 col-sm-2 col-xs-2 "><span><b>esMeta</b></span></div>
										<div className=" col-lg-10 col-md-10 col-sm-10 col-xs-10 ">
											<input type="text" className="form-control" placeholder="esMeta" />
										</div>
									</div>*/}
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap"><span><b>PRE FILL DATA: </b></span></div>
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pointer margin-bottom-gap" >
										<CreatePreFillFields propertyData={self.state.propertyData} deletePreFillValue={self.deletePreFillValue} setPreFillValueToProperty = {self.setPreFillValueToProperty}/>
									</div>
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap" id="prefillData"></div>
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 schemaProps margin-bottom-gap">
										<span><b>PROPERTIES: </b></span>
										{
											Object.keys(self.state.schema['@properties']).map(function(prop){
												if(prop != "termsAndConditions" && prop != "productType" && prop != "productCategory"
													 && prop != "featured" && prop != "Manufacturer" && prop != "webCrawlerIndex"
													 && prop != "freeSampleAvailable" && prop != "metaTitle" && prop != "esMeta"
													 && prop != "sourceUrl" && prop != "metaDescription"){

													return (<SelectProperty property={prop} previewData={self.state.previewData} postProcessedData={(self.state.postProcessedData && self.state.postProcessedData["sitemap"])?self.state.postProcessedData["sitemap"]:{}} fromProp={true} propertyData={(self.state.propertyData && self.state.propertyData["properties"] && self.state.propertyData["properties"][prop] && self.state.propertyData["properties"][prop]["operations"])?self.state.propertyData["properties"][prop]["operations"]:[]} sitemapValue={(self.state.propertyData && self.state.propertyData["properties"] && self.state.propertyData["properties"][prop] && self.state.propertyData["properties"][prop].value)?self.state.propertyData["properties"][prop].value:""} propertyData={(self.state.propertyData && self.state.propertyData["properties"] && self.state.propertyData["properties"][prop] && self.state.propertyData["properties"][prop].operations )?self.state.propertyData["properties"][prop]["operations"]:[]} setValueToProperty={self.setValueToProperty} />)
												}

											})
										}
									</div>
									<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 dpSchemaProps margin-bottom-gap">
										<span><b>DEPENDENT PROPERTIES: </b></span>
										{
											Object.keys(self.state.dependentSchema['@properties']).map(function(dsProp){
												return (<SelectProperty property={dsProp} previewData={self.state.previewData} postProcessedData={(self.state.postProcessedData && self.state.postProcessedData["sitemap"])?self.state.postProcessedData["sitemap"]:{}} dependentSchema={self.state.dependentSchema["@properties"]} fromProp={false} propertyData={(self.state.propertyData && self.state.propertyData["dependentProperties"] && self.state.propertyData["dependentProperties"][dsProp] && self.state.propertyData["dependentProperties"][dsProp]["operations"])?self.state.propertyData["dependentProperties"][dsProp]["operations"]:[]} sitemapValue={(self.state.propertyData && self.state.propertyData["dependentProperties"] && self.state.propertyData["dependentProperties"][dsProp] && self.state.propertyData["dependentProperties"][dsProp].value)?self.state.propertyData["dependentProperties"][dsProp].value:""} propertyData={(self.state.propertyData && self.state.propertyData["dependentProperties"] && self.state.propertyData["dependentProperties"][dsProp] && self.state.propertyData["dependentProperties"][dsProp].operations )?self.state.propertyData["dependentProperties"][dsProp]["operations"]:[]} setValueToProperty={self.setValueToProperty} />)
											})
										}
									</div>

								</div>)
					}else{
						return (<div></div>)
					}
				})

			}

			</div>
			{
				(self.state.Manufacturer && self.state.dependentSchema['@id'] && (self.state.enableSave==false))?
					(<div className=" col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap">
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap-xs"><button className="action-button" onClick={self.testSiteMap}>VIEW RECORD</button></div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap-xs"><button className="action-button" onClick={self.enableSave}>SET</button></div>
					</div>):
					(<div></div>)
			}

			{
				(self.state.enableSave)?
				(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap"><button className="action-button" onClick={self.testSiteMap}>SAVE</button></div>):
				(<div></div>)
			}


		</div>);
	}
});

/**
 *
 * property
 * callback
 *
 */
var SelectProperty=React.createClass({
	getInitialState:function(){
		var count=((this.props.propertyData && this.props.propertyData.length>0)?this.props.propertyData.length:1);
		return {
                count:count,
                shouldComponentUpdate:false,
                sitemapValue:this.props.sitemapValue?this.props.sitemapValue:"",
                propertyData:this.props.propertyData?this.props.propertyData:[]
        };
	},
	saveText:function(value){
		//var value=event.target.value.trim();
		this["sitemapValue"].innerHTML=value;
		this.setState({sitemapValue:value,shouldComponentUpdate:false});
		this.props.setValueToProperty(this.props.propertyData,this.props.property,value,this.props.fromProp);

	},
	addOperation:function(){
    	if(this.state.count==this.state.propertyData.length){
           var self=this;
           var count=this.state.count;
	 		this.setState({count:count+1,shouldComponentUpdate:true});

        }
    },
    deleteOperation:function(index){
    	var self=this;
    	var propertyData=this.state.propertyData;
    	delete propertyData[index];
    	propertyData=propertyData.filter(function(n){ return (n != "" && n!= undefined);});
    	this.setState({count:(propertyData.length>0?propertyData.length:1),propertyData:propertyData},function(){
    		self.props.setValueToProperty(propertyData,self.props.property,self.state.sitemapValue,self.props.fromProp);
    	});
    },
    setValueToProperty:function(data,index){
    	var propertyData=this.state.propertyData;
    	propertyData[index]=data;
		this.props.setValueToProperty(propertyData,this.props.property,this.state.sitemapValue,this.props.fromProp);
    },
	render:function(){
		var self=this;
        var arrayCount=[];
        for(var i=0;i<this.state.count;i++){
            arrayCount.push(i);
        }
        var sitemapValues=[];

        var postProcessedData=JSON.parse(JSON.stringify(self.props.postProcessedData));
        if(postProcessedData.constructor == String){
        	postProcessedData=JSON.parse(postProcessedData);
        }

        if(postProcessedData && postProcessedData.selectors){
        	for(var i=0;i<postProcessedData.selectors.length;i++){
        		sitemapValues.push(postProcessedData.selectors[i].id);
        	}
        }

        /*if((self.state.sitemapValue) && self.props.previewData[self.state.sitemapValue]){

        }
        */


		return (<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap line">
					<div className="col-lg-9 col-md-9 col-sm-12 col-xs-12 margin-bottom-gap">
						<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 margin-bottom-gap"><span>{this.props.property}</span></div>
						{/*<div className="operations col-lg-2 col-md-2 col-sm-2 col-xs-2 margin-bottom-gap">
							<input type="text" className="form-control" placeholder="value" onBlur={this.saveText} defaultValue={this.state.sitemapValue}/>
						</div>*/}
						<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 margin-bottom-gap">
							<button type="button"  className="btn btn-default dropdown-toggle form-control textEllipsis" style={{"textTransform":"none","padding":"0","fontSize":"14px"}} title="Click here to change"  data-toggle="dropdown">
		                       <span ref={(e)=>{self["sitemapValue"]=e}}> {self.state.sitemapValue?self.state.sitemapValue:"Select Value"}</span>
		                        <div className="display-inline-block groubyTransform"  style={{"position": "absolute","right": "0","top":"0"}}>
		                            <span className="sleekIcon-rightarrow fa-2x "></span>
		                        </div>
		                    </button>
		                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12  "   role="menu">
		                       <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
		                       	{
		                            sitemapValues.map(function(value){
		                                return    (<li key={global.guid()} className="h5 link" onClick={this.saveText.bind(this,value)}>{value}</li>)
		                            },this)
		                         }
		                        {/*
		                        	["a"].map(function(temp){
		                        		if(self.props.postProcessedData && self.props.postProcessedData.selectors){
			                            	self.props.postProcessedData.selectors.map(function(value){
			                            		var value = value["id"];
				                                return    (<li key={global.guid()} className="h5 link" onClick={this.saveText.bind(this,value)}>{value}</li>)
				                            },this)
			                            }
		                        	},this)

		                         */}
		                        </div>
		                    </ul>
						</div>
						<div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 margin-bottom-gap pointer" onClick={this.addOperation}>
							Add Operations
						</div>
						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap">
							{
					            arrayCount.map(function(temp,index){
					            	return (<SelectBoxComponent index={index} dependentSchema={self.props.dependentSchema} count={self.state.count} deleteOperation={self.deleteOperation} selectedProp={self.props.property} propertyData={self.state.propertyData[index]} setValueToProperty={self.setValueToProperty}/>)
					            })
					        }
						</div>
					</div>
					<div className="col-lg-3 col-md-3 col-sm-2 col-xs-2 margin-bottom-gap">
						{
							(self.state.sitemapValue && self.props.previewData[self.state.sitemapValue]
									&& typeof self.props.previewData[self.state.sitemapValue] == "object")?

								Object.keys(self.props.previewData[self.state.sitemapValue]).map(function(key){
									return (<div className="parent-img-component">
	                                            <div className="child-img-component">
	                                                <span className="">{key}</span>
	                                            </div>
	                                            <div className="child-img-component">
	                                                <span className="">{self.props.previewData[self.state.sitemapValue][key]}</span>
	                                            </div>
                                        	</div>)
								}):(self.state.sitemapValue)?self.props.previewData[self.state.sitemapValue]:""
						}
					</div>
				</div>)
	}
})

var SelectBoxComponent = React.createClass ({
	getInitialState:function(){
		return {
					propertyData:(this.props.propertyData && this.props.propertyData.constructor==Object)?Object.assign({},this.props.propertyData):this.props.propertyData,
					currentOperationValue:(this.props.propertyData && this.props.propertyData.constructor==Object && Object.keys(this.props.propertyData)[0].length>0)?Object.keys(this.props.propertyData)[0]:this.props.propertyData
				};
	},
	valueChanged: function(value) {
		var self=this;
		if(self["selectBox"+self.props.selectedProp]){
			self["selectBox"+self.props.selectedProp].innerHTML=value;
		}

		if(value!=this.state.currentOperationValue){
        	this.setState({currentOperationValue:value},function(){

        	});
        }
      /*  var element = "operationData"+self.props.selectedProp;
        ReactDOM.unmountComponentAtNode(document.getElementById(element));
        ReactDOM.render(<OperationFields operationValue={currentValue} operations={self.state.operations} setValueToOperation={self.setValueToOperation} />,document.getElementById(element));
        //this.props.setPropertyValue(this.props.propertyName,value,this.props.fromArray);*/
    },
    setValueToOperation:function(value){

    	var currentData={};
    	//currentData=this.props.propertyData?Object.assign({},this.props.propertyData):{};
    	if(value.constructor == String){
    		currentData=value;
    	}else{
    		currentData[this.state.currentOperationValue]={};
			currentData[this.state.currentOperationValue]=value;
    	}
		this.props.setValueToProperty(currentData,this.props.index);
    },
    deleteFields:function(index){
    	this.props.deleteOperation(index);
    },

	render:function(){
		var self=this;
		var options = ["stringReplacer","mergeFields","matchWithRegex","generateImageStructure","generateAttachmentStructure","capitalize","trim","stringRange","numericRange","addText","addTextAtBeginning","getValueFromJson","sentenceCase"];
		return(
			<div key={global.guid()} className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap">
				<div className=" col-lg-2 col-md-2 col-sm-2 col-xs-2 ">
					<button type="button"  className="btn btn-default dropdown-toggle form-control textEllipsis" style={{"textTransform":"none","padding":"0","fontSize":"14px"}} title="Click here to change"  data-toggle="dropdown">
                       <span ref={(e)=>{self["selectBox"+self.props.selectedProp]=e}}> {self.state.currentOperationValue?self.state.currentOperationValue:"Select Operation"}</span>
                        <div className="display-inline-block groubyTransform"  style={{"position": "absolute","right": "0","top":"0"}}>
                            <span className="sleekIcon-rightarrow fa-2x "></span>
                        </div>
                    </button>
                    <ul className="dropdown-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12  "   role="menu">
                       <div className="col-lg-12 col-md-12 col-xs-12 col-sm-12">
                        {
                            options.map(function(value){
                                return    (<li key={global.guid()} className="h5 link" onClick={this.valueChanged.bind(this,value)}>{value}</li>)
                            },this)
                         }
                        </div>
                    </ul>


				{/*
					<select ref={(e)=>{self["selectBox"+self.props.selectedProp]=e}} defaultValue={self.state.currentOperationValue!=""?self.state.currentOperationValue:"Select Operation"} onChange={self.valueChanged} className="form-control" >
						<option value="">Select Operation</option>
		                 {
		                    options.map(function(value){

		                    	return    (<option value={value}  >{value}</option>)


		                    })
		                 }
		        </select>*/}
				</div>
				<div className="col-lg-10 col-md-10 col-sm-10 col-xs-10 margin-bottom-gap" id={"operationData"+self.props.selectedProp}>
					<div className="col-lg-10 col-md-10 col-sm-10 col-xs-10">
						<OperationFields operationValue={self.state.currentOperationValue} selectedProp={self.props.selectedProp} dependentSchema={self.props.dependentSchema} deleteOperation={self.props.deleteOperation} index={self.props.index} propertyData={self.state.propertyData} setValueToOperation={self.setValueToOperation} />
					</div>
					{(self.state.currentOperationValue!="Select Operation" && self.props.count>1)?(<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2 display-inline-block pull-right pointer" onClick={self.deleteFields.bind(null,self.props.index)}>DELETE</div>):""}
				</div>
			</div>
		);
	}
});



var OperationFields = React.createClass ({
	shouldComponentUpdate: function(nextProps, nextState) {
		return (JSON.stringify(this.props) != JSON.stringify(nextProps));
    },
	saveFields: function() {
		var self=this;
		var currentValue={};//this.props.propertyData?Object.assign({},this.props.propertyData):{};
		if(self.props.operationValue == "stringReplacer"){
			var replaceText=this.replaceText.value;
	    	var replaceWith=this.replaceWith.value;
	    	if(replaceText!=""){
	    		currentValue["replaceText"]=[replaceText];
	    		currentValue["replaceWith"]=replaceWith;
				/*self.setState({
					value:currentValue,
					showFields:false
				});*/
		    	this.props.setValueToOperation(currentValue);
		    	//document.getElementById("deleteButton"+self.props.selectedProp+self.props.index).className=document.getElementById("deleteButton"+self.props.selectedProp+self.props.index).className.replace("pointer-events","pointer");
	    	}
		}else if(self.props.operationValue == "mergeFields"){
			var mergeWith=this.mergeWith.value;
	    	var mergeFields=this.mergeFields.value.trim();
	    	mergeFields = mergeFields.replace(/\ *\,\ */g, ",");
	    	var fields = mergeFields.split(",");
	    	if(mergeFields!=""){
	    		currentValue["mergeWith"]=mergeWith;
	    		currentValue["fields"]=fields;
				/*self.setState({
					value:currentValue,
					showFields:false
				});*/
		    	this.props.setValueToOperation(currentValue);
	    	}
		}else if(self.props.operationValue == "matchWithRegex"){
			var regexValue=this.regexValue.value.trim();
	    	if(regexValue!=""){
	    		currentValue["regex"]=regexValue;
				/*this.setState({
					value:currentValue,
					showFields:false
				});*/
		    	this.props.setValueToOperation(currentValue);
	    	}
		}else if(self.props.operationValue == "stringRange" || self.props.operationValue == "numericRange"){
			var self=this;
			var rangeData=self.rangeData.value.trim();
			rangeData=JSON.parse(rangeData);
	    	if(rangeData!=""){
	    		currentValue["range"]=rangeData;
				/*this.setState({
					value:currentValue,
					showFields:false
				});*/
		    	this.props.setValueToOperation(currentValue);
	    	}
		}else if(self.props.operationValue == "generateImageStructure" || self.props.operationValue == "generateAttachmentStructure" || self.props.operationValue == "capitalize" || self.props.operationValue =="trim" || self.props.operationValue =="sentenceCase"){
	    	currentValue=self.props.operationValue;
	    		//currentValue["value"]=self.props.operationValue;
		    	this.props.setValueToOperation(currentValue);
		}else if(self.props.operationValue == "addText" || self.props.operationValue == "addTextAtBeginning"){
			var textToBeAdded=this.textToBeAdded.value;
	    	if(textToBeAdded!=""){
	    		currentValue["text"]=textToBeAdded;
				/*this.setState({
					value:currentValue,
					showFields:false
				});*/
		    	this.props.setValueToOperation(currentValue);
	    	}
		}else if(self.props.operationValue == "getValueFromJson"){
			var keyText=this.keyText.value.trim();
	    	if(keyText!=""){
	    		currentValue["keyText"]=keyText;
				/*this.setState({
					value:currentValue,
					showFields:false
				});*/
		    	this.props.setValueToOperation(currentValue);
	    	}
		}

    },
	render:function(){
		var self=this;
		if(this.props.operationValue){
			return (<div key={global.guid()}>

					{/*

						Object.keys(self.state.value).map(function(key,index){
							return (<div className="col-lg-6 col-md-6 col-sm-12 col-xs-12 margin-bottom-gap-xs" key={global.guid()} style={{"fontSize":"12px"}}>
								    	<div className="parent-img-component ">
								        	<div className="child-img-component extra-padding-right-sm ">
		                                        <div className="col-lg-10 col-md-10 col-sm-10 col-xs-10">
			                                    	{self.state.value[key]}
			                                    </div>
		                                    </div>
		                                    {
		                                    	((Object.keys(self.state.value)).length-1 == index)?(<div className="child-img-component">
		                                    	<span className="icons8-delete link pull-right" onClick={self.deleteProperty.bind(null,key)}></span>
		                                    </div>):("")
		                                    }

		                                 </div>
		                             </div>)
		                 })*/
					}


					{
						(self.props.operationValue == "stringReplacer")?(<div>

							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.replaceText=e} defaultValue={(this.props.propertyData && this.props.propertyData["stringReplacer"] && this.props.propertyData["stringReplacer"].replaceText.length>0)?this.props.propertyData["stringReplacer"].replaceText.toString():""} placeholder="Replace Text" />
								</div>
								<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.replaceWith=e} defaultValue={(this.props.propertyData && this.props.propertyData["stringReplacer"] && this.props.propertyData["stringReplacer"].replaceWith)?this.props.propertyData["stringReplacer"].replaceWith:""} placeholder="Replace With" />
								</div>
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>


							</div>
						</div>):("")
					}
					{
						(self.props.operationValue == "mergeFields")?(<div>
							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.mergeWith=e} defaultValue={(this.props.propertyData && this.props.propertyData["mergeFields"] && this.props.propertyData["mergeFields"].mergeWith)?this.props.propertyData["mergeFields"].mergeWith:""} placeholder="Merge With" />
								</div>
								<div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.mergeFields=e} defaultValue={(this.props.propertyData && this.props.propertyData["mergeFields"] && this.props.propertyData["mergeFields"].fields && this.props.propertyData["mergeFields"].fields.length>0)?this.props.propertyData["mergeFields"].fields.toString():""} placeholder="Enter fields to merge separated by comma" />
								</div>
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>
							</div>

						</div>):("")
					}
					{
						(self.props.operationValue == "matchWithRegex")?(<div>

							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.regexValue=e} defaultValue={(this.props.propertyData && this.props.propertyData["matchWithRegex"] && this.props.propertyData["matchWithRegex"].regex)?this.props.propertyData["matchWithRegex"].regex:""} placeholder="Enter regex" />
								</div>
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>
							</div>
						</div>):("")
					}
					{
						(self.props.operationValue == "stringRange" || self.props.operationValue == "numericRange")?(<div>

							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">

								{
									["a"].map(function(temp){
										if(self.props.dependentSchema && self.props.dependentSchema[self.props.selectedProp] && self.props.dependentSchema[self.props.selectedProp]["dataType"].options && self.props.dependentSchema[self.props.selectedProp]["dataType"].options.length){
											var data="{";
											self.props.dependentSchema[self.props.selectedProp]["dataType"].options.map(function(valOpt,index){

												if(valOpt){
													data+="\""+valOpt+"\": ";
												}
												if(self.props.propertyData && self.props.propertyData["stringRange"] && self.props.propertyData["stringRange"][valOpt] && self.props.propertyData["stringRange"][valOpt].length>0){
													data+="["+JSON.stringify(self.props.propertyData["stringRange"][valOpt])+"]";
												}else{
													data+="[]";
												}
												if(index<self.props.dependentSchema[self.props.selectedProp]["dataType"].options.length-1){
													data+=",\n";
												}else{

												}

											})
											data+="}"
											return (<div className="col-lg-8 col-md-8 col-sm-8 col-xs-12">
														<textarea className="form-control"
																  ref={(e)=>self.rangeData=e}
																  defaultValue={data}
																  placeholder="Enter Range"
																  style={{"height": "100px"}}></textarea>


														{/*}<div className="col-lg-8 col-md-8 col-sm-8 col-xs-12">
															{
																self.props.dependentSchema[self.props.selectedProp]["dataType"].options.map(function(valOpt){
																	return(<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
																				<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
																					{valOpt}
																				</div>
																				<div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
																					<input type="text" className="form-control" ref={(e)=>self["SR"+valOpt]=e} defaultValue={(self.props.propertyData && self.props.propertyData["stringRange"] && self.props.propertyData["stringRange"][valOpt] &&  self.props.propertyData["stringRange"][valOpt].length>0)?self.props.propertyData["stringRange"][valOpt].toString():""} placeholder="Enter value " />
																				</div>
																			</div>)
																})
															}
														</div>
														<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.save}>SET</div>
													{/*<textarea className="form-control" ref={(e)=>self.rangeData=e} defaultValue={(self.props.propertyData && self.props.propertyData[self.props.operationValue] && self.props.propertyData[self.props.operationValue].range)?JSON.stringify(self.props.propertyData[self.props.operationValue].range):""} placeholder="Enter Range" style={{"height": "100px"}}></textarea>*/}
													</div>)
										}else{
											return (<div className="col-lg-8 col-md-8 col-sm-8 col-xs-12">
														<textarea className="form-control" ref={(e)=>self.rangeData=e} defaultValue={(self.props.propertyData && self.props.propertyData[self.props.operationValue] && self.props.propertyData[self.props.operationValue].range)?self.props.propertyData[self.props.operationValue].range:""} placeholder="Enter Range" style={{"height": "100px"}}></textarea>
													</div>)
										}
									})
								}
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>




								{/*<textarea className="form-control" ref={(e)=>this.rangeData=e} defaultValue={(this.props.propertyData && this.props.propertyData[self.props.operationValue] && this.props.propertyData[self.props.operationValue].range)?this.props.propertyData[self.props.operationValue].range:""} placeholder="Enter Range" style={{"height": "100px"}}>
										{
											["a"].map(function(temp){
												if(self.props.dependentSchema && self.props.dependentSchema[self.props.selectedProp] && self.props.dependentSchema[self.props.selectedProp]["dataType"].options && self.props.dependentSchema[self.props.selectedProp]["dataType"].options.length){
													return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" ref={(e)=>self.rangeData=e} defaultValue={(self.props.propertyData && self.props.propertyData[self.props.operationValue] && self.props.propertyData[self.props.operationValue].range)?self.props.propertyData[self.props.operationValue].range:""}>
																{
																	self.props.dependentSchema[self.props.selectedProp]["dataType"].options.map(function(option){
																		return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
											                                        <div className="parent-img-component">
											                                            <div className="child-img-component">
											                                                {option}
											                                            </div>
											                                            <div className="child-img-component">
											                                                <input type="text" className="form-control"  placeholder="Enter text separated by comma" />
											                                            </div>
											                                        </div>
											                                    </div>)
																	})
																}
															</div>)
												}else{
													return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
																<textarea className="form-control" ref={(e)=>self.rangeData=e} defaultValue={(self.props.propertyData && self.props.propertyData[self.props.operationValue] && self.props.propertyData[self.props.operationValue].range)?self.props.propertyData[self.props.operationValue].range:""} placeholder="Enter Range" style={{"height": "100px"}}></textarea>
															</div>)
												}
											})
										}
								{/*</textarea>*/}
								</div>
						</div>):("")
					}
					{
						(self.props.operationValue == "generateImageStructure" || self.props.operationValue == "generateAttachmentStructure" || self.props.operationValue == "capitalize" || self.props.operationValue =="trim" || self.props.operationValue =="sentenceCase")?(<div>

							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">{self.props.operationValue}</div>
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>
							</div>
						</div>):("")
					}
					{
						(self.props.operationValue == "addText" || self.props.operationValue == "addTextAtBeginning")?(<div>

							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.textToBeAdded=e} defaultValue={(this.props.propertyData && this.props.propertyData[self.props.operationValue] && this.props.propertyData[self.props.operationValue].text)?this.props.propertyData[self.props.operationValue].text:""} placeholder="Enter text" />
								</div>
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>
							</div>
						</div>):("")
					}
					{
						(self.props.operationValue == "getValueFromJson")?(<div>

							<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
								<div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">
									<input type="text" className="form-control" ref={(e)=>this.keyText=e} defaultValue={(this.props.propertyData && this.props.propertyData["getValueFromJson"] && this.props.propertyData["getValueFromJson"].keyText)?this.props.propertyData["getValueFromJson"].keyText:""} placeholder="Enter text" />
								</div>
								<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={self.saveFields}>SET</div>
							</div>
						</div>):("")
					}



				</div>);
		}else{
			return (<div className="hidden" />)
		}
	}

});


var CreatePreFillFields = React.createClass ({
	getInitialState:function(){
		return {
					value:(this.props.propertyData && this.props.propertyData.prefillData)?this.props.propertyData.prefillData:{},
					propertyData:this.props.propertyData?this.props.propertyData:{}

				};
	},
	saveFields:function(){
		var self=this;
    	var property=this.propertyField.value.trim();
    	var value=this.valueField.value.trim();
    	var currentValue=this.state.value;
    	if(property!="" && value!=""){
    		currentValue[property]=value;
			this.setState({value:currentValue},function(){
				self.forceUpdate();
			});
	    	this.props.setPreFillValueToProperty(property,value);
	    	self.propertyField.value="";
	    	self.valueField.value="";

    	}

	},
	deleteProperty:function(key){
    	var currentValue=this.state.value;
    	delete currentValue[key];
		this.setState({value:currentValue},function(){
			self.forceUpdate();
		});
    	this.props.deletePreFillValue(key);
    	console.log("prefill-----"+this.state.value);
    },

	render:function(){
		var self=this;
				return(<div>

					{
       					Object.keys(self.state.value).map(function(key){
   							return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 margin-bottom-gap-sm" key={global.guid()} style={{"fontSize":"12px"}}>
       							        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 parent-img-component ">
       							            <div className="col-lg-10 col-md-10 col-sm-12 col-xs-12 child-img-component extra-padding-right-sm ">
        	                                       <div className="col-lg-5 col-md-5 col-sm-12 col-xs-12" >
        	                                            {key}
        	                                       </div>
                                                    <div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">
        	                                            {self.state.value[key]}
        	                                       </div>
    	                                     </div>
                                             <div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 child-img-component">
    	                                            <span className="icons8-delete link" onClick={self.deleteProperty.bind(null,key)}></span>
    	                                      </div>
    	                                 </div>
    	                             </div>)
                         })
       				}



						<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
							<div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">
								<input type="text" className="form-control" ref={(e)=>this.propertyField=e} placeholder="Property" />
							</div>
							<div className="col-lg-5 col-md-5 col-sm-12 col-xs-12">
								<input type="text" className="form-control" ref={(e)=>this.valueField=e} placeholder="Value" />
							</div>
							<div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 pointer" onClick={this.saveFields}>ADD</div>

						</div>
				</div>);
	}
})



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





var PropertyHandler = React.createClass({
	getInitialState:function(){
		var self=this;

		return {data : this.props.data,searchText:""};
	},
	render:function(){

	}
});








var globalOperations = {
	assign : function(scrappedRecord, propertyJson, callback) {
	callback(scrappedRecord[propertyJson.value]);
	},
	trim : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	console.log(value);
	if (value.constructor == String) {
	callback(value.trim());
	}
	callback("");
	},
	replaceNewLine : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];

	if (value.constructor == String) {
	callback(value.replace(/\n/g, ''));
	}
	callback("");
	},
	replaceSpaces : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];

	if (value.constructor == String) {
	callback(value.replace(/\s/g, ''));
	}
	callback("");
	},
	matchWithRegex : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	if (value) {
	var regex = propertyJson.regex;
	var res = value.match(regex);
	console.log("matchWithRegex res: ", res);
	if (res) {
	console.log("matchWithRegex res1: ");
	if (!res.input) {
	console.log("matchWithRegex !res.input: ", res);
	if(res.constructor == Array){
	res=res[0];
	/* if(res.index == 0 || res.index){
	res=res[res.index];
	}else{
	res=res[0];
	} */
	}
	if(res == null){
	res="";
	}
	callback(res);
	} else {
	console.log("matchWithRegex res.input: ", res);
	if(res.constructor == Array){
	res=res[0];
	/* if(res.index == 0 || res.index){
	res=res[0];
	}else{

	} */
	}
	if(res == null){
	res="";
	}
	console.log("matchWithRegex going back ", res);
	callback(res);
	}
	} else {
	callback("");
	}
	// return value.match(regex);
	} else {
	callback("");
	}

	},
	numericRange : function(scrappedRecord, propertyJson, callback) {
	// console.log("%%%% "+scrappedRecord[propertyJson.value])
	var value = Number(scrappedRecord[propertyJson.value].toString()
	.replace(/\./g, "").replace(/,/g, ""));

	if (value) {
	var range = propertyJson.range;
	for (var i = 0; i < Object.keys(range).length; i++) {
	var rangeKey = Object.keys(range)[i].split("-");
	// console.log("sat "+value);

	if (rangeKey[1] != "Infinity") {
	if (value >= Number(rangeKey[0])
	&& value <= Number(rangeKey[1])) {

	callback(range[Object.keys(range)[i]]);
	break;
	}
	} else {
	// console.log(" "+value)
	if (value >= Number(rangeKey[0])) {

	callback(range[Object.keys(range)[i]]);
	break;
	}
	}
	}
	} else {
	callback("");
	}
	},
	stringRange : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value].toString();
	//console.log("Srange value: ", value);
	if (value) {
	var range = propertyJson.range;
	var res = [];
	for (var i = 0; i < Object.keys(range).length; i++) {
	var rangeKey = Object.keys(range)[i];

	var rangeValues = range[rangeKey];

	for(var rangeIndx in rangeValues){
	var rangeTxt = rangeValues[rangeIndx];
	//console.log(value.toLowerCase(), (rangeTxt.toLowerCase()), value.toLowerCase().indexOf(rangeTxt.toLowerCase()));
	if (value.toLowerCase().indexOf(rangeTxt.toLowerCase()) != -1) {//ignore case here
	res.indexOf(rangeKey)==-1?res.push(rangeKey):'';
	console.log('res', res);
	}
	}


	}


	if (!res.length) {
	//res.push("Other");
	}
	callback(res);
	} else {
	callback("");
	}
	},
	generateImageStructure : function(scrappedRecord, propertyJson, callback) {
	var images = scrappedRecord[propertyJson.value];

	// start from here
	if (!Array.isArray(images)) {// convert value into Array
	if (images && images.indexOf && images.indexOf(",") != -1) {
	images = images.split(",");
	} else {
	images = [ images ];
	}

	}

	if(dataParseTemplate.Schema == "collection"){
	var type = propertyJson.type;

	var image = [];
	var flag = false;
	// console.log(images)
	for (var i = 0; i < images.length; i++) {
	var id = Utility.guid();
	var temp = {
	"cloudinaryId" : id,
	"name" : id,
	"caption": "",
	"url" : images[i].indexOf("http://")==-1?(images[i].indexOf("//")==0?"http:"+images[i]:images[i]):images[i]
	};

	image.push(temp);

	}
	console.log(image);
	callback(image);
	}else{
	var type = propertyJson.type;

	var productImages = [];
	var flag = false;
	// console.log(images)
	for (var i = 0; i < images.length; i++) {
	var id = Utility.guid();
	var temp = {
	"cloudinaryId" : id,
	"imageName" : id,
	"caption": "",
	"url" : images[i].indexOf("http://")==-1?(images[i].indexOf("//")==0?"http:"+images[i]:images[i]):images[i]
	};

	if(decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g) != null && decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0]){
		temp['caption']= decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0].replace("/", "");
	}else{
		console.log("null coming::: "+ temp.url);
	}
	if (type == "image") {

	productImages.push({
	"produtImages" : [ temp ],
	"variant" : ""
	});
	} else {
		productImages.push(temp);
	}
	}
	console.log(productImages);
	callback(productImages);
	}


	},
	generateAttachmentStructure : function(scrappedRecord, propertyJson, callback){
		var images = scrappedRecord[propertyJson.value];
		// start from here

		if (!Array.isArray(images)) {// convert value into Array
			if (images && images.indexOf && images.indexOf(",") != -1 && images.match(/,\ *http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/)) {
				if(images.match(/,\ *http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/).length){

				}
				var multipleImgs=images.split(",");
				var canSplit=false;
				for(var img=0; img<multipleImgs.length; img++){
					if(multipleImgs[img].match(/http(s?):\/\/[a-zA-Z0-9\=\-\.\/\w\W]+/)){
						canSplit=true;
					}else{
						canSplit=false;
					}
				}

				if(canSplit){
					images = images.split(",");
				}else {
					images = [ images ];
				}

			} else {
				images = [ images ];
			}

		}

		//var type = propertyJson.type;

		var productImages = [];
		var flag = false;
		// console.log(images)
		for (var i = 0; i < images.length; i++) {
			var id = Utility.guid();
			var temp = {
				"cloudinaryId" : id,
				"imageName" : id,
				"caption": "",
				"url" : images[i].indexOf("http://")==-1?(images[i].indexOf("//")==0?"http:"+images[i]:images[i]):images[i]
			};

			if(decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g) != null && decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0]){
				temp['caption']= decodeURI(temp.url).match(/\/[a-zA-Z\ \_\,\.\-0-9\=\&\?\!\`\@\#\$\%\^]*$/g)[0].replace("/", "");
			}else{
				console.log("null coming::: "+ temp.url);
			}
			productImages.push(temp);

		}
		console.log(productImages);
		callback(productImages);

	},
	processWithNLP : function(scrappedRecord, propertyJson, callback) {
	console.log('op ex start');
	var value = scrappedRecord[propertyJson.value];
	var keys = propertyJson.key;
	var keysLen = propertyJson.key.length;

	if (value) {
	subProcess(0);
	} else {
	callback("");
	}

	function subProcess(keyIndex) {
	if (keyIndex < keysLen) {
	nlp.getFromNLP(value, keys[keyIndex], function(res) {

	// value = res.join(" ");
	value = res.toString();
	console.log("______" + value)
	if (value) {
	subProcess(keyIndex + 1)
	} else {
	callback(value);
	}
	});
	} else {
	callback(value);
	}
	}
	},
	mergeFields : function(scrappedRecord, propertyJson, callback) {
	var fields = propertyJson.fields;
	var fieldsLen = propertyJson.fields.length;
	var temp = "";
	var mergeText = propertyJson.mergeWith;
	for (var i = 0; i < fieldsLen; i++) {
		if(i==fieldsLen-1){
			temp = temp + (scrappedRecord[fields[i]]?scrappedRecord[fields[i]]:"");
		}else{
			temp = temp + (scrappedRecord[fields[i]]?scrappedRecord[fields[i]]:"") + (mergeText?mergeText:"");
		}

	}
	/*
	if(temp.lastIndexOf(mergeText) == temp.length-1){
		console.log(temp);
		temp=temp.slice(0, -(mergeText.length));
		console.log(temp);
	}*/

	console.log(temp)
	callback(temp);
	},
	stringReplacer : function(scrappedRecord, propertyJson, callback) {
	console.log("SR called");
	var value = scrappedRecord[propertyJson.value];
	var replaceText = propertyJson.replaceText;
	var replaceWith = propertyJson.replaceWith;
	var finalValue = "";
	finalValue = value;

	for (var i = 0; i < replaceText.length; i++) {
	// console.log(finalValue);
	finalValue = finalValue.replace(replaceText[i], replaceWith);
	}

	console.log("SR b -- "+finalValue);

	//finalValue = finalValue.replace("-", "");

	console.log("SR -- "+finalValue);
	callback(finalValue);
	},
	getValueFromJson : function(scrappedRecord, propertyJson, callback) {
	console.log("getValue called");
	var value = scrappedRecord[propertyJson.value];
	var keyName = propertyJson.keyText;
	var finalValue = "";
	finalValue = value;

	if(value.constructor == Object && value.hasOwnProperty(keyName)){
	finalValue=value[keyName];
	}else if(!value.hasOwnProperty(keyName)){
	finalValue="";
	}

	if(finalValue == undefined || finalValue == null){
	finalValue="";
	}
	console.log("getValue -- "+finalValue);
	callback(finalValue);
	},
	capitalize : function(scrappedRecord, propertyJson, callback) {
	console.log("getValue called");
	var value = scrappedRecord[propertyJson.value];
	//var keyName = propertyJson.keyText;
	var finalValue = "";
	finalValue = value;

	if(finalValue.constructor == String){
	finalValue=finalValue.toLowerCase();
	finalValue=finalValue.capitalize();
	}
	console.log("getValue -- "+finalValue);
	callback(finalValue);
	},
	addText : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	var text = propertyJson.text;
	if(value.constructor == String){
	callback(value+text);
	}else{
	callback(value);
	}


	},
	addTextAtBegining : function(scrappedRecord, propertyJson, callback) {
	var value = scrappedRecord[propertyJson.value];
	var text = propertyJson.text;
	if(value.constructor == String){
	callback(text+value);
	}else{
	callback(value);
	}


	}
};
