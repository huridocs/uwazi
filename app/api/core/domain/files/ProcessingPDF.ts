import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BaseFileProps } from './BaseFile.js';
import { ProcessingPDFDTO } from './domainTypes.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';
import { FullText, ProcessedPDF } from './ProcessedPDF.js';

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

  asProcessed(pdfInfo: { language: LanguageISO6391; totalPages: number; fullText: FullText }) {
    const processed = new ProcessedPDF({
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

    processed.languageChanged();

    return processed;
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
