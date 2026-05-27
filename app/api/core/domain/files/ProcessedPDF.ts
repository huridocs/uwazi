import { z } from 'zod';
import { ProcessedPDFDTO } from './domainTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ObjectUtils } from '#api/common.v2/utils/Object.js';
import { BaseFile, BaseFileProps } from './BaseFile.js';
import { FileContents } from './FileContents.js';
import { FileWithContents } from './FileWithContents.js';

type FullText = Record<string, string>;

type FullTextLoader = FullText | (() => Promise<FullText>);

type TableOfContent = {
  selectionRectangles?: {
    top: number;
    left: number;
    width: number;
    height: number;
    page?: string;
  }[];
  label?: string;
  indentation?: number;
};

type Props = BaseFileProps & {
  entity: string;
  content: FileContents;
  language: LanguageISO6391;
  totalPages: number;
  generatedToc: boolean;
  fullText: FullTextLoader;
  toc?: TableOfContent[];
};

const IMMUTABLE_PROCESSED_PDF_KEYS = [
  'fullText',
  'entity',
  'totalPages',
] as const satisfies ReadonlyArray<keyof Props>;


const Schema = z.object({
  entity: z.string().trim().min(1),
  language: z.string().trim().min(2) as z.ZodType<LanguageISO6391>,
  totalPages: z.number().int().min(0).default(0),
  generatedToc: z.boolean().default(false),
});

type UpdateableProps = {
  originalname?: string;
  toc?: TableOfContent[];
  generatedToc?: boolean;
  language?: LanguageISO6391;
};

export class ProcessedPDF extends FileWithContents<Props> {
  readonly entity: string;

  protected _type = 'document' as const;

  readonly language: LanguageISO6391;

  readonly totalPages: number;

  readonly generatedToc: boolean;

  readonly toc?: TableOfContent[];

  public fullText?: FullText;

  private fullTextLoader: FullTextLoader;

  private _languageHasChanged = false;

  get languageHasChanged(): boolean {
    return this._languageHasChanged;
  }

  languageChanged(): void {
    this._languageHasChanged = true;
  }

  constructor(props: Props) {
    const validated = Schema.parse(props);
    super({ ...props, ...validated });
    this.language = validated.language;
    this.totalPages = validated.totalPages;
    this.generatedToc = validated.generatedToc;
    this.entity = validated.entity;

    this.fullTextLoader = props.fullText;
    this.toc = props.toc;
    if (typeof props.fullText !== 'function') {
      this.fullText = props.fullText;
    }
  }

  update(props: UpdateableProps): this {
    const updated = super.update(ObjectUtils.sanitize(props as Partial<Props>, IMMUTABLE_PROCESSED_PDF_KEYS) as Partial<Props>);
    if (this.language !== updated.language) {
      updated.languageChanged();
    }

    return updated;
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
      ...(this.toc !== undefined ? { toc: this.toc } : {}),
      type: 'document',
      status: 'ready',
    };
  }
}

export type { FullText, TableOfContent, Props as ProcessedPDFProps };
