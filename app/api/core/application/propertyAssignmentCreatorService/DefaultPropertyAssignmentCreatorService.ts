import { PropertyValue } from '#api/core/domain/template/PropertyValue.js';
import { CreatePropertyAssignmentInput } from './PropertyAssignmentCreatorService.js';
import { AbstractPropertyAssignmentCreatorService } from './AbstractPropertyAssignmentCreatorService.js';

export class DefaultPropertyAssignmentCreatorService extends AbstractPropertyAssignmentCreatorService {
  async create({ propertyAssignment, template }: CreatePropertyAssignmentInput) {
    const { name, value, language } = propertyAssignment;

    return template.createPropertyAssignment(
      name,
      { value: value as PropertyValue[], language },
      this.context.validateRequired
    );
  }
}
