export class BaseFile {
  readonly id: string;

  readonly filename: string;

  readonly entity: string;

  readonly totalPages: number;

  constructor(id: string, filename: string, entity: string, totalPages: number) {
    this.id = id;
    this.filename = filename;
    this.entity = entity;
    this.totalPages = totalPages;
  }
}
