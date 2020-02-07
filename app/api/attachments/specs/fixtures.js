/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const entityId = db.id();
const entityIdEn = db.id();
const entityIdPt = db.id();
const sharedId = 'sharedId';
const toDeleteId = db.id();
const attachmentToDelete = db.id();
const attachmentToEdit = db.id();

export default {
  entities: [
    {
      title: 'title',
      sharedId: toDeleteId.toString(),
      _id: toDeleteId,
      file: { originalname: 'source doc', filename: 'mainFile.txt' },
      attachments: [
        { _id: db.id(), filename: 'other.doc' },
        {
          _id: attachmentToDelete,
          filename: 'attachment.txt',
          originalname: 'common name 1.not',
        },
      ],
    },
    {
      title: 'title',
      sharedId,
      _id: entityId,
      file: { originalname: 'source doc', filename: 'filename' },
      attachments: [
        { _id: db.id(), originalname: 'o1', filename: 'other.doc' },
        {
          _id: attachmentToEdit,
          filename: 'match.doc',
          originalname: 'common name 2.not',
        },
      ],
    },
    {
      title: 'title',
      sharedId,
      _id: entityIdEn,
      file: { originalname: 'source doc', filename: 'filenameEn' },
      attachments: [{ _id: db.id(), originalname: 'o1', filename: 'otherEn.doc' }],
    },
    {
      title: 'title',
      sharedId,
      _id: entityIdPt,
      file: { originalname: 'source doc', filename: 'filenamePt' },
    },
  ],
};

export {
  entityId,
  entityIdEn,
  entityIdPt,
  sharedId,
  toDeleteId,
  attachmentToEdit,
  attachmentToDelete,
};
