import { BaseFile } from './BaseFile';

export class CustomUpload extends BaseFile {
  protected _type = 'custom' as const;
}
