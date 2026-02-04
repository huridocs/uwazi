import { FileAttachment } from '../FileAttachment.js';
import { CustomUpload } from '../CustomUpload.js';
import { ProcessingPDF } from '../ProcessingPDF.js';
import { FileContents } from '../FileContents.js';
import { ProcessedPDF } from '../ProcessedPDF.js';
import { Thumbnail } from '../Thumbnail.js';
import { URLAttachment } from '../URLAttachment.js';

type PartialFirstConstructorArg<T> = T extends new (arg: infer A, ...args: any[]) => any
  ? A extends object
    ? Partial<A>
    : A
  : never;

export class FileBuilder {
  static document(id: string, props?: PartialFirstConstructorArg<typeof ProcessingPDF>) {
    return new ProcessingPDF({
      id,
      entity: 'entity1',
      originalname: 'doc.pdf',
      filename: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      creationDate: 1234567890,
      status: 'processing',
      content: FileBuilder.content('document'),
      ...props,
    });
  }

  static processedDocument(id: string, props?: PartialFirstConstructorArg<typeof ProcessedPDF>) {
    return new ProcessedPDF({
      id,
      entity: 'entity1',
      originalname: 'doc.pdf',
      filename: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      creationDate: 1234567890,
      content: FileBuilder.content('document'),
      language: 'en',
      totalPages: 10,
      generatedToc: false,
      fullText: async () => ({ 1: 'fullText' }),
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
      ...props,
    });
  }

  static attachment(id: string, props?: PartialFirstConstructorArg<typeof FileAttachment>) {
    return new FileAttachment({
      id,
      entity: 'entity2',
      originalname: 'file.pdf',
      filename: 'file.pdf',
      mimetype: 'application/pdf',
      size: 2048,
      creationDate: 1234567891,
      content: FileBuilder.content('attachment'),
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
      content: FileBuilder.content('thumbnail'),
      ...props,
    });
  }

  static customUpload(id: string, props?: PartialFirstConstructorArg<typeof Thumbnail>) {
    return new CustomUpload({
      id,
      language: 'es',
      originalname: 'thumb.jpg',
      filename: 'thumb.jpg',
      mimetype: 'image/jpeg',
      size: 3072,
      creationDate: 1234567892,
      content: FileBuilder.content('customUpload'),
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
