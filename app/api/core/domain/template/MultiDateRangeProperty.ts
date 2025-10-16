import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

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
}

export { MultiDateRangeProperty };
export type { Props as MultiDateRangePropertyProps };
