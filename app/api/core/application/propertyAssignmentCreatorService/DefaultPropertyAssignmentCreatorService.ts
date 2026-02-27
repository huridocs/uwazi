import { PropertyValue } from 'api/core/domain/template/PropertyValue';
import { CreatePropertyAssignmentInput } from './PropertyAssignmentCreatorService';
import { AbstractPropertyAssignmentCreatorService } from './AbstractPropertyAssignmentCreatorService';

export class DefaultPropertyAssignmentCreatorService extends AbstractPropertyAssignmentCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async create({ propertyAssignment, template }: CreatePropertyAssignmentInput) {
    const { name, value, language } = propertyAssignment;

    return template.createPropertyAssignment(
      name,
      { value: value as PropertyValue[], language },
      this.context.validateRequired
    );
  }
}
