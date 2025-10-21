import { Context, Property, PropertyProps } from 'api/core/domain/template/Property';
import { PropertyName } from './PropertyName';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Geolocation;
} & Omit<PropertyProps, 'type'>;

class GeolocationProperty extends Property {
  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${PropertyTypeEnum.Geolocation}`, context).value;

    super({ ...props, type: props.type || PropertyTypeEnum.Geolocation, name }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Geolocation) {
      throw new PropertyTypeInvalidTypeError(this.type, 'GeolocationProperty');
    }
  }
}

export { GeolocationProperty };
export type { Props as GeolocationPropertyProps };
