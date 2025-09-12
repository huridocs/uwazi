import { Context } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty';

type Props = {
  type?: 'select';
} & Omit<AbstractSelectPropertyProps, 'type'>;

class SelectProperty extends AbstractSelectProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'select' }, context);

    this.validateSelectProperty();
  }

  private validateSelectProperty() {
    if (this.type !== 'select') {
      throw new PropertyTypeInvalidTypeError(this.type, 'SelectProperty');
    }
  }
}

export { SelectProperty };
export type { Props as SelectPropertyProps };
