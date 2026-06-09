import { BaseFile, BaseFileProps } from './BaseFile.js';
import { CustomDTO } from './domainTypes.js';
import { FileContents } from './FileContents.js';

type Props = BaseFileProps & { content: FileContents };

export class CustomUpload extends BaseFile<Props> {
  protected _type = 'custom' as const;

  override get content(): FileContents {
    return this.props.content;
  }

  toDTO(): CustomDTO {
    return {
      ...this.dtoBaseFields(),
      type: 'custom',
    };
  }
}
