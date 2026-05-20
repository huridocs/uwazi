import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { ThumbnailDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
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

  describe('fromDBO', () => {
    it('should map all fields including ISO639-3 to ISO639-1 language conversion', () => {
      const _id = new ObjectId();
      const dbo: ThumbnailDBO = {
        _id,
        originalname: 'preview.jpg',
        filename: 'abc123.jpg',
        mimetype: 'image/jpeg',
        size: 3072,
        creationDate: 1000000000,
        type: 'thumbnail',
        entity: 'sharedId1',
        language: 'spa',
      };
      const content = FileBuilder.content('thumbnail bytes');
      const contentLoader = jest.fn().mockReturnValue(content);

      const file = Thumbnail.fromDBO(dbo, contentLoader);

      expect(file).toBeInstanceOf(Thumbnail);
      expect(file.id).toBe(_id.toString());
      expect(file.originalname).toBe('preview.jpg');
      expect(file.filename).toBe('abc123.jpg');
      expect(file.mimetype).toBe('image/jpeg');
      expect(file.size).toBe(3072);
      expect(file.creationDate).toBe(1000000000);
      expect(file.entity).toBe('sharedId1');
      expect(file.language).toBe('es');
      expect(file.content).toBe(content);
      expect(contentLoader).toHaveBeenCalledWith({ type: 'thumbnail', filename: 'abc123.jpg' });
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
