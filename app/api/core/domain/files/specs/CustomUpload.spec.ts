import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { CustomUpload } from '../CustomUpload.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('CustomUpload', () => {
  describe('toDTO', () => {
    it('should include all base and specialized properties', () => {
      const id = f.idString('custom');
      const file = FileBuilder.customUpload(id, {
        originalname: 'asset.png',
        filename: 'abc123.png',
        mimetype: 'image/png',
        size: 4096,
        creationDate: 1000000000,
      });

      expect(file.toDTO()).toEqual({
        _id: id,
        originalname: 'asset.png',
        filename: 'abc123.png',
        mimetype: 'image/png',
        size: 4096,
        creationDate: 1000000000,
        type: 'custom',
      });
    });
  });

  describe('content', () => {
    it('exposes content as non-optional', () => {
      const content = FileBuilder.content('custom upload bytes');
      const file = new CustomUpload({
        id: 'id',
        filename: 'asset.png',
        originalname: 'asset.png',
        mimetype: 'image/png',
        content,
      });
      expect(file.content).toBe(content);
    });
  });

  describe('update', () => {
    it('should rename and preserve all properties', () => {
      const content = FileBuilder.content('custom upload bytes');
      const file = FileBuilder.customUpload(f.idString('custom'), {
        originalname: 'original.file',
        content,
      });
      const updated = file.update({ originalname: 'renamed.file' });

      expect(updated).toBeInstanceOf(CustomUpload);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.file' });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.file');
    });
  });
});
