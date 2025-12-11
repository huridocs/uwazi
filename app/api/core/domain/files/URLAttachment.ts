import {
  URLAttachmentDBO,
  URLAttachmentDTO,
} from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & { entity: string; url: string };

export class URLAttachment extends BaseFile {
  readonly url: string;

  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const { entity, url, ...baseProps } = props;
    super(baseProps);
    this.url = url;
    this.entity = entity;
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
