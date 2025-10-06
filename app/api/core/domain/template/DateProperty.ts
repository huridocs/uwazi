import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class DateProperty extends FilterableProperty {
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
    const compatibleTypes: PropertyTypes[] = ['date', 'multidate'];

    return compatibleTypes.includes(type);
  }
}

export { DateProperty };
export type { Props as DatePropertyProps };
