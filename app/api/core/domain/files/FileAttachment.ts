import { z } from 'zod';
import { BaseFileProps } from './BaseFile.js';
import { FileAttachmentDTO } from './domainTypes.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';

type Props = BaseFileProps & { entity: string; content: FileContents };

const Schema = z.object({
  entity: z.string().trim().min(1, 'Entity is required'),
});

export class FileAttachment extends FileWithContents<Props> {
  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const validated = Schema.parse(props);
    super(props);
    this.entity = validated.entity;
  }

  toDTO(): FileAttachmentDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      type: 'attachment',
    };
  }
}
