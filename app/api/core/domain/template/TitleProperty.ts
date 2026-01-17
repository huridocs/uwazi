import { CommonProperty, CommonPropertyProps } from '#api/templates.v2/model/CommonProperty.js';

import { Context, PropertyTypes } from '#api/core/domain/template/Property.js';
import { TitlePropertyInvalidNameError, PropertyTypeInvalidTypeError } from './errors';
import { PropertyType } from './PropertyType';

type Props = { prioritySorting?: boolean; generatedId?: boolean; type?: PropertyType } & Omit<
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
    if (this.type !== 'text') {
      throw new PropertyTypeInvalidTypeError(this.type, 'TitleProperty');
    }

    if (this.name !== 'title') {
      throw new TitlePropertyInvalidNameError(this.name);
    }
  }

  get isTranslatable(): boolean {
    return true;
  }
}

export { TitleProperty };
export type { Props as TitlePropertyProps };
