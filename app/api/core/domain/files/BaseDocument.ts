import { BaseFileProps } from './BaseFile';
import { FileContents } from './FileContents';
import { FileWithContents } from './FileWithContents';

export type BaseDocumentProps = BaseFileProps & {
  entity: string;
  content: FileContents;
};

export abstract class BaseDocument extends FileWithContents {
  readonly entity: string;

  protected _type = 'document' as const;

  constructor(props: BaseDocumentProps) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
  }
}
