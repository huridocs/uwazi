import db from 'api/utils/testing_db';

export const fixtures = {
  translations: [{}],
  updatelogs: [
    { namespace: 'migrations' },
    { namespace: 'translations' },
    { namespace: 'entities' },
    { namespace: 'translations' },
  ],
};
