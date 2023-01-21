var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://db.cloudseed.com");
var ViewQuery = couchbase.ViewQuery;
var N1qlQuery = couchbase.N1qlQuery;
var records = "records";
var cbContentBucket = cluster.openBucket(records);
var global = require('../utils/global.js');
var cloudinary = require('cloudinary');
var categories = require('./productCategories.json');

cloudinary.config({
    cloud_name: "dzd0mlvkl",
    api_key: "672411818681184",
    api_secret: 'mqpdhFgkCTUyrdg318Var9_dH-I'
});

/**
 * Cloudinary API
 *
 *
 *
 */
function uploadToCloudinary(imageData, callback) {
    cloudinary.v2.uploader.upload(imageData.url, {
        "public_id": imageData.id
    }, function(err, result) {
        if (err) {
            console.log(err);
            console.log("error while uploading :" + url);
            cloudinary.v2.api.delete_resources([imageData.id], function(error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
        } else {
            callback(result);
        }
    });
}

var manufacturers = [


  {
    "Name": "Marrakech Design",
    "WebSite": "https://www.marrakechdesign.se/en/",
    "Profile": "https://www.marrakechdesign.se/wp-content/uploads/2016/12/marrakech-start-logo-1.png",
    "ProductCats": "Floor Tiles"
  },
  {
    "Name": "MONSAM Portable Sinks",
    "WebSite": "https://portablesink.com/",
    "Profile": "https://portablesink.com/wp-content/uploads/logo-100.png",
    "ProductCats": "Utility Sinks"
  },
  {
    "Name": "Sagiper",
    "WebSite": "https://sagiper.com/",
    "Profile": "https://sagiper.com/wp-content/themes/sagiper-theme/static/img/sagiper-logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Stusser Wood Works",
    "WebSite": "http://www.stusserwoodworks.com/index-2.html",
    "Profile": "http://www.stusserwoodworks.com/images_shared/home_logo.jpg",
    "ProductCats": "Dining Tables"
  },
  {
    "Name": "Pimeks Group",
    "WebSite": "https://www.pimeks.com/index.php",
    "Profile": "https://www.pimeks.com/pimekslogo.png",
    "ProductCats": ""
  },
  {
    "Name": "Mixlegno",
    "WebSite": "http://www.mixlegno.it/index.php",
    "Profile": "http://www.mixlegno.it/assets/images/logo.png",
    "ProductCats": "Winter Gardens,Facade Cladding"
  },
  {
    "Name": "Minotticucine",
    "WebSite": "https://www.minotticucinelondon.com/index.html",
    "Profile": "https://www.minotticucinelondon.com/images/minottilondon-wht-255x20.png",
    "ProductCats": "Modular Kitchens"
  },
  {
    "Name": "MHS Radiators",
    "WebSite": "https://www.mhsradiators.co.uk/",
    "Profile": "https://i.pinimg.com/280x280_RS/ca/15/3a/ca153a4abea836b42bbcf6cd7b42c6cc.jpg",
    "ProductCats": "Washbasin Faucets,Towel Holders"
  },
  {
    "Name": "Low & Bonar",
    "WebSite": "https://www.lowandbonar.com/",
    "Profile": "https://d3vs19tfeyo14d.cloudfront.net/media/2017/06/04084042/logo.png",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "Kevala Stairs",
    "WebSite": "https://kevalastairs.com/",
    "Profile": "https://kevalastairs.com/wp-content/uploads/2018/01/Kevala-Stairs-Logo-103x87.png",
    "ProductCats": ""
  },
  {
    "Name": "Hudevad Radiators",
    "WebSite": "https://hudevad.com/en/",
    "Profile": "https://hudevad.com/media/logo/stores/1/Hudevad_radiator_design_1.png",
    "ProductCats": "Radiators"
  },
  {
    "Name": "Breezefree",
    "WebSite": "https://www.breezefree.com/",
    "Profile": "https://www.breezefree.com/images/breezefree-logo-white.svg",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Astra Door Controls",
    "WebSite": "http://www.astradoorcontrols.com/",
    "Profile": "http://www.astradoorcontrols.com/wp-content/uploads/2018/11/Astra-door-control-new-logo.png",
    "ProductCats": "Shutter Hinge"
  },
  {
    "Name": "Wool Studio",
    "WebSite": "https://www.thewoolstudio.com/",
    "Profile": "https://static.wixstatic.com/media/9a1fb2_c1bf4a744bb34efca6af92aad475fe69.jpg/v1/fill/w_173,h_83,al_c,q_80,usm_0.66_1.00_0.01/9a1fb2_c1bf4a744bb34efca6af92aad475fe69.webp",
    "ProductCats": "Rugs"
  },
  {
    "Name": "Lunawood",
    "WebSite": "https://lunawood.com/",
    "Profile": "https://lunawood.com/wp-content/themes/basicteema/img/loaded/logo.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Gie El",
    "WebSite": "https://www.gie-el.pl/en/",
    "Profile": "https://www.gie-el.pl/wp-content/uploads/2018/06/gie_el_logo-white.png",
    "ProductCats": "Warming Drawers,Coffee Tables"
  },
  {
    "Name": "Blanc de Bierges",
    "WebSite": "http://www.blancdebierges.com/",
    "Profile": "http://www.blancdebierges.com/wp-content/uploads/sites/14/2016/06/Blanc-de-Bierges-logo.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "IntiLED",
    "WebSite": "https://intiled.ru/en/",
    "Profile": "https://intiled.ru/templates/yootheme/cache/LOGO_IntiLED_noslogan_white-a283472b.webp",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Falquon GmbH",
    "WebSite": "https://www.falquon.de/home",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/26992266_2018818561467237_7599212908442726714_n.jpg?_nc_cat=106&_nc_ht=scontent.fhyd3-1.fna&oh=9a746c095efa0489b1d723997a09dfde&oe=5C7A63AC",
    "ProductCats": "Floorings,Doors"
  },
  {
    "Name": "Kastamonu Entegre",
    "WebSite": "http://keas.com.tr/en/keas-mainpage",
    "Profile": "http://keas.com.tr/images/sitelayout/logo.png",
    "ProductCats": "Floorings,Chimneys"
  },
  {
    "Name": "Zollanvari",
    "WebSite": "http://zollanvari.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/21616214_1390757287698865_5981044050057082390_n.jpg?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=519a56622d6a905cf23b1ecd956554d7&oe=5C868E81",
    "ProductCats": "Carpets"
  },
  {
    "Name": "Baltic Wood",
    "WebSite": "https://www.balticwood.pl/en",
    "Profile": "https://www.balticwood.pl/assets/img/logo.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Ecoaire",
    "WebSite": "https://www.ecoaire.com/",
    "Profile": "https://static.wixstatic.com/media/a12c80_e500e358ac3e45749490491e22c6ae27~mv2_d_2339_1654_s_2.jpg/v1/crop/x_0,y_378,w_2339,h_898/fill/w_288,h_112,al_c,q_80,usm_0.66_1.00_0.01/New%20Eco%20Logo%20(002)%20full.webp",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "OCOX Composite Material",
    "WebSite": "http://www.ocox.com.cn/Eweb/index.asp",
    "Profile": "http://image.cccme.org.cn/u_logo/2010/2/2/201012261706593323_125447312.jpg",
    "ProductCats": ""
  },
  {
    "Name": "Eero Aarnio",
    "WebSite": "https://eeroaarnio.com/",
    "Profile": "http://www.lewisinteriors.com/uploads/8/6/3/6/86368732/eero_orig.png",
    "ProductCats": "Arm Chairs,Coffee Tables"
  },
  {
    "Name": "NW Building Tech",
    "WebSite": "http://www.nwbti.com/",
    "Profile": "http://www.nwbti.com/wp-content/themes/nwbti-Twitter-Bootstrap/img/nwbt_logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Artotech Laser",
    "WebSite": "http://www.artotechlaser.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c33.0.200.200/p200x200/13428544_1323076354388712_496111452053084390_n.jpg?_nc_cat=103&_nc_ht=scontent.fhyd3-1.fna&oh=9a9b61cfe53c2f6573a79a020f8df8b7&oe=5C78C7C8",
    "ProductCats": "Fences"
  },
  {
    "Name": "Olympia Tile",
    "WebSite": "http://olympiatile.com/",
    "Profile": "http://olympiatile.com/sites/all/images/olympia_logo2.png",
    "ProductCats": "Wall Tiles"
  },
  {
    "Name": "Ebenisterie Gaston Chouinard",
    "WebSite": "http://www.ebenisteriegastonchouinard.ca/",
    "Profile": "http://www.ebenisteriegastonchouinard.ca/wp-content/uploads/2012/12/logo-gaston-chouinard2.png",
    "ProductCats": "Dining Tables,Single Beds"
  },
  {
    "Name": "APEL Extrusions",
    "WebSite": "http://www.apelextrusions.com/",
    "Profile": "http://www.apelextrusions.com/wp-content/uploads/2015/01/logo.png",
    "ProductCats": "Paints"
  },
  {
    "Name": "Visual Comfort",
    "WebSite": "https://www.visualcomfortlightinglights.com/",
    "Profile": "https://media.lightingnewyork.com/grfx/micro/vcm.png",
    "ProductCats": "Chandelier Lights,Interior Lights"
  },
  {
    "Name": "Stein Wood Products",
    "WebSite": "http://steinwoodproducts.com/",
    "Profile": "http://steinwoodproducts.com/images/top.jpg",
    "ProductCats": "Floorings,Doors"
  },
  {
    "Name": "HBAH-HOTI",
    "WebSite": "http://hbah-hoti.com/",
    "Profile": "http://hbah-hoti.com/wp-content/uploads/2017/10/HOTI-square-copy-since.png",
    "ProductCats": "Hotel Beds"
  },
  {
    "Name": "Hebei Shuolong Metal Products",
    "WebSite": "http://www.architecturalmesh.cn/",
    "Profile": "http://en.chenggongyi.com/static/pic/793/15114566236951.png",
    "ProductCats": "Blinds"
  },
  {
    "Name": "One Kings Lane",
    "WebSite": "https://www.onekingslane.com/home.do",
    "Profile": "https://www.onekingslane.com/images//onekingslane/en_us/global/globalgraphics/svg/okl-logo_full.svg",
    "ProductCats": "Sectional,Coffee Tables,Side Tables,Benches,Book Cases,Rugs"
  },
  {
    "Name": "Allmodern",
    "WebSite": "https://www.allmodern.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/43766861_2193320797365920_4447178514608685056_n.jpg?_nc_cat=1&_nc_ht=scontent.fhyd3-1.fna&oh=4508288efe4836d28c1fce701875e212&oe=5C8863B6",
    "ProductCats": "Rugs,Coffee Tables,Side Tables"
  },
  {
    "Name": "Berkshire Products",
    "WebSite": "http://berkshireproducts.com/index.php",
    "Profile": "http://berkshireproducts.com/images/berks_products_logo2.png",
    "ProductCats": ""
  },
  {
    "Name": "Dartbrook Rustic Goods",
    "WebSite": "https://www.dartbrookrustic.com/",
    "Profile": "https://cdn.shopify.com/s/files/1/0768/2569/files/logo_-_black_1_61ed9114-c6a2-47d3-9a6f-55cf5b89308b_350x.jpg?v=1499363695",
    "ProductCats": "Coffee Tables,Book Cases,Arm Chairs,Sectional,Benches"
  },
  {
    "Name": "Niche Modern",
    "WebSite": "https://www.nichemodern.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/10405233_897023343672412_7811073241925949276_n.png?_nc_cat=105&_nc_ht=scontent.fhyd3-1.fna&oh=f1ed76ab2069f985217b62851962e66e&oe=5C65E00F",
    "ProductCats": "Chandelier Lights,Outdoor Pendant Lamps"
  },
  {
    "Name": "A.I.A. Industries",
    "WebSite": "https://aiaindustries.com/",
    "Profile": "http://www.aiaengineering.com/images/banner_home.jpg",
    "ProductCats": ""
  },
  {
    "Name": "RB Flooring",
    "WebSite": "http://rb-flooring.co.uk/home/2880344",
    "Profile": "http://rb-flooring.co.uk/communities/5/000/001/532/185//images/7755916.jpg",
    "ProductCats": "Floorings,Facade Cladding"
  },
  {
    "Name": "SS Carpentry",
    "WebSite": "https://www.ss-carpentry.co.uk/",
    "Profile": "https://pbs.twimg.com/profile_images/789081194726129664/bEDmPfeG_400x400.jpg",
    "ProductCats": "Wardrobes,Book Cases"
  },
  {
    "Name": "Caruso Acoustic",
    "WebSite": "https://www.carusoacoustic.it/en/",
    "Profile": "https://www.carusoacoustic.it/wp-content/uploads/logo-caruso-acoustic-treatment.png",
    "ProductCats": "Interior Lights"
  },

  {
    "Name": "Nuovo Corso",
    "WebSite": "http://www.nuovocorso.it/",
    "Profile": "http://www.nuovocorso.it/wp-content/uploads/2014/09/LOGOok.jpg",
    "ProductCats": "Natural Stone,Floorings"
  },
  {
    "Name": "Promo Spa",
    "WebSite": "http://www.promospa.eu/promo/",
    "Profile": "http://www.promospa.eu/promo/wp-content/uploads/2017/03/xMarchio-PROMO-cmyk.jpg.pagespeed.ic.ECh8f_RPqr.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Pop & Scott",
    "WebSite": "https://www.popandscott.com/",
    "Profile": "https://cdn.shopify.com/s/files/1/1251/0677/t/19/assets/logo_400x.png?8801671034776622719",
    "ProductCats": "Coffee Tables,Bar Stools,Mirrors,Double Beds"
  },
  {
    "Name": "Akustus",
    "WebSite": "http://akustus.com/",
    "Profile": "http://akustus.com/wp-content/themes/storefront-child/images/AK_Logo_VF_Black_RGB.png",
    "ProductCats": "Roof Panels"
  },
  {
    "Name": "AcoustiGuard",
    "WebSite": "http://www.acoustiguard.com/",
    "Profile": "http://www.acoustiguard.com/templates/ac4/images/logo-265515492.png",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Northern Dock Systems",
    "WebSite": "https://www.northerndocksystems.com/",
    "Profile": "https://www.northerndocksystems.com/wp-content/uploads/2018/10/nds-sm-logo-up.png",
    "ProductCats": "Shutter Hinge"
  },
  {
    "Name": "Azure City Building Solutions Inc.",
    "WebSite": "http://azurecity.ca/index.html",
    "Profile": "http://azurecity.ca/img/logo/logo-03.svg",
    "ProductCats": "Natural Stone"
  },

  {
    "Name": "Eby Construction",
    "WebSite": "https://www.visiteby.com/",
    "Profile": "https://static1.squarespace.com/static/5a565b349f07f5c81835195f/t/5a5f8c4453450ae8751748ac/1538158019297/?format=1500w",
    "ProductCats": "Coffee Tables"
  },
  {
    "Name": "Foco, Luz e Desenho",
    "WebSite": "http://www.focold.com.br/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c12.0.200.200/p200x200/11698389_922971024408843_1923971430984038534_n.png?_nc_cat=107&_nc_ht=scontent.fhyd3-1.fna&oh=7537440ddb2e33822584640121c5e8f3&oe=5C87AF3E",
    "ProductCats": ""
  },
  {
    "Name": "Eggermont Natuursteen",
    "WebSite": "https://eggermontnatuursteen.be/",
    "Profile": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq2PdSNljg7DVHEbBDq5h4MdViBQhBxZlgS_rTw2vff8fDGuKlaw",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Timber Revival",
    "WebSite": "https://www.timberrevival.com.au/",
    "Profile": "https://www.timberrevival.com.au/wp-content/uploads/2018/03/TR-logo-black-328X200.png",
    "ProductCats": "Floorings,Facade Cladding"
  },
  {
    "Name": "Confac A/S",
    "WebSite": "https://confac.dk/",
    "Profile": "https://confac.dk/images/standard/confac-logo.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "MakeItMetal",
    "WebSite": "http://makeitmetal.ca/",
    "Profile": "http://makeitmetal.ca/wp-content/uploads/2016/02/Make-It-Metal.png",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Tischlerei Ecker",
    "WebSite": "http://www.ecker.cc/",
    "Profile": "http://www.ecker.cc/2014/wp-content/uploads/2014/04/ECKER_logo.png",
    "ProductCats": "Book Cases"
  },
  {
    "Name": "Neudorfler",
    "WebSite": "https://www.neudoerfler.com/en/",
    "Profile": "https://www.neudoerfler.com/wp-content/themes/devdmbootstrap3-child/assets/img/Logo_300dpi.jpg",
    "ProductCats": "Office Chairs,Display Cabinets"
  },
  {
    "Name": "Fischer Parkett",
    "WebSite": "http://www.fischerparkett.com/produktinfo.php?p=3&l=en",
    "Profile": "http://www.fischerparkett.com/images/bildlogo.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Artprofil",
    "WebSite": "http://www.art-profil.eu/index.html",
    "Profile": "http://www.art-profil.eu/images/logo.png",
    "ProductCats": "Mirrors"
  },
  {
    "Name": "Permanent Steel Manufacturing",
    "WebSite": "https://www.permanentsteel.com/",
    "Profile": "https://www.permanentsteel.com/images/homeback_03.png",
    "ProductCats": "Pipes And Fittings"
  },
  {
    "Name": "Avanti Systems",
    "WebSite": "https://www.avantisystemsusa.com/",
    "Profile": "https://www.avantisystemsusa.com/wp-content/uploads/2017/02/avanti-systems-usa-logo.jpg",
    "ProductCats": "Doors,Office Partitions"
  },
  {
    "Name": "Urban Front",
    "WebSite": "https://www.urbanfront.com/en_GB/",
    "Profile": "https://www.urbanfront.com/shop/app/uploads/2017/03/splash-logo-1000.png",
    "ProductCats": "Doors"
  },
  {
    "Name": "Milgard Windows & Doors",
    "WebSite": "https://www.milgard.com/",
    "Profile": "https://www.milgard.com/sites/default/files/logo_1.png",
    "ProductCats": "Windows,Doors"
  },
  {
    "Name": "Hydro",
    "WebSite": "https://www.hydro.com/en/",
    "Profile": "https://www.hydro.com/globalassets/brand/hydro_logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Kern",
    "WebSite": "https://www.kern-sohn.com/shop/en/",
    "Profile": "https://www.kern-sohn.com/cosmoshop/default/pix/sets/new_style/en/shop_header/Logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Veit",
    "WebSite": "https://www.veit.de/",
    "Profile": "https://www.veit.de/wp-content/uploads/2018/07/cropped-VEIT-Logo.svg",
    "ProductCats": ""
  },
  {
    "Name": "Vollmer",
    "WebSite": "https://www.vollmer-group.com/de/#",
    "Profile": "https://upload.wikimedia.org/wikipedia/commons/4/4f/VOLLMER_LOGO.JPG",
    "ProductCats": ""
  },
  {
    "Name": "Carcereri",
    "WebSite": "http://carcereri.com.br/",
    "Profile": "http://carcereri.com.br/wp-content/themes/carcereri/images/carcereri-brand.png",
    "ProductCats": ""
  },
  {
    "Name": "MZPA",
    "WebSite": "https://mzpa.co/",
    "Profile": "https://mzpa.co/design/mazepa/images/logo_new.png",
    "ProductCats": "Lamps,Interior Lights"
  },
  {
    "Name": "Woelm",
    "WebSite": "http://www.woelm.de/page.php",
    "Profile": "http://www.woelm.de/fileadmin/images/Banner_0418_deu.jpg",
    "ProductCats": "Locks,Wardrobes"
  },
  {
    "Name": "Wilka Schliesstechnik",
    "WebSite": "https://www.wilka.de/",
    "Profile": "https://www.wilka.de/datafiles/images/frontend/navigation/hauptmenue/wilka_logo_b.png",
    "ProductCats": "Locks,Door Handles"
  },
  {
    "Name": "Joka",
    "WebSite": "https://www.joka.de/ch_en/joka-ch-en.html",
    "Profile": "https://www.joka.de/fileadmin/layout/img/JOKA_/logo-joka.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Vigour",
    "WebSite": "https://www.vigour.de/",
    "Profile": "https://www.vigour.de/themes/vigour/logo.svg",
    "ProductCats": "Bath Tubs,BathTub Faucets,Bathroom Cabinets"
  },
  {
    "Name": "Stylepark",
    "WebSite": "https://www.stylepark.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/532498_10150694002829911_482661946_n.jpg?_nc_cat=100&_nc_ht=scontent.fhyd3-1.fna&oh=5542614431204de49303f5a54e52e15a&oe=5C83C9A4",
    "ProductCats": "Floorings,Suspended Ceilings,Outdoor Lights"
  },
  {
    "Name": "Solaxess",
    "WebSite": "http://www.solaxess.ch/en/home/",
    "Profile": "https://www.solaxess.ch/wp-content/uploads/2018/07/logo_2-e1530598245388.jpg",
    "ProductCats": ""
  },
  {
    "Name": "Saargummi Construction",
    "WebSite": "https://construction.saargummi.com/",
    "Profile": "https://construction.saargummi.com/uploads/domain/logo/4/SGC_Logo_sg_construction_rgb-1.png",
    "ProductCats": "Facade Cladding,Roof Panels"
  },
  {
    "Name": "RoomStone",
    "WebSite": "http://www.roomstone.de/de",
    "Profile": "http://www.roomstone.de/images/Layout/1.gif",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Rauriser Naturstein",
    "WebSite": "https://www.rauriser.at/",
    "Profile": "https://www.rauriser.at/wp-content/uploads/logo-200x200.png",
    "ProductCats": "Natural Stone,Floorings,Swimming Pools"
  },
  {
    "Name": "Kanfanar Limestone",
    "WebSite": "https://nhg-naturstein.de/",
    "Profile": "https://nhg-naturstein.de/wp-content/uploads/2015/10/logo350x63.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "NGR-Natursteine",
    "WebSite": "https://www.ngr-natursteine.de/",
    "Profile": "https://www.ngr-natursteine.de/skin/frontend/ngr2016/default/images/logo.png",
    "ProductCats": "Floorings,Natural Stone"
  },
  {
    "Name": "Milan",
    "WebSite": "https://www.milan-smarthome.de/",
    "Profile": "https://www.milan-smarthome.de/images/ludwigbauerlogo.svg?crc=388953029",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Lux Elements",
    "WebSite": "https://www.luxelements.com/",
    "Profile": "https://www.luxelements.com/grafiken/gestaltung/logo-lux-elements.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Lightnet",
    "WebSite": "http://www.lightnet-group.com/de",
    "Profile": "http://www.lightnet-group.com/assets/images/logo-lightnet.svg",
    "ProductCats": "Spot Lights"
  },
  {
    "Name": "Koch Membranen",
    "WebSite": "http://www.kochmembranen.de/",
    "Profile": "http://www.kochmembranen.de/typo3conf/ext/koch_templates/Resources/Public/images/icons/logo_kochMembranen.svg",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "IMI-Beton",
    "WebSite": "https://www.imi-beton.com/",
    "Profile": "https://www.imi-beton.com/images/imi-surface-design-logo.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Hart Keramik",
    "WebSite": "https://hart-keramik.de/",
    "Profile": "https://hart-keramik.de/wp-content/uploads/2018/05/Logo-Hart-Keramik-aktuell.png",
    "ProductCats": ""
  },
  {
    "Name": "Frovin",
    "WebSite": "https://frovin.de/",
    "Profile": "https://frovin.de/wp-content/themes/stockholm/img/logo_black.png",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Drum",
    "WebSite": "https://www.drum-systeme.de/",
    "Profile": "https://www.drum-systeme.de/wp-content/uploads/2015/04/logo_header_01.png",
    "ProductCats": ""
  },
  {
    "Name": "Designconcrete",
    "WebSite": "http://www.design-concrete.de/",
    "Profile": "http://p418569.mittwaldserver.info/wp-content/uploads/2014/06/logo_bsp.png",
    "ProductCats": ""
  },
  {
    "Name": "Bruck",
    "WebSite": "http://www.bruck.de/",
    "Profile": "http://www.bruck.de/fileadmin/images/logo.jpg",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Binder Technologie",
    "WebSite": "https://www.bindertechnologie.de/",
    "Profile": "https://www.bindertechnologie.de/wp-content/uploads/2016/05/binder-logo-hi.gif",
    "ProductCats": ""
  },
  {
    "Name": "Arturo Unique Flooring",
    "WebSite": "http://www.arturoflooring.de/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/14713754_204804749954640_3379942685168074785_n.jpg?_nc_cat=110&_nc_ht=scontent.fhyd3-1.fna&oh=4abb9faf46e019b4923a659ffc3c4691&oe=5C66777B",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Mascot Group",
    "WebSite": "http://www.mascotgroup.cc/",
    "Profile": "http://mascotlimo.com/content/webdesign/images/webdesign.png",
    "ProductCats": "Lamps,Suspended Ceilings"
  },
  {
    "Name": "Canny",
    "WebSite": "https://www.canny.com.au/",
    "Profile": "https://www.canny.com.au/wp-content/uploads/2015/03/CannyBrandMark2.png",
    "ProductCats": "Modular Kitchens"
  },
  {
    "Name": "Mark Plant Kitchens",
    "WebSite": "http://www.markplant.co.uk/",
    "Profile": "http://www.markplant.co.uk/wp-content/uploads/2017/08/mplogo.png",
    "ProductCats": "Modular Kitchens"
  },
  {
    "Name": "Garde Hvalsoe",
    "WebSite": "https://www.gardehvalsoe.dk/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/18556342_1529395013759829_3990024660617342488_n.png?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=d05a90d494229d1d1656055e3bf2ed75&oe=5C7E2EA1",
    "ProductCats": "Modular Kitchens"
  },
  {
    "Name": "Hebei Sinostar Trading",
    "WebSite": "http://www.hbsinostar.com/",
    "Profile": "http://www.hbsinostar.com/img/huaxinger_03.jpg",
    "ProductCats": "Pipes And Fittings,Roof Panels"
  },
  {
    "Name": "Warli",
    "WebSite": "https://www.warli.it/",
    "Profile": "https://static.wixstatic.com/media/40e647_b32bca31adaa483dbd74a2e86b79f29a~mv2.png/v1/fill/w_80,h_81,al_c,q_80,usm_0.66_1.00_0.01/40e647_b32bca31adaa483dbd74a2e86b79f29a~mv2.webp",
    "ProductCats": "Carpets"
  },
  {
    "Name": "Vighi Security Doors",
    "WebSite": "https://www.vighidoors.it/en/index.php",
    "Profile": "https://www.vighidoors.it/images/vighi_security_doors.png",
    "ProductCats": "Doors"
  },
  {
    "Name": "Vetraria Imagna",
    "WebSite": "http://www.vetrariaimagna.it/",
    "Profile": "http://www.vetrariaimagna.it/wp-content/uploads/2014/05/logo-vetraria-imagna2.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Tensoforma",
    "WebSite": "https://www.tensoformasrl.com/",
    "Profile": "https://static1.squarespace.com/static/5875053503596e9f7ad34223/t/5bb4ea3ae2c483423e3d2afa/1539545765214/?format=1500w",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Stylgraph",
    "WebSite": "http://www.stylgraph.com/en/",
    "Profile": "http://www.stylgraph.com/wp/wp-content/uploads/2016/09/stylgraph-1.png",
    "ProductCats": ""
  },
  {
    "Name": "Scarabeo",
    "WebSite": "https://www.scarabeosrl.com/",
    "Profile": "https://www.scarabeosrl.com/public/theme/logoscarabeon2.png",
    "ProductCats": "Washbasin Faucets"
  },
  {
    "Name": "Pytón",
    "WebSite": "https://pyton.com/en",
    "Profile": "https://pyton.com/sites/default/files/pyton-1939.png",
    "ProductCats": ""
  },
  {
    "Name": "Parklex",
    "WebSite": "https://www.parklex.com/",
    "Profile": "https://www.parklex.com/wp-content/themes/parklex/img/parklex.svg",
    "ProductCats": "Facade Cladding,Suspended Ceilings"
  },
  {
    "Name": "Metal Glass Bonomi",
    "WebSite": "http://www.metalglasbonomi.com/",
    "Profile": "http://www.metalglasbonomi.com/images/metalglas/logo_metalglas.png",
    "ProductCats": "Door Handles,Locks,Hinges"
  },
  {
    "Name": "Lighting Accents",
    "WebSite": "http://lightingaccents.com/",
    "Profile": "http://lightingaccents.com/wp-content/uploads/2018/10/LA_Logo.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Krono System",
    "WebSite": "http://www.eurocomponenti.com/?_=_",
    "Profile": "https://tcdn.storeden.com/gallery/5a7d7a21ffe48e965dd47482/",
    "ProductCats": "Plywoods"
  },
  {
    "Name": "Glasfabrik Lamberts",
    "WebSite": "https://www.lamberts.info/en/",
    "Profile": "https://archello.s3.eu-central-1.amazonaws.com/images/2018/01/17/logo-1-63.1516171911.9686.jpg",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Hofer Group",
    "WebSite": "http://www.hofergroup.com/",
    "Profile": "http://www.hofergroup.com/wp-content/uploads/2018/10/HOFER.png",
    "ProductCats": ""
  },
  {
    "Name": "Glassfer",
    "WebSite": "https://www.glassfer.com/",
    "Profile": "https://www.glassfer.com/wp-content/uploads/2016/03/Logo_800_translucid.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Fonolab",
    "WebSite": "https://www.fonolab.it/",
    "Profile": "https://static.wixstatic.com/media/adf89a_b114a7af37a449af89c75d1806316114~mv2.png/v1/fill/w_122,h_86,al_c,q_80,usm_0.66_1.00_0.01/adf89a_b114a7af37a449af89c75d1806316114~mv2.webp",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Eurotherm",
    "WebSite": "https://www.eurotherm.info/it/",
    "Profile": "https://www.eurotherm.info/img/logo_eurotherm.png",
    "ProductCats": "Radiators"
  },
  {
    "Name": "DressWall",
    "WebSite": "http://www.dresswall.com/",
    "Profile": "http://www.dresswall.com/images/dresswall_logo.png",
    "ProductCats": "Outdoor Lights"
  },
  {
    "Name": "M3 Glass Technologies",
    "WebSite": "https://www.m3glass.com/",
    "Profile": "https://www.m3glass.com/wp-content/themes/m3glass-default/img/m3-logo.svg",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Dierre",
    "WebSite": "http://www.dierre.com/",
    "Profile": "http://www.dierre.com/templates/dierre2/images/dark/logo.png",
    "ProductCats": "Doors"
  },
  {
    "Name": "Dakota",
    "WebSite": "http://www.dakota.eu/en/index.php",
    "Profile": "https://www.dakota.eu/common/img/logo-dakota.png",
    "ProductCats": "Roof Shingles"
  },
  {
    "Name": "ClicHome",
    "WebSite": "http://www.clichome.it/index.php",
    "Profile": "http://www.clichome.it/logo-domotica-clichome.jpg",
    "ProductCats": "Home Automation Systems"
  },
  {
    "Name": "Celenit",
    "WebSite": "https://www.celenit.com/",
    "Profile": "https://www.celenit.com/Images/logo-celenit-31.png",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "British Fires",
    "WebSite": "http://www.britishfires.it/",
    "Profile": "http://www.britishfires.it/images/logo.png",
    "ProductCats": "Fireplaces"
  },
  {
    "Name": "Apostoli Daniele",
    "WebSite": "https://www.apostoli.it/",
    "Profile": "https://media.licdn.com/dms/image/C4D0BAQF22U5PEdhJUw/company-logo_200_200/0?e=2159024400&v=beta&t=9ZmTYC8x07yV_QpxC74xCBI2C37hfXiU5tgoKN0RjbM",
    "ProductCats": "Door Hinges"
  },
  {
    "Name": "Hunan Standard Steel",
    "WebSite": "https://www.hu-steel.com/",
    "Profile": "https://www.hu-steel.com/images/logo.png",
    "ProductCats": "Pipes And Fittings"
  },
  {
    "Name": "Douglas & Bec",
    "WebSite": "http://www.douglasandbec.com/",
    "Profile": "http://www.douglasandbec.com/assets/spree/frontend/logo-6f6841c3c769551efed96f0320cc010ec61613bc5c332ed12fc08ef8436d0ea1.svg",
    "ProductCats": "Ottomans,Lamps"
  },
  {
    "Name": "Nu-Wall",
    "WebSite": "http://www.nuwall.co.nz/",
    "Profile": "http://www.nuwall.co.nz/assets/logo/logo.svg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Euroceramics",
    "WebSite": "http://eurovitrified.com/index.html",
    "Profile": "http://futurescreation.com/wp-content/uploads/2017/08/euroceramics-1-600x400.jpg",
    "ProductCats": "Wall Tiles"
  },
  {
    "Name": "Pro Display",
    "WebSite": "http://prodisplay.com/",
    "Profile": "http://prodisplay.com/wp-content/themes/pro-display/library/images/pro-display-logo.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Intelligent Glass",
    "WebSite": "http://intelligentglass.net/",
    "Profile": "http://intelligentglass.net/wp-content/uploads/rsz_2ig1_1.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Steiner Schreinerei",
    "WebSite": "https://www.steiner-erlen.ch/info/kontakt.html",
    "Profile": "https://www.steiner-erlen.ch/files/logo_2.png",
    "ProductCats": "Modular Kitchens"
  },
  {
    "Name": "Huber Fenster",
    "WebSite": "https://www.huberfenster.ch/",
    "Profile": "https://i.ytimg.com/vi/snCZeep302w/maxresdefault.jpg",
    "ProductCats": "Doors"
  },
  {
    "Name": "Generelli Rivera",
    "WebSite": "http://www.generelli.ch/#/",
    "Profile": "http://www.generelli.ch/img/icons/Logo%20Generelli.svg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Elton Group",
    "WebSite": "http://eltongroup.com/",
    "Profile": "https://www.front.design/wp-content/uploads/2018/06/ELG-logo-FA-black_1-1.jpg",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Maximum Australia",
    "WebSite": "https://maximumaustralia.com/",
    "Profile": "https://maximumaustralia.com/-/img/Maximum-logo.svg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Alternative Surface",
    "WebSite": "https://www.alternativesurfaces.com.au/",
    "Profile": "https://static1.squarespace.com/static/58409c22e4fcb55d6d326f38/t/58ae488e2e69cf7b365c793f/1487816848310/logo2.png?format=1500w",
    "ProductCats": "Carpets"
  },
  {
    "Name": "George Fethers",
    "WebSite": "https://gfethers.com.au/",
    "Profile": "https://gfethers.com.au/wp-content/themes/gfethers/images/logo-george-fethers.svg",
    "ProductCats": "Floorings"
  },


  {
    "Name": "Polycure",
    "WebSite": "https://polycure.com.au/",
    "Profile": "https://polycure.com.au/wp-content/themes/mirotone/images/logo.png",
    "ProductCats": "Wood Coatings"
  },
  {
    "Name": "Glavcom",
    "WebSite": "http://www.glavcom.com.au/",
    "Profile": "http://www.glavcom.com.au/wp-content/uploads/2014/02/glavcom_logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Savage Design",
    "WebSite": "https://savagedesign.com.au/",
    "Profile": "https://savagedesign.com.au/wp-content/uploads/2017/01/logo.png",
    "ProductCats": "Dining Chairs,Coffee Tables,Side Tables"
  },
  {
    "Name": "Precision Flooring",
    "WebSite": "http://www.precisionflooringtruckee.com/index.html",
    "Profile": "http://www.precisionflooringtruckee.com/img/precision_flooring_logo.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Surface Gallery",
    "WebSite": "http://surfacegallery.com.au/",
    "Profile": "http://surfacegallery.com.au/sites/surfacegallery/assets/img/surface-logo.png",
    "ProductCats": "Wall Tiles"
  },
  {
    "Name": "Michelangelo Marmores",
    "WebSite": "http://www.michelangelo.com.br/",
    "Profile": "http://www.michelangelo.com.br/wp-content/themes/Michelangelo/images/michelangelobrasil_preto.svg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "E-Light",
    "WebSite": "http://www.elights.com/",
    "Profile": "https://lib.store.yahoo.net/lib/elights/logo.jpg",
    "ProductCats": "Outdoor Lights"
  },
  {
    "Name": "Lightbasic",
    "WebSite": "http://lightbasic.com.sg/",
    "Profile": "http://lightbasic.com.sg/wp-content/uploads/2014/08/logo-lightbasic.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Cosa Bonita",
    "WebSite": "https://www.cosabonita.com/",
    "Profile": "https://d26lpennugtm8s.cloudfront.net/stores/023/146/themes/common/logo-826743462-1462895421-25a43e18b537dbe996bbf6aa5c636cba1513264878-480-0.png?0",
    "ProductCats": "Outdoor Cushions"
  },
  {
    "Name": "Gunnar Karlsen Sverige",
    "WebSite": "https://www.gk.se/",
    "Profile": "https://www.gk.se/static/dist/images/gk_logo_sv_2017.c3c16a994335.png",
    "ProductCats": "Ventilations"
  },
  {
    "Name": "ASC Pawel Filipek",
    "WebSite": "http://www.ascpf.pl/#home",
    "Profile": "http://www.ascpf.pl/images/logo.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Max Kasymov",
    "WebSite": "http://www.maxkasymov.com/",
    "Profile": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYtUvqhfyTWucHMiAGEDM5N5vIli40Rox50jmVfzgpdlUP3wgT",
    "ProductCats": "Single Beds,Modular Kitchens,Mirrors"
  },
  {
    "Name": "Simplehuman",
    "WebSite": "https://www.simplehuman.com/",
    "Profile": "https://www.simplehuman.com/media/logo/default/logo_1.svg",
    "ProductCats": "Mirrors"
  },
  {
    "Name": "Hybrid Window Systems",
    "WebSite": "https://www.hybridwindowsystems.com/",
    "Profile": "https://www.hybridwindowsystems.com/wp-content/uploads/2017/08/3574647_Hybrid-Window-Systems-Logo_FInal_CMYK-copy.png",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Sussex Taps",
    "WebSite": "https://sussextaps.com.au/img/logo-header-logotype.png",
    "Profile": "https://sussextaps.com.au/img/logo-header-logotype.png",
    "ProductCats": "Washbasin Faucets"
  },
  {
    "Name": "Meizai",
    "WebSite": "https://meizai.com.au/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/11046220_698489176929050_4738856990523359186_n.jpg?_nc_cat=103&_nc_ht=scontent.fhyd3-1.fna&oh=6d2128545b278bb49b956ec83964e12f&oe=5C8490B8",
    "ProductCats": "Sectional,Wardrobes"
  },
  {
    "Name": "HK Living",
    "WebSite": "https://hkliving.nl/",
    "Profile": "https://hkliving.nl/Media/HK_logo_black.png",
    "ProductCats": "Cushions,Rugs"
  },
  {
    "Name": "Tongue & Groove",
    "WebSite": "https://tongueandgroove.com.au/",
    "Profile": "https://cdn.shopify.com/s/files/1/1032/0905/t/2/assets/logo.png?319788284700868181",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "CDK Stone",
    "WebSite": "https://www.cdkstone.com.au/",
    "Profile": "https://www.cdkstone.com.au/wp-content/uploads/2018/01/CDK-logo.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Cedar and Moss",
    "WebSite": "https://cedarandmoss.com/",
    "Profile": "https://cdn.shopify.com/s/files/1/0011/2030/5203/files/CM_horizontal_blk_r_700x.png?v=1531343771",
    "ProductCats": "Chandelier Lights"
  },
  {
    "Name": "JR Furniture",
    "WebSite": "https://jrfurnitureus.com/",
    "Profile": "https://jrfurnitureus.com/wp-content/themes/jrfurniture2018/images/jrlogo.png",
    "ProductCats": "Dining Chairs,Dining Tables,Sectional"
  },
  {
    "Name": "Tiento Tiles",
    "WebSite": "http://tiento.com.au/",
    "Profile": "http://tiento.com.au/wp-content/uploads/2016/12/logo-01.svg",
    "ProductCats": "Wall Tiles"
  },
  {
    "Name": "Unique Fabrics",
    "WebSite": "http://www.uniquefabrics.com/",
    "Profile": "http://www.uniquefabrics.com/logo.png",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "Sydney Joinery",
    "WebSite": "https://sydneyjoinery.squarespace.com/",
    "Profile": "https://static1.squarespace.com/static/598bacfdff7c5020a892cab0/t/598bd5771e5b6cff4927b54c/1523831266081/?format=1500w",
    "ProductCats": "Modular Kitchens"
  },
  {
    "Name": "XS Platforms",
    "WebSite": "https://www.xsplatforms.com/",
    "Profile": "https://www.xsplatforms.com/wp-content/uploads/2015/11/logo-xsplatforms.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Oscar acoustics",
    "WebSite": "https://www.oscar-acoustics.co.uk/index.asp",
    "Profile": "https://www.oscar-acoustics.co.uk/assets/images/oscar-acoustics-logo-mono.png?cb=050718",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Edmont",
    "WebSite": "http://www.edmont.co.uk/",
    "Profile": "http://www.edmont.co.uk/wp-content/uploads/2015/10/edmont-logo-header.gif",
    "ProductCats": ""
  },
  {
    "Name": "Fibrobeton & GRC",
    "WebSite": "https://grca.org.uk/grca-members/fibrobeton.php",
    "Profile": "https://grca.org.uk/images/GRCA-banner-4.jpg",
    "ProductCats": ""
  },
  {
    "Name": "NES Solutions",
    "WebSite": "http://www.nes-solutions.co.uk/",
    "Profile": "http://www.nes-solutions.co.uk/sites/all/themes/grid/images/logo-plain.png",
    "ProductCats": "Windows"
  },
  {
    "Name": "Mogens Rasmussen",
    "WebSite": "http://www.mras.dk/",
    "Profile": "http://www.mras.dk/Files/System/2006/menulogo.gif",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Kwikset",
    "WebSite": "https://www.kwikset.com/",
    "Profile": "https://www.kwikset.com/images/kwikset.png",
    "ProductCats": "Door Accessories"
  },
  {
    "Name": "Delta Faucet",
    "WebSite": "https://www.deltafaucet.co.in/",
    "Profile": "https://www.deltafaucet.co.in/Content/files/home-page/DeltaLogo_RGB_black_tagFORNAVFINAL.png",
    "ProductCats": "Kitchen Faucets"
  },
  {
    "Name": "WIS London",
    "WebSite": "https://wis.london/",
    "Profile": "https://wis.london/wp-content/uploads/2017/02/wis-home-label2.png",
    "ProductCats": "Wardrobes"
  },
  {
    "Name": "Dekton",
    "WebSite": "https://www.dekton.com/usa/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/1544307_565669643614562_1366212652552393315_n.jpg?_nc_cat=1&_nc_ht=scontent.fhyd3-1.fna&oh=075dbcb34f73ede19588441aacf1dbac&oe=5CB102FD",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Pietralite srl",
    "WebSite": "https://www.pietraelite.it/it",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/19424327_1853522581330764_1129015926420199139_n.jpg?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=0914d6b96ff104218dd8a188e6cc24fc&oe=5C87CFEA",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Doorsan",
    "WebSite": "https://www.doorsan.co.uk/",
    "Profile": "https://www.doorsan.co.uk/skin/frontend/doorsan/default/images/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Americlock",
    "WebSite": "https://www.americlock.com/",
    "Profile": "https://www.americlock.com/wp-content/themes/americlock/images/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Portella",
    "WebSite": "https://portella.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/19247996_441777156179558_3719726368696090215_n.png?_nc_cat=110&_nc_ht=scontent.fhyd3-1.fna&oh=b558ea9babe29e72d24680ca484eb620&oe=5C805D91",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Architectural Precast Structures",
    "WebSite": "http://www.apsprecast.com/index.php",
    "Profile": "http://www.apsprecast.com/img/blank.gif",
    "ProductCats": ""
  },
  {
    "Name": "Fisher Paykel",
    "WebSite": "https://www.fisherpaykel.com/in/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/19366219_819652084859700_2348558149246605771_n.png?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=bcc589674ce936a6dabb3c2cefdc629b&oe=5C64CE6E",
    "ProductCats": "Cooking Ranges,Ovens"
  },
  {
    "Name": "Pental",
    "WebSite": "http://www.pentalonline.com/",
    "Profile": "http://www.pentalonline.com/images/logo.svg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Migaloo Home",
    "WebSite": "http://migaloohome.com/en/",
    "Profile": "http://migaloohome.com/wp-content/uploads/2017/03/migalo-logo-poziom.jpg",
    "ProductCats": "Roof Panels"
  },
  {
    "Name": "Century Office",
    "WebSite": "https://www.century-office.co.uk/",
    "Profile": "https://www.century-office.co.uk/Portals/0/century-office-logo.png?ver=2017-11-17-130520-000",
    "ProductCats": "Office Chairs"
  },
  {
    "Name": "Quench Home bars",
    "WebSite": "http://www.quenchhomebars.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c50.50.628.628/s200x200/10093_578243305532813_1776580301_n.png?_nc_cat=107&_nc_ht=scontent.fhyd3-1.fna&oh=f38d96fcad2fb95da9d08dadc076b63a&oe=5C869A66",
    "ProductCats": "Bar Counters"
  },
  {
    "Name": "Ameraguard",
    "WebSite": "http://ameraguard.com/about.php",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c52.0.200.200/p200x200/11988416_1656304591325303_6920970654699917846_n.png?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=0925a3c7d01c906722630cbeaa5df42f&oe=5C7D96F1",
    "ProductCats": ""
  },
  {
    "Name": "U-kon Systems",
    "WebSite": "https://www.u-kon.ca/",
    "Profile": "https://static.wixstatic.com/media/f20383_5815a52815b24803bee9852872329d45~mv2.png/v1/fill/w_265,h_34,al_c,q_80,usm_0.66_1.00_0.01/f20383_5815a52815b24803bee9852872329d45~mv2.webp",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "StoneWrap",
    "WebSite": "https://www.stonewrap.com/en/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c42.0.200.200/p200x200/13335988_1025935117513915_6211518757803376435_n.jpg?_nc_cat=101&_nc_ht=scontent.fhyd3-1.fna&oh=cde9cc5edd33b9f83551092daf62652a&oe=5C6369F1",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Sonled",
    "WebSite": "http://www.sonled.com/",
    "Profile": "http://www.sonled.com/wp-content/themes/sonled/assets/images/sonled-logo.jpg",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Novawood",
    "WebSite": "http://www.novawood.com/",
    "Profile": "http://www.novawood.com/wp-content/uploads/2017/02/Logo.png",
    "ProductCats": "Facade Cladding,Floorings"
  },
  {
    "Name": "Namat Group",
    "WebSite": "http://www.namatgrup.com/img/logo.png",
    "Profile": "http://www.namatgrup.com/img/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Kotil",
    "WebSite": "http://www.kotil.com/",
    "Profile": "http://www.kotil.com//wp-content/uploads/2017/12/Kotil-Trans.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "FYT",
    "WebSite": "https://www.fyt.com.tr/",
    "Profile": "https://www.fyt.com.tr/assets/images/logo-en.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "DUE Furniture",
    "WebSite": "http://design-due.com/index.php",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/20139939_314580325666126_7748890596053210225_n.png?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=0f34683d58ca8359f04e92781031d897&oe=5C6D476A",
    "ProductCats": "Arm Chairs,Side Tables"
  },
  {
    "Name": "Giacometti Impresa di pittura",
    "WebSite": "https://www.giacometti-vicosoprano.ch/it/",
    "Profile": "https://www.giacometti-vicosoprano.ch/images/logo/logo_giacometti_it.png",
    "ProductCats": ""
  },
  {
    "Name": "Giovanoli + Willy",
    "WebSite": "http://www.giovanoliwilly.ch/index.php",
    "Profile": "http://www.giovanoliwilly.ch/templates/orange/images/fond_degrade.png",
    "ProductCats": ""
  },
  {
    "Name": "Skandinviska Glassystem",
    "WebSite": "http://www.skandglas.se/",
    "Profile": "http://www.skandglas.se/public/images/skandinaviska_glassystem.png",
    "ProductCats": ""
  },
  {
    "Name": "Atlas Holz AG",
    "WebSite": "https://www.atlasholz.ch/en-us/",
    "Profile": "https://www.atlasholz.ch/content/files/images/logo_atlasholz_neg_320x70px.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Alcoa",
    "WebSite": "https://www.alcoa.com/global/en/home.asp",
    "Profile": "https://www.alcoa.com/common/images/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Govaplast",
    "WebSite": "http://www.govaplast.com/",
    "Profile": "http://www.govaplast.com/wp-content/uploads/2016/08/logo_govaplast-slogan-1.svg",
    "ProductCats": "Fences"
  },
  {
    "Name": "Preinco",
    "WebSite": "http://www.preinco.com/index.php/productos/grc/que-es-el-grc/",
    "Profile": "http://www.preinco.com/wp-content/themes/preinco/images/logo.jpg",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Luxologie",
    "WebSite": "https://www.luxologie.com",
    "Profile": "https://static.wixstatic.com/media/837b2a_b4ed9ddf828c7a6b5eba79d33b95022b.jpg/v1/fill/w_338,h_75,al_c,q_80,usm_0.66_1.00_0.01/837b2a_b4ed9ddf828c7a6b5eba79d33b95022b.webp",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "BTM",
    "WebSite": "http://www.btm.co/",
    "Profile": "http://www.btm.co/bundles/atlcommon/btm/img/logo.png",
    "ProductCats": "Roof System"
  },
  {
    "Name": "Berk",
    "WebSite": "http://www.berklaminat.com.tr/",
    "Profile": "http://www.berklaminat.com.tr/image/theme/berk_logo.png",
    "ProductCats": "Laminates"
  },
  {
    "Name": "ASAS",
    "WebSite": "http://www.asastr.com/",
    "Profile": "http://www.asastr.com/sites/1/content/img/logo.svg",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Norm Aufzuge AG Bern",
    "WebSite": "https://www.normaufzuege.ch/",
    "Profile": "https://www.normaufzuege.ch/uploads/737x0_351x0/norm_logo.png",
    "ProductCats": "Elevators & Escalators, Travelators"
  },
  {
    "Name": "H.P. Holzer AG",
    "WebSite": "https://www.holzerkaminbau.ch/",
    "Profile": "https://www.holzerkaminbau.ch/fileadmin/user_upload/headers/headLT.gif",
    "ProductCats": "Fireplaces"
  },
  {
    "Name": "Riba Storen AG",
    "WebSite": "http://www.ribastoren.ch/seiten/startseite/?oid=1799&lang=de",
    "Profile": "http://www.ribastoren.ch/art/ribastoren/logo_100jahr.png",
    "ProductCats": "Shutter Hinge,Blinds"
  },
  {
    "Name": "LedLux",
    "WebSite": "http://www.ledluxexport.com/",
    "Profile": "http://www.ledluxexport.com/local/media/images/logo-simple.png",
    "ProductCats": "Outdoor Spot Lights,Outdoor Lights,Interior Lights"
  },
  {
    "Name": "Dako",
    "WebSite": "https://dako.eu/#",
    "Profile": "https://dako.eu/land/nowy_wybor/images/logo.png",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "EM2C",
    "WebSite": "http://www.em2c.com/",
    "Profile": "https://media.glassdoor.com/sqll/1131049/groupe-em2c-squarelogo-1455794628710.png",
    "ProductCats": ""
  },
  {
    "Name": "Albond",
    "WebSite": "http://www.albond.com.tr/index.html",
    "Profile": "http://www.albond.com.tr/img/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "ALAZ Wood",
    "WebSite": "https://www.technowood.com.tr/",
    "Profile": "http://technowood.com.tr/en/wp-content/uploads/2016/09/technowood-main-negative-no-background.png",
    "ProductCats": "Roof Panels"
  },
  {
    "Name": "Adopen",
    "WebSite": "http://www.ado.com.tr/index.html",
    "Profile": "http://www.ado.com.tr/img/logo_renkli.svg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "5 Stelle SA",
    "WebSite": "http://5stellelugano.ch/",
    "Profile": "http://5stellelugano.ch/images/logo-5-stelle__qualita.png?crc=4289399087",
    "ProductCats": "Chandelier Lights,Interior Lights"
  },
  {
    "Name": "Bordogna",
    "WebSite": "http://www.bordogna.it/home.php",
    "Profile": "https://is3-ssl.mzstatic.com/image/thumb/Purple128/v4/4a/ca/e7/4acae728-1b73-f07f-4339-f8480e410079/source/512x512bb.jpg",
    "ProductCats": ""
  },
  {
    "Name": "Curvotecnica SA",
    "WebSite": "http://www.curvotecnica.ch/",
    "Profile": "http://curvotec.myhostpoint.ch/wp-content/uploads/2015/06/curvotecnica2.png",
    "ProductCats": "Gates"
  },
  {
    "Name": "Matozzo SA",
    "WebSite": "https://www.matozzo.ch/",
    "Profile": "https://static1.squarespace.com/static/5b17cb5f2487fdc4718ed1bc/t/5b17da25f950b7f9ddec78b4/1534749275670/?format=1500w",
    "ProductCats": "Paints"
  },
  {
    "Name": "Metalconstruction",
    "WebSite": "http://metalconstruction.ch/",
    "Profile": "http://metalconstruction.ch/img/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Donada SA",
    "WebSite": "https://www.donada.ch/",
    "Profile": "https://www.donada.ch/uploads/565x0_290x0/e77fd3b1e68d4d1c911677604df57994_medium.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Manutecnica",
    "WebSite": "http://www.manutecnica.ch/",
    "Profile": "http://www.manutecnica.ch/wp-content/uploads/2012/06/logo-manutecnica-light1.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Alias Spa",
    "WebSite": "http://alias.design/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/12507260_1218650958162527_6704457356423243273_n.jpg?_nc_cat=103&_nc_ht=scontent.fhyd3-1.fna&oh=54ea4d65a776a06a13476da7de275544&oe=5C765AF5",
    "ProductCats": "Arm Chairs,Dining Tables"
  },
  {
    "Name": "Noon Home",
    "WebSite": "https://www.noonhome.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/23473161_143189512988606_4421234661020493497_n.png?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=40783f3a8834b69036b50288d3c3ee94&oe=5CB26918",
    "ProductCats": ""
  },
  {
    "Name": "Transdev",
    "WebSite": "https://www.transdev.com/en/",
    "Profile": "https://www.transdev.com/wp-content/themes/transdev/assets/images/logo_blanc.svg",
    "ProductCats": ""
  },
  {
    "Name": "Sap srl",
    "WebSite": "http://www.pompesap.com/en/",
    "Profile": "http://www.pompesap.com/images/logo_big.png",
    "ProductCats": "Pumps and Motors"
  },
  {
    "Name": "Transitec",
    "WebSite": "https://transitec.net/fr/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/42222134_338760306869694_3481258279751909376_n.png?_nc_cat=107&_nc_ht=scontent.fhyd3-1.fna&oh=95f5bb6621be91600265d7895a4b22d0&oe=5CB14113",
    "ProductCats": ""
  },
  {
    "Name": "Kelly Moore",
    "WebSite": "https://www.kellymoore.com/",
    "Profile": "https://www.kellymoore.com/Sitefinity/WebsiteTemplates/Default/App_Themes/Default/Images/logo-kellymoore.png",
    "ProductCats": "Paints"
  },
  {
    "Name": "Plant Architectural Works",
    "WebSite": "http://pawwoodwork.com/",
    "Profile": "http://pawwoodwork.com/wp-content/uploads/2016/06/logo-75h.jpg",
    "ProductCats": ""
  },
  {
    "Name": "ALW",
    "WebSite": "https://www.alwusa.com/",
    "Profile": "https://www.alwusa.com/wp-content/uploads/2018/07/ALW_web_logo.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Modpools",
    "WebSite": "https://modpools.com/",
    "Profile": "https://marketplaceevents.azureedge.net/sitefinity/images/librariesprovider26/exhibitors/7475bd0c-a9a0-6e0a-be1e-ff0000415d3a.jpeg?sfvrsn=f9345086_0",
    "ProductCats": "Swimming Pools"
  },
  {
    "Name": "Celsa",
    "WebSite": "http://www.celsagroup.com/",
    "Profile": "https://www.celsagroup.com/wp-content/uploads/2018/02/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Blumer Lehmann",
    "WebSite": "http://www.blumer-lehmann.ch/en/timber-construction/",
    "Profile": "http://www.blumer-lehmann.ch/typo3conf/ext/blumerlehmann/Resources/Public/Images/headerlogos/holzbau-logo2-en.png",
    "ProductCats": ""
  },
  {
    "Name": "Askeen",
    "WebSite": "https://www.askeen.it/",
    "Profile": "https://www.askeen.it/wp-content/uploads/2017/01/Askeen_weiss.png",
    "ProductCats": "Windows,Facade Cladding"
  },
  {
    "Name": "Cortizo Cor Vision",
    "WebSite": "https://www.cortizo.com/en/paginas/inicio",
    "Profile": "https://www.cortizo.com/recursos/cortizofrontend2017/images/logo.svg",
    "ProductCats": "Windows,Doors"
  },
  {
    "Name": "Adadaz",
    "WebSite": "http://adadaz.com.au/wordpress/",
    "Profile": "http://adadaz.com.au/wordpress/wp-content/uploads/2013/12/copy-adadaz-banner1.jpg",
    "ProductCats": ""
  },
  {
    "Name": "Oleant Lighting",
    "WebSite": "https://www.oleant.com/en/index.php",
    "Profile": "https://www.oleant.com/images/logo-white.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "TILLY",
    "WebSite": "https://www.tilly.at/de",
    "Profile": "https://www.tilly.at/layout/img/page/logo-tilly.png",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Elval Colour",
    "WebSite": "http://www.elval-colour.com/en/home",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/28056043_1436218313172029_7719240820008023320_n.jpg?_nc_cat=106&_nc_ht=scontent.fhyd3-1.fna&oh=08c18cd483884ddf1917a7ff92f0b8b8&oe=5C7CAE3E",
    "ProductCats": "Facade Cladding,Roof System"
  },
  {
    "Name": "Tortec Brandschutztor",
    "WebSite": "https://www.tortec.at/",
    "Profile": "https://www.tortec.at/fileadmin/Templates/Public/img/Tortec_Wortmarke.png",
    "ProductCats": "Gates,Doors"
  },
  {
    "Name": "Vertical Magic Garden",
    "WebSite": "https://www.vertical-magic-garden.com/",
    "Profile": "https://www.vertical-magic-garden.com/wp-content/uploads/2018/03/vmg-logo-w-400-e1519905561962.png",
    "ProductCats": "Outdoor Greenwalls"
  },
  {
    "Name": "Neon-Line",
    "WebSite": "http://www.neonline.at/en/home.html",
    "Profile": "http://www.neonline.at/images/template/neonline_logo.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "ELIN GmbH & Co KG",
    "WebSite": "https://www.elin.com/",
    "Profile": "https://www.elin.com/sites/default/files/elinLogoWeb_140x100.png",
    "ProductCats": ""
  },
  {
    "Name": "Casadei Industria",
    "WebSite": "http://www.casadei-industria.com/",
    "Profile": "https://cdn.worldvectorlogo.com/logos/casadei-1.svg",
    "ProductCats": ""
  },
  {
    "Name": "Aectual",
    "WebSite": "http://www.aectual.com/",
    "Profile": "http://www.aectual.com/wp-content/uploads/2017/10/Screen-Shot-2017-10-06-at-13.11.27.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "DeckWise",
    "WebSite": "https://www.deckwise.eu/img/logo-icon/logo.png",
    "Profile": "https://www.deckwise.eu/img/logo-icon/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Trex",
    "WebSite": "https://www.trex.com/",
    "Profile": "http://www.trex.com/media/3841/trex2013_000934.png",
    "ProductCats": "Railings"
  },
  {
    "Name": "GD Dorigo",
    "WebSite": "https://www.gd-dorigo.com/en/",
    "Profile": "https://www.gd-dorigo.com/wp-content/themes/gd-dorigo/images/logo.svg",
    "ProductCats": "Doors"
  },
  {
    "Name": "SageGlass",
    "WebSite": "https://www.sageglass.com/en",
    "Profile": "https://www.sageglass.com/sites/all/themes/sage/img/logo.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Glas Langle",
    "WebSite": "https://www.langleglas.com/en/",
    "Profile": "https://www.langleglas.com/files/laengle/img/laengleglas-logo.png",
    "ProductCats": "Office Partitions"
  },
  {
    "Name": "Kurzemann",
    "WebSite": "http://www.kurzemann-trockenbau.at/index.php",
    "Profile": "https://mediaat.cylex.de/companies/7201/557/logo/logo.jpg",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Anudal Industrial",
    "WebSite": "http://www.anudal.com/en/",
    "Profile": "http://www.anudal.com/wp-content/uploads/2018/04/anudal_logo-1.png",
    "ProductCats": "Door Handles"
  },
  {
    "Name": "Lindsley",
    "WebSite": "https://www.lindsleylighting.com/",
    "Profile": "https://cdn.shopify.com/s/files/1/0097/9852/t/2/assets/logo.png?2833157157435400121",
    "ProductCats": "Outdoor Lights"
  },
  {
    "Name": "Paul Bratyon",
    "WebSite": "http://www.paulbraytondesigns.com/default.aspx",
    "Profile": "http://www.paulbraytondesigns.com/images/logo.jpg",
    "ProductCats": "Carpets"
  },
  {
    "Name": "Ring",
    "WebSite": "https://ring.com/",
    "Profile": "https://static.ring.com/assets/header/ring-logo-47f4abf064c4269d85f8d30943ce10af.svg.gz",
    "ProductCats": "Cctv System"
  },
  {
    "Name": "Occhio",
    "WebSite": "https://www.occhio.de/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c75.0.200.200/p200x200/10423287_402266103231665_4205730453812917238_n.jpg?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=98d9d852aefa1eeb9bd732bc1486a93b&oe=5C7999A2",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "AS Isolierungen",
    "WebSite": "https://www.isolierung-vorarlberg.at/",
    "Profile": "https://www.isolierung-vorarlberg.at/uploads/Logo1.png",
    "ProductCats": ""
  },
  {
    "Name": "Rimjhim Ispat",
    "WebSite": "http://www.rimjhimispat.com/",
    "Profile": "http://www.rimjhimispat.com/wp-content/uploads/2016/03/logo-rimjhim-ispat.png",
    "ProductCats": ""
  },
  {
    "Name": "Northwestern Design",
    "WebSite": "https://nwdoregon.com/",
    "Profile": "https://nwdoregon.com/wp-content/uploads/nwd-header.png",
    "ProductCats": ""
  },
  {
    "Name": "BPF",
    "WebSite": "http://www.bpf-gmbh.net/",
    "Profile": "http://www.bpf-gmbh.net/images/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Enea",
    "WebSite": "http://www.enea.ch/",
    "Profile": "http://www.enea.ch/wp-content/themes/enea/styles/images/logo-home.png",
    "ProductCats": "Garden Armchairs"
  },
  {
    "Name": "Anudal Industrial",
    "WebSite": "http://www.anudal.com/en/",
    "Profile": "http://www.anudal.com/wp-content/uploads/2018/04/anudal_logo-1.png",
    "ProductCats": "Door Handles"
  },
  {
    "Name": "Dr. Hahn",
    "WebSite": "https://www.dr-hahn.eu/",
    "Profile": "https://www.dr-hahn.eu/fileadmin/templates/img/Logo_Dr%20Hahn_weiss_D.svg",
    "ProductCats": "Doors"
  },
  {
    "Name": "Bracknell Roofing",
    "WebSite": "http://www.bracknellroofing.com/",
    "Profile": "http://www.bracknellroofing.com/media/1017/bracknell_logo.jpg?height=87&width=176",
    "ProductCats": ""
  },
  {
    "Name": "Ricchetti",
    "WebSite": "http://www.ricchetti.it/",
    "Profile": "http://www.ricchetti.it/wp-content/themes/ricchetti/static/images/logo-ricchetti-small.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Made +39",
    "WebSite": "http://made39.com/",
    "Profile": "http://made39.com/wp-content/uploads/2016/05/logo-1.png",
    "ProductCats": ""
  },
  {
    "Name": "4Tech",
    "WebSite": "https://www.fourtech.pl/pl/",
    "Profile": "https://www.fourtech.pl/wp-content/uploads/fourtech-logo.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Styl'inov",
    "WebSite": "http://www.stylinov.com/",
    "Profile": "http://www.stylinov.com/wp-content/uploads/2016/06/stylinov-logo250.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Akripol",
    "WebSite": "https://www.akripol.si/en/",
    "Profile": "https://www.akripol.si/en/themes/simple/css/img/logo_akripol.png",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "NewTechWood",
    "WebSite": "https://newtechwood.com.au/",
    "Profile": "https://newtechwood.com.au/wp-content/uploads/2017/05/Newtechwood-Logo-optimized.jpg",
    "ProductCats": "Fences,Facade Cladding"
  },
  {
    "Name": "3nod",
    "WebSite": "http://www.3nod.com.cn/en/",
    "Profile": "http://www.3nod.com.cn/templates/default/images/en/logo.png",
    "ProductCats": "Home Automation Systems"
  },
  {
    "Name": "SKK",
    "WebSite": "http://skk.com.sg/",
    "Profile": "http://www.skk.com.sg/wp-content/uploads/2014/12/skk_logo.png",
    "ProductCats": "Wood Coatings"
  },
  {
    "Name": "Inovar",
    "WebSite": "http://www.inovarfloor.com/in/",
    "Profile": "http://www.inovarfloor.com/in/images/logo.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "APS componentes Eletricos",
    "WebSite": "http://www.apscomponentes.com.br/",
    "Profile": "http://www.apscomponentes.com.br/wp-content/uploads/2016/05/logo-2.png",
    "ProductCats": "Pumps and Motors"
  },
  {
    "Name": "Stolab",
    "WebSite": "https://www.stolab.se/en/",
    "Profile": "https://www.stolab.se/images/stolab_logo.jpg?width=190",
    "ProductCats": "Dining Chairs,Benches"
  },
  {
    "Name": "Rappgo",
    "WebSite": "https://www.rappgo.se/en/",
    "Profile": "https://www.rappgo.se/wp-content/uploads/2018/01/rappgo-logo-1.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Smei",
    "WebSite": "https://www.smei.org/",
    "Profile": "https://www.smei.org/graphics/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Velletrani Giorgio",
    "WebSite": "http://www.velletranigiorgio.it/it/",
    "Profile": "http://www.velletranigiorgio.it/images/loghi/logo-velletrani.jpg",
    "ProductCats": "Facade Cladding,Doors"
  },
  {
    "Name": "Tensocielo",
    "WebSite": "https://www.tensocielo.com/",
    "Profile": "https://www.tensocielo.com/wp-content/uploads/2014/06/logook.jpg",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Perphorms",
    "WebSite": "http://www.perphorma.it/",
    "Profile": "http://www.perphorma.it/assets_b/images/logo_big.png",
    "ProductCats": "Washbasin Faucets,Diverters"
  },
  {
    "Name": "OLTRE",
    "WebSite": "http://www.oltreinfissi.it/",
    "Profile": "http://www.oltreinfissi.it/wp-content/uploads/2017/08/LOGO-OLTRE-1.png",
    "ProductCats": "Doors"
  },
  {
    "Name": "OLI",
    "WebSite": "http://www.olisrl.it/",
    "Profile": "http://www.olisrl.it/templates/oli/images/layout/logo-oli.png",
    "ProductCats": ""
  },
  {
    "Name": "Besana Moquette",
    "WebSite": "http://www.besanamoquette.com/collezioni/prestige/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/15826812_1199897493392672_4318581307712748221_n.jpg?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=d129a4c4bdf043d9ea08a95de56f5d97&oe=5C6DA522",
    "ProductCats": "Carpets"
  },
  {
    "Name": "Arbloc",
    "WebSite": "https://www.arbloc.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c0.7.200.200/p200x200/182266_368085533302202_203232278_n.jpg?_nc_cat=104&_nc_ht=scontent.fhyd3-1.fna&oh=75f8609a809eb761a16f492b1c9dfa47&oe=5C7AD0A9",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Norbec Architectural",
    "WebSite": "https://norbec.com/",
    "Profile": "https://norbec.com/wp-content/themes/exocore/images/norbec-logo.svg",
    "ProductCats": ""
  },
  {
    "Name": "Alpes Inox",
    "WebSite": "http://www.alpesinox.com/en/",
    "Profile": "http://www.alpesinox.com/wp-content/uploads/2013/06/logo.png",
    "ProductCats": "Sinks,Hobs"
  },
  {
    "Name": "Sapa Building Systems",
    "WebSite": "https://www.sapabuildingsystem.com/de/de/",
    "Profile": "https://media.licdn.com/dms/image/C560BAQEdFrpgk29POw/company-logo_200_200/0?e=2159024400&v=beta&t=PQX0Cob3XWBp9yqJrDJnVVjSebfr_BHolXy-Dpy4x8I",
    "ProductCats": "Doors,Facade Cladding"
  },
  {
    "Name": "Evist",
    "WebSite": "http://www.evistanbul.com/",
    "Profile": "http://www.evistanbul.com/wp-content/uploads/2017/11/evist-logo-v1-4.png",
    "ProductCats": ""
  },
  {
    "Name": "NG Kutahya",
    "WebSite": "https://www.ngkutahyaseramik.com.tr/en",
    "Profile": "https://www.ngkutahyaseramik.com.tr/images/logo.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Seranit",
    "WebSite": "https://www.seranit.com.tr/",
    "Profile": "https://www.seranit.com.tr/images/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Feri Masi",
    "WebSite": "http://feri-masi.com/pt",
    "Profile": "https://media.licdn.com/dms/image/C560BAQGmKiCaFiQZuQ/company-logo_200_200/0?e=2159024400&v=beta&t=i1Qgtyo_6gW11jKkJbCM2slty8_jrWg19YC6SCsdLPI",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Sylvian Willenz",
    "WebSite": "http://www.sylvainwillenz.com/",
    "Profile": "http://www.sylvainwillenz.com/sites/all/themes/sylvainwillenz/assets/css/images/willenzlogo.svg",
    "ProductCats": ""
  },
  {
    "Name": "Soren Rose",
    "WebSite": "https://www.sorenrose.com/",
    "Profile": "https://static1.squarespace.com/static/5a8322732278e70dcb2aca26/t/5afc5630758d463ef1b5e65b/1541675807009/?format=1500w",
    "ProductCats": "Lamps,Bar Stools"
  },
  {
    "Name": "Karmen",
    "WebSite": "https://www.karmanitalia.it/en/",
    "Profile": "https://www.karmanitalia.it/public/uploads/2016/03/karman-light.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Neon Creations",
    "WebSite": "https://www.neoncreations.co.uk/",
    "Profile": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSk_htzmM3FVn_6UlVTWyssoU9X6QHl8KVkZvEpEjh1DjstI1boxQ",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Vidres Viola",
    "WebSite": "http://www.vidresviola.com/",
    "Profile": "https://reskytnew.s3.amazonaws.com/4226/vidres-viola-logoweb-107816-160223164335.png",
    "ProductCats": "Laminates"
  },
  {
    "Name": "Assa Abloy",
    "WebSite": "https://www.assaabloy.de/de/local/de/",
    "Profile": "https://www.assaabloy.de/Upload/Assa-Abloy-logo.png",
    "ProductCats": "Access Control Systems"
  },
  {
    "Name": "X-LAM",
    "WebSite": "https://www.xlam.co.nz/",
    "Profile": "https://www.xlam.co.nz/assets/Xlam-logo.svg",
    "ProductCats": ""
  },
  {
    "Name": "White Joinery",
    "WebSite": "http://www.whitejoinery.co.uk/",
    "Profile": "http://www.whitejoinery.co.uk/images/logo.jpg",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Lambs Bricks",
    "WebSite": "http://www.lambsbricks.com/",
    "Profile": "http://www.lambsbricks.com/img/lambs-bricks-stone-logo-2.jpg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Buckland Timber",
    "WebSite": "http://www.bucklandtimber.co.uk/",
    "Profile": "https://pbs.twimg.com/profile_images/580312669485473792/RQwEEv_e_400x400.png",
    "ProductCats": "Chimneys"
  },
  {
    "Name": "DWL Windows",
    "WebSite": "http://dwlwindows.co.uk/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/10924715_652089918234079_6500829698340429671_n.png?_nc_cat=104&_nc_ht=scontent.fhyd3-1.fna&oh=c5c77b77d45453a3a294df96679b6702&oe=5CB18FB3",
    "ProductCats": "Doors"
  },
  {
    "Name": "Panoramics",
    "WebSite": "http://www.panoramics.co.uk/",
    "Profile": "http://www.panoramics.co.uk/wp-content/uploads/2015/04/panoramics-flooring.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Debrah Furniture",
    "WebSite": "http://www.debrahfurniture.com/",
    "Profile": "http://www.debrahfurniture.com/wp-content/uploads/2016/10/logo_def.png",
    "ProductCats": "Benches,Coffee Tables"
  },
  {
    "Name": "12th Avenue Iron",
    "WebSite": "https://www.12thavenueiron.com/",
    "Profile": "https://cdn.shopify.com/s/files/1/0268/6223/t/14/assets/logo.png?16442527826341022453",
    "ProductCats": "Railings"
  },
  {
    "Name": "Pental Quartz",
    "WebSite": "http://pentalquartz.com/",
    "Profile": "http://pentalquartz.com/wp-content/uploads/2015/08/logo-400x70.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "DEOS",
    "WebSite": "http://www.deos.cz/index.php?lang=en",
    "Profile": "http://www.deos.cz/images/_logodeos1.gif",
    "ProductCats": "Outdoor Pendant Lamps,Ceiling Lamps"
  },
  {
    "Name": "Schock-Wittek s.r.o.",
    "WebSite": "https://www.schoeck-wittek.cz/cs/home",
    "Profile": "https://www.schoeck-wittek.cz/images/lang/cs/logo.svg",
    "ProductCats": ""
  },
  {
    "Name": "Stavad s.r.o.",
    "WebSite": "http://stavebninystavad.sk/",
    "Profile": "http://stavebninystavad.sk/design/logo.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Nabytek Mrazek",
    "WebSite": "https://www.nabytekmrazek.cz/",
    "Profile": "https://www.nabytekmrazek.cz/wp-content/uploads/2018/02/logo-300x40.png",
    "ProductCats": "Laminates"
  },
  {
    "Name": "Cupa Stone",
    "WebSite": "https://cupastone.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/11081267_410712189100337_4738670172860373514_n.jpg?_nc_cat=100&_nc_ht=scontent.fhyd3-1.fna&oh=d6a485aaf7deb4079e76556eb23bb788&oe=5C6960D7",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Manolobagni",
    "WebSite": "https://www.manolobagni.com/",
    "Profile": "https://www.manolobagni.com/wp-content/uploads/2018/01/LOGO-PRINCIPALE-senza-ombreggiatura.png",
    "ProductCats": ""
  },
  {
    "Name": "Rossibianchi Lighting Design",
    "WebSite": "https://www.rossibianchi.com/RBld/wp-content/uploads/2017/10/ROSSI-BIANCHI.png",
    "Profile": "https://www.rossibianchi.com/RBld/wp-content/uploads/2017/10/ROSSI-BIANCHI.png",
    "ProductCats": ""
  },
  {
    "Name": "Roost",
    "WebSite": "https://www.roostco.com/",
    "Profile": "https://i.ytimg.com/vi/_wwTzucFqas/maxresdefault.jpg",
    "ProductCats": ""
  },
  {
    "Name": "Black Sheep Unique",
    "WebSite": "https://www.blacksheepunique.com/",
    "Profile": "https://static.wixstatic.com/media/381951_ec255762bd094449a7532ce8ac6600b0~mv2.png/v1/fill/w_385,h_30,al_c,q_80,usm_0.66_1.00_0.01/381951_ec255762bd094449a7532ce8ac6600b0~mv2.webp",
    "ProductCats": "Rugs"
  },
  {
    "Name": "Peps",
    "WebSite": "http://www.pepsindia.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/46159200_1954839554608702_1650184077879279616_n.jpg?_nc_cat=106&_nc_ht=scontent.fhyd3-1.fna&oh=503393c6b0854cbd035194fb5a781297&oe=5CB1181F",
    "ProductCats": "Mattresses"
  },
  {
    "Name": "Greenply",
    "WebSite": "http://www.greenply.com/",
    "Profile": "http://www.greenply.com/templates/ww_beta/images/logo.jpg",
    "ProductCats": "Plywoods"
  },
  {
    "Name": "Northwood Design Partners",
    "WebSite": "https://www.northwooddp.com/",
    "Profile": "https://static1.squarespace.com/static/5829f13a2994ca2c6772976a/t/582a08fdbe6594017ea71e88/1509667895455/?format=1500w",
    "ProductCats": "Sectional"
  },
  {
    "Name": "Proyecto Luz",
    "WebSite": "http://proyectoluziluminacion.es/",
    "Profile": "http://proyectoluziluminacion.es/luz/wp-content/uploads/2014/08/proyecto-luz-iluminacion.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Lucis Wireless Lighting",
    "WebSite": "http://www.lucislamp.com/site/",
    "Profile": "http://www.lucislamp.com/site/wp-content/uploads/2018/11/lucis-3.0-website-icon-1.png",
    "ProductCats": "Lamps"
  },
  {
    "Name": "Velfac Windows",
    "WebSite": "https://velfac.co.uk/",
    "Profile": "https://velfac.co.uk/Assets/Stylesheets/Images/velfac-logo.png",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Assistec",
    "WebSite": "http://www.assistec.co/",
    "Profile": "http://www.assistec.co/templates/fluencyblue/images/logo/Assistec-Logo1.png",
    "ProductCats": ""
  },
  {
    "Name": "Microcimento do Brasil",
    "WebSite": "http://www.microcimentodobrasil.com.br/",
    "Profile": "http://www.microcimentodobrasil.com.br/wp-content/uploads/2015/02/logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Miaki Revestimentos",
    "WebSite": "https://www.miaki.com.br/wp-content/uploads/2018/03/cropped-logo.png",
    "Profile": "https://www.miaki.com.br/wp-content/uploads/2018/03/cropped-logo.png",
    "ProductCats": ""
  },
  {
    "Name": "Cia. de Projetos",
    "WebSite": "http://www.companhiadeprojetos.eng.br/",
    "Profile": "http://www.companhiadeprojetos.eng.br/wp-content/uploads/2015/05/LOGO-CIA_2015_WEB_320.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Canterland",
    "WebSite": "http://www.canterlandmex.com/",
    "Profile": "http://canterlandmex.com/img/logo.jpg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Strahle",
    "WebSite": "https://www.straehle.de/en/",
    "Profile": "https://www.straehle.de/layout/logo.png",
    "ProductCats": "Office Partitions"
  },
  {
    "Name": "Sigl Licht",
    "WebSite": "https://www.sigllicht.de/",
    "Profile": "https://www.sigllicht.de/wp-content/uploads/2016/11/sigllicht-logo.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Lighting Technologies",
    "WebSite": "https://www.ltcompany.com/en/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/p200x200/27072257_2048920648713714_4002131312353506369_n.png?_nc_cat=106&_nc_ht=scontent.fhyd3-1.fna&oh=413c9bd5526411ad064d894a2a117c13&oe=5C824AA5",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Stauner",
    "WebSite": "https://www.stauner-tueren.de/",
    "Profile": "https://www.stauner-tueren.de/wp-content/uploads/2017/09/Stauner.svg",
    "ProductCats": "Doors"
  },
  {
    "Name": "HQuadrat",
    "WebSite": "https://www.hquadrat.net/",
    "Profile": "https://image.jimcdn.com/app/cms/image/transf/dimension=354x10000:format=png/path/sb472f6aa36e84a94/image/i63b1ed52b3407787/version/1486495122/image.png",
    "ProductCats": ""
  },
  {
    "Name": "Halla",
    "WebSite": "https://www.halla.eu/",
    "Profile": "https://www.halla.eu/static/img/logo-halla.svg",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Erfurt",
    "WebSite": "https://www.erfurt.com/de/",
    "Profile": "https://www.erfurt.com/fileadmin/templates/system_images/erfurt_tapeten.png",
    "ProductCats": ""
  },
  {
    "Name": "Everlite",
    "WebSite": "https://www.everlite.de/start/",
    "Profile": "https://www.everlite.de/fileadmin/user_upload/Bilder/Startseite/600x400px_neu-gif.gif",
    "ProductCats": "Outdoor Lights"
  },
  {
    "Name": "Best Wood Schneider",
    "WebSite": "https://www.schneider-holz.com/best-wood-schneider-de.html",
    "Profile": "https://www.schneider-holz.com/fileadmin/templates/logo_top.png",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Bamberger Natursteinwerk",
    "WebSite": "https://www.bamberger-natursteinwerk.de/unternehmen/",
    "Profile": "https://www.bamberger-natursteinwerk.de/fileadmin/natursteinwerk/Resources/Public/Images/bamberger-natursteinwerk-logo.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Inoutic",
    "WebSite": "http://www.inoutic.de/en/",
    "Profile": "http://www.inoutic.de/upload/gestaltung/inoutic_logo_website.png",
    "ProductCats": "Windows,Facade Cladding"
  },
  {
    "Name": "Wooshin",
    "WebSite": "http://www.wooshin.co/index.htm",
    "Profile": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnzalXok6UyVb9YBSF181IFHN0V_JY24caItBHVfSr_55k_3eK",
    "ProductCats": ""
  },
  {
    "Name": "Quinette",
    "WebSite": "http://www.quinette.fr/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-1/c4.0.200.200/p200x200/10420307_1390022711325726_7443770676797953988_n.jpg?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=c42ee8e7b385eadd16be187e0b55ee85&oe=5C81CA96",
    "ProductCats": "Auditorium Seats"
  },
  {
    "Name": "Anji Weiyu",
    "WebSite": "http://www.anjifurniture.com/index/FrontColumns_navigation01-1490421411722FirstColumnId=58.html",
    "Profile": "http://www.anjifurniture.com/imageRepository/e5960a17-3544-4594-ad8a-38e9b4063aa6.jpg",
    "ProductCats": "Bar Stools,Arm Chairs,Lounge Chairs,Dining Chairs,Executive Chairs"
  },
  {
    "Name": "AMQ",
    "WebSite": "https://amqsolutions.com/",
    "Profile": "https://amqsolutions.com/wp-content/themes/AMQ/images/amq-logo-grey.gif",
    "ProductCats": "Office Workstations,Office Desks,Office Storage Units,Filing Cabinets"
  },
  {
    "Name": "American Biltrite",
    "WebSite": "https://www.american-biltrite.com/",
    "Profile": "https://www.american-biltrite.com/skin/frontend/source/default/images/logo-AmericanBiltrite.png",
    "ProductCats": "Floorings,Floor Tiles,Wall Tiles"
  },
  {
    "Name": "Alur",
    "WebSite": "https://www.alurwalls.com/",
    "Profile": "https://www.alurwalls.com/images/alur-logo.svg",
    "ProductCats": "Office Partitions"
  },
  {
    "Name": "Aceray",
    "WebSite": "http://www.aceray.com",
    "Profile": "http://www.aceray.com/images/new_nav_aceray.jpg",
    "ProductCats": "Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Garden Armchairs,Garden Sofas,Hanging Chairs,Garden Chairs"
  },
  {
    "Name": "Nuxx",
    "WebSite": "http://nuxx.pl/",
    "Profile": "http://nuxx.pl/wp-content/uploads/2017/02/cropped-logo-z-napisem-MALE-na-strone.jpg",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Lounge Tables,Side Tables"
  },
  {
    "Name": "Euro Color",
    "WebSite": "https://eurocolor.com.pl/de",
    "Profile": "https://eurocolor.com.pl/data/themes/Violet/images/de/logo.png",
    "ProductCats": "Windows,Doors,Door Systems,Locks"
  },
  {
    "Name": "9to5 Seating",
    "WebSite": "https://9to5seating.com",
    "Profile": "https://9to5seating.com/upload_resources/logo.png",
    "ProductCats": "Office Chairs,Office Desks,Executive Chairs,Visitors Chair"
  },
  {
    "Name": "Anji Weiyu",
    "WebSite": "http://www.anjifurniture.com/index/FrontColumns_navigation01-1490421411722FirstColumnId=58.html",
    "Profile": "http://www.anjifurniture.com/imageRepository/e5960a17-3544-4594-ad8a-38e9b4063aa6.jpg",
    "ProductCats": "Bar Stools,Arm Chairs,Lounge Chairs,Dining Chairs,Executive Chairs"
  },
  {
    "Name": "AMQ",
    "WebSite": "https://amqsolutions.com/",
    "Profile": "https://amqsolutions.com/wp-content/themes/AMQ/images/amq-logo-grey.gif",
    "ProductCats": "Office Workstations,Office Desks,Office Storage Units,Filing Cabinets"
  },
  {
    "Name": "American Biltrite",
    "WebSite": "https://www.american-biltrite.com/",
    "Profile": "https://www.american-biltrite.com/skin/frontend/source/default/images/logo-AmericanBiltrite.png",
    "ProductCats": "Floorings,Floor Tiles,Wall Tiles"
  },
  {
    "Name": "Alur",
    "WebSite": "https://www.alurwalls.com/",
    "Profile": "https://www.alurwalls.com/images/alur-logo.svg",
    "ProductCats": "Office Partitions"
  },
  {
    "Name": "Aceray",
    "WebSite": "http://www.aceray.com",
    "Profile": "http://www.aceray.com/images/new_nav_aceray.jpg",
    "ProductCats": "Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Garden Armchairs,Garden Sofas,Hanging Chairs,Garden Chairs"
  },
  {
    "Name": "Nuxx",
    "WebSite": "http://nuxx.pl/",
    "Profile": "http://nuxx.pl/wp-content/uploads/2017/02/cropped-logo-z-napisem-MALE-na-strone.jpg",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Lounge Tables,Side Tables"
  },
  {
    "Name": "Euro Color",
    "WebSite": "https://eurocolor.com.pl/de",
    "Profile": "https://eurocolor.com.pl/data/themes/Violet/images/de/logo.png",
    "ProductCats": "Windows,Doors,Door Systems,Locks"
  },
  {
    "Name": "9to5 Seating",
    "WebSite": "https://9to5seating.com",
    "Profile": "https://9to5seating.com/upload_resources/logo.png",
    "ProductCats": "Office Chairs,Office Desks,Executive Chairs,Visitors Chair"
  },
  {
    "Name": "Prismatique",
    "WebSite": "http://www.prismatique.com",
    "Profile": "http://www.prismatique.com/Images/logo.png",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Restaurant Tables,Side Tables,Tables For Public Areas,Hotel Desks,Office Desks,Writing Desks,Display Cabinets,Filing Cabinets,Wall Cabinets"
  },
  {
    "Name": "Betonella",
    "WebSite": "https://www.betonella.com/index.php/it/",
    "Profile": "https://betonella.com/images/logo.jpg",
    "ProductCats": "Floor Tiles,Street Benches,Blocks,Bricks,Facade Cladding"
  },
  {
    "Name": "Selvoline",
    "WebSite": "http://www.selvoline.com/en/home.html",
    "Profile": "http://www.selvoline.com/img/logo.png",
    "ProductCats": "Garden Gazebos,Roof System,Street Benches,Bicycle Racks"
  },
  {
    "Name": "Seberg",
    "WebSite": "http://www.seberg.it/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/lfwyn8rqt1mehjurgjok.jpg",
    "ProductCats": "Public Place Signs"
  },
  {
    "Name": "Schake",
    "WebSite": "https://www.schake-gmbh.de/en/home.html",
    "Profile": "https://www.schake-gmbh.de/files/schake-gmbh/images/logos/logo.jpg",
    "ProductCats": "Bollards,Bicycle Racks,Railings"
  },
  {
    "Name": "Plas Eco",
    "WebSite": "https://plaseco.fr/?cn-reloaded=1",
    "Profile": "https://plaseco.fr/wp-content/uploads/2018/05/Logo-PlasEco.png",
    "ProductCats": "Street Benches,Planters,Garden Armchairs"
  },
  {
    "Name": "Park Benches",
    "WebSite": "http://www.parkbenches.co.nz/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/sof3xsdf1twz3bg4uiqv.jpg",
    "ProductCats": "Street Benches,Planters,Garden Armchairs"
  },
  {
    "Name": "Nola",
    "WebSite": "https://nola.se/",
    "Profile": "https://instagram.fhyd3-1.fna.fbcdn.net/vp/6d6284620a7ddf7b4bf51c5778e30ea3/5C742308/t51.2885-19/s150x150/28429974_196458031111339_3016676804124475392_n.jpg",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bicycle Racks"
  },
  {
    "Name": "MM Cite",
    "WebSite": "https://www.mmcite.com/en",
    "Profile": "https://www.mmcite.com/images/header/logo_en.png",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks,Railings,Roof System"
  },
  {
    "Name": "Lazzari",
    "WebSite": "http://www.lazzarisrl.it/en",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/29244695_1788044011251610_911245602824819820_n.png?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=46802640afedffa3929d6f53b1c662e5&oe=5C7BA17F",
    "ProductCats": "Public Place Signs,Bollards"
  },
  {
    "Name": "JCDecaux",
    "WebSite": "https://www.jcdecaux.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/i8crc109tzmah8pc2ugr.jpg",
    "ProductCats": "Public Place Signs,Bollards,Street Clocks,Street Benches,Bicycle Racks"
  },
  {
    "Name": "Ironsmith",
    "WebSite": "http://www.ironsmith.cc/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/j17izqnithkcczcz7rxe.jpg",
    "ProductCats": "Bollards"
  },
  {
    "Name": "Iron Age Designs",
    "WebSite": "https://www.ironagegrates.com/",
    "Profile": "https://82r5s2z5fqi4cc2dmn9tgg1e-wpengine.netdna-ssl.com/wp-content/themes/ironage/img/logo.svg",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks,Railings,Roof System"
  },
  {
    "Name": "Glasdon Group",
    "WebSite": "https://gil.glasdon.com/",
    "Profile": "https://gil.glasdon.com/images/glasdon-r.png",
    "ProductCats": "Bollards"
  },
  {
    "Name": "Finbin",
    "WebSite": "https://www.finbin.fi/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/vtbg59vnmsbqwmhxo3lk.jpg",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bicycle Racks"
  },
  {
    "Name": "Dimcar",
    "WebSite": "https://www.dimcar.it/en/index.aspx",
    "Profile": "https://www.dimcar.it/immagini/logo_dimcar.png",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks,Railings,Roof System"
  },
  {
    "Name": "Concept Urbain",
    "WebSite": "http://www.concept-urbain.fr/index.php?lang=en",
    "Profile": "http://www.concept-urbain.fr/IMG/siteon0.png?1390320814",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks,Railings,Roof System"
  },
  {
    "Name": "CO33",
    "WebSite": "https://www.co33.de/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/p1dupzi4xaooi43ybnpa.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Office Chairs,Office Desks,Executive Chairs,Visitors Chair,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Atech",
    "WebSite": "https://en.atech-sas.com/",
    "Profile": "https://en.atech-sas.com/T_ATECH/image/design/logo-atech.png?2",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks,Railings,Roof System"
  },
  {
    "Name": "Architectural Street Furnishings",
    "WebSite": "http://www.asfco.co.uk/",
    "Profile": "http://www.asfco.co.uk/images/asf_logo.gif",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards"
  },
  {
    "Name": "Anae",
    "WebSite": "http://www.anae.eu/en/anae",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/11742845_443041812487511_4955067465879000017_n.jpg?_nc_cat=100&_nc_ht=scontent.fhyd3-1.fna&oh=fd688baff632becd18ce0fd290a97145&oe=5C3DE305",
    "ProductCats": "Street Benches,Bicycle Racks"
  },
  {
    "Name": "Amop",
    "WebSite": "http://www.grupoamop.com/idx/default,230,2",
    "Profile": "http://www.urban.amop.eu/cms_imgs/addf964d45037e3b4a1c057a44afe3b7d6e5f860.png",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks,Railings,Roof System"
  },
  {
    "Name": "Alucomat",
    "WebSite": "http://www.alucomat.com/index.html",
    "Profile": "http://www.alucomat.com/images/logo-45.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Alba",
    "WebSite": "http://albaland.fr/index.php",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/obpmbuuwnsrilcyfvfqn.jpg",
    "ProductCats": "Arm Chairs,Dining Chairs,Easy Chairs,Garden Chairs,Office Chairs,Restaurant Chairs,Visitor's Chairs,Lamps"
  },
  {
    "Name": "A.U.Esse",
    "WebSite": "https://www.auesse.com/en",
    "Profile": "https://www.auesse.com/images/logo262x52.png",
    "ProductCats": "Street Benches,Planters,Garden Armchairs,Bollards,Bicycle Racks"
  },
  {
    "Name": "Triplesign",
    "WebSite": "http://www.triplesign.com/TriplesignSystemAB.aspx",
    "Profile": "http://www.triplesign.com/Portals/0/Logotyp.png",
    "ProductCats": "Public Place Signs,Bollards"
  },
  {
    "Name": "Velopa",
    "WebSite": "http://www.velopa.nl/",
    "Profile": "http://www.velopa.nl/media/15341/velopa-logo-rgb-black-2017.png?height=80",
    "ProductCats": "Street Benches,Bicycle Racks"
  },
  {
    "Name": "Vielaris",
    "WebSite": "http://www.vielaris.lt/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/lwcvy5gdf60y5hx2gizf.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Astley",
    "WebSite": "http://www.rvastley.co.uk/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/znoifuahnqcuhvxm6nun.jpg",
    "ProductCats": "Arm Chairs,Dining Chairs,Easy Chairs,Garden Chairs,Office Chairs,Restaurant Chairs,Visitor's Chairs,Lamps,Mirror Lamps,Interior Lights"
  },
  {
    "Name": "Rubn",
    "WebSite": "https://rubn.com/",
    "Profile": "https://instagram.fhyd3-1.fna.fbcdn.net/vp/afb5b242893caa9051076155499469d3/5C7FB1C2/t51.2885-19/11856751_1472994112997561_1294751706_a.jpg",
    "ProductCats": "Interior Lights,Lamps,Bulbs,Chandelier Lights,Outdoor Lights"
  },
  {
    "Name": "Levitas Design",
    "WebSite": "http://www.levitasdesign.com/index.html",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/ftlgt91ru8t63kl7ujtq.jpg",
    "ProductCats": "Bedside Tables,Day Beds,Double Beds,Hotel Beds,Hotel Bedside Tables,King And Queen Beds,Single Beds"
  },
  {
    "Name": "Lealpell",
    "WebSite": "http://www.lealpell.it/en/",
    "Profile": "http://www.lealpell.it/wp-content/uploads/2017/09/logo.png",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "Frank Allart",
    "WebSite": "https://frankallart.co.uk/index.html",
    "Profile": "https://frankallart.co.uk/images/Frank-Allart-Logo.jpg",
    "ProductCats": "Door Handles"
  },
  {
    "Name": "Contemporary Chandelier Company",
    "WebSite": "https://www.contemporarychandeliercompany.co.uk/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/kl1rpfpjjyfrfayyh5f5.jpg",
    "ProductCats": "Chandelier Lights"
  },
  {
    "Name": "ADH Fine Hardware",
    "WebSite": "https://adhhardware.ca/",
    "Profile": "https://adhhardware.ca/wp-content/uploads/2016/07/logo-adh1.png",
    "ProductCats": "Door Handles"
  },
  {
    "Name": "Plus Halle",
    "WebSite": "http://www.plushalle.com",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/12105863_1634268860158195_7411143215546948043_n.png?_nc_cat=111&_nc_ht=scontent.fhyd3-1.fna&oh=894a00c086352404d2ae894aea6c028d&oe=5C86477D",
    "ProductCats": "Sectional,Lounge Chairs,Benches,Coffee Tables"
  },
  {
    "Name": "Messana",
    "WebSite": "https://radiantcooling.com/",
    "Profile": "https://radiantcooling.com/wp-content/uploads/2015/05/messana-radiant-cooling-logo.png",
    "ProductCats": "Radiators"
  },
  {
    "Name": "Minwax",
    "WebSite": "https://www.minwax.com/",
    "Profile": "https://www.minwax.com/images/minwaxlogo.svg",
    "ProductCats": "Wood Coatings"
  },
  {
    "Name": "Ruvati",
    "WebSite": "http://www.ruvati.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/ppqyug8cvpc0vmr9tfcr.jpg",
    "ProductCats": "Sinks,Kitchen Faucets,Door Handles"
  },
  {
    "Name": "Avantco",
    "WebSite": "https://www.avantcoequipment.com/",
    "Profile": "https://www.avantcoequipment.com/img/AvantcoEquipment/avantcologo-big.png",
    "ProductCats": "Ovens"
  },
  {
    "Name": "Sun-Mar",
    "WebSite": "https://sun-mar.com/index.html",
    "Profile": "https://sun-mar.com/images/sun-mar.gif",
    "ProductCats": "Toilets"
  },

  {
    "Name": "Cosmopilitan design",
    "WebSite": "http://cosmopolitan-design.com/",
    "Profile": "http://cosmopolitan-design.com/wp-content/themes/cosmopolitan-design/assets/img/logo.png",
    "ProductCats": "Sectional,Lounge Chairs,King And Queen Beds"
  },
  {
    "Name": "Ton",
    "WebSite": "https://www.ton.eu/en/",
    "Profile": "https://www.ton.eu/public/images/logo.svg",
    "ProductCats": "Sectional,Lounge Chairs,King And Queen Beds,Bar Stools"
  },
  {
    "Name": "Janosik",
    "WebSite": "https://www.janosik.cz/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/29496205_1583054678444809_6892765856825081856_n.png?_nc_cat=100&_nc_ht=scontent.fhyd3-1.fna&oh=559a5539861ab7d77f80341ee2231524&oe=5C65D2A8",
    "ProductCats": "Windows,Doors"
  },
  {
    "Name": "Cassinatech",
    "WebSite": "http://www.cassinatech.ch/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/11206114_137145366656402_2810588470549525638_n.jpg?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=b83a6a87b5d27ecd7cb932c76803630f&oe=5C717314",
    "ProductCats": "Suspended Ceilings,Floorings"
  },
  {
    "Name": "Desax",
    "WebSite": "https://www.desax.ch/",
    "Profile": "https://www.desax.ch/fileadmin/images/Desax-Logo-d.png",
    "ProductCats": "Water Proofing"
  },
  {
    "Name": "L'Altra Pietra",
    "WebSite": "https://www.altrapietra.it/en/",
    "Profile": "https://www.altrapietra.it/files/2017/04/logo_altra_pietra_small-1.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Tres Tintas",
    "WebSite": "https://www.trestintas.com/en",
    "Profile": "https://www.trestintas.com/sites/all/themes/megaw/images/3TLogoIllustratedWallpaper.png",
    "ProductCats": "Wallpapers"
  },
  {
    "Name": "Cabas",
    "WebSite": "https://cabas.it/en_eu/",
    "Profile": "https://cabas.it/pub/media/logo/websites/1/cabas_logo_n4.png",
    "ProductCats": "Arm Chairs,Dining Chairs,Easy Chairs,Executive Chairs,Garden Armchairs,Garden Chairs,Hanging Chairs,Lounge Chairs,Massage Chairs,Office Chairs,Restaurant Chairs,Visitor's Chairs,Waiting Room Chairs"
  },
  {
    "Name": "Art Aqua",
    "WebSite": "https://www.artaqua.de",
    "Profile": "https://www.artaqua.de/typo3conf/ext/ec_master/Resources/Public/Images/med-logo.png",
    "ProductCats": "Outdoor Greenwalls"
  },
  {
    "Name": "Wellsun",
    "WebSite": "https://www.wellsun.nl/",
    "Profile": "https://static.wixstatic.com/media/39f936_c9c5c6aeb5b042399f17d80f6844fe81~mv2.png/v1/crop/x_3,y_64,w_189,h_72/fill/w_120,h_48,al_c,q_80,usm_0.66_1.00_0.01/39f936_c9c5c6aeb5b042399f17d80f6844fe81~mv2.webp",
    "ProductCats": "Facade Cladding,Blinds"
  },
  {
    "Name": "Dekmetal",
    "WebSite": "https://dekmetal.be",
    "Profile": "https://dekmetal.be/images/logo.png?d",
    "ProductCats": "Facade Cladding,Roof System"
  },
  {
    "Name": "Print Acoustics",
    "WebSite": "https://www.printacoustics.be/en/index",
    "Profile": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxcq9I5lPC7pD8FK48BjVzdwIn9hyXhwFOlB1qRlXK4QJiz4-WBA",
    "ProductCats": "Doors,Facade Cladding"
  },
  {
    "Name": "Sunshield",
    "WebSite": "https://www.sunshieldglobal.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/rwp23vir3cu8sdcqqczq.jpg",
    "ProductCats": "Blinds"
  },
  {
    "Name": "Stolker Glas",
    "WebSite": "https://www.stolkerglas.nl/",
    "Profile": "https://www.stolkerglas.nl/images/logo.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Silva Floors",
    "WebSite": "https://www.silvafloors.be/",
    "Profile": "https://www.silvafloors.be/wp-content/themes/customtheme/img/logo.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "SG Lighting",
    "WebSite": "https://www.sg-as.com/",
    "Profile": "https://www.sg-as.com/themes/sg/logo.png",
    "ProductCats": "Chandelier Lights,Furniture Lighting,Interior Lights,Lighting Components,Linear Lighting Profiles,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Steplights,Track Lights"
  },
  {
    "Name": "Schell",
    "WebSite": "http://www.schell.eu/worldwide-en.html",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/zpahq9mket7pc8kdb2jo.jpg",
    "ProductCats": "Wash Basins,Shower Heads,Urinals"
  },
  {
    "Name": "RP Technik",
    "WebSite": "https://www.rp-technik.com/en",
    "Profile": "https://www.rp-technik.com/extension/current_design/design/em_plain_site/images/logo.gif",
    "ProductCats": "Facade Cladding,Windows,Doors"
  },
  {
    "Name": "Rigo Verffabriek",
    "WebSite": "http://www.rigoverffabriek.nl/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/b6wihq8snemowfkxdogk.jpg",
    "ProductCats": "Paints"
  },
  {
    "Name": "Helaform",
    "WebSite": "https://helaform.com/en/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/13256185_596882350468493_2433907852049404603_n.png?_nc_cat=103&_nc_ht=scontent.fhyd3-1.fna&oh=61d459d7404e2ba502fd043099cad9be&oe=5C76C4F7",
    "ProductCats": "Doors"
  },
  {
    "Name": "Rako",
    "WebSite": "https://www.rako.cz/en",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/14657413_1159329217476082_2962919552206962813_n.png?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=4a0501df2ba11f96ac3cf7b55db931ae&oe=5C7E74C6",
    "ProductCats": "Floor Tiles,Wall Tiles"
  },
  {
    "Name": "Phomi",
    "WebSite": "http://phomi.be",
    "Profile": "http://phomi.be/wp-content/uploads/2018/02/phomi-logo.gif",
    "ProductCats": "Facade Cladding,Floor Tiles,Wall Tiles"
  },
  {
    "Name": "Target Design",
    "WebSite": "http://www.target-design.cz",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/ujto34b0fs2z8lvg8fzk.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "M4four",
    "WebSite": "http://www.m4four.com/en/",
    "Profile": "https://www.m4four.com/wp-content/uploads/2018/05/header-footer-logo-small.png",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Ampelite",
    "WebSite": "http://www.ampelite.com.au/",
    "Profile": "http://www.ampelite.com.au/wp-content/themes/Ampelite/images/ampelite.png",
    "ProductCats": "Roof Panels,Architectural Glass"
  },
  {
    "Name": "Loxone",
    "WebSite": "https://www.loxone.com/enus/",
    "Profile": "https://www.loxone.com/dede/wp-content/uploads/sites/2/2017/12/loxone_logo.png",
    "ProductCats": "Home Automation Systems"
  },
  {
    "Name": "Raw Edge Furniture",
    "WebSite": "http://www.rawedgefurniture.com.au/",
    "Profile": "http://www.rawedgefurniture.com.au/wp-content/themes/rawedge/images/logo.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Saflex",
    "WebSite": "https://www.saflex.com/",
    "Profile": "https://www.saflex.com/sites/all/themes/saflex/images/saflex-logo.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Kroone Lighting",
    "WebSite": "http://www.kroone-lighting.nl/",
    "Profile": "http://www.kroone-lighting.nl/wp-content/uploads/2018/08/logo-kl-aug-med.jpg",
    "ProductCats": "Interior Lights,Lamps,Bulbs"
  },
  {
    "Name": "Borer",
    "WebSite": "https://www.die-schreiner.ch/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/wnzj9hrdb3cxeoem2dyt.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Curtolo",
    "WebSite": "http://www.curtolo.ch/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/g6jhsqd7loab3r7oxvu3.jpg",
    "ProductCats": "Windows"
  },
  {
    "Name": "Audio Kaluste",
    "WebSite": "http://audiokaluste.fi/",
    "Profile": "http://audiokaluste.fi/wp-content/uploads/2017/11/rivi_logo.png",
    "ProductCats": "Auditorium Seats"
  },
  {
    "Name": "Lauritzon",
    "WebSite": "https://lauritzon.fi/",
    "Profile": "https://lauritzon.fi/wp-content/uploads/2017/10/logo-tp-2017.png",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "Metallivalmiste A. Laaksonen",
    "WebSite": "http://www.arkisto2000.fi/eng/index.html",
    "Profile": "http://www.arkisto2000.fi/logot/logo.gif",
    "ProductCats": "Filing Cabinets"
  },
  {
    "Name": "Merianto",
    "WebSite": "http://www.merianto.com/en/",
    "Profile": "http://www.merianto.com/wp-content/themes/merianto/images/merianto_logo.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Interstil",
    "WebSite": "https://interstil.de/en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/l9hdgtt900g4bwkfkz6q.jpg",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "La Clef de Voute",
    "WebSite": "http://laclefdevoute.com/en/",
    "Profile": "http://laclefdevoute.com/img/elements/logo-cdv.svg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Lepage Millwork",
    "WebSite": "http://www.lepagemillwork.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/28471982_1896578203687733_2467887541009172867_n.png?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=0b4a78b6cd74de15e111bbb1ffd8aa19&oe=5C793DA5",
    "ProductCats": "Windows,Doors"
  },
  {
    "Name": "Durat",
    "WebSite": "https://www.durat.com",
    "Profile": "https://www.durat.com/fileadmin/_processed_/1/9/csm_Durat-logo_RGB_42a45d6555.jpg",
    "ProductCats": "Vanity Units"
  },
  {
    "Name": "KBH Københavns Møbelsnedkeri",
    "WebSite": "http://kbhsnedkeri.dk",
    "Profile": "http://kbhsnedkeri.dk/wp-content/uploads/2016/02/logo@2x1.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Gagganau",
    "WebSite": "https://www.gaggenau.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/x5nz00hj1ufeyznn1zzd.jpg",
    "ProductCats": "Refrigerators,Ovens,Dishwashers"
  },
  {
    "Name": "Axel Veit",
    "WebSite": "http://axelveit.com/index_en.html",
    "Profile": "http://axelveit.com/_img/logo-axelveit.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Gentas",
    "WebSite": "http://en.gentas.com.tr/",
    "Profile": "http://en.gentas.com.tr/Site/Library/images/logo.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Fiberon",
    "WebSite": "http://www.fiberon.nl/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/t32jyp09rqukrqcag0gm.jpg",
    "ProductCats": "Facade Cladding,Railings,Floorings"
  },
  {
    "Name": "Exasun",
    "WebSite": "https://exasun.com/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/h6emrbozanauvynglico.jpg",
    "ProductCats": "Facade Cladding,Architectural Glass"
  },
  {
    "Name": "Eijffinger",
    "WebSite": "https://www.eijffinger.com/en-in",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/acsjuqtx5lgfengr4tfc.jpg",
    "ProductCats": "Wallpapers"
  },
  {
    "Name": "Di Legno",
    "WebSite": "http://www.dilegno.be/default.cshtml?nav=1&lang=en",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/11752349_421545744706891_3438327552621375310_n.png?_nc_cat=101&_nc_ht=scontent.fhyd3-1.fna&oh=438a787b6cb79cdbd1a99164ed2e2f4e&oe=5C819D6C",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Compri Aluminium",
    "WebSite": "https://compri.eu/en",
    "Profile": "https://compri.eu/2016/pages/site/images/logo_compri.svg",
    "ProductCats": "Facade Cladding,Roof System"
  },
  {
    "Name": "Comma",
    "WebSite": "https://www.controlyourworld.nl/",
    "Profile": "https://www.controlyourworld.nl/wp-content/themes/twentyseventeen/assets/Comma_logo_rood_witte_achtergrond.svg",
    "ProductCats": "Home Automation Systems"
  },
  {
    "Name": "Cedral",
    "WebSite": "https://www.cedralsidings.com/inen/home",
    "Profile": "https://www.cedralsidings.com/file.php?id=6205e814-a9e2-4559-ad33-ee916ad522d3",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Caracterr",
    "WebSite": "http://www.caracterr.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/vdpw5w0uvutyqntdutpi.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "BN Walls",
    "WebSite": "https://bnwalls.com/athome",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/35478824_10155796440223635_6671730222544453632_n.png?_nc_cat=103&_nc_ht=scontent.fhyd3-1.fna&oh=5c9971796c97592c853ccccbbeb5f596&oe=5C88FC9F",
    "ProductCats": "Wallpapers"
  },
  {
    "Name": "Bekaert",
    "WebSite": "https://www.bekaert.com/en",
    "Profile": "https://www.bekaert.com/site_images/revamp/lgo_bekaert.jpg",
    "ProductCats": "Electrical Cables"
  },
  {
    "Name": "Bagno",
    "WebSite": "http://bagno-interiores.pt/index.php/the-material/?lang=en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/oyoxxmwnd1fnz87vgyt5.jpg",
    "ProductCats": "Wash Basins,Washbasin Countertops,Washbasin Faucets,Vanity Units,Shower Trays"
  },
  {
    "Name": "Asselux",
    "WebSite": "http://www.asselux.nl/nl",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/25299125_1248537951957045_1196577326222220491_n.jpg?_nc_cat=104&_nc_ht=scontent.fhyd3-1.fna&oh=ac3c76eefb45ab2e353ff7f4e13848a5&oe=5C6A9C73",
    "ProductCats": "Wash Basins,Washbasin Countertops,Washbasin Faucets,Vanity Units,Shower Trays"
  },
  {
    "Name": "Coriander Designs",
    "WebSite": "http://www.corianderdesigns.com",
    "Profile": "http://www.corianderdesigns.com/wp-content/uploads/2015/05/Coriander-logo-blue.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "WAC Lighting",
    "WebSite": "http://www.waclighting.com/",
    "Profile": "http://www.waclighting.com/sites/waclighting.com/files/wacus2011_logo.png",
    "ProductCats": "Chandelier Lights,Furniture Lighting,Interior Lights,Lighting Components,Linear Lighting Profiles,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Steplights,Track Lights"
  },
  {
    "Name": "Molza",
    "WebSite": "https://www.molza.net/",
    "Profile": "https://static.wixstatic.com/media/bb2211_fd26981642994449a7e762ea73d2e5a7~mv2.jpg/v1/fill/w_206,h_73,al_c,q_80,usm_2.00_1.00_0.00/bb2211_fd26981642994449a7e762ea73d2e5a7~mv2.webp",
    "ProductCats": "Blinds"
  },
  {
    "Name": "Dorf",
    "WebSite": "https://www.dorf.com.au/",
    "Profile": "https://www.dorf.com.au/sites/dorf/themes/gwa_dorf/images/dorf-logo.png",
    "ProductCats": "BathTub Faucets,Bidet Faucets,Faucet Spares,Health Faucets,Kitchen Faucets,Washbasin Faucets"
  },
  {
    "Name": "Nectre",
    "WebSite": "https://www.nectre.com/",
    "Profile": "https://static.wixstatic.com/media/4ab39d_5753d398307f45a0be5495c49d819fa5.png/v1/fill/w_208,h_81,al_c,q_80,usm_0.66_1.00_0.01/4ab39d_5753d398307f45a0be5495c49d819fa5.webp",
    "ProductCats": "Floor and Wall Heaters,Outdoor Heaters,Stoves"
  },
  {
    "Name": "Alex Earl",
    "WebSite": "http://www.alexearl.com.au",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/jucmetbebsgxnx8kltvr.jpg",
    "ProductCats": "Chandelier Lights,Furniture Lighting,Interior Lights,Lighting Components,Linear Lighting Profiles,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Steplights,Track Lights,Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },

  {
    "Name": "Blücher",
    "WebSite": "http://www.blucher.com/com/bluecher/",
    "Profile": "http://www.blucher.com/fileadmin/templates/layout/images/logo_new.png",
    "ProductCats": "BathTub Faucets,Bidet Faucets,Faucet Spares,Health Faucets,Kitchen Faucets,Washbasin Faucets"
  },
  {
    "Name": "Gruber Schreinerei",
    "WebSite": "https://www.schreinerei-gruber.eu/index.htm",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/yygjmya767m3xtsvsrqp.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Hendrick Screen",
    "WebSite": "https://www.hendrickcorp.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/wzavai3dankpc9nzcpbj.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "1825 Interiors",
    "WebSite": "https://www.1825interiors.com.au/",
    "Profile": "https://www.1825interiors.com.au/media/logo/stores/1/logo.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Alresford Interiors",
    "WebSite": "https://alresfordinteriors.co.uk",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/xjap4zqamtwxqjbbsyas.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs,Floorings"
  },
  {
    "Name": "Antron",
    "WebSite": "https://antron.net/",
    "Profile": "https://antron.net/~/media/INVISTA/PSM/Antron/Images/Global/antron-logo.ashx?la=en&hash=A881FC8C1F3E88A3B7C71208430F60999D2E5C4C",
    "ProductCats": "Carpets"
  },
  {
    "Name": "Rudolf Lichtwerbung GmbH",
    "WebSite": "http://www.rudolf-lichtwerbung.de/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/304171_103065573135355_1176448335_n.jpg?_nc_cat=110&_nc_ht=scontent.fhyd3-1.fna&oh=bb51e6cd8f1a88a905cd10dfadc06552&oe=5C7FEE2F",
    "ProductCats": "Public Place Signs"
  },
  {
    "Name": "JSP",
    "WebSite": "http://jsp-industries.com",
    "Profile": "http://jsp-industries.com/wp-content/uploads/2015/01/logo_header_light_shadow.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Tempio",
    "WebSite": "http://www.tempio.es",
    "Profile": "http://www.tempio.es/sites/default/files/logocab.png",
    "ProductCats": "Floor Tiles,Roof Tiles,Turnstiles,Wall Tiles,Facade Cladding"
  },
  {
    "Name": "Prudential Lighting",
    "WebSite": "http://www.prulite.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/nsz4kh9cpl4kwjyn7czv.jpg",
    "ProductCats": "Chandelier Lights,Interior Lights,Linear Lighting Profiles,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Solar Lights,Spot Lights,Steplights,Track Lights"
  },
  {
    "Name": "Miwa Lock",
    "WebSite": "https://www.miwalock.com/",
    "Profile": "https://www.miwalock.com/wp-content/uploads/2015/02/miwa_logo.png",
    "ProductCats": "Locks,Access Control Systems"
  },
  {
    "Name": "CL-Talon",
    "WebSite": "http://cltalon.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/h5ekx4u8dqlllmrjgs4t.jpg",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "H2o Elite Labs",
    "WebSite": "http://www.h2oelitelabs.com/",
    "Profile": "http://www.h2oelitelabs.com/wp-content/uploads/2018/02/H2O_ELITE_LABS_LOGO_02-150-trans.png",
    "ProductCats": "Water Purifiers"
  },
  {
    "Name": "Normacadre",
    "WebSite": "http://www.normacadre.fr/en/",
    "Profile": "http://www.normacadre.fr/im/os/logo-normacadre.png",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Boxmark Individual",
    "WebSite": "http://www.boxmark-individual.com/en",
    "Profile": "http://www.boxmark-individual.com/fileadmin/default/templates/images/logo.jpg",
    "ProductCats": "Auditorium Seats,Beam Seatings"
  },
  
  {
    "Name": "Durango Stone",
    "WebSite": "https://www.durangostone.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/m1dygtqffcr8ljnoxasd.jpg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Ecotelhado",
    "WebSite": "https://ecotelhado.com/products/?lang=en",
    "Profile": "https://ecotelhado.com/wp-content/uploads/2018/08/Ecotelhado-Design-Biofilico-logotipo-versao-colorida-horizontal.png",
    "ProductCats": "Outdoor Greenwalls"
  },
  {
    "Name": "Chromagen",
    "WebSite": "http://chromagen.com/",
    "Profile": "http://chromagen.com/images/global/logo.en.png",
    "ProductCats": "Solar Water Heater"
  },
  {
    "Name": "Estudio Diario",
    "WebSite": "https://www.estudio-diario.com/en/",
    "Profile": "https://www.estudio-diario.com/wp-content/uploads/2017/07/estudio-diario.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Claro",
    "WebSite": "https://www.estudioclaro.com/",
    "Profile": "https://static.wixstatic.com/media/5e3c37_9d076f1fb9974b3d9307197d98d747ac~mv2.png/v1/fill/w_130,h_42,al_c,q_80,usm_0.66_1.00_0.01/5e3c37_9d076f1fb9974b3d9307197d98d747ac~mv2.webp",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Alumex",
    "WebSite": "https://www.alumex.com.uy/",
    "Profile": "https://static.wixstatic.com/media/d35a74_b3c9ab598a08411890c1b57ed9388fe4~mv2.jpg/v1/fill/w_143,h_128,al_c,q_80,usm_0.66_1.00_0.01/d35a74_b3c9ab598a08411890c1b57ed9388fe4~mv2.webp",
    "ProductCats": "Facade Cladding,Railings,Mirrors"
  },
  {
    "Name": "Whittle Waxes",
    "WebSite": "http://www.whittlewaxes.com.au/",
    "Profile": "http://www.whittlewaxes.com.au/195/images/logo-195.png",
    "ProductCats": "Wood Coatings"
  },
  {
    "Name": "InHouse",
    "WebSite": "http://www.inhouseltd.co.uk",
    "Profile": "http://www.inhouseltd.co.uk/wp-content/themes/inhouse/img/inhouse-logo.svg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Ikebe",
    "WebSite": "https://www.ikebe.es/en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/kzp57ig7gkmzhohio5ah.jpg",
    "ProductCats": "Washbasin Countertops,Vanity Units,Bath Cabinets,Washbasins,Toilets,Bidets,Urinals"
  },
  {
    "Name": "Howden",
    "WebSite": "https://www.howden.com/en-gb",
    "Profile": "https://www.howden.com/howden/img/layout/howden-logo.svg",
    "ProductCats": "Ventilations,Solar Heating"
  },
  {
    "Name": "BBS Structural Glazing",
    "WebSite": "http://www.bbsrooflights.co.uk/",
    "Profile": "http://www.bbsrooflights.co.uk/wp-content/uploads/2014/07/BBSlogo1.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Amber Precast",
    "WebSite": "https://amberprecast.co.uk",
    "Profile": "https://amberprecast.co.uk/wp-content/themes/amberprecast/img/aplogo.svg",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "CPI EuroMix",
    "WebSite": "http://www.cpieuromix.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/d69gpwagpgvk1cmguxqd.jpg",
    "ProductCats": "Cement"
  },
  {
    "Name": "Floren",
    "WebSite": "http://www.floren.be/en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/cidflysvjw1lwyhn7rye.jpg",
    "ProductCats": "Bricks"
  },
  {
    "Name": "Moduplus",
    "WebSite": "https://moduplus.nl/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/t0gg7tsyirb3nnkgl126.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Vental",
    "WebSite": "http://www.vental.com.au/index.html",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/aby9mg8kzxwm84uf8iuc.jpg",
    "ProductCats": "Blinds"
  },
  {
    "Name": "JP Finsbury",
    "WebSite": "http://www.jpfinsbury.com.au/",
    "Profile": "http://static1.squarespace.com/static/54f0e301e4b09389aa32a643/t/54f0e65ce4b09ea9b4a88530/1472433779066/?format=1500w",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Aran Cucine",
    "WebSite": "http://www.arancucine.it/www/en/",
    "Profile": "http://www.arancucine.it/images/logo.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Teixido",
    "WebSite": "http://www.tapisseriateixido.es/en",
    "Profile": "http://www.tapisseriateixido.es/wp-content/uploads/2015/01/logo-tap-teixidor.jpg",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "Huguet",
    "WebSite": "http://huguetmallorca.com/en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/afdkhj7hdjs9mvqmeeed.jpg",
    "ProductCats": "Floor Tiles,Roof Tiles,Turnstiles,Wall Tiles,Bath Tubs"
  },
  {
    "Name": "Bulthaup Bach 7",
    "WebSite": "https://bach7.bulthaup.com/es",
    "Profile": "https://bach7.bulthaup.com/_partner/bach7.bulthaup.com/content/uebergreifende-informationen/bach-7-rgb.svg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Artemides",
    "WebSite": "https://www.artemide.com/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/tvvt7ukzkurjb5fpzexq.jpg",
    "ProductCats": "Interior Lights,Lamps,Bulbs,Chandelier Lights,Outdoor Lights"
  },
  {
    "Name": "Prestige Carpets",
    "WebSite": "http://www.prestigecarpets.com.au/",
    "Profile": "http://www.prestigecarpets.com.au/wp-content/uploads/2015/06/Prestige-logo-mobile.png",
    "ProductCats": "Carpets"
  },
  {
    "Name": "Pitella",
    "WebSite": "https://www.pittella.com.au/",
    "Profile": "https://www.pittella.com.au/wp-content/uploads/2016/09/pittella_50px.svg",
    "ProductCats": "Door Handles,Vanity Units,Wash Basins"
  },
  {
    "Name": "Zip",
    "WebSite": "https://www.zipwater.com/",
    "Profile": "https://www.zipwater.com/assets/images/logos/zip.png",
    "ProductCats": "Water Purifiers"
  },
  {
    "Name": "G-Lux",
    "WebSite": "https://www.g-lux.com.au/home",
    "Profile": "https://www.g-lux.com.au/templates/glux/GLU_images/masterAssets/gluLogo.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Made By Storey",
    "WebSite": "http://www.madebystorey.co/",
    "Profile": "https://instagram.fhyd3-1.fna.fbcdn.net/vp/03d95cc37b9dbd668f9b69444e85ac0d/5C6FAF3B/t51.2885-19/s150x150/12139637_1227506397265551_989386633_a.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Sphera",
    "WebSite": "https://www.sphera.com.au/",
    "Profile": "https://www.sphera.com.au/wp-content/uploads/2016/10/logo-sphera120-1.png",
    "ProductCats": "Interior Lights,Lamps,Bulbs,Chandelier Lights,Outdoor Lights"
  },
  {
    "Name": "Bam Stone",
    "WebSite": "http://bamstone.com.au/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/dn4fpaei1y5jtz517vt3.jpg",
    "ProductCats": "Floor Tiles,Roof Tiles,Turnstiles,Wall Tiles,Natural Stone"
  },
  {
    "Name": "Granite works",
    "WebSite": "https://www.graniteworks.com.au",
    "Profile": "https://www.graniteworks.com.au/wp-content/uploads/2015/09/granite-works-stone-paving-logo.png",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Metalplex",
    "WebSite": "http://www.metalplex.it/index.php/en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/eokvrbbqy0kdefg6uwmx.jpg",
    "ProductCats": "Office Chairs,Office Desks,Executive Chairs,Visitors Chair,Office Partitions,Office Workstations"
  },
  {
    "Name": "Lattonedil",
    "WebSite": "https://www.lattonedil.it/en",
    "Profile": "https://www.lattonedil.it/images/site/logo_en.png",
    "ProductCats": "Roof Panels,Roof Shingles,Roof System,Roof Tiles"
  },
  {
    "Name": "Little Anvil",
    "WebSite": "https://littleanvil.com",
    "Profile": "https://static1.squarespace.com/static/514a5af5e4b0199d103f86cb/t/57bef85b9f74567b8009fdeb/1541982680991/?format=1500w",
    "ProductCats": "Lamps,Mirror Lamps,Outdoor Ceiling Lamps,Outdoor Floor Lamps,Outdoor Pendant Lamps,Outdoor Wall Lamps,Pendant Lamps,Street Lamps,Table Lamps,Underwater Lamps,Wall Lamps,Door Handles"
  },
  {
    "Name": "Branca",
    "WebSite": "https://www.branca-lisboa.com",
    "Profile": "https://static1.squarespace.com/static/56e470db2b8dde4bafb903cd/t/574444054c2f85e970721c72/1542281355703/?format=1500w",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Madinoz",
    "WebSite": "http://www.madinoz.com.au/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/ilxwndbppxwsbcv8gwh3.jpg",
    "ProductCats": "Shower Rails,Soap Dishes,Robe Hooks,Toilet Roll Holders,Tooth Brush Holders,Towel Holders"
  },
  {
    "Name": "Terrazzo",
    "WebSite": "https://terrazzo.net.au/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/khch4yoqultxjdefrzsq.jpg",
    "ProductCats": "Floor Tiles,Roof Tiles,Turnstiles,Wall Tiles,Natural Stone"
  },
  {
    "Name": "ASI JD MacDonald",
    "WebSite": "http://www.jdmacdonald.com.au",
    "Profile": "https://cdn1.bigcommerce.com/server3900/f180f/product_images/asi_jd_macdonald_brandmark-_white_17-05-16_1463443832__90888.png",
    "ProductCats": "Bottle Trap,Hair Dryer Holder,Bathroom Wall Shelves,Tumbler Holders,Shower Rails,Health Faucets,Baskets,Bath Stools,Toilet Brush Holders,Soap Dishes,Toilet Brushes,Robe Hooks,Mirrors,Liquid Soap Dispensers,Toilet Roll Holders,Tooth Brush Holders,Towel Holders,Waste Bins,Toilet Seats"
  },
  {
    "Name": "Aluprof",
    "WebSite": "https://www.aluprof.co.uk/en",
    "Profile": "https://www.aluprof.co.uk/media/aluprof_eu/img/logoAluprof.png",
    "ProductCats": "Windows,Doors,Facade Cladding,Blinds,Gates"
  },
  {
    "Name": "Lambert fils",
    "WebSite": "https://lambertetfils.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/mudzvpsvdspszvx5bh1q.jpg",
    "ProductCats": "Bollard Lights,Chandelier Lights,Interior Lights,Outdoor Floodlights,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Solar Lights,Spot Lights,Steplights,Track Lights,Bathroom Wall Lamps,Ceiling Lamps,Floor Lamps,Lamps,Mirror Lamps,Outdoor Ceiling Lamps,Outdoor Floor Lamps,Outdoor Pendant Lamps,Outdoor Wall Lamps,Pendant Lamps,Wall Lamps"
  },
  {
    "Name": "Element De Base",
    "WebSite": "https://elementdebase.com/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/12687867_1802824173278600_2791162074948555420_n.jpg?_nc_cat=107&_nc_ht=scontent.fhyd3-1.fna&oh=21102d21b8b1ec3b18abc2007aa7bfff&oe=5C7CE806",
    "ProductCats": "Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs,Office Chairs,Office Desks,Executive Chairs,Visitors Chair"
  },
  {
    "Name": "S&A Stairs",
    "WebSite": "https://sastairs.com.au/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/dwqptwzymckjsa6gbdpy.jpg",
    "ProductCats": "Fire Escape And Safety Stairs"
  },
  {
    "Name": "Wood For Walls",
    "WebSite": "http://www.woodforwalls.be/",
    "Profile": "http://www.woodforwalls.be/img/logoblack.svg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Fudeli",
    "WebSite": "http://en.fdlmy.com",
    "Profile": "http://en.fdlmy.com/files/logo.png",
    "ProductCats": "Floor Tiles,Floorings"
  },
  {
    "Name": "CL Gulve aps",
    "WebSite": "http://clgulve.dk/",
    "Profile": "http://clgulve.dk/CustomerData/Files/Images/Archive/1-logo/logo_5.png",
    "ProductCats": "Floor Tiles,Floorings"
  },
  {
    "Name": "Formerin",
    "WebSite": "https://www.formerin.it/en",
    "Profile": "https://www.formerin.it/img/logo.jpg",
    "ProductCats": "Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs,Office Chairs,Office Desks,Executive Chairs,Visitors Chair"
  },
  {
    "Name": "Fireorb",
    "WebSite": "https://fireorb.net/",
    "Profile": "https://fireorb.net/wp-content/uploads/2016/11/logo.png",
    "ProductCats": "Fireplaces"
  },
  {
    "Name": "Delta",
    "WebSite": "https://deltamillworks.com",
    "Profile": "https://static.spacecrafted.com/a3a4bfa70cdc42f6a68d8bb742200bdc/i/bb6a811da5d341279f647c56cb5461b0/1/5feFb8zhrk/Delta_Logo_Secondary_Black.png",
    "ProductCats": "Floor Tiles,Floorings,Plywoods"
  },
  {
    "Name": "Brink Light",
    "WebSite": "https://www.brinklight.co.uk/",
    "Profile": "https://cdn.brinklicht.nl/skin/frontend/brink/default/images/brink-logo-nl.svg",
    "ProductCats": "Bollard Lights,Chandelier Lights,Interior Lights,Outdoor Floodlights,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Solar Lights,Spot Lights,Steplights,Track Lights,Bathroom Wall Lamps,Ceiling Lamps,Floor Lamps,Lamps,Mirror Lamps,Outdoor Ceiling Lamps,Outdoor Floor Lamps,Outdoor Pendant Lamps,Outdoor Wall Lamps,Pendant Lamps,Wall Lamps"
  },
  {
    "Name": "Toss B",
    "WebSite": "http://www.tossb.com",
    "Profile": "http://www.tossb.com/templates/images/logo.jpg",
    "ProductCats": "Bollard Lights,Chandelier Lights,Interior Lights,Outdoor Floodlights,Outdoor Lights,Outdoor Spot Lights,Smart Lights,Solar Lights,Spot Lights,Steplights,Track Lights,Bathroom Wall Lamps,Ceiling Lamps,Floor Lamps,Lamps,Mirror Lamps,Outdoor Ceiling Lamps,Outdoor Floor Lamps,Outdoor Pendant Lamps,Outdoor Wall Lamps,Pendant Lamps,Wall Lamps"
  },
  {
    "Name": "Lotec",
    "WebSite": "https://lotec.nl/en/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/16143105_361715367541092_3615484022076916546_n.jpg?_nc_cat=105&_nc_ht=scontent.fhyd3-1.fna&oh=423a4eac4c4c03d5ef24aa12f9eca177&oe=5C65EBCD",
    "ProductCats": "Water Purifiers"
  },
  {
    "Name": "Dim'Ora",
    "WebSite": "http://www.dim-ora.it/eng/index.htm",
    "Profile": "http://www.dim-ora.it/img/logo.gif",
    "ProductCats": "Fireplaces,Chimneys"
  },
  {
    "Name": "W-Doubleyou",
    "WebSite": "https://www.w-doubleyou.com",
    "Profile": "https://w-doubleyou.com/media/wysiwyg/Doubleyou-Projects-2018-200.png",
    "ProductCats": "Bottle Trap,Hair Dryer Holder,Bathroom Wall Shelves,Tumbler Holders,Shower Rails,Health Faucets,Baskets,Bath Stools,Toilet Brush Holders,Soap Dishes,Toilet Brushes,Robe Hooks,Mirrors,Liquid Soap Dispensers,Toilet Roll Holders,Tooth Brush Holders,Towel Holders,Waste Bins,Toilet Seats"
  },
  {
    "Name": "Tegel Kunci",
    "WebSite": "http://tegelkunci.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/j3hfiw72lfltlcnkvnvk.jpg",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "IlSogno",
    "WebSite": "http://www.ilsogno.co.id",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/lzgcjtchm2tst2ktbybm.jpg",
    "ProductCats": "Windows,Doors"
  },
  {
    "Name": "Plasbar",
    "WebSite": "http://www.plasbar.com.mx",
    "Profile": "http://www.plasbar.com.mx/wp-content/themes/bazar-child/images/logo.png",
    "ProductCats": "Bath Tubs,Wash Basins"
  },
  {
    "Name": "Esloventanas",
    "WebSite": "http://www.esloventanas.com",
    "Profile": "http://www.esloventanas.com/nuevo/img/esloventanas_footer.png",
    "ProductCats": "Windows,Doors"
  },
  {
    "Name": "Consorcio Caza",
    "WebSite": "http://consorciocaza.com.mx/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/n4mlmwyggqtmryhu8xob.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Cocinas Gourmet",
    "WebSite": "https://cocinasgourmet.com",
    "Profile": "https://cocinasgourmet.com/images/logo.png",
    "ProductCats": "Modular Kitchens,Kitchen Drawers,PullOuts,Kitchen Basket"
  },
  {
    "Name": "Norsk Spon",
    "WebSite": "http://www.norskspon.no",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/vzuanvlcal5p3pduwfpk.jpg",
    "ProductCats": "Facade Cladding"
  },
  {
    "Name": "Casa",
    "WebSite": "http://www.casarocca.co.th/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/jvubwwemhvdwojicmpyt.jpg",
    "ProductCats": "Floorings"
  },
  {
    "Name": "Amvis",
    "WebSite": "https://amvis.de/images/warptheme/logo.png",
    "Profile": "https://amvis.de/images/warptheme/logo.png",
    "ProductCats": "Lamps"
  },
  {
    "Name": "Mone Studio",
    "WebSite": "https://mone.com.ua/",
    "Profile": "https://mone.com.ua/image/mone_tpml/logo_black.png",
    "ProductCats": "Wash Basins,Bar Stools,Planters,Coffee Tables,Dining Tables,Arm Chairs"
  },
  {
    "Name": "SerraLux",
    "WebSite": "https://serraluxinc.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/cls4mpnwrwob9lla3swi.jpg",
    "ProductCats": "Windows"
  },
  {
    "Name": "Riccardo Rivoli",
    "WebSite": "http://www.riccardorivoli.com",
    "Profile": "http://www.riccardorivoli.com/nw/wp-content/uploads/2018/04/riccardo-rivoli-logo.svg",
    "ProductCats": "Arm Chairs,Bar Stools,Bath Stools,Foot Stools,Office Stools,Sectional,Dining Tables,Coffee Tables"
  },
  {
    "Name": "Agnora",
    "WebSite": "https://www.agnora.com",
    "Profile": "https://www.agnora.com/wp-content/themes/agnora/assets/images/agnoraLogo.svg",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Movecho",
    "WebSite": "http://movecho.pt/en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/jacr7bh2wnlslic3hha3.jpg",
    "ProductCats": "Bar Stools,Bath Stools,Foot Stools,Office Stools,Lounge Chairs,Benches,Garden Benches,Street Benches"
  },
  {
    "Name": "Vintageview",
    "WebSite": "https://www.vintageview.nl/",
    "Profile": "https://www.vintageview.nl/Files/2/84000/84313/Protom/92489/Media/VVlogo-NL_nl.png",
    "ProductCats": "Bottle Racks"
  },
  {
    "Name": "Safe Log",
    "WebSite": "http://www.safelogsrl.com",
    "Profile": "http://www.safelogsrl.com/wp-content/uploads/2018/04/safelog-logo-blu-produttori-di-sicurezza-3.png",
    "ProductCats": "Fire Doors and Closures,Floorings"
  },
  {
    "Name": "Dipro Art",
    "WebSite": "https://www.diproart.com",
    "Profile": "https://www.diproart.com/wp-content/uploads/2017/03/dipro-art-logo.png",
    "ProductCats": "Bottle Racks,Cushions,Bath Stools"
  },
  {
    "Name": "Doorsan",
    "WebSite": "https://www.doorsan.co.uk",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/h7r902p2usjtzo0rppue.jpg",
    "ProductCats": "Doors,Plywoods"
  },
  {
    "Name": "MASA Architectural Canopies",
    "WebSite": "https://www.architecturalcanopies.com/",
    "Profile": "https://www.architecturalcanopies.com/wp-content/themes/scarc/images/logo.png",
    "ProductCats": "Awnings"
  },
  {
    "Name": "Joan Roca",
    "WebSite": "http://www.joanroca.com",
    "Profile": "http://miguelimbach.com/joanroca[new]/sites/default/files/logo_black.gif",
    "ProductCats": "Swimming Pools"
  },
  {
    "Name": "Rosconi",
    "WebSite": "https://www.rosconi.com/",
    "Profile": "https://www.rosconi.com/fileadmin/rosconi.com/logos/logo.svg",
    "ProductCats": "Bar Cabinets,Bottle Racks,Bar Stools,Arm Chairs,Easy Chairs,Massage Chairs,Wardrobes,Side Boards,Chest Of Drawers,Book Cases"
  },
  {
    "Name": "Longhorn Welding",
    "WebSite": "http://longhornwelding.com/",
    "Profile": "http://static1.squarespace.com/static/5a06130c1f318d20032c425a/t/5a0623f924a694e3393c6ad4/1518045400787/?format=1500w",
    "ProductCats": "Fire Escape And Safety Stairs,Awnings,Gates,Fences"
  },
  {
    "Name": "Rector Seal",
    "WebSite": "https://www.rectorseal.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/kuncmaniw8my5hw16h9q.jpg",
    "ProductCats": "Pumps and Motors,Pipes And Fittings"
  },
  {
    "Name": "Royal Custom Cabinets",
    "WebSite": "http://www.royalcustomcabinetsrcc.com",
    "Profile": "http://www.royalcustomcabinetsrcc.com/clips/header.png",
    "ProductCats": "Bar Cabinets,Bathroom Cabinets,Display Cabinets,Filing Cabinets,Shower Cabins,Tv Cabinets,Wall Cabinets"
  },
  {
    "Name": "Custom Metalcraft",
    "WebSite": "https://custom-metalcraft.com",
    "Profile": "https://custom-metalcraft.com/wp-content/uploads/Custom_Metalcraft_Logo_Transparent_470px.png",
    "ProductCats": "Water Storage Tanks,Wine Coolers,Ventilations"
  },
  {
    "Name": "Beger",
    "WebSite": "http://www.beger.co.th",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/13015555_1328805337146683_6993722221791763120_n.jpg?_nc_cat=104&_nc_ht=scontent.fhyd3-1.fna&oh=eade8cf31bc5a8bc160dae992cd3e5c7&oe=5C84117F",
    "ProductCats": "Paints"
  },
  {
    "Name": "Mattlach",
    "WebSite": "http://www.mattlach.com.au",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/mkrqwvnnhauur7grnpqj.jpg",
    "ProductCats": "Wall Cabinets"
  },
  {
    "Name": "Statewide Panels",
    "WebSite": "http://www.statewidepanels.websyte.com.au/site.cfm?/statewidepanels/",
    "Profile": "http://www.communityguide.com.au/syteadmin/admin/pics5/Statewide%20Panels%20Header.jpg",
    "ProductCats": "Blocks"
  },
  {
    "Name": "KP Building Products Inc.",
    "WebSite": "https://www.farleywindows.com",
    "Profile": "https://www.farleywindows.com/wp-content/uploads/2018/02/farleywindows_EN_logo.png",
    "ProductCats": "Doors,Windows"
  },
  {
    "Name": "Shearform",
    "WebSite": "http://www.shearform.com.au",
    "Profile": "http://www.shearform.com.au/wp-content/uploads/2017/09/logo-new.jpg",
    "ProductCats": "Pipes And Fittings,Railings"
  },
  {
    "Name": "UTIL",
    "WebSite": "https://www.thisisutil.com/",
    "Profile": "https://www.thisisutil.com/wp-content/themes/merchandiser-child/images/logo_black.svg",
    "ProductCats": "Bar Cabinets,Bar Stools,Side Boards,Chest Of Drawers,Book Cases,Coffee Tables,Bedside Tables"
  },
  {
    "Name": "Teknika",
    "WebSite": "http://teknikasrl.com/en",
    "Profile": "http://teknikasrl.com/sites/default/files/logo_teknikasrl.png",
    "ProductCats": "Greenhouses"
  },
  {
    "Name": "Nowy Styl Group",
    "WebSite": "https://nowystylgroup.com/en/",
    "Profile": "https://nowystylgroup.com/static/NSG/images/logo.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables,Wardrobes,Side Boards,Chest Of Drawers,Book Cases,Lounge Chairs,Arm Chairs,Easy Chairs,Massage Chairs"
  },
  {
    "Name": "Putnam Rolling Ladder",
    "WebSite": "http://www.putnamrollingladder.com/index.html",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/uqzfr6b3rs2avshu4mha.jpg",
    "ProductCats": "Bar Stools,Bath Stools,Foot Stools,Office Stools"
  },
  {
    "Name": "Xylokat",
    "WebSite": "http://www.xylokat.gr/en",
    "Profile": "http://www.xylokat.gr/images/template/logo.png",
    "ProductCats": "Facade Cladding,Plywoods"
  },
  {
    "Name": "Metal Bagno",
    "WebSite": "http://www.metalbagno.com.br",
    "Profile": "http://www.metalbagno.com.br/site/img/logo_30a-1.png",
    "ProductCats": "Washbasin Faucets,Shower Faucets,Diverters,Bathtub Faucets,Overhead Showers,Rain Showers,Shower Cabins,Shower Panels,Washbasins,Toilets,Bidets,Urinals"
  },
  {
    "Name": "Sipa",
    "WebSite": "https://www.sipasedie.it",
    "Profile": "https://www.sipasedie.it/images/logo-hp-white.jpg",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Hotel Bedside Tables,Lounge Tables,Restaurant Tables,Side Tables,Table Lamps,Tables For Public Areas,Bar Stools,Bath Stools,Foot Stools,Office Stools,Arm Chairs,Dining Chairs,Restaurant Chairs,Visitor's Chairs,Waiting Room Chairs"
  },
  {
    "Name": "Archiutti",
    "WebSite": "http://www.archiutti.it/en",
    "Profile": "http://www.archiutti.it/img/logo.jpg",
    "ProductCats": "Office Accessories,Office Booths,Office Chairs,Office Desks,Office Partitions,Office Stools,Office Storage Units,Office Workstations"
  },
  {
    "Name": "New York Ceiling",
    "WebSite": "https://www.newyorkceiling.nl/?lang=en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/y5s96u7osvnvjqdnn3c7.jpg",
    "ProductCats": "Suspended Ceilings"
  },
  {
    "Name": "Franz Viegener",
    "WebSite": "http://franzviegener.us/en/#",
    "Profile": "http://franzviegener.us/bundles/app/front/images/franz_viegener-b.png",
    "ProductCats": "BathTub Faucets,Bidet Faucets,Faucet Spares,Health Faucets,Kitchen Faucets,Washbasin Faucets"
  },
  {
    "Name": "Niagara",
    "WebSite": "https://niagaracorp.com/",
    "Profile": "https://niagaracorp.com/wp-content/themes/niagra/images/scroll-logo-text.png",
    "ProductCats": "Toilets,Shower Heads"
  },
  {
    "Name": "Colli Casa",
    "WebSite": "http://www.collicasa.it/en",
    "Profile": "http://www.collicasa.it/images/colli_splash.jpg",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Hotel Bedside Tables,Lounge Tables,Restaurant Tables,Side Tables,Table Lamps,Tables For Public Areas,Bar Stools,Bath Stools,Foot Stools,Office Stools,Arm Chairs,Dining Chairs,Restaurant Chairs,Visitor's Chairs,Waiting Room Chairs"
  },
  {
    "Name": "Steelpro",
    "WebSite": "https://www.steelpro.fi/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/athew5tibh12wivdhagm.jpg",
    "ProductCats": "Railings"
  },
  {
    "Name": "SuperFab",
    "WebSite": "https://www.superfab.co/",
    "Profile": "https://static1.squarespace.com/static/5a21a1a84c326d879f55917e/t/5a21a3aa24a69479a951aee6/1542187214383/?format=1500w",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Hotel Bedside Tables,Lounge Tables,Restaurant Tables,Side Tables,Table Lamps,Tables For Public Areas,Bar Stools,Bath Stools,Foot Stools,Office Stools,Arm Chairs,Dining Chairs,Restaurant Chairs,Visitor's Chairs,Waiting Room Chairs"
  },
  {
    "Name": "Febrik",
    "WebSite": "https://www.febrik.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/rku6ediyf2ibdb5el9ka.jpg",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "Maharam",
    "WebSite": "https://www.maharam.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/akp2xn2ayu8p1lv5kwjr.jpg",
    "ProductCats": "Fabrics,Rugs"
  },
  {
    "Name": "Systemtronic",
    "WebSite": "http://www.st-systemtronic.com/en",
    "Profile": "http://www.st-systemtronic.com/wp-content/uploads/2015/05/logo_systemtronic-e1432885346548.png",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Hotel Bedside Tables,Lounge Tables,Restaurant Tables,Side Tables,Table Lamps,Tables For Public Areas,Bar Stools,Bath Stools,Foot Stools,Office Stools,Arm Chairs,Dining Chairs,Restaurant Chairs,Visitor's Chairs,Waiting Room Chairs"
  },
  {
    "Name": "TWS",
    "WebSite": "https://www.twstone.it/en",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/21558679_1754666921492954_5888517308064078931_n.jpg?_nc_cat=102&_nc_ht=scontent.fhyd3-1.fna&oh=959e5130ad7b187edc6752d154ce0e48&oe=5C79DC3F",
    "ProductCats": "Natural Stone"
  },
  {
    "Name": "Moebe",
    "WebSite": "https://www.moebe.dk",
    "Profile": "https://static.wixstatic.com/media/1ac21f_8467e76e0abe4589ba53d2c384bb77df~mv2.png/v1/crop/x_124,y_0,w_376,h_131/fill/w_115,h_40,al_c,q_80,usm_0.66_1.00_0.01/MOEBE_HORIZONTAL-LOGO_BLACK.webp",
    "ProductCats": "Mirrors,Floor Lamps"
  },
  {
    "Name": "Anne Linde",
    "WebSite": "https://annelinde.dk",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/ojdrvtp567laowxe2lxa.jpg",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Hotel Bedside Tables,Lounge Tables,Restaurant Tables,Side Tables,Tables For Public Areas,Book Cases,Lounge Chairs"
  },
  {
    "Name": "Claybrook",
    "WebSite": "http://www.claybrookinteriors.com/",
    "Profile": "http://www.claybrookinteriors.com/wp-content/themes/claybrook/images/header_logo.png",
    "ProductCats": "Washbasins,Toilets,Bidets,Urinals,Bath Tubs"
  },
  {
    "Name": "Sans Tabu",
    "WebSite": "https://www.sanstabu.com/en/",
    "Profile": "https://www.sanstabu.com/wp-content/uploads/2017/11/logo-sans-tabu-italy.jpg",
    "ProductCats": "Fabrics,Cushions"
  },
  {
    "Name": "Quinti",
    "WebSite": "https://www.quinti.com/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/ciwpchxrnxgnylvo6ztd.jpg",
    "ProductCats": "Office Chairs,Office Desks,Executive Chairs,Visitors Chair"
  },
  {
    "Name": "Archyi",
    "WebSite": "https://www.archyi-inspiration.com",
    "Profile": "https://www.archyi-inspiration.com/assets/images/logo/logo-menu-dark.png",
    "ProductCats": "Coffee Tables,Dining Tables,Writing Desks,Bedside Tables"
  },
  {
    "Name": "Miras",
    "WebSite": "http://miraseditions.com/",
    "Profile": "http://miraseditions.com/wp-content/uploads/2014/10/logo-miras-2.png",
    "ProductCats": "Bathroom Cabinets,Wash Basins"
  },
  {
    "Name": "Letroh",
    "WebSite": "http://www.letroh.com/homepage-en",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/c1dwxu2btydffdwbfdht.jpg",
    "ProductCats": "Interior Lights,Lamps,Bulbs"
  },
  {
    "Name": "Zeitgeist",
    "WebSite": "http://zeitgeist.jp/en",
    "Profile": "http://zeitgeist.jp/wp-content/uploads/logo.png",
    "ProductCats": "Lounge Chairs,Arm Chairs,Easy Chairs"
  },
  {
    "Name": "Danilo Ramazzotti",
    "WebSite": "http://www.daniloramazzotti.com/en/",
    "Profile": "http://www.daniloramazzotti.com/static/images/logo300.png",
    "ProductCats": "Floor Tiles,Roof Tiles,Turnstiles,Wall Tiles"
  },
  {
    "Name": "Pitt Cooking",
    "WebSite": "http://pittcooking.com/en",
    "Profile": "http://pittcooking.com/nl-test/wp-content/uploads/sites/21/2016/07/PITTcooking-Logo-White-Small-PNG.png",
    "ProductCats": "Hobs"
  },
  {
    "Name": "Aldeco",
    "WebSite": "http://www.aldeco.pt/",
    "Profile": "https://scontent.fhyd3-1.fna.fbcdn.net/v/t1.0-9/44319819_2029996460392614_8715539467462508544_n.jpg?_nc_cat=109&_nc_ht=scontent.fhyd3-1.fna&oh=456012f2eaa8eef1d89ff139ee2d0332&oe=5C6CAF12",
    "ProductCats": "Fabrics"
  },
  {
    "Name": "TuttiSanti",
    "WebSite": "http://www.tuttisanti.design/it",
    "Profile": "http://www.tuttisanti.design/static/img/logo.png",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Vetraria Bergamasca",
    "WebSite": "https://www.vbtglass.com",
    "Profile": "https://www.vbtglass.com/images/logo-vbt.png",
    "ProductCats": "Architectural Glass"
  },
  {
    "Name": "Gencork",
    "WebSite": "http://www.gencork.com/site/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/q7pfvacqtlatxrspjje9.jpg",
    "ProductCats": "Wall Tiles"
  },
  {
    "Name": "Doca",
    "WebSite": "https://www.doca.es/en",
    "Profile": "https://www.doca.es/images/logo_doca.png",
    "ProductCats": "Display Cabinets,Wall Cabinets"
  },
  {
    "Name": "Wissmann Raumobjekte",
    "WebSite": "http://www.wissmann-raumobjekte.de/en",
    "Profile": "http://www.wissmann-raumobjekte.de/sites/all/themes/wro/img/wissmann-logo1.svg",
    "ProductCats": "Bedside Tables,Coffee Tables,Dining Tables,Hotel Bedside Tables,Lounge Tables,Restaurant Tables,Side Tables,Table Lamps,Tables For Public Areas,Bar Stools,Bath Stools,Foot Stools,Office Stools,Arm Chairs,Dining Chairs,Restaurant Chairs,Visitor's Chairs,Waiting Room Chairs"
  },
  {
    "Name": "Ox-Home",
    "WebSite": "https://ox-home.com/",
    "Profile": "https://ox-home.com/wp-content/uploads/2018/08/Oxhome.svg",
    "ProductCats": "Mirrors"
  },
  {
    "Name": "Mascheroni",
    "WebSite": "http://www.mascheroni.it/en-us",
    "Profile": "http://www.mascheroni.it/img/logo.png",
    "ProductCats": "Office Booths,Office Chairs,Office Desks,Office Stools,Office Storage Units"
  },
  {
    "Name": "Kimia",
    "WebSite": "https://www.kimia.it/en/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/jffenadvgzhxwpggkkpe.jpg",
    "ProductCats": "Stone & Tile Adhesives"
  },
  {
    "Name": "Amoretti Brothers",
    "WebSite": "https://www.amorettibrothers.com",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/exmspmscc1c1irwuxyx1.jpg",
    "ProductCats": "Bath Tubs,Sinks"
  },
  {
    "Name": "Carpetlight",
    "WebSite": "https://www.carpetlight.com",
    "Profile": "https://www.carpetlight.com/tpl/cl/en/images/cl-bw.svg",
    "ProductCats": "Interior Lights"
  },
  {
    "Name": "Stroher",
    "WebSite": "http://www.stroeher.com/",
    "Profile": "https://res.cloudinary.com/dzd0mlvkl/image/upload/fl_progressive/v1423542814/bxyode4i25zrbcfssglm.jpg",
    "ProductCats": "Floor Tiles,Roof Tiles,Wall Tiles,Facade Cladding"
  },
  {
    "Name": "MS & Wood",
    "WebSite": "https://mswood.ba/en",
    "Profile": "https://mswood.ba/assets/img/logo.png",
    "ProductCats": "Arm Chairs,Dining Chairs,Lounge Chairs,Office Chairs,Restaurant Chairs,Visitor's Chairs,Tv Cabinets,Wall Cabinets"
  },
  {
    "Name": "Rintal",
    "WebSite": "https://www.rintal.co.uk",
    "Profile": "https://www.rintal.com/wp-content/themes/rintal/images/rintal-logo.png",
    "ProductCats": "Wood Coatings,Fire Escape And Safety Stairs,Railings"
  },
  {
    "Name": "Fondovalle",
    "WebSite": "http://www.fondovalle.it/en",
    "Profile": "http://www.fondovalle.it/assets/img/logo.png",
    "ProductCats": "Floor Tiles,Roof Tiles,Wall Tiles"
  },
  {
    "Name": "Forza",
    "WebSite": "https://www.forza-doors.com",
    "Profile": "https://www.forza-doors.com/media/167958/forza-logo-web.png",
    "ProductCats": "Doors,Suspended Ceilings"
  },
  {
    "Name": "Steel Arts",
    "WebSite": "http://steelarts.in/aluminium-work.php",
    "Profile": "http://steelarts.in/images/new/logo4.png",
    "ProductCats": "Facade Cladding,Awnings,Windows"
  }

];

function executeView(querystring, params, callback) {
    var query = N1qlQuery.fromString(querystring);
    query.adhoc = false;
    cbContentBucket.query(query, params, function(err, results) {
        if (err) {
            if (typeof callback == "function")
                callback({
                    "error": err,
                    "query": query,
                    "params": params
                });
            return;
        }
        if (typeof callback == "function")
            callback(results);
    });
}
if (manufacturers.length == 0) {
    return;
} else {
    processRow(0);
}

function processRow(index) {
    if (index < manufacturers.length) {
        console.log("--------------------------------");
        console.log("Processing row : " + (index + 1))
        createManufacturer(manufacturers[index], function() {
         processRow(index + 1);
        });
    } else {
        console.log("********************************");
        console.log("***********   DONE   ***********");
        console.log("********************************");
    }
}

function createManufacturer(data, callback) {
    executeView("SELECT RAW records from records where docType=$1 AND name=$2", ["Manufacturer", data.Name], function(mfrSearchRes) {
        if (mfrSearchRes.error) {
            console.log(mfrSearchRes);
            callback(mfrSearchRes);
            return;
        }
        if (mfrSearchRes.length > 0) {
            console.log(data.Name + " Exists already");
            callback({
                error: "MfrExists"
            });
        } else {
            createMFRRecord(data, function(mfrRecord) {
                console.log(data.Name + " is done");
                if (data.ProductCats && Array.isArray(mfrRecord.productTypes)) {
                    createProCat(0);

                    function createProCat(index) {
                        console.log(data.Name + " Cat " + index);
                        if (index >= mfrRecord.productTypes.length) {
                            callback();
                        } else {
                            var pid = mfrRecord.productTypes[index];
                            //data.ProductCats[pid]
                            createMFRProCatRecord(pid, undefined, mfrRecord, function() {
                                createProCat(index + 1);
                            });
                        }
                    }
                } else {
                    callback();
                }
            });
        }
    });
}

function createMFRRecord(data, callback) {
    var record = {
        "flag": "uploadedViaBulkScript",
        "$status": "published",
        "@identifier": "name",
        "@superType": "Organization",
        "@uniqueUserName": data.Name.replace(/\W/g, "").toLowerCase(),
        "about": data.About,
        "address": {
            "streetAddress": data.StreetAdress,
            "addressCountry": data.Country,
            "postalCode": data.Pin,
            "email": data.Email,
            "telephone": data.PhoneNo,
            "fax": data.Fax
        },
        "socialIdentity": {},
        "author": "administrator",
        "bannerImage": [],
        "cloudPointHostId": "cloudseed",
        "contacted": false,
        "dateCreated": global.getDate(),
        "dateModified": global.getDate(),
        "docType": "Manufacturer",
        "editor": "administrator",
        "featured": "no",
        "hostname": "cloudseed",
        "images": [],
        "metaDescription": "Find all products manufactured by " + data.Name + ". Also locate and chat with stores and dealers in India.",
        "metaTitle": data.Name + " | cloudseed.com",
        "name": data.Name,
        "org": "public",
        "phone": data.PhoneNo,
        "proCatMasterGroups": [],
        "proCatGroups": [],
        "productTypes": [],
        "profileImage": [],
        "recordId": "Manufacturer" + global.guid(),
        "record_header": data.Name,
        "revision": 1,
        "website": data.WebSite,
        "bespoke": data.Bespoke ? true : false
    }
    if (data.FacebookId) {
        record.socialIdentity.facebook = data.FacebookId;
    }
    if (data.GoogleId) {
        record.socialIdentity.google = data.GoogleId;
    }
    if (data.TwitterId) {
        record.socialIdentity.twitter = data.TwitterId;
    }
    if (data.PinterestId) {
        record.socialIdentity.pinterest = data.PinterestId;
    }
    if (data.ProductCats) {
        //	record.productTypes=data.ProductCats;
        var catNames = data.ProductCats.split(",");
        record.productTypes = catNames.map(function(ct) {
            return categories[ct]
        })
        for (var key in categories.ProductCats) {
            record.productTypes.push(key);
        }
    }


    /*if(data.SubGroups){
    if(Array.isArray(data.SubGroups)){
    record.proCatGroups=data.SubGroups;
    }else{
    record.proCatGroups=[data.SubGroups];
    }
    }
    if(data.MasterGroups){
    if(Array.isArray(data.MasterGroups)){
    record.proCatMasterGroups=data.MasterGroups;
    }else{
    record.proCatMasterGroups=[data.MasterGruops]
    }
    }*/
    uploadProfile();

    function uploadProfile() {
        var cloudinaryId;
        if (data.Profile) {
            var cloudinaryId = global.guid();
            if (data.Profile.indexOf("res.cloudinary.com") != -1) {
                var temp = data.Profile.split("/");
                cloudinaryId = temp[temp.length - 1].split(".")[0];
                proceedToNext();
            } else {
                uploadToCloudinary({
                    id: cloudinaryId,
                    url: data.Profile
                }, function() {
                    proceedToNext();
                });
            }
        } else {
            proceedToNext();
        }

        function proceedToNext() {
            console.log("Profile Image id : " + cloudinaryId);
            if (cloudinaryId) {
                record.profileImage = [{
                    "caption": record.name + " Profile img",
                    "cloudinaryId": cloudinaryId,
                    "name": record.name + "-logo",
                    "type": "image",
                    "url": "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1536149211/" + cloudinaryId + ".png"
                }];
            } else {
                record.profileImage = [];
            }
            uploadBanner();
        }
    }

    function uploadBanner() {
        var cloudinaryId;
        if (data.Banner) {
            cloudinaryId = global.guid();
            if (data.Banner.indexOf("res.cloudinary.com") != -1) {
                var temp = data.Banner.split("/");
                cloudinaryId = temp[temp.length - 1].split(".")[0];
                proceedToNext2();
            } else {
                uploadToCloudinary({
                    id: cloudinaryId,
                    url: data.Banner
                }, function() {
                    proceedToNext2();
                });
            }
        } else {
            proceedToNext2();
        }

        function proceedToNext2() {
            console.log("Banner Image id : " + cloudinaryId);
            if (cloudinaryId) {
                record.bannerImage = [{
                    "caption": record.name + " Banner img",
                    "cloudinaryId": cloudinaryId,
                    "name": record.name + "-banner",
                    "type": "image",
                    "url": "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1536149211/" + cloudinaryId + ".png"
                }];
            } else {
                record.bannerImage = [];
            }
            doneCreation();
        }
    }

    function doneCreation() {
        cbContentBucket.upsert(record.recordId, record, function(err, result) {
            if (err) {
                if (typeof callback == "function")
                    callback({
                        "error": err
                    });
                return;
            }
            console.log(record.recordId + " is created");
            if (typeof callback == "function")
                callback(record);
        });
    }
}

function createMFRProCatRecord(catId, imageId, mfrRecord, callback) {
    if (imageId && Array.isArray(imageId)) {
        imageId = imageId[0];
    }
    executeView("SELECT RAW records from records use keys $1", [catId], function(catSearchRes) {
        if (catSearchRes.error) {
            callback(catSearchRes);
            return;
        }
        if (catSearchRes.length > 0) {
            var catDoc = catSearchRes[0];
            var record = {
                "flag": "uploadedViaBulkScript",
                "$status": "published",
                "@identifier": "mfrProCatName",
                "Manufacturer": mfrRecord.recordId,
                "ProductCategory": catId,
                "about": "All " + catDoc.categoryName + " manufactured by " + mfrRecord.name + ".",
                "author": "administrator",
                "categoryName": catDoc.categoryName,
                "cloudPointHostId": "cloudseed",
                "dateCreated": global.getDate(),
                "dateModified": global.getDate(),
                "docType": "MfrProCat",
                "editor": "administrator",
                "image": [],
                "metaDescription": "Find all " + catDoc.categoryName + " manufactured by " + mfrRecord.name + ". Also locate and chat with stores and dealers near you.",
                "metaTitle": mfrRecord.name + " " + catDoc.categoryName + " | cloudseed.com",
                "mfrName": mfrRecord.name,
                "mfrProCatName": mfrRecord.name + " " + catDoc.categoryName,
                "org": "public",
                "recordId": "MfrProCat" + global.guid(),
                "relationDesc": [
                    "Manufacturer-manufacturesCategory-ProductCategory",
                    "ProductCategory-byManufacturer-Manufacturer"
                ],
                "revision": 1,
                "@uniqueUserName": mfrRecord.name.trim().replace(/\W+/g, "-").toLowerCase() + "-" + catDoc.categoryName.trim().replace(/\W+/g, "-").toLowerCase()
            };
            uploadBanner();

            function uploadBanner() {
                var cloudinaryId;
                if (imageId) {
                    cloudinaryId = global.guid();
                    if (imageId.indexOf("res.cloudinary.com") != -1) {
                        var temp = imageId.split("/");
                        cloudinaryId = temp[temp.length - 1].split(".")[0];
                        proceedToNext2();
                    } else {
                        uploadToCloudinary({
                            id: cloudinaryId,
                            url: imageId
                        }, function() {
                            proceedToNext2();
                        });
                    }
                } else {
                    proceedToNext2();
                }

                function proceedToNext2() {
                    console.log("Cat Image id : " + cloudinaryId);
                    if (cloudinaryId) {
                        record.image = [{
                            "caption": record.mfrProCatName + " Banner img",
                            "cloudinaryId": cloudinaryId,
                            "name": record.mfrProCatName + "-banner",
                            "type": "image",
                            "url": "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1536149211/" + cloudinaryId + ".png"
                        }];
                    } else {
                        record.image = [];
                    }
                    doneCreation();
                }
            }

            function doneCreation() {
                cbContentBucket.upsert(record.recordId, record, function(err, result) {
                    if (err) {
                        if (typeof callback == "function")
                            callback({
                                "error": err
                            });
                        return;
                    }
                    console.log(record.recordId + " is created");
                    if (typeof callback == "function")
                        callback(record);
                });
            }
        } else {
            console.log("Not found cat " + catId);
            callback({
                error: "Not Found"
            });
        }
    });
}
