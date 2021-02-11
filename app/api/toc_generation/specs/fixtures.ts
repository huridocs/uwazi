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
    },
    {
      sharedId: 'shared3',
      title: 'pdf3entity',
      template: templateId,
    },
  ],
  files: [
    {
      _id: testingDB.id(),
      entity: 'shared1',
      filename: 'pdf1.pdf',
      language: 'es',
      originalname: 'originalPdf1.pdf',
      type: 'document',
    },
    {
      _id: testingDB.id(),
      type: 'document',
      language: 'es',
    },
    {
      _id: testingDB.id(),
      type: 'custom',
      filename: 'background.jpg',
      language: 'es',
    },
    {
      _id: testingDB.id(),
      type: 'document',
      filename: 'pdf2.pdf',
      originalname: 'originalPdf2.pdf',
      toc: [{}],
      language: 'es',
    },
    {
      _id: testingDB.id(),
      entity: 'shared3',
      type: 'document',
      filename: 'pdf3.pdf',
      toc: [],
      originalname: 'originalPdf4.pdf',
      language: 'es',
    },
  ],
};

export { fixtures };
