// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/CommonPr... Remove this comment to see the full error message
import { CommonProperty, CommonPropertyProps } from 'api/templates.v2/model/CommonProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, PropertyTypes } from 'api/templates.v2/model/Property.js';
import {
  CreationDatePropertyInvalidNameError,
  CreationDatePropertyInvalidTypeError,
} from './errors';

type Props = { prioritySorting?: boolean; type?: PropertyTypes } & Omit<
  CommonPropertyProps,
  'type'
>;

class CreationDateProperty extends CommonProperty {
  prioritySorting: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'date', name: props.name || 'creationDate' }, context);
    this.prioritySorting = props.prioritySorting || false;

    this.validate();
  }

  protected validate() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'CreationDa... Remove this comment to see the full error message
    if (this.type !== 'date') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'CreationDa... Remove this comment to see the full error message
      throw new CreationDatePropertyInvalidTypeError(this.type);
    }

    // @ts-expect-error TS(2339): Property 'name' does not exist on type 'CreationDa... Remove this comment to see the full error message
    if (this.name !== 'creationDate') {
      // @ts-expect-error TS(2339): Property 'name' does not exist on type 'CreationDa... Remove this comment to see the full error message
      throw new CreationDatePropertyInvalidNameError(this.name);
    }
  }
}

export { CreationDateProperty };
