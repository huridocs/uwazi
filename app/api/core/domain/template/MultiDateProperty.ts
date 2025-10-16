import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.MultiDate;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiDate }, context);
    this.compatibleTypes = ['date'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.MultiDate) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateProperty');
    }
  }
}

export { MultiDateProperty };
export type { Props as MultiDatePropertyProps };
