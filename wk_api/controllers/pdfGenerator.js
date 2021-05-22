var pdf = require('html-pdf');
var CouchBaseUtil=require('./CouchBaseUtil.js');
var utility=require('./utility.js');
var couchbase = require('couchbase');
var global=require('../utils/global.js');
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var GenericServer=require('./GenericServer.js');
var logger = require('../services/logseed').logseed;
var fs=require('fs');
var options = {
	"directory": "/tmp",       // The directory the file gets written into if not using .toFile(filename, callback). default: '/tmp'
	"format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
	"orientation": "portrait", // portrait or landscape
	"border": {                  // Page options// default is 0, units: mm, cm, in, px
		"top": "0.5in", "right": "0.8in", "bottom": "0.5in", "left": "1.0in"
	},
	/*"header": {"height": "45mm", "contents": '<div style="text-align: center;"><img src="https://www.wishkarma.com/branding/wklogonopad.svg" style="height: 5%; width: 10%;"></div>'  },*/
	"footer": { "height": "15mm", "contents": { "default": "<div style='font-size:8px; margin-top:200px'>Page <span style='color: #444;'>{{page}}</span> of <span>{{pages}}</span><div style='float:right'>"+global.getDate()+"</div></div>" }},// fallback value}},
	"base": "https://www.wishkarma.com", // Base path that's used to load files (images, css, js) when they aren't referenced using a host
	"type": "pdf"
};

