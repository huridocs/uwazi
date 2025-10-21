import { Context } from 'api/core/domain/template/Property';
import { PropertyName } from './PropertyName';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Nested;
  nestedProperties?: string[];
} & Omit<FilterablePropertyProps, 'type'>;

class NestedProperty extends FilterableProperty {
  nestedProperties: string[];

  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${PropertyTypeEnum.Nested}`, context).value;

    super({ ...props, name, type: props.type || PropertyTypeEnum.Nested }, context);

    this.nestedProperties = props.nestedProperties || [];
  }

  protected validateNestedProperty() {
    if (this.type !== PropertyTypeEnum.Nested) {
      throw new PropertyTypeInvalidTypeError(this.type, 'NestedProperty');
    }
  }
}

export { NestedProperty };
export type { Props as NestedPropertyProps };
