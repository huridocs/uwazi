import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.GeneratedId;
} & Omit<FilterablePropertyProps, 'type'>;

class GenerateIdProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.GeneratedId }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.GeneratedId) {
      throw new PropertyTypeInvalidTypeError(this.type, 'GenerateIdProperty');
    }
  }
}

export { GenerateIdProperty };
export type { Props as GenerateIdPropertyProps };
