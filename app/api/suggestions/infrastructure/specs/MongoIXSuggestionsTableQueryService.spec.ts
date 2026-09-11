import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { IXSuggestionsTableQueryServiceFactory } from '../IXSuggestionsTableQueryServiceFactory.js';

const factory = getFixturesFactory();

const queryService = () => IXSuggestionsTableQueryServiceFactory.default();

const extractorId = factory.id('extractor');
const otherExtractorId = factory.id('otherExtractor');

const page = { skip: 0, limit: 30 };

/**
 * Contract test for the store-specific half of the suggestions table: match, sort, page, count
 * and projection. The store-independent half — extractor lookup, property lookup and the
 * `suggestedValue` defaulting — lives in `GetSuggestionsForTableQuery` and is covered by
 * `specs/getSuggestionsForTableQuery.spec.ts`.
 */
describe('MongoIXSuggestionsTableQueryService', () => {
  afterAll(async () => testingEnvironment.tearDown());

  describe('getForTable', () => {
    it('should return only the suggestions of the given extractor, with the total', async () => {
      await testingEnvironment.setUp({
        ixsuggestions: [
          factory.ixSuggestion({ extractorId, entityTitle: 'a' }),
          factory.ixSuggestion({ extractorId, entityTitle: 'b' }),
          factory.ixSuggestion({ extractorId: otherExtractorId, entityTitle: 'c' }),
        ],
      } as any);

      const { rows, total } = await queryService().getForTable({ extractorId, page });

      expect(total).toBe(2);
      expect(rows.map(r => r.entityTitle)).toEqual(['a', 'b']);
    });

    describe('pagination', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp({
          ixsuggestions: ['a', 'b', 'c', 'd', 'e'].map(entityTitle =>
            factory.ixSuggestion({ extractorId, entityTitle })
          ),
        } as any);
      });

      it('should apply skip and limit', async () => {
        const { rows } = await queryService().getForTable({
          extractorId,
          page: { skip: 2, limit: 2 },
        });

        expect(rows.map(r => r.entityTitle)).toEqual(['c', 'd']);
      });

      /** The page count the caller renders comes from this, so it must ignore the page. */
      it('should report the total of every match, not of the page', async () => {
        const { total } = await queryService().getForTable({
          extractorId,
          page: { skip: 2, limit: 2 },
        });

        expect(total).toBe(5);
      });
    });

    describe('sorting', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({ extractorId, entityTitle: 'b', date: 300 }),
            factory.ixSuggestion({ extractorId, entityTitle: 'c', date: 100 }),
            factory.ixSuggestion({ extractorId, entityTitle: 'a', date: 200 }),
          ],
        } as any);
      });

      it('should sort ascending by the given field', async () => {
        const { rows } = await queryService().getForTable({
          extractorId,
          page,
          sort: { field: 'date', order: 'asc' },
        });

        expect(rows.map(r => r.entityTitle)).toEqual(['c', 'a', 'b']);
      });

      it('should sort descending by the given field', async () => {
        const { rows } = await queryService().getForTable({
          extractorId,
          page,
          sort: { field: 'date', order: 'desc' },
        });

        expect(rows.map(r => r.entityTitle)).toEqual(['b', 'a', 'c']);
      });
    });

    /**
     * The nine booleans are a union, not an intersection: asking for labeled *and* error means
     * "either", which is what the settings sidepanel's checkboxes mean.
     */
    describe('status filter', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({ extractorId, entityTitle: 'labeled', state: { labeled: true } }),
            factory.ixSuggestion({
              extractorId,
              entityTitle: 'unlabeled',
              state: { labeled: false },
            }),
            factory.ixSuggestion({
              extractorId,
              entityTitle: 'errored',
              date: 1000,
              state: { labeled: true, error: true },
            }),
            factory.ixSuggestion({
              extractorId,
              entityTitle: 'pending',
              date: null as any,
              state: { labeled: false },
            }),
          ],
        } as any);
      });

      it('should keep only the suggestions a single flag selects', async () => {
        const { rows, total } = await queryService().getForTable({
          extractorId,
          page,
          statusFilter: { nonLabeled: true } as any,
        });

        expect(rows.map(r => r.entityTitle).sort()).toEqual(['pending', 'unlabeled']);
        expect(total).toBe(2);
      });

      it('should union the suggestions several flags select', async () => {
        const { rows } = await queryService().getForTable({
          extractorId,
          page,
          statusFilter: { nonProcessed: true, error: true } as any,
        });

        expect(rows.map(r => r.entityTitle).sort()).toEqual(['errored', 'pending']);
      });

      it('should apply no restriction when every flag is off', async () => {
        const { total } = await queryService().getForTable({
          extractorId,
          page,
          statusFilter: { labeled: false, error: false } as any,
        });

        expect(total).toBe(4);
      });
    });

    describe('projection', () => {
      it('should expose the entity ids under the names the table uses', async () => {
        const entityLanguageId = factory.id('entityLanguage');
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({
              extractorId,
              entityId: 'shared1',
              entityLanguageId: entityLanguageId as any,
              entityTemplate: factory.id('template').toString(),
            }),
          ],
        } as any);

        const { rows } = await queryService().getForTable({ extractorId, page });

        expect(rows[0]).toMatchObject({
          sharedId: 'shared1',
          entityId: entityLanguageId,
          entityTemplateId: factory.id('template').toString(),
        });
      });

      it('should default useForTraining to false when the row has none', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({ extractorId, entityTitle: 'with', useForTraining: true }),
            factory.ixSuggestion({ extractorId, entityTitle: 'without' }),
          ],
        } as any);

        const { rows } = await queryService().getForTable({ extractorId, page });

        expect(rows.map(r => r.useForTraining)).toEqual([true, false]);
      });
    });
  });
});
