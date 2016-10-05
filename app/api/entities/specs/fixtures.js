export default {
  "docs":[
    {"_id":"8202c463d6158af8065022d9b5014a18", "type":"entity", "language": "en", "title":"Batman finishes", "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"8202c463d6158af8065022d9b5014ccb", "sharedId": "shared", "language": "en", "type":"entity","title":"Penguin almost done", "creationDate": '1', "published": true, "user" : {"_id": "c08ef2532f0bd008ac5174b45e033c93"}},
    {"_id":"d0298a48d1221c5ceb53c4879301507f", "type":"entity","title":"Right there", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c95"}},
    {"_id":"d0298a48d1221c5ceb53c4879301508f", "type":"entity","title":"unpublished", "user":{"_id": "c08ef2532f0bd008ac5174b45e033c94"}},
    // metadata property name changes
    {"_id":"d0298a48d1221c5ceb53c48793015080", "type":"entity", "sharedId": "sharedId", "language": "en", "title":"doc1", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015083", "type":"entity", "sharedId": "sharedId", "language": "es", "title":"doc1", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015081", "type":"entity", "sharedId": "sharedId2", "language": "en","title":"doc2", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    {"_id":"d0298a48d1221c5ceb53c48793015082", "type":"entity","title":"doc3", "template": 'template2', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    //references
    {"_id":"c08ef2532f0bd008ac5174b45e033c00","type":"reference", "title":"reference1", "sourceDocument": "8202c463d6158af8065022d9b5014a18", relationtype: 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c01","type":"reference", "title":"reference2", "sourceDocument": "source2", relationtype: 'relation2', "targetDocument": "8202c463d6158af8065022d9b5014a18"},
    //settings
    {"_id":"c08ef2532f0bd008ac5174b45e033c02","type":"settings", "languages": [{key: 'es'}, {key: 'en'}]}
  ]
};
