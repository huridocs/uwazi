type Props = {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
  uploaded?: boolean;
};

export class BaseFile {
  readonly id: string;

  readonly originalname: string;

  readonly filename: string;

  readonly mimetype: string;

  readonly size: number;

  readonly creationDate: number;

  readonly uploaded?: boolean;

  constructor(props: Props) {
    this.id = props.id;
    this.originalname = props.originalname;
    this.filename = props.filename;
    this.mimetype = props.mimetype;
    this.size = props.size;
    this.creationDate = props.creationDate;
  }
}

export type { Props as BaseFileProps };
