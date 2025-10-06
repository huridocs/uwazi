import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class DateProperty extends FilterableProperty {
  private static COMPATIBLE_TYPES: PropertyTypes[] = ['date', 'multidate'];

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'date' }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'date') {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateProperty');
    }
  }

  protected isTypeEqual(type: PropertyTypes): boolean {
    return DateProperty.COMPATIBLE_TYPES.includes(type);
  }
}

export { DateProperty };
export type { Props as DatePropertyProps };
