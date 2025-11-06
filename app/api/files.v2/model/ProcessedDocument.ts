import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from './Document';
import { BaseFileProps } from './BaseFile';

type Props = BaseFileProps & {
  entity: string;
  language: LanguageISO6391;
  totalPages: number;
  fullText: {
    [k: string]: string;
  };
};

export class ProcessedDocument extends Document {
  readonly language: LanguageISO6391;

  readonly totalPages: number;

  readonly fullText: { [k: string]: string };

  constructor(props: Props) {
    const { language, totalPages, fullText, ...baseProps } = props;
    super({ ...baseProps, status: 'ready' });
    this.language = language;
    this.totalPages = totalPages;
    this.fullText = fullText;
  }

  static fromDocument(
    document: Document,
    pdfInfo: {
      language: LanguageISO6391;
      totalPages: number;
      fullText: {
        [k: string]: string;
      };
    }
  ) {
    return new ProcessedDocument({ ...document, ...pdfInfo });
  }
}
