import db from 'api/utils/testing_db';

export default {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      publicFormDestination: 'secret.place.io',
      languages: [
        { key: 'es', label: 'Español', default: true },
        { key: 'en', label: 'English' }
      ]
    }
  ]
};
