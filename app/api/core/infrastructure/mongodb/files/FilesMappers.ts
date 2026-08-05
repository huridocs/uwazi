import { ObjectId } from 'mongodb';
import { BaseFile, FileContentLoader } from '#api/core/domain/files/BaseFile.js';
import { FileAttachment } from '../../../domain/files/FileAttachment.js';
import { CustomUpload } from '../../../domain/files/CustomUpload.js';
import { PDFDocument } from '../../../domain/files/PDFDocument.js';
import { Thumbnail } from '../../../domain/files/Thumbnail.js';
import { URLAttachment } from '../../../domain/files/URLAttachment.js';
import { LanguageUtils } from '#shared/language/index.js';
import {
  FileAttachmentDBO,
  ProcessedPDFDBO,
  ProcessingPDFDBO,
  ThumbnailDBO,
  URLAttachmentDBO,
  CustomDBO,
  FileDBO,
} from './schemas/FilesTypes.js';

function dboCommonFields(dbo: FileDBO) {
  return {
    id: dbo._id.toString(),
    originalname: dbo.originalname,
    filename: dbo.filename,
    mimetype: dbo.mimetype,
    size: dbo.size,
    creationDate: dbo.creationDate,
  };
}

function pdfDocumentFromDBO(
  dbo: ProcessedPDFDBO | ProcessingPDFDBO,
  contentLoader: FileContentLoader
) {
  if (dbo.status === 'ready') {
    return new PDFDocument({
      ...dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
      status: 'ready',
      language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
      totalPages: dbo.totalPages,
      fullText:
        dbo.fullText ||
        (async () => {
          throw new Error('not Implemented');
        }),
      generatedToc: dbo.generatedToc,
      toc: dbo.toc,
      propertySelections: dbo.propertySelections,
    });
  }
  return new PDFDocument({
    ...dboCommonFields(dbo),
    content: contentLoader({ type: dbo.type, filename: dbo.filename }),
    entity: dbo.entity,
    status: dbo.status ?? 'processing',
  });
}

function fileAttachmentFromDBO(dbo: FileAttachmentDBO, contentLoader: FileContentLoader) {
  return new FileAttachment({
    ...dboCommonFields(dbo),
    content: contentLoader({ type: dbo.type, filename: dbo.filename }),
    entity: dbo.entity,
  });
}

function urlAttachmentFromDBO(dbo: URLAttachmentDBO) {
  return new URLAttachment({
    ...dboCommonFields(dbo),
    url: dbo.url,
    entity: dbo.entity,
  });
}

function thumbnailFromDBO(dbo: ThumbnailDBO, contentLoader: FileContentLoader) {
  return new Thumbnail({
    ...dboCommonFields(dbo),
    language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
    content: contentLoader({ type: dbo.type, filename: dbo.filename }),
    entity: dbo.entity,
  });
}

function customUploadFromDBO(dbo: CustomDBO, contentLoader: FileContentLoader) {
  return new CustomUpload({
    ...dboCommonFields(dbo),
    content: contentLoader({ type: dbo.type, filename: dbo.filename }),
  });
}

function pdfDocumentToDBO(file: PDFDocument): ProcessedPDFDBO | ProcessingPDFDBO {
  return { ...file.toDTO(), _id: new ObjectId(file.id) } as ProcessedPDFDBO | ProcessingPDFDBO;
}

function fileAttachmentToDBO(file: FileAttachment): FileAttachmentDBO {
  return { ...file.toDTO(), _id: new ObjectId(file.id) };
}

function urlAttachmentToDBO(file: URLAttachment): URLAttachmentDBO {
  return { ...file.toDTO(), _id: new ObjectId(file.id) };
}

function thumbnailToDBO(file: Thumbnail): ThumbnailDBO {
  return { ...file.toDTO(), _id: new ObjectId(file.id) };
}

function customUploadToDBO(file: CustomUpload): CustomDBO {
  return { ...file.toDTO(), _id: new ObjectId(file.id) };
}

export const FileMappers = {
  toModel(dbo: FileDBO, { contentLoader }: { contentLoader: FileContentLoader }) {
    switch (dbo.type) {
      case 'document':
        return pdfDocumentFromDBO(dbo as ProcessedPDFDBO | ProcessingPDFDBO, contentLoader);
      case 'attachment':
        return dbo?.url
          ? urlAttachmentFromDBO(dbo as URLAttachmentDBO)
          : fileAttachmentFromDBO(dbo as FileAttachmentDBO, contentLoader);
      case 'custom':
        return customUploadFromDBO(dbo as CustomDBO, contentLoader);
      case 'thumbnail':
        return thumbnailFromDBO(dbo as ThumbnailDBO, contentLoader);
      default:
        throw new Error('Unknown file type');
    }
  },

  toDBO(file: BaseFile): FileDBO {
    if (file instanceof PDFDocument) return pdfDocumentToDBO(file);
    if (file instanceof FileAttachment) return fileAttachmentToDBO(file);
    if (file instanceof URLAttachment) return urlAttachmentToDBO(file);
    if (file instanceof Thumbnail) return thumbnailToDBO(file);
    if (file instanceof CustomUpload) return customUploadToDBO(file);
    throw new Error('Unknown file type');
  },
};
