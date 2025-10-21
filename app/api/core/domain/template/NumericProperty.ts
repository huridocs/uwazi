import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Numeric;
} & Omit<FilterablePropertyProps, 'type'>;

class NumericProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Numeric }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Numeric) {
      throw new PropertyTypeInvalidTypeError(this.type, 'NumericProperty');
    }
  }
}

export { NumericProperty };
export type { Props as NumericPropertyProps };
