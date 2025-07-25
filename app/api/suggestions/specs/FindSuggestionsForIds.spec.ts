import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { ModelNotReadyError } from 'api/services/informationextraction/ixextractors';
import { ExternalDummyService } from 'api/services/tasksmanager/specs/ExternalDummyService';
import { testingTenants } from 'api/utils/testingTenants';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { FindSuggestionsForIds } from '../useCases/FindSuggestionsForIds';

// Mock only the TaskManager to make startTask calls work without real Redis
jest.mock('api/services/tasksmanager/TaskManager.ts');

// Mock socket emissions to avoid socket.io initialization error
jest.mock('api/socketio/setupSockets', () => ({
  emitToTenant: jest.fn(),
}));

const factory = getFixturesFactory();

const extractorId = factory.id('extractor_1');
const modelId = factory.id('model_1');

const fixtures: DBFixture = {
  settings: [
    {
      _id: factory.id('settings'),
      features: {
        metadataExtraction: {
          url: 'http://localhost:2308',
        },
      },
    },
  ],
  ixextractors: [factory.ixExtractor('extractor_1', 'target_text', ['template_1'])],
  ixmodels: [
    {
      _id: modelId,
      extractorId,
      status: ModelStatus.ready, // Already trained model!
      creationDate: Date.now(),
      totalSuggestionsToFind: 100,
    },
  ],
  templates: [factory.template('template_1', [factory.property('target_text', 'text')])],
  entities: [
    ...factory.entityInMultipleLanguages(['en'], 'entity1', 'template_1', {
      target_text: [{ value: 'some text content' }],
    }),
    ...factory.entityInMultipleLanguages(['en'], 'entity2', 'template_1', {
      target_text: [{ value: 'other text content' }],
    }),
  ],
  ixsuggestions: [
    factory.ixSuggestion({
      entityId: 'entity1',
      extractorId,
      entityTemplate: factory.id('template_1').toString(),
      propertyName: 'target_text',
      status: 'ready',
      state: { labeled: false, withValue: true, withSuggestion: false },
    }),
    factory.ixSuggestion({
      entityId: 'entity2',
      extractorId,
      entityTemplate: factory.id('template_1').toString(),
      propertyName: 'target_text',
      status: 'ready',
      state: { labeled: false, withValue: true, withSuggestion: false },
    }),
  ],
};

describe('FindSuggestionsForIds', () => {
  let useCase: FindSuggestionsForIds;
  let informationExtraction: InformationExtraction;
  let IXExternalService: ExternalDummyService;

  beforeAll(async () => {
    // Set up external service mock
    IXExternalService = new ExternalDummyService(2308, 'information_extraction', {
      materialsData: '(/labeled_data|/prediction_data)',
      resultsData: '/suggestions_results',
    });
    await IXExternalService.start();

    testingTenants.changeCurrentTenant({
      name: 'tenant1',
      uploadedDocuments: `${__dirname}/uploads/`,
    });

    // Use REAL InformationExtraction - true e2e!
    informationExtraction = new InformationExtraction();
    useCase = new FindSuggestionsForIds(informationExtraction);
  });

  afterAll(async () => {
    await IXExternalService.stop();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    IXExternalService.reset();
    await testingEnvironment.setUp(fixtures);
  });

  describe('execute', () => {
    it('should throw error when extractor not found', async () => {
      const nonExistentExtractorId = new ObjectId();

      await expect(
        useCase.execute({
          extractorId: nonExistentExtractorId,
          sharedIds: ['entity1', 'entity2'],
        })
      ).rejects.toThrow('Extractor not found');
    });

    it('should throw ModelNotReadyError when model is not ready', async () => {
      // Update the existing model to be in processing state
      await ixmodels.save({
        _id: modelId,
        extractorId,
        status: ModelStatus.processing, // Not ready
        creationDate: Date.now(),
        totalSuggestionsToFind: 100,
      });

      await expect(
        useCase.execute({
          extractorId,
          sharedIds: ['entity1', 'entity2'],
        })
      ).rejects.toThrow(ModelNotReadyError);
    });

    it('should throw error when find suggestions process is already running', async () => {
      // Set the model to have a running process
      await ixmodels.save({
        _id: modelId,
        extractorId,
        status: ModelStatus.ready,
        creationDate: Date.now(),
        totalSuggestionsToFind: 100,
        findSuggestionsRunTimestamp: Date.now(),
      });

      await expect(
        useCase.execute({
          extractorId,
          sharedIds: ['entity1', 'entity2'],
        })
      ).rejects.toThrow('A find suggestions process is already running for this extractor.');
    });

    it('should start find suggestions process, update model state, and return status', async () => {
      const result = await useCase.execute({
        extractorId,
        sharedIds: ['entity1', 'entity2'],
      });

      // Verify the model was updated with the find suggestions process
      // Note: In a real e2e test, the process completes quickly and clears these flags
      const [updatedModel] = await ixmodels.get({ extractorId });
      expect(updatedModel.findSuggestionsRunTimestamp).toBeDefined();

      // The process completed, so these should be cleared
      expect(updatedModel.findSuggestionsSharedIds).toEqual([]);
      expect(updatedModel.findingSuggestions).toBe(false);

      // Verify return value structure - this shows the final status
      expect(result).toEqual({
        total: expect.any(Number),
        processed: expect.any(Number),
      });
      expect(result.total).toBe(100); // From fixture

      // Verify that the process ran (we can see this from the timestamp being set)
      expect(updatedModel.findSuggestionsRunTimestamp).toBeGreaterThan(0);
    });

    it('should handle entity-based suggestions flow (property source)', async () => {
      // Create an extractor for property-based extraction
      const propertyExtractorId = factory.id('property_extractor');
      await testingEnvironment.db.getCollection('ixextractors')?.insertOne({
        _id: propertyExtractorId,
        name: 'Property Extractor',
        property: 'target_text',
        templates: [factory.id('template_1')],
        source: { property: 'source_text' }, // Property-based, not PDF
      });

      await testingEnvironment.db.getCollection('ixmodels')?.insertOne({
        _id: factory.id('property_model'),
        extractorId: propertyExtractorId,
        status: ModelStatus.ready,
        creationDate: Date.now(),
        totalSuggestionsToFind: 50,
      });

      const propertyUseCase = new FindSuggestionsForIds(informationExtraction);

      const result = await propertyUseCase.execute({
        extractorId: propertyExtractorId,
        sharedIds: ['entity1'],
      });

      // Verify the process started
      const [updatedModel] = await ixmodels.get({ extractorId: propertyExtractorId });
      expect(updatedModel.findSuggestionsRunTimestamp).toBeDefined();
      expect(updatedModel.findSuggestionsSharedIds).toEqual([]);

      expect(result.total).toBe(50);
    });
  });
});
