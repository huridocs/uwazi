export default {
  "docs":[
    {"_id":"_design/documents","language":"javascript","views":{
      "all":{"map":"function(doc) {\nif(doc.type === 'document')\t\n  emit(doc._id, doc);\n}"},
      "list":{"map":"function(doc) {\nif(doc.type === 'document' && doc.published === true)\t\n  emit(doc._id, {title:doc.title, _id: doc._id});\n}"},
      "uploads":{"map":"function(doc) {\nif(doc.type === 'document' && !doc.published)\t\n  emit(doc.user._id, {title:doc.title, _id: doc._id});\n}"}
    }},
    {"_id":"8202c463d6158af8065022d9b5014a18", "type":"document","title":"Batman finishes", "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"8202c463d6158af8065022d9b5014ccb", "type":"document","title":"Penguin almost done", "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"d0298a48d1221c5ceb53c4879301507f", "type":"document","title":"Right there", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c93"}}
  ]
}
