import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFileProps } from './BaseFile';
import { FileContents } from './FileContents';
import { FileWithContents } from './FileWithContents';

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
    super(baseProps);
    this.entity = entity;
    this.language = language;
  }
}
