import {
  AttachmentDBO,
  AttachmentDTO,
} from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile';
import { FileContents } from './FileContents';
import { FileWithContents } from './FileWithContents';

type Props = BaseFileProps & { entity: string; content: FileContents };
export class Attachment extends FileWithContents {
  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
  }

  static fromDBO(dbo: AttachmentDBO, contentLoader: FileContentLoader) {
    return new Attachment({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
    });
  }

  toDTO(): AttachmentDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      type: 'attachment',
    };
  }
}
