import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { IXModelsDAOFactory } from '../../infrastructure/IXModelsDAOFactory.js';
import { f, fixtures, models, TENANT_ID, testConfigs } from './IXModelsContractFixtures.js';
import { processRunContractCases, Sut } from './IXModelsProcessRunContractCases.js';

const readSyncLogs = async () => db.mongodb!.collection('updatelogs').find().toArray();

const readCases = (sut: Sut) => {
  describe('getByExtractorId()', () => {
    it('should return the model of the extractor', async () => {
      expect(await sut().getByExtractorId(f.id('running'))).toEqual(models.running);
    });

    it('should return undefined when the extractor has no model', async () => {
      expect(await sut().getByExtractorId(f.id('untrained'))).toBeUndefined();
    });
  });

  describe('getById()', () => {
    it('should return the model', async () => {
      expect(await sut().getById(models.idle._id)).toEqual(models.idle);
    });

    it('should return undefined for an unknown id', async () => {
      expect(await sut().getById(f.id('unknown'))).toBeUndefined();
    });
  });
};

const saveCases = (sut: Sut) => {
  describe('save()', () => {
    it('should merge into the existing row rather than replace it', async () => {
      const saved = await sut().save({ _id: models.running._id, totalSuggestionsToFind: 7 });

      const expected = { ...models.running, totalSuggestionsToFind: 7 };
      expect(saved).toEqual(expected);
      expect(await sut().getById(models.running._id)).toEqual(expected);
    });

    it('should create a row when no id is given', async () => {
      const created = await sut().save({ extractorId: f.id('fresh'), creationDate: 5 });

      expect(created._id).toBeDefined();
      expect(await sut().getById(created._id)).toMatchObject({
        extractorId: f.id('fresh'),
        creationDate: 5,
      });
    });

    it('should create a row with the given id when none exists for it', async () => {
      await sut().save({ _id: f.id('new model'), extractorId: f.id('fresh'), creationDate: 5 });

      expect(await sut().getByExtractorId(f.id('fresh'))).toMatchObject({
        _id: f.id('new model'),
        creationDate: 5,
      });
    });
  });
};

const statusCases = (sut: Sut) => {
  describe('markTraining()', () => {
    it('should mark the model processing and discard the whole previous process run', async () => {
      await sut().markTraining(f.id('running'), { maxSuggestionsToFind: 25 });

      const { processRun, ...rest } = models.running;
      expect(await sut().getByExtractorId(f.id('running'))).toEqual({
        ...rest,
        status: 'processing',
        findingSuggestions: true,
        maxSuggestionsToFind: 25,
      });
    });

    it('should create the model row, without a creation date, when the extractor has never been trained', async () => {
      await sut().markTraining(f.id('untrained'), { maxSuggestionsToFind: 5 });

      const created = await sut().getByExtractorId(f.id('untrained'));
      expect(created).toMatchObject({
        extractorId: f.id('untrained'),
        status: 'processing',
        findingSuggestions: true,
        maxSuggestionsToFind: 5,
      });
      expect(created!._id).toBeDefined();
      expect(created!.creationDate).toBeUndefined();
      expect(created!.processRun).toBeUndefined();
    });
  });

  describe('markFindingSuggestions()', () => {
    it('should flip the model into the finding-suggestions phase and return it', async () => {
      const expected = { ...models.idle, status: 'processing', findingSuggestions: true };

      expect(await sut().markFindingSuggestions(f.id('idle'))).toEqual(expected);
      expect(await sut().getById(models.idle._id)).toEqual(expected);
    });

    it('should return undefined when the extractor has no model', async () => {
      expect(await sut().markFindingSuggestions(f.id('untrained'))).toBeUndefined();
    });
  });

  describe('markReady()', () => {
    it('should flip the status and drop only the run queue, keeping the rest of processRun', async () => {
      const expected = {
        ...models.running,
        status: 'ready',
        findingSuggestions: false,
        processRun: { mode: 'process_selected', samplePolicy: 'only_marked' },
      };

      expect(await sut().markReady(f.id('running'))).toEqual(expected);
      expect(await sut().getById(models.running._id)).toEqual(expected);
    });

    it('should return undefined when the extractor has no model', async () => {
      expect(await sut().markReady(f.id('untrained'))).toBeUndefined();
    });
  });
};

/**
 * Information extraction data is not synced between instances, so no IX write may leave an
 * `updatelogs` row behind, on either backend.
 */
const syncLogCases = (sut: Sut) => {
  describe('sync logging', () => {
    it('should not record sync logs when a model is created or updated', async () => {
      await sut().save({ extractorId: f.id('fresh'), creationDate: 1 });
      await sut().save({ _id: models.idle._id, totalSuggestionsToFind: 1 });
      await sut().markTraining(f.id('untrained'), { maxSuggestionsToFind: 1 });
      await sut().markReady(f.id('running'));

      expect(await readSyncLogs()).toEqual([]);
    });
  });
};

/**
 * Fixtures are mirrored into both stores, so every other case would pass against the wrong one.
 * This pins that the factory routes writes to the store the tenant's `postgresCore` flag selects.
 */
const routingCases = (sut: Sut, usePostgres: boolean) => {
  describe('routing', () => {
    it("should write to the tenant's store only", async () => {
      const created = await sut().save({ extractorId: f.id('routed'), creationDate: 1 });

      const inPostgres = (await testingPG.getAllFrom('ix_models')).some(
        row => row._id === created._id.toString()
      );
      const inMongo = Boolean(
        await db.mongodb!.collection('ixmodels').findOne({ _id: created._id })
      );

      expect({ inPostgres, inMongo }).toEqual({ inPostgres: usePostgres, inMongo: !usePostgres });
    });
  });
};

/**
 * The IXModelsDataSource contract suite: one set of cases, run against the Mongo and the Postgres
 * implementation. Expectations are built from the fixture documents and compared with `toEqual`,
 * so a field present on one backend and absent on the other fails.
 */
describe('IXModelsDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut: Sut = () => testingEnvironment.runWithContext(() => IXModelsDAOFactory.default());

    readCases(sut);
    saveCases(sut);
    statusCases(sut);
    processRunContractCases(sut);
    syncLogCases(sut);
    routingCases(sut, usePostgres);
  });
});
