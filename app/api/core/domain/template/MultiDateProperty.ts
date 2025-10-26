import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.MultiDate;
} & Omit<FilterablePropertyProps, 'type'>;

class MultiDateProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiDate }, context);
    this.compatibleTypes = ['date'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.MultiDate) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateProperty');
    }
  }

  createPropertyAssignment(value: DateEntry[]): PropertyAssignment<DateEntry> {
    const cleaned = (value || []).filter(v => v?.value);

    if (this.required && cleaned.length === 0) {
      throw new Error('Multi Date Property is required');
    }

    return {
      name: this.name,
      value: cleaned,
      type: this.type,
    };
  }
}

export { MultiDateProperty };
export type { Props as MultiDatePropertyProps };
