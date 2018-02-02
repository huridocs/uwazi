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
