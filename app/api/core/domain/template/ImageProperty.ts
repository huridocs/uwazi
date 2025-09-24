// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, PropertyTypes } from 'api/templates.v2/model/Property.js';
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
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'ImagePrope... Remove this comment to see the full error message
    if (this.type !== 'image') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'ImagePrope... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'ImageProperty');
    }
  }
}

export { ImageProperty };
export type { Props as ImagePropertyProps };
