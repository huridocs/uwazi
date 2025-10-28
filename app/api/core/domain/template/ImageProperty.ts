import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PropertyAssignment, ImageEntry } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Image;
} & Omit<AbstractImagePropertyProps, 'type'>;

class ImageProperty extends AbstractImageProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Image }, context);
    this.fullWidth = props.fullWidth || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Image) {
      throw new PropertyTypeInvalidTypeError(this.type, 'ImageProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<ImageEntry>): PropertyAssignment<ImageEntry> {
    if (value.length > 1) {
      throw new Error(
        `Image Property only accepts a single value. ${JSON.stringify(value)} given.`
      );
    }

    const isValid = !!value?.[0]?.value;

    if (this.required && !isValid) {
      throw new Error('Image Property is required');
    }

    return {
      name: this.name,
      value: isValid ? [{ value: value[0].value }] : [],
      type: this.type,
    };
  }
}

export { ImageProperty };
export type { Props as ImagePropertyProps };
