//export default {
  //docs: [
    //{_id: '8abcc463d6158af8065022d9b5014a18', attachments: [{filename: 'other.doc'}, {filename: 'toDelete.txt', originalname: 'common name 1.not'}]},
    //{_id: '8abcc463d6158af8065022d9b5014a19', attachments: [{filename: 'other.doc'}, {filename: 'match.doc', originalname: 'common name 2.not'}]}
  //]
//};

import {db} from 'api/utils';

const entityId = db.id();
const toDeleteId = db.id();
const attachmentToEdit = db.id();

export default {
  entities: [
    {_id: toDeleteId, attachments: [{filename: 'other.doc'}, {filename: 'toDelete.txt', originalname: 'common name 1.not'}]},
    {_id: entityId, file: {originalname: 'source doc', filename: 'filename'}, attachments: [{_id: db.id(), originalname: 'o1', filename: 'other.doc'}, {_id: attachmentToEdit, filename: 'match.doc', originalname: 'common name 2.not'}]}
  ]
};

export {
  entityId,
  toDeleteId,
  attachmentToEdit
};
