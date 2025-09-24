// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Property, PropertyTypes, PropertyProps, Context } from 'api/templates.v2/model/Property.js';
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
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'LinkProper... Remove this comment to see the full error message
    if (this.type !== 'link') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'LinkProper... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'LinkProperty');
    }
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
