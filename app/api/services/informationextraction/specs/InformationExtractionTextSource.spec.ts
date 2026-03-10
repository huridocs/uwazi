/* eslint-disable global-require */
/* eslint-disable max-statements */
import moment from 'moment';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { ExternalDummyService } from 'api/services/tasksmanager/specs/ExternalDummyService';
import * as setupSockets from 'api/socketio/setupSockets';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import entitiesModel from 'api/entities/entitiesModel';
import { InformationExtraction } from '../InformationExtraction';
import { factory, fixtures } from './fixtures';
import { IXModelsModel } from '../IXModelsModel';
import { ExtractionKey } from '../ExtractionKey';
import { IXWebSocketEvents } from '../WebSocketEvents';
import { NoEntitiesForTraining } from '../TrainModelForText';
import { getEntitiesForTraining } from '../ixMaterials';

jest.mock('api/socketio/setupSockets');
jest.mock('api/services/tasksmanager/TaskManager.ts');

jest.mock('api/core/libs/queue/configuration/factories', () => ({
  DefaultDispatcher: () => {
    const {
      SyncDispatcherForTests,
    } = require('api/core/libs/queue/infrastructure/SyncDispatcherForTests');
    const {
      InformationExtraction: InformationExtraction1,
    } = require('api/services/informationextraction/InformationExtraction');
    const { IXTaskService } = require('api/services/informationextraction/TaskService');
    const { TrainModelForPDF } = require('api/services/informationextraction/TrainModelForPDF');
    const { TrainModelForText } = require('api/services/informationextraction/TrainModelForText');
    const { IXTrainModelJob } = require('api/services/informationextraction/TrainModelJob');

    return new SyncDispatcherForTests({
      IXTrainModelJob: async () => {
        const serviceUrl = 'http://localhost:4321/';
        const tenantName = 'tenant1';
        const informationExtraction = new InformationExtraction1();
        const iXTaskService = new IXTaskService({
          tenantName,
          taskManager: informationExtraction.taskManager,
        });
        return new IXTrainModelJob({
          tenantName,
          trainModelForPDF: new TrainModelForPDF({ iXTaskService, serviceUrl, tenantName }),
          trainModelForText: new TrainModelForText({ iXTaskService, serviceUrl, tenantName }),
        });
      },
    });
  },
}));

