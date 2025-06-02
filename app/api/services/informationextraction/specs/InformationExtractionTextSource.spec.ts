/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { ExternalDummyService } from 'api/services/tasksmanager/specs/ExternalDummyService';
import * as setupSockets from 'api/socketio/setupSockets';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { InformationExtraction } from '../InformationExtraction';
import { factory, fixtures } from './fixtures';
import { IXModelsModel } from '../IXModelsModel';
import { ExtractionKey } from '../ExtractionKey';

jest.mock('api/socketio/setupSockets');
jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('Information Extraction: Extracting from text source', () => {
  let informationExtraction: InformationExtraction;
  let IXExternalService: ExternalDummyService;

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

      expect(suggestion1).toEqual({
        entity_name: extractionKeyEn.key,
        language_iso: extractionKeyEn.language,
        id: factory.id('extractor_target_date_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        label_text: '2004-07-05',
      });

      expect(suggestion2).toEqual({
        entity_name: extractionKeyOther.key,
        language_iso: extractionKeyOther.language,
        id: factory.id('extractor_target_date_source_text').toString(),
        tenant: 'tenant1',
        source_text: 'any_source_text',
        label_text: '2004-07-05',
      });
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

    it('should create the suggestions placeholder with status processing', async () => {
      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));
      const suggestions = await IXSuggestionsModel.get({
        extractorId: factory.id('sourceTextExtractor1'),
      });

      const [enSuggestion] = suggestions.filter(s => s.language === 'en');
      const [esSuggestion] = suggestions.filter(s => s.language === 'es');

      expect(enSuggestion).toMatchObject({
        language: 'en',
        entityId: 'A1',
        status: 'processing',
        state: {
          labeled: true,
          withValue: true,
          obsolete: true,
          processing: true,
          withSuggestion: false,
          hasContext: false,
          error: false,
          match: null,
        },
      });

      expect(esSuggestion).toMatchObject({
        language: 'es',
        entityId: 'entity_without_label_data',
        status: 'processing',
        state: {
          processing: true,
          obsolete: true,
          withValue: false,
          labeled: false,
          match: null,
          withSuggestion: false,
          hasContext: false,
          error: false,
        },
      });
    });

    it('should stop the model when there are no materials left to send', async () => {
      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));
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
        data_url: 'http://localhost:1234/suggestions_results',
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
        data_url: 'http://localhost:1234/suggestions_results',
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
        data_url: 'http://localhost:1234/suggestions_results',
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
        data_url: 'http://localhost:1234/suggestions_results',
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
        data_url: 'http://localhost:1234/suggestions_results',
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
        data_url: 'http://localhost:1234/suggestions_results',
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
            { id: 'A', label: 'A label' },
            { id: 'B', label: 'B label' },
          ],
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: ['A', 'B'],
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
            { id: 'P1sharedId', label: 'P1' },
            { id: 'P2sharedId', label: 'P2' },
          ],
        },
      ]);

      await informationExtraction.processResults({
        params: { id: extractorId.toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const [suggestion] = await IXSuggestionsModel.get({
        extractorId,
      });

      expect(suggestion).toMatchObject({
        extractorId,
        entityId: extractionKeyEn.entitySharedId,
        language: 'en',
        suggestedValue: ['P1sharedId', 'P2sharedId'],
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
  });
});
