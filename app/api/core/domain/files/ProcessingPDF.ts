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

export class ProcessingPDF extends FileWithContents {
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

  asProcessed(pdfInfo: { language: LanguageISO6391; totalPages: number; fullText: fullTextProp }) {
    return new ProcessedPDF({ ...this, ...pdfInfo, generatedToc: false });
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
