export default {
  "docs":[
    {"_id":"_design/documents","language":"javascript","views":{
      "all":{"map":"function(doc) {\nif(doc.type === 'document')\t\n  emit(doc._id, doc);\n}"},
      "count_by_template":{
        "map":"function(doc) {\nif(doc.type === 'document' && doc.template)\t\n  emit(doc.template, 1);\n}",
        "reduce": "_sum"
      },
      "metadata_by_template":{"map":"function(doc) {\nif(doc.type === 'document')\t\n  emit(doc.template, {_id: doc._id, metadata: doc.metadata});\n}"},
      "list":{"map":"function(doc) {\nif(doc.type === 'document' && doc.published === true)\t\n  emit(doc._id, {title:doc.title, _id: doc._id});\n}"},
      "uploads":{"map":"function(doc) {\nif(doc.type === 'document' && !doc.published)\t\n  emit(doc.user._id, {title:doc.title, _id: doc._id});\n}"},
      "conversions": {"map": "function(doc) { if(doc.type === 'conversion') { emit(doc.document, doc); } }"}
      },
      "updates":{ "partialUpdate": "function(doc, req) { if (!doc) { return [ null, JSON.stringify({ status: 'nodoc' }) ]; } _ref = JSON.parse(req.body); for (k in _ref) { v = _ref[k]; if (k[0] === '/') { nestedDoc = doc; nestedKeys = k.split('/'); _ref1 = nestedKeys.slice(1, -1); for (_i = 0, _len = _ref1.length; _i < _len; _i++) { nestedKey = _ref1[_i]; nestedDoc = ((_ref2 = nestedDoc[nestedKey]) != null ? _ref2 : nestedDoc[nestedKey] = {}); } k = nestedKeys.slice(-1)[0]; if (v === '__delete__') { delete nestedDoc[k]; } else { nestedDoc[k] = v; } continue; } if (v === '__delete__') { delete doc[k]; } else { doc[k] = v; } } return [ doc, JSON.stringify({id:doc._id}) ]; }" }
    },
    {"_id":"8202c463d6158af8065022d9b5014a18", "type":"document","title":"Batman finishes", "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"8202c463d6158af8065022d9b5014ccb", "type":"document","title":"Penguin almost done", "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"d0298a48d1221c5ceb53c4879301507f", "type":"document","title":"Right there", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c95"}},
    {"_id":"d0298a48d1221c5ceb53c4879301508f", "type":"document","title":"unpublished", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c94"}},
    {"_id":"d0298a48d1221c5ceb53c48793015098", "type":"conversion","document":"docId", "css": '.selector1 {} .selector2 {}'},
    // metadata property name changes
    {"_id":"d0298a48d1221c5ceb53c48793015080", "type":"document","title":"doc1", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015081", "type":"document","title":"doc2", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015082", "type":"document","title":"doc3", "template": 'template2', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}}
  ]
}

