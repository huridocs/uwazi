import { z } from 'zod';
import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import {
  FilterableProperty,
  FilterablePropertyProps,
} from '#api/core/domain/template/FilterableProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { DateEntry, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.Date;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.number({ required_error: 'Date Property value must be provided.' }),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Date Property is required')
    .max(1, 'Date Property only accepts a single value.');

class DateProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Date }, context);
    this.compatibleTypes = [PropertyTypeEnum.MultiDate];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Date) {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateProperty');
    }
  }

  get isTranslatable() {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<DateEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<DateEntry> {
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
    { value }: PropertyAssignment<DateEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { DateProperty };
export type { Props as DatePropertyProps };
