/* eslint-disable camelcase */
import urljoin from 'url-join';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath, readFile, fileExists } from 'api/files';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { ObjectId } from 'mongodb';
import request from 'shared/JSONRequest';

import { handleError } from 'api/utils';
import { FileType } from 'shared/types/fileType';
import { ObjectIdSchema } from 'shared/types/commonTypes';

import filesModel from 'api/files/filesModel';
import { SegmentationType } from 'shared/types/segmentationType';
import { Settings } from 'shared/types/settingsType';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';

import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import entities from 'api/entities/entities';
import { EntitySchema } from 'shared/types/entityType';

interface FileWithNameAndId extends FileType {
  filename: string;
  _id: ObjectId;
  segmentation: SegmentationType[];
}
type RawSuggestion = {
  tenant: string;
  property_name: string;
  xml_file_name: string;
  text: string;
  segment_text: string;
};

class InformationExtraction {
  SERVICE_NAME = 'informationextraction';

  public taskManager: TaskManager;

  batchSize = 50;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  requestResults = async (message: ResultsMessage) => {
    const response = await request.get(message.data_url);

    return JSON.parse(response.json);
  };

  static sendXmlToService = async (url: string, xmlName: string) => {
    const fileContent = await readFile(uploadsPath(xmlName));
    return request.uploadFile(url, xmlName, fileContent);
  };

  static sendMaterials = async (
    files: FileWithNameAndId[],
    property: string,
    serviceUrl: string,
    type = 'labeled_data'
  ) => {
    await Promise.all(
      files.map(async file => {
        const xmlName = file.segmentation[0].xmlname!;
        const xmlExists = await fileExists(uploadsPath(xmlName));

        const propertyLabeledData = file.extractedMetadata?.find(
          labeledData => labeledData.name === property
        );
        if (!xmlExists || (type === 'labeled_data' && !propertyLabeledData)) {
          return;
        }
        await InformationExtraction.sendXmlToService(
          urljoin(serviceUrl, 'xml_file', tenants.current().name, property),
          xmlName
        );
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
            language_iso: file.language,
            label_text: propertyLabeledData.selection?.text,
            label_segments_boxes: propertyLabeledData.selection?.selectionRectangles?.map(r => {
              const { page, ...selection } = r;
              return { ...selection, page_number: page };
            }),
          };
        }
        await request.post(urljoin(serviceUrl, type), data);
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
      language: file.language,
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
        const property = entity.metadata![rawSuggestion.property_name];
        const currentValue = property && property[0] ? property[0].value : '';

        const suggestion = {
          entityId: entity.sharedId,
          entityTitle: entity.title,
          language: entity.language,
          propertyName: rawSuggestion.property_name,
          suggestedValue: rawSuggestion.text,
          segment: rawSuggestion.segment_text,
          currentValue,
        };

        return IXSuggestionsModel.save(suggestion);
      })
    );
  };

  getFiles = async (
    templates: ObjectIdSchema[],
    property: string,
    toTrain: boolean = true
  ): Promise<FileWithNameAndId[]> => {
    const agg: any = [
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
          as: 'entity',
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
          'entity.template': { $in: templates },
          segmentation: { $ne: [] }, //only files with segmentation done
        },
      },
    ];

    if (toTrain) {
      agg.push({
        $match: {
          'extractedMetadata.name': property, //when training the model only files with labeled data
        },
      });
    }

    if (!toTrain) {
      agg.concat([
        {
          $lookup: {
            from: 'suggestions',
            localField: 'entity.sharedId',
            foreignField: 'entity',
            as: 'suggestions',
          },
        },
        {
          $match: {
            suggestions: {
              $size: 0, //when asking for suggestions, only files that dont have suggestions already
            },
          },
        },
        {
          $limit: this.batchSize, //limit the number of files to be processed
        },
      ]);
    }
    return filesModel.db.aggregate(agg);
  };

  trainModel = async (templates: ObjectIdSchema[], property: string, serviceUrl: string) => {
    const files = await this.getFiles(templates, property);
    await InformationExtraction.sendMaterials(files, property, serviceUrl);
    await this.taskManager.startTask({
      task: 'create_model',
      tenant: tenants.current().name,
      params: { property_name: property },
    });
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
    await InformationExtraction.sendMaterials(files, property, serviceUrl, 'prediction_data');
    await this.taskManager.startTask({
      task: 'suggestions',
      tenant: tenants.current().name,
      params: { property_name: property },
    });
  };

  getPropertiesToTrain = async (settingsValues: Settings) => {
    const modelsToTrain = settingsValues.features?.metadataExtraction?.templates?.reduce(
      (result: { [key: string]: ObjectIdSchema[] }, template) => {
        template.properties.forEach(property => {
          if (!result[property]) {
            result[property] = [];
          }
          result[property].push(template.template);
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
