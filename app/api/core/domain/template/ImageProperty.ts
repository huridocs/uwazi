import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';

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
}

export { ImageProperty };
export type { Props as ImagePropertyProps };
