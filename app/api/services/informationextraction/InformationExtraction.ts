// Kevin------------------------------------------------------------------
/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable camelcase */
import path from 'path';
import urljoin from 'url-join';
import _ from 'lodash';
import { ObjectId } from 'mongodb';

import { storage } from 'api/files';
import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { PDFSegmentation } from 'api/services//pdfsegmentation/PDFSegmentation';
import { EnforcedWithId } from 'api/odm';
import { tenants } from 'api/tenants/tenantContext';
import { emitToTenant } from 'api/socketio/setupSockets';
import { filesModel } from 'api/files/filesModel';
import entities from 'api/entities/entities';
import settings from 'api/settings/settings';
import templatesModel from 'api/templates/templates';
import request from 'shared/JSONRequest';
import languages from 'shared/languages';
import { EntitySchema } from 'shared/types/entityType';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { FileType } from 'shared/types/fileType';
import {
  FileWithAggregation,
  getFilesForTraining,
  getFilesForSuggestions,
} from 'api/services/informationextraction/getFiles';
import { Suggestions } from 'api/suggestions/suggestions';
import { IXExtractorType } from 'shared/types/extractorType';
import { IXModelType } from 'shared/types/IXModelType';
import { stringToTypeOfProperty } from 'shared/stringToTypeOfProperty';
import ixmodels from './ixmodels';
import { IXModelsModel } from './IXModelsModel';
import { Extractors } from './ixextractors';

type RawSuggestion = {
  tenant: string;
  id: string;
  xml_file_name: string;
  text: string;
  segment_text: string;
  segments_boxes: {
    top: number;
    left: number;
    width: number;
    height: number;
    page_number: number;
  }[];
};

class InformationExtraction {
  static SERVICE_NAME = 'information_extraction';

  public taskManager: TaskManager;

  static mock: any;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: InformationExtraction.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  start() {
    this.taskManager.subscribeToResults();
  }

  requestResults = async (message: ResultsMessage) => {
    const response = await request.get(message.data_url);

    return JSON.parse(response.json);
  };

  static sendXmlToService = async (
    serviceUrl: string,
    xmlName: string,
    extractorId: ObjectIdSchema,
    type: string
  ) => {
    const fileContent = await storage.fileContents(xmlName,'segmentation');
    const endpoint = type === 'labeled_data' ? 'xml_to_train' : 'xml_to_predict';
    const url = urljoin(serviceUrl, endpoint, tenants.current().name, extractorId.toString());
    return request.uploadFile(url, xmlName, fileContent);
  };

  sendMaterials = async (
    files: FileWithAggregation[],
    extractor: IXExtractorType,
    serviceUrl: string,
    type = 'labeled_data'
  ) => {
    await Promise.all(
      files.map(async file => {
        const xmlName = file.segmentation.xmlname!;
        const xmlExists = await storage.fileExists(
          path.join(PDFSegmentation.SERVICE_NAME, xmlName),
          'document'
        );

        const propertyLabeledData = file.extractedMetadata?.find(
          labeledData => labeledData.name === extractor.property
        );

        if (!xmlExists || (type === 'labeled_data' && !propertyLabeledData)) {
          return;
        }

        await InformationExtraction.sendXmlToService(serviceUrl, xmlName, extractor._id, type);

        let data: any = {
          xml_file_name: xmlName,
          id: extractor._id.toString(),
          tenant: tenants.current().name,
          xml_segments_boxes: file.segmentation.segmentation?.paragraphs,
          page_width: file.segmentation.segmentation?.page_width,
          page_height: file.segmentation.segmentation?.page_height,
        };

        if (type === 'labeled_data' && propertyLabeledData) {
          const defaultTrainingLanguage = 'en';
          data = {
            ...data,
            language_iso: languages.get(file.language!, 'ISO639_1') || defaultTrainingLanguage,
            label_text: file.propertyValue || propertyLabeledData.selection?.text,
            label_segments_boxes: propertyLabeledData.selection?.selectionRectangles?.map(r => {
              const { page, ...selection } = r;
              return { ...selection, page_number: page };
            }),
          };
        }
        await request.post(urljoin(serviceUrl, type), data);
        if (type === 'prediction_data') {
          await this.saveSuggestionProcess(file, extractor);
        }
      })
    );
  };

  _getEntityFromFile = async (file: EnforcedWithId<FileType> | FileWithAggregation) => {
    let [entity] = await entities.getUnrestricted({
      sharedId: file.entity,
      language: languages.get(file.language!, 'ISO639_1'),
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

  saveSuggestions = async (message: ResultsMessage) => {
    const templates = await templatesModel.get();
    const rawSuggestions: RawSuggestion[] = await this.requestResults(message);
    const [extractor] = await Extractors.get({ _id: message.params?.id });

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

        const [currentSuggestion] = await IXSuggestionsModel.get({
          entityId: entity.sharedId,
          extractorId: extractor._id,
          fileId: segmentation.fileID,
        });

        let status: 'ready' | 'failed' = 'ready';
        let error = '';

        const allProps: PropertySchema[] = _.flatMap(
          templates,
          template => template.properties || []
        );
        const property = allProps.find(p => p.name === extractor.property);

        const suggestedValue = stringToTypeOfProperty(
          rawSuggestion.text,
          property?.type,
          currentSuggestion?.language || entity.language
        );

        if (suggestedValue === null) {
          status = 'failed';
          error = 'Invalid value for property type';
        }

        if (!message.success) {
          status = 'failed';
          error = message.error_message ? message.error_message : 'Unknown error';
        }

        const suggestion: IXSuggestionType = {
          ...currentSuggestion,
          suggestedValue,
          ...(property?.type === 'date' ? { suggestedText: rawSuggestion.text } : {}),
          segment: rawSuggestion.segment_text,
          status,
          error,
          date: new Date().getTime(),
          selectionRectangles: rawSuggestion.segments_boxes.map((box: any) => {
            const rect = { ...box, page: box.page_number.toString() };
            delete rect.page_number;
            return rect;
          }),
        };

        return Suggestions.save(suggestion);
      })
    );
  };

