import { fileDBO, fileDTO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { FileTypes } from 'api/files/storage';
import { z } from 'zod';
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
      /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_+-]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]*$/,
      'Invalid MIME type format'
    ),
  size: z.number().int('File size must be an integer').positive('File size must be greater than 0'),
  creationDate: z
    .number()
    .int('Creation date must be an integer')
    .positive('Creation date must be a valid timestamp'),
  uploaded: z.boolean().optional(),
  content: z.any().optional(),
  entity: z.union([z.string().min(1, 'Entity ID must not be empty'), z.undefined()]),
});

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
    const validated = Schema.parse({
      ...props,
      originalname: props.originalname ?? props.filename,
    });

    this.id = validated.id;
    this.originalname = validated.originalname;
    this.filename = validated.filename;
    this.mimetype = validated.mimetype;
    this.size = validated.size;
    this.creationDate = validated.creationDate;
    this.content = validated.content;
    this.uploaded = validated.uploaded;
    this.entity = validated.entity;
  }

  get type() {
    return this._type;
  }

  private clone(props: Partial<Props>): BaseFile {
    return new (this.constructor as any)({
      id: this.id,
      creationDate: this.creationDate,

      filename: props.filename ?? this.filename,
      mimetype: props.mimetype ?? this.mimetype,
      originalname: props.originalname ?? this.originalname,
      size: props.size ?? this.size,
      uploaded: props.uploaded ?? this.uploaded,
      content: props.content ?? this.content,
      entity: props.entity ?? this.entity,
    } as Props);
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
