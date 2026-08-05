import { testingDB, DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';

const templateId = testingDB.id();
const userId = testingDB.id();

const fixtures: DBFixture = {
  templates: [
    {
      _id: templateId,
      name: 'toc-template',
      commonProperties: [
        {
          _id: testingDB.id(),
          label: 'Title',
          type: 'text',
          name: 'title',
          isCommonProperty: true,
        },
        {
          _id: testingDB.id(),
          label: 'Creation Date',
          type: 'date',
          name: 'creationDate',
          isCommonProperty: true,
        },
        {
          _id: testingDB.id(),
          label: 'Edit Date',
          type: 'date',
          name: 'editDate',
          isCommonProperty: true,
        },
      ],
      properties: [],
    },
  ],
  entities: [
    {
      sharedId: 'shared1',
      title: 'pdf1entity',
      template: templateId,
      language: 'es',
      user: userId,
    },
    {
      sharedId: 'shared3',
      title: 'pdf3entity',
      template: templateId,
      language: 'es',
      user: userId,
    },
    // entities without templates issue
    {
      sharedId: 'shared 5',
      title: 'pdf5entity',
      language: 'es',
      user: userId,
    },
    {
      sharedId: 'shared 5',
      title: 'pdf5entity',
      language: 'en',
      user: userId,
    },
    //
  ],
  users: [
    {
      _id: userId,
      username: 'toc-user',
      email: 'toc-user@test.com',
      password: 'password',
      role: UserRole.ADMIN,
    },
  ],
  files: [
    {
      _id: testingDB.id(),
      entity: 'shared1',
      filename: 'pdf1.pdf',
      language: 'spa',
      originalname: 'originalPdf1.pdf',
      type: 'document',
      mimetype: 'application/pdf',
      status: 'ready',
      totalPages: 1,
    },
    {
      _id: testingDB.id(),
      type: 'document',
      language: 'spa',
    },
    {
      _id: testingDB.id(),
      type: 'custom',
      filename: 'background.jpg',
      language: 'spa',
      originalname: 'background.jpg',
      mimetype: 'image/jpeg',
    },
    {
      _id: testingDB.id(),
      type: 'document',
      filename: 'pdf2.pdf',
      language: 'spa',
      originalname: 'originalPdf2.pdf',
      toc: [{}],
      mimetype: 'application/pdf',
      status: 'ready',
      totalPages: 1,
    },
    {
      _id: testingDB.id(),
      entity: 'shared3',
      type: 'document',
      language: 'spa',
      filename: 'pdf3.pdf',
      toc: [],
      originalname: 'originalPdf4.pdf',
      mimetype: 'application/pdf',
      status: 'ready',
      totalPages: 1,
    },
    {
      _id: testingDB.id(),
      entity: 'shared 5',
      filename: 'pdf5.pdf',
      language: 'eng',
      originalname: 'originalPdf5.pdf',
      type: 'document',
      mimetype: 'application/pdf',
      status: 'ready',
      totalPages: 1,
    },
  ],
};

export { fixtures };
