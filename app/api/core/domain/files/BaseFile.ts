import { z } from 'zod';
import stringify from 'fast-json-stable-stringify';
import { fileDBO, fileDTO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { FileTypes } from '#api/files/storage.js';
import { FileContents } from './FileContents.js';

type BaseFileProps = {
  id: string;
  originalname?: string;
  filename: string;
  mimetype: string;
  size?: number;
  creationDate?: number;
  uploaded?: boolean;
};

type FileContentLoader = (options: { type: fileDBO['type']; filename: string }) => FileContents;

const sanitizeFilename = (filename: string) => {
  let sanitized = filename;
  let prev;

  // Loop until no more changes (defense against pattern regeneration)
  do {
    prev = sanitized;
    // Remove any sequence of dots followed by path separator (./, ../, .../, etc.)
    sanitized = sanitized
      .replace(/\.+[\\\/]/g, '')
      // Remove any remaining path separators
      .replace(/[\\\/]/g, '')
      // Remove null bytes
      .replace(/\0/g, '');
  } while (prev !== sanitized);

  return sanitized;
};

const Schema = z.object({
  id: z.string().min(1, 'File ID is required'),
  originalname: z
    .string()
    .trim()
    .min(1, 'Original filename is required')
    .max(255, 'Original filename is too long')
    .transform(sanitizeFilename),
  filename: z
    .string()
    .trim()
    .min(1, 'Filename is required')
    .max(255, 'Filename is too long')
    .transform(sanitizeFilename),
  mimetype: z
    .string()
    .trim()
    .min(1, 'MIME type is required')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_+-]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]*(;\s*[\w-]+=[\w-]+)*$/,
      'Invalid MIME type format'
    ),
  size: z.number().int('File size must be an integer'),
  creationDate: z.number().int('Creation date must be an integer'),
  uploaded: z.boolean().optional(),
});

export abstract class BaseFile<TProps extends BaseFileProps = BaseFileProps> {
  readonly id: string;

  originalname: string;

  filename: string;

  readonly mimetype: string;

  readonly size: number;

  readonly creationDate: number;

  readonly uploaded?: boolean;

  protected abstract _type: FileTypes;

  protected props: TProps;

  private previousProps?: TProps;

  constructor(props: TProps) {
    const validated = Schema.parse({
      id: props.id,
      originalname: props.originalname ?? props.filename,
      filename: props.filename,
      mimetype: props.mimetype,
      size: props.size ?? 0,
      creationDate: props.creationDate ?? 0,
      uploaded: props.uploaded,
    });

    this.props = { ...props, ...validated } as TProps;

    this.id = validated.id;
    this.originalname = validated.originalname;
    this.filename = validated.filename;
    this.mimetype = validated.mimetype;
    this.size = validated.size;
    this.creationDate = validated.creationDate;
    this.uploaded = validated.uploaded;
  }

  get type() {
    return this._type;
  }

  protected clone(updateProps: Partial<TProps>): this {
    const newProps = { ...this.props, ...updateProps };

    const instance = new (this.constructor as any)(newProps) as this;

    instance.previousProps = this.props;

    return instance;
  }

  get previousVersion(): this | undefined {
    if (!this.previousProps) {
      return undefined;
    }

    return new (this.constructor as any)(this.previousProps) as this;
  }

  get hasChanged(): boolean {
    if (this.previousProps === undefined) return false;

    return stringify(this.props) !== stringify(this.previousProps);
  }

  update(updateProps: Partial<TProps>): this {
    return this.clone(updateProps);
  }

  abstract isEntityFile(): this is Omit<this, 'entity'> & { entity: string };

  abstract hasContent(): this is this;

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

  static fromDBO?(dbo: fileDBO, contentLoader: FileContentLoader): BaseFile<BaseFileProps>;
}

export type { BaseFileProps, FileContentLoader };
