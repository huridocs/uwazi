/* eslint-disable max-statements */
import { convertToPDFService } from 'api/services/convertToPDF/convertToPdfService';
import settings from 'api/settings';
import { FileType } from 'shared/types/fileType';
import { ObjectId } from 'mongodb';
import { files } from './files';
import { PDF } from './PDF';

export const createProcessingFile = async (
  entitySharedId: string,
  file: FileType & { destination?: string }
) =>
  files.save({
    ...file,
    entity: entitySharedId,
    type: 'document',
    status: 'processing',
  });

export const convertPDF = async (
  upload: FileType & { _id: ObjectId },
  entitySharedId: string,
  file: FileType & { destination?: string },
  detectLanguage = true,
  // eslint-disable-next-line no-empty-function
  onProcessingSuccess: (file: FileType & { _id: ObjectId; __v: number }) => void = () => {},
  // eslint-disable-next-line no-empty-function
  onProcessingFail: (e: Error, file: FileType & { _id: ObjectId; __v: number }) => void = () => {}
) => {
  try {
    const pdf = new PDF(file);
    const conversion = await pdf.convert();
    if (!detectLanguage) {
      conversion.language = file.language;
    }

    const processedFile = await files.save({
      ...upload,
      ...conversion,
      status: 'ready',
    });

    const { filename, size } = await pdf.createThumbnail(upload._id.toString());

    await files.save({
      entity: entitySharedId,
      type: 'thumbnail',
      language: conversion.language,
      filename,
      mimetype: 'image/jpeg',
      size,
    });

    onProcessingSuccess(processedFile);
    return processedFile;
  } catch (e) {
    const failedFile = await files.save({
      ...upload,
      status: 'failed',
    });

    onProcessingFail(e, failedFile);
  }
};

export const processPDF = async (
  entitySharedId: string,
  file: FileType & { destination?: string },
  detectLanguage = true
): Promise<FileType & { _id: ObjectId; __v: number }> => {
  const upload = await createProcessingFile(entitySharedId, file);
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    convertPDF(
      upload,
      entitySharedId,
      file,
      detectLanguage,
      processedFile => {
        resolve(processedFile);
      },
      e => {
        reject(e);
      }
    );
  });
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
