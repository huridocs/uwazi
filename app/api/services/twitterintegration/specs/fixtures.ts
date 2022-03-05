import db, { DBFixture } from 'api/utils/testing_db';
import { ObjectID } from 'mongodb';
import { factory } from 'api/services/informationextraction/specs/fixtures';

const settings = [
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
};
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

const fixturesWithTweets: DBFixture = {
  entities: [
    factory.entity('A1', 'Tweets', {
      tweet_date: [{ value: 12344 }],
    }),
    factory.entity('A2', 'Tweets', {
      tweet_date: [{ value: 12345 }],
    }),
  ],
  templates: [factory.template('Tweets', [factory.property('tweet_date', 'date')])],
  settings,
};

export { fixturesOneTenant, fixturesOtherTenant, fixturesTenantWithoutTwitter, fixturesWithTweets };
