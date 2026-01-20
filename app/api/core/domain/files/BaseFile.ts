import { fileDBO, fileDTO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { FileTypes } from '#api/files/storage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';

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

export type FileContentLoader = (options: {
  type: fileDBO['type'];
  filename: string;
}) => FileContents;

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

  protected dtoBaseFields() {
    return {
      _id: this.id,
      originalname: this.originalname,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
      creationDate: this.creationDate,
    };
  }

  abstract toDTO(): fileDTO;

  static dboCommonFields(dbo: fileDBO) {
    return {
      id: dbo._id.toString(),
      originalname: dbo.originalname,
      filename: dbo.filename,
      mimetype: dbo.mimetype,
      size: dbo.size,
      creationDate: dbo.creationDate,
    };
  }

  static fromDBO?(dbo: fileDBO, contentLoader: FileContentLoader): BaseFile;
}

export type { Props as BaseFileProps };
