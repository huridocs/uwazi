import { EntityInputData } from '../RequestEntityTranslation';

export interface EntityInputValidator {
  getErrors(): string[];
  validate(data: unknown): data is EntityInputData;
}
