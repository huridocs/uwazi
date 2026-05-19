import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { Thumbnail } from '../Thumbnail.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('Thumbnail', () => {
  describe('toDTO', () => {
    it('should include all base and specialized properties', () => {
      const id = f.idString('thumb');
      const file = FileBuilder.thumbnail(id, {
        originalname: 'preview.jpg',
        filename: 'abc123.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1000000000,
        entity: 'sharedId1',
        language: 'es',
      });

      expect(file.toDTO()).toEqual({
        _id: id,
        originalname: 'preview.jpg',
        filename: 'abc123.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1000000000,
        entity: 'sharedId1',
        language: 'spa',
        type: 'thumbnail',
      });
    });
  });

  describe('update', () => {
    it('should rename and preserve all properties', () => {
      const content = FileBuilder.content('thumbnail bytes');
      const file = FileBuilder.thumbnail(f.idString('thumb'), {
        originalname: 'original.jpg',
        entity: 'sharedId1',
        language: 'es',
        content,
      });
      const updated = file.update({ originalname: 'renamed.jpg' });

      expect(updated).toBeInstanceOf(Thumbnail);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.jpg' });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.jpg');
    });
  });
});
