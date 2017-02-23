import {db} from 'api/utils';

let against = db.id();
let canNotBeDeleted = db.id();

export default {
  relationtypes: [
    {_id: against, name: 'Against'},
    {_id: db.id(), name: 'Suports'},
    {_id: canNotBeDeleted, name: 'Related'}
  ],
  connections: [
    {_id: db.id(), title: 'reference1', sourceDocument: 'source1', relationType: canNotBeDeleted.toString()}
  ]
};

export {
  against,
  canNotBeDeleted
};
