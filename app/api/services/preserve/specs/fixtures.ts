import { templateUtils } from 'api/templates';
import db, { DBFixture } from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';

export const templateId = db.id();
export const anotherTemplateId = db.id();
export const thesauri1Id = db.id();

export const fixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      languages: [{ label: 'English', key: 'en', default: true }],
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
          name: templateUtils.safeName('URL'),
          type: 'link',
          label: 'URL',
        },
        {
          _id: db.id(),
          type: propertyTypes.select,
          label: 'Source',
          name: templateUtils.safeName('Source'),
          content: thesauri1Id,
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
  dictionaries: [{ _id: thesauri1Id, name: 'thesauri1', values: [] }],
  translations: [
    { _id: db.id(), locale: 'en', contexts: [] },
    { _id: db.id(), locale: 'es', contexts: [] },
  ],
};
