import { z } from 'zod';
import { RowErrorCode } from '../../../domain/CsvImportRowError.js';
import { CsvRowImportErrorFactory } from '../CsvRowImportErrorFactory.js';
import {
  CsvImportFileNotFoundError,
  CsvImportEntityNotFoundInTemplateError,
  CsvImportPropertyValidationError,
  CsvImportRelationshipResolutionError,
  CsvImportRowEmptyError,
} from '../CsvImportRowProcessingError.js';

const createZodValidationError = () => {
  const dateSchema = z.object({ value: z.number() });
  try {
    dateSchema.parse({ value: Number.NaN });
    return undefined;
  } catch (error) {
    return error;
  }
};

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
    expect(rowError.message).toBe(
      'Relationship value could not be resolved to an existing entity.'
    );
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

  it('maps empty rows to ROW_EMPTY_OR_MALFORMED', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 2,
      error: new CsvImportRowEmptyError(),
    });

    expect(rowError.code).toBe(RowErrorCode.RowEmptyOrMalformed);
    expect(rowError.message).toBe('Empty line.');
    expect(rowError.details).toEqual({ reason: 'empty_line' });
  });

  it('maps unknown ids to ID_NOT_FOUND_IN_TEMPLATE', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 8,
      error: new CsvImportEntityNotFoundInTemplateError({
        sharedId: 'entity-shared-id',
        templateId: 'template-a',
      }),
    });

    expect(rowError.code).toBe(RowErrorCode.IdNotFoundInTemplate);
    expect(rowError.message).toBe('id not found in template');
    expect(rowError.property).toBe('id');
    expect(rowError.rawValue).toBe('entity-shared-id');
    expect(rowError.details).toEqual({ templateId: 'template-a' });
  });

  it('maps wrapped validation errors to VALUE_INVALID_FORMAT with context', () => {
    const rowError = CsvRowImportErrorFactory.fromException({
      importId: 'import-1',
      rowIndex: 3,
      error: new CsvImportPropertyValidationError({
        property: 'published_date',
        column: 'published_date__en',
        rawValue: 'not-a-date',
        cause: createZodValidationError(),
      }),
    });

    expect(rowError.code).toBe(RowErrorCode.ValueInvalidFormat);
    expect(rowError.property).toBe('published_date');
    expect(rowError.rawValue).toBe('not-a-date');
    expect(rowError.message).toContain('Invalid value for "published_date".');
    expect(rowError.details).toEqual(
      expect.objectContaining({
        column: 'published_date__en',
        sourceErrorName: 'ZodError',
      })
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
