/* eslint-disable no-plusplus */
/* eslint-disable max-statements */
import { Translation } from '../Translation.js';
import { TranslationCollection } from '../TranslationCollection.js';

describe('TranslationCollection', () => {
  const createTranslation = (
    key: string,
    value: string,
    language: string,
    contextId: string = 'thesaurus1'
  ) =>
    new Translation(key, value, language as any, {
      type: 'Thesaurus',
      label: 'Test Thesaurus',
      id: contextId,
    });

  describe('constructor and hash map building', () => {
    it('should build hash maps on construction', () => {
      const translations = [
        createTranslation('key1', 'value1-en', 'en'),
        createTranslation('key2', 'value2-en', 'en'),
        createTranslation('key1', 'value1-es', 'es'),
        createTranslation('key2', 'value2-es', 'es'),
      ];

      const collection = new TranslationCollection(translations);

      expect(collection.getTranslation('en', 'key1')).toBe('value1-en');
      expect(collection.getTranslation('en', 'key2')).toBe('value2-en');
      expect(collection.getTranslation('es', 'key1')).toBe('value1-es');
      expect(collection.getTranslation('es', 'key2')).toBe('value2-es');
    });

    it('should handle empty translations array', () => {
      const collection = new TranslationCollection([]);

      expect(collection.getTranslation('en', 'key1')).toBe('key1');
    });
  });

  describe('getTranslation', () => {
    const translations = [
      createTranslation('Name', 'Nombre', 'es'),
      createTranslation('Age', 'Edad', 'es'),
      createTranslation('Name', 'Nom', 'fr'),
    ];

    const collection = new TranslationCollection(translations);

    it('should return the translated value for a valid language and key', () => {
      expect(collection.getTranslation('es', 'Name')).toBe('Nombre');
      expect(collection.getTranslation('es', 'Age')).toBe('Edad');
      expect(collection.getTranslation('fr', 'Name')).toBe('Nom');
    });

    it('should return the key when translation does not exist for the language', () => {
      expect(collection.getTranslation('en', 'Name')).toBe('Name');
    });

    it('should return the key when translation does not exist for the key', () => {
      expect(collection.getTranslation('es', 'NonExistent')).toBe('NonExistent');
    });

    it('should return the fallback when provided and translation does not exist', () => {
      expect(collection.getTranslation('en', 'Name', 'Default Name')).toBe('Default Name');
      expect(collection.getTranslation('es', 'NonExistent', 'Default')).toBe('Default');
    });

    it('should return the translation even when fallback is provided', () => {
      expect(collection.getTranslation('es', 'Name', 'Default')).toBe('Nombre');
    });
  });

  describe('getTranslations', () => {
    const translations = [
      createTranslation('Name', 'Nombre', 'es'),
      createTranslation('Age', 'Edad', 'es'),
      createTranslation('Name', 'Nom', 'fr'),
    ];

    const collection = new TranslationCollection(translations);

    it('should return all translations for a language', () => {
      const esTranslations = collection.getTranslations('es');

      expect(esTranslations.size).toBe(2);
      expect(esTranslations.get('Name')).toBe('Nombre');
      expect(esTranslations.get('Age')).toBe('Edad');
    });

    it('should return empty map for non-existent language', () => {
      const enTranslations = collection.getTranslations('en');

      expect(enTranslations.size).toBe(0);
    });
  });

  describe('getAllTranslations', () => {
    it('should return all original translations', () => {
      const translations = [
        createTranslation('Name', 'Nombre', 'es'),
        createTranslation('Age', 'Edad', 'es'),
      ];

      const collection = new TranslationCollection(translations);
      const all = collection.getAllTranslations();

      expect(all).toEqual(translations);
      expect(all.length).toBe(2);
    });
  });

  describe('performance characteristics', () => {
    it('should handle large number of translations efficiently', () => {
      const translations = [];
      for (let i = 0; i < 1000; i++) {
        translations.push(createTranslation(`key${i}`, `value${i}-en`, 'en'));
        translations.push(createTranslation(`key${i}`, `value${i}-es`, 'es'));
      }

      const startTime = Date.now();
      const collection = new TranslationCollection(translations);
      const constructionTime = Date.now() - startTime;

      // Hash maps should be built quickly
      expect(constructionTime).toBeLessThan(100);

      // Lookups should be O(1)
      const lookupStart = Date.now();
      for (let i = 0; i < 100; i++) {
        collection.getTranslation('en', `key${i}`);
      }
      const lookupTime = Date.now() - lookupStart;

      expect(lookupTime).toBeLessThan(10);
    });
  });
});
