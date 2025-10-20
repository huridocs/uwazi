import { Property, PropertyProps, Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Link;
} & Omit<PropertyProps, 'type'>;

class LinkProperty extends Property {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Link }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Link) {
      throw new PropertyTypeInvalidTypeError(this.type, 'LinkProperty');
    }
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
