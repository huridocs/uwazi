import db, { DBFixture } from 'api/utils/testing_db';

export const templateId = db.id();

export const fixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      languages: [{ label: 'English', key: 'en' }],
      features: {
        preserve: {
          host: 'http://preserve-testing.org',
          token: 'auth-token',
          template: templateId,
        },
      },
    },
  ],
  templates: [
    {
      _id: templateId,
      title: 'Template with custom page 1',
      entityViewPage: '1',
      properties: [],
    },
  ],
};
