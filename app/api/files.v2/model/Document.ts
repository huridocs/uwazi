import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFile } from './BaseFile';

export class Document extends BaseFile {
  readonly filename: string;

  readonly language: LanguageISO6391;

  constructor(
    id: string,
    entity: string,
    totalPages: number,
    filename: string,
    language: LanguageISO6391
  ) {
    super(id, entity, totalPages);
    this.filename = filename;
    this.language = language;
  }
}
