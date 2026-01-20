import { BaseFile, BaseFileProps } from '#api/core/domain/files/BaseFile.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';

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
