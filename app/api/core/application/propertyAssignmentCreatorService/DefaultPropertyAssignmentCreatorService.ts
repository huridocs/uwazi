import { PropertyValue } from 'api/core/domain/template/PropertyValue';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService';
import {
  defaultPropertyAssignmentCreatorServiceContext,
  PropertyAssignmentCreatorServiceContext,
} from './AbstractPropertyAssignmentCreatorService';

export class DefaultPropertyAssignmentCreatorService implements PropertyAssignmentCreatorService {
  private context: PropertyAssignmentCreatorServiceContext;

  constructor(
    context: PropertyAssignmentCreatorServiceContext = defaultPropertyAssignmentCreatorServiceContext
  ) {
    this.context = context;
  }

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
