import { Property, PropertyTypes, PropertyProps } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';

type Props = {
  type?: PropertyTypes;
} & Omit<PropertyProps, 'type'>;

class LinkProperty extends Property {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'link' });

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
