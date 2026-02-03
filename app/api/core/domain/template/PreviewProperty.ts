import { Context } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from './errors.js';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty.js';
import { PropertyTypeEnum } from './PropertyType.js';
import { PreviewEntry, PropertyAssignment } from './PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.Preview;
} & Omit<AbstractImagePropertyProps, 'type'>;

class PreviewProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Preview }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Preview) {
      throw new PropertyTypeInvalidTypeError(this.type, 'PreviewProperty');
    }
  }

  get isTranslatable(): boolean {
    return true;
  }

  createPropertyAssignment(): PropertyAssignment<PreviewEntry> {
    return {
      name: this.name,
      value: [],
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }
}

export { PreviewProperty };
export type { Props as PreviewPropertyProps };
