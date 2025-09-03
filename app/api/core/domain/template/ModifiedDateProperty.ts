import { CommonProperty, CommonPropertyProps } from 'api/templates.v2/model/CommonProperty';
import { PropertyTypes } from 'api/templates.v2/model/Property';
import {
  ModifiedDatePropertyInvalidNameError,
  ModifiedDatePropertyInvalidTypeError,
} from './errors';

type Props = { prioritySorting?: boolean; type?: PropertyTypes } & Omit<
  CommonPropertyProps,
  'type'
>;

class ModifiedDateProperty extends CommonProperty {
  prioritySorting: boolean;

  constructor(props: Props) {
    super({ ...props, type: props.type || 'date', name: props.name || 'editDate' });
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
