import { z } from 'zod';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ObjectUtils } from '#api/common.v2/utils/Object.js';
import { BaseFile, BaseFileProps } from './BaseFile.js';
import { FileContents } from './FileContents.js';
import { FullText, FileUpdateInput, PDFDocumentDTO, TableOfContent } from './domainTypes.js';

type FullTextLoader = FullText | (() => Promise<FullText>);

type Props = BaseFileProps & {
  entity: string;
  content: FileContents;
  status: 'processing' | 'failed' | 'ready';
  language?: LanguageISO6391;
  totalPages?: number;
  generatedToc?: boolean;
  fullText?: FullTextLoader;
  toc?: TableOfContent[];
};

type ReadyProps = Props & {
  status: 'ready';
  language: LanguageISO6391;
  totalPages: number;
  generatedToc: boolean;
  fullText: FullTextLoader;
};

const Schema = z
  .object({
    entity: z.string().trim().min(1),
    status: z.enum(['processing', 'failed', 'ready']),
    language: (z.string().trim().min(2) as z.ZodType<LanguageISO6391>).optional(),
    totalPages: z.number().int().min(0).default(0),
    generatedToc: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'ready') {
      if (!data.language || data.language.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 2,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'String must contain at least 2 character(s)',
          path: ['language'],
        });
      }
    }
  });

const IMMUTABLE_PDF_KEYS = ['fullText', 'entity', 'totalPages'] as const satisfies ReadonlyArray<
  keyof Props
>;

export class PDFDocument extends BaseFile<Props> {
  readonly entity: string;

  override get content(): FileContents {
    return this.props.content;
  }

  protected _type = 'document' as const;

  status: 'processing' | 'failed' | 'ready';

  readonly language?: LanguageISO6391;

  readonly totalPages?: number;

  readonly generatedToc?: boolean;

  readonly toc?: TableOfContent[];

  public fullText?: FullText;

  private fullTextLoader?: FullTextLoader;

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
    this.entity = validated.entity;
    this.status = validated.status;
    this.language = validated.language;
    this.totalPages = validated.totalPages;
    this.generatedToc = validated.generatedToc;
    this.toc = props.toc;

    this.fullTextLoader = props.fullText;
    if (typeof props.fullText !== 'function') {
      this.fullText = props.fullText;
    }
  }

  isReady(): this is this & {
    status: 'ready';
    language: LanguageISO6391;
    totalPages: number;
    generatedToc: boolean;
  } {
    return (
      this.status === 'ready' &&
      this.language !== undefined &&
      this.totalPages !== undefined &&
      this.generatedToc !== undefined
    );
  }

  isProcessing(): this is this & { status: 'processing' | 'failed' } {
    return this.status === 'processing' || this.status === 'failed';
  }

  failed(): PDFDocument {
    return new PDFDocument({ ...this.props, status: 'failed' });
  }

  processed(pdfInfo: {
    language: LanguageISO6391;
    totalPages: number;
    fullText: FullText;
  }): PDFDocument {
    const doc = new PDFDocument({
      ...this.props,
      status: 'ready',
      language: pdfInfo.language,
      totalPages: pdfInfo.totalPages,
      fullText: pdfInfo.fullText,
      generatedToc: false,
    });
    doc.languageChanged();
    return doc;
  }

  override update(input: FileUpdateInput): this {
    const sanitized = ObjectUtils.sanitize(
      {
        originalname: input.originalname,
        language: input.language,
        toc: input.toc,
        generatedToc: input.generatedToc,
      } as Partial<Props>,
      IMMUTABLE_PDF_KEYS
    );

    const updated = this.clone(sanitized as Partial<Props>);

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

  toDTO(): PDFDocumentDTO {
    if (this.isReady()) {
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
    return {
      ...this.dtoBaseFields(),
      entity: this.entity,
      status: this.status as 'processing' | 'failed',
      type: 'document',
    };
  }
}

export type {
  FullText,
  FullTextLoader,
  TableOfContent,
  Props as PDFDocumentProps,
  ReadyProps as ReadyPDFDocumentProps,
};
