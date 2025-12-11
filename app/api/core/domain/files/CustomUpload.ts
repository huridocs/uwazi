import { CustomDBO, CustomDTO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { BaseFile, FileContentLoader } from './BaseFile';
import { FileWithContents } from './FileWithContents';

export class CustomUpload extends FileWithContents {
  protected _type = 'custom' as const;

  static fromDBO(dbo: CustomDBO, contentLoader: FileContentLoader) {
    return new CustomUpload({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
    });
  }

  toDTO(): CustomDTO {
    return {
      _id: this.id,
      originalname: this.originalname,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
      creationDate: this.creationDate,
      type: 'custom',
    };
  }
}
