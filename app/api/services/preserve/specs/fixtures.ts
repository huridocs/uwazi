import { templateUtils } from 'api/templates';
import db, { DBFixture } from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { UserSchema } from 'shared/types/userType';

export const templateId = db.id();
export const anotherTemplateId = db.id();
export const thesauri1Id = db.id();
export const user: UserSchema = {
  _id: db.id(),
  username: 'author',
  email: 'author@test_preserve.com',
  role: 'admin',
};

export const fixtures: DBFixture = {
  users: [user],
  settings: [
    {
      _id: db.id(),
      languages: [{ label: 'English', key: 'en', default: true }],
      features: {
        preserve: {
          host: 'http://preserve-testing.org',
          masterToken: 'master-token',
          config: [
            { token: 'auth-token', template: templateId, user: user._id },
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
        {
          _id: db.id(),
          type: propertyTypes.date,
          label: 'Preservation date',
          name: templateUtils.safeName('Preservation date'),
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
          type: propertyTypes.text,
          label: 'URL',
        },
        {
          _id: db.id(),
          name: 'source',
          type: propertyTypes.text,
          label: 'Source',
        },
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'Preservation date',
          name: templateUtils.safeName('Preservation date'),
        },
      ],
    },
  ],
  dictionaries: [{ _id: thesauri1Id, name: 'thesauri1', values: [] }],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          id: 'contextId',
          label: 'contextLabel',
          type: 'Entity',
          values: [
            { key: 'Key', value: 'Value' },
            { key: 'Key2', value: 'Value2' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [
        {
          id: 'contextId',
          label: 'contextLabel',
          type: 'Entity',
          values: [
            { key: 'Key', value: 'Valor' },
            { key: 'Key2', value: 'Valor2' },
          ],
        },
      ],
    },
  ],
};
