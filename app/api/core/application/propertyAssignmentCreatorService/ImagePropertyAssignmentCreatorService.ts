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

    const mapped = propertyAssignment.value.map(inputValue => {
      if ('attachment' in inputValue) {
        const attachment = attachments?.[inputValue.attachment];
        if (!attachment) {
          throw new Error(`Attachment with index ${inputValue.attachment} not found.`);
        }

        return {
          value: attachment.filename,
        };
      }

      return {
        value: inputValue.value,
      };
    });

    createdAssignments.push(property.createPropertyAssignment({ value: mapped }, true));

    return createdAssignments;
  }
}
