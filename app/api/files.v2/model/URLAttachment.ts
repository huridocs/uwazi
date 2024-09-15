import { BaseFile } from './BaseFile';

export class URLAttachment extends BaseFile {
  readonly url: string;

  constructor(id: string, entity: string, totalPages: number, url: string) {
    super(id, entity, totalPages);
    this.url = url;
  }
}
