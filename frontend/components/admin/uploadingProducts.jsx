var React=require('react');
var ReactDOM = require('react-dom');
var WebUtils=require("../../utils/WebAPIUtils.js");
var manageSchemaNew = require("./manageSchemaNew.jsx");
var global=require('../../utils/global.js');
var common=require('../common.jsx');
var SchemaStore = require('../../stores/SchemaStore');
var manageRecords=require('../records/manageRecords.jsx');

var UploadFile = React.createClass({
	getInitialState:function(){
		return	{
					dependentSchema:"",
					data:[],
					fileName:"",
					productIds:[],
					schema:SchemaStore.get("Product"),
					Manufacturer:{},
					index:0
				};
	},
	uploadFile:function(){
		var self=this;
		  var regex = /(.json)$/;
	        if (regex.test($("#fileUpload").val().toLowerCase())) {
	            if (typeof (FileReader) != "undefined") {
	                var reader = new FileReader();
	                reader.onload = function (e) {
	                	self.setState({data:JSON.parse(e.target.result)},function(){
	                	    console.log(JSON.stringify(self.state.data))
	                	})
	                }
	                reader.readAsText($("#fileUpload")[0].files[0]);
	            } else {
	                alert("This browser does not support HTML5.");
	            }
	        } else {
	            alert("Please upload a valid JSON file.");
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
								callback={this.saveManufacturer}/>,node);
	},
	getFile:function(){
		var self=this;
		var str=$("#fileUpload").val().toLowerCase();
		str=str.split(/(\\|\/)/g).pop();		
		self.uploadFile();	
		this.setState({fileName:str},function(){
					
		});
	},
	deleteFile:function(){
		this.setState({fileName:"",data:[]})
	},
	saveManufacturer:function(data){
		try{
			var mfrData={
			            "id":data.id,
						"name":data.value.name
						}
		}catch(err){
			console.log(err);
		}
		this.setState({Manufacturer:mfrData})
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
		this.setState({dependentSchema:dependentSchema})
	},
	constructData:function(){
		ReactDOM.render(<ConstructData schema={this.state.schema} Manufacturer={this.state.Manufacturer} dependentSchema={SchemaStore.getSchema(this.state.dependentSchema)} data={this.state.data}/>,this.compareData)
	},
	resetManufacturer:function(){
	    this.setState({Manufacturer:{}})
	},
	resetDPS:function(){
	    this.setState({dependentSchema:""})
	},
	resetAll:function(){
	    if (confirm('Are you sure you want to create New Products?')) {
	        this.resetManufacturer();
	        this.resetDPS();
	        this.deleteFile();
	        this.resetProducts();
	        this.setState({index:0})
	    } else {
	        
	    }
	    
	},
	resetProducts:function(){
	    this.setState({productIds:[]})
	},
	setIndex:function(){
	    var self=this;
	    var value=this.indexInput.value;
	    if(value<this.state.index){
	            common.createAlert("Error","Index should be either "+this.state.index+" or more");
	    }else{
	            this.setState({index:value},function(){
	                self.createProducts.className=self.createProducts.className.replace("hidden","");
	            })
	    }
	},
	createProducts:function(){
		var self=this;
		if(Object.keys(this.state.Manufacturer).length==2 && this.state.data.length>0 && this.state.dependentSchema!=""){
		    var data={
		            "Manufacturer":this.state.Manufacturer,
		            "allRecords":this.state.data,
		            "dependentSchema":this.state.dependentSchema,
		            "index":this.state.index,
		            "user":common.getUserDoc().recordId
		    };
		    common.startLoader();
		    WebUtils.doPost("/generic?operation=setData",data,function(result){
		        common.stopLoader();
		        var data1=result.data;
		        if(data1){
    		        if(data1.error){
    		          
    		            var index=data1.index+1;
    		            self.setState({"index":index},function(){
    		                common.createAlert("Error",data1.message);
    		                self.index.className=self.index.className.replace("hidden","");
    		                self.reset.className=self.reset.className.replace("hidden","");
    		            })
    		        }
    		        if(data1.productIds && data1.productIds.length>0){
    		            common.createAlert(data1.message);
        		        self.setState({productIds:data1.productIds})
    		        }else{
    		            common.createAlert("No Records","Something went wrong try again");
    		          //  self.resetAll();
    		        }
		        }else{
		            common.createAlert("Data Base Error","Something went wrong try again");
		        }
		    })
			/*	var dependentFullSchema=SchemaStore.get(self.state.dependentSchema);
				var schemaProperties=this.state.schema["@properties"];
				var data=this.state.data;
				var productId=[];
				data.map(function(record,index){
					var recordId="Product-"+global.guid();
						var temp={};
						temp={
							  "recordId":recordId ,
							  "org": "public",
							  "docType": "Product",
							  "author": common.getUserDoc().recordId,
							  "editor": common.getUserDoc().recordId,
							  "dateCreated": global.getDate(),
							  "dateModified": global.getDate(),
							  "revision": 1,
							  "@superType": "Product",
							  "@identifier": "name",
							  "@derivedObjName":self.state.dependentSchema,
							  "relationDesc": [
							    "Manufacturer-manufactures-recordId",
							    "recordId-manufacturedBy-Manufacturer",
							    "collection-hasProduct-recordId",
							    "recordId-ofCollection-collection",
							    "productCategory-hasProduct-recordId",
							    "recordId-ofType-productCategory"
							  ],
							  "cloudPointHostId": "wishkarma",
							  "$status": "published",
							  "@uniqueUserName": record.name.replace(/\W/g,"-").toLowerCase()
						}
						Object.keys(schemaProperties).forEach(function(schemaProp){
							temp[schemaProp]=record[schemaProp]?record[schemaProp]:((schemaProperties[schemaProp].dataType.type=="array" || 
																					schemaProperties[schemaProp].dataType.type=="multiPickList" ||
																					schemaProperties[schemaProp].dataType.type=="images" ||
																					schemaProperties[schemaProp].dataType.type=="image")?[]:(schemaProperties[schemaProp].dataType.type=="struct")?{}:"")
							if((schemaProperties[schemaProp].dataType.type=="images" || 
								schemaProperties[schemaProp].dataType.type=="image" || 
								schemaProperties[schemaProp].dataType.type=="attachments")){ 
									if(record[schemaProp]!=undefined && 
											((typeof record[schemaProp]=="string" || Array.isArray(record[schemaProp])) && record[schemaProp].length>0)){
										temp[schemaProp]=generateImages(record[schemaProp],schemaProperties[schemaProp].dataType.type,record,self.state.Manufacturer.name);
									}else{
										temp[schemaProp]=[];
									}
							}
						})
						temp["dependentProperties"]={};
						Object.keys(dependentFullSchema["@properties"]).forEach(function(dsProp){
							if(dependentFullSchema["@properties"][dsProp].dataType.type=="multiPickList"){
								temp["dependentProperties"][dsProp]=record[dsProp]?[record[dsProp]]:[];
							}else{
								temp["dependentProperties"][dsProp]=record[dsProp]?record[dsProp]:((dependentFullSchema["@properties"][dsProp].dataType.type=="array" || 
																					dependentFullSchema["@properties"][dsProp].dataType.type=="images" ||
																					dependentFullSchema["@properties"][dsProp].dataType.type=="image")?[]:(dependentFullSchema["@properties"][dsProp].dataType.type=="struct")?{}:"")
							}
						})
						if(record["productImages"] && (typeof record["productImages"]=="string" || Array.isArray(record["productImages"])) && record["productImages"].length >0){
							temp["productImages"]=generateImages(record["productImages"],"productStruct",record,self.state.Manufacturer.name);															
						}else{
							temp["productImages"]=[];
						}
						  
						var temp2={
							  "productType": self.state.dependentSchema.replace("Product-",""),
							  "esMeta":self.state.Manufacturer.name,
							  "metaTitle":generateMeta(record,self.state.Manufacturer.name)+" |Wishkarma.com",
							  "metaDescription":generateMeta(record,self.state.Manufacturer.name)+". Find and chat with local suppliers and dealers near you.",
							  "Manufacturer":self.state.Manufacturer.id
						}
						temp=Object.assign(temp,temp2);
						console.log(temp)
						WebUtils.doPost("/generic?operation=saveRecord",temp,function(result){
							productId.push(temp["recordId"]);
							console.log(self.state.productIds +"before state update");
							self.setState({productIds:productId},function(){
								console.log(self.state.productIds +"after state update");
							});
							
							console.log(temp["recordId"]+" Created")
							//console.log(JSON.stringify(result));
						})
				})
				//self.setState({productIds:productId},function(){
					//self.forceUpdate();
				//});*/
		}else {
			alert("Fill all fields");
		}
	},
	render:function(){
		var self=this;
		return (<div key={global.guid()} className = "row no-margin">
					<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
						<div className="col-lg-4 col-md-4 col-sm-12 col-xs-12 no-padding">
							{
								["a"].map(function(temp){
									if(self.state.fileName!=""){
										return(<div>
													<h5>Uploaded .json file</h5>
													<div className="parent-img-component">
													
														<div className="child-img-component">
															
															{self.state.fileName}
														</div>
														<div className="child-img-component">
															<span className="fa fa-2x sleekIcon-delete link" onClick={self.deleteFile} />
														</div>
													</div>
												</div>)
									}else{
										return (<div>
													<h5>Please select input .json file</h5>
													<input type="file" id="fileUpload" onChange={self.getFile} />
												</div>)
									}
								})
							}
						{/*<input type="button"  id="upload" value="Upload" onClick={this.uploadFile} />*/}
						</div>
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
						<button className="upload-btn" onClick={this.constructData} value="Submit">CHECK THE UPLOADED DATA</button>
					</div>
					<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding">
						{
						        (Object.keys(this.state.Manufacturer).length>0 && this.state.dependentSchema!="" && this.state.data.length>0)?
						                    (<button className="upload-btn" onClick={this.createProducts} value="Submit">CREATE PRODUCTS</button>):
						                        <div className="hidden"></div>
						}
					</div>
                	<div className="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding hidden" ref={(input)=> {this.index=input}} >
	                    <h5>Set The Index To Create The Product</h5>
	                     <input type="text"  className="form-control " placeholder={this.state.index} ref={(input)=> {this.indexInput=input}}  />
                        <button className="upload-btn" onClick={self.setIndex} value="Submit">SET THE INDEX</button>
                	</div>
                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding hidden" ref={(input)=> {this.reset=input}} >
                        <h5>Set The Index To Create The Product</h5>
                        <button className="upload-btn" onClick={self.resetAll} value="Submit">RESET</button>
                    </div>
					{
						["a"].map(function(temp){
							if(self.state.productIds && (self.state.productIds).length>0){
								return (<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
        									CREATED PRODUCTS {self.state.productIds.length}
        									{
        										self.state.productIds.map(function(ids){
        										return(
        											<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">{ids}</div>
        											)
        										})
        									}
        									<div className="col-lg-12 col-md-12 col-xs-12 col-sm-12 no-padding">
        									    <button className="upload-btn" onClick={self.resetAll} value="Submit">CREATE NEW PRODUCTS</button>
        									</div>
        								</div>)
							}else{
								return (<div className="hidden"></div>)
							}
						})
					}
					<div ref={(input)=> {this.compareData=input}}></div>
					
				</div>);
	}
})

