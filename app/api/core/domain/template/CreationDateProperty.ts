import { CommonProperty, CommonPropertyProps } from 'api/core/domain/template/CommonProperty';
import { Context } from 'api/core/domain/template/Property';
import date from 'api/utils/date';
import {
  CreationDatePropertyInvalidNameError,
  CreationDatePropertyInvalidTypeError,
} from './errors';
import { PropertyType } from './PropertyType';
import { PropertyAssignment } from './PropertyValue';

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
    };
  }
}

export { CreationDateProperty };
