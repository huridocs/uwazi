import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture } from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';

const fixturesFactory = getFixturesFactory();

const entityId = db.id();
const entityEnId = db.id();
const restrictedEntityId = db.id();
const uploadId = db.id();
const uploadId2 = db.id();
const restrictedUploadId = db.id();
const restrictedUploadId2 = db.id();
const templateId = fixturesFactory.id('template');
const importTemplate = db.id();
const writerUserId = db.id();
const externalUrlFileId = db.id();
const fileName1 = 'f2082bf51b6ef839690485d7153e847a.pdf';
const restrictedFileName = 'f2082bf51b6ef839690485d7153e847b.pdf';
const customPdfFileName = 'customPDF.pdf';

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
      creationDate: 1,
      entity: 'sharedId1',
      generatedToc: true,
      originalname: 'upload1',
      filename: fileName1,
      mimetype: 'application/pdf',
      type: 'document',
      language: 'eng',
    },
    {
      _id: uploadId2,
      generatedToc: true,
      entity: 'sharedId1',
      filename: 'fileNotInDisk',
      originalname: 'fileNotInDisk',
      type: 'document',
    },
    {
      _id: db.id(),
      entity: 'restrictedSharedId',
      originalname: 'customPdf',
      filename: customPdfFileName,
      mimetype: 'application/pdf',
      type: 'custom',
      language: 'eng',
    },
    {
      _id: restrictedUploadId,
      entity: 'restrictedSharedId',
      generatedToc: true,
      originalname: 'restrictedUpload',
      filename: restrictedFileName,
      mimetype: 'application/pdf',
      type: 'document',
      language: 'eng',
    },
    {
      _id: restrictedUploadId2,
      entity: 'restrictedSharedId',
      generatedToc: true,
      originalname: 'restrictedUpload2',
      filename: 'restricted file 2 not on disk',
      type: 'document',
      language: 'eng',
    },
    {
      entity: 'sharedId1',
      filename: 'fileWithoutTocFlag',
    },
    { _id: db.id(), originalname: 'fileNotONDisk', filename: 'fileNotOnDisk', type: 'custom' },
    { _id: db.id(), originalname: 'upload2', type: 'document' },
    { _id: db.id(), originalname: 'upload3', type: 'custom' },
    {
      _id: externalUrlFileId,
      originalname: 'external url',
      type: 'attachment',
      url: 'http://example.com/image.jpg',
    },
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
      languages: [{ key: 'es', label: 'ES', default: true }],
      publicFormDestination: 'http://localhost:54321',
      allowedPublicTemplates: [templateId.toString()],
    },
  ],
  users: [collabUser, writerUser, adminUser],
  ixextractors: [
    fixturesFactory.ixExtractor('property_1_extractor', 'property 1', ['template']),
    fixturesFactory.ixExtractor('property_2_extractor', 'property 2', ['template']),
  ],
  ixsuggestions: [
    {
      status: 'ready',
      entityId: 'sharedId1',
      entityTemplate: templateId.toString(),
      fileId: uploadId,
      language: 'en',
      propertyName: 'property 1',
      extractorId: fixturesFactory.id('property_1_extractor'),
      date: 1654002449676,
      segment: '',
      suggestedValue: '',
    },
    {
      status: 'ready',
      entityId: 'sharedId1',
      entityTemplate: templateId.toString(),
      fileId: uploadId,
      language: 'en',
      propertyName: 'property 2',
      extractorId: fixturesFactory.id('property_2_extractor'),
      date: 1654002449676,
      segment: '',
      suggestedValue: '',
    },
    {
      status: 'ready',
      entityId: 'restrictedSharedId',
      entityTemplate: templateId.toString(),
      fileId: restrictedUploadId,
      language: 'en',
      propertyName: 'property 1',
      extractorId: fixturesFactory.id('property_1_extractor'),
      date: 1654002449676,
      segment: '',
      suggestedValue: '',
    },
    {
      status: 'ready',
      entityId: 'restrictedSharedId',
      entityTemplate: templateId.toString(),
      fileId: restrictedUploadId,
      language: 'en',
      propertyName: 'property 2',
      extractorId: fixturesFactory.id('property_2_extractor'),
      date: 1654002449676,
      segment: '',
      suggestedValue: '',
    },
  ],
};

export {
  fixtures,
  entityId,
  entityEnId,
  fileName1,
  restrictedFileName,
  customPdfFileName,
  uploadId,
  uploadId2,
  restrictedUploadId,
  restrictedUploadId2,
  templateId,
  importTemplate,
  collabUser,
  adminUser,
  writerUser,
  externalUrlFileId,
};
