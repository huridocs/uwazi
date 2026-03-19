import { CsvImportRowError, RowErrorCode } from '../../domain/CsvImportRowError.js';
import {
  CsvImportFileNotFoundError,
  CsvImportRelationshipResolutionError,
  CsvRelationshipUnresolvedToken,
} from './CsvImportRowProcessingError.js';

type BuildRowErrorInput = {
  importId: string;
  rowIndex: number;
  error: unknown;
};

const toDetails = (
  unresolved: CsvRelationshipUnresolvedToken[]
): Array<{ token: string; reason: string; scope: string; candidates?: number }> =>
  unresolved.map(token => ({
    token: token.token,
    reason: token.reason,
    scope: token.scope,
    candidates: token.candidates,
  }));

class CsvRowImportErrorFactory {
  static fromException(input: BuildRowErrorInput): CsvImportRowError {
    const { importId, rowIndex, error } = input;

    if (error instanceof CsvImportFileNotFoundError) {
      return CsvImportRowError.create({
        importId,
        rowIndex,
        code: RowErrorCode.FileNotFound,
        message: 'Referenced file was not found in the import package.',
        rawValue: error.filename,
        details: {
          filename: error.filename,
          column: error.column,
        },
      });
    }

    if (error instanceof CsvImportRelationshipResolutionError) {
      const hasAmbiguous = error.unresolved.some(unresolved => unresolved.reason === 'ambiguous');
      const selected = error.unresolved[0];
      return CsvImportRowError.create({
        importId,
        rowIndex,
        code: hasAmbiguous ? RowErrorCode.RelationshipAmbiguous : RowErrorCode.RelationshipNotFound,
        message: hasAmbiguous
          ? 'Relationship value is ambiguous and cannot be resolved uniquely.'
          : 'Relationship value could not be resolved to an existing entity.',
        property: error.property,
        rawValue: selected?.token,
        details: {
          unresolved: toDetails(error.unresolved),
        },
      });
    }

    return CsvImportRowError.create({
      importId,
      rowIndex,
      code: RowErrorCode.InternalError,
      message: 'Row could not be imported due to an internal processing error.',
      details: {
        errorName: error instanceof Error ? error.name : typeof error,
      },
    });
  }
}

export { CsvRowImportErrorFactory };
export type { BuildRowErrorInput };
