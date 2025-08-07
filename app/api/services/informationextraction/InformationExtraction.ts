/* eslint-disable class-methods-use-this */
/* eslint-disable max-lines */
/* eslint-disable max-statements */
import urljoin from 'url-join';
import { ObjectId } from 'mongodb';

import { storage } from 'api/files';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { EnforcedWithId } from 'api/odm';
import { tenants } from 'api/tenants/tenantContext';
import { emitToTenant } from 'api/socketio/setupSockets';
import { filesModel } from 'api/files/filesModel';
import entities from 'api/entities/entities';
import settings from 'api/settings/settings';
import request from 'shared/JSONRequest';
import { EntitySchema } from 'shared/types/entityType';
import {
  ExtractedMetadataSchema,
  LanguageISO6391,
  ObjectIdSchema,
  PropertySchema,
} from 'shared/types/commonTypes';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { FileType } from 'shared/types/fileType';
import {
  BATCH_SIZE_FOR_PDF,
  BATCH_SIZE_FOR_PROPERTY,
  FileWithAggregation,
  getEntitiesForSuggestions,
  getFilesForSuggestions,
  propertyTypeIsWithoutExtractedMetadata,
} from 'api/services/informationextraction/ixMaterials';
import { Suggestions } from 'api/suggestions/suggestions';
import { IXExtractorType } from 'shared/types/extractorType';
import { LanguageUtils } from 'shared/language';
import { IXModelType } from 'shared/types/IXModelType';
import { ParagraphSchema } from 'shared/types/segmentationType';
import moment from 'moment';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { retryWithBackoff, descriptiveError } from 'api/utils/retryWithBackoff';
import { SuggestionFactory } from 'api/suggestions/suggestionFactory';
import { IXSuggestionType } from 'shared/types/suggestionType';
import ixmodels from './ixmodels';
import { IXModelsModel } from './IXModelsModel';
import { Extractors } from './ixextractors';
import {
  CommonSuggestion,
  RawSuggestion,
  TextSelectionSuggestion,
  ValuesSelectionSuggestion,
  formatSuggestionFacade,
} from './suggestionFormatting';
import { ExtractionKey } from './ExtractionKey';
import { IXTrainModelJob } from './TrainModelJob';
import { IXServices } from './IXServices';

const defaultTrainingLanguage = 'en';

type TaskTypes = 'suggestions' | 'create_model';

interface TaskParameters {
  id: string;
  multi_value?: boolean;
  options?: { label: string; id: string }[];
  metadata?: { [key: string]: string };
}

interface TaskMessage {
  tenant: string;
  task: TaskTypes;
  params?: TaskParameters;
}

type ResultParameters = TaskParameters;

/* eslint-disable camelcase */
interface ResultMessage<P = ResultParameters> {
  tenant: string;
  task: TaskTypes;
  params?: P;
  data_url?: string;
  file_url?: string;
  success?: boolean;
  error_message?: string;
}
/* eslint-enable camelcase */

interface InternalResultParameters {
  id: ObjectId;
}

type IXResultsMessage = ResultMessage;

type InternalIXResultsMessage = ResultMessage<InternalResultParameters>;

interface CommonMaterialsData {
  xml_file_name: string;
  id: string;
  tenant: string;
  xml_segments_boxes?: ParagraphSchema[];
  page_width?: number;
  page_height?: number;
}

interface LabeledMaterialsData extends CommonMaterialsData {
  language_iso: string;
}

interface TextSelectionMaterialsData extends LabeledMaterialsData {
  label_text: FileWithAggregation['propertyValue'];
  entity_name?: string;
  source_text?: string;
  label_segments_boxes:
    | (Omit<ParagraphSchema, 'page_number'> & { page_number?: string })[]
    | undefined;
}

interface ValuesSelectionMaterialsData extends LabeledMaterialsData {
  values: { id: string; label: string }[];
}

type MaterialsData =
  | CommonMaterialsData
  | TextSelectionMaterialsData
  | ValuesSelectionMaterialsData;

interface PropertySourceMaterials {
  entity_name: string;
  language_iso: string;
  id: string;
  tenant: string;
  source_text: string;
  label_text?: any;
  values?: { id: string; label: string }[];
}

type IXTaskManager = TaskManager<TaskMessage, IXResultsMessage>;

