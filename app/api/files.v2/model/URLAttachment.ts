import { BaseFile } from './BaseFile';

export class URLAttachment extends BaseFile {
  readonly url: string;

  constructor(filename: string, entity: string, totalPages: number, url: string) {
    super(filename, entity, totalPages);
    this.url = url;
  }
}
