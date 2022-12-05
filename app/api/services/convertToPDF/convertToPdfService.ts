import { storage } from 'api/files';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import { FileType } from 'shared/types/fileType';

export const convertToPDFService = {
  async upload(file: FileType) {
    if (!file.filename || !file.type) {
      throw Error('Filename or type are missing');
    }

    const { features } = await settings.get();
    if (!features?.convertToPdf) {
      throw Error('Convert to Pdf config does not exists');
    }

    const body = new URLSearchParams();
    body.append('file', (await storage.fileContents(file.filename, file.type)).toString());
    await fetch(new URL('/upload/' + tenants.current().name, features.convertToPdf.url).href, {
      method: 'POST',
      body,
    });
  },
};
