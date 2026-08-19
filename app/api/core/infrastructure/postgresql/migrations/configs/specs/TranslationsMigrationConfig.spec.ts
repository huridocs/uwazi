import { ObjectId } from 'mongodb';
import { TranslationsMigrationConfig } from '../TranslationsMigrationConfig.js';

describe('TranslationsMigrationConfig', () => {
  it('should flatten mongo translationsV2 docs to translations rows', () => {
    const id = new ObjectId();
    const mapped = TranslationsMigrationConfig.mapDocument({
      _id: id,
      language: 'es',
      key: 'Search',
      value: 'Buscar',
      context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
    });

    expect(TranslationsMigrationConfig.mongoCollection).toBe('translationsV2');
    expect(TranslationsMigrationConfig.pgTable).toBe('translations');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      language: 'es',
      key: 'Search',
      value: 'Buscar',
      context_id: 'System',
      context_type: 'Uwazi UI',
      context_label: 'User Interface',
    });
  });

  it('should stringify non-ObjectId ids and default missing values', () => {
    const mapped = TranslationsMigrationConfig.mapDocument({
      _id: 'abc123',
      language: 'en',
      key: 'Search',
      context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
    });

    expect(mapped._id).toBe('abc123');
    expect(mapped.value).toBe('');
  });
});
