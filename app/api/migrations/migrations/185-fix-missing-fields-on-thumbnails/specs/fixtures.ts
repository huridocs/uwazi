import { ObjectId } from 'mongodb';
import { Fixture } from '../types.js';

// Processed PDFs — their _id is what the thumbnail filename is derived from
export const processedPdfForCompleteId = new ObjectId();
export const processedPdfForMissingAllId = new ObjectId();
export const processedPdfForMissingEntityId = new ObjectId();
export const processedPdfForMissingOriginalname = new ObjectId();

// Thumbnails
export const thumbnailCompleteId = new ObjectId();
export const thumbnailMissingAllId = new ObjectId();
export const thumbnailMissingEntityId = new ObjectId();
export const thumbnailMissingOriginalnameId = new ObjectId();
export const thumbnailNoMatchingPdfId = new ObjectId();

// Processed PDF documents
export const processedPdfForComplete = {
  _id: processedPdfForCompleteId,
  filename: `${processedPdfForCompleteId.toHexString()}.pdf`,
  originalname: 'complete-doc.pdf',
  mimetype: 'application/pdf',
  size: 10000,
  creationDate: 1000000,
  type: 'document' as const,
  status: 'ready' as const,
  entity: 'entity-complete',
  language: 'eng',
  totalPages: 5,
  generatedToc: false,
};

export const processedPdfForMissingAll = {
  _id: processedPdfForMissingAllId,
  filename: `${processedPdfForMissingAllId.toHexString()}.pdf`,
  originalname: 'missing-all-doc.pdf',
  mimetype: 'application/pdf',
  size: 20000,
  creationDate: 2000000,
  type: 'document' as const,
  status: 'ready' as const,
  entity: 'entity-missing-all',
  language: 'spa',
  totalPages: 3,
  generatedToc: false,
};

export const processedPdfForMissingEntity = {
  _id: processedPdfForMissingEntityId,
  filename: `${processedPdfForMissingEntityId.toHexString()}.pdf`,
  originalname: 'missing-entity-doc.pdf',
  mimetype: 'application/pdf',
  size: 30000,
  creationDate: 3000000,
  type: 'document' as const,
  status: 'ready' as const,
  entity: 'entity-missing-entity',
  language: 'fra',
  totalPages: 7,
  generatedToc: false,
};

export const processedPdfForMissingOriginalnameDoc = {
  _id: processedPdfForMissingOriginalname,
  filename: `${processedPdfForMissingOriginalname.toHexString()}.pdf`,
  originalname: 'missing-originalname-doc.pdf',
  mimetype: 'application/pdf',
  size: 40000,
  creationDate: 4000000,
  type: 'document' as const,
  status: 'ready' as const,
  entity: 'entity-missing-originalname',
  language: 'deu',
  totalPages: 2,
  generatedToc: false,
};

// Thumbnail documents
export const thumbnailComplete = {
  _id: thumbnailCompleteId,
  filename: `${processedPdfForCompleteId.toHexString()}.jpg`,
  originalname: `${processedPdfForCompleteId.toHexString()}.jpg`,
  mimetype: 'image/jpeg',
  size: 12535,
  creationDate: 1583767594000,
  type: 'thumbnail' as const,
  entity: 'entity-complete',
  language: 'eng',
};

// Missing entity, language, originalname, mimetype — matches processedPdfForMissingAll
export const thumbnailMissingAll = {
  _id: thumbnailMissingAllId,
  filename: `${processedPdfForMissingAllId.toHexString()}.jpg`,
  type: 'thumbnail' as const,
  size: 12535,
  creationDate: 1583767594000,
};

// Only missing entity — matches processedPdfForMissingEntity
export const thumbnailMissingEntity = {
  _id: thumbnailMissingEntityId,
  filename: `${processedPdfForMissingEntityId.toHexString()}.jpg`,
  originalname: `${processedPdfForMissingEntityId.toHexString()}.jpg`,
  mimetype: 'image/jpeg',
  size: 12535,
  creationDate: 1583767594000,
  type: 'thumbnail' as const,
  language: 'fra',
};

// Only missing originalname — matches processedPdfForMissingOriginalnameDoc
export const thumbnailMissingOriginalname = {
  _id: thumbnailMissingOriginalnameId,
  filename: `${processedPdfForMissingOriginalname.toHexString()}.jpg`,
  mimetype: 'image/jpeg',
  size: 12535,
  creationDate: 1583767594000,
  type: 'thumbnail' as const,
  entity: 'entity-missing-originalname',
  language: 'deu',
};

// No matching processed PDF — should be deleted
export const thumbnailNoMatchingPdf = {
  _id: thumbnailNoMatchingPdfId,
  filename: `${thumbnailNoMatchingPdfId.toHexString()}.jpg`,
  type: 'thumbnail' as const,
  size: 12535,
  creationDate: 1583767594000,
};

export const fixtures: Fixture = {
  files: [
    processedPdfForComplete,
    processedPdfForMissingAll,
    processedPdfForMissingEntity,
    processedPdfForMissingOriginalnameDoc,
    thumbnailComplete,
    thumbnailMissingAll,
    thumbnailMissingEntity,
    thumbnailMissingOriginalname,
    thumbnailNoMatchingPdf,
  ],
};
