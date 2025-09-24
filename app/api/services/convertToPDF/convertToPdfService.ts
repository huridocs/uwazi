// @ts-expect-error TS(2307): Cannot find module '../files.js' or its correspond... Remove this comment to see the full error message
import { storage } from '../files.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import JSONRequest from 'shared/JSONRequest.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';
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
