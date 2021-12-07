import { FileType } from "shared/types/fileType";
import { OcrModel, OcrStatus } from "./ocrModel";

export class OcrManager {
  async addToQueue(file: FileType) {
    await OcrModel.save({
      file: file._id,
      language: file.language,
      status: OcrStatus.PROCESSING
    });
  }

  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({ file: file._id });
    if (!record) {
      return OcrStatus.NONE;
    }
    return record.status;
  }
}

let ocrManagerInstance: OcrManager;

export function getInstance() {
  if (!ocrManagerInstance){
    ocrManagerInstance = new OcrManager();
  }

  return ocrManagerInstance;
}