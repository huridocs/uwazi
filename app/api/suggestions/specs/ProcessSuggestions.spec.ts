import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { SegmentationModel } from '#api/services/pdfsegmentation/segmentationModel.js';
import { InformationExtraction } from '#api/services/informationextraction/InformationExtraction.js';
import {
  factory,
  fixtures,
  patchFixturesWithPort,
} from '#api/services/informationextraction/specs/fixtures.js';
import { ixTestAccess } from '#api/services/informationextraction/specs/ixTestAccess.js';
import { ExternalDummyService } from '#api/services/tasksmanager/specs/ExternalDummyService.js';
import { ProcessSuggestions } from '../useCases/ProcessSuggestions.js';

jest.mock('api/services/tasksmanager/TaskManager.ts');
jest.mock('api/socketio/setupSockets');
jest.mock('api/core/libs/queue/configuration/factories', () => ({
  DefaultQueueAdapter: jest.fn(),
  DefaultDispatcher: () => ({
    dispatch: jest.fn(),
  }),
}));

const NOT_SEGMENTED_MESSAGE =
  'Documents are not segmented yet. Try again once PDF segmentation has finished.';

describe('ProcessSuggestions', () => {
  let IXExternalService: ExternalDummyService;

  const processExtractor = async () =>
    testingEnvironment.runWithContext(async () =>
      new ProcessSuggestions({ informationExtraction: new InformationExtraction() }).execute({
        extractorId: factory.id('prop1extractor').toString(),
        mode: 'process_extractor',
        find: { enabled: true, filters: { nonProcessed: true, obsolete: true, error: true } },
        autoAccept: { enabled: false },
      })
    );

  beforeEach(async () => {
    IXExternalService = new ExternalDummyService(0, 'informationExtraction', {
      materialsFiles: '(/xml_to_train/:tenant/:id|/xml_to_predict/:tenant/:id)',
      materialsData: '(/labeled_data|/prediction_data)',
      resultsData: '/suggestions_results',
    });
    await IXExternalService.start();
    await testingEnvironment.setUp(patchFixturesWithPort(fixtures, IXExternalService.actualPort!));
    testingTenants.changeCurrentTenant({
      name: 'tenant1',
      uploadedDocuments: `${__dirname}/../../services/informationextraction/specs/uploads/`,
    });
    await ixTestAccess.writeModel({
      ...(await ixTestAccess.readModel(factory.id('prop1extractor'))),
      findingSuggestions: false,
    });
    jest.resetAllMocks();
    // eslint-disable-next-line no-empty-function
    jest.spyOn(setupSockets, 'emitToTenantAdminsAndEditors').mockImplementation(() => {});
  });

  afterEach(async () => {
    await IXExternalService.stop();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when no pending pdf has a ready segmentation', () => {
    beforeEach(async () => {
      await SegmentationModel.delete({});
    });

    it('should answer ready with the reason, agreeing with the emitted status', async () => {
      const response = await processExtractor();

      expect(response).toEqual({ status: 'ready', message: NOT_SEGMENTED_MESSAGE });
      expect(setupSockets.emitToTenantAdminsAndEditors).toHaveBeenCalledWith(
        'tenant1',
        'ix_model_status',
        factory.id('prop1extractor'),
        'ready',
        NOT_SEGMENTED_MESSAGE,
        { error: true }
      );
    });

    it('should leave the model idle', async () => {
      await processExtractor();

      const model = await ixTestAccess.readModel(factory.id('prop1extractor'));
      expect(model.status).toBe('ready');
      expect(model.findingSuggestions).toBe(false);
    });
  });

  it('should answer processing_suggestions when a batch was sent', async () => {
    const response = await processExtractor();

    expect(response).toMatchObject({
      status: 'processing_suggestions',
      message: 'Finding suggestions',
    });
    expect(setupSockets.emitToTenantAdminsAndEditors).not.toHaveBeenCalledWith(
      'tenant1',
      'ix_model_status',
      factory.id('prop1extractor'),
      'ready',
      expect.anything(),
      expect.anything()
    );
  });
});
