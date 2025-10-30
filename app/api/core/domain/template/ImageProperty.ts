import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PropertyAssignment, ImageEntry } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Image;
} & Omit<AbstractImagePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().trim().min(1, 'Image Property must be a non-empty string.'),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Image Property is required')
    .max(1, 'Image Property only accepts a single value.');

class ImageProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Image }, context);
    this.fullWidth = props.fullWidth || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Image) {
      throw new PropertyTypeInvalidTypeError(this.type, 'ImageProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<ImageEntry>): PropertyAssignment<ImageEntry> {
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<ImageEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { ImageProperty };
export type { Props as ImagePropertyProps };
