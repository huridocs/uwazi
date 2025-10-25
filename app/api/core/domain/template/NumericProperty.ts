import { Context } from 'api/core/domain/template/Property';
import { EntityMetadata } from 'api/entities.v2/model/Entity';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

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

  createPropertyValue(input: EntityMetadata[]) {
    if (input.length > 1) {
      throw new Error(
        `Numeric Property only accepts a single value. ${JSON.stringify(input)} given.`
      );
    }

    if (this.required) {
      if (input[0].value === undefined || input[0].value === null) {
        throw new Error('Numeric Property is required');
      }
    }

    return {
      name: this.name,
      value: input[0]?.value ? [{ value: Number(input[0].value) }] : [],
      type: this.type,
    };
  }
}

export { NumericProperty };
export type { Props as NumericPropertyProps };
