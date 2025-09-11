import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateProperty extends FilterableProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'multidate' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'multidate') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateProperty');
    }
  }
}

export { MultiDateProperty };
export type { Props as MultiDatePropertyProps };
