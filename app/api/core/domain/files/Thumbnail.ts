import {
  ThumbnailDBO,
  ThumbnailDTO,
} from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';

type Props = BaseFileProps & {
  entity: string;
  language: LanguageISO6391;
  content: FileContents;
};

export class Thumbnail extends FileWithContents {
  readonly entity: string;

  readonly language: LanguageISO6391;

  protected _type = 'thumbnail' as const;

  constructor(props: Props) {
    const { entity, language, ...baseProps } = props;
    super({ ...baseProps, mimetype: baseProps.mimetype ?? 'image/jpeg' });
    this.entity = entity;
    this.language = language;
  }

  toDTO(): ThumbnailDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      language: LanguageUtils.fromISO639_1(this.language).ISO639_3,
      type: 'thumbnail',
    };
  }

  static fromDBO(dbo: ThumbnailDBO, contentLoader: FileContentLoader) {
    return new Thumbnail({
      ...BaseFile.dboCommonFields(dbo),
      language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
    });
  }
}
