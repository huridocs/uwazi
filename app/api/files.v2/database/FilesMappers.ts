// import { OptionalId } from 'mongodb';

import { FileDBOType } from './schemas/filesTypes';
import { UwaziFile } from '../model/UwaziFile';
import { Document } from '../model/Document';
import { URLAttachment } from '../model/URLAttachment';

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
      return new URLAttachment(fileDBO.filename, fileDBO.entity, fileDBO.totalPages, fileDBO.url);
    }
    return new Document(fileDBO.filename, fileDBO.entity, fileDBO.totalPages);
  },
};
