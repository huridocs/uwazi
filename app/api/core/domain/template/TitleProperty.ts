// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/CommonPr... Remove this comment to see the full error message
import { CommonProperty, CommonPropertyProps } from 'api/templates.v2/model/CommonProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, PropertyTypes } from 'api/templates.v2/model/Property.js';
import { TitlePropertyInvalidNameError, PropertyTypeInvalidTypeError } from './errors';

type Props = { prioritySorting?: boolean; generatedId?: boolean; type?: PropertyTypes } & Omit<
  CommonPropertyProps,
  'type'
>;

class TitleProperty extends CommonProperty {
  prioritySorting: boolean;

  generatedId: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'text', name: props.name || 'title' }, context);
    this.prioritySorting = props.prioritySorting || false;
    this.generatedId = props.generatedId || false;

    this.validate();
  }

  protected validate() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'TitlePrope... Remove this comment to see the full error message
    if (this.type !== 'text') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'TitlePrope... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'TitleProperty');
    }

    // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TitlePrope... Remove this comment to see the full error message
    if (this.name !== 'title') {
      // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TitlePrope... Remove this comment to see the full error message
      throw new TitlePropertyInvalidNameError(this.name);
    }
  }
}

export { TitleProperty };
export type { Props as TitlePropertyProps };
