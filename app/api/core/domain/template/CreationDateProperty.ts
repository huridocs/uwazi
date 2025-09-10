import { CommonProperty, CommonPropertyProps } from 'api/templates.v2/model/CommonProperty';
import { PropertyTypes } from 'api/templates.v2/model/Property';
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

  constructor(props: Props) {
    super({ ...props, type: props.type || 'date', name: props.name || 'creationDate' });
    this.prioritySorting = props.prioritySorting || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'date') {
      throw new CreationDatePropertyInvalidTypeError(this.type);
    }

    if (this.name !== 'creationDate') {
      throw new CreationDatePropertyInvalidNameError(this.name);
    }
  }
}

export { CreationDateProperty };
