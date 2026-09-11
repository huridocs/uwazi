import { IXModelsDataSource } from '../IXModelsDataSource.js';
import { f, models } from './IXModelsContractFixtures.js';

type Sut = () => IXModelsDataSource;

const processRunCases = (sut: Sut) => {
  describe('setProcessRun()', () => {
    it('should replace the whole process run', async () => {
      await sut().setProcessRun(f.id('running'), { mode: 'process_all', find: { size: 3 } });

      const model = await sut().getByExtractorId(f.id('running'));
      expect(model!.processRun).toEqual({ mode: 'process_all', find: { size: 3 } });
    });
  });

  describe('clearProcessRun()', () => {
    it('should remove the process run and nothing else', async () => {
      await sut().clearProcessRun(f.id('running'));

      const { processRun, ...rest } = models.running;
      expect(await sut().getById(models.running._id)).toEqual(rest);
    });
  });

  describe('clearFindRunQueue()', () => {
    it('should drop only the three queue keys, keeping the rest of processRun', async () => {
      await sut().clearFindRunQueue(models.running._id);

      expect(await sut().getById(models.running._id)).toEqual({
        ...models.running,
        processRun: { mode: 'process_selected', samplePolicy: 'only_marked' },
      });
    });
  });

  describe('initializeFindRunQueue()', () => {
    it('should replace the queue and record the cohort, keeping the rest of processRun', async () => {
      await sut().initializeFindRunQueue(models.running._id, {
        pendingIds: ['x'],
        selectedSharedIds: ['x', 'y'],
        runTimestamp: 2000,
      });

      expect(await sut().getById(models.running._id)).toEqual({
        ...models.running,
        findingSuggestions: true,
        processRun: {
          mode: 'process_selected',
          samplePolicy: 'only_marked',
          suggestionsRunTimestamp: 2000,
          findSuggestionsSharedIds: ['x'],
          findSuggestionsInitialSharedIdsCount: 2,
          selectedSharedIdsForAutoAccept: ['x', 'y'],
        },
      });
    });

    it('should create the process run when the model has none', async () => {
      await sut().initializeFindRunQueue(models.idle._id, {
        pendingIds: [],
        selectedSharedIds: ['x'],
        runTimestamp: 2000,
      });

      expect(await sut().getById(models.idle._id)).toEqual({
        ...models.idle,
        findingSuggestions: true,
        processRun: {
          suggestionsRunTimestamp: 2000,
          findSuggestionsSharedIds: [],
          findSuggestionsInitialSharedIdsCount: 1,
          selectedSharedIdsForAutoAccept: ['x'],
        },
      });
    });
  });
};

const queueOf = async (sut: Sut, model: { _id: unknown }) =>
  (await sut().getById(model._id as string))!.processRun?.findSuggestionsSharedIds;

const takeCases = (sut: Sut) => {
  describe('takeFromFindRunQueue()', () => {
    it('should return the head of the queue and leave the tail behind', async () => {
      expect(await sut().takeFromFindRunQueue(models.running._id, 2)).toEqual(['a', 'b']);
      expect(await queueOf(sut, models.running)).toEqual(['c']);
    });

    it('should empty the queue when the batch is larger than what is left', async () => {
      expect(await sut().takeFromFindRunQueue(models.running._id, 10)).toEqual(['a', 'b', 'c']);
      expect(await queueOf(sut, models.running)).toEqual([]);
    });

    it('should return nothing when the queue is already empty', async () => {
      await sut().takeFromFindRunQueue(models.running._id, 10);

      expect(await sut().takeFromFindRunQueue(models.running._id, 5)).toEqual([]);
    });

    it('should return nothing when the model has no process run', async () => {
      expect(await sut().takeFromFindRunQueue(models.idle._id, 5)).toEqual([]);
    });

    it('should return nothing for an unknown model', async () => {
      expect(await sut().takeFromFindRunQueue(f.id('unknown'), 5)).toEqual([]);
    });

    it('should not lose or repeat ids when two takes race', async () => {
      const [first, second] = await Promise.all([
        sut().takeFromFindRunQueue(models.running._id, 2),
        sut().takeFromFindRunQueue(models.running._id, 2),
      ]);

      expect([...first, ...second].sort()).toEqual(['a', 'b', 'c']);
      expect(await queueOf(sut, models.running)).toEqual([]);
    });
  });
};

