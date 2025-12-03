import { BaseFileProps } from './BaseFile';
import { FileContents } from './FileContents';
import { FileWithContents } from './FileWithContents';

type Props = BaseFileProps & { entity: string; content: FileContents };
export class Attachment extends FileWithContents {
  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
  }
}
