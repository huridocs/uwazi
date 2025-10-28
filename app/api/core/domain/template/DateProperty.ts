import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Date;
} & Omit<FilterablePropertyProps, 'type'>;

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

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<DateEntry>): PropertyAssignment<DateEntry> {
    if (value.length > 1) {
      throw new Error(`Date Property only accepts a single value. ${JSON.stringify(value)} given.`);
    }

    const isValid = value?.[0]?.value !== undefined && value?.[0]?.value !== null;

    if (this.required && !isValid) {
      throw new Error('Date Property is required');
    }

    return {
      name: this.name,
      value: isValid ? [{ value: Number(value[0].value) }] : [],
      type: this.type,
    };
  }
}

export { DateProperty };
export type { Props as DatePropertyProps };
