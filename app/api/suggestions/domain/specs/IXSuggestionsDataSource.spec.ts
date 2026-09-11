import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { postgresTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  AcceptanceQuery,
  IXSuggestionsDataSource,
  Suggestion,
} from '../IXSuggestionsDataSource.js';
import { IXSuggestionsDAOFactory } from '../../infrastructure/IXSuggestionsDAOFactory.js';
import { PostgresIXSuggestionsDataSource } from '../../infrastructure/PostgresIXSuggestionsDataSource.js';
import {
  comparable,
  extractors,
  f,
  fixtures,
  inIdOrder,
  suggestions,
  TENANT_ID,
  testConfigs,
  withoutNulls,
} from './IXSuggestionsContractFixtures.js';

type Sut = () => IXSuggestionsDataSource;

const { accepted, blank, obsolete, spanish, otherExtractor, pdfFile1, pdfFile2 } = suggestions;

const readCases = (sut: Sut) => {
  describe('getByIds()', () => {
    it('should return the suggestions that exist, ignoring ids that cannot be object ids', async () => {
      const found = await sut().getByIds([accepted._id, pdfFile1._id, 'any', f.id('unknown')]);

      expect(comparable(found)).toEqual(comparable([accepted, pdfFile1]));
    });
  });

  describe('getIdsOwnedByExtractor()', () => {
    it('should keep only the ids belonging to the extractor', async () => {
      const owned = await sut().getIdsOwnedByExtractor(extractors.text, [
        accepted._id,
        pdfFile1._id,
        'any',
      ]);

      expect(owned).toEqual([accepted._id]);
    });
  });

  describe('getOneForEntity()', () => {
    it('should return the suggestion of the entity in that language', async () => {
      const found = await sut().getOneForEntity({
        extractorId: extractors.text,
        entityId: 'entity1',
        language: 'es',
      });

      expect(withoutNulls(found!)).toEqual(withoutNulls(spanish));
    });

    it('should return undefined when there is none', async () => {
      const query = { extractorId: extractors.pdf, entityId: 'entity1', language: 'es' };

      expect(await sut().getOneForEntity(query)).toBeUndefined();
    });
  });

  describe('getOneForFile()', () => {
    it('should return the suggestion of that file', async () => {
      const query = { extractorId: extractors.pdf, entityId: 'entity6', fileId: f.id('file 2') };

      expect(withoutNulls((await sut().getOneForFile(query))!)).toEqual(withoutNulls(pdfFile2));
    });

    it('should return undefined for a file without suggestion', async () => {
      const query = { extractorId: extractors.pdf, entityId: 'entity6', fileId: f.id('file 3') };

      expect(await sut().getOneForFile(query)).toBeUndefined();
    });
  });

  describe('getByFileIds()', () => {
    it("should return the extractor's suggestions for those files", async () => {
      const fileIds = [f.id('file 1'), f.id('file 2')];

      expect(comparable(await sut().getByFileIds(extractors.pdf, fileIds))).toEqual(
        comparable([pdfFile1, pdfFile2])
      );
      expect(await sut().getByFileIds(extractors.text, fileIds)).toEqual([]);
    });
  });

  describe('getByEntityId()', () => {
    it('should return every suggestion of the entity, in every language and extractor', async () => {
      expect(comparable(await sut().getByEntityId('entity1'))).toEqual(
        comparable([accepted, spanish, otherExtractor])
      );
      expect(await sut().getByEntityId('no-such-entity')).toEqual([]);
    });
  });

  describe('getByEntityLanguagePairs()', () => {
    it('should return the suggestions matching any of the pairs', async () => {
      const found = await sut().getByEntityLanguagePairs(extractors.text, [
        { sharedId: 'entity1', language: 'es' },
        { sharedId: 'entity2', language: 'en' },
      ]);

      expect(comparable(found)).toEqual(comparable([spanish, blank]));
    });
  });

  describe('getTrainingMarked()', () => {
    it('should return the entity, language and file of the suggestions marked for training', async () => {
      expect(await sut().getTrainingMarked(extractors.text)).toEqual([
        { entityId: 'entity1', language: 'en' },
      ]);
      expect(await sut().getTrainingMarked(extractors.pdf)).toEqual([
        { entityId: 'entity6', language: 'en', fileId: f.id('file 1') },
      ]);
    });
  });

  describe('isMarkedForTraining()', () => {
    it('should tell whether the entity is marked for training in that language', async () => {
      expect(await sut().isMarkedForTraining(extractors.text, 'entity1', 'en')).toBe(true);
      expect(await sut().isMarkedForTraining(extractors.text, 'entity2', 'en')).toBe(false);
    });
  });
};

const query = (overrides: Partial<AcceptanceQuery> = {}): AcceptanceQuery => ({
  extractorId: extractors.text,
  scope: { kind: 'all' },
  includeAlreadyValued: false,
  ...overrides,
});

/** `getAcceptable` projects these fields, in `_id` order. */
const acceptable = (list: Suggestion[]) =>
  inIdOrder(list).map(({ _id, entityId, entityLanguageId, state, modelData }) =>
    withoutNulls({ _id, entityId, entityLanguageId, state, modelData })
  );

