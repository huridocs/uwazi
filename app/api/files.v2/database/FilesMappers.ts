import { ObjectId } from 'mongodb';
import { LanguageUtils } from 'shared/language';
import { Attachment } from '../model/Attachment';
import { CustomUpload } from '../model/CustomUpload';
import { Document } from '../model/Document';
import { URLAttachment } from '../model/URLAttachment';
import { UwaziFile } from '../model/UwaziFile';
import { FileDBOType } from './schemas/filesTypes';

const toDocumentModel = (fileDBO: FileDBOType) =>
  new Document(
    fileDBO._id.toString(),
    fileDBO.entity,
    fileDBO.totalPages,
    fileDBO.filename,
    LanguageUtils.fromISO639_3(fileDBO.language).ISO639_1!
  ).withCreationDate(new Date(fileDBO.creationDate));

export const FileMappers = {
  toDBO(file: UwaziFile): FileDBOType {
    if (file instanceof Document) {
      const iso6393 = LanguageUtils.fromISO639_1(file.language)?.ISO639_3;
      if (!iso6393) {
        throw new Error(`Invalid language: ${file.language}`);
      }
      return {
        _id: new ObjectId(file.id),
        entity: file.entity,
        filename: file.filename,
        totalPages: file.totalPages,
        language: iso6393,
        type: 'document',
        extractedMetadata: file.extractedMetadata,
        ...(file.creationDate
          ? { creationDate: file.creationDate.getTime() }
          : { creationDate: 0 }),
      };
    }

    throw new Error('Mapping not implemented for this file type');
  },

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
