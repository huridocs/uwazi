import { FileWithContents } from './FileWithContents';

export class CustomUpload extends FileWithContents {
  protected _type = 'custom' as const;
}
