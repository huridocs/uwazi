import { ObjectId } from 'mongodb';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { FileAttachment } from '../../../../domain/files/FileAttachment.js';
import { CustomUpload } from '../../../../domain/files/CustomUpload.js';
import { URLAttachment } from '../../../../domain/files/URLAttachment.js';
import { FileMappers } from '../FilesMappers.js';
import {
  FileAttachmentDBO,
  ProcessingPDFDBO,
  FileDBO,
  ProcessedPDFDBO,
  ThumbnailDBO,
} from '../schemas/FilesTypes.js';

const f = getFixturesFactory();

describe('FileMappers', () => {
  describe('toDBO', () => {
    it('should map Document to FileDBOType', () => {
      const document = FileBuilder.document(f.idString('docId'));
      const result = FileMappers.toDBO(document) as ProcessingPDFDBO;

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

    it('should map ProcessedDocument to FileDBOType (fullText loader)', () => {
      const document = FileBuilder.processedDocument(f.idString('docId'));
      const result = FileMappers.toDBO(document) as ProcessedPDFDBO;

      expect(result._id.toString()).toBe(f.idString('docId'));

      expect(Object.hasOwn(result, 'fullText')).toBe(false);
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
        generatedToc: false,
      });
    });

    it('should map ProcessedDocument to FileDBOType (fullText value)', () => {
      const document = FileBuilder.processedDocument(f.idString('docId'), {
        fullText: { 1: 'text' },
      });
      const result = FileMappers.toDBO(document) as ProcessedPDFDBO;

      expect(result._id.toString()).toBe(f.idString('docId'));

      expect(result).toMatchObject({
        _id: f.id('docId'),
        fullText: { 1: 'text' },
      });
    });

    it('should map URLAttachment to FileDBOType', () => {
      const urlAttachment = FileBuilder.urlAttachment(f.idString('urlAttachment'));
      const result = FileMappers.toDBO(urlAttachment) as FileAttachmentDBO;

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
      const attachment = FileBuilder.attachment(f.idString('attId'), {
        entity: 'entity3',
      });
      const result = FileMappers.toDBO(attachment) as FileAttachmentDBO;

      expect(result._id.toString()).toBe(f.idString('attId'));
      expect(result).toMatchObject({
        entity: 'entity3',
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

      const result = FileMappers.toDBO(document) as ProcessedPDFDBO;

      expect(result.language).toBe('eng');
    });
  });

  describe('toModel', () => {
    const fileStorage = TestUtils.mockClass<FileStorage>({
      getFile() {
        return FileBuilder.content('test content');
      },
    });

    const toModel = (dbo: FileDBO) =>
      FileMappers.toModel(dbo, { contentLoader: fileStorage.getFile.bind(fileStorage) });

    it('should map to URLAttachment when type is attachment and url is present', () => {
      const dbo: FileDBO = {
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

      const result = toModel(dbo);

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
      const dbo: FileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'attachment',
        entity: 'entity3',
      };

      const result = toModel(dbo);

      expect(result).toBeInstanceOf(FileAttachment);

      expect(result as FileAttachment).toMatchObject({
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
      const dbo: FileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'custom',
      };

      const result = toModel(dbo);

      expect(result).toBeInstanceOf(CustomUpload);
      expect(result.id).toBe(dbo._id.toString());
      expect(result.originalname).toBe(dbo.originalname);
      expect(result.filename).toBe(dbo.filename);
      expect(result.mimetype).toBe(dbo.mimetype);
      expect(result.size).toBe(dbo.size);
      expect(result.creationDate).toBe(dbo.creationDate);
    });

    it('should map to Thumbnail when type is thumbnail', () => {
      const dbo: FileDBO = {
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

      const thumbnail = toModel(dbo);

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
      const dbo: FileDBO = {
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

      const result = toModel(dbo);

      expect(result).toBeInstanceOf(PDFDocument);

      expect(result as PDFDocument).toMatchObject({
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
      const dbo: FileDBO = {
        _id: new ObjectId(),
        originalname: 'original.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        entity: 'entity1',
        status: 'ready',
        generatedToc: false,
        language: 'eng',
        totalPages: 1,
        fullText: { 1: 'text' },
      };

      const result = toModel(dbo);

      expect(result).toBeInstanceOf(PDFDocument);
      const document = result as PDFDocument;

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
      const documentDBO: FileDBO = {
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
        generatedToc: false,
      };
      const anotherDocumentDBO: FileDBO = {
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

      const documentResult = toModel(documentDBO);
      const anotherResult = toModel(anotherDocumentDBO);

      expect(documentResult).toBeInstanceOf(PDFDocument);
      expect(anotherResult).toBeInstanceOf(PDFDocument);
    });
  });
});
