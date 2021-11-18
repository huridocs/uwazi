import urljoin from 'url-join';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath, readFile } from 'api/files';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { ObjectId } from 'mongodb';
import request from 'shared/JSONRequest';
import { handleError } from 'api/utils';
import { FileType } from 'shared/types/fileType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import filesModel from 'api/files/filesModel';
import { IXSuggestionsModel } from '../../suggestions/IXSuggestionsModel';

class InformationExtraction {
  SERVICE_NAME = 'informationextraction';

  public segmentationTaskManager: TaskManager;

  templatesWithInformationExtraction: string[] | undefined;

  features: Settings | undefined;

  batchSize = 10;

  constructor() {
    this.segmentationTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  requestResults = async (message: ResultsMessage) => {
    const response = await request.get(message.data_url);

    return { data: JSON.parse(response.json) };
  };

  static sendMaterialsToTrainModel = async (
    files: FileType[],
    property: string,
    serviceUrl: string
  ) => {
    const fileContent = await readFile(uploadsPath(files[0].filename));
    const currentTenant = tenants.current();

    await request.uploadFile(
      urljoin(serviceUrl, 'xml_file', currentTenant.name, property),
      files[0].filename,
      fileContent
    );
    // eslint-disable-next-line camelcase
    // const labeledData = {
    //   xml_file_name: 'xml_file_name.xml',
    //   property_name: propertyName,
    //   tenant: 'tenant_name',
    //   language_iso: 'en',
    //   label_text: 'text',
    //   page_width: 612,
    //   page_height: 792,
    //   xml_segments_boxes: [{ left: 124, top: 48, width: 83, height: 13, page_number: 1 }],
    //   label_segments_boxes: [{ left: 124, top: 48, width: 83, height: 13, page_number: 1 }],
    // };

    // await request.post(urljoin(serviceUrl, tenant), labeledData);
  };

  saveSuggestions = async (data: any) => {
    // eslint-disable-next-line camelcase
  };

  getFilesToTrain = async (
    template: string
  ): Promise<FileType & { filename: string; _id: ObjectIdSchema }[]> =>
    filesModel.db.aggregate([
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
          foreignField: 'file',
          as: 'segmentation',
        },
      },
      {
        $match: {
          'entity.template': new ObjectId(template),
          extractedMetadata: { $exists: true, $ne: [] },
        },
      },
      {
        $limit: this.batchSize,
      },
    ]);

  trainModel = async (template: string, property: string) => {
    const settingsValues = await settings.get();
    const files = await this.getFilesToTrain(template);
    await InformationExtraction.sendMaterialsToTrainModel(
      files,
      property,
      settingsValues.features?.metadataExtraction?.url
    );
  };

  processResults = async (message: ResultsMessage): Promise<void> => {};
}

export { InformationExtraction };
