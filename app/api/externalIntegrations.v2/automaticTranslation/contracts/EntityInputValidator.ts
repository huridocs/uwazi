import { EntityInputData } from 'api/entities.v2/EntityInputDataType';

export interface EntityInputValidator {
  getErrors(): string[];
  validate(data: unknown): data is EntityInputData;
}
