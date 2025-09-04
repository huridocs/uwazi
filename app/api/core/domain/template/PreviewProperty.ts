import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<AbstractImagePropertyProps, 'type'>;

class PreviewProperty extends AbstractImageProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'preview' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'preview') {
      throw new PropertyTypeInvalidTypeError(this.type, 'PreviewProperty');
    }
  }
}

export { PreviewProperty };
export type { Props as PreviewPropertyProps };
