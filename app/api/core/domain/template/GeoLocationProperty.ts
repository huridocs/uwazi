import { Property, PropertyProps, PropertyTypes } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';
import { PropertyTypeInvalidTypeError } from './errors';

type Props = {
  type?: PropertyTypes;
} & Omit<PropertyProps, 'type'>;

class GeolocationProperty extends Property {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'geolocation' });

    const name = props.name
      ? new PropertyName(props.name)
      : PropertyName.fromLabel(`${props.label}_${propertyTypes.geolocation}`);

    this.name = name;

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
