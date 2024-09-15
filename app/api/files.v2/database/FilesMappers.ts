// import { OptionalId } from 'mongodb';

import { FileDBOType } from './schemas/filesTypes';
import { UwaziFile } from '../model/UwaziFile';
import { Document } from '../model/Document';
import { URLAttachment } from '../model/URLAttachment';
import { Attachment } from '../model/Attachment';
import { CustomUpload } from '../model/CustomUpload';

export const FileMappers = {
  // toDBO(file: UwaziFile): OptionalId<FileDBOType> {
  //   return {
  //     filename: file.filename,
  //     entity: file.entity,
  //     type: 'document',
  //     totalPages: file.totalPages,
  //   };
  // },

  toModel(fileDBO: FileDBOType): UwaziFile {
    if (fileDBO.type === 'attachment' && fileDBO.url) {
      return new URLAttachment(
        fileDBO._id.toString(),
        fileDBO.entity,
        fileDBO.totalPages,
        fileDBO.url
      );
    }
    if (fileDBO.type === 'attachment') {
      return new Attachment(
        fileDBO._id.toString(),
        fileDBO.entity,
        fileDBO.totalPages,
        fileDBO.filename
      );
    }

    if (fileDBO.type === 'custom') {
      return new CustomUpload(
        fileDBO._id.toString(),
        fileDBO.entity,
        fileDBO.totalPages,
        fileDBO.filename
      );
    }
    return new Document(
      fileDBO._id.toString(),
      fileDBO.entity,
      fileDBO.totalPages,
      fileDBO.filename
    );
  },
};
