import urljoin from 'url-join';

import { uploadsPath, readFile } from 'api/files';
import settings from 'api/settings/settings';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants/tenantContext';
import { createError, handleError } from 'api/utils';
import request from 'shared/JSONRequest';
import { FileType } from "shared/types/fileType";
import { OcrModel, OcrStatus } from "./ocrModel";

export class OcrManager {
  public readonly SERVICE_NAME = 'ocr';

  private ocrTaskManager: TaskManager;

  constructor() {
    this.ocrTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  async addToQueue(file: FileType) {
    const fileContent = await readFile(uploadsPath(file.filename));

    const settingsValues = await settings.get();
    const ocrServiceConfig = settingsValues?.features?.ocr;
    
    if (!ocrServiceConfig) {
      throw Error('Ocr settings are missing from the database (settings.features.ocr).')
    }
    const tenant = tenants.current()
    await request.uploadFile(urljoin(ocrServiceConfig!.url, 'upload', tenant.name), file.filename, fileContent);

    await this.ocrTaskManager.startTask({
      task: this.SERVICE_NAME,
      tenant: tenant.name,
      params: {
        filename: file.filename,
      },
    });

    await OcrModel.save({
      file: file._id,
      language: file.language,
      status: OcrStatus.PROCESSING
    });    
  }

  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({ file: file._id });
    return record ? record.status : OcrStatus.NONE;
  }

  private async processResults(message: ResultsMessage): Promise<void> {

    await tenants.run(async () => {
      try {
        if (!message.success) {
          //update record with error   
          return;
        }        
        const fileStream = (await fetch(message.file_url!)).body;
        if (!fileStream) {
          throw new Error(
            `Error requesting for segmentation file: ${message.params!.filename}, tenant: ${
              message.tenant
            }`
          );
        }
        
        //store file
        
        //perform file step (change or not?)
        
        //perform usual steps on new file
        
        //update record with success, (make it permanent?)

        return;
        
      } catch (error) {
        handleError(error);
      }
    }, message.tenant);
  };
}

const OcrManagerInstance = new OcrManager();

export default OcrManagerInstance;
