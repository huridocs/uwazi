import { CsvImportRow } from '../CsvImportRow.js';

describe('CsvImportRow', () => {
  it('should carry id through create, toObject and fromObject', () => {
    const row = CsvImportRow.create({
      id: 'row-1',
      importId: 'import-1',
      rowIndex: 0,
      headers: ['title'],
      values: ['A'],
    });

    expect(row.id).toBe('row-1');
    expect(row.toObject()).toEqual({
      id: 'row-1',
      importId: 'import-1',
      rowIndex: 0,
      headers: ['title'],
      values: ['A'],
    });
    expect(CsvImportRow.fromObject(row.toObject()).id).toBe('row-1');
  });
});
