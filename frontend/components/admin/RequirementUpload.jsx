var React=require('react');
var ReactDOM = require('react-dom');
var common=require('../common.jsx');
var global=require('../../utils/global.js');
var addedfiles=[];
var WebUtils=require('../../utils/WebAPIUtils.js');
var SchemaStore = require('../../stores/SchemaStore');
var manageRecords=require("../records/manageRecords.jsx");
function loadjscssfile(filename, filetype,callback){
	var fileref;
	if(addedfiles.indexOf(filename)==-1){
		addedfiles.push(filename);
	    if (filetype=="js"){
	    	fileref=document.createElement('script');
	        fileref.setAttribute("type","text/javascript");
	        fileref.setAttribute("src", filename);
	    } else if (filetype=="css"){
	        fileref=document.createElement("link");
	        fileref.setAttribute("rel", "stylesheet");
	        fileref.setAttribute("type", "text/css");
	        fileref.setAttribute("href", filename);
	    }
	    if (typeof fileref!="undefined"){
	        document.getElementsByTagName("head")[0].appendChild(fileref);
	    }
    }
}
function loadExcelResources(){
	loadjscssfile("//cdnjs.cloudflare.com/ajax/libs/xlsx/0.8.0/xlsx.js","js");
	loadjscssfile("//cdnjs.cloudflare.com/ajax/libs/xlsx/0.8.0/jszip.js","js");
}

