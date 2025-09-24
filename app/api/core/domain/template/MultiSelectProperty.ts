// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context } from 'api/templates.v2/model/Property.js';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty';

type Props = {
  type?: 'multiselect';
} & Omit<AbstractSelectPropertyProps, 'type'>;

class MultiSelectProperty extends AbstractSelectProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'multiselect' }, context);

    this.validateMultiSelectProperty();
  }

  protected validateMultiSelectProperty() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'MultiSelec... Remove this comment to see the full error message
    if (this.type !== 'multiselect') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'MultiSelec... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiSelectProperty');
    }
  }
}

export { MultiSelectProperty };
export type { Props as MultiSelectPropertyProps };
