import { FileType } from 'shared/types/fileType';

import { files } from './files';
import { PDF } from './PDF';

export const processDocument = async (
  entitySharedId: string,
  file: FileType & { destination?: string },
  detectLanguage = true
) => {
  const pdf = new PDF(file);
  const upload = await files.save({
    ...file,
    entity: entitySharedId,
    type: 'document',
    status: 'processing',
  });

  try {
    const conversion = await pdf.convert();
    if (!detectLanguage) {
      conversion.language = file.language;
    }

    const thumbnail = await pdf.createThumbnail(upload._id.toString());

    await files.save({
      entity: entitySharedId,
      type: 'thumbnail',
      language: conversion.language,
      filename: thumbnail,
      mimetype: 'image/jpeg',
    });

    const saved = await files.save({
      ...upload,
      ...conversion,
      status: 'ready',
    });

    return saved;
  } catch (e) {
    await files.save({
      ...upload,
      status: 'failed',
    });
    throw e;
  }
};
