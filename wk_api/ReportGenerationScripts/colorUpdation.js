var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var ViewQuery = couchbase.ViewQuery;
var cbContentBucket=cluster.bucket("records");
//var cbMasterBucket=cluster.openBucket("schemas");
var cbDefinitionBucket=cluster.bucket("definitions");
var cbContentCollection=cbContentCollection.defaultCollection();
var cbDefinitionCollection=cbDefinitionBucket.defaultCollection();
var cloudinary = require('cloudinary');
cloudinary.config({ 
   cloud_name: "dzd0mlvkl",
   api_key: "672411818681184", 
   api_secret: "mqpdhFgkCTUyrdg318Var9_dH-I"
});
function viewCode(doc, meta) {
   if(doc.docType=="Product" && 
		   (doc.productType=="Fabric" ||
				   doc.productType=="Laminate" ||
				   doc.productType=="Veneer" ||
				   doc.productType=="Flooring" ||
				   doc.productType=="FloorTile" ||
				   doc.productType=="WallTile" ||
				   doc.productType=="Wallpapers" ||
				   doc.productType=="NaturalStone" ||
				   doc.productType=="Plywood" 
				   )){
	   if(!dependentProperties.color)
  	emit(1,doc);
  }
}
/**
 * Done Types Fabrics(83878) Laminates(3894) Veneer(433) Flooring(1654)
 */
/*cloudinary.api.resource('549429e3-9d1a-99a3-ea27-e22784e45b08',function(result){
	console.log(result.colors);	//	[ [ '#A08F80', 85.2 ], [ '#AF9E8F', 14.7 ] ]	
	console.log(result.predominant);//	{ google: [ [ 'gray', 100 ] ], cloudinary: [ [ 'gray', 100 ] ] }
},{colors:true});*/

var fixedGroups={
		"Blue":"#0000FF",
        "Black":"#000000",
        "Brown":"#A52A2A",
        "Cyan":"#00FFFF",
        "Green":"#008000",
        "Grey":"#808080",
        "Gray":"#808080",
        "Orange":"#FFA500",
        "Pink":"#FFC0CB",
        "Purple":"#800080",
        "Red":"#FF0000",
        "White":"#FFFFFF",
        "Yellow":"#FFFF00"
	}
var colorGroups={};
var skip=0;
var limit=10;
//81600 fabrics
executeCode(0);
function executeCode(skp){
	skip=skp;
	console.log("Current Skip "+ skip);
cbDefinitionCollection.get("Colors",function(err, result) {
	if (err) {console.log(err); executeCode(skp); return; }
	colorGroups=result.value;
//Test-test3
	//var query = ViewQuery.from("ColorUpdation", "nocolor").skip(skip).limit(limit);//.stale(ViewQuery.Update.BEFORE);
	var query=await cbContentBucket.viewQuery("ColorUpdation", "nocolor",skip(skip),limit(limit));
	cluster.query(query, function(err, data) {
		if(err){console.log(err);executeCode(skp);return;}
		console.log(data.length);
		if(data.length==0){
			console.log("All Done");
			return;
		}
		updateProduct(0);
	
		function updateProduct(index){
			if(index>=data.length){
				console.log("DONE "+(skip+limit));
				executeCode(skp+limit);
				return ;
			}
			console.log(index);
			var docu=data[index].value;
			if(docu.docType && docu.docType=="Product"){
				var imageId;
				try{
					imageId=docu.productImages[0].produtImages[0].cloudinaryId;
					console.log(imageId);
				}catch(err){}
				if(docu.dependentProperties){
					/*console.log(docu.dependentProperties.colorGroup);
					var color=docu.dependentProperties.color;
					var colorGroup=docu.dependentProperties.colorGroup;
					if(colorGroup && !color){
						color=fixedGroups[colorGroup];
					}
					if(color && color.indexOf("#")==0){
						var name="";
						var temp=classify(color);
						colorGroup=temp.group;
						name=temp.name;
						docu.dependentProperties.color=color+" "+colorGroup+" "+name;
					}*/
					console.log(docu.dependentProperties.color);
				}
				
				
				console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");
				/*cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
					if (err) { console.log(err); }
					 updateProduct(index+1);
				});*/
				if(imageId){
					cloudinary.api.resource(imageId,function(result){
						try{
							var colorCode=result.colors[0][0];
							var temp=classify(colorCode);
							var newColor=colorCode+" "+temp.group+" "+temp.name;
							console.log(newColor);
							if(!docu.dependentProperties){
								docu.dependentProperties={};
							}
							docu.dependentProperties.color=newColor;
							docu.dependentProperties.predominant=result.predominant;
							docu.dependentProperties.colors=result.colors;
							cbContentCollection.upsert(docu.recordId,docu,function(err, result) {
								if (err) { console.log(err); }
								setTimeout(function(){updateProduct(index+1);},2000);
							});	
						}catch(err){
							console.log(result);
							setTimeout(function(){updateProduct(index+1);},2000);
						}
					},{colors:true});
				}else{
					updateProduct(index+1);
				}
			}else{
				updateProduct(index+1);
			}
		}
	});
});
}
function rgbToHsl(r, g, b) {	
	if( r=="" ) r=0;
	if( g=="" ) g=0;
	if( b=="" ) b=0;
	r = parseInt(r,16);
	g = parseInt(g,16);
	b = parseInt(b,16);
	if( r<0 ) r=0;
	if( g<0 ) g=0;
	if( b<0 ) b=0;
	if( r>255 ) r=255;
	if( g>255 ) g=255;
	if( b>255 ) b=255;
	hex = r*65536+g*256+b;
	hex = hex.toString(16,6);
	len = hex.length;
	if( len<6 )
		for(i=0; i<6-len; i++)
			hex = '0'+hex;
	r/=255;
	g/=255;
	b/=255;
	M = Math.max(r,g,b);
	m = Math.min(r,g,b);
	d = M-m;
	if( d==0 ) h=0;
	else if( M==r ) h=((g-b)/d)%6;
	else if( M==g ) h=(b-r)/d+2;
	else h=(r-g)/d+4;
	h*=60;
	if( h<0 ) h+=360;
	l = (M+m)/2;
	if( d==0 )
		s = 0;
	else
		s = d/(1-Math.abs(2*l-1));
	s*=100;
	l*=100;
	return [h.toFixed(0)*1,s.toFixed(1)*1,l.toFixed(1)*1];
}
function calcDistance(v1,v2){
    var dx = v1[0] - v2[0];
    var dy = v1[1] - v2[1];
    var dz = v1[2] - v2[2];
    return Math.sqrt( dx * dx + dy * dy + dz * dz );
}
function classify(hex){
	hex=hex.replace("#","");
	var hsl=rgbToHsl(hex.substr(0,2),hex.substr(2,2),hex.substr(4,2));
	var distance;
	var result;	
	for(var group in colorGroups){
		for(var colorIndex in colorGroups[group]){
			if(!Array.isArray(colorGroups[group][colorIndex].hsl)){
				var string=colorGroups[group][colorIndex].hex.replace("#","");
				colorGroups[group][colorIndex].hsl=rgbToHsl(string.substr(0,2),string.substr(2,2),string.substr(4,2));
			}
			var temp=calcDistance(hsl,colorGroups[group][colorIndex].hsl);
			if(distance==undefined || temp<distance){
				distance=temp;
				result=colorGroups[group][colorIndex];
				result.group=group;
			}
		}
	}
	return result;
}

