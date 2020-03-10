import { FileType } from 'shared/types/fileType';
import { entityDefaultDocument } from '../entityDefaultDocument';

describe('entityDefaultDocument', () => {
  let espDoc: FileType;
  let engDoc: FileType;
  let fraDoc: FileType;
  beforeEach(() => {
    engDoc = { language: 'eng' };
    espDoc = { language: 'esp' };
    fraDoc = { language: 'fra' };
  });

  it('should return the first document matching the entity language', () => {
    expect(entityDefaultDocument([espDoc, engDoc], 'en', 'fr')).toEqual({ language: 'eng' });
  });

  describe('when no document matches entity', () => {
    it('should return the first document matching the default language', () => {
      expect(entityDefaultDocument([espDoc, fraDoc], 'en', 'fr')).toEqual({
        language: 'fra',
      });
    });
  });

  describe('when no document matches the entity or the default language', () => {
    it('should return the first document', () => {
      expect(entityDefaultDocument([espDoc], 'en', 'fr')).toEqual({
        language: 'esp',
      });
    });
  });

  it('should not throw errors when no documents', () => {
    expect(entityDefaultDocument([], 'en', 'fr')).toBeUndefined();
  });
});
