import db, { DBFixture } from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';

const entityId = db.id();
const entityEnId = db.id();
const restrictedEntityId = db.id();
const uploadId = db.id();
const uploadId2 = db.id();
const restrictedUploadId = db.id();
const restrictedUploadId2 = db.id();
const templateId = db.id();
const importTemplate = db.id();
const writerUserId = db.id();
const fileName1 = 'f2082bf51b6ef839690485d7153e847a.pdf';
const restrictedFileName = 'f2082bf51b6ef839690485d7153e847b.pdf';

const collabUser = {
  _id: db.id(),
  username: 'collab',
  role: UserRole.COLLABORATOR,
  email: 'collab@tenant.xy',
};
const writerUser = {
  _id: writerUserId,
  username: 'writer',
  role: UserRole.COLLABORATOR,
  email: 'writer@tenant.xy',
};
const adminUser = {
  _id: db.id(),
  username: 'admin',
  role: UserRole.ADMIN,
  email: 'admin@tenant.xy',
};

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
      _id: restrictedUploadId,
      entity: 'restrictedSharedId',
      generatedToc: true,
      originalname: 'restrictedUpload',
      filename: restrictedFileName,
      type: 'custom',
      language: 'eng',
    },
    {
      _id: restrictedUploadId2,
      entity: 'restrictedSharedId',
      generatedToc: true,
      originalname: 'restrictedUpload2',
      filename: 'restricted file 2 not on disk',
      type: 'custom',
      language: 'eng',
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
    { entity: 'sharedId1', file: uploadId.toString() },
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
    {
      _id: restrictedEntityId,
      template: templateId,
      sharedId: 'restrictedSharedId',
      language: 'en',
      title: 'Restricted Entity',
      public: false,
      permissions: [
        {
          refId: writerUserId.toString(),
          type: 'user',
          level: 'write',
        },
      ],
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
    },
  ],
  users: [collabUser, writerUser, adminUser],
};

export {
  fixtures,
  entityId,
  entityEnId,
  fileName1,
  restrictedFileName,
  uploadId,
  uploadId2,
  restrictedUploadId2,
  templateId,
  importTemplate,
  collabUser,
  adminUser,
  writerUser,
};
