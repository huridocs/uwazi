/** @format */

import { FileType } from 'shared/types/fileType';
import { search } from 'api/search';

import { files } from './files';
import { PDF } from './PDF.js';

export const processDocument = async (entitySharedId: string, file: FileType) => {
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

  const saved = await files.save({
    ...upload,
    ...conversion,
  });

  await search.indexEntities({ sharedId: entitySharedId }, '+fullText');

  return saved;
};
