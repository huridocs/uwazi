import { convertToPDFService } from 'api/services/convertToPDF/convertToPdfService';
import settings from 'api/settings';
import { FileType } from 'shared/types/fileType';

import { files } from './files';
import { PDF } from './PDF';

export const processPDF = async (
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

export const processDocument = async (
  entitySharedId: string,
  file: FileType & { destination?: string },
  detectLanguage = true
) => {
  const { features } = await settings.get({}, 'features.convertToPdf');

  if (features?.convertToPdf?.active && file.mimetype !== 'application/pdf') {
    const upload = await files.save({
      ...file,
      entity: entitySharedId,
      type: 'attachment',
      status: 'processing',
    });
    try {
      await convertToPDFService.upload(upload, features.convertToPdf.url);
    } catch (e) {
      await files.delete(upload);
    }
    return upload;
  }

  return processPDF(entitySharedId, file, detectLanguage);
};
