import {
  CreateInputPropertyAssignment,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService';

export class DefaultPropertyAssignmentCreatorService implements PropertyAssignmentCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async create({ propertyAssignment, template }: CreateInputPropertyAssignment) {
    return template.createPropertyAssignment(propertyAssignment.name, propertyAssignment);
  }
}
