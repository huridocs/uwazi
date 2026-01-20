import { LanguageUtils } from '#shared/language/index.js';
import { fileDBO as FileDBOType } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { UwaziFile } from '../model/UwaziFile';
import { Document } from '#api/files.v2/model/Document.js';
import { URLAttachment } from '#api/core/domain/files/URLAttachment.js';
import { FileAttachment as Attachment } from '#api/core/domain/files/FileAttachment.js';
import { CustomUpload } from '#api/core/domain/files/CustomUpload.js';

type UwaziFile = BaseFile;

const toDocumentModel = (fileDBO: FileDBOType) =>
  new Document(
    fileDBO._id.toString(),
    fileDBO.entity,
    fileDBO.totalPages,
    fileDBO.filename,
    LanguageUtils.fromISO639_3(fileDBO.language).ISO639_1!
  );

export const FileMappers = {
  toModel(fileDBO: FileDBOType): UwaziFile {
    if (fileDBO.type === 'attachment' && fileDBO.url) {
      return new URLAttachment(
        fileDBO._id.toString(),
        fileDBO.entity,
        fileDBO.totalPages,
        fileDBO.url
      ).withCreationDate(new Date(fileDBO.creationDate));
    }
    if (fileDBO.type === 'attachment') {
      return new Attachment(
        fileDBO._id.toString(),
        fileDBO.entity,
        fileDBO.totalPages,
        fileDBO.filename
      ).withCreationDate(new Date(fileDBO.creationDate));
    }

    if (fileDBO.type === 'custom') {
      return new CustomUpload(
        fileDBO._id.toString(),
        fileDBO.entity,
        fileDBO.totalPages,
        fileDBO.filename
      ).withCreationDate(new Date(fileDBO.creationDate));
    }
    return toDocumentModel(fileDBO);
  },

  toDocumentModel,
};
