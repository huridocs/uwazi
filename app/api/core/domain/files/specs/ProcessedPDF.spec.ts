import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { ProcessedPDFDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { ProcessedPDF } from '../ProcessedPDF.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('ProcessedPDF', () => {
  describe('update', () => {
    it('should rename and preserve all properties', () => {
      const content = FileBuilder.content('page contents');
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        originalname: 'original.pdf',
        language: 'fr',
        totalPages: 42,
        generatedToc: true,
        entity: 'sharedId1',
        fullText: { 1: 'page one' },
        content,
      });
      const updated = file.update({ originalname: 'renamed.pdf' });
      expect(updated).toBeInstanceOf(ProcessedPDF);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.pdf' });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });

    it('should update toc and generatedToc', () => {
      const toc = [{ label: 'Chapter 1', indentation: 0 }];
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        generatedToc: true,
        toc: [{ label: 'Auto Chapter', indentation: 0 }],
      });
      const updated = file.update({ toc, generatedToc: false });

      expect(updated).toBeInstanceOf(ProcessedPDF);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), toc, generatedToc: false });
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.toc).toEqual([{ label: 'Auto Chapter', indentation: 0 }]);
    });

    it('should not mark as changed when the name is unchanged', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), { originalname: 'same.pdf' });
      expect(file.update({ originalname: 'same.pdf' }).hasChanged).toBe(false);
    });
  });

  describe('toDTO', () => {
    it('should include all base and specialized properties', () => {
      const id = f.idString('doc');
      const file = FileBuilder.processedDocument(id, {
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        language: 'fr',
        totalPages: 42,
        generatedToc: true,
        fullText: { 1: 'page one' },
        toc: [{ label: 'Chapter 1', indentation: 0 }],
      });

      expect(file.toDTO()).toEqual({
        _id: id,
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        language: 'fra',
        totalPages: 42,
        generatedToc: true,
        fullText: { 1: 'page one' },
        toc: [{ label: 'Chapter 1', indentation: 0 }],
        type: 'document',
        status: 'ready',
      });
    });

    it('should omit toc when not set', () => {
      const id = f.idString('doc2');
      const file = FileBuilder.processedDocument(id, { fullText: { 1: 'page' } });
      const dto = file.toDTO();
      expect(dto).not.toHaveProperty('toc');
    });

    it('should omit fullText when using a lazy loader that has not been resolved', () => {
      const id = f.idString('doc3');
      const file = FileBuilder.processedDocument(id, {
        fullText: async () => ({ 1: 'lazy' }),
      });
      expect(file.toDTO()).not.toHaveProperty('fullText');
    });
  });

  describe('fromDBO', () => {
    it('should map all fields when fullText is present', () => {
      const _id = new ObjectId();
      const dbo: ProcessedPDFDBO = {
        _id,
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        type: 'document',
        entity: 'sharedId1',
        language: 'fra',
        totalPages: 42,
        status: 'ready',
        generatedToc: true,
        fullText: { 1: 'page one' },
        toc: [{ label: 'Chapter 1', indentation: 0 }],
      };
      const content = FileBuilder.content('document bytes');
      const contentLoader = jest.fn().mockReturnValue(content);

      const file = ProcessedPDF.fromDBO(dbo, contentLoader);

      expect(file).toBeInstanceOf(ProcessedPDF);
      expect(file.id).toBe(_id.toString());
      expect(file.originalname).toBe('report.pdf');
      expect(file.filename).toBe('abc123.pdf');
      expect(file.mimetype).toBe('application/pdf');
      expect(file.size).toBe(5000);
      expect(file.creationDate).toBe(1000000000);
      expect(file.entity).toBe('sharedId1');
      expect(file.language).toBe('fr');
      expect(file.totalPages).toBe(42);
      expect(file.generatedToc).toBe(true);
      expect(file.fullText).toEqual({ 1: 'page one' });
      expect(file.toc).toEqual([{ label: 'Chapter 1', indentation: 0 }]);
      expect(file.content).toBe(content);
      expect(contentLoader).toHaveBeenCalledWith({ type: 'document', filename: 'abc123.pdf' });
    });

    it('should defer fullText loading when not present in the DBO', async () => {
      const _id = new ObjectId();
      const dbo: ProcessedPDFDBO = {
        _id,
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        type: 'document',
        entity: 'sharedId1',
        language: 'fra',
        totalPages: 10,
        status: 'ready',
        generatedToc: false,
      };
      const contentLoader = jest.fn().mockReturnValue(FileBuilder.content('document'));

      const file = ProcessedPDF.fromDBO(dbo, contentLoader);

      expect(file.fullText).toBeUndefined();
      await expect(file.getFullText()).rejects.toThrow('not Implemented');
    });
  });

  describe('getFullText', () => {
    describe('when not passing a fullText loader', () => {
      it('should return fullText', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), { fullText: { 1: 'text' } });
        expect(await doc.getFullText()).toEqual({ 1: 'text' });
      });
      it('should have fullText property', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), { fullText: { 1: 'text' } });
        expect(doc.fullText).toEqual({ 1: 'text' });
      });
    });

    describe('when passing a fullText loader', () => {
      it('should have fullText as undefined until loaded', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), {
          fullText: async () => ({ 1: 'lazy loaded' }),
        });
        expect(doc.fullText).toBeUndefined();
        await doc.getFullText();
        expect(doc.fullText).toEqual({ 1: 'lazy loaded' });
      });

      it('should lazy load fullText', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), {
          fullText: async () => ({ 1: 'lazy loaded' }),
        });
        expect(await doc.getFullText()).toEqual({ 1: 'lazy loaded' });
      });

      it('should lazy load fullText only once', async () => {
        const lazyLoadFullText = jest.fn().mockImplementation(async () => ({ 1: 'lazy loaded' }));
        const doc = FileBuilder.processedDocument(f.idString('doc'), {
          fullText: lazyLoadFullText,
        });

        expect(await doc.getFullText()).toEqual({ 1: 'lazy loaded' });
        expect(await doc.getFullText()).toEqual({ 1: 'lazy loaded' });
        expect(lazyLoadFullText).toHaveBeenCalledTimes(1);
      });
    });
  });
});
