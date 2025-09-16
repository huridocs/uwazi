import { Context, Property, PropertyProps, PropertyTypes } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';
import { PropertyTypeInvalidTypeError } from './errors';

type Props = {
  type?: PropertyTypes;
} & Omit<PropertyProps, 'type'>;

class GeolocationProperty extends Property {
  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${propertyTypes.geolocation}`, context).value;

    super({ ...props, type: props.type || 'geolocation', name }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'geolocation') {
      throw new PropertyTypeInvalidTypeError(this.type, 'GeolocationProperty');
    }
  }
}

export { GeolocationProperty };
export type { Props as GeolocationPropertyProps };
