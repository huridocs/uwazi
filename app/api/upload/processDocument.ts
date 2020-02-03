/** @format */

import { File } from 'api/utils/files';

import uploads from './uploads';
import PDF from './PDF';

export const processDocument = async (entitySharedId: string, file: File) => {
  const pdf = new PDF(file);
  const upload = await uploads.save({
    entity: entitySharedId,
    processed: false,
    //mongo default ?
    creationDate: Date.now(),
  });

  const conversion = await pdf.convert();

  await pdf.createThumbnail(upload._id.toString());

  return uploads.save({
    ...upload,
    ...conversion,
  });
};
