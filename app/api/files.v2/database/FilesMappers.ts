import { LanguageUtils } from 'shared/language';
import { FileDBOType } from './schemas/filesTypes';
import { UwaziFile } from '../model/UwaziFile';
import { Document } from '../model/Document';
import { URLAttachment } from '../model/URLAttachment';
import { Attachment } from '../model/Attachment';
import { CustomUpload } from '../model/CustomUpload';

const toDocumentModel = (fileDBO: FileDBOType) =>
  new Document({
    id: fileDBO._id.toString(),
    entity: fileDBO.entity,
    originalname: fileDBO.originalname,
    filename: fileDBO.filename,
    mimetype: fileDBO.mimetype,
    size: fileDBO.size,
    creationDate: fileDBO.creationDate,
    language: LanguageUtils.fromISO639_3(fileDBO.language).key,
    totalPages: fileDBO.totalPages,
    status: fileDBO.status,
  });

export const FileMappers = {
  toModel(fileDBO: FileDBOType): UwaziFile {
    if (fileDBO.type === 'attachment' && fileDBO.url) {
      return new URLAttachment({
        id: fileDBO._id.toString(),
        entity: fileDBO.entity,
        url: fileDBO.url,
        originalname: fileDBO.originalname,
        filename: fileDBO.filename,
        mimetype: fileDBO.mimetype,
        size: fileDBO.size,
        creationDate: fileDBO.creationDate,
      });
    }
    if (fileDBO.type === 'attachment') {
      return new Attachment({
        id: fileDBO._id.toString(),
        entity: fileDBO.entity,
        originalname: fileDBO.originalname,
        filename: fileDBO.filename,
        mimetype: fileDBO.mimetype,
        size: fileDBO.size,
        creationDate: fileDBO.creationDate,
      });
    }

    if (fileDBO.type === 'custom') {
      return new CustomUpload({
        id: fileDBO._id.toString(),
        originalname: fileDBO.originalname,
        filename: fileDBO.filename,
        mimetype: fileDBO.mimetype,
        size: fileDBO.size,
        creationDate: fileDBO.creationDate,
      });
    }
    return toDocumentModel(fileDBO);
  },

  toDocumentModel,
};
