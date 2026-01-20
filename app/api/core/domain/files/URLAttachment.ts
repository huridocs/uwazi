import {
  URLAttachmentDBO,
  URLAttachmentDTO,
} from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { BaseFile, BaseFileProps } from '#api/core/domain/files/BaseFile.js';

type Props = Omit<BaseFileProps, 'content'> & { entity: string; url: string };

export class URLAttachment extends BaseFile {
  readonly url: string;

  readonly entity: string;

  protected _type = 'attachment' as const;

  readonly content: undefined;

  constructor(props: Props) {
    const { entity, url, ...baseProps } = props;
    super(baseProps);
    this.url = url;
    this.entity = entity;
    // keeping this since it still possible to pass content with prop spread
    this.content = undefined;
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
