import {
  ProcessingPDFDBO,
  ProcessingPDFDTO,
} from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile';
import { FileContents } from './FileContents';
import { FileWithContents } from './FileWithContents';
import { fullTextProp, ProcessedPDF } from './ProcessedPDF';

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

    this.props = { ...this.props, entity, status } as Props;
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
