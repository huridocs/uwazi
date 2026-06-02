import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { ImageProperty } from '#api/core/domain/template/ImageProperty.js';
import { AttachmentNotFoundError } from '#api/core/domain/entity/errors.js';
import { CreatePropertyAssignmentInput } from './PropertyAssignmentCreatorService.js';
import { AbstractPropertyAssignmentCreatorService } from './AbstractPropertyAssignmentCreatorService.js';

type ImageValueInput = { value: string } | { attachment: number };

export class ImagePropertyAssignmentCreatorService extends AbstractPropertyAssignmentCreatorService {
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
          throw new AttachmentNotFoundError(inputValue.attachment, attachments || []);
        }

        return {
          value: attachment.filename,
        };
      }

      return {
        value: inputValue.value,
      };
    });

    createdAssignments.push(
      property.createPropertyAssignment({ value: mapped }, this.context.validateRequired)
    );

    return createdAssignments;
  }
}
