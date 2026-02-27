import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService';

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
