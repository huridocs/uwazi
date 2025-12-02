import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from './Document';
import { BaseDocument, BaseDocumentProps } from './BaseDocument';

type fullTextProp = { [k: string]: string };

type fullTextLoader = fullTextProp | (() => Promise<fullTextProp>);

type Props = BaseDocumentProps & {
  entity: string;
  language: LanguageISO6391;
  totalPages: number;
  generatedToc: boolean;
  fullText: fullTextLoader;
};

export class ProcessedDocument extends BaseDocument {
  readonly language: LanguageISO6391;

  readonly totalPages: number;

  readonly generatedToc: boolean;

  public fullText?: fullTextProp;

  private fullTextLoader: fullTextLoader;

  constructor(props: Props) {
    const { language, totalPages, fullText, generatedToc, ...baseProps } = props;
    super({ ...baseProps });
    this.language = language;
    this.totalPages = totalPages;
    this.fullTextLoader = fullText;
    this.generatedToc = generatedToc;
    if (typeof fullText !== 'function') {
      this.fullText = fullText;
    }
  }

  async getFullText() {
    if (typeof this.fullTextLoader === 'function' && !this.fullText) {
      this.fullText = await this.fullTextLoader();
    }
    return this.fullText;
  }

  static fromDocument(
    document: Document,
    pdfInfo: {
      language: LanguageISO6391;
      totalPages: number;
      fullText: fullTextProp;
    }
  ) {
    return new ProcessedDocument({ ...document, ...pdfInfo, generatedToc: false });
  }
}
