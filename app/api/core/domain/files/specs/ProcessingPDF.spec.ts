import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { ProcessedPDF } from '../ProcessedPDF.js';
import { ProcessingPDF } from '../ProcessingPDF.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('ProcessingPDF', () => {
  describe('toDTO', () => {
    it('should include all base and specialized properties', () => {
      const id = f.idString('doc');
      const file = FileBuilder.document(id, {
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        status: 'failed',
      });

      expect(file.toDTO()).toEqual({
        _id: id,
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        status: 'failed',
        type: 'document',
      });
    });
  });

  describe('failed()', () => {
    it('should set status to failed', () => {
      const file = FileBuilder.document(f.idString('doc'), { status: 'processing' });
      file.failed();
      expect(file.status).toBe('failed');
    });
  });

  describe('asProcessed()', () => {
    it('should mark ProcessedPDF as changed language', async () => {
      const id = f.idString('doc');
      const content = FileBuilder.content('document bytes');
      const file = FileBuilder.document(id, {
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        content,
      });
      const fullText = { 1: 'page one' };

      const processed = file.asProcessed({ language: 'fr', totalPages: 42, fullText });

      expect(processed.languageHasChanged).toBe(true);
    });

    it('should return a ProcessedPDF preserving all base fields and applying pdfInfo', () => {
      const id = f.idString('doc');
      const content = FileBuilder.content('document bytes');
      const file = FileBuilder.document(id, {
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        content,
      });
      const fullText = { 1: 'page one' };

      const processed = file.asProcessed({ language: 'fr', totalPages: 42, fullText });

      expect(processed).toBeInstanceOf(ProcessedPDF);
      expect(processed.id).toBe(id);
      expect(processed.originalname).toBe('report.pdf');
      expect(processed.filename).toBe('abc123.pdf');
      expect(processed.mimetype).toBe('application/pdf');
      expect(processed.size).toBe(5000);
      expect(processed.creationDate).toBe(1000000000);
      expect(processed.entity).toBe('sharedId1');
      expect(processed.language).toBe('fr');
      expect(processed.totalPages).toBe(42);
      expect(processed.fullText).toEqual(fullText);
      expect(processed.generatedToc).toBe(false);
      expect(processed.content).toBe(content);
    });
  });

  describe('update', () => {
    it('should rename and preserve all properties', () => {
      const content = FileBuilder.content('document bytes');
      const file = FileBuilder.document(f.idString('doc'), {
        originalname: 'original.pdf',
        entity: 'sharedId1',
        status: 'failed',
        content,
      });
      const updated = file.update({ originalname: 'renamed.pdf' });

      expect(updated).toBeInstanceOf(ProcessingPDF);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.pdf' });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });
  });
});
