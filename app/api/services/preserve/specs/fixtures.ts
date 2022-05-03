import db, { DBFixture } from 'api/utils/testing_db';

export const templateId = db.id();
export const anotherTemplateId = db.id();

export const fixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      languages: [{ label: 'English', key: 'en' }],
      features: {
        preserve: {
          host: 'http://preserve-testing.org',
          config: [
            { token: 'auth-token', template: templateId },
            { token: 'another-auth-token', template: anotherTemplateId },
          ],
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
    {
      _id: anotherTemplateId,
      title: 'Template with custom page 2',
      entityViewPage: '2',
      properties: [],
    },
  ],
};
