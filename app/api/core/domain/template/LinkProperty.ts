import { Property, PropertyTypes, PropertyProps, Context } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';

type Props = {
  type?: PropertyTypes;
} & Omit<PropertyProps, 'type'>;

class LinkProperty extends Property {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'link' }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'link') {
      throw new PropertyTypeInvalidTypeError(this.type, 'LinkProperty');
    }
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
