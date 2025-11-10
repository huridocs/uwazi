import { ObjectId } from 'mongodb';
import { LanguageUtils } from 'shared/language';
import { Attachment } from '../model/Attachment';
import { CustomUpload } from '../model/CustomUpload';
import { Document } from '../model/Document';
import { Thumbnail } from '../model/Thumbnail';
import { URLAttachment } from '../model/URLAttachment';
import { UwaziFile } from '../model/UwaziFile';
import { fileDBO } from './schemas/filesTypes';
import { ProcessedDocument } from '../model/ProcessedDocument';

export const FileMappers = {
  toModel<R extends UwaziFile = UwaziFile>(dbo: fileDBO): R {
    if (dbo.type === 'attachment' && dbo.url) {
      return new URLAttachment({
        id: dbo._id.toString(),
        entity: dbo.entity,
        url: dbo.url,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
      }) as R;
    }
    if (dbo.type === 'attachment') {
      return new Attachment({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
      }) as R;
    }

    if (dbo.type === 'custom') {
      return new CustomUpload({
        id: dbo._id.toString(),
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
      }) as R;
    }

    if (dbo.type === 'thumbnail') {
      return new Thumbnail({
        id: dbo._id.toString(),
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
        entity: dbo.entity,
        language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
      }) as R;
    }

    if (dbo.type === 'document' && dbo.status === 'ready') {
      return new ProcessedDocument({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
        language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
        totalPages: dbo.totalPages,
        fullText: dbo.fullText || {},
      }) as R;
    }
    if (dbo.type === 'document') {
      return new Document({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
        status: dbo.status,
      }) as R;
    }
    throw new Error('Unknown file type');
  },

  toDBO: (file: UwaziFile): fileDBO => {
    const baseDBO = {
      _id: new ObjectId(file.id),
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      creationDate: file.creationDate,
    };

    if (file instanceof ProcessedDocument) {
      return {
        ...baseDBO,
        entity: file.entity,
        type: 'document',
        totalPages: file.totalPages,
        language: LanguageUtils.fromISO639_1(file.language).ISO639_3,
        status: 'ready',
        fullText: file.fullText,
      };
    }

    if (file instanceof Document) {
      return {
        ...baseDBO,
        entity: file.entity,
        type: 'document',
        status: file.status,
      };
    }

    if (file instanceof URLAttachment) {
      return { ...baseDBO, entity: file.entity, url: file.url, type: 'attachment' };
    }

    if (file instanceof Thumbnail) {
      return {
        ...baseDBO,
        entity: file.entity,
        language: LanguageUtils.fromISO639_1(file.language).ISO639_3,
        type: 'thumbnail',
      };
    }

    if (file instanceof Attachment) {
      return { ...baseDBO, entity: file.entity, url: '', type: 'attachment' };
    }

    if (file instanceof CustomUpload) {
      return { ...baseDBO, type: 'custom' };
    }

    throw new Error('Unknown file type');
  },

  toDTO(file: UwaziFile): Omit<fileDBO, '_id'> & { _id: string } {
    return {
      ...this.toDBO(file),
      _id: file.id,
    };
  },
};
