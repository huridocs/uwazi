import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import {
  IXSuggestionsStateQueryService,
  StateRecomputeRow,
  StateRecomputeScope,
} from '../IXSuggestionsStateQueryService.js';
import { IXSuggestionsStateQueryServiceFactory } from '../../infrastructure/IXSuggestionsStateQueryServiceFactory.js';
import { f, TENANT_ID, testConfigs } from './IXSuggestionsContractFixtures.js';

type Sut = () => IXSuggestionsStateQueryService;

const extractorId = f.id('state extractor');

const languages: LanguagesListSchema = [
  { label: 'English', key: 'en', default: true },
  { label: 'Spanish', key: 'es' },
];

type Pairing = { entityId: string; language: string; propertyName?: string };

const suggestion = (name: string, { entityId, language, propertyName = 'prop' }: Pairing) =>
  f.ixSuggestion({
    _id: f.id(name),
    extractorId,
    entityId,
    language,
    propertyName,
    suggestedValue: `${name} suggestion`,
  });

const suggestions = {
  english: suggestion('english', { entityId: 'shared1', language: 'en' }),
  spanish: suggestion('spanish', { entityId: 'shared1', language: 'es' }),
  portuguese: suggestion('portuguese', { entityId: 'shared1', language: 'pt' }),
  multi: suggestion('multi', { entityId: 'shared2', language: 'en', propertyName: 'multi' }),
  title: suggestion('title', { entityId: 'shared3', language: 'en', propertyName: 'title' }),
  noEntity: suggestion('no entity', { entityId: 'missing', language: 'en' }),
  noProperty: suggestion('no property', { entityId: 'shared3', language: 'es' }),
};

/**
 * Entities are unpublished and carry no permissions, so in Postgres only a read that bypasses
 * permission RLS can see them.
 */
const fixtures = {
  ixextractors: [f.ixExtractor('state extractor', 'prop', ['template'])],
  entities: [
    f.entity('shared1', 'template', { prop: [{ value: 'english value' }] }, { language: 'en' }),
    f.entity('shared1', 'template', { prop: [{ value: 'spanish value' }] }, { language: 'es' }),
    f.entity(
      'shared2',
      'template',
      { multi: [{ value: 'a' }, { value: 'b' }] },
      { language: 'en' }
    ),
    f.entity('shared3', 'template', {}, { language: 'en', title: 'Shared three' }),
    f.entity('shared3', 'template', {}, { language: 'es', title: 'Compartido tres' }),
  ],
  ixsuggestions: Object.values(suggestions),
};

const collect = async (rows: AsyncIterable<StateRecomputeRow>) => {
  const collected: StateRecomputeRow[] = [];
  for await (const row of rows) {
    collected.push(row);
  }
  return collected;
};

const all: StateRecomputeScope = { kind: 'all' };

const recomputeRows = async (sut: Sut, scope: StateRecomputeScope = all) =>
  collect(sut().streamForStateRecompute({ scope, languages }));

const currentValueOf = async (sut: Sut, { _id }: { _id?: ObjectId | string }) =>
  (await recomputeRows(sut)).find(row => row._id.equals(_id!))?.currentValue;

const ids = (rows: { _id?: ObjectId | string }[]) => rows.map(({ _id }) => String(_id)).sort();

const pairingCases = (sut: Sut) => {
  it('should pair a suggestion with the entity in its own language', async () => {
    expect(await currentValueOf(sut, suggestions.english)).toEqual(['english value']);
    expect(await currentValueOf(sut, suggestions.spanish)).toEqual(['spanish value']);
  });

  /**
   * A suggestion may carry a language the instance no longer has configured. It must still be
   * recomputed, against the default language entity, rather than keep a stale state forever.
   */
  it('should fall back to the default language when the suggestion language is not configured', async () => {
    expect(await currentValueOf(sut, suggestions.portuguese)).toEqual(['english value']);
  });

  it('should return currentValue as the array of the property values', async () => {
    expect(await currentValueOf(sut, suggestions.multi)).toEqual(['a', 'b']);
  });

  it('should return [] when the entity or its property is missing', async () => {
    expect(await currentValueOf(sut, suggestions.noEntity)).toEqual([]);
    expect(await currentValueOf(sut, suggestions.noProperty)).toEqual([]);
  });

  it('should return [entity.title] for propertyName title', async () => {
    expect(await currentValueOf(sut, suggestions.title)).toEqual(['Shared three']);
  });

  it('should project only what the state arithmetic reads', async () => {
    const { english } = suggestions;

    expect((await recomputeRows(sut)).find(row => row._id.equals(english._id!))).toEqual({
      _id: english._id,
      propertyName: 'prop',
      extractorId,
      currentValue: ['english value'],
      suggestedValue: 'english suggestion',
      error: '',
      date: english.date,
      segment: '',
      status: 'ready',
    });
  });
};

const scopeCases = (sut: Sut) => {
  it('should walk every suggestion for scope all', async () => {
    expect(ids(await recomputeRows(sut))).toEqual(ids(Object.values(suggestions)));
  });

  it('should restrict to the given ids for scope ids', async () => {
    const scope: StateRecomputeScope = {
      kind: 'ids',
      ids: [suggestions.spanish._id!, suggestions.title._id!.toString()],
    };

    expect(ids(await recomputeRows(sut, scope))).toEqual(
      ids([suggestions.spanish, suggestions.title])
    );
    expect(await recomputeRows(sut, { kind: 'ids', ids: [] })).toEqual([]);
  });
};

/** A recompute can walk every suggestion of an instance, so nothing may be read before iterating. */
const laziness = (sut: Sut, usePostgres: boolean) => {
  it('should yield rows lazily, reading the store only when iterated', async () => {
    const rows = sut().streamForStateRecompute({ scope: all, languages });

    if (usePostgres) {
      await testingPG.clear(['ix_suggestions']);
    } else {
      await testingDB.clear(['ixsuggestions']);
    }

    expect(await collect(rows)).toEqual([]);
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

    expect(ids(await recomputeRows(sut))).toEqual(ids(Object.values(suggestions)));
  });
};

/**
 * The IXSuggestionsStateQueryService contract suite, run against the Mongo and the Postgres
 * implementation: the read half of the state recompute — which suggestions it walks, and the entity
 * value it pairs each one with. The arithmetic that turns a row into a state is
 * `getSuggestionState`, tested in `app/shared/specs`.
 */
describe('IXSuggestionsStateQueryService', () => {
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

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut: Sut = () =>
      testingEnvironment.runWithContext(() => IXSuggestionsStateQueryServiceFactory.default());

    pairingCases(sut);
    scopeCases(sut);
    laziness(sut, usePostgres);
    storeCases(sut, usePostgres);
  });
});
