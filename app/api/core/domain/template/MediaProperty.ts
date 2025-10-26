import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';
import { MediaEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Media;
} & Omit<AbstractImagePropertyProps, 'type'>;

class MediaProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Media }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Media) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MediaProperty');
    }
  }

  createPropertyAssignment(value: MediaEntry[]): PropertyAssignment<MediaEntry> {
    if (value.length > 1) {
      throw new Error(
        `Media Property only accepts a single value. ${JSON.stringify(value)} given.`
      );
    }

    const isValid = !!value?.[0]?.value;

    if (this.required && !isValid) {
      throw new Error('Media Property is required');
    }

    return {
      name: this.name,
      value: isValid ? [{ value: value[0].value }] : [],
      type: this.type,
    };
  }
}

export { MediaProperty };
export type { Props as MediaPropertyProps };