describe('Information Extraction: Extracting from text source', () => {
  const SERVICE_PORT = 4321;
  let informationExtraction: InformationExtraction;
  let IXExternalService: ExternalDummyService;

  beforeAll(async () => {
    IXExternalService = new ExternalDummyService(SERVICE_PORT, 'informationExtraction', {
      materialsFiles: '(/xml_to_train/:tenant/:id|/xml_to_predict/:tenant/:id)',
      materialsData: '(/labeled_data|/prediction_data)',
      resultsData: '/suggestions_results',
    });

    await IXExternalService.start();
    // eslint-disable-next-line no-empty-function
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation(() => {});
  });

  beforeEach(async () => {
    informationExtraction = new InformationExtraction();

    const currentSettings = fixtures.settings?.[0] || {};

    const fixturesWithUnconflictingPorts = {
      ...fixtures,
      settings: [
        {
          ...currentSettings,
          features: {
            ...(currentSettings.features || {}),
            metadataExtraction: {
              ...(currentSettings.features?.metadataExtraction || {}),
              url: `http://localhost:${SERVICE_PORT}`,
            },
          },
        },
      ],
    };

    await testingEnvironment.setUp(fixturesWithUnconflictingPorts);
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

  describe('when training the model', () => {
    it('should not send xmls', async () => {
      await informationExtraction.trainModel(factory.id('sourceTextExtractor1'));

      expect(IXExternalService.materialsFileParams).toEqual(undefined);
      expect(IXExternalService.files.length).toBe(0);
    });

    it('should only send labeled data', async () => {
      const extractionKeyEn = ExtractionKey.create({ entitySharedId: 'A1', language: 'en' });
      const extractionKeyOther = ExtractionKey.create({
        entitySharedId: 'A1',
        language: 'other' as any,
      });

      await informationExtraction.trainModel(factory.id('sourceTextExtractor1'));

      expect(IXExternalService.materials.length).toBe(2);
      expect(IXExternalService.materials.find(m => m.source_text === 'text 1')).toEqual({
        entity_name: extractionKeyOther.key,
        language_iso: extractionKeyOther.language,
        id: factory.id('sourceTextExtractor1').toString(),
        tenant: 'tenant1',
        source_text: 'text 1',
        label_text: '1088985600',
      });

      expect(IXExternalService.materials.find(m => m.source_text === 'text 2')).toEqual({
        entity_name: extractionKeyEn.key,
        language_iso: extractionKeyEn.language,
        id: factory.id('sourceTextExtractor1').toString(),
        tenant: 'tenant1',
        label_text: 'labeled text',
        source_text: 'text 2',
      });
    });

    it('should only send labeled data (multiselect)', async () => {
      const extractionKeyA17 = ExtractionKey.create({ entitySharedId: 'A17', language: 'en' });
      const extractionKeyA18 = ExtractionKey.create({ entitySharedId: 'A18', language: 'en' });

      await informationExtraction.trainModel(
        factory.id('extractor_target_multiselect_source_text')
      );

      const suggestion1 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyA17.key
      );
      const suggestion2 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyA18.key
      );

      expect(IXExternalService.materials.length).toBe(2);

      expect(suggestion1).toEqual({
        entity_name: extractionKeyA17.key,
        language_iso: extractionKeyA17.language,
        id: factory.id('extractor_target_multiselect_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text_1',
        values: [
          {
            id: 'A',
            label: 'A',
          },
        ],
      });

      expect(suggestion2).toEqual({
        entity_name: extractionKeyA18.key,
        language_iso: extractionKeyA18.language,
        id: factory.id('extractor_target_multiselect_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text_2',
        values: [
          {
            id: 'B',
            label: 'B',
          },
          {
            id: 'C',
            label: 'C',
          },
        ],
      });
    });

    it('should only send labeled data (select)', async () => {
      const extraction3 = ExtractionKey.create({
        entitySharedId: 'extractor_target_select_source_text_entity_3',
        language: 'en',
      });

      const extractorId = factory.id('extractor_target_select_source_text');

      await informationExtraction.trainModel(extractorId);

      const suggestion3 = IXExternalService.materials.find(m => m.entity_name === extraction3.key);

      expect(IXExternalService.materials.length).toBe(1);
      expect(suggestion3).toEqual({
        entity_name: extraction3.key,
        language_iso: extraction3.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        values: [
          {
            id: '1',
            label: 'A label',
          },
        ],
      });
    });

    it('should only send labeled data (title)', async () => {
      const extraction1 = ExtractionKey.create({
        entitySharedId: 'extractor_target_title_source_text_entity',
        language: 'en',
      });

      const extractorId = factory.id('extractor_target_title_source_text');

      await informationExtraction.trainModel(extractorId);

      const suggestion1 = IXExternalService.materials.find(m => m.entity_name === extraction1.key);

      expect(IXExternalService.materials.length).toBe(1);

      expect(suggestion1).toEqual({
        entity_name: extraction1.key,
        language_iso: extraction1.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        label_text: 'extractor_target_title_source_text_entity',
      });
    });

    it('should send labeled data (relationship)', async () => {
      const extractionKeyA21 = ExtractionKey.create({ entitySharedId: 'A21', language: 'en' });
      const extractionKeyA22 = ExtractionKey.create({ entitySharedId: 'A22', language: 'en' });

      await informationExtraction.trainModel(
        factory.id('extractor_target_relationship_source_text')
      );

      const suggestion1 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyA21.key
      );
      const suggestion2 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyA22.key
      );

      expect(IXExternalService.materials.length).toBe(2);

      expect(suggestion1).toEqual({
        entity_name: extractionKeyA21.key,
        language_iso: extractionKeyA21.language,
        id: factory.id('extractor_target_relationship_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        values: [
          {
            id: 'P1sharedId',
            label: 'P1',
          },
        ],
      });

      expect(suggestion2).toEqual({
        entity_name: extractionKeyA22.key,
        language_iso: extractionKeyA22.language,
        id: factory.id('extractor_target_relationship_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        values: [
          {
            id: 'P1sharedId',
            label: 'P1',
          },
          {
            id: 'P3sharedId',
            label: 'P3',
          },
        ],
      });
    });

    it('should send labeled data (dates)', async () => {
      const extractionKeyEn = ExtractionKey.create({ entitySharedId: 'A1', language: 'en' });
      const extractionKeyOther = ExtractionKey.create({
        entitySharedId: 'A1',
        language: 'other' as any,
      });

      await informationExtraction.trainModel(factory.id('extractor_target_date_source_text'));

      const suggestion1 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyEn.key
      );
      const suggestion2 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyOther.key
      );

      expect(IXExternalService.materials.length).toBe(2);
      const testDate = moment.utc('2004-07-05T00:00:00+00:00');

      expect(suggestion1).toEqual({
        entity_name: extractionKeyEn.key,
        language_iso: extractionKeyEn.language,
        id: factory.id('extractor_target_date_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        label_text: moment(testDate).local().format('YYYY-MM-DD'),
      });

      expect(suggestion2).toEqual({
        entity_name: extractionKeyOther.key,
        language_iso: extractionKeyOther.language,
        id: factory.id('extractor_target_date_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        label_text: moment(testDate).local().format('YYYY-MM-DD'),
      });
    });

    it('should only send labeled data (rich text)', async () => {
      const extractionKey1En = ExtractionKey.create({
        entitySharedId: 'extractor_target_rich_text_source_text_entity_1',
        language: 'en',
      });
      const extractionKey1Es = ExtractionKey.create({
        entitySharedId: 'extractor_target_rich_text_source_text_entity_1',
        language: 'es',
      });
      const extractorId = factory.id('extractor_target_rich_text_source_text');

      await informationExtraction.trainModel(extractorId);

      const suggestion1En = IXExternalService.materials.find(
        m => m.entity_name === extractionKey1En.key
      );
      const suggestion1Es = IXExternalService.materials.find(
        m => m.entity_name === extractionKey1Es.key
      );

      expect(IXExternalService.materials.length).toBe(2);

      expect(suggestion1En).toEqual({
        entity_name: extractionKey1En.key,
        language_iso: extractionKey1En.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text_1_en',
        label_text: 'any_target_rich_text_1_en',
      });

      expect(suggestion1Es).toEqual({
        entity_name: extractionKey1Es.key,
        language_iso: extractionKey1Es.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text_1_es',
        label_text: 'any_target_rich_text_1_es',
      });
    });

    it('should emit error status and stop finding suggestions', async () => {
      const promise = informationExtraction.trainModel(
        factory.id('extract_source_text_no_entities')
      );

      await expect(promise).rejects.toThrow();
      const [model] = await IXModelsModel.get({
        extractorId: factory.id('extract_source_text_no_entities'),
      });

      expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
        'tenant1',
        IXWebSocketEvents.ErrorTrainingModel,
        { message: NoEntitiesForTraining.defaultMessage }
      );

      expect(model.findingSuggestions).toBe(false);
    });

    it('should use limit when getting entities for training', async () => {
      const templates = [factory.id('template1')];
      const toProperty = 'property1';

      const getUnrestrictedSpy = jest.spyOn(entitiesModel, 'getUnrestricted');
      getUnrestrictedSpy.mockResolvedValue([]);

      await getEntitiesForTraining(templates, toProperty, 'sourceProperty');
      expect(getUnrestrictedSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          limit: 15000,
        })
      );

      getUnrestrictedSpy.mockRestore();
    });
  });

  describe('given the model is trained when I request for suggestions', () => {
    it('should send materials to the Information extraction service', async () => {
      const extractionKeyEn1 = ExtractionKey.create({
        entitySharedId: 'extractor_target_select_source_text_entity_1',
        language: 'en',
      });
      const extractionKeyEn2 = ExtractionKey.create({
        entitySharedId: 'extractor_target_select_source_text_entity_2',
        language: 'en',
      });
      const extractionKeyEn3 = ExtractionKey.create({
        entitySharedId: 'extractor_target_select_source_text_entity_3',
        language: 'en',
      });
      const extractionKeyEs3 = ExtractionKey.create({
        entitySharedId: 'extractor_target_select_source_text_entity_3_es',
        language: 'es',
      });

      const extractorId = factory.id('extractor_target_select_source_text');

      await informationExtraction.getSuggestions(extractorId);

      const material1 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyEn1.key
      );

      const material2 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyEn2.key
      );

      const material3 = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyEn3.key
      );

      const material3Es = IXExternalService.materials.find(
        m => m.entity_name === extractionKeyEs3.key
      );

      expect(IXExternalService.materials.length).toBe(4);

      expect(material1).toEqual({
        entity_name: extractionKeyEn1.key,
        language_iso: extractionKeyEn1.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text_1',
      });

      expect(material2).toEqual({
        entity_name: extractionKeyEn2.key,
        language_iso: extractionKeyEn2.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: '',
      });

      expect(material3).toEqual({
        entity_name: extractionKeyEn3.key,
        language_iso: extractionKeyEn3.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
      });

      expect(material3Es).toEqual({
        entity_name: extractionKeyEs3.key,
        language_iso: extractionKeyEs3.language,
        id: extractorId.toString(),
        tenant: 'tenant1',
        source_text: '',
      });
    });

    it('should create the task for the suggestions', async () => {
      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));

      expect(informationExtraction.taskManager?.startTask).toHaveBeenCalledWith({
        params: {
          id: factory.id('sourceTextExtractor1').toString(),
          metadata: {
            extractor_name: 'sourceTextExtractor1',
            property: 'property1',
            templates: expect.anything(),
          },
        },
        tenant: 'tenant1',
        task: 'suggestions',
      });
    });

    it('should stop the model when there are no materials left to send', async () => {
      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));

      // Make second call have no eligible materials
      const [m] = await IXModelsModel.get({ extractorId: factory.id('sourceTextExtractor1') });
      const runTs = m?.processRun?.suggestionsRunTimestamp || Date.now();
      await IXSuggestionsModel.updateMany(
        { extractorId: factory.id('sourceTextExtractor1') },
        {
          $set: {
            date: 1,
            'state.obsolete': false,
            'state.error': false,
            'modelData.suggestionsRunTimestamp': runTs,
          },
        }
      );

      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));

      const [model] = await IXModelsModel.get({ extractorId: factory.id('sourceTextExtractor1') });
      expect(model.findingSuggestions).toBe(false);
    });
  });

  describe('given all materials are sent, when suggestions are done', () => {
    it('should not call saveSuggestion (PDF source)', async () => {
      IXExternalService.setResults([]);

      const saveSuggestionsForPdfSourceSpy = jest.spyOn(
        informationExtraction,
        'saveSuggestionsForPdfSource'
      );

      const saveSuggestionsForTextSourceSpy = jest.spyOn(
        informationExtraction,
        'saveSuggestionsForTextSource'
      );

      await informationExtraction.processResults({
        params: { id: factory.id('sourceTextExtractor1').toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      expect(saveSuggestionsForPdfSourceSpy).not.toHaveBeenCalled();
      expect(saveSuggestionsForTextSourceSpy).toHaveBeenCalled();
    });

    it('should save suggestion for text target property', async () => {
      const extractorId = factory.id('sourceTextExtractor1');
      const extractionKeyEn = ExtractionKey.create({ entitySharedId: 'A1', language: 'en' });
      const extractionKeyOther = ExtractionKey.create({
        entitySharedId: 'A1',
        language: 'other' as any,
      });

      IXExternalService.setResults([
        {
          text: 'any_text_suggestion_english',
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
        },
        {
          text: 'any_text_suggestion_other',
          segment_text: 'any_text_segment_other',
          entity_name: extractionKeyOther.key,
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const suggestions = await IXSuggestionsModel.get({
        extractorId,
      });

      const suggestion1 = suggestions.find(s => s.entityId === 'A1' && s.language === 'en');
      const suggestion2 = suggestions.find(s => s.entityId === 'A1' && s.language === 'other');

      expect(suggestion1).toMatchObject({
        extractorId,
        entityId: 'A1',
        language: 'en',
        suggestedValue: 'any_text_suggestion_english',
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      expect(suggestion2).toMatchObject({
        extractorId,
        entityId: 'A1',
        language: 'other',
        suggestedValue: 'any_text_suggestion_other',
        segment: 'any_text_segment_other',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for title target property', async () => {
      const extractorId = factory.id('extractor_target_title_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'extractor_target_title_source_text_entity',
        language: 'en',
      });

      IXExternalService.setResults([
        {
          text: 'any_text_suggestion_english',
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: 'any_text_suggestion_english',
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for numeric target property', async () => {
      const extractorId = factory.id('extractor_target_numeric_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'extractor_target_numeric_source_text_entity',
        language: 'en',
      });

      IXExternalService.setResults([
        {
          text: '  1233415  ',
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: 1233415,
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for date target property', async () => {
      const extractorId = factory.id('extractor_target_date_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'A1',
        language: 'en',
      });

      IXExternalService.setResults([
        {
          text: '2019-10-12',
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: 1570838400,
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for select target property', async () => {
      const extractorId = factory.id('extractor_target_select_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'extractor_target_select_source_text_entity_1',
        language: 'en',
      });

      IXExternalService.setResults([
        {
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
          values: [{ id: 'A', label: 'A label' }],
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: 'A',
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for multiselect target property', async () => {
      const extractorId = factory.id('extractor_target_multiselect_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'A17',
        language: 'en',
      });

      IXExternalService.setResults([
        {
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
          values: [
            { id: 'A', label: 'A label', segment_text: 'any_text_segment_english' },
            { id: 'B', label: 'B label', segment_text: 'any_text_segment_english' },
          ],
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: [
          { id: 'A', label: 'A label', segment: 'any_text_segment_english' },
          { id: 'B', label: 'B label', segment: 'any_text_segment_english' },
        ],
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for relationship target property', async () => {
      const extractorId = factory.id('extractor_target_relationship_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'A21',
        language: 'en',
      });

      IXExternalService.setResults([
        {
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
          values: [
            { id: 'P1sharedId', label: 'P1', segment_text: 'any_text_segment_english' },
            { id: 'P2sharedId', label: 'P2', segment_text: 'any_text_segment_english' },
          ],
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: [
          { id: 'P1sharedId', label: 'P1', segment: 'any_text_segment_english' },
          { id: 'P2sharedId', label: 'P2', segment: 'any_text_segment_english' },
        ],
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });

    it('should save suggestion for rich text target property', async () => {
      const extractorId = factory.id('extractor_target_rich_text_source_text');
      const extractionKeyEn = ExtractionKey.create({
        entitySharedId: 'extractor_target_rich_text_source_text_entity_1',
        language: 'en',
      });
      const extractionKeyEs = ExtractionKey.create({
        entitySharedId: 'extractor_target_rich_text_source_text_entity_1',
        language: 'es',
      });

      IXExternalService.setResults([
        {
          text: 'any_text_suggestion_english',
          segment_text: 'any_text_segment_english',
          entity_name: extractionKeyEn.key,
        },
        {
          text: 'any_text_suggestion_other',
          segment_text: 'any_text_segment_other',
          entity_name: extractionKeyEs.key,
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: `http://localhost:${SERVICE_PORT}/suggestions_results`,
      });

      const suggestions = await IXSuggestionsModel.get({
        extractorId,
      });

      const suggestion1 = suggestions.find(
        s =>
          s.entityId === extractionKeyEn.entitySharedId && s.language === extractionKeyEn.language
      );
      const suggestion2 = suggestions.find(
        s =>
          s.entityId === extractionKeyEs.entitySharedId && s.language === extractionKeyEs.language
      );

      expect(suggestion1).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: extractionKeyEn.language,
        suggestedValue: 'any_text_suggestion_english',
        segment: 'any_text_segment_english',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      expect(suggestion2).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: extractionKeyEs.language,
        suggestedValue: 'any_text_suggestion_other',
        segment: 'any_text_segment_other',
        status: 'ready',
        error: '',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          hasContext: true,
          match: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });
    });
  });
});
