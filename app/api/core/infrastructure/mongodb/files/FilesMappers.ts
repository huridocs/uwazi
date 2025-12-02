import { ObjectId } from 'mongodb';
import { LanguageUtils } from 'shared/language';
import { Attachment } from '../../../domain/files/Attachment';
import { CustomUpload } from '../../../domain/files/CustomUpload';
import { Document } from '../../../domain/files/Document';
import { Thumbnail } from '../../../domain/files/Thumbnail';
import { URLAttachment } from '../../../domain/files/URLAttachment';
import { UwaziFile } from '../../../domain/files/UwaziFile';
import { ProcessedDocument } from '../../../domain/files/ProcessedDocument';
import { FileContents } from '../../../domain/files/FileContents';
import { fileDBO } from './schemas/filesTypes';

export const FileMappers = {
  toModel<R extends UwaziFile = UwaziFile>(dbo: fileDBO, fileContents: FileContents): R {
    const commonFields = {
      id: dbo._id.toString(),
      originalname: dbo.originalname,
      filename: dbo.filename,
      mimetype: dbo.mimetype,
      size: dbo.size,
      creationDate: dbo.creationDate,
      content: fileContents,
    };

    if (dbo.type === 'attachment' && dbo.url) {
      return new URLAttachment({ ...commonFields, entity: dbo.entity, url: dbo.url }) as R;
    }
    if (dbo.type === 'attachment') {
      return new Attachment({ ...commonFields, entity: dbo.entity }) as R;
    }

    if (dbo.type === 'custom') {
      return new CustomUpload(commonFields) as R;
    }

    if (dbo.type === 'thumbnail') {
      return new Thumbnail({
        ...commonFields,
        entity: dbo.entity,
        language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
      }) as R;
    }

    if (dbo.type === 'document' && dbo.status === 'ready') {
      return new ProcessedDocument({
        ...commonFields,
        id: dbo._id.toString(),
        entity: dbo.entity,
        language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
        totalPages: dbo.totalPages,
        fullText: dbo.fullText || {},
        generatedToc: dbo.generatedToc,
      }) as R;
    }
    if (dbo.type === 'document') {
      return new Document({
        ...commonFields,
        id: dbo._id.toString(),
        entity: dbo.entity,
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
        generatedToc: file.generatedToc,
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
      return { ...baseDBO, entity: file.entity, type: 'attachment' };
    }

    if (file instanceof CustomUpload) {
      return { ...baseDBO, type: 'custom' };
    }

    throw new Error('Unknown file type');
  },

  toDTO(file: UwaziFile): Omit<fileDBO, '_id'> & { _id: string } {
    return { ...this.toDBO(file), _id: file.id };
  },
};
