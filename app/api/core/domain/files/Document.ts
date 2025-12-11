import { DocumentDBO, DocumentDTO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { BaseDocument, BaseDocumentProps } from './BaseDocument';
import { BaseFile, FileContentLoader } from './BaseFile';

type Props = BaseDocumentProps & {
  status: 'processing' | 'failed';
};

export class Document extends BaseDocument {
  status: 'processing' | 'failed';

  constructor(props: Props) {
    const { status, ...baseProps } = props;
    super(baseProps);
    this.status = status;
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
      _id: this.id,
      originalname: this.originalname,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
      creationDate: this.creationDate,
      entity: this.entity,
      status: this.status,
      type: 'document',
    };
  }
}
