import { PropertyValue } from '#api/core/domain/template/PropertyValue.js';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';

export class DefaultPropertyAssignmentCreatorService implements PropertyAssignmentCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async create({ propertyAssignment, template }: CreatePropertyAssignmentInput) {
    const { name, value, language } = propertyAssignment;

    return template.createPropertyAssignment(
      name,
      { value: value as PropertyValue[], language },
      true
    );
  }
}
