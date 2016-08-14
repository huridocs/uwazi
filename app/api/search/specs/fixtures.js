export default {
  "docs":[
    {"_id":"8202c463d6158af8065022d9b5014a18", "type":"document","title":"Batman finishes", "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}, file: {filename: '8202c463d6158af8065022d9b5014a18.pdf'}},
    {"_id":"8202c463d6158af8065022d9b5014ccb", "type":"entity","title":"Penguin almost done", "creationDate": '1', "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"d0298a48d1221c5ceb53c4879301507f", "type":"document","title":"Right there", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c95"}},
    {"_id":"d0298a48d1221c5ceb53c4879301508f", "type":"document","title":"unpublished", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c94"}},
    {"_id":"d0298a48d1221c5ceb53c48793015098", "type":"conversion","document":"docId", "css": '.selector1 {} .selector2 {}'},
    // metadata property name changes
    {"_id":"d0298a48d1221c5ceb53c48793015080", "type":"document","title":"doc1", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015081", "type":"document","title":"doc2", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015082", "type":"document","title":"doc3", "template": 'template2', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    //references
    {"_id":"c08ef2532f0bd008ac5174b45e033c00","type":"reference", "title":"reference1", "sourceDocument": "8202c463d6158af8065022d9b5014a18", relationtype: 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c01","type":"reference", "title":"reference2", "sourceDocument": "source2", relationtype: 'relation2', "targetDocument": "8202c463d6158af8065022d9b5014a18"},
    //conversion
    {"_id": "a9a88a38dbd9fedc9d5051741a14a1d9","document": "8202c463d6158af8065022d9b5014a18","type": "conversion","pages": []}
  ]
};