function generateImages(imageUrl,type,record,Manufacturer){
	var productImages=[];
	var images=[];
	if(Array.isArray(imageUrl) && imageUrl.length>0){
		images=imageUrl;
	}else{
		images.push(imageUrl);
	}
	for(var i=0;i<images.length;i++){
			var id=global.guid();
			var temp={
			          "cloudinaryId":id,
			         "caption": record?generateMeta(record,Manufacturer):"",
			          "url": images[i]
					};
			WebUtils.doPost("/generic?operation=saveCloudinaryData",{url:images[i],id:id},function(schemas){
				console.log(schemas)
			})
			if(type=="productStruct"){
				temp["imageName"]=id ;
					productImages.push({
						"produtImages": [temp],
					    "variant": ""
					});
			}else{
				if(type=="image" || type=="images"){
					temp["imageName"]=id ;
				}else{
					temp["attachmentName"]=id ;
				
				}
					productImages.push(temp);
			}
	}
	return 	productImages;	
}


function generateMeta(record,Manufacturer){
	return (Manufacturer+" "+record.name+" "+record.mfrProductNo);//update fields  manually
}

function uploadProducts(){
	ReactDOM.render(<UploadFile />,document.getElementById('dynamicContentDiv'))
}
exports.uploadProducts=uploadProducts;

