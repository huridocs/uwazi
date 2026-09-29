import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ListenerRegistration } from '#api/ListenerRegistration.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SegmentOnFileCreated } from '../SegmentOnFileCreated.js';
import { DeleteSegmentationsOnFileDeleted } from '../DeleteSegmentationsOnFileDeleted.js';
import {
  f,
  settings,
  selectBackend,
  testConfigs,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

/**
 * The listeners as files are really created and deleted: `FilesService` emits inside its
 * transaction, and each event dispatches the segmentation listener subscribed to it once the
 * listeners are registered, as every entry point does.
 */
describe('segmentation listeners on FilesService events', () => {
  const document = FileBuilder.document(f.idString('document'), { filename: 'document.pdf' });

  beforeAll(async () => {
    await testingEnvironment.setUp(
      {},
      { postgres: true, postgresMirror: ['files', 'segmentations', 'settings'] }
    );
    ListenerRegistration.registerEvents();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const inTransaction = async (fn: () => Promise<void>) =>
    testingEnvironment.runWithContext(async () => ExecutionContext.transactionManager.run(fn), {
      factories: { eventEmitter: () => EventEmitterFactory.default() },
    });

  const dispatched = async (postgresCore: boolean) =>
    (await testingEnvironment.jobs.getAll({ postgresCore }))
      .map(job => ({
        name: job.name,
        params: typeof job.params === 'string' ? JSON.parse(job.params) : job.params,
      }))
      .filter(({ name }) => name.includes('Segment'));

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures({ ...settings(true), files: [], segmentations: [] });
      await testingEnvironment.jobs.clear();
    });

    it('should dispatch SegmentOnFileCreated when FilesService creates a file', async () => {
      await inTransaction(async () => FilesServiceFactory.default().insert([document]));

      expect(await dispatched(postgresCore)).toEqual([
        {
          name: SegmentOnFileCreated.asJob().name,
          params: expect.objectContaining({ file: document.toDTO() }),
        },
      ]);
    });

    it('should dispatch DeleteSegmentationsOnFileDeleted when FilesService deletes a file', async () => {
      await inTransaction(async () => FilesServiceFactory.default().delete([document]));

      expect(await dispatched(postgresCore)).toEqual([
        {
          name: DeleteSegmentationsOnFileDeleted.asJob().name,
          params: expect.objectContaining({ fileId: f.idString('document') }),
        },
      ]);
    });
  });
});
