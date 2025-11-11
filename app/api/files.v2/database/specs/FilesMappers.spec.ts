import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
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
      const document = new Document({
        id: f.idString('docId'),
        entity: 'entity1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        status: 'processing',
      });

      const result = FileMappers.toDBO(document) as DocumentDBO;

      expect(result._id.toString()).toBe(f.idString('docId'));
      expect(result.entity).toBe('entity1');
      expect(result.originalname).toBe('doc.pdf');
      expect(result.filename).toBe('doc.pdf');
      expect(result.mimetype).toBe('application/pdf');
      expect(result.size).toBe(1024);
      expect(result.creationDate).toBe(1234567890);
      expect(result.type).toBe('document');
      expect(result.status).toBe('processing');
    });

    it('should map ProcessedDocument to FileDBOType', () => {
      const document = new ProcessedDocument({
        id: f.idString('docId'),
        entity: 'entity1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        language: 'en',
        totalPages: 10,
        fullText: {},
      });

      const result = FileMappers.toDBO(document) as ProcessedDocumentDBO;

      expect(result._id.toString()).toBe(f.idString('docId'));
      expect(result.entity).toBe('entity1');
      expect(result.originalname).toBe('doc.pdf');
      expect(result.filename).toBe('doc.pdf');
      expect(result.mimetype).toBe('application/pdf');
      expect(result.size).toBe(1024);
      expect(result.creationDate).toBe(1234567890);
      expect(result.type).toBe('document');
      expect(result.totalPages).toBe(10);
      expect(result.language).toBe('eng');
      expect(result.status).toBe('ready');
    });

    it('should map URLAttachment to FileDBOType', () => {
      const urlAttachment = new URLAttachment({
        id: f.idString('urlId'),
        entity: 'entity2',
        url: 'http://example.com/file.pdf',
        originalname: 'file.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1234567891,
      });

      const result = FileMappers.toDBO(urlAttachment) as AttachmentDBO;

      expect(result._id.toString()).toBe(f.idString('urlId'));
      expect(result.entity).toBe('entity2');
      expect(result.url).toBe('http://example.com/file.pdf');
      expect(result.originalname).toBe('file.pdf');
      expect(result.filename).toBe('file.pdf');
      expect(result.mimetype).toBe('application/pdf');
      expect(result.size).toBe(2048);
      expect(result.creationDate).toBe(1234567891);
      expect(result.type).toBe('attachment');
    });

    it('should map Attachment to FileDBOType', () => {
      const attachment = new Attachment({
        id: f.idString('attId'),
        entity: 'entity3',
        originalname: 'attach.pdf',
        filename: 'attach.pdf',
        mimetype: 'application/pdf',
        size: 3072,
        creationDate: 1234567892,
      });

      const result = FileMappers.toDBO(attachment) as AttachmentDBO;

      expect(result._id.toString()).toBe(f.idString('attId'));
      expect(result.entity).toBe('entity3');
      expect(result.url).toBe('');
      expect(result.originalname).toBe('attach.pdf');
      expect(result.filename).toBe('attach.pdf');
      expect(result.mimetype).toBe('application/pdf');
      expect(result.size).toBe(3072);
      expect(result.creationDate).toBe(1234567892);
      expect(result.type).toBe('attachment');
    });

    it('should map Thumbnail to FileDBOType', () => {
      const attachment = new Thumbnail({
        id: f.idString('thumbId'),
        entity: 'entity3',
        language: 'es',
        originalname: 'thumb.jpg',
        filename: 'thumb.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1234567892,
      });

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
      const document = new ProcessedDocument({
        id: f.idString('docId2'),
        entity: 'entity4',
        originalname: 'doc2.pdf',
        filename: 'doc2.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        language: 'en',
        totalPages: 5,
        fullText: {},
      });

      const result = FileMappers.toDBO(document) as ProcessedDocumentDBO;

      expect(result.language).toBe('eng');
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

      const result = FileMappers.toModel(dbo);

      expect(result).toBeInstanceOf(URLAttachment);
      const urlAttachment = result as URLAttachment;
      expect(urlAttachment.id).toBe(dbo._id.toString());
      expect(urlAttachment.entity).toBe(dbo.entity);
      expect(urlAttachment.url).toBe(dbo.url);
      expect(urlAttachment.originalname).toBe(dbo.originalname);
      expect(urlAttachment.filename).toBe(dbo.filename);
      expect(urlAttachment.mimetype).toBe(dbo.mimetype);
      expect(urlAttachment.size).toBe(dbo.size);
      expect(urlAttachment.creationDate).toBe(dbo.creationDate);
    });

    it('should map to Attachment when type is attachment and url is not present', () => {
      const dob: fileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'attachment',
        entity: 'entity3',
      };

      const result = FileMappers.toModel(dob);

      expect(result).toBeInstanceOf(Attachment);
      const attachment = result as Attachment;
      expect(attachment.id).toBe(dob._id.toString());
      expect(attachment.entity).toBe(dob.entity);
      expect(attachment.originalname).toBe(dob.originalname);
      expect(attachment.filename).toBe(dob.filename);
      expect(attachment.mimetype).toBe(dob.mimetype);
      expect(attachment.size).toBe(dob.size);
      expect(attachment.creationDate).toBe(dob.creationDate);
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

      const result = FileMappers.toModel(dbo);

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

      const thumbnail = FileMappers.toModel<Thumbnail>(dbo);

      expect(thumbnail).toBeInstanceOf(Thumbnail);
      expect(thumbnail.id).toBe(dbo._id.toString());
      expect(thumbnail.entity).toBe(dbo.entity);
      expect(thumbnail.originalname).toBe(dbo.originalname);
      expect(thumbnail.filename).toBe(dbo.filename);
      expect(thumbnail.mimetype).toBe(dbo.mimetype);
      expect(thumbnail.size).toBe(dbo.size);
      expect(thumbnail.creationDate).toBe(dbo.creationDate);
      expect(thumbnail.language).toBe('es');
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

      const result = FileMappers.toModel(dbo);

      expect(result).toBeInstanceOf(Document);
      const document = result as Document;
      expect(document.id).toBe(dbo._id.toString());
      expect(document.entity).toBe(dbo.entity);
      expect(document.originalname).toBe(dbo.originalname);
      expect(document.filename).toBe(dbo.filename);
      expect(document.mimetype).toBe(dbo.mimetype);
      expect(document.size).toBe(dbo.size);
      expect(document.creationDate).toBe(dbo.creationDate);
      expect(document.status).toBe(dbo.status);
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

      const result = FileMappers.toModel(dbo);

      expect(result).toBeInstanceOf(ProcessedDocument);
      const document = result as Document;

      expect(document).toEqual({
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

      const documentResult = FileMappers.toModel(documentDBO);
      const anotherResult = FileMappers.toModel(anotherDocumentDBO);

      expect(documentResult).toBeInstanceOf(ProcessedDocument);
      expect(anotherResult).toBeInstanceOf(Document);
    });
  });
});
