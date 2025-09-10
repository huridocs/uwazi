import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class GenerateIdProperty extends FilterableProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'generatedid' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'generatedid') {
      throw new PropertyTypeInvalidTypeError(this.type, 'GenerateIdProperty');
    }
  }
}

export { GenerateIdProperty };
export type { Props as GenerateIdPropertyProps };
