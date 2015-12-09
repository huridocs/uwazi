export default {
  "docs":[
    {"_id":"_design/templates","language":"javascript","views":{"all":{"map":"function(doc) {\nif(doc.type === 'template')\t\n  emit(doc._id, doc);\n}"}}},
    {"_id":"c08ef2532f0bd008ac5174b45e033c93", "type":"template","name":"template_test"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c94", "type":"template","name":"template_test2"}
  ]
}
