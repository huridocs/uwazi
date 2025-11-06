import { PropertyValue } from 'api/core/domain/template/PropertyValue';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService';

export class DefaultPropertyAssignmentCreatorService implements PropertyAssignmentCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async create({ propertyAssignment, template }: CreatePropertyAssignmentInput) {
    const { name, value, language } = propertyAssignment;

    return template.createPropertyAssignment(name, { value: value as PropertyValue[], language });
  }
}
