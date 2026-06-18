import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors.js';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty.js';
import { PropertyTypeEnum } from './PropertyType.js';
import { MediaEntry, PropertyAssignment } from './PropertyValue.js';

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
  private FILE_PATH = '/api/files/';

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Media }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Media) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MediaProperty');
    }
  }

  get isTranslatable(): boolean {
    return true;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<MediaEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<MediaEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.length)
    );

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  assignFilePath(filename: string, timeLinks?: string) {
    const path = `${this.FILE_PATH}${filename}`;

    return timeLinks?.length ? `(${path}, ${timeLinks})` : path;
  }

  validatePropertyAssignment({ value }: PropertyAssignment<MediaEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { MediaProperty };
export type { Props as MediaPropertyProps };
