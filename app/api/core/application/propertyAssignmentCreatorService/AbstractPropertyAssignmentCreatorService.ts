import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService.js';

type Context = {
  validateRequired: boolean;
};

const defaultContext: Context = { validateRequired: false };

abstract class AbstractPropertyAssignmentCreatorService
  implements PropertyAssignmentCreatorService
{
  protected context: Context;

  constructor(context: Context = defaultContext) {
    this.context = context;
  }

  abstract create(
    input: CreatePropertyAssignmentInput
  ): Promise<PropertyAssignment | PropertyAssignment[]>;
}

export type { Context as PropertyAssignmentCreatorServiceContext };
export { defaultContext as defaultPropertyAssignmentCreatorServiceContext };
export { AbstractPropertyAssignmentCreatorService };
