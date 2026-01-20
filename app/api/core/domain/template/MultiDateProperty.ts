import { z } from 'zod';
import { Context, PropertyTypes, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { FilterableProperty, FilterablePropertyProps } from '#api/core/domain/template/FilterableProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { DateEntry, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.MultiDate;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.number({ required_error: 'Multi Date Property value is required' }),
});

const createSchema = (isRequired: boolean) =>
  z.array(EntrySchema).min(isRequired ? 1 : 0, 'Multi Date Property is required');

class MultiDateProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiDate }, context);
    this.compatibleTypes = ['date'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.MultiDate) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateProperty');
    }
  }

  get isTranslatable(): boolean {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<DateEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<DateEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.toString()?.length)
    );

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<DateEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { MultiDateProperty };
export type { Props as MultiDatePropertyProps };
