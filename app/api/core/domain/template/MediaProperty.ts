import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';
import { MediaEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Media;
} & Omit<AbstractImagePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().trim().min(1, 'Media Property value must be a non-empty string.'),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Media Property is required')
    .max(1, 'Media Property only accepts a single value.');

class MediaProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Media }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Media) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MediaProperty');
    }
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<MediaEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<MediaEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<MediaEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { MediaProperty };
export type { Props as MediaPropertyProps };
