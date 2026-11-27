import { search } from '#api/search/search.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { fixturesTimeOut } from './fixtures_elastic.js';

const factory = getFixturesFactory();

const searchTitles = async (query: object, language = 'en') =>
  testingEnvironment.runWithContext(async () => {
    const { rows } = await search.search(query, language);
    return rows.map((row: EntitySchema) => row.title).sort();
  });

describe('search metadata with the stems of the search term', () => {
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await testingEnvironment.setUp(
      {
        templates: [factory.template('template', [factory.property('summary', 'text')])],
        entities: [
          factory.entity('Corporate laws', 'template', {}, { language: 'en', published: true }),
          factory.entity(
            'Entity A',
            'template',
            { summary: [factory.metadataValue('about the law')] },
            { language: 'en', published: true }
          ),
          factory.entity(
            'Entity B',
            'template',
            { summary: [factory.metadataValue('about laws')] },
            { language: 'en', published: true }
          ),
          factory.entity(
            'Derechos de los países',
            'template',
            { summary: [factory.metadataValue('derechos nacionales')] },
            { language: 'es', published: true }
          ),
          factory.entity('Unrelated', 'template', {}, { language: 'en', published: true }),
        ],
        files: [
          factory.document('lawyer document', {
            entity: 'Unrelated',
            language: 'eng',
            fullText: { 1: 'a lawyer[[1]]' },
          }),
        ],
      },
      'search_metadata_stemming_test'
    );
  }, fixturesTimeOut);

  beforeEach(() => {
    userFactory.mockEditorUser();
  });

  afterEach(() => {
    userFactory.restore();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each(['law', 'laws'])('should find every variant of "%s" in metadata', async searchTerm => {
    expect(await searchTitles({ searchTerm })).toEqual(['Corporate laws', 'Entity A', 'Entity B']);
  });

  it('should find every variant in titles only, as the relationship dialog searches', async () => {
    expect(await searchTitles({ searchTerm: 'law', fields: ['title'] })).toEqual([
      'Corporate laws',
    ]);
  });

  it('should stem with the language of the request', async () => {
    expect(await searchTitles({ searchTerm: 'pais nacional' }, 'es')).toEqual([
      'Derechos de los países',
    ]);
  });

  it('should keep quoted words as exact matches', async () => {
    expect(await searchTitles({ searchTerm: '"law"' })).toEqual(['Entity A']);
  });

  it('should not widen the search on document full text', async () => {
    expect(await searchTitles({ searchTerm: 'lawyer' })).toEqual(['Unrelated']);
    expect(await searchTitles({ searchTerm: 'laws' })).not.toContain('Unrelated');
  });

  it('should return metadata snippets for the variants it matched', async () => {
    const snippets = await testingEnvironment.runWithContext(async () =>
      search.searchSnippets('law', 'Entity B', 'en')
    );

    expect(snippets.metadata).toEqual([
      { field: 'metadata.summary.value', texts: ['about <b>laws</b>'] },
    ]);
  });
});
