import { BaseFile, FileContentLoader } from 'api/core/domain/files/BaseFile';
import { ObjectId } from 'mongodb';
import { Attachment } from '../../../domain/files/Attachment';
import { CustomUpload } from '../../../domain/files/CustomUpload';
import { Document } from '../../../domain/files/Document';
import { ProcessedDocument } from '../../../domain/files/ProcessedDocument';
import { Thumbnail } from '../../../domain/files/Thumbnail';
import { URLAttachment } from '../../../domain/files/URLAttachment';
import { AttachmentDBO, fileDBO } from './schemas/filesTypes';

export const FileMappers = {
  toModel(dbo: fileDBO, { contentLoader }: { contentLoader: FileContentLoader }) {
    switch (dbo.type) {
      case 'document':
        return dbo.status === 'ready'
          ? ProcessedDocument.fromDBO(dbo, contentLoader)
          : Document.fromDBO(dbo, contentLoader);
      case 'attachment':
        return dbo.url
          ? URLAttachment.fromDBO(dbo)
          : Attachment.fromDBO(dbo as AttachmentDBO, contentLoader);
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
