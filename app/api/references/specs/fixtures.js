export default {
  "docs":[
    {"_id":"_design/references","language":"javascript","views":{"all":{"map":"function(doc) {\nif(doc.type === 'reference')\t\n  emit(doc._id, doc);\n}"}}}
  ]
}
