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
  content: FileContents;
};

export abstract class BaseFile {
  readonly id: string;

  readonly originalname: string;

  readonly filename: string;

  readonly mimetype: string;

  readonly size: number;

  readonly creationDate: number;

  readonly content: FileContents;

  readonly uploaded?: boolean;

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
}

export type { Props as BaseFileProps };
