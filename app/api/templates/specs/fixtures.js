export default {
  "docs":[
    {"_id":"_design/templates","language":"javascript","views":{"all":{"map":"function(doc) {\nif(doc.type === 'template')\t\n  emit(doc._id, doc);\n}"}}}
  ]
}
