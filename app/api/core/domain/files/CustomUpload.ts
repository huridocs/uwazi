import { CustomDTO } from './domainTypes.js';
import { BaseDocumentProps, FileWithContents } from './FileWithContents.js';

type Props = BaseDocumentProps;

export class CustomUpload extends FileWithContents<Props> {
  protected _type = 'custom' as const;

  toDTO(): CustomDTO {
    return {
      ...this.dtoBaseFields(),
      type: 'custom',
    };
  }
}
