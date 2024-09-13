import { BaseFile } from './BaseFile';

export class URLAttachment extends BaseFile {
  readonly url: string;

  constructor(id: string, filename: string, entity: string, totalPages: number, url: string) {
    super(id, filename, entity, totalPages);
    this.url = url;
  }
}
