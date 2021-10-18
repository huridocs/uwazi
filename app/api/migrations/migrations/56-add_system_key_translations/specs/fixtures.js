import db from 'api/utils/testing_db';

export default {
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: [{ key: 'EXISTING_KEY', value: 'EXISTING_VALUE' }],
        },
      ],
    },
  ],
};
