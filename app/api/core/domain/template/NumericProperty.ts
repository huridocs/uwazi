import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors.js';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty.js';
import { PropertyTypeEnum } from './PropertyType.js';
import { NumericPropertyValue, PropertyAssignment } from './PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.Numeric;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.coerce.number({ required_error: 'Numeric Property value must be provided.' }),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Numeric Property is required')
    .max(1, 'Numeric Property only accepts a single value.');

class NumericProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Numeric }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Numeric) {
      throw new PropertyTypeInvalidTypeError(this.type, 'NumericProperty');
    }
  }

  get isTranslatable(): boolean {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<NumericPropertyValue>,
    shouldValidateForRequired = false
  ): PropertyAssignment {
    const parsedValue = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.toString()?.length)
    );

    return {
      name: this.name,
      value: parsedValue,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<NumericPropertyValue>): void {
    createSchema(this.required).parse(value);
  }
}

export { NumericProperty };
export type { Props as NumericPropertyProps };
