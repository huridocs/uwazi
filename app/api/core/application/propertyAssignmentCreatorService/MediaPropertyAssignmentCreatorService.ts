import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { MediaProperty } from '#api/core/domain/template/MediaProperty.js';
import { AttachmentNotFoundError } from '#api/core/domain/entity/errors.js';
import { CreatePropertyAssignmentInput } from './PropertyAssignmentCreatorService.js';
import { AbstractPropertyAssignmentCreatorService } from './AbstractPropertyAssignmentCreatorService.js';

type MediaValueInput = { value: string } | { attachment: number; timeLinks?: string };

export class MediaPropertyAssignmentCreatorService extends AbstractPropertyAssignmentCreatorService {
  // eslint-disable-next-line max-statements
  async create({
    propertyAssignment,
    template,
    attachments,
  }: CreatePropertyAssignmentInput<MediaValueInput>): Promise<PropertyAssignment[]> {
    const property = template
      .getPropertyByName<MediaProperty>(propertyAssignment.name)
      .getDataOrThrow();

    const createdAssignments: PropertyAssignment[] = [];

    const mapped = propertyAssignment.value.map(inputValue => {
      if ('attachment' in inputValue) {
        const attachment = attachments?.[inputValue.attachment];
        if (!attachment) {
          throw new AttachmentNotFoundError(inputValue.attachment, attachments || []);
        }

        return {
          value: property.assignFilePath(attachment.filename, inputValue.timeLinks),
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
