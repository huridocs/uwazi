export default {
  "docs":[
    {"_id":"_design/documents","language":"javascript","views":{"all":{"map":"function(doc) {\nif(doc.type === 'document')\t\n  emit(doc._id, doc);\n}"}}}
  ]
}
