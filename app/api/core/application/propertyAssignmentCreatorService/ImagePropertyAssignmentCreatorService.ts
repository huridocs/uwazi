import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { ImageProperty } from 'api/core/domain/template/ImageProperty';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService';

type ImageValueInput = { value: string } | { attachment: number };

export class ImagePropertyAssignmentCreatorService implements PropertyAssignmentCreatorService {
  // eslint-disable-next-line max-statements
  async create({
    propertyAssignment,
    template,
    attachments,
  }: CreatePropertyAssignmentInput<ImageValueInput>): Promise<PropertyAssignment[]> {
    const property = template
      .getPropertyByName<ImageProperty>(propertyAssignment.name)
      .getDataOrThrow();

    const createdAssignments: PropertyAssignment[] = [];

    const mapped = propertyAssignment.value.map(inputValue => ({
      value:
        'attachment' in inputValue
          ? attachments?.[inputValue.attachment]?.filename || ''
          : inputValue.value,
    }));

    createdAssignments.push(property.createPropertyAssignment({ value: mapped }));

    return createdAssignments;
  }
}
