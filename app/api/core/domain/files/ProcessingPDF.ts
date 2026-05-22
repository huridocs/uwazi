import {
  ProcessingPDFDBO,
  ProcessingPDFDTO,
} from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';
import { fullTextProp, ProcessedPDF } from './ProcessedPDF.js';

type Props = BaseFileProps & {
  entity: string;
  content: FileContents;
  status: 'processing' | 'failed';
};

export class ProcessingPDF extends FileWithContents<Props> {
  status: 'processing' | 'failed';

  protected _type = 'document' as const;

  readonly entity: string;

  constructor(props: Props) {
    super(props);
    this.status = props.status;
    this.entity = props.entity;
  }

  failed() {
    this.status = 'failed';
  }

  asProcessed(pdfInfo: { language: LanguageISO6391; totalPages: number; fullText: fullTextProp }) {
    return new ProcessedPDF({
      id: this.id,
      originalname: this.originalname,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
      creationDate: this.creationDate,
      entity: this.entity,
      content: this.content,
      language: pdfInfo.language,
      totalPages: pdfInfo.totalPages,
      fullText: pdfInfo.fullText,
      generatedToc: false,
    });
  }

  static fromDBO(dbo: ProcessingPDFDBO, contentLoader: FileContentLoader) {
    return new ProcessingPDF({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
      status: dbo.status,
    });
  }

  toDTO(): ProcessingPDFDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      status: this.status,
      type: 'document',
    };
  }
}
