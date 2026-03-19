import { RowErrorCode } from '../../../domain/CsvImportRowError.js';
import { CsvRowImportErrorFactory } from '../CsvRowImportErrorFactory.js';
import {
  CsvImportFileNotFoundError,
  CsvImportRelationshipResolutionError,
} from '../CsvImportRowProcessingError.js';

describe('CsvRowImportErrorFactory', () => {
  it('maps missing file errors to FILE_NOT_FOUND with stable message/details', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 4,
      error: new CsvImportFileNotFoundError({
        importId: 'import-1',
        filename: 'missing.pdf',
        column: 'files',
      }),
    });

    expect(rowError.code).toBe(RowErrorCode.FileNotFound);
    expect(rowError.message).toBe('Referenced file was not found in the import package.');
    expect(rowError.rawValue).toBe('missing.pdf');
    expect(rowError.details).toEqual({
      filename: 'missing.pdf',
      column: 'files',
    });
  });

  it('maps relationship not-found errors to RELATIONSHIP_NOT_FOUND', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 5,
      error: new CsvImportRelationshipResolutionError({
        property: 'rel_any',
        unresolved: [
          {
            token: 'Unknown related',
            reason: 'not_found',
            scope: 'any-template',
          },
        ],
      }),
    });

    expect(rowError.code).toBe(RowErrorCode.RelationshipNotFound);
    expect(rowError.property).toBe('rel_any');
    expect(rowError.rawValue).toBe('Unknown related');
    expect(rowError.message).toBe('Relationship value could not be resolved to an existing entity.');
    expect(rowError.details).toEqual({
      unresolved: [
        {
          token: 'Unknown related',
          reason: 'not_found',
          scope: 'any-template',
          candidates: undefined,
        },
      ],
    });
  });

  it('maps relationship ambiguous errors to RELATIONSHIP_AMBIGUOUS', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 5,
      error: new CsvImportRelationshipResolutionError({
        property: 'rel_any',
        unresolved: [
          {
            token: 'Duplicate title',
            reason: 'ambiguous',
            candidates: 3,
            scope: 'template abc123',
          },
        ],
      }),
    });

    expect(rowError.code).toBe(RowErrorCode.RelationshipAmbiguous);
    expect(rowError.message).toBe(
      'Relationship value is ambiguous and cannot be resolved uniquely.'
    );
  });

  it('sanitizes unknown errors to INTERNAL_ERROR', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 9,
      error: new TypeError("Cannot read properties of undefined (reading 'foo')"),
    });

    expect(rowError.code).toBe(RowErrorCode.InternalError);
    expect(rowError.message).toBe('Row could not be imported due to an internal processing error.');
    expect(rowError.details).toEqual({ errorName: 'TypeError' });
  });
});
