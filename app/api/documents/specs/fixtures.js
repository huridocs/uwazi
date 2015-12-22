export default {
  "docs":[
    {"_id":"_design/documents","language":"javascript","views":{"all":{"map":"function(doc) {\nif(doc.type === 'document')\t\n  emit(doc._id, doc);\n}"}}},
    {"_id":"8202c463d6158af8065022d9b5014a18", "type":"document","title":"Batman finishes"},
    {"_id":"8202c463d6158af8065022d9b5014ccb", "type":"document","title":"Penguin almost done"}
  ]
}
