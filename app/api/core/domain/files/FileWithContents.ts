import { BaseFile, BaseFileProps } from './BaseFile.js';
import { FileContents } from './FileContents.js';

type WithContentProps = BaseFileProps & { content: FileContents };

export type BaseDocumentProps = WithContentProps;

export abstract class FileWithContents<
  TProps extends WithContentProps = WithContentProps,
> extends BaseFile<TProps> {
  readonly content: FileContents;

  constructor(props: TProps) {
    super(props);
    this.content = props.content;
  }

  hasContent(): this is this {
    return Boolean(this.content);
  }
}
