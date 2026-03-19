type RelationshipResolutionReason = 'not_found' | 'ambiguous';

type CsvImportFileNotFoundErrorParams = {
  importId: string;
  filename: string;
  column: 'file' | 'files' | 'attachments';
  cause?: unknown;
};

class CsvImportFileNotFoundError extends Error {
  readonly importId: string;

  readonly filename: string;

  readonly column: 'file' | 'files' | 'attachments';

  readonly cause?: unknown;

  constructor(params: CsvImportFileNotFoundErrorParams) {
    super(`CSV import missing file "${params.filename}" for import ${params.importId}`);
    this.name = 'CsvImportFileNotFoundError';
    this.importId = params.importId;
    this.filename = params.filename;
    this.column = params.column;
    this.cause = params.cause;
  }
}

type CsvRelationshipUnresolvedToken = {
  token: string;
  reason: RelationshipResolutionReason;
  candidates?: number;
  scope: string;
};

type CsvImportRelationshipResolutionErrorParams = {
  property: string;
  unresolved: CsvRelationshipUnresolvedToken[];
};

class CsvImportRelationshipResolutionError extends Error {
  readonly property: string;

  readonly unresolved: CsvRelationshipUnresolvedToken[];

  constructor(params: CsvImportRelationshipResolutionErrorParams) {
    const unresolvedMessage = params.unresolved
      .map(unresolved => {
        const base = `"${unresolved.token}" (${unresolved.reason}, scope: ${unresolved.scope})`;
        if (unresolved.reason !== 'ambiguous') {
          return base;
        }
        return `"${unresolved.token}" (${unresolved.reason}, candidates: ${unresolved.candidates || 0}, scope: ${unresolved.scope})`;
      })
      .join('; ');
    super(`Unresolvable relationship value(s) for property "${params.property}": ${unresolvedMessage}`);
    this.name = 'CsvImportRelationshipResolutionError';
    this.property = params.property;
    this.unresolved = params.unresolved;
  }
}

export type {
  RelationshipResolutionReason,
  CsvImportFileNotFoundErrorParams,
  CsvImportRelationshipResolutionErrorParams,
  CsvRelationshipUnresolvedToken,
};
export { CsvImportFileNotFoundError, CsvImportRelationshipResolutionError };
