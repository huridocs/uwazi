import { PropertyTypeInvalidTypeError } from '../errors.js';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from './AbstractSelectProperty.js';
import { PropertyTypeEnum } from '../PropertyType.js';

type Props = {
  type?: PropertyTypeEnum.MultiSelect;
} & Omit<AbstractSelectPropertyProps, 'type'>;

class MultiSelectProperty extends AbstractSelectProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiSelect });
    this.compatibleTypes = [PropertyTypeEnum.Select];

    this.validateMultiSelectProperty();
  }

  protected validateMultiSelectProperty() {
    if (this.type !== PropertyTypeEnum.MultiSelect) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiSelectProperty');
    }
  }
}

export { MultiSelectProperty };
export type { Props as MultiSelectPropertyProps };
