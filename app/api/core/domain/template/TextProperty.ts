// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, PropertyTypes } from 'api/templates.v2/model/Property.js';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
  generatedId?: boolean;
} & Omit<FilterablePropertyProps, 'type'>;

class TextProperty extends FilterableProperty {
  generatedId: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'text' }, context);

    this.generatedId = props.generatedId || false;

    this.validate();
  }

  protected validate() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'TextProper... Remove this comment to see the full error message
    if (this.type !== 'text') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'TextProper... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'TextProperty');
    }
  }
}

export { TextProperty };
export type { Props as TextPropertyProps };
