import { storage } from 'api/files';
import { tenants } from 'api/tenants';
import JSONRequest from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';

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

    try {
      await JSONRequest.uploadFile(
        new URL(`/upload/${tenants.current().name}`, serviceUrl).href,
        file.filename,
        await storage.fileContents(file.filename, file.type)
      );
    } catch (e) {
      if (e.response?.body?.detail?.code === 'FileNotSupported') {
        throw new MimeTypeNotSupportedForConversion('mymetype not allowed');
      }
      throw e;
    }
  },

  async download(url: URL) {
    return (await fetch(url)).body as unknown as Readable;
  },
};