if(typeof window != undefined){
	window.uploadProducts=uploadProducts;
}

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
})

var ConstructData = React.createClass({
	render:function(){
		var self=this;
		var properties=Object.keys(this.props.schema["@properties"]);
		var dependentProperties=Object.keys(this.props.dependentSchema["@properties"])
		properties=properties.concat(dependentProperties)
		if(this.props.data && this.props.data.length>0){
			return(
				<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" key={global.guid()} style={{"overflow":"scroll"}}>
			        <h4>Total No.of Records {this.props.data.length}</h4>
					<table className="table">
						<thead>
						<tr>
						{
							properties.map(function(property){
								return(<th>{property}</th>)
							})
						}
						</tr>
						</thead>
						<tbody>
						{
							this.props.data.map(function(record,index){
								record["productType"]=self.props.dependentSchema["@id"].replace("Product-","");
								record["Manufacturer"]=self.props.Manufacturer.id;
								if(index==0)
								return(
										<tr >
											{
												properties.map(function(property){
												    if(record[property]){
												        return(<td>
                                                                {record[property]}
                                                           </td>)
												    }else{
												        return(<td>
                                                                <span style={{"color":"red"}}>Data Not Available or Misplace key value check and upload again</span>
                                                           </td>)
												    }
													
												})
											}
											
										</tr>
								)
								else{
								 return (<tr className="hidden"></tr>)   
								}
							})
						
						}
						</tbody>
					</table>
				</div>
			)
		}else{
			return (<div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">Error Occured Please Upload File Again</div>)
		}
	}
})
