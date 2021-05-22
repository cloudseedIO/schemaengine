var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://35.154.234.150");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";

var cbContentBucket=cluster.bucket(records);
var cbMasterBucket=cluster.bucket(schemas);
var global=require('../utils/global.js');
var cloudinary = require('cloudinary');




cloudinary.config({ 
   cloud_name: "dzd0mlvkl",
   api_key: "672411818681184", 
   api_secret:'mqpdhFgkCTUyrdg318Var9_dH-I'
});


function addImagesToCloudinary(imageUrl,id,callback){
	cloudinary.v2.uploader.upload(imageUrl.toString(), {"public_id":id},function(err,result) { 
		if(err){
			callback("err")
		}else{
			callback(id);
		}
	});
}

exports.addImagesToCloudinary = addImagesToCloudinary;

//reading json file 
var fs = require('fs');//including file stream to read file
var currentPackage=[];
var errorProductIds=[];
var errorProductJson=[];
var errorIndex=[];

var Manufacturer={};
var dependentSchema="";
var dependentProperties=[];
var user="User6832704f-e8ed-7424-2873-ffbd0e22c8cf";
var productIds=[];
var indexes=[];
var start= false;
/***** CREATING PRODUCTS **************/
	

/*	fs.readFile('./convertcsv.json', 'utf8',function (err, data) {//reading the input file  
	 	if (err) {
	 		console.log(err+"  11");
	 	}else{
	 		currentPackage=(JSON.parse(data));
	 		Manufacturer={
	 				"id":"Manufacturer68de3c3e-efee-466b-54cb-1c4b2b61d5ba",
	 				"name":"C&C Milano"
	 		};
	 		dependentSchema="Fabric";
	 		console.log(currentPackage.length+" records")
	 		createProduct(0);
	 	}
	 })*/
	
function setData(data,callback){
    var index=0;
    if(!start){
        if(typeof data.index!="number"){
            index=0;
        }else{
            index=data.index;
        }
        start=true;
        console.log("Initializing",index,start);
        indexes=[];
        currentPackage=data.allRecords;
        Manufacturer=data.Manufacturer;
        dependentSchema=data.dependentSchema;
        user=data.user;
        productIds=[];
        if(dependentSchema){
            getDependentProperties(dependentSchema,function(){
                createProduct(index,callback);
            });
        }else{
            //createProduct(index,callback);
        }
    }
}
exports.setData=setData;

function getDependentProperties(dependentSchema,callback){
    cbMasterBucket.get(dependentSchema,function(err,res){
        if(err){
           
        }else{
            var value=res.value;
            dependentProperties=value["@properties"];
        }
        callback();
    })
}
 
function setDependentProperties(record){
    var dpProperties={};
    if(dependentProperties && Object.keys(dependentProperties).length>0){
        Object.keys(dependentProperties).map(function(dp,index){
            if(dependentProperties[dp].dataType.type=="multiPickList"){
                if(record[dp]){
                    if(Array.isArray(record[dp])){
                        dpProperties[dp]=record[dp];
                    }else{
                        dpProperties[dp]=[record[dp]];
                    }
                }else{
                    dpProperties[dp]=[];
                }
            }else{
                if(record[dp]){
                    dpProperties[dp]=record[dp];
                }else{
                    dpProperties[dp]="";
                }
            }
        })
    }
    return dpProperties;
}

