/** @format */

import { FileSchema } from 'api/files/fileType';

import { files } from './files';
import { PDF } from './PDF.js';

export const processDocument = async (entitySharedId: string, file: FileSchema) => {
  const pdf = new PDF(file);
  const upload = await files.save({
    entity: entitySharedId,
    type: 'document',
    processed: false,
  });

  const conversion = await pdf.convert();
  const thumbnail = await pdf.createThumbnail(upload._id.toString());

  await files.save({
    entity: entitySharedId,
    type: 'thumbnail',
    language: conversion.language,
    filename: thumbnail,
  });

  return files.save({
    ...upload,
    ...conversion,
  });
};