const appendCases = (sut: Sut) => {
  describe('appendToFindRunQueue()', () => {
    it('should union new ids in and grow the initial count by only the new ones', async () => {
      await sut().appendToFindRunQueue(models.running._id, ['c', 'd']);

      const model = await sut().getById(models.running._id);
      expect([...model!.processRun!.findSuggestionsSharedIds!].sort()).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
      expect(model!.processRun!.findSuggestionsInitialSharedIdsCount).toBe(4);
      expect(model!.findingSuggestions).toBe(true);
    });

    it('should start the queue when the model has no process run', async () => {
      await sut().appendToFindRunQueue(models.idle._id, ['x', 'y']);

      const model = await sut().getById(models.idle._id);
      expect([...model!.processRun!.findSuggestionsSharedIds!].sort()).toEqual(['x', 'y']);
      expect(model!.processRun!.findSuggestionsInitialSharedIdsCount).toBe(2);
      expect(model!.findingSuggestions).toBe(true);
    });

    it('should not lose ids when two appends race', async () => {
      await Promise.all([
        sut().appendToFindRunQueue(models.running._id, ['d']),
        sut().appendToFindRunQueue(models.running._id, ['e']),
      ]);

      const model = await sut().getById(models.running._id);
      expect([...model!.processRun!.findSuggestionsSharedIds!].sort()).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
      expect(model!.processRun!.findSuggestionsInitialSharedIdsCount).toBe(5);
    });
  });
};

const autoAcceptCases = (sut: Sut) => {
  describe('setAutoAcceptProgress()', () => {
    it('should set only the given counters, keeping the rest of processRun', async () => {
      await sut().setAutoAcceptProgress(f.id('running'), { total: 10, processed: 0 });
      await sut().setAutoAcceptProgress(f.id('running'), { processed: 4 });

      expect((await sut().getById(models.running._id))!.processRun).toEqual({
        ...models.running.processRun,
        autoAcceptProgress: { total: 10, processed: 4 },
      });
    });

    it('should leave the model untouched when no counter is given', async () => {
      await sut().setAutoAcceptProgress(f.id('running'), {});

      expect(await sut().getById(models.running._id)).toEqual(models.running);
    });
  });

  describe('incrementAutoAcceptProcessed()', () => {
    it('should create the counter when the model has no process run, then add to it', async () => {
      await sut().incrementAutoAcceptProcessed(f.id('idle'), 3);
      await sut().incrementAutoAcceptProcessed(f.id('idle'), 2);

      expect((await sut().getById(models.idle._id))!.processRun).toEqual({
        autoAcceptProgress: { processed: 5 },
      });
    });

    it('should not lose increments when two race', async () => {
      await Promise.all([
        sut().incrementAutoAcceptProcessed(f.id('running'), 1),
        sut().incrementAutoAcceptProcessed(f.id('running'), 1),
      ]);

      expect((await sut().getById(models.running._id))!.processRun!.autoAcceptProgress).toEqual({
        processed: 2,
      });
    });
  });

  describe('setSamplePolicy()', () => {
    it('should set the policy without disturbing the rest of the run', async () => {
      await sut().setSamplePolicy(f.id('running'), 'marked_plus_labeled');

      expect((await sut().getById(models.running._id))!.processRun).toEqual({
        ...models.running.processRun,
        samplePolicy: 'marked_plus_labeled',
      });
    });

    it('should create the process run when the model has none', async () => {
      await sut().setSamplePolicy(f.id('idle'), 'only_marked');

      expect((await sut().getById(models.idle._id))!.processRun).toEqual({
        samplePolicy: 'only_marked',
      });
    });
  });
};

/**
 * The cases for the `processRun` mutations — the run fields, the find-run queue and the
 * auto-accept counters — which every Postgres write reaches through JSONB operators.
 */
const processRunContractCases = (sut: Sut) => {
  processRunCases(sut);
  takeCases(sut);
  appendCases(sut);
  autoAcceptCases(sut);
};

export type { Sut };
export { processRunContractCases };
