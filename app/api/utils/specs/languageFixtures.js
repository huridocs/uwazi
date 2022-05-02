import db from 'api/utils/testing_db';

export default {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'es', label: 'Spanish', default: true },
        { key: 'en', label: 'English' },
      ],
    },
  ],
};
