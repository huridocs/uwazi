/* eslint-disable max-statements */
import { fileDBO, fileDTO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { FileTypes } from 'api/files/storage';
import { z } from 'zod';
import stringify from 'fast-json-stable-stringify';
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

type FileContentLoader = (options: { type: fileDBO['type']; filename: string }) => FileContents;

type UpdateProps = {
  originalname?: string;
};

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
  content: z.any().optional(),
  entity: z.union([z.string().min(1, 'Entity ID must not be empty'), z.undefined()]),
});

export abstract class BaseFile {
  readonly id: string;

  originalname: string;

  filename: string;

  readonly mimetype: string;

  readonly size: number;

  readonly creationDate: number;

  readonly content?: FileContents;

  readonly uploaded?: boolean;

  readonly entity?: string;

  protected abstract _type: FileTypes;

  protected props: Props;

  private previousProps?: Props;

  constructor(props: Props) {
    const _props = Schema.parse({
      ...props,
      originalname: props.originalname ?? props.filename,
      creationDate: props.creationDate ?? 0,
      size: props.size ?? 0,
    });

    this.props = _props;

    this.id = _props.id;
    this.originalname = _props.originalname;
    this.filename = _props.filename;
    this.mimetype = _props.mimetype;
    this.size = _props.size;
    this.creationDate = _props.creationDate;
    this.content = _props.content;
    this.uploaded = _props.uploaded;
    this.entity = _props.entity;
  }

  get type() {
    return this._type;
  }

  private clone(props: Partial<Props>): BaseFile {
    const newProps: Props = {
      id: this.id,
      creationDate: this.creationDate,

      filename: props.filename ?? this.filename,
      mimetype: props.mimetype ?? this.mimetype,
      originalname: props.originalname ?? this.originalname,
      size: props.size ?? this.size,
      uploaded: props.uploaded ?? this.uploaded,
      content: props.content ?? this.content,
      entity: props.entity ?? this.entity,
    };

    const instance = new (this.constructor as any)(newProps) as BaseFile;

    instance.previousProps = this.props;

    return instance;
  }

  get previousVersion(): BaseFile | undefined {
    if (!this.previousProps) {
      return undefined;
    }

    return new (this.constructor as any)(this.previousProps) as BaseFile;
  }

  get hasChanged() {
    if (this.previousProps === undefined) return false;

    return stringify(this.props) !== stringify(this.previousProps);
  }

  update(props: UpdateProps): BaseFile {
    return this.clone(props);
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

export type { Props as BaseFileProps, FileContentLoader };
