import db, { DBFixture } from 'api/utils/testing_db';

const settings = [
  {
    languages: [
      {
        _id: db.id(),
        key: 'en',
        label: 'English',
        default: true,
      },
    ],
    features: {
      twitterIntegration: {
        hashtags: ['#hashtag-example'],
        hashtagsTemplateName: 'Hashtags',
        tweetsTemplateName: 'Tweets',
      },
    },
  },
];

const otherSettings = [
  {
    _id: db.id(),
    languages: [
      {
        _id: db.id(),
        key: 'en',
        label: 'English',
        default: true,
      },
    ],
    features: {
      twitterIntegration: {
        hashtags: ['#other-hashtag-example', '#other-hashtag-example2'],
        hashtagsTemplateName: 'OtherHashtags',
        tweetsTemplateName: 'OtherTweets',
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
  settings,
};

const fixturesOtherTenant: DBFixture = {
  settings: otherSettings,
};

export { fixturesOneTenant, fixturesOtherTenant, fixturesTenantWithoutTwitter };
