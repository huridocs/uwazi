export default {
  "docs":[
    {"_id":"_design/documents","language":"javascript","views":{
      "all":{"map":"function(doc) {\nif(doc.type === 'document')\t\n  emit(doc._id, doc);\n}"},
      "conversions": {"map": "function(doc) { if(doc.type === 'conversion') { emit(doc.document, doc); } }"}
    }},
    {"_id":"8202c463d6158af8065022d9b5014ccb", "type":"document","title":"Gadgets 01"}
  ]
}
