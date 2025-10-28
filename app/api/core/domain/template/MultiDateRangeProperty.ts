import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateRangeEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.MultiDateRange;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateRangeProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiDateRange }, context);
    this.compatibleTypes = [PropertyTypeEnum.DateRange];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.MultiDateRange) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateRangeProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<DateRangeEntry>): PropertyAssignment<DateRangeEntry> {
    const isValid =
      value.length > 0 && value.every(v => v.value.from !== undefined && v.value.to !== undefined);

    if (this.required && !isValid) {
      throw new Error('Multi Date Range Property is required');
    }

    return {
      name: this.name,
      value,
      type: this.type,
    };
  }
}

export { MultiDateRangeProperty };
export type { Props as MultiDateRangePropertyProps };
