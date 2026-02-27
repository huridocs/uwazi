import { BaseFile, FileContentLoader } from '#api/core/domain/files/BaseFile.js';
import { ObjectId } from 'mongodb';
import { FileAttachment } from '../../../domain/files/FileAttachment.js';
import { CustomUpload } from '../../../domain/files/CustomUpload.js';
import { ProcessingPDF } from '../../../domain/files/ProcessingPDF.js';
import { ProcessedPDF } from '../../../domain/files/ProcessedPDF.js';
import { Thumbnail } from '../../../domain/files/Thumbnail.js';
import { URLAttachment } from '../../../domain/files/URLAttachment.js';
import { FileAttachmentDBO, fileDBO } from './schemas/filesTypes.js';

export const FileMappers = {
  toModel(dbo: fileDBO, { contentLoader }: { contentLoader: FileContentLoader }) {
    switch (dbo.type) {
      case 'document':
        return dbo.status === 'ready'
          ? ProcessedPDF.fromDBO(dbo, contentLoader)
          : ProcessingPDF.fromDBO(dbo, contentLoader);
      case 'attachment':
        return dbo.url
          ? URLAttachment.fromDBO(dbo)
          : FileAttachment.fromDBO(dbo as FileAttachmentDBO, contentLoader);
      case 'custom':
        return CustomUpload.fromDBO(dbo, contentLoader);
      case 'thumbnail':
        return Thumbnail.fromDBO(dbo, contentLoader);
      default:
        throw new Error('Unknown file type');
    }
  },

  toDBO: (file: BaseFile): fileDBO => ({ ...file.toDTO(), _id: new ObjectId(file.id) }),
};
