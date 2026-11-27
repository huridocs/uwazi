import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixturesTimeOut } from '#api/search/specs/fixtures_elastic.js';
import { ElasticStemmer } from '../ElasticStemmer.js';

describe('ElasticStemmer', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, 'elastic_stemmer_index_test');
  }, fixturesTimeOut);

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should stem each word with the analyzer of the given language', async () => {
    const stems = await ElasticStemmer.stems(['corporate', 'laws'], 'en');

    expect(stems).toEqual(
      new Map([
        ['corporate', 'corpor'],
        ['laws', 'law'],
      ])
    );
  });

  it('should fold accents', async () => {
    const stems = await ElasticStemmer.stems(['países', 'nacionales'], 'es');

    expect(stems).toEqual(
      new Map([
        ['países', 'pais'],
        ['nacionales', 'nacional'],
      ])
    );
  });

  it('should leave out stopwords', async () => {
    const stems = await ElasticStemmer.stems(['the', 'laws'], 'en');

    expect(stems).toEqual(new Map([['laws', 'law']]));
  });

  it('should fall back to the generic analyzer, which does not stem, for unknown languages', async () => {
    const stems = await ElasticStemmer.stems(['Países'], 'other');

    expect(stems).toEqual(new Map([['Países', 'paises']]));
  });

  it('should leave out words the analyzer splits into several tokens', async () => {
    const stems = await ElasticStemmer.stems(['日本語', 'laws'], 'ja');

    expect(stems).toEqual(new Map([['laws', 'laws']]));
  });

  it('should return no stems when there are no words', async () => {
    expect(await ElasticStemmer.stems([], 'en')).toEqual(new Map());
  });
});