function sendError(request,response){
	response.set('Content-Type', 'text/html');
	response.send("<h1>Error! Please try again later.</h1>");
}
function sendResponse(request,response,html,fileName,optionPdf){
var data=`<html>
	<head>
		<link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"></link>
		<style>
			img.architectImage {
			    width: 50px;
			    padding-bottom: 5px;
			}
			body {
       			font-family: 'Montserrat', sans-serif;
            }
			.architectName {
			    font-size: 9px;
		        line-height: 10px;
			}
			.architectHeader{
				padding:5px;
			    display:inline-block;
				/*border-bottom-width: 1px ;
                border-bottom-style: solid;*/
			}
			.scheduleNameDiv{
				display: inline-block;
				padding-right: 10%;
    			vertical-align: top;
    			float: right;
			}
			.scheduleName{
    			font-size: 12px;
			}
			.scheduleNameDiv .itemNumber{
				font-size: 10px;
			}
			.architectAddress{
			  font-size: 8px;
			  line-height:10px;
			}
			.specSheetLinesTable{
			    border-width:1px 0px 1px 1px;
			    border-style:solid;
			    border-spacing:0px;
			    border-color: black !important;
				width: 98%;
			    margin: 30px 5px ;
			    text-align:left;
			    font-size: 9px;
			}
			.pageBreak{
			    page-break-before: always;
			}

			.specSheetLinesTable>thead {
			    text-align: left;
			}
			.specSheetLinesTable td {
			    border-width: 0px 1px 0px 0px;
			    border-color:black!important;
			    border-style: solid;
			}
			.specSheetLinesTable th{
			    border-width: 0px 1px 1px 0px;
			    border-color:black!important;
			    border-style: solid;
			}
			.specListHeader {
			 	border-bottom-width: 1px;
			    border-bottom-style: solid;
			    padding: 5px 0;
			    border-color: black !important;
			    font-size: 9px;
			    width: 100%;
			    border-spacing: inherit;
			}
			.innerValue{
				margin-bottom: 5px;
			}
			.specTable .info {
			    width: 33%;
			}
			.productRow {
			    padding: 10px 10px;
			    border-bottom: 1px solid;
			    border-color:black!important;
			}
			.productImages{
				text-align:center;
				display:inline-block;
				margin: 15px 0;
			}
			/*.productImages>img {
			    max-width: 150px;
			    padding: 10px;
			}*/
			.categoryName {
			    font-size: 14px;
			     margin-bottom: 10px;
			     font-weight:100;
			}
			.info {
				width:50%;
			    /*padding: 5px;*/
			      vertical-align: top;
			}
			.infoKey{
				width:25%;
				font-size:8px;
			    display: inline-block;
			    text-transform:uppercase;
			    float:left;
			}
			.indent{
			    text-indent:30px;
			 }
			.infoValue{
				width:75%;
				font-size:8px;
			    display: inline-block;
			}
			.info .infoKey {
			    width: 49%;
			}
			.info .infoValue {
			    width: 49%;
			}
			.semi-colon{
			/*	font-size:10px;*/
				display:none;
			}
			/*Mood board Css*/
			.imageDiv td.productImages{
			    border: 1px solid #000;
			    width: 28%!important;
			   	min-height: 360px;
			   	max-height: 370px;
			    float: none;
			    vertical-align: top;
			    padding: 2%;
			    border-top: none;

			    margin: 0;
			    border-right: none;
			}
			.imageDiv td.productImages:nth-child(3n+3) {
			    border-right: 1px solid;
			}
			.imageDiv td.productImages.borderTop{
			    border-top: 1px solid;
			}
			table.idea{
				margin:2% 0 10% 0;
			}

			.componentsTable {
			 	border-bottom-width: 1px;
			    border-bottom-style: solid;
			 	border-top-width: 1px;
			    border-top-style: solid;
			    padding: 5px 0;
			    border-color: black !important;
			    font-size: 9px;
			    width: 100%;
			    border-spacing: inherit;
			}
			.componentsTable td,.componentsTable th{
				text-align:center;
			}
		</style>
	</head>
	<body>`
		+html+
	`</body>
</html>`;
	//response.render("pdfView",{	html:html },function(err,data){
		if(false){
			sendError(request,response);
		}else{
			if(request.query && request.query.style=="html"){
				response.set('Content-Type', 'text/html');
				response.send(data);
				return;
			}
			if(request.query && (request.query.style=="jpeg" || request.query.style=="png")){
				options.type=request.query.style;
			}else{
				options.type="pdf";
			}
			if(!fileName){
				fileName="wishkarma"
			}
			if(optionPdf){
				if(optionPdf.footer && optionPdf.footer.length>0){
					options.footer={ "height": "15mm", "contents": { "default": "<div style='font-size:8px; margin-top:200px;border-top:1px solid #000;padding-top:10px'>"+optionPdf.footer+" Page <span style='color: #444;'>{{page}}</span> of <span>{{pages}}</span>" +"<div style='float:right'>"+global.getDate()+"</div>" +"</div>" }}// fallback value}},
				}
				if(optionPdf.height && optionPdf.height.length>0){

				}
			}
			fileName=fileName.split(" ").filter(function(n){ return (n != "" && n!= undefined)}).join("_")
			pdf.create(data,options).toStream(function(err, stream){
				if(!err){
					if(options.type!="pdf"){
						response.set('Content-Type', 'image/'+options.type);
					}else{
						response.set('Content-Type', 'application/pdf');
						if(!request.query.preview)
						response.setHeader("Content-Disposition","attachment; filename="+fileName+".pdf");
					}
					stream.pipe(response);
				}else{
					response.set('Content-Type', 'text/html');
					response.send("<h1>Error! Creating PDF Please try again later.");
				}
			});
			/*try{
				fs.unlinkSync("./"+recordId+".pdf");
			}catch(err){}
			pdf.create(data, options).toFile("./"+recordId+".pdf", function(err, res) {
				if(!err){
					if(options.type!="pdf"){
						response.set('Content-Type', 'image/'+options.type);
					}else{
						response.set('Content-Type', 'application/pdf');
						response.setHeader("Content-Disposition:","inline; filename="+fileName+".pdf");
					}
					response.send(fs.readFileSync("./"+recordId+".pdf"));
					response.end();
					try{
						fs.unlinkSync("./"+recordId+".pdf");
					}catch(err){}
				}else{
					response.set('Content-Type', 'text/html');
					response.send("<h1>Error! Creating PDF Please try again later.");
				}
			});*/
			/*pdf.create(data).toBuffer(function(err, buffer){
				if(!err){
					if(options.type!="pdf"){
						response.set('Content-Type', 'image/'+options.type);
					}else{
						response.set('Content-Type', 'application/pdf');
						response.setHeader("Content-Disposition:","inline; filename="+fileName+".pdf");
					}
					response.send(buffer);
					response.end();
				}else{
					response.set('Content-Type', 'text/html');
					response.send("<h1>Error! Creating PDF Please try again later.");
				}
			});*/

		}
	//});
}
function generatePDF(request,response){
	var recordId=request.params.id;
	CouchBaseUtil.getDocumentByIdFromContentBucket(recordId,function(recRes){
		if(recRes.error){
			sendError(request,response);
		}else{
			var record=recRes.value;
			if(record.docType=="SpecListProductCategoryProduct"){
				getSpecListProductCategoryProductContent(record,function(html,itemNumber,options){

					var fileName=((false && itemNumber)?(itemNumber+"-"):"")+(record.areaName?(record.areaName+"-"):"")+(record.projectName?(record.projectName+"-"):"")+(record.productName?(record.productName):"");
					sendResponse(request,response,html,fileName,options);
				});
			}else if(record.docType=="SpecListProductCategory"){
				var fileName="";
				CouchBaseUtil.getDocumentByIdFromContentBucket(record.SpecList,function(specRes){
					if((typeof specRes.value.architect!="undefined") && (typeof specRes.value.org!="undefined")){
						getArchitect(specRes.value.architect,function(architectHeader){
							getProjectResponse(specRes.value.org,function(proRes,projectName){
								var specHeader="<table class='specListHeader'>";
								specHeader+=proRes;
								specHeader+=getSpecData(specRes.value)+"</table>";
								getItemNumber(record.org,record.itemNumber,function(gItemNumber){
									fileName=(gItemNumber?gItemNumber:"")+"-"+(specRes.value.name?specRes.value.name:"")+"-"+projectName;
									constructSLPCHTML(record,function(html){
										var html1=architectHeader+specHeader+html.join(" ");
										sendResponse(request,response,html1,fileName);
									});
								})
							});
						});
					}else{
						sendError(request,response);
					}        
				});
			}else if(record.docType=="SpecList"){
				var mapSetData={
						recordId:recordId,
						relationName:"specListHasProductCategory",
						translatingField:"itemNumber",
						translatedField:"itemNumberTranslation"
				};
				GenericServer.setOrgSpecificValuesForAllRelatedRecords(mapSetData,function(rsd){
				CouchBaseUtil.getDocumentByIdFromContentBucket(record.areaType,function(atRes){
					try{
						if(atRes.value.name){record.areaTypeName=atRes.value.name};
					}catch(err){}
					getArchitect(record.architect,function(architectHeader,architectDoc){
						var options={};
						if(architectDoc ){
							if(architectDoc.footerPdf && architectDoc.footerPdf.length>0){
								options["footer"]=architectDoc.footerPdf;
							}
							if(architectDoc.headerPdf && architectDoc.headerPdf.length>0){
								options["header"]=architectDoc.headerPdf;
							}
						}

						var scheduleName="";
						if(record.scheduleName){
							scheduleName='<div class="scheduleNameDiv"><div class="scheduleName">'+record.scheduleName+'</div></div><div class="specListHeader"></div>';
						}
						getProjectResponse(record.org,function(proResponse){
							var specHeader = "<table class='specListHeader'>";
							specHeader+=proResponse;
							specHeader+=getSpecData(record)+"</table>";
							var showReqNumColumn=true;
							var showItemNumberColumn=true;
							if(!showReqNumColumn &&  !showItemNumberColumn){
								showReqNumColumn=true;
								showItemNumberColumn=true;
							}
							//var slpcfq = ViewQuery.from("relation","getRelated").key([recordId,"specListHasProductCategory"]).reduce(false).stale(ViewQuery.Update.BEFORE);
							//CouchBaseUtil.executeViewInContentBucket(slpcfq,function(slpcs){

							var query = N1qlQuery.fromString("SELECT `recordId` AS `id`, `recordId` As `value` FROM `records` WHERE docType=$1 AND `SpecList` =$2 ORDER BY `itemNumberTranslation`");
							query.adhoc = false;
							CouchBaseUtil.executeN1QL(query,["SpecListProductCategory",recordId],function(slpcs){
								var lines="";
								if(slpcs.error){
									var html=architectHeader+specHeader;
									sendResponse(request,response,html);
								}else{
									var recordIds=[];
									for(var i=0;i<slpcs.length;i++){
										recordIds.push(slpcs[i].id);
									}
									lines+="<table class='specSheetLinesTable'>" +
											"<thead>" +
											"<tr>" +
												((showReqNumColumn)?"<th>REQUIREMENT NUMBER</th>":"") +
												((showItemNumberColumn)?"<th>ITEM NUMBER</th>":"") +
												"<th>QUANTITY</th>" +
												"<th>DESCRIPTION</th>" +
												"<th>REVISION</th>" +
											"</tr>" +
											"</thead>" +
											"<tbody>" +
											"";
									processSpecListProductCategory(0)
									function processSpecListProductCategory(index){
										if(index<recordIds.length){
											CouchBaseUtil.getDocumentByIdFromContentBucket(recordIds[index],function(slpcRes){
												if(slpcRes.error){
													processSpecListProductCategory(index+1);
												}else{
													getItemNumber(slpcRes.value.org,slpcRes.value.itemNumber,function(gItemNumber){
														lines+="<tr>" +
															((showReqNumColumn)?"<td>"+(slpcRes.value.reqNumber?slpcRes.value.reqNumber:"-")+"</td>":"") +
															((showItemNumberColumn)?"<td>"+((gItemNumber!=slpcRes.value.itemNumber)?gItemNumber:"-")+"</td>":"") +
															"<td style='text-align:center'>"+(slpcRes.value.quantity?slpcRes.value.quantity:"-")+"</td>" +
															"<td>"+(slpcRes.value.comment?slpcRes.value.comment:"-")+"</td>" +
															"<td style='text-align:center;color:red'><b>"+((slpcRes.value.revisionNumber && !isNaN(slpcRes.value.revisionNumber))?slpcRes.value.revisionNumber:"")+"</b></td>" +
															"</tr>";
														processSpecListProductCategory(index+1);
													});
												}
											});
										}else{
											lines+="</tbody>" +
													"</table>"
											var html=architectHeader+scheduleName+specHeader+lines;
											//var schedule = ViewQuery.from("SpecListProductCategoryProduct","schedule").keys([[recordId,"specifiedFinalized"],[recordId,"specifiedFinalizedRevised"]]).reduce(false).stale(ViewQuery.Update.BEFORE);
											//CouchBaseUtil.executeViewInContentBucket(schedule,function(schedulesRes){
											var query = N1qlQuery.fromString("SELECT `recordId` AS `id`, `recordId` As `value` FROM records WHERE docType=$1 AND `$status` IN $2  AND SpecList=$3");
											query.adhoc = false;
											CouchBaseUtil.executeN1QL(query,["SpecListProductCategoryProduct",["specifiedFinalizedRevised","specifiedFinalized"],recordId],function(schedulesRes){

												var schedules=[];
												for(var i=0;i<schedulesRes.length;i++){
													schedules.push(schedulesRes[i].value);
												}
												processSchedule(0)
												function processSchedule(index){
													if(index<schedules.length){
														CouchBaseUtil.getDocumentByIdFromContentBucket(schedules[index],function(scheduleRes){
															if(scheduleRes.error){
																processSchedule(index+1);
															}else{
																getSpecListProductCategoryProductContent(scheduleRes.value,function(sceduleContent){
																	if((index+1)==schedules.length){
																		html+="<div>"+sceduleContent+"</div>";
																	}else{
																		html+="<div class='pageBreak'>"+sceduleContent+"</div>";
																	}
																	processSchedule(index+1);
																})
															}
														});
													}else{
														sendResponse(request,response,html,record.name,options);
													}
												}

											});
										}
									}
								}
							});
						});
					});
				});
				});
			}else if(record.docType=="IdeaBoard"){
				getArchitect(record.architect,function(architectHeader,architectDoc){
					var options={}
					if(architectDoc ){
						if(architectDoc.footerPdf && architectDoc.footerPdf.length>0){
							options["footer"]=architectDoc.footerPdf;
						}
						if(architectDoc.headerPdf && architectDoc.headerPdf.length>0){
							options["header"]=architectDoc.headerPdf;
						}
					}

					getProjectResponse(record.org,function(proResponse){
						var options={};
						if(architectDoc ){
							if(architectDoc.footerPdf && architectDoc.footerPdf.length>0){
								options["footer"]=architectDoc.footerPdf;
							}
							if(architectDoc.headerPdf && architectDoc.headerPdf.length>0){
								options["header"]=architectDoc.headerPdf;
							}
						}
						var specHeader = "<table class='specListHeader' style='border:none!important'>";
						specHeader+=proResponse;
						var description=record.description?record.description:"-";
						if(record.description){
							var newline = String.fromCharCode(13, 10);
							var tab=String.fromCharCode(9);
							description=description.replace(/\\n/g, newline);
							description=description.replace(/\\t/g, tab);
						}
						specHeader+=("<tr>" +
										"<td class='info' style='padding:3px 0'>" +
												"<div class='infoKey'>MoodBoard <span class='semi-colon'>:</span></div>" +
												"<div class='infoValue specListName' style='white-space:pre-wrap'>"+record.name+"</div>" +
										"</td>"+
									"</tr>"+
									"<tr>"+
										"<td class='info' style='padding:3px 0'>" +
											"<div class='infoKey'>Area Name<span class='semi-colon'>:</span></div>"  +
											"<div class='infoValue specListDescription' style='white-space:pre-wrap'>"+(record.areaName?record.areaName:"-")+"</div>" +
										"</td>"+
										"<td class='info' style='padding:3px 0'>" +
											"<div class='infoKey'>Date Created<span class='semi-colon'>:</span></div>" +
											"<div class='infoValue specListDescription'>"+(record.dateCreated?record.dateCreated:"-")+"</div>" +
										"</td>"+
									"</tr>");
						specHeader+="</table>";//getSpecData(record)
						specHeader+=("<div>"+
										"<div class='infoKey' style='width:24.5%'>Description<span class='semi-colon'>:</span></div>"  +
										"<div class='infoValue specListDescription' style='white-space:pre-wrap'>"+(description)+"</div>" +
									"</div>");
						var html="<div class='specListHeader'>"+architectHeader+"</div>" +
										specHeader+
								  "<table class='specListHeader idea ' style='border:none!important'><tbody class='imageDiv'>";
						var i=0;
						if(record.images && record.images.length>0){
							record.images.map(function(image,index){
								html+=addImage(image.udf,image.cloudinaryId,i);
								i++;
								if(index==record.images.length-1){
									startProducts();
								}
							})
						}else{
							startProducts();
						}
						function startProducts(){
							if(record.productSuggested && record.productSuggested.length>0){
								processProduct(0);
							}else{
								html=endTable();
								sendResponse(request,response,html,record.name,options);
							}
						}
						function addImage(value,imageId,i){
							var html="";
							if(i==6 || (i>6 && (i-6)%12==0)){
									html+="<table  class='specListHeader idea pageBreak' style='border:none!important' ><tbody  class='imageDiv pageBreak'>";
							}
							if(i%3==0){
								html+="<tr>";
							}
							var userData="";
							if(value && typeof value=="object" && Object.keys(value).length>0){
								Object.keys(value).map(function(feature,index){
									userData+=	"<div>" +
														"<div class='infoKey'>"+feature+"<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+value[feature]+"</div>"+
													"</div>";
								})
							}else{
								userData=(value && value.length>0)?value:"";
							}

							html+="<td id='index"+i+"' class=' productImages "+((i<3 ||(i>5 && i<12) || (i>12 && ((i-6)%12==0 || (i-6)%12==1 || (i-6)%12==2)))?" borderTop":"") +"'>" +
										"<img style='width:100%;' src='http://res.cloudinary.com/dzd0mlvkl/image/upload/c_pad,h_200,w_250/v1498640646/"+imageId+".jpg'></img>" +
										((userData.length>0)?("<div style='text-align:center;font-size:10px;margin-top:15px'>"+userData +"</div>"):"")+
								   "</td>";
							if(i%3==2){
									html+="</tr>";
							}
							 if(i==5 || (i>5 && (i-5)%12==0)){
								html+="</tbody></table>";
							 }
							 return html

						}
						function processProduct(index){
							if(index<record.productSuggested.length){
								CouchBaseUtil.getDocumentByIdFromContentBucket(record.productSuggested[index],function(productRes){
									if(productRes.error){
										processProduct(index+1);
									}else{
										if(productRes.value.productImages
												&& productRes.value.productImages[0]
												&& productRes.value.productImages[0].produtImages
												&& productRes.value.productImages[0].produtImages[0]
												&& productRes.value.productImages[0].produtImages[0].cloudinaryId){

											html+=addImage(productRes.value.name,productRes.value.productImages[0].produtImages[0].cloudinaryId,i);
											i++;
											processProduct(index+1);
										}else{
											processProduct(index+1);
										}

									}
								});
							}else{
								html=endTable();
								sendResponse(request,response,html,record.name,options);
							}
						}
						function endTable(){
							var x=i%3;
							console.log(i);
							if(x!=2){
								if(x==0){
									html+="<td></td><td></td>";
								}else {
									html+="<td></td>";
								}
								html+="</tr></tbody></table>";
							}
							if(x!=0){
								var str="id='index"+(i-1)+"'";
								html=html.replace(str,"style='border-right:1px solid' ");

							}else{
							}
							return html
						}
					})
				})
			}else{
				response.set('Content-Type', 'text/html');
				response.send("<h1>Document Type not Suppoerted</h1>");
			}
		}
	});
}
exports.generatePDF=generatePDF;

