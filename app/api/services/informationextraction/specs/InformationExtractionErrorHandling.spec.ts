/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { ModelStatus } from '#shared/types/IXModelSchema.js';

import { factory, fixtures, patchFixturesWithPort } from './fixtures.js';
import { ixTestAccess } from './ixTestAccess.js';
import { ExtractionKey } from '../ExtractionKey.js';
import { InformationExtraction } from '../InformationExtraction.js';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService.js';

let informationExtraction: InformationExtraction;
let IXExternalService: ExternalDummyService;

jest.mock('api/services/tasksmanager/TaskManager.ts');
jest.mock('api/socketio/setupSockets');
jest.mock('api/core/libs/queue/configuration/factories', () => ({
  DefaultQueueAdapter: jest.fn(),
  DefaultDispatcher: () => ({
    dispatch: jest.fn(),
  }),
}));

jest.setTimeout(30000);

describe('InformationExtraction Error Handling', () => {
  beforeEach(async () => {
    jest.setTimeout(30000);
    IXExternalService = new ExternalDummyService(0, 'informationExtraction', {
      materialsFiles: '(/xml_to_train/:tenant/:id|/xml_to_predict/:tenant/:id)',
      materialsData: '(/labeled_data|/prediction_data)',
      resultsData: '/suggestions_results',
    });
    await IXExternalService.start();
    informationExtraction = new InformationExtraction();
    const patchedFixtures = patchFixturesWithPort(fixtures, IXExternalService.actualPort!);
    await testingEnvironment.setUp(patchedFixtures);
    testingTenants.changeCurrentTenant({
      name: 'tenant1',
      uploadedDocuments: `${__dirname}/uploads/`,
    });
    IXExternalService.reset();
    jest.resetAllMocks();
    jest.spyOn(setupSockets, 'emitToTenantAdminsAndEditors').mockImplementation(() => {});
  }, 30000);

  afterEach(async () => {
    await IXExternalService.stop();
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('processResults error handling', () => {
    it('should handle task failure during model creation', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'Model training failed';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await ixTestAccess.removeSuggestions({ extractorId });

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);

      const suggestions = await ixTestAccess.readSuggestions({ extractorId });
      expect(suggestions).toHaveLength(0);
    });

    it('should handle task failure during suggestions generation', async () => {
      const extractorId = factory.id('prop2extractor');
      const errorMessage = 'Suggestion generation failed';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.ready,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await ixTestAccess.writeSuggestion({
        entityId: 'A1',
        language: 'en',
        extractorId,
        propertyName: 'property2',
        status: 'processing',
        date: Date.now(),
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: true,
          error: false,
        },
      });

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'suggestions',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.ready);
      expect(model.findingSuggestions).toBe(false);

      const allSuggestions = await ixTestAccess.readSuggestions({ extractorId });
      const failedSuggestion = allSuggestions.find(s => s.status === 'failed');
      expect(failedSuggestion).toBeDefined();
      expect(failedSuggestion!.status).toBe('failed');
      expect(failedSuggestion!.error).toBe(errorMessage);
      expect(failedSuggestion!.state && failedSuggestion!.state.processing).toBe(false);
      expect(failedSuggestion!.state && failedSuggestion!.state.error).toBe(true);
    });

    it('should preserve existing state values when handling errors', async () => {
      const extractorId = factory.id('prop2extractor');
      const errorMessage = 'Suggestion generation failed';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.ready,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      const initialState = {
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: true,
        error: false,
      };

      await ixTestAccess.writeSuggestion({
        entityId: 'A1',
        language: 'en',
        extractorId,
        propertyName: 'property2',
        status: 'processing',
        date: Date.now(),
        state: initialState,
      });

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'suggestions',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const allSuggestions = await ixTestAccess.readSuggestions({ extractorId });
      const failedSuggestion = allSuggestions.find(s => s.status === 'failed');
      expect(failedSuggestion).toBeDefined();
      expect(failedSuggestion!.status).toBe('failed');
      expect(failedSuggestion!.error).toBe(errorMessage);
      expect(failedSuggestion!.state && failedSuggestion!.state.processing).toBe(false);
      expect(failedSuggestion!.state && failedSuggestion!.state.error).toBe(true);
    });

    it('should emit error status to tenant', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'Task failed';
      const emitToTenantAdminsAndEditorsSpy = jest.spyOn(
        setupSockets,
        'emitToTenantAdminsAndEditors'
      );

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      expect(emitToTenantAdminsAndEditorsSpy).toHaveBeenCalledWith(
        'tenant1',
        'ix_model_status',
        extractorId.toString(),
        'error',
        errorMessage
      );
    });

    it('should handle task failure with no error message', async () => {
      const extractorId = factory.id('prop1extractor');

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await ixTestAccess.writeSuggestion({
        entityId: 'A1',
        language: 'en',
        extractorId,
        propertyName: 'property1',
        status: 'processing',
        date: Date.now(),
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: true,
          error: false,
        },
      });

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
      });

      const allSuggestions = await ixTestAccess.readSuggestions({ extractorId });
      const failedSuggestion = allSuggestions.find(s => s.status === 'failed');
      expect(failedSuggestion).toBeDefined();
      expect(failedSuggestion!.status).toBe('failed');
      expect(failedSuggestion!.error).toBe('Task failed');
      expect(failedSuggestion!.state && failedSuggestion!.state.processing).toBe(false);
      expect(failedSuggestion!.state && failedSuggestion!.state.error).toBe(true);
    });
  });

  describe('External service communication error handling', () => {
    it('should handle connection refused errors', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'Failed to connect to external service: connect ECONNREFUSED';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.simulateConnectionError('ECONNREFUSED');

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);
    });

    it('should handle timeout errors', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'Failed to connect to external service: connect ETIMEDOUT';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.simulateConnectionError('ETIMEDOUT');

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);
    });

    it('should handle service unavailable errors', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'External service is currently unavailable';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.simulateServiceError(503);

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);
    });

    it('should retry the results request on a transient 5xx', async () => {
      const extractorId = factory.id('prop1extractor');

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.setResults([]);
      IXExternalService.failNextResultsRequests(2, 503);

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'suggestions',
        params: { id: extractorId.toString() },
        data_url: `http://localhost:${IXExternalService.actualPort}/suggestions_results`,
        success: true,
      });

      // two failures then a success: the request must actually be re-issued
      expect(IXExternalService.requestCounts.resultsData).toBe(3);
    });

    it('should not retry the results request on a non-retryable 4xx', async () => {
      const extractorId = factory.id('prop1extractor');

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.setResults([]);
      IXExternalService.failNextResultsRequests(1, 400);

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'suggestions',
        params: { id: extractorId.toString() },
        data_url: `http://localhost:${IXExternalService.actualPort}/suggestions_results`,
        success: true,
      });

      expect(IXExternalService.requestCounts.resultsData).toBe(1);
    });

    it('should handle file not found errors', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'File not found';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.simulateServiceError(404);

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);
    });

    it('should handle bad request errors', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'Invalid request';

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      IXExternalService.simulateServiceError(400);

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const model = await ixTestAccess.readModel(extractorId);
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);
    });
  });

  describe('ML service contract failure modes', () => {
    // PME's `GET /get_suggestions` is destructive: it reads and then deletes. Whatever is
    // dropped on the floor after that read is gone for good, so a single unusable entry in
    // the batch must not be able to take the rest of the batch with it.
    it('should save the suggestions it can when the batch contains an unknown entity', async () => {
      const extractorId = factory.id('sourceTextExtractor1');
      const knownKey = ExtractionKey.create({ entitySharedId: 'A1', language: 'en' });
      const unknownKey = ExtractionKey.create({
        entitySharedId: 'entity_that_no_longer_exists',
        language: 'en',
      });

      await ixTestAccess.writeModel({
        extractorId,
        status: ModelStatus.ready,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      // The unknown entity comes first: PME does not order its batch for us.
      IXExternalService.setResults([
        {
          text: 'suggestion_for_a_vanished_entity',
          segment_text: 'segment_for_a_vanished_entity',
          entity_name: unknownKey.key,
        },
        {
          text: 'suggestion_for_a_live_entity',
          segment_text: 'segment_for_a_live_entity',
          entity_name: knownKey.key,
        },
      ]);

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'suggestions',
        params: { id: extractorId.toString() },
        data_url: `http://localhost:${IXExternalService.actualPort}/suggestions_results`,
        success: true,
      });

      const saved = await ixTestAccess.readOneSuggestion({
        extractorId,
        entityId: 'A1',
        language: 'en',
      });
      expect(saved.suggestedValue).toBe('suggestion_for_a_live_entity');

      // ...and the unusable entry must not become a row of its own. A suggestion with no
      // entityId / extractorId is exactly what migration 196 exists to clean up.
      const orphans = (await ixTestAccess.readSuggestions({})).filter(
        suggestion => !suggestion.entityId || !suggestion.extractorId
      );
      expect(orphans).toEqual([]);
    });
  });
});
