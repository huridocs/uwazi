/* eslint-disable max-classes-per-file */
export abstract class IXValidationError extends Error {}

export class FileTypeNotSupportedError extends IXValidationError {
  constructor(fileType: string) {
    super(`The following File type ${fileType} is not supported for blank Suggestions creation`);
    this.name = 'FileTypeNotSupportedError';
  }
}

export class LanguageNotSupportedError extends IXValidationError {
  constructor(language: string) {
    super(`The following language ${language} is not supported for blank Suggestions creation`);
    this.name = 'LanguageNotSupportedError';
  }
}

export class ExtractorsNotAvailableError extends IXValidationError {
  constructor(templateId: string) {
    super(`There are no Extractors available for the template ${templateId}`);
    this.name = 'ExtractorsNotAvailableError';
  }
}