function createProduct(index,callback){
    if(index<currentPackage.length && currentPackage[index] && (indexes.indexOf(index) == -1)){
       
        var record=currentPackage[index];
        var recordId="Product-"+global.guid();
        var newRecord={
          "name": record.name,
          "sourceUrl":record.sourceUrl,
          "mfrProductNo":record.mfrProductNo,
          "description":record.description,
          "productImages":(record.productImages && Array.isArray(record.productImages) && record.productImages.length>0 ) ?generateImages(record.productImages,"image",record):(record.productImages && record.productImages.length>0?generateImages([record.productImages],"image",record):[]),
          "attachments":(record.attachments && Array.isArray(record.attachments) && record.attachments.length>0 ) ?generateImages(record.attachments):(record.attachments && record.attachments.length>0?generateImages([record.attachments]):[]),
          "recordId":recordId,
          "org": "public",
          "docType": "Product",
          "author": user,
          "editor": user,
          "dateCreated": global.getDate(),
          "dateModified": global.getDate(),
          "revision": 1,
          "@superType": "Product",
          "@identifier": "name",
          "@derivedObjName": (dependentSchema?(dependentSchema):""),//"Product-Fabric",//have to add manually
          "productType": (dependentSchema?(dependentSchema.replace("Product-","")):""),//have to add manually
          "relationDesc": [
            "Manufacturer-manufactures-recordId",
            "recordId-manufacturedBy-Manufacturer",
            "collection-hasProduct-recordId",
            "recordId-ofCollection-collection",
            "productCategory-hasProduct-recordId",
            "recordId-ofType-productCategory",
            "groupID-has-recordId"
          ],
          "productCategory":record.productCategory,
          "cloudPointHostId": "wishkarma",
          "collection":record.collection,
          "countryOfOrigin":record.countryOfOrigin?record.countryOfOrigin:"",
          "price":record.price?record.price:"",
          "specifications":record.specifications?record.specifications:"",
          "dependentProperties":setDependentProperties(record),
          "$status": "published",
          "@uniqueUserName": record.name.replace(/\W/g,"-").toLowerCase(),
          "esMeta":Manufacturer.name,//update fields  manually
          "Manufacturer":Manufacturer.id,//"Manufacturer68de3c3e-efee-466b-54cb-1c4b2b61d5ba",//update fields  manually
          "metaTitle":generateMeta(record)+" |Wishkarma.com",
          "metaDescription":generateMeta(record)+". Find and chat with local suppliers and dealers near you.",
          "record_header":Manufacturer.name+" "+record.name
      }
        if(record["groupID"]){
            newRecord["groupID"]=record["groupID"];
        }
        if(indexes.indexOf(index)==-1){
            console.log(indexes);
            console.log("************");
            console.log("Creating...."+recordId+"---"+index);
            indexes.push(index);
            createProductImages(newRecord,index,callback)
        }
           
    }else{
        console.log("completed total records"+index);
        if(typeof callback=="function"){
            callback({"productIds":productIds,"message":"All Created Successfully"});
        }
    }
 }
exports.createProduct=createProduct;

function createProductImages(record,productIndex,callback){
    var productImages=record["productImages"];
    var attachments=record["attachments"];
    var allData=productImages.concat(attachments);
    if(allData.length>0){
        addImagesToCloudinary(0);   
    }
    function addImagesToCloudinary(index){
        var url="";
        var id="";
        if(allData[index]){
            if(allData[index].produtImages){
                id=allData[index].produtImages[0].cloudinaryId;
                url=allData[index].produtImages[0].url;
            }else{
                id=allData[index].cloudinaryId;
                url=allData[index].url;
            }
            cloudinary.v2.uploader.upload(url, {"public_id":id},function(err,result) {
                if(err){
                    console.log("product Index "+productIndex);
                   
                    //delete created images and attachments for this product
                    var dRecords=[]
                    for(var i=0;i<index+1;i++){
                        if(allData[index]){
                            if(allData[index].produtImages){
                                dRecords.push(allData[index].produtImages[index].cloudinaryId);
                            }else{
                                dRecords.push(allData[index].cloudinaryId);
                            }
                        }
                    }
                    cloudinary.v2.api.delete_resources(dRecords,function(error, result){
                        if(error){
                            console.log(error);
                        }else{
                            console.log(result);
                        }
                        callback({"productIds":productIds,"message":"Error at image uploading in "+(productIndex+1)+" at "+(index+1)+" image or attachment","index":productIndex,"error":true});
                    });
                }else{
                    addImagesToCloudinary(index+1,productIndex);
                }
            });
           
        }else if(index+1 > allData.length){
            cbContentBucket.upsert(record["recordId"],record,function(err, result) {
                if (err) {
                    console.log(err+"--"+"--"+productIndex);
                    callback({"productIds":productIds,"message":"Error at creation in "+(productIndex+1),"error":true,"index":productIndex});
                }else{
                    console.log("Success "+record["recordId"]+"--"+productIndex);
                    productIds.push(record["recordId"]);
                    createProduct(productIndex+1,callback);
                }
            })
           
        }
    }
}
             
 function generateMeta(record){
    return (Manufacturer.name+" "+record.name+" "+(record.mfrProductNo?record.mfrProductNo:""));//update fields  manually
}

