import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import * as setupSockets from 'api/socketio/setupSockets';
import { ModelStatus } from 'shared/types/IXModelSchema';

import { factory, fixtures } from './fixtures';
import { InformationExtraction } from '../InformationExtraction';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService';
import { IXModelsModel } from '../IXModelsModel';

let informationExtraction: InformationExtraction;
let IXExternalService: ExternalDummyService;

jest.mock('api/services/tasksmanager/TaskManager.ts');
jest.mock('api/socketio/setupSockets');
jest.mock('api/queue.v2/configuration/factories', () => ({
  DefaultDispatcher: () => ({
    dispatch: jest.fn(),
  }),
}));

describe('InformationExtraction Error Handling', () => {
  beforeAll(async () => {
    IXExternalService = new ExternalDummyService(1234, 'informationExtraction', {
      materialsFiles: '(/xml_to_train/:tenant/:id|/xml_to_predict/:tenant/:id)',
      materialsData: '(/labeled_data|/prediction_data)',
      resultsData: '/suggestions_results',
    });

    await IXExternalService.start();
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation(() => {});
  });

  beforeEach(async () => {
    informationExtraction = new InformationExtraction();
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({
      name: 'tenant1',
      uploadedDocuments: `${__dirname}/uploads/`,
    });

    IXExternalService.reset();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await IXExternalService.stop();
    await testingEnvironment.tearDown();
  });

  describe('processResults error handling', () => {
    it('should handle task failure during model creation', async () => {
      const extractorId = factory.id('prop1extractor');
      const errorMessage = 'Model training failed';

      await IXModelsModel.save({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await IXSuggestionsModel.delete({ extractorId });

      await informationExtraction.processResults({
        tenant: 'tenant1',
        task: 'create_model',
        params: { id: extractorId.toString() },
        success: false,
        error_message: errorMessage,
      });

      const [model] = await IXModelsModel.get({ extractorId });
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);

      const suggestions = await IXSuggestionsModel.get({ extractorId });
      expect(suggestions).toHaveLength(0);
    });

    it('should handle task failure during suggestions generation', async () => {
      const extractorId = factory.id('prop2extractor');
      const errorMessage = 'Suggestion generation failed';

      await IXModelsModel.save({
        extractorId,
        status: ModelStatus.ready,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await IXSuggestionsModel.save({
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

      const [model] = await IXModelsModel.get({ extractorId });
      expect(model.status).toBe(ModelStatus.failed);
      expect(model.findingSuggestions).toBe(false);

      const allSuggestions = await IXSuggestionsModel.get({ extractorId });
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

      await IXModelsModel.save({
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

      await IXSuggestionsModel.save({
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

      const allSuggestions = await IXSuggestionsModel.get({ extractorId });
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
      const emitToTenantSpy = jest.spyOn(setupSockets, 'emitToTenant');

      await IXModelsModel.save({
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

      expect(emitToTenantSpy).toHaveBeenCalledWith(
        'tenant1',
        'ix_model_status',
        extractorId.toString(),
        'error',
        errorMessage
      );
    });

    it('should handle task failure with no error message', async () => {
      const extractorId = factory.id('prop1extractor');

      await IXModelsModel.save({
        extractorId,
        status: ModelStatus.processing,
        findingSuggestions: true,
        creationDate: Date.now(),
      });

      await IXSuggestionsModel.save({
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

      const allSuggestions = await IXSuggestionsModel.get({ extractorId });
      const failedSuggestion = allSuggestions.find(s => s.status === 'failed');
      expect(failedSuggestion).toBeDefined();
      expect(failedSuggestion!.status).toBe('failed');
      expect(failedSuggestion!.error).toBe('Task failed');
      expect(failedSuggestion!.state && failedSuggestion!.state.processing).toBe(false);
      expect(failedSuggestion!.state && failedSuggestion!.state.error).toBe(true);
    });
  });
});
