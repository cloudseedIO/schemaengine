/**
 * @author saikiran
 */

var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var WebAPI=require("../../utils/WebAPIUtils.js");
var manageSchema = require("./manageSchemaNew.jsx");
var triggerComposition = require('./TriggerComposition.jsx');
var global=require('../../utils/global.js');
var allServices={};
var serviceDoc={};
function createRestAPI(){
	$("#pageStatus").text("");
	$("#landingPage").css("display","none");
	console.log(ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv')));
	ReactDOM.render(<CreateRestApi  edit={"false"} schemaObjects ={""} mainTitle={"Create Service"} subTitle={"Service Name"} placeholder={"Enter Service Name"}  />, document.getElementById('dynamicContentDiv'));
	
}
function editRestAPI(){
	$("#pageStatus").text("");
	$("#landingPage").css("display","none");
	var subTitle= "";
	var mainTitle= "";
	var placeholder = "";
	console.log(ReactDOM.unmountComponentAtNode(document.getElementById('dynamicContentDiv')));
	ReactDOM.render(<CreateRestApi edit={"true"} schemaObjects ={""} mainTitle={"Edit Service"} subTitle={"Service Name"} placeholder={"Enter Service Name"} />, document.getElementById('dynamicContentDiv'));
}

var CreateRestApi = React.createClass({
	getInitialState:function(){
		return {serviceName:"",
				apiEndPointURL:"",
				otherConfigs:[{key:"", value:"", useAsInParam:false}],
				pathAndParams:[{path:"", queryParams: [{key:"", value:""}], method:"", result:"", pathParams:[{key:"", value:""}], data:[{dataKey:"", value:"", child:[]}]}]
				};
	},
	addMoreData:function(index){
		var self=this;
		var otherConfigs=self.state.otherConfigs;
		otherConfigs.push({key:"", value:"", useAsInParam:false});
		self.setState({otherConfigs:otherConfigs});
	},
	removeMoreData:function(index){
		var self=this;
		var otherConfigs=self.state.otherConfigs;
		otherConfigs.splice(index, 1);
		self.setState({otherConfigs:otherConfigs});
	},
	addParam:function(pathIndex, index){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].queryParams.push({key:'', value:''});
		console.log(pathAndParams);
		self.setState({pathAndParams: pathAndParams});
	},
	removeParam:function(pathIndex, index){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].queryParams.splice(index, 1);
		self.setState({pathAndParams: pathAndParams});
	},
	addPathParam:function(pathIndex, index){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].pathParams.push({key:'', value:''});
		console.log(pathAndParams);
		self.setState({pathAndParams: pathAndParams});
	},
	removePathParam:function(pathIndex, index){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].pathParams.splice(index, 1);
		self.setState({pathAndParams: pathAndParams});
	},
	addDataParam:function(pathIndex, index){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		if(pathAndParams[pathIndex].data[index].dataKey && pathAndParams[pathIndex].data[index].value){
			pathAndParams[pathIndex].data.push({dataKey:'', value:'', child:[]});
			console.log(pathAndParams);
			self.setState({pathAndParams: pathAndParams});
		}else{
			alert("Fill required values");
		}
	},
	removeDataParam:function(pathIndex, index){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].data.splice(index, 1);
		self.setState({pathAndParams: pathAndParams});
	},
	setKey:function(index, ev){
		var self=this;
		if(ev.target.value || self.state.otherConfigs[index].key){
			var otherConfigs=self.state.otherConfigs;
			otherConfigs[index].key=ev.target.value;
			self.setState({otherConfigs:otherConfigs});
		}else{
			self.setState({otherConfigs:self.state.otherConfigs});
		}
	},
	setUseAsInParam:function(index, ev){
		var self=this;
		console.log(ev.target.checked);
		var otherConfigs=self.state.otherConfigs;
		otherConfigs[index].useAsInParam=!otherConfigs[index].useAsInParam;
		self.setState({otherConfigs:otherConfigs});
	},
	setValue:function(index, ev){
		var self=this;
		if(ev.target.value || self.state.otherConfigs[index].value){
			var otherConfigs=self.state.otherConfigs;
			otherConfigs[index].value=ev.target.value;
			self.setState({otherConfigs:otherConfigs});
		}else{
			self.setState({otherConfigs: self.state.otherConfigs});
		}
		
	},
	setParamName:function(pathIndex, index, ev){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].queryParams[index].key=ev.target.value;
		self.setState({pathAndParams: pathAndParams});
	},
	setParamValue:function(pathIndex, index, ev){
		var self=this;
		if(ev.target.value || self.state.pathAndParams[pathIndex].queryParams[index].value){
			var pathAndParams=self.state.pathAndParams;
			pathAndParams[pathIndex].queryParams[index].value=ev.target.value;
			self.setState({pathAndParams: pathAndParams});
		}else{
			self.setState({pathAndParams: self.state.pathAndParams});
		}
	},
	setPathParamName:function(pathIndex, index, ev){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].pathParams[index].key=ev.target.value;
		self.setState({pathAndParams: pathAndParams});
	},
	setPathParamValue:function(pathIndex, index, ev){
		var self=this;
		if(ev.target.value || self.state.pathAndParams[pathIndex].pathParams[index].value){
			var pathAndParams=self.state.pathAndParams;
			pathAndParams[pathIndex].pathParams[index].value=ev.target.value;
			self.setState({pathAndParams: pathAndParams});
		}else{
			self.setState({pathAndParams: self.state.pathAndParams});
		}
	},
	setDataName:function(pathIndex, index, ev){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].data[index].dataKey=ev.target.value;
		self.setState({pathAndParams: pathAndParams});
	},
	setDataValue:function(pathIndex, index, ev){
			var self=this;
			var pathAndParams=self.state.pathAndParams;
			pathAndParams[pathIndex].data[index].value=ev.target.innerText;
			if(ev.target.innerText=="Object" || ev.target.innerText=="Array of Objects" ){
				pathAndParams[pathIndex].data[index].child=[{dataKey:"", value:"", child:[]}];
				/*
				if(pathAndParams[pathIndex].data[index].value=="Array of Objects"){
					 if(pathAndParams[pathIndex].data[index].child.length==0){
						pathAndParams[pathIndex].data[index].child.push({dataKey:"", value:"", child:[]});
					 }else{
					 	pathAndParams[pathIndex].data[index].child=[{dataKey:"", value:"", child:[]}];
					 }
				}else{
					pathAndParams[pathIndex].data[index].child.push({dataKey:"", value:"", child:[]});
				}*/
				
			}else if(ev.target.innerText=="String"){
				var txt=prompt("Enter value for the String");
				
				pathAndParams[pathIndex].data[index].child=[];
				if(txt){
					pathAndParams[pathIndex].data[index].value=txt;
				}else{
					pathAndParams[pathIndex].data[index].value=ev.target.innerText;
				}
				
			}else{
				pathAndParams[pathIndex].data[index].child=[];
			}
			self.setState({pathAndParams: pathAndParams});
			self.setState({pathAndParams: self.state.pathAndParams});
	},
	checkForService:function(ev){
		var self=this;
		var serviceName=ev.target.value;
		var input=ev.target;
		if(serviceName){
			common.startLoader();
			WebUtils.doPost("/restApiService?operation=checkServiceName", {serviceName: serviceName}, function(isAvailable){
				common.stopLoader();
				
				if(isAvailable.status){
					self.setState({serviceName: serviceName});
				}else{
					alert("Service Already Exists");
					input.value="";
				}
			});
		}else{
			self.setState({serviceName: serviceName});
		}
		
	},
	setServiceURL:function(ev){
		if(ev.target.value || this.state.apiEndPointURL){
			var self=this;
			var url=ev.target.value;
			self.setState({apiEndPointURL: url});
		}
	},
	setPath:function(pathIndex, ev){
		var self=this;
		if(ev.target.value || self.state.pathAndParams[pathIndex].path){
			var path=ev.target.value;
			var pathAndParams=self.state.pathAndParams;
			pathAndParams[pathIndex].path=(path[0]=="/"? path: "/"+path);
			self.setState({pathAndParams: pathAndParams});
		}
	},
	setMethod:function(pathIndex, ev){
		var self=this;
		var path=ev.target.value;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams[pathIndex].method=ev.target.innerText;
		self.setState({pathAndParams: pathAndParams});
	},
	addMorePath:function(pathIndex){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams.push({path:"", queryParams: [{key:"", value:""}], method:"", result:"", pathParams:[{key:"", value:""}], data:[{dataKey:"", value:"", child:[]}]});
		self.setState({pathAndParams: pathAndParams});
	},
	removeMorePath:function(pathIndex){
		var self=this;
		var pathAndParams=self.state.pathAndParams;
		pathAndParams.splice(pathIndex, 1);
		self.setState({pathAndParams: pathAndParams});
	},
	componentWillMount:function(){
		common.startLoader();
	},
	componentDidMount:function(){
		common.stopLoader();
	},
	testAPI:function(pathIndex){
		var self=this;
		var doc={};
		if(!self.state.apiEndPointURL){
			alert("Kindly Enter API EndPoint URL.");
			return;
		}
		if(!self.state.pathAndParams[pathIndex].path){
			alert("Kindly Enter path value.");
			return;
		}
		if(!self.state.pathAndParams[pathIndex].method){
			alert("Select a Method to invoke.");
			return;
		}
		
		
		doc['serviceName']=self.state.serviceName;
		doc['apiEndPointURL']=self.state.apiEndPointURL+self.state.pathAndParams[pathIndex].path;
		doc['otherConfigs']=[];
		if(self.state.pathAndParams[pathIndex].path.indexOf("$")!=-1){
			doc['path']={};
			self.state.pathAndParams[pathIndex].pathParams.forEach(function(pathParam){
				if(pathParam.key && pathParam.value){
					doc['path'][pathParam.key]=pathParam.value;
				}
			});
		}
		if(self.state.pathAndParams[pathIndex].path.indexOf("${")!=-1 && Object.keys(doc['path']).length==0){
			alert("Kindly configure Path and path parameters properly");
			return;
		}
		
		doc['method']=self.state.pathAndParams[pathIndex].method;
		self.state.otherConfigs.forEach(function(data){
			if(data.key && data.value && !data.useAsInParam){
				doc['otherConfigs'].push(data);
			}
		});
		doc['parameters']={};
		self.state.pathAndParams[pathIndex].queryParams.forEach(function(param){
			if(param.key && param.value){
				doc['parameters'][param.key]=param.value;
			}
		});
		self.state.otherConfigs.forEach(function(data){
			if(data.dataKey && data.value && data.useAsInParam){
				doc['parameters'][data.dataKey]=data.value;
			}
		});
		doc['data']={};
		if(doc.method!="GET"){
			var dataJson={};
			
			self.state.pathAndParams[pathIndex].data.forEach(function(data){
				
				prepareJson(data, dataJson, function(finalTempJson){
					console.log("Final Temp Json");
					console.log(finalTempJson);
					
				});
			});
			doc['data']=dataJson;
		}
		console.log(doc);
		var pathAndParams = self.state.pathAndParams;
		
		common.startLoader();
		WebUtils.doPost("/restApiService?operation=testAPI", {serviceDoc: doc}, function(res){
			common.stopLoader();
			//if(res.status){
				//console.log(JSON.stringify(res.data));
				if(res.data.constructor==String && res.data.indexOf("html")==-1){
					pathAndParams[pathIndex].result=res.data;
					self.setState({pathAndParams: pathAndParams});
				}else{
					pathAndParams[pathIndex].result=JSON.stringify(res.data);
					self.setState({pathAndParams: pathAndParams});
				}
				
			//}
		});
		
	},
	done:function(){
		var self=this;
		var url=self.state.apiEndPointURL;
		// /^(http|ftp|https):\/\/(www\.)?[\w]+(\.[\w]+)$/.test(url)
		
		var urlArray = url.split("/"); 
		if(urlArray.length==3 && (urlArray[2].split(".")).length==3 && self.state.serviceName){
			var doc={};
			common.startLoader();
			if(self.props.edit!="true"){
				doc={
						docType:serviceDoc.docType,
						recordId:serviceDoc.recordId,
						serviceName:serviceDoc.serviceName,
						apiEndPointURL:serviceDoc.apiEndPointURL,
						otherConfigs:[],
						pathAndParams:[],
						author:serviceDoc.author,
						editor:serviceDoc.editor,
						dateCreated:serviceDoc.dateCreated,
						dateModified:serviceDoc.dateModified,
						revision:serviceDoc.revision,
						cloudPointHostId:serviceDoc.cloudPointHostId,
						active:true,
						$status:serviceDoc.$status
						};
				doc['serviceName']=self.state.serviceName;
				doc['apiEndPointURL']=self.state.apiEndPointURL;
				doc['otherConfigs']=[];
				self.state.otherConfigs.forEach(function(data){
					if(data.key && data.value){
						doc['otherConfigs'].push(data);
					}
				});
				
				doc['pathAndParams']=[];
				self.state.pathAndParams.forEach(function(pathAndParam){
					var pathParam={path: pathAndParam.path,
						queryParams: [],
						method: pathAndParam.method,
						pathParams: [],
						data: []
						};
					pathAndParam.queryParams.forEach(function(queryParam){
						if(queryParam.key){
							pathParam.queryParams.push(queryParam);
						}
					});
					pathAndParam.pathParams.forEach(function(pathParam1){
						if(pathParam1.key){
							pathParam.pathParams.push(pathParam1);
						}
					});
					
					pathAndParam.data.forEach(function(d){
						if(d.dataKey){
							pathParam.data.push(d);
						}
					});
					
					doc.pathAndParams.push(pathParam);
					console.log(doc.pathAndParams);
				});
				
				console.log(doc);
				
				WebUtils.doPost("/restApiService?operation=editRestApiService", {doc: doc}, function(res){
					common.stopLoader();
					console.log(res);
				});
				
			}else{
				doc['serviceName']=self.state.serviceName;
				doc['apiEndPointURL']=self.state.apiEndPointURL;
				doc['otherConfigs']=[];
				self.state.otherConfigs.forEach(function(data){
					if(data.key && data.value){
						doc['otherConfigs'].push(data);
					}
				});
				
				doc['pathAndParams']=[];
				self.state.pathAndParams.forEach(function(pathAndParam){
					var pathParam={path: pathAndParam.path,
						queryParams: [],
						method: pathAndParam.method,
						pathParams: [],
						data: []
						};
					pathAndParam.queryParams.forEach(function(queryParam){
						if(queryParam.key){
							pathParam.queryParams.push(queryParam);
						}
					});
					pathAndParam.pathParams.forEach(function(pathParam1){
						if(pathParam1.key){
							pathParam.pathParams.push(pathParam1);
						}
					});
					
					pathAndParam.data.forEach(function(d){
						if(d.dataKey){
							pathParam.data.push(d);
						}
					});
					
					doc.pathAndParams.push(pathParam);
				});
				
				console.log(doc);
				
				WebUtils.doPost("/restApiService?operation=saveRestApiService", {doc: doc}, function(res){
					common.stopLoader();
					console.log(res);
				});
				
			}
		}else{
			alert("Service Name should be filled And API Endpoint URL should not contain params or any navigation.");
		}
	},
	getAllRestServices:function(ev){
		var self=this;
		common.startLoader();
			WebUtils.doPost("/restApiService?operation=getAllRestApiServices",{},function(schemas){
				if(schemas.error){
					alert(SchemaNames.data.error +"\n select again");
				}
				common.stopLoader();
				console.log(schemas);
				allServices={};
				schemas.forEach(function(schema){
					allServices[schema.id]=schema.value;
				});
				var ele=ev.target;
				var targetEle=ev.target;
				manageSchema.getPopupContent("Select Schema","search","","","");
				ReactDOM.render(<triggerComposition.GetObjectRelationPopup fieldData = {schemas} id={ele} search={"search"} targetEle = {targetEle} calback={self.fillSelectedService}/>,document.getElementById('genericPopupBody'));
			});
	},
	fillSelectedService:function(doc){
		$('#genericDilog,.modal-backdrop').remove();
		doc=doc.value;
		serviceDoc=doc;
		console.log("serviceDoc");
		console.log(serviceDoc);
		var dataDoc={serviceName:"",
				apiEndPointURL:"",
				otherConfigs:[],
				pathAndParams:[]
				};
				
		var self=this;
		
		dataDoc['serviceName']=doc.serviceName;
		dataDoc['apiEndPointURL']=doc.apiEndPointURL;
		dataDoc['otherConfigs']=doc.otherConfigs;
		if(dataDoc['otherConfigs'].length==0){
			dataDoc['otherConfigs']=[{key:"", value:"", useAsInParam:false}];
		}
		
		dataDoc['pathAndParams']=doc.pathAndParams;
		if(dataDoc['pathAndParams'].length==0){
			dataDoc['pathAndParams']=[{path:"",
						queryParams: [{key:"", value:""}],
						pathParams: [{key:"", value:""}],
						method:"", result:"", data:[{dataKey:"", value:""}]
						}];
		}
		if(dataDoc.pathAndParams.length!=0){
			dataDoc.pathAndParams.forEach(function(pathAndParam){
				if(pathAndParam.queryParams.length==0){
					pathAndParam.queryParams=[{key:"", value:""}];
				}
				if(pathAndParam.data.length==0){
					pathAndParam.data=[{key:"", value:"", child:[]}];
				}
				if(pathAndParam.pathParams.length==0){
					pathAndParam.pathParams=[{key:"", value:""}];
				}
				pathAndParam.data.forEach(function(data){
					if(!data.child){
						data['child']=[];
					}
				});
			});
		}
		
		dataDoc['revision']=doc.revision;
		
		self.setState({serviceName: dataDoc['serviceName'],
					 apiEndPointURL: dataDoc['apiEndPointURL'],
					 otherConfigs: dataDoc['otherConfigs'],
					 pathAndParams: dataDoc['pathAndParams']
		 });
	},
	updateData:function(parent, index){
		console.log(arguments);
		var self=this;
		self.state.pathAndParams[index].data.forEach(function(data){
			if(parent.dataKey == data.dataKey){
				console.log("Found: ");
				console.log(data);
				data.child=parent.child;
			}
		});
		self.setState({pathAndParams: self.state.pathAndParams});
	},
	render:function(){
		var self=this;
		var subTitle= this.props.subTitle;
		var mainTitle= this.props.mainTitle;
		var placeholder = this.props.placeholder;
		console.log(self.state);
		return (<div className="row" key={global.guid()}>
					<h3 id="schemastructeditnew" style={{"color":"#666"}} className="remove-margin-top remove-margin-top line col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding ">{mainTitle}</h3>
					<div className="col-lg-12">
					{
						['a'].map(function(){
							if(self.props.edit=="true"){
								return (<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
									<label  className="text-uppercase">Select Service</label>
										<div  className="col-lg-12 no-padding">
										<input type="text" placeholder="Select Service" className="form-control" id="serviceName" onClick={self.getAllRestServices} defaultValue={self.state.serviceName?self.state.serviceName:''} />
										</div>
								</div>)
							}else{
								return (<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
									<label  className="text-uppercase">Enter Service Name</label>
										<div  className="col-lg-12 no-padding">
										<input type="text" placeholder="Enter Service Name" className="form-control" id="serviceName" onBlur={self.checkForService.bind(this)} defaultValue={self.state.serviceName?self.state.serviceName:''} />
										</div>
								</div>)
							}
						})
					}
					
					
					<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding" >
						<label  className="text-uppercase">API Endpoint</label>
							<div  className="col-lg-12 no-padding">
							<input type="text" placeholder="Enter Full URL with http" className="form-control" readOnly={self.props.edit=="true"?true:false} onBlur={self.props.edit=="edit"?'':self.setServiceURL} defaultValue={self.state.apiEndPointURL?self.state.apiEndPointURL:''} />
							</div>
					</div>
					<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding" >
						<label  className="text-uppercase">Configure Other Details</label>
					</div>
					 
					{
						self.state.otherConfigs.map(function(data, index){
							return (<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
								<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
									<input type="checkbox" defaultChecked={data.useAsInParam} onChange={self.setUseAsInParam.bind(this, index) }/>
									<span>Use As Input Param for Every Request</span>
								</div>
							  <div className="col-lg-6 col-md-5 col-xs-12 col-sm-5 no-padding">
								<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						     	 <input type="text" className="form-control" placeholder="Enter name of the key" defaultValue={data.key?data.key:''} onBlur={self.setKey.bind(this, index)}/>
								</div>
							</div>
						  	<div className="col-lg-5 col-md-5 col-xs-12 col-sm-5 no-padding">
								<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
						      		<input type="text" className="form-control" placeholder="Enter value of the key" defaultValue={data.value?data.value:''} onBlur={self.setValue.bind(this, index)}/>
								</div>
							</div>
							{
								['a'].map(function(){
									if(index==self.state.otherConfigs.length-1){
										return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus no-margin" onClick={self.addMoreData.bind(this, index)}></span></div>)
									}else{
										return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus no-margin" onClick={self.removeMoreData.bind(this, index)}></span></div>)
									}
								})
							}
							</div>)
						})
					}
					
					<div  className="col-lg-8 col-md-8 col-xs-12 col-sm-12 no-padding">
						<label  className="text-uppercase">Path Configuration and Input Params</label>
					</div>
					{
						self.state.pathAndParams.map(function(pathAndParam, pathIndex){
							return(<div className="col-lg-8 col-md-8 col-xs-8 col-sm-8 no-padding">
								<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
									<span>{(pathIndex+1)+") Enter Path"}</span>
								</div>
								<div className="col-lg-9 col-md-9 col-xs-9 col-sm-9 no-padding">
									<input type="text" placeholder="Enter Path" className="form-control" onBlur={self.setPath.bind(this, pathIndex)} defaultValue={pathAndParam.path} title="Enter path like /resource/subresource &#013; Use placeholder like /${placeholder}/subresource" />
								</div>
								{
								  	['a'].map(function(){
								  		if(pathIndex==self.state.pathAndParams.length-1){
								  			return <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-right"><button className="btn  btn-warning upload-drop-zone form-control" onClick={self.addMorePath.bind(this, pathIndex)}>Add Another Path</button></div>
								  		}else{
								  			return <div className="col-lg-3 col-md-3 col-xs-3 col-sm-3 no-padding-right"><button className="btn  btn-warning upload-drop-zone form-control" onClick={self.removeMorePath.bind(this,pathIndex)}>Remove Path</button></div>
								  		}
								  	})
								 }
								 {
									pathAndParam.pathParams.map(function(pathParam, index){
										return (<div className="col-lg-12 no-padding">
												
												<div className="col-lg-6 col-md-6 col-xs-12 col-sm-6 no-padding">
											     	 <input type="text" className="form-control" placeholder="Enter name of the path placeholder" defaultValue={pathParam.key?pathParam.key:''} onBlur={self.setPathParamName.bind(this, pathIndex, index)}/>
												</div>
												<div className="col-lg-5 col-md-6 col-xs-12 col-sm-6 no-padding">
											     	 <input type="text" className="form-control" placeholder="Enter value of the path placeholder" defaultValue={pathParam.value?pathParam.value:''} onBlur={self.setPathParamValue.bind(this, pathIndex, index)}/>
												</div>
												{
													['a'].map(function(){
														if(index==pathAndParam.pathParams.length-1){
															return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus no-margin" onClick={self.addPathParam.bind(this, pathIndex, index)}></span></div>)
														}else{
															return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus no-margin" onClick={self.removePathParam.bind(this, pathIndex, index)}></span></div>)
														}
													})
												}
												</div>)
									})
								}
								{
									pathAndParam.queryParams.map(function(param, index){
										return (<div className="col-lg-12 no-padding">
												
												<div className="col-lg-6 col-md-6 col-xs-12 col-sm-6 no-padding">
											     	 <input type="text" className="form-control" placeholder="Enter Query Param name" defaultValue={param.key?param.key:''} onBlur={self.setParamName.bind(this, pathIndex, index)}/>
												</div>
												<div className="col-lg-5 col-md-6 col-xs-12 col-sm-6 no-padding">
											     	 <input type="text" className="form-control" placeholder="Enter Query Param value" defaultValue={param.value?param.value:''} onBlur={self.setParamValue.bind(this, pathIndex, index)}/>
												</div>
												{
													['a'].map(function(){
														if(index==pathAndParam.queryParams.length-1){
															return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus no-margin" onClick={self.addParam.bind(this, pathIndex, index)}></span></div>)
														}else{
															return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus no-margin" onClick={self.removeParam.bind(this, pathIndex, index)}></span></div>)
														}
													})
												}
												</div>)
									})
								}
								<div className="col-lg-12 no-padding">
									<div className="col-lg-6 no-padding"><span>Choose Method</span></div>
									<div className="col-lg-6 no-padding">
										<button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
										 	<span data-bind="label">{pathAndParam.method?pathAndParam.method:"Select a method"}</span>
										</button>
										<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
										  <li onClick={self.setMethod.bind(this, pathIndex)}><span>GET</span></li>
										  <li onClick={self.setMethod.bind(this, pathIndex)}><span>PUT</span></li>
										  <li onClick={self.setMethod.bind(this, pathIndex)}><span>POST</span></li>
										  <li onClick={self.setMethod.bind(this, pathIndex)}><span>DELETE</span></li>
										 </ul>
									</div>
								</div>
								{
									['a'].map(function(){
										if(pathAndParam.method!="GET" && pathAndParam.method!=""){
											return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
												<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12  no-padding">
													<span>Configure Data:</span>
												</div>
												{/*here*/
													pathAndParam.data.map(function(data, dataIndex){
														return (<div className="col-lg-12 no-padding margin-bottom-gap">
												
																	<div className="col-lg-6 col-md-6 col-xs-12 col-sm-6 no-padding">
																     	 <input type="text" className="form-control" placeholder="Enter Data key name" defaultValue={data.dataKey?data.dataKey:''} onBlur={self.setDataName.bind(this, pathIndex, dataIndex)}/>
																	</div>
																	{
																		/*DataConfiguration<div className="col-lg-5 col-md-6 col-xs-12 col-sm-6 no-padding">
																	     	 <input type="text" className="form-control" placeholder="Enter Data value" defaultValue={data.value?data.value:''} onBlur={self.setDataValue.bind(this, pathIndex, dataIndex)}/>
																		</div>*/
																	}
																	
																	<div className="col-lg-5 no-padding">
																		<button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
																		 	<span data-bind="label">{data.value?data.value:''}</span>
																		</button>
																		<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
																		  <li onClick={self.setDataValue.bind(this, pathIndex, dataIndex)}><span>String</span></li>
																		  <li onClick={self.setDataValue.bind(this, pathIndex, dataIndex)}><span>Array of Objects</span></li>
																		  <li onClick={self.setDataValue.bind(this, pathIndex, dataIndex)}><span>Array of Strings/Numbers</span></li>
																		  <li onClick={self.setDataValue.bind(this, pathIndex, dataIndex)}><span>Object</span></li>
																		  <li onClick={self.setDataValue.bind(this, pathIndex, dataIndex)}><span></span></li>
																		 </ul>
																	</div>
																	{
																		['a'].map(function(){
																			if(dataIndex==pathAndParam.data.length-1){
																				return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus no-margin" onClick={self.addDataParam.bind(this, pathIndex, dataIndex)}></span></div>)
																			}else{
																				return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus no-margin" onClick={self.removeDataParam.bind(this, pathIndex, dataIndex)}></span></div>)
																			}
																		})
																	}
																	{
																		['a'].map(function(){
																			if(data.child && data.child.length){
																				return data.child.map(function(child, childIndex){
																					return (<DataConfiguration dataKey={child.dataKey} value={child.value} level={dataIndex} child={child.child} parent={data} callback={self.updateData} childIndex={childIndex} pathIndex={pathIndex} />)
																				})
																			}
																		})
																	}
																	</div>)
													})
												}
												<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
													
												</div>
											</div>)
										}
									})
								}
								<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
									<input className="btn btn-warning upload-drop-zone" type="button" value="TEST" onClick={self.testAPI.bind(this, pathIndex)}/>
								</div>
								{
									['a'].map(function(){
										if(pathAndParam.result && pathAndParam.result.indexOf("html")==-1){
											return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-bottom-gap  text-area">
														<label>Result : </label>
														<span className="h6">{pathAndParam.result?pathAndParam.result:''}</span>
													</div>)		
										}else if(pathAndParam.result && pathAndParam.result.indexOf("html")!=-1){
											return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 margin-bottom-gap  text-area">
														<span className="h6">{pathAndParam.result}</span>
													</div>)
										}
										
									})
								}
							</div>)
						})
					}
					
					<div className="col-lg-8 col-md-8 col-xs-12 col-sm-12 margin-bottom-gap no-padding">
						<input className="btn btn-warning upload-drop-zone" type="button" value="DONE" onClick={self.done}/>
					</div>
					</div>
					
		</div>)
		
	}
});



