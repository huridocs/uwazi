import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class NumericProperty extends FilterableProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'numeric' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'numeric') {
      throw new PropertyTypeInvalidTypeError(this.type, 'NumericProperty');
    }
  }
}

export { NumericProperty };
export type { Props as NumericPropertyProps };
