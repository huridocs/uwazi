import db from 'api/utils/testing_db';

let against = db.id();
let canNotBeDeleted = db.id();

export default {
  relationtypes: [
    {_id: against, name: 'Against', properties: []},
    {_id: db.id(), name: 'Suports', properties: []},
    {_id: canNotBeDeleted, name: 'Related', properties: []}
  ],
  connections: [
    {_id: db.id(), title: 'reference1', sourceDocument: 'source1', template: canNotBeDeleted}
  ]
};

export {
  against,
  canNotBeDeleted
};
