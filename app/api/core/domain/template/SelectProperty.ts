import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PropertyAssignment, SelectionEntry } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Select;
} & Omit<AbstractSelectPropertyProps, 'type'>;

class SelectProperty extends AbstractSelectProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Select }, context);
    this.compatibleTypes = [PropertyTypeEnum.MultiSelect];

    this.validateSelectProperty();
  }

  private validateSelectProperty() {
    if (this.type !== PropertyTypeEnum.Select) {
      throw new PropertyTypeInvalidTypeError(this.type, 'SelectProperty');
    }
  }

  createPropertyAssignment(value: SelectionEntry[]): PropertyAssignment<SelectionEntry> {
    if (value.length > 1) {
      throw new Error(
        `Select Property only accepts a single value. ${JSON.stringify(value)} given.`
      );
    }

    if (this.required) {
      if (!value?.[0]?.value) {
        throw new Error('Select Property is required');
      }
    }

    return {
      name: this.name,
      value: value.length ? value : [],
      type: this.type,
    };
  }
}

export { SelectProperty };
export type { Props as SelectPropertyProps };
