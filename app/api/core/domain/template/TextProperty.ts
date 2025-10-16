import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Text;
  generatedId?: boolean;
} & Omit<FilterablePropertyProps, 'type'>;

class TextProperty extends FilterableProperty {
  generatedId: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Text }, context);
    this.generatedId = props.generatedId || false;
    this.compatibleTypes = ['markdown'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Text) {
      throw new PropertyTypeInvalidTypeError(this.type, 'TextProperty');
    }
  }
}

export { TextProperty };
export type { Props as TextPropertyProps };
