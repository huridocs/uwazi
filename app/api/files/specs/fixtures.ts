import db, { DBFixture } from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';

const entityId = db.id();
const entityEnId = db.id();
const uploadId = db.id();
const uploadId2 = db.id();
const templateId = db.id();
const importTemplate = db.id();
const fileName1 = 'f2082bf51b6ef839690485d7153e847a.pdf';

const fixtures: DBFixture = {
  files: [
    {
      _id: uploadId,
      entity: 'sharedId1',
      generatedToc: true,
      originalname: 'upload1',
      filename: fileName1,
      type: 'custom',
      language: 'eng',
    },
    {
      _id: uploadId2,
      generatedToc: true,
      entity: 'sharedId1',
      filename: 'fileNotInDisk',
    },
    {
      entity: 'sharedId1',
      filename: 'fileWithoutTocFlag',
    },
    { _id: db.id(), filename: 'fileNotOnDisk' },
    { _id: db.id(), originalname: 'upload2', type: 'custom' },
    { _id: db.id(), originalname: 'upload3', type: 'document' },
  ],
  connections: [
    { entity: 'entity1', file: uploadId2.toString(), hub: '1' },
    { entity: 'entity2', file: uploadId2.toString(), hub: '2' },
    { entity: 'entity3', hub: '3' },
  ],
  entities: [
    {
      _id: entityId,
      sharedId: 'sharedId1',
      language: 'es',
      title: 'Gadgets 01 ES',
      generatedToc: true,
      template: templateId,
    },
    {
      _id: entityEnId,
      template: templateId,
      sharedId: 'sharedId1',
      language: 'en',
      title: 'Gadgets 01 EN',
    },
  ],
  templates: [
    { _id: templateId, default: true, name: 'mydoc', properties: [] },
    { _id: importTemplate, default: true, name: 'import', properties: [] },
  ],
  settings: [
    {
      _id: db.id(),
      languages: [{ key: 'es', default: true }],
      publicFormDestination: 'http://localhost:54321',
      allowedPublicTemplates: [templateId.toString()],
      features: {
        ocr: { url: 'protocol://serviceUrl' },
      },
    },
  ],
  users: [
    {
      _id: db.id(),
      username: 'collab',
      role: UserRole.COLLABORATOR,
      email: 'collab@tenant.xy'
    },
    {
      _id: db.id(),
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@tenant.xy'
    },
  ],
};

export {
  fixtures,
  entityId,
  entityEnId,
  fileName1,
  uploadId,
  uploadId2,
  templateId,
  importTemplate,
};
