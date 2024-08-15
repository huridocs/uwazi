import { SemanticConfig } from '../types/SemanticConfig';

export interface ATConfigValidator {
  getErrors(): string[];
  validate(data: unknown): data is SemanticConfig;
}
