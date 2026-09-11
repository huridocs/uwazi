import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { SuggestionCustomFilter } from '#shared/types/suggestionType.js';
import { Suggestion } from '../IXSuggestionsDataSource.js';
import { IXSuggestionsTableQueryService, TableQuery } from '../IXSuggestionsTableQueryService.js';
import { IXSuggestionsTableQueryServiceFactory } from '../../infrastructure/IXSuggestionsTableQueryServiceFactory.js';
import {
  extractors,
  f,
  fixtures,
  suggestions,
  TENANT_ID,
  testConfigs,
  textSuggestion,
} from './IXSuggestionsContractFixtures.js';

type Sut = () => IXSuggestionsTableQueryService;

const tableExtractor = f.id('table extractor');

const tableRow = (name: string, props: Parameters<typeof textSuggestion>[1]) =>
  textSuggestion(`table ${name}`, { extractorId: tableExtractor, entityId: name, ...props });

/**
 * The table extractor's suggestions. Titles and current values differ only in case, so the order
 * proves binary comparison: Mongo puts every upper case letter before every lower case one.
 * `untitled` has no title, no current value and no `useForTraining`.
 */
const table = {
  upperB: tableRow('upper B', {
    entityTitle: 'B',
    currentValue: 'b',
    date: 300,
    segment: 'segment B',
    state: { labeled: true, match: false, hasContext: true },
  }),
  lowerA: tableRow('lower a', { entityTitle: 'a', currentValue: 'B', date: 100 }),
  upperA: tableRow('upper A', { entityTitle: 'A', currentValue: 'a', date: 200 }),
  lowerB: tableRow('lower b', { entityTitle: 'b', currentValue: 'A', date: 400 }),
  untitled: (({ useForTraining, ...suggestion }) => suggestion as Suggestion)(
    tableRow('untitled', { date: 500 })
  ),
};

const tableFixtures = {
  ixextractors: [
    ...fixtures.ixextractors!,
    f.ixExtractor('table extractor', 'table_property', ['template'], { property: 'source' }),
  ],
  ixsuggestions: [...fixtures.ixsuggestions!, ...Object.values(table)],
};

const page = { skip: 0, limit: 30 };

const onWire = <T>(value: T) => JSON.parse(JSON.stringify(value));

const getForTable = async (sut: Sut, query: Partial<TableQuery> = {}) =>
  sut().getForTable({ extractorId: tableExtractor, page, ...query });

const idsOf = (rows: { _id: unknown }[]) => rows.map(({ _id }) => String(_id)).sort();

const titlesOf = async (sut: Sut, query: Partial<TableQuery> = {}) =>
  (await getForTable(sut, query)).rows.map(row => row.entityTitle ?? null);

/** Every status flag off but the given ones. */
const only = (...flags: (keyof SuggestionCustomFilter)[]): SuggestionCustomFilter => ({
  labeled: false,
  nonLabeled: false,
  useForTraining: false,
  nonProcessed: false,
  obsolete: false,
  error: false,
  match: false,
  mismatch: false,
  noContext: false,
  ...Object.fromEntries(flags.map(flag => [flag, true])),
});

const { accepted, blank, obsolete, pending, errored, spanish, stateless } = suggestions;
const textExtractorSuggestions = [accepted, blank, obsolete, pending, errored, spanish, stateless];

const filterCases = (sut: Sut) => {
  const filtered = async (statusFilter: SuggestionCustomFilter, extractorId = extractors.text) =>
    sut().getForTable({ extractorId, statusFilter, page });

  /**
   * What each flag selects among the text extractor's suggestions. `nonLabeled` and the quality
   * flags need a stored false: `stateless` has no `labeled` and `blank` a null `match`. The quality
   * flags also need a processed suggestion, which is why `obsolete`, whose match is false, is no
   * mismatch.
   */
  it.each([
    { flag: 'labeled', expected: [accepted, pending] },
    { flag: 'nonLabeled', expected: [blank, obsolete, errored, spanish] },
    { flag: 'useForTraining', expected: [accepted] },
    { flag: 'nonProcessed', expected: [pending, stateless] },
    { flag: 'obsolete', expected: [obsolete] },
    { flag: 'error', expected: [errored] },
    { flag: 'match', expected: [accepted] },
    { flag: 'mismatch', expected: [] },
    { flag: 'noContext', expected: [accepted, blank, spanish] },
  ] as { flag: keyof SuggestionCustomFilter; expected: Suggestion[] }[])(
    'should select what $flag selects, with its total',
    async ({ flag, expected }) => {
      const { rows, total } = await filtered(only(flag));

      expect(idsOf(rows)).toEqual(idsOf(expected));
      expect(total).toBe(expected.length);
    }
  );

  it('should count mismatch for a processed suggestion with a stored false match', async () => {
    expect(idsOf((await filtered(only('mismatch'), tableExtractor)).rows)).toEqual(
      idsOf([table.upperB])
    );
  });

  /**
   * The flags are a union, not an intersection: asking for nonProcessed *and* error means "either",
   * which is what the settings sidepanel's checkboxes mean.
   */
  it('should filter by the union of the selected status flags', async () => {
    const { rows, total } = await filtered(only('nonProcessed', 'error'));

    expect(idsOf(rows)).toEqual(idsOf([pending, stateless, errored]));
    expect(total).toBe(3);
  });

  it('should apply no restriction when every flag is off or there is no filter', async () => {
    expect(idsOf((await filtered(only())).rows)).toEqual(idsOf(textExtractorSuggestions));
    expect(idsOf((await sut().getForTable({ extractorId: extractors.text, page })).rows)).toEqual(
      idsOf(textExtractorSuggestions)
    );
  });
};

