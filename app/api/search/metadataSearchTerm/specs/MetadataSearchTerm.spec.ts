import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixturesTimeOut } from '#api/search/specs/fixtures_elastic.js';
import { elastic } from '#api/search/elastic.js';
import { legacyLogger } from '#api/log/index.js';
import { MetadataSearchTerm } from '../MetadataSearchTerm.js';

describe('MetadataSearchTerm', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, 'metadata_search_term_index_test');
  }, fixturesTimeOut);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should widen plain words with the stem of the request language', async () => {
    expect(await MetadataSearchTerm.for('corporate laws', 'en', 'query_string')).toBe(
      '(corporate corpor*) (laws law*)'
    );
    expect(await MetadataSearchTerm.for('países', 'es', 'query_string')).toBe('(países pais*)');
  });

  it('should keep the term as typed when it is not a valid query_string', async () => {
    expect(await MetadataSearchTerm.for('laws)', 'en', 'simple_query_string')).toBe('laws)');
  });

  it('should keep the term as typed when it is empty', async () => {
    expect(await MetadataSearchTerm.for('', 'en', 'query_string')).toBe('');
  });

  it('should keep the term as typed when stemming fails', async () => {
    jest.spyOn(elastic.indices, 'analyze').mockRejectedValue(new Error('analyze failed'));
    jest.spyOn(legacyLogger, 'error');

    expect(await MetadataSearchTerm.for('laws', 'en', 'query_string')).toBe('laws');
    expect(legacyLogger.error).toHaveBeenCalled();
  });
});
