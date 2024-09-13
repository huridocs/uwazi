export class BaseFile {
  readonly filename: string;

  readonly entity: string;

  readonly totalPages: number;

  constructor(filename: string, entity: string, totalPages: number) {
    this.filename = filename;
    this.entity = entity;
    this.totalPages = totalPages;
  }
}
