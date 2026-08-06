import { FileType } from '#shared/types/fileType.js';
import { entityDefaultDocument } from '../entityDefaultDocument.js';

describe('entityDefaultDocument', () => {
  let espDoc: FileType;
  let engDoc: FileType;
  let fraDoc: FileType;
  beforeEach(() => {
    engDoc = { language: 'eng', status: 'ready' };
    espDoc = { language: 'esp', status: 'ready' };
    fraDoc = { language: 'fra', status: 'ready' };
  });

  it('should return the first document matching the entity language', () => {
    expect(entityDefaultDocument([espDoc, engDoc], 'en', 'fr')).toEqual(engDoc);
  });

  describe('when no document matches entity', () => {
    it('should return the first document matching the default language', () => {
      expect(entityDefaultDocument([espDoc, fraDoc], 'en', 'fr')).toEqual(fraDoc);
    });
  });

  describe('when no document matches the entity or the default language', () => {
    it('should return the first document', () => {
      expect(entityDefaultDocument([espDoc], 'en', 'fr')).toEqual(espDoc);
    });
  });

  it('should not throw errors when no documents', () => {
    expect(entityDefaultDocument([], 'en', 'fr')).toBeUndefined();
  });

  it('should ignore documents that are not ready', () => {
    expect(
      entityDefaultDocument(
        [
          { language: 'eng', status: 'processing' },
          { language: 'esp', status: 'failed' },
          espDoc,
        ],
        'en',
        'fr'
      )
    ).toEqual(espDoc);
  });

  it('should return undefined when only non-ready documents exist', () => {
    expect(
      entityDefaultDocument([{ language: 'eng', status: 'processing' }], 'en', 'fr')
    ).toBeUndefined();
  });
});
