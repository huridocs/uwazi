import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class DateProperty extends FilterableProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'date' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'date') {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateProperty');
    }
  }
}

export { DateProperty };
export type { Props as DatePropertyProps };
