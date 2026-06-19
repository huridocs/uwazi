import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PDFDocument, PDFDocumentProps } from '../PDFDocument.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('PDFDocument', () => {
  describe('validation', () => {
    const validReadyProps: PDFDocumentProps = {
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
      ['status is ready but language is undefined', { status: 'ready', language: undefined }],
      ['status is ready but language is empty', { status: 'ready', language: '  ' as any }],
    ])('throws on %s', (_name, overrides) => {
      expect(
        () => new PDFDocument({ ...validReadyProps, ...overrides })
      ).toThrowErrorMatchingSnapshot();
    });

    it('does not throw when status is processing and language is undefined', () => {
      expect(
        () => new PDFDocument({ ...validReadyProps, status: 'processing', language: undefined })
      ).not.toThrow();
    });

    it('does not throw when status is failed and language is undefined', () => {
      expect(
        () => new PDFDocument({ ...validReadyProps, status: 'failed', language: undefined })
      ).not.toThrow();
    });
  });

  describe('isReady()', () => {
    it('returns true when status is ready and all required fields are present', () => {
      const doc = FileBuilder.processedDocument(f.idString('doc'));
      expect(doc.isReady()).toBe(true);
    });

    it('returns false for status processing', () => {
      const doc = FileBuilder.document(f.idString('doc'), { status: 'processing' });
      expect(doc.isReady()).toBe(false);
    });

    it('returns false for status failed', () => {
      const doc = FileBuilder.document(f.idString('doc'), { status: 'failed' });
      expect(doc.isReady()).toBe(false);
    });

    it('returns false when status is ready but language is missing', () => {
      // bypass superRefine by using processing first, then manually set status
      // instead, construct directly with a workaround: use Object.assign on a processing doc
      const doc = FileBuilder.document(f.idString('doc'), { status: 'processing' });
      Object.assign(doc, { status: 'ready' });
      expect(doc.isReady()).toBe(false);
    });

    it('returns false when status is ready but totalPages is missing', () => {
      const doc = FileBuilder.processedDocument(f.idString('doc'), { totalPages: 5 });
      Object.assign(doc, { totalPages: undefined });
      expect(doc.isReady()).toBe(false);
    });

    it('returns false when status is ready but generatedToc is missing', () => {
      const doc = FileBuilder.processedDocument(f.idString('doc'));
      Object.assign(doc, { generatedToc: undefined });
      expect(doc.isReady()).toBe(false);
    });
  });

  describe('isProcessing()', () => {
    it('returns true for status processing', () => {
      const doc = FileBuilder.document(f.idString('doc'), { status: 'processing' });
      expect(doc.isProcessing()).toBe(true);
    });

    it('returns true for status failed', () => {
      const doc = FileBuilder.document(f.idString('doc'), { status: 'failed' });
      expect(doc.isProcessing()).toBe(true);
    });

    it('returns false for status ready', () => {
      const doc = FileBuilder.processedDocument(f.idString('doc'));
      expect(doc.isProcessing()).toBe(false);
    });
  });

  describe('failed()', () => {
    it('returns a new instance with status failed without mutating the original', () => {
      const file = FileBuilder.document(f.idString('doc'), { status: 'processing' });
      const failed = file.failed();
      expect(failed.status).toBe('failed');
      expect(file.status).toBe('processing');
    });
  });

  describe('processed()', () => {
    it('marks the returned PDFDocument as having a changed language', () => {
      const file = FileBuilder.document(f.idString('doc'), {
        originalname: 'report.pdf',
        filename: 'abc123.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        creationDate: 1000000000,
        entity: 'sharedId1',
        content: FileBuilder.content('document bytes'),
      });

      const processed = file.processed({
        language: 'fr',
        totalPages: 42,
        fullText: { 1: 'page one' },
      });

      expect(processed.languageHasChanged).toBe(true);
    });

    it('returns a PDFDocument with status ready, preserving base fields and applying pdfInfo', () => {
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

      const processed = file.processed({ language: 'fr', totalPages: 42, fullText });

      expect(processed).toBeInstanceOf(PDFDocument);
      expect(processed.status).toBe('ready');
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

  describe('update (processing/failed document)', () => {
    it('renames and preserves all properties', () => {
      const content = FileBuilder.content('document bytes');
      const file = FileBuilder.document(f.idString('doc'), {
        originalname: 'original.pdf',
        entity: 'sharedId1',
        status: 'failed',
        content,
      });

      const updated = file.update({ originalname: 'renamed.pdf' });

      expect(updated).toBeInstanceOf(PDFDocument);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.pdf' });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });
  });

  describe('update (ready document)', () => {
    it('updates allowed fields', () => {
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

    it('does not mark as changed when name is unchanged', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), { originalname: 'same.pdf' });
      expect(file.update({ originalname: 'same.pdf' }).hasChanged).toBe(false);
    });

    it('sets languageHasChanged when language changes', () => {
      const doc = FileBuilder.processedDocument('doc', { language: 'en' });
      expect(doc.update({ language: 'fr' }).languageHasChanged).toBe(true);
    });

    it('preserves immutable fields (entity, totalPages, fullText)', () => {
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

  describe('update() with propertySelections', () => {
    it('merges new selections with existing, deduplicates by name', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        propertySelections: [{ name: 'title', selection: { text: 'old' } }],
      });
      const updated = file.update({
        propertySelections: [
          { name: 'title', selection: { text: 'new' } },
          { name: 'date', selection: { text: '2024' } },
        ],
      });
      expect(updated.propertySelections).toEqual([
        { name: 'title', selection: { text: 'new' } },
        { name: 'date', selection: { text: '2024' } },
      ]);
    });

    it('filters out deleteSelection: true entries', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        propertySelections: [{ name: 'keep' }, { name: 'remove' }],
      });
      const updated = file.update({
        propertySelections: [{ name: 'remove', deleteSelection: true }],
      });
      expect(updated.propertySelections).toEqual([{ name: 'keep' }]);
    });

    it('returns same instance when nothing changed (hasChanged === false)', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        propertySelections: [{ name: 'title', selection: { text: 'same' } }],
      });
      const updated = file.update({
        propertySelections: [{ name: 'title', selection: { text: 'same' } }],
      });
      expect(updated.hasChanged).toBe(false);
    });

    it('returns different instance when selections changed (hasChanged === true)', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        propertySelections: [{ name: 'title', selection: { text: 'old' } }],
      });
      const updated = file.update({
        propertySelections: [{ name: 'title', selection: { text: 'new' } }],
      });
      expect(updated.hasChanged).toBe(true);
    });

    it('works when propertySelections was undefined', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'));
      const updated = file.update({
        propertySelections: [{ name: 'title', selection: { text: 'new' } }],
      });
      expect(updated.propertySelections).toEqual([{ name: 'title', selection: { text: 'new' } }]);
    });

    it('can update other fields alongside propertySelections', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        originalname: 'old.pdf',
        propertySelections: [{ name: 'title', selection: { text: 'existing' } }],
      });
      const updated = file.update({
        originalname: 'renamed.pdf',
        propertySelections: [{ name: 'title', selection: { text: 'updated' } }],
      });
      expect(updated.originalname).toBe('renamed.pdf');
      expect(updated.propertySelections).toEqual([
        { name: 'title', selection: { text: 'updated' } },
      ]);
    });
  });

  describe('toDTO (processing/failed)', () => {
    it('includes all base and specialized properties', () => {
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

  describe('toDTO (ready)', () => {
    it('includes all base and specialized properties', () => {
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

    it('omits toc when not set', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), { fullText: { 1: 'page' } });
      expect(file.toDTO()).not.toHaveProperty('toc');
    });

    it('omits fullText when using a lazy loader that has not been resolved', () => {
      const file = FileBuilder.processedDocument(f.idString('doc'), {
        fullText: async () => ({ 1: 'lazy' }),
      });
      expect(file.toDTO()).not.toHaveProperty('fullText');
    });
  });

  describe('getFullText', () => {
    describe('when passing fullText directly', () => {
      it('returns fullText', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), { fullText: { 1: 'text' } });
        expect(await doc.getFullText()).toEqual({ 1: 'text' });
      });

      it('exposes fullText as a property', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), { fullText: { 1: 'text' } });
        expect(doc.fullText).toEqual({ 1: 'text' });
      });
    });

    describe('when passing a lazy loader', () => {
      it('fullText is undefined until loaded', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), {
          fullText: async () => ({ 1: 'lazy loaded' }),
        });
        expect(doc.fullText).toBeUndefined();
        await doc.getFullText();
        expect(doc.fullText).toEqual({ 1: 'lazy loaded' });
      });

      it('lazy loads fullText on demand', async () => {
        const doc = FileBuilder.processedDocument(f.idString('doc'), {
          fullText: async () => ({ 1: 'lazy loaded' }),
        });
        expect(await doc.getFullText()).toEqual({ 1: 'lazy loaded' });
      });

      it('lazy loads fullText only once', async () => {
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
