import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PreviewEntry, PropertyAssignment } from './PropertyValue';

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

  createPropertyAssignment(): PropertyAssignment<PreviewEntry> {
    return {
      name: this.name,
      value: [],
      type: this.type,
    };
  }
}

export { PreviewProperty };
export type { Props as PreviewPropertyProps };
