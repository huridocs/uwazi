import db, { DBFixture } from 'api/utils/testing_db';

const settings: DBFixture['settings'] = [
  {
    languages: [
      {
        key: 'en',
        label: 'English',
        default: true,
      },
    ],
    features: {
      twitterIntegration: {
        searchQueries: ['#hashtag-example'],
        hashtagsTemplateName: 'Hashtags',
        tweetsTemplateName: 'Tweets',
        language: 'en',
        tweetsLanguages: ['en'],
      },
    },
  },
];

const fixturesOneTenant: DBFixture = {
  settings,
  translationsV2: [],
};
const otherSettings: DBFixture['settings'] = [
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
        searchQueries: ['#other-hashtag-example', '#other-hashtag-example2'],
        hashtagsTemplateName: 'OtherHashtags',
        tweetsTemplateName: 'OtherTweets',
        language: 'en',
        tweetsLanguages: ['es', 'my'],
      },
    },
  },
];

const fixturesTenantWithoutTwitter: DBFixture = {
  settings: [
    {
      _id: db.id(),
    },
  ],
};

const fixturesOtherTenant: DBFixture = {
  settings: otherSettings,
};

export { fixturesOneTenant, fixturesOtherTenant, fixturesTenantWithoutTwitter };