function getItemNumber(org,key,callback){
	CouchBaseUtil.getDocumentByIdFromDefinitionBucket(org,function(result){
		if(result.error){
			callback(key);
		}else{
			var res=result.value;
			if(res[key]){
				callback(res[key]);
			}else{
				callback(key);
			}
		}
	})
}

function getSpecListProductCategoryProductContent(record,callback){
	var dependentFeatures="";
	if(record.productFeatures && Object.keys(record.productFeatures).length>0){
		Object.keys(record.productFeatures).map(function(feature){
			dependentFeatures+="<div style='width:100%;clear: both;'>" +
									"<div class='infoKey innerValue'>"+feature+"<span class='semi-colon'>:</span></div>" +
									"<div class='infoValue innerValue'>"+record.productFeatures[feature]+"</div>" +
								"</div>";
		})
	}
	var userData="";
	if(record.userData && Object.keys(record.userData).length>0){
		Object.keys(record.userData).map(function(feature,index){
			userData+=		"<div style='width:100%;clear: both;'>" +
								"<div class='infoKey innerValue'>"+feature+"<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue innerValue'>"+record.userData[feature]+"</div>" +
							"</div>";

		})
	}
	var images="";
	var piflag=false;
	var customImages="";
	var productImagesPerRow=record.productImagesPerRow?record.productImagesPerRow:"1";
	if(record.customImages && record.customImages.length){
		if(record.customImages && Array.isArray(record.customImages)){
			if(record.customImages.length==1){
				productImagesPerRow="1"
			}
			for(var i=0;i<record.customImages.length;i++){
				if(record.customImages[i].cloudinaryId){
						var imageId=record.customImages[i].cloudinaryId;
						if(imageId){
							customImages+="<div style='width:"+(100/(productImagesPerRow*1))+"%;' class='productImages'><img style='max-height:"+"350"+"px;' src='http://res.cloudinary.com/dzd0mlvkl/image/upload/v1498640646/"+imageId+"'></img></div>"
						}
				}
			}
		}
	}
	productImagesPerRow=record.productImagesPerRow?record.productImagesPerRow:"1";
	piflag=false;
	if(record.productImages && record.productImages.length){
		if(record.productImages && Array.isArray(record.productImages)){
			if(record.productImages.length==1){
				piflag=true;
			}
			for(var i=0;i<record.productImages.length;i++){
				if(Array.isArray(record.productImages[i].produtImages)){
					for(var j=0;j<record.productImages[i].produtImages.length;j++){
						if(record.productImages[i].produtImages.length==1 && piflag ){
							productImagesPerRow="1"
						}
						var imageId=record.productImages[i].produtImages[j].cloudinaryId;
						if(imageId){
								if(record.productImagesHeight){
									images+="<div  class='productImages'><img  height='"+record.productImagesHeight+"' src='http://res.cloudinary.com/dzd0mlvkl/image/upload/v1498640646/"+imageId+"'></img></div>"
								}else{
									images+="<div  class='productImages'><img  src='http://res.cloudinary.com/dzd0mlvkl/image/upload/v1498640646/"+imageId+"'></img></div>"
								}

						}
					}
				}
			}
		}
	}
	var videos="";
	if(record.youtubeVideo && record.youtubeVideo.length>0){
		for(var i=0;i<record.youtubeVideo.length;i++){
			if(record.youtubeVideo[i].indexOf("youtube->")==0){
				videos+="<div  style='overflow-wrap:break-word;color: #0070c9;text-decoration: underline;margin-bottom:5px'>https://www.youtube.com/embed/"+record.youtubeVideo[i].replace("youtube->","")+"</div>";
			}else if (record.youtubeVideo[i].indexOf("vimeo->")==0){
				videos+="<div style='overflow-wrap:break-word;color: #0070c9;text-decoration: underline;margin-bottom:5px'>https://player.vimeo.com/video/"+record.youtubeVideo[i].replace("vimeo->","")+"</div>";
			}
		}
	}
	if(record.video && record.video.length>0){
		for(var i=0;i<record.video.length;i++){
			if(record.video[i] && record.video[i].url && record.video[i].url.length>0 ){
				videos+="<div  style='overflow-wrap:break-word;color: #0070c9;text-decoration: underline;margin-bottom:5px'>"+record.video[i].url+"</div>";
			}
		}
	}
	var itemNumber=record.itemNumber?record.itemNumber:"-"
	getItemNumber(record.org,itemNumber,function(gItemNumber){
		itemNumber=gItemNumber;
		getArchitect(record.architectFirm,function(architectHeader,architectDoc){
			var options={};
			if(architectDoc ){
				if(architectDoc.footerPdf && architectDoc.footerPdf.length>0){
					options["footer"]=architectDoc.footerPdf;
				}
				if(architectDoc.headerPdf && architectDoc.headerPdf.length>0){
					options["header"]=architectDoc.headerPdf;
				}
			}

			//getManufacturer(record.Manufacturer,function(Mfr){
				//getSupplier(record.supplier,function(Sup){
			getComponents(record.recordId,function(componentsData){
				getSupplier(record,function(Sup){
					CouchBaseUtil.getDocumentByIdFromContentBucket(record.SpecList,function(SpecList){
						var scheduleName="";
						scheduleName='<div class="scheduleNameDiv">'+
								'<div class="scheduleName">'+((SpecList && SpecList.value && SpecList.value.scheduleName)?SpecList.value.scheduleName:"")+'</div>'+
								'<div class="itemNumber">ITEM NUMBER: '+((record.Product!=gItemNumber)?gItemNumber:"Unassigned")+'</div>'+
								'</div>'+
								'<div class="specListHeader"></div>';
						CouchBaseUtil.getDocumentByIdFromContentBucket(record.ProductCategory,function(pCategory){
							var productCategory=(pCategory && pCategory.value && pCategory.value.categoryName)?(pCategory.value.categoryName):"-";
							var productDescription=record.productDescription?record.productDescription:"-";
							if(record.productDescription){
								var newline = String.fromCharCode(13, 10);
								var tab=String.fromCharCode(9);
								productDescription=productDescription.replace(/\\n/g, newline);
								productDescription=productDescription.replace(/\\t/g, tab);
							}
							var specHeader="<table class='specListHeader'>"+
												"<tr>"+
													"<td class='info'>" +
														"<div class='infoKey'>Project Name<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+record.projectName+"</div>" +
													"</td>"+
													"<td class='info'>" +
														"<div class='infoKey'>Item Number<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+((record.Product!=gItemNumber)?gItemNumber:"Unassigned")+"</div>" +
													"</td>"+
												"</tr>"+
												"<tr>"+
													"<td class='info'>" +
														"<div class='infoKey'>Project Number<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+(record.projectNumber?record.projectNumber:"-")+"</div>" +
													"</td>"+
													"<td class='info'>" +
														"<div class='infoKey'>Issue Date<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+(SpecList.value.issueDate?SpecList.value.issueDate:"-")+"</div>" +
													"</td>"+
												"</tr>"+
												"<tr>"+
													"<td class='info'>" +
														"<div class='infoKey'>Area Name<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+(record.areaName?record.areaName:"-")+"</div>" +
													"</td>"+
													"<td class='info'>" +
														"<div class='infoKey'>Revision Date<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+(record.revisionDate?record.revisionDate:"-")+"</div>" +
													"</td>"+
												"</tr>"+
												"<tr>"+
													"<td class='info' style='display:none'>" +
														"<div class='infoKey' >Area Type<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+(record.areaTypeName?record.areaTypeName:"-")+"</div>" +
													"</td>"+
													"<td class='info' style='display:none'>" +
														"<div class='infoKey'>Delivery Lead Time<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'>"+(record.deliveryLeadTime?record.deliveryLeadTime:"-")+"</div>" +
													"</td>"+
												"</tr>"+
											"</table>"+
											"<table class='specListHeader'>"+
												"<tr>"+
													"<td class='info'>" +
														"<div style='width:100%;clear: both;'>" +
															"<div class='infoKey'>Description<span class='semi-colon'>:</span></div>" +
															"<div class='infoValue innerValue'>"+(productDescription)+"</div>" +
														"</div>" +
														"<div style='width:100%;clear: both;'>" +
															"<div class='infoKey'>Quantity<span class='semi-colon'>:</span></div>" +
															"<div class='infoValue innerValue'>"+(record.quantity?record.quantity:"-")+" "+(record.UOMSymbol?record.UOMSymbol:"")+"</div>" +
														"</div>" +
														"<div style='width:100%;clear: both;'>" +
															"<div class='infoKey'>Item Category<span class='semi-colon'>:</span></div>" +
															"<div class='infoValue innerValue'>"+(productCategory?productCategory:"-")+"</div>" +
														"</div>" +
														"<div style='width:100%;clear: both;'>" +
															"<div class='infoKey'>Product Name<span class='semi-colon'>:</span></div>" +
															"<div class='infoValue innerValue'>"+(record.productName?record.productName:"-")+"</div>" +
														"</div>" +
														"<div style='width:100%;clear: both;'>" +
															"<div class='infoKey'>Manufacturer<span class='semi-colon'>:</span></div>"+
															"<div class='infoValue innerValue'>"+(record.ManufacturerName?record.ManufacturerName:"")+"</div>" +
														"</div>"+

														//"<div>"+Mfr+"</div>" +
														"<div style='margin-top:3px;width:100%;clear: both;'>"+Sup+"</div>"+

													"</td>"+
													"<td class='info'>" +
															"<div style='width:100%;clear: both;'>" +
																"<div class='infoKey'>Model/Design<span class='semi-colon'>:</span></div>" +
																"<div class='infoValue innerValue'>"+(record.mfrProductNo?record.mfrProductNo:"-")+"</div>" +
															"</div>"+
															dependentFeatures+userData+
															/*"<div style='width:100%;clear: both;'>" +
																"<div class='infoKey innerValue'>Refer to sheet for Image Refrence<span class='semi-colon'>:</span></div>" +
																"<div class='infoValue innerValue'>"+(record.imgReference?record.imgReference:"ADF")+"</div>" +
															"</div>" +
															"<div style='width:100%;clear: both;'>" +
																"<div class='infoKey innerValue'>Refer to sheet for Fabric Refrence<span class='semi-colon'>:</span></div>" +
																"<div class='infoValue innerValue'>"+(record.fabricReference?record.fabricReference:"nabguj")+"</div>" +
															"</div>" +*/
													"</td>"+
												"</tr>"+
											"</table>"+
											//"<table class='specListHeader'>"+
												"<div style='padding:5px 0px'>"+
														"<div class='infoKey'>Instructions</div>" +
														"<div class='infoValue innerValue' style='white-space:pre-wrap'>"+(record.instructions?record.instructions:"-")+"</div>" +
												"</div><div>"+customImages+"</div>"+
													images+
													(videos.length>0?
															("<div>"+
																"<div class='infoKey'>Video Links<span class='semi-colon'>:</span></div>" +
																"<div class='infoValue innerValue'  style='white-space:pre-wrap' >"+videos+"</div>" +
															"</div>"):"")+
													"<div>"+
														"<div class='infoKey'>Features<span class='semi-colon'>:</span></div>" +
														"<div class='infoValue innerValue'  style='white-space:pre-wrap' >"+(record.features?record.features:"-")+"</div>" +
													"</div>"
												+componentsData+
											"</div>";

							callback(architectHeader+scheduleName+specHeader,itemNumber,options);
						});
					});
				});
			//});//getMFR
		});
		});
	});
}
function getComponents(recordId,callback){
	var query = N1qlQuery.fromString("SELECT * FROM `records` WHERE docType=$1 AND `SpecListProductCategoryProduct`=$2 ORDER BY `itemNumberTranslation`");
	query.adhoc = false;
	var mapSetData={
			recordId:recordId,
			relationName:"hasComponent",
			translatingField:"itemNumber",
			translatedField:"itemNumberTranslation"
	};
	GenericServer.setOrgSpecificValuesForAllRelatedRecords(mapSetData,function(rsd){
	CouchBaseUtil.executeN1QL(query,["SpecListProductComponent",recordId],function(components){
		if(components.length==0){
			callback("");
		}else{
			var componentsTable="<div class='info infoKey'>Components</div><table class='componentsTable'>"+
								"<tr>"+
									"<th>Item No.</th>"+
									"<th>Image</th>"+
									"<th>Category</th>"+
									"<th>Item</th>"+
									"<th>Comment</th>"+
									"<th>Quantity</th>"
								"</tr>";



			getProductDetails(0)
			function getProductDetails(index){
				if(index<components.length){
					var component=components[index].records;
					CouchBaseUtil.getDocumentByIdFromContentBucket(component.Product,function(proRes){
						if(proRes.error){
							getProductDetails(index+1);
						}else{
							var productRecord=proRes.value;
							var image;
							try{
								image="<img height='50' src='http://res.cloudinary.com/dzd0mlvkl/image/upload/v1498640646/"+productRecord.productImages[0].produtImages[0].cloudinaryId+"'>";
							}catch(err){image=undefined}
							componentsTable+="<tr>"+
								"<td>"+(component.itemNumberTranslation?component.itemNumberTranslation:"-")+"</td>"+
								"<td>"+(image?image:"-")+"</td>"+
								"<td>"+(component.ProductCategoryName?component.ProductCategoryName:"-")+"</td>"+
								"<td>"+(component.ProductName?component.ProductName:"-")+"</td>"+
								"<td>"+(component.comment?component.comment:"-")+"</td>"+
								"<td>"+(component.quantity?component.quantity:"-")+"</td>"+//+"*"+(component.price?component.price:"-")+"="+(component.totalPrice?component.totalPrice:"-")
							"</tr>";
							getProductDetails(index+1);
						}
					});
				}else{
					componentsTable+="</table>";
					callback(componentsTable);
				}
			}
		}
	});
	});
}

