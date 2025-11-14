import { DiskFile } from 'api/files.v2/model/DiskFile';
import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
import { FileBuilder } from 'api/files.v2/specs/FileBuilder';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { ObjectId } from 'mongodb';
import { Attachment } from '../../model/Attachment';
import { CustomUpload } from '../../model/CustomUpload';
import { Document } from '../../model/Document';
import { URLAttachment } from '../../model/URLAttachment';
import { FileMappers } from '../FilesMappers';
import {
  AttachmentDBO,
  DocumentDBO,
  fileDBO,
  ProcessedDocumentDBO,
  ThumbnailDBO,
} from '../schemas/filesTypes';

const f = getFixturesFactory();

describe('FileMappers', () => {
  describe('toDBO', () => {
    it('should map Document to FileDBOType', () => {
      const document = FileBuilder.document(f.idString('docId'));
      const result = FileMappers.toDBO(document) as DocumentDBO;

      expect(result).toMatchObject({
        _id: f.id('docId'),
        entity: 'entity1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        status: 'processing',
      });
    });

    it('should map ProcessedDocument to FileDBOType', () => {
      const document = FileBuilder.processedDocument(f.idString('docId'));
      const result = FileMappers.toDBO(document) as ProcessedDocumentDBO;

      expect(result._id.toString()).toBe(f.idString('docId'));

      expect(result).toMatchObject({
        _id: f.id('docId'),
        entity: 'entity1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        totalPages: 10,
        language: 'eng',
        status: 'ready',
      });
    });

    it('should map URLAttachment to FileDBOType', () => {
      const urlAttachment = FileBuilder.urlAttachment(f.idString('urlAttachment'));
      const result = FileMappers.toDBO(urlAttachment) as AttachmentDBO;

      expect(result).toMatchObject({
        entity: 'entity2',
        url: 'http://example.com/file.pdf',
        originalname: 'file.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1234567891,
        type: 'attachment',
      });
    });

    it('should map Attachment to FileDBOType', () => {
      const attachment = FileBuilder.attachment(f.idString('attId'), { entity: 'entity3' });
      const result = FileMappers.toDBO(attachment) as AttachmentDBO;

      expect(result._id.toString()).toBe(f.idString('attId'));
      expect(result).toMatchObject({
        entity: 'entity3',
        url: '',
        originalname: 'file.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1234567891,
        type: 'attachment',
      });
    });

    it('should map Thumbnail to FileDBOType', () => {
      const attachment = FileBuilder.thumbnail(f.idString('thumbId'));
      const result = FileMappers.toDBO(attachment) as ThumbnailDBO;

      expect(result._id.toString()).toBe(f.idString('thumbId'));
      expect(result.entity).toBe('entity3');
      expect(result.originalname).toBe('thumb.jpg');
      expect(result.filename).toBe('thumb.jpg');
      expect(result.mimetype).toBe('image/jpeg');
      expect(result.size).toBe(3072);
      expect(result.creationDate).toBe(1234567892);
      expect(result.type).toBe('thumbnail');
    });

    it('should handle language conversion fallback', () => {
      const document = FileBuilder.processedDocument(f.idString('processed'));

      const result = FileMappers.toDBO(document) as ProcessedDocumentDBO;

      expect(result.language).toBe('eng');
    });

    it('should handle language conversion fallback when language is undefined', () => {
      const document = FileBuilder.processedDocument(f.idString('processed'), {
        language: undefined,
      });

      const result = FileMappers.toDBO(document) as ProcessedDocumentDBO;

      expect(result.language).toBe('other');
    });

    it('should throw error for unknown file type', () => {
      const unknownFile = {} as any;

      expect(() => FileMappers.toDBO(unknownFile)).toThrow('Unknown file type');
    });
  });

  describe('toModel', () => {
    it('should map to URLAttachment when type is attachment and url is present', () => {
      const dbo: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'attachment',
        entity: 'entity2',
        url: 'http://example.com',
      };

      const result = FileMappers.toModel(dbo, new DiskFile('mock/path').toContent());

      expect(result).toBeInstanceOf(URLAttachment);

      expect(result as URLAttachment).toMatchObject({
        id: dbo._id.toString(),
        entity: dbo.entity,
        url: dbo.url,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
      });
    });

    it('should map to Attachment when type is attachment and url is not present', () => {
      const dbo: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'attachment',
        entity: 'entity3',
      };

      const result = FileMappers.toModel<Attachment>(dbo, new DiskFile('mock/path').toContent());

      expect(result).toBeInstanceOf(Attachment);

      expect(result as Attachment).toMatchObject({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
      });
    });

    it('should map to CustomUpload when type is custom', () => {
      const dbo: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'custom',
      };

      const result = FileMappers.toModel(dbo, new DiskFile('mock/path').toContent());

      expect(result).toBeInstanceOf(CustomUpload);
      expect(result.id).toBe(dbo._id.toString());
      expect(result.originalname).toBe(dbo.originalname);
      expect(result.filename).toBe(dbo.filename);
      expect(result.mimetype).toBe(dbo.mimetype);
      expect(result.size).toBe(dbo.size);
      expect(result.creationDate).toBe(dbo.creationDate);
    });

    it('should map to Thumbnail when type is thumbnail', () => {
      const dbo: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'thumbnail',
        entity: 'entity1',
        language: 'spa',
      };

      const thumbnail = FileMappers.toModel<Thumbnail>(dbo, new DiskFile('mock/path').toContent());

      expect(thumbnail).toBeInstanceOf(Thumbnail);

      expect(thumbnail).toMatchObject({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
        language: 'es',
      });
    });

    it('should map to Document when type is document', () => {
      const dbo: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        entity: 'entity1',
        status: 'processing',
      };

      const result = FileMappers.toModel(dbo, new DiskFile('mock/path').toContent());

      expect(result).toBeInstanceOf(Document);

      expect(result as Document).toMatchObject({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
        status: dbo.status,
      });
    });

    it('should map to ProcessingDocument when type is document and status ready', () => {
      const dbo: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        entity: 'entity1',
        status: 'ready',
        language: 'eng',
        totalPages: 1,
        fullText: { 1: 'text' },
      };

      const result = FileMappers.toModel(dbo, new DiskFile('mock/path').toContent());

      expect(result).toBeInstanceOf(ProcessedDocument);
      const document = result as Document;

      expect(document).toMatchObject({
        id: dbo._id.toString(),
        entity: dbo.entity,
        originalname: dbo.originalname,
        filename: dbo.filename,
        mimetype: dbo.mimetype,
        size: dbo.size,
        creationDate: dbo.creationDate,
        fullText: dbo.fullText,
        totalPages: dbo.totalPages,
        language: 'en',
      });
    });

    it('should handle different types correctly', () => {
      const documentDBO: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        entity: 'entity1',
        totalPages: 10,
        language: 'eng',
        status: 'ready',
      };
      const anotherDocumentDBO: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        entity: 'entity1',
        status: 'failed',
      };

      const documentResult = FileMappers.toModel(
        documentDBO,
        new DiskFile('mock/path').toContent()
      );
      const anotherResult = FileMappers.toModel(
        anotherDocumentDBO,
        new DiskFile('mock/path').toContent()
      );

      expect(documentResult).toBeInstanceOf(ProcessedDocument);
      expect(anotherResult).toBeInstanceOf(Document);
    });
  });
});
