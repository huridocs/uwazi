import { Context } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeInvalidTypeError } from './errors';

type Props = {
  type?: 'nested';
} & Omit<FilterablePropertyProps, 'type'>;

class NestedProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    const name =
      props.name || PropertyName.fromLabel(`${props.label}_${propertyTypes.nested}`, context).value;

    super({ ...props, name, type: props.type || 'nested' }, context);
  }

  protected validateNestedProperty() {
    if (this.type !== 'nested') {
      throw new PropertyTypeInvalidTypeError(this.type, 'NestedProperty');
    }
  }
}

export { NestedProperty };
export type { Props as NestedPropertyProps };
