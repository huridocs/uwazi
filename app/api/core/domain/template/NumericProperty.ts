import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { NumericPropertyValue, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Numeric;
} & Omit<FilterablePropertyProps, 'type'>;

class NumericProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Numeric }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Numeric) {
      throw new PropertyTypeInvalidTypeError(this.type, 'NumericProperty');
    }
  }

  createPropertyAssignment(value: NumericPropertyValue[]): PropertyAssignment {
    if (value.length > 1) {
      throw new Error(
        `Numeric Property only accepts a single value. ${JSON.stringify(value)} given.`
      );
    }

    if (this.required) {
      if (value?.[0]?.value === undefined || value?.[0]?.value === null) {
        throw new Error('Numeric Property is required');
      }
    }

    const hasValue = value[0] && (value[0].value === 0 || value[0].value);

    return {
      name: this.name,
      value: hasValue ? [{ value: Number(value[0]!.value) }] : [],
      type: this.type,
    };
  }
}

export { NumericProperty };
export type { Props as NumericPropertyProps };
