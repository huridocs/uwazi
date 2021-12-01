/* eslint-disable max-lines */
/* eslint-disable camelcase */
import urljoin from 'url-join';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath, readFile, fileExists } from 'api/files';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { ObjectId } from 'mongodb';
import request from 'shared/JSONRequest';
import path from 'path';
import { handleError } from 'api/utils';
import { FileType } from 'shared/types/fileType';
import { ObjectIdSchema } from 'shared/types/commonTypes';

import filesModel from 'api/files/filesModel';
import { SegmentationType } from 'shared/types/segmentationType';
import { Settings } from 'shared/types/settingsType';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';

import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { PDFSegmentation } from 'api/services//pdfsegmentation/PDFSegmentation';
import entities from 'api/entities/entities';
import { EntitySchema } from 'shared/types/entityType';
import languages from 'shared/languages';
import {emitToTenant} from 'api/socketio/setupSockets';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { IXModelsModel } from './IXModelsModel';

interface FileWithAggregation extends FileType {
  filename: string;
  _id: ObjectId;
  segmentation: SegmentationType[];
  entityData: EntitySchema[];
}
type RawSuggestion = {
  tenant: string;
  property_name: string;
  xml_file_name: string;
  text: string;
  segment_text: string;
};

class InformationExtraction {
  static SERVICE_NAME = 'information_extraction';

  public taskManager: TaskManager;

  batchSize = 50;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: InformationExtraction.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  requestResults = async (message: ResultsMessage) => {
    const response = await request.get(message.data_url);

    return JSON.parse(response.json);
  };

  static sendXmlToService = async (
    serviceUrl: string,
    xmlName: string,
    property: string,
    type: string
  ) => {
    const fileContent = await readFile(
      uploadsPath(path.join(PDFSegmentation.SERVICE_NAME, xmlName))
    );
    const endpoint = type === 'labeled_data' ? 'xml_to_train' : 'xml_to_predict';
    const url = urljoin(serviceUrl, endpoint, tenants.current().name, property);
    return request.uploadFile(url, xmlName, fileContent);
  };

  sendMaterials = async (
    files: FileWithAggregation[],
    property: string,
    serviceUrl: string,
    type = 'labeled_data'
  ) => {
    await Promise.all(
      files.map(async file => {
        const xmlName = file.segmentation[0].xmlname!;
        const xmlExists = await fileExists(
          uploadsPath(path.join(PDFSegmentation.SERVICE_NAME, xmlName))
        );

        const propertyLabeledData = file.extractedMetadata?.find(
          labeledData => labeledData.name === property
        );

        if (!xmlExists || (type === 'labeled_data' && !propertyLabeledData)) {
          return;
        }

        await InformationExtraction.sendXmlToService(serviceUrl, xmlName, property, type);

        //eslint-disable-next-line camelcase
        let data: any = {
          xml_file_name: xmlName,
          property_name: property,
          tenant: tenants.current().name,
          xml_segments_boxes: file.segmentation[0].segmentation?.paragraphs,
          page_width: file.segmentation[0].segmentation?.page_width,
          page_height: file.segmentation[0].segmentation?.page_height,
        };

        if (type === 'labeled_data' && propertyLabeledData) {
          data = {
            ...data,
            language_iso: languages.get(file.language!, 'ISO639_1'),
            label_text: propertyLabeledData.selection?.text,
            label_segments_boxes: propertyLabeledData.selection?.selectionRectangles?.map(r => {
              const { page, ...selection } = r;
              return { ...selection, page_number: page };
            }),
          };
        }
        await request.post(urljoin(serviceUrl, type), data);
        if (type === 'prediction_data') {
          await this.saveSuggestionProcess(file, property);
        }
      })
    );
  };

  _getEntityFromSuggestion = async (rawSuggestion: RawSuggestion): Promise<void | EntitySchema> => {
    const [segmentation] = await SegmentationModel.get({
      xmlname: rawSuggestion.xml_file_name,
    });
    if (!segmentation) {
      return;
    }
    const [file] = await filesModel.get({ _id: segmentation.fileID });
    if (!file) {
      return;
    }
    const [entity] = await entities.getUnrestricted({
      sharedId: file.entity,
      language: languages.get(file.language!, 'ISO639_1'),
    });

    return entity;
  };

  saveSuggestions = async (message: ResultsMessage) => {
    const rawSuggestions: RawSuggestion[] = await this.requestResults(message);
    return Promise.all(
      rawSuggestions.map(async rawSuggestion => {
        const entity = await this._getEntityFromSuggestion(rawSuggestion);
        if (!entity) {
          return;
        }

        const [currentSuggestion] = await IXSuggestionsModel.get({
          entityId: entity.sharedId,
          propertyName: rawSuggestion.property_name,
        });

        const suggestion: IXSuggestionType = {
          ...currentSuggestion,
          entityId: entity.sharedId!,
          language: entity.language!,
          propertyName: rawSuggestion.property_name,
          suggestedValue: rawSuggestion.text,
          segment: rawSuggestion.segment_text,
          status: 'ready',
          date: new Date().getTime(),
        };
        return IXSuggestionsModel.save(suggestion);
      })
    );
  };

