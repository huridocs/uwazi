import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class DateRangeProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'daterange' }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'daterange') {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateRangeProperty');
    }
  }

  protected isTypeEqual(type: PropertyTypes): boolean {
    const compatibleTypes: PropertyTypes[] = ['daterange', 'multidaterange'];

    return compatibleTypes.includes(type);
  }
}

export { DateRangeProperty };
export type { Props as DateRangePropertyProps };
