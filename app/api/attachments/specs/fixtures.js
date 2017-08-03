/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const entityId = db.id();
const entityIdEn = db.id();
const entityIdPt = db.id();
const sharedId = 'sharedId';
const toDeleteId = db.id();
const attachmentToEdit = db.id();

export default {
  entities: [
    {_id: toDeleteId, attachments: [{filename: 'other.doc'}, {filename: 'toDelete.txt', originalname: 'common name 1.not'}]},
    {sharedId, _id: entityId, file: {originalname: 'source doc', filename: 'filename'}, attachments: [{_id: db.id(), originalname: 'o1', filename: 'other.doc'}, {_id: attachmentToEdit, filename: 'match.doc', originalname: 'common name 2.not'}]},
    {sharedId, _id: entityIdEn, file: {originalname: 'source doc', filename: 'filenameEn'}, attachments: [{_id: db.id(), originalname: 'o1', filename: 'otherEn.doc'}]},
    {sharedId, _id: entityIdPt, file: {originalname: 'source doc', filename: 'filenamePt'}}
  ]
};

export {
  entityId,
  entityIdEn,
  entityIdPt,
  sharedId,
  toDeleteId,
  attachmentToEdit
};