var RequirementsUpload=React.createClass({
	getInitialState:function(){
		var schemaDoc=SchemaStore.get("SpecListProductCategory");
		var allProps=[];
		for(var key in schemaDoc["@properties"]){
			//if(schemaDoc["@properties"].dataType.type!="formula"){
			allProps.push(key);
			//}
		}
		var pairs={};
		allProps.map(function(key){
			pairs[key]="";
		});
		return {
			schemaDoc:schemaDoc,
			sheets:undefined,
			current:undefined,
			pairingDone:false,
			showChooseFile:true,
			pairs:pairs,
			pairs2:{},
			columns:[],
			allProps:allProps

		};
	},
	upload:function(){
		common.startLoader();
		WebUtils.doPost("/generic?operation=uploadBulk",
			{
				org:this.inputOrgField.value,
				uploadedBy:this.inputUploadedByField.value,
				schema:"SpecListProductCategory",
				mappings:this.state.pairs,
				records:this.state.sheets[this.state.current],
				fileName:this.state.fileName,
				sheetName:this.state.current
			},function(res){
				common.stopLoader();
				common.createAlert("Success","Data uploaded successfully.");
				this.setState({current:undefined,sheets:undefined,pairingDone:false});
		}.bind(this));
	},
	getFile:function(event){
		var self=this;
		var file=event.target.files[0];
        var reader = new FileReader();
		reader.onload = function(e) {
			var data = e.target.result;
			var workbook = XLSX.read(data, {type: 'binary'});
			var sheets={};
			workbook.SheetNames.forEach(function(sheetName) {
				sheets[sheetName]=XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
			});

			self.setState({fileName:file.name,sheets:sheets,current:undefined,pairingDone:false,showChooseFile:false});
		};
		reader.onerror = function(ex) {console.log(ex);};
		reader.readAsBinaryString(file);
	},
	componentDidMount:function(){
		loadExcelResources();
	},
	setCurrentSheet:function(name){
		var columns=[];
		for(var index in this.state.sheets[name]){
			Object.keys(this.state.sheets[name][index]).map(function(key){
				if(columns.indexOf(key)==-1){
					columns.push(key);
				}
			});
		}
		this.setState({current:name,columns:columns});
	},
	clearSelection:function(){
		this.setState({current:undefined,sheets:undefined,pairingDone:false,showChooseFile:true});
	},
	resetMappings:function(){
		var pairs={};
		this.state.allProps.map(function(key){
			pairs[key]="";
		});
		this.setState({
			pairs:pairs,
			pairingDone:false
		});
	},
	setMappings:function(){
		var pairs={};
		this.state.allProps.map(function(key){
			pairs[key]=this[key].value;
		}.bind(this));
		this.setState({
			pairs:pairs
		});
	},
	setMappings2:function(key,values){
		var pairs=this.state.pairs2;
		pairs[key]=values;
		this.setState({
			pairs2:pairs
		});
	},
	doneMapping:function(){
		var flag=true;
		for(var i=0;i<this.state.allProps.length;i++){
			if((this.state.allProps[i] != "finalizedProductId") && this.state.schemaDoc["@properties"][this.state.allProps[i]].required){
				if(!this.state.pairs[this.state.allProps[i]]){
					flag=false;
					common.createAlert("Error","Please match "+ (this.state.schemaDoc["@properties"][this.state.allProps[i]].displayName || this.state.allProps[i])+" with any column");
					break;
				}
			}
		}

		if(flag){
			this.setState({pairingDone:true});
		}
	},
	doneMapping2:function(){
		var pairs2=this.state.pairs2;
		var pairs={};
		for(var key in pairs2){
			for(var index in pairs2[key]){
				if(Array.isArray(pairs[pairs2[key][index]])){
					pairs[pairs2[key][index]].push(key);
				}else if(!pairs[pairs2[key][index]]){
					pairs[pairs2[key][index]]=key;
				}else{
					pairs[pairs2[key][index]]=[pairs[pairs2[key][index]]];
					pairs[pairs2[key][index]].push(key);
				}
			}
		}
		this.setState({pairs:pairs},this.doneMapping);
	},
	render:function(){
		var self=this;
		var schemaDoc=SchemaStore.get("SpecListProductCategory");
		return (
		<div className="row">
			<div><h1>Upload Requirements</h1></div>
			{
				(this.state.showChooseFile)?<input key={global.guid()} type="file" className="btn" ref={(e)=>this.fileUpload=e} onChange={this.getFile}/>:""
			}

			 {
			 	this.state.sheets?(
			 		<div>
			 		<div><h2>{this.state.fileName}</h2></div>
					<div>
						<input ref={(e)=>this.inputOrgField=e} type="text" className="form-control margin-bottom-gap"	placeholder="Enter Org" />
			 		</div>
					<div>
						<input ref={(e)=>this.inputUploadedByField=e} type="text" className="form-control margin-bottom-gap"	placeholder="Uploaded by" />
			 		</div>
			 		<div>
			 			<input type="button" className="btn margin-bottom-gap" onClick={this.clearSelection} value="Reselect"/>
			 		</div>

				 	{
				 		(!this.state.current)?(
					 		<div>
					 			<div>Please select a sheet</div>
						 		{
						 			Object.keys(this.state.sheets).map(function(sheetName){
						 				return <h2 className="h2 pointer" key={global.guid()} onClick={self.setCurrentSheet.bind(null,sheetName)}>{sheetName}</h2>
						 			})
						 		}
					 		</div>
					 	):(this.state.current)?(
					 		<div>

					 			<div><b>Current Sheet</b> : {this.state.current}</div>
					 			<div><b>Columns Available</b>: {this.state.columns.join(",          ")}</div>



					 			{
					 				!this.state.pairingDone?(
					 					<div>
						 					<h2 className="h2">Set Mappings</h2>
						 					<div  style={{overflowX: "auto"}}>
						 					{/*{
								 				Object.keys(this.state.pairs).map(function(key){
								 					return <div key={global.guid()} className="child-img-component">
								 					<div>{this.state.schemaDoc["@properties"][key].displayName}</div>
								 					<div>
								 					<select ref={(e)=>{this[key]=e;}} defaultValue={this.state.pairs[key]} onChange={this.setMappings}>
								 						<option value="">Select a column</option>
								 						{
								 							this.state.columns.map(function(m){
								 								return <option value={m}>{m}</option>
								 							})
								 						}
								 						<option value="NA">Not Available</option>
								 					</select>
								 					</div>
								 					</div>
								 				}.bind(this))
								 			}*/}

								 			{
								 				this.state.columns.map(function(key){
								 					return <div key={global.guid()} className="child-img-component">
								 					<h3 className="h3">{key}</h3>
								 					<div>
								 					<manageRecords.CustomMultiPickList
		         										checkBoxPosition={"right"}
														onChange={(values)=>{this.setMappings2(key,values);}}
														optionsType="object"
														options={JSON.parse(JSON.stringify(schemaDoc["@properties"]))}
														defaultValue={this.state.pairs2[key]}/>
								 					</div>
								 					</div>
								 				}.bind(this))
								 			}
								 			</div>
								 			<div>
								 				<input type="button" className="btn" onClick={this.doneMapping2} value="Done Mapping"/>
								 			</div>
					 					</div>
					 				):(
					 					<div>
					 					<div  style={{overflow: "auto",maxHeight:"400px"}} className="form-group">
					 						<table className="table">
						 						<thead>
						 							<tr>
						 								{
								 							this.state.allProps.map(function(key){
								 								return <th key={global.guid()}>{this.state.schemaDoc["@properties"][key].displayName}</th>
								 							}.bind(this))
								 						}
						 							</tr>
						 						</thead>
						 						<tbody>
							 						{
							 							this.state.sheets[this.state.current].map(function(row){
							 								return <tr key={global.guid()}>
							 									{
									 								this.state.allProps.map(function(m){
									 									var tempVal="";
									 									if(Array.isArray(this.state.pairs[m])){
									 										(this.state.pairs[m]).map(function(tk){
									 											tempVal+=" "+(row[tk]?row[tk]:"");
									 										});
									 									}else{
									 										tempVal=row[this.state.pairs[m]];
									 									}
										 								return <td>{tempVal}</td>
										 							}.bind(this))
										 						}
							 								</tr>
							 							}.bind(this))
							 						}
						 						</tbody>
					 						</table>
					 						</div>
					 						<input type="button" className="btn" onClick={this.resetMappings} value="Reset Mappings"/>
					 						<input type="button" className="btn" onClick={this.upload} value="Upload"/>

					 					</div>
					 				)
					 			}




					 		</div>
					 	):""
				 	}
				 	</div>
			 	):""
			 }
		</div>)
	}
});
exports.RequirementsUpload=RequirementsUpload;