function generateImages(imageUrl,type,record){
    var productImages=[];
    var flag=false;
    for(var i=0;i<imageUrl.length;i++){
            var id=global.guid();
            var temp={
                      "cloudinaryId":id,
                      "imageName":id ,
                     "caption": record?generateMeta(record):"",
                      "url": imageUrl[i]
                    };
            if(type=="image"){
                productImages.push({
                    "produtImages": [temp],
                    "variant": ""
                });
            }else{
                productImages.push(temp);
            }
    }
    return     productImages;   
}





/**************deleting products with ids*******************/
/*

	var products=["Product-36457114-1d86-72b0-6fbf-5d9fd3102aa1----0","Product-81c9f8f6-6168-8f2e-3490-1d4439ae64d1----1","Product-e558dab6-fd4c-dad3-fe59-dc71e48758a7----2","Product-be7a7331-1975-0df7-9123-f2e10a9b336c----3","Product-ed634181-acbd-f93b-68df-4e63dd648e88----4","Product-51be35f6-8a31-d5e6-f2d8-a3a884ff0c98----5","Product-f9c4289b-1951-11fa-1c63-497c8317b219----6","Product-837c6fdb-1646-d4da-17cc-3c37f02ed854----7","Product-f727de02-34da-8ec0-e50a-4d913951dc25----8","Product-91574a60-5d3c-8c3e-504a-e261e1c4d87f----9","Product-4fc4efcf-bae3-a183-6bb4-abc75723324c","Product-17a3f588-b6f0-7eac-a83c-d4a19176ff33","Product-b594a699-9db2-9c51-7c30-a7a12f5895ee","Product-75e3e7ed-9644-6906-edeb-99de12d85325","Product-f3c203ce-3994-36a4-624f-e6fab67730ad","Product-d7d1f667-45a1-34f8-a5b8-93a2e9334e87","Product-39062907-9ab2-2fc5-8f35-13eab1f2a776","Product-90efb91d-a055-5573-5586-7b16fefb53b6","Product-c01e04a8-250b-ee02-db0c-a8a2fddf3e36","Product-5ce60a50-67ef-0588-ad08-8af5e2e0e27a","Product-6fa0d1c4-d8ed-3d8b-af68-df9e7a25d76b","Product-724e7c0b-6e2c-8108-bfbf-c191070e1145","Product-24d27f6e-df65-be74-cb4d-9d7b84c8e943","Product-5ad96353-78a8-e383-b57b-db71627b2f39","Product-34b7d2a8-82b0-8194-498c-05cee6c0a818","Product-74be2f16-5f92-09b0-63eb-33a423f57f7b","Product-2dd37777-ebbd-1a13-a705-29525b2f1390","Product-d56acc3f-37c8-e021-6386-a53dc9971657","Product-1335dea2-fae4-6337-f0a8-737b830f8a37","Product-5c4b5296-99d8-4188-82c3-93d1cdc7fe2c","Product-dd7f026a-427c-79f2-a446-dba04bf1c3fa","Product-d2836493-a314-a643-efa7-d17f008070a3","Product-d6e67084-abd7-bf56-ea3a-b58f5de2550f","Product-d2861fb2-8467-16fa-5fd9-8b90723e3109","Product-a3c0f4b5-d0d2-698e-6877-8a2c83a5d4e9","Product-49f5cf32-c7d4-0e18-d54a-e5acf2953935","Product-9f4c45d8-3ea3-8f41-6529-d5078ed61e8f","Product-6367e3cf-984a-ea78-b975-eec7368799b3","Product-63fa95fc-75c9-bba1-c595-d7a4b6d37bfd","Product-fd055937-a53e-0d2f-b1a8-49d0c8409fce","Product-097e9888-bd0c-ad1e-cae6-42747daa8d54","Product-78697e55-a7a6-9015-d525-db890581dfd4","Product-f854ae5a-cafd-96ad-442e-093858d298c5","Product-7fc610a0-07e7-93d5-c5b2-c7277325ceb0","Product-1397ba25-1f49-9a94-ec33-9a703d1bce17","Product-c6609b10-3773-7013-696b-accff7f2e586","Product-858364cd-82d1-7789-f6db-14fc30326742","Product-fe1d24a7-afab-478f-09c6-6ac47ae85d0f","Product-c34e46d7-701d-2df3-4f42-2700d7ce193e","Product-f4c26428-3c86-c122-5942-9b7e5cb2ab43","Product-7e666513-c2f0-7eee-d3e5-cd519919d73a","Product-102ffa16-7de7-880f-b315-d6740f1c6108","Product-31a03bd7-8e09-8e54-472b-7da25b307130","Product-c031090a-d32c-c764-3f10-afbbb5b33542","Product-30ed094a-4742-acea-5c26-2be6da2e5fd7","Product-aec4b656-0d08-fb9a-3bc1-b82694c4b6e1","Product-543f8645-a6d3-859a-b211-4e0fd56f252b","Product-a581833a-6c74-75f2-f7d2-08ae92f2525f","Product-f3cc94b1-8d20-8ca8-8703-fbfc536ca5bb","Product-d1e92163-a44a-dcfb-c30c-53f3ba133d42","Product-c080b75a-99a1-3b9f-4296-b0dbf26b9ca1","Product-b7199da7-9a21-6b8d-eefd-fc4c726797ab","Product-1f76e8b8-57b7-faa8-bc51-55c35f990156","Product-805c7f04-cf08-4861-d8a3-bbf3700326ff","Product-849d09b4-87d4-57c3-2d28-6f5520f2729d","Product-dd3d0101-f14c-76ee-70a6-ec0cd42586d6","Product-1fc2eba8-3aec-1a3d-046c-75a04bf74e7e","Product-fbc65a46-3358-38a6-c974-576d9642b469","Product-11247682-7c93-d9c4-4c7d-479f555d2faa","Product-974fa288-3010-3397-821b-57cb5f054a4d","Product-c03676bd-e817-248c-3c02-5eead50e7a20","Product-d92ad3f1-334c-0cf7-2a3f-64a3dba9b44d","Product-10621768-8332-11ec-5f80-0dee2a8a0721","Product-62ec2aa3-ff41-7fa8-1069-e63da0b9e4d5","Product-6d91f5d7-8a86-6d36-d750-826b87360115","Product-4fcd5982-17d0-3400-5e8d-3ce49bfbb89a","Product-9184ac86-ed9c-f07e-0b82-c00629be1878","Product-27f83f7c-3a47-85f9-b706-6d6f920c2743","Product-b8df78a9-417a-9f9e-dbe7-d32bbaf9a716","Product-006f8cc6-a132-1636-7b8d-aab22679ccf4","Product-bdfb75b9-5fc2-51bf-746a-1809e9e52502","Product-924e34c6-f954-289c-5fa0-e1ecb5b6165b","Product-ee623bdd-688b-fe32-023e-309311c8614d","Product-2a412dde-7504-6c56-3125-59b4d0dd45a3","Product-08c194b0-0608-f058-5778-a7afff42e87d","Product-3c739687-a8a3-3173-dfcf-d28cfdba1bd8","Product-6e745a75-faa9-0380-c5f6-54aa13820527","Product-85d6296c-793a-fe51-8e27-04b9c49a9778","Product-66435ff0-f542-88c0-85f9-cc9dfe51a518","Product-6a95abb6-a986-aad1-ba71-318cc573570b","Product-12859015-ac1e-5087-b35c-4faf488afd38","Product-d7c87430-47fd-3cad-7424-d029c7919f92","Product-4cf1136c-f593-bc81-88fd-3e92f46c9f9e","Product-7eac8d6b-28d3-6392-bff7-218640640c31","Product-b4866267-a3ec-127a-7985-9a3b88c8a05e","Product-638d975d-9359-cfe2-47a5-201727989c24","Product-e31da41c-6a83-c370-b76d-d49aa8a2fc19","Product-ac2bccb0-42fd-2f06-eb02-93cb43e1d957","Product-a5d32bad-3ff5-854a-9364-d1a3ce960220","Product-a745f714-d09c-8f01-f1d2-7b938db16a0d"]          
	console.log(products.length)
	products.forEach(function(record,index){
				cbContentBucket.remove(record,function(err, result) {
					if (err) { console.log(err); }
					console.log(record +" removed")
				});
				
				
	})

/*** Update Products With Ids and added json*****/
/*
function generateMeta(record){
	return ("C&C Milano "+record.name+" "+(record.mfrProductNo?record.mfrProductNo:""));//update fields  manually
}
fs.readFile('./errorProductIds.json', 'utf8',function (err, pData) {//reading the input file products
		var products=JSON.parse(pData);
		if(Array.isArray(products) && products.length>0){            
			fs.readFile('./errorProductJson.json', 'utf8',function (err, data) {//reading the input file  
			 	if (err) {
			 		console.log(err+"  11");
			 	}else{
			 	currentPackage = JSON.parse(data);
			 	console.log(currentPackage.length)
			 		currentPackage.forEach(function(record,index){
			 			if(index>39)
				 		cbContentBucket.get(products[index],function(err,res){
							if(err){
								console.log({error:"error while updating new id"+products[index]});
							}else{
								var newRecord=res.value;
							//	newRecord["productCategory"]=record.productCategory;
								//newRecord["collection"]=record.collection;
								//newRecord["mfrProductNo"]=record.mfrProductNo;
								//newRecord["@uniqueUserName"]=record.name.replace(/\W/g,"-").toLowerCase();
								//delete newRecord["uniqueUserName"];
								//newRecord["$status"]="published";
								//newRecord["productType"]="WashbasinFaucet"
								//newRecord["@derivedObjName"]="Product-WashbasinFaucet"
								//newRecord["dependentProperties"]["holes"]=record["holes"];
								
								var productImages=[];
								var flag=false;
								var id=global.guid();
								var temp={
								          "cloudinaryId":id,
								          "imageName":id ,
								         "caption": record?generateMeta(record):"",
								          "url": record["productImages"]
										};
								
									productImages.push({
										"produtImages": [temp],
									    "variant": ""
									});
								
								cloudinary.v2.uploader.upload(record["productImages"].toString(), {"public_id":id},function(error,result) { 
									if(error){
										if(errorIndex.indexOf(index)==-1){
											console.log(""+"failure "+products[index]+"--"+index)
											errorIndex.push(index);
											errorProductIds.push(products[index]);
											errorProductJson.push(record)
											writeFile(index);
										}
									}else{
										writeFile(index);
										console.log("image success "+products[index])
									}
								});
								newRecord["productImages"]=productImages;
								var flag=true;
								if(flag){
									flag=false;
									cbContentBucket.upsert(products[index],newRecord,function(err, result) {
										if (err) { console.log(err);}else{ console.log("Success "+products[index]) }
									});
								}
							}
						});
			 		
					})
					function writeFile(index){
						var encoding = "utf8";
						if(index==(currentPackage.length-1)){
							setTimeout(function(){
								fs.writeFile('./productsNEW.json', JSON.stringify(errorProductIds,null,4), encoding, (err) => {
								    if (err) throw err;
				
								    console.log("The file was succesfully saved! errorProductIds");
								});
								fs.writeFile('./convertcsvNEW.json', JSON.stringify(errorProductJson,null,4), encoding, (err) => {
								    if (err) throw err;
				
								    console.log("The file was succesfully saved! errorProductJson");
								});
							},3000)
						}
					}
				}
			})
		}
	})*/

