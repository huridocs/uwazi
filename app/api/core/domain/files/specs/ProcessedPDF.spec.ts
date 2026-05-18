import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { ProcessedPDF } from '../ProcessedPDF.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('ProcessedPDF', () => {
  describe('update()', () => {
    const baseDoc = () => FileBuilder.processedDocument(f.idString('doc'));

    it('update({ language }) returns a ProcessedPDF with the new language; other fields unchanged', () => {
      const doc = baseDoc();
      const updated = doc.update({ language: 'es' });

      expect(updated).toBeInstanceOf(ProcessedPDF);
      expect(updated.language).toBe('es');
      expect(updated.entity).toBe(doc.entity);
      expect(updated.originalname).toBe(doc.originalname);
      expect(updated.totalPages).toBe(doc.totalPages);
      expect(updated.generatedToc).toBe(doc.generatedToc);
      expect(updated.content).toBe(doc.content);
      expect(updated.hasChanged).toBe(true);
    });

    it('update({ originalname }) returns a ProcessedPDF with updated originalname; language preserved', () => {
      const doc = baseDoc();
      const updated = doc.update({ originalname: 'new.pdf' });

      expect(updated).toBeInstanceOf(ProcessedPDF);
      expect(updated.originalname).toBe('new.pdf');
      expect(updated.language).toBe(doc.language);
      expect(updated.entity).toBe(doc.entity);
      expect(updated.content).toBe(doc.content);
      expect(updated.hasChanged).toBe(true);
    });

    it('update({ originalname, language }) updates both fields', () => {
      const doc = baseDoc();
      const updated = doc.update({ originalname: 'new.pdf', language: 'es' });

      expect(updated).toBeInstanceOf(ProcessedPDF);
      expect(updated.originalname).toBe('new.pdf');
      expect(updated.language).toBe('es');
      expect(updated.hasChanged).toBe(true);
    });

    it('hasChanged is true and previousVersion reflects pre-update state', () => {
      const doc = baseDoc();
      const updated = doc.update({ language: 'es' });

      expect(updated.hasChanged).toBe(true);
      expect((updated.previousVersion as ProcessedPDF)?.language).toBe('en');
      expect(updated.previousVersion?.originalname).toBe(doc.originalname);
    });

    it('update({}) returns a clone where hasChanged is false', () => {
      const doc = baseDoc();
      const updated = doc.update({});

      expect(updated).toBeInstanceOf(ProcessedPDF);
      expect(updated.hasChanged).toBe(false);
    });

    it('should mark for fullText indexing when language changes', () => {
      const doc1 = baseDoc();
      const doc2 = baseDoc();

      expect(doc1.pendingFullTextIndexing).toBe(false);
      expect(doc1.language).toBe('en');

      expect(doc2.pendingFullTextIndexing).toBe(false);
      expect(doc2.language).toBe('en');

      const updated1 = doc1.update({ language: 'es' });
      expect(updated1.pendingFullTextIndexing).toBe(true);

      const updated2 = doc1.update({ language: 'en' });
      expect(updated2.pendingFullTextIndexing).toBe(false);
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
