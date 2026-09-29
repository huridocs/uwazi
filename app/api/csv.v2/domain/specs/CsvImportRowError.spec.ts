import { CsvImportRowError, RowErrorCode } from '../CsvImportRowError.js';

describe('CsvImportRowError', () => {
  it('should carry id through create, toObject and fromObject', () => {
    const error = CsvImportRowError.create({
      id: 'error-1',
      importId: 'import-1',
      rowIndex: 2,
      message: 'bad',
      code: RowErrorCode.InternalError,
      createdAt: 100,
    });

    expect(error.id).toBe('error-1');
    expect(error.toObject()).toEqual({
      id: 'error-1',
      importId: 'import-1',
      rowIndex: 2,
      message: 'bad',
      code: RowErrorCode.InternalError,
      property: undefined,
      rawValue: undefined,
      details: undefined,
      createdAt: 100,
    });
    expect(CsvImportRowError.fromObject(error.toObject()).id).toBe('error-1');
  });
});
