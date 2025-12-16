import { BaseFile, FileContentLoader } from 'api/core/domain/files/BaseFile';
import { ObjectId } from 'mongodb';
import { FileAttachment } from '../../../domain/files/FileAttachment';
import { CustomUpload } from '../../../domain/files/CustomUpload';
import { ProcessingPDF } from '../../../domain/files/ProcessingPDF';
import { ProcessedPDF } from '../../../domain/files/ProcessedPDF';
import { Thumbnail } from '../../../domain/files/Thumbnail';
import { URLAttachment } from '../../../domain/files/URLAttachment';
import { FileAttachmentDBO, fileDBO } from './schemas/filesTypes';

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
