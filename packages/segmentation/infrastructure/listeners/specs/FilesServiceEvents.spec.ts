import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import * as handleErrorModule from '#api/utils/handleError.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SegmentationComposition } from '../../../composition.js';
import {
  f,
  settings,
  useBackend,
  storedSegmentations,
  testConfigs,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

/**
 * The listeners as files are really created and deleted: `FilesService` emits after its
 * transaction has committed, from the transaction's own `onCommitted` callback.
 */
describe('segmentation listeners on FilesService events', () => {
  const document = FileBuilder.document(f.idString('document'), { filename: 'document.pdf' });
  let reported: jest.SpyInstance;

  beforeAll(async () => {
    await testingEnvironment.setUp(
      {},
      { postgres: true, postgresMirror: ['files', 'segmentations', 'settings'] }
    );
    SegmentationComposition.registerListeners(applicationEventsBus);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(() => {
    reported = jest.spyOn(handleErrorModule, 'handleError').mockImplementation(() => {});
  });

  afterEach(() => {
    reported.mockRestore();
  });

  const inTransaction = async (fn: () => Promise<void>) =>
    testingEnvironment.runWithContext(async () => ExecutionContext.transactionManager.run(fn));

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      useBackend(postgresCore);
      await testingEnvironment.setFixtures({ ...settings(true), files: [], segmentations: [] });
    });

    it('should register a PDF when FilesService creates it', async () => {
      await inTransaction(async () => FilesServiceFactory.default().insert([document]));

      expect(reported).not.toHaveBeenCalled();
      expect(await storedSegmentations(postgresCore)).toEqual([
        {
          id: expect.any(String),
          fileId: f.idString('document'),
          filename: 'document.pdf',
          status: 'queued',
        },
      ]);
    });

    it('should delete its segmentation when FilesService deletes it', async () => {
      await inTransaction(async () => FilesServiceFactory.default().insert([document]));

      await inTransaction(async () => FilesServiceFactory.default().delete([document]));

      expect(reported).not.toHaveBeenCalled();
      expect(await storedSegmentations(postgresCore)).toEqual([]);
    });
  });
});
