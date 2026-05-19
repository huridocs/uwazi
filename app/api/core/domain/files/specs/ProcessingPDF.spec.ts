import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
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
