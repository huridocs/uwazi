import { storage } from 'api/files';
import { tenants } from 'api/tenants';
import { FileType } from 'shared/types/fileType';

export class MimeTypeNotSupportedForConversion extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MimeTypeNotSupportedForConversion';
  }
}

export const convertToPDFService = {
  async upload(file: FileType, serviceUrl: string) {
    if (!file.filename || !file.type) {
      throw Error('Filename or type are missing');
    }

    const body = new URLSearchParams();
    body.append('file', (await storage.fileContents(file.filename, file.type)).toString());
    const response = await fetch(new URL(`/upload/${tenants.current().name}`, serviceUrl).href, {
      method: 'POST',
      body,
    });

    if (response.status === 422) {
      throw new MimeTypeNotSupportedForConversion('mymetype not allowed');
    }
  },
};