function getManufacturer(mfr,callback){
	var html="";
	CouchBaseUtil.getDocumentByIdFromContentBucket(mfr,function(mfrRes){
		if(!mfrRes.error){
			var manufacturer=mfrRes.value;
			try{
				html="<div class='infoKey'>Manufacturer<span class='semi-colon'>:</span></div>"+
				"<div class='infoValue innerValue'>"+(manufacturer.name?manufacturer.name:"")+"</div>";
				 /*html="<div class='infoKey'>Manufacturer<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>" +
					 	"<div>"+(manufacturer.name?manufacturer.name:"")+"</div>" +
						 	((manufacturer.address)?("<div>"+(manufacturer.address.streetAddress?manufacturer.address.streetAddress:"")+"</div>" +
						 						"<div>"+(manufacturer.address.addressLocality?manufacturer.address.addressLocality:"")+"</div>" +
						 						"<div>"+(manufacturer.address.addressRegion?manufacturer.address.addressRegion:"")+"</div>"+
						 						"<div>"+(manufacturer.address.addressCountry?manufacturer.address.addressCountry:"")+"</div>"):"")+
					 "</div>"+
					 "<div class='infoKey indent '>Phone<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>"+(manufacturer.address && manufacturer.address.telephone?manufacturer.address.telephone:"-")+"</div>" +
					 "<div class='infoKey indent'>Email<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>"+(manufacturer.address && manufacturer.address.email?manufacturer.address.email:"-")+"</div>" +
					 "<div class='infoKey indent'>WEBSITE<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>"+(manufacturer.website?manufacturer.website:"-")+"</div>" ;*/

			}catch(err){console.log(err);}

		}
		callback(html);
	})
}

