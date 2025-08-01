/* eslint-disable max-statements */
/* eslint-disable max-lines */
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';

import { ObjectId } from 'mongodb';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import * as setupSockets from 'api/socketio/setupSockets';
import { sortByStrings } from 'shared/data_utils/objectSorting';
import { PropertyTypeSchema } from 'shared/types/commonTypes';

import testingDB from 'api/utils/testing_db';
import entities from 'api/entities';
import { EnforcedWithId } from 'api/odm';
import settings from 'api/settings';
import { Suggestions } from 'api/suggestions/suggestions';
import { LanguageUtils } from 'shared/language';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { filesModel } from 'api/files/filesModel';
import { factory, fixtures } from './fixtures';
import {
  CommonSuggestion,
  IXResultsMessage,
  InformationExtraction,
  RawSuggestion,
  TextSelectionSuggestion,
  ValuesSelectionSuggestion,
} from '../InformationExtraction';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService';
import { IXModelsModel } from '../IXModelsModel';
import { Extractors } from '../ixextractors';
import { IXWebSocketEvents } from '../WebSocketEvents';
import { FileWithAggregation, NoFilesForTraining, NoLabeledEntities } from '../ixMaterials';
import { TEST_RUN_SUGGESTIONS_SIZE } from '../ixmodels';

