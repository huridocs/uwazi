import {
  CsvImportRelationshipResolutionErrorParams,
  CsvRelationshipUnresolvedToken,
} from './CsvImportRowProcessingErrorTypes.js';

const buildUnresolvedTokenMessage = (unresolved: CsvRelationshipUnresolvedToken) => {
  const base = `"${unresolved.token}" (${unresolved.reason}, scope: ${unresolved.scope})`;
  if (unresolved.reason !== 'ambiguous') {
    return base;
  }
  return `"${unresolved.token}" (${unresolved.reason}, candidates: ${
    unresolved.candidates || 0
  }, scope: ${unresolved.scope})`;
};

class CsvImportRelationshipResolutionError extends Error {
  readonly property: string;

  readonly unresolved: CsvRelationshipUnresolvedToken[];

  constructor(params: CsvImportRelationshipResolutionErrorParams) {
    const unresolvedMessage = params.unresolved.map(buildUnresolvedTokenMessage).join('; ');
    super(
      `Unresolvable relationship value(s) for property "${params.property}": ${unresolvedMessage}`
    );
    this.name = 'CsvImportRelationshipResolutionError';
    this.property = params.property;
    this.unresolved = params.unresolved;
  }
}

export { CsvImportRelationshipResolutionError };
