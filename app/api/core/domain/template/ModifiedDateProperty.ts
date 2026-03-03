import { CommonProperty, CommonPropertyProps } from '#api/core/domain/template/CommonProperty.js';
import { Context } from '#api/core/domain/template/Property.js';
import {
  ModifiedDatePropertyInvalidNameError,
  ModifiedDatePropertyInvalidTypeError,
} from './errors.js';
import { PropertyType } from './PropertyType.js';

type Props = { prioritySorting?: boolean; type?: PropertyType } & Omit<CommonPropertyProps, 'type'>;

class ModifiedDateProperty extends CommonProperty {
  prioritySorting: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'date', name: props.name || 'editDate' }, context);
    this.prioritySorting = props.prioritySorting || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'date') {
      throw new ModifiedDatePropertyInvalidTypeError(this.type);
    }

    if (this.name !== 'editDate') {
      throw new ModifiedDatePropertyInvalidNameError(this.name);
    }
  }
}

export { ModifiedDateProperty };
