import { CsvImportEntityNotFoundInTemplateErrorParams } from './CsvImportRowProcessingErrorTypes.js';

class CsvImportEntityNotFoundInTemplateError extends Error {
  readonly sharedId: string;

  readonly templateId: string;

  constructor(params: CsvImportEntityNotFoundInTemplateErrorParams) {
    super(`Entity "${params.sharedId}" was not found in template "${params.templateId}"`);
    this.name = 'CsvImportEntityNotFoundInTemplateError';
    this.sharedId = params.sharedId;
    this.templateId = params.templateId;
  }
}

export { CsvImportEntityNotFoundInTemplateError };
