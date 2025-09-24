// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context } from 'api/templates.v2/model/Property.js';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty';

type Props = {
  type?: 'select';
} & Omit<AbstractSelectPropertyProps, 'type'>;

class SelectProperty extends AbstractSelectProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'select' }, context);

    this.validateSelectProperty();
  }

  private validateSelectProperty() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'SelectProp... Remove this comment to see the full error message
    if (this.type !== 'select') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'SelectProp... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'SelectProperty');
    }
  }
}

export { SelectProperty };
export type { Props as SelectPropertyProps };
