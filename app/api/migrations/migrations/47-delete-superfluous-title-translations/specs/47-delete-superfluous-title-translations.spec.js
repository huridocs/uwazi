import testingDB from 'api/utils/testing_db';
import translations from 'api/i18n/translations';
import migration from '../index.js';
import fixtures from './fixtures.js';

const expectedDefaultResult = { 'default template': 'default template', Title: 'Title' };
const expectedChangedOnceResult = {
  'changed once': 'changed once',
  'First New Title': 'First New Title',
};
const expectedChangedMultipleResult = {
  'changed multiple correct': 'changed multiple correct',
  'Fourth New Title': 'Fourth New Title',
};
const expectedComplexResult = {
  'with properties': 'with properties',
  'Fourth New Title': 'Fourth New Title',
  date_title: 'date_title',
  rich_text_title: 'rich_text_title',
  Geolocation: 'Geolocation',
  'Generated ID': 'Generated ID',
};
const unrelatedResult = {
  'some-menu-item': 'some-menu-item',
  'other-menu-item': 'other-menu-item',
};
const nonexistingResult = {
  NonExistingTemplateName: 'NonExistingTemplateName',
};
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
    spyOn(process.stdout, 'write');
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

    const allTranslations = await translations.get();
    const spanishContexts = allTranslations[0].contexts;
    const englishContexts = allTranslations[1].contexts;

    results.forEach((result, index) => {
      expect(spanishContexts[index].values).toStrictEqual(result);
      expect(englishContexts[index].values).toStrictEqual(result);
    });
  });
});
