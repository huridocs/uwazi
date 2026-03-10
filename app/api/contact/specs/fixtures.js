/* eslint-disable max-len */
import db from '#api/utils/testing_db.js';

export default {
  settings: [
    {
      _id: db.id(),
      languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }],
      contactEmail: 'contact@uwazi.com',
    },
  ],
};
