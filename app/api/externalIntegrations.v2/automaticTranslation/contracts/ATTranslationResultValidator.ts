import { TranslationResult } from '../types/TranslationResult';

export interface ATTranslationResultValidator {
  getErrors(): string[];
  validate(data: unknown): data is TranslationResult;
}
