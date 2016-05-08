export default {
  "docs":[
    {
      "_id":"_design/references","language":"javascript","views":{
        "all":{"map":"function(doc) {\nif(doc.type === 'reference')\t\n  emit(doc._id, doc);\n}"},
        "by_source_document":{"map":"function(doc) {\nif(doc.type === 'reference')\t\n  emit(doc.sourceDocument, doc);\n}"},
        "count_by_relation_type":{
          "map":"function(doc) {\nif(doc.type === 'reference' && doc.relationtype)\t\n  emit(doc.relationtype, 1);\n}",
          "reduce": "_sum"
        }
      }
    },

    {"_id":"c08ef2532f0bd008ac5174b45e033c00","type":"reference", "title":"reference1", "sourceDocument": "source1", relationtype: 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c01","type":"reference", "title":"reference2", "sourceDocument": "source2", relationtype: 'relation2'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c02","type":"reference", "title":"reference3", "sourceDocument": "source1", relationtype: 'relation2'}
  ]
};