function getSupplier(sup,callback){
	var html="";
	//CouchBaseUtil.getDocumentByIdFromContentBucket(sup,function(supRes){
		//if(!supRes.error){
			//var supplier=supRes.value;
			var supplier={name:sup.supplierName,address:sup.supplierAddress};
			try{
				html="<div class='infoKey'>Supplier<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>" +
					 	"<div>"+(supplier.name?supplier.name:"-")+"</div>" +
						 	((supplier.address)?("<div>"+(supplier.address.streetAddress?supplier.address.streetAddress:"")+"</div>" +
						 						"<div>"+(supplier.address.addressLocality?supplier.address.addressLocality:"")+"</div>" +
						 						"<div>"+(supplier.address.addressRegion?supplier.address.addressRegion:"")+"</div>"+
						 						"<div>"+(supplier.address.addressCountry?supplier.address.addressCountry:"")+"</div>"):"")+
					 "</div>"+
					 "<div class='infoKey indent'>Phone<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>"+(supplier.telephone?(supplier.telephone+" "):"")+(supplier.address && supplier.address.telephone?supplier.address.telephone:(supplier.telephone?"":"-"))+"</div>" +
					 "<div class='infoKey indent'>Email<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>"+(supplier.address && supplier.address.email?supplier.address.email:"-")+"</div>" +
					 "<div class='infoKey indent'>WEBSITE<span class='semi-colon'>:</span></div>" +
					 "<div class='infoValue innerValue'>"+(supplier.website?supplier.website:"-")+"</div>" ;

			}catch(err){console.log(err);}

		//}
		callback(html);
	//})
}