let informationExtractionForJob: InformationExtraction;
jest.mock('api/services/tasksmanager/TaskManager.ts');
jest.mock('api/socketio/setupSockets');
jest.mock('api/queue.v2/configuration/factories', () => ({
  DefaultDispatcher: () => {
    const {
      SyncDispatcherForTests,
    } = require('api/queue.v2/infrastructure/SyncDispatcherForTests');
    const {
      InformationExtraction: InformationExtraction1,
    } = require('api/services/informationextraction/InformationExtraction');
    const { IXTaskService } = require('api/services/informationextraction/TaskService');
    const { TrainModelForPDF } = require('api/services/informationextraction/TrainModelForPDF');
    const { TrainModelForText } = require('api/services/informationextraction/TrainModelForText');
    const { IXTrainModelJob } = require('api/services/informationextraction/TrainModelJob');

    return new SyncDispatcherForTests({
      IXTrainModelJob: async () => {
        const serviceUrl = 'http://localhost:1234/';
        const tenantName = 'tenant1';
        const informationExtraction = new InformationExtraction1();
        informationExtractionForJob = informationExtraction;
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

const _getEntityFromFile = async (file: EnforcedWithId<FileType> | FileWithAggregation) => {
  let [entity] = await entities.getUnrestricted({
    sharedId: file.entity,
    language: LanguageUtils.fromISO639_3(file.language!)?.ISO639_1,
  });

  if (!entity) {
    const defaultLanguage = await settings.getDefaultLanguage();
    [entity] = await entities.getUnrestricted({
      sharedId: file.entity,
      language: defaultLanguage?.key,
    });
  }
  return entity;
};

const _saveSuggestionProcess = async (file: FileWithAggregation, extractor: IXExtractorType) => {
  const entity = await _getEntityFromFile(file);
  const [existingSuggestions] = await IXSuggestionsModel.get({
    entityId: entity.sharedId,
    extractorId: extractor._id,
    fileId: file._id,
  });

  const suggestion: IXSuggestionType = {
    ...existingSuggestions,
    entityId: entity.sharedId!,
    fileId: file._id,
    language: LanguageUtils.fromISO639_3(file.language)?.ISO639_1 || 'other',
    extractorId: extractor._id,
    propertyName: extractor.property,
    status: 'processing',
    date: new Date().getTime(),
  };

  return Suggestions.save(suggestion);
};

const readDocument = async (letter: string, xmlName?: string) => {
  const _xmlName = xmlName ?? `document${letter}.xml`;

  return fs.readFile(
    `app/api/services/informationextraction/specs/uploads/segmentation/${_xmlName}`
  );
};

let informationExtraction: InformationExtraction;
describe('InformationExtraction', () => {
  let IXExternalService: ExternalDummyService;

  const setIXServiceResults = (
    results: Partial<RawSuggestion>[],
    suggestionType: 'text' | 'value' = 'text'
  ) => {
    const commonSuggestionData: CommonSuggestion = {
      tenant: 'tenant1',
      id: factory.id('prop1extractor').toString(),
      xml_file_name: 'documentA.xml',
    };
    let specificSuggestionData: Partial<RawSuggestion>;
    if (suggestionType === 'text') {
      const textSuggestionData: Partial<TextSelectionSuggestion> = {
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
      };
      specificSuggestionData = textSuggestionData;
    } else {
      const valueSuggestionData: Partial<ValuesSelectionSuggestion> = {
        values: [{ id: 'A', label: 'A' }],
      };
      specificSuggestionData = valueSuggestionData;
    }
    const IXResults = results.map(result => ({
      ...commonSuggestionData,
      ...specificSuggestionData,
      ...result,
    }));
    IXExternalService.setResults(IXResults);
  };

  beforeEach(async () => {
    IXExternalService = new ExternalDummyService(1234, 'informationExtraction', {
      materialsFiles: '(/xml_to_train/:tenant/:id|/xml_to_predict/:tenant/:id)',
      materialsData: '(/labeled_data|/prediction_data)',
      resultsData: '/suggestions_results',
    });
    await IXExternalService.start();
    informationExtraction = new InformationExtraction();
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({
      name: 'tenant1',
      uploadedDocuments: `${__dirname}/uploads/`,
    });
    IXExternalService.reset();
    jest.resetAllMocks();
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation(() => {});
  });

  afterEach(async () => {
    await IXExternalService.stop();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const saveSuggestionProcess = async (
    id: string,
    entity: string,
    language: string,
    extractorName: string,
    propertyType?: PropertyTypeSchema
  ) => {
    const extractorId = factory.id(extractorName);
    const [extractor] = await Extractors.get({ _id: extractorId });
    await _saveSuggestionProcess(
      {
        _id: factory.id(id),
        entity,
        language,
        segmentation: {},
        extractedMetadata: [],
        propertyType: propertyType || 'text',
      },
      extractor
    );
  };

  describe('status()', () => {
    it('should return status: processing_model', async () => {
      const resp = await informationExtraction.status(factory.id('prop3extractor'));
      expect(resp.status).toEqual('processing_model');
    });

    it('should return status: fetching suggestion', async () => {
      const resp = await informationExtraction.status(factory.id('prop2extractor'));
      expect(resp.status).toEqual('processing_suggestions');
      expect(resp.data).toEqual({ total: 5, processed: 2 });
    });

    it('should return status: ready', async () => {
      const [model] = await IXModelsModel.get({ extractorId: factory.id('prop1extractor') });
      model.findingSuggestions = false;
      await IXModelsModel.save(model);

      const resp = await informationExtraction.status(factory.id('prop1extractor'));
      expect(resp.status).toEqual('ready');
    });
  });

  describe('trainModel', () => {
    it('should send xmls', async () => {
      await informationExtraction.trainModel(factory.id('prop1extractor'));

      const xmlA = await readDocument('A');

      const xmlC = await readDocument('C');

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_train/tenant1/${factory.id('prop1extractor')}`,
        id: factory.id('prop1extractor').toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlA, xmlC]));
      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentA.xml', 'documentC.xml'].sort()
      );
    });

    it('should send xmls (multiselect)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithMultiselect'));

      const xmlG = await readDocument('G');
      const xmlH = await readDocument('H');

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_train/tenant1/${factory.id('extractorWithMultiselect')}`,
        id: factory.id('extractorWithMultiselect').toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.files.length).toBe(2);
      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlG, xmlH]));
      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentG.xml', 'documentH.xml'].sort()
      );
    });

    it('should send xmls (relationship)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithRelationship'));

      const xmlK = await readDocument('K');
      const xmlL = await readDocument('L');

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_train/tenant1/${factory.id('extractorWithRelationship')}`,
        id: factory.id('extractorWithRelationship').toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.files.length).toBe(2);
      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlK, xmlL]));
      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentK.xml', 'documentL.xml'].sort()
      );
    });

    it('should send labeled data', async () => {
      await informationExtraction.trainModel(factory.id('prop1extractor'));

      expect(IXExternalService.materials.length).toBe(2);
      expect(IXExternalService.materials.find(m => m.xml_file_name === 'documentA.xml')).toEqual({
        xml_file_name: 'documentA.xml',
        id: factory.id('prop1extractor').toString(),
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
        label_text: '1088985600',
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });
    });

    it('should send labeled (target Property has value and none extractedMetadata)', async () => {
      await informationExtraction.trainModel(factory.id('extractor_source_pdf_target_text'));

      expect(IXExternalService.materials.length).toBe(2);

      expect(IXExternalService.materials).toMatchObject([
        {
          xml_file_name: 'extractor_source_pdf_target_text_entity_1_f1_en.xml',
          id: expect.any(String),
          tenant: 'tenant1',
          xml_segments_boxes: [
            { left: 1, top: 1, width: 1, height: 1, page_number: 1, text: 'P3' },
          ],
          page_width: 13,
          page_height: 13,
          language_iso: 'en',
          label_text: 'any_target_text_value_en',
          label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
        },

        {
          xml_file_name: 'extractor_source_pdf_target_text_entity_2_f1_en.xml',
          id: expect.any(String),
          tenant: 'tenant1',
          xml_segments_boxes: [
            { left: 1, top: 1, width: 1, height: 1, page_number: 1, text: 'P3' },
          ],
          page_width: 13,
          page_height: 13,
          language_iso: 'en',
          label_text: 'any_target_text_value_en',
        },
      ]);
    });

    it('should send labeled data (multiselect)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithMultiselect'));

      expect(IXExternalService.materials.length).toBe(2);
      expect(IXExternalService.materials.find(m => m.xml_file_name === 'documentG.xml')).toEqual({
        xml_file_name: 'documentG.xml',
        id: factory.id('extractorWithMultiselect').toString(),
        tenant: 'tenant1',
        xml_segments_boxes: [
          {
            left: 1,
            top: 1,
            width: 1,
            height: 1,
            page_number: 1,
            text: 'A',
          },
        ],
        page_width: 13,
        page_height: 13,
        language_iso: 'en',
        values: [
          {
            id: 'A',
            label: 'A',
          },
        ],
      });
    });

    it('should send labeled data (relationship)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithRelationship'));

      expect(IXExternalService.materials.length).toBe(2);
      expect(IXExternalService.materials.find(m => m.xml_file_name === 'documentL.xml')).toEqual({
        xml_file_name: 'documentL.xml',
        id: factory.id('extractorWithRelationship').toString(),
        tenant: 'tenant1',
        xml_segments_boxes: [
          {
            left: 1,
            top: 1,
            width: 1,
            height: 1,
            page_number: 1,
            text: 'P1',
          },
          {
            left: 1,
            top: 1,
            width: 1,
            height: 1,
            page_number: 1,
            text: 'P2',
          },
        ],
        page_width: 13,
        page_height: 13,
        language_iso: 'en',
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

    it('should sanitize dates before sending', async () => {
      await informationExtraction.trainModel(factory.id('prop2extractor'));

      expect(IXExternalService.materials.find(m => m.xml_file_name === 'documentD.xml')).toEqual({
        xml_file_name: 'documentD.xml',
        id: factory.id('prop2extractor').toString(),
        tenant: 'tenant1',
        xml_segments_boxes: [],
        page_height: 1,
        page_width: 2,
        language_iso: 'en',
        label_text: '2011-03-04',
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });
    });

    it('should only send labeled data (rich text)', async () => {
      const extractorId = factory.id('extractor_target_rich_text_source_pdf');
      const xml1 = 'extractor_target_rich_text_source_pdf_entity_1_f1_en.xml';
      const xml2 = 'extractor_target_rich_text_source_pdf_entity_1_f1_es.xml';

      await informationExtraction.trainModel(extractorId);

      const [seg1, seg2] = await Promise.all([readDocument('', xml1), readDocument('', xml2)]);

      const suggestion1 = IXExternalService.materials.find(m => m.xml_file_name === xml1);
      const suggestion2 = IXExternalService.materials.find(m => m.xml_file_name === xml2);

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_train/tenant1/${extractorId}`,
        id: extractorId.toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.files.length).toBe(2);
      expect(IXExternalService.files).toEqual(expect.arrayContaining([seg1, seg2]));
      expect(IXExternalService.filesNames.sort()).toEqual([xml1, xml2].sort());

      expect(IXExternalService.materials.length).toBe(2);
      expect(suggestion1).toEqual({
        id: extractorId.toString(),
        xml_file_name: xml1,
        tenant: 'tenant1',
        xml_segments_boxes: [{ left: 1, top: 1, width: 1, height: 1, page_number: 1, text: 'P3' }],
        page_width: 13,
        page_height: 13,
        language_iso: 'en',
        label_text: 'any_rich_text_value_english',
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });

      expect(suggestion2).toEqual({
        id: extractorId.toString(),
        xml_file_name: xml2,
        tenant: 'tenant1',
        xml_segments_boxes: [{ left: 1, top: 1, width: 1, height: 1, page_number: 1, text: 'P3' }],
        page_width: 13,
        page_height: 13,
        language_iso: 'es',
        label_text: 'any_rich_text_value_spanish',
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });
    });

    it('should start the task to train the model', async () => {
      await informationExtraction.trainModel(factory.id('prop1extractor'));

      expect(informationExtractionForJob.taskManager?.startTask).toHaveBeenCalledWith({
        params: {
          id: factory.id('prop1extractor').toString(),
          multi_value: false,
          metadata: {
            extractor_name: 'prop1extractor',
            property: 'property1',
            templates: expect.anything(),
          },
        },
        tenant: 'tenant1',
        task: 'create_model',
      });
    });

    it('should start the task to train the model (multiselect)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithMultiselect'));

      expect(informationExtractionForJob.taskManager?.startTask).toHaveBeenCalledWith({
        params: {
          id: factory.id('extractorWithMultiselect').toString(),
          multi_value: true,
          options: [
            {
              id: 'A',
              label: 'A',
            },
            {
              id: 'B',
              label: 'B',
            },
            {
              id: 'C',
              label: 'C',
            },
            {
              id: '1A',
              label: '1A',
            },
            {
              id: '1B',
              label: '1B',
            },
          ],
          metadata: {
            extractor_name: 'extractorWithMultiselect',
            property: 'property_multiselect',
            templates: expect.anything(),
          },
        },
        tenant: 'tenant1',
        task: 'create_model',
      });
    });

    it('should start the task to train the model (relationship)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithRelationship'));

      expect(informationExtractionForJob.taskManager?.startTask).toHaveBeenCalledWith({
        params: {
          id: factory.id('extractorWithRelationship').toString(),
          multi_value: true,
          options: [
            {
              id: 'P1sharedId',
              label: 'P1',
            },
            {
              id: 'P2sharedId',
              label: 'P2',
            },
            {
              id: 'P3sharedId',
              label: 'P3',
            },
          ],
          metadata: {
            extractor_name: 'extractorWithRelationship',
            property: 'property_relationship',
            templates: expect.anything(),
          },
        },
        tenant: 'tenant1',
        task: 'create_model',
      });
    });

    it('should start the task to train the model (relationship to any template)', async () => {
      await informationExtraction.trainModel(factory.id('extractorWithRelationshipToAny'));

      expect(informationExtractionForJob.taskManager?.startTask).toHaveBeenCalledWith({
        params: {
          id: factory.id('extractorWithRelationshipToAny').toString(),
          multi_value: true,
          options: [
            {
              id: 'P1sharedId',
              label: 'P1',
            },
            {
              id: 'P2sharedId',
              label: 'P2',
            },
            {
              id: 'P3sharedId',
              label: 'P3',
            },
            {
              id: 'extractor_target_title_source_text_entity',
              label: 'extractor_target_title_source_text_entity',
            },
            {
              id: 'extractor_target_numeric_source_text_entity',
              label: 'extractor_target_numeric_source_text_entity',
            },
            {
              id: 'extractor_target_select_source_text_entity_1',
              label: 'extractor_target_select_source_text_entity_1',
            },
            {
              id: 'extractor_target_select_source_text_entity_2',
              label: 'extractor_target_select_source_text_entity_2',
            },
            {
              id: 'extractor_target_select_source_text_entity_3',
              label: 'extractor_target_select_source_text_entity_3',
            },
            {
              id: 'A1',
              label: 'A1',
            },
            {
              id: 'entity_without_label_data',
              label: 'entity_without_label_data',
            },
            ...Array.from({ length: 22 }, (_, i) => ({
              id: `A${i + 2}`,
              label: `A${i + 2}`,
            })),
            {
              id: 'entityWithoutSegmentation',
              label: 'entityWithoutSegmentation',
            },
            {
              id: 'extractor_target_rich_text_source_text_entity_1',
              label: 'extractor_target_rich_text_source_text_entity_1',
            },
            {
              id: 'extractor_target_rich_text_source_text_entity_2',
              label: 'extractor_target_rich_text_source_text_entity_2',
            },
            {
              id: 'extractor_target_rich_text_source_pdf_entity_1',
              label: 'extractor_target_rich_text_source_pdf_entity_1',
            },
            {
              id: 'extractor_source_pdf_target_text_entity_1',
              label: 'extractor_source_pdf_target_text_entity_1',
            },
            {
              id: 'extractor_source_pdf_target_text_entity_2',
              label: 'extractor_source_pdf_target_text_entity_2',
            },
          ],
          metadata: {
            extractor_name: 'extractorWithRelationshipToAny',
            property: 'property_relationship_to_any',
            templates: expect.anything(),
          },
        },
        tenant: 'tenant1',
        task: 'create_model',
      });
    });

    it('should emit error status and stop finding suggestions, when there is no labaled data', async () => {
      const promise1 = informationExtraction.trainModel(factory.id('prop3extractor'));
      await expect(promise1).rejects.toThrow();
      expect(setupSockets.emitToTenant).toHaveBeenNthCalledWith(
        1,
        'tenant1',
        IXWebSocketEvents.ErrorTrainingModel,
        { message: NoLabeledEntities.defaultMessage }
      );
      const [model] = await IXModelsModel.get({ extractorId: factory.id('prop3extractor') });
      expect(model.findingSuggestions).toBe(false);

      const promise2 = informationExtraction.trainModel(
        factory.id('extractorWithMultiselectWithoutTrainingData')
      );
      await expect(promise2).rejects.toThrow();
      expect(setupSockets.emitToTenant).toHaveBeenNthCalledWith(
        2,
        'tenant1',
        IXWebSocketEvents.ErrorTrainingModel,
        { message: NoLabeledEntities.defaultMessage }
      );
      const [multiSelectModel] = await IXModelsModel.get({
        extractorId: factory.id('extractorWithMultiselectWithoutTrainingData'),
      });
      expect(multiSelectModel.findingSuggestions).toBe(false);

      const promise3 = informationExtraction.trainModel(
        factory.id('extractorWithEmptyRelationship')
      );
      await expect(promise3).rejects.toThrow();
      expect(setupSockets.emitToTenant).toHaveBeenNthCalledWith(
        3,
        'tenant1',
        IXWebSocketEvents.ErrorTrainingModel,
        { message: NoLabeledEntities.defaultMessage }
      );
      const [relationshipModel] = await IXModelsModel.get({
        extractorId: factory.id('extractorWithEmptyRelationship'),
      });
      expect(relationshipModel.findingSuggestions).toBe(false);
    });

    it('should emit error status (No segmented files) and stop finding suggestions, when there are no segmented files', async () => {
      const promise = informationExtraction.trainModel(factory.id('extractorWithoutSegmentations'));
      await expect(promise).rejects.toThrow();
      const [model] = await IXModelsModel.get({
        extractorId: factory.id('extractorWithoutSegmentations'),
      });
      expect(model.findingSuggestions).toBe(false);

      expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
        'tenant1',
        IXWebSocketEvents.ErrorTrainingModel,
        { message: NoFilesForTraining.defaultMessage }
      );
    });

    it('should emit error status (No segmented files) and stop finding suggestions, when there are no segmented files (select/multiselect/relationship)', async () => {
      const promise = informationExtraction.trainModel(
        factory.id('selectExtractorWithoutSegmentations')
      );
      await expect(promise).rejects.toThrow();
      const [model] = await IXModelsModel.get({
        extractorId: factory.id('selectExtractorWithoutSegmentations'),
      });

      expect(model.findingSuggestions).toBe(false);

      expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
        'tenant1',
        IXWebSocketEvents.ErrorTrainingModel,
        { message: NoFilesForTraining.defaultMessage }
      );
    });
  });

  describe('testModel', () => {
    it('should send xmls (as in trainModel)', async () => {
      await informationExtraction.testModel(factory.id('prop1extractor'));

      const xmlA = await readDocument('A');

      const xmlC = await readDocument('C');

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_train/tenant1/${factory.id('prop1extractor')}`,
        id: factory.id('prop1extractor').toString(),
        tenant: 'tenant1',
      });
      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlA, xmlC]));
      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentA.xml', 'documentC.xml'].sort()
      );
    });

    it('should mark the model as testRun', async () => {
      await informationExtraction.testModel(factory.id('prop1extractor'));

      const [model] = await IXModelsModel.get({ extractorId: factory.id('prop1extractor') });
      expect(model.testRun).toBe(true);
      expect(model.testRunSuggestionsToFind).toBe(TEST_RUN_SUGGESTIONS_SIZE);
    });
  });

  describe('when model is trained', () => {
    it('should call getSuggestions', async () => {
      const getSuggestionsSpy = jest
        .spyOn(informationExtraction, 'getSuggestions')
        .mockImplementation(async () => Promise.resolve());

      await informationExtraction.processResults({
        params: { id: factory.id('prop1extractor').toString() },
        tenant: 'tenant1',
        task: 'create_model',
        success: true,
      });
      expect(informationExtraction.getSuggestions).toHaveBeenCalledWith(
        factory.id('prop1extractor')
      );

      getSuggestionsSpy.mockClear();

      await informationExtraction.processResults({
        params: { id: factory.id('extractorWithMultiselect').toString() },
        tenant: 'tenant1',
        task: 'create_model',
        success: true,
      });
      expect(informationExtraction.getSuggestions).toHaveBeenCalledWith(
        factory.id('extractorWithMultiselect')
      );

      jest.clearAllMocks();
    });
  });

  describe('getSuggestions()', () => {
    it('should send the materials for the suggestions', async () => {
      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      const xmlA = await readDocument('A');

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_predict/tenant1/${factory.id('prop1extractor')}`,
        id: factory.id('prop1extractor').toString(),
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
        id: factory.id('prop1extractor').toString(),
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

    it('should send the materials for the suggestions (multiselect)', async () => {
      await informationExtraction.getSuggestions(factory.id('extractorWithMultiselect'));

      const [xmlG, xmlH, xmlI] = await Promise.all(
        ['G', 'H', 'I'].map(async letter => readDocument(letter))
      );

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_predict/tenant1/${factory.id('extractorWithMultiselect')}`,
        id: factory.id('extractorWithMultiselect').toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.filesNames.sort()).toEqual([
        'documentG.xml',
        'documentH.xml',
        'documentI.xml',
      ]);
      expect(IXExternalService.files.length).toBe(3);
      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlG, xmlH, xmlI]));

      expect(IXExternalService.materials.length).toBe(3);
      const sortedMaterials = sortByStrings(IXExternalService.materials, [
        (m: any) => m.xml_file_name,
      ]);
      expect(sortedMaterials).toEqual([
        {
          xml_file_name: 'documentG.xml',
          id: factory.id('extractorWithMultiselect').toString(),
          tenant: 'tenant1',
          page_height: 13,
          page_width: 13,
          xml_segments_boxes: [
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'A',
              top: 1,
              width: 1,
            },
          ],
        },
        {
          xml_file_name: 'documentH.xml',
          id: factory.id('extractorWithMultiselect').toString(),
          tenant: 'tenant1',
          page_height: 13,
          page_width: 13,
          xml_segments_boxes: [
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'B',
              top: 1,
              width: 1,
            },
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'C',
              top: 1,
              width: 1,
            },
          ],
        },
        {
          xml_file_name: 'documentI.xml',
          id: factory.id('extractorWithMultiselect').toString(),
          tenant: 'tenant1',
          page_height: 13,
          page_width: 13,
          xml_segments_boxes: [],
        },
      ]);
    });

    it('should send the materials for the suggestions (relationship)', async () => {
      await informationExtraction.getSuggestions(factory.id('extractorWithRelationship'));

      const [xmlK, xmlL, xmlM] = await Promise.all(
        ['K', 'L', 'M'].map(async letter => readDocument(letter))
      );

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_predict/tenant1/${factory.id('extractorWithRelationship')}`,
        id: factory.id('extractorWithRelationship').toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.filesNames.sort()).toEqual(
        ['documentK.xml', 'documentL.xml', 'documentM.xml'].sort()
      );
      expect(IXExternalService.files.length).toBe(3);
      expect(IXExternalService.files).toEqual(expect.arrayContaining([xmlK, xmlL, xmlM]));

      expect(IXExternalService.materials.length).toBe(3);
      const sortedMaterials = sortByStrings(IXExternalService.materials, [
        (m: any) => m.xml_file_name,
      ]);
      expect(sortedMaterials).toEqual([
        {
          xml_file_name: 'documentK.xml',
          id: factory.id('extractorWithRelationship').toString(),
          tenant: 'tenant1',
          page_height: 13,
          page_width: 13,
          xml_segments_boxes: [
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'P1',
              top: 1,
              width: 1,
            },
          ],
        },
        {
          xml_file_name: 'documentL.xml',
          id: factory.id('extractorWithRelationship').toString(),
          tenant: 'tenant1',
          page_height: 13,
          page_width: 13,
          xml_segments_boxes: [
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'P1',
              top: 1,
              width: 1,
            },
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'P2',
              top: 1,
              width: 1,
            },
          ],
        },
        {
          xml_file_name: 'documentM.xml',
          id: factory.id('extractorWithRelationship').toString(),
          tenant: 'tenant1',
          page_height: 13,
          page_width: 13,
          xml_segments_boxes: [
            {
              height: 1,
              left: 1,
              page_number: 1,
              text: 'P3',
              top: 1,
              width: 1,
            },
          ],
        },
      ]);
    });

    it('should avoid sending materials for failed suggestions because no segmentation for instance', async () => {
      await informationExtraction.getSuggestions(factory.id('extractorWithOneFailedSegmentation'));

      expect(IXExternalService.materialsFileParams).toEqual({
        0: `/xml_to_predict/tenant1/${factory.id('extractorWithOneFailedSegmentation')}`,
        id: factory.id('extractorWithOneFailedSegmentation').toString(),
        tenant: 'tenant1',
      });

      expect(IXExternalService.filesNames.sort()).toEqual(['documentA.xml'].sort());
      expect(IXExternalService.files.length).toBe(1);

      expect(IXExternalService.materials.length).toBe(1);
    });

    it('should filter out files with failed segmentations to prevent zero-length batches', async () => {
      // Segmentation with failed status for documentA
      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        status: 'failed',
      });

      // Segmentation with ready status for documentC
      await SegmentationModel.save({
        fileID: factory.id('F3'),
        filename: 'documentC.pdf',
        status: 'ready',
        segmentation: {
          paragraphs: [
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
        },
        xmlname: 'documentC.xml',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      expect(IXExternalService.filesNames.sort()).toEqual(['documentC.xml'].sort());
      expect(IXExternalService.files.length).toBe(1);
      expect(IXExternalService.materials.length).toBe(1);

      expect(IXExternalService.filesNames).not.toContain('documentA.xml');
    });

    it('should mark suggestions as failed when their segmentations fail', async () => {
      await SegmentationModel.delete({});
      await IXSuggestionsModel.delete({});

      await filesModel.save({
        _id: factory.id('F1'),
        filename: 'documentA.pdf',
        type: 'document',
        language: 'en',
        entity: 'entity1',
        extractedMetadata: [],
      });

      await filesModel.save({
        _id: factory.id('F2'),
        filename: 'documentB.pdf',
        type: 'document',
        language: 'en',
        entity: 'entity2',
        extractedMetadata: [],
      });

      await IXSuggestionsModel.save({
        fileId: factory.id('F1'),
        entityId: 'entity1',
        language: 'en',
        propertyName: 'property1',
        extractorId: factory.id('prop1extractor'),
        date: 100,
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      await IXSuggestionsModel.save({
        fileId: factory.id('F2'),
        entityId: 'entity2',
        language: 'en',
        propertyName: 'property1',
        extractorId: factory.id('prop1extractor'),
        date: 100,
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        status: 'failed',
      });

      await SegmentationModel.save({
        fileID: factory.id('F2'),
        filename: 'documentB.pdf',
        status: 'failed',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      const suggestions = await IXSuggestionsModel.get({
        extractorId: factory.id('prop1extractor'),
      });
      expect(suggestions.length).toBe(2);

      const failedSuggestions = suggestions.filter(s => s.status === 'failed');
      expect(failedSuggestions.length).toBe(2);

      failedSuggestions.forEach(suggestion => {
        expect(suggestion.status).toBe('failed');
        expect(suggestion.state?.error).toBe(true);
        expect(suggestion.state?.obsolete).toBe(false);
      });

      expect(IXExternalService.filesNames).toEqual([]);
      expect(IXExternalService.files.length).toBe(0);
      expect(IXExternalService.materials.length).toBe(0);
    });

    it('should filter out files with processing segmentations to prevent zero-length batches', async () => {
      // Segmentation with processing status for documentA
      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        status: 'processing',
      });

      // Segmentation with ready status for documentC
      await SegmentationModel.save({
        fileID: factory.id('F3'),
        filename: 'documentC.pdf',
        status: 'ready',
        segmentation: {
          paragraphs: [
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
        },
        xmlname: 'documentC.xml',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      expect(IXExternalService.filesNames.sort()).toEqual(['documentC.xml'].sort());
      expect(IXExternalService.files.length).toBe(1);
      expect(IXExternalService.materials.length).toBe(1);

      expect(IXExternalService.filesNames).not.toContain('documentA.xml');
    });

    it('should filter out files with missing segmentation status', async () => {
      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        // No status field
      });

      // Segmentation with ready status for documentC
      await SegmentationModel.save({
        fileID: factory.id('F3'),
        filename: 'documentC.pdf',
        status: 'ready',
        segmentation: {
          paragraphs: [
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
        },
        xmlname: 'documentC.xml',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      expect(IXExternalService.filesNames.sort()).toEqual(['documentC.xml'].sort());
      expect(IXExternalService.files.length).toBe(1);
      expect(IXExternalService.materials.length).toBe(1);

      expect(IXExternalService.filesNames).not.toContain('documentA.xml');
    });

    it('should handle error when no files have ready segmentations', async () => {
      await SegmentationModel.delete({});
      await IXSuggestionsModel.delete({});

      await filesModel.save({
        _id: factory.id('F1'),
        filename: 'documentA.pdf',
        type: 'document',
        language: 'en',
        entity: 'entity1',
        extractedMetadata: [],
      });

      await filesModel.save({
        _id: factory.id('F3'),
        filename: 'documentC.pdf',
        type: 'document',
        language: 'en',
        entity: 'entity3',
        extractedMetadata: [],
      });

      await IXSuggestionsModel.save({
        fileId: factory.id('F1'),
        entityId: 'entity1',
        language: 'en',
        propertyName: 'property1',
        extractorId: factory.id('prop1extractor'),
        date: new Date().getTime(),
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      await IXSuggestionsModel.save({
        fileId: factory.id('F3'),
        entityId: 'entity3',
        language: 'en',
        propertyName: 'property1',
        extractorId: factory.id('prop1extractor'),
        date: new Date().getTime(),
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      // Segmentations with failed status
      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        status: 'failed',
      });

      await SegmentationModel.save({
        fileID: factory.id('F3'),
        filename: 'documentC.pdf',
        status: 'processing',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      const [model] = await IXModelsModel.get({ extractorId: factory.id('prop1extractor') });
      expect(model.findingSuggestions).toBe(false);

      expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
        'tenant1',
        'ix_model_status',
        factory.id('prop1extractor'),
        'ready',
        'Completed'
      );
    });

    it('should handle mixed segmentation statuses correctly', async () => {
      // Segmentations with different statuses
      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        status: 'ready',
        segmentation: {
          paragraphs: [
            {
              left: 58,
              top: 63,
              width: 457,
              height: 15,
              page_number: 1,
              text: 'documentA content',
            },
          ],
          page_width: 595,
          page_height: 841,
        },
        xmlname: 'documentA.xml',
      });

      await SegmentationModel.save({
        fileID: factory.id('F3'),
        filename: 'documentC.pdf',
        status: 'failed',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      // Should only process the ready segmentation
      expect(IXExternalService.filesNames).toEqual(['documentA.xml']);
      expect(IXExternalService.files.length).toBe(1);
      expect(IXExternalService.materials.length).toBe(1);

      expect(IXExternalService.filesNames).not.toContain('documentC.xml');
    });

    it('should fetch more files when many have failed segmentations to ensure batch size', async () => {
      await SegmentationModel.delete({});
      await IXSuggestionsModel.delete({});

      await filesModel.save({
        _id: factory.id('F1'),
        filename: 'document1.pdf',
        type: 'document',
        language: 'en',
        entity: 'entity1',
        extractedMetadata: [],
      });

      await filesModel.save({
        _id: factory.id('F2'),
        filename: 'document2.pdf',
        type: 'document',
        language: 'en',
        entity: 'entity2',
        extractedMetadata: [],
      });

      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'document1.pdf',
        status: 'failed',
      });

      await SegmentationModel.save({
        fileID: factory.id('F2'),
        filename: 'document2.pdf',
        status: 'ready',
        segmentation: {
          paragraphs: [
            {
              left: 58,
              top: 63,
              width: 457,
              height: 15,
              page_number: 1,
              text: 'content',
            },
          ],
          page_width: 595,
          page_height: 841,
        },
        xmlname: 'document2.xml',
      });

      await IXSuggestionsModel.save({
        _id: factory.id('S1'),
        extractorId: factory.id('prop1extractor'),
        entityId: 'entity1',
        fileId: factory.id('F1'),
        date: 100,
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      await IXSuggestionsModel.save({
        _id: factory.id('S2'),
        extractorId: factory.id('prop1extractor'),
        entityId: 'entity2',
        fileId: factory.id('F2'),
        date: 100,
        state: {
          labeled: false,
          withValue: false,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      });

      const { getFilesForSuggestions } = await import('../ixMaterials');
      const files = await getFilesForSuggestions(factory.id('prop1extractor'), 10);

      // Should have returned only the file with ready segmentation
      expect(files.length).toBe(1);
      expect(files[0].segmentation?.xmlname).toBe('document2.xml');
    });

    it('should create suggestions for all files regardless of segmentation status', async () => {
      // Segmentations with different statuses
      await SegmentationModel.save({
        fileID: factory.id('F1'),
        filename: 'documentA.pdf',
        status: 'ready',
        segmentation: {
          paragraphs: [
            { left: 58, top: 63, width: 457, height: 15, page_number: 1, text: 'content' },
          ],
          page_width: 595,
          page_height: 841,
        },
        xmlname: 'documentA.xml',
      });

      await SegmentationModel.save({
        fileID: factory.id('F3'),
        filename: 'documentC.pdf',
        status: 'failed',
      });

      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      // Should create suggestions for both files regardless of segmentation status
      const suggestions = await IXSuggestionsModel.get({
        extractorId: factory.id('prop1extractor'),
      });
      expect(suggestions.length).toBe(2);

      // But only send the ready one for processing
      expect(IXExternalService.filesNames).toEqual(['documentA.xml']);
      expect(IXExternalService.files.length).toBe(1);
    });

    it('should create the task for the suggestions', async () => {
      await informationExtraction.getSuggestions(factory.id('prop1extractor'));

      expect(informationExtraction.taskManager?.startTask).toHaveBeenCalledWith({
        params: {
          id: factory.id('prop1extractor').toString(),
          metadata: {
            extractor_name: 'prop1extractor',
            property: 'property1',
            templates: expect.anything(),
          },
        },
        tenant: 'tenant1',
        task: 'suggestions',
      });
    });

    it('should create the suggestions placeholder with status processing', async () => {
      await informationExtraction.getSuggestions(factory.id('prop1extractor'));
      const suggestions = await IXSuggestionsModel.get({
        extractorId: factory.id('prop1extractor'),
      });
      expect(suggestions.length).toBe(2);
      expect(suggestions.find(s => s.entityId === 'A1')).toEqual(
        expect.objectContaining({
          entityId: 'A1',
          status: 'processing',
          state: {
            labeled: true,
            match: null,
            withValue: true,
            withSuggestion: true,
            hasContext: true,
            processing: true,
            obsolete: true,
            error: false,
          },
        })
      );
    });

    it('should stop the model when all the suggestions are done', async () => {
      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));
      await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));
      const [model] = await IXModelsModel.get({ extractorId: factory.id('sourceTextExtractor1') });
      expect(model.findingSuggestions).toBe(false);
    });

    describe('testRun', () => {
      beforeEach(async () => {
        await testingDB.mongodb
          ?.collection('ixmodels')
          .updateOne(
            { extractorId: factory.id('sourceTextExtractor1') },
            { $set: { testRun: true, testRunSuggestionsToFind: 1, totalSuggestionsToFind: 1 } }
          );
        await testingDB.mongodb
          ?.collection('ixmodels')
          .updateOne(
            { extractorId: factory.id('prop1extractor') },
            { $set: { testRun: true, testRunSuggestionsToFind: 1, totalSuggestionsToFind: 1 } }
          );

        await testingDB.mongodb?.collection('ixsuggestions').updateMany(
          {
            extractorId: factory.id('sourceTextExtractor1'),
            entityId: 'A1',
          },
          { $set: { trainingSample: true } }
        );
      });

      it('should only process a subset of suggestions, excluding the ones that are training samples', async () => {
        await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));
        await informationExtraction.getSuggestions(factory.id('sourceTextExtractor1'));
        const [model] = await IXModelsModel.get({
          extractorId: factory.id('sourceTextExtractor1'),
        });
        expect(model.findingSuggestions).toBe(false);

        const suggestionsInProcessing = await IXSuggestionsModel.get({
          extractorId: factory.id('sourceTextExtractor1'),
          status: 'processing',
        });
        expect(suggestionsInProcessing.length).toBe(1);
        expect(suggestionsInProcessing[0].entityId).toBe('entity_without_label_data');
        expect(setupSockets.emitToTenant).toHaveBeenNthCalledWith(
          1,
          'tenant1',
          'ix_model_status',
          factory.id('sourceTextExtractor1'),
          'ready',
          'Test completed'
        );
      });

      it('should work with PDF based extractors', async () => {
        await informationExtraction.getSuggestions(factory.id('prop1extractor'));
        const suggestions = await IXSuggestionsModel.get({
          extractorId: factory.id('prop1extractor'),
          status: 'processing',
        });
        expect(suggestions.length).toBe(1);
      });
    });
  });

  describe('processResults', () => {
    it('should not continue sending suggestions if flag is not set', async () => {
      const [model] = await IXModelsModel.get({ extractorId: factory.id('prop2extractor') });
      model.findingSuggestions = false;
      await IXModelsModel.save(model);

      const message: IXResultsMessage = {
        task: 'create_model',
        data_url: 'some/url',
        error_message: '',
        params: {
          id: factory.id('prop2extractor').toString(),
        },
        tenant: 'tenant1',
        file_url: '',
        success: true,
      };

      await informationExtraction.processResults(message);
      expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
        message.tenant,
        'ix_model_status',
        message.params!.id,
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

      await saveSuggestionProcess('F3', 'A3', 'eng', 'prop1extractor');
      await saveSuggestionProcess('F1', 'A1', 'eng', 'prop1extractor');
      await informationExtraction.processResults({
        params: { id: factory.id('prop1extractor').toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        extractorId: factory.id('prop1extractor'),
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
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            processing: false,
            obsolete: false,
            error: false,
          },
        })
      );
    });

    it('should save different language suggestions for the same entity', async () => {
      IXExternalService.setResults([
        {
          tenant: 'tenant1',
          id: factory.id('prop1extractor').toString(),
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
          id: factory.id('prop1extractor').toString(),
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

      await saveSuggestionProcess('F1', 'A1', 'other', 'prop1extractor');
      await saveSuggestionProcess('F4', 'A1', 'eng', 'prop1extractor');

      await informationExtraction.processResults({
        params: { id: factory.id('prop1extractor').toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        extractorId: factory.id('prop1extractor'),
      });

      expect(suggestions.length).toBe(2);

      expect(suggestions.find(s => s.language === 'other')).toEqual(
        expect.objectContaining({
          language: 'other',
          propertyName: 'property1',
          status: 'ready',
          suggestedValue: 'text_in_other_language',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            processing: false,
            obsolete: false,
            error: false,
          },
        })
      );

      expect(suggestions.find(s => s.language === 'en')).toEqual(
        expect.objectContaining({
          language: 'en',
          propertyName: 'property1',
          status: 'ready',
          suggestedValue: 'text_in_eng_language',
          state: {
            labeled: false,
            withValue: false,
            withSuggestion: true,
            match: false,
            hasContext: true,
            processing: false,
            obsolete: false,
            error: false,
          },
        })
      );
    });

    it('should store non-configured languages as default language suggestion', async () => {
      setIXServiceResults([
        {
          xml_file_name: 'documentE.xml',
          text: 'Esto es una prueba',
        },
      ]);

      await saveSuggestionProcess('F5', 'A5', 'eng', 'prop1extractor');

      await informationExtraction.processResults({
        params: { id: factory.id('prop1extractor').toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: true,
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'ready',
        extractorId: factory.id('prop1extractor'),
      });
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].language).toBe('en');
    });

    it('should store failed suggestions', async () => {
      setIXServiceResults([
        {
          text: '',
          segment_text: '',
        },
      ]);

      await informationExtraction.processResults({
        params: { id: factory.id('prop2extractor').toString() },
        tenant: 'tenant1',
        task: 'suggestions',
        success: false,
        error_message: 'Issue calculation suggestion',
        data_url: 'http://localhost:1234/suggestions_results',
      });

      const suggestions = await IXSuggestionsModel.get({
        status: 'failed',
        extractorId: factory.id('prop2extractor'),
      });

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]).toEqual(
        expect.objectContaining({
          entityId: 'A1',
          language: 'en',
          propertyName: 'property2',
          suggestedValue: 'suggestion_text_1',
          segment: 'segment_text_1',
          status: 'failed',
          error: 'Issue calculation suggestion',
          state: {
            match: null,
            withSuggestion: false,
            hasContext: false,
            processing: false,
            error: true,
          },
        })
      );
    });

    describe('text', () => {
      it('should store empty suggestions when they are of type text', async () => {
        setIXServiceResults([
          {
            text: '',
            segment_text: '',
          },
          {
            text: '',
            segment_text: '',
          },
        ]);

        await saveSuggestionProcess('F1', 'A1', 'eng', 'prop1extractor');

        await informationExtraction.processResults({
          params: { id: factory.id('prop1extractor').toString() },
          tenant: 'tenant1',
          task: 'suggestions',
          success: true,
          data_url: 'http://localhost:1234/suggestions_results',
        });

        const suggestionsText = await IXSuggestionsModel.get({
          status: 'ready',
          extractorId: factory.id('prop1extractor'),
        });
        expect(suggestionsText.length).toBe(1);
      });
    });

    describe('dates', () => {
      it('should store the suggestion text and suggestion value for dates', async () => {
        setIXServiceResults([
          {
            xml_file_name: 'documentC.xml',
            text: '2019-10-12',
            segment_text: 'Birthday of John Doe is October 12, 2019',
          },
        ]);

        await saveSuggestionProcess('F3', 'A3', 'eng', 'prop2extractor');

        await informationExtraction.processResults({
          params: { id: factory.id('prop2extractor').toString() },
          tenant: 'tenant1',
          task: 'suggestions',
          success: true,
          data_url: 'http://localhost:1234/suggestions_results',
        });

        const suggestions = await IXSuggestionsModel.get({
          status: 'ready',
          extractorId: factory.id('prop2extractor'),
          entityId: 'A3',
        });

        expect(suggestions).toMatchObject([
          { suggestedValue: 1570838400, suggestedText: '2019-10-12' },
        ]);
      });
    });

    describe('select/multiselect', () => {
      it('should request and store the suggestions (select)', async () => {
        setIXServiceResults(
          [
            {
              id: factory.id('extractorWithSelect').toString(),
              xml_file_name: 'documentG.xml',
              values: [{ id: 'A', label: 'A' }],
              segment_text: 'it is A',
            },
            {
              id: factory.id('extractorWithSelect').toString(),
              xml_file_name: 'documentH.xml',
              values: [{ id: 'B', label: 'B' }],
              segment_text: 'it is B',
            },
            {
              id: factory.id('extractorWithSelect').toString(),
              xml_file_name: 'documentI.xml',
              values: [{ id: 'A', label: 'A' }],
              segment_text: 'it is A',
            },
          ],
          'value'
        );

        await saveSuggestionProcess('SUG17B', 'A17', 'eng', 'extractorWithSelect');
        await saveSuggestionProcess('SUG18B', 'A18', 'eng', 'extractorWithSelect');
        await saveSuggestionProcess('SUG19B', 'A19', 'eng', 'extractorWithSelect');

        await informationExtraction.processResults({
          params: { id: factory.id('extractorWithSelect').toString() },
          tenant: 'tenant1',
          task: 'suggestions',
          success: true,
          data_url: 'http://localhost:1234/suggestions_results',
        });

        const suggestions = await IXSuggestionsModel.get({
          status: 'ready',
          extractorId: factory.id('extractorWithSelect'),
        });

        const sorted = sortByStrings(suggestions, [(s: any) => s.entityId]);

        const expectedBase = {
          _id: expect.any(ObjectId),
          entityTemplate: factory.id('templateToSegmentD').toString(),
          language: 'en',
          propertyName: 'property_select',
          extractorId: factory.id('extractorWithSelect'),
          status: 'ready',
          page: 1,
          date: expect.any(Number),
          error: '',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: true,
            hasContext: true,
            processing: false,
            obsolete: false,
            error: false,
          },
        };

        expect(sorted).toMatchObject([
          {
            ...expectedBase,
            fileId: factory.id('F17'),
            entityId: 'A17',
            suggestedValue: 'A',
            segment: 'it is A',
          },
          {
            ...expectedBase,
            fileId: factory.id('F18'),
            entityId: 'A18',
            suggestedValue: 'B',
            segment: 'it is B',
          },
          {
            ...expectedBase,
            fileId: factory.id('F19'),
            entityId: 'A19',
            suggestedValue: 'A',
            segment: 'it is A',
            state: {
              ...expectedBase.state,
              withValue: false,
              labeled: false,
              match: false,
            },
          },
        ]);
      });

      it('should request and store the suggestions (multiselect)', async () => {
        setIXServiceResults(
          [
            {
              id: factory.id('extractorWithMultiselect').toString(),
              xml_file_name: 'documentG.xml',
              values: [{ id: 'A', label: 'A' }],
              segment_text: 'it is A',
            },
            {
              id: factory.id('extractorWithMultiselect').toString(),
              xml_file_name: 'documentH.xml',
              values: [
                { id: 'B', label: 'B' },
                { id: 'C', label: 'C' },
              ],
              segment_text: 'it is B or C',
            },
            {
              id: factory.id('extractorWithMultiselect').toString(),
              xml_file_name: 'documentI.xml',
              values: [
                { id: 'A', label: 'A' },
                { id: 'C', label: 'C' },
              ],
              segment_text: 'it is A or C',
            },
          ],
          'value'
        );

        await saveSuggestionProcess('SUG17', 'A17', 'eng', 'extractorWithMultiselect');
        await saveSuggestionProcess('SUG18', 'A18', 'eng', 'extractorWithMultiselect');
        await saveSuggestionProcess('SUG19', 'A19', 'eng', 'extractorWithMultiselect');

        await informationExtraction.processResults({
          params: { id: factory.id('extractorWithMultiselect').toString() },
          tenant: 'tenant1',
          task: 'suggestions',
          success: true,
          data_url: 'http://localhost:1234/suggestions_results',
        });

        const suggestions = await IXSuggestionsModel.get({
          status: 'ready',
          extractorId: factory.id('extractorWithMultiselect'),
        });

        const sorted = sortByStrings(suggestions, [(s: any) => s.entityId]);

        const expectedBase = {
          _id: expect.any(ObjectId),
          entityTemplate: factory.id('templateToSegmentD').toString(),
          language: 'en',
          propertyName: 'property_multiselect',
          extractorId: factory.id('extractorWithMultiselect'),
          status: 'ready',
          page: 1,
          date: expect.any(Number),
          error: '',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: true,
            hasContext: true,
            processing: false,
            obsolete: false,
            error: false,
          },
        };

        expect(sorted).toMatchObject([
          {
            ...expectedBase,
            fileId: factory.id('F17'),
            entityId: 'A17',
            suggestedValue: [{ id: 'A', label: 'A' }],
            segment: 'it is A',
          },
          {
            ...expectedBase,
            fileId: factory.id('F18'),
            entityId: 'A18',
            suggestedValue: [
              { id: 'B', label: 'B' },
              { id: 'C', label: 'C' },
            ],
            segment: 'it is B or C',
          },
          {
            ...expectedBase,
            fileId: factory.id('F19'),
            entityId: 'A19',
            suggestedValue: [
              { id: 'A', label: 'A' },
              { id: 'C', label: 'C' },
            ],
            segment: 'it is A or C',
            state: {
              ...expectedBase.state,
              withValue: false,
              labeled: false,
              match: false,
            },
          },
        ]);
      });
    });

    describe('relationship', () => {
      it('should request and store the suggestions (relationship)', async () => {
        setIXServiceResults(
          [
            {
              id: factory.id('extractorWithRelationship').toString(),
              xml_file_name: 'documentK.xml',
              values: [{ id: 'P1sharedId', label: 'P1' }],
              segment_text: 'it is P1',
            },
            {
              id: factory.id('extractorWithRelationship').toString(),
              xml_file_name: 'documentL.xml',
              values: [
                { id: 'P1sharedId', label: 'P1' },
                { id: 'P2sharedId', label: 'P2' },
              ],
              segment_text: 'it is P1 or P2',
            },
            {
              id: factory.id('extractorWithRelationship').toString(),
              xml_file_name: 'documentM.xml',
              values: [{ id: 'P3sharedId', label: 'P3' }],
              segment_text: 'it is P3',
            },
          ],
          'value'
        );

        await saveSuggestionProcess('SUG21', 'A21', 'eng', 'extractorWithRelationship');
        await saveSuggestionProcess('SUG22', 'A22', 'eng', 'extractorWithRelationship');
        await saveSuggestionProcess('SUG23', 'A23', 'eng', 'extractorWithRelationship');

        await informationExtraction.processResults({
          params: { id: factory.id('extractorWithRelationship').toString() },
          tenant: 'tenant1',
          task: 'suggestions',
          success: true,
          data_url: 'http://localhost:1234/suggestions_results',
        });

        const suggestions = await IXSuggestionsModel.get({
          status: 'ready',
          extractorId: factory.id('extractorWithRelationship'),
        });

        const sorted = sortByStrings(suggestions, [(s: any) => s.entityId]);

        const expectedBase = {
          _id: expect.any(ObjectId),
          entityTemplate: factory.id('templateToSegmentF').toString(),
          language: 'en',
          propertyName: 'property_relationship',
          extractorId: factory.id('extractorWithRelationship'),
          status: 'ready',
          page: 1,
          date: expect.any(Number),
          error: '',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: true,
            hasContext: true,
            processing: false,
            obsolete: false,
            error: false,
          },
        };

        expect(sorted).toMatchObject([
          {
            ...expectedBase,
            fileId: factory.id('F21'),
            entityId: 'A21',
            suggestedValue: [{ id: 'P1sharedId', label: 'P1' }],
            segment: 'it is P1',
          },
          {
            ...expectedBase,
            fileId: factory.id('F22'),
            entityId: 'A22',
            suggestedValue: [
              { id: 'P1sharedId', label: 'P1' },
              { id: 'P2sharedId', label: 'P2' },
            ],
            segment: 'it is P1 or P2',
            state: {
              ...expectedBase.state,
              match: false,
            },
          },
          {
            ...expectedBase,
            fileId: factory.id('F23'),
            entityId: 'A23',
            suggestedValue: [{ id: 'P3sharedId', label: 'P3' }],
            segment: 'it is P3',
            state: {
              ...expectedBase.state,
              withValue: false,
              labeled: false,
              match: false,
            },
          },
        ]);
      });
    });
  });
});
