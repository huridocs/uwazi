import { testingDB, DBFixture } from 'api/utils/testing_db';

const templateId = testingDB.id();

const fixtures: DBFixture = {
  templates: [
    {
      _id: templateId,
      properties: [],
    },
  ],
  entities: [
    {
      sharedId: 'shared1',
      title: 'pdf1entity',
      template: templateId,
      language: 'es',
    },
    {
      sharedId: 'shared3',
      title: 'pdf3entity',
      template: templateId,
      language: 'es',
    },
    // entities without templates issue
    {
      sharedId: 'shared 5',
      title: 'pdf5entity',
      language: 'es',
    },
    {
      sharedId: 'shared 5',
      title: 'pdf5entity',
      language: 'en',
    },
    //
  ],
  files: [
    {
      _id: testingDB.id(),
      entity: 'shared1',
      filename: 'pdf1.pdf',
      language: 'spa',
      originalname: 'originalPdf1.pdf',
      type: 'document',
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
    },
    {
      _id: testingDB.id(),
      type: 'document',
      filename: 'pdf2.pdf',
      language: 'spa',
      originalname: 'originalPdf2.pdf',
      toc: [{}],
    },
    {
      _id: testingDB.id(),
      entity: 'shared3',
      type: 'document',
      language: 'spa',
      filename: 'pdf3.pdf',
      toc: [],
      originalname: 'originalPdf4.pdf',
    },
    {
      _id: testingDB.id(),
      entity: 'shared 5',
      filename: 'pdf5.pdf',
      language: 'eng',
      originalname: 'originalPdf5.pdf',
      type: 'document',
    },
  ],
};

export { fixtures };
