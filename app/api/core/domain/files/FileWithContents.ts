import { BaseFile, BaseFileProps } from './BaseFile';
import { FileContents } from './FileContents';

export type BaseDocumentProps = BaseFileProps & {
  content: FileContents;
};

export abstract class FileWithContents extends BaseFile {
  readonly content: FileContents;

  constructor(props: BaseDocumentProps) {
    const { content, ...baseProps } = props;
    super(baseProps);
    this.content = content;
  }
}
