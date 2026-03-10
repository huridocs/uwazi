import testingDB from 'api/utils/testing_db';
import migration from '../index.js';

describe('migration add-localized-language', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext({
      settings: [
        {
          _id: '58ad7d240d44252fee4e6213',
          site_name: 'Uwazi',
          features: {
            topicClassification: false,
          },
          languages: [
            { _id: '58ad7d240d44252fee4e6214', label: 'English', key: 'en', default: true },
            {
              _id: '62c5e34bdc91a4c1fd14c5f4',
              label: 'Chinese',
              key: 'zh',
            },
            {
              _id: '37g8cjw98498gjidji28589t',
              label: 'Spanish',
              key: 'es',
            },
            {
              _id: '62c5e550dc91a4c1fd14cb8a',
              label: 'Arabic',
              key: 'ar',
              rtl: true,
            },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(87);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should add the localized language label to existing languages', async () => {
    await migration.up(testingDB.mongodb);

    const [settings] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(settings).toEqual({
      _id: '58ad7d240d44252fee4e6213',
      site_name: 'Uwazi',
      features: {
        topicClassification: false,
      },
      languages: expect.arrayContaining([
        {
          _id: '58ad7d240d44252fee4e6214',
          label: 'English',
          localized_label: 'English',
          key: 'en',
          default: true,
        },
        {
          _id: '37g8cjw98498gjidji28589t',
          label: 'Spanish',
          localized_label: 'Español',
          key: 'es',
        },
        {
          _id: '62c5e34bdc91a4c1fd14c5f4',
          label: 'Chinese',
          localized_label: '中文',
          key: 'zh',
        },
        {
          _id: '62c5e550dc91a4c1fd14cb8a',
          label: 'Arabic',
          localized_label: 'العربية',
          key: 'ar',
          rtl: true,
        },
      ]),
    });
  });
});
