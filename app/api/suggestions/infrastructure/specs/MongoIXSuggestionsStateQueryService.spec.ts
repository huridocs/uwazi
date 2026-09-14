import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { StateRecomputeRow } from '../../domain/IXSuggestionsStateQueryService.js';
import { IXSuggestionsStateQueryServiceFactory } from '../IXSuggestionsStateQueryServiceFactory.js';

const factory = getFixturesFactory();

const extractorId = factory.id('extractor');

const languages: LanguagesListSchema = [
  { label: 'English', key: 'en', default: true },
  { label: 'Spanish', key: 'es' },
];

const collect = async (rows: AsyncIterable<StateRecomputeRow>) => {
  const collected: StateRecomputeRow[] = [];
  for await (const row of rows) {
    collected.push(row);
  }
  return collected;
};

const stream = async (
  scope: Parameters<
    ReturnType<typeof IXSuggestionsStateQueryServiceFactory.default>['streamForStateRecompute']
  >[0]
) => collect(IXSuggestionsStateQueryServiceFactory.default().streamForStateRecompute(scope));

/**
 * Contract test for the read half of the state recompute: which suggestions it walks, and the
 * entity value it pairs each one with. The arithmetic that turns a row into a state is
 * `getSuggestionState`, which is store-independent and tested in `app/shared/specs`.
 */
describe('MongoIXSuggestionsStateQueryService', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages }],
      entities: [
        factory.entity(
          'shared1',
          'template',
          { prop: [{ value: 'english value' }] },
          {
            language: 'en',
            title: 'English title',
          }
        ),
        factory.entity(
          'shared1',
          'template',
          { prop: [{ value: 'spanish value' }] },
          {
            language: 'es',
            title: 'Spanish title',
          }
        ),
      ],
      ixsuggestions: [
        factory.ixSuggestion({
          _id: factory.id('english'),
          extractorId,
          entityId: 'shared1',
          language: 'en',
          propertyName: 'prop',
          suggestedValue: 'english value',
        }),
        factory.ixSuggestion({
          _id: factory.id('spanish'),
          extractorId,
          entityId: 'shared1',
          language: 'es',
          propertyName: 'prop',
          suggestedValue: 'otra cosa',
        }),
      ],
    } as any);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should pair each suggestion with its own language entity value', async () => {
    const rows = await stream({ scope: { kind: 'all' }, languages });

    expect(rows).toHaveLength(2);
    expect(rows.find(r => r._id.toString() === factory.id('english').toString())).toMatchObject({
      currentValue: ['english value'],
      suggestedValue: 'english value',
      propertyName: 'prop',
    });
    expect(rows.find(r => r._id.toString() === factory.id('spanish').toString())).toMatchObject({
      currentValue: ['spanish value'],
    });
  });

  /**
   * A suggestion may carry a language the instance no longer has configured. It must still be
   * recomputed, against the default language entity, rather than silently dropping out of the
   * walk and keeping a stale state forever.
   */
  it('should fall back to the default language entity for an unconfigured language', async () => {
    await testingEnvironment.setUp({
      settings: [{ languages }],
      entities: [
        factory.entity(
          'shared1',
          'template',
          { prop: [{ value: 'english value' }] },
          {
            language: 'en',
          }
        ),
      ],
      ixsuggestions: [
        factory.ixSuggestion({
          extractorId,
          entityId: 'shared1',
          language: 'pt',
          propertyName: 'prop',
        }),
      ],
    } as any);

    const rows = await stream({ scope: { kind: 'all' }, languages });

    expect(rows).toHaveLength(1);
    expect(rows[0].currentValue).toEqual(['english value']);
  });

  it('should read the entity title when the property is the title', async () => {
    await testingEnvironment.setUp({
      settings: [{ languages }],
      entities: [
        factory.entity('shared1', 'template', {}, { language: 'en', title: 'English title' }),
      ],
      ixsuggestions: [
        factory.ixSuggestion({
          extractorId,
          entityId: 'shared1',
          language: 'en',
          propertyName: 'title',
        }),
      ],
    } as any);

    const rows = await stream({ scope: { kind: 'all' }, languages });

    expect(rows[0].currentValue).toEqual(['English title']);
  });

  it('should give an empty current value when the entity has none', async () => {
    await testingEnvironment.setUp({
      settings: [{ languages }],
      entities: [],
      ixsuggestions: [
        factory.ixSuggestion({
          extractorId,
          entityId: 'missing',
          language: 'en',
          propertyName: 'prop',
        }),
      ],
    } as any);

    const rows = await stream({ scope: { kind: 'all' }, languages });

    expect(rows[0].currentValue).toEqual([]);
  });

  it('should walk only the given ids when scoped to them', async () => {
    const rows = await stream({
      scope: { kind: 'ids', ids: [factory.id('spanish')] },
      languages,
    });

    expect(rows.map(r => r._id.toString())).toEqual([factory.id('spanish').toString()]);
  });

  it('should walk nothing when scoped to an empty set of ids', async () => {
    const rows = await stream({ scope: { kind: 'ids', ids: [] }, languages });

    expect(rows).toEqual([]);
  });
});
