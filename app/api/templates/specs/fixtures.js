export default {
  "docs":[
    {"_id":"_design/templates","language":"javascript","views":{"all":{"map":"function(doc) {\nif(doc.type === 'template')\t\n  emit(doc._id, doc);\n}"}}},
    {"_id":"_design/documents","language":"javascript","views":{
      "count_by_template":{
        "map":"function(doc) {\nif(doc.type === 'document' && doc.template)\t\n  emit(doc.template, 1);\n}",
        "reduce": "_sum"
      },
    }
    },
    {"_id":"c08ef2532f0bd008ac5174b45e033c93", "type":"template","name":"template_test"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c94", "type":"template","name":"template_test2"}
  ]
}
