import { Validate } from '../types/Validate';

export interface ATConfigValidator {
  validate(data: unknown): Validate;
}
