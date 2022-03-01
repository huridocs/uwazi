import db, { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const factory = getFixturesFactory();

const settings = [
  {
    features: {
      twitterIntegration: {
        hashtags: ['#hashtag-example'],
      },
    },
    languages: [
      {
        _id: db.id(),
        key: 'en',
        label: 'English',
        default: true,
      },
    ],
  },
];

const otherSettings = [
  {
    _id: db.id(),
    features: {
      twitterIntegration: {
        hashtags: ['#other-hashtag-example'],
      },
    },
  },
];

const fixturesTenantWithoutTwitter: DBFixture = {
  settings: [
    {
      _id: db.id(),
      features: {},
    },
  ],
};

const fixturesOneTenant: DBFixture = {
  templates: [
    factory.template('hashtags'),
    factory.template('tweets', [{ label: 'text', name: 'text', type: 'markdown' }]),
  ],
  settings,
};

const fixturesOtherTenant: DBFixture = {
  templates: [
    factory.template('hashtags'),
    factory.template('#hashtag_example', [{ label: 'text', name: 'text', type: 'markdown' }]),
  ],
  entities: [factory.entity('A2', 'hashtag_example')],
  settings: otherSettings,
};

export { fixturesOneTenant, fixturesOtherTenant, fixturesTenantWithoutTwitter };
