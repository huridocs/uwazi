import { FileSchema } from 'api/files/fileType';
import entityDocument from '../entityDefaultDocument';

describe('entityDocument', () => {
  let espDoc: FileSchema;
  let engDoc: FileSchema;
  let fraDoc: FileSchema;
  beforeEach(() => {
    engDoc = { language: 'eng' };
    espDoc = { language: 'esp' };
    fraDoc = { language: 'fra' };
  });

  it('should return the first document matching the entity language', () => {
    expect(entityDocument([espDoc, engDoc], 'en', 'fr')).toEqual({ language: 'eng' });
  });

  describe('when no document matches entity', () => {
    it('should return the first document matching the default language', () => {
      expect(entityDocument([espDoc, fraDoc], 'en', 'fr')).toEqual({
        language: 'fra',
      });
    });
  });

  describe('when no document matches the entity or the default language', () => {
    it('should return the first document', () => {
      expect(entityDocument([espDoc], 'en', 'fr')).toEqual({
        language: 'esp',
      });
    });
  });

  it('should not throw errors when no documents', () => {
    expect(entityDocument([], 'en', 'fr')).toBeUndefined();
  });
});
