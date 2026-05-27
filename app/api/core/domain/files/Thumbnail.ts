import { z } from 'zod';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BaseFileProps } from './BaseFile.js';
import { ThumbnailDTO } from './domainTypes.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';

type Props = BaseFileProps & {
  entity: string;
  language: LanguageISO6391;
  content: FileContents;
};

const Schema = z.object({
  entity: z.string().trim().min(1, 'Entity is required'),
  language: z.string().trim().min(2, 'Language is required') as z.ZodType<LanguageISO6391>,
});

export class Thumbnail extends FileWithContents<Props> {
  readonly entity: string;

  readonly language: LanguageISO6391;

  protected _type = 'thumbnail' as const;

  constructor(props: Props) {
    const validated = Schema.parse(props);
    super({
      ...props,
      entity: validated.entity,
      language: validated.language,
      mimetype: props.mimetype ?? 'image/jpeg',
      originalname: props.originalname ?? props.filename,
    });
    this.entity = this.props.entity;
    this.language = this.props.language;
  }

  toDTO(): ThumbnailDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      language: LanguageUtils.fromISO639_1(this.language).ISO639_3,
      type: 'thumbnail',
    };
  }
}
