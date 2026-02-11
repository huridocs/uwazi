import {
  FileAttachmentDBO,
  FileAttachmentDTO,
} from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';

type Props = BaseFileProps & { entity: string; content: FileContents };
export class FileAttachment extends FileWithContents {
  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;

    this.props = { ...this.props, entity };
  }

  static fromDBO(dbo: FileAttachmentDBO, contentLoader: FileContentLoader) {
    return new FileAttachment({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
    });
  }

  toDTO(): FileAttachmentDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      type: 'attachment',
    };
  }
}
