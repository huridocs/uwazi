/* eslint-disable max-statements */
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { CustomUpload } from '#api/core/domain/files/CustomUpload.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { URLAttachment } from '#api/core/domain/files/URLAttachment.js';
import { PostgresFilesMapper } from '../PostgresFilesMapper.js';
import type { FilesRow } from '../PostgresFilesRow.js';

const contentLoader = () => FileBuilder.content('test');

describe('PostgresFilesMapper', () => {
  describe('toDBO', () => {
    it('should map a processed PDF document (status: ready)', () => {
      const doc = FileBuilder.processedDocument('doc-1', {
        entity: 'e1',
        language: 'en',
        totalPages: 10,
        generatedToc: true,
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row).toMatchObject({
        _id: 'doc-1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
        type: 'document',
        entity: 'e1',
        status: 'ready',
        totalPages: 10,
        language: 'eng',
        generatedToc: true,
      });
      expect(row).not.toHaveProperty('toc');
      expect(row).not.toHaveProperty('propertySelections');
      expect(row).not.toHaveProperty('fullText');
      expect(row).not.toHaveProperty('url');
    });

    it('should map a processing PDF document', () => {
      const doc = FileBuilder.document('doc-2', {
        entity: 'e2',
        status: 'processing',
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row).toMatchObject({
        _id: 'doc-2',
        type: 'document',
        entity: 'e2',
        status: 'processing',
      });
      expect(row).not.toHaveProperty('totalPages');
      expect(row).not.toHaveProperty('language');
      expect(row).not.toHaveProperty('generatedToc');
    });

    it('should map a failed PDF document', () => {
      const doc = FileBuilder.document('doc-3', {
        entity: 'e3',
        status: 'failed',
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row.status).toBe('failed');
    });

    it('should map a file attachment', () => {
      const attachment = FileBuilder.attachment('att-1', { entity: 'e1' });

      const row = PostgresFilesMapper.toDBO(attachment);

      expect(row).toMatchObject({
        _id: 'att-1',
        type: 'attachment',
        entity: 'e1',
        mimetype: 'application/pdf',
      });
      expect(row).not.toHaveProperty('url');
      expect(row).not.toHaveProperty('status');
      expect(row).not.toHaveProperty('language');
    });

    it('should map a URL attachment', () => {
      const urlAttachment = FileBuilder.urlAttachment('url-1', {
        entity: 'e1',
        url: 'https://example.com/doc.pdf',
      });

      const row = PostgresFilesMapper.toDBO(urlAttachment);

      expect(row).toMatchObject({
        _id: 'url-1',
        type: 'attachment',
        entity: 'e1',
        url: 'https://example.com/doc.pdf',
      });
    });

    it('should map a thumbnail', () => {
      const thumbnail = FileBuilder.thumbnail('thumb-1', {
        entity: 'e1',
        language: 'es',
      });

      const row = PostgresFilesMapper.toDBO(thumbnail);

      expect(row).toMatchObject({
        _id: 'thumb-1',
        type: 'thumbnail',
        entity: 'e1',
        language: 'spa',
        mimetype: 'image/jpeg',
      });
      expect(row).not.toHaveProperty('status');
      expect(row).not.toHaveProperty('url');
    });

    it('should map a custom upload', () => {
      const custom = FileBuilder.customUpload('custom-1');

      const row = PostgresFilesMapper.toDBO(custom);

      expect(row).toMatchObject({
        _id: 'custom-1',
        type: 'custom',
      });
      expect(row).not.toHaveProperty('entity');
      expect(row).not.toHaveProperty('status');
      expect(row).not.toHaveProperty('language');
      expect(row).not.toHaveProperty('url');
    });

    it('should not include fullText when domain object has no fullText loaded', () => {
      const doc = FileBuilder.processedDocument('doc-no-ft', {
        entity: 'e1',
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row).not.toHaveProperty('fullText');
    });

    it('should include fullText when domain object has fullText explicitly set', () => {
      const fullText = { 1: 'page one', 2: 'page two' };
      const doc = FileBuilder.processedDocument('doc-with-ft', {
        entity: 'e1',
        fullText,
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row.fullText).toEqual(fullText);
    });

    it('should not include toc when domain object has no toc', () => {
      const doc = FileBuilder.processedDocument('doc-no-toc', {
        entity: 'e1',
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row).not.toHaveProperty('toc');
    });

    it('should include toc when domain object has toc explicitly set', () => {
      const toc = [{ label: 'Chapter 1', indentation: 0 }];
      const doc = FileBuilder.processedDocument('doc-with-toc', {
        entity: 'e1',
        toc,
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row.toc).toEqual(toc);
    });

    it('should include propertySelections when domain object has propertySelections explicitly set', () => {
      const propertySelections = [{ name: 'prop1' }];
      const doc = FileBuilder.processedDocument('doc-with-ps', {
        entity: 'e1',
        propertySelections,
      });

      const row = PostgresFilesMapper.toDBO(doc);

      expect(row.propertySelections).toEqual(propertySelections);
    });

    it('should store _id as string (no ObjectId conversion)', () => {
      const doc = FileBuilder.document('abc-123');
      const row = PostgresFilesMapper.toDBO(doc);

      expect(row._id).toBe('abc-123');
      expect(typeof row._id).toBe('string');
    });
  });

  describe('toDomain', () => {
    it('should reconstruct a processed PDF document', () => {
      const row: FilesRow = {
        _id: 'doc-1',
        //@ts-ignore
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1000,
        type: 'document',
        entity: 'e1',
        status: 'ready',
        totalPages: 5,
        language: 'eng',
        generatedToc: false,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const doc = PostgresFilesMapper.toDomain(row, contentLoader) as PDFDocument;

      expect(doc).toBeInstanceOf(PDFDocument);
      expect(doc.id).toBe('doc-1');
      expect(doc.entity).toBe('e1');
      expect(doc.status).toBe('ready');
      expect(doc.language).toBe('en');
      expect(doc.totalPages).toBe(5);
      expect(doc.generatedToc).toBe(false);
    });

    it('should convert language from ISO 639-3 to ISO 639-1', () => {
      const row: FilesRow = {
        _id: 'thumb-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'thumb.jpg',
        filename: 'thumb.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1000,
        type: 'thumbnail',
        entity: 'e1',
        status: null,
        totalPages: null,
        language: 'spa',
        generatedToc: null,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const thumb = PostgresFilesMapper.toDomain(row, contentLoader) as Thumbnail;

      expect(thumb).toBeInstanceOf(Thumbnail);
      expect(thumb.language).toBe('es');
    });

    it('should reconstruct a processing PDF document', () => {
      const row: FilesRow = {
        _id: 'doc-2',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1000,
        type: 'document',
        entity: 'e2',
        status: 'processing',
        totalPages: null,
        language: null,
        generatedToc: null,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const doc = PostgresFilesMapper.toDomain(row, contentLoader) as PDFDocument;

      expect(doc).toBeInstanceOf(PDFDocument);
      expect(doc.id).toBe('doc-2');
      expect(doc.entity).toBe('e2');
      expect(doc.status).toBe('processing');
    });

    it('should reconstruct a file attachment', () => {
      const row: FilesRow = {
        _id: 'att-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'file.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1000,
        type: 'attachment',
        entity: 'e1',
        status: null,
        totalPages: null,
        language: null,
        generatedToc: null,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const att = PostgresFilesMapper.toDomain(row, contentLoader) as FileAttachment;

      expect(att).toBeInstanceOf(FileAttachment);
      expect(att.id).toBe('att-1');
      expect(att.entity).toBe('e1');
    });

    it('should reconstruct a URL attachment when url is present', () => {
      const row: FilesRow = {
        _id: 'url-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'url-doc.pdf',
        filename: 'url-doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1000,
        type: 'attachment',
        entity: 'e1',
        status: null,
        totalPages: null,
        language: null,
        generatedToc: null,
        url: 'https://example.com/doc.pdf',
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const att = PostgresFilesMapper.toDomain(row, contentLoader) as URLAttachment;

      expect(att).toBeInstanceOf(URLAttachment);
      expect(att.id).toBe('url-1');
      expect(att.url).toBe('https://example.com/doc.pdf');
    });

    it('should reconstruct a thumbnail', () => {
      const row: FilesRow = {
        _id: 'thumb-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'thumb.jpg',
        filename: 'thumb.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1000,
        type: 'thumbnail',
        entity: 'e1',
        status: null,
        totalPages: null,
        language: 'eng',
        generatedToc: null,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const thumb = PostgresFilesMapper.toDomain(row, contentLoader) as Thumbnail;

      expect(thumb).toBeInstanceOf(Thumbnail);
      expect(thumb.id).toBe('thumb-1');
      expect(thumb.entity).toBe('e1');
      expect(thumb.language).toBe('en');
    });

    it('should reconstruct a custom upload', () => {
      const row: FilesRow = {
        _id: 'custom-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'custom.jpg',
        filename: 'custom.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1000,
        type: 'custom',
        entity: null,
        status: null,
        totalPages: null,
        language: null,
        generatedToc: null,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const custom = PostgresFilesMapper.toDomain(row, contentLoader) as CustomUpload;

      expect(custom).toBeInstanceOf(CustomUpload);
      expect(custom.id).toBe('custom-1');
    });

    it('should preserve toc, propertySelections, and fullText when present', () => {
      const toc = [{ label: 'Chapter 1', indentation: 0 }];
      const propertySelections = [{ name: 'prop1', selection: { text: 'selected text' } }];
      const fullText = { 1: 'page one', 2: 'page two' };

      const row: FilesRow = {
        _id: 'doc-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1000,
        type: 'document',
        entity: 'e1',
        status: 'ready',
        totalPages: 5,
        language: 'eng',
        generatedToc: true,
        url: null,
        toc,
        propertySelections,
        fullText,
      };

      const doc = PostgresFilesMapper.toDomain(row, contentLoader) as PDFDocument;

      expect(doc.toc).toEqual(toc);
      expect(doc.propertySelections).toEqual(propertySelections);
      expect(doc.fullText).toEqual(fullText);
    });

    it('should handle null optional fields gracefully', () => {
      const row: FilesRow = {
        _id: 'doc-1',
        //@ts-ignore
        tenant_id: 't1',
        originalname: 'doc.pdf',
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1000,
        type: 'document',
        entity: 'e1',
        status: 'ready',
        totalPages: 5,
        language: 'eng',
        generatedToc: false,
        url: null,
        toc: null,
        propertySelections: null,
        fullText: null,
      };

      const doc = PostgresFilesMapper.toDomain(row, contentLoader) as PDFDocument;

      expect(doc).toBeInstanceOf(PDFDocument);
      expect(doc.id).toBe('doc-1');
    });
  });

  describe('round-trip', () => {
    it('should round-trip a processed document (toDBO → toDomain)', () => {
      const original = FileBuilder.processedDocument('rt-1', {
        entity: 'e1',
        language: 'en',
        totalPages: 8,
        generatedToc: true,
      });

      const row = PostgresFilesMapper.toDBO(original);
      const reconstructed = PostgresFilesMapper.toDomain(
        row as FilesRow,
        contentLoader
      ) as PDFDocument;

      expect(reconstructed.id).toBe(original.id);
      expect(reconstructed.entity).toBe(original.entity);
      expect(reconstructed.status).toBe(original.status);
      expect(reconstructed.language).toBe(original.language);
      expect(reconstructed.totalPages).toBe(original.totalPages);
      expect(reconstructed.generatedToc).toBe(original.generatedToc);
      expect(reconstructed.mimetype).toBe(original.mimetype);
    });

    it('should round-trip a URL attachment', () => {
      const original = FileBuilder.urlAttachment('rt-2', {
        url: 'https://example.com/test.pdf',
      });

      const row = PostgresFilesMapper.toDBO(original);
      const reconstructed = PostgresFilesMapper.toDomain(
        row as FilesRow,
        contentLoader
      ) as URLAttachment;

      expect(reconstructed.id).toBe(original.id);
      expect(reconstructed.url).toBe(original.url);
    });

    it('should round-trip a thumbnail', () => {
      const original = FileBuilder.thumbnail('rt-3', { language: 'es' });

      const row = PostgresFilesMapper.toDBO(original);
      const reconstructed = PostgresFilesMapper.toDomain(
        row as FilesRow,
        contentLoader
      ) as Thumbnail;

      expect(reconstructed.id).toBe(original.id);
      expect(reconstructed.entity).toBe(original.entity);
      expect(reconstructed.language).toBe(original.language);
    });

    it('should round-trip a custom upload', () => {
      const original = FileBuilder.customUpload('rt-4');

      const row = PostgresFilesMapper.toDBO(original);
      const reconstructed = PostgresFilesMapper.toDomain(
        row as FilesRow,
        contentLoader
      ) as CustomUpload;

      expect(reconstructed.id).toBe(original.id);
      expect(reconstructed.mimetype).toBe(original.mimetype);
    });
  });
});
