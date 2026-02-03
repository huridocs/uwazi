import { CommonProperty, CommonPropertyProps } from './CommonProperty.js';
import { Context } from './Property.js';
import date from '#api/utils/date.js';
import {
  CreationDatePropertyInvalidNameError,
  CreationDatePropertyInvalidTypeError,
} from './errors.js';
import { PropertyType } from './PropertyType.js';
import { PropertyAssignment } from './PropertyValue.js';

type Props = { prioritySorting?: boolean; type?: PropertyType } & Omit<CommonPropertyProps, 'type'>;

class CreationDateProperty extends CommonProperty {
  prioritySorting: boolean;

  private readonly defaultCreationDate: number;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'date', name: props.name || 'creationDate' }, context);
    this.prioritySorting = props.prioritySorting || false;

    this.defaultCreationDate = date.currentUTC();

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

  createDefaultValue(): PropertyAssignment {
    return {
      name: this.name,
      value: [{ value: this.defaultCreationDate }],
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }
}

export { CreationDateProperty };
