import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

const expectedDefaultResult = [
  { key: 'default template', value: 'default template' },
  { key: 'Title', value: 'Title' },
];

const expectedChangedOnceResult = [
  { key: 'changed once', value: 'changed once' },
  { key: 'First New Title', value: 'First New Title' },
];
const expectedChangedMultipleResult = [
  { key: 'changed multiple correct', value: 'changed multiple correct' },
  { key: 'Fourth New Title', value: 'Fourth New Title' },
];
const expectedComplexResult = [
  { key: 'with properties', value: 'with properties' },
  { key: 'Fourth New Title', value: 'Fourth New Title' },
  { key: 'date_title', value: 'date_title' },
  { key: 'rich_text_title', value: 'rich_text_title' },
  { key: 'Geolocation', value: 'Geolocation' },
  { key: 'Generated ID', value: 'Generated ID' },
];
const unrelatedResult = [
  { key: 'some-menu-item', value: 'some-menu-item' },
  { key: 'other-menu-item', value: 'other-menu-item' },
];
const nonexistingResult = [{ key: 'NonExistingTemplateName', value: 'NonExistingTemplateName' }];
const results = [
  expectedDefaultResult,
  expectedChangedOnceResult,
  expectedChangedMultipleResult,
  expectedComplexResult,
  unrelatedResult,
  nonexistingResult,
];

describe('migration delete-superfluous-title-translations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(47);
  });

  it('should delete obsolete title translations', async () => {
    await migration.up(testingDB.mongodb);

    const allTranslations = await testingDB.mongodb.collection('translations').find({}).toArray();

    const spanishContexts = allTranslations[0].contexts;
    const englishContexts = allTranslations[1].contexts;

    results.forEach((result, index) => {
      expect(spanishContexts[index].values).toStrictEqual(result);
      expect(englishContexts[index].values).toStrictEqual(result);
    });
  });
});