const sortCases = (sut: Sut) => {
  /** Binary order, as Mongo compares strings; an absent title sorts as null, first. */
  it('should default to entityTitle ascending, null first and upper case before lower', async () => {
    expect(await titlesOf(sut)).toEqual([null, 'A', 'B', 'a', 'b']);
    expect(await titlesOf(sut, { sort: { field: '', order: 'asc' } })).toEqual([
      null,
      'A',
      'B',
      'a',
      'b',
    ]);
  });

  it('should sort descending with null last', async () => {
    expect(await titlesOf(sut, { sort: { field: 'entityTitle', order: 'desc' } })).toEqual([
      'b',
      'a',
      'B',
      'A',
      null,
    ]);
  });

  it('should sort by a stored numeric field', async () => {
    expect(await titlesOf(sut, { sort: { field: 'date', order: 'desc' } })).toEqual([
      null,
      'b',
      'B',
      'A',
      'a',
    ]);
  });

  /** The table sorts by current value too, which is stored as JSON. */
  it('should sort string values of a JSON field in binary order', async () => {
    const { rows } = await getForTable(sut, { sort: { field: 'currentValue', order: 'asc' } });

    expect(rows.map(row => row.currentValue ?? null)).toEqual([null, 'A', 'B', 'a', 'b']);
  });

  /** The sort field is caller input; one naming no stored field orders nothing, and breaks nothing. */
  it('should still return every row for a sort field that is not a stored field', async () => {
    const { rows, total } = await getForTable(sut, {
      sort: { field: 'entityTitle"; DROP TABLE ix_suggestions; --', order: 'desc' },
    });

    expect(idsOf(rows)).toEqual(idsOf(Object.values(table)));
    expect(total).toBe(5);
  });
};

const pageCases = (sut: Sut) => {
  it('should apply skip and limit, and report the total of every match, not of the page', async () => {
    const { rows, total } = await getForTable(sut, { page: { skip: 1, limit: 2 } });

    expect(rows.map(row => row.entityTitle)).toEqual(['A', 'B']);
    expect(total).toBe(5);
  });

  it('should return no rows and a zero total for an extractor without suggestions', async () => {
    expect(await sut().getForTable({ extractorId: f.id('no suggestions'), page })).toEqual({
      rows: [],
      total: 0,
    });
  });
};

/**
 * The table renames three stored fields. Rows are compared as they reach the client, where Mongo's
 * ObjectIds and Postgres' hex strings serialise the same.
 */
const projectionCases = (sut: Sut) => {
  it('should project exactly the table fields, with the entity ids under the names the table uses', async () => {
    const { rows } = await getForTable(sut, { sort: { field: 'date', order: 'asc' }, page });
    const { upperB } = table;

    expect(onWire(rows.find(row => row.entityTitle === 'B'))).toEqual(
      onWire({
        _id: upperB._id,
        sharedId: upperB.entityId,
        entityId: upperB.entityLanguageId,
        entityTemplateId: upperB.entityTemplate,
        extractorId: tableExtractor,
        entityTitle: 'B',
        currentValue: 'b',
        language: 'en',
        propertyName: upperB.propertyName,
        suggestedValue: '',
        segment: 'segment B',
        state: upperB.state,
        date: 300,
        error: '',
        status: 'ready',
        useForTraining: false,
      })
    );
  });

  it('should default useForTraining to false when the suggestion has none', async () => {
    const { rows } = await getForTable(sut);

    expect(rows.map(row => row.useForTraining)).toEqual([false, false, false, false, false]);
  });
};

/**
 * Fixtures are mirrored into both stores, so every other case would pass against the wrong one.
 * With the other store's suggestions gone, only the tenant's store can answer.
 */
const storeCases = (sut: Sut, usePostgres: boolean) => {
  it("should read from the tenant's store", async () => {
    if (usePostgres) {
      await testingDB.clear(['ixsuggestions']);
    } else {
      await testingPG.clear(['ix_suggestions']);
    }

    expect(await titlesOf(sut)).toEqual([null, 'A', 'B', 'a', 'b']);
  });
};

/**
 * The IXSuggestionsTableQueryService contract suite, run against the Mongo and the Postgres
 * implementation: the store-specific half of the settings suggestions table — match, sort, page,
 * count and projection. The store-independent half lives in `GetSuggestionsForTableQuery` and is
 * covered by `specs/getSuggestionsForTableQuery.spec.ts`.
 */
describe('IXSuggestionsTableQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(tableFixtures);
    });

    const sut: Sut = () =>
      testingEnvironment.runWithContext(() => IXSuggestionsTableQueryServiceFactory.default());

    filterCases(sut);
    sortCases(sut);
    pageCases(sut);
    projectionCases(sut);
    storeCases(sut, usePostgres);
  });
});
