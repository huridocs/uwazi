import { DocumentDBO, DocumentDTO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile';
import { FileWithContents } from './FileWithContents';
import { FileContents } from './FileContents';

type Props = BaseFileProps & {
  entity: string;
  content: FileContents;
  status: 'processing' | 'failed';
};

export class Document extends FileWithContents {
  status: 'processing' | 'failed';

  protected _type = 'document' as const;

  readonly entity: string;

  constructor(props: Props) {
    const { entity, status, ...baseProps } = props;
    super(baseProps);
    this.status = status;
    this.entity = entity;
  }

  failed() {
    this.status = 'failed';
  }

  static fromDBO(dbo: DocumentDBO, contentLoader: FileContentLoader) {
    return new Document({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
      status: dbo.status,
    });
  }

  toDTO(): DocumentDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      status: this.status,
      type: 'document',
    };
  }
}
