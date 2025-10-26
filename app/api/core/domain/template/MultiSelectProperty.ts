import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PropertyAssignment, SelectionEntry } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.MultiSelect;
} & Omit<AbstractSelectPropertyProps, 'type'>;

class MultiSelectProperty extends AbstractSelectProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiSelect }, context);
    this.compatibleTypes = [PropertyTypeEnum.Select];

    this.validateMultiSelectProperty();
  }

  protected validateMultiSelectProperty() {
    if (this.type !== PropertyTypeEnum.MultiSelect) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiSelectProperty');
    }
  }

  createPropertyAssignment(value: SelectionEntry[]): PropertyAssignment<SelectionEntry> {
    if (this.required) {
      if (!value?.length) {
        throw new Error('MultiSelect Property is required');
      }
    }

    return {
      name: this.name,
      value,
      type: this.type,
    };
  }
}

export { MultiSelectProperty };
export type { Props as MultiSelectPropertyProps };
