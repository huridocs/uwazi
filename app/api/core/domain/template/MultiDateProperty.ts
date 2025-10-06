import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateProperty extends FilterableProperty {
  protected static COMPATIBLE_TYPES: PropertyTypes[] = ['multidate', 'date'];

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'multidate' }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'multidate') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateProperty');
    }
  }

  protected isTypeEqual(type: PropertyTypes): boolean {
    return MultiDateProperty.COMPATIBLE_TYPES.includes(type);
  }
}

export { MultiDateProperty };
export type { Props as MultiDatePropertyProps };
