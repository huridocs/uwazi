import { FileType } from 'shared/types/fileType';

import { files } from './files';
import { PDF } from './PDF.js';
import language from 'shared/languagesList';

export const processDocument = async (entitySharedId: string, file: FileType, detectLanguage = true) => {
  const pdf = new PDF(file);
  const upload = await files.save({
    ...file,
    entity: entitySharedId,
    type: 'document',
    status: 'processing',
  });

  let conversion;
  try {
    conversion = await pdf.convert();
    if (!detectLanguage) {
      conversion.language = file.language;
    }
  } catch (e) {
    await files.save({
      ...upload,
      status: 'failed',
    });
    throw e;
  }

  const thumbnail = await pdf.createThumbnail(upload._id.toString());

  await files.save({
    entity: entitySharedId,
    type: 'thumbnail',
    language: conversion.language,
    filename: thumbnail,
  });

  const saved = await files.save({
    ...upload,
    ...conversion,
    status: 'ready',
  });

  return saved;
};
