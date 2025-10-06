import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateRangeProperty extends FilterableProperty {
  private static COMPATIBLE_TYPES: PropertyTypes[] = ['multidaterange', 'daterange'];

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'multidaterange' }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'multidaterange') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateRangeProperty');
    }
  }

  protected isTypeEqual(type: PropertyTypes): boolean {
    return MultiDateRangeProperty.COMPATIBLE_TYPES.includes(type);
  }
}

export { MultiDateRangeProperty };
export type { Props as MultiDateRangePropertyProps };