function getArchitect(architectV,callback){
	var html="";
	CouchBaseUtil.getDocumentByIdFromContentBucket(architectV,function(arcRes){
		var architect={};
		if(!arcRes.error){
			architect=arcRes.value;
			try{
				html="<div class='architectHeader'>" +
									"<img class='architectImage' src='"+architect.profileImage[0].url+"'>"+
									"<div class='architectName' >"+architect.name+"</div>"+
									"<div class='architectAddress' >" +
										"<div>"+architect.address.streetAddress+"</div>"+
										"<div>"+architect.address.addressLocality+"</div>"+
										"<div>"+architect.address.addressRegion+"</div>"+
										"<div>"+architect.address.addressCountry+"</div>"+
										"<div>"+architect.address.postalCode+"</div>"+
										"<div>"+architect.address.email+"</div>"+
										"<div>"+architect.address.telephone+"</div>" +
									"</div>"+
								"</div>";

			}catch(err){console.log(err);}
		}
		callback(html,architect);
	})

}

function getProjectResponse(org,callback){
		var project="";
		var projectName="";
		CouchBaseUtil.getDocumentByIdFromContentBucket(org,function(projectRes){
			if(!projectRes.error){
				var orgValue=projectRes.value;
				project = 		"<tr>"+
									"<td class='info'>" +
										"<div class='infoKey'>Project Name<span class='semi-colon'>:</span></div>" +
										"<div class='infoValue'>"+orgValue.name+"</div>" +
									"</td>"+
									"<td class='info'>" +
										"<div class='infoKey'>Project Number<span class='semi-colon'>:</span></div>" +
										"<div class='infoValue'>"+(orgValue.number?orgValue.number:"-")+"</div>" +
									"</td>"+
								"</tr>";
				projectName=orgValue.name;

			}
			callback(project,projectName);
		})

}
function getSpecData(record){
	var description=record.description?record.description:"-";
	if(record.description){
		var newline = String.fromCharCode(13, 10);
		var tab=String.fromCharCode(9);
		description=description.replace(/\\n/g, newline);
		description=description.replace(/\\t/g, tab);
	}
	return ("<tr>" +
				"<td class='info'>" +
						"<div class='infoKey'>Area Name<span class='semi-colon'>:</span></div>" +
						"<div class='infoValue specListName'>"+record.name+"</div>" +
				"</td>"+
				"<td class='info' style='display:none' >" +
					"<div class='infoKey'>"+"Area Type:"+"</div>" +
					"<div class='infoValue specListGrandTotal'>"+(record.areaTypeName?record.areaTypeName:"-")+"</div>"+
				"</td>"+
			"</tr>" +
			"<tr>"+
				"<td class='info'>" +
					"<div class='infoKey'>Revision Date<span class='semi-colon'>:</span></div>" +
					"<div class='infoValue specListDescription'>"+(record.dateModified?record.dateModified:"-")+"</div>" +
				"</td>"+
				"<td class='info'>" +
					"<div class='infoKey'>Issued Date<span class='semi-colon'>:</span></div>" +
					"<div class='infoValue specListDateCreated'>"+record.dateCreated+"</div>" +
				"</td>"+
			"</tr>"+
			"<tr>"+
			"<tr>"+
				"<td class='info'>" +
					"<div class='infoKey'>Description<span class='semi-colon'>:</span></div>"  +
					"<div class='infoValue specListDescription' style='white-space:pre'>"+(description)+"</div>" +
				"</td>"+
			"</tr>");
}


