/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const entityId = db.id();
const sharedId = 'sharedId';
const toDeleteId = db.id();

export default {
  files: [
    {
      filename: 'other.doc',
      entity: toDeleteId.toString(),
      type: 'attachment',
      originalname: 'other.doc',
    },
    {
      filename: 'attachment.txt',
      originalname: 'common name 1.not',
      entity: toDeleteId.toString(),
      type: 'attachment',
    },
    { entity: sharedId, originalname: 'o1', filename: 'other.doc' },
    {
      entity: sharedId,
      filename: 'match.doc',
      originalname: 'common name 2.not',
    },
  ],
  entities: [
    {
      title: 'title',
      sharedId: toDeleteId.toString(),
      _id: toDeleteId,
      file: { originalname: 'source doc', filename: 'mainFile.txt' },
    },
    {
      title: 'title',
      sharedId,
      _id: entityId,
      file: { originalname: 'source doc', filename: 'filename' },
    },
  ],
};

export { entityId, sharedId, toDeleteId };
