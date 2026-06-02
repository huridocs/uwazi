type RelationshipResolutionReason = 'not_found' | 'ambiguous';

type CsvImportFileNotFoundErrorParams = {
  importId: string;
  filename: string;
  column: 'file' | 'files' | 'attachments';
  cause?: unknown;
};

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

type CsvImportPropertyValidationErrorParams = {
  property: string;
  column?: string;
  rawValue?: string;
  cause?: unknown;
};

export type {
  RelationshipResolutionReason,
  CsvImportFileNotFoundErrorParams,
  CsvImportRelationshipResolutionErrorParams,
  CsvRelationshipUnresolvedToken,
  CsvImportPropertyValidationErrorParams,
};
