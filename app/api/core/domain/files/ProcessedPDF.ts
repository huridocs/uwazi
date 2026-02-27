import {
  ProcessedPDFDBO,
  ProcessedPDFDTO,
} from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BaseFile, BaseFileProps, FileContentLoader } from './BaseFile.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';

type fullTextProp = { [k: string]: string };

type fullTextLoader = fullTextProp | (() => Promise<fullTextProp>);

type Props = BaseFileProps & {
  entity: string;
  content: FileContents;
  language: LanguageISO6391;
  totalPages: number;
  generatedToc: boolean;
  fullText: fullTextLoader;
};

export class ProcessedPDF extends FileWithContents {
  readonly entity: string;

  protected _type = 'document' as const;

  readonly language: LanguageISO6391;

  readonly totalPages: number;

  readonly generatedToc: boolean;

  public fullText?: fullTextProp;

  private fullTextLoader: fullTextLoader;

  constructor(props: Props) {
    const { entity, language, totalPages, fullText, generatedToc, ...baseProps } = props;
    super(baseProps);
    this.language = language;
    this.totalPages = totalPages;
    this.fullTextLoader = fullText;
    this.generatedToc = generatedToc;
    this.entity = entity;
    if (typeof fullText !== 'function') {
      this.fullText = fullText;
    }

    this.props = { ...this.props, entity, language, totalPages, fullText, generatedToc } as Props;
  }

  async getFullText() {
    if (typeof this.fullTextLoader === 'function' && !this.fullText) {
      this.fullText = await this.fullTextLoader();
    }
    return this.fullText;
  }

  toDTO(): ProcessedPDFDTO {
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      totalPages: this.totalPages,
      language: LanguageUtils.fromISO639_1(this.language).ISO639_3,
      ...(this.fullText ? { fullText: this.fullText } : {}),
      generatedToc: this.generatedToc,
      type: 'document',
      status: 'ready',
    };
  }

  static fromDBO(dbo: ProcessedPDFDBO, contentLoader: FileContentLoader) {
    return new ProcessedPDF({
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
}

export type { fullTextProp };
