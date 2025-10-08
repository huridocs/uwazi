import { Context } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty';

type Props = {
  type?: 'multiselect';
} & Omit<AbstractSelectPropertyProps, 'type'>;

class MultiSelectProperty extends AbstractSelectProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'multiselect' }, context);
    this.compatibleTypes = ['select'];

    this.validateMultiSelectProperty();
  }

  protected validateMultiSelectProperty() {
    if (this.type !== 'multiselect') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiSelectProperty');
    }
  }
}

export { MultiSelectProperty };
export type { Props as MultiSelectPropertyProps };