  saveSuggestionProcess = async (file: FileWithAggregation, propertyName: string) => {
    const [entity] = await entities.getUnrestricted({
      sharedId: file.entityData[0].sharedId,
      language: languages.get(file.language!, 'ISO639_1'),
    });

    const [existingSuggestions] = await IXSuggestionsModel.get({
      entityId: entity.sharedId,
      propertyName,
      language: entity.language,
    });
    const suggestion: IXSuggestionType = {
      ...existingSuggestions,
      entityId: entity.sharedId!,
      language: entity.language!,
      propertyName,
      status: 'processing',
      date: new Date().getTime(),
    };

    return IXSuggestionsModel.save(suggestion);
  };

  getSuggestions = async (property: string) => {
    const settingsValues = await settings.get();
    const serviceUrl = settingsValues.features?.metadataExtraction?.url;
    if (!serviceUrl) {
      handleError(new Error('No url for metadata extraction service'));
      return;
    }
    const modelsToTrain = await this.getPropertiesToTrain(settingsValues);
    const files = await this.getFiles(modelsToTrain[property], property, false);

    await this.sendMaterials(files, property, serviceUrl, 'prediction_data');
    await this.taskManager.startTask({
      task: 'suggestions',
      tenant: tenants.current().name,
      params: { property_name: property },
    });
  };

  getFiles = async (
    templates: ObjectIdSchema[],
    property: string,
    toTrain: boolean = true
  ): Promise<FileWithAggregation[]> => {
    let agg: any = [
      {
        $match: {
          type: 'document',
          filename: { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'entity',
          foreignField: 'sharedId',
          as: 'entityData',
        },
      },
      {
        $lookup: {
          from: 'segmentations',
          localField: '_id',
          foreignField: 'fileID',
          as: 'segmentation',
        },
      },
      {
        $match: {
          'entityData.template': { $in: templates },
          segmentation: { $ne: [] },
        },
      },
    ];

    if (toTrain) {
      agg.push({
        $match: {
          'extractedMetadata.name': property,
        },
      });
    }

    if (!toTrain) {
      const [currentModel] = await IXModelsModel.get({ propertyName: property });
      agg = agg.concat([
        {
          $lookup: {
            from: 'ixsuggestions',
            localField: 'entity',
            foreignField: 'entityId',
            as: 'suggestions',
          },
        },
        {
          $match: {
            $or: [
              {
                suggestions: {
                  $size: 0,
                },
              },
              { 'suggestions.date': { $lte: currentModel.creationDate } },
            ],
          },
        },
        {
          $limit: this.batchSize,
        },
      ]);
    }
    return filesModel.db.aggregate(agg);
  };

  trainModel = async (templates: ObjectIdSchema[], property: string, serviceUrl: string) => {
    const files = await this.getFiles(templates, property);
    await this.sendMaterials(files, property, serviceUrl);
    await this.taskManager.startTask({
      task: 'create_model',
      tenant: tenants.current().name,
      params: { property_name: property },
    });
    const [currentModel] = await IXModelsModel.get({
      propertyName: property,
    });

    await IXModelsModel.save({
      ...currentModel,
      status: 'processing',
      creationDate: new Date().getTime(),
      propertyName: property,
    });
  };

  getPropertiesToTrain = async (settingsValues: Settings) => {
    const modelsToTrain = settingsValues.features?.metadataExtraction?.templates?.reduce(
      (result: { [key: string]: ObjectIdSchema[] }, template) => {
        template.properties.forEach(property => {
          if (!result[property]) {
            result[property] = [];
          }
          result[property].push(new ObjectId(template.template));
        });

        return result;
      },
      {}
    );

    return modelsToTrain || {};
  };

  trainAllModels = async () => {
    const settingsValues = await settings.get();
    const serviceUrl = settingsValues.features?.metadataExtraction?.url;
    if (!serviceUrl) {
      handleError(new Error('No url for metadata extraction service'));
      return;
    }

    const modelsToTrain = await this.getPropertiesToTrain(settingsValues);

    await Promise.all(
      Object.keys(modelsToTrain).map(async property => {
        await this.trainModel(modelsToTrain[property], property, serviceUrl);
      })
    );
  };

  processResults = async (message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      if (message.task === 'create_model') {
        const [currentModel] = await IXModelsModel.get({
          propertyName: message.params!.property_name,
        });

        await IXModelsModel.save({
          ...currentModel,
          status: 'ready',
          creationDate: new Date().getTime(),
        });
        emitToTenant(message.tenant, 'ix_model_ready', message.params!.property_name);
        await this.getSuggestions(message.params!.property_name);
      }

      if (message.task === 'suggestions') {
        await this.saveSuggestions(message);
        await this.getSuggestions(message.params!.property_name);
      }
    }, message.tenant);
  };
}

export { InformationExtraction };