  saveSuggestionProcess = async (file: FileWithAggregation, extractor: IXExtractorType) => {
    const entity = await this._getEntityFromFile(file);
    const [existingSuggestions] = await IXSuggestionsModel.get({
      entityId: entity.sharedId,
      extractorId: extractor._id,
      fileId: file._id,
    });
    const suggestion: IXSuggestionType = {
      ...existingSuggestions,
      entityId: entity.sharedId!,
      fileId: file._id,
      language: languages.get(file.language, 'ISO639_1') || 'other',
      extractorId: extractor._id,
      propertyName: extractor.property,
      status: 'processing',
      date: new Date().getTime(),
    };

    return Suggestions.save(suggestion);
  };

  serviceUrl = async () => {
    const settingsValues = await settings.get();
    const serviceUrl = settingsValues.features?.metadataExtraction?.url;
    if (!serviceUrl) {
      throw new Error('No url for metadata extraction service');
    }

    return serviceUrl;
  };

  getSuggestions = async (extractorId: ObjectIdSchema) => {
    const files = await getFilesForSuggestions(extractorId);
    const [extractor] = await Extractors.get({ _id: extractorId });
    if (files.length === 0) {
      await this.stopModel(extractorId);
      emitToTenant(tenants.current().name, 'ix_model_status', extractorId, 'ready', 'Completed');
      return;
    }

    await this.materialsForSuggestions(files, extractor);
    await this.taskManager.startTask({
      task: 'suggestions',
      tenant: tenants.current().name,
      params: { id: extractorId.toString() },
    });
  };

  materialsForSuggestions = async (files: FileWithAggregation[], extractor: IXExtractorType) => {
    const serviceUrl = await this.serviceUrl();

    await this.sendMaterials(files, extractor, serviceUrl, 'prediction_data');
  };

  trainModel = async (extractorId: ObjectIdSchema) => {
    const [model] = await IXModelsModel.get({ extractorId });
    if (model && !model.findingSuggestions) {
      model.findingSuggestions = true;
      await IXModelsModel.save(model);
    }

    const [extractor] = await Extractors.get({ _id: extractorId });
    const serviceUrl = await this.serviceUrl();
    const materialsSent = await this.materialsForModel(extractor, serviceUrl);
    if (!materialsSent) {
      if (model) {
        model.findingSuggestions = false;
        await IXModelsModel.save(model);
      }
      return { status: 'error', message: 'No labeled data' };
    }

    await this.taskManager.startTask({
      task: 'create_model',
      tenant: tenants.current().name,
      params: { id: extractorId.toString() },
    });

    await this.saveModelProcess(extractorId);

    return { status: 'processing_model', message: 'Training model' };
  };

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

    if (currentModel.status === ModelStatus.ready && currentModel.findingSuggestions) {
      const suggestionStatus = await this.getSuggestionsStatus(
        extractorId,
        currentModel.creationDate
      );

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
      { $set: { findingSuggestions: false } },
      {}
    );
    if (res) {
      return { status: 'ready', message: 'Ready' };
    }

    return { status: 'error', message: '' };
  };

  materialsForModel = async (extractor: IXExtractorType, serviceUrl: string) => {
    const files = await getFilesForTraining(extractor.templates, extractor.property);
    if (!files.length) {
      return false;
    }
    await this.sendMaterials(files, extractor, serviceUrl);
    return true;
  };

  saveModelProcess = async (
    extractorId: ObjectIdSchema,
    status: ModelStatus = ModelStatus.processing,
    findingSuggestions = true
  ) => {
    const [currentModel] = await ixmodels.get({ extractorId });

    await ixmodels.save({
      ...currentModel,
      status,
      creationDate: new Date().getTime(),
      extractorId,
      findingSuggestions,
    });
  };

  processResults = async (_message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      const message = {
        ..._message,
        params: { ..._message.params, id: new ObjectId(_message.params!.id) },
      };
      const [currentModel] = await IXModelsModel.get({
        extractorId: message.params!.id,
      });

      if (message.task === 'create_model' && message.success) {
        await this.saveModelProcess(message.params!.id, ModelStatus.ready);
        await this.updateSuggestionStatus(message, currentModel);
      }

      if (message.task === 'suggestions') {
        await this.saveSuggestions(message);
        await this.updateSuggestionStatus(message, currentModel);
      }

      if (!currentModel.findingSuggestions) {
        emitToTenant(message.tenant, 'ix_model_status', _message.params!.id, 'ready', 'Canceled');
        return;
      }

      await this.getSuggestions(message.params!.id);
    }, _message.tenant);
  };

  getSuggestionsStatus = async (extractorId: ObjectIdSchema, modelCreationDate: number) => {
    const totalSuggestions = await IXSuggestionsModel.count({ extractorId });
    const processedSuggestions = await IXSuggestionsModel.count({
      extractorId,
      date: { $gt: modelCreationDate },
    });
    return {
      total: totalSuggestions,
      processed: processedSuggestions,
    };
  };

  updateSuggestionStatus = async (message: ResultsMessage, currentModel: IXModelType) => {
    const suggestionsStatus = await this.getSuggestionsStatus(
      message.params!.id,
      currentModel.creationDate
    );
    emitToTenant(
      message.tenant,
      'ix_model_status',
      message.params!.id.toString(),
      'processing_suggestions',
      '',
      suggestionsStatus
    );
  };
}

export { InformationExtraction };
