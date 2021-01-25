import { testingDB, DBFixture } from 'api/utils/testing_db';

const fixtures: DBFixture = {
  entities: [
    {
      sharedId: 'shared1',
      title: 'pdf1entity',
    },
    {
      sharedId: 'shared3',
      title: 'pdf3entity',
    },
  ],
  files: [
    {
      _id: testingDB.id(),
      entity: 'shared1',
      filename: 'pdf1.pdf',
      originalname: 'originalPdf1.pdf',
      type: 'document',
    },
    {
      _id: testingDB.id(),
      type: 'document',
    },
    {
      _id: testingDB.id(),
      type: 'custom',
      filename: 'background.jpg',
    },
    {
      _id: testingDB.id(),
      type: 'document',
      filename: 'pdf2.pdf',
      originalname: 'originalPdf2.pdf',
      toc: [{}],
    },
    {
      _id: testingDB.id(),
      entity: 'shared3',
      type: 'document',
      filename: 'pdf3.pdf',
      originalname: 'originalPdf4.pdf',
    },
  ],
};

export { fixtures };
