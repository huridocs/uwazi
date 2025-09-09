import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<AbstractImagePropertyProps, 'type'>;

class MediaProperty extends AbstractImageProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'media' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'media') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MediaProperty');
    }
  }
}

export { MediaProperty };
export type { Props as MediaPropertyProps };
