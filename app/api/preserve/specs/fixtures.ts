import db, { DBFixture } from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';

const userId1 = db.id();
const userId2 = db.id();
const templateId = db.id();

const fixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'es', label: 'Spanish', default: true },
        { key: 'en', label: 'English' },
      ],
      features: {
        preserve: {
          config: [],
          host: 'http://somehost.com',
          masterToken: 'somedevinetoken',
        },
      },
    },
  ],
  users: [
    {
      _id: userId1,
      password: 'somehash',
      username: 'editor',
      role: UserRole.EDITOR,
      email: 'some@mailer.com',
    },
    {
      _id: userId2,
      password: 'someotherpassword',
      username: 'editor',
      email: 'some@mailer.com',
      role: UserRole.EDITOR,
    },
  ],
  translationsV2: [],
};

export { userId1, userId2, templateId };
export default fixtures;
