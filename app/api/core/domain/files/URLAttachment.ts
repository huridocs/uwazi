import { z } from 'zod';
import { BaseFile, BaseFileProps } from './BaseFile.js';
import { URLAttachmentDTO } from './domainTypes.js';

type Props = BaseFileProps & { entity?: string; url: string };

const Schema = z.object({
  entity: z.string().trim().min(1).optional(),
  url: z.string().url('URL must be a valid URL'),
});

export class URLAttachment extends BaseFile<Props> {
  readonly url: string;

  readonly entity?: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const filename = props.filename ?? props.url;
    const originalname = props.originalname ?? props.url;
    const validated = Schema.parse({ ...props, filename, originalname });
    super({ ...props, filename, originalname, entity: validated.entity, url: validated.url });
    // Override filename/originalname after super because BaseFile sanitizes them,
    // which would mangle URLs used as fallback values.
    this.filename = filename;
    this.originalname = originalname;
    this.url = validated.url;
    this.entity = validated.entity;
  }

  toDTO(): URLAttachmentDTO {
    return {
      ...this.dtoBaseFields(),
      ...(this.entity !== undefined ? { entity: this.entity } : {}),
      url: this.url,
      type: 'attachment',
    };
  }
}
