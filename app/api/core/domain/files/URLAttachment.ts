import { z } from 'zod';
import { BaseFile, BaseFileProps } from './BaseFile.js';
import { URLAttachmentDTO } from './domainTypes.js';

type Props = BaseFileProps & { entity: string; url: string };

const Schema = z.object({
  entity: z.string().trim().min(1, 'Entity is required'),
  url: z.string().url('URL must be a valid URL'),
});

export class URLAttachment extends BaseFile<Props> {
  readonly url: string;

  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const filename = props.filename ?? props.url;
    const originalname = props.originalname ?? props.url;

    super({ ...props, filename, originalname });
    const validated = Schema.parse(props);
    this.filename = filename;
    this.originalname = originalname;
    this.url = validated.url;
    this.entity = validated.entity;
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
