import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class DateRangeProperty extends FilterableProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'daterange' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'daterange') {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateRangeProperty');
    }
  }
}

export { DateRangeProperty };
export type { Props as DateRangePropertyProps };
