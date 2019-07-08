import db from 'api/utils/testing_db';

const entityId = db.id();
const entityEnId = db.id();
const uploadId = db.id();
const templateId = db.id();

export default {
  entities: [
    { _id: entityId, sharedId: 'sharedId1', language: 'es', title: 'Gadgets 01 ES', toc: [{ _id: db.id(), label: 'existingToc' }], file: {} },
    { _id: entityEnId, sharedId: 'sharedId1', language: 'en', title: 'Gadgets 01 EN' }
  ],
  uploads: [
    { _id: uploadId, originalname: 'upload1' },
    { _id: db.id(), originalname: 'upload2' },
  ],
  templates: [
    { _id: templateId, default: true, name: 'mydoc', properties: [] }
  ],
  settings: [
    { _id: db.id(), languages: [{ key: 'es', default: true }], publicFormDestination: 'http://localhost:54321' }
  ],
};

export {
  entityId,
  entityEnId,
  uploadId,
  templateId,
};