function constructSLPCHTML(record,callback){
	var pcInfo="";
	var productInfo="";
	CouchBaseUtil.getDocumentByIdFromContentBucket(record.ProductCategory,function(pcRes){
		if(!pcRes.error){
			pcInfo="<div class='categoryName'>"+pcRes.value.categoryName+"</div>";
		}
		if(record.finalizedProductId && record.finalizedProductId!=""){
			CouchBaseUtil.getDocumentByIdFromContentBucket(record.finalizedProductId,function(prod){
				if(!prod.error){
					utility.getMainSchema({schema:"Product",dependentSchema:prod.value.productType},function(schema){
					var images="";
					if(prod.value && Array.isArray(prod.value.productImages)){
						for(var i=0;i<prod.value.productImages.length;i++){
							if(Array.isArray(prod.value.productImages[i].produtImages)){
								for(var j=0;j<prod.value.productImages[i].produtImages.length;j++){
									var imageId=prod.value.productImages[i].produtImages[j].cloudinaryId;
									if(imageId && images==""){
										images+="<img src='https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/"+imageId+".jpg'/>";
									}
								}
							}
						}
					}
					var temp="<table class='specListHeader'><tr>";

					temp+="<td class='info'>" +
							"<div class='infoKey'>Requirement Number<span class='semi-colon'>:</span></div>" +
							"<div class='infoValue'>"+(record.reqNumber?record.reqNumber:"-")+"</div>" +
						  "</td>";

					temp+="<td class='info'>" +
							"<div class='infoKey'>Name<span class='semi-colon'>:</span></div>" +
							"<div class='infoValue'>"+prod.value.name+"</div>" +
						  "</td></tr>";
					temp+="<tr><td class='info'>" +
							"<div class='infoKey'>Notes<span class='semi-colon'>:</span></div>" +
							"<div class='infoValue'>"+(record.comment?record.comment:"-")+"</div>" +
						  "</td>";

					temp+="<td class='info'>" +
							"<div class='infoKey'>Manufacturer<span class='semi-colon'>:</span></div>" +
							"<div class='infoValue'>"+prod.value.esMeta+"</div>" +
						  "</td></tr>";
					var tr=true;
					if(prod.value.mfrProductNo){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Product Number<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+prod.value.mfrProductNo+"</div>" +
							  "</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}

					if(record.area){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Area Name<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+record.area+"</div>" +
							  "</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}
					if(prod.value.specifications){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Specifications<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+prod.value.specifications+"</div>" +
							  "</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}
					/*if(prod.value.termsAndConditions)
					temp+="<div class='info'>" +
							"<div class='infoKey'>Manufacturer Conditions</div>" +
							"<div class='infoValue'>"+prod.value.termsAndConditions+"</div>" +
						  "</div>";*/
					if(prod.value.price){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Product Price<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+prod.value.price+"</div>" +
							  "</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}

					if(record.quantity){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Quantity<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+record.quantity+" "+(record.UOMSymbol?record.UOMSymbol:"")+"</div>" +
								"</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}

					if(record.price && record.price!="error"){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Spec Price<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+record.price+"</div>" +
								"</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}

					if(record.totalPrice){
						temp+=(tr?"<tr>":"")+"<td class='info'>" +
								"<div class='infoKey'>Total Price<span class='semi-colon'>:</span></div>" +
								"<div class='infoValue'>"+(record.totalPrice?record.totalPrice:"-")+"</div>" +
								"</td>"+(!tr?"</tr>":"");
						tr=(!tr);
					}

					if(prod.value && prod.value.dependentProperties){
						for(var key in prod.value.dependentProperties){
							if(schema && schema["@properties"] && schema["@properties"][key]){

								temp+=(tr?"<tr>":"")+"<td class='info'>" +
										"<div class='infoKey'>"+schema["@properties"][key].displayName+"<span class='semi-colon'>:</span></div>" +
										"<div class='infoValue'>"+prod.value.dependentProperties[key]+"</div>" +
										"</td>"+(!tr?"</tr>":"");
								tr=(!tr);

							}
						}
					}
					if(!tr){
						temp+="</tr>";
					}
					temp+="</table>";
					productInfo="<div class='productInfo'>" +
									temp +
									"<div class='productImages'>"+images+"</div>" +
								"</div>";
					sendRes();
					});
				}else{
					sendRes();
				}
			});
		}else{
			sendRes();
		}
	});
	function sendRes(){
		callback("<div class='productRow'>"+pcInfo+productInfo+"</div>");
	}
}
