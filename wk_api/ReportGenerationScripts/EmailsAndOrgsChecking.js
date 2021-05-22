var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});
//var cluster = new couchbase.Cluster("couchbase://db.wishkarma.com");
var N1qlQuery = couchbase.N1qlQuery;
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.bucket(records);
var cbMasterBucket=cluster.bucket(schemas);
var emails=["tgrover@hassellstudio.com","dmahboobani@watg.com","mmcmahon@watg.com","sersalle@watg.com","pdesimone@watg.com","rmabuhay@watg.com","bthongkumpla@watg.com","Iuliia.Gudzenko@studiohba.com","jiamin@studiohba.com","karolina@studiohba.com"]
var emails3=["iaiadrew.tiin@gfaglobal.com","sue@trendglass.com","sales@synergraphic.com.sg","chle@kvadrat.org","lexx@zenzii.net","alan@jcessex.com.sg","effie.neo@goodrichglobal.com.sg","glenn.lim@cetec.com.sg","diane.lim@tdhbrics.com.sg","jason_wong@bodhifabrics.com.sg","sharontay@rice-fields.com","sharon@timplex.sg","adriantan@taipingcarpets.com","joyce@panaplast.com.sg","kamonwan@edleui.com","melissa.low@kohler.com","christina.beh@toto.com","csee@cosentino.com","keithyang@eartharts.com.sg","info@eartharts.com.sg","6utafuglviuxj.a.flan@l_fchej","wiranruthai@carpetmaker.co.th","vivek@maascirchitects.net","admin@maasarchitects.net","abhishekm@studiohba.com","3@cleoneltclo.com","ileholliller@dileonardo.com","acurrie@ulema-group.com","design@snehasamtani.com","spar@watg.com","candari@fscarchitects.com","claudio.rigo@jab.de","fujii@nipek.jp","marko.murtic@eeag.hr","anthony.cheng@al-enterprise.com","ht@singnet.com.sg","jessica@bolonasia.com","lukas.cerny@lasvit.com","vinay.melwani@timothyoulton.com","derrick.ng@forms-surfaces.com","t.wong@erco.com","marketing@atelier-a.it","cordaro@filveneer.com","gerald.chan@mtmsolution.com","johnny@eltfield.com.sg","bartha@watg.com","amanda.ye@ecoid.com","gerlynn@bltfield.com.sg","kenneth.toh@ubiqgiobae.am","tny@chroma.com.sg"];
var emails2=["enquiry.asia@interface.com","jessica@bolonasia.com","simonne@aristide.be","shop@luludk.com","samples@weitznerlimited.com","nachik@nachik.com","Matthieu.frey@pierrefrey.com","accounts@pollackassociates","norman.halard@nobilis.fr","mail@donghia.com","erreerre@erreerre.it","f.paolini@rubelli.com","info@cts-spa.com","uksales@colefax.co.uk","carpet@kravet.com","decortexstore@gmail.com","info@josephnoble.com","info@foglizzo.com","info@cetec.com.hk","Afratzke@donghia.com","info@4Spaces.ch","aldecogeral@aldeco.pt","showroom.paris@casamance.com","sales@bossdesign.com","info@odegardcarpets.com","info@kohro.it","zaw.lou@rigel.com.sg","anindya.sikder@indiabullsled.com","office@cec-milano.com","veronica.diaz@vimar.com","vibhor.sharma@shawinc.com","dee@opuzen.com","sales@etesse.com.sg","info@brochier.it","manjotrangarsons@gmail.com","f.paolini@rubelli.com","Vanessa.Karmann@gira.de ","customer.care@legrand.co.in","Karuna.G@schneider-electric.com","info@sahco.com","diane.lim@tdhbrics.com.sg","samantha@davidsutherlandinc.com","info@seguso.com        ","laura.zangara@penelopeoggi.com","philip@estudio.sg","TomPerry@portaromana.com","info@houles.com","info@barthalpern.com","mail@creationbaumann.com ","studio@christopherfarrcloth.com","sales@panaz.co.uk","marketing@fandf.in","ADawson@brentanofabrics.com","contact@elitis.fr","sales@cetec.com.hk"];
function getEmailDomain(email){
	var emailDomain
	if(email){
		try{
			emailDomain=((email).split("@")[1]).split(".");
			emailDomain.splice(emailDomain.length-1,1);
			emailDomain=emailDomain.join(".");
			 if([
	          "gmail",
	          "yahoo",
	          "yahoo.co",
	          "yahoomail",
	          "email",
	          "hotmail",
	          "outlook",
	          "zoho",
	          "ymail",
	          "rediff",
	          "rediffmail"
	        ].indexOf(emailDomain)>-1){
				 emailDomain=undefined;
			 }
		}catch(err){
			
		}
	}
	return emailDomain;
}
checkEmail(0);
function checkEmail(i){
	if(i<emails.length){
		console.log("------------------------------");
		var domain=getEmailDomain(emails[i]);
		console.log(emails[i]);
		console.log(domain);
		var querystring = " SELECT recordId,orgDomain,name,website,docType  "+
		"FROM records  "+
		"WHERE ANY domain IN `orgDomain` SATISFIES domain=$1  END AND (docType=$2 OR docType=$3 OR docType=$4 OR docType=$5 OR docType=$6 OR docType=$7 )";
		var query = N1qlQuery.fromString(querystring);
		query.adhoc = false;
		cluster.query(query,[domain,'Provider','Manufacturer','Developer','Supplier','ServiceProvider','Organization'] ,function(err, result) {
			console.log(result);
			console.log("------------------------------");
			checkEmail(i+1);
		});
	}else{
		console.log("==========================================================");
		console.log("========================DONE==============================")
		console.log("==========================================================");
	}
}