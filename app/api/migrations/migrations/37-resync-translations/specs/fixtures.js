import testingDB from 'api/utils/testing_db';

const translation1 = testingDB.id();
const translation2 = testingDB.id();
const translation3 = testingDB.id();
const entity1 = testingDB.id();

export default {
  updatelogs: [
    {
      mongoId: translation1,
      namespace: 'translations',
      deleted: false,
      timestamp: 6,
    },
    {
      mongoId: entity1,
      namespace: 'entities',
      deleted: true,
      timestamp: 8,
    },
    {
      mongoId: translation2,
      namespace: 'translations',
      deleted: false,
      timestamp: 10,
    },
    {
      mongoId: translation3,
      namespace: 'translations',
      deleted: true,
      timestamp: 12,
    },
  ],
};

export { translation1, translation2, translation3, entity1 };