class InformationExtraction {
  static SERVICE_NAME = 'information_extraction';

  public taskManager: TaskManager<TaskMessage, IXResultsMessage>;

  static mock: any;

  constructor() {
    this.taskManager = new TaskManager<TaskMessage, IXResultsMessage>({
      serviceName: InformationExtraction.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  start() {
    this.taskManager.subscribeToResults();
  }

  async stop() {
    await this.taskManager.stop();
  }

  private async handleFailedStatus(
    message: InternalIXResultsMessage,
    currentModel: IXModelType | undefined
  ) {
    const errorMessage = message.error_message || 'Task failed';

    await IXServices.saveModelProcess(message.params!.id, ModelStatus.failed, {
      findingSuggestions: false,
    });

    if (currentModel?.findingSuggestions) {
      await IXSuggestionsModel.updateMany(
        {
          extractorId: message.params!.id,
          status: 'processing',
        },
        {
          $set: {
            status: 'failed',
            error: errorMessage,
            'state.processing': false,
            'state.error': true,
            'state.match': null,
            'state.withSuggestion': false,
            'state.hasContext': false,
          },
        }
      );
    }

    emitToTenant(
      message.tenant,
      'ix_model_status',
      message.params!.id.toString(),
      'error',
      errorMessage
    );
  }

  requestResults = async (message: InternalIXResultsMessage) =>
    retryWithBackoff(async () => {
      try {
        const response = await request.get(message.data_url);
        return JSON.parse(response.json);
      } catch (error) {
        throw descriptiveError(error);
      }
    });

  static sendXmlToService = async (
    serviceUrl: string,
    xmlName: string,
    extractorId: ObjectIdSchema,
    type: string
  ) =>
    retryWithBackoff(async () => {
      try {
        const fileContent = await storage.fileContents(xmlName, 'segmentation');
        const endpoint = type === 'labeled_data' ? 'xml_to_train' : 'xml_to_predict';
        const url = urljoin(serviceUrl, endpoint, tenants.current().name, extractorId.toString());
        return await request.uploadFile(url, xmlName, fileContent);
      } catch (error) {
        throw descriptiveError(error);
      }
    });

  // eslint-disable-next-line max-params
  extendMaterialsWithLabeledData = (
    propertyLabeledData: ExtractedMetadataSchema | undefined,
    propertyValue: FileWithAggregation['propertyValue'],
    propertyType: FileWithAggregation['propertyType'],
    file: FileWithAggregation,
    _data: CommonMaterialsData
  ): MaterialsData => {
    const languageIso =
      LanguageUtils.fromISO639_3(file.language!, false)?.ISO639_1 || defaultTrainingLanguage;

    let data: MaterialsData = { ..._data, language_iso: languageIso };

    const noExtractedData = propertyTypeIsWithoutExtractedMetadata(propertyType);

    if (!noExtractedData && propertyLabeledData) {
      data = {
        ...data,
        label_text: propertyValue || propertyLabeledData?.selection?.text,
        label_segments_boxes: propertyLabeledData.selection?.selectionRectangles?.map(r => {
          const { page, ...rectangle } = r;
          return { ...rectangle, page_number: page };
        }),
      };
    }

    if (noExtractedData) {
      if (!Array.isArray(propertyValue)) {
        throw new Error('Property value should be an array');
      }
      data = {
        ...data,
        values: propertyValue.map(({ value, label }) => ({ id: value, label })),
      };
    }

    return data;
  };

  // eslint-disable-next-line max-params
  sendMaterials = async (
    files: FileWithAggregation[],
    extractor: IXExtractorType,
    serviceUrl: string,
    targetProperty: PropertySchema,
    type = 'labeled_data'
  ) => {
    if (files.length === 0) {
      throw new Error('No files with segmentations to be used for training');
    }

    await Promise.all(
      files.map(async file => {
        const xmlName = file.segmentation.xmlname!;
        const xmlExists = await storage.fileExists(xmlName, 'segmentation');

        const propertyLabeledData = file.extractedMetadata?.find(
          labeledData => labeledData.name === extractor.property
        );
        const { propertyValue, propertyType } = file;

        const missingData = propertyTypeIsWithoutExtractedMetadata(propertyType)
          ? !propertyValue
          : type === 'labeled_data' && !propertyLabeledData;

        if (!xmlExists || missingData) return;

        await InformationExtraction.sendXmlToService(serviceUrl, xmlName, extractor._id, type);

        let data: MaterialsData = {
          xml_file_name: xmlName,
          id: extractor._id.toString(),
          tenant: tenants.current().name,
          xml_segments_boxes: file.segmentation.segmentation?.paragraphs,
          page_width: file.segmentation.segmentation?.page_width,
          page_height: file.segmentation.segmentation?.page_height,
        };

        if (type === 'labeled_data' && !missingData) {
          data = this.extendMaterialsWithLabeledData(
            propertyLabeledData,
            propertyValue,
            propertyType,
            file,
            data
          );
        }

        await request.post(urljoin(serviceUrl, type), data);
      })
    );

    if (type === 'prediction_data') {
      const suggestions = await IXSuggestionsModel.db
        .find({
          fileId: { $in: files.map(f => f._id) },
          extractorId: extractor._id,
        })
        .lean();

      await Suggestions.saveMultiple(
        suggestions.map(suggestion =>
          SuggestionFactory.markAsProcessing({ suggestion, targetProperty })
        )
      );
    }
  };

  sendMaterialsForPDF = async (
    files: FileWithAggregation[],
    extractor: IXExtractorType,
    targetProperty: PropertySchema
  ) => {
    const serviceUrl = await this.serviceUrl();
    await this.sendMaterials(files, extractor, serviceUrl, targetProperty, 'prediction_data');
  };

  // eslint-disable-next-line max-params
  async sendMaterialsForProperty(
    entitiesForTraining: EntitySchema[],
    extractor: IXExtractorType,
    serviceUrl: string,
    targetProperty: PropertySchema,
    type = 'labeled_data'
  ) {
    await ArrayUtils.sequentialFor(entitiesForTraining, async entity => {
      const extractionKey = ExtractionKey.create({
        entitySharedId: entity.sharedId!,
        language: entity.language as LanguageISO6391,
      });

      if (!extractor.source.property) {
        throw new Error('Extractor has not property configured');
      }

      const data: PropertySourceMaterials = {
        entity_name: extractionKey.key,
        language_iso: extractionKey.language,
        id: extractor._id.toString(),
        tenant: tenants.current().name,
        source_text: (entity.metadata?.[extractor.source.property]?.[0]?.value as string) || '',
      };

      if (extractor.source.property === 'title') {
        data.source_text = entity.title || '';
      }

      if (type === 'labeled_data') {
        if (['multiselect', 'relationship', 'select'].includes(targetProperty.type)) {
          const values = entity?.metadata?.[extractor.property]?.map(({ value, label }) => ({
            id: String(value),
            label,
          }));

          const hasValue = !!values?.filter(v => !!v.id)?.length;
          if (!values || !hasValue) {
            return;
          }

          data.values = values as { id: string; label: string }[];
        } else {
          let labelText = entity.metadata?.[extractor.property]?.[0]?.value;

          if (targetProperty.type === 'date') {
            labelText = moment(Number(labelText) * 1000)
              .utc()
              .format('YYYY-MM-DD');
          }

          if (extractor.property === 'title') {
            labelText = entity.title;
          }

          if (typeof labelText === 'undefined') {
            return;
          }

          data.label_text = String(labelText);
        }
      }

      await request.post(urljoin(serviceUrl, type), data);
    });

    if (type === 'prediction_data') {
      const suggestions = await IXSuggestionsModel.db
        .find({
          extractorId: extractor._id,
          $or: entitiesForTraining.map(e => ({
            entityId: e.sharedId,
            language: e.language,
          })),
        })
        .lean();

      await Suggestions.saveMultiple(
        suggestions.map(suggestion =>
          SuggestionFactory.markAsProcessing({ suggestion, targetProperty })
        )
      );
    }
  }

  _getEntityFromFile = async (file: EnforcedWithId<FileType> | FileWithAggregation) => {
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

  _getEntityFromSuggestion = async (rawSuggestion: RawSuggestion): Promise<null | EntitySchema> => {
    const [segmentation] = await SegmentationModel.get({
      xmlname: rawSuggestion.xml_file_name,
    });

    if (!segmentation) {
      return null;
    }
    const [file] = await filesModel.get({ _id: segmentation.fileID });

    if (!file) {
      return null;
    }

    return this._getEntityFromFile(file);
  };

  async appendSuggestionModelData(
    extractor: EnforcedWithId<IXExtractorType>,
    currentSuggestion: EnforcedWithId<IXSuggestionType>
  ) {
    const [model] = await ixmodels.get({ extractorId: extractor._id });

    if (model.findSuggestionsRunTimestamp) {
      return {
        ...currentSuggestion,
        modelData: {
          ...(currentSuggestion.modelData || {}),
          findSuggestionsRunTimestamp: model.findSuggestionsRunTimestamp,
        },
      };
    }

    return currentSuggestion;
  }

  async saveSuggestionsForTextSource(
    extractor: EnforcedWithId<IXExtractorType>,
    rawSuggestions: RawSuggestion[],
    message: InternalIXResultsMessage
  ) {
    const targetProperty = await IXServices.getTargetProperty({ extractor });

    await ArrayUtils.sequentialFor(rawSuggestions, async rawSuggestion => {
      if (!rawSuggestion.entity_name) {
        return;
      }

      const extractionKey = new ExtractionKey(rawSuggestion.entity_name);

      const [originalSuggestion] = await IXSuggestionsModel.get({
        entityId: extractionKey.entitySharedId,
        extractorId: extractor._id,
        language: extractionKey.language,
      });

      const currentSuggestion = await this.appendSuggestionModelData(extractor, originalSuggestion);

      const suggestion = formatSuggestionFacade.formatSuggestionTextSource(
        targetProperty,
        rawSuggestion,
        currentSuggestion,
        message
      );

      await Suggestions.save(SuggestionFactory.markAsReady({ suggestion, targetProperty }));
    });
  }

  async saveSuggestionsForPdfSource(
    extractor: EnforcedWithId<IXExtractorType>,
    rawSuggestions: RawSuggestion[],
    message: InternalIXResultsMessage
  ) {
    const targetProperty = await IXServices.getTargetProperty({ extractor });

    return Promise.all(
      rawSuggestions.map(async rawSuggestion => {
        const entity = await this._getEntityFromSuggestion(rawSuggestion);
        if (!entity) {
          return Promise.resolve();
        }

        const [segmentation] = await SegmentationModel.get({
          xmlname: rawSuggestion.xml_file_name,
        });

        if (!segmentation) {
          return Promise.resolve();
        }

        const [originalSuggestion] = await IXSuggestionsModel.get({
          entityId: entity.sharedId,
          extractorId: extractor._id,
          fileId: segmentation.fileID,
        });

        const currentSuggestion = await this.appendSuggestionModelData(
          extractor,
          originalSuggestion
        );

        const suggestion = formatSuggestionFacade.formatSuggestionPdfSource(
          targetProperty,
          rawSuggestion,
          currentSuggestion,
          entity,
          message
        );

        return Suggestions.save(SuggestionFactory.markAsReady({ suggestion, targetProperty }));
      })
    );
  }

  saveSuggestionsManager = async (message: InternalIXResultsMessage) => {
    const [extractor, rawSuggestions] = await Promise.all([
      Extractors.getById({ _id: message.params?.id }),
      this.requestResults(message),
    ]);

    if (extractor?.source.pdf) {
      return this.saveSuggestionsForPdfSource(extractor, rawSuggestions, message);
    }

    if (extractor?.source.property) {
      return this.saveSuggestionsForTextSource(extractor, rawSuggestions, message);
    }

    return Promise.resolve();
  };

  serviceUrl = async () => {
    const settingsValues = await settings.get();
    const serviceUrl = settingsValues.features?.metadataExtraction?.url;
    if (!serviceUrl) {
      throw new Error('No url for metadata extraction service');
    }

    return serviceUrl;
  };

  getSuggestionsStatus = async (extractorId: ObjectIdSchema, model: IXModelType) => {
    const processedSuggestions = await IXSuggestionsModel.count({
      extractorId,
      date: { $gt: model.creationDate },
    });
    return {
      total: model.totalSuggestionsToFind,
      processed: processedSuggestions,
    };
  };

  updateSuggestionStatus = async (message: InternalIXResultsMessage, currentModel: IXModelType) => {
    const suggestionsStatus = await this.getSuggestionsStatus(message.params!.id, currentModel);
    emitToTenant(
      message.tenant,
      'ix_model_status',
      message.params!.id.toString(),
      'processing_suggestions',
      '',
      suggestionsStatus
    );
  };

  determineBatchSize = async (
    extractorId: ObjectIdSchema,
    model: IXModelType,
    source: 'pdf' | 'property',
    computedBatch: boolean
  ) => {
    const MAX_BATCH_SIZE = source === 'pdf' ? BATCH_SIZE_FOR_PDF : BATCH_SIZE_FOR_PROPERTY;
    if (!computedBatch) {
      return MAX_BATCH_SIZE;
    }

    const suggestionsStatus = await this.getSuggestionsStatus(extractorId, model);
    const remaining = (model.totalSuggestionsToFind || 0) - suggestionsStatus.processed;
    const batchSize = model.testRun ? Math.min(remaining, MAX_BATCH_SIZE) : undefined;
    return batchSize;
  };

  stopModelAndEmitReadyMessage = async (extractorId: ObjectIdSchema, message: string) => {
    await this.stopModel(extractorId);
    emitToTenant(tenants.current().name, 'ix_model_status', extractorId, 'ready', message);
  };

  getAndSendMaterialsForPDF = async ({
    extractor,
    model,
    targetProperty,
    computedBatch,
  }: {
    extractor: EnforcedWithId<IXExtractorType>;
    model: IXModelType;
    targetProperty: PropertySchema;
    computedBatch: boolean;
  }) => {
    const extractorId = extractor._id;
    const batchSize = await this.determineBatchSize(extractorId, model, 'pdf', computedBatch);
    const filesForSuggestions = await getFilesForSuggestions(extractorId, batchSize);

    if (!filesForSuggestions.length) {
      await this.stopModelAndEmitReadyMessage(extractorId, 'Completed');
      return [];
    }

    try {
      await this.sendMaterialsForPDF(filesForSuggestions, extractor, targetProperty);
    } catch (error) {
      if (error.message === 'No files with segmentations to be used for training') {
        await this.stopModelAndEmitReadyMessage(
          extractorId,
          'No files with segmentations to be used for training'
        );
        return [];
      }
      throw error;
    }
    return filesForSuggestions;
  };

  getAndSendMaterialsForProperty = async ({
    extractor,
    model,
    targetProperty,
    computedBatch,
  }: {
    extractor: EnforcedWithId<IXExtractorType>;
    model: IXModelType;
    targetProperty: PropertySchema;
    computedBatch: boolean;
  }) => {
    const extractorId = extractor._id;
    const batchSize = await this.determineBatchSize(extractorId, model, 'property', computedBatch);
    const entitiesForSuggestions = await getEntitiesForSuggestions(extractorId, batchSize);

    if (!entitiesForSuggestions.length) {
      await this.stopModelAndEmitReadyMessage(extractorId, 'Completed');
      return [];
    }

    await this.sendMaterialsForProperty(
      entitiesForSuggestions,
      extractor,
      await this.serviceUrl(),
      targetProperty,
      'prediction_data'
    );

    return entitiesForSuggestions;
  };

  startSuggestionsTask = async (extractor: EnforcedWithId<IXExtractorType>) => {
    await this.taskManager.startTask({
      task: 'suggestions',
      tenant: tenants.current().name,
      params: {
        id: extractor._id.toString(),
        metadata: {
          extractor_name: extractor.name || '',
          property: extractor.property || '',
          templates: Array.isArray(extractor.templates) ? extractor.templates.join(',') : '',
        },
      },
    });
  };

  sendMaterialsAndTaskSuggestions = async (
    extractor: EnforcedWithId<IXExtractorType>,
    model: IXModelType,
    computedBatch: boolean = true
  ) => {
    const targetProperty = await IXServices.getTargetProperty({ extractor });
    const processingParams = { extractor, model, targetProperty, computedBatch };

    if (extractor.source.pdf) {
      const filesForSuggestions = await this.getAndSendMaterialsForPDF(processingParams);
      if (!filesForSuggestions.length) return;
    }

    if (extractor.source.property) {
      const entitiesForSuggestions = await this.getAndSendMaterialsForProperty(processingParams);
      if (!entitiesForSuggestions.length) return;
    }

    await this.startSuggestionsTask(extractor);
  };

  getSuggestions = async (extractorId: ObjectIdSchema) => {
    const [extractor] = await Extractors.get({ _id: extractorId });
    if (!extractor) {
      return;
    }

    const [model] = await IXModelsModel.get({ extractorId });
    if (model.testRun) {
      const suggestionsStatus = await this.getSuggestionsStatus(extractorId, model);
      if (suggestionsStatus.processed >= (model.totalSuggestionsToFind || 0)) {
        await this.stopModelAndEmitReadyMessage(extractorId, 'Test completed');
      }
    }

    await this.sendMaterialsAndTaskSuggestions(extractor, model);
  };

  trainModel = async (extractorId: ObjectIdSchema, testRun: boolean = false) => {
    const tenant = tenants.current();
    await ixmodels.startTraining(extractorId, { testRun });

    const dispatcher = await DefaultDispatcher(tenant.name, { lockWindow: 1000 * 60 * 20 });

    await dispatcher.dispatch(IXTrainModelJob, { extractorId: extractorId.toString() });

    return { status: 'processing_model', message: 'Training model' };
  };

  testModel = async (extractorId: ObjectIdSchema) => this.trainModel(extractorId, true);

  status = async (extractorId: ObjectIdSchema) => {
    const [currentModel] = await ixmodels.get({ extractorId });

    if (!currentModel) {
      return { status: 'ready', message: 'Ready' };
    }

    if (currentModel.status === ModelStatus.processing && currentModel.findingSuggestions) {
      return { status: 'processing_model', message: 'Training model' };
    }

    if (currentModel.status === ModelStatus.processing && !currentModel.findingSuggestions) {
      return { status: 'cancel', message: 'Canceling...' };
    }

    if (currentModel.status === ModelStatus.failed) {
      return { status: 'failed', message: 'Failed' };
    }

    if (currentModel.status === ModelStatus.ready && currentModel.findingSuggestions) {
      const suggestionStatus = await this.getSuggestionsStatus(extractorId, currentModel);

      if (suggestionStatus.processed === suggestionStatus.total) {
        return { status: 'ready', message: 'Ready' };
      }

      return {
        status: 'processing_suggestions',
        message: 'Finding suggestions',
        data: suggestionStatus,
      };
    }

    return { status: 'ready', message: 'Ready' };
  };

  stopModel = async (extractorId: ObjectIdSchema) => {
    const res = await IXModelsModel.db.findOneAndUpdate(
      { extractorId },
      { $set: { findingSuggestions: false, status: ModelStatus.ready } },
      {}
    );

    // TEST!!!
    await ixmodels.unsetFindSuggestionsData(extractorId);

    if (res) {
      return { status: 'ready', message: 'Ready' };
    }

    return { status: 'error', message: 'No model found' };
  };

  processResults = async (_message: IXResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      const message: InternalIXResultsMessage = {
        ..._message,
        params: { ..._message.params, id: new ObjectId(_message.params!.id) },
      };

      const [currentModel] = await IXModelsModel.get({
        extractorId: message.params!.id,
      });

      try {
        if (message.task === 'create_model' && message.success) {
          await IXServices.saveModelProcess(message.params!.id, ModelStatus.ready, {
            computeTotalSuggestions: true,
          });

          const [updatedModel] = await IXModelsModel.get({
            extractorId: message.params!.id,
          });

          await this.updateSuggestionStatus(message, updatedModel);
        }

        if (!message.success) {
          await this.handleFailedStatus(message, currentModel);
          return;
        }

        if (message.task === 'suggestions') {
          await this.saveSuggestionsManager(message);
          await this.updateSuggestionStatus(message, currentModel);
        }

        if (!currentModel.findingSuggestions) {
          emitToTenant(message.tenant, 'ix_model_status', _message.params!.id, 'ready', 'Canceled');
          return;
        }
      } catch (error) {
        await this.handleFailedStatus(message, currentModel);
      }

      await this.getSuggestions(message.params!.id);
    }, _message.tenant);
  };
}

export { InformationExtraction, defaultTrainingLanguage };
export type {
  IXResultsMessage,
  InternalIXResultsMessage,
  CommonSuggestion,
  TextSelectionSuggestion,
  ValuesSelectionSuggestion,
  RawSuggestion,
  MaterialsData,
  CommonMaterialsData,
  IXTaskManager,
  TaskParameters,
  PropertySourceMaterials,
};
