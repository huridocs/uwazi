import { Attachment } from '../Attachment';
import { DiskFile } from '../DiskFile';
import { Document } from '../Document';
import { FileContents } from '../FileContents';
import { ProcessedDocument } from '../ProcessedDocument';
import { Thumbnail } from '../Thumbnail';
import { URLAttachment } from '../URLAttachment';

type PartialFirstConstructorArg<T> = T extends new (arg: infer A, ...args: any[]) => any
  ? A extends object
    ? Partial<A>
    : A
  : never;

export class FileBuilder {
  static document(id: string, props?: PartialFirstConstructorArg<typeof Document>) {
    return new Document({
      id,
      entity: 'entity1',
      originalname: 'doc.pdf',
      filename: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      creationDate: 1234567890,
      status: 'processing',
      content: new DiskFile('fake/path').toContent(),
      ...props,
    });
  }

  static processedDocument(
    id: string,
    props?: PartialFirstConstructorArg<typeof ProcessedDocument>
  ) {
    return new ProcessedDocument({
      id,
      entity: 'entity1',
      originalname: 'doc.pdf',
      filename: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      creationDate: 1234567890,
      content: new DiskFile('fake/path').toContent(),
      language: 'en',
      totalPages: 10,
      fullText: {},
      ...props,
    });
  }

  static urlAttachment(id: string, props?: PartialFirstConstructorArg<typeof URLAttachment>) {
    return new URLAttachment({
      id,
      entity: 'entity2',
      url: 'http://example.com/file.pdf',
      originalname: 'file.pdf',
      filename: 'file.pdf',
      mimetype: 'application/pdf',
      size: 2048,
      creationDate: 1234567891,
      content: new DiskFile('fake/path').toContent(),
      ...props,
    });
  }

  static attachment(id: string, props?: PartialFirstConstructorArg<typeof Attachment>) {
    return new Attachment({
      id,
      entity: 'entity2',
      originalname: 'file.pdf',
      filename: 'file.pdf',
      mimetype: 'application/pdf',
      size: 2048,
      creationDate: 1234567891,
      content: new DiskFile('fake/path').toContent(),
      ...props,
    });
  }

  static thumbnail(id: string, props?: PartialFirstConstructorArg<typeof Thumbnail>) {
    return new Thumbnail({
      id,
      entity: 'entity3',
      language: 'es',
      originalname: 'thumb.jpg',
      filename: 'thumb.jpg',
      mimetype: 'image/jpeg',
      size: 3072,
      creationDate: 1234567892,
      content: new DiskFile('fake/path').toContent(),
      ...props,
    });
  }

  static content(content: string) {
    return new FileContents(async function* streamCallback() {
      const encoder = new TextEncoder();
      yield encoder.encode(content);
    });
  }
}
