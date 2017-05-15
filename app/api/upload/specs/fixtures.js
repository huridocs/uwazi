//export default {
  //"docs":[
    //{"_id":"8202c463d6158af8065022d9b5014ccb", "sharedId": "id", "language": "es", "type":"document","title":"Gadgets 01 ES"},
    //{"_id":"8202c463d6158af8065022d9b5014cc1", "sharedId": "id", "language": "en", "type":"document","title":"Gadgets 01 EN"},
    ////settings
    //{"_id":"c08ef2532f0bd008ac5174b45e033c02","type":"settings", "languages": [{key: 'es'}, {key: 'en'}]}
  //]
//};
//
import db from 'api/utils/testing_db';

const entityId = db.id();

export default {
  entities: [
    {_id: entityId, sharedId: 'id', language: 'es', title: 'Gadgets 01 ES', toc: [{_id: db.id(), label: 'existingToc'}]},
    {_id: db.id(), sharedId: 'id', language: 'en', title: 'Gadgets 01 EN'}
  ]
};

export {
  entityId
};
