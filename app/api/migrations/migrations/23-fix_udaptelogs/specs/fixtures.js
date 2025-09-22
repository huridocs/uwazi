import db from '../utils/testing_db.js';

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
