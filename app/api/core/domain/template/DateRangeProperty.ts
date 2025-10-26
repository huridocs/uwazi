import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateRangeEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.DateRange;
} & Omit<FilterablePropertyProps, 'type'>;

class DateRangeProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.DateRange }, context);
    this.compatibleTypes = [PropertyTypeEnum.MultiDateRange];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.DateRange) {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateRangeProperty');
    }
  }

  createPropertyAssignment(value: DateRangeEntry[]): PropertyAssignment<DateRangeEntry> {
    if (value.length > 1) {
      throw new Error(`Date Property only accepts a single value. ${JSON.stringify(value)} given.`);
    }

    const isValid = value?.[0]?.value?.from !== undefined && value?.[0]?.value?.to !== undefined;

    if (this.required && !isValid) {
      throw new Error('Date Range Property is required');
    }

    return {
      name: this.name,
      value: isValid
        ? [{ value: { from: Number(value[0].value.from), to: Number(value[0].value.to) } }]
        : [],
      type: this.type,
    };
  }
}

export { DateRangeProperty };
export type { Props as DateRangePropertyProps };
