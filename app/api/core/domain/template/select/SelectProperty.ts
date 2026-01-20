import { Context } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '../errors.js';
import { AbstractSelectProperty, AbstractSelectPropertyProps } from '#api/core/domain/template/select/AbstractSelectProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';

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
}

export { SelectProperty };
export type { Props as SelectPropertyProps };
