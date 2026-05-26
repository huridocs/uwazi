import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { ProcessedPDFDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { ProcessedPDF, ProcessedPDFProps } from '../ProcessedPDF.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('ProcessedPDF', () => {
  describe('validation', () => {
    const validProps: ProcessedPDFProps = {
      id: 'file123',
      originalname: 'document.pdf',
      filename: 'doc_abc123.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      creationDate: 1234567890,
      uploaded: true,
      entity: 'sharedId1',
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

    it.each<[string, Partial<ProcessedPDFProps>]>([
      ['entity is undefined', { entity: undefined }],
      ['entity is empty', { entity: '  ' }],

      ['language is undefined', { language: undefined }],
      ['language is empty', { language: '  ' as any }],

      ['totalPages is negative', { totalPages: -1 }],
    ])('throws on %s', (_name, overrides) => {
      expect(
        () => new ProcessedPDF({ ...validProps, ...overrides })
      ).toThrowErrorMatchingSnapshot();
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
        fullText: {},
        entity: 'not_allowed',
        totalPages: 1,
      });

      expect(updated).toBeInstanceOf(ProcessedPDF);
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

    it('does not mutate the input object', () => {
      const file = FileBuilder.processedDocument('doc', { language: 'en' });
      const input = {
        language: 'fr' as const,
        entity: 'should-not-change',
        fullText: { 1: 'hacked' },
      };

      file.update(input);

      expect(input.entity).toBe('should-not-change');
      expect(input.fullText).toEqual({ 1: 'hacked' });
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
