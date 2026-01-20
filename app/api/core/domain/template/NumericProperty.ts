import { z } from 'zod';
import { Context, PropertyTypes, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { FilterableProperty, FilterablePropertyProps } from '#api/core/domain/template/FilterableProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { NumericPropertyValue, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

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

  validatePropertyAssignment(
    { value }: PropertyAssignment<NumericPropertyValue>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { NumericProperty };
export type { Props as NumericPropertyProps };
