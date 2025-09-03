import { Property, PropertyProps } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';

class GeolocationProperty extends Property {
  constructor(props: PropertyProps) {
    super(props);

    const name = props.name
      ? new PropertyName(props.name)
      : PropertyName.fromLabel(`${props.label}_${propertyTypes.geolocation}`);

    this.name = name;
  }
}

export { GeolocationProperty };
