import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { CustomDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
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

  describe('fromDBO', () => {
    it('should map all fields including the content loader', () => {
      const _id = new ObjectId();
      const dbo: CustomDBO = {
        _id,
        originalname: 'asset.png',
        filename: 'abc123.png',
        mimetype: 'image/png',
        size: 4096,
        creationDate: 1000000000,
        type: 'custom',
      };
      const content = FileBuilder.content('custom bytes');
      const contentLoader = jest.fn().mockReturnValue(content);

      const file = CustomUpload.fromDBO(dbo, contentLoader);

      expect(file).toBeInstanceOf(CustomUpload);
      expect(file.id).toBe(_id.toString());
      expect(file.originalname).toBe('asset.png');
      expect(file.filename).toBe('abc123.png');
      expect(file.mimetype).toBe('image/png');
      expect(file.size).toBe(4096);
      expect(file.creationDate).toBe(1000000000);
      expect(file.content).toBe(content);
      expect(contentLoader).toHaveBeenCalledWith({ type: 'custom', filename: 'abc123.png' });
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
