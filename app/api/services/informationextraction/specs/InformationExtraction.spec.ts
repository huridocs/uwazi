/* eslint-disable max-lines */
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import * as setupSockets from 'api/socketio/setupSockets';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { factory, fixtures } from './fixtures';
import { InformationExtraction } from '../InformationExtraction';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService';
import { IXModelsModel } from '../IXModelsModel';

jest.mock('api/services/tasksmanager/TaskManager.ts');
jest.mock('api/socketio/setupSockets');

let informationExtraction: InformationExtraction;
describe('InformationExtraction', () => {
  let IXExternalService: ExternalDummyService;
  let xmlA: Buffer;

  const setIXServiceResults = (results: any[]) => {
    const IXResults = results.map((result: any) => ({
      tenant: 'tenant1',
      property_name: 'property1',
      xml_file_name: 'documentA.xml',
      text: 'suggestion_text_1',
      segment_text: 'segment_text_1',
      segments_boxes: [
        {
          left: 1,
          top: 2,
          width: 3,
          height: 4,
          page_number: 1,
        },
      ],
      ...result,
    }));
    IXExternalService.setResults(IXResults);
  };

  beforeAll(async () => {
    IXExternalService = new ExternalDummyService(1234, 'informationExtraction', {
      materialsFiles: '(/xml_to_train/:tenant/:property|/xml_to_predict/:tenant/:property)',
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

  const saveSuggestionProcess = async (
    id: string,
    entity: string,
    language: string,
    property: string
  ) => {
    await informationExtraction.saveSuggestionProcess(
      {
        _id: factory.id(id),
        entity,
        language,
        segmentation: {},
        extractedMetadata: [],
      },
      property
    );
  };

  describe('status()', () => {
    it('should return status: processing_model', async () => {
      const resp = await informationExtraction.status('property3');
      expect(resp.status).toEqual('processing_model');
    });

    it('should return status: fetching suggestion', async () => {
      const resp = await informationExtraction.status('property2');
      expect(resp.status).toEqual('processing_suggestions');
      expect(resp.data).toEqual({ total: 5, processed: 2 });
    });

    it('should return status: ready', async () => {
      const [model] = await IXModelsModel.get({ propertyName: 'property1' });
      model.findingSuggestions = false;
      await IXModelsModel.save(model);

      const resp = await informationExtraction.status('property1');
      expect(resp.status).toEqual('ready');
    });
  });

  describe('trainModel', () => {
    it('should send xmls', async () => {
      await informationExtraction.trainModel('property1');

      xmlA = await fs.readFile(
        'app/api/services/informationextraction/specs/uploads/segmentation/documentA.xml'
      );

      const xmlC = await fs.readFile(
        'app/api/services/informationextraction/specs/uploads/segmentation/documentC.xml'
      );

      expect(IXExternalService.materialsFileParams).toEqual({
        0: '/xml_to_train/tenant1/property1',
        property: 'property1',
        tenant: 'tenant1',
      });

      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlA, xmlC]));
      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentA.xml', 'documentC.xml'].sort()
      );
    });

    it('should send labeled data', async () => {
      await informationExtraction.trainModel('property1');

      expect(IXExternalService.materials.length).toBe(2);
      expect(IXExternalService.materials.find(m => m.xml_file_name === 'documentA.xml')).toEqual({
        xml_file_name: 'documentA.xml',
        property_name: 'property1',
        tenant: 'tenant1',
        xml_segments_boxes: [
          {
            left: 58,
            top: 63,
            width: 457,
            height: 15,
            page_number: 1,
            text: 'something',
          },
        ],
        page_width: 595,
        page_height: 841,
        language_iso: 'en',
        label_text: 'different from selected text',
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });
    });

    it('should sanitize dates before sending', async () => {
      await informationExtraction.trainModel('property2');

      expect(IXExternalService.materials.find(m => m.xml_file_name === 'documentA.xml')).toEqual({
        xml_file_name: 'documentA.xml',
        property_name: 'property2',
        tenant: 'tenant1',
        xml_segments_boxes: [
          {
            left: 58,
            top: 63,
            width: 457,
            height: 15,
            page_number: 1,
            text: 'something',
          },
        ],
        page_width: 595,
        page_height: 841,
        language_iso: 'en',
        label_text: '3/4/2011',
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });
    });

    it('should start the task to train the model', async () => {
      await informationExtraction.trainModel('property1');

      expect(informationExtraction.taskManager?.startTask).toHaveBeenCalledWith({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'create_model',
      });
    });
  });

  describe('when model is trained', () => {
    it('should call getSuggestions', async () => {
      jest
        .spyOn(informationExtraction, 'getSuggestions')
        .mockImplementation(async () => Promise.resolve());

      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'create_model',
        success: true,
      });
      expect(informationExtraction.getSuggestions).toHaveBeenCalledWith('property1');
      jest.clearAllMocks();
    });
  });

  describe('getSuggestions()', () => {
    it('should send the materials for the suggestions', async () => {
      await informationExtraction.getSuggestions('property1');

      xmlA = await fs.readFile(
        'app/api/services/informationextraction/specs/uploads/segmentation/documentA.xml'
      );

      expect(IXExternalService.materialsFileParams).toEqual({
        0: '/xml_to_predict/tenant1/property1',
        property: 'property1',
        tenant: 'tenant1',
      });

      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentA.xml', 'documentC.xml'].sort()
      );
      expect(IXExternalService.files.length).toBe(2);
      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlA]));

      expect(IXExternalService.materials.length).toBe(2);
      expect(IXExternalService.materials.find(m => m.xml_segments_boxes.length)).toEqual({
        xml_file_name: 'documentA.xml',
        property_name: 'property1',
        tenant: 'tenant1',
        page_height: 841,
        page_width: 595,
        xml_segments_boxes: [
          {
            height: 15,
            left: 58,
            page_number: 1,
            text: 'something',
            top: 63,
            width: 457,
          },
        ],
      });
    });

    it('should create the task for the suggestions', async () => {
      await informationExtraction.getSuggestions('property1');

      expect(informationExtraction.taskManager?.startTask).toHaveBeenCalledWith({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'suggestions',
      });
    });

    it('should create the suggestions placeholder with status processing', async () => {
      await informationExtraction.getSuggestions('property1');
      const suggestions = await IXSuggestionsModel.get({ propertyName: 'property1' });
      expect(suggestions.length).toBe(2);
      expect(suggestions.find(s => s.entityId === 'A1')).toEqual(
        expect.objectContaining({
          entityId: 'A1',
          status: 'processing',
          state: SuggestionState.processing,
        })
      );
    });
  });

  describe('processResults', () => {
    it('should not continue sending suggestions if flag is not set', async () => {
      const [model] = await IXModelsModel.get({ propertyName: 'property2' });
      model.findingSuggestions = false;
      await IXModelsModel.save(model);

      const message: ResultsMessage = {
        task: 'create_model',
        data_url: 'some/url',
        error_message: '',
        params: {
          property_name: 'property2',
        },
        tenant: 'tenant1',
        file_url: '',
        success: true,
      };

      await informationExtraction.processResults(message);
      expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
        message.tenant,
        'ix_model_status',
        message.params!.property_name,
        'ready',
        'Canceled'
      );
      expect(informationExtraction.taskManager?.startTask).not.toHaveBeenCalled();
    });
  });

  describe('when suggestions are ready', () => {
    it('should request and store the suggestions', async () => {
      setIXServiceResults([
        {},
        {
          text: 'suggestion_text_2',
          xml_file_name: 'documentC.xml',
          segment_text: 'segment_text_2',
        },
      ]);

      await saveSuggestionProcess('F3', 'A3', 'eng', 'property1');
      await saveSuggestionProcess('F1', 'A1', 'eng', 'property1');
      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property1',
      });

      expect(suggestions.length).toBe(2);
      expect(suggestions.find(s => s.suggestedValue === 'suggestion_text_1')).toEqual(
        expect.objectContaining({
          entityId: 'A1',
          language: 'en',
          propertyName: 'property1',
          suggestedValue: 'suggestion_text_1',
          segment: 'segment_text_1',
          status: 'ready',
          state: SuggestionState.labelMismatch,
        })
      );
    });

    it('should save different language suggestions for the same entity', async () => {
      IXExternalService.setResults([
        {
          tenant: 'tenant1',
          property_name: 'property1',
          xml_file_name: 'documentA.xml',
          text: 'text_in_other_language',
          segment_text: 'segmented_text_in_other_language',
          segments_boxes: [
            {
              left: 1,
              top: 2,
              width: 3,
              height: 4,
              page_number: 1,
            },
          ],
        },
        {
          tenant: 'tenant1',
          property_name: 'property1',
          xml_file_name: 'documentD.xml',
          text: 'text_in_eng_language',
          segment_text: 'segmented_text_in_eng_language',
          segments_boxes: [
            {
              left: 1,
              top: 2,
              width: 3,
              height: 4,
              page_number: 1,
            },
          ],
        },
      ]);

      await saveSuggestionProcess('F1', 'A1', 'other', 'property1');
      await saveSuggestionProcess('F4', 'A1', 'eng', 'property1');

      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property1',
      });

      expect(suggestions.length).toBe(2);

      expect(suggestions.find(s => s.language === 'other')).toEqual(
        expect.objectContaining({
          language: 'other',
          propertyName: 'property1',
          status: 'ready',
          suggestedValue: 'text_in_other_language',
          state: SuggestionState.labelMismatch,
        })
      );

      expect(suggestions.find(s => s.language === 'en')).toEqual(
        expect.objectContaining({
          language: 'en',
          propertyName: 'property1',
          status: 'ready',
          suggestedValue: 'text_in_eng_language',
          state: SuggestionState.valueMismatch,
        })
      );
    });

    it('should store failed suggestions', async () => {
      setIXServiceResults([
        {
          text: '',
          segment_text: '',
        },
      ]);

      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: false,
        error_message: 'Issue calculation suggestion',
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'failed',
        propertyName: 'property1',
      });

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]).toEqual(
        expect.objectContaining({
          entityId: 'A1',
          language: 'en',
          propertyName: 'property1',
          suggestedValue: '',
          segment: '',
          status: 'failed',
          error: 'Issue calculation suggestion',
          state: SuggestionState.error,
        })
      );
    });

    it('should not store invalid suggestions for the field as ready', async () => {
      setIXServiceResults([
        {
          property_name: 'property2',
          text: '',
        },
        {
          property_name: 'property2',
          xml_file_name: 'documentC.xml',
          text: 'Not a valid date',
          segment_text: 'segment_text_2',
        },
      ]);

      await informationExtraction.processResults({
        params: { property_name: 'property2' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property2',
      });
      expect(suggestions.length).toBe(4);
    });

    it('should store empty suggestions when they are of type text', async () => {
      setIXServiceResults([
        {
          text: '',
          segment_text: '',
        },
        {
          property_name: 'property4',
          text: '',
          segment_text: '',
        },
      ]);

      await saveSuggestionProcess('F1', 'A1', 'eng', 'property4');

      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      await informationExtraction.processResults({
        params: { property_name: 'property4' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestionsText = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property1',
      });
      expect(suggestionsText.length).toBe(1);

      const suggestionsMarkdown = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property4',
      });
      expect(suggestionsMarkdown.length).toBe(1);
    });

    it('should store the suggestion text and suggestion value for dates', async () => {
      setIXServiceResults([
        {
          property_name: 'property2',
          xml_file_name: 'documentC.xml',
          text: 'October 12, 2019',
          segment_text: 'Birthday of John Doe is October 12, 2019',
        },
      ]);

      await saveSuggestionProcess('F3', 'A3', 'eng', 'property2');

      await informationExtraction.processResults({
        params: { property_name: 'property2' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property2',
        entityId: 'A3',
      });

      expect(suggestions).toMatchObject([
        { suggestedValue: 1570838400, suggestedText: 'October 12, 2019' },
      ]);
    });

    it('should store non-configured languages as default language suggestion', async () => {
      setIXServiceResults([
        {
          xml_file_name: 'documentE.xml',
          text: 'Esto es una prueba',
        },
      ]);

      await saveSuggestionProcess('F5', 'A5', 'eng', 'property1');

      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        propertyName: 'property1',
      });
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].language).toBe('en');
    });
  });
});
