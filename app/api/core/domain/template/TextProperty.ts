import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
  generatedId?: boolean;
} & Omit<FilterablePropertyProps, 'type'>;

class TextProperty extends FilterableProperty {
  generatedId: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'text' }, context);

    this.generatedId = props.generatedId || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'text') {
      throw new PropertyTypeInvalidTypeError(this.type, 'TextProperty');
    }
  }
}

export { TextProperty };
export type { Props as TextPropertyProps };
