import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { AbstractImageProperty, AbstractImagePropertyProps } from './AbstractImageProperty';
import { PropertyTypeEnum } from './PropertyType';

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
}

export { MediaProperty };
export type { Props as MediaPropertyProps };
