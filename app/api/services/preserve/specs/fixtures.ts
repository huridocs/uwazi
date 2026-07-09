import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import db, { DBFixture } from '#api/utils/testing_db.js';
import { propertyTypes } from '#shared/propertyTypes.js';

const f = getFixturesFactory();

export const templateId = db.id();
export const anotherTemplateId = db.id();
export const thesauri1Id = db.id();
export const user = {
  _id: db.id(),
  username: 'author',
  email: 'author@test_preserve.com',
  role: UserRole.ADMIN,
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
    f.template(
      'Template 1',
      [
        f.property('URL', 'link', { name: 'url' }),
        f.property('Source', propertyTypes.select, {
          content: thesauri1Id.toString(),
          name: 'source',
        }),
        f.property('Preservation date', 'date', { name: 'preservation_date' }),
      ],
      { _id: templateId }
    ),
    f.template(
      'Template 2',
      [
        f.property('URL', propertyTypes.text, { name: 'url' }),
        f.property('Source', propertyTypes.text, { name: 'source' }),
        f.property('Preservation date', propertyTypes.text, { name: 'preservation_date' }),
      ],
      { _id: anotherTemplateId }
    ),
  ],
  dictionaries: [{ _id: thesauri1Id, name: 'thesauri1', values: [] }],
};
