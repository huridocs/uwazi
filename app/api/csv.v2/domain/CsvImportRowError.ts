enum RowErrorCode {
  RowEmptyOrMalformed = 'ROW_EMPTY_OR_MALFORMED',
  HeaderMissingRequiredColumn = 'HEADER_MISSING_REQUIRED_COLUMN',
  ValueInvalidFormat = 'VALUE_INVALID_FORMAT',
  ValueUnsupportedLanguageColumn = 'VALUE_UNSUPPORTED_LANGUAGE_COLUMN',
  ThesaurusValueNotFound = 'THESAURUS_VALUE_NOT_FOUND',
  RelationshipNotFound = 'RELATIONSHIP_NOT_FOUND',
  RelationshipAmbiguous = 'RELATIONSHIP_AMBIGUOUS',
  FileNotFound = 'FILE_NOT_FOUND',
  FileInvalidReference = 'FILE_INVALID_REFERENCE',
  InternalError = 'INTERNAL_ERROR',
}

type CsvImportRowErrorProps = {
  importId: string;
  rowIndex: number;
  message: string;
  code: RowErrorCode;
  property?: string;
  rawValue?: string;
  details?: Record<string, unknown>;
  createdAt: number;
};

class CsvImportRowError {
  readonly importId: string;

  readonly rowIndex: number;

  readonly message: string;

  readonly code: RowErrorCode;

  readonly property?: string;

  readonly rawValue?: string;

  readonly details?: Record<string, unknown>;

  readonly createdAt: number;

  private constructor(props: CsvImportRowErrorProps) {
    this.importId = props.importId;
    this.rowIndex = props.rowIndex;
    this.message = props.message;
    this.code = props.code;
    this.property = props.property;
    this.rawValue = props.rawValue;
    this.details = props.details;
    this.createdAt = props.createdAt;
  }

  static create(props: Omit<CsvImportRowErrorProps, 'createdAt'> & { createdAt?: number }) {
    return new CsvImportRowError({
      ...props,
      createdAt: props.createdAt ?? Date.now(),
    });
  }

  static fromObject(props: CsvImportRowErrorProps) {
    return new CsvImportRowError(props);
  }

  toObject() {
    return {
      importId: this.importId,
      rowIndex: this.rowIndex,
      message: this.message,
      code: this.code,
      property: this.property,
      rawValue: this.rawValue,
      details: this.details,
      createdAt: this.createdAt,
    };
  }
}

export type { CsvImportRowErrorProps };
export { CsvImportRowError, RowErrorCode };
