import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';

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
