/*$.ajax({
  url: "https://localhost/jsonp",
  type: 'post',
   jsonp: "callback",
   jsonpCallback:"myCallback",
   dataType: 'jsonp',
   crossDomain: true,
  success: function( result ) {
   console.log(result);
  }
});*/
var schema="Supplier";
var docId="Suppliera9d1778b-4733-1a3d-0249-3e93cbafe897";
var baseURL="https://localhost";
var supplier=undefined;

function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for( var i=0; i < 5; i++ ){ text += possible.charAt(Math.floor(Math.random() * possible.length));}
    return text;
}

function executeJSONP(url,data,callback) {
	var xhttp = new XMLHttpRequest();
	var callbackId="CB"+makeid().replace("-","_");
	window[callbackId]=callback;
	xhttp.onreadystatechange=function() {
		if(this.readyState == 4 && this.status == 200){
			var s = document.createElement("script");
			s.innerHTML = this.responseText;
			document.body.appendChild(s);
		}
	};
	xhttp.open("GET", baseURL+url+"&callback="+callbackId+"&data="+JSON.stringify(data), true);
	xhttp.send();
}

function getSupplierDoc(){
	executeJSONP("/generic?operation=getSchemaRecordForView",{"schema":schema,"recordId":docId,"org":"public"},function(data){
		supplier=data.record;
		document.getElementById("demo").innerHTML="<h1>"+supplier.name+"</h1>"+
		"<h2>"+supplier.address.streetAddress+"</h2>"+
		"<h3>"+supplier.website+"</h3>";
	});
}

function loadData(){
	getSupplierDoc();
}