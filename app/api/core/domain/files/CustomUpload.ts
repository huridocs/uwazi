import { CustomDBO, CustomDTO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { BaseFile, FileContentLoader } from './BaseFile.js';
import { BaseDocumentProps, FileWithContents } from './FileWithContents.js';

type Props = BaseDocumentProps;

export class CustomUpload extends FileWithContents<Props> {
  protected _type = 'custom' as const;

  static fromDBO(dbo: CustomDBO, contentLoader: FileContentLoader) {
    return new CustomUpload({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
    });
  }

  toDTO(): CustomDTO {
    return {
      ...this.dtoBaseFields(),
      type: 'custom',
    };
  }
}