const acceptanceCases = (sut: Sut) => {
  describe('getAcceptable() and countAcceptable()', () => {
    it('should exclude suggestions whose entity already has a value unless overwriting', async () => {
      expect((await sut().getAcceptable(query(), { limit: 10 })).map(withoutNulls)).toEqual(
        acceptable([blank])
      );
      expect(await sut().countAcceptable(query())).toBe(1);
    });

    it('should take ready, suggested, healthy suggestions only, in id order', async () => {
      const overwriting = query({ includeAlreadyValued: true });

      expect((await sut().getAcceptable(overwriting, { limit: 10 })).map(withoutNulls)).toEqual(
        acceptable([accepted, blank, spanish])
      );
      expect(await sut().countAcceptable(overwriting)).toBe(3);
    });

    it('should page through the acceptable suggestions', async () => {
      const overwriting = query({ includeAlreadyValued: true });

      const first = await sut().getAcceptable(overwriting, { limit: 2 });
      const rest = await sut().getAcceptable(overwriting, { limit: 2, skip: 2 });

      expect([...first, ...rest].map(withoutNulls)).toEqual(acceptable([accepted, blank, spanish]));
    });

    it('should scope to a cohort of entities, accepting nothing for an empty one', async () => {
      const cohort = query({
        includeAlreadyValued: true,
        scope: { kind: 'entities', entityIds: ['entity1'] },
      });
      const empty = query({ scope: { kind: 'entities', entityIds: [] } });

      expect(await sut().countAcceptable(cohort)).toBe(2);
      expect(await sut().countAcceptable(empty)).toBe(0);
      expect(await sut().getAcceptable(empty, { limit: 10 })).toEqual([]);
    });

    it('should scope to a run timestamp', async () => {
      const run = (runTimestamp: number) =>
        query({ includeAlreadyValued: true, scope: { kind: 'run', runTimestamp } });

      expect(await sut().countAcceptable(run(500))).toBe(2);
      expect(await sut().countAcceptable(run(999))).toBe(0);
    });
  });
};

const countCases = (sut: Sut) => {
  describe('counts', () => {
    it('should count every suggestion of the extractor', async () => {
      expect(await sut().countAllForExtractor(extractors.text)).toBe(7);
    });

    it('should count the three pending statuses, all of them by default', async () => {
      // non-processed: pending, stateless; obsolete: obsolete; error: errored
      expect(await sut().countPendingForExtractor(extractors.text)).toBe(4);
      expect(await sut().countPendingForExtractor(extractors.text, { nonProcessed: true })).toBe(2);
      expect(await sut().countPendingForExtractor(extractors.text, { obsolete: true })).toBe(1);
      expect(
        await sut().countPendingForExtractor(extractors.text, { obsolete: true, error: true })
      ).toBe(2);
    });

    it('should split the pending suggestions by label, a stateless one being unlabeled', async () => {
      expect(await sut().countPendingByLabel(extractors.text)).toEqual({
        labeled: 1,
        unlabeled: 3,
      });
      expect(await sut().countPendingByLabel(extractors.text, { nonProcessed: true })).toEqual({
        labeled: 1,
        unlabeled: 1,
      });
    });

    it('should count what a run completed', async () => {
      expect(await sut().countProcessedInRun(extractors.text, 500)).toBe(2);
      expect(await sut().countProcessedInRun(extractors.text, 501)).toBe(0);
    });

    it('should count what was processed since a point in time', async () => {
      expect(await sut().countProcessedSince(extractors.text, 850)).toBe(4);
    });
  });
};

const entityIdSetCases = (sut: Sut) => {
  describe('entity id sets', () => {
    const entityIds = ['entity1', 'entity2', 'entity3', 'entity4', 'entity5', 'entity7'];

    it('should report entities already queued or answered in this run', async () => {
      const seen = await sut().getEntityIdsSeenInRun(
        extractors.text,
        ['entity1', 'entity3', 'entity4', 'entity5'],
        500
      );

      // entity1 answered in run 500, entity4 processing; entity3 obsolete, entity5 failed
      expect([...seen].sort()).toEqual(['entity1', 'entity4']);
    });

    it('should separate entities with healthy suggestions from those with obsolete ones', async () => {
      const healthy = await sut().getEntityIdsWithHealthySuggestions(extractors.text, entityIds);

      expect([...healthy].sort()).toEqual(['entity1', 'entity2']);
      expect(await sut().getEntityIdsWithObsoleteSuggestions(extractors.text, entityIds)).toEqual([
        obsolete.entityId,
      ]);
    });

    it('should return nothing for no candidates', async () => {
      expect(await sut().getEntityIdsWithHealthySuggestions(extractors.text, [])).toEqual([]);
    });
  });
};

/**
 * The IXSuggestionsDataSource contract suite, read half: one set of cases, run against the Mongo
 * and the Postgres implementation. The write half moves here in slice 4b.
 */
describe('IXSuggestionsDataSource', () => {
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

    // Temporary until slice 4b routes IXSuggestionsDAOFactory, adds the routing case and builds
    // both runs through default(): the Postgres run constructs its implementation here.
    const sut: Sut = () =>
      testingEnvironment.runWithContext(() =>
        usePostgres
          ? new PostgresIXSuggestionsDataSource({
              tenantId: ExecutionContext.currentTenant.name,
              pgTransactionManager: postgresTransactionManager(),
            })
          : IXSuggestionsDAOFactory.default()
      );

    readCases(sut);
    acceptanceCases(sut);
    countCases(sut);
    entityIdSetCases(sut);
  });
});