exports.createRestAPI=createRestAPI;
exports.editRestAPI=editRestAPI;


var DataConfiguration = React.createClass({
	getInitialState:function(){
		var self=this;
		return {dataKey: self.props.dataKey, 
				value: self.props.value,
				child: self.props.child,
				level: self.props.level,
				parent: self.props.parent,
				childIndex: self.props.childIndex};
	},
	setDataValue:function(ev){
		var self=this;
		if((ev.target.innerText=="Object" || ev.target.innerText=="Array of Objects") && self.state.dataKey){
			console.log(self.state.parent.child);
			self.state.parent.child[self.state.childIndex].child=[{dataKey:"", value:"", child:[]}];
			/*
			if(self.state.parent.child[self.state.childIndex].value=="Array of Objects"){
				if(self.state.parent.child.length==0){
					self.state.parent.child[self.state.childIndex].child.push({dataKey:"", value:"", child:[]});
				}else{
					self.state.parent.child[self.state.childIndex].child=[{dataKey:"", value:"", child:[]}];
				}
			}else{
				self.state.parent.child[self.state.childIndex].child.push({dataKey:"", value:"", child:[]});
			}
			*/
			self.state.parent.child[self.state.childIndex].value=ev.target.innerText;
			
			//self.state.child.push({dataKey:"", value:"", child:[]});
			
		}else if(ev.target.innerText=="Array of strings/numbers" && self.state.dataKey){
			
			self.state.child=[];
			self.state.parent.child[self.state.childIndex].value=ev.target.innerText;
		}else if(ev.target.innerText=="String"){
			var txt=prompt("Enter value for the String");
			
			self.state.child=[];
			if(txt){
				self.state.parent.child[self.state.childIndex].value=txt;
			}else{
				self.state.parent.child[self.state.childIndex].value=ev.target.innerText;
			}
			
		}
		self.state.value=ev.target.innerText;
		if(self.props.callback)
		self.props.callback(self.state.parent, self.props.pathIndex);
		//self.setState({value: self.state.value, child:self.state.child});
	},
	setDataName:function(ev){
		var self=this;
		self.state.dataKey=ev.target.value;
		self.state.parent.child[self.state.childIndex].dataKey=ev.target.value;
		
		console.log("Parent key: "+self.state.parent.child[self.props.childIndex].dataKey);
		if(self.props.callback)
		self.props.callback(self.state.parent, self.props.pathIndex);
		//self.setState({dataKey: self.state.dataKey, parent: self.state.parent});
	},
	addDataParamToParent:function(){
		var self=this;
		console.log(self.state);
		console.log(arguments);
		self.state.parent.child.push({dataKey:"", value:"", child:[]});
		if(self.props.callback)
		self.props.callback(self.state.parent, self.props.pathIndex);
		//self.setState({parent: self.state.parent});
	},
	removeDataParamFromParent:function(index){
		var self=this;
		console.log(self.state);
		console.log(arguments);
		self.state.parent.child.splice(index, 1);
		if(self.props.callback)
		self.props.callback(self.state.parent, self.props.pathIndex);
		//self.setState({parent: self.state.parent});
	},
	render:function(){
		var self=this;
		console.log(self);
		
		return (<div className="col-lg-12">
				<div className="col-lg-12 no-padding">
					<span>{self.state.parent.dataKey}</span>
				</div>
				<div className="col-lg-6 col-md-6 col-xs-12 col-sm-6 no-padding">
			     	 <input type="text" className="form-control" placeholder="Enter Data key name" defaultValue={self.state.dataKey?self.state.dataKey:''} onBlur={self.setDataName.bind(this)} />
				</div>
				<div className="col-lg-5 no-padding">
					<button type="button" className="btn btn-default dropdown-toggle form-control" data-toggle="dropdown">
					 	<span data-bind="label">{self.state.value?self.state.value:''}</span>
					</button>
					<ul className="dropdown-menu scrollable-menu scrollable-menu col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding " role="menu">
					  <li onClick={self.setDataValue.bind(this)}><span>String</span></li>
					  <li onClick={self.setDataValue.bind(this)}><span>Array of Objects</span></li>
					  <li onClick={self.setDataValue.bind(this)}><span>Array of strings/numbers</span></li>
					  <li onClick={self.setDataValue.bind(this)}><span>Object</span></li>
					  <li onClick={self.setDataValue.bind(this)}><span></span></li>
					 </ul>
				</div>
				{
					['a'].map(function(){
						if(self.state.childIndex==self.state.parent.child.length-1){
							return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-plus no-margin" onClick={self.addDataParamToParent.bind(this, self.state.childIndex)}></span></div>)
						}else{
							return (<div className="col-lg-1 col-md-1 col-xs-12 col-sm-5"><span className="btn  btn-warning upload-drop-zone glyphicon glyphicon-minus no-margin" onClick={self.removeDataParamFromParent.bind(this, self.state.childIndex, self.state.level)}></span></div>)
						}
					})
				}
				{
					['a'].map(function(){
						if(self.state.child && self.state.child.length){
							return self.state.child.map(function(child, childIndex){
								return (<DataConfiguration dataKey={child.dataKey} value={child.value} level={self.state.level+1} child={child.child} parent={self.state} childIndex={childIndex}  callback={self.props.callback} pathIndex={self.props.pathIndex} />)
							})
						}
					})
				}
				
				</div>)
	}
});



