
curl -XPUT 'http://22222:9200/wk_prod/' -d '
{
  "settings":{
     "index":{
        "analysis":{
           "analyzer":{
              "lowercase_analizer":{
                  "tokenizer":"whitespace",
                  "filter":"lowercase"
              }
           }
        }
     }
  },
  "mappings":{
    "_default_" : {
          "dynamic":false,
          "_source": {
            "includes": ["meta.*","author","docType","doc"]
          },
          "properties" : {
            "meta":{
              "include_in_all":false,
              "type":"object" 
            },
            "doc":{
               "dynamic":false,
                "properties":{
                    "recordId":{"type": "string","analizer":"lowercase_analizer"},
                    "$status":{"type": "string","analizer":"lowercase_analizer"},
                    "@uniqueUserName":{"type": "string","analizer":"lowercase_analizer"},
                    "author": {"type": "string","analizer":"lowercase_analizer"},
                    "docType": {"type": "string","analizer":"lowercase_analizer"},
                    "mfrProductNo": {"type": "string","analizer":"lowercase_analizer"},
                    "about": {"type": "string","analizer":"lowercase_analizer"},
                    "name": {"type": "string","analizer":"lowercase_analizer"},
                    "productType": {"type": "string","analizer":"lowercase_analizer"},
                    "tags":{"type": "string","analizer":"lowercase_analizer"},
                    "mfrProCatName":{"type": "string","analizer":"lowercase_analizer"},
                    "mfrprocatcity":{"type": "string","analizer":"lowercase_analizer"},
                    "esMeta":{"type":"string","analizer":"lowercase_analizer"},
                    "categoryName":{"type":"string","analizer":"lowercase_analizer"},
                    
                    "description":{"type":"string","analizer":"lowercase_analizer"},
                    "specification":{"type":"string","analizer":"lowercase_analizer"},
                    
                    
                    "dependentProperties":{
                      "dynamic":true,
                      "type":"object"
                     }
                }
              }
           }
        }
     }
}'


curl -XPUT 'http://ip:9200/wk_prod_summary_index/' -d '
{
  "settings":{
     "index":{
    	 "mapping": {
             "ignore_malformed": true
         },
         "analysis":{
           "analyzer":{
              "default":{
                  "type":"keyword"
              }
           }
        }
     }
  },
  "mappings":{
    "_default_" : {
          "dynamic":true,
          "_source": {
            "includes": ["meta.*","author","docType","doc"]
          }
        }
     }
}'

curl -XPUT 'http://35.154.222.149:9200/attachments/' -d '
{"mappings": {
    "_default_": {
      "dynamic": "false",
      "_source": {
        "includes": [
          "meta.*",
          "content",
          "date",
          "name",
          "type",
          "docType",
          "publisher"
        ]
      },
      "properties": {
        "content": {
          "type": "attachment",
          "path": "full",
          "fields": {
            "content": {
              "type": "string",
              "store": true
            },
            "author": {
              "type": "string",
              "store": true
            },
            "title": {
              "type": "string",
              "store": true
            },
            "name": {
              "type": "string"
            },
            "date": {
              "type": "string",
              "store": true
            },
            "keywords": {
              "type": "string",
              "store": true
            },
            "content_type": {
              "type": "string"
            },
            "content_length": {
              "type": "integer"
            },
            "language": {
              "type": "string"
            }
          }
        },
        "date": {
          "type": "date",
          "format": "dateOptionalTime"
        },
        "meta": {
          "type": "object",
          "include_in_all": false
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "docType": {
          "type": "string"
        },
        "publisher": {
          "type": "string"
        }
      }
    },
    "document": {
      "dynamic": "false",
      "_source": {
        "includes": [
          "meta.*",
          "content",
          "date",
          "name",
          "type",
          "docType",
          "publisher"
        ]
      },
      "properties": {
        "content": {
          "type": "attachment",
          "path": "full",
          "fields": {
            "content": {
              "type": "string",
              "store": true
            },
            "author": {
              "type": "string",
              "store": true
            },
            "title": {
              "type": "string",
              "store": true
            },
            "name": {
              "type": "string"
            },
            "date": {
              "type": "string",
              "store": true
            },
            "keywords": {
              "type": "string",
              "store": true
            },
            "content_type": {
              "type": "string"
            },
            "content_length": {
              "type": "integer"
            },
            "language": {
              "type": "string"
            }
          }
        },
        "date": {
          "type": "date",
          "format": "dateOptionalTime"
        },
        "meta": {
          "type": "object",
          "include_in_all": false
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "docType": {
          "type": "string"
        },
        "publisher": {
          "type": "string"
        }
      }
    }
  }
}


'





DROP INDEX audit.`#primary`;
CREATE PRIMARY INDEX `#primary` ON `audit`;

DROP INDEX audit.wk_sortDate;
CREATE INDEX `wk_sortDate` ON `audit`(`$sortDate`);

DROP INDEX records.wk_docType;
CREATE INDEX `wk_docType` ON `records`(`docType`);

DROP INDEX records.wk_name;
CREATE INDEX `wk_name` ON `records`(`name`);

DROP INDEX records.wk_status;
CREATE INDEX `wk_status` ON `records`(`$status`);

DROP INDEX records.wk_productType;
CREATE INDEX `wk_productType` ON `records`(`productType`);

DROP INDEX records.wk_productCategory;
CREATE INDEX `wk_productCategory` ON `records`(`productCategory`);



Product|Manufacturer|Supplier|Provider|User|Developer|ServiceProvider|MfrProCat|MfrProCatCity|ProductCategory|collection|Project
