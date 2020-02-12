import db from 'api/utils/testing_db';
import { EntitySchema } from 'api/entities/entityType';

import { UploadSchema } from '../uploadType';

const entityId = db.id();
const entityEnId = db.id();
const uploadId = db.id();
const templateId = db.id();

interface DBFixture {
  uploads?: UploadSchema[];
  entities?: EntitySchema[];
  templates?: Object[];
  settings?: Object[];
}

const fixtures: DBFixture = {
  uploads: [
    {
      _id: uploadId,
      originalname: 'upload1',
      filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
      type: 'custom',
    },
    { _id: db.id(), originalname: 'upload2', type: 'custom' },
    { _id: db.id(), originalname: 'upload3', type: 'document' },
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

export { fixtures, entityId, entityEnId, uploadId, templateId };
