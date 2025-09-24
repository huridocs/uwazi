// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, PropertyTypes } from 'api/templates.v2/model/Property.js';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class GenerateIdProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'generatedid' }, context);

    this.validate();
  }

  protected validate() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'GenerateId... Remove this comment to see the full error message
    if (this.type !== 'generatedid') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'GenerateId... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'GenerateIdProperty');
    }
  }
}

export { GenerateIdProperty };
export type { Props as GenerateIdPropertyProps };
