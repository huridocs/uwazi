import {
  ProcessedDocumentDBO,
  ProcessedDocumentDTO,
} from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { LanguageUtils } from 'shared/language';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseDocument, BaseDocumentProps } from './BaseDocument';
import { BaseFile, FileContentLoader } from './BaseFile';
import { Document } from './Document';

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

  toDTO(): ProcessedDocumentDTO {
    return {
      _id: this.id,
      originalname: this.originalname,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
      creationDate: this.creationDate,
      entity: this.entity,
      totalPages: this.totalPages,
      language: LanguageUtils.fromISO639_1(this.language).ISO639_3,
      ...(this.fullText ? { fullText: this.fullText } : {}),
      generatedToc: this.generatedToc,
      type: 'document',
      status: 'ready',
    };
  }

  static fromDBO(dbo: ProcessedDocumentDBO, contentLoader: FileContentLoader) {
    return new ProcessedDocument({
      ...BaseFile.dboCommonFields(dbo),
      content: contentLoader({ type: dbo.type, filename: dbo.filename }),
      entity: dbo.entity,
      language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1,
      totalPages: dbo.totalPages,
      fullText:
        dbo.fullText ||
        (async () => {
          throw new Error('not Implemented');
        }),
      generatedToc: dbo.generatedToc,
    });
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
