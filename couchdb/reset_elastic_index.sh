#!/bin/bash

echo "Removing ${1:-uwazi_development} index"
curl -X DELETE http://185.26.125.86:9200/${1:-cejil}/
echo -e "\n\nCreating ${1:-uwazi_development} index"
curl -X PUT http://185.26.125.86:9200/${1:-cejil}/ -d '
{
  "settings": {
    "analysis": {
      "analyzer": {
        "folding": {
          "tokenizer": "keyword",
          "filter":  [ "lowercase", "asciifolding" ]
        },
        "tokenizer": {
          "tokenizer": "standard",
          "filter":  [ "lowercase", "asciifolding" ]
        }
      }
    }
  },
  "mappings" : {
    "_default_" : {
      "_all" : {"enabled" : true, "omit_norms" : true},
      "dynamic_templates" : [ {
        "message_field" : {
          "match" : "message",
          "match_mapping_type" : "string",
          "mapping" : {
            "type" : "string", "index" : "analyzed", "omit_norms" : true,
            "fielddata" : { "format" : "disabled" }
          }
        }
      }, {
        "fullText_fields" : {
          "path_match" : "doc.fullText",
          "match_mapping_type" : "string",
          "mapping" : {
            "type" : "string",
            "index" : "analyzed",
            "omit_norms" : true,
            "analyzer": "standard",
            "fielddata" : { "format" : "enabled" },
            "fields" : {
              "raw" : {"type": "string", "index" : "not_analyzed", "doc_values" : true, "ignore_above" : 256}
            }
          }
        }
      }
      , {
        "string_fields" : {
          "match" : "*",
          "match_mapping_type" : "string",
          "mapping" : {
            "type" : "string",
            "index" : "analyzed",
            "omit_norms" : true,
            "analyzer": "tokenizer",
            "fielddata" : { "format" : "enabled" },
            "fields" : {
              "raw" : {"type": "string", "analyzer": "folding"}
            }
          }
        }
      }
      , {
        "float_fields" : {
          "match" : "*",
          "match_mapping_type" : "float",
          "mapping" : { "type" : "float", "doc_values" : true }
        }
      }, {
        "double_fields" : {
          "match" : "*",
          "match_mapping_type" : "double",
          "mapping" : { "type" : "double", "doc_values" : true }
        }
      }, {
        "byte_fields" : {
          "match" : "*",
          "match_mapping_type" : "byte",
          "mapping" : { "type" : "byte", "doc_values" : true }
        }
      }, {
        "short_fields" : {
          "match" : "*",
          "match_mapping_type" : "short",
          "mapping" : { "type" : "short", "doc_values" : true }
        }
      }, {
        "integer_fields" : {
          "match" : "*",
          "match_mapping_type" : "integer",
          "mapping" : { "type" : "integer", "doc_values" : true }
        }
      }, {
        "long_fields" : {
          "match" : "*",
          "match_mapping_type" : "long",
          "mapping" : { "type" : "long", "doc_values" : true },
          "fields" : {
            "raw" : {"type": "string", "analyzer": "folding"}
          }
        }
      }, {
        "date_fields" : {
          "match" : "*",
          "match_mapping_type" : "date",
          "mapping" : { "type" : "date", "doc_values" : true }
        }
      }, {
        "geo_point_fields" : {
          "match" : "*",
          "match_mapping_type" : "geo_point",
          "mapping" : { "type" : "geo_point", "doc_values" : true }
        }
      }, {
        "nested_fields" : {
          "match_mapping_type": "object",
          "path_match" : "doc.metadata.*",
          "path_unmatch" : "doc.metadata.*.*",
          "mapping" : {"type" : "nested"}
        }
      }],
      "properties" : {
        "@timestamp": { "type": "date", "doc_values" : true },
        "@version": { "type": "string", "index": "not_analyzed", "doc_values" : true },
        "geoip"  : {
          "type" : "object",
          "dynamic": true,
          "properties" : {
            "ip": { "type": "ip", "doc_values" : true },
            "location" : { "type" : "geo_point", "doc_values" : true },
            "latitude" : { "type" : "float", "doc_values" : true },
            "longitude" : { "type" : "float", "doc_values" : true }
          }
        }
      }
    }
  }
}
'
