import urljoin from 'url-join';

import { uploadsPath, readFile } from 'api/files';
import settings from 'api/settings/settings';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants/tenantContext';
import { handleError } from 'api/utils';
import request from 'shared/JSONRequest';
import { FileType } from "shared/types/fileType";
import { OcrModel, OcrStatus } from "./ocrModel";

export class OcrManager {
  public readonly SERVICE_NAME = 'ocr_tasks';

  private ocrTaskManager: TaskManager;

  constructor() {
    this.ocrTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  async addToQueue(file: FileType, tenant: string) {
    try {
      const fileContent = await readFile(uploadsPath(file.filename));

      const settingsValues = await settings.get();
      const ocrServiceConfig = settingsValues?.features?.ocr;
      
      // if (!ocrServiceConfig) {
      //   // return OcrStatus.ERROR; -- how to handle missing config?
      //   return;
      // }

      await request.uploadFile(urljoin(ocrServiceConfig!.url, 'upload', tenant), file.filename, fileContent); // where to get the tenant from

      await this.ocrTaskManager.startTask({
        task: this.SERVICE_NAME,
        tenant,
        params: {
          filename: file.filename,
        },
      });

      await OcrModel.save({
        file: file._id,
        language: file.language,
        status: OcrStatus.PROCESSING
      });
      
    } catch (err) {
      // if (err.code === 'ENOENT') {
      //   await this.storeProcess(file._id, file.filename, false);
      //   handleError(err);
      //   return;
      // }
      throw err;
    }
  }

  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({ file: file._id });
    return record ? record.status : OcrStatus.NONE;
  }

  private async processResults(message: ResultsMessage): Promise<void> {
    await OcrModel.save({
      status: OcrStatus.READY
    });
    // await tenants.run(async () => {
    //   try {
    //     if (!message.success) {
    //       // await this.saveSegmentationError(message.params!.filename);
    //       // return;
    //     }

    //     // const { data, fileStream } = await this.requestResults(message);
    //     // await this.storeXML(message.params!.filename, fileStream);
    //     // await this.saveSegmentation(message.params!.filename, data);
    //   } catch (error) {
    //     handleError(error);
    //   }
    // }, message.tenant);
  };
}

const OcrManagerInstance = new OcrManager();

export default OcrManagerInstance;
