import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { PropertyName } from './PropertyName';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';
import { NestedEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Nested;
  nestedProperties?: string[];
} & Omit<FilterablePropertyProps, 'type'>;

class NestedProperty extends FilterableProperty {
  nestedProperties: string[];

  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${PropertyTypeEnum.Nested}`, context).value;

    super({ ...props, name, type: props.type || PropertyTypeEnum.Nested }, context);

    this.nestedProperties = props.nestedProperties || [];
  }

  protected validateNestedProperty() {
    if (this.type !== PropertyTypeEnum.Nested) {
      throw new PropertyTypeInvalidTypeError(this.type, 'NestedProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<NestedEntry>): PropertyAssignment<NestedEntry> {
    const cleaned = (value || []).filter(v => v?.value);

    if (this.required && cleaned.length === 0) {
      throw new Error('Nested Property is required');
    }

    return {
      name: this.name,
      value: cleaned,
      type: this.type,
    };
  }
}

export { NestedProperty };
export type { Props as NestedPropertyProps };
