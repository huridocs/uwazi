import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PDFDocument, PDFDocumentProps } from '../PDFDocument.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('PDFDocument (ready/processed)', () => {
  describe('validation', () => {
    const validProps: PDFDocumentProps = {
      id: 'file123',
      originalname: 'document.pdf',
      filename: 'doc_abc123.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      creationDate: 1234567890,
      uploaded: true,
      entity: 'sharedId1',
      status: 'ready',
      fullText: { 1: 'page one' },
      generatedToc: false,
      language: 'en',
      totalPages: 1,
      toc: [
        {
          label: 'Chapter 1',
          indentation: 0,
          selectionRectangles: [{ top: 10, left: 10, width: 100, height: 20, page: '1' }],
        },
      ],
      content: FileBuilder.content('file content'),
    };

    it.each<[string, Partial<PDFDocumentProps>]>([
      ['entity is undefined', { entity: undefined }],
      ['entity is empty', { entity: '  ' }],

      ['totalPages is negative', { totalPages: -1 }],
    ])('throws on %s', (_name, overrides) => {
      expect(() => new PDFDocument({ ...validProps, ...overrides })).toThrowErrorMatchingSnapshot();
    });
  });

  describe('update', () => {
    it('should only update allowed properties', () => {
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
      const toc = [{ label: 'Chapter 1', indentation: 0 }];

      const updated = file.update({
        originalname: 'renamed.pdf',
        language: 'en',
        toc,
        generatedToc: false,
      });

      expect(updated).toBeInstanceOf(PDFDocument);
      expect(updated.toDTO()).toEqual({
        ...file.toDTO(),
        originalname: 'renamed.pdf',
        language: 'eng',
        toc,
        generatedToc: false,
      });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });

    it('should not mark as changed when the name is unchanged', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), { originalname: 'same.pdf' });
      expect(file.update({ originalname: 'same.pdf' }).hasChanged).toBe(false);
    });

    it("should set language change flag when file's language is changed", () => {
      const document = FileBuilder.processedDocument('doc', { language: 'en' });

      const updated = document.update({ language: 'fr' });

      expect(updated.languageHasChanged).toBe(true);
    });

    it('preserves immutable fields (entity, totalPages, fullText) on the returned file', () => {
      const fullText = { 1: 'page one' };
      const file = FileBuilder.processedDocument('doc', {
        language: 'en',
        entity: 'sharedId1',
        totalPages: 10,
        fullText,
      });

      const updated = file.update({ language: 'fr' });

      expect(updated.entity).toBe('sharedId1');
      expect(updated.totalPages).toBe(10);
      expect(updated.fullText).toBe(fullText);
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
