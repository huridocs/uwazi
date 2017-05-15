import db from 'api/utils/testing_db';

const batmanFinishesId = db.id();
const syncPropertiesEntityId = db.id();
const templateId = db.id();
const referenceId = db.id();

export default {
  entities: [
    {_id: batmanFinishesId, sharedId: 'shared', template: templateId, language: 'en', title: 'Batman finishes', published: true, user: {username: 'username'}, file: {filename: '8202c463d6158af8065022d9b5014cc1.pdf', originalname: 'Batman original.jpg'}},
    {_id: db.id(), sharedId: 'shared', language: 'es', title: 'Penguin almost done', creationDate: 1, published: true, user: {username: 'username'}, file: {filename: '8202c463d6158af8065022d9b5014ccb.pdf'}},
    {
      _id: db.id(), sharedId: 'shared', language: 'pt', title: 'Penguin almost done', creationDate: 1, published: true, metadata: {text: 'test'},
      user: {username: 'username'}
    },
    //select/multiselect/date sync
    {_id: syncPropertiesEntityId, template: templateId, sharedId: 'shared1', language: 'en', title: 'EN', published: true, metadata: {text: 'text'}, user: {username: 'username'}},
    {_id: db.id(), template: templateId, sharedId: 'shared1', language: 'es', title: 'ES', creationDate: 1, published: true, metadata: {text: 'text'}, user: {username: 'username'}},
    {_id: db.id(), template: templateId, sharedId: 'shared1', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {text: 'text'}, user: {username: 'username'}}
  ],
  settings: [
    {_id: db.id(), languages: [{key: 'es'}, {key: 'pt'}, {key: 'en'}]}
  ],
  templates: [
    {_id: templateId, name: 'template_test', properties: [
      {type: 'text', name: 'text'},
      {type: 'select', name: 'select'},
      {type: 'multiselect', name: 'multiselect'},
      {type: 'date', name: 'date'},
      {type: 'multidate', name: 'multidate'},
      {type: 'multidaterange', name: 'multidaterange'}
    ]
    }
  ],
  connections: [
    {_id: referenceId, title: 'reference1', sourceDocument: 'shared', relationtype: 'relation1'},
    {_id: db.id(), title: 'reference2', sourceDocument: 'source2', relationtype: 'relation2', targetDocument: 'shared'},
    {_id: db.id(), title: 'reference3', sourceDocument: 'another', relationtype: 'relation3', targetDocument: 'document'}
  ]
};

export {
  batmanFinishesId,
  syncPropertiesEntityId,
  templateId
};
