import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Date;
} & Omit<FilterablePropertyProps, 'type'>;

class DateProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Date }, context);
    this.compatibleTypes = [PropertyTypeEnum.MultiDate];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Date) {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateProperty');
    }
  }
}

export { DateProperty };
export type { Props as DatePropertyProps };
