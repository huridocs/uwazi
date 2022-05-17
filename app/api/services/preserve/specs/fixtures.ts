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
      title: 'Template 1',
      properties: [
        {
          _id: db.id(),
          name: 'url',
          type: 'link',
          label: 'URL',
        },
        {
          _id: db.id(),
          name: 'source',
          type: 'text',
          label: 'Source',
        },
      ],
    },
    {
      _id: anotherTemplateId,
      title: 'Template 2',
      properties: [
        {
          _id: db.id(),
          name: 'url',
          type: 'text',
          label: 'URL',
        },
        {
          _id: db.id(),
          name: 'source',
          type: 'link',
          label: 'Source',
        },
      ],
    },
  ],
};
