import db, { DBFixture } from 'api/utils/testing_db';
import { ObjectID } from 'mongodb';

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
        language: 'en',
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
        language: 'en',
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

const fixturesWithTweets: DBFixture = {
  entities: [
    {
      template: new ObjectID('6218eaf9b419df7782dcb76f'),
      metadata: {
        tweet_date: [{ value: 12344 }],
      },
    },
    {
      template: new ObjectID('6218eaf9b419df7782dcb76f'),
      metadata: {
        tweet_date: [{ value: 12345 }],
      },
    },
  ],
  templates: [{ name: 'Tweets', _id: new ObjectID('6218eaf9b419df7782dcb76f') }],
  settings,
};

export { fixturesOneTenant, fixturesOtherTenant, fixturesTenantWithoutTwitter, fixturesWithTweets };
