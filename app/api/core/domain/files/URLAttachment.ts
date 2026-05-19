import {
  URLAttachmentDBO,
  URLAttachmentDTO,
} from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { BaseFile, BaseFileProps } from './BaseFile.js';

type Props = Omit<BaseFileProps, 'content'> & { entity: string; url: string };

export class URLAttachment extends BaseFile<Props> {
  readonly url: string;

  readonly entity: string;

  protected _type = 'attachment' as const;

  readonly content: undefined;

  constructor(props: Props) {
    const filename = props.filename ?? props.url;
    const originalname = props.originalname ?? props.url;

    super({ ...props, filename, originalname });
    this.filename = filename;
    this.originalname = originalname;
    this.url = props.url;
    this.entity = props.entity;
    this.content = undefined;
  }

  override isEntityFile(): this is Omit<this, 'entity'> & { entity: string } {
    return true;
  }

  hasContent(): this is this {
    return false;
  }

  static fromDBO(dbo: URLAttachmentDBO) {
    return new URLAttachment({
      ...BaseFile.dboCommonFields(dbo),
      url: dbo.url,
      entity: dbo.entity,
    });
  }

  toDTO(): URLAttachmentDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      url: this.url,
      type: 'attachment',
    };
  }
}
