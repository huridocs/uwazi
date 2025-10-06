import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateRangeProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'multidaterange' }, context);
    this.compatibleTypes = ['daterange'];

    this.validate();
  }

  protected validate() {
    if (this.type !== 'multidaterange') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateRangeProperty');
    }
  }
}

export { MultiDateRangeProperty };
export type { Props as MultiDateRangePropertyProps };
