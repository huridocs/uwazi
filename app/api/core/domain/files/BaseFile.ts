import { FileTypes } from 'api/files/storage';
import { FileContents } from './FileContents';

type Props = {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
  uploaded?: boolean;
  content?: FileContents;
  entity?: string;
};

export abstract class BaseFile {
  readonly id: string;

  readonly originalname: string;

  readonly filename: string;

  readonly mimetype: string;

  readonly size: number;

  readonly creationDate: number;

  readonly content?: FileContents;

  readonly uploaded?: boolean;

  readonly entity?: string;

  protected abstract _type: FileTypes;

  constructor(props: Props) {
    this.id = props.id;
    this.originalname = props.originalname;
    this.filename = props.filename;
    this.mimetype = props.mimetype;
    this.size = props.size;
    this.creationDate = props.creationDate;
    this.content = props.content;
  }

  get type() {
    return this._type;
  }

  isEntityFile(): this is this & { entity: string } {
    return Boolean(this.entity);
  }

  hasContent(): this is this & { content: FileContents } {
    return Boolean(this.content);
  }
}

export type { Props as BaseFileProps };
