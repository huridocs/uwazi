import { ZodError } from 'zod';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { CsvImportRowError, RowErrorCode } from '../../domain/CsvImportRowError.js';
import {
  CsvImportFileNotFoundError,
  CsvImportEntityNotFoundInTemplateError,
  CsvImportPropertyValidationError,
  CsvImportRelationshipResolutionError,
  CsvImportRowEmptyError,
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

const mapFileNotFoundError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof CsvImportFileNotFoundError)) {
    return undefined;
  }

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
};

const mapRelationshipResolutionError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof CsvImportRelationshipResolutionError)) {
    return undefined;
  }

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
};

const mapEntityNotFoundInTemplateError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof CsvImportEntityNotFoundInTemplateError)) {
    return undefined;
  }

  return CsvImportRowError.create({
    importId,
    rowIndex,
    code: RowErrorCode.IdNotFoundInTemplate,
    message: 'id not found in template',
    property: 'id',
    rawValue: error.sharedId,
    details: {
      templateId: error.templateId,
    },
  });
};

const mapEmptyRowError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof CsvImportRowEmptyError)) {
    return undefined;
  }

  return CsvImportRowError.create({
    importId,
    rowIndex,
    code: RowErrorCode.RowEmptyOrMalformed,
    message: 'Empty line.',
    details: {
      reason: 'empty_line',
    },
  });
};

const getValidationMessage = (source: unknown) => {
  if (source instanceof ZodError) {
    return source.issues[0]?.message || 'Invalid value format.';
  }
  if (source instanceof Error) {
    return source.message;
  }
  return 'Invalid value format.';
};

const mapPropertyValidationError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof CsvImportPropertyValidationError)) {
    return undefined;
  }

  const validationSource = error.cause;
  const validationMessage = getValidationMessage(validationSource);
  return CsvImportRowError.create({
    importId,
    rowIndex,
    code: RowErrorCode.ValueInvalidFormat,
    message: `Invalid value for "${error.property}". ${validationMessage}`,
    property: error.property,
    rawValue: error.rawValue,
    details: {
      column: error.column || error.property,
      validationMessage,
      sourceErrorName:
        validationSource instanceof Error ? validationSource.name : typeof validationSource,
    },
  });
};

const mapZodError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof ZodError)) {
    return undefined;
  }

  const validationMessage = getValidationMessage(error);
  return CsvImportRowError.create({
    importId,
    rowIndex,
    code: RowErrorCode.ValueInvalidFormat,
    message: validationMessage,
    details: {
      validationMessage,
      sourceErrorName: 'ZodError',
    },
  });
};

const mapDomainError = (input: BuildRowErrorInput) => {
  const { importId, rowIndex, error } = input;
  if (!(error instanceof DomainError)) {
    return undefined;
  }

  return CsvImportRowError.create({
    importId,
    rowIndex,
    code: RowErrorCode.ValueInvalidFormat,
    message: error.message,
    details: {
      sourceErrorName: error.name,
      sourceErrorCode: error.code,
    },
  });
};

const mapKnownError = (input: BuildRowErrorInput) => {
  const mappers = [
    mapFileNotFoundError,
    mapRelationshipResolutionError,
    mapEntityNotFoundInTemplateError,
    mapEmptyRowError,
    mapPropertyValidationError,
    mapZodError,
    mapDomainError,
  ];

  for (const mapper of mappers) {
    const mapped = mapper(input);
    if (mapped) {
      return mapped;
    }
  }
  return undefined;
};

class CsvRowImportErrorFactory {
  static fromException(input: BuildRowErrorInput): CsvImportRowError {
    const mapped = mapKnownError(input);
    if (mapped) {
      return mapped;
    }

    return CsvImportRowError.create({
      importId: input.importId,
      rowIndex: input.rowIndex,
      code: RowErrorCode.InternalError,
      message: 'Row could not be imported due to an internal processing error.',
      details: {
        errorName: input.error instanceof Error ? input.error.name : typeof input.error,
      },
    });
  }
}

export { CsvRowImportErrorFactory };
export type { BuildRowErrorInput };
