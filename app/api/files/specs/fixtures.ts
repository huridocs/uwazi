import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import db, { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';
import { PUBLIC_USER_ID } from '#api/users/publicUser.js';

const fixturesFactory = getFixturesFactory();

const entityId = db.id();
const entityEnId = db.id();
const restrictedEntityId = db.id();
const readOnlyEntity = db.id();
const uploadId = db.id();
const uploadId2 = db.id();
const restrictedUploadId = db.id();
const restrictedUploadId2 = db.id();
const readOnlyUploadId = db.id();
const customFileId = db.id();
const allowedPublicTemplate = fixturesFactory.id('allowedPublicTemplate');
const importTemplate = db.id('507f1f77bcf86cd799439011');
const thesaurusId = db.id('507f1f77bcf86cd799439012');
const writerUserId = db.id();
const externalUrlFileId = db.id();
const mainDocument1 = 'english_testing_file.pdf';
const fileOnPublicEntity = 'fileOnPublicEntity.pdf';
const restrictedFileName = 'restricted.pdf';
const customPdfFileName = 'customPDF.pdf';

const publicEntityFile = {
  _id: db.id(),
  creationDate: 1,
  entity: 'publicEntity',
  generatedToc: true,
  originalname: 'publicEntityFile',
  filename: fileOnPublicEntity,
  mimetype: 'application/pdf',
  type: 'document',
  language: 'eng',
} as const;

const mainDoc = {
  _id: uploadId,
  creationDate: 1,
  entity: 'sharedId1',
  generatedToc: true,
  originalname: '테스트 한글chinese-file',
  filename: mainDocument1,
  mimetype: 'application/pdf',
  type: 'document',
  language: 'eng',
} as const;

const customPDF = {
  _id: db.id(),
  creationDate: 1,
  originalname: 'customPdf',
  filename: customPdfFileName,
  mimetype: 'application/pdf',
  type: 'custom',
  language: 'eng',
} as const;

const attachment = {
  _id: db.id(),
  creationDate: 1,
  originalname: 'originalAttachmentName',
  entity: 'sharedId1',
  type: 'attachment',
  filename: 'attachment.txt',
  mimetype: 'text/plain',
} as const;

const thumbnail = {
  _id: db.id(),
  creationDate: 1,
  originalname: 'thumbnailOriginalName',
  entity: 'publicEntity',
  type: 'thumbnail',
  filename: 'thumbnail.jpg',
  mimetype: 'image/jpeg',
} as const;

const restrictedThumbnail = {
  _id: db.id(),
  creationDate: 1,
  originalname: 'restrictedThumbnail',
  entity: 'restrictedSharedId',
  type: 'thumbnail',
  filename: 'restricted.jpg',
  mimetype: 'image/jpeg',
} as const;

const downloadFixtures = {
  thumbnail,
  attachment,
  customPDF,
  mainDoc,
  publicEntityFile,
  restrictedThumbnail,
};

const collabInGroupUser = {
  _id: db.id(),
  username: 'collab_in_group',
  role: UserRole.COLLABORATOR,
  email: 'collab_in_group@tenant.xy',
};

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

const publicUser = {
  _id: PUBLIC_USER_ID,
  username: 'PublicUser',
  role: UserRole.COLLABORATOR,
  email: 'public@uwazi.local',
  password: 'not-used-in-tests',
};

const fixtures: DBFixture = {
  files: [
    ...Object.values(downloadFixtures),
    {
      _id: uploadId2,
      generatedToc: true,
      entity: 'sharedId1',
      filename: 'fileNotInDisk',
      originalname: 'fileNotInDisk',
      type: 'document',
      mimetype: 'application/pdf',
      status: 'ready',
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
      mimetype: 'application/pdf',
      language: 'eng',
    },
    {
      _id: readOnlyUploadId,
      entity: 'readOnlySharedId',
      generatedToc: true,
      originalname: 'readOnlyUpload',
      filename: 'read only file',
      type: 'document',
      mimetype: 'application/pdf',
      language: 'eng',
    },
    {
      entity: 'sharedId1',
      filename: 'fileWithoutTocFlag',
      mimetype: 'application/pdf',
    },
    {
      _id: db.id(),
      originalname: 'fileNotONDisk',
      filename: 'fileNotOnDisk',
      type: 'custom',
      mimetype: 'application/pdf',
    },
    { _id: db.id(), originalname: 'upload2', type: 'document', mimetype: 'application/pdf' },
    {
      _id: db.id(),
      originalname: 'upload3',
      filename: 'fileWithoutTocFlag',
      type: 'custom',
      mimetype: 'application/pdf',
    },
    {
      _id: externalUrlFileId,
      originalname: 'external url',
      type: 'attachment',
      url: 'http://example.com/image.jpg',
      mimetype: 'image/jpeg',
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
      _id: db.id(),
      sharedId: 'publicEntity',
      language: 'es',
      title: 'Public entity',
      template: allowedPublicTemplate,
      published: true,
    },
    {
      _id: entityId,
      sharedId: 'sharedId1',
      language: 'es',
      title: 'Gadgets 01 ES',
      generatedToc: true,
      template: allowedPublicTemplate,
      metadata: {},
      published: true,
    },
    {
      _id: entityEnId,
      template: allowedPublicTemplate,
      sharedId: 'sharedId1',
      language: 'en',
      title: 'Gadgets 01 EN',
      metadata: {},
      published: true,
    },
    {
      _id: db.id(),
      template: allowedPublicTemplate,
      sharedId: 'sharedId2',
      language: 'en',
      title: 'Test Entity for Attachments',
      metadata: {},
      published: true,
    },
    {
      _id: restrictedEntityId,
      template: allowedPublicTemplate,
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
        {
          refId: fixturesFactory.id('group 1'),
          type: 'group',
          level: 'write',
        },
      ],
    },
    {
      _id: readOnlyEntity,
      template: allowedPublicTemplate,
      sharedId: 'readOnlySharedId',
      language: 'en',
      title: 'Read only shared id',
      public: false,
      permissions: [
        {
          refId: writerUserId.toString(),
          type: 'user',
          level: 'read',
        },
      ],
    },
  ],
  templates: [
    fixturesFactory.template('allowedPublicTemplate', [], {
      default: true,
      name: 'mydoc',
    }),
    {
      _id: importTemplate,
      default: true,
      name: 'import',
      properties: [
        {
          name: 'select_with_spaces',
          type: 'select',
          content: thesaurusId,
        },
      ],
    },
  ],
  dictionaries: [
    {
      _id: thesaurusId,
      name: 'Select with spaces',
      values: [
        { id: 'item1', label: 'Item1' },
        { id: 'item2', label: ' Item2 ' },
        { id: 'normal_item', label: 'Normal Item' },
      ],
    },
  ],
  settings: [
    {
      _id: db.id(),
      languages: [{ key: 'es', label: 'ES', default: true }],
      publicFormDestination: 'http://localhost:54321',
      allowedPublicTemplates: [allowedPublicTemplate.toString()],
      openPublicEndpoint: true,
    },
  ],
  segmentations: [
    {
      _id: db.id(),
      fileID: uploadId,
      filename: mainDocument1,
      status: 'ready',
      xmlname: 'english_testing_file.xml',
      autoexpire: null,
      segmentation: { page_height: 1, page_width: 1, paragraphs: [] },
    },
  ],
  users: [collabInGroupUser, collabUser, writerUser, adminUser, publicUser],
  groups: [
    {
      id: fixturesFactory.id('group 1'),
      name: 'group 1',
      members: [{ refId: collabInGroupUser._id.toString() }],
    },
  ],
  ixextractors: [
    fixturesFactory.ixExtractor('property_1_extractor', 'property 1', ['template']),
    fixturesFactory.ixExtractor('property_2_extractor', 'property 2', ['template']),
  ],
  ixsuggestions: [
    {
      status: 'ready',
      entityId: 'sharedId1',
      entityTemplate: allowedPublicTemplate.toString(),
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
      entityTemplate: allowedPublicTemplate.toString(),
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
      entityTemplate: allowedPublicTemplate.toString(),
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
      entityTemplate: allowedPublicTemplate.toString(),
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
  fixturesFactory,
  adminUser,
  allowedPublicTemplate,
  allowedPublicTemplate as templateId,
  collabUser,
  collabInGroupUser,
  customFileId,
  customPdfFileName,
  downloadFixtures,
  entityEnId,
  entityId,
  externalUrlFileId,
  fileOnPublicEntity,
  fixtures,
  importTemplate,
  mainDocument1,
  publicUser,
  readOnlyUploadId,
  restrictedFileName,
  restrictedUploadId,
  restrictedUploadId2,
  uploadId,
  uploadId2,
  writerUser,
};
