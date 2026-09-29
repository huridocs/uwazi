import { CsvImportRelationshipPendingValues } from '../CsvImportRelationshipPendingValues.js';

describe('CsvImportRelationshipPendingValues', () => {
  it('should carry id through create and toPersistence', () => {
    const pending = CsvImportRelationshipPendingValues.create({
      id: 'rel-pending-1',
      importId: 'import-1',
      templateId: 'template-1',
      titles: ['A'],
      createdAt: 100,
    });

    expect(pending.id).toBe('rel-pending-1');
    expect(pending.toPersistence()).toEqual({
      id: 'rel-pending-1',
      importId: 'import-1',
      templateId: 'template-1',
      titles: ['A'],
      createdAt: 100,
    });
  });
});
