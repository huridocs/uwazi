import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<AbstractImagePropertyProps, 'type'>;

class ImageProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'image' }, context);
    this.fullWidth = props.fullWidth || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'image') {
      throw new PropertyTypeInvalidTypeError(this.type, 'ImageProperty');
    }
  }
}

export { ImageProperty };
export type { Props as ImagePropertyProps };
