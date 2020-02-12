/** @format */

import { File } from 'api/utils/files';

import uploads from './uploads';
import { PDF } from './PDF.js';

export const processDocument = async (entitySharedId: string, file: File) => {
  const pdf = new PDF(file);
  const upload = await uploads.save({
    entity: entitySharedId,
    type: 'document',
    processed: false,
  });

  const conversion = await pdf.convert();
  const thumbnail = await pdf.createThumbnail(upload._id.toString());

  await uploads.save({
    entity: entitySharedId,
    type: 'thumbnail',
    language: conversion.language,
    filename: thumbnail,
  });

  return uploads.save({
    ...upload,
    ...conversion,
  });
};
