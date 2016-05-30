export default {
  docs: [
    {
      _id: '8202c463d6158af8065022d9b5014a18',
      type: 'relationtype',
      name: 'Against'
    },
    {
      _id: '8202c463d6158af8065022d9b5014ccb',
      type: 'relationtype',
      name: 'Suports'
    },
    {
      _id: 'd0298a48d1221c5ceb53c4879301507f',
      type: 'relationtype',
      name: 'Related'
    },
    //reference for testing delete
    {_id: '_design/references', language: 'javascript', views: {
      "count_by_relation_type":{
        "map":"function(doc) {\nif(doc.type === 'reference' && doc.relationtype)\t\n  emit(doc.relationtype, 1);\n}",
        "reduce": "_sum"
      }
    }
    },
    {_id: 'c08ef2532f0bd008ac5174b45e033c00', type: 'reference', title: 'reference1', sourceDocument: 'source1', relationtype: '8202c463d6158af8065022d9b5014ccb'}
  ]
};
