import db from 'api/utils/testing_db';

export default {
  updatelogs: [
    {
      mongoId: db.id(),
      namespace: 'entities',
    },
    {
      mongoId: db.id(),
      namespace: 'entities',
    },
    {
      namespace: 'entities',
    },
    {
      namespace: 'entities',
    },
  ],
};
