import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

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
}

export { DateRangeProperty };
export type { Props as DateRangePropertyProps };
