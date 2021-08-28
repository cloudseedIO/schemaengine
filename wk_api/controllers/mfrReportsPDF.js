var pdf = require('html-pdf');
var CouchBaseUtil=require('./CouchBaseUtil.js');
var utility=require('./utility.js');
var couchbase = require('couchbase');
var global=require('../utils/global.js');
var GenericServer=require('./GenericServer.js');
var logger = require('../services/logseed').logseed;
var urlParser=require('./URLParser');
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
		}
}


function generatePDF(request,response){
		var data=urlParser.getRequestBody(request);
    var htmlData="";
    data.download=true;
    GenericServer.getMfrReports(data,function(allReports){

  		//callback(allReports);
      var dataHtml = "";
      for(var i=0;i<allReports.length;i++){
        dataHtml += "<tr>" +
                    "<td>"+allReports[i].author+"</td>" +
                    "<td>"+allReports[i].ProductCategoryName+"</td>" +
                    "<td>"+allReports[i].SpecList+"</td>" +
                    "<td>"+allReports[i].quantity+"</td>" +
                  "</tr>";

      }
      htmlData =
                  "<table class='specSheetLinesTable'>" +
                      "<thead>" +
                      "<tr>" +
                        "<th>BUILDER</th>" +
                        "<th>CATEGORY</th>" +
                        "<th>SPECIFIC PRODUCT</th>" +
                        "<th>QUANTITY</th>" +
                      "</tr>" +
											 dataHtml +
                      "</thead>" +
                      "<tbody>" +
                      "</tbody>" +
										"</table>";

        sendResponse(request,response,htmlData,"MFRREPORT");
  	});

}
exports.generatePDF=generatePDF;
