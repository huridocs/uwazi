/* eslint-disable max-statements */
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
  ixextractors: [
    factory.ixExtractor('extractor_1', 'target_text', ['template_1'], { property: 'target_text' }),
  ],
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
      target_text: [{ value: 'some text content for entity1' }],
    }),
    ...factory.entityInMultipleLanguages(['en'], 'entity2', 'template_1', {
      target_text: [{ value: 'other text content for entity2' }],
    }),
    ...factory.entityInMultipleLanguages(['en'], 'entity3', 'template_1', {
      target_text: [{ value: 'text content for entity3' }],
    }),
    ...factory.entityInMultipleLanguages(['en'], 'entity4', 'template_1', {
      target_text: [{ value: 'text content for entity4' }],
    }),
    ...factory.entityInMultipleLanguages(['en'], 'entity5', 'template_1', {
      target_text: [{ value: 'text content for entity5' }],
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
      // Before: Verify we have 5 entities total in fixtures
      const allEntities = await testingEnvironment.db
        .getCollection('entities')
        ?.find({ template: factory.id('template_1') })
        .toArray();
      expect(allEntities?.length).toBe(5); // entity1, entity2, entity3, entity4, entity5

      const result = await useCase.execute({
        extractorId,
        sharedIds: ['entity1', 'entity2'], // Only requesting 2 out of 5
      });

      // Verify the process initiated correctly
      expect(result).toEqual({
        total: 2,
        processed: expect.any(Number),
      });

      // CRITICAL: Verify materials were sent ONLY for the 2 specified entities
      expect(IXExternalService.materials.length).toBe(2); // Exactly 2 materials

      // For property-based extraction, materials should contain entity data
      const sentMaterials = IXExternalService.materials;

      // Should contain data for entity1 and entity2 only (with language suffix)
      const sentEntityNames = sentMaterials.map(material => material.entity_name);
      expect(sentEntityNames).toEqual(expect.arrayContaining(['entity1___en', 'entity2___en']));

      // Extract the base entity IDs (without language suffix)
      const sentEntityIds = sentEntityNames.map(name => name.split('___')[0]);
      expect(sentEntityIds).toEqual(expect.arrayContaining(['entity1', 'entity2']));

      // Should NOT contain entity3, entity4, or entity5
      expect(sentEntityIds).not.toContain('entity3');
      expect(sentEntityIds).not.toContain('entity4');
      expect(sentEntityIds).not.toContain('entity5');

      // Should contain the actual text content for the specified entities
      const entity1Material = sentMaterials.find(m => m.entity_name === 'entity1___en');
      const entity2Material = sentMaterials.find(m => m.entity_name === 'entity2___en');

      expect(entity1Material).toBeDefined();
      expect(entity2Material).toBeDefined();

      // Verify the materials contain the expected text content
      expect(entity1Material.source_text).toBe('some text content for entity1');
      expect(entity2Material.source_text).toBe('other text content for entity2');

      // Verify the model state after the process has been initiated
      const testStartTime = Date.now() - 10000; // 10 seconds ago
      const [finalModel] = await ixmodels.get({ extractorId });
      expect(finalModel.findSuggestionsRunTimestamp).toBeGreaterThan(testStartTime);

      // In an async process, sharedIds get processed and cleared, but process flag remains true
      expect(finalModel.findSuggestionsSharedIds).toEqual([]); // Entities have been processed
      expect(finalModel.findingSuggestions).toBe(true); // Process still running
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

      expect(result).toEqual({ processed: 1, total: 1 });
    });
  });
});
