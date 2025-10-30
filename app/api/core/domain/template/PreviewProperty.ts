import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PreviewEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Preview;
} & Omit<AbstractImagePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().min(1, 'Preview Property value must be a non-empty string.'),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Preview Property is required')
    .max(1, 'Preview Property only accepts a single value.');

class PreviewProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Preview }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Preview) {
      throw new PropertyTypeInvalidTypeError(this.type, 'PreviewProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<PreviewEntry>): PropertyAssignment<PreviewEntry> {
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<PreviewEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { PreviewProperty };
export type { Props as PreviewPropertyProps };
