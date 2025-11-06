import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & {
  entity: string;
  status: 'processing' | 'failed' | 'ready';
  // language: LanguageISO6391;
  // totalPages: number;
  // fullText?: {
  //   [k: string]: string;
  // };
  // generatedToc?: boolean;
  // toc?: TocSchema[];
  // extractedMetadata?: ExtractedMetadataSchema[];
};

export class Document extends BaseFile {
  readonly entity: string;

  readonly language?: LanguageISO6391;

  readonly status: 'processing' | 'failed' | 'ready';

  readonly totalPages?: number;

  readonly fullText?: { [k: string]: string };
  // readonly generatedToc?: boolean;
  // readonly toc?: TocSchema;
  // readonly extractedMetadata?: ExtractedMetadataSchema;

  constructor(props: Props) {
    const { entity, status, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
    this.status = status;
  }
}
