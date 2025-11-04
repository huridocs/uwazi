import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & {
  entity: string;
  language: LanguageISO6391;
  status: 'processing' | 'failed' | 'ready';
  totalPages: number;
  fullText?: {
    [k: string]: string;
  };
  // generatedToc?: boolean;
  // toc?: TocSchema[];
  // extractedMetadata?: ExtractedMetadataSchema[];
};

export class Document extends BaseFile {
  readonly entity: string;

  readonly language: LanguageISO6391;

  readonly status: 'processing' | 'failed' | 'ready';

  readonly totalPages: number;

  readonly fullText?: { [k: string]: string };
  // readonly generatedToc?: boolean;
  // readonly toc?: TocSchema;
  // readonly extractedMetadata?: ExtractedMetadataSchema;

  constructor(props: Props) {
    const { entity, language, status, totalPages, fullText, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
    this.language = language;
    this.status = status;
    this.totalPages = totalPages;
    this.fullText = fullText;
  }
}
