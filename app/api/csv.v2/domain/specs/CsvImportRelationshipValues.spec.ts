import { CsvImportRelationshipValues } from '../CsvImportRelationshipValues.js';

describe('CsvImportRelationshipValues', () => {
  it('should carry id through create and toPersistence', () => {
    const values = CsvImportRelationshipValues.create({
      id: 'rel-values-1',
      importId: 'import-1',
      templateId: 'template-1',
      values: [],
      createdAt: 100,
    });

    expect(values.id).toBe('rel-values-1');
    expect(values.toPersistence()).toEqual({
      id: 'rel-values-1',
      importId: 'import-1',
      templateId: 'template-1',
      values: [],
      createdAt: 100,
    });
  });
});
