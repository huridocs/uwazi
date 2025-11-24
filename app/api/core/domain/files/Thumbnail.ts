import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & {
  entity: string;
  language: LanguageISO6391;
};

export class Thumbnail extends BaseFile {
  readonly entity: string;

  readonly language: LanguageISO6391;

  protected _type = 'thumbnail' as const;

  constructor(props: Props) {
    const { entity, language, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
    this.language = language;
  }
}
