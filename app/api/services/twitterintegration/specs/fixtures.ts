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
  entities: [factory.entity('A1', 'templateToSegmentA')],
  settings,
};

const fixturesOtherTenant: DBFixture = {
  entities: [factory.entity('A2', 'templateToSegmentB')],
  settings: otherSettings,
};

export { fixturesOneTenant, fixturesOtherTenant, fixturesTenantWithoutTwitter };
