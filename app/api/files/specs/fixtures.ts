import db, { DBFixture } from 'api/utils/testing_db';

const entityId = db.id();
const entityEnId = db.id();
const uploadId = db.id();
const templateId = db.id();
const fileName1 = 'f2082bf51b6ef839690485d7153e847a.pdf';

const fixtures: DBFixture = {
  files: [
    {
      _id: uploadId,
      entity: 'entity',
      originalname: 'upload1',
      filename: fileName1,
      type: 'custom',
    },
    { _id: db.id(), filename: 'fileNotOnDisk' },
    { _id: db.id(), originalname: 'upload2', type: 'custom' },
    { _id: db.id(), originalname: 'upload3', type: 'document' },
  ],
  connections: [
    { entity: 'entity1', file: uploadId.toString(), hub: '1' },
    { entity: 'entity2', file: uploadId.toString(), hub: '2' },
    { entity: 'entity3', hub: '3' },
  ],
  entities: [
    {
      _id: entityId,
      sharedId: 'sharedId1',
      language: 'es',
      title: 'Gadgets 01 ES',
      toc: [{ _id: db.id(), label: 'existingToc' }],
    },
    { _id: entityEnId, sharedId: 'sharedId1', language: 'en', title: 'Gadgets 01 EN' },
  ],
  templates: [{ _id: templateId, default: true, name: 'mydoc', properties: [] }],
  settings: [
    {
      _id: db.id(),
      languages: [{ key: 'es', default: true }],
      publicFormDestination: 'http://localhost:54321',
      allowedPublicTemplates: [templateId.toString()],
    },
  ],
};

export { fixtures, entityId, entityEnId, fileName1, uploadId, templateId };