function prepareJson(srcObj, destObj, srcKeys, exprsn, callback){
	if(srcKeys.length==0){
		callback(destObj);
	}else{
		if(srcObj[exprsn].type=="text" || srcObj[exprsn].type=="number" ){
			destObj[exprsn]=srcObj[exprsn].property;
			srcKeys.splice(0,1);
			if(srcKeys.length>0){
				prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
			}else{
				callback(destObj);
			}
		}else if(srcObj[exprsn].type=="fixed"){//no need to eval
			destObj[exprsn]=srcObj[exprsn].property;
			srcKeys.splice(0,1);
			if(srcKeys.length>0){
				prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
			}else{
				callback(destObj);
			}
		}else if(srcObj[exprsn].type=="struct"){
			destObj[exprsn]={};
			var stKeys=Object.keys(srcObj[exprsn].structDef);
			prepareJson(srcObj[exprsn].structDef, destObj[exprsn], stKeys, stKeys[0], function(stJson){
				
				destObj[exprsn]=stJson;
				srcKeys.splice(0,1);
				prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
			});
		}else if(srcObj[exprsn].type=="array"){
			destObj[exprsn]=[{}];
			
			if(srcObj[exprsn].elements.type=="struct"){
				var stKeys=Object.keys(srcObj[exprsn].elements.structDef);
				prepareJson(srcObj[exprsn].elements.structDef, destObj[exprsn][0], stKeys, stKeys[0], function(stJson){
					stJson.arrayRef=srcObj[exprsn].elements.arrayRef;
					destObj[exprsn][0]=(stJson);
					srcKeys.splice(0,1);
					prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
				});
			}else if(srcObj[exprsn].elements.type=="string"){
				/*Need to write */
				var stKeys=Object.keys(srcObj[exprsn].elements.structDef);
				prepareJson(srcObj[exprsn].elements.structDef, destObj[exprsn], stKeys, stKeys[0], function(stJson){
					destObj[exprsn]=stJson;
					srcKeys.splice(0,1);
					prepareJson(srcObj, destObj, srcKeys, srcKeys[0], callback);
				});
			}
			
		}
	}
}//End of prepareJson()
/*
{
	"dataKey":"BillAddressN",
	"value":"Object",
	"child":[{"dataKey":"Line1","value":"Object","child":[{"dataKey":"","value":"","child":[]}]},
			 {"dataKey":"Lne2","value":"","child":[]},
			 {"dataKey":"Line3","value":"","child":[]},
			 {"dataKey":"","value":"","child":[]}
			 ]
}*/

function prepareJson(parent, newJson, callback){
	console.log(parent.value);
	
	if(parent.dataKey){
		if(parent.value=="Object"){
			newJson[parent.dataKey]={};
		}else{
			newJson[parent.dataKey]=parent.value;
		}
		if(parent.child.length && parent.value=="Object"){
			parent.child.forEach(function(child){
				console.log("Child");
				console.log(child);
				prepareJson(child, newJson[parent.dataKey], function(d){
					newJson[parent.dataKey]=d;
				});
			});
		}else{
			console.log("invoking callback");
			callback(newJson);
		}
		
	}else{
		callback(newJson);
	}
}
	
/*
 *
 * Pending tasks
 * 
 * 
 * 
 * Write code for decoding into Object
 * 
 * Handle while removing/deleting child update parent
 * 
 * 
 * Need to write for Array Handling (Array of objects or Strings)
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 *  
 * */